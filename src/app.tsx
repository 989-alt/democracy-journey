import { useEffect, useReducer, useRef, useState } from 'preact/hooks';
import { ICON, UI } from './assets';
import { sfx, unlock, playBgm } from './audio/audio';
import type { Face, JudgeKind, Option } from './content/types';
import { holds, reduce } from './engine/reducer';
import { clear, load, save } from './engine/save';
import { currentScene, initialState, isLocked } from './engine/state';
import type { Action, JudgeAnswer } from './engine/state';
import { ChapterTitle } from './ui/ChapterTitle';
import { Appeal } from './ui/judge/Appeal';
import { Compare } from './ui/judge/Compare';
import { Organ } from './ui/judge/Organ';
import { Pledge } from './ui/judge/Pledge';
import { Poll } from './ui/judge/Poll';
import { Retry } from './ui/judge/Retry';
import { Source } from './ui/judge/Source';
import type { JudgeProps } from './ui/judge/drag';
import { Mute } from './ui/Mute';
import { Result } from './ui/Result';
import { faceFor } from './ui/Portrait';
import { Scene } from './ui/Scene';
import { Title } from './ui/Title';
import { Toast } from './ui/Toast';
import { COPY } from './content/copy';
import './ui/scene.css';

const SEED = Date.now();

// 9-slice 이미지 URL 은 import 된 에셋이라 CSS 변수로 내려보낸다(scene.css 는 var(--img-*) 만 쓴다).
const IMG_VARS = {
  '--img-card': `url(${UI['card-raised']})`,
  '--img-card-pressed': `url(${UI['card-pressed']})`,
  '--img-card-locked': `url(${UI['card-locked']})`,
  '--img-btn-cloth': `url(${UI['btn-cloth']})`,
  '--img-btn-paper': `url(${UI['btn-paper']})`,
  '--img-dialog': `url(${UI['dialog-panel']})`,
  '--img-topbar': `url(${UI['topbar-strip']})`,
  '--img-portrait': `url(${UI['portrait-frame']})`,
  '--img-note': `url(${UI['note-pin']})`,
  '--img-tag': `url(${UI['tag-apricot']})`,
  '--img-arrow': `url(${ICON.arrow})`,
};

const JUDGE_SCREEN: Record<JudgeKind, (p: JudgeProps) => preact.JSX.Element> = { poll: Poll, appeal: Appeal, source: Source, pledge: Pledge, organ: Organ };

