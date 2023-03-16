import React from 'react';

export function useDELETE(url: string) {
  return React.useCallback(() => {
    return fetch(url, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
  }, [url]);
}
