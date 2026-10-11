import { ICON } from '../assets';
import { COPY } from '../content/copy';
import type { StatKey } from '../content/types';

export const ICON_KEY: Record<StatKey, string> = { join: 'hand', info: 'magnifier', home: 'house' };

export function Gauge({ stat, value }: { stat: StatKey; value: number }) {
  const label = COPY.ui.stats[stat];
  return (
    <div class={`gauge ${stat}`} role="img" aria-label={`${label} ${value}/3`}>
      <img class="ic" src={ICON[ICON_KEY[stat]]} alt="" />
      <span>{label}</span>
      <div class="cells" aria-hidden="true">
        {[0, 1, 2].map((i) => <i key={i} class={i < value ? 'cell on' : 'cell'} />)}
      </div>
    </div>
  );
}
