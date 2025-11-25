import * as THREE from "three";

export class ControlClass {
  constructor(gameContext) {
    this.renderer = gameContext.renderer;
    this.camera = gameContext.camera;
    this.events = gameContext.events;


    this.mouse = new THREE.Vector3();
    this.raycaster = new THREE.Raycaster();

    // биндим методы, чтобы this внутри слушателей был правильный
    this.onTapDown = this.onTapDown.bind(this);
    this.onTapUp = this.onTapUp.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
  }

  async addKeyListeners() {
    const element = this.renderer.domElement;
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    element.addEventListener('mousedown', this.onKeyDown);
    element.addEventListener('mouseup', this.onKeyUp);
    element.addEventListener('touchstart', this.onTapDown, { passive: false });
    element.addEventListener('touchend', this.onTapUp);
  }

  removedKeyListeners() {
    const element = this.renderer.domElement;
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    element.removeEventListener('mousedown', this.onKeyDown);
    element.removeEventListener('mouseup', this.onKeyUp);
    element.removeEventListener('touchstart', this.onTapDown);
    element.removeEventListener('touchend', this.onTapUp);
  }

  onTapDown(event) {
    let rect = this.renderer.domElement.getBoundingClientRect();
    event = event.changedTouches[0];
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);


  }

  onTapUp(event) {
    let rect = this.renderer.domElement.getBoundingClientRect();
    event = event.changedTouches[0];
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);


  }

  onKeyDown(event) {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.events.emit('player_forward', 1);
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.events.emit('player_backward', 1);
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.events.emit('player_left', 1);
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.events.emit('player_right', 1);
        break;
    }
  }


  onKeyUp(event) {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.events.emit('player_forward', 0);
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.events.emit('player_backward', 0);
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.events.emit('player_left', 0);
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.events.emit('player_right', 0);
        break;
    }
  }


}
