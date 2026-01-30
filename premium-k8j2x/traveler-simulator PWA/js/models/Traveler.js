/**
 * Traveler.js - 旅人クラス
 * 旅人の状態と移動ロジックを管理
 */

export class Traveler {
  /**
   * @param {Object} config - 設定オブジェクト
   * @param {string} config.name - 旅人の名前
   * @param {number} config.speed - 速さ (m/s)
   * @param {number} config.startPos - 開始位置 (m)
   * @param {string} config.color - 表示色
   * @param {number} config.direction - 初期方向 (1: 右, -1: 左)
   */
  constructor({ name, speed, startPos, color, direction = 1 }) {
    this.name = name;
    this.speed = speed;
    this.startPos = startPos;
    this.color = color;
    this.direction = direction;
  }

  /**
   * 指定時刻における位置を計算（往復対応）
   * @param {number} time - 経過時間 (秒)
   * @param {number} maxDistance - 移動範囲の最大距離 (m)
   * @returns {number} 位置 (m)
   */
  getPosition(time, maxDistance) {
    let pos = this.startPos;
    let currentDir = this.direction;
    let remainingTime = time;

    // シミュレーション：時間経過に伴う位置と方向の変化
    while (remainingTime > 0.001) {
      // 現在の方向で進んだ場合の位置
      const nextPos = pos + currentDir * this.speed * remainingTime;

      // 端に到達しない場合
      if (nextPos >= 0 && nextPos <= maxDistance) {
        pos = nextPos;
        break;
      }

      // 端に到達する場合：到達時間を計算して反転
      let timeToEdge;
      if (currentDir === 1) {
        timeToEdge = (maxDistance - pos) / this.speed;
        pos = maxDistance;
      } else {
        timeToEdge = pos / this.speed;
        pos = 0;
      }

      remainingTime -= timeToEdge;
      currentDir *= -1; // 方向反転
    }

    // 境界チェック
    return Math.max(0, Math.min(maxDistance, pos));
  }

  /**
   * 設定を更新
   * @param {Object} updates - 更新する設定
   */
  updateConfig(updates) {
    Object.assign(this, updates);
  }
}
