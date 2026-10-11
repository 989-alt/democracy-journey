import type { Scene } from './types';

// 장 구성(PRD §3): 타이틀 → 이야기·생활 문화(5~6, 에필로그 2~3) → 판별 → 비교 → 다시 보기(2~4장만).
// 각 장 타이틀 text[0] = 장 제목. 이야기 장면은 지도 내용 1~2개씩만 다룬다.
// '{{flag:이름|변주문장}}' 토큰: 플래그가 켜져 있으면 변주문장, 아니면 빈 문자열. 토큰이 있는 장면은 토큰을 뺀 본문이 2문장 이하(변주 포함 3문장 이하).
// 선택지는 평가하지 않는다(R10): 모든 story/culture 선택지는 한 수치에 정확히 ±1, 같은 장면 안 라벨 길이 차 15% 이내.
export const scenes: Scene[] = [
  // ───────── 1장 · 1960 봄 ─────────
  {
    id: 'c1-s01', chapter: 1, kind: 'title', bg: '1960-room', portrait: 'y10',
    text: ['1장 · 1960 봄', '1950년에 태어난 나는 열 살, 대통령을 뽑는 선거를 앞둔 봄이다.'],
    options: [], covers: [],
  },
  {
    id: 'c1-s02', chapter: 1, kind: 'story', bg: '1960-room', portrait: 'y10', speaker: '아버지',
    text: [
      '민주주의는 국민이 나라의 주인이라는 뜻이란다.',
      '그런데 모든 국민이 모여 나랏일을 정하기는 어려워서, 선거로 대표를 뽑아 맡기는 거야.',
      '올해는 대통령을 뽑는 해라서 어른들도 선거 이야기가 한창이구나.',
    ],
    options: [
      { id: 'a', label: '나라 일은 모든 국민이 모여서 직접 정하는 거 아니에요?', delta: { info: -1 }, misconception: 'M1' },
      { id: 'b', label: '그럼 대표를 잘 뽑는 게 아주 중요하겠다고 생각해요.', delta: { join: 1 } },
      { id: 'c', label: '나도 크면 투표해서 좋은 대표를 꼭 뽑아 보고 싶어요.', delta: { home: 1 } },
    ],
    covers: [1, 2], misconceptions: ['M1'],
  },
  {
    id: 'c1-s03', chapter: 1, kind: 'story', bg: '1960-room', portrait: 'y10', speaker: '아버지',
    text: [
      '이승만 대통령은 헌법을 바꿔 가며 세 번이나 당선됐단다.',
      '정부를 세울 때는 두 번까지만 할 수 있다고 정했었는데 말이야.',
      '나라 살림이 어려운 때에 한 사람이 오래 맡는다고 불만이 많구나.',
    ],
    options: [
      { id: 'a', label: '대표는 헌법을 마음대로 바꿀 수 있는 거 아니에요?', delta: { join: 1 }, misconception: 'M2' },
      { id: 'b', label: '헌법을 바꿔 가며 또 하는 건 이상해요. 더 여쭤본다.', delta: { info: -1 }, flag: 'asked_why' },
      { id: 'c', label: '이승만 대통령은 헌법을 지키면서 세 번 당선된 거죠?', delta: { home: -1 }, misconception: 'M31' },
    ],
    covers: [48], misconceptions: ['M2', 'M31'],
  },
  {
    id: 'c1-s04', chapter: 1, kind: 'story', bg: '1960-street', portrait: 'y10', speaker: '나',
    text: [
      '2월 28일, 대구의 고등학생들이 야당 유세가 있는 일요일에 학교에 나오라는 지시에 맞서 거리로 나섰다.',
      '정부가 선거에서 이기려고 선거 운동에 끼어든 일에 학생들이 처음으로 맞선 것이다.',
      '골목에서 형들의 행진을 본 나는 어떻게 할까?',
    ],
    options: [
      { id: 'a', label: '형들 뒤를 따라 조금 걸어가 본다.', delta: { join: 1 }, flag: 'joined_2_28' },
      { id: 'b', label: '집에서 라디오로 소식을 들어 본다.', delta: { info: 1 }, flag: 'heard_news' },
      { id: 'c', label: '아버지 곁에서 투표 날을 기다린다.', delta: { home: -1 } },
    ],
    covers: [49],
  },
  {
    id: 'c1-s05', chapter: 1, kind: 'story', bg: '1960-street', portrait: 'y10', speaker: '나',
    text: [
      '선거일인 3월 15일이 다가오자 동네에는 이상한 소문이 돌았다.',
      '돈이나 물건이 오가고, 어른들이 조를 짜서 움직인다는 이야기였다.',
      '아버지는 부정 선거가 되면 투표 결과를 믿을 수 없고 국민의 뜻도 전달되지 않는다고 걱정하신다.',
    ],
    options: [
      { id: 'a', label: '소문이 맞는지 더 자세히 알아본다.', delta: { info: 1 } },
      { id: 'b', label: '친구들과 걱정되는 마음을 나눈다.', delta: { join: -1 } },
      { id: 'c', label: '아버지 곁에서 말없이 지켜본다.', delta: { home: 1 } },
    ],
    covers: [50],
  },
  {
    id: 'c1-s06', chapter: 1, kind: 'story', bg: '1960-street', portrait: 'y10', speaker: '아버지',
    text: [
      '마산 시위에 나섰던 고등학생 김주열이 4월 11일 숨진 채 발견되자 시위가 전국으로 퍼졌단다.',
      '4월 19일에는 초등학생부터 대학교수까지 거리로 나왔고, 훗날 사람들은 이를 4·19 혁명이라 불렀다.',
      '아버지가 묻는다. "3·15 선거에서 이긴 대통령은 어떻게 됐을까?"',
    ],
    options: [
      { id: 'a', label: '선거에서 이겼으니 그 자리를 지켰을 거예요.', delta: { join: -1 }, misconception: 'M22' },
      { id: 'b', label: '4월 26일에 물러났고 선거는 무효가 됐어요.', delta: { info: 1 }, flag: 'saw_4_19' },
    ],
    covers: [51, 52], misconceptions: ['M22', 'M23'],
  },
  {
    id: 'c1-s07', chapter: 1, kind: 'culture', bg: '1960-room', portrait: 'y10', speaker: '나',
    text: [
      '6·25 전쟁 뒤 우리 집 밥상에는 원조 받은 밀가루와 설탕으로 만든 음식이 자주 올랐다.',
      '공장에서는 밀가루·설탕·면직물 같은 생활 물건을 만들었고, 1963년에는 라면도 처음 나왔다.',
      '왜 이런 물건을 만드는 공장이 먼저 자랐을까?',
    ],
    options: [
      { id: 'a', label: '전쟁 뒤에 새로 지은 공장에서 전자 제품부터 만들어서', delta: { join: -1 } },
      { id: 'b', label: '전쟁으로 시설이 부서져 원조 물자로 생활품을 만들어서', delta: { info: 1 } },
      { id: 'c', label: '정부가 공장을 짓지 않고 농사를 크게 늘리기로 해서', delta: { home: -1 } },
    ],
    culture: {
      answer: 'b',
      why: [
        '6·25 전쟁으로 산업 시설이 많이 부서졌어요.',
        '미국 등의 원조 식량과 물자를 바탕으로 밀가루·설탕·면직물 같은 생활 물건을 만드는 공장이 먼저 자랐어요.',
      ],
    },
    covers: [61],
  },
  {
    id: 'c1-s08', chapter: 1, kind: 'judge', bg: '1960-poll', portrait: 'y10', judge: 'poll',
    text: [
      '3월 15일, 아버지 손을 잡고 들어선 투표소에서 이상한 장면들이 보였다. 그날의 투표소를 다시 살펴보자.',
      '선거 원칙(보통·평등·직접·비밀)을 어긴 곳만 눌러 보자. 원칙에 맞는 곳을 누르면 안 돼요.',
    ],
    options: [], covers: [10, 11, 12, 15, 50], misconceptions: ['M3', 'M5', 'M6', 'M7'],
  },
  {
    id: 'c1-s09', chapter: 1, kind: 'compare', bg: '1960-poll', portrait: 'y10', compare: 1,
    text: ['그때의 투표소와 오늘의 투표소를 나란히 놓고 비교해 보자.'],
    options: [], covers: [9, 12, 13],
  },

  // ───────── 2장 · 1961~1979 긴 집권의 시대 ─────────
  {
    id: 'c2-s01', chapter: 2, kind: 'title', bg: '1960s-factory', portrait: 'y20',
    text: ['2장 · 1961~1979 긴 집권의 시대', '한 사람이 오래 나라를 맡는 동안, 나는 어른이 되어 간다.'],
    options: [], covers: [],
  },
  {
    id: 'c2-s02', chapter: 2, kind: 'story', bg: '1960s-factory', portrait: 'y20', speaker: '나',
    text: [
      '{{flag:asked_why|어릴 적 아버지께 이유를 여쭤봤던 일이 떠오른다. }}1961년 5월, 박정희와 일부 군인들이 5·16 군사 정변(법에 맞지 않는 방법으로 일어난 정치적 변화)을 일으켜 정권을 잡았다.',
      '우리 가족은 일자리를 찾아 어디로 갈지 의논한다.',
    ],
    options: [
      { id: 'a', label: '도시로 올라가서 일자리를 찾아본다.', delta: { home: 1 }, flag: 'moved_city' },
      { id: 'b', label: '다들 일자리를 찾아 농촌으로 간대요.', delta: { join: -1 }, misconception: 'M30' },
      { id: 'c', label: '정변 소식을 더 알아본 뒤에 정한다.', delta: { info: 1 } },
    ],
    covers: [53, 66], misconceptions: ['M30'],
  },
  {
    id: 'c2-s03', chapter: 2, kind: 'story', bg: '1960s-factory', portrait: 'y20', speaker: '나',
    text: [
      '정부는 경제 개발 5개년 계획을 세워 수출로 나라를 키우려 했다.',
      '풍부한 노동력을 바탕으로 신발·가발·의류 같은 경공업 제품을 수출하고 있었다.',
      '나는 어느 곳에서 일할까?',
    ],
    options: [
      { id: 'a', label: '신발·가발을 만드는 공장에 취직한다.', delta: { home: -1 }, flag: 'factory_job' },
      { id: 'b', label: '전자 제품을 만드는 공장을 찾아본다.', delta: { info: 1 }, misconception: 'M27' },
      { id: 'c', label: '독일 광부·간호사 모집에 지원한다.', delta: { home: 1 }, lock: { stat: 'info', min: 2 } },
    ],
    covers: [62, 63], misconceptions: ['M27'],
  },
  {
    id: 'c2-s04', chapter: 2, kind: 'story', bg: '1970s-hill', portrait: 'y20', speaker: '이웃 어른',
    text: [
      '요즘은 유신이라고 하더라, 한 사람이 아주 오래 나라를 맡고 있어.',
      '{{flag:knows_poll|보통·평등·직접·비밀, 선거 원칙을 아는 자네는 더 잘 알겠지. }}대표는 헌법과 법률에 따라 일해야 하는데, 이렇게 오래 맡아도 되는 걸까 싶구나.',
    ],
    options: [
      { id: 'a', label: '선거로 뽑은 대표니까 헌법도 마음대로 바꿔도 되죠.', delta: { home: 1 }, misconception: 'M2' },
      { id: 'b', label: '대표도 헌법과 법률을 따라야 하는데 이상해요.', delta: { join: -1 } },
    ],
    covers: [53], misconceptions: ['M2'],
  },
  {
    id: 'c2-s05', chapter: 2, kind: 'story', bg: '1960s-factory', portrait: 'y20', speaker: '나',
    text: [
      '공장 일은 하루 열 시간이 훌쩍 넘고, 월급은 적은데 그마저 자꾸 미뤄진다.',
      '법으로는 주 48시간인데 57시간씩 일하는 곳도 많았다.',
      '1970년에는 전태일이라는 청년이 이런 사정을 편지로 알렸다.',
    ],
    options: [
      { id: 'a', label: '일이 끝나면 여가 시간이 충분하겠지요.', delta: { home: 1 }, misconception: 'M28' },
      { id: 'b', label: '밀린 월급을 호소할 곳을 찾아본다.', delta: { join: -1 }, flag: 'asked_help' },
      { id: 'c', label: '우리 사정을 편지에 써서 알려 본다.', delta: { info: 1 } },
    ],
    covers: [69], misconceptions: ['M28'],
  },
  {
    id: 'c2-s06', chapter: 2, kind: 'story', bg: '1970s-hill', portrait: 'y20', speaker: '나',
    text: [
      '일자리를 찾아 도시로 온 사람이 많아지자 변두리 언덕에 달동네가 생겼다.',
      '집은 모자라고 살림은 가난한데, 시골에는 일손이 줄어 도시와 농촌의 소득 차이도 커졌다.',
      '신문에는 아파트 단지와 새 도로 소식이 크게 실렸다.',
    ],
    options: [
      { id: 'a', label: '달동네가 늘어난 것도 산업화가 잘된 성과예요.', delta: { join: 1 }, misconception: 'M29' },
      { id: 'b', label: '아파트·고속 국도는 성과, 달동네는 한계예요.', delta: { info: -1 } },
      { id: 'c', label: '이웃들과 힘들 때마다 서로 돕고 살아간다.', delta: { home: 1 } },
    ],
    covers: [68], misconceptions: ['M29'],
  },
  {
    id: 'c2-s07', chapter: 2, kind: 'culture', bg: '1970-highway', portrait: 'y20', speaker: '나',
    text: [
      '1970년, 서울과 부산을 잇는 428킬로미터 경부 고속 국도가 열려 기차로 12시간 걸리던 길이 4시간 30분대로 줄었다.',
      '아파트 단지가 생기고 1974년에는 지하철 1호선이 달렸으며, 철강·조선·석유 화학 같은 중화학 공업도 자랐다.',
      '정부는 왜 길과 공장부터 지었을까?',
    ],
    options: [
      { id: 'a', label: '관광객을 많이 맞이하고 싶어서 길을 먼저 냈다', delta: { join: 1 } },
      { id: 'b', label: '외국에서 농산물을 사다 팔려고 길을 먼저 냈다', delta: { home: 1 } },
      { id: 'c', label: '수출품을 빨리 나르려고 고속 국도·항만을 지었다', delta: { info: -1 } },
    ],
    culture: {
      answer: 'c',
      why: [
        '경제 개발 계획으로 수출을 늘리려 했기 때문이에요.',
        '수출품을 만들고 나르려고 발전소·고속 국도·항만을 지었고, 하루 안에 오갈 수 있는 일일생활권이 생겼어요.',
      ],
    },
    covers: [64, 66],
  },
  {
    id: 'c2-s08', chapter: 2, kind: 'judge', bg: '1960s-factory', portrait: 'y20', judge: 'appeal',
    text: [
      '월급이 몇 달째 밀렸다. 억울한 사정을 들어 줄 곳을 하나씩 찾아가 보자.',
      '카드를 눌러 뒤집어 보고, 왜 길이 막혔는지 이유를 골라 보자.',
    ],
    options: [], covers: [17, 23, 25, 28], misconceptions: ['M11', 'M12'],
  },
  {
    id: 'c2-s09', chapter: 2, kind: 'compare', bg: '1970s-apt', portrait: 'y20', compare: 2,
    text: ['그때 막혀 있던 길을 오늘의 견제와 나란히 놓고 비교해 보자.'],
    options: [], covers: [19, 20, 21, 24, 26, 27],
  },
  {
    id: 'c2-s10', chapter: 2, kind: 'retry', bg: '1970s-apt', portrait: 'y20',
    text: ['지난 장에서 헷갈렸던 문제를 한 번 더 살펴보자.'],
    options: [], covers: [],
  },

  // ───────── 3장 · 1980 5월 ─────────
  {
    id: 'c3-s01', chapter: 3, kind: 'title', bg: '1980-alley', portrait: 'y30',
    text: ['3장 · 1980 5월', '소식이 끊긴 날, 사람들은 라디오와 편지에 귀를 기울였다.'],
    options: [], covers: [],
  },
  {
    id: 'c3-s02', chapter: 3, kind: 'story', bg: '1980-alley', portrait: 'y30', speaker: '나',
    text: [
      '{{flag:knows_appeal|호소할 곳이 막혔던 때를 잊지 못한다. }}1979년 박정희 대통령이 암살당하며 긴 집권이 끝났지만, 신군부(전두환을 중심으로 한 군인들)가 또다시 정변으로 권력을 잡았다.',
      '시민들은 신군부의 퇴진과 민주화를 요구하며 시위에 나섰다.',
    ],
    options: [
      { id: 'a', label: '시위 소식을 더 알아보려고 신문을 읽는다.', delta: { info: 1 } },
      { id: 'b', label: '시위에 나선 사람들의 이야기를 들어 본다.', delta: { join: -1 } },
      { id: 'c', label: '일터에서 일하며 조용히 상황을 지켜본다.', delta: { home: 1 } },
    ],
    covers: [54],
  },
  {
    id: 'c3-s03', chapter: 3, kind: 'story', bg: '1980-alley', portrait: 'y30', speaker: '나',
    text: [
      '1980년 5월, 광주에서 대규모 민주화 시위가 일어났고, 이를 5·18 민주화 운동이라 한다.',
      '계엄군(국가 비상사태 때 질서를 지키려고 두는 군대)이 투입되어 시위를 폭력적으로 진압했고, 많은 시민이 희생됐다.',
      '시민들은 시민군을 만들어 맞섰다.',
    ],
    options: [
      { id: 'a', label: '광주에 사는 친척의 안부가 걱정된다.', delta: { home: -1 } },
      { id: 'b', label: '맞서는 사람들을 마음속으로 응원한다.', delta: { join: 1 } },
    ],
    covers: [55],
  },
  {
    id: 'c3-s04', chapter: 3, kind: 'story', bg: '1980-alley', portrait: 'y30', speaker: '나',
    text: [
      '계엄군은 도로를 막고 신문과 방송까지 통제했다.',
      '방송은 광주 시민을 폭도라고 했다.',
      '이 소식을 어떻게 받아들여야 할까?',
    ],
    options: [
      { id: 'a', label: '방송에서 그렇게 말하니 폭도가 맞겠지.', delta: { home: 1 }, misconception: 'M14' },
      { id: 'b', label: '방송만 믿지 않고 다른 소식도 찾아본다.', delta: { info: -1 }, flag: 'checked_news' },
    ],
    covers: [56], misconceptions: ['M14'],
  },
  {
    id: 'c3-s05', chapter: 3, kind: 'story', bg: '1980-alley', portrait: 'y30', speaker: '나',
    text: [
      '길이 막혀 있었지만 독일 기자 힌츠페터 같은 외국인 기자들이 목숨을 걸고 진실을 알렸다.',
      '광주 시민들도 광주 소식을 다른 지역에 알리려 애썼다.',
      '광주의 소식을 알리려 한 쪽은 누구였을까?',
    ],
    options: [
      { id: 'a', label: '계엄군이 소식을 알리려 애썼을 거야.', delta: { join: -1 }, misconception: 'M24' },
      { id: 'b', label: '알린 사람은 시민과 외국인 기자들이야.', delta: { info: 1 } },
    ],
    covers: [56], misconceptions: ['M24'],
  },
  {
    id: 'c3-s06', chapter: 3, kind: 'culture', bg: '1980-tv', portrait: 'y30', speaker: '나',
    text: [
      '1980년 컬러텔레비전이 처음 시판되었고, 집집마다 텔레비전·냉장고·세탁기가 늘었다.',
      '사람들은 라디오와 텔레비전으로 가요·영화·드라마를 즐겼고, 1982년에는 프로 야구도 시작됐다.',
      '대중문화는 왜 이 무렵 크게 자랐을까?',
    ],
    options: [
      { id: 'a', label: '수출이 늘어 소득이 오르고 대중 매체가 퍼져서', delta: { home: 1 } },
      { id: 'b', label: '사람들이 모두 농촌으로 돌아가 농사를 지어서', delta: { join: -1 } },
      { id: 'c', label: '학교의 모든 수업을 방송으로만 하게 되어서', delta: { info: 1 } },
    ],
    culture: {
      answer: 'a',
      why: [
        '수출 규모가 커지며 국민 소득이 늘고 생활 수준이 좋아졌어요.',
        '텔레비전·냉장고 같은 가전이 보급되고 라디오·텔레비전 같은 대중 매체가 퍼지면서 대중문화가 성장했어요.',
      ],
    },
    covers: [67],
  },
  {
    id: 'c3-s07', chapter: 3, kind: 'judge', bg: '1980-alley', portrait: 'y30', judge: 'source',
    text: [
      '라디오, 신문, 편지처럼 정보를 주고받는 수단을 미디어라고 한다. 같은 날 들려온 소식 네 장이 있다.',
      '신문과 방송은 많은 사람에게 신속하게 전하지만 틀릴 수도 있고, 사실과 다르게 꾸민 허위 조작 정보는 잘못된 여론을 만들어 민주주의를 위협한다.',
      '기준 4개를 하나씩 체크하고, 이 소식을 얼마나 믿을 수 있는지 골라 보자.',
    ],
    options: [], covers: [30, 31, 37, 40, 41, 44, 56], misconceptions: ['M14', 'M18', 'M19', 'M24'],
  },
  {
    id: 'c3-s08', chapter: 3, kind: 'compare', bg: '1980-tv', portrait: 'y30', compare: 3,
    text: ['그때의 소식 전달과 오늘의 정보를 나란히 놓고 비교해 보자.'],
    options: [], covers: [36, 37, 38, 39, 40, 42, 43, 45, 46], misconceptions: ['M15', 'M16', 'M17'],
  },
  {
    id: 'c3-s09', chapter: 3, kind: 'retry', bg: '1980-alley', portrait: 'y30',
    text: ['지난 장에서 헷갈렸던 문제를 한 번 더 살펴보자.'],
    options: [], covers: [],
  },

  // ───────── 4장 · 1987 6월, 그리고 12월 ─────────
  {
    id: 'c4-s01', chapter: 4, kind: 'title', bg: '1987-myeongdong', portrait: 'y37',
    text: ['4장 · 1987 6월, 그리고 12월', '대통령을 선거인단이 뽑는 간선제가 이어지고, 언론은 통제를 받던 해다.'],
    options: [], covers: [57],
  },
  {
    id: 'c4-s02', chapter: 4, kind: 'story', bg: '1987-myeongdong', portrait: 'y37', speaker: '나',
    text: [
      '{{flag:knows_source|소문과 방송을 기준으로 따져 보는 버릇이 생겼다. }}1987년 1월, 대학생 박종철이 경찰의 고문으로 사망했다.',
      '사람들은 대통령을 직접 뽑도록 헌법을 고치자고 요구하기 시작했다.',
    ],
    options: [
      { id: 'a', label: '추모 집회 소식을 더 알아본다.', delta: { info: 1 } },
      { id: 'b', label: '동료들과 이 일을 이야기해 본다.', delta: { join: -1 } },
    ],
    covers: [58],
  },
  {
    id: 'c4-s03', chapter: 4, kind: 'story', bg: '1987-myeongdong', portrait: 'y37', speaker: '나',
    text: [
      '4월 13일, 정부는 직선제 요구를 받아들이지 않고 간선제를 유지하겠다고 발표했다.',
      '화가 난 시위는 오히려 전국으로 번졌다.',
      '6월에는 전국 곳곳에서 독재에 반대하고 직선제를 요구하는 시위가 이어졌고, 훗날 이를 6월 민주 항쟁이라 부르게 되었다.',
    ],
    options: [
      { id: 'a', label: '신문과 방송이 전하는 내용을 비교해 본다.', delta: { info: -1 } },
      { id: 'b', label: '회사 동료들과 시위 소식을 서로 나눈다.', delta: { join: 1 } },
      { id: 'c', label: '도청에서 시민군이 끝까지 맞선 일이 이거죠?', delta: { home: 1 }, misconception: 'M26' },
    ],
    covers: [58], misconceptions: ['M26'],
  },
  {
    id: 'c4-s04', chapter: 4, kind: 'story', bg: '1987-myeongdong', portrait: 'y37', speaker: '나',
    text: [
      '6월의 저녁, 명동 성당 앞은 사람들로 가득했다.',
      '횃불이 보이고, 함성이 들리고, 코끝에는 최루탄 냄새가 났다.',
      '그 속에서 나는 어떤 마음이었을까?',
    ],
    options: [
      { id: 'a', label: '나도 거리로 나가 목소리를 보태고 싶다.', delta: { join: 1 } },
      { id: 'b', label: '집에 가서 가족에게 이 일을 알려야겠다.', delta: { info: -1 } },
      { id: 'c', label: '내일 일터에 가야 하니 조용히 돌아간다.', delta: { home: 1 } },
    ],
    covers: [60],
  },
  {
    id: 'c4-s05', chapter: 4, kind: 'story', bg: '1987-myeongdong', portrait: 'y37', speaker: '나',
    text: [
      '정부가 마침내 직선제를 포함한 민주화 요구를 받아들였다. 6월 29일이었다.',
      '옆집 아저씨가 웃으며 말한다. "이제 대통령을 우리 손으로 직접 뽑게 됐네요."',
      '12월 대통령 선거 이야기가 나오자 사람들이 저마다 한마디씩 한다.',
    ],
    options: [
      { id: 'a', label: '이번 대통령 선거에는 꼭 투표하러 가겠다.', delta: { join: -1 } },
      { id: 'b', label: '내 한 표쯤 빠져도 달라지는 건 없겠지.', delta: { home: 1 }, misconception: 'M20' },
    ],
    covers: [58], misconceptions: ['M20'],
  },
  {
    id: 'c4-s06', chapter: 4, kind: 'story', bg: '1987-poll', portrait: 'y37', speaker: '나',
    text: [
      '12월 16일, 16년 만에 대통령을 직접 뽑는 투표소 앞에 사람들의 긴 행렬이 이어진다.',
      '선거는 국민의 주권을 실현하는 가장 기본적인 방법이라던 말이 떠오른다.',
      '1960년 그날의 투표소를 떠올리며 생각한다. 지금 우리가 대통령을 직접 뽑게 된 것은 어느 일의 결과일까?',
    ],
    options: [
      { id: 'a', label: '6월 민주 항쟁의 결과라고 나는 생각해요.', delta: { join: 1 }, flag: 'knows_direct' },
      { id: 'b', label: '5·18 민주화 운동의 결과라고 생각해요.', delta: { info: -1 }, misconception: 'M25' },
    ],
    covers: [6, 59], misconceptions: ['M25'],
  },
  {
    id: 'c4-s07', chapter: 4, kind: 'culture', bg: '1987-myeongdong', portrait: 'y37', speaker: '나',
    text: [
      '1980년대에는 기술 연구와 개발이 늘어 자동차·정밀 기계·전자 제품을 만들었고, 1986년에는 국산 자동차를 처음 미국에 수출했다.',
      '승용차를 가진 집은 1981년 26.8만 대에서 1990년 207.5만 대로 크게 늘었다.',
      '승용차가 이렇게 늘어난 까닭은 무엇일까?',
    ],
    options: [
      { id: 'a', label: '외국에서 자동차를 모두 공짜로 나눠 주어서', delta: { home: 1 } },
      { id: 'b', label: '수출이 늘어 국민 소득과 생활 수준이 높아져서', delta: { info: -1 } },
      { id: 'c', label: '도시에서 농촌으로 이사하는 사람들이 늘어서', delta: { join: 1 } },
    ],
    culture: {
      answer: 'b',
      why: [
        '수출 규모가 커지며 국민 소득이 급증하고 생활 수준이 좋아졌어요.',
        '그래서 자동차를 사는 집이 늘었어요. 이 시기에 자동차·정밀 기계·전자 제품이 발달했어요.',
      ],
    },
    covers: [65, 67],
  },
  {
    id: 'c4-s08', chapter: 4, kind: 'judge', bg: '1987-poll', portrait: 'y37', judge: 'pledge',
    text: [
      '투표소 벽보에 후보 세 사람의 공약이 붙어 있다. 선거는 국민이 대표를 투표로 뽑는 일이고, 민주주의의 꽃이라고 한다.',
      '채점표의 9칸을 먼저 채우고, 점수가 가장 높은 후보에게 투표하자.',
    ],
    options: [], covers: [3, 14, 59],
  },
  {
    id: 'c4-s09', chapter: 4, kind: 'compare', bg: '1987-poll', portrait: 'y37', compare: 4,
    text: ['그때의 직접 선거와 오늘의 선거를 나란히 놓고 비교해 보자.'],
    options: [], covers: [5, 6, 7, 8, 9],
  },
  {
    id: 'c4-s10', chapter: 4, kind: 'retry', bg: '1987-myeongdong', portrait: 'y37',
    text: ['지난 장에서 헷갈렸던 문제를 한 번 더 살펴보자.'],
    options: [], covers: [],
  },

  // ───────── 에필로그 · 오늘 ─────────
  {
    id: 'c5-s01', chapter: 5, kind: 'title', bg: 'today-street', portrait: 'old',
    text: ['에필로그 · 오늘', '사진첩을 펼쳐 내 삶의 장면들을 이어 본다.'],
    options: [], covers: [71],
  },
  {
    id: 'c5-s02', chapter: 5, kind: 'story', bg: 'today-street', portrait: 'old', speaker: '나',
    text: [
      '{{flag:knows_pledge|채점표로 공약을 따져 투표했던 날이 떠오른다. }}오늘 나는 손주와 투표소 앞에 선다.',
      '투표는 만 18세 이상만 할 수 있어서, 손주는 옛날 투표소가 궁금하다며 나를 쳐다본다.',
    ],
    options: [
      { id: 'a', label: '1960년 투표소에서 본 일을 들려준다.', delta: { join: 1 } },
      { id: 'b', label: '사진첩을 펼쳐 내 삶의 장면을 보여 준다.', delta: { info: -1 } },
      { id: 'c', label: '손주와 함께 선거 안내문을 읽어 본다.', delta: { home: 1 } },
    ],
    covers: [4, 71],
  },
  {
    id: 'c5-s03', chapter: 5, kind: 'culture', bg: 'today-street', portrait: 'old', speaker: '나',
    text: [
      '사진첩에는 아파트, 고속 국도, 컬러텔레비전, 프로 야구 장면이 가득하다.',
      '산업화로 생활은 크게 달라졌지만, 좋은 일만 있었던 것은 아니다.',
      '산업화는 성과와 한계를 함께 남겼다. 다음 중 한계는 무엇일까?',
    ],
    options: [
      { id: 'a', label: '경부 고속 국도가 열려 하루에 오갈 수 있게 되었다.', delta: { join: -1 } },
      { id: 'b', label: '가전제품과 대중문화가 널리 퍼져 인기를 끌게 되었다.', delta: { info: -1 } },
      { id: 'c', label: '일자리와 주택이 모자라 달동네가 생기고 소득 차이가 커졌다.', delta: { home: 1 } },
    ],
    culture: {
      answer: 'c',
      why: [
        '아파트, 고속 국도, 가전, 대중문화는 산업화의 성과예요.',
        '일자리와 주택 부족, 달동네, 도시와 농촌의 소득 격차, 길고 힘든 노동은 산업화의 한계예요.',
      ],
    },
    covers: [70],
  },
  {
    id: 'c5-s04', chapter: 5, kind: 'judge', bg: 'today-street', portrait: 'old', judge: 'organ',
    text: [
      '손주가 묻는다. "국회, 행정부, 법원은 각각 무슨 일을 해요?"',
      '하는 일 카드를 알맞은 기관에 놓고, 서로 견제하는 방향도 이어 보자.',
    ],
    options: [], covers: [18, 19, 20, 21, 22, 23, 24, 27], misconceptions: ['M8', 'M9', 'M10', 'M13'],
  },
  {
    id: 'c5-s05', chapter: 5, kind: 'compare', bg: 'today-street', portrait: 'old', compare: 5,
    text: ['그때와 오늘, 미디어와 시민의 역할을 나란히 놓고 비교해 보자.'],
    options: [], covers: [29, 30, 31, 32, 33, 34, 35, 36, 59],
  },
];
