import React from 'react';

import { Box, Button, TextField } from '@mui/material';

import { useSnackbar } from 'notistack';

import { useAsyncState } from '@/hooks/useAsyncState';

type PhonesResult = {
  phones: string[];
};
const defaultPhones: PhonesResult = { phones: [] };

export function PanicButtonOptions() {
  const { enqueueSnackbar } = useSnackbar();
  const [phoneText, setPhoneText] = React.useState('');

  const [{ phones }, setPhones] = useAsyncState<PhonesResult>('/api/help/phones', defaultPhones, {
    refetchEveryMs: 60_000,
    parseResponse: 'json',
    onUpdateError: (e) =>
      enqueueSnackbar(`Failed to update help phone numbers. No change has been made, ${e.message}`),
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
      })
        .then(() => enqueueSnackbar('Help phones updated!'))
        .catch((e) =>
          enqueueSnackbar(
            `Failed to refetch the help phone list, please reload manually, ${e.message}`,
          ),
        ),
    [setPhones, enqueueSnackbar],
  );

  return (
    <Box
      component="form"
      sx={{
        '& > :not(style)': { m: 1 },
      }}
    >
      <TextField
        label="Panic Phone numbers"
        multiline
        rows={4}
        onChange={({ target }) => setPhoneText(target.value)}
        value={phoneText}
      />
      <Button
        variant="contained"
        onClick={() => {
          setPhonesAndMessage(phoneText);
        }}
      >
        Update Help Phone Numbers
      </Button>
    </Box>
  );
}
