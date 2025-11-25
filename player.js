import * as THREE from 'three';

export class PlayerClass {
  constructor(gameContext) {

    this.scene = gameContext.scene;
    this.events = gameContext.events;

    this.player = null;
    this.options = {
      size: { w: 0.1, h: 0.1, d: 0.1 },
      color: 0x770074,
      speed: 0.5,
    }
    this.move = { left: 0, right: 0, forward: 0, backward: 0 }

    this.init();
  }

  loadPlayer() {
    let geometryMesh = new THREE.BoxGeometry(this.options.size.w, this.options.size.h, this.options.size.d);
    let materialMesh = new THREE.MeshBasicMaterial({ color: this.options.color, side: THREE.DoubleSide });
    this.player = new THREE.Mesh(geometryMesh, materialMesh);

    this.scene.add(this.player)
  }

  init() {
    this.events.on('player_left', (e) => this.move.left = e);
    this.events.on('player_right', (e) => this.move.right = e);
    this.events.on('player_forward', (e) => this.move.forward = e);
    this.events.on('player_backward', (e) => this.move.backward = e);
  }

  update(delta) {

    if (!this.player) return;

    const moveDistance = this.options.speed * delta;
    if (this.move.forward) this.player.position.y += moveDistance;
    if (this.move.backward) this.player.position.y -= moveDistance;
    if (this.move.left) this.player.position.x -= moveDistance;
    if (this.move.right) this.player.position.x += moveDistance;
  }


}