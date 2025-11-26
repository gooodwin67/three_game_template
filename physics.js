import * as THREE from "three";

export class PhysicsClass {
  constructor() {

    this.world = null;
    this.eventQueue = null;
    this.dynamicBodies = [];

    this.playersHandles = [];

    this.RAPIER = null;



    // --- НОВОЕ: учёт инстансов ---
    this.instancedBodies = [];          // { mesh, index, size:THREE.Vector3, body }
    this._dummy = new THREE.Object3D(); // переиспользуемый dummy

  }

  update() {
    this.world.step(this.eventQueue);
    for (let i = 0, n = this.dynamicBodies.length; i < n; i++) {
      this.dynamicBodies[i][0].position.copy(this.dynamicBodies[i][1].translation())
      this.dynamicBodies[i][0].quaternion.copy(this.dynamicBodies[i][1].rotation())
    }
    this.updateInstancedTransforms();
  }

  async loadRapier() {
    if (window.RAPIER) {
      return window.RAPIER;
    }
    try {
      const rapierModule = await import('@dimforge/rapier3d');
      return rapierModule;
    } catch (error) {
      console.warn('Не удалось импортировать @dimforge/rapier3d как модуль', error);
      if (window.RAPIER) {
        return window.RAPIER;
      }
      throw error;
    }
  }

  async initRapier() {
    this.RAPIER = await this.loadRapier();
    this.world = new this.RAPIER.World(new this.RAPIER.Vector3(0, -9.81, 0));

    // --- ОПТИМИЗАЦИЯ ---
    // Уменьшаем количество проходов решателя (стандартно 4)
    // Физика станет чуть менее "жесткой", но гораздо быстрее
    this.world.maxVelocityIterations = 2;
    this.world.maxPositionIterations = 1;

    this.eventQueue = new this.RAPIER.EventQueue(true);
  }



  // Кэш обратного размера базы (1/baseSize) на самом меше
  static _ensureInvBase(mesh) {
    if (mesh.userData.invBase) return mesh.userData.invBase;
    const geom = mesh.geometry;
    geom.computeBoundingBox();
    const bbSize = new THREE.Vector3();
    geom.boundingBox.getSize(bbSize);
    // защита от деления на 0 (например, у плоскости по Z)
    const inv = new THREE.Vector3(1 / (bbSize.x || 1), 1 / (bbSize.y || 1), 1 / (bbSize.z || 1));
    mesh.userData.invBase = inv;
    return inv;
  }

  // Хелпер: number | {x,y,z} | Vector3 -> Vector3
  static _toVec3(v) {
    if (typeof v === "number") return new THREE.Vector3(v, v, v);
    if (v?.isVector3) return v.clone();
    return new THREE.Vector3(v?.x ?? 1, v?.y ?? 1, v?.z ?? 1);
  }

  // --- НОВОЕ: динамический инстанс (каждый блок — отдельное rigid body) ---
  addInstancedDynamic(mas, mesh, index, opts) {
    const size = PhysicsClass._toVec3(opts.size);
    const pos = PhysicsClass._toVec3(opts.position ?? { x: 0, y: 0, z: 0 });
    const rotQ = (opts.quaternion?.isQuaternion) ? opts.quaternion : new THREE.Quaternion();

    const rb = this.world.createRigidBody(
      this.RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(pos.x, pos.y, pos.z)
        .setRotation({ x: rotQ.x, y: rotQ.y, z: rotQ.z, w: rotQ.w })
        .setLinearDamping(2.5)   // Сопротивление движению (воздух)
        .setAngularDamping(0.5) // Сопротивление вращению (чтобы перестал катиться)
    );

    const col = this.RAPIER.ColliderDesc.ball(size.x / 2)
      .setMass(1).setFriction(0).setRestitution(1.5);

    mas[index].userData.body = rb;
    mas[index].userData.shape = col;
    mas[index].userData.collide = this.world.createCollider(col, rb);

    this.instancedBodies.push({ mesh, index, size, body: rb });
  }

  // --- НОВОЕ: статичный инстанс (fixed body; если их много — выгоднее один body + много коллайдеров) ---
  addInstancedStatic(mas, mesh, index, opts) {
    const size = PhysicsClass._toVec3(opts.size);
    const pos = PhysicsClass._toVec3(opts.position ?? { x: 0, y: 0, z: 0 });
    const rotQ = (opts.quaternion?.isQuaternion) ? opts.quaternion : new THREE.Quaternion();

    const rb = this.world.createRigidBody(
      this.RAPIER.RigidBodyDesc.kinematicPositionBased()
        .setTranslation(pos.x, pos.y, pos.z)
        .setRotation({ x: rotQ.x, y: rotQ.y, z: rotQ.z, w: rotQ.w })
    );

    const col = this.RAPIER.ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2)
      .setFriction(1.6).setRestitution(0.0);
    mas[index].userData.body = rb;
    mas[index].userData.shape = col;
    mas[index].userData.collide = this.world.createCollider(col, rb);



