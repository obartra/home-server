import { useCallback, useEffect } from 'react';

import { useSnackbar } from 'notistack';
import { useRegisterSW } from 'virtual:pwa-register/react';

function SW() {
  const { enqueueSnackbar } = useSnackbar();
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const close = useCallback(() => {
    setOfflineReady(false);
    setNeedRefresh(false);
  }, [setOfflineReady, setNeedRefresh]);

  useEffect(() => {
    if (offlineReady) {
      enqueueSnackbar('App is ready to work offline');
    } else if (needRefresh) {
      updateServiceWorker(true);
    }
  }, [close, needRefresh, offlineReady, enqueueSnackbar, updateServiceWorker]);

  return null;
}

export default SW;
