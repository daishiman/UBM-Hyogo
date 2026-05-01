# ut21-forms-sync-conflict-closeout - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | task-ut21-forms-sync-conflict-closeout-001 |
| タスク名 | UT-21 Sheets sync 仕様を Forms sync 現行正本へ吸収する close-out |
| ディレクトリ | docs/30-workflows/ut21-forms-sync-conflict-closeout |
| Wave | 1 |
| 実行種別 | parallel（03a / 03b / 04c / 09b 並走中に着手可能） |
| 作成日 | 2026-04-30 |
| 担当 | unassigned |
| 状態 | spec_created |
| タスク種別 | docs-only / specification-cleanup（legacy umbrella close-out。実装変更は派生タスク化） |
| visualEvidence | NON_VISUAL |
| priority | HIGH |
| 既存タスク組み込み | 03a / 03b / 04c / 09b（実装は既存タスクへ移植・本タスクで新規実装は行わない） |
| 組み込み先 | 03a-parallel-forms-schema-sync-and-stablekey-alias-queue / 03b-parallel-forms-response-sync-and-current-response-resolver / 04c-parallel-admin-backoffice-api-endpoints / 09b-parallel-cron-triggers-monitoring-and-release-runbook |
| GitHub Issue | #234 (CLOSED) |

## 目的

UT-21（`UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md`）を Sheets direct implementation として進めず、有効な品質要件のみを 03a / 03b / 04c / 09b へ吸収する close-out を完了する。`POST /admin/sync` と `GET /admin/sync/audit` は新設しない方針を、本タスク仕様書および現行タスクの受入条件の双方で固定する。Sheets sync と Forms sync の二重正本化を防止し、`task-sync-forms-d1-legacy-umbrella-001` と同形式の legacy umbrella 処理として閉じる。

## スコープ

### 含む

- UT-21 の有効な品質要件抽出と移植先割当
  - Bearer guard（401 / 403 / 200 認可境界）→ 04c
  - 409 排他（`sync_jobs.status='running'` 同種 job 衝突）→ 03a / 03b
  - D1 retry / `SQLITE_BUSY` backoff / 短い transaction / batch-size 制限 → 03a / 03b
  - manual smoke（実 secrets / 実 D1 環境）→ 09b runbook + 09a / 09c smoke
- `POST /admin/sync` と `GET /admin/sync/audit` を追加しない方針の明文化（本仕様書と UT-21 仕様書状態欄）
- UT-21 stale 前提の棚卸し（同期元・単一 endpoint・GET audit・audit table・実装パスの 5 項目差分表）
- UT21-U02 / U04 / U05 後続タスク別ファイル化と本仕様書への cross link
- 03a / 03b / 04c / 09b の受入条件 patch 案の提示（実 patch 適用は各タスクの Phase で実施）
- aiworkflow-requirements skill `task-workflow.md` の current facts 整合確認

### 含まない

