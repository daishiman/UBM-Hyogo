# CLAUDE.md — UBM兵庫支部会 メンバーサイト

Claude Code がタスク実行時に最初に参照する基準ファイル。
詳細仕様はすべて `docs/00-getting-started-manual/` 以下を参照すること。

---

## プロジェクト概要

UBM兵庫支部会の会員管理・公開サイト。Google Form の実回答を正本として、
公開ディレクトリ・会員マイページ・管理バックオフィスの3層を構成する。

---

## スタック

| 役割 | 採用技術 |
|------|---------|
| Web UI | Cloudflare Workers + Next.js App Router via `@opennextjs/cloudflare` (`apps/web`) |
| API | Cloudflare Workers + Hono (`apps/api`) |
| DB | Cloudflare D1（Workers binding 経由のみアクセス可） |
| フォーム取得 | Google Forms API |
| 認証 | Auth.js + Google OAuth / Magic Link |
| パッケージ管理 | pnpm workspace (monorepo) |

---

## 主要ディレクトリ

| パス | 役割 |
|------|------|
| `docs/00-getting-started-manual/specs/` | システム設計の正本仕様 |
| `docs/00-getting-started-manual/claude-design-prototype/` | UI 画面・導線の参照元 |
| `docs/00-getting-started-manual/gas-prototype/` | UI 叩き台（本番仕様ではない） |
| `docs/00-getting-started-manual/google-form/` | フォーム構造と利用規約 |
| `docs/01-infrastructure-setup/` | インフラ構築タスク仕様書群 |
| `apps/web/` | Cloudflare Workers (Next.js via `@opennextjs/cloudflare`) |
| `apps/api/` | Cloudflare Workers (Hono) |

---

## フォーム固定値

| 項目 | 値 |
|------|-----|
| formId | `119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg` |
| responderUrl | `https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform` |
| sectionCount | `6` |
| questionCount | `31` |

---

## 重要な不変条件

1. 実フォームの schema をコードに固定しすぎない
2. consent キーは `publicConsent` と `rulesConsent` に統一する
3. `responseEmail` はフォーム項目ではなく system field として扱う
4. Google Form schema 外のデータは admin-managed data として分離する
5. D1 への直接アクセスは `apps/api` に閉じる（`apps/web` から直接アクセス禁止）
6. GAS prototype は本番バックエンド仕様に昇格させない
7. MVP では Google Form 再回答を本人更新の正式な経路とする

---

## ブランチ戦略

```
feature/* --PR--> dev --PR--> main
  (local)       (staging)   (production)
```

| ブランチ | 環境 | PRレビュー |
|---------|------|-----------|
| `feature/*` | ローカル (localhost) | 不要（solo 開発） |
| `dev` | Cloudflare staging | 不要（solo 開発・CI gate のみで保護） |
| `main` | Cloudflare production | 不要（solo 開発・CI gate + 履歴保護のみ） |

> **solo 運用ポリシー**: 個人開発のため必須レビュアー数は 0（GitHub branch protection の `required_pull_request_reviews` は `null`）。
> 品質保証は CI（`required_status_checks`）/ 線形履歴（`required_linear_history`）/ 会話解決必須化（`required_conversation_resolution`）/ force-push & 削除禁止 で担保する。
> GitHub 側の branch protection 実値を正本とし、CLAUDE.md は運用参照として扱う。UT-GOV-001 適用時は `gh api repos/{owner}/{repo}/branches/dev/protection` と `gh api repos/{owner}/{repo}/branches/main/protection` を個別に実行し、`grep` で `required_pull_request_reviews=null` / `lock_branch=false` / `enforce_admins=true` の drift がないことを確認する。

---

## Governance / CODEOWNERS

solo 運用ポリシーに従い `require_code_owner_reviews` は有効化しない（`required_pull_request_reviews=null`）。
`.github/CODEOWNERS` は ownership 文書化のみとして以下 5 governance path に owner を明示する:

- `docs/30-workflows/**`
- `.claude/skills/**/references/**`
- `.github/workflows/**`
- `apps/api/**`
- `apps/web/**`

