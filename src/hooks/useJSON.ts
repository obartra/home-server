import React from 'react';

type Options = {
  refetchEveryMs: number;
};

export function useJSON<A>(
  url: string,
  initialState: A,
  options: Partial<Options> = {},
): [A, () => void] {
  const [state, setState] = React.useState<A>(initialState);
  React.useEffect(() => {
    fetch(url)
      .then((resp) => resp.json())
      .then(setState);
  }, [url]);

  React.useEffect(() => {
    if (!options.refetchEveryMs || options.refetchEveryMs < 1000) {
      return;
    }

    const interval = setInterval(() => {
      fetch(url)
        .then((resp) => resp.json())
        .then(setState);
    }, options.refetchEveryMs);

    return () => {
      clearInterval(interval);
    };
  }, [options.refetchEveryMs, url]);

  return React.useMemo(
    () => [
      state,
      () => {
        fetch(url)
          .then((resp) => resp.json())
          .then(setState);
      },
    ],
    [state, url],
  );
}
