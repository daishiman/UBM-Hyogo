# Phase 12: ドキュメント更新

> [実装区分: 実装仕様書]

## Phase 12 strict 7 成果物

| Task | 成果物 | 概要 |
|---|---|---|
| 12-0 | `outputs/phase-12/main.md` | Phase 12 全体サマリ |
| 12-1 | `outputs/phase-12/implementation-guide.md` | Part 1（中学生レベル概念） + Part 2（技術詳細） |
| 12-2 | `outputs/phase-12/system-spec-update-summary.md` | `deployment-secrets-management.md` への反映内容 |
| 12-3 | `outputs/phase-12/documentation-changelog.md` | Step 1-A/1-B/1-C + Step 2 の結果 |
| 12-4 | `outputs/phase-12/unassigned-task-detection.md` | OIDC 完全移行・旧 token 失効を formalize（0件ではない、明示 2 件） |
| 12-5 | `outputs/phase-12/skill-feedback-report.md` | task-specification-creator skill への feedback |
| 12-6 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | root evidence |

## Task 12-1: implementation-guide.md 構成

### Part 1: 中学生レベル概念説明

> **例え話**: 家の鍵を 1 つだけ作って、家族全員（10 人）に同じ鍵を渡しているとする。誰か 1 人が鍵を落とすと、家全体が侵入されるリスクがある。今回の改修は「**玄関の鍵を、リビング・キッチン・お風呂で個別に分ける**」ようなもの。リビングで鍵を落としても、お風呂は無事。
>
> CI/CD 上では `CLOUDFLARE_API_TOKEN` が「家の鍵」、`build` / `lint` / `deploy` の各 step が「リビング」「キッチン」「お風呂」に相当する。今までは job 全体で鍵が共有されていたが、これからは `deploy` step だけが鍵を持つ。

### Part 2: 技術詳細

- step-scoped `env:` パターン
- `scripts/redaction-check.sh` の grep ロジック
- 既存 `scripts/cf.sh` 互換性（env var 名 `CLOUDFLARE_API_TOKEN` 維持）
- TypeScript 型定義: N/A（shell + yaml のみ）
- API シグネチャ: `bash scripts/redaction-check.sh [--log <path>] [--account-id <id>]`
- 設定可能パラメータ: `CLOUDFLARE_ACCOUNT_ID` 環境変数（オプション）

### 視覚証跡

`UI/UX変更なしのため Phase 11 スクリーンショット不要` — 代替証跡として `outputs/phase-11/manual-test-result.md` の自動テスト結果 + grep evidence を参照。

## Task 12-2: system-spec-update-summary.md（Step 1〜2 判定）

### Step 1-A: 完了タスク記録

- `deployment-secrets-management.md` に **完了タスクセクション**追加（issue-640）
- LOGS（aiworkflow-requirements / task-specification-creator の `_legacy.md`）2ファイル更新
- topic-map.md エントリ追加（`step-scoped CF token`）

### Step 1-B: 実装状況テーブル

- 「OIDC / step-scoped token cutover」: `未実装` → `完了`（step-scoped 部分のみ）
- 「OIDC 完全移行」: `unassigned`（未タスク化）

### Step 1-C: 関連タスクテーブル

- `issue-331-followup-003-oidc-step-scoped-cf-token-cutover.md` のステータス更新

### Step 2（新規インターフェース追加時のみ）

- ✅ **更新必要**: `deployment-secrets-management.md` に step-scoped pattern と redaction-check 仕様を追加
- 新規 `scripts/redaction-check.sh` の API 仕様反映

## Task 12-4: 未タスク検出（**2件 formalize**）

| ID | タスク名 | 理由 |
|---|---|---|
| `issue-640-followup-001-oidc-full-migration` | Cloudflare OIDC 完全移行 | CF 側 OIDC GA 待ち。本タスク CONST_007 例外として明示分離 |
| `issue-640-followup-002-legacy-token-revocation` | 旧 long-lived CLOUDFLARE_API_TOKEN の物理失効 | staging → production 安定化後の段階的失効が必要 |

両方とも `docs/30-workflows/unassigned-task/` 配下にスケルトンを作成する。

## Task 12-5: skill-feedback-report

- Phase 11 NON_VISUAL の代替証跡パターン適用例として記録
- shell script + yaml 改修タスクでの coverage は「分岐網羅 + grep evidence」で代替可能であることを skill にフィードバック

## Task 12-6: phase12-task-spec-compliance-check

- canonical 7 成果物の存在確認
- `artifacts.json` / `outputs/artifacts.json` parity 確認
- task-spec compliance の root evidence

## DoD

- [x] 7 成果物すべて存在（`outputs/phase-12/` 7 ファイル確認済み）
- [x] LOGS 2 ファイル更新（SKILL.md 本体変更は不要）
- [x] unassigned 2件作成（`issue-640-followup-001-oidc-full-migration.md`, `issue-640-followup-002-legacy-token-revocation.md`）
- [x] `pnpm indexes:rebuild` 実行（CI `verify-indexes-up-to-date` gate で担保）
