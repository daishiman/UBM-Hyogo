# Phase 4: テスト作成（test plan 仕様化）

> **本タスクは docs-only / infrastructure-automation である**。実コード（test 本体・実装本体）は本 PR では生成しない。本 Phase の「テスト作成」は **test plan / test fixtures plan の仕様化** に限定し、実 test 実装は受け側実装タスク（Phase 5 で handoff 先を確定）が担う。
>
> production Worker `ubm-hyogo-web-production` 向け route / custom domain inventory script の **設計仕様書**を作成するタスクであり、本 Phase の成果物は `template_created` 状態で確定する（実 test code は受け側タスクで生成）。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | production Worker route inventory script (UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-001) |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト作成（test plan 仕様化） |
| 作成日 | 2026-05-01 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装テンプレ化 / handoff 設計) |
| 状態 | spec_created |
| タスク分類 | specification-design（test-plan / docs-only） |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| 親タスク | UT-06-FU-A (`docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/`) |
| 親 GitHub Issue | #246 |
| 本タスク GitHub Issue | #328 (CLOSED 状態のまま spec 作成) |

## 目的

route / custom domain inventory script に対して、受け側実装タスクが Phase 5 から実装に着手できるよう、**test plan（unit / contract / safety）と test fixtures plan を仕様化**する。本 Phase では実コードは書かず、以下の3カテゴリの test 仕様を確定する。

- **unit**: `cf.sh` wrapper モック / Cloudflare API 呼び出しの allowlist guard / 旧 Worker と新 Worker の mismatch detector
- **contract**: `RouteInventoryEntry` schema（output JSON / Markdown row の形式）検証
- **safety**: secret 値が出力に混入しないことの grep guard / mutation method（POST/PUT/PATCH/DELETE）が呼ばれないことの allowlist guard

これらは Phase 6 のレビュー観点と Phase 7 AC マトリクスへ wire-in される。

## 実行タスク

1. test plan 3 カテゴリ（unit / contract / safety）を **目的・対象・期待挙動・モック方針** の 4 項目で仕様化する（完了条件: 全カテゴリで 4 項目埋まる）。
2. test fixtures plan（Cloudflare API レスポンス mock JSON / `cf.sh` 出力 stub / 旧 Worker と新 Worker の inventory サンプル）を確定する（完了条件: 各 test に必要な fixture の配置先と中身雛形が表で明示）。
3. `RouteInventoryEntry` schema（contract 対象）の field 一覧と型を確定する（完了条件: 必須 field / optional field / source 種別が表で明示）。
4. safety guard 2 種（secret pattern grep / mutation method allowlist）の検出ルールを確定する（完了条件: 各 guard で fail 条件が正規表現または列挙で明示）。
5. 受け側実装タスクへの handoff 条件（test 実行コマンド / 期待 exit code / fixture 取得経路）を Phase 5 入力として整理する（完了条件: handoff 入力 3 件が箇条書きで列挙）。
6. CLAUDE.md「Cloudflare 系 CLI 実行ルール」に従い、本 test plan で記述するコマンドが全て `bash scripts/cf.sh` 経由であることを再確認する（完了条件: `wrangler` 直叩きが本 Phase 仕様内にゼロ件）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/UT-06-FU-A-route-inventory-script-001.md | スコープ / 含まないもの / リスク表 / 完了条件 |
| 必須 | docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/phase-04.md | 親タスクの TC 設計フォーマット（踏襲元） |
| 必須 | docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-11/route-snapshot.md | 苦戦箇所（dashboard 寄り検証）の出発点 |
| 必須 | CLAUDE.md「Cloudflare 系 CLI 実行ルール」 | `scripts/cf.sh` 経由必須 / `wrangler` 直叩き禁止 |
| 必須 | scripts/cf.sh | wrapper の現行実装（モック設計の参照点） |
| 必須 | apps/web/wrangler.toml | `[env.production].name = "ubm-hyogo-web-production"` 現行設定 |
| 参考 | https://developers.cloudflare.com/api/operations/worker-routes-list-routes | route list API（read-only / GET のみ使用） |
| 参考 | https://developers.cloudflare.com/api/operations/worker-domain-list-domains | custom domain list API（read-only / GET のみ使用） |

