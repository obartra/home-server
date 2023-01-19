import React from 'react';

import { useJSON } from '@/hooks/useJSON';
import { usePOST } from '@/hooks/usePOST';

export function useAsyncState<T extends object>(
  url: string,
  initialState: T,
  {
    refetchEveryMs,
    parseResponse,
    onUpdateError,
  }: Parameters<typeof useJSON>[2] &
    Parameters<typeof usePOST>[1] & {
      onUpdateError?: (error: Error) => void;
    } = {},
): [T, (t: T) => Promise<void>, () => void] {
  const [state, refetchState] = useJSON<T>(url, initialState, { refetchEveryMs });
  const post = usePOST(url, { parseResponse });
  const setState = React.useCallback(
    (newState: T) => post(newState).then(refetchState).catch(onUpdateError),
    [refetchState, post, onUpdateError],
  );

  return React.useMemo(() => [state, setState, refetchState], [state, setState, refetchState]);
}
