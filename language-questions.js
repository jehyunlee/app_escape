// Static language question pools. The game samples from these authored questions.
export const languagePools = {
  1: [
    {
      id: "l1-001",
      prompt:
        "다음 대화를 읽고 지우의 다음 행동으로 가장 알맞은 것을 고르세요. Jiu: The library book is due tomorrow, but I still need it for my report. Mina: You can ask the librarian for a renewal before the due date.",
      options: [
        "Ask the librarian for more time.",
        "Return the book and stop writing.",
        "Buy a different book without checking.",
        "Give the book to Mina today.",
      ],
      answer: 0,
      explanation:
        "지우는 책이 더 필요하고 미나는 기한을 연장해 보라고 했으므로 사서에게 더 시간을 부탁해야 합니다.",
      difficulty: 1,
    },
    {
      id: "l1-002",
      prompt:
        "다음 대화에서 학생이 식당 직원에게 할 가장 좋은 말을 고르세요. Student: I am allergic to peanuts. Staff: I can check the ingredients before you choose.",
      options: [
        "Could you tell me which dishes have no peanuts?",
        "Please add extra peanuts to every dish.",
        "I will choose without asking about it.",
        "Peanuts are always safe for everyone.",
      ],
      answer: 0,
      explanation:
        "알레르기가 있다고 말했으므로 재료를 확인해 달라고 부탁하는 것이 대화의 목적에 맞습니다.",
      difficulty: 1,
    },
    {
      id: "l1-003",
      prompt:
        "다음 글의 핵심 정보를 고르세요. The umbrella in the lost-and-found box has a blue handle and a small star sticker. Hana left a black umbrella with those marks near the gym.",
      options: [
        "Hana should look for a blue-handled umbrella with a star sticker.",
        "Hana left her umbrella in the science lab.",
        "The box contains only brand-new umbrellas.",
        "The sticker proves the umbrella belongs to the gym.",
      ],
      answer: 0,
      explanation:
        "분실물의 파란 손잡이와 별 스티커가 하나가 잃어버린 우산의 특징과 일치합니다.",
      difficulty: 2,
    },
    {
      id: "l1-004",
      prompt:
        "다음 대화에서 민서의 의도를 고르세요. Minseo: We have three days before the presentation. I can design the slides if you collect the survey results.",
      options: [
        "She wants to divide the project tasks.",
        "She wants to cancel the presentation.",
        "She wants to hide the survey results.",
        "She wants to finish the project alone.",
      ],
      answer: 0,
      explanation:
        "민서는 자신이 슬라이드를 만들고 친구가 결과를 모으자고 하며 일을 나누고 있습니다.",
      difficulty: 1,
    },
    {
      id: "l1-005",
      prompt:
        "다음 안내와 대화를 읽고 가장 알맞은 행동을 고르세요. Bus driver: Your transit card has no balance. Joon: I need to get home. Driver: The kiosk is beside the next stop.",
      options: [
        "Ride without paying.",
        "Get off and add money at the kiosk.",
        "Walk away from the next stop.",
        "Take another passenger's card.",
      ],
      answer: 1,
      explanation:
        "카드 잔액이 없고 다음 정류장 옆에 충전기가 있으므로 내려서 돈을 넣어야 합니다.",
      difficulty: 1,
    },
    {
      id: "l1-006",
      prompt:
        "다음 과학 동아리 대화를 읽고 학생들이 하려는 일을 고르세요. Yuna: Our plant grew only two centimeters, but the other group recorded six. Taeho: Let us check the light and measure everything again before we report it.",
      options: [
        "Ignore both results.",
        "Repeat the measurements and check the conditions.",
        "Move every plant to another room.",
        "Report that no experiment happened.",
      ],
      answer: 1,
      explanation:
        "두 결과가 크게 달라서 학생들은 환경과 측정을 다시 확인하려고 합니다.",
      difficulty: 2,
    },
    {
      id: "l1-007",
      prompt:
        "친구의 마음에 공감하면서 당장 과제 문제를 해결하도록 돕는 응답을 고르세요. Sora: My notes got soaked in the rain. The assignment is due today, and I am afraid the teacher will think I did nothing. Nari: ___",
      options: [
        "That must be upsetting. Let's dry your notes and explain what happened to the teacher.",
        "You can borrow my umbrella for your journey home this evening.",
        "The teacher accepted my late work last week, so she must accept yours too.",
        "Everyone gets wet sometimes. There is no reason to feel worried.",
      ],
      answer: 0,
      explanation:
        "첫 응답은 속상한 마음을 인정하고 노트를 말려 상황을 설명하자는 구체적인 도움을 줍니다. 다른 응답은 당장의 문제를 해결하지 못하거나 결과를 장담합니다.",
      difficulty: 3,
    },
    {
      id: "l1-008",
      prompt:
        "학교 방송을 읽고 정확한 세부 사항을 고르세요. The fire-drill practice will begin at 2:30 in the afternoon. Students should leave their bags and walk to the east field.",
      options: [
        "Students should carry their bags.",
        "The practice begins at half past two.",
        "The practice takes place in the library.",
        "Students may stay in class all afternoon.",
      ],
      answer: 1,
      explanation:
        "방송에서 시작 시각을 오후 2시 30분이라고 분명히 알렸습니다.",
      difficulty: 1,
    },
    {
      id: "l1-009",
      prompt:
        "온라인 수업 대화를 읽고 준호가 할 가장 실용적인 행동을 고르세요. Teacher: We cannot hear your microphone. Junho: I tried twice, but it still does not work.",
      options: [
        "Type his answer in the chat and ask for technical help.",
        "Leave the class without telling anyone.",
        "Speak into the turned-off microphone.",
        "Turn off the computer before the lesson ends.",
      ],
      answer: 0,
      explanation:
        "마이크가 작동하지 않으므로 채팅으로 참여하고 선생님에게 도움을 요청하는 것이 좋습니다.",
      difficulty: 1,
    },
    {
      id: "l1-010",
      prompt:
        "교환 학생에게 도서관 위치를 알려 주는 가장 좋은 응답을 고르세요. Alex: Excuse me, where is the school library? You: ___",
      options: [
        "It is on the second floor, next to the art room.",
        "It closed before our school was built.",
        "I borrowed a novel there last month.",
        "The art room has bright paintings.",
      ],
      answer: 0,
      explanation:
        "도서관의 위치를 묻는 질문에는 2층 미술실 옆이라는 위치 정보가 직접 답이 됩니다.",
      difficulty: 1,
    },
    {
      id: "l1-011",
      prompt:
        "박물관 안내문을 읽고 플래시를 금지한 이유를 고르세요. Please do not use flash photography. Repeated bright flashes can damage the colors of the old paintings.",
      options: [
        "The paintings need bright light.",
        "Visitors must protect the paintings from bright flashes.",
        "The museum wants visitors to paint pictures.",
        "Flash photography makes rooms colder.",
      ],
      answer: 1,
      explanation:
        "안내문은 반복되는 강한 빛이 오래된 그림의 색을 손상할 수 있다고 설명합니다.",
      difficulty: 2,
    },
    {
      id: "l1-012",
      prompt:
        "기차역 안내 방송에서 승객이 기억해야 할 내용을 고르세요. The train to Busan will depart from platform four instead of platform two. Please follow the signs.",
      options: [
        "The train is canceled all week.",
        "Passengers should wait on platform two.",
        "The train will travel to another city.",
        "The train leaves from platform four today.",
      ],
      answer: 3,
      explanation:
        "방송은 부산행 열차의 승강장이 2번에서 4번으로 바뀌었다고 알립니다.",
      difficulty: 2,
    },
    {
      id: "l1-013",
      prompt:
        "카페에서 주문이 잘못 나왔을 때 할 가장 정중한 말을 고르세요. Server: Here is your tomato pasta. Customer: I ordered the mushroom pasta.",
      options: [
        "Could you please check my order once more?",
        "Give me every dish on the menu.",
        "I ordered nothing, so keep the food.",
        "The kitchen should close immediately.",
      ],
      answer: 0,
      explanation:
        "주문한 음식과 다른 음식이 왔으므로 주문을 다시 확인해 달라고 정중히 말해야 합니다.",
      difficulty: 1,
    },
    {
      id: "l1-014",
      prompt:
        "등산 계획 대화를 읽고 Mark가 제안한 행동을 고르세요. Jisu: The weather service warns of thunderstorms after noon. Mark: Then we should hike another day instead of risking the ridge.",
      options: [
        "Start the same hike after lunch.",
        "Postpone the hike until another day.",
        "Walk across the ridge more quickly at noon.",
        "Keep the original date and wait on the ridge.",
      ],
      answer: 1,
      explanation:
        "Mark는 위험한 능선을 걷는 대신 산행 날짜를 바꾸자고 제안합니다. Jisu가 제안에 동의했는지는 이 대화에 나오지 않습니다.",
      difficulty: 2,
    },
    {
      id: "l1-015",
      prompt:
        "재활용 안내문을 읽고 글의 중심 생각을 고르세요. Our town collects glass on Tuesday and paper on Thursday. Check the local schedule before putting items outside.",
      options: [
        "Residents should check their town's collection schedule.",
        "Every town collects materials on the same day.",
        "Paper should never be placed outside.",
        "The town collects glass only once a year.",
      ],
      answer: 0,
      explanation:
        "요일이 재료마다 다르므로 물건을 내놓기 전에 지역 일정을 확인하라는 내용입니다.",
      difficulty: 1,
    },
    {
      id: "l1-016",
      prompt:
        "병원 예약 안내와 대화를 읽고 유나가 준비할 것을 고르세요. Receptionist: Your appointment is at three. Please bring an identification card. Yuna: I will put it in my bag now.",
      options: [
        "Bring an identification card.",
        "Bring a musical instrument.",
        "Arrive next week without documents.",
        "Cancel the appointment because it is at three.",
      ],
      answer: 0,
      explanation:
        "접수 직원이 3시 예약에 신분증을 가져오라고 했으므로 신분증을 준비해야 합니다.",
      difficulty: 1,
    },
    {
      id: "l1-017",
      prompt:
        "숙소에서 열쇠를 잃어버린 상황에 가장 좋은 응답을 고르세요. Guest: I cannot find my room key. Clerk: I can make a new one after I see your name on the reservation.",
      options: [
        "Leave without telling the clerk.",
        "Show the clerk the reservation name.",
        "Take another guest's key.",
        "Ask the clerk to erase the reservation.",
      ],
      answer: 1,
      explanation:
        "직원이 예약 이름을 확인한 뒤 새 열쇠를 만들어 주겠다고 했으므로 예약 이름을 보여 주면 됩니다.",
      difficulty: 1,
    },
    {
      id: "l1-018",
      prompt:
        "시장 상인과 손님의 대화를 읽고 손님이 원하는 것을 고르세요. Vendor: These peaches are five thousand won a bag. Customer: I only have four thousand. Vendor: I can give you a smaller bag for that price.",
      options: [
        "A larger bag for five hundred won.",
        "A smaller bag costing four thousand won.",
        "Free peaches with no payment.",
        "A bag from another market.",
      ],
      answer: 1,
      explanation:
        "손님이 가진 돈에 맞춰 상인이 더 작은 봉지를 제안했으므로 네 천 원짜리 작은 봉지를 원합니다.",
      difficulty: 1,
    },
    {
      id: "l1-019",
      prompt:
        "다음 지도 안내를 읽고 도서관에 들어갈 방법을 고르세요. The main bridge is closed for repairs. Visitors can reach the library through the west gate and the small footpath.",
      options: [
        "Cross the closed bridge.",
        "Use the west gate and the footpath.",
        "Wait on the bridge until repairs finish.",
        "Enter through the riverbed.",
      ],
      answer: 1,
      explanation:
        "주 다리가 닫혔고 서쪽 문과 작은 보행로가 대안으로 안내되어 있습니다.",
      difficulty: 2,
    },
    {
      id: "l1-020",
      prompt:
        "동물 보호소 봉사 안내를 읽고 첫날 필요한 물건을 고르세요. New volunteers will clean the kennels. Wear closed shoes and bring washable gloves. The shelter provides soap.",
      options: [
        "Closed shoes and washable gloves.",
        "Open sandals and a paper towel.",
        "A sleeping bag and a helmet.",
        "Only a bottle of perfume.",
      ],
      answer: 0,
      explanation:
        "안내문에서 사육장 청소를 위해 발을 덮는 신발과 씻어 쓸 장갑을 준비하라고 했습니다.",
      difficulty: 2,
    },
    {
      id: "l1-021",
      prompt:
        "다음 글의 중심 생각을 고르세요. The school seed library lets students borrow vegetable seeds, grow plants at home, and return new seeds after harvest. It helps families share local varieties.",
      options: [
        "The seed library encourages students to share and grow plants.",
        "Students may borrow books about trains only.",
        "Families must buy a new garden every season.",
        "The school stops students from growing vegetables.",
      ],
      answer: 0,
      explanation:
        "씨앗을 빌리고 수확 뒤 새 씨앗을 돌려주며 지역 품종을 나누는 활동이 핵심입니다.",
      difficulty: 1,
    },
    {
      id: "l1-022",
      prompt:
        "학교 에너지 보고서를 읽고 직접 확인된 결과를 고르세요. After the school installed solar panels, the monthly electricity bill fell by twelve percent. The report compares bills from the same months.",
      options: [
        "The bill rose by twelve percent.",
        "The report compares unrelated months.",
        "The monthly bill fell by twelve percent.",
        "The panels were removed before the report.",
      ],
      answer: 2,
      explanation:
        "보고서가 같은 달을 비교한 결과 전기 요금이 12퍼센트 줄었다고 직접 밝혔습니다.",
      difficulty: 2,
    },
    {
      id: "l1-023",
      prompt:
        "다음 글에서 추론할 수 있는 것을 고르세요. A class tracked students' screen use before bed. Students who used phones late reported taking longer to fall asleep, although the survey did not prove the phones caused every problem.",
      options: [
        "Late phone use may be linked to slower sleep.",
        "Every sleep problem is caused by a phone.",
        "The class never asked about screen use.",
        "Phones always help students sleep quickly.",
      ],
      answer: 0,
      explanation:
        "늦은 휴대전화 사용 학생들이 잠드는 데 더 오래 걸렸지만, 글은 모든 문제의 원인이라고 단정하지 않습니다.",
      difficulty: 2,
    },
    {
      id: "l1-024",
      prompt:
        "학교 텃밭 글을 읽고 벌이 필요한 이유를 고르세요. The garden planted native flowers near the vegetables. More bees visited the flowers, and the tomato plants produced more fruit.",
      options: [
        "Bees helped move pollen near the vegetables.",
        "The flowers prevented every tomato from growing.",
        "The garden removed all insects from the soil.",
        "Bees visited only after the tomatoes were harvested.",
      ],
      answer: 0,
      explanation:
        "토종 꽃이 벌을 불러왔고 그 뒤 토마토 열매가 늘었으므로 벌의 꽃가루 이동이 도움이 되었다고 볼 수 있습니다.",
      difficulty: 2,
    },
    {
      id: "l1-025",
      prompt:
        "다음 미디어 교육 글의 조언을 고르세요. A post claims that a famous actor donated a huge amount of money. It has no date, source, or link. The teacher says readers should search for a report from a reliable news organization.",
      options: [
        "Share the post quickly.",
        "Check a reliable report before sharing it.",
        "Assume every post without a source is true.",
        "Delete all news from every organization.",
      ],
      answer: 1,
      explanation:
        "출처와 날짜가 없는 주장이므로 믿거나 퍼뜨리기 전에 신뢰할 만한 보도로 확인해야 합니다.",
      difficulty: 2,
    },
    {
      id: "l1-026",
      prompt:
        "지진 대비 가방 안내를 읽고 반드시 들어 있어야 할 것을 고르세요. The emergency kit should include drinking water, a flashlight, a first-aid box, and a copy of family phone numbers.",
      options: [
        "A copy of family phone numbers.",
        "A large glass vase.",
        "Fresh ice cream for a party.",
        "A stack of unused homework.",
      ],
      answer: 0,
      explanation: "비상 가방 목록에 가족 전화번호 사본이 포함되어 있습니다.",
      difficulty: 1,
    },
    {
      id: "l1-027",
      prompt:
        "버스 안내 방송을 읽고 승객이 할 행동을 고르세요. Driver: The next stop is closed because of a street festival. Please press the red button if you need the following stop.",
      options: [
        "Press the red button for the following stop.",
        "Get off at the closed stop.",
        "Ask the driver to stop in the crowd.",
        "Ignore the announcement.",
      ],
      answer: 0,
      explanation:
        "다음 정류장에서 내려야 하는 승객은 빨간 버튼을 눌러 기사에게 알려야 합니다.",
      difficulty: 1,
    },
    {
      id: "l1-028",
      prompt:
        "다음 이메일을 읽고 발신자의 의도를 고르세요. Dear Ms. Park, I am sorry, but a family appointment will keep me from the meeting on Thursday. Could we discuss the project on Friday instead? Sincerely, Daniel",
      options: [
        "Daniel asks to change the meeting time.",
        "Daniel wants to cancel the project.",
        "Daniel is announcing a school event.",
        "Daniel says he can attend on Thursday.",
      ],
      answer: 0,
      explanation:
        "다니엘은 목요일에 참석할 수 없어 금요일에 프로젝트를 논의하자고 요청합니다.",
      difficulty: 2,
    },
    {
      id: "l1-029",
      prompt:
        "박물관 전시 설명을 읽고 관람객이 알 수 있는 것을 고르세요. The bowl looks ancient, but the label says it is a modern replica made from a scan of the original.",
      options: [
        "The bowl is the untouched original.",
        "The bowl was made recently as a copy.",
        "The bowl came from a school lunchroom.",
        "The label says nobody knows how it was made.",
      ],
      answer: 1,
      explanation:
        "라벨은 그릇이 원본을 스캔해 만든 현대의 복제품이라고 설명합니다.",
      difficulty: 2,
    },
    {
      id: "l1-030",
      prompt:
        "재활용 동아리 대화를 읽고 학생들이 세운 해결책을 고르세요. Mira: Few students come to our cleanup on Monday mornings. Jun: Many students have practice then. Mira: Let us move it to Wednesday after school.",
      options: [
        "Move the cleanup to Wednesday after school.",
        "End all cleanups.",
        "Hold it earlier on Monday.",
        "Ask students to skip practice.",
      ],
      answer: 0,
      explanation:
        "월요일 아침에는 연습이 많으므로 수요일 방과 후로 시간을 옮기자는 해결책입니다.",
      difficulty: 2,
    },
    {
      id: "l1-031",
      prompt:
        "친구에게 필요한 때 물건을 돌려주겠다고 약속하는 응답을 고르세요. Hyeon: I borrowed your headphones yesterday. Are you using them now? Mina: I need them for my bus ride home.",
      options: [
        "I will return them before you leave.",
        "Could I keep them until tomorrow morning?",
        "The bus ride usually takes about thirty minutes.",
        "I can tell you where to buy another pair.",
      ],
      answer: 0,
      explanation:
        "미나가 귀가할 때 필요하므로 출발 전에 돌려주겠다는 약속이 요청을 충족합니다.",
      difficulty: 1,
    },
    {
      id: "l1-032",
      prompt:
        "토론을 앞둔 친구에게 가장 도움이 되는 응답을 고르세요. Leo: I am nervous about tomorrow's debate. I have practiced, but I still forget my examples.",
      options: [
        "Write two example cards and practice with them tonight.",
        "Forget the debate and do no preparation.",
        "Use examples unrelated to the topic.",
        "Tell Leo that forgetting is helpful.",
      ],
      answer: 0,
      explanation:
        "예시를 자주 잊는 문제에는 핵심 예시를 카드에 적어 다시 연습하는 방법이 직접 도움이 됩니다.",
      difficulty: 2,
    },
    {
      id: "l1-033",
      prompt:
        "선생님의 피드백을 읽고 학생이 보완할 부분을 고르세요. Your opinion is clear, but the paragraph needs a fact or quotation to support it.",
      options: [
        "Add evidence that supports the opinion.",
        "Remove the opinion and leave only a title.",
        "Replace every fact with a joke.",
        "Delete the paragraph without reading it.",
      ],
      answer: 0,
      explanation:
        "피드백은 의견을 뒷받침할 사실이나 인용을 추가하라고 했으므로 근거를 보완해야 합니다.",
      difficulty: 2,
    },
    {
      id: "l1-034",
      prompt:
        "모둠 활동에서 의견이 갈린 상황을 읽고 가장 좋은 해결책을 고르세요. Ara wants a poster; Ben wants a video. They have one week and equal votes.",
      options: [
        "Choose one idea without hearing either person.",
        "Combine a short video with a poster summary.",
        "Cancel the assignment.",
        "Make two full projects in one hour.",
      ],
      answer: 1,
      explanation:
        "시간과 표가 같다는 조건에서 영상과 포스터의 장점을 합친 결과물이 타협안이 됩니다.",
      difficulty: 3,
    },
    {
      id: "l1-035",
      prompt:
        "이웃에게 소음을 줄여 달라고 부탁하는 가장 정중한 말을 고르세요. Neighbor: I am practicing drums for a school concert. You: The walls are thin, and I have an exam tomorrow.",
      options: [
        "Could you practice a little earlier this evening, please?",
        "Play the drums all night.",
        "Accuse every neighbor of the noise.",
        "Take the drum set without speaking.",
      ],
      answer: 0,
      explanation:
        "시험을 앞둔 상황을 설명하면서 연습 시간을 조금 앞당겨 달라고 부탁하는 말이 정중합니다.",
      difficulty: 2,
    },
    {
      id: "l1-036",
      prompt:
        "병원에서 받은 복약 안내를 읽고 정확한 내용을 고르세요. Take one tablet after breakfast and one after dinner. Do not take two tablets at the same time.",
      options: [
        "Take both tablets before breakfast.",
        "Take one after breakfast and one after dinner.",
        "Take two tablets when you miss lunch.",
        "Take no tablet after dinner.",
      ],
      answer: 1,
      explanation:
        "안내는 아침 식사 뒤 한 알, 저녁 식사 뒤 한 알이라고 구체적으로 말합니다.",
      difficulty: 1,
    },
    {
      id: "l1-037",
      prompt:
        "축구 코치와 선수의 대화를 읽고 선수가 할 일을 고르세요. Coach: Your ankle is swollen. Please rest today and tell me if the pain gets worse.",
      options: [
        "Practice harder without telling the coach.",
        "Rest today and report increasing pain.",
        "Play the whole match.",
        "Hide the swelling.",
      ],
      answer: 1,
      explanation:
        "코치는 오늘 쉬고 통증이 심해지면 알리라고 했으므로 그 지시를 따라야 합니다.",
      difficulty: 2,
    },
    {
      id: "l1-038",
      prompt:
        "통역 봉사 대화를 읽고 통역자가 먼저 확인할 내용을 고르세요. Visitor: I need a bus to the science museum. Interpreter: Do you mean the museum downtown or the one near the river?",
      options: [
        "Which science museum the visitor means.",
        "The visitor's favorite color.",
        "Whether the interpreter likes buses.",
        "The river's water temperature.",
      ],
      answer: 0,
      explanation:
        "과학 박물관이 두 곳이므로 통역자는 어느 박물관을 뜻하는지 먼저 확인해야 합니다.",
      difficulty: 2,
    },
    {
      id: "l1-039",
      prompt:
        "가게에서 환불을 요청하는 대화를 읽고 필요한 것을 고르세요. Customer: This charger stopped working yesterday. Clerk: Do you have the receipt? Customer: Yes, it is in my wallet.",
      options: [
        "Show the receipt to the clerk.",
        "Throw away the charger.",
        "Ask for a refund without mentioning it.",
        "Buy five unrelated chargers first.",
      ],
      answer: 0,
      explanation:
        "직원이 영수증을 물었고 고객이 지갑에 있다고 했으므로 영수증을 보여 주면 됩니다.",
      difficulty: 1,
    },
    {
      id: "l1-040",
      prompt:
        "과제 기한을 착각한 학생의 대화를 읽고 가장 적절한 행동을 고르세요. Teacher: The essay was due Wednesday. Yerin: I thought it was due Friday. Teacher: Please show me your draft and explain what happened.",
      options: [
        "Show the draft and honestly explain the misunderstanding.",
        "Change the date on the calendar.",
        "Submit an empty page.",
        "Blame a classmate without checking.",
      ],
      answer: 0,
      explanation:
        "선생님이 초안을 보여 주고 설명하라고 했으므로 사실대로 상황을 설명하는 것이 적절합니다.",
      difficulty: 2,
    },
    {
      id: "l1-041",
      prompt:
        "다음 글의 중심 생각을 고르세요. Bright lights near the beach can confuse baby sea turtles, which normally crawl toward the moonlit ocean. The town plans to dim beachfront lights during nesting season.",
      options: [
        "Dimming beach lights can help young turtles reach the ocean.",
        "Baby turtles use hotel lights to find food.",
        "The town will make the beach brighter.",
        "Nesting season happens only downtown.",
      ],
      answer: 0,
      explanation:
        "어린 거북이가 바다로 가는 방향을 잃지 않도록 번식기에 해변 불빛을 낮추려는 글입니다.",
      difficulty: 2,
    },
    {
      id: "l1-042",
      prompt:
        "지역 역사 프로젝트의 목적을 고르세요. Students interviewed older residents about a market that closed forty years ago. They recorded stories about prices, jobs, and neighborhood celebrations.",
      options: [
        "To preserve personal memories of the old market.",
        "To reopen the market without research.",
        "To prove every resident had the same job.",
        "To replace celebrations with interviews.",
      ],
      answer: 0,
      explanation:
        "학생들은 옛 시장을 경험한 주민들의 이야기를 기록해 지역의 기억을 보존하려고 합니다.",
      difficulty: 2,
    },
    {
      id: "l1-043",
      prompt:
        "강 청소 전후의 기록을 읽고 청소의 효과를 보여 주는 근거를 고르세요. Before the cleanup, volunteers counted 86 plastic bottles. Two weeks later, they counted 19. The riverbank received no heavy rain during that period.",
      options: [
        "The number of bottles fell from 86 to 19.",
        "The riverbank received heavy rain every day.",
        "Volunteers counted more bottles after cleaning.",
        "No one counted bottles before cleaning.",
      ],
      answer: 0,
      explanation:
        "청소 전 86개였던 병이 청소 뒤 19개로 줄었다는 수치가 효과를 보여 주는 근거입니다.",
      difficulty: 2,
    },
    {
      id: "l1-044",
      prompt:
        "식물 실험 계획을 읽고 공정한 비교를 위해 지킬 일을 고르세요. Group A and Group B use the same soil and receive the same water. Group A is kept in sunlight; Group B is kept in shade.",
      options: [
        "Compare the plants after changing only their light conditions.",
        "Give Group A different soil and more water.",
        "Move both groups without recording it.",
        "Choose the taller plant before starting.",
      ],
      answer: 0,
      explanation:
        "흙과 물을 같게 하고 빛만 다르게 해야 두 그룹을 공정하게 비교할 수 있습니다.",
      difficulty: 3,
    },
    {
      id: "l1-045",
      prompt:
        "자전거 도로에 관한 글에서 추론할 수 있는 것을 고르세요. After a protected bike lane opened, more students rode to school. The lane separates bicycles from cars, and the school added a secure bike rack.",
      options: [
        "Safer riding space and secure parking may encourage cycling.",
        "The bike lane made bicycles less safe.",
        "Students stopped riding because no rack was added.",
        "The lane is used only by buses.",
      ],
      answer: 0,
      explanation:
        "차와 분리된 도로와 안전한 거치대가 생긴 뒤 자전거를 타는 학생이 늘었다는 점에서 그렇게 추론할 수 있습니다.",
      difficulty: 2,
    },
    {
      id: "l1-046",
      prompt:
        "다음 학습 기록의 중심 생각을 고르세요. Instead of studying for three hours on Sunday, Hana studies twenty minutes each day. She reviews old notes before starting new work and remembers more on quizzes.",
      options: [
        "Short, regular review can support learning.",
        "Studying only once a week always works best.",
        "Old notes should never be reviewed.",
        "Hana stopped taking quizzes.",
      ],
      answer: 0,
      explanation:
        "매일 짧게 복습하고 이전 내용을 확인한 뒤 새 공부를 하자 퀴즈 기억이 좋아졌습니다.",
      difficulty: 2,
    },
    {
      id: "l1-047",
      prompt:
        "문화 축제 안내를 읽고 방문객이 지킬 일을 고르세요. The family festival asks visitors to remove their shoes before entering the traditional room. A volunteer offers shoe bags at the entrance.",
      options: [
        "Wear shoes inside the traditional room.",
        "Remove shoes and use a shoe bag.",
        "Leave all shoes in the street.",
        "Refuse the shoe bag and enter through a window.",
      ],
      answer: 1,
      explanation:
        "전통 방에 들어가기 전 신발을 벗고 입구의 신발 주머니를 사용할 수 있습니다.",
      difficulty: 1,
    },
    {
      id: "l1-048",
      prompt:
        "재난 문자와 가족 대화를 읽고 먼저 할 일을 고르세요. Alert: An earthquake has been reported nearby. Stay away from windows and move under a sturdy table. Yuna: I will call everyone after I am safe.",
      options: [
        "Move under a sturdy table away from windows.",
        "Stand beside the largest window.",
        "Run outside before checking for falling objects.",
        "Call friends beside glass.",
      ],
      answer: 0,
      explanation:
        "문자는 창문에서 떨어져 튼튼한 탁자 아래로 이동하라고 지시합니다.",
      difficulty: 2,
    },
    {
      id: "l1-049",
      prompt:
        "도서관의 조용한 구역 안내를 읽고 학생이 할 행동을 고르세요. Quiet study zone. Please use headphones for videos and take phone calls in the lobby.",
      options: [
        "Use headphones and take calls in the lobby.",
        "Play videos through room speakers.",
        "Answer calls beside readers.",
        "Ask everyone in the lobby to shout.",
      ],
      answer: 0,
      explanation:
        "조용한 구역에서는 영상에 헤드폰을 쓰고 통화는 로비에서 해야 합니다.",
      difficulty: 1,
    },
    {
      id: "l1-050",
      prompt:
        "다음 글을 읽고 재사용 물병의 장점을 고르세요. The school installed refill stations. After one month, students used 600 fewer disposable cups, while water use at the stations stayed within the expected amount.",
      options: [
        "Refill stations helped reduce disposable cup use.",
        "The stations increased cup use by 600.",
        "Students stopped drinking water.",
        "The school removed every water source.",
      ],
      answer: 0,
      explanation:
        "한 달 뒤 일회용 컵 사용이 600개 줄었다는 수치가 급수대의 효과를 보여 줍니다.",
      difficulty: 2,
    },
    {
      id: "l1-051",
      prompt:
        "다음 글의 주제를 고르세요. A music app recommends songs from a listener's past choices. This can be convenient, but it may also hide unfamiliar artists unless the listener searches beyond the recommendations.",
      options: [
        "Recommendations are useful but can narrow what people discover.",
        "Music apps never use past choices.",
        "Listeners can hear new artists only by deleting the app.",
        "The app recommends the same song to everyone.",
      ],
      answer: 0,
      explanation:
        "추천 기능의 편리함과 새로운 음악을 놓칠 수 있는 한계를 함께 설명한 글입니다.",
      difficulty: 3,
    },
    {
      id: "l1-052",
      prompt:
        "자원봉사 면접에서 할 가장 좋은 응답을 고르세요. Coordinator: Why do you want to help at the food bank? Student: ___",
      options: [
        "I want to learn about service and help sort food.",
        "Food banks are places where I never help.",
        "I will take donated food home.",
        "I will not ask what volunteers do.",
      ],
      answer: 0,
      explanation:
        "봉사하려는 이유와 맡을 일을 함께 말한 첫 응답이 질문에 구체적으로 답합니다.",
      difficulty: 2,
    },
    {
      id: "l1-053",
      prompt:
        "기차 지연 안내를 읽고 승객이 할 일을 고르세요. Announcement: The train is delayed twenty minutes. Passenger: I have a meeting at noon. Worker: A local bus leaves from gate three in five minutes.",
      options: [
        "Check the local bus from gate three as an alternative.",
        "Wait silently and miss the meeting.",
        "Ask the bus to leave from the platform.",
        "Cancel every noon meeting.",
      ],
      answer: 0,
      explanation:
        "기차가 20분 늦고 5분 뒤 대체 버스가 출발하므로 3번 출구의 버스를 확인하는 것이 실용적입니다.",
      difficulty: 2,
    },
    {
      id: "l1-054",
      prompt:
        "여행 예산표를 읽고 가장 알맞은 선택을 고르세요. The bus to the coast costs 18,000 won and takes five hours. The train costs 30,000 won and takes two hours. Jina has enough money but must arrive within three hours.",
      options: [
        "Take the bus and arrive after five hours.",
        "Take the train and arrive within three hours.",
        "Walk to the coast without checking time.",
        "Cancel the trip because the train is faster.",
      ],
      answer: 1,
      explanation:
        "지나는 세 시간 안에 도착해야 하고 기차 요금도 낼 수 있으므로 두 시간 걸리는 기차가 맞습니다.",
      difficulty: 3,
    },
    {
      id: "l1-055",
      prompt:
        "친구가 의심스러운 링크를 보낸 상황에서 할 응답을 고르세요. Seung: Click this link to claim a prize. It asks for your password. You: ___",
      options: [
        "I will not enter my password; let us check the sender first.",
        "I will send my password immediately.",
        "I will open it on every school computer.",
        "A prize link should never be checked.",
      ],
      answer: 0,
      explanation:
        "비밀번호를 요구하는 링크는 위험할 수 있으므로 입력하지 말고 보낸 사람과 출처를 확인해야 합니다.",
      difficulty: 2,
    },
    {
      id: "l1-056",
      prompt:
        "도서관 오디오 안내기가 고장 난 상황에 가장 좋은 행동을 고르세요. Visitor: The audio guide has no sound. Librarian: The printed guide is available at the desk, and I can report the broken device.",
      options: [
        "Use the printed guide and report the broken device.",
        "Shake the device until it works.",
        "Take it home for repair.",
        "Leave without telling anyone.",
      ],
      answer: 0,
      explanation:
        "사서가 인쇄 안내서와 신고 방법을 제시했으므로 두 방법을 활용하는 것이 좋습니다.",
      difficulty: 1,
    },
    {
      id: "l1-057",
      prompt:
        "생태계 글을 읽고 관리자가 할 수 있는 일을 고르세요. An invasive vine covers young trees and blocks their sunlight. Park workers remove the vine before planting native seedlings.",
      options: [
        "Remove the invasive vine before planting native seedlings.",
        "Cover young trees with more vines.",
        "Block all sunlight from the seedlings.",
        "Plant only the invasive vine.",
      ],
      answer: 0,
      explanation:
        "덩굴이 어린 나무의 햇빛을 막으므로 먼저 제거해야 토종 묘목이 자랄 수 있습니다.",
      difficulty: 2,
    },
    {
      id: "l1-058",
      prompt:
        "설문 결과를 읽고 가장 공정한 해석을 고르세요. Of 200 students, 120 answered the survey. Among those who answered, 80 liked the new menu, but students absent that day were not included.",
      options: [
        "The result describes the 120 respondents, not every student.",
        "All 200 students disliked the menu.",
        "The 80 students were absent.",
        "The survey included only students who never ate lunch.",
      ],
      answer: 0,
      explanation:
        "200명 중 120명만 응답했고 결석생은 빠졌으므로 결과를 전체 학생의 의견으로 단정할 수 없습니다.",
      difficulty: 3,
    },
    {
      id: "l1-059",
      prompt:
        "환경 글을 읽고 실천할 수 있는 행동을 고르세요. Walking or taking the subway for short trips produces less carbon than driving alone. The writer suggests choosing shared transport when possible.",
      options: [
        "Walk or take the subway when possible.",
        "Drive alone for every short trip.",
        "Use more fuel to lower carbon.",
        "Avoid all travel, including emergencies.",
      ],
      answer: 0,
      explanation:
        "글은 가까운 이동에서 걷거나 지하철을 이용하고 가능하면 함께 이동하라고 제안합니다.",
      difficulty: 2,
    },
    {
      id: "l1-060",
      prompt:
        "수면 연구 글에서 자료가 말하는 범위를 고르세요. Students who kept a regular bedtime reported better concentration. The researchers note that the survey measured reports, not every cause of concentration.",
      options: [
        "A regular bedtime may be related to better concentration.",
        "A regular bedtime guarantees perfect concentration.",
        "The researchers measured every cause of concentration.",
        "Students with regular bedtimes never studied.",
      ],
      answer: 0,
      explanation:
        "규칙적인 취침 학생들이 집중력이 좋다고 보고했지만 연구가 모든 원인을 측정한 것은 아닙니다.",
      difficulty: 3,
    },
    {
      id: "l1-061",
      prompt:
        "다음 대화에서 두 학생이 오해를 풀기 위해 먼저 할 일을 고르세요. Jae: Meet me by the old gate at six. Sol: Which old gate? There is one by the gym and one by the garden.",
      options: [
        "Specify whether the gate is by the gym or garden.",
        "Arrive at both gates at once.",
        "Cancel the meeting without asking.",
        "Tell Sol all gates are identical.",
      ],
      answer: 0,
      explanation:
        "오래된 문이 두 곳이므로 체육관 쪽인지 정원 쪽인지 구체적으로 정해야 합니다.",
      difficulty: 2,
    },
    {
      id: "l1-062",
      prompt:
        "학교 규칙에 이의를 제기하는 절차를 읽고 필요한 자료를 고르세요. Students may appeal a decision within five days. They should explain the concern and attach evidence such as messages or dated records.",
      options: [
        "A clear explanation with dated evidence.",
        "An unsigned page with no reason.",
        "A rumor about another student.",
        "A request after the five-day period.",
      ],
      answer: 0,
      explanation:
        "규칙은 우려를 설명하고 메시지나 날짜가 있는 기록 같은 증거를 첨부하라고 했습니다.",
      difficulty: 2,
    },
    {
      id: "l1-063",
      prompt:
        "다음 뉴스 글의 핵심을 고르세요. A headline says a new app makes students smarter. The article reports only that users also studied more, and researchers have not tested whether the app caused higher scores.",
      options: [
        "The evidence does not yet show that the app caused higher scores.",
        "The headline proves the app makes everyone smarter.",
        "Researchers tested the app fully.",
        "The article says scores always fall with apps.",
      ],
      answer: 0,
      explanation:
        "앱 사용자들이 더 많이 공부했다는 사실만 있고 앱이 점수를 올린 원인인지는 아직 시험하지 않았습니다.",
      difficulty: 3,
    },
    {
      id: "l1-064",
      prompt:
        "여행 보험 안내를 읽고 보장 내용을 정확히 고르세요. The plan covers emergency medical treatment abroad, but it does not cover lost cash or a trip canceled because the traveler changed plans.",
      options: [
        "It can help pay for emergency medical care abroad.",
        "It replaces all cash lost during a trip.",
        "It pays whenever a traveler changes plans.",
        "It covers medical care only at home.",
      ],
      answer: 0,
      explanation:
        "안내문은 해외 응급 치료는 보장하지만 현금 분실과 개인적인 일정 변경은 보장하지 않는다고 했습니다.",
      difficulty: 2,
    },
    {
      id: "l1-065",
      prompt:
        "장학금 신청 안내를 읽고 지원자가 확인할 세부 사항을 고르세요. Applications close at 5 p.m. on October 12. The form must include a teacher's recommendation and a 300-word personal statement.",
      options: [
        "Submit before 5 p.m. on October 12 with both documents.",
        "Send only a name after October 12.",
        "Write 30 words and omit the recommendation.",
        "Submit any time because there is no closing date.",
      ],
      answer: 0,
      explanation:
        "마감 시각과 추천서, 300단어 자기소개서가 모두 안내되어 있으므로 세 가지를 지켜야 합니다.",
      difficulty: 2,
    },
    {
      id: "l1-066",
      prompt:
        "실험실에서 물을 쏟은 학생이 할 가장 안전한 행동을 고르세요. Student: I spilled a chemical near the sink. Teacher: Step back, warn others, and call me. Do not touch it with your hands.",
      options: [
        "Step back, keep others away, and call the teacher.",
        "Wipe it with bare hands.",
        "Invite classmates to examine it.",
        "Pour another chemical over the spill.",
      ],
      answer: 0,
      explanation:
        "교사는 물러나 다른 사람을 막고 자신을 부르라고 했으며 손으로 만지지 말라고 했습니다.",
      difficulty: 2,
    },
    {
      id: "l1-067",
      prompt:
        "반 친구가 온라인 소문을 퍼뜨리려는 대화를 읽고 할 말을 고르세요. Hana: Someone says the exam is canceled. Minho: The official school page has no notice yet.",
      options: [
        "Let us check the official page before sharing the rumor.",
        "Share it with every class immediately.",
        "Delete the official page.",
        "Assume silence means it is canceled.",
      ],
      answer: 0,
      explanation:
        "학교 공식 페이지에 공지가 없으므로 소문을 퍼뜨리기 전에 공식 정보를 확인해야 합니다.",
      difficulty: 2,
    },
    {
      id: "l1-068",
      prompt:
        "공동체 회의에 관한 글을 읽고 주민들이 한 일을 고르세요. The town wanted to turn an empty lot into a park. Residents shared parking concerns, and the final plan kept trees, added a play area, and left space for bicycles.",
      options: [
        "They revised the plan after hearing different concerns.",
        "They rejected every concern.",
        "They removed trees and bicycle space.",
        "They built a parking lot without a meeting.",
      ],
      answer: 0,
      explanation:
        "주민들의 우려를 들은 뒤 나무, 놀이 공간, 자전거 공간을 포함하도록 계획을 조정했습니다.",
      difficulty: 3,
    },
    {
      id: "l1-069",
      prompt:
        "언어 교환 중 관용 표현을 오해한 상황에서 할 가장 좋은 말을 고르세요. Hana: The coach said, You need to break a leg before the show. Yuki: That sounds dangerous. Hana: It means good luck.",
      options: [
        "Ask about the expression instead of taking it literally.",
        "Tell the coach to injure performers.",
        "Leave because every word is dangerous.",
        "Translate it as a medical order.",
      ],
      answer: 0,
      explanation:
        "break a leg은 실제 부상을 바라는 말이 아니라 행운을 비는 표현이므로 뜻을 확인하는 것이 좋습니다.",
      difficulty: 2,
    },
    {
      id: "l1-070",
      prompt:
        "다음 대화에서 학교 직원이 해야 할 일을 고르세요. Student: The elevator button is broken, and a classmate using a wheelchair is waiting. Staff: I will call maintenance and guide you to the accessible entrance.",
      options: [
        "Call maintenance and guide the student to an accessible entrance.",
        "Tell the student to repair the button.",
        "Block the accessible entrance.",
        "Ask the student to use unavailable stairs.",
      ],
      answer: 0,
      explanation:
        "직원은 고장 신고와 접근 가능한 입구 안내를 하겠다고 했으므로 두 일을 실행해야 합니다.",
      difficulty: 2,
    },
    {
      id: "l1-071",
      prompt:
        "다음 글의 주제를 고르세요. A city bus app predicts crowded times from past passenger data. It helps commuters plan, but routes with little data may receive less accurate predictions.",
      options: [
        "Predictions can help commuters but may be less accurate on some routes.",
        "Bus apps never use passenger data.",
        "Every route receives perfectly accurate predictions.",
        "Commuters should avoid buses whenever an app exists.",
      ],
      answer: 0,
      explanation:
        "승객 자료를 이용한 예측의 편리함과 자료가 적은 노선의 한계를 함께 설명한 글입니다.",
      difficulty: 3,
    },
    {
      id: "l1-072",
      prompt:
        "친구에게 사과하고 문제를 해결하는 가장 좋은 대화를 고르세요. Mira: You shared my photo without asking. Joon: I am sorry. I will delete it now and ask before sharing anything next time.",
      options: [
        "Accept the apology after the photo is deleted and set a clear boundary.",
        "Share another private photo.",
        "Post the photo again.",
        "Tell everyone permission is never needed.",
      ],
      answer: 0,
      explanation:
        "사진을 삭제하고 다음부터 허락을 받겠다는 약속 뒤에 경계를 분명히 하는 것이 문제를 해결하는 방법입니다.",
      difficulty: 2,
    },
    {
      id: "l1-073",
      prompt:
        "도시 열섬에 관한 글을 읽고 두 해결책의 공통 목적을 고르세요. The city plans to plant more street trees and paint roofs with reflective material. Both plans are expected to lower summer temperatures in crowded neighborhoods.",
      options: [
        "Both plans aim to reduce heat in the city.",
        "Both plans remove all roofs.",
        "Only trees can lower temperatures.",
        "Reflective roofs make areas hotter.",
      ],
      answer: 0,
      explanation:
        "가로수와 반사 재료 지붕은 방법은 다르지만 여름철 동네의 열을 낮추려는 공통 목적이 있습니다.",
      difficulty: 2,
    },
    {
      id: "l1-074",
      prompt:
        "고객 문의 이메일에서 가장 정중한 요청을 고르세요. Dear store team, The headphones I received have no sound in the left side. I attached the order number and would like to know how to exchange them.",
      options: [
        "Please tell me how I can exchange the headphones.",
        "Send me every product immediately.",
        "I will keep the broken headphones and tell nobody.",
        "The order number is unnecessary.",
      ],
      answer: 0,
      explanation:
        "고객은 주문 번호를 첨부하고 고장 난 제품의 교환 방법을 묻고 있으므로 첫 요청이 적절합니다.",
      difficulty: 2,
    },
    {
      id: "l1-075",
      prompt:
        "기부 단체 보고서에서 추론할 수 있는 것을 고르세요. The charity publishes the number of meals it served, its costs, and receipts from suppliers each month. Donors can ask questions at an open meeting.",
      options: [
        "The charity gives donors ways to check how money is used.",
        "The charity shares no financial information.",
        "Donors must hide their questions.",
        "The report counts meals but never costs.",
      ],
      answer: 0,
      explanation:
        "식사 수, 비용, 영수증을 공개하고 질문 모임도 열어 기금 사용을 확인할 방법을 제공합니다.",
      difficulty: 3,
    },
    {
      id: "l1-076",
      prompt:
        "다음 글의 주장에 대한 정확한 판단을 고르세요. A survey found that students who carry reusable bottles miss fewer classes. The writer says this shows bottles prevent illness, but the survey did not ask about health or other habits.",
      options: [
        "The survey alone does not prove that bottles prevent illness.",
        "The survey measured every student's health.",
        "Reusable bottles always cause absences.",
        "The writer collected medical records from everyone.",
      ],
      answer: 0,
      explanation:
        "결석과 물병의 관계는 조사했지만 건강이나 다른 습관을 묻지 않았으므로 질병 예방의 원인이라고 증명할 수 없습니다.",
      difficulty: 3,
    },
    {
      id: "l1-077",
      prompt:
        "여행 중 환승을 놓친 상황에서 할 가장 좋은 행동을 고르세요. Announcement: The first train arrived late, so several passengers missed the connection. Staff: We can move your ticket to the next train or explain a bus route.",
      options: [
        "Ask the staff about the next train or bus route.",
        "Leave without checking any option.",
        "Board a train going the opposite way.",
        "Destroy the ticket.",
      ],
      answer: 0,
      explanation:
        "직원이 다음 열차로 표를 바꾸거나 버스 노선을 안내할 수 있다고 했으므로 두 선택지를 문의해야 합니다.",
      difficulty: 2,
    },
    {
      id: "l1-078",
      prompt:
        "개인 정보 보호에 관한 대화를 읽고 가장 책임 있는 응답을 고르세요. Sumi: A club form asks for my home address. Advisor: We need it only to mail the certificate. You: ___",
      options: [
        "Ask how the address will be stored and when it will be deleted.",
        "Post the address in the public chat.",
        "Give every friend's address instead.",
        "Sign immediately without asking.",
      ],
      answer: 0,
      explanation:
        "주소를 제공하기 전에 보관 방법과 삭제 시기를 확인하는 것이 개인 정보를 안전하게 다루는 행동입니다.",
      difficulty: 3,
    },
    {
      id: "l1-079",
      prompt:
        "공동체 텃밭의 기록을 읽고 가장 타당한 결론을 고르세요. In April, volunteers planted native flowers beside the vegetable beds. By June, visiting bees had doubled, but gardeners did not measure bee numbers before April.",
      options: [
        "The flowers may have helped attract bees, but the record is incomplete.",
        "The flowers definitely caused every bee to arrive.",
        "No bees visited before April.",
        "The gardeners measured bees for a year.",
      ],
      answer: 0,
      explanation:
        "꽃을 심은 뒤 벌이 두 배가 되었지만 이전 수치를 측정하지 않아 꽃의 효과를 확정할 수는 없습니다.",
      difficulty: 3,
    },
    {
      id: "l1-080",
      prompt:
        "다음 동아리 소개 글의 중심 생각을 고르세요. The school performance club stages a play each spring and spends the rest of the year repairing costumes for a neighborhood theater. Members practice acting while supporting local performances.",
      options: [
        "The club combines performances with community service.",
        "The club performs only when costumes are thrown away.",
        "Members avoid acting and work only in a theater shop.",
        "The neighborhood theater never receives student help.",
      ],
      answer: 0,
      explanation:
        "동아리는 봄 공연을 하고 평소에는 지역 극장의 의상을 고치므로 공연과 지역 봉사를 함께 합니다.",
      difficulty: 2,
    },
  ],
  6: [
    {
      id: "l6-001",
      prompt:
        "Read the sentence. The fox's thick winter coat traps warm air close to its skin. What is the coat's main function?",
      options: [
        "It reduces heat loss.",
        "It lets heat escape more quickly.",
        "It keeps the fox cool by holding cold air.",
        "It mainly signals the fox’s age to other foxes.",
      ],
      answer: 0,
      explanation:
        "두꺼운 털이 따뜻한 공기를 가둔다는 설명은 체온이 빠져나가는 것을 줄인다는 뜻입니다.",
      difficulty: 1,
    },
    {
      id: "l6-002",
      prompt:
        "Read the sentence. A camel can go for days with little water because its body conserves moisture. What can we infer?",
      options: [
        "The camel depends on frequent rain to replace water.",
        "The camel is adapted to a dry habitat.",
        "The camel loses moisture quickly in hot weather.",
        "The camel is adapted to a cold, wet habitat.",
      ],
      answer: 1,
      explanation:
        "물을 아끼도록 몸이 적응했다는 점에서 건조한 환경에 알맞은 동물임을 추론할 수 있습니다.",
      difficulty: 1,
    },
    {
      id: "l6-003",
      prompt:
        "Read the sentence. Owls hunt at night, when their large eyes collect more available light. Why are the eyes useful?",
      options: [
        "They help owls see only in bright daylight.",
        "They help owls hear prey in the dark.",
        "They help owls see in darkness.",
        "They block most available light from reaching the eyes.",
      ],
      answer: 2,
      explanation:
        "밤에 빛을 더 모은다는 설명은 어두운 곳에서 보는 데 도움을 준다는 뜻입니다.",
      difficulty: 1,
    },
    {
      id: "l6-004",
      prompt:
        "Read the passage. A beaver builds a dam across a stream. The still water behind it becomes a safe place for fish and frogs. What is one effect of the dam?",
      options: [
        "It makes the upstream water flow faster.",
        "It creates a dry shelter instead of wet habitat.",
        "It removes safe places for fish and frogs.",
        "It creates a wet habitat for other animals.",
      ],
      answer: 3,
      explanation:
        "댐 뒤의 고인 물이 물고기와 개구리의 장소가 되므로 다른 동물의 습지를 만든 것입니다.",
      difficulty: 2,
    },
    {
      id: "l6-005",
      prompt:
        "Read the sentence. Penguins have dense feathers and a layer of fat that protect them from icy water. What do these features do?",
      options: [
        "They help penguins keep body heat.",
        "They let body heat escape into the icy water.",
        "They keep feathers dry but do not affect temperature.",
        "They cool penguins by exposing their skin to water.",
      ],
      answer: 0,
      explanation: "촘촘한 깃털과 지방층은 추위를 막아 체온을 유지하게 합니다.",
      difficulty: 1,
    },
    {
      id: "l6-006",
      prompt:
        "Read the passage. When a caterpillar becomes a butterfly, its diet and body change. Which statement is best supported?",
      options: [
        "The butterfly and caterpillar need exactly the same food.",
        "Different life stages can have different needs.",
        "Only the butterfly changes its body during growth.",
        "The caterpillar’s needs disappear inside the chrysalis.",
      ],
      answer: 1,
      explanation:
        "애벌레와 나비의 몸과 먹이가 달라진다는 내용에서 생애 단계마다 필요가 다름을 알 수 있습니다.",
      difficulty: 2,
    },
    {
      id: "l6-007",
      prompt:
        "Read the sentence. A woodpecker's stiff tail feathers brace its body against a tree while it searches for insects. What does brace mean here?",
      options: [
        "prepare for impact",
        "lean away from the tree",
        "support",
        "release its body",
      ],
      answer: 2,
      explanation:
        "나무에 몸을 기대어 지탱한다는 문맥이므로 brace는 support와 같은 뜻입니다.",
      difficulty: 2,
    },
    {
      id: "l6-008",
      prompt:
        "Read the passage. The arctic hare turns white in winter and brown in summer. Why is this change useful?",
      options: [
        "It makes the hare easier for predators to notice.",
        "It keeps the hare warm but does not affect visibility.",
        "It changes the hare’s diet when snow falls.",
        "It camouflages the hare in different seasons.",
      ],
      answer: 3,
      explanation:
        "계절에 따라 털빛이 주변과 비슷해져 포식자에게 덜 보이는 위장입니다.",
      difficulty: 2,
    },
    {
      id: "l6-009",
      prompt:
        "Read the passage. A hummingbird's long bill reaches nectar deep inside a flower. While feeding, it carries pollen from one flower to another. Which relationship is described?",
      options: [
        "The bird gets food while pollinating the flower.",
        "The bird gets food but prevents the flower from being pollinated.",
        "The bird pollinates the flower but receives no food.",
        "The bird and flower compete for the same nectar.",
      ],
      answer: 0,
      explanation:
        "새는 꿀을 얻고 꽃은 꽃가루가 옮겨져 서로 이로운 관계입니다.",
      difficulty: 2,
    },
    {
      id: "l6-010",
      prompt:
        "Read the passage. Wolves often hunt in groups. A group can surround prey that one wolf could not catch alone. What does this show?",
      options: [
        "Group hunting makes prey harder to surround.",
        "Cooperation can improve hunting success.",
        "Only the strongest wolf can catch the prey.",
        "Group hunting helps communication but not hunting success.",
      ],
      answer: 1,
      explanation:
        "무리로 둘러싸면 혼자 잡기 어려운 먹이를 잡을 수 있으므로 협동의 효과를 보여 줍니다.",
      difficulty: 1,
    },
    {
      id: "l6-011",
      prompt:
        "Read the sentence. A frog's moist skin allows some oxygen to pass into its body, but the frog must stay near water. What is the best inference?",
      options: [
        "Dry conditions make the frog’s skin absorb oxygen faster.",
        "Water is needed for eggs but not for the frog’s breathing.",
        "Dry conditions can make breathing difficult for the frog.",
        "The frog breathes equally well far from ponds.",
      ],
      answer: 2,
      explanation:
        "피부가 젖어 있어야 산소가 통하므로 마르면 호흡이 어려워질 수 있습니다.",
      difficulty: 2,
    },
    {
      id: "l6-012",
      prompt:
        "Read the passage. A herd of elephants uses low sounds that travel far through the ground. What is a likely purpose?",
      options: [
        "The sounds warn nearby elephants but cannot travel far.",
        "The sounds help elephants locate food underground.",
        "The sounds are used only by calves inside the herd.",
        "To communicate over a long distance.",
      ],
      answer: 3,
      explanation:
        "땅을 통해 멀리 전달되는 소리라는 점에서 무리 사이 의사소통 목적을 추론합니다.",
      difficulty: 2,
    },
    {
      id: "l6-013",
      prompt:
        "Read the sentence. The word nocturnal describes an animal that is active at night. Which animal is most likely nocturnal?",
      options: [
        "A bat that feeds after sunset.",
        "A bat that sleeps through the night.",
        "A moth that flies only at noon.",
        "A deer that feeds only at sunrise.",
      ],
      answer: 0,
      explanation:
        "nocturnal은 밤에 활동하는 뜻이므로 해가 진 뒤 먹이를 먹는 박쥐가 해당합니다.",
      difficulty: 1,
    },
    {
      id: "l6-014",
      prompt:
        "Read the passage. A sea turtle mistakes a plastic bag for a jellyfish and swallows it. The bag gets stuck in its intestines and prevents food from passing through. Which danger is directly described?",
      options: [
        "The bag changes the temperature of the turtle's blood.",
        "It can block the turtle's digestive system.",
        "It stops oxygen from entering through the turtle's lungs.",
        "The bag increases the turtle's need for fresh water.",
      ],
      answer: 1,
      explanation:
        "장에 걸려 음식이 지나가지 못한다는 문장이 소화기관의 막힘을 직접 설명합니다.",
      difficulty: 2,
    },
    {
      id: "l6-015",
      prompt:
        "Read the sentence. The deer population fell after a road cut the forest into small patches. What does fragmented mean in this context?",
      options: [
        "connected into one continuous forest",
        "covered by one unbroken layer of trees",
        "broken into separated parts",
        "divided temporarily by seasonal snow",
      ],
      answer: 2,
      explanation:
        "도로 때문에 숲이 작은 조각으로 나뉘었다는 문맥에서 fragmented는 분리된 부분으로 깨진다는 뜻입니다.",
      difficulty: 2,
    },
    {
      id: "l6-016",
      prompt:
        "Read the passage. Bees transfer pollen as they visit flowers. In return, they collect nectar for food. What is this interaction?",
      options: [
        "Bees get nectar while flowers receive no pollen.",
        "Flowers receive pollen while bees lose access to food.",
        "Bees and flowers compete for the same nectar.",
        "a mutually beneficial relationship",
      ],
      answer: 3,
      explanation:
        "벌은 먹이를 얻고 꽃은 수분이 되므로 서로 이익을 얻는 관계입니다.",
      difficulty: 2,
    },
    {
      id: "l6-017",
      prompt:
        "Read the sentence. A chameleon changes color partly to send signals to other chameleons, not only to hide. What does partly mean?",
      options: [
        "to some degree",
        "in every case",
        "only to hide",
        "to a greater degree than the other reason",
      ],
      answer: 0,
      explanation: "partly는 ‘부분적으로, 어느 정도’라는 뜻입니다.",
      difficulty: 2,
    },
    {
      id: "l6-018",
      prompt:
        "Read the passage. Salmon hatch in rivers, migrate to the ocean, and later return to the same rivers to spawn. What does migrate mean?",
      options: [
        "return to one river without travelling to the ocean",
        "move from one region to another",
        "change from a river fish into an ocean bird",
        "remain in the same small pool until spawning",
      ],
      answer: 1,
      explanation:
        "태어나 강에서 바다로 이동했다가 돌아오는 내용이므로 migrate는 지역 사이를 이동한다는 뜻입니다.",
      difficulty: 1,
    },
    {
      id: "l6-019",
      prompt:
        "Read the sentence. In the food chain grass → rabbit → fox, which organism is the prey?",
      options: [
        "grass, the producer in the chain",
        "fox, the predator in the chain",
        "rabbit",
        "a hawk, which is not shown in the chain",
      ],
      answer: 2,
      explanation:
        "여우에게 먹히는 토끼가 먹이인 prey이고, 여우는 predator입니다.",
      difficulty: 1,
    },
    {
      id: "l6-020",
      prompt:
        "Read the sentence. The owl is a predator, while the mouse is its prey. What is a predator?",
      options: [
        "an animal that is hunted by another animal",
        "an animal that eats only plants",
        "an animal that shares food with another animal",
        "an animal that hunts another animal",
      ],
      answer: 3,
      explanation:
        "predator는 다른 동물을 사냥하는 동물이라는 문맥적 정의입니다.",
      difficulty: 1,
    },
    {
      id: "l6-021",
      prompt:
        "Read the passage. A wetland filters dirty water before it reaches a lake. Which word best describes the wetland's role?",
      options: [
        "purify",
        "contaminate the water",
        "move the water without cleaning it",
        "remove water from the lake",
      ],
      answer: 0,
      explanation:
        "더러운 물을 걸러 호수로 가기 전에 깨끗하게 하므로 purify가 알맞습니다.",
      difficulty: 2,
    },
    {
      id: "l6-022",
      prompt:
        "Read the sentence. An animal's habitat provides food, shelter, and places to raise young. What is a habitat?",
      options: [
        "the food an organism eats",
        "the natural home of an organism",
        "a shelter used only for sleeping",
        "a place where an organism is temporarily observed",
      ],
      answer: 1,
      explanation:
        "먹이와 은신처를 제공하는 생물의 자연 서식지가 habitat입니다.",
      difficulty: 1,
    },
    {
      id: "l6-023",
      prompt:
        "Read the passage. When a forest is cleared, the canopy disappears and the ground becomes hotter and drier. What is the canopy?",
      options: [
        "the layer of roots and soil below trees",
        "the open space above the branches",
        "the upper layer of tree branches and leaves",
        "the tree trunks in the middle of the forest",
      ],
      answer: 2,
      explanation: "나무의 윗부분에 모인 가지와 잎 층을 canopy라고 합니다.",
      difficulty: 2,
    },
    {
      id: "l6-024",
      prompt:
        "Read the sentence. The word scarce means difficult to find or obtain. During a drought, what may become scarce?",
      options: [
        "rainfall during a wet season",
        "dry sand in a desert",
        "shade beneath trees",
        "fresh water",
      ],
      answer: 3,
      explanation:
        "가뭄에는 fresh water를 얻기 어려워지므로 scarce해질 수 있습니다.",
      difficulty: 1,
    },
    {
      id: "l6-025",
      prompt:
        "Read the passage. Rangers restored a stream by removing concrete and planting native trees along its banks. What was their goal?",
      options: [
        "to return the stream to a healthier natural state",
        "to increase the stream’s concrete banks",
        "to make the water flow faster for boats",
        "to remove native trees from the banks",
      ],
      answer: 0,
      explanation:
        "콘크리트를 제거하고 토종 나무를 심어 자연 상태를 회복하려는 복원 활동입니다.",
      difficulty: 2,
    },
    {
      id: "l6-026",
      prompt:
        "Read the sentence. A species is endangered when it faces a high risk of extinction. Which situation fits?",
      options: [
        "Many breeding pairs occupy protected habitat.",
        "Only a few breeding pairs remain.",
        "The population is increasing quickly.",
        "The species is common across the region.",
      ],
      answer: 1,
      explanation:
        "번식 가능한 쌍이 거의 남지 않은 상황은 멸종 위험이 높다는 뜻입니다.",
      difficulty: 1,
    },
    {
      id: "l6-027",
      prompt:
        "Read the passage. The reserve connects two isolated forests with a strip of trees. What is the strip called?",
      options: [
        "a fence that keeps animals in one forest",
        "a road dividing the two forests",
        "a wildlife corridor",
        "a concrete strip separating habitats",
      ],
      answer: 2,
      explanation:
        "서로 떨어진 숲을 이어 동물 이동을 돕는 띠 모양 공간은 wildlife corridor입니다.",
      difficulty: 2,
    },
    {
      id: "l6-028",
      prompt:
        "Read the sentence. Invasive plants spread quickly and crowd out native seedlings. What does crowd out mean?",
      options: [
        "give native seedlings more space and light",
        "protect seedlings by growing around them",
        "measure the seedlings’ population",
        "push something out by taking its space or resources",
      ],
      answer: 3,
      explanation:
        "외래 식물이 공간과 자원을 차지해 토종 묘목을 밀어낸다는 뜻입니다.",
      difficulty: 2,
    },
    {
      id: "l6-029",
      prompt:
        "Read the passage. A park banned feeding wild monkeys because they began approaching people and eating unhealthy food. Why was the rule made?",
      options: [
        "to keep both monkeys and people safer",
        "to attract monkeys closer for tourists",
        "to supplement monkeys’ natural diet",
        "to train monkeys to approach people",
      ],
      answer: 0,
      explanation:
        "사람에게 다가오고 건강하지 않은 음식을 먹는 문제를 줄여 모두의 안전을 지키려는 규칙입니다.",
      difficulty: 2,
    },
    {
      id: "l6-030",
      prompt:
        "Read the sentence. Scientists record the number of frogs each spring to track population trends. What does track mean here?",
      options: [
        "count frogs once and stop",
        "monitor over time",
        "chase frogs to a new pond",
        "map only where frogs live",
      ],
      answer: 1,
      explanation:
        "매년 수를 기록해 변화를 살피는 것이므로 track은 시간에 따라 관찰한다는 뜻입니다.",
      difficulty: 2,
    },
    {
      id: "l6-031",
      prompt:
        "Read the passage. Because warmer springs make insects emerge earlier, some birds arrive after the insects' peak. What problem may follow?",
      options: [
        "The birds find more insects when they arrive.",
        "The chicks hatch before insects emerge.",
        "The birds may find less food for their chicks.",
        "The birds switch from insects to plants.",
      ],
      answer: 2,
      explanation:
        "새가 도착했을 때 곤충이 이미 가장 많을 때를 지나 먹이가 줄 수 있습니다.",
      difficulty: 2,
    },
    {
      id: "l6-032",
      prompt:
        "Read the sentence. The scientist described the result as unintentional: the fish entered the canal by accident. What does unintentional mean?",
      options: [
        "carefully planned",
        "caused by a human decision",
        "done after repeated warnings",
        "not planned",
      ],
      answer: 3,
      explanation:
        "우연히 들어갔다는 설명에서 unintentional은 계획하지 않은이라는 뜻입니다.",
      difficulty: 1,
    },
    {
      id: "l6-033",
      prompt:
        "Read the passage. A farmer leaves some weeds between crops because they shelter insects that eat aphids. Which conclusion is best?",
      options: [
        "Some insects can help protect crops.",
        "The insects eat aphids but destroy every crop.",
        "All insects living in weeds are harmful pests.",
        "Removing every weed is the only crop protection.",
      ],
      answer: 0,
      explanation:
        "진딧물을 먹는 곤충이 작물을 보호하므로 모든 곤충이 해로운 것은 아닙니다.",
      difficulty: 2,
    },
    {
      id: "l6-034",
      prompt:
        "Read the passage. A pond may dry up during a long drought, leaving amphibians without a place to lay eggs. What may happen?",
      options: [
        "Drying creates more places for amphibians to lay eggs.",
        "Drying can threaten amphibian reproduction.",
        "Amphibians can lay eggs equally well on dry land.",
        "Pond levels do not affect amphibian reproduction.",
      ],
      answer: 1,
      explanation:
        "연못이 마르면 알을 낳을 장소를 잃어 번식이 어려워질 수 있습니다.",
      difficulty: 2,
    },
    {
      id: "l6-035",
      prompt:
        "Read the passage. The owl is small, but it hunts successfully because it flies silently. Why can it hunt successfully?",
      options: [
        "Because it is small.",
        "Because it flies silently.",
        "Because it lives near water.",
        "Because it hunts only in daylight.",
      ],
      answer: 1,
      explanation:
        "조용히 날아 먹잇감에 들키지 않는 점이 성공적인 사냥의 이유입니다.",
      difficulty: 1,
    },
    {
      id: "l6-036",
      prompt:
        "Read the passage. The otter has dense fur and can stay warm in cold rivers. What detail explains its warmth?",
      options: [
        "Its dense fur.",
        "The cold rivers.",
        "Its ability to stay warm.",
        "Its need for water.",
      ],
      answer: 0,
      explanation:
        "촘촘한 털이 체온을 지켜 추운 강에서도 따뜻하게 지낼 수 있습니다.",
      difficulty: 1,
    },
    {
      id: "l6-037",
      prompt:
        "Read the passage. Some animals store food underground and survive a long winter. Which animals may survive?",
      options: [
        "animals that put food below the ground",
        "animals that search below ground but do not store food",
        "animals that store food in trees",
        "animals that eat only food above ground",
      ],
      answer: 0,
      explanation:
        "땅속에 먹이를 저장하는 동물이 긴 겨울을 견딜 수 있다는 내용입니다.",
      difficulty: 2,
    },
    {
      id: "l6-038",
      prompt:
        "Read the passage. The nest was abandoned after the tree was cut down. What happened first?",
      options: [
        "The nest was abandoned before the tree was cut down.",
        "The tree was cut down.",
        "The eggs hatched after the tree was cut down.",
        "The tree grew after the nest was abandoned.",
      ],
      answer: 1,
      explanation:
        "나무가 잘린 뒤 둥지가 버려졌으므로 나무를 자른 일이 먼저였습니다.",
      difficulty: 1,
    },
    {
      id: "l6-039",
      prompt:
        "Read the passage. The bird lost its habitat and moved closer to farms. Why did it move?",
      options: [
        "A nearby farm offered more food.",
        "The bird built a larger nest.",
        "The loss of its habitat.",
        "The bird followed a seasonal migration route.",
      ],
      answer: 2,
      explanation:
        "서식지를 잃은 것이 농장 가까이로 이동한 직접적인 이유입니다.",
      difficulty: 2,
    },
    {
      id: "l6-040",
      prompt:
        "Read the passage. The river was polluted by factory waste, so fish numbers declined. Which statement is supported?",
      options: [
        "Fish numbers declined because the water quality improved.",
        "Factory waste increased the fish’s food supply.",
        "The river remained clean despite the waste.",
        "Factory waste harmed the river ecosystem.",
      ],
      answer: 3,
      explanation:
        "공장 폐기물로 강이 오염되고 물고기 수가 줄었다는 인과 관계가 제시됩니다.",
      difficulty: 1,
    },
    {
      id: "l6-041",
      prompt:
        "Read the passage. The reserve protects land where elephants feed during the dry season. Why is this land important?",
      options: [
        "It is a feeding place for elephants.",
        "It is used only during heavy rain.",
        "It keeps elephants away from food.",
        "It is a place where no animals can live.",
      ],
      answer: 0,
      explanation:
        "건기에도 코끼리가 먹이를 구할 수 있는 장소이므로 보호할 가치가 있습니다.",
      difficulty: 2,
    },
    {
      id: "l6-042",
      prompt:
        "Read the passage. When a predator disappears, the prey population may rise and overgraze plants. What is the likely chain?",
      options: [
        "more predators can lead to fewer prey and more plants",
        "fewer predators can lead to more prey and less vegetation",
        "fewer predators can lead to fewer prey and more vegetation",
        "predator loss affects water but not prey or plants",
      ],
      answer: 1,
      explanation:
        "포식자 감소, 먹이 증가, 식물 과도한 섭취라는 연쇄를 설명합니다.",
      difficulty: 3,
    },
    {
      id: "l6-043",
      prompt:
        "Read the sentence. The researcher measured the beak length to determine which seeds the finch could crack. What was the purpose of measuring?",
      options: [
        "to find where finches sleep",
        "to measure the seeds’ color",
        "to connect beak size with feeding ability",
        "to compare the finches’ songs",
      ],
      answer: 2,
      explanation:
        "부리 길이와 씨앗을 깨는 능력의 관계를 알아보려 측정했습니다.",
      difficulty: 2,
    },
    {
      id: "l6-044",
      prompt:
        "Read the passage. A whale surfaces, exhales, and then dives again. Why must it surface?",
      options: [
        "to collect food from the surface",
        "to avoid every predator near the surface",
        "to cool its body before diving",
        "It needs to breathe air.",
      ],
      answer: 3,
      explanation: "고래는 포유류라 공기를 마시기 위해 수면으로 올라옵니다.",
      difficulty: 1,
    },
    {
      id: "l6-045",
      prompt:
        "Read the sentence. The word resilient describes a coral reef that recovers after a mild storm. Which meaning fits resilient?",
      options: [
        "able to recover",
        "unable to recover after a storm",
        "able to resist damage but not recover",
        "likely to break after a mild storm",
      ],
      answer: 0,
      explanation:
        "폭풍 뒤 회복한다는 문맥에서 resilient는 회복력이 있는이라는 뜻입니다.",
      difficulty: 2,
    },
    {
      id: "l6-046",
      prompt:
        "Read the passage. During drought, the farmer uses drip irrigation, which sends small amounts of water directly to roots. What is an advantage?",
      options: [
        "It sends equal water across every field.",
        "It reduces wasted water.",
        "It waters leaves instead of roots.",
        "It increases runoff from dry soil.",
      ],
      answer: 1,
      explanation: "필요한 뿌리에 조금씩 보내므로 물의 낭비를 줄입니다.",
      difficulty: 1,
    },
    {
      id: "l6-047",
      prompt:
        "Read the sentence. The volunteers removed fishing line from a seal's neck. What does removed mean?",
      options: [
        "pulled the fishing line tighter",
        "measured the line carefully",
        "took away",
        "left the line on the seal",
      ],
      answer: 2,
      explanation:
        "목에서 낚싯줄을 없앴다는 뜻이므로 removed는 took away와 같습니다.",
      difficulty: 1,
    },
    {
      id: "l6-048",
      prompt:
        "Read the passage. Researchers placed cameras near a den instead of entering it. Why did they use cameras?",
      options: [
        "to attract animals into the den",
        "to make it easier for researchers to enter",
        "to record only human visitors",
        "to observe animals without disturbing them",
      ],
      answer: 3,
      explanation:
        "굴에 들어가 방해하지 않고 관찰하려고 카메라를 설치했습니다.",
      difficulty: 1,
    },
    {
      id: "l6-049",
      prompt:
        "Read the sentence. The park limits visitors during nesting season. Which value does this policy show?",
      options: [
        "protecting animals during a sensitive period",
        "increasing visitor access during nesting",
        "keeping people away only after nesting",
        "allowing visitors to handle eggs",
      ],
      answer: 0,
      explanation:
        "번식 시기에는 민감하므로 방문을 제한해 보호하는 정책입니다.",
      difficulty: 2,
    },
    {
      id: "l6-050",
      prompt:
        "Read the passage. An experiment compared two ponds: one with native plants and one without. Both ponds received the same amount of sunlight. Why keep sunlight the same?",
      options: [
        "to make sunlight the main difference",
        "to isolate the effect of the plants",
        "to test only the water temperature",
        "to let native plants receive extra light",
      ],
      answer: 1,
      explanation:
        "햇빛을 같게 해야 식물 유무의 효과를 공정하게 비교할 수 있습니다.",
      difficulty: 3,
    },
    {
      id: "l6-051",
      prompt:
        "Read the sentence. The article states that plastic does not biodegrade quickly. What does biodegrade mean?",
      options: [
        "break down only when heated",
        "remain unchanged in soil",
        "break down naturally",
        "break down into smaller pieces but not naturally",
      ],
      answer: 2,
      explanation:
        "자연적으로 분해된다는 뜻이므로 biodegrade는 break down naturally입니다.",
      difficulty: 1,
    },
    {
      id: "l6-052",
      prompt:
        "Read the passage. A city planted trees along streets. Five years later, summer pavement temperatures were lower. What evidence supports the project?",
      options: [
        "Trees made the pavement hotter.",
        "Tree roots were unrelated to the temperature change.",
        "Summer temperatures stayed unchanged.",
        "The shaded streets became cooler.",
      ],
      answer: 3,
      explanation:
        "5년 뒤 그늘진 도로의 포장 온도가 낮아졌다는 결과가 효과를 뒷받침합니다.",
      difficulty: 2,
    },
    {
      id: "l6-053",
      prompt:
        "Read the comparison. The desert receives little rain, while the rainforest receives much. How do these places differ?",
      options: [
        "The desert is drier than the rainforest.",
        "Both places receive the same amount of rain.",
        "Neither place receives any rain.",
        "The rainforest is always drier than the desert.",
      ],
      answer: 0,
      explanation:
        "사막은 비가 적고 열대우림은 비가 많다는 차이가 글에 제시되어 있습니다.",
      difficulty: 2,
    },
    {
      id: "l6-054",
      prompt:
        "Read the passage. The first survey found fewer nests, but a second survey found more after protection began. What is the best conclusion?",
      options: [
        "Protection definitely caused every nest to disappear.",
        "The protection may have helped the nesting population.",
        "The increase happened before protection began.",
        "Protection could not affect nesting numbers.",
      ],
      answer: 1,
      explanation:
        "보호 시작 후 둥지가 늘었다는 자료에서 보호가 도움을 주었을 가능성을 말할 수 있습니다.",
      difficulty: 2,
    },
    {
      id: "l6-055",
      prompt:
        "Read the sentence. A seed is dispersed when it is carried away from its parent plant. Which is an example?",
      options: [
        "The seed stays inside the berry near its parent plant.",
        "Wind carries a leaf but not a seed from the plant.",
        "A bird eats a berry and drops the seed far away.",
        "A bird eats the berry but drops the seed on the same branch.",
      ],
      answer: 2,
      explanation: "새가 씨앗을 먼 곳으로 옮긴 것이 종자 dispersal의 예입니다.",
      difficulty: 1,
    },
    {
      id: "l6-056",
      prompt:
        "Read the passage. Mangrove roots slow waves and trap sediment along a coast. What service do mangroves provide?",
      options: [
        "They increase wave speed near the coast.",
        "They remove all sediment from the shore.",
        "They make the coast more exposed to storms.",
        "They reduce coastal erosion.",
      ],
      answer: 3,
      explanation: "파도와 퇴적물을 붙잡아 해안 침식을 줄이는 역할입니다.",
      difficulty: 2,
    },
    {
      id: "l6-057",
      prompt:
        "Read the sentence. The scientist called the result preliminary because only ten nests had been observed. What does preliminary suggest?",
      options: [
        "It is an early result that needs more evidence.",
        "It is a final conclusion supported by every nest.",
        "It is based on a long, complete survey.",
        "It needs no further evidence.",
      ],
      answer: 0,
      explanation:
        "관찰 수가 적어 초기 결과이며 더 많은 증거가 필요하다는 뜻입니다.",
      difficulty: 2,
    },
    {
      id: "l6-058",
      prompt:
        "Read the passage. If farmers use fewer pesticides, more pollinating insects may survive. Which outcome is expected?",
      options: [
        "Fewer flowers produce seeds because pollinators die.",
        "More flowers may produce seeds.",
        "Flowers receive less pollen when insects survive.",
        "The insects survive but cannot visit flowers.",
      ],
      answer: 1,
      explanation:
        "수분 곤충이 늘면 꽃가루 이동이 많아져 씨앗 생산이 늘 수 있습니다.",
      difficulty: 2,
    },
    {
      id: "l6-059",
      prompt:
        "Read the sentence. The conservation plan requires local residents to report injured wildlife. What does requires mean?",
      options: [
        "makes optional",
        "makes forbidden",
        "makes necessary",
        "makes unnecessary",
      ],
      answer: 2,
      explanation:
        "계획이 주민 신고를 필요하게 한다는 뜻이므로 requires는 makes necessary입니다.",
      difficulty: 1,
    },
    {
      id: "l6-060",
      prompt:
        "Read the passage. The young seal followed its mother, copying how she found food under rocks. What did the seal learn?",
      options: [
        "a route learned by watching people",
        "a way to avoid every rock",
        "an inherited behavior learned without observation",
        "a feeding behavior by observation",
      ],
      answer: 3,
      explanation:
        "어미 행동을 따라 하며 먹이 찾기를 배웠으므로 관찰에 의한 학습입니다.",
      difficulty: 1,
    },
    {
      id: "l6-061",
      prompt:
        "Read the passage. People rescued the turtle, and then they returned it to the sea. What happened first?",
      options: [
        "The turtle was returned after people rescued it.",
        "The turtle was returned before it was rescued.",
        "People returned it before finding it.",
        "The turtle was rescued after it returned to sea.",
      ],
      answer: 0,
      explanation:
        "사람들이 먼저 거북이를 구조하고 나서 바다로 돌려보냈습니다.",
      difficulty: 3,
    },
    {
      id: "l6-062",
      prompt:
        "Read the passage. Some forest species eat fruit, while others eat insects. What difference does the passage show?",
      options: [
        "All species eat the same food.",
        "Different species may eat different food.",
        "Fruit and insects are never found in forests.",
        "Every species competes for fruit only.",
      ],
      answer: 1,
      explanation:
        "숲의 종마다 열매나 곤충처럼 먹이가 다를 수 있다는 차이를 보여 줍니다.",
      difficulty: 2,
    },
    {
      id: "l6-063",
      prompt:
        "Read the passage. The bird builds its nest at the place where branches form a fork. Where does it build the nest?",
      options: [
        "Near a fork in the branches.",
        "In an open field with no trees.",
        "Under water near the river.",
        "Inside a building far from trees.",
      ],
      answer: 0,
      explanation:
        "가지가 갈라지는 곳에 둥지를 만든다고 글에 직접 나와 있습니다.",
      difficulty: 2,
    },
    {
      id: "l6-064",
      prompt:
        "Read the passage. Because the lake became warmer, algae grew rapidly and used much of the available oxygen. What happened to fish?",
      options: [
        "They receive more oxygen as algae use it.",
        "They leave because the water becomes colder.",
        "The available oxygen stays unchanged.",
        "They may have less oxygen to breathe.",
      ],
      answer: 3,
      explanation:
        "조류가 산소를 많이 사용해 물고기가 호흡할 산소가 줄 수 있습니다.",
      difficulty: 2,
    },
    {
      id: "l6-065",
      prompt:
        "Read the sentence. The author includes a graph showing declining bee numbers. Why include the graph?",
      options: [
        "to provide evidence for the claim",
        "to replace evidence with decoration",
        "to show that bees are physically larger",
        "to hide the declining trend",
      ],
      answer: 0,
      explanation:
        "벌 수 감소를 시각적 자료로 보여 주어 주장에 대한 증거를 제공합니다.",
      difficulty: 2,
    },
    {
      id: "l6-066",
      prompt:
        "Read the passage. A national park restored a meadow, and butterflies returned after native flowers bloomed. Which detail is evidence of restoration success?",
      options: [
        "Butterflies disappeared after the flowers bloomed.",
        "Butterflies returned with the native flowers.",
        "Native flowers failed to grow in the meadow.",
        "Restoration removed all sources of nectar.",
      ],
      answer: 1,
      explanation:
        "토종 꽃이 피자 나비가 돌아온 결과가 복원 성공의 증거입니다.",
      difficulty: 1,
    },
    {
      id: "l6-067",
      prompt:
        "Read the passage. Rangers close the trail to protect nesting birds. Why do they close it?",
      options: [
        "To give visitors a shorter route.",
        "To attract noise near the nests.",
        "To protect nesting birds.",
        "To keep birds from nesting.",
      ],
      answer: 2,
      explanation: "둥지를 짓는 새를 보호하려고 방문객의 통행을 막습니다.",
      difficulty: 1,
    },
    {
      id: "l6-068",
      prompt:
        "Read the passage. Even though the reservoir supplied water, its wall blocked fish migration. What tension is described?",
      options: [
        "Both people and fish gained the same benefit.",
        "The reservoir supplied no water and blocked no migration.",
        "Fish migration improved because the wall was built.",
        "A benefit for people can create a cost for wildlife.",
      ],
      answer: 3,
      explanation:
        "사람에게 물을 주는 이점과 물고기 이동을 막는 피해가 함께 제시됩니다.",
      difficulty: 3,
    },
    {
      id: "l6-069",
      prompt:
        "Read the sentence. The researcher found that the species was more abundant near untouched forest. What does abundant mean?",
      options: [
        "present in large numbers",
        "present in very small numbers",
        "found only once",
        "absent from the habitat",
      ],
      answer: 0,
      explanation:
        "손대지 않은 숲 근처에 많이 존재한다는 문맥에서 abundant는 수가 많은 뜻입니다.",
      difficulty: 1,
    },
    {
      id: "l6-070",
      prompt:
        "Read the passage. The report recommends using reusable containers rather than single-use plastic. What is the report's purpose?",
      options: [
        "to suggest using more single-use plastic",
        "to suggest a way to reduce waste",
        "to compare container colors",
        "to describe wildlife without making a recommendation",
      ],
      answer: 1,
      explanation: "재사용 용기를 권해 폐기물을 줄이려는 제안입니다.",
      difficulty: 1,
    },
    {
      id: "l6-071",
      prompt:
        "Read the sentence. The habitat was suitable for otters because it had clean water and plenty of fish. What does suitable mean?",
      options: [
        "too dry for otters",
        "unsuitable for otters",
        "appropriate",
        "unoccupied by any animal",
      ],
      answer: 2,
      explanation:
        "수달이 살 조건에 알맞다는 뜻이므로 suitable은 appropriate입니다.",
      difficulty: 1,
    },
    {
      id: "l6-072",
      prompt:
        "Read the passage. One island has many nesting sites, but rats eat the eggs. Which action would directly protect the birds?",
      options: [
        "Adding more rats near the nests.",
        "Moving nests but leaving the rats.",
        "Feeding rats beside the nests.",
        "Controlling the rat population near nests.",
      ],
      answer: 3,
      explanation:
        "알을 먹는 쥐를 관리하는 것이 새를 직접 보호하는 방법입니다.",
      difficulty: 2,
    },
    {
      id: "l6-073",
      prompt:
        "Read the sentence. A researcher avoided touching the coral because it is fragile. What does fragile mean?",
      options: [
        "easily damaged",
        "difficult to damage",
        "able to heal instantly",
        "safe to touch repeatedly",
      ],
      answer: 0,
      explanation:
        "산호를 만지면 손상될 수 있다는 문맥에서 fragile은 쉽게 손상되는 뜻입니다.",
      difficulty: 1,
    },
    {
      id: "l6-074",
      prompt:
        "Read the passage. The number of nesting pairs increased, while the amount of plastic on the beach decreased. What happened to the plastic?",
      options: [
        "It increased.",
        "It decreased.",
        "It stayed exactly the same.",
        "It disappeared before the nesting season.",
      ],
      answer: 1,
      explanation: "글에서 해변의 플라스틱 양이 줄었다고 직접 말합니다.",
      difficulty: 2,
    },
    {
      id: "l6-075",
      prompt:
        "Read the sentence. The project was successful because residents continued monitoring the stream after scientists left. What maintained the project?",
      options: [
        "a one-time survey after scientists left",
        "local residents stopping observation",
        "ongoing community participation",
        "tourists visiting once",
      ],
      answer: 2,
      explanation:
        "과학자들이 떠난 뒤에도 주민들이 계속 관찰해 사업이 유지되었습니다.",
      difficulty: 2,
    },
    {
      id: "l6-076",
      prompt:
        "Read the passage. A model predicts that sea level will rise, but the authors note that the exact amount is uncertain. Which statement is accurate?",
      options: [
        "The exact amount of rise is certain.",
        "The model predicts no rise at all.",
        "The authors measured every future tide.",
        "The trend is predicted, but its exact size is not certain.",
      ],
      answer: 3,
      explanation:
        "상승 추세의 예측과 정확한 양의 불확실성을 구분한 내용입니다.",
      difficulty: 3,
    },
    {
      id: "l6-077",
      prompt:
        "Read the sentence. Since the river was cleaner, mayflies returned; their larvae are sensitive to pollution. What can be inferred?",
      options: [
        "The river's condition likely improved.",
        "The river became dirtier, so mayflies left.",
        "Mayflies returned because pollution increased.",
        "The larvae are not affected by pollution.",
      ],
      answer: 0,
      explanation:
        "오염에 민감한 생물이 돌아왔으므로 강의 상태가 좋아졌다고 추론할 수 있습니다.",
      difficulty: 2,
    },
    {
      id: "l6-078",
      prompt:
        "Read the passage. The article presents both benefits and drawbacks of ecotourism before suggesting visitor limits. Why is this structure useful?",
      options: [
        "It focuses only on benefits and ignores costs.",
        "It supports a balanced recommendation.",
        "It lists drawbacks but gives no recommendation.",
        "It recommends limits without presenting either side.",
      ],
      answer: 1,
      explanation:
        "장점과 단점을 함께 검토한 뒤 제한을 제안해 균형 잡힌 권고를 뒷받침합니다.",
      difficulty: 3,
    },
    {
      id: "l6-079",
      prompt:
        "Read the passage. A protected forest corridor lets young bears reach feeding areas safely. What result is expected?",
      options: [
        "Closing the corridor makes feeding areas unreachable.",
        "Roads divide the habitat patches further.",
        "Safer movement between habitat patches.",
        "The bears move less safely between patches.",
      ],
      answer: 2,
      explanation:
        "보호된 통로가 숲 조각 사이에서 곰이 더 안전하게 이동하도록 돕습니다.",
      difficulty: 2,
    },
    {
      id: "l6-080",
      prompt:
        "Read the passage. The writer ends by asking readers to check local recycling rules rather than assuming every town is the same. What is the main message?",
      options: [
        "All towns use exactly the same recycling rules.",
        "People should ignore community guidance.",
        "A national rule is enough without checking locally.",
        "Responsible action should use local information.",
      ],
      answer: 3,
      explanation:
        "지역마다 규칙이 다를 수 있으므로 확인하고 행동하라는 글의 결론입니다.",
      difficulty: 3,
    },
  ],
  8: [
    {
      id: "l8-001",
      prompt:
        "‘성취하다’라는 뜻입니다. The team worked hard to ___ its goal. (a, 7 letters)",
      options: ["achieve", "acheive", "achive", "achievee"],
      answer: 0,
      explanation: "achieve는 ‘성취하다’이며 a로 시작하는 일곱 글자입니다.",
      difficulty: 2,
    },
    {
      id: "l8-002",
      prompt:
        "‘고대의’라는 뜻입니다. The museum displays an ___ coin from Rome. (a, 7 letters)",
      options: ["anciant", "ancient", "ancent", "ancientt"],
      answer: 1,
      explanation: "ancient는 ‘고대의’라는 뜻으로 a-n-c-i-e-n-t 철자입니다.",
      difficulty: 2,
    },
    {
      id: "l8-003",
      prompt:
        "‘접근하다’라는 뜻입니다. We watched the train ___ the station. (a, 8 letters)",
      options: ["aproach", "approch", "approach", "approache"],
      answer: 2,
      explanation:
        "approach는 장소나 대상에 ‘접근하다’라는 뜻의 여덟 글자 단어입니다.",
      difficulty: 2,
    },
    {
      id: "l8-004",
      prompt:
        "‘청중’이라는 뜻입니다. The ___ applauded after the play. (a, 8 letters)",
      options: ["audiance", "audince", "audiense", "audience"],
      answer: 3,
      explanation: "공연을 보고 박수 친 사람들인 청중은 audience로 씁니다.",
      difficulty: 1,
    },
    {
      id: "l8-005",
      prompt:
        "‘피하다’라는 뜻입니다. Wearing a helmet can help a rider ___ serious injury. (a, 5 letters)",
      options: ["avoid", "aviod", "avoide", "avoad"],
      answer: 0,
      explanation: "avoid는 ‘피하다’이며 a-v-o-i-d 다섯 글자입니다.",
      difficulty: 1,
    },
    {
      id: "l8-006",
      prompt:
        "‘행동, 태도’라는 뜻입니다. The teacher praised Mina's polite ___. (b, 8 letters)",
      options: ["behavour", "behavior", "behaivor", "behavor"],
      answer: 1,
      explanation: "예의 바른 행동을 가리키므로 behavior가 문맥에 맞습니다.",
      difficulty: 2,
    },
    {
      id: "l8-007",
      prompt:
        "‘이익, 혜택’이라는 뜻입니다. Regular exercise has a clear health ___. (b, 7 letters)",
      options: ["benifit", "benefitt", "benefit", "benifet"],
      answer: 2,
      explanation: "건강상의 이익은 benefit이며 b-e-n-e-f-i-t로 씁니다.",
      difficulty: 1,
    },
    {
      id: "l8-008",
      prompt:
        "‘도전, 어려운 일’이라는 뜻입니다. Solving the puzzle was a real ___. (c, 9 letters)",
      options: ["chalenge", "challange", "challeng", "challenge"],
      answer: 3,
      explanation: "어려운 일이라는 문맥에서 challenge가 알맞습니다.",
      difficulty: 2,
    },
    {
      id: "l8-009",
      prompt:
        "‘포함하다’라는 뜻입니다. This bottle can ___ two liters of water. (c, 7 letters)",
      options: ["contain", "contane", "contian", "containn"],
      answer: 0,
      explanation: "용량을 담는다는 뜻의 contain은 c-o-n-t-a-i-n입니다.",
      difficulty: 1,
    },
    {
      id: "l8-010",
      prompt:
        "‘기여하다’라는 뜻입니다. Every student can ___ ideas to the project. (c, 10 letters)",
      options: ["contribut", "contribute", "contribuate", "contrubute"],
      answer: 1,
      explanation:
        "프로젝트에 아이디어를 보탠다는 뜻이므로 contribute가 알맞습니다.",
      difficulty: 2,
    },
    {
      id: "l8-011",
      prompt:
        "‘용기’라는 뜻입니다. It took ___ to speak honestly in front of the class. (c, 7 letters)",
      options: ["courrage", "corage", "courage", "courige"],
      answer: 2,
      explanation: "앞에서 솔직히 말할 때 필요한 용기는 courage로 씁니다.",
      difficulty: 2,
    },
    {
      id: "l8-012",
      prompt:
        "‘호기심 많은’이라는 뜻입니다. The ___ child asked how the machine worked. (c, 7 letters)",
      options: ["currious", "curous", "curiouse", "curious"],
      answer: 3,
      explanation: "알고 싶어 질문하는 아이는 curious한 아이입니다.",
      difficulty: 1,
    },
    {
      id: "l8-013",
      prompt:
        "‘감소하다’라는 뜻입니다. The number of paper cups began to ___. (d, 8 letters)",
      options: ["decrease", "decrese", "decreace", "decreasee"],
      answer: 0,
      explanation: "수가 줄어드는 상황이므로 decrease가 알맞습니다.",
      difficulty: 2,
    },
    {
      id: "l8-014",
      prompt:
        "‘묘사하다’라는 뜻입니다. Please ___ the person you saw at the gate. (d, 8 letters)",
      options: ["discribe", "describe", "describ", "deskribe"],
      answer: 1,
      explanation: "사람의 모습을 말로 묘사하라는 문맥에서 describe를 씁니다.",
      difficulty: 2,
    },
    {
      id: "l8-015",
      prompt:
        "‘~할 자격이 있다’라는 뜻입니다. After years of work, she ___ a break. (d, 8 letters)",
      options: ["deservs", "deservess", "deserves", "desarves"],
      answer: 2,
      explanation:
        "오랜 노력 뒤 휴식을 받을 자격이 있다는 문맥에 deserves가 알맞습니다.",
      difficulty: 2,
    },
    {
      id: "l8-016",
      prompt:
        "‘발견하다’라는 뜻입니다. Scientists hope to ___ a new cave. (d, 8 letters)",
      options: ["discouver", "discovar", "discoverr", "discover"],
      answer: 3,
      explanation: "새 동굴을 발견한다는 뜻으로 discover가 문맥에 맞습니다.",
      difficulty: 1,
    },
    {
      id: "l8-017",
      prompt:
        "‘영향, 결과’라는 뜻입니다. The lack of sleep had a negative ___ on his memory. (e, 6 letters)",
      options: ["effect", "effact", "efect", "effectt"],
      answer: 0,
      explanation: "잠이 부족해 기억에 미친 부정적인 결과는 effect입니다.",
      difficulty: 2,
    },
    {
      id: "l8-018",
      prompt:
        "‘노력’이라는 뜻입니다. Her ___ was rewarded with a high score. (e, 6 letters)",
      options: ["efort", "effort", "effert", "efforts"],
      answer: 1,
      explanation: "높은 점수로 보상받은 노력은 effort입니다.",
      difficulty: 1,
    },
    {
      id: "l8-019",
      prompt:
        "‘환경’이라는 뜻입니다. We should protect the natural ___. (e, 11 letters)",
      options: ["enviroment", "envirenment", "environment", "environmentt"],
      answer: 2,
      explanation: "자연환경은 environment로 쓰며 n이 포함됩니다.",
      difficulty: 2,
    },
    {
      id: "l8-020",
      prompt:
        "‘필수적인’이라는 뜻입니다. Clean water is ___ for life. (e, 9 letters)",
      options: ["essencial", "esential", "essentiale", "essential"],
      answer: 3,
      explanation: "생명에 꼭 필요한 것은 essential입니다.",
      difficulty: 1,
    },
    {
      id: "l8-021",
      prompt:
        "‘증거’라는 뜻입니다. The footprints were ___ that someone had entered. (e, 8 letters)",
      options: ["evidence", "evidance", "evidense", "evidencee"],
      answer: 0,
      explanation: "발자국은 누군가 들어왔다는 증거이므로 evidence가 맞습니다.",
      difficulty: 2,
    },
    {
      id: "l8-022",
      prompt:
        "‘익숙한’이라는 뜻입니다. The street looked ___ after I visited it many times. (f, 8 letters)",
      options: ["familar", "familiar", "familliar", "familier"],
      answer: 1,
      explanation: "여러 번 보아 익숙하다는 뜻은 familiar입니다.",
      difficulty: 1,
    },
    {
      id: "l8-023",
      prompt:
        "‘특징’이라는 뜻입니다. A useful ___ of this app is its voice search. (f, 7 letters)",
      options: ["feeture", "featur", "feature", "feacher"],
      answer: 2,
      explanation: "앱의 유용한 특징은 feature라고 합니다.",
      difficulty: 2,
    },
    {
      id: "l8-024",
      prompt:
        "‘관대한’이라는 뜻입니다. The ___ donor gave books to every class. (g, 8 letters)",
      options: ["genarous", "generouse", "generus", "generous"],
      answer: 3,
      explanation: "많이 나누어 주는 사람은 generous하다고 표현합니다.",
      difficulty: 2,
    },
    {
      id: "l8-025",
      prompt:
        "‘점진적인, 서서히 진행되는’이라는 뜻입니다. The ___ change in temperature was easy to miss. (g, 7 letters)",
      options: ["gradual", "gradualy", "graudal", "graduel"],
      answer: 0,
      explanation: "서서히 일어나는 변화는 gradual입니다.",
      difficulty: 2,
    },
    {
      id: "l8-026",
      prompt:
        "‘확인하다, 식별하다’라는 뜻입니다. Can you ___ the bird in this photo? (i, 8 letters)",
      options: ["identfy", "identify", "identifiy", "idantify"],
      answer: 1,
      explanation: "사진 속 새가 무엇인지 식별한다는 뜻의 identify입니다.",
      difficulty: 2,
    },
    {
      id: "l8-027",
      prompt:
        "‘상상하다’라는 뜻입니다. Try to ___ life on another planet. (i, 7 letters)",
      options: ["imagin", "imajine", "imagine", "imaggine"],
      answer: 2,
      explanation: "다른 행성의 삶을 상상하는 것이므로 imagine입니다.",
      difficulty: 1,
    },
    {
      id: "l8-028",
      prompt:
        "‘향상시키다’라는 뜻입니다. Reading daily can ___ your vocabulary. (i, 7 letters)",
      options: ["improv", "improove", "impruve", "improve"],
      answer: 3,
      explanation: "어휘를 향상시키다는 improve로 씁니다.",
      difficulty: 1,
    },
    {
      id: "l8-029",
      prompt:
        "‘포함하다’라는 뜻입니다. The price does not ___ delivery. (i, 7 letters)",
      options: ["include", "inclood", "includ", "incluede"],
      answer: 0,
      explanation: "가격에 배달비가 포함된다는 뜻이므로 include가 알맞습니다.",
      difficulty: 1,
    },
    {
      id: "l8-030",
      prompt:
        "‘영향을 미치다’라는 뜻입니다. Friends can ___ the choices we make. (i, 9 letters)",
      options: ["influnce", "influence", "influense", "influance"],
      answer: 1,
      explanation:
        "친구가 우리의 선택에 영향을 미칠 수 있다는 문맥에서 influence가 알맞습니다.",
      difficulty: 2,
    },
    {
      id: "l8-031",
      prompt:
        "‘대신에’라는 뜻입니다. We walked ___ of taking a taxi. (i, 7 letters)",
      options: ["insted", "insteed", "instead", "instade"],
      answer: 2,
      explanation: "택시를 타는 대신 걸었다는 뜻에서 instead가 맞습니다.",
      difficulty: 1,
    },
    {
      id: "l8-032",
      prompt:
        "‘여행’이라는 뜻입니다. The family planned a long ___ by train. (j, 7 letters)",
      options: ["journy", "jurney", "journei", "journey"],
      answer: 3,
      explanation: "기차로 하는 긴 여행은 journey입니다.",
      difficulty: 1,
    },
    {
      id: "l8-033",
      prompt:
        "‘지식’이라는 뜻입니다. Experience gave the nurse useful ___. (k, 9 letters)",
      options: ["knowledge", "knowlege", "knowladge", "knowledg"],
      answer: 0,
      explanation: "경험으로 얻은 지식은 knowledge로 씁니다.",
      difficulty: 2,
    },
    {
      id: "l8-034",
      prompt:
        "‘지역의’라는 뜻입니다. We buy vegetables from a ___ farm. (l, 5 letters)",
      options: ["locel", "local", "loacl", "locall"],
      answer: 1,
      explanation: "가까운 지역 농장은 local farm이라고 합니다.",
      difficulty: 1,
    },
    {
      id: "l8-035",
      prompt:
        "‘방법’이라는 뜻입니다. The scientist explained a safe ___ for testing water. (m, 6 letters)",
      options: ["methud", "metod", "method", "methood"],
      answer: 2,
      explanation: "시험을 진행하는 방법은 method입니다.",
      difficulty: 2,
    },
    {
      id: "l8-036",
      prompt:
        "‘알아차리다’라는 뜻입니다. Did you ___ the small sign by the door? (n, 6 letters)",
      options: ["notise", "noitce", "notic", "notice"],
      answer: 3,
      explanation: "작은 표지를 알아차렸는지 묻는 문맥에서 notice입니다.",
      difficulty: 1,
    },
    {
      id: "l8-037",
      prompt:
        "‘평범한’이라는 뜻입니다. It was an ___ day until the lights went out. (o, 8 letters)",
      options: ["ordinary", "ordinery", "ordnary", "ordinaryy"],
      answer: 0,
      explanation: "특별하지 않은 평범한 날은 ordinary day입니다.",
      difficulty: 1,
    },
    {
      id: "l8-038",
      prompt:
        "‘설득하다’라는 뜻입니다. The poster tries to ___ people to save energy. (p, 8 letters)",
      options: ["perswade", "persuade", "persuad", "persuede"],
      answer: 1,
      explanation: "사람들이 에너지를 아끼도록 설득한다는 뜻은 persuade입니다.",
      difficulty: 2,
    },
    {
      id: "l8-039",
      prompt:
        "‘예측하다’라는 뜻입니다. Dark clouds helped us ___ rain. (p, 7 letters)",
      options: ["predicte", "predikt", "predict", "predeict"],
      answer: 2,
      explanation: "먹구름을 보고 비를 예측한다는 뜻의 predict입니다.",
      difficulty: 1,
    },
    {
      id: "l8-040",
      prompt:
        "‘선호하다’라는 뜻입니다. I ___ tea to coffee in the morning. (p, 6 letters)",
      options: ["preffer", "prrefer", "prefur", "prefer"],
      answer: 3,
      explanation: "차를 커피보다 더 좋아한다는 뜻이므로 prefer가 알맞습니다.",
      difficulty: 1,
    },
    {
      id: "l8-041",
      prompt:
        "‘막다, 예방하다’라는 뜻입니다. A seat belt can ___ serious injuries. (p, 7 letters)",
      options: ["prevent", "prevet", "prevant", "preventt"],
      answer: 0,
      explanation: "안전벨트가 부상을 예방한다는 뜻의 prevent입니다.",
      difficulty: 1,
    },
    {
      id: "l8-042",
      prompt:
        "‘과정’이라는 뜻입니다. Photosynthesis is a natural ___ in plants. (p, 7 letters)",
      options: ["proccess", "process", "proces", "prosess"],
      answer: 1,
      explanation: "식물에서 일어나는 자연스러운 과정은 process입니다.",
      difficulty: 2,
    },
    {
      id: "l8-043",
      prompt:
        "‘보호하다’라는 뜻입니다. Laws ___ endangered animals. (p, 7 letters)",
      options: ["protek", "proctect", "protect", "protext"],
      answer: 2,
      explanation: "법이 멸종 위기 동물을 보호한다는 뜻의 protect입니다.",
      difficulty: 1,
    },
    {
      id: "l8-044",
      prompt:
        "‘깨닫다’라는 뜻입니다. I did not ___ how late it was. (r, 7 letters)",
      options: ["reallize", "realizee", "reilize", "realize"],
      answer: 3,
      explanation: "시간이 늦었다는 것을 깨닫다는 realize입니다.",
      difficulty: 1,
    },
    {
      id: "l8-045",
      prompt:
        "‘최근의’라는 뜻입니다. Have you read the ___ report on air quality? (r, 6 letters)",
      options: ["recent", "recient", "rescent", "recentt"],
      answer: 0,
      explanation: "최근 보고서는 recent report라고 합니다.",
      difficulty: 1,
    },
    {
      id: "l8-046",
      prompt:
        "‘줄이다’라는 뜻입니다. Turning off lights can ___ electricity use. (r, 6 letters)",
      options: ["reduc", "reduce", "reudce", "reduse"],
      answer: 1,
      explanation: "전기 사용을 줄인다는 뜻에서 reduce가 알맞습니다.",
      difficulty: 1,
    },
    {
      id: "l8-047",
      prompt:
        "여기서는 ‘빛을 반사하다’라는 뜻입니다. The lake began to ___ the orange sunset. (r, 7 letters)",
      options: ["refelct", "reflekt", "reflect", "reflectt"],
      answer: 2,
      explanation: "호수가 노을빛을 반사한다는 문맥에서 reflect입니다.",
      difficulty: 2,
    },
    {
      id: "l8-048",
      prompt:
        "‘요구하다’라는 뜻입니다. This activity will ___ careful planning. (r, 7 letters)",
      options: ["requier", "requre", "requaire", "require"],
      answer: 3,
      explanation: "활동이 계획을 요구한다는 뜻의 require입니다.",
      difficulty: 2,
    },
    {
      id: "l8-049",
      prompt:
        "‘응답하다’라는 뜻입니다. Please ___ to the message by Friday. (r, 7 letters)",
      options: ["respond", "responed", "responde", "resopnd"],
      answer: 0,
      explanation: "메시지에 응답하라는 뜻의 respond입니다.",
      difficulty: 1,
    },
    {
      id: "l8-050",
      prompt:
        "‘결과’라는 뜻입니다. The experiment produced an unexpected ___. (r, 6 letters)",
      options: ["resulte", "result", "reslut", "reuslt"],
      answer: 1,
      explanation: "실험이 만들어 낸 결과는 result입니다.",
      difficulty: 1,
    },
    {
      id: "l8-051",
      prompt:
        "‘비슷한’이라는 뜻입니다. The two designs are very ___. (s, 7 letters)",
      options: ["similer", "simillar", "similar", "simmilar"],
      answer: 2,
      explanation: "두 디자인이 비슷하다는 뜻은 similar입니다.",
      difficulty: 1,
    },
    {
      id: "l8-052",
      prompt:
        "‘해결책’이라는 뜻입니다. We need a practical ___ to the traffic problem. (s, 8 letters)",
      options: ["solusion", "solutoin", "soloution", "solution"],
      answer: 3,
      explanation: "문제에 대한 실용적인 해결책은 solution입니다.",
      difficulty: 2,
    },
    {
      id: "l8-053",
      prompt:
        "‘지지하다, 지원하다’라는 뜻입니다. Her family will ___ her decision. (s, 7 letters)",
      options: ["support", "suport", "suppport", "suppurt"],
      answer: 0,
      explanation: "가족이 결정을 지지한다는 뜻의 support입니다.",
      difficulty: 1,
    },
    {
      id: "l8-054",
      prompt:
        "‘살아남다’라는 뜻입니다. Some plants ___ in very dry soil. (s, 7 letters)",
      options: ["survieve", "survive", "survve", "servive"],
      answer: 1,
      explanation: "건조한 흙에서도 살아남는다는 뜻의 survive입니다.",
      difficulty: 2,
    },
    {
      id: "l8-055",
      prompt:
        "‘전통’이라는 뜻입니다. The festival is an important local ___. (t, 9 letters)",
      options: ["tradtion", "tradision", "tradition", "traditoin"],
      answer: 2,
      explanation: "지역의 중요한 전통은 tradition으로 씁니다.",
      difficulty: 1,
    },
    {
      id: "l8-056",
      prompt:
        "‘가치 있는’이라는 뜻입니다. The old diary is ___ to the family. (v, 8 letters)",
      options: ["valuble", "valuabel", "valiuable", "valuable"],
      answer: 3,
      explanation: "가족에게 가치 있는 물건은 valuable하다고 합니다.",
      difficulty: 1,
    },
    {
      id: "l8-057",
      prompt:
        "‘자원봉사하다’라는 뜻입니다. Many students ___ at the animal shelter. (v, 9 letters)",
      options: ["volunteer", "voluntier", "volunter", "volonteer"],
      answer: 0,
      explanation: "동물 보호소에서 자원봉사한다는 뜻의 volunteer입니다.",
      difficulty: 2,
    },
    {
      id: "l8-058",
      prompt:
        "‘~인지 아닌지’라는 뜻입니다. I do not know ___ the store is open. (w, 7 letters)",
      options: ["wether", "whether", "wheather", "wheter"],
      answer: 1,
      explanation: "가게가 열려 있는지 아닌지를 나타내는 whether입니다.",
      difficulty: 2,
    },
    {
      id: "l8-059",
      prompt:
        "‘명백한’이라는 뜻입니다. The mistake was ___ from the first line. (o, 7 letters)",
      options: ["obivous", "obvius", "obvious", "obviouse"],
      answer: 2,
      explanation: "첫 줄부터 분명한 실수라는 뜻이므로 obvious가 알맞습니다.",
      difficulty: 1,
    },
    {
      id: "l8-060",
      prompt:
        "‘정확한’이라는 뜻입니다. Please give an ___ address for delivery. (a, 8 letters)",
      options: ["acurate", "accurite", "accurrate", "accurate"],
      answer: 3,
      explanation: "배달에 정확한 주소가 필요하므로 accurate입니다.",
      difficulty: 2,
    },
    {
      id: "l8-061",
      prompt:
        "‘참석하다’라는 뜻입니다. Will you ___ the meeting tomorrow? (a, 6 letters)",
      options: ["attend", "atend", "attaned", "attande"],
      answer: 0,
      explanation: "회의에 참석하다는 attend로 씁니다.",
      difficulty: 1,
    },
    {
      id: "l8-062",
      prompt:
        "‘균형’이라는 뜻입니다. A gymnast needs good ___ to stay on the beam. (b, 7 letters)",
      options: ["balence", "balance", "ballance", "balanse"],
      answer: 1,
      explanation: "평균대에서 넘어지지 않게 하는 균형은 balance입니다.",
      difficulty: 1,
    },
    {
      id: "l8-063",
      prompt:
        "‘비교하다’라는 뜻입니다. Let us ___ the two maps carefully. (c, 7 letters)",
      options: ["comapre", "compar", "compare", "compaire"],
      answer: 2,
      explanation: "두 지도를 비교하자는 문맥에서 compare를 씁니다.",
      difficulty: 1,
    },
    {
      id: "l8-064",
      prompt:
        "다음 문맥에서 ‘집중력’을 뜻하는 단어를 고르세요. Noise can reduce your ___ while you study. (c, 13 letters)",
      options: [
        "concentrate",
        "concentratoin",
        "consentration",
        "concentration",
      ],
      answer: 3,
      explanation:
        "공부할 때 소음이 줄이는 것은 집중력이며, c로 시작하는 13글자 단어 concentration이 문맥에 맞습니다.",
      difficulty: 3,
    },
    {
      id: "l8-065",
      prompt:
        "다음 문맥에서 ‘편리함’을 뜻하는 단어를 고르세요. Many customers choose delivery for the ___ it offers. (c, 11 letters)",
      options: ["convenience", "convinience", "conveniance", "convenient"],
      answer: 0,
      explanation:
        "배달을 선택하게 하는 편리함은 c로 시작하는 11글자 단어 convenience입니다.",
      difficulty: 3,
    },
    {
      id: "l8-066",
      prompt:
        "‘창의적인’이라는 뜻입니다. The class designed a ___ way to reuse boxes. (c, 8 letters)",
      options: ["creaitve", "creative", "creatve", "creetive"],
      answer: 1,
      explanation:
        "새로운 방법을 만들어 내는 창의적인이라는 뜻의 creative입니다.",
      difficulty: 1,
    },
    {
      id: "l8-067",
      prompt:
        "‘세부 사항’이라는 뜻입니다. Check every ___ before submitting the form. (d, 6 letters)",
      options: ["detial", "detaile", "detail", "deetail"],
      answer: 2,
      explanation: "양식의 각각의 세부 사항은 detail입니다.",
      difficulty: 1,
    },
    {
      id: "l8-068",
      prompt:
        "‘격려하다’라는 뜻입니다. Coaches ___ players after a difficult loss. (e, 9 letters)",
      options: ["encourge", "encurage", "encouragee", "encourage"],
      answer: 3,
      explanation: "어려운 패배 뒤 선수들을 격려한다는 뜻의 encourage입니다.",
      difficulty: 2,
    },
    {
      id: "l8-069",
      prompt:
        "‘변명, 핑계’라는 뜻입니다. Being tired is not an ___ for being rude. (e, 6 letters)",
      options: ["excuse", "excusee", "excuce", "excusse"],
      answer: 0,
      explanation: "무례함을 정당화하지 못하는 핑계는 excuse입니다.",
      difficulty: 1,
    },
    {
      id: "l8-070",
      prompt:
        "‘유연한’이라는 뜻입니다. A ___ schedule lets workers change their hours. (f, 8 letters)",
      options: ["flexable", "flexible", "flexibel", "flexibble"],
      answer: 1,
      explanation: "시간을 바꿀 수 있는 유연한 일정은 flexible schedule입니다.",
      difficulty: 2,
    },
    {
      id: "l8-071",
      prompt:
        "‘해로운’이라는 뜻입니다. Too much smoke is ___ to the lungs. (h, 7 letters)",
      options: ["harmfull", "harmeful", "harmful", "harmfel"],
      answer: 2,
      explanation: "연기에 해롭다는 뜻이므로 harmful이 맞습니다.",
      difficulty: 1,
    },
    {
      id: "l8-072",
      prompt:
        "‘주저하다’라는 뜻입니다. Do not ___ to ask for help. (h, 8 letters)",
      options: ["hesate", "hestitate", "hesitait", "hesitate"],
      answer: 3,
      explanation:
        "도움을 요청하는 것을 주저하지 말라는 문맥에서 hesitate입니다.",
      difficulty: 2,
    },
    {
      id: "l8-073",
      prompt:
        "다음 문맥에서 ‘독립성’을 뜻하는 단어를 고르세요. Learning to manage a budget can help young people develop ___. (i, 12 letters)",
      options: ["independence", "independent", "independance", "independense"],
      answer: 0,
      explanation:
        "예산을 관리하며 기를 수 있는 독립성은 i로 시작하는 12글자 단어 independence입니다.",
      difficulty: 3,
    },
    {
      id: "l8-074",
      prompt:
        "‘포함하다, 관련시키다’라는 뜻입니다. The survey will ___ 500 teenagers. (i, 7 letters)",
      options: ["involeve", "involve", "invole", "envolve"],
      answer: 1,
      explanation: "설문에 500명이 참여하게 한다는 뜻의 involve입니다.",
      difficulty: 2,
    },
    {
      id: "l8-075",
      prompt:
        "‘유지하다’라는 뜻입니다. We must ___ the machine regularly. (m, 8 letters)",
      options: ["maintane", "maintian", "maintain", "mainten"],
      answer: 2,
      explanation: "기계를 정기적으로 유지·관리한다는 뜻은 maintain입니다.",
      difficulty: 2,
    },
    {
      id: "l8-076",
      prompt:
        "‘관찰하다’라는 뜻입니다. Scientists ___ the birds without touching them. (o, 7 letters)",
      options: ["obserb", "observ", "obsurve", "observe"],
      answer: 3,
      explanation: "새를 건드리지 않고 관찰한다는 뜻의 observe입니다.",
      difficulty: 1,
    },
    {
      id: "l8-077",
      prompt:
        "‘긍정적인’이라는 뜻입니다. She kept a ___ attitude after the setback. (p, 8 letters)",
      options: ["positive", "posative", "positve", "possitive"],
      answer: 0,
      explanation:
        "어려움 뒤에도 긍정적인 태도를 유지했다는 뜻의 positive입니다.",
      difficulty: 1,
    },
    {
      id: "l8-078",
      prompt:
        "‘믿을 만한’이라는 뜻입니다. Use a ___ source when checking the fact. (r, 8 letters)",
      options: ["reliabel", "reliable", "relyable", "reliablee"],
      answer: 1,
      explanation: "사실 확인에는 믿을 만한 출처가 필요하므로 reliable입니다.",
      difficulty: 2,
    },
    {
      id: "l8-079",
      prompt:
        "다음 문맥에서 ‘책임’을 뜻하는 단어를 고르세요. Taking care of the classroom plants is our shared ___. (r, 14 letters)",
      options: [
        "responsibly",
        "responsability",
        "responsibility",
        "responsiblity",
      ],
      answer: 2,
      explanation:
        "교실 식물을 돌보는 공동의 책임은 r로 시작하는 14글자 단어 responsibility입니다.",
      difficulty: 3,
    },
    {
      id: "l8-080",
      prompt:
        "‘분리된, 별개의’라는 뜻입니다. Keep raw meat and vegetables in ___ containers. (s, 8 letters)",
      options: ["seperate", "seperrate", "separite", "separate"],
      answer: 3,
      explanation: "날고기와 채소를 따로 보관하라는 뜻의 separate입니다.",
      difficulty: 1,
    },
  ],
  9: [
    {
      id: "l9-001",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n민호는 쉬는 시간에 지우개를 찾았습니다. 책상 아래를 살펴보니 지우개가 굴러가 있었습니다.\n민호는 지우개를 어디에서 찾았나요?",
      options: ["책상 아래", "운동장 한가운데", "도서관 책장", "급식실 식탁"],
      answer: 0,
      explanation:
        "글에서 민호가 책상 아래를 살펴보니 지우개가 있었다고 했습니다.",
      difficulty: 1,
    },
    {
      id: "l9-002",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n유나는 교실 창가에서 바질 화분을 길렀습니다. 매일 물을 주고 햇빛을 받게 하자 새 잎이 나왔습니다.\n바질에 새 잎이 난 까닭은 무엇인가요?",
      options: [
        "화분을 어두운 상자에 넣어서",
        "물을 주고 햇빛을 받게 해서",
        "잎을 모두 떼어 내서",
        "물을 한 번도 주지 않아서",
      ],
      answer: 1,
      explanation:
        "매일 물을 주고 햇빛을 받게 하자 새 잎이 났다는 내용이 근거입니다.",
      difficulty: 2,
    },
    {
      id: "l9-003",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n준호는 도서관에서 빌린 책 표지에 ‘금요일까지 반납’이라고 적힌 쪽지를 붙였습니다.\n준호는 언제까지 책을 돌려주어야 하나요?",
      options: ["월요일", "다음 달", "금요일", "방학 마지막 날"],
      answer: 2,
      explanation: "쪽지에 금요일까지 반납이라고 적혀 있습니다.",
      difficulty: 1,
    },
    {
      id: "l9-004",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n소라는 하늘에 먹구름이 낀 것을 보고 우산을 챙겼습니다. 곧 빗방울이 떨어지기 시작했습니다.\n소라가 우산을 챙긴 까닭은 무엇인가요?",
      options: [
        "눈사람을 만들려고",
        "햇빛을 가리려고",
        "바람에 연을 날리려고",
        "비가 올 것 같아서",
      ],
      answer: 3,
      explanation: "먹구름을 보고 비가 올 것 같아 우산을 챙겼습니다.",
      difficulty: 1,
    },
    {
      id: "l9-005",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n우리 반은 교실에서 분리수거를 했습니다. 파란 상자에는 공책을 다 쓴 뒤 남은 종이를 넣었습니다.\n파란 상자에 넣은 것은 무엇인가요?",
      options: ["종이", "유리병", "음식물", "알루미늄 캔"],
      answer: 0,
      explanation: "파란 상자에는 남은 종이를 넣었다고 글에 직접 나옵니다.",
      difficulty: 1,
    },
    {
      id: "l9-006",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n현우가 대문을 열자 강아지 보리가 꼬리를 흔들며 달려왔습니다. 보리는 현우가 돌아오기를 기다리고 있었습니다.\n보리가 한 행동은 무엇인가요?",
      options: [
        "나무 위로 날아갔다",
        "꼬리를 흔들며 달려왔다",
        "물속으로 숨었다",
        "책을 읽었다",
      ],
      answer: 1,
      explanation: "대문이 열리자 보리가 꼬리를 흔들며 달려왔다고 했습니다.",
      difficulty: 1,
    },
    {
      id: "l9-007",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n태오는 축구 연습 날 친구들보다 20분 일찍 운동장에 도착했습니다. 공과 물병을 준비하려고 했기 때문입니다.\n태오가 일찍 도착한 까닭은 무엇인가요?",
      options: [
        "친구를 놀리려고",
        "수업을 빠지려고",
        "공과 물병을 준비하려고",
        "비를 피하려고",
      ],
      answer: 2,
      explanation:
        "공과 물병을 준비하려고 일찍 왔다고 마지막 문장에서 설명합니다.",
      difficulty: 2,
    },
    {
      id: "l9-008",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n빵집에서 고소한 냄새가 났습니다. 할머니는 진열대에서 따뜻한 식빵 한 봉지를 골랐습니다.\n할머니가 고른 것은 무엇인가요?",
      options: ["사과 주스", "연필 한 자루", "운동화", "식빵"],
      answer: 3,
      explanation: "할머니가 고른 것은 따뜻한 식빵 한 봉지입니다.",
      difficulty: 1,
    },
    {
      id: "l9-009",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n밤새 눈이 많이 내려 학교는 오늘 온라인 수업을 하기로 했습니다. 지수는 집에서 태블릿을 켰습니다.\n지수가 집에서 수업한 까닭은 무엇인가요?",
      options: [
        "눈이 많이 내려 온라인 수업을 해서",
        "태블릿을 새로 사서",
        "친구를 만나러 가서",
        "학교 운동회가 있어서",
      ],
      answer: 0,
      explanation: "눈이 많이 와서 학교가 온라인 수업을 하기로 했습니다.",
      difficulty: 2,
    },
    {
      id: "l9-010",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n새 둥지를 발견한 다현이는 멀리서 쌍안경으로 살펴보았습니다. 둥지에 손을 대면 새가 놀랄 수 있기 때문입니다.\n다현이의 관찰 방법으로 알맞은 것은 무엇인가요?",
      options: [
        "둥지를 손으로 만진다",
        "거리를 두고 쌍안경으로 본다",
        "큰 소리로 새를 부른다",
        "알을 집어 옮긴다",
      ],
      answer: 1,
      explanation:
        "새를 놀라게 하지 않으려고 거리를 두고 쌍안경으로 관찰했습니다.",
      difficulty: 2,
    },
    {
      id: "l9-011",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n점심시간에 지수는 사과를 두 개 가져왔습니다. 나래가 과일을 못 가져오자 지수는 사과 하나를 나누어 주었습니다.\n지수는 나래에게 무엇을 했나요?",
      options: [
        "나래의 가방을 숨겼다",
        "점심을 혼자 먹었다",
        "사과 하나를 나누어 주었다",
        "사과를 모두 버렸다",
      ],
      answer: 2,
      explanation: "사과 두 개 중 하나를 나래에게 나누어 주었습니다.",
      difficulty: 1,
    },
    {
      id: "l9-012",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n버스 정류장에서 서준은 교통카드를 잃어버린 것을 알았습니다. 아빠가 여분 카드를 빌려 주어 버스를 탈 수 있었습니다.\n서준은 어떻게 버스를 탔나요?",
      options: [
        "운동화를 팔아서",
        "걸어서 버스 위에 올라가서",
        "기사님에게 책을 빌려서",
        "아빠에게 여분 카드를 빌려서",
      ],
      answer: 3,
      explanation:
        "아빠가 여분 카드를 빌려 주었기 때문에 그 카드로 버스를 탔습니다.",
      difficulty: 2,
    },
    {
      id: "l9-013",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n박물관 공룡 화석 앞에는 ‘눈으로만 관찰하세요’라는 안내문이 있었습니다. 아이들은 손을 뒤로 모으고 화석을 보았습니다.\n아이들이 지킨 약속은 무엇인가요?",
      options: [
        "화석을 만지지 않기",
        "화석을 집에 가져가기",
        "전시실에서 뛰기",
        "안내문을 떼기",
      ],
      answer: 0,
      explanation: "눈으로만 보라는 안내는 화석을 만지지 말라는 뜻입니다.",
      difficulty: 1,
    },
    {
      id: "l9-014",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n비가 그친 뒤 하늘에 여러 색의 무지개가 나타났습니다. 민서는 창문을 열고 무지개를 바라보았습니다.\n무지개는 언제 나타났나요?",
      options: [
        "비가 오기 전날 밤",
        "비가 그친 뒤",
        "눈이 내리는 동안",
        "해가 뜨기 전 새벽",
      ],
      answer: 1,
      explanation: "첫 문장에서 비가 그친 뒤 무지개가 나타났다고 했습니다.",
      difficulty: 1,
    },
    {
      id: "l9-015",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n도서관에서 책을 읽던 아이들은 낮은 목소리로 이야기했습니다. 옆자리 사람의 독서를 방해하지 않기 위해서였습니다.\n아이들이 작은 목소리로 말한 까닭은 무엇인가요?",
      options: [
        "운동장에서 달리려고",
        "책을 크게 읽어 주려고",
        "다른 사람의 독서를 방해하지 않으려고",
        "간식을 숨기려고",
      ],
      answer: 2,
      explanation:
        "다른 사람의 독서를 방해하지 않으려고 낮은 목소리를 냈습니다.",
      difficulty: 2,
    },
    {
      id: "l9-016",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n날씨 기록장에 월요일은 12도, 화요일은 18도라고 적었습니다.\n월요일과 비교할 때 화요일 날씨는 어땠나요?",
      options: ["더 추웠다", "눈이 내렸다", "온도가 같았다", "더 따뜻했다"],
      answer: 3,
      explanation: "화요일 18도가 월요일 12도보다 높으므로 더 따뜻합니다.",
      difficulty: 2,
    },
    {
      id: "l9-017",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n교실에서 기르는 햄스터 나루는 점심 뒤 당근 조각을 먹었습니다. 민서는 먹이를 먹은 시간을 기록장에 적었습니다.\n나루가 먹은 것은 무엇인가요?",
      options: ["당근 조각", "사과 한 봉지", "해바라기 꽃", "책상 다리"],
      answer: 0,
      explanation: "나루가 점심 뒤 당근 조각을 먹었다고 직접 나옵니다.",
      difficulty: 1,
    },
    {
      id: "l9-018",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n수빈은 강낭콩을 창가에 놓고 흙이 마를 때마다 물을 주었습니다. 며칠 뒤 초록 싹이 올라왔습니다.\n강낭콩이 자라는 데 도움이 된 행동은 무엇인가요?",
      options: [
        "화분을 매일 뒤집은 것",
        "창가에 놓고 물을 준 것",
        "흙을 모두 치운 것",
        "싹이 나기 전에 잎을 자른 것",
      ],
      answer: 1,
      explanation: "창가에 놓고 흙이 마르면 물을 준 돌봄 행동이 글에 나옵니다.",
      difficulty: 2,
    },
    {
      id: "l9-019",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n하천 주변에 과자 봉지가 많이 떨어져 있었습니다. 학생들은 장갑을 끼고 쓰레기를 주워 분리수거함에 넣었습니다.\n학생들이 한 일의 결과는 무엇인가요?",
      options: [
        "쓰레기가 더 많아졌다",
        "물이 얼어붙었다",
        "하천 주변이 깨끗해졌다",
        "학생들이 모두 잠들었다",
      ],
      answer: 2,
      explanation: "쓰레기를 주워 분리수거했으므로 하천 주변이 깨끗해졌습니다.",
      difficulty: 2,
    },
    {
      id: "l9-020",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n예린은 비 예보를 듣고 우산을 챙겼습니다. 학교에서는 친구에게 빌린 책을 반납하고, 점심에는 빵을 동생과 나누었습니다.\n예린의 하루를 바르게 설명한 것은 무엇인가요?",
      options: [
        "눈이 와서 학교에 가지 않았다",
        "책을 잃어버리고 빵을 혼자 먹었다",
        "우산을 빌려주고 운동장에서만 놀았다",
        "우산을 챙긴 뒤 책을 반납하고 빵을 나누었다",
      ],
      answer: 3,
      explanation: "글에 나온 세 사건을 순서대로 묶은 선택지입니다.",
      difficulty: 3,
    },
    {
      id: "l9-021",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n서준은 급식실에 수저를 가져가지 않았습니다. 선생님은 여분의 수저를 건네주셨고 서준은 고맙다고 말했습니다.\n선생님은 무엇을 주셨나요?",
      options: ["여분의 수저", "새 운동화", "우산 한 개", "도서관 책"],
      answer: 0,
      explanation: "선생님이 여분의 수저를 건네주셨다고 했습니다.",
      difficulty: 1,
    },
    {
      id: "l9-022",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n다미는 동네 지도를 보며 빨간 선을 따라 걸었습니다. 빨간 선은 놀이터에서 연못까지 이어져 있었습니다.\n다미가 도착한 곳은 어디인가요?",
      options: ["학교 교무실", "연못", "기차역", "빵집 지붕"],
      answer: 1,
      explanation:
        "빨간 선이 놀이터에서 연못까지 이어져 있어 연못에 도착합니다.",
      difficulty: 1,
    },
    {
      id: "l9-023",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n종이 울리기 전에는 아이들이 책상을 정리했습니다. 종이 울린 뒤 모두 교실 앞에 줄을 섰습니다.\n아이들이 줄을 선 때는 언제인가요?",
      options: [
        "책상을 정리하기 전",
        "점심을 먹기 전날",
        "종이 울린 뒤",
        "수업이 끝나기 한 달 전",
      ],
      answer: 2,
      explanation: "글에서 종이 울린 뒤 줄을 섰다고 했습니다.",
      difficulty: 2,
    },
    {
      id: "l9-024",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n하늘이는 매일 책을 20쪽씩 읽었습니다. 사흘 동안 읽은 쪽수를 더해 보았습니다.\n하늘이가 사흘 동안 읽은 책은 모두 몇 쪽인가요?",
      options: ["40쪽", "23쪽", "80쪽", "60쪽"],
      answer: 3,
      explanation: "하루 20쪽씩 사흘이므로 20+20+20=60쪽입니다.",
      difficulty: 2,
    },
    {
      id: "l9-025",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n공원에서 강아지를 발견한 나래는 목걸이에 적힌 ‘초롱’이라는 이름을 읽었습니다. 잠시 뒤 주인이 왔습니다.\n강아지의 이름은 무엇인가요?",
      options: ["초롱", "나래", "주인", "공원"],
      answer: 0,
      explanation: "강아지 목걸이에 초롱이라고 적혀 있었습니다.",
      difficulty: 1,
    },
    {
      id: "l9-026",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n과학 시간에 아이들은 비가 온 뒤 운동장에 고인 물의 깊이를 재었습니다. 오늘 기록은 5밀리미터였습니다.\n아이들이 잰 것은 무엇인가요?",
      options: ["바람의 방향", "고인 물의 깊이", "구름의 색", "운동장의 넓이"],
      answer: 1,
      explanation: "운동장에 고인 물의 깊이를 재었다고 직접 나옵니다.",
      difficulty: 1,
    },
    {
      id: "l9-027",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n도서관 책갈피에는 ‘다음 주 화요일까지 반납’이라고 쓰여 있었습니다. 오늘은 목요일입니다.\n책을 반납해야 하는 날은 언제인가요?",
      options: [
        "오늘 금요일",
        "지난주 월요일",
        "다음 주 화요일",
        "다음 달 토요일",
      ],
      answer: 2,
      explanation: "책갈피에 다음 주 화요일까지라고 적혀 있습니다.",
      difficulty: 1,
    },
    {
      id: "l9-028",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n시장에는 큰 사과 바구니와 작은 바구니가 있었습니다. 민재는 가족 네 명이 먹도록 큰 바구니를 골랐습니다.\n민재가 큰 바구니를 고른 까닭은 무엇인가요?",
      options: [
        "바구니 색이 파래서",
        "사과를 하나도 먹지 않아서",
        "시장에 비가 와서",
        "가족 네 명이 먹을 만큼 필요해서",
      ],
      answer: 3,
      explanation: "가족 네 명이 먹을 만큼의 사과가 필요했기 때문입니다.",
      difficulty: 2,
    },
    {
      id: "l9-029",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n환경 동아리에서는 페트병을 버리기 전에 물로 헹구고 라벨을 떼기로 약속했습니다.\n버리기 전에 할 일은 무엇인가요?",
      options: [
        "헹구고 라벨을 뗀다",
        "병 안에 흙을 채운다",
        "뚜껑을 바닥에 버린다",
        "병을 구겨서 태운다",
      ],
      answer: 0,
      explanation: "동아리의 약속을 그대로 고른 답입니다.",
      difficulty: 2,
    },
    {
      id: "l9-030",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n수족관 물고기들은 불을 환하게 켜자 돌 밑으로 숨었습니다. 불을 어둡게 하니 다시 헤엄쳤습니다.\n물고기들이 숨은 까닭은 무엇인가요?",
      options: [
        "먹이를 많이 먹어서",
        "갑자기 밝은 불이 켜져서",
        "물이 모두 얼어서",
        "돌이 사라져서",
      ],
      answer: 1,
      explanation: "갑자기 밝은 불이 켜진 뒤 숨었다는 변화가 원인입니다.",
      difficulty: 2,
    },
    {
      id: "l9-031",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n할아버지 텃밭의 토마토는 처음에는 초록색이었지만 며칠 뒤 빨갛게 익었습니다.\n토마토에 생긴 변화는 무엇인가요?",
      options: [
        "빨간색에서 파란색으로 변했다",
        "잎이 모두 사라졌다",
        "초록색에서 빨간색으로 익었다",
        "토마토가 얼음이 되었다",
      ],
      answer: 2,
      explanation: "초록색 토마토가 빨갛게 익었다고 했습니다.",
      difficulty: 1,
    },
    {
      id: "l9-032",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n기차역 전광판에는 ‘도서관행 열차는 2번 승강장’이라고 표시되어 있었습니다. 유림은 표지판을 확인하고 갔습니다.\n유림은 어느 승강장으로 갔나요?",
      options: ["1번 승강장", "5번 승강장", "지하 주차장", "2번 승강장"],
      answer: 3,
      explanation: "전광판에 도서관행 열차는 2번 승강장이라고 나옵니다.",
      difficulty: 1,
    },
    {
      id: "l9-033",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n복도에서 지호가 친구의 공책을 떨어뜨렸습니다. 지호는 바로 미안하다고 말하고 공책을 주워 주었습니다.\n지호가 한 행동은 무엇인가요?",
      options: [
        "사과하고 공책을 주워 주었다",
        "공책을 숨기고 도망갔다",
        "친구에게 소리를 질렀다",
        "공책을 새로 샀다고 거짓말했다",
      ],
      answer: 0,
      explanation: "지호는 사과한 뒤 공책도 주워 주었습니다.",
      difficulty: 2,
    },
    {
      id: "l9-034",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n지도에서 우체국은 학교의 북쪽에 있고 공원은 학교의 동쪽에 있습니다. 민서는 학교에서 북쪽으로 걸었습니다.\n민서가 향한 곳은 어디인가요?",
      options: ["공원", "우체국", "운동장 남쪽", "학교 지하실"],
      answer: 1,
      explanation: "우체국이 학교 북쪽에 있고 민서도 북쪽으로 걸었습니다.",
      difficulty: 2,
    },
    {
      id: "l9-035",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n다온이는 화단에서 애벌레를 관찰했습니다. 며칠 뒤 애벌레는 번데기를 거쳐 나비가 되었습니다.\n애벌레 다음에 관찰된 것은 무엇인가요?",
      options: ["물고기", "나무 열매", "번데기", "새 둥지"],
      answer: 2,
      explanation: "애벌레가 번데기를 거쳐 나비가 되었다고 했습니다.",
      difficulty: 2,
    },
    {
      id: "l9-036",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n아이들이 만든 눈사람은 아침에는 단단했지만 햇볕이 강한 오후에는 작아졌습니다.\n눈사람이 작아진 까닭은 무엇인가요?",
      options: [
        "바람이 눈을 얼려서",
        "아이들이 책을 읽어서",
        "밤이 되어 어두워서",
        "햇볕에 눈이 녹아서",
      ],
      answer: 3,
      explanation: "강한 햇볕에 눈이 녹아 눈사람이 작아졌습니다.",
      difficulty: 2,
    },
    {
      id: "l9-037",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n우리 반은 사용하지 않는 교실의 불을 끄자는 약속을 정했습니다. 전기를 아끼기 위해서였습니다.\n불을 끄는 목적은 무엇인가요?",
      options: [
        "전기를 아끼려고",
        "교실을 더 덥게 하려고",
        "책을 숨기려고",
        "창문을 막으려고",
      ],
      answer: 0,
      explanation: "전기를 아끼기 위해 불을 끄기로 했습니다.",
      difficulty: 1,
    },
    {
      id: "l9-038",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n소풍이 끝난 뒤 유진은 돗자리 주변의 쓰레기를 모아 집으로 가져왔습니다. 공원에 쓰레기를 남기지 않으려는 행동이었습니다.\n유진이 쓰레기를 가져온 까닭은 무엇인가요?",
      options: [
        "쓰레기로 장난감을 만들려고",
        "공원을 깨끗하게 하려고",
        "친구의 도시락을 숨기려고",
        "돗자리를 팔려고",
      ],
      answer: 1,
      explanation: "공원에 쓰레기를 남기지 않으려 했기 때문입니다.",
      difficulty: 1,
    },
    {
      id: "l9-039",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n서연이 받은 생일 초대장에는 ‘이번 토요일 오후 2시’라고 적혀 있었습니다. 서연은 달력의 토요일에 동그라미를 쳤습니다.\n생일 파티는 언제 열리나요?",
      options: [
        "이번 일요일 아침",
        "다음 월요일 오후",
        "이번 토요일 오후 2시",
        "지난 토요일 밤",
      ],
      answer: 2,
      explanation: "초대장에 이번 토요일 오후 2시라고 적혀 있습니다.",
      difficulty: 1,
    },
    {
      id: "l9-040",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n아침에 준서는 씨앗에 물을 주었습니다. 오후에는 친구와 관찰 기록을 쓰고, 저녁에는 화분을 창가로 옮겼습니다.\n일의 순서가 바른 것은 무엇인가요?",
      options: [
        "창가로 옮기기 → 물 주기 → 잠자기",
        "기록 쓰기 → 물 주기 → 운동하기",
        "물 주기 → 창가로 옮기기 → 기록 쓰기",
        "물 주기 → 기록 쓰기 → 창가로 옮기기",
      ],
      answer: 3,
      explanation: "아침, 오후, 저녁의 순서대로 정리한 답입니다.",
      difficulty: 3,
    },
    {
      id: "l9-041",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n나무 그늘 아래에 벤치가 있었습니다. 햇볕이 뜨거워진 민지는 벤치에 앉아 물을 마셨습니다.\n민지가 벤치를 고른 까닭은 무엇인가요?",
      options: [
        "그늘에서 쉬려고",
        "비를 맞으려고",
        "자전거를 고치려고",
        "눈을 치우려고",
      ],
      answer: 0,
      explanation: "햇볕이 뜨거워져 나무 그늘 아래 벤치에서 쉬었습니다.",
      difficulty: 1,
    },
    {
      id: "l9-042",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n도윤은 새 연필을 깎은 뒤 부러진 흑연을 휴지통에 버렸습니다. 책상 위에는 연필 가루가 남지 않았습니다.\n도윤이 먼저 한 일은 무엇인가요?",
      options: [
        "휴지통을 씻었다",
        "연필을 깎았다",
        "책을 빌렸다",
        "창문을 닫았다",
      ],
      answer: 1,
      explanation: "글의 첫 행동이 새 연필을 깎은 것입니다.",
      difficulty: 1,
    },
    {
      id: "l9-043",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n비가 오자 운동회는 체육관으로 장소를 바꾸었습니다. 아이들은 실내에서 줄넘기 경기를 했습니다.\n운동회 장소가 바뀐 까닭은 무엇인가요?",
      options: [
        "햇볕이 너무 좋아서",
        "공을 잃어버려서",
        "비가 와서",
        "친구가 늦게 와서",
      ],
      answer: 2,
      explanation: "비가 왔기 때문에 체육관으로 옮겼습니다.",
      difficulty: 1,
    },
    {
      id: "l9-044",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n지민이는 식물을 관찰하며 월요일에는 작은 싹 하나, 금요일에는 싹 세 개를 세었습니다.\n금요일의 싹은 월요일보다 몇 개 더 많나요?",
      options: ["한 개", "세 개", "네 개", "두 개"],
      answer: 3,
      explanation: "금요일 세 개에서 월요일 한 개를 빼면 두 개입니다.",
      difficulty: 2,
    },
    {
      id: "l9-045",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n민서는 친구의 발표가 끝난 뒤 가장 먼저 박수를 쳤습니다. 친구가 열심히 준비한 것을 알고 있었기 때문입니다.\n민서가 박수를 친 까닭은 무엇인가요?",
      options: [
        "친구가 열심히 준비했기 때문에",
        "발표를 듣지 못해서",
        "교실을 나가려고",
        "책상을 옮기려고",
      ],
      answer: 0,
      explanation: "친구의 노력을 알고 격려하려고 박수를 쳤습니다.",
      difficulty: 2,
    },
    {
      id: "l9-046",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n도서관에서 빌린 책에는 반납 도장이 찍혀 있지 않았습니다. 사서는 책을 받은 뒤 도장을 찍었습니다.\n사서는 언제 도장을 찍었나요?",
      options: [
        "책을 빌리기 전날",
        "책을 받은 뒤",
        "도서관이 문을 닫은 뒤",
        "책을 잃어버린 뒤",
      ],
      answer: 1,
      explanation: "사서가 책을 받은 뒤 도장을 찍었다고 했습니다.",
      difficulty: 1,
    },
    {
      id: "l9-047",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n하린은 두 화분 중 잎이 더 곧은 화분을 창가에 두었습니다. 햇빛을 더 잘 받게 하려는 선택이었습니다.\n하린이 창가에 둔 화분은 어떤 화분인가요?",
      options: [
        "잎이 모두 떨어진 화분",
        "빈 화분",
        "잎이 더 곧은 화분",
        "가장 작은 화분",
      ],
      answer: 2,
      explanation: "잎이 더 곧은 화분을 골라 창가에 두었다고 했습니다.",
      difficulty: 2,
    },
    {
      id: "l9-048",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n친구들이 만든 종이배는 물에 띄우자 잠시 떠 있다가 젖어 가라앉았습니다. 지우는 다음에는 비닐을 덧대 보자고 했습니다.\n지우가 다음에 해 보려는 방법은 무엇인가요?",
      options: [
        "배를 돌로 만들기",
        "물을 모두 버리기",
        "종이를 불에 태우기",
        "종이배에 비닐을 덧대기",
      ],
      answer: 3,
      explanation: "다음에는 비닐을 덧대 보자고 제안했습니다.",
      difficulty: 2,
    },
    {
      id: "l9-049",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n아빠는 장을 본 뒤 냉장고에 우유를 넣고 빵은 식탁 위에 놓았습니다.\n우유는 어디에 넣었나요?",
      options: ["냉장고", "책장", "신발장", "가방"],
      answer: 0,
      explanation: "아빠가 우유를 냉장고에 넣었다고 했습니다.",
      difficulty: 1,
    },
    {
      id: "l9-050",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n마을 방송에서 내일 오전에 단수가 된다고 알렸습니다. 수아는 자기 전에 물통에 물을 받아 두었습니다.\n수아가 물을 받아 둔 까닭은 무엇인가요?",
      options: [
        "물통을 장식하려고",
        "단수에 대비하려고",
        "물을 얼리려고",
        "친구에게 선물하려고",
      ],
      answer: 1,
      explanation: "내일 물이 나오지 않을 것에 대비해 물을 준비했습니다.",
      difficulty: 2,
    },
    {
      id: "l9-051",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n학교 텃밭의 상추를 살펴보니 잎 가장자리에 작은 구멍이 있었습니다. 선생님은 벌레가 먹은 흔적일 수 있다고 했습니다.\n구멍의 원인으로 알맞은 것은 무엇인가요?",
      options: [
        "잎이 노래를 불러서",
        "화분이 움직여서",
        "벌레가 잎을 먹어서",
        "햇빛이 돌로 변해서",
      ],
      answer: 2,
      explanation: "선생님이 벌레가 먹은 흔적일 수 있다고 설명했습니다.",
      difficulty: 2,
    },
    {
      id: "l9-052",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n수영장 안내판에는 ‘뛰지 마세요’라고 쓰여 있었습니다. 아이들은 바닥이 미끄러울 수 있어 천천히 걸었습니다.\n아이들이 천천히 걸은 까닭은 무엇인가요?",
      options: [
        "수영장이 너무 멀어서",
        "신발을 잃어버려서",
        "물을 마시기 싫어서",
        "바닥이 미끄러울 수 있어서",
      ],
      answer: 3,
      explanation: "미끄러운 바닥에서 다치지 않도록 천천히 걸었습니다.",
      difficulty: 2,
    },
    {
      id: "l9-053",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n지후는 색연필을 색깔별로 나누어 통에 넣었습니다. 빨강, 파랑, 초록 통이 각각 채워졌습니다.\n지후가 한 일은 무엇인가요?",
      options: [
        "색연필을 색깔별로 정리했다",
        "색연필을 모두 버렸다",
        "통을 물에 띄웠다",
        "그림을 찢었다",
      ],
      answer: 0,
      explanation:
        "색깔에 따라 나누어 통에 넣었으므로 색연필을 정리한 것입니다.",
      difficulty: 1,
    },
    {
      id: "l9-054",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n아침에는 바람이 약했지만 오후가 되자 나뭇가지가 크게 흔들렸습니다.\n오후의 바람은 아침과 어떻게 달랐나요?",
      options: ["완전히 멈췄다", "더 세졌다", "눈으로 변했다", "방향을 잃었다"],
      answer: 1,
      explanation:
        "오후에는 나뭇가지가 크게 흔들려 바람이 더 세졌음을 알 수 있습니다.",
      difficulty: 2,
    },
    {
      id: "l9-055",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n현지는 친구에게 빌린 우산을 사용한 뒤 물기를 털어 말리고 다음 날 돌려주었습니다.\n현지가 우산을 바로 돌려주지 않은 까닭으로 알맞은 것은 무엇인가요?",
      options: [
        "우산을 숨기려고",
        "우산을 새로 사려고",
        "젖은 우산을 말리려고",
        "비를 다시 맞으려고",
      ],
      answer: 2,
      explanation: "사용한 우산의 물기를 털어 말린 뒤 돌려주었습니다.",
      difficulty: 2,
    },
    {
      id: "l9-056",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n학급 회의에서 여러 의견이 나왔습니다. 아이들은 손을 들어 차례로 말한 뒤 다수결로 정했습니다.\n아이들이 의견을 정한 방법은 무엇인가요?",
      options: [
        "제비뽑기 없이 혼자 결정",
        "가위바위보 한 번",
        "선생님이 미리 정함",
        "다수결",
      ],
      answer: 3,
      explanation: "차례로 의견을 듣고 다수결로 결정했다고 했습니다.",
      difficulty: 1,
    },
    {
      id: "l9-057",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n소풍 날 도시락 뚜껑을 열자 메모가 있었습니다. ‘김밥은 먼저 먹고 과일은 나중에 먹자.’라고 엄마가 적어 두었습니다.\n메모에 따르면 먼저 먹을 것은 무엇인가요?",
      options: ["김밥", "과일", "물", "도시락 뚜껑"],
      answer: 0,
      explanation: "메모에 김밥을 먼저 먹자고 적혀 있습니다.",
      difficulty: 1,
    },
    {
      id: "l9-058",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n민규는 새 관찰을 위해 조용한 색 옷을 입고 나뭇가지 뒤에 앉았습니다. 새가 놀라지 않게 하려는 방법이었습니다.\n민규가 조용한 색 옷을 입은 까닭은 무엇인가요?",
      options: [
        "눈에 잘 띄려고",
        "새를 놀라게 하지 않으려고",
        "비를 막으려고",
        "옷을 팔려고",
      ],
      answer: 1,
      explanation: "새가 눈치채지 않도록 조용한 색 옷을 입었습니다.",
      difficulty: 2,
    },
    {
      id: "l9-059",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n마을의 작은 도서관은 월요일에 문을 닫습니다. 수요일에는 오후 5시까지 운영합니다.\n월요일에 도서관에 가면 어떻게 되나요?",
      options: [
        "새 책을 받을 수 있다",
        "밤늦게까지 열린다",
        "문이 닫혀 있다",
        "수영 수업을 한다",
      ],
      answer: 2,
      explanation: "월요일에는 문을 닫는다고 안내되어 있습니다.",
      difficulty: 1,
    },
    {
      id: "l9-060",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n지아는 장난감 자동차의 바퀴 하나가 빠진 것을 발견했습니다. 아빠는 나사를 조여 바퀴를 다시 붙였습니다.\n아빠가 한 일은 무엇인가요?",
      options: [
        "자동차를 물에 넣었다",
        "장난감을 버렸다",
        "새 도로를 그렸다",
        "바퀴를 다시 붙였다",
      ],
      answer: 3,
      explanation: "나사를 조여 빠진 바퀴를 다시 붙였습니다.",
      difficulty: 1,
    },
    {
      id: "l9-061",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n학교 화단에 안내판이 생겼습니다. ‘꽃을 꺾지 말고 눈으로 감상하세요.’라는 문장이 적혀 있었습니다.\n안내판이 부탁하는 행동은 무엇인가요?",
      options: [
        "꽃을 꺾지 않고 보기",
        "꽃을 모두 뽑기",
        "꽃에 물감을 칠하기",
        "안내판을 옮기기",
      ],
      answer: 0,
      explanation: "꽃을 꺾지 말고 눈으로 감상하라는 안내입니다.",
      difficulty: 1,
    },
    {
      id: "l9-062",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n태블릿 배터리가 10퍼센트만 남자 은서는 충전기를 찾아 꽂았습니다. 잠시 뒤 배터리 표시가 올라갔습니다.\n은서가 충전기를 사용한 까닭은 무엇인가요?",
      options: [
        "소리를 크게 하려고",
        "배터리를 충전하려고",
        "화면을 닦으려고",
        "사진을 인쇄하려고",
      ],
      answer: 1,
      explanation: "배터리가 얼마 남지 않아 충전하려고 충전기를 꽂았습니다.",
      difficulty: 1,
    },
    {
      id: "l9-063",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n강가의 표지판에는 ‘비가 많이 오면 물이 불어날 수 있으니 가까이 가지 마세요.’라고 적혀 있었습니다.\n비가 많이 올 때 지켜야 할 일은 무엇인가요?",
      options: [
        "물속에서 뛰기",
        "표지판을 떼기",
        "강 가까이에 가지 않기",
        "돌을 강에 던지기",
      ],
      answer: 2,
      explanation:
        "물이 불어날 수 있으므로 강 가까이에 가지 말라는 안전 안내입니다.",
      difficulty: 2,
    },
    {
      id: "l9-064",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n지원은 책을 읽다가 모르는 낱말을 만났습니다. 문장 앞뒤를 다시 읽고 사전에서 뜻을 찾아 공책에 적었습니다.\n지원이 모르는 낱말을 해결한 방법은 무엇인가요?",
      options: [
        "책을 덮고 포기했다",
        "친구의 그림만 보았다",
        "낱말을 지워 버렸다",
        "앞뒤 문맥을 읽고 사전에서 찾았다",
      ],
      answer: 3,
      explanation: "앞뒤 문장을 살핀 뒤 사전에서 뜻을 찾아 적었습니다.",
      difficulty: 2,
    },
    {
      id: "l9-065",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n운동장에 물웅덩이가 생겨 체육 선생님은 수업 전에 모래를 뿌렸습니다. 아이들은 미끄러지지 않고 달릴 수 있었습니다.\n모래를 뿌린 결과는 무엇인가요?",
      options: [
        "아이들이 미끄러지지 않았다",
        "물웅덩이가 더 깊어졌다",
        "운동장이 얼어붙었다",
        "아이들이 모두 쉬었다",
      ],
      answer: 0,
      explanation: "모래를 뿌린 뒤 아이들이 미끄러지지 않고 달렸습니다.",
      difficulty: 2,
    },
    {
      id: "l9-066",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n연우는 주말마다 할머니 텃밭의 잡초를 뽑았습니다. 한 달 뒤 채소가 햇빛과 물을 더 잘 받을 수 있었습니다.\n잡초를 뽑은 결과로 알맞은 것은 무엇인가요?",
      options: [
        "채소가 모두 사라졌다",
        "채소가 햇빛과 물을 더 잘 받았다",
        "텃밭에 물이 없어졌다",
        "잡초가 더 크게 자랐다",
      ],
      answer: 1,
      explanation: "잡초를 제거하자 채소가 햇빛과 물을 더 잘 받았습니다.",
      difficulty: 2,
    },
    {
      id: "l9-067",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n주문한 연필은 파란 상자에 담겨 왔고, 민서는 상자 겉면의 이름을 확인한 뒤 열었습니다.\n민서가 상자를 연 전에 한 일은 무엇인가요?",
      options: [
        "연필을 모두 썼다",
        "상자를 물에 담갔다",
        "겉면의 이름을 확인했다",
        "택배를 다시 보냈다",
      ],
      answer: 2,
      explanation: "상자를 열기 전에 겉면의 이름을 확인했습니다.",
      difficulty: 1,
    },
    {
      id: "l9-068",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n학교 방송에서 화재 대피 훈련을 알렸습니다. 종이 울리자 아이들은 손수건으로 코와 입을 가리고 선생님을 따라 운동장으로 나갔습니다.\n아이들이 운동장으로 간 까닭은 무엇인가요?",
      options: [
        "점심을 먹기 위해서",
        "공을 찾기 위해서",
        "비를 피하기 위해서",
        "화재 대피 훈련을 하기 위해서",
      ],
      answer: 3,
      explanation: "화재 대피 훈련 안내 뒤 안전하게 운동장으로 이동했습니다.",
      difficulty: 2,
    },
    {
      id: "l9-069",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n민아는 물감을 섞어 보라색을 만들었습니다. 빨간색과 파란색을 섞자 원하는 색이 나왔습니다.\n보라색을 만드는 데 사용한 색은 무엇인가요?",
      options: [
        "빨간색과 파란색",
        "노란색과 흰색",
        "초록색과 검은색",
        "주황색과 갈색",
      ],
      answer: 0,
      explanation: "빨간색과 파란색을 섞어 보라색을 만들었습니다.",
      difficulty: 1,
    },
    {
      id: "l9-070",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n수현은 친구와 약속한 시간보다 10분 일찍 도착했습니다. 기다리는 동안 근처 벤치에서 동화책을 읽었습니다.\n수현은 기다리는 동안 무엇을 했나요?",
      options: [
        "축구를 했다",
        "동화책을 읽었다",
        "집으로 돌아갔다",
        "우산을 빌렸다",
      ],
      answer: 1,
      explanation: "약속 장소 근처 벤치에서 동화책을 읽었습니다.",
      difficulty: 1,
    },
    {
      id: "l9-071",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n어항 물이 흐려지자 유나는 물고기를 다른 통으로 옮기고 어항을 깨끗이 씻었습니다.\n유나가 물고기를 다른 통으로 옮긴 까닭은 무엇인가요?",
      options: [
        "물고기를 밖에 놓기 위해서",
        "어항을 더럽히기 위해서",
        "어항을 씻기 위해서",
        "먹이를 숨기기 위해서",
      ],
      answer: 2,
      explanation: "어항을 씻는 동안 물고기를 안전하게 다른 통에 두었습니다.",
      difficulty: 2,
    },
    {
      id: "l9-072",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n학교 앞 횡단보도 신호가 초록색으로 바뀌자 선생님은 좌우를 살핀 뒤 건너자고 했습니다.\n길을 건너기 전에 할 일은 무엇인가요?",
      options: [
        "눈을 감는다",
        "차도로 뛰어간다",
        "신호등을 가린다",
        "좌우를 살핀다",
      ],
      answer: 3,
      explanation: "초록불이어도 좌우를 살핀 뒤 건너야 한다고 했습니다.",
      difficulty: 1,
    },
    {
      id: "l9-073",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n유빈은 책상 서랍에서 쓰지 않는 학용품을 찾아 필요한 친구들에게 나누어 주었습니다.\n유빈이 학용품을 나눈 까닭으로 알맞은 것은 무엇인가요?",
      options: [
        "필요한 친구를 도우려고",
        "학용품을 숨기려고",
        "서랍을 더 채우려고",
        "친구의 물건을 빼앗으려고",
      ],
      answer: 0,
      explanation: "쓰지 않는 물건을 필요한 친구에게 주어 도왔습니다.",
      difficulty: 1,
    },
    {
      id: "l9-074",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n밤에 별을 보려던 가족은 불빛이 적은 산책로로 이동했습니다. 그곳에서 하늘의 별이 더 잘 보였습니다.\n가족이 산책로로 간 까닭은 무엇인가요?",
      options: [
        "비를 피하려고",
        "불빛이 적어 별을 잘 보려고",
        "꽃을 꺾으려고",
        "자동차를 고치려고",
      ],
      answer: 1,
      explanation: "주변 불빛이 적으면 별이 잘 보여서 산책로로 이동했습니다.",
      difficulty: 2,
    },
    {
      id: "l9-075",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n민지는 새 모이를 주려고 했지만 바닥에 사람이 많아 새들이 가까이 오지 않았습니다. 사람 수가 줄자 새들이 모이통에 왔습니다.\n새들이 오지 않은 까닭은 무엇인가요?",
      options: [
        "모이가 너무 많아서",
        "날씨가 맑아서",
        "사람이 많아서",
        "모이통이 깨끗해서",
      ],
      answer: 2,
      explanation: "사람이 많을 때는 새가 가까이 오지 않았습니다.",
      difficulty: 2,
    },
    {
      id: "l9-076",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n마을 회관 게시판에는 ‘분실한 빨간 장갑을 안내실에서 찾아가세요.’라는 글이 붙었습니다. 지수는 안내실에서 장갑을 찾았습니다.\n지수가 찾은 물건은 무엇인가요?",
      options: ["파란 모자", "노란 우산", "검은 가방", "빨간 장갑"],
      answer: 3,
      explanation: "게시판에 분실한 빨간 장갑이라고 적혀 있습니다.",
      difficulty: 1,
    },
    {
      id: "l9-077",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n비가 그친 뒤 무지개를 본 현서는 동생에게 하늘을 보라고 알려 주었습니다. 동생은 창문가로 와서 함께 무지개를 보았습니다.\n현서는 동생에게 무엇을 알려 주었나요?",
      options: [
        "하늘을 보라고 했다",
        "우산을 접으라고 했다",
        "책을 빌리라고 했다",
        "불을 끄라고 했다",
      ],
      answer: 0,
      explanation: "현서는 동생에게 하늘을 보라고 알려 주었습니다.",
      difficulty: 1,
    },
    {
      id: "l9-078",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n학교 텃밭의 물통 뚜껑이 헐겁게 닫혀 물이 샜습니다. 선생님이 뚜껑을 단단히 닫고 확인하니 더는 물이 새지 않았습니다.\n뚜껑을 단단히 닫은 결과는 무엇인가요?",
      options: [
        "손잡이가 사라졌다",
        "물이 새지 않았다",
        "텃밭이 없어졌다",
        "물이 얼었다",
      ],
      answer: 1,
      explanation:
        "글에 뚜껑을 단단히 닫은 뒤 더는 물이 새지 않았다고 나옵니다.",
      difficulty: 2,
    },
    {
      id: "l9-079",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n여름 방학 계획표에서 오전에는 수영, 오후에는 독서라고 적었습니다. 준서는 오전에 수영장에 갔습니다.\n오후에 하기로 한 일은 무엇인가요?",
      options: ["수영", "등산", "독서", "요리"],
      answer: 2,
      explanation: "계획표에 오전 수영, 오후 독서라고 적혀 있습니다.",
      difficulty: 1,
    },
    {
      id: "l9-080",
      prompt:
        "다음 글을 읽고 물음에 답하세요.\n가족은 사용하지 않는 책을 상자에 모아 작은 책 나눔터에 가져갔습니다. 다른 아이들이 그 책을 읽을 수 있도록 하기 위해서였습니다.\n가족이 책을 가져간 목적은 무엇인가요?",
      options: [
        "책을 모두 버리려고",
        "상자를 장식하려고",
        "나눔터를 닫으려고",
        "다른 아이들이 읽게 하려고",
      ],
      answer: 3,
      explanation:
        "다른 아이들이 책을 읽을 수 있도록 책 나눔터에 가져갔습니다.",
      difficulty: 1,
    },
  ],
};

// Balance the authored dialogue bank before play; always choosing one button
// must not be a shortcut to passing. The order stays stable for saved decks.
languagePools[1] = languagePools[1].map((question, index) => {
  const answer = index % 4;
  const offset = (question.answer - answer + 4) % 4;
  return {
    ...question,
    options: [
      ...question.options.slice(offset),
      ...question.options.slice(0, offset),
    ],
    answer,
  };
});
