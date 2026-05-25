# Phase 1: Requirements

## メタ情報
- workflow: issue-837-schema-alias-bulk-rollback
- 由来: Issue #837 / unassigned-task `serial-05-step-03-followup-006-schema-alias-bulk-rollback.md`
- タスク分類: **UI task（VISUAL）** — admin 画面の bulk rollback selection UI 追加。Phase 11 で screenshot 証跡を取る。
- implementation_mode: `new`（bulk rollback は未実装。RED/GREEN サイクルで新規実装）

## 目的
`SchemaDiffPanel` の resolve 履歴（HistoryPane）に複数 alias の一括 rollback UI を追加し、Google Form schema 改訂時に誤って一括 resolve した alias 群を、1 件ずつではなくまとめて取り消せるようにする要件を固定する。

## 背景

- 現行 `apps/web/src/components/admin/SchemaDiffPanel.tsx` の HistoryPane は、resolve 済み alias を行表示し、行ごとに単体 `rollback` ボタンを出す single-rollback 経路のみ（Issue #778）。
- Google Form の section 単位 rename を誤って一括 resolve した場合、取り消しも section 全体（最大 30 件規模）になるが、現状は 1 件ずつ confirm modal を介すため 10 分以上のリードタイムが発生する。
- bulk **resolve**（Issue #776）は既に client-side bounded fan-out で実装済み。bulk **rollback** はその対称機能だが未実装（親 workflow #778 Phase 12 で followup-006 として記録済・未 consumed）。

## 既存コード命名規則の分析（FB-01 / FB-SDK-07-4 対応）

| 対象 | 既存命名 | 本タスクの命名（一貫性担保） |
| --- | --- | --- |
| 単体 rollback client helper | `rollbackSchemaAlias(input)` | bulk: `rollbackSchemaAliasBulk(rows, options)`（`postSchemaAliasBulk` と対称） |
| bulk resolve row 結果型 | `SchemaAliasBulkRowResult` | `SchemaAliasRollbackBulkRowResult` |
| bulk resolve options 型 | `SchemaAliasBulkOptions` | `SchemaAliasRollbackBulkOptions` |
| bulk resolve modal | `SchemaDiffBulkResolveModal`（`SchemaDiffBulkResolveModal.tsx`） | `SchemaDiffBulkRollbackModal`（`SchemaDiffBulkRollbackModal.tsx`） |
| bulk resolve hook | `useSchemaDiffBulkSelection`（`hooks/useSchemaDiffBulkSelection.ts`） | `useSchemaDiffBulkRollbackSelection`（`hooks/useSchemaDiffBulkRollbackSelection.ts`） |
| 並列実行 util | `runWithConcurrency`（api.ts 内 private） | 既存を再利用（重複定義禁止 / SSOT） |
| 楽観ロック値 | `version`（`If-Match: version=<N>`） | 既存を踏襲。各 row が `version` を保持 |

> ファイル名規則: client helper は camelCase 関数、component は PascalCase ファイル、hook は `use*` camelCase ファイル。既存 #776 と完全一致させる。

## 機能要件 (FR)

