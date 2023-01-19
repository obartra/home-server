import DeleteIcon from '@mui/icons-material/Delete';
import {
  Avatar,
  IconButton,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
} from '@mui/material';

import { useDELETE } from '@/hooks/useDELETE';

import { QR } from './types';

type Props = {
  qr: QR;
  refetch?: () => void;
};

export function QRListItem({ qr, refetch }: Props) {
  const deleteAction = useDELETE(`/api/qr/${qr?.name}`);

  if (!qr?.name || !qr?.type) {
    return <></>;
  }

  return (
    <ListItem
      alignItems="flex-start"
      secondaryAction={
        <IconButton edge="end" aria-label="delete" onClick={() => deleteAction().then(refetch)}>
          <DeleteIcon />
        </IconButton>
      }
    >
      <ListItemAvatar>
        <Avatar src={`/api/qr/${qr.name}.png`} />
      </ListItemAvatar>
      <ListItemText
        primary={qr.type.toUpperCase()}
        secondary={
          qr.type === 'wifi' ? (
            <>
              <Typography
                sx={{ display: 'inline', mr: 2 }}
                component="span"
                variant="body2"
                color="text.primary"
              >
                {qr.encryption} - {qr.name}
              </Typography>
              {qr.password}
            </>
          ) : qr.type === 'url' ? (
            <>
              <Typography
                sx={{ display: 'inline', mr: 2 }}
                component="span"
                variant="body2"
                color="text.primary"
              >
                {qr.name}
              </Typography>
              {qr.url}
            </>
          ) : (
            <></>
          )
        }
      />
    </ListItem>
  );
}
