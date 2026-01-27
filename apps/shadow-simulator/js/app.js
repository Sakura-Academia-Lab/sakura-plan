let scene, camera, renderer, labelRenderer, controls, dragControls;
let lightObj, pointLight, lightMarker, lightLine;
let objects = [];
let selectedObj = null;
let rayLines = new THREE.Group();
let boxHelper;
let raycaster = new THREE.Raycaster();

const defaultNames = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
let nameIndex = 0;

const canvas = document.getElementById('shadowCanvas');
const ctx = canvas.getContext('2d');
const CANVAS_SCALE = 10;
const CANVAS_OFFSET = canvas.width / 2;

function createGridTexture() {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = '#90a0b0';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return tex;
}

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe3e6e8);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(30, 25, 30);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    document.body.appendChild(renderer.domElement);

    labelRenderer = new THREE.CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none';
    document.body.appendChild(labelRenderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 0, 0);

    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshPhongMaterial({ color: 0xe3e6e8 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(100, 100, 0xb0b0b0, 0xd0d0d0);
    grid.position.y = 0.01;
    scene.add(grid);

    scene.add(new THREE.AmbientLight(0xffffff, 0.2));
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.2);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    pointLight = new THREE.PointLight(0xffffff, 3.0, 200);
    pointLight.castShadow = true;
    pointLight.shadow.mapSize.width = 2048;
    pointLight.shadow.mapSize.height = 2048;
    pointLight.shadow.bias = -0.0005;
    scene.add(pointLight);

    lightObj = new THREE.Mesh(new THREE.SphereGeometry(0.5), new THREE.MeshBasicMaterial({ color: 0xffff00 }));
    scene.add(lightObj);

    const axisSize = 100;
    const axisGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-axisSize, 0.02, 0), new THREE.Vector3(axisSize, 0.02, 0),
        new THREE.Vector3(0, 0.02, -axisSize), new THREE.Vector3(0, 0.02, axisSize)
    ]);
    const axisMat = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });
    lightMarker = new THREE.LineSegments(axisGeo, axisMat);
    scene.add(lightMarker);

    const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 10, 0)]);
    lightLine = new THREE.Line(lineGeo, new THREE.LineDashedMaterial({ color: 0xff0000, dashSize: 0.5, gapSize: 0.3 }));
    lightLine.computeLineDistances();
    scene.add(lightLine);

    scene.add(rayLines);

    toggleDecimalMode();
    addNewObject('plate');
    updateLight();
    animate();
}

// --- 視点変更 ---
window.setView = (view) => {
    controls.target.set(0, 0, 0);
    switch (view) {
        case 'top': camera.position.set(0, 50, 0); break;
        case 'home': camera.position.set(30, 25, 30); break;
    }
    controls.update();
}

// --- 物体操作 (以下ロジック継続) ---
function addNewObject(typeOverride) {
    const type = typeOverride || document.getElementById('add-type').value;
    let w = 4, h = 6, d = 0, col = 0xffffff;
    if (type === 'plate') { w = 4; h = 6; d = 0; }
    else if (type === 'cube') { w = 4; h = 4; d = 4; }
    else { w = 4; h = 8; d = 4; }

    const geo = new THREE.BoxGeometry(w, h, d);
    const gridTex = createGridTexture();
    gridTex.repeat.set(w, h || 1); // 1cmごとに繰り返す
    const mat = new THREE.MeshStandardMaterial({
        color: col,
        map: gridTex,
        roughness: 1.0,
        metalness: 0.0
    });
    const mesh = new THREE.Mesh(geo, mat);

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const edges = new THREE.EdgesGeometry(geo);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 }));
    mesh.add(line);
    mesh.userData.edgeLine = line;

    const char = defaultNames[nameIndex % defaultNames.length];
    const suffix = Math.floor(nameIndex / defaultNames.length);
    mesh.name = "物体" + char + (suffix > 0 ? suffix : "");
    nameIndex++;

    const div = document.createElement('div');
    div.className = 'label-tag';
    div.textContent = mesh.name;
    const label = new THREE.CSS2DObject(div);
    label.position.set(0, h / 2 + 1, 0);
    mesh.add(label);
    mesh.userData.label = label;

    const offset = Math.round((Math.random() - 0.5) * 4);
    let posX = 10 + offset;
    let posZ = -5 + offset;
    if (w % 2 !== 0) posX += 0.5;
    if (d % 2 !== 0 && d > 0.5) posZ += 0.5;

    mesh.position.set(posX, h / 2, posZ);
    mesh.userData.groundY = 0;

    scene.add(mesh);
    objects.push(mesh);

    selectObject(mesh);
    setupDragControls();
    updateAuxiliaryLines();
    calculateAreas();
}

