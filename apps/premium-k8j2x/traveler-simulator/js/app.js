// ===== 状態管理 =====
const state = {
  distance: 100,  // 両端の距離 (m)
  people: [
    { name: '人物A', speed: 4, startPos: 0, color: '#ff5252', direction: 1, currentDirection: 1, mode: 'roundTrip' },
    { name: '人物B', speed: 6, startPos: 100, color: '#4facfe', direction: -1, currentDirection: -1, mode: 'roundTrip' }
  ],
  isPlaying: false,
  currentTime: 0,  // 秒
  timeScale: 1.0,  // 再生速度倍率
  maxTime: 60,     // 最大時間（往復を想定）
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
  handleResize();

  updateSettings();
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
  setupCanvas(animationCanvas);
  setupCanvas(diagramCanvas);
  setupCanvas(timeDistanceCanvas);
  setupCanvas(distanceDiffCanvas);

  animationCtx = animationCanvas.getContext('2d');
  diagramCtx = diagramCanvas.getContext('2d');
  timeDistanceCtx = timeDistanceCanvas.getContext('2d');
  distanceDiffCtx = distanceDiffCanvas.getContext('2d');

  if (!state.isPlaying) {
    render();
  }
}

// ===== 設定更新 =====
function updateSettings() {
  state.distance = parseFloat(document.getElementById('input-distance').value);

  state.people[0].name = document.getElementById('name-a').value;
  state.people[0].speed = parseFloat(document.getElementById('input-speed-a').value);
  const startA = document.getElementById('start-a').value;
  state.people[0].startPos = startA === '0' ? 0 : state.distance;
  state.people[0].direction = startA === '0' ? 1 : -1;
  state.people[0].mode = document.getElementById('mode-a').value;

  state.people[1].name = document.getElementById('name-b').value;
  state.people[1].speed = parseFloat(document.getElementById('input-speed-b').value);
  const startB = document.getElementById('start-b').value;
  state.people[1].startPos = startB === '0' ? 0 : state.distance;
  state.people[1].direction = startB === '0' ? 1 : -1;
  state.people[1].mode = document.getElementById('mode-b').value;

  calculateMaxTime();

  if (!state.isPlaying) {
    resetAnimation();
  }
}

// ===== スライダー同期 =====
function syncDistance() {
  const val = document.getElementById('range-distance').value;
  document.getElementById('input-distance').value = val;
  updateSettings();
}

function syncSpeedA() {
  const val = document.getElementById('range-speed-a').value;
  document.getElementById('input-speed-a').value = val;
  updateSettings();
}

function syncSpeedB() {
  const val = document.getElementById('range-speed-b').value;
  document.getElementById('input-speed-b').value = val;
  updateSettings();
}

function updateTimeScale() {
  state.timeScale = parseFloat(document.getElementById('time-scale').value);
}

// ===== 最大時間計算 =====
function calculateMaxTime() {
  // 往復を想定して、デフォルトで60秒に設定
  state.maxTime = 60;
}

// ===== 位置計算（移動モード対応） =====
function calculatePosition(person, time) {
  const mode = person.mode || 'roundTrip';
  let pos = person.startPos;
  let currentDir = person.direction;
  let remainingTime = time;

  if (mode === 'passThrough') {
    // 突き抜けモード：範囲外でも進み続ける
    pos = person.startPos + currentDir * person.speed * time;
    return pos; // 境界チェックなし
  }

  if (mode === 'stopAtEdge') {
    // 端で停止モード：範囲内で進み、端に到達したら停止
    pos = person.startPos + currentDir * person.speed * time;
    return Math.max(0, Math.min(state.distance, pos));
  }

  // roundTripモード（往復）：端で反転
  while (remainingTime > 0.001) {
    const nextPos = pos + currentDir * person.speed * remainingTime;

    if (nextPos >= 0 && nextPos <= state.distance) {
      pos = nextPos;
      break;
    }

    let timeToEdge;
    if (currentDir === 1) {
      timeToEdge = (state.distance - pos) / person.speed;
      pos = state.distance;
    } else {
      timeToEdge = pos / person.speed;
      pos = 0;
    }

    remainingTime -= timeToEdge;
    currentDir *= -1;
  }

  return Math.max(0, Math.min(state.distance, pos));
}

