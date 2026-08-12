const hero = document.querySelector("#hero");
const scene = document.querySelector(".scene");
const brickTrack = document.querySelector("#brickTrack");
const spark = document.querySelector("#spark");
const statusText = document.querySelector("#statusText");
const statusDot = document.querySelector("#statusDot");
const beatCount = document.querySelector("#beatCount");
const clockTime = document.querySelector("#clockTime");
const clockDate = document.querySelector("#clockDate");

let timer;
let count = 0;
let runFrame = 0;
let audioContext;
let nextBrickTime;
const bricks = [];
const BRICK_SPEED = 88;

function heroPositionAt(time, width) {
  return width / 2;
}

function createBrick(targetTime) {
  const element = document.createElement("div");
  element.className = "brick";
  element.innerHTML = '<span class="brick-mark">?</span>';
  brickTrack.appendChild(element);
  bricks.push({ element, targetTime });
}

function animateWorld() {
  const now = Date.now();
  const sceneWidth = brickTrack.clientWidth;
  hero.style.left = `${heroPositionAt(now, sceneWidth)}px`;
  spark.style.left = `${heroPositionAt(now, sceneWidth)}px`;

  while (nextBrickTime < now + 5200) {
    createBrick(nextBrickTime);
    nextBrickTime += 5000;
  }

  for (let index = bricks.length - 1; index >= 0; index -= 1) {
    const item = bricks[index];
    const meetingX = heroPositionAt(item.targetTime, sceneWidth);
    const x = meetingX + BRICK_SPEED * ((item.targetTime - now) / 1000) - 23;
    item.element.style.transform = `translateX(${x}px)`;
    if (x < -60) {
      item.element.remove();
      bricks.splice(index, 1);
    }
  }

  requestAnimationFrame(animateWorld);
}

function drawHero(frame = 0) {
  const ctx = hero.getContext("2d");
  const p = 6;
  const colors = { r: "#c83d32", s: "#f0ad73", b: "#315aa0", n: "#382a25", w: "#f8ead0", h: "#6e3d27" };
  const rows = [
    "....rrrrrr........",
    "...rrrrrrrrr......",
    "...hhssssn........",
    "..hshssssnss......",
    "..hshhsssssss.....",
    "...hhssssss.......",
    "....ssssssss......",
    "...rrbrrr.........",
    "..rrrbrrrrrr......",
    ".sssbbbbbbss.......",
    ".ssbbbbbbbbss......",
    "..bbbbbbbbbb.......",
    frame ? "...bbb...bbb......." : "...bbb..bbb........",
    frame ? ".hhhh.....hhh......." : "..hhh....hhh.......",
    frame ? "hhhh..............." : ".hhhh....hhhh......",
  ];
  ctx.clearRect(0, 0, hero.width, hero.height);
  ctx.imageSmoothingEnabled = false;
  rows.forEach((row, y) => [...row].forEach((cell, x) => {
    if (colors[cell]) { ctx.fillStyle = colors[cell]; ctx.fillRect(x * p + 17, y * p + 22, p, p); }
  }));
}

function playBump() {
  audioContext ||= new AudioContext();
  const now = audioContext.currentTime;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(190, now);
  osc.frequency.exponentialRampToValueAtTime(82, now + 0.075);
  gain.gain.setValueAtTime(0.045, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
  osc.connect(gain).connect(audioContext.destination);
  osc.start(now);
  osc.stop(now + 0.09);
}

function playCoin() {
  audioContext ||= new AudioContext();
  const now = audioContext.currentTime;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(660, now);
  osc.frequency.setValueAtTime(990, now + 0.055);
  gain.gain.setValueAtTime(0.025, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
  osc.connect(gain).connect(audioContext.destination);
  osc.start(now);
  osc.stop(now + 0.14);
}

function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  clockTime.innerHTML = `${hours}:${minutes}<span>:${seconds}</span>`;
  clockDate.textContent = new Intl.DateTimeFormat("zh-CN", {
    month: "long", day: "numeric", weekday: "long"
  }).format(now);
}

function beat() {
  hero.classList.remove("jump");
  spark.classList.remove("show");
  void hero.offsetWidth;
  hero.classList.add("jump");
  setTimeout(() => {
    count += 1;
    beatCount.textContent = String(count).padStart(3, "0");
    const now = Date.now();
    const currentBrick = bricks.reduce((nearest, candidate) =>
      Math.abs(candidate.targetTime - now) < Math.abs(nearest.targetTime - now) ? candidate : nearest
    );
    if (currentBrick) {
      currentBrick.element.classList.add("hit", "used");
      const coin = document.createElement("span");
      coin.className = "coin";
      coin.style.left = `${heroPositionAt(now, brickTrack.clientWidth) - 8}px`;
      scene.appendChild(coin);
      coin.addEventListener("animationend", () => coin.remove(), { once: true });
    }
    spark.classList.add("show");
    setTimeout(() => spark.classList.remove("show"), 360);
    playBump();
    setTimeout(playCoin, 75);
  }, 180);
}

hero.addEventListener("animationend", (event) => {
  if (event.animationName === "hero-jump") {
    hero.classList.remove("jump");
    runFrame = 1 - runFrame;
    drawHero(runFrame);
  }
});

function scheduleAlignedBeat() {
  clearTimeout(timer);
  const now = Date.now();
  const nextWholeSecond = Math.ceil((now + 20) / 5000) * 5000;
  const jumpLeadTime = 180;
  timer = setTimeout(() => {
    beat();
    timer = setTimeout(scheduleAlignedBeat, 250);
  }, Math.max(0, nextWholeSecond - now - jumpLeadTime));
}

document.querySelector("#minimizeButton").addEventListener("click", () => window.desktop?.minimize());
document.querySelector("#closeButton").addEventListener("click", () => window.desktop?.close());
const pinButton = document.querySelector("#pinButton");
pinButton.addEventListener("click", () => {
  const pinned = !pinButton.classList.contains("active");
  pinButton.classList.toggle("active", pinned);
  pinButton.setAttribute("aria-label", pinned ? "取消置顶" : "保持置顶");
  window.desktop?.setPinned(pinned);
});

drawHero();
nextBrickTime = Math.ceil(Date.now() / 5000) * 5000;
animateWorld();
setInterval(() => {
  if (!hero.classList.contains("jump")) {
    runFrame = 1 - runFrame;
    drawHero(runFrame);
  }
}, 115);
updateClock();
setInterval(updateClock, 50);
scheduleAlignedBeat();
