// ===== 状態管理 =====
const state = {
    trainA: { name: '列車A', length: 100, speed: 20, pos: 0, color: '#ff5252' }, // speed: m/s
    trainB: { name: '列車B', length: 100, speed: 10, pos: 300, color: '#38bdf8', direction: 1, mode: 'train' },
    startDistance: 200,
    isPlaying: false,
    currentTime: 0,
    timeScale: 1.0,
    history: {
        time: [],
        positions: [[], []],
        distances: []
    }
};

// ===== Canvas要素 =====
let animationCanvas, animationCtx;
let diagramCanvas, diagramCtx;
let timeDistanceCanvas, timeDistanceCtx;
let distanceDiffCanvas, distanceDiffCtx;
let animationFrameId = null;

// ===== 初期化 =====
window.onload = function () {
    init();
};

function init() {
    animationCanvas = document.getElementById('animation-canvas');
    diagramCanvas = document.getElementById('diagram-canvas');
    timeDistanceCanvas = document.getElementById('time-distance-chart');
    distanceDiffCanvas = document.getElementById('distance-diff-chart');

    setupCanvas(animationCanvas);
    setupCanvas(diagramCanvas);
    setupCanvas(timeDistanceCanvas);
    setupCanvas(distanceDiffCanvas);

    animationCtx = animationCanvas.getContext('2d');
    diagramCtx = diagramCanvas.getContext('2d');
    timeDistanceCtx = timeDistanceCanvas.getContext('2d');
    distanceDiffCtx = distanceDiffCanvas.getContext('2d');

    window.addEventListener('resize', handleResize);
    updateSettings();
    render();
}

function setupCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
}

function handleResize() {
    setupCanvas(animationCanvas);
    setupCanvas(diagramCanvas);
    setupCanvas(timeDistanceCanvas);
    setupCanvas(distanceDiffCanvas);
    render();
}

function updateSettings() {
    state.trainA.length = parseFloat(document.getElementById('train-a-length').value);
    state.trainA.speed = parseFloat(document.getElementById('train-a-speed').value) / 3.6; // km/h to m/s

    state.trainB.mode = document.getElementById('target-mode').value;
    state.trainB.length = parseFloat(document.getElementById('train-b-length').value);
    state.trainB.speed = parseFloat(document.getElementById('train-b-speed').value) / 3.6;
    state.trainB.direction = document.getElementById('train-b-direction').value === 'same' ? 1 : -1;

    state.startDistance = parseFloat(document.getElementById('start-distance').value);

    // UIの切り替え
    const speedRow = document.getElementById('train-b-speed-row');
    const dirRow = document.getElementById('train-b-direction-row');
    if (state.trainB.mode === 'train') {
        speedRow.style.display = 'flex';
        dirRow.style.display = 'flex';
    } else {
        speedRow.style.display = 'none';
        dirRow.style.display = 'none';
        state.trainB.speed = 0;
    }

    resetAnimation();
}

function updateTimeScale() {
    state.timeScale = parseFloat(document.getElementById('time-scale').value);
}

function resetAnimation() {
    pauseAnimation();
    state.currentTime = 0;
    state.history = { time: [], positions: [[], []], distances: [] };

    document.getElementById('current-time-display').textContent = '0.00秒';

    // 初期位置
    state.trainA.pos = 0;
    if (state.trainB.direction === 1) {
        state.trainB.pos = state.startDistance;
    } else {
        state.trainB.pos = state.startDistance + state.trainA.length + state.trainB.length;
    }

    render();
}

function startAnimation() {
    if (state.isPlaying) return;
    state.isPlaying = true;
    animate();
}

function pauseAnimation() {
    state.isPlaying = false;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
}

function animate() {
    if (!state.isPlaying) return;

    state.currentTime += 0.016 * state.timeScale;

    // 位置計算
    state.trainA.pos = state.trainA.speed * state.currentTime;

    let bStartPos = state.startDistance;
    if (state.trainB.direction === -1) {
        bStartPos = state.startDistance + 200; // 対向の場合は少し離す
    }

    if (state.trainB.direction === 1) {
        state.trainB.pos = state.startDistance + state.trainB.speed * state.currentTime;
    } else {
        state.trainB.pos = bStartPos - state.trainB.speed * state.currentTime;
    }

    // 履歴保存
    state.history.time.push(state.currentTime);
    state.history.positions[0].push(state.trainA.pos);
    state.history.positions[1].push(state.trainB.pos);

    // 距離 = 端から端までの距離
    state.history.distances.push(state.trainB.pos - state.trainA.pos);

    document.getElementById('current-time-display').textContent = `${state.currentTime.toFixed(2)}秒`;

    render();

    // 終了判定（通過しきったら停止）
    const passed = state.trainB.direction === 1
        ? (state.trainA.pos > state.trainB.pos + state.trainB.length)
        : (state.trainA.pos > state.trainB.pos + state.trainB.length || state.trainA.pos + state.trainA.length < state.trainB.pos);

    if (state.currentTime > 20) { // Safety stop
        pauseAnimation();
    } else {
        animationFrameId = requestAnimationFrame(animate);
    }
}

