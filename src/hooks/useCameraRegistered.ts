import { useJSON } from '@/hooks/useJSON';
import { Camera } from '@/types';
import { fingerprint } from '@/utils/fingerprint';

export function useCameraRegistered(): [true, Camera, () => void] | [false, undefined, () => void] {
  const [cameras, refetchCameras] = useJSON('/api/camera', []);
  const savedCamera = cameras.find(({ id }) => `${id}` === fingerprint);

  return [!!savedCamera, savedCamera, refetchCameras];
}