// ===== 距離計算 =====
function calculateDistance(posA, posB) {
  return Math.abs(posA - posB);
}

// ===== 交点検出 =====
function findIntersections() {
  const intersections = [];

  if (state.history.time.length < 2) return intersections;

  for (let i = 1; i < state.history.time.length; i++) {
    const pos0_prev = state.history.positions[0][i - 1];
    const pos0_curr = state.history.positions[0][i];
    const pos1_prev = state.history.positions[1][i - 1];
    const pos1_curr = state.history.positions[1][i];

    // 2つの線分が交差するか判定
    const diff_prev = pos0_prev - pos1_prev;
    const diff_curr = pos0_curr - pos1_curr;

    // 符号が変わったら交点がある（厳密な0も含む）
    if (diff_prev * diff_curr < 0 || (Math.abs(diff_curr) < 0.01 && Math.abs(diff_prev) > 0.01)) {
      // 線形補間で交点を計算
      const t_prev = state.history.time[i - 1];
      const t_curr = state.history.time[i];
      const ratio = Math.abs(diff_prev) / (Math.abs(diff_prev) + Math.abs(diff_curr) + 1e-10);
      const intersectTime = t_prev + (t_curr - t_prev) * ratio;
      const intersectPos = pos0_prev + (pos0_curr - pos0_prev) * ratio;

      // 速度方向を計算（出会いか追い越しか判定）
      const vel0 = pos0_curr - pos0_prev;
      const vel1 = pos1_curr - pos1_prev;

      // 2人の移動方向が逆なら「出会い」、同じ方向なら「追い越し」
      const isMeeting = (vel0 * vel1) < 0;
      const type = isMeeting ? 'meeting' : 'overtaking';

      // 重複チェック：直前の交点と時間が近すぎる場合はスキップ
      if (intersections.length === 0 || Math.abs(intersectTime - intersections[intersections.length - 1].time) > 0.1) {
        intersections.push({ time: intersectTime, position: intersectPos, type: type });
      }
    }
  }

  return intersections;
}

// ===== 端到達イベント検出 =====
function findEdgeEvents() {
  const events = [];

  if (state.history.time.length < 2) return events;

  for (let personIdx = 0; personIdx < 2; personIdx++) {
    for (let i = 1; i < state.history.time.length; i++) {
      const pos_prev = state.history.positions[personIdx][i - 1];
      const pos_curr = state.history.positions[personIdx][i];

      // 左端(0m)到達を検出（一方向のみ：近づく方向）
      if (pos_prev > 0.5 && pos_curr <= 0.5) {
        const t_prev = state.history.time[i - 1];
        const t_curr = state.history.time[i];
        const ratio = pos_prev / (pos_prev - pos_curr + 1e-10);
        const eventTime = t_prev + (t_curr - t_prev) * ratio;
        events.push({ time: eventTime, person: personIdx, edge: 'left' });
      }

      // 右端(distance)到達を検出（一方向のみ：近づく方向）
      if (pos_prev < state.distance - 0.5 && pos_curr >= state.distance - 0.5) {
        const t_prev = state.history.time[i - 1];
        const t_curr = state.history.time[i];
        const ratio = (state.distance - pos_prev) / (pos_curr - pos_prev + 1e-10);
        const eventTime = t_prev + (t_curr - t_prev) * ratio;
        events.push({ time: eventTime, person: personIdx, edge: 'right' });
      }
    }
  }

  return events;
}

// ===== アニメーション開始 =====
function startAnimation() {
  if (state.isPlaying) return;

  state.isPlaying = true;
  state.currentTime = 0;
  state.history = { time: [], positions: [[], []], distances: [] };

  animate();
}

// ===== アニメーションループ =====
function animate() {
  if (!state.isPlaying) return;

  // 時間を進める (60fps想定)
  state.currentTime += 0.016 * state.timeScale;

  // 位置計算
  const positions = state.people.map(p => calculatePosition(p, state.currentTime));

  // 履歴保存（制限なし - 往復を記録）
  state.history.time.push(state.currentTime);
  positions.forEach((pos, i) => state.history.positions[i].push(pos));
  state.history.distances.push(calculateDistance(positions[0], positions[1]));

  // 描画
  drawAnimation(positions);
  drawDiagram();
  drawTimeDistanceChart();
  drawDistanceDiffChart();

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
  state.history = { time: [], positions: [[], []], distances: [] };
  render();
}

