import Webcam from 'react-webcam';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box } from '@mui/material';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Typography from '@mui/material/Typography';

import { CameraRegister } from '@/components/CameraRegister';
import { Logs } from '@/components/Logs';
import Meta from '@/components/Meta';
import { PanicButtonOptions } from '@/components/PanicButtonOptions';
import { EditQR } from '@/components/QR/EditQR';
import { ReadyOptions } from '@/components/ReadyOptions';
import { SMSOptions } from '@/components/SMSOptions';
import { useAllMedia } from '@/hooks/useAllMedia';
import { useSendLocalError } from '@/hooks/useSendLocalError';

const videoConstraints = {
  width: 854,
  height: 480,
};

export default function Advanced() {
  const media = useAllMedia();
  const sendLocalError = useSendLocalError();

  return (
    <Box sx={{ mb: 8 }}>
      <Meta title="Advanced" />
      <Typography align="center" variant="h2" sx={{ mb: 4 }}>
        Advanced Configuration
      </Typography>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="SMS Options"
          id="sms-header"
        >
          <Typography>SMS Options</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <SMSOptions />
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="Panic Button Options"
          id="panic-header"
        >
          <Typography>Panic Button Options</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <PanicButtonOptions />
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="serverlogs-content"
          id="serverlogs-header"
        >
          <Typography>Server Logs</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Logs />
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="cameras-content"
          id="camera-header"
        >
          <Typography>Camera</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {media.map(({ deviceId }) => (
            <Webcam
              key={deviceId}
              audio={false}
              height={videoConstraints.height}
              width={videoConstraints.width}
              videoConstraints={{ ...videoConstraints, deviceId }}
              onUserMediaError={(error) => sendLocalError(error)}
            />
          ))}
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="register-content"
          id="register-header"
        >
          <Typography>Register Camera</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <CameraRegister />
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="qr-content" id="qr-header">
          <Typography>Edit QR Codes</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <EditQR />
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="Ready Options"
          id="ready-header"
        >
          <Typography>Ready Options</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <ReadyOptions />
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
