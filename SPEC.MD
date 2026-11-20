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
- **Backend:** Node.js com módulos nativos `node:http`, `node:fs` e `node:path`;
- **API de IA:** Google Gemini (`generativelanguage.googleapis.com/v1beta`, método `generateContent`), chamada via `fetch` nativo;
- **Modelo padrão:** `gemini-3.8-flash` (configurável). O `gemini-2.5-flash` não está mais disponível para chaves novas (o Google responde 404);
- **Testes:** executor nativo `node:test` com `node:assert/strict`;
- **Hospedagem local:** servidor Node.js na porta 3000 por padrão.

O projeto **não possui dependências npm** (nem `dependencies` nem `devDependencies`), framework frontend, banco de dados, bundler ou etapa de build. O carregamento do `.env` é feito por uma função própria (`loadLocalEnv`), sem `dotenv`.

### Estrutura de arquivos

```text
affonso/
├── index.html              # estrutura da página e semântica dos componentes
├── styles.css              # identidade visual, layout responsivo e estados (~1.470 linhas)
├── script.js               # dados da biblioteca, renderização, busca, modal e integração com a API (~930 linhas)
├── server.js               # servidor HTTP, estáticos, validações, prompts e integração com Gemini (~480 linhas)
├── test/
│   └── entrelinhas.test.js # testes automatizados do backend (38 casos)
├── package.json            # metadados, engine e scripts start/test
├── .env.example            # modelo de variáveis de ambiente
├── .gitignore              # ignora .env e node_modules/
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
Navegador (index.html + script.js + styles.css)
   │  GET estáticos            │  POST /api/correct (JSON)
   ▼                           ▼
server.js (node:http) ──► Gemini: 1) avaliação  2) revisão ortográfica
```

### Frontend

Página única com conteúdo renderizado por JavaScript a partir de dados embutidos em `script.js`. A única dependência externa são as fontes do Google Fonts.

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

`server.js` só chama `server.listen` quando executado diretamente (`require.main === module`). Quando importado, exporta para os testes:

- `server`;
- `validateInput`, `validateAssessment`, `validateProofreading`;
- `parseCandidate`;
- `createTestAssessment`;
- `normalizarAvaliacao`, `normalizarRevisao`, `responseSchema`, `proofreadingSchema` e `tempoLimitePadrao`;
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

- **Limpar**: esvazia os dois campos, remove `aria-invalid`, restaura o estado vazio do resultado, apaga a mensagem de status, desabilita o botão de copiar e foca a redação;
- **Avaliar redação**: valida os campos (primeiro a redação, depois a proposta), envia a requisição e exibe o resultado;
- **Copiar versão revisada**: copia o `correctedText` para a área de transferência.

Durante a avaliação: botão desabilitado com texto "Avaliando...", status "Avaliando as competências e fazendo uma segunda revisão ortográfica...", `aria-busy="true"` no painel e timeout de 240 segundos no navegador (`AbortController`), maior que a soma dos limites do servidor.

O painel de resultado apresenta, nesta ordem:

1. cartão de nota — "Nota estimada" (ou "Nota de demonstração" no modo teste) com `soma/1000`;
2. visão geral (`summary`);
3. avaliação por competência — título da competência, `nota/200`, justificativa, evidência e "Para melhorar" (sugestões concatenadas, se houver);
4. correções ortográficas e gramaticais (`original → corrigido` + motivo, ou mensagem de que não foram necessárias alterações);
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
- modo demonstração: informa que os 880 pontos são fixos e não representam avaliação real;
- erro do servidor: exibe `error.message` retornado pela API;
- timeout do navegador (`AbortError`) e falha de rede (`TypeError`) têm mensagens próprias.

### 7.4 Biblioteca

Controles:

- abas `Temas`, `Gêneros textuais` e `Repertórios` (`aria-pressed`, classe `is-active`);
- campo de busca com atalho `/` (oculto na aba Gêneros);
- rótulo da categoria e contagem de resultados ("1 resultado" / "N resultados" / "3 gêneros");
- estado vazio "Nenhum resultado por aqui. Tente outra busca.".

**Busca:** sem diferenciar maiúsculas e acentos (normalização NFD + `toLocaleLowerCase("pt-BR")`), filtrando por substring sobre:

- Temas: eixo temático, título, motivação, principais desafios, teses e título/relação dos repertórios socioculturais;
- Repertórios: tag, título e descrição curta (os campos detalhados não entram na busca).

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

### Fluxo do backend

