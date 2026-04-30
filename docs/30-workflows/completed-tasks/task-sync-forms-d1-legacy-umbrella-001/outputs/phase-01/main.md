# Phase 01 成果物: 要件定義（legacy umbrella close-out）

## サマリ

旧 UT-09「Sheets→D1 同期ジョブ実装」を direct implementation task として残すと、現行の Forms API sync（03a / 03b）と Sheets API sync の二重正本が発生し、`apps/api` に不要な経路、別監査テーブル `sync_audit`、`responseId` / `memberId` / current response / consent snapshot の整合性破壊を招く。これを回避するため、本タスクを **legacy umbrella close-out** として位置付け、旧 UT-09 の責務を 03a / 03b / 04c / 09b / 02c に完全分散吸収する方針を確定する。本 Phase は docs-only / NON_VISUAL であり、実装コードは生成しない。

## 真の論点（true issue）

> **旧 UT-09 を direct task として実装せず、現行タスクへ責務を分散吸収する判断が一意にできる状態を作れるか。**

問題は「Sheets→D1 sync の実装が必要か否か」ではない。Forms API sync は既に 03a / 03b / 04c / 09b / 02c で正本化されており、UT-09 を direct 実装すれば二重正本となる。論点は「legacy umbrella としてクローズする方針を、責務分解・整合性監査・品質要件移植まで含めて一意に追跡可能にできるか」である。

### Why の根拠

- `docs/00-getting-started-manual/specs/00-overview.md` は本サイトを「公開 / 会員 / 管理」3 層で定義し、sync 経路は管理層の単一導線として規定されている。
- `docs/00-getting-started-manual/specs/03-data-fetching.md` は `sync_jobs` / cursor pagination / current response / consent snapshot を sync 契約の正本と定めており、Sheets API 経路はこの契約と矛盾する。
- 不変条件 #1（schema 過剰固定回避）/ #5（apps/web→D1 直接禁止）/ #6（GAS prototype 不採用）/ #7（Form 再回答が本人更新の正式経路）と整合させるには Forms API 一本化が必要。

## 依存境界

| 境界 | 内側（本タスクの責務） | 外側（本タスクの非責務） |
| --- | --- | --- |
| ドキュメント | legacy umbrella close-out 仕様、責務移管表、移植要件リスト | 03a/03b/04c/09b/02c の Phase 実行、実装コード |
| データ | D1 テーブル `sync_jobs` / `member_responses` 等の正本マッピング記録 | DDL 定義（02c/03a/03b 管轄） |
| API | `POST /admin/sync/schema` / `POST /admin/sync/responses` を正本固定する記録 | endpoint 実装（04c 管轄） |
| 認証 | secret 名（`GOOGLE_SERVICE_ACCOUNT_EMAIL` 等）の参照 | secret 配備（インフラ管轄） |
| 環境 | `dev branch -> staging env` / `main branch -> production env` の正規化 | wrangler.toml 定義（09b 管轄） |

## 価値とコスト

| 観点 | 内容 |
| --- | --- |
| 価値 | (a) stale UT-09 を見て二重実装する事故の予防、(b) D1 競合対策（SQLITE_BUSY retry/backoff、batch-size 制限、短い transaction）の 03a/03b/09b への確実な移植、(c) 未タスク監査の 9 セクション準拠 reference example 化 |
| コスト | docs-only のため実装コスト 0、レビューと Phase 12 ドキュメント生成のみ |
| 機会損失 | 放置すると AI エージェント / 実装者が直接 stale UT-09 を読み Sheets API 経路を追加 → rollback 工数増 |

## 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 二重正本リスクと監査 violation を同時解消 |
| 実現性 | PASS | docs-only / 外部依存なし、元仕様存在 |
| 整合性 | PASS | CLAUDE.md 不変条件 #1/#5/#6/#7、aiworkflow-requirements current facts、specs/00 / 01 / 03 / 08 / 13 と整合 |
| 運用性 | PASS | 未タスク監査スクリプトで自動検証可能、Phase 13 user_approval_required で運用 gate |

