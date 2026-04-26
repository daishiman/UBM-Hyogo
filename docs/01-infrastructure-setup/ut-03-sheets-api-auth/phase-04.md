# Phase 4: 事前検証手順

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Sheets API 認証方式設定 (UT-03) |
| Phase 番号 | 4 / 13 |
| Phase 名称 | 事前検証手順 |
| 作成日 | 2026-04-26 |
| 担当 | delivery |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装・セットアップ実行) |
| 状態 | pending |

## 目的

実装・セットアップ（Phase 5）に進む前に、必要な外部リソース・ローカル環境・ツールバージョンが整備されていることを確認する。
事前検証を完了しておくことで、実装中に「Service Account が未発行だった」「wrangler のバージョンが古い」等の環境起因の中断を防ぐ。

## verify suite（事前確認チェックリスト）

### カテゴリ 1: Google Cloud 側の準備確認

| # | 確認項目 | 確認コマンド / 方法 | 期待値 | 状態 |
| --- | --- | --- | --- | --- |
| 1-1 | Google Cloud Project が存在する | `gcloud projects list` または GCP Console で確認 | プロジェクトが一覧に存在する | [ ] |
| 1-2 | Sheets API が有効化されている | `gcloud services list --enabled --filter="name:sheets.googleapis.com"` | `sheets.googleapis.com` が表示される | [ ] |
| 1-3 | Service Account が発行済みである | `gcloud iam service-accounts list` | UT-03 用 Service Account のメールアドレスが表示される | [ ] |
| 1-4 | Service Account JSON key が取得済みである | ローカルに `.dev.vars` 用の JSON key ファイルが存在する | ファイルサイズが 0 より大きい | [ ] |
| 1-5 | 対象スプレッドシートがサービスアカウントと共有されている | スプレッドシートの「共有」設定で Service Account メールアドレスを確認 | 閲覧者（または編集者）として表示される | [ ] |

**確認コマンド詳細:**

```bash
# Sheets API の有効化確認
gcloud services list --enabled --project=<PROJECT_ID> --filter="name:sheets.googleapis.com"

# Service Account の一覧確認
gcloud iam service-accounts list --project=<PROJECT_ID>

# Service Account に付与されているロールの確認
gcloud projects get-iam-policy <PROJECT_ID> \
  --flatten="bindings[].members" \
  --filter="bindings.members:<SERVICE_ACCOUNT_EMAIL>"
```

### カテゴリ 2: リポジトリ・ディレクトリ構造確認

| # | 確認項目 | 確認コマンド | 期待値 | 状態 |
| --- | --- | --- | --- | --- |
| 2-1 | `packages/integrations` ディレクトリが存在する | `ls packages/integrations/` | ディレクトリが存在しエラーにならない | [ ] |
| 2-2 | `packages/integrations/package.json` が存在する | `cat packages/integrations/package.json` | JSON が表示される | [ ] |
| 2-3 | `packages/integrations/src/` ディレクトリが存在する（または作成可能） | `ls packages/integrations/src/` | ディレクトリが存在する、または mkdir で作成する | [ ] |
| 2-4 | pnpm workspace に `packages/integrations` が登録されている | `cat pnpm-workspace.yaml` | `packages/integrations` または `packages/*` が含まれる | [ ] |
| 2-5 | `sheets-auth.ts` が未作成（競合がない） | `ls packages/integrations/src/sheets-auth.ts` | ファイルが存在しない（Not found） | [ ] |

**確認コマンド詳細:**

```bash
# packages/integrations の全体確認
ls -la packages/integrations/

# pnpm workspace 設定確認
cat pnpm-workspace.yaml

# packages/integrations の TypeScript 設定確認
cat packages/integrations/tsconfig.json 2>/dev/null || echo "tsconfig.json が未作成"
```

### カテゴリ 3: wrangler CLI バージョン確認

| # | 確認項目 | 確認コマンド | 期待値 | 状態 |
| --- | --- | --- | --- | --- |
| 3-1 | wrangler がインストールされている | `mise exec -- pnpm wrangler --version` | バージョン番号が表示される | [ ] |
| 3-2 | wrangler のバージョンが 3.x 以降である | `mise exec -- pnpm wrangler --version` | `3.x.x` 以上のバージョン | [ ] |
| 3-3 | `wrangler secret put` コマンドが使用可能 | `mise exec -- pnpm wrangler secret --help` | help メッセージが表示される | [ ] |
| 3-4 | Cloudflare アカウントへのログイン状態確認 | `mise exec -- pnpm wrangler whoami` | Cloudflare アカウントのメールアドレスが表示される | [ ] |

**確認コマンド詳細:**

```bash
# wrangler バージョン確認
mise exec -- pnpm wrangler --version

# Cloudflare ログイン状態確認
mise exec -- pnpm wrangler whoami

# 必要に応じてログイン
mise exec -- pnpm wrangler login
```

