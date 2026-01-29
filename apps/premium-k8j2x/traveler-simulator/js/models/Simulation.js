/**
 * Simulation.js - シミュレーション状態管理クラス
 * 全体の状態、履歴、交点検出などを管理
 */

export class Simulation {
  /**
   * @param {Object} config - 設定オブジェクト
   * @param {number} config.distance - 両端の距離 (m)
   * @param {Array<Object>} config.travelers - 旅人の設定配列
   * @param {number} config.maxTime - 最大シミュレーション時間 (秒)
   * @param {number} config.timeScale - 再生速度倍率
   */
  constructor({ distance, travelers, maxTime = 60, timeScale = 1.0 }) {
    this.distance = distance;
    this.maxTime = maxTime;
    this.timeScale = timeScale;
    this.currentTime = 0;
    this.isPlaying = false;

    // 履歴データ
    this.history = {
      time: [],
      positions: [],  // 各旅人の位置履歴
      distances: []   // 旅人間の距離履歴
    };

    // 旅人の初期化（外部でTravelerインスタンスとして渡される想定）
    this.travelers = travelers;

    // 履歴の初期化
    this.resetHistory();
  }

  /**
   * 履歴をリセット
   */
  resetHistory() {
    this.history.time = [];
    this.history.positions = this.travelers.map(() => []);
    this.history.distances = [];
  }

  /**
   * シミュレーションをリセット
   */
  reset() {
    this.currentTime = 0;
    this.isPlaying = false;
    this.resetHistory();
  }

  /**
   * 時間を更新し、現在の位置を計算
   * @param {number} deltaTime - 経過時間 (秒)
   * @returns {Array<number>} 各旅人の現在位置
   */
  update(deltaTime) {
    if (!this.isPlaying) return this.getCurrentPositions();

    this.currentTime += deltaTime * this.timeScale;

    // 終了判定
    if (this.currentTime >= this.maxTime) {
      this.isPlaying = false;
      this.currentTime = this.maxTime;
    }

    // 位置を計算して履歴に保存
    const positions = this.getCurrentPositions();
    this.history.time.push(this.currentTime);
    positions.forEach((pos, i) => this.history.positions[i].push(pos));

    // 旅人間の距離を計算（2人の場合のみ）
    if (this.travelers.length === 2) {
      const distance = Math.abs(positions[0] - positions[1]);
      this.history.distances.push(distance);
    }

    return positions;
  }

  /**
   * 現在の各旅人の位置を取得
   * @returns {Array<number>} 各旅人の位置
   */
  getCurrentPositions() {
    return this.travelers.map(traveler =>
      traveler.getPosition(this.currentTime, this.distance)
    );
  }

  /**
   * 交点（出会い・追い越し）を検出
   * @returns {Array<Object>} 交点の配列 [{time, position, type}]
   */
  findIntersections() {
    const intersections = [];

    if (this.history.time.length < 2 || this.travelers.length !== 2) {
      return intersections;
    }

    for (let i = 1; i < this.history.time.length; i++) {
      const pos0_prev = this.history.positions[0][i - 1];
      const pos0_curr = this.history.positions[0][i];
      const pos1_prev = this.history.positions[1][i - 1];
      const pos1_curr = this.history.positions[1][i];

      // 2つの線分が交差するか判定
      const diff_prev = pos0_prev - pos1_prev;
      const diff_curr = pos0_curr - pos1_curr;

      // 符号が変わったら交点がある
      if (diff_prev * diff_curr < 0 || (Math.abs(diff_curr) < 0.01 && Math.abs(diff_prev) > 0.01)) {
        // 線形補間で交点を計算
        const t_prev = this.history.time[i - 1];
        const t_curr = this.history.time[i];
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
        if (intersections.length === 0 ||
            Math.abs(intersectTime - intersections[intersections.length - 1].time) > 0.1) {
          intersections.push({ time: intersectTime, position: intersectPos, type });
        }
      }
    }

    return intersections;
  }

  /**
   * 端到達イベントを検出
   * @returns {Array<Object>} イベントの配列 [{time, person, edge}]
   */
  findEdgeEvents() {
    const events = [];

    if (this.history.time.length < 2) return events;

    for (let personIdx = 0; personIdx < this.travelers.length; personIdx++) {
      for (let i = 1; i < this.history.time.length; i++) {
        const pos_prev = this.history.positions[personIdx][i - 1];
        const pos_curr = this.history.positions[personIdx][i];

        // 左端(0m)到達を検出（一方向のみ：近づく方向）
        if (pos_prev > 0.5 && pos_curr <= 0.5) {
          const t_prev = this.history.time[i - 1];
          const t_curr = this.history.time[i];
          const ratio = pos_prev / (pos_prev - pos_curr + 1e-10);
          const eventTime = t_prev + (t_curr - t_prev) * ratio;
          events.push({ time: eventTime, person: personIdx, edge: 'left' });
        }

        // 右端(distance)到達を検出（一方向のみ：近づく方向）
        if (pos_prev < this.distance - 0.5 && pos_curr >= this.distance - 0.5) {
          const t_prev = this.history.time[i - 1];
          const t_curr = this.history.time[i];
          const ratio = (this.distance - pos_prev) / (pos_curr - pos_prev + 1e-10);
          const eventTime = t_prev + (t_curr - t_prev) * ratio;
          events.push({ time: eventTime, person: personIdx, edge: 'right' });
        }
      }
    }

    return events;
  }

  /**
   * 設定を更新
   * @param {Object} updates - 更新する設定
   */
  updateConfig(updates) {
    Object.assign(this, updates);
  }

  /**
   * 再生/停止の切り替え
   */
  togglePlayPause() {
    this.isPlaying = !this.isPlaying;
  }

  /**
   * 再生開始
   */
  play() {
    this.isPlaying = true;
  }

  /**
   * 停止
   */
  pause() {
    this.isPlaying = false;
  }
}
