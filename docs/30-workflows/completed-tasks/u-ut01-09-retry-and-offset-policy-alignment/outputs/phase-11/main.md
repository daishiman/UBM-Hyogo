# Phase 11: NON_VISUAL Walkthrough（手動テスト検証 縮約版）

> ステータス: spec_created / docs-only / NON_VISUAL
> 入力: Phase 10 GO 判定、Phase 1-9 全 outputs

---

## 1. テスト方式

UI / UX 変更なしのため Phase 11 のスクリーンショット採取は不要。本タスクは docs-only / spec_created / NON_VISUAL に該当するため、検証は **spec walkthrough（仕様自走確認）** + **link 到達性検証** + **canonical cross-reference 整合確認** の 3 観点に縮約する。

## 2. 発火条件

| 項目 | 値 |
| --- | --- |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| workflow_state | spec_created |
| GitHub Issue | #263 (CLOSED) |

## 3. 必須 outputs（NON_VISUAL 縮約 3 ファイル）

| ファイル | 役割 |
| --- | --- |
| `main.md`（本ファイル）| 縮約 walkthrough の判定サマリ |
| `manual-smoke-log.md` | spec walkthrough / link 検証 / canonical cross-reference の実行ログ（実施時に記録）|
| `link-checklist.md` | workflow 内リンク・参照先の到達性チェック |

## 4. 検証 3 観点

### 観点 A: quota 再計算
- 期待: Phase 9 算定の Sheets API worst case 値（2 req/100s = 0.4%）が 500 req/100s 未満であることを独立に再計算
- 結果: PASS（Phase 9 §3 集約表で確認）

### 観点 B: 参照存在確認
- 期待: 本 workflow が依存する参照パス（UT-01 outputs / 既存実装 / 既存 migration）すべて reachable
- 結果: 詳細は `link-checklist.md`

### 観点 C: canonical cross-reference
- 期待: retry / backoff / `processed_offset` の値が Phase 2 / Phase 5 / Phase 7 / Phase 9 / Phase 10 のいずれでも矛盾しない
- 結果: PASS（用語辞書 Phase 8 §2、AC マトリクス Phase 7 §1、quota 算定 Phase 9 §1 で一貫）

## 5. 判定サマリ

| 観点 | 期待 | 状態 |
| --- | --- | --- |
| A: quota 再計算 | Phase 9 算定が 500 req/100s 未満 | PASS（0.4%） |
| B: 参照存在確認 | 参照パスが reachable | PASS（link-checklist.md 参照） |
| C: canonical cross-reference | retry / backoff / offset の値 drift 0 | PASS |

## 6. 既知制限（NON_VISUAL）

- screenshot 生成なし
- 実コード変更なし
- migration apply なし
- wrangler 直接実行なし
- vitest / coverage 計測なし（→ UT-09 で実施）

## 7. ウォークスルーシナリオ発見事項リアルタイム分類欄

`manual-smoke-log.md` を参照。本タスク実施時点では Blocker 0 / Note 0 / Info 0。

## 8. スコープ外

- screenshot 採取
- 実機検証
- migration apply
- production rollout

## 9. 完了条件チェック

- [x] 3 観点 (A / B / C) PASS
- [x] manual-smoke-log.md 記載
- [x] link-checklist.md 記載
- [x] 既知制限明示
- [x] コード変更 / migration / PR なし
