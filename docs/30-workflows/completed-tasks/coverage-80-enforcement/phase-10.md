# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | テストカバレッジ 80% 強制 (coverage-80-enforcement) |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| 作成日 | 2026-04-29 |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (手動 smoke test / baseline 計測 / coverage-guard 実行 / soft→hard 切替リハ) |
| 状態 | pending |
| タスク種別 | implementation / NON_VISUAL / quality_governance |

## 目的

Phase 1〜9 で確定した要件・設計・レビュー・QA を統合し、(1) **AC-1〜AC-14 全件カバレッジ評価**、(2) **4 条件最終再々確認**（Phase 1 / Phase 3 / Phase 10 の 3 重評価）、(3) **ユーザー決定 5 件との突き合わせ**（一律 80% / PR 必須 / 新規 script / commit-push 時 80% 担保 / 計測タスク差し込み）、(4) **Phase 11 (smoke test) 実走前の go/no-go 判定基準** 確定、(5) **レビュー指摘 R-1〜R-4（Phase 3）の最終解決状態** 確認、を実施する。本ワークフローは仕様書整備に閉じるため、最終判定は **「仕様書として PASS / 実 CI merge / branch protection 適用は Phase 13 ユーザー承認後の別オペレーション」** とし、MINOR 指摘は Phase 12 unassigned-task-detection.md へ formalize する方針を明文化する。

## 実行タスク

1. AC-1〜AC-14 を spec_created 視点で評価し、PASS / FAIL / 仕様確定先 を全件付与する（完了条件: 14 件すべてに判定 + 確定先 Phase 番号）。
2. 4 条件（価値性 / 実現性 / 整合性 / 運用性）の最終再々確認を Phase 1 / Phase 3 / 本 Phase で 3 重評価する（完了条件: 各観点に PASS/MINOR/MAJOR + 根拠）。
3. ユーザー決定 5 件との突き合わせ表を確定する（完了条件: 5 件すべてに対応 Phase / 根拠が記述）。
4. Phase 11 smoke test 実走前の go/no-go 判定基準を確定する（完了条件: 5 件以上、baseline 取得可能性 / coverage-guard.sh 実装完了 / vitest config 更新完了 / lefthook 統合完了 / UT-GOV-004 状態 を含む）。
5. レビュー指摘 R-1〜R-4（Phase 3）の最終解決状態を表化する（完了条件: 4 件すべてに対応 Phase + 解決状態 + 残留 unassigned 候補）。
6. blocker 判定基準を明文化する（完了条件: 5 件以上、UT-GOV-004 未完了 / baseline 30% 下回り / vitest workspace 互換性 / 鶏卵問題未解消 / codecov.yml 二重正本 を含む）。
7. MINOR 指摘の未タスク化方針を確定する。
8. 最終 GO/NO-GO 判定を確定し `outputs/phase-10/main.md` に記述する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/coverage-80-enforcement/index.md | AC-1〜AC-14 / Phase 一覧 / 不変条件 |
| 必須 | docs/30-workflows/coverage-80-enforcement/phase-01.md | 4 条件評価初期判定 |
| 必須 | docs/30-workflows/coverage-80-enforcement/phase-03.md | 設計レビュー / NO-GO 条件 / R-1〜R-4 |
| 必須 | docs/30-workflows/coverage-80-enforcement/phase-07.md | AC マトリクス |
| 必須 | docs/30-workflows/coverage-80-enforcement/phase-08.md | DRY 化 SSOT |
| 必須 | docs/30-workflows/coverage-80-enforcement/phase-09.md | QA 13 項目 |
| 必須 | docs/30-workflows/coverage-80-enforcement/outputs/phase-09/main.md | QA 結果 |
| 参考 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-10.md | 最終レビュー phase 構造参照 |

## AC × PASS/FAIL マトリクス（spec_created 視点）

> **評価基準**: 「Phase 1〜9 で具体的に確定し、Phase 5 / 11 / 13 で実装・実走可能な粒度に分解されているか」。

