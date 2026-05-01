# Phase 11: 手動 smoke test（staging + production）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Google OAuth Staging Smoke + Production Verification 統合 (UT-05A-FOLLOWUP-OAUTH) |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke test（段階適用 A → B → C） |
| 作成日 | 2026-04-30 |
| 前 Phase | 10 (最終レビューゲート) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | spec_created |
| タスク分類 | implementation（実機 smoke / OAuth verification 申請） |
| visualEvidence | **VISUAL** |
| user_approval_required | false |

## VISUAL / NON_VISUAL 判定

- **mode: VISUAL**
- 判定理由:
  - OAuth flow（`/login` → Google consent → `/api/auth/callback/google` → `/admin`）はエンドユーザー UI を伴う。
  - Google Cloud Console での verification 申請は consent screen の publishing status を screenshot で証跡化する必要がある。
  - 結果として screenshot（PNG）が一次証跡。CLI 出力（`scripts/cf.sh secret list` 等）は補助証跡。

## 目的

Phase 10 GO 判定を入力に、**段階適用 A（staging smoke）→ B（production verification 申請）→ C（production smoke）** を実機で順次実行し、AC-1〜AC-12 の visible 部分の証跡を採取する。Stage A の PASS 無しに B/C には進まない。Stage B で verified を待たずに `submitted` 暫定運用（B-03 解除条件 b）でも完了扱いとし、Phase 12 / 13 へ進める。

## 実行タスク

1. Phase 10 GO 判定と Phase 5 runbook の前提を確認する。
2. Stage A staging smoke を実行し、login / consent / callback / session / admin gate の evidence を保存する。
3. Stage B production verification 申請を実行し、consent screen と submission 状態を保存する。
4. Stage C production smoke を外部 Gmail account で実行し、B-03 解除条件 a/b のどちらで閉じるか記録する。
5. Stage 全体の screenshot / curl / session JSON / log を `outputs/phase-11/` 配下に集約する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| Phase 5 | `phase-05.md` | 実行 runbook |
| Phase 10 | `phase-10.md` | GO / NO-GO gate |
| 05a smoke | `docs/30-workflows/completed-tasks/05a-parallel-authjs-google-oauth-provider-and-admin-gate/outputs/phase-11/smoke-checklist.md` | M/F/B smoke test ID |
| skill | `.claude/skills/task-specification-creator/references/phase-template-phase11.md` | VISUAL evidence の必須 outputs |
| 正本仕様 | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | Auth/session/admin gate の検証対象 |

## 段階適用フロー（Phase 2 設計成果物 4 と一貫）

```
[Stage A] staging smoke
  ↓ PASS
[Stage B] production verification 申請（submitted で完了扱い可）
  ↓ submitted or verified
[Stage C] production smoke（外部 Gmail account）
  ↓ PASS
Phase 12 へ
```

各 Stage の PASS / FAIL 判定は本仕様書末尾の「Stage 別合否判定」を参照。FAIL 時は Phase 5 runbook の該当ステップに戻る。

---

## Stage A: staging smoke

### 目的

05a Phase 11 で取得できなかった OAuth 可視 evidence を staging（Cloudflare Workers staging または `wrangler dev`）で取得し、`outputs/phase-11/staging/` に配置する。

### 前提（BL-01〜BL-06）

- 05a で実装された Auth.js Google provider / admin gate が staging に deploy 済
- Cloudflare Secrets staging に `AUTH_SECRET` / `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` 注入済、D1 `admin_users.active` 判定準備済（`bash scripts/cf.sh secret put` 経由）
- Google Cloud Console OAuth client に staging redirect URI 登録済
- staging host が consent screen の authorized domains 配下

### 対象 smoke ケース（05a smoke-checklist.md 由来）

