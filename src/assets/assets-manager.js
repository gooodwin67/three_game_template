import * as THREE from "three";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class AssetsManager {
  constructor() {

    this.planeGrass = { texture: null, material: null }
    this.model = null;

  }


  /* =========================================
    LOAD TEXTURES
  ========================================= */
  async loadTextures() {
    const loader = new THREE.TextureLoader();
    const [grassTex] = await Promise.all([
      loader.loadAsync('textures/grass.jpg'),
    ]);
    this.planeGrass.texture = grassTex;
    this.planeGrass.material = new THREE.MeshStandardMaterial({ map: grassTex });
  }



  /* =========================================
    LOAD MODELS
  ========================================= */
  async loadModels() {
    const gltfLoader = new GLTFLoader();
    const url = 'models/model.glb';

    await gltfLoader.loadAsync(url).then((gltf) => {
      const root = gltf.scene;
      const anims = gltf.animations;

      root.scale.x = 2;
      root.scale.y = 2;
      root.scale.z = 2;
      root.position.y = 0;
      root.rotation.y = -Math.PI / 3;

      this.model = root;
      this.model.userData.mixer = new THREE.AnimationMixer(this.model);
      this.model.userData.action = this.model.userData.mixer.clipAction(anims[0]);
      this.model.userData.action.play();

      this.model.userData.clock = new THREE.Clock();

      // Отключаем тени и прогреваем геометрию/материалы
      // this.model.traverse(o => {
      //  if (o.isMesh || o.isSkinnedMesh) {
      //   o.castShadow = false;
      //   o.receiveShadow = false;
      //   // на всякий случай: чтобы не считать на первом видимом кадре
      //   if (o.geometry && !o.geometry.boundingSphere) {
      //    o.geometry.computeBoundingSphere();
      //   }
      //  }
      // });

      // const mat = this.model.children[0].children[0].material; // ваш MeshPhysicalMaterial
      // mat.emissive.set(0xffffff);      // цвет «свечения»
      // mat.emissiveIntensity = 0.1;     // яркость

    })
  }


}


