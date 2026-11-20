const library = {
  temas: [
    {
      eixoTematico: "Tecnologia",
      title: "Os desafios da inclusão digital no Brasil",
      motivacao: "A transformação digital amplia oportunidades, mas ainda deixa muitas pessoas sem acesso à informação e a serviços essenciais.",
      principaisDesafios: ["Ampliar o acesso à internet e a dispositivos", "Combater a desigualdade de habilidades digitais"],
      teses: [
        "A exclusão digital no Brasil persiste porque a desigualdade socioeconômica limita tanto o acesso à conexão quanto o desenvolvimento de habilidades para usar tecnologias.",
        "Democratizar a inclusão digital exige políticas públicas que combinem infraestrutura acessível e formação tecnológica para a população.",
      ],
      repertoriosSocioculturais: [
        { categoria: "Constituição", titulo: "Constituição Federal de 1988, art. 6º", relacao: "O artigo reconhece direitos sociais; o acesso desigual a serviços digitais pode dificultar o exercício de direitos que hoje dependem de tecnologia." },
        { categoria: "Legislação", titulo: "Marco Civil da Internet (Lei nº 12.965/2014)", relacao: "Estabelece princípios e garantias para o uso da internet no Brasil, servindo de base para discutir acesso, cidadania e inclusão." },
        { categoria: "Sociologia", titulo: "Zygmunt Bauman e a modernidade líquida", relacao: "A ideia de mudanças rápidas nas relações e instituições ajuda a refletir sobre quem consegue acompanhar a transformação digital e quem fica à margem." },
      ],
    },
    {
      eixoTematico: "Saúde",
      title: "Saúde mental entre adolescentes: cuidado e acolhimento",
      motivacao: "O bem-estar emocional de jovens depende de acolhimento, informação e acesso a uma rede de cuidado.",
      principaisDesafios: ["Reduzir o estigma em torno da saúde mental", "Ampliar o acesso a apoio psicológico nas escolas"],
      teses: [
        "O cuidado com a saúde mental de adolescentes ainda é dificultado pelo estigma social e pela oferta insuficiente de espaços de acolhimento e acompanhamento.",
        "A promoção do bem-estar emocional entre jovens depende de ações integradas entre escolas, famílias e serviços públicos de saúde.",
      ],
      repertoriosSocioculturais: [
        { categoria: "Constituição", titulo: "Constituição Federal de 1988, arts. 6º e 196", relacao: "Reconhece a saúde como direito social e direito de todos, permitindo discutir o dever de ampliar prevenção e cuidado em saúde mental." },
        { categoria: "Legislação", titulo: "Lei nº 10.216/2001", relacao: "Dispõe sobre a proteção e os direitos das pessoas com transtornos mentais e redireciona o modelo de atenção em saúde mental." },
        { categoria: "Saúde pública", titulo: "Organização Mundial da Saúde (OMS)", relacao: "A definição ampla de saúde da OMS considera o bem-estar mental parte da saúde, não apenas a ausência de doenças." },
      ],
    },
    {
      eixoTematico: "Educação",
      title: "Desafios para a formação de leitores no Brasil",
      motivacao: "O hábito da leitura contribui para a autonomia, o aprendizado e a participação crítica na sociedade.",
      principaisDesafios: ["Democratizar o acesso a livros e bibliotecas", "Incentivar a leitura dentro e fora da escola"],
      teses: [
        "A formação de leitores no Brasil é limitada pela desigualdade de acesso a livros e espaços de leitura e pela falta de estímulo contínuo dentro e fora da escola.",
        "Ampliar o hábito da leitura requer políticas de acesso ao livro aliadas a práticas pedagógicas que valorizem a diversidade de leitores e repertórios.",
      ],
      repertoriosSocioculturais: [
        { categoria: "Constituição", titulo: "Constituição Federal de 1988, art. 205", relacao: "Define a educação como direito de todos e dever do Estado e da família, fundamento para argumentar sobre acesso à formação leitora." },
        { categoria: "Legislação", titulo: "Lei nº 13.696/2018 — Política Nacional de Leitura e Escrita", relacao: "Institui uma política nacional voltada à promoção do livro, da leitura, da escrita, da literatura e das bibliotecas." },
        { categoria: "Literatura brasileira", titulo: "Quarto de Despejo, de Carolina Maria de Jesus", relacao: "A obra evidencia como a literatura registra realidades sociais pouco representadas e amplia perspectivas de leitura e discussão." },
      ],
    },
    {
      eixoTematico: "Cidadania",
      title: "Caminhos para enfrentar a desinformação",
      motivacao: "A circulação de informações falsas pode prejudicar decisões individuais e o debate democrático.",
      principaisDesafios: ["Fortalecer a educação midiática", "Promover a checagem responsável de informações"],
      teses: [
        "A desinformação se fortalece quando a circulação acelerada de conteúdos não é acompanhada por formação crítica para avaliar fontes e evidências.",
        "Enfrentar a desinformação exige educação midiática e transparência, sem abandonar a proteção à liberdade de expressão e ao debate democrático.",
      ],
      repertoriosSocioculturais: [
        { categoria: "Constituição", titulo: "Constituição Federal de 1988, arts. 5º e 220", relacao: "Protege a liberdade de expressão e a manifestação do pensamento, base para discutir o equilíbrio entre informação confiável e direitos fundamentais." },
        { categoria: "Legislação", titulo: "Marco Civil da Internet (Lei nº 12.965/2014)", relacao: "Define princípios, garantias, direitos e deveres para o uso da internet e ajuda a contextualizar o debate sobre responsabilidade online." },
        { categoria: "Sociologia", titulo: "Jürgen Habermas e a esfera pública", relacao: "A reflexão sobre debate público racional ajuda a analisar como conteúdos enganosos podem prejudicar a formação da opinião coletiva." },
      ],
    },
    {
      eixoTematico: "Meio ambiente",
      title: "O combate ao desperdício de alimentos",
      motivacao: "O desperdício agrava impactos ambientais enquanto muitas pessoas ainda enfrentam insegurança alimentar.",
      principaisDesafios: ["Melhorar armazenamento e distribuição de alimentos", "Incentivar consumo consciente e doações seguras"],
      teses: [
        "O desperdício de alimentos no Brasil decorre de falhas ao longo da produção e distribuição e de hábitos de consumo que podem ser transformados.",
        "Reduzir perdas de alimentos requer logística mais eficiente e ações coordenadas de conscientização, reaproveitamento e combate à insegurança alimentar.",
      ],
      repertoriosSocioculturais: [
        { categoria: "Constituição", titulo: "Constituição Federal de 1988, art. 6º", relacao: "Reconhece a alimentação como direito social e permite relacionar desperdício com o desafio de garantir segurança alimentar." },
        { categoria: "Legislação", titulo: "Lei nº 11.346/2006 — Lei Orgânica de Segurança Alimentar e Nutricional", relacao: "Cria o SISAN e estabelece diretrizes para assegurar o direito humano à alimentação adequada." },
        { categoria: "Sociologia", titulo: "Josué de Castro e Geografia da Fome", relacao: "A obra analisa a fome como fenômeno social e político, contribuindo para discutir desigualdade, produção e acesso aos alimentos." },
      ],
    },
    {
      eixoTematico: "Tecnologia",
      title: "Os impactos da inteligência artificial na educação",
      motivacao: "Ferramentas de inteligência artificial criam novas possibilidades de aprendizagem e também exigem uso crítico.",
      principaisDesafios: ["Garantir acesso inclusivo às ferramentas", "Orientar o uso ético e preservar o pensamento crítico"],
      teses: [
        "O uso de inteligência artificial na educação pode apoiar a aprendizagem, mas sem acesso equitativo e orientação crítica tende a reproduzir desigualdades.",
        "Integrar inteligência artificial ao ensino exige formação de educadores e regras de uso que protejam a autonomia, a privacidade e o pensamento crítico dos estudantes.",
      ],
      repertoriosSocioculturais: [
        { categoria: "Constituição", titulo: "Constituição Federal de 1988, art. 205", relacao: "A educação como direito de todos fundamenta a discussão sobre acesso democrático às ferramentas e aos benefícios da inovação." },
        { categoria: "Legislação", titulo: "Lei Geral de Proteção de Dados — LGPD (Lei nº 13.709/2018)", relacao: "Estabelece regras para o tratamento de dados pessoais, tema relevante quando sistemas educacionais usam dados de estudantes." },
        { categoria: "Filosofia", titulo: "Hannah Arendt e a responsabilidade na educação", relacao: "Sua reflexão sobre responsabilidade adulta pelo mundo comum inspira o debate sobre o papel de educadores na mediação de novas tecnologias." },
      ],
    },
  ],
  repertorios: [
    {
      tag: "Literatura",
      title: "Quarto de Despejo, de Carolina Maria de Jesus",
      description: "Um diário que registra desigualdade, fome e a força da experiência cotidiana.",
      whatIs: "Quarto de Despejo é um diário publicado a partir dos registros de Carolina Maria de Jesus sobre sua rotina na favela do Canindé, em São Paulo.",
      origin: "Obra autobiográfica e literária de Carolina Maria de Jesus.",
      context: "A publicação reúne a experiência cotidiana de uma catadora de materiais recicláveis diante da pobreza, da fome e da invisibilidade social.",
      centralIdea: "Dar visibilidade a realidades socialmente marginalizadas e mostrar como condições estruturais influenciam a vida cotidiana.",
      societyRelation: "A obra ajuda a analisar desigualdade, pobreza urbana, acesso insuficiente a direitos e formas de invisibilização de grupos vulneráveis.",
      howToUse: "Use o repertório para explicar como uma experiência concreta evidencia um problema social. Conecte a obra ao argumento por meio de uma relação causal ou histórica, sem transformar o diário em uma prova estatística.",
      applicationExample: "Como mostra a experiência literária registrada em Quarto de Despejo, a pobreza não é apenas ausência de renda, mas uma realidade marcada por fome, moradia precária e invisibilidade; por isso, políticas voltadas à desigualdade urbana precisam enfrentar essas condições em conjunto.",
      attention: "Não atribua à obra dados quantitativos nem transforme uma experiência individual em uma descrição universal de todas as famílias brasileiras.",
      axes: ["Educação", "Desigualdade", "Cidadania", "Cultura"],
    },
    {
      tag: "Sociologia",
      title: "A sociedade do espetáculo, de Guy Debord",
      description: "Uma lente para discutir imagens, consumo e relações mediadas pela mídia.",
      whatIs: "A sociedade do espetáculo é uma obra teórica de Guy Debord que analisa a centralidade das imagens e das relações mediadas pela representação na vida social.",
      origin: "Livro do filósofo e teórico social Guy Debord.",
      context: "A obra surgiu em um contexto de reflexão sobre a expansão da sociedade de consumo e dos meios de comunicação de massa.",
      centralIdea: "Quando relações sociais passam a ser organizadas principalmente por imagens e representações, o consumo de imagens pode substituir ou enfraquecer a experiência direta da realidade.",
      societyRelation: "O conceito permite discutir publicidade, redes sociais, desinformação, consumo e a construção pública da realidade, desde que adaptado ao tema.",
      howToUse: "Apresente o conceito como uma lente crítica e explique como ele se manifesta no problema escolhido. A referência deve sustentar o raciocínio, não substituir o argumento.",
      applicationExample: "Na disputa por atenção nas redes digitais, a lógica descrita por Guy Debord como sociedade do espetáculo pode favorecer a circulação de imagens impactantes em detrimento da análise cuidadosa dos fatos; por isso, a educação midiática deve ensinar a conferir fontes e contextos.",
      attention: "Evite afirmar que Debord escreveu especificamente sobre internet ou redes sociais, uma realidade posterior à formulação original.",
      axes: ["Tecnologia", "Cidadania", "Cultura", "Desigualdade"],
    },
    {
      tag: "Cinema",
      title: "O Dilema das Redes (2020)",
      description: "Documentário para refletir sobre plataformas digitais e comportamento.",
      whatIs: "O Dilema das Redes é um documentário que aborda o funcionamento de plataformas digitais, modelos de atenção e possíveis impactos sobre usuários e instituições.",
      origin: "Documentário lançado em 2020.",
      context: "O filme reúne especialistas e ex-profissionais de empresas de tecnologia para discutir mecanismos de plataformas centradas na recomendação e no engajamento.",
      centralIdea: "Sistemas desenhados para maximizar atenção podem influenciar comportamento, consumo de informação e relações sociais.",
      societyRelation: "A referência ajuda a analisar vigilância de dados, polarização, saúde mental, desinformação e a responsabilidade das plataformas digitais.",
      howToUse: "Use o documentário como ponto de partida para uma análise da influência das plataformas. Relacione uma característica apresentada no filme a uma consequência concreta e a uma proposta viável.",
      applicationExample: "Ao destacar como plataformas priorizam conteúdos capazes de prolongar a atenção, O Dilema das Redes demonstra que o excesso de estímulos digitais pode afetar o julgamento individual; assim, políticas públicas de educação midiática podem ensinar a identificar mecanismos de recomendação e avaliar fontes.",
      attention: "Não apresente o documentário como estudo científico conclusivo nem use depoimentos isolados como dados universais.",
      axes: ["Tecnologia", "Educação", "Saúde", "Cidadania"],
    },
    {
      tag: "Filosofia",
      title: "Contrato social, de Jean-Jacques Rousseau",
      description: "Ideias sobre cidadania, vontade coletiva e organização política.",
      whatIs: "O Contrato Social é uma obra de filosofia política em que Jean-Jacques Rousseau trata da legitimidade da organização política e da soberania coletiva.",
      origin: "Obra filosófica publicada por Jean-Jacques Rousseau.",
      context: "Escrita em um contexto de debate sobre a formação do Estado e as relações entre autoridade política e liberdade.",
      centralIdea: "A associação política pode ser legítima quando se orienta pela vontade coletiva e pela participação dos cidadãos, não apenas pela imposição de interesses particulares.",
      societyRelation: "A obra contribui para discutir cidadania, participação, responsabilidade coletiva e a relação entre liberdade individual e decisões comuns.",
      howToUse: "Explique o conceito relevante para o tema e ligue a participação cidadã a uma ação concreta do Estado ou da sociedade. Preserve a compreensão geral da obra sem atribuir-lhe frases específicas.",
      applicationExample: "A defesa de Rousseau de uma associação fundada na vontade coletiva evidencia que o combate a problemas sociais não pode depender apenas de escolhas individuais: é necessário ampliar a participação pública e responsabilizar instituições por decisões que afetem toda a coletividade.",
      attention: "Não cite frases da obra sem verificar a versão e a tradução. Evite resumir toda a teoria ao slogan ‘vontade geral’ sem explicar sua relação com o tema.",
      axes: ["Cidadania", "Educação", "Desigualdade", "Cultura"],
    },
    {
      tag: "Constituição",
      title: "Constituição Federal de 1988",
      description: "Referência para abordar direitos fundamentais e deveres do Estado.",
      whatIs: "É a Constituição da República Federativa do Brasil, documento que organiza o Estado e estabelece direitos fundamentais, deveres públicos e princípios da ordem política.",
      origin: "Documento constitucional brasileiro promulgado em 1988.",
      context: "A Constituição foi elaborada após o período da ditadura militar e ampliou garantias de cidadania, direitos sociais e participação política.",
      centralIdea: "Direitos garantidos constitucionalmente exigem também mecanismos efetivos de proteção e atuação do Estado.",
      societyRelation: "Pode sustentar argumentos sobre educação, saúde, segurança, direitos sociais, liberdade de expressão, meio ambiente e igualdade.",
      howToUse: "Cite o dispositivo somente quando ele estiver relacionado ao argumento e explique a consequência prática do direito ou dever mencionado. Diferencie Constituição de uma intervenção proposta.",
      applicationExample: "Como a Constituição Federal estabelece direitos sociais e atribui responsabilidades ao Estado, a existência de desigualdade no acesso à tecnologia não pode ser tratada apenas como escolha individual: são necessárias políticas públicas capazes de garantir acesso efetivo a serviços essenciais.",
      attention: "Não diga que um artigo ‘resolve’ o problema por si só. Confira o número do artigo e evite atribuir à Constituição uma obrigação que esteja apenas em lei ou programa específico.",
      axes: ["Cidadania", "Educação", "Saúde", "Meio ambiente", "Tecnologia", "Desigualdade"],
    },
    {
      tag: "Literatura",
      title: "A Hora da Estrela, de Clarice Lispector",
      description: "Uma narrativa que permite discutir invisibilidade e desigualdade social.",
      whatIs: "A Hora da Estrela é uma obra literária de Clarice Lispector que acompanha a vida de Macabéa, uma jovem migrante submetida à precariedade social.",
      origin: "Romance da escritora Clarice Lispector.",
      context: "A narrativa apresenta a vulnerabilidade de uma personagem marcada pela migração, pela pobreza e pela falta de acesso a oportunidades e reconhecimento.",
      centralIdea: "A invisibilidade social pode fazer indivíduos vulneráveis serem tratados como cidadãos secundários, com pouca presença no olhar coletivo e nas políticas públicas.",
      societyRelation: "A obra ajuda a refletir sobre desigualdade, migração, pobreza, trabalho precário, discriminação e baixa participação social.",
      howToUse: "Utilize a trajetória da personagem para aproximar o leitor de um problema coletivo, mas explique que ela representa uma experiência fictícia e deve ser relacionada a dados ou instituições reais.",
      applicationExample: "A trajetória de Macabéa em A Hora da Estrela revela como a pobreza pode retirar visibilidade e voz de pessoas migrantes; dessa forma, políticas de proteção social devem combinar renda, acesso a serviços e oportunidades de participação para impedir que a vulnerabilidade seja naturalizada.",
      attention: "Não transforme a personagem em uma descrição factual de todos os migrantes ou use spoilers sem necessidade. Não faça afirmações biográficas sobre Clarice que não estejam sustentadas no cadastro.",
      axes: ["Desigualdade", "Cidadania", "Educação", "Cultura"],
    },
  ],
};

