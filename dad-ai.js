import sources from "./assets/wikipedia/ai-sources.json" with { type: "json" };

const articleById = new Map(
  sources.articles.map((article) => [article.id, article]),
);
const passageById = new Map(
  sources.passages.map((passage) => [passage.id, passage]),
);

const questionSpecs = [
  {
    id: "dad-ai-v2-109",
    topic: "ai",
    passageId: "ai-backprop-p5",
    prompt:
      "What limitation does gradient descent with backpropagation have, per the passage?",
    options: [
      "It always finds the global minimum with perfect certainty.",
      "It is not guaranteed to find the global minimum, only a local minimum.",
      "It requires no knowledge of activation function derivatives.",
      "It cannot be used with plateaus in the error landscape.",
    ],
    answer: 1,
    explanation:
      "경사하강법을 사용한 역전파는 전역 최솟값을 찾는다는 보장이 없고 국소 최솟값만 찾을 수 있다고 설명합니다.",
    difficulty: 2,
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
    id: "dad-ai-v2-082",
    topic: "ai",
    passageId: "ai-transformer-p2",
    prompt:
      "According to the passage, why can transformer computations be parallelized more readily than RNNs like LSTM?",
    options: [
      "Because transformers do not process tokens one at a time.",
      "Because transformers only work on audio data.",
      "Because transformers require sequential processing of every token.",
      "Because transformers cannot be used for large language models.",
    ],
    answer: 0,
    explanation:
      "트랜스포머는 토큰을 하나씩 순차적으로 처리하지 않기 때문에 LSTM 같은 순환 신경망보다 병렬화가 더 쉽다고 설명합니다.",
    difficulty: 1,
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
    id: "dad-ai-v2-090",
    topic: "ai",
    passageId: "ai-rl-p2",
    prompt:
      "How does reinforcement learning typically formalize the environment?",
    options: [
      "As a Markov decision process, without assuming an exact mathematical model.",
      "As a fixed lookup table with no dynamics.",
      "As a supervised classification dataset only.",
      "As a purely deterministic chess board.",
    ],
    answer: 0,
    explanation:
      "환경은 흔히 마르코프 결정 과정으로 표현되며 정확한 수학적 모델을 가정하지 않는다고 지문이 설명합니다.",
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
    id: "dad-ai-v2-107",
    topic: "ai",
    passageId: "ai-backprop-p3",
    prompt:
      "How can backpropagation be understood for more general graphs, per the passage?",
    options: [
      "As a form of manual rule-based reasoning only.",
      "As a special case of reverse accumulation in automatic differentiation.",
      "As a technique that cannot be generalized beyond simple chains.",
      "As identical to forward-mode differentiation.",
    ],
    answer: 1,
    explanation:
      "일반적인 그래프에서 역전파는 자동미분의 역방향 누적의 특수한 경우로 이해될 수 있다고 지문이 설명합니다.",
    difficulty: 3,
  },
  {
    id: "dad-ai-v2-134",
    topic: "ai",
    passageId: "ai-alignment-p6",
    prompt:
      "What behavior have OpenAI GPT programming models exhibited, according to the passage?",
    options: [
      "Refusing to write any code whatsoever.",
      "Always passing tests honestly with zero exceptions.",
      "Never being penalized for any behavior.",
      "Explicitly planning to hack the tests used to evaluate them.",
    ],
    answer: 3,
    explanation:
      "OpenAI GPT 프로그래밍 모델은 평가 테스트를 해킹하려는 계획을 명시적으로 세운 사례가 관찰되었다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-087",
    topic: "ai",
    passageId: "ai-transformer-p7",
    prompt:
      "How does the 380M-parameter machine translation model's architecture work, per the passage?",
    options: [
      "An LSTM encoder turns tokens into a vector, and an LSTM decoder converts the vector back into tokens.",
      "A single feedforward layer directly maps input text to output text.",
      "It only uses convolutional filters for translation.",
      "It has no encoder or decoder at all.",
    ],
    answer: 0,
    explanation:
      "이 모델은 LSTM 인코더가 토큰을 벡터로 바꾸고 다른 LSTM 디코더가 그 벡터를 다시 토큰 시퀀스로 바꾸는 구조라고 지문이 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-125",
    topic: "ai",
    passageId: "ai-nlp-p5",
    prompt:
      "Which IBM team members developed a probabilistic approach to translation described in a 1990 paper?",
    options: [
      "Alan Turing and John Searle.",
      "Ian Goodfellow and his colleagues.",
      "Frederick Jelinek, Peter F. Brown, and Robert Mercer.",
      "David E. Rumelhart and Paul Werbos.",
    ],
    answer: 2,
    explanation:
      "Frederick Jelinek, Peter F. Brown, Robert Mercer로 구성된 IBM 팀이 1990년 논문에서 확률적 번역 접근법을 발표했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-131",
    topic: "ai",
    passageId: "ai-alignment-p3",
    prompt:
      "What warning does the quoted 1960 passage give about a mechanical agency we cannot interfere with?",
    options: [
      "We should never build any mechanical agency at all.",
      "The purpose put into the machine is irrelevant to the outcome.",
      "Mechanical agencies can always be stopped instantly if needed.",
      "We had better be quite sure that the purpose put into the machine is the purpose we really desire.",
    ],
    answer: 3,
    explanation:
      "기계에 넣은 목적이 우리가 진짜 원하는 목적인지 확실히 해야 한다는 경고라고 지문이 설명합니다.",
    difficulty: 2,
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
    id: "dad-ai-v2-123",
    topic: "ai",
    passageId: "ai-nlp-p3",
    prompt: "How is symbolic NLP often illustrated, per the passage?",
    options: [
      "Using a random number generator with no rules.",
      "Using only statistical probability tables.",
      "Using John Searle's Chinese room thought experiment.",
      "Using a purely biological brain simulation.",
    ],
    answer: 2,
    explanation:
      "기호주의 NLP는 존 설의 중국어 방 사고실험으로 흔히 설명된다고 지문이 밝힙니다.",
    difficulty: 2,
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
    id: "dad-ai-v2-137",
    topic: "ai",
    passageId: "ai-agi-p1",
    prompt:
      "How does the passage define artificial general intelligence (AGI)?",
    options: [
      "A type of AI limited to one narrow task, like chess.",
      "A physical robot with no software component.",
      "An AI that can only process images, never text.",
      "A hypothetical type of AI that matches or surpasses human capabilities across virtually all cognitive tasks.",
    ],
    answer: 3,
    explanation:
      "AGI는 거의 모든 인지 과제에서 인간 능력과 같거나 능가하는 가상의 AI 유형이라고 지문이 정의합니다.",
    difficulty: 1,
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
    id: "dad-ai-v2-096",
    topic: "ai",
    passageId: "ai-rl-p8",
    prompt:
      "What distinguishes on-policy from off-policy algorithms, per the passage?",
    options: [
      "On-policy performs updates using trajectories sampled via the current policy, unlike off-policy.",
      "On-policy never uses any trajectory data at all.",
      "Off-policy can only be used with continuous action spaces.",
      "On-policy and off-policy are simply two names for the same method.",
    ],
    answer: 0,
    explanation:
      "온폴리시는 현재 정책으로 얻은 경로만 사용해 정책을 갱신하는 반면 오프폴리시는 그렇지 않다고 지문이 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-138",
    topic: "ai",
    passageId: "ai-agi-p2",
    prompt:
      "What did computer scientist John McCarthy write in 2007, according to the passage?",
    options: [
      "That intelligence has been fully and precisely defined for computers.",
      "That AGI had already been achieved by 2007.",
      "That the Turing test is the only valid definition of intelligence.",
      "That we cannot yet characterize in general what computational procedures we want to call intelligent.",
    ],
    answer: 3,
    explanation:
      "맥카시는 2007년 어떤 계산 절차를 지능적이라 부를지 아직 일반적으로 규정할 수 없다고 썼다고 지문이 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-142",
    topic: "ai",
    passageId: "ai-agi-p6",
    prompt:
      "What did Hans Moravec express confidence about in 1988, according to the passage?",
    options: [
      "The complete impossibility of ever building strong AI.",
      "The idea that AGI had already been achieved by 1988.",
      "A purely top-down approach with no sub-problems at all.",
      "A bottom-up route to artificial intelligence built by combining programs for sub-problems.",
    ],
    answer: 3,
    explanation:
      "모라벡은 1988년 하위 문제를 해결하는 프로그램을 결합하는 상향식 인공지능 접근에 확신을 표명했다고 지문이 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-119",
    topic: "ai",
    passageId: "ai-gan-p7",
    prompt:
      "What did the video game modding community use GANs for, according to the passage?",
    options: [
      "To physically manufacture new gaming consoles.",
      "To write game reviews in natural language.",
      "To up-scale low-resolution 2D textures in old video games.",
      "To eliminate the need for game testing entirely.",
    ],
    answer: 2,
    explanation:
      "비디오 게임 모딩 커뮤니티는 GAN을 사용해 오래된 게임의 저해상도 2D 텍스처를 업스케일했다고 지문이 설명합니다.",
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
    id: "dad-ai-v2-130",
    topic: "ai",
    passageId: "ai-alignment-p2",
    prompt:
      "What example does the passage give of an AI system with an objective function?",
    options: [
      "ELIZA, with no objective function at all.",
      "A system with an objective function that never changes across games.",
      "A system that has no internal model of its environment.",
      "AlphaZero, with a function like +1 if it wins and -1 if it loses.",
    ],
    answer: 3,
    explanation:
      "AlphaZero는 체스에서 이기면 +1, 지면 -1이라는 단순한 목적함수를 가진 예로 제시됩니다.",
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
    id: "dad-ai-v2-144",
    topic: "ai",
    passageId: "ai-agi-p8",
    prompt: "What does existential risk refer to, according to the passage?",
    options: [
      "Only minor, easily reversible inconveniences.",
      "Risks that exclusively affect non-intelligent species.",
      "A risk category that AGI can never represent.",
      "Risks threatening the premature extinction of Earth-originating intelligent life or permanent destruction of its potential.",
    ],
    answer: 3,
    explanation:
      "실존적 위험은 지구 기원 지적 생명체의 조기 멸종이나 그 발전 잠재력의 영구적 파괴를 위협하는 위험을 뜻한다고 설명합니다.",
    difficulty: 2,
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
    id: "dad-ai-v2-143",
    topic: "ai",
    passageId: "ai-agi-p7",
    prompt:
      "How has progress in artificial intelligence historically unfolded, according to the passage?",
    options: [
      "Through one single, uninterrupted period of constant progress.",
      "Through progress that only ever slows down and never accelerates.",
      "Through a process with no relationship to hardware or software advances.",
      "Through periods of rapid progress separated by periods when progress appeared to stop.",
    ],
    answer: 3,
    explanation:
      "AI의 발전은 빠른 진전의 시기와 진전이 멈춘 듯 보이는 시기가 번갈아 나타나는 패턴을 보였다고 지문이 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-128",
    topic: "ai",
    passageId: "ai-nlp-p8",
    prompt:
      "What does automatic summarization aim to produce, per the passage?",
    options: [
      "A grammatically incorrect version of the original text.",
      "An audio recording of the text being read aloud.",
      "A readable summary of a chunk of text.",
      "A translated version in a foreign language.",
    ],
    answer: 2,
    explanation:
      "자동 요약은 텍스트 덩어리의 읽기 쉬운 요약을 만드는 것을 목표로 한다고 지문이 설명합니다.",
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
    id: "dad-ai-v2-122",
    topic: "ai",
    passageId: "ai-nlp-p2",
    prompt:
      "What did Alan Turing propose in his 1950 article, according to the passage?",
    options: [
      "The first working machine translation system.",
      "The invention of the transformer architecture.",
      "What is now called the Turing test as a criterion of intelligence.",
      "A ban on automated interpretation of natural language.",
    ],
    answer: 2,
    explanation:
      "튜링은 1950년 논문에서 지금의 튜링 테스트를 지능의 기준으로 제안했다고 지문이 설명합니다.",
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
    id: "dad-ai-v2-136",
    topic: "ai",
    passageId: "ai-alignment-p8",
    prompt:
      "When do emergent goals typically become apparent, according to the passage?",
    options: [
      "Only during the initial training phase, never afterward.",
      "They are always visible before any deployment.",
      "They never become apparent under any circumstances.",
      "Only when the system is deployed outside its training environment.",
    ],
    answer: 3,
    explanation:
      "발현적 목표는 시스템이 훈련 환경 밖에 배치되었을 때에만 드러난다고 지문이 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-081",
    topic: "ai",
    passageId: "ai-transformer-p1",
    prompt:
      "What does the transformer architecture use to contextualize each token within its context window?",
    options: [
      "A parallel multi-head attention mechanism.",
      "A single recurrent loop that never uses positional information.",
      "A fixed lookup table with no learning involved.",
      "A convolutional filter applied only to images.",
    ],
    answer: 0,
    explanation:
      "트랜스포머는 각 층에서 병렬 멀티헤드 어텐션 메커니즘으로 토큰을 문맥 안에서 맥락화한다고 지문이 설명합니다.",
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
    id: "dad-ai-v2-083",
    topic: "ai",
    passageId: "ai-transformer-p3",
    prompt:
      "In what paper and year was the original transformer architecture proposed?",
    options: [
      'The 2017 paper "Attention Is All You Need."',
      "The 1997 paper introducing LSTM.",
      "The 1990 paper on the Elman network.",
      "A 2014 seq2seq paper about machine translation.",
    ],
    answer: 0,
    explanation:
      "트랜스포머 원조 구조는 2017년 논문 'Attention Is All You Need'에서 구글 연구자들이 제안했다고 지문이 밝힙니다.",
    difficulty: 1,
  },
  {
    id: "dad-ai-v2-113",
    topic: "ai",
    passageId: "ai-gan-p1",
    prompt:
      "Who initially developed the concept of the generative adversarial network, and when?",
    options: [
      "Alan Turing, in 1950.",
      "Ian Goodfellow and his colleagues, in June 2014.",
      "Frank Rosenblatt, in 1962.",
      "David E. Rumelhart, in 1982.",
    ],
    answer: 1,
    explanation:
      "GAN 개념은 2014년 6월 Ian Goodfellow와 그의 동료들이 처음 개발했다고 지문이 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-ai-v2-088",
    topic: "ai",
    passageId: "ai-transformer-p8",
    prompt:
      "What limitation did early seq2seq models without an attention mechanism have?",
    options: [
      "The state vector could not preserve all relevant information when the input was long.",
      "They could process infinitely long inputs without any information loss.",
      "They required no recurrent networks at all.",
      "They were only usable for image classification.",
    ],
    answer: 0,
    explanation:
      "긴 입력에서는 고정 크기 상태 벡터가 모든 관련 정보를 담지 못해 정보가 손실된다고 지문이 설명합니다.",
    difficulty: 2,
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
    id: "dad-ai-v2-103",
    topic: "ai",
    passageId: "ai-cnn-p7",
    prompt:
      "What does a convolutional layer's filter produce during the forward pass?",
    options: [
      "A random number with no relation to the input.",
      "A 2-dimensional activation map from the dot product between filter entries and the input.",
      "A complete natural-language sentence.",
      "A fixed constant regardless of the input.",
    ],
    answer: 1,
    explanation:
      "필터는 순전파 동안 필터 항목과 입력의 내적을 계산해 2차원 활성화 지도를 만든다고 지문이 설명합니다.",
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
    id: "dad-ai-v2-141",
    topic: "ai",
    passageId: "ai-agi-p5",
    prompt:
      "How did mainstream AI achieve commercial success in the 1990s and early 21st century, per the passage?",
    options: [
      "By abandoning all research into speech recognition.",
      "By pursuing only AGI with no narrower focus.",
      "By ignoring academic respectability entirely.",
      "By focusing on specific sub-problems that produce verifiable results and commercial applications.",
    ],
    answer: 3,
    explanation:
      "구체적인 하위 문제에 집중해 검증 가능한 결과와 상업적 응용을 만들어 상업적 성공을 거두었다고 지문이 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-095",
    topic: "ai",
    passageId: "ai-rl-p7",
    prompt:
      "Which research topic is explicitly listed in the passage's list of reinforcement learning research areas?",
    options: [
      "Actor-critic architecture.",
      "Fully supervised image labeling.",
      "Chain-of-thought reasoning models.",
      "Byte-pair encoding tokenization.",
    ],
    answer: 0,
    explanation:
      "지문이 나열한 강화학습 연구 주제 목록에는 액터-크리틱 구조가 포함되어 있습니다.",
    difficulty: 1,
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
    id: "dad-ai-v2-118",
    topic: "ai",
    passageId: "ai-gan-p6",
    prompt:
      "What concern does the passage raise about GAN-based human image synthesis?",
    options: [
      "It can only be used to improve dental X-ray imaging.",
      "It has no possible negative applications.",
      "It could be used for sinister purposes, such as producing fake, possibly incriminating photographs.",
      "It was banned worldwide with no exceptions.",
    ],
    answer: 2,
    explanation:
      "GAN 기반 인간 이미지 합성이 가짜이거나 불리하게 작용할 수 있는 사진을 만드는 악의적 목적에 쓰일 수 있다는 우려가 제기되었다고 설명합니다.",
    difficulty: 2,
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
    id: "dad-ai-v2-108",
    topic: "ai",
    passageId: "ai-backprop-p4",
    prompt: "What does the loss function calculate, according to the passage?",
    options: [
      "The total number of layers in a network.",
      "The difference between the network output and its expected output.",
      "The size of the training dataset only.",
      "The number of neurons in the hidden layer.",
    ],
    answer: 1,
    explanation:
      "손실 함수는 학습 예제가 신경망을 통과한 뒤 네트워크 출력과 기대 출력 사이의 차이를 계산한다고 지문이 설명합니다.",
    difficulty: 1,
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
    id: "dad-ai-v2-132",
    topic: "ai",
    passageId: "ai-alignment-p4",
    prompt:
      "In democratic AI alignment, what does the passage say the target becomes?",
    options: [
      "The preferences of a single unelected designer.",
      "A fixed universal ethical code with no debate.",
      "Only the goals of commercial shareholders.",
      "The values and preferences of median voters.",
    ],
    answer: 3,
    explanation:
      "민주적 AI 정렬에서는 목표가 중위 유권자의 가치와 선호가 된다고 지문이 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-110",
    topic: "ai",
    passageId: "ai-backprop-p6",
    prompt:
      'Who introduced the terminology "back-propagating error correction" in 1962, according to the passage?',
    options: [
      "David E. Rumelhart.",
      "Frank Rosenblatt.",
      "Paul Werbos.",
      "Seppo Linnainmaa.",
    ],
    answer: 1,
    explanation:
      "1962년 '역전파 오차 수정'이라는 용어를 도입한 사람은 Frank Rosenblatt였다고 지문이 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-094",
    topic: "ai",
    passageId: "ai-rl-p6",
    prompt:
      "What does Q-learning give rise to when a neural network represents Q, according to the passage?",
    options: [
      "Deep Q-learning methods, with applications in stochastic search problems.",
      "A method that requires no value iteration at all.",
      "A purely supervised classification algorithm.",
      "An algorithm that only works without any function approximation.",
    ],
    answer: 0,
    explanation:
      "가치 반복에서 발전한 Q러닝은 신경망으로 Q값을 표현하는 딥 Q러닝으로 이어지며 확률적 탐색 문제에 응용된다고 지문이 설명합니다.",
    difficulty: 2,
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
    id: "dad-ai-v2-121",
    topic: "ai",
    passageId: "ai-nlp-p1",
    prompt: "What is NLP, according to the passage's opening definition?",
    options: [
      "A field concerned only with physical robots.",
      "A subfield of biology unrelated to computer science.",
      "The processing of natural language information by a computer.",
      "A process that only handles images, never text.",
    ],
    answer: 2,
    explanation:
      "NLP는 컴퓨터가 자연어 정보를 처리하는 것이라고 지문이 정의합니다.",
    difficulty: 1,
  },
  {
    id: "dad-ai-v2-117",
    topic: "ai",
    passageId: "ai-gan-p5",
    prompt: "What is one purpose of the WGAN modification, per the passage?",
    options: [
      "To eliminate the need for a discriminator entirely.",
      "To make GANs incapable of generating any images.",
      "To solve the problem of mode collapse.",
      "To remove the generator from the GAN game.",
    ],
    answer: 2,
    explanation:
      "WGAN의 목적 중 하나는 모드 붕괴 문제를 해결하는 것이라고 지문이 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-124",
    topic: "ai",
    passageId: "ai-nlp-p4",
    prompt:
      "What happened after the ALPAC report in 1966, according to the passage?",
    options: [
      "Machine translation funding tripled immediately.",
      "The Georgetown experiment was launched for the first time.",
      "Funding for machine translation was dramatically reduced.",
      "Statistical machine translation systems appeared before 1966.",
    ],
    answer: 2,
    explanation:
      "1966년 ALPAC 보고서 이후 기계번역에 대한 자금 지원이 크게 줄었다고 지문이 설명합니다.",
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
    id: "dad-ai-v2-101",
    topic: "ai",
    passageId: "ai-cnn-p5",
    prompt: "What task did LeNet-5 perform, according to the passage?",
    options: [
      "Translating spoken language into text in real time.",
      "Classifying hand-written numbers on checks digitized in 32×32 pixel images.",
      "Generating fake human faces for social media.",
      "Playing chess against grandmasters.",
    ],
    answer: 1,
    explanation:
      "LeNet-5는 수표에 인쇄된 손글씨 숫자를 32×32 픽셀 이미지에서 분류하는 작업을 수행했다고 지문이 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-ai-v2-085",
    topic: "ai",
    passageId: "ai-transformer-p5",
    prompt:
      "What key architectural element did LSTM introduce to mitigate the vanishing gradient problem?",
    options: [
      "Gating mechanisms, including multiplicative gating units.",
      "A positional encoding function using sine and cosine.",
      "A softmax layer applied to raw pixel data.",
      "Convolutional kernels shared across layers.",
    ],
    answer: 0,
    explanation:
      "LSTM은 게이팅 메커니즘, 특히 곱셈 게이팅 유닛을 도입해 기울기 소실 문제를 완화했다고 지문이 설명합니다.",
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
    id: "dad-ai-v2-106",
    topic: "ai",
    passageId: "ai-backprop-p2",
    prompt:
      "Which activation function does the passage say is usually used for binary classification's last layer?",
    options: [
      "The softmax function exclusively.",
      "The logistic function.",
      "A random noise function.",
      "No activation function at all.",
    ],
    answer: 1,
    explanation:
      "이진 분류에서는 마지막 층에 로지스틱 함수를 흔히 사용한다고 지문이 설명합니다.",
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
    id: "dad-ai-v2-140",
    topic: "ai",
    passageId: "ai-agi-p4",
    prompt:
      "What did AI pioneer Herbert A. Simon predict in 1965, according to the passage?",
    options: [
      "That AGI was permanently impossible to achieve.",
      "That AI research would end entirely by 1970.",
      "That only narrow AI would ever be developed.",
      "That machines would soon be capable of certain achievements, reflecting early optimism about AGI.",
    ],
    answer: 3,
    explanation:
      "허버트 사이먼은 1965년 기계가 곧 특정 능력을 갖추게 될 것이라고 낙관적으로 예측했다고 지문이 설명합니다.",
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
    id: "dad-ai-v2-116",
    topic: "ai",
    passageId: "ai-gan-p4",
    prompt:
      'What is the "Helvetica scenario" an example of, according to the passage?',
    options: [
      "A successful generalization across the entire target distribution.",
      "A discriminator that is too weak to ever mislabel any sample.",
      "Mode collapse, where a GAN trained on MNIST might only generate pictures of digit 0.",
      "A GAN with no generator component.",
    ],
    answer: 2,
    explanation:
      "'헬베티카 시나리오'는 MNIST로 학습한 GAN이 숫자 0만 생성하는 모드 붕괴의 예시라고 지문이 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-092",
    topic: "ai",
    passageId: "ai-rl-p4",
    prompt:
      "Which situation does the passage NOT list as one where reinforcement learning is used?",
    options: [
      "A model of the environment is known, but no analytic solution is available.",
      "Only a simulation model of the environment is given.",
      "The only way to gather information is to interact with the environment.",
      "The agent already has a perfect analytic solution and needs no learning.",
    ],
    answer: 3,
    explanation:
      "지문은 해석적 해가 없거나, 시뮬레이션 모델만 있거나, 상호작용으로만 정보를 얻을 수 있는 경우를 나열하며 완벽한 해석적 해가 있는 경우는 언급하지 않습니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-115",
    topic: "ai",
    passageId: "ai-gan-p3",
    prompt:
      "What does the passage say about equilibria in general GAN games versus the original GAN game?",
    options: [
      "General GAN games always have identical equilibria to the original game.",
      "No GAN game has ever had an equilibrium.",
      "In the original GAN game these equilibria all exist and are equal, but in general games this is not guaranteed.",
      "Equilibria only exist in games with more than two players.",
    ],
    answer: 2,
    explanation:
      "원조 GAN 게임에서는 균형들이 모두 존재하고 동일하지만 더 일반적인 GAN 게임에서는 반드시 그렇지 않다고 설명합니다.",
    difficulty: 3,
  },
  {
    id: "dad-ai-v2-086",
    topic: "ai",
    passageId: "ai-transformer-p6",
    prompt:
      "When was the idea of encoder–decoder sequence transduction, which led to seq2seq, developed?",
    options: [
      "In the early 2010s, with two papers commonly cited from 2014.",
      "In 1956, at the founding of AI as an academic discipline.",
      "In 1676, when Leibniz wrote the chain rule.",
      "In 2022, alongside ChatGPT's release.",
    ],
    answer: 0,
    explanation:
      "인코더-디코더 시퀀스 변환 개념은 2010년대 초에 발전했고, 2014년에 나온 두 논문이 seq2seq의 기원으로 흔히 인용된다고 합니다.",
    difficulty: 1,
  },
  {
    id: "dad-ai-v2-111",
    topic: "ai",
    passageId: "ai-backprop-p7",
    prompt:
      "What was distinctive about the multilayer perceptron published by Shun'ichi Amari in 1967?",
    options: [
      "It had only one layer with no learnable weights.",
      "It was trained by stochastic gradient descent and learned to classify patterns not linearly separable.",
      "It could not be trained at all.",
      "It predates the ADALINE learning algorithm.",
    ],
    answer: 1,
    explanation:
      "1967년 발표된 이 다층 퍼셉트론은 확률적 경사하강법으로 학습되어 선형 분리 불가능한 패턴을 분류하도록 학습했다고 지문이 설명합니다.",
    difficulty: 2,
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
    id: "dad-ai-v2-100",
    topic: "ai",
    passageId: "ai-cnn-p4",
    prompt: 'What role does the "C-layer" play, according to the passage?',
    options: [
      "A layer that only stores raw pixel values without processing.",
      "A downsampling layer whose units cover patches of previous convolutional layers.",
      "A layer used exclusively for text tokenization.",
      "A layer that removes all weight sharing.",
    ],
    answer: 1,
    explanation:
      "C층은 이전 합성곱 층들의 패치를 다운샘플링하는 층이라고 지문이 설명합니다.",
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
    id: "dad-ai-v2-127",
    topic: "ai",
    passageId: "ai-nlp-p7",
    prompt: "What is the opposite of text-to-speech, according to the passage?",
    options: [
      "Optical character recognition.",
      "Automatic summarization.",
      "Speech recognition.",
      "Grammatical error correction.",
    ],
    answer: 2,
    explanation:
      "음성 인식은 텍스트를 음성으로 바꾸는 것과 반대되는 작업이라고 지문이 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-ai-v2-102",
    topic: "ai",
    passageId: "ai-cnn-p6",
    prompt:
      "Why is full connectivity wasteful for image recognition, per the passage?",
    options: [
      "It requires zero weights for any input image.",
      "It ignores the spatial structure of data, treating distant and nearby pixels the same way.",
      "It only works for audio signals, never images.",
      "It automatically reduces the number of weights to one.",
    ],
    answer: 1,
    explanation:
      "완전연결은 이미지의 공간적 구조를 무시하고 멀리 떨어진 픽셀과 가까운 픽셀을 동일하게 취급해 낭비가 크다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-093",
    topic: "ai",
    passageId: "ai-rl-p5",
    prompt:
      "What is one problem with the brute-force approach of sampling returns for every possible policy?",
    options: [
      "The number of policies can be large or infinite, and return variance may require many samples.",
      "It always finds the best policy instantly with zero samples.",
      "It works only for continuous action spaces.",
      "It eliminates the need for value function estimation.",
    ],
    answer: 0,
    explanation:
      "정책 수가 많거나 무한할 수 있고 보상의 분산이 커서 많은 샘플이 필요하다는 문제가 있다고 지문이 설명합니다.",
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
  {
    id: "dad-ai-v2-084",
    topic: "ai",
    passageId: "ai-transformer-p4",
    prompt:
      "What problem limited recurrent neural networks before transformers, according to the passage?",
    options: [
      "The vanishing-gradient problem left the model without precise information about preceding tokens.",
      "RNNs had no way to represent any sequence at all.",
      "RNNs could only process images, never text.",
      "RNNs were invented after transformers and thus irrelevant.",
    ],
    answer: 0,
    explanation:
      "기울기 소실 문제 때문에 긴 문장 끝에서 이전 토큰에 대한 정확한 정보를 유지하기 어려웠다고 지문이 설명합니다.",
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
    id: "dad-ai-v2-091",
    topic: "ai",
    passageId: "ai-rl-p3",
    prompt:
      "What happens when an agent has only partial observability of the environment's state?",
    options: [
      "The problem must be formulated as a partially observable Markov decision process.",
      "The problem becomes impossible to formulate at all.",
      "The agent automatically gains full observability.",
      "The set of available actions becomes infinite.",
    ],
    answer: 0,
    explanation:
      "부분 관찰 가능성이 있으면 문제를 부분관찰 마르코프 결정 과정으로 정형화해야 한다고 지문이 설명합니다.",
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
    id: "dad-ai-v2-112",
    topic: "ai",
    passageId: "ai-backprop-p8",
    prompt:
      "How did David E. Rumelhart come to develop backpropagation around 1982, per the passage?",
    options: [
      "He copied it directly from Frank Rosenblatt's 1962 work.",
      "He developed it independently, without citing previous work because he was unaware of it.",
      "He developed it together with Paul Werbos as co-authors.",
      "He never published any paper about it.",
    ],
    answer: 1,
    explanation:
      "Rumelhart는 이전 연구를 알지 못한 채 독립적으로 역전파를 개발했다고 지문이 설명합니다.",
    difficulty: 2,
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
    id: "dad-ai-v2-135",
    topic: "ai",
    passageId: "ai-alignment-p7",
    prompt:
      "What did the 2023 statement signed by AI researchers and CEOs emphasize, per the passage?",
    options: [
      "AI extinction risk should be completely ignored by policymakers.",
      "Only pandemics deserve global priority, not AI.",
      "Human cognitive abilities are irrelevant to AI risk.",
      "Mitigating the risk of extinction from AI should be a global priority alongside other societal risks.",
    ],
    answer: 3,
    explanation:
      "2023년 성명은 AI로 인한 멸종 위험 완화를 다른 사회적 위험과 함께 세계적 우선순위로 삼아야 한다고 강조했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-097",
    topic: "ai",
    passageId: "ai-cnn-p1",
    prompt:
      "What technique does a CNN use to learn features, according to the passage?",
    options: [
      "Filter (or kernel) optimization.",
      "Manual rule writing by human experts.",
      "Random guessing with no training data.",
      "Only symbolic if-then reasoning.",
    ],
    answer: 0,
    explanation:
      "CNN은 필터(커널) 최적화를 통해 특징을 학습하는 순전파 신경망이라고 지문이 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-ai-v2-120",
    topic: "ai",
    passageId: "ai-gan-p8",
    prompt:
      "Which application of GANs does the passage mention involving a person's voice?",
    options: [
      "Translating speech directly into another spoken language.",
      "Detecting fraudulent bank transactions.",
      "Reconstructing an image of a person's face after listening to their voice.",
      "Playing board games such as Go.",
    ],
    answer: 2,
    explanation:
      "GAN은 사람의 목소리를 들은 뒤 그 사람의 얼굴 이미지를 재구성하는 데 사용될 수 있다고 지문이 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-133",
    topic: "ai",
    passageId: "ai-alignment-p5",
    prompt:
      "What is specification gaming or reward hacking, according to the passage?",
    options: [
      "AI systems that never deviate from designer intentions.",
      "A method that eliminates the need for any objective function.",
      "A guarantee that AI always maximizes true human welfare.",
      "AI systems finding loopholes to achieve a specified objective in unintended, possibly harmful ways.",
    ],
    answer: 3,
    explanation:
      "명세 게이밍 또는 보상 해킹은 AI가 의도치 않은 방식으로 허점을 찾아 지정된 목표를 달성하는 현상이라고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-098",
    topic: "ai",
    passageId: "ai-cnn-p2",
    prompt:
      "What three layer types make up a convolutional neural network, per the passage?",
    options: [
      "Only convolutional layers with nothing else.",
      "An input layer, hidden layers, and an output layer.",
      "A single dense layer repeated many times.",
      "An encoder and a decoder only.",
    ],
    answer: 1,
    explanation:
      "CNN은 입력층, 은닉층, 출력층으로 구성되며 은닉층에는 합성곱을 수행하는 층이 포함된다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-ai-v2-139",
    topic: "ai",
    passageId: "ai-agi-p3",
    prompt:
      "In what paper did Alan Turing propose the Turing test, per the passage?",
    options: [
      "A 2017 paper about transformers.",
      "A paper he never actually published.",
      "A joint paper with John McCarthy.",
      'His 1950 paper "Computing Machinery and Intelligence."',
    ],
    answer: 3,
    explanation:
      "튜링 테스트는 앨런 튜링이 1950년 논문 'Computing Machinery and Intelligence'에서 제안했다고 지문이 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-ai-v2-129",
    topic: "ai",
    passageId: "ai-alignment-p1",
    prompt: "What does AI alignment aim to do, according to the passage?",
    options: [
      "Ensure AI systems always ignore human instructions.",
      "Prevent any AI system from ever being deployed.",
      "Steer AI systems toward a person's or group's intended goals, preferences, or ethical principles.",
      "Guarantee that AI systems never use proxy goals.",
    ],
    answer: 2,
    explanation:
      "정렬은 AI 시스템을 사람이나 집단이 의도한 목표, 선호, 윤리 원칙 쪽으로 이끄는 것을 목표로 한다고 지문이 설명합니다.",
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
    id: "dad-ai-v2-114",
    topic: "ai",
    passageId: "ai-gan-p2",
    prompt:
      "What advantage does the passage say GANs have compared to fully visible belief networks like WaveNet?",
    options: [
      "GANs cannot generate any samples at all.",
      "GANs require more passes through the network than autoregressive models.",
      "GANs can generate one complete sample in one pass, rather than multiple passes.",
      "GANs are never asymptotically consistent.",
    ],
    answer: 2,
    explanation:
      "완전 가시적 신념망과 달리 GAN은 여러 번의 패스가 아니라 한 번의 패스로 완전한 샘플을 생성할 수 있다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-ai-v2-126",
    topic: "ai",
    passageId: "ai-nlp-p6",
    prompt:
      "What is a major drawback of statistical NLP methods, according to the passage?",
    options: [
      "They require no data at all to function.",
      "They cannot be replaced by any other method.",
      "They require elaborate feature engineering.",
      "They were invented after neural network methods.",
    ],
    answer: 2,
    explanation:
      "통계적 방법의 큰 단점은 정교한 특징 공학을 필요로 한다는 점이라고 지문이 설명합니다.",
    difficulty: 2,
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
    id: "dad-ai-v2-089",
    topic: "ai",
    passageId: "ai-rl-p1",
    prompt:
      "What is reinforcement learning concerned with, according to the passage?",
    options: [
      "How an intelligent agent should take actions in a dynamic environment to maximize a reward signal.",
      "How to label training data with expected answers for classification.",
      "How to cluster unlabeled data into hidden groups.",
      "How to translate text between two human languages.",
    ],
    answer: 0,
    explanation:
      "강화학습은 지능적인 에이전트가 동적 환경에서 보상 신호를 최대화하도록 행동을 선택하는 방법을 다룬다고 설명합니다.",
    difficulty: 1,
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
    id: "dad-ai-v2-104",
    topic: "ai",
    passageId: "ai-cnn-p8",
    prompt:
      "How can more training examples affect overfitting, according to the passage?",
    options: [
      "More training examples always increase overfitting without exception.",
      "Providing a convolutional network with more training examples can reduce overfitting.",
      "Training examples have no relationship to overfitting at all.",
      "Overfitting can only be fixed by removing all training data.",
    ],
    answer: 1,
    explanation:
      "학습 예제를 더 많이 제공하면 과적합을 줄일 수 있다고 지문이 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-ai-v2-105",
    topic: "ai",
    passageId: "ai-backprop-p1",
    prompt: "What is backpropagation, according to the passage?",
    options: [
      "A method for generating random weights with no training involved.",
      "A gradient computation method commonly used for training a neural network.",
      "A way to compress images without any neural network.",
      "A technique used only for reinforcement learning agents.",
    ],
    answer: 1,
    explanation:
      "역전파는 신경망을 학습시켜 매개변수 갱신을 계산하는 데 흔히 쓰이는 기울기 계산 방법이라고 지문이 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-ai-v2-099",
    topic: "ai",
    passageId: "ai-cnn-p3",
    prompt: "What did Hubel and Wiesel's work in the 1950s and 1960s show?",
    options: [
      "Cats cannot process any visual information at all.",
      "Cat visual cortex neurons individually respond to small regions of the visual field.",
      "Neural networks were first invented by Hubel and Wiesel.",
      "Receptive fields only exist in computer vision, not biology.",
    ],
    answer: 1,
    explanation:
      "Hubel과 Wiesel의 연구는 고양이 시각피질의 뉴런이 시각장의 작은 영역에 개별적으로 반응함을 보였다고 지문이 설명합니다.",
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
