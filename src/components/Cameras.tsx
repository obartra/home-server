import React from 'react';

import { useAllMedia } from '@/hooks/useAllMedia';

import { SingleCamera } from './SingleCamera';

type Props = {
  style?: React.CSSProperties;
  cameraName: string;
};

export const Cameras = ({ style, cameraName }: Props) => {
  const media = useAllMedia();

  return (
    <div style={style}>
      {media.map(({ deviceId }) => (
        <SingleCamera key={deviceId} deviceId={deviceId} cameraName={cameraName} />
      ))}
    </div>
  );
};
