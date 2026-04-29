# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Sheets→D1 sync endpoint 実装と audit logging (UT-21) |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-29 |
| Wave | 1 |
| 実行種別 | parallel（UT-09 と並列、03-serial マージ後に独立着手可能） |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | spec_created |
| タスク分類 | application_implementation（apps/api/src/sync 配下に endpoint + middleware + audit writer 実装。docs-only ではない） |

## 目的

03-serial-data-source-and-storage-contract で確定した Sheets→D1 sync 契約を `apps/api/src/sync/*` に実コード化する際の「真の論点」を確定させ、SYNC_ADMIN_TOKEN Bearer による API 認可境界・SHA-256 ベース冪等キー・audit best-effort + outbox の三位一体を担保する具体的境界・前提・受入条件を docs として固定する。設計フェーズ (Phase 2) が actual file structure (types.ts / sheets-client.ts / mapper.ts / worker.ts / index.ts) を base に一意の middleware 配線・冪等キー仕様・outbox 設計を決められる入力を作る。

## 真の論点 (true issue)

- 「sync endpoint を実装する」ことではなく、「03-serial の sync 契約 (docs-only) と既に書かれた実装 (code) の境界を解消し、**認可・冪等性・audit best-effort の三位一体**を `apps/api/src/sync/*` に閉じて担保する」ことが本タスクの本質。
- 副次的論点：
  - **認可**: 現状 `/admin/sync` と `/admin/sync/responses` は no-auth。Auth.js セッション + admin role + CSRF を Hono middleware で `app.use('/admin/sync*', adminAuth)` 形に一括適用し、ルートごとの付け忘れを構造的に排除する。
  - **冪等性**: `mapper.ts` の `generateResponseId` で SHA-256 ベースの冪等キーを生成し、D1 upsert の unique key として固定する。同一 Sheets 行を 2 回同期しても duplicate を作らない。
  - **audit best-effort + outbox**: sync 本体成功 / audit 失敗時にロールバックせず別 outbox に蓄積する。03-serial data-contract.md 方針に厳密従い、勝手にトランザクション化しない。
- 03-serial（contract-only / docs-only）と本タスク（code）の境界を「契約を更新したいときは 03-serial を直接編集してから実装を追従」のフロー固定で解消する。コードコメントに sync-flow.md を転記しない（不変条件 #1 と同趣旨）。

## 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流 | 03-serial-data-source-and-storage-contract | sync-flow.md / data-contract.md / runbook.md（audit best-effort + outbox 方針含む） | 本タスクは契約を再設計しない |
| 上流 | UT-03（Sheets API 認証） | Service Account JSON 認証フロー、SA 名 `ubm-hyogo-sheets-reader@ubm-hyogo.iam.gserviceaccount.com` | `sheets-client.ts` の RS256 JWT 署名で再利用 |
| 上流 | UT-04 / UT-22（D1 schema・migration） | upsert 対象テーブル + audit テーブル + outbox テーブルの D1 適用済み | upsert / audit / outbox writer を確定 |
| 上流 | 02-serial-monorepo-runtime-foundation | Hono ルーティング、`apps/api` ランタイム | `app.use('/admin/sync*', adminAuth)` の middleware 配線基盤 |
| 並列 | UT-09（Cron 同期ジョブ） | scheduled handler 設計と Cron Trigger 設計 | `/admin/sync` と scheduled handler が同一 `runSync` を呼ぶ API 契約 |
| 下流 | UT-07（通知基盤） | sync 失敗イベントの hook ポイント | audit log / outbox row が通知トリガ源 |
| 下流 | UT-08（モニタリング） | sync メトリクスの計測対象 | audit log の構造化フィールドを提供 |
| 下流 | 05a-observability-and-cost-guardrails | constants 最終チューニング (U-03) と metrics 詳細 (U-02) | `runSync` の structured log 形式を提供 |
| 下流 | 05b-smoke-readiness-and-handoff | smoke シナリオで本実装を行使 | manual endpoint + Cron 実行ログ |

## 価値とコスト

- 価値: 03-serial の docs-only 契約を実コード化することで、Sheets を正本とした admin-managed data 同期が runtime で機能し、admin が manual トリガで再同期 / backfill / audit 閲覧できる。U-04（未実装検出）が解消される。
- コスト: Cloudflare Workers の Cron + manual invocation で月数百〜千 invocation。D1 write は 1 sync ≤ 100 件 × 月数十 = 月数千 write。audit + outbox 追加で write 量は 2x 程度。Sheets API は 300 req/min/project の下で十分余裕。すべて無料枠内。
- 機会コスト: contract-only に留めた場合 runtime で 1 件も同期されないため、05b smoke が走らず handoff が止まる。本タスク完了が必須経路。

