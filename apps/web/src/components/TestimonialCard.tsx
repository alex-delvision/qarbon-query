import React from 'react';
import Image from 'next/image';

export interface TestimonialCardProps {
  quote: string;
  author: {
    name: string;
    title: string;
    company?: string;
    avatar: string;
  };
  variant?: 'default' | 'compact' | 'featured';
  showQuotes?: boolean;
  className?: string;
}

export const TestimonialCard: React.FC<TestimonialCardProps> = ({
  quote,
  author,
  variant = 'default',
  showQuotes = true,
  className = '',
}) => {
  const formatJobTitle = () => {
    if (author.company) {
      return `${author.title} at ${author.company}`;
    }
    return author.title;
  };

  return (
    <div
      className={`
        testimonial-card-base
        ${
          variant === 'compact'
            ? 'testimonial-card-compact'
            : variant === 'featured'
              ? 'testimonial-card-featured'
              : 'testimonial-card-default'
        }
        ${className}
      `}
      role='article'
      aria-labelledby={`testimonial-author-${author.name.replace(/\s+/g, '-').toLowerCase()}`}
    >
      {variant === 'featured' && showQuotes && (
        <div className='testimonial-quote-icon'>
          <svg
            className='w-8 h-8 text-emerald-500'
            fill='currentColor'
            viewBox='0 0 24 24'
          >
            <path d='M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z' />
          </svg>
        </div>
      )}

      <div className='testimonial-content'>
        <blockquote
          className='testimonial-quote'
          cite={author.name}
          aria-label={`Testimonial from ${author.name}`}
        >
          {showQuotes && variant !== 'featured' && (
            <span className='testimonial-quote-mark' aria-hidden='true'>
              "
            </span>
          )}
          {quote}
          {showQuotes && variant !== 'featured' && (
            <span className='testimonial-quote-mark' aria-hidden='true'>
              "
            </span>
          )}
        </blockquote>
      </div>

      <div className='testimonial-author'>
        <div className='testimonial-avatar'>
          <Image
            src={author.avatar}
            alt={`Portrait of ${author.name}, ${formatJobTitle()}`}
            width={
              variant === 'compact' ? 40 : variant === 'featured' ? 64 : 48
            }
            height={
              variant === 'compact' ? 40 : variant === 'featured' ? 64 : 48
            }
            className='testimonial-avatar-image'
            loading='lazy'
          />
        </div>
        <div className='testimonial-author-info'>
          <div
            className='testimonial-author-name'
            id={`testimonial-author-${author.name.replace(/\s+/g, '-').toLowerCase()}`}
          >
            {author.name}
          </div>
          <div
            className='testimonial-author-title'
            aria-label={`Job title: ${formatJobTitle()}`}
          >
            {formatJobTitle()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestimonialCard;
