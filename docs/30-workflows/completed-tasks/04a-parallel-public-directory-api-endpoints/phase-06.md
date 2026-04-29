# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 04a-parallel-public-directory-api-endpoints |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| Wave | 4 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 5（実装ランブック） |
| 次 Phase | 7（AC マトリクス） |
| 状態 | pending |

## 目的

公開 endpoint 4 本における 404 / 422 / 5xx / 不正 query / sync 失敗 / 大量 query / 圧縮失敗 / cache poisoning / leak リグレッション を網羅し、正常系では出ないが本番で起こりうる経路を test に落とし込む。leak ゼロ（不変条件 #2 / #3 / #11）と未認証 200（AC-9）が異常系でも壊れないことを確認する。

## Failure cases

| # | シナリオ | 期待挙動 | 関連不変条件 / AC | 検出手段 |
| --- | --- | --- | --- | --- |
| F-1 | `/public/members/:memberId` で `publicConsent != 'consented'` の memberId を直接叩く | 404 + `{ code: 'NOT_FOUND' }`、本文に member 情報を一切含まない | #2 / #11 / AC-4 | leak test |
| F-2 | `/public/members/:memberId` で `publishState = 'private'` の memberId を直接叩く | 404 + `{ code: 'NOT_FOUND' }` | #11 / AC-4 | leak test |
| F-3 | `/public/members/:memberId` で `is_deleted = 1` の memberId を直接叩く | 404 + `{ code: 'NOT_FOUND' }` | #11 / AC-4 | leak test |
| F-4 | `/public/members/:memberId` で存在しない memberId | 404 + `{ code: 'NOT_FOUND' }`（不適格と区別不能、存在示唆ゼロ） | #11 / AC-4 | contract test |
| F-5 | `/public/members?zone=invalid` 等の不正値 | 200 + zone は default `'all'` に fallback、422 を返さない | AC-6 | unit test (search-query-parser) |
| F-6 | `/public/members?sort=__proto__` 等の prototype pollution 風文字列 | 200 + sort は default `'recent'`、何も評価しない | AC-6 | unit test |
| F-7 | `/public/members?limit=10000` 等の大量取得 | 200 + limit clamp 100、400 を返さない | AC-11 | unit test (pagination) |
| F-8 | `/public/members?tag=ai&tag=dx&tag=ai` で重複 tag | 200 + 内部で distinct 化、AND 集約は実 tag 数で評価 | AC-5 | integration test |
| F-9 | `/public/members?q=' OR 1=1 --` 等の SQL injection 風 | 200 + prepared statement で安全、件数が膨らまない | - | injection test (search query) |
| F-10 | `/public/members?q=` に 1000 文字超 | 200 + 200 文字で truncate（log noise 防止） | - | unit test |
| F-11 | `current_response_id` が null の適格 member | `/public/members/:memberId` は 404（response が無いと公開不可） | #1 / #11 | integration test |
| F-12 | `schema_versions` が未投入（schema sync 未実施） | `/public/form-preview` は 503 + `UBM-5500` で schema sync 未完了を明示する | #1 / #14 | integration test |
| F-13 | `sync_jobs` が 0 行 | `/public/stats.lastSync = 'never'` で返す（500 にしない） | AC-7 | unit test (to-public-stats) |
| F-14 | `sync_jobs` の最新が `failed` | `/public/stats.lastSync = 'failed'` を返す | AC-7 | unit test |
| F-15 | `sync_jobs` の最新が 5 分以内に `running` | `/public/stats.lastSync = 'running'` を返す | AC-7 | unit test |
| F-16 | view converter で leak key（`adminNotes` 等）が混入 | zod parse で fail → 500 + `{ code: 'INTERNAL' }`（漏らすより落とす、fail close） | #11 | contract test |
| F-17 | D1 が 5xx を返す（一時的障害） | 502 (Bad Gateway) ではなく 503 (Service Unavailable) を返す | - | integration test |
| F-18 | `/public/members` で 1 page あたり member が 0 件 | 200 + `items: []`、`total: 0`、404 にしない | - | contract test |
| F-19 | `/public/members/:memberId` の field 行が 0 件（同期遅延） | 200 + `sections: []`、404 にしない | #1 | integration test |
| F-20 | `/public/form-preview` の `responderUrl` が env 不在 | `01-api-schema.md` の固定値にフォールバック、500 にしない | #14 | unit test |
| F-21 | レスポンス本文が 1MB 超 | gzip / brotli 圧縮（Cloudflare Workers 標準）で配信、handler 側で何もしない | AC-12 | manual smoke |
| F-22 | OPTIONS preflight が来た | CORS 適切応答（origin 任意、credentials 不要、methods=GET） | AC-9 | integration test |

