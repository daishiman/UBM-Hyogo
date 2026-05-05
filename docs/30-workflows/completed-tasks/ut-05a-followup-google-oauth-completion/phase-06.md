# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Google OAuth Staging Smoke + Production Verification 統合 (UT-05A-FOLLOWUP-OAUTH) |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| 作成日 | 2026-04-30 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | spec_created |
| タスク分類 | specification-design（failure-case） |
| taskType | implementation |
| visualEvidence | VISUAL |

## 目的

Phase 5 runbook の Stage A→B→C で発生し得る異常系を **苦戦箇所 4 件**（redirect URI 不一致 / placeholder 残存 / token 平文化 / B-03 滞留）を起点に網羅する。設定系 / verification 審査系 / secrets 投入系 / コンテンツ系 / 環境系の 5 層で 14 件以上のマトリクスを揃え、各ケースに **検出方法・復旧手順・ログ/screenshot 例** を付与する。Phase 7 AC マトリクスへの「関連 failure case」列の入力源となる。

## 実行タスク

1. 苦戦箇所 4 件を起点に failure case を 14 件以上列挙する（完了条件: 各ケースに分類・原因・検出・復旧・ログ例の 5 項目が埋まる）。
2. 各ケースの retry 戦略（即時失敗 / 修正後再 submit / 暫定運用 / no-retry）を明示する（完了条件: 全件で戦略が一意）。
3. Stage A→B→C の段階間ゲート失敗時の戻り経路を runbook 化する（完了条件: 各 Stage で前段に戻る具体コマンドが記述）。
4. verification 審査関連の失敗（却下 / 修正要求 / 長期審査）の対応を整備する（完了条件: B-03 解除条件 a/b/c の運用切替判断が手順化）。
5. secret 投入失敗 / 漏洩疑い時の rotation 手順を整備する（完了条件: 1Password / Cloudflare Secrets / OAuth client secret の rotation 経路が完結）。
6. screenshot に secret/token が映った場合の事故対応を明示する（完了条件: 削除 + rotate のセットが手順化）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-05a-followup-google-oauth-completion/phase-05.md | runbook の例外パス起点 |
| 必須 | docs/30-workflows/ut-05a-followup-google-oauth-completion/phase-04.md | F-15 / F-16 / B-01 の failure 起点 |
| 必須 | docs/30-workflows/ut-05a-followup-google-oauth-completion/phase-02.md | 4 設計成果物との突合 |
| 必須 | CLAUDE.md | scripts/cf.sh / op 運用ポリシー |
| 参考 | https://support.google.com/cloud/answer/9110914 | OAuth verification 申請仕様 |
| 参考 | https://developers.google.com/identity/protocols/oauth2/openid-connect | OAuth client 仕様 |

## failure cases マトリクス

