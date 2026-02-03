// ===== 図形クラス =====
class Shape {
  constructor(type, config) {
    this.type = type;
    this.color = config.color || '#888';
    this.position = config.position || { x: 0, y: 0 };

    // 頂点を生成（相対座標）
    this.vertices = this.generateVertices(type, config);
  }

  // プリセット図形の頂点生成
  generateVertices(type, config) {
    switch(type) {
      case 'rectangle':
        return this.createRectangle(config.width || 100, config.height || 80);
      case 'square':
        return this.createSquare(config.size || 80);
      case 'triangle-right':
        return this.createRightTriangle(config.width || 100, config.height || 80);
      case 'triangle-equilateral':
        return this.createEquilateralTriangle(config.side || 100);
      case 'triangle-isosceles':
        return this.createIsoscelesTriangle(config.base || 100, config.height || 80);
      case 'trapezoid':
        return this.createTrapezoid(config.topWidth || 60, config.bottomWidth || 100, config.height || 80);
      case 'custom':
        return config.vertices || [];
      default:
        return this.createRectangle(100, 80);
    }
  }

  // 長方形
  createRectangle(w, h) {
    return [[0, 0], [w, 0], [w, h], [0, h]];
  }

  // 正方形
  createSquare(size) {
    return this.createRectangle(size, size);
  }

  // 直角三角形
  createRightTriangle(w, h) {
    return [[0, 0], [w, 0], [0, h]];
  }

  // 正三角形
  createEquilateralTriangle(side) {
    const h = (side * Math.sqrt(3)) / 2;
    return [[side/2, 0], [side, h], [0, h]];
  }

  // 二等辺三角形
  createIsoscelesTriangle(base, height) {
    return [[base/2, 0], [base, height], [0, height]];
  }

  // 台形
  createTrapezoid(topW, bottomW, h) {
    const offset = (bottomW - topW) / 2;
    return [[offset, 0], [offset + topW, 0], [bottomW, h], [0, h]];
  }

  // 絶対座標の頂点を取得（Canvas描画用）
  getAbsoluteVertices() {
    return this.vertices.map(([x, y]) => [
      x + this.position.x,
      y + this.position.y
    ]);
  }

  // polygon-clipping用のフォーマットに変換
  toPolygonClippingFormat() {
    const abs = this.getAbsoluteVertices();
    // 閉じた多角形にする（最初の点を末尾に追加）
    const closed = [...abs, abs[0]];
    return [[closed]]; // [[[[x1,y1], [x2,y2], ...]]] - polygon-clipping形式
  }

  // Canvas描画
  draw(ctx) {
    const abs = this.getAbsoluteVertices();
    if (abs.length < 3) return;

    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(abs[0][0], abs[0][1]);
    for (let i = 1; i < abs.length; i++) {
      ctx.lineTo(abs[i][0], abs[i][1]);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // パラメータ更新
  updateParams(config) {
    this.vertices = this.generateVertices(this.type, config);
  }
}