- Google Sheets API v4 を正本仕様へ復活させること
- `sync_audit_logs` / `sync_audit_outbox` テーブルの新設（必要性は U02 で別途判定）
- `POST /admin/sync` / `GET /admin/sync/audit` の新設
- 新規 sync 実装コードの追加（実装は 03a / 03b / 04c / 09b の各 Phase で実施）
- UT-21 仕様書本体（legacy）の削除・改編
- commit / push / PR 作成（Phase 13 で user 承認後にのみ実施）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | task-sync-forms-d1-legacy-umbrella-001 | 旧 UT-09 と同形式の legacy umbrella 処理。本タスクはその姉妹タスク |
| 上流 | 03a-parallel-forms-schema-sync-and-stablekey-alias-queue | `forms.get` / `POST /admin/sync/schema` の正本 |
| 上流 | 03b-parallel-forms-response-sync-and-current-response-resolver | `forms.responses.list` / `POST /admin/sync/responses` の正本 |
| 上流 | 04c-parallel-admin-backoffice-api-endpoints | Bearer guard / admin endpoint expose の正本 |
| 上流 | 09b-parallel-cron-triggers-monitoring-and-release-runbook | cron / runbook / smoke の正本 |
| 上流 | 02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary | `sync_jobs` repository と D1 直接アクセス境界 |
| 横 | UT21-U02 / U04 / U05 後続タスク | 本ファイルから派生する独立スコープ |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/task-ut21-forms-sync-conflict-closeout-001.md | 原典 close-out スペック（本仕様書の上位文書） |
| 必須 | docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md | UT-21 当初仕様（legacy） |
| 必須 | docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md | 旧 UT-09 close-out の参考フォーマット |
| 必須 | docs/30-workflows/unassigned-task/task-ut21-sync-audit-tables-necessity-judgement-001.md | UT21-U02 後続タスク |
| 必須 | docs/30-workflows/unassigned-task/task-ut21-phase11-smoke-rerun-real-env-001.md | UT21-U04 後続タスク |
| 必須 | docs/30-workflows/unassigned-task/task-ut21-impl-path-boundary-realignment-001.md | UT21-U05 後続タスク |
| 必須 | .claude/skills/aiworkflow-requirements/references/task-workflow.md | D1 / sync_jobs / deployment current facts |
| 必須 | apps/api/src/jobs/sync-forms-responses.ts | Forms response sync 正本実装 |
| 必須 | apps/api/src/sync/schema/ | schema 同期正本実装 |
| 参考 | docs/00-getting-started-manual/specs/01-api-schema.md | フォーム schema と項目定義 |
| 参考 | docs/00-getting-started-manual/specs/08-free-database.md | D1 構成 |

## 受入条件 (AC)

