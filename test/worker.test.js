// Testes do Cloudflare Worker (worker/src/index.mjs), sem rede: o Gemini é simulado.
const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const nucleo = require("../lib/nucleo-correcao.js");
const app = require("../server.js");

const raiz = path.join(__dirname, "..");
const origemPages = "https://professoralissonlucas.github.io";
const origemLocal = "http://localhost:3000";
const chaveDeTeste = "chave-do-worker-123";
const redacao = "REDACAO-SIGILOSA: a leitura leva os jovens a escola e transforma a sociedade brasileira.";
const redacaoRevisada = "REDACAO-SIGILOSA: a leitura leva os jovens à escola e transforma a sociedade brasileira.";
const tema = "Desafios para a formação de leitores no Brasil";

let moduloWorker;
let portaServidor;

test.before(async () => {
  moduloWorker = await import(pathToFileURL(path.join(raiz, "worker", "src", "index.mjs")).href);
  await new Promise((resolver) => app.server.listen(0, "127.0.0.1", resolver));
  portaServidor = app.server.address().port;
});

test.after(async () => {
  await new Promise((resolver, rejeitar) => app.server.close((erro) => (erro ? rejeitar(erro) : resolver())));
});

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------

function respostaGemini(conteudo, finishReason = "STOP") {
  return new Response(JSON.stringify({
    candidates: [{ finishReason, content: { parts: [{ text: typeof conteudo === "string" ? conteudo : JSON.stringify(conteudo) }] } }],
  }), { status: 200, headers: { "Content-Type": "application/json" } });
}

function erroGemini(status, statusProvedor, mensagem, details = []) {
  return new Response(JSON.stringify({ error: { code: status, status: statusProvedor, message: mensagem, details } }), { status });
}

function avaliacaoValida() {
  return {
    summary: "Texto coerente.",
    competencies: [160, 120, 160, 160, 120].map((score) => ({ score: String(score), rationale: "Justificativa.", evidence: "Não identificada", suggestions: ["Sugestão."] })),
    correctedText: "REDACAO-SIGILOSA: a leitura leva os jovens à escola e transforma a sociedade brasileira!",
    strengths: ["Boa progressão."],
    nextSteps: ["Detalhar intervenção."],
  };
}

function revisaoValida() {
  return { correctedText: redacaoRevisada, corrections: [{ original: "a escola", corrected: "à escola", reason: "Crase: levar a + a escola." }] };
}

// Gemini simulado que responde pela etapa (avaliação ou revisão), já que as duas rodam em paralelo.
function criarGeminiSimulado({ avaliacao = [], revisao = [] } = {}) {
  const filas = { avaliacao: [...avaliacao], revisao: [...revisao] };
  const chamadas = [];
  const fetchSimulado = async (url, opcoes) => {
    const corpo = JSON.parse(opcoes.body);
    const etapa = corpo.system_instruction.parts[0].text === nucleo.proofreadingPrompt ? "revisao" : "avaliacao";
    chamadas.push({ etapa, url, opcoes, corpo });
    const proxima = filas[etapa].shift() ?? (etapa === "revisao" ? respostaGemini(revisaoValida()) : null);
    if (!proxima) throw new Error("Chamada inesperada ao Gemini simulado.");
    return typeof proxima === "function" ? proxima() : proxima;
  };
  return { fetchSimulado, chamadas };
}

function pedidoDeCorrecao({ corpo = { theme: tema, essay: redacao }, origem = origemPages, ip = "203.0.113.10", tipo = "application/json", textoBruto } = {}) {
  const cabecalhos = { "Content-Type": tipo, "CF-Connecting-IP": ip };
  if (origem) cabecalhos.Origin = origem;
  return new Request("https://entrelinhas-api.exemplo.workers.dev/api/correct", {
    method: "POST",
    headers: cabecalhos,
    body: textoBruto ?? JSON.stringify(corpo),
  });
}

const envPadrao = Object.freeze({ GEMINI_API_KEY: chaveDeTeste, GEMINI_MODEL: "gemini-3.5-flash", ENTRELINHAS_TEST_MODE: "false" });

async function silenciarConsole(executar) {
  const registros = [];
  const original = console.error;
  console.error = (...partes) => registros.push(partes.map(String).join(" "));
  try {
    return { resultado: await executar(), registros };
  } finally {
    console.error = original;
  }
}

