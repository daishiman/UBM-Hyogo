# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Google OAuth Staging Smoke + Production Verification 統合 (UT-05A-FOLLOWUP-OAUTH) |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-04-30 |
| 前 Phase | 8 (DRY 化 / リファクタリング) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | spec_created |
| タスク分類 | specification-design（QA） |
| visualEvidence | VISUAL |

## 目的

Phase 8 で確定した source-of-truth グラフ / 6 key 固定 / smoke-checklist.md 再記載禁止ルールを前提に、**セキュリティ（実値混入なし / wrangler login 不在 / screenshot に secret 不在）** / **可観測性（wrangler-dev.log / Cloudflare Workers logs）** / **failure mode 網羅** / **無料枠余裕度（Google Cloud / Cloudflare Workers / Secrets / 1Password）** / **line budget** / **link 整合** / **mirror parity** / **a11y** の 8 観点で品質保証チェックを行い、Phase 10 GO/NO-GO 判定の客観的根拠を揃える。a11y は OAuth consent screen を Google が提供する画面に依存するため本タスクの責務外として明記する。

## 実行タスク

1. セキュリティ確認を `outputs/phase-09/main.md` に記述する（完了条件: 実値混入なし / wrangler login 不在 / `~/Library/Preferences/.wrangler/config/default.toml` 不在 / screenshot 撮影時の secret マスク方針が記述）。
2. 可観測性確認を記述する（完了条件: wrangler-dev.log の取得手順 + Cloudflare Workers logs（`bash scripts/cf.sh tail` 等）の確認手順が runbook と整合）。
3. failure mode の網羅性チェック（完了条件: Phase 6 異常系と AC マトリクスの突合表が記述）。
4. 無料枠見積もりを別ファイル `outputs/phase-09/free-tier-estimation.md` に詳細化する（完了条件: Google Cloud / Cloudflare Workers / Cloudflare Secrets / 1Password の 4 サービスすべての試算が記述）。
5. line budget を確認する（完了条件: 各 phase-XX.md が 100-250 行、index.md が 250 行以内）。
6. link 検証を行う（完了条件: outputs path / artifacts.json / index.md / phase-XX.md 間のリンク切れが 0）。
7. mirror parity を確認する（完了条件: 本タスクは N/A 判定であることが明記）。
8. a11y 対象外を明記する（完了条件: 「OAuth consent screen は Google 側 UI のため a11y 責務外」と記述）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-05a-followup-google-oauth-completion/phase-08.md | DRY 化済みの命名・path・正本グラフ |
| 必須 | docs/30-workflows/ut-05a-followup-google-oauth-completion/phase-06.md | failure case の出典 |
| 必須 | docs/30-workflows/ut-05a-followup-google-oauth-completion/phase-07.md | AC マトリクス × evidence path |
| 必須 | docs/00-getting-started-manual/specs/02-auth.md | 認証設計の整合確認先 |
| 必須 | docs/00-getting-started-manual/specs/13-mvp-auth.md | B-03 制約の現状記述 |
| 必須 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | secrets 取扱方針 |
| 参考 | https://developers.cloudflare.com/workers/platform/limits/ | Workers 無料枠公式 |
| 参考 | https://cloud.google.com/identity-platform/pricing（OAuth は無料）| Google Cloud OAuth が無料であることの根拠 |

## セキュリティチェック（main.md 主要観点）

### 実値混入なし

