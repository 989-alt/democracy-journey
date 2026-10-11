import { useEffect, useRef, useState } from 'preact/hooks';
import { ICON, ORGAN } from '../../assets';
import { sfx } from '../../audio/audio';
import { CONTENT } from '../../content';
import { COPY } from '../../content/copy';
import { scoreJudge } from '../../engine/judge';
import type { JudgeAnswer } from '../../engine/state';
import { dragReducer, initDrag } from './drag';
import type { DragEv, DragState, JudgeProps, Zone } from './drag';
import { Feedback, JudgeFrame } from './shared';
import './judge.css';

type OrganId = 'assembly' | 'executive' | 'court';
const ZONES: { id: OrganId; icon: string }[] = [
  { id: 'assembly', icon: 'assembly' },
  { id: 'executive', icon: 'pen' },
  { id: 'court', icon: 'gavel' },
];
interface Board { ok: Record<string, string>; first: Record<string, string>; feed: { id: number; label: string; text: string }[]; n: number }
const EMPTY: Board = { ok: {}, first: {}, feed: [], n: 0 };

// ⑤ 기관 카드 — 하는 일 8장을 3 기관 칸에, 이어서 견제 3장을 받는 기관 칸에. 끌어 놓기(Pointer Events) 또는 카드 탭 → 칸 탭.
// 리듀서는 최종 답 하나만 받으므로 화면이 먼저 오답을 되돌려 보낸다. 기록에는 카드마다 '처음 놓은 칸'을 넣는다(되돌려진 시도가 오개념 기록이 된다).
export function Organ({ scene, onJudge }: JudgeProps) {
  const { cards, checks } = CONTENT.judges.organ;
  const [board, setBoard] = useState<Board>(EMPTY);
  const boardRef = useRef(board);
  boardRef.current = board;
  const [ds, setDs] = useState<DragState>(initDrag);
  const dsRef = useRef(ds);
  const [bounce, setBounce] = useState<string | null>(null);
  const zoneEls = useRef<Record<string, HTMLElement | null>>({});
  const area = useRef<HTMLDivElement>(null);
  const scale = useRef(1);

  const label = (key: string) => (key[0] === 'c' ? cards.find((c) => c.id === key.slice(2))?.label : checks.find((c) => c.id === key.slice(2))?.label) ?? key;
  const target = (key: string) => (key[0] === 'c' ? cards.find((c) => c.id === key.slice(2))?.organ : checks.find((c) => c.id === key.slice(2))?.to);

  // 한 장만 놓은 답을 엔진에 채점시켜 오개념을 얻는다(오분류 표는 엔진 한 곳에만 둔다).
  const misOf = (key: string, zone: string) => {
    const id = key.slice(2);
    const isCard = key[0] === 'c';
    const a: JudgeAnswer = { kind: 'organ', placed: isCard ? { [id]: zone } : {}, checks: isCard ? {} : { [id]: zone } };
    return scoreJudge('organ', a, CONTENT.judges).items.find((i) => i.item === (isCard ? `card:${id}` : `check:${id}`))?.misconception;
  };

  const drop = (key: string, zone: string) => {
    const b = boardRef.current;
    if (b.ok[key]) return;
    const first = b.first[key] ? b.first : { ...b.first, [key]: zone };
    let next: Board;
    if (target(key) === zone) {
      next = { ...b, first, ok: { ...b.ok, [key]: zone } };
      sfx('correct');
    } else {
      const mis = misOf(key, zone);
      const text = (mis && COPY.feedback[mis]) || COPY.feedback['organ.wrong'];
      next = { ...b, first, feed: [{ id: b.n, label: label(key), text }, ...b.feed].slice(0, 3), n: b.n + 1 };
      sfx('wrong');
      setBounce(key);
    }
    boardRef.current = next;
    setBoard(next);
  };

  const send = (ev: DragEv) => {
    const next = dragReducer(dsRef.current, ev);
    dsRef.current = next;
    setDs(next);
    if (next.drop) drop(next.drop.card, next.drop.zone);
  };
  const zones = (): Zone[] =>
    ZONES.map((z) => {
      const r = zoneEls.current[z.id]!.getBoundingClientRect();
      return { id: z.id, x: r.left, y: r.top, w: r.width, h: r.height };
    });

  useEffect(() => {
    if (!bounce) return;
    const t = setTimeout(() => setBounce(null), 450);
    return () => clearTimeout(t);
  }, [bounce]);

  const phase2 = cards.every((c) => board.ok[`c:${c.id}`]);
  const done = phase2 && checks.every((c) => board.ok[`k:${c.id}`]);
  const placedN = Object.keys(board.ok).length;
  const total = cards.length + checks.length;
  const tray = phase2 ? checks.map((c) => ({ key: `k:${c.id}`, label: `${COPY.ui.organs[c.from]} → ${c.label}`, icon: c.icon })) : cards.map((c) => ({ key: `c:${c.id}`, label: c.label, icon: c.icon }));
  const answer: JudgeAnswer | null = done
    ? { kind: 'organ', placed: Object.fromEntries(cards.map((c) => [c.id, board.first[`c:${c.id}`]])), checks: Object.fromEntries(checks.map((c) => [c.id, board.first[`k:${c.id}`]])) }
    : null;
  const result = answer ? scoreJudge('organ', answer, CONTENT.judges) : null;
  const wrong = result ? result.items.filter((i) => !i.correct) : [];
  const itemKey = (item: string) => (item.startsWith('card:') ? `c:${item.slice(5)}` : `k:${item.slice(6)}`);

  const chipFor = (key: string, text: string, icon: string) => {
    const dragging = ds.dragging === key;
    const style = dragging && ds.start && ds.pos ? { transform: `translate(${(ds.pos.x - ds.start.x) / scale.current}px, ${(ds.pos.y - ds.start.y) / scale.current}px)` } : undefined;
    return (
      <button
        key={key}
        type="button"
        class={`chip${key[0] === 'k' ? ' wide' : ''}${ds.selected === key ? ' sel' : ''}${dragging ? ' drag' : ''}${bounce === key ? ' bounce' : ''}`}
        style={style}
        aria-pressed={ds.selected === key}
        onPointerDown={(e) => {
          if (done) return;
          const st = area.current?.getBoundingClientRect();
          if (st && area.current) scale.current = st.width / area.current.offsetWidth || 1;
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          send({ type: 'down', card: key, x: e.clientX, y: e.clientY });
        }}
        onPointerMove={(e) => send({ type: 'move', x: e.clientX, y: e.clientY })}
        onPointerUp={(e) => send({ type: 'up', x: e.clientX, y: e.clientY, zones: zones() })}
        onPointerCancel={() => send({ type: 'cancel' })}
        onClick={(e) => { if (e.detail === 0) send({ type: 'tapCard', card: key }); }}
      >
        <span class="cl"><img class="oi" src={ORGAN[icon]} alt="" />{text}</span>
      </button>
    );
  };

  return (
    <JudgeFrame scene={scene} task={scene.text[scene.text.length - 1]}>
      <div class="jbody organ-drag" ref={area}>
        <div class="oleft">
          <div class="zones">
            {ZONES.map((z) => (
              <button
                key={z.id}
                type="button"
                class={`card jcard zone${ds.selected ? ' ready' : ''}`}
                ref={(el) => { zoneEls.current[z.id] = el; }}
                aria-label={`${COPY.ui.organs[z.id]} ${COPY.ui.zoneSuffix}`}
                onClick={() => send({ type: 'tapZone', zone: z.id })}
              >
                <span class="zh"><img class="ic big" src={ICON[z.icon]} alt="" />{COPY.ui.organs[z.id]}</span>
                <span class="pl">
                  {cards.filter((c) => board.ok[`c:${c.id}`] === z.id).map((c) => (
                    <span key={c.id} class="chip ph"><span class="cl"><img class="oi" src={ORGAN[c.icon]} alt="" />{c.label}</span></span>
                  ))}
                  {checks.filter((c) => board.ok[`k:${c.id}`] === z.id).map((c) => (
                    <span key={c.id} class="chip ph chk"><span class="cl"><img class="oi" src={ORGAN[c.icon]} alt="" /><span class="tx">{COPY.ui.organs[c.from]} →<br />{c.label}</span></span></span>
                  ))}
                </span>
              </button>
            ))}
          </div>
          <div class="card jcard tray" role="group" aria-label={phase2 ? COPY.ui.checkCards : COPY.ui.workCards}>
            {tray.filter((t) => !board.ok[t.key]).map((t) => chipFor(t.key, t.label, t.icon))}
          </div>
        </div>
        {done && result ? (
          <Feedback
            placement="side"
            className="ofeed"
            items={wrong.length === 0 ? [{ ok: true, text: COPY.feedback.organAllRight }] : wrong.map((w) => ({ ok: false, label: label(itemKey(w.item)), text: (w.misconception && COPY.feedback[w.misconception]) || COPY.feedback['organ.wrong'] }))}
            onNext={() => onJudge(answer!)}
          />
        ) : (
          <aside class="card jcard ofeed">
            <h3>{phase2 ? COPY.ui.checkPhase : COPY.ui.workPhase}</h3>
            <p class="cnt">{placedN} / {total}</p>
            <ul role="log" aria-live="polite">
              {board.feed.map((f) => (
                <li key={f.id}><img class="ic" src={ICON['stamp-cross']} alt="" /><span><b>{f.label}</b> {f.text}</span></li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </JudgeFrame>
  );
}
