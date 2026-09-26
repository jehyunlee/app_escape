import sourceData from "./assets/wikipedia/science-sources.json" with { type: "json" };

const passageById = new Map(
  sourceData.passages.map((passage) => [passage.id, passage]),
);
const articleById = new Map(
  sourceData.articles.map((article) => [article.id, article]),
);

const questionSpecs = [
  // Penicillin, passage 1
  {
    id: "dad-science-001",
    passageId: "science-penicillin-p1",
    prompt: "What is the passage's main description of penicillins?",
    options: [
      "They are beta-lactam antibiotics originally obtained from Penicillium moulds.",
      "They are beta-lactam compounds made only by human cells.",
      "They are Penicillium products used only as research reagents.",
      "They are a single antibiotic purified from one mould species.",
    ],
    answer: 0,
    explanation:
      "지문은 페니실린을 Penicillium 곰팡이에서 얻은 베타락탐 항생제 집단이라고 직접 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-science-002",
    passageId: "science-penicillin-p1",
    prompt:
      "Which production sequence does the passage associate with most penicillins used clinically?",
    options: [
      "They are grown in shallow cultures and used without purification.",
      "They are made by P. chrysogenum through deep-tank fermentation, then purified.",
      "They are obtained from P. rubens by fermentation but not purified.",
      "They are synthesized directly from bacterial cultures in sealed tanks.",
    ],
    answer: 1,
    explanation:
      "지문은 임상용 페니실린 대부분이 P. chrysogenum의 심층 탱크 발효 뒤 정제되는 순서라고 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-science-003",
    passageId: "science-penicillin-p1",
    prompt:
      "What contrast does the passage draw about natural penicillins and clinical use?",
    options: [
      "Only penicillin G has been discovered as a natural compound.",
      "All natural penicillins are purified and given by mouth.",
      "Only G and V are purified natural penicillins in clinical use.",
      "Every natural penicillin is used clinically if it treats bacteria.",
    ],
    answer: 2,
    explanation:
      "지문은 천연 페니실린이 여러 개 발견되었지만 임상적으로 쓰이는 정제 화합물은 G와 V 두 가지라고 대비합니다.",
    difficulty: 2,
  },
  {
    id: "dad-science-004",
    passageId: "science-penicillin-p1",
    prompt:
      "What development is implied by the final sentence of this passage?",
    options: [
      "Resistance disappeared because current use is limited to two compounds.",
      "Penicillin remains useful, and extensive use has removed bacterial resistance.",
      "Only staphylococci and streptococci developed resistance after first use.",
      "It remains widely used, but extensive use has led many bacteria to develop resistance.",
    ],
    answer: 3,
    explanation:
      "마지막 문장은 페니실린이 여전히 널리 쓰이지만 많은 세균이 과도한 사용 뒤 내성을 갖게 되었다고 말합니다.",
    difficulty: 2,
  },
  // Penicillin, passage 2
  {
    id: "dad-science-005",
    passageId: "science-penicillin-p2",
    prompt: "Which event begins the sequence of penicillin work described?",
    options: [
      "He discovered penicillin in 1928 as a crude extract of P. rubens.",
      "He first purified penicillin F at Oxford in 1940 with Florey and Chain.",
      "He first used purified penicillin for meningitis in 1942.",
      "He shared the 1945 Nobel Prize alone for the discovery.",
    ],
    answer: 0,
    explanation:
      "순서의 출발점은 1928년 Fleming이 P. rubens의 조추출물로 페니실린을 발견한 일입니다.",
    difficulty: 1,
  },
  {
    id: "dad-science-006",
    passageId: "science-penicillin-p2",
    prompt:
      "Which event occurred before the purified compound was isolated in 1940?",
    options: [
      "Fleming treated meningitis with purified penicillin in 1942.",
      "Cecil George Paine successfully treated neonatal conjunctivitis in 1930.",
      "The Oxford team isolated penicillin F in 1940.",
      "The three researchers received Nobel recognition in 1945.",
    ],
    answer: 1,
    explanation:
      "1930년 Paine의 신생아 결막염 치료가 1940년 정제 화합물 분리보다 먼저 일어났습니다.",
    difficulty: 2,
  },
  {
    id: "dad-science-007",
    passageId: "science-penicillin-p2",
    prompt: "How did the Oxford team advance Fleming’s earlier discovery?",
    options: [
      "It first produced a crude P. rubens extract for Fleming in 1928.",
      "It treated neonatal conjunctivitis before any compound was isolated.",
      "It isolated the purified compound penicillin F in 1940.",
      "It shared the 1945 Nobel Prize as the complete research team.",
    ],
    answer: 2,
    explanation:
      "Fleming의 조추출물 발견 뒤 Oxford 팀은 1940년에 정제된 penicillin F를 분리해 다음 단계를 맡았습니다.",
    difficulty: 2,
  },
  {
    id: "dad-science-008",
    passageId: "science-penicillin-p2",
    prompt:
      "What does the shared Nobel recognition imply about credit for the work?",
    options: [
      "The Nobel Prize went to Fleming in 1928 for the crude extract.",
      "The 1945 prize recognized Paine’s eye treatment alone.",
      "Only Florey and Chain received the prize for isolation.",
      "Chain, Fleming, and Florey were jointly recognized in 1945.",
    ],
    answer: 3,
    explanation:
      "지문은 1945년 상을 Chain, Fleming, Florey가 함께 받았다고 하므로 공로를 공동으로 인정했음을 뜻합니다.",
    difficulty: 2,
  },
  // X-ray, passage 1
  {
    id: "dad-science-009",
    passageId: "science-x-ray-p1",
    prompt:
      "Where does X-ray wavelength fall in the electromagnetic spectrum described?",
    options: [
      "Shorter than ultraviolet and longer than gamma rays.",
      "Shorter than gamma rays and longer than ultraviolet rays.",
      "Longer than both ultraviolet and gamma rays.",
      "Shorter than both ultraviolet and gamma rays.",
    ],
    answer: 0,
    explanation:
      "첫 문장이 X선의 파장이 자외선보다 짧고 감마선보다 길다고 위치를 정합니다.",
    difficulty: 1,
  },
  {
    id: "dad-science-010",
    passageId: "science-x-ray-p1",
    prompt:
      "Which pair gives the approximate wavelength range stated for X-rays?",
    options: [
      "10 picometres to 10 femtometres",
      "10 nanometres to 10 picometres",
      "10 micrometres to 10 nanometres",
      "10 femtometres to 10 picometres",
    ],
    answer: 1,
    explanation:
      "지문은 X선의 대략적인 파장 범위를 10 나노미터에서 10 피코미터라고 제시합니다.",
    difficulty: 1,
  },
  {
    id: "dad-science-011",
    passageId: "science-x-ray-p1",
    prompt:
      "What does the passage connect to the stated X-ray wavelength range?",
    options: [
      "The wavelength range is connected to the age and source of X-rays.",
      "The wavelength range is connected only to X-ray medical uses.",
      "Corresponding frequency and photon-energy ranges.",
      "The wavelength range is connected to chemical elements but not energy.",
    ],
    answer: 2,
    explanation:
      "파장 범위에 대응하는 주파수와 광자 에너지 범위가 함께 제시됩니다.",
    difficulty: 2,
  },
  {
    id: "dad-science-012",
    passageId: "science-x-ray-p1",
    prompt: "Why does the passage give both wavelengths and frequencies?",
    options: [
      "To substitute photon energy for wavelength without giving a related measure.",
      "To show wavelength and frequency vary independently for X-rays.",
      "To compare X-rays with visible light by medical effect.",
      "To describe the same radiation with related wavelength, frequency, and energy ranges.",
    ],
    answer: 3,
    explanation:
      "지문은 하나의 X선 범위를 파장과 그에 대응하는 주파수·에너지라는 여러 물리량으로 설명합니다.",
    difficulty: 2,
  },
  // X-ray, passage 2
  {
    id: "dad-science-013",
    passageId: "science-x-ray-p2",
    prompt:
      "What use follows from X-rays penetrating solid materials and living tissue?",
    options: [
      "X-ray radiography can support medical diagnostics and materials science.",
      "X-ray radiography is useful only when solids block the radiation.",
      "Their penetration limits X-rays to identifying atmospheric gases.",
      "Their penetration makes exposure harmless during every examination.",
    ],
    answer: 0,
    explanation:
      "고체와 생체 조직을 통과할 수 있어 X선 방사선 촬영이 의료 진단과 재료 과학에 널리 쓰입니다.",
    difficulty: 1,
  },
  {
    id: "dad-science-014",
    passageId: "science-x-ray-p2",
    prompt:
      "Why are both living tissue and construction materials mentioned in the radiography sentence?",
    options: [
      "They show that X-rays are limited to biological tissue.",
      "They illustrate two application areas made possible by penetration.",
      "They show that materials science uses X-rays only for cancer treatment.",
      "They imply construction materials absorb all X-rays before imaging.",
    ],
    answer: 1,
    explanation:
      "지문은 조직의 의료 진단과 건설 재료의 약점 탐지라는 두 응용을 X선의 침투성과 연결합니다.",
    difficulty: 1,
  },
  {
    id: "dad-science-015",
    passageId: "science-x-ray-p2",
    prompt: "What health concern does the passage attach to X-ray exposure?",
    options: [
      "Exposure weakens construction materials but has no health effect stated in the passage.",
      "Exposure is harmless whenever radiography is used for routine medical diagnosis.",
      "It can damage DNA and cause cancer; high intensities can cause burns or radiation sickness.",
      "Exposure makes the radiation non-ionizing once it enters living tissue.",
    ],
    answer: 2,
    explanation:
      "X선은 이온화 방사선이므로 노출이 DNA 손상과 암을 일으킬 수 있고, 강도가 높으면 화상과 방사선병도 일으킬 수 있습니다.",
    difficulty: 2,
  },
  {
    id: "dad-science-016",
    passageId: "science-x-ray-p2",
    prompt:
      "What does the final sentence imply about X-ray generation and use?",
    options: [
      "Public-health authorities leave both unrestricted because the benefits remove all risk.",
      "Only medical use is controlled; materials-science use is excluded.",
      "The passage recommends banning every use because any exposure is fatal.",
      "Public-health authorities strictly control generation and use because exposure can be hazardous.",
    ],
    answer: 3,
    explanation:
      "앞에서 노출의 건강 위험을 설명한 뒤, 지문은 공중보건 당국이 X선의 생성과 사용을 엄격히 통제한다고 말합니다.",
    difficulty: 2,
  },
  // Smallpox vaccine, passage 1
  {
    id: "dad-science-017",
    passageId: "science-smallpox-vaccine-p1",
    prompt: "What did Jenner demonstrate in 1796?",
    options: [
      "Cowpox infection could confer immunity against deadly smallpox.",
      "Cowpox infection caused smallpox but was milder than the vaccine.",
      "Jenner showed immunity followed only after deadly smallpox infection.",
      "Jenner showed cowpox and smallpox had identical severity.",
    ],
    answer: 0,
    explanation:
      "1796년 Jenner는 비교적 가벼운 우두 감염이 치명적인 천연두에 대한 면역을 준다는 것을 보였습니다.",
    difficulty: 1,
  },
  {
    id: "dad-science-018",
    passageId: "science-smallpox-vaccine-p1",
    prompt: "Why did cowpox serve as a natural vaccine?",
    options: [
      "Cowpox caused the deadly disease but was easier to diagnose.",
      "It granted smallpox immunity while causing a relatively mild infection.",
      "Cowpox was used because it contained the same species as smallpox.",
      "Cowpox served as a vaccine only after routine vaccination ended.",
    ],
    answer: 1,
    explanation:
      "우두는 비교적 온화한 감염이면서 천연두 면역을 제공했기 때문에 천연 백신 역할을 했습니다.",
    difficulty: 2,
  },
  {
    id: "dad-science-019",
    passageId: "science-smallpox-vaccine-p1",
    prompt: "What result followed the WHO campaign from 1958 to 1977?",
    options: [
      "It made cowpox the only human disease eradicated.",
      "It made routine smallpox vaccination permanent worldwide.",
      "It eradicated smallpox, the only human disease eradicated.",
      "It identified the vaccine but left smallpox circulating.",
    ],
    answer: 2,
    explanation:
      "1958~1977년 WHO 세계 예방접종 캠페인 뒤 천연두가 박멸되었다고 지문은 설명합니다.",
    difficulty: 2,
  },
  {
    id: "dad-science-020",
    passageId: "science-smallpox-vaccine-p1",
    prompt:
      "Why does production continue despite the end of routine public vaccination?",
    options: [
      "For routine public vaccination after smallpox had been eradicated.",
      "For replacing vaccination with public-health surveillance.",
      "For testing whether natural smallpox can return.",
      "For research and protection against bioterrorism or biological warfare.",
    ],
    answer: 3,
    explanation:
      "정기 접종은 끝났지만 연구와 생물테러·생물학전에 대비하려고 백신을 계속 생산합니다.",
    difficulty: 2,
  },
  // Smallpox vaccine, passage 2
  {
    id: "dad-science-021",
    passageId: "science-smallpox-vaccine-p2",
    prompt: "What is the linguistic origin of the term vaccine?",
    options: [
      "Vacca, the Latin word for cow.",
      "Vacca, the Latin word for smallpox.",
      "Variolae vaccinae, the Latin name for a drug.",
      "A term coined from the modern vaccine’s virus.",
    ],
    answer: 0,
    explanation:
      "vaccine은 소를 뜻하는 라틴어 vacca에서 유래했다고 지문에 나옵니다.",
    difficulty: 1,
  },
  {
    id: "dad-science-022",
    passageId: "science-smallpox-vaccine-p2",
    prompt: "How did Jenner refer to cowpox?",
    options: [
      "As vacciniae variola, or cowpox of the smallpox.",
      "As variolae vaccinae, or smallpox of the cow.",
      "As variolae vaccinae, meaning the modern vaccine strain.",
      "As vaccinia, the modern vaccine name.",
    ],
    answer: 1,
    explanation:
      "Jenner가 우두를 variolae vaccinae, 즉 소의 천연두라고 불렀다는 내용입니다.",
    difficulty: 1,
  },
  {
    id: "dad-science-023",
    passageId: "science-smallpox-vaccine-p2",
    prompt: "What distinction did Downie’s 1939 evidence establish?",
    options: [
      "The modern vaccine was identical to every cowpox strain.",
      "Cowpox was serologically distinct from the modern vaccine.",
      "The modern smallpox vaccine was serologically distinct from cowpox.",
      "Whole-genome sequencing had already shown vaccinia was horsepox-related.",
    ],
    answer: 2,
    explanation:
      "Downie는 1939년에 현대 천연두 백신이 우두와 혈청학적으로 구별된다는 점을 보였습니다.",
    difficulty: 2,
  },
  {
    id: "dad-science-024",
    passageId: "science-smallpox-vaccine-p2",
    prompt:
      "What later evidence clarified the relationship between vaccinia and cowpox?",
    options: [
      "Serological testing showed vaccinia was closest to every British cowpox strain.",
      "The 1939 demonstration showed vaccinia was closest to horsepox.",
      "Whole-genome sequencing showed vaccinia was closest to cowpox.",
      "Whole-genome sequencing showed vaccinia is most closely related to horsepox.",
    ],
    answer: 3,
    explanation:
      "전체 유전체 염기서열 분석이 vaccinia가 우두보다 horsepox에 가장 가깝다는 점을 밝혔습니다.",
    difficulty: 3,
  },
  // Plate tectonics, passage 1
  {
    id: "dad-science-025",
    passageId: "science-plate-tectonics-p1",
    prompt: "What does the plate-tectonics theory say has been moving slowly?",
    options: [
      "Large tectonic plates of Earth’s lithosphere.",
      "The rigid crust alone has moved while the upper mantle stayed fixed.",
      "Continents have moved, but not the larger lithospheric plates.",
      "Tectonic plates have moved only since seafloor spreading was validated.",
    ],
    answer: 0,
    explanation:
      "이론은 지구 암석권을 이루는 큰 판들이 30억~40억 년 동안 천천히 움직여 왔다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-science-026",
    passageId: "science-plate-tectonics-p1",
    prompt: "Which earlier idea helped form the model of plate tectonics?",
    options: [
      "The seafloor-spreading idea helped form the plate model.",
      "Continental drift",
      "Seafloor spreading was the earlier twentieth-century model.",
      "The continental-lithosphere model replaced continental drift.",
    ],
    answer: 1,
    explanation:
      "판 구조론 모델은 20세기 초에 발전한 대륙 이동 개념에 기반한다고 했습니다.",
    difficulty: 1,
  },
  {
    id: "dad-science-027",
    passageId: "science-plate-tectonics-p1",
    prompt: "Which later evidence helped geoscientists accept plate tectonics?",
    options: [
      "Validation of continental drift in the mid-to-late 1960s.",
      "Discovery of seafloor spreading in the first years of the twentieth century.",
      "Validation of seafloor spreading in the mid-to-late 1960s.",
      "Acceptance of plate tectonics before seafloor spreading was validated.",
    ],
    answer: 2,
    explanation:
      "1960년대 중후반 해저 확장이 검증된 일이 판 구조론 수용을 도운 증거로 제시됩니다.",
    difficulty: 2,
  },
  {
    id: "dad-science-028",
    passageId: "science-plate-tectonics-p1",
    prompt:
      "Why does the passage mention Greek and Latin roots before defining tectonics?",
    options: [
      "To show that Earth’s plates were named by Greek scientists.",
      "To identify the Latin process that causes all plate motion.",
      "To prove the theory was accepted when the word was coined.",
      "To explain tectonics’ roots before defining the theory.",
    ],
    answer: 3,
    explanation:
      "용어의 그리스어·라틴어 뿌리를 먼저 설명해 tectonics라는 이름의 뜻을 밝힌 뒤 이론을 정의합니다.",
    difficulty: 2,
  },
  // Plate tectonics, passage 2
  {
    id: "dad-science-029",
    passageId: "science-plate-tectonics-p2",
    prompt: "What is Earth's lithosphere described as?",
    options: [
      "The rigid outer shell made of crust and upper mantle.",
      "The rigid outer shell made only of the crust.",
      "The ductile layer beneath the crust and upper mantle.",
      "A fractured shell containing only continental crust.",
    ],
    answer: 0,
    explanation:
      "암석권은 지각과 상부 맨틀을 포함하는 단단한 외부 껍질이라고 설명됩니다.",
    difficulty: 1,
  },
  {
    id: "dad-science-030",
    passageId: "science-plate-tectonics-p2",
    prompt: "What determines the type of plate boundary?",
    options: [
      "The absolute age of the plate.",
      "The relative motion of the plates.",
      "The number of earthquakes along the boundary.",
      "The thickness of crust at the boundary.",
    ],
    answer: 1,
    explanation:
      "판이 서로 상대적으로 어떻게 움직이는지가 수렴·발산·변환 경계의 유형을 결정합니다.",
    difficulty: 1,
  },
  {
    id: "dad-science-031",
    passageId: "science-plate-tectonics-p2",
    prompt: "What range of annual plate movement is given?",
    options: [
      "Zero to 10 millimetres annually.",
      "Zero to 10 metres annually.",
      "Zero to 10 centimetres annually.",
      "Ten to 100 centimetres annually.",
    ],
    answer: 2,
    explanation:
      "지문은 판의 상대적 이동이 보통 매년 0에서 10센티미터 사이라고 제시합니다.",
    difficulty: 1,
  },
  {
    id: "dad-science-032",
    passageId: "science-plate-tectonics-p2",
    prompt:
      "Which set of events is associated with active faults in the passage?",
    options: [
      "Earthquakes, volcanic activity, and no mountain-building.",
      "Mountain-building and trenches, but no earthquakes.",
      "Only volcanic activity where plates never meet.",
      "Earthquakes, volcanoes, mountain-building, and oceanic trenches.",
    ],
    answer: 3,
    explanation:
      "활성 단층은 지진·화산 활동·산맥 형성·해양 해구와 관련된다고 나열됩니다.",
    difficulty: 2,
  },
  // Radioactive decay, passage 1
  {
    id: "dad-science-033",
    passageId: "science-radioactive-decay-p1",
    prompt: "What happens during radioactive decay?",
    options: [
      "An unstable atomic nucleus loses energy by radiation.",
      "An unstable nucleus gains energy through radiation.",
      "A stable nucleus changes element without losing energy.",
      "An atom emits light only after its electron shell changes.",
    ],
    answer: 0,
    explanation:
      "방사성 붕괴는 불안정한 원자핵이 방사선으로 에너지를 잃는 과정입니다.",
    difficulty: 1,
  },
  {
    id: "dad-science-034",
    passageId: "science-radioactive-decay-p1",
    prompt: "What makes a material radioactive in this passage?",
    options: [
      "It contains nuclei that are stable but highly energized.",
      "It contains unstable nuclei.",
      "It contains only naturally occurring elements.",
      "It contains radiation but no unstable nuclei.",
    ],
    answer: 1,
    explanation: "불안정한 원자핵을 포함한 물질을 방사성이라고 정의합니다.",
    difficulty: 1,
  },
  {
    id: "dad-science-035",
    passageId: "science-radioactive-decay-p1",
    prompt: "Which list contains the three common decay types named?",
    options: [
      "Alpha, proton, and gamma",
      "Beta, neutron, and gamma",
      "Alpha, beta, and gamma",
      "Alpha, beta, and electromagnetic",
    ],
    answer: 2,
    explanation:
      "지문에서 가장 흔한 세 붕괴 유형으로 알파·베타·감마를 열거합니다.",
    difficulty: 1,
  },
  {
    id: "dad-science-036",
    passageId: "science-radioactive-decay-p1",
    prompt: "How does beta decay differ in force from the other two types?",
    options: [
      "The weak force governs alpha decay; the nuclear force governs beta and gamma.",
      "The electromagnetic force governs beta; the weak force governs alpha and gamma.",
      "All three common decays are governed by the weak force.",
      "The weak force governs beta; electromagnetic and nuclear forces govern alpha and gamma.",
    ],
    answer: 3,
    explanation:
      "베타 붕괴는 약한 힘, 나머지 둘은 각각 전자기력과 핵력의 지배를 받는다고 명시합니다.",
    difficulty: 3,
  },
  // Radioactive decay, passage 2
  {
    id: "dad-science-037",
    passageId: "science-radioactive-decay-p2",
    prompt:
      "What can be predicted for a large group even though one atom is unpredictable?",
    options: [
      "A population’s decay rate, expressed as a constant or half-life.",
      "The exact decay time of every identical atom.",
      "Only the age of the longest-lived atom.",
      "A fixed time at which all atoms decay together.",
    ],
    answer: 0,
    explanation:
      "개별 원자의 시점은 예측할 수 없지만 많은 동일 원자의 전체 붕괴율은 붕괴 상수나 반감기로 나타낼 수 있습니다.",
    difficulty: 2,
  },
  {
    id: "dad-science-038",
    passageId: "science-radioactive-decay-p2",
    prompt:
      "What is impossible according to the passage's quantum description?",
    options: [
      "Predicting the overall decay rate of a large sample.",
      "Predicting when a particular atom will decay.",
      "Measuring the half-life of an isotope.",
      "Estimating the range of isotope lifetimes.",
    ],
    answer: 1,
    explanation:
      "양자 이론에 따르면 특정 원자가 언제 붕괴할지는 그 원자의 나이와 관계없이 예측할 수 없습니다.",
    difficulty: 2,
  },
  {
    id: "dad-science-039",
    passageId: "science-radioactive-decay-p2",
    prompt: "What does half-life describe in the context of this passage?",
    options: [
      "The exact decay moment of one atom.",
      "The energy released by one daughter nuclide.",
      "An overall decay timescale for a large population.",
      "The chemical identity of the parent nucleus.",
    ],
    answer: 2,
    explanation:
      "반감기는 개별 원자의 순간을 정하는 값이 아니라 많은 동일 원자의 전체 붕괴 속도를 나타내는 척도입니다.",
    difficulty: 2,
  },
  {
    id: "dad-science-040",
    passageId: "science-radioactive-decay-p2",
    prompt:
      "What can be inferred from the passage’s very wide range of half-lives?",
    options: [
      "Every isotope can decay from instant to the universe’s age.",
      "Half-lives differ only slightly around one standard duration.",
      "Only primordial isotopes have measurable half-lives.",
      "Isotope half-lives range from nearly instant to longer than the universe’s age.",
    ],
    answer: 3,
    explanation:
      "반감기는 거의 순간부터 우주 나이보다 훨씬 긴 범위까지라서 동위원소마다 붕괴 시간척도가 크게 다름을 알 수 있습니다.",
    difficulty: 2,
  },
  // Photosynthesis, passage 1
  {
    id: "dad-science-041",
    passageId: "science-photosynthesis-p1",
    prompt: "What energy conversion defines photosynthesis in this passage?",
    options: [
      "Light energy is converted into chemical energy for metabolism.",
      "Light energy is stored as radiation for later photosynthesis.",
      "Chemical energy is converted into light for metabolism.",
      "Water energy becomes chemical energy without light.",
    ],
    answer: 0,
    explanation:
      "광합성은 빛 에너지를 생물의 대사를 움직이는 화학 에너지로 바꾸는 과정입니다.",
    difficulty: 1,
  },
  {
    id: "dad-science-042",
    passageId: "science-photosynthesis-p1",
    prompt: "What is released as a byproduct of oxygenic photosynthesis?",
    options: [
      "Nitrogen from splitting atmospheric carbon dioxide.",
      "Oxygen released when water is split.",
      "Sulfur from splitting water in oxygenic photosynthesis.",
      "No byproduct because oxygen is consumed.",
    ],
    answer: 1,
    explanation:
      "산소성 광합성은 물을 분해할 때 부산물로 산소를 방출한다고 했습니다.",
    difficulty: 1,
  },
  {
    id: "dad-science-043",
    passageId: "science-photosynthesis-p1",
    prompt:
      "Where do photosynthetic organisms store converted chemical energy?",
    options: [
      "In bonds of extracellular minerals such as salts.",
      "In atmospheric oxygen released during the process.",
      "In bonds of intracellular organic compounds such as sugars.",
      "In chloroplast membranes rather than organic compounds.",
    ],
    answer: 2,
    explanation:
      "변환된 에너지는 당·전분·셀룰로스 같은 세포 내 유기 화합물의 결합에 저장됩니다.",
    difficulty: 2,
  },
  {
    id: "dad-science-044",
    passageId: "science-photosynthesis-p1",
    prompt:
      "Why does the passage present photosynthesis as important for complex life?",
    options: [
      "It maintains oxygen but supplies little energy for complex life.",
      "It supplies energy while removing oxygen from the atmosphere.",
      "It makes oxygen but does not maintain it.",
      "It helps maintain oxygen and supplies much energy for complex life.",
    ],
    answer: 3,
    explanation:
      "광합성은 대기 산소를 만들고 유지하며 복잡한 생명에 필요한 생물학적 에너지 대부분을 공급하기 때문에 중요합니다.",
    difficulty: 2,
  },
  // Photosynthesis, passage 2
  {
    id: "dad-science-045",
    passageId: "science-photosynthesis-p2",
    prompt: "What begins the process across the species discussed?",
    options: [
      "Light energy is absorbed by reaction centers containing pigments or chromophores.",
      "Atmospheric carbon dioxide is first converted into sugar before light absorption.",
      "Hydrogen is first freed from water without an energy input.",
      "Chlorophyll is first placed in a cell nucleus before reaction.",
    ],
    answer: 0,
    explanation:
      "지문은 종이 달라도 광합성이 색소나 발색단을 가진 반응 중심에 빛 에너지가 흡수되는 일로 시작한다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-science-046",
    passageId: "science-photosynthesis-p2",
    prompt: "Where are plant chlorophylls located according to the passage?",
    options: [
      "Embedded in the plasma membrane of cyanobacteria.",
      "Inside chloroplasts, which are abundant in leaf cells.",
      "Freely dissolved in air spaces around leaves.",
      "In chloroplasts found mainly in roots rather than leaf cells.",
    ],
    answer: 1,
    explanation:
      "식물의 엽록소는 잎 세포에 풍부한 엽록체 안에 있다고 지문이 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-science-047",
    passageId: "science-photosynthesis-p2",
    prompt: "What location contrast is made for cyanobacterial pigments?",
    options: [
      "They are held in chloroplasts, as in plants.",
      "They are outside the cell because cyanobacteria lack membranes.",
      "They are embedded in the plasma membrane.",
      "They are stored only in leaf-cell chloroplasts.",
    ],
    answer: 2,
    explanation:
      "식물의 색소가 엽록체에 있는 것과 달리 남세균의 색소는 세포막에 박혀 있다고 했습니다.",
    difficulty: 1,
  },
  {
    id: "dad-science-048",
    passageId: "science-photosynthesis-p2",
    prompt:
      "What are two results of splitting water in light-dependent reactions?",
    options: [
      "It consumes oxygen and makes only glucose.",
      "It produces no gas but stores all energy as chlorophyll.",
      "It creates NADPH and ATP without releasing oxygen.",
      "It produces oxygen and supplies hydrogen for creating NADPH and ATP.",
    ],
    answer: 3,
    explanation:
      "물 분해는 산소 기체를 만들고, 나온 수소는 NADPH와 ATP 생성에 쓰인다고 지문은 설명합니다.",
    difficulty: 3,
  },
  // Antikythera mechanism, passage 1
  {
    id: "dad-science-049",
    passageId: "science-antikythera-mechanism-p1",
    prompt: "What kind of object is the Antikythera mechanism described as?",
    options: [
      "An ancient Greek hand-powered model of the Solar System.",
      "An ancient Greek water-powered model of only the Moon.",
      "A Hellenistic gear device designed only for athletic calendars.",
      "A bronze astronomical chart with no moving parts.",
    ],
    answer: 0,
    explanation:
      "지문은 그것을 고대 그리스의 손으로 작동하는 태양계 모형인 오러리라고 정의합니다.",
    difficulty: 1,
  },
  {
    id: "dad-science-050",
    passageId: "science-antikythera-mechanism-p1",
    prompt: "What makes the mechanism historically significant?",
    options: [
      "It is the oldest known Greek device for modelling lunar motion.",
      "It is the oldest known example of an analogue computer.",
      "It is the oldest known astronomical instrument without gears.",
      "It is the oldest known model of an athletic cycle without astronomy.",
    ],
    answer: 1,
    explanation:
      "이 장치는 알려진 아날로그 컴퓨터 중 가장 오래된 사례라고 지문에서 강조됩니다.",
    difficulty: 1,
  },
  {
    id: "dad-science-051",
    passageId: "science-antikythera-mechanism-p1",
    prompt: "What could the mechanism predict decades in advance?",
    options: [
      "The position of the Moon only, but not eclipses.",
      "Athletic games decades in advance, but not astronomical positions.",
      "Astronomical positions and eclipses decades in advance.",
      "The four-year athletic cycle and no astronomical events.",
    ],
    answer: 2,
    explanation:
      "수십 년 앞의 천문 위치와 일식을 예측하는 데 사용될 수 있었습니다.",
    difficulty: 1,
  },
  {
    id: "dad-science-052",
    passageId: "science-antikythera-mechanism-p1",
    prompt: "Besides astronomy, what cycle could it track?",
    options: [
      "A two-year cycle of lunar eclipses.",
      "A four-year cycle of bacterial reproduction.",
      "A yearly cycle of the instrument’s calibration.",
      "A four-year athletic-games cycle like an Olympiad.",
    ],
    answer: 3,
    explanation:
      "천문학 외에도 올림피아드와 비슷한 4년 주기의 운동 경기를 추적할 수 있었습니다.",
    difficulty: 2,
  },
  // Antikythera mechanism, passage 2
  {
    id: "dad-science-053",
    passageId: "science-antikythera-mechanism-p2",
    prompt: "Who led the team that imaged the mechanism’s fragments in 2005?",
    options: [
      "Mike Edmunds led a Cardiff University team.",
      "A museum director led a team that had no university affiliation.",
      "An ancient astronomer led the modern scanning team.",
      "A public-health authority led the imaging project.",
    ],
    answer: 0,
    explanation:
      "2005년에 Cardiff University 팀을 이끈 사람은 Mike Edmunds라고 지문에 명시되어 있습니다.",
    difficulty: 1,
  },
  {
    id: "dad-science-054",
    passageId: "science-antikythera-mechanism-p2",
    prompt: "What did the 2005 imaging methods allow the team to do?",
    options: [
      "Use ordinary photographs to inspect only the outer casing.",
      "Image inside crust-encased fragments and read faint casing inscriptions.",
      "Count visible gears without examining the interior.",
      "Calculate the shipwreck date without scanning the fragments.",
    ],
    answer: 1,
    explanation:
      "컴퓨터 X선 단층촬영과 고해상도 스캔으로 껍질에 싸인 조각 내부를 보고 바깥 덮개에 있던 희미한 글을 읽을 수 있었습니다.",
    difficulty: 2,
  },
  {
    id: "dad-science-055",
    passageId: "science-antikythera-mechanism-p2",
    prompt: "What gear count did the scans suggest?",
    options: [
      "35 bronze gears, all of them still visible.",
      "30 meshing gears, with only five still visible.",
      "35 meshing bronze gears, 30 of which were still visible.",
      "35 gears made of separate materials, none still visible.",
    ],
    answer: 2,
    explanation:
      "스캔은 맞물린 청동 톱니가 35개였고 그중 30개가 여전히 보인다고 시사했습니다.",
    difficulty: 2,
  },
  {
    id: "dad-science-056",
    passageId: "science-antikythera-mechanism-p2",
    prompt: "Which pair of astronomical tasks did the visible gears enable?",
    options: [
      "They followed only the Sun and ignored eclipses.",
      "They predicted eclipses but treated the Moon’s orbit as regular.",
      "They modelled the Moon’s orbit but did not follow solar movement.",
      "They predicted eclipses and modelled the Moon’s irregular orbit.",
    ],
    answer: 3,
    explanation:
      "톱니들은 일식을 예측하고 달의 불규칙한 궤도를 모형화하게 했습니다.",
    difficulty: 2,
  },
  // DNA, passage 1
  {
    id: "dad-science-057",
    passageId: "science-dna-p1",
    prompt: "What shape do the two DNA polynucleotide chains form?",
    options: [
      "A double helix",
      "A single helix",
      "Two parallel sugar-phosphate sheets",
      "A chain of four uncoiled bases",
    ],
    answer: 0,
    explanation:
      "DNA의 두 폴리뉴클레오타이드 사슬은 서로 감겨 이중 나선을 이룹니다.",
    difficulty: 1,
  },
  {
    id: "dad-science-058",
    passageId: "science-dna-p1",
    prompt: "What kind of information does DNA carry?",
    options: [
      "Genetic instructions only for reproduction and no cell function.",
      "Genetic instructions for growth, function, development, and reproduction.",
      "Instructions for cell function but not growth or development.",
      "Instructions for organisms, while viruses are excluded.",
    ],
    answer: 1,
    explanation:
      "지문은 DNA가 생물과 많은 바이러스의 발달·기능·성장·번식에 관한 유전 지침을 운반한다고 합니다.",
    difficulty: 1,
  },
  {
    id: "dad-science-059",
    passageId: "science-dna-p1",
    prompt: "How does the passage classify DNA and RNA?",
    options: [
      "As proteins that store genetic instructions.",
      "As lipids alongside the other macromolecules.",
      "As nucleic acids.",
      "As carbohydrates that form chromosome backbones.",
    ],
    answer: 2,
    explanation:
      "DNA와 RNA는 핵산이며, 네 가지 주요 생체 거대분자 유형 가운데 하나라고 설명됩니다.",
    difficulty: 1,
  },
  {
    id: "dad-science-060",
    passageId: "science-dna-p1",
    prompt:
      "What does the list of major macromolecules emphasize about DNA and RNA?",
    options: [
      "They list three macromolecule types, with nucleic acids omitted.",
      "They show that only nucleic acids are essential to life.",
      "They classify DNA as a complex carbohydrate.",
      "They identify four macromolecule types essential to all known life.",
    ],
    answer: 3,
    explanation:
      "목록은 DNA와 RNA를 단백질·지질·복합 탄수화물과 함께 생명에 필수적인 네 거대분자 유형 중 하나로 놓습니다.",
    difficulty: 2,
  },
  // DNA, passage 2
  {
    id: "dad-science-061",
    passageId: "science-dna-p2",
    prompt: "What are the repeating units that compose each DNA strand?",
    options: [
      "Nucleotides",
      "Amino acids",
      "Four nitrogen-containing bases",
      "Sugar-phosphate linkages",
    ],
    answer: 0,
    explanation:
      "두 DNA 사슬은 더 단순한 단위인 뉴클레오타이드로 이루어져 있습니다.",
    difficulty: 1,
  },
  {
    id: "dad-science-062",
    passageId: "science-dna-p2",
    prompt: "Which base pairing is stated in the passage?",
    options: [
      "A with C and G with T",
      "A with T and C with G",
      "A with U and C with G",
      "T with C and A with G",
    ],
    answer: 1,
    explanation: "지문은 DNA의 염기쌍 규칙을 A-T, C-G로 제시합니다.",
    difficulty: 1,
  },
  {
    id: "dad-science-063",
    passageId: "science-dna-p2",
    prompt: "What forms the alternating backbone of a DNA strand?",
    options: [
      "Alternating bases and proteins joined by hydrogen bonds.",
      "Two sugars linked directly without phosphate groups.",
      "Sugar and phosphate alternate through phosphodiester links.",
      "A single chain of nitrogenous bases linked to lipids.",
    ],
    answer: 2,
    explanation:
      "당과 인산이 인접 뉴클레오타이드 사이의 인산다이에스터 결합으로 번갈아 이어져 골격을 만듭니다.",
    difficulty: 3,
  },
  {
    id: "dad-science-064",
    passageId: "science-dna-p2",
    prompt: "How are the two groups of DNA bases distinguished?",
    options: [
      "Pyrimidines have two rings; purines have one.",
      "Both groups have one ring, differing only in base color.",
      "Pyrimidines and purines are separated by their strand direction.",
      "Pyrimidines have one ring, whereas purines have two rings.",
    ],
    answer: 3,
    explanation:
      "피리미딘은 단일 고리, 퓨린은 이중 고리라는 구조 차이로 두 그룹을 구분합니다.",
    difficulty: 3,
  },
  // CRISPR, passage 1
  {
    id: "dad-science-065",
    passageId: "science-crispr-p1",
    prompt: "Where are CRISPR sequences found according to the passage?",
    options: [
      "In the genomes of prokaryotes such as bacteria and archaea.",
      "In genomes of eukaryotes such as animals and plants.",
      "In the cytoplasm of all infected hosts, not in genomes.",
      "In the genomes of viruses rather than prokaryotes.",
    ],
    answer: 0,
    explanation:
      "CRISPR은 세균과 고세균 같은 원핵생물의 유전체에서 발견되는 DNA 서열 집단입니다.",
    difficulty: 1,
  },
  {
    id: "dad-science-066",
    passageId: "science-crispr-p1",
    prompt:
      "Where does each sequence within an individual prokaryotic CRISPR come from?",
    options: [
      "A DNA fragment created by the prokaryote after infection.",
      "A DNA fragment from a bacteriophage that infected it or an ancestor.",
      "A DNA fragment from an organism that never infected the lineage.",
      "A repeated sequence copied from a host chromosome.",
    ],
    answer: 1,
    explanation:
      "각 서열은 해당 원핵생물이나 조상을 감염시킨 박테리오파지의 DNA 조각에서 유래합니다.",
    difficulty: 2,
  },
  {
    id: "dad-science-067",
    passageId: "science-crispr-p1",
    prompt: "How do CRISPR sequences help during later infections?",
    options: [
      "They recognize similar phage DNA but leave it intact.",
      "They destroy the prokaryote’s own DNA during first infection.",
      "They detect and destroy DNA from similar bacteriophages.",
      "They use matching DNA to produce oxygen during infection.",
    ],
    answer: 2,
    explanation:
      "이전 감염의 서열을 이용해 이후 비슷한 박테리오파지의 DNA를 찾아 파괴합니다.",
    difficulty: 2,
  },
  {
    id: "dad-science-068",
    passageId: "science-crispr-p1",
    prompt:
      "Why does the passage call CRISPR defense both acquired and heritable?",
    options: [
      "Because CRISPR sequences are inherited but do not record infection.",
      "Because every phage is destroyed before it can infect an ancestor.",
      "Because acquired phage fragments work only in the individual cell.",
      "Inherited phage fragments support an antiviral defense across generations.",
    ],
    answer: 3,
    explanation:
      "감염에서 얻은 파지 조각이 항바이러스 방어에 쓰이고 그 서열이 유전될 수 있어 두 성격을 가집니다.",
    difficulty: 3,
  },
  // CRISPR, passage 2
  {
    id: "dad-science-069",
    passageId: "science-crispr-p2",
    prompt: "What does Cas9 use as a guide?",
    options: [
      "CRISPR sequences",
      "A complementary DNA strand",
      "A bacteriophage protein",
      "A membrane gradient",
    ],
    answer: 0,
    explanation:
      "Cas9은 CRISPR 서열을 안내자로 이용해 상보적인 DNA 가닥을 찾습니다.",
    difficulty: 1,
  },
  {
    id: "dad-science-070",
    passageId: "science-crispr-p2",
    prompt: "What does Cas9 recognize and open?",
    options: [
      "All DNA strands regardless of sequence",
      "Specific DNA strands complementary to the CRISPR sequence",
      "Specific DNA strands identical rather than complementary to CRISPR",
      "Only RNA strands inside the cell",
    ],
    answer: 1,
    explanation:
      "Cas9은 CRISPR 서열에 상보적인 특정 DNA 가닥을 인식하고 열어 줍니다.",
    difficulty: 2,
  },
  {
    id: "dad-science-071",
    passageId: "science-crispr-p2",
    prompt:
      "What technology is based on combining Cas9 enzymes with CRISPR sequences?",
    options: [
      "CRISPR-Cas9 gene copying without opening DNA.",
      "A CRISPR sequence that edits proteins but not genes.",
      "CRISPR-Cas9 genome editing",
      "A genome-reading method that cannot edit living organisms.",
    ],
    answer: 2,
    explanation:
      "Cas9 효소와 CRISPR 서열을 결합하면 생물의 유전자를 편집하는 CRISPR-Cas9 기술이 됩니다.",
    difficulty: 1,
  },
  {
    id: "dad-science-072",
    passageId: "science-crispr-p2",
    prompt: "Which range of applications does the passage explicitly include?",
    options: [
      "Basic research, clinical treatment, but not biotechnology products.",
      "Biotechnology products, gene repair, and disease prevention.",
      "Disease treatment alone after laboratory development.",
      "Basic research, biotechnological products, and treatment of diseases.",
    ],
    answer: 3,
    explanation:
      "명시된 적용 범위는 기초 생물학 연구, 생명공학 제품 개발, 질병 치료입니다.",
    difficulty: 2,
  },
  // Germ theory, passage 1
  {
    id: "dad-science-073",
    passageId: "science-germ-theory-of-disease-p1",
    prompt: "What does germ theory explain?",
    options: [
      "The cause of infectious diseases.",
      "The cause of infectious and noninfectious diseases.",
      "The movement of pathogens but not the cause of infection.",
      "The cause of infectious disease only when another agent is present.",
    ],
    answer: 0,
    explanation:
      "지문은 세균설을 감염성 질병의 원인을 설명하는 현재의 과학 이론이라고 정의합니다.",
    difficulty: 1,
  },
  {
    id: "dad-science-074",
    passageId: "science-germ-theory-of-disease-p1",
    prompt: "What can pathogens do inside a host?",
    options: [
      "Their growth can cause disease, but reproduction cannot.",
      "Their growth and reproduction within hosts can cause disease.",
      "Their reproduction occurs outside hosts and never affects health.",
      "Their presence always causes disease regardless of growth.",
    ],
    answer: 1,
    explanation:
      "병원체가 숙주 안에서 성장하고 번식하면 질병을 일으킬 수 있다고 설명합니다.",
    difficulty: 1,
  },
  {
    id: "dad-science-075",
    passageId: "science-germ-theory-of-disease-p1",
    prompt: "Why is the word germ broader than bacteria in this passage?",
    options: [
      "It refers only to bacteria and excludes viruses.",
      "It includes only visible parasites and fungi.",
      "It includes fungi, viruses, parasites, and other pathogens.",
      "It refers to any chemical that harms a host.",
    ],
    answer: 2,
    explanation:
      "germ은 세균뿐 아니라 원생생물·균류·기생충·바이러스·프리온·바이로이드 등도 가리킵니다.",
    difficulty: 2,
  },
  {
    id: "dad-science-076",
    passageId: "science-germ-theory-of-disease-p1",
    prompt:
      "What other factors can shape disease after a pathogen is involved?",
    options: [
      "Environmental factors alone determine whether exposure causes infection.",
      "Hereditary factors affect severity but not infection.",
      "Pathogens determine infection and environmental factors have no role.",
      "Environment and heredity can affect severity or infection as well as the pathogen.",
    ],
    answer: 3,
    explanation:
      "병원체가 주된 원인이어도 환경과 유전 요인이 질병의 심각도와 노출 뒤 감염 여부에 영향을 줄 수 있습니다.",
    difficulty: 3,
  },
  // Germ theory, passage 2
  {
    id: "dad-science-077",
    passageId: "science-germ-theory-of-disease-p2",
    prompt:
      "How had the position of miasma theory changed by the end of the 1880s, according to the passage?",
    options: [
      "It was struggling to compete with germ theory.",
      "It had absorbed Koch’s discoveries without losing support.",
      "It had prevented germ theory from identifying disease-causing organisms.",
      "It remained the main explanation supported by Pasteur’s work.",
    ],
    answer: 0,
    explanation:
      "지문은 1880년대가 끝날 무렵 미아즈마설이 세균설과 경쟁하는 데 어려움을 겪었다고 명시합니다. 파스퇴르와 코흐의 연구는 세균설의 성장을 설명하는 근거입니다.",
    difficulty: 2,
  },
  {
    id: "dad-science-078",
    passageId: "science-germ-theory-of-disease-p2",
    prompt:
      "What limitation remained even though smallpox vaccination was commonplace?",
    options: [
      "They knew how it worked but could not make it common.",
      "They did not know its mechanism or how to apply it to other diseases.",
      "They knew how to extend it but not how the vaccine worked.",
      "They understood its mechanism and applied it to every disease.",
    ],
    answer: 1,
    explanation:
      "천연두 접종은 흔했지만 의사들은 그 작동 방식과 다른 질병에 적용하는 방법을 알지 못했습니다.",
    difficulty: 2,
  },
  {
    id: "dad-science-079",
    passageId: "science-germ-theory-of-disease-p2",
    prompt:
      "Which sequence describes the transition from Pasteur’s work to Koch’s extension?",
    options: [
      "Pasteur’s work ended when Koch began in the 1850s.",
      "Koch began in the 1880s before Pasteur’s transitional work.",
      "Pasteur began work in the late 1850s; Koch later extended it in the 1880s.",
      "The transition began with Jenner’s smallpox vaccination.",
    ],
    answer: 2,
    explanation:
      "전환기는 1850년대 후반 Pasteur의 연구로 시작되고 1880년대 Koch의 연구로 확장되었다고 제시됩니다.",
    difficulty: 2,
  },
  {
    id: "dad-science-080",
    passageId: "science-germ-theory-of-disease-p2",
    prompt: "What development marked the “golden era” of bacteriology?",
    options: [
      "It quickly identified organisms but weakened germ theory.",
      "It identified causes of many diseases only after miasma theory became dominant.",
      "It identified pathogens but not the organisms causing disease.",
      "Germ theory quickly led to identifying organisms that cause many diseases.",
    ],
    answer: 3,
    explanation:
      "세균설이 많은 질병의 실제 원인 생물을 빠르게 밝혀낸 시기가 세균학의 ‘황금시대’였습니다.",
    difficulty: 2,
  },
];

const buildQuestion = (spec) => {
  const passage = passageById.get(spec.passageId);
  if (!passage) throw new Error(`Unknown science passage: ${spec.passageId}`);
  const article = articleById.get(passage.articleId);
  if (!article)
    throw new Error(`Unknown science article: ${passage.articleId}`);
  return {
    id: spec.id,
    topic: "science",
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

export const dadScienceQuestions = questionSpecs.map(buildQuestion);
