# Phase 7: AC マトリクス — 06a-A-public-web-real-workers-d1-smoke-execution

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06a-A-public-web-real-workers-d1-smoke-execution |
| phase | 7 / 13 |
| wave | 6a-fu |
| mode | parallel |
| 作成日 | 2026-05-02 |
| taskType | implementation-spec / docs-only |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

index.md の 4 AC を **route × evidence × Pass 条件** で完全 trace する。Phase 4 の curl matrix（5 case × 2 env）と Phase 6 の異常系（Case A〜I）を AC 列に再編し、Phase 11 手動 smoke の合否判定を固定する。

## index.md AC（再掲）

| ID | 内容 |
| --- | --- |
| AC-1 | local real Workers/D1 smoke の curl log が保存されている |
| AC-2 | staging real Workers/D1 smoke の curl log が保存されている |
| AC-3 | 少なくとも公開 4 route family の screenshot または HTML evidence が保存されている |
| AC-4 | mock API ではなく `apps/web → apps/api → D1` 経路であることが evidence に明記されている |

## マスター AC × route マトリクス

evidence path は `outputs/phase-11/evidence/` および `outputs/phase-11/evidence/` 配下に統一。

### AC-1: local real Workers/D1 smoke curl log

| route | verify 手段 | 期待 status | evidence | Pass 条件 | 失敗時戻し先 |
| --- | --- | --- | --- | --- | --- |
| `/` | `curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8788/` | 200 | `outputs/phase-11/evidence/local-curl.log`（行: `# /` + `HTTP 200`） | log 中に `# /` セクションがあり HTTP 200 | Phase 5 STEP 2 / Phase 6 Case A |
| `/members` | `curl ... http://127.0.0.1:8788/members` | 200 | 同 log（行: `# /members`） | HTTP 200 + body に seed member 由来の文字列が含まれる | Phase 6 Case B/C/I |
| `/members/{seed-id}` | `curl ... http://127.0.0.1:8788/members/${SEED_ID}` | 200 | 同 log（行: `# /members/<id>`） | HTTP 200 + 該当 ID の表示 | Phase 6 Case B/C |
| `/members/UNKNOWN` | `curl ... http://127.0.0.1:8788/members/UNKNOWN` | 404 | 同 log | HTTP 404（or apps/web の not-found 200 + "見つかりません"） | Phase 5 STEP 3 |
| `/register` | `curl ... http://127.0.0.1:8788/register` | 200 | 同 log | HTTP 200 + Google Form 導線文字列 | Phase 5 STEP 3 |
| 不変条件 #5 | `rg -n "D1Database\|env\\.DB" apps/web/app apps/web/src` | 0 件 | 同 log 末尾の `# invariant #5 trace` セクション | rg 出力 0 件 | Phase 2 設計に戻す |

### AC-2: staging real Workers/D1 smoke curl log

| route | verify 手段 | 期待 status | evidence | Pass 条件 | 失敗時戻し先 |
| --- | --- | --- | --- | --- | --- |
| `/` | `curl ... https://ubm-hyogo-web-staging.daishimanju.workers.dev/` | 200 | `outputs/phase-11/evidence/staging-curl.log` | HTTP 200 | Phase 6 Case D/E |
| `/members` | `curl ... .../members` | 200 | 同 log | HTTP 200 + body に seed 由来文字列 | Phase 6 Case B/C/D/G/I |
| `/members/{seed-id}` | `curl ... .../members/${SEED_ID}` | 200 | 同 log | HTTP 200 | Phase 6 Case B/C/D |
| `/members/UNKNOWN` | `curl ... .../members/UNKNOWN` | 404 | 同 log | HTTP 404 | Phase 5 STEP 7 |
| `/register` | `curl ... .../register` | 200 | 同 log | HTTP 200 | Phase 5 STEP 7 |
| `PUBLIC_API_BASE_URL` 整合 | `grep -A2 'env.staging.vars' apps/web/wrangler.toml` | staging API URL | log 冒頭コメント行 | localhost を含まない / staging API host を指す | Phase 6 Case D |
| CORS preflight | `curl -X OPTIONS -H "Origin: ..."` to api | 204/200 | 同 log（補助） | preflight 成功 | Phase 6 Case F（scope out 注意） |

