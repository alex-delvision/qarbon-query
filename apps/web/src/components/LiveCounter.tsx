'use client';

import React, { useState, useEffect, useRef } from 'react';

// Try to import calculator from @qarbon/emissions, fallback to mock if not available
let calculator: any;
try {
  calculator = require('@qarbon/emissions').calculator;
} catch (error) {
  // Fallback mock for development/demo purposes
  calculator = {
    calculate: () => Promise.resolve({ data: { amount: Math.random() * 10 } }),
  };
}

export interface LiveCounterProps {
  initialValue?: number;
  increment?: number;
  interval?: number; // in milliseconds
  format?: 'number' | 'percentage' | 'currency' | 'grams';
  label?: string;
  description?: string;
  variant?: 'default' | 'large' | 'compact';
  color?: 'default' | 'emerald' | 'blue' | 'orange' | 'red';
  animationDuration?: number; // in milliseconds
  className?: string;
  onUpdate?: (value: number) => void;
}

export const LiveCounter: React.FC<LiveCounterProps> = ({
  initialValue = 0,
  increment = 1,
  interval = 1000,
  format = 'number',
  label = 'Live Emissions',
  description,
  variant = 'default',
  color = 'emerald',
  animationDuration = 500,
  className = '',
  onUpdate,
}) => {
  const [currentValue, setCurrentValue] = useState(initialValue);
  const [displayValue, setDisplayValue] = useState(initialValue);
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);

  // Mock AI emissions data to simulate real-time calculations
  const mockCalculateEmissions = (): number => {
    try {
      // This would normally use the real calculator
      // For now, we'll simulate varying emission increments
      const baseIncrement = increment;
      const variation = Math.random() * 0.5 + 0.75; // 0.75 to 1.25 multiplier
      return baseIncrement * variation;
    } catch (error) {
      console.warn('Emissions calculation failed, using fallback:', error);
      return increment;
    }
  };

  const formatValue = (val: number): string => {
    switch (format) {
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(val);
      case 'grams':
        if (val >= 1000000) {
          return `${(val / 1000000).toFixed(2)} tonnes CO₂`;
        } else if (val >= 1000) {
          return `${(val / 1000).toFixed(2)} kg CO₂`;
        }
        return `${val.toFixed(2)} g CO₂`;
      case 'number':
      default:
        if (val >= 1000000) {
          return `${(val / 1000000).toFixed(1)}M`;
        } else if (val >= 1000) {
          return `${(val / 1000).toFixed(1)}K`;
        }
        return Math.round(val).toLocaleString();
    }
  };

  const animateValue = (from: number, to: number) => {
    setIsAnimating(true);
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const interpolatedValue = from + (to - from) * easeOutQuart;

      setDisplayValue(interpolatedValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        setDisplayValue(to);
      }
    };

    animate();
  };

  useEffect(() => {
    const startCounter = () => {
      intervalRef.current = setInterval(() => {
        const emissionIncrement = mockCalculateEmissions();

        setCurrentValue(prevValue => {
          const newValue = prevValue + emissionIncrement;
          animateValue(displayValue, newValue);

          if (onUpdate) {
            onUpdate(newValue);
          }

          return newValue;
        });
      }, interval);
    };

    startCounter();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [interval, increment, onUpdate]);

  // Clean up animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`
        live-counter-base
        ${
          variant === 'large'
            ? 'live-counter-large'
            : variant === 'compact'
              ? 'live-counter-compact'
              : 'live-counter-default'
        }
        ${isAnimating ? 'live-counter-animating' : ''}
        ${className}
      `}
    >
      <div
        className={`
          live-counter-value
          ${
            color === 'emerald'
              ? 'live-counter-value-emerald'
              : color === 'blue'
                ? 'live-counter-value-blue'
                : color === 'orange'
                  ? 'live-counter-value-orange'
                  : color === 'red'
                    ? 'live-counter-value-red'
                    : 'live-counter-value-default'
          }
        `}
      >
        {formatValue(displayValue)}
      </div>
      <div className='live-counter-label'>
        {label}
        <span className='live-counter-indicator'>●</span>
      </div>
      {description && (
        <div className='live-counter-description'>{description}</div>
      )}
    </div>
  );
};

export default LiveCounter;
