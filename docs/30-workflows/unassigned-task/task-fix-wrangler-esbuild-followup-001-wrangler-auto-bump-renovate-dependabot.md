# wrangler 自動 bump（Renovate / Dependabot）+ root esbuild override 同期 - タスク指示書

## メタ情報

| 項目         | 内容                                                                                |
| ------------ | ----------------------------------------------------------------------------------- |
| タスクID     | fix-wrangler-esbuild-followup-001-wrangler-auto-bump-renovate-dependabot            |
| タスク名     | wrangler 自動 bump（Renovate / Dependabot）+ root esbuild override 同期             |
| 分類         | 改善 / dependency-automation                                                        |
| 対象機能     | `wrangler` の version bump 自動化と `package.json#pnpm.overrides.esbuild` の同期    |
| 優先度       | 中                                                                                  |
| 見積もり規模 | 小規模                                                                              |
| ステータス   | unassigned                                                                          |
| 発見元       | `completed-tasks/fix-wrangler-esbuild-import-source-error/` Phase 10 MINOR #1       |
| 発見日       | 2026-05-15                                                                          |

## Canonical Workflow Status

- 発生 workflow: `docs/30-workflows/completed-tasks/fix-wrangler-esbuild-import-source-error/`
- 状態: `unassigned`（Phase 10 で MINOR・未タスク化対象として宣言済み）

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`fix-wrangler-esbuild-import-source-error` インシデントは、`wrangler` が同梱する `esbuild` バージョンと、root `package.json#pnpm.overrides.esbuild` が乖離したことが起点だった。本インシデントは手動 bump で解消したが、再発防止には wrangler の version bump 自体を自動化し、override 側にも同期 PR を出す仕組みが要る。

### 1.2 問題点・課題

- `wrangler` の patch / minor bump が放置されると、同梱 `esbuild` だけが更新され override と乖離する
- 現状 Renovate / Dependabot のいずれも未設定（または `wrangler` 専用の grouping 未定義）
- override 値は機械的に同期できる対象なのに、人手 PR に依存している

### 1.3 放置した場合の影響

- 同種インシデント（`import` source error 等）が再発しうる
- root override が古いまま固定され、Cloudflare deploy 時の bundler 挙動がローカルと乖離する

---

## 2. 何を達成するか（What）

### 2.1 目的

`wrangler` の bump を Renovate（または Dependabot）で自動 PR 化し、同じ PR / 連携 PR で `package.json#pnpm.overrides.esbuild` を `wrangler` 同梱版に同期する。

### 2.2 最終ゴール

- Renovate / Dependabot 設定ファイル（`.github/renovate.json` または `.github/dependabot.yml`）が存在し、`wrangler` を専用 group としてスケジュール bump する
- bump PR には `package.json#pnpm.overrides.esbuild` の同期差分が含まれる（postUpgradeTasks / regex manager / 連携スクリプト いずれか）
- bump PR の CI で `pnpm install --frozen-lockfile=false` と既存 lint/typecheck が green

### 2.3 スコープ

#### 含むもの

- Renovate / Dependabot 設定の追加
- `wrangler` 同梱 esbuild バージョン取得スクリプト（`pnpm view wrangler@X dependencies.esbuild`）
- root override の自動書き換え / PR 反映ロジック
- README / `docs/00-getting-started-manual/` 内の運用ノート追記

#### 含まないもの

- OpenNext / `@opennextjs/cloudflare` の自動 bump（followup-003 で扱う）
- wrangler 設定（`wrangler.toml`）自体の schema 変更
- 既存インシデントの再修正

### 2.4 成果物

- 設定ファイル（Renovate or Dependabot）
- override 同期スクリプト or regex manager 設定
- 運用ドキュメント追記

---

## 3. どのように実行するか（How）

### 3.1 受入条件 (AC)

- AC-1: `wrangler` の bump が自動 PR として作成される（dry-run / scheduled run で確認）
- AC-2: 自動 PR に root `package.json#pnpm.overrides.esbuild` の同期差分が含まれる
- AC-3: 自動 PR の CI（lint / typecheck / build）が green
- AC-4: `docs/00-getting-started-manual/` に運用ノートが追加されている
- AC-5: followup-002（CI gate）と矛盾しない設定になっている

---

## 4. 関連リソース

- 親 workflow: `docs/30-workflows/completed-tasks/fix-wrangler-esbuild-import-source-error/`
- Phase 10 MINOR #1: `…/phase-10.md` §10.3
- 関連: followup-002（CI gate）/ followup-003（trio drift check）
