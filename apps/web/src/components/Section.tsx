import React from 'react';

export interface SectionProps {
  children: React.ReactNode;
  variant?: 'default' | 'narrow' | 'wide' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  id?: string;
}

export const Section: React.FC<SectionProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  id,
}) => {
  return (
    <section
      id={id}
      className={`
        section-base
        ${
          variant === 'narrow'
            ? 'section-narrow'
            : variant === 'wide'
              ? 'section-wide'
              : variant === 'full'
                ? 'section-full'
                : 'section-default'
        }
        ${
          padding === 'none'
            ? 'section-padding-none'
            : padding === 'sm'
              ? 'section-padding-sm'
              : padding === 'lg'
                ? 'section-padding-lg'
                : padding === 'xl'
                  ? 'section-padding-xl'
                  : 'section-padding-md'
        }
        ${className}
      `}
    >
      {children}
    </section>
  );
};

export default Section;