// ===== 静止画描画 =====
function render() {
  const positions = state.people.map(p => calculatePosition(p, state.currentTime));
  drawAnimation(positions);
  drawDiagram();
  drawTimeDistanceChart();
  drawDistanceDiffChart();
}

// ===== アニメーション描画 =====
function drawAnimation(positions) {
  const canvas = animationCanvas;
  const ctx = animationCtx;
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);

  // クリア
  ctx.clearRect(0, 0, w, h);

  // 背景（グラデーション）
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#87ceeb');
  grad.addColorStop(0.5, '#e8f5e9');
  grad.addColorStop(1, '#d7ccc8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // 道路
  const roadY = h / 2;
  const roadHeight = 60;
  ctx.fillStyle = '#888';
  ctx.fillRect(0, roadY - roadHeight / 2, w, roadHeight);

  // 中央線
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(0, roadY);
  ctx.lineTo(w, roadY);
  ctx.stroke();
  ctx.setLineDash([]);

  // 距離マーカー
  const padding = 50;
  const roadWidth = w - 2 * padding;

  ctx.fillStyle = '#333';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('0m', padding, roadY + roadHeight / 2 + 20);
  ctx.fillText(`${state.distance}m`, w - padding, roadY + roadHeight / 2 + 20);

  // 人物描画
  state.people.forEach((person, i) => {
    const pos = positions[i];

    // 範囲外の場合は描画しない（passThroughモード用）
    if (pos < 0 || pos > state.distance) {
      return;
    }

    const x = padding + (pos / state.distance) * roadWidth;
    const y = roadY + (i === 0 ? -15 : 15);

    // 円
    ctx.fillStyle = person.color;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();

    // 縁取り
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 名前
    ctx.fillStyle = '#333';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(person.name, x, y + (i === 0 ? -20 : 30));

    // 速度表示と動作モード
    ctx.font = '10px Arial';
    const modeLabel = person.mode === 'roundTrip' ? '往復' : person.mode === 'passThrough' ? '突抜' : '停止';
    ctx.fillText(`${person.speed}m/s (${modeLabel})`, x, y + (i === 0 ? -30 : 40));
  });

  // 現在時刻表示
  ctx.fillStyle = '#333';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`時刻: ${state.currentTime.toFixed(2)}秒`, 10, 20);
}

// ===== 時間-距離グラフ描画 =====
function drawTimeDistanceChart() {
  const canvas = timeDistanceCanvas;
  const ctx = timeDistanceCtx;
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
  ctx.fillText('距離 (m)', 0, 0);
  ctx.restore();

  // 目盛り
  ctx.font = '10px Arial';
  ctx.textAlign = 'center';
  for (let i = 0; i <= 5; i++) {
    const x = marginLeft + (i / 5) * graphW;
    const time = (i / 5) * state.maxTime;
    ctx.fillText(time.toFixed(1), x, marginTop + graphH + 15);
  }
  ctx.textAlign = 'right';
  for (let i = 0; i <= 5; i++) {
    const y = marginTop + graphH - (i / 5) * graphH;
    const dist = (i / 5) * state.distance;
    ctx.fillText(dist.toFixed(0), marginLeft - 5, y + 4);
  }

  // データ描画
  if (state.history.time.length > 0) {
    state.people.forEach((person, i) => {
      ctx.strokeStyle = person.color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      for (let j = 0; j < state.history.time.length; j++) {
        const t = state.history.time[j];
        const pos = state.history.positions[i][j];
        const x = marginLeft + (t / state.maxTime) * graphW;
        const y = marginTop + graphH - (pos / state.distance) * graphH;

        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });

    // 現在時刻マーカー
    const x = marginLeft + (state.currentTime / state.maxTime) * graphW;
    ctx.strokeStyle = '#9c27b0';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(x, marginTop);
    ctx.lineTo(x, marginTop + graphH);
    ctx.stroke();
    ctx.setLineDash([]);

    // 交点表示
    const intersections = findIntersections();
    intersections.forEach((intersection) => {
      const ix = marginLeft + (intersection.time / state.maxTime) * graphW;
      const iy = marginTop + graphH - (intersection.position / state.distance) * graphH;

      // 色とラベルを交点タイプで分ける
      const color = intersection.type === 'meeting' ? '#ff6b6b' : '#4facfe';
      const label = intersection.type === 'meeting' ? '出会い' : '追い越し';

      // 点線（縦）
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(ix, marginTop);
      ctx.lineTo(ix, marginTop + graphH);
      ctx.stroke();

      // 点線（横）
      ctx.beginPath();
      ctx.moveTo(marginLeft, iy);
      ctx.lineTo(marginLeft + graphW, iy);
      ctx.stroke();
      ctx.setLineDash([]);

      // 交点マーカー
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(ix, iy, 5, 0, Math.PI * 2);
      ctx.fill();

      // 数値ラベル
      ctx.fillStyle = color;
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`${label}: ${intersection.time.toFixed(2)}秒`, ix + 10, iy - 10);
      ctx.fillText(`距離: ${intersection.position.toFixed(1)}m`, ix + 10, iy + 5);
    });
  }
}