## test plan カテゴリ一覧

| カテゴリ | 目的 | 想定 test 件数 | handoff 先での実装スタック |
| --- | --- | --- | --- |
| unit | cf.sh wrapper / API allowlist guard / mismatch detector のロジック検証 | 6〜8 件 | vitest（受け側タスクで決定） |
| contract | `RouteInventoryEntry` schema 検証（JSON / Markdown 出力形式） | 3〜4 件 | vitest + zod（受け側タスクで決定） |
| safety | secret leak grep / mutation method 呼び出し禁止 guard | 2〜3 件 | vitest + grep スクリプト |

### unit test 仕様

| ID | 目的 | 対象 | 期待挙動 | モック方針 |
| --- | --- | --- | --- | --- |
| UT-01 | `cf.sh` 経由で route list API を呼ぶ wrapper が GET メソッドのみ発行する | wrapper invocation 関数 | HTTP method = `GET` 以外を拒否 | `fetch` を vi.spyOn で監視 / 期待 method を assertion |
| UT-02 | API allowlist guard が許可外 endpoint を弾く | endpoint allowlist チェック関数 | 許可外 path で throw / log → fail | allowlist 配列を fixture から注入 |
| UT-03 | 旧 Worker / 新 Worker の inventory mismatch detector が差分を返す | detector 関数 | 旧 Worker の route 件数が 0 でない場合 mismatch object を返す | 旧 / 新 Worker inventory fixture を 2 種注入 |
| UT-04 | mismatch detector が完全一致時に空配列を返す | detector 関数 | 旧 Worker route 件数 = 0 で empty mismatch | 完全一致 fixture を注入 |
| UT-05 | `cf.sh` 出力 parse が想定外フォーマット時に明示エラーを出す | parser 関数 | malformed 出力で throw with diagnostics | 壊れた stub を fixture から注入 |
| UT-06 | inventory output が JSON / Markdown 両形式で生成される | output writer 関数 | JSON と Markdown の両ファイルが期待 path に書かれる | fs を vi.mock で観測 |
| UT-07 | secret 値らしき文字列を含む field を出力しない | output writer 関数 | secret pattern にマッチしたら throw | secret pattern fixture を注入 |
| UT-08 | source 種別（`api` / `dashboard-fallback`）を inventory entry に保持する | entry builder | source field が必須・enum で限定 | 両 source の fixture を注入 |

### contract test 仕様

`RouteInventoryEntry` schema（zod / TypeScript type）を SSOT とし、出力 JSON / Markdown が schema に整合することを検証する。

| ID | 目的 | 対象 | 期待挙動 |
| --- | --- | --- | --- |
| CT-01 | `RouteInventoryEntry` 必須 field が揃う | schema validation | `pattern` / `targetWorker` / `zone` / `source` が必須 |
| CT-02 | `source` が enum (`api` / `dashboard-fallback`) で限定 | schema validation | enum 外で fail |
| CT-03 | JSON 出力 (`outputs/route-inventory.json`) が array of `RouteInventoryEntry` | output validation | 配列型 / 各要素 schema 整合 |
| CT-04 | Markdown 出力 (`outputs/route-inventory.md`) の表ヘッダが schema field 名と一致 | markdown header validation | 列順 / 列名 が固定 |

#### `RouteInventoryEntry` schema（field 一覧）

| field | 型 | 必須 | 内容 |
| --- | --- | --- | --- |
| `pattern` | string | yes | route pattern または custom domain hostname（例: `members.example.org/*`）。host 名は親タスク方針で部分 mask 可 |
| `targetWorker` | string | yes | route / custom domain が指す Worker 名 |
| `zone` | string | yes | zone 名または mask 済み zone id |
| `source` | enum (`api` / `dashboard-fallback`) | yes | 取得経路 |
| `notes` | string | no | 補足。JSON / Markdown 共通の任意 field。`mismatches` の理由分類も competing `reason` field を作らずここに記録する |

> 正本 schema は Phase 2 の `InventoryReport`。`mismatches` は `entries` のうち `targetWorker !== expectedWorker` の派生配列であり、entry ごとに competing `mismatch` field を正本化しない。secret 値・Token 値・OAuth トークン値は **field として定義しない**。

### safety test 仕様

