const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

document.body.classList.add("is-loading");

const loader = $("[data-loader]");
const loaderCount = $("[data-loader-count]");
let loadValue = 0;
const loadTimer = window.setInterval(() => {
  loadValue += Math.ceil(Math.random() * 11);
  loadValue = Math.min(loadValue, 100);
  loaderCount.textContent = String(loadValue).padStart(3, "0");
  if (loadValue === 100) {
    window.clearInterval(loadTimer);
    window.setTimeout(() => {
      loader.classList.add("is-done");
      document.body.classList.remove("is-loading");
    }, 300);
  }
}, reducedMotion ? 5 : 45);

const nav = $("[data-nav]");
window.addEventListener("scroll", () => nav.classList.toggle("is-scrolled", window.scrollY > 40), { passive: true });

const menuButton = $("[data-menu]");
menuButton.addEventListener("click", () => {
  const open = document.body.classList.toggle("menu-open");
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.textContent = open ? "CLOSE" : "MENU";
});
$$(".nav__links a").forEach((link) => link.addEventListener("click", () => {
  document.body.classList.remove("menu-open");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.textContent = "MENU";
}));

const time = $("[data-space-time]");
const updateTime = () => {
  time.textContent = `${new Date().toISOString().slice(11, 19)} UTC`;
};
updateTime();
window.setInterval(updateTime, 1000);

