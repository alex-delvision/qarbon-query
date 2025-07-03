/**
 * React hooks for QarbonQuery integration
 */

import { useState, useEffect, useCallback } from 'react';
import type { EmissionData, CarbonFootprint } from '@qarbon/shared';
import { QarbonClient, type QarbonConfig } from './client';

/**
 * Hook to use QarbonClient
 */
export function useQarbon(config?: QarbonConfig) {
  const [client] = useState(() => new QarbonClient(config));
  return client;
}

/**
 * Hook to track emissions and maintain state
 */
export function useEmissionTracking() {
  const [emissions, setEmissions] = useState<EmissionData[]>([]);
  const [footprint, setFootprint] = useState<CarbonFootprint | null>(null);
  const [loading, setLoading] = useState(false);

  const addEmission = useCallback((emission: EmissionData) => {
    setEmissions(prev => [...prev, emission]);
  }, []);

  const clearEmissions = useCallback(() => {
    setEmissions([]);
    setFootprint(null);
  }, []);

  // Calculate footprint when emissions change
  useEffect(() => {
    if (emissions.length > 0) {
      setLoading(true);
      // Simple footprint calculation
      const total = emissions.reduce((sum, e) => sum + e.amount, 0);
      const breakdown = emissions.reduce(
        (acc, e) => {
          acc[e.category] = (acc[e.category] || 0) + e.amount;
          return acc;
        },
        {} as Record<string, number>
      );

      setFootprint({
        total,
        breakdown,
        period: 'monthly',
      });
      setLoading(false);
    }
  }, [emissions]);

  return {
    emissions,
    footprint,
    loading,
    addEmission,
    clearEmissions,
    totalEmissions: emissions.length,
  };
}

/**
 * Hook for digital emissions tracking
 */
export function useDigitalTracking(client: QarbonClient) {
  const [isTracking, setIsTracking] = useState(false);

  const trackSession = useCallback(
    async (params: {
      dataTransfer: number;
      timeSpent: number;
      deviceType?: 'mobile' | 'desktop' | 'tablet';
    }) => {
      setIsTracking(true);
      try {
        const emission = await client.trackDigital(params);
        return emission;
      } finally {
        setIsTracking(false);
      }
    },
    [client]
  );

  return {
    trackSession,
    isTracking,
  };
}
