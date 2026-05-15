# OpenNext / wrangler / esbuild 三者 dependency drift 月次チェック - タスク指示書

## メタ情報

| 項目         | 内容                                                                                |
| ------------ | ----------------------------------------------------------------------------------- |
| タスクID     | fix-wrangler-esbuild-followup-003-opennext-wrangler-esbuild-trio-drift-check        |
| タスク名     | OpenNext / wrangler / esbuild 三者 dependency drift 月次チェック                    |
| 分類         | 改善 / scheduled-audit                                                              |
| 対象機能     | `@opennextjs/cloudflare` / `wrangler` / `esbuild` 三者の互換関係を月次で監査        |
| 優先度       | 中                                                                                  |
| 見積もり規模 | 小規模                                                                              |
| ステータス   | unassigned                                                                          |
| 発見元       | `completed-tasks/fix-wrangler-esbuild-import-source-error/` Phase 10 MINOR #3       |
| 発見日       | 2026-05-15                                                                          |

## Canonical Workflow Status

- 発生 workflow: `docs/30-workflows/completed-tasks/fix-wrangler-esbuild-import-source-error/`
- 状態: `unassigned`（Phase 10 で MINOR・未タスク化対象として宣言済み）

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

本インシデントは `wrangler` 同梱 `esbuild` と root override の drift が直接原因だったが、`apps/web` は `@opennextjs/cloudflare` の bundler 互換にも依存している。三者（`@opennextjs/cloudflare` / `wrangler` / `esbuild`）のいずれかが想定外の minor / major bump をすると、PR 単位の gate（followup-002）だけでは把握しきれない複合 drift が発生する。

### 1.2 問題点・課題

- followup-002 の CI gate は wrangler↔esbuild の 2 者比較に閉じる
- `@opennextjs/cloudflare` が要求する `wrangler` / `esbuild` の互換レンジは別に管理されている
- PR 単位ではなく **時系列で** 監視しないと検知しづらいケースがある（リリース直後の semver drift 等）

### 1.3 放置した場合の影響

- OpenNext の bundler 挙動変更による `apps/web` ランタイムエラーの再発
- 三者互換 matrix が誰も把握していない状態が継続する

---

## 2. 何を達成するか（What）

### 2.1 目的

月次（GitHub Actions `schedule` cron）で `@opennextjs/cloudflare` / `wrangler` / `esbuild` の互換関係を audit し、互換レンジ違反 / 推奨レンジ外を Issue / Notion / Slack へ通知する。

### 2.2 最終ゴール

- 月次 scheduled workflow が動作し、audit レポートが artifact として保存される
- 互換違反検出時に Issue 自動起票（または既存 alert relay 経由通知）
- 互換 matrix の正本 doc が `docs/00-getting-started-manual/` に存在する

### 2.3 スコープ

#### 含むもの

- audit スクリプト（`pnpm view` / `npm view` で 3 パッケージの dependencies / peerDependencies を取得し比較）
- 月次 scheduled workflow（`.github/workflows/`）
- Issue auto-open（既存 alert relay / `gh issue create` どちらかに揃える）
- 互換 matrix doc

#### 含まないもの

- 自動 bump / 自動修正（followup-001 の責務）
- PR 単位 gate（followup-002 の責務）
- Cloudflare Workers ランタイム自体の互換性監視

### 2.4 成果物

- audit スクリプト
- 月次 workflow YAML
- 互換 matrix doc
- 通知経路の運用ノート

---

## 3. どのように実行するか（How）

### 3.1 受入条件 (AC)

- AC-1: scheduled workflow が月次で動作している evidence（GitHub Actions URL）
- AC-2: 意図的に互換違反な状態を作ったとき Issue / 通知が発火する evidence
- AC-3: 互換 matrix doc が `docs/00-getting-started-manual/` に存在し、最新の三者バージョンと推奨レンジが書かれている
- AC-4: followup-001 / followup-002 と役割重複が無いことが doc 上で明示されている

---

## 4. 関連リソース

- 親 workflow: `docs/30-workflows/completed-tasks/fix-wrangler-esbuild-import-source-error/`
- Phase 10 MINOR #3: `…/phase-10.md` §10.3
- 関連: followup-001（自動 bump）/ followup-002（PR 単位 CI gate）
