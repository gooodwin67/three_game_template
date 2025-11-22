import * as THREE from "three";


export function getRandomNumber(min, max) {
    return Math.random() * (max - min) + min
}




export function detectCollisionCubes(object1, object2) {
    object1.geometry.computeBoundingBox();
    object2.geometry.computeBoundingBox();
    object1.updateMatrixWorld();
    object2.updateMatrixWorld();
    let box1 = object1.geometry.boundingBox.clone();
    box1.applyMatrix4(object1.matrixWorld);
    let box2 = object2.geometry.boundingBox.clone();
    box2.applyMatrix4(object2.matrixWorld);

    //if (box1.intersectsBox(box2)) $('.info').text(1);
    return box1.intersectsBox(box2);
}


export function detectCollisionCubeAndArray(object1, array) {
    object1.geometry.computeBoundingBox();

    array.forEach(function (item, index, array) {
        item.geometry.computeBoundingBox();
    });

    object1.updateMatrixWorld();
    array.forEach(function (item, index, array) {
        item.updateMatrixWorld();
    });

    let box1 = object1.geometry.boundingBox.clone();
    box1.applyMatrix4(object1.matrixWorld);

    var intersect = false;

    // array.forEach(function (item, index, array) {
    for (let i = array.length - 1; i > -1; i--) {

        if (array[i].userData.id == undefined || array[i].userData.id != object1.uuid) {
            let box2 = array[i].geometry.boundingBox.clone();
            box2.applyMatrix4(array[i].matrixWorld);

            if (box2.intersectsBox(box1)) {
                intersect = array[i];
            }
        }

    }
    // });





    return intersect;



}








export async function yanNeed() {
    // === ЯНДЕКС ИГРЫ: Глобальное отключение системных действий ===
    // Отключаем контекстное меню (правый клик / долгий тап)
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    }, { capture: true });
    // Отключаем выделение текста
    document.addEventListener('selectstart', (e) => {
        e.preventDefault();
        return false;
    }, { capture: true });
    // Отключаем drag & drop
    document.addEventListener('dragstart', (e) => {
        e.preventDefault();
        return false;
    }, { capture: true });
    // Запрещаем магнитное увеличение на iOS
    document.addEventListener('touchstart', (e) => {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });
    // Дополнительная защита от системных меню (долгий тап)
    let longPressTimer;
    document.addEventListener('touchstart', (e) => {
        longPressTimer = setTimeout(() => {
            e.preventDefault();
        }, 500);
    }, { passive: false });
    document.addEventListener('touchend', () => {
        clearTimeout(longPressTimer);
    });
    document.addEventListener('touchmove', () => {
        clearTimeout(longPressTimer);
    });
    // Отключаем двойной тап (зум)
    document.addEventListener('dblclick', (e) => {
        e.preventDefault();
        return false;
    }, { capture: true });
    // Специально для Яндекс.Игр: отключаем вызов браузерных меню, НО разрешаем кнопки
    if (navigator.userAgent.includes('YaBrowser') || navigator.userAgent.includes('Yandex')) {
        document.addEventListener('touchstart', (e) => {
            // Список ВСЕХ классов, по которым можно кликать в твоей игре
            const isInteractive = e.target.closest(
                '.new_game_btn, ' +             // Кнопки главного меню
                '.free_game_btn, ' +            // Кнопки выбора режима (Океан/Космос)
                '.popup_game_btn, ' +           // Кнопки в попапе паузы/победы
                '.popup_game_btn_close, ' +     // Крестик закрытия
                '.level_game_chels, ' +         // Выбор игроков (уровни)
                '.level_game_chels_contest, ' + // Выбор игроков (соревнование)
                '.free_game_chels, ' +          // Выбор игроков (свободная игра)
                '.contest_game_btn, ' +         // Случайный уровень
                '.arrow_back, ' +               // Стрелка назад
                '.levels_block, ' +             // Плитки уровней
                '.sound_btn_wrap, ' +           // Звук
                '.pause_btn_wrap, ' +           // Пауза
                '.lang-toggle, ' +              // Язык
                '.auth_btn, ' +                 // Кнопка входа
                '.small_btn'                    // Мелкие ссылки
            );

            // Если нажали НЕ на кнопку — блокируем (меню не вылезет)
            if (!isInteractive) {
                e.preventDefault();
            }
            // Если нажали НА кнопку — ничего не делаем, сработает стандартный click из menu.js
        }, { passive: false });
    }
}











