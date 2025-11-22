import * as THREE from "three";

export class ControlClass {
  constructor(levelClass, isMobile, renderer, camera, paramsClass, audioClass) {
    this.levelClass = levelClass;
    this.isMobile = isMobile;
    this.renderer = renderer;
    this.camera = camera;
    this.paramsClass = paramsClass;
    this.audioClass = audioClass;

    this.mouse = new THREE.Vector3();
    this.raycaster = new THREE.Raycaster();

    // биндим методы, чтобы this внутри слушателей был правильный
    this.onTapDown = this.onTapDown.bind(this);
    this.onTapUp = this.onTapUp.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
  }

  addKeyListeners() {
    const element = this.renderer.domElement; // ← canvas
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    element.addEventListener('mousedown', this.onKeyDown);
    element.addEventListener('mouseup', this.onKeyUp);
    element.addEventListener('touchstart', this.onTapDown, { passive: false });
    element.addEventListener('touchend', this.onTapUp);
  }

  removedKeyListeners() {
    const element = this.renderer.domElement; // ← canvas
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

    if (this.levelClass.players.length == 1) {
      this.downKeys(this.levelClass.players[0].player);
    }
    else if (this.levelClass.players.length == 2) {
      if (this.mouse.x > 0) {
        this.downKeys(this.levelClass.players[0].player);
      }
      else {
        this.downKeys(this.levelClass.players[1].player);
      }
    }
    else if (this.levelClass.players.length == 3) {
      if (this.mouse.x > 0) {
        this.downKeys(this.levelClass.players[0].player);
      }
      else if (this.mouse.y < 0) {
        this.downKeys(this.levelClass.players[1].player);
      }
      else {
        this.downKeys(this.levelClass.players[2].player);
      }
    }
  }

  onTapUp(event) {
    let rect = this.renderer.domElement.getBoundingClientRect();
    event = event.changedTouches[0];
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);

    if (this.levelClass.players.length == 1) {
      this.upKeys(this.levelClass.players[0].player);
    }
    else if (this.levelClass.players.length == 2) {
      if (this.mouse.x > 0) {
        this.upKeys(this.levelClass.players[0].player);
      }
      else {
        this.upKeys(this.levelClass.players[1].player);
      }
    }
    else if (this.levelClass.players.length == 3) {
      if (this.mouse.x > 0) {
        this.upKeys(this.levelClass.players[0].player);
      }
      else if (this.mouse.y < 0) {
        this.upKeys(this.levelClass.players[1].player);
      }
      else {
        this.upKeys(this.levelClass.players[2].player);
      }
    }
  }

  onKeyDown(event) {
    switch (event.code) {
      case undefined:
        if (!this.isMobile) this.downKeys(this.levelClass.players[0].player);
        break;
      case 'KeyW':
      case 'ArrowUp':
        break;
      case 'KeyZ':
      case 'ArrowDown':
        if (this.levelClass.players.length > 1) {
          this.downKeys(this.levelClass.players[1].player);
        }
        break;
      case 'KeyM':
      case 'ArrowLeft':
        if (this.levelClass.players.length > 2) {
          this.downKeys(this.levelClass.players[2].player);
        }
        break;
      case 'KeyD':
      case 'ArrowRight':
        // this.levelClass.players.forEach((value, index, array) => {
        //   value.player.userData.playerAlive = true;
        // })
        break;
      case 'KeyP':
        // renderer.setPixelRatio(Math.min(window.devicePixelRatio, 10));
        this.renderer.setPixelRatio(1);
        break;
    }
  }

  onKeyUp(event) {
    switch (event.code) {
      case undefined:
        if (!this.isMobile) this.upKeys(this.levelClass.players[0].player);
        break;
      case 'KeyW':
      case 'ArrowUp':
        break;
      case 'KeyZ':
      case 'ArrowDown':
        if (this.levelClass.players.length > 1) {
          this.upKeys(this.levelClass.players[1].player);
        }
        break;
      case 'KeyM':
      case 'ArrowLeft':
        if (this.levelClass.players.length > 2) {
          this.upKeys(this.levelClass.players[2].player);
        }
        break;
      case 'KeyD':
      case 'ArrowRight':
        break;
    }
  }

  downKeys(player) {
    if (player.userData.live) {
      if (player.userData.onGround) {
        if (!player.userData.readyJump && this.audioClass.musicOn) {
          player.userData.audio[0].play();
        }
        player.userData.readyJump = true;
      }
      else if (player.userData.canFly) {
        if (!player.userData.readyJump && this.audioClass.musicOn) {
          player.userData.audio[0].play();
        }
        player.userData.readyJump = true;
      }
    }
  }

  upKeys(player) {
    if (player.userData.live) {

      if (player.userData.canFly && !player.userData.onGround) {
        if (player.userData.canFlyJumps > 0) {
          player.userData.canFlyJumps--;
          if (player.userData.canFlyJumps === 0) {
      
            const flyIndex = player.userData.canFlyNum;
      
            setTimeout(() => {
              player.userData.canFly = false;
      
              // ---- ФИКС ----
              if (
                this.levelClass &&
                Array.isArray(this.levelClass.boostHatModels) &&
                flyIndex !== null &&
                this.levelClass.boostHatModels[flyIndex]
              ) {
                this.levelClass.boostHatModels[flyIndex].userData.fly = false;
              }
              // ---------------
            }, 1000);
          }
        }
      }

      if (player.userData.readyJump && player.userData.onGround) {
        player.userData.jumping = true;
        player.userData.readyJump = false;
        player.userData.audio[0].stop();
        if (!player.userData.audio[1].isPlaying && this.audioClass.musicOn) {
          player.userData.audio[1].play();
        }
        player.userData.onGround = false;
      }
      else if (!player.userData.onGround) {
        if (player.userData.canFly) {
          player.userData.jumping = true;
          player.userData.readyJump = false;
          player.userData.audio[0].stop();
          if (!player.userData.audio[1].isPlaying && this.audioClass.musicOn) {
            player.userData.audio[1].play();
          }
          player.userData.onGround = false;
          player.userData.hatBoost--;
          if (player.userData.hatBoost == 0) {
            player.userData.canFly = false;
          
            const boostIndex = player.userData.numHatBoost;
          
            setTimeout(() => {
          
              // ---- ФИКС ----
              if (
                this.levelClass &&
                Array.isArray(this.levelClass.boostHatModels) &&
                boostIndex !== null &&
                this.levelClass.boostHatModels[boostIndex]
              ) {
                this.levelClass.boostHatModels[boostIndex].userData.fly = false;
              }
              // ---------------
          
            }, 500);
          }
        }
        else {
          player.userData.readyJump = false;
          player.userData.audio[0].stop();
        }
      }
    }
  }
}
