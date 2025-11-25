import * as THREE from "three";

export class GameClass {
  constructor(gameContext) {
    this.scene = gameContext.scene;
  }

  loadMesh() {
    let geometryPlane = new THREE.PlaneGeometry(1, 1, 1);
    let materialPlane = new THREE.MeshBasicMaterial({ color: 0xcccccc, side: THREE.DoubleSide });
    let plane = new THREE.Mesh(geometryPlane, materialPlane);

    this.scene.add(plane);
  }

}

