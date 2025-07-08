'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from './Button';

export interface CallToActionProps {
  className?: string;
}

export const CallToAction: React.FC<CallToActionProps> = ({
  className = '',
}) => {
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); // Honeypot field
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const npmCommand = 'npm i @qarbon/emissions';

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(npmCommand);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Check honeypot field
    if (website) {
      setIsSubmitting(false);
      return; // Bot detected, silently fail
    }

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message || 'Thank you for subscribing!');
        setEmail('');
      } else {
        toast.error(data.message || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`sticky bottom-0 z-50 ${className}`}>
      <div className='bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 shadow-lg border-t border-emerald-500/30'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 items-center'>
            {/* Primary CTA - Chrome Extension Button */}
            <div className='flex justify-center lg:justify-start'>
              <Button
                variant='primary'
                size='lg'
                className='bg-white text-emerald-600 hover:bg-gray-50 hover:text-emerald-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-semibold px-8 py-4 text-lg w-full sm:w-auto'
                onClick={() =>
                  window.open(
                    'https://alex-delvision.github.io/qarbon-query/',
                    '_blank'
                  )
                }
              >
                <svg
                  className='w-5 h-5 mr-2'
                  viewBox='0 0 24 24'
                  fill='currentColor'
                >
                  <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z' />
                </svg>
                Try Qarbon Query
              </Button>
            </div>

            {/* Secondary CTA - NPM Install Command */}
            <div className='flex justify-center'>
              <div className='bg-gray-900 rounded-lg p-3 flex items-center space-x-3 w-full max-w-xs'>
                <code className='text-green-400 font-mono text-sm flex-1 truncate'>
                  {npmCommand}
                </code>
                <button
                  onClick={handleCopyToClipboard}
                  className='text-gray-400 hover:text-white transition-colors duration-200 flex-shrink-0'
                  title='Copy to clipboard'
                >
                  {copySuccess ? (
                    <svg
                      className='w-5 h-5 text-green-400'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M5 13l4 4L19 7'
                      />
                    </svg>
                  ) : (
                    <svg
                      className='w-5 h-5'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Newsletter Signup Form */}
            <div className='flex justify-center lg:justify-end'>
              <form
                onSubmit={handleNewsletterSubmit}
                className='w-full max-w-sm'
              >
                <div className='flex flex-col sm:flex-row gap-2'>
                  <div className='flex-1'>
                    <label htmlFor='email' className='sr-only'>
                      Email address
                    </label>
                    <input
                      id='email'
                      type='email'
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder='Enter your email'
                      required
                      className='w-full px-4 py-2 text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent'
                    />
                    {/* Honeypot field - hidden from users */}
                    <input
                      type='text'
                      name='website'
                      value={website}
                      onChange={e => setWebsite(e.target.value)}
                      tabIndex={-1}
                      autoComplete='off'
                      className='absolute left-[-9999px] opacity-0 pointer-events-none'
                    />
                  </div>
                  <Button
                    type='submit'
                    variant='secondary'
                    size='md'
                    disabled={isSubmitting}
                    className='bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-sm transition-all duration-200 whitespace-nowrap'
                  >
                    {isSubmitting ? (
                      <>
                        <svg
                          className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
                          xmlns='http://www.w3.org/2000/svg'
                          fill='none'
                          viewBox='0 0 24 24'
                        >
                          <circle
                            className='opacity-25'
                            cx='12'
                            cy='12'
                            r='10'
                            stroke='currentColor'
                            strokeWidth='4'
                          ></circle>
                          <path
                            className='opacity-75'
                            fill='currentColor'
                            d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                          ></path>
                        </svg>
                        Subscribing...
                      </>
                    ) : (
                      'Subscribe'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallToAction;