## 受入条件 AC-1〜AC-14

### 機能要件

- AC-1: 旧 UT-09 が direct implementation task ではなく legacy umbrella として扱われる
- AC-2: 実装対象が 03a / 03b / 04c / 09b / 02c に分解（direct 残責務 0 件）
- AC-3: Google Forms API（`forms.get` / `forms.responses.list`）に統一、Sheets API 不採用
- AC-4: `POST /admin/sync/schema` と `POST /admin/sync/responses` を正本、単一 `/admin/sync` 不採用

### 品質要件

- AC-5: `SQLITE_BUSY` retry/backoff、短い transaction、batch-size 制限が 03a/03b 異常系で追跡される
- AC-6: `sync_jobs.status='running'` による同種 job 排他で二重起動が 409 Conflict
- AC-7: Workers Cron Triggers の pause / resume / evidence が 09b runbook へ移植
- AC-8: `dev branch -> staging env` / `main branch -> production env` が明記
- AC-9: 不変条件 #5（apps/web→D1 直接禁止）に違反する記述なし

### ドキュメント要件

- AC-10: 未タスクテンプレートの必須 9 セクション準拠
- AC-11: filename が lowercase / hyphen の監査規則を満たす
- AC-12: stale パス `docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/` を新設しない
- AC-13: 全成果物が `specs/01-api-schema.md` / `03-data-fetching.md` / `08-free-database.md` と矛盾しない
- AC-14: Phase 13 commit / PR はユーザー承認まで実行しない

## Open Questions

| # | 論点 | 暫定方針 | 確定 Phase |
| --- | --- | --- | --- |
| OQ-1 | `sync_audit`（旧）→ `sync_jobs`（新）読み替えで履歴データを保全するか | docs-only のため履歴 schema 移行はスコープ外。`sync_jobs` を新正本として運用 | Phase 02 |
| OQ-2 | Cloudflare D1 で `PRAGMA journal_mode=WAL` を運用上適用するか | 互換性未確認のため適用しない。retry/backoff で代替 | Phase 02 |
| OQ-3 | 旧 UT-09 ファイル自体を削除するか保持するか | 保持（legacy 参照記録）。新導線では参照しない | Phase 03 |
| OQ-4 | `sync_audit` 名を含む過去ドキュメントの全置換を本タスクで行うか | 方針記録のみ。実置換は 02c/03a/03b の Phase 12 で実施 | Phase 12 |

## エビデンス・参照

- `docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md` §1〜§9
- `docs/30-workflows/completed-tasks/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/index.md`
- `docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver/index.md`
- `docs/30-workflows/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/index.md`
- `.claude/skills/aiworkflow-requirements/references/api-endpoints.md`
- `docs/00-getting-started-manual/specs/00-overview.md` / `01-api-schema.md` / `03-data-fetching.md` / `08-free-database.md` / `13-mvp-auth.md`
- `CLAUDE.md` 不変条件 #1 / #5 / #6 / #7

## AC トレーサビリティ（Phase 01 時点）

| AC | Phase 01 の扱い |
| --- | --- |
| AC-1 | 真の論点 / 4 条件で legacy umbrella 方針を確定 |
| AC-2 | 依存境界で 03a/03b/04c/09b/02c への分解を予告（Phase 02 で具体化） |
| AC-3〜AC-12 | 受入条件として正式列挙、確定は Phase 02〜09 |
| AC-13 | 参照 spec を網羅列挙（矛盾なきことを Phase 04 SP-1〜SP-3 で検証） |
| AC-14 | Open Questions と運用方針として記録 |

## 次 Phase（02 設計）への引き渡し

1. 真の論点と依存境界マトリクス
2. AC-1〜AC-14 リスト
3. Open Questions OQ-1〜OQ-4（特に OQ-1 sync_audit 読替、OQ-2 PRAGMA WAL 不採用）
4. 不変条件 #1 / #5 / #6 / #7 への触れ方方針
