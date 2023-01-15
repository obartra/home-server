const express = require("express");
const bodyParser = require("body-parser");
const twilio = require("twilio");

const app = express();
app.use(bodyParser.json({ limit: "10mb" }));

require("dotenv").config();
const accountSid = process.env.accountSid;
const authToken = process.env.authToken;
const client = new twilio(accountSid, authToken);

const REPORTING = "REPORTING";
const PAUSED = "PAUSED";
const PERSON = "person";
const CAT = "cat";
const DOG = "dog";

const timeout = 120000;
const state = {
  isReporting: true,
  lastSeen: {},
  phones: JSON.parse(process.env.phones).map(
    p => `+1${p.replace(/[\s().-]/g, "")}`
  ),
  tracking: {
    [PERSON]: false,
    [CAT]: true,
    [DOG]: true
  }
};

function send(message) {
  if (state.isReporting) {
    return Promise.all(
      state.phones.map(to =>
        client.messages
          .create({
            body: message,
            from: process.env.twilioPhone,
            to
          })
          .then(resp => console.log(`message sent to ${to}: ${resp.sid}`))
          .catch(err => {
            console.error(`FAILED REQUEST to ${to}`, err);
            throw new Error(err);
          })
      )
    );
  } else {
    console.log("[SKIPPED] message:", message);
  }
}
const emojis = {
  [CAT]: "🐱",
  [DOG]: "🐶",
  [PERSON]: "💁"
};
function changeReportingStatus(newReportingStatus) {
  state.isReporting = newReportingStatus;
  console.log("STATE:");
  console.dir(state, { depth: 10 });
}
app.post("/api/last-seen", (req, res) => {
  const seen = req.body.seen;
  state.lastSeen = {
    [PERSON]: seen[PERSON] || state.lastSeen[PERSON],
    [DOG]: seen[DOG] || state.lastSeen[DOG],
    [CAT]: seen[CAT] || state.lastSeen[CAT]
  };
  const now = Date.now();
  const recent = {
    [PERSON]: seen[PERSON] ? now - seen[PERSON] < timeout : false,
    [CAT]: seen[CAT] ? now - seen[CAT] < timeout : false,
    [DOG]: seen[DOG] ? now - seen[DOG] < timeout : false
  };

  if (recent[PERSON]) {
    if (state.tracking[PERSON]) {
      send(
        `person detected (third floor) at ${new Date(
          state.lastSeen[PERSON]
        ).toUTCString()}`
      );
    }
    if (recent[CAT] || recent[DOG]) {
      console.log(emojis[PERSON], emojis[DOG], emojis[CAT]);
    } else {
      console.log(emojis[PERSON]);
    }
  } 
  if (recent[CAT] || recent[DOG]) {
    if (state.tracking[CAT] || state.tracking[DOG]) {
      send(
        `PET DETECTED (third floor) at ${new Date(
          state.lastSeen[CAT] || state.lastSeen[DOG]
        ).toUTCString()}`
      );
    }
  }

  res.status(200).send(state.lastSeen);
});
app.get("/api/last-seen", (req, res) => {
  const now = Date.now();
  const seen = state.lastSeen;

  const recent = {
    [PERSON]: seen[PERSON] ? now - seen[PERSON] < timeout : false,
    [CAT]: seen[CAT] ? now - seen[CAT] < timeout : false,
    [DOG]: seen[DOG] ? now - seen[DOG] < timeout : false
  };

  res.status(200).send({ recent, seen, tracking: state.tracking });
});

app.post("/api/last-image", (req, res) => {
  state.lastImage = req.body.image;

  res.status(200).send({ image: state.lastImage });
});

app.get("/api/last-image", (req, res) => {
  res.status(200).send({ image: state.lastImage });
});

app.post("/api/message", (req, res) => {
  const message = req.body.message;

  send(message)
    .then(resp => res.status(200).send(`message sent: ${resp.sid}`))
    .catch(err => res.status(500).send(err));
});

app.post("/api/report-status", (req, res) => {
  const status = req.body.status;
  console.log("setting status:", status);
  const isStart = status === REPORTING;
  const isStop = status === PAUSED;
  if (isStart || isStop) {
    changeReportingStatus(isStart);
    res.status(200).send(status);
  } else {
    res.status(300).send("Invalid status");
  }
});
app.get("/api/report-status", (req, res) => {
  res.status(200).send(state.isReporting ? REPORTING : PAUSED);
});

app.use(express.static("remote"));

app.listen(3001, () => {
  console.log("Server started on port 3001");
});
