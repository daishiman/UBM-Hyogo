# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | sheets-to-d1-sync-implementation |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-30 |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| scope | apps/api sync layer（manual / scheduled / backfill / audit writer） |
| workflow_state | spec_created |
| 起源 | GitHub Issue #67 / `docs/30-workflows/completed-tasks/U-04-sheets-to-d1-sync-implementation.md` |
| 状態 | pending |

## 目的

Sheets → D1 sync 三系統（manual / scheduled / backfill）と audit writer を `apps/api/src/sync/*` に実装するための受入条件 (AC) と非機能要件を確定する。03 contract task が出した `data-contract.md` / `sync-flow.md` を契約入力として、本タスクの実装が **差分ゼロで充足する** ことを Phase 1 で固定する。

## 実行タスク

1. 03 contract task の `outputs/phase-02/data-contract.md` / `sync-flow.md` を読み込み、本タスクが充足すべき責務を抽出
2. 不変条件 #1〜#7 を sync 文脈に展開して AC に紐付け
3. 機能要件（FR）と非機能要件（NFR）を分類し AC-1〜AC-12 を確定
4. Schema / 共有コード Ownership 宣言を行う（後述 1.X 節）
5. 外部 SaaS（Google Sheets API / Workers Cron）の無料枠 / quota を再確認
6. 4 条件評価（価値性・実現性・整合性・運用性）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-02/data-contract.md` | D1 schema / mapping table 契約 |
| 必須 | `docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-02/sync-flow.md` | manual / scheduled / backfill / recovery / audit |
| 必須 | `docs/00-getting-started-manual/specs/08-free-database.md` | D1 writes 上限 100K/day |
| 必須 | `docs/00-getting-started-manual/specs/01-api-schema.md` | stableKey 31 件 |
| 必須 | `.claude/skills/aiworkflow-requirements/references/architecture-overview-core.md` | apps/api 責務境界 |
| 必須 | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | Cron / D1 binding 運用 |
| 参考 | `CLAUDE.md` | 不変条件 #1〜#7 |
| 参考 | `docs/30-workflows/completed-tasks/U-04-sheets-to-d1-sync-implementation.md` | 出典 |

## 実行手順

### ステップ 0: P50 既実装状態の調査（必須）

```bash
# apps/api/src/sync 配下が既に存在するか確認
ls apps/api/src/sync 2>/dev/null || echo "未実装（想定通り）"
git log --oneline -20 -- apps/api/src/sync 2>/dev/null
grep -rn "sync_audit" apps/api/ 2>/dev/null
grep -rn "scheduled" apps/api/src 2>/dev/null
```

- 既実装が見つかった場合は Phase 1 で実装範囲を再判定する
- 03 contract task の outputs に記載された placeholder 実装と本タスクの新規実装の境界を明示する

### ステップ 1: 契約抽出

- `data-contract.md` から `member_responses` / `member_identities` / `member_status` / `sync_audit` / `form_field_aliases` の writer 責務を抽出
- `sync-flow.md` から manual / scheduled / backfill / recovery の発火条件と冪等性条件を抽出
- 不変条件 #4（admin 列を sync が触らない）を AC として明文化

### ステップ 2: AC 確定

下記 AC-1〜AC-12 を `outputs/phase-01/main.md` に記述する（index.md と一致）。

- AC-1: `apps/api/src/sync/{manual,scheduled,backfill,audit}.ts` 4 ファイル配備
- AC-2: `POST /admin/sync/run` が `requireSyncAdmin` / `SYNC_ADMIN_TOKEN` Bearer 必須で 200 + `{ auditId }` を返す
- AC-3: scheduled handler が Cron Trigger（既定 `0 * * * *`）で起動し全件 upsert sync を実行
- AC-4: backfill が D1 トランザクション内で truncate-and-reload し admin 列に**触らない**
- AC-5: 全経路で `sync_audit` row 作成 → `running` → `success/failed` finalize
- AC-6: 同 responseId 再実行で副作用なし（upsert 冪等）
- AC-7: `sync_job_logs.status='running' + sync_locks` 存在中は新規 sync 拒否（mutex）
- AC-8: data-contract.md mapping に対する contract test pass（差分ゼロ）
- AC-9: 不変条件 #5（apps/web から D1 直接アクセス禁止）に違反しない
- AC-10: Workers 非互換依存（`googleapis` Node SDK 等）を持ち込まない
- AC-11: consent キーは `publicConsent` / `rulesConsent` のみ受理
- AC-12: rate limit 時に exponential backoff（最大 3 回）動作、超過時 `failed` 記録

### ステップ 3: FR/NFR 分類と優先度

| 区分 | 要件 | 優先度 | 関連 AC |
| --- | --- | --- | --- |
| FR | manual sync endpoint | 高 | AC-1, AC-2 |
| FR | scheduled handler | 高 | AC-1, AC-3 |
| FR | backfill flow | 高 | AC-1, AC-4 |
| FR | audit writer 共通基盤 | 高 | AC-5 |
| FR | Sheets fetch + mapping | 高 | AC-8, AC-11 |
| NFR | 冪等性 | 高 | AC-6 |
| NFR | mutex（並行実行制御） | 高 | AC-7 |
| NFR | Workers 互換 | 高 | AC-10 |
| NFR | 失敗時 backoff | 中 | AC-12 |
| NFR | D1 writes 上限内 | 中 | sync-flow.md §2 |
| NFR | observability（audit row） | 中 | AC-5 |
| 制約 | apps/web からの D1 直接禁止 | 高 | AC-9（不変条件 #5） |
| 制約 | admin 列分離 | 高 | AC-4（不変条件 #4） |

### ステップ 4: 4 条件評価

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | sync 実装で contract が稼働状態へ昇格するか | PASS | 03 contract が稼働 sync 経路を初めて獲得 |
| 実現性 | Cloudflare Workers + D1 + Cron で成立するか | PASS | deployment-cloudflare.md と整合 |
| 整合性 | data-contract / sync-flow と差分ゼロにできるか | PASS | contract test を AC-8 に設定 |
| 運用性 | D1 100K writes/day 内で運用できるか | PASS | 1h 周期で writes 上限の 1〜3% 程度（sync-flow.md §2） |

## 統合テスト連携【必須】

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | AC を sync-module-design / audit-writer-design / cron-config に展開 |
| Phase 4 | contract test / unit test / mutex 試験設計の入力 |
| Phase 7 | AC マトリクス源 |
| Phase 11 | manual smoke の入力（NON_VISUAL evidence） |
| 下流 05b | smoke readiness の前提が AC-1〜AC-5 で確定 |
| 下流 09b | Cron 監視 / runbook 化の前提が AC-3 で確定 |

| 判定項目 | 基準 | 結果 |
| --- | --- | --- |
| ユニットテストLine | 80%+ | TBD（Phase 4 で確定） |
| ユニットテストBranch | 60%+ | TBD |
| ユニットテストFunction | 80%+ | TBD |
| 結合テストAPI（manual / scheduled / backfill） | 100% | TBD |
| 結合テストシナリオ正常系 | 100% | TBD |
| 結合テストシナリオ異常系（rate limit / mutex / consent unknown 等） | 80%+ | TBD |

## 多角的チェック観点

| # | 不変条件 | 確認内容 | 反映場所 |
| --- | --- | --- | --- |
| #1 | schema コード固定回避 | mapping は `form_field_aliases` 駆動 | AC-8 / Phase 2 |
| #2 | consent キー統一 | `publicConsent` / `rulesConsent` のみ受理 | AC-11 |
| #3 | responseEmail = system field | mapping table §3.1 に従う | Phase 2 mapping.ts |
| #4 | admin 列分離 | backfill が admin 列に触れない | AC-4 |
| #5 | apps/web から D1 直接禁止 | sync は apps/api 内のみ | AC-9 |
| #6 | GAS prototype 不昇格 | fetch ベース実装、Node SDK 不使用 | AC-10 |
| #7 | Sheets を真として backfill | failure recovery 設計 | AC-4 / AC-12 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 契約抽出（data-contract / sync-flow） | 1 | pending | 03 contract task の outputs |
| 2 | AC-1〜AC-12 確定 | 1 | pending | index.md と一致 |
| 3 | FR/NFR 分類 | 1 | pending | 優先度付き |
| 4 | Ownership 宣言 | 1 | pending | 1.X 節 |
| 5 | 無料枠調査 | 1 | pending | Sheets API quota / D1 writes |
| 6 | 4 条件評価 | 1 | pending | PASS 4 件 |

## 1.X Schema / 共有コード Ownership 宣言

本タスクは serial wave のため共有 schema 競合は限定的だが、以下の境界を明文化する。

| 項目 | 内容 |
| --- | --- |
| 編集する schema / 共通コード | `apps/api/src/sync/*`（新規）、`apps/api/wrangler.toml` の `[triggers] crons`、`sync_audit` への書き込みコード（schema 定義は U-05 owner） |
| 本タスクが ownership を持つか | yes（sync writer 全責務 / Cron Trigger 設定 / audit writer） |
| 他 wave への影響 | U-05 producer（schema 提供）、U-04 consumer。05b smoke readiness は consumer。09b は Cron 監視の co-owner |
| 競合リスク | `wrangler.toml` triggers セクションを 09b が監視設定で同時編集する可能性 → 09b は監視 / observability のみ追加し triggers 定義は U-04 owner で固定 |
| migration 番号 / exports 改名の予約 | D1 migration は U-05 owner のため本タスクで予約しない。`apps/api/src/sync/index.ts` を新規 export hub として予約 |

## 1.X 外部 SaaS 無料枠仕様調査

| 項目 | 値 | 出典 / 再確認タイミング |
| --- | --- | --- |
| Google Sheets API quota | 60 read req/min/user, 300/min/project（既定） | Sheets API v4 公式。Wave 1 着手直前に再確認 |
| Cloudflare Workers Cron Trigger | 無料枠 5 cron/account、CPU time 10ms/invocation（free） | deployment-cloudflare.md。Wave 1 着手直前に再確認 |
| D1 writes | 100,000 writes/day（無料枠） | specs/08-free-database.md |
| D1 reads | 5,000,000 reads/day（無料枠） | specs/08-free-database.md |
| 推定消費（50 名 MVP） | 1 sync につき writes 数件〜数十件、24 sync/day = 数百〜数千 writes/day（上限の 1〜3%） | sync-flow.md §2 |
| upgrade path | Workers Paid（$5/month）で CPU time 50ms 拡張 / D1 Paid で writes 制限緩和 | deployment-cloudflare.md |

不確定な値は Phase 5 実装直前に再確認する旨を IMPL タスクの「実装前ゲート」に転記する。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | Phase 1 主成果物（AC / FR/NFR / Ownership / 4 条件） |
| メタ | artifacts.json | phase 1 status |

## 完了条件

- [ ] AC-1〜AC-12 が記述されている
- [ ] FR/NFR 分類と優先度が表化されている
- [ ] Schema / 共有コード Ownership 宣言が完了している
- [ ] 外部 SaaS 無料枠の確認結果が記載されている
- [ ] 4 条件評価が PASS（4 件）
- [ ] 不変条件 #1〜#7 への対応が AC に紐付いている
- [ ] artifacts.json の `metadata.taskType=implementation` / `visualEvidence=NON_VISUAL` / `workflow_state=spec_created` が確定
- [ ] **本Phase内の全タスクを100%実行完了**

## タスク100%実行確認【必須】

- 全 6 サブタスクが completed
- outputs/phase-01/main.md 配置
- 全完了条件にチェック
- 不変条件 #1〜#7 への対応が明記
- 次 Phase へ「Server / Client 境界」相当の論点（manual handler の Hono ルート vs scheduled handler の Workers default export 境界）を引き継ぎ
- artifacts.json の phase 1 を completed に更新

## 次 Phase

- 次: 2 (設計)
- 引き継ぎ事項:
  - manual / scheduled / backfill 各 handler の責務分離
  - audit writer の共通基盤化（前後フック）
  - mutex 実装方式（DB 排他 vs Worker レベル）
  - mapping.ts と `form_field_aliases` テーブルの結合方式
- ブロック条件: AC が未確定 / Ownership 宣言未済 / 03 contract outputs を読み込んでいない場合は進まない（Phase 2 / Phase 3 でも重複 gate として明記）

## 真の論点

- `sync_audit` の mutex 実装を「DB レベル（`status='running'` 存在チェック）」と「Workers レベル（KV / Durable Object）」のどちらにするか → Phase 2 / 3 で alternative 比較
- UT-01 の `sync_log` 論理設計と既存 `sync_job_logs` / `sync_locks` 実装に寄せるか、03 contract の `sync_audit` を U-05 migration で新設するか → Phase 2 の ledger compatibility decision で固定
- backfill の truncate-and-reload を D1 トランザクション 1 本で完結させられるか（D1 の `BEGIN TRANSACTION` の制約確認）
- Sheets API の認証を Service Account JWT で行う際、Workers 上で JWT 署名（`crypto.subtle`）が動作するか
- scheduled handler の差分検出キーを `submittedAt > last_success.finished_at` にした場合、Sheets 側の更新（再回答）を取りこぼさないか

## 依存境界

| 種別 | 境界 | 担当 | 越境禁止 |
| --- | --- | --- | --- |
| 上流 | D1 schema / migration | U-05 | schema を本タスクで変更しない |
| 上流 | secrets 配置 | 04-serial-cicd-secrets-and-environment-sync | 本番 secrets を本タスクの outputs に書かない |
| 上流 | 03 contract（data-contract / sync-flow） | completed-tasks/03 | 契約を改変しない |
| 同層 | apps/api 既存 endpoint（admin / public） | 既存タスク | sync handler の新規 mount のみ |
| 下流 | 05b smoke readiness | 05b | 本タスク完了後に smoke 開始 |
| 下流 | 09b cron monitoring | 09b | triggers 定義は本タスク owner |

## 価値とコスト

| 軸 | 内容 |
| --- | --- |
| 価値 | contract と実装の差分ゼロ稼働 sync 経路を初めて手に入れる |
| コスト | apps/api 4 ファイル + Cron Trigger + secret 1 種 + テスト一式 |
| 払わないコスト | D1 migration（U-05）、observability metrics 本番化（09b / U-02） |

## 4 条件評価

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | 03 contract task が docs-only で閉じた sync flow を稼働させられるか | PASS | manual / scheduled / backfill 三系統と audit writer を実装 |
| 実現性 | Cloudflare Workers + Hono + D1 + Cron + Sheets API で成立するか | PASS | deployment-cloudflare.md と整合、Workers 互換 fetch 実装で SaaS 連携可 |
| 整合性 | data-contract.md / sync-flow.md と差分ゼロにできるか | PASS | contract test を AC-8 で固定、不変条件 #1〜#7 を AC に紐付け |
| 運用性 | D1 writes 100K/day 上限内で運用できるか | PASS | 1h 周期 24 回 × 数十件 = 数百〜数千 writes/day（上限 1〜3%） |
