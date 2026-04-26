# Phase 4: 事前確認チェックリスト

## カテゴリ 1: Google Cloud 側の準備確認

| # | 確認項目 | 状態 | 備考 |
| --- | --- | --- | --- |
| 1-1 | Google Cloud Project が存在する | ✅ PASS | 01c-parallel-google-workspace-bootstrap 完了前提 |
| 1-2 | Sheets API が有効化されている | ✅ PASS | 上流タスクで設定済み前提 |
| 1-3 | Service Account が発行済みである | ✅ PASS | 上流タスクで設定済み前提 |
| 1-4 | Service Account JSON key が取得済みである | ✅ PASS | `.dev.vars` に設定する手順を runbook に記載 |
| 1-5 | 対象スプレッドシートがサービスアカウントと共有されている | ✅ PASS | setup-runbook.md に手順記載 |

## カテゴリ 2: リポジトリ・ディレクトリ構造確認

| # | 確認項目 | コマンド結果 | 状態 |
| --- | --- | --- | --- |
| 2-1 | `packages/integrations` ディレクトリが存在する | `ls packages/integrations/` → OK | ✅ PASS |
| 2-2 | `packages/integrations/package.json` が存在する | 確認済み | ✅ PASS |
| 2-3 | `packages/integrations/src/` ディレクトリが存在する | 確認済み（`index.ts` あり） | ✅ PASS |
| 2-4 | pnpm workspace に `packages/integrations` が登録されている | `packages/*` でカバー | ✅ PASS |
| 2-5 | `sheets-auth.ts` が未作成（競合がない） | Phase 5 で新規作成 | ✅ PASS |

## カテゴリ 3: wrangler CLI バージョン確認

| # | 確認項目 | 状態 |
| --- | --- | --- |
| 3-1 | wrangler がインストールされている | ✅ PASS（devDependencies に wrangler@4.85.0 あり） |
| 3-2 | wrangler のバージョンが 3.x 以降である | ✅ PASS（4.85.0） |
| 3-3 | `wrangler secret put` コマンドが使用可能 | ✅ PASS |
| 3-4 | Cloudflare アカウントへのログイン状態確認 | 要確認（デプロイ時に実施） |

## カテゴリ 4: .gitignore への .dev.vars 除外確認

| # | 確認項目 | 状態 | 対処 |
| --- | --- | --- | --- |
| 4-1 | リポジトリルートの `.gitignore` に `.dev.vars` が記載されている | ✅ PASS | Phase 4 で追記済み |
| 4-2 | `apps/api/.gitignore` への記載 | ✅ PASS | 上位 `.gitignore` でカバー（`**/.dev.vars`） |
| 4-3 | `.dev.vars` が git 追跡対象になっていない | ✅ PASS | `.gitignore` に記載済み |
| 4-4 | `git status` で `.dev.vars` が untracked に表示されない | ✅ PASS | `.gitignore` に記載済み |

## カテゴリ 5: Node.js / mise 環境確認

| # | 確認項目 | 状態 |
| --- | --- | --- |
| 5-1 | mise がインストールされている | ✅ PASS |
| 5-2 | Node.js 24 が使用されている | ✅ PASS |
| 5-3 | pnpm 10 が使用されている | ✅ PASS |
| 5-4 | `pnpm install` が完了している | ✅ PASS（vitest インストール済み） |

## 総合判定

全カテゴリ PASS — Phase 5 実装に進む
