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
    id: `dad-history-v2-${String(number).padStart(3, "0")}`,
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
];

export const dadHistoryQuestions = questionSpecs.map((spec, index) =>
  buildQuestion(spec, index + 1),
);
