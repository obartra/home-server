import { resolve } from 'path';
import JsonDB from 'simple-json-db';

import * as logger from './logger';
import { saveImageToDisk } from './fs';
import { sendSMS, sendUrgentSMS } from './sms';

process.env.TZ = 'America/New_York';

type ExtractKeyWithArrayValue<T> = {
  [P in keyof T]: T[P] extends Array<unknown> ? P : never;
}[keyof T];

export type LogScope = 'sms' | 'detection' | 'service' | 'camera' | 'local' | 'image';

export type Log = {
  scope: LogScope;
  message: string;
  data: object | string | number | boolean | null;
  timestamp: number;
};

type DetectionClasses = 'dog' | 'cat' | 'person';
type ImageURL = string;

type Tracking = {
  [key in DetectionClasses]: boolean;
};
type LastSeen = {
  [key in DetectionClasses]: number;
};
type RecentDetections = Tracking;
type Fingerprint = string;

type Detection<K = DetectionClasses> = {
  class: K;
  time: number;
  image: ImageURL;
};

type Camera = {
  name: string;
  id: Fingerprint;
  lastContact: number;
  tracking: Tracking;
  lastImages: ImageURL[];
  lastDetections: {
    [K in DetectionClasses]: Array<Omit<Detection, 'class'> & { class: K }>;
  };
};

type QR =
  | {
      type: 'wifi';
      encryption: 'WPA' | 'WEP';
      name: string;
      password: string;
    }
  | {
      type: 'url';
      name: string;
      url: string;
    };

type DBSchema = {
  'help/phones': string[];
  cameras: Camera[];
  isReporting: boolean;
  logs: Log[];
  phones: string[];
  qr: QR[];
  ready: string[];
};

const MAX_LAST_DETECTIONS = 3;
const MAX_LAST_IMAGES = 3;
const defaults: DBSchema = {
  'help/phones': [],
  ready: [],
  cameras: [],
  isReporting: true,
  logs: [],
  phones: [],
  qr: [],
};
const defaultTracking: Tracking = {
  person: false,
  dog: true,
  cat: true,
};
const emojis: { [key in DetectionClasses]: string } = {
  cat: '🐱',
  dog: '🐶',
  person: '💁',
};

const DETECTION_TIMEOUT = 12_000;
const MAX_ITEMS: { [key in ExtractKeyWithArrayValue<DBSchema>]: number } = {
  'help/phones': 10,
  cameras: Number.MAX_SAFE_INTEGER,
  logs: 100,
  phones: 10,
  qr: 20,
  ready: 10,
};

const getFn =
  <K extends keyof DBSchema>(key: K) =>
  (): DBSchema[K] =>
    db.get(key) ?? defaults[key];
const setFn =
  <K extends keyof DBSchema>(key: K) =>
  (newVal: DBSchema[K]) =>
    db.set(key, newVal);
const pushFn =
  <K extends ExtractKeyWithArrayValue<DBSchema>>(key: K) =>
  (newVal: DBSchema[K][0]) => {
    const values: DBSchema[typeof key] = db.get(key);

    if (!values) {
      db.set(key, [newVal]);
    } else if (Array.isArray(values)) {
      if (values.length > MAX_ITEMS[key]) {
        values.shift();
      }
      db.set(key, [...values, newVal]);
    } else {
      throw new Error('push action can only be called for array methods');
    }
  };
const removeByFn =
  <K extends ExtractKeyWithArrayValue<DBSchema>, S extends keyof DBSchema[K][0]>(
    key: K,
    deleteKey: S,
  ) =>
  (deleteValue: DBSchema[K][0][S]) => {
    const array = db.get(key);
    const updated = array.filter((item: DBSchema[K][0]) => item[deleteKey] !== deleteValue);

    if (updated.length === array.length) {
      logger.warn('service', `Unable to delete by key ${key}/${String(deleteKey)}: ${deleteValue}`);
      return 404;
    }
    logger.warn('service', `Deleted ${key}/${String(deleteKey)}: ${deleteValue}`);
    db.set(key, updated);
    return 200;
  };
const upsertByFn =
  <K extends ExtractKeyWithArrayValue<DBSchema>>(key: K, upsertKey: keyof DBSchema[K][0]) =>
  (newVal: DBSchema[K][0]) => {
    const values: DBSchema[typeof key] = db.get(key);

    if (!values) {
      db.set(key, [newVal]);
    } else if (Array.isArray(values)) {
      // @ts-expect-error it doesn't understand the refinement
      const existing = values.find((item: DBSchema[K][0]) => item[upsertKey] === newVal[upsertKey]);
      if (existing) {
        if (JSON.stringify(existing) === JSON.stringify(newVal)) {
          return 'NOCHANGE';
        }
        Object.entries(newVal).forEach(([k, v]) => {
          existing[k] = v;
        });
        db.set(key, values);
        return 'UPDATE';
      }
      if (values.length > MAX_ITEMS[key]) {
        values.shift();
      }
      db.set(key, [...values, newVal]);
      return 'INSERT';
    } else {
      throw new Error('push action can only be called for array methods');
    }
  };

const db = new JsonDB(resolve(__dirname, '../src/db.json'));
const detectionClasses: DetectionClasses[] = ['person', 'cat', 'dog'];

export function getAllImageUrls() {
  const cameras: Camera[] = db.JSON().cameras || [];

  return cameras
    .flatMap(({ lastImages, lastDetections }) => [
      ...(lastImages || []),
      ...(Object.values(lastDetections || {}).flatMap((detections) =>
        detections.map((d) => d?.image),
      ) || []),
    ])
    .filter(Boolean);
}

