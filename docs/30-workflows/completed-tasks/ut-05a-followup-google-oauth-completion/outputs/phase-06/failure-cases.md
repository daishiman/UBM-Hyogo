# Phase 6 主成果物 — 異常系 (failure cases)

> 仕様: `phase-06.md`
> 18 件マトリクス + 苦戦箇所別 mapping + rotation/事故対応手順

## failure cases マトリクス（18 件）

| # | 分類 | ケース | 原因# | 検出 | 戦略 | 復旧 |
| - | --- | --- | --- | --- | --- | --- |
| 1 | 設定 | `redirect_uri_mismatch` エラー | #1 | Google エラー画面 | 即時失敗 | Console "Authorized redirect URIs" に正規 URI 追加（末尾`/`無し / `https://`） |
| 2 | 設定 | redirect URI 末尾スラッシュ違い | #1 | 同上 | 即時失敗 | URI 正規化（末尾`/`無し）→ 再登録 |
| 3 | 設定 | http vs https scheme drift | #1 | SSL エラー or mismatch | 即時失敗 | `https://` 統一（local dev 以外） |
| 4 | secrets | `cf.sh secret put` exit != 0 | #3 | wrangler exit code | 即時失敗 | `op signin` 再実行 → API token 期限確認 → 再投入 |
| 5 | secrets | placeholder 残存（`op://` のまま wrangler に渡る） | #2,#3 | `Configuration error: invalid client secret` | 即時失敗 | `scripts/with-env.sh` 経路に切替 |
| 6 | secrets | 平文化事故（screenshot/log/commit に secret 混入） | #3 | grep / git 監査で発見 | 即時失敗 + rotate | (1) Console で client secret rotate / (2) Cloudflare 再投入 / (3) 1Password 更新 / (4) 漏洩媒体削除 / (5) git history 汚染なら `git filter-repo` |
| 7 | secrets | `wrangler login` token 残存 | #3 | `~/Library/Preferences/.wrangler/config/default.toml` 検出 | 即時失敗 | 当該ファイル削除 → `scripts/cf.sh` に統一 |
| 8 | verification | 申請却下 | #4 | Google 審査メール / Console status | 修正後再 submit | 指摘項目を修正 → Stage B-2 で再 submit |
| 9 | verification | 審査長期化（数週間以上 pending） | #4 | Console status "Pending" | 暫定運用（B-03 b 採用） | testing user 拡大 + `13-mvp-auth.md` に明記 |
| 10 | verification | testing user limit 超過（100 名） | #4 | Google エラー | 即時失敗 | verification 申請を優先 / 不要 testing user 削除 |
| 11 | verification | scope justification 不足 | #4 | Google からの「scope justify」要求 | 修正後再 submit | scope を `openid email profile` のみに絞り再 submit |
| 12 | コンテンツ | privacy/terms URL が 404 | #4 | `curl -I` で 404 | 即時失敗 | `apps/web` routing に privacy/terms 配置 → deploy → 200 確認 → Stage B-1 再実行 |
| 13 | コンテンツ | privacy/terms 200 だが内容不足 | #4 | Google 審査担当の指摘 | 修正後再 submit | コンテンツ追記 → deploy → 再 submit |
| 14 | コンテンツ | authorized domain 不一致 | #4 | 設定検証時 / Google 指摘 | 即時失敗 | authorized domain を production root に統一。staging を sub-domain 化 |
| 15 | 環境 | staging/production 取り違え | #3 | `secret list --env <env>` の差分検証 | 即時失敗 | rotation 必須（漏洩相当として扱う） |
| 16 | 環境 | Cloudflare API token 期限切れ / 権限不足 | #3 | `cf.sh whoami` で 401/403 | 即時失敗 | 1Password の token 更新 → `op signin` 再実行 |
| 17 | smoke | F-09 production fail | #4 | M-06 redirect / B-03 解除未達 | 段階分岐 | (a) verified 待機 / (b) allowlist 調整 / (c) Case #1 経路 |
| 18 | smoke | session cookie 属性 drift | #1 | M-04 で属性確認時 | 即時失敗 | Auth.js 設定（`useSecureCookies` / `cookie.options`）staging/production で同一仕様化（必要なら 05a に戻る） |

合計 18 件（要件 14 件以上を満たす）。

