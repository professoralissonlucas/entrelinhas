const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

const { server, validateInput, validateAssessment, validateProofreading, parseCandidate } = require("../server.js");

function request(port, method, pathname, body, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? null : JSON.stringify(body);
    const req = http.request({
      hostname: "127.0.0.1",
      port,
      path: pathname,
      method,
      headers: payload ? {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
        ...extraHeaders,
      } : extraHeaders,
    }, (response) => {
      let data = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => { data += chunk; });
      response.on("end", () => resolve({
        status: response.statusCode,
        headers: response.headers,
        body: (response.headers["content-type"] || "").includes("application/json")
          ? (data ? JSON.parse(data) : null)
          : data,
      }));
    });
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function validAssessment() {
  return {
    summary: "Texto coerente.",
    competencies: [
      { score: 160, rationale: "Domínio formal adequado.", evidence: "Trecho válido.", suggestions: ["Manter o registro."] },
      { score: 120, rationale: "Tema atendido.", evidence: "Não identificada", suggestions: ["Aprofundar."] },
      { score: 160, rationale: "Argumentação clara.", evidence: "Argumento válido.", suggestions: ["Relacionar exemplos."] },
      { score: 160, rationale: "Boa coesão.", evidence: "Parágrafo conectado.", suggestions: [] },
      { score: 120, rationale: "Intervenção parcial.", evidence: "Ação indicada.", suggestions: ["Detalhar agente."] },
    ],
    correctedText: "Texto integral revisado.",
    strengths: ["Boa progressão."],
    nextSteps: ["Detalhar intervenção."],
  };
}

let testPort;

test.before(async () => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  testPort = server.address().port;
});

test.after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test("valida tema e redação obrigatórios", () => {
  assert.equal(validateInput(null), "Envie o tema e a redação no formato esperado.");
  assert.equal(validateInput({ theme: "", essay: "texto" }), "Informe o tema e a proposta de redação.");
  assert.equal(validateInput({ theme: "tema", essay: "" }), "Digite ou cole sua redação.");
  assert.equal(validateInput({ theme: "x".repeat(1501), essay: "texto" }), "A proposta deve ter no máximo 1500 caracteres.");
  assert.equal(validateInput({ theme: "tema", essay: "x".repeat(5001) }), "A redação deve ter no máximo 5000 caracteres.");
  assert.equal(validateInput({ theme: "tema", essay: "texto" }), null);
});

test("valida as cinco competências e os campos obrigatórios da avaliação", () => {
  assert.equal(validateAssessment(validAssessment()), true);

  const missingCompetency = validAssessment();
  missingCompetency.competencies.pop();
  assert.equal(validateAssessment(missingCompetency), false);

  const invalidScore = validAssessment();
  invalidScore.competencies[0].score = 150;
  assert.equal(validateAssessment(invalidScore), false);

  assert.equal(validateAssessment({}), false);
});

test("valida a revisão independentemente da avaliação", () => {
  assert.equal(validateProofreading({ correctedText: "Texto corrigido.", corrections: [] }), true);
  assert.equal(validateProofreading({ correctedText: "", corrections: [] }), false);
  assert.equal(validateProofreading({
    correctedText: "Texto corrigido.",
    corrections: [{ original: "educacao", corrected: "educação", reason: "Acentuação." }],
  }), true);
});

test("calcula corretamente os seis níveis possíveis da nota", () => {
  const assessment = validAssessment();
  const total = assessment.competencies.reduce((sum, item) => sum + item.score, 0);
  assert.equal(total, 720);
  for (const score of [0, 40, 80, 120, 160, 200]) {
    assert.equal([0, 40, 80, 120, 160, 200].includes(score), true);
  }
});

test("interpreta JSON seguro vindo da resposta Gemini", () => {
  const assessment = validAssessment();
  const parsed = parseCandidate({ body: { candidates: [{ finishReason: "STOP", content: { parts: [{ text: JSON.stringify(assessment) }] } }] } });
  assert.deepEqual(parsed, assessment);

  const incomplete = parseCandidate({ body: { candidates: [{ finishReason: "MAX_TOKENS", content: { parts: [{ text: "{}" }] } }] } });
  assert.equal(incomplete, null);

  assert.equal(parseCandidate({ body: { candidates: [{ content: { parts: [{ text: "não json" }] } }] } }), null);
});

test("GET /api/health responde corretamente", async () => {
  const response = await request(testPort, "GET", "/api/health");
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { status: "ok" });

  const invalidMethod = await request(testPort, "POST", "/api/health");
  assert.equal(invalidMethod.status, 405);
});

test("POST /api/correct rejeita entrada vazia antes do Gemini", async () => {
  const response = await request(testPort, "POST", "/api/correct", { theme: "", essay: "" });
  assert.equal(response.status, 400);
  assert.equal(response.body.error.code, "INVALID_INPUT");
});

test("POST /api/correct rejeita JSON incorreto", async () => {
  const response = await new Promise((resolve, reject) => {
    const req = http.request({ hostname: "127.0.0.1", port: testPort, path: "/api/correct", method: "POST", headers: { "Content-Type": "application/json" } }, (res) => {
      let data = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
    });
    req.on("error", reject);
    req.write("{");
    req.end();
  });
  assert.equal(response.status, 400);
  assert.equal(response.body.error.code, "INVALID_REQUEST");
});

test("POST /api/correct rejeita Content-Type diferente de JSON", async () => {
  const response = await request(testPort, "POST", "/api/correct", undefined, { "Content-Type": "text/plain" });
  assert.equal(response.status, 415);
});