### AC-3: 4 route family の screenshot / HTML evidence

| route | env | evidence | Pass 条件 |
| --- | --- | --- | --- |
| `/` | local | `outputs/phase-11/evidence/local-root.png` | landing が描画されている |
| `/members` | local | `outputs/phase-11/evidence/local-members.png` | seed member が 1 件以上カード表示 |
| `/members/{id}` | local | `outputs/phase-11/evidence/local-members-detail.png` | 詳細ページが seed の値で描画 |
| `/register` | local | `outputs/phase-11/evidence/local-register.png` | フォーム導線が表示 |
| `/members` | staging | `outputs/phase-11/evidence/staging-members.png` | **必須**: staging で seed 描画 |
| `/`, `/members/{id}`, `/register` | staging | `outputs/phase-11/evidence/staging-{root,members-detail,register}.png` | 任意（補助） |

> screenshot が取得困難な場合、`curl -s ${BASE}${ROUTE} > outputs/phase-11/evidence/<env>-<route>.html` の HTML evidence で代替可。本マトリクスでは PNG を主とし HTML を fallback とする。

### AC-4: real `apps/web → apps/api → D1` 経路の明記

| 観点 | verify 手段 | evidence | Pass 条件 |
| --- | --- | --- | --- |
| apps/web → apps/api 経路 | curl `-v` で Network 確認 / `apps/web/wrangler.toml` の `[[env.staging.services]] binding = "API_SERVICE"` 存在 | `staging-curl.log` 冒頭コメント | log に `apps/web → apps/api → D1` の記述あり |
| apps/api → D1 経路 | `apps/api/wrangler.toml` の `[[env.staging.d1_databases]] binding = "DB"` 存在 | log 冒頭コメント | binding 名 `DB` を明記（database_id は redact） |
| seed 件数 ≥ 1 | `curl -s ${API_BASE}/public/members \| jq '.items \| length'` | log の `# api seed count: N` 行 | N ≥ 1 |
| 不変条件 #5 | rg trace（AC-1 末尾と同一証跡） | `local-curl.log` 末尾 | 0 件 |
| mock fallback 排除 | response body が固定 mock 文字列を含まないこと | log の body 抜粋 | mock 識別子（例: `MOCK_MEMBER`）が無い |

## evidence path 一覧（Pass 判定の正本）

| ファイル | 必須/任意 | 内容 |
| --- | --- | --- |
| `outputs/phase-11/evidence/local-curl.log` | 必須 | local 5 case + 不変条件 #6 trace |
| `outputs/phase-11/evidence/staging-curl.log` | 必須 | staging 5 case + vars 整合 + 経路注記 |
| `outputs/phase-11/evidence/local-root.png` | 必須 | local landing |
| `outputs/phase-11/evidence/local-members.png` | 必須 | local 一覧（seed 表示） |
| `outputs/phase-11/evidence/local-members-detail.png` | 必須 | local 詳細 |
| `outputs/phase-11/evidence/local-register.png` | 必須 | local 登録導線 |
| `outputs/phase-11/evidence/staging-members.png` | 必須 | staging 一覧（real D1 経路の VISUAL 証跡） |
| `outputs/phase-11/evidence/staging-root.png` | 任意 | staging landing |
| `outputs/phase-11/evidence/staging-members-detail.png` | 任意 | staging 詳細 |
| `outputs/phase-11/evidence/staging-register.png` | 任意 | staging 登録導線 |

## 不変条件 trace サマリ