## 4条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | U-04（contract と code の境界）を解消し、Sheets 正本主義が runtime で機能する |
| 実現性 | PASS | 03-serial で基本実装済み（types/sheets-client/mapper/worker/index）。残作業は SYNC_ADMIN_TOKEN Bearer middleware 配線・Vitest・Cron env 分離の 3 点で技術範囲内 |
| 整合性 | PASS | 不変条件 #1（schema を mapper.ts に閉じる）/ #4（admin-managed data 専用テーブル）/ #5（D1 アクセスは apps/api 内）を全て満たす |
| 運用性 | PASS | audit best-effort + outbox により監査性と可用性が両立。manual endpoint で再実行可能。1Password 参照で secrets が安全に注入される |

## 既存コード命名規則の確認

Phase 2 設計の前に、03-serial で先行実装された `apps/api/src/sync/*` の既存規約を確認すること。

| 観点 | 確認対象 | 期待される規則 |
| --- | --- | --- |
| sync module 命名 | `apps/api/src/sync/*.ts` | actual file は types.ts / sheets-client.ts / mapper.ts / worker.ts の flat 構造（spec 案の core/manual/scheduled/audit 分離ではない） |
| Hono ルート命名 | `apps/api/src/index.ts` | `POST /admin/sync` / `POST /admin/sync/responses` / `GET /admin/sync/audit` の 3 本がルート登録済み。`/admin/sync*` 一括 middleware 適用が前提 |
| 環境変数 | `apps/api/wrangler.toml` の `[env.development]` / `[env.production]` | env-scoped Cron schedule、Secret は `wrangler secret put --env <name>` 経由 |
| Logger | `apps/api/src/lib/logger.ts`（あれば） | structured log で audit_id / sync_id / outcome を必ず含む |
| 型定義 | `apps/api/src/sync/types.ts` | exactOptionalPropertyTypes=true 下で `field: string \| undefined` 明示。`field?: string` 禁止 |

## 実行タスク

1. unassigned-task `UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md` の苦戦箇所 8 件（actual file structure / exactOptionalPropertyTypes / crypto.subtle / 1Password vault & SA 名 / 契約と実装の境界 / scheduled テスト困難 / audit best-effort / 認可漏れ）を Phase 1 の AC として写経・拡張する。
2. 真の論点を「三位一体（認可・冪等性・audit best-effort）担保」と「契約と実装の境界解消」に再定義する。
3. 依存境界（上流 4・並列 1・下流 4）すべてに前提・出力を記述する。
4. 4条件評価を全 PASS で固定する。
5. 不変条件 #1/#4/#5 の touched-list を index.md と完全同期させる。
6. 既存コード命名規則の確認 5 観点を Phase 2 への引き渡しとして固定する。
7. AC-1〜AC-12 を index.md と差分ゼロで揃える。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md | 原典スペック（苦戦箇所の写経元） |
| 必須 | docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-02/sync-flow.md | 状態遷移の正本 |
| 必須 | docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-02/data-contract.md | audit best-effort + outbox 方針 |
| 必須 | docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-12/unassigned-task-detection.md (U-04) | 検出原典 |
| 必須 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/index.md | 並列タスク・知見再利用 |
| 必須 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | `/admin/sync*` 命名規約・認可境界 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | 1Password (Employee/ubm-hyogo-env) → Cloudflare Secrets |
| 参考 | https://developers.cloudflare.com/workers/runtime-apis/web-crypto/ | crypto.subtle RS256 仕様 |
| 参考 | https://authjs.dev/reference/core | SYNC_ADMIN_TOKEN Bearer |

## 実行手順

### ステップ 1: 上流前提の確認

- 03-serial の `outputs/phase-02/sync-flow.md` / `data-contract.md` / `outputs/phase-05/sync-deployment-runbook.md` が main にマージ済みであることを確認する。
- UT-22（D1 migration 実体）と UT-03（Sheets API 認証）の完了 index.md を確認する。
- 不足があれば Phase 2 へ進まずタスク仕様書の依存表を更新する。

### ステップ 2: 真の論点と三位一体の確定

- 「endpoint 実装」ではなく「契約と実装の境界解消 + 認可・冪等性・audit best-effort の三位一体」として記述されているか自己レビューする。
- 並列タスク UT-09 と `/admin/sync` / scheduled handler が同一 `runSync(env, options)` を呼ぶことを Phase 2 入力として記録する。

### ステップ 3: actual file structure の固定

- 03-serial で先行実装された 5 ファイル（types.ts / sheets-client.ts / mapper.ts / worker.ts / index.ts）を Phase 2 設計の base case に固定する。
- spec 案の core/manual/scheduled/audit 分離ではなく flat 構造を維持する旨を Phase 2 引き渡しに明記する。

### ステップ 4: 4条件と AC のロック

- 4条件すべてが PASS で固定されていることを確認する。
- AC-1〜AC-12 を `outputs/phase-01/main.md` に列挙し、index.md と完全一致させる。

### ステップ 5: 命名規則と secrets 規約の引き渡し