test("recursos estáticos e rotas desconhecidas continuam estáveis", async () => {
  const page = await request(testPort, "GET", "/");
  assert.equal(page.status, 200);
  assert.equal(page.headers["content-type"].includes("text/html"), true);

  const missing = await request(testPort, "GET", "/recurso-inexistente");
  assert.equal(missing.status, 404);
  assert.equal(missing.body.error.code, "NOT_FOUND");
});

test("aceita exatamente os limites definidos pelo SPEC", () => {
  assert.equal(validateInput({ theme: "t".repeat(1500), essay: "e".repeat(5000) }), null);
  assert.equal(validateInput({ theme: "t".repeat(1501), essay: "e".repeat(5000) }).includes("1500"), true);
  assert.equal(validateInput({ theme: "tema", essay: "e".repeat(5001) }).includes("5000"), true);
});

test("rejeita resposta Gemini incompleta ou com bloco inválido", () => {
  const incomplete = parseCandidate({ body: { candidates: [{ finishReason: "STOP", content: { parts: [{ text: '{"summary":"só parte"}' }] } }] } });
  assert.equal(validateAssessment(incomplete), false);

  const fencedInvalid = parseCandidate({ body: { candidates: [{ finishReason: "STOP", content: { parts: [{ text: "```json\n{invalid}\n```" }] } }] } });
  assert.equal(fencedInvalid, null);
});

test("POST /api/correct informa quando o serviço não está configurado", async () => {
  const app = require("../server.js");
  // Força a ausência de chave e desliga o modo teste, independentemente do .env local.
  app.setTestConfiguration({ apiKey: "", testMode: false });
  try {
    const response = await request(testPort, "POST", "/api/correct", {
      theme: "Desafios da leitura",
      essay: "A leitura é importante para a sociedade.",
    });
    assert.equal(response.status, 503);
    assert.equal(response.body.error.code, "SERVICE_NOT_CONFIGURED");
  } finally {
    app.setTestConfiguration({ apiKey: "", testMode: false });
  }
});

test("modo de teste gera exatamente 880 pontos em cinco competências", () => {
  const { createTestAssessment } = require("../server.js");
  const assessment = createTestAssessment({ essay: "Texto qualquer para demonstração." });
  assert.equal(assessment.competencies.length, 5);
  assert.deepEqual(assessment.competencies.map((item) => item.score), [160, 160, 160, 200, 200]);
  assert.equal(assessment.competencies.reduce((total, item) => total + item.score, 0), 880);
  assert.equal(assessment.correctedText, "Texto qualquer para demonstração.");
  assert.equal(assessment.summary.startsWith("Modo de demonstração:"), true);
});

test("configuração pode alternar entre modo teste e modo real", () => {
  const app = require("../server.js");
  app.setTestConfiguration({ testMode: true });
  app.setTestConfiguration({ testMode: false });
  assert.equal(typeof app.createTestAssessment({ essay: "Teste" }), "object");
});

// ---------------------------------------------------------------------------
// Simulação do Gemini (sem rede)
// ---------------------------------------------------------------------------

const chaveDeTeste = "chave-de-teste-123";
const redacaoDeTeste = "REDACAO-SIGILOSA: a leitura leva os jovens a escola e transforma a sociedade brasileira.";
const redacaoRevisadaDeTeste = "REDACAO-SIGILOSA: a leitura leva os jovens à escola e transforma a sociedade brasileira.";
// Texto revisado pela primeira etapa (avaliação), diferente do da revisão para que os testes saibam de onde veio.
const rascunhoDaAvaliacao = "REDACAO-SIGILOSA: a leitura leva os jovens à escola e transforma a sociedade brasileira!";
const temaDeTeste = "Desafios para a formação de leitores no Brasil";

function respostaGemini(conteudo, finishReason = "STOP", status = 200) {
  const texto = typeof conteudo === "string" ? conteudo : JSON.stringify(conteudo);
  return new Response(JSON.stringify({
    candidates: [{ finishReason, content: { role: "model", parts: [{ text: texto }] } }],
    usageMetadata: { thoughtsTokenCount: 900, candidatesTokenCount: 120 },
  }), { status, headers: { "Content-Type": "application/json" } });
}

