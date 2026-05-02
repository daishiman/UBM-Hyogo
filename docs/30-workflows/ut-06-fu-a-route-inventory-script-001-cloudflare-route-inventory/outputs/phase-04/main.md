# Phase 4 成果物: テスト作成（test plan / NO-GO ゲート定義）

> 本タスクは **docs-only / infrastructure-automation** であり、本 Phase では実 test code を生成しない。
> production Worker `ubm-hyogo-web-production` 向け route / custom domain inventory script の **test plan / fixtures plan / safety guard** を仕様化し、受け側実装タスク（`UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-IMPL-001`）への handoff baseline として固定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 / 13（テスト作成・test plan 仕様化） |
| 状態 | spec_created（実 test code は受け側 PR で生成） |
| 親 Issue | #246 / 本 Issue | #328 |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |

## test plan カテゴリ一覧

| カテゴリ | 目的 | 想定件数 | 実装スタック |
| --- | --- | --- | --- |
| unit | `cf.sh` wrapper / API allowlist guard / mismatch detector | 6〜8 件 | vitest |
| contract | `RouteInventoryEntry` schema 検証（JSON / Markdown） | 3〜4 件 | vitest + zod |
| safety | secret leak grep / mutation method 呼び出し禁止 / `wrangler` 直叩き禁止 | 2〜3 件 | vitest + grep |

## unit test 仕様（UT-01〜UT-08）

| ID | 目的 | 期待挙動 | モック方針 |
| --- | --- | --- | --- |
| UT-01 | `cf.sh` 経由 wrapper が GET method のみ発行 | GET 以外を拒否 | `vi.spyOn(globalThis, 'fetch')` で method 検証 |
| UT-02 | API allowlist guard が許可外 endpoint を弾く | 許可外 path で throw | allowlist 配列を fixture から注入 |
| UT-03 | 旧 / 新 Worker mismatch detector が差分を返す | 旧 Worker route 件数 > 0 で mismatch object | inventory fixture を 2 種注入 |
| UT-04 | mismatch detector が完全一致時に空配列 | 旧 Worker 件数 = 0 で empty mismatch | 完全一致 fixture |
| UT-05 | `cf.sh` 出力 parse が想定外フォーマットで明示エラー | malformed で throw with diagnostics | 壊れた stub fixture |
| UT-06 | inventory output が JSON / Markdown 両形式で生成 | 両ファイルが期待 path に書かれる | `vi.mock('fs')` で観測 |
| UT-07 | secret 値らしき文字列を出力に含めない | secret pattern マッチで throw | secret pattern fixture 注入 |
| UT-08 | source 種別 (`api` / `dashboard-fallback`) を保持 | 必須・enum 限定 | 両 source の fixture 注入 |

## contract test 仕様（CT-01〜CT-04）

| ID | 目的 | 期待挙動 |
| --- | --- | --- |
| CT-01 | `RouteInventoryEntry` 必須 field が揃う | `pattern` / `targetWorker` / `zone` / `source` が必須 |
| CT-02 | `source` が enum (`api` / `dashboard-fallback`) 限定 | enum 外で fail |
| CT-03 | `outputs/route-inventory.json` が `RouteInventoryEntry[]` | array 型 / 各要素 schema 整合 |
| CT-04 | `outputs/route-inventory.md` の表ヘッダが schema field 名と一致 | 列順・列名固定 |

### `RouteInventoryEntry` schema

| field | 型 | 必須 | 内容 |
| --- | --- | --- | --- |
| `pattern` | string | yes | route pattern または custom domain hostname（host 名は部分 mask 可） |
| `targetWorker` | string | yes | 指す Worker 名 |
| `zone` | string | yes | zone 名または mask 済み zone id |
| `source` | enum (`api` / `dashboard-fallback`) | yes | 取得経路 |
| `notes` | string | no | 補足。JSON / Markdown 共通の任意 field。`mismatches` の理由分類も competing `reason` field を作らずここに記録する |

> 正本 schema は Phase 2 の `InventoryReport`。`mismatches` は `entries.filter(e => e.targetWorker !== expectedWorker)` の派生配列であり、entry に competing `mismatch` field を正本化しない。secret 値・Token 値は **field として定義しない**。

