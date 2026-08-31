/**
 * Seed da trilha "Cibersegurança e Direito Digital" na conta do mentor
 * Gustavo Novaes Cruz (gustavonv@yandex.com).
 *
 * - Não destrói dados existentes: cria apenas a trilha + 4 cursos novos
 *   (temas, aulas, quizzes) e os TrackItems na ordem.
 * - Idempotente: se a trilha já existir para este mentor, sai sem alterar nada.
 * - Rodar com: bun prisma/seed-cyber-trilha.ts
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const MENTOR_EMAIL = 'gustavonv@yandex.com'
const TRACK_TITLE = 'Cibersegurança e Direito Digital'

type QuizDef = { prompt: string; options: string[]; correctIndex: number; explanation: string }
type LessonDef = {
  title: string
  description: string
  durationMin: number
  videoUrl?: string
  content?: string
  quiz?: QuizDef[]
}
type ThemeDef = { title: string; description: string; lessons: LessonDef[] }
type CourseDef = {
  title: string
  description: string
  level: string
  price: number
  coverUrl: string
  themes: ThemeDef[]
}

const courses: CourseDef[] = [
  // ============================================================
  // CURSO 1 — Fundamentos, Técnicas e Enquadramento Judicial
  // ============================================================
  {
    title: 'Cyber Segurança I: Fundamentos, Técnicas e Enquadramento Judicial',
    description:
      'A base conceitual de toda a trilha: tríade CIA, atores de ameaça e controles, e o vocabulário de NIST CSF, ISO/IEC 27001 e LGPD. Cada conceito é ancorado em casos reais — como Equifax e os grandes vazamentos brasileiros — mostrando o que quebrou, quais normas foram atingidas e qual foi a resposta do Judiciário.',
    level: 'INICIANTE',
    price: 149,
    coverUrl: '/uploads/seed/course-cyber-fundamentos.png',
    themes: [
      {
        title: 'Fundamentos da segurança da informação',
        description: 'Os pilares que sustentam tudo: tríade CIA e o mapa de quem ataca, por onde e por quê.',
        lessons: [
          {
            title: 'Boas-vindas: como técnica e direito se encontram',
            description: 'O método da trilha, quem é ela para e as normas que você vai ver o tempo inteiro.',
            durationMin: 8,
            content:
              'Boas-vindas à trilha Cibersegurança e Direito Digital.\n\nEste primeiro curso constrói a base que os outros três assumem como conhecida: a linguagem técnica da segurança (tríade CIA, controles, resposta a incidentes) e a linguagem normativa (NIST, ISO/IEC 27001, LGPD e ANPD). O diferencial do método: nenhum conceito aparece solto. Sempre que um pilar ou controle é apresentado, você verá um caso real em que ele falhou — e a consequência técnica e judicial da falha.\n\nPor que juntar as duas áreas? Porque hoje o incidente de segurança é também um evento jurídico: art. 46 da LGPD (dever de segurança), art. 48 (comunicação de incidente), responsabilidade civil do art. 927 do Código Civil e sanções da ANPD. O profissional que domina os dois lados é raro — e disputado.\n\nComo estudar:\n• Uma aula por vez; cada aula termina com o "gancho" que conecta ao próximo tema.\n• Faça os quizzes com calma: eles treinam o raciocínio de mapear falha → norma → consequência.\n• Anote as leis citadas (LGPD, Marco Civil, CPP, CPC): serão referência nas aulas seguintes.\n\nNos vemos na próxima aula, com o pilar de tudo: a tríade CIA.',
          },
          {
            title: 'A tríade CIA: confidencialidade, integridade e disponibilidade',
            description: 'Os três pilares explicados com falhas reais — e como cada um se conecta ao direito.',
            durationMin: 18,
            content:
              'Toda decisão de segurança responde a uma pergunta simples: qual pilar está em risco?\n\nConfidencialidade: só quem tem autorização acessa a informação. Quebra quando dados vazam. Exemplos: credenciais expostas, bancos de dados à venda, e-mails lidos por terceiros. Base normativa: art. 46 da LGPD exige medidas técnicas e administrativas aptas a proteger dados pessoais de acessos não autorizados.\n\nIntegridade: a informação permanece exata e completa. Quebra quando dados são alterados indevidamente. Exemplos: boleto com dados do pagador trocado (pharming), laudo editado, código-fonte adulterado. Em perícia, integridade é comprovada por hash: se o hash da evidência muda, a prova fica comprometida (tema do curso 3).\n\nDisponibilidade: o serviço existe quando necessário. Quebra com ransomware, DDoS e queda por falha. Exemplos: hospital sem sistema por dias, indústria parada. Vincula-se a continuidade de negócio e a obrigações contratuais de SLA.\n\nO complemento prático é o triângulo DAD — as três formas de atacar: Disclosure (revelar), Alteration (alterar) e Destruction (destruir). Cada ataque mapeia para um pilar; cada controle protege um pilar.\n\nGancho jurídico: quando um pilar quebra e havia dever de proteção, abre-se a discussão de responsabilidade civil (art. 927 do Código Civil, risco da atividade) e, no consumidor, do art. 14 do CDC. Vamos ver isso a fundo nas aulas de casos e no módulo de enquadramento judicial.',
            quiz: [
              {
                prompt: 'Um criminoso altera o número da conta no PDF de um boleto gerado por vítima. Qual pilar da tríade foi atacado?',
                options: ['Confidencialidade', 'Integridade', 'Disponibilidade', 'Autenticidade de rede'],
                correctIndex: 1,
                explanation:
                  'Alterar o conteúdo da informação (Alteration) ataca a integridade. Se ele apenas copiasse o boleto sem modificá-lo, seria confidencialidade; se criptografasse para extorquir, disponibilidade.',
              },
            ],
          },
          {
            title: 'Atores de ameaça, vetores e superfície de ataque',
            description: 'Quem ataca, por onde entra e o que atrai o ataque — o mapa do risco.',
            durationMin: 15,
            content:
              'Antes de falar de controles, é preciso saber de onde vem o perigo.\n\nAtores de ameaça:\n• Crime organizado: motivação financeira (ransomware, extorsão, fraude). É o ator dominante hoje.\n• Insider: colaborador malicioso ou descuidado — acesso legítimo usado indevidamente (crimes art. 154-A do Código Penal e vazamentos internos).\n• Hacktivistas e estados-nação: motivação ideológica ou geopolítica; alvos de alto valor estratégico.\n• Script kiddies: automatizam ferramentas prontas; barulho constante, risco menor — mas não zero.\n\nVetores de entrada mais comuns:\n• Phishing/engenharia social (o humano é a porta);\n• Credenciais vazadas ou fracas (sem MFA);\n• Vulnerabilidades sem patch em sistemas expostos;\n• Cadeia de terceiros e fornecedores (fornecedor pequeno com acesso a dado grande).\n\nSuperfície de ataque: tudo que pode ser tocado — endpoints, servidores, nuvem, APIs, pessoas e processos. Reduzir superfície é reduzir a quantidade de portas a trancar.\n\nGancho: cada vetor de entrada corresponde a controles no NIST CSF (função Protect) e a deveres legais (art. 46 LGPD). Quando a empresa não fecha a porta óbvia — como um patch conhecido — a discussão de negligência fica muito mais curta. É exatamente o que veremos no caso Equifax.',
          },
        ],
      },
      {
        title: 'As bases normativas: NIST, ISO 27001 e LGPD',
        description: 'O vocabulário que auditorias, clientes e reguladores esperam de você.',
        lessons: [
          {
            title: 'NIST CSF 2.0: as 6 funções que organizam sua defesa',
            description: 'Govern, Identify, Protect, Detect, Respond e Recover — o mapa de maturidade.',
            durationMin: 20,
            videoUrl: 'https://www.youtube.com/watch?v=Q8e-gM142bw',
            content:
              'O NIST Cybersecurity Framework (CSF) não é uma lei: é um mapa de referência — o vocabulário comum para descrever onde a segurança de uma organização existe e onde falta. A versão 2.0 (2024) organiza tudo em 6 funções:\n\n• Govern (novo): governança, papéis, política, apetite de risco — segurança como decisão de gestão;\n• Identify: inventariar ativos e riscos (você não protege o que não conhece);\n• Protect: controles preventivos (acesso, hardening, criptografia, treinamento);\n• Detect: monitoramento, logs, SIEM, detecção de anomalias;\n• Respond: conter, erradicar, comunicar;\n• Recover: restaurar e aprender com o incidente.\n\nComo usar na prática: uma avaliação rápida por função gera um "raio-X" da maturidade. Exemplo clássico de desequilíbrio: empresa com firewall forte (Protect) e zero capacidade de detectar exfiltração (Detect) — descobre o vazamento pela imprensa.\n\nOnde quebra o NIST? Você vai ver no caso Equifax (aula 9): patch conhecido não aplicado (Identify/Protect falham) e sistema de detecção com certificado expirado (Detect falha). A expressão "quebrou o NIST" significa, na prática, que uma dessas funções estava vazia no momento do incidente — e será exatamente isso que a parte contrária vai explorar no processo.\n\nComplementos do ecossistema NIST: SP 800-53 (catálogo de controles), SP 800-61 (resposta a incidentes — curso 2) e SP 800-63B (senhas e autenticação).',
          },
          {
            title: 'ISO/IEC 27001: o SGSI e os controles do Anexo A',
            description: 'Como funciona o sistema de gestão, a certificação e os 93 controles de 2022.',
            durationMin: 18,
            content:
              'A ISO/IEC 27001 é a norma internacional de Sistema de Gestão de Segurança da Informação (SGSI). A diferença para o NIST CSF: a 27001 é certificável — uma organização pode ser auditada e receber certificado, o que a torna moeda comercial em contratos, licitações e due diligence.\n\nEstrutura essencial:\n• Contexto e escopo: o que entra no SGSI;\n• Liderança: política e papéis (a diretoria responde);\n• Avaliação de riscos: metodologia formal de tratar riscos;\n• Melhoria contínua: ciclo PDCA com auditorias internas e revisão pela direção.\n\nAnexo A (edição 2022): 93 controles organizados em 4 temas — controles organizacionais (37), de pessoas (8), físicos (14) e tecnológicos (34). Nada de "lista de compras": cada controle precisa de justificativa ligada ao risco (declaração de aplicabilidade — SoA).\n\nCuidado com o vocabulário: ISO 27001 (requisitos do SGSI, certificável) ≠ ISO 27002 (guia de aplicação dos controles, não certificável).\n\nGancho jurídico: para a LGPD, a certificação não é obrigatória, mas o art. 46 permite que a ANPD considere normas, critérios técnicos e boas práticas — um SGSI implantado é a melhor tradução de "medidas técnicas e administrativas aptas a proteger dados". Num processo por vazamento, demonstrar SGSI funcionando é a diferença entre "negligência caracterizada" e "diligência razoável".',
          },
          {
            title: 'LGPD para profissionais de segurança',
            description: 'Princípios, agentes, bases legais e os artigos que todo técnico precisa dominar.',
            durationMin: 20,
            videoUrl: 'https://www.youtube.com/watch?v=n3e0HVcNml0',
            content:
              'A Lei Geral de Proteção de Dados (Lei 13.709/2018) muda o lugar onde a segurança é discutida: de "bom senso de TI" para obrigação legal auditável.\n\nFundamentos que sustentam a lei:\n• Princípios do art. 6º: finalidade, adequação, necessidade, livre acesso, qualidade, transparência, segurança, prevenção e não discriminação. O princípio da necessidade (mínimo necessário) é o que mais gera discussão técnica: por que esse sistema guarda CPF de todo mundo?\n• Agentes: controlador (decide o tratamento), operador (trata por conta do controlador) e encarregado/DPO (ponto de contato).\n• Bases legais do art. 7º: nenhuma organização trata dados "sem motivo" — precisa de uma das 10 hipóteses (consentimento, execução de contrato, obrigação legal, legítimo interesse etc.).\n\nOs dois artigos do técnico:\n• Art. 46: medidas de segurança técnicas e administrativas aptas a proteger dados de acidentes, destruição, perda, alteração, comunicação ou acesso não autorizado;\n• Art. 48: comunicação de incidente que possa gerar risco relevante — para a autoridade (ANPD) e para os titulares.\n\nPara o setor público, o Decreto 10.046/2019 detalha medidas de segurança de informações.\n\nGancho: nos cursos 2 e 4 você vai implantar essas medidas e operar a comunicação de incidente passo a passo. A punição por falhar também é concreta: art. 52 — multa de até 2% do faturamento, limitada a R$ 50 milhões por infração.',
            quiz: [
              {
                prompt: 'Uma empresa sofre ataque que expõe dados pessoais de clientes com risco relevante. Quais artigos da LGPD estruturam diretamente sua obrigação de proteger e comunicar?',
                options: [
                  'Arts. 1º e 2º',
                  'Arts. 46 e 48',
                  'Arts. 7º e 11',
                  'Arts. 65 e 66',
                ],
                correctIndex: 1,
                explanation:
                  'O art. 46 define o dever de medidas de segurança aptas a proteger os dados; o art. 48 define a comunicação de incidentes de segurança com risco relevante à ANPD e aos titulares.',
              },
            ],
          },
        ],
      },
      {
        title: 'Ameaças e casos reais',
        description: 'Ransomware, engenharia social e os incidentes que viraram referência.',
        lessons: [
          {
            title: 'Ransomware: ciclo de ataque e dupla extorsão',
            description: 'Como o crime organizado opera e por que backup sozinho não resolve mais.',
            durationMin: 18,
            videoUrl: 'https://www.youtube.com/watch?v=Vkjekr6jacg',
            content:
              'Ransomware deixou de ser "criptografa e cobra" — virou um negócio corporativizado, com afiliados, suporte ao cliente e negociação formal.\n\nO ciclo típico de um ataque moderno:\n1. Acesso inicial: credencial vazada sem MFA, VPN exposta ou phishing;\n2. Reconhecimento e escalação: mapear a rede, roubar senhas de administrador;\n3. Exfiltração: copiar os dados sensíveis para fora (a "dupla extorsão");\n4. Propagação: infectar backups acessíveis e o máximo de servidores;\n5. Impacto: criptografar tudo e deixar o "bilhete" com prazo;\n6. Negociação: pressão dupla — pagar para decriptar e para não publicar os dados.\n\nMapeamento na tríade: disponibilidade (dados criptografados) E confidencialidade (dados roubados) quebradas ao mesmo tempo. Pagar não garante nada: caso JBS (2021), o grupo pagou US$ 11 milhões em resgate — e a decisão virou estudo de caso de gestão de risco. Caso Colonial Pipeline (2021): acesso inicial por VPN sem MFA, abastecimento parado por dias na costa leste dos EUA.\n\nConsequências legais: além do dano operacional, a exfiltração comprovada dispara o art. 48 da LGPD (comunicação com risco relevante) e expõe a organização à responsabilidade civil — especialmente se o histórico do ataque mostrar controles básicos ausentes (MFA, segmentação, backup imutável — tema do curso 2).',
          },
          {
            title: 'Phishing e engenharia social: o humano como alvo',
            description: 'Técnicas de manipulação, controles que funcionam e a responsabilidade de quem descuida.',
            durationMin: 15,
            content:
              'A maioria das grandes invasões começa com uma mensagem — não com um exploit.\n\nTécnicas principais:\n• Phishing em massa: e-mail genérico caçando credenciais;\n• Spear phishing: alvo específico, contexto pessoal (o diretor, o financeiro);\n• Vishing e smishing: voz e SMS;\n• BEC (Business Email Compromise): sequestro de thread de e-mail para desviar pagamento;\n• MFA fatigue: spam de notificações de login até o usuário aprovar.\n\nPor que funciona: pressa, autoridade, medo e costume — gatilhos cognitivos batem em processos mal desenhados. O controle não é "treinar para ser esperto": é combinar camadas (defesa em profundidade):\n• MFA resistente a phishing (FIDO2/chave física) em vez de SMS;\n• Filtros de e-mail, DMARC/SPF/DKIM para autenticar remetentes;\n• Least privilege: credencial roubada de estagiário não deve acessar o financeiro;\n• Treinamento contínuo com simulações e canal para reportar.\n\nGancho jurídico: quando o incidente nasce de um clique, a discussão judicial vira "a empresa tinha controles proporcionais?" — o padrão de diligência do art. 46 da LGPD. Ausência total de MFA e de treinamento é fator de agravamento na dosimetria de sanção e pesa na responsabilidade civil. O caso Americanas (2022), com ataque de credential stuffing usando senhas reutilizadas de clientes, mostra o outro lado: dados que o próprio titular reutiliza também geram litígio sobre quem falhou primeiro.',
          },
          {
            title: 'Caso Equifax: o que quebrou e quanto custou',
            description: 'Anatomia do incidente que definiu o padrão de punição por falha de patch.',
            durationMin: 20,
            videoUrl: 'https://www.youtube.com/watch?v=qwgEHbr8PhE',
            content:
              'O caso mais didático da última década para juntar técnica, norma e punição.\n\nO incidente (2017): atacantes exploraram uma vulnerabilidade conhecida e corrigida no Apache Struts (CVE-2017-5638), usada em uma aplicação web exposta da Equifax, bureau de crédito dos EUA. Por cerca de 76 dias, exfiltraram dados de aproximadamente 147 milhões de pessoas: CPFs (SSNs), nomes, endereços, licenças de motorista e cartões.\n\nO que quebrou — mapeado no NIST CSF:\n• Identify/Protect: patch de segurança disponível há meses, não aplicado. Escaneamento de vulnerabilidades falhou em detectar o sistema afetado;\n• Detect: o sistema de monitoramento estava com certificado de segurança expirado há 19 meses — não via tráfego criptografado. A exfiltração passou desapercebida;\n• Respond: a resposta inicial foi confusa, com atraso na comunicação e executivos vendendo ações antes do anúncio público (processo da SEC).\n\nA punição:\n• Acordo global (2019) com FTC, CFPB e estados: mínimo de US$ 575 milhões, podendo chegar a ~US$ 700 milhões — o maior por vazamento até então;\n• Renúncia do CEO; saída do CISO e do CIO;\n• O "fundo de compensação" tornou cada afetado potencial reclamante — padrão replicado em ações brasileiras.\n\nA lição técnica e jurídica: a vulnerabilidade tinha correção disponível. Nenhum zero-day, nenhuma técnica exótica. É o cenário de negligência mais simples de provar — e o que a parte contrária em um processo brasileiro vai argumentar com o mesmo roteiro: patch, monitoramento e resposta falharam.',
            quiz: [
              {
                prompt: 'No caso Equifax, qual combinação de falhas tornou o incidente tão grave e juridicamente caro?',
                options: [
                  'Zero-day sem correção + criptografia quebrada',
                  'Patch conhecido não aplicado + detecção falha (certificado expirado) + resposta confusa',
                  'Ataque físico ao datacenter + insider malicioso',
                  'DDoS simultâneo + ausência de firewall',
                ],
                correctIndex: 1,
                explanation:
                  'Não houve zero-day: a falha do Apache Struts tinha patch disponível. Somado à incapacidade de detectar a exfiltração e à resposta desorganizada, configurou negligência — base do acordo de US$ 575 milhões.',
              },
            ],
          },
          {
            title: 'Casos do Brasil: vazamentos em massa e judiciarização',
            description: 'CadÚnico, SUS, Netshoes e Americanas — do vazamento à ação judicial.',
            durationMin: 18,
            content:
              'O Brasil virou laboratório de vazamentos em escala nacional — e de litígios.\n\nLinha do tempo de referência:\n• Netshoes (2019): credenciais de clientes expostas na rede, incluindo dados de cartões parcialmente mascarados. Antes da vigência plena da LGPD, mas com responsabilidade discutida no CDC;\n• Mega vazamentos de 2021: bases com dados do CadÚnico e do SUS apareceram à venda em fóruns — registros pessoais de centenas de milhões de entradas em circulação, incluindo dados de beneficiários e do sistema público de saúde. A origem discutida apontou para credenciais e acessos indevidos no ecossistema de parceiros — ilustrando o risco de terceiros;\n• Ministério da Saúde (2021): roubo massivo de dados (Lapsus$) combinado com ransomware — disponibilidade e confidencialidade quebradas em sequência;\n• Americanas (2022): ataque de credential stuffing explorando senhas reutilizadas por clientes; milhões de cadastros expostos.\n\nO que aconteceu na Justiça:\n• Danos morais individuais: os TJs têm condenado empresas por vazamento comprovado, com valores típicos na casa de milhares de reais por titular — a tese central é responsabilidade objetiva (art. 927 do Código Civil e art. 14 do CDC): basta provar o fato, o dano e o nexo;\n• Ações civis públicas e danos morais coletivos: o Ministério Público e associações litigam em nome de grupos de vítimas;\n• O padrão investigativo: o que a empresa tinha de controle? Havia MFA? Monitoramento? Comunicação ao titular? Cada lacuna vira argumento de negligência.\n\nGancho: para o incidente virar processo, alguém precisa provar o que ocorreu — e é aí que a perícia digital entra (curso 3). E a resposta organizacional segue o roteiro do art. 48 LGPD, que vamos operacionalizar no curso 4.',
          },
        ],
      },
      {
        title: 'Enquadramento judicial do incidente',
        description: 'De quem é a culpa, quanto custa e como a resposta é julgada.',
        lessons: [
          {
            title: 'Responsabilidade civil e sanções: quem paga a conta',
            description: 'Código Civil, CDC, LGPD e ANPD — o mapa completo de consequências.',
            durationMin: 20,
            content:
              'Quando o incidente acontece, quatro frentes de consequência se abrem:\n\n1. Responsabilidade civil individual: titulares reclamando dano moral e material. Base: art. 927 do Código Civil (responsabilidade objetiva — risco da atividade) e art. 14 do CDC nas relações de consumo. Discussões típicas: houve vazamento? houve dano? a empresa foi diligente?\n\n2. Responsabilidade coletiva: ações civis públicas e danos morais coletivos (art. 81 e ss. do CDC), movidas por MP, Defensoria e associações — valores aplicados em benefício da coletividade.\n\n3. Sanções administrativas (ANPD): art. 52 da LGPD — advertência, multa simples de até 2% do faturamento limitada a R$ 50 milhões por infração, publicação da infração, bloqueio e eliminação de dados, suspensão do banco de dados e da atividade. O Regulamento de dosimetria (2023) define gravidade e atenuantes: ter programa de conformidade demonstrável pesa a favor.\n\n4. Responsabilidade funcional e criminal: para o agente interno, crimes como violação de sigilo de dados (art. 154, §4º do CP), invasão de dispositivo (art. 154-A do CP) e fraude eletrônica (art. 171, §2º-A do CP).\n\nA "empresa vítima" ainda pode ser condenada: o foco não é quem sofreu o ataque, e sim se os cuidados razoáveis existiam. Por isso cada aula de controles do curso 2 é, também, uma aula de defesa jurídica futura.',
          },
          {
            title: 'Resposta a incidentes: do alerta ao boletim de ocorrência',
            description: 'O ciclo NIST SP 800-61 e as primeiras 48 horas — com a ponte jurídica.',
            durationMin: 18,
            videoUrl: 'https://www.youtube.com/watch?v=j5SY19S3RQ4',
            content:
              'Incidente não se resolve no improviso. O padrão internacional é o ciclo do NIST SP 800-61:\n\n1. Preparação: playbooks escritos ANTES do incidente, contatos, ferramentas, backup testado;\n2. Detecção e análise: classificar gravidade, escopo e tipo (malware, exfiltração, DDoS, fraude);\n3. Contenção, erradicação e recuperação: isolar, remover o invasor, restaurar com segurança;\n4. Atividade pós-incidente: lições aprendidas e atualização de controles.\n\nAs primeiras 48 horas — o roteiro que junta TI e jurídico:\n• Preserve antes de mexer: logs, imagens de disco e memória são provas (aquisição correta = curso 3). Apagar logs "para limpar" destrói a defesa;\n• Ative o time de resposta com papel claro: técnico, jurídico, comunicação e diretoria;\n• Avalie o risco para os titulares: dados sensíveis expostos? risco relevante? Art. 48 LGPD em jogo;\n• Registre o boletim de ocorrência quando houver indício de crime (art. 154-A CP e afins) — o BO também formaliza a data de conhecimento do evento;\n• Documente tudo com timestamp: cada decisão será revista depois.\n\nNas próximas trilhas: no curso 2 você executa esse ciclo em laboratório com SIEM; no curso 3 aprende a preservar a evidência corretamente; no curso 4 opera a comunicação à ANPD dentro do prazo regulamentar.',
          },
          {
            title: 'Encerramento: seu checklist de fundamentos',
            description: 'Síntese do curso e o que vem nos próximos três.',
            durationMin: 6,
            content:
              'Você agora domina a base que separa o amador do profissional:\n\n• Tríade CIA + DAD: todo risco e todo controle mapeiam para confidencialidade, integridade e disponibilidade;\n• Atores e vetores: crime organizado financeiro, insider, phishing, credenciais, patches e terceiros;\n• NIST CSF 2.0: as 6 funções (Govern, Identify, Protect, Detect, Respond, Recover) como raio-X de maturidade;\n• ISO/IEC 27001: SGSI certificável, Anexo A com 93 controles e a diferença para a 27002;\n• LGPD: princípios, agentes, bases legais e os art. 46/48 como âncora do técnico;\n• Casos: Equifax como anatomia completa da negligência punida; o cenário brasileiro de vazamentos e judiciarização;\n• Consequências: responsabilidade objetiva, danos morais individuais e coletivos, sanções da ANPD e crimes do Código Penal.\n\nChecklist pessoal: você consegue explicar a um leigo o que quebrou na Equifax em 60 segundos? Consegue mapear um ransomware na tríade e citar os 3 artigos da LGPD envolvidos? Se sim, está pronto.\n\nO que vem agora:\n• Curso 2 — Cyber Segurança Defensiva: laboratório prático (blue team);\n• Curso 3 — Perícia Digital e Aquisição de Provas;\n• Curso 4 — Direito Digital Aplicado: LGPD, ANPD e casos reais.\n\nBons estudos — e leve suas dúvidas para as mentorias 1:1 da trilha.',
          },
        ],
      },
    ],
  },

  // ============================================================
  // CURSO 2 — Defensiva / Blue Team (laboratório)
  // ============================================================
  {
    title: 'Cyber Segurança Defensiva: Laboratório Prático (Blue Team)',
    description:
      'Mão na massa na perspectiva defensiva: laboratório virtual, hardening, segmentação de rede, backup à prova de ransomware, monitoramento com SIEM, gestão de vulnerabilidades e resposta a incidentes — implantando controles do NIST CSF e do Anexo A da ISO/IEC 27001 com a documentação que auditorias e processos exigem.',
    level: 'INTERMEDIARIO',
    price: 199,
    coverUrl: '/uploads/seed/course-cyber-defensiva.png',
    themes: [
      {
        title: 'Preparando o laboratório',
        description: 'Ambiente seguro para praticar sem risco — e a rede que serve de esqueleto para tudo.',
        lessons: [
          {
            title: 'Montando seu laboratório virtual',
            description: 'VMs, rede isolada e snapshots: seu campo de treino blue team em 90 minutos.',
            durationMin: 25,
            content:
              'Defesa se aprende fazendo. Você precisa de um ambiente onde pode quebrar tudo sem consequência.\n\nFerramentas de virtualização: VirtualBox (gratuito, suficiente) ou Proxmox/VMware se tiver hardware melhor. Mínimo recomendado: 16 GB de RAM; 8 GB funciona com paciência.\n\nArquitetura mínima do lab:\n• VM "roteador" com pfSense (2 interfaces: WAN fake e LAN interna) — seu firewall de borda;\n• VM servidor Linux (Ubuntu Server) — alvo de hardening, logs e agente SIEM;\n• VM cliente Windows (avaliação gratuita da Microsoft) — endpoints, Event Logs, EDR de teste;\n• Rede interna isolada do lab (Host-only/Internal): nada do lab precisa acessar a sua rede real.\n\nRegras de ouro:\n• Snapshot antes de cada experimento — voltar no tempo é seu superpoder;\n• NUNCA ataque sistemas de terceiros: teste só no seu lab ou em ambientes com autorização por escrito (pentest sem contrato é crime, art. 154-A CP);\n• Documente cada passo: no mundo real, a evidência do trabalho é a documentação.\n\nControle mapeado: este lab é o seu exercício da função Protect do NIST CSF — e, quando bem documentado, vira portfólio para entrevistas e clientes.',
          },
          {
            title: 'Redes para defensores: segmentação, DMZ e firewall',
            description: 'VLANs, DMZ e regras stateful — por que "um firewall na borda" já não basta.',
            durationMin: 22,
            content:
              'Rede plana é presente para o atacante: uma credencial comprometida alcança tudo. O antídoto é segmentação.\n\nConceitos que você vai implantar no lab:\n• VLANs: separar tráfego por função (servidores, usuários, IoT, administração). Limita o alcance lateral (lateral movement) de quem já entrou;\n• DMZ: zona desmilitarizada para serviços expostos (web, e-mail). Regra clássica: da internet → DMZ (só as portas do serviço); da DMZ → rede interna (nada); da rede interna → DMZ (o necessário);\n• Firewall stateful: acompanha o estado das conexões — o pfSense do lab faz isso por padrão. Regras escritas na lógica "negar por padrão, permitir o mínimo" (default deny);\n• Princípio do menor privilégio de rede: cada zona recebe só o tráfego estritamente necessário.\n\nMapeamento normativo: controles do Anexo A da ISO 27001 sobre separação de redes (A.8.20-A.8.22) e a função Protect do CSF. Em auditoria, o diagrama de rede atualizado + regras documentadas são evidência direta.\n\nExercício: no pfSense do lab, crie 2 VLANs (servidores e clientes), escreva regras permitindo apenas o necessário e teste com ping/portscan entre zonas. O que passa, o que é bloqueado e por quê — essa é a conversa que você terá com qualquer auditor.',
          },
        ],
      },
      {
        title: 'Hardening e resiliência',
        description: 'Sistema minimamente vulnerável, identidade controlada e backup que sobrevive ao ransomware.',
        lessons: [
          {
            title: 'Hardening de endpoints e servidores',
            description: 'CIS Benchmarks, patching e superfície mínima — o básico que evita a Equifax.',
            durationMin: 25,
            content:
              'Hardening é reduzir a superfície: cada serviço desnecessário é uma porta que o atacante herda de graça.\n\nReferência obrigatória: CIS Benchmarks — guias passo a passo por sistema (Windows, Linux, cloud) com níveis 1 e 2 de severidade.\n\nRotina de hardening (aplique no lab):\n• Atualizações: patch management com cadastro de janelas e verificação — o patch não aplicado foi o coração do caso Equifax;\n• Serviços e portas: desative tudo que não é usado (no Linux, systemd/sockets; no Windows, features e papéis);\n• Contas: nenhum compartilhado, nenhum com senha padrão, administradores reduzidos ao mínimo;\n• Logging ligado por padrão: auditd no Linux, Event Logging avançado no Windows — sem log, o curso de resposta fica cego;\n• Criptografia de disco e senha de BIOS/UEFI em endpoints móveis;\n• Antimalware/EDR habilitado com exclusões mínimas.\n\nEvidência para auditoria (e para defesa judicial): checklist aplicado com data, política de patch, relatório de conformidade CIS. No art. 46 da LGPD, é exatamente isso — medida administrativa apta a proteger.\n\nExercício: pegue o CIS Benchmark do Ubuntu Server, aplique o nível 1 na sua VM e produza um relatório de antes/depois. Guarde: vai reaparecer no mini-projeto da última aula.',
            quiz: [
              {
                prompt: 'Qual prática de hardening teria evitado diretamente o incidente da Equifax?',
                options: [
                  'Trocar a senha do administrador',
                  'Aplicar o patch do Apache Struts que já estava disponível',
                  'Comprar um antivírus comercial',
                  'Bloquear a porta 443 no firewall',
                ],
                correctIndex: 1,
                explanation:
                  'A invasão explorou CVE-2017-5638, com correção disponível há meses. Patch management disciplinado (Identify + Protect do CSF) teria fechado a porta de entrada.',
              },
            ],
          },
          {
            title: 'Identidade e acesso: MFA, senhas e menor privilégio',
            description: 'NIST SP 800-63B, FIDO2 e gestão de privilégios — a identidade é o novo perímetro.',
            durationMin: 20,
            content:
              'O atacante não quebra mais a parede: ele loga. Por isso identidade é o controle mais crítico da década.\n\nSenhas (NIST SP 800-63B — o guia de referência):\n• Comprimento > complexidade: frases-senha longas e únicas;\n• Verificar contra listas de senhas vazadas;\n• Sem troca forçada periódica (a regra antiga produzia senhas fracas como "Senha!2023");\n• Gerenciador de senhas corporativo como padrão.\n\nMFA — a hierarquia que importa:\n• FIDO2/chave física e passkeys: resistentes a phishing (padrão-ouro);\n• App autenticador (TOTP): bom equilíbrio;\n• SMS/e-mail: melhor que nada, porém interceptáveis e alvo de MFA fatigue.\n\nMenor privilégio e gestão:\n• Contas de administração separadas do dia a dia;\n• PAM (privileged access management) mesmo que simples: aprovação e tempo limitado de elevação;\n• Revisões periódicas de acesso (onboarding/offboarding) — controles A.5.15-A.5.18 do Anexo A;\n• Privilégio mínimo em serviço: aplicação não roda como admin.\n\nLembre do credential stuffing da Americanas (curso 1): quando a senha do usuário falha, a segunda camada (MFA) e a detecção de anomalia de login são a diferença entre um alerta e um incidente nacional.',
          },
          {
            title: 'Backup 3-2-1: resiliência à prova de ransomware',
            description: 'Regra 3-2-1(-1-0), imutabilidade e teste de restore — recovery é controle legal.',
            durationMin: 20,
            content:
              'Backup não é "ter cópia": é capacidade comprovada de voltar a operar dentro de um prazo aceitável.\n\nA regra 3-2-1:\n• 3 cópias dos dados (original + 2);\n• 2 mídias/tecnologias diferentes;\n• 1 cópia fora do local (offsite).\n\nA evolução pós-ransomware — 3-2-1-1-0:\n• 1 cópia offline/imutável: inacessível por credenciais administrativas (snapshot imutável, fita, object storage com retention lock) — o ransomware tenta apagar backups primeiro;\n• 0 erros em testes de restore: backup não testado é aposta, não resiliência.\n\nDefinições que precisam estar no papel:\n• RPO (Recovery Point Objective): quanto dado você aceita perder (intervalo entre backups);\n• RTO (Recovery Time Objective): quanto tempo para voltar a operar;\n• Continuidade de negócio: a ISO 22301 estrutura o plano — e o Anexo A da 27001 traz os controles de backup (A.8.13) e redundância.\n\nTeste de restore rotineiro: restaurar arquivo crítico em ambiente isolado, registrar resultado com data e responsável. Esse registro é a evidência da função Recover do CSF — e, em incidente com dados pessoais, demonstra capacidade de retomada exigida na discussão de diligência do art. 46 LGPD.\n\nExercício: no lab, configure backup do servidor para storage imutável simulado, apague um arquivo, restaure e documente o tempo total do processo.',
          },
        ],
      },
      {
        title: 'Detecção e monitoramento',
        description: 'Logs, SIEM, ATT&CK e vulnerabilidades — enxergar o que está acontecendo.',
        lessons: [
          {
            title: 'Logs e SIEM: visibilidade com Wazuh',
            description: 'Da coleta à correlação: montar seu primeiro SIEM open source no lab.',
            durationMin: 28,
            content:
              'Você não pode responder ao que não vê. O SIEM centraliza logs e transforma volume em sinal.\n\nA pilha de coleta:\n• Windows: Event Logs (segurança, sistema, PowerShell) via agente;\n• Linux: syslog/journald e auditd;\n• Infraestrutura: firewalls, switches e nuvem exportando syslog/API;\n• Aplicações: logs de autenticação e administração.\n\nWazuh no lab (open source, amplamente usado):\n• Manager + indexador + dashboard; agente instalado nas VMs Windows e Linux;\n• Regras prontas de detecção: tentativas de login falho em massa, escalada de privilégio, modificação de arquivo crítico (FIM — file integrity monitoring), execução de PowerShell suspeita;\n• Correlação: 50 falhas de login em 5 minutos seguidas de 1 sucesso = regra clássica de brute force;\n• Dashboards e alertas por gravidade.\n\nBoas práticas de log que valem em auditoria:\n• Relógio sincronizado (NTP) em tudo — sem isso, a linha do tempo do incidente desmorona;\n• Retenção mínima compatível com o Marco Civil (logs de conexão: 6 meses; acesso a aplicações: 3 meses — e mais se o negócio exigir);\n• Proteção dos próprios logs: o atacante apaga rastro;\n• Privacidade: log é dado pessoal — o tratamento segue a LGPD.\n\nExercício: instale o agente nas 2 VMs, force 10 falhas de login no Windows e acompanhe o alerta aparecer no dashboard do Wazuh.',
          },
          {
            title: 'MITRE ATT&CK: detecção orientada a ameaças',
            description: 'Táticas e técnicas do adversário — como transformar conhecimento em regra.',
            durationMin: 18,
            content:
              'ATT&CK é o catálogo público de como atacantes realmente operam, organizado por táticas (o objetivo: Acesso Inicial, Escalação de Privilégio, Exfiltração...) e técnicas (o como: T1078 - Contas Válidas, T1059 - Interprete de Comandos...).\n\nPor que isso muda sua detecção: em vez de comprar "mil regras" genéricas, você escolhe as técnicas relevantes para o seu ambiente e garante cobertura sobre elas — defesa orientada a ameaças (threat-informed defense).\n\nMétodo prático:\n1. Liste as técnicas mais usadas no seu setor (relatórios de incidentes e feeds de inteligência ajudam a priorizar);\n2. Verifique cobertura: para cada técnica, existe log? existe regra no SIEM (Wazuh mapeia regras para ATT&CK)? existe EDR cobrindo?\n3. Encontre lacunas e priorize: técnica comum + sem cobertura = projeto de detecção;\n4. Teste de vez em quando: simulações seguras (sem exploração de terceiros) provam que a regra dispara.\n\nExemplo didático: T1110 (força bruta). Log de falhas de autenticação existe? Wazuh tem regra correlacionando? Se não, você acabou de escrever sua primeira prioridade de trabalho — com linguagem que diretor e auditor entendem.\n\nGancho jurídico: documentar cobertura de detecção é demonstrar a função Detect do CSF — e, num litígio pós-vazamento, é a prova de que monitoramento não era só propaganda.',
          },
          {
            title: 'Gestão de vulnerabilidades: scan, CVSS e priorização',
            description: 'Nessus/OpenVAS, CVSS e o contexto que decide o que corrigir primeiro.',
            durationMin: 22,
            content:
              'Você vai sempre ter mais vulnerabilidades do que tempo. A gestão existe para decidir ordem.\n\nO ciclo:\n1. Inventário: não dá para escanear o que não está catalogado (Identify do CSF);\n2. Scan autenticado (com credencial) é muito mais profundo que externo: OpenVAS/Greenbone (open source) ou Nessus (referência de mercado);\n3. Pontuação CVSS: severidade técnica de 0 a 10 (vetor, complexidade, privilégios, impacto). Atenção: CVSS não é urgência;\n4. Priorização com contexto: exposição (internet?), criticidade do ativo, dados tratados (LGPD!), existência de exploit público (CISA KEV é lista oficial de exploradas de fato), compensação existente (MFA na frente? segmentação?);\n5. Remediação ou mitigação com SLA por severidade — e exceções documentadas com prazo.\n\nA regra de ouro: vulnerabilidade de severidade crítica com exploit público em servidor de internet = hoje. É exatamente o perfil da falha da Equifax.\n\nExercício no lab: rode OpenVAS contra a VM Linux desatualizada, leia o relatório, priorize 3 achados com justificativa de contexto e corrija-os. O relatório antes/depois é sua evidência — e a base do mini-projeto final.',
          },
        ],
      },
      {
        title: 'Resposta e melhoria contínua',
        description: 'EDR, incidentes com NIST 800-61, evidências e o projeto final de maturidade.',
        lessons: [
          {
            title: 'EDR e triagem de alertas',
            description: 'Do antivírus ao EDR: visibilidade de endpoint e a rotina de triagem.',
            durationMin: 18,
            content:
              'O antivírus clássico compara arquivos a assinaturas. O EDR (Endpoint Detection and Response) observa comportamento: processos, linha de comando, rede, modificações de registro — e permite investigar e responder de um console.\n\nO que o EDR muda na prática:\n• Cadeia de execução: mostra que o Excel abriu um PowerShell que baixou algo da internet — padrão clássico de documento malicioso;\n• Isolamento de endpoint com um clique (contenção sem desligar);\n• Telemetria para o SIEM: contexto unificado.\n\nTriagem de alerta — o dia a dia do analista:\n1. Severidade e confiança: falso positivo provável ou real?;\n2. Contexto: qual usuário, qual ativo, qual criticidade, horário (3h da manhã de domingo pesa);\n3. Escopo: só este host ou padrão em vários?;\n4. Ação: marcar benigno, coletar evidência, isolar ou escalar para o time de resposta;\n5. Registro: todo alerta encerrado com anotação — "por que foi benigno" vale ouro no próximo incidente.\n\nTeste seguro no lab: use o arquivo de teste EICAR (padrão inofensivo reconhecido pela indústria) para validar que a detecção funciona — nunca malware real, e nunca fora do lab.\n\nGancho: a triagem registrada é a prova operacional da função Detect. Sem registro, o time até monitora — mas não consegue demonstrar.',
          },
          {
            title: 'Resposta a incidentes com NIST SP 800-61',
            description: 'Executar o ciclo completo no lab: playbook de ransomware incluído.',
            durationMin: 22,
            videoUrl: 'https://www.youtube.com/watch?v=aA2ldOeqycA',
            content:
              'Agora você executa o que o curso 1 apresentou. O NIST SP 800-61 (Guia de Tratamento de Incidentes) define o ciclo: preparação → detecção e análise → contenção, erradicação e recuperação → pós-incidente.\n\nPlaybook de ransomware (o mais cobrado):\n1. Confirmar e classificar: é realmente ransomware? quais hosts?;\n2. Conter rápido: isolar hosts afetados (EDR/rede), bloquear contas comprometidas, cortar comunicação C2 — sem formatar nada;\n3. Preservar: imagem de memória e disco dos hosts críticos ANTES da limpeza (curso 3 ensina a fazer corretamente); guardar os logs do SIEM;\n4. Comunicar internamente: jurídico e diretoria decidem junto — pagamento, comunicação externa e legal só com eles na mesa;\n5. Avaliar dados pessoais: houve exfiltração de dados de titulares? risco relevante? O art. 48 da LGPD e o prazo regulamentar da ANPD (3 dias úteis, conforme o Regulamento de comunicação de incidentes) entram aqui;\n6. Erradicar e recuperar: remover persistência, patchear, restaurar de backup imutável, monitorar de perto a reinfecção;\n7. Pós-incidente: relatório com linha do tempo, causa raiz e plano de melhoria — assinado.\n\nExercício no lab: simule o cenário (criptografe uma pasta de teste com uma ferramenta de demonstração), execute o playbook do início ao fim e produza o relatório final. Ninguém virou analista sênior sem ter escrito o primeiro.',
          },
          {
            title: 'Documentação e evidências: a ponte com a perícia',
            description: 'O que registrar durante o incidente para ele valer também como prova.',
            durationMin: 18,
            content:
              'Todo incidente tem dois fins de semana: o da crise e o do processo. A documentação decide como você passa pelo segundo.\n\nRegistro mínimo durante a resposta:\n• Linha do tempo com timestamp: quem identificou, quando, o que fez, com qual ferramenta;\n• Logs e telemetria: exporte e preserve cópias (o SIEM rotativo pode sobrescrever);\n• Imagens forenses dos hosts críticos quando houver indício de crime ou disputa trabalhista/cível;\n• Decisões e justificativas: "por que isolamos", "por que não pagamos" — decisões racionais registradas.\n\nPor que isso importa juridicamente:\n• No processo criminal, a cadeia de custódia (arts. 158-A a 158-F do CPP) exige registro de quem manuseou cada evidência;\n• No processo cível/trabalhista, o documento eletrônico (art. 432 do CPC) pode ser impugnado — hash e metodologia sustentam autenticidade;\n• Na esfera LGPD, o relatório do incidente é a base da comunicação à ANPD e da defesa em eventual processo sancionador.\n\nO controle existe até no Anexo A da ISO 27001 (A.5.28 — coleta de evidência): a norma pede procedimento definido ANTES da necessidade.\n\nGancho direto: o curso 3 começa exatamente aqui — transformar preservação em metodologia formal, com write blocker, hash e cadeia de custódia.',
          },
          {
            title: 'Mini-projeto: mapeie seu ambiente no CSF + Anexo A',
            description: 'O entregável que fecha o curso e vira portfólio (ou primeiro produto de consultoria).',
            durationMin: 15,
            content:
              'Chegou a hora de juntar tudo em um artefato real: um diagnóstico de maturidade com plano de ação.\n\nO entregável (planilha ou documento):\nPara cada função do NIST CSF 2.0 (Govern, Identify, Protect, Detect, Respond, Recover):\n• Situação atual: o que existe hoje (com evidência)?\n• Controle ISO/IEC 27001 Anexo A correspondente;\n• Lacuna: o que falta;\n• Prioridade: alta/média/baixa com justificativa de risco;\n• Ação prática: o que fazer em 30/60/90 dias.\n\nExemplo de linha: Detect — "não há SIEM; logs dispersos" → Anexo A (monitoramento e registro) → prioridade alta por tratar dados pessoais → ação: implantar Wazuh nas VMs críticas em 30 dias (você já fez isso no curso!).\n\nCritérios de qualidade:\n• Cada afirmação com evidência (screenshot, documento, log) — nada de achismo;\n• Linguagem de negócio: risco e impacto, não jargão solto;\n• Realismo: plano de 90 dias executável vale mais que utopia.\n\nEsse documento é: (1) o fechamento do seu lab; (2) portfólio para vagas e clientes; (3) a espinha dorsal do projeto final da trilha no curso 4, onde ele ganha a camada jurídica completa.',
            quiz: [
              {
                prompt: 'No diagnóstico CSF + Anexo A, o que caracteriza uma linha de qualidade?',
                options: [
                  'Sugestões genéricas sem vínculo com o ambiente',
                  'Situação atual com evidência, controle ISO correspondente, lacuna e ação priorizada por risco',
                  'Somente itens tecnológicos, deixando pessoas e processo de fora',
                  'Lista de produtos a comprar, com preços',
                ],
                correctIndex: 1,
                explanation:
                  'Diagnóstico sério une evidência do estado atual, referência normativa (Anexo A) e plano priorizado por risco — é isso que auditor, cliente e tribunal aceitam como demonstração de diligência.',
              },
            ],
          },
        ],
      },
    ],
  },

  // ============================================================
  // CURSO 3 — Perícia Digital e Aquisição de Provas
  // ============================================================
  {
    title: 'Perícia Digital e Aquisição de Provas',
    description:
      'Da preservação ao laudo: metodologia de perícia forense, aquisição bit a bit com verificação de hash, cadeia de custódia dos arts. 158-A a 158-F do CPP, normas ISO/IEC 27037 e o uso da evidência digital em processos cíveis, criminais e trabalhistas — com caso integrador simulado.',
    level: 'INTERMEDIARIO',
    price: 249,
    coverUrl: '/uploads/seed/course-cyber-pericia.png',
    themes: [
      {
        title: 'Fundamentos e marco legal',
        description: 'O papel do perito e as leis que sustentam a prova digital no Brasil.',
        lessons: [
          {
            title: 'O que é perícia digital e onde ela atua',
            description: 'Áreas de atuação, figuras do processo e o mercado do perito.',
            durationMin: 18,
            content:
              'Perícia digital é a aplicação de método científico para identificar, preservar, examinar e apresentar evidência eletrônica — de forma que sobreviva a impugnações técnicas e jurídicas.\n\nOnde ela atua:\n• Criminal: invasão de dispositivos (art. 154-A CP), fraudes, sequestro de dados, crimes contra titularidade digital;\n• Cível: vazamento de dados (prova do fato e do nexo), disputas societárias, quebra de sigilo e concorrência;\n• Trabalhista: e-mail corporativo, uso de recursos da empresa, sigilo profissional;\n• Administrativa: investigações internas, compliance, disputa de sanções (LGPD/ANPD).\n\nFiguras do processo (CPC, arts. 156 e ss.):\n• Perito do juízo: nomeado pelo juiz, imparcial;\n• Assistente técnico: indicação da parte para acompanhar e criticar o laudo;\n• Quesitos: as perguntas que as partes e o juiz dirigem à perícia.\n\nO que separa o analista de segurança do perito: método, documentação e neutralidade. O analista resolve o incidente; o perito demonstra, com evidência reproduzível, o que aconteceu — dentro das normas.\n\nMercado: a demanda cresce com a LGPD (vazamentos precisam de prova), litígios trabalhistas digitais e crimes cibernéticos. É uma das especializações mais escassas do país — e a trilha fecha o ciclo: você entende a técnica (cursos 1 e 2) e agora vai aprender a torná-la prova.',
          },
          {
            title: 'Marco legal da prova digital no Brasil',
            description: 'CPP, CPC, ICP-Brasil e Marco Civil — os dispositivos que você vai citar no laudo.',
            durationMin: 22,
            content:
              'A prova digital tem endereço na lei. Guarde estes seis:\n\n1. Código de Processo Penal, arts. 158-A a 158-F (incluídos pela Lei 13.964/2019): a cadeia de custódia — registro formal de cada pessoa que toca na evidência, desde a coleta até o descarte. O art. 158-B exige registro das condições, do local e do momento da coleta. Cadeia quebrada = prova questionada.\n\n2. Código de Processo Civil, art. 432: o documento eletrônico segue as regras do documento particular; a impugnação de autenticidade segue o caminho da perícia. Tradução: seu laudo é que decide a briga.\n\n3. MP 2.200-2/2001 (ICP-Brasil): validade jurídica das assinaturas com certificado digital emitido por AC credenciada.\n\n4. Lei 11.419/2006: processo eletrônico — o laudo é protocolado e citado digitalmente.\n\n5. Marco Civil da Internet (Lei 12.965/2014), art. 15: provedores guardam logs de conexão por 6 meses e de acesso a aplicações por 3 meses — a fonte mais comum de evidência em disputa (e o prazo que sua organização deve considerar na política de retenção).\n\n6. Código Penal, arts. 154-A e 154-B: invasão de dispositivo informático e a colocação da prova correspondente no processo.\n\nNo cível, lembre ainda do art. 927 do CC (responsabilidade por risco da atividade) em vazamentos: a perícia é que estabelece o fato (houve exfiltração, quando, como) que ancora o nexo causal.\n\nTabela mental para o laudo: cada evidência citada deve ter origem legal + método técnico + integridade demonstrada.',
            quiz: [
              {
                prompt: 'Um réu alega que o disco apreendido foi manuseado sem controle. Qual instituto jurídico decide o valor da prova?',
                options: [
                  'A regra do melhor argumento do CPC',
                  'A cadeia de custódia dos arts. 158-A a 158-F do CPP',
                  'O princípio da verdade real da CLT',
                  'O art. 15 do Marco Civil da Internet',
                ],
                correctIndex: 1,
                explanation:
                  'A cadeia de custódia documenta cada toque na evidência (quem, quando, por quê). Lacuna ou inconsistência nesse registro abre margem para impugnação — e pode inutilizar a prova.',
              },
            ],
          },
          {
            title: 'Metodologia: ISO/IEC 27037 e NIST SP 800-86',
            description: 'As fases da forense digital e a ordem de volatilidade que salva a evidência.',
            durationMin: 20,
            content:
              'Método é o que transforma técnica em prova. Duas referências guiam o trabalho:\n\nISO/IEC 27037:2013 — diretrizes para identificação, coleta, aquisição e preservação de evidência digital:\n1. Identificação: o que pode conter evidência (dispositivos, nuvem, memória, logs);\n2. Coleta: capturar o que é volátil primeiro;\n3. Aquisição: gerar a cópia forense verificada;\n4. Preservação: garantir integridade e acesso controlado até o fim do processo.\n\nA família continua: ISO/IEC 27041 (assegurar a confiabilidade do processo), 27042 (análise e interpretação) e 27043 (investigação de princípio a fim).\n\nNIST SP 800-86 — integração da forense à resposta a incidentes: colecionando por categoria (disco, rede, memória, software), sempre com a pergunta "qual evidência escapa primeiro?".\n\nOrdem de volatilidade (RFC 3227) — o roteiro da coleta:\n1. Registradores e cache;\n2. Memória RAM (morre ao desligar);\n3. Dados de rede (conexões ativas);\n4. Processos em execução;\n5. Arquivos temporários;\n6. Disco;\n7. Mídias removíveis e backups.\n\nErro clássico a evitar: desligar a máquina antes de capturar a RAM. Nesse instante, chaves de criptografia, processos maliciosos em memória e conexões ativas desaparecem — e com eles, parte do caso.\n\nNo laudo, citar a metodologia (ISO 27037 + SP 800-86 + ordem de volatilidade) demonstra cientificidade — o que o juiz espera e o assistente técnico da parte contrária vai tentar derrubar.',
          },
        ],
      },
      {
        title: 'Aquisição e preservação',
        description: 'Cadeia de custódia, imagem bit a bit e a anatomia do disco.',
        lessons: [
          {
            title: 'Cadeia de custódia na prática',
            description: 'Formulários, lacres, hash e o registro que sustenta (ou derruba) a prova.',
            durationMin: 20,
            content:
              'A cadeia de custódia é uma história contada em registros: cada pessoa que tocou na evidência, quando, por quê e com qual consequência para a integridade.\n\nNa prática, para cada item você registra:\n• Identificação única: número do item, descrição física (marca, modelo, serial, estado);\n• Origem: onde foi encontrado/recolhido, data e hora, quem recolheu, testemunhas quando aplicável;\n• Fotografias: estado original, conexões, número de série, lacre;\n• Hash no primeiro momento: MD5 + SHA-256 calculados imediatamente (antes de qualquer análise);\n• Transferências: cada saída/movimentação com assinatura de quem entrega e de quem recebe (art. 158-C CPP: documento com descrição e responsáveis);\n• Armazenamento: local com acesso controlado, temperatura adequada, log de acessos;\n• Descarte: só após trânsito em julgado ou autorização.\n\nErros que destroem a prova:\n• "Todo mundo examinou o notebook da vítima direto no original" — contaminação;\n• Hash calculado depois da análise: impossível provar que nada mudou;\n• Lacre sem identificação ou fotos ausentes: origem indefensável.\n\nFerramenta mínima: um formulário de cadeia de custódia (papel ou planilha com bloqueio) + o hábito de fotografar e hashear tudo. No próximo módulo, a aquisição bit a bit transforma esse registro em garantia matemática de integridade.',
          },
          {
            title: 'Aquisição forense: imagem bit a bit e verificação de hash',
            description: 'Write blocker, E01/RAW e a regra de ouro: nunca analisar o original.',
            durationMin: 25,
            content:
              'Aquisição é produzir a cópia fiel e verificável do meio — e é aqui que a perícia se separa do "conserto de computador".\n\nRegra de ouro: o original é preservado e selado. Toda análise ocorre na cópia.\n\nPasso a passo da aquisição de disco:\n1. Documente: fotos, serial, estado físico;\n2. Conecte via write blocker: hardware (Tableau, "forensic bridge") ou software que garante bloqueio de escrita — Windows montando o disco sem bloqueio altera timestamps no instante do boot;\n3. Escolha o formato:\n• RAW/DD: imagem setorial pura, universal;\n• E01 (EnCase): imagem com compressão, metadados e hash embutido — padrão de mercado;\n• AFF4: alternativa moderna;\n4. Ferramentas: FTK Imager (gratuito, ótimo para começar), DC3DD/dcfldd (linha de comando), ewfacquire (libewf);\n5. Calcule hash duplo (MD5 + SHA-256) da origem e da imagem — devem ser idênticos; registre no formulário de custódia;\n6. Selo o original e armazene. Dora em diante, só a cópia trabalha.\n\nVerificação contínua: ao exportar qualquer arquivo da imagem para o laudo, gere hash do arquivo exportado — a integridade acompanha a evidência até o final.\n\nOrdem de volatilidade na cabeça: disco é o meio estável; se a máquina está ligada e o caso envolve criptografia ou malware ativo, capture a RAM primeiro (aula 8 mostra as ferramentas).\n\nExercício: no lab, crie uma imagem E01 de um pendrive com FTK Imager, registre os hashes, abra a imagem e confirme que o original permaneceu intocado.',
            quiz: [
              {
                prompt: 'Por que o perito nunca analisa o disco original diretamente?',
                options: [
                  'Porque o original não tem espaço para o relatório',
                  'Porque qualquer acesso altera dados (timestamps, boot) e compromete a integridade da prova',
                  'Porque a análise no original é mais lenta',
                  'Porque a lei proíbe conexão de discos em computadores periciais',
                ],
                correctIndex: 1,
                explanation:
                  'Bootar ou montar o original altera estruturas e timestamps. A análise ocorre sempre na imagem verificada por hash; o original fica preservado e selado — regra básica de preservação da ISO/IEC 27037.',
              },
            ],
          },
          {
            title: 'Disco, partições e sistemas de arquivos',
            description: 'MBR/GPT, NTFS/ext4, timestamps MACB e onde os arquivos "apagados" vivem.',
            durationMin: 22,
            content:
              'Sem entender a estrutura, o perito vê só arquivos. Entendendo, vê história.\n\nEstrutura do disco:\n• MBR/GPT: tabelas de partição — onde o espaço é dividido (e onde escondem-se partições não declaradas);\n• Sistemas de arquivos: FAT/exFAT (mídia removível), NTFS (Windows), ext4 (Linux), APFS (macOS).\n\nO que o sistema de arquivos revela:\n• Timestamps (MACB no NTFS): Modified, Accessed, Changed (MFT), Born (criação) — a linha do tempo do comportamento humano no computador. Cuidado com manipulação (timestomping): comparar $MFT, USN Journal e logs do SIEM revela;\n• Deleção: quando o usuário apaga, o conteúdo permanece nos setores até sobrescrita — só a referência é removida. Ferramentas recuperam apontando os setores de volta;\n• Espaços que ninguém olha: slack space (resto do último cluster de cada arquivo), unallocated space, volume shadow copies (snapshots do Windows) e pagefile/hiberfil (pedaços de memória no disco);\n• Registro do Windows (hives: SYSTEM, SAM, SOFTWARE, NTUSER.DAT): dispositivos USB conectados, redes wi-fi, programas executados, último login — o "diário" do sistema.\n\nNo próximo módulo, o Autopsy transforma esse conhecimento em fluxo de trabalho: ingestão, timeline, busca por palavras-chave e exportação de artefatos com hash — tudo registrado para o laudo.',
          },
        ],
      },
      {
        title: 'Análise forense',
        description: 'Autopsy, memória, rede, mobile e nuvem — onde a evidência fala.',
        lessons: [
          {
            title: 'Análise com Autopsy: do caso ao relatório',
            description: 'O fluxo completo da ferramenta open source de referência.',
            durationMin: 28,
            content:
              'Autopsy (da equipe do Sleuth Kit) é a ferramenta open source mais usada para análise forense de disco — e o melhor ponto de partida profissional.\n\nFluxo de trabalho:\n1. Novo caso → nova fonte de dados: adicione a imagem E01 (não o original!);\n2. Ingestão de módulos: timeline, tipos de arquivo, hashes (identificação de arquivos conhecidos via NSRL), web history, USB, keyword search, picture analyzer;\n3. Timeline analysis: correlate eventos por MACB — momento em que "a história aparece". Procure anomalias: execução às 3h, arquivos criados e renomeados em sequência, exclusões em massa;\n4. Artefatos-chave do Windows: registro (USB, programas executados), Event Logs (logons 4624/4625, limpeza de log 1102), prefetch (programas rodados), browser history e e-mails;\n5. Busca por palavras-chave: termos do caso (nomes, valores, códigos) com regex — cuidado com falsos positivos; sempre verificar contexto;\n6. Marcadores e tags: classifique achados durante a análise — a base da parte descritiva do laudo;\n7. Exportação de evidência: cada arquivo relevante exportado com hash registrado — a ligação entre achado e prova.\n\nDisciplina de análise: anote como se alguém fosse reproduzir cada passo. Reprodutibilidade é o padrão científico que o assistente técnico da parte contrária vai cobrar.\n\nExercício: crie um cenário no lab (arquivos, navegação, um "documento sensível" copiado para pendrive), gere a imagem E01 e conduza a análise completa no Autopsy até a lista de achados numerada.',
          },
          {
            title: 'Memória e rede: análise além do disco',
            description: 'Volatility na RAM e Wireshark no tráfego — a evidência que morre em minutos.',
            durationMin: 20,
            content:
              'O disco guarda história; a memória guarda o presente. Muitos casos só se fecham com a RAM.\n\nAquisição de memória:\n• Windows: WinPMEM (acquisition driver) — executa e gera o dump;\n• Linux: LiME;\n• Regra: capture a RAM ANTES de desligar, sempre que a máquina estiver ligada e o caso justifique.\n\nAnálise com Volatility:\n• Processos e linha de comando (pslist/pstree): o malware escondido como processo legítimo aparece;\n• Conexões de rede ativas: para onde os dados iam;\n• Injeção e code hollowing: técnicas de evasão expostas;\n• Chaves de criptografia e senhas em memória: em ransomware/criptografia, decisivo;\n• Histórico de comandos e credenciais: contexto humano.\n\nRede:\n• Captura (Wireshark/tcpdump): conteúdo de tráfego do período disponível;\n• O que procurar: exfiltração (uploads anormais), C2 (beacons regulares para domínios novos), resoluções DNS suspeitas;\n• Na prática corporativa, o que existe é log: firewall, proxy, SIEM — e é dele que a linha do tempo de rede é reconstruída (por isso a retenção do Marco Civil importa).\n\nCombinação que fecha casos: disco mostra o artefato, memória mostra o processo vivo, rede mostra a comunicação. Três fontes independentes convergindo = conclusão robusta para o laudo.',
          },
          {
            title: 'Perícia mobile e evidência na nuvem',
            description: 'Celular como fonte principal, backups criptografados e logs de provedores.',
            durationMin: 20,
            content:
              'Hoje a vida digital cabe no bolso — e a prova principal costuma ser o celular.\n\nPerícia mobile:\n• Aquisição lógica: via protocolo do sistema (ADB no Android; backup do iTunes no iOS) — extrai dados acessíveis ao sistema;\n• Aquisição física: cópia bit a bit da partição — mais profunda, mais restritiva (bootloaders bloqueados, criptografia);\n• Ferramentas comerciais dominam o mercado (Cellebrite, Oxygen), mas fluxos open source cobrem muitos cenários;\n• Cuidados: bloquear rádio (Faraday/airplane + IMEI), baterias, e LEMBRAR que senha do dispositivo decide o alcance da perícia;\n• Fontes ricas: chats, geolocalização, fotos com metadados, backups de apps.\n\nEvidência na nuvem:\n• E-mail corporativo, storage (Drive/OneDrive), apps SaaS: cópias via ferramentas de exportação do próprio serviço ou do administrador — preservando metadados;\n• Logs de provedores de internet/aplicação: art. 15 do Marco Civil (6/3 meses de retenção) — acesso por requisição legal;\n• Cooperação internacional: quando o provedor está fora do Brasil — acordos de cooperação (MLA) e a Convenção de Budapeste no contexto de crimes cibernéticos;\n• LGPD no caminho: o tratamento desses dados na investigação também precisa de base legal e proporcionalidade (próximo módulo).\n\nNota de perícia: a integridade continua reina — exportações com hash, registro de cadeia de custódia e metodologia descrita, mesmo que a origem seja um JSON da nuvem.',
          },
        ],
      },
      {
        title: 'Laudo e litígio',
        description: 'LGPD na investigação, estrutura do laudo e o caso integrador final.',
        lessons: [
          {
            title: 'LGPD, sigilo e limites da investigação',
            description: 'Investigar sem virar réu: bases legais, privacidade e limites práticos.',
            durationMin: 18,
            content:
              'O perito e a empresa investigadora também tratam dados pessoais — e podem responder por exagero.\n\nBases legais na investigação (art. 7º LGPD):\n• Obrigação legal/cumprimento de ordem judicial: a base mais limpa;\n• Legítimo interesse do controlador: investigação interna proporcional (fraude documentada, não "pesquisa geral");\n• Exercício regular de direitos em processo: perícia constituída nos autos.\n\nLimites constitucionais e legais:\n• Inviolabilidade de comunicações (art. 5º, X e XII, CF): quebra de sigilo de e-mail/telefone exige ordem judicial — na esfera privada, o alcance é o que a política interna e a lei permitem;\n• Intercepts: interceptação telefônica é privativa de autoridade com autorização judicial (Lei 9.296/96);\n• Dados sensíveis (art. 5º, II LGPD): proporcionalidade redobrada.\n\nTrabalho e BYOD — a zona cinzenta:\n• E-mail e equipamento corporativo: monitoramento possível com política interna clara, transparência e proporcionalidade — a jurisprudência trabalhista tem aceitado prova de e-mail corporativo;\n• Dispositivo pessoal (BYOD) usado para trabalho: fronteira delicada — a política de BYOD escrita é o que separa investigação legítima de violação de privacidade.\n\nChecklist de conformidade da investigação: base legal identificada, escopo mínimo necessário, políticas aplicáveis citadas, registro de cadeia de custódia e anonimização de terceiros não envolvidos quando possível. Investigação limpa é investigação que sobrevive ao processo.',
          },
          {
            title: 'O laudo pericial: estrutura e sustentação',
            description: 'Quesitos, metodologia, conclusões e como defender o documento em juízo.',
            durationMin: 22,
            content:
              'O laudo é o produto final da perícia — e a peça que você terá de defender oralmente.\n\nEstrutura robusta:\n1. Identificação: processo, autos, partes, quesitos recebidos, nomeação e qualificação do perito;\n2. Histórico: resumo objetivo do caso e do que foi solicitado;\n3. Material examinado: itens com cadeia de custódia citada (itens, hashes, lacres);\n4. Metodologia: normas e ferramentas (ISO/IEC 27037, NIST SP 800-86, Autopsy versão X, Volatility) — reprodutível;\n5. Análise: cada achado com evidência (print, tabela, hash), numerado e rastreável; separar fato de interpretação;\n6. Quesitos respondidos: um por um, com remissão aos achados;\n7. Conclusões: objetivas, tecnicamente fundamentadas, sem juízo de direito (perito diz o quê, não quem é culpado);\n8. Anexos: hashes, inventários, glossário.\n\nBoas práticas de redação: linguagem clara (o juiz não é técnico), cada afirmação com fonte, nenhuma afirmação sem evidência, não especular além do material.\n\nSustentação: no processo, a parte contrária pode impugnar (art. 480 CPC) e produzir parecer do assistente técnico. Sua defesa é metodológica: cadeia de custódia completa, hashes conferidos, ferramentas citadas com versão, passos reproduzíveis. Laudo metodológico sobrevive; laudo conclusivo de "achismo" morre no primeiro parecer contrário.\n\nDica de carreira: os melhores laudos são lidos como relatórios de engenharia — fatos numerados, evidência anexada, conclusão curta.',
          },
          {
            title: 'Caso integrador: exfiltração de dados por colaborador',
            description: 'Simulação completa: da demissão ao laudo, com o enquadramento LGPD e penal.',
            durationMin: 20,
            content:
              'Vamos juntar a trilha num cenário realista. Situação: colaborador do comercial pediu demissão e, na última semana, copiou a base de clientes (pessoais) para um pendrive e enviou planilhas para e-mail pessoal. A empresa suspeita e quer: entender o que saiu, proteger os dados e avaliar medidas.\n\nFase técnica (o que você executaria):\n1. Preservar: imagem bit a bit do notebook corporativo (write blocker + E01 + hash) e captura da RAM se ligado; exportar logs do e-mail corporativo e do SIEM;\n2. Cadeia de custódia: formulário, fotos, lacres, transferências assinadas;\n3. Análise: Autopsy — timestamps de cópia para USB (registro do Windows: dispositivo conectado), artefatos de acesso à base, Event Logs, e-mail enviados; memória se necessário;\n4. Laudo: achados numerados com hash, metodologia citada, quesitos respondidos.\n\nFase jurídica (o que a empresa decide com o jurídico):\n• LGPD: houve violação de dados? A partir do art. 48, avaliar risco relevante e comunicação à ANPD (prazo de 3 dias úteis do conhecimento, conforme Regulamento da ANPD) e aos titulares afetados;\n• Trabalho: advertência/rescisão por justa causa conforme política e provas; uso da prova do e-mail corporativo na esfera trabalhista;\n• Penal: possível violação de sigilo de dados (art. 154, §4º CP) — registro de BO com as evidências preservadas;\n• Civil: eventual ação de indenização e medida para proteção dos dados exfiltrados.\n\nA síntese da trilha: técnica sem prova não sustenta decisão; prova sem contexto jurídico não protege ninguém. O curso 4 fecha o ciclo com a operação formal da LGPD — onde este caso continua.',
          },
        ],
      },
    ],
  },

  // ============================================================
  // CURSO 4 — Direito Digital Aplicado
  // ============================================================
  {
    title: 'Direito Digital Aplicado: LGPD, ANPD e Casos Reais',
    description:
      'A operação do direito digital no dia a dia: bases legais e programa de conformidade, gestão jurídica de incidentes com comunicação à ANPD, contratos entre controladores e operadores, jurisprudência de vazamentos e as frentes novas — direito do trabalho digital, criptoativos e inteligência artificial.',
    level: 'INTERMEDIARIO',
    price: 199,
    coverUrl: '/uploads/seed/course-cyber-direito.png',
    themes: [
      {
        title: 'LGPD operacional',
        description: 'Do mapa normativo ao programa de conformidade que a ANPD espera ver.',
        lessons: [
          {
            title: 'Ecossistema normativo digital brasileiro',
            description: 'Quem manda no quê: CF, LGPD, Marco Civil, CDC e as normas da ANPD.',
            durationMin: 18,
            content:
              'Antes de operar, você precisa do mapa. O direito digital brasileiro é um ecossistema de normas que se complementam:\n\n• Constituição Federal: art. 5º (X — privacidade; XII — sigilo de comunicações), base de tudo;\n• LGPD (Lei 13.709/2018): tratamento de dados pessoais, deveres dos agentes, direitos dos titulares, ANPD e sanções;\n• Marco Civil da Internet (Lei 12.965/2014): princípios da rede, responsabilidade de provedores (arts. 14 e 19), retenção de logs (art. 15);\n• Código de Defesa do Consumidor: relações de consumo digitais — responsabilidade por defeito do serviço (art. 14), teoria do risco;\n• Código Civil: responsabilidade civil (art. 927), contratos;\n• Código Penal: crimes digitais — invasão de dispositivo (154-A), violação de sigilo (154), fraude eletrônica (171, §2º-A);\n• Lei 14.478/2022: marco legal dos criptoativos;\n• Regulamentações da ANPD: dosimetria de sanções (2023), comunicação de incidentes (2024), transferência internacional (2024).\n\nComparação com o mundo: a LGPD é prima da GDPR europeia — mesmos princípios, sanções menores (R$ 50 mi/infração vs 4% do faturamento global), mas estrutura de agência fiscalizadora já operante.\n\nNa prática de consultoria: cada projeto começa com este mapa — qual norma rege o problema, quem fiscaliza, qual tribunal julga. O restante do curso percorre esse mapa com profundidade operacional.',
          },
          {
            title: 'Agentes, bases legais e direitos do titular',
            description: 'Controlador, operador, encarregado — e as respostas que o prazo cobra.',
            durationMin: 22,
            content:
              'O triângulo operacional da LGPD:\n• Controlador: decide o porquê e o como do tratamento (a empresa que capta);\n• Operador: trata dados por instrução do controlador (fornecedor de TI, processadora);\n• Encarregado (DPO): canal entre organização, titulares e ANPD — a identificação dele é obrigatória e pública (art. 41).\n\nBases legais (art. 7º) — as mais usadas na prática:\n• Execução de contrato: dados para fornecer o serviço contratado;\n• Obrigação legal e regulatória: fiscais, trabalhistas, KYC;\n• Legítimo interesse: segurança da informação, prevenção a fraude — exige balanceamento documentado;\n• Consentimento: livre, informado e inequívoco — a base mais frágil na prática, pois pode ser revogada a qualquer momento (art. 8º, §5º).\n\nDireitos do titular (art. 18) e o que cobram de operação:\n• Confirmação e acesso, correção, anonimização/bloqueio/eliminação de desnecessários, portabilidade, informação sobre compartilhamentos, não discriminação, revogação do consentimento;\n• Prazo de atendimento: 15 dias (art. 19) — curto de verdade. Precisa de processo: canal único, registro, prazo interno, modelo de resposta, escalonamento.\n\nDSAR (data subject access request) bem operado é vantagem competitiva: demonstra maturidade e reduz litígio. Mal operado vira reclamação na ANPD e prova de desorganização no processo cível.',
          },
          {
            title: 'Programa de conformidade: inventário, ROPA e RIPD',
            description: 'O passo a passo do programa que sustenta a defesa na ANPD e em juízo.',
            durationMin: 25,
            content:
              'Conformidade não é documento de gaveta: é programa com evidência. A sequência que funciona:\n\n1. Inventário de dados: mapear quais dados pessoais existem, onde, por quê, quem acessa, quanto tempo ficam. Sem isso, nada do resto é real;\n2. ROPA (registro das operações de tratamento): o inventário estruturado — finalidade, base legal (art. 7º/11), categorias de titulares e dados, compartilhamentos, retenção;\n3. Análise de risco por operação: o que acontece se vazar? qual sensibilidade? qual volume?;\n4. RIPD (relatório de impacto, arts. 5º, XVII e 38): obrigatório quando o tratamento for de alto risco — dados sensíveis em escala, perfilamento, decisões automatizadas, monitoramento;\n5. Políticas e papéis: política de privacidade, política de segurança, contrato com operadores (art. 39), encadeado designado (art. 41);\n6. Medidas técnicas: o art. 46 remete ao curso 2 — SGSI, controles, logs;\n7. Treinamento e cultura: o programa que ninguém conhece não existe;\n8. Revisão periódica: mudança de sistema é mudança de tratamento.\n\nExtensão natural: ISO/IEC 27701 (privacidade sobre a 27001) para organizações que precisam demonstrar formalmente.\n\nPor que fazer: na dosimetria da ANPD, programa de conformidade demonstrável é atenuante; no processo cível por vazamento, é a diferença entre negligência e diligência razoável. E na prática comercial: clientes grandes e licitações já exigem evidência de conformidade.',
          },
        ],
      },
      {
        title: 'Incidentes sob a ótica jurídica',
        description: 'Arts. 46-48, o playbook jurídico e a matemática das sanções.',
        lessons: [
          {
            title: 'Arts. 46 a 48 da LGPD: segurança como obrigação legal',
            description: 'O dever de proteção, o contrato com operadores e a comunicação de incidente.',
            durationMin: 20,
            content:
              'Três artigos concentram a operação jurídico-técnica de segurança:\n\nArt. 46 — o dever de segurança: medidas técnicas e administrativas aptas a proteger dados de acessos e tratamentos não autorizados e de situações acidentais ou ilícitas. Dois pontos que se cobram em juízo:\n• Proporcionalidade: a medida esperada de um banco não é a de uma padaria — mas toda organização precisa do mínimo (controle de acesso, backup, logs, resposta);\n• Aptidão: política sem execução não é medida. Auditoria pede evidência.\n\nArt. 39 — contrato com operador: quando o tratamento é por operador (fornecedor), o contrato deve conter: objeto, duração, natureza e finalidade, público e categorias de dados, obrigações e responsabilidade, e o direito de auditoria. Fornecedor sem contrato nos moldes do art. 39 é risco próprio do controlador.\n\nArt. 48 — comunicação de incidente: quando o incidente puder gerar risco ou dano relevante aos titulares, comunicar:\n• À ANPD e ao titular: descrição da natureza dos dados afetados, titulares envolvidos, riscos à segurança, motivos da demora (se comunicação não imediata), medidas de mitigação;\n• O Regulamento de comunicação de incidentes de segurança da ANPD (Resolução CD/ANPD nº 15/2024) fixou o prazo: 3 dias úteis a partir do conhecimento do incidente, com formulário próprio e critérios de risco;\n• Comunicação aos titulares: linguagem clara, riscos concretos, medidas de proteção recomendadas.\n\nErro recorrente que virou tema de processo: subavaliar o risco para não comunicar. A subavaliação documentada piora a posição na dosimetria — comunicar com metodologia é mais seguro que não comunicar por conveniência.',
          },
          {
            title: 'Playbook jurídico de incidente',
            description: 'Cronologia decisória das primeiras 72 horas e o que nunca fazer.',
            durationMin: 22,
            content:
              'O incidente jurídico perfeito é o bem cronometrado. Cronologia de referência:\n\nHora 0 — conhecimento e preservação:\n• Formalize o conhecimento (registro com data/hora: relatório interno, alerta do SIEM, denúncia) — o relógio regulamentar começa aqui;\n• Preserve: logs, imagens, evidências (curso 3). NUNCA apague logs para "limpar o ambiente": é destruição de prova e agravante;\n• Ative a célula de crise: TI + jurídico + comunicação + diretoria, com papéis escritos.\n\n24-48h — entendimento e decisão:\n• Delimitar: quais dados, quais titulares, sensibilidade, volume, exfiltração ou só acesso;\n• Avaliar risco relevante: sensibilidade, escala, facilidade de identificação, consequências (fraude, discriminação, constrangimento);\n• Se relevante: iniciar comunicação à ANPD pelo formulário do Regulamento (3 dias úteis!) e preparar comunicação aos titulares;\n• Decisões de litígio: BO (crime), medidas cautelares, assessoria externa;\n• Comunicação única de versão externa: imprensa e partes recebem a mesma versão factual, sem especulação.\n\n72h+ — execução e registro:\n• Comunicar titulares com linguagem clara e medidas concretas (trocar senhas, oferta de suporte);\n• Documento único do incidente: linha do tempo, decisões e justificativas, comunicação protocolada — será a base da defesa na ANPD e no eventual processo;\n• Pós-incidente: causa raiz e plano de melhoria com prazo (o relatório que atenua).\n\nO que pesa na dosimetria: velocidade de comunicação, transparência, ações de mitigação efetivas e cooperação. O que agrava: ocultação, demora sem justificativa, repetição do mesmo incidente.',
          },
          {
            title: 'Sanções da ANPD: dosimetria e defesa',
            description: 'O catálogo do art. 52, a matemática da multa e como se defender.',
            durationMin: 20,
            videoUrl: 'https://www.youtube.com/watch?v=EWoe_IUmd3A',
            content:
              'A ANPD é desde 2024 plenamente autorizada a aplicar sanções — e o processo sancionador já é realidade.\n\nCatálogo do art. 52 (aplicado no Regulamento de dosimetria — Resolução nº 4/2023):\n• Advertência com prazo;\n• Multa simples: até 2% do faturamento da pessoa jurídica, limitada a R$ 50 milhões por infração;\n• Multa diária;\n• Publicização da infração;\n• Bloqueio e eliminação dos dados;\n• Suspensão parcial ou total do banco de dados e da atividade de tratamento.\n\nA dosimetria em três camadas:\n1. Classificação da conduta: leve, média, grave ou gravíssima — pela natureza dos dados, número de titulares, consequências;\n2. Base de cálculo: faturamento do grupo no último exercício;\n3. Circunstâncias: atenuantes (programa de conformidade, cooperação, comunicação rápida, reparação) e agravantes (ocultação, repetição, lucro com a infração, dados sensíveis em escala).\n\nO processo sancionador segue contraditório: notificação → defesa → decisão → recurso. Sua defesa técnica constrói-se ANTES: evidência de controles (curso 2), relatórios de incidente (playbook anterior), atestados de conformidade.\n\nE o risco paralelo nunca sai de cena: mesmo com multa menor, o litígio cível coletivo é a conta mais pesada — como o mundo aprendeu com Equifax. A gestão jurídica de dados hoje é gestão de risco financeiro.',
          },
        ],
      },
      {
        title: 'Contratos e terceiros',
        description: 'Operadores, cláusulas-padrão internacionais e a jurisprudência que cobra a conta.',
        lessons: [
          {
            title: 'Controladores, operadores e transferência internacional',
            description: 'Art. 39 na cláusula, SCCs da ANPD e due diligence de fornecedores.',
            durationMin: 22,
            content:
              'A maior parte dos vazamentos nasce fora de casa: no fornecedor. O direito organiza essa fronteira.\n\nContrato controlador ↔ operador (art. 39, §1º): cláusulas obrigatórias — objeto e duração, natureza e finalidade, categorias de dados e titulares, obrigações do operador, responsabilidade de cada parte, direito de auditoria e uso de suboperadores com autorização. Sem essas cláusulas, o controlador assume risco que não precisaria.\n\nVazamento dentro de cadeia: o controlador continua responsável perante titulares e ANPD — a resposta "culpa do fornecedor" mitiga internamente (direito de regresso), não externamente.\n\nTransferência internacional de dados (arts. 33-36): dados de titulares no Brasil só saem com adequação — países com nível de proteção reconhecido, ou mecanismos aprovados pela ANPD. O Regulamento de transferência internacional (Resolução nº 19/2024) consolidou os instrumentos, incluindo as cláusulas-padrão contratuais (SCCs) — o caminho mais usado por empresas que usam SaaS e nuvens internacionais.\n\nDue diligence de fornecedor — o checklist mínimo antes de contratar:\n• Base legal e finalidade declaradas; tratamento mínimo necessário;\n• Segurança: certificações (ISO 27001/SOC 2), gestão de incidentes, prazo de comunicação contratual (art. 48 em cascata);\n• Localização dos dados e mecanismo de transferência;\n• Contrato nos moldes do art. 39 + auditoria;\n• Plano de saída: portabilidade e eliminação no fim do contrato.\n\nExercício: pegue um SaaS que sua organização usa e verifique item a item. A lacuna encontrada é seu primeiro entregável de consultoria.',
          },
          {
            title: 'Jurisprudência de vazamento de dados',
            description: 'Como os tribunais têm decidido: responsabilidade objetiva, dano moral e defesa.',
            durationMin: 22,
            content:
              'A teoria você já viu (art. 927 CC + art. 14 CDC). O que os tribunais têm feito com ela:\n\nLinhas que se consolidam:\n• Responsabilidade objetiva em vazamento comprovado: a empresa responde independentemente de culpa — a discussão é nexo e dano;\n• Dano moral individual: os TJs têm condenado quando o vazamento é comprovado e afeta o titular, com valores típicos de alguns milhares de reais por pessoa; decisões divergem sobre o dano "in re ipsa" (presumido) — boa parte exige ao menos demonstração de exposição concreta;\n• Ação civil pública e danos morais coletivos: MP e associações litigam por grupos — valores e destinação variam;\n• Falha de segurança não caracterizada: quando a empresa demonstra controles proporcionais (MFA, monitoramento, resposta rápida, comunicação) e o ataque é sofisticado, a condenação pode não ocorrer — a diligência demonstrada é a defesa central;\n• Culpa exclusiva/concorrente do titular: senhas reutilizadas e phished — concorrência de culpa pode reduzir o valor, não eliminar automaticamente.\n\nO roteiro de prova em qualquer caso: (1) o vazamento ocorreu e afetou o autor (perícia!); (2) a empresa tinha dever (art. 46 LGPD + CDC); (3) havia ou não controles proporcionais; (4) consequência para o titular.\n\nComo montar (ou evitar) a condenação: a defesa é técnica e preventiva — evidência documental de controles, resposta ao incidente e comunicação. Para o consultor que integra a trilha: cada controle implantado no curso 2 é argumento de defesa pré-pago.',
          },
        ],
      },
      {
        title: 'Frentes aplicadas',
        description: 'Trabalho digital, criptoativos, IA e a carreira que fecha a trilha.',
        lessons: [
          {
            title: 'Direito do trabalho digital e monitoramento',
            description: 'E-mail corporativo, BYOD e produtividade remota entre privacidade e controle.',
            durationMin: 18,
            content:
              'O poder diretivo do empregador (organizar, fiscalizar) encontra a privacidade do trabalhador (art. 5º, X, CF). A fronteira na prática:\n\nE-mail e equipamento corporativo:\n• Jurisprudência trabalhista amplamente aceita: ferramenta fornecida pelo empregador tem uso presumidamente profissional — o monitoramento com política interna transparente pode gerar prova válida;\n• Condições que sustentam a prova: política escrita, conhecimento prévio do empregado, proporcionalidade e motivação (investigação específica, não pescaria).\n\nDispositivo pessoal (BYOD) e canais privados:\n• Zona de risco: mensagem pessoal no WhatsApp e conta pessoal de e-mail têm proteção reforçada — prova obtida por acesso indevido pode ser ilícita (prova ilícita, art. 5º, LVI, CF) e gerar responsabilidade do empregador (LGPD incluída);\n• A política de BYOD escrita define: separação de dados, apagamento remoto de container corporativo, aviso de monitoramento do container.\n\nTrabalho remoto e telemetria de produtividade:\n• Contadores de teclas, webcam, "checagem de atividade": juridicamente perigosos — dado pessoal em excesso (princípio da necessidade), possível dado sensível (saúde) e ambiente doméstico invadido;\n• Alternativa conforme: gestão por entregas, logs agregados com finalidade declarada, transparência.\n\nLGPD na relação de emprego: empregado é titular — o tratamento dos seus dados segue as bases legais (execução de contrato, obrigação legal, legítimo interesse documentado) e a política de privacidade interna vale como documento de conformidade e de defesa.',
          },
          {
            title: 'Criptoativos, IA e novas frentes',
            description: 'Lei 14.478/2022, crimes com cripto e o estado da regulação de IA no Brasil.',
            durationMin: 18,
            content:
              'As frentes novas chegam rápido — e seguem o padrão da trilha: técnica + norma + caso.\n\nCriptoativos:\n• Lei 14.478/2022: marco legal dos ativos virtuais e provedores de serviços (VASPs), regulamentado pelo Decreto 11.563/2023 — supervisão atribuída ao BCB;\n• Crime: apropriação e fraude com ativos virtuais ganharam tratamento próprio;\n• Perícia (ponte com o curso 3): rastreamento on-chain, análise de fluxos em exchanges, cadeia de custódia de chaves e wallets — nicho de altíssima demanda;\n• LGPD: exchanges tratam dados pessoais em escala — KYC + blockchain pseudônimo é combinação delicada.\n\nInteligência artificial:\n• Hoje: LGPD já se aplica — decisões automatizadas exigem revisão humana e transparência (art. 20), e bases de treinamento precisam de base legal;\n• Em tramitação: PL 2338/2023 (regulação de IA no Brasil) avançou no Senado e segue na Câmara — modelo de risco semelhante ao europeu; acompanhe o estado da arte antes de citar em trabalho;\n• Riscos jurídicos já atuais: vieses discriminatórios, vazamento via prompts, alucinação em decisão sobre titular, uso de dados sem finalidade declarada.\n\nOutras frentes em ascensão: telemetria de veículos, wearables de saúde, IoT residencial, pagamentos instantâneos e fraude (a ponte Pix-crime-perícia é pauta diária).\n\nMétodo para acompanhar o futuro: mesma grade da trilha — qual técnica nova, qual norma aplica-se, quem fiscaliza, qual caso recente. A grade não muda; o conteúdo sim.',
          },
          {
            title: 'Carreira: DPO, consultoria e perícia',
            description: 'Os três caminhos da trilha, certificações e como posicionar o serviço.',
            durationMin: 15,
            content:
              'Você terminou a trilha com um perfil raro: entende técnica, prova e direito. Três caminhos se abrem — e eles combinam:\n\n1. Encarregado/DPO e consultoria de conformidade:\n• O que faz: rodar o programa do módulo 1 deste curso em organizações reais;\n• Cliente típico: PMEs com LGPD no radar e zero estrutura; jurídicos de médias e grandes;\n• Certificações úteis: ISO/IEC 27001 (Implementação/Auditor), ISO/IEC 27701, certificações de privacidade (IAPP — CIPP/E + CIPM são referências internacionais).\n\n2. Perito judicial e assistente técnico:\n• O que faz: a perícia do curso 3 — em processos criminais, cíveis e trabalhistas;\n• Caminho: qualificação técnica comprovada, inscrição/avaliação em tribunais e cadastro como perito; assistente técnico por indicação de escritórios;\n• Certificações: forense digital (chsum/forensics certificações), além da bagagem da trilha.\n\n3. Segurança defensiva corporativa (o curso 2): analista/engenheiro de segurança, consultor de implantação de controles — a base que sustenta os outros dois caminhos.\n\nPosicionamento do perfil híbrido (o seu):\n• Oferta única: "diagnóstico integrado técnica + LGPD + plano de 90 dias" — exatamente o formato dos seus mini-projetos;\n• Portfólio: os entregáveis dos cursos (diagnóstico CSF, playbook, relatório de perícia simulada);\n• Mentoria 1:1 (aqui na trilha) para calibrar oferta, precificação e primeiros clientes.\n\nMercado: vazio enorme entre advogados que não entendem técnica e técnicos que não dominam a norma. A ponte é escassa — e você construiu a ponte.',
          },
          {
            title: 'Projeto final da trilha e próximos passos',
            description: 'O diagnóstico integrado completo — e como transformar trilha em carreira.',
            durationMin: 12,
            content:
              'Projeto final: o diagnóstico integrado de uma organização fictícia — mas com rigor real.\n\nO cenário: e-commerce médio (120 colaboradores, 800 mil clientes, nuvem AWS, fornecedores de pagamento e logística, sem DPO formal).\n\nEntregáveis:\n1. Diagnóstico técnico (curso 2): mapeamento CSF + Anexo A com lacunas e plano 30/60/90;\n2. Diagnóstico LGPD (curso 4): inventário resumido, ROPA de 10 operações críticas, base legal por operação, política de incidente com o playbook jurídico, contrato-modelo com operador (art. 39);\n3. Plano de resposta: quando vazar — o fluxo completo art. 48 (ANPD + titulares) com prazos;\n4. Painel executivo: 1 página em linguagem de negócio — riscos, custos estimados de incidente, prioridades.\n\nRubrica de avaliação: evidência em cada afirmação; normas citadas corretamente (artigo e dispositivo); viabilidade real do plano; clareza executiva.\n\nPróximos passos:\n• Revise os quizzes e seus anotações — o conteúdo da trilha é material de consulta permanente;\n• Leve o projeto final para a mentoria 1:1: revisão linha a linha do seu diagnóstico;\n• Coloque os entregáveis no portfólio e atualize o perfil público (aqui no MentorHub) com a nova especialização;\n• Três casos reais para estudar por conta: as Resoluções da ANPD publicadas, um acórdão recente de vazamento no seu TJ e o relatório anual de incidentes do CERT.br.\n\nParabéns pela trilha completa — técnica, perícia e direito no mesmo repertório. Esse é o perfil que o mercado procura e não encontra.',
          },
        ],
      },
    ],
  },
]

async function main() {
  console.log('🔎 Buscando mentor Gustavo Novaes Cruz...')
  const user = await db.user.findUnique({
    where: { email: MENTOR_EMAIL },
    include: { mentorProfile: true },
  })
  if (!user) throw new Error(`Usuário ${MENTOR_EMAIL} não encontrado`)
  if (!user.mentorProfile) throw new Error(`Usuário ${MENTOR_EMAIL} não possui MentorProfile`)
  const mentorId = user.mentorProfile.id
  console.log(`   mentorId: ${mentorId}`)

  const existing = await db.track.findFirst({ where: { mentorId, title: TRACK_TITLE } })
  if (existing) {
    console.log(`✅ Trilha "${TRACK_TITLE}" já existe (id ${existing.id}) — nada a fazer.`)
    return
  }

  const createdCourseIds: string[] = []

  await db.$transaction(async (tx) => {
    for (const c of courses) {
      const course = await tx.course.create({
        data: {
          mentorId,
          title: c.title,
          description: c.description,
          category: 'Tecnologia',
          level: c.level,
          price: c.price,
          coverUrl: c.coverUrl,
          isPublished: true,
        },
      })
      createdCourseIds.push(course.id)
      console.log(`📘 Curso: ${c.title} (${course.id})`)

      for (let t = 0; t < c.themes.length; t++) {
        const themeDef = c.themes[t]
        const theme = await tx.courseTheme.create({
          data: {
            courseId: course.id,
            title: themeDef.title,
            description: themeDef.description,
            order: t + 1,
          },
        })

        let lessonOrder = 0
        for (const l of themeDef.lessons) {
          lessonOrder += 1
          const kind = l.videoUrl ? 'RECORDED' : 'TEXT'
          const lesson = await tx.lesson.create({
            data: {
              courseId: course.id,
              themeId: theme.id,
              title: l.title,
              description: l.description,
              kind,
              videoUrl: l.videoUrl ?? null,
              content: l.content ?? null,
              attachments: '[]',
              durationMin: l.durationMin,
              order: lessonOrder,
            },
          })

          if (l.quiz && l.quiz.length > 0) {
            for (let q = 0; q < l.quiz.length; q++) {
              const item = l.quiz[q]
              await tx.quiz.create({
                data: {
                  lessonId: lesson.id,
                  prompt: item.prompt,
                  options: JSON.stringify(item.options),
                  correctIndex: item.correctIndex,
                  explanation: item.explanation,
                  order: q + 1,
                },
              })
            }
          }
        }
        console.log(`   └ Tema: ${themeDef.title} (${themeDef.lessons.length} aulas)`)
      }
    }

    const track = await tx.track.create({
      data: {
        mentorId,
        title: TRACK_TITLE,
        description:
          'Formação completa que une a técnica defensiva ao enquadramento jurídico: dos fundamentos da segurança da informação à perícia de provas e à operação da LGPD. Base sólida em NIST, ISO/IEC 27001, LGPD e ANPD — sempre com casos reais mostrando o que quebrou, quais controles faltaram e como o Judiciário respondeu.',
        category: 'Tecnologia',
        level: 'INICIANTE',
        price: 499,
        coverUrl: '/uploads/seed/trilha-cyber-direito.png',
        isPublished: true,
        items: {
          create: createdCourseIds.map((courseId, i) => ({
            type: 'COURSE',
            courseId,
            order: i + 1,
          })),
        },
      },
    })
    console.log(`🛤️  Trilha criada: ${track.title} (${track.id})`)
  })

  console.log('')
  console.log('📊 Resumo:')
  let lessonsTotal = 0
  let quizzesTotal = 0
  let videosTotal = 0
  for (const c of courses) {
    for (const t of c.themes) {
      lessonsTotal += t.lessons.length
      for (const l of t.lessons) {
        quizzesTotal += l.quiz?.length ?? 0
        if (l.videoUrl) videosTotal += 1
      }
    }
  }
  console.log(`   1 trilha · 4 cursos · 10 temas · ${lessonsTotal} aulas · ${videosTotal} vídeos · ${quizzesTotal} questões de quiz`)
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
