# Phase 10: Final Review（最終レビューゲート）

## メタ情報

| Key | Value |
| --- | --- |
| workflow | `issue-837-schema-alias-bulk-rollback` |
| 入力 | `phase-01-requirements.md` 〜 `phase-09-quality-assurance.md`（全9 Phase）/ `index.md` / `artifacts.json` |
| 判定対象 | AC-1〜9 の最終充足性 / CONST_007（単一サイクルスコープ）整合 / 不変条件 8 項目 / blocker・non-blocker 仕分け |
| ゲート出力 | PASS → Phase 11（手動テスト / Evidence 計画）へ進行 |
| タスク分類 | UI task（VISUAL）。Phase 11 で screenshot 証跡を取る計画 |
| implementation_mode | `feature-extension`（既存 API の client-side bounded fan-out。新 endpoint / D1 変更なし） |
| PR base | `dev`（production リリース時のみ `main`） |

> automation-30 update: 初稿では実装着手前の最終設計レビューゲートだったが、CONST_004/005 に従い本サイクルで実装まで完了した。以下は設計ゲートとしての判定を保持しつつ、current facts は Phase 12 compliance check を正とする。

---

## AC-1〜9 最終充足判定テーブル

各 AC について「設計上の根拠」と「対応 phase / 成果物」を引用し、最終充足を判定する。

| # | AC | 設計上の根拠 | 対応 phase | 判定 |
| --- | --- | --- | --- | --- |
| AC-1 | bulk rollback mode で複数 resolve 履歴行を checkbox 選択し、confirm modal を介して一括 rollback できる | FR-1〜FR-6 で mode トグル / 行 checkbox / select-all / confirm modal / fan-out submit を確定。`SchemaDiffPanel` の HistoryPane に `bulkRollbackMode` を追加し `SchemaDiffBulkRollbackModal` を条件 mount する設計が確定済み | phase-01 FR-1〜6 / phase-02 データフロー・UI 設計 / phase-05 Step 2〜4 / phase-04 PANEL-BR-01,03 | PASS |
| AC-2 | 1 件でも version mismatch（409）がある場合、成功分は確定し失敗分のみ理由付きで残る（per-alias 独立 commit） | transaction 境界を **per-alias 独立 commit** に決定（全件 atomic は web 層から D1 binding 横断 transaction を張れず不可能）。`rollbackSchemaAliasBulk` が row 単位で例外を `SchemaAliasRollbackBulkRowResult` に変換し、1 row の失敗が他 row を中断しない。成功分のみ `selectedIds` から除去 | index.md アーキ決定表 / phase-02 transaction 境界注記・ロック解放経路 / phase-04 RBLK-03,HOOK-09 | PASS |
| AC-3 | audit log から各 alias の rollback 結果を追跡できる（per-alias `schema_alias.rollback` 記録） | audit log 粒度を **per-alias 記録（既存 single rollback endpoint が emit）を正本**に決定。bulk helper は `rollbackSchemaAlias` を row 数分呼ぶため、既存 endpoint が per-alias `schema_alias.rollback` を D1 に記録する。spec で row 数ぶん呼ばれることを mock spy 検証、staging audit log は Phase 11 evidence で確認 | index.md アーキ決定表 / phase-05 副作用記述 / phase-09 AC-3 行 | PASS |
| AC-4 | UI が「全成功 / 部分成功 / 全失敗」を区別して表示する | FR-9 で summary 区別表示を確定。modal に `data-role="bulk-rollback-summary"` を付与し、`summary.error === 0` / `error>0 && success>0` / `success===0` で 3 状態を OKLch token（success / warning / danger）で描き分け | phase-01 FR-9 / phase-02 modal 表示要素 6 / phase-04 MOD-09,10,11 | PASS |
| AC-5 | 50 件超過時に confirm が抑止され、分割実行を促す alert が表示される | FR-10 で 50 件上限を確定。`BULK_ROLLBACK_MAX_ROWS = 50` 定数を定義し、UI 側は `selectedCount > BULK_LIMIT` で「一括取消」ボタンを disabled + alert 表示、helper 側も 51 件で `RollbackApiError("bulk_limit_exceeded")` を throw する二重防御 | phase-01 FR-10 / phase-02 helper 実装方針・Panel limit 判定 / phase-04 RBLK-06,PANEL-BR-04 | PASS |
| AC-6 | 既存 single rollback / undo 経路、bulk resolve 経路が回帰なし | 既存 `rollbackSchemaAlias` / `RollbackApiError` / single rollback UI / bulk resolve UI の contract を破壊禁止（不変条件6）。bulk rollback path は新規 helper / 新規 component で並走し、bulk rollback mode OFF 時は現行 UI を維持。bulk resolve mode と非干渉 | 不変条件6 / phase-02 再利用表 / phase-04 PANEL-BR-02,06,07 / phase-09 AC-6 行 | PASS |
| AC-7 | 楽観ロック検証ロジックが single 経路と単一定義で共有される | NFR-1 で SSOT を確定。`rollbackSchemaAliasBulk` は既存 `rollbackSchemaAlias`（`If-Match: version=<N>` 付き）を per-row で再利用し、楽観ロック検証を重複実装しない。`If-Match` 定義は 1 箇所のみ（grep 検証） | phase-01 NFR-1 / phase-02 再利用表 / phase-09 AC-7 行（`grep -rn "If-Match"` 1 箇所） | PASS |
| AC-8 | spec test が partial failure / all-fail / all-success / 50 件上限シナリオを含めて green | RBLK-01〜08 / MOD-01〜14 / HOOK-01〜13 / PANEL-BR-01〜07 / E2E-BR-01〜04 が partial / all-fail / all-success / 50 件上限を網羅。命名は `*.spec.{ts,tsx}` のみ | phase-04 テストケース表 / phase-06 補強 / phase-09 AC-8 行 | PASS |
| AC-9 | design token 違反 0（OKLch のみ。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止） | NFR-3 で OKLch 限定を確定。新規 modal / hook / `SchemaDiffPanel.tsx` 差分は CSS custom property（`--color-success` / `--color-warning` / `--color-danger`）のみ使用。`verify-design-tokens` gate で fail 判定 | phase-01 NFR-3 / phase-05 Step 3 design token 遵守 / phase-09 AC-9 行（gate + grep） | PASS |

