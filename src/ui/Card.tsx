import { ICON } from '../assets';
import { COPY } from '../content/copy';
import { ICON_KEY } from './Gauge';
import type { ComponentChildren } from 'preact';
import type { Option, StatKey } from '../content/types';


function statOf(delta: Option['delta']): { stat: StatKey; d: number } | null {
  for (const k of ['join', 'info', 'home'] as StatKey[]) {
    const d = delta[k] ?? 0;
    if (d !== 0) return { stat: k, d };
  }
  return null;
}

export function Card({ n, option, locked, mark, onPick, children }: {
  n: number;
  option: Option;
  locked: boolean;
  mark?: 'picked' | 'dim';
  onPick: () => void;
  children?: ComponentChildren;
}) {
  const st = statOf(option.delta);
  return (
    <button
      type="button"
      class={`card${locked ? ' locked' : ''}${mark ? ` ${mark}` : ''}`}
      aria-disabled={locked ? 'true' : undefined}
      onClick={() => { if (!locked) onPick(); }}
    >
      <span class="n">{n}</span>
      <span class="t">{option.label}</span>
      {locked && option.lock ? (
        <span class="lk">
          <img class="ic" src={ICON.lock} alt="" />
          {COPY.ui.stats[option.lock.stat]} {option.lock.min}칸 필요
        </span>
      ) : st ? (
        <span class={`st ${st.stat}`}>
          <img class="ic" src={ICON[ICON_KEY[st.stat]]} alt="" />
          {COPY.ui.stats[st.stat]} {st.d > 0 ? '+' : ''}{st.d}
        </span>
      ) : null}
      {children}
    </button>
  );
}
