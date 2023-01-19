import React from 'react';

import { fingerprint } from '@/utils/fingerprint';

import { usePOST } from './usePOST';

export function useSendLocalError() {
  const post = usePOST('/api/logs');

  return React.useCallback(
    (message: string | Error) => {
      console.error(message);
      post({ message, fingerprint });
    },
    [post],
  );
}