> **9 件すべて PASS**。各 AC は phase-01 の要件、phase-02 の設計、phase-04 のテスト、phase-09 の検証コマンドへトレース可能で、focused Vitest / typecheck により local Green 化済み。

---

## blocker / non-blocker 判定

| 分類 | 項目 | 内容 | 対応 |
| --- | --- | --- | --- |
| blocker | （なし） | AC-1〜9 / 不変条件 / CONST_007 すべて設計上充足。実装着手を妨げる未決定事項なし | — |
| non-blocker | NFR-5 性能（30 件 / 30 秒以内） | spec mock では実環境と乖離するため、計測は Phase 11 manual evidence（local dev / branch preview）を正本とする。設計上は concurrency 8 で達成見込み | Phase 11 `perf-30rows.md` で実測 |
| non-blocker | staging audit log 確認（AC-3） | spec の mock spy では per-alias 呼び出し回数まで検証可能だが、実 D1 への `schema_alias.rollback` レコード生成は staging 実機でのみ最終確認できる | Phase 11 evidence（PR 後 runtime gate でも再取得可） |
| non-blocker | bulk rollback mode と bulk resolve mode の排他 UI | 独立 state 共存で実装し、HistoryPane 側 bulk rollback と diff pane 側 bulk resolve を分離 | focused panel regression で非干渉を確認 |

> **blocker 0 件**。local implementation / focused tests は完了。runtime visual evidence のみ user-gated。

---

## CONST_007（単一サイクルスコープ）整合確認

