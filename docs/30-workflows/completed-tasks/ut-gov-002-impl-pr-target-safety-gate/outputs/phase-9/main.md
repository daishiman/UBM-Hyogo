# Phase 9 — 品質保証（main）

## Status

spec_created

## 1. 目的

Phase 1〜8 の成果物（実 workflow 2 ファイル + 仕様書 + 静的検査ログ）を **品質ゲート (quality gate)** G-1〜G-8 で総点検し、「静的検査 PASS + 振る舞いの安全性 + 証跡完全性」を保証する。本 Phase は仕様レベルでの確定が責務であり、静的検査・dry-run smoke の **実走は spec_created 時点では未実走**（Phase 13 ユーザー承認後に実行）。

## 2. 入力の継承

| 入力 | 用途 |
| --- | --- |
| `index.md` AC-1〜AC-9 | G-1 評価の分母 |
| `outputs/phase-3/review.md` §3 | "pwn request" 非該当 5 箇条 / G-3 根拠 |
| `outputs/phase-4/test-matrix.md` §3 / §5 | 静的検査 5 コマンド / F-1〜F-5（FC との対応） |
| `outputs/phase-5/runbook.md` Step 4〜7 | 静的検査・required status checks 同期 |
| `outputs/phase-5/static-check-log.md` | 静的検査ログ貼付テンプレ（実走後に埋める） |
| `outputs/phase-6/failure-cases.md` §1 | FC-1〜FC-8 / Severity 分類（G-1 / G-2 / G-3 根拠） |
| `outputs/phase-7/coverage.md` §6 | AC 9/9 = 100% 宣言（G-1 根拠） |
| `outputs/phase-8/before-after.md` §8 | リファクタ後の振る舞い不変確認コマンド（G-2 / G-8 根拠） |
| `.github/workflows/pr-target-safety-gate.yml` | G-3(a) / G-3(b) / G-3(d) / G-3(e) 検査対象 |
| `.github/workflows/pr-build-test.yml` | G-3(d) / G-3(e) / G-4 検査対象 |

## 3. 成果物

- `outputs/phase-9/main.md`（本書）
- `outputs/phase-9/quality-gate.md`（G-1〜G-8 評価表 / security 章 / MAJOR 0 件判定 / gate 不通過時戻り先）

## 4. 品質ゲート（G-1〜G-8）の責務分担

| ゲート | 観点 | 根拠 Phase |
| --- | --- | --- |
| G-1 | AC 9/9 PASS | Phase 7 §6 |
| G-2 | 静的検査 PASS（actionlint / yq / grep） | Phase 4 §3 / Phase 5 Step 4 / Phase 8 §8 |
| G-3 | "pwn request" 非該当 5 箇条 | Phase 3 §3 |
| G-4 | secrets / token 露出ゼロ | Phase 4 §4 D-3 / Phase 11 |
| G-5 | VISUAL evidence の品質要件 | Phase 4 §6 / Phase 11 |
| G-6 | required status checks job 名同期 | Phase 5 Step 7 |
| G-7 | ロールバック手順の机上検証 | Phase 5 §ロールバック / Phase 10 |
| G-8 | 用語整合 + artifacts.json status 同期 | Phase 8 §7 |

## 5. 実走タイミング

| 検査 | 仕様確定（本 Phase） | 実走（後段） |
| --- | --- | --- |
| 静的検査（actionlint / yq / grep） | コマンド固定 | Phase 13 ユーザー承認後（または事前 dry-run） |
| 動的検査（fork PR / labeled / workflow_dispatch audit） | シナリオ T-1〜T-5 確定 | Phase 11 manual smoke |
| VISUAL evidence | 取得要件・命名・解像度確定 | Phase 11 manual smoke |
| `gh api branches/protection` | コマンド固定 | Phase 11 manual smoke / Phase 13 |

> 静的検査ログの貼付欄は `outputs/phase-9/quality-gate.md` §9 に確保する。実走結果は承認後に追記。

## 6. MAJOR 0 件判定ポリシー

- MAJOR が 1 件でも検出された場合、本 Phase で評価を MAJOR に倒し、Phase 5 / 6 / 8 のいずれか（FC ID から逆引き）に差し戻す。
- MINOR は許容。FC-7 が MINOR 確定済み（運用ルール監査でフォロー）。
- Gate 通過条件: **MAJOR 0 件 / MINOR 許容 / G-1〜G-8 のうち PASS が 7 件以上 / G-3 5 箇条すべて PASS**。

## 7. 完了条件

- [x] quality-gate.md に G-1〜G-8 が PASS / MINOR / MAJOR で評価される。
- [x] 静的検査ログ貼付欄が確保される（実走は Phase 13 で実施）。
- [x] "pwn request" 非該当 5 箇条が再点検済みとして記録される。
- [x] secrets / token 露出ゼロの検査手順が記述される。
- [x] VISUAL evidence の品質要件が列挙される。
- [x] required status checks 名同期が `gh api` 出力で確認される手順が記述される。
- [x] ロールバック手順の机上検証が記録される。
- [x] MAJOR 0 件 / MINOR 許容範囲内 / gate 不通過時の戻り先ルールが記述される。
- [x] artifacts.json の Phase 9 status が `spec_created` で同期される（既同期）。

## 8. 次 Phase への引き継ぎ

- Phase 10 go-no-go は本 Phase の G-1〜G-8 評価を AC × 証跡 × 判定の 3 列表に転記する。
- Phase 11 manual smoke は本 Phase の G-4 / G-5 / G-6 検査手順を実走する。
- Phase 13 完了確認は本 Phase の静的検査ログ貼付欄を埋めることで gate 通過を最終確認する。
