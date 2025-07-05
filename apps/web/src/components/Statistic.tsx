import React from 'react';

export interface StatisticProps {
  value: number | string;
  label: string;
  description?: string;
  variant?: 'default' | 'large' | 'compact';
  color?: 'default' | 'emerald' | 'blue' | 'orange' | 'red';
  format?: 'number' | 'percentage' | 'currency' | 'bytes' | 'custom';
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const Statistic: React.FC<StatisticProps> = ({
  value,
  label,
  description,
  variant = 'default',
  color = 'default',
  format = 'number',
  prefix = '',
  suffix = '',
  className = '',
}) => {
  const formatValue = (val: number | string): string => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'currency':
        return new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD' 
        }).format(val);
      case 'bytes': {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = val;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
          size /= 1024;
          unitIndex++;
        }
        return `${size.toFixed(1)} ${units[unitIndex]}`;
      }
      case 'number':
        if (val >= 1000000) {
          return `${(val / 1000000).toFixed(1)}M`;
        } else if (val >= 1000) {
          return `${(val / 1000).toFixed(1)}K`;
        }
        return val.toLocaleString();
      default:
        return val.toString();
    }
  };

  const formattedValue = `${prefix}${formatValue(value)}${suffix}`;

  return (
    <div
      className={`
        statistic-base
        ${variant === 'large' ? 'statistic-large' : 
          variant === 'compact' ? 'statistic-compact' : 'statistic-default'}
        ${className}
      `}
      role="figure"
      aria-labelledby={`statistic-${label.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <div
        className={`
          statistic-value
          ${color === 'emerald' ? 'statistic-value-emerald' :
            color === 'blue' ? 'statistic-value-blue' :
            color === 'orange' ? 'statistic-value-orange' :
            color === 'red' ? 'statistic-value-red' : 'statistic-value-default'}
        `}
        aria-describedby={description ? `statistic-desc-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined}
      >
        {formattedValue}
      </div>
      <div 
        className="statistic-label"
        id={`statistic-${label.replace(/\s+/g, '-').toLowerCase()}`}
      >
        {label}
      </div>
      {description && (
        <div 
          className="statistic-description"
          id={`statistic-desc-${label.replace(/\s+/g, '-').toLowerCase()}`}
        >
          {description}
        </div>
      )}
    </div>
  );
};


export default Statistic;