| ID | 目的 | 対象 | fail 条件 |
| --- | --- | --- | --- |
| ST-01 | output（JSON / Markdown / log）に secret pattern が混入しない | output writer + log handler | 正規表現 `(?i)(api[_-]?token|secret|bearer\s|authorization:\s|password|cf[_-]?api[_-]?key)` にマッチで fail |
| ST-02 | mutation HTTP method が呼ばれない | wrapper invocation | `POST` / `PUT` / `PATCH` / `DELETE` のいずれかを発行したら fail |
| ST-03 | `wrangler` 直叩きがリポジトリに混入しない（grep gate） | repo grep | `grep -nE 'wrangler\s+(deploy|secret|tail|d1|kv|r2|publish)'` allowlist 外で fail |

> ST-01 の正規表現は受け側実装タスクで微調整可。ST-03 は本タスクの script 配置 path（後述 Phase 5 で確定）と既存 `scripts/cf.sh` を allowlist に含めた上で repo 全体に適用する。

## test fixtures plan

| fixture | 配置先（受け側タスクで実 fixture 生成） | 内容雛形 | 禁則 |
| --- | --- | --- | --- |
| `route-list-api-response.json` | `<受け側タスク>/test/fixtures/cloudflare/` | Cloudflare API `GET /zones/{zone_id}/workers/routes` の最小 mock。Worker 名 / route pattern のみ | 実 Token / 実 zone ID 値の埋め込み禁止（プレースホルダ `<ZONE_ID>` を使用） |
| `custom-domain-list-api-response.json` | 同上 | `GET /accounts/:id/workers/domains` の mock | 同上 |
| `cf-sh-stdout-stub.txt` | 同上 | `bash scripts/cf.sh` 経由の stdout stub。アカウント名は `<ACCOUNT_NAME>` プレースホルダ | Token 値 / OAuth トークン値の埋め込み禁止 |
| `inventory-legacy.json` | 同上 | 旧 Worker route あり想定の inventory サンプル | 実 host 名は親タスク方針で部分 mask |
| `inventory-current.json` | 同上 | 新 Worker `ubm-hyogo-web-production` のみ想定 inventory サンプル | 同上 |
| `secret-leak-pattern.txt` | 同上 | secret らしき文字列の合成サンプル（テスト用合成値・実値ではない） | 実 secret 値・実 Token 値は絶対に書かない |

> 実 fixture の内容生成は受け側実装タスクが行う。本 Phase ではファイル名・配置先・中身雛形のみ仕様化する。

## セキュリティ共通条件（全 test カテゴリ適用）

- secret 値・OAuth トークン値・API Token 値を **fixture / test 出力 / log / コミット / PR 説明に転記しない**
- `.env` の中身を `cat` / `Read` / `grep` で読まない（実値は op 参照のみだが慣性事故防止）
- `wrangler login` を実行してローカル OAuth トークン (`~/Library/Preferences/.wrangler/config/default.toml`) を保持しない
- 全コマンドは `bash scripts/cf.sh` 経由とし、`wrangler` 直叩きは禁止（test plan 内のコマンド例にも適用）
- fixture / test 出力をコミット前にレビューし、上記値が混入していないことを確認

## 受け側実装タスクへの handoff 入力（Phase 5 で確定）

- test 実行コマンド（受け側で確定）: `pnpm --filter <package> test` 相当 / `pnpm typecheck` / `pnpm lint`
- 期待 exit code: 全 test PASS で 0 / safety guard fail で 非 0
- fixture 取得経路: 受け側タスクの `test/fixtures/cloudflare/` ディレクトリを正本とし、本 Phase で仕様化したファイル名と一致させる

## 実行手順

1. 本ドキュメントを `outputs/phase-04/test-spec.md` に転記する。
2. `outputs/phase-04/test-fixtures-plan.md` に test fixtures plan セクションを切り出して保存する。
3. unit / contract / safety の 3 カテゴリで合計 12〜15 件の test ID が揃っていることを目視確認。
4. `RouteInventoryEntry` schema 表が field 名・型・必須有無で完成していることを確認。
5. `wrangler` 直叩きが本ドキュメント内にゼロ件であることを `grep` で確認。
6. 受け側実装タスクへの handoff 入力 3 件（実行コマンド / exit code / fixture 経路）が記述されていることを確認。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | test plan を `implementation-template.md` の検証セクションに reference / handoff-to-implementation-task.md に取り込み |
| Phase 6 | safety guard 3 種（ST-01〜ST-03）を review checklist の「security」セクションに昇格 |
| Phase 7 | AC × test ID トレース表へ流し込み |
| Phase 11 | NON_VISUAL evidence 形式（test 実行ログのみ）で受け側タスクが evidence を残す前提 |