const genreGuides = [
  {
    id: "dissertacao-enem",
    title: "Dissertação-argumentativa (Enem)",
    description: "Texto formal que defende uma tese sobre uma questão social e apresenta uma proposta de intervenção.",
    structure: [
      { title: "Introdução", description: "Contextualize o tema e apresente uma tese clara, indicando o ponto de vista que será defendido." },
      { title: "Desenvolvimento", description: "Construa argumentos em parágrafos organizados, com explicações e repertório pertinente que sustente a tese." },
      { title: "Conclusão", description: "Retome o problema e proponha uma intervenção com ação, agente, meio, finalidade e detalhamento, respeitando os direitos humanos." },
    ],
    tips: {
      Enem: "Mantenha o foco no tema, use registro formal e detalhe uma proposta de intervenção viável, articulada à discussão.",
      Fuvest: "Se a proposta pedir dissertação, priorize uma tese autoral e análise consistente; não inclua proposta de intervenção por fórmula se ela não for pertinente.",
      Unicamp: "Leia o comando com atenção: identifique gênero, interlocutor e propósito antes de escolher a estrutura argumentativa.",
    },
  },
  {
    id: "artigo-opiniao",
    title: "Artigo de opinião",
    description: "Gênero argumentativo que apresenta uma posição sobre um assunto de interesse coletivo para convencer seus leitores.",
    structure: [
      { title: "Introdução", description: "Apresente o assunto e situe o debate; deixe clara a opinião ou tese que orientará o artigo." },
      { title: "Desenvolvimento", description: "Organize razões, exemplos e dados relevantes em uma sequência lógica, considerando possíveis contrapontos." },
      { title: "Conclusão / fechamento", description: "Reforce a posição defendida e encerre com uma síntese, reflexão ou encaminhamento coerente com o texto." },
    ],
    tips: {
      Enem: "A prova costuma solicitar texto dissertativo-argumentativo; só escreva como artigo de opinião se o comando determinar esse gênero.",
      Fuvest: "Confira o gênero exigido no enunciado; se for artigo, sustente o posicionamento com análise e evite argumentos genéricos.",
      Unicamp: "Considere quem lerá o artigo e onde ele circularia; ajuste o tom e as referências ao interlocutor indicado na proposta.",
    },
  },
  {
    id: "carta-manifesto",
    title: "Carta aberta / manifesto",
    description: "Texto público dirigido a um destinatário ou à sociedade para expor uma questão e defender uma causa ou reivindicação.",
    structure: [
      { title: "Introdução", description: "Defina o destinatário ou público, apresente a questão e explique por que ela merece atenção." },
      { title: "Desenvolvimento", description: "Explicite a posição coletiva, sustente a reivindicação com argumentos e indique seus impactos ou urgência." },
      { title: "Conclusão / fechamento", description: "Formule um apelo, convite à ação ou compromisso; em cartas, inclua despedida e identificação se o contexto pedir." },
    ],
    tips: {
      Enem: "Não substitua o formato dissertativo-argumentativo por carta ou manifesto, a menos que a instrução da prova peça esse gênero.",
      Fuvest: "Siga o gênero indicado no enunciado e mantenha a argumentação consistente; use marcas de destinatário apenas quando forem adequadas.",
      Unicamp: "Dê atenção especial à situação de produção: destinatário, propósito, circulação e marcas do gênero costumam ser decisivos na tarefa.",
    },
  },
];

