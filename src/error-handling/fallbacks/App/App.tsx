import { Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';

import { FullSizeCenteredFlexBox } from '@/components/styled';

function AppErrorBoundaryFallback() {
  return (
    <Box height={400}>
      <FullSizeCenteredFlexBox>
        <Paper sx={{ p: 5 }}>
          <Typography variant="h4" sx={{ color: (theme) => theme.palette.info.main }}>
            Oops something went wrong, sorry!
          </Typography>
        </Paper>
      </FullSizeCenteredFlexBox>
    </Box>
  );
}

export default AppErrorBoundaryFallback;
