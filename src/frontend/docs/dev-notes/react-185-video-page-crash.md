# React Error #185 Fix - Video Page Crash

## Error Description
**React Error #185**: Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops.

## Root Cause
The issue was in `frontend/src/pages/VideoPage.tsx` in the `useEffect` hook (lines 159-199) that handles saving video progress on unmount and navigation.

### Specific Problem
1. The effect had `saveProgress` (a React Query mutation) in its dependency array
2. The cleanup function called `saveProgress.mutate()` which triggers state updates
3. When the mutation completed, it caused React Query to update state
4. This triggered a re-render, which re-ran the effect
5. The new effect registered a new cleanup function
6. This created an infinite loop of state updates

### Code Path