| チェック対象 | 方法 | 期待結果 |
| --- | --- | --- |
| 仕様書本体（phase-01〜phase-13.md / index.md） | `git grep -nE "([A-Za-z0-9_-]{20,})"` で長文字列を抽出し client_id / client_secret パターンに該当するものを目視確認 | 0 件 |
| outputs/phase-02/secrets-placement-matrix.md | `op://` 参照以外の値が含まれないことを目視 | `op://` のみ |
| outputs/phase-11/staging/* | session-member.json / session-admin.json で access_token / id_token は **非掲載** または mask（`<redacted>`） | 実トークン 0 件 |
| outputs/phase-11/production/login-smoke.png | 撮影前に DevTools で session cookie を mask、URL に code/state パラメータが残らない位置で撮影 | secret 不可視 |
| .env（リポジトリ非コミット） | `op://` 参照のみで構成、実値直書きなし | git status で .env が untracked / gitignored |

### wrangler login 不在

| チェック対象 | 方法 | 期待結果 |
| --- | --- | --- |
| `~/Library/Preferences/.wrangler/config/default.toml` | `ls ~/Library/Preferences/.wrangler/config/default.toml 2>&1` | `No such file or directory` |
| シェル履歴 / 仕様書 | `git grep -n "wrangler login"` | 仕様書本体での出現が「禁止である」記述以外で 0 件 |
| 実行経路 | runbook が `bash scripts/cf.sh` 単一経路を参照 | wrangler 直接呼び出し 0 件 |

### screenshot に secret 不在（VISUAL evidence ガイドライン）

| 観点 | ガイドライン |
| --- | --- |
| URL | OAuth callback の `code=...` / `state=...` パラメータが付いた URL は**撮影しない**。`/admin` 到達後の URL のみ撮影 |
| Cookie / Storage | DevTools の Application タブを開いた状態では撮影しない |
| Network タブ | Authorization header / Set-Cookie が見える状態では撮影しない |
| Cloud Console | OAuth client 詳細画面で「クライアント シークレット」フィールドは折りたたみまたは mask した状態で撮影 |
| Cloudflare Secrets | `bash scripts/cf.sh secret list` の出力（key 名のみ）は撮影可。`secret get` は使わない |

## 可観測性

| 観測対象 | 取得方法 | 出力先 | 確認内容 |
| --- | --- | --- | --- |
| wrangler-dev.log（staging smoke 中） | `bash scripts/cf.sh dev --config apps/api/wrangler.toml --env staging > outputs/phase-11/staging/wrangler-dev.log 2>&1`（または tee） | `outputs/phase-11/staging/wrangler-dev.log` | callback log / session resolve log / admin gate 判定 log がそれぞれ 1 件以上出力されていること |
| Cloudflare Workers logs（staging） | `bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging --format pretty > outputs/phase-11/staging/workers-tail.log` | 同上 dir | OAuth callback の 200 / 302 status と admin gate 判定の log line を確認 |
| Cloudflare Workers logs（production） | 同上 `--env production`（実行は Stage C のみ、短時間 tail） | `outputs/phase-11/production/workers-tail.log` | login smoke 1 件分の log entry を取得 |
| consent screen submit 結果 | Google Cloud Console「OAuth 同意画面」の status 表示を screenshot | `outputs/phase-11/production/verification-submission.md` + `consent-screen.png` | submit 完了 status / 要修正コメント有無 |

> log 内に Authorization header / cookie 値が含まれる場合は、保存前に `<redacted>` 等で置換する手順を runbook に明記する。

## failure mode 網羅性

| failure case（Phase 6 出典） | 検出経路 | 想定再現 evidence |
| --- | --- | --- |
| redirect URI 不一致（Console と Cloudflare host） | Stage A M-01 で Google から `redirect_uri_mismatch` エラー | `outputs/phase-11/staging/screenshot-redirect-mismatch.png`（再現時） |
| AUTH_SECRET 未設定 | wrangler-dev.log に Auth.js 起動時 error | wrangler-dev.log の error line |
| admin_users.active 不一致 | Stage A M-08 で `/admin` redirect が `/login?gate=admin` のまま | `outputs/phase-11/staging/admin-gate-redirect.txt` |
| privacy / terms URL 404 | Stage B 直前の curl 確認で 404 | `outputs/phase-11/production/url-200-check.txt` の異常値 |
| testing user 制限滞留（B-03） | Stage C で外部 Gmail login が `403 access_denied` | `outputs/phase-11/production/login-smoke-log.md` で再試行履歴 |
| wrangler login 残留 | `ls ~/Library/Preferences/.wrangler/config/default.toml` が file 検出 | `outputs/phase-11/{staging,production}/wrangler-login-absence.txt` で検出 |
| screenshot に secret 混入 | Phase 9 セキュリティ目視で発見 | 当該ファイルを再撮影 |

> Phase 6 の異常系一覧と AC マトリクスの突合で、すべての failure mode が **検出経路（自動 or 目視）+ 再現 evidence path** にトレースされていることを確認する。

## 無料枠見積もり（main.md サマリー）

詳細は `outputs/phase-09/free-tier-estimation.md` を参照。本仕様書には主要数値のみ記載する。

### サービス別サマリー

| サービス | 利用範囲 | 課金有無 | 無料枠余裕度 |
| --- | --- | --- | --- |
| Google Cloud Console（OAuth + 同意画面 + verification 申請） | OAuth 2.0 client / consent screen 設定のみ | **無料**（OAuth は Google Identity 機能として常時無料 / verification 申請も無料） | N/A（課金 product を有効化していない） |
| Cloudflare Workers（apps/api / apps/web） | OAuth callback 処理 + session 維持 | 無料枠（100,000 req/day）内 | OAuth 関連 request 増分は smoke 数十回程度。本番でも数千 req/day 想定で余裕 |
| Cloudflare Secrets | 6 key × 2 env = 12 entries（staging + production） | 無料 | Secrets 数の上限内 |
| 1Password Environments | UBM-Auth vault に 6 entries 程度（auth-secret-staging / -prod / google-client-id / -secret / admin-allowlist / 任意） | 既存契約内 | 無料枠ではないが、本タスクで追加コスト 0 |

### Google Cloud 課金 product 非有効化の確認

| 確認対象 | 方法 |
| --- | --- |
| 課金アカウントの紐付け | Console「お支払い」で「お支払いアカウントなし」または「OAuth のみで課金 product 未使用」を確認 |
| 有効化された API | 「API とサービス → 有効な API」で Identity Toolkit / Google+ / Cloud Run 等の課金 product が有効になっていないことを確認 |
| OAuth scope | 最小権限（openid / email / profile）のみ。sensitive scope を申請していない |

> 万一課金 product が誤って有効化されている場合、Phase 11 Stage B 直前に無効化する手順を runbook に追記する。

### Cloudflare Workers / Secrets

| 項目 | 値 | 備考 |
| --- | --- | --- |
| OAuth callback 想定 request 数 | smoke 30 req + 本番月間 1,000 req 程度 | 100,000 req/day 無料枠の 1% 未満 |
| Secrets entries | 6 key × 2 env = 12 | 無料枠内 |
| KV / D1 利用 | 本タスクでは増加させない | UT-04 / UT-09 の試算と独立 |

### 1Password

| 項目 | 値 |
| --- | --- |
| vault entries 増分 | 0〜6 entries（既存 UBM-Auth vault に追加） |
| ライセンス | 既存 1Password Business / Family ライセンスを利用、本タスクで追加契約なし |

## line budget 確認

| ファイル | 想定行数 | budget | 判定 |
| --- | --- | --- | --- |
| index.md | 約 140 行 | 250 行以内 | PASS |
| phase-01.md 〜 phase-13.md | 各 100-250 行 | 100-250 行 | 全 PASS |
| outputs/phase-02/*.md | 個別判定（4 文書、各 100-300 行を目安） | 個別 | 個別チェック |
| outputs/phase-09/free-tier-estimation.md | 100-200 行 | 個別 | 個別チェック |

> 仕様書（phase-XX.md）が 100 行未満の場合は内容不足、250 行超の場合は分割を Phase 10 で検討する。

## link 検証

| チェック | 方法 | 期待 |
| --- | --- | --- |
| outputs path 整合 | artifacts.json `phases[*].outputs` × 実 path | 完全一致 |
| index.md × phase-XX.md | `Phase 一覧` 表 × 実ファイル | 完全一致 |
| phase-XX.md 内の `phase-YY.md` 参照 | 全リンク辿り | リンク切れ 0 |
| 05a smoke-checklist.md 参照 | `docs/30-workflows/completed-tasks/05a-parallel-authjs-google-oauth-provider-and-admin-gate/outputs/phase-11/smoke-checklist.md` | 実在 |
| `02-auth.md` / `13-mvp-auth.md` | spec dir 内に実在 | 実在 |
| `environment-variables.md` | `.claude/skills/aiworkflow-requirements/references/environment-variables.md` | 実在 |
| `scripts/cf.sh` | リポジトリ root | 実在 |
| GitHub Issue #251 / #252 | gh api / web URL | closed として閲覧可能 |

## mirror parity（N/A 判定）

- 本タスクは `.claude/skills/` 配下の skill 資源を更新しない（aiworkflow-requirements の `environment-variables.md` を **参照** するのみ）。
- ゆえに `.claude` 正本と `.agents` mirror の同期は **本タスクは N/A**。
- Phase 12 documentation 更新時に skill reference の文言を改訂した場合のみ mirror sync 義務が発生する。

## a11y 対象外の明記

- 本タスクは Google Cloud Console / Cloudflare ダッシュボード / Auth.js OAuth flow を扱うが、UI コンポーネントを新規実装しない。
- OAuth consent screen は **Google 側が提供する画面**であり、a11y 仕様の責務は Google にある。
- 本サイト側 `/login` ページの a11y は 05a タスク（または独立した UI a11y タスク）で評価する。
- ゆえに WCAG 2.1 / a11y 観点は本タスクで **対象外**。

## 実行手順

### ステップ 1: free-tier-estimation.md 作成
- Google Cloud / Cloudflare Workers / Cloudflare Secrets / 1Password の 4 サービス分試算を表化。
- 課金 product 非有効化の確認手順を含める。

### ステップ 2: main.md セキュリティセクション記述
- 実値混入なし / wrangler login 不在 / screenshot ガイドラインの 3 観点。

### ステップ 3: main.md 可観測性セクション記述
- wrangler-dev.log / Cloudflare Workers logs の取得手順。

### ステップ 4: failure mode 網羅性チェック
- Phase 6 異常系と AC マトリクスの突合表。

### ステップ 5: line budget / link 検証
- 各 phase-XX.md の `wc -l` を取り、100-250 行範囲内を確認。
- artifacts.json / index.md / phase-XX.md の path 整合。

### ステップ 6: mirror parity / a11y 判定
- 本タスクは双方とも N/A / 対象外と明記。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | セキュリティ・可観測性・無料枠余裕度・failure mode 網羅性を GO/NO-GO の根拠に使用 |
| Phase 11 | screenshot ガイドラインを Stage A / Stage C 撮影時に再確認、wrangler-dev.log / workers-tail.log の取得を実行 |
| Phase 12 | 02-auth.md / 13-mvp-auth.md / environment-variables.md への参照リンク追記時に本セクションのセキュリティ方針を再掲 |

## 多角的チェック観点

- 価値性: 無料枠を超えない範囲で OAuth verification 完了 + staging smoke evidence 取得を実現。
- 実現性: `scripts/cf.sh` 単一経路で staging / production 双方の secret 投入と log 取得が完結。
- 整合性: 不変条件 #2（consent キー統一）/ #5（D1 access 閉鎖）/ Cloudflare CLI ポリシーと整合。
- 運用性: secrets 配置の単一正本化により verification 後の運用更新が 1 箇所完結。
- 認可境界: admin_users.active が D1 の管理者判定として参照され、admin gate が staging / production 双方で機能。
- 無料枠: Google Cloud（無料）/ Cloudflare Workers（1% 未満）/ Cloudflare Secrets（無料）/ 1Password（既存契約）すべてで増分コスト 0 または極小。
- セキュリティ: 実値混入 0 / wrangler login 不在 / screenshot に secret 不在の 3 軸で根拠化。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | free-tier-estimation.md 作成（4 サービス試算） | 9 | spec_created | 別ファイル |
| 2 | セキュリティチェック記述（3 観点） | 9 | spec_created | main.md |
| 3 | 可観測性記述（wrangler-dev.log + workers tail） | 9 | spec_created | main.md |
| 4 | failure mode 網羅性チェック | 9 | spec_created | Phase 6 突合 |
| 5 | line budget 計測 | 9 | spec_created | 100-250 行 |
| 6 | link 検証 | 9 | spec_created | リンク切れ 0 |
| 7 | mirror parity / a11y 判定 | 9 | spec_created | 双方 N/A / 対象外 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | QA 結果サマリー（セキュリティ / 可観測性 / failure mode / line budget / link / mirror / a11y） |
| ドキュメント | outputs/phase-09/free-tier-estimation.md | Google Cloud / Cloudflare Workers / Cloudflare Secrets / 1Password の 4 サービス無料枠試算 |
| メタ | artifacts.json | Phase 9 状態の更新 |

## 完了条件

- [ ] free-tier-estimation.md に 4 サービスすべての試算と課金 product 非有効化の確認手順が記載
- [ ] セキュリティチェック 3 観点（実値 / wrangler login / screenshot）が記述
- [ ] 可観測性で wrangler-dev.log + workers tail の取得手順が runbook と整合
- [ ] failure mode 網羅性表が Phase 6 のすべての case を含む
- [ ] line budget が全 phase で 100-250 行範囲内
- [ ] link 検証でリンク切れ 0
- [ ] mirror parity が N/A と明記
- [ ] a11y 対象外（Google 側 UI 責務）と明記

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- 成果物 2 ファイルが `outputs/phase-09/` 配下に配置予定
- セキュリティ 3 観点 / 可観測性 / failure mode / 無料枠の 4 サービスすべてが定量化または手順化されている
- a11y 対象外 / mirror parity N/A が明記されている
- 仕様書本体に実値（client_id / client_secret / token / authorized email）が 0 件
- artifacts.json の `phases[8].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 10 (最終レビュー)
- 引き継ぎ事項:
  - セキュリティ 3 観点の合格状態
  - 可観測性（wrangler-dev.log + workers tail）の取得手順
  - failure mode 網羅性（Phase 6 → Phase 11 evidence への trace）
  - 無料枠余裕度（Google Cloud 無料 / Cloudflare 1% 未満 / Secrets 無料 / 1Password 既存契約）
  - line budget / link 整合 / mirror parity（N/A） / a11y（対象外）
- ブロック条件:
  - 実値混入が 1 件でも残る
  - wrangler login が残留している
  - failure mode のうち evidence path が定義されていないものがある
  - 無料枠で課金 product が誤って有効化されたまま
  - link 切れが残る
