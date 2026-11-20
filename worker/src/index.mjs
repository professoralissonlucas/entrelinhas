// Cloudflare Worker do Entrelinhas: API de correção usada pelo site no GitHub Pages.
//
// Rotas (mesmo comportamento do server.js):
// - POST /api/correct → avalia a redação (validações, prompts, schemas e erros vêm do núcleo compartilhado);
// - GET  /api/health  → { "status": "ok" };
// - OPTIONS          → resposta à pré-verificação de CORS (preflight).
//
// Configuração (ver worker/README.md):
// - secret GEMINI_API_KEY           → `npx wrangler secret put GEMINI_API_KEY` (nunca no código);
// - variável GEMINI_MODEL            → wrangler.toml (padrão gemini-3.5-flash);
// - variável ENTRELINHAS_TEST_MODE   → wrangler.toml ("false" em produção);
// - KV LIMITE_USO (opcional)         → guarda o limite de uso por IP de forma compartilhada entre servidores.

// O núcleo é CommonJS (também usado pelo server.js). Tanto o Node quanto o esbuild do wrangler
// entregam o module.exports como importação padrão.
import nucleo from "../../lib/nucleo-correcao.js";

const { avaliarRedacao, interpretarCorpoJson, tipoDeConteudoJson, validateInput, respostasComuns, cabecalhosJson, modeloPadrao, lerBooleano, maxRequestBytes } = nucleo;

// Somente estas origens podem chamar a API pelo navegador.
export const origensPermitidas = Object.freeze([
  "https://professoralissonlucas.github.io",
  "http://localhost:3000",
]);

// Limite de uso por IP, para proteger a cota do Gemini: 10 correções a cada 10 minutos.
export const limiteDeUso = Object.freeze({ maximo: 10, janelaMs: 10 * 60 * 1000 });

// ---------------------------------------------------------------------------
// Limitadores de uso (janela fixa)
// ---------------------------------------------------------------------------

function calcularJanela(agora, janelaMs) {
  const indice = Math.floor(agora / janelaMs);
  return { indice, fimMs: (indice + 1) * janelaMs };
}

// Guarda as contagens na memória do Worker. Funciona sem configuração extra, mas cada servidor da Cloudflare
// tem a sua memória (e ela pode ser reiniciada a qualquer momento), por isso a proteção é aproximada.
export class LimitadorEmMemoria {
  constructor() {
    this.registros = new Map();
  }

  async registrarUso(chave, agora, { maximo, janelaMs }) {
    const janela = calcularJanela(agora, janelaMs);
    const registro = this.registros.get(chave);
    const contagem = registro && registro.indice === janela.indice ? registro.contagem : 0;
    if (contagem >= maximo) return { permitido: false, esperaMs: janela.fimMs - agora };
    this.registros.set(chave, { indice: janela.indice, contagem: contagem + 1 });
    if (this.registros.size > 5_000) {
      for (const [outraChave, outro] of this.registros) if (outro.indice < janela.indice) this.registros.delete(outraChave);
    }
    return { permitido: true, restantes: maximo - contagem - 1 };
  }
}

// Guarda as contagens no Workers KV (binding LIMITE_USO): vale para todos os servidores da Cloudflare.
// O KV não tem incremento atômico; em rajadas simultâneas a contagem pode passar um pouco do limite.
export class LimitadorKv {
  constructor(kv) {
    this.kv = kv;
  }

  async registrarUso(chave, agora, { maximo, janelaMs }) {
    const janela = calcularJanela(agora, janelaMs);
    const chaveKv = `uso:${chave}:${janela.indice}`;
    const contagem = Number(await this.kv.get(chaveKv)) || 0;
    if (contagem >= maximo) return { permitido: false, esperaMs: janela.fimMs - agora };
    // O KV exige expiração de pelo menos 60 s.
    const expiracaoSegundos = Math.max(60, Math.ceil((janela.fimMs - agora) / 1000) + 60);
    await this.kv.put(chaveKv, String(contagem + 1), { expirationTtl: expiracaoSegundos });
    return { permitido: true, restantes: maximo - contagem - 1 };
  }
}

// ---------------------------------------------------------------------------
// CORS e respostas
// ---------------------------------------------------------------------------

function origemPermitida(origem) {
  return Boolean(origem) && origensPermitidas.includes(origem);
}

function cabecalhosCors(origem) {
  const cabecalhos = { Vary: "Origin" };
  if (origemPermitida(origem)) {
    cabecalhos["Access-Control-Allow-Origin"] = origem;
    cabecalhos["Access-Control-Expose-Headers"] = "Retry-After";
  }
  return cabecalhos;
}

function responderJson({ status, payload, cabecalhos = {} }, origem) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...cabecalhosJson, ...cabecalhosCors(origem), ...cabecalhos },
  });
}

function respostaOrigemNaoPermitida() {
  return {
    status: 403,
    payload: { error: { code: "CORS_NOT_ALLOWED", message: "Esta origem não tem permissão para usar a API do Entrelinhas." } },
  };
}

