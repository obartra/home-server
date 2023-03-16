import React from 'react';

export function usePOST<A extends object = object>(
  url: string,
  options: { parseResponse?: 'json' | 'text' } = {},
) {
  return React.useCallback(
    (data: A) => {
      return fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }).then((res) => {
        if (options?.parseResponse === 'json') {
          return res.json();
        } else if (options?.parseResponse === 'text') {
          return res.text();
        }
        return res;
      });
    },
    [url, options?.parseResponse],
  );
}
