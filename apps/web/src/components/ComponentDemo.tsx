import React from 'react';
import { Button } from './Button';
import { Section } from './Section';
import { Statistic } from './Statistic';
import { LiveCounter } from './LiveCounter';
import { TestimonialCard } from './TestimonialCard';

export const ComponentDemo: React.FC = () => {
  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Button Demo */}
      <Section variant='narrow' padding='lg'>
        <div className='text-center mb-8'>
          <h2 className='text-3xl font-bold text-gray-900 mb-4'>
            Component Demo
          </h2>
          <p className='text-gray-600'>
            Showcase of all reusable UI components
          </p>
        </div>

        <div className='space-y-16'>
          {/* Buttons */}
          <div>
            <h3 className='text-xl font-semibold text-gray-900 mb-6'>
              Buttons
            </h3>
            <div className='flex flex-wrap gap-4'>
              <Button variant='primary' size='sm'>
                Small Primary
              </Button>
              <Button variant='primary' size='md'>
                Medium Primary
              </Button>
              <Button variant='primary' size='lg'>
                Large Primary
              </Button>
              <Button variant='secondary' size='md'>
                Secondary
              </Button>
              <Button variant='primary' size='md' disabled>
                Disabled
              </Button>
            </div>
          </div>

          {/* Statistics */}
          <div>
            <h3 className='text-xl font-semibold text-gray-900 mb-6'>
              Statistics
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
              <Statistic
                value={1250000}
                label='NPM Downloads'
                description='Monthly downloads'
                color='emerald'
                format='number'
              />
              <Statistic
                value={99.9}
                label='Uptime'
                description='Service availability'
                color='blue'
                format='percentage'
              />
              <Statistic
                value={45.2}
                label='Average Response'
                description='API response time'
                color='orange'
                suffix='ms'
              />
            </div>
          </div>

          {/* Live Counters */}
          <div>
            <h3 className='text-xl font-semibold text-gray-900 mb-6'>
              Live Counters
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
              <div className='bg-white p-6 rounded-lg shadow-sm border'>
                <LiveCounter
                  initialValue={1245.67}
                  increment={2.3}
                  interval={1500}
                  format='grams'
                  label='Real-time AI Emissions'
                  description='Carbon footprint from AI queries'
                  color='emerald'
                  variant='default'
                />
              </div>
              <div className='bg-white p-6 rounded-lg shadow-sm border'>
                <LiveCounter
                  initialValue={125000}
                  increment={50}
                  interval={2000}
                  format='number'
                  label='Active API Calls'
                  description='Current requests per minute'
                  color='blue'
                  variant='compact'
                />
              </div>
            </div>
          </div>

          {/* Testimonials */}
          <div>
            <h3 className='text-xl font-semibold text-gray-900 mb-6'>
              Testimonials
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              <TestimonialCard
                quote='QarbonQuery has revolutionized how we track our AI carbon footprint. The real-time insights are invaluable.'
                author={{
                  name: 'Sarah Chen',
                  title: 'CTO',
                  company: 'TechCorp',
                  avatar:
                    'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100&h=100&fit=crop&crop=face',
                }}
                variant='default'
              />
              <TestimonialCard
                quote='Finally, a tool that makes carbon tracking simple and actionable for our development team.'
                author={{
                  name: 'Marcus Johnson',
                  title: 'Lead Developer',
                  company: 'AI Solutions Inc',
                  avatar:
                    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
                }}
                variant='compact'
              />
              <TestimonialCard
                quote='The best carbon footprint tracker for AI applications. Easy to integrate and incredibly accurate.'
                author={{
                  name: 'Elena Rodriguez',
                  title: 'Sustainability Director',
                  company: 'GreenTech',
                  avatar:
                    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
                }}
                variant='featured'
              />
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
};

export default ComponentDemo;
