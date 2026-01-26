let scene, camera, renderer, controls;
let planes = [], cutPoints = [], cutMarkers = [], capMeshes = [], planesFlipped = [], currentCutIndex = 0;
const MAX_CUTS = 8;
let currentMesh, wireMesh, currentGeo, currentEdgesGeo;
let snapGroup = new THREE.Group();
let markerGroup = new THREE.Group();
let openDropdown = null;
let curDiv = 1;
let showWire = true;
let snapMode = 0; // 0:全表示, 1:選択のみ, 2:全非表示
let isDragging = false;
let draggedMarker = null;
let draggedEdgeIds = [];
let dragStartIndex = -1;
let dragStartTime = 0;
let dragStartPos = new THREE.Vector2();

const CUT_COLORS = [0xff0000, 0x008000, 0x0000ff, 0xff8c00, 0x800080, 0x00ced1, 0xff00ff, 0x133b8b];

function toggleDropdown(id) {
    const panel = document.getElementById(id);
    if (openDropdown && openDropdown !== panel) openDropdown.classList.remove('open');
    panel.classList.toggle('open');
    openDropdown = panel.classList.contains('open') ? panel : null;
}
function closeAll() { if (openDropdown) { openDropdown.classList.remove('open'); openDropdown = null; } }

function setShapeUI(type) {
    document.querySelectorAll('#panel-shape .grid-btn').forEach(b => b.classList.remove('active'));
    setShape(type);
    document.getElementById('cube-params').classList.toggle('show', type === 'cube');
    document.getElementById('box-params').classList.toggle('show', type === 'box');
    if (type !== 'cube' && type !== 'box') closeAll();
}

function setDivisionUI(div) { curDiv = div; setDivision(div); closeAll(); }

function stepParam(id, delta, type) {
    const el = document.getElementById(id);
    let val = parseFloat(el.value) + delta;
    if (val < 1) val = 1;
    if (id === 'inp-cube-s') {
        if (val < 2) val = 2;
        if (val > 12) val = 12;
    }
    el.value = val;
    setShape(type);
}

function init() {
    scene = new THREE.Scene(); scene.background = new THREE.Color(0xfdfcf5);
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(20, 20, 26);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.localClippingEnabled = true;
    document.body.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    // 表示位置の修正：原点(0,0,0)をターゲットにする
    controls.target.set(0, 0, 0);

    const ambientLight = new THREE.AmbientLight(0x808080); scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8); dirLight.position.set(10, 20, 10); scene.add(dirLight);

    for (let i = 0; i < MAX_CUTS; i++) {
        planes.push(new THREE.Plane(new THREE.Vector3(0, -1, 0), 10000));
        cutPoints.push([]); cutMarkers.push([]); capMeshes.push(null);
        planesFlipped.push(false);
    }
    scene.add(snapGroup);
    scene.add(markerGroup);
    setShape('cube'); animate();
}