| # | 分類 | ケース | 原因（苦戦箇所#） | 検出 | 戦略 | 復旧 | ログ/screenshot 例 |
| - | --- | --- | --- | --- | --- | --- | --- |
| 1 | 設定 | redirect URI mismatch（callback で Google が `redirect_uri_mismatch` エラー） | #1 | 401 + Google エラー画面 / `outputs/phase-11/staging/08-redirect-mismatch.png` | 即時失敗 | Stage A-1 に戻り、Google Cloud Console の Authorized redirect URIs に正規 URI を追加（末尾 `/` 無し / `https://`） | `{code:"OAUTH_REDIRECT_URI_MISMATCH",expected:"<staging-domain>/api/auth/callback/google"}` |
| 2 | 設定 | redirect URI 末尾スラッシュ違い | #1 | 同上 | 即時失敗 | URI 正規化ルール（末尾 `/` 無し）に統一 → 再登録 | 同上 |
| 3 | 設定 | http vs https の scheme drift | #1 | callback で SSL エラー or mismatch | 即時失敗 | `https://` に統一（local dev 以外） | 同上 |
| 4 | secrets | Cloudflare Secret 投入失敗（`scripts/cf.sh secret put` exit != 0） | #3 | wrangler exit code != 0 / 1Password 認証エラー | 即時失敗 | `op signin` 再実行 → Cloudflare API token 期限確認 → 再投入 | `{code:"CF_SECRET_PUT_FAIL",key:"GOOGLE_CLIENT_SECRET",env:"staging"}` |
| 5 | secrets | placeholder 残存（Stage A-2 で `op://` 参照のまま wrangler に渡してしまった） | #2, #3 | 実行時に Auth.js が `Configuration error: invalid client secret` | 即時失敗 | `.env` の `op://` 参照を `op run --env-file=.env` 経由で展開する `scripts/with-env.sh` 経路に切替 | `{code:"AUTH_INVALID_CLIENT"}` |
| 6 | secrets | token 平文化事故（screenshot / log / commit に secret 値が混入） | #3 | grep / git history / 監査時に発見 | 即時失敗 + rotate | (1) Google Cloud Console で OAuth client secret を **rotate**（旧値無効化） / (2) Cloudflare Secrets を新値で再投入 / (3) 1Password の値を更新 / (4) 漏洩した媒体（screenshot/commit）を削除 / (5) git history が汚染した場合は `git filter-repo` で除去 | `{code:"SECRET_LEAK_INCIDENT",rotated:true}` |
| 7 | secrets | `wrangler login` token がローカルに残存（`~/Library/Preferences/.wrangler/config/default.toml` 存在） | #3 | `ls ~/Library/Preferences/.wrangler/config/default.toml` 検出 | 即時失敗 | 当該ファイル削除 → 以降は `scripts/cf.sh` 経由に統一。token は 1Password に移行 | `{code:"WRANGLER_LOGIN_STATE_DETECTED"}` |
| 8 | verification | consent screen 申請却下（Google から修正要求） | #4 | Google からの審査結果メール / Cloud Console の status | 修正後再 submit | 指摘項目（scope justification / privacy URL / app demo 等）を修正 → Stage B-2 で再 submit | `{code:"OAUTH_VERIFICATION_REJECTED",reason:"<google-feedback>"}` |
| 9 | verification | 審査長期化（数週間以上 pending） | #4 | Cloud Console status が "Pending verification" のまま | 暫定運用（B-03 解除条件 b 採用） | testing user に owner / 主要管理者を追加し暫定運用。Phase 12 で `13-mvp-auth.md` に「審査中・暫定運用」と明記 | `{code:"OAUTH_VERIFICATION_PENDING_LONG",days:N}` |
| 10 | verification | testing user limit 超過（100 名上限） | #4 | testing user 追加時の Google エラー | 即時失敗 | verification 申請を優先（Stage B 加速）/ または不要 testing user を削除 | `{code:"OAUTH_TEST_USER_LIMIT_EXCEEDED"}` |
| 11 | verification | scope justification 不足（sensitive scope 申請扱い） | #4 | Google から「scope を justify せよ」要求 | 修正後再 submit | scope を `openid email profile` の最小権限に絞る（既に Phase 2 で確定）→ 再 submit。sensitive scope は申請しない | `{code:"OAUTH_SCOPE_JUSTIFICATION_REQUIRED"}` |
| 12 | コンテンツ | privacy / terms URL が 404 | #4 | `curl -I https://<production-domain>/privacy` で 404 | 即時失敗 | `apps/web` の routing に privacy/terms ページを deploy → 200 確認 → Stage B-1 再実行 | `{code:"CONTENT_URL_404",url:"/privacy"}` |
| 13 | コンテンツ | privacy / terms URL が 200 だが内容空 / 不適切 | #4 | Google verification 担当の指摘 | 修正後再 submit | コンテンツ追記 → deploy → 再 submit | `{code:"CONTENT_INSUFFICIENT"}` |
| 14 | コンテンツ | authorized domain が privacy/terms/home の domain と不一致 | #4 | consent screen 設定検証時 / Google からの指摘 | 即時失敗 | authorized domain を production root domain に統一。staging が独立 domain なら staging を sub-domain 化 | `{code:"AUTHORIZED_DOMAIN_MISMATCH"}` |
| 15 | 環境 | staging / production 取り違え（dev secret を production に投入等） | #3 | `bash scripts/cf.sh secret list --env <env>` の差分検証 | 即時失敗 | rotation 必須（漏洩相当として扱う）。誤投入した key を rotate → 正しい env に再投入 | `{code:"ENV_SECRET_MIXUP",applied_to:"production",intended:"staging"}` |
| 16 | 環境 | Cloudflare API token 期限切れ / 権限不足 | #3 | `bash scripts/cf.sh whoami` で 401/403 | 即時失敗 | 1Password の `op://Vault/Cloudflare/api-token` を更新 → `op signin` 再実行 | `{code:"CF_AUTH_FAILED"}` |
| 17 | smoke | F-09（外部 Gmail で `/login` → `/admin` 完走）が production で fail | #4 | M-06 redirect 状態 / B-03 解除未達 | 段階による分岐 | (a) verification verified 待ち: Stage B-4 に戻り Google からの結果待機 / (b) admin_users.active 不一致: Phase 12 で allowlist 値を確認・調整 / (c) callback URI 不一致: Case #1 経路 | `{code:"PROD_LOGIN_SMOKE_FAIL"}` + `outputs/phase-11/production/login-smoke-fail.png` |
| 18 | smoke | session cookie が `Secure` / `SameSite` 不正で staging / production 不整合 | #1 | M-04 で属性確認時に発覚 | 即時失敗 | Auth.js 設定（`useSecureCookies` / `cookie.options`）を staging / production で同一仕様に。05a 実装変更が必要なら 05a に戻る | `{code:"SESSION_COOKIE_ATTR_DRIFT"}` |

