import sourceData from "./assets/wikipedia/metascience-sources.json" with { type: "json" };

const passageById = new Map(
  sourceData.passages.map((passage) => [passage.id, passage]),
);
const articleById = new Map(
  sourceData.articles.map((article) => [article.id, article]),
);

const questionSpecs = [
  {
    id: "dad-metascience-v2-041",
    passageId: "metascience-h-index-p1",
    prompt: "What does the h-index measure, according to the passage?",
    options: [
      "Only the number of years a scientist has worked.",
      "Both the productivity and citation impact of an individual scientist's publications.",
      "Only the total funding a scientist has received.",
      "Only the number of co-authors a scientist has had.",
    ],
    answer: 1,
    explanation:
      "지문은 h-index가 개별 과학자 출판물의 생산성과 인용 영향력을 함께 측정한다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-metascience-v2-067",
    passageId: "metascience-open-access-p3",
    prompt:
      "What model do most gold open access journals with APCs follow, according to the passage?",
    options: [
      "A 'reader-pays' model that charges subscribers a fee.",
      "A model where no one pays anything under any circumstance.",
      "A model exclusively funded by government taxation.",
      "An 'author-pays' model, though this is not intrinsic to gold OA.",
    ],
    answer: 3,
    explanation:
      "지문은 APC를 부과하는 대부분의 gold open access 저널이 '저자가 지불하는' 모델을 따르지만 이것이 gold OA의 본질적 특성은 아니라고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-075",
    passageId: "metascience-altmetrics-p3",
    prompt: "Which tools does the passage name as calculating altmetrics?",
    options: [
      "Microsoft Word, Excel, and PowerPoint.",
      "ImpactStory, Altmetric, and Plum Analytics.",
      "Google Maps, Google Earth, and Google Translate.",
      "PubMed, MEDLINE, and CINAHL only.",
    ],
    answer: 1,
    explanation:
      "지문은 ImpactStory, Altmetric, Plum Analytics를 altmetrics를 계산하는 도구로 언급합니다.",
    difficulty: 1,
  },
  {
    id: "dad-metascience-v2-090",
    passageId: "metascience-reproducibility-p2",
    prompt:
      "Who was the first to stress reproducibility's importance, according to the passage?",
    options: [
      "The physicist Jorge E. Hirsch, in the 21st century.",
      "The sociologist Eugene Garfield, in the 20th century.",
      "The philosopher Karl Popper, in the 20th century.",
      "The Anglo-Irish chemist Robert Boyle, in 17th-century England.",
    ],
    answer: 3,
    explanation:
      "지문은 17세기 영국의 화학자 Robert Boyle이 재현성의 중요성을 처음 강조했다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-metascience-v2-106",
    passageId: "metascience-citation-analysis-p2",
    prompt:
      "What additional example of citation analysis does the passage give beyond academic articles?",
    options: [
      "Grocery store receipts listing purchased items.",
      "Patents, which contain prior art citing earlier relevant patents.",
      "Weather reports listing daily temperatures.",
      "Movie reviews listing box office earnings.",
    ],
    answer: 1,
    explanation:
      "지문은 학술 논문 외에도 이전 관련 특허를 인용하는 prior art를 담은 특허를 citation analysis의 또 다른 예로 듭니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-052",
    passageId: "metascience-peer-review-p4",
    prompt:
      "Who recommended a prototype professional peer review process, according to the passage?",
    options: [
      "Henry Oldenburg, in a 17th-century British journal.",
      "Eugene Garfield, in a 20th-century scientometrics paper.",
      "Karl Popper, in The Logic of Scientific Discovery.",
      "Ishāq ibn ʻAlī al-Ruhāwī, in the Ethics of the Physician.",
    ],
    answer: 3,
    explanation:
      "지문은 Ishāq ibn ʻAlī al-Ruhāwī가 Ethics of the Physician에서 전문직 동료평가 과정의 원형을 제안했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-011",
    passageId: "metascience-bibliometrics-p3",
    prompt:
      "How did R. N. Broadus define bibliometrics in 1987, per the passage?",
    options: [
      "As the qualitative study of readers' personal opinions about books.",
      "As the analysis of laboratory chemical reactions using citation counts.",
      "As the quantitative study of physical published units, bibliographic units, or their surrogates.",
      "As a purely legal discipline unrelated to publications.",
    ],
    answer: 2,
    explanation:
      "지문은 1987년 R. N. Broadus가 bibliometrics를 물리적 출판 단위나 서지 단위, 또는 그 대체물에 대한 양적 연구로 정의했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-008",
    passageId: "metascience-metascience-p8",
    prompt:
      "What did a study relate different growth-rate segments of science to, per the passage?",
    options: [
      "Only changes in university tuition fees over time.",
      "Phases of economic developments such as industrialization and political developments such as the Second World War.",
      "The invention of the printing press in the fifteenth century.",
      "Fluctuations in the price of laboratory glassware.",
    ],
    answer: 1,
    explanation:
      "지문은 연구 성장률이 다른 구간들이 산업화 같은 경제적 국면이나 제2차 세계대전 같은 정치적 발전과 관련되어 보인다고 말합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-058",
    passageId: "metascience-replication-crisis-p2",
    prompt:
      "Which two fields does the passage identify as focal points for replication efforts?",
    options: [
      "Astronomy and geology.",
      "Mathematics and computer science only.",
      "Law and economics only.",
      "Psychology and medicine.",
    ],
    answer: 3,
    explanation: "지문은 심리학과 의학이 재현 노력의 중심지였다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-metascience-v2-046",
    passageId: "metascience-h-index-p6",
    prompt:
      "What approach does the passage suggest for dealing with h-index variation across databases?",
    options: [
      "Always use only the lowest h-index value found in any database.",
      "Ignore all databases and estimate h-index from memory.",
      "Average together the h-index values from every possible database.",
      "Assume false negatives are more problematic than false positives and take the maximum h measured.",
    ],
    answer: 3,
    explanation:
      "지문은 데이터베이스마다 h값이 다를 때 false negative가 false positive보다 더 문제라고 보고 측정된 h 중 최댓값을 취하라고 제안한다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-100",
    passageId: "metascience-preprint-p4",
    prompt:
      "What did Grigori Perelman publish on arXiv between 2002 and 2003, per the passage?",
    options: [
      "A series of papers disproving the Poincaré conjecture entirely.",
      "A series of preprint papers presenting a proof of the Poincaré conjecture.",
      "The first peer-reviewed journal article about arXiv itself.",
      "A complete history of the preprint server system.",
    ],
    answer: 1,
    explanation:
      "지문은 Grigori Perelman이 2002~2003년 arXiv에 Poincaré 추측을 증명하는 preprint 논문들을 발표했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-081",
    passageId: "metascience-science-and-technology-studies-p1",
    prompt: "What does the passage say STS examines?",
    options: [
      "The creation, development, consequences, and outcomes of science and technology in historical, cultural, and social contexts.",
      "Only the mathematical proofs used in theoretical physics.",
      "Only the manufacturing costs of laboratory equipment.",
      "Only the biographies of Nobel Prize winners.",
    ],
    answer: 0,
    explanation:
      "지문은 STS가 과학과 기술의 창조, 발전, 결과와 영향을 역사적, 문화적, 사회적 맥락에서 살핀다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-metascience-v2-123",
    passageId: "metascience-open-science-p3",
    prompt:
      "What tension gave rise to the Open Science movement, according to the passage?",
    options: [
      "Tension between ethical codes prescribing transparency and competitive pressures favoring exclusive handling of research.",
      "Tension between two rival government funding agencies only.",
      "Tension between chemistry and physics departments only.",
      "Tension caused solely by disagreements over journal pricing.",
    ],
    answer: 0,
    explanation:
      "지문은 Open Science 운동이 투명성을 요구하는 윤리 규범과 연구를 배타적으로 다루게 만드는 경쟁 압력 사이의 긴장에서 비롯되었다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-004",
    passageId: "metascience-metascience-p4",
    prompt: "What does the passage say the replication crisis is?",
    options: [
      "A crisis in which scientific journals refuse to publish any new research.",
      "A temporary funding shortage affecting only physics laboratories.",
      "A crisis that was resolved completely before the term was even coined.",
      "An ongoing methodological crisis in which many scientific studies are difficult or impossible to replicate.",
    ],
    answer: 3,
    explanation:
      "지문은 replication crisis를 많은 과학 연구가 재현하기 어렵거나 불가능하다고 밝혀진 지속적인 방법론적 위기라고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-metascience-v2-064",
    passageId: "metascience-replication-crisis-p8",
    prompt:
      "What has been suggested for methods courses in psychology and other fields, according to the passage?",
    options: [
      "That they should be eliminated from university curricula entirely.",
      "That they should emphasize replication attempts rather than original studies.",
      "That they should focus exclusively on original, unreplicated studies.",
      "That they should be taught only at MIT, Stanford, and Washington.",
    ],
    answer: 1,
    explanation:
      "지문은 심리학과 다른 분야의 방법론 강좌가 원본 연구보다 재현 시도를 강조해야 한다는 제안이 있었다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-063",
    passageId: "metascience-replication-crisis-p7",
    prompt:
      "What did the Laura and John Arnold Foundation fund in 2013, per the passage?",
    options: [
      "The closure of every psychology journal in the United States.",
      "A ban on all preprint servers worldwide.",
      "The first Science Citation Index in 1961.",
      "The launch of The Center for Open Science with a $5.25 million grant.",
    ],
    answer: 3,
    explanation:
      "지문은 2013년 Laura and John Arnold Foundation이 525만 달러 보조금으로 The Center for Open Science 설립을 지원했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-017",
    passageId: "metascience-scientometrics-p1",
    prompt: "What does the passage say scientometrics studies?",
    options: [
      "Only the biographies of individual famous scientists.",
      "The chemical composition of laboratory materials.",
      "The architecture of university science buildings.",
      "Science through mathematical and statistical methods, analyzing scientific output and the dynamics of research.",
    ],
    answer: 3,
    explanation:
      "지문은 scientometrics가 수학적, 통계적 방법으로 과학을 연구하며 과학적 산출물과 연구의 역동성을 분석한다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-metascience-v2-015",
    passageId: "metascience-bibliometrics-p7",
    prompt:
      "What political event made bibliographic control a national information crisis, according to the passage?",
    options: [
      "The end of the Second World War in 1945.",
      "The successful launch of Sputnik in 1957.",
      "The founding of the first modern university in the 12th century.",
      "The invention of the printing press in the 15th century.",
    ],
    answer: 1,
    explanation:
      "지문은 1957년 Sputnik의 성공적인 발사가 서지 통제 문제를 국가적 정보 위기로 만들었다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-027",
    passageId: "metascience-citation-index-p3",
    prompt: "What did William Adair suggest in 1920, according to the passage?",
    options: [
      "That citation indexes could serve as a tool for tracking science and engineering literature.",
      "That citation indexes should be banned from all legal use.",
      "That Shepard's Citations should be discontinued permanently.",
      "That science journals should stop citing earlier legal cases.",
    ],
    answer: 0,
    explanation:
      "지문은 1920년 William Adair가 citation index가 과학과 공학 문헌을 추적하는 도구가 될 수 있다고 제안했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-099",
    passageId: "metascience-preprint-p3",
    prompt:
      "What do many journals do regarding preprints in references, according to the passage?",
    options: [
      "They require every reference to be a preprint rather than a journal article.",
      "They automatically accept all preprints as fully peer-reviewed sources.",
      "They prohibit or discourage the use of preprints in references as they are not considered credible sources.",
      "They pay authors extra for citing preprints in their reference lists.",
    ],
    answer: 2,
    explanation:
      "지문은 많은 저널이 preprint를 신뢰할 수 있는 출처로 보지 않아 참고문헌으로 쓰는 것을 금지하거나 권장하지 않는다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-127",
    passageId: "metascience-open-science-p7",
    prompt:
      "What does the measurement school focus on, according to the passage?",
    options: [
      "Developing new laboratory equipment for chemistry experiments.",
      "Developing alternative methods to determine scientific impact.",
      "Measuring only the physical size of university campuses.",
      "Measuring the temperature of research laboratories.",
    ],
    answer: 1,
    explanation:
      "지문은 measurement school이 과학적 영향력을 판단할 대안적 방법을 개발하는 데 집중한다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-105",
    passageId: "metascience-citation-analysis-p1",
    prompt: "What does citation analysis examine, according to the passage?",
    options: [
      "The frequency, patterns, and graphs of citations in documents, using a directed graph of citations.",
      "Only the physical binding quality of printed books.",
      "Only the personal income of individual scientists.",
      "Only the fonts and typography used in academic papers.",
    ],
    answer: 0,
    explanation:
      "지문은 citation analysis가 문서 간 인용의 빈도와 패턴, 그래프를 방향성 있는 인용 그래프로 살핀다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-metascience-v2-140",
    passageId: "metascience-retraction-watch-p4",
    prompt:
      "What do Oransky and Marcus claim retractions provide a window into, per the passage?",
    options: [
      "The complete failure of the scientific method as a whole.",
      "Only the personal finances of individual researchers.",
      "The self-correcting nature of science and cases of scientific fraud.",
      "The history of unrelated non-scientific publishing industries.",
    ],
    answer: 2,
    explanation:
      "지문은 Oransky와 Marcus가 논문 철회가 과학의 자기 교정적 특성과 과학적 부정행위 사례를 들여다보는 창이 된다고 주장한다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-028",
    passageId: "metascience-citation-index-p4",
    prompt: "What did Garfield do in 1959, per the passage?",
    options: [
      "He retired from all citation-related research entirely.",
      "He published the first edition of Shepard's Citations.",
      "He won the Nobel Prize for chemistry.",
      "He started a consulting business, the Institute for Scientific Information, in Philadelphia.",
    ],
    answer: 3,
    explanation:
      "지문은 1959년 Garfield가 필라델피아에서 컨설팅 회사인 Institute for Scientific Information을 시작했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-136",
    passageId: "metascience-publish-or-perish-p8",
    prompt:
      "According to Eugene Garfield, where did the phrase first appear in an academic context, per the passage?",
    options: [
      "In Logan Wilson's 1942 book, 'The Academic Man: A Study in the Sociology of a Profession.'",
      "In a 2005 paper by John Ioannidis.",
      "In Jorge E. Hirsch's 2005 h-index paper.",
      "In Robert Boyle's 17th-century writings on vacuums.",
    ],
    answer: 0,
    explanation:
      "지문은 Eugene Garfield에 따르면 이 표현이 1942년 출간된 Logan Wilson의 저서에서 학술적 맥락으로 처음 등장했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-128",
    passageId: "metascience-open-science-p8",
    prompt:
      "What does the passage say citation impact correlates more closely with?",
    options: [
      "Article quality rather than journal circulation.",
      "The author's nationality rather than any journal metric.",
      "Journal circulation rather than article quality.",
      "Nothing measurable at all, according to the passage.",
    ],
    answer: 2,
    explanation:
      "지문은 저자에게 귀속되는 citation impact가 논문 품질보다 저널 유통량과 더 밀접하게 상관된다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-031",
    passageId: "metascience-citation-index-p7",
    prompt:
      "What figure does the passage give for Sub-Saharan Africa's share of global research output?",
    options: [
      "50% of the global population and 50% of global research output.",
      "13.5% of the global population but less than 1% of global research output.",
      "1% of the global population and 13.5% of global research output.",
      "None of the global population and none of the research output.",
    ],
    answer: 1,
    explanation:
      "지문은 Sub-Saharan Africa가 세계 인구의 13.5%를 차지하지만 세계 연구 산출의 1% 미만이라는 수치를 인용합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-074",
    passageId: "metascience-altmetrics-p2",
    prompt: "How do altmetrics gather data, per the passage?",
    options: [
      "Using public APIs across platforms with open scripts and algorithms.",
      "By manually surveying scientists about their opinions.",
      "By relying solely on printed journal subscription records.",
      "By using only proprietary, closed-source software.",
    ],
    answer: 0,
    explanation:
      "지문은 altmetrics가 여러 플랫폼의 공개 API를 오픈 스크립트와 알고리즘으로 활용해 데이터를 모은다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-102",
    passageId: "metascience-preprint-p6",
    prompt:
      "What kind of organizations operated the canceled preprint servers, according to the passage?",
    options: [
      "Only non-profit universities with no commercial interests.",
      "Only government agencies funded entirely by taxpayers.",
      "Mainly profit publishing companies, such as Nature Publishing Group and O'Reilly&SAGE.",
      "Only individual researchers working without institutional support.",
    ],
    answer: 2,
    explanation:
      "지문은 폐쇄된 preprint 서버들이 주로 Nature Publishing Group이나 O'Reilly&SAGE 같은 영리 출판사에 의해 운영되었다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-134",
    passageId: "metascience-publish-or-perish-p6",
    prompt:
      "What does the passage say about women's publication frequency and citations?",
    options: [
      "Women publish more frequently than men and receive more citations.",
      "There is no difference at all between men's and women's publication rates.",
      "Women receive more citations only in low-impact-factor journals.",
      "Women publish less frequently than men, and their work receives fewer citations even in higher-impact-factor journals.",
    ],
    answer: 3,
    explanation:
      "지문은 여성이 남성보다 덜 자주 게재하고, 더 높은 impact factor 저널에 실려도 인용을 덜 받는다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-054",
    passageId: "metascience-peer-review-p6",
    prompt:
      "What concern does the passage describe as 'role duality' in peer review?",
    options: [
      "Reviewers are never also authors in the same field.",
      "Editors have no role in the peer review process at all.",
      "People are simultaneously evaluators and evaluated, which biases their evaluator behavior.",
      "Only anonymous reviewers can ever be evaluated themselves.",
    ],
    answer: 2,
    explanation:
      "지문은 'role duality'를 평가자이면서 동시에 평가받는 위치에 있어 평가자로서의 행동에 편향이 생기는 문제라고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-109",
    passageId: "metascience-citation-analysis-p5",
    prompt: "What did Henry Small publish in 1973, according to the passage?",
    options: [
      "The first edition of the Science Citation Index.",
      "A paper proving the Poincaré conjecture.",
      "His classic work on Co-Citation analysis, which became a self-organizing classification system.",
      "The original h-index formula.",
    ],
    answer: 2,
    explanation:
      "지문은 1973년 Henry Small이 자기조직적 분류 체계가 된 Co-Citation analysis에 관한 대표 저작을 발표했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-005",
    passageId: "metascience-metascience-p5",
    prompt:
      "What does scientometrics concern itself with, as described in the passage?",
    options: [
      "Designing laboratory equipment used in chemistry experiments.",
      "Teaching undergraduate courses in the philosophy of mind.",
      "Measuring bibliographic data in scientific publications, including the impact of papers and journals.",
      "Regulating patents for pharmaceutical companies.",
    ],
    answer: 2,
    explanation:
      "지문은 scientometrics가 과학 출판물의 서지 데이터를 측정하며 논문과 학술지의 영향력 측정을 포함한다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-097",
    passageId: "metascience-preprint-p1",
    prompt: "What is a preprint, according to the passage?",
    options: [
      "A version of a scholarly paper that precedes formal peer review and publication in a peer-reviewed journal.",
      "A version of a paper published only after peer review is complete.",
      "A printed copy of a paper distributed exclusively to librarians.",
      "A legal document required before submitting any manuscript.",
    ],
    answer: 0,
    explanation:
      "지문은 preprint를 공식적인 peer review와 학술지 게재 이전 단계의 논문 버전이라고 정의합니다.",
    difficulty: 1,
  },
  {
    id: "dad-metascience-v2-055",
    passageId: "metascience-peer-review-p7",
    prompt:
      "What bias does the passage say the editorial peer review process has been found to have?",
    options: [
      "Strong bias in favor of studies with null results.",
      "No bias of any kind toward any type of result.",
      "Strong bias against studies with null results.",
      "Bias only against studies published in foreign languages.",
    ],
    answer: 2,
    explanation:
      "지문은 편집자 peer review 과정이 null result를 낸 연구에 강하게 편향되어 있다고 밝혀졌다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-071",
    passageId: "metascience-open-access-p7",
    prompt: "What does the passage say about green libre OA and costs?",
    options: [
      "Green libre OA always requires a large fee from the author.",
      "There are no costs or restrictions since preprints can be freely self-deposited with a free license.",
      "Green libre OA is banned in every country except the United States.",
      "Green libre OA can only be accessed by paying subscribers.",
    ],
    answer: 1,
    explanation:
      "지문은 green libre OA의 경우 preprint를 무료 라이선스로 자유롭게 셀프 아카이빙할 수 있어 비용이나 제한이 없다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-083",
    passageId: "metascience-science-and-technology-studies-p3",
    prompt:
      "What did Thomas Kuhn's 1962 book attribute changes in scientific theories to, per the passage?",
    options: [
      "Random chance with no underlying explanation at all.",
      "Only changes in government funding levels.",
      "Only the invention of new laboratory instruments.",
      "Changes in underlying intellectual paradigms.",
    ],
    answer: 3,
    explanation:
      "지문은 Thomas Kuhn의 1962년 저서가 과학 이론의 변화를 근본적인 지적 패러다임의 변화 탓으로 돌렸다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-029",
    passageId: "metascience-citation-index-p5",
    prompt:
      "What did Garfield's team do after receiving a 1961 NIH grant, according to the passage?",
    options: [
      "They gathered 1.4 million citations from 613 journals to compile a citation index for Genetics.",
      "They deleted all previous citation records from their archive.",
      "They compiled citations exclusively from unpublished manuscripts.",
      "They gathered exactly 613 million citations from 1.4 journals.",
    ],
    answer: 0,
    explanation:
      "지문은 1961년 NIH 보조금을 받은 뒤 Garfield의 팀이 613개 저널에서 140만 건의 인용을 모아 Genetics 분야 citation index를 만들었다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-138",
    passageId: "metascience-retraction-watch-p2",
    prompt:
      "What did Oransky and Marcus observe about retractions, per the passage?",
    options: [
      "Every retraction is always announced with a full public explanation.",
      "Retractions never affect any decisions made by other researchers.",
      "The reasons for retractions are always immediately publicized.",
      "Retractions generally are not announced, and their reasons are not publicized.",
    ],
    answer: 3,
    explanation:
      "지문은 Oransky와 Marcus가 논문 철회가 대개 공지되지 않고 그 이유도 공개되지 않는다는 점을 관찰했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-003",
    passageId: "metascience-metascience-p3",
    prompt:
      "What five areas does the passage say metascience can be categorized into?",
    options: [
      "Biology, Chemistry, Physics, Mathematics, and Astronomy.",
      "Funding, Marketing, Sales, Advertising, and Distribution.",
      "Methods, Reporting, Reproducibility, Evaluation, and Incentives.",
      "Teaching, Grading, Testing, Enrollment, and Graduation.",
    ],
    answer: 2,
    explanation:
      "지문은 metascience가 Methods, Reporting, Reproducibility, Evaluation, Incentives라는 다섯 영역으로 나뉠 수 있다고 말합니다.",
    difficulty: 1,
  },
  {
    id: "dad-metascience-v2-065",
    passageId: "metascience-open-access-p1",
    prompt: "What is open access, according to the passage?",
    options: [
      "A method of charging readers a premium fee for scientific articles.",
      "A legal requirement that all research must remain unpublished.",
      "A set of principles and practices delivering nominally copyrightable publications free of access charges or barriers.",
      "A system limiting access to publications to university faculty only.",
    ],
    answer: 2,
    explanation:
      "지문은 open access를 명목상 저작권이 있는 출판물을 접근 비용이나 장벽 없이 독자에게 전달하는 원칙과 관행의 집합이라고 정의합니다.",
    difficulty: 1,
  },
  {
    id: "dad-metascience-v2-113",
    passageId: "metascience-scientific-literature-p1",
    prompt:
      "What does scientific literature primarily consist of, according to the passage?",
    options: [
      "Academic papers that present original empirical research and theoretical contributions.",
      "Only fictional novels written by scientists.",
      "Only newspaper articles summarizing scientific press releases.",
      "Only textbooks used in undergraduate courses.",
    ],
    answer: 0,
    explanation:
      "지문은 scientific literature가 주로 독창적인 실증 연구와 이론적 기여를 제시하는 학술 논문으로 이루어진다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-metascience-v2-116",
    passageId: "metascience-scientific-literature-p4",
    prompt:
      "What do James G. Speight and Russell Foote say about peer-reviewed journals, according to the passage?",
    options: [
      "They are the least respected form of scientific communication.",
      "They are the most prominent and prestigious form of publication.",
      "They have been entirely replaced by conference proceedings.",
      "They are never cited in any subsequent scientific work.",
    ],
    answer: 1,
    explanation:
      "지문은 James G. Speight와 Russell Foote가 peer-reviewed 저널을 가장 두드러지고 권위 있는 출판 형태라고 말했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-082",
    passageId: "metascience-science-and-technology-studies-p2",
    prompt: "What happened at MIT in the 1970s, according to the passage?",
    options: [
      "Elting E. Morison founded the STS program, which served as a model, and by 2011 there were 111 such programs.",
      "MIT banned all interdisciplinary programs about science and society.",
      "MIT closed its only STS program permanently.",
      "MIT became the only university ever to study STS.",
    ],
    answer: 0,
    explanation:
      "지문은 1970년대 MIT에서 Elting E. Morison이 STS 프로그램을 세워 모델이 되었고 2011년까지 111개 프로그램이 생겼다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-metascience-v2-118",
    passageId: "metascience-scientific-literature-p6",
    prompt:
      "What three essential elements make up performing a review article, per the passage?",
    options: [
      "The author's salary, the journal's price, and the printer's location.",
      "The study's purpose, the selection of documents, and the data assessment method.",
      "The cover design, the font size, and the page count.",
      "The publication date, the ISBN number, and the shelf location.",
    ],
    answer: 1,
    explanation:
      "지문은 리뷰 논문을 작성하는 세 가지 필수 요소가 연구 목적, 문헌 선정, 데이터 평가 방법이라고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-059",
    passageId: "metascience-replication-crisis-p3",
    prompt:
      "What new scientific discipline arose from considering causes and remedies of the replication crisis, per the passage?",
    options: [
      "Astrophysics, which studies distant galaxies.",
      "Bibliometrics, which existed long before the crisis began.",
      "Metascience, which uses empirical research methods to examine empirical research practice.",
      "Organic chemistry, which focuses on carbon compounds.",
    ],
    answer: 2,
    explanation:
      "지문은 재현 위기의 원인과 해결책을 고민하는 과정에서 metascience라는 새로운 학문이 생겨났다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-087",
    passageId: "metascience-science-and-technology-studies-p7",
    prompt:
      "What did Trevor Pinch and Wiebe Bijker show in a seminal 1984 article, per the passage?",
    options: [
      "That technology has no relationship whatsoever to sociology.",
      "That the sociology of scientific knowledge should be abandoned.",
      "That only economists could study the sociology of technology.",
      "How the sociology of technology could proceed along lines established by the sociology of scientific knowledge.",
    ],
    answer: 3,
    explanation:
      "지문은 1984년 Trevor Pinch와 Wiebe Bijker의 논문이 기술사회학이 과학지식사회학의 이론·방법론적 노선을 따를 수 있음을 보였다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-061",
    passageId: "metascience-replication-crisis-p5",
    prompt: "What is one goal of registered reports, per the passage?",
    options: [
      "To circumvent the publication bias toward significant findings that can lead to questionable research practices.",
      "To eliminate the need for any peer review whatsoever.",
      "To ensure that only null results are ever published.",
      "To increase the cost of submitting a manuscript.",
    ],
    answer: 0,
    explanation:
      "지문은 registered report의 목표 중 하나가 유의미한 결과 쪽으로 쏠리는 출판 편향을 우회하는 것이라고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-095",
    passageId: "metascience-reproducibility-p7",
    prompt:
      "What three stages make up a basic workflow for reproducible research, according to the passage?",
    options: [
      "Data acquisition, data processing, and data analysis.",
      "Data destruction, data concealment, and data falsification.",
      "Grant writing, conference attendance, and peer review.",
      "Hypothesis rejection, funding denial, and publication refusal.",
    ],
    answer: 0,
    explanation:
      "지문은 재현 가능한 연구를 위한 기본 워크플로우가 데이터 수집, 데이터 처리, 데이터 분석으로 이루어진다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-121",
    passageId: "metascience-open-science-p1",
    prompt: "What is open science, according to the passage?",
    options: [
      "A movement to make scientific research transparent and accessible to all levels of society through collaborative networks.",
      "A movement to restrict scientific research to a small elite group.",
      "A government program that funds only closed, classified research.",
      "A private corporate strategy to hide research results.",
    ],
    answer: 0,
    explanation:
      "지문은 open science를 협력 네트워크를 통해 과학 연구를 사회 모든 계층에 투명하고 접근 가능하게 만드는 운동이라고 정의합니다.",
    difficulty: 1,
  },
  {
    id: "dad-metascience-v2-072",
    passageId: "metascience-open-access-p8",
    prompt: "What does the acronym FAIR stand for, according to the passage?",
    options: [
      "Free, anonymous, indexed, and reviewed.",
      "Funded, archived, indexed, and released.",
      "Formal, academic, institutional, and regulated.",
      "Findable, accessible, interoperable and reusable.",
    ],
    answer: 3,
    explanation:
      "지문은 FAIR가 findable, accessible, interoperable, reusable의 약자라고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-metascience-v2-040",
    passageId: "metascience-impact-factor-p8",
    prompt:
      "What did 2020 research on dentistry journals conclude, per the passage?",
    options: [
      "The publication of systematic reviews has a significant effect on the Journal Impact Factor.",
      "Systematic reviews have no measurable effect on any journal's impact factor.",
      "Only clinical trial papers can raise a journal's impact factor.",
      "Dentistry journals never publish any review articles.",
    ],
    answer: 0,
    explanation:
      "지문은 2020년 치의학 저널 연구가 systematic review 게재가 Journal Impact Factor에 유의미한 영향을 준다고 결론지었다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-144",
    passageId: "metascience-retraction-watch-p8",
    prompt:
      "What partnership does the passage describe with the Center for Open Science?",
    options: [
      "A partnership that ended all retraction database projects.",
      "A partnership focused solely on unrelated chemistry research.",
      "Creating a retraction database on the Open Science Framework, funded by the Laura and John Arnold Foundation.",
      "A partnership that excluded any foundation funding whatsoever.",
    ],
    answer: 2,
    explanation:
      "지문은 Laura and John Arnold Foundation의 지원을 받는 Center for Open Science와 협력해 Open Science Framework에 철회 데이터베이스를 만들었다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-103",
    passageId: "metascience-preprint-p7",
    prompt: "When did the sharing of preprints begin, per the passage?",
    options: [
      "Only after the invention of the internet in the 1990s.",
      "At least the 1960s, when the National Institutes of Health circulated biological preprints.",
      "Only after arXiv was founded in the 21st century.",
      "Only in ancient Greece, thousands of years ago.",
    ],
    answer: 1,
    explanation:
      "지문은 preprint 공유가 적어도 1960년대, 미국 국립보건원이 생물학 preprint를 배포하던 시기부터 시작되었다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-079",
    passageId: "metascience-altmetrics-p7",
    prompt:
      "What relationship between tweetations and citations does the passage describe?",
    options: [
      "Tweetations definitively cause higher citation counts.",
      "There is no relationship of any kind between the two.",
      "A correlation exists, but it is not established to be a causative relationship.",
      "Citations always precede and cause tweetations.",
    ],
    answer: 2,
    explanation:
      "지문은 트윗언급과 인용 사이에 상관관계는 있지만 인과관계로 확립되지는 않았다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-014",
    passageId: "metascience-bibliometrics-p6",
    prompt:
      "What did Samuel Bradford's law of scattering describe, per the passage?",
    options: [
      "A steady, linear increase in the number of citations per journal.",
      "The complete absence of any pattern in bibliographic indexing.",
      "Exponentially diminishing returns of searching for references in science journals as more work must be consulted.",
      "A fixed number of journals required to cover any research topic.",
    ],
    answer: 2,
    explanation:
      "지문은 Bradford의 산란 법칙이 과학 저널에서 참고문헌을 찾을 때 더 많은 자료를 참고할수록 수익이 지수적으로 줄어드는 현상을 설명한다고 말합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-025",
    passageId: "metascience-citation-index-p1",
    prompt: "What is a citation index, according to the passage?",
    options: [
      "A list ranking scientists by their personal wealth.",
      "A record of laboratory equipment purchases by universities.",
      "A kind of bibliographic index that lets users establish which later documents cite which earlier documents.",
      "A catalog of unpublished manuscripts rejected by journals.",
    ],
    answer: 2,
    explanation:
      "지문은 citation index를 이후 문서가 이전 문서를 어떻게 인용하는지 쉽게 파악하게 해주는 서지 색인이라고 정의합니다.",
    difficulty: 1,
  },
  {
    id: "dad-metascience-v2-047",
    passageId: "metascience-h-index-p7",
    prompt:
      "What h-index value did Hirsch suggest might be typical for tenure advancement for physicists, per the passage?",
    options: [
      "About 60, the value of a 'truly unique' individual.",
      "About 12, for advancement to tenure at major US research universities.",
      "About 1, the minimum value any published scientist would have.",
      "About 200, the highest value ever recorded for any scientist.",
    ],
    answer: 1,
    explanation:
      "지문은 Hirsch가 물리학자의 경우 h값 약 12가 주요 미국 연구대학의 종신재직권 승진에 전형적일 수 있다고 제안했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-048",
    passageId: "metascience-h-index-p8",
    prompt:
      "What h-index did Hirsch estimate for an 'outstanding scientist' after 20 years, according to the passage?",
    options: [
      "An h-index of 20.",
      "An h-index of 60.",
      "An h-index of 40.",
      "An h-index of 12.",
    ],
    answer: 2,
    explanation:
      "지문은 Hirsch가 20년 뒤 '뛰어난 과학자'의 h-index를 40으로 추정했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-104",
    passageId: "metascience-preprint-p8",
    prompt: "What was proposed in February 2017, according to the passage?",
    options: [
      "A coalition including NIH, the Medical Research Council, and Wellcome Trust proposed a central site for life-sciences preprints.",
      "A complete ban on all preprint servers worldwide.",
      "The very first preprint server ever created.",
      "A requirement that all journals stop accepting preprints entirely.",
    ],
    answer: 0,
    explanation:
      "지문은 2017년 2월 NIH, Medical Research Council, Wellcome Trust를 포함한 연합이 생명과학 preprint를 위한 중앙 사이트를 제안했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-108",
    passageId: "metascience-citation-analysis-p4",
    prompt:
      "What field blossomed with the advent of the Science Citation Index, according to the passage?",
    options: [
      "Organic chemistry, unrelated to citation counting.",
      "Marine biology, unrelated to publication records.",
      "Astronomy, unrelated to any bibliographic index.",
      "Citation analysis, sometimes called scientometrics or bibliometrics.",
    ],
    answer: 3,
    explanation:
      "지문은 Science Citation Index의 등장과 함께 scientometrics 또는 bibliometrics라고도 불리는 citation analysis 분야가 크게 발전했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-119",
    passageId: "metascience-scientific-literature-p7",
    prompt:
      "How is work on a project typically published, according to the passage?",
    options: [
      "As one or more technical reports or articles, sometimes with preliminary reports or preprints first.",
      "Only as a single final book with no preliminary versions.",
      "Only as a verbal presentation with no written record.",
      "Only as a patent application with no accompanying article.",
    ],
    answer: 0,
    explanation:
      "지문은 프로젝트에 대한 작업이 예비 보고서나 preprint를 먼저 거친 뒤 하나 이상의 기술 보고서나 논문으로 발표되는 경우가 많다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-057",
    passageId: "metascience-replication-crisis-p1",
    prompt: "What does the passage say the replication crisis refers to?",
    options: [
      "The complete absence of scientific publishing since 2010.",
      "Widespread failures to reproduce published scientific results.",
      "A crisis in which too many studies are replicated exactly.",
      "A shortage of researchers willing to conduct any experiments.",
    ],
    answer: 1,
    explanation:
      "지문은 replication crisis가 발표된 과학적 결과를 재현하는 데 광범위하게 실패하는 현상을 가리킨다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-metascience-v2-085",
    passageId: "metascience-science-and-technology-studies-p5",
    prompt:
      "What sense motivated the emergence of science, engineering, and public policy studies in the 1970s, per the passage?",
    options: [
      "A sense that science and technology needed no public oversight at all.",
      "A sense that science and technology were developing in ways at odds with the public's best interests.",
      "A belief that public policy should never involve engineers.",
      "A conviction that science funding should be entirely eliminated.",
    ],
    answer: 1,
    explanation:
      "지문은 1970년대 과학·공학·공공정책 연구의 등장이 과학기술 발전이 대중의 이익과 어긋난다는 인식에서 비롯되었다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-112",
    passageId: "metascience-citation-analysis-p8",
    prompt:
      "Who introduced automatic citation indexing in 1998, per the passage?",
    options: [
      "Lee Giles, Steve Lawrence, and Kurt Bollacker.",
      "Eugene Garfield and Irving Sher.",
      "Derek J. de Solla Price alone.",
      "Henry Small and Vasily Nalimov.",
    ],
    answer: 0,
    explanation:
      "지문은 1998년 Lee Giles, Steve Lawrence, Kurt Bollacker가 automatic citation indexing을 도입했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-039",
    passageId: "metascience-impact-factor-p7",
    prompt:
      "What decisions does impact factor data influence, according to the passage?",
    options: [
      "Only the color scheme used on a journal's website.",
      "Solely the physical location of a university's science building.",
      "Where to publish, whom to promote or hire, grant application success, and even salary bonuses.",
      "Only the number of seats available in a lecture hall.",
    ],
    answer: 2,
    explanation:
      "지문은 impact factor 데이터가 어디에 게재할지, 누구를 승진·채용할지, 연구비 신청 성공 여부, 심지어 상여금까지 영향을 준다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-009",
    passageId: "metascience-bibliometrics-p1",
    prompt: "What does the passage say bibliometrics is?",
    options: [
      "A method for producing chemical compounds in a laboratory.",
      "A branch of astronomy studying the motion of comets.",
      "A legal framework for regulating scientific patents.",
      "The application of statistical methods to the study of bibliographic data.",
    ],
    answer: 3,
    explanation:
      "지문은 bibliometrics를 서지 데이터 연구에 통계적 방법을 적용하는 것이라고 정의합니다.",
    difficulty: 1,
  },
  {
    id: "dad-metascience-v2-098",
    passageId: "metascience-preprint-p2",
    prompt:
      "What purpose do preprints serve regarding intellectual property, per the passage?",
    options: [
      "Preventing any researcher from ever claiming a discovery.",
      "Guaranteeing automatic patent rights for the first author.",
      "Eliminating the need for any patent applications at all.",
      "Demonstrating precedence of discoveries and helping block patenting or discourage competitors.",
    ],
    answer: 3,
    explanation:
      "지문은 preprint가 발견의 우선권을 입증하고 특허 선점이나 경쟁자를 저지하는 데 쓰일 수 있다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-139",
    passageId: "metascience-retraction-watch-p3",
    prompt:
      "What happened with the PNAS breast cancer drug paper example, according to the passage?",
    options: [
      "The paper was never retracted despite being fully discredited.",
      "The paper was later retracted, but its retraction was not reported in media that had covered its positive conclusions.",
      "The retraction received more media coverage than the original paper.",
      "No company was ever established based on the paper's findings.",
    ],
    answer: 1,
    explanation:
      "지문은 PNAS의 유방암 치료제 논문 사례에서 논문이 결국 철회되었지만, 그 철회가 원래 긍정적 결론을 보도했던 매체에는 보도되지 않았다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-132",
    passageId: "metascience-publish-or-perish-p4",
    prompt: "What is publish-or-perish linked to, according to the passage?",
    options: [
      "A complete absence of any ethical concerns in academia.",
      "The total elimination of scientific misconduct.",
      "Scientific misconduct or at least questionable ethics.",
      "Only positive outcomes for research quality.",
    ],
    answer: 2,
    explanation:
      "지문은 publish-or-perish가 과학적 부정행위 또는 적어도 의심스러운 윤리와 연관되어 있다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-022",
    passageId: "metascience-scientometrics-p6",
    prompt:
      "What increased around the turn of the century, according to the passage?",
    options: [
      "The number of scientists refusing government funding entirely.",
      "The requirement that all research be conducted without funding.",
      "Government interest in evaluating research to assess the impact of science funding.",
      "The elimination of all research evaluation programs.",
    ],
    answer: 2,
    explanation:
      "지문은 세기 전환기 무렵 정부가 과학 지원의 영향을 평가하기 위해 연구 평가에 대한 관심이 커졌다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-094",
    passageId: "metascience-reproducibility-p6",
    prompt:
      "How does the passage distinguish repeatability from reproducibility?",
    options: [
      "They are identical terms used interchangeably in every field.",
      "Repeatability involves the same researchers repeating within the same study; reproducibility requires an independent team.",
      "Repeatability requires an independent team, while reproducibility does not.",
      "Reproducibility applies only to computational research, never experiments.",
    ],
    answer: 1,
    explanation:
      "지문은 repeatability가 같은 연구자가 같은 연구 내에서 반복하는 것이고, reproducibility는 독립적인 연구팀의 성공적 재현이 있어야 인정된다고 구분합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-006",
    passageId: "metascience-metascience-p6",
    prompt:
      "What did metascience research find about Nobel Prizes, per the passage?",
    options: [
      "Nobel Prizes were distributed evenly across all 71 scientific domains.",
      "Work honored by Nobel Prizes clustered in only a few scientific fields, with only 36/71 domains having received one.",
      "No scientific domain has ever received more than one Nobel Prize.",
      "Nobel Prizes are awarded strictly by the number of publications produced.",
    ],
    answer: 1,
    explanation:
      "지문은 노벨상을 받은 연구가 소수의 과학 분야에 몰려 있고 71개 분야 중 36개만 적어도 하나의 노벨상을 받았다고 말합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-036",
    passageId: "metascience-impact-factor-p4",
    prompt:
      "What items does the passage say are excluded from the definition of 'publications' used to calculate impact factor?",
    options: [
      "Articles, reviews, and proceedings papers.",
      "Only articles published in the current calendar year.",
      "All items published by the Web of Science database.",
      "Editorials, corrections, notes, retractions, and discussions.",
    ],
    answer: 3,
    explanation:
      "지문은 impact factor 계산에서 '출판물'의 정의가 editorial, correction, note, retraction, discussion 같은 항목을 제외한다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-115",
    passageId: "metascience-scientific-literature-p3",
    prompt: "What do secondary sources comprise, per the passage?",
    options: [
      "Only raw laboratory data with no interpretation at all.",
      "Only unpublished personal diaries of scientists.",
      "Review articles summarizing published studies and books tackling extensive projects or arguments.",
      "Only advertisements for scientific equipment.",
    ],
    answer: 2,
    explanation:
      "지문은 secondary sources가 발표된 연구를 요약하는 review 논문과 방대한 프로젝트나 주장을 다루는 책으로 구성된다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-053",
    passageId: "metascience-peer-review-p5",
    prompt:
      "What did California's 1997 Senate Bill 1320 require, per the passage?",
    options: [
      "That scientific findings behind CalEPA rule-making be submitted for independent external scientific peer review.",
      "That all California universities cancel their peer review programs.",
      "That CalEPA rules be adopted without any scientific review.",
      "That only federal agencies could review California's scientific rules.",
    ],
    answer: 0,
    explanation:
      "지문은 캘리포니아의 1997년 Senate Bill 1320이 CalEPA 규칙 제정의 과학적 근거를 독립적인 외부 peer review에 제출하도록 요구했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-019",
    passageId: "metascience-scientometrics-p3",
    prompt: "What is the term scientometrics a calque of, per the passage?",
    options: [
      "A Latin phrase meaning the measurement of stars.",
      "A German word coined by Max Planck in 1900.",
      "The Russian term naukometriya, introduced by Vasily Nalimov in 1966.",
      "A French term originating from 19th-century chemistry.",
    ],
    answer: 2,
    explanation:
      "지문은 scientometrics라는 용어가 1966년 Vasily Nalimov가 도입한 러시아어 naukometriya를 옮긴 말이라고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-038",
    passageId: "metascience-impact-factor-p6",
    prompt:
      "What reasoning does the passage present for why impact factor is used as a quality measure?",
    options: [
      "It fits the existing opinion of which journals in a field are best, and no better tool yet exists.",
      "It was proven mathematically to be the only valid quality metric.",
      "It replaced peer review entirely as the sole quality check.",
      "It was invented specifically to measure individual researcher merit.",
    ],
    answer: 0,
    explanation:
      "지문은 impact factor가 해당 분야에서 이미 형성된 '최고의 저널'이라는 의견과 맞아떨어지고 더 나은 대안이 없어서 널리 쓰인다는 논리를 제시합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-101",
    passageId: "metascience-preprint-p5",
    prompt: "How does the passage categorize preprint servers?",
    options: [
      "Into paid, free, and banned categories only.",
      "Into ancient, medieval, and modern categories.",
      "Into government, corporate, and religious categories.",
      "Into general, field-specific, and regional categories.",
    ],
    answer: 3,
    explanation:
      "지문은 preprint 서버를 general, field-specific, regional의 세 범주로 나눌 수 있다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-007",
    passageId: "metascience-metascience-p7",
    prompt:
      "What did a study find about the size of scientific teams, according to the passage?",
    options: [
      "Teams are growing in size, increasing by an average of 17% per decade.",
      "Teams have been shrinking by an average of 17% per decade.",
      "Team size has remained exactly constant since the 1950s.",
      "Only single-author teams have grown in the last decade.",
    ],
    answer: 0,
    explanation:
      "지문은 한 연구가 과학 연구팀의 규모가 10년마다 평균 17%씩 커지고 있다는 것을 발견했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-089",
    passageId: "metascience-reproducibility-p1",
    prompt: "What does the passage say reproducibility underpins?",
    options: [
      "The scientific method, requiring results to be achieved again with high reliability when replicated.",
      "Only the marketing of scientific products to the public.",
      "The legal enforcement of copyright on scientific papers.",
      "The pricing structure of academic journal subscriptions.",
    ],
    answer: 0,
    explanation:
      "지문은 reproducibility가 과학적 방법의 핵심 원리로, 연구를 재현했을 때 높은 신뢰도로 결과가 다시 나와야 한다고 요구한다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-metascience-v2-110",
    passageId: "metascience-citation-analysis-p6",
    prompt:
      "What did a 1965 landmark paper by Garfield and Sher show, per the passage?",
    options: [
      "Nobel Prize winners published fewer papers than the average scientist.",
      "Citation frequency has no relationship to scientific eminence at all.",
      "Nobel Prize winners were never cited more than once.",
      "Nobel Prize winners published five times the average number of papers and were cited 30 to 50 times the average.",
    ],
    answer: 3,
    explanation:
      "지문은 1965년 Garfield와 Sher의 논문이 노벨상 수상자가 평균의 5배 많은 논문을 발표하고 30~50배 많이 인용되었음을 보였다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-002",
    passageId: "metascience-metascience-p2",
    prompt:
      "What did John Ioannidis argue in his 2005 paper according to the passage?",
    options: [
      "A majority of papers in the medical field produce conclusions that are wrong.",
      "Nearly all medical papers reach conclusions that are correct.",
      "Only a minority of physics papers contain any errors.",
      "Peer review always prevents false conclusions from being published.",
    ],
    answer: 0,
    explanation:
      "지문은 2005년 Ioannidis가 의학 분야 논문의 대다수가 잘못된 결론을 낸다고 주장했다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-metascience-v2-033",
    passageId: "metascience-impact-factor-p1",
    prompt:
      "What does the passage say about journals with higher impact-factor values?",
    options: [
      "They are automatically banned from receiving further funding.",
      "They are considered more prestigious or important within their field.",
      "They are considered less important than journals with no impact factor.",
      "They must be republished every year to remain valid.",
    ],
    answer: 1,
    explanation:
      "지문은 impact factor 값이 높은 저널이 해당 분야에서 더 권위 있거나 중요하다고 여겨진다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-metascience-v2-049",
    passageId: "metascience-peer-review-p1",
    prompt: "What is peer review, according to the passage?",
    options: [
      "A process in which only government officials evaluate research.",
      "A process in which a single senior editor makes all decisions alone.",
      "A form of automated evaluation performed only by software.",
      "The evaluation of work by one or more people with similar competencies as the producers of the work.",
    ],
    answer: 3,
    explanation:
      "지문은 peer review를 연구 생산자와 비슷한 역량을 가진 한 명 이상이 그 작업을 평가하는 것이라고 정의합니다.",
    difficulty: 1,
  },
  {
    id: "dad-metascience-v2-093",
    passageId: "metascience-reproducibility-p5",
    prompt:
      "What term is used when new data are obtained in an attempt to achieve reproducibility, per the passage?",
    options: [
      "Repeatability, referring only to the original researchers.",
      "Replicability, and the new study is called a replication.",
      "Reliability, referring only to statistical significance.",
      "Validity, referring only to theoretical soundness.",
    ],
    answer: 1,
    explanation:
      "지문은 재현성을 얻기 위해 새로운 데이터를 얻는 경우를 replicability라 부르고 그 새 연구를 replication이라 한다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-096",
    passageId: "metascience-reproducibility-p8",
    prompt:
      "What did a 2006 study find about APA authors sharing data, per the passage?",
    options: [
      "All 141 authors immediately shared their data upon request.",
      "Only one author out of 141 declined to share data.",
      "103 of 141 authors (73%) did not respond with their data over a six-month period.",
      "The study found no APA authors willing to be contacted at all.",
    ],
    answer: 2,
    explanation:
      "지문은 2006년 연구에서 APA 논문 저자 141명 중 103명(73%)이 6개월 동안 데이터 요청에 응답하지 않았다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-088",
    passageId: "metascience-science-and-technology-studies-p8",
    prompt:
      "What field did Pinch and Bijker's work found the intellectual basis for, according to the passage?",
    options: [
      "The theory of general relativity.",
      "Classical laboratory chemistry.",
      "The social construction of technology.",
      "The field of astrophysics.",
    ],
    answer: 2,
    explanation:
      "지문은 Pinch와 Bijker의 연구가 '기술의 사회적 구성'이라는 분야의 지적 토대를 놓았다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-016",
    passageId: "metascience-bibliometrics-p8",
    prompt:
      "What limitation constrained the first working online retrieval system prototype in 1963, per the passage?",
    options: [
      "It could index unlimited documents but only in one language.",
      "Memory issues meant no more than 10,000 words of a few documents could be indexed.",
      "It required no computer hardware at all to operate.",
      "It could only be used to search legal case law, not science.",
    ],
    answer: 1,
    explanation:
      "지문은 1963년 최초의 온라인 검색 시스템 시제품이 메모리 문제로 소수 문서의 1만 단어까지만 색인할 수 있었다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-143",
    passageId: "metascience-retraction-watch-p7",
    prompt: "What growth in retractions does the passage describe?",
    options: [
      "From an estimated 80 papers retracted annually to about 200 in the blog's first year, and over 50,000 database entries by 2024.",
      "A steady decline from 200 retractions to zero by 2024.",
      "No change at all in the annual number of retractions.",
      "A drop from 50,000 entries to only 80 entries by 2024.",
    ],
    answer: 0,
    explanation:
      "지문은 연간 약 80건으로 추정되던 철회가 블로그 첫해에 약 200건으로 늘었고, 2024년까지 데이터베이스 항목이 5만 건을 넘었다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-045",
    passageId: "metascience-h-index-p5",
    prompt:
      "What earlier metric is the Hirsch index compared to in the passage?",
    options: [
      "The Eddington number, an earlier metric used for evaluating cyclists.",
      "The Richter scale used for measuring earthquakes.",
      "The Dow Jones Industrial Average used in finance.",
      "The Fahrenheit scale used for temperature.",
    ],
    answer: 0,
    explanation:
      "지문은 Hirsch index가 사이클 선수 평가에 쓰이던 이전 지표인 Eddington number와 유사하다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-056",
    passageId: "metascience-peer-review-p8",
    prompt:
      "What has a Nature survey confirmed through interviews, according to the passage?",
    options: [
      "That artificial intelligence has never been used in peer review.",
      "The possibly undeclared use of artificial intelligence to assist or perform peer review.",
      "That all reviewers openly declare every tool they use.",
      "That peer review no longer occurs in any scientific field.",
    ],
    answer: 1,
    explanation:
      "지문은 Nature의 설문 인터뷰가 인공지능이 신고되지 않은 채 peer review를 보조하거나 수행하는 데 쓰이고 있음을 확인했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-060",
    passageId: "metascience-replication-crisis-p4",
    prompt:
      "What does the registered report format require, according to the passage?",
    options: [
      "Authors submit their finished results only after all data is collected.",
      "Authors are anonymous and never disclose their methods at all.",
      "Authors submit a description of study methods and analyses prior to data collection.",
      "Journals publish only studies with statistically significant findings.",
    ],
    answer: 2,
    explanation:
      "지문은 registered report 형식이 저자가 데이터 수집 전에 연구 방법과 분석 계획을 제출하도록 요구한다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-044",
    passageId: "metascience-h-index-p4",
    prompt:
      "How does the passage describe the formal computation of the h-index?",
    options: [
      "Order citation counts from largest to smallest, then find the last position where the count is at least that position.",
      "Add up every citation count and divide by the number of publications.",
      "Count only the single most-cited publication and ignore the rest.",
      "Multiply the number of publications by the average citation count.",
    ],
    answer: 0,
    explanation:
      "지문은 인용 수를 큰 순서로 정렬한 뒤 그 값이 순위 이상인 마지막 위치를 h로 삼는 것이 공식적인 계산법이라고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-078",
    passageId: "metascience-altmetrics-p6",
    prompt: "What is the 'Twimpact factor' described in the passage?",
    options: [
      "The number of Tweets an article receives in the first seven days of publication.",
      "The total number of citations an article ever receives.",
      "The number of years an article has been in print.",
      "The number of co-authors listed on an article.",
    ],
    answer: 0,
    explanation:
      "지문은 'Twimpact factor'를 논문 출판 후 첫 7일 동안 받은 트윗 수라고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-018",
    passageId: "metascience-scientometrics-p2",
    prompt:
      "Whose work is modern scientometrics mostly based on, according to the passage?",
    options: [
      "Isaac Newton and Albert Einstein.",
      "Derek J. de Solla Price and Eugene Garfield.",
      "Charles Darwin and Gregor Mendel.",
      "Marie Curie and Ernest Rutherford.",
    ],
    answer: 1,
    explanation:
      "지문은 현대 scientometrics가 주로 Derek J. de Solla Price와 Eugene Garfield의 연구에 기반한다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-metascience-v2-001",
    passageId: "metascience-metascience-p1",
    prompt: "How does the passage define metascience?",
    options: [
      "A subfield of chemistry that studies laboratory instruments.",
      "A branch of mathematics devoted only to statistical formulas.",
      "A government program that funds individual scientists directly.",
      "The systematic study of science itself, analyzing practices such as research design, peer review, and replication.",
    ],
    answer: 3,
    explanation:
      "지문은 metascience를 과학 자체를 체계적으로 연구하는 분야로, research design과 peer review, replication 같은 관행을 분석한다고 정의합니다.",
    difficulty: 1,
  },
  {
    id: "dad-metascience-v2-037",
    passageId: "metascience-impact-factor-p5",
    prompt:
      "How is the five-year impact factor calculated, according to the passage?",
    options: [
      "By dividing the number of editors by the number of articles.",
      "By dividing the number of citations in a given year by the number of articles published in the previous five years.",
      "By multiplying the one-year impact factor by five.",
      "By counting only citations that occurred exactly five years ago.",
    ],
    answer: 1,
    explanation:
      "지문은 5년 impact factor가 특정 연도의 인용 수를 그 이전 5년간 발표된 논문 수로 나누어 계산된다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-020",
    passageId: "metascience-scientometrics-p4",
    prompt: "What organization was founded in 1993, according to the passage?",
    options: [
      "The International Society for Scientometrics and Informetrics.",
      "The United Nations Educational, Scientific and Cultural Organization.",
      "The International Olympic Committee.",
      "The World Health Organization's research division.",
    ],
    answer: 0,
    explanation:
      "지문은 1993년 International Society for Scientometrics and Informetrics가 설립되었다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-metascience-v2-068",
    passageId: "metascience-open-access-p4",
    prompt:
      "What are journals called that publish open access without charging authors, per the passage?",
    options: [
      "Gold or bronze OA.",
      "Diamond or platinum OA.",
      "Hybrid or green OA.",
      "Closed or subscription OA.",
    ],
    answer: 1,
    explanation:
      "지문은 저자에게 비용을 청구하지 않고 open access로 출판하는 저널을 diamond 또는 platinum OA라고 부른다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-metascience-v2-084",
    passageId: "metascience-science-and-technology-studies-p4",
    prompt:
      "What helped launch new interdisciplinary fields in the mid-to-late 1960s, according to the passage?",
    options: [
      "A single United Nations treaty on higher education.",
      "Student and faculty social movements in the U.S., UK, and European universities.",
      "The invention of the personal computer.",
      "A worldwide ban on university research funding.",
    ],
    answer: 1,
    explanation:
      "지문은 1960년대 중후반 미국, 영국, 유럽 대학의 학생과 교수 사회 운동이 새로운 학제간 분야의 출범을 도왔다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-076",
    passageId: "metascience-altmetrics-p4",
    prompt:
      "What did the Public Library of Science introduce in March 2009, according to the passage?",
    options: [
      "A ban on all forms of citation counting.",
      "The very first academic journal ever published.",
      "Article-level metrics for all of its articles.",
      "A requirement that authors pay to read their own work.",
    ],
    answer: 2,
    explanation:
      "지문은 2009년 3월 Public Library of Science가 모든 논문에 대해 article-level metrics를 도입했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-030",
    passageId: "metascience-citation-index-p6",
    prompt:
      "Which two databases does the passage name as major citation index providers?",
    options: [
      "Google Search and Microsoft Word.",
      "PubMed and the Library of Congress catalog only.",
      "Web of Science by Clarivate Analytics and Scopus by Elsevier.",
      "Wikipedia and Encyclopaedia Britannica.",
    ],
    answer: 2,
    explanation:
      "지문은 Clarivate Analytics의 Web of Science와 Elsevier의 Scopus를 주요 citation index 데이터베이스로 언급합니다.",
    difficulty: 1,
  },
  {
    id: "dad-metascience-v2-141",
    passageId: "metascience-retraction-watch-p5",
    prompt:
      "What did Retraction Watch maintain during the COVID-19 pandemic, according to the passage?",
    options: [
      "A separate list of retracted articles that added to misinformation about the pandemic.",
      "A list of only accurate, non-retracted COVID-19 articles.",
      "No list related to COVID-19 research at all.",
      "A list of retracted articles about unrelated historical diseases.",
    ],
    answer: 0,
    explanation:
      "지문은 Retraction Watch가 코로나19 팬데믹 기간 동안 팬데믹 관련 잘못된 정보를 더한 철회 논문들의 별도 목록을 유지했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-137",
    passageId: "metascience-retraction-watch-p1",
    prompt: "What is Retraction Watch, according to the passage?",
    options: [
      "A government agency that enforces scientific misconduct laws.",
      "A blog that reports on retractions of scientific papers, launched in August 2010 by Ivan Oransky and Adam Marcus.",
      "A print-only magazine with no online presence at all.",
      "A university course teaching students how to write papers.",
    ],
    answer: 1,
    explanation:
      "지문은 Retraction Watch를 2010년 8월 Ivan Oransky와 Adam Marcus가 만든, 과학 논문 철회를 보도하는 블로그라고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-metascience-v2-111",
    passageId: "metascience-citation-analysis-p7",
    prompt:
      "What did Garfield and Sher demonstrate in their 1964 study on the history of DNA, according to the passage?",
    options: [
      "That DNA research had never been cited by any other scientist.",
      "The potential for generating historiographs, topological maps of important steps in a scientific topic's history.",
      "That citation analysis could not be applied to the history of science.",
      "That historiographs could only be drawn by hand, never automated.",
    ],
    answer: 1,
    explanation:
      "지문은 1964년 Garfield와 Sher의 DNA 역사 연구가 과학 주제의 역사적 주요 단계를 보여주는 historiograph 생성 가능성을 입증했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-107",
    passageId: "metascience-citation-analysis-p3",
    prompt:
      "What applications of citation analysis tools does the passage mention?",
    options: [
      "Determining the price of laboratory chemicals.",
      "Scheduling university sports events.",
      "Identifying expert referees and supporting academic merit review, tenure, and promotion decisions.",
      "Designing the layout of library buildings.",
    ],
    answer: 2,
    explanation:
      "지문은 citation analysis 도구가 전문 심사자를 찾거나 학술 실적 심사, 종신재직권, 승진 결정을 뒷받침하는 데 쓰인다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-129",
    passageId: "metascience-publish-or-perish-p1",
    prompt: "What does 'publish or perish' describe, according to the passage?",
    options: [
      "A tradition of publishing only after retirement from academia.",
      "A rule requiring scientists to never publish more than one paper.",
      "The pressure to publish academic work to succeed in an academic career, strongest at research universities.",
      "A policy eliminating all publication requirements at universities.",
    ],
    answer: 2,
    explanation:
      "지문은 'publish or perish'가 학계 경력에서 성공하기 위해 논문을 발표해야 한다는 압박이며 연구중심대학에서 가장 강하다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-metascience-v2-124",
    passageId: "metascience-open-science-p4",
    prompt:
      "What does the FOSTER taxonomy say open science can include, per the passage?",
    options: [
      "Only aspects of closed, proprietary software.",
      "Only aspects of print-only publishing with no digital component.",
      "Aspects of open access, open data, and the open-source movement.",
      "Only aspects of government secrecy classifications.",
    ],
    answer: 2,
    explanation:
      "지문은 FOSTER taxonomy에 따르면 open science가 open access, open data, 오픈소스 운동의 측면을 포함할 수 있다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-051",
    passageId: "metascience-peer-review-p3",
    prompt:
      "Who is described in the passage as the 'father' of modern scientific peer review?",
    options: [
      "Henry Oldenburg, a German-born British philosopher.",
      "Eugene Garfield, the inventor of the Science Citation Index.",
      "Jorge E. Hirsch, the physicist who proposed the h-index.",
      "Robert Boyle, the chemist who studied vacuums.",
    ],
    answer: 0,
    explanation:
      "지문은 독일 태생의 영국 철학자 Henry Oldenburg가 현대 과학적 peer review의 '아버지'로 여겨진다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-metascience-v2-023",
    passageId: "metascience-scientometrics-p7",
    prompt:
      "What does the principle of cost escalation described in the passage say?",
    options: [
      "Costs of scientific research decrease steadily as findings accumulate.",
      "Every scientific finding costs exactly the same amount to achieve.",
      "Cost escalation applies only to findings made before 1950.",
      "Achieving further findings at a given level of importance grows exponentially more costly in effort and resources.",
    ],
    answer: 3,
    explanation:
      "지문은 비용 상승 원리가 특정 중요도 수준의 새로운 발견을 얻는 데 드는 노력과 자원이 기하급수적으로 비싸진다고 설명한다고 말합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-120",
    passageId: "metascience-scientific-literature-p8",
    prompt:
      "What disadvantage does the passage describe for scientists with poor English writing skills?",
    options: [
      "They receive automatic translation services free of charge from every journal.",
      "They are guaranteed acceptance regardless of language ability.",
      "Their studies are rejected only if written entirely in English.",
      "They are at a disadvantage publishing in high-impact journals, regardless of their study's quality.",
    ],
    answer: 3,
    explanation:
      "지문은 영어 작문 실력이 부족한 과학자가 연구 품질과 무관하게 고영향력 저널 게재에서 불리하다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-135",
    passageId: "metascience-publish-or-perish-p7",
    prompt:
      "What argument do research-oriented university administrators make, according to the passage?",
    options: [
      "No pressure whatsoever should ever be placed on any scholar.",
      "Some pressure to produce cutting-edge research is necessary to motivate scholars early in their careers.",
      "Teaching should always be valued more highly than research output.",
      "Publication pressure should apply only to senior, tenured faculty.",
    ],
    answer: 1,
    explanation:
      "지문은 연구중심대학 행정가들이 초기 경력 학자들에게 동기를 부여하려면 최첨단 연구를 내놓을 압박이 어느 정도 필요하다고 주장한다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-043",
    passageId: "metascience-h-index-p3",
    prompt:
      "In the passage's five-publication example with 9, 7, 6, 2, and 1 citations, what is the author's h-index?",
    options: [
      "5, because the author has five publications in total.",
      "9, because the highest citation count is 9.",
      "3, because the author has three publications with 3 or more citations.",
      "1, because the lowest citation count is 1.",
    ],
    answer: 2,
    explanation:
      "지문은 인용 수가 9, 7, 6, 2, 1인 다섯 편의 논문을 가진 저자의 h-index가 3편이 3회 이상 인용되었기 때문에 3이라고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-080",
    passageId: "metascience-altmetrics-p8",
    prompt:
      "What did research find about researchers mentioned on Twitter, per the passage?",
    options: [
      "They have significantly lower h-indices than other researchers.",
      "Their h-index is unaffected by any social media mention.",
      "They publish exclusively in closed-access journals.",
      "They have significantly higher h-indices than researchers not mentioned on Twitter.",
    ],
    answer: 3,
    explanation:
      "지문은 트위터에서 언급된 연구자가 그렇지 않은 연구자보다 h-index가 유의미하게 높다는 연구 결과를 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-077",
    passageId: "metascience-altmetrics-p5",
    prompt: "What limitation of altmetrics does the passage describe?",
    options: [
      "Altmetrics require decades of data before producing any score.",
      "Altmetrics can only be calculated for articles published before 2000.",
      "Altmetrics eliminate all possibility of ranking articles.",
      "An article needs little attention to jump to the upper quartile of ranked papers.",
    ],
    answer: 3,
    explanation:
      "지문은 논문이 적은 관심만 받아도 순위 상위 사분위로 뛰어오를 수 있다는 altmetrics의 한계를 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-010",
    passageId: "metascience-bibliometrics-p2",
    prompt:
      "What laid the fundamental basis of bibliometrics research in the early 1960s, according to the passage?",
    options: [
      "The invention of the personal computer by IBM.",
      "A single UNESCO treaty on copyright law.",
      "The founding of the first peer-reviewed medical journal.",
      "The Science Citation Index of Eugene Garfield and the citation network analysis of Derek John de Solla Price.",
    ],
    answer: 3,
    explanation:
      "지문은 1960년대 초 Eugene Garfield의 Science Citation Index와 Derek John de Solla Price의 인용 네트워크 분석이 bibliometrics 연구 프로그램의 기초를 놓았다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-091",
    passageId: "metascience-reproducibility-p3",
    prompt:
      "What effect did Huygens report that Boyle and Hooke could not replicate, per the passage?",
    options: [
      "A perpetual motion machine that never stopped moving.",
      "A vacuum that instantly filled itself with air.",
      "A chemical reaction that produced gold from lead.",
      "'Anomalous suspension,' in which water appeared to levitate in a glass jar inside his air pump.",
    ],
    answer: 3,
    explanation:
      "지문은 Huygens가 보고한 'anomalous suspension' 즉 공기 펌프 안 유리병 속 물이 떠 있는 것처럼 보이는 현상을 Boyle과 Hooke이 재현하지 못했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-026",
    passageId: "metascience-citation-index-p2",
    prompt:
      "What did Eugene Garfield's Institute for Scientific Information introduce in 1961, per the passage?",
    options: [
      "The first university library open to the public.",
      "The first citation index for papers published in academic journals, the Science Citation Index.",
      "The first peer-reviewed journal in the world.",
      "The first computer used exclusively for chemistry.",
    ],
    answer: 1,
    explanation:
      "지문은 1961년 Eugene Garfield의 Institute for Scientific Information이 학술지 논문을 위한 최초의 citation index인 Science Citation Index를 도입했다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-metascience-v2-050",
    passageId: "metascience-peer-review-p2",
    prompt:
      "What is scholarly peer review typically used for in academia, per the passage?",
    options: [
      "To determine which professor receives the largest office.",
      "To determine an academic paper's suitability for publication.",
      "To decide which students may enroll in a university.",
      "To calculate a journal's subscription price.",
    ],
    answer: 1,
    explanation:
      "지문은 학술적 peer review가 학계에서 논문이 출판에 적합한지 판단하는 데 주로 쓰인다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-metascience-v2-126",
    passageId: "metascience-open-science-p6",
    prompt:
      "What does the infrastructure school regard open science as, per the passage?",
    options: [
      "Primarily a legal challenge involving only copyright law.",
      "Primarily a marketing challenge for university brand image.",
      "Primarily a financial challenge unrelated to any technology.",
      "Primarily a technological challenge, focusing on internet-based infrastructure like software and computing networks.",
    ],
    answer: 3,
    explanation:
      "지문은 infrastructure school이 open science를 주로 소프트웨어와 컴퓨팅 네트워크 같은 인터넷 기반 인프라의 기술적 과제로 본다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-034",
    passageId: "metascience-impact-factor-p2",
    prompt:
      "What does the passage say the impact factor of a journal reflects?",
    options: [
      "The total number of pages published by the journal each year.",
      "The number of editors employed by the journal.",
      "The yearly mean number of article citations published in the last two years.",
      "The price of a yearly subscription to the journal.",
    ],
    answer: 2,
    explanation:
      "지문은 저널의 impact factor가 최근 2년간 발표된 논문의 연평균 인용 수를 반영한다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-metascience-v2-142",
    passageId: "metascience-retraction-watch-p6",
    prompt:
      "What did Oransky and Marcus estimate in their 2023 op-eds, per the passage?",
    options: [
      "That scientific misconduct had been completely eradicated by 2023.",
      "That misconduct occurs only outside of academic institutions.",
      "That the academic community was fully committed to exposing wrongdoing.",
      "That scientific misconduct was more common than is reported.",
    ],
    answer: 3,
    explanation:
      "지문은 Oransky와 Marcus가 2023년 기고문에서 과학적 부정행위가 보고되는 것보다 더 흔하다고 추정했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-125",
    passageId: "metascience-open-science-p5",
    prompt:
      "Who categorized Open Science into five schools of thought, according to the passage?",
    options: [
      "Physicists Jorge E. Hirsch and Eugene Garfield.",
      "Sociologists Benedikt Fecher and Sascha Friesike.",
      "Philosophers Karl Popper and Thomas Kuhn.",
      "Chemists Robert Boyle and Christiaan Huygens.",
    ],
    answer: 1,
    explanation:
      "지문은 사회학자 Benedikt Fecher와 Sascha Friesike가 Open Science를 다섯 가지 사조로 분류했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-021",
    passageId: "metascience-scientometrics-p5",
    prompt: "What was first published in 2004, per the passage?",
    options: [
      "The first Science Citation Index by Eugene Garfield.",
      "The Academic Ranking of World Universities ('Shanghai ranking'), by Shanghai Jiao Tong University.",
      "The first academic journal dedicated to bibliometrics.",
      "The first h-index calculation for any scientist.",
    ],
    answer: 1,
    explanation:
      "지문은 2004년 Shanghai Jiao Tong University가 Academic Ranking of World Universities, 이른바 상하이 랭킹을 처음 발표했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-114",
    passageId: "metascience-scientific-literature-p2",
    prompt: "What does peer review ensure, according to the passage?",
    options: [
      "That every submitted paper is automatically published without review.",
      "That only famous authors' work is ever evaluated.",
      "That research is judged solely on the author's nationality.",
      "The quality, validity, and reliability of research before it becomes part of the scientific literature.",
    ],
    answer: 3,
    explanation:
      "지문은 peer review가 연구가 scientific literature의 일부가 되기 전에 품질, 타당성, 신뢰성을 보장한다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-metascience-v2-086",
    passageId: "metascience-science-and-technology-studies-p6",
    prompt:
      "What did the mid-1980s 'turn to technology' add to STS, according to the passage?",
    options: [
      "A complete rejection of all prior science studies scholarship.",
      "An exclusive focus on ancient history with no modern topics.",
      "Technology studies to the range of interests reflected in science.",
      "A ban on any study of engineering or technology.",
    ],
    answer: 2,
    explanation:
      "지문은 1980년대 중반의 '기술로의 전환'이 과학에 대한 관심 범위에 기술 연구를 더했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-130",
    passageId: "metascience-publish-or-perish-p2",
    prompt:
      "What have some researchers identified the publish or perish environment as, per the passage?",
    options: [
      "A contributing factor to the replication crisis.",
      "The sole cause that ended the replication crisis completely.",
      "A factor completely unrelated to research quality.",
      "A tradition that only affects unfunded researchers.",
    ],
    answer: 0,
    explanation:
      "지문은 일부 연구자가 publish or perish 환경을 replication crisis에 기여하는 요인으로 지목했다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-metascience-v2-092",
    passageId: "metascience-reproducibility-p4",
    prompt:
      "What did Karl Popper note in his 1934 book, according to the passage?",
    options: [
      "Every single occurrence, reproducible or not, is equally significant to science.",
      "Science requires no reproducibility whatsoever to reach conclusions.",
      "Non-reproducible single occurrences are of no significance to science.",
      "Reproducibility was invented by Robert Boyle in the 20th century.",
    ],
    answer: 2,
    explanation:
      "지문은 Karl Popper가 1934년 저서에서 '재현 불가능한 단일 사건은 과학적으로 의미가 없다'고 언급했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-012",
    passageId: "metascience-bibliometrics-p4",
    prompt: "What does the passage say about citation indexes and case law?",
    options: [
      "Citation indexes were first applied to case law in the 1860s, inspiring the Science Citation Index a century later.",
      "Citation indexes were invented after the Science Citation Index and copied its design.",
      "Case law never used any form of citation indexing before the 20th century.",
      "The Science Citation Index directly replaced all legal citation indexes.",
    ],
    answer: 0,
    explanation:
      "지문은 citation index가 1860년대에 판례법에 처음 적용되었고, 이것이 한 세기 뒤 Science Citation Index에 직접적인 영감을 주었다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-070",
    passageId: "metascience-open-access-p6",
    prompt:
      "What is the difference between gratis and libre open access, per the passage?",
    options: [
      "Gratis is free to read without re-use rights, while libre adds additional re-use rights.",
      "Gratis and libre are identical terms with no difference at all.",
      "Libre means paid access, while gratis means free access.",
      "Gratis applies only to books, while libre applies only to articles.",
    ],
    answer: 0,
    explanation:
      "지문은 gratis가 재사용 권리 없이 무료로 읽을 수 있는 것이고, libre는 여기에 추가적인 재사용 권리를 더한 것이라고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-062",
    passageId: "metascience-replication-crisis-p6",
    prompt:
      "What do statisticians agree on regarding 'p < 0.05', according to the passage?",
    options: [
      "It provides weaker evidence than is generally appreciated, though there is no consensus on what to do about it.",
      "It provides absolute certainty about a hypothesis being true.",
      "It has been universally replaced by Bayesian methods.",
      "It should never be reported alongside confidence intervals.",
    ],
    answer: 0,
    explanation:
      "지문은 통계학자들이 'p < 0.05'가 일반적으로 여겨지는 것보다 약한 증거라는 데는 동의하지만, 대책에는 합의가 없다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-042",
    passageId: "metascience-h-index-p2",
    prompt: "Who suggested the h-index in 2005, per the passage?",
    options: [
      "Eugene Garfield, the founder of the Institute for Scientific Information.",
      "Derek J. de Solla Price, a historian of science.",
      "Vasily Nalimov, a Soviet scientometrics pioneer.",
      "Jorge E. Hirsch, a physicist at UC San Diego.",
    ],
    answer: 3,
    explanation:
      "지문은 2005년 UC San Diego의 물리학자 Jorge E. Hirsch가 h-index를 제안했다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-metascience-v2-073",
    passageId: "metascience-altmetrics-p1",
    prompt: "What are altmetrics, according to the passage?",
    options: [
      "A new government agency responsible for regulating universities.",
      "Non-traditional bibliometrics proposed as an alternative or complement to metrics like impact factor and h-index.",
      "A traditional bibliometric identical to citation counts.",
      "A method of measuring only a journal's print circulation.",
    ],
    answer: 1,
    explanation:
      "지문은 altmetrics를 impact factor나 h-index 같은 전통적 지표를 대체하거나 보완하기 위한 비전통적 계량서지학 지표라고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-metascience-v2-032",
    passageId: "metascience-citation-index-p8",
    prompt:
      "What did Ciarli's comparison of rice research coverage find, according to the passage?",
    options: [
      "WoS and Scopus equally represent every country's scientific output.",
      "Developing countries are over-represented in WoS and Scopus.",
      "CAB Abstracts under-represents industrialised countries only.",
      "WoS and Scopus may strongly under-represent scientific production by developing countries.",
    ],
    answer: 3,
    explanation:
      "지문은 Ciarli가 쌀 연구 데이터를 비교한 결과 WoS와 Scopus가 개발도상국의 과학 생산을 크게 과소대표할 수 있다고 밝혔다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-024",
    passageId: "metascience-scientometrics-p8",
    prompt:
      "What do more recent scientometrics methods rely on, according to the passage?",
    options: [
      "Open source and open data to ensure transparency and reproducibility.",
      "Closed, proprietary databases that cannot be verified by anyone.",
      "Manual paper-based indexing without any computing tools.",
      "Only interviews with senior scientists about their opinions.",
    ],
    answer: 0,
    explanation:
      "지문은 최근 scientometrics 방법이 투명성과 재현성을 보장하기 위해 오픈소스와 오픈 데이터에 의존한다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-013",
    passageId: "metascience-bibliometrics-p5",
    prompt:
      "What did Alfred Lotka's law of productivity describe, according to the passage?",
    options: [
      "The number of authors producing n contributions is equal to the 1/n^2 number of authors producing only one publication.",
      "The exact number of citations every scientific journal receives annually.",
      "The relationship between a scientist's age and their citation count.",
      "The number of journals published in a given calendar year.",
    ],
    answer: 0,
    explanation:
      "지문은 Lotka의 생산성 법칙이 n편을 낸 저자 수가 한 편만 낸 저자 수의 1/n^2에 해당한다고 설명한다고 말합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-035",
    passageId: "metascience-impact-factor-p3",
    prompt:
      "What example does the passage give about Nature's 2015/2016 biennium?",
    options: [
      "Nature published zero articles during that entire biennium.",
      "Nature's articles received no citations at all in 2017.",
      "Nature published exactly 74,090 articles in that biennium.",
      "Nature published 1,782 articles, and 74,090 references in 2017 came from within that group.",
    ],
    answer: 3,
    explanation:
      "지문은 Nature가 2015~2016년에 1,782편의 논문을 냈고 2017년에 발표된 논문 중 74,090건의 참고문헌이 그 그룹에서 나왔다는 예를 듭니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-122",
    passageId: "metascience-open-science-p2",
    prompt:
      "What does the passage say open science continues rather than revolutionizes?",
    options: [
      "Practices that began only in the 21st century with the internet.",
      "A tradition of secrecy that existed before the printing press.",
      "A practice invented exclusively by 20th-century governments.",
      "Practices that began in the 17th century with the academic journal.",
    ],
    answer: 3,
    explanation:
      "지문은 open science가 17세기 학술지와 함께 시작된 관행을 혁명적으로 바꾸기보다는 이어가고 있다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-133",
    passageId: "metascience-publish-or-perish-p5",
    prompt: "What did physicist Peter Higgs say in 2013, per the passage?",
    options: [
      "Academic expectations have made it easier than ever to do groundbreaking work.",
      "He would have preferred more publish-or-perish pressure in the 1960s.",
      "He never experienced any pressure to publish during his career.",
      "Academic expectations since the 1990s would likely have prevented him from making his contributions and attaining tenure.",
    ],
    answer: 3,
    explanation:
      "지문은 물리학자 Peter Higgs가 2013년 1990년대 이후의 학계 기대치였다면 자신의 업적과 종신재직권 취득이 어려웠을 것이라고 말했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-066",
    passageId: "metascience-open-access-p2",
    prompt: "How are open-access journals characterized, per the passage?",
    options: [
      "By funding models that do not require the reader to pay, relying on author fees or public funding instead.",
      "By charging readers a subscription fee identical to closed journals.",
      "By requiring every reader to pay a per-view charge.",
      "By banning any form of public or grant funding.",
    ],
    answer: 0,
    explanation:
      "지문은 open-access 저널이 독자에게 비용을 요구하지 않고 저자 비용이나 공공 자금에 의존하는 재정 모델로 특징지어진다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-131",
    passageId: "metascience-publish-or-perish-p3",
    prompt:
      "What has the pressure to publish been cited as a cause of, according to the passage?",
    options: [
      "An overall decrease in the number of submitted manuscripts.",
      "Poor work being submitted to academic journals.",
      "The complete elimination of academic journals.",
      "A permanent increase in article quality across all fields.",
    ],
    answer: 1,
    explanation:
      "지문은 게재 압박이 학술지에 부실한 연구가 제출되는 원인으로 지목되었다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-069",
    passageId: "metascience-open-access-p5",
    prompt:
      "What has enabled free access to paywalled literature, according to the passage?",
    options: [
      "A universal ban on all paywalled publishing worldwide.",
      "A government mandate eliminating all subscription journals.",
      "The growth of unauthorized digital copying by large-scale copyright infringement.",
      "The complete disappearance of copyright law.",
    ],
    answer: 2,
    explanation:
      "지문은 대규모 저작권 침해를 통한 무단 디지털 복제의 확산이 유료화된 문헌에 대한 무료 접근을 가능하게 했다고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-metascience-v2-117",
    passageId: "metascience-scientific-literature-p5",
    prompt: "What is a technical note, according to the passage?",
    options: [
      "A private letter between two scientists never meant for publication.",
      "A summary of a scientist's personal biography.",
      "A description of a technique or piece of equipment modified from an existing one to be new and more effective.",
      "A formal legal contract for research funding.",
    ],
    answer: 2,
    explanation:
      "지문은 technical note를 기존 것을 개선해 새롭고 더 효과적으로 만든 기술이나 장비에 대한 설명이라고 정의합니다.",
    difficulty: 2,
  },
];

const buildQuestion = (spec) => {
  const passage = passageById.get(spec.passageId);
  if (!passage)
    throw new Error(`Unknown metascience passage: ${spec.passageId}`);
  const article = articleById.get(passage.articleId);
  if (!article)
    throw new Error(`Unknown metascience article: ${passage.articleId}`);
  return {
    id: spec.id,
    topic: "metascience",
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

export const dadMetascienceQuestions = questionSpecs.map(buildQuestion);