function setShape(type) {
    resetAllInternal();
    if (currentMesh) scene.remove(currentMesh, wireMesh);
    let geo, edgeGeo;
    if (type === 'cube') {
        const s = parseFloat(document.getElementById('inp-cube-s').value);
        geo = new THREE.BoxGeometry(s, s, s);
        edgeGeo = new THREE.EdgesGeometry(geo);
    } else if (type === 'box') {
        geo = new THREE.BoxGeometry(parseFloat(document.getElementById('inp-w').value), parseFloat(document.getElementById('inp-h').value), parseFloat(document.getElementById('inp-d').value));
        edgeGeo = new THREE.EdgesGeometry(geo);
    } else if (type === 'sphere') {
        geo = new THREE.SphereGeometry(6, 48, 48);
        edgeGeo = new THREE.EdgesGeometry(new THREE.SphereGeometry(6, 12, 10));
    } else if (type === 'prism-3') {
        geo = new THREE.CylinderGeometry(5, 5, 9, 3); edgeGeo = new THREE.EdgesGeometry(geo);
    } else if (type === 'prism-5') {
        geo = new THREE.CylinderGeometry(5, 5, 9, 5); edgeGeo = new THREE.EdgesGeometry(geo);
    } else if (type === 'prism-6') {
        geo = new THREE.CylinderGeometry(5, 5, 9, 6); edgeGeo = new THREE.EdgesGeometry(geo);
    } else if (type === 'cylinder') {
        geo = new THREE.CylinderGeometry(4, 4, 9, 32); edgeGeo = new THREE.EdgesGeometry(new THREE.CylinderGeometry(4, 4, 9, 12));
    } else if (type === 'pyramid-3') {
        geo = new THREE.ConeGeometry(6, 9, 3); edgeGeo = new THREE.EdgesGeometry(geo);
    } else if (type === 'pyramid-4') {
        geo = new THREE.ConeGeometry(6, 9, 4); edgeGeo = new THREE.EdgesGeometry(geo);
    } else if (type === 'pyramid-5') {
        geo = new THREE.ConeGeometry(6, 9, 5); edgeGeo = new THREE.EdgesGeometry(geo);
    } else if (type === 'pyramid-6') {
        geo = new THREE.ConeGeometry(6, 9, 6); edgeGeo = new THREE.EdgesGeometry(geo);
    } else if (type === 'cone') {
        geo = new THREE.ConeGeometry(6, 9, 32); edgeGeo = new THREE.EdgesGeometry(new THREE.ConeGeometry(6, 9, 12));
    } else if (type === 'poly-4') {
        geo = new THREE.TetrahedronGeometry(6); edgeGeo = new THREE.EdgesGeometry(geo);
    } else if (type === 'poly-8') {
        geo = new THREE.OctahedronGeometry(6); edgeGeo = new THREE.EdgesGeometry(geo);
    } else if (type === 'poly-12') {
        geo = new THREE.DodecahedronGeometry(6); edgeGeo = new THREE.EdgesGeometry(geo);
    } else if (type === 'poly-20') {
        geo = new THREE.IcosahedronGeometry(6); edgeGeo = new THREE.EdgesGeometry(geo);
    } else {
        geo = new THREE.BoxGeometry(6, 6, 6); edgeGeo = new THREE.EdgesGeometry(geo);
    }

    // 表示位置の修正：translate(3,0,0)を削除して中央配置
    currentGeo = geo; currentEdgesGeo = edgeGeo;
    currentMesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ color: 0xa8d5e2, side: THREE.DoubleSide, clippingPlanes: planes, clipShadows: true }));
    wireMesh = new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: 0x222222, opacity: 0.4, transparent: true }));
    scene.add(currentMesh, wireMesh);
    wireMesh.visible = showWire; // 現在の表示設定を適用
    setDivision(curDiv);
}

const isTouchDevice = () => ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

function setDivision(div) {
    snapGroup.clear();
    const snapSize = isTouchDevice() ? 0.45 : 0.2;
    const dotMat = new THREE.MeshBasicMaterial({ color: 0x555555, opacity: 0.4, transparent: true });

    // 1. 各頂点（角）のスナップ点を作成
    const posAttr = currentEdgesGeo ? currentEdgesGeo.attributes.position : currentMesh.geometry.attributes.position;
    const vertexMap = {};
    for (let i = 0; i < posAttr.count; i++) {
        const v = new THREE.Vector3().fromBufferAttribute(posAttr, i);
        // 角柱/円柱の中心点を排除
        const isPyramidApex = currentGeo.type === "ConeGeometry" && Math.abs(v.y - 4.5) < 0.01 && Math.abs(v.x - 0) < 0.01;
        const isOctahedron = currentGeo.type === 'OctahedronGeometry';
        const isSphere = currentGeo.type === 'SphereGeometry';
        const isCenterPoint = !isPyramidApex && !isOctahedron && !isSphere && Math.abs(v.x - 0) < 0.01 && Math.abs(v.z - 0) < 0.01;
        if (isCenterPoint) continue;

        const key = `${v.x.toFixed(3)},${v.y.toFixed(3)},${v.z.toFixed(3)}`;
        if (!vertexMap[key]) {
            const dot = new THREE.Mesh(new THREE.SphereGeometry(snapSize), dotMat);
            dot.position.copy(v);
            dot.userData.edgeIds = []; // 複数のエッジに所属可能
            vertexMap[key] = dot;
            snapGroup.add(dot);
        }
    }

    // 2. 各エッジについて等分点を作成し、端点も含めて edgeIds を割り振る
    if (currentEdgesGeo) {
        const attr = currentEdgesGeo.attributes.position;
        for (let i = 0; i < attr.count; i += 2) {
            const v1 = new THREE.Vector3().fromBufferAttribute(attr, i);
            const v2 = new THREE.Vector3().fromBufferAttribute(attr, i + 1);
            const key1 = `${v1.x.toFixed(3)},${v1.y.toFixed(3)},${v1.z.toFixed(3)}`;
            const key2 = `${v2.x.toFixed(3)},${v2.y.toFixed(3)},${v2.z.toFixed(3)}`;
            const edgeId = `e_${i}`;

            // 端点にエッジIDを追加
            if (vertexMap[key1]) vertexMap[key1].userData.edgeIds.push(edgeId);
            if (vertexMap[key2]) vertexMap[key2].userData.edgeIds.push(edgeId);

            // 等分点の作成
            if (div > 1) {
                for (let j = 1; j < div; j++) {
                    const dot = new THREE.Mesh(new THREE.SphereGeometry(snapSize), dotMat);
                    dot.position.lerpVectors(v1, v2, j / div);
                    dot.userData.edgeIds = [edgeId];
                    snapGroup.add(dot);
                }
            }
        }
    }
}