1. lê o corpo (exige `Content-Type` contendo `application/json`; limite de 20.000 bytes);
2. valida `theme` e `essay` (`validateInput`);
3. se `ENTRELINHAS_TEST_MODE` estiver ativo, retorna `createTestAssessment` sem chamar a IA;
4. se não houver `GEMINI_API_KEY`, retorna 503 `SERVICE_NOT_CONFIGURED`;
5. chama o Gemini para a avaliação e valida a resposta;
6. chama o Gemini para a revisão ortográfica, filtra as correções inventadas (`filtrarCorrecoes`), valida a estrutura e verifica se o texto revisado tem entre 70% e 130% do tamanho da redação original;
7. substitui `correctedText` pelo da revisão, anexa `corrections` e responde 200.

## 10. Processo de avaliação da IA

Ambas as chamadas passam pela função `chamarGemini` e usam `system_instruction` com o prompt, o conteúdo do usuário serializado como JSON, `responseMimeType: "application/json"`, `responseSchema` próprio e `temperature: 0.2`. A chave vai no cabeçalho `x-goog-api-key`, nunca na URL.

| Etapa | Gemini 3.x (`thinkingLevel`) | Gemini 2.5 (`thinkingBudget`) | `maxOutputTokens` | Limite de tempo |
|---|---|---|---|---|
| Avaliação | `"low"` | 1.024 | 24.576 | 120 s |
| Revisão | `"low"` | 512 | 16.384 | 90 s |

- **Raciocínio (thinking):** nos modelos Gemini 2.5 e 3.x, os tokens de raciocínio contam dentro de `maxOutputTokens`. O parâmetro é escolhido por `montarConfiguracaoRaciocinio` conforme o nome do modelo:
  - `gemini-3*` (incluindo o padrão `gemini-3.8-flash`): `thinkingConfig.thinkingLevel`. Os valores aceitos são `low`, `medium` e `high`; `minimal` não é aceito no 3.8. O nível não é um teto rígido, por isso `maxOutputTokens` tem bastante folga (o limite do 3.8-flash é 65.536);
  - `gemini-2.5*`: `thinkingConfig.thinkingBudget` em tokens (512 é o mínimo do `2.5-flash-lite` e vale para flash e pro);
  - outros nomes (por exemplo, `gemini-flash-latest`): nenhum `thinkingConfig`.
- **Medição real com `gemini-3.8-flash` (19/11/2026):** o schema e o `thinkingLevel: "low"` foram aceitos (HTTP 200, `finishReason: STOP`). A avaliação usou de 1.300 a 1.650 tokens de resposta e a revisão cerca de 150, muito abaixo dos limites, sem corte por `MAX_TOKENS`. Sob alta demanda, porém, a avaliação levou de 60 a 100 s e a revisão de 45 a 70 s, e houve respostas 503 ("high demand").
- **Limite de tempo por etapa:** cada chamada tem seu próprio `AbortController`, e o limite cobre também a leitura do corpo da resposta. A soma (210 s) fica abaixo do limite do navegador (240 s). Os valores são altos por causa das medições sob carga.
- **Schema compatível com o Gemini:** a API só aceita `enum` em campos `STRING`. A nota de cada competência é pedida como texto (`"0"`, `"40"` … `"200"`, `format: "enum"`) e convertida para número por `normalizarAvaliacao`. Os schemas também usam `minItems`/`maxItems` (5 competências, até 5 sugestões, de 1 a 5 pontos fortes e próximos passos, até 30 correções).
- **Normalização:** antes da validação, `normalizarAvaliacao` converte as notas e corta listas acima do limite, e `normalizarRevisao` corta `corrections` em 30 itens. Notas fora dos níveis continuam sendo rejeitadas.

1. **Avaliação principal** (`systemPrompt`, entrada `{ theme, essay }`)
   - avalia somente o texto e a proposta, tratando ambos como dados não confiáveis;
   - atribui a cada competência uma nota entre 0, 40, 80, 120, 160 ou 200, sem inflar notas nem descontar o mesmo problema duas vezes;
   - justifica cada nota, cita evidência literal curta (ou "Não identificada") e dá sugestões acionáveis;
   - produz um primeiro `correctedText` que preserva tese, ideias, exemplos, estrutura e voz do estudante;
   - identifica pontos fortes e próximos passos.