global fallback (`* @daishiman`) を冒頭 1 行のみ配置し、後段の具体パスで最終マッチ勝ち仕様に整合させる。
構文検証: `gh api repos/daishiman/UBM-Hyogo/codeowners/errors`（`{"errors":[]}` を期待）。
詳細: `docs/30-workflows/ut-gov-003-codeowners-governance-paths/`

---

## 開発環境セットアップ（初回 / Node バージョン変更後）

```bash
# Node 24 + pnpm 10 を mise で管理（.mise.toml に固定済み）
mise install          # Node 24.15.0 + pnpm 10.33.2 をインストール
mise exec -- pnpm install  # 正しい Node バージョンで依存インストール
```

このリポジトリは他プロジェクトの Node 依存と分離するため、プロジェクトローカルで以下を固定する:

- `.mise.toml`: Node `24.15.0` / pnpm `10.33.2` の正本
- `.envrc`: direnv 利用環境では `cd` 時に `use mise` で自動切替
- `package.json#volta`: Volta 利用環境でも同じ Node / pnpm に自動切替
- `.nvmrc`: nvm / fnm 互換の補助指定

`node -v` が `v24.15.0` ではない場合、`mise exec -- <command>` で実行する。
direnv を使う場合は初回だけ `direnv allow` を実行すると、このワークツリー内だけ Node 24 に切り替わる。

> **毎回 `pnpm install` が必要な理由**: ワークツリーごとに `node_modules` が独立するため。
> `mise install` は一度だけ実行すれば OK（バイナリはキャッシュ済みになる）。

---

## ワークツリー作成（新機能開発の開始）

```bash
# 推奨: スクリプトで一括セットアップ（main同期 + pnpm install まで自動実行）
bash scripts/new-worktree.sh feat/my-feature
```

> **⚠️ 重要: Claude Code は必ずワークツリーディレクトリから起動すること**
>
> メインディレクトリで起動すると、ファイルがメインディレクトリに作られ
> 無関係なPRに混入する原因になる。
>
> ```bash
> # ワークツリー作成後、新しいターミナルタブで実行
> cd .worktrees/<作成されたディレクトリ名>
> claude   # ← ここから起動することで並列開発が正しく分離される
> ```
>
> 並列タスクの数だけターミナルタブを開き、それぞれのワークツリーで claude を起動する。

---

## よく使うコマンド

```bash
# 必ず mise exec 経由で実行（Node 24 が確実に使われる）
mise exec -- pnpm install         # 依存インストール（prepare で lefthook install も自動実行）
mise exec -- pnpm typecheck       # 型チェック
mise exec -- pnpm lint            # リント
mise exec -- pnpm build           # ビルド
mise exec -- pnpm indexes:rebuild # skill indexes を明示再生成（post-merge 廃止後の正規経路）
mise exec -- pnpm sync:check      # origin/main・origin/dev とローカル/全 worktree の遅れを通知（git fetch 後の手動チェック）

# または mise shell で Node 24 環境に入ってから通常通り実行
mise shell
pnpm install
pnpm typecheck
pnpm lint
```

> **Git hook の方針**: `lefthook.yml` が hook の正本。`pnpm install` 実行時に `prepare` script
> 経由で `lefthook install` が自動配置する。`.git/hooks/*` の手書きは禁止。
> indexes 再生成は post-merge から廃止しており、必要時は `pnpm indexes:rebuild` を明示実行する。
> CI 側に `verify-indexes-up-to-date` gate（`.github/workflows/verify-indexes.yml`）があり、
> `.claude/skills/aiworkflow-requirements/indexes` に drift があると job が fail する。
> 詳細: `docs/00-getting-started-manual/lefthook-operations.md`

### sync-merge (main 取り込み) 時の hook 挙動 — 個人開発ポリシー

main を feature ブランチへ取り込む sync-merge では、構造的に「ブランチ slug と無関係なタスク dir の混入」「他タスクのコード追加で coverage 一時的に低下」が発生するため、以下 hook は **マージコミット時に自動スキップ** する設計にしている（solo dev 運用ポリシー）:

| hook | スキップ条件 | 実装 |
|------|-------------|------|
| pre-commit `staged-task-dir-guard` | `MERGE_HEAD` / `CHERRY_PICK_HEAD` / `REVERT_HEAD` 存在時 | `scripts/hooks/staged-task-dir-guard.sh` |
| pre-push `coverage-guard` | push 範囲 (`@{u}..HEAD`) に merge commit を 1 件以上含む かつ `--changed` モード時 | `scripts/coverage-guard.sh` |