function calculateIntersectionPointsAndCreateCap(plane, idx) {
    const pts = []; const attr = currentEdgesGeo.attributes.position;
    for (let i = 0; i < attr.count; i += 2) {
        const v1 = new THREE.Vector3().fromBufferAttribute(attr, i), v2 = new THREE.Vector3().fromBufferAttribute(attr, i + 1);
        const line = new THREE.Line3(v1, v2); const target = new THREE.Vector3();
        if (plane.intersectLine(line, target)) if (!pts.some(p => p.distanceTo(target) < 0.01)) pts.push(target.clone());
    }
    if (capMeshes[idx]) scene.remove(capMeshes[idx]);
    if (pts.length >= 3) {
        const center = new THREE.Vector3(); pts.forEach(p => center.add(p)); center.divideScalar(pts.length);
        const normal = plane.normal.clone(); let ref = new THREE.Vector3(0, 1, 0); if (Math.abs(normal.dot(ref)) > 0.9) ref.set(1, 0, 0);
        const xDir = ref.cross(normal).normalize(), yDir = normal.clone().cross(xDir).normalize();
        pts.sort((a, b) => Math.atan2(a.clone().sub(center).dot(yDir), a.clone().sub(center).dot(xDir)) - Math.atan2(b.clone().sub(center).dot(yDir), b.clone().sub(center).dot(xDir)));
        const shape = new THREE.Shape(pts.map(p => new THREE.Vector2(p.clone().sub(center).dot(xDir), p.clone().sub(center).dot(yDir))));
        const cap = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshPhongMaterial({
            color: CUT_COLORS[idx],
            side: THREE.DoubleSide,
            opacity: 0.6,
            transparent: true,
            clippingPlanes: planes.filter((_, i) => i !== idx),
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1
        }));
        const m = new THREE.Matrix4().makeBasis(xDir, yDir, normal); cap.applyMatrix4(m); cap.position.copy(center);
        capMeshes[idx] = cap; scene.add(cap);
    }
}

const raycaster = new THREE.Raycaster(), mouse = new THREE.Vector2();
if (isTouchDevice()) { raycaster.params.Points.threshold = 1.5; }

/**
 * レイキャストだけでなく、レイからの距離ベースで最も近いオブジェクトを探す
 */
function findClosestObject(caster, objects, threshold = 0.6) {
    const hits = caster.intersectObjects(objects);
    if (hits.length > 0) return hits[0].object;

    let closest = null;
    let minDist = threshold;
    const ray = caster.ray;
    for (const obj of objects) {
        const d = ray.distanceToPoint(obj.position);
        if (d < minDist) {
            minDist = d;
            closest = obj;
        }
    }
    return closest;
}

