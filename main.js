import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';

import { makeCollisionMaskFromArrays, createSplashSystem, createRippleRing, yanNeed } from "./functions";

import { ParamsClass } from '/params';

import { PhysicsClass } from "./physics";
import { AudioClass } from "./audio";
import { ControlClass } from './control';
import { MenuClass } from './menu';
import { DataClass } from './data';
import { AssetsManager } from './assets-manager';
import { initI18n } from './i18n.js';

console.clear();



let world;
let clock = new THREE.Clock();
let loaderLine = document.querySelector('.loader_line');

let paramsClass = null;
let physicsClass = null;
let assetsManager = null;
let audioClass = null;




const scene = new THREE.Scene();
scene.background = new THREE.Color(0xc9e1f4);
// scene.fog = new THREE.Fog(scene.background, 1, 50);

const camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.y = 2;

// ★ фиксируем HFOV не от текущего окна, а от референсного aspect
const DESIGN_ASPECT = 16 / 9; // выбери свою базу (можно 16/9)
const baseVFOV = THREE.MathUtils.degToRad(25);
const FIXED_HFOV = 2 * Math.atan(Math.tan(baseVFOV / 2) * DESIGN_ASPECT);



function setVhVar() {
  const h = (window.visualViewport?.height || window.innerHeight) * 0.01;
  document.documentElement.style.setProperty('--vh', `${h}px`);
}
setVhVar();
window.addEventListener('resize', setVhVar);
window.addEventListener('orientationchange', setVhVar);
window.visualViewport?.addEventListener('resize', setVhVar);

let stats = new Stats();
document.body.appendChild(stats.dom);
stats.dom.style.top = "0";
stats.dom.style.left = "0";

const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

function onWindowResize() {
  const w = document.body.offsetWidth;
  const h = document.body.offsetHeight;
  const aspect = w / h;

  // пересчитываем вертикальный FOV при фиксированном горизонтальном
  let vFOV = 2 * Math.atan(Math.tan(FIXED_HFOV / 2) / aspect);

  // необязательные «ограждения», чтобы на экстремальных экранах не уходить в микроскопические/гигантские значения
  const vMin = THREE.MathUtils.degToRad(4);
  const vMax = THREE.MathUtils.degToRad(90);
  vFOV = THREE.MathUtils.clamp(vFOV, vMin, vMax);

  camera.fov = THREE.MathUtils.radToDeg(vFOV);
  camera.aspect = aspect;
  camera.updateProjectionMatrix();

  renderer.setSize(w, h);
}
window.addEventListener('resize', onWindowResize);
onWindowResize();



// let ysdk;
// let controls = new OrbitControls(camera, renderer.domElement);





/* =========================================
   INIT CLASSES
========================================= */
async function initClases() {
  paramsClass = new ParamsClass();
  assetsManager = new AssetsManager();
  physicsClass = new PhysicsClass();
  audioClass = new AudioClass();
}

/* =========================================
   INIT FUNCTIONS
========================================= */
async function initFunctions() {
  await yanNeed();
  initI18n('ru' /*lang*/); // const lang = ysdk.environment.i18n.lang.toLowerCase();

  await assetsManager.loadTextures();
  // await assetsManager.loadModels();
  await physicsClass.initRapier();
  await audioClass.loadAudio();
}





/* =========================================
   START
========================================= */
export async function startGame(ysdkInstance) {
  // ysdk = ysdkInstance;          // сохраняем локально в модуле
  // window.ysdk = ysdkInstance;   // если где-то ещё рассчитываешь на глобал
  try {
    await BeforeStart();
  } catch (error) {
    toggleLoader(false);
    if (window.showInitError) {
      window.showInitError(error);
    } else {
      console.error('Init error', error);
    }
  }
}

/* =========================================
   1. BEFORE START
========================================= */
async function BeforeStart() {
  toggleLoader(true);
  loaderLine.setAttribute("style", "width:30%");

  await initClases();
  await initFunctions();

  loaderLine.setAttribute("style", "width:100%");
  toggleLoader(false);
  paramsClass.gameInit = true;
  // ysdk.features.LoadingAPI.ready();
  // ysdk.features.GameplayAPI.stop();
}


// function resetMatch() {

//   if (controlClass != undefined) controlClass.removedKeyListeners();

//   worldClass = null;
//   physicsClass = null;
//   levelClass = null;

//   controlClass = null;
//   paramsClass = null;
//   scoreClass = null;
// }







function animate(delta) {


  stats.update();
  for (let i = 0, n = physicsClass.dynamicBodies.length; i < n; i++) {
    physicsClass.dynamicBodies[i][0].position.copy(physicsClass.dynamicBodies[i][1].translation())
    physicsClass.dynamicBodies[i][0].quaternion.copy(physicsClass.dynamicBodies[i][1].rotation())
  }
  physicsClass.updateInstancedTransforms();
  physicsClass.world.step(physicsClass.eventQueue);

  renderer.render(scene, camera);


}



let accumulator = 0;
const dt = 1 / 60;
const maxFrame = 0.1;

