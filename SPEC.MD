# Especificação do Projeto — Entrelinhas

> Documento de contexto do projeto. Descreve o estado atual do código (`index.html`, `styles.css`, `script.js`, `server.js`, `test/`) e deve ser mantido em sincronia com ele.

## 1. Visão geral

**Entrelinhas** é uma aplicação web em português brasileiro voltada ao estudo e à preparação para a produção de redações em vestibulares, especialmente o Enem.

A plataforma oferece:

- consulta a temas de redação com eixo temático, motivação e principais desafios;
- sugestões de teses e repertórios socioculturais por tema;
- explicações pedagógicas detalhadas de repertórios (o que é, origem, contexto, como usar etc.);
- consulta a gêneros textuais, suas estruturas e dicas para Enem, Fuvest e Unicamp;
- correção automática de redações com avaliação pelas cinco competências do Enem (via Google Gemini);
- revisão ortográfica e gramatical independente, com lista das alterações;
- geração de uma versão corrigida da redação, que pode ser copiada;
- resumo de pontos fortes e prioridades de melhoria;
- modo de demonstração que dispensa a chave da API.

A nota da IA é apresentada explicitamente como uma estimativa para estudo, não como correção oficial.

## 2. Objetivos

### Objetivo principal

Ajudar estudantes a organizar ideias, encontrar repertórios e compreender a qualidade de uma redação por meio de uma avaliação estruturada.

### Objetivos secundários

- facilitar a busca por temas e referências;
- orientar o estudante sobre formatos textuais;
- explicar a matriz de correção do Enem em linguagem didática;
- preservar a autoria e o conteúdo original da redação durante a revisão;
- oferecer uma interface simples, rápida e acessível.

## 3. Público-alvo

- estudantes que se preparam para vestibulares;
- professores que desejam usar a ferramenta como apoio pedagógico;
- candidatos que querem praticar redação e identificar erros recorrentes;
- usuários que procuram repertórios e referências para argumentação.

## 4. Tecnologia

### Stack atual

- **Frontend:** HTML5, CSS3 e JavaScript puro (sem frameworks, sem módulos ES, script carregado com `defer`);
- **Backend local:** Node.js com módulos nativos `node:http`, `node:fs` e `node:path` (`server.js`);
- **Backend na internet:** Cloudflare Worker (`worker/`), publicado com `npx wrangler deploy`;
- **Núcleo compartilhado:** `lib/nucleo-correcao.js` (CommonJS, sem APIs exclusivas do Node), usado pelo `server.js` e pelo Worker;
- **API de IA:** Google Gemini (`generativelanguage.googleapis.com/v1beta`, método `generateContent`), chamada via `fetch` nativo;
- **Modelo padrão:** `gemini-3.8-flash` (configurável). O `gemini-2.5-flash` não está mais disponível para chaves novas (o Google responde 404);
- **Testes:** executor nativo `node:test` com `node:assert/strict`;
- **Hospedagem local:** servidor Node.js na porta 3000 por padrão.

O projeto **não possui dependências npm** (nem `dependencies` nem `devDependencies`), framework frontend, banco de dados, bundler ou etapa de build. O carregamento do `.env` é feito por uma função própria (`loadLocalEnv`), sem `dotenv`. O `wrangler`, usado só para publicar o Worker, é executado com `npx`, sem entrar no `package.json`.

### Estrutura de arquivos

```text
affonso/
├── index.html              # estrutura da página e semântica dos componentes
├── styles.css              # identidade visual, layout responsivo e estados (~1.470 linhas)
├── config.js               # configuração pública do frontend (apiBaseUrl), carregada antes do script.js
├── script.js               # dados da biblioteca, renderização, busca, modal e integração com a API (~990 linhas)
├── server.js               # servidor local: .env, estáticos, rotas e leitura do corpo; usa o núcleo (~200 linhas)
├── lib/
│   └── nucleo-correcao.js  # núcleo compartilhado: validações, prompts, schemas, Gemini e fluxo da correção (~690 linhas)
├── worker/
│   ├── src/index.mjs       # Cloudflare Worker: rotas, CORS, preflight e limite por IP; usa o núcleo
│   ├── wrangler.toml       # configuração do Worker (GEMINI_MODEL, ENTRELINHAS_TEST_MODE, KV opcional)
│   └── README.md           # passo a passo de publicação para o professor
├── test/
│   ├── entrelinhas.test.js # testes do servidor local, do núcleo e do frontend (72 casos)
│   └── worker.test.js      # testes do Worker, sem rede (19 casos)
├── package.json            # metadados, engine e scripts start/test
├── .env.example            # modelo de variáveis de ambiente
├── .nojekyll               # arquivo vazio: o GitHub Pages publica os arquivos sem processar com Jekyll
├── .gitignore              # ignora .env, node_modules/, .wrangler/ e .dev.vars
├── .github/workflows/
│   └── pages.yml           # GitHub Actions: roda npm test e publica só os arquivos do site no Pages
└── SPEC.MD                 # este documento
```

## 5. Execução do projeto

### Requisitos

- Node.js 20.6 ou superior (definido em `engines` do `package.json`);
- chave de API do Gemini em variável de ambiente (dispensável no modo de demonstração);
- conexão com a internet para usar o serviço de correção real e carregar as fontes do Google Fonts.

### Configuração

Copie `.env.example` para `.env` na raiz do projeto:

```env
GEMINI_API_KEY=cole_sua_chave_aqui
GEMINI_MODEL=gemini-3.8-flash
PORT=3000
ENTRELINHAS_TEST_MODE=false
```

| Variável | Obrigatória | Padrão | Função |
|---|---|---|---|
| `GEMINI_API_KEY` | Sim, para correção real | — | Chave enviada ao Gemini no cabeçalho `x-goog-api-key`. |
| `GEMINI_MODEL` | Não | `gemini-3.8-flash` | Modelo usado nas duas chamadas. |
| `PORT` | Não | `3000` | Porta do servidor HTTP. |
| `ENTRELINHAS_TEST_MODE` | Não | `false` | Quando `true`, retorna uma avaliação fixa de demonstração sem chamar o Gemini. |

Regras do carregador `.env`:

- ignora linhas vazias, comentários (`#`) e linhas sem `=`;
- remove aspas simples ou duplas ao redor do valor;
- **não sobrescreve** variáveis já definidas no ambiente do processo;
- se o arquivo não existir, nada acontece.

### Comandos

```bash
npm start   # node server.js
npm test    # node --test test/*.test.js
```

A aplicação ficará disponível em `http://localhost:3000`.

## 6. Arquitetura

### Visão geral

```text
Modo local (npm start):
Navegador ──GET estáticos / POST api/correct──► server.js (node:http) ─┐
                                                                       ├─► lib/nucleo-correcao.js ──► Gemini
Produção:                                                              │     (avaliação ∥ revisão)
Navegador ◄── GitHub Pages (estáticos)                                 │
    └──POST https://…workers.dev/api/correct──► worker/src/index.mjs ──┘
                                                 (CORS + limite por IP)
```

- **Núcleo compartilhado (`lib/nucleo-correcao.js`):** contém validações, prompts, schemas, chamadas ao Gemini, nova tentativa, resposta parcial, códigos de erro e modo demonstração. A função principal é `avaliarRedacao(corpo, configuracao)`, que devolve `{ status, payload, cabecalhos }` sem depender de Node nem de Workers. `interpretarCorpoJson` e `respostasComuns` padronizam os erros de corpo e rota (415, 413, 400, 405, 404).
- **CommonJS e ESM:** o núcleo usa `module.exports`. O `server.js` faz `require("./lib/nucleo-correcao.js")`. O Worker (`.mjs`, ESM) faz `import nucleo from "../../lib/nucleo-correcao.js"`. Tanto o Node (nos testes) quanto o esbuild do `wrangler` (no deploy) entregam o `module.exports` como importação padrão, sem dependências. Isso foi conferido com `npx wrangler deploy --dry-run`: o pacote gerado contém o núcleo e executa corretamente.
- **Regras do núcleo:** nenhuma API exclusiva do Node (`fs`, `path`, `http`, `process`, `Buffer`) e nenhum estado global. Chave, modelo, `fetch` e limites de tempo chegam pelo parâmetro `configuracao`. Um teste garante isso.

