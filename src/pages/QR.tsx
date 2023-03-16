import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Grid from '@mui/system/Unstable_Grid';

import Meta from '@/components/Meta';
import { FullSizeCenteredFlexBox } from '@/components/styled';
import { useJSON } from '@/hooks/useJSON';

export default function QR() {
  const [qrCodes] = useJSON<{ name: string }[]>('/api/qr', []);

  return (
    <>
      <Meta title="QR" />
      <FullSizeCenteredFlexBox>
        <Grid container spacing={4} flexWrap="wrap" sx={{ m: 4 }}>
          {qrCodes.map((qr) => (
            <Grid key={qr.name}>
              <Card sx={{ width: 300, minWidth: 300 }}>
                <CardMedia
                  sx={{ height: 300 }}
                  image={`/api/qr/${qr.name}.png`}
                  title={`QR code for ${qr.name}`}
                />
                <CardContent>
                  <Typography gutterBottom variant="h5" component="div">
                    {qr.name}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </FullSizeCenteredFlexBox>
    </>
  );
}
