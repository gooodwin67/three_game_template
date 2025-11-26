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
import { WorldClass } from './world';
import { PlayerClass } from './player';
import { InstancesClass } from './instances';


console.clear();

let clock = new THREE.Clock();


const gameContext = {};




const scene = new THREE.Scene();
scene.background = new THREE.Color(0xc9e1f4);
//scene.fog = new THREE.Fog(scene.background, 1, 35);
const camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.x = 0;
camera.position.y = 4;
camera.position.z = 12;

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
  gameContext.playerClass.loadPlayer();
  gameContext.instancesClass.init();
  gameContext.worldClass.loadLight(true, true);
  gameContext.paramsClass.startGame();
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
  gameContext.worldClass = new WorldClass(gameContext);
  gameContext.playerClass = new PlayerClass(gameContext);
  gameContext.instancesClass = new InstancesClass(gameContext);
}

/* =========================================
   INIT FUNCTIONS
========================================= */
async function initFunctions() {
  await yanNeed();
  gameContext.paramsClass.initCustomScroll();
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

  const loaderLine = document.querySelector('.loader_line');
  loaderLine.setAttribute("style", "width:30%");

  await initClases();
  await initFunctions();

  loaderLine.setAttribute("style", "width:100%");

  gameContext.paramsClass.gameInit = true;
  gameContext.ui.show('main_screen')
  // ysdk.features.LoadingAPI.ready();
  // ysdk.features.GameplayAPI.stop();  
  gameContext.events.on('start_match', () => startMatch());


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



function update(delta) {
  // Тут ТОЛЬКО логика и физика
  switch (gameContext.paramsClass.currentGameState) {
    case gameContext.paramsClass.gameState.play:
      gameContext.playerClass.update(delta);
      gameContext.physicsClass.update(delta);
      break;
  }
}

function render() {
  // Тут ТОЛЬКО отрисовка
  stats.update();
  renderer.render(scene, camera);
}

let accumulator = 0;
const dt = 1 / 60;
const maxFrame = 0.1;

renderer.setAnimationLoop(() => {
  let frameDelta = clock.getDelta();
  // Если вкладка была неактивна, не пытаемся просчитать всё пропущенное время
  if (frameDelta > 0.05) frameDelta = 0.05;
  accumulator += frameDelta;
  if (gameContext.paramsClass != null && gameContext.paramsClass.gameInit) {
    // ЗАЩИТА ОТ ЗАВИСАНИЯ
    // Не даем циклу выполниться более 5 раз за кадр, даже если очень надо
    let maxSteps = 5;
    while (accumulator >= dt && maxSteps > 0) {
      update(dt);
      accumulator -= dt;
      maxSteps--;
    }

    // Если после 5 шагов время всё еще осталось — сбрасываем его, 
    // чтобы не накапливать "долг" на следующий кадр (избегаем "спирали смерти")
    if (accumulator > dt) accumulator = 0;
  }

  render();
});
