function setupDragControls() {
    if (dragControls) dragControls.dispose();
    dragControls = new THREE.DragControls(objects, camera, renderer.domElement);

    dragControls.addEventListener('dragstart', (e) => {
        controls.enabled = false;
        selectObject(e.object);
    });

    dragControls.addEventListener('drag', (e) => {
        const obj = e.object;
        const w = obj.geometry.parameters.width;
        const d = obj.geometry.parameters.depth;
        const h = obj.geometry.parameters.height;
        const isSnap = document.getElementById('snap-grid').checked;
        const isDecimal = document.getElementById('decimal-mode').checked;

        if (isSnap && !isDecimal) {
            const offX = (w % 2 !== 0) ? 0.5 : 0;
            const offZ = (d % 2 !== 0 && d >= 1) ? 0.5 : 0;
            obj.position.x = Math.round(obj.position.x - offX) + offX;
            obj.position.z = Math.round(obj.position.z - offZ) + offZ;
        } else if (isSnap) {
            obj.position.x = Math.round(obj.position.x);
            obj.position.z = Math.round(obj.position.z);
        }

        obj.position.y = obj.userData.groundY + (h / 2);
        updateAuxiliaryLines();
        calculateAreas();
    });

    dragControls.addEventListener('dragend', () => controls.enabled = true);
}

function selectObject(mesh) {
    selectedObj = mesh;
    if (boxHelper) scene.remove(boxHelper);
    boxHelper = new THREE.BoxHelper(mesh, 0xff5252);
    scene.add(boxHelper);
    document.getElementById('obj-settings').classList.add('active');
    document.getElementById('obj-name').value = mesh.name;

    const p = mesh.geometry.parameters;
    document.getElementById('size-w').value = p.width;
    document.getElementById('range-w').value = p.width;
    document.getElementById('size-h').value = p.height;
    document.getElementById('range-h').value = p.height;
    document.getElementById('size-d').value = p.depth;
    document.getElementById('range-d').value = p.depth;
    document.getElementById('pos-y').value = mesh.userData.groundY;
    document.getElementById('range-y').value = mesh.userData.groundY;
}

function updateName() {
    if (!selectedObj) return;
    const newName = document.getElementById('obj-name').value;
    selectedObj.name = newName;
    if (selectedObj.userData.label) {
        selectedObj.userData.label.element.textContent = newName;
    }
    calculateAreas();
}

function deleteSelected() {
    if (!selectedObj) return;
    scene.remove(selectedObj);
    if (boxHelper) scene.remove(boxHelper);
    objects = objects.filter(o => o !== selectedObj);
    selectedObj = null;
    document.getElementById('obj-settings').classList.remove('active');
    setupDragControls();
    updateAuxiliaryLines();
    calculateAreas();
}

window.syncSize = (axis) => { document.getElementById('size-' + axis).value = document.getElementById('range-' + axis).value; updateSize(); };
window.syncPos = () => { document.getElementById('pos-y').value = document.getElementById('range-y').value; updatePos(); };

