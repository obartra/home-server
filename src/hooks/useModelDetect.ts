import React from 'react';

import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

function useModel() {
  const [model, setModel] = React.useState<cocoSsd.ObjectDetection | null>(null);

  React.useEffect(() => {
    cocoSsd.load().then(setModel);
  }, []);

  return model;
}

const MIN_SCORE = 0.8;

export function useModelDetect(
  canvas: HTMLCanvasElement | null,
  detectionClasses: string[],
  onPrediction: (predictions: cocoSsd.DetectedObject[]) => void,
) {
  const model = useModel();
  const refClasses = React.useRef<string[]>([]);

  refClasses.current = detectionClasses;

  React.useEffect(() => {
    let isStopped = false;
    function detect() {
      if (isStopped || !canvas || !model) {
        return;
      }
      model.detect(canvas).then((predictions) => {
        const filtered = predictions
          .filter((p) => refClasses.current.includes(p.class))
          .filter((p) => p.score >= MIN_SCORE);

        onPrediction(filtered);
      });
      requestAnimationFrame(detect);
    }
    detect();
    return () => {
      isStopped = true;
    };
  }, [canvas, model, onPrediction]);

  return model;
}
