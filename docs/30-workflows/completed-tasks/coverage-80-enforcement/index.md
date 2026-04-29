# coverage-80-enforcement - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | coverage-80-enforcement |
| タスク名 | テストカバレッジ 80% 強制(全 package 一律 / CI hard gate / ローカル auto-loop) |
| ディレクトリ | docs/30-workflows/coverage-80-enforcement |
| Wave | 1（quality / coverage governance） |
| 実行種別 | serial（PR① → PR② → PR③ の段階的導入） |
| 作成日 | 2026-04-29 |
| 担当 | unassigned |
| 状態 | implementation_started |
| タスク種別 | implementation / NON_VISUAL（CI gate + script + skill 正本同期） |
| visualEvidence | NON_VISUAL |
| scope | quality_governance |
| 親タスク | （なし。aiworkflow-requirements `quality-requirements-advanced.md` の正本実装） |
| GitHub Issue | （未作成。Phase 13 で発行予定） |

## 目的

UBM-Hyogo monorepo の全 package（`apps/web` / `apps/api` / `packages/shared` / `packages/integrations` / `packages/integrations/google`）で、テストカバレッジ **80%（lines / branches / functions / statements 全部）** を **CI required gate** と **ローカル pre-push hook** で構造的に強制する。導入時に既存テスト不足 PR が落ちる鶏卵問題を回避するため、**3 段階 PR 戦略**（① 仕組み導入 + soft gate / ② package 別 80% 達成 / ③ hard gate 化）で段階適用する。`scripts/coverage-guard.sh` を新設し、threshold 未達時に不足ファイル top10 と「追加すべきテスト雛形」を stderr に出力 → ローカル auto-loop（実行→警告→テスト追加）を成立させる。

## スコープ

### 含む

- Phase 1〜13 のタスク仕様書（`phase-NN.md`）作成
- Phase outputs 骨格（Phase 1〜13 の `outputs/phase-NN/main.md`）作成
- `index.md`（本ファイル）と `artifacts.json` の作成
- 全 package 一律 80% 閾値の正本固定
- 3 段階 PR 戦略（PR① soft gate / PR② テスト追加 / PR③ hard gate 化）の仕様化
- `scripts/coverage-guard.sh` の I/O 仕様・exit code 仕様・出力フォーマット定義
- vitest coverage 設定（v8 provider / threshold / reporter）の正規構成
- CI workflow（`coverage-gate` job）追加仕様（soft → hard 切替手順含む）
- lefthook pre-push 統合仕様（skip 抜け道なし）
- baseline 計測タスク（T0）の手順仕様化
- `aiworkflow-requirements/references/quality-requirements-advanced.md` への正本反映設計
- `task-specification-creator/references/coverage-standards.md` への参照追記設計
- branch protection `required_status_checks.contexts` への coverage job 登録運用（UT-GOV-001 / UT-GOV-004 連携）

### 含まない

- 実テストコードの追加実装（PR② = T5 で別タスク化、本ワークフローは仕様提示まで）
- 実 CI 設定の merge / branch protection 適用の実 PUT（Phase 13 ユーザー承認後）
- E2E / Playwright 等の追加テストフレームワーク導入（Vitest 範囲）
- Codecov SaaS 課金プランの判断（既存 free tier 範囲）
- 自動 commit / push / PR 発行

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流（参照） | aiworkflow-requirements `quality-requirements-advanced.md` | 既存閾値 80%/65% を本タスクで一律 80% に再定義し、正本同期を Phase 12 で実施 |
| 上流（参照） | task-specification-creator `coverage-standards.md` | Phase 6/7 の検証手順テンプレ参照元 |
| 並列 | int-test-skill | 統合テストレベルでの coverage 寄与判定の互換性 |
| 関連 | UT-GOV-001（branch protection apply） | hard gate 化時 `required_status_checks.contexts` に coverage job を登録する運用が UT-GOV-001 / UT-GOV-004 完了に依存 |
| 関連 | UT-GOV-004（required_status_checks contexts 同期） | coverage job 名同期に依存 |
| 下流 | 全実装タスク | hard gate 化以降、すべての PR は coverage 80% を満たす必要がある |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md | 既存 coverage 正本（更新対象） |
| 必須 | .claude/skills/task-specification-creator/references/coverage-standards.md | Phase 6/7 検証テンプレ |
| 必須 | .claude/skills/task-specification-creator/references/patterns-testing.md | カバレッジ免除判定 / TDD パターン |
| 必須 | .claude/skills/task-specification-creator/references/quality-gates.md | Phase 完了ゲート |
| 必須 | vitest.config.ts（プロジェクトルート） | coverage 設定追加対象 |
| 必須 | .github/workflows/ci.yml | coverage-gate job 追加対象 |
| 必須 | lefthook.yml | pre-push hook 追加対象 |
| 必須 | CLAUDE.md（ブランチ戦略 / solo 運用ポリシー） | branch protection との整合 |
| 参考 | https://vitest.dev/guide/coverage | Vitest v8 coverage provider 仕様 |
| 参考 | https://docs.codecov.com/docs | Codecov を後から導入する場合の参考（現 repo に codecov.yml なし） |

