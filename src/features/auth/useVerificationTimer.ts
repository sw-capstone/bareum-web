import { useEffect, useState } from 'react';

export function useVerificationTimer() {
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    if (!expiresAt) return;

    const update = () => {
      const next = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setRemainingSeconds(next);
      if (next === 0) setExpiresAt(null);
    };

    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  return {
    remainingSeconds,
    start: (durationSeconds = 300) => setExpiresAt(Date.now() + durationSeconds * 1000),
    stop: () => {
      setExpiresAt(null);
      setRemainingSeconds(0);
    },
  };
}
