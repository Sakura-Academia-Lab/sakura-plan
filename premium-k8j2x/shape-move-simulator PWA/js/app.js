// ===== 状態管理 =====
const state = {
  // 図形設定
  fixedShape: null,
  movingShape: null,

  // アニメーション制御
  isPlaying: false,
  currentTime: 0,
  timeScale: 1.0,
  maxTime: 10,
  canvasWidth: 800,

  // 履歴データ（グラフ用）
  history: {
    time: [],
    overlapAreas: []
  }
};

// ===== Canvas要素 =====
let mainCanvas, mainCtx;
let areaChart, areaCtx;
let animationFrameId = null;

// ===== 初期化 =====
function init() {
  mainCanvas = document.getElementById('main-canvas');
  areaChart = document.getElementById('area-chart');

  setupCanvas(mainCanvas);
  setupCanvas(areaChart);

  mainCtx = mainCanvas.getContext('2d');
  areaCtx = areaChart.getContext('2d');

  window.addEventListener('resize', handleResize);
  handleResize();

  // 初期図形を作成
  state.fixedShape = new Shape('rectangle', {
    width: 100,
    height: 80,
    color: '#4facfe',
    position: { x: 200, y: 200 }
  });

  state.movingShape = new Shape('rectangle', {
    width: 100,
    height: 80,
    color: '#ff5252',
    position: { x: 0, y: 200 }
  });

  // UIパラメータを初期化
  initializeShapeParams();
  render();
}

// ===== Canvas初期化（DPR対応） =====
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

// ===== リサイズ処理 =====
function handleResize() {
  setupCanvas(mainCanvas);
  setupCanvas(areaChart);

  mainCtx = mainCanvas.getContext('2d');
  areaCtx = areaChart.getContext('2d');

  if (!state.isPlaying) {
    render();
  }
}

// ===== 図形パラメータUIの初期化 =====
function initializeShapeParams() {
  updateFixedShapeParams();
  updateMovingShapeParams();
}

// ===== 固定図形パラメータUIの更新 =====
function updateFixedShapeParams() {
  const type = document.getElementById('fixed-shape-type').value;
  const container = document.getElementById('fixed-shape-params');

  let html = '';
  switch(type) {
    case 'rectangle':
      html = `
        <div class="input-row">
          <label style="min-width: 50px;">幅</label>
          <input type="number" id="fixed-width" value="100" min="20" max="300" step="10" onchange="updateSettings()">
          <span style="font-size: 11px; color: #666;">px</span>
        </div>
        <div class="input-row">
          <label style="min-width: 50px;">高さ</label>
          <input type="number" id="fixed-height" value="80" min="20" max="300" step="10" onchange="updateSettings()">
          <span style="font-size: 11px; color: #666;">px</span>
        </div>
      `;
      break;
    case 'square':
      html = `
        <div class="input-row">
          <label style="min-width: 50px;">サイズ</label>
          <input type="number" id="fixed-size" value="80" min="20" max="300" step="10" onchange="updateSettings()">
          <span style="font-size: 11px; color: #666;">px</span>
        </div>
      `;
      break;
    case 'triangle-right':
    case 'triangle-isosceles':
      html = `
        <div class="input-row">
          <label style="min-width: 50px;">幅</label>
          <input type="number" id="fixed-width" value="100" min="20" max="300" step="10" onchange="updateSettings()">
          <span style="font-size: 11px; color: #666;">px</span>
        </div>
        <div class="input-row">
          <label style="min-width: 50px;">高さ</label>
          <input type="number" id="fixed-height" value="80" min="20" max="300" step="10" onchange="updateSettings()">
          <span style="font-size: 11px; color: #666;">px</span>
        </div>
      `;
      break;
    case 'triangle-equilateral':
      html = `
        <div class="input-row">
          <label style="min-width: 50px;">辺の長さ</label>
          <input type="number" id="fixed-side" value="100" min="20" max="300" step="10" onchange="updateSettings()">
          <span style="font-size: 11px; color: #666;">px</span>
        </div>
      `;
      break;
    case 'trapezoid':
      html = `
        <div class="input-row">
          <label style="min-width: 60px;">上辺</label>
          <input type="number" id="fixed-top-width" value="60" min="20" max="300" step="10" onchange="updateSettings()">
          <span style="font-size: 11px; color: #666;">px</span>
        </div>
        <div class="input-row">
          <label style="min-width: 60px;">下辺</label>
          <input type="number" id="fixed-bottom-width" value="100" min="20" max="300" step="10" onchange="updateSettings()">
          <span style="font-size: 11px; color: #666;">px</span>
        </div>
        <div class="input-row">
          <label style="min-width: 60px;">高さ</label>
          <input type="number" id="fixed-height" value="80" min="20" max="300" step="10" onchange="updateSettings()">
          <span style="font-size: 11px; color: #666;">px</span>
        </div>
      `;
      break;
  }

  container.innerHTML = html;
  updateSettings();
}

