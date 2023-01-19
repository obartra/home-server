import bodyParser from 'body-parser';
import express, { NextFunction, Request, Response } from 'express';
import { readFileSync } from 'fs';
import http from 'http';
import https from 'https';
import { resolve } from 'path';
import QRImage from 'qr-image';

import * as logger from './logger';
import {
  addCameraDetection,
  addCameraImage,
  addLog,
  addQR,
  getCamera,
  getCameras,
  getHelpPhoneNumbers,
  getLogs,
  getPhoneNumbers,
  getQR,
  getQRs,
  getReady,
  getReportingStatus,
  removeCamera,
  removeQR,
  sendHelpSMS,
  setHelpPhoneNumbers,
  setPhoneNumbers,
  setReady,
  setReportingStatus,
  upsertCamera,
} from './db';
import './env';
import { getImageFromDisk } from './fs';
import { sendSMS } from './sms';

const REPORTING = 'REPORTING';
const PAUSED = 'PAUSED';
const isProd = process.argv.includes('--prod');
const port = 3001;

const app = express();
const clientBuildPath = resolve(__dirname, '../../dist');
app.use(bodyParser.json({ limit: '10mb' }));

if (isProd) {
  logger.info('service', `serving static production assets from: ${clientBuildPath}`);
  app.use(express.static(clientBuildPath));
} else {
  logger.info('service', 'running dev build');
}

app.use((req: Request, _res: Response, next: NextFunction) => {
  if ((req.url !== '/api/logs' && req.url !== '/api/camera') || req.method !== 'GET') {
    logger.info('service', `${req.method} ${req.url}`);
  }
  next();
});

app.get('/api/camera', (_req, res) => {
  try {
    const cameras = getCameras();
    res.status(200).send(cameras);
  } catch (err) {
    logger.error('camera', `Failed to retrieve cameras`, (err as Error).message);
    res.status(500).send((err as Error).message);
  }
});
app.post('/api/camera', (req, res) => {
  try {
    const status = upsertCamera(req.body);
    logger.info('camera', `Camera added ${status}`, status === 'NOCHANGE' ? undefined : req.body);
    res.status(200).send(status);
  } catch (err) {
    logger.error('camera', `Failed to insert camera`, (err as Error).message);
    res.status(500).send((err as Error).message);
  }
});
app.delete('/api/camera/:fingerprint', (req, res) => {
  try {
    const status = removeCamera(`${req.params.fingerprint}`);

    if (status === 200) {
      logger.info('camera', `Camera ${req.params.fingerprint} found and deleted`);
      res.status(200).send({ status: 'OK' });
    } else if (status === 404) {
      logger.warn('camera', `Camera ${req.params.fingerprint} NOT found. Unable to delete`);
      res.status(404).send();
    } else {
      logger.warn('camera', `Camera ${req.params.fingerprint} Unknown status response: ${status}`);
      res.status(status).send();
    }
  } catch (err) {
    res.status(500).send((err as Error).message);
  }
});

app.get('/api/camera/:fingerprint', (req, res) => {
  const camera = getCamera(`${req.params.fingerprint}`);

  if (camera) {
    logger.info('camera', `Retrieved camera by fingerprint ${req.params.fingerprint}`);
    res.status(200).send(camera);
  } else {
    logger.warn('camera', `Camera with fingerprint ${req.params.fingerprint} not found`);
    res.status(404).send();
  }
});

app.post('/api/last-detection/:fingerprint', (req, res) => {
  try {
    addCameraDetection(`${req.params.fingerprint}`, req.body);
    res.status(200).send({ status: 'OK' });
  } catch (err) {
    res.status(500).send((err as Error).message);
  }
});

app.post('/api/last-image/:fingerprint', (req, res) => {
  try {
    addCameraImage(`${req.params.fingerprint}`, req.body.image);
    res.status(200).send({ status: 'OK' });
  } catch (err) {
    res.status(500).send((err as Error).message);
  }
});

app.post('/api/message', (req, res) => {
  const message = req.body.message;

  (sendSMS(message) || Promise.resolve())
    .then(() => res.status(200).send(`message sent`))
    .catch((err) => res.status(500).send(err));
});

app.get('/api/logs', (_req, res) => {
  try {
    const logs = getLogs();
    res.status(200).send(logs);
  } catch (e) {
    res.status(500).send((e as Error).message);
  }
});
app.post('/api/logs', (req, res) => {
  try {
    addLog({
      timestamp: Date.now(),
      scope: 'local',
      message: req.body.message,
      data: req.body.fingerprint,
    });

    res.status(200).send({ status: 'OK' });
  } catch (e) {
    res.status(500).send((e as Error).message);
  }
});

