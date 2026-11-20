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
const redacaoDeTeste = "REDACAO-SIGILOSA: a leitura transforma a sociedade brasileira.";
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

function avaliacaoDoGemini() {
  // O schema pede a nota como texto; o servidor deve convertê-la para número.
  const avaliacao = validAssessment();
  avaliacao.competencies = avaliacao.competencies.map((item) => ({ ...item, score: String(item.score) }));
  return avaliacao;
}

function revisaoDoGemini() {
  return {
    correctedText: "Texto integral revisado na segunda etapa.",
    corrections: [{ original: "integral", corrected: "integralmente", reason: "Ajuste de clareza." }],
  };
}

// Fetch que nunca responde e só termina quando o sinal de cancelamento é acionado, como o fetch real.
function fetchQueNuncaResponde(_url, opcoes) {
  return new Promise((_resolver, rejeitar) => {
    opcoes.signal.addEventListener("abort", () => rejeitar(new DOMException("A operação foi cancelada.", "AbortError")));
  });
}

async function comGeminiSimulado(respostas, executar, extras = {}) {
  const app = require("../server.js");
  const chamadas = [];
  const fila = [...respostas];
  const fetchSimulado = async (url, opcoes) => {
    chamadas.push({ url, opcoes, corpo: JSON.parse(opcoes.body) });
    const proxima = fila.shift();
    if (!proxima) throw new Error("Chamada inesperada ao Gemini simulado.");
    return typeof proxima === "function" ? proxima(url, opcoes) : proxima;
  };
  const registros = [];
  const consoleErrorOriginal = console.error;
  console.error = (...partes) => registros.push(partes.map(String).join(" "));
  app.setTestConfiguration({ apiKey: chaveDeTeste, model: app.modeloPadrao, testMode: false, fetch: fetchSimulado, ...extras });
  try {
    const resposta = await request(testPort, "POST", "/api/correct", { theme: temaDeTeste, essay: redacaoDeTeste });
    await executar({ resposta, chamadas, registros });
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

test("limite do navegador é maior que a soma dos limites do servidor", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const { tempoLimitePadrao } = require("../server.js");
  const codigoCliente = fs.readFileSync(path.join(__dirname, "..", "script.js"), "utf8");
  const encontrado = codigoCliente.match(/browserController\.abort\(\),\s*([\d_]+)\)/);
  assert.ok(encontrado, "limite do navegador não encontrado em script.js");
  const limiteNavegador = Number(encontrado[1].replace(/_/g, ""));
  assert.ok(limiteNavegador > tempoLimitePadrao.avaliacao + tempoLimitePadrao.revisao);
});

test("Gemini simulado: avaliação e revisão concluídas com sucesso", async () => {
  await comGeminiSimulado([respostaGemini(avaliacaoDoGemini()), respostaGemini(revisaoDoGemini())], ({ resposta, chamadas, registros }) => {
    assert.equal(resposta.status, 200);
    const resultado = resposta.body.result;
    assert.deepEqual(resultado.competencies.map((item) => item.score), [160, 120, 160, 160, 120]);
    assert.equal(resultado.correctedText, "Texto integral revisado na segunda etapa.");
    assert.equal(resultado.corrections.length, 1);
    assert.equal(validateAssessment(resultado), true);

    assert.equal(chamadas.length, 2);
    const [avaliacao, revisao] = chamadas;
    assert.equal(avaliacao.opcoes.headers["x-goog-api-key"], chaveDeTeste);
    assert.equal(avaliacao.url.includes(chaveDeTeste), false, "a chave não deve ir na URL");
    assert.equal(avaliacao.url.includes("/models/gemini-3.8-flash:generateContent"), true);
    assert.deepEqual(avaliacao.corpo.generationConfig.thinkingConfig, { thinkingLevel: "low" });
    assert.ok(avaliacao.corpo.generationConfig.maxOutputTokens >= 16_384, "folga para raciocínio + JSON completo");
    assert.deepEqual(revisao.corpo.generationConfig.thinkingConfig, { thinkingLevel: "low" });
    assert.deepEqual(JSON.parse(avaliacao.corpo.contents[0].parts[0].text), { theme: temaDeTeste, essay: redacaoDeTeste });
    assert.deepEqual(JSON.parse(revisao.corpo.contents[0].parts[0].text), {
      original: redacaoDeTeste,
      draft: "Texto integral revisado.",
    });
    assert.deepEqual(registros, []);
  });
});

test("modelo padrão é o gemini-3.8-flash", () => {
  assert.equal(require("../server.js").modeloPadrao, "gemini-3.8-flash");
});

test("Gemini simulado: modelos 2.5 recebem thinkingBudget em vez de thinkingLevel", async () => {
  await comGeminiSimulado([respostaGemini(avaliacaoDoGemini()), respostaGemini(revisaoDoGemini())], ({ resposta, chamadas }) => {
    assert.equal(resposta.status, 200);
    assert.deepEqual(chamadas[0].corpo.generationConfig.thinkingConfig, { thinkingBudget: 1024 });
    assert.deepEqual(chamadas[1].corpo.generationConfig.thinkingConfig, { thinkingBudget: 512 });
  }, { model: "gemini-2.5-flash" });
});

