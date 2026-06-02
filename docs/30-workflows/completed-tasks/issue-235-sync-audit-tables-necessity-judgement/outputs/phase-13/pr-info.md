# Phase 13 Output: PR 情報（ドラフト）

> **未承認のため未実行**。本ファイルは PR ドラフトであり、`git add` / `commit` / `push` / `gh pr create` はユーザーの明示承認後にのみ実行する。承認前は本ファイルへの記録に留め、リポジトリへの変更操作を一切行わない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | task-ut21-sync-audit-tables-necessity-judgement-001 |
| Phase | 13 / 13 |
| 種別 | docs-only / 設計判定（NON_VISUAL） |
| 確定判定 | **新設不要（NO NEW TABLE REQUIRED）** |
| GitHub Issue | #235（CLOSED 維持・reopen しない） |
| 実行状態 | **未実行（ユーザー承認待ち）** |

## 1. PR タイトル案

```
docs(issue-235): sync_audit_tables necessity judgement 仕様書作成
```

代替案（いずれか採用可）:

- `docs(issue-235): sync_audit_logs / sync_audit_outbox 必要性判定を新設不要で確定`
- `docs(issue-235): UT-21 sync audit tables 判定タスク仕様書（新設不要）`

## 2. base ブランチ

| 項目 | 値 |
| --- | --- |
| base | **dev**（開発統合ブランチ） |
| head | 作業ブランチ（`docs/issue-235-sync-audit-tables-necessity-judgement` 等） |
| 補足 | `main` への PR は production リリース時の `dev → main` のみ。本 PR は対象外 |

## 3. PR 本文ドラフト

```markdown
## 目的

UT-21 が当初前提としていた `sync_audit_logs`（毎実行の詳細監査ログ）と
`sync_audit_outbox`（audit 書込失敗時の at-least-once 退避 outbox）を新規テーブルとして
導入すべきか否かを、最新コードベース（origin/dev `f6faeb005`）の実測に基づいて確定判定し、
判定証跡を仕様書化する。親 close-out（Issue #234）が「保留（U02 へ委譲）」とした状態を、
確定した判定証跡として閉じる。

## 判定結論

**新設不要（NO NEW TABLE REQUIRED）**

現行の `sync_jobs` ledger + `sync_job_logs` 補助台帳 + zod 構造化 `metrics_json` で
UT-21 が要求した audit 観点 O-1〜O-4 を充足する。判定基準 4.3 の 3 条件
（行単位差分必須 / sync_jobs 書込失敗の別経路記録 / 外部監査・コンプラ分離要請）は
すべて非該当。`sync_jobs` 拡張（カラム追加）も不要（`metrics_json` が passthrough zod で
任意キー拡張に対応済み）。

将来の再検討は解除条件 T-1〜T-3 として受け皿（別実装タスク）を明示済み。
本サイクルでは該当ゼロのため起票しない（CONST_005 の先送りではなく将来条件）。

## 含む成果物

- index.md（タスク仕様書 index）
- phase-01.md 〜 phase-13.md（Phase 別仕様書 13 本）
- outputs/phase-01/main.md（監査スコープ・inventory・4条件評価）
- outputs/phase-02/gap-analysis-and-verdict.md（ギャップ表 + 判定基準 4.3 + 確定判定：正本成果物）
- outputs/phase-03/main.md（代替案比較・判定再解釈方針固定）
- outputs/phase-04/raw-evidence.md（rg/grep 検索ログ：sync_audit_* 非存在 / sync_jobs 棚卸し）
- outputs/phase-05/verdict-runbook.md（確定判定記録 + docs-only 確定 + 解除条件）
- outputs/phase-06/failure-cases.md（誤判定シナリオ）
- outputs/phase-07/ac-matrix.md（AC × 検証 × 成果物トレース）
- outputs/phase-08/main.md（親 close-out §(d) / task-workflow.md current facts 突合）
- outputs/phase-09/main.md（正本整合監査）
- outputs/phase-10/go-no-go.md（GO/NO-GO 判定：GO）
- outputs/phase-11/*（再現コマンド実行記録・0 差分確認）
- outputs/phase-12/*（ドキュメント更新一式：implementation-guide 等）
- outputs/phase-13/pr-info.md（本ファイル）
- artifacts.json（機械可読サマリー）

## コード差分

- **0 件**。docs-only / 設計判定タスクのため `apps/` / `packages/` への変更なし。
  判定結論「新設不要」によりマイグレーション追加・`apps/api` audit writer 実装は発生しない。

## CI ゲート（docs-only 想定）

- `verify:phase12-compliance`（canonical 9 見出し / Phase 11 evidence 表 / workflow root scan）
- `gate-metadata:validate`（artifacts.json zod schema）
- `indexes:rebuild` drift（skill indexes 冪等）

## 関連

- Refs #235（CLOSED 維持。reopen しない。本 PR は判定証跡の文書化のみ）
- 親 close-out: Issue #234（CLOSED）/ docs/30-workflows/completed-tasks/ut21-forms-sync-conflict-closeout

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 4. 未承認のため未実行であることの明記

- 本 Phase の `git fetch` / `git merge` / `git add` / `git commit` / `git push` / `gh pr create` は
  **すべてユーザーの明示承認後にのみ実行する**。
- 本ファイル作成時点では PR は **未作成**。リポジトリへの変更操作は一切行っていない。
- 承認取得後、phase-13.md の実行ステップ 2〜5 を順に実行し、本ドラフトを PR 本文の正本とする。

## 5. PR 作成前チェック（承認後に確認）

- [ ] `git status --porcelain` が空（未コミット変更なし）
- [ ] `git diff dev...HEAD --name-only` が PR 対象ファイル一覧として取得でき、`apps/` / `packages/` 差分 0 件
- [ ] docs-only ゲート（`bash scripts/verify-pr-ready.sh`）が PASS
- [ ] PR 本文が本ドラフトと整合（成果物一覧の漏れなし）
- [ ] `Refs #235`（`Closes` ではない）で CLOSED Issue を reopen せず参照
- [ ] スクリーンショットなし（NON_VISUAL のため画像参照セクションを作らない）
