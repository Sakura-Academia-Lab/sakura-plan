import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let rotationalSolid, profileLine;
let rotationAngle = 0;
let isRotating = false;
let profilePoints = [];

const state = {
    shape: 'rectangle',
    width: 50,
    height: 100,
    offset: 0,
    opacity: 0.7,
    wireframe: false
};

const profileCanvas = document.getElementById('profile-canvas');
const profileCtx = profileCanvas.getContext('2d');

function init() {
    // Three.js Setup
    const container = document.getElementById('three-container');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9);

    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 1000);
    camera.position.set(200, 200, 200);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 200, 100);
    scene.add(directionalLight);

    // Helpers
    const gridHelper = new THREE.GridHelper(200, 10);
    scene.add(gridHelper);
    const axesHelper = new THREE.AxesHelper(100);
    scene.add(axesHelper);

    window.addEventListener('resize', onWindowResize);

    // Initial update
    updateShape();
    animate();
}

function onWindowResize() {
    const container = document.getElementById('three-container');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);

    const dpr = window.devicePixelRatio || 1;
    profileCanvas.width = profileCanvas.clientWidth * dpr;
    profileCanvas.height = profileCanvas.clientHeight * dpr;
    profileCtx.scale(dpr, dpr);
}

// Global functions for HTML access
window.startRotation = () => { isRotating = true; };
window.stopRotation = () => { isRotating = false; };
window.resetSolid = () => { rotationAngle = 0; isRotating = false; updateShape(); };
window.toggleGuide = () => {
    const modal = document.getElementById('guide-modal');
    modal.style.display = modal.style.display === 'none' ? 'block' : 'none';
};

window.applyPreset = () => {
    state.shape = document.getElementById('preset-shape').value;
    updateShape();
};

window.updateShape = () => {
    state.width = parseFloat(document.getElementById('shape-width').value);
    state.height = parseFloat(document.getElementById('shape-height').value);
    state.offset = parseFloat(document.getElementById('shape-offset').value);

    createProfile();
    createSolid();
    drawProfile2D();
};

window.updateOpacity = () => {
    state.opacity = parseFloat(document.getElementById('opacity-range').value);
    if (rotationalSolid) rotationalSolid.material.opacity = state.opacity;
};

window.updateWireframe = () => {
    state.wireframe = document.getElementById('show-wireframe').checked;
    if (rotationalSolid) rotationalSolid.material.wireframe = state.wireframe;
};

function createProfile() {
    profilePoints = [];
    const w = state.width;
    const h = state.height;
    const x0 = state.offset;

    // Y軸を中心に回転させるための断面（XY平面上の点）
    if (state.shape === 'rectangle') {
        profilePoints.push(new THREE.Vector2(x0, -h / 2));
        profilePoints.push(new THREE.Vector2(x0 + w, -h / 2));
        profilePoints.push(new THREE.Vector2(x0 + w, h / 2));
        profilePoints.push(new THREE.Vector2(x0, h / 2));
        profilePoints.push(new THREE.Vector2(x0, -h / 2)); // 閉じる
    } else if (state.shape === 'right-triangle') {
        profilePoints.push(new THREE.Vector2(x0, -h / 2));
        profilePoints.push(new THREE.Vector2(x0 + w, -h / 2));
        profilePoints.push(new THREE.Vector2(x0, h / 2));
        profilePoints.push(new THREE.Vector2(x0, -h / 2));
    } else if (state.shape === 'isosceles-triangle') {
        profilePoints.push(new THREE.Vector2(x0, -h / 2));
        profilePoints.push(new THREE.Vector2(x0 + w, 0));
        profilePoints.push(new THREE.Vector2(x0, h / 2));
        profilePoints.push(new THREE.Vector2(x0, -h / 2));
    } else if (state.shape === 'semicircle') {
        const segments = 16;
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI - Math.PI / 2;
            profilePoints.push(new THREE.Vector2(x0 + w * Math.cos(angle), h / 2 * Math.sin(angle)));
        }
        profilePoints.push(new THREE.Vector2(x0, -h / 2));
    } else if (state.shape === 'trapezoid') {
        profilePoints.push(new THREE.Vector2(x0, -h / 2));
        profilePoints.push(new THREE.Vector2(x0 + w, -h / 2));
        profilePoints.push(new THREE.Vector2(x0 + w * 0.6, h / 2));
        profilePoints.push(new THREE.Vector2(x0, h / 2));
        profilePoints.push(new THREE.Vector2(x0, -h / 2));
    }
}

function createSolid() {
    if (rotationalSolid) scene.remove(rotationalSolid);

    // LatheGeometry: 断面を回転させて立体を作る
    // points, segments, phiStart, phiLength
    const segments = 32;
    const phiLength = isRotating ? (rotationAngle % (Math.PI * 2) || 0.001) : Math.PI * 2;

    const geometry = new THREE.LatheGeometry(profilePoints, segments, 0, phiLength);
    const material = new THREE.MeshPhongMaterial({
        color: 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: state.opacity,
        wireframe: state.wireframe
    });

    rotationalSolid = new THREE.Mesh(geometry, material);
    scene.add(rotationalSolid);
}

function drawProfile2D() {
    const dpr = window.devicePixelRatio || 1;
    const w = profileCanvas.width / dpr;
    const h = profileCanvas.height / dpr;
    profileCtx.clearRect(0, 0, w, h);

    const centerX = 50; // 回転軸の位置
    const centerY = h / 2;
    const scale = 1.0;

    // 回転軸 (Y軸)
    profileCtx.setLineDash([5, 5]);
    profileCtx.strokeStyle = '#64748b';
    profileCtx.beginPath(); profileCtx.moveTo(centerX, 0); profileCtx.lineTo(centerX, h); profileCtx.stroke();
    profileCtx.setLineDash([]);

    // 断面図形
    profileCtx.fillStyle = '#38bdf844';
    profileCtx.strokeStyle = '#38bdf8';
    profileCtx.lineWidth = 2;
    profileCtx.beginPath();
    profilePoints.forEach((p, i) => {
        const x = centerX + p.x * scale;
        const y = centerY - p.y * scale;
        if (i === 0) profileCtx.moveTo(x, y); else profileCtx.lineTo(x, y);
    });
    profileCtx.fill();
    profileCtx.stroke();
}

function animate() {
    requestAnimationFrame(animate);

    if (isRotating) {
        rotationAngle += 0.05;
        createSolid();
        document.getElementById('rotation-display').textContent = `${Math.floor((rotationAngle % (Math.PI * 2)) / (Math.PI * 2) * 360)}°`;
        if (rotationAngle >= Math.PI * 2) {
            // rotationAngle = Math.PI * 2;
            // isRotating = false;
        }
    }

    controls.update();
    renderer.render(scene, camera);
}

document.addEventListener('DOMContentLoaded', () => {
    onWindowResize(); // Set initial canvas size
    init();
});