2. **Revisão independente** (`proofreadingPrompt`, entrada `{ original, draft }`)
   - segue a norma-padrão do português brasileiro e a ortografia do Acordo Ortográfico de 1990 vigente (VOLP/ABL), com exemplos no próprio prompt ("ideia", "frequente", "voo", "autoestima");
   - corrige somente erros inequívocos de ortografia, acentuação, crase, concordância, regência, pontuação contrária à norma, maiúsculas e sintaxe defeituosa;
   - não reescreve o estilo, não troca vocabulário correto por sinônimos, não remove nem junta frases ou parágrafos e mantém as escolhas facultativas do estudante (vírgulas e crases facultativas);
   - parte sempre do texto **original** do estudante e usa o `draft` da primeira etapa só como sugestão, restaurando trechos que ele tenha removido ou reescrito;
   - devolve o texto completo e lista cada erro em `corrections` **em relação ao texto original** (não ao draft): `original` é um trecho literal da redação, `corrected` é o trecho corrigido e `reason` começa pela categoria ("Crase: …", "Acentuação: …", "Concordância verbal: …").

**Regras aplicadas pelo servidor à revisão:**

- **Correções inventadas:** `filtrarCorrecoes` descarta itens cujo `original` não existe na redação do estudante (comparação com espaços normalizados e Unicode NFC), cujo `original` é igual ao `corrected` (inclusive se só os espaços diferem) ou que estão malformados. A filtragem ocorre antes do corte em 30 itens. A quantidade descartada é registrada no log, sem os trechos.
- **Preservação da autoria:** se o texto revisado tiver menos de 70% ou mais de 130% do tamanho da redação original (espaços normalizados), a revisão é descartada com 502 `INVALID_PROOFREADING_RESPONSE`, e a porcentagem é registrada no log.
- **Texto exibido:** o `correctedText` final vem sempre da segunda chamada; o texto da primeira etapa é só o `draft`. O frontend mostra cada correção como `original → corrected` seguida do motivo.

**Teste real (19/11/2026, `gemini-3.8-flash`):**
- **Redação de teste:** 601 caracteres com 12 erros propositais (7 de acentuação, 2 de crase, 2 de concordância verbal, 1 de vírgula entre sujeito e verbo, além de "afim de que").
- **Resultado:** a revisão corrigiu e listou os 12, com o motivo correto de cada um.
- **Armadilhas:** manteve intactos os trechos corretos "acesso a livros", "acesso a bibliotecas" e "desde a infância".
- **Tamanho:** o texto revisado ficou com 100% do tamanho original.

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
- timeout de 240 segundos.

### Backend

| Item | Limite / regra |
|---|---|
| Corpo da requisição | até 20.000 bytes (413 se exceder) |
| `Content-Type` | deve conter `application/json` (415 caso contrário) |
| `theme` | string não vazia, até 1.500 caracteres |
| `essay` | string não vazia, até 5.000 caracteres |
| Timeout com o Gemini | 120 s para a avaliação e 90 s para a revisão, contados separadamente |
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
- Content Security Policy nos estáticos: `default-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self'; img-src 'self' data:`;
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
| `GET` | `/script.js` | JavaScript do cliente |
| `POST` | `/api/correct` | avaliação da redação |
| `GET` | `/api/health` | `{ "status": "ok" }` |

- método errado em `/api/correct` ou `/api/health`: 405 `METHOD_NOT_ALLOWED` com cabeçalho `Allow`;
- qualquer outra rota ou método: 404 `NOT_FOUND` em JSON;
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
| `PROVIDER_BUSY` | 503 | Gemini retornou 429 (cota) ou 503 (sobrecarga) |
| `INVALID_API_KEY` | 502 | Gemini retornou 401/403, ou 400 com motivo `API_KEY_INVALID` |
| `INVALID_MODEL` | 502 | Gemini retornou 404; a mensagem cita o modelo configurado e sugere verificar `GEMINI_MODEL` no `.env` (padrão `gemini-3.8-flash`) |
| `PROVIDER_ERROR` | 502 | outro erro HTTP do Gemini (mensagem diferente para avaliação e revisão) |
| `INVALID_PROVIDER_RESPONSE` | 502 | avaliação fora do schema ou incompleta |
| `INVALID_PROOFREADING_RESPONSE` | 502 | revisão fora do schema ou incompleta, ou texto revisado com menos de 70% ou mais de 130% do tamanho original (mensagem própria sobre preservar a autoria) |
| `PROVIDER_TIMEOUT` | 504 | limite de tempo da avaliação (120 s) ou da revisão (90 s) excedido; a mensagem indica a etapa |
| `PROVIDER_UNAVAILABLE` | 502 | falha de rede ao contatar o Gemini |
| `METHOD_NOT_ALLOWED` | 405 | método HTTP incorreto nas rotas de API |
| `NOT_FOUND` | 404 | rota inexistente |
| `FILE_READ_ERROR` | 500 | falha ao ler arquivo estático |