- `apps/api/src/sync/`、`apps/api/src/index.ts`、`apps/api/wrangler.toml` の命名・env split を Phase 2 設計者が確認するチェックリストとして main.md に書き出す。
- 1Password 参照は `op://Employee/ubm-hyogo-env/<FIELD>` の固定形式であること、SA 名は `ubm-hyogo-sheets-reader@ubm-hyogo.iam.gserviceaccount.com` であることを明記する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 真の論点・三位一体・依存境界・4条件・命名規則チェックリスト・actual file structure を設計入力として渡す |
| Phase 3 | 4条件評価の根拠を代替案 PASS/MINOR/MAJOR 判定の比較軸に再利用 |
| Phase 4 | AC-1〜AC-12 をテスト戦略のトレース対象に渡す（特に冪等性・audit best-effort・admin auth） |
| Phase 7 | AC matrix の左軸として AC-1〜AC-12 を使用 |
| Phase 9 | 03-serial との 5 点同期チェックの起点 |
| Phase 10 | 4条件最終判定の起点として再評価 |

## 多角的チェック観点（AIが判断）

- 不変条件 #1: Sheets schema を `mapper.ts` (COL 定数) に閉じ、worker / index に漏らしていないか。03-serial sync-flow をコードコメントに転記していないか。
- 不変条件 #4: audit / outbox テーブルが admin-managed data として専用分離されているか。
- 不変条件 #5: D1 binding が `apps/api/src/sync/*` 内のみで、`apps/web` から直接呼び出す設計が混入していないか。
- 認可境界: `/admin/sync` / `/admin/sync/responses` / `/admin/sync/audit` が `app.use('/admin/sync*', adminAuth)` で一括保護されているか。Authorization Bearer token 検証を満たすか。
- 冪等性: `generateResponseId` の SHA-256 ハッシュ対象列が固定され、Sheets 列追加で破壊的変化が起きないか。
- audit best-effort: sync 本体成功 / audit 失敗で勝手にトランザクション化していないか。outbox に蓄積する設計か。
- exactOptionalPropertyTypes: SheetRow 全フィールドが `string | undefined`、DB バインドが `?? null` 合体されているか。
- Workers 互換: googleapis 依存が混入せず、`crypto.subtle` で RS256 署名されているか。
- Secret hygiene: SA JSON / SYNC_ADMIN_TOKEN が 1Password (Employee/ubm-hyogo-env) → Cloudflare Secrets 経由のみで、リポジトリに平文を残さないか。
- 無料枠: Cloudflare Workers / D1 / Sheets API のいずれも free tier 内で完結するか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 真の論点を「三位一体担保 + 契約/実装境界解消」に再定義 | 1 | spec_created | main.md 冒頭に記載 |
| 2 | 依存境界（上流 4・並列 1・下流 4）の固定 | 1 | spec_created | UT-09 / UT-03 / UT-04・UT-22・03-serial 整合 |
| 3 | 4条件評価 PASS 確定 | 1 | spec_created | 全件 PASS |
| 4 | 不変条件 #1/#4/#5 の touched 確認 | 1 | spec_created | index.md と同期 |
| 5 | AC-1〜AC-12 の確定 | 1 | spec_created | index.md と完全一致 |
| 6 | actual file structure (5 ファイル) の base case 固定 | 1 | spec_created | Phase 2 への引き渡し |
| 7 | 既存命名規則チェックリスト 5 観点 | 1 | spec_created | Phase 2 入力 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 要件定義主成果物（4条件評価・true issue・依存境界・三位一体） |
| メタ | artifacts.json | Phase 1 状態の更新 |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] 真の論点が「契約/実装境界解消 + 三位一体（認可・冪等性・audit best-effort）」に再定義されている
- [ ] 4条件評価が全 PASS で確定し、根拠が記載されている
- [ ] 依存境界表に上流 4・並列 1・下流 4 すべてが前提と出力付きで記述されている
- [ ] AC-1〜AC-12 が index.md と完全一致している
- [ ] 既存コード命名規則の確認項目が 5 観点で固定されている
- [ ] actual file structure（types/sheets-client/mapper/worker/index）が Phase 2 base case として固定されている
- [ ] 不変条件 #1/#4/#5 のいずれにも違反しない範囲で要件が定義されている

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- 全成果物が `outputs/phase-01/` 配下に配置済み
- 苦戦箇所 8 件すべてが AC または多角的チェックに対応
- 異常系（認可漏れ / SQLite 重複 / audit 失敗 / SA JSON 漏洩 / JWT 署名失敗）の論点が要件レベルで提示されている
- artifacts.json の `phases[0].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 2 (設計)
- 引き継ぎ事項:
  - 真の論点 = 契約/実装境界解消 + 三位一体（認可・冪等性・audit best-effort）
  - 4条件評価 (全 PASS) の根拠
  - actual file structure（types.ts / sheets-client.ts / mapper.ts / worker.ts / index.ts）を Phase 2 設計の base case に固定
  - 既存命名規則チェックリスト 5 観点
  - UT-09 との `runSync(env, options)` 共有契約
  - 1Password 参照形式 `op://Employee/ubm-hyogo-env/<FIELD>` と SA 名 `ubm-hyogo-sheets-reader@ubm-hyogo.iam.gserviceaccount.com`
- ブロック条件:
  - 03-serial / UT-22 / UT-03 のいずれかが未マージ
  - 4条件のいずれかが MINOR/MAJOR
  - AC-1〜AC-12 が index.md と乖離