| AC | 内容 | 仕様確定先 | 判定 |
| --- | --- | --- | --- |
| AC-1 | 全 package 一律 80%（4 metric）が `vitest.config.ts` で固定 | Phase 2 / 5 / 8 | PASS |
| AC-2 | `coverage-guard.sh` 新設・80% 未達で exit 1 | Phase 2 / 5 / 8（5 関数分解） | PASS |
| AC-3 | 不足 top10 + テスト雛形パスを stderr 出力 | Phase 2 / 5 / 8（`format_stderr_report`） | PASS |
| AC-4 | 全 package に `test` / `test:coverage` script 統一 | Phase 2 / 5 | PASS |
| AC-5 | CI `coverage-gate` job、PR① soft / PR③ hard 切替 | Phase 2 / 5 / 13 | PASS |
| AC-6 | `lefthook.yml` pre-push 統合、skip 抜け道なし | Phase 2 / 5 / 6 | PASS |
| AC-7 | T0 baseline 計測手順（artifact / 未達リスト / 証跡化） | Phase 2 / 11 | PASS |
| AC-8 | 3 段階 PR 段取り（PR① / PR② / PR③） | Phase 2 / 5 / 13 | PASS |
| AC-9 | hard gate 化時 contexts 登録（UT-GOV-001 / 004 連携） | Phase 2 / 13 | PASS |
| AC-10 | `quality-requirements-advanced.md` 差分（85%/65% → 80%）反映 | Phase 2 / 12 | PASS |
| AC-11 | `coverage-standards.md` から `coverage-guard.sh` 参照追記 | Phase 2 / 12 | PASS |
| AC-12 | `apps/web` / `packages/*` テスト不足 baseline 可視化 | Phase 2 / 6 / 11 | PASS |
| AC-13 | 4 条件が Phase 1 / Phase 3 双方で PASS | Phase 1 / Phase 3 | PASS |
| AC-14 | Phase 1〜13 が `artifacts.json` `phases[]` と完全一致 | artifacts.json | PASS |

**合計: 14/14 PASS（spec_created 視点）**

## 4 条件最終再々確認（Phase 1 / 3 / 10 の 3 重評価）

| 条件 | Phase 1 判定 | Phase 3 判定 | Phase 10 判定（最終） | 根拠統合 |
| --- | --- | --- | --- | --- |
| 価値性 | PASS | PASS | PASS | 80% 未満 merge を構造 block / auto-loop 開発体験向上 / Phase 8 SSOT で実装容易性向上 |
| 実現性 | PASS | PASS | PASS | Vitest v8 + bash + GitHub Actions の既存技術範囲 / 3 段階 PR で導入コスト段階化 / Phase 9 検証可能 |
| 整合性 | PASS | PASS | PASS | 不変条件 #5 / CLAUDE.md ブランチ戦略 / aiworkflow-requirements 正本 1 方向引用 / scripts/cf.sh 思想と整合 |
| 運用性 | PASS | PASS | PASS | coverage-guard.sh stderr / Phase 12 unassigned で切替期限可視化 / runbook template SSOT |

**最終判定: PASS（仕様書として）**

## ユーザー決定 5 件との突き合わせ

| # | ユーザー決定 | 反映 Phase | 根拠 | 判定 |
| --- | --- | --- | --- | --- |
| 1 | 全 package 一律 80%（apps/packages 共通） | Phase 1 / 2 / 3（代替案 A 採用） | aiworkflow-requirements 正本を 85%/65% → 80% に再定義 | PASS |
| 2 | PR 必須化（commit-push 時に 80% 担保） | Phase 2 / 5 / 6（lefthook pre-push） | skip 抜け道なし設計、PR③ で CI hard gate | PASS |
| 3 | 新規 script `scripts/coverage-guard.sh` 作成 | Phase 2 / 5 / 8（5 関数分解） | I/O 仕様確定 + ヘルパー関数 5 件 SSOT 化 | PASS |
| 4 | commit / push 時に 80% 担保 | Phase 2 / 5（lefthook pre-push） | Codecov 単独依存（代替案 D）を不採用、ローカル auto-loop 成立 | PASS |
| 5 | 計測タスク差し込み（baseline T0） | Phase 2 / 11（coverage-baseline-summary.md） | 既存 PR が落ちる鶏卵問題を 3 段階 PR で回避、Phase 11 で baseline 証跡化 | PASS |

