import * as THREE from 'three';

export class PlayerClass {
  constructor(gameContext) {

    this.scene = gameContext.scene;
    this.events = gameContext.events;

    this.physicsClass = gameContext.physicsClass;

    this.player = null;
    this.playerBody = null;
    this.options = {
      size: { w: 0.18, h: 0.1, d: 0.1 },
      color: 0x770074,
      speed: 1.0,
      name: 'player',
    }
    this.move = { left: 0, right: 0, forward: 0, backward: 0 }

    this.init();
  }

  loadPlayer() {
    let geometryMesh = new THREE.SphereGeometry(this.options.size.w);
    let materialMesh = new THREE.MeshStandardMaterial({ color: this.options.color, side: THREE.DoubleSide });
    this.player = new THREE.Mesh(geometryMesh, materialMesh);

    this.player.userData = { ...this.options };

    this.player.castShadow = true;
    this.player.receiveShadow = true;
    this.player.position.set(0, 1, 0);

    this.physicsClass.addPhysicsToObject(this.player);
    this.playerBody = this.player.userData.body;

    this.scene.add(this.player)
  }

  init() {
    this.events.on('player_left', (e) => this.move.left = e);
    this.events.on('player_right', (e) => this.move.right = e);
    this.events.on('player_forward', (e) => this.move.forward = e);
    this.events.on('player_backward', (e) => this.move.backward = e);
  }


  update(delta) {

    const speed = this.options.speed;
    const body = this.playerBody;
    const velocity = this.playerBody.linvel();

    let moveX = 0;
    let moveZ = 0;

    if (this.move.forward) moveZ -= 1;
    if (this.move.backward) moveZ += 1;
    if (this.move.left) moveX -= 1;
    if (this.move.right) moveX += 1;

    // нормализация (если движение по диагонали)
    const length = Math.sqrt(moveX * moveX + moveZ * moveZ); //Math.hypot(moveX, moveZ);
    if (length > 0) {
      moveX /= length;
      moveZ /= length;
    }

    velocity.x = moveX * speed;
    velocity.z = moveZ * speed;


    body.setLinvel(velocity);
  }


}