renderer.setAnimationLoop(() => {

  let frameDelta = clock.getDelta();
  if (frameDelta > maxFrame) frameDelta = maxFrame;

  accumulator += frameDelta;

  if (paramsClass != null && paramsClass.gameInit) {
    while (accumulator >= dt) {
      animate(dt); // твоя игровая логика и рендер
      accumulator -= dt;
    }
  }

});







function toggleLoader(need) {
  const loader = document.querySelector('.loader_screen');
  if (!loader) return;

  if (need) {
    loader.classList.remove('hidden_screen');
  } else {
    // Плавное скрытие
    loader.classList.add('hidden_screen');
  }
}




// document.addEventListener("visibilitychange", function () {
//   // Проверяем, инициализирован ли вообще аудио
//   if (!audioClass) return;

//   if (document.visibilityState === 'visible') {
//     if (!gameClass.pause && !gameClass.showGamePopup) {
//       gameClass.gameStarting = true;
//       audioClass.togglePauseAll(!gameClass.gameStarting);
//     }
//     gameClass.visible = true;
//   } else {
//     if (!gameClass.pause && !gameClass.showGamePopup) {
//       gameClass.gameStarting = false;
//       audioClass.togglePauseAll(!gameClass.gameStarting);
//     } else if (!gameClass.pause) {
//       audioClass.togglePauseAll(!gameClass.gameStarting);
//     }
//     gameClass.visible = false;
//   }
// });










function initCustomScroll() {
  const screens = [
    '.free_game_screen',
    '.levels_game_screen',
    '.levels_game_screen_contest',
    '.main_screen'
  ];

  let activeEl = null;            // текущий видимый экран (контейнер со скроллом)
  let progress = null;           // его же .scroll-progress
  let bar = null;           // и .scroll-progress__bar
  let dragging = false;
  let startY = 0, startScroll = 0;

  const getActiveScreen = () => {
    for (const sel of screens) {
      const el = document.querySelector(sel);
      if (el && !el.classList.contains('hidden_screen')) return el;
    }
    return null;
  };

  const bindToActive = () => {
    const nextEl = getActiveScreen();
    if (nextEl === activeEl) return;

    // отписываемся от старого
    if (activeEl) activeEl.removeEventListener('scroll', update, { passive: true });
    if (bar) {
      bar.removeEventListener('mousedown', onDown);
      bar.removeEventListener('touchstart', onDown);
    }

    // берём новый экран и его бар
    activeEl = nextEl;
    progress = activeEl ? activeEl.querySelector('.scroll-progress') : null;
    bar = progress ? progress.querySelector('.scroll-progress__bar') : null;

    if (activeEl) activeEl.addEventListener('scroll', update, { passive: true });
    if (bar) {
      bar.addEventListener('mousedown', onDown);
      bar.addEventListener('touchstart', onDown);
    }
    update(); // первичный пересчёт
  };

  const update = () => {
    if (!activeEl || !progress || !bar) return;

    const h = activeEl.clientHeight;
    const sh = activeEl.scrollHeight;
    const st = activeEl.scrollTop;

    // если скролла нет — прячем бар
    if (sh <= h + 1) {
      progress.classList.remove('visible');
      return;
    }
    progress.classList.add('visible');

    const trackH = progress.getBoundingClientRect().height;
    const minThumb = 24;
    const thumbH = Math.max((h / sh) * trackH, minThumb);
    const maxScroll = sh - h;
    const maxTop = trackH - thumbH;
    const topPx = maxScroll > 0 ? (st / maxScroll) * maxTop : 0;

    bar.style.height = `${thumbH}px`;
    bar.style.top = `${topPx}px`;
  };

  // drag для активного бара
  const onDown = (e) => {
    if (!activeEl || !bar) return;
    dragging = true;
    startY = e.touches ? e.touches[0].clientY : e.clientY;
    startScroll = activeEl.scrollTop;
    document.body.style.userSelect = 'none';
    e.preventDefault();
  };

  const onMove = (e) => {
    if (!dragging || !activeEl || !bar || !progress) return;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    const dy = y - startY;

    const trackH = progress.getBoundingClientRect().height;
    const h = activeEl.clientHeight;
    const sh = activeEl.scrollHeight;

    const denom = Math.max(1, (trackH - bar.offsetHeight));
    const ratio = (sh - h) / denom;
    activeEl.scrollTop = startScroll + dy * ratio;
  };

  const onUp = () => {
    dragging = false;
    document.body.style.userSelect = '';
  };

  // глобальные слушатели (одни на всё приложение)
  window.addEventListener('resize', () => { bindToActive(); update(); });
  window.addEventListener('mousemove', onMove, { passive: false });
  window.addEventListener('touchmove', onMove, { passive: false });
  window.addEventListener('mouseup', onUp);
  window.addEventListener('touchend', onUp);

  // следим за переключением экранов (класс hidden_screen меняется)
  const mo = new MutationObserver(() => { bindToActive(); });
  mo.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class'] });

  // старт
  bindToActive();
}
initCustomScroll();


const loaderScreenElement = document.querySelector('.loader_screen');

if (loaderScreenElement) {
  loaderScreenElement.addEventListener(
    'touchmove',
    function (event) {
      // На экране загрузки вообще ничего скроллить не нужно,
      // поэтому просто полностью глушим жест.
      event.preventDefault();
    },
    { passive: false }
  );
}