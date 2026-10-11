# 03 공유 인터페이스 — democracy-journey

계약(T01~T08)이 서로 모르는 경계를 여기서 고정한다. 서브에이전트는 자기 계약 JSON + 이 파일만 읽는다. PRD(`docs/democracy-journey/PRD.md`)가 상위 권위, 이 파일은 그 타입 표현이다. 어긋나면 PRD 가 이긴다. 바꿔야 하면 바꾸고 `ledger-03.md` 에 Ruling 으로 남긴다.

## 폴더

```
democracy-journey/
  src/main.tsx  app.tsx  vite-env.d.ts  debug.ts
  src/styles/tokens.css base.css        # T01. tokens.css 값은 docs/democracy-journey/tokens.json themes.watercolor
  src/content/{types,scenes,judges,compares,cultures,timeline,copy,index}.ts   # T02
  src/engine/{state,reducer,judge,verdict,save,rng,summary}.ts               # T03 (+summary T06)
  src/ui/{Title,Scene,ChapterTitle,Gauge,Card,Portrait,Toast,Hint,Result,Timeline,Mute}.tsx scene.css result.css  # T04 T06 T07
  src/ui/judge/{Poll,Appeal,Source,Pledge,Organ,Compare,Retry}.tsx judge.css drag.ts        # T05
  src/assets/index.ts  src/assets/img/*.webp  src/assets/bgm/*.ogg  src/assets/fonts/*.woff2  # T07
  src/audio/audio.ts                                                           # T07
  tests/e2e/{playthrough.spec,helpers}.ts                                      # T08
```

## 콘텐츠 타입 (`src/content/types.ts`, T02 가 쓰고 T03~T08 이 import)

```ts
export type Chapter = 1 | 2 | 3 | 4 | 5;                 // 5 = 에필로그
export type StatKey = 'join' | 'info' | 'home';         // 참여·정보·살림, 각 0~3
export type Stats = Record<StatKey, number>;
export type Face = 'calm' | 'joy' | 'worry';
export type PortraitAge = 'y10' | 'y20' | 'y30' | 'y37' | 'old';
export type BgId = 'title'|'1960-room'|'1960-poll'|'1960-street'|'1960s-factory'|'1970s-hill'|'1970-highway'|'1970s-apt'|'1980-alley'|'1980-tv'|'1987-myeongdong'|'1987-poll'|'today-street';
export type JudgeKind = 'poll' | 'appeal' | 'source' | 'pledge' | 'organ';
export type SceneKind = 'story' | 'culture' | 'judge' | 'compare' | 'retry' | 'title';

export interface Option {
  id: string;                       // 장면 안 유일, 'a'|'b'|'c'
  label: string;                    // 카드 본문 1문장
  delta: Partial<Stats>;            // ±1, 없으면 0
  lock?: { stat: StatKey; min: number };   // 장면당 최대 1개
  flag?: string;                    // 켜는 플래그 (예: 'asked_why')
  next?: string;                    // 다음 장면 id 변주. 없으면 순서대로
  misconception?: string;           // 이 선택이 드러내는 오개념 'M14' 등 (피드백 copy 키와 같음)
}
export interface Scene {
  id: string;                       // 'c1-s01' 형식 (chapter-순번)
  chapter: Chapter;
  kind: SceneKind;
  bg: BgId;
  portrait: PortraitAge;
  speaker?: string;                 // 대사 화자 라벨 ('아버지', '라디오', '나')
  text: string[];                   // 2~3문장. '{{flag:asked_why|변주문장}}' 토큰 허용 — 플래그 있으면 변주문장 삽입, 없으면 빈 문자열
  options: Option[];                // story/culture 2~3개. judge/compare/retry/title 은 []
  judge?: JudgeKind;                // kind==='judge' 일 때
  compare?: number;                 // kind==='compare' 일 때 1~5
  culture?: { answer: string; why: string[] };  // kind==='culture': options 중 정답 id, 까닭 해설
  covers: number[];                 // 교과분석 지도 내용 번호
  misconceptions?: string[];        // 이 장면이 다루는 오개념
}

// 판별 자료
export interface PollSpot { id: string; x: number; y: number; w: number; h: number; violation: string | null; explain: string }  // 좌표 = 1536×1024 그림 기준 px, violation null = 함정
export interface AppealCard { id: 'assembly'|'court'|'press'|'neighbor'; title: string; back: string }
export interface SourceCard { id: 'radio'|'letter'|'photo'|'rumor'; source: string; date: string; text: string; answerChecks: [boolean,boolean,boolean,boolean]; answerTrust: 'low'|'mid'|'high'; feedback: string }
export interface Candidate { id: string; name: string; pledges: [string,string,string]; truth: [number,number,number] }  // truth = 기준 3(구체·실천 가능·국민 요구) 모범 점수 1~5
export interface OrganCard { id: string; label: string; organ: 'assembly'|'executive'|'court'; icon: string }
export interface CheckCard { id: 'audit'|'veto'|'nullify'; label: string; from: 'assembly'|'executive'|'court'; to: 'assembly'|'executive'|'court'; icon: string }
export interface Judges {
  poll: { spots: PollSpot[] };                                  // 6 (위반 4 + 함정 2)
  appeal: { situation: string; cards: AppealCard[]; why: { id: string; label: string; correct: boolean; misconception?: string }[] };
  source: { cards: SourceCard[]; criteria: [string,string,string,string] };
  pledge: { candidates: Candidate[]; criteria: [string,string,string] };
  organ: { cards: OrganCard[]; checks: CheckCard[] };           // 8 + 3
}
export interface Compare { n: 1|2|3|4|5; title: string; then: string; today: string[]; covers: number[] }
export interface TimelineEvent { year?: number; label: string; chapter: Chapter }   // R11: 오늘 은 연도 없음
```

