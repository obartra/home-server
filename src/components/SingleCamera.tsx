import React from 'react';
import Webcam from 'react-webcam';

import * as cocoSsd from '@tensorflow-models/coco-ssd';

import { useModelDetect } from '@/hooks/useModelDetect';
import { usePOST } from '@/hooks/usePOST';
import { useSendLocalError } from '@/hooks/useSendLocalError';
import { Detection, DetectionClasses } from '@/types';
import { dateTimeFormatter } from '@/utils/dateTimeFormatter';
import { fingerprint } from '@/utils/fingerprint';

type Props = {
  deviceId: string;
  cameraName: string;
};
const videoConstraints = {
  width: 854,
  height: 480,
};

const BANNER_HEIGHT = 20;
const FONT_SIZE_PX = 14;
const HORIZONTAL_PADDING = BANNER_HEIGHT / 2;

function renderPredictions(
  predictions: cocoSsd.DetectedObject[],
  canvas: HTMLCanvasElement | null,
) {
  const ctx = canvas?.getContext('2d');

  if (!ctx || !canvas) {
    return;
  }

  // Font options.
  const font = '16px sans-serif';
  ctx.font = font;
  ctx.textBaseline = 'top';

  predictions.forEach((p) => {
    const x = p.bbox[0];
    const y = p.bbox[1];
    const width = p.bbox[2];
    const height = p.bbox[3];
    const color = '#00FFFF';
    // Draw the bounding box.
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, width, height);
    // Draw the label background.
    ctx.fillStyle = color;
    const text = `${p.class} (${Math.round(p.score * 100)}%)`;
    const textWidth = ctx.measureText(text).width;
    const textHeight = parseInt(font, 10); // base 10
    ctx.fillRect(x, y, textWidth + 4, textHeight + 4);

    // Draw the text last to ensure it's on top.
    ctx.fillStyle = '#000000';
    ctx.fillText(text, x, y);
  });
}

function useIsTabActive() {
  const [isTabActive, setIsTabActive] = React.useState(!document.hidden);
  React.useEffect(() => {
    function onChange() {
      setIsTabActive(!document.hidden);
    }
    document.addEventListener('visibilitychange', onChange);

    return () => {
      document.removeEventListener('visibilitychange', onChange);
    };
  }, []);

  return isTabActive;
}

function isImageColor(data: Uint8ClampedArray, pixelValue: 0 | 255) {
  return data.every((singleRGBA, index) =>
    (index + 1) % 4 === 0 ? true : singleRGBA === pixelValue,
  );
}

export const SingleCamera = ({ deviceId, cameraName }: Props) => {
  const sendLocalError = useSendLocalError();
  const postImage = usePOST(`/api/last-image/${fingerprint}`);
  const postDetection = usePOST<Detection>(`/api/last-detection/${fingerprint}`);
  const ref = React.useRef<Webcam>(null);
  const destination = React.useRef<HTMLCanvasElement>(null);
  const detections = React.useRef<cocoSsd.DetectedObject[]>([]);
  const isTabActive = useIsTabActive();

  const onPrediction = React.useCallback((newPredictions: cocoSsd.DetectedObject[]) => {
    detections.current = newPredictions;
  }, []);

  useModelDetect(destination.current, ['person', 'cat', 'dog'], onPrediction);

  React.useEffect(() => {
    const interval = setInterval(() => {
      if (!ref.current || !destination.current) {
        return;
      }
      const src = ref.current.getScreenshot();
      const timeNow = dateTimeFormatter.format(Date.now());
      const ctx = destination.current.getContext('2d');

      if (!ctx) {
        sendLocalError('Unable to retrieve canvas context');
        return;
      } else if (!src) {
        sendLocalError('Unable to retrieve source canvas');
        return;
      } else if (!isTabActive) {
        sendLocalError('Unable to send camera data when camera is not focused');
      }
      const img = new Image();
      img.src = src;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, videoConstraints.width, videoConstraints.height);
        const { data } = ctx?.getImageData(
          0,
          0,
          videoConstraints.width,
          videoConstraints.height,
        ) || { data: new Uint8ClampedArray() };

        if (isImageColor(data, 0) || isImageColor(data, 255)) {
          console.warn('Skip submission, no data');
          return;
        }

        renderPredictions(detections.current, destination.current);

        ctx.font = `${FONT_SIZE_PX}px monospace`;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, videoConstraints.height, videoConstraints.width, BANNER_HEIGHT);
        ctx.fillStyle = '#fff';
        ctx.fillText(
          `${cameraName} (${deviceId.substring(0, 10)}) - ${timeNow}`,
          HORIZONTAL_PADDING,
          videoConstraints.height + (BANNER_HEIGHT - FONT_SIZE_PX) / 2,
        );
        const image = destination.current?.toDataURL('image/avif', 0.4);
        if (!image) {
          sendLocalError('Image is EMPTY, cannot submit');
        } else {
          postImage({ image });
          if (detections.current.length) {
            detections.current.map((d) => {
              postDetection({
                class: d.class as DetectionClasses,
                time: Date.now(),
                image,
              });
            });
          }
        }
      };
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [deviceId, cameraName, sendLocalError, postImage, postDetection, isTabActive]);

  return (
    <>
      <Webcam
        audio={false}
        style={{ position: 'absolute', pointerEvents: 'none' }}
        height={videoConstraints.height}
        width={videoConstraints.width}
        videoConstraints={{ ...videoConstraints, deviceId }}
        onUserMediaError={(error) => sendLocalError(error)}
        ref={ref}
      />
      <canvas
        ref={destination}
        height={videoConstraints.height + 20}
        width={videoConstraints.width}
      />
    </>
  );
};
