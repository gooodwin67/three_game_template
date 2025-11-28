import * as THREE from 'three';
import { getRandomNumber } from '../utils/functions';

export class InstancesClass {
 constructor(gameContext) {
  this.scene = gameContext.scene;
  this.physicsClass = gameContext.physicsClass;

  this.countInst1 = 3;

  this.instancesObjs = {
   instances1: {
    data: Array.from({ length: this.countInst1 }, (_, i) => ({
     position: new THREE.Vector3(0, 0.2, 0),
     rotation: new THREE.Euler(0, 0, 0),
     scale: new THREE.Vector3(1, 1, 1),
     size: new THREE.Vector3(0.2, 0.2, 0.2),
     userData: { name: 'inst1', collide: null, body: null, speed: null, direction: 1 },
    })),
    geometryInst1: new THREE.SphereGeometry(0.2),
    materialInst1: new THREE.MeshStandardMaterial({ color: 0x00cc00 }),
    inst1: null,
   },
  }

  this.instancesObjs.instances1.inst1 = new THREE.InstancedMesh(this.instancesObjs.instances1.geometryInst1, this.instancesObjs.instances1.materialInst1, this.countInst1);
  this.instancesObjs.instances1.inst1.instanceMatrix.setUsage(THREE.DynamicDrawUsage); // на случай будущих обновлений
  this.instancesObjs.instances1.inst1.receiveShadow = true;
  this.instancesObjs.instances1.inst1.castShadow = true;
  this.instancesObjs.instances1.inst1.frustumCulled = false;

 }

 init() {
  for (let i = 0; i < this.countInst1; i++) {
   this.instancesObjs.instances1.data[i].position.x = getRandomNumber(-3, 3);
   this.instancesObjs.instances1.data[i].position.z = getRandomNumber(-3, 3);
   this.instancesObjs.instances1.data[i].position.y = getRandomNumber(1, 2);


   this.physicsClass.addInstancedDynamic(this.instancesObjs.instances1.data, this.instancesObjs.instances1.inst1, i, {
    position: this.instancesObjs.instances1.data[i].position,
    size: this.instancesObjs.instances1.data[i].size,
    collide: '123'
   });



  }

  this.physicsClass.update();

  this.instancesObjs.instances1.inst1.instanceMatrix.needsUpdate = true;

  this.scene.add(this.instancesObjs.instances1.inst1)
 }

 /*
  apply(i, mas, plane) {
   // 1) инвертированный базовый размер считаем ОДИН раз и кэшируем
   let invBaseSize = plane.userData.invBaseSize;
   if (!invBaseSize) {
    const geom = plane.geometry;                       // <-- используем геометрию инстанса
    geom.computeBoundingBox();
    const baseSize = new THREE.Vector3();
    geom.boundingBox.getSize(baseSize);
    invBaseSize = plane.userData.invBaseSize = new THREE.Vector3(
     1 / (baseSize.x || 1),                           // <-- защита от деления на 0
     1 / (baseSize.y || 1),
     1 / (baseSize.z || 1)
    );
   }
   // 2) dummy создадим один раз и переиспользуем
   this._dummy ||= new THREE.Object3D();
   const dummy = this._dummy;
 
   const it = mas[i] || {};
   const sz = this.toVec3(it.size);                     // может быть number | {x,y,z} | Vector3    
 
   dummy.position.copy(it.position || new THREE.Vector3());
   if (it.rotation) dummy.rotation.copy(it.rotation);   // <-- дефолт если не задано
   else dummy.rotation.set(0, 0, 0);
 
   // 3) size (физический) -> scale (относительно базовой геометрии)
   dummy.scale.set(sz.x * invBaseSize.x, sz.y * invBaseSize.y, sz.z * invBaseSize.z);
 
   dummy.updateMatrix();
   plane.setMatrixAt(i, dummy.matrix);
  }
 */


 toVec3(v) {
  if (typeof v === "number") return new THREE.Vector3(v, v, v);
  if (v?.isVector3) return v;                          // <-- безопасная проверка
  if (v) return new THREE.Vector3(v.x ?? 1, v.y ?? 1, v.z ?? 1);
  return new THREE.Vector3(1, 1, 1);                   // <-- дефолт если size не задан
 }
}