`copy.ts`: `export const COPY = { ui: {...}, feedback: Record<string,string> /* 'M14' 등 오개념 키·'poll.trap' 등 */, habits: string[] }`.
`index.ts`: `export const CONTENT = { scenes, judges, compares, cultures: Scene[] /* kind culture 만 모음 */, timeline, copy }` 와 `sceneOrder: string[]` (전체 순서, 장 → 장면 순).

## 엔진 (`src/engine/*`, T03)

```ts
export type Stage = 'title' | 'play' | 'done';
export interface LogEvent { t: number; type: 'scene'|'choice'|'judge'|'compare_view'|'culture'|'chapter_end'|'retry'|'restore'; chapter: Chapter; scene?: string; kind?: JudgeKind; item?: string; correct?: boolean; attempt?: number; option?: string; misconception?: string; delta?: Partial<Stats> }
export interface JudgeResult { kind: JudgeKind; items: { item: string; correct: boolean; attempt: number; misconception?: string }[] }
export interface RetryItem { kind: JudgeKind; item: string; attempts: number }   // 치른 다시 보기 횟수 0..2 (원 판별 attempt=1, 다시 보기 attempt=2·3)
export interface State {
  version: 1; seed: number; stage: Stage; sceneIndex: number;  // CONTENT.sceneOrder 인덱스
  stats: Stats; flags: string[]; chosen: Record<string, string>;  // sceneId → optionId
  judges: Partial<Record<JudgeKind, JudgeResult>>; retryQueue: RetryItem[]; log: LogEvent[]; satStep: 0|1|2|3|4;
}
export type Action =
  | { type: 'start'; seed: number; t: number } | { type: 'restore'; state: State; t: number }
  | { type: 'choose'; sceneId: string; optionId: string; t: number }
  | { type: 'next'; t: number }                                   // 대사·비교·타이틀 넘김
  | { type: 'judge'; kind: JudgeKind; answer: JudgeAnswer; t: number }
  | { type: 'retry'; kind: JudgeKind; item: string; correct: boolean; t: number }
  | { type: 'reset'; t: number };
export type JudgeAnswer =
  | { kind: 'poll'; tapped: string[] }
  | { kind: 'appeal'; why: string }
  | { kind: 'source'; cards: Record<string, { checks: boolean[]; trust: 'low'|'mid'|'high' }> }
  | { kind: 'pledge'; scores: Record<string, [number,number,number]>; vote: string }
  | { kind: 'organ'; placed: Record<string, string>; checks: Record<string, string> };
export function reduce(state: State, action: Action): State;      // 순수. Math.random·Date.now 금지(t 는 인자)
export function scoreJudge(kind, answer, judges): JudgeResult;    // judge.ts
export function verdict(log: LogEvent[]): { pass: boolean; fails: string[] }  // verdict.ts, S1~S10 키 'S1'..'S10'
export const SAVE_KEY = 'dj.save.v1'; save(state)/load(): State|null/clear()  // save.ts
export function rng(seed): () => number                          // rng.ts, mulberry32
```

판별 로그 규약(S1~S10 이 읽는다): item id — poll: spot id · appeal: 'why' · source: card id · pledge: 'vote' · organ: 'card:<id>' / 'check:<id>'. pledge 정답 = 플레이어 채점표 총점 최고 후보(R15); 9칸 미완성 judge 액션은 reducer 가 무시(R14). retry 는 judges[kind].items 의 해당 item 을 갱신한다. `judge` 액션 하나가 item 마다 LogEvent `{type:'judge', kind, item, correct, attempt}` 를 남긴다. 오개념 선택은 같은 이벤트에 `misconception` 을 넣는다. 비교 카드 `next` 는 `{type:'compare_view', item:'1'..'5'}`. 장 마지막 장면 `next` 가 `{type:'chapter_end'}` 와 `satStep+1`.

## UI ↔ 엔진 (T04·T05·T06)

