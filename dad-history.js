import historySources from "./assets/wikipedia/history-sources.json" with { type: "json" };

const passagesById = new Map(
  historySources.passages.map((passage) => [passage.id, passage]),
);
const articlesById = new Map(
  historySources.articles.map((article) => [article.id, article]),
);

const buildQuestion = (spec, number) => {
  const passage = passagesById.get(spec.passageId);
  if (!passage) throw new Error(`Missing history passage: ${spec.passageId}`);
  const article = articlesById.get(passage.articleId);
  if (!article)
    throw new Error(`Missing history article: ${passage.articleId}`);
  return {
    id: `dad-history-${String(number).padStart(3, "0")}`,
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
    passageId: "printing-press-1",
    prompt:
      "What language pattern does the passage associate with the spread of printed books?",
    options: [
      "Latin increasingly replaced vernacular languages",
      "Books increasingly appeared in vernacular languages rather than Latin",
      "Greek increasingly replaced every European language",
      "National languages disappeared from printed books",
    ],
    answer: 1,
    explanation:
      "인쇄된 책이 라틴어보다 자국어로 점점 더 많이 나타났고, 국가 언어가 표준화되었다고 지문은 설명합니다.",
    difficulty: 2,
  },
  {
    passageId: "printing-press-1",
    prompt:
      "Which broad result does the passage link to printing spreading through European society?",
    options: [
      "A return to hand production",
      "A decline in the availability of texts",
      "An era of mass communication",
      "The end of the Scientific Revolution",
    ],
    answer: 2,
    explanation:
      "인쇄의 확산이 유럽 사회에서 대중 통신의 시대를 열었다고 지문에 나옵니다.",
    difficulty: 1,
  },
  {
    passageId: "printing-press-1",
    prompt:
      "What combination helped printed texts support higher adult literacy rates?",
    options: [
      "Prices rose while availability fell",
      "Books became limited to Latin readers",
      "National languages were abandoned",
      "The cost declined and availability increased",
    ],
    answer: 3,
    explanation:
      "지문은 인쇄물의 비용이 낮아지고 이용 가능성이 높아져 성인 문해율 향상에 도움이 되었다고 설명합니다.",
    difficulty: 2,
  },
  {
    passageId: "printing-press-2",
    prompt:
      "For how long was the basic wooden handpress design largely consistent?",
    options: [
      "For over three centuries",
      "For about three decades",
      "From 1814 until 1843",
      "Only during the twentieth century",
    ],
    answer: 0,
    explanation:
      "목재 수동 인쇄기의 기본 설계는 산업혁명 때까지 3세기 넘게 대체로 유지되었습니다.",
    difficulty: 1,
  },
  {
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
    passageId: "printing-press-2",
    prompt:
      "Which features did The Times receive when it adopted Friedrich Koenig’s presses in 1814?",
    options: [
      "Iron plates and one-pull printing",
      "Offset printing and phototypesetting",
      "Steam power and rotary motion",
      "Digital printing and standardized languages",
    ],
    answer: 2,
    explanation:
      "1814년 타임스가 채택한 쾨니히의 인쇄기는 증기 동력과 회전 운동을 결합했습니다.",
    difficulty: 2,
  },
  {
    passageId: "printing-press-2",
    prompt:
      "What does the passage say later rotary presses could eventually produce?",
    options: [
      "A single sheet at one pull",
      "Only handwritten books",
      "Only vernacular-language editions",
      "Millions of page impressions in a day",
    ],
    answer: 3,
    explanation:
      "호의 회전식 인쇄기는 생산량을 크게 높였고, 이후 회전식 모델은 하루 수백만 페이지 인상을 낼 수 있었습니다.",
    difficulty: 2,
  },
  {
    passageId: "rosetta-stone-1",
    prompt: "What material is the Rosetta Stone described as?",
    options: ["Granodiorite", "Papyrus", "Iron", "Marble"],
    answer: 0,
    explanation:
      "지문 첫 문장이 로제타석을 화강섬록암(granodiorite) 비석이라고 명시합니다.",
    difficulty: 1,
  },
  {
    passageId: "rosetta-stone-1",
    prompt:
      "Which order matches the scripts from the top text to the bottom text?",
    options: [
      "Ancient Greek, Demotic, hieroglyphic",
      "Hieroglyphic, Demotic, Ancient Greek",
      "Demotic, Ancient Greek, hieroglyphic",
      "Hieroglyphic, Ancient Greek, Demotic",
    ],
    answer: 1,
    explanation:
      "위에서 아래로 고대 이집트 상형문자, 데모틱 문자, 고대 그리스어 순서입니다.",
    difficulty: 1,
  },
  {
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
    passageId: "rosetta-stone-1",
    prompt:
      "Why did the three versions make the stone especially useful for decipherment?",
    options: [
      "They used three unrelated subjects",
      "They were all written only in Greek",
      "They differed completely in every line",
      "They had only minor differences from one another",
    ],
    answer: 3,
    explanation:
      "같은 포고령의 세 판본이 서로 조금만 달라 비교할 수 있었기 때문에 해독의 열쇠가 되었습니다.",
    difficulty: 2,
  },
  {
    passageId: "rosetta-stone-2",
    prompt: "Where was the stone believed to have been displayed originally?",
    options: [
      "Within a temple, possibly at Sais",
      "In Fort Julien near Rashid",
      "In a European museum",
      "At a Roman military camp",
    ],
    answer: 0,
    explanation:
      "원래 사이스에 있었을 가능성이 있는 사원 안에 전시되었다고 지문은 추정합니다.",
    difficulty: 2,
  },
  {
    passageId: "rosetta-stone-2",
    prompt: "What later use did the stone have before its modern discovery?",
    options: [
      "It served as a museum catalog",
      "It was used as building material for Fort Julien",
      "It became a plaster cast for scholars",
      "It was placed in a temple at Sais again",
    ],
    answer: 1,
    explanation:
      "돌은 결국 나일 삼각주 라시드 근처 포트 줄리앙 건설의 건축 자재로 사용되었습니다.",
    difficulty: 2,
  },
  {
    passageId: "rosetta-stone-2",
    prompt: "Who found the stone in July 1799, and in what context?",
    options: [
      "Athenian statesman Demetrius during a library project",
      "Champollion during a Paris study",
      "French army officer Pierre-François Bouchard during the invasion of Egypt",
      "A Ptolemaic king during a temple ceremony",
    ],
    answer: 2,
    explanation:
      "1799년 7월 프랑스의 이집트 침공 중 장교 피에르 프랑수아 부샤르가 발견했습니다.",
    difficulty: 2,
  },
  {
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
    passageId: "silk-road-1",
    prompt: "Which kinds of interaction did this network help facilitate?",
    options: [
      "Only military and economic interaction",
      "Economic, cultural, political, and religious interaction",
      "Only religious interaction between East and West",
      "Only political interaction within Europe",
    ],
    answer: 1,
    explanation:
      "동서 세계 사이에 경제·문화·정치·종교적 상호작용을 촉진했다고 지문이 열거합니다.",
    difficulty: 1,
  },
  {
    passageId: "silk-road-1",
    prompt: "Why do some historians prefer the term “Silk Routes”?",
    options: [
      "The name was created in ancient China",
      "The routes carried only silk",
      "It better reflects an intricate web of land and sea routes",
      "It refers only to routes inside Europe",
    ],
    answer: 2,
    explanation:
      "일부 현대 역사가는 단일 길보다 복잡한 육상·해상망이라는 점을 반영해 “Silk Routes”를 선호합니다.",
    difficulty: 2,
  },
  {
    passageId: "silk-road-1",
    prompt:
      "What position do some scholars take about the idea of “silk roads”?",
    options: [
      "They all regard it as a single uninterrupted road",
      "They say the network had no cultural role",
      "They argue the name should refer only to sea routes",
      "They criticise or dismiss the idea and call for a new definition or term",
    ],
    answer: 3,
    explanation:
      "지문은 일부 학자들이 실크로드라는 생각을 비판하거나 배척하고 새로운 정의나 용어를 요구한다고 말합니다.",
    difficulty: 3,
  },
  {
    passageId: "silk-road-2",
    prompt: "What gave the Silk Road its name?",
    options: [
      "Highly lucrative silk textiles primarily produced in China",
      "The Han dynasty’s expansion into Central Asia",
      "The Great Wall’s protection of trade routes",
      "The Parthian Empire’s bridge to the Mediterranean",
    ],
    answer: 0,
    explanation:
      "이름은 중국에서 주로 생산된 매우 수익성 높은 비단 직물 무역에서 유래했습니다.",
    difficulty: 1,
  },
  {
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
    passageId: "silk-road-2",
    prompt: "Why did the Chinese extend the Great Wall in this account?",
    options: [
      "To connect the network to the Roman Empire’s western terminus",
      "To protect only the Parthian bridge",
      "To protect trade products and the trade route",
      "To replace the network’s sea routes",
    ],
    answer: 2,
    explanation: "중국은 교역품과 교역로를 보호하려고 만리장성을 연장했습니다.",
    difficulty: 2,
  },
  {
    passageId: "silk-road-2",
    prompt: "What role did the Parthian Empire play in the network?",
    options: [
      "It produced the silk traded from China",
      "It controlled the Great Wall’s construction",
      "It established the western terminus in Rome",
      "It provided a vital bridge connecting the network to the Mediterranean",
    ],
    answer: 3,
    explanation:
      "파르티아 제국은 교역망과 지중해를 연결하는 중요한 다리 역할을 했습니다.",
    difficulty: 2,
  },
  {
    passageId: "industrial-revolution-1",
    prompt:
      "Why is this period sometimes called the First Industrial Revolution?",
    options: [
      "To distinguish it from the subsequent Second Industrial Revolution",
      "To show it began after the Second Industrial Revolution",
      "To distinguish it from the earlier Second Agricultural Revolution",
      "To indicate that only one revolution occurred",
    ],
    answer: 0,
    explanation:
      "뒤이어 일어난 제2차 산업혁명과 구별하기 위해 제1차라고도 부릅니다.",
    difficulty: 1,
  },
  {
    passageId: "industrial-revolution-1",
    prompt: "Which geographical sequence is stated in the passage?",
    options: [
      "It began in the United States and reached Britain by 1840",
      "It began in Great Britain around 1760 and spread to continental Europe and the United States by about 1840",
      "It began in continental Europe and ended in Great Britain by 1760",
      "It began in Egypt and reached the United States by 1840",
    ],
    answer: 1,
    explanation:
      "시작점은 1760년경 영국이며 1840년경 대륙 유럽과 미국으로 퍼졌다는 순서입니다.",
    difficulty: 1,
  },
  {
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
    passageId: "industrial-revolution-1",
    prompt:
      "What comparison do economic historians make about its material importance?",
    options: [
      "Its onset mattered less than the adoption of agriculture",
      "Its onset was comparable only to the growth of steam power",
      "Its material effect was limited to Britain",
      "Its onset was comparable only to the adoption of agriculture",
    ],
    answer: 3,
    explanation:
      "경제사학자들은 물질적 발전에서 산업혁명의 시작을 농업 채택에 견줄 만하다고 평가합니다.",
    difficulty: 3,
  },
  {
    passageId: "industrial-revolution-2",
    prompt:
      "Which production shift is explicitly listed as part of the transition?",
    options: [
      "From hand production methods to machines",
      "From machines back to hand production",
      "From mechanised factories to dispersed home workshops",
      "From steam power to only animal power",
    ],
    answer: 0,
    explanation:
      "지문은 손으로 생산하던 방식에서 기계로 옮겨간 것을 전환의 한 요소로 제시합니다.",
    difficulty: 1,
  },
  {
    passageId: "industrial-revolution-2",
    prompt:
      "Which power sources does the excerpt mention as increasingly used?",
    options: [
      "Hand labor and animal power",
      "Water power and steam power",
      "Machine tools and mechanised factories",
      "Chemical manufacturing and iron production",
    ],
    answer: 1,
    explanation:
      "점점 더 많이 사용된 동력으로 수력과 증기력이 명시되어 있습니다.",
    difficulty: 1,
  },
  {
    passageId: "industrial-revolution-2",
    prompt:
      "What population effect does the passage associate with greatly increased output?",
    options: [
      "A temporary fall in population growth",
      "No population change",
      "An unprecedented rise in population and population growth",
      "Population growth only in continental Europe",
    ],
    answer: 2,
    explanation:
      "생산량의 큰 증가와 함께 인구와 인구 증가가 전례 없이 늘었다고 지문이 연결합니다.",
    difficulty: 2,
  },
  {
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
    passageId: "great-fire-1",
    prompt: "What did the main firefighting technique of the time involve?",
    options: [
      "Waiting for the east wind to drop",
      "Removing structures in the fire’s path to create firebreaks",
      "Using printed warnings to move every resident",
      "Building taller structures around the flames",
    ],
    answer: 1,
    explanation:
      "당시의 주요 소방 방식인 방화선은 불길의 경로에 있는 구조물을 제거하는 것이었습니다.",
    difficulty: 1,
  },
  {
    passageId: "great-fire-1",
    prompt: "What delayed the use of that firefighting method?",
    options: [
      "The fire had already reached the River Fleet",
      "The French and Dutch controlled the firebreaks",
      "Lord Mayor Sir Thomas Bloodworth hesitated to give the order",
      "The homeless refused to leave the City",
    ],
    answer: 2,
    explanation:
      "토머스 블러드워스 시장이 그 방법을 쓰라는 명령을 내리는 데 주저했습니다.",
    difficulty: 2,
  },
  {
    passageId: "great-fire-1",
    prompt:
      "Why had large-scale demolitions failed to stop the fire by Sunday night?",
    options: [
      "The firebreaks had been built too early",
      "The bakery fire had already gone out",
      "The City had moved north before the order",
      "The wind had fanned the fire into a firestorm that defeated the measures",
    ],
    answer: 3,
    explanation:
      "대규모 철거가 명령될 때는 바람이 불을 화재 폭풍으로 키워 그 조치가 소용없게 되었습니다.",
    difficulty: 3,
  },
  {
    passageId: "great-fire-2",
    prompt:
      "Which two factors are said to have helped win the battle against the fire?",
    options: [
      "The east wind dropped and the Tower garrison used gunpowder firebreaks",
      "Charles II ordered flight and the City gates closed",
      "Radical rebuilding plans and a new street plan",
      "The French and Dutch stopped fighting and returned",
    ],
    answer: 0,
    explanation:
      "강한 동풍이 약해지고 런던탑 수비대가 화약으로 효과적인 방화선을 만든 두 요인이었습니다.",
    difficulty: 2,
  },
  {
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
    passageId: "great-fire-2",
    prompt: "How did the eventual rebuilding compare with the proposals?",
    options: [
      "No rebuilding proposals were made",
      "Every radical proposal was adopted",
      "Some proposals were radical, but London was rebuilt essentially on the same medieval street plan",
      "The city was rebuilt on an entirely new plan outside the old walls",
    ],
    answer: 2,
    explanation:
      "급진적인 안도 제시되었지만 실제 런던은 본질적으로 기존 중세 가로망 위에 재건되었습니다.",
    difficulty: 3,
  },
  {
    passageId: "great-fire-2",
    prompt:
      "What feature does the excerpt say still exists after the reconstruction?",
    options: [
      "The original bakery in Pudding Lane",
      "The gunpowder firebreaks around the Tower",
      "The city’s exact pre-fire population",
      "Essentially the same medieval street plan",
    ],
    answer: 3,
    explanation:
      "재건 뒤에도 본질적으로 같은 중세 거리 계획이 남아 있다고 지문은 말합니다.",
    difficulty: 1,
  },
  {
    passageId: "library-alexandria-1",
    prompt:
      "What larger research institution included the Library of Alexandria?",
    options: [
      "The Mouseion",
      "The Ptolemaic royal court",
      "A separate Alexandrian temple archive",
      "A Roman research academy",
    ],
    answer: 0,
    explanation:
      "알렉산드리아 도서관은 뮤세이온이라는 더 큰 연구 기관의 일부였습니다.",
    difficulty: 1,
  },
  {
    passageId: "library-alexandria-1",
    prompt:
      "Who may have proposed the idea of a universal library, and to whom?",
    options: [
      "Callimachus to Ptolemy II",
      "Demetrius of Phalerum to Ptolemy I Soter",
      "Eratosthenes to Ptolemy II",
      "A Roman emperor to Demetrius of Phalerum",
    ],
    answer: 1,
    explanation:
      "데메트리오스가 프톨레마이오스 1세에게 보편적 도서관을 제안했을 수 있다고 지문은 말합니다.",
    difficulty: 2,
  },
  {
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
    passageId: "library-alexandria-1",
    prompt:
      "What does the passage say about the number of scrolls housed there?",
    options: [
      "It gives an exact total",
      "It says only nine scrolls were kept there",
      "It says the collection had no papyrus scrolls",
      "It says the number is unknown",
    ],
    answer: 3,
    explanation:
      "도서관에 몇 개의 두루마리가 있었는지는 알 수 없다고 지문이 명시합니다.",
    difficulty: 1,
  },
  {
    passageId: "library-alexandria-2",
    prompt:
      "Why did Alexandria come to be regarded as a capital of knowledge and learning?",
    options: [
      "In part because of the Great Library",
      "Because all scholars had left the city",
      "Because the Mouseion was a military fortress",
      "Because the Library contained only legal texts",
    ],
    answer: 0,
    explanation:
      "알렉산드리아가 지식과 학문의 중심으로 여겨진 이유 중 하나로 대도서관이 제시됩니다.",
    difficulty: 1,
  },
  {
    passageId: "library-alexandria-2",
    prompt: "What work is associated with Zenodotus of Ephesus?",
    options: [
      "Composing the Argonautica",
      "Working toward standardizing the works of Homer",
      "Calculating the circumference of the Earth",
      "Documenting the first recorded steam engine",
    ],
    answer: 1,
    explanation:
      "제노도토스는 호메로스 작품을 표준화하려고 작업한 학자로 열거됩니다.",
    difficulty: 2,
  },
  {
    passageId: "library-alexandria-2",
    prompt: "What is distinctive about Callimachus’s Pinakes in the passage?",
    options: [
      "It was a collection of royal taxes",
      "It was the first recorded steam engine",
      "It is sometimes considered the world’s first library catalog",
      "It was a system for writing Greek diacritics",
    ],
    answer: 2,
    explanation:
      "칼리마코스가 만든 피나케스는 세계 최초의 도서관 목록으로 여겨지기도 합니다.",
    difficulty: 2,
  },
  {
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
    passageId: "magna-carta-1",
    prompt:
      "What political problem was Cardinal Stephen Langton’s draft intended to address?",
    options: [
      "A dispute about the Charter of the Forest and the Lambeth treaty",
      "Peace between the unpopular king and rebel barons",
      "A conflict between the king and the church alone",
      "A disagreement about feudal payments without rebel barons",
    ],
    answer: 1,
    explanation:
      "랭턴 추기경은 인기가 낮은 왕과 반란 바론들 사이의 평화를 만들기 위해 초안을 작성했습니다.",
    difficulty: 2,
  },
  {
    passageId: "magna-carta-1",
    prompt: "Which combination of protections is promised in the charter?",
    options: [
      "Protection of trade routes, freedom from taxation, and military service",
      "A council of scholars, a bilingual decree, and lower book prices",
      "Church rights, protection from illegal imprisonment, and swift impartial justice",
      "A royal monopoly, military service, and delayed justice",
    ],
    answer: 2,
    explanation:
      "헌장은 교회 권리, 불법 구금으로부터의 보호, 신속하고 공정한 사법 접근 등을 약속했습니다.",
    difficulty: 2,
  },
  {
    passageId: "magna-carta-1",
    prompt: "What followed when neither side kept its commitments?",
    options: [
      "The charter became statute law immediately",
      "The rebel barons withdrew their demands",
      "Pope Innocent III confirmed it and peace followed",
      "Pope Innocent III annulled it, leading to the First Barons’ War",
    ],
    answer: 3,
    explanation:
      "양측이 약속을 지키지 않자 교황 인노첸시오 3세가 헌장을 무효화했고 제1차 바론 전쟁으로 이어졌습니다.",
    difficulty: 3,
  },
  {
    passageId: "magna-carta-2",
    prompt:
      "How did Henry III’s regency government alter the charter when it reissued it in 1216?",
    options: [
      "It stripped out some of its more radical content",
      "It added more radical content",
      "It changed the charter into the Charter of the Forest",
      "It left the content completely unchanged",
    ],
    answer: 0,
    explanation:
      "헨리 3세의 섭정 정부는 정치적 지지를 얻으려 급진적인 내용 일부를 덜어냈습니다.",
    difficulty: 2,
  },
  {
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
    passageId: "magna-carta-2",
    prompt: "What did Henry receive when he reissued the charter in 1225?",
    options: [
      "Protection from illegal imprisonment",
      "A place in the Charter of the Forest",
      "A grant of new taxes",
      "A new council of 25 scholars",
    ],
    answer: 2,
    explanation:
      "자금이 부족했던 헨리는 새 세금의 승인을 받는 대가로 1225년에 재발행했습니다.",
    difficulty: 2,
  },
  {
    passageId: "magna-carta-2",
    prompt: "What legal status did Edward I confirm for the charter in 1297?",
    options: [
      "A private royal letter",
      "A peace treaty with the French",
      "A religious text for the Mouseion",
      "Part of England’s statute law",
    ],
    answer: 3,
    explanation:
      "에드워드 1세는 1297년 이를 잉글랜드 성문법의 일부로 확인했습니다.",
    difficulty: 1,
  },
  {
    passageId: "enigma-machine-1",
    prompt: "What alphabet did the Enigma’s rotor mechanism scramble?",
    options: [
      "The 26 letters of the Latin alphabet",
      "The three scripts of the Egyptian decree",
      "The symbols used for lunar months",
      "A set of only ten military signals",
    ],
    answer: 0,
    explanation: "에니그마의 회전자 장치는 라틴 알파벳 26자를 뒤섞었습니다.",
    difficulty: 1,
  },
  {
    passageId: "enigma-machine-1",
    prompt: "In typical use, what did the second person do?",
    options: [
      "Changed the rotor settings every year",
      "Wrote down which light illuminated at each key press",
      "Read the plaintext aloud before typing",
      "Copied each illuminated letter onto a new rotor",
    ],
    answer: 1,
    explanation:
      "두 번째 사람은 키를 누를 때마다 26개 램프 중 켜진 글자를 적었습니다.",
    difficulty: 1,
  },
  {
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
    passageId: "enigma-machine-1",
    prompt: "Why did rotor motion make conventional pattern attacks difficult?",
    options: [
      "It removed the need for a secret setting",
      "It used only one fixed substitution for every message",
      "It sent plaintext without any keyboard input",
      "It changed the electrical connections with each keypress, so each letter had a different key",
    ],
    answer: 3,
    explanation:
      "각 키 입력마다 전기 연결이 바뀌어 글자마다 다른 암호 키가 생기므로 패턴 공격에 강했습니다.",
    difficulty: 3,
  },
  {
    passageId: "enigma-machine-2",
    prompt: "What did a receiving station need in order to decrypt a message?",
    options: [
      "The exact settings used by the transmitting station",
      "Only the number of letters in the message",
      "A copy of an unrelated key list",
      "The same settings used during the previous month",
    ],
    answer: 0,
    explanation:
      "수신국은 해독을 위해 송신국이 사용한 정확한 설정을 알고 사용해야 했습니다.",
    difficulty: 1,
  },
  {
    passageId: "enigma-machine-2",
    prompt: "How often were the initial settings generally changed?",
    options: [
      "Every few years",
      "Daily",
      "Only after an intercepted message",
      "Only when the rotor was repaired",
    ],
    answer: 1,
    explanation: "초기 설정은 보통 비밀 키 목록에 따라 매일 변경되었습니다.",
    difficulty: 1,
  },
  {
    passageId: "enigma-machine-2",
    prompt:
      "Why could the large number of messages create an attack opportunity?",
    options: [
      "It made the alphabet longer than 26 letters",
      "It forced operators to abandon rotor settings",
      "Enough intercepted messages could be available for analysis",
      "It prevented the receiving station from using a key list",
    ],
    answer: 2,
    explanation:
      "매일 메시지가 많으면 충분한 암호문을 가로채 분석할 수 있어 공격 가능성이 생겼습니다.",
    difficulty: 3,
  },
  {
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
    passageId: "apollo-11-1",
    prompt: "What goal did Kennedy set in May 1961?",
    options: [
      "To orbit the Moon without attempting a landing before the decade ended",
      "To land a person on the Moon and return them safely before the decade ended",
      "To send an uncrewed lunar probe before the decade ended",
      "To establish a permanent lunar station before the decade ended",
    ],
    answer: 1,
    explanation:
      "케네디는 10년이 끝나기 전에 달에 사람을 보내 안전하게 돌아오게 하라는 목표를 제시했습니다.",
    difficulty: 2,
  },
  {
    passageId: "apollo-11-1",
    prompt: "Which pair is presented as part of the program’s development?",
    options: [
      "The Apollo 1 launchpad fire and technologies from later Apollo missions",
      "The Apollo 1 launchpad fire and technologies from Mercury only",
      "The Apollo 1 setback and technologies from Mercury and Gemini",
      "The Mercury program’s cancellation and technologies from Apollo 2",
    ],
    answer: 2,
    explanation:
      "아폴로 1호 발사대 화재라는 큰 좌절을 겪었고 머큐리·제미니 기술을 활용했습니다.",
    difficulty: 2,
  },
  {
    passageId: "apollo-11-1",
    prompt:
      "What happened to Luna 15 while Armstrong and Aldrin were on the lunar surface?",
    options: [
      "It matched the Saturn V rocket in flight",
      "It returned the Apollo crew to Earth",
      "It became a crewed Soviet mission",
      "It crashed on the Moon",
    ],
    answer: 3,
    explanation:
      "소련의 무인 달 탐사선 루나 15호는 두 우주비행사가 달 표면에 있는 동안 달에 추락했습니다.",
    difficulty: 2,
  },
  {
    passageId: "apollo-11-2",
    prompt:
      "How large was the estimated live audience for Armstrong’s moonwalk?",
    options: [
      "About 600 million people, roughly one-fifth of the world’s population",
      "About 600 people, all at Kennedy Space Center",
      "About one-fifth of the Apollo crew",
      "About three million people, mainly in Europe",
    ],
    answer: 0,
    explanation:
      "문워크 생중계는 약 6억 명, 당시 세계 인구의 약 5분의 1이 시청한 것으로 추정됩니다.",
    difficulty: 1,
  },
  {
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
    passageId: "apollo-11-2",
    prompt:
      "What scientific result is attributed to the returned lunar samples?",
    options: [
      "They identified the first lunar mineral",
      "They proved the lunar samples were synthetic",
      "They led to identification of three previously unrecognized minerals",
      "They identified three previously known minerals",
    ],
    answer: 2,
    explanation:
      "귀환한 달 표본은 이전에 알려지지 않았던 광물 세 가지를 식별하게 했습니다.",
    difficulty: 2,
  },
  {
    passageId: "apollo-11-2",
    prompt: "Which location pairing is supported by the passage?",
    options: [
      "Columbia’s command module remains on the lunar surface",
      "Eagle’s descent stage is preserved at the National Air and Space Museum",
      "Both Columbia and Eagle remain preserved in lunar orbit",
      "Columbia’s command module is preserved at the National Air and Space Museum",
    ],
    answer: 3,
    explanation:
      "지문은 컬럼비아 사령선이 워싱턴 D.C. 국립항공우주박물관에 보존됐다고 말합니다.",
    difficulty: 2,
  },
  {
    passageId: "calendar-1",
    prompt: "What is a calendar primarily a system for organizing?",
    options: [
      "Days by giving names to periods such as weeks, months, and years",
      "Months by assigning each one a date but no year",
      "Events by arranging them only by time of day",
      "Years by synchronizing them necessarily with the moon",
    ],
    answer: 0,
    explanation:
      "달력은 날을 정리하고 일·주·월·년 같은 기간에 이름을 붙이는 체계입니다.",
    difficulty: 1,
  },
  {
    passageId: "calendar-1",
    prompt: "How does the passage define a date?",
    options: [
      "A chronological list of documents",
      "The designation of a single and specific day",
      "A physical record made only on paper",
      "A period made from an intercalary month",
    ],
    answer: 1,
    explanation:
      "날짜는 그런 체계 안에서 하나의 특정한 날을 지정하는 것입니다.",
    difficulty: 1,
  },
  {
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
    passageId: "calendar-1",
    prompt: "Which example fits the passage’s use of “calendar” as a list?",
    options: [
      "A calendar of lunar cycles",
      "A list of months and years",
      "A chronological list of kings",
      "A court calendar or a calendar of wills",
    ],
    answer: 3,
    explanation:
      "지문은 계획된 행사의 예로 법정 일정, 문서 목록의 예로 유언장 목록을 듭니다.",
    difficulty: 1,
  },
  {
    passageId: "calendar-2",
    prompt: "Which natural cycles may calendars commonly be synchronized with?",
    options: [
      "The cycles of the sun or the moon",
      "The cycles of printing and literacy",
      "The cycles of wars and treaties",
      "The cycles of population and output",
    ],
    answer: 0,
    explanation:
      "달력의 기간은 보통 태양이나 달의 주기와 동기화되지만 반드시 그런 것은 아닙니다.",
    difficulty: 1,
  },
  {
    passageId: "calendar-2",
    prompt:
      "What type of calendar does the passage call the most common pre-modern type?",
    options: [
      "A calendar based only on the sun",
      "A lunisolar calendar",
      "A calendar with no named periods",
      "A calendar based only on court documents",
    ],
    answer: 1,
    explanation:
      "근대 이전에 가장 흔한 유형으로 태음태양력(lunisolar calendar)이 제시됩니다.",
    difficulty: 1,
  },
  {
    passageId: "calendar-2",
    prompt: "Why might a lunisolar calendar add an intercalary month?",
    options: [
      "To replace the solar year with a shorter cycle",
      "To make every calendar a list of wills",
      "To remain synchronized with the solar year over the long term",
      "To keep all calendars independent of the moon",
    ],
    answer: 2,
    explanation:
      "태음태양력은 장기간 태양년과 맞추기 위해 때때로 윤달을 추가합니다.",
    difficulty: 2,
  },
  {
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
];

export const dadHistoryQuestions = questionSpecs.map((spec, index) =>
  buildQuestion(spec, index + 1),
);
