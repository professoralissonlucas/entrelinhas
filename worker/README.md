# API do Entrelinhas no Cloudflare (passo a passo)

O site do Entrelinhas fica no **GitHub Pages**, que só publica arquivos e não guarda segredos. A correção das redações precisa da chave do Gemini, que **não pode** ficar no site. Por isso a correção roda num **Cloudflare Worker**: um pequeno servidor gratuito na internet que guarda a chave em segredo e conversa com o Gemini.

Você vai fazer isso **uma vez só**. Leva cerca de 15 minutos.

```text
Aluna no navegador ──► site no GitHub Pages ──► Worker no Cloudflare (guarda a chave) ──► Gemini
```

---

## O que você precisa ter

- O **Node.js** instalado (o mesmo usado para `npm start` e `npm test`). Para conferir, abra o terminal e digite `node --version`.
- A sua **chave do Gemini** (a mesma do arquivo `.env`), criada em <https://aistudio.google.com/apikey>.
- Um **e-mail** para criar a conta no Cloudflare.

Nos comandos abaixo, digite (ou copie) **apenas o texto da caixa** e aperte **Enter**.

---

## Passo 1 — Criar a conta grátis no Cloudflare

1. Acesse <https://dash.cloudflare.com/sign-up>.
2. Informe e-mail e senha e clique em **Sign up** (Criar conta).
3. Abra o e-mail de confirmação e clique no link.
4. Não é preciso cadastrar cartão nem comprar domínio: o plano **Free** (gratuito) é suficiente.

## Passo 2 — Abrir o terminal na pasta `worker`

No VS Code, abra o projeto e use o menu **Terminal → Novo Terminal**. Depois entre na pasta do Worker:

```bash
cd worker
```

> Todos os comandos dos próximos passos devem ser rodados **dentro da pasta `worker`**.

## Passo 3 — Entrar na sua conta pelo terminal

```bash
npx wrangler login
```

- Na primeira vez, o terminal pergunta se pode instalar o `wrangler` (a ferramenta oficial do Cloudflare). Digite `y` e aperte Enter.
- O navegador abre uma página do Cloudflare. Clique em **Allow** (Permitir).
- Quando o terminal mostrar `Successfully logged in`, pode voltar para ele.

## Passo 4 — Guardar a chave do Gemini em segredo

```bash
npx wrangler secret put GEMINI_API_KEY
```

1. Se o terminal perguntar se deseja criar um novo Worker chamado `entrelinhas-api`, digite `y` e aperte Enter.
2. Quando aparecer `Enter a secret value`, **cole a sua chave do Gemini** e aperte Enter.
   - Ao colar, **nada aparece na tela**. Isso é normal, é uma proteção.
3. Deve aparecer `✨ Success! Uploaded secret GEMINI_API_KEY`.

> A chave fica guardada só no Cloudflare. **Nunca** a coloque no `config.js`, no `wrangler.toml` nem em nenhum arquivo do projeto, porque esses arquivos ficam públicos no GitHub.

## Passo 5 — Publicar o Worker

```bash
npx wrangler deploy
```

- Na primeira publicação, o Cloudflare pode pedir que você escolha um **subdomínio** `workers.dev` (por exemplo, `professoralisson`). Escolha um nome simples. Ele faz parte do endereço e não precisa ser repetido depois.
- No final, o terminal mostra o endereço do seu Worker, parecido com:

```text
https://entrelinhas-api.professoralisson.workers.dev
```

**Copie esse endereço.** Ele vai no próximo passo.

## Passo 6 — Conferir se o Worker está no ar

Abra no navegador o endereço copiado, acrescentando `/api/health` no final:

```text
https://entrelinhas-api.professoralisson.workers.dev/api/health
```

Deve aparecer:

```json
{"status":"ok"}
```

## Passo 7 — Ligar o site ao Worker (`config.js`)

1. Na **pasta principal do projeto** (fora da pasta `worker`), abra o arquivo `config.js`.
2. Cole o endereço do Worker entre as aspas de `apiBaseUrl`, **sem** `/api/health` e **sem barra no final**:

```js
window.ENTRELINHAS_CONFIG = {
  apiBaseUrl: "https://entrelinhas-api.professoralisson.workers.dev",
};
```

3. Salve, faça o commit e o push para o GitHub, como você já faz.
4. Aguarde 1 ou 2 minutos e abra o site: <https://professoralissonlucas.github.io/entrelinhas/>. Teste uma correção.

> Para continuar usando o **modo local** (`npm start`) no seu computador, deixe `apiBaseUrl: ""`. Com o endereço preenchido, o site local também passa a usar o Worker.

---

## Opcional (recomendado) — Limite de uso compartilhado

