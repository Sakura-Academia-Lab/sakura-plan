/**
 * ChartHelper.js - グラフ描画の共通ユーティリティ
 * 軸、グリッド、ラベルなどの繰り返し処理を集約
 */

export class ChartHelper {
  /**
   * DPR対応のCanvas初期化
   * @param {HTMLCanvasElement} canvas
   */
  static setupCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    return ctx;
  }

  /**
   * グリッドを描画
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} bounds - {left, top, width, height}
   * @param {number} divisions - グリッド分割数
   */
  static drawGrid(ctx, bounds, divisions = 10) {
    const { left, top, width, height } = bounds;

    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;

    for (let i = 0; i <= divisions; i++) {
      const x = left + (i / divisions) * width;
      const y = top + (i / divisions) * height;

      // 縦線
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, top + height);
      ctx.stroke();

      // 横線
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(left + width, y);
      ctx.stroke();
    }
  }

  /**
   * 軸枠を描画
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} bounds - {left, top, width, height}
   */
  static drawAxes(ctx, bounds) {
    const { left, top, width, height } = bounds;

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(left, top, width, height);
  }

  /**
   * 軸ラベルを描画（X軸）
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} bounds
   * @param {string} label - ラベルテキスト
   * @param {number} canvasWidth - Canvas全体の幅
   */
  static drawXAxisLabel(ctx, bounds, label, canvasWidth) {
    ctx.fillStyle = '#333';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label, canvasWidth / 2, bounds.top + bounds.height + 35);
  }

  /**
   * 軸ラベルを描画（Y軸・縦書き）
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} bounds
   * @param {string} label - ラベルテキスト
   * @param {number} canvasHeight - Canvas全体の高さ
   */
  static drawYAxisLabel(ctx, bounds, label, canvasHeight) {
    ctx.save();
    ctx.fillStyle = '#333';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.translate(15, canvasHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(label, 0, 0);
    ctx.restore();
  }

  /**
   * X軸の目盛りを描画
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} bounds
   * @param {number} maxValue - 最大値
   * @param {number} divisions - 分割数
   * @param {string} unit - 単位
   */
  static drawXTicks(ctx, bounds, maxValue, divisions = 5, unit = '') {
    const { left, top, height } = bounds;

    ctx.fillStyle = '#333';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';

    for (let i = 0; i <= divisions; i++) {
      const x = left + (i / divisions) * bounds.width;
      const value = (i / divisions) * maxValue;
      ctx.fillText(value.toFixed(1) + unit, x, top + height + 15);
    }
  }

  /**
   * Y軸の目盛りを描画
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} bounds
   * @param {number} maxValue - 最大値
   * @param {number} divisions - 分割数
   * @param {string} unit - 単位
   */
  static drawYTicks(ctx, bounds, maxValue, divisions = 5, unit = '') {
    const { left, top, height } = bounds;

    ctx.fillStyle = '#333';
    ctx.font = '10px Arial';
    ctx.textAlign = 'right';

    for (let i = 0; i <= divisions; i++) {
      const y = top + height - (i / divisions) * height;
      const value = (i / divisions) * maxValue;
      ctx.fillText(value.toFixed(0) + unit, left - 5, y + 4);
    }
  }

  /**
   * データポイント（折れ線グラフ）を描画
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} bounds
   * @param {Array<number>} xData - X軸データ配列
   * @param {Array<number>} yData - Y軸データ配列
   * @param {number} xMax - X軸の最大値
   * @param {number} yMax - Y軸の最大値
   * @param {string} color - 線の色
   * @param {number} lineWidth - 線幅
   */
  static drawLinePlot(ctx, bounds, xData, yData, xMax, yMax, color, lineWidth = 2) {
    const { left, top, width, height } = bounds;

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();

    for (let i = 0; i < xData.length; i++) {
      const x = left + (xData[i] / xMax) * width;
      const y = top + height - (yData[i] / yMax) * height;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  }

  /**
   * 点線を描画（縦）
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} bounds
   * @param {number} xValue - X軸上の値
   * @param {number} xMax - X軸の最大値
   * @param {string} color - 線の色
   */
  static drawVerticalDashedLine(ctx, bounds, xValue, xMax, color) {
    const { left, top, width, height } = bounds;
    const x = left + (xValue / xMax) * width;

    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, top + height);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /**
   * 点線を描画（横）
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} bounds
   * @param {number} yValue - Y軸上の値
   * @param {number} yMax - Y軸の最大値
   * @param {string} color - 線の色
   */
  static drawHorizontalDashedLine(ctx, bounds, yValue, yMax, color) {
    const { left, top, width, height } = bounds;
    const y = top + height - (yValue / yMax) * height;

    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(left + width, y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /**
   * 円マーカーを描画
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x - X座標
   * @param {number} y - Y座標
   * @param {number} radius - 半径
   * @param {string} color - 色
   */
  static drawCircleMarker(ctx, x, y, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * テキストラベルを描画
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} text - テキスト
   * @param {number} x - X座標
   * @param {number} y - Y座標
   * @param {string} color - 色
   * @param {string} align - テキスト整列 ('left', 'center', 'right')
   */
  static drawTextLabel(ctx, text, x, y, color, align = 'left') {
    ctx.fillStyle = color;
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
  }
}
