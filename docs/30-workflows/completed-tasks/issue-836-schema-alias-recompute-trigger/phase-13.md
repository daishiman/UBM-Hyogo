# Phase 13: PR 作成・振り返り

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 / 13 |
| 名称 | PR 作成・振り返り（user-gated push / PR） |
| 依存 | phase-12.md + outputs/phase-12/*（6 files）+ artifacts.json |
| 成果物 | 本ファイル + outputs/phase-13/pr-summary.md |
| 状態 | **blocked**（runtime_pending / user-gated push・PR 未実行） |
| PR base | **`dev`**（CLAUDE.md 既定。production リリース時のみ `dev → main`） |
| ブランチ | `docs/issue-836-schema-alias-recompute-trigger-spec`（spec のみの場合）/ 実装込みなら `feat/issue-836-schema-alias-recompute-trigger`（artifacts.json `user_gated_operations` の push 先と整合） |
| 親 Issue 操作 | **Issue #836 CLOSED 維持**（reopen / 再 close しない） |
| visualEvidence | VISUAL（admin UI screen diff あり。screenshot 参照は runtime 取得後に PR 本文へ反映） |

## 目的

Phase 1〜12 の成果物を 1 PR にまとめ、`dev` ブランチを base に PR を作成するための **PR 本文を spec 化**する。本 Phase はタスク仕様書作成フェーズであり、**push（`git push`）・`gh pr create` は実行しない**。実 PR 作成は user 明示承認後の実装ウェーブで行う。

CLAUDE.md「PR 作成の完全自律フロー」に従いつつ、本タスクは以下を満たす:

- PR base は `dev`。`main` への PR は production リリース時の `dev → main` のみ。
- 現在ブランチの全変更（staged / unstaged / untracked / committed）を漏れなく PR に含める方針を spec として明記する。
- PR 本文は `.claude/commands/ai/diff-to-pr.md` を Phase 13 仕様として参照し、`outputs/phase-12/implementation-guide.md` の内容を反映する。

## user-gated 制約（最重要・本 Phase の絶対前提）

> **本タスク仕様書作成フェーズでは push / PR を一切実行しない。**

| 操作 | コマンド | 実行可否 |
| --- | --- | --- |
| spec 作成（本 Phase の責務） | Markdown ファイル作成のみ | ✅ 実行する |
| staging D1 migration apply | `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db --env staging` | ❌ **user 明示承認後のみ** |
| production D1 migration apply | `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production` | ❌ **user 明示承認後のみ** |
| push | `git push origin docs/issue-836-schema-alias-recompute-trigger-spec`（実装込みなら `feat/...`） | ❌ **user 明示承認後のみ** |
| PR 作成 | `gh pr create --base dev` | ❌ **user 明示承認後のみ** |

- artifacts.json `metadata.governance_mutation_user_gate = true` / `user_approval_marker = "required before each mutation command"` / `user_gated_operations`（4 件）と整合。
- Claude は **PR 本文を spec 化するだけ**で、本フェーズで push / PR / migration apply を実行しない。
- Gate-C（artifacts.json）は `pending`（runtime_pending）。staging migration apply + visual baseline + recompute runtime evidence は user-gated。

## 品質検証（実 PR 作成時に実行する 4 コマンド）

> push / PR の user 承認後、実装ウェーブで以下 4 コマンドのみを実行する（CLAUDE.md「PR 作成の完全自律フロー」§5）。本 spec フェーズでは実行しない。

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh   # docs-only gate pre-flight（gate-metadata:validate / verify:phase12-compliance / indexes:rebuild drift）
```

- 失敗時は最大 3 回まで自動修復し、修復差分をコミットする（CLAUDE.md §6）。
- `verify-pr-ready.sh` 失敗時は `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` §1〜§5 を参照して原因切り分け。
- テストコード実行は user 明示なき限り本フローでは行わない。

## ブランチ / base 方針

- base: **`dev`**（CLAUDE.md「既定の PR base ブランチは `dev`」）。
- 作業ブランチ:
  - spec のみの PR → `docs/issue-836-schema-alias-recompute-trigger-spec`
  - 実装込みの PR → `feat/issue-836-schema-alias-recompute-trigger`
- `git fetch origin dev` → ローカル `dev` を `origin/dev` に fast-forward → 作業ブランチへ `dev` を merge → conflict は CLAUDE.md「コンフリクト解消の既定方針」に従い自律解消。
- production への `dev → main` PR は本タスクのスコープ外（リリース時に別途）。

## 実 PR 作成時の実行順序（user 承認後）

1. [ ] 現在ブランチ・変更状況を確認。`dev` 直上なら作業ブランチを自律作成。
2. [ ] `git fetch origin dev` → ローカル `dev` を fast-forward 同期。
3. [ ] 作業ブランチへ `dev` を merge（conflict は自律解消 → `git add` → `git commit`）。
4. [ ] 品質検証 4 コマンド実行（失敗は最大 3 回自動修復）。
5. [ ] `git status --porcelain` で未コミット変更を確認し `git add -A` で全件コミット。
6. [ ] `git diff dev...HEAD --name-only` で PR 対象ファイル一覧を取得（漏れなし確認）。
7. [ ] `outputs/phase-13/pr-summary.md` と `outputs/phase-12/implementation-guide.md` を参照して PR 本文を作成。
8. [ ] **user 承認後**に `git push` → `gh pr create --base dev` を実行。
9. [ ] PR URL を本ファイルに記録。

## 振り返り（retrospective）

### CLOSED Issue を最新コードに最適化して仕様化した知見

- Issue #836 は CLOSED（2026-05-23T10:24:48Z）かつ linked PR / comment なし。closure 経緯は不明だったため、**コード実態（recompute 未実装）を判断根拠**として再調査した。
- 「他タスクで解決済みか」の鮮度調査の結果、recompute 実行 API / workflow / audit action / 実行 UI はいずれも未実装で、`SchemaDiffPanel.tsx:248-250` の warning text のみが残存していた（`backfill/trigger` endpoint は Issue #504 の 50k fixture stress 専用で別物）。**未解決と確定**し、CLOSED を reopen せず本仕様書で local implementation + 正本同期まで完結させる方針を採った。
- 教訓: CLOSED Issue でも「コード実態を一次根拠にする」ことで、issue 文面の陳腐化に引きずられず最新コードへ最適化できる。`spec_creation_strategy = optimize_to_current_codebase`（artifacts.json）として記録。

### recompute = reverse-backfill の発見

- 原典 #836 は「集計済み表示・派生テーブル」を再集計対象と想定していたが、現コードベースに独立した派生集計 view / テーブルは**未実在**だった。
- 実体としての「派生データ」は **`response_fields.stable_key`** であり、recompute の正体は resolve 時 `backfillResponseFields()`（`schemaAliasAssign.ts:192-277`）が `__extra__:{questionId}` → `newStableKey` へ書き換えた処理の**逆操作（reverse-backfill）**であると突き止めた。
- これにより「rollback で alias を取り消したのに `response_fields` が古い stableKey のまま残り集計が汚染される」という根本問題を、`alias.stableKey` → `__extra__:{aliasQuestionId}` への idempotent な reverse-backfill（+ audit + job status）として定義し直せた。
- idempotency は `schema_alias_recompute_jobs` の `(alias_id, stable_key, trigger_key)` UNIQUE + SQL 冪等の二重防御で担保（Phase 03 因果ループ「二重 recompute → 二重変動」を遮断）。
- 教訓: 抽象的な issue 文面の語（「再集計」「派生テーブル」）を、現コードの実装パターン（backfill）の対称操作へ読み替えることで、新規 view 追加を避けて最小差分で根本解決できた。

### CONST_007 スコープ分離の知見

- bulk recompute（followup-006）・通知（followup-007）・Queue fan-out 非同期化は、recompute 単体経路の前提条件ではないため CONST_007 例外条件 1 として明示分離し、既存 unassigned-task に残置（重複起票なし）。Queue fan-out 化は Phase 12 で未タスク化候補として formalize。

## DoD

- [ ] phase-13.md に user-gated 注記（push / `gh pr create` / migration apply は user 明示承認後のみ）が最重要として明記されている
- [ ] PR base = `dev`、ブランチ命名が artifacts.json `user_gated_operations` の push 先と整合している
- [ ] 品質検証 4 コマンド（`pnpm install --force` / `typecheck` / `lint` / `verify-pr-ready.sh`）が列挙されている
- [ ] outputs/phase-13/pr-summary.md が作成され、AC-1〜AC-13 充足サマリ・RAC-1〜3（runtime_pending）・テスト 4 系統・視覚証跡・破壊的変更なし・関連 Issue #836（CLOSED 維持）を含む
- [ ] PR 本文末尾に `🤖 Generated with [Claude Code](https://claude.com/claude-code)` を付与する旨が spec 記載されている
- [ ] 本 Phase で push / PR / migration apply を実行していない（Markdown 作成のみ）
- [ ] secret 実値が本ファイル / pr-summary.md に一切記載されていない

## 参照資料

- CLAUDE.md「PR 作成の完全自律フロー」（base = `dev` / push・PR は user 承認後）
- CLAUDE.md「Cloudflare 系 CLI 実行ルール」（`bash scripts/cf.sh` 経由必須・wrangler 直接禁止）
- `.claude/commands/ai/diff-to-pr.md`（Phase 13 PR 本文仕様）
- `outputs/phase-12/implementation-guide.md`（PR 本文に反映する実装ガイド）
- artifacts.json（`user_gated_operations` / `governance_mutation_user_gate` / Gate-C pending）
- index.md「受入条件 (AC)」「主要成果物」「不変条件」
