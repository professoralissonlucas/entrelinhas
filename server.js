const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
// Validações, prompts, schemas e chamadas ao Gemini ficam no núcleo compartilhado com o Cloudflare Worker.
const nucleo = require("./lib/nucleo-correcao.js");

function loadLocalEnv() {
  try {
    const envPath = path.join(__dirname, ".env");
    if (!fs.existsSync(envPath)) return;
    const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const separator = trimmed.indexOf("=");
      const name = trimmed.slice(0, separator).trim();
      let value = trimmed.slice(separator + 1).trim();
      if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (name && process.env[name] === undefined) process.env[name] = value;
    }
  } catch (error) {
    console.error("Não foi possível carregar as configurações locais.");
  }
}

loadLocalEnv();

const port = Number(process.env.PORT || 3000);
const root = __dirname;

// Configuração do modo local (lida do .env). Os testes podem trocá-la com setTestConfiguration.
let apiKey = process.env.GEMINI_API_KEY || "";
let model = process.env.GEMINI_MODEL || nucleo.modeloPadrao;
let testMode = nucleo.lerBooleano(process.env.ENTRELINHAS_TEST_MODE);
// Implementação de fetch usada nas chamadas ao Gemini; os testes podem substituí-la para simular o provedor sem rede.
let fetchGemini = (...argumentos) => globalThis.fetch(...argumentos);
let tempoLimite = { ...nucleo.tempoLimitePadrao };

function configuracaoAtual() {
  return { apiKey, model, testMode, fetch: fetchGemini, tempoLimite, localDaConfiguracao: "no arquivo .env" };
}

function sendJson(response, status, payload, cabecalhosExtras = {}) {
  response.writeHead(status, { ...nucleo.cabecalhosJson, ...cabecalhosExtras });
  response.end(JSON.stringify(payload));
}

function enviarResposta(response, { status, payload, cabecalhos }) {
  sendJson(response, status, payload, cabecalhos);
}

// Lê o corpo em partes e interrompe assim que passar do limite, sem guardar o excesso na memória.
// Devolve { ok: true, corpo } ou { ok: false, resposta }, no mesmo formato do núcleo.
function readJsonBody(request) {
  return new Promise((resolve) => {
    const tipoConteudo = request.headers["content-type"];
    if (!nucleo.tipoDeConteudoJson(tipoConteudo)) {
      request.resume();
      resolve({ ok: false, resposta: nucleo.respostasComuns.tipoDeConteudoInvalido() });
      return;
    }

    const chunks = [];
    let bytes = 0;
    let encerrado = false;
    const encerrar = (resultado) => {
      if (encerrado) return;
      encerrado = true;
      resolve(resultado);
    };

    request.on("data", (chunk) => {
      if (encerrado) return;
      bytes += chunk.length;
      if (bytes > nucleo.maxRequestBytes) {
        request.resume();
        encerrar({ ok: false, resposta: nucleo.respostasComuns.corpoGrandeDemais() });
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => encerrar(nucleo.interpretarCorpoJson(tipoConteudo, Buffer.concat(chunks).toString("utf8"))));
    request.on("error", () => encerrar({ ok: false, resposta: nucleo.respostasComuns.falhaNaLeitura() }));
  });
}

async function assessEssay(request, response) {
  const leitura = await readJsonBody(request);
  if (!leitura.ok) {
    enviarResposta(response, leitura.resposta);
    return;
  }
  enviarResposta(response, await nucleo.avaliarRedacao(leitura.corpo, configuracaoAtual()));
}

// Mesma política da <meta http-equiv="Content-Security-Policy"> do index.html (usada no GitHub Pages).
// Localmente o navegador aplica as duas juntas, por isso ambas permitem o Worker (*.workers.dev).
const politicaDeSeguranca = "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://*.workers.dev; object-src 'none'; base-uri 'self'; form-action 'self'";

const staticFiles = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/styles.css", ["styles.css", "text/css; charset=utf-8"]],
  ["/config.js", ["config.js", "text/javascript; charset=utf-8"]],
  ["/script.js", ["script.js", "text/javascript; charset=utf-8"]],
]);

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, "http://localhost");

  if (url.pathname === "/api/correct") {
    if (request.method !== "POST") {
      enviarResposta(response, nucleo.respostasComuns.metodoNaoPermitido("POST"));
      return;
    }
    await assessEssay(request, response);
    return;
  }

  if (url.pathname === "/api/health") {
    if (request.method !== "GET") {
      enviarResposta(response, nucleo.respostasComuns.metodoNaoPermitido("GET"));
      return;
    }
    enviarResposta(response, nucleo.respostasComuns.saude());
    return;
  }

  // O navegador pede /favicon.ico automaticamente. O projeto não tem ícone: responde 204 (sem conteúdo)
  // para não gerar erro 404 no console. A aba continua com o ícone padrão do navegador.
  if (url.pathname === "/favicon.ico" && request.method === "GET") {
    response.writeHead(204, { "Cache-Control": "public, max-age=86400", "X-Content-Type-Options": "nosniff" });
    response.end();
    return;
  }

  const file = staticFiles.get(url.pathname);
  if (request.method !== "GET" || !file) {
    enviarResposta(response, nucleo.respostasComuns.naoEncontrado());
    return;
  }

  const filePath = path.join(root, file[0]);
  fs.readFile(filePath, (error, contents) => {
    if (error) {
      sendJson(response, 500, { error: { code: "FILE_READ_ERROR", message: "Não foi possível carregar a página." } });
      return;
    }
    response.writeHead(200, {
      "Content-Type": file[1],
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": politicaDeSeguranca,
    });
    response.end(contents);
  });
});

