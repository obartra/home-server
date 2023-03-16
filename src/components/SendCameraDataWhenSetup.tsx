import React from 'react';
import { useWakeLock } from 'react-screen-wake-lock';

import { useCameraRegistered } from '@/hooks/useCameraRegistered';

import { Cameras } from './Cameras';

export function SendCameraDataWhenSetup() {
  const [hasCameraSetup, camera] = useCameraRegistered();
  const { request, release } = useWakeLock({
    onRequest: () => console.log('[[WAKE LOCK]]: SET'),
    onError: (e) => console.error('[[WAKE LOCK]]:', e),
    onRelease: (a) => console.log('[[WAKE LOCK]]: RELEASED', a),
  });

  React.useEffect(() => {
    request();
    return () => {
      release();
    };
  }, []);

  if (!hasCameraSetup) {
    return null;
  }

  return (
    <Cameras
      style={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none' }}
      cameraName={camera.name}
    />
  );
}
