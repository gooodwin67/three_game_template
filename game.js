import * as THREE from "three";

export class GameClass {
  constructor(gameContext) {
    this.scene = gameContext.scene;
  }

  loadMesh() {
    let geometryPlane = new THREE.PlaneGeometry(1, 1, 1);
    let materialPlane = new THREE.MeshBasicMaterial({ color: 0xcccccc, side: THREE.DoubleSide });
    let plane = new THREE.Mesh(geometryPlane, materialPlane);

    let geometryMesh = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    let materialMesh = new THREE.MeshBasicMaterial({ color: 0x770074, side: THREE.DoubleSide });
    let mesh = new THREE.Mesh(geometryMesh, materialMesh);

    this.scene.add(plane);
    this.scene.add(mesh);
  }

}