### カテゴリ 4: .gitignore への .dev.vars 除外確認

| # | 確認項目 | 確認コマンド | 期待値 | 状態 |
| --- | --- | --- | --- | --- |
| 4-1 | リポジトリルートの `.gitignore` に `.dev.vars` が記載されている | `grep -n "\.dev\.vars" .gitignore` | `.dev.vars` を含む行が表示される | [ ] |
| 4-2 | `apps/api/.gitignore` に `.dev.vars` が記載されている（または上位の .gitignore でカバー） | `grep -rn "\.dev\.vars" apps/api/` | 記載あり、または上位でカバー | [ ] |
| 4-3 | `.dev.vars` が現在 git 追跡対象になっていない | `git ls-files --error-unmatch .dev.vars 2>&1` | エラーになる（追跡されていない） | [ ] |
| 4-4 | `git status` で `.dev.vars` が untracked ファイルとして表示されない | `.dev.vars` を作成後に `git status` を確認 | `.dev.vars` が `Untracked files` に表示されない | [ ] |

**確認コマンド詳細:**

```bash
# .gitignore の .dev.vars 記載確認
grep -rn "\.dev\.vars" .gitignore apps/ packages/

# .dev.vars が git 追跡対象でないことを確認
git ls-files --error-unmatch .dev.vars 2>&1 || echo "追跡対象外 (期待通り)"
git ls-files --error-unmatch apps/api/.dev.vars 2>&1 || echo "追跡対象外 (期待通り)"

# .gitignore に記載がない場合は追加
echo ".dev.vars" >> .gitignore
echo ".dev.vars の除外を .gitignore に追加しました"
```

### カテゴリ 5: Node.js / mise 環境確認

| # | 確認項目 | 確認コマンド | 期待値 | 状態 |
| --- | --- | --- | --- | --- |
| 5-1 | mise がインストールされている | `mise --version` | バージョン番号が表示される | [ ] |
| 5-2 | Node.js 24 が使用されている | `mise exec -- node --version` | `v24.x.x` | [ ] |
| 5-3 | pnpm 10 が使用されている | `mise exec -- pnpm --version` | `10.x.x` | [ ] |
| 5-4 | `pnpm install` が完了している | `ls node_modules/.pnpm/` | ディレクトリが存在する | [ ] |

**確認コマンド詳細:**

```bash
# 環境一括確認
mise exec -- node --version
mise exec -- pnpm --version
mise exec -- pnpm wrangler --version
```

## 事前確認失敗時の対処

| 失敗ケース | 対処方法 |
| --- | --- |
| Google Cloud Project が存在しない | 01c-parallel-google-workspace-bootstrap タスクを先に完了させる |
| Sheets API が未有効化 | `gcloud services enable sheets.googleapis.com` または GCP Console から有効化 |
| Service Account が未発行 | 01c-parallel-google-workspace-bootstrap の runbook を参照して発行する |
| `packages/integrations` が未作成 | 02-serial-monorepo-runtime-foundation タスクを先に完了させる |
| wrangler が 2.x 以下 | `pnpm add -g wrangler@latest` でアップデート |
| `.gitignore` に `.dev.vars` が未記載 | `.gitignore` に `.dev.vars` を追加してコミットする |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | wrangler コマンド・Secrets 操作の正本 |
| 必須 | docs/01-infrastructure-setup/ut-03-sheets-api-auth/index.md | AC-5（.gitignore 確認）の根拠 |
| 参考 | docs/01-infrastructure-setup/01c-parallel-google-workspace-bootstrap/index.md | Google Cloud 側の準備状況確認 |
| 参考 | docs/01-infrastructure-setup/02-serial-monorepo-runtime-foundation/index.md | packages/integrations の整備状況確認 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/pre-verify-checklist.md | 事前確認チェックリストの実施結果（全項目の状態記録） |
| メタ | artifacts.json | phase-04 を completed に更新 |

## 完了条件

- カテゴリ 1〜5 の全確認項目が PASS（チェックボックスが全て checked）
- 失敗項目がある場合、対処方法の実施が完了し再確認が PASS
- `outputs/phase-04/pre-verify-checklist.md` が作成されている
- Phase 5 の実装に必要な全前提条件が満たされていることが確認できる

## タスク100%実行確認【必須】

- 全確認項目が PASS
- 全成果物が指定パスに配置済み
- `.dev.vars` が `.gitignore` に記載されていることが verified
- artifacts.json の phase-04 を completed に更新

## 次 Phase

- 次: 5 (実装・セットアップ実行)
- 引き継ぎ事項: 全事前確認が PASS であること・Service Account JSON key の準備状況を Phase 5 に伝える
- ブロック条件: 事前確認に未解消の失敗項目がある場合は次 Phase に進まない