合計: 18 件（要件 14 件以上を満たす）。苦戦箇所 4 件すべてに 3 件以上の failure case が紐付く。

## 苦戦箇所 4 件 × failure case マトリクス

| 苦戦箇所 | 関連 case # |
| --- | --- |
| #1 redirect URI 不一致 / Cloudflare host 差分 | 1, 2, 3, 18 |
| #2 screenshot / curl / session JSON が placeholder のまま残る | 5（および Phase 11 の手動レビューで evidence 充足率を確認） |
| #3 OAuth client secret の取り扱い属人化 / token 平文化 | 4, 5, 6, 7, 15, 16 |
| #4 testing user 以外でログイン不能（B-03） | 8, 9, 10, 11, 12, 13, 14, 17 |

## 段階間ゲート失敗時の戻り経路

### Stage A→B ゲート失敗

```bash
# 失敗 test ID を manual-smoke-log.md に記録
# 関連 failure case # を特定して該当 case の復旧手順を実行
# Stage A-3 (deploy) からやり直し → Stage A-4 (smoke) を再実行
```

### Stage B→C ゲート失敗

- Case #8（却下）: 修正 → Step B-2 で再 submit
- Case #9（長期審査）: B-03 解除条件 b（submitted 暫定運用）を採用し、Stage C は testing user で smoke。verified 取得後に外部 Gmail で再 smoke。
- Case #12-14（コンテンツ）: production deploy で privacy/terms 修正 → Step B-1 から再実行

### Stage C ゲート失敗

- Case #17（F-09 fail）: 原因分岐に従い (a) verified 待機 / (b) allowlist 調整 / (c) Case #1 経路に戻る

## OAuth client secret rotation 手順

```bash
# (1) Google Cloud Console で OAuth client secret rotate
#     APIs & Services → Credentials → 該当 client ID → "RESET SECRET"
#     旧 secret は即時無効化される

# (2) 1Password に新値を保存
#     op://Vault/UBM-Auth/google-client-secret を新値で更新（GUI または op item edit）

# (3) Cloudflare Secrets を新値で再投入（staging + production 両方）
op read "op://Vault/UBM-Auth/google-client-secret" \
  | bash scripts/cf.sh secret put GOOGLE_CLIENT_SECRET --config apps/api/wrangler.toml --env staging
op read "op://Vault/UBM-Auth/google-client-secret" \
  | bash scripts/cf.sh secret put GOOGLE_CLIENT_SECRET --config apps/api/wrangler.toml --env production
# apps/web 側も同様

# (4) 再 deploy
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production

# (5) Stage A-4 / Stage C-3 の smoke を再実行
```

## screenshot に secret/token が映った場合の事故対応

```bash
# (1) 該当ファイルを git history から削除（commit 前なら rm のみ）
rm outputs/phase-11/staging/<leaked-screenshot>.png

# (2) 既に commit / push 済の場合
#     git filter-repo でファイル除去 + force push（main 以外）
#     main に push 済の場合は immediate rotation を優先し、history 除去は別途調整

# (3) 漏洩した secret 種別に応じて Case #6 の rotation 手順を実行

# (4) 事故記録を outputs/phase-11/incident-log.md に追加
#     - 漏洩日時 / 媒体 / rotation 完了時刻 / 影響範囲
```

## verification 申請却下時の運用フロー

```
申請却下メール受信
  ↓
指摘項目を outputs/phase-11/production/verification-feedback.md に記録
  ↓
分類:
  - scope justification 不足 (Case #11) → scope を最小権限に絞る（既に対応済）
  - privacy/terms 内容不足 (Case #13) → コンテンツ追記 + deploy
  - app demo 不足 → demo video 追加
  - authorized domain 不一致 (Case #14) → domain 統一
  ↓
Stage B-2 で再 submit
  ↓
（長期化なら）B-03 解除条件 b（暫定運用）採用 → Stage C は testing user で smoke
```

## 各ケース ↔ 検証スイート / AC wire-in

