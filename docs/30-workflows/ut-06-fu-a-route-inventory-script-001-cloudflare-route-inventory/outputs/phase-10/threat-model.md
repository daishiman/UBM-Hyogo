# Phase 10 成果物: 脅威モデル（T-1 〜 T-6）

> 本ドキュメントは Phase 10 セキュリティレビューの脅威モデル詳細。`phase-10.md` §「脅威モデル」を SSOT とし、本ファイルで T-1 〜 T-6 の詳細シナリオ / 対策 / 残存リスク / 検出手段を記述する。STRIDE 6 観点（情報漏洩 / 権限昇格 / 否認 / 改ざん / DoS / 仕様逸脱）を網羅。

## 1. 対象スコープ

| 項目 | 値 |
| --- | --- |
| 対象タスク | UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-001 |
| 対象資産 | Cloudflare Workers route 構成情報 / API token / OAuth token / `.env` 内 op 参照 |
| 攻撃 surface | (a) inventory script 出力（JSON / Markdown） (b) script 実行ログ (c) commit 履歴 (d) PR diff (e) Cloudflare API 自体 |
| docs-only / NON_VISUAL | 本タスクは仕様書のみ。実装と実打ちは受け側 `UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-IMPL-001` |

## 2. 脅威モデル一覧

### T-1 情報漏洩（Confidentiality）

| 項目 | 内容 |
| --- | --- |
| カテゴリ | 情報漏洩 (STRIDE: Information Disclosure) |
| シナリオ | API token 値 / OAuth token / Bearer header / Cookie / Zone ID 実値が以下に残る: <br> (1) script の標準出力 / 標準エラー出力 <br> (2) 出力 JSON / Markdown ファイル <br> (3) commit 履歴 / PR diff <br> (4) CI ログ / GitHub Actions log <br> (5) ローカル `.env` ファイル |
| 対策 | (a) `bash scripts/cf.sh` で `op run --env-file=.env` 経由揮発注入のみ。token はファイルに残らない <br> (b) 出力前 grep gate で 4 種類正規表現を 0 件確認（`Bearer\s+...` / `CLOUDFLARE_API_TOKEN\s*[:=]\s*\S+` / `ya29\.\|ghp_\|gho_` / `Authorization\s*:`） <br> (c) evidence は key 名 / Worker 名 / route pattern のみ。Account ID / Zone ID は mask <br> (d) CLAUDE.md「`.env` Read 禁止」を再掲し、AI が token 値を読み取らない <br> (e) `wrangler login` でローカル OAuth token を保持しない |
| 残存リスク | grep gate が pattern を漏らす可能性。security-review.md §4 で正規表現一覧を網羅化することで対策。Phase 11 evidence で実値検証 |
| 検出手段 | Phase 11 `outputs/phase-11/secret-leak-grep.md` で 0 件確認 |

### T-2 権限昇格（Authorization）

| 項目 | 内容 |
| --- | --- |
| カテゴリ | 権限昇格 (STRIDE: Elevation of Privilege) |
| シナリオ | mutation 権限を持つ token を script が誤使用し、production を意図せず変更する。例: 過大 scope の token が 1Password に登録されており、bug でスクリプトが `DELETE /zones/{zone_id}/workers/routes/{route_id}` を hit する |
| 対策 | (a) API token scope を read-only に限定（Account.Workers Scripts:Read / Zone.Workers Routes:Read / Zone.Zone:Read のみ） <br> (b) `cloudflare-token-scope-check.md` に scope 列挙と検証手順を明記 <br> (c) script コードには allowlist 通り `GET` のみが書かれていることを Phase 11 mutation-endpoint-grep で再検証 <br> (d) CI 自動実行禁止により、手動 1 回の運用境界を確保 |
| 残存リスク | 1Password 側 token scope の実値確認は手動 Phase 11 で実施（受け側実装タスク完了後）。誤って write scope 付き token を登録した場合は本 Phase の grep gate では検出不能 |
| 検出手段 | `bash scripts/cf.sh whoami` で account 情報のみ確認 / Cloudflare dashboard で token scope を目視確認 |