const categoryLabels = {
  temas: "TEMAS PARA EXPLORAR",
  generos: "GÊNEROS TEXTUAIS DOS VESTIBULARES",
  repertorios: "REPERTÓRIOS PARA CONECTAR",
};

const grid = document.querySelector("#content-grid");
const searchInput = document.querySelector("#search-input");
const resultsLabel = document.querySelector("#results-label");
const resultsCount = document.querySelector("#results-count");
const emptyState = document.querySelector("#empty-state");
const tabs = document.querySelectorAll(".tab");
const searchBox = document.querySelector(".search-box");
const genreGuide = document.querySelector("#genre-guide");
const genreSelector = document.querySelector("#genre-selector");
const genreDetail = document.querySelector("#genre-detail");
const themeDialog = document.querySelector("#theme-dialog");
const themeDialogContent = document.querySelector("#theme-dialog-content");
const themeDialogTitle = document.querySelector("#theme-dialog-title");
const copyStatus = document.querySelector("#copy-status");

let activeCategory = "temas";
let activeGenreId = genreGuides[0].id;

function renderCards() {
  const isGenreGuide = activeCategory === "generos";
  genreGuide.hidden = !isGenreGuide;
  grid.hidden = isGenreGuide;
  emptyState.hidden = true;
  searchBox.hidden = isGenreGuide;

  if (isGenreGuide) {
    resultsLabel.textContent = categoryLabels.generos;
    resultsCount.textContent = `${genreGuides.length} gêneros`;
    renderGenreGuide();
    return;
  }

  const normalizeSearchText = (value) => String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");

  const query = normalizeSearchText(searchInput.value.trim());
  const cards = library[activeCategory].filter((item) =>
    normalizeSearchText([
      item.eixoTematico,
      item.tag,
      item.title,
      item.motivacao,
      item.description,
      ...(item.principaisDesafios ?? []),
      ...(item.teses ?? []),
      ...(item.repertoriosSocioculturais ?? []).flatMap(({ titulo, relacao }) => [titulo, relacao]),
    ].join(" ")).includes(query),
  );

  resultsLabel.textContent = categoryLabels[activeCategory];
  resultsCount.textContent = `${cards.length} ${cards.length === 1 ? "resultado" : "resultados"}`;
  emptyState.hidden = cards.length > 0;
  grid.setAttribute("aria-busy", "true");
  grid.replaceChildren(
    ...cards.map((item, index) => {
      const card = document.createElement("article");
      card.className = "content-card";

      const topline = document.createElement("div");
      topline.className = "card-topline";

      const tag = document.createElement("span");
      tag.className = "card-tag";
      tag.textContent = item.eixoTematico ?? item.tag;

      const number = document.createElement("span");
      number.className = "card-number";
      number.textContent = String(index + 1).padStart(2, "0");
      topline.append(tag, number);

      const title = document.createElement("h3");
      title.textContent = item.title;

      const description = document.createElement("p");
      description.textContent = item.motivacao ?? item.description;
      card.append(topline, title, description);

      if (item.principaisDesafios) {
        const challenges = document.createElement("ul");
        challenges.className = "card-challenges";
        const label = document.createElement("span");
        label.className = "card-detail-label";
        label.textContent = "PRINCIPAIS DESAFIOS";
        challenges.append(label);

        item.principaisDesafios.forEach((challenge) => {
          const listItem = document.createElement("li");
          listItem.textContent = challenge;
          challenges.append(listItem);
        });

        card.append(challenges);
      }

        const studyButton = document.createElement("button");
        studyButton.className = "theme-study-button";
        studyButton.type = "button";
        studyButton.dataset.themeIndex = String(library.temas.indexOf(item));
        studyButton.textContent = "Ver argumentos e repertórios ↗";

        if (activeCategory === "temas") {
          card.append(studyButton);
        } else if (activeCategory === "repertorios") {
          const repertoryButton = document.createElement("button");
          repertoryButton.className = "repertory-study-button";
          repertoryButton.type = "button";
          repertoryButton.dataset.repertoryIndex = String(library.repertorios.indexOf(item));
          repertoryButton.textContent = "Consultar repertório ↗";
          repertoryButton.setAttribute("aria-label", `Consultar repertório ${item.title}`);
          card.append(repertoryButton);
        } else {
          const arrow = document.createElement("span");
          arrow.className = "card-arrow";
          arrow.setAttribute("aria-hidden", "true");
          arrow.textContent = "↗";
          card.append(arrow);
        }
        return card;
    }),
  );
  grid.setAttribute("aria-busy", "false");
}

