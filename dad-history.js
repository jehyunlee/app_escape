import historySources from "./assets/wikipedia/history-sources.json" with { type: "json" };

const passagesById = new Map(
  historySources.passages.map((passage) => [passage.id, passage]),
);
const articlesById = new Map(
  historySources.articles.map((article) => [article.id, article]),
);

const buildQuestion = (spec) => {
  const passage = passagesById.get(spec.passageId);
  if (!passage) throw new Error(`Missing history passage: ${spec.passageId}`);
  const article = articlesById.get(passage.articleId);
  if (!article)
    throw new Error(`Missing history article: ${passage.articleId}`);
  return {
    id: spec.id,
    topic: "history",
    passageId: passage.id,
    passage: passage.text,
    prompt: spec.prompt,
    options: spec.options,
    answer: spec.answer,
    explanation: spec.explanation,
    difficulty: spec.difficulty,
    source: {
      title: article.title,
      url: article.url,
      revisionId: article.revisionId,
      revisionUrl: article.revisionUrl,
      revisionTimestamp: article.revisionTimestamp,
      retrievedAt: article.retrievedAt,
      attribution: "Wikipedia contributors",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    },
  };
};

const questionSpecs = [
  {
    id: "dad-history-v2-071",
    passageId: "apollo-11-5",
    prompt: "What does the passage state about crucial decision?",
    options: [
      "The Soviet Union appeared to be winning the Space Race, but its early lead was overtaken by the US Gemini program and Soviet failure to develop the N1 launcher, which would have been comparable to the Saturn V.",
      "The initial crew assignment of Commander Neil Armstrong, Command Module Pilot (CMP) Jim Lovell, and Lunar Module Pilot (LMP) Buzz Aldrin on the backup crew for Apollo 9 was officially announced on November 20, 1967.",
      "An early and crucial decision was choosing lunar orbit rendezvous over both direct ascent and Earth orbit rendezvous.",
      "In the late 1950s and early 1960s, the United States was engaged in the Cold War, a geopolitical rivalry with the Soviet Union.",
    ],
    answer: 2,
    explanation:
      "지문은 “An early and crucial decision was choosing lunar orbit rendezvous over both direct ascent and Earth orbit rendezvous.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 3,
  },
  {
    id: "dad-history-v2-083",
    passageId: "renaissance-3",
    prompt:
      "What term did the era's polymaths inspire, according to the passage?",
    options: [
      "The Reformation",
      "Renaissance man",
      "The Counter-Reformation",
      "The Baroque period",
    ],
    answer: 1,
    explanation:
      "레오나르도 다 빈치와 미켈란젤로 같은 만능 학자들이 '르네상스적 인간'이라는 표현을 낳았다고 지문은 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-069",
    passageId: "apollo-11-3",
    prompt: "What does the passage state about United States?",
    options: [
      "In the late 1950s and early 1960s, the United States was engaged in the Cold War, a geopolitical rivalry with the Soviet Union.",
      "An early and crucial decision was choosing lunar orbit rendezvous over both direct ascent and Earth orbit rendezvous.",
      "Project Apollo was abruptly halted by the Apollo 1 fire on January 27, 1967, in which astronauts Gus Grissom, Ed White, and Roger B.",
      "The Soviet Union appeared to be winning the Space Race, but its early lead was overtaken by the US Gemini program and Soviet failure to develop the N1 launcher, which would have been comparable to the Saturn V.",
    ],
    answer: 0,
    explanation:
      "지문은 “In the late 1950s and early 1960s, the United States was engaged in the Cold War, a geopolitical rivalry with the Soviet Union.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-112",
    passageId: "scientific-revolution-8",
    prompt:
      "According to Kuhn and Grant, what foundation was the Scientific Revolution built upon?",
    options: [
      "The abolition of the medieval university system",
      "Translations of Greek and Arabic learning into Latin and the emergence of the medieval university",
      "The invention of the printing press alone",
      "The discovery doctrine established by European courts",
    ],
    answer: 1,
    explanation:
      "지문은 쿤과 그랜트가 그리스·아랍 학문의 라틴어 번역과 중세 대학의 등장을 과학혁명의 토대로 본다고 설명합니다.",
    difficulty: 3,
  },
  {
    id: "dad-history-v2-013",
    passageId: "magna-carta-1",
    prompt: "Where and when was Magna Carta sealed?",
    options: [
      "At Runnymede near Windsor on 15 June 1215",
      "At Lambeth at the end of the 1217 war",
      "At Runnymede in 1297",
      "At Windsor on 15 June 1225",
    ],
    answer: 0,
    explanation: "1215년 6월 15일 윈저 근처 러니미드에서 존 왕이 봉인했습니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-001",
    passageId: "printing-press-1",
    prompt:
      "Who is identified as the inventor of the press, and approximately when?",
    options: [
      "Johannes Gutenberg around 1440",
      "Johannes Gutenberg around 1814",
      "Friedrich Koenig around 1440",
      "Richard M. Hoe around 1843",
    ],
    answer: 0,
    explanation:
      "지문은 독일 금세공인 요하네스 구텐베르크가 1440년경 발명했다고 말합니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-124",
    passageId: "silk-production-history-4",
    prompt:
      "What reduced the prevalence of silk in the 20th century, according to this passage?",
    options: [
      "The end of the Hanseatic League",
      "A ban on silk exports from China",
      "The rise of imitation fabrics such as nylon and polyester",
      "The fall of the Roman Republic",
    ],
    answer: 2,
    explanation:
      "지문은 나일론과 폴리에스터 같은 인조 섬유의 등장이 비단의 보급을 줄였다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-036",
    passageId: "silk-road-6",
    prompt: "What does the passage state about northern route?",
    options: [
      "The Maritime Silk Road or Maritime Silk Route is the maritime section of the historic Silk Road that connected Southeast Asia, East Asia, the Indian subcontinent, the Arabian Peninsula, eastern Africa, and Europe.",
      "From 1453 onwards, the Ottoman Empire began competing with other gunpowder empires for greater control over the overland routes, which prompted European polities to seek alternatives while themselves gaining leverage over their trade partners.",
      "The Silk Road derives its name from the lucrative trade in silk, first developed in China, and a major reason for the connection of trade routes into an extensive transcontinental network.",
      "The northern route travelled northwest through the Chinese province of Gansu from Shaanxi Province and split into three further routes, two of them following the mountain ranges to the north and south of the Taklamakan Desert to rejoin at Kashgar, and the other going north of the Tian Shan mountains through Turpan, Talgar, and Almaty (in what is now southeast Kazakhstan).",
    ],
    answer: 3,
    explanation:
      "지문은 “The northern route travelled northwest through the Chinese province of Gansu from Shaanxi Province and split into three further routes, two of them following the mountain ranges to the north and south of the Taklamakan Desert to rejoin at Kashgar, and the other going north of the Tian Shan mountains through Turpan, Talgar, and Almaty (in what is now southeast Kazakhstan).”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-056",
    passageId: "library-alexandria-8",
    prompt: "What does the passage state about particular philosophical?",
    options: [
      "The Library dwindled during the Roman period, from a lack of funding and support.",
      "The Library was one of the largest and most significant libraries of the ancient world, but details about it are a mixture of history and legend.",
      "Modern scholars agree that while it is possible that Ptolemy I, a historian and author of an account of Alexander's campaign, laid the groundwork for the Library, it probably did not become a physical institution until the reign of Ptolemy II.",
      "The Library of Alexandria was not affiliated with any particular philosophical school; consequently, scholars who studied there had considerable academic freedom.",
    ],
    answer: 3,
    explanation:
      "지문은 “The Library of Alexandria was not affiliated with any particular philosophical school; consequently, scholars who studied there had considerable academic freedom.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 3,
  },
  {
    id: "dad-history-v2-140",
    passageId: "meiji-restoration-4",
    prompt:
      "Which rebellions arose in backlash against the abolition of the shogunate and industrialisation?",
    options: [
      "The Meiji Constitution protests",
      "The Boshin War and the Republic of Ezo",
      "The Sepoy Mutiny and the Boxer Rebellion",
      "The Saga Rebellion and the Satsuma Rebellion",
    ],
    answer: 3,
    explanation:
      "지문은 사가의 난과 사쓰마 반란이 막부 폐지와 산업화에 대한 반발로 일어났다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-028",
    passageId: "rosetta-stone-4",
    prompt: "What does the passage state about fragmentary copies?",
    options: [
      "There can be no one definitive English translation of the decree, not only because modern understanding of the ancient languages continues to develop, but also because of the minor differences between the three original texts.",
      "The stele was almost certainly not originally placed at Rashid (Rosetta) where it was found, but more likely came from a temple site farther inland, possibly the royal town of Sais.",
      "The Greek text on the Rosetta Stone provided the starting point.",
      "Three other fragmentary copies of the same decree were discovered later, and several similar Egyptian bilingual or trilingual inscriptions are now known, including three slightly earlier Ptolemaic decrees: the Decree of Alexandria in 243 BC, the Decree of Canopus in 238 BC, and the Memphis decree of Ptolemy IV, c. 218 BC.",
    ],
    answer: 3,
    explanation:
      "지문은 “Three other fragmentary copies of the same decree were discovered later, and several similar Egyptian bilingual or trilingual inscriptions are now known, including three slightly earlier Ptolemaic decrees: the Decree of Alexandria in 243 BC, the Decree of Canopus in 238 BC, and the Memphis decree of Ptolemy IV, c. 218 BC.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-143",
    passageId: "meiji-restoration-7",
    prompt:
      "What tension does historian William G. Beasley identify, per this passage?",
    options: [
      "A tension between koku measurement and rice taxation",
      "A tension between Buddhism and Shintō",
      "A tension between the Emperor and foreign powers only",
      "A tension between meritocratic state ideology and a rigid class structure limiting samurai advancement",
    ],
    answer: 3,
    explanation:
      "지문은 비즐리가 능력 중심 국가 이념과 하급 사무라이의 신분 상승을 막는 경직된 계급 구조 사이의 긴장을 지적했다고 설명합니다.",
    difficulty: 3,
  },
  {
    id: "dad-history-v2-121",
    passageId: "silk-production-history-1",
    prompt: "Where did silk production originate, according to this passage?",
    options: [
      "The Indus Valley civilisation",
      "The Byzantine Empire",
      "Neolithic China within the Yangshao culture",
      "Medieval Japan",
    ],
    answer: 2,
    explanation:
      "지문은 비단 생산이 신석기 중국의 양사오 문화에서 기원했다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-110",
    passageId: "scientific-revolution-6",
    prompt:
      "Where was the new kind of rapid scientific activity initially restricted to, per the passage?",
    options: [
      "All of Asia",
      "A few countries of Western Europe",
      "The entire world simultaneously",
      "Only the Islamic world",
    ],
    answer: 1,
    explanation:
      "지문은 새로운 과학 활동이 서유럽 일부 국가에 국한되어 약 200년간 이어졌다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-108",
    passageId: "scientific-revolution-4",
    prompt:
      "What alternative starting date for the Scientific Revolution do some historians propose?",
    options: [
      "1687, the year Newton's Principia was published",
      "1572, when Tycho Brahe observed a supernova",
      "1454, the year of the Gutenberg Bible",
      "1868, the year of the Meiji Restoration",
    ],
    answer: 1,
    explanation:
      "지문은 일부 역사가가 튀코 브라헤가 초신성을 관측한 1572년을 대안적 시작점으로 제안한다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-057",
    passageId: "magna-carta-3",
    prompt: "What does the passage state about rebels took?",
    options: [
      'The rebels took an oath that they would "stand fast for the liberty of the church and the realm", and demanded that the King confirm the Charter of Liberties that had been declared by King Henry I in the previous century, and which was perceived by the barons to protect their rights.',
      "Letters backing John arrived from the Pope in April, but by then the rebel barons had organised into a military faction.",
      'Although, as the historian David Carpenter has noted, the charter "wasted no time on political theory", it went beyond simply addressing individual baronial complaints, and formed a wider proposal for political reform.',
      'Under what historians later labelled "clause 61", or the "security clause", a council of 25 barons would be created to monitor and ensure John\'s future adherence to the charter.',
    ],
    answer: 0,
    explanation:
      '지문은 “The rebels took an oath that they would "stand fast for the liberty of the church and the realm", and demanded that the King confirm the Charter of Liberties that had been declared by King Henry I in the previous century, and which was perceived by the barons to protect their rights.”라고 설명하므로 이 선택지가 지문에 근거합니다.',
    difficulty: 1,
  },
  {
    id: "dad-history-v2-038",
    passageId: "silk-road-8",
    prompt: "What does the passage state about Maritime Silk?",
    options: [
      "The Silk Road derives its name from the lucrative trade in silk, first developed in China, and a major reason for the connection of trade routes into an extensive transcontinental network.",
      "The Maritime Silk Road or Maritime Silk Route is the maritime section of the historic Silk Road that connected Southeast Asia, East Asia, the Indian subcontinent, the Arabian Peninsula, eastern Africa, and Europe.",
      "The use of the term 'Silk Road' is not without its detractors.",
      "The northern route travelled northwest through the Chinese province of Gansu from Shaanxi Province and split into three further routes, two of them following the mountain ranges to the north and south of the Taklamakan Desert to rejoin at Kashgar, and the other going north of the Tian Shan mountains through Turpan, Talgar, and Almaty (in what is now southeast Kazakhstan).",
    ],
    answer: 1,
    explanation:
      "지문은 “The Maritime Silk Road or Maritime Silk Route is the maritime section of the historic Silk Road that connected Southeast Asia, East Asia, the Indian subcontinent, the Arabian Peninsula, eastern Africa, and Europe.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 3,
  },
  {
    id: "dad-history-v2-080",
    passageId: "calendar-8",
    prompt:
      "What change to the Julian calendar does this passage associate with 1582?",
    options: [
      "Cultures may define other units of time, such as the week, for the purpose of scheduling regular activities that do not easily coincide with months or years.",
      "An astronomical calendar is based on ongoing observation; examples are the religious Islamic calendar and the old religious Jewish calendar in the time of the Second Temple.",
      "An arithmetic calendar is one that is based on a strict set of rules; an example is the current Jewish calendar.",
      "The Gregorian calendar was introduced in 1582 as a refinement to the Julian calendar, which had been in use throughout the European Middle Ages, amounting to a 0.002% correction in the length of the year.",
    ],
    answer: 3,
    explanation:
      "지문은 “The Gregorian calendar was introduced in 1582 as a refinement to the Julian calendar, which had been in use throughout the European Middle Ages, amounting to a 0.002% correction in the length of the year.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 3,
  },
  {
    id: "dad-history-v2-117",
    passageId: "hanseatic-league-5",
    prompt: "In what year did the Hanseatic League ultimately disintegrate?",
    options: ["1517", "1453", "1669", "1868"],
    answer: 2,
    explanation:
      "지문은 한자 동맹이 1669년 최종적으로 해체되었다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-130",
    passageId: "gutenberg-bible-2",
    prompt:
      "How many copies of the Gutenberg Bible survive in at least substantial portion, per this passage?",
    options: ["180", "21", "158", "49"],
    answer: 3,
    explanation:
      "지문은 최소 상당 부분이 남아 있는 사본이 49부라고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-109",
    passageId: "scientific-revolution-5",
    prompt:
      "What kind of transformation does the passage say the period saw across disciplines?",
    options: [
      "A return to purely religious explanations",
      "A fundamental transformation in mathematics, physics, astronomy, and biology",
      "A decline in institutional support for science",
      "A narrowing focus on astronomy alone",
    ],
    answer: 1,
    explanation:
      "지문은 이 시기가 수학, 물리학, 천문학, 생물학 전반에 근본적인 전환을 가져왔다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-137",
    passageId: "meiji-restoration-1",
    prompt:
      "What did the Meiji Restoration lead to, according to this passage?",
    options: [
      "The founding of the Tokugawa shogunate",
      "The isolation of Japan from the West",
      "The abolition of the Emperor's title",
      "The Westernisation of Japan",
    ],
    answer: 3,
    explanation: "지문은 메이지 유신이 일본의 서구화로 이어졌다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-095",
    passageId: "age-of-discovery-7",
    prompt: "Who funded Columbus's 1492 plan to sail west to reach the Indies?",
    options: [
      "The Catholic Monarchs of Spain",
      "The Portuguese crown",
      "Prince Henry the Navigator",
      "The Hanseatic League",
    ],
    answer: 0,
    explanation:
      "지문은 1492년 스페인의 가톨릭 공동왕이 콜럼버스의 계획에 자금을 댔다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-039",
    passageId: "industrial-revolution-3",
    prompt: "What does the passage state about factors enabled?",
    options: [
      "Parts of India, China, Central America, South America, and the Middle East have a history of hand-manufacturing cotton textiles, which became a major industry after 1000 AD.",
      "These advances were capitalised on by entrepreneurs, of whom the best known is Arkwright.",
      "Several key factors enabled industrialisation.",
      "In the UK in 1720, there were 20,500 tons of charcoal iron and 400 tons with coke.",
    ],
    answer: 2,
    explanation:
      "지문은 “Several key factors enabled industrialisation.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-054",
    passageId: "library-alexandria-6",
    prompt: "What does the passage state about Modern scholars?",
    options: [
      "The Library of Alexandria was not affiliated with any particular philosophical school; consequently, scholars who studied there had considerable academic freedom.",
      "Modern scholars agree that while it is possible that Ptolemy I, a historian and author of an account of Alexander's campaign, laid the groundwork for the Library, it probably did not become a physical institution until the reign of Ptolemy II.",
      "The influence of the Library declined gradually over the course of several centuries.",
      "The Library dwindled during the Roman period, from a lack of funding and support.",
    ],
    answer: 1,
    explanation:
      "지문은 “Modern scholars agree that while it is possible that Ptolemy I, a historian and author of an account of Alexander's campaign, laid the groundwork for the Library, it probably did not become a physical institution until the reign of Ptolemy II.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-076",
    passageId: "calendar-4",
    prompt: "What does the passage state about scheduling regular?",
    options: [
      "An arithmetic calendar is one that is based on a strict set of rules; an example is the current Jewish calendar.",
      "The Gregorian calendar is the de facto international standard and is used almost everywhere in the world for civil purposes.",
      "The Gregorian calendar was introduced in 1582 as a refinement to the Julian calendar, which had been in use throughout the European Middle Ages, amounting to a 0.002% correction in the length of the year.",
      "Cultures may define other units of time, such as the week, for the purpose of scheduling regular activities that do not easily coincide with months or years.",
    ],
    answer: 3,
    explanation:
      "지문은 “Cultures may define other units of time, such as the week, for the purpose of scheduling regular activities that do not easily coincide with months or years.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-105",
    passageId: "scientific-revolution-1",
    prompt:
      "How does the passage describe the New Science that emerged from the Scientific Revolution?",
    options: [
      "A return to Greek conceptions and traditions",
      "More mechanistic and integrated with mathematics, focused on new evidence",
      "Focused mainly on religious doctrine",
      "Unconcerned with evidence or interpretation",
    ],
    answer: 1,
    explanation:
      "지문은 새로운 과학이 그리스 전통에서 벗어나 더 기계적이고 수학과 결합되었으며 새 증거 수집에 초점을 두었다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-066",
    passageId: "enigma-machine-6",
    prompt: "What does the passage state about British Military?",
    options: [
      "Each rotor can be set to one of 26 starting positions when placed in an Enigma machine.",
      "In September 1939, British Military Mission 4, which included Colin Gubbins and Vera Atkins, went to Poland, intending to evacuate cipher-breakers Marian Rejewski, Jerzy Różycki, and Henryk Zygalski from the country.",
      "The Enigma machine was invented by German engineer Arthur Scherbius at the end of World War I.",
      "Several Enigma models were produced, but the German military models, having a plugboard, were the most complex.",
    ],
    answer: 1,
    explanation:
      "지문은 “In September 1939, British Military Mission 4, which included Colin Gubbins and Vera Atkins, went to Poland, intending to evacuate cipher-breakers Marian Rejewski, Jerzy Różycki, and Henryk Zygalski from the country.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-042",
    passageId: "industrial-revolution-6",
    prompt: "What does the passage state about best known?",
    options: [
      "Coke pig iron was hardly used to produce wrought iron until 1755, when Darby's son Abraham Darby II built furnaces at Horsehay and Ketley where low sulfur coal was available, and not far from Coalbrookdale.",
      "These advances were capitalised on by entrepreneurs, of whom the best known is Arkwright.",
      "Several key factors enabled industrialisation.",
      "The share of value added by the cotton industry in Britain was 2.6% in 1760, 17% in 1801, and 22% in 1831.",
    ],
    answer: 1,
    explanation:
      "지문은 “These advances were capitalised on by entrepreneurs, of whom the best known is Arkwright.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-002",
    passageId: "printing-press-2",
    prompt: "What could Lord Stanhope’s new iron press do by 1800?",
    options: [
      "Print millions of impressions in a day",
      "Print a sheet at one pull",
      "Replace letterpress with digital printing",
      "Combine steam power with rotary motion",
    ],
    answer: 1,
    explanation:
      "지문은 1800년 스탠호프가 한 번 당겨 한 장을 인쇄하는 새 철제 인쇄기를 만들었다고 합니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-119",
    passageId: "hanseatic-league-7",
    prompt:
      'What does the passage say the claim that "Hansa" meant "An-See" (on the sea) is?',
    options: [
      "The official etymology",
      "Confirmed by most scholars",
      "Incorrect",
      "Supported by Middle Low German texts",
    ],
    answer: 2,
    explanation:
      "지문은 '한자'가 '바다 위'를 뜻한다는 주장이 틀렸다고 명시합니다.",
    difficulty: 3,
  },
  {
    id: "dad-history-v2-027",
    passageId: "rosetta-stone-3",
    prompt: "What does the passage state about already underway?",
    options: [
      "Securing the favour of the priesthood was essential for the Ptolemaic kings to retain effective rule over the populace.",
      "There can be no one definitive English translation of the decree, not only because modern understanding of the ancient languages continues to develop, but also because of the minor differences between the three original texts.",
      "Study of the decree was already underway when the first complete translation of the Greek text was published in 1803.",
      "The stele was almost certainly not originally placed at Rashid (Rosetta) where it was found, but more likely came from a temple site farther inland, possibly the royal town of Sais.",
    ],
    answer: 2,
    explanation:
      "지문은 “Study of the decree was already underway when the first complete translation of the Greek text was published in 1803.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-065",
    passageId: "enigma-machine-5",
    prompt: "What does the passage state about German cryptographic?",
    options: [
      "Over time, the German cryptographic procedures improved, and the Cipher Bureau developed techniques and designed mechanical devices to continue reading Enigma traffic.",
      "The repeated changes of electrical path through an Enigma scrambler implement a polyalphabetic substitution cipher that provides Enigma's security.",
      "Each rotor can be set to one of 26 starting positions when placed in an Enigma machine.",
      "The Enigma machine was invented by German engineer Arthur Scherbius at the end of World War I.",
    ],
    answer: 0,
    explanation:
      "지문은 “Over time, the German cryptographic procedures improved, and the Cipher Bureau developed techniques and designed mechanical devices to continue reading Enigma traffic.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 3,
  },
  {
    id: "dad-history-v2-059",
    passageId: "magna-carta-5",
    prompt: "What does the passage state about Letters backing?",
    options: [
      'Under what historians later labelled "clause 61", or the "security clause", a council of 25 barons would be created to monitor and ensure John\'s future adherence to the charter.',
      "In one sense this was not unprecedented.",
      "Letters backing John arrived from the Pope in April, but by then the rebel barons had organised into a military faction.",
      'The rebels took an oath that they would "stand fast for the liberty of the church and the realm", and demanded that the King confirm the Charter of Liberties that had been declared by King Henry I in the previous century, and which was perceived by the barons to protect their rights.',
    ],
    answer: 2,
    explanation:
      "지문은 “Letters backing John arrived from the Pope in April, but by then the rebel barons had organised into a military faction.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 3,
  },
  {
    id: "dad-history-v2-075",
    passageId: "calendar-3",
    prompt: "What does the passage state about tropical year?",
    options: [
      "An astronomical calendar is based on ongoing observation; examples are the religious Islamic calendar and the old religious Jewish calendar in the time of the Second Temple.",
      "An arithmetic calendar is one that is based on a strict set of rules; an example is the current Jewish calendar.",
      "Because the number of days in the tropical year is not a whole number, a solar calendar must have a different number of days in different years.",
      "The Gregorian calendar is the de facto international standard and is used almost everywhere in the world for civil purposes.",
    ],
    answer: 2,
    explanation:
      "지문은 “Because the number of days in the tropical year is not a whole number, a solar calendar must have a different number of days in different years.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-089",
    passageId: "age-of-discovery-1",
    prompt: "What did Vasco da Gama's 1498 voyage establish?",
    options: [
      "A sea route to India",
      "A land route across the Sahara",
      "Portuguese rule over the Azores",
      "The Columbian exchange",
    ],
    answer: 0,
    explanation:
      "지문은 1498년 바스쿠 다 가마가 인도로 가는 바닷길을 개척했다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-004",
    passageId: "rosetta-stone-2",
    prompt: "Why did the discovery arouse widespread public interest?",
    options: [
      "It was the first Roman bilingual text",
      "It proved that no Egyptian script could be read",
      "It revealed the location of the Library of Alexandria",
      "It might help decipher the previously untranslated hieroglyphic script",
    ],
    answer: 3,
    explanation:
      "이 발견은 이전에 번역되지 않았던 이집트 상형문자를 해독할 가능성을 보여 주어 큰 관심을 불러일으켰습니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-011",
    passageId: "library-alexandria-1",
    prompt: "Under whose reign was the Library probably built?",
    options: [
      "Ptolemy I Soter’s reign",
      "The reign of an unnamed Roman emperor",
      "Ptolemy II Philadelphus’s reign",
      "Ptolemy V Epiphanes’s reign",
    ],
    answer: 2,
    explanation:
      "도서관 자체는 아들인 프톨레마이오스 2세 필라델포스의 통치 때 지어졌을 가능성이 높다고 합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-053",
    passageId: "library-alexandria-5",
    prompt: "What does the passage state about significant libraries?",
    options: [
      "The Library was one of the largest and most significant libraries of the ancient world, but details about it are a mixture of history and legend.",
      "The Library was built in the Brucheion (Royal Quarter) as part of the Mouseion.",
      "The Library of Alexandria was not affiliated with any particular philosophical school; consequently, scholars who studied there had considerable academic freedom.",
      "The influence of the Library declined gradually over the course of several centuries.",
    ],
    answer: 0,
    explanation:
      "지문은 “The Library was one of the largest and most significant libraries of the ancient world, but details about it are a mixture of history and legend.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 3,
  },
  {
    id: "dad-history-v2-084",
    passageId: "renaissance-4",
    prompt:
      "In Italy, which events conventionally mark the ending of the Renaissance period?",
    options: [
      "The waning of humanism, the Reformation, the Sack of Rome, or the Counter-Reformation",
      "The rediscovery of classical Greek philosophy",
      "The rise of vernacular literatures",
      "The invention of movable type",
    ],
    answer: 0,
    explanation:
      "지문은 이탈리아에서 인문주의의 쇠퇴, 종교개혁, 로마 약탈, 반종교개혁이 관습적 종결점으로 제시된다고 말합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-113",
    passageId: "hanseatic-league-1",
    prompt:
      "Where did the Hanseatic League grow from in the late 12th century?",
    options: [
      "Novgorod and Bruges",
      "London and the Steelyard",
      "Lübeck and a few other North German towns",
      "Bergen and Cologne",
    ],
    answer: 2,
    explanation:
      "지문은 한자 동맹이 12세기 말 뤼베크와 몇몇 북독일 도시에서 성장하기 시작했다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-021",
    passageId: "printing-press-3",
    prompt: "What does the passage state about Johannes Gutenberg?",
    options: [
      "Johannes Gutenberg invented the movable-type printing press around 1440, utilizing four existing technologies: the screw press, movable type, the codex book format, and mechanized paper production.",
      "Movable type is the typographical principle of writing a text from individual reusable characters.",
      "The codex book format also dated to the Roman Empire, and was of utmost significance in the history of the book.",
      "The overall design of the wooden handpress was largely consistent throughout its long history, but its construction and performance improved considerably over three centuries, with metal screws replacing wooden ones and the tympan and frisket becoming standard fittings.",
    ],
    answer: 0,
    explanation:
      "지문은 “Johannes Gutenberg invented the movable-type printing press around 1440, utilizing four existing technologies: the screw press, movable type, the codex book format, and mechanized paper production.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-041",
    passageId: "industrial-revolution-5",
    prompt: "What does the passage state about Central America?",
    options: [
      "Parts of India, China, Central America, South America, and the Middle East have a history of hand-manufacturing cotton textiles, which became a major industry after 1000 AD.",
      "In the UK in 1720, there were 20,500 tons of charcoal iron and 400 tons with coke.",
      "Coke pig iron was hardly used to produce wrought iron until 1755, when Darby's son Abraham Darby II built furnaces at Horsehay and Ketley where low sulfur coal was available, and not far from Coalbrookdale.",
      "Several key factors enabled industrialisation.",
    ],
    answer: 0,
    explanation:
      "지문은 “Parts of India, China, Central America, South America, and the Middle East have a history of hand-manufacturing cotton textiles, which became a major industry after 1000 AD.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 3,
  },
  {
    id: "dad-history-v2-070",
    passageId: "apollo-11-4",
    prompt: "What does the passage state about incident sparked?",
    options: [
      "Project Apollo was abruptly halted by the Apollo 1 fire on January 27, 1967, in which astronauts Gus Grissom, Ed White, and Roger B.",
      "This incident sparked the Sputnik crisis and ignited the Space Race, as both superpowers sought to demonstrate superiority in spaceflight.",
      "The Soviet Union appeared to be winning the Space Race, but its early lead was overtaken by the US Gemini program and Soviet failure to develop the N1 launcher, which would have been comparable to the Saturn V.",
      "The initial crew assignment of Commander Neil Armstrong, Command Module Pilot (CMP) Jim Lovell, and Lunar Module Pilot (LMP) Buzz Aldrin on the backup crew for Apollo 9 was officially announced on November 20, 1967.",
    ],
    answer: 1,
    explanation:
      "지문은 “This incident sparked the Sputnik crisis and ignited the Space Race, as both superpowers sought to demonstrate superiority in spaceflight.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-012",
    passageId: "library-alexandria-2",
    prompt: "What did Eratosthenes of Cyrene calculate?",
    options: [
      "The route from Alexandria to Rome",
      "The number of papyrus scrolls",
      "The size of the Alexandrian research institution",
      "The Earth’s circumference within a few hundred kilometers of accuracy",
    ],
    answer: 3,
    explanation:
      "에라토스테네스는 지구 둘레를 수백 킬로미터 이내의 정확도로 계산했습니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-067",
    passageId: "enigma-machine-7",
    prompt: "What does the passage state about repeated changes?",
    options: [
      "The Enigma machine was invented by German engineer Arthur Scherbius at the end of World War I.",
      "Several Enigma models were produced, but the German military models, having a plugboard, were the most complex.",
      "The repeated changes of electrical path through an Enigma scrambler implement a polyalphabetic substitution cipher that provides Enigma's security.",
      "Over time, the German cryptographic procedures improved, and the Cipher Bureau developed techniques and designed mechanical devices to continue reading Enigma traffic.",
    ],
    answer: 2,
    explanation:
      "지문은 “The repeated changes of electrical path through an Enigma scrambler implement a polyalphabetic substitution cipher that provides Enigma's security.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-126",
    passageId: "silk-production-history-6",
    prompt:
      "From what date is the earliest extant example of a woven silk fabric, per this passage?",
    options: ["1600 BCE", "2700 BCE", "3630 BC", "552 AD"],
    answer: 2,
    explanation:
      "지문은 현존하는 가장 오래된 직조 비단 직물이 기원전 3630년의 것이라고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-025",
    passageId: "printing-press-7",
    prompt: "What does the passage state about overall design?",
    options: [
      "The overall design of the wooden handpress was largely consistent throughout its long history, but its construction and performance improved considerably over three centuries, with metal screws replacing wooden ones c. 1550 and the tympan and frisket becoming standard fittings.",
      "Johannes Gutenberg invented the movable-type printing press around 1440, utilizing four existing technologies: the screw press, movable type, the codex book format, and mechanized paper production.",
      "The first factor, the screw press, permitted direct pressure to be applied on a flat plane.",
      "Movable type is the typographical principle of writing a text from individual reusable characters.",
    ],
    answer: 0,
    explanation:
      "지문은 “The overall design of the wooden handpress was largely consistent throughout its long history, but its construction and performance improved considerably over three centuries, with metal screws replacing wooden ones c. 1550 and the tympan and frisket becoming standard fittings.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-115",
    passageId: "hanseatic-league-3",
    prompt: "What was the London Kontor of the Hanseatic League also known as?",
    options: [
      "The Grand Master's court",
      "The Kontor of Novgorod",
      "The Steelyard",
      "Cottonopolis",
    ],
    answer: 2,
    explanation:
      "지문은 런던에 있던 한자 동맹의 무역소가 '스틸야드'로도 불렸다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-009",
    passageId: "great-fire-1",
    prompt: "Where and when did the fire begin?",
    options: [
      "In a bakery in Pudding Lane shortly after midnight on 2 September",
      "In the Tower of London on Monday morning",
      "In the City centre after the firebreaks were built",
      "In a French settlement during the Second Anglo-Dutch War",
    ],
    answer: 0,
    explanation: "화재는 9월 2일 자정 직후 푸딩 레인의 빵집에서 시작했습니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-006",
    passageId: "silk-road-2",
    prompt:
      "What event helped bring Central Asia under unified control around 114 BCE?",
    options: [
      "The rise of the Roman Empire in the west",
      "Han expansion through Zhang Qian’s missions and explorations",
      "Ottoman competition with gunpowder empires",
      "The later search for alternative European routes",
    ],
    answer: 1,
    explanation:
      "한 왕조의 중앙아시아 확장과 중국 사신 장건의 임무·탐험이 통합된 통제를 가져왔다고 합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-079",
    passageId: "calendar-7",
    prompt:
      "What international role does the Gregorian calendar have in this passage?",
    options: [
      "Because the number of days in the tropical year is not a whole number, a solar calendar must have a different number of days in different years.",
      "Cultures may define other units of time, such as the week, for the purpose of scheduling regular activities that do not easily coincide with months or years.",
      "The Gregorian calendar is the de facto international standard and is used almost everywhere in the world for civil purposes.",
      "An astronomical calendar is based on ongoing observation; examples are the religious Islamic calendar and the old religious Jewish calendar in the time of the Second Temple.",
    ],
    answer: 2,
    explanation:
      "지문은 “The Gregorian calendar is the de facto international standard and is used almost everywhere in the world for civil purposes.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-016",
    passageId: "enigma-machine-2",
    prompt: "Which sequence matches the operators’ extra rotor-key procedure?",
    options: [
      "They used the day setting for the whole message and never changed it",
      "They sent the chosen rotor setting openly, then discarded the message",
      "They changed the day setting before choosing any rotor setting",
      "They encoded a chosen setting with the day setting, switched to it, and sent the rest of the message",
    ],
    answer: 3,
    explanation:
      "운용자는 임의 설정(예: GTZ)을 일일 설정으로 부호화해 보내고, 회전자를 그 설정으로 바꾼 뒤 본문을 보냈습니다.",
    difficulty: 3,
  },
  {
    id: "dad-history-v2-091",
    passageId: "age-of-discovery-3",
    prompt:
      'What does the passage say about the term "age of discovery" itself?',
    options: [
      "It has been scrutinized but is still commonly used in historical literature",
      "It was invented by Indigenous researchers",
      "It replaced the term Columbian exchange",
      "It was banned from academic use",
    ],
    answer: 0,
    explanation:
      "지문은 '발견의 시대'라는 용어가 비판적으로 검토되면서도 여전히 역사 문헌에서 흔히 쓰인다고 말합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-129",
    passageId: "gutenberg-bible-1",
    prompt: "What is the Gutenberg Bible also known as, per this passage?",
    options: [
      "The Charter Oath",
      "The Vulgate translation of St Jerome",
      "The 31-line Indulgence",
      "The 42-line Bible, the Mazarin Bible, or the B42",
    ],
    answer: 3,
    explanation:
      "지문은 구텐베르크 성경이 42행 성경, 마자랭 성경, 또는 B42로도 불린다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-010",
    passageId: "great-fire-2",
    prompt:
      "Why did Charles II strongly encourage people to leave London and settle elsewhere?",
    options: [
      "He wanted to preserve the medieval plan outside London",
      "He feared a rebellion by dispossessed refugees",
      "He expected the Tower garrison to house the refugees",
      "He planned to move the capital permanently",
    ],
    answer: 1,
    explanation:
      "찰스 2세는 집을 잃은 난민들이 런던에서 반란을 일으킬까 우려했습니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-019",
    passageId: "calendar-1",
    prompt:
      "Besides organizing days, what other meanings of “calendar” are given?",
    options: [
      "A chronological list and a lunar cycle",
      "A list of trade routes and court judgments",
      "A physical record and a list of planned events or documents",
      "A set of dates that is never a physical record",
    ],
    answer: 2,
    explanation:
      "달력은 물리적 기록일 수도 있고 계획된 행사나 문서의 연대순 목록일 수도 있습니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-138",
    passageId: "meiji-restoration-2",
    prompt:
      "What US-led event challenged the Tokugawa policy of sakoku, per this passage?",
    options: [
      "The Charter Oath",
      "The Boshin War",
      "The Satsuma Rebellion",
      "The Perry Expedition",
    ],
    answer: 3,
    explanation:
      "지문은 페리 원정대의 도래가 도쿠가와 막부의 쇄국 정책에 도전했다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-103",
    passageId: "roman-republic-7",
    prompt: "At the Battle of the Cremera in 477 BC, what happened to Rome?",
    options: [
      "It destroyed the city of Veii",
      "It suffered a significant defeat against Veii",
      "It defeated the Sabines decisively",
      "It won against the Latin cities",
    ],
    answer: 1,
    explanation:
      "지문은 기원전 477년 크레메라 전투에서 로마가 베이이에 큰 패배를 당했다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-035",
    passageId: "silk-road-5",
    prompt:
      "What reservation about the term 'Silk Road' is introduced in this passage?",
    options: [
      "The southern route or Karakoram route was mainly a single route from China through the Karakoram mountains, where it persists in modern times as the Karakoram Highway, a paved road through Khunjerab Pass that connects Pakistan and China.",
      "The Maritime Silk Road or Maritime Silk Route is the maritime section of the historic Silk Road that connected Southeast Asia, East Asia, the Indian subcontinent, the Arabian Peninsula, eastern Africa, and Europe.",
      "The use of the term 'Silk Road' is not without its detractors.",
      "From 1453 onwards, the Ottoman Empire began competing with other gunpowder empires for greater control over the overland routes, which prompted European polities to seek alternatives while themselves gaining leverage over their trade partners.",
    ],
    answer: 2,
    explanation:
      "지문은 “The use of the term 'Silk Road' is not without its detractors.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 3,
  },
  {
    id: "dad-history-v2-032",
    passageId: "rosetta-stone-8",
    prompt: "What does the passage state about Greek text?",
    options: [
      "Three other fragmentary copies of the same decree were discovered later, and several similar Egyptian bilingual or trilingual inscriptions are now known, including three slightly earlier Ptolemaic decrees: the Decree of Alexandria in 243 BC, the Decree of Canopus in 238 BC, and the Memphis decree of Ptolemy IV, .",
      "Securing the favour of the priesthood was essential for the Ptolemaic kings to retain effective rule over the populace.",
      "There can be no one definitive English translation of the decree, not only because modern understanding of the ancient languages continues to develop, but also because of the minor differences between the three original texts.",
      "The Greek text on the Rosetta Stone provided the starting point.",
    ],
    answer: 3,
    explanation:
      "지문은 “The Greek text on the Rosetta Stone provided the starting point.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 3,
  },
  {
    id: "dad-history-v2-104",
    passageId: "roman-republic-8",
    prompt:
      "From what did the leading patrician families derive their power, according to the passage?",
    options: [
      "Their control of the Roman navy",
      "Their wealth, landholdings, and clients",
      "Foreign alliances with Carthage",
      "Popular election by the plebs",
    ],
    answer: 1,
    explanation:
      "지문은 유력 가문의 권력이 부, 토지 소유, 피호민 관계에서 나왔다고 설명합니다.",
    difficulty: 3,
  },
  {
    id: "dad-history-v2-120",
    passageId: "hanseatic-league-8",
    prompt:
      "Who led the Baltic trade before the Hanseatic League, per this passage?",
    options: [
      "The Tang dynasty",
      "The Teutonic Order",
      "The Scandinavians",
      "The Ottoman Empire",
    ],
    answer: 2,
    explanation:
      "지문은 한자 동맹 이전에 스칸디나비아인들이 발트해 무역을 주도했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-068",
    passageId: "enigma-machine-8",
    prompt: "What does the passage state about Each rotor?",
    options: [
      "Several Enigma models were produced, but the German military models, having a plugboard, were the most complex.",
      "Over time, the German cryptographic procedures improved, and the Cipher Bureau developed techniques and designed mechanical devices to continue reading Enigma traffic.",
      "In September 1939, British Military Mission 4, which included Colin Gubbins and Vera Atkins, went to Poland, intending to evacuate cipher-breakers Marian Rejewski, Jerzy Różycki, and Henryk Zygalski from the country.",
      "Each rotor can be set to one of 26 starting positions when placed in an Enigma machine.",
    ],
    answer: 3,
    explanation:
      "지문은 “Each rotor can be set to one of 26 starting positions when placed in an Enigma machine.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 3,
  },
  {
    id: "dad-history-v2-063",
    passageId: "enigma-machine-3",
    prompt: "What does the passage state about Enigma machine?",
    options: [
      "Over time, the German cryptographic procedures improved, and the Cipher Bureau developed techniques and designed mechanical devices to continue reading Enigma traffic.",
      "In September 1939, British Military Mission 4, which included Colin Gubbins and Vera Atkins, went to Poland, intending to evacuate cipher-breakers Marian Rejewski, Jerzy Różycki, and Henryk Zygalski from the country.",
      "The Enigma machine was invented by German engineer Arthur Scherbius at the end of World War I.",
      "The repeated changes of electrical path through an Enigma scrambler implement a polyalphabetic substitution cipher that provides Enigma's security.",
    ],
    answer: 2,
    explanation:
      "지문은 “The Enigma machine was invented by German engineer Arthur Scherbius at the end of World War I.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-061",
    passageId: "magna-carta-7",
    prompt: "What does the passage state about historians later?",
    options: [
      'Under what historians later labelled "clause 61", or the "security clause", a council of 25 barons would be created to monitor and ensure John\'s future adherence to the charter.',
      'The rebels took an oath that they would "stand fast for the liberty of the church and the realm", and demanded that the King confirm the Charter of Liberties that had been declared by King Henry I in the previous century, and which was perceived by the barons to protect their rights.',
      "It was John's hope that the Pope would give him valuable legal and moral support, and accordingly John played for time; the King had declared himself to be a papal vassal in 1213 and correctly believed he could count on the Pope for help.",
      "Letters backing John arrived from the Pope in April, but by then the rebel barons had organised into a military faction.",
    ],
    answer: 0,
    explanation:
      '지문은 “Under what historians later labelled "clause 61", or the "security clause", a council of 25 barons would be created to monitor and ensure John\'s future adherence to the charter.”라고 설명하므로 이 선택지가 지문에 근거합니다.',
    difficulty: 2,
  },
  {
    id: "dad-history-v2-055",
    passageId: "library-alexandria-7",
    prompt: "What does the passage state about Royal Quarter?",
    options: [
      "The influence of the Library declined gradually over the course of several centuries.",
      "The Library dwindled during the Roman period, from a lack of funding and support.",
      "The Library was built in the Brucheion (Royal Quarter) as part of the Mouseion.",
      "The Library was one of the largest and most significant libraries of the ancient world, but details about it are a mixture of history and legend.",
    ],
    answer: 2,
    explanation:
      "지문은 “The Library was built in the Brucheion (Royal Quarter) as part of the Mouseion.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-043",
    passageId: "industrial-revolution-7",
    prompt: "What does the passage state about charcoal iron?",
    options: [
      "Several key factors enabled industrialisation.",
      "The share of value added by the cotton industry in Britain was 2.6% in 1760, 17% in 1801, and 22% in 1831.",
      "In the UK in 1720, there were 20,500 tons of charcoal iron and 400 tons with coke.",
      "Parts of India, China, Central America, South America, and the Middle East have a history of hand-manufacturing cotton textiles, which became a major industry after 1000 AD.",
    ],
    answer: 2,
    explanation:
      "지문은 “In the UK in 1720, there were 20,500 tons of charcoal iron and 400 tons with coke.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-093",
    passageId: "age-of-discovery-5",
    prompt:
      "What alternative term does the passage mention for shedding light on colonial-era contact?",
    options: [
      "Contact, as in first contact",
      "Manifest destiny",
      "The discovery doctrine",
      "The Columbian exchange",
    ],
    answer: 0,
    explanation:
      "지문은 '접촉' 또는 '첫 접촉'이라는 용어가 발견과 식민주의를 조명하는 대안으로 쓰인다고 설명합니다.",
    difficulty: 3,
  },
  {
    id: "dad-history-v2-026",
    passageId: "printing-press-8",
    prompt: "What does the passage state about improvements followed?",
    options: [
      "The first factor, the screw press, permitted direct pressure to be applied on a flat plane.",
      "Several more innovations and improvements followed before the start of the Industrial Revolution.",
      "Movable type is the typographical principle of writing a text from individual reusable characters.",
      "The codex book format also dated to the Roman Empire, and was of utmost significance in the history of the book.",
    ],
    answer: 1,
    explanation:
      "지문은 “Several more innovations and improvements followed before the start of the Industrial Revolution.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 3,
  },
  {
    id: "dad-history-v2-098",
    passageId: "roman-republic-2",
    prompt:
      "How does the passage characterize the Republic's political system despite annual elections?",
    options: [
      "An elective oligarchy dominated by a few powerful families",
      "A pure direct democracy",
      "A hereditary monarchy",
      "A theocracy led by priests",
    ],
    answer: 0,
    explanation:
      "지문은 매년 선거가 있었지만 실제로는 소수 유력 가문이 지배하는 선거 과두정이었다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-044",
    passageId: "industrial-revolution-8",
    prompt: "What does the passage state about hardly used?",
    options: [
      "The share of value added by the cotton industry in Britain was 2.6% in 1760, 17% in 1801, and 22% in 1831.",
      "Parts of India, China, Central America, South America, and the Middle East have a history of hand-manufacturing cotton textiles, which became a major industry after 1000 AD.",
      "These advances were capitalised on by entrepreneurs, of whom the best known is Arkwright.",
      "Coke pig iron was hardly used to produce wrought iron until 1755, when Darby's son Abraham Darby II built furnaces at Horsehay and Ketley where low sulfur coal was available, and not far from Coalbrookdale.",
    ],
    answer: 3,
    explanation:
      "지문은 “Coke pig iron was hardly used to produce wrought iron until 1755, when Darby's son Abraham Darby II built furnaces at Horsehay and Ketley where low sulfur coal was available, and not far from Coalbrookdale.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 3,
  },
  {
    id: "dad-history-v2-144",
    passageId: "meiji-restoration-8",
    prompt:
      "What did both the Shintō revival and Dutch studies movements avoid asserting, per this passage?",
    options: [
      "That Western science should be banned",
      "That China was the center of intellectual thought",
      "That the Emperor should be restored to power",
      "That their learning was meant to upset the established political order",
    ],
    answer: 3,
    explanation:
      "지문은 두 흐름 모두 자신들의 학문이 기존 정치 질서를 흔들려는 의도가 아니라고 조심했다고 설명합니다.",
    difficulty: 3,
  },
  {
    id: "dad-history-v2-142",
    passageId: "meiji-restoration-6",
    prompt:
      "By 1650, roughly how much land, measured in koku, did the shōgun directly control?",
    options: [
      "Roughly 1 million koku",
      "Roughly 12.9 million koku",
      "Roughly 26 million koku",
      "Roughly 4.2 million koku",
    ],
    answer: 3,
    explanation:
      "지문은 1650년 무렵 쇼군이 약 420만 석의 토지를 직접 지배했다고 설명합니다.",
    difficulty: 3,
  },
  {
    id: "dad-history-v2-018",
    passageId: "apollo-11-2",
    prompt:
      "Which words does the passage quote Armstrong declaring on the lunar surface?",
    options: [
      "“One small step for a machine, one giant leap for science”",
      "“That’s one small step for [a] man, one giant leap for mankind.”",
      "“One great step for the Space Race, one small step for Earth”",
      "“That’s one giant step for a man, one small leap for mankind.”",
    ],
    answer: 1,
    explanation: "지문은 달 표면에서 암스트롱이 한 문장을 그대로 인용합니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-049",
    passageId: "great-fire-7",
    prompt: "What does the passage state about high Roman?",
    options: [
      "The high Roman wall enclosing the city impeded escape from the inferno, restricting exit to eight narrow gates.",
      "By the 1660s, London was by far the largest city in Britain and the third largest in the Western world, estimated at 300,000 to 400,000 inhabitants.",
      "The relationship between the City and the Crown was often tense.",
      "The city was essentially medieval in its street plan, an overcrowded warren of narrow, winding, cobbled alleys.",
    ],
    answer: 0,
    explanation:
      "지문은 “The high Roman wall enclosing the city impeded escape from the inferno, restricting exit to eight narrow gates.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-136",
    passageId: "gutenberg-bible-8",
    prompt:
      "What range do scholars today estimate for the number of Gutenberg Bible copies printed?",
    options: [
      "More than 500 copies",
      "Exactly 158 copies",
      "Exactly 49 copies",
      "Between 160 and 185 copies",
    ],
    answer: 3,
    explanation:
      "지문은 현대 학자들이 현존 사본 조사를 통해 160~185부가 인쇄되었다고 추정한다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-023",
    passageId: "printing-press-5",
    prompt: "What does the passage state about Movable type?",
    options: [
      "The overall design of the wooden handpress was largely consistent throughout its long history, but its construction and performance improved considerably over three centuries, with metal screws replacing wooden ones and the tympan and frisket becoming standard fittings.",
      "Several more innovations and improvements followed before the start of the Industrial Revolution.",
      "Movable type is the typographical principle of writing a text from individual reusable characters.",
      "Johannes Gutenberg invented the movable-type printing press around 1440, utilizing four existing technologies: the screw press, movable type, the codex book format, and mechanized paper production.",
    ],
    answer: 2,
    explanation:
      "지문은 “Movable type is the typographical principle of writing a text from individual reusable characters.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 3,
  },
  {
    id: "dad-history-v2-077",
    passageId: "calendar-5",
    prompt: "What does the passage state about astronomical calendar?",
    options: [
      "An astronomical calendar is based on ongoing observation; examples are the religious Islamic calendar and the old religious Jewish calendar in the time of the Second Temple.",
      "The Gregorian calendar is the de facto international standard and is used almost everywhere in the world for civil purposes.",
      "The Gregorian calendar was introduced in 1582 as a refinement to the Julian calendar, which had been in use throughout the European Middle Ages, amounting to a 0.002% correction in the length of the year.",
      "Because the number of days in the tropical year is not a whole number, a solar calendar must have a different number of days in different years.",
    ],
    answer: 0,
    explanation:
      "지문은 “An astronomical calendar is based on ongoing observation; examples are the religious Islamic calendar and the old religious Jewish calendar in the time of the Second Temple.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 3,
  },
  {
    id: "dad-history-v2-048",
    passageId: "great-fire-6",
    prompt: "What does the passage state about Great Fire?",
    options: [
      "Fires were common in the crowded wood-built city with its open fireplaces, candles, ovens, and stores of combustibles.",
      "By the 1660s, London was by far the largest city in Britain and the third largest in the Western world, estimated at 300,000 to 400,000 inhabitants.",
      "The relationship between the City and the Crown was often tense.",
      "The riverfront was important in the development of the Great Fire.",
    ],
    answer: 3,
    explanation:
      "지문은 “The riverfront was important in the development of the Great Fire.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-064",
    passageId: "enigma-machine-4",
    prompt: "What does the passage state about Several Enigma?",
    options: [
      "In September 1939, British Military Mission 4, which included Colin Gubbins and Vera Atkins, went to Poland, intending to evacuate cipher-breakers Marian Rejewski, Jerzy Różycki, and Henryk Zygalski from the country.",
      "The repeated changes of electrical path through an Enigma scrambler implement a polyalphabetic substitution cipher that provides Enigma's security.",
      "Each rotor can be set to one of 26 starting positions when placed in an Enigma machine.",
      "Several Enigma models were produced, but the German military models, having a plugboard, were the most complex.",
    ],
    answer: 3,
    explanation:
      "지문은 “Several Enigma models were produced, but the German military models, having a plugboard, were the most complex.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-097",
    passageId: "roman-republic-1",
    prompt:
      "What event marks the beginning of the Roman Republic in this passage?",
    options: [
      "The overthrow of the Roman Kingdom, traditionally dated to 509 BC",
      "The establishment of the Roman Empire in 27 BC",
      "The Battle of Zama in 202 BC",
      "The Social War",
    ],
    answer: 0,
    explanation:
      "지문은 로마 왕정이 무너진 기원전 509년을 로마 공화정의 시작으로 전통적으로 본다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-074",
    passageId: "apollo-11-8",
    prompt: "What does the passage state about initial crew?",
    options: [
      "This incident sparked the Sputnik crisis and ignited the Space Race, as both superpowers sought to demonstrate superiority in spaceflight.",
      "The initial crew assignment of Commander Neil Armstrong, Command Module Pilot (CMP) Jim Lovell, and Lunar Module Pilot (LMP) Buzz Aldrin on the backup crew for Apollo 9 was officially announced on November 20, 1967.",
      "An early and crucial decision was choosing lunar orbit rendezvous over both direct ascent and Earth orbit rendezvous.",
      "Project Apollo was abruptly halted by the Apollo 1 fire on January 27, 1967, in which astronauts Gus Grissom, Ed White, and Roger B.",
    ],
    answer: 1,
    explanation:
      "지문은 “The initial crew assignment of Commander Neil Armstrong, Command Module Pilot (CMP) Jim Lovell, and Lunar Module Pilot (LMP) Buzz Aldrin on the backup crew for Apollo 9 was officially announced on November 20, 1967.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 3,
  },
  {
    id: "dad-history-v2-096",
    passageId: "age-of-discovery-8",
    prompt:
      "By what year had the Portuguese reached Japan, according to this passage?",
    options: ["1543", "1498", "1492", "1512"],
    answer: 0,
    explanation: "지문은 포르투갈인이 1543년 일본에 도달했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-082",
    passageId: "renaissance-2",
    prompt:
      "What word does Protagoras use to describe man's role, as quoted here?",
    options: [
      "Man is the measure of all things",
      "Man is the servant of the gods",
      "Man is bound by classical antiquity",
      "Man is defined by movable type",
    ],
    answer: 0,
    explanation:
      "지문은 프로타고라스가 '인간이 만물의 척도'라고 말했다고 인용합니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-078",
    passageId: "calendar-6",
    prompt: "What does the passage state about arithmetic calendar?",
    options: [
      "The Gregorian calendar was introduced in 1582 as a refinement to the Julian calendar, which had been in use throughout the European Middle Ages, amounting to a 0.002% correction in the length of the year.",
      "An arithmetic calendar is one that is based on a strict set of rules; an example is the current Jewish calendar.",
      "Because the number of days in the tropical year is not a whole number, a solar calendar must have a different number of days in different years.",
      "Cultures may define other units of time, such as the week, for the purpose of scheduling regular activities that do not easily coincide with months or years.",
    ],
    answer: 1,
    explanation:
      "지문은 “An arithmetic calendar is one that is based on a strict set of rules; an example is the current Jewish calendar.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-132",
    passageId: "gutenberg-bible-4",
    prompt:
      "What kind of texts might Gutenberg have printed before the Bible, per this passage?",
    options: [
      "Trade agreements of the Hanseatic League",
      "Only copies of the Bible itself",
      "Scientific treatises by Newton",
      "Religious documents, a German poem, and editions of a Latin grammar book",
    ],
    answer: 3,
    explanation:
      "지문은 구텐베르크가 성경 이전에 종교 문서, 독일어 시, 라틴어 문법서 등을 인쇄했을 것이라고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-107",
    passageId: "scientific-revolution-3",
    prompt: 'Who first applied the word "revolution" to Isaac Newton in 1747?',
    options: [
      "William Whewell",
      "Alexis Clairaut",
      "Alexandre Koyré",
      "Thomas Kuhn",
    ],
    answer: 1,
    explanation:
      "지문은 1747년 프랑스 수학자 알렉시 클레로가 뉴턴에게 '혁명'이라는 말을 적용했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-029",
    passageId: "rosetta-stone-5",
    prompt: "What does the passage state about Ptolemaic kings?",
    options: [
      "Securing the favour of the priesthood was essential for the Ptolemaic kings to retain effective rule over the populace.",
      "The stele was almost certainly not originally placed at Rashid (Rosetta) where it was found, but more likely came from a temple site farther inland, possibly the royal town of Sais.",
      "The Greek text on the Rosetta Stone provided the starting point.",
      "Study of the decree was already underway when the first complete translation of the Greek text was published in 1803.",
    ],
    answer: 0,
    explanation:
      "지문은 “Securing the favour of the priesthood was essential for the Ptolemaic kings to retain effective rule over the populace.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 3,
  },
  {
    id: "dad-history-v2-024",
    passageId: "printing-press-6",
    prompt: "What does the passage state about codex book?",
    options: [
      "Several more innovations and improvements followed before the start of the Industrial Revolution.",
      "Johannes Gutenberg invented the movable-type printing press around 1440, utilizing four existing technologies: the screw press, movable type, the codex book format, and mechanized paper production.",
      "The first factor, the screw press, permitted direct pressure to be applied on a flat plane.",
      "The codex book format also dated to the Roman Empire, and was of utmost significance in the history of the book.",
    ],
    answer: 3,
    explanation:
      "지문은 “The codex book format also dated to the Roman Empire, and was of utmost significance in the history of the book.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-122",
    passageId: "silk-production-history-2",
    prompt: "What brought silk production to Western Europe, per this passage?",
    options: [
      "The Meiji Restoration",
      "The Industrial Revolution",
      "The Crusades",
      "The Age of Discovery",
    ],
    answer: 2,
    explanation:
      "지문은 십자군 전쟁이 비단 생산을 서유럽으로 가져왔다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-131",
    passageId: "gutenberg-bible-3",
    prompt: "Who translated the Vulgate on which the Gutenberg Bible is based?",
    options: [
      "Aelius Donatus",
      "Johannes Gutenberg",
      "Pope Pius II",
      "St Jerome",
    ],
    answer: 3,
    explanation:
      "지문은 구텐베르크 성경이 히에로니무스가 번역한 불가타 판본이라고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-139",
    passageId: "meiji-restoration-3",
    prompt:
      "On what date did Emperor Meiji declare political power to be restored to the Imperial House?",
    options: ["1543", "27 January 1867", "1889", "3 January 1868"],
    answer: 3,
    explanation:
      "지문은 1868년 1월 3일 메이지 천황이 정치권력의 회복을 선언했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-133",
    passageId: "gutenberg-bible-5",
    prompt:
      "What is the first precisely datable print associated with Gutenberg, per this passage?",
    options: [
      "The Charter Oath",
      "The 42-line Bible",
      "The Ars Grammatica",
      "The 31-line Indulgence",
    ],
    answer: 3,
    explanation:
      "지문은 구텐베르크의 31행 면죄부가 가장 정확히 시기를 알 수 있는 초기 인쇄물이라고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-073",
    passageId: "apollo-11-7",
    prompt: "What does the passage state about Soviet Union?",
    options: [
      "The Soviet Union appeared to be winning the Space Race, but its early lead was overtaken by the US Gemini program and Soviet failure to develop the N1 launcher, which would have been comparable to the Saturn V.",
      "In the late 1950s and early 1960s, the United States was engaged in the Cold War, a geopolitical rivalry with the Soviet Union.",
      "This incident sparked the Sputnik crisis and ignited the Space Race, as both superpowers sought to demonstrate superiority in spaceflight.",
      "An early and crucial decision was choosing lunar orbit rendezvous over both direct ascent and Earth orbit rendezvous.",
    ],
    answer: 0,
    explanation:
      "지문은 “The Soviet Union appeared to be winning the Space Race, but its early lead was overtaken by the US Gemini program and Soviet failure to develop the N1 launcher, which would have been comparable to the Saturn V.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-127",
    passageId: "silk-production-history-7",
    prompt:
      "Which ancient Chinese records note that sericulture was practiced in ancient Korea?",
    options: [
      "The Jikji",
      "The Old Testament",
      "The Book of Han and Records of the Three Kingdoms",
      "The Charter Oath",
    ],
    answer: 2,
    explanation:
      "지문은 한서와 삼국지 같은 중국 사서가 고대 한국에서 양잠이 이루어졌음을 기록한다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-046",
    passageId: "great-fire-4",
    prompt: "What does the passage state about relationship between?",
    options: [
      "The riverfront was important in the development of the Great Fire.",
      "The relationship between the City and the Crown was often tense.",
      "The high Roman wall enclosing the city impeded escape from the inferno, restricting exit to eight narrow gates.",
      "Fires were common in the crowded wood-built city with its open fireplaces, candles, ovens, and stores of combustibles.",
    ],
    answer: 1,
    explanation:
      "지문은 “The relationship between the City and the Crown was often tense.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-047",
    passageId: "great-fire-5",
    prompt: "What does the passage state about essentially medieval?",
    options: [
      "The high Roman wall enclosing the city impeded escape from the inferno, restricting exit to eight narrow gates.",
      "Fires were common in the crowded wood-built city with its open fireplaces, candles, ovens, and stores of combustibles.",
      "The city was essentially medieval in its street plan, an overcrowded warren of narrow, winding, cobbled alleys.",
      "By the 1660s, London was by far the largest city in Britain and the third largest in the Western world, estimated at 300,000 to 400,000 inhabitants.",
    ],
    answer: 2,
    explanation:
      "지문은 “The city was essentially medieval in its street plan, an overcrowded warren of narrow, winding, cobbled alleys.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 3,
  },
  {
    id: "dad-history-v2-003",
    passageId: "rosetta-stone-1",
    prompt: "When and on whose behalf was the decree issued?",
    options: [
      "1799, on behalf of a French officer",
      "1822, on behalf of Champollion",
      "196 BC, on behalf of Ptolemy V Epiphanes",
      "The first century CE, on behalf of a Roman emperor",
    ],
    answer: 2,
    explanation:
      "세 판본의 포고령은 기원전 196년 프톨레마이오스 5세 에피파네스의 이름으로 발표되었습니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-118",
    passageId: "hanseatic-league-6",
    prompt:
      "What was the most emblematic vessel type used by the Hanseatic League?",
    options: ["The hulk", "The carvel ship", "The cog", "The galleon"],
    answer: 2,
    explanation:
      "지문은 코그가 한자 동맹을 상징하는 가장 대표적인 선박 유형이었다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-037",
    passageId: "silk-road-7",
    prompt: "What does the passage state about southern route?",
    options: [
      "The southern route or Karakoram route was mainly a single route from China through the Karakoram mountains, where it persists in modern times as the Karakoram Highway, a paved road through Khunjerab Pass that connects Pakistan and China.",
      "From 1453 onwards, the Ottoman Empire began competing with other gunpowder empires for greater control over the overland routes, which prompted European polities to seek alternatives while themselves gaining leverage over their trade partners.",
      "The Silk Road derives its name from the lucrative trade in silk, first developed in China, and a major reason for the connection of trade routes into an extensive transcontinental network.",
      "The use of the term 'Silk Road' is not without its detractors.",
    ],
    answer: 0,
    explanation:
      "지문은 “The southern route or Karakoram route was mainly a single route from China through the Karakoram mountains, where it persists in modern times as the Karakoram Highway, a paved road through Khunjerab Pass that connects Pakistan and China.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-134",
    passageId: "gutenberg-bible-6",
    prompt:
      "Why was each sheet of paper dampened before printing, according to this passage?",
    options: [
      "To make the paper lighter",
      "To prevent the type from rusting",
      "To reduce the number of lines per page",
      "To improve ink absorption",
    ],
    answer: 3,
    explanation:
      "지문은 잉크 흡수를 돕기 위해 종이를 인쇄 전에 적셨다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-045",
    passageId: "great-fire-3",
    prompt: "What does the passage state about largest city?",
    options: [
      "By the 1660s, London was by far the largest city in Britain and the third largest in the Western world, estimated at 300,000 to 400,000 inhabitants.",
      "The city was essentially medieval in its street plan, an overcrowded warren of narrow, winding, cobbled alleys.",
      "The riverfront was important in the development of the Great Fire.",
      "The high Roman wall enclosing the city impeded escape from the inferno, restricting exit to eight narrow gates.",
    ],
    answer: 0,
    explanation:
      "지문은 “By the 1660s, London was by far the largest city in Britain and the third largest in the Western world, estimated at 300,000 to 400,000 inhabitants.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-111",
    passageId: "scientific-revolution-7",
    prompt:
      "What did Galileo Galilei's telescopic observations provide, according to this passage?",
    options: [
      "Proof of the discovery doctrine",
      "Persuasive evidence for heliocentrism",
      "The founding charter of the Royal Society",
      "Evidence for Newton's Principia",
    ],
    answer: 1,
    explanation:
      "지문은 갈릴레이의 망원경 관측이 지동설에 설득력 있는 증거를 제공했다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-114",
    passageId: "hanseatic-league-2",
    prompt: "What did the league's arrangements evolve to offer traders?",
    options: [
      "Free citizenship in every member city",
      "A standing military draft",
      "Toll privileges and protection on affiliated territory and trade routes",
      "A single unified currency",
    ],
    answer: 2,
    explanation:
      "지문은 동맹의 협정이 상인들에게 통행세 특권과 무역로 보호를 제공하는 방향으로 발전했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-123",
    passageId: "silk-production-history-3",
    prompt:
      "Which country's silk industry never fully recovered from a silkworm disease epidemic, per this passage?",
    options: ["Japan", "China", "France", "England"],
    answer: 2,
    explanation:
      "지문은 프랑스의 비단 산업이 누에 질병 유행 이후 완전히 회복하지 못했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-087",
    passageId: "renaissance-7",
    prompt:
      "What event is described as concluding the Italian Renaissance in 1527?",
    options: [
      "Charles V's assault on Rome during the war of the League of Cognac",
      "Vasco da Gama's voyage to India",
      "The printing of Copernicus's book",
      "The fall of Constantinople",
    ],
    answer: 0,
    explanation:
      "지문은 1527년 카를 5세가 코냐크 동맹 전쟁 중 로마를 공격한 사건으로 이탈리아 르네상스가 끝났다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-060",
    passageId: "magna-carta-6",
    prompt: "What does the passage state about historian David?",
    options: [
      "In one sense this was not unprecedented.",
      'The rebels took an oath that they would "stand fast for the liberty of the church and the realm", and demanded that the King confirm the Charter of Liberties that had been declared by King Henry I in the previous century, and which was perceived by the barons to protect their rights.',
      "It was John's hope that the Pope would give him valuable legal and moral support, and accordingly John played for time; the King had declared himself to be a papal vassal in 1213 and correctly believed he could count on the Pope for help.",
      'Although, as the historian David Carpenter has noted, the charter "wasted no time on political theory", it went beyond simply addressing individual baronial complaints, and formed a wider proposal for political reform.',
    ],
    answer: 3,
    explanation:
      '지문은 “Although, as the historian David Carpenter has noted, the charter "wasted no time on political theory", it went beyond simply addressing individual baronial complaints, and formed a wider proposal for political reform.”라고 설명하므로 이 선택지가 지문에 근거합니다.',
    difficulty: 1,
  },
  {
    id: "dad-history-v2-052",
    passageId: "library-alexandria-4",
    prompt: "What does the passage state about Library dwindled?",
    options: [
      "Modern scholars agree that while it is possible that Ptolemy I, a historian and author of an account of Alexander's campaign, laid the groundwork for the Library, it probably did not become a physical institution until the reign of Ptolemy II.",
      "The Library was built in the Brucheion (Royal Quarter) as part of the Mouseion.",
      "The Library of Alexandria was not affiliated with any particular philosophical school; consequently, scholars who studied there had considerable academic freedom.",
      "The Library dwindled during the Roman period, from a lack of funding and support.",
    ],
    answer: 3,
    explanation:
      "지문은 “The Library dwindled during the Roman period, from a lack of funding and support.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-081",
    passageId: "renaissance-1",
    prompt: "Where was the Renaissance first centered before it spread?",
    options: [
      "The Republic of Florence",
      "The Kingdom of Spain",
      "The city of Rome",
      "The Ottoman Empire",
    ],
    answer: 0,
    explanation:
      "지문은 르네상스가 피렌체 공화국에서 먼저 중심을 이루었다가 이탈리아와 유럽으로 퍼졌다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-014",
    passageId: "magna-carta-2",
    prompt: "Why did the document acquire the name “Magna Carta” in 1217?",
    options: [
      "It was sealed at Runnymede for the first time",
      "It was part of the Lambeth peace treaty and needed distinction from the Charter of the Forest",
      "It was reissued in exchange for new taxes",
      "It became part of statute law",
    ],
    answer: 1,
    explanation:
      "1217년 램버스 평화조약의 일부가 되었고 동시에 발행된 삼림헌장과 구별하려고 이름이 붙었습니다.",
    difficulty: 3,
  },
  {
    id: "dad-history-v2-141",
    passageId: "meiji-restoration-5",
    prompt:
      "Who sat at the top of the Edo period's descending social hierarchy, per this passage?",
    options: [
      "The merchant class",
      "The shōgun alone",
      "The samurai class",
      "The Emperor and their Court",
    ],
    answer: 3,
    explanation:
      "지문은 에도 시대 위계에서 천황과 조정이 가장 위에 있었다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-092",
    passageId: "age-of-discovery-4",
    prompt: "Who has challenged the discovery doctrine, per this passage?",
    options: [
      "The Ottoman Empire",
      "Indigenous peoples and researchers",
      "The Catholic Monarchs of Spain",
      "The Hanseatic League",
    ],
    answer: 1,
    explanation:
      "지문은 발견 원칙이 원주민과 연구자들에 의해 도전받아 왔다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-086",
    passageId: "renaissance-6",
    prompt:
      "When is the Italian Proto-Renaissance said to have begun, per the passage?",
    options: [
      "Around 1250 or 1300",
      "In the 17th century",
      "In 1517",
      "In 1527",
    ],
    answer: 0,
    explanation:
      "지문은 이탈리아 원시 르네상스가 대략 1250년 또는 1300년경 시작되었다고 밝힙니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-034",
    passageId: "silk-road-4",
    prompt: "How does this passage explain the origin of the Silk Road's name?",
    options: [
      "The northern route travelled northwest through the Chinese province of Gansu from Shaanxi Province and split into three further routes, two of them following the mountain ranges to the north and south of the Taklamakan Desert to rejoin at Kashgar, and the other going north of the Tian Shan mountains through Turpan, Talgar, and Almaty (in what is now southeast Kazakhstan).",
      "The Silk Road derives its name from the lucrative trade in silk, first developed in China, and a major reason for the connection of trade routes into an extensive transcontinental network.",
      "The southern route or Karakoram route was mainly a single route from China through the Karakoram mountains, where it persists in modern times as the Karakoram Highway, a paved road through Khunjerab Pass that connects Pakistan and China.",
      "The Maritime Silk Road or Maritime Silk Route is the maritime section of the historic Silk Road that connected Southeast Asia, East Asia, the Indian subcontinent, the Arabian Peninsula, eastern Africa, and Europe.",
    ],
    answer: 1,
    explanation:
      "지문은 “The Silk Road derives its name from the lucrative trade in silk, first developed in China, and a major reason for the connection of trade routes into an extensive transcontinental network.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-015",
    passageId: "enigma-machine-1",
    prompt: "What happened when ciphertext was entered into the machine?",
    options: [
      "It became a new ciphertext with no readable form",
      "It was converted into a calendar date",
      "It was transformed back into readable plaintext",
      "It caused the keyboard to use only Latin words",
    ],
    answer: 2,
    explanation:
      "지문은 암호문을 입력하면 읽을 수 있는 평문으로 변환된다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-033",
    passageId: "silk-road-3",
    prompt: "What does the passage state about Ottoman Empire?",
    options: [
      "From 1453 onwards, the Ottoman Empire began competing with other gunpowder empires for greater control over the overland routes, which prompted European polities to seek alternatives while themselves gaining leverage over their trade partners.",
      "The use of the term 'Silk Road' is not without its detractors.",
      "The northern route travelled northwest through the Chinese province of Gansu from Shaanxi Province and split into three further routes, two of them following the mountain ranges to the north and south of the Taklamakan Desert to rejoin at Kashgar, and the other going north of the Tian Shan mountains through Turpan, Talgar, and Almaty (in what is now southeast Kazakhstan).",
      "The southern route or Karakoram route was mainly a single route from China through the Karakoram mountains, where it persists in modern times as the Karakoram Highway, a paved road through Khunjerab Pass that connects Pakistan and China.",
    ],
    answer: 0,
    explanation:
      "지문은 “From 1453 onwards, the Ottoman Empire began competing with other gunpowder empires for greater control over the overland routes, which prompted European polities to seek alternatives while themselves gaining leverage over their trade partners.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-135",
    passageId: "gutenberg-bible-7",
    prompt:
      "How was the increase from 40 to 42 lines per page achieved, per this passage?",
    options: [
      "By switching to a smaller typeface entirely",
      "By enlarging the page size",
      "By reducing the number of words per line",
      "By decreasing the interline spacing rather than increasing the printed area",
    ],
    answer: 3,
    explanation:
      "지문은 인쇄 면적을 늘리지 않고 줄 간격을 줄여서 40줄에서 42줄로 늘렸다고 설명합니다.",
    difficulty: 3,
  },
  {
    id: "dad-history-v2-008",
    passageId: "industrial-revolution-2",
    prompt: "Why did textiles become the dominant industry in this account?",
    options: [
      "They were the only industry with British innovations",
      "They relied on hand methods longer than other industries",
      "They were mainly a source of architectural innovation",
      "They were first to use modern production methods and led in employment, output value, and capital",
    ],
    answer: 3,
    explanation:
      "섬유업이 현대적 생산 방식을 먼저 사용했고 고용·생산액·투자자본에서 우세했기 때문입니다.",
    difficulty: 3,
  },
  {
    id: "dad-history-v2-030",
    passageId: "rosetta-stone-6",
    prompt: "What does the passage state about definitive English?",
    options: [
      "The Greek text on the Rosetta Stone provided the starting point.",
      "There can be no one definitive English translation of the decree, not only because modern understanding of the ancient languages continues to develop, but also because of the minor differences between the three original texts.",
      "Study of the decree was already underway when the first complete translation of the Greek text was published in 1803.",
      "Three other fragmentary copies of the same decree were discovered later, and several similar Egyptian bilingual or trilingual inscriptions are now known, including three slightly earlier Ptolemaic decrees: the Decree of Alexandria in 243 BC, the Decree of Canopus in 238 BC, and the Memphis decree of Ptolemy IV, .",
    ],
    answer: 1,
    explanation:
      "지문은 “There can be no one definitive English translation of the decree, not only because modern understanding of the ancient languages continues to develop, but also because of the minor differences between the three original texts.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-088",
    passageId: "renaissance-8",
    prompt:
      "Which event is linked to the migration of Greek scholars and texts into Italy?",
    options: [
      "The fall of Constantinople to the Ottoman Empire",
      "The Sack of Rome in 1527",
      "The Reformation of 1517",
      "The Counter-Reformation of 1545",
    ],
    answer: 0,
    explanation:
      "지문은 콘스탄티노플이 오스만 제국에 함락되면서 그리스 학자들과 문헌이 이탈리아로 이주했다고 설명합니다.",
    difficulty: 3,
  },
  {
    id: "dad-history-v2-007",
    passageId: "industrial-revolution-1",
    prompt: "What kind of change does the excerpt chiefly describe?",
    options: [
      "A political change from monarchy to parliament",
      "A cultural shift from Latin to vernacular books",
      "A global economic transition toward more widespread and efficient manufacturing",
      "A return from machines to hand production",
    ],
    answer: 2,
    explanation:
      "핵심은 세계 경제가 더 널리, 효율적이고 안정적인 제조 과정으로 전환한 것입니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-031",
    passageId: "rosetta-stone-7",
    prompt: "What does the passage state about almost certainly?",
    options: [
      "Study of the decree was already underway when the first complete translation of the Greek text was published in 1803.",
      "Three other fragmentary copies of the same decree were discovered later, and several similar Egyptian bilingual or trilingual inscriptions are now known, including three slightly earlier Ptolemaic decrees: the Decree of Alexandria in 243 BC, the Decree of Canopus in 238 BC, and the Memphis decree of Ptolemy IV, .",
      "The stele was almost certainly not originally placed at Rashid (Rosetta) where it was found, but more likely came from a temple site farther inland, possibly the royal town of Sais.",
      "Securing the favour of the priesthood was essential for the Ptolemaic kings to retain effective rule over the populace.",
    ],
    answer: 2,
    explanation:
      "지문은 “The stele was almost certainly not originally placed at Rashid (Rosetta) where it was found, but more likely came from a temple site farther inland, possibly the royal town of Sais.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-094",
    passageId: "age-of-discovery-6",
    prompt:
      "Who sponsored the systematic Portuguese exploration of Africa's Atlantic coast beginning in 1418?",
    options: [
      "Prince Henry the Navigator",
      "Vasco da Gama",
      "Christopher Columbus",
      "Pedro Álvares Cabral",
    ],
    answer: 0,
    explanation:
      "지문은 1418년부터 엔히크 왕자의 후원으로 아프리카 대서양 연안 탐험이 체계적으로 시작되었다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-102",
    passageId: "roman-republic-6",
    prompt: "What is stated about Tarquin's attempts to retake the throne?",
    options: [
      "They succeeded after the war with Clusium",
      "They ultimately did not succeed",
      "They succeeded through the Tarquinian conspiracy",
      "They were abandoned before any war was fought",
    ],
    answer: 1,
    explanation:
      "지문은 타르퀴니우스의 왕정 복고 시도가 여러 전쟁과 음모에도 불구하고 성공하지 못했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-090",
    passageId: "age-of-discovery-2",
    prompt:
      "What did the Columbian exchange involve, according to this passage?",
    options: [
      "Only the transfer of maps between mapmakers",
      "The transfer of plants, animals, populations, diseases, and culture between hemispheres",
      "Only military conflict between Spain and Portugal",
      "The abolition of the discovery doctrine",
    ],
    answer: 1,
    explanation:
      "지문은 콜럼버스적 교환이 식물, 동물, 인구, 질병, 문화의 이동을 포함했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-020",
    passageId: "calendar-2",
    prompt:
      "What can be inferred from the claim that synchronization is “usually, though not necessarily” used?",
    options: [
      "Every calendar must follow both the sun and the moon",
      "Calendars never use natural cycles",
      "Only pre-modern calendars can use natural cycles",
      "Synchronization with the sun or moon is common but not required",
    ],
    answer: 3,
    explanation:
      "“보통이지만 반드시 그렇지는 않다”는 표현은 태양·달 주기와의 동기화가 일반적이나 필수는 아님을 뜻합니다.",
    difficulty: 3,
  },
  {
    id: "dad-history-v2-099",
    passageId: "roman-republic-3",
    prompt:
      "What outcome followed Rome's victory at the Battle of Zama in 202 BC?",
    options: [
      "Rome became the dominant power in the ancient Mediterranean world",
      "Rome lost its territory in Italy",
      "Carthage became the dominant Mediterranean power",
      "Rome entered a period of Pax Romana",
    ],
    answer: 0,
    explanation:
      "지문은 기원전 202년 자마 전투 승리 이후 로마가 지중해 세계의 지배적 강국이 되었다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-022",
    passageId: "printing-press-4",
    prompt: "What does the passage state about screw press?",
    options: [
      "The codex book format also dated to the Roman Empire, and was of utmost significance in the history of the book.",
      "The first factor, the screw press, permitted direct pressure to be applied on a flat plane.",
      "The overall design of the wooden handpress was largely consistent throughout its long history, but its construction and performance improved considerably over three centuries, with metal screws replacing wooden ones and the tympan and frisket becoming standard fittings.",
      "Several more innovations and improvements followed before the start of the Industrial Revolution.",
    ],
    answer: 1,
    explanation:
      "지문은 “The first factor, the screw press, permitted direct pressure to be applied on a flat plane.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-040",
    passageId: "industrial-revolution-4",
    prompt: "What does the passage state about value added?",
    options: [
      "These advances were capitalised on by entrepreneurs, of whom the best known is Arkwright.",
      "In the UK in 1720, there were 20,500 tons of charcoal iron and 400 tons with coke.",
      "Coke pig iron was hardly used to produce wrought iron until 1755, when Darby's son Abraham Darby II built furnaces at Horsehay and Ketley where low sulfur coal was available, and not far from Coalbrookdale.",
      "The share of value added by the cotton industry in Britain was 2.6% in 1760, 17% in 1801, and 22% in 1831.",
    ],
    answer: 3,
    explanation:
      "지문은 “The share of value added by the cotton industry in Britain was 2.6% in 1760, 17% in 1801, and 22% in 1831.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-062",
    passageId: "magna-carta-8",
    prompt: "What does the passage state about previously conceded?",
    options: [
      "It was John's hope that the Pope would give him valuable legal and moral support, and accordingly John played for time; the King had declared himself to be a papal vassal in 1213 and correctly believed he could count on the Pope for help.",
      "In one sense this was not unprecedented.",
      "Letters backing John arrived from the Pope in April, but by then the rebel barons had organised into a military faction.",
      'Although, as the historian David Carpenter has noted, the charter "wasted no time on political theory", it went beyond simply addressing individual baronial complaints, and formed a wider proposal for political reform.',
    ],
    answer: 1,
    explanation:
      "지문은 “In one sense this was not unprecedented.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 3,
  },
  {
    id: "dad-history-v2-051",
    passageId: "library-alexandria-3",
    prompt: "What does the passage state about Library declined?",
    options: [
      "The Library was one of the largest and most significant libraries of the ancient world, but details about it are a mixture of history and legend.",
      "Modern scholars agree that while it is possible that Ptolemy I, a historian and author of an account of Alexander's campaign, laid the groundwork for the Library, it probably did not become a physical institution until the reign of Ptolemy II.",
      "The influence of the Library declined gradually over the course of several centuries.",
      "The Library was built in the Brucheion (Royal Quarter) as part of the Mouseion.",
    ],
    answer: 2,
    explanation:
      "지문은 “The influence of the Library declined gradually over the course of several centuries.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-100",
    passageId: "roman-republic-4",
    prompt:
      "How was the Conflict of the Orders between patricians and plebs eventually resolved?",
    options: [
      "Peacefully, with plebs achieving political equality by the 4th century BC",
      "Through the Social War",
      "Through the Servile Wars",
      "It was never resolved",
    ],
    answer: 0,
    explanation:
      "지문은 신분 투쟁이 평화적으로 해결되어 기원전 4세기까지 평민이 정치적 평등을 얻었다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-106",
    passageId: "scientific-revolution-2",
    prompt:
      "With which two 1543 publications is the Scientific Revolution's start frequently associated?",
    options: [
      "Principia by Newton and Ars Grammatica by Donatus",
      "De humani corporis fabrica by Vesalius and De Revolutionibus by Copernicus",
      "The Gutenberg Bible and the 42-line Bible",
      "The Charter Oath and the Meiji Constitution",
    ],
    answer: 1,
    explanation:
      "지문은 1543년 베살리우스의 인체 해부학 저서와 코페르니쿠스의 천구 회전에 관하여가 시작점으로 자주 언급된다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-128",
    passageId: "silk-production-history-8",
    prompt:
      "Where were the earliest examples of silk production outside China discovered?",
    options: [
      "Medieval Italy",
      "The Byzantine Empire",
      "The Chanhudaro site in the Indus Valley civilisation",
      "Ancient Korea",
    ],
    answer: 2,
    explanation:
      "지문은 중국 밖에서 가장 오래된 비단 생산 사례가 인더스 문명의 찬후다로 유적에서 발견되었다고 설명합니다.",
    difficulty: 3,
  },
  {
    id: "dad-history-v2-050",
    passageId: "great-fire-8",
    prompt: "What does the passage state about crowded wood-built?",
    options: [
      "The relationship between the City and the Crown was often tense.",
      "Fires were common in the crowded wood-built city with its open fireplaces, candles, ovens, and stores of combustibles.",
      "The city was essentially medieval in its street plan, an overcrowded warren of narrow, winding, cobbled alleys.",
      "The riverfront was important in the development of the Great Fire.",
    ],
    answer: 1,
    explanation:
      "지문은 “Fires were common in the crowded wood-built city with its open fireplaces, candles, ovens, and stores of combustibles.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 3,
  },
  {
    id: "dad-history-v2-072",
    passageId: "apollo-11-6",
    prompt: "What does the passage state about Project Apollo?",
    options: [
      "The initial crew assignment of Commander Neil Armstrong, Command Module Pilot (CMP) Jim Lovell, and Lunar Module Pilot (LMP) Buzz Aldrin on the backup crew for Apollo 9 was officially announced on November 20, 1967.",
      "In the late 1950s and early 1960s, the United States was engaged in the Cold War, a geopolitical rivalry with the Soviet Union.",
      "This incident sparked the Sputnik crisis and ignited the Space Race, as both superpowers sought to demonstrate superiority in spaceflight.",
      "Project Apollo was abruptly halted by the Apollo 1 fire on January 27, 1967, in which astronauts Gus Grissom, Ed White, and Roger B.",
    ],
    answer: 3,
    explanation:
      "지문은 “Project Apollo was abruptly halted by the Apollo 1 fire on January 27, 1967, in which astronauts Gus Grissom, Ed White, and Roger B.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-116",
    passageId: "hanseatic-league-4",
    prompt:
      "Which organization is described as the only autonomous landed state to hold Hanseatic League membership?",
    options: [
      "The city of Cologne",
      "The Kontor of Bergen",
      "The Teutonic Order",
      "The Kingdom of Estonia",
    ],
    answer: 2,
    explanation:
      "지문은 튜튼 기사단이 한자 동맹 회원 중 유일하게 자치 영지를 가진 국가였다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-005",
    passageId: "silk-road-1",
    prompt: "What span of time does the passage give for Silk Road activity?",
    options: [
      "From the second century BCE until the mid-15th century",
      "From the late 19th century until the 21st century",
      "From 196 BC until 1799",
      "Only during the Roman Empire",
    ],
    answer: 0,
    explanation:
      "지문은 실크로드가 기원전 2세기부터 15세기 중반까지 활동했다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-058",
    passageId: "magna-carta-4",
    prompt: "What does the passage state about John's hope?",
    options: [
      'Although, as the historian David Carpenter has noted, the charter "wasted no time on political theory", it went beyond simply addressing individual baronial complaints, and formed a wider proposal for political reform.',
      "It was John's hope that the Pope would give him valuable legal and moral support, and accordingly John played for time; the King had declared himself to be a papal vassal in 1213 and correctly believed he could count on the Pope for help.",
      'Under what historians later labelled "clause 61", or the "security clause", a council of 25 barons would be created to monitor and ensure John\'s future adherence to the charter.',
      "In one sense this was not unprecedented.",
    ],
    answer: 1,
    explanation:
      "지문은 “It was John's hope that the Pope would give him valuable legal and moral support, and accordingly John played for time; the King had declared himself to be a papal vassal in 1213 and correctly believed he could count on the Pope for help.”라고 설명하므로 이 선택지가 지문에 근거합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-017",
    passageId: "apollo-11-1",
    prompt: "What larger geopolitical competition did Apollo 11 culminate?",
    options: [
      "The Space Race between the United States and the Soviet Union",
      "The Second Anglo-Dutch War between England and the Netherlands",
      "The First Barons’ War in England",
      "A competition between rival European printing firms",
    ],
    answer: 0,
    explanation:
      "아폴로 11호는 냉전 경쟁에 뿌리를 둔 미국과 소련의 우주 경쟁의 정점이었습니다.",
    difficulty: 1,
  },
  {
    id: "dad-history-v2-101",
    passageId: "roman-republic-5",
    prompt:
      "Why was the last Roman king, Tarquin the Proud, said to have been expelled in 509 BC?",
    options: [
      "Because he lost the Battle of Zama",
      "Because his son Sextus Tarquinius raped a noblewoman, Lucretia",
      "Because the Gauls sacked Rome",
      "Because the Senate abolished the monarchy for financial reasons",
    ],
    answer: 1,
    explanation:
      "지문은 아들 섹스투스 타르퀴니우스가 귀부인 루크레티아를 겁탈한 사건으로 왕이 추방되었다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-125",
    passageId: "silk-production-history-5",
    prompt:
      "Where was the earliest evidence of silk, dating back over 8,500 years, found?",
    options: [
      "Royal tombs of the Shang dynasty",
      "The Chanhudaro site in the Indus Valley",
      "The early Neolithic Age tombs of Jiahu, China",
      "A Liangzhu culture site in Zhejiang",
    ],
    answer: 2,
    explanation:
      "지문은 8,500년 이상 된 가장 오래된 비단 증거가 중국 자후의 신석기 무덤에서 발견되었다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-history-v2-085",
    passageId: "renaissance-5",
    prompt:
      "How do many historians today view the Renaissance, in contrast with the traditional view?",
    options: [
      "As a complete break from the past",
      "As an extension of the Middle Ages",
      "As a purely political revolution",
      "As unrelated to medieval culture",
    ],
    answer: 1,
    explanation:
      "지문은 많은 현대 역사가들이 르네상스를 중세의 연장으로 본다고 설명합니다.",
    difficulty: 2,
  },
];

export const dadHistoryQuestions = questionSpecs.map((spec) =>
  buildQuestion(spec),
);
