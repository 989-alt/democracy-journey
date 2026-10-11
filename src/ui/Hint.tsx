import { useEffect, useState } from 'preact/hooks';

// 무입력 after ms 뒤 화살표. 입력 즉시 제거하고 다시 띄우지 않는다(장면당 1회 = 호출자가 key={scene.id}).
export function Hint({ after = 3000 }: { after?: number }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const off = () => {
      clearTimeout(t);
      setOn(false);
      window.removeEventListener('pointerdown', off);
      window.removeEventListener('keydown', off);
    };
    const t = setTimeout(() => setOn(true), after);
    window.addEventListener('pointerdown', off);
    window.addEventListener('keydown', off);
    return () => {
      clearTimeout(t);
      window.removeEventListener('pointerdown', off);
      window.removeEventListener('keydown', off);
    };
  }, [after]);
  return on ? <span class="arrow" aria-hidden="true" /> : null;
}
