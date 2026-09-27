import sources from "./assets/wikipedia/ai-sources.json" with { type: "json" };

const articleById = new Map(
  sources.articles.map((article) => [article.id, article]),
);
const passageById = new Map(
  sources.passages.map((passage) => [passage.id, passage]),
);

const questionSpecs = [
  {
    id: "dad-ai-v2-001",
    topic: "ai",
    passageId: "ai-definition",
    prompt:
      "What capability is at the center of the passage’s definition of artificial intelligence?",
    options: [
      "Computational systems performing tasks associated with human intelligence.",
      "A catalog of applications limited to search engines and chatbots.",
      "A research field concerned only with mathematical optimization and formal logic.",
      "A system’s ability to perform one preprogrammed physical routine.",
    ],
    answer: 0,
    explanation:
      "지문은 AI를 학습·추론·문제 해결처럼 인간 지능과 관련된 일을 수행하는 계산 시스템의 능력으로 정의합니다.",
    difficulty: 1,
  },
  {
    id: "dad-ai-v2-002",
    topic: "ai",
    passageId: "ai-history",
    prompt:
      "When does the passage say artificial intelligence was founded as an academic discipline?",
    options: [
      "1956.",
      "1950, when Turing introduced the imitation game.",
      "1984, when the term AI winter first appeared.",
      "2017, when transformer-based growth accelerated.",
    ],
    answer: 0,
    explanation:
      "지문은 AI가 학문 분야로 설립된 시점을 1956년이라고 명시합니다.",
    difficulty: 1,
  },
  {
    id: "dad-ai-v2-003",
    topic: "ai",
    passageId: "ml-foundations",
    prompt:
      "What makes the algorithms described as machine learning in this passage distinctive?",
    options: [
      "They learn from data and generalize to unseen data without being explicitly programmed for each task.",
      "They learn only from seen data and require explicit programming for every unseen case.",
      "They infer rules from data but cannot generalize beyond the training examples.",
      "They are statistical algorithms explicitly programmed for each individual task.",
    ],
    answer: 0,
    explanation:
      "머신러닝 알고리즘은 데이터에서 배우고 보지 못한 데이터로 일반화하며 명시적으로 일일이 프로그래밍되지 않는다는 점이 핵심입니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-004",
    topic: "ai",
    passageId: "ml-deep",
    prompt:
      "What change allowed neural networks to surpass many previous machine-learning approaches?",
    options: [
      "Advances in deep learning.",
      "The expansion of data mining without changes to neural networks.",
      "The return of expert systems developed in the 1980s.",
      "The increasingly interchangeable use of the terms AI and ML.",
    ],
    answer: 0,
    explanation:
      "딥러닝 분야의 발전이 신경망을 많은 기존 접근법보다 높은 성능으로 이끌었다고 지문이 말합니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-005",
    topic: "ai",
    passageId: "dl-basics",
    prompt: "What does the adjective “deep” refer to in deep learning?",
    options: [
      "The use of multiple layers in a neural network.",
      "The number of training examples rather than the network structure.",
      "A neural network’s ability to reproduce an organism’s brain function.",
      "Using one input layer with no additional layers.",
    ],
    answer: 0,
    explanation:
      "딥(deep)은 네트워크에서 여러 층을 사용하는 것을 가리킨다고 지문이 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-ai-v2-006",
    topic: "ai",
    passageId: "dl-uses",
    prompt: "Which item is named as a deep-learning network architecture?",
    options: [
      "Convolutional neural networks.",
      "Statistical optimisation methods.",
      "Representation learning as a task rather than an architecture.",
      "Medical image analysis as an application area.",
    ],
    answer: 0,
    explanation:
      "지문이 열거한 네트워크 구조 중 convolutional neural networks가 포함됩니다.",
    difficulty: 1,
  },
  {
    id: "dad-ai-v2-007",
    topic: "ai",
    passageId: "alphago-evolution",
    prompt: "Who developed AlphaGo according to the passage?",
    options: [
      "London-based DeepMind Technologies.",
      "Google’s search-engine division independently of DeepMind Technologies.",
      "The research group that later created MuZero, rather than DeepMind Technologies.",
      "The Korea Baduk Association’s professional division.",
    ],
    answer: 0,
    explanation:
      "AlphaGo는 런던 기반 DeepMind Technologies가 개발했다고 지문에 나옵니다.",
    difficulty: 1,
  },
  {
    id: "dad-ai-v2-008",
    topic: "ai",
    passageId: "alphago-matches",
    prompt: "What milestone did the original AlphaGo reach in October 2015?",
    options: [
      "It beat a human professional with a handicap on a full-sized board.",
      "It became the first computer to beat a 9-dan professional in March 2016.",
      "It beat a human professional Go player without handicap on a full-sized board.",
      "It beat the world’s top-ranked player at the 2017 Future of Go Summit.",
    ],
    answer: 2,
    explanation:
      "2015년 10월 원래 AlphaGo는 19×19판에서 핸디캡 없이 인간 프로를 이긴 첫 컴퓨터 Go 프로그램이 됐습니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-009",
    topic: "ai",
    passageId: "eliza-design",
    prompt: "When and where was ELIZA developed, and by whom?",
    options: [
      "From 1964 to 1967 at MIT by Joseph Weizenbaum.",
      "From 1964 to 1967 at the University of Manchester by Joseph Weizenbaum.",
      "From 1964 to 1967 at MIT by Alan Turing.",
      "From 1967 to 1970 at MIT by Joseph Weizenbaum.",
    ],
    answer: 0,
    explanation:
      "지문 첫 문장은 1964~1967년 MIT에서 Joseph Weizenbaum이 개발했다고 명시합니다.",
    difficulty: 1,
  },
  {
    id: "dad-ai-v2-010",
    topic: "ai",
    passageId: "eliza-reception",
    prompt: "What was Weizenbaum’s original intention for ELIZA?",
    options: [
      "To explore communication between humans and machines.",
      "To demonstrate genuine machine understanding to users.",
      "To treat psychological issues directly rather than study communication.",
      "To compare human and machine conversation for a formal test only.",
    ],
    answer: 0,
    explanation:
      "Weizenbaum은 인간과 기계 사이의 소통을 탐구하려고 ELIZA를 만들었습니다.",
    difficulty: 1,
  },
  {
    id: "dad-ai-v2-011",
    topic: "ai",
    passageId: "turing-mechanics",
    prompt:
      "In the modern version of the Turing test, what does a human evaluator judge?",
    options: [
      "A text transcript of a natural-language conversation between a human and a machine.",
      "A text transcript of a natural-language conversation between two machines.",
      "Whether the machine’s responses are factually correct in a written examination.",
      "A nonverbal robotic performance without an interactive transcript.",
    ],
    answer: 0,
    explanation:
      "현대판에서는 평가자가 인간과 기계의 자연어 대화 텍스트 기록을 판단합니다.",
    difficulty: 1,
  },
  {
    id: "dad-ai-v2-012",
    topic: "ai",
    passageId: "turing-origins",
    prompt: "When and under what title did Turing introduce the test?",
    options: [
      "In 1950 as the imitation game in “Computing Machinery and Intelligence.”",
      "In 1950 as “Can machines think?” in a paper about AI winters.",
      "In 1964 as the imitation game at MIT.",
      "In 1950 as a neural-network benchmark at the University of Manchester.",
    ],
    answer: 0,
    explanation:
      "Turing은 1950년 논문에서 imitation game으로 시험을 소개했습니다.",
    difficulty: 1,
  },
  {
    id: "dad-ai-v2-013",
    topic: "ai",
    passageId: "winter-definition",
    prompt: "What is an AI winter?",
    options: [
      "A period of reduced funding and interest in AI research.",
      "A period of reduced funding but increased interest in AI research.",
      "A period of disappointment followed immediately by renewed funding.",
      "A period when only academic AI research continues while industry withdraws.",
    ],
    answer: 0,
    explanation: "AI winter는 AI 연구의 자금과 관심이 줄어드는 기간입니다.",
    difficulty: 1,
  },
  {
    id: "dad-ai-v2-014",
    topic: "ai",
    passageId: "winter-cycles",
    prompt: "Which two periods are identified as the major AI winters?",
    options: [
      "1974–1980 and 1987–2000.",
      "1974–1980 and 1988–2000.",
      "1971–1975 and 1987–2000.",
      "1987–2000 and the renewed-interest period beginning in 2012.",
    ],
    answer: 0,
    explanation: "주요 두 겨울은 약 1974~1980년과 1987~2000년으로 제시됩니다.",
    difficulty: 1,
  },
  {
    id: "dad-ai-v2-015",
    topic: "ai",
    passageId: "expert-overview",
    prompt: "What is an expert system designed to emulate?",
    options: [
      "The decision-making ability of a human expert.",
      "The decision-making ability of a machine-learning model.",
      "The fact-and-rule storage function of a knowledge base only.",
      "The linguistic behavior of a human expert without decision-making.",
    ],
    answer: 0,
    explanation:
      "전문가 시스템은 인간 전문가의 의사결정 능력을 모방하는 컴퓨터 시스템입니다.",
    difficulty: 1,
  },
  {
    id: "dad-ai-v2-016",
    topic: "ai",
    passageId: "expert-subsystems",
    prompt: "What are the two subsystems of an expert system?",
    options: [
      "A knowledge base and an inference engine.",
      "A knowledge base and a neural network.",
      "An inference engine and a transcript evaluator.",
      "A rule base and a conventional procedural program.",
    ],
    answer: 0,
    explanation:
      "지문은 지식 기반과 추론 엔진이라는 두 하위 시스템으로 나눕니다.",
    difficulty: 1,
  },
  {
    id: "dad-ai-v2-017",
    topic: "ai",
    passageId: "llm-overview",
    prompt: "What is a large language model trained on?",
    options: [
      "A vast amount of text for natural language processing tasks.",
      "A vast amount of text primarily for image-classification tasks.",
      "A curated set of if–then rules for natural-language generation.",
      "A vast amount of text only after the model has been fine-tuned.",
    ],
    answer: 0,
    explanation:
      "LLM은 자연어 처리, 특히 언어 생성을 위해 방대한 텍스트로 훈련됩니다.",
    difficulty: 1,
  },
  {
    id: "dad-ai-v2-018",
    topic: "ai",
    passageId: "llm-limitations",
    prompt: "What can biased or inaccurate training data do to an LLM?",
    options: [
      "Guarantee reliable output when the training data are biased.",
      "Make its output less reliable.",
      "Make benchmark evaluations unnecessary.",
      "Reduce reliability only when the model generates images.",
    ],
    answer: 1,
    explanation:
      "편향되거나 부정확한 학습 데이터는 출력의 신뢰성을 낮출 수 있습니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-019",
    topic: "ai",
    passageId: "vision-overview",
    prompt: "What do computer vision tasks include?",
    options: [
      "Acquiring, processing, analyzing, and understanding digital images.",
      "Acquiring and processing digital images, but not analyzing or understanding them.",
      "Analyzing high-dimensional data only after converting it into text.",
      "Understanding visual images without acquiring or processing them.",
    ],
    answer: 0,
    explanation:
      "컴퓨터 비전의 작업에는 디지털 이미지의 획득·처리·분석·이해가 포함됩니다.",
    difficulty: 1,
  },
  {
    id: "dad-ai-v2-020",
    topic: "ai",
    passageId: "vision-disciplines",
    prompt:
      "How does the passage distinguish the scientific discipline of computer vision?",
    options: [
      "It concerns the theory behind artificial systems that extract information from images.",
      "It concerns the theory behind natural-language systems that extract information from text.",
      "It concerns construction of camera hardware rather than theory.",
      "It concerns artificial systems that generate images rather than extract information from them.",
    ],
    answer: 0,
    explanation:
      "과학 분야로서 컴퓨터 비전은 이미지에서 정보를 추출하는 인공 시스템의 이론을 다룹니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-021",
    topic: "ai",
    passageId: "ai-v2-p001",
    prompt:
      "What problem did early AI algorithms encounter when reasoning problems became large?",
    options: [
      "They became exponentially slower as the problems grew.",
      "They could use only economic concepts and no probability.",
      "They replaced intuitive human judgments with physical sensors.",
      "They were designed to avoid every intermediate step.",
    ],
    answer: 0,
    explanation:
      "초기 알고리즘은 문제가 커질 때 조합 폭발로 인해 기하급수적으로 느려질 수 있었습니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-022",
    topic: "ai",
    passageId: "ai-v2-p002",
    prompt:
      "Which learning arrangement uses labelled expected answers and includes classification and regression?",
    options: [
      "Unsupervised learning.",
      "Supervised learning.",
      "Reinforcement learning.",
      "Transfer learning.",
    ],
    answer: 0,
    explanation:
      "지문은 기대 답을 붙인 학습 데이터를 사용하는 지도학습을 분류와 회귀의 두 주요 형태로 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-ai-v2-023",
    topic: "ai",
    passageId: "ai-v2-p003",
    prompt:
      "Which set contains problems that the passage explicitly lists for natural language processing?",
    options: [
      "Speech recognition, machine translation, and question answering.",
      "Object tracking, facial recognition, and robotic perception.",
      "State-space search, gradient descent, and swarm intelligence.",
      "Drug design, climate science, and material inspection.",
    ],
    answer: 1,
    explanation:
      "자연어 처리의 구체적 문제로 음성 인식·기계 번역·질문 응답 등이 열거됩니다.",
    difficulty: 1,
  },
  {
    id: "dad-ai-v2-024",
    topic: "ai",
    passageId: "ai-v2-p004",
    prompt: "What is machine perception described as doing?",
    options: [
      "Generating speech from text without using sensors.",
      "Training only on labelled images.",
      "Using sensor input to deduce aspects of the world.",
      "Searching a tree of game moves for a winning position.",
    ],
    answer: 1,
    explanation:
      "기계 지각은 센서 입력을 사용해 세계의 측면을 추론하는 능력입니다.",
    difficulty: 1,
  },
  {
    id: "dad-ai-v2-025",
    topic: "ai",
    passageId: "ai-v2-p005",
    prompt: "What does adversarial search examine in game-playing programs?",
    options: [
      "Only previously labelled training examples.",
      "A tree of possible moves and countermoves.",
      "A vocabulary of words and their embeddings.",
      "A stream of data without any guidance.",
    ],
    answer: 1,
    explanation:
      "적대적 탐색은 체스나 바둑 같은 게임에서 가능한 수와 대응 수의 트리를 탐색합니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-026",
    topic: "ai",
    passageId: "ai-v2-p006",
    prompt: "How does gradient descent operate in the passage?",
    options: [
      "It chooses the fittest candidate without changing parameters.",
      "It labels data with expected answers before classification.",
      "It incrementally adjusts numerical parameters to minimise a loss function.",
      "It translates Russian sentences with a fixed vocabulary.",
    ],
    answer: 1,
    explanation:
      "경사 하강법은 수치 매개변수를 조금씩 조정해 손실 함수를 최소화하는 지역 탐색입니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-027",
    topic: "ai",
    passageId: "ai-v2-p007",
    prompt:
      "What principal goal distinguishes machine learning from statistics in the passage?",
    options: [
      "Statistics finds generalisable predictive patterns, while machine learning draws population inferences.",
      "Statistics draws population inferences from a sample, while machine learning finds generalisable predictive patterns.",
      "Both fields require a pre-structured model chosen before seeing data.",
      "Neither field uses methods related to the other.",
    ],
    answer: 1,
    explanation:
      "지문은 통계가 표본에서 모집단 추론을 하고 머신러닝이 일반화 가능한 예측 패턴을 찾는다고 대비합니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-028",
    topic: "ai",
    passageId: "ai-v2-p008",
    prompt:
      "What feedback does a reinforcement-learning program try to maximise?",
    options: [
      "The number of labels supplied by a teacher.",
      "Rewards received while it navigates a dynamic environment.",
      "The number of variables removed by dimensionality reduction.",
      "The vocabulary size of an input dataset.",
    ],
    answer: 1,
    explanation:
      "강화학습 프로그램은 동적 환경에서 받는 보상을 최대화하려고 하며 그 피드백으로 경험에서 학습합니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-029",
    topic: "ai",
    passageId: "ai-v2-p009",
    prompt:
      "Which set is named as central applications of unsupervised machine learning?",
    options: [
      "Classification, regression, and transfer learning.",
      "Clustering, dimensionality reduction, and density estimation.",
      "Speech synthesis, machine translation, and question answering.",
      "Forward chaining, backward chaining, and truth maintenance.",
    ],
    answer: 1,
    explanation:
      "비지도 머신러닝의 중심 응용으로 군집화·차원 축소·밀도 추정이 제시됩니다.",
    difficulty: 1,
  },
  {
    id: "dad-ai-v2-030",
    topic: "ai",
    passageId: "ai-v2-p010",
    prompt:
      "What does principal component analysis (PCA) do in the described example?",
    options: [
      "It turns lower-dimensional data into a larger feature set.",
      "It changes higher-dimensional data such as 3D into a smaller space such as 2D.",
      "It assigns labels to every training example.",
      "It computes cumulative reward in a Markov decision process.",
    ],
    answer: 1,
    explanation:
      "PCA의 예시는 3D 같은 고차원 데이터를 2D 같은 더 작은 공간으로 바꾸는 것입니다.",
    difficulty: 1,
  },
  {
    id: "dad-ai-v2-031",
    topic: "ai",
    passageId: "ai-v2-p011",
    prompt: "How does semi-supervised learning combine training examples?",
    options: [
      "It uses only completely labelled data.",
      "It uses no data labels and cannot use any labelled examples.",
      "It uses unlabelled data together with a small amount of labelled data.",
      "It replaces labels with a fixed Markov model.",
    ],
    answer: 1,
    explanation:
      "반지도 학습은 라벨이 없는 데이터와 소량의 라벨이 있는 데이터를 함께 사용합니다.",
    difficulty: 1,
  },
  {
    id: "dad-ai-v2-032",
    topic: "ai",
    passageId: "ai-v2-p012",
    prompt:
      "Which model typically represents the environment in reinforcement learning?",
    options: [
      "A byte-pair encoding model.",
      "A convolutional neural network only.",
      "A Markov decision process.",
      "A decision tree with no states.",
    ],
    answer: 1,
    explanation:
      "지문은 강화학습에서 환경을 보통 마르코프 결정 과정으로 나타낸다고 합니다.",
    difficulty: 1,
  },
  {
    id: "dad-ai-v2-033",
    topic: "ai",
    passageId: "ai-v2-p013",
    prompt: "What does the classic universal approximation theorem concern?",
    options: [
      "The ability of a finite single-hidden-layer feedforward network to approximate continuous functions.",
      "The number of human players defeated by a Go program.",
      "The cost of training a language model on web data.",
      "The use of medical scanners to collect image data.",
    ],
    answer: 1,
    explanation:
      "고전 보편 근사 정리는 유한 크기의 단일 은닉층 순방향 신경망이 연속 함수를 근사할 수 있는 능력을 다룹니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-034",
    topic: "ai",
    passageId: "ai-v2-p014",
    prompt:
      "What condition does the cited result give for a ReLU deep network to approximate any Lebesgue integrable function?",
    options: [
      "Its width must be equal to zero.",
      "Its width must be strictly larger than the input dimension.",
      "Its depth must be fixed at one layer.",
      "Its activation must be a word-embedding lookup.",
    ],
    answer: 1,
    explanation:
      "지문은 ReLU 심층망의 너비가 입력 차원보다 엄격히 클 때 해당 함수를 근사할 수 있다고 설명합니다.",
    difficulty: 3,
  },
  {
    id: "dad-ai-v2-035",
    topic: "ai",
    passageId: "ai-v2-p015",
    prompt:
      "Why can the TIMIT data set support trying many configurations in the speech-recognition example?",
    options: [
      "It contains every possible English sentence.",
      "Its small size lets many configurations be tried.",
      "It uses only unlabeled video frames.",
      "It measures winning percentages in board games.",
    ],
    answer: 1,
    explanation:
      "TIMIT의 작은 크기 덕분에 여러 구성을 시험할 수 있다고 지문이 말합니다.",
    difficulty: 1,
  },
  {
    id: "dad-ai-v2-036",
    topic: "ai",
    passageId: "ai-v2-p016",
    prompt: "How many training examples does the passage give for MNIST?",
    options: ["10,000.", "19×19.", "60,000.", "630."],
    answer: 1,
    explanation:
      "MNIST에는 60,000개의 훈련 예제가 있다고 지문에 명시되어 있습니다.",
    difficulty: 1,
  },
  {
    id: "dad-ai-v2-037",
    topic: "ai",
    passageId: "ai-v2-p017",
    prompt:
      "Which issue is listed as a reason candidate drugs fail regulatory approval?",
    options: [
      "Only the lack of image sensors.",
      "Only a shortage of human Go players.",
      "Insufficient efficacy, undesired interactions, or unanticipated toxic effects.",
      "A requirement that every molecule be a language token.",
    ],
    answer: 1,
    explanation:
      "후보 약물의 실패 원인으로 효능 부족·원치 않는 상호작용·예상하지 못한 독성 효과가 열거됩니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-038",
    topic: "ai",
    passageId: "ai-v2-p018",
    prompt:
      "What does multi-view deep learning learn in the recommendation example?",
    options: [
      "The syntax of a natural-language transcript.",
      "User preferences from multiple domains.",
      "A Markov decision process for autonomous vehicles.",
      "A tree of adversarial game moves.",
    ],
    answer: 1,
    explanation:
      "다중 관점 딥러닝은 여러 도메인에서 사용자 선호를 학습하는 데 적용되었습니다.",
    difficulty: 1,
  },
  {
    id: "dad-ai-v2-039",
    topic: "ai",
    passageId: "ai-v2-p019",
    prompt:
      "Who did the distributed version of AlphaGo defeat in October 2015?",
    options: [
      "Ke Jie.",
      "Fan Hui.",
      "Lee Sedol.",
      "A team of five Chinese players.",
    ],
    answer: 1,
    explanation:
      "2015년 10월 분산 버전 AlphaGo는 유럽 바둑 챔피언 판후이를 이겼습니다.",
    difficulty: 1,
  },
  {
    id: "dad-ai-v2-040",
    topic: "ai",
    passageId: "ai-v2-p020",
    prompt:
      "What happened to AlphaGo Master in all three games against Ke Jie?",
    options: [
      "It lost all three games.",
      "It won all three games.",
      "It played only one game.",
      "It used a handicap in every game.",
    ],
    answer: 1,
    explanation:
      "지문은 AlphaGo Master가 커제와의 세 경기에서 모두 이겼다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-ai-v2-041",
    topic: "ai",
    passageId: "ai-v2-p021",
    prompt:
      "Which games did the AlphaZero algorithm achieve superhuman play in within 24 hours?",
    options: [
      "Go and poker only.",
      "Chess, shogi, and Go.",
      "Chess and machine translation.",
      "Go and speech recognition.",
    ],
    answer: 1,
    explanation:
      "지문은 AlphaZero가 체스·쇼기·바둑에서 24시간 안에 초인적 수준에 도달했다고 말합니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-042",
    topic: "ai",
    passageId: "ai-v2-p022",
    prompt: "What did the AlphaGo teaching tool analyse?",
    options: [
      "The accuracy of medical image segmentation.",
      "The vocabulary of a language model.",
      "Winning rates of different Go openings.",
      "The cost of autonomous vehicles.",
    ],
    answer: 2,
    explanation:
      "AlphaGo 교육 도구는 AlphaGo Master가 계산한 여러 바둑 포문의 승률을 분석했습니다.",
    difficulty: 1,
  },
  {
    id: "dad-ai-v2-043",
    topic: "ai",
    passageId: "ai-v2-p023",
    prompt:
      "What did Google say about its tensor processing units in May 2016?",
    options: [
      "They had replaced all Go programs.",
      "They were used only for public web search.",
      "They had already been deployed in multiple internal Google projects.",
      "They were designed to measure human players’ territorial gains.",
    ],
    answer: 2,
    explanation:
      "구글은 TPU가 이미 AlphaGo 대국을 포함한 여러 내부 프로젝트에 배치되었다고 밝혔습니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-044",
    topic: "ai",
    passageId: "ai-v2-p024",
    prompt: "How does the passage characterise AlphaGo’s playing preference?",
    options: [
      "It always seeks the largest territorial gain.",
      "It imitates moves that humans frequently make.",
      "It favours a greater probability of winning by fewer points.",
      "It avoids using opening moves.",
    ],
    answer: 2,
    explanation:
      "AlphaGo는 더 적은 점수 차라도 이길 확률이 큰 선택을 강하게 선호한다고 설명됩니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-045",
    topic: "ai",
    passageId: "ai-v2-p025",
    prompt:
      "What kind of interaction did ELIZA running the DOCTOR script create?",
    options: [
      "A game in which users selected Go moves.",
      "A factual examination of medical diagnoses.",
      "A conversation somewhat like an initial non-directive psychotherapy interview.",
      "A translation session based on a 250-word vocabulary.",
    ],
    answer: 2,
    explanation:
      "DOCTOR를 실행한 ELIZA는 비지시적 심리치료사의 초기 면담과 어느 정도 비슷한 대화 상호작용을 만들었습니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-046",
    topic: "ai",
    passageId: "ai-v2-p026",
    prompt: "What did the script that ELIZA ran determine?",
    options: [
      "The hardware used to run the program.",
      "The number of human users in a conversation.",
      "Keywords, their values, and the transformation rules for output.",
      "The results of a Turing test performed by a jury.",
    ],
    answer: 2,
    explanation:
      "ELIZA의 스크립트는 키워드와 그 값, 출력 변환 규칙을 정했습니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-047",
    topic: "ai",
    passageId: "ai-v2-p027",
    prompt: "What limitation of ELIZA’s learning is stated?",
    options: [
      "It could learn new words through interaction alone.",
      "It learned only from human Go games.",
      "It could not learn new speech patterns or words through interaction alone.",
      "It changed its active script after every user sentence.",
    ],
    answer: 2,
    explanation:
      "ELIZA는 상호작용만으로 새로운 말투나 단어를 학습할 수 없고, 작동 방식을 바꾸려면 스크립트를 직접 편집해야 했습니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-048",
    topic: "ai",
    passageId: "ai-v2-p028",
    prompt:
      "Which item was one of the five technical problems identified for ELIZA?",
    options: [
      "Predicting the next word in a corpus.",
      "Building a full model of human consciousness.",
      "Generating responses when no keyword is present.",
      "Playing a three-game match against a professional.",
    ],
    answer: 2,
    explanation:
      "다섯 기술 문제 가운데 키워드가 없을 때 응답을 생성하는 일이 포함됩니다.",
    difficulty: 1,
  },
  {
    id: "dad-ai-v2-049",
    topic: "ai",
    passageId: "ai-v2-p029",
    prompt:
      "What are the two parts of ELIZA’s appropriate transformation rule?",
    options: [
      "A vocabulary rule and a sensor rule.",
      "A reward rule and a punishment rule.",
      "A decomposition rule and a reassembly rule.",
      "A medical rule and a translation rule.",
    ],
    answer: 2,
    explanation:
      "지문은 변환 규칙이 분해 규칙과 재조립 규칙이라는 두 부분으로 이루어진다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-ai-v2-050",
    topic: "ai",
    passageId: "ai-v2-p030",
    prompt:
      "What did ELIZA’s MEMORY structure do when no keyword was encountered?",
    options: [
      "It deleted the earlier conversation.",
      "It translated the input into Russian.",
      "It used prior inputs to reference part of the earlier conversation.",
      "It stopped all output permanently.",
    ],
    answer: 2,
    explanation:
      "MEMORY 구조는 이전 입력을 기록하고 키워드가 없을 때 앞선 대화의 일부를 참조하는 응답을 만들었습니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-051",
    topic: "ai",
    passageId: "ai-v2-p031",
    prompt:
      "What group had discussed machine intelligence before the field of AI research was founded?",
    options: [
      "The American Association of Artificial Intelligence.",
      "The Strategic Computing Initiative.",
      "The Ratio Club.",
      "The Society for the Study of Artificial Intelligence and the Simulation of Behaviour.",
    ],
    answer: 2,
    explanation:
      "AI 연구 분야가 세워지기 전 기계 지능은 영국의 비공식 연구자 모임인 Ratio Club에서 흔한 주제였습니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-052",
    topic: "ai",
    passageId: "ai-v2-p032",
    prompt:
      "What did Turing’s later BBC formulation ask the computer’s role to achieve?",
    options: [
      "To translate 49 Russian sentences.",
      "To calculate every possible game move.",
      "To make a significant proportion of the jury believe it was really a man.",
      "To identify which participant was a woman.",
    ],
    answer: 2,
    explanation:
      "BBC 방송에서 설명한 형식에서는 컴퓨터가 배심원의 상당수가 자신을 실제 남자라고 믿게 해야 했습니다.",
    difficulty: 3,
  },
  {
    id: "dad-ai-v2-053",
    topic: "ai",
    passageId: "ai-v2-p033",
    prompt:
      "What uncertainty about the Turing test does the passage highlight?",
    options: [
      "Whether the machine can solve a mathematical optimisation problem.",
      "Whether the test uses a full-sized Go board.",
      "Whether the interrogator knows that one participant is a computer.",
      "Whether the computer is allowed to use a vocabulary list.",
    ],
    answer: 2,
    explanation:
      "지문은 심문자가 참가자 중 하나가 컴퓨터라는 사실을 알고 있는지 튜링이 분명히 하지 않았다고 지적합니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-054",
    topic: "ai",
    passageId: "ai-v2-p034",
    prompt: "Why does the passage call the Turing test a pragmatic attempt?",
    options: [
      "It guarantees a precise definition of intelligence.",
      "It measures only the size of a training data set.",
      "It provides something measurable despite the lack of sufficiently precise definitions.",
      "It replaces every philosophical question with a game of Go.",
    ],
    answer: 2,
    explanation:
      "지능과 사고의 충분히 정확한 정의가 없더라도 튜링 테스트는 측정 가능한 것을 제공하기 때문에 실용적 시도라고 설명됩니다.",
    difficulty: 3,
  },
  {
    id: "dad-ai-v2-055",
    topic: "ai",
    passageId: "ai-v2-p035",
    prompt: "What does the Chinese room argument in the passage challenge?",
    options: [
      "The use of natural language in all computer programs.",
      "The existence of external behaviour in machines.",
      "The inference that passing behaviour proves a machine has a mind or consciousness.",
      "The need for a human evaluator in a transcript test.",
    ],
    answer: 2,
    explanation:
      "중국어 방 논증은 외부 행동만으로 기계가 마음·의식·지향성을 가진다고 판단할 수 있다는 추론을 문제 삼습니다.",
    difficulty: 3,
  },
  {
    id: "dad-ai-v2-056",
    topic: "ai",
    passageId: "ai-v2-p036",
    prompt:
      "Why does Arthur Schwaninger propose a variation of the Turing test?",
    options: [
      "To make all answers depend on a training corpus.",
      "To remove philosophical questions from the test.",
      "To distinguish systems that use language from systems that understand it.",
      "To compare only machines that cannot use language.",
    ],
    answer: 2,
    explanation:
      "Schwaninger의 변형은 언어를 사용하기만 하는 시스템과 언어를 이해하는 시스템을 구별하려는 것입니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-057",
    topic: "ai",
    passageId: "ai-v2-p037",
    prompt:
      "What happened after Warren Weaver’s 1949 memorandum on machine translation?",
    options: [
      "The research community immediately abandoned translation.",
      "Only private companies continued the work.",
      "Significant advancements and applications began to emerge.",
      "The first full-sized Go match was announced.",
    ],
    answer: 2,
    explanation:
      "1949년 메모 발표 뒤 기계 번역에서 중요한 진전과 응용이 나타나기 시작했습니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-058",
    topic: "ai",
    passageId: "ai-v2-p038",
    prompt: "What limitation did the actual Georgetown–IBM demonstration have?",
    options: [
      "It translated millions of unrestricted sentences.",
      "It used a vocabulary of 8,000 to 9,000 word families.",
      "It translated a curated set of only 49 Russian sentences with a 250-word vocabulary.",
      "It was conducted without any media attention.",
    ],
    answer: 2,
    explanation:
      "실제 시연은 선별된 러시아어 49문장과 250단어의 제한된 어휘를 사용했습니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-059",
    topic: "ai",
    passageId: "ai-v2-p039",
    prompt:
      "What did ALPAC conclude about machine translation in its 1966 report?",
    options: [
      "It was cheaper, more accurate, and faster than human translation.",
      "It required no understanding of what a sentence was about.",
      "It was more expensive, less accurate, and slower than human translation.",
      "It had already solved the commonsense knowledge problem.",
    ],
    answer: 2,
    explanation:
      "ALPAC는 기계 번역이 인간 번역보다 비싸고 부정확하며 느리다고 결론 내렸습니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-060",
    topic: "ai",
    passageId: "ai-v2-p040",
    prompt: "Why did mainstream perceptron research end in part?",
    options: [
      "A 1969 book reported that multilayer networks were already perfectly trained.",
      "The Logic Theorist stopped manipulating symbols.",
      "Minsky and Papert’s 1969 book emphasised the limits of perceptrons.",
      "Rosenblatt withdrew all predictions about language.",
    ],
    answer: 2,
    explanation:
      "1969년 Minsky와 Papert의 책이 퍼셉트론이 할 수 있는 일의 한계를 강조한 것이 주된 이유 중 하나였습니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-061",
    topic: "ai",
    passageId: "ai-v2-p041",
    prompt:
      "What did the Lighthill report say about many successful AI algorithms?",
    options: [
      "They always completed real-world problems quickly.",
      "They required no assumptions about combinatorial explosion.",
      "They were designed only for natural-language translation.",
      "They could grind to a halt on real-world problems and suit only “toy” versions.",
    ],
    answer: 3,
    explanation:
      "Lighthill 보고서는 조합 폭발 때문에 많은 알고리즘이 현실 문제에서 멈추고 장난감 문제에만 맞을 수 있다고 했습니다.",
    difficulty: 3,
  },
  {
    id: "dad-ai-v2-062",
    topic: "ai",
    passageId: "ai-v2-p042",
    prompt:
      "Why did early successful expert systems such as XCON become problematic by the early 1990s?",
    options: [
      "They had become too inexpensive to maintain.",
      "They learned continuously from every unusual input.",
      "They were required to run only on Go hardware.",
      "They were difficult to update, could not learn, and were brittle.",
    ],
    answer: 3,
    explanation:
      "XCON 같은 시스템은 유지 비용이 높고 업데이트가 어려우며 학습하지 못하고 비정상 입력에 취약했습니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-063",
    topic: "ai",
    passageId: "ai-v2-p043",
    prompt:
      "What did early diagnostic systems use to generate a diagnostic outcome?",
    options: [
      "Only a human expert’s spoken explanation.",
      "A vocabulary of tokens from the web.",
      "A list of possible Go moves.",
      "Patients’ symptoms and laboratory test results.",
    ],
    answer: 3,
    explanation:
      "초기 진단 시스템은 환자의 증상과 실험실 검사 결과를 입력으로 사용해 진단 결과를 만들었습니다.",
    difficulty: 1,
  },
  {
    id: "dad-ai-v2-064",
    topic: "ai",
    passageId: "ai-v2-p044",
    prompt:
      "Which component is listed as part of an expert system’s general architecture?",
    options: [
      "A hidden jury that identifies a machine.",
      "A reinforcement-learning reward model only.",
      "A 3D scanner for every input.",
      "An explanation facility.",
    ],
    answer: 3,
    explanation: "전문가 시스템 구성 요소 목록에는 설명 시설이 포함됩니다.",
    difficulty: 1,
  },
  {
    id: "dad-ai-v2-065",
    topic: "ai",
    passageId: "ai-v2-p045",
    prompt:
      "How does backward chaining differ from the forward-chaining example?",
    options: [
      "It asserts a conclusion without querying anything.",
      "It ignores possible conclusions and starts with a random input.",
      "It uses only image sensors to find a rule.",
      "It starts from possible conclusions and works backward to test whether they may be true.",
    ],
    answer: 3,
    explanation:
      "후방 연쇄는 가능한 결론에서 출발해 그 결론이 참일 수 있는지 거꾸로 확인합니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-066",
    topic: "ai",
    passageId: "ai-v2-p046",
    prompt:
      "What could an expert system present when a user asked why Socrates was mortal?",
    options: [
      "A list of unrelated image classifications.",
      "A prediction of the next word in a sentence.",
      "A claim that no rule had fired.",
      "The rules that fired, expressed in an explanation such as “Because all men are mortal and Socrates is a man”.",
    ],
    answer: 3,
    explanation:
      "지문은 시스템이 발화한 규칙을 되돌아보고 “모든 사람은 필멸하고 소크라테스는 사람이다”라는 설명을 제시하는 예를 듭니다.",
    difficulty: 3,
  },
  {
    id: "dad-ai-v2-067",
    topic: "ai",
    passageId: "ai-v2-p047",
    prompt: "Which benefit is explicitly listed for expert systems?",
    options: [
      "They always provide deep perception of every concept.",
      "They eliminate the need for any knowledge acquisition.",
      "They cannot be run simultaneously.",
      "Their expertise can be accessed on computer hardware and responses finish on time.",
    ],
    answer: 3,
    explanation:
      "장점 목록에는 어떤 컴퓨터 하드웨어에서도 전문 지식에 접근하고 응답을 제때 완료할 수 있다는 내용이 있습니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-068",
    topic: "ai",
    passageId: "ai-v2-p048",
    prompt: "Which limitation of expert systems is stated?",
    options: [
      "They always understand deep relationships without expert input.",
      "They have no ethical issues in any current use.",
      "They can solve every simple task cheaply.",
      "Their knowledge is superficial and a simple task can become computationally expensive.",
    ],
    answer: 3,
    explanation:
      "전문가 시스템은 지식이 피상적이고 간단한 작업도 계산 비용이 커질 수 있다는 한계가 있습니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-069",
    topic: "ai",
    passageId: "ai-v2-p049",
    prompt: "What happened before transformer-based models emerged in 2017?",
    options: [
      "All language models were considered large regardless of constraints.",
      "No statistical language models used internet data.",
      "Word alignment techniques were invented only after 2020.",
      "Some language models were considered large relative to the computational and data constraints of their time.",
    ],
    answer: 3,
    explanation:
      "트랜스포머 이전에도 당시 계산·데이터 제약에 비해 큰 것으로 여겨진 언어 모델이 있었습니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-070",
    topic: "ai",
    passageId: "ai-v2-p050",
    prompt: "What does byte-pair encoding do in the tokenizer example?",
    options: [
      "It assigns every word a fixed human-written definition.",
      "It converts all images into 3D point clouds.",
      "It removes every special token from the vocabulary.",
      "It starts with unique characters and repeatedly merges the most frequent pair.",
    ],
    answer: 3,
    explanation:
      "BPE 예시는 고유 문자에서 시작해 가장 자주 나타나는 쌍을 반복적으로 병합하는 방식입니다.",
    difficulty: 3,
  },
  {
    id: "dad-ai-v2-071",
    topic: "ai",
    passageId: "ai-v2-p051",
    prompt: "Why can cleaned LLM datasets improve downstream performance?",
    options: [
      "They retain all duplicated and toxic data.",
      "They prevent any further model from being trained.",
      "They replace text with only image data.",
      "Removing low-quality, duplicated, or toxic data can increase training efficiency.",
    ],
    answer: 3,
    explanation:
      "저품질·중복·유해 데이터를 제거한 정제 데이터셋은 학습 효율을 높이고 후속 성능을 개선할 수 있습니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-072",
    topic: "ai",
    passageId: "ai-v2-p052",
    prompt: "What does instruction fine-tuning teach LLMs to do?",
    options: [
      "Predict no tokens at all.",
      "Operate a Go board without any text.",
      "Estimate only the cost of pretraining.",
      "Follow user instructions.",
    ],
    answer: 3,
    explanation:
      "지시 미세 조정은 LLM이 사용자 지시를 따르도록 가르치는 지도학습 형태입니다.",
    difficulty: 1,
  },
  {
    id: "dad-ai-v2-073",
    topic: "ai",
    passageId: "ai-v2-p053",
    prompt: "What is hosted inference in the passage?",
    options: [
      "Running a model only from weights stored on a personal computer.",
      "Training a model with no input.",
      "Removing all generated output from a data center.",
      "Running a language model at remote AI data centers and serving its output over the Internet.",
    ],
    answer: 3,
    explanation:
      "호스팅 추론은 원격 AI 데이터 센터에서 모델을 실행하고 인터넷으로 출력을 제공합니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-074",
    topic: "ai",
    passageId: "ai-v2-p054",
    prompt:
      "How are autoregressive models described in contrast with masked models?",
    options: [
      "Autoregressive models guess missing parts, while masked models guess sequence continuations.",
      "Both models are trained only on image labels.",
      "Neither model makes predictions from its training data.",
      "Autoregressive models guess how a sequence continues, while masked models guess missing parts.",
    ],
    answer: 3,
    explanation:
      "자기회귀 모델은 시퀀스의 다음 진행을, 마스크 모델은 시퀀스에서 빠진 부분을 추측합니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-075",
    topic: "ai",
    passageId: "ai-v2-p055",
    prompt:
      "How does the passage distinguish computer vision’s scientific and technological disciplines?",
    options: [
      "The scientific discipline builds factory hardware, while the technological discipline studies philosophy.",
      "The scientific discipline translates text, while the technological discipline labels words.",
      "The scientific discipline studies only human eyes, while the technological discipline avoids models.",
      "The scientific discipline studies theory behind image-extracting systems, while the technological discipline applies theories and models to build systems.",
    ],
    answer: 3,
    explanation:
      "과학 분야는 이미지에서 정보를 추출하는 인공 시스템의 이론을 다루고 기술 분야는 그 이론과 모델로 시스템을 구축합니다.",
    difficulty: 3,
  },
  {
    id: "dad-ai-v2-076",
    topic: "ai",
    passageId: "ai-v2-p056",
    prompt:
      "Why are solid-state physics and quantum physics relevant to computer vision in this passage?",
    options: [
      "They replace all image sensors with language models.",
      "They are used only to rank Go openings.",
      "They explain why no electromagnetic radiation reaches sensors.",
      "They help explain image sensors, light interacting with surfaces, optics, and image formation.",
    ],
    answer: 3,
    explanation:
      "물리학은 센서가 감지하는 전자기 복사와 빛·표면·광학, 이미지 형성 과정을 설명하는 데 관련됩니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-077",
    topic: "ai",
    passageId: "ai-v2-p057",
    prompt:
      "What does signal processing contribute to computer vision according to the passage?",
    options: [
      "It limits vision to one-variable signals.",
      "It removes all methods specific to images.",
      "It guarantees that images have no multiple dimensions.",
      "Methods for one-variable signals can be extended to two- or multi-variable signals, while vision also develops image-specific methods.",
    ],
    answer: 3,
    explanation:
      "신호 처리는 일변수 신호 방법을 다변수 신호에 확장하며 컴퓨터 비전은 이미지 고유 방법도 발전시킵니다.",
    difficulty: 3,
  },
  {
    id: "dad-ai-v2-078",
    topic: "ai",
    passageId: "ai-v2-p058",
    prompt:
      "What usually distinguishes machine vision from computer vision in the applications passage?",
    options: [
      "Machine vision concerns only philosophical definitions.",
      "Machine vision excludes automated image analysis.",
      "Computer vision always means a factory inspection process.",
      "Machine vision combines automated image analysis with methods for industrial inspection and robot guidance.",
    ],
    answer: 3,
    explanation:
      "머신 비전은 산업에서 자동화된 이미지 분석을 다른 방법·기술과 결합해 검사와 로봇 안내를 제공합니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-079",
    topic: "ai",
    passageId: "ai-v2-p059",
    prompt:
      "What is a prominent medical computer-vision application described?",
    options: [
      "Predicting Go opening win rates.",
      "Assigning tokens to punctuation marks.",
      "Measuring only the speed of factory bottles.",
      "Extracting information from images to diagnose a patient, such as detecting tumours.",
    ],
    answer: 3,
    explanation:
      "의료 컴퓨터 비전은 이미지에서 정보를 추출해 종양 같은 이상을 찾고 환자를 진단하는 데 쓰일 수 있습니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-080",
    topic: "ai",
    passageId: "ai-v2-p060",
    prompt:
      "Which use of computer vision by fully autonomous vehicles is explicitly mentioned?",
    options: [
      "Writing natural-language essays for passengers.",
      "Training a reward model from human feedback.",
      "Replacing every vehicle with a 3D scanner.",
      "Navigating, mapping the environment, and detecting obstacles.",
    ],
    answer: 3,
    explanation:
      "완전 자율 차량은 컴퓨터 비전으로 위치 파악·환경 지도 작성과 장애물 탐지를 할 수 있습니다.",
    difficulty: 2,
  },
];

const sourceForArticle = (article) => ({
  title: article.title,
  url: article.url,
  revisionId: article.revisionId,
  revisionUrl: article.revisionUrl,
  revisionTimestamp: article.revisionTimestamp,
  retrievedAt: article.retrievedAt,
  attribution: sources.attribution,
  license: sources.license,
  licenseUrl: sources.licenseUrl,
});

const attachPassage = (question) => {
  const passage = passageById.get(question.passageId);
  if (!passage) throw new Error(`Missing AI passage: ${question.passageId}`);
  const article = articleById.get(passage.articleId);
  if (!article) throw new Error(`Missing AI article: ${passage.articleId}`);
  return Object.freeze({
    ...question,
    source: sourceForArticle(article),
    passage: passage.text,
  });
};

export const dadAIQuestions = Object.freeze(questionSpecs.map(attachPassage));
export const DAD_AI_ARTICLE_COUNT = articleById.size;
export const DAD_AI_PASSAGE_COUNT = passageById.size;
