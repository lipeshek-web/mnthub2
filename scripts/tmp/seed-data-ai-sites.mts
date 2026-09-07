// Curso: Sites com IA — Curso 4 de 4 da Trilha IA para Estudantes (mentor Beatriz)
// Nível "produto para venda": construção prática de sites com Lovable, z.ai e Claude Code.
import type { CourseDef } from './seed-types'

export const sitesCourse: CourseDef = {
  mentorEmail: 'beatriz@demo.com',
  title: 'Sites com IA: portfólio, apresentação de projetos e captura de leads',
  description:
    'Seu projeto merece um endereço na internet — e hoje a IA constrói esse endereço com você. Neste Curso 4 de 4 da Trilha IA para Estudantes, você cria sites de verdade usando três ferramentas: Lovable para gerar e iterar visualmente, z.ai para evoluir com construção fullstack guiada e Claude Code para controle total no código. Você monta páginas que impressionam (portfólio, apresentação de projetos, TCC), escreve textos e gera imagens com IA, publica com domínio e SEO básico e instala uma captura de leads que transforma visita em contato. Do briefing ao ar, tudo construído no seu navegador, com prática em cada aula. Ao final, seu site está ao vivo, com formulário funcionando e pronto para divulgar — e você sabendo cobrar por esse serviço.',
  category: 'Tecnologia',
  level: 'INTERMEDIARIO',
  price: 149,
  coverUrl: '/uploads/seed/course-ia-sites.png',
  themes: [
    {
      title: 'Módulo 1 · Seu primeiro site com IA',
      description:
        'A base que tira o medo: o que existe por trás de qualquer site, qual ferramenta usar em cada situação e o seu primeiro site gerado por IA ainda nesta semana.',
      lessons: [
        {
          title: 'O que todo site tem por trás (em 10 minutos)',
          description:
            'Domínio, hospedagem e as três camadas do código explicadas com analogias que você nunca esquece — e por que a IA acabou de derrubar a barreira técnica.',
          durationMin: 12,
          content: `Todo site que você já visitou — do portfólio ao e-commerce — é feito das mesmas peças. Entendê-las de uma vez elimina o medo do "código" e mostra onde a IA entra em cada camada.

## As peças que sempre existem
- **Domínio**: o endereço que as pessoas digitam ("seusite.com"). É a placa da rua — alugado por ano, não comprado para sempre.
- **Hospedagem**: o computador sempre ligado onde os arquivos do site moram. É o terreno onde a casa é construída.
- **HTML**: o esqueleto. Define o que é cada coisa: aqui vai um título, aqui um parágrafo, aqui um botão.
- **CSS**: a roupa. Cores, fontes, espaçamentos, como o site veste no celular e no computador.
- **JavaScript**: a eletricidade. Faz o site reagir — o menu abre, o formulário envia, o botão responde ao toque.

## Estático vs. dinâmico
Um site **estático** é como um panfleto digital: as mesmas páginas para todos, rápido e simples de publicar. Portfólios, páginas de projeto e sites de apresentação são assim — e é o tipo que você vai construir neste curso. Um site **dinâmico** guarda dados e muda conforme quem visita: login, lista de produtos, área do aluno. Ele precisa de um "cérebro" no servidor (o famoso back-end) além do visual.

## Por que a IA acabou com a barreira
Antes, você precisava escrever HTML, CSS e JavaScript à mão para ter qualquer coisa no ar, e ainda aprender a configurar servidor para publicar. Hoje, descrever o site em português para uma IA gera as três camadas de uma vez — e publicar virou um botão. A barreira técnica que separava a ideia do site caiu. O que continua valendo é exatamente o que este curso treina: saber **o que pedir**, avaliar o que volta e **refinar até ficar bom**.

## Sua tarefa
Escolha um site que você admira e identifique as peças: qual é o domínio, o que parece ser o hero (a primeira dobra da página), onde está o formulário e o que o site faz de "dinâmico". Anote 3 elementos que você quer copiar no seu site.`,
          quiz: [
            {
              prompt: 'No esqueleto, roupa e eletricidade de um site, o que representa o HTML?',
              options: ['A estrutura e o significado de cada elemento', 'As cores e fontes', 'O que o site faz ao clicar'],
              correctIndex: 0,
              explanation: 'HTML é o esqueleto: define o que é título, parágrafo e botão. Visual é CSS; reações são JavaScript.',
            },
            {
              prompt: 'Um site que mostra as mesmas páginas para todos, sem login nem dados salvos, é:',
              options: ['Dinâmico', 'Estático', 'Um aplicativo de servidor'],
              correctIndex: 1,
              explanation: 'Estático entrega as mesmas páginas para todos — portfólios e páginas de apresentação são assim.',
            },
            {
              prompt: 'O que é o domínio de um site?',
              options: ['O endereço que as pessoas digitam', 'O computador onde os arquivos ficam', 'O código da página inicial'],
              correctIndex: 0,
              explanation: 'Domínio é a placa da rua; hospedagem é o terreno; o código é a construção em cima.',
            },
          ],
        },
        {
          title: 'As ferramentas do curso: Lovable, z.ai e Claude Code',
          description:
            'O papel de cada ferramenta, quando usar qual e a estratégia de custo em linhas gerais para não queimar crédito em retrabalho.',
          durationMin: 14,
          content: `Três ferramentas, três personalidades, um mesmo objetivo: colocar seu site no ar. Escolher a certa para cada momento poupa horas — e evita frustração.

## Lovable: o estúdio visual
No **Lovable** você descreve o site em português e vê o resultado tomando forma no navegador, com a prévia ao lado do chat. É a ferramenta mais direta para **gerar e ajustar visualmente** páginas completas — ideal para site de apresentação, portfólio e o projeto final deste curso. Iterar é conversar: "deixe o hero mais escuro", "troque o texto do botão".

## z.ai: construção fullstack guiada por IA
O **z.ai** é a plataforma de construção guiada por IA movida pelos modelos GLM. Ela vai além da página bonita: quando seu projeto precisa de lógica no servidor — área de cadastro, dados salvos, integrações — a construção fullstack guiada assume. Use quando a ideia exige **mais do que aparência**: um sistema pequeno, um painel, algo que guarda informação e responde a ela.

## Claude Code: o agente no terminal
O **Claude Code** roda no seu terminal e trabalha direto nos arquivos do projeto. É controle total: você acompanha o agente editar, criar e consertar código de verdade, no seu computador. É a escolha quando você quer **descer ao código** — entender cada arquivo, automatizar tarefas repetitivas ou evoluir um projeto que já existe.

## Quando usar qual
- Site simples e você quer ver o resultado agora: **Lovable**.
- Projeto com dados, cadastro ou lógica além da página: **z.ai**.
- Controle fino e projeto aberto no seu computador: **Claude Code**.

## Estratégia de custo em linhas gerais
As três oferecem entrada gratuita com limites de uso, e planos pagos por volume de trabalho da IA. O padrão que funciona: **faça a parte visual no Lovable, evolua no z.ai quando precisar de back-end e use o Claude Code quando o projeto crescer**. Assim o uso é gasto em iteração que aparece, não em retrabalho invisível.

## Sua tarefa
Crie a conta na ferramenta em que pretende começar (sugestão: Lovable) e escreva em 3 linhas qual site você quer tirar do ar neste curso: para que serve, para quem e o que precisa fazer — apenas apresentar, capturar contatos ou guardar dados.`,
          quiz: [
            {
              prompt: 'Você quer gerar e ajustar um site visualmente, vendo o resultado no navegador. Qual ferramenta encaixa melhor?',
              options: ['Lovable', 'Claude Code', 'Um editor de terminal'],
              correctIndex: 0,
              explanation: 'Lovable é o estúdio visual: geração e iteração com prévia ao vivo ao lado do chat.',
            },
            {
              prompt: 'Seu projeto precisa guardar cadastros e mostrar dados salvos. O caminho indicado é:',
              options: ['Ficar só na página estática', 'Construção fullstack guiada, como no z.ai', 'Remover o formulário'],
              correctIndex: 1,
              explanation: 'Quando entra lógica no servidor — dados, cadastro, integrações — a construção fullstack guiada assume.',
            },
            {
              prompt: 'O papel do Claude Code no curso é:',
              options: ['Editar as fotos do site', 'Trabalhar direto nos arquivos do projeto pelo terminal, com controle total', 'Publicar o site nas redes sociais'],
              correctIndex: 1,
              explanation: 'Claude Code é o agente no terminal: edita, cria e conserta código de verdade, no seu computador.',
            },
          ],
        },
        {
          title: 'Gerando seu primeiro site com Lovable',
          description:
            'O prompt de lançamento completo (objetivo, público, seções, estilo, CTA), a iteração em tempo real e o que fazer quando a IA erra.',
          durationMin: 18,
          content: `Chegou a hora de ver texto virar site. A qualidade do que a IA gera é espelho da qualidade do que você pede — e há um formato de prompt que funciona muito melhor que "faz um site pra mim".

## O prompt de lançamento
Antes de digitar, responda em uma frase cada item:
- **Objetivo**: para que existe o site? (apresentar meu portfólio, divulgar meu projeto de extensão)
- **Público**: quem vai ler? (recrutadores, professores, clientes)
- **Seções**: o que precisa ter? (início, sobre, projetos, contato)
- **Estilo**: a referência visual em palavras ("limpo, fundo claro, uma cor de destaque, sem exageros")
- **CTA**: a ação principal que você quer ("entrar em contato")
Junte tudo em um único pedido: "Crie um site de uma página para apresentar meu portfólio de design para recrutadores, com seções de início, sobre, projetos e contato. Estilo limpo, fundo claro, tipografia grande e uma cor de destaque. O CTA principal é entrar em contato."

## Iterando em tempo real
A mágica do Lovable é o ciclo curto: você pede, vê a prévia mudar, pede o próximo ajuste. Aproveite isso — não tente acertar tudo no primeiro prompt. Primeiro a estrutura inteira; depois o acabamento: cores, textos, imagens, ordem das seções. Cada ciclo leva segundos e deixa o site um pouco melhor.

## Quando a IA erra (e como reagir)
Erro clássico: você pede "menu mais bonito" e ela remove o menu. A reação errada é repetir o mesmo pedido, gritando. A reação certa é **reformular**: descreva o que está errado, o que deveria estar no lugar e o comportamento esperado. "O menu sumiu no celular. Recrie o menu no topo, com os links Início, Projetos e Contato, que deve permanecer visível ao rolar a página." Se persistir, reverta a última mudança e reformule em partes menores.

## O que evitar no começo
- Pedir 10 mudanças de uma vez — a IA aplica metade e inventa a outra metade.
- Pedir em abstrato ("melhorar o design") — melhor "aumentar o título e centralizar o hero".
- Aceitar o primeiro resultado como final. Ninguém publica a primeira versão.

## Sua tarefa
Escreva seu prompt de lançamento completo (objetivo, público, seções, estilo, CTA), gere a primeira versão do seu site no Lovable e faça 3 iterações pequenas de acabamento — anotando o que você pediu em cada uma.`,
          quiz: [
            {
              prompt: 'O que um bom prompt de lançamento precisa ter?',
              options: ['Objetivo, público, seções, estilo e CTA', 'Só a palavra site', 'Uma lista de 30 exigências técnicas'],
              correctIndex: 0,
              explanation: 'Cinco respostas curtas bastam: para que serve, para quem, o que tem, como parece e a ação principal.',
            },
            {
              prompt: 'A IA aplicou uma mudança errada. A melhor reação é:',
              options: ['Repetir o mesmo pedido com mais força', 'Reformular: o que está errado, o que deveria ser e o comportamento esperado', 'Recomeçar o site do zero'],
              correctIndex: 1,
              explanation: 'Reformular descreve o resultado desejado; repetir o pedido vago tende a gerar o mesmo erro.',
            },
            {
              prompt: 'No começo, qual é a estratégia recomendada de iteração?',
              options: ['Acertar tudo no primeiro prompt', 'Primeiro a estrutura inteira, depois o acabamento em ajustes pequenos', 'Publicar sem revisar'],
              correctIndex: 1,
              explanation: 'Estrutura primeiro, acabamento depois: cada ciclo curto deixa o site um pouco melhor sem surpresas.',
            },
          ],
        },
        {
          title: 'Entendendo o que a IA gerou',
          description:
            'Tour sem medo pelo código do site: páginas, componentes e estilos, onde os textos vivem e como fazer sua primeira edição manual.',
          durationMin: 16,
          content: `Você não vai virar programador neste curso — mas vai perder o medo do código que a IA escreveu. Olhar dentro do projeto é o que dá autonomia para ajustar coisas pequenas sem pedir à IA toda vez.

## O mapa do projeto
Um site gerado por IA segue um padrão quase sempre igual:
- **Páginas**: cada endereço do site (início, sobre, projetos, contato) é um arquivo próprio. É a porta de entrada do conteúdo.
- **Componentes**: blocos reutilizáveis — o cabeçalho, o botão, o card de projeto. O mesmo botão usado em 4 páginas é um componente só; muda em um lugar, muda em todas.
- **Estilos**: as regras visuais (cores, fontes, espaçamentos). Muitas ferramentas centralizam a paleta em um arquivo — trocar a cor de destaque ali muda o site inteiro.
- **Conteúdo**: os textos do site costumam viver junto das páginas. É ali que "Sua headline aqui" vira o seu título de verdade.

## Onde o texto vira conteúdo
Abra a página inicial no código e procure os textos que você vê na tela. Vai encontrá-los exatamente iguais, entre aspas ou marcados por tags. Esse casamento entre tela e código é o momento "aha": quando você percebe que cada parágrafo do site tem um endereço no código, editar deixa de ser mistério.

## Sua primeira edição manual
Para coisas pequenas, pedir à IA é desperdício de crédito. Trocar um texto, renomear um item do menu ou corrigir um erro de português você mesmo faz:
1. Encontre o texto na página certa (a busca do editor, Ctrl+F, salva vidas).
2. Altere **só o que está entre as aspas** — nunca mexa em símbolos e nomes ao redor.
3. Salve e olhe a prévia. Deu ruim? Desfaça. A IA te deu a casa; isso é a manutenção do dia a dia.

## Ler sem medo
Sinais de que é seguro mexer: textos entre aspas, listas de itens, nomes de seções. Sinais para não tocar por enquanto: nomes seguidos de parênteses (funções), números soltos no meio de símbolos e as linhas de import no topo do arquivo.

## Sua tarefa
Abra o código do seu site gerado na aula passada, localize um texto da página inicial e troque por um texto seu, direto no código — sem pedir à IA. Salve e confira na prévia.`,
          quiz: [
            {
              prompt: 'Onde, normalmente, ficam os textos do site no código gerado?',
              options: ['Junto das páginas', 'Em um aplicativo separado', 'No domínio'],
              correctIndex: 0,
              explanation: 'O conteúdo costuma viver nas páginas — o mesmo texto que aparece na tela está entre aspas no arquivo.',
            },
            {
              prompt: 'Por que trocar um texto pequeno direto no código pode ser melhor que pedir à IA?',
              options: ['Porque é imediato e não gasta crédito com pedido simples', 'Porque a IA não sabe escrever', 'Porque muda o endereço do site'],
              correctIndex: 0,
              explanation: 'Mudanças pequenas e localizadas você mesmo faz em segundos; a IA fica para o que exige construção.',
            },
            {
              prompt: 'Em um projeto gerado, o mesmo botão usado em várias páginas costuma ser:',
              options: ['Um componente reutilizável', 'Copiado à mão em cada página', 'Uma imagem'],
              correctIndex: 0,
              explanation: 'Componente é bloco reutilizável: mudou em um lugar, muda em todas as páginas onde aparece.',
            },
          ],
        },
      ],
    },
    {
      title: 'Módulo 2 · Refinando e publicando',
      description:
        'O método de iteração que separa amador de pro, textos e imagens gerados com IA e a publicação com SEO básico para o mundo encontrar você.',
      lessons: [
        {
          title: 'Iterando como um profissional',
          description:
            'Pedidos de mudança que funcionam, o formato certo de reportar bug à IA e por que iterações pequenas batem o prompt gigante.',
          durationMin: 14,
          content: `A diferença entre quem briga com a IA e quem produz com a IA está no formato do pedido. Esta aula te dá o método de iteração que você vai usar no resto do curso — e provavelmente da carreira.

## Anatomia de um pedido que funciona
Um bom pedido de mudança tem três partes:
1. **Onde**: "na seção de projetos", "no botão do formulário".
2. **O quê**: a mudança concreta — "troque o texto por Quero meu orçamento".
3. **Referência e comportamento**: como deve ficar ou agir — "centralizado, verde, e ao clicar rola até o formulário".
Compare "melhora o botão" (a IA chuta) com "no botão de contato, troque o texto para Quero meu orçamento e deixe-o fixo no fim da página" (a IA acerta). A segunda forma é mais longa e dez vezes mais rápida.

## Uma mudança por vez
Parece lento, mas é a regra de ouro. Quando você empilha 5 pedidos num único prompt, duas coisas acontecem: a IA ignora parte (e você não sabe qual) ou aplica tudo e algo quebrou (e você não sabe o quê). Mudança por mudança, você isola o efeito: se algo quebrar, você sabe exatamente qual pedido causou e como reverter.

## Reportando bug à IA
Quando algo quebra, o relatório tem duas linhas obrigatórias:
- **O que acontece**: "no celular, o menu não abre ao tocar".
- **O que deveria acontecer**: "ao tocar no ícone, o menu deve abrir com os links".
Esse formato — comportamento atual versus esperado — é o mesmo que profissionais usam em times de software, e a IA responde muito melhor a ele do que a "está bugado, conserta".

## Por que pequeno bate gigante
O prompt gigante tenta acertar tudo de primeira e erra tudo pela metade. Pequenas iterações criam um loop de confiança: pedido claro, resultado visível, próximo pedido. Você sempre sabe o estado do site — nada de surpresa acumulada. No fim do dia, o método pequeno entrega mais em menos tempo, porque você não perde horas descobrindo qual dos 12 pedidos quebrou o formulário.

## Sua tarefa
Pegue as 3 mudanças que você mais deseja no seu site agora e reescreva cada uma no formato onde + o quê + comportamento. Aplique-as uma por vez, conferindo a prévia entre cada pedido.`,
          quiz: [
            {
              prompt: 'Qual é o formato de um bom pedido de mudança?',
              options: ['Onde + o quê + referência ou comportamento esperado', 'Uma palavra-chave', 'Um parágrafo com 10 pedidos juntos'],
              correctIndex: 0,
              explanation: 'Localizar, especificar e descrever o comportamento: a IA acerta porque entende o resultado desejado.',
            },
            {
              prompt: 'Ao reportar um bug à IA, as duas linhas obrigatórias são:',
              options: ['O que acontece e o que deveria acontecer', 'Seu nível de frustração e um print', 'O preço do site e o prazo'],
              correctIndex: 0,
              explanation: 'Comportamento atual versus esperado é o formato profissional — e o que a IA interpreta melhor.',
            },
            {
              prompt: 'Por que uma mudança por vez bate o prompt gigante?',
              options: ['Porque isola o efeito de cada pedido e facilita reverter o que quebrou', 'Porque a IA lê menos texto', 'Porque prompts grandes custam mais'],
              correctIndex: 0,
              explanation: 'Com mudanças isoladas, você sempre sabe o estado do site e qual pedido causou qualquer problema.',
            },
          ],
        },
        {
          title: 'Textos e imagens do site gerados por IA',
          description:
            'Copywriting que faz o visitante agir, geração de imagens e logo com IA e o detalhe de acessibilidade que quase todo mundo esquece.',
          durationMin: 16,
          content: `Design bom com texto ruim não leva a lugar nenhum. Nesta aula você aprende a escrever as palavras do site (copywriting) e a gerar as imagens com IA — incluindo o detalhe de acessibilidade que quase todo mundo esquece.

## Copywriting: menos palavras, mais decisão
O visitante decide em segundos. A estrutura que funciona:
- **Headline clara**: diga o que é e para quem. "Sites rápidos para pequenos negócios" bate "transformando ideias em realidade digital" — específico vence poético.
- **Subheadline com benefício**: o que a pessoa ganha ao continuar na página.
- **Prova logo abaixo**: um projeto, um depoimento, um resultado.
- **Um CTA único**: um botão principal por página. Dois CTAs competindo significa nenhum clicado.
Dica de ouro: peça 5 opções de headline para a IA e escolha a mais direta, não a mais bonita.

## Gerando imagens e logo com IA
Ferramentas de geração de imagem criam banners, ilustrações e uma logo inicial a partir de descrição. Descreva com contexto: "logo minimalista para estudante de engenharia que faz sites, uma letra S estilizada, fundo transparente, azul". Peça variações e refine a melhor. Evite imagem com texto escrito pela IA — ela erra letras; texto entra por cima no site. E lembre: foto de perfil e prints de projetos reais continuam valendo ouro — nada substitui a imagem verdadeira do que você fez.

## Alt text e acessibilidade básica
O **alt text** é a descrição da imagem que leitores de tela leem para quem não vê — e que ajuda os mecanismos de busca a entender a página. Escreva o que a imagem mostra, sem começar com "imagem de": "Equipe do projeto analisando dados em um quadro branco". Complete o básico: contraste bom entre texto e fundo, links com nome claro (nunca "clique aqui"), títulos hierarquizados. Peça para a IA revisar o site com esse checklist — ela sabe implementar cada item.

## Sua tarefa
Reescreva a headline e a subheadline da sua página inicial (com 5 opções geradas pela IA) e crie uma imagem de destaque ou logo para o site. Ao inserir cada imagem, escreva o alt text dela.`,
          quiz: [
            {
              prompt: 'Qual headline é mais forte para uma página?',
              options: ['Transformando ideias em realidade digital', 'Sites rápidos para pequenos negócios', 'Bem-vindo ao meu site'],
              correctIndex: 1,
              explanation: 'Específico vence poético: a headline clara diz o que é e para quem é.',
            },
            {
              prompt: 'Quantos CTAs principais uma página deve ter?',
              options: ['Um', 'Dois, para dividir a atenção', 'Um em cada parágrafo'],
              correctIndex: 0,
              explanation: 'Um CTA único: dois botões competindo significa que a pessoa não clica em nenhum.',
            },
            {
              prompt: 'O que é alt text?',
              options: ['A descrição da imagem para leitores de tela e buscadores', 'O texto alternativo do menu', 'Uma fonte alternativa'],
              correctIndex: 0,
              explanation: 'Alt text descreve a imagem para quem não vê — e ajuda os buscadores a entender a página.',
            },
          ],
        },
        {
          title: 'Publicando seu site',
          description:
            'Publicar no Lovable, subdomínio grátis versus domínio próprio em linhas gerais e o SEO on-page que a IA resolve para você.',
          durationMin: 15,
          content: `Site que não está no ar não existe. Publicar hoje é um processo de minutos — e os cuidados de visibilidade (SEO) valem desde a primeira versão.

## Publicando no Lovable
No Lovable o caminho é direto: você pede a publicação e a ferramenta coloca o site no ar, gerando um **endereço gratuito** próprio do projeto. Atualizar depois é igualmente simples: cada mudança aprovada pode ser republicada em segundos, e o site vai ganhando versões — como um documento que você salva.

## Domínio próprio: quando e por quê
O subdomínio gratuito resolve para começar e para o projeto do curso. O **domínio próprio** ("seunome.com.br") é o próximo passo quando o site vira endereço profissional: currículo, cartão, bio do Instagram. Em linhas gerais, você registra o nome em um registrador (há um custo anual) e conecta à hospedagem da ferramenta — o assistente de publicação guia a configuração. Escolha nome curto, sem hífen, fácil de falar no telefone.

## SEO on-page: o básico que a IA resolve
SEO é fazer sua página entendível para buscadores. Os quatro itens de on-page que mais importam:
- **Título da página**: o que aparece na aba e no resultado de busca. Nome do que você faz + seu nome ou projeto: "Maria Souza — Design de Interfaces".
- **Descrição**: 1-2 frases que aparecem abaixo do título na busca. Peça para a IA escrever com a palavra-chave do seu conteúdo.
- **Títulos H1 e H2**: um H1 por página (o tema principal) e H2 para as seções. A IA já faz isso quando você pede a estrutura correta — vale conferir.
- **Open Graph**: as informações que aparecem quando alguém compartilha seu link no WhatsApp — título, descrição e imagem de prévia. Sem isso, o link compartilhado parece quebrado.
Pedido pronto: "revise o SEO on-page do site: título, descrição, hierarquia de títulos e Open Graph de cada página".

## Sua tarefa
Publique seu site, copie o link e compartilhe no WhatsApp para ver a prévia. Peça à IA para preencher título, descrição e Open Graph — e compartilhe de novo para conferir a diferença.`,
          quiz: [
            {
              prompt: 'Qual é a diferença entre subdomínio gratuito e domínio próprio?',
              options: ['O próprio é um endereço registrado no seu nome (com custo anual); o gratuito usa o endereço da ferramenta', 'Não há diferença', 'O gratuito é mais rápido'],
              correctIndex: 0,
              explanation: 'Domínio próprio profissionaliza o endereço; o subdomínio gratuito serve perfeitamente para começar.',
            },
            {
              prompt: 'O que é Open Graph?',
              options: ['As informações de prévia (título, descrição, imagem) quando o link é compartilhado', 'Um tipo de menu', 'O gráfico de visitas do site'],
              correctIndex: 0,
              explanation: 'Open Graph controla como o link aparece em compartilhamentos — sem ele, a prévia sai quebrada.',
            },
            {
              prompt: 'Quantos H1 deve ter cada página?',
              options: ['Um', 'Um por seção', 'Nenhum'],
              correctIndex: 0,
              explanation: 'Um H1 por página declara o tema principal; as seções usam H2 e abaixo.',
            },
          ],
        },
      ],
    },
    {
      title: 'Módulo 3 · Site de apresentação de projetos',
      description:
        'Transforme seu projeto, portfólio ou TCC em uma página que impressiona banca, recrutador e cliente — com estrutura profissional de storytelling.',
      lessons: [
        {
          title: 'A anatomia de uma página de projeto que impressiona',
          description:
            'A sequência hero, problema e solução, resultados, equipe e contato — aplicada a projeto de extensão, TCC aplicado e ideia de startup.',
          durationMin: 18,
          content: `Um projeto bem contado abre portas: banca, bolsa, estágio, cliente. A boa notícia: a estrutura de uma página que impressiona é sempre a mesma — e a IA monta cada bloco quando você sabe descrevê-lo.

## A sequência que funciona
- **Hero com proposta de valor**: título direto do que é o projeto e para quem. "Plataforma que conecta doadores a pets resgatados" vale mais que "inovação e tecnologia a favor do bem".
- **Problema e depois solução**: em duas dobras, mostre a dor real (com um cenário concreto) e como o projeto resolve. É storytelling: primeiro a tensão, depois o alívio.
- **Resultados com números reais do projeto**: quantas pessoas usaram, quantas doações aconteceram, quanto tempo economizou. Números do SEU projeto — não invente, meça. Sem números ainda? Mostre o estágio com honestidade: "protótipo testado com 3 usuários" é resultado.
- **Equipe**: rostos, nomes e o papel de cada um. Página de projeto sem rosto parece escrita por fantasma.
- **Contato**: um CTA claro no fim — e-mail, formulário ou botão de mensagem.

## Três casos, uma mesma anatomia
- **Projeto de extensão**: destaque o público atendido e o antes e depois da comunidade.
- **TCC aplicado**: destaque a pergunta de pesquisa, o método em uma dobra e o achado principal.
- **Ideia de startup**: destaque o tamanho do problema, o piloto e um CTA de lista de espera.

## Pedindo à IA
Dê a ela a matéria-prima: o que é o projeto, para quem, o que foi feito e os números reais que você tem. Depois peça: "estruture a página nas seções hero, problema e solução, resultados, equipe e contato, usando o conteúdo que enviei". IA estruturando conteúdo real seu gera página com cara de profissional, sem invenção — e você continua sendo a fonte da verdade.

## Sua tarefa
Escolha um projeto seu e escreva a linha de cada seção da anatomia: título do hero, o problema, a solução e os 2-3 números ou estágios reais que você pode mostrar hoje.`,
          quiz: [
            {
              prompt: 'Qual é a primeira seção de uma página de projeto e o que ela carrega?',
              options: ['O hero, com a proposta de valor direta', 'A equipe completa', 'Os agradecimentos'],
              correctIndex: 0,
              explanation: 'O hero declara em uma frase o que é o projeto e para quem — específico vence genérico.',
            },
            {
              prompt: 'Sobre os números de resultados da página:',
              options: ['Devem ser números reais medidos do seu projeto — ou o estágio honesto atual', 'Devem ser estimativas impressionantes', 'Devem ser copiados de outros sites'],
              correctIndex: 0,
              explanation: 'Números inventados destroem credibilidade; estágio honesto ("protótipo testado") é resultado legítimo.',
            },
            {
              prompt: 'A ordem de storytelling da página é:',
              options: ['Primeiro o problema, depois a solução', 'Primeiro a solução, depois o problema', 'Só os resultados'],
              correctIndex: 0,
              explanation: 'Primeiro a tensão (problema real), depois o alívio (como o projeto resolve) — o leitor se reconhece.',
            },
          ],
        },
        {
          title: 'Portfólio de estudante que abre portas',
          description:
            'As páginas essenciais, o formato de case por projeto (contexto, o que você fez, resultado) e as provas sociais que dão credibilidade.',
          durationMin: 16,
          content: `Recrutador e professor olham seu portfólio por minutos. O portfólio de estudante que abre portas não é o mais bonito — é o que responde rápido três perguntas: quem é você, o que você sabe fazer e como falar com você.

## As páginas essenciais
- **Sobre**: quem você é, o que estuda ou faz e o que busca — em 3 parágrafos curtos. Foto real, tom humano.
- **Projetos**: a estrela do site. De 3 a 5 trabalhos bem contados valem mais que 15 apenas listados.
- **Habilidades**: simples e honesto — o que você domina e o que está aprendendo. Auto-declarar "expert" em 12 coisas soa falso.
- **Contato**: e-mail ou formulário visível em todo o site (o rodapé resolve).

## Case por projeto: o formato que vale
Cada projeto segue o mesmo esqueleto:
1. **Contexto**: por que o projeto existiu (disciplina, estágio, iniciativa própria).
2. **O que você fez**: seu papel real, com verbos no passado — "estruturei", "desenvolvi", "entrevistei". Em equipe, diga qual parte foi sua.
3. **Resultado**: o que aconteceu — entregável, número, aprendizado.
Esse formato transforma "participei de um projeto" em evidência de competência. É a diferença entre listar e provar.

## Provas sociais
- **Certificados**: seção própria com os principais, com link de verificação quando houver.
- **Depoimentos**: 1-2 frases de professor, orientador ou colega de equipe. Peça por mensagem — quase todo mundo aceita escrever três linhas.
- **Links**: GitHub, Behance, LinkedIn, artigo publicado. Perfil parado remove prova em vez de somar; escolha os que estão vivos.

## Montando com IA
Gere o site com essas páginas e alimente cada case com material real seu (descrição, prints, resultado). Depois peça revisão de tom: "deixe o texto do Sobre mais direto, em primeira pessoa, tom profissional e humano".

## Sua tarefa
Escreva o texto da página Sobre (3 parágrafos) e o esqueleto de um case completo de um projeto seu, no formato contexto + o que você fez + resultado.`,
          quiz: [
            {
              prompt: 'Quais são as páginas essenciais de um portfólio de estudante?',
              options: ['Sobre, projetos, habilidades e contato', 'Galeria de fotos e blog', 'Loja e perguntas frequentes'],
              correctIndex: 0,
              explanation: 'Quem é você, o que sabe fazer e como falar com você — as três perguntas que o portfólio responde.',
            },
            {
              prompt: 'O formato de case por projeto é:',
              options: ['Contexto + o que você fez + resultado', 'A lista de ferramentas usadas', 'Só as imagens finais'],
              correctIndex: 0,
              explanation: 'Contexto, papel real e resultado transformam "participei" em evidência de competência.',
            },
            {
              prompt: 'Sobre provas sociais, o mais forte é:',
              options: ['Certificados, depoimentos e links vivos e atualizados', 'Auto-declarar 15 especialidades', 'Um contador de visitantes'],
              correctIndex: 0,
              explanation: 'Prova social é terceiro confirmando você — certificado, depoimento e perfil ativo fazem isso.',
            },
          ],
        },
        {
          title: 'Um site para o seu TCC ou pesquisa',
          description:
            'Resumo visual, metodologia em fluxo, download do PDF e QR Code para o pôster — o upgrade mais simples e mais ignorado do currículo.',
          durationMin: 17,
          content: `Seu TCC passa anos dentro de um arquivo que quase ninguém abre. Colocá-lo na web é o upgrade mais simples e mais ignorado do currículo — e serve na banca, para recrutadores que pesquisam seu nome e para o público leigo interessado no tema.

## O que a página do TCC tem
- **Resumo visual**: o trabalho resumido em uma dobra — o problema, a pergunta e a resposta principal em linguagem que leigos entendem. Escreva a versão "conte para sua avó" do seu resumo acadêmico.
- **Metodologia em fluxo**: os passos do estudo como uma sequência visual (coleta, análise, conclusões). Fluxo prende mais que parágrafo denso — e demonstra rigor sem exigir que leiam tudo.
- **Download do PDF**: o trabalho completo, com o link direto e claro na página.
- **QR Code para o pôster ou banner**: gerar um QR Code apontando para a página é gratuito — cole no pôster, no banner da defesa e nos slides. A banca escaneia; a página vira diferencial na hora da apresentação.
- **Autor e contato**: seu nome, instituição, orientador e um meio de contato.

## Como isso diferencia
Na defesa, você apresenta um trabalho com presença digital: enquanto os colegas mostram PDF, você abre o site no projetor — resumo visual, fluxo do método e QR Code no pôster. No currículo, o link transforma "TCC sobre X" em evidência navegável que qualquer pessoa pode checar. E para o tema alcançar gente fora da universidade, é o único caminho real: ninguém baixa uma dissertação, mas todo mundo lê uma página de 5 minutos.

## Construindo com IA
Alimente a IA com: título, resumo, etapas do método, principais achados e o link do PDF. Peça a página com resumo visual em destaque, metodologia em etapas e seção de download. Em seguida, peça a versão leiga do resumo — a IA é excelente traduzindo academicês para português de gente.

## Sua tarefa
Escreva o resumo visual do seu TCC (ou de um trabalho recente): problema, pergunta e resposta principal em até 5 linhas, em linguagem para leigos. Esse texto entrará no hero da página.`,
          quiz: [
            {
              prompt: 'Por que usar QR Code na página do TCC?',
              options: ['Para o pôster, banner e slides levarem qualquer pessoa direto à página do trabalho', 'Para bloquear o acesso', 'Para gerar o PDF'],
              correctIndex: 0,
              explanation: 'O QR conecta o material impresso à página online — a banca escaneia e você sai na frente.',
            },
            {
              prompt: 'Como apresentar a metodologia na web?',
              options: ['Como um fluxo visual em etapas', 'Como um parágrafo denso', 'Escondida no PDF'],
              correctIndex: 0,
              explanation: 'Fluxo em etapas demonstra rigor e prende a atenção — parágrafo denso faz o visitante fugir.',
            },
            {
              prompt: 'O que o resumo visual da página deve conter?',
              options: ['Problema, pergunta e resposta principal em linguagem leiga', 'Todas as referências bibliográficas', 'O cronograma completo'],
              correctIndex: 0,
              explanation: 'É a versão "conte para sua avó" do resumo: o essencial entendível em uma dobra.',
            },
          ],
        },
      ],
    },
    {
      title: 'Módulo 4 · Captura de leads',
      description:
        'Visitante que não deixa contato é visita perdida. Monte funil, formulário e rotina de acompanhamento para transformar visitas em oportunidades.',
      lessons: [
        {
          title: 'O que é lead e por que capturar desde o dia 1',
          description:
            'O funil simples do visitante ao cliente, o que oferecer em troca do contato e exemplos reais de estudante-serviço.',
          durationMin: 13,
          content: `Visitante que sai sem deixar contato é oportunidade perdida para sempre — você não sabe quem foi, nem como falar com ele de novo. Lead é essa ponte: alguém que se interessou o suficiente para deixar nome, e-mail ou telefone.

## O funil simples
- **Visitante**: chegou pelo link do Instagram, do Google ou por indicação.
- **Lead**: deixou o contato em troca de algo de valor.
- **Contato**: você responde, conversa, apresenta o que faz.
- **Cliente ou apoiador**: fecha serviço, entra no projeto, vai à palestra.
Cada etapa perde gente — e é assim mesmo. O trabalho é capturar bem no topo para ter com quem conversar embaixo.

## O que oferecer em troca
Ninguém dá o e-mail de graça. A troca precisa valer:
- **E-book ou guia**: "guia curto para organizar suas finanças no estágio" — material que resolve um problema específico.
- **Mini-aula**: vídeo curto ensinando uma habilidade do seu nicho.
- **Orçamento ou avaliação**: para quem presta serviço, o próprio formulário é a isca — "peça seu orçamento sem compromisso".
- **Lista de espera**: para projeto ou produto ainda em construção — "entre na lista e garanta acesso antecipado".
Regra: a isca resolve UM problema pequeno e imediato do seu público. Grande demais, vira promessa; vaga demais, vira nada.

## Exemplos de estudante-serviço
- Monitor de matemática: mini-aula em vídeo em troca do contato para agendar.
- Estudante de design: guia "como pedir um logo sem sofrer" em troca do e-mail.
- Projeto de extensão: formulário de inscrição para a próxima turma de oficinas.
- TCC aplicado: lista de espera do piloto do seu projeto.

## Por que desde o dia 1
Site sem captura é cartão de visita: olham e somem. Com captura, cada visita vira uma linha na sua lista — e a lista é o que transforma divulgação em conversa. As próximas aulas constroem isso no seu site.

## Sua tarefa
Defina sua isca em uma frase: qual problema pequeno do seu público ela resolve e em qual formato ela existe (e-book, mini-aula, orçamento ou lista de espera).`,
          quiz: [
            {
              prompt: 'No funil simples, quem é o lead?',
              options: ['Quem deixou o contato em troca de algo de valor', 'Qualquer visitante', 'Quem já fechou serviço'],
              correctIndex: 0,
              explanation: 'Lead é o visitante que virou contato — a ponte entre chegar e conversar.',
            },
            {
              prompt: 'Qual destas é uma isca de captura válida?',
              options: ['Uma mini-aula ou guia que resolve um problema pequeno e imediato', 'Um botão Enviar sem contexto', 'Um formulário com 12 campos'],
              correctIndex: 0,
              explanation: 'A isca troca valor pelo contato: específica demais para ignorar, simples demais para assustar.',
            },
            {
              prompt: 'Por que capturar leads desde o dia 1?',
              options: ['Porque sem captura a visita passa e some — com captura ela vira lista para você falar de novo', 'Porque o site fica mais bonito', 'Porque o domínio exige'],
              correctIndex: 0,
              explanation: 'A lista de contatos é o que transforma divulgação pontual em conversa recorrente.',
            },
          ],
        },
        {
          title: 'Formulários que convertem',
          description:
            'Campos mínimos, CTA visível acima da dobra, prova social ao lado do formulário e o teste do celular primeiro.',
          durationMin: 15,
          content: `O formulário é a porta de entrada da sua lista. A boa notícia: a IA constrói a parte técnica — o que decide se as pessoas preenchem é o design do pedido.

## As regras que convertem
- **Campos mínimos**: nome e e-mail (ou e-mail e WhatsApp). Cada campo extra derruba o preenchimento — telefone, cidade e "como nos conheceu" só quando você realmente usará a informação.
- **CTA visível acima da dobra**: o botão principal precisa aparecer sem rolar no celular. Se o formulário só existe no pé da página, coloque também um botão no topo que rola até ele.
- **Prova social perto do formulário**: uma frase ao lado, com número real medido por você — "X pessoas já baixaram o guia" — ou um depoimento curto.
- **Texto do botão específico**: "Receber o guia" converte mais que "Enviar". O botão deve lembrar o que a pessoa ganha.
- **Frase de segurança**: um "sem spam, você pode sair quando quiser" abaixo do botão reduz o medo.

## Criando o formulário com IA
No Lovable, o pedido direto funciona: "adicione um formulário de captura de lead com nome e e-mail, título Receba o guia gratuito, botão verde Receber o guia, e um texto pequeno abaixo dizendo que não enviamos spam. Coloque o formulário logo após a seção de benefícios". Depois peça a mensagem de confirmação para quando o envio funcionar. Se algo sair estranho, relembre o método: onde + o quê + comportamento esperado.

## O teste do celular primeiro
A maioria das visitas ao seu site virá de links em conversas e redes sociais — ou seja, do celular. Teste sempre no celular primeiro:
- O formulário aparece sem rolar?
- Os campos são grandes para o dedo?
- O teclado atrapalha o botão de enviar?
Peça o ajuste específico: "no celular, o formulário está cortado — ajuste a seção para aparecer inteira com o botão alcançável".

## Sua tarefa
Adicione o formulário de captura ao seu site com campos mínimos e CTA específico, e abra-o no celular conferindo três pontos: visível acima da dobra, campos confortáveis e botão acessível.`,
          quiz: [
            {
              prompt: 'Quais são os campos mínimos para um formulário de captura?',
              options: ['Nome e e-mail (ou e-mail e WhatsApp)', 'Nome, e-mail, telefone, cidade, documento e mensagem', 'Só o telefone'],
              correctIndex: 0,
              explanation: 'Cada campo extra derruba o preenchimento — peça só o que você vai usar.',
            },
            {
              prompt: 'O que significa CTA acima da dobra?',
              options: ['O botão principal aparece sem rolar a página no celular', 'O botão fica no rodapé', 'O botão pisca para chamar atenção'],
              correctIndex: 0,
              explanation: 'Acima da dobra é o que a tela mostra sem rolar — onde a decisão acontece.',
            },
            {
              prompt: 'Qual texto de botão tende a converter mais?',
              options: ['Receber o guia', 'Enviar', 'Clique aqui'],
              correctIndex: 0,
              explanation: 'O botão específico lembra o que a pessoa ganha; "Enviar" não promete nada.',
            },
          ],
        },
        {
          title: 'Para onde vão os leads: e-mail, planilha e WhatsApp',
          description:
            'Conectar o formulário a e-mail e planilha, criar a página de obrigado e organizar a rotina semanal de acompanhamento sem CRM pago.',
          durationMin: 16,
          content: `Formulário sem destino é caixa-preta: o lead envia e... nada acontece. Esta aula conecta seu formulário a lugares que você já usa — sem pagar por ferramenta complexa.

## Para onde enviar os leads
- **E-mail**: serviços de integração de formulários (como o **Formspree** e similares) recebem os envios do seu site e entregam no seu e-mail — em geral com plano gratuito para volume pequeno. Você conecta o endereço gerado ao formulário e pronto: cada lead chega na sua caixa de entrada.
- **Planilha**: integrações simples (ou o próprio serviço de formulário) registram cada lead em uma planilha online — sua lista vira tabela ordenável com nome, contato e data.
- **WhatsApp**: para público de serviço, adicione um botão flutuante de WhatsApp com mensagem pré-preenchida ("Olá! Vim pelo site"). Lead que prefere conversa vai direto ao ponto.
Peça à IA: "conecte o formulário a um serviço de envio por e-mail usando integração de formulários, conforme a documentação, e me mostre onde configuro o e-mail de destino".

## A página de obrigado
Depois de enviar, o lead deve aterrissar em uma **página de obrigado** — nunca no site simplesmente recarregando. Nela: confirmação ("recebemos seu contato"), o que acontece agora ("o guia chega no seu e-mail em poucos minutos") e um próximo passo (seguir no Instagram, agendar conversa). É onde nasce a confiança — e onde você pode pedir a segunda ação.

## Rotina semanal de acompanhamento
CRM pago é para times grandes. Para começar, uma rotina de 15 minutos por semana resolve:
1. Abra a planilha ou a caixa de entrada e veja os novos leads.
2. Responda cada um no mesmo dia da rotina — lead esfriando é lead perdido.
3. Anote o status ao lado do nome: respondido, conversando, fechou.
4. Uma vez por mês, retome quem ficou no meio do caminho.
Constância bate ferramenta: lista acompanhada toda semana rende mais que software caro aberto uma vez por mês.

## Sua tarefa
Conecte seu formulário a um destino (e-mail via serviço de integração), crie a página de obrigado com um próximo passo, e marque na agenda a sua rotina semanal de resposta aos leads.`,
          quiz: [
            {
              prompt: 'Qual é o papel de um serviço como o Formspree?',
              options: ['Receber os envios do formulário do site e entregar no seu e-mail, com plano gratuito para volume pequeno', 'Criar logos', 'Registrar domínios'],
              correctIndex: 0,
              explanation: 'É a ponte entre o formulário e o seu e-mail — sem servidor próprio nem ferramenta paga no começo.',
            },
            {
              prompt: 'Por que a página de obrigado importa?',
              options: ['Confirma o envio, diz o que acontece agora e oferece o próximo passo — ali nasce a confiança', 'Porque substitui o formulário', 'Porque é obrigatória para o SEO'],
              correctIndex: 0,
              explanation: 'Obrigado sem destino deixa o lead perdido; a página transforma envio em relação.',
            },
            {
              prompt: 'Na rotina semanal sem CRM pago, o essencial é:',
              options: ['Responder todos os novos leads no mesmo dia e anotar o status de cada um', 'Abrir a planilha uma vez por semestre', 'Comprar um software caro'],
              correctIndex: 0,
              explanation: 'Constância semanal de resposta e registro vence qualquer ferramenta abandonada.',
            },
          ],
        },
      ],
    },
    {
      title: 'Módulo 5 · Projeto final: do briefing ao ar',
      description:
        'Do briefing ao ar: você constrói, testa e lança o site do SEU projeto com captura de leads funcionando — e sai sabendo cobrar por esse serviço.',
      lessons: [
        {
          title: 'Briefing: definindo o site do SEU projeto',
          description:
            'O template de briefing de uma página que evita o retrabalho e a escolha consciente da ferramenta certa para o seu caso.',
          durationMin: 15,
          content: `Projeto final começando. Antes de abrir qualquer ferramenta, você responde as perguntas que evitam a maior parte do retrabalho. Briefing de uma página, resultado de semanas economizadas.

## O template de briefing (copie e preencha)
- **Objetivo**: o que o site deve provocar? (recrutador me chamar, cliente pedir orçamento, banca escanear o QR)
- **Público**: quem chega e por qual link (Instagram, WhatsApp, currículo).
- **Seções**: a lista mínima necessária para o objetivo — não a lista máxima possível.
- **CTA principal**: a ÚNICA ação que você quer (baixar o guia, preencher o formulário, enviar mensagem).
- **Conteúdo pronto**: textos, imagens, links e números reais que você já tem.
- **Referências**: 2 sites que você admira e O QUE admira em cada um.
- **Isca de lead**: o que a pessoa ganha ao deixar o contato.
Uma página escrita e preenchida. É esse documento que você cola para a IA — briefing bem preenchido já é meio prompt pronto.

## Escolhendo a ferramenta certa
- **Lovable**: site de apresentação, portfólio ou página de projeto com formulário — o caso da maioria neste curso.
- **z.ai**: seu projeto precisa de algo além da página — cadastro, dados salvos, painel simples.
- **Claude Code**: você quer o projeto no seu computador, com controle total dos arquivos, ou evoluir algo que já existe.
Decida pelo objetivo do briefing, não pela ferramenta mais nova. Ferramenta errada com briefing bom sai na frente de ferramenta certa com briefing vazio — porque o conteúdo e a estrutura são o difícil, e a ferramenta é o meio.

## O contrato do projeto final
Nas próximas 3 aulas você constrói o site completo do SEU projeto. O critério de entrega é objetivo: **site ao vivo, com captura de leads funcionando e checklist de lançamento concluído**. Não é o site dos sonhos — é o site que trabalha.

## Sua tarefa
Preencha o seu briefing completo (as 7 linhas) e marque qual ferramenta vai usar, com uma frase justificando a escolha pelo objetivo do projeto.`,
          quiz: [
            {
              prompt: 'O que vem primeiro no projeto final?',
              options: ['O briefing preenchido', 'Escolher a cor do site', 'Publicar'],
              correctIndex: 0,
              explanation: 'Briefing preenchido é meio prompt pronto — e evita semanas de retrabalho.',
            },
            {
              prompt: 'Como escolher entre Lovable, z.ai e Claude Code?',
              options: ['Pelo objetivo do briefing: visual simples, fullstack com dados, ou controle total dos arquivos', 'Pela ferramenta mais nova', 'Pela mais barata, sempre'],
              correctIndex: 0,
              explanation: 'O objetivo define a ferramenta — não a moda do momento.',
            },
            {
              prompt: 'Quantos CTAs principais o briefing deve definir?',
              options: ['Um — a única ação que você quer', 'Um por seção', 'Nenhum'],
              correctIndex: 0,
              explanation: 'Um objetivo, um CTA: o site que quer tudo não pede nada com clareza.',
            },
          ],
        },
        {
          title: 'Build assistido: do prompt ao site completo',
          description:
            'A sessão guiada de construção, a ordem que funciona e os 3 erros clássicos (pedidos vagos, mudanças juntas, ignorar mobile) com a saída de cada um.',
          durationMin: 24,
          content: `Aula de construção real: do briefing pronto ao site completo, seguindo a ordem que funciona e desviando dos três erros clássicos. Reserve o tempo da aula e construa junto.

## A ordem de construção (não invente outra)
1. **Gere a estrutura inteira** com o briefing: um prompt de lançamento com objetivo, público, seções, estilo e CTA (aula 3).
2. **Rode no celular** antes de embelezar: se a base quebra no celular, corrija agora — é o erro mais caro de deixar para depois.
3. **Conteúdo real em todas as seções**: seus textos, seus projetos, suas imagens, seus números. Nenhum texto de exemplo sobrevivendo.
4. **Formulário e destino**: captura de lead conectada a e-mail ou planilha, com página de obrigado (aulas 12 e 13).
5. **SEO on-page**: título, descrição e Open Graph (aula 7).
6. **Acabamento**: espaçamentos, consistência de botões, alt text nas imagens.
Itere uma mudança por vez (aula 5) e confira a prévia entre cada pedido — 5 segundos que evitam 20 minutos de conserto.

## Os 3 erros clássicos e a saída
- **Pedidos vagos** ("deixa moderno"): a saída é sempre especificar onde + o quê + comportamento.
- **Muitas mudanças juntas**: a saída é uma por vez; anote as demais num bloco para a fila.
- **Ignorar o mobile**: a saída é testar no celular a cada bloco concluído, pedindo ajustes de quebra de linha, tamanho de botão e imagem.
Errou feio e o site saiu do controle? Reverta para a última versão boa e reaplique a última mudança isolada. É por isso que a regra de uma mudança por vez existe.

## Quando travar
Peça para a IA diagnosticar: "o formulário não está enviando. Liste as possíveis causas e o que você precisa que eu confirme". IA pedindo informação de volta é você aprendendo o sistema — não um sinal de fracasso.

## Sua tarefa
Execute a sessão de build completa: estrutura, teste mobile, conteúdo real, formulário com destino e SEO. Registre quantas iterações usou e qual erro clássico você cometeu (todos cometemos pelo menos um).`,
          quiz: [
            {
              prompt: 'Qual é a ordem de construção recomendada?',
              options: ['Estrutura, teste mobile, conteúdo real, formulário, SEO e acabamento', 'Acabamento, estrutura, conteúdo', 'Publicar, construir, testar'],
              correctIndex: 0,
              explanation: 'Base que funciona antes de beleza: mobile cedo, conteúdo real no meio, acabamento no fim.',
            },
            {
              prompt: 'O site saiu do controle após várias mudanças. O que fazer?',
              options: ['Reverter para a última versão boa e reaplicar a última mudança isolada', 'Apagar tudo e recomeçar', 'Deixar como está'],
              correctIndex: 0,
              explanation: 'Reverter a um ponto bom e reaplicar isolado é o conserto mais rápido — e a lição para não repetir.',
            },
            {
              prompt: 'Qual dos três erros clássicos de build?',
              options: ['Ignorar o mobile', 'Testar no celular', 'Iterar uma mudança por vez'],
              correctIndex: 0,
              explanation: 'Mobile ignorado é o erro mais caro — a maioria das visitas vem de lá.',
            },
          ],
        },
        {
          title: 'Checklist de lançamento',
          description:
            'A revisão final item por item — celular, links, formulário, SEO, velocidade e ortografia — e o teste das 5 pessoas antes de divulgar.',
          durationMin: 14,
          content: `O site está quase no ar. A diferença entre "parece pronto" e "está pronto" é este checklist — minutos de verificação que protegem a sua primeira impressão.

## O checklist (rode na ordem)
- **Celular**: abra o link no seu telefone. Hero inteiro? Menu funciona? Formulário aparece? Botões do tamanho do dedo?
- **Todos os links testados**: clique em cada um — menu, botões, rodapé, redes sociais, download do PDF. Link morto na página inicial mata a credibilidade.
- **Formulário recebendo**: envie um teste e confira a chegada no e-mail ou planilha, e a página de obrigado.
- **SEO básico**: título e descrição preenchidos, um H1 por página, Open Graph aparecendo quando o link é compartilhado.
- **Velocidade**: as páginas abrem rápido no celular? Imagens gigantes são o suspeito número 1 — peça à IA para otimizar.
- **Ortografia**: leia todos os textos em voz alta (ou peça à IA para revisar). Erro de português no site de quem "faz sites" é desclassificante.

## O teste das 5 pessoas
Antes de divulgar de verdade, mostre o link para **5 pessoas reais** — e não para quem vai elogiar. Escolha gente do seu público-alvo: um professor, um colega do curso, alguém da área que você admira. Faça três perguntas e ouça sem defender:
1. O que você entendeu que este site oferece?
2. O que você faria depois de olhar? (veja se chegam ao CTA)
3. Onde você travou?
Se 2 ou mais pessoas travarem no mesmo lugar, é bug de design — peça à IA o ajuste específico. Lançar com feedback de 5 é melhor que lançar bonito para o vazio.

## Depois do checklist
Publique a versão final, conte as iterações que o teste gerou (é métrica do seu processo) e só então divulgue nas redes, na bio e nos grupos. Site testado suporta o pico de visitas da divulgação sem passar vergonha.

## Sua tarefa
Rode o checklist completo e corrija tudo que falhar. Depois mande o link para 5 pessoas e anote as respostas delas às 3 perguntas do teste.`,
          quiz: [
            {
              prompt: 'Antes de divulgar, quantas pessoas reais devem dar feedback?',
              options: ['5, de preferência do seu público-alvo', 'Nenhuma', '100'],
              correctIndex: 0,
              explanation: 'Cinco olhos reais pegam o que seus olhos acostumados não veem mais.',
            },
            {
              prompt: 'No checklist, o primeiro teste é:',
              options: ['Abrir o site no celular e conferir hero, menu e formulário', 'Mudar a logo', 'Comprar um domínio novo'],
              correctIndex: 0,
              explanation: 'Celular primeiro: é de lá que vêm as visitas — e os problemas.',
            },
            {
              prompt: 'Se 2 ou mais pessoas travarem no mesmo lugar:',
              options: ['É bug de design — peça o ajuste específico à IA', 'É culpa delas', 'Pode ignorar, é detalhe'],
              correctIndex: 0,
              explanation: 'Padrão repetido de travamento é problema real de usabilidade, não coincidência.',
            },
          ],
        },
        {
          title: 'Projeto final e próximos passos',
          description:
            'A entrega do site ao vivo com captura funcionando, os próximos níveis (dashboard, automações) e como transformar essa habilidade em serviço cobrável.',
          durationMin: 18,
          content: `Última aula da trilha — e a única que termina com o seu trabalho publicado. Aqui você entrega o projeto final, entende os próximos níveis e aprende a transformar essa habilidade em renda.

## A entrega do projeto final
O critério é objetivo e vale o que você construiu:
- **Site ao vivo** do SEU projeto (portfólio, página de apresentação ou TCC).
- **Captura de leads funcionando**: formulário, destino (e-mail ou planilha) e página de obrigado.
- **Checklist de lançamento concluído**, incluindo o teste das 5 pessoas.
- **Briefing anexado** — ele mostra o processo, e processo é o que se cobra.
Envie o link do site mais o briefing. Não pedimos o site perfeito: pedimos o site **funcionando**.

## Próximos níveis
Com o site rodando, o caminho natural é:
- **Dashboard de leads**: um painel onde seus contatos aparecem organizados — aqui entram o z.ai e o back-end de verdade.
- **Automações**: resposta automática ao novo lead e envio do e-book sem você mexer.
- **Mais páginas**: blog do projeto, página por serviço, outra versão de idioma.
- **Medição**: entender de onde vêm as visitas e o que elas fazem no site.

## Como cobrar por esse serviço
Você agora domina o processo completo: briefing, build com IA, publicação e captura de leads. Esse processo é o produto. Para começar:
- **Primeiro cliente**: alguém do seu círculo com negócio ou projeto — cobre pelo resultado (site no ar com formulário), não por hora.
- **Escopo fechado**: número de páginas, número de rodadas de ajuste e prazo combinados antes. Escopo aberto é onde mora o prejuízo.
- **Seu site é a vitrine**: mostre o formulário funcionando, o QR Code do TCC, a página ao vivo — o portfólio vende o serviço.

## Fechamento da Trilha IA para Estudantes
Quatro cursos: fundamentos e uso consciente das IAs (1), produtividade e estudos (2), criação de conteúdo e materiais (3) e agora sites que trabalham por você (4). A promessa da trilha se cumpre quando o que você construiu está no ar, trabalhando enquanto você vive a sua vida. O seu está. Agora é divulgar — e cobrar por isso quando aparecer o próximo pedido.

## Sua tarefa
Entregue o projeto final: link do site ao vivo, briefing preenchido e o comprovante do teste do formulário (print da mensagem recebida). Em seguida, escreva em 3 linhas como apresentaria esse serviço para um primeiro cliente.`,
          quiz: [
            {
              prompt: 'O que compõe a entrega do projeto final?',
              options: ['Site ao vivo + briefing + captura de leads funcionando + checklist concluído', 'Só o link do site', 'Um print do plano no papel'],
              correctIndex: 0,
              explanation: 'O critério é funcionar: site no ar, capturando leads, com processo documentado no briefing.',
            },
            {
              prompt: 'Como definir escopo para o primeiro cliente?',
              options: ['Número de páginas, rodadas de ajuste e prazo combinados antes', 'Cobrar por hora sem limite', 'Prometer tudo o que o cliente pedir'],
              correctIndex: 0,
              explanation: 'Escopo fechado protege os dois lados — escopo aberto é onde mora o prejuízo.',
            },
            {
              prompt: 'Qual é o próximo nível natural depois do site no ar?',
              options: ['Dashboard de leads e automações com back-end', 'Voltar para o papel e caneta', 'Remover o formulário'],
              correctIndex: 0,
              explanation: 'Com a lista crescendo, o painel de leads e as automações são a evolução — território do z.ai.',
            },
          ],
        },
      ],
    },
  ],
}
