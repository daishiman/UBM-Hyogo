# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Google OAuth Staging Smoke + Production Verification 統合 (UT-05A-FOLLOWUP-OAUTH) |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック |
| 作成日 | 2026-04-30 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証) |
| 状態 | spec_created |
| タスク分類 | specification-design（runbook） |
| taskType | implementation |
| visualEvidence | VISUAL |

## 目的

Phase 2 で確定した段階適用 A→B→C を **コピーで実行できる手順書**として展開する。本タスクはコード変更を行わず、Google Cloud Console / Cloudflare Secrets / 1Password の運用変更のみで完結する。`wrangler` 直叩きは禁止し、`scripts/cf.sh` 経由のみ使用する。実値（client_id / client_secret / token / email）は仕様書に転記せず、`op://` 参照でのみ表現する。

## 実行タスク

1. Phase 2 の redirect URI / secrets / consent screen / Stage A/B/C 設計を実行順へ展開する。
2. Google Cloud Console の OAuth client と consent screen 操作を、secret 実値を残さない手順で定義する。
3. `bash scripts/cf.sh` 経由の Cloudflare Secrets 注入 / 確認手順を定義する。
4. Stage A staging smoke、Stage B production verification 申請、Stage C production smoke の保存先を固定する。
5. screenshot 撮影時の client secret / cookie / token マスク方針を明記する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| Phase 2 | `phase-02.md` | 設計成果物 4 点の入力 |
| Phase 4 | `phase-04.md` | test ID / screenshot 構成 / 検証コマンド |
| 正本仕様 | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | `scripts/cf.sh` 経由の Cloudflare 操作 |
| 正本仕様 | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | 1Password 正本 / 派生コピー運用 |
| skill | `.claude/skills/task-specification-creator/references/phase-template-core.md` | OAuth client runbook の Phase 5 必須化 |

## 新規作成ファイル一覧

| パス | 役割 | 主な依存 |
| --- | --- | --- |
| `docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-05/implementation-runbook.md` | Stage A/B/C の手順書（本 Phase 主成果物） | Phase 2 4 設計成果物 |
| `docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-11/staging/redirect-uri-actual.md` | staging 実 host を埋めた redirect URI 表 | Phase 11 実行時に生成 |
| `docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-11/production/redirect-uri-actual.md` | production 実 host を埋めた redirect URI 表 | 同上 |

## 修正ファイル一覧

| パス | 修正内容 |
| --- | --- |
| `apps/api/wrangler.toml` | 既存 binding の確認のみ（変更不要が期待値）。`AUTH_URL` / `AUTH_TRUST_HOST` の env 別 vars 設定を確認 |
| `apps/web/wrangler.toml` | 同上 |
| `.env`（ローカル） | `op://` 参照の追加のみ（実値を書かない） |

> コード（TypeScript / SQL）は **一切変更しない**。05a で実装済みのコードがそのまま動作することを smoke で確認するのが本タスクの主旨。

## Stage A: staging smoke runbook

### Step A-0: 事前準備

```bash
# Node 24 + pnpm 10 を保証
mise install
mise exec -- pnpm install

# Cloudflare 認証確認（scripts/cf.sh 経由・wrangler 直叩き禁止）
bash scripts/cf.sh whoami

# 05a 自動化テストの緑確認（Phase 11 staging smoke 直前の sanity）
mise exec -- pnpm typecheck
mise exec -- pnpm test
```

### Step A-1: Google Cloud Console redirect URI 登録

1. Google Cloud Console → APIs & Services → Credentials → 該当 OAuth 2.0 Client ID を開く。
2. "Authorized redirect URIs" に以下 3 件が含まれることを確認。不足分のみ追加:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://<staging-domain>/api/auth/callback/google`
   - `https://<production-domain>/api/auth/callback/google`
3. `<staging-domain>` / `<production-domain>` は `apps/web/wrangler.toml` の `[env.staging]` / `[env.production]` の `routes` または `vars.AUTH_URL` から取得（実値は仕様書に転記しない）。
4. 保存後、`outputs/phase-11/staging/redirect-uri-actual.md` に登録済 URI 一覧を埋めて保存。