// Requisição ao server.js local (para comparar com o Worker).
function pedirAoServidor(corpo) {
  return new Promise((resolver, rejeitar) => {
    const texto = JSON.stringify(corpo);
    const req = http.request({
      hostname: "127.0.0.1", port: portaServidor, path: "/api/correct", method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(texto) },
    }, (res) => {
      let dados = "";
      res.setEncoding("utf8");
      res.on("data", (parte) => { dados += parte; });
      res.on("end", () => resolver({ status: res.statusCode, corpo: JSON.parse(dados) }));
    });
    req.on("error", rejeitar);
    req.end(texto);
  });
}

// ---------------------------------------------------------------------------
// Arquivos e compatibilidade com o ambiente dos Workers
// ---------------------------------------------------------------------------

test("wrangler.toml: modelo gemini-3.5-flash, modo teste desligado e nenhuma chave no arquivo", () => {
  const toml = fs.readFileSync(path.join(raiz, "worker", "wrangler.toml"), "utf8");
  assert.match(toml, /^main = "src\/index\.mjs"$/m);
  assert.match(toml, /^\[vars\]\s*\nGEMINI_MODEL = "gemini-3.5-flash"\s*\nENTRELINHAS_TEST_MODE = "false"$/m);
  assert.doesNotMatch(toml, /^\s*GEMINI_API_KEY\s*=/m, "a chave deve ser um secret, nunca uma variável no wrangler.toml");
  assert.doesNotMatch(toml, /AIza|AQ\.[A-Za-z0-9_-]{20,}/, "nenhuma chave real no arquivo");
  assert.ok(fs.existsSync(path.join(raiz, "worker", "src", "index.mjs")));
});