### Frontend

Página única com conteúdo renderizado por JavaScript a partir de dados embutidos em `script.js`. A única dependência externa são as fontes do Google Fonts. O `config.js` (carregado antes, também com `defer`) define `window.ENTRELINHAS_CONFIG.apiBaseUrl`, e `montarUrlDaApi` monta a URL da API a partir dele (ver seção 20.2). Todos os arquivos locais usam caminhos relativos, para funcionar tanto em `http://localhost:3000/` quanto em `https://professoralissonlucas.github.io/entrelinhas/`.

Principais áreas da interface:

1. cabeçalho e navegação;
2. seção hero;
3. corretor com IA (`#correcao`);
4. biblioteca (`#biblioteca`) com abas Temas, Gêneros textuais e Repertórios;
5. guia de gêneros (exibido no lugar da grade quando a aba Gêneros está ativa);
6. diálogo modal (`<dialog id="theme-dialog">`) reutilizado para estudo de tema e para detalhe de repertório;
7. rodapé.

Todo conteúdo dinâmico é criado com `document.createElement` e `textContent` (não há `innerHTML` com dados de usuário ou da IA; o único `innerHTML` é o rótulo fixo do botão de avaliação).

### Backend

Servidor HTTP nativo que atende:

- arquivos estáticos de uma lista branca;
- `POST /api/correct` para avaliação da redação;
- `GET /api/health` para verificação de disponibilidade.

`server.js` só chama `server.listen` quando executado diretamente (`require.main === module`). Ele lê o `.env`, serve os estáticos, lê o corpo em partes (interrompendo ao passar de 20.000 bytes) e entrega o corpo a `nucleo.avaliarRedacao`. Quando importado, exporta para os testes:

- `server` e `politicaDeSeguranca`;
- reexportados do núcleo: `validateInput`, `validateAssessment`, `validateProofreading`, `parseCandidate`, `createTestAssessment`, `normalizarAvaliacao`, `normalizarRevisao`, `filtrarCorrecoes`, `tamanhoRevisaoAceitavel`, `systemPrompt`, `proofreadingPrompt`, `responseSchema`, `proofreadingSchema`, `tempoLimitePadrao` e `modeloPadrao`;
- `setTestConfiguration({ apiKey, model, testMode, fetch, tempoLimite })` para alterar a configuração em tempo de execução. `fetch` substitui o fetch usado nas chamadas ao Gemini (`null` restaura o real); `tempoLimite` recebe `{ avaliacao, revisao }` em ms (`null` restaura os padrões).

## 7. Estrutura da interface

### 7.1 Cabeçalho

- marca **entrelinhas** com o símbolo "e.";
- frase "Seu próximo argumento começa aqui.";
- link "Explorar biblioteca ↗" para `#biblioteca`.

### 7.2 Hero

- selo "REPERTÓRIO PARA IR MAIS LONGE";
- título "Ideias que viram grandes redações.";
- descrição da proposta;
- botão "Encontrar inspiração ↓" para a biblioteca;
- composição decorativa (`aria-hidden`) com órbitas, brilhos e o lembrete "Escrever é pensar em voz alta.";
- indicador decorativo "01 / 03".

### 7.3 Corretor com IA

Campos:

- **Proposta de redação** (`#essay-theme`), até 1.500 caracteres (`maxlength`), com dica sobre sua importância e contador acessível oculto ("N de 1500 caracteres");
- **Sua redação** (`#text-to-correct`), até 5.000 caracteres (`maxlength`), com contador visível ("N caracteres", singular para 1).

Ações:

- **Limpar**: esvazia os dois campos, remove `aria-invalid`, restaura o estado vazio do resultado, restaura no status o aviso inicial de que a nota é uma estimativa, desabilita o botão de copiar e foca a redação;
- **Avaliar redação**: valida os campos (primeiro a redação, depois a proposta), envia a requisição e exibe o resultado;
- **Copiar versão revisada**: copia o `correctedText` para a área de transferência.

Durante a avaliação: botão desabilitado com texto "Avaliando...", status "Avaliando as competências e revisando a ortografia... Isso pode levar até 2 minutos.", `aria-busy="true"` no painel e timeout de 135 segundos no navegador (`AbortController`), maior que o prazo total do servidor (120 s).

O painel de resultado apresenta, nesta ordem:

1. cartão de nota — "Nota estimada" (ou "Nota de demonstração" no modo teste) com `soma/1000`;
2. visão geral (`summary`);
3. avaliação por competência — título da competência, `nota/200`, justificativa, evidência e "Para melhorar" (sugestões concatenadas, se houver);
4. correções ortográficas e gramaticais (`original → corrigido` + motivo; sem itens, a mensagem de que não foram necessárias alterações ou, na resposta parcial, a de que a revisão detalhada não pôde ser concluída);
5. texto corrigido;
6. pontos fortes;
7. prioridades para a próxima versão.

Títulos exibidos das competências:

1. Competência 1 · Modalidade escrita formal
2. Competência 2 · Tema e repertório
3. Competência 3 · Projeto de texto e argumentação
4. Competência 4 · Coesão
5. Competência 5 · Proposta de intervenção

Mensagens finais de status:

- sucesso: "Avaliação concluída. A nota é uma estimativa de estudo, não uma correção oficial do Enem.";
- sucesso sem a revisão detalhada (`proofreadingUnavailable: true`): "Avaliação concluída, mas a revisão ortográfica detalhada não pôde ser concluída desta vez; o texto revisado exibido é preliminar. A nota é uma estimativa de estudo, não uma correção oficial do Enem.";
- modo demonstração: informa que os 880 pontos são fixos e não representam avaliação real;
- erro do servidor: exibe `error.message` retornado pela API;
- timeout do navegador (`AbortError`) tem mensagem própria;
- API indisponível: "O serviço de correção está indisponível no momento. A biblioteca de temas, gêneros e repertórios continua funcionando; tente avaliar a redação mais tarde." Vale para falha de rede, DNS, CORS ou CSP, para resposta de erro sem o JSON da API (ex.: 404/405 do GitHub Pages), para resposta sem JSON e para `apiBaseUrl` inválido. O detalhe técnico (URL e status) vai só para o console.

### 7.4 Biblioteca

Controles:

- abas `Temas`, `Gêneros textuais` e `Repertórios` (`aria-pressed`, classe `is-active`);
- campo de busca com atalho `/` (oculto na aba Gêneros);
- rótulo da categoria e contagem de resultados ("1 resultado" / "N resultados" / "3 gêneros");
- estado vazio "Nenhum resultado por aqui. Tente outra busca.".

**Busca:** sem diferenciar maiúsculas e acentos (normalização NFD + `toLocaleLowerCase("pt-BR")`), filtrando por substring sobre:

- Temas: eixo temático, título, motivação, principais desafios, teses e título/relação dos repertórios socioculturais;
- Repertórios: tag, título, descrição curta e os campos detalhados do painel (o que é, origem, contexto, ideia central, relação com a sociedade, como usar, exemplo, atenção e eixos).

**Cartões de Temas:** eixo temático, número sequencial, título, motivação, lista "PRINCIPAIS DESAFIOS" e botão "Ver argumentos e repertórios ↗", que abre o painel de estudo com:

- "Teses para inspirar" — cada tese numerada ("Possibilidade N") com botão Copiar;
- "Repertórios socioculturais" — categoria, título e relação com o tema, botão Copiar e, quando o título corresponde a um item da aba Repertórios (comparação normalizada exata ou por inclusão), botão "Ler explicação pedagógica" que abre o detalhe desse repertório no mesmo diálogo.

**Cartões de Repertórios:** tag, número, título, descrição e botão "Consultar repertório ↗", que abre o detalhe com: tag, eixos (`axes`) como chips e as seções "O que é", "Origem", "Contexto", "Ideia central", "Relação com a sociedade", "Como utilizar na redação", "Exemplo de aplicação" e "Atenção", além do botão "Copiar repertório completo".

**Guia de Gêneros:** seletor de três gêneros (`aria-pressed`), descrição, estrutura em três etapas numeradas e "Dicas por banca" (Enem, Fuvest, Unicamp), com nota final lembrando que a proposta da prova deve prevalecer.

### 7.5 Rodapé

Marca, frase "Escreva o seu caminho." e legenda "FEITO PARA QUEM TEM O QUE DIZER".

## 8. Dados da biblioteca

Os dados ficam fixos em `script.js` (objeto `library` e array `genreGuides`), sem banco de dados.

### Conteúdo atual

**Temas (6):**

| Eixo | Título |
|---|---|
| Tecnologia | Os desafios da inclusão digital no Brasil |
| Saúde | Saúde mental entre adolescentes: cuidado e acolhimento |
| Educação | Desafios para a formação de leitores no Brasil |
| Cidadania | Caminhos para enfrentar a desinformação |
| Meio ambiente | O combate ao desperdício de alimentos |
| Tecnologia | Os impactos da inteligência artificial na educação |

**Repertórios (6):**

| Tag | Título |
|---|---|
| Literatura | Quarto de Despejo, de Carolina Maria de Jesus |
| Sociologia | A sociedade do espetáculo, de Guy Debord |
| Cinema | O Dilema das Redes (2020) |
| Filosofia | Contrato social, de Jean-Jacques Rousseau |
| Constituição | Constituição Federal de 1988 |
| Literatura | A Hora da Estrela, de Clarice Lispector |

**Gêneros (3):** Dissertação-argumentativa (Enem) — `dissertacao-enem`; Artigo de opinião — `artigo-opiniao`; Carta aberta / manifesto — `carta-manifesto`.

### Estrutura de um tema (`library.temas[]`)

```js
{
  eixoTematico: "Tecnologia",
  title: "…",
  motivacao: "…",
  principaisDesafios: ["…"],
  teses: ["…"],
  repertoriosSocioculturais: [
    { categoria: "Constituição", titulo: "…", relacao: "…" }
  ]
}
```

### Estrutura de um repertório (`library.repertorios[]`)

```js
{
  tag: "Literatura",
  title: "…",
  description: "…",        // texto curto do cartão
  whatIs: "…",
  origin: "…",
  context: "…",
  centralIdea: "…",
  societyRelation: "…",
  howToUse: "…",
  applicationExample: "…",
  attention: "…",
  axes: ["Educação", "Desigualdade"]
}
```

Campos detalhados ausentes são simplesmente omitidos no painel.

### Estrutura de um gênero (`genreGuides[]`)

```js
{
  id: "dissertacao-enem",
  title: "…",
  description: "…",
  structure: [{ title: "Introdução", description: "…" }],
  tips: { Enem: "…", Fuvest: "…", Unicamp: "…" }
}
```

## 9. API de correção

### Endpoint

```http
POST /api/correct
Content-Type: application/json
```

### Corpo da requisição

```json
{
  "theme": "Texto da proposta de redação",
  "essay": "Texto da redação do estudante"
}
```

### Resposta de sucesso (200)

```json
{
  "result": {
    "summary": "Síntese geral da avaliação",
    "competencies": [
      {
        "score": 160,
        "rationale": "Justificativa",
        "evidence": "Trecho literal ou Não identificada",
        "suggestions": ["Sugestão específica"]
      }
    ],
    "correctedText": "Versão revisada (vinda da segunda revisão)",
    "strengths": ["Ponto forte"],
    "nextSteps": ["Próxima prioridade"],
    "corrections": [
      {
        "original": "forma original",
        "corrected": "forma corrigida",
        "reason": "Motivo da alteração"
      }
    ]
  }
}
```

No modo de demonstração a resposta inclui também `"testMode": true`.

### Resposta parcial (200)

Se a avaliação der certo e a revisão falhar, a avaliação **não é descartada**. A revisão pode falhar por 429/503 também na nova tentativa, por cota diária esgotada, por outro erro HTTP, por tempo esgotado, por resposta inválida ou por violar a regra de 70% a 130%. Nesse caso a resposta traz:

```json
{
  "result": {
    "summary": "…",
    "competencies": ["…"],
    "correctedText": "Texto revisado pela primeira etapa (avaliação)",
    "strengths": ["…"],
    "nextSteps": ["…"],
    "corrections": [],
    "proofreadingUnavailable": true
  }
}
```

- `correctedText` vem da primeira etapa. Se esse texto também violar a regra de 70% a 130%, o servidor devolve o texto original do estudante, para preservar a autoria.
- No frontend, `isAssessmentResponse` aceita `proofreadingUnavailable` (booleano); quando ele é `true`, exige `corrections` vazio.
- O status mostra: "Avaliação concluída, mas a revisão ortográfica detalhada não pôde ser concluída desta vez; o texto revisado exibido é preliminar. A nota é uma estimativa de estudo, não uma correção oficial do Enem."
- A seção de correções explica que a lista não pôde ser obtida, em vez de dizer que não havia erros.

### Fluxo do backend

1. lê o corpo (exige `Content-Type` contendo `application/json`; limite de 20.000 bytes);
2. valida `theme` e `essay` (`validateInput`);
3. se `ENTRELINHAS_TEST_MODE` estiver ativo, retorna `createTestAssessment` sem chamar a IA;
4. se não houver `GEMINI_API_KEY`, retorna 503 `SERVICE_NOT_CONFIGURED`;
5. inicia **ao mesmo tempo** a avaliação (`chamarGemini`) e a revisão (`executarRevisao`), com um prazo total comum de 120 s;
6. se a avaliação falhar, responde com o erro correspondente e **cancela a revisão** em andamento, inclusive a nova tentativa, para não gastar cota;
7. se a avaliação der certo, aguarda a revisão:
   - revisão aprovada: substitui `correctedText` pelo da revisão, anexa `corrections` e responde 200;
   - revisão indisponível: responde 200 com a resposta parcial (`proofreadingUnavailable: true`).

## 10. Processo de avaliação da IA

Ambas as chamadas passam pela função `chamarGemini` e usam `system_instruction` com o prompt, o conteúdo do usuário serializado como JSON, `responseMimeType: "application/json"`, `responseSchema` próprio e `temperature: 0.2`. A chave vai no cabeçalho `x-goog-api-key`, nunca na URL.

| Etapa | Gemini 3.x (`thinkingLevel`) | Gemini 2.5 (`thinkingBudget`) | `maxOutputTokens` | Limite de tempo |
|---|---|---|---|---|
| Avaliação | `"low"` | 1.024 | 24.576 | 115 s |
| Revisão (cada tentativa) | `"low"` | 512 | 16.384 | 115 s, cortado pelo prazo restante |
| Prazo total da requisição | — | — | — | 120 s |
| Navegador (`script.js`) | — | — | — | 135 s |

