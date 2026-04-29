# UT-25-DEFER-02: .dev.vars の op run 自動 wrap スクリプト整備

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-25-DEFER-02 |
| タスク名 | .dev.vars の op run 自動 wrap スクリプト整備 |
| 優先度 | LOW |
| 推奨Wave | ローカル開発者が複数になった時 |
| 状態 | unassigned (deferred) |
| 作成日 | 2026-04-29 |
| 既存タスク組み込み | なし（UT-25 本体はランタイム Secrets 配置に集中、ローカル開発者向け automation は分離） |
| 組み込み先 | - |
| 検出元 | UT-25 Phase 12 unassigned-task-detection deferred セクション（`docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-12/unassigned-task-detection.md`） |

## 目的

ローカル開発で `apps/api/.dev.vars` を `wrangler dev` に渡す際に、`op://<Vault>/<Item>/<Field>` 参照を実値へ動的展開するラッパースクリプトを整備する。既存の `scripts/with-env.sh` / `scripts/cf.sh` の `op run --env-file` パターンを踏襲し、`.dev.vars` に実値を書かないまま wrangler dev へ KEY=VALUE フォーマットを渡せる経路を提供する。これによりローカル開発者の手元・shell 履歴・memory dump のいずれにも実 secret 値が残らない設計を実現する。

## スコープ

### 含む

- `scripts/with-dev-vars.sh`（仮称）の新設、または `scripts/with-env.sh` の拡張による `.dev.vars` 専用 wrap 経路
- `apps/api/.dev.vars` を `op run --env-file=apps/api/.dev.vars -- wrangler dev ...` 経路で動的解決する仕組み
- wrangler dev が要求する KEY=VALUE フォーマットへの整合（コメント・空行・quoting 仕様の確認）
- temp file（disk）に実値を書かず、subprocess 環境変数経由で wrangler dev へ渡す方式の確立
- `.dev.vars` のテンプレート（`apps/api/.dev.vars.example`）の整備（op:// 参照のみ）
- `.gitignore` に `apps/api/.dev.vars` が含まれていることの最終確認
- ローカル開発者向け runbook の追記（`scripts/cf.sh` ルールと同じ「直接 wrangler 呼ばない」方針の明文化）

### 含まない

- production / staging への secret 配置（UT-25 本体・UT-25-DEFER-01 のスコープ）
- 1Password CLI (`op`) のインストール手順自体（前提条件として扱う）
- CI 上での `.dev.vars` 利用（CI は GitHub Secrets / Cloudflare Secrets を直接参照する）
- `.dev.vars` 以外の env file（`.env` / wrangler.toml の `[vars]`）の扱いの変更
- wrangler dev 以外のコマンド（deploy / secret put など）への適用（`scripts/cf.sh` で既に解決済み）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-25 本体（Cloudflare Secrets 本番配置） | `GOOGLE_SERVICE_ACCOUNT_JSON` 等の正本シークレット名が確定していること |
| 上流 | `scripts/with-env.sh` / `scripts/cf.sh` 既存実装 | op run + mise exec パターンの正本として参照する |
| 上流 | `.claude/skills/aiworkflow-requirements/references/environment-variables.md` | `.dev.vars` 管理方針（実値禁止・op:// 参照のみ）の正本 |
| 下流 | ローカル開発者オンボーディング手順 | 本タスク完了後にラッパー使用が標準経路として案内される |

## 着手タイミング

> **着手判断基準**: ローカル開発者が複数になった時。ソロ開発の現状では `scripts/cf.sh` 経由で十分に機能しており、`wrangler dev` 用 `.dev.vars` を頻繁に書き換える局面が発生していないため優先度 LOW。

| 条件 | 理由 |
| --- | --- |
| ローカル開発者が 2 人以上になる | 個別環境での op:// 参照解決手順の手作業差分が事故の原因になる |
| `.dev.vars` 経由で扱う secret 数が増える | 個別 `op read` 呼び出しでは履歴漏洩リスクが上がる |
| wrangler dev のローカル疎通頻度が上がる | 起動毎の手動展開コストが automation 価値を上回る |

## 苦戦箇所・知見

**1. wrangler dev は `.dev.vars` の独自フォーマットを期待する**
wrangler dev が読む `.dev.vars` は `KEY=VALUE` 形式のみで、`.env` のような quoting 規則や export prefix は受け付けない。`op run --env-file` は dotenv 系フォーマットを前提にしているため、wrangler dev に直接 `.dev.vars` を読ませる従来経路と、`op run` 経由で env を注入する経路を併存させる場合に「どちらの parser が走るか」が曖昧になる。`op run --env-file=apps/api/.dev.vars -- wrangler dev`（wrangler dev 側には `.dev.vars` 参照を渡さず、subprocess の環境変数として解決済みの値を渡す）という構成に固定する必要がある。

