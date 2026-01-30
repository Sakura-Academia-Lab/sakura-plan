/**
 * Animator.js - アニメーション描画クラス
 * 道路上の人物移動アニメーションと線分図の描画を担当
 */

import { ChartHelper } from '../utils/ChartHelper.js';

export class Animator {
  /**
   * @param {Object} canvases - Canvas要素オブジェクト
   * @param {HTMLCanvasElement} canvases.animation - アニメーション用Canvas
   * @param {HTMLCanvasElement} canvases.diagram - 線分図用Canvas
   */
  constructor(canvases) {
    this.animationCanvas = canvases.animation;
    this.diagramCanvas = canvases.diagram;
    this.animationCtx = null;
    this.diagramCtx = null;
  }

  /**
   * Canvasを初期化
   */
  setup() {
    this.animationCtx = ChartHelper.setupCanvas(this.animationCanvas);
    this.diagramCtx = ChartHelper.setupCanvas(this.diagramCanvas);
  }

  /**
   * アニメーション（道路と人物）を描画
   * @param {Simulation} simulation - シミュレーション状態
   * @param {Array<number>} positions - 各旅人の現在位置
   */
  drawAnimation(simulation, positions) {
    const canvas = this.animationCanvas;
    const ctx = this.animationCtx;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

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
    ctx.fillText(`${simulation.distance}m`, w - padding, roadY + roadHeight / 2 + 20);

    // 人物描画
    simulation.travelers.forEach((traveler, i) => {
      const pos = positions[i];
      const x = padding + (pos / simulation.distance) * roadWidth;
      const y = roadY + (i === 0 ? -15 : 15);

      // 円
      ctx.fillStyle = traveler.color;
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
      ctx.fillText(traveler.name, x, y + (i === 0 ? -20 : 30));

      // 速度表示
      ctx.font = '10px Arial';
      ctx.fillText(`${traveler.speed}m/s`, x, y + (i === 0 ? -30 : 40));
    });

    // 現在時刻表示
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`時刻: ${simulation.currentTime.toFixed(2)}秒`, 10, 20);
  }

  /**
   * 線分図（軌跡表示）を描画
   * @param {Simulation} simulation - シミュレーション状態
   */
  drawDiagram(simulation) {
    const canvas = this.diagramCanvas;
    const ctx = this.diagramCtx;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    // クリア
    ctx.clearRect(0, 0, w, h);

    // 背景
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);

    const padding = 60;
    const lineWidth = w - 2 * padding;
    const personABaseY = h * 0.3;
    const personBBaseY = h * 0.7;
    const segmentGap = 25;

    // 端点ラベル
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('A地点', padding, 20);
    ctx.fillText('0m', padding, 35);
    ctx.fillText('B地点', padding + lineWidth, 20);
    ctx.fillText(`${simulation.distance}m`, padding + lineWidth, 35);

    // 履歴から各人物の軌跡セグメントを描画
    if (simulation.history.time.length > 1) {
      simulation.travelers.forEach((traveler, personIdx) => {
        const baseY = personIdx === 0 ? personABaseY : personBBaseY;
        let segmentIndex = 0;
        let segmentStartIdx = 0;

        for (let i = 1; i < simulation.history.time.length; i++) {
          const pos_prev = simulation.history.positions[personIdx][i - 1];
          const pos_curr = simulation.history.positions[personIdx][i];

          // 反転検出
          const hitLeftEdge = pos_prev > 0.5 && pos_curr <= 0.5;
          const hitRightEdge = pos_prev < simulation.distance - 0.5 && pos_curr >= simulation.distance - 0.5;

          if (hitLeftEdge || hitRightEdge || i === simulation.history.time.length - 1) {
            const endIdx = i;
            const yOffset = baseY + (segmentIndex % 5) * segmentGap * (personIdx === 0 ? -1 : 1);

            ctx.strokeStyle = traveler.color;
            ctx.lineWidth = 3;
            ctx.beginPath();

            for (let j = segmentStartIdx; j <= endIdx; j++) {
              const pos = simulation.history.positions[personIdx][j];
              const x = padding + (pos / simulation.distance) * lineWidth;
              if (j === segmentStartIdx) {
                ctx.moveTo(x, yOffset);
              } else {
                ctx.lineTo(x, yOffset);
              }
            }
            ctx.stroke();

            // 端点マーカー
            if (hitLeftEdge || hitRightEdge || i === simulation.history.time.length - 1) {
              const lastPos = simulation.history.positions[personIdx][endIdx];
              const lastX = padding + (lastPos / simulation.distance) * lineWidth;
              ctx.fillStyle = traveler.color;
              ctx.beginPath();
              ctx.arc(lastX, yOffset, 5, 0, Math.PI * 2);
              ctx.fill();
            }

            if (hitLeftEdge || hitRightEdge) {
              segmentIndex++;
              segmentStartIdx = i;
            }
          }
        }

        // 人物名ラベル
        ctx.fillStyle = traveler.color;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(traveler.name, 10, baseY + 5);
      });

      // 交点に縦線を描画
      this.drawDiagramIntersections(ctx, simulation, padding, lineWidth, h);
    }

    // 現在時刻表示
    ctx.fillStyle = '#333';
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`時刻: ${simulation.currentTime.toFixed(2)}秒`, w - 10, h - 10);
  }

  /**
   * 線分図に交点を描画
   * @param {CanvasRenderingContext2D} ctx
   * @param {Simulation} simulation
   * @param {number} padding
   * @param {number} lineWidth
   * @param {number} h - Canvas高さ
   */
  drawDiagramIntersections(ctx, simulation, padding, lineWidth, h) {
    const intersections = simulation.findIntersections();

    intersections.forEach((intersection) => {
      const x = padding + (intersection.position / simulation.distance) * lineWidth;
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
  }

  /**
   * 全アニメーションを描画
   * @param {Simulation} simulation
   * @param {Array<number>} positions
   */
  render(simulation, positions) {
    this.drawAnimation(simulation, positions);
    this.drawDiagram(simulation);
  }
}