function addCopyButton(container, text, label = "Copiar") {
  const button = document.createElement("button");
  button.className = "copy-button";
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(text);
      copyStatus.textContent = "Texto copiado para a área de transferência.";
    } catch (error) {
      copyStatus.textContent = "Não foi possível copiar. Selecione e copie o texto manualmente.";
      console.error("Falha ao copiar texto do painel de repertórios.", error);
    }
  });
  container.append(button);
}

function openThemeStudy(theme) {
  themeDialogTitle.textContent = theme.title;
  copyStatus.textContent = "";

  const thesisSection = document.createElement("section");
  thesisSection.className = "study-section";
  const thesisHeading = document.createElement("h3");
  thesisHeading.textContent = "Teses para inspirar";
  thesisSection.append(thesisHeading);
  theme.teses.forEach((thesis, index) => {
    const item = document.createElement("article");
    item.className = "study-item";
    const itemHeading = document.createElement("h4");
    itemHeading.textContent = `Possibilidade ${index + 1}`;
    const text = document.createElement("p");
    text.textContent = thesis;
    item.append(itemHeading, text);
    addCopyButton(item, thesis);
    thesisSection.append(item);
  });

  const repertorySection = document.createElement("section");
  repertorySection.className = "study-section";
  const repertoryHeading = document.createElement("h3");
  repertoryHeading.textContent = "Repertórios socioculturais";
  repertorySection.append(repertoryHeading);
  theme.repertoriosSocioculturais.forEach((repertory) => {
    const item = document.createElement("article");
    item.className = "study-item";
    const category = document.createElement("span");
    category.className = "study-category";
    category.textContent = repertory.categoria;
    const title = document.createElement("h4");
    title.textContent = repertory.titulo;
    const relation = document.createElement("p");
    relation.textContent = repertory.relacao;
    item.append(category, title, relation);

    const linkedRepertory = findRepertoryByTitle(repertory.titulo);
    if (linkedRepertory) {
      const openButton = document.createElement("button");
      openButton.className = "study-open-repertory";
      openButton.type = "button";
      openButton.textContent = "Ler explicação pedagógica";
      openButton.setAttribute("aria-label", `Abrir explicação do repertório ${linkedRepertory.title}`);
      openButton.addEventListener("click", () => openRepertory(linkedRepertory));
      item.append(openButton);
    }

    addCopyButton(item, `${repertory.titulo}\n${repertory.relacao}`);
    repertorySection.append(item);
  });

  themeDialogContent.replaceChildren(thesisSection, repertorySection);
  if (!themeDialog.open) {
    themeDialog.showModal();
  }
}