> 5 件すべて反映。代替案 B（package 別差分閾値）/ D（Codecov 単独）/ F（1 PR で全部）は不採用としてユーザー決定と整合。

## Phase 11 smoke test 実走前 go/no-go 判定基準

> Phase 11 で baseline 計測 / coverage-guard 実走 / soft→hard 切替リハーサルを行う**前**に、以下を確認する。

| # | チェック項目 | 確認方法 | 期待結果 |
| --- | --- | --- | --- |
| 1 | baseline 取得可能性（vitest workspace / multi-config 動作） | spec レベル: Phase 5 ランブックでの動作前提を確認 / 実走: `pnpm -r test:coverage` 試走 | success |
| 2 | `coverage-guard.sh` 実装完了 | Phase 5 ランブック → 実 script 配置 | `scripts/coverage-guard.sh` が exists かつ exec 可 |
| 3 | `vitest.config.ts` 更新完了（thresholds + exclude 5 分類） | Phase 8 SSOT に従う | grep で 5 分類コメント全件 hit |
| 4 | `lefthook.yml` 統合完了 | Phase 5 ランブック | pre-push 配下に coverage-guard 記述 |
| 5 | UT-GOV-004 状態 | artifacts.json `state` | completed または同時完了で 2 段階適用合意 |
| 6 | 3 段階 PR runbook 準備（PR① soft 用） | Phase 13 outputs/pr1-runbook.md | exists |
| 7 | navigation drift 0 | validate-phase-output.js | exit 0 |
| 8 | exclude 過剰除外警告ルール明確化 | Phase 9 §4 過剰除外条件 3 件確定 | 記述済み |
| 9 | rollback 経路（hard→soft 戻し）明記 | Phase 8 §6 runbook template | 記述済み |
| 10 | user_approval_required: true（Phase 13） | artifacts.json | true |

## レビュー指摘 R-1〜R-4 最終解決状態

| ID | 指摘内容（Phase 3） | 解決 Phase | 解決状態 | 残留 unassigned |
| --- | --- | --- | --- | --- |
| R-1 | `apps/web` Next.js page を exclude にすると実質カバレッジ低下 | Phase 8 / Phase 9 / Phase 11 | exclude を 5 分類に整理、Edge runtime 不可領域に限定。Phase 11 baseline で 30% 超除外を再評価 | E2E（Playwright）導入は別タスク（unassigned 候補） |
| R-2 | `coverage-guard.sh` の jq 依存が macOS / GitHub Actions で異なる | Phase 5 / Phase 8 | `jq --version` 確認ステップを Phase 5 ランブックに組み込み、`compare_threshold` 関数で SSOT 化 | なし |
| R-3 | `--changed` モードは新規 package の検出が漏れる可能性 | Phase 2 / Phase 5 | フル実行モードを CI / 週次で必ず走らせる運用を追加。`--changed` は pre-push 高速化のみ | 週次フル実行の自動化（unassigned 候補） |
| R-4 | hard gate 化時に既存 PR が一斉に block される可能性 | Phase 13 PR③ runbook | PR③ merge 前に open PR 全件 rebase + coverage 確認手順を runbook 明記 | なし |

> R-1〜R-4 すべてに解決 Phase 紐付き。未解決 0、unassigned 候補 2 件（E2E / 週次フル実行）を Phase 12 で formalize。

## blocker 判定基準

