/**
 * Charts.js - グラフ描画クラス
 * 時間-距離グラフと距離差グラフの描画を担当
 */

import { ChartHelper } from '../utils/ChartHelper.js';

export class Charts {
  /**
   * @param {Object} canvases - Canvas要素オブジェクト
   * @param {HTMLCanvasElement} canvases.timeDistance - 時間-距離グラフ用Canvas
   * @param {HTMLCanvasElement} canvases.distanceDiff - 距離差グラフ用Canvas
   */
  constructor(canvases) {
    this.timeDistanceCanvas = canvases.timeDistance;
    this.distanceDiffCanvas = canvases.distanceDiff;
    this.timeDistanceCtx = null;
    this.distanceDiffCtx = null;

    this.margins = {
      left: 50,
      right: 20,
      top: 15,
      bottom: 50
    };
  }

  /**
   * Canvasを初期化
   */
  setup() {
    this.timeDistanceCtx = ChartHelper.setupCanvas(this.timeDistanceCanvas);
    this.distanceDiffCtx = ChartHelper.setupCanvas(this.distanceDiffCanvas);
  }

  /**
   * グラフの描画領域を計算
   * @param {HTMLCanvasElement} canvas
   * @returns {Object} bounds - {left, top, width, height}
   */
  getBounds(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    return {
      left: this.margins.left,
      top: this.margins.top,
      width: w - this.margins.left - this.margins.right,
      height: h - this.margins.top - this.margins.bottom
    };
  }

  /**
   * 時間-距離グラフを描画
   * @param {Simulation} simulation - シミュレーション状態
   */
  drawTimeDistanceChart(simulation) {
    const canvas = this.timeDistanceCanvas;
    const ctx = this.timeDistanceCtx;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    const bounds = this.getBounds(canvas);

    // クリア
    ctx.clearRect(0, 0, w, h);

    // 背景
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(bounds.left, bounds.top, bounds.width, bounds.height);

    // グリッドと軸
    ChartHelper.drawGrid(ctx, bounds);
    ChartHelper.drawAxes(ctx, bounds);

    // 軸ラベル
    ChartHelper.drawXAxisLabel(ctx, bounds, '時間 (秒)', w);
    ChartHelper.drawYAxisLabel(ctx, bounds, '距離 (m)', h);

    // 目盛り
    ChartHelper.drawXTicks(ctx, bounds, simulation.maxTime, 5);
    ChartHelper.drawYTicks(ctx, bounds, simulation.distance, 5);

    // データ描画
    if (simulation.history.time.length > 0) {
      // 各旅人の軌跡を描画
      simulation.travelers.forEach((traveler, i) => {
        ChartHelper.drawLinePlot(
          ctx,
          bounds,
          simulation.history.time,
          simulation.history.positions[i],
          simulation.maxTime,
          simulation.distance,
          traveler.color
        );
      });

      // 現在時刻マーカー
      ctx.strokeStyle = '#9c27b0';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      const x = bounds.left + (simulation.currentTime / simulation.maxTime) * bounds.width;
      ctx.beginPath();
      ctx.moveTo(x, bounds.top);
      ctx.lineTo(x, bounds.top + bounds.height);
      ctx.stroke();
      ctx.setLineDash([]);

      // 交点表示
      this.drawIntersections(ctx, bounds, simulation, 'timeDistance');
    }
  }