## 受入条件 (AC)

- AC-1: 全 package 一律 80%（lines / branches / functions / statements）が `scripts/coverage-guard.sh` の既定閾値で固定されている（Phase 5 仕様に明記）。Vitest は coverage 計測を担当する。
- AC-2: `scripts/coverage-guard.sh` が新設され、`pnpm -r test:coverage` を実行 → `coverage/coverage-summary.json` を package 単位で集計 → 80% 未達時に exit 1 する仕様が確定している。
- AC-3: 80% 未達時、`coverage-guard.sh` は不足ファイル top10（lines 未達順）と「追加すべきテスト雛形パス」（`{src}/{file}.test.ts`）を stderr に出力する仕様が確定している。
- AC-4: 各 package（`apps/web` / `apps/api` / `packages/shared` / `packages/integrations` / `packages/integrations/google`）に `test` / `test:coverage` script が統一フォーマットで定義される仕様が確定している。
- AC-5: `.github/workflows/ci.yml` に `coverage-gate` job が追加され、PR① では `continue-on-error: true`（soft gate）、PR③ で `false`（hard gate）に切り替える 2 段階仕様が確定している。
- AC-6: `lefthook.yml` の pre-push に `coverage-guard` が追加される仕様が確定し、skip フラグの抜け道がないことが明記されている。
- AC-7: T0 baseline 計測手順（artifact 出力 / package 別未達リスト生成 / Phase 11 で証跡化）が仕様化されている。
- AC-8: PR① / PR② / PR③ の 3 段階段取りが Phase 5 と Phase 13 で明記され、各 PR の merge 前提条件（CI gate の挙動 / branch protection 設定状態）が確定している。
- AC-9: hard gate 化時の `required_status_checks.contexts` への coverage job 登録手順が UT-GOV-001 / UT-GOV-004 連携として記述されている。
- AC-10: `aiworkflow-requirements/references/quality-requirements-advanced.md` の更新差分（85%/65% → 全 package 80%）が Phase 12 の system-spec-update-summary に明記される設計が確定している。
- AC-11: `task-specification-creator/references/coverage-standards.md` から `scripts/coverage-guard.sh` 参照を追記する設計が確定している。
- AC-12: 既存 `apps/api` 以外（`apps/web` / `packages/*`）のテスト不足が baseline 計測で可視化される手順が Phase 6 / 11 で仕様化されている。
- AC-13: 4 条件（価値性 / 実現性 / 整合性 / 運用性）が Phase 1 と Phase 3 の双方で PASS 確認されている。
- AC-14: Phase 1〜13 が `artifacts.json` の `phases[]` と完全一致しており、Phase 1〜3 = `completed`、Phase 4〜13 = `pending`。

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/main.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02/main.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/main.md |
| 4 | テスト戦略 | phase-04.md | pending | outputs/phase-04/main.md |
| 5 | 実装ランブック（vitest config / coverage-guard.sh / package script / CI soft gate） | phase-05.md | pending | outputs/phase-05/main.md |
| 6 | 異常系検証（baseline 未達 / threshold 失敗 / 部分集計欠落） | phase-06.md | pending | outputs/phase-06/main.md |
| 7 | AC マトリクス | phase-07.md | pending | outputs/phase-07/main.md |
| 8 | DRY 化 | phase-08.md | pending | outputs/phase-08/main.md |
| 9 | 品質保証 | phase-09.md | pending | outputs/phase-09/main.md |
| 10 | 最終レビュー | phase-10.md | pending | outputs/phase-10/main.md |
| 11 | 手動 smoke test（baseline 計測 / coverage-guard 実行 / soft→hard 切替リハーサル） | phase-11.md | pending | outputs/phase-11/main.md / manual-smoke-log.md / link-checklist.md / coverage-baseline-summary.md |
| 12 | ドキュメント更新 | phase-12.md | pending | outputs/phase-12/main.md / implementation-guide.md / system-spec-update-summary.md / documentation-changelog.md / unassigned-task-detection.md / skill-feedback-report.md / phase12-task-spec-compliance-check.md |
| 13 | PR 作成 / ユーザー承認後 3 段階適用 | phase-13.md | pending | outputs/phase-13/main.md / pr1-runbook.md / pr2-runbook.md / pr3-runbook.md |