window.addEventListener('pointerdown', (e) => {
    if (e.target.closest('#top-nav') || e.target.closest('#app-header')) return;
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1; mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    // 1. 既存マーカーのクリック判定（解除 or ドラッグ開始）
    const hitMarker = findClosestObject(raycaster, markerGroup.children, 0.8);
    if (hitMarker) {
        const idx = cutMarkers[currentCutIndex].indexOf(hitMarker);
        if (idx !== -1) {
            isDragging = true;
            draggedMarker = hitMarker;
            dragStartIndex = idx;
            draggedEdgeIds = hitMarker.userData.edgeIds || [];
            dragStartTime = Date.now();
            dragStartPos.copy(mouse);
            controls.enabled = false;
            return;
        }
    }

    // 2. 新規スナップ点のクリック判定
    const hitSnap = findClosestObject(raycaster, snapGroup.children, 0.6);
    if (hitSnap) {
        const p = hitSnap.position.clone(); if (cutPoints[currentCutIndex].length >= 3) return;
        cutPoints[currentCutIndex].push(p);
        const markerSize = isTouchDevice() ? 0.5 : 0.35;
        const m = new THREE.Mesh(new THREE.SphereGeometry(markerSize, 12, 10), new THREE.MeshBasicMaterial({ color: CUT_COLORS[currentCutIndex] }));
        m.position.copy(p);
        m.userData.edgeIds = [...(hitSnap.userData.edgeIds || [])]; // エッジ情報を引き継ぐ
        m.renderOrder = 999; markerGroup.add(m); cutMarkers[currentCutIndex].push(m);
        updateUI(); if (cutPoints[currentCutIndex].length === 3) applyCut();
    }
});

window.addEventListener('pointermove', (e) => {
    if (!isDragging || !draggedMarker) return;

    mouse.x = (e.clientX / window.innerWidth) * 2 - 1; mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    // 同じエッジ（または連結しているエッジ）上のスナップ点のみを判定対象にする
    const relevantSnaps = snapGroup.children.filter(s =>
        (s.userData.edgeIds || []).some(id => draggedEdgeIds.includes(id))
    );

    // ドラッグ中はより広い判定範囲(1.2)にする
    const hitSnap = findClosestObject(raycaster, relevantSnaps, 1.2);

    if (hitSnap) {
        const newPos = hitSnap.position.clone();
        draggedMarker.position.copy(newPos);
        draggedMarker.userData.edgeIds = [...(hitSnap.userData.edgeIds || [])]; // 移動先のエッジ情報を更新
        cutPoints[currentCutIndex][dragStartIndex].copy(newPos);

        if (cutPoints[currentCutIndex].length === 3) {
            applyCut();
        }
    }
});

window.addEventListener('pointerup', (e) => {
    if (isDragging) {
        const dragDuration = Date.now() - dragStartTime;
        const dragDistance = mouse.distanceTo(dragStartPos);

        // 短いクリックかつ移動が少なければ「削除（解除）」とみなす
        if (dragDuration < 300 && dragDistance < 0.05) {
            markerGroup.remove(draggedMarker);
            cutMarkers[currentCutIndex].splice(dragStartIndex, 1);
            cutPoints[currentCutIndex].splice(dragStartIndex, 1);

            // 3点揃っていた場合は切断を解除（平面リセット）
            planes[currentCutIndex].setComponents(0, -1, 0, 10000);
            if (capMeshes[currentCutIndex]) {
                scene.remove(capMeshes[currentCutIndex]);
                capMeshes[currentCutIndex] = null;
            }
            updateUI();
        }

        isDragging = false;
        draggedMarker = null;
        draggedEdgeIds = [];
        dragStartIndex = -1;
        controls.enabled = true;
    }
});

