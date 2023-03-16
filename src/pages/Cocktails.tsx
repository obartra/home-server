import Typography from '@mui/material/Typography';

import Meta from '@/components/Meta';
import { FullSizeCenteredFlexBox } from '@/components/styled';

export default function Cocktails() {
  return (
    <>
      <Meta title="Cocktails" />
      <FullSizeCenteredFlexBox>
        <Typography variant="h3">Cocktails</Typography>
      </FullSizeCenteredFlexBox>
    </>
  );
}