export function App() {
  // 저장본이 있어도 항상 title 에서 시작한다 → '이어하기' 버튼이 restore 를 보낸다.
  const [state, dispatch] = useReducer(reduce, undefined, () => initialState(SEED));
  const [face, setFace] = useState<Face>('calm');
  const [toast, setToast] = useState(0);
  const faceTimer = useRef<ReturnType<typeof setTimeout>>();
  // R32: 저장본은 state 로 들고 있다가 '시작'·'다시하기' 때 지운다(지운 저장본이 이어하기로 되살아나지 않게).
  const [saved, setSaved] = useState(() => load());

  const sc = currentScene(state);
  const chapter = sc.chapter;
  const next = () => dispatch({ type: 'next', t: Date.now() });
  // R28·R31(QA r1 #2): 메모는 기록된 선택(state.chosen)으로 그린다 → 새로고침해도 첫 답·메모가 그대로다.
  const chosenOpt = (sc.kind === 'story' || sc.kind === 'culture') ? sc.options.find((o) => o.id === state.chosen[sc.id]) : undefined;
  const picked = state.stage === 'play' && chosenOpt && holds(sc, chosenOpt) ? chosenOpt.id : null;

  useEffect(() => {
    const once = () => { unlock(); window.removeEventListener('pointerdown', once); };
    window.addEventListener('pointerdown', once);
    return () => window.removeEventListener('pointerdown', once);
  }, []);

  useEffect(() => {
    if (state.stage === 'play') void playBgm(chapter).catch(() => {});
  }, [state.stage, chapter]);

  // PRD §9(QA r1 #0): 로그가 늘 때마다·단계가 바뀔 때마다 저장. 토스트는 장 끝·판별·완주 때만.
  // 로그가 빈 '시작' 직후는 저장하지 않는다(R32: 시작은 저장본을 지운다 — 첫 기록부터 다시 쌓인다).
  const lastEvt = state.log[state.log.length - 1];
  useEffect(() => {
    if (state.stage === 'title' || state.log.length === 0) return;
    save(state);
    if (state.stage === 'done' || lastEvt?.type === 'chapter_end' || lastEvt?.type === 'judge') setToast((n) => n + 1);
  }, [state.log.length, state.stage]);

  useEffect(() => () => clearTimeout(faceTimer.current), []);

  const showFace = (delta: Option['delta']) => {
    setFace(faceFor(delta));
    clearTimeout(faceTimer.current);
    faceTimer.current = setTimeout(() => setFace('calm'), 1200);
  };

  // 첫 선택이 확정이다(R28): 메모가 떠 있는 동안 다른 카드·숫자키는 무시한다.
  const choose = (optionId: string) => {
    if (state.stage !== 'play' || (sc.kind !== 'story' && sc.kind !== 'culture') || picked) return;
    const opt = sc.options.find((o) => o.id === optionId);
    if (!opt || isLocked(opt, state.stats) || state.chosen[sc.id] !== undefined) return;
    // 생활 문화·오개념 선택지도 즉시 choose(기록·자동 저장) — 리듀서가 장면에 머물게 하고 메모를 띄운다.
    sfx(sc.kind === 'culture' ? (optionId === sc.culture?.answer ? 'correct' : 'wrong') : 'tap');
    showFace(opt.delta);
    dispatch({ type: 'choose', sceneId: sc.id, optionId, t: Date.now() });
  };

  // 메모의 '다음' = next (리듀서는 기록된 선택이 있을 때만 넘긴다)
  // 연타 가드: 같은 장면에서 두 번째 '다음' 이 다음 장면(장 제목 등)까지 넘기지 않게 장면 id 로 한 번만 보낸다.
  const confirmed = useRef<string | null>(null);
  useEffect(() => { confirmed.current = null; }, [sc.id, state.stage]);
  const confirm = () => {
    if (!picked || confirmed.current === sc.id) return;
    confirmed.current = sc.id;
    next();
  };

  // keydown 은 한 번만 등록하고 최신 값은 ref 로 읽는다.
  const latest = useRef({ sc, picked, choose, confirm, next });
  latest.current = { sc, picked, choose, confirm, next };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const { sc, picked, choose, confirm, next } = latest.current;
      if (e.key >= '1' && e.key <= '3') {
        const o = sc.options[Number(e.key) - 1];
        if (o) choose(o.id);
      } else if (e.key === 'Enter' && picked && (sc.kind === 'culture' || sc.kind === 'story')) {
        e.preventDefault();
        confirm();
      } else if (e.key === 'Enter' && (sc.kind === 'judge' || sc.kind === 'compare' || sc.kind === 'retry')) {
        // 판별·비교·다시 보기: Enter = 화면의 주 버튼(data-primary). 버튼·체크박스 위의 Enter 는 그 요소가 처리한다.
        if (e.target instanceof HTMLButtonElement || e.target instanceof HTMLInputElement) return;
        const b = document.querySelector<HTMLButtonElement>('.stage [data-primary]:not([disabled]):not([aria-disabled="true"])');
        if (b) { e.preventDefault(); b.click(); }
      } else if (e.key === 'Enter' && !(e.target instanceof HTMLButtonElement)) {
        next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  let screen;
  if (state.stage === 'title') {
    screen = (
      <Title
        resumeChapter={saved ? currentScene(saved).chapter : null}
        onStart={() => { sfx('tap'); clear(); setSaved(null); dispatch({ type: 'start', seed: SEED, t: Date.now() }); }}
        onResume={() => { sfx('tap'); if (saved) dispatch({ type: 'restore', state: saved, t: Date.now() }); }}
      />
    );
  } else if (state.stage === 'done') {
    const resultDispatch = (a: Action) => { if (a.type === 'reset') setSaved(null); dispatch(a); }; // clearAndReset 이 clear() 한다
    screen = <Result state={state} dispatch={resultDispatch} />;
  } else if (sc.kind === 'story' || sc.kind === 'culture') {
    screen = <Scene scene={sc} state={state} face={face} picked={picked} onChoose={choose} onConfirm={confirm} />;
  } else if (sc.kind === 'title') {
    screen = <ChapterTitle scene={sc} onDone={next} />;
  } else if (sc.kind === 'judge' && sc.judge) {
    // R30: judge 액션은 채점·기록만(곧바로 자동 저장), 화면은 state.judges[kind] 로 피드백을 그리고 '다음' 이 next 를 보낸다.
    const Judge = JUDGE_SCREEN[sc.judge];
    const kind = sc.judge;
    screen = <Judge key={sc.id} scene={sc} result={state.judges[kind]} onJudge={(answer: JudgeAnswer) => dispatch({ type: 'judge', kind, answer, t: Date.now() })} onNext={next} />;
  } else if (sc.kind === 'compare') {
    screen = <Compare key={sc.id} scene={sc} onNext={next} />;
  } else {
    screen = <Retry key={sc.id} scene={sc} state={state} onRetry={(kind, item, correct) => dispatch({ type: 'retry', kind, item, correct, t: Date.now() })} onNext={next} />;
  }

  return (
    <div class="stage" style={{ ...IMG_VARS, '--sat-step': `var(--sat-${state.satStep})` }}>
      {screen}
      <div class="mute"><Mute /></div>
      <Toast n={toast} text={COPY.ui.saved} />
    </div>
  );
}