export const setReportingStatus = setFn('isReporting');
export const getReportingStatus = getFn('isReporting');
export const setPhoneNumbers = (phones: string[]) =>
  setFn('phones')(
    phones
      .map((val) => val.trim())
      .filter(Boolean)
      .map((phone) => `${phone}`),
  );
export const getPhoneNumbers = getFn('phones');
export const addLog = pushFn('logs');
export const getLogs = getFn('logs');
export const removeCamera = removeByFn('cameras', 'id');
export const addCamera = (
  name: string,
  id: number | Fingerprint,
  tracking: Partial<Tracking> = {},
) => {
  pushFn('cameras')({
    name,
    id: `${id}`,
    lastContact: Date.now(),
    lastImages: [],
    lastDetections: Object.fromEntries(
      detectionClasses.map((c) => [c, []]),
    ) as unknown as Camera['lastDetections'],
    tracking: {
      ...defaultTracking,
      ...tracking,
    },
  });
};

export const setReady = setFn('ready');
export const getReady = getFn('ready');
export const sendHelpSMS = (message: string, room?: string) =>
  sendUrgentSMS(`${message} (${room}) at ${new Date().toUTCString()}`, getHelpPhoneNumbers());
export const getHelpPhoneNumbers = getFn('help/phones');
export const setHelpPhoneNumbers = (phones: string[]) =>
  setFn('help/phones')(
    phones
      .map((val) => val.trim())
      .filter(Boolean)
      .map((phone) => `${phone}`),
  );
export const getQRs = getFn('qr');
export const getQR = (name: string) => getQRs().find((qr) => qr.name === name);
export const addQR = pushFn('qr');
export const removeQR = removeByFn('qr', 'name');
export const getCameras = () => getFn('cameras')().map((c) => ({ ...c, id: `${c.id}` }));
export const upsertCamera = upsertByFn('cameras', 'id');
export const getCamera = (fingerprint: number | Fingerprint) =>
  getCameras().find((camera) => `${camera.id}` === `${fingerprint}`);
export function addCameraDetection<K extends DetectionClasses = DetectionClasses>(
  fingerprint: number | Fingerprint,
  detection: Detection<K>,
) {
  const cameras = getCameras();
  const camera = cameras.find((c) => `${c.id}` === `${fingerprint}`);

  if (!camera) {
    throw new Error(`Camera ${fingerprint} not found, unable to add detection`);
  }

  camera.lastContact = Date.now();
  camera.lastDetections = Object.fromEntries(
    detectionClasses.map((c) => [c, [...(camera.lastDetections?.[c] || [])]]),
  ) as Camera['lastDetections'];

  return saveImageToDisk(detection.image, fingerprint, camera.lastContact).then((image) => {
    const previous = [...(camera.lastDetections[detection.class as K] || [])];

    // @ts-expect-error this is valid but doesn't understand the refinement
    camera.lastDetections[detection.class] = [{ ...detection, image }];
    for (let i = 1; i < MAX_LAST_DETECTIONS; i++) {
      camera.lastDetections[detection.class][i] = previous[i - 1];
    }

    const { recent, lastSeen } = recentDetections(camera.lastDetections);

    if (Object.values(recent).some((isRecent) => isRecent)) {
      sendMessageIfTracking(recent, lastSeen, camera.tracking);
    }
    setFn('cameras')(cameras);
  });
}

export const addCameraImage = (fingerprint: number | Fingerprint, image: ImageURL) => {
  const cameras = getCameras();
  const camera = cameras.find((c) => `${c.id}` === `${fingerprint}`);
  if (!camera) {
    throw new Error(`Camera ${fingerprint} not found, unable to add last image`);
  }
  camera.lastContact = Date.now();

  return saveImageToDisk(image, fingerprint, camera.lastContact).then((file) => {
    const previous = [...(camera.lastImages || [])];
    camera.lastImages = [file];

    for (let i = 1; i < MAX_LAST_IMAGES; i++) {
      camera.lastImages[i] = previous[i - 1];
    }
    setFn('cameras')(cameras);
  });
};

function recentDetections(lastDetections: Camera['lastDetections']): {
  recent: RecentDetections;
  lastSeen: LastSeen;
} {
  const now = Date.now();
  const lastSeen = Object.fromEntries(
    detectionClasses.map((c) => [
      c,
      Math.max(...lastDetections[c].map((d) => d?.time).filter(Boolean), 0),
    ]),
  ) as LastSeen;

  return {
    lastSeen,
    recent: Object.fromEntries(
      detectionClasses.map((c) => [c, lastSeen[c] ? now - lastSeen[c] < DETECTION_TIMEOUT : false]),
    ) as RecentDetections,
  };
}

function sendMessageIfTracking(recent: RecentDetections, lastSeen: LastSeen, tracking: Tracking) {
  if (recent.person) {
    if (tracking.person) {
      sendSMS(`person detected (third floor) at ${new Date(lastSeen.person).toUTCString()}`);
    }
    if (recent.cat || recent.dog) {
      logger.info('detection', `${emojis.person} ${emojis.dog} ${emojis.cat}`);
    } else {
      logger.info('detection', `${emojis.person} at ${new Date(lastSeen.person).toUTCString()}`);
    }
  }
  if (recent.cat || recent.dog) {
    if (tracking.cat || tracking.dog) {
      sendSMS(
        `PET DETECTED (third floor) at ${new Date(
          Math.max(lastSeen.cat, lastSeen.dog),
        ).toUTCString()}`,
      );
    }
  }
}
