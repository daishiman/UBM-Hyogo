# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Google OAuth Staging Smoke + Production Verification 統合 (UT-05A-FOLLOWUP-OAUTH) |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| 作成日 | 2026-04-30 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | spec_created |
| タスク分類 | specification-design（test-strategy） |
| taskType | implementation |
| visualEvidence | VISUAL |

## 目的

Phase 2 で確定した 4 設計成果物（redirect-uri-matrix / secrets-placement-matrix / consent-screen-spec / staging-vs-production-runbook）と段階適用 A→B→C に対し、Phase 5（実装ランブック）/ Phase 11（手動 smoke）で実行する検証スイートを設計する。本タスクは **コードを書かず Configuration の検証のみを行う** 性質のため、自動化テスト（05a で完了）の再利用範囲を明示し、本 Phase で追加するのは **手動 smoke と VISUAL evidence 取得方針** に絞る。AC-1〜AC-12 すべてを 1 つ以上の test ID または検証種別でカバーすることを必須化する。

## 実行タスク

1. 05a 完了済み自動テストの再実行範囲を確定する。
2. Stage A/B/C の手動 smoke test ID と AC-1〜AC-12 の trace を作成する。
3. VISUAL evidence の screenshot 構成、マスク方針、保存パスを定義する。
4. Cloudflare / Google Cloud / privacy policy / session JSON の検証コマンドを Phase 5/11 へ引き渡す。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| Phase 2 | `phase-02.md` | 4 設計成果物と Stage A/B/C gate |
| 05a evidence | `docs/30-workflows/completed-tasks/05a-parallel-authjs-google-oauth-provider-and-admin-gate/outputs/phase-11/smoke-checklist.md` | M/F/B 系 smoke test ID の再利用 |
| skill | `.claude/skills/task-specification-creator/references/phase-template-execution.md` | Phase 4〜10 の成果物 / テスト戦略の共通構造 |
| skill | `.claude/skills/task-specification-creator/references/phase-template-phase11.md` | VISUAL evidence の Phase 11 必須成果物 |

## 自動化テストの再利用範囲（05a 完了分）

| 種別 | 物理位置 | 本タスクでの扱い |
| --- | --- | --- |
| Auth.js Google provider unit test | `apps/api` 配下（05a で作成） | **再実行のみ**（コード変更なし）。本タスクで signature を変えない |
| admin-gate.ts unit test | 同上 | 同上 |
| middleware integration test（`/admin/*` redirect） | 同上 | 同上 |
| smoke-checklist.md（M-01〜M-11 / F-09 / F-15 / F-16 / B-01） | `docs/30-workflows/completed-tasks/05a-parallel-authjs-google-oauth-provider-and-admin-gate/outputs/phase-11/smoke-checklist.md` | **本タスクで再実行**して evidence を上書き（実 OAuth client 接続版） |

> 本タスクでは新規コード追加が原則ゼロ（OAuth client / Cloudflare Secrets / Google Cloud Console 設定のみ変更）。したがって unit / integration / e2e の自動化テスト追加は行わない。05a で作成済の自動化テストを Phase 11 staging smoke 直前に `pnpm test` で 1 度緑にすることのみ要求する。

## 手動 smoke の戦略

### test ID と段階適用の対応

| test ID | 内容（05a smoke-checklist.md 由来） | Stage A (staging) | Stage C (production) |
| --- | --- | --- | --- |
| M-01 | `/login` 表示 → Google sign-in 開始 | YES | YES |
| M-02 | Google consent screen 表示確認 | YES | YES（verification verified 後は consent 表示が簡略化される） |
| M-03 | callback `/api/auth/callback/google` で 302 → `/` | YES | YES |
| M-04 | `next-auth.session-token` cookie が `Secure; SameSite=Lax` で発行 | YES | YES |
| M-05 | session JSON（`/api/auth/session`）に email / name が反映 | YES | YES |
| M-06 | admin_users.active 一致 email で `/admin` 200 | YES | YES（admin_users.active 同値） |
| M-07 | allowlist 不一致 email で `/admin` → `/login?gate=admin` redirect | YES | NO（外部 Gmail での確認は M-06 と F-09 でカバー） |
| M-08 | sign-out で session cookie 削除確認 | YES | YES |
| M-09 | session 有効期限切れ後の再 sign-in 動作 | YES | NO（時間制約のため staging のみ） |
| M-10 | `/admin/*` 配下の任意ルートで gate redirect | YES | NO |
| M-11 | `wrangler-dev.log` に callback / session resolve / admin gate の entry が出力 | YES | NO（production は Cloudflare Logs 側で確認） |
| F-09 | testing user 以外（外部 Gmail）で `/login` → `/admin` 完走 | NO（B-03 制約により staging では失敗が期待値） | YES（B-03 解除確認の中核 test） |
| F-15 | redirect URI 不一致時のエラー画面表示 | YES（intentional fault injection） | NO |
| F-16 | OAuth state mismatch 時のエラー画面 | YES | NO |
| B-01 | session cookie 改ざん時の reject | YES | NO |

