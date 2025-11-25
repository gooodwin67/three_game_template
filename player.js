import * as THREE from 'three';

export class PlayerClass {
  constructor(gameContext) {

    this.scene = gameContext.scene;
    this.events = gameContext.events;

    this.physicsClass = gameContext.physicsClass;

    this.player = null;
    this.playerBody = null;
    this.options = {
      size: { w: 0.1, h: 0.1, d: 0.1 },
      color: 0x770074,
      speed: 1.5,
      name: 'player',
    }
    this.move = { left: 0, right: 0, forward: 0, backward: 0 }

    this.init();
  }

  loadPlayer() {
    let geometryMesh = new THREE.BoxGeometry(this.options.size.w, this.options.size.h, this.options.size.d);
    let materialMesh = new THREE.MeshPhongMaterial({ color: this.options.color, side: THREE.DoubleSide });
    this.player = new THREE.Mesh(geometryMesh, materialMesh);

    this.player.userData = {...this.options};

    this.player.castShadow = true;
    this.player.receiveShadow = true;
    this.player.position.set(0,1,0);

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

    if (!this.playerBody) return;
    
    const velocity = this.playerBody.linvel();
    const speed = this.options.speed;

    velocity.x = 0;
    velocity.z = 0;

    // const moveDistance = this.options.speed * delta;
    if (this.move.forward) velocity.z -= speed;
    if (this.move.backward) velocity.z += speed;
    if (this.move.left) velocity.x -= speed;
    if (this.move.right) velocity.x += speed;

    this.playerBody.setLinvel(velocity);
  }


}