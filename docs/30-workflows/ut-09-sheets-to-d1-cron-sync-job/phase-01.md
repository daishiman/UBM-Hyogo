# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Sheets→D1 同期ジョブ実装 (UT-09) |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-27 |
| Wave | 1 |
| 実行種別 | parallel（UT-01/02/03/04 完了後に独立着手可能） |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | spec_created |
| タスク分類 | specification-design（apps/api への Cron Trigger / route handler / utility 追加。docs-only ではない） |

## 目的

Cloudflare Workers Cron Triggers による Google Sheets → Cloudflare D1 同期ジョブの「真の論点」を確定させ、`apps/api` 配下に追加する specification-design の境界・前提・受入条件を docs として固定する。設計フェーズ (Phase 2) が WAL 非前提・冪等・無料枠維持・admin-managed data 分離の制約のもとで一意に判断できる入力を作成する。

## 真の論点 (true issue)

- 「Cron スケジュールを敷くこと」ではなく、「WAL 非前提で `SQLITE_BUSY` を許容しつつ、二重実行・部分失敗・ページネーション切断時にも D1 が破綻しない冪等パイプラインを `apps/api` 内に閉じて構築する」ことが本タスクの本質。
- 副次的論点として、Service Account JSON の Secret 化形式と `/admin/sync` の認可境界（`SYNC_ADMIN_TOKEN`）を、UT-21（監査ログ）と契約整合させること。

## 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流 | UT-01（同期方式定義） | pull / cron 方式・冪等性方針・差分 vs 全件の判断 | 本タスクは方式を再設計しない |
| 上流 | UT-02（D1 WAL 設定可否確認） | WAL 永続不可前提の代替策（retry/backoff、queue serialization、short transaction、batch sizing） | 同制約を実装要件として継承 |
| 上流 | UT-03（Sheets API 認証） | Service Account JSON の認証 client / 1Password 登録形式 | 認証 client を再利用するのみで再実装しない |
| 上流 | UT-04（D1 スキーマ） | members / sync_job_logs / sync_locks のテーブル定義・migration | upsert 対象を確定 |
| 下流 | UT-07（通知基盤） | 失敗イベントの hook ポイント | sync_job_logs のスキーマと終了 status を提供 |
| 下流 | UT-08（モニタリング） | メトリクス対象の event 名・field | scheduled handler の structured log 形式を提供 |
| 下流 | UT-10（エラーハンドリング標準化） | 例外分類・retry 方針 | UT-09 で実装した分類を formalize 対象として渡す |
| 並列 | UT-21（sheets-d1-sync-endpoint-and-audit） | `/admin/sync` の API 契約 | 認可・request/response 契約を整合させる |

## 価値とコスト

- 価値: フォーム回答の正本である Sheets を D1 に自動反映することで、`apps/web` / `apps/api` が常に最新の admin-managed data を読める。手動 import の運用コストをゼロ化。
- コスト: Cloudflare Workers 1 Cron 起動 / 6h（initial）= 月 120 invocation 程度、D1 write は 1 batch 100 件 × ページネーション ≒ 月数千 write。Sheets API は 300 req/min/project の下で十分余裕。Cron Trigger は無料枠内。
- 機会コスト: 手動同期や push-based webhook を選んだ場合と比べ、Cron は実装が単純で local 開発も `wrangler dev --test-scheduled` で再現可能。

## 4条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | Sheets 正本主義のもと、admin-managed data の鮮度を運用コストゼロで担保できる |
| 実現性 | PASS | UT-01/03/04/02 の前提が完了済みであり、Cloudflare Cron / Hono route / D1 batch すべて既存技術範囲 |
| 整合性 | PASS | 不変条件 #1（schema 固定回避）/ #4（admin-managed data 分離）/ #5（D1 アクセスは apps/api に閉じる）を全て満たす設計が可能 |
| 運用性 | PASS | sync_job_logs と sync_locks により観測・冪等が両立。`/admin/sync` で手動再実行も可能 |

## 既存コード命名規則の確認

Phase 2 設計の前に、`apps/api` の以下既存規約を確認すること。

| 観点 | 確認対象 | 期待される規則 |
| --- | --- | --- |
| Hono ルート命名 | `apps/api/src/routes/` 既存 handler | kebab-case のディレクトリ + `index.ts` で route export。`/admin/*` は admin middleware 経由 |
| Job module 命名 | `apps/api/src/jobs/` 既存（あれば） | `<verb>-<source>-to-<sink>.ts`（本タスクは `sync-sheets-to-d1.ts`） |
| Util 命名 | `apps/api/src/utils/` | retry / backoff は `with-retry.ts` 等の関数名で export |
| 環境変数 | `apps/api/wrangler.toml` の `[vars]` / `[env.*]` | 既存パターンに合わせ、Secret は `wrangler secret put` 経由で注入する旨を Phase 2 で明記 |
| Logger | `apps/api/src/lib/logger.ts`（あれば） | structured log 規約があればそれに従う |

## 実行タスク