// ===== 移動図形パラメータUIの更新 =====
function updateMovingShapeParams() {
  const type = document.getElementById('moving-shape-type').value;
  const container = document.getElementById('moving-shape-params');

  let html = '';
  switch(type) {
    case 'rectangle':
      html = `
        <div class="input-row">
          <label style="min-width: 50px;">幅</label>
          <input type="number" id="moving-width" value="100" min="20" max="300" step="10" onchange="updateSettings()">
          <span style="font-size: 11px; color: #666;">px</span>
        </div>
        <div class="input-row">
          <label style="min-width: 50px;">高さ</label>
          <input type="number" id="moving-height" value="80" min="20" max="300" step="10" onchange="updateSettings()">
          <span style="font-size: 11px; color: #666;">px</span>
        </div>
      `;
      break;
    case 'square':
      html = `
        <div class="input-row">
          <label style="min-width: 50px;">サイズ</label>
          <input type="number" id="moving-size" value="80" min="20" max="300" step="10" onchange="updateSettings()">
          <span style="font-size: 11px; color: #666;">px</span>
        </div>
      `;
      break;
    case 'triangle-right':
    case 'triangle-isosceles':
      html = `
        <div class="input-row">
          <label style="min-width: 50px;">幅</label>
          <input type="number" id="moving-width" value="100" min="20" max="300" step="10" onchange="updateSettings()">
          <span style="font-size: 11px; color: #666;">px</span>
        </div>
        <div class="input-row">
          <label style="min-width: 50px;">高さ</label>
          <input type="number" id="moving-height" value="80" min="20" max="300" step="10" onchange="updateSettings()">
          <span style="font-size: 11px; color: #666;">px</span>
        </div>
      `;
      break;
    case 'triangle-equilateral':
      html = `
        <div class="input-row">
          <label style="min-width: 50px;">辺の長さ</label>
          <input type="number" id="moving-side" value="100" min="20" max="300" step="10" onchange="updateSettings()">
          <span style="font-size: 11px; color: #666;">px</span>
        </div>
      `;
      break;
    case 'trapezoid':
      html = `
        <div class="input-row">
          <label style="min-width: 60px;">上辺</label>
          <input type="number" id="moving-top-width" value="60" min="20" max="300" step="10" onchange="updateSettings()">
          <span style="font-size: 11px; color: #666;">px</span>
        </div>
        <div class="input-row">
          <label style="min-width: 60px;">下辺</label>
          <input type="number" id="moving-bottom-width" value="100" min="20" max="300" step="10" onchange="updateSettings()">
          <span style="font-size: 11px; color: #666;">px</span>
        </div>
        <div class="input-row">
          <label style="min-width: 60px;">高さ</label>
          <input type="number" id="moving-height" value="80" min="20" max="300" step="10" onchange="updateSettings()">
          <span style="font-size: 11px; color: #666;">px</span>
        </div>
      `;
      break;
  }

  container.innerHTML = html;
  updateSettings();
}

// ===== 設定更新 =====
function updateSettings() {
  // 固定図形の更新
  const fixedType = document.getElementById('fixed-shape-type').value;
  const fixedConfig = getShapeConfig('fixed', fixedType);
  fixedConfig.color = '#4facfe';
  fixedConfig.position = {
    x: parseFloat(document.getElementById('fixed-x').value),
    y: parseFloat(document.getElementById('fixed-y').value)
  };

  if (state.fixedShape && state.fixedShape.type === fixedType) {
    state.fixedShape.updateParams(fixedConfig);
    state.fixedShape.position = fixedConfig.position;
  } else {
    state.fixedShape = new Shape(fixedType, fixedConfig);
  }

  // 移動図形の更新
  const movingType = document.getElementById('moving-shape-type').value;
  const movingConfig = getShapeConfig('moving', movingType);
  movingConfig.color = '#ff5252';
  movingConfig.position = {
    x: parseFloat(document.getElementById('moving-initial-x').value),
    y: parseFloat(document.getElementById('moving-y').value)
  };

  if (state.movingShape && state.movingShape.type === movingType) {
    state.movingShape.updateParams(movingConfig);
    state.movingShape.position = movingConfig.position;
  } else {
    state.movingShape = new Shape(movingType, movingConfig);
  }

  // アニメーション設定
  state.maxTime = parseFloat(document.getElementById('max-time').value);

  if (!state.isPlaying) {
    resetAnimation();
  }
}

