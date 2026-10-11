import { useEffect, useReducer, useRef, useState } from 'preact/hooks';
import { ICON, UI } from './assets';
import { sfx, unlock, playBgm } from './audio/audio';
import type { Face, Option } from './content/types';
import { reduce } from './engine/reducer';
import { load, save } from './engine/save';
import { currentScene, initialState, isLocked } from './engine/state';
import { ChapterTitle } from './ui/ChapterTitle';
import { Mute } from './ui/Mute';
import { faceFor } from './ui/Portrait';
import { Scene } from './ui/Scene';
import { Title } from './ui/Title';
import { Toast } from './ui/Toast';
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
  '--img-arrow': `url(${ICON.arrow})`,
};

export function App() {
  // 저장본이 있어도 항상 title 에서 시작한다 → '이어하기' 버튼이 restore 를 보낸다.
  const [state, dispatch] = useReducer(reduce, undefined, () => initialState(SEED));
  const [face, setFace] = useState<Face>('calm');
  const [toast, setToast] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const faceTimer = useRef<ReturnType<typeof setTimeout>>();
  const [saved] = useState(() => load());

  const sc = currentScene(state);
  const chapter = sc.chapter;
  const next = () => dispatch({ type: 'next', t: Date.now() });

  useEffect(() => {
    const once = () => { unlock(); window.removeEventListener('pointerdown', once); };
    window.addEventListener('pointerdown', once);
    return () => window.removeEventListener('pointerdown', once);
  }, []);

  useEffect(() => {
    if (state.stage === 'play') void playBgm(chapter).catch(() => {});
  }, [state.stage, chapter]);

  const lastEvt = state.log[state.log.length - 1];
  useEffect(() => {
    if (state.stage === 'title') return;
    if (state.stage === 'done' || lastEvt?.type === 'chapter_end' || lastEvt?.type === 'judge') {
      save(state);
      setToast((n) => n + 1);
    }
  }, [state.log.length, state.stage]);

  useEffect(() => () => clearTimeout(faceTimer.current), []);
  useEffect(() => setPicked(null), [sc.id]);

  const showFace = (delta: Option['delta']) => {
    setFace(faceFor(delta));
    clearTimeout(faceTimer.current);
    faceTimer.current = setTimeout(() => setFace('calm'), 1200);
  };

  const choose = (optionId: string) => {
    if (state.stage !== 'play' || (sc.kind !== 'story' && sc.kind !== 'culture')) return;
    const opt = sc.options.find((o) => o.id === optionId);
    if (!opt || isLocked(opt, state.stats) || state.chosen[sc.id] !== undefined) return;
    sfx('tap');
    if (sc.kind === 'culture') { setPicked(optionId); return; } // 까닭 메모를 본 뒤 '다음' 에서 dispatch (R19)
    showFace(opt.delta);
    dispatch({ type: 'choose', sceneId: sc.id, optionId, t: Date.now() });
  };

  const confirm = () => {
    if (!picked || sc.kind !== 'culture') return;
    const opt = sc.options.find((o) => o.id === picked);
    if (!opt) return;
    showFace(opt.delta);
    dispatch({ type: 'choose', sceneId: sc.id, optionId: picked, t: Date.now() });
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
      } else if (e.key === 'Enter' && picked && sc.kind === 'culture') {
        e.preventDefault();
        confirm();
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
        onStart={() => { sfx('tap'); dispatch({ type: 'start', seed: SEED, t: Date.now() }); }}
        onResume={() => { sfx('tap'); if (saved) dispatch({ type: 'restore', state: saved, t: Date.now() }); }}
      />
    );
  } else if (state.stage === 'done') {
    screen = <div class="placeholder">결과 화면(T06)</div>;
  } else if (sc.kind === 'story' || sc.kind === 'culture') {
    screen = <Scene scene={sc} state={state} face={face} picked={picked} onChoose={choose} onConfirm={confirm} />;
  } else if (sc.kind === 'title') {
    screen = <ChapterTitle scene={sc} onDone={next} />;
  } else {
    screen = (
      <div class="placeholder">
        (T05) {sc.kind}
        <button type="button" class="btn" onClick={next}><span>다음</span></button>
      </div>
    );
  }

  return (
    <div class="stage" style={{ ...IMG_VARS, '--sat-step': `var(--sat-${state.satStep})` }}>
      {screen}
      <div class="mute"><Mute /></div>
      <Toast n={toast} text="저장됨" />
    </div>
  );
}
