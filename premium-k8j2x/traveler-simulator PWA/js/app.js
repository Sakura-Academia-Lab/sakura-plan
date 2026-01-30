// ===== 状態管理 =====
const state = {
  peopleCount: 2,  // 現在のモード（2または3）
  waypoints: [
    { id: 'A', name: 'A地点', distance: 0, fixed: true },
    { id: 'B', name: 'B地点', distance: 100, fixed: true }
  ],
  people: [
    {
      name: '人物A',
      speed: 4,
      startWaypoint: 'A',  // 開始地点ID
      endWaypoint: 'B',    // 終了地点ID
      color: '#ff5252',
      mode: 'roundTrip',
      workTime: 3,
      restTime: 3,
      onMeeting: 'pass'  // 出会い時の動作: 'pass'(通過) or 'reverse'(折り返す)
    },
    {
      name: '人物B',
      speed: 6,
      startWaypoint: 'B',  // 開始地点ID
      endWaypoint: 'A',    // 終了地点ID
      color: '#4facfe',
      mode: 'roundTrip',
      workTime: 3,
      restTime: 3,
      onMeeting: 'pass'
    },
    {
      name: '人物C',
      speed: 5,
      startWaypoint: 'A',  // 開始地点ID
      endWaypoint: 'B',    // 終了地点ID
      color: '#66bb6a',
      mode: 'roundTrip',
      workTime: 3,
      restTime: 3,
      onMeeting: 'pass'
    }
  ],
  isPlaying: false,
  currentTime: 0,  // 秒
  timeScale: 1.0,  // 再生速度倍率
  maxTime: 60,     // 最大時間
  history: {
    time: [],
    positions: [[], [], []],  // 3人分の配列
    distances: []
  }
};

// ===== ヘルパー関数：有効な人物を取得 =====
function getActivePeople() {
  return state.people.slice(0, state.peopleCount);
}

// ===== ヘルパー関数：地点IDから距離を取得 =====
function getWaypointDistance(waypointId) {
  const waypoint = state.waypoints.find(w => w.id === waypointId);
  return waypoint ? waypoint.distance : 0;
}

// ===== ヘルパー関数：全体の距離（最初の地点～最後の地点）を取得 =====
function getTotalDistance() {
  if (state.waypoints.length === 0) return 100;
  const distances = state.waypoints.map(w => w.distance);
  return Math.max(...distances) - Math.min(...distances);
}

// ===== ヘルパー関数：人物の移動範囲を取得 =====
function getPersonRange(person) {
  const startDist = getWaypointDistance(person.startWaypoint);
  const endDist = getWaypointDistance(person.endWaypoint);
  return {
    min: Math.min(startDist, endDist),
    max: Math.max(startDist, endDist),
    start: startDist,
    direction: startDist < endDist ? 1 : -1
  };
}

// ===== Canvas要素 =====
let animationCanvas, animationCtx;
let diagramCanvas, diagramCtx;
let timeDistanceCanvas, timeDistanceCtx;
let distanceDiffCanvas, distanceDiffCtx;
let animationFrameId = null;

// ===== リアルタイム状態（出会い時の反転管理） =====
let meetingReversals = [];  // { personIdx, meetTime, originalRange } の配列

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

  renderWaypointsList();
  updateWaypointSelects();

  // 初期値を設定
  document.getElementById('start-waypoint-a').value = state.people[0].startWaypoint;
  document.getElementById('end-waypoint-a').value = state.people[0].endWaypoint;
  document.getElementById('start-waypoint-b').value = state.people[1].startWaypoint;
  document.getElementById('end-waypoint-b').value = state.people[1].endWaypoint;

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

