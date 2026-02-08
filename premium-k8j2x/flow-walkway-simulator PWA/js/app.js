const state = {
    mode: 'flow', // 'flow' or 'walkway'
    baseSpeed: 10,
    envSpeed: 2,
    distance: 200,
    movement: 'downstream', // 'downstream', 'upstream', 'roundtrip'
    pos: 0,
    currentTime: 0,
    isPlaying: false,
    history: { time: [], pos: [] }
};

let animationCanvas, animationCtx, diagramCanvas, diagramCtx, timeDistanceCanvas, timeDistanceCtx;
let animationFrameId = null;

window.onload = init;

function init() {
    animationCanvas = document.getElementById('animation-canvas');
    diagramCanvas = document.getElementById('diagram-canvas');
    timeDistanceCanvas = document.getElementById('time-distance-chart');

    setupCanvas(animationCanvas);
    setupCanvas(diagramCanvas);
    setupCanvas(timeDistanceCanvas);

    animationCtx = animationCanvas.getContext('2d');
    diagramCtx = diagramCanvas.getContext('2d');
    timeDistanceCtx = timeDistanceCanvas.getContext('2d');

    updateSettings();
    render();
}

function setupCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.getContext('2d').scale(dpr, dpr);
}

function switchMode(newMode) {
    state.mode = newMode;
    document.getElementById('tab-flow').classList.toggle('active', newMode === 'flow');
    document.getElementById('tab-walkway').classList.toggle('active', newMode === 'walkway');

    const labels = {
        flow: { main: 'ボートの設定', env: '川の設定', speed: '流速:', guide: '流水算', step1: '流速を設定' },
        walkway: { main: '人の設定', env: '歩道の設定', speed: '歩道の速さ:', guide: '動く歩道', step1: '歩道の速さを設定' }
    };

    document.getElementById('main-obj-label').textContent = labels[newMode].main;
    document.getElementById('env-obj-label').textContent = labels[newMode].env;
    document.getElementById('env-speed-label').textContent = labels[newMode].speed;
    document.getElementById('guide-title').textContent = labels[newMode].guide + 'シミュレーターの使い方';
    document.getElementById('guide-step-1').innerHTML = `<strong>${labels[newMode].step1}</strong>：環境の速さを調整します。`;

    resetAnimation();
}

function updateSettings() {
    state.baseSpeed = parseFloat(document.getElementById('base-speed').value);
    state.envSpeed = parseFloat(document.getElementById('env-speed').value);
    state.distance = parseFloat(document.getElementById('distance').value);
    state.movement = document.getElementById('movement-mode').value;
    resetAnimation();
}

function resetAnimation() {
    state.isPlaying = false;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    state.currentTime = 0;
    state.pos = 0;
    state.history = { time: [], pos: [] };
    document.getElementById('current-time-display').textContent = '0.00秒';
    render();
}

function startAnimation() {
    if (state.isPlaying) return;
    state.isPlaying = true;
    animate();
}

function pauseAnimation() { state.isPlaying = false; if (animationFrameId) cancelAnimationFrame(animationFrameId); }

function animate() {
    if (!state.isPlaying) return;
    state.currentTime += 0.016;

    let actualSpeed;
    if (state.movement === 'downstream') {
        actualSpeed = state.baseSpeed + state.envSpeed;
        state.pos = actualSpeed * state.currentTime;
        if (state.pos >= state.distance) { state.pos = state.distance; pauseAnimation(); }
    } else if (state.movement === 'upstream') {
        actualSpeed = state.baseSpeed - state.envSpeed;
        state.pos = actualSpeed * state.currentTime;
        if (state.pos >= state.distance) { state.pos = state.distance; pauseAnimation(); }
    } else { // roundtrip
        const timeToEdge = state.distance / (state.baseSpeed + state.envSpeed);
        if (state.currentTime <= timeToEdge) {
            state.pos = (state.baseSpeed + state.envSpeed) * state.currentTime;
        } else {
            const returnTime = state.currentTime - timeToEdge;
            state.pos = state.distance - (state.baseSpeed - state.envSpeed) * returnTime;
            if (state.pos <= 0) { state.pos = 0; pauseAnimation(); }
        }
    }

    state.history.time.push(state.currentTime);
    state.history.pos.push(state.pos);
    document.getElementById('current-time-display').textContent = `${state.currentTime.toFixed(2)}秒`;
    render();
    animationFrameId = requestAnimationFrame(animate);
}