## 苦戦箇所 4 件 × case マッピング

| 苦戦箇所 | 関連 case # |
| --- | --- |
| #1 redirect URI 不一致 / Cloudflare host 差分 | 1, 2, 3, 18 |
| #2 evidence placeholder 残存 | 5（+ Phase 11 目視レビュー） |
| #3 secret 取り扱い属人化 | 4, 5, 6, 7, 15, 16 |
| #4 B-03（外部 Gmail login 不能） | 8, 9, 10, 11, 12, 13, 14, 17 |

すべての苦戦箇所に 3 件以上の case が紐付く（要件達成）。

## 段階間ゲート失敗時の戻り経路

### A → B 失敗

```bash
# 失敗 test ID を outputs/phase-11/manual-smoke-log.md に記録
# 関連 case # の復旧手順を実行 → Stage A-3 (deploy) → Stage A-4 (smoke) を再実行
```

### B → C 失敗

- Case #8 (却下): 修正 → Step B-2 で再 submit
- Case #9 (長期審査): B-03 解除条件 b 採用、Stage C は testing user で smoke。verified 取得後に外部 Gmail 再 smoke
- Case #12-14 (コンテンツ): production deploy で修正 → Step B-1 から再実行

### C 失敗

- Case #17 (F-09 fail): (a) verified 待機 / (b) allowlist 調整 / (c) Case #1 経路

## OAuth client secret rotation 手順

```bash
# (1) Console → APIs & Services → Credentials → 該当 client → "RESET SECRET"
#     旧 secret は即時無効化

# (2) 1Password 更新
#     op item edit で op://Vault/UBM-Auth/google-client-secret を新値に

# (3) Cloudflare Secrets 再投入（staging + production 両方 / api + web 両方）
op read "op://Vault/UBM-Auth/google-client-secret" \
  | bash scripts/cf.sh secret put GOOGLE_CLIENT_SECRET --config apps/api/wrangler.toml --env staging
op read "op://Vault/UBM-Auth/google-client-secret" \
  | bash scripts/cf.sh secret put GOOGLE_CLIENT_SECRET --config apps/api/wrangler.toml --env production
op read "op://Vault/UBM-Auth/google-client-secret" \
  | bash scripts/cf.sh secret put GOOGLE_CLIENT_SECRET --config apps/web/wrangler.toml --env staging
op read "op://Vault/UBM-Auth/google-client-secret" \
  | bash scripts/cf.sh secret put GOOGLE_CLIENT_SECRET --config apps/web/wrangler.toml --env production

# (4) 再 deploy
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production

# (5) Stage A-4 / Stage C-3 smoke 再実行
```

## screenshot に secret/token が映った場合の事故対応

```bash
# (1) commit 前: rm のみ
rm outputs/phase-11/staging/<leaked-screenshot>.png

# (2) commit/push 済: git filter-repo でファイル除去 + force push（main 以外）
#     main に push 済の場合は immediate rotation を優先

# (3) Case #6 の rotation 手順を実行

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
  - scope justification 不足 (Case #11) → scope 最小権限へ（既に対応済）
  - privacy/terms 内容不足 (Case #13) → コンテンツ追記 + deploy
  - app demo 不足 → demo video 追加
  - authorized domain 不一致 (Case #14) → domain 統一
  ↓
Stage B-2 で再 submit
  ↓
（長期化なら）B-03 解除条件 b 採用 → Stage C は testing user で smoke
```

## case ↔ test ID / AC wire-in

| case # | 関連 test ID | 関連 AC |
| --- | --- | --- |
| 1, 2, 3 | F-15 | AC-1 |
| 4, 7, 16 | sanity check | AC-2, AC-9 |
| 5, 6, 15 | sanity check + 監査 | AC-2, AC-9 |
| 8, 9, 11 | Stage B-2 / B-4 | AC-6, AC-10 |
| 10 | testing user 数監視 | AC-10 |
| 12, 13, 14 | Step B-1 curl | AC-8 |
| 17 | F-09 | AC-7, AC-10 |
| 18 | M-04 | AC-5 |

## open question（Phase 12 unassigned へ送る）

- Magic Link 統合時の secrets DRY（本タスクで使った secrets-placement-matrix を Magic Link 統合時に DRY 適用するか）
- verification 自動再申請（Google API での自動化可能性）