function render() {
    drawAnimation();
    drawDiagram();
    drawTimeDistanceChart();
    drawDistanceDiffChart();
}

function drawAnimation() {
    const ctx = animationCtx;
    const w = animationCanvas.width / window.devicePixelRatio;
    const h = animationCanvas.height / window.devicePixelRatio;
    ctx.clearRect(0, 0, w, h);

    const scale = 1.0; // 1m = 1px for simple visualization
    const centerY = h / 2;

    // 線路
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, centerY - 20); ctx.lineTo(w, centerY - 20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, centerY + 20); ctx.lineTo(w, centerY + 20); ctx.stroke();

    // 列車A
    ctx.fillStyle = state.trainA.color;
    ctx.fillRect(state.trainA.pos, centerY - 35, state.trainA.length, 30);
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.fillText('A', state.trainA.pos + 5, centerY - 15);

    // 列車B/対象物
    ctx.fillStyle = state.trainB.color;
    if (state.trainB.mode === 'tunnel') ctx.globalAlpha = 0.5;
    ctx.fillRect(state.trainB.pos, centerY + 5, state.trainB.length, 30);
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = 'white';
    ctx.fillText('B', state.trainB.pos + 5, centerY + 25);
}

function drawDiagram() {
    const ctx = diagramCtx;
    const w = diagramCanvas.width / window.devicePixelRatio;
    const h = diagramCanvas.height / window.devicePixelRatio;
    ctx.clearRect(0, 0, w, h);

    // 線分図の描画 (Time=0の状態を表示)
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    const lineY = h / 2;
    ctx.beginPath(); ctx.moveTo(50, lineY); ctx.lineTo(w - 50, lineY); ctx.stroke();

    // Aの先端と後端
    ctx.fillStyle = state.trainA.color;
    ctx.fillRect(50, lineY - 10, state.trainA.length, 5);
    ctx.fillText('列車A', 50, lineY - 15);

    // Bの位置
    ctx.fillStyle = state.trainB.color;
    const bDisplayPos = 50 + state.startDistance;
    ctx.fillRect(bDisplayPos, lineY + 5, state.trainB.length, 5);
    ctx.fillText('対象物B', bDisplayPos, lineY + 25);
}

function drawTimeDistanceChart() {
    const ctx = timeDistanceCtx;
    const w = timeDistanceCanvas.width / window.devicePixelRatio;
    const h = timeDistanceCanvas.height / window.devicePixelRatio;
    ctx.clearRect(0, 0, w, h);

    // 簡易グリッド
    ctx.strokeStyle = '#e2e8f0';
    ctx.beginPath();
    for (let i = 0; i < w; i += 50) { ctx.moveTo(i, 0); ctx.lineTo(i, h); }
    for (let j = 0; j < h; j += 50) { ctx.moveTo(0, j); ctx.lineTo(w, j); }
    ctx.stroke();

    if (state.history.time.length < 2) return;

    // Aの軌跡
    ctx.strokeStyle = state.trainA.color;
    ctx.beginPath();
    state.history.time.forEach((t, i) => {
        const x = t * 20;
        const y = h - state.history.positions[0][i] * 0.5;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Bの軌跡
    ctx.strokeStyle = state.trainB.color;
    ctx.beginPath();
    state.history.time.forEach((t, i) => {
        const x = t * 20;
        const y = h - state.history.positions[1][i] * 0.5;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
}

function drawDistanceDiffChart() {
    const ctx = distanceDiffCtx;
    const w = distanceDiffCanvas.width / window.devicePixelRatio;
    const h = distanceDiffCanvas.height / window.devicePixelRatio;
    ctx.clearRect(0, 0, w, h);
}

function toggleGuide() {
    const modal = document.getElementById('guide-modal');
    modal.style.display = modal.style.display === 'none' ? 'block' : 'none';
}