function openRepertory(repertory) {
  if (!repertory || typeof repertory.title !== "string") {
    copyStatus.textContent = "Não foi possível abrir este repertório. Tente novamente.";
    console.error("Dados inválidos ao abrir repertório.", repertory);
    return;
  }

  themeDialogTitle.textContent = repertory.title;
  copyStatus.textContent = "";

  const detailContainer = document.createElement("div");
  detailContainer.className = "repertory-detail";

  const identity = document.createElement("div");
  identity.className = "repertory-detail-identity";
  const category = document.createElement("span");
  category.className = "study-category";
  category.textContent = repertory.tag;
  identity.append(category);

  if (Array.isArray(repertory.axes) && repertory.axes.length) {
    const axes = document.createElement("div");
    axes.className = "repertory-axes";
    repertory.axes.forEach((axis) => {
      const chip = document.createElement("span");
      chip.textContent = axis;
      axes.append(chip);
    });
    identity.append(axes);
  }

  detailContainer.append(identity);

  const detailFields = [
    ["O que é", repertory.whatIs || repertory.description],
    ["Origem", repertory.origin],
    ["Contexto", repertory.context],
    ["Ideia central", repertory.centralIdea],
    ["Relação com a sociedade", repertory.societyRelation],
    ["Como utilizar na redação", repertory.howToUse],
    ["Exemplo de aplicação", repertory.applicationExample],
    ["Atenção", repertory.attention],
  ];

  detailFields.forEach(([title, text]) => {
    if (!text) return;
    const section = document.createElement("section");
    section.className = "repertory-detail-section";
    section.append(
      createTextElement("h3", "", title),
      createTextElement("p", "", text),
    );
    detailContainer.append(section);
  });

  const copyText = [
    repertory.title,
    repertory.description,
    repertory.whatIs,
    repertory.origin,
    repertory.context,
    repertory.centralIdea,
    repertory.societyRelation,
    repertory.howToUse,
    repertory.applicationExample,
    repertory.attention,
  ].filter(Boolean).join("\n\n");

  const copyRow = document.createElement("div");
  copyRow.className = "repertory-copy-row";
  addCopyButton(copyRow, copyText, "Copiar repertório completo");
  detailContainer.append(copyRow);

  themeDialogContent.replaceChildren(detailContainer);

  try {
    if (!themeDialog.open) {
      themeDialog.showModal();
    }
  } catch (error) {
    copyStatus.textContent = "Não foi possível abrir o painel. Tente novamente.";
    console.error("Falha ao abrir painel de repertório.", error);
  }
}

