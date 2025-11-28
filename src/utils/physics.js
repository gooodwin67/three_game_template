import * as THREE from "three";

// Константы для настройки физики по умолчанию
const DEFAULTS = {
    gravity: { x: 0, y: -9.81, z: 0 },
    precision: {
        maxVelocityIterations: 4, // Оптимизация: меньше проходов = быстрее (2 для производительности)
        maxPositionIterations: 1, // Оптимизация: (стандарт 1)
    }
};

export class PhysicsClass {
    constructor(gameContext) {
        this.scene = gameContext?.scene; // Если нужно дебажить, можно использовать сцену

        // Основные объекты Rapier
        this.RAPIER = null;
        this.world = null;
        this.eventQueue = null;

        // Хранилища объектов
        // Используем Map для быстрого доступа, если понадобится удаление
        this.dynamicBodies = []; // [mesh, rigidBody, uuid]
        this.instancedBodies = []; // { mesh, index, size, body }

        // Вспомогательные объекты для оптимизации (чтобы не создавать Vector3 каждый кадр)
        this._dummy = new THREE.Object3D();
        this._tmpVec3 = new THREE.Vector3();
    }

    /* =========================================
       1. INITIALIZATION
    ========================================= */

    async initRapier() {
        if (!this.RAPIER) {
            this.RAPIER = await this._loadRapierModule();
        }

        const gravity = new this.RAPIER.Vector3(
            DEFAULTS.gravity.x,
            DEFAULTS.gravity.y,
            DEFAULTS.gravity.z
        );

        this.world = new this.RAPIER.World(gravity);

        // Настройки производительности
        this.world.maxVelocityIterations = DEFAULTS.precision.maxVelocityIterations;
        this.world.maxPositionIterations = DEFAULTS.precision.maxPositionIterations;

        this.eventQueue = new this.RAPIER.EventQueue(true);

        console.log("Physics: Rapier initialized");
    }

    async _loadRapierModule() {
        if (window.RAPIER) return window.RAPIER;
        try {
            return await import('@dimforge/rapier3d');
        } catch (error) {
            console.warn('Physics: Failed to import @dimforge/rapier3d module', error);
            if (window.RAPIER) return window.RAPIER;
            throw error;
        }
    }

    /* =========================================
       2. LOOP & UPDATE
    ========================================= */

    update(delta) {
        if (!this.world) return;

        // 1. Шаг физики
        this.world.step(this.eventQueue);

        // 2. Синхронизация обычных мешей (Dynamic)
        this._syncDynamicBodies();

        // 3. Синхронизация инстансов (InstancedMesh)
        this._syncInstancedBodies();
    }

    _syncDynamicBodies() {
        for (let i = 0, n = this.dynamicBodies.length; i < n; i++) {
            const [mesh, body] = this.dynamicBodies[i];

            // Если объект удален из сцены, но остался в физике — пропускаем или удаляем (по желанию)
            if (!mesh) continue;

            const t = body.translation();
            const r = body.rotation();

            mesh.position.set(t.x, t.y, t.z);
            mesh.quaternion.set(r.x, r.y, r.z, r.w);
        }
    }

    _syncInstancedBodies() {
        if (this.instancedBodies.length === 0) return;

        const dummy = this._dummy;
        const touchedMeshes = new Set();

        for (const item of this.instancedBodies) {
            const { mesh, index, size, body } = item;

            // Оптимизация: если тело спит, не обновляем матрицу
            if (body.isSleeping()) continue;

            const t = body.translation();
            const r = body.rotation();
            const invBase = Helpers.ensureInvBase(mesh);

            dummy.position.set(t.x, t.y, t.z);
            dummy.quaternion.set(r.x, r.y, r.z, r.w);
            dummy.scale.set(
                size.x * invBase.x,
                size.y * invBase.y,
                size.z * invBase.z
            );
            dummy.updateMatrix();

            mesh.setMatrixAt(index, dummy.matrix);
            touchedMeshes.add(mesh);
        }

        // Сообщаем Three.js, что матрицы обновились
        for (const mesh of touchedMeshes) {
            mesh.instanceMatrix.needsUpdate = true;
        }
    }