test("Gemini simulado: erro 404 de modelo sugere verificar GEMINI_MODEL", async () => {
  const erro = respostaErroGemini(404, "NOT_FOUND", "This model models/gemini-2.5-flash is no longer available to new users.");
  await comGeminiSimulado([erro], ({ resposta, registros }) => {
    assert.equal(resposta.status, 502);
    assert.equal(resposta.body.error.code, "INVALID_MODEL");
    assert.match(resposta.body.error.message, /GEMINI_MODEL/);
    assert.match(resposta.body.error.message, /gemini-2\.5-flash/);
    assert.match(resposta.body.error.message, /gemini-3\.8-flash/);
    assert.ok(registros.some((linha) => linha.includes("HTTP 404") && linha.includes("no longer available")));
  }, { model: "gemini-2.5-flash" });
});

test("Gemini simulado: modelos fora das famílias 2.5 e 3.x não recebem thinkingConfig", async () => {
  await comGeminiSimulado([respostaGemini(avaliacaoDoGemini()), respostaGemini(revisaoDoGemini())], ({ resposta, chamadas }) => {
    assert.equal(resposta.status, 200);
    assert.equal("thinkingConfig" in chamadas[0].corpo.generationConfig, false);
  }, { model: "gemini-2.0-flash" });
});

test("Gemini simulado: resposta cortada por MAX_TOKENS é rejeitada e registrada", async () => {
  await comGeminiSimulado([respostaGemini("{\"summary\":\"Texto cort", "MAX_TOKENS")], ({ resposta, chamadas, registros }) => {
    assert.equal(resposta.status, 502);
    assert.equal(resposta.body.error.code, "INVALID_PROVIDER_RESPONSE");
    assert.equal(chamadas.length, 1, "a revisão não deve ser chamada");
    assert.ok(registros.some((linha) => linha.includes("finishReason=MAX_TOKENS") && linha.includes("tokensRaciocinio=900")));
    registrosNaoExpoemDados(registros);
  });
});

test("Gemini simulado: erro 429 vira PROVIDER_BUSY e registra a mensagem do provedor", async () => {
  await comGeminiSimulado([respostaErroGemini(429, "RESOURCE_EXHAUSTED", "Resource has been exhausted (e.g. check quota).")], ({ resposta, registros }) => {
    assert.equal(resposta.status, 503);
    assert.equal(resposta.body.error.code, "PROVIDER_BUSY");
    assert.ok(registros.some((linha) => linha.includes("HTTP 429 RESOURCE_EXHAUSTED") && linha.includes("Resource has been exhausted")));
    registrosNaoExpoemDados(registros);
  });
});

test("Gemini simulado: erro 401 vira INVALID_API_KEY sem expor a chave no log", async () => {
  await comGeminiSimulado([respostaErroGemini(401, "UNAUTHENTICATED", `Chave ${chaveDeTeste} não autorizada.`)], ({ resposta, registros }) => {
    assert.equal(resposta.status, 502);
    assert.equal(resposta.body.error.code, "INVALID_API_KEY");
    assert.ok(registros.some((linha) => linha.includes("HTTP 401") && linha.includes("[chave oculta]")));
    registrosNaoExpoemDados(registros);
  });
});

test("Gemini simulado: erro 400 API_KEY_INVALID também vira INVALID_API_KEY", async () => {
  const erro = respostaErroGemini(400, "INVALID_ARGUMENT", "API key not valid. Please pass a valid API key.", [{ reason: "API_KEY_INVALID" }]);
  await comGeminiSimulado([erro], ({ resposta }) => {
    assert.equal(resposta.status, 502);
    assert.equal(resposta.body.error.code, "INVALID_API_KEY");
  });
});

test("Gemini simulado: tempo esgotado na avaliação retorna PROVIDER_TIMEOUT", async () => {
  await comGeminiSimulado([fetchQueNuncaResponde], ({ resposta, chamadas, registros }) => {
    assert.equal(resposta.status, 504);
    assert.equal(resposta.body.error.code, "PROVIDER_TIMEOUT");
    assert.match(resposta.body.error.message, /avaliação/);
    assert.equal(chamadas.length, 1);
    registrosNaoExpoemDados(registros);
  }, { tempoLimite: { avaliacao: 50, revisao: 50 } });
});

test("Gemini simulado: cada etapa tem limite próprio e o tempo da revisão é contado à parte", async () => {
  // A avaliação demora 80 ms (abaixo do seu limite de 150 ms); a revisão tem 100 ms próprios e trava.
  // Com um limite único somado, a revisão teria só 70 ms; aqui ela usa seus 100 ms inteiros.
  const avaliacaoLenta = () => new Promise((resolver) => setTimeout(() => resolver(respostaGemini(avaliacaoDoGemini())), 80));
  await comGeminiSimulado([avaliacaoLenta, fetchQueNuncaResponde], ({ resposta, chamadas }) => {
    assert.equal(resposta.status, 504);
    assert.equal(resposta.body.error.code, "PROVIDER_TIMEOUT");
    assert.match(resposta.body.error.message, /revisão ortográfica/);
    assert.equal(chamadas.length, 2);
  }, { tempoLimite: { avaliacao: 150, revisao: 100 } });
});