const reveals = $$(".reveal");
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.13 });
reveals.forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index % 3, 2) * 80}ms`;
  revealObserver.observe(element);
});

const cursor = $("[data-cursor]");
if (cursor && matchMedia("(pointer:fine)").matches) {
  let x = innerWidth / 2;
  let y = innerHeight / 2;
  let cx = x;
  let cy = y;
  window.addEventListener("pointermove", (event) => {
    x = event.clientX;
    y = event.clientY;
  });
  const moveCursor = () => {
    cx += (x - cx) * 0.2;
    cy += (y - cy) * 0.2;
    cursor.style.transform = `translate3d(${cx}px,${cy}px,0)`;
    requestAnimationFrame(moveCursor);
  };
  moveCursor();
  $$("a, button, input, select, textarea, .mission-card").forEach((element) => {
    element.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
    element.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
  });
}

const blackHole = $("[data-black-hole]");
if (!reducedMotion && blackHole && matchMedia("(pointer:fine)").matches) {
  window.addEventListener("pointermove", (event) => {
    const rx = (event.clientY / innerHeight - 0.5) * -7;
    const ry = (event.clientX / innerWidth - 0.5) * 7;
    blackHole.style.transform = `translate3d(${ry}px,${rx}px,0)`;
  });
}

const cosmos = $("[data-cosmos]");
const cosmosContext = cosmos.getContext("2d", { alpha: true });
let stars = [];
let meteors = [];
let impulses = [];
let cosmosWidth = 0;
let cosmosHeight = 0;
let pointerX = 0;
let pointerY = 0;

const resizeCosmos = () => {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  cosmosWidth = innerWidth;
  cosmosHeight = innerHeight;
  cosmos.width = cosmosWidth * dpr;
  cosmos.height = cosmosHeight * dpr;
  cosmos.style.width = `${cosmosWidth}px`;
  cosmos.style.height = `${cosmosHeight}px`;
  cosmosContext.setTransform(dpr, 0, 0, dpr, 0, 0);
  const total = Math.min(260, Math.floor((cosmosWidth * cosmosHeight) / 6200));
  stars = Array.from({ length: total }, () => ({
    x: Math.random() * cosmosWidth,
    y: Math.random() * cosmosHeight,
    z: Math.random(),
    size: Math.random() * 1.25 + 0.2,
    speed: Math.random() * 0.08 + 0.015,
    phase: Math.random() * Math.PI * 2
  }));
  meteors = [];
};

window.addEventListener("resize", resizeCosmos);
window.addEventListener("pointermove", (event) => {
  pointerX = (event.clientX / innerWidth - 0.5) * 12;
  pointerY = (event.clientY / innerHeight - 0.5) * 12;
});
resizeCosmos();

const drawCosmos = (timestamp = 0) => {
  cosmosContext.clearRect(0, 0, cosmosWidth, cosmosHeight);
  const heroProgress = Math.min(scrollY / Math.max(innerHeight, 1), 1);
  stars.forEach((star) => {
    if (!reducedMotion) {
      star.y += star.speed * (1 + heroProgress * 4);
      if (star.y > cosmosHeight + 5) star.y = -5;
    }
    const alpha = 0.18 + star.z * 0.65 + Math.sin(timestamp * 0.001 + star.phase) * 0.1;
    cosmosContext.beginPath();
    cosmosContext.fillStyle = `rgba(224,228,255,${Math.max(0.08, alpha)})`;
    cosmosContext.arc(star.x + pointerX * star.z, star.y + pointerY * star.z, star.size * star.z + 0.15, 0, Math.PI * 2);
    cosmosContext.fill();
  });

  if (!reducedMotion && Math.random() < 0.008 && meteors.length < 3) {
    meteors.push({
      x: Math.random() * cosmosWidth * 0.8,
      y: -30,
      length: 80 + Math.random() * 130,
      speed: 8 + Math.random() * 8,
      life: 1
    });
  }
  meteors.forEach((meteor) => {
    meteor.x += meteor.speed * 0.75;
    meteor.y += meteor.speed;
    meteor.life -= 0.012;
    const gradient = cosmosContext.createLinearGradient(
      meteor.x - meteor.length * 0.6,
      meteor.y - meteor.length,
      meteor.x,
      meteor.y
    );
    gradient.addColorStop(0, "rgba(115,232,255,0)");
    gradient.addColorStop(0.75, `rgba(141,107,255,${meteor.life * 0.45})`);
    gradient.addColorStop(1, `rgba(255,255,255,${meteor.life})`);
    cosmosContext.beginPath();
    cosmosContext.moveTo(meteor.x - meteor.length * 0.6, meteor.y - meteor.length);
    cosmosContext.lineTo(meteor.x, meteor.y);
    cosmosContext.strokeStyle = gradient;
    cosmosContext.lineWidth = 1.4;
    cosmosContext.stroke();
  });
  meteors = meteors.filter((meteor) => meteor.life > 0 && meteor.y < cosmosHeight + 100);

  impulses.forEach((impulse) => {
    impulse.radius += 7;
    impulse.alpha -= 0.018;
    cosmosContext.beginPath();
    cosmosContext.arc(impulse.x, impulse.y, impulse.radius, 0, Math.PI * 2);
    cosmosContext.strokeStyle = `rgba(115,232,255,${Math.max(0, impulse.alpha)})`;
    cosmosContext.lineWidth = 1;
    cosmosContext.stroke();
    for (let index = 0; index < 8; index += 1) {
      const angle = (Math.PI * 2 * index) / 8 + impulse.radius * 0.01;
      const x = impulse.x + Math.cos(angle) * impulse.radius * 0.72;
      const y = impulse.y + Math.sin(angle) * impulse.radius * 0.72;
      cosmosContext.fillStyle = `rgba(215,255,100,${Math.max(0, impulse.alpha)})`;
      cosmosContext.fillRect(x, y, 2, 2);
    }
  });
  impulses = impulses.filter((impulse) => impulse.alpha > 0);
  requestAnimationFrame(drawCosmos);
};
drawCosmos();

const orbitPulse = $("[data-orbit-pulse]");
orbitPulse.addEventListener("click", () => {
  const rect = orbitPulse.getBoundingClientRect();
  impulses.push({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, radius: 10, alpha: 1 });
  meteors.push(
    { x: cosmosWidth * 0.18, y: -40, length: 170, speed: 13, life: 1 },
    { x: cosmosWidth * 0.52, y: -110, length: 120, speed: 10, life: 1 }
  );
  orbitPulse.classList.remove("is-pulsing");
  void orbitPulse.offsetWidth;
  orbitPulse.classList.add("is-pulsing");
  const wave = document.createElement("div");
  wave.className = "impulse-wave";
  wave.style.setProperty("--pulse-x", `${rect.left + rect.width / 2}px`);
  wave.style.setProperty("--pulse-y", `${rect.top + rect.height / 2}px`);
  wave.innerHTML = "<i></i>";
  document.body.style.setProperty("--pulse-x", `${rect.left + rect.width / 2}px`);
  document.body.style.setProperty("--pulse-y", `${rect.top + rect.height / 2}px`);
  document.body.classList.remove("is-impulsing");
  void document.body.offsetWidth;
  document.body.classList.add("is-impulsing");
  document.body.append(wave);
  const label = $("span", orbitPulse);
  const originalLabel = label.innerHTML;
  label.innerHTML = "IMPULS<br>WYSŁANY";
  window.setTimeout(() => { label.innerHTML = originalLabel; document.body.classList.remove("is-impulsing"); }, 1100);
  window.setTimeout(() => wave.remove(), 1400);
  playTone(520, 0.22);
});

const waveCanvas = $("[data-wave-canvas]");
const waveContext = waveCanvas.getContext("2d");
let signalSeed = 1.420405;
const signalValue = $("[data-signal-value]");

const drawWave = (timestamp = 0) => {
  const rect = waveCanvas.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio || 1, 2);
  if (waveCanvas.width !== rect.width * dpr || waveCanvas.height !== rect.height * dpr) {
    waveCanvas.width = rect.width * dpr;
    waveCanvas.height = rect.height * dpr;
    waveContext.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  waveContext.clearRect(0, 0, rect.width, rect.height);
  const center = rect.height / 2;
  const timeOffset = reducedMotion ? 0 : timestamp * 0.0015;
  waveContext.beginPath();
  for (let x = 0; x <= rect.width; x += 2) {
    const normalized = x / rect.width;
    const envelope = 0.25 + Math.pow(Math.sin(normalized * Math.PI), 3) * 0.75;
    const y = center
      + Math.sin(x * 0.035 + timeOffset) * 25 * envelope
      + Math.sin(x * 0.11 - timeOffset * 1.7) * 8
      + Math.sin(x * 0.006 + signalSeed) * 46 * envelope;
    if (x === 0) waveContext.moveTo(x, y);
    else waveContext.lineTo(x, y);
  }
  const gradient = waveContext.createLinearGradient(0, 0, rect.width, 0);
  gradient.addColorStop(0, "rgba(115,232,255,.15)");
  gradient.addColorStop(0.48, "#73e8ff");
  gradient.addColorStop(0.7, "#8d6bff");
  gradient.addColorStop(1, "rgba(141,107,255,.1)");
  waveContext.strokeStyle = gradient;
  waveContext.lineWidth = 1.4;
  waveContext.shadowColor = "#73e8ff";
  waveContext.shadowBlur = 10;
  waveContext.stroke();
  requestAnimationFrame(drawWave);
};
drawWave();

$("[data-retune]").addEventListener("click", () => {
  signalSeed = Math.random() * 10;
  const next = 1.419 + Math.random() * 0.003;
  signalValue.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 420 });
  signalValue.textContent = next.toFixed(6);
  playTone(280, 0.08);
});

const cards = $$(".mission-card");
const deck = $("[data-deck]");
const count = $("[data-deck-count]");
const progress = $("[data-deck-progress]");
let activeCard = 0;

const updateDeck = () => {
  const cardWidth = cards[0].getBoundingClientRect().width + 18;
  deck.style.transform = `translateX(${-activeCard * cardWidth}px)`;
  cards.forEach((card, index) => card.classList.toggle("is-active", index === activeCard));
  count.textContent = `${String(activeCard + 1).padStart(2, "0")} / ${String(cards.length).padStart(2, "0")}`;
  progress.style.transform = `translateX(${activeCard * 100}%)`;
};
$("[data-deck-prev]").addEventListener("click", () => {
  activeCard = (activeCard - 1 + cards.length) % cards.length;
  updateDeck();
  playTone(180, 0.05);
});
$("[data-deck-next]").addEventListener("click", () => {
  activeCard = (activeCard + 1) % cards.length;
  updateDeck();
  playTone(230, 0.05);
});
cards.forEach((card, index) => card.addEventListener("click", (event) => {
  if (!event.target.closest("button") && index !== activeCard) {
    activeCard = index;
    updateDeck();
  }
}));
window.addEventListener("resize", updateDeck);

const missions = {
  lunar: {
    code: "MISSION / 01",
    label: "LUNAR TERMINATOR",
    title: "Spacer po granicy światła.",
    description: "Prowadzona obserwacja powierzchni Księżyca przy niskim kącie padania światła. Zobaczysz cienie kraterów, uskoki i góry w rozdzielczości niedostępnej dla standardowych teleskopów turystycznych.",
    duration: "4 GODZINY 30 MINUT",
    level: "PIERWSZY KONTAKT",
    output: "12 ZDJĘĆ + MAPA KRATERÓW"
  },
  nebula: {
    code: "MISSION / 02",
    label: "NEBULA LAB",
    title: "Kolor, którego oko nie widzi.",
    description: "Nocna sesja astrofotograficzna w trzech pasmach emisyjnych. Wspólnie rejestrujemy mgławicę, a następnie składamy jej chemiczną mapę w laboratorium obrazowania.",
    duration: "6 GODZIN 10 MINUT",
    level: "ODKRYWCA",
    output: "KOMPOZYCJA HSO + SUROWE KLATKI"
  },
  deep: {
    code: "MISSION / 03",
    label: "DEEP FIELD",
    title: "Jedna klatka. Tysiące galaktyk.",
    description: "Najbardziej wymagająca ekspedycja VANTA. Przez całą noc teleskop zbiera światło z małego, pozornie pustego obszaru nieba, ujawniając galaktyki odległe o miliardy lat świetlnych.",
    duration: "OD ZMIERZCHU DO ŚWITU",
    level: "ZAAWANSOWANY",
    output: "DEEP FIELD + KATALOG OBIEKTÓW"
  }
};

const modal = $("[data-modal]");
const openMission = (missionKey) => {
  const mission = missions[missionKey];
  $("[data-modal-code]").textContent = mission.code;
  $("[data-modal-label]").textContent = mission.label;
  $("[data-modal-title]").textContent = mission.title;
  $("[data-modal-description]").textContent = mission.description;
  $("[data-modal-duration]").textContent = mission.duration;
  $("[data-modal-level]").textContent = mission.level;
  $("[data-modal-output]").textContent = mission.output;
  $("[data-modal-book]").dataset.mission = missionKey;
  modal.showModal();
  playTone(320, 0.1);
};
cards.forEach((card) => {
  const open = () => openMission(card.dataset.mission);
  $("button", card).addEventListener("click", open);
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter") open();
  });
});
$("[data-modal-close]").addEventListener("click", () => modal.close());
modal.addEventListener("click", (event) => {
  if (event.target === modal) modal.close();
});
$("[data-modal-book]").addEventListener("click", (event) => {
  const mission = event.currentTarget.dataset.mission;
  modal.close();
  const missionSelect = $('[name="mission"]');
  missionSelect.value = mission;
});

const scopeStage = $("[data-scope-stage]");
const scopeCanvas = $("[data-scope-canvas]");
const azimuth = $("[data-azimuth]");
const altitude = $("[data-altitude]");
let scopeTarget = 24;
let scopeDrag = 0;
let scopeDragging = false;
let scopePointerX = 0;

const startScope3D = () => {
  const gl = scopeCanvas.getContext("webgl", { antialias: true, alpha: true });
  if (!gl) {
    scopeStage.classList.add("is-fallback");
    return;
  }
  const vertexSource = `
    attribute vec3 a_position;
    attribute vec3 a_color;
    uniform float u_yaw;
    uniform float u_aspect;
    varying vec3 v_color;
    varying float v_light;
    void main() {
      float cy = cos(u_yaw), sy = sin(u_yaw);
      vec3 p = vec3(a_position.x * cy + a_position.z * sy, a_position.y - .12, -a_position.x * sy + a_position.z * cy);
      float pitch = -.18;
      float cp = cos(pitch), sp = sin(pitch);
      p = vec3(p.x, p.y * cp - p.z * sp, p.y * sp + p.z * cp);
      p.z -= 6.4;
      float f = 3.15;
      float near = .1, far = 30.0;
      gl_Position = vec4(p.x * f / u_aspect, p.y * f, ((far + near) / (near - far)) * p.z + (2.0 * far * near / (near - far)), -p.z);
      v_color = a_color;
      v_light = .72 + .28 * clamp(a_position.y / 2.0, 0.0, 1.0);
    }`;
  const fragmentSource = `
    precision mediump float;
    varying vec3 v_color;
    varying float v_light;
    void main() { gl_FragColor = vec4(v_color * v_light, 1.0); }`;
  const shader = (type, source) => {
    const item = gl.createShader(type);
    gl.shaderSource(item, source);
    gl.compileShader(item);
    if (!gl.getShaderParameter(item, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(item));
    return item;
  };
  const program = gl.createProgram();
  gl.attachShader(program, shader(gl.VERTEX_SHADER, vertexSource));
  gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragmentSource));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));

  const positions = [];
  const colors = [];
  const indices = [];
  const addVertex = (point, color) => { positions.push(...point); colors.push(...color); return positions.length / 3 - 1; };
  const tri = (a, b, c) => indices.push(a, b, c);
  const quad = (a, b, c, d, color) => {
    const start = positions.length / 3;
    [a,b,c,d].forEach((p) => addVertex(p,color));
    tri(start,start+1,start+2); tri(start,start+2,start+3);
  };
  const box = (x,y,z,w,h,d,color) => {
    const x0=x-w/2,x1=x+w/2,y0=y-h/2,y1=y+h/2,z0=z-d/2,z1=z+d/2;
    quad([x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],color);
    quad([x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],color.map(v=>v*.66));
    quad([x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],color.map(v=>v*.78));
    quad([x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],color.map(v=>Math.min(1,v*1.12)));
    quad([x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],color.map(v=>Math.min(1,v*1.2)));
  };
  const cylinder = (cx, y0, cz, radius, height, segments, color) => {
    const y1=y0+height;
    for(let i=0;i<segments;i++){
      const a=i/segments*Math.PI*2,b=(i+1)/segments*Math.PI*2;
      const p0=[cx+Math.cos(a)*radius,y0,cz+Math.sin(a)*radius];
      const p1=[cx+Math.cos(b)*radius,y0,cz+Math.sin(b)*radius];
      const p2=[p1[0],y1,p1[2]],p3=[p0[0],y1,p0[2]];
      quad(p0,p1,p2,p3,color.map(v=>v*(.78+.22*Math.cos(a))));
      const top=addVertex([cx,y1,cz],color),e1=addVertex(p3,color),e2=addVertex(p2,color); tri(top,e1,e2);
    }
  };
  const base=[.06,.07,.11], metal=[.28,.30,.38], bright=[.42,.44,.52], violet=[.48,.26,1.0], cyan=[.12,.68,.82];
  cylinder(0,-1.35,0,.82,.32,24,base);
  cylinder(0,-1.04,0,.6,.18,24,metal);
  box(0,-.48,0,.45,1.12,.45,metal);
  box(-.53,.16,0,.16,1.05,.22,base); box(.53,.16,0,.16,1.05,.22,base);
  cylinder(0,.72,0,.19,.42,20,violet);

  const rings=8, segments=48;
  const dish=[];
  for(let r=0;r<=rings;r++){
    dish[r]=[];
    const radius=1.38*r/rings;
    const y=.83 + .42*(radius/1.38)*(radius/1.38);
    for(let i=0;i<segments;i++){
      const a=i/segments*Math.PI*2;
      const color=[bright[0]+.12*Math.cos(a),bright[1]+.08*Math.sin(a),bright[2]+.12*Math.sin(a+.8)];
      dish[r][i]=addVertex([Math.cos(a)*radius,y,Math.sin(a)*radius],color);
    }
  }
  for(let r=0;r<rings;r++) for(let i=0;i<segments;i++){
    const n=(i+1)%segments;
    tri(dish[r][i],dish[r+1][i],dish[r+1][n]);
    tri(dish[r][i],dish[r+1][n],dish[r][n]);
  }
  cylinder(0,1.18,0,.07,.72,14,base);
  cylinder(0,1.86,0,.16,.22,18,cyan);
  box(-.62,1.45,0,.055,.86,.055,base); box(.62,1.45,0,.055,.86,.055,base);

  const positionBuffer=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,positionBuffer); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(positions),gl.STATIC_DRAW);
  const colorBuffer=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,colorBuffer); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(colors),gl.STATIC_DRAW);
  const indexBuffer=gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
  const positionLocation=gl.getAttribLocation(program,"a_position");
  const colorLocation=gl.getAttribLocation(program,"a_color");
  const yawLocation=gl.getUniformLocation(program,"u_yaw");
  const aspectLocation=gl.getUniformLocation(program,"u_aspect");

  let currentYaw=0;
  const render = (time=0) => {
    const rect=scopeCanvas.getBoundingClientRect();
    const dpr=Math.min(devicePixelRatio||1,2);
    const width=Math.max(1,Math.round(rect.width*dpr)),height=Math.max(1,Math.round(rect.height*dpr));
    if(scopeCanvas.width!==width||scopeCanvas.height!==height){scopeCanvas.width=width;scopeCanvas.height=height;gl.viewport(0,0,width,height);}
    const auto=time*.00016;
    const wanted=(scopeTarget-45)*Math.PI/180+scopeDrag+auto;
    currentYaw+=(wanted-currentYaw)*.035;
    gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER,positionBuffer); gl.enableVertexAttribArray(positionLocation); gl.vertexAttribPointer(positionLocation,3,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ARRAY_BUFFER,colorBuffer); gl.enableVertexAttribArray(colorLocation); gl.vertexAttribPointer(colorLocation,3,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);
    gl.uniform1f(yawLocation,currentYaw); gl.uniform1f(aspectLocation,width/height);
    gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
    requestAnimationFrame(render);
  };
  requestAnimationFrame(render);
};

scopeStage.addEventListener("pointerdown",(event)=>{scopeDragging=true;scopePointerX=event.clientX;scopeStage.setPointerCapture?.(event.pointerId);});
scopeStage.addEventListener("pointermove",(event)=>{if(!scopeDragging)return;scopeDrag+=(event.clientX-scopePointerX)*.012;scopePointerX=event.clientX;});
scopeStage.addEventListener("pointerup",()=>{scopeDragging=false;});
scopeStage.addEventListener("pointercancel",()=>{scopeDragging=false;});
try { startScope3D(); } catch (error) { scopeStage.classList.add("is-fallback"); console.warn("WebGL model unavailable",error); }

const instrumentArticles = $$(".instrument__story article");
const instrumentObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const angle = Number(entry.target.dataset.angle);
    scopeTarget = angle;
    azimuth.textContent = `${angle.toFixed(1).padStart(5, "0")}°`;
    altitude.textContent = `${(28 + angle / 4).toFixed(1)}°`;
  });
}, { threshold: 0.6 });
instrumentArticles.forEach((article) => instrumentObserver.observe(article));
let audioContext;
let soundOn = false;
const soundButton = $("[data-sound]");
const playTone = (frequency = 220, duration = 0.06) => {
  if (!soundOn) return;
  audioContext ||= new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.02, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
};
soundButton.addEventListener("click", () => {
  soundOn = !soundOn;
  soundButton.classList.toggle("is-on", soundOn);
  soundButton.setAttribute("aria-pressed", String(soundOn));
  $("b", soundButton).textContent = soundOn ? "SOUND ON" : "SOUND OFF";
  if (soundOn) {
    audioContext ||= new AudioContext();
    playTone(160, 0.18);
  }
});

const form = $("[data-booking-form]");
const formStatus = $("[data-form-status]");
const dateInput = $('[name="date"]', form);
const tomorrow = new Date(Date.now() + 86400000);
dateInput.min = tomorrow.toISOString().slice(0, 10);

const showError = (name, message) => {
  const output = $(`[data-error="${name}"]`, form);
  if (output) output.textContent = message;
};
const clearErrors = () => $$("[data-error]", form).forEach((node) => { node.textContent = ""; });

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearErrors();
  formStatus.className = "booking__status";
  formStatus.textContent = "";
  const data = Object.fromEntries(new FormData(form));
  data.consent = Boolean(new FormData(form).get("consent"));
  const errors = {};
  if (!data.name || data.name.trim().length < 2) errors.name = "Podaj co najmniej 2 znaki.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email || "")) errors.email = "Podaj prawidłowy adres email.";
  if (!data.guests) errors.guests = "Wybierz liczbę osób.";
  if (!data.date) errors.date = "Wybierz datę.";
  if (!data.mission) errors.mission = "Wybierz ekspedycję.";
  if (!data.consent) {
    formStatus.classList.add("is-error");
    formStatus.textContent = "Zaznacz zgodę na kontakt.";
  }
  Object.entries(errors).forEach(([name, message]) => showError(name, message));
  if (Object.keys(errors).length || !data.consent) return;

  const submit = $(".booking__submit", form);
  submit.disabled = true;
  formStatus.textContent = "TRANSMISJA DANYCH...";
  try {
    const response = await fetch("/api/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok) {
      if (result.fields) Object.entries(result.fields).forEach(([name, message]) => showError(name, message));
      throw new Error(result.error || "Nie udało się wysłać formularza.");
    }
    form.reset();
    formStatus.classList.add("is-success");
    formStatus.textContent = `SYGNAŁ ODEBRANY / ID: ${result.id}. Odpowiemy po sprawdzeniu warunków.`;
    playTone(440, 0.28);
  } catch (error) {
    formStatus.classList.add("is-error");
    formStatus.textContent = error.message;
  } finally {
    submit.disabled = false;
  }
});
