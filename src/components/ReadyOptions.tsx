import React from 'react';

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from '@mui/material';

import { useSnackbar } from 'notistack';

import { useAsyncState } from '@/hooks/useAsyncState';

type PhonesResult = {
  phones: string[];
};
const defaultPhones: PhonesResult = { phones: [] };
const defaultUsers: string[] = [];

export function ReadyOptions() {
  const { enqueueSnackbar } = useSnackbar();
  const [phoneText, setPhoneText] = React.useState('');
  const [readyText, setReadyText] = React.useState('');
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [pw, setPw] = React.useState('');
  const [ready, setReady] = useAsyncState<string[]>('/api/ready', defaultUsers, {
    refetchEveryMs: 60_000,
    parseResponse: 'json',
    onUpdateError: () => enqueueSnackbar(`Failed to update active users. No change has been made`),
  });

  const [{ phones }, setPhones] = useAsyncState<PhonesResult>('/api/help/phones', defaultPhones, {
    refetchEveryMs: 60_000,
    parseResponse: 'json',
    onUpdateError: () =>
      enqueueSnackbar(`Failed to update help phone numbers. No change has been made`),
  });
  React.useEffect(() => {
    const text = phones.join('\n');

    if (text !== phoneText) {
      setPhoneText(text);
    }
  }, [phones]);

  const setPhonesAndMessage = React.useCallback(
    (newPhones: string) =>
      setPhones({
        phones: (newPhones || '')
          .split('\n')
          .map((line) => `${line ?? ''}`.trim())
          .filter(Boolean),
      }),
    [setPhones],
  );

  return (
    <Box
      component="form"
      sx={{
        '& > :not(style)': { m: 1 },
      }}
    >
      <TextField
        label="Phone numbers"
        multiline
        rows={4}
        onChange={({ target }) => setPhoneText(target.value)}
        value={phoneText}
      />
      <TextField
        label="Who's ready?"
        multiline
        rows={4}
        onChange={({ target }) => setReadyText(target.value)}
        value={readyText}
      />
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Subscribe</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This is a password protected change. Please enter your password before proceeding.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            value={pw}
            onChange={({ target }) => setPw(target.value)}
            variant="standard"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={async () => {
              if (pw === import.meta.env.VITE_READY_PASSWORD) {
                await Promise.all([setPhonesAndMessage(phoneText), setReady(readyText.split('\n'))])
                  .then(() => enqueueSnackbar('Updated!'))
                  .catch(() => enqueueSnackbar('Failed to update data, please reload manually'));
                setDialogOpen(false);
              } else {
                window.alert('Invalid password');
              }
            }}
          >
            Subscribe
          </Button>
        </DialogActions>
      </Dialog>
      <Button
        variant="contained"
        onClick={() => {
          setDialogOpen(true);
        }}
      >
        Update
      </Button>
    </Box>
  );
}
