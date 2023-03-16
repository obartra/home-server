import CircularProgress from '@mui/material/CircularProgress';

import { FullSizeCenteredFlexBox } from '@/components/styled';

function Loading() {
  return (
    <FullSizeCenteredFlexBox sx={{ mt: 16 }}>
      <CircularProgress />
    </FullSizeCenteredFlexBox>
  );
}

export default Loading;
