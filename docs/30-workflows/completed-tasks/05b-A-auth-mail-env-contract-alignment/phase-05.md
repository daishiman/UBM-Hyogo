# Phase 5: 実装ランブック — 05b-A-auth-mail-env-contract-alignment

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 05b-A-auth-mail-env-contract-alignment |
| phase | 5 / 13 |
| wave | 05b-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | NON_VISUAL |

## 目的

Phase 1-4 で確定した正本 env 契約・追従対象・テスト境界を、将来の実装者が迷わず実行できる手順に落とす。**本タスクではコード変更・secret 投入・deploy を行わない。** 実装は別タスク（実装専用 follow-up）へ委譲する旨を明記しつつ、実行時に必要な詳細手順をすべて記述する。

## 委譲方針

| 区分 | 本タスク (05b-A) | 別タスク委譲先 |
| --- | --- | --- |
| 仕様書作成 | 本タスクで完結 | — |
| spec docs / aiworkflow refs の Markdown 修正 | 本タスク Phase 12 で `Edit` 適用予定（コード差分なしの docs-only 範囲） | — |
| `wrangler.toml [vars]` 追記 | **委譲**（実装 follow-up） | 05b-A-impl（仮称、要件は本 runbook） |
| Cloudflare Secrets `secret put` | **委譲**（user 承認後） | 05b-A-impl + Phase 11 手動 smoke |
| 1Password Vault item 作成 | **委譲**（user 承認後） | 05b-A-impl + Phase 11 |
| `apps/api` のソース変更 | **不要**（実装は既に正本名） | — |

## 実装ステップ詳細（将来実装者向け runbook）

### Step 1: 1Password Vault path 命名規則

- Vault: `UBM-Hyogo`
- Item: `auth-mail`（Magic Link 関連の 1 item に集約。`auth-google` 等とは分離）
- Field: env 名そのまま (`MAIL_PROVIDER_KEY`)
- 完全な参照形式: `op://UBM-Hyogo/auth-mail/MAIL_PROVIDER_KEY`
- Item Notes: `Last-Updated: YYYY-MM-DD` のみ記録。値ハッシュ・provider 名・課金プラン等の運用メタは Notes に書かない（不変条件 #16）。
- staging / production で値が異なる場合は同一 Item 内で `MAIL_PROVIDER_KEY_STAGING` / `MAIL_PROVIDER_KEY_PRODUCTION` のフィールド分離ではなく、**別 Item** (`auth-mail-staging` / `auth-mail-production`) に分けることで誤参照を防ぐ。

### Step 2: `.env` への op:// 参照追加（実値禁止）

`.env` (リポジトリ追跡外、ローカルのみ) に以下を追記:

```
MAIL_PROVIDER_KEY=op://UBM-Hyogo/auth-mail/MAIL_PROVIDER_KEY
MAIL_FROM_ADDRESS=op://UBM-Hyogo/auth-mail/MAIL_FROM_ADDRESS
AUTH_URL=op://UBM-Hyogo/auth-mail/AUTH_URL
```

- 実値 (`re_xxx`) を `.env` に直接書かない（CLAUDE.md「ローカル `.env` の運用ルール」）
- `scripts/with-env.sh` が `op run --env-file=.env` でラップして動的注入する
- `.env` を `cat` / `Read` / `grep` 等で表示しない（AI 学習混入防止）

### Step 3: `wrangler.toml [vars]` への追記

`apps/api/wrangler.toml` に以下を追記（**Variable のみ**。`MAIL_PROVIDER_KEY` は Secret なので `[vars]` には書かない）:

```toml
[env.staging.vars]
MAIL_FROM_ADDRESS = "noreply@staging.ubm-hyogo.example"
AUTH_URL = "https://api-staging.ubm-hyogo.workers.dev"

[env.production.vars]
MAIL_FROM_ADDRESS = "noreply@ubm-hyogo.example"
AUTH_URL = "https://api.ubm-hyogo.workers.dev"
```

実値（ドメイン）は user が確定した時点で別タスクで投入する。本 runbook ではプレースホルダ表記のみとする。

### Step 4: Cloudflare Secrets への投入手順（user 承認後）