> 以下のいずれかに該当する場合、Phase 11 / 13 着手 NO-GO。

| ID | blocker | 種別 | 解消条件 | 確認方法 |
| --- | --- | --- | --- | --- |
| B-01 | UT-GOV-004 未完了かつ 2 段階適用合意もない | 上流タスク（最重要） | UT-GOV-004 PR が main マージ済 / または 2 段階適用合意 | UT-GOV-004 artifacts.json `state: completed` |
| B-02 | baseline 計測で `apps/web` / `packages/shared` のいずれかが 30% を下回る | 設計検証（NO-GO #2） | PR② を package×metric 単位で細分化 | Phase 11 coverage-baseline-summary.md |
| B-03 | vitest v8 provider が Cloudflare Workers (apps/api) で動作しない | 技術前提（NO-GO #3） | vitest workspace + miniflare 統合に Phase 5 で再設計 | Phase 5 試走 |
| B-04 | 鶏卵問題未解消（PR① で `continue-on-error: true` が漏れる） | 段取り違反 | PR① runbook で `continue-on-error: true` 明示確認 | grep .github/workflows/ci.yml |
| B-05 | codecov.yml の `project.target` / `patch.target` と本タスク 80% が不一致 | 二重正本 drift | Phase 12 で codecov.yml 同期 | grep codecov.yml |
| B-06 | `coverage-guard.sh` の skip 抜け道（`LEFTHOOK=0` / `--no-verify` 許容）が残存 | 設計違反 | lefthook.yml で skip フラグ無効化 | Phase 6 fail テスト |
| B-07 | exclude 過剰除外（30% 超 / `**/*.ts` 混入 / `apps/api` business logic 混入） | 設計違反 | Phase 9 §4 警告条件で検出、即時除外 | grep + LoC 比率算出 |

### blocker 優先順位

1. **B-01（UT-GOV-004 未完了）**: 最重要。hard gate 化時に contexts 登録不能 → PR③ NO-GO。
2. **B-02 / B-03（技術前提）**: 設計の根本崩壊。Phase 5 へ差し戻し。
3. **B-04（鶏卵問題）**: PR① で必ず確認、漏れると CI 全 PR が落ちる。
4. **B-05（codecov 二重正本）**: 長期 drift リスク、Phase 12 で同期。
5. **B-06 / B-07（設計違反）**: AC-3 / AC-6 / exclude SSOT 由来、Phase 8 / 9 で予防。

## MINOR 指摘の未タスク化方針

- 本 Phase 10 では **MINOR 判定 0**（AC 14 件 / 4 条件すべて PASS、R-1〜R-4 すべて解決 Phase 紐付き）。
- 仮に Phase 11 / 12 / 13 で MINOR が発生した場合のルール:
  1. MINOR は **必ず未タスク化**（本ワークフロー内で抱え込まない）。
  2. `outputs/phase-12/unassigned-task-detection.md` に新規 ID 割当登録。
  3. Phase 12 `implementation-guide.md` / `documentation-changelog.md` に記載。
  4. 次 Wave 以降の優先度評価へ。
- 既知 unassigned 候補:
  - U-1（R-1 由来）: `apps/web` E2E（Playwright）導入 → 別 Wave
  - U-2（R-3 由来）: 週次フル実行の自動化（GitHub Actions schedule）→ 別 Wave
  - U-3（Phase 8 由来）: CI matrix 化 + Turborepo 導入 → 別 Wave
  - U-4（Phase 3 codecov 二重正本）: codecov.yml の patch/project target 同期 → Phase 12
  - U-5（Phase 9 由来）: exclude の四半期定期再評価 → Phase 12

## 最終 GO / NO-GO 判定

### 判定: **PASS（仕様書として）/ Phase status=pending**