    this.instancedBodies.push({ mesh, index, size, body: rb });
  }

  // --- НОВОЕ: вызывать в animate для синхронизации инстансов ---
  updateInstancedTransforms() {
    const dummy = this._dummy;
    const touched = new Set();

    for (const it of this.instancedBodies) {
      // ОПТИМИЗАЦИЯ: Если тело спит, пропускаем пересчет матрицы
      if (it.body.isSleeping()) continue;

      const invBase = PhysicsClass._ensureInvBase(it.mesh);
      const t = it.body.translation();
      const r = it.body.rotation();

      dummy.position.set(t.x, t.y, t.z);
      dummy.quaternion.set(r.x, r.y, r.z, r.w);
      dummy.scale.set(it.size.x * invBase.x, it.size.y * invBase.y, it.size.z * invBase.z);
      dummy.updateMatrix();

      it.mesh.setMatrixAt(it.index, dummy.matrix);
      touched.add(it.mesh);
    }

    // Если ни один кубик не двигался, мы даже не пошлем данные на GPU
    for (const mesh of touched) mesh.instanceMatrix.needsUpdate = true;
  }


  addPhysicsToObject(obj) {

    if (obj != undefined && obj.userData.name.includes('player')) {

      let body;
      let shape;

      const originalRotation = obj.rotation.clone();
      obj.rotation.set(0, 0, 0);
      const box = new THREE.Box3().setFromObject(obj);
      const size = getMeshSizeIgnoringChildren(obj);
      obj.rotation.copy(originalRotation);

      obj.userData.size = size;
      obj.userData.orgRotation = originalRotation;

      body = this.world.createRigidBody(this.RAPIER.RigidBodyDesc.dynamic().setTranslation(obj.position.x, obj.position.y, obj.position.z).setRotation(obj.quaternion).setCanSleep(false).enabledRotations(false, false, false).setLinearDamping(2.0).setAngularDamping(2.0));
      shape = this.RAPIER.ColliderDesc.ball(size.x / 2)
        .setMass(100)
        .setRestitution(0.5)
        .setFriction(0)
        .setActiveEvents(this.RAPIER.ActiveEvents.COLLISION_EVENTS);

      obj.userData.body = body;
      obj.userData.shape = shape;

      let playerBody = body;
      let playerShape = shape;
      shape.setActiveEvents(this.RAPIER.ActiveEvents.COLLISION_EVENTS);

      let playerCollider = this.world.createCollider(shape, body)

      obj.userData.collider = playerCollider;

      obj.userData.handle = playerBody.handle;
      this.playersHandles.push(playerBody.handle)

      this.dynamicBodies.push([obj, body, obj.id])


      // const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
      // const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5, wireframe: true });
      // const cube = new THREE.Mesh(geometry, material);
      // cube.position.set(obj.position.x, obj.position.y, obj.position.z)
      // cube.rotation.copy(originalRotation);
      // scene.add(cube);

    }

    else if (obj != undefined && obj.userData.name.includes('ground')) {

      let body;
      let shape;

      const originalRotation = obj.rotation.clone();
      obj.rotation.set(0, 0, 0);
      const box = new THREE.Box3().setFromObject(obj);
      const size = getMeshSizeIgnoringChildren(obj);
      obj.rotation.copy(originalRotation);

      obj.userData.size = size;
      obj.userData.orgRotation = originalRotation;

      body = this.world.createRigidBody(this.RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(obj.position.x, obj.position.y, obj.position.z).setRotation(obj.quaternion).setCanSleep(false).enabledRotations(false, false, false).setLinearDamping(0).setAngularDamping(2.0));
      shape = this.RAPIER.ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2).setMass(1).setRestitution(0.0).setFriction(1);
      shape.setActiveEvents(this.RAPIER.ActiveEvents.COLLISION_EVENTS);
      let collide = this.world.createCollider(shape, body);
      obj.userData.body = body;
      obj.userData.collide = collide;
      obj.userData.handle = body.handle;
      this.dynamicBodies.push([obj, body, obj.id])
    }
  }

}

const _tmpSize = new THREE.Vector3();

function getMeshSizeIgnoringChildren(obj) {
  // Если это Mesh с геометрией — берём только её bbox
  if (obj.isMesh && obj.geometry) {
    const geom = obj.geometry;
    if (!geom.boundingBox) geom.computeBoundingBox();
    const bb = geom.boundingBox; // локальный bbox
    bb.getSize(_tmpSize);
    // учитывать scale объекта
    _tmpSize.multiply(obj.scale);
    return _tmpSize.clone();
  }
  // иначе — как было (на случай групп или сложных объектов)
  const box = new THREE.Box3().setFromObject(obj);
  return box.getSize(new THREE.Vector3());
}