// ===== 地点リスト表示 =====
function renderWaypointsList() {
  const container = document.getElementById('waypoints-list');
  container.innerHTML = '';

  // 距離順にソート
  const sortedWaypoints = [...state.waypoints].sort((a, b) => a.distance - b.distance);

  sortedWaypoints.forEach((waypoint, index) => {
    const div = document.createElement('div');
    div.style.cssText = 'display: flex; align-items: center; gap: 5px; margin-bottom: 6px; padding: 6px; background: #f9f9f9; border-radius: 4px;';

    // 地点名ラベル
    const label = document.createElement('span');
    label.textContent = waypoint.name;
    label.style.cssText = 'min-width: 50px; font-size: 12px; font-weight: bold; color: #333;';
    div.appendChild(label);

    // 距離入力
    const input = document.createElement('input');
    input.type = 'number';
    input.value = waypoint.distance;
    input.min = 0;
    input.max = 500;
    input.step = 10;
    input.disabled = waypoint.fixed && index === 0; // A地点（最初）は常に0mで固定
    input.style.cssText = 'flex: 1; padding: 4px; font-size: 11px; border: 1px solid #ccc; border-radius: 3px;';
    input.onchange = () => updateWaypointDistance(waypoint.id, parseFloat(input.value));
    div.appendChild(input);

    const unit = document.createElement('span');
    unit.textContent = 'm';
    unit.style.cssText = 'font-size: 11px; color: #666;';
    div.appendChild(unit);

    // 削除ボタン（固定地点以外）
    if (!waypoint.fixed) {
      const btn = document.createElement('button');
      btn.textContent = '✕';
      btn.style.cssText = 'width: 24px; height: 24px; padding: 0; font-size: 14px; color: #666; background: white; border: 1px solid #ddd; border-radius: 3px; cursor: pointer;';
      btn.onclick = () => removeWaypoint(waypoint.id);
      div.appendChild(btn);
    }

    container.appendChild(div);
  });
}

// ===== 地点選択ドロップダウン更新 =====
function updateWaypointSelects() {
  const selectIds = ['start-waypoint-a', 'end-waypoint-a', 'start-waypoint-b', 'end-waypoint-b', 'start-waypoint-c', 'end-waypoint-c'];

  selectIds.forEach(selectId => {
    const select = document.getElementById(selectId);
    if (!select) return;

    const currentValue = select.value;
    select.innerHTML = '';

    state.waypoints.forEach(waypoint => {
      const option = document.createElement('option');
      option.value = waypoint.id;
      option.textContent = `${waypoint.name} (${waypoint.distance}m)`;
      select.appendChild(option);
    });

    // 前の選択を復元（存在すれば）
    if (currentValue && state.waypoints.find(w => w.id === currentValue)) {
      select.value = currentValue;
    }
  });
}

// ===== 地点追加 =====
function addWaypoint() {
  if (state.waypoints.length >= 10) {
    alert('地点は最大10個までです');
    return;
  }

  // 次のIDを決定（C, D, E...）
  const usedIds = state.waypoints.map(w => w.id);
  const availableIds = 'CDEFGHIJ'.split('').filter(id => !usedIds.includes(id));
  if (availableIds.length === 0) {
    alert('地点を追加できません');
    return;
  }

  const newId = availableIds[0];
  const newDistance = Math.floor((getWaypointDistance('A') + getWaypointDistance('B')) / 2);

  state.waypoints.push({
    id: newId,
    name: `${newId}地点`,
    distance: newDistance,
    fixed: false
  });

  renderWaypointsList();
  updateWaypointSelects();
  updateSettings();
}

// ===== 地点削除 =====
function removeWaypoint(id) {
  const waypoint = state.waypoints.find(w => w.id === id);
  if (!waypoint || waypoint.fixed) return;

  // この地点を使用している人物がいるかチェック
  const isUsed = state.people.some(p => p.startWaypoint === id || p.endWaypoint === id);
  if (isUsed) {
    alert('この地点は人物が使用しているため削除できません');
    return;
  }

  state.waypoints = state.waypoints.filter(w => w.id !== id);
  renderWaypointsList();
  updateWaypointSelects();
  updateSettings();
}