| ID | 内容 | 想定経路 |
| --- | --- | --- |
| M-01 | `/login` 表示 / Google ボタン | GET /login |
| M-02 | Google ボタン押下 → consent | redirect to accounts.google.com |
| M-03 | consent allow → callback | GET /api/auth/callback/google |
| M-04 | admin_users.active 一致 → /admin | session resolve / admin gate |
| M-05 | session 取得 | GET /api/auth/session |
| M-06 | sign out | POST /api/auth/signout |
| M-07 | non-admin user → /admin redirect | admin gate redirect |
| M-08 | 未認証 /admin → /login?gate=... | middleware redirect |
| M-09 | session expired 動作 | cookie 削除後 |
| M-10 | scope（openid/email/profile）確認 | session payload |
| M-11 | re-login（既存 session） | sign in flow 再実行 |
| F-09 | 想定外 callback param 異常系 | /callback?error=access_denied |
| F-15 | admin_users.active 不一致時の `/login?gate=admin` | non-admin で /admin |
| F-16 | `/no-access` 不在の確認 | GET /no-access が 404 |
| B-01 | brand-level CSRF / state mismatch | callback で state 異常 |

### 実行手順

#### A-1. 事前準備

```bash
# Cloudflare Secrets staging の存在確認（実値は表示しない / list のみ）
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging

# wrangler login が無いことを確認（CLAUDE.md 準拠）
test ! -f ~/Library/Preferences/.wrangler/config/default.toml && echo OK
```

#### A-2. staging（または wrangler dev）起動

```bash
# 推奨: Cloudflare staging host にアクセス
# 補助: ローカル wrangler dev で再現する場合
mise exec -- pnpm --filter web dev > /tmp/wrangler-dev.log 2>&1 &
```

#### A-3. M-01〜M-11 / F-09 / F-15 / F-16 / B-01 を実機で順次実行

- 各ケースで screenshot を撮影し `outputs/phase-11/staging/screenshot-{ID}.png` に保存（命名規約は smoke-checklist.md と整合）。
- screenshot 撮影時は **token / client_secret / cookie 値が画面に映らない**ことを確認（DevTools の Network / Storage タブを閉じる）。
- session JSON は別ターミナルで `curl https://<staging>/api/auth/session --cookie "next-auth.session-token=..."` を取得し `outputs/phase-11/staging/session-member.json` / `session-admin.json` に保存（cookie 値はマスク）。
- `wrangler dev` log は `/tmp/wrangler-dev.log` を `outputs/phase-11/staging/wrangler-dev.log` にコピー（API token / database_id をマスク）。

### Stage A 成果物（必須）

| パス | 内容 |
| --- | --- |
| `outputs/phase-11/staging/screenshot-M-01.png` 〜 `screenshot-M-11.png` | M-01〜M-11 の画面証跡（11 枚 / smoke-checklist.md 由来） |
| `outputs/phase-11/staging/screenshot-F-09.png` | 異常系 callback param |
| `outputs/phase-11/staging/screenshot-F-15.png` | admin_users.active 不一致 redirect |
| `outputs/phase-11/staging/screenshot-F-16.png` | `/no-access` 不在確認 |
| `outputs/phase-11/staging/screenshot-B-01.png` | state mismatch / CSRF |
| `outputs/phase-11/staging/curl-session.txt` | curl 出力 |
| `outputs/phase-11/staging/session-member.json` | member session payload（cookie マスク） |
| `outputs/phase-11/staging/session-admin.json` | admin session payload（cookie マスク） |
| `outputs/phase-11/staging/wrangler-dev.log` | dev log（token / database_id マスク） |
| `outputs/phase-11/staging/redirect-uri-actual.md` | Phase 2 matrix の実 host 名版 |

> 仕様書中の「9 枚」は M-01〜M-11 の代表 9 ケースを指すが、smoke-checklist.md と一貫させるため上記 15 件すべての screenshot を採取する設計とし、index.md の「screenshot 9」を「主要 9 ケース + 補助」と読み替える。最低 9 枚採取で AC-4 の合格条件を満たす。

### Stage A 合否判定

- **PASS**: M-01〜M-11 / F-09 / F-15 / F-16 / B-01 すべてが期待挙動どおり、かつ screenshot / session JSON / log がすべて配置済 → Stage B へ進む。
- **FAIL**: いずれか 1 件でも期待挙動と乖離 → Phase 5 runbook の該当ステップに戻り原因切り分け。再実行で PASS した場合のみ Stage B へ。