### T-3 否認（Non-repudiation）

| 項目 | 内容 |
| --- | --- |
| カテゴリ | 否認 (STRIDE: Repudiation) |
| シナリオ | inventory 結果が誰によって取得されたか追跡不能で、将来の incident 調査時に「誰が・いつ・どの token で取得したか」が不明 |
| 対策 | (a) 取得日時（`generatedAt` ISO8601）/ 取得者（`bash scripts/cf.sh whoami` のアカウント名のみ） / 取得コマンドラインを evidence header に記録 <br> (b) Phase 11 evidence は git commit され、commit author + commit timestamp で追跡可能 |
| 残存リスク | アカウント名以上の identity 情報（個人情報・端末識別子等）は記録しない（PII 配慮） |
| 検出手段 | git log で commit author / 日時を確認可能 |

### T-4 改ざん（Integrity）

| 項目 | 内容 |
| --- | --- |
| カテゴリ | 改ざん (STRIDE: Tampering) |
| シナリオ | inventory 出力後に手動編集で route → Worker 対応表が偽装される。例: `targetWorker` を実値と異なる値に書き換えて split-brain を隠蔽 |
| 対策 | (a) output に `source`（`api` / `dashboard-fallback`）と取得 timestamp を埋め込む <br> (b) Phase 11 evidence は git で commit され、diff レビュー対象 <br> (c) `mismatches` セクションは builder が機械的に生成（`entries.filter((e) => e.targetWorker !== expectedWorker)`）。手動編集すると整合性が崩れる |
| 残存リスク | git commit 前の手動編集は git diff で検出可能だが、commit 直前に上書きする攻撃は本 Phase スコープ外。実装タスクで rerun による再現性を担保 |
| 検出手段 | (a) `mismatches` と `entries` の filter 関係が崩れていないかを再計算で確認 <br> (b) 同一環境で再実行し diff 比較 |

### T-5 DoS（Availability）

| 項目 | 内容 |
| --- | --- |
| カテゴリ | DoS (STRIDE: Denial of Service) |
| シナリオ | inventory script を高頻度実行し Cloudflare API rate limit を超過。429 で他の正規運用が阻害される |
| 対策 | (a) CI 自動実行禁止（GitHub Actions / cron 等で hit しない） <br> (b) 手動 Phase 11 実行のみ（運用者が 1 回だけ手動実行） <br> (c) 1 取得セッションで scripts list / routes list / domains list の 3 endpoint を各 1 回ずつに制限 <br> (d) 429 受信時は再試行せず fail-fast |
| 残存リスク | 親タスク Phase 11 と同時実行時の rate limit 競合は serial 実行ルールで回避 |
| 検出手段 | runbook 内 rate limit 配慮節を Phase 11 / Phase 13 で再確認 |

### T-6 仕様逸脱（Scope creep）

| 項目 | 内容 |
| --- | --- |
| カテゴリ | 仕様逸脱（STRIDE 拡張: Out-of-scope behavior） |
| シナリオ | script に DNS 変更 / route 付け替え / Worker 削除 / deploy が紛れ込む。docs-only スコープを越えた実装が PR に混入する |
| 対策 | (a) 正本 §2「含まない」を明記 <br> (b) Phase 10 / 11 / 13 で重複明記（production 副作用ゼロ宣言） <br> (c) read-only API allowlist 限定（`GET` 3 endpoint のみ） <br> (d) PR diff レビューで実コード混入チェック <br> (e) 本タスクは docs-only のため `apps/` / `scripts/` 配下へのコード生成は行わない |
| 残存リスク | docs-only スコープ違反は Phase 13 grep gate で検出。受け側実装タスク（impl-001）に handoff した後は impl 側で再 review 必要 |
| 検出手段 | Phase 11 mutation-endpoint-grep / PR diff の path 制約 |

## 3. mutation 誤呼び出し（重点脅威 / NO-GO 軸）

