import sourceData from "./assets/wikipedia/science-sources.json" with { type: "json" };

const passageById = new Map(
  sourceData.passages.map((passage) => [passage.id, passage]),
);
const articleById = new Map(
  sourceData.articles.map((article) => [article.id, article]),
);

const questionSpecs = [
  {
    id: "dad-science-v2-001",
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
    id: "dad-science-v2-002",
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
    id: "dad-science-v2-003",
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
    id: "dad-science-v2-004",
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
    id: "dad-science-v2-005",
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
    id: "dad-science-v2-006",
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
    id: "dad-science-v2-007",
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
    id: "dad-science-v2-008",
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
    id: "dad-science-v2-009",
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
    id: "dad-science-v2-010",
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
    id: "dad-science-v2-011",
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
    id: "dad-science-v2-012",
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
    id: "dad-science-v2-013",
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
    id: "dad-science-v2-014",
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
    id: "dad-science-v2-015",
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
    id: "dad-science-v2-016",
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
    id: "dad-science-v2-017",
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
    id: "dad-science-v2-018",
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
    id: "dad-science-v2-019",
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
    id: "dad-science-v2-020",
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
    passageId: "science-penicillin-p3",
    prompt: "What determines the precise constitution of extracted penicillin?",
    answer: 1,
    explanation:
      "지문은 extracted penicillin의 precise constitution이 사용한 Penicillium mould의 species와 배양에 사용한 nutrient media에 달려 있다고 설명합니다.",
    difficulty: 2,
    id: "dad-science-v2-021",
    options: [
      "Only the name of the physician who first observed the mould.",
      "The species of Penicillium mould and the nutrient media used to culture it.",
      "The number of clinical doses given to patients.",
      "The wavelength used to examine the fungus.",
    ],
  },
  {
    passageId: "science-penicillin-p4",
    prompt: "How was the strain used to manufacture penicillin G improved?",
    answer: 2,
    explanation:
      "지문은 오늘날 penicillin G 제조에 쓰이는 곰팡이 균주가 제조 과정의 수율을 높이도록 genetic engineering으로 만들어졌다고 말합니다.",
    difficulty: 2,
    id: "dad-science-v2-022",
    options: [
      "It was selected because all other natural penicillins were already in clinical use.",
      "It was changed by adding phenoxyacetic acid during every culture.",
      "It was created by genetic engineering to improve the yield in the manufacturing process.",
      "It was replaced with a strain that produces only penicillin V.",
    ],
  },
  {
    passageId: "science-penicillin-p5",
    prompt: "Why is penicillin G given by injection rather than by mouth?",
    answer: 3,
    explanation:
      "지문은 stomach acid가 penicillin G를 파괴하므로 입으로 먹을 수 없고 intravenous or intramuscular injection으로 투여한다고 설명합니다.",
    difficulty: 2,
    id: "dad-science-v2-023",
    options: [
      "It is absorbed only when mixed with penicillin V.",
      "Its side chain prevents it from entering the bloodstream.",
      "It is intended only for diseases requiring low blood levels.",
      "Stomach acid destroys it, so it is administered intravenously or intramuscularly.",
    ],
  },
  {
    passageId: "science-penicillin-p6",
    prompt:
      "What treatment choice does the passage associate with widespread penicillin resistance?",
    answer: 1,
    explanation:
      "지문은 penicillin resistance가 흔해졌기 때문에 other antibiotics가 치료에서 선호된다고 말합니다.",
    difficulty: 2,
    id: "dad-science-v2-024",
    options: [
      "Penicillin is always preferred as the first-line treatment.",
      "Other antibiotics are now the preferred choice for treatments.",
      "Only topical antiseptics should be used for every infection.",
      "Penicillin should be used without checking susceptibility.",
    ],
  },
  {
    passageId: "science-penicillin-p7",
    prompt: "How does penicillin kill bacteria according to the passage?",
    answer: 2,
    explanation:
      "지문은 penicillin이 peptidoglycan 합성의 완성을 막아 세포벽을 약화시키고 cell lysis와 death에 이르게 한다고 설명합니다.",
    difficulty: 2,
    id: "dad-science-v2-025",
    options: [
      "It increases peptidoglycan cross-linking until the wall becomes rigid.",
      "It removes water from the cell by strengthening its osmotic gradient.",
      "It blocks peptidoglycan synthesis, weakens the cell wall, and leads to lysis and death.",
      "It prevents bacteria from forming any β-lactam ring.",
    ],
  },
  {
    passageId: "science-penicillin-p8",
    prompt:
      "Under what production condition does Penicillium rubens make penicillin as a secondary metabolite?",
    answer: 3,
    explanation:
      "지문은 Penicillium rubens가 sugar fermentation 중 곰팡이의 성장이 stress로 억제되면 penicillin을 secondary metabolite로 만든다고 말합니다.",
    difficulty: 2,
    id: "dad-science-v2-026",
    options: [
      "When the fungus grows without any stress in pure water.",
      "When all feedback from l-lysine is removed from the pathway.",
      "When penicillin is produced directly by human cells.",
      "During sugar fermentation when growth of the fungus is inhibited by stress.",
    ],
  },
  {
    passageId: "science-x-ray-p3",
    prompt: "What did Wilhelm Röntgen do on 8 November 1895?",
    answer: 1,
    explanation:
      "지문은 1895년 11월 8일 Röntgen이 Lenard tubes와 Crookes tubes를 실험하다 X-rays를 발견했다고 설명합니다.",
    difficulty: 2,
    id: "dad-science-v2-027",
    options: [
      "He named a known type of radiation after the Greek letter Chi.",
      "He discovered X-rays while experimenting with Lenard tubes and Crookes tubes.",
      "He first used X-rays in a surgical operation in Birmingham.",
      "He received the Nobel Prize before writing any report.",
    ],
  },
  {
    passageId: "science-x-ray-p4",
    prompt:
      "What happened in North America through February after Röntgen’s report?",
    answer: 2,
    explanation:
      "지문은 2월까지 North America에서 46 experimenters가 그 기법을 받아들였다고 말합니다.",
    difficulty: 2,
    id: "dad-science-v2-028",
    options: [
      "No one attempted to make an X-ray photograph.",
      "Only Röntgen continued the technique in Europe.",
      "Forty-six experimenters took up the technique.",
      "The technique was restricted to crystallography.",
    ],
  },
  {
    passageId: "science-x-ray-p5",
    prompt: "Which description matches hard X-rays in the passage?",
    answer: 3,
    explanation:
      "지문은 hard X-rays를 높은 photon energies와 연결하고 penetrating ability 때문에 물체 내부 촬영에 널리 쓴다고 설명합니다.",
    difficulty: 2,
    id: "dad-science-v2-029",
    options: [
      "They have lower photon energies and longer wavelengths than soft X-rays.",
      "They are easily absorbed in air and cannot image inside objects.",
      "They are defined only by their use in crystal structures.",
      "They have higher photon energies, penetrate objects, and are used for internal imaging.",
    ],
  },
  {
    passageId: "science-x-ray-p6",
    prompt: "Which three interactions with matter are listed for X-rays?",
    answer: 1,
    explanation:
      "지문은 X-rays와 matter의 상호작용으로 photoabsorption, Compton scattering, Rayleigh scattering을 나열합니다.",
    difficulty: 2,
    id: "dad-science-v2-030",
    options: [
      "Refraction, combustion, and magnetic induction.",
      "Photoabsorption, Compton scattering, and Rayleigh scattering.",
      "Nuclear fission, osmosis, and fluorescence only.",
      "Reflection, evaporation, and gravitational capture.",
    ],
  },
  {
    passageId: "science-x-ray-p7",
    prompt: "How does an X-ray tube generate X-rays?",
    answer: 2,
    explanation:
      "지문은 hot cathode에서 나온 electrons를 high voltage로 가속해 metal target인 anode에 충돌시키면 X-rays가 생긴다고 설명합니다.",
    difficulty: 2,
    id: "dad-science-v2-031",
    options: [
      "A cold cathode absorbs photons from a crystal.",
      "A metal target emits X-rays without any electron collision.",
      "A hot cathode releases electrons that high voltage accelerates into a metal anode.",
      "A fluorescent screen turns visible light directly into X-rays.",
    ],
  },
  {
    passageId: "science-x-ray-p8",
    prompt: "What is fluoroscopy used to obtain?",
    answer: 3,
    explanation:
      "지문은 fluoroscopy를 patient의 internal structures에 대한 real-time moving images를 얻는 영상 기법이라고 정의합니다.",
    difficulty: 2,
    id: "dad-science-v2-032",
    options: [
      "A static image of only crystal lattices.",
      "A measurement of photon energy without a patient.",
      "A scan that never uses an X-ray source.",
      "Real-time moving images of a patient’s internal structures.",
    ],
  },
  {
    passageId: "science-smallpox-vaccine-p3",
    prompt: "What distinction among vaccine generations is described?",
    answer: 1,
    explanation:
      "지문은 first-generation이 살아 있는 동물 피부에서 자랐고 later generations가 배양 기술이나 attenuated strains를 사용했다고 구분합니다.",
    difficulty: 2,
    id: "dad-science-v2-033",
    options: [
      "All generations were transmitted only arm-to-arm.",
      "First-generation vaccines used live-animal skin, while later generations used cultures or attenuated strains.",
      "Second-generation vaccines were made only from dry flasks.",
      "Third-generation vaccines were the oldest vaccines used in the 1790s.",
    ],
  },
  {
    passageId: "science-smallpox-vaccine-p4",
    prompt: "What was a key feature of first-generation smallpox vaccines?",
    answer: 2,
    explanation:
      "지문은 first-generation vaccines가 live vaccinia virus를 live animals의 skin에서 길러 제조되었다고 설명합니다.",
    difficulty: 2,
    id: "dad-science-v2-034",
    options: [
      "They contained only an attenuated strain unable to replicate.",
      "They were produced in human cell cultures rather than animals.",
      "They were made by growing live vaccinia virus in the skin of live animals.",
      "They could be preserved only when continuously refrigerated.",
    ],
  },
  {
    passageId: "science-smallpox-vaccine-p5",
    prompt: "What happened to the Ankara vaccinia strain after serial passage?",
    answer: 3,
    explanation:
      "지문은 serial passage 뒤 Ankara vaccinia가 유전체의 over 14%를 잃고 human cells에서 더는 replicate할 수 없게 되었다고 말합니다.",
    difficulty: 2,
    id: "dad-science-v2-035",
    options: [
      "It gained the ability to replicate in human cells.",
      "It was used only as a bacterial vaccine.",
      "It became a cowpox strain used in the 1790s.",
      "It lost over 14% of its genome and could no longer replicate in human cells.",
    ],
  },
  {
    passageId: "science-smallpox-vaccine-p6",
    prompt: "What is LC16m8?",
    answer: 1,
    explanation:
      "지문은 LC16m8을 일본에서 제조하는 minimally replicating attenuated strain of vaccinia라고 설명합니다.",
    difficulty: 2,
    id: "dad-science-v2-036",
    options: [
      "A fully replicating strain made only in West Germany.",
      "A minimally replicating attenuated strain of vaccinia manufactured in Japan.",
      "A vaccine made from a nonviral bacterial culture.",
      "A first-generation calf lymph vaccine from the 1880s.",
    ],
  },
  {
    passageId: "science-smallpox-vaccine-p7",
    prompt: "What did the limited North American variolation trial show?",
    answer: 2,
    explanation:
      "지문은 제한적 시험에서 variolation 사망률이 자연 disease보다 낮았고 그 절차가 이후 널리 채택되었다고 제시합니다.",
    difficulty: 2,
    id: "dad-science-v2-037",
    options: [
      "Natural disease had a lower death rate than variolation.",
      "No one in the trial received variolation.",
      "Variolation had fewer deaths than natural disease and was then widely adopted.",
      "The trial proved variolation was more deadly than natural infection.",
    ],
  },
  {
    passageId: "science-smallpox-vaccine-p8",
    prompt:
      "How did the Balmis Expedition carry cowpox vaccine to distant regions?",
    answer: 3,
    explanation:
      "지문은 Balmis Expedition이 flasks가 아니라 live cowpox virus를 지닌 22 orphaned boys를 운반자로 삼았다고 설명합니다.",
    difficulty: 2,
    id: "dad-science-v2-038",
    options: [
      "It transported only sealed flasks by ship.",
      "It relied on dry powder kept without any carriers.",
      "It used a chain of X-ray images to identify the virus.",
      "It carried live virus through 22 orphaned boys who served as carriers.",
    ],
  },
  {
    passageId: "science-plate-tectonics-p3",
    prompt: "How does the passage describe the tectonic “conveyor belt”?",
    answer: 1,
    explanation:
      "지문은 subduction이 표면을 줄이고 divergent margins의 seafloor spreading이 새 oceanic crust를 만들어 균형을 맞춘다고 설명합니다.",
    difficulty: 2,
    id: "dad-science-v2-039",
    options: [
      "Subduction creates crust while divergent margins destroy it.",
      "Subduction removes surface area and seafloor spreading creates new oceanic crust to balance it.",
      "Both convergent and divergent margins permanently reduce Earth’s surface.",
      "Only continental crust is recycled while oceanic crust remains fixed.",
    ],
  },
  {
    passageId: "science-plate-tectonics-p4",
    prompt: "What evidence of tectonic activity is mentioned for Europa?",
    answer: 2,
    explanation:
      "지문은 Europa에서 ice crustal plates가 moving and interacting하는 징후가 보인다고 말합니다.",
    difficulty: 2,
    id: "dad-science-v2-040",
    options: [
      "Europa has the same continents as Earth.",
      "Europa has no evidence of any crustal movement.",
      "Europa shows signs of ice crustal plates moving and interacting.",
      "Europa’s activity is described as identical to Earth’s in every detail.",
    ],
  },
  {
    passageId: "science-plate-tectonics-p5",
    prompt:
      "Which process is identified as the strongest driver of plate motion?",
    answer: 3,
    explanation:
      "지문은 subduction zone에서 cold, dense oceanic crust가 맨틀로 가라앉는 과정이 판 운동의 strongest driver라고 설명합니다.",
    difficulty: 2,
    id: "dad-science-v2-041",
    options: [
      "Tidal drag alone at every plate boundary.",
      "The fixed position of continents above the crust.",
      "The disappearance of all mantle convection.",
      "Cold, dense oceanic crust sinking at a subduction zone.",
    ],
  },
  {
    passageId: "science-plate-tectonics-p6",
    prompt: "What happens at a divergent plate boundary?",
    answer: 1,
    explanation:
      "지문은 divergent boundaries에서 두 판이 slide apart하고 seafloor spreading으로 new ocean basin이 만들어진다고 설명합니다.",
    difficulty: 2,
    id: "dad-science-v2-042",
    options: [
      "Two plates grind past each other without creating or destroying crust.",
      "Two plates slide apart and seafloor spreading forms a new ocean basin.",
      "One plate always sinks beneath a continent.",
      "A plate boundary forms only after an ocean trench disappears.",
    ],
  },
  {
    passageId: "science-plate-tectonics-p7",
    prompt: "What characterizes a transform boundary?",
    answer: 2,
    explanation:
      "지문은 transform boundaries에서 판이 생성되거나 파괴되지 않고 transform faults를 따라 서로 grind past each other한다고 말합니다.",
    difficulty: 2,
    id: "dad-science-v2-043",
    options: [
      "Plates are created at the boundary by seafloor spreading.",
      "One plate must be subducted beneath the other.",
      "Plates grind past each other along transform faults without being created or destroyed.",
      "Transform faults cannot produce strong earthquakes.",
    ],
  },
  {
    passageId: "science-plate-tectonics-p8",
    prompt: "What did the evidence around 1965 make clear?",
    answer: 3,
    explanation:
      "지문은 해저와 대륙 주변 증거가 1965년 무렵 continental drift가 feasible함을 보였고 plate tectonics가 Earth sciences를 혁신했다고 설명합니다.",
    difficulty: 2,
    id: "dad-science-v2-044",
    options: [
      "Continental drift was impossible and plate tectonics ended.",
      "Only paleobiology changed, while Earth science stayed the same.",
      "The theory was defined before any ocean-floor evidence existed.",
      "Continental drift was feasible, and plate tectonics soon revolutionized Earth sciences.",
    ],
  },
  {
    passageId: "science-radioactive-decay-p3",
    prompt:
      "What names does the passage give to the nuclei before and after a decay?",
    answer: 1,
    explanation:
      "지문은 붕괴하는 핵을 parent radionuclide라 하고 그 과정이 적어도 하나의 daughter nuclide를 만든다고 설명합니다.",
    difficulty: 2,
    id: "dad-science-v2-045",
    options: [
      "Both nuclei are called daughter nuclides.",
      "The unstable nucleus is the parent radionuclide and the product is a daughter nuclide.",
      "The starting nucleus is a stable isotope and the product is always gamma radiation.",
      "The starting nucleus is called a photon and the product a proton.",
    ],
  },
  {
    passageId: "science-radioactive-decay-p4",
    prompt:
      "Which statement about primordial radionuclides is supported by the passage?",
    answer: 2,
    explanation:
      "지문은 태양계 형성 이전에 존재한 28개 naturally occurring radioactive elements의 35 radionuclides를 primordial radionuclides라 부릅니다.",
    difficulty: 2,
    id: "dad-science-v2-046",
    options: [
      "They were all created after the Solar System formed.",
      "They consist only of synthetic isotopes made in laboratories.",
      "They include 35 radionuclides in 28 naturally radioactive elements dating before the Solar System formed.",
      "They are limited to one decay chain and exclude uranium.",
    ],
  },
  {
    passageId: "science-radioactive-decay-p5",
    prompt: "How did Rutherford order the three named radiation beams?",
    answer: 3,
    explanation:
      "지문은 Rutherford가 물질을 뚫는 능력이 증가하는 순서로 alpha, beta, gamma라는 이름을 붙였다고 설명합니다.",
    difficulty: 2,
    id: "dad-science-v2-047",
    options: [
      "By their chemical smell.",
      "By the year each beam was discovered.",
      "By decreasing electrical charge: gamma, beta, then alpha.",
      "By increasing ability to penetrate matter: alpha, beta, then gamma.",
    ],
  },
  {
    passageId: "science-radioactive-decay-p6",
    prompt: "What happens in electron capture?",
    answer: 1,
    explanation:
      "지문은 proton-rich nuclides가 positrons를 방출하는 대신 자신의 atomic electrons를 capture한다고 말합니다.",
    difficulty: 2,
    id: "dad-science-v2-048",
    options: [
      "A nuclide emits only a positron and never changes its neutron-to-proton ratio.",
      "A proton-rich nuclide captures one of its own atomic electrons instead of emitting a positron.",
      "An electron is captured by the detector rather than by the nucleus.",
      "The process always creates a less stable, higher-energy nucleus.",
    ],
  },
  {
    passageId: "science-radioactive-decay-p7",
    prompt: "What can happen to a daughter nuclide in a decay chain?",
    answer: 2,
    explanation:
      "지문은 daughter nuclide도 불안정할 수 있어 여러 번 붕괴하는 decay chain을 이루다가 stable nuclide가 된다고 설명합니다.",
    difficulty: 2,
    id: "dad-science-v2-049",
    options: [
      "It must be stable immediately after the parent decays.",
      "It always changes into a photon without further radiation.",
      "It may itself be radioactive and decay repeatedly until a stable nuclide is produced.",
      "It can never be produced by alpha decay.",
    ],
  },
  {
    passageId: "science-radioactive-decay-p8",
    prompt: "What is radioisotopic labeling used to track?",
    answer: 3,
    explanation:
      "지문은 radioisotopic labeling이 복잡한 계에서 chemical substance의 이동을 decay events 위치로 추적하는 데 쓰인다고 설명합니다.",
    difficulty: 2,
    id: "dad-science-v2-050",
    options: [
      "Only the temperature of an isolated radioactive sample.",
      "The number of protons in every atom before decay.",
      "The age of a crystal without detecting any radiation.",
      "The passage of a chemical substance through a complex system by locating decay events.",
    ],
  },
  {
    passageId: "science-photosynthesis-p3",
    prompt: "What distinguishes the anoxygenic photosynthesis described?",
    answer: 1,
    explanation:
      "지문은 anoxygenic photosynthesis가 oxygen을 만들지 않으며 일부 bacteria가 hydrogen sulfide를 나누어 sulfur를 내놓는다고 설명합니다.",
    difficulty: 2,
    id: "dad-science-v2-051",
    options: [
      "It always splits water and releases oxygen.",
      "It does not produce oxygen; some bacteria split hydrogen sulfide and release sulfur.",
      "It occurs only in plants with chloroplasts.",
      "It uses only animal pigments and cannot make ATP.",
    ],
  },
  {
    passageId: "science-photosynthesis-p4",
    prompt: "What do the Calvin-cycle reactions do in the passage?",
    answer: 2,
    explanation:
      "지문은 Calvin cycle에서 atmospheric carbon dioxide가 기존 organic compounds에 들어가고 ATP와 NADPH가 사용된다고 설명합니다.",
    difficulty: 2,
    id: "dad-science-v2-052",
    options: [
      "They remove ATP and NADPH before any carbon enters organic compounds.",
      "They occur only in bacteria through the reverse Krebs cycle.",
      "They incorporate atmospheric carbon dioxide into existing organic compounds using ATP and NADPH.",
      "They convert glucose into light energy inside reaction centers.",
    ],
  },
  {
    passageId: "science-photosynthesis-p5",
    prompt:
      "What contrast between photosynthesis and cellular respiration is stated?",
    answer: 3,
    explanation:
      "지문은 photosynthesis가 carbon dioxide를 carbohydrates로 환원하고 cellular respiration은 carbohydrates를 carbon dioxide로 산화한다고 대비합니다.",
    difficulty: 2,
    id: "dad-science-v2-053",
    options: [
      "Both are oxidation of carbohydrates to carbon dioxide.",
      "Photosynthesis and respiration both reduce carbon dioxide to carbohydrates.",
      "Photosynthesis releases no chemical energy and respiration makes carbohydrates.",
      "Photosynthesis reduces carbon dioxide to carbohydrates, while respiration oxidizes carbohydrates to carbon dioxide.",
    ],
  },
  {
    passageId: "science-photosynthesis-p6",
    prompt:
      "Where are the light-gathering proteins of photosynthetic bacteria located?",
    answer: 1,
    explanation:
      "지문은 photosynthetic bacteria의 빛 수집 단백질이 cell membranes에 있고 막이 thylakoids나 intracytoplasmic membranes로 접힐 수 있다고 설명합니다.",
    difficulty: 2,
    id: "dad-science-v2-054",
    options: [
      "Only inside the nuclei of bacterial cells.",
      "In cell membranes, sometimes folded into thylakoids or intracytoplasmic membranes.",
      "In the extracellular soil surrounding the bacteria.",
      "Only in the chloroplasts of plant leaves.",
    ],
  },
  {
    passageId: "science-photosynthesis-p7",
    prompt:
      "What sequence is described for the chlorophyll electron in the light-dependent reactions?",
    answer: 2,
    explanation:
      "지문은 chlorophyll이 전자를 잃고 pheophytin이 quinone으로 전달해 NADPH와 ATP 생성에 이르게 하며 photolysis가 oxygen을 낸다고 설명합니다.",
    difficulty: 2,
    id: "dad-science-v2-055",
    options: [
      "Chlorophyll gains an electron, destroys ATP, and releases no oxygen.",
      "Water receives the electron and directly becomes carbon dioxide.",
      "Chlorophyll loses an electron; pheophytin passes it to quinone, leading to NADPH, an ATP gradient, and oxygen from photolysis.",
      "Pheophytin blocks every electron transport chain before ATP synthesis.",
    ],
  },
  {
    passageId: "science-photosynthesis-p8",
    prompt: "What happens in hot, dry conditions according to the passage?",
    answer: 3,
    explanation:
      "지문은 hot and dry conditions에서 stomata가 닫혀 물 손실을 막고 carbon dioxide가 줄며 photorespiration이 늘어 carbon fixation이 감소한다고 말합니다.",
    difficulty: 2,
    id: "dad-science-v2-056",
    options: [
      "Stomata open widely, carbon dioxide rises, and carbon fixation always increases.",
      "Oxygen falls and photorespiration stops completely.",
      "RuBisCO becomes an oxygen donor and no longer reacts with gases.",
      "Stomata close to prevent water loss; carbon dioxide falls, photorespiration rises, and carbon fixation decreases.",
    ],
  },
  {
    passageId: "science-antikythera-mechanism-p3",
    prompt: "What happened to the Antikythera artefact after its recovery?",
    answer: 1,
    explanation:
      "지문은 artefact가 1901년 shipwreck 잔해에서 발견되었고 conservation 뒤 82 separate fragments로 나뉘었다고 설명합니다.",
    difficulty: 2,
    id: "dad-science-v2-057",
    options: [
      "It was built in a museum in 1902 from unrelated gears.",
      "It was found in 1901 wreckage and later separated into 82 fragments after conservation.",
      "Only a single intact gear survived and no inscriptions were found.",
      "It was recovered from a land excavation far from Antikythera.",
    ],
  },
  {
    passageId: "science-antikythera-mechanism-p4",
    prompt: "Who discovered the Antikythera wreck described in the passage?",
    answer: 2,
    explanation:
      "지문은 Captain Dimitrios Kontos와 Symi island의 sponge divers가 난파선을 발견했다고 말합니다.",
    difficulty: 2,
    id: "dad-science-v2-058",
    options: [
      "A team from Cardiff University led by Mike Edmunds.",
      "A Roman cargo crew sailing from Athens in 1902.",
      "Captain Dimitrios Kontos and sponge divers from Symi island.",
      "The National Archaeological Museum staff during conservation.",
    ],
  },
  {
    passageId: "science-antikythera-mechanism-p5",
    prompt: "What does the mechanism’s manufacture suggest about its history?",
    answer: 3,
    explanation:
      "지문은 mechanism의 quality와 complexity가 undiscovered predecessors가 Hellenistic period에 있었음을 시사한다고 설명합니다.",
    difficulty: 2,
    id: "dad-science-v2-059",
    options: [
      "It was a simple device unrelated to astronomy.",
      "It was definitely built after the fourteenth century.",
      "Its construction used only theories developed in modern Europe.",
      "Its quality and complexity suggest undiscovered Hellenistic predecessors.",
    ],
  },
  {
    passageId: "science-antikythera-mechanism-p6",
    prompt: "What did the lunar pointer approximate?",
    answer: 1,
    explanation:
      "지문은 lunar pointer가 Moon의 elliptical orbit에서 acceleration과 deceleration을 근사했다고 말합니다.",
    difficulty: 2,
    id: "dad-science-v2-060",
    options: [
      "Only the fixed position of the Sun on a circular dial.",
      "The Moon’s acceleration and deceleration along its elliptical orbit.",
      "The four-year cycle of games without any celestial motion.",
      "A uniform orbit that ignored the Moon’s changing speed.",
    ],
  },
  {
    passageId: "science-antikythera-mechanism-p7",
    prompt: "What additional function was reported in the 2008 findings?",
    answer: 2,
    explanation:
      "지문은 2008년 연구가 mechanism이 Metonic calendar와 solar eclipses뿐 아니라 panhellenic athletic games의 시기도 계산했다고 보고했다고 설명합니다.",
    difficulty: 2,
    id: "dad-science-v2-061",
    options: [
      "The mechanism stopped tracking the Metonic calendar.",
      "It measured only the depth of the shipwreck.",
      "It calculated the timing of panhellenic athletic games as well as tracking calendars and eclipses.",
      "It used no inscriptions connected with any calendar.",
    ],
  },
  {
    passageId: "science-antikythera-mechanism-p8",
    prompt:
      "Which calendar was the mechanism likely to use according to the passage?",
    answer: 3,
    explanation:
      "지문은 달력의 달 이름과 Games dial의 근거를 들어 장치의 달력이 Epirote calendar일 가능성이 높고 Epirus의 Corinthian colony에서 받아들였을 수 있다고 설명합니다.",
    difficulty: 2,
    id: "dad-science-v2-062",
    options: [
      "A calendar from Corinth itself with no connection to Epirus.",
      "A calendar that began only after the modern Gregorian reform.",
      "A calendar based solely on the names of Roman emperors.",
      "The Epirote calendar, probably adopted from a Corinthian colony in Epirus.",
    ],
  },
  {
    passageId: "science-dna-p3",
    prompt: "What shape do DNA’s paired strands form?",
    answer: 1,
    explanation:
      "지문은 두 DNA 가닥이 서로 감겨 double helix 모양을 이룬다고 설명합니다.",
    difficulty: 2,
    id: "dad-science-v2-063",
    options: [
      "A single uncoiled strand.",
      "A double helix.",
      "A flat protein sheet.",
      "A ring made only of phosphate groups.",
    ],
  },
  {
    passageId: "science-dna-p4",
    prompt: "What two forces primarily stabilize the DNA double helix?",
    answer: 2,
    explanation:
      "지문은 DNA double helix의 안정화에 hydrogen bonds between nucleotides와 base-stacking interactions가 주로 기여한다고 말합니다.",
    difficulty: 2,
    id: "dad-science-v2-064",
    options: [
      "Ionic bonds between sugars and light absorption by chlorophyll.",
      "Only covalent bonds between separate DNA backbones.",
      "Hydrogen bonds between nucleotides and base-stacking interactions.",
      "Magnetic attraction between chromosomes and proteins.",
    ],
  },
  {
    passageId: "science-dna-p5",
    prompt: "What is negative DNA supercoiling described as doing?",
    answer: 3,
    explanation:
      "지문은 negative supercoiling이 helix와 반대 방향으로 꼬여 bases가 더 쉽게 떨어지게 한다고 설명합니다.",
    difficulty: 2,
    id: "dad-science-v2-065",
    options: [
      "It holds bases more tightly by twisting in the helix direction.",
      "It removes every twist from DNA permanently.",
      "It changes DNA into RNA without enzymes.",
      "It twists opposite the helix direction so the bases come apart more easily.",
    ],
  },
  {
    passageId: "science-dna-p6",
    prompt: "How can DNA packaging affect gene expression?",
    answer: 1,
    explanation:
      "지문은 DNA packaging과 base or histone modifications가 함께 chromatin과 gene expression에 영향을 줄 수 있다고 설명합니다.",
    difficulty: 2,
    id: "dad-science-v2-066",
    options: [
      "Packaging has no relation to whether genes are expressed.",
      "Chromatin packaging and base or histone modifications can coordinate gene expression.",
      "Only the amount of water outside the cell controls expression.",
      "Gene expression stops whenever DNA is wrapped around histones.",
    ],
  },
  {
    passageId: "science-dna-p7",
    prompt: "What mechanism allows a cell to copy DNA during division?",
    answer: 2,
    explanation:
      "지문은 세포 분열 때 DNA strands가 분리되고 DNA polymerase가 complementary sequences를 만든다고 설명합니다.",
    difficulty: 2,
    id: "dad-science-v2-067",
    options: [
      "Both strands remain together and are copied by a membrane pump.",
      "RNA replaces both strands before any copying occurs.",
      "The strands separate and DNA polymerase builds complementary sequences by base pairing.",
      "Only the old strand is copied and the other daughter cell receives no DNA.",
    ],
  },
  {
    passageId: "science-dna-p8",
    prompt: "How does DNA profiling compare samples?",
    answer: 3,
    explanation:
      "지문은 DNA profiling이 사람들 사이에서 variable repetitive DNA sections의 길이를 비교한다고 설명합니다.",
    difficulty: 2,
    id: "dad-science-v2-068",
    options: [
      "It compares the color of whole chromosomes in a microscope.",
      "It measures only the amount of DNA in a crime scene.",
      "It identifies people without using any DNA sequence information.",
      "It compares lengths of variable repetitive DNA sections between people.",
    ],
  },
  {
    passageId: "science-crispr-p3",
    prompt: "What natural role of CRISPR/Cas is described?",
    answer: 1,
    explanation:
      "지문은 bacteria가 invading viral DNA 조각을 genome에 넣어 이후 감염에 대응하는 adaptive immune system을 만든다고 설명합니다.",
    difficulty: 2,
    id: "dad-science-v2-069",
    options: [
      "Bacteria remove every DNA sequence from their own genomes.",
      "Bacteria insert pieces of invading viral DNA into their genome to support adaptive defense.",
      "CRISPR/Cas is a process found only in animal cells.",
      "The system prevents any later response to bacteriophages.",
    ],
  },
  {
    passageId: "science-crispr-p4",
    prompt: "What did the 2005 spacer studies indicate?",
    answer: 2,
    explanation:
      "지문은 2005년 연구들이 spacers를 과거 세포를 공격한 phage 또는 extrachromosomal DNA 조각으로 확인해 adaptive immunity를 뒷받침했다고 설명합니다.",
    difficulty: 2,
    id: "dad-science-v2-070",
    options: [
      "CRISPR spacers are unrelated to viruses or plasmids.",
      "Only proteins, not DNA, are stored as spacers.",
      "Spacers are fragments from previously attacking phage or extrachromosomal DNA, supporting adaptive immunity.",
      "All three studies concluded CRISPR had no immune role.",
    ],
  },
  {
    passageId: "science-crispr-p5",
    prompt: "How is a CRISPR array organized?",
    answer: 3,
    explanation:
      "지문은 CRISPR array가 AT-rich leader sequence 뒤에 unique spacers로 분리된 short repeats가 이어지는 구조라고 설명합니다.",
    difficulty: 2,
    id: "dad-science-v2-071",
    options: [
      "A single protein is followed by no repeated sequences.",
      "It contains only random spacers with no leader sequence.",
      "It is made solely from RNA hairpins outside the genome.",
      "An AT-rich leader is followed by short repeats separated by unique spacers.",
    ],
  },
  {
    passageId: "science-crispr-p6",
    prompt: "What distinguishes Class 1 and Class 2 CRISPR-Cas systems?",
    answer: 1,
    explanation:
      "지문은 Class 1이 multiple Cas proteins 복합체를 사용하고 Class 2가 single large Cas protein을 사용한다고 구분합니다.",
    difficulty: 2,
    id: "dad-science-v2-072",
    options: [
      "Class 1 has no Cas proteins, while Class 2 uses only RNA.",
      "Class 1 uses multiple Cas proteins, while Class 2 uses a single large Cas protein.",
      "Both classes always use exactly the same single protein.",
      "Class 2 degrades foreign nucleic acids only outside cells.",
    ],
  },
  {
    passageId: "science-crispr-p7",
    prompt:
      "What is the role of a protospacer adjacent motif (PAM) in the described acquisition?",
    answer: 2,
    explanation:
      "지문은 PAM을 선택된 protospacers 옆의 short DNA sequences로 설명하며 type I and type II acquisition에 중요하다고 말합니다.",
    difficulty: 2,
    id: "dad-science-v2-073",
    options: [
      "It replaces every spacer in a CRISPR array.",
      "It is a protein found only in type III systems.",
      "It is a short DNA sequence adjacent to selected protospacers and is important for type I and II acquisition.",
      "It prevents the spacer from maintaining a regular size.",
    ],
  },
  {
    passageId: "science-crispr-p8",
    prompt: "What does CRISPR-Cas9 gene editing use to modify DNA?",
    answer: 3,
    explanation:
      "지문은 CRISPR-Cas9 편집이 Cas9 nuclease와 engineered guide RNA로 유전체 특정 위치를 자른다고 설명합니다.",
    difficulty: 2,
    id: "dad-science-v2-074",
    options: [
      "Only a fluorescent screen and a metal target.",
      "An unmodified cell membrane with no nuclease.",
      "A random protein that edits every chromosome equally.",
      "A Cas9 nuclease and engineered guide RNA that direct cuts at genome locations.",
    ],
  },
  {
    passageId: "science-germ-theory-of-disease-p3",
    prompt: "Who proposed early forms of germ theory named in the passage?",
    answer: 1,
    explanation:
      "지문은 초기 형태의 germ theory를 1546년 Fracastoro가 제안하고 1762년 von Plenciz가 확장했다고 말합니다.",
    difficulty: 2,
    id: "dad-science-v2-075",
    options: [
      "Louis Pasteur in 1546 and Robert Koch in 1762.",
      "Girolamo Fracastoro in 1546 and Marcus von Plenciz in 1762.",
      "Edward Jenner in 1546 and John Snow in 1762.",
      "Galen in 1546 and Ignaz Semmelweis in 1762.",
    ],
  },
  {
    passageId: "science-germ-theory-of-disease-p4",
    prompt: "What did the miasma theory attribute disease to?",
    answer: 2,
    explanation:
      "지문은 miasma theory가 rotting matter에서 나온 poisonous bad-air vapor와 contaminated water 같은 environmental conditions를 질병 원인으로 보았다고 설명합니다.",
    difficulty: 2,
    id: "dad-science-v2-076",
    options: [
      "Only inherited mutations inside a host.",
      "Bacteria observed only through modern microscopes.",
      "A poisonous bad-air vapor from rotting matter and environmental conditions such as contaminated water.",
      "A harmless smell unrelated to places or hygiene.",
    ],
  },
  {
    passageId: "science-germ-theory-of-disease-p5",
    prompt: "What did Francesco Redi’s covered-jar observation support?",
    answer: 3,
    explanation:
      "지문은 uncovered meat에서 구더기가 생기고 gauze-covered meat에서는 gauze 표면에 나타난다는 관찰로 spontaneous generation을 거부했다고 설명합니다.",
    difficulty: 2,
    id: "dad-science-v2-077",
    options: [
      "Maggots always arise from meat whether covered or uncovered.",
      "Spontaneous generation was confirmed by flies avoiding gauze.",
      "Rotting meat cannot attract flies through any material.",
      "Maggots appeared on uncovered meat, while gauze-covered meat placed them on the gauze, rejecting spontaneous generation.",
    ],
  },
  {
    passageId: "science-germ-theory-of-disease-p6",
    prompt:
      "What did Anton van Leeuwenhoek call the microscopic organisms he observed?",
    answer: 1,
    explanation:
      "지문은 Leeuwenhoek가 현미경으로 본 미세 생물을 당시 “little animals”라는 뜻의 animalcules라고 불렀다고 말합니다.",
    difficulty: 2,
    id: "dad-science-v2-078",
    options: [
      "Miasmata, meaning poisonous vapors.",
      "Animalcules, meaning “little animals.”",
      "Chromosomes, meaning inherited structures.",
      "Vaccinia, meaning cowpox virus.",
    ],
  },
  {
    passageId: "science-germ-theory-of-disease-p7",
    prompt: "What intervention did Semmelweis document?",
    answer: 2,
    explanation:
      "지문은 Semmelweis가 의사들이 pregnant women을 진찰하기 전에 chlorinated lime water로 손을 씻게 하고 그 결과를 기록했다고 설명합니다.",
    difficulty: 2,
    id: "dad-science-v2-079",
    options: [
      "Doctors stopped examining pregnant women after every autopsy.",
      "Midwives were required to perform autopsies before births.",
      "Doctors washed their hands with chlorinated lime water before examining pregnant women.",
      "Puerperal fever was declared unrelated to contagious disease.",
    ],
  },
  {
    passageId: "science-germ-theory-of-disease-p8",
    prompt: "What did Snow’s pump analysis show?",
    answer: 3,
    explanation:
      "지문은 Southwark and Vauxhall 회사의 물을 받은 지역에서 Lambeth pumps 이용 지역보다 deaths가 fourteen times 많았다고 설명합니다.",
    difficulty: 2,
    id: "dad-science-v2-080",
    options: [
      "Lambeth pumps supplied fourteen times more deaths than Southwark and Vauxhall pumps.",
      "Sewage-polluted water was unrelated to cholera cases.",
      "All pump districts had exactly the same death rate.",
      "Areas supplied by Southwark and Vauxhall experienced fourteen times as many deaths as those using Lambeth pumps.",
    ],
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