- **Raciocínio (thinking):** nos modelos Gemini 2.5 e 3.x, os tokens de raciocínio contam dentro de `maxOutputTokens`. O parâmetro é escolhido por `montarConfiguracaoRaciocinio` conforme o nome do modelo:
  - `gemini-3*` (incluindo o padrão `gemini-3.8-flash`): `thinkingConfig.thinkingLevel`. Os valores aceitos são `low`, `medium` e `high`; `minimal` não é aceito no 3.8. `"low"` é o menor nível disponível e, nas medições, já resultou em **0 tokens de raciocínio** nas duas etapas;
  - `gemini-2.5*`: `thinkingConfig.thinkingBudget` em tokens (512 é o mínimo do `2.5-flash-lite` e vale para flash e pro);
  - outros nomes (por exemplo, `gemini-flash-latest`): nenhum `thinkingConfig`.
- **Etapas em paralelo:** a revisão parte só do texto original (`{ original }`) e não depende da avaliação. Por isso as duas chamadas começam juntas e o tempo total é o da etapa mais lenta, não a soma.
- **Regra dos limites:** limite de cada etapa (115 s) < prazo total do servidor (120 s) < limite do navegador (135 s). Há um teste automatizado que garante essa ordem e uma folga mínima de 10 s.
- **Nova tentativa da revisão:** em 429 ou 503, a revisão espera 2 s e tenta mais uma vez, desde que ainda restem pelo menos 10 s do prazo total. Não há nova tentativa quando a cota diária acabou (429 com `quotaId` contendo `PerDay`), nem para outros erros. A avaliação não é repetida.
- **Cancelamento:** `chamarGemini` aceita `sinalCancelamento`; o tempo esgotado gera `PROVIDER_TIMEOUT` e o cancelamento gera um erro interno `CANCELADA`.
- **Schema compatível com o Gemini:** a API só aceita `enum` em campos `STRING`. A nota de cada competência é pedida como texto (`"0"`, `"40"` … `"200"`, `format: "enum"`) e convertida para número por `normalizarAvaliacao`. Os schemas também usam `minItems`/`maxItems` (5 competências, até 5 sugestões, de 1 a 5 pontos fortes e próximos passos, até 30 correções).
- **Normalização:** antes da validação, `normalizarAvaliacao` converte as notas e corta listas acima do limite, e `normalizarRevisao` filtra as correções inventadas e corta `corrections` em 30 itens. Notas fora dos níveis continuam sendo rejeitadas.

**Medições reais (19/11/2026), plano gratuito da chave do projeto:**

| Configuração | Avaliação | Revisão | Total para a aluna |
|---|---|---|---|
| Antes: etapas em sequência, `gemini-3.8-flash` | 99,5 s | 32,2 s | **131,7 s** |
| Depois: etapas em paralelo, `gemini-3.5-flash`* | 16,3 s | 62,3 s | **62,3 s** (em sequência seriam 78,5 s) |

\* A cota diária do `gemini-3.8-flash` foi esgotada durante as medições, e o `gemini-3.7-flash` é encaminhado pelo Google para o 3.8, dividindo a mesma cota. Por isso o teste "depois" usou o `gemini-3.5-flash`, da mesma família 3.x, com o mesmo `thinkingLevel`.

- **O gargalo é fila no Google, não geração:** um pedido de **1 token** ao `gemini-3.8-flash` levou de 35 s a 112 s. Por isso reduzir o prompt ou o raciocínio quase não muda o tempo.
- **Prompt mais enxuto:** uma versão com limites de tamanho na saída gerou 1.265 tokens contra 1.340 do atual, sem ganho de tempo mensurável. O prompt foi mantido; só a instrução de remover repetições foi trocada por "mantenha os mesmos parágrafos e frases", porque o texto da primeira etapa agora serve de reserva na resposta parcial.
- **Raciocínio:** `thinkingBudget: 0` e `thinkingLevel: "low"` deram o mesmo resultado (0 tokens de raciocínio). Mantém-se `"low"`, que é o parâmetro documentado para os modelos 3.x.

1. **Avaliação principal** (`systemPrompt`, entrada `{ theme, essay }`)
   - avalia somente o texto e a proposta, tratando ambos como dados não confiáveis;
   - atribui a cada competência uma nota entre 0, 40, 80, 120, 160 ou 200, sem inflar notas nem descontar o mesmo problema duas vezes;
   - justifica cada nota, cita evidência literal curta (ou "Não identificada") e dá sugestões acionáveis;
   - produz um `correctedText` que mantém os mesmos parágrafos e frases (usado como reserva se a revisão falhar);
   - identifica pontos fortes e próximos passos.

2. **Revisão independente** (`proofreadingPrompt`, entrada `{ original }`, em paralelo com a avaliação)
   - segue a norma-padrão do português brasileiro e a ortografia do Acordo Ortográfico de 1990 vigente (VOLP/ABL), com exemplos no próprio prompt ("ideia", "frequente", "voo", "autoestima");
   - corrige somente erros inequívocos de ortografia, acentuação, crase, concordância, regência, pontuação contrária à norma, maiúsculas e sintaxe defeituosa;
   - não reescreve o estilo, não troca vocabulário correto por sinônimos, não remove nem junta frases ou parágrafos e mantém as escolhas facultativas do estudante (vírgulas e crases facultativas);
   - devolve o texto completo e lista cada erro em `corrections` em relação ao texto original: `original` é um trecho literal da redação, `corrected` é o trecho corrigido e `reason` começa pela categoria ("Crase: …", "Acentuação: …", "Concordância verbal: …");
   - o próprio `reason` também deve seguir a norma-padrão (por exemplo, "grafa-se", com hífen).

**Regras aplicadas pelo servidor à revisão:**

- **Correções inventadas:** `filtrarCorrecoes` descarta itens cujo `original` não existe na redação do estudante (comparação com espaços normalizados e Unicode NFC), cujo `original` é igual ao `corrected` (inclusive se só os espaços diferem) ou que estão malformados. A filtragem ocorre antes do corte em 30 itens. A quantidade descartada é registrada no log, sem os trechos.
- **Preservação da autoria:** se o texto revisado tiver menos de 70% ou mais de 130% do tamanho da redação original (espaços normalizados), a revisão é descartada, a porcentagem vai para o log e a resposta passa a ser parcial.
- **Texto exibido:** quando a revisão dá certo, o `correctedText` vem dela (segunda chamada). O frontend mostra cada correção como `original → corrected`, seguida do motivo.

**Testes reais com 12 erros propositais** (601 caracteres: 7 de acentuação, 2 de crase, 2 de concordância verbal, 1 de vírgula entre sujeito e verbo, além de "afim de que"):
- com o `gemini-3.8-flash` (fluxo em sequência) e com o `gemini-3.5-flash` (fluxo em paralelo), a revisão corrigiu e listou os **12 erros**, com o motivo correto;
- manteve intactos os trechos corretos "acesso a livros", "acesso a bibliotecas" e "desde a infância";
- o texto revisado ficou com 100% do tamanho original;
- depois da instrução sobre o `reason`, os motivos vieram com "grafa-se" e "escreve-se" corretos.