```bash
# 認証確認（CLAUDE.md「Cloudflare 系 CLI 実行ルール」)
bash scripts/cf.sh whoami

# staging-first（必ず staging を先に）
op read "op://UBM-Hyogo/auth-mail-staging/MAIL_PROVIDER_KEY" \
  | bash scripts/cf.sh secret put MAIL_PROVIDER_KEY \
      --config apps/api/wrangler.toml --env staging

# 確認（name のみ。値は出力しない）
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging

# staging smoke (Phase 11) を通過後に production を投入
op read "op://UBM-Hyogo/auth-mail-production/MAIL_PROVIDER_KEY" \
  | bash scripts/cf.sh secret put MAIL_PROVIDER_KEY \
      --config apps/api/wrangler.toml --env production
```

#### 投入時の禁止事項（不変条件 #16）

- `--body "実値"` のように shell history に値を残さない（必ず stdin pipe）
- `op read` の出力を一時ファイルに保存しない
- log / evidence / PR 本文に値を転記しない
- `wrangler login` でローカル OAuth トークンを保持しない（`scripts/cf.sh` 経由のみ）
- `wrangler` を直接呼ばない（`scripts/cf.sh` 経由必須）

### Step 5: spec docs / aiworkflow refs の差し替え

本タスク Phase 12 で実施。Edit ベースの逐語置換を以下 rg で対象抽出:

```bash
# 対象ファイル列挙
rg -l 'RESEND_API_KEY|RESEND_FROM_EMAIL|\bSITE_URL\b' \
  docs/00-getting-started-manual/specs \
  .claude/skills/aiworkflow-requirements/references

# 想定 hit:
# docs/00-getting-started-manual/specs/10-notification-auth.md
# docs/00-getting-started-manual/specs/08-free-database.md

# 置換対応
# RESEND_API_KEY      -> MAIL_PROVIDER_KEY     (種別: Secret)
# RESEND_FROM_EMAIL   -> MAIL_FROM_ADDRESS     (種別: Variable)
# SITE_URL            -> AUTH_URL              (種別: Variable)
```

- 置換は `Edit` で逐語、`sed -i` / `awk` での一括置換は禁止（CLAUDE.md ツール選択方針）
- 置換と同時に種別列 (Variable / Secret) を追記
- production fail-closed (502 `MAIL_FAILED`) の脚注を `10-notification-auth.md` § 環境変数に追加

### Step 6: テスト実装の委譲

- L1 単体: `apps/api/src/services/mail/__tests__/magic-link-mailer.test.ts`（別タスク）
- L2 契約: `apps/api/src/__tests__/env-contract.test.ts`（別タスク）
- L3 doc grep: `scripts/doc-grep-legacy-env.sh`（別タスク、CI / lefthook 統合）
- 本 runbook では fixture ルール（Phase 4）の遵守を必須条件として申し送る

### Step 7: deploy

- 本 runbook では deploy 手順を**指示しない**。deploy は 09a / 09c タスクで user 承認後に実施。
- 参考: `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging`（実行は別タスクで）

## CLI ラッパー使用ルール再確認

| 操作 | 正しいコマンド | 禁止コマンド |
| --- | --- | --- |
| 認証 | `bash scripts/cf.sh whoami` | `wrangler whoami` |
| Secret put | `op read ... \| bash scripts/cf.sh secret put ...` | `wrangler secret put ... --body "実値"` |
| Secret list | `bash scripts/cf.sh secret list --env <env>` | `wrangler secret list ...`（直接） |
| Deploy | `bash scripts/cf.sh deploy --config ... --env <env>` | `wrangler deploy ...`（直接） |
| Rollback | `bash scripts/cf.sh rollback <VERSION_ID> ...` | `wrangler rollback ...`（直接） |

## approval gate（自走禁止）

Claude Code は以下を user 承認なしに実行してはならない:

1. `op read` の実行（特に値を pipe / 表示する経路）
2. `bash scripts/cf.sh secret put` の実行
3. `bash scripts/cf.sh deploy` の実行（staging / production いずれも）
4. Magic Link 実送信を伴う smoke
5. 旧 env 名 (`RESEND_API_KEY` 等) を Cloudflare Secrets / 1Password に新規投入する操作
6. spec / aiworkflow / runbook 以外への commit / push / PR

## 実行タスク