export function groupArrayToMask(groupsArray) {
    // Например, [0, 2, 3] → 0b1101 = 13
    return groupsArray.reduce((mask, groupNum) => mask | (1 << groupNum), 0);
}

export function makeCollisionMaskFromArrays(membershipGroups, filterGroups) {
    const membership = groupArrayToMask(membershipGroups);
    const filter = groupArrayToMask(filterGroups);
    const mask = ((membership & 0xFFFF) << 16) | (filter & 0xFFFF);
    return '0x' + mask.toString(16).padStart(8, '0');
}

export function getObjectGroupInfo(collider) {
    // Получаем 32-битное число групп
    const collisionGroups = collider.collisionGroups();
    // Старшие 16 бит — membership, младшие 16 бит — filter
    const membershipMask = (collisionGroups >>> 16) & 0xFFFF;
    const filterMask = collisionGroups & 0xFFFF;

    function maskToGroupArray(mask) {
        const groups = [];
        for (let i = 0; i < 16; i++) {
            if (mask & (1 << i)) groups.push(i);
        }
        return groups;
    }

    return [maskToGroupArray(membershipMask), maskToGroupArray(filterMask)];
}



// number | {x,y,z} | THREE.Vector3 -> THREE.Vector3
function toVec3(v) {
    if (typeof v === "number") return new THREE.Vector3(v, v, v);
    if (v?.isVector3) return v;
    return new THREE.Vector3(v?.x ?? 1, v?.y ?? 1, v?.z ?? 1);
}

// берём некий идентификатор, чтобы можно было игнорить "самого себя"
function getAnyId(x) {
    return x?.userData?.id ?? x?.uuid ?? x?.id;
}

// AABB для любого источника:
// - THREE.Object3D: из geometry.boundingBox (или setFromObject как fallback)
// - Наш элемент: из size/rotation/quaternion/position (через матрицу)
const _unitBox = new THREE.Box3(
    new THREE.Vector3(-0.5, -0.5, -0.5),
    new THREE.Vector3(0.5, 0.5, 0.5)
);
const _mat = new THREE.Matrix4();
const _quat = new THREE.Quaternion();

function getAABB(src) {
    if (src?.isObject3D) {
        // Обновим матрицы и попробуем быстрый путь
        src.updateMatrixWorld(true);
        if (src.geometry?.isBufferGeometry) {
            const geom = src.geometry;
            if (!geom.boundingBox) geom.computeBoundingBox();
            if (geom.boundingBox) {
                const box = geom.boundingBox.clone();
                box.applyMatrix4(src.matrixWorld);
                return box;
            }
        }
        // Надёжный (чуть медленнее) fallback: по всему сабграфу
        return new THREE.Box3().setFromObject(src);
    }

    // Наш «данный» элемент
    const pos = src.position ?? src.pos ?? new THREE.Vector3();
    const size = toVec3(src.size ?? 1);
    const quat = src.quaternion?.isQuaternion
        ? src.quaternion
        : (src.rotation?.isEuler
            ? _quat.setFromEuler(src.rotation)
            : _quat.set(0, 0, 0, 1));

    _mat.compose(pos, quat, size);
    return _unitBox.clone().applyMatrix4(_mat); // AABB вращённого бокса в мире
}

/**
 * Проверка пересечения object1OrItem и элементов массива array.
 * Возвращает первый пересекающийся элемент массива или null.
 * Поддерживает элементы как THREE.Object3D, так и «наши» объекты-данные.
 */
export function detectCollisionCubeAndArrayInst(object1OrItem, array) {
    const box1 = getAABB(object1OrItem);
    const id1 = getAnyId(object1OrItem);

    // идём как в твоём коде — с конца к началу, чтобы совпадало по поведению
    for (let i = array.length - 1; i >= 0; i--) {
        const it = array[i];
        // пропускаем "самого себя", если id совпадает
        const id2 = getAnyId(it);
        if (id1 !== undefined && id2 !== undefined && id1 === id2) continue;

        const box2 = getAABB(it);
        if (box2.intersectsBox(box1)) {
            return it; // нашли первый пересекающийся
        }
    }
    return null;
}


export function disposeScene(scene) {
    // 1) Диспозим только непостоянные
    scene.traverse((object) => {
        if (object.userData?.persistent) return; // оставляем живым

        if (object.geometry) object.geometry.dispose();

        if (object.material) {
            if (Array.isArray(object.material)) object.material.forEach((m) => m.dispose());
            else object.material.dispose();
        }
        if (object.material && object.material.map) object.material.map.dispose();
    });

    // 2) Удаляем только непостоянных детей из корня
    const toRemove = [];
    for (const child of scene.children) {
        if (!child.userData?.persistent) toRemove.push(child);
    }
    toRemove.forEach((child) => scene.remove(child));
}

