// Biblioteca: 7 livros (com PDF gerado) + 5 artigos (texto) + 2 correções de capa
export type BookDef = {
  mentorEmail: string
  title: string
  description: string
  category: string
  level: 'INICIANTE' | 'INTERMEDIARIO' | 'AVANCADO'
  coverUrl: string
  pdfSlug: string
  subtitle: string
  author: string
  pages: { heading: string; body: string }[]
}

export type ArticleDef = {
  mentorEmail: string
  title: string
  description: string
  category: string
  level: 'INICIANTE' | 'INTERMEDIARIO' | 'AVANCADO'
  coverUrl: string
  readingMin: number
  content: string
}

export const newBooks: BookDef[] = [
  {
    mentorEmail: 'carlos@demo.com',
    title: 'Clean Code na Prática — apostila',
    description:
      'Apostila prática de código limpo: nomes que explicam, funções curtas, comentários honestos e refatoração sem medo. Com exemplos antes/depois em TypeScript para você aplicar no projeto de hoje mesmo.',
    category: 'Tecnologia',
    level: 'INTERMEDIARIO',
    coverUrl: '/uploads/seed/livro-cleancode.png',
    pdfSlug: 'livro-cleancode.pdf',
    subtitle: 'Nomes, funções e refatoração para quem escreve código todos os dias',
    author: 'Carlos Ferreira',
    pages: [
      {
        heading: '1. Nomes que explicam',
        body:
          'O nome é a documentação mais lida do código. Variáveis e funções devem responder três perguntas: o que existe, por que existe e como é usado.\n\n## Antes e depois\n\nRuim: const d = 30 // dias?\nBom: const diasParaEntrega = 30\n\nRuim: function calc(a, b)\nBom: function calcularDesconto(valorOriginal, percentualDesconto)\n\n## Regras práticas\n\nEvite abreviações criativas: usr, mgr, tmp. Se precisa de um comentário para explicar o nome, o nome está errado.\n\nUse o vocabulário do domínio: em e-commerce, "carrinho" e "pedido" têm significado exato — invente termos e o time inteiro paga a confusão.\n\nBooleanos merecem prefixos: isAtivo, temDesconto, podeEditar. Uma leitura e o significado é claro.',
      },
      {
        heading: '2. Funções: uma coisa por vez',
        body:
          'Uma função faz UMA coisa. Se você precisa de "e" para descrever o que ela faz ("valida e salva e envia e-mail"), ela precisa virar três.\n\n## O teste do nível de abstração\nTodas as linhas de uma função devem viver no mesmo nível de detalhe. Misturar "calcularJuros()" com "req.headers.authorization.split()" na mesma função é o cheiro de refatoração.\n\n## Tamanho\n\nRegra de bolso: se a função não cabe em uma tela sem rolar, considere quebrá-la. Funções curtas têm nomes claros, são testáveis isoladamente e reduzem bugs em metade.\n\n## Argumentos\n\nZero ou um argumento é o ideal. Três já é sinal de alerta; quatro ou mais, crie um objeto:\n\nRuim: criarPedido(nome, email, produto, qtd, preco, cupom)\nBom: criarPedido({ cliente, itens, cupom })\n\n## Efeitos colaterais\nUma função chamada "validarCPF" que também salva no banco quebra a confiança de quem lê. Efeitos precisam estar no nome ou fora da função.',
      },
      {
        heading: '3. Comentários honestos (e quando deletá-los)',
        body:
          'O comentário ideal é o que você não precisou escrever porque o código se explicou. Na prática, comentários honestos caem em três casos:\n\n1. Consequência intencional não óbvia: "// forçado a rodar antes do middleware de sessão".\n2. Esclarecimento de regra de negócio estranha: "// auditoria exige 2 anos, não 1".\n3. Aviso de dívida consciente: "// TODO: substituir quando a API v2 sair — ticket #482".\n\n## Comentários que devem ser DELETADOS\n\nRuído: "// incrementa i" (o i++ já disse isso).\n\nLixo comentado: blocos de código antigos comentados — para isso existe o git. O histórico guarda tudo; o arquivo não precisa.\n\nComentário-mentira: o código mudou e o comentário ficou no tempo passado. Comentário errado é pior que nenhum: ele engana quem confia.\n\n## A regra de ouro\nAntes de comentar, pergunte: dá para renomear, extrair função ou reestruturar para o código se explicar? Se sim, faça isso. O comentário é o último recurso, não o primeiro.',
      },
      {
        heading: '4. Refatoração sem medo',
        body:
          'Refatorar é mudar a ESTRUTURA sem mudar o COMPORTAMENTO. A condição que torna isso seguro tem nome: testes. Sem testes, refatorar é operar no escuro.\n\n## O ciclo do refactoring\n\n1. Escreva um teste que captura o comportamento atual.\n2. Faça a mudança pequena (renomear, extrair função, mover método).\n3. Rode os testes. Verde? Próxima mudança. Vermelho? Desfaça ou corrija.\n\nMudanças PEQUENAS e VERIFICADAS batem a grande reescrita "do zero" em 9 de cada 10 casos.\n\n## Os três refactorings mais rentáveis\n\nExtrair função: bloco confuso vira função com nome que explica a intenção.\n\nRenomear: nomes antigos que enganam viram nomes que contam a verdade.\n\nMover: código no lugar errado (regra de negócio no controller, SQL no componente) vai para a camada certa.\n\n## O hábito da regra do escoteiro\nDeixe o código um pouco melhor do que encontrou: a cada visita a um arquivo, uma pequena melhoria. Seis meses disso transformam a base de código inteira — sem sprint de refatoração, sem medo.',
      },
    ],
  },
  {
    mentorEmail: 'rafael@demo.com',
    title: 'Marketing Digital para Pequenos Negócios',
    description:
      'Guia direto ao ponto para o dono de pequeno negócio: o que fazer primeiro (e o que ignorar), como aparecer no Google e no Instagram sem agência, e como transformar seguidores em clientes de verdade — com orçamento pequeno e sem termos complicados.',
    category: 'Marketing',
    level: 'INICIANTE',
    coverUrl: '/uploads/seed/livro-marketing-digital.png',
    pdfSlug: 'livro-marketing-digital.pdf',
    subtitle: 'O que fazer primeiro, o que ignorar e como vender sem agência',
    author: 'Rafael Almeida',
    pages: [
      {
        heading: '1. A fundação: quem compra de você e por quê',
        body:
          'Antes de post, anúncio ou site: quem é seu cliente e qual problema seu negócio resolve para ele.\n\n## O cliente não quer seu produto — quer o resultado\nNinguém quer "personal trainer". Quer caber na roupa do casamento. Ninguém quer "confeitaria". Quer o bolo que faz a festa ser lembrada.\n\nReescreva sua oferta em resultado: "Ajudo [quem] a [resultado] com [o que você faz]".\n\n## O raio-X do cliente ideal\nResponda sem chutes:\n\n1. Onde ele vive/trabalha (raio de atendimento real)?\n2. Quanto paga hoje pela alternativa (concorrência, gambiarra, nada)?\n3. O que ele pesquisa no Google antes de comprar?\n\n## A promessa em uma frase\nSua bio do Instagram e do Google precisam responder em 5 segundos: o que é, para quem, e por que você e não o vizinho. "Doces artesanais para festas em Recife com entrega em 48h e nota 4.9" vende mais que "Doces com amor desde 2019". Amor não é diferencial; especificidade é.',
      },
      {
        heading: '2. Google primeiro: o cliente procura antes de comprar',
        body:
          'O caminho do cliente de bairro: ouviu falar → pesquisou no Google → olhou avaliações → decidiu. Se você não aparece nessa pesquisa, o orçamento de marketing vai para o concorrente.\n\n## Perfil da Empresa (Google Meu Negócio) — o ativo nº1\n\n1. Reivindique o perfil e complete TUDO: categoria certa, horário, telefone, WhatsApp, fotos reais (mínimo 10 — fachada, produto, equipe, ambiente).\n2. Colete avaliações TODA semana: QR code na balcão/caixa apontando para o link de avaliação. Responda todas — bom e ruim, com educação.\n3. Poste 1x por semana no perfil (novidade, foto de entrega, oferta).\n\nPerfil completo + avaliações recentes = topo do mapa local. Isso é mais impacto que qualquer anúncio para negócio físico.\n\n## WhatsApp Business configurado\n\n- Catálogo com fotos e preços (a vitrine que o cliente pede antes de vir).\n- Mensagem de saudação e ausência configuradas.\n- Etiquetas por etapa: novo → orçamento enviado → fechado → recorrente.',
      },
      {
        heading: '3. Instagram que gera cliente (não só curtida)',
        body:
          'Instagram para pequeno negócio não é sobre viralizar: é sobre CONFIANÇA. O cliente olhou o perfil e decidiu em 30 segundos se confia.\n\n## Os 3 tipos de post que pequeno negócio precisa\n\n1. **Prova** (50%): o trabalho feito — antes/depois, entrega do dia, resultado do cliente. É o que converte.\n2. **Procedimento** (30%): como você faz, bastidores, matéria-prima. Processo visível = confiança + percepção de profissionalismo.\n3. **Oferta** (20%): promoção, novidade, aviso ("agenda de dezembro aberta").\n\n## Frequência realista\n3 posts por semana + stories diários curtos (2-3). Consistência pequena vence explosão seguida de sumiço — o algoritmo e o cliente punem o sumiço.\n\n## A régua de conversão\nO que importa não é seguidor: é conversa iniciada ("vi seu perfil, quanto custa?"). Peça o contato no post ("chama no WhatsApp para orçamento") e MEÇA quantas conversas por semana. Mais conversas = marketing funcionando. Mais curtidas sem conversa = show bonito sem venda.',
      },
      {
        heading: '4. Orçamento pequeno, decisão grande',
        body:
          '## O que fazer com R$300/mês (na ordem)\n\n1. **R$0 — Fundação**: Perfil Google completo + avaliações + WhatsApp Business. Imprescindível e gratuito.\n2. **R$200 — Impulsionamento local**: impulsionar seus 2 melhores posts (os que geraram mais salvamento/comentário) para raio de 5-10km do seu público. Post impulsionado = post que JÁ funcionou organicamente, nunca post fraco.\n3. **R$100 — Reserva de teste**: 1 teste por mês (parceria com micro-influencer local de nicho, brinde surpresa, materiais).\n\n## O que NÃO gastar no início\n\n- Site caro de R$3.000: link do WhatsApp + Instagram + Google resolvem 90% dos negócios locais no começo.\n- Agência de gestão por R$1.500/mês quando o faturamento é R$5.000: aprenda o básico (este livro + mentoria) e faça você mesmo até o volume justificar.\n- Logotipo de R$800: um nome bonito com fonte boa e cor consistente basta.\n\n## A régua de investimento\nMarketing = % da receita, não "o que sobrar". 5-8% da receita mensal em marketing é o mínimo saudável para crescer. Dinheiro investido medido (quantas conversas? quantas vendas?) se paga; dinheiro gasto às cegas é sorte.',
      },
    ],
  },
  {
    mentorEmail: 'david@demo.com',
    title: 'Primeiros Passos na Bolsa de Valores',
    description:
      'Apostila de investimentos para quem quer entender a bolsa sem se queimar: como funcionam ações, o que são índices e ETFs, dividendos na prática e os 10 erros que destroem iniciantes. Base sólida antes do primeiro clique no home broker.',
    category: 'Finanças',
    level: 'INICIANTE',
    coverUrl: '/uploads/seed/livro-bolsa.png',
    pdfSlug: 'livro-bolsa.pdf',
    subtitle: 'O guia honesto para o seu primeiro investimento em renda variável',
    author: 'David Okoye, CFP®',
    pages: [
      {
        heading: '1. Antes da bolsa: a ordem que protege',
        body:
          'O erro mais caro do iniciante não é escolher a ação errada — é entrar na bolsa com a casa desarrumada.\n\n## A escada de prioridades\n\n1. Dívidas caras quitadas (cartão rotativo a 14%/mês "rende" mais que qualquer ação — quitá-lo É o melhor investimento do Brasil).\n2. Reserva de emergência montada (3-6 meses de gastos em Tesouro Selic ou CDB liquidez diária).\n3. Objetivos de curto prazo SEPARADOS (viagem do ano que vem NÃO entra na bolsa).\n4. Só então: bolsa, com dinheiro que pode ficar 5+ anos parado.\n\n## Por que a ordem importa\nA bolsa oscila -30% em crises (2008, 2020 — histórico real, vai acontecer de novo). Quem precisa do dinheiro no meio da crise vende no fundo — e transforma oscilação temporária em PERDA permanente. Horizonte é o seguro de vida do investidor.\n\n## O teste do sono (antes do primeiro clique)\nSe R$10.000 virarem R$7.000 em um mês, você: (a) compra mais, (b) segura tranquilo, (c) vende e nunca mais. Respostas a e b: pode começar com percentual pequeno. Resposta c: comece por renda fixa e estude mais — a bolsa vai continuar aqui quando você estiver pronto.',
      },
      {
        heading: '2. Ação: o que você compra de verdade',
        body:
          'Uma ação é um pedacinho de empresa — com direitos e oscilações de dono de negócio, não um número em tela.\n\n## As duas fontes de retorno\n\n1. **Dividendos**: parte do lucro distribuída aos acionistas. Empresas maduras pagam regularmente (setores: seguros, energia, saneamento, bancos).\n2. **Valorização**: o preço sobe quando a empresa cresce/lucra mais e o mercado confia.\n\n## O preço segue o lucro (no longo prazo)\nNo curto prazo, preço é humor (notícia, eleição, pânico). No longo prazo (5-10 anos), preço acompanha LUCRO da empresa. Por isso o investidor sério olha: a empresa lucra? lucra crescendo? a dívida é controlada? paga bons dividendos?\n\n## Como começar sem escolher ações (a resposta honesta)\nEscolher ações individuais exige análise e tempo. O caminho do iniciante sensato é o **ETF**: um título que replica um índice inteiro.\n\nBOVA11 = as ~90 maiores empresas do Brasil de uma vez. IVVB11 = as 500 maiores dos EUA. Diversificação em um clique, custo baixo, zero necessidade de acompanhar notícia por notícia.\n\nAprenda com ETF; quando (se) quiser ações individuais, será com base e estômago formados.',
      },
      {
        heading: '3. Dividendos na prática',
        body:
          '## O que são (sem romantismo)\nDividendo é a parcela do lucro que a empresa devolve ao dono. Empresas estáveis pagam MENSAL ou trimestralmente. No Brasil, dividendos de ações são isentos de imposto de renda para pessoa física.\n\n## Yield: o número que importa (com pegadinha)\nYield = dividendo anual ÷ preço da ação. Yield de 6-10% é comum em boas pagadoras. Mas:\n\n- Yield ALTÍSSIMO (15%+) = geralmente preço desabando (o mercado desconta problema) ou dividendo pontual. Cuidado com armadilha de rendimento.\n- Dividendo é LUCRO distribuído: empresa sem lucro não mantém dividendo.\n\n## Como receber na prática\n\n1. Compre a ação até a data-com (DATA COM no home broker mostra o corte).\n2. Dividendo cai na sua conta automaticamente em ~1 mês.\n3. Reinvestir: usar os dividendos para comprar MAIS ações é o que faz a "bola de neve de renda" — a renda que compra renda.\n\n## A meta realista\nRenda passiva séria é construída com PORTFOLIO diversificado + aportes constantes + reinvestimento por anos. R$100/mês em pagadoras de dividendos hoje não paga suas contas — mas em 20 anos com reinvestimento e aportes, sim. Tempo é o ingrediente que nenhuma dica de Telegram substitui.',
      },
      {
        heading: '4. Os 10 erros que destroem iniciantes',
        body:
          '1. Entrar sem reserva de emergência — a crise chega, vende-se no fundo.\n2. Apostar tudo em uma "dica" — concentração transforma mercado em cassino.\n3. Comprar no euforia e vender no pânico — o padrão que faz o investidor médio perder para o próprio mercado.\n4. Operar day trade sem método — 97% dos day traders perdem dinheiro (estudo da B3). Não é emprego; é profissão.\n5. Usar dinheiro de meta curta — casa no ano que vem NÃO está na bolsa.\n6. Margem/alavancagem no começo — multiplicar perda também é alavancar.\n7. Ignorar taxas — corretagem zero existe, mas olhe taxa de custódia e spread de fundos.\n8. Trocar de estratégia a cada queda — método só funciona com tempo de maturação.\n9. Não registrar aportes — sem planilha/notas, impossível saber seu retorno real.\n10. Desistir na primeira crise — toda década tem 1-2 quedas de 30%+; quem saiu, pagou a conta da impaciência.\n\n## O antídoto de todos eles\nPlano escrito ANTES: quanto aportar por mês, em quê (ETFs + pagadoras), quando rebalancear (1x/ano), e o que fazer na próxima crise (resposta correta: nada além do aporte programado). O plano tira a emoção da mesa — e a emoção é o inimigo real do retorno.',
      },
    ],
  },
  {
    mentorEmail: 'fernanda@demo.com',
    title: 'Receitas que Vendem: bolos e brigadeiros',
    description:
      'As receitas base testadas por anos de encomenda: bolo branco perfeito e variações, brigadeiro gourmet com ponto exato, ganache infalível e o bolo de pote que é campeão de venda. Com dicas de produção em lote para quem vende.',
    category: 'Culinária',
    level: 'INICIANTE',
    coverUrl: '/uploads/seed/livro-receitas.png',
    pdfSlug: 'livro-receitas.pdf',
    subtitle: 'Receitas base testadas em encomenda + segredos de produção',
    author: 'Fernanda Dias',
    pages: [
      {
        heading: '1. Bolo branco perfeito (a base)',
        body:
          '## Ingredientes (forma 22cm)\n\n300g farinha de trigo\n280g açúcar\n200g manteiga sem sal (ambiente)\n4 ovos (ambiente)\n180ml leite\n15g fermento em pó\n1 pitada de sal\n1 colher (chá) de baunilha\n\n## Método\n\n1. Creme manteiga + açúcar por 5 MINUTOS na batedeira (claro e fofo — aqui nasce a textura).\n2. Ovos um a um, incorporando bem cada um.\n3. Alterne secos (peneirados com fermento) e leite: termina na farinha. Misture o mínimo.\n4. Forno 180°C preaquecido, 35-40 min. Palito no centro sai seco = pronto.\n5. Espere 10-15 min para desenformar.\n\n## As 3 leis do bolo\n\nLei 1: batedeira 5 min no creme, colher leve no final (excesso de mistura depois da farinha = borracha).\n\nLei 2: forno preaquecido e PORTA FECHADA até os 25 min.\n\nLei 3: pese TUDO em balança. Copo medidor erra até 20% — em bolo isso é outro produto.\n\n## Variações da mesma base\n\nLaranja: 180ml de suco no lugar do leite + raspas.\nCoco: leite de coco + 80g de coco ralado.\nFubá cremoso: 100g da farinha por fubá mimoso.\nCacau: 40g cacau - 40g farinha.',
      },
      {
        heading: '2. Brigadeiro gourmet com ponto exato',
        body:
          '## Ingredientes (rende ~30 un.)\n\n395g leite condensado (1 lata)\n60g chocolate 50%+ picado (ou 40g cacau em pó de qualidade)\n20g manteiga\n\n## O ponto de enrolar\n\nFogo BAIXO, mexendo sem parar com espátula (~10-12 min):\n\n1. A massa engrossa e começa a brilhar.\n2. TESTE DA PANELA: incline a panela — a massa desliza em BLOCO e demora 2-3 segundos para voltar = ponto.\n3. Despeje em prato untado, cubra com filme ENCOSTADO na massa, esfrie 4h (ou 30 min freezer).\n\n## Enrolando como profissional\n\nMãos com POUCO manteiga (excesso escorrega). Porções de 15g com colher medidora (uniformidade = profissionalismo). Role bolinhas firmes, passe no granulado belga, coloque em forminha nº 4.\n\n## Sabores que vendem\n\nPistache: 30g de pasta de pistache no final.\nNinho com Nutella: troque chocolate por 60g de leite em pó + recheio de Nutella.\nLimão: raspas de 1 limão + gotas de suco, granulado de açúcar cristal.\nChurros: canela no açúcar do rolamento + recheio de doce de leite.\n\n## Produção em lote (para venda)\nTriplo a receita em panela GRANDE de fundo grosso. Não duplique a manteiga integralmente (o ponto muda): use 1,5x. Enrole em sessão com música alta e cape: rende 90 un. em 1h30 com prática.',
      },
      {
        heading: '3. Ganache infalível e bolo de pote',
        body:
          '## Ganache nas proporções certas\n\nCreme de leite QUASE fervendo (borda borbulhando) sobre chocolate picado. Espere 2 min. Misture do CENTRO para fora até homogêneo.\n\nRecheio macio: 2 chocolate : 1 creme\nCobertura brilhante: 1 : 1\nTrufa firme: 2 : 1 (e à geladeira)\n\nTalhou (granulada)? 1 colher de leite frio + mexer suave volta. Ficou opaca? Adicione 1 colher de glucose ou manteiga.\n\n## Bolo de pote (campeão de venda)\n\nCamadas em pote de 200ml:\n\n1. Base: pedaços do bolo branco (use as rebarbas da montagem — zero desperdício).\n2. Calda: 100ml leite + 2 colher leite condensado, pincelada leve.\n3. Recheio: ganache macia (2:1) ou doce de leite.\n4. Repete camadas até 2/3 do pote.\n5. Top: ganache firme + decoração (brigadeiro, morango, raspas).\n\n## Custo e preço de referência\n\nPote 200ml: ingrediente ~R$3,20 + embalagem R$0,90 + hora. Preço de venda saudável: R$9-12 (conforme cidade). Margem honesta e volume: é o produto de maior giro da confeitaria de encomenda.\n\n## Conservação honesta\nGeladeira: 3 dias impecável. Congelado (sem decoração): 30 dias. Etiqueta com data de fabricação — transparência gera recompra.',
      },
      {
        heading: '4. Produção em encomenda: a rotina que não trava',
        body:
          '## O planejamento reverso\nEncomenda para sábado = produção Thursday/Friday. Conta para trás: entrega Sáb 9h → montagem Sex 19h → assar Sex 15h → compras Qui. Encomenda aceita SEM prazo de folga é encomenda que atrasa.\n\n## A mise en place da confeiteira\n\n1. FICHA DE CUSTO por receita (ingrediente por grama — planilha simples).\n2. Checklist de compras por encomenda (nunca "achar que tem").\n3. Preparar na véspera: massas de bolo podem assar na véspera (bolo do dia seguinte fatia melhor); ganache pode ser feita 2 dias antes.\n\n## As regras da encomenda\n\nRegra 1: 50% antecipado via Pix confirma a encomenda. Sem sinal, sem data reservada.\n\nRegra 2: prazo comunicado com folga (prometa Sáb 12h, entregue Sáb 10h — exceder expectativa é marketing gratuito).\n\nRegra 3: foto da entrega + pedido de depoimento gentil. Cada cliente satisfeito com foto gerada é um vendedor novo do seu negócio.\n\n## O crescimento sustentável\nAumente preço ANTES de aumentar volume: 20% de reajuste perde 1 em cada 10 clientes mas dobra sua margem — e o tempo recuperado vira qualidade e novas encomendas. Correria sem lucro é o caminho mais rápido para o abandono da confeitaria.',
      },
    ],
  },
  {
    mentorEmail: 'lucas@demo.com',
    title: 'Guia de Fotografia de Produto',
    description:
      'O guia completo para fotografar produtos com celular: setup de R$20, luz de janela profissional, as 4 fotos que todo lojista precisa e edição com consistência. Para vender seus produtos melhor — ou começar a fotografar para outros.',
    category: 'Fotografia',
    level: 'INICIANTE',
    coverUrl: '/uploads/seed/livro-foto-produto.png',
    pdfSlug: 'livro-foto-produto.pdf',
    subtitle: 'Setup de R$20, luz de janela e o padrão que lojas compram',
    author: 'Lucas Prado',
    pages: [
      {
        heading: '1. O setup dos R$20',
        body:
          'Fotografia de produto profissional não exige estúdio. Exige método — e um setup que cabe em uma gaveta.\n\n## A lista completa\n\n1. **Fundo**: papel cartolina A2 branco (ou tecido TNT branco) — metade preso na parede, metade caindo sobre a mesa formando curva suave (a "curva infinita" caseira: fundo sem dobra visível).\n2. **Rebatedor**: segunda cartolina branca apoiada (numa caixa) do lado oposto à janela — devolve luz e suaviza a sombra.\n3. **Apoio**: pilha de livros com elástico ou tripé barato. Nitidez absoluta é obrigatória em produto.\n4. **Timer 3s**: apertar o botão treme a câmera; timer resolve.\n\n## A montagem (5 minutos)\nMesa perto da janela grande → fundo em curva → produto no centro da curva → rebatedor do lado da sombra → celular na altura do produto, na horizontal ou vertical conforme o destino da foto.\n\n## A regra de ouro\nMESMO setup para TODA a linha de produtos: mesma janela, mesma hora do dia (luz muda ao longo do dia), mesmo ângulo, mesmo fundo. Catálogo homogêneo parece loja grande — e loja grande cobra mais.',
      },
      {
        heading: '2. Luz: a janela é seu estúdio',
        body:
          '## Por que janela e não flash\nLuz de janela é grande (suave), direcional (cria volume) e gratuita. Flash do celular é pequeno e frontal: achata o produto, mata textura e cria sombra dura atrás. Flash desligado, sempre.\n\n## As 3 posições e o que cada uma diz\n\n1. **Luz frontal (janela atrás de você)**: iluminada e sem graça — some com a textura. Use só quando precisar de máxima clareza (marketplace rígido).\n2. **Luz lateral 45-90° (A RECOMENDADA)**: revela textura, cria sombra elegante, dá volume. 90% das fotos de produto vivem aqui.\n3. **Contra-luz (janela atrás do produto)**: silhueta ou brilho em vidro/liquidos. Avançada — comece pela lateral.\n\n## Controles rápidos\n\nSombra dura demais? Aproxime o rebatedor, ou afaste o produto da janela, ou cubra a janela com cortina/papel vegetal.\n\nFundo escurecendo? Suba a exposição tocando na tela e arrastando o sol ( exposure), ou abra sombras na edição.\n\nHora do dia: luz de manhã (até 10h) e fim de tarde é mais dourada e suave; meio-dia é dura. Mesma hora todos os dias = consistência.',
      },
      {
        heading: '3. As 4 fotos que todo lojista precisa',
        body:
          'O pacote de fotos de produto profissional tem quatro tipos — cada uma com função de venda.\n\n## 1. Fundo branco (o catálogo)\nProduto centrado na curva infinita, luz lateral + rebatedor, ângulo frontal levemente acima. Recorte/limpeza na edição. É a foto do marketplace e da vitrine — precisa de fundo PERFEITO.\n\n## 2. Lifestyle (o desejo)\nO produto NO CONTEXTO: o vidro de mel com pão e colher de madeira; a caneca com café derramando vapor; a bolsa no ombro de alguém. Aqui o cliente se imagina usando — é a foto que vende emoção.\n\n## 3. Detalhe (a qualidade)\nMacro da textura: trama do tecido, costura da bolsa, granulado do brigadeiro. Chegue com a lente 2x ou aproxime. Detalhe = percepção de qualidade = justifica preço maior.\n\n## 4. Escala (a informação)\nO produto com referência de tamanho: na mão, ao lado de um celular, no corpo. Elimina a dúvida nº1 do e-commerce ("é grande?") — e dúvida não resolvida é carrinho abandonado.\n\n## O checklist de entrega\nPara cada produto: as 4 fotos, MESMA luz, MESMA edição, nítidas (amplie para conferir), sem distração no fundo, cor fiel (produto azul que sai verde gera devolução).',
      },
      {
        heading: '4. Edição e entrega profissional',
        body:
          '## Edição no Lightroom Mobile (a rotina de 2 min)\n\n1. Luz: exposição leve, sombras +15, altas luzes -15.\n2. Contraste +10.\n3. Temperatura: ajuste até a COR DO PRODUTO ficar fiel (o produto é a régua — fundo pode mudar de tom, o produto não).\n4. Nitidez 25.\n5. Endireite e recorte no padrão do cliente (1:1 para marketplace, 4:5 para Instagram).\n6. Salve o PRESET e aplique em TODAS as fotos do pedido: consistência é o acabamento profissional.\n\n## Entrega que gera recomendação\n\nPasta organizada (nome-do-cliente/produto-01/...fotos numeradas), resolução alta + versão web leve, prazo cumprido (entregue ANTES), e 1 foto bônus surpresa. O bônus é o que gera indicação — custo zero, efeito enorme.\n\n## Precificação de início\nPacote inicial: 1 produto × 4 fotos = R$30-50; pacote 10 produtos = R$250-400 (conforme cidade). Ensaio teste gratuito de 1 produto converte melhor que qualquer pitch: o lojista vê a diferença entre a foto dele e a sua — e decide sozinho.\n\n## O caminho\n10 clientes satisfeitos com fotos consistentes = portfólio + indicações. Fotografia de produto é a porta de entrada mais rápida do mercado foto — demanda constante, sem depender de modelo ou evento, e reproduzível com este setup de R$20.',
      },
    ],
  },
  {
    mentorEmail: 'camila@demo.com',
    title: 'Rotina de Alta Performance',
    description:
      'Apostila prática de rotina: o ritual da manhã sem mistificação, gestão de energia (não de tempo), o fechamento do expediente e a revisão semanal que mantém tudo de pé. Com templates prontos para você montar a sua rotina em uma tarde.',
    category: 'Saúde & Bem-estar',
    level: 'INICIANTE',
    coverUrl: '/uploads/seed/livro-rotina.png',
    pdfSlug: 'livro-rotina.pdf',
    subtitle: 'Manhãs, energia e revisão semanal — com templates prontos',
    author: 'Camila Rocha',
    pages: [
      {
        heading: '1. A manhã sem mistificação',
        body:
          'Esqueça a "rotina do bilionário às 4h". A manhã funcional tem uma regra só: as primeiras 60-90 minutos NÃO REATIVOS — sem celular, sem e-mail, sem notícia. Você começa o dia dirigindo o próprio dia, não reagindo à agenda dos outros.\n\n## A estrutura de 3 blocos (adapte os tempos)\n\n**Bloco 1 — Acordar o corpo (10-15 min)**\nLuz natural (abrir janela/sair), copo de água, movimento leve (alongar, caminhar até a padaria). Luz + movimento setam o relógio biológico: energia de verdade, não café disfarçando sono.\n\n**Bloco 2 — Silêncio opcional (5-10 min)**\nRespiração, oração, diário, gratidão — qualquer prática quiete que seja SUA. Este bloco é o espaço entre acordar e reagir.\n\n**Bloco 3 — A grande pedra (30-60 min)**\nA tarefa mais importante do dia, ANTES de abrir e-mail. 30 min na prioridade de manhã valem 3h à tarde cheia de interrupção.\n\n## O que define a manhã é a noite\nRotina noturna fixa (hora consistente, telas longe 30-60 min antes, quarto escuro e fresco) é o que torna a manhã possível. Sono de 5h sabota qualquer ritual: primeiro conserte o dormir, depois otimize o acordar.',
      },
      {
        heading: '2. Energia, não tempo',
        body:
          'Você não tem 12 horas iguais por dia. Tem 2-4 horas de pico cognitivo — e todo o resto é vale. Alta performance é proteger o pico.\n\n## O mapeamento de 5 dias\nA cada 2 horas, registre sua energia de 0-10 (nota no celular). No 5º dia, padrão emerge: a maioria tem pico da manhã (9-12h) e vale pós-almoço (13-15h).\n\n## A alocação que muda tudo\n\nPICO → trabalho profundo: o projeto importante, a escrita, a análise, o código difícil.\n\nVALE → admin: e-mails, reuniões operacionais, tarefas mecânicas, organização.\n\nTrocar isso (e-mails no pico, projeto no vale) é gastar gasolina de Fórmula 1 em estrada de terra.\n\n## Os 4 pilares do combustível\n\n1. Sono: 7-8h com horário consistente — nada compensa o déficit.\n2. Movimento: 20-30 min/dia (caminhada conta) — melhor estimulante cognitivo que existe.\n3. Comida: almoço pesado = tarde perdida (picos de glicose derrubam foco às 14h). Proteína + vegetal + carboidrato moderado.\n4. Pausas: 5 min de cada hora em pé/água/janela. Scroll não é pausa — é troca de estímulo, e o cérebro continua cansado.\n\n## O teste semanal\nSexta à tarde: onde foi meu pico hoje? gastei com o quê? Uma pergunta, 30 segundos, ajuste contínuo.',
      },
      {
        heading: '3. O fechamento do dia (10 minutos que salvam o amanhã)',
        body:
          'A rotina de fechamento é o segredo pouco glamouroso da alta performance: 10 minutos no fim do expediente que transformam a manhã seguinte.\n\n## O ritual de fechamento\n\n1. **Feche os ciclos abertos** (5 min): anote em uma lista única tudo que ficou pendente (tarefa solta, e-mail para responder, ideia para depois). O cérebro guarda o que não está anotado — a lista tira o peso da memória.\n\n2. **Escolha as 3 de amanhã** (3 min): 1 grande (vai no pico) + 2 médias. Não 15 itens: lista de 15 é ansiedade decorada, não plano.\n\n3. **Feche o ambiente** (2 min): mesa limpa, abas fechadas, celular no carregador FORA do quarto. O amanhã começa sem atrito e sem a tentação do scroll noturno.\n\n## Por que funciona\nO fechamento cria o "fim" psicológico do expediente (sem ele, o trabalho vaza para a noite e o descanso piora) E elimina o custo de partida da manhã (sentar e já saber o que fazer é metade do trabalho feito).\n\n## A pergunta final do dia\nAntes de dormir, 1 linha no caderno: "o que foi bom hoje?" — a prática de gratidão de 30 segundos com efeito medido em bem-estar. Simples, barata, científica.',
      },
      {
        heading: '4. A revisão semanal: o sistema que se conserta',
        body:
          'Toda rotina quebra — viagem, gripe, semana de crise. O que separa quem volta do quem desiste é a REVISÃO SEMANAL: 20 minutos, um dia fixo (domingo à noite ou sexta no fim do dia).\n\n## As 5 perguntas da revisão\n\n1. O que funcionou esta semana? (repita o que funcionar)\n2. O que quebrou? (rotina pulada, sono bagunçado, dia reativo)\n3. Por quê quebrou? (o gatilho real: cansaço? tarefa ambígua? prometi demais?)\n4. Qual o próximo passo mínimo para consertar? (UMA mudança pequena, não 10)\n5. Quais são as 3 grandes prioridades da semana que vem?\n\n## As regras da revisão\n\n- Curta e honesta: 20 min cronometrados. Revisão de 2h não se sustenta.\n- Uma mudança por semana: ajustar 1 coisa e ver funcionar vence reformar tudo e desistir.\n- Sem culpa: a revisão é engenharia de sistema, não tribunal. "Dormi mal terça" vira "noites de terça têm futebol — mudar horário de treino", não "sou uma bagunça".\n\n## O quadro completo\nManhã não-reativa → picos protegidos para o profundo → fechamento diário → revisão semanal. Quatro hábitos que se sustentam mutuamente: quando um falha, os outros seguram o sistema até a revisão consertar. Isso é alta performance real: não perfeição, mas recuperação rápida e consistente.',
      },
    ],
  },
  {
    mentorEmail: 'sofia@demo.com',
    title: 'Métodos de Estudo Científicos',
    description:
      'Pare de reler e grifar (não funcionam): aprenda os métodos com maior evidência da ciência cognitiva — recuperação ativa, repetição espaçada e intercalação — e monte um sistema de estudo que fixa de verdade, com menos tempo. Com templates de cronograma.',
    category: 'Carreira',
    level: 'INICIANTE',
    coverUrl: '/uploads/seed/livro-metodos-estudo.png',
    pdfSlug: 'livro-metodos-estudo.pdf',
    subtitle: 'Recuperação ativa, repetição espaçada e intercalação na prática',
    author: 'Sofia Santos',
    pages: [
      {
        heading: '1. O que a ciência diz (e o que a escola ensina)',
        body:
          'A pesquisa em ciência cognitiva (Dunlosky et al., revisão de 10 técnicas) é brutalmente clara:\n\n## As técnicas MAIS eficazes\n\n1. **Prática de recuperação (active recall)**: puxar a informação da memória SEM olhar (flashcards, fechar o material e escrever o que lembra, autoexplicação).\n2. **Prática distribuída (spaced repetition)**: revisar em intervalos crescentes (1 dia, 3 dias, 1 semana, 1 mês).\n\n## As técnicas POPULARES que quase não funcionam\n\n- **Reler**: gera sensação de familiaridade ("já vi isso, sei!") que o cérebro confunde com saber. Na prova, trava.\n- **Grifar**: é releitura passiva com caneta.\n- **Resumir copiando**: copiar não é processar.\n\n## Por que amamos o que não funciona\nReler e grifar são FLUENTES (fáceis, confortáveis). Recuperar é DIFÍCIL (a memória resiste). Mas é exatamente a dificuldade que produz aprendizado — o fenômeno tem nome: dificuldade desejável (desirable difficulty).\n\n## A regra de ouro do estudante eficiente\nPasse 70% do tempo PUXANDO (testando-se) e 30% LENDO (preenchendo as lacunas que os testes revelarem). O estudante comum faz o inverso — e estuda 3x mais para aprender 3x menos.',
      },
      {
        heading: '2. Recuperação ativa na prática',
        body:
          '## O flashcard bem feito\n\n1. UMA informação por card ("Qual a fórmula do juros compostos?" — não "capítulo 3").\n2. Pergunta específica que force PUXAR (não reconhecer).\n3. Responda ANTES de virar o card — sem trapaça mental ("ah, eu sabia!").\n4. Se errou: crie um card novo menor sobre O PORQUÊ do erro.\n\n## O método Feynman (para conceitos)\n\n1. Escreva o conceito como se explicasse para uma criança de 10 anos, SEM olhar o material.\n2. Marque onde travou ou usou jargão — esses são exatamente os buracos reais.\n3. Volte SÓ nos buracos, no material.\n4. Reescreva a explicação até fluir.\n\nO Feynman é diagnóstico + tratamento em um: impossível esconder o que não sabe.\n\n## O teste como estudo (antes de começar)\nContraintuitivo e comprovado: tentar responder perguntas do capítulo ANTES de estudar (mesmo errando tudo) melhora a absorção do estudo seguinte. Erros iniciais criam "ganchos" onde o conteúdo novo se prende.\n\n## A rotina diária (20 min)\n\n10 min de flashcards do dia anterior → 5 min de Feynman do tema novo → 5 min de leitura para preencher buracos. Repita: 70% puxando, 30% lendo.',
      },
      {
        heading: '3. Repetição espaçada e intercalação',
        body:
          '## Por que esquecemos (e como usar isso a favor)\nA curva do esquecimento é íngreme: em 24h perdemos ~50-70% do que não revisamos. MAS cada revisão FEITA NO MOMENTO CERTO (quando estamos "quase esquecendo") achata a curva — o esquecimento desacelera a cada recuperação.\n\n## O sistema de intervalos (simples e suficiente)\n\n1. Estudou hoje → revisa amanhã.\n2. Acertou fácil → próxima revisão em 3 dias.\n3. Acertou de novo → 1 semana.\n4. De novo → 1 mês.\n5. Errou → volta para 1 dia.\n\nApps fazem isso automaticamente (Anki é o clássico). Num caderno, funciona com um sistema de separadores por data.\n\n## Intercalação: misture os temas\nBloquear ("2h só de álgebra") parece eficiente e rende MENOS que intercalar (álgebra 30min → estatística 30min → geometria 30min → volta). A mistura força o cérebro a ESCOLHER o método a cada problema — que é exatamente o que a prova exige.\n\n## A semana modelo\n\n- Cada sessão de estudo: 10 min de revisão espaçada (dias anteriores) → 35 min de conteúdo novo → 15 min de teste intercalado (misturando temas da semana).\n- Sábado: revisão da semana toda em modo teste (simulado).\n\n## O que NÃO fazer\nMaratonar (cramming) funciona para a prova de amanhã e apaga tudo em uma semana. Para aprendizado que permanece (concurso, carreira, idioma), espaçamento é inegociável.',
      },
      {
        heading: '4. O sistema completo + template de cronograma',
        body:
          '## As 4 peças do sistema\n\n1. **Recuperação ativa**: flashcards + Feynman (o motor do aprendizado).\n2. **Espaçamento**: intervalos crescentes (o motor da retenção).\n3. **Intercalação**: temas misturados na semana (o motor da transferência para a prova real).\n4. **Sono**: consolidação de memória acontece DURANTE o sono — estudar até 3h da manhã destrói o que foi estudado. 7-8h não são perdidas de estudo: são PARTE do estudo.\n\n## Template de semana (adapte os horários)\n\nSEG-SEX: sessões de 60 min, 2x/dia máximo (mais que isso cai a qualidade).\n\n- 10 min: flashcards de ontem e de 3 dias atrás.\n- 35 min: conteúdo novo do tema A.\n- 15 min: questões INTERCALADAS (temas A, B, C da semana).\n\nSÁBADO: simulado geral (60-90 min, tudo misturado, sem material) + correção honesta. Os erros do simulado GERAM os flashcards da semana seguinte.\n\nDOMINGO: folga real ou 20 min de revisão leve. Cérebro precisa de consolidação e descanso.\n\n## O diagnóstico semanal (5 min)\nQuais cards errei mais? Qual tema evitei? A semana que vem nasce daqui — o sistema se auto-corrige. Estudo eficiente não é mais horas: é o ciclo certo, repetido com honestidade.',
      },
    ],
  },
]

