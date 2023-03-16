import Typography from '@mui/material/Typography';

import Meta from '@/components/Meta';
import { FullSizeCenteredFlexBox } from '@/components/styled';

export default function Emergency() {
  return (
    <>
      <Meta title="Emergency" />
      <FullSizeCenteredFlexBox>
        <Typography variant="h3">Emergency</Typography>
      </FullSizeCenteredFlexBox>
    </>
  );
}