## 17. Testes automatizados

`test/entrelinhas.test.js` (executado com `npm test`) sobe o servidor em porta aleatória (`listen(0, "127.0.0.1")`) e cobre:

- mensagens de `validateInput` para campos ausentes e limites, aceitando exatamente 1.500/5.000 caracteres;
- `validateAssessment` (cinco competências, nota inválida, objeto vazio);
- `validateProofreading`;
- `parseCandidate` (JSON válido, `MAX_TOKENS`, texto não JSON, bloco cercado inválido, resposta parcial);
- `GET /api/health` (200 e 405);
- `POST /api/correct` com entrada vazia (400 `INVALID_INPUT`), JSON malformado (400 `INVALID_REQUEST`), `Content-Type` `text/plain` (415) e sem chave configurada (503 `SERVICE_NOT_CONFIGURED`);
- página principal (200, `text/html`) e rota inexistente (404 `NOT_FOUND`);
- `createTestAssessment` (880 pontos, notas fixas, texto preservado, prefixo do resumo);
- alternância de modo via `setTestConfiguration`;
- schemas sem `enum` fora de campos `STRING` e conversão da nota em texto para número;
- `parseCandidate` ignorando partes `thought`;
- limite do navegador em `script.js` maior que a soma dos limites do servidor;
- **Gemini simulado** (fetch falso via `setTestConfiguration`, sem rede):
  - sucesso nas duas etapas, conferindo `thinkingConfig`, `maxOutputTokens`, a chave só no cabeçalho e a entrada `{ original, draft }` da revisão;
  - modelo 2.5 recebendo `thinkingBudget`, e modelo fora das famílias 2.5 e 3.x sem `thinkingConfig`;
  - erro 404 de modelo (502 `INVALID_MODEL`, mensagem citando `GEMINI_MODEL`);
  - modelo padrão `gemini-3.8-flash`;
  - resposta `MAX_TOKENS` (502, sem chamar a revisão, com log de diagnóstico);
  - erro 429 (503 `PROVIDER_BUSY`);
  - erro 401 e erro 400 `API_KEY_INVALID` (502 `INVALID_API_KEY`);
  - tempo esgotado na avaliação e na revisão, com limites independentes (504 `PROVIDER_TIMEOUT`);
  - os logs não contêm a redação nem a chave.
- **revisão ortográfica:** `filtrarCorrecoes` (trecho inexistente, igual ao corrigido, diferença só de espaços, item malformado), limites de 70% e 130% do tamanho, `validateProofreading` com o original, filtragem antes do corte em 30 itens, conteúdo do `proofreadingPrompt` (norma-padrão, Acordo Ortográfico, VOLP, sem reescrever o estilo) e, com o Gemini simulado, descarte de correções inventadas e de revisões muito menores ou maiores que o original;

Não há testes de frontend nem testes end-to-end. Os testes não chamam o Gemini real, então não garantem que a API real aceite o schema; isso só é verificado manualmente com uma chave.

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

Itens identificados na análise, registrados apenas para referência (não alterados):

- o campo da redação referencia `aria-describedby="essay-character-count"`, mas o contador tem `id="character-count"`;
- o botão **Limpar** apaga o aviso "A nota é uma estimativa para estudo…" do status, que só volta após nova avaliação;
- em `renderCards`, o botão `theme-study-button` é criado para todos os cartões, mas só é usado na aba Temas;
- a busca de repertórios não considera os campos detalhados (`whatIs`, `axes` etc.);
- o vínculo tema → repertório depende da semelhança textual entre `titulo` e `title`;
- o modo demonstração é detectado no frontend pelo prefixo do `summary`, não pelo campo `testMode`;
- o teste "calcula corretamente os seis níveis possíveis da nota" não exercita código da aplicação;
- o `README` não existe; este SPEC é a principal documentação;
- o motivo (`reason`) é texto gerado pela IA e pode conter pequenos erros de digitação (no teste real apareceu "grafase" em vez de "grafa-se"); ele não é revisado;
- se a primeira etapa remover repetições ou trechos, a revisão precisa restaurá-los; caso contrário, a regra de 70% a 130% descarta a revisão;
- se a revisão falhar (por exemplo, com 503), a avaliação já concluída é descartada;
- não há nova tentativa automática quando o Gemini responde 503 ("high demand"), que foi frequente nos testes reais.

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
- não há limitação de taxa (rate limiting) por cliente no servidor;
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