## safety test 仕様（ST-01〜ST-03）

| ID | 目的 | fail 条件 |
| --- | --- | --- |
| ST-01 | output (JSON / Markdown / log) に secret pattern 混入なし | 正規表現 `(?i)(api[_-]?token\|secret\|bearer\s\|authorization:\s\|password\|cf[_-]?api[_-]?key)` にマッチで fail |
| ST-02 | mutation HTTP method が呼ばれない | `POST` / `PUT` / `PATCH` / `DELETE` のいずれかを発行で fail |
| ST-03 | `wrangler` 直叩きがリポジトリに混入しない | `grep -nE 'wrangler\s+(deploy\|secret\|tail\|d1\|kv\|r2\|publish)'` allowlist 外で fail |

## NO-GO ゲート（Phase 3 NG-1〜NG-5 接続）

| NG | 条件 | 連動 test |
| --- | --- | --- |
| NG-1 | mutation endpoint が API call layer に現れる | ST-02 |
| NG-2 | `wrangler` 直接実行が script / runbook に現れる | ST-03 |
| NG-3 | output に secret / Bearer / OAuth prefix が現れる | ST-01 |
| NG-4 | `InventoryReport` 以外の competing schema を正本化 | CT-01〜CT-04 |
| NG-5 | production deploy / DNS / route update / Worker delete を本タスクで実行 | workflow scope（test 外で gate） |

## test fixtures plan

| fixture | 配置先（受け側で実生成） | 内容雛形 | 禁則 |
| --- | --- | --- | --- |
| `route-list-api-response.json` | `<受け側>/test/fixtures/cloudflare/` | `GET /zones/{zone_id}/workers/routes` mock | 実 Token / 実 zone ID 禁止（`<ZONE_ID>` placeholder） |
| `custom-domain-list-api-response.json` | 同上 | `GET /accounts/:id/workers/domains` mock | 同上 |
| `cf-sh-stdout-stub.txt` | 同上 | `bash scripts/cf.sh` stdout stub | Token 値・OAuth 値禁止 |
| `inventory-legacy.json` | 同上 | 旧 Worker route あり想定 | host 名は部分 mask |
| `inventory-current.json` | 同上 | 新 Worker のみ想定 | 同上 |
| `secret-leak-pattern.txt` | 同上 | secret らしき合成サンプル | 実 secret / 実 Token 禁止 |

## セキュリティ共通条件（全カテゴリ適用）

- secret 値・OAuth トークン値・API Token 値を fixture / test 出力 / log / コミット / PR に転記しない
- `.env` の中身を `cat` / `Read` / `grep` で読まない（実値は op 参照のみだが慣性事故防止）
- `wrangler login` でローカル OAuth トークンを保持しない
- 全コマンドは `bash scripts/cf.sh` 経由とし、`wrangler` 直叩きは禁止
- fixture / test 出力をコミット前にレビュー

## 受け側実装タスクへの handoff 入力

- test 実行コマンド: `pnpm --filter <package> test` / `pnpm typecheck` / `pnpm lint`
- 期待 exit code: 全 PASS で 0 / safety guard fail で 非 0
- fixture 経路: 受け側タスクの `test/fixtures/cloudflare/` を正本

## 完了条件

- [x] unit / contract / safety で 12〜15 件の test ID 仕様化
- [x] `RouteInventoryEntry` schema を field / 型 / 必須 / 内容 で表化
- [x] safety guard 3 種の fail 条件を正規表現 / 列挙で明示
- [x] fixtures plan で 6 種の配置先・中身雛形を表化
- [x] セキュリティ共通条件 5 項目を列挙
- [x] handoff 入力 3 件を記述
- [x] 全コマンド例が `bash scripts/cf.sh` 経由で `wrangler` 直叩きゼロ

## 次 Phase への引き渡し

- Phase 5: implementation-template の検証セクションへ wire-in
- Phase 6: safety guard 3 種を review checklist の security セクションに昇格
- Phase 7: AC × test ID トレース表へ流し込み