- AC-1: UT-21 の stale 前提 5 項目（同期元 / 単一 endpoint / `GET /admin/sync/audit` 公開 / audit table（`sync_audit_logs` + `sync_audit_outbox`） / 実装パス）が差分表として固定されている
- AC-2: 有効な品質要件 4 種（Bearer guard / 409 排他 / D1 retry / manual smoke）の移植先が 03a / 03b / 04c / 09b に一意に割り当てられている
- AC-3: `POST /admin/sync` / `GET /admin/sync/audit` を新設しない方針が本仕様書と UT-21 仕様書状態欄の双方に明記されている
- AC-4: `sync_audit_logs` / `sync_audit_outbox` の新設は U02 判定後まで保留する旨が明記されている
- AC-5: 後続タスク UT21-U02 / U04 / U05 が `unassigned-task/` 配下に別ファイルで存在し、本仕様書からリンクされている
- AC-6: 03a / 03b / 04c / 09b の受入条件への移植 patch 案が Phase 5 で提示されている（実適用は各タスクの Phase 内）
- AC-7: aiworkflow-requirements skill `task-workflow.md` の current facts と矛盾する記述が本仕様書内に存在しない
- AC-8: 4条件（価値性 / 実現性 / 整合性 / 運用性）の最終判定が PASS である
- AC-9: 不変条件 #5（D1 直接アクセスは `apps/api` に閉じる）に違反する記述が存在しない
- AC-10: 検証コマンド `rg -n "POST /admin/sync\b|GET /admin/sync/audit|sync_audit_logs|sync_audit_outbox" docs/30-workflows/02-application-implementation .claude/skills/aiworkflow-requirements/references` の出力に基づく差分根拠が記録されている
- AC-11: GitHub Issue #234 が CLOSED 状態のまま、本仕様書が成果物として参照可能になっている

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | spec_created | outputs/phase-01/main.md |
| 2 | 設計（移植マトリクス設計） | phase-02.md | spec_created | outputs/phase-02/migration-matrix-design.md |
| 3 | 設計レビュー | phase-03.md | spec_created | outputs/phase-03/main.md |
| 4 | テスト戦略 | phase-04.md | spec_created | outputs/phase-04/test-strategy.md |
| 5 | 実装ランブック（受入条件 patch 案） | phase-05.md | spec_created | outputs/phase-05/implementation-runbook.md |
| 6 | 異常系検証 | phase-06.md | spec_created | outputs/phase-06/failure-cases.md |
| 7 | AC マトリクス | phase-07.md | spec_created | outputs/phase-07/ac-matrix.md |
| 8 | DRY 化 | phase-08.md | spec_created | outputs/phase-08/main.md |
| 9 | 品質保証 | phase-09.md | spec_created | outputs/phase-09/main.md |
| 10 | 最終レビュー | phase-10.md | spec_created | outputs/phase-10/go-no-go.md |
| 11 | 手動 smoke test | phase-11.md | spec_created | outputs/phase-11/main.md |
| 12 | ドキュメント更新 | phase-12.md | spec_created | outputs/phase-12/main.md + 6 補助ファイル |
| 13 | PR作成 | phase-13.md | spec_created | outputs/phase-13/pr-info.md |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-01/main.md | 要件定義（4条件評価・真の論点・依存境界） |
| 設計 | outputs/phase-02/migration-matrix-design.md | UT-21 品質要件 → 03a/03b/04c/09b 移植マトリクス |
| 設計 | outputs/phase-02/no-new-endpoint-policy.md | `POST /admin/sync` / `GET /admin/sync/audit` 新設禁止方針 |
| レビュー | outputs/phase-03/main.md | 代替案 3 件以上 + PASS/MINOR/MAJOR 判定 |
| テスト | outputs/phase-04/test-strategy.md | docs-only 検証戦略（rg / 整合性 / cross-link 死活） |
| 実装 | outputs/phase-05/implementation-runbook.md | 03a/03b/04c/09b 受入条件への patch 案 |
| 異常系 | outputs/phase-06/failure-cases.md | 移植漏れ / 新設誘惑 / U02 判定遅延等のシナリオ |
| AC | outputs/phase-07/ac-matrix.md | AC × 検証 × 成果物 のトレース |
| QA | outputs/phase-09/main.md | 監査ログ・最終整合性確認 |
| ゲート | outputs/phase-10/go-no-go.md | GO/NO-GO 判定 |
| 証跡 | outputs/phase-11/main.md | docs-only smoke 実行サマリー（NON_VISUAL） |
| ガイド | outputs/phase-12/main.md | Phase 12 本体サマリー |
| ガイド | outputs/phase-12/implementation-guide.md | Part 1（中学生向け） + Part 2（技術者向け） |
| ガイド | outputs/phase-12/system-spec-update-summary.md | 仕様書同期サマリー |
| ガイド | outputs/phase-12/documentation-changelog.md | ドキュメント更新履歴 |
| ガイド | outputs/phase-12/unassigned-task-detection.md | 派生タスク列挙（0 件でも出力必須） |
| ガイド | outputs/phase-12/skill-feedback-report.md | task-specification-creator / aiworkflow-requirements skill フィードバック |
| 検証 | outputs/phase-12/phase12-task-spec-compliance-check.md | Phase 12 7成果物・same-wave sync・docs-only据え置きの最終確認 |
| メタ | artifacts.json | 機械可読サマリー |
| 仕様書 | phase-*.md x 13 | Phase 別仕様 |

## 関連サービス・ツール

| サービス/ツール | 用途 | 無料枠/コスト |
| --- | --- | --- |
| Cloudflare Workers (apps/api) | Forms sync ランタイム | 無料枠 |
| Cloudflare D1 | `sync_jobs` ledger 保管 | 無料枠 |
| Google Forms API | `forms.get` / `forms.responses.list` 正本 sync 元 | 無料 |
| Workers Cron Triggers | scheduled sync 実行基盤 | 無料枠 |
| ripgrep (`rg`) | 仕様書内 stale 参照検出 | OSS |

## Secrets 一覧（このタスクで導入・参照）

本タスクは docs-only であり新規 Secret は導入しない。既存 Secret の参照状況のみ言及する。

| Secret 名 | 用途 | 参照のみ |
| --- | --- | --- |
| `SYNC_ADMIN_TOKEN` | `/admin/sync/schema` / `/admin/sync/responses` Bearer guard | 参照のみ |
| `GOOGLE_FORMS_API_KEY` | Forms API 認証 | 参照のみ |

