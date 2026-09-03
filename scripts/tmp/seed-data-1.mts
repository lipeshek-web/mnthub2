// Cursos de Tecnologia (Carlos, Marina, Gustavo) — 5 novos + 1 recape (Testes e Qualidade)
import type { CourseDef } from './seed-types'

export const techCourses: CourseDef[] = [
  {
    mentorEmail: 'carlos@demo.com',
    title: 'Python do Zero: Automação e Scripts',
    description:
      'Aprenda Python partindo do absoluto zero e termine o curso com robôs práticos rodando no seu computador: organizador de arquivos, leitor de planilhas e tarefas agendadas. Aula por aula, você instala, escreve e executa código de verdade — sem enrolação e com projetos úteis para o trabalho e a vida.',
    category: 'Tecnologia',
    level: 'INICIANTE',
    price: 119,
    coverUrl: '/uploads/seed/course-python.png',
    mentorshipCount: 1,
    themes: [
      {
        title: 'Primeiros passos com Python',
        description: 'Instalação, sintaxe básica e seu primeiro programa rodando.',
        lessons: [
          {
            title: 'Instalando o Python e o VS Code',
            description: 'Prepare o ambiente em Windows, Mac ou Linux em 15 minutos.',
            durationMin: 12,
            content:
              'Nesta aula você vai preparar o ambiente para programar em Python do jeito certo.\n\n## Baixando o Python\nAcesse python.org/downloads e baixe a versão mais recente (3.12 ou superior). No Windows, marque a caixinha "Add Python to PATH" antes de clicar em Install — esse é o erro clássico de quem começa.\n\n## Editor de código\nVamos usar o VS Code (code.visualstudio.com). Depois de instalar, adicione a extensão oficial "Python" da Microsoft: ela dá autocomplete, destaque de erros e botão de executar.\n\n## Verificando a instalação\nAbra o terminal e digite:\n\npython --version\n\nSe aparecer algo como "Python 3.12.x", está tudo pronto. No Mac e Linux o comando pode ser python3.\n\n## Rodando o primeiro código\nCrie um arquivo hello.py com a linha print("Olá, MentorHub!") e execute no terminal:\n\npython hello.py\n\nSe o texto aparecer na tela, parabéns: você já é uma pessoa programadora Python. Na próxima aula vamos entender variáveis e tipos.',
          },
          {
            title: 'Variáveis, tipos e operadores',
            description: 'Os blocos de construção de qualquer programa.',
            durationMin: 15,
            content:
              'Variáveis são caixinhas com nome onde guardamos informações. Em Python você não declara o tipo — só atribui:\n\nnome = "Ana"\nidade = 25\naltura = 1.68\nestudando = True\n\n## Os 4 tipos essenciais\n\n**str** (texto): "Olá" — sempre entre aspas.\n**int** (inteiro): 25.\n**float** (decimal): 1.68.\n**bool** (verdadeiro/falso): True ou False.\n\n## Operadores que você vai usar todo dia\n\nSoma +, subtração -, multiplicação *, divisão / e resto % . O resto é ótimo para descobrir pares: numero % 2 == 0.\n\n## Entrada do usuário\nPara perguntar algo a quem usa o programa:\n\nidade = int(input("Sua idade: "))\nprint(f"Ano que vem você terá {idade + 1} anos")\n\nO f antes das aspas permite colocar variáveis dentro do texto — um recurso que você vai usar em praticamente todos os scripts.',
            quiz: [
              {
                prompt: 'O que imprime o código: x = 7; y = 2; print(x % y)?',
                options: ['3.5', '1', '14', 'Erro'],
                correctIndex: 1,
                explanation: 'O operador % devolve o resto da divisão: 7 dividido por 2 é 3 com resto 1.',
              },
            ],
          },
          {
            title: 'Condicionais e loops',
            description: 'if, else, for e while — as decisões e repetições do código.',
            durationMin: 18,
            content:
              '## Condicionais: tomando decisões\n\nidade = 17\nif idade >= 18:\n    print("Pode dirigir")\nelse:\n    print("Ainda não pode dirigir")\n\nRepare na indentação: em Python, os espaços no início da linha definem o que está dentro do if. Use sempre 4 espaços.\n\nPara mais de duas situações, use elif:\n\nnota = 85\nif nota >= 90:\n    print("A")\nelif nota >= 70:\n    print("B")\nelse:\n    print("Estude mais")\n\n## Loops: repetindo trabalho\n\nO for percorre listas e intervalos:\n\nfor numero in range(1, 6):\n    print(numero)  # 1, 2, 3, 4, 5\n\nO while repete enquanto a condição for verdadeira:\n\ntentativas = 0\nwhile tentativas < 3:\n    print("Tentando...")\n    tentativas += 1\n\n## Checklist da aula\n\n1. Escreva um programa que diga se um número é par ou ímpar.\n2. Faça um contador de 10 até 1 com while.\n3. Imprima a tabuada do 7 com for.',
          },
        ],
      },
      {
        title: 'Automação no dia a dia',
        description: 'Arquivos, planilhas e web — os três alvos favoritos da automação.',
        lessons: [
          {
            title: 'Manipulando arquivos e pastas',
            description: 'os, pathlib e shutil: a caixa de ferramentas de arquivos.',
            durationMin: 20,
            content:
              'Automatizar arquivos é o uso mais imediato de Python no trabalho.\n\n## Listando e criando\n\nfrom pathlib import Path\n\npasta = Path("documentos")\nfor arquivo in pasta.glob("*.pdf"):\n    print(arquivo.name)\n\n## Renomeando em massa\n\nfor i, arquivo in enumerate(pasta.glob("*.jpg"), start=1):\n    novo = pasta / f"foto_{i:03d}.jpg"\n    arquivo.rename(novo)\n\nTrês linhas e 400 fotos renomeadas — tente fazer isso na mão.\n\n## Criando pastas com segurança\n\n(pasta / "2024").mkdir(exist_ok=True)\n\nO exist_ok=True evita erro se a pasta já existir.\n\n## Movendo e copiando\n\nimport shutil\nshutil.copy("relatorio.docx", "backup/")\nshutil.move("antigo.txt", "arquivados/antigo.txt")\n\n## Desafio da aula\nCrie um script que organize a pasta Downloads: PDFs em uma subpasta, imagens em outra e vídeos em uma terceira. É o projeto mais útil que você fará nesta semana.',
          },
          {
            title: 'Planilhas e Excel com Python',
            description: 'Leia, filtre e escreva planilhas com openpyxl.',
            durationMin: 22,
            content:
              '## Instalando a biblioteca\n\npip install openpyxl\n\n## Lendo uma planilha\n\nimport openpyxl\n\nplanilha = openpyxl.load_workbook("vendas.xlsx")\naba = planilha.active\nfor linha in aba.iter_rows(min_row=2, values_only=True):\n    produto, valor, qtd = linha\n    print(produto, valor * qtd)\n\n## Escrevendo resultados\n\naba.cell(row=1, column=4, value="Total")\nplanilha.save("vendas-processadas.xlsx")\n\n## O caso de uso matador\nTodo relatório mensal que você monta copiando colunas de um Excel para outro é um script de 20 linhas. O padrão é sempre:\n\n1. Ler a planilha de origem.\n2. Processar os dados em memória (somar, filtrar, agrupar).\n3. Escrever em uma planilha nova.\n\n## Bônus: pandas\nQuando os dados crescem, a biblioteca pandas (pip install pandas) faz leitura, filtro e agrupamento em pouquíssimas linhas. Vale conhecer depois de dominar o openpyxl.',
            quiz: [
              {
                prompt: 'Qual biblioteca usamos para manipular arquivos .xlsx?',
                options: ['requests', 'openpyxl', 'flask', 'numpy'],
                correctIndex: 1,
                explanation: 'O openpyxl lê e escreve arquivos Excel (.xlsx) diretamente, mantendo formatações básicas.',
              },
            ],
          },
          {
            title: 'Web scraping básico e ético',
            description: 'Extraia dados de páginas com requests e BeautifulSoup.',
            durationMin: 25,
            content:
              '## Instalando\n\npip install requests beautifulsoup4\n\n## Baixando uma página\n\nimport requests\nresposta = requests.get("https://exemplo.com/noticias")\nprint(resposta.status_code)  # 200 = OK\n\n## Interpretando o HTML\n\nfrom bs4 import BeautifulSoup\n\nsopa = BeautifulSoup(resposta.text, "html.parser")\ntitulos = sopa.find_all("h2", class_="titulo")\nfor t in titulos:\n    print(t.get_text())\n\nPara descobrir quais tags usar, abra a página no navegador, clique com o botão direito no elemento e escolha "Inspecionar".\n\n## Ética e limites\n\n1. Leia o arquivo robots.txt do site (exemplo.com/robots.txt) — ele diz o que pode ser automatizado.\n2. Não envie centenas de requisições por segundo; use time.sleep(1) entre chamadas.\n3. Dados públicos para estudo pessoal: ok. Copiar conteúdo para republicar: nunca.\n\n## Projeto sugerido\nCrie um monitor de preço: escolha um produto em uma loja online, extraia o preço uma vez por dia e registre em um CSV. Na aula de agendamento vamos automatizar isso.',
          },
        ],
      },
      {
        title: 'Robôs práticos',
        description: 'Agendamento, notificações e o projeto final que amarra tudo.',
        lessons: [
          {
            title: 'Agendando tarefas no sistema',
            description: 'Seu script rodando sozinho todos os dias.',
            durationMin: 16,
            content:
              'Um script útil precisa rodar sozinho. Três caminhos:\n\n## 1. No próprio Python (multiplataforma)\n\npip install schedule\n\nimport schedule, time\n\ndef relatorio_diario():\n    print("Gerando relatório...")\n\nschedule.every().day.at("08:00").do(relatorio_diario)\nwhile True:\n    schedule.run_pending()\n    time.sleep(30)\n\n## 2. Agendador do Windows\nO "Agendador de Tarefas" (taskschd.msc) roda qualquer script em horários definidos — ideal para máquinas que você usa o dia todo.\n\n## 3. cron (Mac/Linux)\n\ncrontab -e\n0 8 * * * /usr/bin/python3 /home/voce/relatorio.py\n\n## Dica de produção\nSempre escreva logs em um arquivo com open("log.txt", "a") em vez de print — quando algo der errado daqui a duas semanas, o log será seu melhor amigo.',
          },
          {
            title: 'Projeto final: assistente de rotina',
            description: 'Junte tudo: um robô que organiza, avisa e relata.',
            durationMin: 30,
            content:
              'Hora de juntar as três etapas do curso em um projeto só.\n\n## O desafio\nCrie um assistente que, todo dia às 8h:\n\n1. Organiza a pasta Downloads por tipo de arquivo (aula de arquivos).\n2. Lê uma planilha de tarefas e imprime as do dia (aula de planilhas).\n3. Baixa a manchete principal de um site de notícias e salva em um log (aula de scraping).\n4. Roda sozinho via schedule ou cron (aula de agendamento).\n\n## Estrutura sugerida\n\nassistente/\n  main.py          # orquestra tudo\n  organizar.py     # move arquivos\n  tarefas.py       # lê a planilha\n  noticias.py      # scraping\n  log.txt          # histórico\n\n## Como evoluir\n\n- Envie um resumo por e-mail (biblioteca smtplib).\n- Adicione argumentos de linha de comando (argparse).\n- Empacote para instalar com pip install -e .\n\nPublic no mural da plataforma qual foi o seu toque pessoal no projeto — as melhores ideias viram aula da comunidade.',
            quiz: [
              {
                prompt: 'Qual a ordem mais sensata para montar o projeto final?',
                options: [
                  'Começar pelo agendamento e depois escrever as funções',
                  'Escrever e testar cada função separadamente, e só então agendar',
                  'Escrever tudo em um único arquivo sem testar',
                  'Publicar antes de funcionar e corrigir depois',
                ],
                correctIndex: 1,
                explanation:
                  'Automatizar código quebrado só espalha o problema: teste cada parte no terminal e agende por último, quando tudo já roda manualmente.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    mentorEmail: 'carlos@demo.com',
    title: 'React e Next.js na Prática',
    description:
      'Do componente ao deploy: construa aplicações web modernas com React e Next.js usando o App Router, Tailwind e boas práticas de quem mantém produtos em produção. Cada módulo entrega uma parte real de um app — no final você terá um projeto completo no ar para mostrar no portfólio.',
    category: 'Tecnologia',
    level: 'INTERMEDIARIO',
    price: 179,
    coverUrl: '/uploads/seed/course-react.png',
    mentorshipCount: 2,
    themes: [
      {
        title: 'Fundamentos do React',
        description: 'Componentes, props, estado e hooks — a base de tudo.',
        lessons: [
          {
            title: 'Componentes e props',
            description: 'A filosofia do React: UI como função.',
            durationMin: 18,
            content:
              'React constrói interfaces como LEGO: blocos (componentes) que se combinam.\n\n## Seu primeiro componente\n\nfunction Saudacao({ nome }) {\n  return <h1>Olá, {nome}!</h1>\n}\n\n<Saudacao nome="Ana" />\n\nO componente é só uma função que retorna JSX (o "HTML do React"). As chaves { } inserem valores dinâmicos.\n\n## Props: passando dados para baixo\nProps são os parâmetros do componente. Elas fluem sempre de pai para filho — essa regra única de direção é o que torna o React previsível.\n\n## Composição\n\nfunction Card({ titulo, children }) {\n  return (\n    <div className="card">\n      <h2>{titulo}</h2>\n      {children}\n    </div>\n  )\n}\n\nA prop especial children permite aninhar qualquer conteúdo dentro do Card — é assim que bibliotecas inteiras (como a shadcn/ui) são construídas.\n\n## Regra de ouro\nSe um pedaço de tela aparece mais de uma vez, ele merece ser um componente. Na dúvida, repita o HTML duas vezes e abstraia na terceira.',
          },
          {
            title: 'Estado e hooks: useState',
            description: 'Tornando a interface viva e reativa.',
            durationMin: 20,
            content:
              'Estado é a memória do componente: dados que mudam com o tempo e que, ao mudar, redesenham a tela.\n\n## useState na prática\n\n"use client"\nimport { useState } from "react"\n\nfunction Contador() {\n  const [contador, setContador] = useState(0)\n  return (\n    <button onClick={() => setContador(contador + 1)}>\n      Cliques: {contador}\n    </button>\n  )\n}\n\nTrês pontos essenciais:\n\n1. **Nunca mude o estado diretamente** (contador++ não funciona) — sempre use a função set.\n2. **Atualização baseada na anterior**: setContador(c => c + 1) é o jeito seguro quando o novo valor depende do antigo.\n3. **Estado renderiza**: qualquer setContador redesenha o componente inteiro — isso é barato, não tente otimizar antes de precisar.\n\n## Outros hooks que você vai conhecer\nuseEffect (efeitos colaterais), useRef (referências imutáveis) e hooks customizados. Todos seguem a mesma regra: comece com "use".\n\n## Desafio\nCrie um input controlado: um estado guarda o texto enquanto a pessoa digita e um <p> abaixo mostra o número de caracteres em tempo real.',
            quiz: [
              {
                prompt: 'Qual a forma correta de atualizar um contador baseado no valor anterior?',
                options: ['contador = contador + 1', 'setContador(contador + 1)', 'setContador(c => c + 1)', 'useState(contador + 1)'],
                correctIndex: 2,
                explanation:
                  'A função de atualização c => c + 1 garante que você sempre use o valor mais recente, mesmo com várias atualizações na mesma renderização.',
              },
            ],
          },
          {
            title: 'Listas, eventos e formulários',
            description: 'Os três padrões que aparecem em todo app real.',
            durationMin: 22,
            content:
              '## Renderizando listas\n\nconst produtos = ["Teclado", "Mouse", "Monitor"]\n\n<ul>\n  {produtos.map(p => <li key={p}>{p}</li>)}\n</ul>\n\nA key ajuda o React a saber o que mudou — use um id único, não o índice, quando a lista pode reordenar.\n\n## Eventos\nonClick, onChange, onSubmit seguem o padrão camelCase e recebem uma função (não o resultado dela):\n\n<button onClick={salvar}>          // correto\n<button onClick={salvar()}>        // executa na renderização — bug clássico\n\n## Formulários controlados\n\nconst [form, setForm] = useState({ nome: "", email: "" })\n\n<input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />\n\nO spread { ...form } preserva os outros campos. Para formulários grandes, bibliotecas como react-hook-form poupam horas.\n\n## Enviando para o servidor\nNo submit: e.preventDefault(), valide os campos, chame a API com fetch e trate loading e erro com estados próprios. Vamos fazer exatamente isso com Next.js no próximo módulo.',
          },
        ],
      },
      {
        title: 'Next.js na prática',
        description: 'App Router, data fetching e estilos com Tailwind.',
        lessons: [
          {
            title: 'App Router: páginas, layouts e rotas',
            description: 'A estrutura de pastas que define a aplicação.',
            durationMin: 20,
            content:
              'No Next.js com App Router, a pasta é a rota:\n\napp/\n  page.tsx          → /\n  sobre/page.tsx    → /sobre\n  produtos/[id]/page.tsx → /produtos/42\n\n## Layouts compartilhados\n\napp/layout.tsx envolve todas as páginas — é onde ficam header, footer e fontes. Um layout em app/produtos/layout.tsx envolve só as páginas de produtos.\n\n## Server Components por padrão\nTodo componente no App Router roda no servidor por padrão: pode buscar dados direto do banco sem API intermediária. Quando precisar de interação (onClick, useState), declare "use client" na primeira linha.\n\n## Rotas dinâmicas\n\nexport default async function Produto({ params }) {\n  const { id } = await params\n  const produto = await db.produto.findUnique({ where: { id } })\n  if (!produto) notFound()\n  return <h1>{produto.nome}</h1>\n}\n\n## Navegação\nUse o componente <Link href="/sobre"> — o Next pré-carrega a rota quando o link aparece na tela, e a navegação fica instantânea.',
          },
          {
            title: 'Data fetching: server, client e API routes',
            description: 'De onde vêm os dados e onde buscá-los.',
            durationMin: 25,
            content:
              '## No servidor (o caminho padrão)\n\nexport default async function Page() {\n  const res = await fetch("https://api.exemplo.com/cursos")\n  const cursos = await res.json()\n  return <Lista cursos={cursos} />\n}\n\nDireto, sem useEffect, sem estado de loading no cliente — e o HTML já sai pronto para o Google.\n\n## API Routes\nCrie endpoints no mesmo projeto em app/api/minha-rota/route.ts:\n\nexport async function GET() {\n  const dados = await db.curso.findMany()\n  return Response.json(dados)\n}\n\nÉ o backend morando junto do frontend — perfeito para a maioria dos produtos.\n\n## No cliente, quando faz sentido\nDados que mudam em tempo real (chat, notificações) ou formulários com feedback imediato justificam fetch no client com estados de loading/erro. O padrão que uso:\n\n1. Server Component busca a página inteira.\n2. Pequenas ilhas "use client" cuidam da interação.\n3. Mutação? POST para uma API route e router.refresh() para atualizar a tela.',
            quiz: [
              {
                prompt: 'Onde definir um endpoint de API no Next.js com App Router?',
                options: [
                  'app/api/rota/route.ts exportando GET/POST',
                  'pages/api com useEffect',
                  'No arquivo layout.tsx',
                  'Só é possível com um servidor separado',
                ],
                correctIndex: 0,
                explanation:
                  'No App Router, arquivos route.ts dentro de app/api exportam funções GET, POST etc. e viram endpoints automaticamente.',
              },
            ],
          },
          {
            title: 'Estilos com Tailwind CSS',
            description: 'Classes utilitárias sem sair do JSX.',
            durationMin: 16,
            content:
              'Tailwind é a forma dominante de estilizar apps React hoje — e o Next.js já vem com ele configurado.\n\n## A ideia\nVocê não escreve CSS em arquivos separados; compõe a aparência com classes utilitárias no próprio elemento:\n\n<div className="flex items-center gap-4 rounded-xl bg-white p-6 shadow">\n  <img className="h-12 w-12 rounded-full" />\n  <p className="text-lg font-semibold text-stone-800">Ana</p>\n</div>\n\n## Vocabulário essencial\n\n- **Espaçamento**: p-4 (padding), m-2 (margin), gap-3.\n- **Flex/Grid**: flex, grid, items-center, justify-between.\n- **Cores**: bg-stone-50, text-emerald-600 (tema do MentorHub!).\n- **Responsivo**: prefixos sm: md: lg: — <div className="grid grid-cols-1 md:grid-cols-3"> vira 3 colunas só em telas maiores.\n- **Estados**: hover:bg-stone-100, focus:ring-2.\n\n## Boas práticas\nExtraia componentes quando o className virar uma obra de arte de 300 caracteres — <BotaoVariante> vale mais que repetição. E confie no design system do projeto: cores e espaçamentos padronizados vencem criatividade desordenada.',
          },
        ],
      },
      {
        title: 'Deploy e boas práticas',
        description: 'Projeto final organizado, performático e no ar.',
        lessons: [
          {
            title: 'Estrutura de projeto e componentes reutilizáveis',
            description: 'Organização que escala além da primeira semana.',
            durationMin: 18,
            content:
              '## Estrutura que uso em produção\n\nsrc/\n  app/            # rotas (App Router)\n  components/\n    ui/           # botões, inputs, cards genéricos\n    negocio/      # CardCurso, ListaAulas...\n  lib/            # clients, helpers, configs\n  types/          # tipos TypeScript\n\nA separação ui/ vs negocio/ evita o pior pesadelo de projetos React: componentes gigantes que fazem tudo.\n\n## Regras de ouro\n\n1. **Componentes burros primeiro**: um Card que só recebe props e renderiza é reutilizável para sempre.\n2. **Estado o mais longe possível**: prefira subir o estado ao ancestral comum em vez de duplicar.\n3. **TypeScript sempre**: defina type Props = { ... } para cada componente — o autocomplete que você ganha paga o esforço.\n4. **Constantes fora do componente**: listas, URLs e configurações ficam fora do render para não recriar objetos a cada tela.\n\n## Checklist antes de codar uma feature\nOnde vive o estado? Quais componentes preciso criar? Algum já existe parecido? Trinta segundos de planejamento economizam horas de refactor.',
          },
          {
            title: 'Projeto final: app completo no ar',
            description: 'Build, deploy e o que mostrar depois.',
            durationMin: 25,
            content:
              '## O projeto\nUm catálogo de cursos com: listagem de cards, página de detalhe por curso, formulário de inscrição salvando em API route e tema com Tailwind. Exatamente a anatomia de um produto real.\n\n## Passo a passo do deploy\n\n1. Suba o projeto para o GitHub.\n2. Na Vercel (vercel.com), importe o repositório — o Next.js é detectado automaticamente.\n3. Configure variáveis de ambiente (DATABASE_URL, chaves de API) no painel.\n4. Deploy. Cada push novo na main gera um deploy novo — CI/CD de graça.\n\n## Checklist de produção\n\n- [ ] Sem console.log esquecido\n- [ ] Estados de loading e erro em toda busca de dados\n- [ ] Título e descrição por página (metadata no Next)\n- [ ] Responsivo de 360px até desktop\n- [ ] Imagens com next/image (evita layout pulando)\n\n## E agora?\Adicione o link no LinkedIn e no currículo. Projeto no ar vale mais que dez certificados — e nas mentorias 1:1 eu reviso o seu em detalhe.',
          },
        ],
      },
    ],
  },
  {
    mentorEmail: 'marina@demo.com',
    title: 'Banco de Dados SQL do Zero',
    description:
      'Os dados são o coração de qualquer sistema — e SQL é a habilidade que abre portas de desenvolvedor a analista. Neste curso você modela tabelas, escreve consultas de verdade (JOINs incluídos) e termina projetando o banco completo de uma loja online.',
    category: 'Tecnologia',
    level: 'INICIANTE',
    price: 139,
    coverUrl: '/uploads/seed/course-sql.png',
    themes: [
      {
        title: 'Fundamentos',
        description: 'O que são bancos de dados e como organizar informação.',
        lessons: [
          {
            title: 'O que é um banco de dados (e por que não Excel)',
            description: 'Concorrência, integridade e escala.',
            durationMin: 12,
            content:
              'Excel quebra quando: duas pessoas editam junto, os dados passam de algumas milhares de linhas, ou você precisa garantir que um pedido sempre tenha um cliente válido.\n\n## O que um banco de dados traz\n\n1. **Concorrência**: centenas de usuários lendo e escrevendo ao mesmo tempo, sem corromper nada.\n2. **Integridade**: regras que o banco obriga (e-mail único, pedido com cliente existente, valor não-negativo).\n3. **Consultas rápidas**: índices que acham 1 registro em 10 milhões em milissegundos.\n4. **Transações**: ou tudo acontece, ou nada acontece — nunca metade de uma transferência bancária.\n\n## Os tipos que você vai encontrar\n\n- **Relacionais (SQL)**: PostgreSQL, MySQL, SQLite — dados em tabelas. É o foco deste curso e o mais pedido no mercado.\n- **Documentos (NoSQL)**: MongoDB — JSON flexível. Genial para casos específicos, não substitui SQL.\n\n## O ambiente do curso\nUsaremos SQLite para o dia a dia (arquivo único, zero instalação) e os conceitos valem 100% para PostgreSQL e MySQL — a sintaxe que você aprender aqui roda em qualquer lugar com ajustes mínimos.',
          },
          {
            title: 'Tabelas, colunas e tipos',
            description: 'CREATE TABLE sem medo.',
            durationMin: 16,
            content:
              '## Anatomia de uma tabela\n\nCREATE TABLE alunos (\n  id    INTEGER PRIMARY KEY,\n  nome  TEXT NOT NULL,\n  email TEXT UNIQUE NOT NULL,\n  nascimento DATE,\n  nota  REAL DEFAULT 0\n);\n\nCada linha é um registro; cada coluna tem um **tipo**:\n\n- INTEGER — números inteiros\n- REAL / DECIMAL — decimais (dinheiro pede DECIMAL!)\n- TEXT — textos\n- DATE / DATETIME — datas\n- BOOLEAN — verdadeiro/falso\n\n## Constraints: as regras do jogo\n\n- **PRIMARY KEY** — identificador único da linha.\n- **NOT NULL** — campo obrigatório.\n- **UNIQUE** — sem repetição (dois emails iguais? o banco barra).\n- **DEFAULT** — valor padrão quando ninguém informa.\n\n## Inserindo e vendo dados\n\nINSERT INTO alunos (nome, email) VALUES ("Ana", "ana@demo.com");\nSELECT * FROM alunos;\n\nToda aula daqui pra frente é escrever SQL de verdade — baixe o DB Browser for SQLite para acompanhar com interface gráfica.',
            quiz: [
              {
                prompt: 'Qual constraint garante que dois alunos não tenham o mesmo e-mail?',
                options: ['NOT NULL', 'PRIMARY KEY', 'UNIQUE', 'DEFAULT'],
                correctIndex: 2,
                explanation:
                  'UNIQUE impede valores repetidos na coluna. O PRIMARY KEY também é único, mas identifica a linha — usamos UNIQUE para campos como e-mail e CPF.',
              },
            ],
          },
          {
            title: 'Relacionamentos e chaves estrangeiras',
            description: 'Como tabelas conversam entre si.',
            durationMin: 18,
            content:
              'Nenhum sistema sério tem uma tabela só. Relacionamentos conectam os dados.\n\n## Chave estrangeira (FOREIGN KEY)\n\nCREATE TABLE pedidos (\n  id         INTEGER PRIMARY KEY,\n  aluno_id   INTEGER REFERENCES alunos(id),\n  valor      DECIMAL NOT NULL,\n  criado_em  DATETIME DEFAULT CURRENT_TIMESTAMP\n);\n\nCada pedido aponta para o aluno que o fez. O aluno_id é a chave estrangeira.\n\n## Os três tipos de relação\n\n1. **Um-para-muitos**: um aluno, vários pedidos (o mais comum).\n2. **Muitos-para-muitos**: alunos e cursos — resolve com tabela intermediária matriculas(aluno_id, curso_id).\n3. **Um-para-um**: usuário e perfil detalhado — raro, use quando isolar dados sensíveis.\n\n## Por que isso importa\nCom relacionamentos, o "cadastro do cliente" espalhado em 5 abas de Excel vira uma tabela clientes limpa, referenciada por pedidos, endereços e mensagens. Mudou o telefone? Um UPDATE só — em todos os lugares.\n\n## Desafio\nModele um blog: posts e comentarios, um post tem muitos comentários. Escreva o CREATE TABLE das duas tabelas.',
          },
        ],
      },
      {
        title: 'Consultas SQL',
        description: 'SELECT, filtros, JOINs e agregações — o núcleo do dia a dia.',
        lessons: [
          {
            title: 'SELECT: filtros, ordenação e limite',
            description: 'A consulta que você vai escrever todos os dias.',
            durationMin: 20,
            content:
              '## O básico bem feito\n\nSELECT nome, email FROM alunos;         -- colunas específicas (evite *)\nSELECT * FROM alunos WHERE nota >= 7;   -- com filtro\nSELECT * FROM alunos ORDER BY nota DESC LIMIT 10;  -- top 10\n\n## Operadores de filtro\n\n= , != , > , < , >= , <=\nBETWEEN 7 AND 9\nIN ("SP", "RJ", "MG")\nLIKE "ana%"          -- começa com ana\nIS NULL / IS NOT NULL\n\n## E / OU\n\nSELECT * FROM pedidos\nWHERE valor > 100 AND status = "PAGO";\n\nCuidado com misturar AND e OR sem parênteses — AND vence. Quando na dúvida, parenthesize.\n\n## Apelidos e cálculos\n\nSELECT nome, nota * 0.9 AS nota_ajustada FROM alunos;\n\n## Exercício da aula\nNa tabela pedidos: liste os 5 maiores pedidos pagos de março, mostrando apenas valor e data, do maior para o menor. Cinco linhas de SQL — é esse tipo de consulta que você fará todo dia no trabalho.',
          },
          {
            title: 'JOINs sem medo',
            description: 'Juntando tabelas — a habilidade que separa iniciantes.',
            durationMin: 25,
            content:
              'O JOIN é a consulta mais importante do curso.\n\n## INNER JOIN: só quem tem em ambas\n\nSELECT pedidos.id, alunos.nome, pedidos.valor\nFROM pedidos\nINNER JOIN alunos ON alunos.id = pedidos.aluno_id;\n\nPara cada pedido, traz o nome do aluno. Pedidos sem aluno válido e alunos sem pedidos ficam de fora.\n\n## LEFT JOIN: guarda a esquerda inteira\n\nSELECT alunos.nome, COUNT(pedidos.id) AS total\nFROM alunos\nLEFT JOIN pedidos ON pedidos.aluno_id = alunos.id\nGROUP BY alunos.nome;\n\nO LEFT JOIN mantém todos os alunos — mesmo os sem pedidos (total 0). Perfeito para "quem nunca comprou?".\n\n## O truque mental\nPense no ON como a "ponte" entre as tabelas: ela diz qual linha de uma casa com qual linha da outra. Sempre qualifique as colunas (tabela.coluna) quando houver ambiguidade.\n\n## Erro clássico\nJOIN sem ON válido gera produto cartesiano (cada linha casa com todas) — 1.000 alunos × 5.000 pedidos = 5 milhões de linhas. Se a consulta demorar demais e voltar coisa estranha, revise o ON.',
            quiz: [
              {
                prompt: 'Você quer listar TODOS os alunos, inclusive quem nunca fez pedido. Qual JOIN?',
                options: ['INNER JOIN', 'LEFT JOIN', 'CROSS JOIN', 'Nenhum — três SELECTs separados'],
                correctIndex: 1,
                explanation:
                  'O LEFT JOIN preserva todas as linhas da tabela da esquerda (alunos), preenchendo com NULL o que não tiver correspondência nos pedidos.',
              },
            ],
          },
          {
            title: 'Agregações e GROUP BY',
            description: 'COUNT, SUM, AVG e relatórios de verdade.',
            durationMin: 22,
            content:
              '## As funções de agregação\n\nCOUNT(*)   — conta linhas\nSUM(valor) — soma\nAVG(valor) — média\nMIN / MAX  — extremos\n\n## GROUP BY: um relatório por grupo\n\nSELECT status, COUNT(*) AS total, SUM(valor) AS faturamento\nFROM pedidos\nGROUP BY status;\n\nUma linha por status, com contagem e soma. É assim que dashboards nascem.\n\n## HAVING: filtro DEPOIS de agrupar\n\nSELECT aluno_id, SUM(valor) AS total_gasto\nFROM pedidos\nGROUP BY aluno_id\nHAVING SUM(valor) > 500;\n\nWHERE filtra linhas antes do agrupamento; HAVING filtra grupos depois. Regrinha que cai em entrevista.\n\n## A ordem de execução mental\nFROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT. Quando a consulta não faz o que você espera, percorra essa ordem perguntando o que cada etapa produz.\n\n## Exercício\nTop 3 produtos mais vendidos (quantidade e receita) a partir de itens_pedido agrupando por produto, ordenando pela quantidade, limitando a 3.',
          },
        ],
      },
      {
        title: 'Modelagem e boas práticas',
        description: 'Normalização, índices e o projeto final da loja.',
        lessons: [
          {
            title: 'Modelagem na prática',
            description: 'Desenhando tabelas que não viram pesadelo.',
            durationMin: 20,
            content:
              '## Normalização em versão prática\nA regra que resolve 90% dos casos: **cada fato em um lugar só**.\n\n- Dados do cliente ficam em clientes — não repetidos em cada pedido.\n- Nome de produto fica em produtos — itens_pedido guarda apenas produto_id e preço cobrado (que pode mudar!).\n- Nada de coluna "obs1, obs2, obs3" — se você sentiu vontade de numerar uma coluna, quer uma tabela nova.\n\n## Exceção consciente: desnormalizar\nÀs vezes repetimos um dado de propósito para performance (ex.: guardar nome do produto no pedido histórico, porque o produto pode mudar de nome). Desnormalização é decisão sênior — e sempre documentada.\n\n## Datetimes e moedas\n\n- Guarde datas em UTC e converta na borda da aplicação.\n- Dinheiro: DECIMAL(10,2) ou centavos em INTEGER — nunca REAL (erro de arredondamento é inaceitável em dinheiro).\n\n## Ferramenta\nDesenhe antes de criar: dbdiagram.io transforma um texto simples em diagrama bonito — ótimo para revisar com o time antes do primeiro CREATE TABLE.',
          },
          {
            title: 'Índices e performance básica',
            description: 'Como fazer consultas em milhões de linhas voarem.',
            durationMin: 18,
            content:
              '## O problema\nSELECT * FROM pedidos WHERE cliente_id = 42 — com 10 milhões de pedidos, o banco lê TODAS as linhas (full table scan). Lento.\n\n## A solução\n\nCREATE INDEX idx_pedidos_cliente ON pedidos(cliente_id);\n\nO índice é como o índice remissivo de um livro: o banco pula direto para as linhas certas. A mesma consulta cai de segundos para milissegundos.\n\n## Quando indexar\n\n1. Colunas de WHERE e JOIN frequentes (cliente_id, status).\n2. Colunas de ordenação comum (criado_em).\n3. UNIQUE cria índice automaticamente.\n\n## O custo\nCada índice deixa INSERT/UPDATE um pouco mais lento e ocupa espaço. Não indexe tudo por pânico: indexe o que as consultas realmente filtram (o EXPLAIN QUERY PLAN mostra o que o banco faz).\n\n## Regra de sobrevivência\nSistema lento? Antes de culpar o servidor, veja se falta índice ou se tem N+1 na aplicação (uma consulta por item de lista). Esses dois respondem por 80% das lentidões reais.',
            quiz: [
              {
                prompt: 'Uma consulta por cliente_id está lenta em uma tabela grande. Primeira providência?',
                options: [
                  'Adicionar RAM no servidor',
                  'Criar um índice na coluna cliente_id',
                  'Rewrite em outra linguagem',
                  'Remover o WHERE',
                ],
                correctIndex: 1,
                explanation:
                  'Falta de índice é a causa mais comum de lentidão: um CREATE INDEX na coluna filtrada costuma resolver em minutos o que parece um problema de infraestrutura.',
              },
            ],
          },
          {
            title: 'Projeto final: banco da loja online',
            description: 'Do diagrama às consultas de negócio.',
            durationMin: 30,
            content:
              '## O desafio\nModele o banco completo de uma loja online e responda perguntas de negócio com SQL.\n\n## As tabelas mínimas\n\nclientes(id, nome, email UNIQUE, cidade)\nprodutos(id, nome, preco DECIMAL, estoque)\npedidos(id, cliente_id FK, status, criado_em)\nitens_pedido(id, pedido_id FK, produto_id FK, qtd, preco_cobrado)\n\nRepare: itens_pedido é a tabela intermediária do muitos-para-muitos entre pedidos e produtos, e guarda o preço cobrado — histórico imune a mudanças de catálogo.\n\n## As perguntas (escreva o SQL de cada uma)\n\n1. Faturamento total por mês.\n2. Top 5 clientes por valor gasto.\n3. Produtos que nunca foram vendidos.\n4. Ticket médio por cidade.\n5. Produtos com estoque abaixo de 10 e vendas no último mês.\n\n## Critério de conclusão\nCada consulta roda em menos de 100ms com 100 mil pedidos falsos (gere com Python da outra trilha!). Poste suas respostas no mural — vou revisar as modelagens mais interessantes em aula ao vivo.',
          },
        ],
      },
    ],
  },
  {
    mentorEmail: 'marina@demo.com',
    title: 'DevOps: Docker e CI/CD',
    description:
      '"Na minha máquina funciona" acaba aqui. Aprenda containers do zero, monte pipelines de integração contínua com GitHub Actions e faça deploy automático: todo push gera testes, build e versão nova no ar — o fluxo de trabalho dos times modernos.',
    category: 'Tecnologia',
    level: 'INTERMEDIARIO',
    price: 169,
    coverUrl: '/uploads/seed/course-devops.png',
    themes: [
      {
        title: 'Containers',
        description: 'Empacote a aplicação com tudo que ela precisa.',
        lessons: [
          {
            title: 'Por que containers existem',
            description: 'O problema que o Docker resolveu.',
            durationMin: 14,
            content:
              'O pesadelo clássico: funciona na sua máquina, quebra no servidor — versão de Node diferente, biblioteca faltando, configuração perdida.\n\n## A ideia do container\nUm container empacota a aplicação + dependências + runtime em uma caixa isolada. A caixa roda igual no seu notebook, no CI e na nuvem. Não é máquina virtual: containers compartilham o kernel do sistema e sobem em segundos, não minutos.\n\n## Container vs máquina virtual\n\n- **VM**: sistema operacional inteiro por aplicação. Pesado (GBs), lento para subir.\n- **Container**: processo isolado usando o OS do host. Leve (MBs), sobe em instantes.\n\n## Vocabulário essencial\n\n- **Imagem**: o molde congelado (receita de bolo).\n- **Container**: imagem rodando (o bolo).\n- **Dockerfile**: a receita escrita.\n- **Registry**: onde imagens ficam guardadas (Docker Hub, GitHub Container Registry).\n\n## Sua primeira experiência\nInstale o Docker Desktop e rode:\n\ndocker run -d -p 80:80 docker/getting-started\n\nAbra localhost no navegador: você acabou de subir um container. Na próxima aula vamos criar o nosso do zero.',
          },
          {
            title: 'Dockerfile na prática',
            description: 'Escrevendo a receita da sua aplicação.',
            durationMin: 22,
            content:
              '## Dockerfile de uma app Node\n\nFROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nEXPOSE 3000\nCMD ["npm", "start"]\n\nLinha a linha: imagem base oficial e enxuta (alpine), pasta de trabalho, cópia dos manifests de dependência ANTES do código (isso ativa o cache — o build só reinstala dependências quando o package.json muda), instalação, cópia do resto, porta e comando inicial.\n\n## Build e run\n\ndocker build -t minha-app .\ndocker run -d -p 3000:3000 minha-app\n\n## Boas práticas que valem ponto\n\n1. **.dockerignore**: node_modules, .git, .env — nunca vão para a imagem.\n2. **Imagens pequenas**: alpine/slim quando possível; imagem gigante = deploy lento.\n3. **Um processo por container**: banco em um container, app em outro.\n\n## docker compose para o conjunto\n\nservices:\n  app:\n    build: .\n    ports: ["3000:3000"]\n  db:\n    image: postgres:16\n    environment:\n      POSTGRES_PASSWORD: segredo\n\ndocker compose up sobe app + banco juntos — o ambiente de desenvolvimento perfeito.',
            quiz: [
              {
                prompt: 'Por que copiar package.json antes do código no Dockerfile?',
                options: [
                  'É obrigatório por convenção',
                  'Para aproveitar o cache de build: dependências só reinstalam se o package.json mudar',
                  'Porque o Docker exige nessa ordem',
                  'Para o código não vazar',
                ],
                correctIndex: 1,
                explanation:
                  'Cada camada é cacheada. Com dependências primeiro, mudanças no código reusam a camada de npm install — builds passam de minutos para segundos.',
              },
            ],
          },
        ],
      },
      {
        title: 'Integração contínua',
        description: 'Testes automáticos a cada push com GitHub Actions.',
        lessons: [
          {
            title: 'O que é CI/CD (e por que todo time exige)',
            description: 'Do deploy manual de sexta-feira ao pipeline.',
            durationMin: 15,
            content:
              'Deploy manual é assim: sexta às 18h, alguém roda comandos do memory, algo quebra, e o fim de semana vai embora. CI/CD existe para matar esse filme.\n\n## CI — Integração Contínua\nA cada push, o servidor roda automaticamente: instalar dependências, lint, testes, build. Se algo quebra, o time sabe em minutos — não em produção.\n\n## CD — Entrega/Deploy Contínuo\nDepois do CI verde, o deploy acontece sozinho (ou com um clique). Ninguém acessa servidor para "subir a versão".\n\n## O pipeline mínimo saudável\n\npush → instalar → lint → testes → build → deploy\n\nCada etapa só roda se a anterior passar. Isso se chama "gate": nenhum código sem teste chega na main.\n\n## O benefício invisível\nTimes com CI coragem refatorar. Sem medo. É a diferença cultural entre um código que apodrece e um que melhora todo mês. Neste módulo montaremos o pipeline completo no GitHub Actions — de graça para repositórios públicos e com generosa cota gratuita para privados.',
          },
          {
            title: 'GitHub Actions do zero',
            description: 'Seu primeiro workflow em 20 linhas.',
            durationMin: 24,
            content:
              '## O arquivo mágico\nCrie .github/workflows/ci.yml:\n\nname: CI\non:\n  push:\n    branches: [main]\n  pull_request:\n\njobs:\n  testes:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 20\n      - run: npm ci\n      - run: npm run lint\n      - run: npm test\n      - run: npm run build\n\n## Como ler\n\n- **on**: quando dispara (push na main, todo pull request).\n- **jobs**: grupos de etapas; runs-on é a máquina alugada.\n- **steps**: cada run é um comando no terminal — se um falha, o job fica vermelho e para.\n\n## Vendo funcionar\nCommit, push, e abra a aba Actions do repositório: o workflow roda ao vivo, com log de cada comando. Bola vermelha = problema encontrado antes de produção.\n\n## Segredos\nChaves de API não vão no yml: use Settings → Secrets, e referencie com ${{ secrets.NOME }}. Vamos usar isso no deploy.',
            quiz: [
              {
                prompt: 'O passo npm test falha no CI. O que acontece?',
                options: [
                  'O deploy continua normalmente',
                  'O GitHub ignora e marca como warning',
                  'O job para de imediato e fica vermelho — nada depois dele roda',
                  'O GitHub corrige o teste',
                ],
                correctIndex: 2,
                explanation:
                  'Etapas são sequenciais e bloqueantes: falha em qualquer step marca o job como failed e interrompe os seguintes — é justamente o portão de qualidade.',
              },
            ],
          },
        ],
      },
      {
        title: 'Deploy automático',
        description: 'Da variável de ambiente ao pipeline completo.',
        lessons: [
          {
            title: 'Ambientes, variáveis e deploy na nuvem',
            description: 'Configuração fora do código.',
            durationMin: 20,
            content:
              '## A regra 12-factor\nConfiguração não vive no código. URLs de banco, chaves de API e modos de operação são variáveis de ambiente, diferentes por ambiente:\n\nDATABASE_URL=postgres://...local     # seu notebook\nDATABASE_URL=postgres://...prod      # produção\n\n## Onde guardar em cada lugar\n\n- **Local**: arquivo .env (no .gitignore! Commit de .env é o acidente de segurança mais comum do mercado).\n- **Vercel/Railway/Render**: painel de Environment Variables.\n- **GitHub Actions**: Settings → Secrets.\n\n## Deploy na plataforma\nNa Vercel: importe o repo, configure as variáveis, e cada push na main gera deploy de produção + preview URL por pull request. O preview é ouro: o time revisa a feature rodando antes de mergear.\n\n## Deploy do container (quando a Vercel não serve)\n\n1. CI builda a imagem e envia ao registry (docker push).\n2. O servidor de produção puxa a imagem nova (docker pull) e reinicia o container.\n3. Rollback é voltar a tag anterior — segundos, não horas.',
          },
          {
            title: 'Projeto final: pipeline completo',
            description: 'Push → testes → build → produção, sem tocar em nada.',
            durationMin: 28,
            content:
              '## O objetivo\nUm repositório onde todo push:\n\n1. Roda lint e testes no GitHub Actions.\n2. Builda a imagem Docker.\n3. Publica no GitHub Container Registry (ghcr.io) com a tag do commit.\n4. Dispara o deploy (Vercel para app, ou servidor próprio via SSH).\n\n## yml do projeto (resumido)\n\njobs:\n  qualidade:  # lint + testes\n    ...\n  imagem:\n    needs: qualidade      # só roda se qualidade passar\n    steps:\n      - uses: docker/build-push-action@v5\n        with:\n          push: true\n          tags: ghcr.io/${{ github.repository }}:${{ github.sha }}\n  deploy:\n    needs: imagem\n    if: github.ref == \'refs/heads/main\'\n    ...\n\nO needs cria a corrente de gates; o if garante que só main vai para produção.\n\n## Critério de conclusão\nAbra um PR que quebra um teste de propósito: o CI deve barrar. Depois corrija e veja o pipeline verde levar a mudança ao ar sozinha. Print do pipeline verde = seu certificado deste curso. Trouxe dúvidas? A mentoria 1:1 revisa seu yml linha a linha.',
          },
        ],
      },
    ],
  },
  {
    mentorEmail: 'gustavonv@yandex.com',
    title: 'IA Generativa na Prática: do Prompt ao Produto',
    description:
      'A habilidade do momento, ensinada sem hype: entenda como LLMs funcionam de verdade, domine engenharia de prompt com estruturas testadas e leve IA para o seu trabalho — textos, análise de dados, automação e atendimento. Nada de mágica: método, exemplos e limites claros.',
    category: 'Tecnologia',
    level: 'INICIANTE',
    price: 159,
    coverUrl: '/uploads/seed/course-ia.png',
    mentorshipCount: 1,
    themes: [
      {
        title: 'Fundamentos de IA generativa',
        description: 'O que LLMs fazem, como fazem e onde falham.',
        lessons: [
          {
            title: 'Como um LLM funciona (sem matemática)',
            description: 'Previsão de texto em escala gigantesca.',
            durationMin: 14,
            content:
              'Um LLM (Large Language Model) faz uma coisa só, absurdamente bem: **prevê a próxima palavra**. Dado "O galo canta no...", ele sabe que "galinheiro" tem alta probabilidade. Treinado com trilhões de palavras, esse truque vira capacidade aparentemente inteligente.\n\n## O que isso explica\n\n1. **Por que escreve bem**: viu mais texto que qualquer humano leria em 100 vidas.\n2. **Por que erra fatos com confiança** (alucinação): ele prevê texto plausível, não consulta um banco de verdade — se o padrão sugere uma resposta errada mas fluente, ele entrega.\n3. **Por que contexto importa**: a resposta depende das palavras anteriores — daí o poder de um bom prompt.\n\n## Tokens\nO modelo não lê palavras, lê tokens (pedaços de palavras). "Automação" pode ser "auto" + "mação". Isso importa na prática: limite de contexto é contado em tokens, e textos estruturados (listas, JSON) costumam rendecer respostas melhores.\n\n## Temperatura\nParâmetro que controla criatividade: baixa (0-0.3) = respostas previsíveis, ótimo para extrair dados; alta (0.8-1) = variado e criativo, ótimo para brainstorm. Saber escolher a temperatura já separa amador de profissional.',
          },
          {
            title: 'O que pedir (e o que NÃO pedir)',
            description: 'Casos de uso reais e os limites responsáveis.',
            durationMin: 16,
            content:
              '## Onde LLMs brilham hoje\n\n- **Rascunho e reescrita**: e-mails, posts, resumos, versões mais formais/informais.\n- **Transformação**: extrair dados de texto, traduzir, converter formato, gerar títulos.\n- **Revisão**: achar erro de lógica em código, buracos em argumento, tom indevido.\n- **Brainstorm**: 20 ideias em 20 segundos — você filtra.\n- **Explicação**: "explique esse código/erro/conceito como se eu fosse júnior".\n\n## Onde NÃO confiar cegamente\n\n1. **Fatos recentes ou específicos** — conhecimento pode estar desatualizado; peça fontes e confira.\n2. **Cálculos e contas** — matemática delicada pede ferramenta de cálculo, não previsão de texto.\n3. **Dados sensíveis** — não cole dados de clientes, senhas ou documentos confidenciais em ferramentas públicas. Nunca.\n4. **Decisão final em temas sensíveis** — jurídico, médico, financeiro: IA ajuda a preparar, humano decide.\n\n## A mentalidade certa\nTrate a IA como estagiário brilhante com insônia: rápido, versátil, nunca mente de má-fé — mas pode afirmar bobagens com sorriso. Você revisa tudo. O produto final leva SEU nome.',
            quiz: [
              {
                prompt: 'Você precisa do número exato de vendas por região a partir de um relatório. Qual postura?',
                options: [
                  'Pedir à IA e confiar — ela é boa com números',
                  'Extrair com a IA, mas conferir os totais contra a fonte original',
                  'IA não serve para isso, faça tudo manualmente',
                  'Pedir três vezes e usar a resposta mais comum',
                ],
                correctIndex: 1,
                explanation:
                  'IA é ótima para EXTRAIR e estruturar, mas números críticos pedem conferência — alucinação em dados confiantes é o erro mais caro do uso profissional.',
              },
            ],
          },
        ],
      },
      {
        title: 'Engenharia de prompt',
        description: 'Estruturas testadas para obter respostas de qualidade.',
        lessons: [
          {
            title: 'A anatomia de um prompt profissional',
            description: 'Papel, tarefa, contexto, formato — os 4 ingredientes.',
            durationMin: 20,
            content:
              'Prompt vago, resposta vaga. Compare:\n\n❌ "Escreva sobre produtividade"\n\n✅ "Você é consultor de produtividade (papel). Escreva um post de LinkedIn de até 150 palavras (tarefa) para gerentes de loja de varejo que trabalham com equipe presencial (contexto), com tom direto, um exemplo prático e uma pergunta final para engajar (formato e restrições)."\n\n## Os 4 ingredientes\n\n1. **Papel**: quem a IA deve ser — muda vocabulário e profundidade.\n2. **Tarefa**: verbo claro + entregável específico.\n3. **Contexto**: para quem, situação, o que já existe.\n4. **Formato**: tamanho, estrutura, tom, o que evitar.\n\n## Truques de qualidade\n\n- **Exemplo de referência**: cole um exemplo do estilo que você quer ("siga este padrão: ...").\n- **Peça para pensar primeiro**: "liste 3 opções com prós e contras antes de escrever a final" melhora muito decisões.\n- **Itere por camadas**: aprovou a estrutura? Peça o texto completo. Aprovou o texto? Peça os ajustes de tom. Não recomece do zero a cada iteração.\n- **Peça crítica**: "liste 3 fraquezas deste texto como um editor exigente" e depois peça a correção — a IA revisa a si mesma com surpreendente honestidade.',
          },
          {
            title: 'Few-shot, chain-of-thought e personas',
            description: 'As três técnicas que resolvem 80% dos casos difíceis.',
            durationMin: 22,
            content:
              '## Few-shot: mostre, não descreva\nEm vez de explicar o padrão, dê exemplos:\n\nClassifique o feedback como POSITIVO, NEGATIVO ou NEUTRO:\n"Amei, chegou antes do prazo" → POSITIVO\n"Produto ok, mas a entrega atrasou" → NEGATIVO\n"Recebi conforme combinado" → NEUTRO\n\n"Embalagem amassada, mas produto bom" →\n\nCom 3-5 exemplos bem escolhidos, a precisão salta. Escolha exemplos dos casos difíceis, não dos óbvios.\n\n## Chain-of-thought: peça o raciocínio\nPara problemas de lógica: "pense passo a passo antes de responder". O modelo decompõe o problema e a taxa de acerto sobe muito — especialmente em cálculos em etapas, análises e decisões com critérios.\n\n## Personas para elevação de qualidade\n\n"Você é um editor sênior exigente..." → respostas mais rigorosas\n"Você é advogado especialista em LGPD..." → vocabulário e cautela jurídica\n\nA persona não é teatro: muda a distribuição de texto que o modelo produz. Use em revisões ("achar falhas"), não só em criações.',
            quiz: [
              {
                prompt: 'Você quer que a IA classifique tickets de suporte como no seu padrão interno. Melhor abordagem?',
                options: [
                  'Explicar a regra inteira em um parágrafo longo',
                  'Dar 5 exemplos reais de tickets já classificados (few-shot)',
                  'Pedir para a IA inventar as categorias',
                  'Classificar manualmente para sempre',
                ],
                correctIndex: 1,
                explanation:
                  'Few-shot transmite o padrão real do seu negócio com precisão que descrições verbais não alcançam — e melhora quanto mais representativos forem os exemplos.',
              },
            ],
          },
        ],
      },
      {
        title: 'IA no trabalho',
        description: 'Aplicações práticas que economizam horas por semana.',
        lessons: [
          {
            title: 'IA para textos, e-mails e reuniões',
            description: 'O fluxo de comunicação em 3x menos tempo.',
            durationMin: 18,
            content:
              '## E-mails que consomem sua semana\nO padrão vencedor:\n\n"Responda este e-mail (cole abaixo) aceitando o encontro, sugerindo terça 15h, em tom cordial e objetivo, até 80 palavras: [e-mail]"\n\nVocê revisa, ajusta detalhe, envia. Depois de um mês, você tem prompts salvos para os 10 tipos de e-mail que mais escreve — biblioteca pessoal de produtividade.\n\n## Reuniões\n\n1. **Antes**: IA gera pauta a partir do objetivo ("preparar pauta de reunião de alinhamento com 3 clientes insatisfeitos, 30 min, com tempo por tópico").\n2. **Durante**: gravação com transcrição (ferramentas do time).\n3. **Depois**: "extraia decisões, responsáveis e prazos desta transcrição em tabela".\n\nO item 3 sozinho devolve 1h por semana.\n\n## Documentos\nRelatório mensal: IA transforma a planilha em texto ("escreva um resumo executivo destes números, destaque quedas e proponha 3 ações"). Você valida números e assina. De 4h para 40 minutos — com texto muitas vezes melhor, porque você gasta energia na análise, não na redação.',
          },
          {
            title: 'Projeto final: seu assistente pessoal de IA',
            description: 'Biblioteca de prompts + automação do seu trabalho.',
            durationMin: 26,
            content:
              '## O entregável\nMonte seu sistema pessoal de IA com três camadas:\n\n## 1. Biblioteca de prompts\nEscolha as 5 tarefas mais repetitivas do seu trabalho e escreva um prompt profissional para cada (papel + tarefa + contexto + formato). Guarde em um documento de referência com exemplos de entrada e saída.\n\n## 2. Playbook de qualidade\nSuas regras pessoais: o que sempre confere (números, fatos, nomes), o que nunca colar (dados sensíveis), temperatura mental por tarefa (criar = variar; extrair = rigor).\n\n## 3. Uma automação de ponta a ponta\nEscolha UM fluxo para automatizar com IA de ponta a ponta. Exemplos reais de alunos:\n\n- Transcrição de reunião → resumo com decisões → e-mail para o time.\n- Feedbacks de clientes em planilha → classificação por sentimento → prioridade semanal.\n- Notas de aula → resumo + 10 questões de revisão.\n\nDocumente o fluxo antes/depois: quanto tempo levava, quanto leva agora. Poste no mural — os melhores playbooks viram estudo de caso da comunidade, e nas mentorias 1:1 eu ajudo a lapidar o seu.',
          },
        ],
      },
    ],
  },
]

// Recape: curso antigo "Testes e Qualidade de Código" (sem capa e sem aulas) ganha conteúdo
export const courseTestesFix = {
  mentorEmail: 'gustavonv@yandex.com',
  coverUrl: '/uploads/seed/course-testes.png',
  lessons: [
    {
      title: 'Why: por que testar economiza (e não gasta) tempo',
      description: 'A matemática do bug: onde ele é mais barato de corrigir.',
      durationMin: 10,
      content:
        'Bug encontrado em produção custa 10-100x mais do que o mesmo bug pego por um teste: correção às pressas, clientes afetados, deploy emergencial, investigação de causa.\n\n## Os três níveis de proteção\n\n1. **Testes unitários**: uma função isolada. Rápidos (milissegundos), centenas deles. São a base.\n2. **Testes de integração**: módulos conversando (rota + banco). Mais lentos, cobrem os furos entre peças.\n3. **E2E**: o usuário clicando na tela inteira. Poucos, lentos, cobrem o fluxo crítico do negócio.\n\n## A pirâmide\nMuitos unitários, alguns de integração, pouquíssimos E2E. Inverter a pirâmide (tudo E2E) é a receita para a suíte demorar 40 minutos e ninguém mais rodá-la.\n\n## O benefício invisível\nCobertura não é o objetivo — é efeito colateral. O objetivo real é **coragem**: com testes, você refatora aquele módulo assustador na terça e o pipeline avisa se quebrou algo. Sem testes, o medo congela a evolução do código.',
    },
    {
      title: 'Seu primeiro teste unitário',
      description: 'Arrange, act, assert — o padrão de todos os testes.',
      durationMin: 18,
      content:
        '## Anatomia de um teste (AAA)\n\ntest("desconto de 10% para compras acima de 100", () => {\n  // Arrange — preparar o cenário\n  const compra = { valor: 200 }\n  // Act — executar a ação\n  const total = calcularTotal(compra)\n  // Assert — verificar o resultado\n  expect(total).toBe(180)\n})\n\n## Regras de um bom teste\n\n1. **Um comportamento por teste** — se falha, você já sabe o quê e onde.\n2. **Nome que conta a história** — "desconto aplicado acima de 100" e não "testa função 1".\n3. **Independente** — ordem de execução não pode importar.\n4. **Determinístico** — nunca dependa de data, rede ou aleatoriedade (mocke o que variar).\n\n## O que testar primeiro (ordem de retorno)\n\n- Regras de negócio com dinheiro (cálculos, juros, descontos) — erro aqui é caro.\n- Casos de borda: lista vazia, zero, negativo, texto gigante, acentos.\n- O código que já quebrou uma vez em produção — bug corrigido sem teste é bug recorrente.\n\n## Desafio\nEscreva 5 testes para uma função validarCPF: CPF válido, com letras, vazio, com 11 dígitos repetidos, com pontuação. Os casos de borda dirão se a função é robusta de verdade.',
    },
    {
      title: 'Mocks, integração e a mentalidade de qualidade',
      description: 'Testando o que depende de fora — e mantendo a suíte viva.',
      durationMin: 20,
      content:
        '## Por que mockar\nSeu teste de cálculo não pode depender do gateway de pagamento real (lento, cobrável, instável). Mock substitui a dependência por uma versão de mentira controlada:\n\njest.mock("../lib/pagamento")\npagamento.cobrar.mockResolvedValue({ ok: true })\n\nUse mocks para FRONTIERAS (rede, banco, relógio) — nunca para a lógica que você está testando.\n\n## Teste de integração mínimo\nRota + banco de teste: crie registro, chame a rota, verifique a resposta e o efeito no banco. Bancos em memória ou containers efêmeros (da trilha DevOps!) mantêm o teste rápido e repetível.\n\n## Mantendo a suíte viva\n\n1. **CI roda tudo a cada push** — teste que não roda sozinho apodrece.\n2. **Bug novo = teste novo** — antes de corrigir, escreva o teste que reproduz o bug.\n3. **Teste vermelho há semanas?** Ou arruma hoje ou apaga — suíte vermelha é pior que sem suíte (ninguém confia).\n\n## Mentalidade\nTeste não é burocracia de QA: é o jeito de escrever código com a cabeça tranquila. Comece hoje pelo módulo mais assustador do seu projeto — e traga ele para a mentoria 1:1 que revisamos juntos.',
    },
  ],
  quizzes: [
    {
      lessonIndex: 1,
      quiz: [
        {
          prompt: 'Qual caso deve virar teste prioritário?',
          options: [
            'Fluxo raramente usado',
            'Bug que já aconteceu em produção',
            'Estilo visual do botão',
            'Nome de variável confuso',
          ],
          correctIndex: 1,
          explanation:
            'Bug corrigido sem teste é bug recorrente: o teste congela a correção e garante que a regressão nunca mais passe despercebida.',
        },
      ],
    },
  ],
}