T-2 / T-6 の交点として、特に **mutation endpoint 誤呼び出し** を NO-GO 軸の 1 つとして扱う。

| 観点 | 担保策 |
| --- | --- |
| allowlist | `GET /accounts/{account_id}/workers/scripts` / `GET /zones/{zone_id}/workers/routes` / `GET /accounts/{account_id}/workers/domains` の 3 endpoint のみ |
| token scope | read-only scope のみ（`cloudflare-token-scope-check.md` 参照） |
| 静的検証 | Phase 11 で script 内 `POST|PUT|PATCH|DELETE` 0 件 grep |
| runtime 検証 | 受け側実装タスクで dry-run mode を提供し、HTTP method を pre-flight check |

## 4. secret 漏洩（重点脅威 / NO-GO 軸）

T-1 を NO-GO 軸の 1 つとして扱う。grep gate の正規表現は次のとおり:

| # | 正規表現 | 検出対象 | 期待件数 |
| --- | --- | --- | --- |
| 1 | `Bearer\s+[A-Za-z0-9._-]+` | HTTP Authorization Bearer token 直書き | 0 |
| 2 | `CLOUDFLARE_API_TOKEN\s*[:=]\s*\S+` | env / config への token 直書き | 0 |
| 3 | `ya29\.\|ghp_\|gho_` | Google OAuth / GitHub PAT prefix | 0 |
| 4 | `Authorization\s*:` 直近に token 値 | header dump | 0 |

実行先: 出力 JSON / Markdown / runbook / spec 全文。

## 5. wrangler 直接実行（重点脅威 / NO-GO 軸）

T-6 の specialization として **wrangler 直接実行** を NO-GO 軸の 1 つとして扱う。

| 観点 | 担保策 |
| --- | --- |
| CLI ラッパー強制 | CLAUDE.md「Cloudflare 系 CLI 実行ルール」に従い `bash scripts/cf.sh` 経由のみ |
| 静的検証 | `grep -rn 'wrangler ' docs/30-workflows/.../ \| grep -v 'bash scripts/cf.sh'` で 0 件 |
| OAuth token 非保持 | `wrangler login` でローカル `~/Library/Preferences/.wrangler/config/default.toml` を保持しない。1Password op 参照に一本化 |
| esbuild 衝突回避 | `scripts/cf.sh` が `ESBUILD_BINARY_PATH` を自動解決 |

## 6. token scope 過大（重点脅威）

T-2 の specialization。`cloudflare-token-scope-check.md` で許容 scope を列挙し、それ以外は禁止。

| 許容 scope | 用途 |
| --- | --- |
| `Account.Workers Scripts:Read` | scripts list endpoint |
| `Zone.Workers Routes:Read` | workers/routes endpoint |
| `Zone.Zone:Read` | zone 情報の参照 |
| `Account.Worker:Read`（必要に応じ） | workers/domains endpoint |

**禁止 scope**: 上記の `Edit` / `Write` 相当、`Account.Workers KV:Edit`、`Zone.DNS:Edit`、`Account.Workers Routes:Edit`、`Account.Worker Scripts:Edit` 等の mutation 系全般。

## 7. NO-GO 3 軸まとめ

| NO-GO 軸 | 関連脅威 | 担保 |
| --- | --- | --- |
| mutation endpoint 誤呼び出し | T-2 / T-6 | allowlist `GET` のみ / token scope read-only / Phase 11 grep |
| secret 漏洩 | T-1 | op 経由揮発注入 / 4 種類 grep gate / evidence は key 名のみ |
| wrangler 直接実行 | T-6 | `bash scripts/cf.sh` 経由統一 / wrangler 文字列 0 件 grep |

## 8. 関連ドキュメント

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-10/security-review.md` | レビュー観点 R-1〜R-10 / 4 条件 / Design GO 判定 |
| `outputs/phase-10/cloudflare-token-scope-check.md` | API token scope 検証手順 |
| `outputs/phase-02/api-allowlist.md` | read-only allowlist SSOT |
| `phase-10.md` | 本 Phase 仕様書 SSOT |
