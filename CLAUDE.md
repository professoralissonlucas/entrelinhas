# CLAUDE.md — Regras permanentes do projeto Entrelinhas

Contexto completo do projeto (arquitetura, API, limites, erros): veja `SPEC.MD`.

## Regras obrigatórias

1. **Não alterar o visual.**
   - Proibido modificar `styles.css`.
   - No `index.html`, proibido mudar classes, cores, fontes, textos visíveis, ordem dos elementos ou layout.
   - Permitido no `index.html` apenas: corrigir atributos de acessibilidade (`aria-*`, `role`, `for`, `alt` etc.) e `id`s quebrados.
   - Mudanças de comportamento devem ser feitas em código JavaScript (`script.js`) e Node.js (`server.js`).
   - Textos gerados pelo JavaScript que aparecem na tela também fazem parte do visual: não alterar sem pedido explícito.

2. **Zero dependências npm.** Não adicionar `dependencies` nem `devDependencies` ao `package.json`. Usar apenas módulos nativos do Node.js (`node:http`, `node:fs`, `node:test` etc.) e APIs nativas do navegador.

3. **Português brasileiro em tudo:** código novo (nomes descritivos quando fizer sentido), mensagens ao usuário, mensagens de log, comentários, testes e documentação.

4. **Testes a cada mudança.** Rodar `npm test` depois de cada alteração. A tarefa só está concluída se todos os testes passarem. Ao mudar comportamento do backend, adicionar ou ajustar testes em `test/`.

5. **Sem commits e sem push.** Não executar `git commit`, `git push` nem qualquer comando que altere o histórico ou o remoto. O professor faz isso manualmente.

6. **Manter o `SPEC.MD` atualizado** sempre que um comportamento, limite, rota, código de erro, variável de ambiente ou teste mudar.

7. **Lógica da correção só no núcleo.** Validações, prompts, schemas, chamadas ao Gemini, códigos de erro e modo demonstração ficam em `lib/nucleo-correcao.js`, usado pelo `server.js` (local) e pelo `worker/src/index.mjs` (Cloudflare). Não duplique essa lógica nos dois. O núcleo deve continuar:
   - em CommonJS (`module.exports`);
   - sem APIs exclusivas do Node (`fs`, `path`, `http`, `process`, `Buffer`);
   - sem estado global: a configuração chega por parâmetro.

8. **Publicação no GitHub Pages pelo workflow** `.github/workflows/pages.yml`: ele roda `npm test` e publica só `index.html`, `styles.css`, `script.js`, `config.js` e `.nojekyll`. Se a página passar a usar outro arquivo, inclua-o em `arquivos_do_site`, ajuste a contagem e os testes do workflow.

## Comandos

```bash
npm start   # inicia o servidor em http://localhost:3000
npm test    # executa os testes com node:test (servidor, núcleo, frontend e Worker)
```

Worker (dentro de `worker/`, com `npx`, sem adicionar o wrangler ao `package.json`):

```bash
npx wrangler deploy --dry-run   # empacota e confere sem publicar
```

Não rode `npx wrangler deploy`, `secret put` nem `login`: publicar é tarefa do professor (ver `worker/README.md`).

## Observações

- Node.js 20.6 ou superior.
- A chave `GEMINI_API_KEY` fica somente no `.env` (ignorado pelo git) e nunca deve ir para o frontend, para o código ou para a documentação. O `config.js` é público (GitHub Pages): só pode conter `apiBaseUrl`.
- O frontend também é publicado no GitHub Pages, em `/entrelinhas/`: use sempre caminhos relativos (nada começando com `/`). A CSP existe em dois lugares, no cabeçalho do `server.js` (`politicaDeSeguranca`) e na `<meta>` do `index.html`, e precisa ser igual nos dois.
- `ENTRELINHAS_TEST_MODE=true` permite testar a interface sem chave (nota fixa de 880).
- Os testes não usam rede: o Gemini é simulado com `setTestConfiguration({ fetch })`. Todo teste que muda a configuração deve restaurá-la no final (`apiKey: ""`, `fetch: null`, `tempoLimite: null`), para não depender do `.env` local.