> Stage B（verification 申請）は test ID ではなく「申請完了」が完了条件。Phase 11 で submission screenshot を `outputs/phase-11/production/verification-submission.md` に記録することで evidence 化する。

### AC × test ID トレース表

| AC | カバーする test ID / 検証 |
| --- | --- |
| AC-1 | redirect URI matrix と Google Cloud Console 登録一覧の手動 diff（Phase 5 Step A-1） |
| AC-2 | `bash scripts/cf.sh secret list` で 3 key（AUTH_SECRET / GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET）が staging / production 双方に存在 |
| AC-3 | `secrets-placement-matrix.md` の存在 + Phase 12 で `02-auth.md` / `13-mvp-auth.md` から参照リンク追加 |
| AC-4 | M-01〜M-11 / F-09 / F-15 / F-16 / B-01 を staging で実行（F-09 は B-03 により fail で記録） |
| AC-5 | M-06 / M-07 / M-10（staging）で確認 |
| AC-6 | Stage B 完了 + consent screen screenshot |
| AC-7 | F-09（production stage C） |
| AC-8 | privacy / terms / home の `curl -I` で `200` 確認（Phase 5 Step B-2） |
| AC-9 | `git grep -n "wrangler login"` 不在 + `ls ~/Library/Preferences/.wrangler/config/default.toml` 不在確認 |
| AC-10 | Phase 12 で `13-mvp-auth.md` を更新し B-03 状態を反映 |
| AC-11 | Phase 9 `free-tier-estimation.md` で根拠化 |
| AC-12 | 05a Phase 11 placeholder を本タスク outputs リンクで上書き（Phase 12 実施） |

## VISUAL evidence の取得方針

### screenshot 9 枚以上の構成

| # | ファイル名 | 撮影対象 | 段階 |
| --- | --- | --- | --- |
| 1 | `outputs/phase-11/staging/01-login-page.png` | `/login` 画面（Google sign-in ボタン） | A |
| 2 | `outputs/phase-11/staging/02-google-consent.png` | Google OAuth consent 画面 | A |
| 3 | `outputs/phase-11/staging/03-callback-redirect.png` | callback 後 `/` 着地直後 | A |
| 4 | `outputs/phase-11/staging/04-session-json.png` | `/api/auth/session` の JSON 表示（DevTools Network） | A |
| 5 | `outputs/phase-11/staging/05-admin-allowed.png` | allowlist 一致時 `/admin` 200 | A |
| 6 | `outputs/phase-11/staging/06-admin-denied.png` | 不一致時 `/login?gate=admin` redirect | A |
| 7 | `outputs/phase-11/staging/07-signout.png` | sign-out 後の cookie 削除（Application タブ） | A |
| 8 | `outputs/phase-11/production/consent-screen.png` | Google Cloud Console の consent screen（publishing status / scope / authorized domains 表示） | B |
| 9 | `outputs/phase-11/production/login-smoke.png` | 外部 Gmail で `/admin` 到達 | C |

> 9 枚以上を必須とし、F-15 / F-16 / B-01 の異常系も任意で `outputs/phase-11/staging/08-redirect-mismatch.png` 等を追加可。

### 撮影時の必須注意（Phase 5 で再掲）

- DevTools の Network / Application タブを撮る場合、`set-cookie` ヘッダの **値**部分（session token）と `Authorization` ヘッダ値は撮影前にマスクするか、画面外にスクロール。
- URL バーに `code=...` / `state=...` クエリパラメータが残っているタイミング（callback 直後）は **撮らない**。`/` 着地後にスクリーンショットを撮る。
- Cloudflare dashboard / Google Cloud Console のスクリーンショットでは、`Client ID` / `Client secret` 値の表示を **隠す**（dashboard の "Hide" / "コピー" ボタン操作後に撮影）。
- ターミナル screenshot は `bash scripts/cf.sh secret list` の出力までに留め、`secret put` の標準入力は撮らない。

## coverage 標準（VISUAL タスク用代替指標）

| 指標 | 目標値 | 測定方法 |
| --- | --- | --- |
| smoke test PASS 率（staging） | M-01〜M-11 / F-15 / F-16 / B-01 で 100% | Phase 11 manual-smoke-log.md に PASS/FAIL 記録 |
| F-09 PASS 率（production） | 100%（Stage C 完了条件） | Phase 11 manual-smoke-log.md |
| screenshot 充足率 | 9 枚以上 + 全ファイルが secret/token 非露出 | Phase 11 で目視レビュー |
| AC カバレッジ | AC-1〜AC-12 すべてに 1 つ以上の test ID または検証 | 本 Phase の AC × test ID トレース表 |

