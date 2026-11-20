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

## Comandos

```bash
npm start   # inicia o servidor em http://localhost:3000
npm test    # executa os testes com node:test
```

## Observações

- Node.js 20.6 ou superior.
- A chave `GEMINI_API_KEY` fica somente no `.env` (ignorado pelo git) e nunca deve ir para o frontend, para o código ou para a documentação.
- `ENTRELINHAS_TEST_MODE=true` permite testar a interface sem chave (nota fixa de 880).
- Os testes esperam que não haja `GEMINI_API_KEY` nem `ENTRELINHAS_TEST_MODE=true` no ambiente ao rodar `npm test`.