app.get('/api/qr', (_req, res) => {
  try {
    const qrs = getQRs();
    res.status(200).send(qrs);
  } catch (e) {
    res.status(500).send((e as Error).message);
  }
});

app.post('/api/qr', (req, res) => {
  try {
    addQR(req.body);
    res.status(200).send({ status: 'OK' });
  } catch (e) {
    res.status(500).send((e as Error).message);
  }
});

app.delete('/api/qr/:name', (req, res) => {
  try {
    removeQR(`${req.params.name}`);
    res.status(200).send({ status: 'OK' });
  } catch (e) {
    res.status(500).send((e as Error).message);
  }
});

app.get('/api/qr/:name.png', (req, res) => {
  const qr = getQR(req.params.name);

  if (!qr) {
    res.status(404).send();
  } else if (qr.type === 'wifi') {
    //                          WIFI:S:SSID_NAME_;T:WPA_____________;P:PASSWORD______;;
    const code = QRImage.image(`WIFI:S:${qr.name};T:${qr.encryption};P:${qr.password};;`, {
      type: 'png',
    });
    res.type('png');
    code.pipe(res);
  } else if (qr.type === 'url') {
    const code = QRImage.image(qr.url, {
      type: 'png',
    });
    res.type('png');
    code.pipe(res);
  } else {
    res.status(400).send('Malformed QR code, QR type not supported');
  }
});

app.get('/api/report-status', (_req, res) => {
  res.status(200).send({ status: getReportingStatus() ? REPORTING : PAUSED });
});

app.post('/api/report-status', (req, res) => {
  const status = req.body.status;
  const isStart = status === REPORTING;
  const isStop = status === PAUSED;
  if (isStart || isStop) {
    setReportingStatus(isStart);
    res.status(200).send({ status });
  } else {
    res.status(400).send(`Invalid status, only "${REPORTING}" and "${PAUSED}" values allowed`);
  }
});

app.get('/api/phones', (_req, res) => {
  res.status(200).send({ phones: getPhoneNumbers() });
});

app.post('/api/phones', (req, res) => {
  const phones = req.body.phones || [];
  if (Array.isArray(phones)) {
    const cleaned = phones.filter(Boolean).map((phone) => `${phone}`);
    setPhoneNumbers(cleaned);
    res.status(200).send({ phones: cleaned });
  } else {
    res.status(400).send(`Invalid phone list, must be a string array`);
  }
});

app.get('/api/captures/:img.:ext', (req, res) => {
  try {
    const { stream, mimeType } = getImageFromDisk(req.url);
    stream.on('open', () => {
      res.set('Content-Type', mimeType);
      stream.pipe(res);
    });
    stream.on('error', () => {
      res.set('Content-Type', 'text/plain');
      res.status(404).end('Not found');
    });
  } catch (error) {
    logger.error('image', (error as Error).message);
    res.set('Content-Type', 'text/plain');
    res.status(404).end((error as Error).message);
  }
});

app.post('/api/help/message/:room', (req, res) => {
  const { message = '' } = req.body || {};
  const room = `${req.params.room || ''}`;

  sendHelpSMS(message, room)
    ?.then(() => res.status(200).send('MESSAGE SENT'))
    .catch((e: Error) => res.status(400).send(`Failed to send help SMS, ${e.message}`));
});

app.get('/api/help/phones', (_req, res) => {
  res.status(200).send({ phones: getHelpPhoneNumbers() });
});

app.post('/api/help/phones', (req, res) => {
  const phones = req.body.phones || [];
  if (Array.isArray(phones)) {
    setHelpPhoneNumbers(phones);
    res.status(200).send({ status: 'OK' });
  } else {
    res.status(400).send(`Invalid phone list, must be a string array`);
  }
});

app.post('/api/ready', (req, res) => {
  try {
    setReady(req.body || []);
    res.status(200).send({ status: 'OK' });
  } catch {
    res.status(400).send(`Unable to set to ready`);
  }
});

app.get('/api/ready', (req, res) => {
  try {
    res.status(200).send(getReady());
  } catch {
    res.status(400).send(`Unable to retrieve ready status`);
  }
});

app.get('/api/ping', (req, res) => {
  res.status(200).send('pong');
});

/* final catch-all route to index.html defined last */
if (isProd) {
  app.get('/*', (req, res) => res.sendFile(resolve(clientBuildPath, 'index.html')));
}

const options = {
  key: readFileSync('server.key'),
  cert: readFileSync('server.cert'),
};

const onServerReady = (service: string, p: number) => () =>
  logger.info('service', `${service} server started on port ${p}`);

http.createServer(app).listen(port, onServerReady('HTTP', port));
https.createServer(options, app).listen(443, onServerReady('HTTPS', 443));
