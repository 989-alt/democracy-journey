import { useEffect, useRef, useState } from 'preact/hooks';
import { BG } from '../../assets';
import { CONTENT } from '../../content';
import { COPY } from '../../content/copy';
import type { JudgeKind, Scene } from '../../content/types';
import { scoreJudge } from '../../engine/judge';
import type { State } from '../../engine/state';
import { SourceCard } from './Source';
import type { Trust } from './Source';
import { retryTarget } from './drag';
import { Feedback, JudgeFrame, verdictSfx } from './shared';
import './judge.css';

interface Props {
  scene: Scene;
  state: State;
  onRetry: (kind: JudgeKind, item: string, correct: boolean) => void;
  onNext: () => void;
}
interface Done { correct: boolean; text: string }

const J = CONTENT.judges;
const W = 1536;
const H = 1024;

// 다시 보기 — retryQueue 에서 문제 1개만 다시 묻는다(2장 poll · 3장 appeal · 4장 source). 큐에 없으면 곧바로 다음으로 넘긴다
// (리듀서는 retry 장면을 생략하지 않는다).
export function Retry({ scene, state, onRetry, onNext }: Props) {
  const [target] = useState(() => retryTarget(state.retryQueue, scene.chapter)); // 답하면 큐가 바뀌므로 처음 값을 잡아 둔다
  const [done, setDone] = useState<Done | null>(null);
  const skipped = useRef(false);

  useEffect(() => {
    if (target || skipped.current) return;
    skipped.current = true;
    onNext();
  }, [target]);
  if (!target) return null;

  const { kind, item } = target;
  const answer = (correct: boolean, text: string) => {
    if (done) return;
    setDone({ correct, text });
    verdictSfx(correct);
    onRetry(kind, item, correct);
  };

  let body;
  if (kind === 'poll') {
    const s = J.poll.spots.find((x) => x.id === item)!;
    const k = Math.min(440 / s.w, 280 / s.h);
    const violating = s.violation !== null;
    body = (
      <>
        <div class="frame crop" style={{ width: `${s.w * k + 52}px`, height: `${s.h * k + 52}px` }}>
          <div style={{ backgroundImage: `url(${BG['1960-poll']})`, backgroundSize: `${W * k}px ${H * k}px`, backgroundPosition: `${-s.x * k}px ${-s.y * k}px` }} />
        </div>
        <div class="card jcard rq"><p>{COPY.ui.retryPollQ}</p></div>
        <div class="two">
          {[true, false].map((v) => (
            <button key={String(v)} type="button" class="btn" disabled={!!done} onClick={() => answer(v === violating, s.explain)}>
              <span>{v ? COPY.ui.retryViolation : COPY.ui.retryFine}</span>
            </button>
          ))}
        </div>
      </>
    );
  } else if (kind === 'appeal') {
    body = (
      <>
        <div class="card jcard rq"><p>{J.appeal.situation} {COPY.ui.why}</p></div>
        <div class="grid3" role="group" aria-label={COPY.ui.why}>
          {J.appeal.why.map((w, i) => (
            <button key={w.id} type="button" class="card jcard" aria-disabled={!!done} onClick={() => answer(w.correct, w.correct ? COPY.feedback.appealRight : COPY.feedback[w.misconception ?? 'appeal.wrong'] ?? COPY.feedback['appeal.wrong'])}>
              <span class="n">{i + 1}</span>
              <span class="t">{w.label}</span>
            </button>
          ))}
        </div>
      </>
    );
  } else {
    body = <RetrySource item={item} done={!!done} onAnswer={answer} />;
  }

  return (
    <JudgeFrame scene={scene} task={`${COPY.ui.retryStart} · ${scene.text[0]}`}>
      <div class="jbody rbody">{body}</div>
      {done ? <Feedback placement="bottom" items={[{ ok: done.correct, text: done.text }]} onNext={onNext} /> : null}
    </JudgeFrame>
  );
}

function RetrySource({ item, done, onAnswer }: { item: string; done: boolean; onAnswer: (correct: boolean, text: string) => void }) {
  const card = J.source.cards.find((c) => c.id === item)!;
  const [checks, setChecks] = useState([false, false, false, false]);
  const [trust, setTrust] = useState<Trust | undefined>();
  const submit = () => {
    if (!trust || done) return;
    const r = scoreJudge('source', { kind: 'source', cards: { [card.id]: { checks, trust } } }, J).items.find((i) => i.item === card.id);
    onAnswer(r?.correct === true, (r?.misconception && COPY.feedback[r.misconception]) || card.feedback);
  };
  return (
    <>
      <div class="rsrc">
        <SourceCard card={card} checks={checks} trust={trust} locked={done} onCheck={(i, v) => setChecks((c) => c.map((x, j) => (j === i ? v : x)))} onTrust={setTrust} />
      </div>
      <button type="button" class="btn" data-primary aria-disabled={!trust || done} onClick={submit}><span>{COPY.ui.finishJudge}</span></button>
    </>
  );
}