    /* =========================================
       3. ADDING OBJECTS (Public API)
    ========================================= */

    /**
     * Основной метод добавления физики к объекту.
     * Определяет тип по userData.name (для совместимости с твоим кодом)
     */
    addPhysicsToObject(obj) {
        if (!obj || !obj.userData) return;

        const name = obj.userData.name || '';

        // Логика определения типа тела
        if (name.includes('player')) {
            this._createPlayerBody(obj);
        } else if (name.includes('ground') || name.includes('wall')) {
            this._createStaticBody(obj); // Или Kinematic, как у тебя было для ground
        } else {
            // Фолбек для остальных объектов
            this._createGenericBody(obj);
        }
    }

    // --- Specific Factories ---

    _createPlayerBody(obj) {
        // Подготовка размеров
        Helpers.prepareMeshTransform(obj);
        const size = Helpers.getMeshSizeIgnoringChildren(obj);
        Helpers.restoreMeshTransform(obj);

        obj.userData.size = size;

        // 1. Rigid Body
        const bodyDesc = this.RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(obj.position.x, obj.position.y, obj.position.z)
            .setRotation(obj.quaternion)
            .setCanSleep(false)
            .lockRotations() // Игрок обычно не должен падать "лицом в пол"
            .setLinearDamping(2.0)
            .setAngularDamping(2.0);

        const body = this.world.createRigidBody(bodyDesc);

        // 2. Collider (Ball для игрока лучше всего подходит для движения)
        const colliderDesc = this.RAPIER.ColliderDesc.ball(size.x / 2)
            .setMass(100)
            .setRestitution(0.0) // Не прыгучий
            .setFriction(0.0)    // Чтобы не цеплялся за стены
            .setActiveEvents(this.RAPIER.ActiveEvents.COLLISION_EVENTS);

        const collider = this.world.createCollider(colliderDesc, body);

        // 3. Сохраняем ссылки
        this._attachDataToMesh(obj, body, collider);
        this.dynamicBodies.push([obj, body, obj.uuid]);
    }

    _createStaticBody(obj) {
        // Для земли используем KinematicPositionBased (если она движется) или Fixed (если стоит)
        // В твоем коде было KinematicPositionBased.

        Helpers.prepareMeshTransform(obj);
        const size = Helpers.getMeshSizeIgnoringChildren(obj);
        Helpers.restoreMeshTransform(obj);

        const bodyDesc = this.RAPIER.RigidBodyDesc.kinematicPositionBased()
            .setTranslation(obj.position.x, obj.position.y, obj.position.z)
            .setRotation(obj.quaternion);

        const body = this.world.createRigidBody(bodyDesc);

        const colliderDesc = this.RAPIER.ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2)
            .setFriction(1.0)
            .setRestitution(0.0);

        colliderDesc.setActiveEvents(this.RAPIER.ActiveEvents.COLLISION_EVENTS);

        const collider = this.world.createCollider(colliderDesc, body);