### Step A-2: Cloudflare Secrets staging 投入

```bash
# 1Password から実値を読み出して stdin で wrangler に渡す（実値はプロセス間のみ揮発）
op read "op://Vault/UBM-Auth/auth-secret-staging" \
  | bash scripts/cf.sh secret put AUTH_SECRET --config apps/api/wrangler.toml --env staging

op read "op://Vault/UBM-Auth/google-client-id" \
  | bash scripts/cf.sh secret put GOOGLE_CLIENT_ID --config apps/api/wrangler.toml --env staging

op read "op://Vault/UBM-Auth/google-client-secret" \
  | bash scripts/cf.sh secret put GOOGLE_CLIENT_SECRET --config apps/api/wrangler.toml --env staging

op read "op://Vault/UBM-Auth/admin-allowlist" \
 
# apps/web 側にも同様（host 異なる場合）
op read "op://Vault/UBM-Auth/auth-secret-staging" \
  | bash scripts/cf.sh secret put AUTH_SECRET --config apps/web/wrangler.toml --env staging
# ... 残り 3 key も同様

# 配置確認
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env staging
```

> 注意: `op read` の出力は **絶対にファイルに書かない / echo しない / log に残さない**。pipe で wrangler stdin に直接渡す。secret list 出力をスクリーンショットする場合は値（マスク済み）が問題ないことを確認。

### Step A-3: staging deploy

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging
```

### Step A-4: smoke 9 ケース実行（M-01〜M-11 / F-09 / F-15 / F-16 / B-01）

Phase 4 の test ID マトリクスに従い、`docs/30-workflows/completed-tasks/05a-parallel-authjs-google-oauth-provider-and-admin-gate/outputs/phase-11/smoke-checklist.md` の手順を実 staging URL で実行。

各 test の screenshot を `outputs/phase-11/staging/0X-<name>.png` に保存（Phase 4 §VISUAL evidence の 9 枚構成に準拠）。

session JSON / wrangler-dev.log の取得:

```bash
# session-member.json（allowlist 不一致 email でログイン後）
curl -s -b cookies-member.txt https://<staging-domain>/api/auth/session > outputs/phase-11/staging/session-member.json

# session-admin.json（allowlist 一致 email でログイン後）
curl -s -b cookies-admin.txt https://<staging-domain>/api/auth/session > outputs/phase-11/staging/session-admin.json

# wrangler-dev.log（ローカル M-11 用）
mise exec -- pnpm --filter api dev 2>&1 | tee outputs/phase-11/staging/wrangler-dev.log
```

### Step A-5: Stage A→B ゲート判定

| 条件 | 判定 |
| --- | --- |
| M-01〜M-11 / F-15 / F-16 / B-01 すべて PASS | A→B 進行可 |
| F-09 が staging で fail（B-03 制約による期待動作） | OK（production stage C で再検証） |
| 1 件でも上記 PASS 群に fail | Phase 6 失敗系 runbook に戻り原因切り分け |

## Stage B: production verification 申請 runbook

### Step B-1: privacy / terms / home の 200 確認

```bash
curl -I https://<production-domain>/
curl -I https://<production-domain>/privacy
curl -I https://<production-domain>/terms
# すべて HTTP/2 200 を期待
```

> 404 / 5xx の場合は Stage B-1 で停止。production deploy 状態と routing 設定を確認してから再実行。

### Step B-2: consent screen を Production publishing で submit

1. Google Cloud Console → APIs & Services → OAuth consent screen を開く。
2. Phase 2 `consent-screen-spec.md` の値（App name / privacy / terms / home / authorized domains / scope = openid email profile / developer contact）が反映されていることを確認。
3. "PUBLISH APP" ボタンで Production publishing 状態に遷移。
4. verification 申請フォームに従い情報入力（scope justification / app demo video / privacy policy 説明等）。
5. 申請完了直後の確認画面 / Publishing status 画面を `outputs/phase-11/production/consent-screen.png` に保存。

### Step B-3: 申請ステータス記録

`outputs/phase-11/production/verification-submission.md` に以下を記録:

```markdown
- 申請日時: YYYY-MM-DD HH:MM JST
- Publishing status: In production / Pending verification（申請直後）
- Project ID: <google-cloud-project-id>（実値は記載せず op:// 参照に置換）
- 申請 scope: openid, email, profile（最小権限）
- 想定審査期間: 数日〜数週間（Google 側都合）
- B-03 解除条件採用: a (verified) を理想、b (submitted 暫定運用) を待機中状態として許容
```

### Step B-4: Stage B→C ゲート判定

| 条件 | 判定 |
| --- | --- |
| consent screen が "In production"（verification submitted または verified） | B→C 進行可 |
| privacy / terms / home が 200 | 必須前提 |
| 申請却下 / 修正要求 | Phase 6 failure case に従い修正 → 再 submit |

## Stage C: production smoke runbook

### Step C-1: Cloudflare Secrets production 投入確認

```bash
# 既に未投入なら Stage A-2 と同手順で env=production に投入
op read "op://Vault/UBM-Auth/auth-secret-prod" \
  | bash scripts/cf.sh secret put AUTH_SECRET --config apps/api/wrangler.toml --env production
