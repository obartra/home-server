import React from 'react';

import { Box, Button, FormGroup, TextField } from '@mui/material';

import { useSnackbar } from 'notistack';

import { useAsyncState } from '@/hooks/useAsyncState';
import { usePOST } from '@/hooks/usePOST';

import { RadioGroup } from '../RadioGroup';
import { QRListItem } from './QRListItem';
import { QR } from './types';

export function EditQR() {
  const [type, setType] = React.useState('wifi');
  const [encryption, setEncryption] = React.useState('WPA');
  const [name, setName] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [url, setURL] = React.useState('');
  const { enqueueSnackbar } = useSnackbar();

  const [qrs, , refetch] = useAsyncState<QR[]>('/api/qr', [], {
    refetchEveryMs: 60_000,
    parseResponse: 'json',
    onUpdateError: () => enqueueSnackbar(`Failed to update QR codes. No change has been made`),
  });
  const addQRCode = usePOST('/api/qr', { parseResponse: 'json' });

  return (
    <Box
      component="form"
      sx={{
        '& > :not(style)': { m: 1 },
      }}
    >
      <ul style={{ margin: 0, padding: 0 }}>
        {qrs.map((qr, i) => (
          <QRListItem key={qr?.name || i} qr={qr} refetch={refetch} />
        ))}
      </ul>
      <FormGroup>
        <RadioGroup
          label="QR code type"
          group={['wifi', 'url']}
          selected={type}
          onChange={setType}
        />
        {type === 'wifi' ? (
          <RadioGroup
            label="Encryption"
            group={['WPA', 'WEP']}
            selected={encryption}
            onChange={setEncryption}
          />
        ) : null}
        <TextField
          label="Name"
          onChange={({ target }) => setName(target.value)}
          value={name}
          sx={{ mb: 2, mt: 2 }}
        />
        {type === 'url' ? (
          <TextField label="URL" onChange={({ target }) => setURL(target.value)} value={url} />
        ) : null}
        {type === 'wifi' ? (
          <TextField
            label="Password"
            onChange={({ target }) => setPassword(target.value)}
            value={password}
          />
        ) : null}
      </FormGroup>
      <Button
        variant="contained"
        onClick={() => {
          addQRCode(
            type === 'wifi'
              ? {
                  type: 'wifi',
                  encryption,
                  name,
                  password,
                }
              : {
                  type: 'url',
                  name,
                  url,
                },
          )
            .then(refetch)
            .then(() => enqueueSnackbar('Phones updated!'))
            .then(() => {
              setName('');
              setType('wifi');
              setURL('');
              setEncryption('WPA');
              setPassword('');
            })
            .catch(() =>
              enqueueSnackbar('Failed to refetch the QR codes list, please reload manually'),
            );
        }}
      >
        Add QR Code
      </Button>
    </Box>
  );
}