// ===== 地点の距離更新 =====
function updateWaypointDistance(id, distance) {
  const waypoint = state.waypoints.find(w => w.id === id);
  if (!waypoint) return;

  // A地点は常に0m
  if (waypoint.id === 'A') {
    waypoint.distance = 0;
    renderWaypointsList();
    return;
  }

  waypoint.distance = Math.max(0, Math.min(500, distance));
  renderWaypointsList();
  updateWaypointSelects();
  updateSettings();
}

// ===== 設定更新 =====
function updateSettings() {
  state.maxTime = parseFloat(document.getElementById('input-max-time').value);

  state.people[0].speed = parseFloat(document.getElementById('input-speed-a').value);
  state.people[0].startWaypoint = document.getElementById('start-waypoint-a').value;
  state.people[0].endWaypoint = document.getElementById('end-waypoint-a').value;
  state.people[0].mode = document.getElementById('mode-a').value;
  state.people[0].workTime = parseFloat(document.getElementById('work-time-a').value);
  state.people[0].restTime = parseFloat(document.getElementById('rest-time-a').value);
  state.people[0].onMeeting = document.getElementById('on-meeting-a').value;

  state.people[1].speed = parseFloat(document.getElementById('input-speed-b').value);
  state.people[1].startWaypoint = document.getElementById('start-waypoint-b').value;
  state.people[1].endWaypoint = document.getElementById('end-waypoint-b').value;
  state.people[1].mode = document.getElementById('mode-b').value;
  state.people[1].workTime = parseFloat(document.getElementById('work-time-b').value);
  state.people[1].restTime = parseFloat(document.getElementById('rest-time-b').value);
  state.people[1].onMeeting = document.getElementById('on-meeting-b').value;

  // 3人モードの場合、人物Cの設定も読み込む
  if (state.peopleCount === 3) {
    state.people[2].speed = parseFloat(document.getElementById('input-speed-c').value);
    state.people[2].startWaypoint = document.getElementById('start-waypoint-c').value;
    state.people[2].endWaypoint = document.getElementById('end-waypoint-c').value;
    state.people[2].mode = document.getElementById('mode-c').value;
    state.people[2].workTime = parseFloat(document.getElementById('work-time-c').value);
    state.people[2].restTime = parseFloat(document.getElementById('rest-time-c').value);
    state.people[2].onMeeting = document.getElementById('on-meeting-c').value;
  }

  if (!state.isPlaying) {
    resetAnimation();
  }
}

// ===== スライダー同期 =====
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

// ===== 位置計算（地点対応、移動モード対応） =====
function calculatePosition(person, time) {
  const mode = person.mode || 'roundTrip';
  const range = getPersonRange(person);

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
    return calculatePositionWithTime(person, totalWorkTime, range);
  }

  if (mode === 'stopAtWaypoint') {
    // 地点で停止モード：目標地点に到達したら停止
    const distance = Math.abs(range.max - range.min);
    const travelDistance = person.speed * time;
    if (travelDistance >= distance) {
      // 終了地点に到達
      return range.direction > 0 ? range.max : range.min;
    }
    // 移動中
    return range.start + range.direction * travelDistance;
  }

  // roundTripモード（往復）：端で反転
  return calculatePositionWithTime(person, time, range);
}