function respostaLimiteExcedido(esperaMs) {
  const minutos = Math.round(limiteDeUso.janelaMs / 60_000);
  const minutosRestantes = Math.max(1, Math.ceil(esperaMs / 60_000));
  return {
    status: 429,
    payload: {
      error: {
        code: "RATE_LIMITED",
        message: `Você atingiu o limite de ${limiteDeUso.maximo} correções a cada ${minutos} minutos. Aguarde cerca de ${minutosRestantes} minuto${minutosRestantes === 1 ? "" : "s"} e tente novamente.`,
      },
    },
    cabecalhos: { "Retry-After": String(Math.max(1, Math.ceil(esperaMs / 1000))) },
  };
}

function responderPreflight(request, origem) {
  if (!origemPermitida(origem)) return responderJson(respostaOrigemNaoPermitida(), origem);
  return new Response(null, {
    status: 204,
    headers: {
      ...cabecalhosCors(origem),
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}

// Lê o corpo em partes, parando assim que passar do limite.
async function lerTextoComLimite(request, limiteBytes) {
  const declarado = Number(request.headers.get("Content-Length"));
  if (Number.isFinite(declarado) && declarado > limiteBytes) return { excedeu: true };
  if (!request.body) return { texto: "" };
  const leitor = request.body.getReader();
  const partes = [];
  let total = 0;
  for (;;) {
    const { done, value } = await leitor.read();
    if (done) break;
    total += value.byteLength;
    if (total > limiteBytes) {
      await leitor.cancel();
      return { excedeu: true };
    }
    partes.push(value);
  }
  const bytes = new Uint8Array(total);
  let posicao = 0;
  for (const parte of partes) {
    bytes.set(parte, posicao);
    posicao += parte.byteLength;
  }
  return { texto: new TextDecoder().decode(bytes) };
}

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

// Cria o Worker. As opções existem para os testes (sem rede):
// - fetch: substitui o fetch usado nas chamadas ao Gemini;
// - relogio: função que devolve o horário atual em ms (para testar a janela do limite);
// - limitador: substitui o limitador em memória;
// - tempoLimite: substitui limites de tempo do núcleo.
export function criarWorker(opcoes = {}) {
  const limitadorEmMemoria = opcoes.limitador ?? new LimitadorEmMemoria();
  const relogio = opcoes.relogio ?? (() => Date.now());

  async function corrigir(request, env, origem) {
    const tipoConteudo = request.headers.get("Content-Type");
    if (!tipoDeConteudoJson(tipoConteudo)) return respostasComuns.tipoDeConteudoInvalido();

    let leitura;
    try {
      leitura = await lerTextoComLimite(request, maxRequestBytes);
    } catch {
      return respostasComuns.falhaNaLeitura();
    }
    if (leitura.excedeu) return respostasComuns.corpoGrandeDemais();

    const interpretacao = interpretarCorpoJson(tipoConteudo, leitura.texto);
    if (!interpretacao.ok) return interpretacao.resposta;

    // Pedidos inválidos não contam no limite; os válidos contam antes de chamar o Gemini.
    if (!validateInput(interpretacao.corpo)) {
      const ip = request.headers.get("CF-Connecting-IP") || "ip-desconhecido";
      let uso;
      try {
        const limitador = env.LIMITE_USO ? new LimitadorKv(env.LIMITE_USO) : limitadorEmMemoria;
        uso = await limitador.registrarUso(ip, relogio(), limiteDeUso);
      } catch (erro) {
        // Se o KV falhar (por exemplo, ao passar das 1.000 gravações/dia do plano gratuito), usa a memória.
        console.error(`[Limite] KV indisponível, usando o limite em memória: ${erro?.message ?? erro}`);
        uso = await limitadorEmMemoria.registrarUso(ip, relogio(), limiteDeUso);
      }
      if (!uso.permitido) return respostaLimiteExcedido(uso.esperaMs);
    }

    return avaliarRedacao(interpretacao.corpo, {
      apiKey: env.GEMINI_API_KEY || "",
      model: env.GEMINI_MODEL || modeloPadrao,
      testMode: lerBooleano(env.ENTRELINHAS_TEST_MODE),
      fetch: opcoes.fetch,
      tempoLimite: opcoes.tempoLimite,
      localDaConfiguracao: "no wrangler.toml do Worker",
    });
  }

  return {
    async fetch(request, env = {}) {
      const url = new URL(request.url);
      const origem = request.headers.get("Origin");
      const rotaDaApi = url.pathname === "/api/correct" || url.pathname === "/api/health";

      if (request.method === "OPTIONS" && rotaDaApi) return responderPreflight(request, origem);

      // Pedidos do navegador vindos de outros sites são recusados antes de gastar cota.
      // Pedidos sem Origin (por exemplo, curl ou monitoramento) continuam permitidos.
      if (origem && !origemPermitida(origem)) return responderJson(respostaOrigemNaoPermitida(), origem);

      if (url.pathname === "/api/health") {
        if (request.method !== "GET") return responderJson(respostasComuns.metodoNaoPermitido("GET"), origem);
        return responderJson(respostasComuns.saude(), origem);
      }

      if (url.pathname === "/api/correct") {
        if (request.method !== "POST") return responderJson(respostasComuns.metodoNaoPermitido("POST"), origem);
        return responderJson(await corrigir(request, env, origem), origem);
      }

      return responderJson(respostasComuns.naoEncontrado(), origem);
    },
  };
}

export default criarWorker();