> 自動化テストの line/branch coverage は本タスクスコープ外（05a で計測済）。

## 検証コマンド集（Phase 5 / 11 で実行）

```bash
# Cloudflare 認証確認（wrangler 直叩き禁止）
bash scripts/cf.sh whoami

# Cloudflare Secrets 配置確認
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env production

# privacy / terms / home の HTTP 200 確認
curl -I https://<production-domain>/
curl -I https://<production-domain>/privacy
curl -I https://<production-domain>/terms

# session JSON の取得（staging smoke）
curl -s -b cookies.txt https://<staging-domain>/api/auth/session | jq .

# wrangler login 不在の確認
ls ~/Library/Preferences/.wrangler/config/default.toml 2>&1 | grep -q "No such file" && echo "OK: no wrangler login state"
git grep -n "wrangler login" -- ':!docs/' ':!CLAUDE.md' ':!.claude/' && exit 1 || echo "OK: no wrangler login invocation"
```

> `<staging-domain>` / `<production-domain>` は実値非掲載。Phase 5 で `apps/web/wrangler.toml` / `apps/api/wrangler.toml` から取得して埋める。

## 実行手順

1. AC × test ID トレース表を `outputs/phase-04/test-strategy.md` に転記。
2. screenshot 9 枚の構成と撮影注意事項を同ファイルに固定。
3. coverage 代替指標 4 件を表形式で固定。
4. 検証コマンド集を `scripts/cf.sh` 経由で固定（wrangler 直叩きが残らないことを目視確認）。
5. 05a 自動化テストの再実行ポイント（Phase 11 直前）を runbook 入力として Phase 5 に渡す。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | 検証コマンドを runbook の Stage A/B/C 各ステップに wire-in |
| Phase 6 | F-15 / F-16 / B-01 を failure case の入力として転送 |
| Phase 7 | AC × test ID トレース表を ac-matrix.md に流し込み |
| Phase 11 | screenshot 9 枚 + manual-smoke-log.md を実機で生成 |

## 多角的チェック観点

- 価値性: AC-1〜AC-12 が test ID または検証コマンドで 100% カバーされている。
- 実現性: smoke は実 Cloudflare staging 環境 + 実 OAuth client で実行可能。
- 整合性: 05a smoke-checklist.md の test ID をそのまま流用し命名 drift なし。
- 運用性: screenshot 撮影注意事項が Phase 5 runbook に再掲される。
- セキュリティ: secret / token / cookie 値が screenshot に映らない撮影方針を明示。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | 自動化テスト再利用範囲の明示 | spec_created |
| 2 | test ID × 段階適用マトリクス確定 | spec_created |
| 3 | AC × test ID トレース表確定 | spec_created |
| 4 | screenshot 9 枚構成確定 | spec_created |
| 5 | coverage 代替指標確定 | spec_created |
| 6 | 検証コマンド集（cf.sh 経由）確定 | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/test-strategy.md | 自動化再利用 / test ID マトリクス / screenshot 構成 / coverage 代替指標 / 検証コマンド集 |
| メタ | artifacts.json | Phase 4 状態更新 |

## 完了条件

- [ ] 自動化テスト再利用範囲が明示されコード新規追加ゼロが宣言済
- [ ] test ID × 段階適用マトリクスが M-01〜M-11 / F-09 / F-15 / F-16 / B-01 全件で記述
- [ ] AC × test ID トレース表で AC-1〜AC-12 すべてカバー
- [ ] screenshot 9 枚以上の構成と撮影注意事項が固定
- [ ] coverage 代替指標 4 件が定義
- [ ] 検証コマンドが `scripts/cf.sh` 経由で固定（wrangler 直叩きゼロ）

## タスク100%実行確認【必須】

- 実行タスク 6 件が `spec_created`
- 成果物が `outputs/phase-04/test-strategy.md` に配置済み
- AC-1〜AC-12 すべてに 1 つ以上の test ID または検証コマンドが対応
- secret / token を screenshot に映さない注意事項が明示

## 次 Phase への引き渡し

- 次 Phase: 5 (実装ランブック)
- 引き継ぎ事項:
  - test ID × 段階適用マトリクス → runbook Stage A/B/C ステップに wire-in
  - F-15 / F-16 / B-01 → Phase 6 failure case の入力
  - screenshot 9 枚構成 + 撮影注意 → Phase 11 で実機実行
  - 検証コマンド集 → Phase 5 / 11 でコピペ可能
- ブロック条件:
  - AC のいずれかが test ID にマップされていない
  - screenshot 撮影で secret / token が映る注意喚起が抜けている
  - wrangler 直叩きが本ドキュメント内に残存
