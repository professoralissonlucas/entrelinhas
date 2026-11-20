// Configuração do frontend do Entrelinhas. Carregado antes do script.js.
//
// apiBaseUrl: endereço base da API de correção.
// - Vazio ("") → usa a mesma origem da página. É o modo local (npm start), em que o server.js serve a página e a API.
// - Preenchido → usa outra origem, por exemplo o Worker do Cloudflare:
//     apiBaseUrl: "https://entrelinhas-api.SEU-USUARIO.workers.dev"
//   (sem barra no final; a API deve aceitar requisições vindas do site do GitHub Pages via CORS).
//
// Este arquivo é público: NUNCA coloque a chave do Gemini aqui.
window.ENTRELINHAS_CONFIG = {
  apiBaseUrl: "",
};
