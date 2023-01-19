import {
  ReadStream,
  createReadStream,
  existsSync,
  mkdirSync,
  readdir,
  unlink,
  writeFile,
} from 'fs';
import { without } from 'lodash';
import { extname, join, parse, resolve } from 'path';

import { getAllImageUrls } from './db';

const imgRoot = resolve(__dirname, '../../static');
const publicRoot = '/api/captures/';
const MAX_IMAGES = 100;

const privatePath = (path: string | undefined | null) => join(imgRoot, (path || "").replace(publicRoot, ''));
const publicPath = (path: string | undefined | null) => join(publicRoot, (path || "").replace(imgRoot, ''));

// Create imageRoot folder if it doesn't exist
if (!existsSync(imgRoot)) {
  mkdirSync(imgRoot, { recursive: true });
}

export function saveImageToDisk(
  base64: string,
  name: string | number,
  time: number,
): Promise<string> {
  const extension = base64.match(/^data:image\/(.+);base64,/)?.[1];
  const fileName = `${name}_${time}.${extension}`;
  const imageData = base64.split(';base64,').pop() || '';

  return new Promise((res, reject) => {
    if (!extension) {
      reject(new Error(`Invalid extension for: ${base64.substring(0, 50)}...`));
      return;
    }

    writeFile(privatePath(fileName), imageData, { encoding: 'base64' }, (err) => {
      if (err) {
        reject(err);
      } else {
        removeOldImages()
          .then(() => res(publicPath(fileName)))
          .catch(reject);
      }
    });
  });
}

export function getImageFromDisk(url: string): { stream: ReadStream; mimeType: `image/${string}` } {
  const filePath = privatePath(url || "").split('?')[0];

  const buffer = Buffer.from(filePath);

  return {
    stream: createReadStream(buffer),
    mimeType: `image/${extname(filePath)}`,
  };
}

const getTimestampFromFileName = (file: string): number =>
  Number.parseInt(parse(file).name.split('_')[1], 10);

function removeOldImages(): Promise<void> {
  return new Promise((resolve, reject) => {
    readdir(imgRoot, (err, files) => {
      if (err) {
        reject(new Error(`Failed to delete: ${err.message}`));
        return;
      }
      const inUseImages = getAllImageUrls().map(privatePath);
      const deleteCandidates = without(files, ...inUseImages).sort(
        (a, b) => getTimestampFromFileName(a) - getTimestampFromFileName(b),
      );

      if (deleteCandidates.length <= MAX_IMAGES) {
        resolve();
        return;
      }

      const p = Promise.resolve();

      while (deleteCandidates.length > MAX_IMAGES) {
        const next = deleteCandidates.shift();
        if (next) {
          p.then(() => new Promise<Error | null>((r) => unlink(join(imgRoot, next), r)));
        }
      }

      p.then(resolve).catch(reject);
    });
  });
}
