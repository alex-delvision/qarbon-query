'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { LiveCounter } from '@/components/LiveCounter';
import { Section } from '@/components/Section';
import { Statistic } from '@/components/Statistic';
import { TestimonialCard } from '@/components/TestimonialCard';
import { CallToAction } from '@/components/CallToAction';

// Temporarily force dynamic rendering to avoid build issues
export const dynamic = 'force-dynamic';

// Real testimonials coming soon
const testimonials = [];

export default function LandingPage() {
  const [npmDownloads, setNpmDownloads] = useState(12500); // Default fallback
  
  useEffect(() => {
    // Fetch NPM downloads on client side
    async function fetchNpmDownloads() {
      try {
        const response = await fetch('https://api.npmjs.org/downloads/point/last-month/@qarbon/emissions');
        
        if (!response.ok) {
          console.warn(`NPM API returned ${response.status}`);
          return;
        }
        
        const data = await response.json();
        if (typeof data.downloads === 'number') {
          setNpmDownloads(data.downloads);
        }
      } catch (error) {
        console.warn('Failed to fetch NPM downloads:', error);
        // Keep the fallback value
      }
    }
    
    fetchNpmDownloads();
  }, []);

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-emerald-500 to-teal-400 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text Content - Left Side */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-tight">
              Track Your AI Carbon Footprint in Real-Time
            </h1>
            
            <p className="text-xl sm:text-2xl text-white/90 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Monitor the environmental impact of your AI usage with precise, real-time carbon emission tracking. 
              Make informed decisions for a more sustainable digital future.
            </p>
            
            <div className="flex flex-col items-center lg:items-start space-y-6">
              <Button 
                variant="primary"
                size="lg"
                className="bg-white text-emerald-600 hover:bg-gray-50 hover:text-emerald-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-semibold px-8 py-4 text-lg"
                onClick={() => window.open('https://alex-delvision.github.io/qarbon-query/', '_blank')}
              >
                Try Qarbon Query
              </Button>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg">
                <LiveCounter
                  initialValue={1247.8}
                  increment={0.5}
                  interval={2000}
                  format="grams"
                  label="Global AI Emissions Today"
                  variant="large"
                  color="default"
                  className="text-white"
                />
              </div>
            </div>
          </div>

          {/* Illustration - Right Side */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-full max-w-lg lg:max-w-xl xl:max-w-2xl">
              <svg
                viewBox="0 0 400 400"
                className="w-full h-auto drop-shadow-2xl"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Gradient Definitions */}
                <defs>
                  <radialGradient id="earthGradient" cx="0.3" cy="0.3" r="0.8">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="40%" stopColor="#059669" />
                    <stop offset="100%" stopColor="#047857" />
                  </radialGradient>
                  
                  <linearGradient id="circuitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="50%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge> 
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                {/* Earth Globe */}
                <circle
                  cx="200"
                  cy="200"
                  r="120"
                  fill="url(#earthGradient)"
                  className="opacity-90"
                />
                
                {/* Earth Continents (Simplified) */}
                <path
                  d="M140 160 C180 150, 220 160, 260 180 C250 200, 220 220, 180 210 C150 200, 140 180, 140 160"
                  fill="rgba(255,255,255,0.2)"
                />
                <path
                  d="M160 240 C200 230, 230 240, 250 260 C240 280, 210 290, 180 280 C160 270, 160 250, 160 240"
                  fill="rgba(255,255,255,0.2)"
                />
                <path
                  d="M120 200 C140 190, 160 200, 170 220 C160 240, 140 250, 120 240 C110 230, 120 210, 120 200"
                  fill="rgba(255,255,255,0.2)"
                />

                {/* AI Circuit Pattern */}
                <g stroke="url(#circuitGradient)" strokeWidth="2" fill="none" filter="url(#glow)">
                  {/* Orbital Rings */}
                  <circle cx="200" cy="200" r="150" opacity="0.6" strokeDasharray="10,5">
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      values="0 200 200;360 200 200"
                      dur="20s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  
                  <circle cx="200" cy="200" r="170" opacity="0.4" strokeDasharray="15,8">
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      values="360 200 200;0 200 200"
                      dur="30s"
                      repeatCount="indefinite"
                    />
                  </circle>

                  {/* Circuit Lines */}
                  <path d="M50 200 L100 200 L120 220 L140 200 L180 200" opacity="0.7">
                    <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite"/>
                  </path>
                  
                  <path d="M350 200 L300 200 L280 180 L260 200 L220 200" opacity="0.7">
                    <animate attributeName="opacity" values="0.7;1;0.7" dur="2.5s" repeatCount="indefinite"/>
                  </path>
                  
                  <path d="M200 50 L200 100 L220 120 L200 140 L200 180" opacity="0.7">
                    <animate attributeName="opacity" values="0.7;1;0.7" dur="3s" repeatCount="indefinite"/>
                  </path>
                  
                  <path d="M200 350 L200 300 L180 280 L200 260 L200 220" opacity="0.7">
                    <animate attributeName="opacity" values="0.7;1;0.7" dur="2.2s" repeatCount="indefinite"/>
                  </path>

                  {/* Connection Nodes */}
                  <circle cx="100" cy="200" r="3" fill="url(#circuitGradient)">
                    <animate attributeName="r" values="3;6;3" dur="2s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx="300" cy="200" r="3" fill="url(#circuitGradient)">
                    <animate attributeName="r" values="3;6;3" dur="2.5s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx="200" cy="100" r="3" fill="url(#circuitGradient)">
                    <animate attributeName="r" values="3;6;3" dur="3s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx="200" cy="300" r="3" fill="url(#circuitGradient)">
                    <animate attributeName="r" values="3;6;3" dur="2.2s" repeatCount="indefinite"/>
                  </circle>
                </g>

                {/* Data Flow Particles */}
                <g fill="rgba(255,255,255,0.8)">
                  <circle cx="0" cy="0" r="2">
                    <animateMotion dur="4s" repeatCount="indefinite">
                      <path d="M50 200 L100 200 L120 220 L140 200 L180 200"/>
                    </animateMotion>
                  </circle>
                  <circle cx="0" cy="0" r="2">
                    <animateMotion dur="5s" repeatCount="indefinite">
                      <path d="M350 200 L300 200 L280 180 L260 200 L220 200"/>
                    </animateMotion>
                  </circle>
                  <circle cx="0" cy="0" r="2">
                    <animateMotion dur="6s" repeatCount="indefinite">
                      <path d="M200 50 L200 100 L220 120 L200 140 L200 180"/>
                    </animateMotion>
                  </circle>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    {/* Features Section */}
    <Section variant="wide" className="bg-white">
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          Powerful Features for Sustainable AI
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Track, measure, and offset your AI carbon footprint with enterprise-grade precision
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Feature Card 1: Automatic Tracking */}
        <div className="group bg-white rounded-xl p-8 border border-gray-200 hover:shadow-lg hover:shadow-green-100 transition-all duration-300 hover:border-green-200">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg mb-6 group-hover:scale-105 transition-transform duration-300">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            Automatic Tracking
          </h3>
          <p className="text-gray-600 leading-relaxed">
            Seamlessly monitor AI usage across OpenAI, Anthropic, Google, Meta, and Microsoft platforms with zero configuration required.
          </p>
        </div>
        
        {/* Feature Card 2: Real-time Calculations */}
        <div className="group bg-white rounded-xl p-8 border border-gray-200 hover:shadow-lg hover:shadow-green-100 transition-all duration-300 hover:border-green-200">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg mb-6 group-hover:scale-105 transition-transform duration-300">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            Real-time Calculations
          </h3>
          <p className="text-gray-600 leading-relaxed">
            Get precise carbon emission calculations in sub-millisecond timing, providing instant feedback on your AI environmental impact.
          </p>
        </div>
        
        {/* Feature Card 3: One-click Offsetting */}
        <div className="group bg-white rounded-xl p-8 border border-gray-200 hover:shadow-lg hover:shadow-green-100 transition-all duration-300 hover:border-green-200">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg mb-6 group-hover:scale-105 transition-transform duration-300">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            One-click Offsetting
          </h3>
          <p className="text-gray-600 leading-relaxed">
            Instantly offset your carbon footprint through integrated partnerships with verified carbon credit providers worldwide.
          </p>
        </div>
      </div>
    </Section>
    
    {/* Social Proof Section */}
    <Section variant="wide" className="bg-gradient-to-br from-emerald-50 to-green-50" id="social-proof">
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          Trusted by Developers Worldwide
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Join thousands of developers and organizations using Qarbon Query to track and offset their AI carbon footprint
        </p>
      </div>
      
      {/* Statistics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16" role="region" aria-labelledby="statistics-heading">
        <h3 id="statistics-heading" className="sr-only">Key Performance Statistics</h3>
        <div className="text-center">
          <Statistic 
            value={npmDownloads}
            label="NPM Downloads (Last Month)"
            description="Active installations tracking AI emissions"
            variant="large"
            color="emerald"
            format="number"
            className="bg-white rounded-xl p-6 shadow-lg border border-emerald-100 hover:shadow-xl transition-shadow duration-300"
          />
        </div>
        
        <div className="text-center">
          <Statistic 
            value="0.001"
            label="Average Calculation Time"
            description="Lightning-fast carbon footprint analysis"
            variant="large"
            color="blue"
            format="custom"
            suffix=" ms"
            className="bg-white rounded-xl p-6 shadow-lg border border-blue-100 hover:shadow-xl transition-shadow duration-300"
          />
        </div>
        
        <div className="text-center">
          <Statistic 
            value="86-91"
            label="Bundle Size Reduction"
            description="Optimized for minimal performance impact"
            variant="large"
            color="orange"
            format="custom"
            suffix="%"
            className="bg-white rounded-xl p-6 shadow-lg border border-orange-100 hover:shadow-xl transition-shadow duration-300"
          />
        </div>
      </div>
      
      {/* Testimonials */}
      <div className="space-y-4" role="region" aria-labelledby="testimonials-heading">
        <h3 id="testimonials-heading" className="text-2xl font-semibold text-gray-900 text-center mb-8">
          What Our Users Say
        </h3>
        <div className="flex justify-center">
          <div className="bg-white rounded-xl p-12 shadow-lg border border-gray-100 text-center max-w-md">
            <div className="text-6xl text-gray-300 mb-4">💬</div>
            <h4 className="text-xl font-semibold text-gray-600 mb-2">Coming Soon</h4>
            <p className="text-gray-500">User testimonials will be featured here once we launch publicly.</p>
          </div>
        </div>
      </div>
    </Section>
    
    {/* Call-to-Action Section */}
    <CallToAction />
    </>
  );
}