test("núcleo e Worker não usam APIs exclusivas do Node (rodam nos Workers)", () => {
  for (const arquivo of ["lib/nucleo-correcao.js", "worker/src/index.mjs"]) {
    const codigo = fs.readFileSync(path.join(raiz, arquivo), "utf8").replace(/^\s*\/\/.*$/gm, "");
    assert.doesNotMatch(codigo, /require\(|from\s+["']node:|process\.|Buffer\.|__dirname/, `${arquivo} usa API do Node`);
  }
});

test("server.js e Worker usam o mesmo núcleo (sem prompts ou validações duplicados)", () => {
  const servidor = fs.readFileSync(path.join(raiz, "server.js"), "utf8");
  const worker = fs.readFileSync(path.join(raiz, "worker", "src", "index.mjs"), "utf8");
  assert.match(servidor, /require\("\.\/lib\/nucleo-correcao\.js"\)/);
  assert.match(worker, /import nucleo from "\.\.\/\.\.\/lib\/nucleo-correcao\.js";/);
  for (const codigo of [servidor, worker]) {
    assert.doesNotMatch(codigo, /Você é um avaliador pedagógico|Você é um revisor de textos/, "prompts só no núcleo");
    assert.doesNotMatch(codigo, /function validateInput|function validateAssessment|generativelanguage\.googleapis\.com/, "validações e chamada ao Gemini só no núcleo");
  }
  assert.equal(app.systemPrompt, nucleo.systemPrompt);
  assert.equal(app.validateInput, nucleo.validateInput);
});

test("o export padrão do Worker tem o método fetch", () => {
  assert.equal(typeof moduloWorker.default.fetch, "function");
  assert.deepEqual([...moduloWorker.origensPermitidas], [origemPages, origemLocal]);
  assert.deepEqual({ ...moduloWorker.limiteDeUso }, { maximo: 10, janelaMs: 600_000 });
});

// ---------------------------------------------------------------------------
// Rotas, CORS e preflight
// ---------------------------------------------------------------------------

test("GET /api/health responde ok com CORS para a origem permitida", async () => {
  const worker = moduloWorker.criarWorker();
  for (const origem of [origemPages, origemLocal]) {
    const resposta = await worker.fetch(new Request("https://x.workers.dev/api/health", { headers: { Origin: origem } }), envPadrao);
    assert.equal(resposta.status, 200);
    assert.deepEqual(await resposta.json(), { status: "ok" });
    assert.equal(resposta.headers.get("Access-Control-Allow-Origin"), origem);
    assert.equal(resposta.headers.get("Vary"), "Origin");
    assert.equal(resposta.headers.get("Cache-Control"), "no-store");
  }
  const semOrigem = await worker.fetch(new Request("https://x.workers.dev/api/health"), envPadrao);
  assert.equal(semOrigem.status, 200, "sem Origin (curl, monitoramento) continua permitido");
  assert.equal(semOrigem.headers.get("Access-Control-Allow-Origin"), null);
});

test("preflight OPTIONS: 204 com os cabeçalhos certos para origens permitidas", async () => {
  const worker = moduloWorker.criarWorker();
  for (const caminho of ["/api/correct", "/api/health"]) {
    const resposta = await worker.fetch(new Request(`https://x.workers.dev${caminho}`, {
      method: "OPTIONS",
      headers: { Origin: origemPages, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type" },
    }), envPadrao);
    assert.equal(resposta.status, 204);
    assert.equal(resposta.headers.get("Access-Control-Allow-Origin"), origemPages);
    assert.equal(resposta.headers.get("Access-Control-Allow-Methods"), "GET, POST, OPTIONS");
    assert.equal(resposta.headers.get("Access-Control-Allow-Headers"), "Content-Type");
    assert.equal(resposta.headers.get("Access-Control-Max-Age"), "86400");
    assert.equal(await resposta.text(), "");
  }
});

test("origem não permitida é recusada no preflight e no POST, sem chamar o Gemini", async () => {
  const { fetchSimulado, chamadas } = criarGeminiSimulado({ avaliacao: [respostaGemini(avaliacaoValida())] });
  const worker = moduloWorker.criarWorker({ fetch: fetchSimulado });
  for (const origem of ["https://site-qualquer.com", "http://localhost:5500", "https://professoralissonlucas.github.io.evil.com"]) {
    const preflight = await worker.fetch(new Request("https://x.workers.dev/api/correct", { method: "OPTIONS", headers: { Origin: origem } }), envPadrao);
    assert.equal(preflight.status, 403);
    assert.equal(preflight.headers.get("Access-Control-Allow-Origin"), null);
    const post = await worker.fetch(pedidoDeCorrecao({ origem }), envPadrao);
    assert.equal(post.status, 403);
    assert.equal((await post.json()).error.code, "CORS_NOT_ALLOWED");
    assert.equal(post.headers.get("Access-Control-Allow-Origin"), null);
  }
  assert.equal(chamadas.length, 0);
});

test("métodos e rotas inválidos: 405 com Allow e 404, como no server.js", async () => {
  const worker = moduloWorker.criarWorker();
  const getCorrect = await worker.fetch(new Request("https://x.workers.dev/api/correct", { headers: { Origin: origemPages } }), envPadrao);
  assert.equal(getCorrect.status, 405);
  assert.equal(getCorrect.headers.get("Allow"), "POST");
  assert.equal((await getCorrect.json()).error.code, "METHOD_NOT_ALLOWED");
  assert.equal(getCorrect.headers.get("Access-Control-Allow-Origin"), origemPages, "erros também levam CORS");

  const postHealth = await worker.fetch(new Request("https://x.workers.dev/api/health", { method: "POST" }), envPadrao);
  assert.equal(postHealth.status, 405);
  assert.equal(postHealth.headers.get("Allow"), "GET");

  const inexistente = await worker.fetch(new Request("https://x.workers.dev/qualquer"), envPadrao);
  assert.equal(inexistente.status, 404);
  assert.equal((await inexistente.json()).error.code, "NOT_FOUND");
});

// ---------------------------------------------------------------------------
// Corpo da requisição e validações
// ---------------------------------------------------------------------------

test("valida corpo: Content-Type, JSON, tamanho e campos (mesmos códigos do server.js)", async () => {
  const worker = moduloWorker.criarWorker();
  const casos = [
    [{ tipo: "text/plain" }, 415, "INVALID_REQUEST"],
    [{ textoBruto: "{" }, 400, "INVALID_REQUEST"],
    [{ textoBruto: JSON.stringify({ theme: "t", essay: "x".repeat(25_000) }) }, 413, "INVALID_REQUEST"],
    [{ corpo: { theme: "", essay: "" } }, 400, "INVALID_INPUT"],
    [{ corpo: { theme: "t".repeat(1501), essay: "texto" } }, 400, "INVALID_INPUT"],
    [{ corpo: { theme: "tema", essay: "e".repeat(5001) } }, 400, "INVALID_INPUT"],
  ];
  for (const [opcoes, status, codigo] of casos) {
    const resposta = await worker.fetch(pedidoDeCorrecao(opcoes), envPadrao);
    assert.equal(resposta.status, status, JSON.stringify(opcoes).slice(0, 60));
    assert.equal((await resposta.json()).error.code, codigo);
    assert.equal(resposta.headers.get("Access-Control-Allow-Origin"), origemPages);
  }
});

test("modo demonstração (ENTRELINHAS_TEST_MODE=true) devolve 880 pontos sem chamar o Gemini", async () => {
  const { fetchSimulado, chamadas } = criarGeminiSimulado();
  const worker = moduloWorker.criarWorker({ fetch: fetchSimulado });
  const resposta = await worker.fetch(pedidoDeCorrecao(), { ...envPadrao, ENTRELINHAS_TEST_MODE: "true" });
  assert.equal(resposta.status, 200);
  const corpo = await resposta.json();
  assert.equal(corpo.testMode, true);
  assert.equal(corpo.result.competencies.reduce((total, item) => total + item.score, 0), 880);
  assert.equal(chamadas.length, 0);
});

test("sem o secret GEMINI_API_KEY responde SERVICE_NOT_CONFIGURED", async () => {
  const worker = moduloWorker.criarWorker();
  const resposta = await worker.fetch(pedidoDeCorrecao(), { GEMINI_MODEL: "gemini-3.5-flash", ENTRELINHAS_TEST_MODE: "false" });
  assert.equal(resposta.status, 503);
  assert.equal((await resposta.json()).error.code, "SERVICE_NOT_CONFIGURED");
});

// ---------------------------------------------------------------------------
// Fluxo com o Gemini simulado
// ---------------------------------------------------------------------------

test("correção completa: usa o secret, o modelo do wrangler.toml e devolve a revisão", async () => {
  const { fetchSimulado, chamadas } = criarGeminiSimulado({ avaliacao: [respostaGemini(avaliacaoValida())], revisao: [respostaGemini(revisaoValida())] });
  const worker = moduloWorker.criarWorker({ fetch: fetchSimulado });
  const { resultado: resposta, registros } = await silenciarConsole(() => worker.fetch(pedidoDeCorrecao(), envPadrao));
  assert.equal(resposta.status, 200);
  assert.equal(resposta.headers.get("Access-Control-Allow-Origin"), origemPages);
  const corpo = await resposta.json();
  assert.deepEqual(corpo.result.competencies.map((item) => item.score), [160, 120, 160, 160, 120]);
  assert.equal(corpo.result.correctedText, redacaoRevisada);
  assert.deepEqual(corpo.result.corrections.map((item) => `${item.original} → ${item.corrected}`), ["a escola → à escola"]);

  assert.equal(chamadas.length, 2);
  for (const chamada of chamadas) {
    assert.equal(chamada.opcoes.headers["x-goog-api-key"], chaveDeTeste);
    assert.match(chamada.url, /\/models\/gemini-3.5-flash:generateContent$/);
    assert.deepEqual(chamada.corpo.generationConfig.thinkingConfig, { thinkingLevel: "low" });
  }
  assert.deepEqual(registros, []);
});

test("modelo vindo de GEMINI_MODEL e mensagem de 404 apontando para o wrangler.toml", async () => {
  const { fetchSimulado, chamadas } = criarGeminiSimulado({ avaliacao: [erroGemini(404, "NOT_FOUND", "Model not found.")] });
  const worker = moduloWorker.criarWorker({ fetch: fetchSimulado });
  const { resultado: resposta } = await silenciarConsole(() => worker.fetch(pedidoDeCorrecao(), { ...envPadrao, GEMINI_MODEL: "gemini-2.5-flash" }));
  assert.equal(resposta.status, 502);
  const { error } = await resposta.json();
  assert.equal(error.code, "INVALID_MODEL");
  assert.match(error.message, /gemini-2\.5-flash/);
  assert.match(error.message, /GEMINI_MODEL no wrangler\.toml/);
  assert.match(chamadas[0].url, /gemini-2\.5-flash/);
});

test("logs do Worker não expõem a redação nem a chave", async () => {
  const { fetchSimulado } = criarGeminiSimulado({ avaliacao: [erroGemini(401, "UNAUTHENTICATED", `Chave ${chaveDeTeste} recusada.`)] });
  const worker = moduloWorker.criarWorker({ fetch: fetchSimulado });
  const { resultado: resposta, registros } = await silenciarConsole(() => worker.fetch(pedidoDeCorrecao(), envPadrao));
  assert.equal((await resposta.json()).error.code, "INVALID_API_KEY");
  const texto = registros.join("\n");
  assert.ok(texto.includes("[chave oculta]"));
  assert.equal(texto.includes(chaveDeTeste), false);
  assert.equal(texto.includes("REDACAO-SIGILOSA"), false);
});

test("mesmo comportamento do server.js para os mesmos cenários do Gemini", async () => {
  const cenarios = {
    "sucesso completo": () => ({ avaliacao: [respostaGemini(avaliacaoValida())], revisao: [respostaGemini(revisaoValida())] }),
    "revisão indisponível (resposta parcial)": () => ({ avaliacao: [respostaGemini(avaliacaoValida())], revisao: [erroGemini(500, "INTERNAL", "Erro."), erroGemini(500, "INTERNAL", "Erro.")] }),
    "MAX_TOKENS na avaliação": () => ({ avaliacao: [respostaGemini("{\"summary\":", "MAX_TOKENS")] }),
    "429 por minuto": () => ({ avaliacao: [erroGemini(429, "RESOURCE_EXHAUSTED", "Rate.")] }),
    "cota diária": () => ({ avaliacao: [erroGemini(429, "RESOURCE_EXHAUSTED", "per day", [{ violations: [{ quotaId: "GenerateRequestsPerDayPerProjectPerModel-FreeTier" }] }])] }),
    "503 na avaliação": () => ({ avaliacao: [erroGemini(503, "UNAVAILABLE", "High demand.")] }),
    "chave recusada": () => ({ avaliacao: [erroGemini(400, "INVALID_ARGUMENT", "API key not valid.", [{ reason: "API_KEY_INVALID" }])] }),
    "erro 500 na avaliação": () => ({ avaliacao: [erroGemini(500, "INTERNAL", "Erro.")] }),
  };
  const tempoLimite = { esperaNovaTentativa: 1, minimoNovaTentativa: 0 };
  for (const [nome, montar] of Object.entries(cenarios)) {
    const noServidor = criarGeminiSimulado(montar());
    app.setTestConfiguration({ apiKey: chaveDeTeste, model: "gemini-3.5-flash", testMode: false, fetch: noServidor.fetchSimulado, tempoLimite });
    const { resultado: doServidor } = await silenciarConsole(() => pedirAoServidor({ theme: tema, essay: redacao }));
    app.setTestConfiguration({ apiKey: "", fetch: null, tempoLimite: null });

    const noWorker = criarGeminiSimulado(montar());
    const worker = moduloWorker.criarWorker({ fetch: noWorker.fetchSimulado, tempoLimite });
    const { resultado: respostaWorker } = await silenciarConsole(() => worker.fetch(pedidoDeCorrecao(), envPadrao));
    const doWorker = { status: respostaWorker.status, corpo: await respostaWorker.json() };

    assert.equal(doWorker.status, doServidor.status, `${nome}: status`);
    assert.deepEqual(doWorker.corpo, doServidor.corpo, `${nome}: corpo da resposta`);
  }
});

// ---------------------------------------------------------------------------
// Limite de uso por IP
// ---------------------------------------------------------------------------

test("limite por IP: 10 correções a cada 10 minutos, 429 em português com Retry-After e CORS", async () => {
  let agora = Date.UTC(2026, 10, 19, 12, 0, 0);
  const worker = moduloWorker.criarWorker({ relogio: () => agora });
  const envDemonstracao = { ...envPadrao, ENTRELINHAS_TEST_MODE: "true" };

  for (let i = 1; i <= 10; i += 1) {
    const resposta = await worker.fetch(pedidoDeCorrecao({ ip: "198.51.100.7" }), envDemonstracao);
    assert.equal(resposta.status, 200, `correção ${i} deve passar`);
  }
  agora += 3 * 60 * 1000; // 3 minutos depois, ainda na mesma janela
  const bloqueada = await worker.fetch(pedidoDeCorrecao({ ip: "198.51.100.7" }), envDemonstracao);
  assert.equal(bloqueada.status, 429);
  const { error } = await bloqueada.json();
  assert.equal(error.code, "RATE_LIMITED");
  assert.equal(error.message, "Você atingiu o limite de 10 correções a cada 10 minutos. Aguarde cerca de 7 minutos e tente novamente.");
  assert.equal(bloqueada.headers.get("Retry-After"), "420");
  assert.equal(bloqueada.headers.get("Access-Control-Allow-Origin"), origemPages, "o navegador precisa ler a mensagem");
  assert.equal(bloqueada.headers.get("Access-Control-Expose-Headers"), "Retry-After");

  const outroIp = await worker.fetch(pedidoDeCorrecao({ ip: "198.51.100.8" }), envDemonstracao);
  assert.equal(outroIp.status, 200, "cada IP tem seu próprio limite");

  agora += 7 * 60 * 1000; // começa uma nova janela de 10 minutos
  const depois = await worker.fetch(pedidoDeCorrecao({ ip: "198.51.100.7" }), envDemonstracao);
  assert.equal(depois.status, 200, "o limite reinicia na janela seguinte");
});

test("limite por IP não conta pedidos inválidos nem chama o Gemini quando bloqueado", async () => {
  const agora = Date.UTC(2026, 10, 19, 12, 0, 0);
  const { fetchSimulado, chamadas } = criarGeminiSimulado();
  const worker = moduloWorker.criarWorker({ relogio: () => agora, fetch: fetchSimulado });
  for (let i = 0; i < 15; i += 1) {
    const invalido = await worker.fetch(pedidoDeCorrecao({ corpo: { theme: "", essay: "" }, ip: "192.0.2.1" }), envPadrao);
    assert.equal(invalido.status, 400);
  }
  const limitador = new moduloWorker.LimitadorEmMemoria();
  for (let i = 0; i < 10; i += 1) await limitador.registrarUso("192.0.2.2", agora, moduloWorker.limiteDeUso);
  const workerCheio = moduloWorker.criarWorker({ relogio: () => agora, fetch: fetchSimulado, limitador });
  const bloqueada = await workerCheio.fetch(pedidoDeCorrecao({ ip: "192.0.2.2" }), envPadrao);
  assert.equal(bloqueada.status, 429);
  assert.equal(chamadas.length, 0, "bloqueio acontece antes de gastar cota do Gemini");
});

test("limite por IP usa o KV (LIMITE_USO) quando configurado", async () => {
  const armazenado = new Map();
  const gravacoes = [];
  const kvFalso = {
    async get(chave) { return armazenado.get(chave) ?? null; },
    async put(chave, valor, opcoes) { gravacoes.push({ chave, valor, opcoes }); armazenado.set(chave, valor); },
  };
  const agora = Date.UTC(2026, 10, 19, 12, 5, 0);
  const env = { ...envPadrao, ENTRELINHAS_TEST_MODE: "true", LIMITE_USO: kvFalso };
  // Dois Workers diferentes (como dois servidores da Cloudflare) compartilham o mesmo KV.
  const workerA = moduloWorker.criarWorker({ relogio: () => agora });
  const workerB = moduloWorker.criarWorker({ relogio: () => agora });
  for (let i = 0; i < 10; i += 1) {
    const worker = i % 2 === 0 ? workerA : workerB;
    assert.equal((await worker.fetch(pedidoDeCorrecao({ ip: "203.0.113.50" }), env)).status, 200);
  }
  assert.equal((await workerA.fetch(pedidoDeCorrecao({ ip: "203.0.113.50" }), env)).status, 429);
  assert.equal((await workerB.fetch(pedidoDeCorrecao({ ip: "203.0.113.50" }), env)).status, 429);
  assert.ok(gravacoes.every((gravacao) => gravacao.opcoes.expirationTtl >= 60), "o KV exige expiração mínima de 60 s");
  assert.ok(gravacoes.every((gravacao) => gravacao.chave.startsWith("uso:203.0.113.50:")));
});

test("se o KV falhar (ex.: limite de gravações do plano gratuito), o Worker usa o limite em memória", async () => {
  const kvQuebrado = {
    async get() { return null; },
    async put() { throw new Error("KV put() limit exceeded for the day."); },
  };
  const agora = Date.UTC(2026, 10, 19, 13, 0, 0);
  const worker = moduloWorker.criarWorker({ relogio: () => agora });
  const env = { ...envPadrao, ENTRELINHAS_TEST_MODE: "true", LIMITE_USO: kvQuebrado };
  const { resultado: respostas, registros } = await silenciarConsole(async () => {
    const lista = [];
    for (let i = 0; i < 11; i += 1) lista.push((await worker.fetch(pedidoDeCorrecao({ ip: "203.0.113.77" }), env)).status);
    return lista;
  });
  assert.deepEqual(respostas, [...Array(10).fill(200), 429], "continua funcionando e limitando");
  assert.ok(registros.some((linha) => linha.includes("KV indisponível")));
});