これにより main 取り込み時の `git commit` / `git push` で `--no-verify` を**付ける必要はない**。featureコミット/pushは従来通りhookが効く。`--no-verify` の使用は引き続き避け、hook が誤検知する場合は本セクションの方針に沿って hook 自体を改善すること。

### リモート同期チェック (`pnpm sync:check`) — main / dev 共通

git には `post-fetch` hook が存在しないため、`git fetch` 後にリモートの遅れを自動通知する仕組みは原理的に作れない。代わりに **手動コマンド `pnpm sync:check`** を正規経路とする。

| モード | 発火タイミング | 対象 |
|-------|----------------|------|
| `pnpm sync:check`（fetch モード） | 任意のタイミングで手動実行 | `origin/main` / `origin/dev` の先行コミット数、全 worktree の遅れ |
| `post-merge` フック | `git pull` / `git merge` 後、現在ブランチが `main` または `dev` のとき | 他 worktree の遅れを通知 |

実装: `scripts/hooks/stale-worktree-notice.sh`（read-only・副作用なし）。
運用: 朝イチや作業ブランチ切替前、PR 作成前に `pnpm sync:check` を実行する。

---

## PR作成の完全自律フロー

ユーザーが「PR作成」「PR出して」「diff-to-pr」または同等の依頼をした場合、Claude Code は確認質問を挟まず、次の順序で完遂する。途中で判断が必要な場合も、このセクションの既定方針に従って即時決定し、解決不能な事項だけを最終レポートにまとめる。

### 目的と絶対原則

- リモート `main` を基準にローカル `main` を同期し、作業ブランチへ取り込んでからPRを作成する。
- 現在ブランチで上がっている変更は、ステージ済み・未ステージ・未追跡・コミット済み差分を問わず、すべてPRに含める。
- ファイル種別、サイズ、自動生成物という理由で変更を除外しない。
- PR本文は `.claude/commands/ai/diff-to-pr.md` をPhase 13仕様として扱い、該当する `outputs/phase-12/implementation-guide.md` の内容を漏れなく反映する。
- `outputs/phase-11/` にスクリーンショット画像がある場合はPR本文に参照を含める。画像がない場合はスクリーンショット項目を作らない。

### 実行順序

1. 現在ブランチと変更状況を確認する。`main` 直上またはブランチ未作成の場合は、差分の主題から `feat/`、`fix/`、`refactor/`、`docs/` のいずれかで作業ブランチを自律作成する。
2. `git fetch origin main` を実行し、ローカル `main` を `origin/main` にfast-forward同期する。
3. 作業ブランチに戻り、`main` をマージする。
4. コンフリクトがあれば以下の方針で自律解消し、`git add` と `git commit` まで行う。
5. 品質検証は次の3コマンドだけを実行する。
   - `pnpm install --force`
   - `pnpm typecheck`
   - `pnpm lint`
6. 品質検証が失敗した場合は最大3回まで自動修復し、修復差分をコミットする。
7. `git status --porcelain` で未コミット変更を確認し、残っている変更は `git add -A` で全件含めてコミットする。
8. `git diff main...HEAD --name-only` でPRに入るファイル一覧を取得し、PR本文作成時に漏れなし確認として扱う。
9. `.claude/commands/ai/diff-to-pr.md` と `outputs/phase-12/implementation-guide.md` を参照してPR本文を作成し、通常PRとして作成する。

### コンフリクト解消の既定方針

| 種別 | 方針 |
|------|------|
| `package.json` / `tsconfig` などの設定ファイル | `main` 側を基準に採用し、作業ブランチ側の必要差分を再適用する |
| `pnpm-lock.yaml` | 必要なら再生成し、`pnpm install --force` の結果を正とする |
| ソースコード | 両側の変更意図を保持し、関数・import・型定義を統合する |
| 自動生成物 | 生成元が明確な場合は再生成結果を正とする |
| ドキュメント | `main` 側、作業ブランチ側の順に意味を結合し、重複行だけ除去する |

### 品質検証失敗時の自動修復