// Lightweight water splash particle system for Three.js
// Standalone, pool-based, ~0 allocations per frame after init.
// You handle WHEN to trigger it (e.g., on duck-water collision).
//
// Usage:
//   const splash = createSplashSystem({ scene });
//   // on hit:
//   splash.trigger(new THREE.Vector3(x,y,z), /*strength*/ 1.0);
//   // every frame:
//   splash.update(dt); // dt in seconds
//
// Options:
//   createSplashSystem({
//     scene,                // required
//     maxParticles = 800,   // pool size
//     gravity = -9.8,       // m/s^2 (negative down)
//     drag = 2.0,           // air/water drag
//     texture = null,       // optional THREE.Texture; if null a soft circle is generated
//     pointSize = 0.06,     // world size of particles
//     blending = THREE.NormalBlending // or THREE.AdditiveBlending for brighter splashes
//   })
//
// API:
//   splash.trigger(position, strength=1, opts?)
//     opts = {
//       count: 42,          // number of particles in burst (scaled by strength)
//       spread: 0.35,       // horizontal spread radius
//       up: 3.0,            // upward velocity scale
//       horiz: 2.2,         // horizontal velocity scale
//       ttl: [0.35, 0.8],   // lifetime range in seconds
//       sizeJitter: 0.5     // randomize size up to +/-50%
//     }
//   splash.update(dt)
//   splash.dispose()

