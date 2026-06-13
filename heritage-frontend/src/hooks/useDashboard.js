import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getPredictionStats, getFlaggedPredictions, getSiteHistory, getSeverityTrend } from '../api/report';
import { getCacheStats, invalidateCache } from '../api/cache';

export function useDashboard() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [flagged, setFlagged] = useState([]);
  const [cacheStats, setCacheStats] = useState(null);
  const [searchSiteId, setSearchSiteId] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  const [searchTrend, setSearchTrend] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      const [statsRes, flaggedRes, cacheRes] = await Promise.all([
        getPredictionStats(),
        getFlaggedPredictions(30),
        getCacheStats(),
      ]);

      setStats(statsRes);
      setFlagged(flaggedRes.flagged || []);
      setCacheStats(cacheRes);
    } catch (err) {
      toast.error('Failed to load dashboard metrics: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  }

  async function searchSite(siteId) {
    if (!siteId.trim()) return;
    setSearchLoading(true);
    try {
      const [historyRes, trendRes] = await Promise.all([
        getSiteHistory(siteId),
        getSeverityTrend(siteId),
      ]);

      setSearchHistory(historyRes.predictions || []);
      setSearchTrend(trendRes);
    } catch (err) {
      toast.error('Site search failed: ' + (err.message || err));
      setSearchHistory([]);
      setSearchTrend(null);
    } finally {
      setSearchLoading(false);
    }
  }

  async function clearCache(modelName = null) {
    try {
      const res = await invalidateCache(modelName);
      toast.success(res.message || 'Cache cleared successfully.');
      // Refresh cache stats
      const newCacheStats = await getCacheStats();
      setCacheStats(newCacheStats);
    } catch (err) {
      toast.error('Failed to clear cache: ' + (err.message || err));
    }
  }

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    loading,
    stats,
    flagged,
    cacheStats,
    searchSiteId,
    setSearchSiteId,
    searchHistory,
    searchTrend,
    searchLoading,
    searchSite,
    clearCache,
    refresh: fetchDashboardData,
  };
}
