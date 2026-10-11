import type { Judges } from './types';

// 판별 자료. 근거: 교과분석 10·11·12·14·17·23·25·28·31·37~44·56 / 교과서 1단원 p.29, 2단원 pp.66·70·84·86·89·106, 지도서 p.150.
export const judges: Judges = {
  // ① 투표소 — 1536×1024 그림, 왼쪽에서 오른쪽 순.
  // 위반 4(a·b·c·d) + 함정 2(e·f). 처음 안은 위반 3 + 함정 3 이었으나 PRD 가 위반 4 + 함정 2 를 요구해,
  // (c) 투표함 옆 종이 더미를 "미리 표시된 투표지 뭉치(사전 투입, 평등 위반)"로 읽어 4번째 위반으로 삼았다.
  // 교과서 p.29(사전 투입)·지도서 p.150 풀이. (e) 기표소 커튼과 (f) 거소 투표(M6)가 함정이다.
  // (d) 는 y 170~440, (f) 는 y 450~840 으로 맞춰 사각형끼리 겹치지 않는다.
  poll: {
    spots: [
      { id: 'bribe', x: 40, y: 180, w: 210, h: 360, violation: '금품', explain: '돈 봉투를 건네며 표를 사려 함 → 금품 제공, 공정한 선거 위반' },
      { id: 'group', x: 300, y: 190, w: 260, h: 340, violation: '비밀', explain: '세 사람이 조를 짜서 함께 공개 투표 → 비밀 선거 위반' },
      { id: 'stack', x: 640, y: 220, w: 410, h: 250, violation: '평등', explain: '투표함 곁에 미리 표시된 투표지 뭉치(사전 투입) → 평등 선거 위반' },
      { id: 'proxy', x: 1060, y: 170, w: 250, h: 270, violation: '직접', explain: '미리 접어 둔 투표지를 대신 건네줌 → 직접 선거 위반' },
      { id: 'trap_curtain', x: 1320, y: 80, w: 216, h: 340, violation: null, explain: '기표소 커튼은 누구에게 투표했는지 알 수 없게 하는 비밀 선거를 지키는 장치예요' },
      { id: 'trap_home', x: 1080, y: 450, w: 400, h: 390, violation: null, explain: '이건 원칙에 맞아요: 거소 투표도 본인이 직접 기표하는 직접 투표예요' },
    ],
  },
  // ② 호소처 — 공장 임금 체불(교과분석 25 권력 집중, 28 분립 이유, M11·M12)
  appeal: {
    situation: '공장에서 몇 달째 월급을 받지 못했다. 억울한 사정을 어디에 호소할 수 있을까?',
    cards: [
      { id: 'assembly', title: '국회', back: '막힘 · "요즘 국회는 대통령 뜻을 거스르지 못한단다."' },
      { id: 'court', title: '법원', back: '막힘 · "판사도 눈치를 보는 때라 이런 사건은 받아 주기 어려워요."' },
      { id: 'press', title: '신문', back: '막힘 · "그런 이야기는 신문에 실을 수 없어요."' },
      { id: 'neighbor', title: '이웃', back: '막힘 · "그 말은 꺼내지 말게. 괜히 다치는 수가 있어."' },
    ],
    why: [
      { id: 'strong', label: '대통령 권력이 세면 국민이 더 안전해지기 때문에', correct: false, misconception: 'M11' },
      { id: 'lazy', label: '국회·법원·신문이 모두 일을 게을리해서', correct: false },
      { id: 'concentrated', label: '권력이 한곳에 모여 서로 견제하지 못해서', correct: true },
    ],
  },
  // ③ 정보 카드 — 기준 4개는 교과분석 44(교과서 p.106). 체크 true = 그렇다.
  source: {
    criteria: [
      "'속보'·'단독 보도' 등으로 뉴스 형식을 흉내 내는가?",
      '글을 작성한 사람과 날짜가 정확히 제시되어 있는가?',
      '믿을 만한 출처에서 얻은 정보를 제시하는가?',
      '주장을 뒷받침하는 근거가 타당한가?',
    ],
    cards: [
      {
        id: 'radio',
        source: '라디오',
        date: '1980년 5월',
        text: '"광주에서 폭도들이 소동을 벌이고 있습니다. 곧 진정될 것입니다."',
        answerChecks: [false, false, false, false],
        answerTrust: 'low',
        feedback: '방송이라고 늘 사실만 전하지는 않아요. 쓴 사람과 근거가 없고 통제된 방송이라 낮음이에요. 기준 4개로 따져 보세요.',
      },
      {
        id: 'letter',
        source: '친척 편지',
        date: '1980년 5월 말',
        text: '"이모가 씁니다. 우리 동네에서 일어난 일을 직접 보고 적어요. 길이 막혀 소식 전하기가 어렵습니다."',
        answerChecks: [false, true, true, false],
        answerTrust: 'mid',
        feedback: '쓴 사람과 날짜가 있고 직접 본 일이라 믿을 만해요. 하지만 한 사람의 기록이라 중간이에요.',
      },
      {
        id: 'photo',
        source: '외신 기자 기록',
        date: '1980년 5월',
        text: '기자 이름, 찍은 날짜와 장소가 적힌 사진과 취재 기록이에요.',
        answerChecks: [false, true, true, true],
        answerTrust: 'high',
        feedback: '사진과 기록이 있고 쓴 사람·날짜·출처를 확인할 수 있어서 높음이에요.',
      },
      {
        id: 'rumor',
        source: '시장 소문',
        date: '날짜 모름',
        text: '"어디서 들었는데, 다들 그렇게 말하던걸. 곧 큰일이 난다더라."',
        answerChecks: [false, false, false, false],
        answerTrust: 'low',
        feedback: '누가 언제 말했는지, 근거가 무엇인지 알 수 없어서 낮음이에요. 소문이라서가 아니라 기준 4개를 따져서 정한 거예요.',
      },
    ],
  },
  // ④ 공약 채점표 — 총점: 나 후보 14 > 다 후보 9 > 가 후보 6 (유일한 최고 = p2)
  pledge: {
    criteria: [
      '구체적인가? (무엇을 언제까지 어떻게 할지 분명한가)',
      '실천할 수 있는가?',
      '국민의 요구를 반영하는가?',
    ],
    candidates: [
      {
        id: 'p1',
        name: '가 후보',
        pledges: ['모든 사람이 행복하게 사는 나라를 만들겠습니다.', '세금은 반으로 줄이고 복지는 두 배로 늘리겠습니다.', '일자리를 마음껏 만들겠습니다.'],
        truth: [1, 1, 4],
      },
      {
        id: 'p2',
        name: '나 후보',
        pledges: ['초등학교 앞 어린이 보호 구역에 과속 단속 카메라를 2년 안에 모두 설치하겠습니다.', '동네 도서관을 한 곳 더 짓고 임기 안에 문을 열겠습니다.', '버스 노선을 새로 만들어 배차 간격을 10분으로 줄이겠습니다.'],
        truth: [5, 4, 5],
      },
      {
        id: 'p3',
        name: '다 후보',
        pledges: ['마을 한가운데에 큰 놀이공원을 만들겠습니다.', '공원 입장료를 받아 다른 사업 비용으로 쓰겠습니다.', '놀이공원 옆에 높은 탑을 세우겠습니다.'],
        truth: [4, 3, 2],
      },
    ],
  },
  // ⑤ 기관 카드 — 교과서 pp.88~89 가·나·다
  organ: {
    cards: [
      { id: 'law', label: '법 만들기', organ: 'assembly', icon: 'organ-law' },
      { id: 'audit', label: '국정 감사', organ: 'assembly', icon: 'organ-audit' },
      { id: 'budget', label: '예산 심의', organ: 'assembly', icon: 'organ-budget' },
      { id: 'hearing', label: '인사 청문회', organ: 'assembly', icon: 'organ-hearing' },
      { id: 'cabinet', label: '국무 회의', organ: 'executive', icon: 'organ-cabinet' },
      { id: 'ministry', label: '행정 각부', organ: 'executive', icon: 'organ-ministries' },
      { id: 'trial', label: '재판', organ: 'court', icon: 'organ-trial' },
      { id: 'three_trials', label: '삼심 제도', organ: 'court', icon: 'organ-threetier' },
    ],
    checks: [
      { id: 'audit', label: '국정 감사', from: 'assembly', to: 'executive', icon: 'check-audit' },
      { id: 'veto', label: '법률안 거부권', from: 'executive', to: 'assembly', icon: 'check-veto' },
      { id: 'nullify', label: '명령·규칙 취소', from: 'court', to: 'executive', icon: 'check-nullify' },
    ],
  },
};