| Case # | 関連 test ID（Phase 4） | 関連 AC |
| --- | --- | --- |
| 1, 2, 3 | F-15（intentional fault） | AC-1 |
| 4, 7, 16 | sanity check（Phase 5） | AC-2, AC-9 |
| 5, 6, 15 | sanity check + 監査 | AC-2, AC-9 |
| 8, 9, 11 | Stage B-2 / B-4 | AC-6, AC-10 |
| 10 | testing user 数監視 | AC-10 |
| 12, 13, 14 | Step B-1 curl 確認 | AC-8 |
| 17 | F-09 | AC-7, AC-10 |
| 18 | M-04 | AC-5 |

## 実行手順

1. 18 件のマトリクスを `outputs/phase-06/failure-cases.md` に転記。
2. 苦戦箇所 4 件 × failure case マトリクスを Phase 12 の振り返り入力として固定。
3. 段階間ゲート失敗時の戻り経路を Phase 5 runbook と相互参照。
4. OAuth client secret rotation 手順 + screenshot 事故対応 + verification 却下フローをコマンドベースで完結させる。
5. open question（Magic Link 統合時の secrets DRY / verification 自動再申請）を Phase 12 unassigned に送る。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | failure case ID を AC マトリクスの「関連 failure case」列に紐付け |
| Phase 9 | rotation / 事故対応の運用負荷を無料枠運用と整合 |
| Phase 11 | F-15 / F-16 / B-01 を staging で intentional fault injection 実行 |
| Phase 12 | UT-Magic-Link / UT-OAuth-Re-verification を unassigned-task-detection に登録 |

## 多角的チェック観点

- 価値性: 各ケースが運用者にとって意味のある復旧パスを示している。
- 実現性: rotation / 再 submit / 暫定運用が `scripts/cf.sh` + Google Cloud Console GUI で実行可能。
- 整合性: 苦戦箇所 4 件すべてに 3 件以上の failure case が紐付く。
- 運用性: 事故対応コマンドがコピペで完結する（オペレーター実行可能）。
- セキュリティ: token 平文化事故への rotation が即時化。screenshot 事故対応が明示。
- AI 学習混入防止: 復旧手順内で実値の表示・転記を要求しない（すべて `op://` 参照経由）。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | 18 件 failure case マトリクス | spec_created |
| 2 | 苦戦箇所 4 件 × case マッピング | spec_created |
| 3 | 段階間ゲート失敗時の戻り経路 | spec_created |
| 4 | verification 却下対応フロー | spec_created |
| 5 | OAuth client secret rotation 手順 | spec_created |
| 6 | screenshot 事故対応手順 | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/failure-cases.md | 18 件マトリクス + 苦戦箇所別 mapping + rotation/事故対応手順 |
| メタ | artifacts.json | Phase 6 状態更新 |

## 完了条件

- [ ] 14 件以上の failure case が 5 分類に網羅（本仕様では 18 件）
- [ ] 全ケースで戦略が一意（即時失敗 / 修正後再 submit / 暫定運用 / no-retry）
- [ ] 苦戦箇所 4 件すべてに 3 件以上の case が紐付く
- [ ] OAuth client secret rotation 手順がコマンド付きで完結
- [ ] screenshot 事故対応（削除 + rotate + history 除去）が手順化
- [ ] verification 却下時の修正 → 再 submit フローが運用化
- [ ] B-03 解除条件 b（submitted 暫定運用）の採用判断が手順内で記述
- [ ] wrangler 直叩きが本ドキュメント内にゼロ件
- [ ] 実値（client_id / client_secret / token / email / domain）の転記がゼロ件

## タスク100%実行確認【必須】

- 実行タスク 6 件が `spec_created`
- 成果物が `outputs/phase-06/failure-cases.md` に配置済み
- 18 件全てに 5 項目（分類・原因・検出・戦略・復旧・ログ例）が記入
- Phase 5 runbook の各 Stage 例外パスが全て failure case に対応
- AC-1〜AC-12 のうち少なくとも 8 件以上が failure case と wire-in されている

## 次 Phase への引き渡し

- 次 Phase: 7 (AC マトリクス)
- 引き継ぎ事項:
  - 18 件の failure case ID を AC マトリクスの「関連 failure case」列で参照
  - 段階間ゲート失敗時の戻り経路を Phase 11 手動 smoke で実機検証可能な形式
  - rotation / 事故対応手順を Phase 12 ドキュメント（`02-auth.md` / `13-mvp-auth.md`）に反映
- ブロック条件:
  - 14 件未満で Phase 7 へ進む
  - 苦戦箇所 4 件のいずれかに紐付く case が 1 件以下
  - rotation 手順または screenshot 事故対応が記述されない
  - 実値転記が残存