export function createSplashSystem({
    scene,
    maxParticles = 800,
    gravity = -7.8,
    drag = 2.0,
    texture = null,
    pointSize = 0.66,
    blending = THREE.NormalBlending,
} = {}) {
    if (!scene) throw new Error('createSplashSystem: scene is required');

    // --- Helpers ---
    function makeCircleTexture() {
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');
        const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, size, size);
        const tex = new THREE.CanvasTexture(canvas);
        tex.anisotropy = 1;
        tex.needsUpdate = true;
        return tex;
    }

    const tex = texture || makeCircleTexture();

    // --- Buffers ---
    const positions = new Float32Array(maxParticles * 3);
    const velocities = new Float32Array(maxParticles * 3);
    const lifetimes = new Float32Array(maxParticles); // how long it should live
    const ages = new Float32Array(maxParticles);      // current age
    const sizes = new Float32Array(maxParticles);     // base size per particle
    const alive = new Uint8Array(maxParticles);       // 0/1

    // --- Geometry & Material ---
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));


    const material = new THREE.PointsMaterial({
        map: tex,
        size: pointSize,
        transparent: true,
        depthWrite: false,
        blending,
        vertexColors: false,
        sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    points.userData.persistent = true;
    points.frustumCulled = false;
    points.position.set(0, -20, 0);
    scene.add(points);

    // --- Pool management ---
    let firstFree = 0; // naive pointer for linear search; cheap enough for < few thousand

    function alloc() {
        for (let i = 0; i < maxParticles; i++) {
            const idx = (firstFree + i) % maxParticles;
            if (!alive[idx]) { firstFree = (idx + 1) % maxParticles; return idx; }
        }
        return -1; // pool exhausted; silently drop
    }

    function setVec(arr, i, x, y, z) {
        const o = i * 3; arr[o] = x; arr[o + 1] = y; arr[o + 2] = z;
    }

    // --- Public API ---
    const api = {
        trigger(pos, strength = 1, opts = {}) {
            const {
                count = 42,
                spread = 0.35,
                up = 3.0,
                horiz = 2.2,
                ttl = [0.35, 0.8],
                sizeJitter = 0.5,
            } = opts;

            const n = Math.max(1, Math.floor(count * strength));
            for (let k = 0; k < n; k++) {
                const i = alloc();
                if (i === -1) break;
                // Random point in disk for emission origin
                const r = Math.sqrt(Math.random()) * spread;
                const theta = Math.random() * Math.PI * 2;
                const ox = r * Math.cos(theta);
                const oz = r * Math.sin(theta);

                // Velocity: strong upward + radial
                const vr = Math.sqrt(Math.random());
                const vx = Math.cos(theta) * horiz * vr * (0.6 + 0.4 * Math.random());
                const vz = Math.sin(theta) * horiz * vr * (0.6 + 0.4 * Math.random());
                const vy = up * (0.6 + 0.4 * Math.random());

                const life = ttl[0] + Math.random() * (ttl[1] - ttl[0]);
                const s = (1 - sizeJitter / 2 + Math.random() * sizeJitter) * 1.0;

                setVec(positions, i, pos.x + ox, pos.y, pos.z + oz);
                setVec(velocities, i, vx * strength, vy * strength, vz * strength);
                lifetimes[i] = life;
                ages[i] = 0;
                sizes[i] = s;
                alive[i] = 1;
            }
            geometry.attributes.position.needsUpdate = true;
            geometry.attributes.aSize.needsUpdate = true;
        },

        update(dt) {
            if (dt <= 0) return;
            const g = gravity; // negative down
            const d = Math.max(0, drag);

            let any = false;
            for (let i = 0; i < maxParticles; i++) {
                if (!alive[i]) continue;
                any = true;
                ages[i] += dt;
                if (ages[i] >= lifetimes[i]) {
                    alive[i] = 0;
                    // hide dead particle cheaply by moving it far away
                    const oo = i * 3; positions[oo] = 1e9; positions[oo + 1] = 1e9; positions[oo + 2] = 1e9;
                    continue;
                }
                // integrate simple physics with linear drag
                const o = i * 3;
                // gravity
                velocities[o + 1] += g * dt;
                // drag towards zero
                const vx = velocities[o];
                const vy = velocities[o + 1];
                const vz = velocities[o + 2];
                const dragFactor = Math.max(0, 1 - d * dt);
                velocities[o] = vx * dragFactor;
                velocities[o + 1] = vy * dragFactor;
                velocities[o + 2] = vz * dragFactor;
                // position update
                positions[o] += velocities[o] * dt;
                positions[o + 1] += velocities[o + 1] * dt;
                positions[o + 2] += velocities[o + 2] * dt;
            }
            if (any) {
                geometry.attributes.position.needsUpdate = true;
            }
            // Fade size over life by tweaking material size (cheap, global):
            // Compute average normalized remaining life for a simple fade.
            // (We avoid per-particle alpha to keep PointsMaterial cheap.)
            let aliveCount = 0, sumFrac = 0;
            for (let i = 0; i < maxParticles; i++) if (alive[i]) { aliveCount++; sumFrac += (1 - ages[i] / lifetimes[i]); }
            const fade = aliveCount ? (0.25 + 0.75 * (sumFrac / aliveCount)) : 1.0;
            material.size = pointSize * fade;
        },

        get object3D() { return points; },

        dispose() {
            scene.remove(points);
            geometry.dispose();
            material.dispose();
            if (!texture) tex.dispose();
        }
    };

    return api;
}

// (Optional) Simple circular ripple ring for water surface (ultra cheap)
// Drawn as a single expanding billboard; call ring.trigger(pos) when needed.
export function createRippleRing({ scene, size = 1.5, ttl = 0.9 } = {}) {
    const geom = new THREE.PlaneGeometry(1, 1);
    const tex = (() => {
        const c = document.createElement('canvas'); c.width = c.height = 64; const ctx = c.getContext('2d');
        ctx.clearRect(0, 0, 64, 64);
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(32, 32, 20, 0, Math.PI * 2); ctx.stroke();
        return new THREE.CanvasTexture(c);
    })();
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.visible = false;
    mesh.userData.persistent = true;
    scene.add(mesh);

    let age = 0, alive = false; const start = new THREE.Vector3();
    function trigger(pos) { start.copy(pos); age = 0; alive = true; mesh.visible = true; }
    function update(dt, camera) {
        if (!alive) return;
        age += dt; if (age >= ttl) { alive = false; mesh.visible = false; return; }
        // face upward (assumes water plane is XZ)
        mesh.position.set(start.x, start.y + 0.01, start.z);
        mesh.rotation.set(-Math.PI / 2, 0, 0);
        const t = age / ttl; const s = size * (1 + 1.6 * t);
        mesh.scale.setScalar(s);
        mat.opacity = 1 - t;
    }
    function dispose() { scene.remove(mesh); geom.dispose(); mat.dispose(); tex.dispose(); }
    return { trigger, update, dispose, mesh };
}

export function prewarmSkinnedModel(model, renderer, camera, scene) {
    if (!model) return;

    // Сохраняем состояние
    const savedState = {
        position: model.position.clone(),
        quaternion: model.quaternion.clone(),
    };
    const savedMeshFlags = [];
    model.traverse((object3d) => {
        if (object3d.isMesh || object3d.isSkinnedMesh) {
            savedMeshFlags.push({
                object3d,
                frustumCulled: object3d.frustumCulled,
                visible: object3d.visible,
                castShadow: object3d.castShadow,
                receiveShadow: object3d.receiveShadow,
            });
        }
    });

    // Временно отключаем тени на всём рендерере (важно: не трогаем autoUpdate)
    const savedRendererShadowsEnabled = renderer.shadowMap?.enabled ?? false;
    if (renderer.shadowMap) renderer.shadowMap.enabled = false;

    // Делаем меши гарантированно видимыми и без теней на время прогрева
    savedMeshFlags.forEach(({ object3d }) => {
        object3d.frustumCulled = false;
        object3d.visible = true;
        object3d.castShadow = false;     // ← ключ к отсутствию «мигания» после прогрева
    });

    // Ставим модель в фрустум камеры (перед ней на пару метров)
    const forward = camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(2.5);
    const prewarmPosition = camera.position.clone().add(forward);
    prewarmPosition.z = camera.position.z - 1.5;
    model.position.copy(prewarmPosition);
    model.updateMatrixWorld(true);

    // Чуть «шевельнём» скиннинг, чтобы прогрелся шейдер пути skinning
    if (model.userData?.mixer) model.userData.mixer.update(1 / 60);

    // Компиляция шейдеров
    renderer.compile(scene, camera);

    // Один крошечный кадр в 1×1 RT БЕЗ теней
    const previousTarget = renderer.getRenderTarget();
    const tmpTarget = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false, stencilBuffer: false });
    renderer.setRenderTarget(tmpTarget);
    renderer.render(scene, camera);
    renderer.setRenderTarget(previousTarget);
    tmpTarget.dispose();

    // Возвращаем модель на место и восстанавливаем флаги
    model.position.copy(savedState.position);
    model.quaternion.copy(savedState.quaternion);
    savedMeshFlags.forEach(({ object3d, frustumCulled, visible, castShadow, receiveShadow }) => {
        object3d.frustumCulled = frustumCulled;
        object3d.visible = visible;
        object3d.castShadow = castShadow;
        object3d.receiveShadow = receiveShadow;
    });

    // Включаем тени обратно ровно в том состоянии, как были
    if (renderer.shadowMap) renderer.shadowMap.enabled = savedRendererShadowsEnabled;
}