        this._attachDataToMesh(obj, body, collider);
        // Добавляем в dynamicBodies, так как kinematic может двигаться (платформы)
        this.dynamicBodies.push([obj, body, obj.uuid]);
    }

    _createGenericBody(obj) {
        // Простой динамический куб/сфера
        Helpers.prepareMeshTransform(obj);
        const size = Helpers.getMeshSizeIgnoringChildren(obj);
        Helpers.restoreMeshTransform(obj);

        const bodyDesc = this.RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(obj.position.x, obj.position.y, obj.position.z)
            .setRotation(obj.quaternion);

        const body = this.world.createRigidBody(bodyDesc);

        const colliderDesc = this.RAPIER.ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2);
        const collider = this.world.createCollider(colliderDesc, body);

        this._attachDataToMesh(obj, body, collider);
        this.dynamicBodies.push([obj, body, obj.uuid]);
    }

    _attachDataToMesh(mesh, body, collider) {
        mesh.userData.body = body;
        mesh.userData.collider = collider; // Используем единое имя collider
        mesh.userData.handle = body.handle;
    }

    /* =========================================
       4. INSTANCING SUPPORT
    ========================================= */

    addInstancedDynamic(dataArray, mesh, index, opts) {
        this._addInstancedBody(dataArray, mesh, index, opts, 'dynamic');
    }

    addInstancedStatic(dataArray, mesh, index, opts) {
        this._addInstancedBody(dataArray, mesh, index, opts, 'fixed'); // или kinematic
    }

    _addInstancedBody(dataArray, mesh, index, opts, type) {
        const size = Helpers.toVec3(opts.size);
        const pos = Helpers.toVec3(opts.position ?? { x: 0, y: 0, z: 0 });
        const rotQ = (opts.quaternion?.isQuaternion) ? opts.quaternion : new THREE.Quaternion();

        // 1. Body Desc
        let bodyDesc;
        if (type === 'dynamic') {
            bodyDesc = this.RAPIER.RigidBodyDesc.dynamic()
                .setLinearDamping(2.5)
                .setAngularDamping(0.5);
        } else {
            bodyDesc = this.RAPIER.RigidBodyDesc.kinematicPositionBased();
        }

        bodyDesc.setTranslation(pos.x, pos.y, pos.z)
            .setRotation({ x: rotQ.x, y: rotQ.y, z: rotQ.z, w: rotQ.w });

        const body = this.world.createRigidBody(bodyDesc);

        // 2. Collider Desc (По умолчанию шар для динамики, куб для статики - можно вынести в опции)
        let colliderDesc;
        if (type === 'dynamic') {
            colliderDesc = this.RAPIER.ColliderDesc.ball(size.x / 2)
                .setMass(1)
                .setFriction(0.5)
                .setRestitution(0.5);
        } else {
            colliderDesc = this.RAPIER.ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2)
                .setFriction(1.6)
                .setRestitution(0.0);
        }

        const collider = this.world.createCollider(colliderDesc, body);

        // 3. Save User Data
        dataArray[index].userData.body = body;
        dataArray[index].userData.shape = colliderDesc; // legacy name
        dataArray[index].userData.collide = collider;

        this.instancedBodies.push({ mesh, index, size, body });
    }
}


/* =========================================
   5. HELPERS (Static Utils)
========================================= */
class Helpers {
    static _tmpSize = new THREE.Vector3();
    static _unitVec = new THREE.Vector3(1, 1, 1);

    static toVec3(v) {
        if (typeof v === "number") return new THREE.Vector3(v, v, v);
        if (v?.isVector3) return v.clone();
        return new THREE.Vector3(v?.x ?? 1, v?.y ?? 1, v?.z ?? 1);
    }

    // Для правильного расчета BoundingBox нужно сбросить вращение
    static prepareMeshTransform(obj) {
        obj.userData.orgRotation = obj.rotation.clone();
        obj.rotation.set(0, 0, 0);
        obj.updateMatrixWorld(true); // Важно обновить матрицы
    }

    static restoreMeshTransform(obj) {
        if (obj.userData.orgRotation) {
            obj.rotation.copy(obj.userData.orgRotation);
            obj.updateMatrixWorld(true);
        }
    }

    static getMeshSizeIgnoringChildren(obj) {
        // Если это Mesh с геометрией — берём только её bbox
        if (obj.isMesh && obj.geometry) {
            const geom = obj.geometry;
            if (!geom.boundingBox) geom.computeBoundingBox();

            const bb = geom.boundingBox;
            bb.getSize(this._tmpSize);

            // Учитываем scale объекта
            this._tmpSize.multiply(obj.scale);
            return this._tmpSize.clone();
        }

        // Фолбек для групп
        const box = new THREE.Box3().setFromObject(obj);
        return box.getSize(new THREE.Vector3());
    }

    // Кэш обратного размера базы для инстансов
    static ensureInvBase(mesh) {
        if (mesh.userData.invBase) return mesh.userData.invBase;

        const geom = mesh.geometry;
        if (!geom.boundingBox) geom.computeBoundingBox();

        const bbSize = new THREE.Vector3();
        geom.boundingBox.getSize(bbSize);

        const inv = new THREE.Vector3(
            1 / (bbSize.x || 1),
            1 / (bbSize.y || 1),
            1 / (bbSize.z || 1)
        );

        mesh.userData.invBase = inv;
        return inv;
    }
}