`app.tsx` 가 `useReducer(reduce, …)` 하나를 들고 `dispatch` 와 `state` 를 props 로 내린다. 화면 선택은 `stage` 와 현재 장면 `kind`: title → `<Title>`, play+story/culture → `<Scene>`, play+judge → `judge/<Kind>`, play+compare → `<Compare>`, play+retry → `<Retry>`, done → `<Result>`. 자동 저장은 `chapter_end` 와 `judge` 직후 app.tsx 의 effect 에서 `save()`.

색 번짐: `<div class="stage" style="--sat-step: var(--sat-N)">` — 배경 `img.art` 와 `.portrait img` 만 `filter: saturate(var(--sat-step))`. 비교 카드·UI 는 적용 안 함.

## 에셋 키 (`src/assets/index.ts`, T07)

```ts
export const BG: Record<BgId, string>;                        // webp import URL (base64 인라인)
export const PORTRAIT: Record<PortraitAge, Record<Face, string>>;
export const COMPARE: Record<1|2|3|4|5, { then: string; today: string }>;   // 원본 cmp-N 을 중앙선 기준 좌/우로 자른 webp
export const INFO: Record<'radio'|'letter'|'magazine'|'market', string>;
export const ORGAN: Record<string, string>;                   // organ-law … check-nullify, organ-ballotbox
export const UI: Record<'card-raised'|'card-pressed'|'card-locked'|'btn-cloth'|'btn-paper'|'tag-apricot'|'dialog-panel'|'topbar-strip'|'portrait-frame'|'note-pin', string>;
export const ICON: Record<string, string>;                    // 키 'hand' 'magnifier' … 'pen' (16, 접두 없음 — R17)
export const BGM: Record<1|2|3|4|5, string>;                  // ogg 30초 루프
```
원본: `democracy-journey/assets/img/*.png`, `assets/img/kit/*.png`, `시안/democracy-journey/ui/kit/*.png`, `assets/bgm/*.mp3`. T07 이 webp/ogg 로 변환해 `src/assets/` 에 둔다(원본은 건드리지 않는다). T04·T05·T06 은 T07 전에는 `src/assets/index.ts` 가 없으므로 **같은 키 이름의 플레이스홀더 모듈을 쓰지 말고** `import { BG } from '../assets'` 를 그대로 쓴다 — T07 전까지 typecheck 가 깨지지 않도록 T01 이 `src/assets/index.ts` 를 **빈 상수(모두 '')** 로 미리 만든다(T01 allowed_files 에 추가 — Ruling R1).

UI 스타일: 9-slice 수치·클래스 이름은 `시안/democracy-journey/2-수채-kit.css` 를 그대로 옮긴다(경로만 import URL 로). 토큰 이름은 `docs/democracy-journey/tokens.json` → `--background --card --primary --stat-join --judge-correct --trust-low --sat-0..4 --font-display …` (tokens.css 에서 선언). hex 하드코딩 금지.

## 공통 제약(모든 계약)

- 의존성: vite, preact, typescript, vitest, @playwright/test, @preact/preset-vite, vite-plugin-singlefile 외 추가 금지.
- 앱은 네트워크 호출 0, 외부 URL 0, PII 0, 학생 입력 0.
- 용어·묘사 상한: PRD §4.9. '유신' 은 2장 어른 대사 1줄에만.
- 글자는 DOM 에만. 그림에 글자 넣지 않는다.
- 한국어 UI 문구, 본문 20px 이상.

## 최종 리뷰 반영 (2026-10-11, R28~R32)

- `judge` 액션은 채점·기록만 하고 전진하지 않는다. judge 장면에서 `next` 는 `judges[kind]` 가 있을 때만 전진(R30). UI 피드백은 `state.judges[kind]` 에서 읽는다.
- `retry` 는 현재 장면 kind 가 'retry' 일 때만 받는다. 다시 보기 장면은 큐의 poll/appeal/source 문항(attempts<2)을 전부 차례로 묻는다. pledge·organ 재출제 없음(R29).
- 생활 문화: 첫 선택 확정, 메모 = 맞음/틀림 + 정답 라벨 + why, 수치 칩 숨김(R28). 이야기 선택 오개념(M14·M25)은 교정 메모 뒤 choose(R31).
- 타이틀의 저장본 상태는 start·reset 시 지운다(R32).
- 구현 확정(T10): `retryTargets(queue, log, chapter)` 는 engine/state.ts — poll·appeal·source, attempts<2, **지난 장의 판별만**, 이 장에서 이미 답한 문항 제외. 리듀서 retry 도 같은 함수로 거른다. `JudgeProps = { scene, result?, onJudge, onNext }`. verdict.ts 가 `JUDGE_KINDS`·`finals` export. `POLL_W/POLL_H` 는 drag.ts. R31 교정 메모는 misconception 이 있는 story 선택지 전부.