- **FR-1**: HistoryPane に bulk rollback mode トグルを追加。OFF 時は現行の行ごと単体 rollback ボタンを維持する（回帰なし）。
- **FR-2**: bulk rollback mode ON 時、resolve 履歴の各行に selection checkbox を表示する。checkbox には `aria-label`（例: `alias <label> を一括取消対象に含める`）を必須付与する。
- **FR-3**: 「履歴全選択」select-all checkbox を提供する（表示中の履歴行を一括選択 / 解除）。
- **FR-4**: 選択件数バッジを表示する（例: `8 件選択中`）。
- **FR-5**: 「一括取消」ボタン押下で bulk rollback confirm modal を表示。modal 内に選択 alias の一覧（aliasLabel / stableKey / resolvedAt）と、各 alias の影響応答件数の aggregate 合計、再集計推奨の有無を表示する。
- **FR-6**: modal の confirm 押下で全選択 alias に対し `rollbackSchemaAlias` を bounded concurrency（初期値 8、上限 50 件）で fan-out 実行し、行ごとに pending / success / error 状態を modal 内に表示する。各 request 完了ごとに進捗を更新する。
- **FR-7**: 部分失敗（一部 409 version_mismatch / 404 not_found・already_deleted）発生時は、成功分を確定（履歴から除去）し、失敗分のみ理由付きで modal に残す。失敗分は admin が再 submit（最新 version 再取得後）できる導線を持つ。
- **FR-8**: 全件成功時は modal を閉じ、`router.refresh()` で最新 diff / 履歴を反映する。
- **FR-9**: bulk rollback の結果サマリは「全成功 / 部分成功 / 全失敗」を明示的に区別して表示する（成功 N 件 / 失敗 M 件 + 失敗 kind breakdown）。
- **FR-10**: 選択件数が 50 件を超える場合は confirm を抑止し、分割実行を促す alert を表示する（#776 の 50 件上限と対称）。

## 非機能要件 (NFR)

- **NFR-1**: bulk rollback は既存 `rollbackSchemaAlias` を再利用し、楽観ロック（`If-Match: version=<N>`）の per-alias 検証ロジックを single 経路と完全共有する（duplicate 禁止 / SSOT）。
- **NFR-2**: bulk submit 中も browser 応答性を保つ（modal 内 progress 表示。modal 外操作は disabled）。
- **NFR-3**: design token は OKLch のみ。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止（`verify-design-tokens` gate green）。
- **NFR-4**: a11y: checkbox に `aria-label`、modal に `role="dialog"` / `aria-modal="true"` / `aria-labelledby` / focus trap / Escape close。既存 `RollbackConfirmModal` / `SchemaDiffBulkResolveModal` の a11y パターンと一致させる。
- **NFR-5**: 30 件 bulk rollback が 30 秒以内で完了する（client-side fan-out / concurrency 8。local dev または branch preview で計測、staging 計測は Phase 13 後の runtime gate）。
- **NFR-6**: API/D1 への変更を一切行わない（client-only 拡張）。

## スコープ境界

- 含む: Phase 2-13 の全タスク（`index.md` スコープ参照）。
- 含まない: 単体 rollback / undo 本体（#778 完了済）、recompute trigger（followup-005）、rollback notification（followup-007）、batch parent-child audit log（API/D1 変更を要するため除外。per-alias audit で AC 充足）。

## 受入条件 (AC: 抜粋 / 全件は phase-09)

- AC-1: bulk rollback mode で複数 resolve 履歴行を checkbox 選択し、confirm modal を介して一括 rollback できる。
- AC-2: 1 件でも version mismatch（409）がある場合、成功分は確定し失敗分のみ理由付きで残る（per-alias 独立 commit / transaction 方針が明示されている）。
- AC-3: audit log から各 alias の rollback 結果を追跡できる（per-alias `schema_alias.rollback` 記録が既存 endpoint 経由で残る）。
- AC-4: UI が「全成功 / 部分成功 / 全失敗」を区別して表示する。
- AC-5: 50 件超過時に confirm が抑止され、分割実行を促す（上限件数の明示）。
- AC-6: 既存 single rollback / undo 経路、bulk resolve 経路が回帰なし。
- AC-7: 楽観ロック検証ロジックが single 経路と単一定義で共有される。
- AC-8: spec test が partial failure / all-fail / all-success / 50 件上限シナリオを含めて green。
- AC-9: design token 違反 0（`verify-design-tokens` gate green）。

## 完了条件

- [ ] FR-1..10 / NFR-1..6 が確定し phase-02-design.md に展開可能
- [ ] スコープ境界と「含まないもの」の理由が明文化済み（CONST_007 整合）
- [ ] 元 unassigned-task spec の「苦戦箇所」「リスクと対策」「検証方法」と整合（index.md アーキテクチャ決定表に反映済み）
- [ ] 既存命名規則（#776）との一貫性が命名表に固定済み
