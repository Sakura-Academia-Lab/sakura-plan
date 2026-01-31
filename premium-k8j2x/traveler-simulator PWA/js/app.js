// ===== 状態管理 =====
const state = {
  distance: 100,  // 両端の距離 (m)
  people: [
    { name: '人物A', speed: 4, startPos: 0, color: '#ff5252', direction: 1, currentDirection: 1, mode: 'roundTrip', workTime: 3, restTime: 3 },
    { name: '人物B', speed: 6, startPos: 100, color: '#4facfe', direction: -1, currentDirection: -1, mode: 'roundTrip', workTime: 3, restTime: 3 }
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

  toggleIntermittentSettings();
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
  state.maxTime = parseFloat(document.getElementById('input-max-time').value);

  state.people[0].speed = parseFloat(document.getElementById('input-speed-a').value);
  const startA = document.getElementById('start-a').value;
  state.people[0].startPos = startA === '0' ? 0 : state.distance;
  state.people[0].direction = startA === '0' ? 1 : -1;
  state.people[0].mode = document.getElementById('mode-a').value;
  state.people[0].workTime = parseFloat(document.getElementById('work-time-a').value);
  state.people[0].restTime = parseFloat(document.getElementById('rest-time-a').value);

  state.people[1].speed = parseFloat(document.getElementById('input-speed-b').value);
  const startB = document.getElementById('start-b').value;
  state.people[1].startPos = startB === '0' ? 0 : state.distance;
  state.people[1].direction = startB === '0' ? 1 : -1;
  state.people[1].mode = document.getElementById('mode-b').value;
  state.people[1].workTime = parseFloat(document.getElementById('work-time-b').value);
  state.people[1].restTime = parseFloat(document.getElementById('rest-time-b').value);

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

function syncMaxTime() {
  const val = document.getElementById('range-max-time').value;
  document.getElementById('input-max-time').value = val;
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

// ===== 位置計算（移動モード対応） =====
function calculatePosition(person, time) {
  const mode = person.mode || 'roundTrip';
  let pos = person.startPos;
  let currentDir = person.direction;

  if (mode === 'intermittent') {
    // 間欠移動モード：移動と休憩を繰り返す
    const workTime = person.workTime || 3;
    const restTime = person.restTime || 3;
    const cycleTime = workTime + restTime;

    let totalWorkTime = 0; // 実際に移動した累積時間
    let currentTime = 0;

    while (currentTime < time) {
      const timeInCycle = currentTime % cycleTime;
      const remainingTime = time - currentTime;

      if (timeInCycle < workTime) {
        // 移動中
        const workRemaining = Math.min(workTime - timeInCycle, remainingTime);
        totalWorkTime += workRemaining;
        currentTime += workRemaining;
      } else {
        // 休憩中
        const restRemaining = Math.min(cycleTime - timeInCycle, remainingTime);
        currentTime += restRemaining;
      }
    }

    // 累積移動時間で位置を計算（往復対応）
    return calculatePositionWithTime(person, totalWorkTime);
  }

  if (mode === 'stopAtEdge') {
    // 端で停止モード：範囲内で進み、端に到達したら停止
    pos = person.startPos + currentDir * person.speed * time;
    return Math.max(0, Math.min(state.distance, pos));
  }

  // roundTripモード（往復）：端で反転
  return calculatePositionWithTime(person, time);
}

// ===== 位置計算ヘルパー（往復対応） =====
function calculatePositionWithTime(person, time) {
  let pos = person.startPos;
  let currentDir = person.direction;
  let remainingTime = time;

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
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(0.5, '#1e293b');
  grad.addColorStop(1, '#0f172a');
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

  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('0m', padding, roadY + roadHeight / 2 + 20);
  ctx.fillText(`${state.distance}m`, w - padding, roadY + roadHeight / 2 + 20);

  // 人物描画
  state.people.forEach((person, i) => {
    const pos = positions[i];
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
    let modeLabel = '往復';
    if (person.mode === 'stopAtEdge') modeLabel = '停止';
    if (person.mode === 'intermittent') {
      const cycleTime = person.workTime + person.restTime;
      const timeInCycle = state.currentTime % cycleTime;
      modeLabel = timeInCycle < person.workTime ? '移動中' : '休憩中';
    }
    ctx.fillText(`${person.speed}m/s (${modeLabel})`, x, y + (i === 0 ? -30 : 40));
  });

  // 現在時刻表示
  ctx.fillStyle = '#fbbf24';
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
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(marginLeft, marginTop, graphW, graphH);

  // グリッド
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
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
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.strokeRect(marginLeft, marginTop, graphW, graphH);

  // 軸ラベル
  ctx.fillStyle = '#94a3b8';
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
    let meetingCount = 0;
    let overtakingCount = 0;
    intersections.forEach((intersection) => {
      const ix = marginLeft + (intersection.time / state.maxTime) * graphW;
      const iy = marginTop + graphH - (intersection.position / state.distance) * graphH;

      // 色とラベルを交点タイプで分ける
      const color = intersection.type === 'meeting' ? '#ff6b6b' : '#4facfe';
      if (intersection.type === 'meeting') {
        meetingCount++;
      } else {
        overtakingCount++;
      }
      const label = intersection.type === 'meeting'
        ? `出会い（${meetingCount}回目）`
        : `追い越し（${overtakingCount}回目）`;

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
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(marginLeft, marginTop, graphW, graphH);

  // グリッド
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
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
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.strokeRect(marginLeft, marginTop, graphW, graphH);

  // 軸ラベル
  ctx.fillStyle = '#94a3b8';
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
    let meetingCount = 0;
    let overtakingCount = 0;
    intersections.forEach((intersection) => {
      const ix = marginLeft + (intersection.time / state.maxTime) * graphW;
      const iy = marginTop + graphH; // 距離0なので下端

      // 色とラベルを交点タイプで分ける
      const color = intersection.type === 'meeting' ? '#ff6b6b' : '#4facfe';
      if (intersection.type === 'meeting') {
        meetingCount++;
      } else {
        overtakingCount++;
      }
      const label = intersection.type === 'meeting'
        ? `出会い（${meetingCount}回目）`
        : `追い越し（${overtakingCount}回目）`;

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

// ===== 間欠移動設定の表示/非表示 =====
function toggleIntermittentSettings() {
  const modeA = document.getElementById('mode-a').value;
  const modeB = document.getElementById('mode-b').value;
  const intermittentA = document.getElementById('intermittent-a');
  const intermittentB = document.getElementById('intermittent-b');

  intermittentA.style.display = modeA === 'intermittent' ? 'block' : 'none';
  intermittentB.style.display = modeB === 'intermittent' ? 'block' : 'none';
}

// ===== 矢印描画ヘルパー =====
function drawArrowHead(ctx, x1, y1, x2, y2, color) {
  const headLength = 10;
  const angle = Math.atan2(y2 - y1, x2 - x1);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headLength * Math.cos(angle - Math.PI / 6),
    y2 - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    x2 - headLength * Math.cos(angle + Math.PI / 6),
    y2 - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
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
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, w, h);

  const padding = 60;
  const lineWidth = w - 2 * padding;
  const isMobile = window.innerWidth <= 768;

  // 【モバイル調整】線分図の上下余白（数値を小さくすると余白が減る）
  const personABaseY = isMobile ? h * 0.25 : h * 0.2; // 人物Aの基準Y座標（上側）：0.25を小さくすると上余白が減る
  const personBBaseY = isMobile ? h * 0.7 : h * 0.8; // 人物Bの基準Y座標（下側）：0.7を大きくすると下余白が減る
  const segmentGap = 25; // セグメント間の間隔

  // 【モバイル調整】ラベル位置（数値を小さくするとラベルが上に移動し、余白が減る）
  // 端点ラベル（共通）
  ctx.fillStyle = '#fbbf24';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  const labelTopY = isMobile ? 15 : 20; // A地点/B地点のY座標
  const labelBottomY = isMobile ? 28 : 35; // 0m/100mのY座標
  ctx.fillText('A地点', padding, labelTopY);
  ctx.fillText('0m', padding, labelBottomY);
  ctx.fillText('B地点', padding + lineWidth, labelTopY);
  ctx.fillText(`${state.distance}m`, padding + lineWidth, labelBottomY);

  // 交点を取得して期間境界を作成（出会い/追い越しの時刻で分割）
  const intersections = findIntersections();
  const periodBoundaries = [0, ...intersections.map(i => i.time).sort((a, b) => a - b)];
  if (state.history.time.length > 0) {
    periodBoundaries.push(state.history.time[state.history.time.length - 1]);
  }

  // 期間に応じた色を生成
  function getPeriodColor(periodIndex) {
    const hue = (periodIndex * 60) % 360;
    return `hsl(${hue}, 70%, 55%)`;
  }

  // 履歴から各人物の軌跡を期間ごとに描画
  if (state.history.time.length > 1) {
    state.people.forEach((person, personIdx) => {
      const baseY = personIdx === 0 ? personABaseY : personBBaseY;
      let overallSegmentIndex = 0; // 全体でのセグメントインデックス（Y位置調整用）

      // 各期間について
      for (let periodIdx = 0; periodIdx < periodBoundaries.length - 1; periodIdx++) {
        const periodStartTime = periodBoundaries[periodIdx];
        const periodEndTime = periodBoundaries[periodIdx + 1];

        // この期間の履歴インデックス範囲を取得
        let periodStartIdx = -1;
        let periodEndIdx = -1;

        for (let i = 0; i < state.history.time.length; i++) {
          if (periodStartIdx === -1 && state.history.time[i] >= periodStartTime) {
            periodStartIdx = i;
          }
          if (state.history.time[i] <= periodEndTime) {
            periodEndIdx = i;
          }
        }

        if (periodStartIdx === -1 || periodEndIdx === -1 || periodStartIdx > periodEndIdx) {
          continue;
        }

        const periodColor = getPeriodColor(periodIdx);

        // この期間内で反転を検出しながらサブセグメントを描画
        let subSegmentStartIdx = periodStartIdx;

        for (let i = periodStartIdx + 1; i <= periodEndIdx; i++) {
          const pos_prev = state.history.positions[personIdx][i - 1];
          const pos_curr = state.history.positions[personIdx][i];

          // 反転検出（端に到達）
          const hitLeftEdge = pos_prev > 0.5 && pos_curr <= 0.5;
          const hitRightEdge = pos_prev < state.distance - 0.5 && pos_curr >= state.distance - 0.5;

          if (hitLeftEdge || hitRightEdge || i === periodEndIdx) {
            // サブセグメント描画
            const yOffset = baseY + (overallSegmentIndex % 5) * segmentGap * (personIdx === 0 ? 1 : -1);

            ctx.strokeStyle = periodColor;
            ctx.lineWidth = 3;
            ctx.beginPath();

            for (let j = subSegmentStartIdx; j <= i; j++) {
              const pos = state.history.positions[personIdx][j];
              const x = padding + (pos / state.distance) * lineWidth;
              if (j === subSegmentStartIdx) {
                ctx.moveTo(x, yOffset);
              } else {
                ctx.lineTo(x, yOffset);
              }
            }
            ctx.stroke();

            // 矢印を描画
            if (i > subSegmentStartIdx) {
              const pos1 = state.history.positions[personIdx][i - 1];
              const pos2 = state.history.positions[personIdx][i];
              const x1 = padding + (pos1 / state.distance) * lineWidth;
              const x2 = padding + (pos2 / state.distance) * lineWidth;
              drawArrowHead(ctx, x1, yOffset, x2, yOffset, periodColor);
            }

            // 端点マーカー
            if (hitLeftEdge || hitRightEdge || i === periodEndIdx) {
              const lastPos = state.history.positions[personIdx][i];
              const lastX = padding + (lastPos / state.distance) * lineWidth;
              ctx.fillStyle = periodColor;
              ctx.beginPath();
              ctx.arc(lastX, yOffset, 5, 0, Math.PI * 2);
              ctx.fill();
            }

            // 次のサブセグメントへ
            if (hitLeftEdge || hitRightEdge) {
              overallSegmentIndex++;
              subSegmentStartIdx = i;
            }
          }
        }
      }

      // 人物名ラベル（開始位置に応じて左右に配置）
      ctx.fillStyle = person.color;
      ctx.font = 'bold 14px Arial';
      if (person.startPos === 0) {
        // 左端から出発する場合は左側に表示
        ctx.textAlign = 'left';
        ctx.fillText(person.name, 10, baseY + 5);
      } else {
        // 右端から出発する場合は右側に表示
        ctx.textAlign = 'right';
        ctx.fillText(person.name, w - 10, baseY + 5);
      }
    });
  }

  // 交点（出会い・追い越し）に縦線を描画
  let meetingCount = 0;
  let overtakingCount = 0;
  intersections.forEach((intersection) => {
    const x = padding + (intersection.position / state.distance) * lineWidth;

    // 色とラベルを交点タイプで分ける
    const color = intersection.type === 'meeting' ? '#ff6b6b' : '#4facfe';
    if (intersection.type === 'meeting') {
      meetingCount++;
    } else {
      overtakingCount++;
    }
    const label = intersection.type === 'meeting'
      ? `出会い（${meetingCount}回目）`
      : `追い越し（${overtakingCount}回目）`;

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
window.syncDistance = syncDistance;
window.syncMaxTime = syncMaxTime;
window.syncSpeedA = syncSpeedA;
window.syncSpeedB = syncSpeedB;
window.updateTimeScale = updateTimeScale;
window.toggleGuide = toggleGuide;
window.toggleIntermittentSettings = toggleIntermittentSettings;
window.toggleControls = toggleControls;

// ===== ページ読み込み時に初期化 =====
window.addEventListener('DOMContentLoaded', init);
