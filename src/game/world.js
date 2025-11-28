import * as THREE from "three";

export class WorldClass {
  constructor(gameContext) {
    this.scene = gameContext.scene;

    this.dirLight = null;
    this.ambientLight = null;
  }

  loadLight(ambient = true, dir = true) {

    this.ambientLight = new THREE.AmbientLight(0xffffff, 1); 

    
    this.dirLight = new THREE.DirectionalLight(0xffffff, 1);
    this.dirLight.position.set(0, 5, 0); 
    this.dirLight.castShadow = true;
    this.dirLight.shadow.camera.far = 100;
    
    if (ambient) this.scene.add(this.ambientLight)
    if (dir) this.scene.add(this.dirLight)
    
    
  }

}