1. unassigned-task `UT-09-sheets-d1-sync-job-implementation.md` の苦戦箇所 6 件（Cron local / Sheets pagination / D1 batch / WAL 非前提 / 冪等性 / SA JSON）を Phase 1 の AC として写経・拡張する（完了条件: 各苦戦箇所が AC または不変条件チェックに対応する）。
2. 真の論点と依存境界を確定する（完了条件: 上流 4 件・下流 3 件・並列 1 件すべてに前提・出力を記述）。
3. 4条件評価を全 PASS で確定する（完了条件: 各観点に PASS 判定と根拠が記載されている）。
4. 不変条件 #1/#4/#5 の touched-list を確定する（完了条件: index.md「不変条件 touched」表と一致する）。
5. 既存コード命名規則の確認項目を Phase 2 への引き渡しとして明記する（完了条件: 5 観点が表で固定されている）。
6. AC-1〜AC-11 を index.md と同期する（完了条件: AC 文言の差分がゼロ）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/UT-09-sheets-d1-sync-job-implementation.md | 原典スペック（苦戦箇所の写経元） |
| 必須 | docs/30-workflows/completed-tasks/ut-02-d1-wal-mode/index.md | WAL 非前提方針の継承元 |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | apps/api 境界の確認 |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | members / sync_job_logs / sync_locks のスキーマ規約 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | Service Account JSON 取り扱い |
| 必須 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | `/admin/sync` 命名規約 |
| 参考 | https://developers.cloudflare.com/workers/configuration/cron-triggers/ | Cron Triggers 公式 |
| 参考 | https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/get | Sheets API v4 |

## 実行手順

### ステップ 1: 上流前提の確認

- `docs/30-workflows/completed-tasks/` に UT-01 / UT-03 / UT-04 / UT-02 の完了 index.md が存在することを確認する。
- 不足があれば Phase 2 へ進まずタスク仕様書の依存表を更新する。

### ステップ 2: 真の論点と依存境界の確定

- 「Cron 設定タスク」ではなく「WAL 非前提・冪等パイプライン構築タスク」として記述されているか自己レビューする。
- 並列タスク UT-21 と `/admin/sync` 契約の interface を 1 か所に集約する旨を Phase 2 入力として記録する。

### ステップ 3: 4条件と AC のロック

- 4条件すべてが PASS で固定されていることを確認する。
- AC-1〜AC-11 を `outputs/phase-01/main.md` に列挙し、index.md と完全一致させる。

### ステップ 4: 既存命名規則の確認指示書を出す

- `apps/api/src/routes/`、`apps/api/src/jobs/`、`apps/api/src/utils/` の命名を Phase 2 設計者が確認するチェックリストとして main.md に書き出す。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 真の論点・依存境界・4条件・命名規則チェックリストを設計入力として渡す |
| Phase 3 | 4条件評価の根拠を代替案 PASS/MINOR/MAJOR 判定の比較軸に再利用 |
| Phase 4 | AC-1〜AC-11 をテスト戦略のトレース対象に渡す |
| Phase 7 | AC matrix の左軸として AC-1〜AC-11 を使用 |
| Phase 10 | 4条件最終判定の起点として再評価 |

## 多角的チェック観点（AIが判断）

- 不変条件 #1: Sheets schema をコードに固定していないか（Phase 2 で mapper を分離する旨を記録）。
- 不変条件 #4: admin-managed data が members 等専用テーブルに分離されているか。
- 不変条件 #5: D1 への直接アクセスが `apps/api` に閉じているか（`apps/web` から呼び出す設計が混入していないか）。
- 認可境界: `/admin/sync` が `SYNC_ADMIN_TOKEN` で保護され、誤って public route に露出していないか。
- 無料枠: Cloudflare Workers / D1 / Sheets API のいずれも free tier 内で完結するか。
- Secret hygiene: Service Account JSON は 1Password / Cloudflare Secrets 経由のみで、リポジトリに平文を残さない。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 真の論点を WAL 非前提・冪等パイプライン構築に再定義 | 1 | spec_created | main.md 冒頭に記載 |
| 2 | 依存境界（上流 4 / 下流 3 / 並列 1）の固定 | 1 | spec_created | UT-21 との interface 整合を含む |
| 3 | 4条件評価 PASS 確定 | 1 | spec_created | 全件 PASS |
| 4 | 不変条件 #1/#4/#5 の touched 確認 | 1 | spec_created | index.md と同期 |
| 5 | AC-1〜AC-11 の確定 | 1 | spec_created | index.md と完全一致 |
| 6 | 既存命名規則チェックリスト | 1 | spec_created | Phase 2 入力 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 要件定義主成果物（4条件評価・true issue・依存境界） |
| メタ | artifacts.json | Phase 1 状態の更新 |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] 真の論点が「Cron 設定」ではなく「WAL 非前提・冪等パイプラインの apps/api 内構築」に再定義されている
- [ ] 4条件評価が全 PASS で確定し、根拠が記載されている
- [ ] 依存境界表に上流 4・下流 3・並列 1 すべてが前提と出力付きで記述されている
- [ ] AC-1〜AC-11 が index.md と完全一致している
- [ ] 既存コード命名規則の確認項目が 5 観点で固定されている
- [ ] 不変条件 #1/#4/#5 のいずれにも違反しない範囲で要件が定義されている

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `spec_created`
- 全成果物が `outputs/phase-01/` 配下に配置済み
- 苦戦箇所 6 件すべてが AC または多角的チェックに対応
- 異常系（WAL 非対応 / Sheets pagination 切断 / Cron 二重起動 / SA JSON 漏洩）の論点が要件レベルで提示されている
- artifacts.json の `phases[0].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 2 (設計)
- 引き継ぎ事項:
  - 真の論点 = WAL 非前提・冪等パイプラインの apps/api 内構築
  - 4条件評価 (全 PASS) の根拠
  - 既存命名規則チェックリスト 5 観点
  - UT-21 との `/admin/sync` 契約整合の必要性
- ブロック条件:
  - UT-01 / UT-02 / UT-03 / UT-04 のいずれかが `completed` でない
  - 4条件のいずれかが MINOR/MAJOR
  - AC-1〜AC-11 が index.md と乖離