## 公開境界の堅牢化

- 認証 cookie 有無に関わらず response が同一（cookie に依存して branch しない）
- `/public/*` 配下の handler に Auth.js session middleware を適用しない
- 認証 endpoint の機能（編集 / 削除 / 申請）が `/public/*` に紛れていないか route 一覧を Phase 7 で再点検

## SQL injection / leak リグレッション

- F-9 の通り query は prepared statement、文字列結合禁止
- F-16 のように converter での leak は zod parse で fail close（漏らすより 500）
- 検索対象列を `fullName / nickname / occupation / location / businessOverview / skills / canProvide / selfIntroduction / tags` に限定（不変条件 #3：`responseEmail` を検索しない、AC-10）

## 実行タスク

- [ ] この Phase の成果物を作成する
- [ ] 参照資料、成果物、完了条件の整合を確認する
- [ ] artifacts.json の対象 Phase 状態更新条件を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-04/test-matrix.md | leak / search 検証戦略 |
| 必須 | outputs/phase-05/api-runbook.md | 各 step の前提 |
| 必須 | docs/00-getting-started-manual/specs/12-search-tags.md | query 仕様 |
| 必須 | docs/00-getting-started-manual/specs/03-data-fetching.md | endpoint 公開フィルタ |
| 参考 | docs/00-getting-started-manual/specs/08-free-database.md | sync_jobs / schema_questions |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | F-1〜F-22 を AC matrix に紐付け |
| Phase 8 | 共通エラーハンドラ / fallback 戦略を DRY 化候補に追加 |
| 08a | 本タスクの failure case を contract / leak test として取り込み |

## 多角的チェック観点（不変条件マッピング）

- #1（schema 固定禁止）— F-11 / F-12 / F-19 で 0 件 / 同期遅延に耐える
- #2（consent キー）— F-1 で `publicConsent != 'consented'` を 404 で隠す
- #3（`responseEmail` system field）— F-9 / F-10 で検索対象に含めない、F-16 で leak を fail close
- #5（apps/web → D1 直禁止）— 構造的に保証（本タスクは apps/api 内）
- #10（無料枠）— F-7 で limit clamp、無制限取得を防ぐ
- #11（admin-managed 分離）— F-1〜F-4 で 403 ではなく 404、F-16 で `adminNotes` leak fail close
- #14（schema 集約）— F-12 / F-20 で schema 不在 / responderUrl 不在に耐える

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | F-1〜F-22 列挙 | 6 | pending | outputs/phase-06/failure-cases.md |
| 2 | 公開境界の堅牢化方針 | 6 | pending | main.md |
| 3 | injection / leak リグレッション方針 | 6 | pending | main.md |
| 4 | test 化方針 | 6 | pending | Phase 7 へ引き継ぎ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | Phase 6 主成果物 |
| ドキュメント | outputs/phase-06/failure-cases.md | F-1〜F-22 詳細 |
| メタ | artifacts.json | Phase 6 を `completed` に更新 |

## 完了条件

- [ ] failure case 22 件以上を列挙
- [ ] 各 case に期待挙動 / 関連不変条件 or AC / 検出手段を記述
- [ ] leak リグレッション（F-16）と SQL injection（F-9）の方針が明文化
- [ ] 公開境界の堅牢化（cookie 非依存 / OPTIONS 対応）が明文化

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 全成果物配置済み
- [ ] 404 / 422（実際は fallback）/ 5xx / 不正 query / 同期遅延 / leak / injection の 7 カテゴリすべてに 1 件以上の failure case
- [ ] artifacts.json の Phase 6 を `completed` に更新

## 次 Phase

- 次: 7（AC マトリクス）
- 引き継ぎ事項: F-X を AC × verify suite × runbook step に展開
- ブロック条件: leak ケース（F-1〜F-4 / F-16）のいずれかが未網羅なら次 Phase に進まない