---

## Stage B: production verification 申請

### 目的

Google OAuth consent screen を **Production publishing** で submit し、testing user 制限を解除する経路を起動する。verification verified までの待機が発生し得るが、`submitted` 状態で本タスクは完了扱いとする（B-03 解除条件 b）。

### 前提

- Stage A が PASS
- privacy / terms / homepage URI が production domain で 200 を返す（`curl -I` で事前確認）
- consent screen の app name / scope / authorized domain / contact email が phase-02 §設計成果物 3 と一致

### 実行手順

#### B-1. URL 200 確認

```bash
curl -I https://<production-domain>/
curl -I https://<production-domain>/privacy
curl -I https://<production-domain>/terms
```

- いずれも `HTTP/2 200`（または 200 OK）を期待。404 / 5xx の場合は Stage B に進まない。

#### B-2. Google Cloud Console で Production publishing

- Google Cloud Console → OAuth 同意画面 → 「アプリを公開する」/ Push to production を実行。
- App verification が必要な scope / branding 構成のため verification 申請の form が表示される。
- form 入力値は phase-02 §設計成果物 3（consent-screen-spec.md）からコピー。

#### B-3. submission screenshot 取得

- consent screen の publishing status が「In production - Verification in progress」（or 「Verified」）に遷移したことを screenshot で取得し `outputs/phase-11/production/consent-screen.png` に保存。
- screenshot に Google Cloud project ID / verification 担当者の email が含まれる場合はマスクするか、project ID は本タスクで非公開（実値は記載しない）扱い。

#### B-4. verification-submission.md 記録

`outputs/phase-11/production/verification-submission.md` に以下を記録:

- 申請日時（UTC）
- publishing status（`In production - Verification in progress` / `Verified` のいずれか）
- 申請者連絡先（mask 済 mail alias / 役割名）
- 申請 scope（openid / email / profile）
- privacy / terms / homepage URI（production domain は記載してよい / 実 URL は site のため公開情報）
- 想定審査期間（数日〜数週間 / Google からの通知待ち）
- B-03 解除条件: a (verified) / b (submitted 暫定) のどちらで完了扱いとするか

### Stage B 成果物（必須）

| パス | 内容 |
| --- | --- |
| `outputs/phase-11/production/consent-screen.png` | publishing status screenshot |
| `outputs/phase-11/production/verification-submission.md` | 申請記録（実 token / project ID は記載しない） |
| `outputs/phase-11/production/url-200-check.txt` | privacy / terms / homepage の `curl -I` 結果 |

### Stage B 合否判定

- **PASS**: publishing status が `In production`（verification in progress または verified）かつ submission screenshot / 記録が配置済 → Stage C へ進む。
- **FAIL**: form 入力 reject（authorized domains 不一致 / privacy URL 404 等）→ phase-05 runbook の consent screen ステップに戻り再実行。
- **WAITING**: verified までの待機中も `submitted` 状態として **PASS 扱い**（解除条件 b）。Phase 12 で `13-mvp-auth.md` に `submitted` 状態として記述し、verified 確定後の更新は派生タスクへ formalize。

---

## Stage C: production smoke（外部 Gmail account）

### 目的

testing user に **登録されていない外部 Gmail account** で本番 `/login` を実行し、Stage B の publishing 状態でログインが通ることを確認する。これにより B-03（testing user 以外ログイン不能）の解除を実機で確証する。

### 前提

- Stage B が PASS（submitted で OK）
- Cloudflare Secrets production に `AUTH_SECRET` / `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` 注入済、D1 `admin_users.active` 判定準備済
- BL-07: 外部 Gmail account（testing user 未登録）が用意されている

### 実行手順

#### C-1. Cloudflare Secrets production 投入確認

```bash
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env production
```

- 3 secret keys（`AUTH_SECRET` / `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`）が存在することを確認（実値は出力されない）。

#### C-2. 外部 Gmail account で login