- `pnpm install --force` 失敗時は依存状態とlockfileの不整合を疑い、最小限の再生成で復旧する。
- `pnpm typecheck` 失敗時は、unused import、null許容、型注釈漏れ、export/import不整合など明白な型不整合を最小差分で修正する。
- `pnpm lint` 失敗時は、まず `pnpm lint --fix` を試し、残る違反だけを手修正する。
- テストコード実行は、ユーザーが明示しない限りこのPR作成フローでは行わない。

### PR作成前チェック

- `git status --porcelain` が空であること。
- `git diff main...HEAD --name-only` がPRに含めるファイル一覧として取得できていること。
- `implementation-guide.md` が存在する場合、その主要見出しと内容がPR本文に反映されていること。
- `outputs/phase-11/` 配下の `png` / `jpg` / `jpeg` / `gif` / `webp` 画像数と、PR本文の画像参照が整合していること。
- スクリーンショットがない場合、PR本文にスクリーンショット専用セクションを残さないこと。

### 最終レポート

PR作成完了後は、PR URL、採用ブランチ、実行した自動修復、解消したコンフリクト、残課題の有無を1回だけ報告する。

---

## Claude Code 設定

- **出力言語**: 日本語（thinking モード含む全出力）
- **権限モード**: `bypassPermissions`
- **設定ファイル**: `.claude/settings.local.json`
- **詳細設定リファレンス**: `docs/00-getting-started-manual/claude-code-config.md`

---

## シークレット管理

| 種別 | 管理場所 |
|------|---------|
| ランタイムシークレット | Cloudflare Secrets |
| CI/CD シークレット | GitHub Secrets（例: `CLOUDFLARE_API_TOKEN`） |
| 非機密設定値 | GitHub Variables（例: `CLOUDFLARE_ACCOUNT_ID`） |
| ローカル秘密情報の正本 | 1Password Environments |

**平文 `.env` はリポジトリにコミットしない。**

### ローカル `.env` の運用ルール（AI 学習混入防止）

- ローカル `.env` には **実値を絶対に書かない**（AI コンテキストに混入する事故を防ぐため）
- 値は **1Password に保管**し、`.env` には `op://Vault/Item/Field` 参照のみを記述する
- 実行時に [`scripts/with-env.sh`](scripts/with-env.sh) が `op run --env-file=.env` でラップして動的注入する

#### Cloudflare 系 CLI 実行ルール（Claude Code 必読）

Claude Code および手動オペレーション双方で **以下のラッパーのみを使用**すること。`wrangler` を直接呼ばない。

```bash
# 認証確認
bash scripts/cf.sh whoami

# D1 操作
bash scripts/cf.sh d1 list
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production
bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production --output backup.sql

# デプロイ
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production

# rollback
bash scripts/cf.sh rollback <VERSION_ID> --config apps/api/wrangler.toml --env production
```

`scripts/cf.sh` の役割:
1. `op run --env-file=.env` 経由で `CLOUDFLARE_API_TOKEN` 等を 1Password から動的注入（実値は環境変数として揮発的に渡るのみ・ファイルやログには残らない）
2. グローバル `esbuild` とのバージョン不整合を `ESBUILD_BINARY_PATH` で自動解決
3. `mise exec --` 経由で Node 24 / pnpm 10 を保証

**禁止事項（Claude Code を含む全 AI エージェントに適用）:**
- `.env` の中身を `cat` / `Read` / `grep` 等で表示・読み取らない（実値は op 参照のみだが慣性事故防止）
- API Token 値・OAuth トークン値を出力やドキュメントに転記しない
- `wrangler login` でローカル OAuth トークン (`~/Library/Preferences/.wrangler/config/default.toml`) を保持しない。`.env` の op 参照に一本化する

---

## 参照ドキュメント

| ファイル | 内容 |
|---------|------|
| `docs/00-getting-started-manual/specs/00-overview.md` | システム全体概要 |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | フォーム schema と項目定義 |
| `docs/00-getting-started-manual/specs/02-auth.md` | 認証設計 |
| `docs/00-getting-started-manual/specs/08-free-database.md` | D1 構成と無料構成 |
| `docs/00-getting-started-manual/specs/13-mvp-auth.md` | MVP 認証方針 |
| `docs/00-getting-started-manual/claude-code-config.md` | Claude Code 設定詳細 |