`parseCandidate` concatena as partes de texto do primeiro candidato, ignorando partes marcadas como `thought` (raciocínio interno), rejeita respostas com `finishReason` `MAX_TOKENS`, `SAFETY` ou `RECITATION`, remove cercas ```` ```json ```` se existirem e faz `JSON.parse` (retorna `null` em falha).

A nota final é a soma das cinco competências (máximo de 1.000), calculada no frontend.

## 11. Critérios das competências

1. Domínio da modalidade escrita formal: gramática, convenções, registro e construção sintática.
2. Compreensão da proposta, atendimento ao tema e ao gênero dissertativo-argumentativo, incluindo uso pertinente e produtivo de repertório.
3. Seleção, organização e interpretação de informações, fatos e argumentos; autoria e progressão argumentativa.
4. Coesão e articulação entre frases e parágrafos, sem uso mecânico de conectivos.
5. Proposta de intervenção relacionada ao problema, concreta e respeitosa aos direitos humanos (agente, ação, meio/modo, finalidade/efeito e detalhamento).

## 12. Modo de demonstração

Ativado por `ENTRELINHAS_TEST_MODE=true` (ou `setTestConfiguration({ testMode: true })`). Tem precedência sobre a verificação da chave.

- notas fixas `[160, 160, 160, 200, 200]` = **880 pontos**;
- `summary` começa com "Modo de demonstração:" — é por esse prefixo que o frontend detecta o modo e troca os rótulos;
- `correctedText` é a redação original, sem alterações;
- `corrections` é um array vazio;
- justificativas, evidências, pontos fortes e próximos passos deixam claro que não houve avaliação real.

## 13. Validações e limites

### Frontend

- redação e proposta obrigatórias (texto não vazio após `trim`), com `aria-invalid` e foco no campo faltante;
- limites de caracteres aplicados via atributo `maxlength` (1.500 e 5.000);
- resposta validada por `isAssessmentResponse`: cinco competências, notas apenas em {0, 40, 80, 120, 160, 200}, `summary` e `correctedText` não vazios, `corrections` obrigatório com no máximo 30 itens, `strengths` e `nextSteps` com 1 a 5 itens não vazios;
- timeout de 135 segundos;
- aceita a resposta parcial (`proofreadingUnavailable: true` com `corrections` vazio) e rejeita `proofreadingUnavailable` não booleano ou parcial com correções.

### Backend

| Item | Limite / regra |
|---|---|
| Corpo da requisição | até 20.000 bytes (413 se exceder) |
| `Content-Type` | deve conter `application/json` (415 caso contrário) |
| `theme` | string não vazia, até 1.500 caracteres |
| `essay` | string não vazia, até 5.000 caracteres |
| Tempo | avaliação 115 s; revisão 115 s por tentativa; prazo total 120 s (etapas em paralelo); navegador 135 s |
| Nova tentativa | só na revisão, 1 vez, após 2 s, em 429/503 (não na cota diária), se restarem ao menos 10 s |
| `competencies` | exatamente 5, notas permitidas 0–200 em passos de 40 |
| `summary`, `rationale` | até 4.000 caracteres |
| `evidence` | até 800 caracteres |
| `suggestions` | até 5 por competência, cada uma até 500 caracteres (pode ser vazio) |
| `strengths`, `nextSteps` | 1 a 5 itens, cada um até 500 caracteres |
| `correctedText` | não vazio, até 10.000 caracteres |
| `corrections` | até 30 (após descartar as inventadas); `original` e `corrected` até 300, `reason` até 500 caracteres; `original` deve existir na redação e ser diferente de `corrected` |
| `correctedText` da revisão | entre 70% e 130% do tamanho da redação original |

## 14. Segurança

Medidas implementadas:

- chave da API permanece no servidor e é enviada ao Gemini por cabeçalho, nunca ao navegador;
- `.env` listado no `.gitignore`;
- lista branca de arquivos estáticos (sem acesso arbitrário ao sistema de arquivos);
- limite de tamanho do corpo e dos campos;
- exigência de `Content-Type: application/json`;
- validação rigorosa da entrada e das respostas da IA;
- `X-Content-Type-Options: nosniff` em todas as respostas;
- `Cache-Control: no-store` nas respostas JSON e `no-cache` nos estáticos;
- Content Security Policy idêntica no cabeçalho do servidor local e na `<meta http-equiv>` do `index.html` (necessária no GitHub Pages, que não envia cabeçalhos personalizados): `default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://*.workers.dev; object-src 'none'; base-uri 'self'; form-action 'self'`. Um teste garante que as duas são iguais. Na `<meta>`, a diretiva `frame-ancestors` não tem efeito, por regra do navegador;
- prompts orientados a tratar tema e redação como dados não confiáveis e ignorar instruções contidas neles;
- renderização via `textContent`, evitando injeção de HTML vindo da IA;
- sem armazenamento das redações no servidor;
- logs de diagnóstico no console do servidor, com prefixo `[Gemini]` e a etapa (`avaliacao` ou `revisao`):
  - erro HTTP do provedor: status HTTP, status do provedor e mensagem do provedor (até 500 caracteres);
  - resposta fora do formato: `finishReason`, `blockReason` e contagem de tokens de raciocínio e de resposta;
  - tempo esgotado e falha de conexão;
  - os logs nunca contêm a redação, o tema nem a chave; qualquer ocorrência da chave em mensagens do provedor é trocada por `[chave oculta]`.

## 15. Endpoints e rotas

| Método | Rota | Resposta |
|---|---|---|
| `GET` | `/`, `/index.html` | página principal |
| `GET` | `/styles.css` | folha de estilos |
| `GET` | `/config.js` | configuração pública do frontend (`apiBaseUrl`) |
| `GET` | `/script.js` | JavaScript do cliente |
| `POST` | `/api/correct` | avaliação da redação |
| `GET` | `/api/health` | `{ "status": "ok" }` |

- método errado em `/api/correct` ou `/api/health`: 405 `METHOD_NOT_ALLOWED` com cabeçalho `Allow`;
- qualquer outra rota ou método: 404 `NOT_FOUND` em JSON;
- `GET /favicon.ico`: 204 sem conteúdo (o projeto não tem ícone; evita erro 404 no console);
- falha de leitura de arquivo estático: 500 `FILE_READ_ERROR`.

## 16. Respostas de erro

Formato:

```json
{
  "error": {
    "code": "CODIGO_DO_ERRO",
    "message": "Mensagem compreensível ao usuário"
  }
}
```

| Código | HTTP | Situação |
|---|---|---|
| `INVALID_REQUEST` | 400 / 413 / 415 | JSON inválido, corpo grande demais, `Content-Type` incorreto ou erro de leitura |
| `INVALID_INPUT` | 400 | tema/redação ausentes, de tipo errado ou acima do limite |
| `SERVICE_NOT_CONFIGURED` | 503 | `GEMINI_API_KEY` ausente (fora do modo teste) |
| `PROVIDER_BUSY` | 503 | Gemini retornou 429 por minuto ou 503 (sobrecarga) na avaliação |
| `PROVIDER_QUOTA_EXCEEDED` | 503 | Gemini retornou 429 de cota diária (`quotaId` com `PerDay`, por exemplo 20 requisições/dia no plano gratuito) |
| `INVALID_API_KEY` | 502 | Gemini retornou 401/403, ou 400 com motivo `API_KEY_INVALID` |
| `INVALID_MODEL` | 502 | Gemini retornou 404; a mensagem cita o modelo configurado e sugere verificar `GEMINI_MODEL` no `.env` (servidor local) ou no `wrangler.toml` (Worker), com padrão `gemini-3.8-flash` |
| `PROVIDER_ERROR` | 502 | outro erro HTTP do Gemini (mensagem diferente para avaliação e revisão) |
| `INVALID_PROVIDER_RESPONSE` | 502 | avaliação fora do schema ou incompleta |
| (sem código de erro) | 200 | a revisão falhou, mas a avaliação deu certo: resposta parcial com `proofreadingUnavailable: true` (ver seção 9) |
| `PROVIDER_TIMEOUT` | 504 | limite de tempo da avaliação (115 s) excedido; tempo esgotado na revisão gera resposta parcial |
| `PROVIDER_UNAVAILABLE` | 502 | falha de rede ao contatar o Gemini |
| `METHOD_NOT_ALLOWED` | 405 | método HTTP incorreto nas rotas de API |
| `NOT_FOUND` | 404 | rota inexistente |
| `FILE_READ_ERROR` | 500 | falha ao ler arquivo estático (só no servidor local) |
| `RATE_LIMITED` | 429 | só no Worker: passou de 10 correções a cada 10 minutos por IP; a mensagem diz quantos minutos esperar e há cabeçalho `Retry-After` |
| `CORS_NOT_ALLOWED` | 403 | só no Worker: pedido ou preflight vindo de uma origem fora da lista permitida |

