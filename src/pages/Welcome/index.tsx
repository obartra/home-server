import Typography from '@mui/material/Typography';

import Meta from '@/components/Meta';
import { FullSizeCenteredFlexBox } from '@/components/styled';

import { RemoteCameras } from '../RemoteCameras';
import emotionsComfortable from './emotions-comfortable.jpeg';
import emotionsUncomfortable from './emotions-uncomfortable.jpeg';
import robotWaiter from './robot-waiter.png';
import { Image } from './styled';

const style: React.CSSProperties = {
  maxWidth: '100%',
};

function Welcome() {
  return (
    <>
      <Meta title="Welcome" />
      <FullSizeCenteredFlexBox flexDirection="column">
        <Typography variant="h1">CHOVE</Typography>
        <Image alt="" src={robotWaiter} style={style} />
        <Typography variant="h3">Cameras</Typography>
        <RemoteCameras />
        <Typography variant="h3">Comfortable Emotions</Typography>
        <Image alt="" src={emotionsComfortable} style={style} />
        <Typography variant="h3">Uncomfortable Emotions</Typography>
        <Image alt="" src={emotionsUncomfortable} style={style} />
      </FullSizeCenteredFlexBox>
    </>
  );
}

export default Welcome;
