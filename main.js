import * as THREE from 'three';
import { SdkManager } from './yan.js';
import { yanNeed } from "./functions.js"; // Проверьте пути!
import { EventEmitter } from './events.js';
import { InitClass } from './init.js'; // Лучше использовать относительные пути ./
import { ParamsClass } from './params.js';
import { PhysicsClass } from "./physics.js";
import { AudioClass } from "./audio.js";
import { ControlClass } from './control.js';
import { DataClass } from './data.js';
import { AssetsManager } from './assets-manager.js';
import { ScreenManager } from './screen-manager.js';
import { initI18n } from './i18n.js';
import { GameClass } from './game.js';
import { WorldClass } from './world.js';
import { PlayerClass } from './player.js';
import { InstancesClass } from './instances.js';

console.clear();

const gameContext = {};
const clock = new THREE.Clock(); // Часы инициализируем здесь

/* =========================================
   ENTRY POINT (Точка входа)
========================================= */
// Эта функция вызывается из SdkManager, когда SDK готов (или null)
export async function startGame(ysdkInstance) {
  // Сохраняем ysdk если нужно
  // window.ysdk = ysdkInstance; 

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
   BEFORE START
========================================= */
async function BeforeStart() {
  const loaderLine = document.querySelector('.loader_line');
  if(loaderLine) loaderLine.style.width = "30%";

  await initClases();
  await initFunctions();

  if(loaderLine) loaderLine.style.width = "100%";

  gameContext.paramsClass.gameInit = true;
  gameContext.ui.show('main_screen');
  
  // Подписываемся на старт матча
  gameContext.events.on('start_match', () => startMatch());

  // ВАЖНО: Запускаем цикл отрисовки только когда все классы созданы!
  startAnimationLoop();
}

async function startMatch() {
  gameContext.ui.hideAll();
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
  gameContext.initClass = new InitClass(gameContext); 
  gameContext.events = new EventEmitter();

  gameContext.scene = gameContext.initClass.scene;
  gameContext.camera = gameContext.initClass.camera;
  gameContext.renderer = gameContext.initClass.renderer;

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
  if(typeof yanNeed === 'function') await yanNeed();
  gameContext.paramsClass.initCustomScroll();
  initI18n('ru');

  await gameContext.assetsManager.loadTextures();
  await gameContext.physicsClass.initRapier();
  await gameContext.audioClass.loadAudio();
  await gameContext.controlClass.addKeyListeners();
}


/* =========================================
   GAME LOOP & RENDER
========================================= */
function update(delta) {
  if (!gameContext.paramsClass) return;

  switch (gameContext.paramsClass.currentGameState) {
    case gameContext.paramsClass.gameState.play:
      gameContext.playerClass.update(delta);
      gameContext.physicsClass.update(delta);
      break;
  }
}

function render() {
  if (gameContext.initClass && gameContext.initClass.stats) {
    gameContext.initClass.stats.update();
  }
  
  if (gameContext.renderer && gameContext.scene && gameContext.camera) {
    gameContext.renderer.render(gameContext.scene, gameContext.camera);
  }
}

function startAnimationLoop() {
    let accumulator = 0;
    const dt = 1 / 60;
    const maxFrame = 0.1;
  
    gameContext.renderer.setAnimationLoop(() => {
      let frameDelta = clock.getDelta();
      if (frameDelta > maxFrame) frameDelta = maxFrame;
      accumulator += frameDelta;
      
      let maxSteps = 5;
      while (accumulator >= dt && maxSteps > 0) {
        update(dt);
        accumulator -= dt;
        maxSteps--;
      }
  
      if (accumulator > dt) accumulator = 0;
      render();
    });
}

// =========================================
// ЗАПУСК ЧЕРЕЗ SDK MANAGER
// Это код выполняется сразу при загрузке main.js
// =========================================
const sdkManager = new SdkManager(startGame);
sdkManager.init();