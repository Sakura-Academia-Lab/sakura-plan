# 更新履歴 - sakura-academia

このファイルは、sakura-academia 内のファイルが更新された際に自動で記録されます。

---

## 2026年1月

### 2026-01-17

| 時刻 | 更新ファイル | 更新内容 |
| --- | --- | --- |
| 23:21 | `.agent/workflows/skill.md` | 注釈ルールを追加 |
| 23:21 | `UPDATE_LOG.md` | 更新履歴ファイルを新規作成 |

### 2026-01-20

| 時刻 | 更新ファイル | 更新内容 |
| --- | --- | --- |
| 11:55 | `apps/3D Shape Slicer/index.html` | Ver 1.2へ更新（スマホ版UIレイアウト改善） |
| 11:55 | `apps/3D Shape Slicer/js/app.min.js` | スマホ版UI改善ロジックの適用 |
| 11:55 | `apps/index.html` | 公開バージョン情報の更新 (Ver 1.2) |

### 2026-01-25

| 時刻 | 更新ファイル | 更新内容 |
| --- | --- | --- |
| 10:25 | `apps/3D Shape Slicer/js/app.js` | 極点選択不可の不具合修正 (Ver 1.3) |
| 10:25 | `apps/3D Shape Slicer/index.html` | Ver 1.3へ更新 |
| 10:25 | `apps/index.html` | 3D Shape Slicer Ver 1.3情報を反映 |

### 2026-01-26

| 時刻 | 更新ファイル | 更新内容 |
| --- | --- | --- |
| 14:05 | `apps/3D Shape Slicer/test/` | 切断点のドラッグ移動機能を追加（テスト環境で検証） |
| 14:10 | `apps/3D Shape Slicer/js/app.js` | ドラッグ移動機能、反転状態維持、ポイント削除判定の改善 (Ver 1.4) |
| 14:10 | `apps/3D Shape Slicer/index.html` | Ver 1.4へ更新、使い方の説明追加 |
| 14:10 | `apps/3D Shape Slicer/sns_update.md` | Ver 1.4 告知内容を更新 |
| 14:10 | `apps/index.html` | Ver 1.4 情報を反映 |

---

### 2026-01-27

| 時刻 | 更新ファイル | 更新内容 |
| --- | --- | --- |
| 10:50 | `apps/shadow-simulator/` | Ver 2.2 床との同質化（物体を床と同じマテリアル・色に変更し影を強調） |
| 10:45 | `apps/shadow-simulator/` | Ver 2.1 初期配置の調整（物体を原点付近に出現するように変更） |
| 10:40 | `apps/shadow-simulator/` | Ver 2.0 究極の視認性（精密1cmグリッド、超高コントラスト影、初期高度調整） |
| 10:35 | `apps/shadow-simulator/` | Ver 1.9 方眼テクスチャ実装（物体表面にグリッドを表示し視認性向上） |
| 10:30 | `apps/shadow-simulator/` | Ver 1.8 視認性の究極改善（sRGB対応、HemisphereLight導入） |
| 10:25 | `apps/shadow-simulator/` | Ver 1.7 視認性の徹底改善（ライティングの見直し、白の強調） |
| 10:20 | `apps/shadow-simulator/` | Ver 1.6 影の視認性向上（物体カラーを白に変更、環境光調整） |
| 09:17 | `apps/shadow-simulator/` | Ver 1.1-1.5 機能改善（光源水平移動、ファイル整理、スマホ操作修正） |

### 2026-01-29

| 時刻 | 更新ファイル | 更新内容 |
| --- | --- | --- |
| 00:01 | `apps/shadow-simulator/index.html` | 物体の幅を0にできるように変更（最小値を1から0に修正） |
| 00:31 | `apps/traveler-simulator/` | Ver 1.0 旅人算シミュレーター新規作成（アニメーション、時間-距離グラフ、距離差グラフ） |
| 00:31 | `apps/index.html` | 旅人算シミュレーター Ver 1.0 を追加 |
| 00:37 | `apps/traveler-simulator/js/app.js` | 往復動作を実装、グラフの下部マージン拡大で視認性向上 |
| 00:40 | `apps/traveler-simulator/js/app.js` | 往復後のグラフ描画を修正（履歴制限を削除） |
| 00:40 | `apps/traveler-simulator/index.html` | グラフタイトルを縦書きに変更 |
| 00:40 | `apps/traveler-simulator/css/style.css` | グラフタイトルを左側に縦書き配置、上部マージン削減 |
| 00:48 | `apps/traveler-simulator/css/style.css` | 右パネルにスクロール機能を追加、グラフコンテナの高さを固定 |
| 00:48 | `apps/traveler-simulator/js/app.js` | 交点検出機能を実装、時間-距離グラフと距離差グラフに交点を点線と数値で表示 |
| 00:52 | `apps/traveler-simulator/js/app.js` | 端到達イベント検出機能を追加、距離差グラフに人物が端に到達した時刻を緑の点線で表示 |
| 01:15 | `apps/traveler-simulator/js/app.js` | 交点検出の改善（全ての交点を表示）、端到達イベントの重複削除、toggleGuide()関数実装 |
| 01:15 | `apps/traveler-simulator/js/app.js` | 線分図描画機能を実装（drawDiagram関数）、下部キャンバスに2人の位置関係を線分図で表示 |
| 01:20 | `apps/traveler-simulator/css/style.css` | 上下のアニメーションエリアを同じ高さ（50%ずつ）に変更 |
| 01:20 | `apps/traveler-simulator/js/app.js` | 線分図を軌跡図に変更（通った道を線で表示、折り返しごとに位置をずらして描画） |
| 01:25 | `apps/traveler-simulator/js/app.js` | 軌跡図に出会った位置の縦線マーカーを追加（赤い点線で表示） |
| 01:30 | `apps/traveler-simulator/js/app.js` | 出会いと追い越しを判定・区別（出会い:赤、追い越し:青）し、全グラフに反映 |
| 02:00 | `apps/traveler-simulator/js/` | **Ver 2.0 全面リファクタリング** - クラス設計に移行 |
| 02:00 | `js/models/Traveler.js` | 旅人クラスを新規作成（位置計算、往復ロジック） |
| 02:00 | `js/models/Simulation.js` | シミュレーション状態管理クラスを新規作成（履歴、交点検出、端到達イベント） |
| 02:00 | `js/utils/ChartHelper.js` | グラフ描画共通ユーティリティを新規作成（グリッド、軸、ラベル描画） |
| 02:00 | `js/views/Charts.js` | グラフ描画クラスを新規作成（時間-距離グラフ、距離差グラフ） |
| 02:00 | `js/views/Animator.js` | アニメーション描画クラスを新規作成（道路アニメ、線分図） |
| 02:00 | `js/main.js` | エントリーポイントを新規作成（ES Modules対応） |
| 02:00 | `index.html` | Ver 2.0 - ES Modulesに対応、main.jsを読み込み |
| 03:00 | `apps/traveler-simulator/` | **Ver 1.6 移動モード切り替え機能** - 往復/突き抜け/端で停止の3モード追加 |
| 03:00 | `index.html` | 各人物に動作モード選択UIを追加（往復/突き抜け/端で停止） |
| 03:00 | `js/app.js` | calculatePosition関数を移動モード対応に拡張、範囲外の人物は非表示に |
| 22:05 | `apps/premium-k8j2x/` | Traveler Simulator PRO をデプロイ（最新の旅人算シミュレーター反映） |

---