- ブラウザ private window で `https://<production-domain>/login` を開く。
- Google ボタン → 外部 Gmail で consent → callback → 着地ページ（admin_users.active 含まれる場合は `/admin`、含まれない場合は `/`）へ遷移することを確認。
- screenshot を `outputs/phase-11/production/login-smoke.png` に保存（mail address / cookie 値はマスク）。

#### C-3. session 確認（オプション）

- 必要に応じて `curl https://<production-domain>/api/auth/session` を取得し `outputs/phase-11/production/session-external.json` に保存（cookie / mail マスク）。

### Stage C 成果物（必須）

| パス | 内容 |
| --- | --- |
| `outputs/phase-11/production/login-smoke.png` | 外部 Gmail での login 完了 screenshot（mail マスク） |
| `outputs/phase-11/production/session-external.json` | 外部 user の session payload（任意 / mail・cookie マスク） |

### Stage C 合否判定

- **PASS**: 外部 Gmail account で `/login` → 着地ページまで到達。screenshot 配置済。
- **FAIL**: `Error 403: access_denied` 等で blocked → Stage B の publishing status を再確認、redirect URI / authorized domain の整合を再点検。

---

## Phase 11 全体成果物

| パス | 内容 |
| --- | --- |
| `outputs/phase-11/main.md` | Phase 11 全体サマリー / 各 Stage の合否 / 既知制限 / VISUAL evidence index |
| `outputs/phase-11/manual-smoke-log.md` | コマンド単位の実行ログ（Stage A/B/C 全実行コマンド + stdout/stderr 抜粋） |
| `outputs/phase-11/staging/` | Stage A 全成果物（screenshot 9+ / curl / session JSON 2 / wrangler-dev.log / redirect-uri-actual.md） |
| `outputs/phase-11/production/` | Stage B/C 全成果物（consent-screen.png / verification-submission.md / login-smoke.png / url-200-check.txt） |

## 成果物