## 17. Testes automatizados

`npm test` executa `test/*.test.js`: `entrelinhas.test.js` (72 casos) e `worker.test.js` (19 casos), num total de 91, todos sem rede. O mesmo `npm test` roda no GitHub Actions antes de cada publicação (seção 20.2).

`test/entrelinhas.test.js` sobe o servidor em porta aleatória (`listen(0, "127.0.0.1")`) e cobre:

- mensagens de `validateInput` para campos ausentes e limites, aceitando exatamente 1.500/5.000 caracteres;
- `validateAssessment` (cinco competências, nota inválida, objeto vazio);
- `validateProofreading`;
- `parseCandidate` (JSON válido, `MAX_TOKENS`, texto não JSON, bloco cercado inválido, resposta parcial);
- `GET /api/health` (200 e 405);
- `POST /api/correct` com entrada vazia (400 `INVALID_INPUT`), JSON malformado (400 `INVALID_REQUEST`), `Content-Type` `text/plain` (415) e sem chave configurada (503 `SERVICE_NOT_CONFIGURED`);
- página principal (200, `text/html`), rota inexistente (404 `NOT_FOUND`) e `/favicon.ico` (204);
- seis níveis de nota aceitos e valores inválidos rejeitados (`validateAssessment` e `normalizarAvaliacao`);
- `createTestAssessment` (880 pontos, notas fixas, texto preservado, prefixo do resumo);
- alternância de modo via `setTestConfiguration`;
- schemas sem `enum` fora de campos `STRING` e conversão da nota em texto para número;
- `parseCandidate` ignorando partes `thought`;
- limites de tempo: cada etapa < prazo total do servidor < limite do navegador em `script.js`, com folga de pelo menos 10 s, e espera curta antes da nova tentativa;
- **Gemini simulado** (fetch falso via `setTestConfiguration`, sem rede; responde por etapa, porque as chamadas são paralelas):
  - sucesso nas duas etapas, conferindo `thinkingConfig`, `maxOutputTokens`, a chave só no cabeçalho e a entrada `{ original }` da revisão;
  - avaliação e revisão começando juntas, com tempo total próximo ao da etapa mais lenta;
  - modelo 2.5 recebendo `thinkingBudget`, e modelo fora das famílias 2.5 e 3.x sem `thinkingConfig`;
  - erro 404 de modelo (502 `INVALID_MODEL`, mensagem citando `GEMINI_MODEL`);
  - modelo padrão `gemini-3.8-flash`;
  - resposta `MAX_TOKENS` na avaliação (502, com log de diagnóstico);
  - erro 429 na avaliação (503 `PROVIDER_BUSY`) e 429 por minuto que continua `PROVIDER_BUSY`;
  - cota diária esgotada na avaliação (503 `PROVIDER_QUOTA_EXCEEDED`);
  - erro 401 e erro 400 `API_KEY_INVALID` (502 `INVALID_API_KEY`);
  - tempo esgotado na avaliação (504 `PROVIDER_TIMEOUT`);
  - os logs não contêm a redação nem a chave.
- **nova tentativa e resposta parcial:**
  - 503 e 429 na revisão repetidos 1 vez, com espera, e a segunda tentativa aceita;
  - 503 duas vezes, erro 500, tempo esgotado, formato inválido e cota diária na revisão geram 200 com `proofreadingUnavailable: true`, `corrections: []` e o texto da primeira etapa, sem repetir no caso de erro 500 e de cota diária;
  - a nova tentativa respeita o prazo total;
  - o texto original do estudante é usado se o rascunho da avaliação violar a autoria;
  - a revisão é cancelada, sem nova tentativa, quando a avaliação falha;
- **frontend** (sem navegador, lendo `index.html` e `script.js`): `isAssessmentResponse` aceita a resposta parcial e rejeita combinações inválidas; o status avisa quando a revisão detalhada não foi concluída; ids referenciados por atributos de acessibilidade existem; a busca inclui os campos detalhados dos repertórios; o modo demonstração usa `testMode` com o prefixo como alternativa; o Limpar restaura o aviso de estimativa; `theme-study-button` só existe na aba Temas;
- **revisão ortográfica:**
  - `filtrarCorrecoes` (trecho inexistente, igual ao corrigido, diferença só de espaços, item malformado);
  - limites de 70% e 130% do tamanho e `validateProofreading` com o original;
  - filtragem antes do corte em 30 itens;
  - conteúdo do `proofreadingPrompt` (norma-padrão, Acordo Ortográfico, VOLP, sem reescrever o estilo, sem `draft`, `reason` na norma-padrão) e do `systemPrompt` (mantém frases e parágrafos);
  - com o Gemini simulado, descarte de correções inventadas e resposta parcial para revisões muito menores ou maiores que o original.

`test/worker.test.js` importa `worker/src/index.mjs` e chama `worker.fetch(new Request(...), env)` com um Gemini simulado. Ele cobre:
- **arquivos e ambiente:** o `wrangler.toml` (modelo, modo teste desligado, nenhuma chave no arquivo); o núcleo e o Worker sem APIs exclusivas do Node; os prompts e as validações existindo só no núcleo;
- **rotas e CORS:** `GET /api/health` com CORS; preflight `OPTIONS` (204 e cabeçalhos); origens não permitidas recusadas (403) sem chamar o Gemini; 405 com `Allow` e 404;
- **corpo e configuração:** validações do corpo (415, 400, 413, `INVALID_INPUT`); modo demonstração; ausência do secret (`SERVICE_NOT_CONFIGURED`);
- **fluxo com o Gemini simulado:** correção completa usando o secret e o `GEMINI_MODEL`; mensagem de 404 citando o `wrangler.toml`; logs sem redação e sem chave;
- **paridade:** os **mesmos 8 cenários do Gemini** rodados no `server.js` e no Worker, com status e corpo idênticos;
- **limite por IP:** 10 correções a cada 10 minutos, 429 em português com `Retry-After` e CORS, contagem separada por IP, reinício na janela seguinte, pedidos inválidos fora da contagem e bloqueio antes do Gemini;
- **KV:** contagem compartilhada entre dois Workers e volta automática ao limite em memória quando o KV falha.

Não há testes de frontend com navegador nem testes end-to-end automatizados. Os testes não chamam o Gemini real, então não garantem que a API real aceite o schema; isso só é verificado manualmente com uma chave.

Os testes que dependem da configuração (como `SERVICE_NOT_CONFIGURED`) a definem via `setTestConfiguration` e a restauram ao final, por isso não dependem do `.env` local.

## 18. Identidade visual

Identidade editorial e acolhedora, definida por variáveis CSS em `:root`:

| Token | Valor | Uso |
|---|---|---|
| `--ink` | `#271722` | texto principal |
| `--muted` | `#82727c` | texto secundário |
| `--pink` | `#f32978` | destaque |
| `--magenta` | `#c91668` | destaque escuro |
| `--rose` | `#ffe8f0` | fundos suaves |
| `--paper` | `#fffafc` | fundo da página |
| `--line` | `#f0e5ea` | bordas |
| `--display` | Manrope | títulos |
| `--body` | DM Sans | texto |

Características:

- cantos arredondados, cards em grade e etiquetas editoriais (símbolos ✳ ✦ ↗);
- estados de carregamento, desabilitado e foco visível;
- responsividade com breakpoints em `760px` e `520px`;
- suporte a `prefers-reduced-motion: reduce`;
- classe `.visually-hidden` para textos destinados a leitores de tela;
- apenas tema claro (não há modo escuro).

## 19. Comportamentos e acessibilidade

