# Tracker Adapters

This directory contains the implementation of various tracker adapters that can be registered with
the UniversalTrackerRegistry.

## Structure

Each adapter should implement the `TrackerAdapter` interface defined in
`../UniversalTrackerRegistry.ts`.

## Adapter Interface

```typescript
export interface TrackerAdapter {
  name: string;
  version: string;
  initialize(config: any): Promise<void>;
  track(event: any): Promise<void>;
  flush?(): Promise<void>;
  destroy?(): Promise<void>;
}
```

## Example Adapters

Future adapter implementations will be placed in this directory, such as:

- `GoogleAnalyticsAdapter.ts`
- `MixpanelAdapter.ts`
- `SegmentAdapter.ts`
- `CustomAdapter.ts`

Each adapter should be self-contained and export a class that implements the TrackerAdapter
interface.