1. 参照資料と該当ソースを確認する。完了条件: Phase 1-4 で確定した境界・対応表が runbook に反映される。
2. 本タスク固有の scope / AC / evidence を確認する。完了条件: 各 Step が AC-1〜AC-5 のいずれかに紐付く。
3. user approval または上流 gate が必要な操作を分離する。完了条件: approval gate リストが本 Phase に明記される。
4. 委譲方針を明文化する。完了条件: 本タスク範囲と別タスク範囲の表が確定する。

## 参照資料

- docs/00-getting-started-manual/specs/10-notification-auth.md（§ 環境変数）
- docs/00-getting-started-manual/specs/08-free-database.md（§ シークレット配置）
- .claude/skills/aiworkflow-requirements/references/environment-variables.md
- .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md（UT-25 / UT-27 投入運用）
- apps/api/src/index.ts（Env interface, mail sender resolve）
- apps/api/src/routes/auth/index.ts（`POST /auth/magic-link`）
- apps/api/src/services/mail/magic-link-mailer.ts（`createResendSender`）
- CLAUDE.md（Cloudflare 系 CLI 実行ルール / `.env` 運用ルール）
- scripts/cf.sh（CLI ラッパー）

## 実行手順

- 対象 directory: `docs/30-workflows/05b-A-auth-mail-env-contract-alignment/`
- 本仕様書作成ではアプリケーションコード変更、deploy、commit / push / PR 作成、Cloudflare Secrets / 1Password への実値登録を行わない。
- 実装・実測時は本 Phase の Step 1-7 と Phase 11 の runbook と evidence path に従う。
- secret 値は `op read` の出力をログ・evidence・PR 本文に転記しない。env 名と `op://Vault/Item/Field` 参照のみを記録する。

## 統合テスト連携

- 上流: 05b Magic Link provider 本体, 10-notification-auth.md, environment-variables.md, deployment-secrets-management.md
- 下流: 05b-A-impl（実装委譲先・仮称）, 05b-B Magic Link callback follow-up, 09a staging deploy smoke, 09c production deploy readiness

## 多角的チェック観点

- #16 secret values never documented: 全 Step で env 名・op:// 参照のみ。値・JSON 抜粋・値ハッシュを記録しない
- #15 Auth session boundary: `AUTH_SECRET` を本 runbook で触らない（05a 共有のまま据え置き）
- #14 Cloudflare free-tier: 新規 Secret / Variable を増やさず既存 3 値の名前統一に留める
- 未実装 / 未実測を PASS と扱わない: runbook 整備のみで AC-4（staging smoke）達成と扱わない
- プロトタイプと仕様書の採用 / 不採用を混同しない: GAS prototype の `RESEND_*` を runbook 投入対象にしない

## サブタスク管理

- [ ] refs を確認する
- [ ] AC と evidence path を対応付ける
- [ ] blocker / approval gate を明記する
- [ ] Step 1-7 の詳細手順を確定する
- [ ] CLI ラッパー使用ルールを再確認する
- [ ] 委譲方針を明文化する
- [ ] outputs/phase-05/main.md を作成する

## 成果物

- outputs/phase-05/main.md（Step 1-7 の詳細 runbook / 委譲方針 / approval gate / CLI ラッパー使用ルール）

## 完了条件

- env 名の正本が1つに統一される（Step 5 の差し替え rg）
- Cloudflare/1Password/runbook の配置先が一致する（Step 1-3 の同期マッピング）
- production で未設定時 fail-closed の仕様が明記される（runbook の deploy readiness 条件）
- staging smoke で Magic Link メール送信設定を確認できる（Step 4 の secret list name 確認）
- secret 実値が repo/evidence に残らない（投入時の禁止事項節 / approval gate）

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない
- [ ] secret 実値を記録していない（env 名と op:// 参照のみ）

## 次 Phase への引き渡し

Phase 6（異常系検証）へ次を渡す:

- Step 1-7 の runbook（特に Step 4 の Cloudflare Secrets 投入経路）
- approval gate 6 項目
- 委譲方針（本タスクは spec / runbook 確定まで、実装は別タスク）
- staging-first 順序と production fail-closed の deploy readiness 条件
- CLI ラッパー使用ルール（`scripts/cf.sh` 必須、`wrangler` 直接禁止）