function renderGenreGuide() {
  const selectedGenre = genreGuides.find((genre) => genre.id === activeGenreId);
  genreSelector.replaceChildren(
    ...genreGuides.map((genre) => {
      const button = document.createElement("button");
      const isActive = genre.id === activeGenreId;
      button.className = `genre-option${isActive ? " is-active" : ""}`;
      button.type = "button";
      button.textContent = genre.title;
      button.setAttribute("aria-pressed", String(isActive));
      button.addEventListener("click", () => {
        activeGenreId = genre.id;
        renderGenreGuide();
      });
      return button;
    }),
  );

  const heading = document.createElement("div");
  heading.className = "genre-detail-heading";
  const title = document.createElement("h4");
  title.textContent = selectedGenre.title;
  const description = document.createElement("p");
  description.textContent = selectedGenre.description;
  heading.append(title, description);

  const structure = document.createElement("div");
  structure.className = "genre-structure";
  selectedGenre.structure.forEach((step, index) => {
    const item = document.createElement("article");
    item.className = "structure-step";
    const number = document.createElement("span");
    number.className = "step-number";
    number.textContent = String(index + 1).padStart(2, "0");
    const stepTitle = document.createElement("h5");
    stepTitle.textContent = step.title;
    const stepDescription = document.createElement("p");
    stepDescription.textContent = step.description;
    item.append(number, stepTitle, stepDescription);
    structure.append(item);
  });

  const tipsHeading = document.createElement("h4");
  tipsHeading.className = "tips-heading";
  tipsHeading.textContent = "Dicas por banca";
  const tips = document.createElement("div");
  tips.className = "exam-tips";
  Object.entries(selectedGenre.tips).forEach(([exam, advice]) => {
    const tip = document.createElement("article");
    tip.className = "exam-tip";
    const examName = document.createElement("h5");
    examName.textContent = exam;
    const examAdvice = document.createElement("p");
    examAdvice.textContent = advice;
    tip.append(examName, examAdvice);
    tips.append(tip);
  });

  genreDetail.replaceChildren(heading, structure, tipsHeading, tips);
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    activeCategory = tab.dataset.category;
    tabs.forEach((item) => {
      const isActive = item === tab;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-pressed", String(isActive));
    });
    renderCards();
  });
});

searchInput.addEventListener("input", renderCards);

grid.addEventListener("click", (event) => {
  const repertoryButton = event.target.closest(".repertory-study-button");
  if (repertoryButton) {
    const repertoryIndex = Number(repertoryButton.dataset.repertoryIndex);
    const repertory = library.repertorios[repertoryIndex];
    if (!repertory) {
      copyStatus.textContent = "Não foi possível localizar este repertório. Tente novamente.";
      console.error("Repertório não encontrado no índice", repertoryIndex);
      return;
    }
    openRepertory(repertory);
    return;
  }

  const themeButton = event.target.closest(".theme-study-button");
  if (!themeButton) return;

  const theme = library.temas[Number(themeButton.dataset.themeIndex)];
  if (!theme) {
    console.error("Tema não encontrado para abrir o painel de repertórios.");
    copyStatus.textContent = "Não foi possível localizar este tema. Tente novamente.";
    return;
  }
  openThemeStudy(theme);
});