## 多角的チェック観点

- 価値性: route / custom domain inventory の正確性が unit / contract で検証可能か。
- 実現性: test plan で指定する mock / fixture が `cf.sh` wrapper の現行実装と整合するか。
- 整合性: `RouteInventoryEntry` schema が Phase 5 の output 形式と Phase 6 のレビュー観点に矛盾なく流れるか。
- 運用性: 受け側実装タスクが本 Phase 仕様だけで test を起こせるレベルの粒度か。
- セキュリティ: secret leak grep / mutation method allowlist が test plan に組み込まれているか。
- 境界明確化: docs-only であり、本 Phase で実 test code を書かないことが冒頭で明示されているか。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | unit test 仕様（UT-01〜UT-08） | spec_created |
| 2 | contract test 仕様（CT-01〜CT-04） + `RouteInventoryEntry` schema 表 | spec_created |
| 3 | safety test 仕様（ST-01〜ST-03） | spec_created |
| 4 | test fixtures plan | spec_created |
| 5 | セキュリティ共通条件 | spec_created |
| 6 | 受け側実装タスクへの handoff 入力 | spec_created |

## 成果物

| 種別 | パス | 説明 | 状態 |
| --- | --- | --- | --- |
| ドキュメント | outputs/phase-04/test-spec.md | unit / contract / safety の test plan 本体 | template_created |
| ドキュメント | outputs/phase-04/test-fixtures-plan.md | fixture ファイル名・配置先・中身雛形 | template_created |
| メタ | artifacts.json | Phase 4 状態更新（spec_created） | spec_created |

> 本 Phase は **実 test コードを生成しない**。受け側実装タスクが本仕様を入力として test を実装する。

## 完了条件

- [ ] unit / contract / safety の 3 カテゴリで合計 12〜15 件の test ID が仕様化されている
- [ ] `RouteInventoryEntry` schema の field 一覧（field / 型 / 必須 / 内容）が表で明示
- [ ] safety guard 3 種（secret pattern / mutation method / wrangler 直叩き grep）の fail 条件が正規表現または列挙で明示
- [ ] test fixtures plan で 6 種類の fixture の配置先と中身雛形が表で明示
- [ ] セキュリティ共通条件 5 項目が箇条書きで列挙
- [ ] 受け側実装タスクへの handoff 入力 3 件が記述
- [ ] 全コマンド例が `bash scripts/cf.sh` 経由で `wrangler` 直叩きゼロ
- [ ] 本 Phase が docs-only であり、実 test code を生成しないことが冒頭で宣言

## タスク100%実行確認【必須】

- 実行タスク 6 件が `spec_created`
- 成果物 2 件（test-spec.md / test-fixtures-plan.md）が `outputs/phase-04/` に配置済みかつ `template_created` 状態
- secret 値・Token 値を fixture / test 出力に残さないルールが冒頭で明示
- 本 Phase は **コードを書かない** docs-only タスクであることが冒頭で再宣言

## 次 Phase への引き渡し

- 次 Phase: 5 (実装テンプレ化 / handoff 設計)
- 引き継ぎ事項:
  - test plan 12〜15 件 → Phase 5 implementation-template.md の検証セクションに reference
  - `RouteInventoryEntry` schema → Phase 5 で output 形式（JSON / Markdown）の SSOT として使用
  - safety guard 3 種 → Phase 6 review checklist の「security」セクションに昇格
  - 受け側実装タスクへの handoff 入力 → Phase 5 で handoff-to-implementation-task.md に統合
- ブロック条件:
  - test ID が 12 件未満で Phase 5 に進む
  - `wrangler` 直叩きが test plan 内に残存
  - secret 値が fixture に書かれる経路が残る
  - `RouteInventoryEntry` schema が未確定
