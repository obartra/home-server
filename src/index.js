import React from "react";
import ReactDOM from "react-dom";
import _ from "lodash";

import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";
import "./styles.css";

const MIN_SCORE = 0.75;
let img = null;

async function lastSeen(seen) {
  const rawResponse = await fetch("/api/last-seen", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ seen })
  });
  return rawResponse.json();
}

async function lastImage(image) {
  const rawResponse = await fetch("/api/last-image", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ image })
  });
  return rawResponse.json();
}

const hasAnyClass = (predictions, className) => predictions.some(p => p.class === className && p.score > MIN_SCORE);

const lastDetected = {};
const PERSON = "person";
const CAT = "cat";
const DOG = "dog";

class App extends React.Component {
  videoRef = React.createRef();
  canvasRef = React.createRef();

  componentDidMount() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const webCamPromise = navigator.mediaDevices
        .getUserMedia({
          audio: false,
          video: {
            facingMode: "user"
          }
        })
        .then(stream => {
          window.stream = stream;
          this.videoRef.current.srcObject = stream;
          return new Promise(resolve => {
            this.videoRef.current.addEventListener("play", function () {
              img = this;
            });
            this.videoRef.current.onloadedmetadata = resolve;
          });
        });
      const modelPromise = cocoSsd.load();
      Promise.all([modelPromise, webCamPromise])
        .then(values => {
          this.detectFrame(this.videoRef.current, values[0]);
        })
        .catch(error => {
          console.error(error);
        });
    }
  }

  detectFrame = (video, model) => {
    model.detect(video).then(predictions => {
      this.renderPredictions(predictions);
      this.renderAlerts(predictions);
      requestAnimationFrame(() => {
        this.detectFrame(video, model);
      });
    });
  };

  notify = _.throttle(() => {
    lastSeen({
      [PERSON]: lastDetected[PERSON],
      [CAT]: lastDetected[CAT],
      [DOG]: lastDetected[DOG]
    });
  }, 30000);

  renderAlerts = predictions => {
    const has = {
      [PERSON]: hasAnyClass(predictions, PERSON),
      [CAT]: hasAnyClass(predictions, CAT),
      [DOG]: hasAnyClass(predictions, DOG)
    };
    
    console.log("Found:", Object.entries(has).filter(([k, v]) => v).map(([k])=> k).join(", ") || "nothing")
    const now = Date.now();

    Object.entries(has).forEach(([key, hasAny]) => {
      if (hasAny) {
        lastDetected[key] = now;
        this.notify();
      }
    });
  };

  uploadImage = _.throttle(() => {
      const image = this.canvasRef.current.toDataURL("image/jpeg", 0.8);
      lastImage(image);
  }, 2000)

  renderPredictions = predictions => {
    const ctx = this.canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    // Font options.
    const font = "16px sans-serif";
    ctx.font = font;
    ctx.textBaseline = "top";
    if (img) {
      ctx.drawImage(img, 0, 0);
    }

    predictions.forEach(prediction => {
      const x = prediction.bbox[0];
      const y = prediction.bbox[1];
      const width = prediction.bbox[2];
      const height = prediction.bbox[3];
      const color = prediction.score >= MIN_SCORE ? "#00FFFF" : "#777"
      // Draw the bounding box.
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, width, height);
      // Draw the label background.
      ctx.fillStyle = color;
      prediction.text = `${prediction.class} (${Number.parseInt(prediction.score * 100, 10)}%)`;
      const textWidth = ctx.measureText(prediction.text).width;
      const textHeight = parseInt(font, 10); // base 10
      ctx.fillRect(x, y, textWidth + 4, textHeight + 4);

      // Draw the text last to ensure it's on top.
      ctx.fillStyle = "#000000";
      ctx.fillText(prediction.text, x, y);
    });

    const options = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    };
    const text = new Intl.DateTimeFormat("en-US", options).format(new Date());
    const padding = 2;
    const textWidth = ctx.measureText(text).width;
    const bottomOffset = 20;
    ctx.strokeStyle = "#000000";
    ctx.fillRect(ctx.canvas.height - bottomOffset, 0, textWidth + (padding*2), bottomOffset);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(text, padding, ctx.canvas.height - bottomOffset + padding);
    this.uploadImage();
  };

  render() {
    return (
      <div>
        <video
          className="size"
          autoPlay
          playsInline
          muted
          ref={this.videoRef}
          width="600"
          height="500"
        />
        <canvas
          className="size"
          ref={this.canvasRef}
          width="600"
          height="500"
        />
      </div>
    );
  }
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
