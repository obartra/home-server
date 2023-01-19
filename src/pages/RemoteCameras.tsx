import TimeAgo from 'react-timeago';

import {
  Box,
  Card,
  CardContent,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Typography,
} from '@mui/material';

import { useJSON } from '@/hooks/useJSON';
import { Camera } from '@/types';

import css from './RemoteCameras.module.css';

export const RemoteCameras = () => {
  const [cameras] = useJSON<Camera[]>(`/api/camera`, [], { refetchEveryMs: 2000 });
  (window as any).cameras = cameras;

  return (
    <Box>
      {cameras.map((camera) => (
        <Card key={camera.id}>
          <CardContent>
            <Typography gutterBottom variant="h5" component="div">
              {camera.name}
            </Typography>
            <div className={css.lastImages}>
              {camera.lastImages?.[0] && <img height="150" src={camera.lastImages[0]} />}
              {camera.lastImages?.[1] && <img height="120" src={camera.lastImages[1]} />}
              {camera.lastImages?.[2] && <img height="80" src={camera.lastImages[2]} />}
            </div>
            <div>
              {Object.entries(camera.lastDetections || {}).filter(([, { length }]) => length)
                .length ? (
                <Typography gutterBottom variant="h6" component="div">
                  DETECTIONS
                </Typography>
              ) : null}
              {Object.values(camera.lastDetections || {})
                .flat()
                .filter(Boolean).length > 0 ? (
                <ImageList cols={3} sx={{ width: 620 }}>
                  {Object.values(camera.lastDetections || ({} as Camera['lastDetections'])).flatMap(
                    (detections) =>
                      detections.filter(Boolean).map((d) => (
                        <ImageListItem key={d.time}>
                          <img src={d.image} loading="lazy" />
                          <ImageListItemBar
                            position="below"
                            title={<TimeAgo date={d.time} />}
                            subtitle={d.class}
                          />
                        </ImageListItem>
                      )),
                  )}
                </ImageList>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};