- 仕様書としての完成度: **PASS**（AC 14/14 / 4 条件 3 重 PASS / blocker 7 件確定 / R-1〜R-4 解決 / ユーザー決定 5 件すべて反映）
- 実装ステータス: **spec_created**（実 script / vitest config / CI / lefthook 配置は Phase 5 / 実 baseline は Phase 11 / 実 PR merge は Phase 13 ユーザー承認後）
- Phase 11 進行可否: 仕様レベルの smoke コマンド系列レビューは可。実走 baseline は Phase 5 実装後にずれ込む。
- Phase 12 進行可否: implementation-guide.md / documentation-changelog.md / unassigned-task-detection.md 整備可能。
- Phase 13 進行可否: 仕様書としては可。実 PR merge は **user_approval_required: true** + Phase 11 smoke 完了 + blocker B-01〜B-07 全解消が必須。

### GO 条件（すべて満たす）

- [x] AC 14 件すべて PASS
- [x] 4 条件最終判定が Phase 1 / 3 / 10 の 3 重で PASS
- [x] ユーザー決定 5 件すべて反映
- [x] R-1〜R-4 すべて解決 Phase 紐付き
- [x] blocker 判定基準 5 件以上（本仕様 7 件）
- [x] Phase 11 smoke 前 go/no-go 判定基準 5 件以上（本仕様 10 件）
- [x] MAJOR ゼロ
- [x] MINOR を抱え込まず未タスク化方針明記（U-1〜U-5）

### NO-GO 条件（一つでも該当）

- 4 条件のいずれかに MAJOR が残る
- AC で PASS でないものがある
- ユーザー決定 5 件のいずれかが反映漏れ
- blocker 判定基準が 5 件未満
- R-1〜R-4 のいずれかが解決 Phase 未確定
- Phase 11 smoke 前判定基準が 5 件未満

## 実行手順

1. AC マトリクス再評価（14 件）。
2. 4 条件 3 重評価（Phase 1 / 3 / 10）。
3. ユーザー決定 5 件突き合わせ。
4. Phase 11 go/no-go 判定基準（10 件）確定。
5. R-1〜R-4 最終解決状態表化。
6. blocker 7 件確定 + 優先順位付け。
7. MINOR 未タスク化方針 + U-1〜U-5 列挙。
8. `outputs/phase-10/main.md` に「仕様書 PASS / 実 PR merge は Phase 13 ユーザー承認後 / Phase status=pending」を明示。

## 統合テスト連携

| 連携先 | 内容 |
| --- | --- |
| Phase 11 | GO 判定を入力に手動 smoke（baseline / guard 実走 / 切替リハ）を仕様レベル実施 |
| Phase 12 | unassigned U-1〜U-5 を formalize / implementation-guide.md にまとめ |
| Phase 13 | GO/NO-GO + Phase 11 go/no-go 判定 10 件を PR description に転記、user_approval ゲート |
| Phase 5 別実装 PR | blocker B-01〜B-07 を着手前ゲートとして再確認 |

## 多角的チェック観点

- 価値性: AC-1 / AC-2 / AC-7（閾値固定 / guard / baseline）の根拠が Phase 1〜9 で確定。
- 実現性: Phase 9 QA で linting / artifacts 整合 / exclude レビュー / quality-gates 適用の 4 観点で機械検証可能。
- 整合性: 不変条件 #5 / Phase 8 SSOT / artifacts.json と一致。
- 運用性: 3 段階 PR + Phase 11 go/no-go 10 件 + 担当者明記（solo 運用、実行者本人）。
- 認可境界: 新規 secret 0、対象外明記済み。
- 無料枠: resource 消費なし、対象外明記済み。
- 鶏卵問題: PR① `continue-on-error: true` を blocker B-04 で 2 重保護。
- 二重正本: codecov.yml ↔ vitest.config.ts を blocker B-05 で検知。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | AC-1〜AC-14 達成評価 | 10 | spec_created |
| 2 | 4 条件 3 重評価 | 10 | spec_created |
| 3 | ユーザー決定 5 件突き合わせ | 10 | spec_created |
| 4 | Phase 11 go/no-go 判定基準確定 | 10 | spec_created |
| 5 | R-1〜R-4 最終解決状態 | 10 | spec_created |
| 6 | blocker 7 件確定 | 10 | spec_created |
| 7 | MINOR 未タスク化方針 + U-1〜U-5 | 10 | spec_created |
| 8 | GO/NO-GO 判定 | 10 | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/main.md | AC × 4 条件 3 重 × ユーザー決定 × Phase 11 go/no-go × R-1〜R-4 × blocker × U-1〜U-5 × GO/NO-GO 最終判定 |
| メタ | artifacts.json | Phase 10 状態の更新 |

