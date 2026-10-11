import { useState } from 'preact/hooks';
import { isMuted, setMuted } from '../audio/audio';

export function Mute() {
  const [m, setM] = useState(isMuted());
  return (
    <button
      type="button"
      class="btn paper"
      aria-pressed={m}
      onClick={() => { setMuted(!m); setM(!m); }}
    >
      {m ? '소리 켜기' : '소리 끄기'}
    </button>
  );
}