if (require.main === module) {
  server.listen(port, () => {
    console.log(`Entrelinhas disponível em http://localhost:${port}`);
  });
}

module.exports = {
  server,
  politicaDeSeguranca,
  // Reexporta o núcleo compartilhado (usado pelos testes e mantido por compatibilidade).
  validateInput: nucleo.validateInput,
  validateAssessment: nucleo.validateAssessment,
  validateProofreading: nucleo.validateProofreading,
  parseCandidate: nucleo.parseCandidate,
  normalizarAvaliacao: nucleo.normalizarAvaliacao,
  normalizarRevisao: nucleo.normalizarRevisao,
  filtrarCorrecoes: nucleo.filtrarCorrecoes,
  tamanhoRevisaoAceitavel: nucleo.tamanhoRevisaoAceitavel,
  createTestAssessment: nucleo.createTestAssessment,
  proofreadingPrompt: nucleo.proofreadingPrompt,
  systemPrompt: nucleo.systemPrompt,
  responseSchema: nucleo.responseSchema,
  proofreadingSchema: nucleo.proofreadingSchema,
  tempoLimitePadrao: nucleo.tempoLimitePadrao,
  modeloPadrao: nucleo.modeloPadrao,
  // Permite aos testes trocar a configuração em tempo de execução.
  // fetch: função que substitui o fetch do Gemini (null restaura o fetch real).
  // tempoLimite: limites em milissegundos, mesclados aos atuais (null restaura os padrões).
  setTestConfiguration(config = {}) {
    if (typeof config.apiKey === "string") apiKey = config.apiKey;
    if (typeof config.model === "string") model = config.model;
    if (typeof config.testMode === "boolean") testMode = config.testMode;
    if (typeof config.fetch === "function") fetchGemini = config.fetch;
    if (config.fetch === null) fetchGemini = (...argumentos) => globalThis.fetch(...argumentos);
    if (config.tempoLimite && typeof config.tempoLimite === "object") tempoLimite = { ...tempoLimite, ...config.tempoLimite };
    if (config.tempoLimite === null) tempoLimite = { ...nucleo.tempoLimitePadrao };
  },
};