| 確認項目 | 結果 |
| --- | --- |
| 全成果物が今回サイクルで実装完了したか | **Yes**。変更対象は 4 実装ファイル（`api.ts` 編集 / `useSchemaDiffBulkRollbackSelection.ts` 新規 / `SchemaDiffBulkRollbackModal.tsx` 新規 / `SchemaDiffPanel.tsx` 編集）+ focused specs + spec docs。既存 `rollbackSchemaAlias` / `runWithConcurrency` の再利用により分量先送りなし |
| deferral がスコープ外理由で明記されているか | **Yes**。単体 rollback / undo（#778 完了済）、recompute trigger（followup-005 分離済）、rollback notification（followup-007 分離済）はいずれも独立 Issue / unassigned-task として既に分離済で「分量先送り」ではない |
| batch parent-child audit のみが API/D1 変更を要するスコープ外として明記されているか | **Yes**。index.md「含まないもの」表および CONST_007 注記で、batch parent-child audit log 構造は **D1 schema migration + API route 変更を要し、本タスク不変条件「API/D1 変更なし」と衝突する独立 DB 設計スコープ**であること、per-alias 記録で AC-3 を充足するため機能 gap は生じないことを明記済み |

> CONST_007 整合: **PASS**。本タスクは 1 サイクルで完了する粒度であり、deferral は「分量先送り」ではなく「別関心の分離」または「API/D1 変更を要する独立スコープの除外」に限定されている。

---

## 不変条件 8 項目 最終チェック（index.md と整合）

| # | 不変条件 | 設計での担保 | 判定 |
| --- | --- | --- | --- |
| 1 | 既存 API endpoint surface のみ使用（`POST /admin/schema/aliases/:aliasId/rollback` を per-alias で fan-out。新 endpoint 追加なし） | bulk helper は既存単体 endpoint を row 数分呼ぶのみ。新 endpoint 定義なし（phase-02 / phase-05） | PASS |
| 2 | D1 schema / API route は変更しない | `apps/api/` 配下に変更ファイルなし（phase-09 不変条件再確認 `git diff --name-only HEAD \| grep apps/api/` → 0 件） | PASS |
| 3 | design token は OKLch のみ（HEX 直書き禁止 / `verify-design-tokens` gate green） | 新規 modal / panel 差分は OKLch custom property のみ（phase-05 Step 3 / phase-09 AC-9） | PASS |
| 4 | env access は `getEnv()` / `getPublicEnv()` 経由（`process.env.*` 直接参照禁止） | 新規ファイルで `process.env.*` 直接参照なし（phase-09 不変条件再確認 grep） | PASS |
| 5 | test file は `*.spec.tsx` / `*.spec.ts` 固定（`*.test.*` 禁止） | phase-04 追加 5 ファイルすべて `*.spec.{ts,tsx}`。`*.test.*` 0 件（phase-09 find 確認） | PASS |
| 6 | 既存 `rollbackSchemaAlias` / `RollbackApiError` / single rollback UI / bulk resolve UI の contract 破壊禁止（新規 helper / component で並走） | bulk path は新規 helper・新規 component で並走。既存資産は改変しない（phase-02 再利用表 / phase-05 変更しないファイル一覧） | PASS |
| 7 | D1 直接アクセス禁止（`apps/web` から `apps/api` 経由のみ） | `apps/web/src/` に `D1Database` / `env.DB` 参照なし（phase-09 grep → 0 件維持） | PASS |
| 8 | admin UI form input は `FormField` 経由を標準とし新規 `<input>` を直接増やさない（checkbox は selection control 例外・`aria-label` 必須） | bulk rollback の checkbox は selection control のため `FormField` 例外。全 checkbox に `aria-label` 付与（phase-02 FR-2 / phase-04 PANEL-BR aria-label assertion） | PASS |

> 不変条件 8 項目 **すべて PASS**。実装着手前の設計レビュー段階で違反は検出されない。各項目は phase-09 の検証コマンドへトレース可能。

---

## ゲート判定

| 判定軸 | 結果 |
| --- | --- |
| AC-1〜9 最終充足 | 9/9 PASS |
| blocker | 0 件 |
| CONST_007 整合 | PASS |
| 不変条件 8 項目 | 8/8 PASS |
| **総合ゲート判定** | **PASS → Phase 11（手動テスト / Evidence 計画）へ進行** |

## 完了条件

- [ ] AC-1〜9 の最終充足判定が PASS（上表）
- [ ] blocker 0 件 / non-blocker は実装サイクル内で解消可能と確認
- [ ] CONST_007 整合確認（1 サイクル完了 / deferral 理由明記 / batch parent-child audit のスコープ外理由）
- [ ] 不変条件 8 項目すべて PASS（index.md と整合）
- [ ] ゲート判定 PASS で Phase 11 へ進行