## 完了条件

- [ ] AC 14 件すべて PASS で評価
- [ ] 4 条件最終判定が Phase 1 / 3 / 10 の 3 重で PASS
- [ ] ユーザー決定 5 件すべての反映 Phase / 根拠が記述
- [ ] Phase 11 smoke 前 go/no-go 判定基準が 5 件以上（本仕様 10 件）
- [ ] R-1〜R-4 すべての最終解決状態が記述
- [ ] blocker 判定基準が 5 件以上（本仕様 7 件）
- [ ] MINOR 未タスク化方針 + U-1〜U-5 列挙
- [ ] 最終判定が「仕様書 PASS / 実 PR merge は Phase 13 ユーザー承認後 / Phase status=pending」
- [ ] outputs/phase-10/main.md が作成済み

## タスク100%実行確認【必須】

- 全実行タスク（8 件）が `spec_created`
- 成果物 `outputs/phase-10/main.md` 配置予定
- AC × 4 条件 3 重 × ユーザー決定 × Phase 11 go/no-go × R-1〜R-4 × blocker × MINOR × GO/NO-GO の 8 観点記述
- artifacts.json の `phases[9].status` が `pending`

## 苦戦防止メモ

- 本ワークフロー最終成果物は「タスク仕様書」。実 CI merge / branch protection 適用は Phase 13 ユーザー承認後の別オペレーション。本 Phase で「実装 PASS」と書かない。常に **「仕様書 PASS / 実 PR merge は Phase 13 ユーザー承認後 / Phase status=pending」** と三段表現。
- blocker B-01（UT-GOV-004 未完了）は最重要。Phase 11 / 13 着手 PR の reviewer（= 実行者本人）は本仕様書 §blocker を必ず参照。
- 鶏卵問題（B-04）は PR① `continue-on-error: true` が漏れると CI 全 PR が落ちる。runbook で 2 重チェック。
- MINOR をその場で対応したくなる衝動を抑え、必ず Phase 12 unassigned ルートを通す。仕様書スコープ保持のため重要。
- Phase 11 go/no-go 10 件は実行者本人が 1 件ずつ目視確認。自動化は U-2（週次フル実行）と合わせて将来再評価。

## 次 Phase への引き渡し

- 次 Phase: 11 (手動 smoke test / baseline 計測 / coverage-guard 実行 / soft→hard 切替リハ)
- 引き継ぎ事項:
  - 最終判定: 仕様書 PASS / 実 PR merge は Phase 13 ユーザー承認後 / Phase status=pending
  - blocker 7 件（実装 / smoke / 本 PR merge 着手前に再確認必須）
  - R-1〜R-4 解決状態と unassigned 残留（U-1 / U-2）
  - Phase 11 smoke 前 go/no-go 判定基準 10 件
  - ユーザー決定 5 件の反映 Phase
  - 4 条件 3 重 PASS
- ブロック条件:
  - 4 条件のいずれかが MAJOR
  - AC で PASS でないものが残る
  - ユーザー決定 5 件のいずれかが反映漏れ
  - blocker 判定基準が 5 件未満
  - R-1〜R-4 のいずれかが解決 Phase 未確定
  - Phase 11 go/no-go 判定が 5 件未満
  - MINOR を未タスク化せず抱え込み
