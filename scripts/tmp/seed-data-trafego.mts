// Curso: Tráfego Pago do Zero — mentor Rafael Almeida (Growth & Marketing)
import type { CourseDef } from './seed-types'

export const trafegoCourse: CourseDef = {
  mentorEmail: 'rafael@demo.com',
  title: 'Tráfego Pago do Zero: Meta Ads e Google Ads',
  description:
    'Anúncio que não converte é dinheiro queimado. Neste curso você domina a base que sustenta qualquer campanha: os números que importam (CTR, CPA, ROAS), a estrutura certa de campanhas no Meta Ads e no Google Ads, criativos que param o scroll e o processo de otimização semanal que faz cada real render mais. Método direto, sem promessa mágica: do primeiro anúncio publicado à escala de orçamento com margem saudável — com quizzes de fixação e exemplos reais de e-commerce, serviço local e infoproduto. Se você quer anunciar seu negócio, prestar serviço de tráfego ou parar de depender do orgânico, comece por aqui.',
  category: 'Marketing',
  level: 'INICIANTE',
  price: 149,
  coverUrl: '/uploads/seed/course-trafego-pago.png',
  themes: [
    {
      title: 'Módulo 1 · Fundamentos: a casa antes do anúncio',
      description:
        'O vocabulário e a lógica econômica do tráfego pago: funil, métricas, contas e rastreamento. Quem pula essa base queima dinheiro depois.',
      lessons: [
        {
          title: 'Tráfego pago vs. orgânico: quando (e por que) pagar',
          description:
            'O que anúncio realmente compra (atenção qualificada, não vendas), quando vale a pena e os 3 cenários em que anunciar é erro.',
          durationMin: 12,
          content: `A primeira mentira do mercado: "anúncio vende". Anúncio compra **atenção qualificada** — a venda acontece na oferta, na página e no atendimento. Entender essa diferença evita a frustração de quem gasta R$ 500 e acha que "tráfego não funciona".

## O que você compra de verdade
Cada real investido compra **impressões** para um público. Do anúncio à venda existe uma corrente: impressão → clique → página → ação → compra. O anúncio só controla os dois primeiros elos. Se a página é fraca, anúncio bom entrega clique que não converte — e o culpado nunca foi o tráfego.

## Orgânico vs. pago — para que serve cada um
- **Orgânico** (conteúdo, SEO, social): constrói **confiança e marca** ao longo do tempo. É lento e acumulativo, mas o custo por resultado cai com o tempo.
- **Pago**: compra **velocidade e previsibilidade**. Você decide quanto, quando e para quem. Escala na hora — mas para de entregar quando para de investir.

Quem vive de só um dos dois fica frágil: o orgânico sozinho não escala rápido; o pago sozinho não constrói memória de marca. O jogo sério usa os dois: conteúdo aquece, anúncio acelera.

## Os 3 cenários em que anunciar é ERRO
1. **Oferta sem prova**: sem depoimento, sem portfólio, sem garantia — mais tráfego só acelera a desconfiança.
2. **Página que não converte**: se 100 cliques viram 0 contato, o problema é a página (ou a oferta). Anunciar para "testar mais" é pagar para confirmar o fracasso.
3. **Sem condição de atender**: negócio de serviço sem capacidade de responder lead em 15 minutos perde o lead para o concorrente que responde. Tráfego sem operação é escoadouro.

## Quando PAGAR é a decisão certa
- Oferta validada (alguém já compra no orgânico/indicação) e você quer **crescer mais rápido**.
- **Sazonalidade**: datas comemorativas, lançamentos, vagas limitadas.
- **Teste de mercado rápido**: validar oferta nova com R$ 300 em 7 dias em vez de 6 meses de conteúdo.
- **Escala de canal que funciona**: a oferta converte, o CAC cabe na margem — agora é girar o volume.

## A mentalidade de investimento (não de aposta)
Tráfego pago é marketing de **dados**: cada campanha gera números que dizem o que ajustar. Neste curso você vai aprender a ler esses números (CPM, CTR, CPA, ROAS) antes de apertar qualquer botão — porque no leilão de anúncios, quem entende as métricas paga menos pelo mesmo cliente.

## Sua tarefa
Escreva em uma linha: qual oferta você (ou seu cliente) anunciaria, qual o preço médio e quanto custa atender um lead. Guarde — os números deste curso vão girar em torno disso.`,
        },
        {
          title: 'O funil que sustenta anúncios: TOFU, MOFU e BOFU',
          description:
            'Por que anunciar "compre agora" para quem nunca te viu queima verba — e como distribuir investimento entre topo, meio e fundo.',
          durationMin: 14,
          content: `Todo negócio tem uma fila invisível de pessoas em estágios diferentes de consciência. Anunciar para todas a mesma mensagem é gritar "CASAMENTO!" numa festa de solteiros. O funil organiza quem recebe o quê.

## Os 3 estágios (e a mentalidade de cada um)
- **TOFU — Topo (consciência)**: pessoas com o problema, sem saber que você existe. Conteúdo: entretenimento, educação, dor e desejo. Métrica certa: alcance, visualizações, CPM. Objetivo: ser visto e lembrado.
- **MOFU — Meio (consideração)**: pessoas que já interagiram, seguem, baixaram material. Conteúdo: prova social, depoimentos, comparativos, demonstração. Métrica: custo por lead, taxa de salvamento. Objetivo: construir confiança.
- **BOFU — Fundo (decisão)**: quem já conhece e está quase decidindo. Conteúdo: oferta, urgência legítima, garantia, objeções. Métrica: CPA, ROAS. Objetivo: converter.

## O erro clássico do iniciante
Colocar 100% da verba no BOFU ("COMPRE COM 30% OFF") para público frio. O clique vem (desconto atrai), mas a conversão morre — a pessoa não sabe quem você é, e desconto para estranho cheira a desespero. Resultado: CPA alto, "Meta Ads não funciona", desistir.

## A distribuição que funciona (regra inicial)
Para um negócio com orçamento enxuto:
- **60-70% no fundo**: campanhas de conversão para públicos quentes (interesse + remarketing). É aqui que o dinheiro volta.
- **20-30% no topo**: vídeo-views/alcance com criativo educativo barato (CPM baixo). Alimenta o remarketing de amanhã.
- **0-10% no meio** (avança conforme escala): depoimentos para quem engajou.

Com orçamento maior (R$ 5k+/mês), a distribuição sobe em direção ao topo — mais marca, mais barato no fundo depois.

## Retargeting: o elo que amarra o funil
Quem viu 50% do vídeo, visitou o site ou abandonou o carrinho está no meio do funil **de graça**. Remarketing para esses públicos tem CTR 2-4x maior e CPA menor. É o ativo mais barato que o funil produz — e a razão pela qual investir em TOFU não é "dinheiro jogado".

## Um funil por oferta, não por empresa
Cada produto tem seu funil. Curso de R$ 2.000 precisa de TOFU pesado (educação antes da venda); pizza precisa quase só de BOFU local (consciência instantânea). Desenhe o funil **da sua oferta** antes de criar qualquer campanha.

## Sua tarefa
Classifique sua oferta: quanto tempo de "educação" o cliente precisa antes de comprar? Escolha a distribuição inicial de verba (60/30/10?) e liste 3 ideias de conteúdo para o topo. Esse desenho é o alicerce dos módulos seguintes.`,
          quiz: [
            {
              prompt: 'Anunciar oferta com desconto agressivo para público 100% frio geralmente resulta em:',
              options: ['ROAS alto imediato', 'Cliques baratos e conversão ruim — a pessoa ainda não conhece a marca', 'Banimento da conta'],
              correctIndex: 1,
              explanation: 'Público frio precisa de contexto e confiança; desconto para quem não te conhece atrai caçador, não cliente.',
            },
            {
              prompt: 'Qual público tende a ter o MENOR custo por conversão?',
              options: ['Público frio por interesse', 'Remarketing para quem já interagiu com a marca', 'Qualquer público, se o criativo for bom'],
              correctIndex: 1,
              explanation: 'Quem já conhece está mais perto da decisão: CTR e conversão sobem, CPA cai.',
            },
          ],
        },
        {
          title: 'As métricas que importam: CPM, CTR, CPA e ROAS',
          description:
            'A matemática do leilão explicada com conta de padaria: o que cada métrica significa, o que é "bom" e qual diagnóstico cada número entrega.',
          durationMin: 20,
          content: `Anúncio sem leitura de métrica é direção de olhos fechados. Boa notícia: são 5 números que explicam 95% dos resultados. Vamos com a conta na mão.

## As 5 métricas, na ordem do funil
1. **CPM — custo por mil impressões**: quanto você paga a cada 1.000 vezes que o anúncio é exibido. É o "preço da atenção" do seu nicho. Varia com a competição: nicho financeiro CPM alto, entretenimento CPM baixo.
2. **CTR — taxa de cliques**: cliques ÷ impressões × 100. Mede a **força do criativo**. Referência prática: abaixo de 1% = criativo fraco; 1-2% = ok; acima de 2-3% = criativo forte.
3. **CPC — custo por clique**: CPM ÷ (CTR × 10). É consequência das duas anteriores — CPC baixo = atenção barata e interessante.
4. **Taxa de conversão (página)**: conversões ÷ cliques × 100. Aqui o anúncio não age mais — é a **página/oferta** trabalhando. Referência: 1-3% e-commerce; 5-10%+ página de lead com boa oferta.
5. **CPA — custo por aquisição**: gasto ÷ conversões. O número que decide se o negócio vive: se o lucro por venda é R$ 80 e o CPA é R$ 90, cada cliente chega com prejuízo — por melhor que esteja o criativo.

## ROAS: o juiz final
**ROAS = faturamento ÷ gasto em anúncio.** ROAS 3 significa: cada R$ 1 investido voltou R$ 3 em vendas. Parece ótimo? Depende da margem: com margem de 20%, ROAS 3 dá lucro magrinho; com margem de 60%, ROAS 3 é festa. O ROAS mínimo viável (break-even) = 100 ÷ margem %. Margem 40% → precisa de ROAS 2,5 para empatar. Tudo acima disso é lucro.

## O diagnóstico que cada número entrega
- **CPM alto + CTR bom** → competição grande; melhore a taxa de engajamento e teste públicos/posicionamentos mais baratos.
- **CPM baixo + CTR baixo** → o algoritmo te entrega barato, mas ninguém clica: **criativo ruim**.
- **CTR alto + conversão baixa** → o anúncio promete o que a página não entrega: **quebra de mensagem** ou página fraca.
- **Conversão boa + CPA alto** → conta fecha no CPM: nicho caro ou orçamento pequeno demais para o leilão.
- **Tudo bom, ROAS ruim** → problema de **margem/oferta**, não de mídia: reavalie preço, ticket médio ou upsell.

## A planilha mínima
Uma linha por dia por campanha: gasto, impressões, cliques, conversões, faturamento. As 5 métricas derivam desses 5 brutos. No módulo 4 você aprende a ler séries (tendência) — por hoje, domine a conta e o diagnóstico.

## Sua tarefa
Calcule com os dados do seu negócio: qual seu ROAS de break-even? Com CPA-alvo definido e conversão da página estimada, qual CPC máximo você pode pagar? Esses 2 números guiam TODA decisão de escala adiante.`,
          quiz: [
            {
              prompt: 'CTR baixo com CPM normal indica, na maioria dos casos:',
              options: ['Problema no criativo/gancho do anúncio', 'Problema na página de vendas', 'Orçamento alto demais'],
              correctIndex: 0,
              explanation: 'O anúncio aparece e não recebe clique: a atenção não é capturada — revise criativo e público.',
            },
            {
              prompt: 'Um negócio com margem de 50% precisa de qual ROAS mínimo para empatar?',
              options: ['ROAS 5', 'ROAS 2', 'ROAS 1'],
              correctIndex: 1,
              explanation: 'Break-even ROAS = 100 ÷ margem = 100 ÷ 50 = 2. Acima de 2, cada real de mídia retorna lucro.',
            },
            {
              prompt: 'CTR alto e conversão de página baixa apontam para:',
              options: ['Criativo fraco', 'Quebra de mensagem entre anúncio e página', 'CPM barato demais'],
              correctIndex: 1,
              explanation: 'O clique veio (criativo ok) mas a página não entrega o prometido — alinhe promessa e destino.',
            },
          ],
        },
        {
          title: 'Preparando a casa: conta, pixel e API de Conversões',
          description:
            'Business Manager, conta de anúncios, página/foto certa e o rastreamento (Pixel + API de Conversões) sem o qual o algoritmo voa às cegas.',
          durationMin: 18,
          content: `Antes do primeiro anúncio existe a infraestrutura — e 80% dos problemas de conta ("conta bloqueada", "algoritmo não aprende", "não sei de onde vêm as vendas") nasce de fundação malfeita. Esta aula monta sua casa na ordem certa.

## A estrutura da Meta (do maior para o menor)
- **Business Manager (Portfólio de negócios)**: a sede — gerencia ativos e pessoas. business.facebook.com → criar com e-mail profissional.
- **Conta de anúncios**: dentro do BM. Uma é suficiente para começar. Configure fuso, moeda e **método de pagamento** ANTES do primeiro anúncio (cartão que não falha — falha de cobrança pausa campanha e bagunça aprendizado).
- **Página do Facebook + perfil do Instagram**: o anúncio corre "em nome" delas. Página sem foto, sem post e sem 2 pessoas curtindo transmite golpe — e puxa o CTR para baixo. Preencha o mínimo viável: foto, capa, bio, 9-12 posts.

## Verificação e higiene de conta
Verifique o domínio do site no BM (Business Settings → Segurança da marca → Domínios). Ative **autenticação em 2 fatores** em TODOS os admins. Nunca rode anúncio com pagamento emprestado de terceiro nem promocione conteúdo proibido (faz sentido dizer, mas é a causa nº1 de bloqueio). Conta nova: comece com orçamento modesto nos primeiros dias — padrão de comportamento conta mais que valor gasto.

## O Pixel: os olhos do algoritmo
O **Pixel** é o código que registra o que as pessoas fazem no seu site (visualizou produto, adicionou ao carrinho, comprou). No Meta: Gerenciador de Eventos → Conectar dados do site → copiar o ID. Instale via plugin (WordPress/WooCommerce, Shopify fazem sozinhos) ou via Google Tag Manager. Eventos essenciais: **PageView, ViewContent, Lead, InitiateCheckout, Purchase** — com **valor** na Purchase (sem valor não existe ROAS).

## API de Conversões: o rastreador da era sem cookies
O navegador bloqueia cada vez mais cookies — o Pixel sozinho perde 20-40% dos eventos. A **API de Conversões** envia os mesmos eventos **pelo servidor**. Na prática: Shopify/Woo/RD Station têm integração nativa (cole o token em Configurações). Marque "enviar eventos por navegador E servidor" com **deduplicação** (o sistema cuida do event_id). Sem isso, o algoritmo aprende com metade dos dados — e aprendizado incompleto = CPA pior.

## Teste de sanidade antes do primeiro real
Gerenciador de Eventos → aba Testar Eventos: abra seu site em outra aba, navegue e veja os eventos chegando ao vivo. Purchase de teste com valor. Só depois disso você está pronto para o Módulo 2 — anunciar sem rastreamento é pagar por tráfego e nunca saber o que ele fez.

## Sua tarefa
Checklist: BM criado? Conta com pagamento ok? Página/Instagram minimamente preenchidos? Pixel instalado? API de conversões ativa? Eventos chegando no Testar Eventos? Só siga quando os 5 forem SIM.`,
          quiz: [
            {
              prompt: 'Sem Pixel e API de Conversões funcionando, a principal consequência é:',
              options: ['O anúncio não é exibido', 'O algoritmo otimiza às cegas e você não consegue medir CPA/ROAS', 'A conta é bloqueada'],
              correctIndex: 1,
              explanation: 'Rastreamento alimenta otimização e medição. Sem ele, otimização e diagnóstico morrem.',
            },
            {
              prompt: 'Para não perder eventos por bloqueio de cookies, usa-se:',
              options: ['Só o Pixel, reforçado', 'API de Conversões (evento pelo servidor) com deduplicação', 'Mais orçamento'],
              correctIndex: 1,
              explanation: 'O evento server-side contorna as restrições do navegador e recompõe a visão do algoritmo.',
            },
          ],
        },
      ],
    },
    {
      title: 'Módulo 2 · Meta Ads na prática',
      description:
        'A estrutura de campanha que funciona, segmentação na era do broad, criativos que param o scroll, orçamento e teste A/B sem queimar dinheiro.',
      lessons: [
        {
          title: 'Estrutura de campanha: campanha, conjunto e anúncio',
          description:
            'A hierarquia do Meta Ads explicada com um objetivo por campanha, poucos conjuntos e variedade onde importa: nos anúncios.',
          durationMin: 16,
          content: `O erro que drena orçamento de iniciante: 8 campanhas com R$ 10 cada, cada uma com 1 anúncio. O algoritmo precisa de **volume para aprender** — estrutura fragmentada = nenhuma campanha sai da fase de aprendizado. Aqui está a estrutura que funciona em 2025.

## A hierarquia, de fora para dentro
- **Campanha**: define o **OBJETIVO** (Vendas, Leads, Tráfego, Reconhecimento...). Regra: 1 objetivo por campanha. O objetivo instrui o algoritmo sobre QUEM buscar — "Vendas" procura pessoas parecidas com quem compra; "Tráfego" procura gente que clica em tudo (e não compra). **Se você quer venda, escolha Vendas — mesmo que o volume no começo seja menor.**
- **Conjunto de anúncios**: define **PÚBLICO, posicionamentos, orçamento e janela**. O erro nº2: 6 conjuntos com públicos diferentes dividindo R$ 50 — cada um fica abaixo do mínimo para o algoritmo aprender (regra prática: R$ 20-30/dia por conjunto, no mínimo).
- **Anúncio**: criativo + texto + destino. Aqui SIM variedade: 3-6 anúncios por conjunto (imagens/vídeos e ângulos diferentes) para o algoritmo achar o vencedor.

## A estrutura recomendada para começar
**1 campanha de Vendas** (Advantage+ ou CBO):
- 1 conjunto amplo (broad) com todos os posicionamentos (Advantage+ placements) e R$ 30-50/dia;
- 3-5 anúncios (3 ângulos diferentes do mesmo produto).
Simples demais? É essa simplicidade que concentra aprendizado. Meta moderno com bom sinal (pixel + API) segmenta sozinho melhor que interesse selecionado à mão na maioria dos casos.

## Objetivo certo, sempre
Tráfego barato é a armadilha favorita do iniciante: CPC de R$ 0,10 e zero venda. O leilão entrega o que você pede — **peça o que o negócio precisa** (venda, lead). Mensagens/WhatsApp para negócio local: objetivo "Leads" com destino WhatsApp funciona muito bem.

## Advantage+ (campanhas automatizadas)
A Meta empurra as campanhas "Shopping/Advantage+" (para e-commerce) e "Leads" automatizadas. Resumo honesto: com rastreamento sólido e catálogo alimentado, funcionam bem e simplificam; deixam menos controle de públicos. Comece por elas se você é iniciante com e-commerce; use campanha manual (Vendas + CBO) quando quiser controle fino.

## Regras de ouro de edição
Editar conjunto no meio do aprendizado **reseta** parte do progresso. Limite: mudanças de criativo em lote a cada 3-4 dias, orçamento em passos de até 20% (nunca dobrar de R$ 50 para R$ 300 no mesmo dia). Paciência é estratégia: aprendizado do algoritmo leva ~50 eventos de conversão por semana para sair da fase inicial.

## Sua tarefa
Desenhe no papel a estrutura do seu primeiro anúncio: objetivo, quantos conjuntos (spoiler: 1), orçamento por dia e os 3 ângulos dos seus anúncios. Essa é a planta baixa que você executa na próxima aula.`,
          quiz: [
            {
              prompt: 'Quero vender. Qual objetivo escolher na campanha?',
              options: ['Tráfego — clique é mais barato', 'Vendas (Conversões) — o algoritmo procura compradores', 'Alcance — mais pessoas veem'],
              correctIndex: 1,
              explanation: 'O objetivo define quem o algoritmo busca. Tráfego busca clicadores, não compradores.',
            },
            {
              prompt: 'A variedade de criativos (3-6 anúncios) deve morar em:',
              options: ['6 campanhas separadas', 'Dentro do conjunto de anúncios', 'Em conjuntos diferentes com o mesmo público'],
              correctIndex: 1,
              explanation: 'Concentrar público num conjunto e variar ANÚNCIOS dá ao algoritmo volume para aprender e escolher o vencedor.',
            },
          ],
        },
        {
          title: 'Segmentação na era do broad: públicos que funcionam',
          description:
            'Interesses, públicos personalizados e semelhantes — quando refinar e quando deixar o algoritmo solto (spoiler: mais solto do que você pensa).',
          durationMin: 16,
          content: `"Qual público eu uso?" é a pergunta nº 1 dos iniciantes — e a resposta mudou nos últimos anos: com bons sinais de conversão, o Meta segmenta sozinho melhor do que a maioria dos mídias. Mas "broad" não é apostar no escuro: existem 3 famílias de público e momentos certos para cada.

## Família 1 — Broad (aberto, sem segmentar)
Conjunto sem NENHUMA restrição além de localidade/idade básica. O algoritmo usa seu histórico de conversões (pixel!) para achar compradores. Funciona surpreendentemente bem quando: pixel + API de conversões ativos, volume de eventos decente (30-50 conversões/mês) e criativo claro (o criativo É a segmentação: anúncio de curso de concursos só atrai concurseiros). **Comece por aqui na maioria dos casos.**

## Família 2 — Públicos personalizados (quem já te conhece)
Fonte dos públicos: visitantes do site (180 dias), interação com Instagram/Facebook, lista de clientes (e-mail/telefone via CSV), engajamento com vídeo, abandono de carrinho. É o **remarketing** — o dinheiro mais barato do funil. Estrutura clássica: carrinho 7-14 dias com oferta + prova social; visitantes 30 dias com depoimentos.

## Família 3 — Semelhantes (lookalike)
Meta pega uma fonte (ex.: lista de compradores) e encontra 1-5% da população mais parecida com ela. Regras práticas: a fonte precisa de qualidade (100+ pessoas; compradores > leads > visitantes), comece pelo **1%** e só expanda (2-3%) se o 1% performar. Com algoritmo atual + bom pixel, lookalike perdeu espaço para o broad — mas segue forte quando a fonte é EXCELENTE (compradores de alto valor).

## Interesses: quando ainda valem
Use interesses como hipótese testável quando: conta nova sem dados, nicho MUITO específico (ex.: donos de clínica veterinária) ou produto local (raio geográfico + interesse). Combine 3-5 interesses amplos, nunca 15 micro-interesses (público vira poeira, não aprende).

## Exclusões: o detalhe pro
Compradores últimos 30 dias excluídos das campanhas de aquisição (não pague para quem já comprou); em remarketing de carrinho, exclua quem comprou nas últimas 24h. Exclusão é economia silenciosa.

## A sequência que eu rodaria hoje
Semana 1-2: broad Vendas + remarketing carrinho. Com 50+ conversões: teste lookalike 1% compradores vs. broad. Deixe os dados decidirem — não o gosto pessoal. E lembre: **criativo define o público de fato**; segmentação só direciona o leilão.

## Sua tarefa
Monte 3 públicos: seu remarketing principal (qual fonte? qual janela?), seu lookalike de compradores (tem lista com 100+?) e descreva por que o broad faria sentido (ou não) no seu caso.`,
          quiz: [
            {
              prompt: 'Com pixel bem alimentado e volume de conversões, a segmentação inicial recomendada costuma ser:',
              options: ['15 interesses combinados', 'Broad (aberto) deixando o algoritmo encontrar compradores', 'Só lookalike 5%'],
              correctIndex: 1,
              explanation: 'Broad + bom sinal de dados entrega ao algoritmo liberdade para otimizar — melhor que micro-segmentação na maioria dos casos.',
            },
            {
              prompt: 'A fonte de MELHOR qualidade para um público semelhante é:',
              options: ['Visitantes do site', 'Lista de compradores', 'Curtidas na página'],
              correctIndex: 1,
              explanation: 'Semelhança de compradores busca mais compradores — a intenção da fonte define a qualidade do lookalike.',
            },
          ],
        },
        {
          title: 'Criativos que param o scroll',
          description:
            'Os 5 ganchos de abertura, formatos por posicionamento e a biblioteca de criativos: a habilidade que move o CTR mais que qualquer configuração.',
          durationMin: 20,
          content: `A verdade desconfortável do tráfego moderno: **o criativo é o novo targeting**. Configuração perfeita com criativo fraco perde para configuração simples com criativo que grita a dor certa. Esta é a aula mais criativa do curso — e a que mais mexe no CPA.

## Os 3 primeiros segundos decidem tudo
Feed lotado, polegar veloz. O anúncio tem ~1,7 segundo para segurar alguém. Por isso o **gancho** (primeira frase/primeiro frame) vale mais que o resto do vídeo inteiro. Os 5 ganchos que funcionam:
1. **Dor explícita**: "Cansado de estudar 6h e não lembrar de nada?" — a pessoa se identifica e para.
2. **Resultado com contraste**: "Como ela vendeu R$ 12k no primeiro mês com R$ 300 de anúncio" — número + prova.
3. **Curiosidade com lacuna**: "O erro de formatação que derruba 80% dos TCCs" — cérebro odeia lacuna aberta.
4. **Autoridade inesperada**: "Depois de 200 campanhas, parei de fazer isso" — quem tem história tem licença.
5. **Demonstração visual**: o produto funcionando em speed-run (antes/depois, time-lapse). Para produto físico, é o rei.

## Formatos por posicionamento
- **Reels/Stories (9:16)**: vídeo vertical imersivo, texto GRANDE nos primeiros segundos (muito som desligado), legendas sempre, CTA verbal no final. É onde está o volume barato hoje.
- **Feed (1:1 ou 4:5)**: imagem forte com texto curto ou vídeo até 30s. 4:5 ocupa mais tela que quadrado — use.
- **Carrossel**: ótimo para e-commerce (produtos) e para "5 erros" (1 card por erro) — engajamento alto porque a pessoa interage deslizando.

## Copy: a estrutura AIDA em 4 linhas
**Atenção** (gancho na 1ª linha — é o que aparece antes do "ver mais") → **Interesse** (agrave: o custo de continuar como está) → **Desejo** (prova: depoimento, número, demonstração) → **Ação** (1 CTA claro: "Saiba mais", "Quero começar"). Texto longo funciona quando educa (curso, serviço); texto curto quando o visual já vende (produto físico com preço).

## O sistema de 3 ângulos
Para cada oferta, produza anúncios em **3 ângulos diferentes**: dor (problema), desejo (transformação) e prova (prova social/demo). 2-3 criativos por ângulo = 6-9 peças no primeiro teste. O que vencer em CTR+CPA, produza variações (novo gancho, novo abertura, nova cor). Iteração > inspiração.

## Onde achar ideias sem quebrar a cabeça
**Biblioteca de Anúncios** (facebook.com/ads/library): veja TODOS os anúncios ativos de qualquer concorrente — os que rodam há meses estão funcionando (ninguém queima verba com anúncio ruim). Estude 10 anúncios do seu nicho, liste os ganchos usados, produza sua versão original. Não copie: **padrões** copiam-se, textos não.

## Sinais de criativo vencedor (e candidato à morte)
Vencedor: CTR > 2%, CPM caindo com o tempo, comentários com perguntas de compra. Candidato a pausar: frequência > 2.5-3 com CTR caindo (fadiga), CPM subindo 30%+ sem motivo externo. Reposição de criativo é manutenção mensal — não opcional.

## Sua tarefa
Escreva 3 ganchos para sua oferta (1 de dor, 1 de curiosidade, 1 de prova). Analise 5 anúncios de concorrentes na Biblioteca e anote o padrão. Você acaba de montar seu primeiro deck de criativos.`,
          quiz: [
            {
              prompt: 'O elemento com maior impacto direto no CTR é:',
              options: ['O tipo de orçamento (CBO vs ABO)', 'O gancho do criativo (primeiros segundos/primeira linha)', 'O fuso horário do conjunto'],
              correctIndex: 1,
              explanation: 'Quem decide clicar é a pessoa vendo o anúncio — o gancho é a porta de entrada.',
            },
            {
              prompt: 'A Biblioteca de Anúncios da Meta serve para:',
              options: ['Publicar anúncios', 'Espionar todos os anúncios ativos de qualquer página', 'Comprar criativos prontos'],
              correctIndex: 1,
              explanation: 'É a janela pública do leilão: anúncio rodando há meses é sinal público do que funciona no nicho.',
            },
            {
              prompt: 'Frequência 3.5 com CTR em queda indica:',
              options: ['Criativo em fadiga — hora de renovar', 'Público muito grande', 'Conta em aprendizado'],
              correctIndex: 0,
              explanation: 'Frequência alta + CTR caindo = mesmo público vendo o mesmo anúncio demais. Renove o criativo.',
            },
          ],
        },
        {
          title: 'Orçamento, leilão e como não queimar grana',
          description:
            'CBO vs ABO, o mínimo inteligente por campanha, a fase de aprendizado e as regras de edição que não resetam o algoritmo.',
          durationMin: 16,
          content: `Orçamento é onde o iniciante mais se queima: ou investe R$ 10/dia e culmina o algoritmo de fome, ou coloca R$ 500 no primeiro dia e recebe um procurador. Esta aula coloca o dinheiro no tamanho certo.

## O mínimo inteligente
O Meta recomenda orçamento suficiente para **50 eventos de conversão/semana** por conjunto (fase de aprendizado completa). Na prática da vida real: para e-commerce com conversão de 2%, CPC de R$ 1 → 50 vendas/semana exigiria R$ 2.500/dia — inviável para a maioria. Então a regra de bolso honesta:
- **Campanha de conversão séria: R$ 30-50/dia no mínimo** (abaixo disso, o algoritmo demora semanas para ter dados).
- Comece com o que NÃO dói perder 70% nos 2 primeiros meses — porque os primeiros dias são pagamento de escola (dados). R$ 30/dia × 60 dias = R$ 1.800 de aprendizado + vendas parciais. Orçamento menor que isso não testa nada: só confirma que "não funciona".

## CBO vs ABO
- **ABO** (orçamento por conjunto): cada conjunto recebe o seu. Controle fino, ótimo para TESTAR públicos (R$ 20 por hipótese).
- **CBO** (orçamento por campanha / Advantage campaign budget): o Meta distribui entre conjuntos/anúncios em tempo real, priorizando o que performa. Ideal para ESCALAR o vencedor.
Padrão recomendado: teste em ABO (ou 1 conjunto amplo), escale o vencedor em CBO.

## A fase de aprendizado (e por que mexer demais mata)
Todo conjunto entra em "aprendizado" e precisa de ~50 conversões para "concluir". Cada edição significativa (público, criativo, orçamento >20%) **reseta** ou degrada o aprendizado. Tradução: o iniciante que edita tudo todos os dias mantém a conta ETERNAMENTE em aprendizado — e depois culpa o algoritmo. Cadência saudável: olhe os números todo dia, **decida** apenas a cada 3-4 dias, edite em blocos.

## Regras de movimentação de verba
- Aumentar orçamento: em passos de **até 20-30% a cada 2-3 dias** (R$ 50 → 60 → 75 → 100). Dobrar de uma vez pode reabrir aprendizado.
- Reduzir: pode ser mais agressivo (cortar 50% não "confunde" tanto).
- Dia ruim (CPA 2x o normal): NÃO pause a campanha no impulso. Olhe a semana: média semanal importa mais que dia. Pause só se rompeu o teto de perda definido ANTES (ex.: "se perder R$ 150 sem venda, pauso e diagnostico").
- Defina SEMPRE um teto de perda antes de ligar a campanha. Sem teto, a única regra é a emoção — e emoção em leilão é combustível.

## Prazo honesto de avaliação
Datas e promoções distorcem tudo: avalie janelas de 7 dias (o Meta tem "comparação: últimos 7 dias vs. anteriores"). E separe o dia 1-2 de qualquer campanha nova: entrega errática é normal — o algoritmo está testando.

## Sua tarefa
Defina seus 3 números ANTES do primeiro anúncio: orçamento diário (que sustenta 60 dias), teto de perda por campanha e dia da semana de decisão (ex.: toda segunda, análise da semana + edições). Coloque na agenda — disciplina de orçamento é a diferença entre investidor e apostador.`,
          quiz: [
            {
              prompt: 'O caminho mais seguro para escalar orçamento é:',
              options: ['Dobrar o valor assim que der lucro', 'Aumentar 20-30% a cada 2-3 dias', 'Criar uma campanha nova maior e pausar a antiga'],
              correctIndex: 1,
              explanation: 'Incrementos graduais preservam o aprendizado do algoritmo — saltos grandes reabrem a fase de teste.',
            },
            {
              prompt: 'Dia com CPA 3x acima do normal. A primeira ação é:',
              options: ['Pausar a campanha imediatamente', 'Ver a média semanal e o teto de perda definido antes de agir', 'Aumentar o orçamento para compensar'],
              correctIndex: 1,
              explanation: 'Variação diária é ruído normal; decisão se toma em janelas e limites pré-definidos.',
            },
          ],
        },
        {
          title: 'Teste A/B sem queimar dinheiro',
          description:
            'O método científico do tráfego: uma variável por vez, volume mínimo para conclusão e o caderno de testes que transforma tentativa em conhecimento.',
          durationMin: 14,
          content: `Tráfego pago é, no fundo, uma máquina de experimentos com dinheiro real. Quem testa sem método queima verba aprendendo nada; quem testa com método acumula vantagem composta. Esta aula é o método.

## O que NÃO é teste A/B
Trocar público + criativo + orçamento juntos e olhar "qual foi melhor" — você não sabe O QUE causou a diferença. Também não é rodar 2 dias e decidir por R$ 40 de gasto (ruído, não sinal). E não é testar 12 públicos ao mesmo tempo com R$ 10 cada: nenhum atinge volume para conclusão.

## Uma variável por vez
Pergunta clara primeiro: "O vídeo novo tem CTR maior que a imagem?" Congele TODO o resto (mesmo público, mesmo orçamento, mesma página). Se precisa testar 2 coisas, faça em sequência ou use o recurso nativo **Teste A/B** (duplicar campanha → Teste A/B) que divide a audiência para evitar sobreposição.

## Volume mínimo para conclusão
Regra estatística prática: um teste só tem sinal quando cada versão acumula **pelo menos ~20-30 conversões** (ou 100+ cliques, para métricas de topo como CTR). Com R$ 30/dia e CPA de R$ 15, uma comparação de criativos leva ~2 semanas. Menos que isso: é chutinho com grana de anúncio. Se o orçamento é pequeno, teste MENOS coisas, mais devagar — um teste por mês bem feito vale mais que 12 rasgados.

## Hierarquia de impacto (teste nesta ordem)
1. **Oferta** (preço, bônus, garantia) — muda tudo, teste com cuidado.
2. **Ângulo/gancho do criativo** — maior alavanca de CPA.
3. **Formato** (vídeo vs. imagem; vertical vs. quadrado).
4. **Página de destino** (headline, prova, formulário).
5. **Público** — nas contas modernas com pixel forte, é o de menor impacto (o algoritmo resolve).
Iniciante típico testa na ordem inversa (só públicos) e estranha por que "nada muda".

## O caderno de testes
Planilha simples: data, hipótese ("vídeo com gancho de dor tem CTR maior"), variável, resultado (CTR A/B, CPA A/B), decisão, aprendizado. Em 6 meses você terá um manual do SEU negócio que nenhum curso entrega — porque é específico da sua oferta e do seu público. Esse caderno É o ativo de um gestor de tráfego.

## Quando encerrar um teste
Conclusão estatística (volume mínimo atingido + diferença consistente) OU gasto máximo definido antes ("teste este criativo com R$ 100; se CTR < 1%, morre"). Data de morte evita o pior vício do mídia: manter campanha ruim "para ver se recupera".

## Sua tarefa
Escreva sua 1ª hipótese no formato certo: "A (variável) terá B (métrica) melhor que C (controle) porque (motivo)". Defina o gasto máximo e a data de avaliação. Pronto: você tem um experimento, não uma aposta.`,
          quiz: [
            {
              prompt: 'Um teste A/B válido exige:',
              options: ['Trocar vários elementos de uma vez para acelerar', 'Uma variável por vez, com volume mínimo de dados para conclusão', 'Rodar 1 dia e decidir'],
              correctIndex: 1,
              explanation: 'Sem controle de variáveis e sem volume, diferença é ruído — não aprendizado.',
            },
            {
              prompt: 'Na hierarquia de impacto, o que costuma mover MAIS o CPA?',
              options: ['Público', 'Ângulo/gancho do criativo', 'Horário de exibição'],
              correctIndex: 1,
              explanation: 'O criativo define quem se identifica e clica — é a maior alavanca tática de resultado.',
            },
          ],
        },
      ],
    },
    {
      title: 'Módulo 3 · Google Ads na prática',
      description:
        'O outro gigante: busca com intenção alta, palavras-chave que qualificam, anúncios que respondem a quem já procura — e os formatos complementares.',
      lessons: [
        {
          title: 'Busca paga: o leilão da intenção',
          description:
            'Como o Google Ads funciona de verdade (leilão + Índice de Qualidade), por que intenção vale ouro e quando busca vence o social.',
          durationMin: 16,
          content: `Meta e Google parecem "anúncio" — mas são jogos diferentes. No social, você INTERROMPE alguém navegando. Na busca, você RESPONDE alguém digitando "encanador 24h curitiba". Essa diferença (intenção explícita) explica por que a busca costuma converter melhor e custar mais caro por clique.

## O leilão do Google não é do maior lance
A posição do anúncio resulta de: **Lance × Índice de Qualidade** (mais extensões e efeitos de contexto). O Índice de Qualidade (1-10) avalia:
- **CTR esperado**: seu anúncio costuma ser clicado para essa palavra?
- **Relevância do anúncio**: o texto responde à palavra-chave?
- **Experiência da página**: a página de destino entrega o prometido, rápido e claro?

Tradução econômica: anúncio relevante com página boa paga MENOS que anúncio genérico rico. Índice 7+ é a meta; 3-4 significa pagar imposto de preguiça em cada clique. O Google mostra o índice por palavra (Palavras-chave → colunas → Índice de qualidade).

## Quando a busca vence o social
- **Serviço de necessidade/local**: encanador, dentista, advogado, chaveiro, mudança — quem busca está com o problema AGORA.
- **B2B e alto ticket**: "software de gestão para clínicas" é compra pesquisada, não por impulso.
- **Reposição e comparação**: quem busca "melhor CRM para pequenas empresas" está no fundo do funil.

Quando o social vence: produtos de impulso, visual, novidade e público que ainda não sabe que precisa (ninguém busca "curso que eu não sabia que existia").

## Estrutura de conta mínima que funciona
1 campanha de **Pesquisa** por objetivo/nicho → grupos de anúncios por **tema** (ex.: "curso de word", "formatação abnt" em grupos separados) → 2-4 anúncios responsivos por grupo + extensões. O erro clássico: 1 grupo com 200 palavras misturadas — o anúncio não consegue ser relevante para todas (e o índio de qualidade cai). A aromatização é: **palavras parecidas juntas, anúncio espelhando a palavra**.

## Tipos de campanha (mapa rápido)
- **Pesquisa**: o núcleo — texto na SERP. Comece aqui.
- **Performance Max**: o Google distribui em toda rede (busca, Maps, YouTube, Gmail, Display) com automação total — forte quando há feed/categorias bem alimentadas; opaco para diagnóstico.
- **Shopping**: vitrine de produto com foto e preço (e-commerce).
- **Display/YouTube**: conscientização e remarketing visual.

## O orçamento inicial sensato
Busca custa mais por clique e entrega mais perto da venda: nichos locais CPC R$ 1-4; serviços profissionais R$ 4-15; nichos competitivos (saúde, jurídico) podem ultrapassar. Comece com orçamento que sustente 30-50 cliques/dia no seu nicho — abaixo disso o aprendizado das palavras demora semanas.

## Sua tarefa
Liste 10 frases que seu cliente IDEAL digitaria no Google quando está pronto para comprar (com "preço", "contratar", "perto de mim"...). Essas frases são a semente da sua campanha — levamos para a próxima aula.`,
          quiz: [
            {
              prompt: 'O Índice de Qualidade alto resulta em:',
              options: ['Cliques mais baratos e posições melhores', 'Mais impressões à noite', 'Aprovação mais rápida dos anúncios'],
              correctIndex: 0,
              explanation: 'Lance × Qualidade decide o leilão: relevância desconta o preço do clique.',
            },
            {
              prompt: 'Para serviço local de urgência (encanador, chaveiro), o formato geralmente mais eficaz é:',
              options: ['Rede de Display', 'Campanha de Pesquisa', 'YouTube in-stream'],
              correctIndex: 1,
              explanation: 'Quem busca serviço de urgência digita a dor na hora — intenção explícita na busca.',
            },
          ],
        },
        {
          title: 'Palavras-chave: pesquisa, correspondência e negativas',
          description:
            'Achar as palavras certas, entender os 4 tipos de correspondência e usar negativas para estancar o vazamento de orçamento.',
          durationMin: 20,
          content: `Palavra-chave é o contrato entre você e o leilão: define QUANDO seu anúncio pode aparecer. Escolher mal = pagar por cliques de curioso; escolher bem = só entra quem busca o que você vende.

## Pesquisa de palavras-chave (a mina de ouro grátis)
Ferramenta Planejador (Ferramentas → Planejamento → Planejador de palavras-chave): digite suas sementes e receba volume mensal, concorrência e faixa de lance. Regras para escolher:
- **Intenção > volume**: "curso de word online" (500 buscas, intenção alta) vale mais que "word" (50 mil buscas, intenção nula).
- Long tail (2-4 palavras específicas) converte 2-3x mais e custa menos: "formatação abnt preço" > "abnt".
- Espie o relatório de **Termos de pesquisa** depois que a campanha rodar: é o Google te contando o que as pessoas realmente digitaram (e onde seu dinheiro foi).

## Os 4 tipos de correspondência
- **Ampla** (palavra sem sinal): máxima reach, mínimo controle — pode casar com termos distantes. Com o Google moderno, até "ampla" é moderada, mas ainda é a mais solta. Use apenas com negativas robustas.
- **De frase** ("curso de word"): casará buscas com esse sentido/sequência — o equilíbrio padrão de hoje. "Melhor curso de word 2025" casa; "word grátis download" depende.
- **Exata** ([curso de word]): máxima precisão, menor volume. Para palavras comprovadamente lucrativas.
- **Negativa** (-grátis): BLOQUEIA buscas. O firewall do orçamento.

Estratégia 2025: comece com **frase** para tudo, observe 2 semanas de Termos de pesquisa, promova vencedoras para exata (com lance próprio) e negatíve o lixo.

## Negativas: a válvula que estanca o prejuízo
Semana 1 de campanha, abra Termos de pesquisa e negatíve de olho fechado os padrões de lixo: **-grátis -free -vagas -emprego -curso gratuito -download -pdf -como fazer** (adapte ao seu caso: se você vende curso, "grátis" é lixo; se você oferece emprego, é público). Rotina semanal de 15 minutos de negativação economiza 20-30% de verba na maioria das contas mal cuidadas.

## A ponte para o anúncio
Palavra do grupo aparece no TÍTULO do anúncio? Índice de qualidade sobe, CTR sobe, CPC cai. É por isso que grupos são temáticos: "curso de word" e "formatação abnt" exigem anúncios diferentes — cada grupo de anúncios existe para permitir esse espelhamento.

## Estrutura final da sua campanha semente
Campanha Pesquisa → Grupo "curso-word" (frase: "curso de word", "curso word online", "aula de word") → anúncio com "Curso de Word" no título → página falando de curso de word. Duplicar para o segundo tema. Simples, limpo, escalável.

## Sua tarefa
Com o Planejador, valide suas 10 sementes: anote volume + lance sugerido. Separe em 2 grupos temáticos e escreva 3 negativas universais do seu nicho. Estrutura pronta para o próximo passo: o anúncio.`,
          quiz: [
            {
              prompt: 'Entre "word" (50 mil buscas) e "curso de word online preço" (300 buscas), qual tende a converter mais?',
              options: ['"word" — volume é tudo', 'A long tail específica — intenção de compra clara', 'Ambas iguais'],
              correctIndex: 1,
              explanation: 'Termo específico revela estágio de compra; termo genérico atrai todo tipo de intenção.',
            },
            {
              prompt: 'Você vende curso PAGO. Qual negativa é obrigatória desde o dia 1?',
              options: ['-curso', '-grátis', '-online'],
              correctIndex: 1,
              explanation: '"Grátis" atrai quem não quer pagar — negativar estanca esse vazamento de verba.',
            },
          ],
        },
        {
          title: 'Anúncios de pesquisa que convertem',
          description:
            'Anúncio responsivo na prática: títulos que espelham a busca, extensões que ocupam a tela e a página de destino que fecha o negócio.',
          durationMin: 16,
          content: `Na busca, seu anúncio compete com 3 concorrentes E com os resultados orgânicos por UM clique. A boa notícia: a fórmula de anúncio vencedor é bem conhecida — e extensões são pontos grátis que quase ninguém completa.

## Anúncio Responsivo de Pesquisa (RSA): como funciona
Você fornece até 15 títulos (30 caracteres cada) e 4 descrições (90 caracteres); o Google combina em tempo real. Regras de ouro:
- **Título 1 = espelho da palavra-chave** do grupo ("Curso de Word do Zero").
- **Título 2 = diferencial** ("19 aulas práticas + certificado").
- **Título 3 = CTA ou prova** ("Comece hoje · 7 dias de garantia").
O Google vai mesclar tudo — escreva títulos que façam sentido em QUALQUER ordem (cada um autossuficiente).

## Copy de busca: responda, não grite
Quem busca já tem a pergunta na cabeça. O anúncio que ganha: **palavra-chave visível** (o usuário varre o termo que digitou), **número concreto** ("19 aulas", "R$ 109", "entrega em 24h") e **remoção de risco** ("garantia 7 dias", "sem fidelidade"). Caixa alta pontual para destacar termo, emoji não (reprovado na busca em muitos casos).

## Extensões (agora "recursos"): pontos grátis de tela
Cada extensão ocupa espaço do concorrente e aumenta CTR (o Google mostra: anúncios com extensões têm CTR significativamente maior). Complete TODAS:
- **Sitelinks**: 4 links internos ("Preços", "Conteúdo do curso", "Depoimentos", "Dúvidas").
- **Frases de destaque**: 4-6 benefits curtos ("Certificado incluído", "Acesso vitalício").
- **Snippets estruturados**: categorias ("Tipos de aula: prática, teórica, projeto").
- **Chamada**: telefone clicável (obrigatória para negócio local).
- **Local**: endereço + Maps (negócio físico: é a extensão mais valiosa).

## A página de destino fecha (ou mata) o leilão
Clique pago caindo em homepage genérica é dinheiro desperdiçado. A página certa: **mesma promessa do anúncio no título** ("Curso de Word do Zero" no anúncio → "Curso de Word do Zero" no H1), prova social visível sem scroll, preço/CTA acima da dobra (ou captura de lead), carregamento < 3s. Relevância da página compõe o Índice de Qualidade: página alinhada = CPC mais barato no próximo leilão. Para negócio local, a "página" pode ser uma landing com botão WhatsApp — resposta em 1 toque.

## Checklist de publicação
Palavras em frase ✔ · 2-4 RSA com títulos espelhados ✔ · TODAS as extensões preenchidas ✔ · página espelhando anúncio ✔ · rastreamento de conversão importado do GA4/Tag ✔. Só depois: orçamento e lances.

## Sua tarefa
Escreva 1 RSA completo para seu grupo semente: 8 títulos + 3 descrições + lista de 4 sitelinks. Cole do lado do anúncio de um concorrente (busque sua palavra) e responda honestamente: em qual você clicaria? Ajuste até ser o seu.`,
          quiz: [
            {
              prompt: 'No RSA, o título 1 mais eficaz geralmente:',
              options: ['É o nome da empresa', 'Espelha a palavra-chave que o usuário digitou', 'É o mais criativo possível'],
              correctIndex: 1,
              explanation: 'O usuário varre o termo buscado — espelhar a palavra aumenta relevância, CTR e Índice de Qualidade.',
            },
            {
              prompt: 'Extensões/sitelinks valem a pena porque:',
              options: ['São obrigatórios do Google', 'Ocupam mais espaço na tela e elevam o CTR sem custo extra', 'Reduzem o preço do produto'],
              correctIndex: 1,
              explanation: 'Recursos multiplicam a presença do anúncio na SERP — CTR maior com o mesmo clique disputado.',
            },
          ],
        },
        {
          title: 'Shopping, Performance Max e YouTube: quando usar cada um',
          description:
            'Os formatos além da busca: vitrine de e-commerce, o canivete automatizado do Google e o vídeo com intenção — e a ordem certa de adoção.',
          durationMin: 14,
          content: `A busca é o núcleo, mas o Google vende em mais três palcos. A regra de adoção: **domine a busca primeiro** — formatos avançados com conta fraca (sem conversões no rastreio) automatizam o erro em vez do acerto.

## Shopping: a vitrine do e-commerce
Anúncio com **foto, preço e nome da loja** direto na busca (e na aba Shopping). Alimentado pelo **Merchant Center**: feed de produtos (título, foto, preço, disponibilidade). Onde brilha: produto físico com margem para CPC de R$ 0,50-2. O título do feed é SEO: "Tênis Corrida Masculino Nike Revolution 6 Preto" > "Tênis 1234" (marca + modelo + atributo). Comece por campanhas Shopping padrão (controle por produto) antes de entregar tudo ao PMax.

## Performance Max: o canivete automatizado
PMax roda em TODOS os canais do Google (busca, Maps, YouTube, Gmail, Display, Shopping) com 1 campanha: você fornece ativos (títulos, descrições, fotos, vídeos, feed), lances e metas — o Google monta e distribui. Verdade honesta:
- **Prós**: escala com pouco esforço; ótimo quando a conta tem conversões sólidas para guiar.
- **Contras**: quase nenhum insight (você não vê exatamente onde foi a verba), pode canibalizar marca (cliques de quem já te buscava) e piora quando os ativos são fracos.
Regra: PMax **depois** de 30-50 conversões/mês estáveis. Antes disso, automação otimiza para a meta com dados insuficientes. Se usar, adicione negativas de marca (via lista de palavras exclusas de conta, com o recurso de "exclusões de marca") e acompanhe o relatório de ativos.

## YouTube Ads: vídeo com intenção e remarketing gigante
Formatos principais: **in-stream skippable** (pula em 5s — seu gancho precisa segurar, e só paga se assistir 30s), **in-feed** (thumb competitivo no feed de vídeos) e **Shorts** (vertical, CPM baixíssimo). O YouTube é top-of-funnel: mede-se por **CPV (custo por view)** e remarketing gerado (assistiram 50%+) — não espere ROAS no dia 1. Combinação forte: vídeo educativo/demonstração → público "assistiu 50%" → remarketing Meta/Google com oferta.

## Ordem de adoção recomendada
1. **Pesquisa** (dia 1): intenção pura.
2. **Shopping** (e-commerce, semana 2-4): feed pronto.
3. **Remarketing Display/YouTube** (mês 2): público quente barato.
4. **PMax** (mês 2-3, com volume de conversão): escala automatizada.
5. **YouTube proativo** (quando houver margem para construir demanda).
Cada degrau só sobe quando o anterior tem números estáveis — escada de formatos é escada de dados.

## Sua tarefa
Escreva a ordem de adoção para SEU negócio com datas: quando entra pesquisa, o que precisa estar pronto para o segundo formato e qual volume de conversão libera o PMax. Formato sem dado é decoração caríssima.`,
          quiz: [
            {
              prompt: 'Performance Max tende a performar melhor quando:',
              options: ['Usada desde o dia 1 em conta nova', 'A conta já tem volume estável de conversões e ativos de qualidade', 'Usada sem feed de produtos no e-commerce'],
              correctIndex: 1,
              explanation: 'Automação precisa de dados de conversão e ativos bons; em conta nova, ela automatiza o desconhecido.',
            },
            {
              prompt: 'No YouTube in-stream skippable, você paga quando o usuário:',
              options: ['Vê os 5 segundos iniciais', 'Assiste 30 segundos (ou o vídeo inteiro, se menor) ou interage', 'Clica no botão de pular'],
              correctIndex: 1,
              explanation: 'O gatilho de cobrança é a audiência qualificada: 30s de visualização ou interação.',
            },
          ],
        },
      ],
    },
    {
      title: 'Módulo 4 · Otimização, escala e resultado',
      description:
        'A rotina que separa gestor de apostador: diagnóstico semanal, remarketing, escala de verba com margem e relatórios que retêm cliente.',
      lessons: [
        {
          title: 'Diagnóstico de campanha: lendo dados e decidindo',
          description:
            'A rotina semanal em 30 minutos: onde olhar, os 4 diagnósticos clássicos e a árvore de decisão que diz o que mexer (e o que deixar quieto).',
          durationMin: 20,
          content: `Campanha ligada, o trabalho real começa: **ler dados e decidir**. Esta aula entrega a rotina semanal de 30 minutos que uso em conta real — com a árvore de decisão para os 4 problemas clássicos.

## A rotina de 30 minutos (toda semana, mesmo dia)
1. **Painel geral (5 min)**: gasto, conversões, CPA, ROAS da semana vs. semana anterior (o Meta/Google têm comparação nativa de períodos). Tendência importa mais que número absoluto.
2. **Nível campanha (5 min)**: alguma campanha fora do padrão? (CPA 30%+ pior que a média / gasto parado / reprovação de anúncio).
3. **Nível anúncio (10 min)**: distribuição de entrega — quem consome verba e qual CPA de cada criativo. Frequência e CTR (fadiga?).
4. **Termos de pesquisa / relatórios de público (5 min)**: só na conta de busca (negativação) e checagem de públicos no social.
5. **Decisões (5 min)**: no máximo 2-3 edições — anotadas no caderno de testes com hipótese.

## Diagnóstico 1 — CPA alto, CTR baixo
O anúncio não prende. Ações (nesta ordem): renovar gancho do criativo → testar novo ângulo → revisar público (muito frio? interesse errado?). Não mexa em orçamento ainda: o problema é o material.

## Diagnóstico 2 — CTR bom, conversão baixa
O anúncio entrega, a página não converte. Ações: alinhar promessa do anúncio com o H1 da página → acelerar carregamento (>3s mata 40% dos cliques mobile) → simplificar o passo final (menos campos, preço claro, prova perto do CTA) → checar rastreamento (conversão está sendo contada? Compara com planilha/WhatsApp).

## Diagnóstico 3 — Tudo "ok" mas ROAS apertado
Mídia razoável, economia fraca. Ações: aumentar ticket (upsell/order bump) → oferta bundle → reavaliar margem/preço → reduzir desperdício (negativas, exclusões, horários mortos). Nem sempre a saída é otimizar anúncio: às vezes é a oferta que precisa de músculo.

## Diagnóstico 4 — CPM subindo e frequência alta
Público saturando ou competição sazonal (Black Friday distorce tudo). Ações: renovar criativo (frequência 3+ é hora) → ampliar público/geografia → testar posicionamento novo (Reels/Shorts costumam segurar CPM) → aceitar CPM maior temporário e otimizar conversão.

## O que NÃO fazer (a lista do autocuidado)
- Não edite dia de semana morto por pânico de domingo.
- Não pause campanha inteira por 1 dia ruim — média semanal é o juiz.
- Não acredite em atribuição cega: compare com dados do negócio (vendas reais no CRM/caixa). O painel diz "eu trouxe 30"; o caixa diz "chegaram 22" — gerencie pelo menor.
- Não mude 5 coisas: 2-3 decisões por semana, documentadas.

## A regra de ouro do gestor
**Dados de 7 dias para julgar, 3 dias para reagir a rombo, 1 hipótese por mudança.** Quem segue isso bate a maioria dos "gurus" que editam tudo todos os dias.

## Sua tarefa
Rode a rotina de 30 minutos na sua conta (ou numa conta demo): escreva os 4 números da semana e 1 diagnóstico com ação. Esse é o entregável que um cliente paga para receber toda segunda-feira.`,
          quiz: [
            {
              prompt: 'CTR alto e conversão de página baixa. O diagnóstico provável é:',
              options: ['Criativo fraco', 'Página/promessa desalinhada ou fraca', 'Orçamento baixo'],
              correctIndex: 1,
              explanation: 'O anúncio cumpriu o papel (clique). A quebra está no destino: alinhamento, velocidade ou oferta.',
            },
            {
              prompt: 'A melhor janela para julgar performance de campanha é:',
              options: ['O dia de hoje', 'Média de 7 dias comparada com a semana anterior', 'O pico de qualquer dia'],
              correctIndex: 1,
              explanation: 'Sazonalidade diária é ruído; janelas semanais revelam tendência real.',
            },
          ],
        },
        {
          title: 'Remarketing: a venda para quem já passou',
          description:
            'Públicos quentes prontos para explorar, sequências de mensagens por temperatura e o remarketing dinâmico que recupera carrinho.',
          durationMin: 16, 
          content: `95-98% dos visitantes NÃO compram na primeira visita. Não é objeção — é processo natural de decisão. Remarketing é cobrar a conversa: anúncio só para quem já te deu um sinal. É o CPA mais barato da conta inteira, e mesmo assim a maioria das contas roda sem ele ou com 1 anúncio genérico.

## Seus públicos quentes (em ordem de temperatura)
1. **Abandonou carrinho/checkout (7-30 dias)** — quente máximo: queria comprar.
2. **Viu página de produto/checkout (14-30 dias)** — quente.
3. **Integrou com vídeo 50%+, engajou com perfil (30-90 dias)** — morno.
4. **Visitou o site (30-180 dias)** — frio-relativo.
5. **Lista de leads/clientes antigos (sem limite)** — reativação barata.
Monte 2-3 públicos para começar (1 quente, 1 morno) — mais que isso com verba pequena é fragmentação.

## A sequência por temperatura (o jogo de xadrez)
- **Quente (carrinho)**: oferta direta + removedor de atrito — "Seu carrinho te espera" + garantia + parcelamento + depoimento. 2-3 criativos girando. Para e-commerce: **remarketing dinâmico** (Meta/Google exibem o PRODUTO que a pessoa viu — configure o catálogo uma vez).
- **Morno (engajou, visitou)**: quebra de objeção — depoimento em vídeo, "por trás do resultado", comparativo, FAQ. Nada de desconto ainda: venda confiança.
- **Frio-relativo (visitou há meses)**: conteúdo novo + oferta suave (lead magnet ou entrada de R$ baixo).
- **Clientes**: recorrente/complementar ("quem comprou Word leva Excel com 30%"). Vender de novo é 5-7x mais barato que conquistar novo.

## Desconto: a última carta, não a primeira
Oferta de desconto para todo mundo vira teto permanente de preço (o cliente aprende a esperar). Estrutura certa: desconto **com prazo real** (estoque/cupos de turma) só para quente, comunicada como recompensa ("Você deixou algo para trás: 15% até sexta"). Janela de conversão (7-14 dias para carrinho; 30 para morno) e **exclusões** (quem comprou nos últimos 14 dias sai da campanha) fecham o sistema.

## Frequência e higiene
Público pequeno + verba diária = frequência estourando (5, 6, 10...). Sintoma: CTR cai, comentários raivosos sobem. Antídotos: janela menor, criativos girando (mínimo 3), cap de frequência no Google Display, e ampliar para público morno quando o quente saturar. Remarketing incomoda quando é repetitivo — nunca quando é relevante.

## Google também remarketa
Rede de Display + YouTube com públicos do GA4 (visitantes, convertidos): CPM baixíssimo para manter presença. Na busca, a campanha RLSA (para quem visitou) permite lances maiores com CTR maior. E o email/WhatsApp próprio (automação de carrinho) continua sendo o remarketing com maior ROI do mundo — anúncio e automação andam juntos.

## Sua tarefa
Monte seu plano de remarketing: 2 públicos (fonte + janela), 3 criativos por público (que objeção cada um mata?) e a regra de exclusão de compradores. É a campanha mais lucrativa que você vai ligar este mês.`,
          quiz: [
            {
              prompt: 'O público com maior probabilidade de conversão imediata é:',
              options: ['Visitantes há 6 meses', 'Quem abandonou carrinho nos últimos 7-14 dias', 'Quem curtiu um post'],
              correctIndex: 1,
              explanation: 'Quem chegou ao carrinho tinha intenção de compra — remarketing ali tem o CPA mais baixo.',
            },
            {
              prompt: 'Desconto em remarketing deve ser:',
              options: ['Para todos os públicos, sempre ativo', 'Com prazo real e para público quente, como removedor de atrito', 'Nunca usar'],
              correctIndex: 1,
              explanation: 'Desconto eterno educa o público a esperar promoção; pontual e com prazo, recupera vendas.',
            },
          ],
        },
        {
          title: 'Escala: crescer orçamento sem quebrar o ROAS',
          description:
            'Vertical vs. horizontal, os sinais de campanha pronta para escalar e o plano de 4 semanas para dobrar verba com segurança.',
          durationMin: 18,
          content: `Escala é o sonho de todo anunciante — e o cemitério das contas apressadas. Dobrar verba da noite para o dia reinicia aprendizado, dispara CPM e entrega a verba nova para públicos marginais. Escalar exige método: aqui está o playbook completo.

## Sinais de que a campanha está PRONTA para escalar
- **Estabilidade**: 2-3 semanas consecutivas batendo CPA-alvo/ROAS-alvo (não 1 semana boa).
- **Volume**: sai da fase de aprendizado (50+ conversões/semana) ou está estável mesmo com menos.
- **Margem**: ROAS atual ≥ break-even + folga (ex.: break-even 2, atual 3.5 — há espaço para CPA piorar um pouco na escala).
- **Público vivo**: frequência < 2.5 e CTR estável (não escalar em público saturado é acelerar a fadiga).
Se 3 dos 4 sinais estão ausentes, a campanha não precisa de mais verba — precisa de mais criativos/públicos.

## Escala vertical (mais verba na mesma campanha)
Aumente **20-30% a cada 2-3 dias**, sempre vigiando CPA por 48h após cada degrau. Se o CPA piorar além da folga, volte um degrau e estabilize 1 semana. Matemática da folga: break-even ROAS 2, atual 3.5 → tolerância de queda ~40% no ROAS. Cada degrau consome um pouco dessa tolerância — pare quando restar ~20%.

## Escala horizontal (mais campanhas/públicos)
Duplicar o vencedor para: novos públicos (lookalike %, novos interesses), novos posicionamentos (feed → Reels), novas geografias/cidades, novos ângulos de criativo em campanha própria. Vantagem: o vencedor original continua intocado. A regra: **cada nova campanha precisa de verba mínima para aprender** — 3 campanhas de R$ 15 não escalam nada; 1 vencedora em R$ 90 + 1 teste em R$ 40, sim.

## O plano de 4 semanas (template real)
- **Semana 1**: estabilização — vencedor em R$ 50/dia, 3 criativos girando, caderno de dados em dia.
- **Semana 2**: vertical — R$ 65 → 80 → 100 (20-30% degraus), CPA monitorado por degrau. Novo criativo nº 4 entra.
- **Semana 3**: horizontal — vencedor em R$ 100-120; campanha teste B com novo público em R$ 40.
- **Semana 4**: consolidação — campeã da semana 3 ganha verba; perdedora morre sem drama. Repete o ciclo.
Dobrar verba em 4 semanas com ROAS saudável é ritmo excelente — e sustentável.

## O que quebra na escala (e o plano B)
- **CPM sobe com o volume** (você passa a disputar leilões maiores): compense com criativo novo e posicionamentos baratos.
- **Público marginais pioram a conversão**: segure CPA-alvo 10-15% pior na escala — é o preço do crescimento.
- **Operação não acompanha**: 3x leads com o mesmo atendimento = leads frios no chão. Escale o atendimento JUNTO (resposta < 15 min, scripts prontos). Venda sem operação é publicidade para a concorrência.
- **Estoque/capacidade**: anúncio que escala oferta esgotada queima marca e dinheiro.

## A mentalidade final
Escala não é evento, é **ciclo mensal**: estabiliza → degrau → monitora → consolida → repete. O gestor que escala 20% ao mês com margem vive muito mais feliz (e mais rico) que o que dobra em uma semana e volta a zero no mês seguinte.

## Sua tarefa
Escreva seu plano de 4 semanas com números reais: verba atual, degraus da vertical, o teste horizontal da semana 3 e seu CPA-alvo com folga. A escala é um cronograma — agora você tem o seu.`,
          quiz: [
            {
              prompt: 'O ritmo seguro de escala vertical é:',
              options: ['Dobrar a verba assim que bater meta', '20-30% de aumento a cada 2-3 dias com monitoramento por degrau', 'Aumentar 5% por mês'],
              correctIndex: 1,
              explanation: 'Degraus moderados preservam aprendizado e deixam o CPA ser monitorado a cada movimento.',
            },
            {
              prompt: 'Na escala, é normal que:',
              options: ['O CPA melhore sempre', 'O CPA piora um pouco (CPM sobe, públicos marginais) — dentro da folga de margem', 'O CTR zere'],
              correctIndex: 1,
              explanation: 'Escala consome eficiência marginal; a margem calculada antes define quanto há de folga.',
            },
          ],
        },
        {
          title: 'Relatórios que retêm cliente (e provam valor)',
          description:
            'O relatório mensal em 1 página: números do negócio primeiro, mídia depois, próximos passos claros — o entregável que transforma mídia em relação de confiança.',
          durationMin: 16,
          content: `Cliente não compra clique — compra **resultado e clareza**. O gestor que entrega planilha de métricas cruas compete por preço; o que entrega diagnóstico e plano compete por confiança. Esta aula monta seu relatório mensal de 1 página (e a reunião de 15 minutos).

## A ordem que importa (de cima para baixo)
1. **Resumo executivo (3 linhas)**: "Investimos R$ 2.400 e retornamos R$ 9.100 (ROAS 3.8). Custo por venda caiu 12% vs. mês passado. Próximo ciclo: escalar campanha X e testar novo público."
2. **Números do NEGÓCIO**: faturamento atribuído, vendas, ticket médio, CPA — antes de qualquer CTR/CPM. Cliente pensa em caixa, não em impressões.
3. **Evolução vs. mês anterior**: tabela simples gasto/vendas/CPA/ROAS com seta ▲▼. Contexto transforma número em história.
4. **O que fizemos**: 3-5 bullets ("novo criativo de prova social — CPA caiu de R$ 41 para R$ 33", "negativação de 27 termos vazando verba").
5. **Aprendizados e próximos passos**: o que aprendemos e o plano do próximo mês com prioridades. É a seção que PROVA pensamento estratégico.
6. **Anexo para curiosos**: print dos painéis, detalhes por campanha.

## Os números que o cliente VAI perguntar (tenha prontos)
- "Quanto voltou por real investido?" → ROAS e lucro estimado (com margem!). 
- "Por que o CPA subiu?" → contexto (sazonalidade, CPM de mercado, teste em andamento) + o que está sendo feito.
- "Quando escalar?" → critérios definidos (e mostre que existem critérios).
- Comparação honesta de atribuição: painel diz X, CRM/caixa diz Y — apresente os dois e gerencie pelo conservador. Transparência aqui é o que constrói a confiança de 12 meses.

## Linguagem: tradução permanente
CPM vira "quanto custa aparecer"; CTR vira "de cada 100 pessoas que viram, X clicaram"; frequência vira "quantas vezes a mesma pessoa viu". Nenhum termo técnico sem tradução na primeira vez. Cliente que ENTENDE o relatório renova; cliente que finge entender some.

## A reunião de 15 minutos
1 página na tela → 3 minutos de resumo → 5 minutos de "o que fizemos/aprendemos" → 5 minutos de próximos passos e decisões que precisam do cliente (aprovar oferta, dar acesso, estoque). Termine SEMPRE com a pergunta: "O que você precisa que eu priorize no próximo ciclo?" — o relatório conversa, não soliloca.

## Ferramentas (simples vence)
Looker Studio (grátis) conectado à conta = dashboard ao vivo para o cliente espionar quando quiser. Mas o relatório mensal em PDF/1 página é o cerimonial — o momento de síntese. Planilha bem feita > ferramenta chique mal preenchida.

## Sua tarefa
Monte o relatório de 1 página do SEU projeto (ou simulado): resumo executivo, tabela de evolução, 3 aprendizados e 3 próximos passos. Leia em voz alta como se o cliente estivesse do lado — qualquer frase que você não saberia explicar, corte ou estude. Esse é o padrão de entrega que cobra honorário de profissional.`,
          quiz: [
            {
              prompt: 'No relatório, os números do NEGÓCIO (vendas, faturamento) devem aparecer:',
              options: ['No final, como anexo', 'Antes das métricas de mídia, logo no topo', 'Nunca — só CTR e CPM'],
              correctIndex: 1,
              explanation: 'Cliente pensa em caixa: começar pelo resultado dele engancha a atenção para o resto.',
            },
            {
              prompt: 'Quando painel e caixa discordam (atribuição), a postura profissional é:',
              options: ['Mostrar só o número maior', 'Apresentar os dois e gerenciar pelo conservador', 'Esconder o relatório'],
              correctIndex: 1,
              explanation: 'Transparência na divergência constrói a confiança que sustenta o contrato longo.',
            },
          ],
        },
      ],
    },
  ],
}
