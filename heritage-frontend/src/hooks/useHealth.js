import { useEffect, useState } from 'react';
import { getHealth } from '../api/health';

export function useHealth() {
  const [health, setHealth] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let mounted = true;

    async function fetchHealth() {
      try {
        const response = await getHealth();

        if (!mounted) {
          return;
        }

        setHealth(response);
        setStatus(response.status || 'ok');
      } catch {
        if (!mounted) {
          return;
        }

        setHealth(null);
        setStatus('error');
      }
    }

    fetchHealth();
    const intervalId = window.setInterval(fetchHealth, 30000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  return { health, status };
}
