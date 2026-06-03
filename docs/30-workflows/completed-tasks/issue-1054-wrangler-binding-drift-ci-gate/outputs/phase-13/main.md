# Phase 13 成果物: PR 本文ドラフト

issue-1054-wrangler-binding-drift-ci-gate / Phase 13 / 状態: pending_user_approval

本書は実装サイクル（`03.実装.md`）完了後に作成する PR の本文ドラフト雛形である。本ワークフロー（spec_created）では PR を作成しない。commit / push / PR / Issue mutation は CONST_002 によりユーザーの明示承認後のみ実行する。本書は artifacts.json の Gate-C `evidence_path` として参照される。

- PR base: `dev`（CLAUDE.md PR 作成フロー既定）。production リリース時の `dev → main` ではない。
- GitHub Issue #1054 は **CLOSED のまま**。本文に `Refs #1054`。再 open / Issue mutation は行わない。

---

## タイトル案

```
feat(ci): wrangler.toml binding ↔ env.ts ↔ inventory 三者ドリフト検出 gate (issue-1054)
```

## PR 本文ドラフト

### 概要

`apps/api/wrangler.toml` の binding 宣言を read-only 解析し、(a) `apps/api/src/env.ts` の `Env` 型に対応 property があるか、(b) applied binding が `deployment-cloudflare.md` の「Current Cloudflare binding inventory」表に記載されているか、を突合し、ドリフトがあれば非ゼロ exit する CI gate を新設する。あわせて現存ドリフト（`MEMBER_PHOTOS` の棚卸し表欠落）を是正し、D1 / Analytics も同じ inventory gate に含める。

### 背景（root cause）

issue #1054 が解こうとしたドリフトは「将来再発」ではなく **既に `MEMBER_PHOTOS`（issue-983 で追加された R2 binding）で発生している**。wrangler.toml と env.ts には反映済みだが、`deployment-cloudflare.md` の棚卸し表に行が無く、三者が乖離していた。本 PR は (a) 検出 gate の新設に加え、(b) 現存ドリフトの是正までを 1 サイクルで完了する（CONST_007）。

### 変更ファイル（5 件）

| パス | 変更種別 | 概要 |
| --- | --- | --- |
| `scripts/verify-wrangler-binding-drift.mjs` | 新規 | read-only 解析 gate（行パーサ + reconcile + main。exit code 0/1） |
| `scripts/__tests__/verify-wrangler-binding-drift.spec.ts` | 新規 | 回帰 spec（TC-01〜TC-10・`.spec.ts` 厳守 / 不変条件 #8） |
| `.github/workflows/verify-wrangler-binding-drift.yml` | 新規 | 変更 path トリガの CI gate job（Node 24 / 既存 verify-* 規約整合） |
| `package.json` | 編集 | `verify:wrangler-binding-drift` script 追記 |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | 編集 | `MEMBER_PHOTOS` 行追加 + 機械検出対象 SSOT 注記（AC-10） |

### 検証コマンド（PR 前に exit 0 を確認）

```bash
mise exec -- pnpm typecheck                        # exit 0
mise exec -- pnpm lint                             # exit 0
mise exec -- pnpm vitest run scripts/__tests__/verify-wrangler-binding-drift.spec.ts  # TC-01〜TC-10 全 pass（リポジトリルートから実行）
mise exec -- pnpm verify:wrangler-binding-drift    # exit 0（AC-10 棚卸し表是正後）
```

### 受入条件

AC-1〜AC-11（index.md 参照）を満たす。特に AC-10: `deployment-cloudflare.md` 棚卸し表に `MEMBER_PHOTOS` 行を追加し、現行 repo で `pnpm verify:wrangler-binding-drift` が exit 0 になる（現存ドリフト是正 = 根本解決）。

### 残課題（未タスク候補）

新規未タスクは 0 件。R-1（全 binding inventory 化）は Current Cloudflare inventory への拡張で同一サイクル解決済み。

### Refs

Refs #1054

🤖 Generated with [Claude Code](https://claude.com/claude-code)

---

## user-gated 注記

- 本 PR は実装サイクル（`03.実装.md`）で変更 5 ファイルを実装し、上記検証 4 コマンドが exit 0 になった後に作成する。
- `git add` / `git commit` / `git push` / `gh pr create --base dev` は **ユーザーの明示承認後のみ**実行する（CONST_002）。
- 作業ブランチが `dev` 直上の場合は `feat/issue-1054-wrangler-binding-drift-ci-gate` を自律作成し、`origin/dev` 同期後に PR を作成する。
- GitHub Issue #1054 は **CLOSED のまま**。`Refs #1054` で参照のみ。再 open / close / ラベル変更は行わない。