| 不変条件 | 主担当 AC | verify 手段 |
| --- | --- | --- |
| #6 D1 直接アクセス禁止 | AC-1 / AC-4 | `rg -n "D1Database\|env\\.DB" apps/web` 0 件 |
| #6 apps/web → apps/api 経由 | AC-4 | `apps/web/wrangler.toml` の `services binding` + curl Network 確認 |
| #8 GAS prototype 非昇格 | （間接） | smoke 対象に GAS endpoint を含めないことで自動担保 |
| #14 Cloudflare free-tier | （間接） | local persist / deploy 回数を抑える運用 |

## 失敗時の戻し先（横断）

| 失敗 AC / 観点 | 戻し先 | 理由 |
| --- | --- | --- |
| AC-1 全般 | Phase 5 STEP 1〜5 / Phase 6 Case A | local 起動経路の再点検 |
| AC-1 `/members` 空 | Phase 6 Case I | seed 件数確認 |
| AC-2 全般 | Phase 5 STEP 6〜8 / Phase 6 Case D/E/G | staging 経路の再点検 |
| AC-2 CORS | Phase 6 Case F | コード変更を伴うため別 PR へエスカレーション |
| AC-3 screenshot 不足 | Phase 11 手動 smoke | ブラウザ操作の手戻り |
| AC-4 経路明記不足 | Phase 12 ドキュメント | log 冒頭コメントを追記 |
| 不変条件 #5 | Phase 2 設計 | 3 層分離の境界違反は実装に踏み込む（本タスク scope out 注意） |

## 運用ルール

1. すべての AC は単独で観測可能（複合 AC を作らない）
2. evidence ファイル名は本マトリクスで完全固定（Phase 8 DRY 化と整合）
3. secret hygiene: API token / D1 database_id / OAuth token を log / 本マトリクス / phase-NN.md 本文に記載しない
4. localhost fallback 検知: AC-2 では `staging-curl.log` を `grep -v 'localhost'` で除外確認
5. mock fallback 検知: AC-4 では body 中に mock 識別子が含まれないことを目視 + grep 双方で確認
6. coverage は本タスクの Pass 条件に含めない（VISUAL_ON_EXECUTION の方針）

## 多角的チェック観点

- #5 public/member/admin boundary（AC-1 / AC-4）
- #6 apps/web から D1 直接アクセス禁止（AC-4）
- #8 GAS prototype を正本にしない
- #14 Cloudflare free-tier
- 未実装/未実測を PASS と扱わない
- placeholder と実測 evidence を分離

## サブタスク管理

- [ ] AC-1〜4 すべてに route × verify × evidence × Pass 条件 × 戻し先が揃う
- [ ] evidence path が `outputs/phase-11/evidence/` と `outputs/phase-11/evidence/` に集約
- [ ] 不変条件 #5 #6 trace が AC-4 に明記
- [ ] secret hygiene の文言が本マトリクスに含まれる
- [ ] outputs/phase-07/main.md を作成

## 参照資料

- `index.md`
- `artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- `outputs/phase-07/main.md`
- `outputs/phase-07/ac-matrix.md`（任意：詳細表）

## 実行タスク

この Phase の実行タスクは本文中のタスク表、検証手順、またはチェックリストに記載済み。

## 統合テスト連携

この workflow は実行仕様作成 wave のため、新規テストコードは追加しない。Phase 11 実行時に curl / screenshot / D1 evidence を保存する。

## 完了条件

- [ ] AC-1〜4 すべてが route × evidence × Pass 条件のテーブル化されている
- [ ] evidence ファイル名が固定済み
- [ ] 失敗時の戻し先が Phase 5 / Phase 6 の Case と対応
- [ ] secret / token / database_id 実値が本ファイルに含まれない
- [ ] mock API ではなく real apps/web → apps/api → D1 経路を明記する手段が AC-4 に定義済み

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] follow-up gate の仕様であり既存タスクの復活でない
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 8 DRY 化へ、evidence ファイル 7+ 種の命名規則と curl matrix の重複排除観点を渡す。Phase 11 手動 smoke 実施者は本マトリクスの verify 列を上から順に実行することで AC-1〜4 を 1 パスでカバーできる。
