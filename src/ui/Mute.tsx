import { useState } from 'preact/hooks';
import { isMuted, setMuted } from '../audio/audio';
import { COPY } from '../content/copy';

export function Mute() {
  const [m, setM] = useState(isMuted());
  return (
    <button
      type="button"
      class="btn paper"
      aria-pressed={m}
      onClick={() => { setMuted(!m); setM(!m); }}
    >
      {m ? COPY.ui.muteOn : COPY.ui.muteOff}
    </button>
  );
}
