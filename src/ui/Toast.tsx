import { useEffect, useState } from 'preact/hooks';

// n 이 바뀔 때마다(>0) 1.5초 보였다 사라진다. live region 은 항상 마운트, pointer-events 없음(css).
export function Toast({ n, text }: { n: number; text: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!n) return;
    setOn(true);
    const t = setTimeout(() => setOn(false), 1500);
    return () => clearTimeout(t);
  }, [n]);
  return <div class={on ? 'toast on' : 'toast'} role="status">{on ? text : ''}</div>;
}