function updateSize() {
    if (!selectedObj) return;
    const w = parseFloat(document.getElementById('size-w').value);
    const h = parseFloat(document.getElementById('size-h').value);
    const d = parseFloat(document.getElementById('size-d').value);

    if (selectedObj.userData.edgeLine) selectedObj.remove(selectedObj.userData.edgeLine);
    selectedObj.geometry.dispose();
    selectedObj.geometry = new THREE.BoxGeometry(w, h, d);

    if (selectedObj.material.map) {
        selectedObj.material.map.repeat.set(w, h || 1);
        selectedObj.material.map.needsUpdate = true;
    }

    const edges = new THREE.EdgesGeometry(selectedObj.geometry);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 }));
    selectedObj.add(line);
    selectedObj.userData.edgeLine = line;

    if (selectedObj.userData.label) selectedObj.userData.label.position.set(0, h / 2 + 1, 0);

    const isSnap = document.getElementById('snap-grid').checked;
    const isDecimal = document.getElementById('decimal-mode').checked;
    if (isSnap && !isDecimal) {
        const offX = (w % 2 !== 0) ? 0.5 : 0;
        const offZ = (d % 2 !== 0 && d >= 1) ? 0.5 : 0;
        selectedObj.position.x = Math.round(selectedObj.position.x - offX) + offX;
        selectedObj.position.z = Math.round(selectedObj.position.z - offZ) + offZ;
    }
    selectedObj.position.y = selectedObj.userData.groundY + (h / 2);
    if (boxHelper) boxHelper.update();
    updateAuxiliaryLines();
    calculateAreas();
}

function updatePos() {
    if (!selectedObj) return;
    const y = parseFloat(document.getElementById('pos-y').value);
    selectedObj.userData.groundY = y;
    const h = selectedObj.geometry.parameters.height;
    selectedObj.position.y = y + (h / 2);
    if (boxHelper) boxHelper.update();
    updateAuxiliaryLines();
    calculateAreas();
}

function updateLight(fromRange) {
    if (fromRange) {
        document.getElementById('light-h').value = document.getElementById('range-l').value;
        document.getElementById('light-x').value = document.getElementById('range-lx').value;
        document.getElementById('light-z').value = document.getElementById('range-lz').value;
    } else {
        document.getElementById('range-l').value = document.getElementById('light-h').value;
        document.getElementById('range-lx').value = document.getElementById('light-x').value;
        document.getElementById('range-lz').value = document.getElementById('light-z').value;
    }
    const h = parseFloat(document.getElementById('light-h').value);
    const x = parseFloat(document.getElementById('light-x').value);
    const z = parseFloat(document.getElementById('light-z').value);

    lightObj.position.set(x, h, z);
    pointLight.position.set(x, h, z);
    lightMarker.position.set(x, 0.01, z);
    const positions = lightLine.geometry.attributes.position.array;
    positions[0] = x; positions[1] = 0; positions[2] = z;
    positions[3] = x; positions[4] = h; positions[5] = z;
    lightLine.geometry.attributes.position.needsUpdate = true;
    lightLine.computeLineDistances();
    updateAuxiliaryLines();
    calculateAreas();
}

function toggleDecimalMode() {
    const isDecimal = document.getElementById('decimal-mode').checked;
    const step = isDecimal ? "0.1" : "1";
    ['size-w', 'range-w', 'size-h', 'range-h', 'size-d', 'range-d', 'pos-y', 'range-y', 'light-h', 'range-l', 'light-x', 'range-lx', 'light-z', 'range-lz'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.setAttribute('step', step);
    });
    if (!isDecimal && selectedObj) {
        syncSize('w'); syncSize('h'); syncSize('d'); syncPos();
        updateLight();
    }
}

