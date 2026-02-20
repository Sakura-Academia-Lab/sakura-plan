# AIエージェントへの指示書：計算診断テスト編集ルール

このプロジェクトでは、計算診断テストの問題構成を `.md` ファイル（設計書）で定義し、実際の動作を `.js` ファイルで実装しています。
問題を作成・変更・修正する際は、以下のルールを厳守してください。

## 0. 最優先ルール：作業開始前に必読

**🚨 新しいチャットで作業を始める際は、必ず最初に [`PROJECT_STATUS.md`](PROJECT_STATUS.md) を読んでください。**

- このファイルには現在の進捗状況と次のタスクが記載されています
- チャット継続性のため、作業完了後は必ずこのファイルを更新してください

## 1. 黄金ルール

**「いきなり `.js` を変更しないこと」**
問題を編集する際は、まず対応する `.md` ファイル（`docs/` 以下）をチェックし、設計意図や問題構成を理解してください。変更が必要な場合は、まず `.md` を更新してから `.js` に反映させてください。

> [!CAUTION]
>
> ### 編集禁止（Protected Files）
>
> **`sec1_survival_1.js`** は完成したファイルです。AIエージェントによる**中身の変更は厳禁**です。

## 2. ファイル対応表

| 設計書（docs/*.md） | 実装ファイル（*.js） | ステージ |
|:---|:---|:---|
| sec1_サバイバルテスト1.md | `sec1_survival_1.js` | 第1部（A～D混合） |
| (設計書なし) | `sec1_survival_2.js` | 第1部（E～G混合） |
| sec1a_小数分数変換.md | `sec1a_decimal_fraction.js` | 第1部 A |
| sec1b_四角数三角数.md | `sec1b_squares.js` | 第1部 B |
| sec1c_円周率.md | `sec1c_pi.js` | 第1部 C |
| sec1d_素数判定倍数判定.md | `sec1d_primes.js` | 第1部 D |
| sec1e_黄金ペア補数.md | `sec1e_golden_pairs.js` | 第1部 E |
| sec1f_瞬発暗算素因数分解.md | `sec1f_mental_and_factorization.js` | 第1部 F |
| sec1g_近似計算.md | `sec1g_approximation.js` | 第1部 G |
| sec2_サバイバルテスト.md | `sec2_survival.js` | 第2部（A～G混合） |
| sec2a_分配法則.md | `sec2a_distribution_basic.js` | 第2部 A |
| sec2b_100に近い数.md | `sec2b_distribution_advanced.js` | 第2部 B |
| sec2c_結合分解.md | `sec2c_associative.js` | 第2部 C |
| sec2d_小数分数計算.md | `sec2d_decimal_fraction_calc.js` | 第2部 D |
| sec2e_約分.md | `sec2e_reduction.js` | 第2部 E |
| sec2f_数列.md | `sec2f_sequence.js` | 第2部 F |
| sec2g_桁数ゼロ処理.md | `sec2g_digits_zero.js` | 第2部 G |
| sec3_サバイバルテスト.md | `sec3_survival.js` | 第3部（A～G混合） |

## 3. 手順

1. **作業開始前**: [`PROJECT_STATUS.md`](PROJECT_STATUS.md) を読み、現在の進捗と次のタスクを確認する。
2. **設計書の確認**: `docs/` 内の該当する `.md` ファイルを読み込む。
3. **整合性の確認**: 現在の `.js` の実装が `.md` の通りになっているか確認する。
4. **編集**:
    - 設計を変更する場合は、まず `.md` を更新する。
    - その後、`.js` を書き換える。
5. **検証**: mdとjsが一致していることを最終確認する。
6. **作業完了後**: [`PROJECT_STATUS.md`](PROJECT_STATUS.md) を更新する（進捗状況、最後の作業、次のタスク、作業履歴）。

> [!IMPORTANT]
> このルールは将来の自分（AIエージェント）への指示です。
> ルールを逸脱して直接コードを変更することは禁止されています。

## 4. 作業完了時の更新項目

作業完了後は、必ず [`PROJECT_STATUS.md`](PROJECT_STATUS.md) の以下のセクションを更新してください：

1. ✅ **進捗状況** - 完成したファイルのステータスを更新
2. 🔄 **最後の作業** - 今回実施した作業内容を記録
3. 📝 **次のタスク** - 次に何をすべきかを更新
4. 📚 **作業履歴** - 日付と作業内容を追記
