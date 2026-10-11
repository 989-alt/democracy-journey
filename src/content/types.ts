// 콘텐츠 타입 — harness/state/democracy-journey/interfaces-03.md "콘텐츠 타입" 그대로.
export type Chapter = 1 | 2 | 3 | 4 | 5; // 5 = 에필로그
export type StatKey = 'join' | 'info' | 'home'; // 참여·정보·살림, 각 0~3
export type Stats = Record<StatKey, number>;
export type Face = 'calm' | 'joy' | 'worry';
export type PortraitAge = 'y10' | 'y20' | 'y30' | 'y37' | 'old';
export type BgId =
  | 'title'
  | '1960-room'
  | '1960-poll'
  | '1960-street'
  | '1960s-factory'
  | '1970s-hill'
  | '1970-highway'
  | '1970s-apt'
  | '1980-alley'
  | '1980-tv'
  | '1987-myeongdong'
  | '1987-poll'
  | 'today-street';
export type JudgeKind = 'poll' | 'appeal' | 'source' | 'pledge' | 'organ';
export type SceneKind = 'story' | 'culture' | 'judge' | 'compare' | 'retry' | 'title';

export interface Option {
  id: string; // 장면 안 유일, 'a'|'b'|'c'
  label: string; // 카드 본문 1문장
  delta: Partial<Stats>; // ±1, 없으면 0
  lock?: { stat: StatKey; min: number }; // 장면당 최대 1개
  flag?: string; // 켜는 플래그
  next?: string; // 다음 장면 id 변주. 없으면 순서대로
  misconception?: string; // 이 선택이 드러내는 오개념 'M14' 등 (피드백 copy 키와 같음)
}
export interface Scene {
  id: string; // 'c1-s01' 형식 (chapter-순번)
  chapter: Chapter;
  kind: SceneKind;
  bg: BgId;
  portrait: PortraitAge;
  speaker?: string; // 대사 화자 라벨
  text: string[]; // 2~3문장. '{{flag:asked_why|변주문장}}' 토큰 허용
  options: Option[]; // story/culture 2~3개. 나머지는 []
  judge?: JudgeKind; // kind==='judge'
  compare?: number; // kind==='compare', 1~5
  culture?: { answer: string; why: string[] }; // kind==='culture'
  covers: number[]; // 교과분석 지도 내용 번호
  misconceptions?: string[]; // 이 장면이 다루는 오개념
}

// 판별 자료
export interface PollSpot { id: string; x: number; y: number; w: number; h: number; violation: string | null; explain: string } // 좌표 = 1536×1024 그림 기준 px, violation null = 함정
export interface AppealCard { id: 'assembly' | 'court' | 'press' | 'neighbor'; title: string; back: string }
export interface SourceCard { id: 'radio' | 'letter' | 'photo' | 'rumor'; source: string; date: string; text: string; answerChecks: [boolean, boolean, boolean, boolean]; answerTrust: 'low' | 'mid' | 'high'; feedback: string }
export interface Candidate { id: string; name: string; pledges: [string, string, string]; truth: [number, number, number] } // truth = 기준 3(구체·실천 가능·국민 요구) 모범 점수 1~5
export interface OrganCard { id: string; label: string; organ: 'assembly' | 'executive' | 'court'; icon: string }
export interface CheckCard { id: 'audit' | 'veto' | 'nullify'; label: string; from: 'assembly' | 'executive' | 'court'; to: 'assembly' | 'executive' | 'court'; icon: string }
export interface Judges {
  poll: { spots: PollSpot[] }; // 6 (위반 4 + 함정 2)
  appeal: { situation: string; cards: AppealCard[]; why: { id: string; label: string; correct: boolean; misconception?: string }[] };
  source: { cards: SourceCard[]; criteria: [string, string, string, string] };
  pledge: { candidates: Candidate[]; criteria: [string, string, string] };
  organ: { cards: OrganCard[]; checks: CheckCard[] }; // 8 + 3
}
export interface Compare { n: 1 | 2 | 3 | 4 | 5; title: string; then: string; today: string[]; covers: number[] }
export interface TimelineEvent { year?: number; label: string; chapter: Chapter }