function updateAuxiliaryLines() {
    rayLines.clear();
    const showRays = document.getElementById('show-rays').checked;
    if (!showRays) return;
    const lightPos = lightObj.position;
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    objects.forEach(obj => {
        obj.updateMatrixWorld(true);
        const posAttr = obj.geometry.getAttribute('position');
        const tempV = new THREE.Vector3();
        for (let i = 0; i < posAttr.count; i++) {
            tempV.fromBufferAttribute(posAttr, i);
            tempV.applyMatrix4(obj.matrixWorld);
            if (tempV.y < lightPos.y) {
                const dir = new THREE.Vector3().subVectors(tempV, lightPos).normalize();
                raycaster.set(lightPos, dir);
                const targets = objects.filter(o => o !== obj);
                const intersects = raycaster.intersectObjects(targets);
                let endPoint = null;
                if (intersects.length > 0) {
                    const distToVertex = lightPos.distanceTo(tempV);
                    const hit = intersects.find(h => h.distance > distToVertex + 0.01);
                    if (hit) endPoint = hit.point;
                }
                if (!endPoint) {
                    const target = new THREE.Vector3();
                    const ray = new THREE.Ray(lightPos, dir);
                    if (ray.intersectPlane(groundPlane, target)) endPoint = target;
                }
                if (endPoint) {
                    const lineGeo = new THREE.BufferGeometry().setFromPoints([lightPos, endPoint]);
                    const line = new THREE.Line(lineGeo, new THREE.LineDashedMaterial({ color: 0xff8800, dashSize: 0.5, gapSize: 0.5, opacity: 0.8, transparent: true, linewidth: 2 }));
                    line.computeLineDistances();
                    rayLines.add(line);
                }
            }
        }
    });
}

