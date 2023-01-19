import React from 'react';

import {
  Box,
  Button,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Switch,
  TextField,
} from '@mui/material';

import { useSnackbar } from 'notistack';

import { useCameraRegistered } from '@/hooks/useCameraRegistered';
import { usePOST } from '@/hooks/usePOST';
import { fingerprint } from '@/utils/fingerprint';

export function CameraRegister() {
  const [name, setName] = React.useState('');
  const [tracking, setTracking] = React.useState({ cat: true, dog: true, person: false });
  const [hasCamera, savedCamera, refetchCameras] = useCameraRegistered();
  const postCamera = usePOST('/api/camera', { parseResponse: 'json' });
  const { enqueueSnackbar } = useSnackbar();

  React.useEffect(() => {
    if (savedCamera) {
      setName(savedCamera.name);
      setTracking(savedCamera.tracking);
    }
  }, [savedCamera]);

  function removeCurrentCamera() {
    return fetch(`/api/camera/${fingerprint}`, {
      method: 'DELETE',
    });
  }

  return (
    <Box
      component="form"
      sx={{
        '& > :not(style)': { m: 1 },
      }}
    >
      <FormGroup>
        <FormLabel>Send SMS when detecting:</FormLabel>
        {Object.entries(tracking).map(([key, isTracking]) => (
          <FormControlLabel
            key={key}
            control={
              <Switch
                checked={isTracking}
                onChange={({ target }) =>
                  setTracking((prev) => ({ ...prev, [key]: target.checked }))
                }
              />
            }
            label={key}
          />
        ))}
      </FormGroup>
      <TextField
        required
        id="camera-name"
        label="Camera Name"
        value={name}
        onChange={({ target }) => setName(target.value)}
      />
      <TextField required disabled id="camera-id" label="Id (generated)" value={fingerprint} />
      <Box>
        <Button
          type="button"
          disabled={!name}
          color="primary"
          sx={{ mr: 2 }}
          variant="contained"
          onClick={() => {
            postCamera({
              name,
              id: fingerprint,
              tracking,
            })
              .then(() => enqueueSnackbar('Camera Updated'))
              .catch((e) => enqueueSnackbar(`Failed to update camera ${e.message}`))
              .then(refetchCameras);
          }}
        >
          {hasCamera ? 'Update camera' : 'Create new camera'}
        </Button>
        <Button
          disabled={!hasCamera}
          variant="contained"
          color="secondary"
          onClick={() => {
            removeCurrentCamera()
              .then(() => enqueueSnackbar('Camera successfully removed'))
              .catch((e) => enqueueSnackbar(`Failed to remove camera ${e.message}`))
              .then(refetchCameras);
          }}
        >
          Remove Camera
        </Button>
      </Box>
    </Box>
  );
}
