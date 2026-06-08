# Phase 13: commit / PR（user-gated）

`[実装区分: 実装仕様書]` / implementation_mode: `new` / 視覚証跡: **VISUAL** / status: `completed`

> **status: `pending`（ユーザー明示承認後のみ実行）**

---

## 0. 本サイクルの宣言（最重要）

本サイクルでは apps/web 実装・focused tests・typecheck・ドキュメント同期まで完了した。
**commit / push / PR はユーザー明示承認なしに実行しない。** Runtime/staging screenshot 取得も user-gated として残す。

| 操作 | 本サイクルでの状態 |
|------|--------------------|
| `git add` / `git commit` | 未実行（user-gated） |
| `git push` | 未実行（user-gated） |
| `gh pr create --base dev` | 未実行（user-gated） |
| GitHub Issue #1118 の状態変更 | 未実行（実態 `CLOSED` 確認済み・**CLOSED 維持**・mutation しない） |
| staging deploy / staging screenshot | 未実行（user-gated） |

---

## 1. mutation コマンド一覧（承認後・user-gated runtime/staging cycleで実行）

下記は **ユーザーの明示承認後にのみ** 実行する mutation。承認前は一切実行しない。

| # | mutation_command | base | 補足 |
|---|------------------|------|------|
| 1 | `git commit` | — | 実装差分（新規 4 + 編集 2）+ 本仕様書を含めてコミット |
| 2 | `git push` | — | 作業ブランチ `docs/issue-1118-admin-tag-catalog-lifecycle-ui-spec` を origin へ |
| 3 | `gh pr create --base dev` | **dev** | PR base は **dev**。production リリースではないため `main` ではない |

> Issue #1118 への `gh issue` 系 mutation（reopen / comment / close）は **行わない**。Issue は CLOSED 維持。

---

## 2. PR 作成方針（承認後）

| 項目 | 値 |
|------|-----|
| base ブランチ | **`dev`**（開発統合ブランチ・既定） |
| head ブランチ | `docs/issue-1118-admin-tag-catalog-lifecycle-ui-spec` |
| PR 本文の正本 | `outputs/phase-12/implementation-guide.md`（`.claude/commands/ai/diff-to-pr.md` を Phase 13 仕様として参照） |
| Issue リンク | #1118（CLOSED 維持・PR で再 open しない。参照リンクのみ） |
| screenshot | `outputs/phase-11/screenshots/` の PNG がuser-gated runtime/staging cycleで配置済みなら PR 本文に参照を含める。未配置なら screenshot セクションを作らない（薄メタ防止） |

---

## 3. user-gated runtime/staging cycle完了後の PR フロー（承認後の実行順序）

ユーザー承認後、必要なら runtime/staging screenshot を取得し、以下の順に検証を通してから PR を作成する。

| # | コマンド | 目的 |
|---|----------|------|
| 1 | `mise exec -- pnpm install --force` | 依存・lockfile 整合（worktree 独立 node_modules） |
| 2 | `mise exec -- pnpm typecheck` | 型チェック（新規 component / pure helper の型整合） |
| 3 | `mise exec -- pnpm lint` | リント（失敗時はまず `pnpm lint --fix`） |
| 4 | `bash scripts/verify-pr-ready.sh` | docs-only gate pre-flight（`verify:phase12-compliance` / `gate-metadata:validate` / `indexes:rebuild` drift を一括検証） |
| 5 | `mise exec -- pnpm --filter @ubm-hyogo/web test --run src/components/admin` | focused web test（`tagCatalogLifecycle` / `TagCatalogPanel` / `TagCatalogRow` + 非退化 `TagQueuePanel`） |
| 6 | `mise exec -- pnpm verify:tokens` | OKLch トークン正本 gate（AC-9・`verify-design-tokens`・HEX / `bg-[#xxx]` 検出で fail） |
| 7 | `gh pr create --base dev` | PR 作成（base=dev・本文は implementation-guide.md 正本） |

> 上記 1-6 が全 PASS した後にのみ 7（`gh pr create`）を実行する。いずれか失敗時は最大 3 回まで自動修復し、修復差分をコミットしてから再検証する（CLAUDE.md「PR作成の完全自律フロー」§品質検証失敗時の自動修復に準拠）。

---

## 4. PR 作成前チェック（承認後）

- `git status --porcelain` が空であること（未コミット変更を残さない）。
- `git diff dev...HEAD --name-only` で PR に含めるファイル一覧が取得できていること（新規 4 + 編集 2 + 仕様書を漏れなく含む）。
- `outputs/phase-12/implementation-guide.md` の主要見出しが PR 本文に反映されていること。
- `outputs/phase-11/screenshots/` の PNG 枚数と PR 本文の screenshot 参照が整合していること。screenshot が無い場合は専用セクションを残さない。

---

## 5. 前提・残課題

- 本 wave は local implementation / focused tests / typecheck / docs sync まで完了。
- commit / push / `gh pr create --base dev` / staging deploy / staging screenshot / GitHub Issue mutation は **すべて user の明示承認後のみ**。
- Issue #1118 は実態 `CLOSED`。本タスクで状態を変更しない（CLOSED 維持）。

---

## 6. 最終判定

**GATE（implemented_local_evidence_captured）: PASS（user-gated 分離確定）** — Phase 13 として PR フロー（base=dev・検証 6 ステップ → `gh pr create`）と mutation コマンド一覧（git commit / git push / gh pr create --base dev）を定義した。
本サイクルでは commit / PR を **実行しない**。Issue #1118 は CLOSED 維持。すべての mutation はユーザー明示承認後にuser-gated runtime/staging cycleで実行する。