document.querySelector("#theme-dialog-close").addEventListener("click", () => {
  themeDialog.close();
});

themeDialog.addEventListener("click", (event) => {
  if (event.target === themeDialog) themeDialog.close();
});

document.addEventListener("keydown", (event) => {
  const target = event.target;
  const isEditable = target instanceof HTMLInputElement
    || target instanceof HTMLTextAreaElement
    || (target instanceof HTMLElement && target.isContentEditable);
  if (event.key === "/" && !isEditable) {
    event.preventDefault();
    searchInput.focus();
  }
});

const textToCorrect = document.querySelector("#text-to-correct");
const essayTheme = document.querySelector("#essay-theme");
const characterCount = document.querySelector("#character-count");
const clearTextButton = document.querySelector("#clear-text");
const correctTextButton = document.querySelector("#correct-text");
const correctedOutput = document.querySelector("#corrected-output");
const copyCorrectedButton = document.querySelector("#copy-corrected");
const correctionSummary = document.querySelector("#correction-summary");
let currentCorrectedText = "";

const competencyTitles = [
  "Competência 1 · Modalidade escrita formal",
  "Competência 2 · Tema e repertório",
  "Competência 3 · Projeto de texto e argumentação",
  "Competência 4 · Coesão",
  "Competência 5 · Proposta de intervenção",
];

function isAssessmentResponse(result) {
  const validScores = [0, 40, 80, 120, 160, 200];
  return (
    result &&
    typeof result === "object" &&
    typeof result.correctedText === "string" &&
    result.correctedText.trim().length > 0 &&
    Array.isArray(result.competencies) &&
    result.competencies.length === 5 &&
    result.competencies.every(
      (item) =>
        item &&
        validScores.includes(item.score) &&
        typeof item.rationale === "string" &&
        typeof item.evidence === "string" &&
        Array.isArray(item.suggestions) &&
        item.suggestions.every((suggestion) => typeof suggestion === "string"),
    ) &&
    typeof result.summary === "string" &&
    result.summary.trim().length > 0 &&
    Array.isArray(result.corrections) &&
    result.corrections.length <= 30 &&
    result.corrections.every(
      (item) =>
        item &&
        typeof item.original === "string" && item.original.trim().length > 0 &&
        typeof item.corrected === "string" && item.corrected.trim().length > 0 &&
        typeof item.reason === "string" && item.reason.trim().length > 0,
    ) &&
    Array.isArray(result.strengths) &&
    result.strengths.length > 0 &&
    result.strengths.length <= 5 &&
    result.strengths.every((item) => typeof item === "string" && item.trim().length > 0) &&
    Array.isArray(result.nextSteps) &&
    result.nextSteps.length > 0 &&
    result.nextSteps.length <= 5 &&
    result.nextSteps.every((item) => typeof item === "string" && item.trim().length > 0)
  );
}

function isTestAssessment(result) {
  return typeof result?.summary === "string"
    && result.summary.startsWith("Modo de demonstração:");
}

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text;
  return element;
}

function createList(items) {
  const list = document.createElement("ul");
  list.className = "assessment-list";
  items.forEach((text) => list.append(createTextElement("li", "", text)));
  return list;
}

function createAssessmentSection(title, content) {
  const section = document.createElement("section");
  section.className = "assessment-section";
  section.append(createTextElement("h3", "", title), content);
  return section;
}

function renderAssessment(result) {
  currentCorrectedText = result.correctedText;
  const score = result.competencies.reduce((total, item) => total + item.score, 0);
  const testModeActive = isTestAssessment(result);
  const scoreCard = document.createElement("div");
  scoreCard.className = "assessment-score";
  const scoreDescription = document.createElement("div");
  scoreDescription.append(
    createTextElement("h3", "", testModeActive ? "Nota de demonstração" : "Nota estimada"),
    createTextElement("p", "", testModeActive
      ? "Modo de teste · soma fixa das cinco competências · não representa avaliação real"
      : "Soma das cinco competências · máximo de 1.000 pontos"),
  );
  scoreCard.append(scoreDescription, createTextElement("strong", "", `${score}/1000`));

  const summarySection = createAssessmentSection(
    "Visão geral",
    createTextElement("p", "", result.summary),
  );

  const competencySection = document.createElement("section");
  competencySection.className = "assessment-section";
  competencySection.append(createTextElement("h3", "", "Avaliação por competência"));
  result.competencies.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "competency-card";
    const heading = document.createElement("div");
    heading.className = "competency-heading";
    heading.append(
      createTextElement("span", "", competencyTitles[index]),
      createTextElement("strong", "", `${item.score}/200`),
    );
    const rationale = document.createElement("p");
    rationale.append(createTextElement("span", "", "Justificativa: "), document.createTextNode(item.rationale));
    const evidence = document.createElement("p");
    evidence.append(createTextElement("span", "", "Evidência: "), document.createTextNode(item.evidence));
    card.append(heading, rationale, evidence);
    if (item.suggestions.length) {
      const suggestions = document.createElement("p");
      suggestions.append(
        createTextElement("span", "", "Para melhorar: "),
        document.createTextNode(item.suggestions.join(" ")),
      );
      card.append(suggestions);
    }
    competencySection.append(card);
  });

  const revision = document.createElement("p");
  revision.className = "revision-text";
  revision.textContent = result.correctedText;
  const correctionList = document.createElement("div");
  correctionList.className = "orthography-corrections";
  if (result.corrections.length) {
    result.corrections.forEach((item) => {
      const correction = document.createElement("article");
      correction.className = "orthography-correction";
      correction.append(
        createTextElement("strong", "", `${item.original} → ${item.corrected}`),
        createTextElement("p", "", item.reason),
      );
      correctionList.append(correction);
    });
  } else {
    correctionList.append(createTextElement("p", "no-corrections", "Não foram necessárias alterações ortográficas ou gramaticais relevantes nesta revisão."));
  }
  const strengthsSection = createAssessmentSection("Pontos fortes", createList(result.strengths));
  const nextStepsSection = createAssessmentSection("Prioridades para a próxima versão", createList(result.nextSteps));
  correctedOutput.replaceChildren(
    scoreCard,
    summarySection,
    competencySection,
    createAssessmentSection("Correções ortográficas e gramaticais", correctionList),
    createAssessmentSection("Texto corrigido (ortografia e gramática)", revision),
    strengthsSection,
    nextStepsSection,
  );
  copyCorrectedButton.disabled = false;
}

