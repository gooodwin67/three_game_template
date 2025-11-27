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