Para proteger a sua cota do Gemini, o Worker permite **10 correções a cada 10 minutos por aluno** (por endereço de internet, o IP). Quem passar disso recebe: *"Você atingiu o limite de 10 correções a cada 10 minutos. Aguarde cerca de X minutos e tente novamente."*

- **Sem este passo:** o limite já funciona, mas fica na memória de cada servidor do Cloudflare, então a proteção é **aproximada**.
- **Com este passo:** o limite vale para **todos** os servidores do Cloudflare ao mesmo tempo.

1. Na pasta `worker`, crie o armazenamento:

   ```bash
   npx wrangler kv namespace create LIMITE_USO
   ```

2. O terminal mostra um trecho com `id = "..."`. Copie o código entre as aspas.
3. Abra `worker/wrangler.toml`, apague o `#` do começo destas três linhas e cole o código no lugar de `COLE_AQUI_O_ID_DO_KV`:

   ```toml
   [[kv_namespaces]]
   binding = "LIMITE_USO"
   id = "o-código-que-você-copiou"
   ```

4. Publique de novo:

   ```bash
   npx wrangler deploy
   ```

> O plano gratuito permite 1.000 gravações por dia nesse armazenamento (uma por correção). Se esse número for ultrapassado, o Worker **não para**: ele volta a usar o limite em memória até o dia seguinte.

---

## Tarefas do dia a dia

| Quero… | O que fazer (sempre dentro da pasta `worker`) |
|---|---|
| Publicar uma mudança no código | `npx wrangler deploy` |
| Trocar a chave do Gemini | `npx wrangler secret put GEMINI_API_KEY` e colar a nova chave (vale na hora, sem precisar publicar de novo) |
| Demonstrar o site **sem gastar cota** | No `wrangler.toml`, troque para `ENTRELINHAS_TEST_MODE = "true"` e rode `npx wrangler deploy`. A nota de demonstração é sempre 880. Depois volte para `"false"` e publique de novo. |
| Trocar o modelo do Gemini | No `wrangler.toml`, altere `GEMINI_MODEL` e rode `npx wrangler deploy` |
| Ver os registros (logs) de erro | Painel <https://dash.cloudflare.com> → **Workers & Pages** → `entrelinhas-api` → **Logs**. Erros do Gemini aparecem com o prefixo `[Gemini]`. A redação das alunas e a chave **nunca** aparecem nos registros. |
| Tirar o Worker do ar | `npx wrangler delete` |

---

## Se algo der errado

| Mensagem no site | O que significa | O que fazer |
|---|---|---|
| "O serviço de correção está indisponível no momento…" | O site não conseguiu falar com o Worker | Confira o endereço em `config.js` (passo 7), sem barra no final, e teste o `/api/health` (passo 6) |
| "O serviço de correção ainda não foi configurado." | O Worker está sem a chave | Refaça o passo 4 |
| "A chave da API de IA não foi aceita…" | A chave está errada ou foi apagada | Gere outra chave no AI Studio e refaça o passo 4 |
| "O modelo de IA configurado (…) não está disponível…" | O nome do modelo mudou | Ajuste `GEMINI_MODEL` no `wrangler.toml` e publique de novo |
| "O limite diário de uso da IA foi atingido…" | Acabou a cota gratuita do Gemini do dia (20 pedidos por dia; cada correção usa 2) | Espere o dia seguinte ou ative o faturamento no AI Studio |
| "Você atingiu o limite de 10 correções a cada 10 minutos…" | Proteção da cota funcionando | A aluna espera o tempo indicado |
| No terminal: `You are not authenticated` | O login expirou | Rode `npx wrangler login` de novo |

---

## Segurança — o que já vem configurado

- **Chave em segredo:** fica só no secret `GEMINI_API_KEY` do Cloudflare.
- **Só o seu site pode usar a API pelo navegador:** são aceitos apenas `https://professoralissonlucas.github.io` e `http://localhost:3000`. Pedidos vindos de outros sites são recusados antes de gastar cota. A lista fica em `worker/src/index.mjs`, em `origensPermitidas`.
- **Limite por IP:** 10 correções a cada 10 minutos. Pedidos inválidos (campos vazios, texto grande demais) não contam.
- **Mesmas regras do servidor local:** validações, prompts, notas, revisão ortográfica e mensagens de erro vêm do mesmo arquivo usado pelo `npm start` (`lib/nucleo-correcao.js`).

## Para quem for mexer no código

- **Arquivos:** `src/index.mjs` é o Worker (rotas, CORS e limite por IP). A lógica da correção fica em `../lib/nucleo-correcao.js`, compartilhada com o `server.js`. O `wrangler` junta tudo num pacote ao publicar.
- **Testes:** `npm test`, na pasta principal, testa também o Worker, sem internet e sem gastar cota (`test/worker.test.js`).
- **Testar sem publicar:** `npx wrangler deploy --dry-run` monta o pacote e confere a configuração sem publicar nada.