export const newArticles: ArticleDef[] = [
  {
    mentorEmail: 'carlos@demo.com',
    title: 'Como passar em entrevistas técnicas',
    description:
      'O guia completo da entrevista técnica: o que avaliam de verdade, como estruturar respostas de algoritmos, system design em 4 etapas e o método STAR para narrar suas experiências — com o checklist da semana anterior.',
    category: 'Carreira',
    level: 'INTERMEDIARIO',
    coverUrl: '/uploads/seed/artigo-entrevistas-tecnicas.png',
    readingMin: 14,
    content:
      'Depois de conduzir mais de 300 entrevistas técnicas, vou te contar o que realmente decide: não é saber a resposta — é como você pensa quando não sabe.\n\n## O que o entrevistador avalia (na ordem)\n\n1. **Comunicação**: você explica seu raciocínio enquanto pensa? Pergunta antes de assumir?\n2. **Resolução de problemas**: decomposição, alternativas, trade-offs.\n3. **Código**: legível, testado, com nomes decentes — não só "funciona".\n4. **Conhecimento técnico**: estruturas de dados, complexidade, o domínio da vaga.\n\nNote: conhecimento vem por ÚLTIMO. O candidato que sai silencioso 20 minutos e escreve a resposta perfeita perde para quem fala o processo e chega com o auxílio do entrevistador.\n\n## A estrutura da resposta de algoritmo\n\n1. **Reformule o problema**: "então preciso encontrar... e o caso limite é...?" — 90% dos erros vêm de resolver o problema errado.\n2. **Exemplo pequeno**: resolva na mão um caso simples, em voz alta.\n3. **Força bruta primeiro**: diga a solução óbvia e a complexidade — é ponto, não demérito.\n4. **Melhore com comentário**: "posso trocar espaço por tempo com uma hash map".\n5. **Codifique narrando**: linha por linha, explicando a intenção.\n6. **Teste**: rode mentalmente o exemplo + um caso de borda (lista vazia, duplicado).\n\n## System design em 4 etapas\n\n1. **Requisitos** (5 min): quem usa, qual escala, quais funcionalidades priorizadas. Pergunte mais do que fale.\n2. **Desenho macro** (10 min): clientes → API → serviço → banco → cache. Diagrama simples e conversado.\n3. **Profundidade** (10 min): escolha UM componente para aprofundar (modelagem, cache, fila) — peça ao entrevistador onde vale o foco.\n4. **Trade-offs e escala** (5 min): o que quebra com 10x carga? Como monitora? Admitir "não fiz isso em produção, mas avaliaria X vs Y" é resposta de sênior.\n\n## O método STAR para perguntas comportamentais\n\nSituação → Tarefa → Ação → Resultado. Prepare 5 histórias reais (conflito, falha, liderança, prazo, aprendizado) com resultado QUANTIFICADO. "Reduzi o tempo de deploy em 60% ao automatizar o pipeline" é impossível de esquecer; "melhorei o processo" evapora.\n\n## A semana anterior (checklist)\n\n- [ ] 3 problemas do dia a dia da vaga resolvidos em voz alta (cronometrados)\n- [ ] 5 histórias STAR escritas em 1 página\n- [ ] Pesquisa da empresa: produto, stack (LinkedIn de engenharia), notícia recente\n- [ ] Perguntas SUAS prontas (3 boas: sobre o time, sobre desafios atuais, sobre sucesso nos primeiros meses)\n\nBoa sorte — e se quiser ensaio com feedback real, é exatamente o que fazemos na mentoria 1:1.',
  },
  {
    mentorEmail: 'marina@demo.com',
    title: 'Análise de dados sem mistério',
    description:
      'Do dado bruto à decisão: como estruturar uma análise em 5 passos, evitar os erros estatísticos mais comuns (média enganosa, correlação vira causalidade) e comunicar resultados que convencem — sem precisar virar cientista de dados.',
    category: 'Tecnologia',
    level: 'INICIANTE',
    coverUrl: '/uploads/seed/artigo-dados.png',
    readingMin: 12,
    content:
      'Análise de dados não é sobre ferramentas — é sobre perguntas. Quem decide a pergunta certa transforma qualquer planilha em decisão; quem não decide afoga em gráficos bonitos.\n\n## Os 5 passos de toda análise\n\n1. **A pergunta de negócio**: não "quais nossos números?" e sim "por que as vendas caíram no canal X em março?" — específica, respondível, com dono.\n2. **Os dados mínimos**: quais colunas RESPONDEM a pergunta? Puxe menos dado e limpe mais rápido.\n3. **A limpeza honesta**: duplicatas, nulos, datas em formato errado — 60% do trabalho é aqui, e pular dá análise mentirosa (lixo entra, lixo sai).\n4. **A análise**: agregações (por período, canal, perfil) + comparações (este mês vs anterior, grupo A vs B).\n5. **A resposta**: uma frase executiva + o gráfico que a prova + a recomendação. Se não cabe uma frase, a pergunta era 3 perguntas.\n\n## Os 4 erros que derrubam análises\n\n**1. A média que mente**: renda média do bairro onde 1 bilionário mora é alta; a mediana conta a verdade. Sempre que houver outliers, olhe MEDIANA + distribuição.\n\n**2. Correlação virando causalidade**: vendas de sorvete e afogamentos sobem juntos — verão causa os dois. Antes de afirmar "X causa Y": tem variável escondida? Fizemos teste controlado (A/B)? Sem isso, diga "se correlaciona", nunca "causa".\n\n**3. Tamanho de amostra**: 3 clientes reclamando é anedota; 300 de 1.000 é padrão. Pergunte sempre: quantos dados estão por trás deste número?\n\n**4. Sobrevivência (survivorship bias)**: analisar só os clientes que ficaram ignora os que foram embora — que são exatamente os que têm a resposta sobre churn.\n\n## Comunicando (a parte que decide tudo)\n\n- **Título do gráfico é a conclusão**, não o descritor: "Churn caiu 30% após o onboarding novo" vence "Gráfico de churn por mês".\n- Um gráfico, uma mensagem. Se precisa de 5 legendas para explicar, o gráfico está errado.\n- Termine com o "então o quê": recomendação clara + o custo de não agir.\n\n## Comece hoje\nPegue UMA pergunta que seu time discute às cegas ("qual canal traz cliente melhor?") e aplique os 5 passos com os dados que você JÁ tem. Análise perfeita de pergunta errada vale zero; análise simples de pergunta certa move empresa.',
  },
  {
    mentorEmail: 'sofia@demo.com',
    title: '50 frases para brilhar no IELTS Speaking',
    description:
      'As expressões que examinadores ouvem em respostas de banda 7+: conectores naturais, vocabulário de opinião, fillers inteligentes para ganhar tempo e frases prontas para as partes 1, 2 e 3 — com exemplos de uso em contexto.',
    category: 'Idiomas',
    level: 'INTERMEDIARIO',
    coverUrl: '/uploads/seed/artigo-ielts.png',
    readingMin: 11,
    content:
      'No IELTS Speaking, examinador avalia 4 critérios: fluência, vocabulário, gramática e pronúncia. As frases abaixo atacam fluência e vocabulário de uma vez — são os "equipamentos" que compram tempo e elevam o nível percebido da resposta.\n\n## Fillers inteligentes (ganhe tempo sem parecer perdido)\n\n- "That\'s an interesting question..." (compra 2s e soa elegante)\n- "Let me think for a second..." \n- "Off the top of my head, I\'d say..." (resposta espontânea)\n- "I\'ve never really thought about it, but..." (para perguntas inesperadas da Part 3)\n\nNUNCA: silêncio total ou "uhhh... uhhh..." em português.\n\n## Opinião com nível (Part 3)\n\n- "From my perspective, ..." / "The way I see it, ..."\n- "I\'m of the opinion that..."\n- "It seems to me that..."\n- "I\'m torn between... on one hand..., on the other..." (mostra pensamento equilibrado — examinador AMA)\n- "There\'s no denying that..., however..."\n\n## Exemplificar e especificar\n\n- "Take [x], for instance..."\n- "A case in point would be..."\n- "To give you an idea, ..."\n\n## Part 1 (perguntas pessoais): a resposta de 3 camadas\nResponda + razão + detalhe:\n\n"Do you like coffee?" → "I do, actually — especially in the morning, since it kind of kick-starts my day. I usually go for a strong black one, no sugar."\n\nFrases de apoio: "It\'s not really my cup of tea" (não é minha praia), "I\'m quite keen on...", "I can\'t get enough of..."\n\n## Part 2 (long turn): estrutura que nunca trava\n\n- "The [thing] I\'d like to talk about is..."\n- "What makes it special is..."\n- "To this day, I still remember..."\n- "If I had the chance, I would definitely..."\n\nUse a página de preparo (1 min) em TÓPICOS: lugar, pessoas, o que aconteceu, por que marcante — 4 tópicos sustentam 2 minutos.\n\n## Part 3 (abstrato): os conectores de discussão\n\n- "Well, it depends on... largely because..."\n- "There\'s a growing tendency for..."\n- "In the past, ... whereas nowadays..."\n- "I suppose the main reason is..."\n- "That said, not everyone agrees..."\n\n## O treino que funciona\nEscolha 10 frases SEMANA. Use cada uma 3x em voz alta em situações reais do seu dia (descreva seu café usando "kick-start"). Expressão usada 3x em contexto vira sua; expressão só lida some na hora do exame.',
  },
  {
    mentorEmail: 'rafael@demo.com',
    title: 'SEO local para pequenos negócios',
    description:
      'O guia prático do "perto de mim": como configurar o Perfil da Empresa para o topo do mapa, coletar avaliações que ranqueiam, e as páginas do site que fazem sua loja aparecer na região — o checklist completo em 20 minutos de leitura.',
    category: 'Marketing',
    level: 'INICIANTE',
    coverUrl: '/uploads/seed/artigo-seo-local.png',
    readingMin: 10,
    content:
      '"Restaurante perto de mim", "dentista em [cidade]", "salão de beleza aberto agora" — o cliente local pesquisa no Google ANTES de sair de casa, e 76% das buscas locais geram visita em 24h. O jogo é disputado no mapa, e as regras são poucas e claras.\n\n## Perfil da Empresa: os 5 fatores de ranque\n\n1. **Categoria principal certa**: é o fator nº1. Restaurante japonês em "Restaurante" perde para o em "Restaurante japonês". Explore as subcategorias.\n2. **Proximidade**: não controlamos a localização do cliente, mas uma localização correta e consistente (pin no endereço exato) é pré-requisito.\n3. **Avaliações**: quantidade + nota + FREQUÊNCIA. 40 avaliações dos últimos 6 meses batem 200 antigas. E o Google lê as palavras das avaliações ("melhor pizza da Vila Madalena" é SEO que o CLIENTE escreve para você).\n4. **Completude do perfil**: horários, telefone, site/WhatsApp, serviços, fotos (10+, reais, atualizadas).\n5. **Atividade**: posts semanais, respostas a TODAS as avaliações, perguntas respondidas.\n\n## A máquina de avaliações (o que ninguém faz bem)\n\n- Momento certo: logo após a entrega/conclusão, quando a satisfação está no pico.\n- Facilidade máxima: QR code no balcão/embalagem apontando direto para o link de avaliação (não faça o cliente procurar).\n- Pedido com contexto: "Fez diferença para você? Sua avaliação ajuda muito quem está procurando." — o PORQUÊ dobra a taxa.\n- Responda TODAS em 24-48h: o Google lê a resposta como sinal de negócio vivo, e o cliente futuro lê como prova de cuidado.\n\n## O site local mínimo (que a maioria não tem)\n\n- **Página por serviço + cidade**: "Instalação de ar-condicionado em Recife" com conteúdo REAL (fotos de trabalhos na cidade, bairros atendidos, dúvidas locais). Página duplicada com cidade trocada NÃO funciona — conteúdo local genuíno sim.\n- **NAP consistente**: Nome, Endereço, Telefone IDÊNTICOS em site, perfil Google, Instagram e diretórios. Inconsistência confunde o Google e derruba o ranque.\n- **Schema LocalBusiness**: marcação técnica que diz ao Google "isto é um negócio local, aqui está endereço e horário" (seu desenvolvedor resolve em 1h; geradores gratuitos resolvem em 20 min).\n\n## O plano dos 30 dias\n\nSemana 1: perfil reivindicado e 100% completo + 10 fotos reais.\nSemana 2: máquina de avaliações rodando (meta: 5 novas) + respostas em dia.\nSemana 3: 1 post semanal no perfil + página de serviço-cidade no site.\nSemana 4: NAP auditado em tudo + primeiras medições (painel do perfil mostra chamadas e rotas pedidas).\n\nO painel do Google ("Desempenho") é seu KPI: ligações, cliques no WhatsApp, pedidos de rota. Subiu mês a mês? O jogo está sendo ganho.',
  },
  {
    mentorEmail: 'camila@demo.com',
    title: '5 hábitos matinais que mudam seu dia',
    description:
      'A versão sem hype da manhã produtiva: 5 hábitos com evidência real (luz, água, movimento, silêncio e a primeira tarefa certa), como implementar cada um em menos de 2 minutos e por que o celular fica fora do quarto.',
    category: 'Saúde & Bem-estar',
    level: 'INICIANTE',
    coverUrl: '/uploads/seed/artigo-habitos-matinais.png',
    readingMin: 8,
    content:
      'A rotina matinal perfeita não existe — mas 5 hábitos com evidência sólida transformam a energia do dia em 60-90 minutos. Nenhum deles exige acordar às 5h.\n\n## 1. Luz natural nos primeiros 30 minutos\nA luz da manhã é o sinal mais forte para o relógio biológico: seta cortisol no horário certo (energia) e melhora a melatonina da noite (sono). 5-10 minutos de janela aberta, varanda ou caminhada até a padaria. Dia nublado conta — a luz externa é 10x mais forte que a de casa mesmo assim.\n\n## 2. Água antes do café\nVocê acordou desidratado de 7-8 horas sem beber nada. Um copo grande de água antes do café combate a letargia real da desidratação (não mágica: fisiologia). Café pode vir 30-60 min depois — o cortisol natural da manhã já é o seu "café endógeno".\n\n## 3. Movimento leve (10 minutos bastam)\nNão precisa de treino: 10 minutos de caminhada, alongamento ou mobilidade acordam articulações, circulam sangue e elevam humor com efeito medido. O hábito que prepara o hábito — quem se movimenta de manhã treina mais facilmente à tarde (o corpo já está "ligado").\n\n## 4. 5 minutos de silêncio\nRespiração, gratidão, oração ou simplesmente olhar pela janela sem input. É o espaço entre acordar e REAGIR — os 5 minutos que impedem o dia de começar no piloto automático do feed. Evidência de regulação emocional e foco; custo: zero.\n\n## 5. A primeira tarefa certa (a grande pedra)\nAntes de abrir e-mail: 30-60 minutos na tarefa MAIS importante do dia. É o hábito que multiplica os outros quatro — a manhã não-reativa é onde o trabalho real acontece, e o dia que começa com vitória psicológica (a pedra movida) rende diferente até a noite.\n\n## A regra que sustenta todos: celular fora do quarto\nO despertador vira despertador de verdade (compre um de R$15). Sem celular ao lado da cama: sem scroll de 40 minutos ao acordar (a maior ladrã de manhã do mundo moderno) e sem a tentação noturna que sabota o sono — que é o combustível de tudo acima.\n\n## Como implementar (sem depender de força de vontade)\n\n- UM hábito por semana: luz → água → movimento → silêncio → pedra. Cada um é ancorado no anterior ("acendi a luz → bebo a água").\n- Versão mínima nos dias ruins: 2 min de cada um. A régua é nunca faltar 2 dias seguidos.\n- Prepare a noite: água na mesinha, roupa separada, celular carregando na sala. A manhã perfeita é preparada às 22h da noite anterior.\n\nEm 30 dias, a sequência vira automática — e o dia inteiro muda de base.',
  },
]

// Correções de capa em itens existentes
export const coverFixes = [
  { titleEquals: 'Discovery em 5 perguntas', coverUrl: '/uploads/seed/artigo-discovery.png' },
  { titleEquals: 'Fundamentos de Dados — apostila da trilha', coverUrl: '/uploads/seed/livro-fundamentos-dados.png' },
]
