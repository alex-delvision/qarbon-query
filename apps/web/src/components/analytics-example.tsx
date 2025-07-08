/**
 * Example component showing how to use the analytics tracking functions
 * This can be used as a reference for implementing tracking in your actual components
 */

'use client';

import {
  trackExtensionInstallClick,
  trackNpmCopyClick,
  trackNewsletterSubmitted,
  isAnalyticsReady,
} from '../lib/analytics';

export default function AnalyticsExample() {
  // Example: Extension install button
  const handleExtensionInstall = (extensionType: string) => {
    trackExtensionInstallClick(extensionType);
    // Then redirect to extension store or show install modal
    console.log(`Tracking extension install for: ${extensionType}`);
  };

  // Example: NPM copy button
  const handleNpmCopy = async (packageName: string) => {
    trackNpmCopyClick(packageName);

    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(`npm install ${packageName}`);
      console.log(`Copied npm install ${packageName} to clipboard`);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  // Example: Newsletter submission
  const handleNewsletterSubmit = (email: string, source: string) => {
    trackNewsletterSubmitted(source, email);

    // Submit to newsletter service
    console.log(`Newsletter submitted: ${email} from ${source}`);
  };

  return (
    <div className='p-6 max-w-md mx-auto bg-white rounded-lg shadow-md space-y-4'>
      <h2 className='text-xl font-bold text-gray-900'>
        Analytics Tracking Examples
      </h2>

      <div className='space-y-2'>
        <p className='text-sm text-gray-600'>
          Analytics ready: {isAnalyticsReady() ? '✅' : '❌'}
        </p>
      </div>

      {/* Extension Install Buttons */}
      <div className='space-y-2'>
        <h3 className='font-medium text-gray-900'>
          Extension Install Tracking
        </h3>
        <div className='flex gap-2'>
          <button
            onClick={() => handleExtensionInstall('chrome')}
            className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
          >
            Install Chrome Extension
          </button>
          <button
            onClick={() => handleExtensionInstall('firefox')}
            className='px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600'
          >
            Install Firefox Extension
          </button>
        </div>
      </div>

      {/* NPM Copy Button */}
      <div className='space-y-2'>
        <h3 className='font-medium text-gray-900'>NPM Copy Tracking</h3>
        <button
          onClick={() => handleNpmCopy('qarbon-query')}
          className='px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600'
        >
          Copy NPM Install Command
        </button>
      </div>

      {/* Newsletter Subscription */}
      <div className='space-y-2'>
        <h3 className='font-medium text-gray-900'>
          Newsletter Subscription Tracking
        </h3>
        <div className='flex gap-2'>
          <input
            type='email'
            placeholder='Enter your email'
            className='flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
            onKeyPress={e => {
              if (e.key === 'Enter') {
                const email = (e.target as HTMLInputElement).value;
                if (email) {
                  handleNewsletterSubmit(email, 'example-component');
                  (e.target as HTMLInputElement).value = '';
                }
              }
            }}
          />
          <button
            onClick={() => {
              const input = document.querySelector(
                'input[type="email"]'
              ) as HTMLInputElement;
              if (input?.value) {
                handleNewsletterSubmit(input.value, 'example-component');
                input.value = '';
              }
            }}
            className='px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600'
          >
            Subscribe
          </button>
        </div>
      </div>

      <div className='text-xs text-gray-500'>
        <p>Open browser console to see tracking events</p>
      </div>
    </div>
  );
}
