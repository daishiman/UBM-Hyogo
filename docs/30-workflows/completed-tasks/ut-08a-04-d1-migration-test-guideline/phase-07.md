# Phase 7: AC マトリクス

| AC | 検証手段 | 期待結果 | 担当 Phase |
| -- | -------- | -------- | ---------- |
| AC-1 (runbook 3 セクション + 最低基準 3 語句) | `bats migration-guideline-presence.bats` の 5 ケース全 pass | green | Phase 5, 9 |
| AC-2 (README link) | `grep -F "d1-migration-test-guideline.md" apps/api/migrations/README.md` | match | Phase 5, 9 |
| AC-3 (CI comment step) | `grep -F "github-script" .github/workflows/d1-migration-verify.yml` + `grep -F "always() && github.event_name == 'pull_request'"` + 実 PR で comment 確認 | match + 1 comment | Phase 5, 11, 13 |
| AC-4 (bats green) | `bats scripts/d1/__tests__/*.bats` | exit 0 | Phase 9 |
| AC-5 (4 条件評価) | Phase 3 評価表 | 全 PASS | Phase 3 |
| AC-6 (Phase 12 7 成果物) | `ls docs/30-workflows/ut-08a-04-d1-migration-test-guideline/outputs/phase-12/` | 7 files | Phase 12 |
| AC-7 (D1 不変条件) | `git diff --stat dev...HEAD -- apps/web` で apps/web 変更ゼロを確認 | 0 changes | Phase 9 |

## トレーサビリティ

| AC | 検出元 / 要件 |
| -- | ------------- |
| AC-1, AC-2 | UT-08A-04 受入条件「09b runbook に最低基準セクション追加」。本仕様では Phase 1 decision record により独立 runbook 正本へ変更し、09b への重複記載はしない |
| AC-3 | UT-08A-04 受入条件「CI で migrations 変更検知時に runbook link comment」 |
| AC-4 | NFR: runbook 必須見出しを CI で守る |
| AC-5 | task-specification-creator skill ゲート要件 |
| AC-6 | task-specification-creator Phase 12 必須成果物 |
| AC-7 | プロジェクト不変条件 #5 |

## メタ情報

| 項目 | 内容 |
| --- | --- |
| task | ut-08a-04-d1-migration-test-guideline |
| phase | 7 |
| status | completed |

## 目的

受入条件と検証手段を1対1で対応付ける。

## 実行タスク

- ACごとの検証手段、期待結果、担当 Phase を確認する。
- 元仕様から独立 runbook 化した判断を trace する。

## 参照資料

- `index.md`
- `phase-01.md`

## 成果物/実行手順

AC マトリクスを実装 / 検証 / Phase 12 close-out の正本として使う。

## 完了条件

- すべての AC に検証手段と担当 Phase がある。

## 統合テスト連携

AC-1/4 は bats、AC-3 は static grep と Phase 13 PR comment evidence に接続する。