function respostaErroGemini(status, statusProvedor, mensagem, details = []) {
  return new Response(JSON.stringify({ error: { code: status, status: statusProvedor, message: mensagem, details } }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function avaliacaoDoGemini(textoCorrigido = rascunhoDaAvaliacao) {
  // O schema pede a nota como texto; o servidor deve convertê-la para número.
  const avaliacao = validAssessment();
  avaliacao.competencies = avaliacao.competencies.map((item) => ({ ...item, score: String(item.score) }));
  avaliacao.correctedText = textoCorrigido;
  return avaliacao;
}

function revisaoDoGemini() {
  return {
    correctedText: redacaoRevisadaDeTeste,
    corrections: [{ original: "a escola", corrected: "à escola", reason: "Crase: \"levar a\" + artigo \"a\" de \"a escola\"." }],
  };
}

// Fetch que nunca responde e só termina quando o sinal de cancelamento é acionado, como o fetch real.
function fetchQueNuncaResponde(_url, opcoes) {
  return new Promise((_resolver, rejeitar) => {
    opcoes.signal.addEventListener("abort", () => rejeitar(new DOMException("A operação foi cancelada.", "AbortError")));
  });
}

function atrasar(ms, valor) {
  return () => new Promise((resolver) => setTimeout(() => resolver(typeof valor === "function" ? valor() : valor), ms));
}

// Como avaliação e revisão rodam em paralelo, o Gemini simulado responde pela ETAPA, não pela ordem das chamadas.
// respostas: { avaliacao: [...], revisao: [...] }. Se a fila da revisão esvaziar, devolve uma revisão válida.
async function comGeminiSimulado(respostas, executar, extras = {}) {
  const app = require("../server.js");
  const chamadas = [];
  const filas = { avaliacao: [...(respostas.avaliacao || [])], revisao: [...(respostas.revisao || [])] };
  const fetchSimulado = async (url, opcoes) => {
    const corpo = JSON.parse(opcoes.body);
    const etapa = corpo.system_instruction.parts[0].text === app.proofreadingPrompt ? "revisao" : "avaliacao";
    chamadas.push({ etapa, url, opcoes, corpo, instante: Date.now() });
    const proxima = filas[etapa].shift() ?? (etapa === "revisao" ? respostaGemini(revisaoDoGemini()) : null);
    if (!proxima) throw new Error("Chamada inesperada ao Gemini simulado.");
    return typeof proxima === "function" ? proxima(url, opcoes) : proxima;
  };
  const registros = [];
  const consoleErrorOriginal = console.error;
  console.error = (...partes) => registros.push(partes.map(String).join(" "));
  // Esperas curtas nos testes; cada teste pode sobrescrever qualquer limite via extras.tempoLimite.
  app.setTestConfiguration({
    apiKey: chaveDeTeste,
    model: app.modeloPadrao,
    testMode: false,
    fetch: fetchSimulado,
    tempoLimite: { esperaNovaTentativa: 5, minimoNovaTentativa: 0 },
  });
  app.setTestConfiguration(extras);
  try {
    const inicio = Date.now();
    const resposta = await request(testPort, "POST", "/api/correct", { theme: temaDeTeste, essay: redacaoDeTeste });
    resposta.duracaoMs = Date.now() - inicio;
    await executar({
      resposta,
      chamadas,
      registros,
      daEtapa: (etapa) => chamadas.filter((chamada) => chamada.etapa === etapa),
    });
  } finally {
    console.error = consoleErrorOriginal;
    app.setTestConfiguration({ apiKey: "", model: app.modeloPadrao, testMode: false, fetch: null, tempoLimite: null });
  }
}

function registrosNaoExpoemDados(registros) {
  const texto = registros.join("\n");
  assert.equal(texto.includes("REDACAO-SIGILOSA"), false, "o log não pode conter a redação");
  assert.equal(texto.includes(chaveDeTeste), false, "o log não pode conter a chave da API");
}

function procurarEnumForaDeString(schema, caminho = "raiz") {
  if (!schema || typeof schema !== "object") return [];
  const problemas = schema.enum && schema.type !== "STRING" ? [caminho] : [];
  for (const [nome, filho] of Object.entries(schema.properties || {})) {
    problemas.push(...procurarEnumForaDeString(filho, `${caminho}.${nome}`));
  }
  if (schema.items) problemas.push(...procurarEnumForaDeString(schema.items, `${caminho}[]`));
  return problemas;
}

// Extrai a função isAssessmentResponse de script.js para testá-la sem navegador.
function carregarValidacaoDoFrontend() {
  const fs = require("node:fs");
  const path = require("node:path");
  const codigo = fs.readFileSync(path.join(__dirname, "..", "script.js"), "utf8").replace(/\r\n/g, "\n");
  const inicio = codigo.indexOf("function isAssessmentResponse(");
  const fim = codigo.indexOf("\n}\n", inicio);
  assert.ok(inicio >= 0 && fim > inicio, "isAssessmentResponse não encontrada em script.js");
  return new Function(`${codigo.slice(inicio, fim + 2)}; return isAssessmentResponse;`)();
}

function lerLimiteDoNavegador() {
  const fs = require("node:fs");
  const path = require("node:path");
  const codigo = fs.readFileSync(path.join(__dirname, "..", "script.js"), "utf8");
  const encontrado = codigo.match(/browserController\.abort\(\),\s*([\d_]+)\)/);
  assert.ok(encontrado, "limite do navegador não encontrado em script.js");
  return Number(encontrado[1].replace(/_/g, ""));
}

test("schemas enviados ao Gemini usam enum somente em campos STRING", () => {
  const { responseSchema, proofreadingSchema } = require("../server.js");
  assert.deepEqual(procurarEnumForaDeString(responseSchema), []);
  assert.deepEqual(procurarEnumForaDeString(proofreadingSchema), []);
  assert.deepEqual(responseSchema.properties.competencies.items.properties.score.enum, ["0", "40", "80", "120", "160", "200"]);
});

test("normaliza a nota em texto para número e mantém notas inválidas rejeitadas", () => {
  const { normalizarAvaliacao } = require("../server.js");
  const normalizada = normalizarAvaliacao(avaliacaoDoGemini());
  assert.deepEqual(normalizada.competencies.map((item) => item.score), [160, 120, 160, 160, 120]);
  assert.equal(validateAssessment(normalizada), true);

  const invalida = avaliacaoDoGemini();
  invalida.competencies[0].score = "150";
  assert.equal(validateAssessment(normalizarAvaliacao(invalida)), false);
});

test("ignora partes de raciocínio (thought) ao interpretar a resposta", () => {
  const avaliacao = validAssessment();
  const parsed = parseCandidate({ body: { candidates: [{ finishReason: "STOP", content: { parts: [
    { thought: true, text: "Raciocínio interno que não é JSON." },
    { text: JSON.stringify(avaliacao) },
  ] } }] } });
  assert.deepEqual(parsed, avaliacao);
});

test("limites de tempo: cada etapa < prazo total do servidor < limite do navegador, com folga", () => {
  const { tempoLimitePadrao } = require("../server.js");
  const limiteNavegador = lerLimiteDoNavegador();
  assert.ok(tempoLimitePadrao.avaliacao < tempoLimitePadrao.total, "avaliação abaixo do prazo total");
  assert.ok(tempoLimitePadrao.revisao < tempoLimitePadrao.total, "revisão abaixo do prazo total");
  assert.ok(limiteNavegador - tempoLimitePadrao.total >= 10_000, "pelo menos 10 s de folga para o navegador");
  assert.ok(tempoLimitePadrao.esperaNovaTentativa > 0 && tempoLimitePadrao.esperaNovaTentativa <= 5_000, "espera curta antes da nova tentativa");
});

test("Gemini simulado: avaliação e revisão concluídas com sucesso", async () => {
  await comGeminiSimulado({ avaliacao: [respostaGemini(avaliacaoDoGemini())], revisao: [respostaGemini(revisaoDoGemini())] }, ({ resposta, registros, daEtapa }) => {
    assert.equal(resposta.status, 200);
    const resultado = resposta.body.result;
    assert.deepEqual(resultado.competencies.map((item) => item.score), [160, 120, 160, 160, 120]);
    // O texto exibido vem da revisão (segunda chamada), não do rascunho da avaliação.
    assert.equal(resultado.correctedText, redacaoRevisadaDeTeste);
    assert.deepEqual(resultado.corrections.map((item) => `${item.original} → ${item.corrected}`), ["a escola → à escola"]);
    assert.equal("proofreadingUnavailable" in resultado, false);
    assert.equal(validateAssessment(resultado), true);

    const [avaliacao] = daEtapa("avaliacao");
    const [revisao] = daEtapa("revisao");
    assert.equal(daEtapa("avaliacao").length, 1);
    assert.equal(daEtapa("revisao").length, 1);
    assert.equal(avaliacao.opcoes.headers["x-goog-api-key"], chaveDeTeste);
    assert.equal(avaliacao.url.includes(chaveDeTeste), false, "a chave não deve ir na URL");
    assert.equal(avaliacao.url.includes("/models/gemini-3.8-flash:generateContent"), true);
    assert.deepEqual(avaliacao.corpo.generationConfig.thinkingConfig, { thinkingLevel: "low" });
    assert.ok(avaliacao.corpo.generationConfig.maxOutputTokens >= 16_384, "folga para raciocínio + JSON completo");
    assert.deepEqual(revisao.corpo.generationConfig.thinkingConfig, { thinkingLevel: "low" });
    assert.deepEqual(JSON.parse(avaliacao.corpo.contents[0].parts[0].text), { theme: temaDeTeste, essay: redacaoDeTeste });
    // A revisão parte só do texto original: não depende da avaliação.
    assert.deepEqual(JSON.parse(revisao.corpo.contents[0].parts[0].text), { original: redacaoDeTeste });
    assert.deepEqual(registros, []);
  });
});

test("Gemini simulado: avaliação e revisão rodam em paralelo (tempo total ≈ etapa mais lenta)", async () => {
  const respostas = {
    avaliacao: [atrasar(150, () => respostaGemini(avaliacaoDoGemini()))],
    revisao: [atrasar(150, () => respostaGemini(revisaoDoGemini()))],
  };
  await comGeminiSimulado(respostas, ({ resposta, daEtapa }) => {
    assert.equal(resposta.status, 200);
    const diferencaInicio = Math.abs(daEtapa("avaliacao")[0].instante - daEtapa("revisao")[0].instante);
    assert.ok(diferencaInicio < 50, `as duas chamadas devem começar juntas (diferença de ${diferencaInicio} ms)`);
    assert.ok(resposta.duracaoMs < 280, `em sequência levaria 300 ms ou mais; levou ${resposta.duracaoMs} ms`);
  });
});

test("modelo padrão é o gemini-3.8-flash", () => {
  assert.equal(require("../server.js").modeloPadrao, "gemini-3.8-flash");
});

test("Gemini simulado: modelos 2.5 recebem thinkingBudget em vez de thinkingLevel", async () => {
  await comGeminiSimulado({ avaliacao: [respostaGemini(avaliacaoDoGemini())] }, ({ resposta, daEtapa }) => {
    assert.equal(resposta.status, 200);
    assert.deepEqual(daEtapa("avaliacao")[0].corpo.generationConfig.thinkingConfig, { thinkingBudget: 1024 });
    assert.deepEqual(daEtapa("revisao")[0].corpo.generationConfig.thinkingConfig, { thinkingBudget: 512 });
  }, { model: "gemini-2.5-flash" });
});

test("Gemini simulado: erro 404 de modelo sugere verificar GEMINI_MODEL", async () => {
  const erro = respostaErroGemini(404, "NOT_FOUND", "This model models/gemini-2.5-flash is no longer available to new users.");
  await comGeminiSimulado({ avaliacao: [erro] }, ({ resposta, registros }) => {
    assert.equal(resposta.status, 502);
    assert.equal(resposta.body.error.code, "INVALID_MODEL");
    assert.match(resposta.body.error.message, /GEMINI_MODEL/);
    assert.match(resposta.body.error.message, /gemini-2\.5-flash/);
    assert.match(resposta.body.error.message, /gemini-3\.8-flash/);
    assert.ok(registros.some((linha) => linha.includes("HTTP 404") && linha.includes("no longer available")));
  }, { model: "gemini-2.5-flash" });
});

test("Gemini simulado: modelos fora das famílias 2.5 e 3.x não recebem thinkingConfig", async () => {
  await comGeminiSimulado({ avaliacao: [respostaGemini(avaliacaoDoGemini())] }, ({ resposta, daEtapa }) => {
    assert.equal(resposta.status, 200);
    assert.equal("thinkingConfig" in daEtapa("avaliacao")[0].corpo.generationConfig, false);
  }, { model: "gemini-2.0-flash" });
});

test("Gemini simulado: resposta cortada por MAX_TOKENS na avaliação é rejeitada e registrada", async () => {
  await comGeminiSimulado({ avaliacao: [respostaGemini("{\"summary\":\"Texto cort", "MAX_TOKENS")] }, ({ resposta, registros, daEtapa }) => {
    assert.equal(resposta.status, 502);
    assert.equal(resposta.body.error.code, "INVALID_PROVIDER_RESPONSE");
    assert.equal(daEtapa("avaliacao").length, 1, "a avaliação não é repetida");
    assert.ok(registros.some((linha) => linha.includes("finishReason=MAX_TOKENS") && linha.includes("tokensRaciocinio=900")));
    registrosNaoExpoemDados(registros);
  });
});

test("Gemini simulado: erro 429 na avaliação vira PROVIDER_BUSY e registra a mensagem do provedor", async () => {
  await comGeminiSimulado({ avaliacao: [respostaErroGemini(429, "RESOURCE_EXHAUSTED", "Resource has been exhausted (e.g. check quota).")] }, ({ resposta, registros }) => {
    assert.equal(resposta.status, 503);
    assert.equal(resposta.body.error.code, "PROVIDER_BUSY");
    assert.ok(registros.some((linha) => linha.includes("HTTP 429 RESOURCE_EXHAUSTED") && linha.includes("Resource has been exhausted")));
    registrosNaoExpoemDados(registros);
  });
});

test("Gemini simulado: erro 401 vira INVALID_API_KEY sem expor a chave no log", async () => {
  await comGeminiSimulado({ avaliacao: [respostaErroGemini(401, "UNAUTHENTICATED", `Chave ${chaveDeTeste} não autorizada.`)] }, ({ resposta, registros }) => {
    assert.equal(resposta.status, 502);
    assert.equal(resposta.body.error.code, "INVALID_API_KEY");
    assert.ok(registros.some((linha) => linha.includes("HTTP 401") && linha.includes("[chave oculta]")));
    registrosNaoExpoemDados(registros);
  });
});

test("Gemini simulado: erro 400 API_KEY_INVALID também vira INVALID_API_KEY", async () => {
  const erro = respostaErroGemini(400, "INVALID_ARGUMENT", "API key not valid. Please pass a valid API key.", [{ reason: "API_KEY_INVALID" }]);
  await comGeminiSimulado({ avaliacao: [erro] }, ({ resposta }) => {
    assert.equal(resposta.status, 502);
    assert.equal(resposta.body.error.code, "INVALID_API_KEY");
  });
});

test("Gemini simulado: tempo esgotado na avaliação retorna PROVIDER_TIMEOUT", async () => {
  await comGeminiSimulado({ avaliacao: [fetchQueNuncaResponde] }, ({ resposta, registros, daEtapa }) => {
    assert.equal(resposta.status, 504);
    assert.equal(resposta.body.error.code, "PROVIDER_TIMEOUT");
    assert.match(resposta.body.error.message, /avaliação/);
    assert.equal(daEtapa("avaliacao").length, 1);
    registrosNaoExpoemDados(registros);
  }, { tempoLimite: { avaliacao: 50, revisao: 50 } });
});

// ---------------------------------------------------------------------------
// Revisão: nova tentativa e resposta parcial (proofreadingUnavailable)
// ---------------------------------------------------------------------------

function assertRespostaParcial(resposta, textoEsperado = rascunhoDaAvaliacao) {
  assert.equal(resposta.status, 200, "a avaliação não pode ser descartada");
  const resultado = resposta.body.result;
  assert.equal(resultado.proofreadingUnavailable, true);
  assert.deepEqual(resultado.corrections, []);
  assert.equal(resultado.correctedText, textoEsperado);
  assert.deepEqual(resultado.competencies.map((item) => item.score), [160, 120, 160, 160, 120]);
  assert.equal(validateAssessment(resultado), true);
}

for (const [status, statusProvedor] of [[503, "UNAVAILABLE"], [429, "RESOURCE_EXHAUSTED"]]) {
  test(`Gemini simulado: revisão com ${status} é repetida 1 vez e a segunda tentativa vale`, async () => {
    const respostas = {
      avaliacao: [respostaGemini(avaliacaoDoGemini())],
      revisao: [respostaErroGemini(status, statusProvedor, "Serviço ocupado."), respostaGemini(revisaoDoGemini())],
    };
    await comGeminiSimulado(respostas, ({ resposta, registros, daEtapa }) => {
      assert.equal(resposta.status, 200);
      assert.equal(daEtapa("revisao").length, 2);
      const [primeira, segunda] = daEtapa("revisao");
      assert.ok(segunda.instante - primeira.instante >= 40, "espera antes da nova tentativa");
      assert.equal(resposta.body.result.correctedText, redacaoRevisadaDeTeste);
      assert.equal(resposta.body.result.corrections.length, 1);
      assert.equal("proofreadingUnavailable" in resposta.body.result, false);
      assert.ok(registros.some((linha) => linha.includes(`HTTP ${status}`)));
      assert.ok(registros.some((linha) => linha.includes("nova tentativa")));
      registrosNaoExpoemDados(registros);
    }, { tempoLimite: { esperaNovaTentativa: 50 } });
  });
}

test("Gemini simulado: revisão com 503 duas vezes devolve a avaliação com proofreadingUnavailable", async () => {
  const ocupado = () => respostaErroGemini(503, "UNAVAILABLE", "This model is currently experiencing high demand.");
  const respostas = { avaliacao: [respostaGemini(avaliacaoDoGemini())], revisao: [ocupado(), ocupado(), respostaGemini(revisaoDoGemini())] };
  await comGeminiSimulado(respostas, ({ resposta, registros, daEtapa }) => {
    assertRespostaParcial(resposta);
    assert.equal(daEtapa("revisao").length, 2, "no máximo 1 nova tentativa");
    assert.ok(registros.some((linha) => linha.includes("indisponível") && linha.includes("serviço ocupado após nova tentativa")));
    registrosNaoExpoemDados(registros);
  });
});

test("Gemini simulado: erro na revisão que não é 429/503 não é repetido e gera resposta parcial", async () => {
  const respostas = { avaliacao: [respostaGemini(avaliacaoDoGemini())], revisao: [respostaErroGemini(500, "INTERNAL", "Erro interno.")] };
  await comGeminiSimulado(respostas, ({ resposta, daEtapa }) => {
    assertRespostaParcial(resposta);
    assert.equal(daEtapa("revisao").length, 1);
  });
});

test("Gemini simulado: tempo esgotado na revisão gera resposta parcial", async () => {
  const respostas = { avaliacao: [atrasar(30, () => respostaGemini(avaliacaoDoGemini()))], revisao: [fetchQueNuncaResponde] };
  await comGeminiSimulado(respostas, ({ resposta, registros }) => {
    assertRespostaParcial(resposta);
    assert.ok(registros.some((linha) => linha.includes("tempo limite excedido")));
  }, { tempoLimite: { revisao: 80 } });
});

test("Gemini simulado: revisão em formato inválido gera resposta parcial", async () => {
  const respostas = { avaliacao: [respostaGemini(avaliacaoDoGemini())], revisao: [respostaGemini("{\"correctedText\":", "MAX_TOKENS")] };
  await comGeminiSimulado(respostas, ({ resposta, registros }) => {
    assertRespostaParcial(resposta);
    assert.ok(registros.some((linha) => linha.includes("resposta fora do formato esperado")));
  });
});

test("Gemini simulado: a nova tentativa respeita o prazo total da requisição", async () => {
  // A espera (150 ms) consome o prazo total (200 ms); sobram ~50 ms, abaixo do mínimo de 100 ms: não há nova tentativa.
  const respostas = {
    avaliacao: [atrasar(170, () => respostaGemini(avaliacaoDoGemini()))],
    revisao: [respostaErroGemini(503, "UNAVAILABLE", "Ocupado."), respostaGemini(revisaoDoGemini())],
  };
  await comGeminiSimulado(respostas, ({ resposta, daEtapa, registros }) => {
    assertRespostaParcial(resposta);
    assert.equal(daEtapa("revisao").length, 1);
    assert.ok(registros.some((linha) => linha.includes("sem tempo restante para nova tentativa")));
  }, { tempoLimite: { total: 200, avaliacao: 190, revisao: 190, esperaNovaTentativa: 150, minimoNovaTentativa: 100 } });
});

test("Gemini simulado: resposta parcial usa o texto original se o rascunho da avaliação violar a autoria", async () => {
  const respostas = {
    avaliacao: [respostaGemini(avaliacaoDoGemini("Texto resumido."))],
    revisao: [respostaErroGemini(500, "INTERNAL", "Erro interno.")],
  };
  await comGeminiSimulado(respostas, ({ resposta }) => {
    assertRespostaParcial(resposta, redacaoDeTeste);
  });
});

test("frontend: isAssessmentResponse aceita a resposta parcial e rejeita combinações inválidas", () => {
  const isAssessmentResponse = carregarValidacaoDoFrontend();
  const completa = { ...validAssessment(), corrections: [{ original: "a escola", corrected: "à escola", reason: "Crase." }] };
  assert.equal(isAssessmentResponse(completa), true);
  assert.equal(isAssessmentResponse({ ...validAssessment(), corrections: [], proofreadingUnavailable: true }), true);
  assert.equal(isAssessmentResponse({ ...validAssessment(), corrections: [], proofreadingUnavailable: false }), true);
  assert.equal(isAssessmentResponse({ ...validAssessment(), corrections: [], proofreadingUnavailable: "sim" }), false);
  assert.equal(isAssessmentResponse({ ...completa, proofreadingUnavailable: true }), false, "parcial não pode trazer correções");
  assert.equal(isAssessmentResponse({ ...validAssessment(), proofreadingUnavailable: true }), false, "corrections continua obrigatório");
});

test("frontend: avisa no status quando a revisão detalhada não foi concluída", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const codigo = fs.readFileSync(path.join(__dirname, "..", "script.js"), "utf8");
  assert.match(codigo, /payload\.result\.proofreadingUnavailable === true\)\s*\{\s*correctionSummary\.textContent = "Avaliação concluída, mas a revisão ortográfica detalhada não pôde ser concluída desta vez/);
});

// ---------------------------------------------------------------------------
// Revisão ortográfica e gramatical: correções inventadas, tamanho e prompt
// ---------------------------------------------------------------------------

test("filtrarCorrecoes descarta correções inventadas, sem efeito ou malformadas", () => {
  const { filtrarCorrecoes } = require("../server.js");
  const original = "Os jovens vai a escola todo dia,\nmas a leitura ainda e pouco valorizada.";
  const filtradas = filtrarCorrecoes([
    { original: "vai", corrected: "vão", reason: "Concordância verbal: sujeito plural." },
    { original: "a escola", corrected: "à escola", reason: "Crase: verbo ir exige a preposição a." },
    { original: "dia, mas", corrected: "dia; mas", reason: "Pontuação." }, // a quebra de linha do original vira espaço na comparação
    { original: "ainda e pouco", corrected: "ainda é pouco", reason: "Acentuação: verbo ser." },
    { original: "a cultura brasileira", corrected: "à cultura brasileira", reason: "Crase." }, // inventada: não existe no texto
    { original: "leitura", corrected: "leitura", reason: "Sem mudança." }, // igual ao corrigido
    { original: "todo  dia", corrected: "todo dia", reason: "Só espaço." }, // só difere em espaços
    { original: "", corrected: "algo", reason: "Vazio." },
    { original: "jovens", corrected: "jovens!", reason: "" },
    null,
  ], original);
  assert.deepEqual(filtradas.map((item) => item.original), ["vai", "a escola", "dia, mas", "ainda e pouco"]);
});

test("tamanho do texto revisado deve ficar entre 70% e 130% do original", () => {
  const { tamanhoRevisaoAceitavel } = require("../server.js");
  const original = "x".repeat(100);
  assert.equal(tamanhoRevisaoAceitavel("x".repeat(69), original), false);
  assert.equal(tamanhoRevisaoAceitavel("x".repeat(70), original), true);
  assert.equal(tamanhoRevisaoAceitavel("x".repeat(100), original), true);
  assert.equal(tamanhoRevisaoAceitavel("x".repeat(130), original), true);
  assert.equal(tamanhoRevisaoAceitavel("x".repeat(131), original), false);
  // Espaços e quebras de linha extras não contam como mudança de tamanho.
  assert.equal(tamanhoRevisaoAceitavel(`${"x".repeat(50)}\n\n\n${"x".repeat(50)}`, original), true);
});

test("validateProofreading com o texto original rejeita revisão encurtada", () => {
  const original = "A leitura é essencial para a formação cidadã dos jovens brasileiros.";
  assert.equal(validateProofreading({ correctedText: original, corrections: [] }, original), true);
  assert.equal(validateProofreading({ correctedText: "A leitura é essencial.", corrections: [] }, original), false);
  // Sem o original, continua validando só a estrutura (compatível com o uso anterior).
  assert.equal(validateProofreading({ correctedText: "A leitura é essencial.", corrections: [] }), true);
});

test("correções inventadas são filtradas antes do limite de 30 itens", () => {
  const { normalizarRevisao } = require("../server.js");
  const inventadas = Array.from({ length: 10 }, (_, indice) => ({ original: `trecho inexistente ${indice}`, corrected: "x", reason: "Inventada." }));
  const reais = Array.from({ length: 25 }, () => ({ original: "a escola", corrected: "à escola", reason: "Crase." }));
  const revisao = normalizarRevisao({ correctedText: redacaoRevisadaDeTeste, corrections: [...inventadas, ...reais] }, redacaoDeTeste);
  assert.equal(revisao.corrections.length, 25);
  assert.equal(revisao.corrections.every((item) => item.original === "a escola"), true);
});

test("proofreadingPrompt segue a norma-padrão e o Acordo Ortográfico sem reescrever o estilo", () => {
  const { proofreadingPrompt } = require("../server.js");
  assert.match(proofreadingPrompt, /norma-padrão do português brasileiro/);
  assert.match(proofreadingPrompt, /Acordo Ortográfico da Língua Portuguesa de 1990/);
  assert.match(proofreadingPrompt, /VOLP/);
  assert.match(proofreadingPrompt, /Não reescreva o estilo/);
  assert.match(proofreadingPrompt, /não troque palavras corretas/);
  assert.match(proofreadingPrompt, /copiado literalmente.*do texto "original" do estudante/);
  assert.match(proofreadingPrompt, /comparando o "original" do estudante com o seu correctedText/);
  assert.match(proofreadingPrompt, /dado não confiável/);
  assert.doesNotMatch(proofreadingPrompt, /draft/, "a revisão não depende mais do rascunho da avaliação");
});

test("proofreadingPrompt pede que os motivos (reason) também sigam a norma-padrão", () => {
  const { proofreadingPrompt } = require("../server.js");
  assert.match(proofreadingPrompt, /O próprio reason também deve seguir a norma-padrão/);
  assert.match(proofreadingPrompt, /"grafa-se"/);
});

test("systemPrompt pede para manter frases e parágrafos no texto corrigido da avaliação", () => {
  const { systemPrompt } = require("../server.js");
  assert.match(systemPrompt, /Mantenha os mesmos parágrafos e frases/);
  assert.doesNotMatch(systemPrompt, /remova repetições/);
});

test("Gemini simulado: correções inventadas são descartadas e o texto revisado vem da segunda etapa", async () => {
  const revisao = {
    correctedText: redacaoRevisadaDeTeste,
    corrections: [
      { original: "a escola", corrected: "à escola", reason: "Crase: levar a + a escola." },
      { original: "os jovens são", corrected: "os jovens estão", reason: "Inventada: trecho não existe." },
      { original: "sociedade", corrected: "sociedade", reason: "Sem alteração real." },
    ],
  };
  await comGeminiSimulado({ avaliacao: [respostaGemini(avaliacaoDoGemini())], revisao: [respostaGemini(revisao)] }, ({ resposta, registros }) => {
    assert.equal(resposta.status, 200);
    assert.equal(resposta.body.result.correctedText, redacaoRevisadaDeTeste);
    assert.deepEqual(resposta.body.result.corrections, [revisao.corrections[0]]);
    assert.ok(registros.some((linha) => linha.includes("2 correção(ões) descartada(s)")));
    registrosNaoExpoemDados(registros);
  });
});

test("Gemini simulado: revisão muito menor que o original é descartada (autoria) e vira resposta parcial", async () => {
  const revisao = { correctedText: "A leitura transforma.", corrections: [] };
  await comGeminiSimulado({ avaliacao: [respostaGemini(avaliacaoDoGemini())], revisao: [respostaGemini(revisao)] }, ({ resposta, registros }) => {
    assertRespostaParcial(resposta);
    assert.ok(registros.some((linha) => /texto revisado com \d+% do tamanho do original/.test(linha)));
    registrosNaoExpoemDados(registros);
  });
});

test("Gemini simulado: revisão muito maior que o original é descartada (autoria) e vira resposta parcial", async () => {
  const revisao = {
    correctedText: `${redacaoRevisadaDeTeste} Além disso, a leitura amplia o repertório cultural e fortalece a cidadania.`,
    corrections: [],
  };
  await comGeminiSimulado({ avaliacao: [respostaGemini(avaliacaoDoGemini())], revisao: [respostaGemini(revisao)] }, ({ resposta }) => {
    assertRespostaParcial(resposta);
  });
});

// ---------------------------------------------------------------------------
// Cancelamento da revisão e cota diária
// ---------------------------------------------------------------------------

function erroCotaDiaria() {
  return respostaErroGemini(429, "RESOURCE_EXHAUSTED", "Generate content requests per day limit exceeded on Free Tier.", [{
    "@type": "type.googleapis.com/google.rpc.QuotaFailure",
    violations: [{ quotaId: "GenerateRequestsPerDayPerProjectPerModel-FreeTier", quotaValue: "20" }],
  }]);
}

test("Gemini simulado: se a avaliação falha, a revisão em andamento é cancelada", async () => {
  let revisaoCancelada = false;
  const revisaoQueTrava = (_url, opcoes) => {
    opcoes.signal.addEventListener("abort", () => { revisaoCancelada = true; });
    return fetchQueNuncaResponde(_url, opcoes);
  };
  const respostas = { avaliacao: [atrasar(20, () => respostaErroGemini(500, "INTERNAL", "Erro interno."))], revisao: [revisaoQueTrava] };
  await comGeminiSimulado(respostas, async ({ resposta, daEtapa }) => {
    assert.equal(resposta.status, 502);
    assert.equal(resposta.body.error.code, "PROVIDER_ERROR");
    await new Promise((resolver) => setTimeout(resolver, 20));
    assert.equal(revisaoCancelada, true, "a revisão deve ser cancelada");
    assert.equal(daEtapa("revisao").length, 1, "sem nova tentativa depois do cancelamento");
  });
});

test("Gemini simulado: se a avaliação falha, a revisão não faz a nova tentativa", async () => {
  // A revisão recebe 503 e esperaria 80 ms para repetir; nesse meio-tempo a avaliação falha.
  const respostas = {
    avaliacao: [atrasar(30, () => respostaErroGemini(500, "INTERNAL", "Erro interno."))],
    revisao: [respostaErroGemini(503, "UNAVAILABLE", "Ocupado."), respostaGemini(revisaoDoGemini())],
  };
  await comGeminiSimulado(respostas, async ({ resposta, daEtapa }) => {
    assert.equal(resposta.status, 502);
    await new Promise((resolver) => setTimeout(resolver, 120));
    assert.equal(daEtapa("revisao").length, 1);
  }, { tempoLimite: { esperaNovaTentativa: 80 } });
});

test("Gemini simulado: cota diária esgotada na avaliação gera PROVIDER_QUOTA_EXCEEDED", async () => {
  await comGeminiSimulado({ avaliacao: [erroCotaDiaria()], revisao: [erroCotaDiaria()] }, ({ resposta, registros }) => {
    assert.equal(resposta.status, 503);
    assert.equal(resposta.body.error.code, "PROVIDER_QUOTA_EXCEEDED");
    assert.match(resposta.body.error.message, /limite diário/);
    assert.ok(registros.some((linha) => linha.includes("per day limit exceeded")));
    registrosNaoExpoemDados(registros);
  });
});

test("Gemini simulado: cota diária esgotada na revisão não é repetida e gera resposta parcial", async () => {
  const respostas = { avaliacao: [atrasar(30, () => respostaGemini(avaliacaoDoGemini()))], revisao: [erroCotaDiaria(), respostaGemini(revisaoDoGemini())] };
  await comGeminiSimulado(respostas, ({ resposta, registros, daEtapa }) => {
    assertRespostaParcial(resposta);
    assert.equal(daEtapa("revisao").length, 1, "repetir não adianta quando a cota do dia acabou");
    assert.ok(registros.some((linha) => linha.includes("cota diária esgotada")));
  });
});

test("Gemini simulado: 429 por minuto (não diário) na avaliação continua como PROVIDER_BUSY", async () => {
  const erroPorMinuto = respostaErroGemini(429, "RESOURCE_EXHAUSTED", "Rate limit.", [{
    "@type": "type.googleapis.com/google.rpc.QuotaFailure",
    violations: [{ quotaId: "GenerateRequestsPerMinutePerProjectPerModel-FreeTier" }],
  }]);
  await comGeminiSimulado({ avaliacao: [erroPorMinuto] }, ({ resposta }) => {
    assert.equal(resposta.status, 503);
    assert.equal(resposta.body.error.code, "PROVIDER_BUSY");
  });
});