# 残り 3 key も同様

# 投入確認
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env production
bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env production
```

### Step C-2: production deploy

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production
```

### Step C-3: F-09 実行（外部 Gmail での login smoke）

1. Phase 1 で testing user 登録していない外部 Gmail アカウントを 1 つ用意（個人 Gmail）。
2. シークレットウィンドウで `https://<production-domain>/login` にアクセス。
3. Google sign-in → consent → callback → `/` 着地を確認。
4. 当該 email が admin_users.active に含まれていれば `/admin` 200、含まれていなければ `/login?gate=admin` redirect を確認。
5. screenshot を `outputs/phase-11/production/login-smoke.png` に保存（URL バーの `code` / `state` パラメータが残らないタイミングで撮影）。

### Step C-4: B-03 状態反映（Phase 12 で実施）

- `docs/00-getting-started-manual/specs/13-mvp-auth.md` の B-03 セクションを更新:
  - verified 状態: 「制約解除済み」と記述
  - submitted 状態: 「verification 審査中・暫定運用」と記述
- 本 Step は Phase 12 ドキュメント更新で実行。Phase 5 では更新内容 draft のみ作成。

## sanity check（各 Stage 共通）

```bash
# wrangler login 不在確認（必須）
ls ~/Library/Preferences/.wrangler/config/default.toml 2>&1 \
  | grep -q "No such file" && echo "OK: no wrangler login state" \
  || (echo "FAIL: wrangler login token detected" && exit 1)

# git grep で wrangler login 呼び出し不在
git grep -n "wrangler login" -- ':!docs/' ':!CLAUDE.md' ':!.claude/' \
  && (echo "FAIL: wrangler login invocation in code" && exit 1) \
  || echo "OK: no wrangler login invocation"

# .env に実値が混入していないか
grep -E "^(AUTH_SECRET|GOOGLE_CLIENT_(ID|SECRET))=" .env \
  | grep -v "op://" \
  && (echo "FAIL: plaintext secret in .env" && exit 1) \
  || echo "OK: .env contains only op:// references"
```

## screenshot 撮影注意（Phase 4 §撮影注意の再掲）

- DevTools Network / Application タブを撮る前に `set-cookie` ヘッダの session-token 値・`Authorization` ヘッダ値をマスクまたは画面外スクロール。
- callback 直後の URL バー（`code=...` / `state=...` クエリ含む）は撮らず、`/` 着地後に撮影。
- Cloudflare dashboard / Google Cloud Console の `Client ID` / `Client secret` 値表示部は "Hide" / 視覚的マスク後に撮影。
- ターミナルでは `bash scripts/cf.sh secret list`（マスク済み出力）まで。`secret put` の stdin / op read 出力行は撮らない。

