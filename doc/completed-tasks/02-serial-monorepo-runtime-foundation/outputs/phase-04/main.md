# Phase 4: 事前検証手順 — 主成果物

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 / 13 |
| 状態 | completed |
| 作成日 | 2026-04-26 |

## 事前確認コマンド一覧

Phase 5 のセットアップ実行前に確認すべきコマンドと期待値を定義する。

| コマンド | 目的 | 期待値 |
| --- | --- | --- |
| `node --version` | Node.js バージョン確認 | `v24.x.x` |
| `pnpm --version` | pnpm バージョン確認 | `10.x.x` |
| `wrangler --version` | Wrangler バージョン確認 | `4.x.x` |
| `cat pnpm-workspace.yaml` | workspace 設定確認 | `packages: ['apps/*', 'packages/*']` |
| `pnpm install` | 依存インストール確認 | エラーなし |
| `pnpm typecheck` | TypeScript 型チェック | TypeScript 6.x strict で通ること |
| `pnpm lint` | lint 確認 | lint エラーなし |

## 正本仕様検索コマンド

```bash
rg -n "apps/web|apps/api|packages/shared|packages/integrations" doc/02-serial-monorepo-runtime-foundation
rg -n "dev|main|D1|1Password" doc/02-serial-monorepo-runtime-foundation
git diff --stat -- doc/02-serial-monorepo-runtime-foundation
```

## 期待出力表

| 検証項目 | PASS 条件 |
| --- | --- |
| Node.js バージョン | v24.x.x |
| pnpm バージョン | 10.x.x |
| Wrangler バージョン | 4.x.x |
| pnpm workspace | apps/* / packages/* が含まれる |
| dependency rule | upstream / downstream が説明できる |
| 変更範囲確認 | doc/02-serial-monorepo-runtime-foundation スコープ外の drift がない |

## verify suite（手動 or 自動）

| 種別 | 確認内容 |
| --- | --- |
| 手動 | index.md と phase ファイルの整合確認 |
| 手動 | source-of-truth（D1 canonical）と branch/env の説明確認 |
| 自動 | `rg -n "apps/web\|apps/api\|packages/shared\|packages/integrations" doc/02-serial-monorepo-runtime-foundation` で責務境界確認 |

## apps/web / apps/api 現状確認

| ファイル | 現状 | 確認事項 |
| --- | --- | --- |
| apps/web/wrangler.toml | 存在する（OpenNext Workers 形式） | `main = ".open-next/worker.js"` / `[assets]` を確認済み |
| apps/api/wrangler.toml | 存在する（Hono Workers 設定・D1 binding 含む） | 設定は適切。D1 binding 確認済み |
| pnpm-workspace.yaml | 作成済み | workspace 定義を確認 |
| package.json（ルート） | 作成済み | engines / scripts を確認 |
| apps/web/package.json | 作成済み | Next.js / OpenNext scripts を確認 |
| apps/api/package.json | 作成済み | Hono Workers scripts を確認 |
| packages/shared/ | 作成済み | runtime foundation contract を確認 |
| packages/integrations/ | 作成済み | integration runtime target を確認 |

注記: このタスクは `code_and_docs` タスクとして close-out する。実ファイルは current facts に合わせて作成済み。

## 4条件確認

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 実施前に矛盾・漏れを検出し、Phase 5 の実行失敗リスクを下げる |
| 実現性 | PASS | 確認コマンドはすべてローカルで実行可能 |
| 整合性 | PASS | outputs/phase-02 の設計と一致した検証項目 |
| 運用性 | PASS | Phase 5 へ引き継ぎ可能な明確な期待値を定義 |

## Phase 4 → Phase 5 handoff

| 引き継ぎ事項 | 内容 |
| --- | --- |
| 確認コマンド一覧 | 上記テーブル参照 |
| 現状確認 | workspace / apps / packages の作成済み状態を Phase 5 と Phase 12 に同期する |
| blocker | なし |

## 完了条件チェック

- [x] 主成果物が作成済み
- [x] 正本仕様参照が残っている
- [x] downstream handoff が明記されている
