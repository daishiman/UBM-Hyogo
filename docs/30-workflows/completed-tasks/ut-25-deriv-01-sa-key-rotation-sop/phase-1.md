[実装区分: 実装仕様書]

# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| task_id | UT-25-DERIV-01 |
| task_type | NON_VISUAL |
| implementation_mode | new |
| created_date | 2026-05-22 |
| source_issue | #242 |
| visualEvidence | NON_VISUAL |
| 状態 | spec_created |
| 前提 Phase | なし |
| 次 Phase | Phase 2（設計） |

## 目的

stub（`docs/30-workflows/unassigned-task/UT-25-DERIV-01-sa-key-rotation-sop.md`）に記載された SA key 定期ローテーション運用 SOP の AC・完了条件を本タスクの正本受入条件として固定し、carry-over（UT-25 Phase 13 の rollback runbook）と既存コードベース慣行（`scripts/` helper 命名 / bats テストフレームワーク）を確認した上で実装範囲を確定する。

## スコープ

- AC を番号付きで列挙し本文へ固定する
- artifact canonical 名を Phase 5 着手前に確定する
- carry-over（UT-25 Phase 13 rollback runbook）の棚卸し
- 既存コードベース命名規則調査結果の記録
- タスク分類: NON_VISUAL / 実装仕様書 を明示

## 既存コードベース命名規則調査（Phase 1 必須）

| 観点 | 調査コマンド | 結果 |
| --- | --- | --- |
| `scripts/` 配下の helper 命名 | `ls scripts/ \| grep -E '\.sh$'` | kebab-case 単機能スクリプト（例: `coverage-guard.sh` / `new-worktree.sh` / `cf.sh` / `check-cf-rotation-reminder.sh`） |
| bash テストフレームワーク | `find scripts -name '*.bats' -o -name '*.spec.sh'` | `.bats` が主流（`scripts/d1/__tests__/preflight.bats` 等）、`.spec.sh` も併存（`scripts/ci/__tests__/verify-env-secrets.spec.sh`） |
| テスト配置 | `find scripts -type d -name __tests__` | サブシステム配下に `__tests__/` を置く慣行 |
| Cloudflare wrapper | `cat scripts/cf.sh` | `op run --env-file=.env` で API token 注入、`mise exec --` で Node 24 保証、`ESBUILD_BINARY_PATH` で esbuild 解決 |

## artifact canonical 名（Phase 5 着手前に確定）

| 種別 | パス | 備考 |
| --- | --- | --- |
| SOP markdown | `docs/30-workflows/runbooks/sa-key-rotation-sop.md` | stub 完了条件 1 と整合 |
| ローテーション helper | `scripts/cf-rotate-sa-key.sh` | 独立スクリプト方式（`cf.sh` への subcommand 追加ではなく独立 helper、理由は Phase 2 §2.1 で比較） |
| 完了記録テンプレ | `docs/30-workflows/runbooks/sa-key-rotation-records/TEMPLATE.md` | SOP 同梱の運用記録 |
| bats テスト | `scripts/__tests__/cf-rotate-sa-key.bats` | bats（既存慣行） |
| skill 連携 | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | SOP 逆参照を追記 |

## carry-over 確認（前タスク成果物棚卸し）

| 上流成果物 | 本タスクでの扱い |
| --- | --- |
| `docs/30-workflows/completed-tasks/ut-25-cloudflare-secrets-production-deploy/outputs/phase-13/rollback-runbook.md` | SOP の rollback セクションから「逆参照リンク」として参照する。再記述はしない |
| `docs/30-workflows/completed-tasks/ut-25-cloudflare-secrets-production-deploy/outputs/phase-13/deploy-runbook.md` | 初回配置手順との重複を避け、SOP は「上書き（rotate）」専用で記述する |
| `scripts/cf.sh` | 既存 wrapper をそのまま利用。本タスクで cf.sh 本体は改修しない（subcommand 追加せず独立 helper を作る） |
| `scripts/check-cf-rotation-reminder.sh` | 既存リマインダー機構との責務分離を Phase 2 §2.3 で記録 |

## 受入条件 (AC) — 本タスク正本

stub の完了条件 9 件を AC として固定する:

- AC-1: SOP 文書が `docs/30-workflows/runbooks/sa-key-rotation-sop.md` として確定している
- AC-2: ローテーション頻度（90 日採用）が根拠付きで明記されている
- AC-3: staging → production の上書き順序が固定されている
- AC-4: `bash scripts/cf.sh secret put` が stdin 経由のみであることと `HISTFILE=/dev/null` 併用が明記されている
- AC-5: 旧 key 失効猶予期間（grace period 24〜48 時間 + disable 後 7 日保持）が明記されている
- AC-6: 無停止性確認手順（`wrangler tail` 60 秒待機 + UT-26 疎通テスト）が明記されている
- AC-7: ローテーション失敗時の rollback 経路が `outputs/phase-13/rollback-runbook.md` を参照する形で記述されている
- AC-8: 実 secret 値・JSON 内容・OAuth トークンが文書中に一切含まれていない（`op://` 参照のみ）
- AC-9: 完了記録テンプレートが SOP に同梱されている

stub 由来の追加 AC:

- AC-10: helper `scripts/cf-rotate-sa-key.sh` が stdin パイプ強制 / `HISTFILE=/dev/null` 強制 / dry-run mode をサポートし、bats テスト全件 PASS / shellcheck PASS
- AC-11: 完了記録テンプレに「実施日 / 実施者 / 旧 key fingerprint / 新 key fingerprint / staging 検証時刻 / production 検証時刻 / disable 時刻 / delete 時刻」の必須フィールドが含まれている
- AC-12: スコープ重複チェック（UT-25-DERIV-02 失効監視 / UT-25-DEFER-01 DR backup）が Phase 12 unassigned-task-detection.md で実施されている

## 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | SA key 漏洩リスク低減、Google IAM ベストプラクティス遵守 |
| 実現性 | PASS | 既存 `scripts/cf.sh` + `op run` + bats で完結、新規外部依存なし |
| 整合性 | PASS | CLAUDE.md「Cloudflare 系 CLI 実行ルール」「ローカル `.env` 運用ルール」と整合 |
| 運用性 | PASS | SOP + 完了記録テンプレ + helper の dry-run で再現可能 |

## 成果物

- 本 phase-1.md
- outputs/phase-1/main.md は実装 Phase 進行時に追加（仕様書段階では空）

## 完了条件

- [ ] AC-1〜AC-12 が本ファイルに記載されている
- [ ] artifact canonical 名 4 件が確定している
- [ ] carry-over 棚卸し表が記載されている
- [ ] 既存命名規則調査結果（4 観点）が記録されている
- [ ] 4 条件評価が全 PASS
- [ ] タスク分類 NON_VISUAL / 実装仕様書 が明記されている

## 次 Phase

Phase 2: 設計（state machine / helper API / SOP 章立て / 完了記録テンプレフィールド）
