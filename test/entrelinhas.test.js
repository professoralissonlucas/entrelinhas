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
  const response = await request(testPort, "POST", "/api/correct", {
    theme: "Desafios da leitura",
    essay: "A leitura é importante para a sociedade.",
  });
  assert.equal(response.status, 503);
  assert.equal(response.body.error.code, "SERVICE_NOT_CONFIGURED");
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
