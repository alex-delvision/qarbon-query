# Reusable UI Components

This directory contains fully typed and styled React components using Tailwind CSS with `@apply`
directives for consistent design patterns.

## Components

### Button.tsx

Primary and secondary button variants with multiple sizes.

**Features:**

- Primary/secondary variants
- Small, medium, large sizes
- Disabled state support
- Full TypeScript typing
- Emerald color theme

**Usage:**

```jsx
import { Button } from './components';

<Button variant='primary' size='md' onClick={handleClick}>
  Click me
</Button>;
```

### Section.tsx

Wrapper component with max-width constraints and responsive padding.

**Features:**

- Multiple width variants (narrow, default, wide, full)
- Responsive padding options (none, sm, md, lg, xl)
- Centered layout with proper max-width constraints

**Usage:**

```jsx
import { Section } from './components';

<Section variant='narrow' padding='lg'>
  <h1>Page Content</h1>
</Section>;
```

### Statistic.tsx

Number display component for metrics like NPM downloads and benchmarks.

**Features:**

- Multiple format options (number, percentage, currency, bytes)
- Color variants (emerald, blue, orange, red)
- Size variants (compact, default, large)
- Smart number formatting (K, M abbreviations)
- Optional description text

**Usage:**

```jsx
import { Statistic } from './components';

<Statistic
  value={1250000}
  label='NPM Downloads'
  description='Monthly downloads'
  color='emerald'
  format='number'
/>;
```

### LiveCounter.tsx

Animated counter that increases every second with emissions data integration.

**Features:**

- Real-time animated counting
- Integration with `@qarbon/emissions` package
- Multiple format options including grams CO₂
- Smooth easing animations
- Live indicator with pulsing dot
- Configurable intervals and increments

**Usage:**

```jsx
import { LiveCounter } from './components';

<LiveCounter
  initialValue={1245.67}
  increment={2.3}
  interval={1500}
  format='grams'
  label='Real-time AI Emissions'
  color='emerald'
/>;
```

### TestimonialCard.tsx

Card component for displaying customer testimonials with avatar, quote, and job title.

**Features:**

- Avatar image with Next.js Image optimization
- Quote text with optional quote marks
- Author name, title, and company
- Three variants (default, compact, featured)
- Dark mode support
- Responsive design

**Usage:**

```jsx
import { TestimonialCard } from './components';

<TestimonialCard
  quote='QarbonQuery has revolutionized our carbon tracking.'
  author={{
    name: 'Sarah Chen',
    title: 'CTO',
    company: 'TechCorp',
    avatar: '/path/to/avatar.jpg',
  }}
  variant='featured'
/>;
```

## Styling

All components use Tailwind CSS with `@apply` directives defined in `globals.css`. The styles follow
a consistent naming pattern:

- `.component-base` - Base styles
- `.component-variant` - Variant-specific styles
- `.component-size` - Size-specific styles
- `.component-color` - Color-specific styles

## TypeScript

All components are fully typed with exported interfaces:

- `ButtonProps`
- `SectionProps`
- `StatisticProps`
- `LiveCounterProps`
- `TestimonialCardProps`

## Demo

See `ComponentDemo.tsx` for a comprehensive showcase of all components with various configurations
and use cases.

## Theme

The components use an emerald-based color theme consistent with the QarbonQuery brand:

- Primary: `emerald-600`
- Secondary: `white` with `gray-300` border
- Accent colors: `blue`, `orange`, `red`
- Text: `gray-900`, `gray-600`, `gray-500`
