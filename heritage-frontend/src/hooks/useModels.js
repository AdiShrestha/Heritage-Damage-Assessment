import { useEffect, useState } from 'react';
import { listModels } from '../api/models';

export function useModels() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function refetch() {
    setLoading(true);
    setError(null);

    try {
      const response = await listModels();
      setModels(response);
    } catch (err) {
      setError(err.message || 'Unable to load models.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refetch();
  }, []);

  return { models, loading, error, refetch };
}