## canUseTool 適用範囲

- 自動編集を許可: `outputs/phase-11/**` 配下の Markdown 作成（`Write` / `Edit`）。
- 人手承認必須:
  - Stage A-2 / Stage C-1 の `bash scripts/cf.sh secret put`（実シークレット投入）
  - Stage B-2 の Google Cloud Console "PUBLISH APP" 操作（GUI のため AI 自動実行不可、人手必須）
  - Stage A-3 / Stage C-2 の `scripts/cf.sh deploy`
- 該当なし: Phase 5 の Markdown 仕様書編集 / sanity check 系コマンドの dry-run。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | test ID マトリクスを Stage A-4 / Stage C-3 にマップ |
| Phase 6 | Stage A-5 / Stage B-4 の失敗パスを failure case 入力 |
| Phase 9 | secrets 配置の無料枠運用を free-tier-estimation.md で根拠化 |
| Phase 11 | runbook をそのまま実機実行し evidence を生成 |
| Phase 12 | B-03 解除状態を `13-mvp-auth.md` / `02-auth.md` に反映 |

## 多角的チェック観点

- 価値性: runbook 通りに進めれば AC-1〜AC-12 が staging+production の段階で達成可能。
- 実現性: `scripts/cf.sh` の 1Password 注入が staging / production 双方で成立する。
- 整合性: Phase 2 の 4 設計成果物（redirect URI / Secrets / consent screen / runbook）と完全整合。
- 運用性: Stage 間ゲートで失敗時に確実に前段に戻れる。
- セキュリティ: 実値が仕様書 / outputs / log / screenshot のいずれにも残らない。
- AI 学習混入防止: `op read` の出力を AI コンテキストに渡さない（pipe で wrangler に直接）。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | 新規/修正ファイル一覧確定 | spec_created |
| 2 | Stage A runbook（A-0〜A-5） | spec_created |
| 3 | Stage B runbook（B-1〜B-4） | spec_created |
| 4 | Stage C runbook（C-1〜C-4） | spec_created |
| 5 | sanity check（wrangler login 不在 / .env 実値不在） | spec_created |
| 6 | screenshot 撮影注意の再掲 | spec_created |
| 7 | canUseTool 適用範囲明記 | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/implementation-runbook.md | Stage A/B/C 段階適用 runbook（本 Phase 主成果物） |
| メタ | artifacts.json | Phase 5 状態更新 |

## 完了条件

- [ ] Stage A 全 5 ステップが scripts/cf.sh 経由で記述
- [ ] Stage B 全 4 ステップに privacy/terms/home 200 確認とsubmission 記録が含まれる
- [ ] Stage C 全 4 ステップに F-09（外部 Gmail smoke）が含まれる
- [ ] sanity check 3 件（wrangler login 不在 / git grep / .env 実値不在）が記述
- [ ] screenshot 撮影注意が再掲されている
- [ ] canUseTool 適用範囲（人手承認必須項目）が明示
- [ ] wrangler 直叩きが本ドキュメント内にゼロ件
- [ ] 実値（client_id / client_secret / token / email / domain）の転記がゼロ件

## タスク100%実行確認【必須】

- 実行タスク 7 件が `spec_created`
- 成果物が `outputs/phase-05/implementation-runbook.md` に配置済み
- Phase 4 の test ID マトリクスが Stage A-4 / Stage C-3 で参照されている
- Phase 2 の 4 設計成果物すべてが runbook 内で引用されている

## 次 Phase への引き渡し

- 次 Phase: 6 (異常系検証)
- 引き継ぎ事項:
  - 各 Stage の例外パス（A-5 / B-4 ゲート失敗時）を Phase 6 failure case の入力
  - Stage B 申請却下時の修正再 submit 経路
  - Stage A-2 / C-1 の secret 投入失敗時の rollback
- ブロック条件:
  - wrangler 直叩きが残存
  - 実値転記が残存
  - canUseTool で人手承認必須項目の指定漏れ