// ===== 距離差グラフ描画 =====
function drawDistanceDiffChart() {
  const canvas = distanceDiffCanvas;
  const ctx = distanceDiffCtx;
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
  ctx.fillText('2人の距離 (m)', 0, 0);
  ctx.restore();

  // 目盛り
  ctx.font = '10px Arial';
  ctx.textAlign = 'center';
  for (let i = 0; i <= 5; i++) {
    const x = marginLeft + (i / 5) * graphW;
    const time = (i / 5) * state.maxTime;
    ctx.fillText(time.toFixed(1), x, marginTop + graphH + 15);
  }
  ctx.textAlign = 'right';
  for (let i = 0; i <= 5; i++) {
    const y = marginTop + graphH - (i / 5) * graphH;
    const dist = (i / 5) * state.distance;
    ctx.fillText(dist.toFixed(0), marginLeft - 5, y + 4);
  }

  // データ描画
  if (state.history.time.length > 0) {
    ctx.strokeStyle = '#9c27b0';
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let j = 0; j < state.history.time.length; j++) {
      const t = state.history.time[j];
      const dist = state.history.distances[j];
      const x = marginLeft + (t / state.maxTime) * graphW;
      const y = marginTop + graphH - (dist / state.distance) * graphH;

      if (j === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 現在時刻マーカー
    const x = marginLeft + (state.currentTime / state.maxTime) * graphW;
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(x, marginTop);
    ctx.lineTo(x, marginTop + graphH);
    ctx.stroke();
    ctx.setLineDash([]);

    // 交点表示（距離が0になる点）
    const intersections = findIntersections();
    intersections.forEach((intersection) => {
      const ix = marginLeft + (intersection.time / state.maxTime) * graphW;
      const iy = marginTop + graphH; // 距離0なので下端

      // 色とラベルを交点タイプで分ける
      const color = intersection.type === 'meeting' ? '#ff6b6b' : '#4facfe';
      const label = intersection.type === 'meeting' ? '出会い' : '追い越し';

      // 点線（縦）
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(ix, marginTop);
      ctx.lineTo(ix, marginTop + graphH);
      ctx.stroke();
      ctx.setLineDash([]);

      // 交点マーカー
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(ix, iy, 5, 0, Math.PI * 2);
      ctx.fill();

      // 数値ラベル
      ctx.fillStyle = color;
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`${label}: ${intersection.time.toFixed(2)}秒`, ix + 10, iy - 10);
    });

    // 端到達イベント表示
    const edgeEvents = findEdgeEvents();
    edgeEvents.forEach((event, idx) => {
      const ex = marginLeft + (event.time / state.maxTime) * graphW;

      // 点線（縦・緑）
      ctx.strokeStyle = '#4caf50';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(ex, marginTop);
      ctx.lineTo(ex, marginTop + graphH);
      ctx.stroke();
      ctx.setLineDash([]);

      // ラベル（折れ曲がりの説明）
      ctx.fillStyle = '#4caf50';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      const personName = state.people[event.person].name;
      const edgeName = event.edge === 'left' ? '左端' : '右端';
      const yOffset = marginTop + 10 + (idx % 3) * 12; // 重ならないようにずらす
      ctx.fillText(`${personName} ${edgeName}`, ex, yOffset);
    });
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

// ===== 線分図描画（軌跡表示） =====
function drawDiagram() {
  const canvas = diagramCanvas;
  const ctx = diagramCtx;
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);

  // クリア
  ctx.clearRect(0, 0, w, h);

  // 背景
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);

  const padding = 60;
  const lineWidth = w - 2 * padding;
  const personABaseY = h * 0.3; // 人物Aの基準Y座標（上側）
  const personBBaseY = h * 0.7; // 人物Bの基準Y座標（下側）
  const segmentGap = 25; // セグメント間の間隔

  // 端点ラベル（共通）
  ctx.fillStyle = '#333';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('A地点', padding, 20);
  ctx.fillText('0m', padding, 35);
  ctx.fillText('B地点', padding + lineWidth, 20);
  ctx.fillText(`${state.distance}m`, padding + lineWidth, 35);

  // 履歴から各人物の軌跡セグメントを描画
  if (state.history.time.length > 1) {
    state.people.forEach((person, personIdx) => {
      const baseY = personIdx === 0 ? personABaseY : personBBaseY;
      let segmentIndex = 0;
      let segmentStartIdx = 0;

      for (let i = 1; i < state.history.time.length; i++) {
        const pos_prev = state.history.positions[personIdx][i - 1];
        const pos_curr = state.history.positions[personIdx][i];

        // 反転検出（端に到達）
        const hitLeftEdge = pos_prev > 0.5 && pos_curr <= 0.5;
        const hitRightEdge = pos_prev < state.distance - 0.5 && pos_curr >= state.distance - 0.5;

        if (hitLeftEdge || hitRightEdge || i === state.history.time.length - 1) {
          // セグメント描画
          const endIdx = i;
          const yOffset = baseY + (segmentIndex % 5) * segmentGap * (personIdx === 0 ? -1 : 1);

          ctx.strokeStyle = person.color;
          ctx.lineWidth = 3;
          ctx.beginPath();

          for (let j = segmentStartIdx; j <= endIdx; j++) {
            const pos = state.history.positions[personIdx][j];
            const x = padding + (pos / state.distance) * lineWidth;
            if (j === segmentStartIdx) {
              ctx.moveTo(x, yOffset);
            } else {
              ctx.lineTo(x, yOffset);
            }
          }
          ctx.stroke();

          // 端点マーカー
          if (hitLeftEdge || hitRightEdge || i === state.history.time.length - 1) {
            const lastPos = state.history.positions[personIdx][endIdx];
            const lastX = padding + (lastPos / state.distance) * lineWidth;
            ctx.fillStyle = person.color;
            ctx.beginPath();
            ctx.arc(lastX, yOffset, 5, 0, Math.PI * 2);
            ctx.fill();
          }

          // 次のセグメントへ
          if (hitLeftEdge || hitRightEdge) {
            segmentIndex++;
            segmentStartIdx = i;
          }
        }
      }

      // 人物名ラベル
      ctx.fillStyle = person.color;
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(person.name, 10, baseY + 5);
    });
  }

  // 交点（出会い・追い越し）に縦線を描画
  const intersections = findIntersections();
  intersections.forEach((intersection) => {
    const x = padding + (intersection.position / state.distance) * lineWidth;

    // 色とラベルを交点タイプで分ける
    const color = intersection.type === 'meeting' ? '#ff6b6b' : '#4facfe';
    const label = intersection.type === 'meeting' ? '出会い' : '追い越し';

    // 縦線（点線）
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(x, 50);
    ctx.lineTo(x, h - 30);
    ctx.stroke();
    ctx.setLineDash([]);

    // 交点ラベル
    ctx.fillStyle = color;
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, h - 15);
    ctx.font = '10px Arial';
    ctx.fillText(`${intersection.position.toFixed(1)}m`, x, h - 3);
  });

  // 現在時刻表示
  ctx.fillStyle = '#333';
  ctx.font = 'bold 13px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(`時刻: ${state.currentTime.toFixed(2)}秒`, w - 10, h - 10);
}

// ===== グローバルに公開 =====
window.startAnimation = startAnimation;
window.pauseAnimation = pauseAnimation;
window.resetAnimation = resetAnimation;
window.updateSettings = updateSettings;
window.syncDistance = syncDistance;
window.syncSpeedA = syncSpeedA;
window.syncSpeedB = syncSpeedB;
window.updateTimeScale = updateTimeScale;
window.toggleGuide = toggleGuide;

// ===== ページ読み込み時に初期化 =====
window.addEventListener('DOMContentLoaded', init);
