function timeago(ms = 0) {
  let ago = Math.floor(ms / 1000);
  let part = 0;

  if (ago < 30) {
    return "moments ago";
  }
  if (ago < 60) {
    return ago + " seconds ago";
  }

  if (ago < 120) {
    return "a minute ago";
  }
  if (ago < 3600) {
    while (ago >= 60) {
      ago -= 60;
      part += 1;
    }
    return part + " minutes ago";
  }

  if (ago < 7200) {
    return "an hour ago";
  }
  if (ago < 86400) {
    while (ago >= 3600) {
      ago -= 3600;
      part += 1;
    }
    return part + " hours ago";
  }

  if (ago < 172800) {
    return "a day ago";
  }
  if (ago < 604800) {
    while (ago >= 172800) {
      ago -= 172800;
      part += 1;
    }
    return part + " days ago";
  }

  if (ago < 1209600) {
    return "a week ago";
  }
  if (ago < 2592000) {
    while (ago >= 604800) {
      ago -= 604800;
      part += 1;
    }
    return part + " weeks ago";
  }

  if (ago < 5184000) {
    return "a month ago";
  }
  if (ago < 31536000) {
    while (ago >= 2592000) {
      ago -= 2592000;
      part += 1;
    }
    return part + " months ago";
  }

  if (ago < 1419120000) {
    // 45 years, approximately the epoch
    return "more than year ago";
  }

  return "never";
}
const setImageDetectionStatus = status => {
  if (status === "REPORTING") {
    document.querySelector(".btn-reporting").style.display = "none";
    document.querySelector(".btn-paused").style.display = "inline-block";
  } else if (status === "PAUSED") {
    document.querySelector(".btn-reporting").style.display = "inline-block";
    document.querySelector(".btn-paused").style.display = "none";
  }
  document.querySelector(".image-detection-status").innerHTML = status;
};
const setImage = ({ image }) => {
  const img = document.querySelector('.webcam');
  
  if (image) {
    img.setAttribute("src", image);
  } else {
    img.removeAttribute("src")
  }
};
const setSeen = ({ recent, seen, tracking }) => {
  document.querySelector(".recently-seen").innerHTML = [
    {
      id: "cat",
      emoji: "🐱"
    },
    {
      id: "dog",
      emoji: "🐶"
    },
    {
      id: "person",
      emoji: "💁"
    }
  ]
    .filter(({ id }) => recent[id])
    .map(
      ({ id, emoji }) => `
            <div class="card text-white ${
              tracking[id] ? "bg-danger mb-3" : "bg-primary"
            }">
                <div class="card-body">
                    <span class="emoji}">${emoji}</span>
                </div>
            </div>
            `
    )
    .join(" ");

document.querySelector(".last-seen").innerHTML = `
    <ul class="list-group">
        ${[
            { label: "MEOW", id: "cat", date: seen.cat },
            { label: "WOOF", id: "dog", date: seen.dog },
            { label: "HUUMAN", id: "person", date: seen.person }
        ]
            .map(data => ({
            ...data,
            date: timeago(
                data.date
                ? Date.now() - data.date
                : Number.POSITIVE_INFINITY
            )
            }))
            .map(
            ({ label, date, id }) => `
                <li class="list-group-item ${
                    recent[id] ? "active" : ""
                }">
                    <label>${label}:</label>
                    <span>${date}</span>
                </li>`
            )
            .join("\n")}
    </ul>
`;
};

function setState(status) {
  fetch("/api/report-status", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ status })
  })
    .then(resp => resp.text())
    .then(setImageDetectionStatus)
    .catch(err => setImageDetectionStatus(`FAILED: ${err}`));
}
fetch("/api/report-status")
  .then(resp => resp.text())
  .then(setImageDetectionStatus);

setInterval(() => {
  fetch("/api/last-seen")
    .then(resp => resp.json())
    .then(setSeen);
  fetch("/api/last-image")
    .then(resp => resp.json())
    .then(setImage)
}, 2000);
