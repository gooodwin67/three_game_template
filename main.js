import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';

import { yanNeed } from "./functions";

import { EventEmitter } from './events.js';

import { ParamsClass } from '/params';

import { PhysicsClass } from "./physics";
import { AudioClass } from "./audio";
import { ControlClass } from './control';
import { DataClass } from './data';
import { AssetsManager } from './assets-manager';
import { ScreenManager } from './screen-manager';
import { initI18n } from './i18n.js';
import { GameClass } from './game';


console.clear();




let clock = new THREE.Clock();
let loaderLine = document.querySelector('.loader_line');

const gameContext = {};




const scene = new THREE.Scene();
scene.background = new THREE.Color(0xc9e1f4);
// scene.fog = new THREE.Fog(scene.background, 1, 50);
const camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.x = 0;
camera.position.y = 0;
camera.position.z = 5;

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
let controls = new OrbitControls(camera, renderer.domElement);





async function startMatch() {
  gameContext.ui.hideAll()
  gameContext.gameClass.loadMesh();
}


/* =========================================
   INIT CLASSES
========================================= */
async function initClases() {
  gameContext.scene = scene;
  gameContext.camera = camera;
  gameContext.renderer = renderer;

  gameContext.events = new EventEmitter();

  gameContext.ui = new ScreenManager(gameContext);
  gameContext.paramsClass = new ParamsClass(gameContext);
  gameContext.assetsManager = new AssetsManager(gameContext);
  gameContext.physicsClass = new PhysicsClass(gameContext);
  gameContext.audioClass = new AudioClass(gameContext);
  gameContext.dataClass = new DataClass(gameContext);
  gameContext.controlClass = new ControlClass(gameContext);
  gameContext.gameClass = new GameClass(gameContext);
}

/* =========================================
   INIT FUNCTIONS
========================================= */
async function initFunctions() {
  await yanNeed();
  initI18n('ru' /*lang*/); // const lang = ysdk.environment.i18n.lang.toLowerCase();

  await gameContext.assetsManager.loadTextures();
  // await assetsManager.loadModels();
  await gameContext.physicsClass.initRapier();
  await gameContext.audioClass.loadAudio();
  await gameContext.controlClass.addKeyListeners();
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


  loaderLine.setAttribute("style", "width:30%");

  await initClases();
  await initFunctions();

  loaderLine.setAttribute("style", "width:100%");

  gameContext.paramsClass.gameInit = true;
  gameContext.ui.show('main_screen')
  // ysdk.features.LoadingAPI.ready();
  // ysdk.features.GameplayAPI.stop();  
  startMatch();


}


// function resetMatch() {

//   if (gameContext.controlClass != undefined) gameContext.controlClass.removedKeyListeners();

//   gameContext.worldClass = null;
//   gameContext.physicsClass = null;
//   gameContext.levelClass = null;

//   gameContext.controlClass = null;
//   gameContext.paramsClass = null;
//   gameContext.scoreClass = null;
// }






function animate(delta) {



  switch (gameContext.paramsClass.gameState) {
    case 1:
      //
      break;
    case 2:
      //
      break;
    case 2:
      //
      break;
  }



  stats.update();
  for (let i = 0, n = gameContext.physicsClass.dynamicBodies.length; i < n; i++) {
    gameContext.physicsClass.dynamicBodies[i][0].position.copy(gameContext.physicsClass.dynamicBodies[i][1].translation())
    gameContext.physicsClass.dynamicBodies[i][0].quaternion.copy(gameContext.physicsClass.dynamicBodies[i][1].rotation())
  }
  gameContext.physicsClass.updateInstancedTransforms();
  gameContext.physicsClass.world.step(gameContext.physicsClass.eventQueue);

  renderer.render(scene, camera);


}



let accumulator = 0;
const dt = 1 / 60;
const maxFrame = 0.1;

renderer.setAnimationLoop(() => {

  let frameDelta = clock.getDelta();
  if (frameDelta > maxFrame) frameDelta = maxFrame;

  accumulator += frameDelta;

  if (gameContext.paramsClass != null && gameContext.paramsClass.gameInit) {
    while (accumulator >= dt) {
      animate(dt);
      accumulator -= dt;
    }
  }

});





document.querySelector('body').addEventListener('click', (e) => {

  const btn = e.target.closest('.btn');
  if (!btn) return;

  const action = btn.dataset.action;

  switch (action) {

    case 'newGame':
      gameContext.ui.show('free_game_screen');
      break;
    case 'settings':
      gameContext.ui.show('settings_screen');
      break;
    case 'back':
      gameContext.ui.show('main_screen');
      break;
    case 'start_game_btn':
      gameContext.ui.hideAll();
      startMatch();
      break;
    case 'pause':
      // pauseGame();
      break;
  }
});








// document.addEventListener("visibilitychange", function () {
//   // Проверяем, инициализирован ли вообще аудио
//   if (!gameContext.audioClass) return;

//   if (document.visibilityState === 'visible') {
//     if (!gameContext.gameClass.pause && !gameContext.gameClass.showGamePopup) {
//       gameContext.gameClass.gameStarting = true;
//       gameContext.audioClass.togglePauseAll(!gameContext.gameClass.gameStarting);
//     }
//     gameContext.gameClass.visible = true;
//   } else {
//     if (!gameContext.gameClass.pause && !gameContext.gameClass.showGamePopup) {
//       gameContext.gameClass.gameStarting = false;
//       gameContext.audioClass.togglePauseAll(!gameContext.gameClass.gameStarting);
//     } else if (!gameContext.gameClass.pause) {
//       gameContext.audioClass.togglePauseAll(!gameContext.gameClass.gameStarting);
//     }
//     gameContext.gameClass.visible = false;
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