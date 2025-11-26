import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class InitClass {
  constructor(gameContext) {

    this.gameContext = gameContext;
    

    this.onWindowResize = this.onWindowResize.bind(this);
    this.setVhVar = this.setVhVar.bind(this);
    this.onVisibilitychange = this.onVisibilitychange.bind(this);


    this.scene = new THREE.Scene();
    this.scene .background = new THREE.Color(0xc9e1f4);
    //this.scene.fog = new THREE.Fog(scene.background, 1, 35);
    this.camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 0.1, 2000);
    this.camera.position.x = 0;
    this.camera.position.y = 4;
    this.camera.position.z = 12;

    // ★ фиксируем HFOV не от текущего окна, а от референсного aspect
    const DESIGN_ASPECT = 16 / 9; // выбери свою базу (можно 16/9)
    const baseVFOV = THREE.MathUtils.degToRad(25);
    this.FIXED_HFOV = 2 * Math.atan(Math.tan(baseVFOV / 2) * DESIGN_ASPECT);

    
    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);
    this.stats.dom.style.top = "0";
    this.stats.dom.style.left = "0";

    this.renderer = new THREE.WebGLRenderer({ antialias: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);



    this.setVhVar();
    window.addEventListener('resize', this.setVhVar);
    window.addEventListener('orientationchange', this.setVhVar);
    window.visualViewport?.addEventListener('resize', this.setVhVar);

    window.addEventListener('resize', this.onWindowResize);
    window.addEventListener('visibilitychange', this.onVisibilitychange);
    this.onWindowResize();
    this.onVisibilitychange();
    
  }


  setVhVar() {
    const h = (window.visualViewport?.height || window.innerHeight) * 0.01;
    document.documentElement.style.setProperty('--vh', `${h}px`);
  }

  onVisibilitychange() {
    
    // Проверяем, инициализирован ли вообще аудио
    if (!this.gameContext.audioClass) return;
  
    if (document.visibilityState === 'visible') {
      
      
    } else {
      
      
    }
    
  }

  

  onWindowResize() {
    const w = document.body.offsetWidth;
    const h = document.body.offsetHeight;
    const aspect = w / h;
  
    // пересчитываем вертикальный FOV при фиксированном горизонтальном
    let vFOV = 2 * Math.atan(Math.tan(this.FIXED_HFOV / 2) / aspect);
  
    // необязательные «ограждения», чтобы на экстремальных экранах не уходить в микроскопические/гигантские значения
    const vMin = THREE.MathUtils.degToRad(4);
    const vMax = THREE.MathUtils.degToRad(90);
    vFOV = THREE.MathUtils.clamp(vFOV, vMin, vMax);
  
    this.camera.fov = THREE.MathUtils.radToDeg(vFOV);
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  
    this.renderer.setSize(w, h);
  }

  
}