function render() {
    drawAnimation();
    drawDiagram();
    drawTimeDistanceChart();
}

function drawAnimation() {
    const ctx = animationCtx;
    const w = animationCanvas.width / window.devicePixelRatio;
    const h = animationCanvas.height / window.devicePixelRatio;
    ctx.clearRect(0, 0, w, h);

    // 背景（川または歩道）
    if (state.mode === 'flow') {
        ctx.fillStyle = '#e0f2f7';
        ctx.fillRect(0, 0, w, h);
        // 波の表現
        ctx.strokeStyle = '#b3e5fc';
        ctx.lineWidth = 2;
        const offset = (state.currentTime * 50) % 100;
        for (let y = 20; y < h; y += 40) {
            ctx.beginPath();
            for (let x = -offset; x < w; x += 100) {
                ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 25, y - 10, x + 50, y); ctx.quadraticCurveTo(x + 75, y + 10, x + 100, y);
            }
            ctx.stroke();
        }
    } else {
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#94a3b8';
        const beltY = h / 2 - 20;
        ctx.fillRect(0, beltY, w, 40);
        // 歩道の線
        ctx.strokeStyle = '#cbd5e1';
        const offset = (state.currentTime * 50) % 50;
        for (let x = -offset; x < w; x += 50) {
            ctx.beginPath(); ctx.moveTo(x, beltY); ctx.lineTo(x, beltY + 40); ctx.stroke();
        }
    }

    // オブジェクト
    const padding = 50;
    const graphW = w - 2 * padding;
    const x = padding + (state.pos / state.distance) * graphW;
    const y = h / 2;

    ctx.fillStyle = state.mode === 'flow' ? '#0ea5e9' : '#f43f5e';
    if (state.mode === 'flow') {
        // ボート
        ctx.beginPath(); ctx.moveTo(x - 20, y); ctx.lineTo(x + 20, y); ctx.lineTo(x + 10, y + 15); ctx.lineTo(x - 10, y + 15); ctx.closePath(); ctx.fill();
    } else {
        // 人
        ctx.beginPath(); ctx.arc(x, y - 10, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(x - 2, y - 2, 4, 15);
    }
}

function drawDiagram() {
    const ctx = diagramCtx;
    const w = diagramCanvas.width / window.devicePixelRatio;
    const h = diagramCanvas.height / window.devicePixelRatio;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(50, h / 2); ctx.lineTo(w - 50, h / 2); ctx.stroke();
    // 矢印（流速）
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    const arrowY = h / 2 - 30;
    ctx.beginPath(); ctx.moveTo(50, arrowY); ctx.lineTo(100, arrowY); ctx.lineTo(95, arrowY - 5); ctx.moveTo(100, arrowY); ctx.lineTo(95, arrowY + 5); ctx.stroke();
    ctx.fillStyle = '#333'; ctx.font = '12px Arial'; ctx.fillText(`環境速度: ${state.envSpeed}`, 50, arrowY - 10);
}

function drawTimeDistanceChart() {
    const ctx = timeDistanceCtx;
    const w = timeDistanceCanvas.width / window.devicePixelRatio;
    const h = timeDistanceCanvas.height / window.devicePixelRatio;
    ctx.clearRect(0, 0, w, h);
    if (state.history.time.length < 2) return;
    ctx.strokeStyle = '#0ea5e9';
    ctx.lineWidth = 2;
    ctx.beginPath();
    state.history.time.forEach((t, i) => {
        const x = (t / 20) * w;
        const y = h - (state.history.pos[i] / state.distance) * h;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
}

function toggleGuide() {
    const modal = document.getElementById('guide-modal');
    modal.style.display = modal.style.display === 'none' ? 'block' : 'none';
}