| 種別 | パス | 内容 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-11/main.md` | Stage A/B/C サマリーと evidence index |
| ドキュメント | `outputs/phase-11/manual-smoke-log.md` | test ID ごとの実測 / PASS / FAIL |
| 画像 | `outputs/phase-11/staging/*.png` | staging OAuth flow screenshot |
| 画像 | `outputs/phase-11/production/*.png` | production verification / login smoke screenshot |
| ログ | `outputs/phase-11/staging/*.json`, `outputs/phase-11/staging/*.log` | session / curl / wrangler evidence |
| メタ | `artifacts.json` | Phase 11 状態更新 |

## 既知制限リスト【必須】

| # | 制限 | 影響範囲 | 委譲先 / 補足 |
| --- | --- | --- | --- |
| 1 | verified までの審査期間が確定しない（数日〜数週間） | 本番外部公開時期 | Phase 12 で submitted 状態を `13-mvp-auth.md` に記録、verified 確定後の更新は派生タスクへ formalize |
| 2 | sensitive scope（gmail / drive 等）追加時は再申請が必要 | 将来の機能拡張 | 別タスクで申請 |
| 3 | staging host が production と異なる root domain の場合、authorized domains に追加が必要 | Stage A 着手時 | Stage A 事前確認で吸収 |
| 4 | Magic Link provider 追加時の secrets-placement-matrix DRY 化は本タスクスコープ外 | 派生 | Phase 12 unassigned-task-detection 候補 |
| 5 | screenshot に token / cookie / mail が映る事故は手作業マスク必須 | secret hygiene | Phase 5 runbook で撮影前注意喚起済 |
| 6 | wrangler login によるローカル token 保持は禁止 | Cloudflare CLI 運用 | `~/Library/Preferences/.wrangler/` 不在チェックを Stage A 事前準備で実施 |

## 多角的チェック観点

- 価値性: Stage C で外部 Gmail login が通れば本番公開のブロッカー B-03 が解除される。
- 実現性: 段階適用 A → B → C の各ゲート条件が phase-02 と一貫し、失敗時の戻り路が phase-05 に存在。
- 整合性: VISUAL evidence の保存先が AC-4 / AC-6 / AC-7 と一致。
- 運用性: `scripts/cf.sh secret list` のみで実値非表示の確認が可能。
- 認可境界: `/admin/*` gate を staging Stage A の M-04 / F-15 で確証。
- Secret hygiene: screenshot / log / JSON で token / cookie / mail / database_id / project ID をマスク。
- 不変条件: D1 / Sheets schema には触らない / `apps/web` から D1 直接アクセスしない。

## 統合テスト連携

| 連携先 | 本 Phase の扱い |
| --- | --- |
| 05a 自動テスト | Stage A 前に再実行し、既存実装の退行がないことを確認する |
| Phase 12 implementation guide | Stage A/B/C の実測結果と B-03 解除条件を Part 2 に転記する |
| aiworkflow same-wave sync | `02-auth.md` / `13-mvp-auth.md` / indexes の同期根拠にする |

## サブタスク管理

| # | サブタスク | Stage | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 事前準備（Secrets list / wrangler login 不在） | A | spec_created | BL-04/05/06 確認 |
| 2 | M-01〜M-11 / F-09 / F-15 / F-16 / B-01 実行 | A | spec_created | screenshot 採取 |
| 3 | session JSON 採取（member / admin） | A | spec_created | cookie マスク |
| 4 | wrangler-dev.log 採取 | A | spec_created | token マスク |
| 5 | privacy / terms / homepage URL 200 確認 | B | spec_created | curl -I |
| 6 | consent screen Production publishing | B | spec_created | submitted で完了可 |
| 7 | verification-submission.md 記録 | B | spec_created | 解除条件 a/b 記録 |
| 8 | Cloudflare Secrets production list 確認 | C | spec_created | 4 key 存在 |
| 9 | 外部 Gmail account で login smoke | C | spec_created | mail マスク |
| 10 | manual-smoke-log.md にコマンド単位ログ集約 | A/B/C | spec_created | 全 Stage |
| 11 | main.md に全 Stage 合否サマリー | - | spec_created | VISUAL evidence index |

## 完了条件

- [ ] Stage A の screenshot が最低 9 枚（主要 M-01〜M-11 + F-09/F-15/F-16/B-01）配置
- [ ] Stage A の `session-member.json` / `session-admin.json` / `wrangler-dev.log` 配置（マスク済）
- [ ] Stage B の `consent-screen.png` / `verification-submission.md` / `url-200-check.txt` 配置
- [ ] Stage C の `login-smoke.png` 配置（mail マスク済）
- [ ] `outputs/phase-11/main.md` で全 Stage の PASS / FAIL / WAITING 判定が読める
- [ ] `outputs/phase-11/manual-smoke-log.md` に Stage A/B/C 全コマンドが記録（実値マスク）
- [ ] `~/Library/Preferences/.wrangler/config/default.toml` 不在を Stage A 事前確認で記録
- [ ] B-03 解除条件 a / b のどちらで完了扱いか明記
- [ ] 既知制限 6 件が main.md に列挙

## タスク100%実行確認【必須】

- 全実行タスク（11 件）が `spec_created`
- 段階適用 A→B→C の順序遵守設計
- VISUAL evidence のマスク方針が手順に組み込まれている
- artifacts.json の `phases[10].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 12 (ドキュメント更新)
- 引き継ぎ事項:
  - Stage A/B/C の合否サマリーを Phase 12 Task 12-2 / 12-3 に転記
  - B-03 解除条件 a/b の確定状態を `13-mvp-auth.md` に反映
  - submitted で WAITING 終了の場合、verified 確定後の更新タスクを Task 12-4（unassigned-task-detection）に formalize
  - 05a Phase 11 placeholder（main.md / implementation-guide）の上書き対象パスを Task 12-3 changelog に列挙
  - 既知制限 6 件のうち #1 / #4 を unassigned-task 候補へ
- ブロック条件:
  - Stage A の必須 screenshot / session JSON / log 不足
  - Stage B の publishing status が submitted / verified 以外
  - Stage C の外部 Gmail login が FAIL
  - screenshot / log に token / cookie / mail / project ID 実値が映っている
  - wrangler 直接呼び出しが log に残っている
