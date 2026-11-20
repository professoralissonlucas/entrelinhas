import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    })
);

const key = env.GEMINI_API_KEY;
const model = env.GEMINI_MODEL || "gemini-2.5-flash";
const base = "https://generativelanguage.googleapis.com/v1beta";

if (!key) {
  console.log("❌ GEMINI_API_KEY vazia no .env");
  process.exit(1);
}

const r = await fetch(`${base}/models/${model}:generateContent`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-goog-api-key": key },
  body: JSON.stringify({ contents: [{ parts: [{ text: "Responda apenas: OK" }] }] }),
});
const data = await r.json();
console.log(`Modelo: ${model} | Status: ${r.status}`);

if (r.ok) {
  console.log("✅ Funcionou! Resposta:", data.candidates?.[0]?.content?.parts?.map((p) => p.text).join(""));
} else {
  console.log("❌ Erro:", data.error?.message);
  if (r.status === 404) {
    const lista = await (await fetch(`${base}/models`, { headers: { "x-goog-api-key": key } })).json();
    console.log("Modelos disponíveis (escolha um 'flash' e coloque no GEMINI_MODEL do .env):");
    (lista.models || [])
      .filter((m) => m.supportedGenerationMethods?.includes("generateContent") && m.name.includes("flash"))
      .forEach((m) => console.log("  -", m.name.replace("models/", "")));
  }
}