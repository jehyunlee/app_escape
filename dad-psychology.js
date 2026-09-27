import sourceData from "./assets/wikipedia/psychology-sources.json" with { type: "json" };

const passageById = new Map(
  sourceData.passages.map((passage) => [passage.id, passage]),
);
const articleById = new Map(
  sourceData.articles.map((article) => [article.id, article]),
);

const questionSpecs = [
  {
    id: "dad-psychology-v2-111",
    passageId: "psychology-behaviorism-p7",
    prompt:
      "What did B. F. Skinner propose in 1945, forming the basis for radical behaviorism?",
    options: [
      "Only observable behavior exists; cognition and emotion do not exist.",
      "Behaviorism should be entirely replaced by psychoanalysis.",
      "Covert behavior, including cognition and emotions, are subject to the same controlling variables as observable behavior.",
      "Covert behavior cannot be studied scientifically at all.",
    ],
    answer: 2,
    explanation:
      "지문은 1945년 스키너가 인지와 감정을 포함한 은밀한 행동도 관찰 가능한 행동과 같은 통제 변인의 지배를 받는다고 제안했으며 이것이 급진적 행동주의의 토대가 되었다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-034",
    passageId: "psychology-attachment-theory-p2",
    prompt:
      "Who developed attachment theory, and what did it posit infants need?",
    options: [
      "B. F. Skinner; infants need reinforcement schedules only.",
      "John Bowlby; infants need a close relationship with at least one primary caregiver.",
      "Mary Ainsworth; infants need no close relationships at all.",
      "Sigmund Freud; infants need only physical nourishment.",
    ],
    answer: 1,
    explanation:
      "지문은 정신과 의사이자 정신분석가인 존 볼비가 이론을 발전시켰으며 영아가 생존과 건강한 사회정서적 기능을 위해 적어도 한 명의 주 양육자와 가까운 관계를 형성해야 한다고 주장했다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-119",
    passageId: "psychology-psychoanalysis-p7",
    prompt: "What triggers resistance in the ego, per the passage?",
    options: [
      "Attempts to strengthen the superego alone.",
      "Attempts to increase reinforcement schedules.",
      "Attempts to integrate repressed drives into conscious perception.",
      "Attempts to ignore all unconscious material entirely.",
    ],
    answer: 2,
    explanation:
      "지문은 억압된 것을 자아의 의식적 지각으로 통합하려는 시도가 저항을 촉발한다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-139",
    passageId: "psychology-intelligence-quotient-p3",
    prompt: "What factors have IQ scores been shown to be associated with?",
    options: [
      "Only the color of one's eyes.",
      "Only the day of the week a person was born.",
      "Nutrition, parental socioeconomic status, morbidity and mortality, and perinatal environment.",
      "Only astrological birth sign.",
    ],
    answer: 2,
    explanation:
      "지문은 IQ 점수가 영양, 부모의 사회경제적 지위, 이환율과 사망률, 부모의 사회적 지위, 출생 전후 환경 같은 요인과 관련이 있다고 밝혀졌다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-004",
    passageId: "psychology-cognitive-psychology-p4",
    prompt: "What did Plato suggest in 387 BCE according to the passage?",
    options: [
      "The heart was the seat of mental processes.",
      "Mental processes could not be studied philosophically.",
      "The body and mind were a single indivisible substance.",
      "The brain was the seat of mental processes.",
    ],
    answer: 3,
    explanation:
      "지문은 기원전 387년 플라톤이 뇌가 정신 과정의 자리라고 제안했다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-099",
    passageId: "psychology-social-psychology-p3",
    prompt:
      "When did social psychology begin to emerge from the larger field of psychology?",
    options: [
      "In ancient Greece.",
      "It never emerged as a separate field.",
      "In the 19th century.",
      "In the 21st century.",
    ],
    answer: 2,
    explanation:
      "지문은 19세기에 사회심리학이 더 큰 심리학 분야에서 갈라져 나오기 시작했다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-048",
    passageId: "psychology-cognitive-dissonance-p8",
    prompt:
      "Which strategy is confirmation bias listed as, in the ways people justify stressful behavior?",
    options: [
      "Deliberately seeking out all contradictory information.",
      "A strategy unrelated to justifying stressful behavior.",
      "A method of increasing psychological dissonance intentionally.",
      "Avoiding circumstances and contradictory information likely to increase dissonance.",
    ],
    answer: 3,
    explanation:
      "지문은 확증 편향을 부조화를 키울 만한 상황과 모순되는 정보를 피하는 것으로, 스트레스를 받는 행동을 정당화하는 한 방법이라고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-021",
    passageId: "psychology-operant-conditioning-p5",
    prompt:
      "How does operant conditioning differ from classical conditioning according to the passage?",
    options: [
      "Classical conditioning produces involuntary reflexive behaviors, while operant conditioning shapes voluntary behaviors through consequences.",
      "Both produce only involuntary reflexive behaviors.",
      "Both shape voluntary behaviors in the same way.",
      "Classical conditioning shapes voluntary behavior, and operant conditioning is reflexive.",
    ],
    answer: 0,
    explanation:
      "지문은 고전적 조건형성이 비자발적 반사 행동을 만들고 조작적 조건형성은 결과를 통해 자발적 행동을 형성한다고 구분합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-011",
    passageId: "psychology-classical-conditioning-p3",
    prompt:
      "Who studied classical conditioning with dogs and published results in 1897?",
    options: [
      "B. F. Skinner, the American behaviorist.",
      "Sigmund Freud, the Austrian neurologist.",
      "Ivan Pavlov, the Russian physiologist.",
      "Edward Thorndike, the American psychologist.",
    ],
    answer: 2,
    explanation:
      "지문은 러시아 생리학자 이반 파블로프가 개를 이용한 실험으로 고전적 조건형성을 연구해 1897년에 결과를 발표했다고 말합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-037",
    passageId: "psychology-attachment-theory-p5",
    prompt: "What do children use attachment figures as, as they grow?",
    options: [
      "A secure base from which to explore the world and return to for comfort.",
      "An obstacle to avoid while exploring the world.",
      "A source of punishment for exploration.",
      "A resource used only for feeding, with no emotional role.",
    ],
    answer: 0,
    explanation:
      "지문은 아이들이 자라면서 애착 대상을 세상을 탐색하고 위안을 위해 돌아오는 안전 기지로 사용한다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-128",
    passageId: "psychology-neuropsychology-p8",
    prompt:
      "When was the International Neuropsychological Society established, and what followed?",
    options: [
      "1980; the society was established after the textbook.",
      "1949; alongside Organization of Behavior.",
      "1962; alongside Higher Cortical Functions in Man.",
      "1967; the first defining textbook, Fundamentals of Human Neuropsychology, was published in 1980.",
    ],
    answer: 3,
    explanation:
      "지문은 국제신경심리학회가 1967년에 설립되었고 이 분야를 정의한 첫 교과서인 인간 신경심리학의 기초가 1980년 콜브와 위쇼에 의해 처음 출간되었다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-029",
    passageId: "psychology-working-memory-p5",
    prompt: "What is short-term memory defined as in the passage?",
    options: [
      "The ability to remember information over a brief period, on the order of seconds.",
      "The ability to remember information permanently.",
      "The ability to manipulate visual images only.",
      "The ability to forget information instantly.",
    ],
    answer: 0,
    explanation:
      "지문은 단기기억을 초 단위의 짧은 시간 동안 정보를 기억하는 능력이라고 정의합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-131",
    passageId: "psychology-positive-psychology-p3",
    prompt: "What movement does positive psychology build on, per the passage?",
    options: [
      "The psychoanalytic movement of Freud and Lacan.",
      "The cognitive revolution of the late 20th century.",
      "The humanistic movement of Abraham Maslow and Carl Rogers.",
      "The behaviorist movement of Watson and Skinner.",
    ],
    answer: 2,
    explanation:
      "지문은 긍정심리학이 행복, 웰빙, 목적에 대한 강조를 장려하는 에이브러햄 매슬로와 칼 로저스의 인본주의 운동을 토대로 한다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-141",
    passageId: "psychology-intelligence-quotient-p5",
    prompt: "For what purposes have IQ scores been used, per the passage?",
    options: [
      "Educational placement, assessment of intellectual ability, and evaluating job applicants.",
      "Only for determining criminal sentences.",
      "Only for assigning political party membership.",
      "Only for choosing sports team rosters.",
    ],
    answer: 0,
    explanation:
      "지문은 IQ 점수가 교육 배치, 지적 능력 평가, 구직자 평가에 사용되어 왔다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-077",
    passageId: "psychology-milgram-experiment-p5",
    prompt:
      "When and where did the experiments begin, relative to the Eichmann trial?",
    options: [
      "August 1961 at Yale University, three months after the Eichmann trial began.",
      "August 1961, five years before the Eichmann trial.",
      "In 1974, long after the Eichmann trial ended.",
      "At Yale University in the 1950s, before any trial.",
    ],
    answer: 0,
    explanation:
      "지문은 실험이 1961년 8월 예일 대학교에서 아이히만 재판이 시작된 지 3개월 후에 시작되었다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-017",
    passageId: "psychology-operant-conditioning-p1",
    prompt: "How is operant conditioning described in the passage?",
    options: [
      "A learning process where voluntary behaviors are modified by reward or aversive stimuli.",
      "A learning process limited only to involuntary reflexes.",
      "A process where behavior cannot be changed by consequences.",
      "A process identical to classical conditioning in every way.",
    ],
    answer: 0,
    explanation:
      "지문은 조작적 조건형성을 보상이나 혐오 자극의 추가·제거와 연합해 자발적 행동이 변화하는 학습 과정이라고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-058",
    passageId: "psychology-placebo-p2",
    prompt:
      "What is the difference between placebo response and placebo effect?",
    options: [
      "Placebo response occurs only outside clinical trials.",
      "Placebo response is the change in the control group; placebo effect is the difference between that and no treatment.",
      "They are exactly the same thing with no distinction.",
      "Placebo effect refers only to negative outcomes.",
    ],
    answer: 1,
    explanation:
      "지문은 대조군에서 나타나는 변화를 플라시보 반응이라 하고 그것과 무치료 결과의 차이를 플라시보 효과라고 구분합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-026",
    passageId: "psychology-working-memory-p2",
    prompt:
      "How do some theorists distinguish working memory from short-term memory?",
    options: [
      "Working memory only applies to visual information, not verbal.",
      "Working memory allows manipulation of stored information, while short-term memory only refers to short-term storage.",
      "Short-term memory allows manipulation, while working memory only stores information.",
      "The two terms describe entirely unrelated systems with no overlap.",
    ],
    answer: 1,
    explanation:
      "지문은 일부 이론가들이 작업기억은 저장된 정보의 조작을 가능하게 하고 단기기억은 단순히 짧은 저장만을 의미한다고 구분한다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-040",
    passageId: "psychology-attachment-theory-p8",
    prompt: "Despite criticism, what has attachment theory become?",
    options: [
      "A minor theory with no lasting influence.",
      "A theory rejected entirely by modern psychology.",
      "A theory used only in animal studies.",
      "A dominant approach to understanding early social development that has generated extensive research.",
    ],
    answer: 3,
    explanation:
      "지문은 학계의 오랜 비판에도 불구하고 애착 이론이 초기 사회 발달을 이해하는 지배적인 접근법이 되어 방대한 연구를 낳았다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-132",
    passageId: "psychology-positive-psychology-p4",
    prompt:
      "What Western philosophical concept does positive psychology largely rely on?",
    options: [
      "The Cartesian concept of mind-body dualism.",
      "The Platonic concept of the ideal forms.",
      "The Stoic concept of apatheia.",
      "The Aristotelian concept of eudaimonia.",
    ],
    answer: 3,
    explanation:
      "지문은 긍정심리학이 영어로 flourishing, the good life, happiness로 번역되는 아리스토텔레스의 에우다이모니아 개념 같은 서양 철학 전통에 크게 의존한다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-013",
    passageId: "psychology-classical-conditioning-p5",
    prompt:
      "What differentiates classical conditioning from other forms of associative learning?",
    options: [
      "The contingencies whereby learning occurs.",
      "The species of animal used in the experiment.",
      "The country where the experiment was conducted.",
      "The number of researchers involved.",
    ],
    answer: 0,
    explanation:
      "지문은 고전적 조건형성과 다른 연합 학습을 구별해주는 핵심 요소로 학습이 일어나는 contingencies(수반 관계)를 꼽습니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-135",
    passageId: "psychology-positive-psychology-p7",
    prompt:
      "What key principles focus on the positive aspects of human experience, per the passage?",
    options: [
      "An approach that ignores individual differences entirely.",
      "An approach focused solely on medication.",
      "A strengths-based approach identifying individual strengths like optimism, resilience, and gratitude.",
      "A deficits-based approach identifying individual weaknesses only.",
    ],
    answer: 2,
    explanation:
      "지문은 종교적 헌신과 영적 수행도 웰빙 증대의 원천일 수 있으며 낙관성, 회복탄력성, 감사 같은 개인의 강점을 확인하는 강점 기반 접근이 핵심 원칙이라고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-061",
    passageId: "psychology-placebo-p5",
    prompt:
      "What do modern studies find about placebos, according to the passage?",
    options: [
      "They can affect outcomes such as pain and nausea, but otherwise lack important clinical effects.",
      "They have no effect on any outcome whatsoever.",
      "They cure the underlying disease directly.",
      "They only became known in the 20th century with no earlier history.",
    ],
    answer: 0,
    explanation:
      "지문은 현대 연구가 플라시보가 통증이나 메스꺼움 같은 결과에는 영향을 줄 수 있지만 그 외에는 대체로 중요한 임상 효과가 없다고 밝힌다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-102",
    passageId: "psychology-social-psychology-p6",
    prompt:
      "According to Wolfgang Stroebe, when did modern social psychology begin, and with what publication?",
    options: [
      "1963, with Milgram's journal article.",
      "1924, with Floyd Allport's classic textbook defining the field as the experimental study of social behavior.",
      "1898, with Triplett's experiment.",
      "1964, with the Genovese murder reports.",
    ],
    answer: 1,
    explanation:
      "지문은 볼프강 슈트로베에 따르면 현대 사회심리학이 1924년 플로이드 올포트의 고전적 교과서 발간과 함께 시작되었으며 그 분야를 사회적 행동의 실험 연구로 정의했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-019",
    passageId: "psychology-operant-conditioning-p3",
    prompt:
      "What did behavioral psychologists who studied operant conditioning in the 20th century believe?",
    options: [
      "Only genetics explains behavior, not environment.",
      "Operant conditioning applies only to humans, not animals.",
      "Much of mind and behaviour is explained through environmental conditioning.",
      "Mind and behavior cannot be explained by environmental factors at all.",
    ],
    answer: 2,
    explanation:
      "지문은 20세기 행동주의 심리학자들이 마음과 행동의 많은 부분이 환경적 조건형성으로 설명된다고 믿었다고 말합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-095",
    passageId: "psychology-developmental-psychology-p7",
    prompt:
      "What do ongoing studies in developmental psychology aim to understand, despite certain limitations?",
    options: [
      "Only historical trends with no current relevance.",
      "Nothing further, since the field has reached final conclusions.",
      "How life stage transitions and biological factors influence human behavior and development.",
      "Only how to eliminate all biological influence on behavior.",
    ],
    answer: 2,
    explanation:
      "지문은 발달심리학 연구에 일정한 한계가 있음에도 생애 단계 전환과 생물학적 요인이 인간 행동과 발달에 미치는 영향을 이해하려 한다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-127",
    passageId: "psychology-neuropsychology-p7",
    prompt:
      "What was the first book with the word neuropsychology in the title, and when was it published?",
    options: [
      "Fundamentals of Human Neuropsychology, published in 1962.",
      "Attachment and Loss, published in 1967.",
      "Organization of Behavior - A Neuropsychological Theory, published in 1949.",
      "Higher Cortical Functions in Man, published in 1949.",
    ],
    answer: 2,
    explanation:
      "지문은 제목에 신경심리학이라는 단어가 들어간 첫 책이 1949년 출간된 행동의 조직화 - 신경심리학 이론이라고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-138",
    passageId: "psychology-intelligence-quotient-p2",
    prompt: "What are modern IQ test raw scores transformed to?",
    options: [
      "A percentage scale from 0 to 10.",
      "A normal distribution with mean 100 and standard deviation 15.",
      "A distribution with mean 50 and standard deviation 5.",
      "A fixed score of exactly 100 for everyone.",
    ],
    answer: 1,
    explanation:
      "지문은 현대 IQ 검사에서 원점수가 평균 100, 표준편차 15인 정규분포로 변환된다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-124",
    passageId: "psychology-neuropsychology-p4",
    prompt:
      "To what fields has the term neuropsychology been applied, per the passage?",
    options: [
      "Only studies of plant biology.",
      "Only studies unrelated to any nervous system.",
      "Only purely mathematical models with no biological basis.",
      "Lesion studies in humans and animals, sharing concerns with neuropsychiatry and behavioral neurology.",
    ],
    answer: 3,
    explanation:
      "지문은 신경심리학이라는 용어가 인간과 동물의 병변 연구에 적용되었으며 신경정신의학, 행동신경학 전반과 개념과 관심사를 공유한다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-062",
    passageId: "psychology-placebo-p6",
    prompt: "What is regression to the mean, as described in the passage?",
    options: [
      "A clinical effect that only placebos can produce.",
      "A statistical effect where an unusually extreme measurement is likely to be followed by a less extreme one.",
      "A statistical effect where measurements always get more extreme over time.",
      "A phenomenon unrelated to any measurement.",
    ],
    answer: 1,
    explanation:
      "지문은 평균으로의 회귀를 유난히 극단적인 측정값 뒤에는 덜 극단적인 값이 뒤따르기 쉬운 통계적 효과라고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-051",
    passageId: "psychology-big-five-personality-traits-p3",
    prompt:
      "Why are 'hard-working', 'prepared', and 'messy' grouped under conscientiousness?",
    options: [
      "Because they are grouped alphabetically.",
      "Because they all describe extraversion instead.",
      "Because someone described as hard-working is more likely to be prepared and less likely to be messy.",
      "Because these three words have no statistical relationship.",
    ],
    answer: 2,
    explanation:
      "지문은 성실한 사람이 준비성 있다고 묘사될 가능성이 높고 지저분하다고 묘사될 가능성은 낮기 때문에 이 세 단어가 성실성 아래 묶인다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-133",
    passageId: "psychology-positive-psychology-p5",
    prompt:
      "What do positive psychologists empirically study, according to the passage?",
    options: [
      "The conditions and processes that contribute to flourishing, subjective well-being, and happiness.",
      "Only clinical diagnoses of mental disorders.",
      "Only economic indicators of national wealth.",
      "Only physical fitness levels.",
    ],
    answer: 0,
    explanation:
      "지문은 긍정심리학자들이 종종 이 용어들을 같은 뜻으로 사용하며 번영, 주관적 웰빙, 행복에 기여하는 조건과 과정을 경험적으로 연구한다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-078",
    passageId: "psychology-milgram-experiment-p6",
    prompt: "What question did Milgram devise his study to answer?",
    options: [
      "Whether Yale students are more obedient than the general public.",
      "Whether Eichmann and his accomplices could validly claim they were just following orders.",
      "Whether electric shocks are physically harmful.",
      "Whether memory improves under punishment.",
    ],
    answer: 1,
    explanation:
      "지문은 밀그램이 아이히만과 그 공범들이 그저 명령을 따랐을 뿐이라는 주장이 타당한지 답하기 위해 연구를 고안했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-115",
    passageId: "psychology-psychoanalysis-p3",
    prompt: "What did Jacques Lacan describe his approach as?",
    options: [
      "A purely behaviorist method with no reference to Freud.",
      "An approach unrelated to any language structure.",
      "A retour à Freud (return to Freud), examining the language-like structure of the unconscious.",
      "A complete rejection of Freud's theories.",
    ],
    answer: 2,
    explanation:
      "지문은 자크 라캉이 자신의 접근을 프로이트로의 회귀라고 불렀으며 무의식의 언어 같은 구조를 탐구했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-056",
    passageId: "psychology-big-five-personality-traits-p8",
    prompt: "What hypothesis did the Big Five model originate from?",
    options: [
      "The hypothesis that personality is entirely genetic with no linguistic basis.",
      "The hypothesis that personality traits cannot be described in words.",
      "The hypothesis that only clinical patients have measurable traits.",
      "The lexical hypothesis, that the most important personality traits are encoded in language.",
    ],
    answer: 3,
    explanation:
      "지문은 Big Five 모델이 가장 중요한 성격 특성이 언어에 담겨 있다고 보는 어휘 가설에서 비롯되었다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-025",
    passageId: "psychology-working-memory-p1",
    prompt: "What does the passage say working memory is?",
    options: [
      "A cognitive system with limited capacity that holds information temporarily.",
      "A permanent storage system with unlimited capacity.",
      "A system used only for storing motor skills.",
      "A system unrelated to reasoning or decision-making.",
    ],
    answer: 0,
    explanation:
      "지문은 작업기억을 정보를 일시적으로 담아둘 수 있는 제한된 용량의 인지 체계라고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-064",
    passageId: "psychology-placebo-p8",
    prompt:
      "What can placebos affect, according to the passage, even though they have no impact on the disease itself?",
    options: [
      "The underlying pathogen causing the disease.",
      "The genetic structure of the patient.",
      "Nothing at all; placebos have zero effect on anything.",
      "How patients perceive their condition and the body's chemical processes for relieving pain.",
    ],
    answer: 3,
    explanation:
      "지문은 플라시보가 질병 자체에는 영향을 주지 않지만 환자가 자신의 상태를 지각하는 방식과 통증 완화를 위한 신체의 화학적 과정에 영향을 줄 수 있다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-103",
    passageId: "psychology-social-psychology-p7",
    prompt:
      "What were social psychologists mostly concerned with during World War II?",
    options: [
      "Studies of workplace ergonomics.",
      "Studies of animal behavior in zoos.",
      "Studies of persuasion and propaganda for the U.S. military.",
      "Studies of childhood attachment.",
    ],
    answer: 2,
    explanation:
      "지문은 제2차 세계대전 동안 사회심리학자들이 주로 미군을 위한 설득과 선전 연구에 관심을 가졌다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-018",
    passageId: "psychology-operant-conditioning-p2",
    prompt: "Whose law of effect theory originated operant conditioning?",
    options: [
      "John Bowlby's.",
      "Edward Thorndike's.",
      "Ivan Pavlov's.",
      "Sigmund Freud's.",
    ],
    answer: 1,
    explanation:
      "지문은 조작적 조건형성이 에드워드 손다이크의 효과의 법칙 이론에서 비롯되었다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-009",
    passageId: "psychology-classical-conditioning-p1",
    prompt: "What is classical conditioning described as pairing?",
    options: [
      "A biologically potent stimulus with a neutral stimulus.",
      "Two neutral stimuli with no biological effect.",
      "A reward with a punishment simultaneously.",
      "A voluntary behavior with a fixed schedule.",
    ],
    answer: 0,
    explanation:
      "지문은 고전적 조건형성을 생물학적으로 강한 자극과 중립 자극을 짝짓는 행동 절차라고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-023",
    passageId: "psychology-operant-conditioning-p7",
    prompt:
      "How could a cat escape the puzzle box, and how long did it initially take?",
    options: [
      "It could not escape at all in any trial.",
      "By waiting passively without any action.",
      "By a simple response like pulling a cord, but it took a long time when first constrained.",
      "By a complex sequence of actions that it performed instantly.",
    ],
    answer: 2,
    explanation:
      "지문은 고양이가 줄을 당기거나 막대를 미는 단순한 반응으로 탈출할 수 있었지만 처음 갇혔을 때는 탈출까지 오래 걸렸다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-117",
    passageId: "psychology-psychoanalysis-p5",
    prompt:
      "What were the first two insults to mankind, according to the passage?",
    options: [
      "Copernicus's discovery that Earth revolves around the Sun, and Darwin's discovery that humans evolved from apes.",
      "Freud's own two earlier papers.",
      "Watson's and Skinner's behaviorist claims.",
      "Two unrelated discoveries in chemistry.",
    ],
    answer: 0,
    explanation:
      "지문은 첫 번째 모욕이 지구가 태양 주위를 돈다는 코페르니쿠스의 우주적 발견이고 두 번째는 인간이 유인원에서 진화했다는 다윈의 생물학적 발견이라고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-085",
    passageId: "psychology-bystander-effect-p5",
    prompt:
      "What has recent research using security camera footage focused on questioning?",
    options: [
      "The coherence and robustness of the bystander effect in real-world events.",
      "Whether security cameras themselves cause the effect.",
      "Only the legal admissibility of camera footage.",
      "The invention of new camera technology.",
    ],
    answer: 0,
    explanation:
      "지문은 보안 카메라에 담긴 실제 사건을 활용한 최근 연구가 방관자 효과의 일관성과 견고함에 의문을 제기했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-074",
    passageId: "psychology-milgram-experiment-p2",
    prompt: "What did participants believe they were doing in the experiment?",
    options: [
      "Observing a video with no active participation.",
      "Administering electric shocks to a 'learner' that gradually increased to fatal-seeming levels.",
      "Receiving electric shocks themselves from a machine.",
      "Teaching a lesson with no shocks involved at all.",
    ],
    answer: 1,
    explanation:
      "지문은 참가자들이 학습자에게 전기 충격을 가하고 있다고 믿었으며 그 충격이 실제였다면 치명적이었을 수준까지 점점 커졌다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-014",
    passageId: "psychology-classical-conditioning-p6",
    prompt:
      "What did classical conditioning become the foundation of, together with operant conditioning?",
    options: [
      "Neuropsychology, founded in the 1940s.",
      "Behaviorism, a dominant school of psychology in the mid-20th century.",
      "Psychoanalysis, founded by Freud in the 1890s.",
      "Positive psychology, founded in 1998.",
    ],
    answer: 1,
    explanation:
      "지문은 고전적 조건형성이 조작적 조건형성과 함께 20세기 중반 지배적이었던 행동주의의 토대가 되었다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-054",
    passageId: "psychology-big-five-personality-traits-p6",
    prompt: "What did research into personality inventories find?",
    options: [
      "Personality inventories cannot detect subfactors.",
      "Five broad dimensions could explain most variation in human personality and temperament.",
      "No dimensions could explain any variation in personality.",
      "Only one dimension explains all personality variation.",
    ],
    answer: 1,
    explanation:
      "지문은 성격 검사 연구가 다섯 가지 넓은 차원이 인간 성격과 기질의 대부분 변이를 설명할 수 있음을 발견했다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-080",
    passageId: "psychology-milgram-experiment-p8",
    prompt: "What did the experimenter tell participants they were part of?",
    options: [
      "A study of political opinions with no learning component.",
      "A medical trial testing new drugs.",
      "A study of physical fitness under stress.",
      "A scientific study of memory and learning, examining the effect of punishment on memorization.",
    ],
    answer: 3,
    explanation:
      "지문은 실험자가 참가자들에게 처벌이 내용 암기 능력에 미치는 효과를 보기 위한 기억과 학습에 관한 과학적 연구에 참여하는 것이라고 말했다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-007",
    passageId: "psychology-cognitive-psychology-p7",
    prompt: "What did Paul Broca and Carl Wernicke each discover?",
    options: [
      "The same single brain area for all language functions.",
      "That language has no relation to brain areas.",
      "Brain areas responsible for language production and comprehension, respectively.",
      "Brain areas responsible only for memory storage.",
    ],
    answer: 2,
    explanation:
      "지문은 브로카가 언어 산출을 담당하는 뇌 영역을, 베르니케가 언어 이해를 담당하는 것으로 여겨지는 영역을 각각 발견했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-094",
    passageId: "psychology-developmental-psychology-p6",
    prompt: "Which ongoing debates are mentioned in the passage?",
    options: [
      "Debates that have all been fully resolved with no disagreement.",
      "Biological essentialism vs. neuroplasticity, and stages of development vs. dynamic systems.",
      "Only debates about which country funds more research.",
      "Only debates about statistical methods with no theoretical content.",
    ],
    answer: 1,
    explanation:
      "지문은 생물학적 본질주의 대 신경가소성, 발달 단계론 대 역동적 발달 체계론이라는 진행 중인 논쟁을 언급합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-002",
    passageId: "psychology-cognitive-psychology-p2",
    prompt: "What did cognitive psychology break away from in the 1960s?",
    options: [
      "Developmental psychology, which focused only on children.",
      "Behaviorism, which held that unobservable mental processes were outside empirical science.",
      "Psychoanalysis, which focused only on dreams.",
      "Neuropsychology, which focused only on brain lesions.",
    ],
    answer: 1,
    explanation:
      "지문은 인지심리학이 1960년대에 관찰 불가능한 정신 과정을 경험 과학의 영역 밖이라고 본 행동주의로부터 벗어나며 생겨났다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-031",
    passageId: "psychology-working-memory-p7",
    prompt:
      "In how many slightly different ways has working memory been defined, per the passage?",
    options: [
      "Five ways.",
      "One single fixed way.",
      "Three ways.",
      "Two ways.",
    ],
    answer: 2,
    explanation:
      "지문은 작업기억이 조금씩 다른 세 가지 방식으로 정의되어 왔다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-118",
    passageId: "psychology-psychoanalysis-p6",
    prompt:
      "Where does the structural model locate repressed drives, according to Freud?",
    options: [
      "Nowhere; Freud denied that repression exists.",
      "In the 'id', as a result of traumatic childhood experiences.",
      "In the 'superego', as a result of adult experiences.",
      "In the 'ego', with no relation to childhood.",
    ],
    answer: 1,
    explanation:
      "지문은 프로이트가 많은 욕동이 어린 시절의 외상적 경험의 결과로 억압되어 구조 모델에서 이드에 위치한다고 보았다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-068",
    passageId: "psychology-confirmation-bias-p4",
    prompt:
      "What does research on selective exposure suggest about individuals?",
    options: [
      "All people defend their attitudes with exactly equal strength.",
      "No one ever defends their existing attitudes.",
      "Selective exposure has no relation to attitude defense.",
      "People differ in how strongly they defend their attitudes against contrary information.",
    ],
    answer: 3,
    explanation:
      "지문은 선택적 노출 연구가 사람마다 자신의 태도에 반하는 정보를 얼마나 강하게 방어하는지가 다르다는 것을 시사한다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-022",
    passageId: "psychology-operant-conditioning-p6",
    prompt:
      "Whose puzzle-box experiments with cats first extensively studied operant conditioning?",
    options: [
      "John B. Watson's.",
      "Edward L. Thorndike's.",
      "Ivan Pavlov's.",
      "B. F. Skinner's.",
    ],
    answer: 1,
    explanation:
      "지문은 손다이크가 고양이가 직접 만든 퍼즐 상자에서 탈출하려는 행동을 관찰하며 조작적 조건형성을 처음 폭넓게 연구했다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-106",
    passageId: "psychology-behaviorism-p2",
    prompt:
      "What do behaviorists focus on primarily, despite accepting heredity's role?",
    options: [
      "Only unobservable mental states.",
      "Environmental events.",
      "Only genetic inheritance.",
      "Only unconscious drives.",
    ],
    answer: 1,
    explanation:
      "지문은 행동주의자들이 유전의 중요한 역할을 인정하면서도 주로 환경적 사건에 초점을 맞춘다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-075",
    passageId: "psychology-milgram-experiment-p3",
    prompt:
      "What percentage of participants went up to the full 450 volts in the first version of the study?",
    options: ["100%.", "300 volts only, never reaching 450.", "65%.", "0%."],
    answer: 2,
    explanation:
      "지문은 첫 번째 연구에서 모든 참가자가 300볼트까지 올라갔고 65%가 최대 450볼트까지 도달했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-032",
    passageId: "psychology-working-memory-p8",
    prompt:
      "Who described early ablation experiments on the prefrontal cortex mentioned in the passage?",
    options: [
      "Baddeley and Hitch.",
      "Atkinson and Shiffrin.",
      "Miller, Galanter, and Pribram.",
      "Hitzig and Ferrier.",
    ],
    answer: 3,
    explanation:
      "지문은 히치히와 페리어가 전전두피질의 절제 실험을 기술했다고 말합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-038",
    passageId: "psychology-attachment-theory-p6",
    prompt: "What did Mary Ainsworth's research introduce and identify?",
    options: [
      "A single universal attachment pattern with no variation.",
      "The concept of the 'secure base' and attachment patterns: secure, avoidant, anxious, and disorganized.",
      "Only the concept of operant conditioning.",
      "Only adult romantic attachment styles.",
    ],
    answer: 1,
    explanation:
      "지문은 메리 에인스워스의 연구가 안전 기지 개념을 도입하고 안정, 회피, 불안, 혼란 애착이라는 패턴을 확인했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-035",
    passageId: "psychology-attachment-theory-p3",
    prompt:
      "What do infants seek, especially during stressful situations, according to the passage?",
    options: [
      "Only physical objects rather than people.",
      "Novel strangers instead of caregivers.",
      "Proximity to attachment figures.",
      "Complete isolation from all figures.",
    ],
    answer: 2,
    explanation:
      "지문은 영아가 특히 스트레스 상황에서 애착 대상에게 가까이 있으려 한다는 관찰이 애착 이론의 핵심 측면이라고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-076",
    passageId: "psychology-milgram-experiment-p4",
    prompt: "In what works did Milgram describe his research?",
    options: [
      "Only a single 1974 magazine interview.",
      "A book co-authored with Sigmund Freud.",
      "Only oral lectures with no published writing.",
      "A 1963 article and his 1974 book, Obedience to Authority: An Experimental View.",
    ],
    answer: 3,
    explanation:
      "지문은 밀그램이 1963년 논문과 1974년 저서 권위에 대한 복종에서 자신의 연구를 설명했다고 말합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-136",
    passageId: "psychology-positive-psychology-p8",
    prompt:
      "What distinction does positive psychology make between two types of happiness?",
    options: [
      "Only a distinction between rich and poor happiness.",
      "Only a distinction between young and old happiness.",
      "No distinction; all happiness is treated identically.",
      "Hedonic (pleasure-seeking) and eudaemonic (purpose and fulfillment) happiness.",
    ],
    answer: 3,
    explanation:
      "지문은 긍정심리학이 쾌락 추구적인 쾌락적 행복과 목적과 성취를 지향하는 에우다이모닉 행복을 구분한다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-005",
    passageId: "psychology-cognitive-psychology-p5",
    prompt: "What did René Descartes posit in 1637?",
    options: [
      "Humans have innate ideas and mind-body dualism.",
      "The mind and body are a single unified substance.",
      "Mental processes come only from experience, not innate ideas.",
      "The brain has no role in mental processes.",
    ],
    answer: 0,
    explanation:
      "지문은 1637년 데카르트가 인간에게 타고난 관념이 있다고 주장하며 마음과 몸이 별개의 실체라는 심신 이원론을 내세웠다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-003",
    passageId: "psychology-cognitive-psychology-p3",
    prompt:
      "What disciplines did researchers come from when they used mental-processing models to explain behavior?",
    options: [
      "Only cybernetics and neurology.",
      "Only sociology and anthropology.",
      "Linguistics, cybernetics, and applied psychology.",
      "Only linguistics and economics.",
    ],
    answer: 2,
    explanation:
      "지문은 linguistics, cybernetics, applied psychology 연구자들이 정신 처리 모델을 사용해 인간 행동을 설명했다고 말합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-107",
    passageId: "psychology-behaviorism-p3",
    prompt:
      "What replaced behaviorism as an explanatory theory in the late 20th century?",
    options: [
      "Neuropsychology, which focuses only on brain lesions.",
      "Nothing replaced it; behaviorism remains dominant today.",
      "Cognitive psychology, which views internal mental states as explanations for behavior.",
      "Psychoanalysis, which focuses on childhood trauma.",
    ],
    answer: 2,
    explanation:
      "지문은 20세기 후반 인지 혁명이 내적 정신 상태를 관찰 가능한 행동의 설명으로 보는 인지심리학으로 행동주의를 대체했다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-044",
    passageId: "psychology-cognitive-dissonance-p4",
    prompt:
      "How do people typically try to resolve psychologically inconsistent actions or ideas?",
    options: [
      "By ignoring the inconsistency permanently without any resolution attempt.",
      "By seeking punishment for holding the inconsistent belief.",
      "By replacing both sides of the conflict entirely with new ideas.",
      "By automatically reframing a side to make the combination congruent.",
    ],
    answer: 3,
    explanation:
      "지문은 행동이나 생각이 심리적으로 모순될 때 사람들이 한쪽을 재구성해 조화롭게 만들려고 자동으로 시도한다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-050",
    passageId: "psychology-big-five-personality-traits-p2",
    prompt: "How was the five-factor model developed?",
    options: [
      "Using random number generation without empirical basis.",
      "Using empirical research into the language people used to describe themselves.",
      "Using only brain imaging with no language data.",
      "Using surveys of animal behavior exclusively.",
    ],
    answer: 1,
    explanation:
      "지문은 오요인 모델이 사람들이 자신을 묘사할 때 사용하는 언어에 대한 경험적 연구를 통해 개발되었다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-089",
    passageId: "psychology-developmental-psychology-p1",
    prompt: "What is developmental psychology, per the passage?",
    options: [
      "The scientific study of how and why the human mind grows, changes, and adapts over a lifetime.",
      "The study of only infant reflexes.",
      "The study of only elderly cognitive decline.",
      "A branch of psychology unrelated to change over time.",
    ],
    answer: 0,
    explanation:
      "지문은 발달심리학을 인간의 마음이 일생 동안 어떻게, 왜 성장하고 변화하고 적응하는지 과학적으로 연구하는 학문이라고 정의합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-079",
    passageId: "psychology-milgram-experiment-p7",
    prompt:
      "What is disputed about the experiment, despite being repeated with fairly consistent results?",
    options: [
      "Whether electric shocks were used in any version.",
      "Whether Milgram ever published his findings.",
      "Its interpretations and its applicability to the Holocaust.",
      "Whether the experiment was ever repeated at all.",
    ],
    answer: 2,
    explanation:
      "지문은 실험이 전 세계에서 반복되어 비교적 일관된 결과를 얻었음에도 그 해석과 홀로코스트에의 적용 가능성은 논쟁의 대상이라고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-130",
    passageId: "psychology-positive-psychology-p2",
    prompt: "When and how did positive psychology begin as a new domain?",
    options: [
      "In 1967, when the Neuropsychological Society was founded.",
      "In 1998, when Martin Seligman chose it as his APA presidential theme.",
      "In 1890, when Freud established psychoanalysis.",
      "In 1924, when Allport published his textbook.",
    ],
    answer: 1,
    explanation:
      "지문은 1998년 마틴 셀리그만이 미국심리학회 회장 임기의 주제로 이를 선택하면서 긍정심리학이 새로운 심리학 영역으로 시작되었다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-039",
    passageId: "psychology-attachment-theory-p7",
    prompt: "How was attachment theory extended in the 1980s?",
    options: [
      "It was replaced entirely by operant conditioning theory.",
      "It was limited only to nonhuman primates.",
      "To adult relationships, making it applicable beyond early childhood.",
      "It was restricted only to infants under one year old.",
    ],
    answer: 2,
    explanation:
      "지문은 1980년대에 애착 이론이 성인 관계로 확장되어 초기 아동기를 넘어서도 적용될 수 있게 되었다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-116",
    passageId: "psychology-psychoanalysis-p4",
    prompt: "What did Freud describe as the third insult to mankind?",
    options: [
      "The claim that the Earth revolves around the Sun.",
      "The claim that humans evolved from apes.",
      "The claim that behavior is entirely determined by reinforcement.",
      "The claim that the contents of the unconscious largely determine cognition and behavior.",
    ],
    answer: 3,
    explanation:
      "지문은 프로이트가 무의식의 내용이 인지와 행동을 상당 부분 결정한다는 자신의 중심 주장을 인류에 대한 세 번째 모욕이라고 표현했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-042",
    passageId: "psychology-cognitive-dissonance-p2",
    prompt:
      "What motivates people when they are confronted with dissonance-creating situations?",
    options: [
      "Complete forgetting of the conflicting belief.",
      "Change in their cognitions or actions to reduce the dissonance.",
      "No change at all, since dissonance cannot be reduced.",
      "Only external punishment, never internal change.",
    ],
    answer: 1,
    explanation:
      "지문은 부조화를 만드는 상황에 직면하면 그 부조화를 줄이기 위해 인지나 행동의 변화가 동기화된다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-140",
    passageId: "psychology-intelligence-quotient-p4",
    prompt:
      "What is still debated about the heritability of IQ, despite nearly a century of study?",
    options: [
      "Whether IQ tests exist at all.",
      "Whether intelligence can be measured in any way.",
      "Whether children are ever tested before adulthood.",
      "The significance of heritability estimates and the mechanisms of inheritance.",
    ],
    answer: 3,
    explanation:
      "지문은 IQ의 유전성이 거의 한 세기 동안 연구되었지만 유전율 추정치의 의미와 유전 메커니즘에 대한 논쟁이 여전히 있다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-082",
    passageId: "psychology-bystander-effect-p2",
    prompt: "What sparked the first proposal of this theory in 1964?",
    options: [
      "A survey of workplace safety practices.",
      "The murder of Kitty Genovese, reported (erroneously) to have 37 bystanders who did not help.",
      "A controlled laboratory experiment with no real-world event.",
      "A government study on urban crime rates.",
    ],
    answer: 1,
    explanation:
      "지문은 1964년 키티 제노비스 살해 사건 이후 신문이 37명의 목격자가 있었지만 아무도 돕지 않았다고 잘못 보도한 것이 이 이론의 첫 제안 계기였다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-137",
    passageId: "psychology-intelligence-quotient-p1",
    prompt: "What was IQ originally, before modern scoring methods?",
    options: [
      "A quotient obtained by dividing estimated mental age by chronological age.",
      "A fixed number assigned at birth with no test involved.",
      "A measure derived only from physical strength tests.",
      "A score based purely on formal education level.",
    ],
    answer: 0,
    explanation:
      "지문은 IQ가 원래 표준화된 검사로 얻은 추정 정신 연령을 실제 생활 연령으로 나누어 얻은 몫이었다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-012",
    passageId: "psychology-classical-conditioning-p4",
    prompt:
      "What is operant conditioning, as contrasted with Pavlovian conditioning here?",
    options: [
      "A process that only affects involuntary reflexes like salivation.",
      "A synonym for Pavlovian conditioning with no real difference.",
      "A process studied only in digestion research.",
      "A process modifying the strength of voluntary behavior by reinforcement or punishment.",
    ],
    answer: 3,
    explanation:
      "지문은 파블로프식 조건형성과 달리 조작적 조건형성이 강화나 처벌을 통해 자발적 행동의 강도를 바꾸는 과정이라고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-090",
    passageId: "psychology-developmental-psychology-p2",
    prompt:
      "What three major dimensions does developmental psychology examine change across?",
    options: [
      "Political, economic, and religious development.",
      "Physical development, cognitive development, and social emotional development.",
      "Only physical and financial development.",
      "Only cognitive development.",
    ],
    answer: 1,
    explanation:
      "지문은 발달심리학자들이 신체 발달, 인지 발달, 사회정서 발달이라는 세 가지 주요 차원에서 변화를 살핀다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-129",
    passageId: "psychology-positive-psychology-p1",
    prompt: "What is positive psychology the scientific study of?",
    options: [
      "Conditions and processes contributing to positive psychological states, well-being, and positive institutions.",
      "Only mental illness and its symptoms.",
      "Only negative thinking patterns.",
      "Only pharmaceutical treatments for depression.",
    ],
    answer: 0,
    explanation:
      "지문은 긍정심리학을 긍정적 심리 상태, 웰빙, 긍정적 관계, 긍정적 제도에 기여하는 조건과 과정을 과학적으로 연구하는 학문이라고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-067",
    passageId: "psychology-confirmation-bias-p3",
    prompt:
      "For which kinds of issues is the confirmation bias effect strongest?",
    options: [
      "Only topics with no personal relevance.",
      "Only topics discussed in scientific journals.",
      "Desired outcomes, emotionally charged issues, and deeply entrenched beliefs.",
      "Only neutral, emotionally flat topics.",
    ],
    answer: 2,
    explanation:
      "지문은 원하는 결과, 감정적으로 격한 사안, 깊이 뿌리내린 신념에서 확증 편향의 효과가 가장 강하다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-087",
    passageId: "psychology-bystander-effect-p7",
    prompt:
      "Who first demonstrated and popularized the bystander effect in the laboratory?",
    options: [
      "Leon Festinger in 1957.",
      "Mary Ainsworth in the 1960s.",
      "John M. Darley and Bibb Latané in 1968.",
      "Stanley Milgram in 1963.",
    ],
    answer: 2,
    explanation:
      "지문은 존 달리와 비브 라테인이 1964년 키티 제노비스 살해 사건에 관심을 갖게 된 뒤 1968년 실험실에서 방관자 효과를 처음 입증하고 대중화했다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-123",
    passageId: "psychology-neuropsychology-p3",
    prompt:
      "How does neuropsychology relate to classical neurology and classical psychology?",
    options: [
      "It is identical to classical neurology with no distinct focus.",
      "It studies only healthy individuals, never patients.",
      "It seeks to discover how the brain correlates with the mind through studying neurological patients.",
      "It rejects any connection between brain and mind.",
    ],
    answer: 2,
    explanation:
      "지문은 고전 신경학이 신경계의 병리에 초점을 맞추고 고전 심리학은 이와 크게 분리되어 있는 반면 신경심리학은 신경학적 환자 연구를 통해 뇌가 마음과 어떻게 상관관계를 갖는지 찾으려 한다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-020",
    passageId: "psychology-operant-conditioning-p4",
    prompt:
      "How are reinforcements and punishments distinguished in the passage?",
    options: [
      "Reinforcements decrease behaviors, while punishments increase them.",
      "Both reinforcements and punishments always increase behaviors.",
      "Neither reinforcements nor punishments affect behavior.",
      "Reinforcements increase behaviors, while punishments decrease behaviors.",
    ],
    answer: 3,
    explanation:
      "지문은 강화가 행동을 늘리는 환경 자극이고 처벌은 행동을 줄이는 자극이라고 구분합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-126",
    passageId: "psychology-neuropsychology-p6",
    prompt:
      "In which settings do neuropsychologists tend to work, according to the passage?",
    options: [
      "Only in unregulated private homes.",
      "Research settings, clinical settings, and forensic settings or industry.",
      "Only in outdoor field expeditions.",
      "Only in elementary school classrooms.",
    ],
    answer: 1,
    explanation:
      "지문은 신경심리학자들이 연구 환경, 임상 환경, 법정 환경이나 산업체에서 일하는 경향이 있다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-053",
    passageId: "psychology-big-five-personality-traits-p5",
    prompt:
      "What has the general structure of the five factors shown, per the passage?",
    options: [
      "It has been independently replicated across cultures and time, with predictive validity for outcomes like job performance and self-harm.",
      "It has never been replicated outside one original study.",
      "It applies only to English-speaking populations.",
      "It has no predictive validity for any external outcome.",
    ],
    answer: 0,
    explanation:
      "지문은 오요인 구조가 문화와 시대를 넘어 독립적으로 재현되었고 직무 수행이나 자해 행동 같은 외부 지표에 대한 예측 타당성이 있다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-125",
    passageId: "psychology-neuropsychology-p5",
    prompt:
      "What has the term also been applied to, involving individual cells?",
    options: [
      "Efforts to record electrical activity from individual cells in higher primates, including some human patients.",
      "Efforts to grow new cells in a petri dish.",
      "Efforts to destroy all neurons in an organism.",
      "Efforts unrelated to any recording of cellular activity.",
    ],
    answer: 0,
    explanation:
      "지문은 신경심리학이 인간 환자를 포함한 고등 영장류의 개별 세포에서 전기 활동을 기록하려는 노력에도 적용되었다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-104",
    passageId: "psychology-social-psychology-p8",
    prompt:
      "What became increasingly prevalent as societies redefined norms after the war, according to the passage?",
    options: [
      "Complete elimination of all group boundaries.",
      "Universal agreement on gender and racial issues.",
      "A total absence of any social problems.",
      "Social stigma, referring to disapproval or discrimination based on perceived differences.",
    ],
    answer: 3,
    explanation:
      "지문은 전쟁 이후 사회가 규범과 집단 경계를 재정의하면서 인지된 차이에 근거한 불승인이나 차별을 뜻하는 사회적 낙인이 점점 더 두드러졌다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-120",
    passageId: "psychology-psychoanalysis-p8",
    prompt: "What did Freud not equate the most common behavior with?",
    options: ["'Illness'.", "'Repression'.", "'Consciousness'.", "'Health'."],
    answer: 3,
    explanation:
      "지문은 이드, 자아, 초자아 사이의 내적 갈등이 정신 장애로 나타날 수 있으며 프로이트가 가장 흔한 행동을 건강과 동일시하지 않았다고 강조합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-086",
    passageId: "psychology-bystander-effect-p6",
    prompt:
      "To what setting can the bystander effect generalize, according to recent studies?",
    options: [
      "No setting outside the original street-crime context.",
      "Workplace settings, where subordinates refrain from informing managers of concerns.",
      "Only settings involving physical emergencies.",
      "Only settings with children present.",
    ],
    answer: 1,
    explanation:
      "지문은 최근 연구가 부하 직원들이 관리자에게 아이디어나 우려를 알리기를 꺼리는 직장 환경에도 이 효과가 일반화될 수 있음을 보여준다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-006",
    passageId: "psychology-cognitive-psychology-p6",
    prompt: "What did 19th-century debates concern, according to the passage?",
    options: [
      "Whether cognitive psychology should replace neuropsychology.",
      "Whether human thought is solely experiential or includes innate knowledge.",
      "Whether the brain or the heart controls behavior.",
      "Whether behaviorism or psychoanalysis was more scientific.",
    ],
    answer: 1,
    explanation:
      "지문은 19세기에 인간 사고가 전적으로 경험적인지 아니면 타고난 지식을 포함하는지에 대한 논쟁이 있었다고 말합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-093",
    passageId: "psychology-developmental-psychology-p5",
    prompt:
      "What are many researchers interested in, according to the passage?",
    options: [
      "Interactions among personal characteristics, individual behavior, and environmental factors.",
      "Only personal characteristics in isolation from environment.",
      "Only environmental factors with no personal characteristics.",
      "Interactions that exclude the built environment.",
    ],
    answer: 0,
    explanation:
      "지문은 많은 연구자들이 개인 특성, 개인의 행동, 환경적 요인 사이의 상호작용에 관심을 갖는다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-030",
    passageId: "psychology-working-memory-p6",
    prompt: "What did Baddeley and Hitch show in 1974?",
    options: [
      "Short-term memory does not exist as a concept.",
      "A single module could not account for all kinds of temporary memory.",
      "A single module could account for all kinds of memory.",
      "Working memory and long-term memory are identical.",
    ],
    answer: 1,
    explanation:
      "지문은 1974년 배들리와 히치가 단일한 모듈로는 모든 종류의 일시적 기억을 설명할 수 없음을 보였다고 말합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-063",
    passageId: "psychology-placebo-p7",
    prompt:
      "What ethical concern does disguising a placebo as an active treatment raise?",
    options: [
      "It only raises legal concerns, never ethical ones.",
      "It strengthens informed consent automatically.",
      "It introduces dishonesty into the doctor-patient relationship and bypasses informed consent.",
      "It has no ethical implications whatsoever.",
    ],
    answer: 2,
    explanation:
      "지문은 플라시보를 실제 치료처럼 위장하면 의사-환자 관계에 부정직함을 끌어들이고 사전 동의 절차를 건너뛰게 된다는 윤리적 우려가 있다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-081",
    passageId: "psychology-bystander-effect-p1",
    prompt: "What does the bystander effect state, according to the passage?",
    options: [
      "Individuals are less likely to offer help to a victim in the presence of other people.",
      "Individuals are more likely to help when others are present.",
      "The presence of others has no effect on helping behavior.",
      "Only trained professionals show reduced helping behavior.",
    ],
    answer: 0,
    explanation:
      "지문은 방관자 효과가 다른 사람들이 있을 때 개인이 피해자를 도울 가능성이 낮아진다는 사회심리학 이론이라고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-084",
    passageId: "psychology-bystander-effect-p4",
    prompt:
      "What happens when a group, rather than one individual, is asked to complete a task?",
    options: [
      "Each individual feels a stronger sense of responsibility than alone.",
      "The task is always completed faster regardless of group size.",
      "Responsibility becomes irrelevant to task completion.",
      "Each individual has a weaker sense of responsibility and may shrink back from difficulties.",
    ],
    answer: 3,
    explanation:
      "지문은 집단이 과제를 함께 수행하도록 요청받으면 개인의 책임감이 약해져 어려움 앞에서 물러서는 경우가 많다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-122",
    passageId: "psychology-neuropsychology-p2",
    prompt:
      "What is neuropsychology also concerned with, besides understanding brain-behavior links?",
    options: [
      "Only astronomy-related brain research.",
      "The diagnosis and treatment of behavioral and cognitive effects of neurological disorders.",
      "Only agricultural science.",
      "Only linguistics theory with no clinical application.",
    ],
    answer: 1,
    explanation:
      "지문은 신경심리학이 신경학적 장애의 행동적, 인지적 영향에 대한 진단과 치료에도 관심이 있다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-036",
    passageId: "psychology-attachment-theory-p4",
    prompt: "When are secure attachments formed, according to the passage?",
    options: [
      "Only after the child turns ten years old.",
      "Only when caregivers are inconsistent and unpredictable.",
      "Regardless of caregiver responsiveness.",
      "When caregivers are sensitive, responsive, and consistently present, particularly between six months and two years.",
    ],
    answer: 3,
    explanation:
      "지문은 양육자가 사회적 상호작용에서 민감하고 반응적이며 특히 생후 6개월에서 2세 사이에 꾸준히 함께 있을 때 안정 애착이 형성된다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-033",
    passageId: "psychology-attachment-theory-p1",
    prompt: "What does attachment theory concern, according to the passage?",
    options: [
      "Relationships between humans, especially early bonds between infants and primary caregivers.",
      "Only the biology of infant reflexes.",
      "Only adult romantic relationships.",
      "Only the effects of punishment on learning.",
    ],
    answer: 0,
    explanation:
      "지문은 애착 이론이 인간 사이의 관계, 특히 영아와 주 양육자 사이의 초기 유대의 중요성을 다루는 심리학적·진화적 틀이라고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-108",
    passageId: "psychology-behaviorism-p4",
    prompt:
      "What was behaviorism a reaction against, when it emerged in the early 1900s?",
    options: [
      "Only mathematics education.",
      "Only physical medicine.",
      "Cognitive psychology, which existed before it.",
      "Depth psychology and other traditional forms of psychology that had difficulty making testable predictions.",
    ],
    answer: 3,
    explanation:
      "지문은 행동주의가 1900년대 초 검증 가능한 예측을 하기 어려웠던 심층심리학과 다른 전통적 심리학 형태에 대한 반작용으로 등장했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-069",
    passageId: "psychology-confirmation-bias-p5",
    prompt:
      "How did later work reinterpret the 1960s experiments on confirming beliefs?",
    options: [
      "As a tendency to test ideas in a one-sided way, focusing on one possibility and ignoring alternatives.",
      "As proof that people have no biases whatsoever.",
      "As evidence that confirmation bias does not exist.",
      "As a result unique to a single experiment never replicated.",
    ],
    answer: 0,
    explanation:
      "지문은 이후 연구가 1960년대 실험 결과를 하나의 가능성에 집중하고 다른 대안은 무시하는 일방적인 방식으로 아이디어를 검증하는 경향으로 재해석했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-015",
    passageId: "psychology-classical-conditioning-p7",
    prompt:
      "Which areas does the passage say classical conditioning may affect?",
    options: [
      "Only mathematical reasoning ability.",
      "Only long-term memory consolidation.",
      "Responses to psychoactive drugs, hunger regulation, and social phenomena like the false consensus effect.",
      "Only the study of visual perception.",
    ],
    answer: 2,
    explanation:
      "지문은 고전적 조건형성이 향정신성 약물 반응, 배고픔 조절, 허위 합의 효과 같은 사회적 현상 연구에도 영향을 줄 수 있다고 말합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-073",
    passageId: "psychology-milgram-experiment-p1",
    prompt: "What did Stanley Milgram intend to measure with his experiments?",
    options: [
      "The willingness of participants to obey an authority figure instructing acts conflicting with their conscience.",
      "The willingness of participants to disobey any authority figure.",
      "The physical pain tolerance of participants.",
      "The memory capacity of participants under stress.",
    ],
    answer: 0,
    explanation:
      "지문은 스탠리 밀그램이 권위자가 양심에 반하는 행동을 하도록 지시했을 때 참가자들이 복종하려는 정도를 측정하고자 했다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-088",
    passageId: "psychology-bystander-effect-p8",
    prompt:
      "What resulted from the series of experiments launched by Darley and Latané?",
    options: [
      "A result that could never be replicated again.",
      "Evidence that group presence always increases helping.",
      "A finding limited only to laboratory rats.",
      "One of the strongest and most replicable effects in social psychology.",
    ],
    answer: 3,
    explanation:
      "지문은 달리와 라테인이 시작한 일련의 실험이 사회심리학에서 가장 강력하고 재현 가능한 효과 중 하나로 이어졌다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-143",
    passageId: "psychology-intelligence-quotient-p7",
    prompt:
      "Who have historically been many proponents of IQ testing, according to the passage?",
    options: [
      "Only mathematicians with no social claims.",
      "Only philosophers uninterested in testing at all.",
      "Eugenicists who used pseudoscience to push ideas of racial hierarchy.",
      "Only pediatricians with no ideological agenda.",
    ],
    answer: 2,
    explanation:
      "지문은 역사적으로 IQ 검사의 많은 지지자들이 인종 위계 사상을 밀어붙이기 위해 유사과학을 사용한 우생학자들이었다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-066",
    passageId: "psychology-confirmation-bias-p2",
    prompt:
      "How do people display confirmation bias, according to the passage?",
    options: [
      "By refusing to form any beliefs at all.",
      "By selecting information that supports their views and ignoring contrary information.",
      "By always seeking balanced, neutral information.",
      "By changing their views immediately upon new evidence.",
    ],
    answer: 1,
    explanation:
      "지문은 사람들이 자신의 견해를 뒷받침하는 정보를 선택하고 반대되는 정보를 무시할 때 확증 편향을 드러낸다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-142",
    passageId: "psychology-intelligence-quotient-p6",
    prompt: "What is the Flynn effect, according to the passage?",
    options: [
      "A phenomenon limited only to a single country.",
      "The phenomenon of raw IQ scores rising at an average rate of three points per decade since the early 20th century.",
      "The phenomenon of IQ scores falling every decade.",
      "A one-time jump in scores that never recurred.",
    ],
    answer: 1,
    explanation:
      "지문은 플린 효과를 20세기 초부터 여러 인구 집단의 IQ 검사 원점수가 10년마다 평균 3점씩 상승해온 현상이라고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-091",
    passageId: "psychology-developmental-psychology-p3",
    prompt:
      "What topics fall within the three developmental dimensions, according to the passage?",
    options: [
      "Only topics related to physical illness.",
      "Only topics studied in animals, not humans.",
      "Motor skills, executive functions, moral understanding, language acquisition, and identity formation.",
      "Only motor skills and nothing else.",
    ],
    answer: 2,
    explanation:
      "지문은 세 차원 안에 운동 기능, 실행 기능, 도덕적 이해, 언어 습득, 정체성 형성 등 폭넓은 주제가 포함된다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-105",
    passageId: "psychology-behaviorism-p1",
    prompt:
      "What does behaviorism assume behavior is, according to the passage?",
    options: [
      "A reflex from antecedent stimuli or a consequence of history including reinforcement and punishment.",
      "Purely random events with no relation to stimuli.",
      "Only the result of unconscious childhood trauma.",
      "Entirely determined by genetics with no environmental role.",
    ],
    answer: 0,
    explanation:
      "지문은 행동주의가 행동을 선행 자극에 의한 반사이거나 강화와 처벌 계약을 포함한 개인 역사의 결과라고 가정한다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-144",
    passageId: "psychology-intelligence-quotient-p8",
    prompt:
      "How has mainstream science responded to eugenicist ideas about IQ?",
    options: [
      "Mainstream science has fully endorsed all such ideas.",
      "No scientific consensus on the topic exists at all.",
      "The ideas were rejected only very recently, within the last year.",
      "A strong consensus has rejected them, though fringe figures still promote them.",
    ],
    answer: 3,
    explanation:
      "지문은 이런 사상이 주류 과학의 강한 합의에 의해 거부되었지만 일부 소수 인사들이 여전히 유사학문과 대중문화를 통해 이를 퍼뜨린다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-121",
    passageId: "psychology-neuropsychology-p1",
    prompt: "What is neuropsychology concerned with, according to the passage?",
    options: [
      "How a person's cognition and behavior are related to the brain and the rest of the nervous system.",
      "Only the treatment of broken bones.",
      "Only the study of animal instincts.",
      "Only the design of computer software.",
    ],
    answer: 0,
    explanation:
      "지문은 신경심리학이 사람의 인지와 행동이 뇌 및 신경계의 나머지 부분과 어떻게 관련되는지를 다루는 심리학의 한 분야라고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-101",
    passageId: "psychology-social-psychology-p5",
    prompt:
      "What was one of the first published studies in the field, according to the passage?",
    options: [
      "Norman Triplett's 1898 experiment on social facilitation.",
      "Floyd Allport's 1924 textbook.",
      "Kurt Lewin's World War II propaganda studies.",
      "Milgram's 1963 obedience study.",
    ],
    answer: 0,
    explanation:
      "지문은 노먼 트리플렛의 1898년 사회적 촉진 현상에 관한 실험이 이 분야 최초의 발표 연구 중 하나였다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-096",
    passageId: "psychology-developmental-psychology-p8",
    prompt:
      "Which fields is developmental psychology related to, per the passage?",
    options: [
      "Only astrophysics and chemistry.",
      "Only economics and political science.",
      "No other field; it is entirely isolated.",
      "Educational psychology, child psychopathology, forensic developmental psychology, and cultural psychology.",
    ],
    answer: 3,
    explanation:
      "지문은 발달심리학이 교육심리학, 아동정신병리학, 법정발달심리학, 아동발달, 인지심리학, 생태심리학, 문화심리학 등 여러 분야와 관련된다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-045",
    passageId: "psychology-cognitive-dissonance-p5",
    prompt: "What triggers the discomfort described in the passage?",
    options: [
      "Beliefs clashing with new information or having to resolve conflicting sides of a matter.",
      "Only physical pain unrelated to beliefs.",
      "Complete agreement between all beliefs and actions.",
      "The total absence of any information.",
    ],
    answer: 0,
    explanation:
      "지문은 신념이 새로운 정보와 충돌하거나 상충하는 측면을 개념적으로 해결해야 할 때 불편함이 촉발된다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-098",
    passageId: "psychology-social-psychology-p2",
    prompt:
      "How does psychological social psychology differ in emphasis from sociological social psychology?",
    options: [
      "It focuses only on group-level statistics, never individuals.",
      "It places more emphasis on the individual rather than society.",
      "It places more emphasis on society rather than the individual.",
      "It ignores personality entirely.",
    ],
    answer: 1,
    explanation:
      "지문은 심리학적 사회심리학이 사회학적 사회심리학과 달리 사회보다 개인에 더 초점을 맞춘다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-001",
    passageId: "psychology-cognitive-psychology-p1",
    prompt:
      "What does the passage say cognitive psychology scientifically studies?",
    options: [
      "Human mental processes such as attention, memory, and reasoning.",
      "Only observable physical reflexes in animals.",
      "Only childhood emotional development.",
      "Only the biology of neurons without behavior.",
    ],
    answer: 0,
    explanation:
      "지문은 인지심리학을 주의, 언어 사용, 기억, 지각, 문제 해결, 창의성, 추론 같은 인간 정신 과정을 과학적으로 연구하는 학문이라고 정의합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-065",
    passageId: "psychology-confirmation-bias-p1",
    prompt: "What is confirmation bias, as defined in the passage?",
    options: [
      "The tendency to search for, interpret, favor, and recall information that confirms prior beliefs.",
      "The tendency to always seek out contradictory information.",
      "A rare condition that affects only trained scientists.",
      "The tendency to forget all prior beliefs immediately.",
    ],
    answer: 0,
    explanation:
      "지문은 확증 편향을 기존 신념, 가치관, 결정을 확인하거나 뒷받침하는 방식으로 정보를 찾고 해석하고 선호하고 기억하는 경향이라고 정의합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-112",
    passageId: "psychology-behaviorism-p8",
    prompt:
      "What did Skinner assess that led to the process known as operant conditioning?",
    options: [
      "Only the physical strength of the animal being studied.",
      "The chemical composition of neurotransmitters.",
      "The dream content reported by patients.",
      "The reinforcement histories of discriminative stimuli that emit behavior.",
    ],
    answer: 3,
    explanation:
      "지문은 왓슨과 파블로프가 조건 반사를 유발하는 중립 자극을 연구한 반면 스키너는 행동을 유발하는 변별 자극의 강화 이력을 평가했으며 이 과정이 조작적 조건형성으로 알려지게 되었다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-049",
    passageId: "psychology-big-five-personality-traits-p1",
    prompt: "What is the Big Five model described as?",
    options: [
      "A scientific model for measuring and describing human personality traits.",
      "A clinical diagnostic tool for mental illness only.",
      "A theory that personality cannot be measured.",
      "A single-factor model of personality.",
    ],
    answer: 0,
    explanation:
      "지문은 Big Five 모델(OCEAN 또는 CANOE로도 불림)을 인간 성격 특성을 측정하고 기술하는 과학적 모델이라고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-010",
    passageId: "psychology-classical-conditioning-p2",
    prompt: "What does the term classical conditioning refer to?",
    options: [
      "A response that occurs only in laboratory settings.",
      "An automatic, conditioned response paired with a specific stimulus.",
      "A voluntary response shaped only by reward schedules.",
      "A random response with no relation to any stimulus.",
    ],
    answer: 1,
    explanation:
      "지문은 고전적 조건형성이 특정 자극과 짝지어진 자동적이고 조건화된 반응의 과정을 가리킨다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-083",
    passageId: "psychology-bystander-effect-p3",
    prompt:
      "What factors has much research on the bystander effect focused on?",
    options: [
      "Only the weather conditions during the incident.",
      "Only the victim's physical appearance.",
      "The number of bystanders, ambiguity, group cohesiveness, and diffusion of responsibility.",
      "Only the age of the bystanders.",
    ],
    answer: 2,
    explanation:
      "지문은 방관자 수, 모호성, 집단 응집성, 책임 분산 같은 다양한 요인에 연구가 집중되어 왔다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-008",
    passageId: "psychology-cognitive-psychology-p8",
    prompt:
      "What are disruptions of language production or comprehension from trauma in these areas commonly known as?",
    options: [
      "Cognitive dissonance and confirmation bias.",
      "Classical conditioning and operant conditioning.",
      "Attachment disorder and separation anxiety.",
      "Broca's aphasia and Wernicke's aphasia.",
    ],
    answer: 3,
    explanation:
      "지문은 이 영역들의 손상이나 기형으로 생기는 언어 산출·이해 장애를 각각 브로카 실어증과 베르니케 실어증이라고 부른다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-113",
    passageId: "psychology-psychoanalysis-p1",
    prompt: "What does psychoanalysis comprise, according to the passage?",
    options: [
      "A set of theories and techniques to discover unconscious processes and their influence on conscious thought.",
      "Only techniques for treating physical injuries.",
      "Only surveys measuring conscious opinions.",
      "A set of theories with no practical techniques.",
    ],
    answer: 0,
    explanation:
      "지문은 정신분석이 무의식적 과정과 그것이 의식적 사고, 정서, 행동에 미치는 영향을 발견하기 위한 이론과 기법의 집합이라고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-046",
    passageId: "psychology-cognitive-dissonance-p6",
    prompt:
      "How can the need to reduce discomfort be used, according to the passage?",
    options: [
      "To eliminate all forms of social behavior.",
      "As a catalyst for attitudinal change, such as shaping pro-social behaviours or deradicalising extremists.",
      "Only to increase extremist behavior.",
      "Only in laboratory demonstrations with no practical use.",
    ],
    answer: 1,
    explanation:
      "지문은 불편함을 줄이려는 욕구가 친사회적 행동을 형성하거나 극단주의자를 탈급진화하는 등 태도 변화를 위한 촉매로 활용될 수 있다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-100",
    passageId: "psychology-social-psychology-p4",
    prompt:
      "What method did early social psychologists apply to human behavior?",
    options: [
      "Only philosophical speculation with no empirical testing.",
      "Only literary analysis of novels.",
      "Astrological methods for predicting behavior.",
      "The scientific method, to discover concrete cause-and-effect relationships.",
    ],
    answer: 3,
    explanation:
      "지문은 초기 심리학자들이 사회적 상호작용을 설명하는 구체적인 인과관계를 발견하기 위해 과학적 방법을 인간 행동에 적용했다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-072",
    passageId: "psychology-confirmation-bias-p8",
    prompt:
      "What kind of errors does confirmation bias produce in scientific research based on inductive reasoning?",
    options: [
      "Random errors with no consistent pattern.",
      "No errors at all, since science is immune to bias.",
      "Errors only in purely deductive, non-inductive research.",
      "Systematic errors from the gradual accumulation of supportive evidence.",
    ],
    answer: 3,
    explanation:
      "지문은 확증 편향이 귀납적 추론에 기반한 과학 연구에서 뒷받침하는 증거가 점진적으로 쌓이는 방식으로 체계적인 오류를 만든다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-052",
    passageId: "psychology-big-five-personality-traits-p4",
    prompt:
      "What did dimensionality reduction techniques allow psychologists to show?",
    options: [
      "Human personality has no measurable variance at all.",
      "Personality requires at least fifty separate factors.",
      "Dimensionality reduction cannot be applied to personality data.",
      "Most of the variance in human personality can be explained using only five factors.",
    ],
    answer: 3,
    explanation:
      "지문은 차원 축소 기법을 이용해 심리학자들이 인간 성격의 변량 대부분을 다섯 가지 요인만으로 설명할 수 있음을 보였다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-047",
    passageId: "psychology-cognitive-dissonance-p7",
    prompt:
      "In which works did Leon Festinger propose that humans strive for internal psychological consistency?",
    options: [
      "Obedience to Authority (1974).",
      "Organization of Behavior (1949).",
      "When Prophecy Fails (1956) and A Theory of Cognitive Dissonance (1957).",
      "Attachment and Loss (1969-82).",
    ],
    answer: 2,
    explanation:
      "지문은 레온 페스팅거가 예언이 끝날 때(1956)와 인지 부조화 이론(1957)에서 인간이 내적 심리 일관성을 추구한다고 제안했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-114",
    passageId: "psychology-psychoanalysis-p2",
    prompt:
      "Who established psychoanalysis in the early 1890s, and what did it take into account?",
    options: [
      "John Bowlby; only attachment research.",
      "Sigmund Freud; Darwin's theory of evolution, neurology findings, ethnology reports, and clinical research.",
      "Carl Jung; only astrology and mythology.",
      "B. F. Skinner; only observable behavior.",
    ],
    answer: 1,
    explanation:
      "지문은 지그문트 프로이트가 1890년대 초에 정신분석을 확립했으며 다윈의 진화론, 신경학 연구 결과, 민족학 보고서, 스승 요제프 브로이어의 발견을 포함한 임상 연구를 고려했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-109",
    passageId: "psychology-behaviorism-p5",
    prompt:
      "Whose earlier research on the law of effect did behaviorism derive from?",
    options: [
      "Edward Thorndike's.",
      "B. F. Skinner's.",
      "John B. Watson's.",
      "Ivan Pavlov's.",
    ],
    answer: 0,
    explanation:
      "지문은 행동주의가 에드워드 손다이크가 개척한 효과의 법칙 같은 19세기 후반의 이전 연구에서 파생되었다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-024",
    passageId: "psychology-operant-conditioning-p8",
    prompt: "What happened to the cats' escape times with repeated trials?",
    options: [
      "Ineffective responses increased over time.",
      "The cats' escape time stayed exactly the same across trials.",
      "The cats stopped attempting to escape after a few trials.",
      "Ineffective responses decreased and successful responses increased, so cats escaped more quickly.",
    ],
    answer: 3,
    explanation:
      "지문은 반복된 시도에서 비효율적인 반응은 줄고 성공적인 반응은 늘어나 고양이가 점점 더 빨리 탈출하게 되었다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-060",
    passageId: "psychology-placebo-p4",
    prompt:
      "Why are participants shielded from knowing who gets the placebo versus the treatment?",
    options: [
      "Because it is required by law in every country.",
      "Because placebos are more dangerous than real treatments.",
      "Because clinicians always know the answer regardless.",
      "Because patients' and clinicians' expectations of efficacy can influence results.",
    ],
    answer: 3,
    explanation:
      "지문은 환자와 임상의의 효과에 대한 기대가 결과에 영향을 줄 수 있기 때문에 누가 플라시보를 받는지 가린다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-071",
    passageId: "psychology-confirmation-bias-p7",
    prompt:
      "In which contexts have flawed decisions due to confirmation bias been found?",
    options: [
      "Only in contexts with no real-world consequences.",
      "Only within artificial laboratory settings.",
      "Political, organizational, financial, and scientific contexts.",
      "Only in contexts involving children.",
    ],
    answer: 2,
    explanation:
      "지문은 확증 편향으로 인한 잘못된 결정이 정치, 조직, 금융, 과학 등 다양한 맥락에서 발견되었다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-028",
    passageId: "psychology-working-memory-p4",
    prompt:
      "What did Atkinson and Shiffrin use the term working memory to describe in 1968?",
    options: [
      "Their long-term memory model.",
      "A purely sensory registration system.",
      "A model with no relation to memory.",
      "Their 'short-term store'.",
    ],
    answer: 3,
    explanation:
      "지문은 1968년 애트킨슨과 쉬프린이 자신들의 단기 저장소를 설명하기 위해 작업기억이라는 용어를 사용했다고 말합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-059",
    passageId: "psychology-placebo-p3",
    prompt:
      "What should placebos in clinical trials ideally be, except for the treatment's medicinal effect?",
    options: [
      "More expensive than the real treatment.",
      "Administered only to clinicians, not patients.",
      "Indistinguishable from the verum treatments under investigation.",
      "Clearly labeled and distinguishable from real treatments.",
    ],
    answer: 2,
    explanation:
      "지문은 임상시험에서 플라시보가 가설로 세운 약효를 제외하면 실험 대상 진짜 치료와 구별할 수 없어야 한다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-057",
    passageId: "psychology-placebo-p1",
    prompt: "What is a placebo, according to the passage?",
    options: [
      "A medicine or treatment intended to appear genuine but with no pharmaceutical effect.",
      "A medicine with a strong pharmaceutical effect disguised as inert.",
      "A surgical procedure that always has a real medical effect.",
      "A treatment used only outside clinical research.",
    ],
    answer: 0,
    explanation:
      "지문은 플라시보를 받는 사람에게 진짜처럼 보이도록 의도되었지만 약리학적 효과는 없는 의약품이나 치료라고 정의합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-016",
    passageId: "psychology-classical-conditioning-p8",
    prompt:
      "In the described pairing, what is the unconditioned response an example of?",
    options: [
      "A learned voluntary behavior shaped by reinforcement.",
      "A random behavior unrelated to any stimulus.",
      "A response that only occurs after extensive training.",
      "An innate reflex response, such as salivation to the taste of food.",
    ],
    answer: 3,
    explanation:
      "지문은 무조건 자극인 음식 맛에 대한 무조건 반응이 침 분비 같은 타고난 반사 반응의 예라고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-041",
    passageId: "psychology-cognitive-dissonance-p1",
    prompt: "How is cognitive dissonance described in the field of psychology?",
    options: [
      "A mental phenomenon where people unknowingly or subconsciously hold fundamentally conflicting cognitions.",
      "A phenomenon where people always consciously choose conflicting beliefs.",
      "A physical illness with no mental component.",
      "A state that occurs only in laboratory settings.",
    ],
    answer: 0,
    explanation:
      "지문은 인지 부조화를 사람들이 자신도 모르게 혹은 무의식적으로 근본적으로 상충하는 인지를 지니는 심리 현상이라고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-110",
    passageId: "psychology-behaviorism-p6",
    prompt: "What did John B. Watson devise with his 1924 publication?",
    options: [
      "Psychoanalysis, based on unconscious drives.",
      "Methodological behaviorism, which rejected introspective methods.",
      "Radical behaviorism, which accepted covert cognition as a variable.",
      "Cognitive psychology, based on introspection.",
    ],
    answer: 1,
    explanation:
      "지문은 1924년 존 왓슨의 저작으로 내성적 방법을 거부하고 관찰 가능한 행동과 사건만 측정해 행동을 이해하려 한 방법론적 행동주의가 고안되었다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-055",
    passageId: "psychology-big-five-personality-traits-p7",
    prompt: "What qualities is extraversion typically associated with?",
    options: [
      "Only intellectual curiosity and openness to ideas.",
      "Only anxiety and emotional instability.",
      "Gregariousness, assertiveness, excitement-seeking, warmth, activity, and positive emotions.",
      "Shyness, withdrawal, and avoidance of social contact.",
    ],
    answer: 2,
    explanation:
      "지문은 외향성이 사교성, 자기주장, 자극 추구, 따뜻함, 활동성, 긍정적 정서 같은 특질과 관련된다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-092",
    passageId: "psychology-developmental-psychology-p4",
    prompt:
      "What does developmental psychology explore regarding nature and nurture?",
    options: [
      "Only the influence of nature, ignoring nurture entirely.",
      "Only the influence of nurture, ignoring nature entirely.",
      "Neither nature nor nurture, only random chance.",
      "The influence of both nature and nurture on human development.",
    ],
    answer: 3,
    explanation:
      "지문은 발달심리학이 인간 발달에 미치는 선천적 요인과 후천적 요인 양쪽의 영향을 탐구한다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-134",
    passageId: "psychology-positive-psychology-p6",
    prompt:
      "What factors do positive psychologists suggest may contribute to happiness?",
    options: [
      "Complete isolation from social contact.",
      "Strong social ties, involvement in clubs, regular physical exercise, and meditation.",
      "Only financial wealth with no other factor.",
      "Only genetic predisposition with no behavioral factor.",
    ],
    answer: 1,
    explanation:
      "지문은 긍정심리학자들이 가족, 친구, 동료, 더 넓은 네트워크 같은 강한 사회적 유대, 동호회나 사회단체 참여, 규칙적인 신체 운동, 명상 같은 관행을 행복에 기여하는 요인으로 제시한다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-070",
    passageId: "psychology-confirmation-bias-p6",
    prompt:
      "What is one proposed explanation for confirmation bias in the passage?",
    options: [
      "The bias only appears in individuals with formal scientific training.",
      "People pragmatically assess the costs of being wrong rather than investigating neutrally.",
      "People have no cognitive limitations that could explain any bias.",
      "The bias is caused only by external social pressure.",
    ],
    answer: 1,
    explanation:
      "지문은 사람들이 중립적이고 과학적인 방식으로 조사하기보다 틀렸을 때의 비용을 실용적으로 따지기 때문에 확증 편향을 보인다는 설명을 제시합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-097",
    passageId: "psychology-social-psychology-p1",
    prompt: "What does social psychology methodically study?",
    options: [
      "How thoughts, feelings, and behaviors are influenced by the actual, imagined, or implied presence of others.",
      "Only the biology of the nervous system.",
      "Only economic decision-making in isolation.",
      "Only behaviors that occur when a person is completely alone.",
    ],
    answer: 0,
    explanation:
      "지문은 사회심리학이 생각, 감정, 행동이 실제, 상상, 또는 암시된 타인의 존재에 어떻게 영향받는지를 체계적으로 연구하는 학문이라고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-psychology-v2-027",
    passageId: "psychology-working-memory-p3",
    prompt: "Who coined the term working memory, and in what context?",
    options: [
      "Baddeley and Hitch, in their multi-component model.",
      "Hitzig and Ferrier, in their ablation experiments.",
      "Miller, Galanter, and Pribram, in theories likening the mind to a computer.",
      "Atkinson and Shiffrin, in their short-term store model.",
    ],
    answer: 2,
    explanation:
      "지문은 밀러, 갈랜터, 프리브램이 마음을 컴퓨터에 비유한 이론의 맥락에서 작업기억이라는 용어를 만들었다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-psychology-v2-043",
    passageId: "psychology-cognitive-dissonance-p3",
    prompt:
      "When does psychological discomfort from cognitive dissonance surface?",
    options: [
      "Only in childhood, never in adulthood.",
      "Only when a person is completely isolated from others.",
      "When actions create conflicting beliefs or new information challenges existing beliefs.",
      "Only when there is no conflict of any kind.",
    ],
    answer: 2,
    explanation:
      "지문은 행동이 상충하는 신념을 만들거나 새로운 정보가 기존 신념에 도전할 때 심리적 스트레스로 인지 부조화가 드러난다고 설명합니다.",
    difficulty: 2,
  },
];

const buildQuestion = (spec) => {
  const passage = passageById.get(spec.passageId);
  if (!passage)
    throw new Error(`Unknown psychology passage: ${spec.passageId}`);
  const article = articleById.get(passage.articleId);
  if (!article)
    throw new Error(`Unknown psychology article: ${passage.articleId}`);
  return {
    id: spec.id,
    topic: "psychology",
    passageId: spec.passageId,
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

export const dadPsychologyQuestions = questionSpecs.map(buildQuestion);
