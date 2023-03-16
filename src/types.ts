export type DetectionClasses = 'person' | 'dog' | 'cat';

export type Camera = {
  name: string;
  id: string;
  lastContact: number;
  tracking: {
    [K in DetectionClasses]: boolean;
  };
  lastImages: [string, string, string];
  lastDetections: {
    [K in DetectionClasses]: Detection[];
  };
};

export type Detection<K extends DetectionClasses = DetectionClasses> = {
  image: string;
  time: number;
  class: K;
};