// ===== 図形設定の取得 =====
function getShapeConfig(prefix, type) {
  const config = {};

  switch(type) {
    case 'rectangle':
      config.width = parseFloat(document.getElementById(`${prefix}-width`)?.value || 100);
      config.height = parseFloat(document.getElementById(`${prefix}-height`)?.value || 80);
      break;
    case 'square':
      config.size = parseFloat(document.getElementById(`${prefix}-size`)?.value || 80);
      break;
    case 'triangle-right':
    case 'triangle-isosceles':
      config.width = parseFloat(document.getElementById(`${prefix}-width`)?.value || 100);
      config.height = parseFloat(document.getElementById(`${prefix}-height`)?.value || 80);
      if (type === 'triangle-isosceles') {
        config.base = config.width;
      }
      break;
    case 'triangle-equilateral':
      config.side = parseFloat(document.getElementById(`${prefix}-side`)?.value || 100);
      break;
    case 'trapezoid':
      config.topWidth = parseFloat(document.getElementById(`${prefix}-top-width`)?.value || 60);
      config.bottomWidth = parseFloat(document.getElementById(`${prefix}-bottom-width`)?.value || 100);
      config.height = parseFloat(document.getElementById(`${prefix}-height`)?.value || 80);
      break;
  }

  return config;
}

// ===== 再生速度更新 =====
function updateTimeScale() {
  state.timeScale = parseFloat(document.getElementById('time-scale').value);
}

// ===== アニメーション開始 =====
function startAnimation() {
  if (state.isPlaying) return;

  state.isPlaying = true;
  state.currentTime = 0;
  state.history = {
    time: [],
    overlapAreas: []
  };

  // 移動図形の初期位置を設定
  const initialX = parseFloat(document.getElementById('moving-initial-x').value);
  const movingY = parseFloat(document.getElementById('moving-y').value);
  state.movingShape.position = { x: initialX, y: movingY };

  animate();
}

// ===== アニメーションループ =====
function animate() {
  if (!state.isPlaying) return;

  // 時間を進める
  state.currentTime += 0.016 * state.timeScale;

  // 移動図形の位置を更新
  const speed = parseFloat(document.getElementById('moving-speed').value);
  const initialX = parseFloat(document.getElementById('moving-initial-x').value);
  const movingY = parseFloat(document.getElementById('moving-y').value);
  state.movingShape.position.x = initialX + speed * state.currentTime;
  state.movingShape.position.y = movingY;

  // 重なり面積を計算
  const overlapArea = getOverlapArea(state.fixedShape, state.movingShape);

  // 履歴保存
  state.history.time.push(state.currentTime);
  state.history.overlapAreas.push(overlapArea);

  // 描画
  drawMainCanvas();
  drawAreaChart();

  // 時刻表示
  document.getElementById('current-time').textContent = state.currentTime.toFixed(2);

  // 終了判定
  if (state.currentTime >= state.maxTime) {
    pauseAnimation();
  } else {
    animationFrameId = requestAnimationFrame(animate);
  }
}

// ===== 停止 =====
function pauseAnimation() {
  state.isPlaying = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

// ===== リセット =====
function resetAnimation() {
  pauseAnimation();
  state.currentTime = 0;
  state.history = { time: [], overlapAreas: [] };

  // 移動図形を初期位置に戻す
  const initialX = parseFloat(document.getElementById('moving-initial-x').value);
  const movingY = parseFloat(document.getElementById('moving-y').value);
  state.movingShape.position = { x: initialX, y: movingY };

  render();
}

// ===== 静止画描画 =====
function render() {
  drawMainCanvas();
  drawAreaChart();
  document.getElementById('current-time').textContent = state.currentTime.toFixed(2);
}

// ===== メインCanvas描画 =====
function drawMainCanvas() {
  const canvas = mainCanvas;
  const ctx = mainCtx;
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);

  // クリア
  ctx.clearRect(0, 0, w, h);

  // 背景
  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(0, 0, w, h);

  // グリッド（軽く）
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 1;
  for (let i = 0; i < w; i += 50) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, h);
    ctx.stroke();
  }
  for (let i = 0; i < h; i += 50) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(w, i);
    ctx.stroke();
  }

  // 固定図形を描画
  if (state.fixedShape) {
    state.fixedShape.draw(ctx);
  }

  // 移動図形を描画
  if (state.movingShape) {
    state.movingShape.draw(ctx);
  }

  // 重なり部分を強調表示
  if (state.fixedShape && state.movingShape) {
    drawIntersection(ctx, state.fixedShape, state.movingShape, 'rgba(255, 215, 0, 0.7)');

    // 面積を計算して表示
    const overlapArea = getOverlapArea(state.fixedShape, state.movingShape);
    document.getElementById('overlap-area').textContent = overlapArea.toFixed(2);
  }
}