- `/` fora de campos editáveis foca a busca da biblioteca;
- abas e seletor de gêneros usam `aria-pressed`;
- grade com `aria-live="polite"` e `aria-busy` durante a renderização;
- resultados vazios exibem mensagem de estado vazio;
- o painel de estudo usa `<dialog>` nativo com `showModal()`, fechado pelo botão ×, pela tecla Esc ou por clique no fundo;
- mensagens de status (`#correction-summary`, `#copy-status`) usam `role="status"` / `aria-live`;
- botões de copiar usam a Clipboard API e informam sucesso ou falha;
- o botão de avaliação é desabilitado durante a requisição;
- o botão "Copiar versão revisada" só é habilitado após uma avaliação válida;
- elementos decorativos marcados com `aria-hidden="true"`.

## 20. Pontos de atenção observados no código

**Itens corrigidos (19/11/2026), sem alteração visual:**

- `aria-describedby` do campo da redação agora aponta para o contador real (`character-count`). Um teste verifica que todo id referenciado por `aria-describedby`, `aria-labelledby`, `aria-controls` e `for` existe e é único;
- o botão **Limpar** restaura o aviso "A nota é uma estimativa para estudo, não uma correção oficial do Enem." no status (`role="status"`). O texto é lido do próprio `index.html` na carga da página (`avisoEstimativa`), para não haver duas cópias;
- `theme-study-button` só é criado nos cartões da aba Temas;
- o modo demonstração é detectado pelo campo `testMode` da resposta; o prefixo "Modo de demonstração:" do `summary` continua como alternativa;
- a busca de repertórios inclui os campos detalhados (`whatIs`, `origin`, `context`, `centralIdea`, `societyRelation`, `howToUse`, `applicationExample`, `attention` e `axes`), por meio das funções `normalizarTextoBusca` e `textoPesquisavel`;
- o teste que não exercitava código da aplicação foi substituído por um que valida os seis níveis de nota (e a rejeição de valores inválidos) com `validateAssessment` e `normalizarAvaliacao`;
- `GET /favicon.ico` responde 204, eliminando o único erro que aparecia no console do navegador (404 do ícone pedido automaticamente).

**Verificação no navegador (Edge headless, 19/11/2026):** um roteiro de 40 passos percorreu as três abas, as buscas (com e sem acento, por campo detalhado e por eixo, além do estado vazio), o modal (tese, link para repertório, copiar, fechar por Esc, por clique no fundo e pelo ×), os três gêneros, o atalho `/` e o corretor (validações, contador, modo demonstração, copiar, Limpar e resposta parcial com Gemini simulado). Todos os passos passaram, com **0 erros ou avisos no console**.

**Itens ainda em aberto:**

- o vínculo tema → repertório depende da semelhança textual entre `titulo` e `title`;
- o `README` não existe; este SPEC é a principal documentação;
- o motivo (`reason`) é texto gerado pela IA; o prompt pede que siga a norma-padrão, mas ele não é revisado pelo servidor (antes dessa instrução, apareceu "grafase" em vez de "grafa-se");
- a avaliação em si não tem nova tentativa: um 503 nela ainda gera erro para a aluna;
- **cota do plano gratuito:** a chave atual tem **20 requisições por dia por modelo** no `gemini-3.8-flash`, e cada avaliação usa 2, o que dá cerca de 10 redações por dia para todos os usuários. O `gemini-3.7-flash` é encaminhado para o 3.8 e divide a mesma cota. Também há limite por minuto: pedidos simultâneos de alunas diferentes podem receber 429;
- **latência do plano gratuito:** a fila no Google variou de 35 s a 112 s mesmo para respostas de 1 token; o tempo de 2 minutos anunciado no status reflete esse cenário.

## 20.1 Cloudflare Worker (`worker/`)