  /**
   * 距離差グラフを描画
   * @param {Simulation} simulation - シミュレーション状態
   */
  drawDistanceDiffChart(simulation) {
    const canvas = this.distanceDiffCanvas;
    const ctx = this.distanceDiffCtx;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    const bounds = this.getBounds(canvas);

    // クリア
    ctx.clearRect(0, 0, w, h);

    // 背景
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(bounds.left, bounds.top, bounds.width, bounds.height);

    // グリッドと軸
    ChartHelper.drawGrid(ctx, bounds);
    ChartHelper.drawAxes(ctx, bounds);

    // 軸ラベル
    ChartHelper.drawXAxisLabel(ctx, bounds, '時間 (秒)', w);
    ChartHelper.drawYAxisLabel(ctx, bounds, '2人の距離 (m)', h);

    // 目盛り
    ChartHelper.drawXTicks(ctx, bounds, simulation.maxTime, 5);
    ChartHelper.drawYTicks(ctx, bounds, simulation.distance, 5);

    // データ描画
    if (simulation.history.time.length > 0) {
      // 距離差の軌跡を描画
      ChartHelper.drawLinePlot(
        ctx,
        bounds,
        simulation.history.time,
        simulation.history.distances,
        simulation.maxTime,
        simulation.distance,
        '#9c27b0'
      );

      // 現在時刻マーカー
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      const x = bounds.left + (simulation.currentTime / simulation.maxTime) * bounds.width;
      ctx.beginPath();
      ctx.moveTo(x, bounds.top);
      ctx.lineTo(x, bounds.top + bounds.height);
      ctx.stroke();
      ctx.setLineDash([]);

      // 交点表示
      this.drawIntersections(ctx, bounds, simulation, 'distanceDiff');

      // 端到達イベント表示
      this.drawEdgeEvents(ctx, bounds, simulation);
    }
  }

  /**
   * 交点を描画
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} bounds
   * @param {Simulation} simulation
   * @param {string} chartType - 'timeDistance' or 'distanceDiff'
   */
  drawIntersections(ctx, bounds, simulation, chartType) {
    const intersections = simulation.findIntersections();

    intersections.forEach((intersection) => {
      const ix = bounds.left + (intersection.time / simulation.maxTime) * bounds.width;
      const color = intersection.type === 'meeting' ? '#ff6b6b' : '#4facfe';
      const label = intersection.type === 'meeting' ? '出会い' : '追い越し';

      if (chartType === 'timeDistance') {
        const iy = bounds.top + bounds.height - (intersection.position / simulation.distance) * bounds.height;

        // 点線（縦・横）
        ChartHelper.drawVerticalDashedLine(ctx, bounds, intersection.time, simulation.maxTime, color);
        ChartHelper.drawHorizontalDashedLine(ctx, bounds, intersection.position, simulation.distance, color);

        // マーカーとラベル
        ChartHelper.drawCircleMarker(ctx, ix, iy, 5, color);
        ChartHelper.drawTextLabel(ctx, `${label}: ${intersection.time.toFixed(2)}秒`, ix + 10, iy - 10, color);
        ChartHelper.drawTextLabel(ctx, `距離: ${intersection.position.toFixed(1)}m`, ix + 10, iy + 5, color);
      } else {
        const iy = bounds.top + bounds.height; // 距離0なので下端

        // 点線（縦）
        ChartHelper.drawVerticalDashedLine(ctx, bounds, intersection.time, simulation.maxTime, color);

        // マーカーとラベル
        ChartHelper.drawCircleMarker(ctx, ix, iy, 5, color);
        ChartHelper.drawTextLabel(ctx, `${label}: ${intersection.time.toFixed(2)}秒`, ix + 10, iy - 10, color);
      }
    });
  }

  /**
   * 端到達イベントを描画
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} bounds
   * @param {Simulation} simulation
   */
  drawEdgeEvents(ctx, bounds, simulation) {
    const edgeEvents = simulation.findEdgeEvents();

    edgeEvents.forEach((event, idx) => {
      const ex = bounds.left + (event.time / simulation.maxTime) * bounds.width;

      // 点線（縦・緑）
      ctx.strokeStyle = '#4caf50';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(ex, bounds.top);
      ctx.lineTo(ex, bounds.top + bounds.height);
      ctx.stroke();
      ctx.setLineDash([]);

      // ラベル
      ctx.fillStyle = '#4caf50';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      const personName = simulation.travelers[event.person].name;
      const edgeName = event.edge === 'left' ? '左端' : '右端';
      const yOffset = bounds.top + 10 + (idx % 3) * 12;
      ctx.fillText(`${personName} ${edgeName}`, ex, yOffset);
    });
  }

  /**
   * 全グラフを描画
   * @param {Simulation} simulation
   */
  render(simulation) {
    this.drawTimeDistanceChart(simulation);
    this.drawDistanceDiffChart(simulation);
  }
}