**2. op run の subprocess 経由では .dev.vars の動的注入が複雑**
`op run` は子プロセスの環境変数として実値を注入するが、wrangler dev はカレントディレクトリの `.dev.vars` を自動読込する仕様もあるため、二重展開や op:// リテラルが wrangler 側に流出する事故が起こりうる。temp file 経由で実値を書き出す回避策は **disk に実値を残さない原則** に反するため禁止。subprocess 環境変数のみで wrangler dev に渡す経路と、wrangler dev 側の自動読込との衝突を回避する設計（例: 実行時のみ `.dev.vars` を一時的に rename / 別パスで管理）の検証が必要。

**3. 開発者ローカルで 1Password CLI が install / 認証済みである前提**
ラッパーは `command -v op` と `op account list` の存在確認を行い、未認証時は明確なエラーメッセージで停止すること。`scripts/with-env.sh` の `op が無ければ素通し` フォールバックは `.dev.vars` 用途では危険（op:// 文字列がそのまま wrangler dev に流れる）なので、本ラッパーでは fail-fast に倒す。

**4. shell 履歴と memory dump の双方で実値が見えない設計**
`set +o history` / `HISTFILE=/dev/null` は呼び出し側の shell に依存するため、ラッパー内で `unset HISTFILE` 相当を強制しても親 shell の history には影響しない。実値を `echo` / `printenv` で表示しないこと、`ps aux` で argv に乗らないこと（環境変数経由なら OK）の双方を満たすか検証する。`op run` は実値を子プロセスの env に置くため argv には乗らないが、wrangler dev が debug log で env を出力するモードを誤って有効化しないよう README で注意喚起する。

**5. `.dev.vars.example` のテンプレート化**
`apps/api/.dev.vars` を `.gitignore` 除外したうえで、`.dev.vars.example` に op:// 参照テンプレートをコミットする。実値ではなく `op://<Vault>/<Item>/<Field>` の placeholder を記述し、新規開発者は `cp .dev.vars.example .dev.vars` でセットアップを開始できるようにする。

## 実行概要

1. `scripts/with-env.sh` の op run + mise exec パターンを踏襲した `scripts/with-dev-vars.sh`（仮称）を新設する
2. ラッパーは `op` CLI の存在と認証状態を確認し、未認証なら fail-fast で停止する（`.env` ラッパーのフォールバックは継承しない）
3. `op run --env-file=apps/api/.dev.vars -- mise exec -- wrangler dev --config apps/api/wrangler.toml` 形式で wrangler dev を起動する経路を確立する
4. wrangler dev のカレントディレクトリ `.dev.vars` 自動読込との衝突を検証し、必要なら実行時の rename / `--var` フラグ併用などで二重展開を回避する
5. `apps/api/.dev.vars.example` を整備し、`GOOGLE_SERVICE_ACCOUNT_JSON=op://<Vault>/<Item>/<Field>` 等の参照テンプレートのみをコミットする
6. `.gitignore` に `apps/api/.dev.vars` が含まれていることを再確認する
7. ローカル開発者向け runbook（`doc/00-getting-started-manual/` 配下または該当 README）に「`wrangler dev` は直接呼ばず `bash scripts/with-dev-vars.sh ...` 経由」のルールを追記する
8. `scripts/cf.sh` の禁止事項リストに合わせて、`.dev.vars` を `cat` / `Read` で表示しないルールを `CLAUDE.md` または skill references に反映する

## 完了条件

- [ ] `scripts/with-dev-vars.sh`（または同等の経路）が存在し、`.dev.vars` の op:// 参照が wrangler dev の subprocess 環境変数として解決される
- [ ] ラッパーは op 未認証時に fail-fast で停止する（無音フォールバックしない）
- [ ] `apps/api/.dev.vars.example` が op:// 参照テンプレートのみでコミットされている
- [ ] `apps/api/.dev.vars` が `.gitignore` で除外されていることが確認済み
- [ ] disk 上に実値を書き出す経路（temp file 等）が存在しないことがコードレビューで確認済み
- [ ] ローカル開発者向け runbook に `bash scripts/with-dev-vars.sh ...` 経由の起動が記載されている
- [ ] `wrangler dev` の debug log で実 secret 値が標準出力に出ないことを目視確認済み

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/UT-25-cloudflare-secrets-sa-json-deploy.md | 上位タスク UT-25 本体・secret 名と配置方針 |
| 必須 | scripts/with-env.sh | op run + ENV_FILE フォールバックの正本パターン |
| 必須 | scripts/cf.sh | op run + mise exec + esbuild 解決込みラッパーの正本パターン |
| 必須 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | `.dev.vars` 管理方針（実値禁止・op:// 参照のみ）の正本 |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | Cloudflare Secrets 配置方針との整合確認 |
| 参考 | https://developers.cloudflare.com/workers/wrangler/configuration/#secrets | wrangler `.dev.vars` 仕様 |
| 参考 | https://developer.1password.com/docs/cli/secrets-environment-variables/ | `op run --env-file` 仕様 |