function applyCut() {
    const p = cutPoints[currentCutIndex];
    // 同一直線上チェック
    const v1 = new THREE.Vector3().subVectors(p[1], p[0]);
    const v2 = new THREE.Vector3().subVectors(p[2], p[0]);
    const cross = new THREE.Vector3().crossVectors(v1, v2);
    if (cross.length() < 0.0001) {
        resetCurrentCut();
        return;
    }
    planes[currentCutIndex].setFromCoplanarPoints(p[0], p[1], p[2]);
    if (planesFlipped[currentCutIndex]) {
        planes[currentCutIndex].normal.negate();
        planes[currentCutIndex].constant *= -1;
    }
    calculateIntersectionPointsAndCreateCap(planes[currentCutIndex], currentCutIndex);
    updateUI();
}
function updateUI() {
    const len = cutPoints[currentCutIndex].length; document.getElementById('status-box').innerText = `${len} / 3`;
    document.getElementById('btn-flip').style.display = (len === 3) ? 'block' : 'none';
    document.getElementById('btn-reset-single').style.display = (len > 0) ? 'block' : 'none';
    for (let i = 0; i < MAX_CUTS; i++) { const t = document.getElementById('tab-' + i); if (t) { t.classList.toggle('active', i === currentCutIndex); t.classList.toggle('has-cut', cutPoints[i].length === 3); } }
}
window.switchCutTab = (idx) => { currentCutIndex = idx; updateUI(); };
window.flipCurrentCut = () => {
    planesFlipped[currentCutIndex] = !planesFlipped[currentCutIndex];
    planes[currentCutIndex].normal.negate();
    planes[currentCutIndex].constant *= -1;
    calculateIntersectionPointsAndCreateCap(planes[currentCutIndex], currentCutIndex);
};
window.resetCurrentCut = () => {
    cutPoints[currentCutIndex] = []; cutMarkers[currentCutIndex].forEach(m => markerGroup.remove(m)); cutMarkers[currentCutIndex] = [];
    planes[currentCutIndex].setComponents(0, -1, 0, 10000);
    planesFlipped[currentCutIndex] = false;
    if (capMeshes[currentCutIndex]) scene.remove(capMeshes[currentCutIndex]);
    capMeshes[currentCutIndex] = null; updateUI();
};

window.toggleWireframe = () => {
    showWire = !showWire;
    if (wireMesh) wireMesh.visible = showWire;
    const btn = document.getElementById('btn-toggle-wire');
    btn.innerText = showWire ? "🕸️ 補助線：ON" : "🕸️ 補助線：OFF";
    btn.classList.toggle('active', showWire);
};

window.toggleSnapPoints = () => {
    snapMode = (snapMode + 1) % 3;
    const btn = document.getElementById('btn-toggle-snap');

    if (snapMode === 0) {
        // 全表示
        snapGroup.visible = true;
        markerGroup.visible = true;
        btn.innerText = "⚫ 点：全表示";
        btn.classList.add('active');
        btn.style.opacity = "1";
    } else if (snapMode === 1) {
        // 選択のみ
        snapGroup.visible = false;
        markerGroup.visible = true;
        btn.innerText = "⚫ 点：選択のみ";
        btn.classList.add('active');
        btn.style.opacity = "1"; // 色などで区別しても良いが一旦テキストのみ変更
    } else {
        // 全非表示
        snapGroup.visible = false;
        markerGroup.visible = false;
        btn.innerText = "⚫ 点：全非表示";
        btn.classList.remove('active');
        btn.style.opacity = "0.7";
    }
};

function resetAllInternal() { cutPoints.forEach((_, i) => { currentCutIndex = i; resetCurrentCut(); }); currentCutIndex = 0; updateUI(); }
window.resetAll = () => { resetAllInternal(); };
function animate() { requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); }
window.onload = () => {
    init();
};
window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });

/* ============================================================ */
/* PRO EDITION: 2D PROJECTION VIEWS (三面図 / 五面図) */
/* ============================================================ */

let projectionActive = false;
let projectionMode = 3; // 3 or 5
let projectionViews = {}; // top, front, right, left, back
const PROJECTION_VIEWS_BY_MODE = {
    3: ['top', 'front', 'right'],
    5: ['top', 'front', 'right', 'left', 'back']
};