## 不変条件 touched

| # | 不変条件 | 本タスクでの扱い |
| --- | --- | --- |
| #1 | 実フォームの schema をコードに固定しすぎない | UT-21 の Sheets 列インデックス前提を排除し、Forms `responseId` ベースを正本として固定 |
| #4 | Form schema 外データは admin-managed として分離 | `sync_jobs` ledger の admin-managed 性質を再確認 |
| #5 | D1 直接アクセスは `apps/api` に閉じる | UT-21 の `apps/api/src/sync/*` 想定構成を排除し、現行 `apps/api/src/jobs/*` + `apps/api/src/sync/schema/*` を正本確認 |
| #7 | MVP では Google Form 再回答を本人更新の正式経路とする | sync 経路が Forms→D1 一方向であることを再確認 |

## 完了判定

- Phase 1〜13 の状態が `artifacts.json` と一致する
- AC-1〜AC-11 が Phase 7 / 10 で完全トレースされる
- 4条件（価値性 / 実現性 / 整合性 / 運用性）が PASS
- docs-only 差分は本タスク内で解消、impl 必要差分はすべて派生タスク（03a/03b/04c/09b の Phase 内）として起票指示が記述されている
- Phase 12 の same-wave sync ルール（LOGS.md / SKILL.md / topic-map）が破られていない
- Phase 13 はユーザー承認なしでは実行しない

## 苦戦想定 / 知見

**1. 同期元差異**
UT-21 は `spreadsheets.values.get` 想定、正本は `forms.get` / `forms.responses.list`。DTO が `SheetRow` から Forms response へ変わり、`SHA-256(response_id)` 冪等キー算出根拠も列インデックスではなく Forms `responseId` ベースになる。Phase 2 で対応表を必ず作成する。

**2. audit table 設計判定の難しさ**
`sync_audit_logs` + `sync_audit_outbox` の二段監査は Sheets sync の best-effort モデル前提。現行 `sync_jobs` ledger が「実行履歴・実行中ジョブ・metrics_json・失敗詳細」をカバーできるかの判定は本タスクでは行わず、UT21-U02 として切り出す。即新設は過剰実装。

**3. 実装パス想定ずれ**
UT-21 は `apps/api/src/sync/{core,manual,scheduled,audit}.ts` を提案するが、現行は `apps/api/src/jobs/sync-forms-responses.ts` + `apps/api/src/sync/schema/*` 構成。仕様だけ追従すると import path / Cron handler 配置が壊れる。UT21-U05 で別途整理する。

**4. API 境界の衝突**
UT-21 の単一 `POST /admin/sync` は 03a/03b/04c の 2 系統と排他。`job_kind` 単一責務原則で分離すべき。`GET /admin/sync/audit` も `sync_jobs` を admin UI 経由で参照する現行方針と衝突する。

**5. CLOSED Issue への仕様書紐付け**
GitHub Issue #234 は CLOSED だが、ユーザー指示によりクローズドのまま仕様書を作成する。`gh issue` での再オープンは行わず、仕様書側に Issue 番号のみ記録する。

**6. legacy umbrella の再発防止**
旧仕様タスクは Phase 12 unassigned-task-detection で必ず「正本との差分表」を作る。`aiworkflow-requirements` の current facts と照合し、既に分割済みなら direct implementation ではなく legacy umbrella として閉じる判断ルールを skill-feedback で正本化する。

## 関連リンク

- 上位 README: ../README.md
- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/234 (CLOSED)
- 原典 close-out spec: ../unassigned-task/task-ut21-forms-sync-conflict-closeout-001.md
- 原典 UT-21 当初仕様: ../unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md
- 姉妹 close-out: ../unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md
- 後続 U02: ../unassigned-task/task-ut21-sync-audit-tables-necessity-judgement-001.md
- 後続 U04: ../unassigned-task/task-ut21-phase11-smoke-rerun-real-env-001.md
- 後続 U05: ../unassigned-task/task-ut21-impl-path-boundary-realignment-001.md