// Прогреть “клиппинг-варианты” материалов (как при рендере отражения воды)
export function prewarmClippingVariantsForVisibleMaterials(renderer, scene, camera) {
    const prevLocal = renderer.localClippingEnabled;
    const prevPlanes = renderer.clippingPlanes ? renderer.clippingPlanes.slice() : [];

    // Включаем локальный клиппинг и задаём глобальную “безвредную” плоскость,
    // чтобы у материалов действительно включился #define USE_CLIPPING.
    renderer.localClippingEnabled = true;
    renderer.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, 1, 0), -1e9)]; // далеко ниже сцены

    // Компилируем шейдеры для всех видимых сейчас объектов
    renderer.compile(scene, camera);

    // Откат
    renderer.clippingPlanes = prevPlanes;
    renderer.localClippingEnabled = prevLocal;
}

// Прогреть сам отражательный проход Water без влияния на экран и тени
export function prewarmWaterReflection(water, renderer, scene, camera) {
    if (!water) return;

    const prevRT = renderer.getRenderTarget();
    const hadShadow = !!renderer.shadowMap;
    const prevShadowAuto = hadShadow ? renderer.shadowMap.autoUpdate : false;

    if (hadShadow) renderer.shadowMap.autoUpdate = false;

    // ВАЖНО: нам нужно, чтобы у воды сработал onBeforeRender → он рисует отражение в свой RT.
    const wasVisible = water.visible;
    water.visible = true;

    // Рендерим один кадр в крошечный RT, чтобы ничего не “мигнуло” на экране.
    const tmp = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false, stencilBuffer: false });
    renderer.setRenderTarget(tmp);
    renderer.render(scene, camera);
    renderer.setRenderTarget(prevRT);
    tmp.dispose();

    // Откат состояний
    water.visible = wasVisible;
    if (hadShadow) {
        renderer.shadowMap.autoUpdate = prevShadowAuto;
        renderer.shadowMap.needsUpdate = true; // корректная пересборка на следующем кадре
    }
}
