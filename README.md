# Entrelinhas ✳

**Entrelinhas** é um site para estudar redação para o Enem e os vestibulares. Nele você pode:

- explorar **temas** com teses e repertórios para usar na argumentação;
- consultar **gêneros textuais** (dissertação, artigo de opinião, carta aberta) com dicas para Enem, Fuvest e Unicamp;
- pesquisar **repertórios** (livros, filmes, filosofia, Constituição) com explicação de como usá-los;
- receber uma **correção com IA**: nota estimada nas 5 competências do Enem, revisão de ortografia e gramática e sugestões para a próxima versão.

> A nota da IA é uma **estimativa para estudo**, não uma correção oficial do Enem.

🌐 **Site no ar:** <https://professoralissonlucas.github.io/entrelinhas/>

---

## Como rodar no seu computador

**Você precisa de:** [Node.js](https://nodejs.org/) 20.6 ou mais novo. O projeto não tem dependências, então não há `npm install`.

1. Abra a pasta do projeto no terminal.
2. Copie o arquivo de exemplo de configuração:

   ```bash
   cp .env.example .env
   ```

3. Escolha como quer testar:
   - **Sem chave (modo demonstração):** no `.env`, coloque `ENTRELINHAS_TEST_MODE=true`. A correção sempre mostra uma nota de exemplo (880), sem usar a IA.
   - **Com a IA de verdade:** coloque a sua chave do Gemini em `GEMINI_API_KEY` (crie em <https://aistudio.google.com/apikey>) e deixe `apiBaseUrl: ""` no `config.js`.
4. Inicie o servidor:

   ```bash
   npm start
   ```

5. Abra <http://localhost:3000> no navegador.

Para rodar os testes automáticos:

```bash
npm test
```

> 🔒 **Nunca** coloque a chave do Gemini no `config.js`, no `wrangler.toml` nem em nenhum arquivo que vá para o GitHub. Ela fica só no `.env`, que o Git ignora.

---

## Como publicar

O projeto tem duas partes na internet:

| Parte | Onde fica | Como publicar |
|---|---|---|
| **Site** (páginas, estilos e scripts) | GitHub Pages | Automático: a cada `git push` na branch `main`, o GitHub roda os testes e, se passarem, publica o site. Acompanhe na aba **Actions** do repositório. |
| **Correção com IA** (guarda a chave em segredo) | Cloudflare Workers | Siga o passo a passo em [`worker/README.md`](worker/README.md). |

O endereço da correção na internet fica em `config.js`, no campo `apiBaseUrl`.

---

## Como o projeto é organizado

```text
index.html, styles.css, script.js, config.js   → o site
server.js                                      → servidor para rodar no computador (npm start)
lib/nucleo-correcao.js                         → a lógica da correção com IA (usada pelo servidor e pelo Worker)
worker/                                        → a correção com IA na internet (Cloudflare)
test/                                          → testes automáticos (npm test)
SPEC.MD                                        → documentação técnica completa
```

Para mexer no projeto, leia antes o [`SPEC.MD`](SPEC.MD), que explica tudo em detalhe. Uma regra importante: **o visual do site não deve ser alterado** (cores, fontes, textos e layout).

---

## Créditos

- **Projeto e orientação:** [@professoralissonlucas](https://github.com/professoralissonlucas)
- **Turma:** _Bruna Affonso e Maria Fernanda_
- **Correção com IA:** [Google Gemini](https://ai.google.dev/) (modelo `gemini-3.5-flash`)
- **Hospedagem:** [GitHub Pages](https://pages.github.com/) (site) e [Cloudflare Workers](https://workers.cloudflare.com/) (correção)
- **Fontes:** [Manrope](https://fonts.google.com/specimen/Manrope) e [DM Sans](https://fonts.google.com/specimen/DM+Sans), via Google Fonts (licença SIL Open Font License)
