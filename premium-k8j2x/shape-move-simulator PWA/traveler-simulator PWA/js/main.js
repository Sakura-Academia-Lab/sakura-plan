/**
 * main.js - エントリーポイント
 * アプリケーション全体の初期化とイベントハンドリング
 */

import { Traveler } from './models/Traveler.js';
import { Simulation } from './models/Simulation.js';
import { Animator } from './views/Animator.js';
import { Charts } from './views/Charts.js';
import { ChartHelper } from './utils/ChartHelper.js';

// ===== アプリケーション状態 =====
let simulation = null;
let animator = null;
let charts = null;
let animationFrameId = null;

// ===== 初期化 =====
function init() {
  // 旅人を作成
  const travelers = [
    new Traveler({
      name: '人物A',
      speed: 4,
      startPos: 0,
      color: '#ff5252',
      direction: 1
    }),
    new Traveler({
      name: '人物B',
      speed: 6,
      startPos: 100,
      color: '#4facfe',
      direction: -1
    })
  ];

  // シミュレーションを作成
  simulation = new Simulation({
    distance: 100,
    travelers: travelers,
    maxTime: 60,
    timeScale: 1.0
  });

  // Canvas要素を取得
  const animationCanvas = document.getElementById('animation-canvas');
  const diagramCanvas = document.getElementById('diagram-canvas');
  const timeDistanceCanvas = document.getElementById('time-distance-chart');
  const distanceDiffCanvas = document.getElementById('distance-diff-chart');

  // Animatorを作成
  animator = new Animator({
    animation: animationCanvas,
    diagram: diagramCanvas
  });

  // Chartsを作成
  charts = new Charts({
    timeDistance: timeDistanceCanvas,
    distanceDiff: distanceDiffCanvas
  });

  // Canvas初期化
  animator.setup();
  charts.setup();

  // イベントリスナー設定
  window.addEventListener('resize', handleResize);

  // 初期設定を読み込み
  updateSettings();

  // 初期描画
  render();
}

// ===== リサイズ処理 =====
function handleResize() {
  animator.setup();
  charts.setup();

  if (!simulation.isPlaying) {
    render();
  }
}

// ===== 設定更新 =====
function updateSettings() {
  // 距離
  simulation.distance = parseFloat(document.getElementById('input-distance').value);

  // 人物A
  const travelerA = simulation.travelers[0];
  travelerA.name = document.getElementById('name-a').value;
  travelerA.speed = parseFloat(document.getElementById('input-speed-a').value);
  const startA = document.getElementById('start-a').value;
  travelerA.startPos = startA === '0' ? 0 : simulation.distance;
  travelerA.direction = startA === '0' ? 1 : -1;

  // 人物B
  const travelerB = simulation.travelers[1];
  travelerB.name = document.getElementById('name-b').value;
  travelerB.speed = parseFloat(document.getElementById('input-speed-b').value);
  const startB = document.getElementById('start-b').value;
  travelerB.startPos = startB === '0' ? 0 : simulation.distance;
  travelerB.direction = startB === '0' ? 1 : -1;

  if (!simulation.isPlaying) {
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
  simulation.timeScale = parseFloat(document.getElementById('time-scale').value);
}

// ===== アニメーション制御 =====
function startAnimation() {
  if (simulation.isPlaying) return;

  simulation.reset();
  simulation.play();

  animate();
}

function animate() {
  if (!simulation.isPlaying) return;

  // 時間を更新 (60fps想定)
  const positions = simulation.update(0.016);

  // 描画
  animator.render(simulation, positions);
  charts.render(simulation);

  // 継続判定
  if (simulation.isPlaying) {
    animationFrameId = requestAnimationFrame(animate);
  }
}

function pauseAnimation() {
  simulation.pause();
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

function resetAnimation() {
  pauseAnimation();
  simulation.reset();
  render();
}

// ===== 静止画描画 =====
function render() {
  const positions = simulation.getCurrentPositions();
  animator.render(simulation, positions);
  charts.render(simulation);
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