// ===== 位置計算ヘルパー（地点間往復対応） =====
function calculatePositionWithTime(person, time, range) {
  let pos = range.start;
  let currentDir = range.direction;
  let remainingTime = time;

  while (remainingTime > 0.001) {
    const nextPos = pos + currentDir * person.speed * remainingTime;

    if (nextPos >= range.min && nextPos <= range.max) {
      pos = nextPos;
      break;
    }

    let timeToEdge;
    if (currentDir === 1) {
      timeToEdge = (range.max - pos) / person.speed;
      pos = range.max;
    } else {
      timeToEdge = (pos - range.min) / person.speed;
      pos = range.min;
    }

    remainingTime -= timeToEdge;
    currentDir *= -1;
  }

  return Math.max(range.min, Math.min(range.max, pos));
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

  for (let personIdx = 0; personIdx < state.peopleCount; personIdx++) {
    const person = state.people[personIdx];
    const personRange = getPersonRange(person);

    for (let i = 1; i < state.history.time.length; i++) {
      const pos_prev = state.history.positions[personIdx][i - 1];
      const pos_curr = state.history.positions[personIdx][i];

      // 移動範囲の左端到達を検出（一方向のみ：近づく方向）
      if (pos_prev > personRange.min + 0.5 && pos_curr <= personRange.min + 0.5) {
        const t_prev = state.history.time[i - 1];
        const t_curr = state.history.time[i];
        const ratio = (pos_prev - personRange.min) / (pos_prev - pos_curr + 1e-10);
        const eventTime = t_prev + (t_curr - t_prev) * ratio;
        const edgeName = state.waypoints.find(w => w.distance === personRange.min)?.name || 'left';
        events.push({ time: eventTime, person: personIdx, edge: edgeName });
      }

      // 移動範囲の右端到達を検出（一方向のみ：近づく方向）
      if (pos_prev < personRange.max - 0.5 && pos_curr >= personRange.max - 0.5) {
        const t_prev = state.history.time[i - 1];
        const t_curr = state.history.time[i];
        const ratio = (personRange.max - pos_prev) / (pos_curr - pos_prev + 1e-10);
        const eventTime = t_prev + (t_curr - t_prev) * ratio;
        const edgeName = state.waypoints.find(w => w.distance === personRange.max)?.name || 'right';
        events.push({ time: eventTime, person: personIdx, edge: edgeName });
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
  state.history = {
    time: [],
    positions: Array(state.peopleCount).fill(null).map(() => []),
    distances: []
  };

  animate();
}

// ===== アニメーションループ =====
function animate() {
  if (!state.isPlaying) return;

  // 時間を進める (60fps想定)
  state.currentTime += 0.016 * state.timeScale;

  // 位置計算
  const activePeople = getActivePeople();
  const positions = activePeople.map(p => calculatePosition(p, state.currentTime));

  // 履歴保存（制限なし - 往復を記録）
  state.history.time.push(state.currentTime);
  positions.forEach((pos, i) => state.history.positions[i].push(pos));

  // 2人モードの場合のみ距離を記録
  if (state.peopleCount === 2) {
    state.history.distances.push(calculateDistance(positions[0], positions[1]));
  }

  // 描画
  drawAnimation(positions);
  drawDiagram();
  drawTimeDistanceChart();
  if (state.peopleCount === 2) {
    drawDistanceDiffChart();
  }

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

  // 地点マーカー
  const padding = 50;
  const roadWidth = w - 2 * padding;
  const totalDistance = getTotalDistance();
  const minDistance = Math.min(...state.waypoints.map(w => w.distance));

  state.waypoints.forEach(waypoint => {
    const x = padding + ((waypoint.distance - minDistance) / totalDistance) * roadWidth;

    // 地点の縦線
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, roadY - roadHeight / 2 - 10);
    ctx.lineTo(x, roadY + roadHeight / 2 + 10);
    ctx.stroke();

    // 地点名と距離
    ctx.fillStyle = '#333';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(waypoint.name, x, roadY + roadHeight / 2 + 25);
    ctx.font = '10px Arial';
    ctx.fillText(`${waypoint.distance}m`, x, roadY + roadHeight / 2 + 37);
  });

  // 人物描画
  const activePeople = getActivePeople();
  activePeople.forEach((person, i) => {
    const pos = positions[i];
    const x = padding + ((pos - minDistance) / totalDistance) * roadWidth;

    // Y位置を人数に応じて調整
    let y;
    if (state.peopleCount === 2) {
      y = roadY + (i === 0 ? -15 : 15);
    } else {
      // 3人の場合: 上(-25)、中央(0)、下(25)
      y = roadY + (i - 1) * 25;
    }

    // 円
    ctx.fillStyle = person.color;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();

    // 縁取り
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 名前
    ctx.fillStyle = '#333';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    const nameY = (state.peopleCount === 2) ? (y + (i === 0 ? -20 : 30)) : (y - 20);
    ctx.fillText(person.name, x, nameY);

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

  const totalDistance = getTotalDistance();
  const minDistance = Math.min(...state.waypoints.map(w => w.distance));

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
    const dist = minDistance + (i / 5) * totalDistance;
    ctx.fillText(dist.toFixed(0), marginLeft - 5, y + 4);
  }

  // データ描画
  if (state.history.time.length > 0) {
    const activePeople = getActivePeople();
    activePeople.forEach((person, i) => {
      ctx.strokeStyle = person.color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      for (let j = 0; j < state.history.time.length; j++) {
        const t = state.history.time[j];
        const pos = state.history.positions[i][j];
        const x = marginLeft + (t / state.maxTime) * graphW;
        const y = marginTop + graphH - ((pos - minDistance) / totalDistance) * graphH;

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

    // 交点表示（2人モードのみ）
    if (state.peopleCount === 2) {
      const intersections = findIntersections();
      let meetingCount = 0;
      let overtakingCount = 0;
      intersections.forEach((intersection) => {
        const ix = marginLeft + (intersection.time / state.maxTime) * graphW;
        const iy = marginTop + graphH - ((intersection.position - minDistance) / totalDistance) * graphH;

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

  const totalDistance = getTotalDistance();

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
    const dist = (i / 5) * totalDistance;
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
      const y = marginTop + graphH - (dist / totalDistance) * graphH;

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
      const edgeName = event.edge; // 地点名がそのまま入っている
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

  // 3人モードの場合、人物Cの間欠移動設定も処理
  if (state.peopleCount === 3) {
    const modeC = document.getElementById('mode-c').value;
    const intermittentC = document.getElementById('intermittent-c');
    intermittentC.style.display = modeC === 'intermittent' ? 'block' : 'none';
  }
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
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);

  const padding = 60;
  const lineWidth = w - 2 * padding;
  const segmentGap = 25; // セグメント間の間隔

  // 人数に応じてbaseYを動的に設定
  const baseYPositions = state.peopleCount === 2
    ? [h * 0.2, h * 0.8]  // 2人: 上と下
    : [h * 0.15, h * 0.5, h * 0.85];  // 3人: 上、中、下

  const totalDistance = getTotalDistance();
  const minDistance = Math.min(...state.waypoints.map(w => w.distance));

  // 地点ラベル表示
  ctx.fillStyle = '#333';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  state.waypoints.forEach(waypoint => {
    const x = padding + ((waypoint.distance - minDistance) / totalDistance) * lineWidth;
    ctx.fillText(waypoint.name, x, 20);
    ctx.font = '10px Arial';
    ctx.fillText(`${waypoint.distance}m`, x, 35);
    ctx.font = '12px Arial';
  });

  // 交点を取得して期間境界を作成（出会い/追い越しの時刻で分割） - 2人モードのみ
  const intersections = state.peopleCount === 2 ? findIntersections() : [];
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
    getActivePeople().forEach((person, personIdx) => {
      const baseY = baseYPositions[personIdx];
      const personRange = getPersonRange(person);
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

          // 反転検出（移動範囲の端に到達）
          const hitLeftEdge = pos_prev > personRange.min + 0.5 && pos_curr <= personRange.min + 0.5;
          const hitRightEdge = pos_prev < personRange.max - 0.5 && pos_curr >= personRange.max - 0.5;

          if (hitLeftEdge || hitRightEdge || i === periodEndIdx) {
            // サブセグメント描画
            const yOffset = baseY + (overallSegmentIndex % 5) * segmentGap * (personIdx === 0 ? 1 : -1);

            ctx.strokeStyle = periodColor;
            ctx.lineWidth = 3;
            ctx.beginPath();

            for (let j = subSegmentStartIdx; j <= i; j++) {
              const pos = state.history.positions[personIdx][j];
              const x = padding + ((pos - minDistance) / totalDistance) * lineWidth;
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
              const x1 = padding + ((pos1 - minDistance) / totalDistance) * lineWidth;
              const x2 = padding + ((pos2 - minDistance) / totalDistance) * lineWidth;
              drawArrowHead(ctx, x1, yOffset, x2, yOffset, periodColor);
            }

            // 端点マーカー
            if (hitLeftEdge || hitRightEdge || i === periodEndIdx) {
              const lastPos = state.history.positions[personIdx][i];
              const lastX = padding + ((lastPos - minDistance) / totalDistance) * lineWidth;
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

      // 人物名ラベル（開始地点に応じて左右に配置）
      ctx.fillStyle = person.color;
      ctx.font = 'bold 14px Arial';
      const startDistance = getWaypointDistance(person.startWaypoint);
      if (startDistance === minDistance) {
        // 最小距離（左端）から出発する場合は左側に表示
        ctx.textAlign = 'left';
        ctx.fillText(person.name, 10, baseY + 5);
      } else {
        // それ以外から出発する場合は右側に表示
        ctx.textAlign = 'right';
        ctx.fillText(person.name, w - 10, baseY + 5);
      }
    });
  }

  // 交点（出会い・追い越し）に縦線を描画（2人モードのみ）
  if (state.peopleCount === 2) {
    let meetingCount = 0;
    let overtakingCount = 0;
    intersections.forEach((intersection) => {
      const x = padding + ((intersection.position - minDistance) / totalDistance) * lineWidth;

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
  }

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

// ===== 人数モード切り替え =====
function switchPeopleMode(count) {
  if (state.isPlaying) {
    pauseAnimation();
  }

  state.peopleCount = count;

  // タブのアクティブ状態を更新
  const tabs = document.querySelectorAll('.people-mode-tabs .tab-btn');
  tabs.forEach((tab, index) => {
    if (index === count - 2) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  // 人物Cの設定UIの表示/非表示
  const personCControls = document.getElementById('person-c-controls');
  if (count === 3) {
    personCControls.style.display = 'block';
    document.body.classList.add('three-people-mode');
  } else {
    personCControls.style.display = 'none';
    document.body.classList.remove('three-people-mode');
  }

  // 地点選択ドロップダウンを更新
  updateWaypointSelects();

  // 人物Cの初期値を設定（3人モードの場合）
  if (count === 3) {
    const startWaypointC = document.getElementById('start-waypoint-c');
    const endWaypointC = document.getElementById('end-waypoint-c');
    if (startWaypointC && endWaypointC) {
      startWaypointC.value = state.people[2].startWaypoint;
      endWaypointC.value = state.people[2].endWaypoint;
    }
  }

  // アニメーションをリセット
  resetAnimation();
}

// ===== スライダー同期（人物C） =====
function syncSpeedC() {
  const val = document.getElementById('range-speed-c').value;
  document.getElementById('input-speed-c').value = val;
  updateSettings();
}

// ===== グローバルに公開 =====
window.startAnimation = startAnimation;
window.pauseAnimation = pauseAnimation;
window.resetAnimation = resetAnimation;
window.updateSettings = updateSettings;
window.syncMaxTime = syncMaxTime;
window.syncSpeedA = syncSpeedA;
window.syncSpeedB = syncSpeedB;
window.syncSpeedC = syncSpeedC;
window.updateTimeScale = updateTimeScale;
window.toggleGuide = toggleGuide;
window.toggleIntermittentSettings = toggleIntermittentSettings;
window.toggleControls = toggleControls;
window.switchPeopleMode = switchPeopleMode;
window.addWaypoint = addWaypoint;
window.removeWaypoint = removeWaypoint;

// ===== ページ読み込み時に初期化 =====
window.addEventListener('DOMContentLoaded', init);