function initProjectionView(viewKey, containerId) {
    const container = document.querySelector(`#${containerId} .projection-canvas-container`);
    const renderer_p = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer_p.setPixelRatio(window.devicePixelRatio);
    renderer_p.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer_p.domElement);

    // 直交カメラ (パースなし)
    const aspect = container.clientWidth / container.clientHeight;
    const d = 1.2;
    const camera_p = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 0.1, 100);

    // 投影図用の照明を追加 (暗い問題の解決)
    const p_light = new THREE.AmbientLight(0xffffff, 0.9);
    // 注意: 投影図は scene を共有しているため、ここでの追加は1回のみで共有されるべき。
    // しかし、独立したレンダラーで描画しているため、シーン全体を照らす。
    if (!scene.userData.projectionLightAdded) {
        scene.add(p_light);
        scene.userData.projectionLightAdded = true;
    }

    // カメラの向き設定
    if (viewKey === 'top') {
        camera_p.position.set(0, 10, 0);
        camera_p.lookAt(0, 0, 0);
        camera_p.up.set(0, 0, -1); // 上面図は下が正面
    } else if (viewKey === 'front') {
        camera_p.position.set(0, 0, 10);
        camera_p.lookAt(0, 0, 0);
    } else if (viewKey === 'right') {
        camera_p.position.set(10, 0, 0);
        camera_p.lookAt(0, 0, 0);
    } else if (viewKey === 'left') {
        camera_p.position.set(-10, 0, 0);
        camera_p.lookAt(0, 0, 0);
    } else if (viewKey === 'back') {
        camera_p.position.set(0, 0, -10);
        camera_p.lookAt(0, 0, 0);
    }

    projectionViews[viewKey] = { renderer: renderer_p, camera: camera_p, container };
}

window.openProjectionModal = () => {
    projectionActive = true;
    document.getElementById('projection-modal').style.display = 'flex';

    // 初回のみ初期化
    if (Object.keys(projectionViews).length === 0) {
        initProjectionView('top', 'view-top');
        initProjectionView('front', 'view-front');
        initProjectionView('right', 'view-right');
        initProjectionView('left', 'view-left');
        initProjectionView('back', 'view-back');
    }

    setProjectionMode(projectionMode);
    requestAnimationFrame(renderProjections);
};

window.closeProjectionModal = () => {
    projectionActive = false;
    document.getElementById('projection-modal').style.display = 'none';
};

window.setProjectionMode = (mode) => {
    projectionMode = mode;
    const grid = document.getElementById('projection-grid');

    document.getElementById('btn-mode-3').style.background = (mode === 3) ? '#4facfe' : 'rgba(255,255,255,0.1)';
    document.getElementById('btn-mode-5').style.background = (mode === 5) ? '#4facfe' : 'rgba(255,255,255,0.1)';

    const allKeys = ['top', 'front', 'right', 'left', 'back'];
    allKeys.forEach(key => {
        const view = document.getElementById(`view-${key}`);
        if (PROJECTION_VIEWS_BY_MODE[mode].includes(key)) {
            view.style.display = 'flex';
        } else {
            view.style.display = 'none';
        }
    });

    // リサイズ処理を挟んで表示を整える
    setTimeout(() => {
        Object.values(projectionViews).forEach(v => {
            const w = v.container.clientWidth;
            const h = v.container.clientHeight;
            v.renderer.setSize(w, h);

            // 正方形を維持するための計算 (重要)
            const d = 8; // 立体の大きさに合わせて調整
            if (w > h) {
                const aspect = w / h;
                v.camera.left = -d * aspect;
                v.camera.right = d * aspect;
                v.camera.top = d;
                v.camera.bottom = -d;
            } else {
                const aspect = h / w;
                v.camera.left = -d;
                v.camera.right = d;
                v.camera.top = d * aspect;
                v.camera.bottom = -d * aspect;
            }
            v.camera.updateProjectionMatrix();
        });
    }, 100);
};

function renderProjections() {
    if (!projectionActive) return;

    // メインシーンのオブジェクト（図形や断面）を投影用シーンに一時的に移動または同期
    // 今回は最も確実な「レンダリング直前に投影シーンにメインメッシュを追加」方式
    PROJECTION_VIEWS_BY_MODE[projectionMode].forEach(key => {
        const v = projectionViews[key];
        if (v) {
            // 図形と断面を投影シーンに追加
            v.p_scene.add(currentMesh);
            v.p_scene.add(wireMesh);
            capMeshes.forEach(cap => { if (cap) v.p_scene.add(cap); });

            v.renderer.render(v.p_scene, v.camera);

            // レンダリングが終わったらメインシーンに戻す
            scene.add(currentMesh);
            scene.add(wireMesh);
            capMeshes.forEach(cap => { if (cap) scene.add(cap); });
        }
    });

    requestAnimationFrame(renderProjections);
}