// ===== グラフ描画 =====
function drawAreaChart() {
  const canvas = areaChart;
  const ctx = areaCtx;
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);

  ctx.clearRect(0, 0, w, h);

  const marginLeft = 50;
  const marginRight = 20;
  const marginTop = 15;
  const marginBottom = 50;
  const graphW = w - marginLeft - marginRight;
  const graphH = h - marginTop - marginBottom;

  // 背景
  ctx.fillStyle = '#fafafa';
  ctx.fillRect(marginLeft, marginTop, graphW, graphH);

  // グリッド
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 10; i++) {
    const x = marginLeft + (i / 10) * graphW;
    const y = marginTop + (i / 10) * graphH;
    ctx.beginPath();
    ctx.moveTo(x, marginTop);
    ctx.lineTo(x, marginTop + graphH);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(marginLeft, y);
    ctx.lineTo(marginLeft + graphW, y);
    ctx.stroke();
  }

  // 軸
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.strokeRect(marginLeft, marginTop, graphW, graphH);

  // 軸ラベル
  ctx.fillStyle = '#333';
  ctx.font = '11px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('時間 (秒)', w / 2, h - 10);

  ctx.save();
  ctx.translate(15, h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('重なり面積 (px²)', 0, 0);
  ctx.restore();

  // 目盛り
  ctx.font = '10px Arial';
  ctx.textAlign = 'center';
  for (let i = 0; i <= 5; i++) {
    const x = marginLeft + (i / 5) * graphW;
    const time = (i / 5) * state.maxTime;
    ctx.fillText(time.toFixed(1), x, marginTop + graphH + 15);
  }

  // データ描画
  if (state.history.time.length > 1) {
    const maxArea = Math.max(...state.history.overlapAreas, 1);

    ctx.textAlign = 'right';
    for (let i = 0; i <= 10; i++) {
      const y = marginTop + graphH - (i / 10) * graphH;
      const area = (i / 10) * maxArea;
      ctx.fillText(area.toFixed(0), marginLeft - 5, y + 4);
    }

    // 折れ線グラフ
    ctx.strokeStyle = '#9c27b0';
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < state.history.time.length; i++) {
      const t = state.history.time[i];
      const area = state.history.overlapAreas[i];
      const x = marginLeft + (t / state.maxTime) * graphW;
      const y = marginTop + graphH - (area / maxArea) * graphH;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 現在時刻マーカー
    const currentX = marginLeft + (state.currentTime / state.maxTime) * graphW;
    ctx.strokeStyle = '#ff5252';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(currentX, marginTop);
    ctx.lineTo(currentX, marginTop + graphH);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

// ===== ガイドモーダル制御 =====
function toggleGuide() {
  const modal = document.getElementById('guide-modal');
  if (modal.style.display === 'none' || !modal.style.display) {
    modal.style.display = 'block';
  } else {
    modal.style.display = 'none';
  }
}

// ===== コントロールパネルの表示/非表示切り替え（モバイル用） =====
function toggleControls() {
  const controls = document.getElementById('controls');
  controls.classList.toggle('controls-hidden');
}

// ===== グローバルに公開 =====
window.startAnimation = startAnimation;
window.pauseAnimation = pauseAnimation;
window.resetAnimation = resetAnimation;
window.updateSettings = updateSettings;
window.updateTimeScale = updateTimeScale;
window.toggleGuide = toggleGuide;
window.toggleControls = toggleControls;
window.updateFixedShapeParams = updateFixedShapeParams;
window.updateMovingShapeParams = updateMovingShapeParams;

// ===== ページ読み込み時に初期化 =====
window.addEventListener('DOMContentLoaded', init);