function getConvexHull(points) {
    points.sort((a, b) => a.x !== b.x ? a.x - b.x : a.z - b.z);
    const cross = (o, a, b) => (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
    const lower = [];
    for (let p of points) {
        while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
        lower.push(p);
    }
    const upper = [];
    for (let i = points.length - 1; i >= 0; i--) {
        let p = points[i];
        while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
        upper.push(p);
    }
    lower.pop(); upper.pop();
    return lower.concat(upper);
}

function calculateAreas() {
    const listEl = document.getElementById('area-list-content');
    listEl.innerHTML = '';
    if (objects.length === 0) {
        listEl.innerHTML = '<li class="area-item"><span class="area-name">地面</span><span class="area-val">0.00</span></li>';
        return;
    }
    const lightPos = lightObj.position;
    ctx.fillStyle = "white"; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = "black";
    objects.forEach(obj => {
        obj.updateMatrixWorld(true);
        const posAttr = obj.geometry.getAttribute('position');
        const vertices = [];
        for (let i = 0; i < posAttr.count; i++) {
            const v = new THREE.Vector3().fromBufferAttribute(posAttr, i);
            v.applyMatrix4(obj.matrixWorld);
            if (v.y < lightPos.y) {
                const hDiff = lightPos.y - v.y;
                const t = lightPos.y / hDiff;
                const sx = lightPos.x + t * (v.x - lightPos.x);
                const sz = lightPos.z + t * (v.z - lightPos.z);
                vertices.push({ x: sx, z: sz });
            }
        }
        if (vertices.length >= 3) {
            const hull = getConvexHull(vertices);
            ctx.beginPath();
            hull.forEach((p, idx) => {
                const cx = p.x * CANVAS_SCALE + CANVAS_OFFSET;
                const cy = p.z * CANVAS_SCALE + CANVAS_OFFSET;
                if (idx === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
            });
            ctx.closePath(); ctx.fill();
        }
    });
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let blackPixels = 0;
    for (let i = 0; i < imgData.data.length; i += 4) if (imgData.data[i] < 255) blackPixels++;
    const groundArea = blackPixels / (CANVAS_SCALE * CANVAS_SCALE);
    const groundLi = document.createElement('li');
    groundLi.className = 'area-item total';
    groundLi.innerHTML = `<span class="area-name">地面</span><div class="area-val-wrap"><span class="area-val">${groundArea.toFixed(2)}</span><span class="area-unit">cm²</span></div>`;
    listEl.appendChild(groundLi);

    const SAMPLE_DENSITY = 2;
    objects.forEach(receiver => {
        let wallShadowCount = 0;
        const w = receiver.geometry.parameters.width;
        const h = receiver.geometry.parameters.height;
        const d = receiver.geometry.parameters.depth;
        const faces = [
            { u: w, v: h, pos: new THREE.Vector3(0, 0, d / 2), norm: new THREE.Vector3(0, 0, 1), uDir: new THREE.Vector3(1, 0, 0), vDir: new THREE.Vector3(0, 1, 0) },
            { u: w, v: h, pos: new THREE.Vector3(0, 0, -d / 2), norm: new THREE.Vector3(0, 0, -1), uDir: new THREE.Vector3(-1, 0, 0), vDir: new THREE.Vector3(0, 1, 0) },
            { u: d, v: h, pos: new THREE.Vector3(-w / 2, 0, 0), norm: new THREE.Vector3(-1, 0, 0), uDir: new THREE.Vector3(0, 0, 1), vDir: new THREE.Vector3(0, 1, 0) },
            { u: d, v: h, pos: new THREE.Vector3(w / 2, 0, 0), norm: new THREE.Vector3(1, 0, 0), uDir: new THREE.Vector3(0, 0, -1), vDir: new THREE.Vector3(0, 1, 0) },
            { u: w, v: d, pos: new THREE.Vector3(0, h / 2, 0), norm: new THREE.Vector3(0, 1, 0), uDir: new THREE.Vector3(1, 0, 0), vDir: new THREE.Vector3(0, 0, -1) },
            { u: w, v: d, pos: new THREE.Vector3(0, -h / 2, 0), norm: new THREE.Vector3(0, -1, 0), uDir: new THREE.Vector3(1, 0, 0), vDir: new THREE.Vector3(0, 0, 1) }
        ];
        faces.forEach(face => {
            if (face.u < 0.01 || face.v < 0.01) return;
            const faceCenter = face.pos.clone().applyMatrix4(receiver.matrixWorld);
            const faceNorm = face.norm.clone().transformDirection(receiver.matrixWorld);
            const dirToLight = new THREE.Vector3().subVectors(lightPos, faceCenter).normalize();
            if (faceNorm.dot(dirToLight) <= 0) return;
            const step = 1.0 / SAMPLE_DENSITY;
            for (let u = -face.u / 2 + step / 2; u < face.u / 2; u += step) {
                for (let v = -face.v / 2 + step / 2; v < face.v / 2; v += step) {
                    const localPt = face.pos.clone().add(face.uDir.clone().multiplyScalar(u)).add(face.vDir.clone().multiplyScalar(v));
                    const worldPt = localPt.applyMatrix4(receiver.matrixWorld);
                    const dir = new THREE.Vector3().subVectors(lightPos, worldPt);
                    const distToLight = dir.length();
                    dir.normalize();
                    raycaster.set(worldPt, dir);
                    const obstacles = objects.filter(o => o !== receiver);
                    const intersects = raycaster.intersectObjects(obstacles);
                    if (intersects.length > 0) {
                        if (intersects[0].distance < distToLight) wallShadowCount++;
                    }
                }
            }
        });
        if (wallShadowCount > 0) {
            const area = wallShadowCount / (SAMPLE_DENSITY * SAMPLE_DENSITY);
            const li = document.createElement('li');
            li.className = 'area-item';
            li.innerHTML = `<span class="area-name">↳ ${receiver.name}</span><div class="area-val-wrap"><span class="area-val">${area.toFixed(2)}</span><span class="area-unit">cm²</span></div>`;
            listEl.insertBefore(li, listEl.firstChild);
        }
    });
}

function animate() { requestAnimationFrame(animate); controls.update(); if (boxHelper) boxHelper.update(); renderer.render(scene, camera); labelRenderer.render(scene, camera); }
window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); labelRenderer.setSize(window.innerWidth, window.innerHeight); });
init();