textToCorrect.addEventListener("input", () => {
  const count = textToCorrect.value.length;
  characterCount.textContent = `${count} ${count === 1 ? "caractere" : "caracteres"}`;
  textToCorrect.removeAttribute("aria-invalid");
});

const themeCharacterCount = document.querySelector("#theme-character-count");

essayTheme.addEventListener("input", () => {
  themeCharacterCount.textContent = `${essayTheme.value.length} de 1500 caracteres`;
  essayTheme.removeAttribute("aria-invalid");
});

clearTextButton.addEventListener("click", () => {
  textToCorrect.value = "";
  essayTheme.value = "";
  textToCorrect.removeAttribute("aria-invalid");
  essayTheme.removeAttribute("aria-invalid");
  if (themeCharacterCount) themeCharacterCount.textContent = "0 de 1500 caracteres";
  const emptyState = document.createElement("div");
  emptyState.className = "empty-correction";
  emptyState.append(
    createTextElement("span", "", "✦"),
    createTextElement("p", "", "A nota por competência e as sugestões aparecerão aqui."),
  );
  correctedOutput.replaceChildren(emptyState);
  correctionSummary.textContent = "";
  copyCorrectedButton.disabled = true;
  textToCorrect.focus();
});

correctTextButton.addEventListener("click", async () => {
  if (!textToCorrect.value.trim()) {
    textToCorrect.setAttribute("aria-invalid", "true");
    correctionSummary.textContent = "Cole ou digite sua redação antes de solicitar a avaliação.";
    textToCorrect.focus();
    return;
  }
  textToCorrect.removeAttribute("aria-invalid");
  if (!essayTheme.value.trim()) {
    essayTheme.setAttribute("aria-invalid", "true");
    correctionSummary.textContent = "Informe também o tema e a proposta para avaliar a Competência 2 com mais rigor.";
    essayTheme.focus();
    return;
  }
  essayTheme.removeAttribute("aria-invalid");

  correctTextButton.disabled = true;
  copyCorrectedButton.disabled = true;
  const originalButtonText = correctTextButton.innerHTML;
  correctTextButton.innerHTML = 'Avaliando... <span aria-hidden="true">✦</span>';
  correctionSummary.textContent = "Avaliando as competências e fazendo uma segunda revisão ortográfica...";
  correctedOutput.setAttribute("aria-busy", "true");

  const browserController = new AbortController();
  const browserTimeout = setTimeout(() => browserController.abort(), 95_000);

  try {
    const response = await fetch("/api/correct", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: browserController.signal,
      body: JSON.stringify({
        theme: essayTheme.value,
        essay: textToCorrect.value,
      }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.error?.message || "O serviço de correção não conseguiu processar o pedido.");
    }
    if (!payload || !isAssessmentResponse(payload.result)) {
      throw new Error("A resposta do serviço veio incompleta ou em formato inválido. Tente novamente.");
    }
    renderAssessment(payload.result);
    correctionSummary.textContent = isTestAssessment(payload.result)
      ? "Resultado de demonstração concluído. Os 880 pontos são fixos e não representam uma avaliação real pelo Gemini."
      : "Avaliação concluída. A nota é uma estimativa de estudo, não uma correção oficial do Enem.";
  } catch (error) {
    correctionSummary.textContent = error.name === "AbortError"
      ? "O navegador interrompeu uma avaliação que excedeu o tempo esperado. Tente novamente."
      : error instanceof TypeError
        ? "Não foi possível conectar ao servidor. Verifique se o backend está em execução e tente novamente."
        : error.message;
    console.error("Falha na avaliação da redação.", error);
  } finally {
    clearTimeout(browserTimeout);
    correctTextButton.disabled = false;
    correctTextButton.innerHTML = originalButtonText;
    correctedOutput.setAttribute("aria-busy", "false");
  }
});

copyCorrectedButton.addEventListener("click", async () => {
  if (!currentCorrectedText) return;

  try {
    await navigator.clipboard.writeText(currentCorrectedText);
    correctionSummary.textContent = "Versão revisada copiada para a área de transferência.";
  } catch (error) {
    correctionSummary.textContent = "Não foi possível copiar. Selecione a versão revisada e copie manualmente.";
    console.error("Falha ao copiar a versão revisada.", error);
  }
});

function findRepertoryByTitle(title) {
  const normalized = String(title ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/g, " ")
    .trim();

  return library.repertorios.find((repertory) => {
    const repertoryTitle = repertory.title
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR")
      .replace(/\s+/g, " ")
      .trim();
    return repertoryTitle === normalized
      || repertoryTitle.includes(normalized)
      || normalized.includes(repertoryTitle);
  });
}

renderCards();
