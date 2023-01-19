import React from 'react';

import { Box, Button, FormControlLabel, FormGroup, Switch, TextField } from '@mui/material';

import { useSnackbar } from 'notistack';

import { useAsyncState } from '@/hooks/useAsyncState';

type ReportingStatus = 'REPORTING' | 'PAUSED';
type ReportingResult = {
  status: ReportingStatus;
};
type PhonesResult = {
  phones: string[];
};
const defaultReporting: ReportingResult = { status: 'REPORTING' };
const defaultPhones: PhonesResult = { phones: [] };

export function SMSOptions() {
  const { enqueueSnackbar } = useSnackbar();
  const [phoneText, setPhoneText] = React.useState('');
  const [reporting, setReporting] = useAsyncState<ReportingResult>(
    '/api/report-status',
    defaultReporting,
    {
      refetchEveryMs: 60_000,
      parseResponse: 'json',
      onUpdateError: () =>
        enqueueSnackbar(`Failed to update reporting status. No change has been made`),
    },
  );
  const setReportingAndMessages = React.useCallback(
    (status: ReportingStatus) =>
      setReporting({ status })
        .then(() =>
          enqueueSnackbar(
            status === 'REPORTING'
              ? 'You will start receiving text messages now'
              : 'Text messages STOPPED',
          ),
        )
        .catch(() =>
          enqueueSnackbar('Failed to refetch the reporting status, please reload manually'),
        ),
    [setReporting, enqueueSnackbar],
  );

  const [{ phones }, setPhones] = useAsyncState<PhonesResult>('/api/phones', defaultPhones, {
    refetchEveryMs: 60_000,
    parseResponse: 'json',
    onUpdateError: () => enqueueSnackbar(`Failed to update phone numbers. No change has been made`),
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
        .then(() => enqueueSnackbar('Phones updated!'))
        .catch(() => enqueueSnackbar('Failed to refetch the phone list, please reload manually')),
    [setPhones, enqueueSnackbar],
  );

  return (
    <Box
      component="form"
      sx={{
        '& > :not(style)': { m: 1 },
      }}
    >
      <FormGroup>
        <FormControlLabel
          control={
            <Switch
              checked={reporting.status === 'REPORTING'}
              onChange={() =>
                setReportingAndMessages(reporting.status === 'REPORTING' ? 'PAUSED' : 'REPORTING')
              }
            />
          }
          label={`Send SMS is currently ${reporting.status}:`}
        />
      </FormGroup>
      <TextField
        label="Phone numbers"
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
        Update Phone Numbers
      </Button>
    </Box>
  );
}
