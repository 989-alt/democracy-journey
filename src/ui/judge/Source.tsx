import { useState } from 'preact/hooks';
import { ICON } from '../../assets';
import { sfx } from '../../audio/audio';
import { CONTENT } from '../../content';
import { COPY } from '../../content/copy';
import type { SourceCard as SourceCardT } from '../../content/types';
import { scoreJudge } from '../../engine/judge';
import type { JudgeAnswer } from '../../engine/state';
import type { JudgeProps } from './drag';
import { Feedback, JudgeFrame, verdictSfx } from './shared';
import './judge.css';

export type Trust = 'low' | 'mid' | 'high';
export const TRUST: [Trust, string, string][] = [['low', 'lo', COPY.ui.trust.low], ['mid', 'mi', COPY.ui.trust.mid], ['high', 'hi', COPY.ui.trust.high]];

// 정보 카드 1장: 출처 태그(카드 윗단에 걸침), 본문, 기준 체크 4개, 신뢰도 3단계. 다시 보기(Retry)도 같은 카드를 쓴다.
export function SourceCard({ card: c, checks, trust, locked, onCheck, onTrust }: {
  card: SourceCardT;
  checks: boolean[];
  trust: Trust | undefined;
  locked: boolean;
  onCheck: (i: number, v: boolean) => void;
  onTrust: (v: Trust) => void;
}) {
  return (
    <div class="card jcard icard" role="group" aria-label={c.source}>
      <span class="tag"><span>{c.source}</span></span>
      <div class="txt"><b>{c.date}</b> {c.text}</div>
      <div class="crit">
        {COPY.ui.sourceChecks.map((label, i) => (
          <label key={label}>
            <input type="checkbox" checked={checks[i]} disabled={locked} onChange={(e) => onCheck(i, (e.currentTarget as HTMLInputElement).checked)} />
            {label}
          </label>
        ))}
      </div>
      <div class="trust" role="group" aria-label={`${c.source} ${COPY.ui.trustLabel}`}>
        {TRUST.map(([v, cls, label]) => {
          const on = trust === v;
          return (
            <button key={v} type="button" class={`btn paper ${cls}${on ? ' on' : ''}`} aria-pressed={on} disabled={locked} onClick={() => { sfx('tap'); onTrust(v); }}>
              <span>{on ? <img class="ic s" src={ICON['stamp-ring']} alt="" /> : null}{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ③ 정보 카드 — 카드 2×2 + 오른쪽 기준 패널(시안 2-수채-B 판별③). 판단 뒤 기준 패널 자리가 피드백 패널로 바뀐다.
export function Source({ scene, onJudge }: JudgeProps) {
  const { cards, criteria } = CONTENT.judges.source;
  const [checks, setChecks] = useState<Record<string, boolean[]>>(() => Object.fromEntries(cards.map((c) => [c.id, [false, false, false, false]])));
  const [trust, setTrust] = useState<Record<string, Trust | undefined>>({});
  const [answer, setAnswer] = useState<JudgeAnswer | null>(null);
  const done = cards.filter((c) => trust[c.id]).length;
  const result = answer ? scoreJudge('source', answer, CONTENT.judges) : null;

  const finish = () => {
    if (answer || done < cards.length) return;
    const a: JudgeAnswer = { kind: 'source', cards: Object.fromEntries(cards.map((c) => [c.id, { checks: checks[c.id], trust: trust[c.id]! }])) };
    setAnswer(a);
    verdictSfx(scoreJudge('source', a, CONTENT.judges).items.every((i) => i.correct));
  };

  return (
    <JudgeFrame scene={scene} task={scene.text[scene.text.length - 1]}>
      <div class="jbody sgrid">
        {cards.map((c) => (
          <SourceCard
            key={c.id}
            card={c}
            checks={checks[c.id]}
            trust={trust[c.id]}
            locked={!!answer}
            onCheck={(i, v) => setChecks((m) => ({ ...m, [c.id]: m[c.id].map((x, j) => (j === i ? v : x)) }))}
            onTrust={(v) => setTrust((t) => ({ ...t, [c.id]: v }))}
          />
        ))}
        {answer && result ? (
          <Feedback
            placement="side"
            className="rule"
            items={cards.map((c) => {
              const it = result.items.find((i) => i.item === c.id);
              return { ok: it?.correct === true, label: c.source, text: (it?.misconception && COPY.feedback[it.misconception]) || c.feedback };
            })}
            onNext={() => onJudge(answer)}
          />
        ) : (
          <aside class="card jcard rule" aria-label={COPY.ui.criteriaLabel}>
            <h3>{COPY.ui.criteriaTitle}</h3>
            <ol>{criteria.map((t) => <li key={t}>{t}</li>)}</ol>
            <p class="cite">{COPY.ui.sourceCite}</p>
            <button type="button" class="btn" data-primary aria-disabled={done < cards.length} onClick={finish}>
              <span>{COPY.ui.finishJudge} ({done} / {cards.length})</span>
            </button>
          </aside>
        )}
      </div>
    </JudgeFrame>
  );
}
