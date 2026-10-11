import { useEffect, useRef, useState } from 'preact/hooks';
import { BG } from '../../assets';
import { CONTENT } from '../../content';
import { COPY } from '../../content/copy';
import type { JudgeKind, Scene } from '../../content/types';
import { scoreRetry } from '../../engine/judge';
import type { RetryAnswer, State } from '../../engine/state';
import { SourceCard, sourceFeedback } from './Source';
import type { Trust } from './Source';
import { POLL_H as H, POLL_W as W, retryTargets } from './drag';
import { Feedback, JudgeFrame, verdictSfx } from './shared';
import './judge.css';

interface Props {
  scene: Scene;
  state: State;
  onRetry: (kind: JudgeKind, item: string, answer: RetryAnswer) => void;
  onNext: () => void;
}
interface Done { correct: boolean; text: string }

const J = CONTENT.judges;

// 다시 보기(R29) — 큐의 poll/appeal/source 문항(attempts<2)을 모두 차례로 다시 묻는다. 문항마다 한 번 답하고 피드백 '다음' 으로
// 다음 문항, 마지막 문항 뒤 '다음' 은 장면을 넘긴다. 큐가 비면 곧바로 다음으로 넘긴다(리듀서는 retry 장면을 생략하지 않는다).
export function Retry({ scene, state, onRetry, onNext }: Props) {
  const [targets] = useState(() => retryTargets(state.retryQueue, state.log, scene.chapter)); // 답하면 큐가 바뀌므로 처음 목록을 잡아 둔다
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<Done | null>(null);
  const skipped = useRef(false);
  const target = targets[step];

  useEffect(() => {
    if (targets.length || skipped.current) return;
    skipped.current = true;
    onNext();
  }, [targets]);
  if (!target) return null;

  const { kind, item } = target;
  const last = step === targets.length - 1;
  // QA r3 #0: 이번 답을 엔진에 넘긴다. 화면 피드백도 리듀서와 같은 scoreRetry 결과로 만든다(채점 단일 출처).
  const answer = (a: RetryAnswer, text: (r: NonNullable<ReturnType<typeof scoreRetry>>) => string) => {
    if (done) return;
    const r = scoreRetry(item, a, J);
    if (!r) return;
    setDone({ correct: r.correct, text: text(r) });
    verdictSfx(r.correct);
    onRetry(kind, item, a);
  };
  const after = () => {
    if (last) { onNext(); return; }
    setDone(null);
    setStep(step + 1);
  };

  let body;
  if (kind === 'poll') {
    const s = J.poll.spots.find((x) => x.id === item)!;
    const k = Math.min(440 / s.w, 280 / s.h);
    body = (
      <>
        <div class="frame crop" style={{ width: `${s.w * k + 52}px`, height: `${s.h * k + 52}px` }}>
          <div style={{ backgroundImage: `url(${BG['1960-poll']})`, backgroundSize: `${W * k}px ${H * k}px`, backgroundPosition: `${-s.x * k}px ${-s.y * k}px` }} />
        </div>
        <div class="card jcard rq"><p>{COPY.ui.retryPollQ}</p></div>
        <div class="two">
          {[true, false].map((v) => (
            <button key={String(v)} type="button" class="btn" disabled={!!done} onClick={() => answer({ kind: 'poll', violation: v }, () => s.explain)}>
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
            <button key={w.id} type="button" class="card jcard" aria-disabled={!!done} onClick={() => answer({ kind: 'appeal', why: w.id }, (r) => (r.correct ? COPY.feedback.appealRight : COPY.feedback[r.misconception ?? 'appeal.wrong'] ?? COPY.feedback['appeal.wrong']))}>
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
    <JudgeFrame scene={scene} task={`${COPY.ui.retryStart} ${step + 1} / ${targets.length} · ${scene.text[0]}`}>
      <div class="jbody rbody" key={`${kind}|${item}`} data-kind={kind} data-item={item}>{body}</div>
      {done ? <Feedback key={`${kind}|${item}`} placement="bottom" items={[{ ok: done.correct, text: done.text }]} onNext={after} /> : null}
    </JudgeFrame>
  );
}

function RetrySource({ item, done, onAnswer }: { item: string; done: boolean; onAnswer: (a: RetryAnswer, text: (r: NonNullable<ReturnType<typeof scoreRetry>>) => string) => void }) {
  const card = J.source.cards.find((c) => c.id === item)!;
  const [checks, setChecks] = useState([false, false, false, false]);
  const [trust, setTrust] = useState<Trust | undefined>();
  const submit = () => {
    if (!trust || done) return;
    onAnswer({ kind: 'source', checks, trust }, (r) => sourceFeedback(card, r));
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
