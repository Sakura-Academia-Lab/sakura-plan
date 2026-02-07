// ===== 多角形ユーティリティ =====

// 多角形の交差領域を計算
function getIntersection(shape1, shape2) {
  const poly1 = shape1.toPolygonClippingFormat();
  const poly2 = shape2.toPolygonClippingFormat();

  try {
    // UMDビルドではwindow.polygonClippingとして公開される
    const pc = window.polygonClipping || polygonClipping;
    if (!pc) {
      console.error('polygon-clipping library not loaded');
      return [];
    }
    const result = pc.intersection(poly1, poly2);
    return result; // [[[[x,y], [x,y], ...]]] 形式
  } catch (e) {
    console.error('Intersection calculation error:', e);
    console.error('poly1:', poly1);
    console.error('poly2:', poly2);
    return [];
  }
}

// 多角形の面積を計算（Shoelace formula）
function calculatePolygonArea(vertices) {
  if (!vertices || vertices.length < 3) return 0;

  let area = 0;
  const n = vertices.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += vertices[i][0] * vertices[j][1];
    area -= vertices[j][0] * vertices[i][1];
  }

  return Math.abs(area / 2);
}

// 交差領域の総面積を計算
function getOverlapArea(shape1, shape2) {
  const intersection = getIntersection(shape1, shape2);

  if (!intersection || intersection.length === 0) return 0;

  let totalArea = 0;

  // デバッグ: 交差領域の構造をログ出力（最初の1回のみ）
  if (!getOverlapArea.logged && intersection.length > 0) {
    console.log('Intersection structure:', JSON.stringify(intersection));
    console.log('Intersection depth:', intersection.length, intersection[0]?.length, intersection[0]?.[0]?.length);
    getOverlapArea.logged = true;
  }

  // polygon-clippingの結果形式: [ [ [[x,y], [x,y], ...] ] ]
  // つまり: MultiPolygon > Polygon (= ring配列)
  intersection.forEach(multiPolygon => {
    multiPolygon.forEach(polygon => {
      // polygon自体が頂点の配列（外側リング）
      const area = calculatePolygonArea(polygon);
      totalArea += area;
      if (!getOverlapArea.areaLogged) {
        console.log('Polygon vertices:', polygon.length, 'Area:', area);
        getOverlapArea.areaLogged = true;
      }
    });
  });

  return totalArea;
}

// 交差領域を描画
function drawIntersection(ctx, shape1, shape2, color = 'rgba(255, 215, 0, 0.7)') {
  const intersection = getIntersection(shape1, shape2);

  if (!intersection || intersection.length === 0) {
    // デバッグ: 交差なし
    return;
  }

  // デバッグ: 交差あり（最初の1回のみログ）
  if (!drawIntersection.logged) {
    console.log('Drawing intersection:', intersection);
    drawIntersection.logged = true;
  }

  ctx.fillStyle = color;

  intersection.forEach(multiPolygon => {
    multiPolygon.forEach(polygon => {
      polygon.forEach(ring => {
        if (ring.length < 3) return;

        ctx.beginPath();
        ctx.moveTo(ring[0][0], ring[0][1]);
        for (let i = 1; i < ring.length; i++) {
          ctx.lineTo(ring[i][0], ring[i][1]);
        }
        ctx.closePath();
        ctx.fill();
      });
    });
  });
}