## 主要成果物（Phase 1〜3 範囲）

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-01/main.md | 要件定義（背景 / 課題 / AC / 4 条件評価 / スコープ / 苦戦想定） |
| 設計 | outputs/phase-02/main.md | トポロジ / coverage-guard.sh I/O / vitest config / CI gate 切替戦略 / lefthook 統合 / 3 段階 PR 段取り |
| レビュー | outputs/phase-03/main.md | 代替案比較（一律 80% / package 別 / monorepo 集約 / Codecov 単独依存）と PASS/MINOR/MAJOR 判定 / 着手可否ゲート |
| メタ | artifacts.json | Phase 1〜13 機械可読サマリー |

## 関連サービス・ツール

| サービス/ツール | 用途 | コスト |
| --- | --- | --- |
| Vitest（v8 coverage provider） | テスト実行 + coverage 計測 | 無料 |
| GitHub Actions | coverage-gate job 実行 | 無料枠（既存 CI 内追加） |
| lefthook | pre-push hook | 無料（既存導入） |
| jq | coverage-summary.json 集計 | 無料 |
| Codecov（任意） | カバレッジ可視化（現 repo は未導入。必要なら別タスク） | 無料枠 |

## Secrets 一覧

本タスクは新規 secret を導入しない。既存 `CODECOV_TOKEN`（任意）を upload に流用するのみ。

## 不変条件 touched

| # | 不変条件 | 本タスクでの扱い |
| --- | --- | --- |
| #5 | D1 への直接アクセスは `apps/api` に閉じる | 本タスクは coverage 計測仕様のみで D1 を触らない。違反なし |
| - | branch 戦略 `feature/* → dev → main`（CLAUDE.md） | hard gate 化時に `dev` / `main` の `required_status_checks.contexts` に coverage job を登録 |
| - | solo 運用ポリシー（`required_pull_request_reviews=null`） | 本タスクは review 必須化を導入しない（CI gate のみ強化） |

## 完了判定

- Phase 1〜13 の状態が `artifacts.json` と一致（Phase 1〜3 = `completed` / Phase 4〜13 = `pending`）
- AC-1〜AC-14 が Phase 1〜3 で全件カバー
- 4 条件（価値性 / 実現性 / 整合性 / 運用性）が PASS
- 3 段階 PR 段取り（PR① soft / PR② テスト追加 / PR③ hard）が Phase 5 / 13 で明記
- 本ワークフローはタスク仕様書と Phase outputs 骨格の整備に閉じ、実 CI merge / branch protection 適用は Phase 13 ユーザー承認後の別オペレーションで実施する旨を明文化

## 苦戦想定（Phase 6 で再評価）

1. **鶏卵問題**: 仕組み導入 PR 自体が 80% を満たさず落ちる → PR① で `continue-on-error: true` を明示し、PR③ で外す 2 段階切替で回避。
2. **monorepo coverage 集計**: vitest が単一 root config + multi-include の場合、package 単位の coverage-summary.json 分離が難しい → vitest workspace 機能 or package 別 vitest config + 集約スクリプトで解決（Phase 2 で確定）。
3. **`apps/web` Next.js / Cloudflare Workers 環境**: Edge runtime / OpenNext のテスト不可領域が出やすい → カバレッジ免除（`coverage.exclude`）リストを Phase 2 で確定。
4. **`coverage-guard.sh` の OS 依存**: macOS / Linux で jq / bash 挙動差 → POSIX 範囲 + jq 1.6+ 前提を Phase 2 で固定。
5. **CI soft → hard 切替の忘却**: PR③ を出さないと永遠に warning のまま → Phase 13 と Phase 12 unassigned-task-detection で切替期限を明文化。
6. **Codecov 導入時の二重正本**: 現 repo に `codecov.yml` は存在しない。導入する場合は project.target / patch.target を 80% にし、`coverage-guard.sh` と aiworkflow-requirements との同期 lint を別タスク化する。
7. **lefthook pre-push の遅延**: coverage 計測は秒単位かかる → 並列実行と `--changed` 限定モードを Phase 2 でオプション化。

## 関連リンク

- 上位 README: ../README.md
- aiworkflow-requirements 正本: ../../../.claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md
- task-specification-creator coverage 基準: ../../../.claude/skills/task-specification-creator/references/coverage-standards.md
- Codecov docs（任意導入時）: https://docs.codecov.com/docs
- 連携タスク（governance）: ../ut-gov-001-github-branch-protection-apply/