Consulta à documentação oficial de limites ([developers.cloudflare.com/workers/platform/limits](https://developers.cloudflare.com/workers/platform/limits)) em 19/11/2026:

| Limite do Worker | Valor | Situação do Entrelinhas |
|---|---|---|
| Duração de uma requisição HTTP | sem limite | prazo total de 120 s: compatível |
| Tempo de CPU | 10 ms (gratuito); 30 s, ampliável a 5 min (pago) | a espera pelo `fetch` não conta como CPU; o servidor só monta e valida JSON pequeno, bem abaixo de 10 ms |
| Subrequisições por requisição | 50 (gratuito) | no máximo 3 (avaliação + revisão + 1 nova tentativa) |
| Tempo de cada subrequisição | sem limite fixo | os limites de tempo são aplicados pelo próprio código, com `AbortController` |

- `AbortController`, `setTimeout`, `fetch`, `Request`, `Response`, `TextEncoder` e `TextDecoder` existem nos Workers; por isso o núcleo roda nos dois ambientes sem mudança.
- Ponto a validar no deploy: o comportamento quando a aluna fecha a página no meio da avaliação. A documentação consultada não detalha isso.

**Implementação (`worker/src/index.mjs`):**

| Item | Comportamento |
|---|---|
| Rotas | `POST /api/correct` e `GET /api/health`, com o mesmo comportamento do `server.js` (405 com `Allow`, 404 `NOT_FOUND`); um teste compara as respostas dos dois para 8 cenários do Gemini. |
| Configuração | O secret `GEMINI_API_KEY` vem de `npx wrangler secret put GEMINI_API_KEY`. `GEMINI_MODEL = "gemini-3.8-flash"` e `ENTRELINHAS_TEST_MODE = "false"` ficam em `[vars]` do `wrangler.toml`. A mensagem de modelo indisponível aponta para o `wrangler.toml`. |
| CORS | `origensPermitidas` aceita somente `https://professoralissonlucas.github.io` e `http://localhost:3000`. O cabeçalho `Access-Control-Allow-Origin` devolve a origem exata, com `Vary: Origin` e `Access-Control-Expose-Headers: Retry-After`. Todas as respostas, inclusive os erros e o 429, levam CORS, para o navegador conseguir ler a mensagem. |
| Preflight | Em `OPTIONS` com origem permitida: 204, `Access-Control-Allow-Methods: GET, POST, OPTIONS`, `Access-Control-Allow-Headers: Content-Type` e `Access-Control-Max-Age: 86400`. Com origem não permitida: 403 `CORS_NOT_ALLOWED`. |
| Outras origens | Um `POST` vindo do navegador de outro site recebe 403 antes de qualquer chamada ao Gemini. Pedidos sem `Origin` (curl, monitoramento) são aceitos e continuam sujeitos ao limite por IP. |
| Limite por IP | 10 correções a cada 10 minutos (janela fixa), pelo cabeçalho `CF-Connecting-IP`. Ao passar do limite: 429 `RATE_LIMITED` com "Você atingiu o limite de 10 correções a cada 10 minutos. Aguarde cerca de N minutos e tente novamente." e `Retry-After`. Pedidos inválidos não contam; o bloqueio acontece antes de chamar o Gemini. |
| Onde o limite é guardado | Sem configuração extra, na memória de cada instância do Worker (proteção aproximada). Com o KV `LIMITE_USO` (opcional, passo no README), é compartilhado entre todas as instâncias. Se o KV falhar (por exemplo, ao passar das 1.000 gravações/dia do plano gratuito), o Worker volta à memória e registra `[Limite] KV indisponível…`. |
| Corpo | Lido em partes, com parada ao passar de 20.000 bytes (inclusive pelo `Content-Length`); os erros de corpo são os mesmos do servidor local. |
| Logs | `[observability] enabled = true`: os registros `[Gemini]` aparecem no painel da Cloudflare, sem redação e sem chave. |

**Verificação do empacotamento (19/11/2026):** `npx wrangler@4 deploy --dry-run` (wrangler 4.165.0) gerou o pacote, com 42,92 KiB e as variáveis `GEMINI_MODEL` e `ENTRELINHAS_TEST_MODE` reconhecidas. Executado no Node, o pacote respondeu 200 com CORS e nota 880 no modo demonstração, o que confirma o import do núcleo CommonJS.

**Publicação:** passo a passo para o professor em `worker/README.md` (conta grátis, `npx wrangler login`, `npx wrangler secret put GEMINI_API_KEY`, `npx wrangler deploy` e onde colar a URL no `config.js`).

## 20.2 Publicação do frontend no GitHub Pages

Endereço: `https://professoralissonlucas.github.io/entrelinhas/` (subpasta `/entrelinhas/`).

| Peça | Como funciona |
|---|---|
| `config.js` | `window.ENTRELINHAS_CONFIG = { apiBaseUrl: "" }`. Vazio = mesma origem (modo local com `npm start`); preenchido = URL do Worker, por exemplo `"https://entrelinhas-api.SEU-USUARIO.workers.dev"`. É público: nunca deve conter a chave. |
| `montarUrlDaApi(caminho, config)` | Com `apiBaseUrl` vazio, devolve o caminho relativo `api/correct`, que a página resolve (`/api/correct` localmente, `/entrelinhas/api/correct` no Pages). Com `apiBaseUrl` preenchido, junta a base e o caminho (aceita barra final e subcaminho). Rejeita endereços que não começam com `http(s)://`. |
| Caminhos relativos | `styles.css`, `config.js`, `script.js` e `api/correct` não começam com `/`. Um teste garante isso para todo `src`/`href`/`action` do `index.html` e para o `fetch`. |
| CSP | Vai na `<meta http-equiv>`, porque o Pages não envia cabeçalhos personalizados. `connect-src 'self' https://*.workers.dev` permite chamar o Worker e bloqueia qualquer outro domínio. |
| API indisponível | Mensagem clara no status existente, sem elementos visuais novos (ver seção 7.3). |
| `.nojekyll` | Arquivo vazio na raiz: o Pages publica os arquivos como estão, sem passar pelo Jekyll. |
| Modo local | `server.js` serve `config.js` na lista branca de estáticos; `npm start` continua funcionando. |

**Verificação (19/11/2026)** com Edge headless contra um servidor que imita o Pages (arquivos em `/entrelinhas/`, sem cabeçalhos próprios, `POST` → 405 em HTML):
- a página, os estilos, o `config.js` e o `script.js` carregaram pelos caminhos relativos;
- a CSP da `<meta>` bloqueou uma conexão a um domínio fora da lista;
- com `apiBaseUrl` vazio, com um Worker inexistente e com `apiBaseUrl` inválido, o status mostrou a mensagem de API indisponível e o botão voltou a ficar habilitado.

No modo local, o roteiro de 40 passos continuou passando, com 0 erros no console.

**Avisos de console esperados no Pages:**
- 405 do `POST` enquanto o Worker não estiver configurado, seguido do diagnóstico em `console.error`;
- 404 de `/favicon.ico`, porque o navegador procura o ícone na raiz do domínio (`professoralissonlucas.github.io/favicon.ico`), fora da pasta do projeto. Daria para evitar com `<link rel="icon" href="data:,">` no `<head>`, mas isso não foi feito, para não mexer no ícone da aba.

### Publicação automática (GitHub Actions)

O site é publicado pelo workflow `.github/workflows/pages.yml`. **Não** se usa *Deploy from a branch*.

| Etapa | O que faz |
|---|---|
| Gatilho | Cada `push` na branch `main`; também pode ser disparado à mão (`workflow_dispatch`) na aba **Actions** → "Publicar site no GitHub Pages" → **Run workflow**. |
| Job `testes` | `actions/checkout@v7`, `actions/setup-node@v7` (Node 24) e `npm test`. Se falhar, o job `publicar` não roda. |
| Job `publicar` | `needs: testes`. Usa `actions/configure-pages@v6`, monta a pasta `_site` só com `index.html`, `styles.css`, `script.js`, `config.js` e `.nojekyll` (falha se faltar algum arquivo ou se a pasta não tiver exatamente 5), envia com `actions/upload-pages-artifact@v5` (`include-hidden-files: true`, necessário para o `.nojekyll`) e publica com `actions/deploy-pages@v5`. |
| Permissões | `contents: read` no workflow; o job `publicar` adiciona `pages: write` e `id-token: write`, exigidos pelo `deploy-pages`. Ambiente `github-pages`, com a URL do site. |
| Concorrência | Grupo `github-pages`, sem cancelar a publicação em andamento. |

- **Fora do site:** `server.js`, `lib/`, `test/`, `worker/`, `package.json`, a documentação e o `.env` nunca vão para o site publicado.
- **Testes do workflow:** conferem gatilho, dependência entre os jobs, actions, permissões, `include-hidden-files`, a lista exata de arquivos e se todo arquivo local usado pelo `index.html` está na lista.
- **Arquivo novo no site:** se a página passar a usar outro arquivo, ele precisa entrar em `arquivos_do_site` no workflow, na contagem de 5 e nos testes.
- **`config.js` e testes:** um teste exige que o `apiBaseUrl` do `config.js` seja vazio ou uma URL `https://…workers.dev` sem barra final e sem `/api/`. Um endereço fora do `*.workers.dev` seria bloqueado pela CSP, então o teste impede a publicação.

**Ativação (uma vez):** *Settings* → *Pages* → *Build and deployment* → *Source*: **GitHub Actions**.

Versões das actions conferidas na API do GitHub em 19/11/2026.

## 21. Limitações atuais

- não possui banco de dados nem histórico de redações;
- não possui autenticação, contas ou painel administrativo;
- biblioteca fixa no código (6 temas, 6 repertórios, 3 gêneros);
- não gera PDF nem exporta resultados além da cópia do texto revisado;
- não possui tema escuro;
- correção real depende da API do Gemini e de internet;
- a nota não é validada com correção oficial de banca;
- não há testes de frontend nem end-to-end;
- não há build, minificação ou cache de longo prazo dos estáticos;
- limite de uso por IP só no Worker (10 correções a cada 10 minutos); o servidor local (`npm start`) não limita;
- sem o KV `LIMITE_USO`, o limite do Worker fica na memória de cada instância e é aproximado;
- apenas português brasileiro.

## 22. Possíveis evoluções

- banco de dados para temas, repertórios e histórico;
- login e perfil do estudante, com registro de progresso;
- comparação entre versões da mesma redação;
- exportação em PDF;
- painel para professores e turmas;
- mais vestibulares, gêneros e temas;
- edição administrativa da biblioteca;
- testes de frontend e end-to-end;
- rate limiting e telemetria técnica sem dados sensíveis;
- provedor de IA alternativo;
- tema escuro e melhorias de acessibilidade;
- cache ou modo offline para a biblioteca.

## 23. Critérios de aceitação

Uma implementação do projeto deve:

- servir a página principal em `/`;
- oferecer busca funcional, insensível a acentos, nas categorias Temas e Repertórios;
- apresentar os três guias de gêneros textuais com dicas por banca;
- abrir o painel de teses/repertórios de um tema e o detalhe pedagógico de um repertório;
- exigir tema e redação antes da correção e respeitar os limites de caracteres;
- calcular e exibir uma nota entre 0 e 1.000 com cinco competências;
- preservar o conteúdo da redação na versão corrigida e listar as correções feitas;
- informar que a nota é apenas uma estimativa;
- funcionar sem expor a chave da API no navegador;
- funcionar em modo de demonstração sem chave quando `ENTRELINHAS_TEST_MODE=true`;
- retornar mensagens de erro compreensíveis com os códigos documentados;
- passar em `npm test`;
- manter a navegação e os estados visuais acessíveis.
