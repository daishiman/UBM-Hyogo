# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-09 canonical sync job implementation receiver |
| issue | #333 (U-UT01-07-FU01) |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-05-02 |
| Wave | 1 |
| 実行種別 | implementation（仕様書作成のみ・コード実装は本タスクでは行わない） |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | spec_created |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| workflow_state | spec_created |

## 目的

親タスク #261（U-UT01-07）Phase 2 で確定した canonical 名 `sync_job_logs` / `sync_locks` を、UT-09（Sheets→D1 同期ジョブ実装）が物理コードへ伝播させる際の「実装受け皿」を文書契約として確定する。本タスクは UT-09 タスク root の実在判定 + 必須参照リスト整備 + コード境界宣言を提供し、`apps/api/src/jobs/` `apps/api/src/sync/` 配下の同期ジョブ実装で canonical 名が正しく使われることを保証する。

## 真の論点 (true issue)

- 「UT-09 実装受け皿の path 確定で canonical 名がコードへ伝播する経路を切らないこと」が本質。親 #261 が docs-only で完結したため、canonical 名がコードへ降りる導線（必須参照リスト + AC + grep ガード）を別途整備しない限り、UT-09 着手時に再度命名議論が発生し reconciliation が逆流するリスクがある。
- 副次的論点として、UT-09 の正本タスク root が既存（completed-tasks 内 `u-04-serial-sheets-to-d1-sync-implementation`）か、新規 `UT-21-sheets-d1-sync-endpoint-and-audit-implementation` 系列か、unassigned に分散する `task-ut09-*.md` 群の集約先かを **棚卸しで確定**すること。
- 三次的論点として、enum 値（#262）/ retry・offset（#263）/ D1 schema 物理追加判定（UT-04）への侵食を起こさず、本タスクは「命名 canonical 名のコードへの引き渡し経路確定」のみを扱うこと。

## visualEvidence の確定

| 項目 | 値 | 根拠 |
| --- | --- | --- |
| visualEvidence | NON_VISUAL | API/バックエンド実装の受け皿確定であり、UI / スクリーンショット対象なし |
| 成果物の物理形態 | テキスト（Markdown） | `outputs/phase-0X/*.md` |
| 検証方法 | grep / Read による文書整合チェック、UT-04 / UT-09 / U-UT01-08 / U-UT01-09 視点での self-review | Phase 3 設計レビューゲートで判定 |

## 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流 | #261 U-UT01-07 Phase 2 正本4ファイル | canonical 名 `sync_job_logs` / `sync_locks` 採択（案 A）/ no-op 戦略 / 1:N マッピング表 / 直交性チェックリスト | UT-09 必須参照に4ファイルを登録 |
| 上流 | `apps/api/migrations/0002_sync_logs_locks.sql` | 物理側現状（read-only） | UT-09 実装で参照する canonical 名の根拠 |
| 上流 | `apps/api/src/jobs/sync-sheets-to-d1.ts` | 既存物理利用フロー（read-only） | UT-09 実装での canonical 名利用パターン |
| 下流 | UT-09 実装タスク（受け皿確定対象） | 本タスク確定の必須参照リスト + AC + コード境界 | canonical 名でコードを書く前提条件 |
| 下流 | UT-04 (D1 schema 設計) | `sync_log` 物理化禁止の明示 | 物理 schema 追加判定の前提条件 |
| 直交 | #262 U-UT01-08 (enum) | 本タスクは enum 値を**決定しない** | 直交性チェックリスト |
| 直交 | #263 U-UT01-09 (retry/offset) | 本タスクは retry / offset 値を**決定しない** | 直交性チェックリスト |

## ownership 宣言

| 物理位置 | ownership | 権限 |
| --- | --- | --- |
| `docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/outputs/**` | 本タスク | write（生成・更新） |
| UT-09 実装タスク root（受け皿として確定する path） | UT-09 | **本タスクは必須参照リスト追記のみ**（実装本体は UT-09 担当） |
| `apps/api/migrations/0002_sync_logs_locks.sql` | UT-04 / UT-09 既存物理 | **read-only**（本タスクは改変禁止） |
| `apps/api/src/jobs/sync-sheets-to-d1.ts` | UT-09 | **read-only**（参照名検証のみ。実装変更は UT-09） |
| `apps/api/src/sync/**`（新規ディレクトリ提案） | UT-09 | **本タスクは構造提案のみ**（実装は UT-09） |
| `.claude/skills/aiworkflow-requirements/references/database-schema.md` | aiworkflow-requirements skill | doc-only 更新可（drift 解消が必要な場合のみ） |

## 受入条件（AC）

issue #333 本文 AC-1〜AC-4 と完全一致させる。

- [ ] **AC-1（UT-09 実装受け皿確定）**: UT-09 実装タスクの実パスが `docs/30-workflows/**` 配下に確定し、U-UT01-07 unassigned detection から参照可能。Phase 2 `outputs/phase-02/ut09-receiver-path.md` に確定 path と確定根拠を記載
- [ ] **AC-2（canonical 名引き渡し）**: canonical 名 `sync_job_logs` / `sync_locks` が UT-09 実装タスクの必須参照および受入条件に反映され、親 #261 Phase 2 正本4ファイル絶対パスが UT-09 必須参照リストに登録されている。Phase 2 `outputs/phase-02/canonical-reference-table.md` に表形式で明文化
- [ ] **AC-3（`sync_log` 物理化禁止の明記）**: `sync_log` は概念名であり、UT-09 実装で物理テーブルとして `CREATE TABLE sync_log` / `ALTER TABLE sync_job_logs RENAME TO sync_log` / `DROP TABLE sync_job_logs` を行わないことが UT-09 受入条件に反映され、grep ガード（0 件）を検証手段として明示
- [ ] **AC-4（直交性維持）**: U-UT01-08 / U-UT01-09 / UT-04 との責務境界維持を `outputs/phase-02/orthogonality-checklist.md` のチェックリスト形式で確認

## 4 条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 親 #261 docs-only 完結後に切れる「コード伝播経路」を整備し、UT-09 着手時の命名議論逆流を未然に防ぐ。grep ガード可能な受入条件を提供 |
| 実現性 | PASS | 仕様書 4 ファイル + Phase 2 設計成果物のみ。コード変更は本タスクで行わない（UT-09 が後続実装）。read-only 参照のみで完結 |
| 整合性 | PASS | 不変条件 #5（D1 アクセスは apps/api 限定）を維持。親 #261 採択 case A（物理 canonical / no-op）と整合。`sync_log` 物理化禁止により親採択を保護 |
| 運用性 | PASS | UT-09 実装タスク root が確定することで unassigned detection から到達可能となり、ownership と必須参照が明示化される。rollback は Markdown revert のみ |

## 苦戦箇所と AC / 多角的チェックへの対応付け

| # | 苦戦箇所（要約） | 対応する AC / 観点 |
| --- | --- | --- |
| 1 | UT-09 正本 root が unassigned に複数ファイル散在し、どれを正本受け皿にすべきか不明瞭 | AC-1 + 多角的チェック「既存 root 棚卸し → 確定 path 1 つ提示」 |
| 2 | 親 #261 Phase 2 4ファイルが UT-09 必須参照に未登録だと canonical 名がコードに伝わらない | AC-2 + 多角的チェック「絶対パス列挙 + 受入条件への組み込み」 |
| 3 | UT-09 実装で「論理 `sync_log` を物理化」の善意の rename が混入するリスク | AC-3 + 多角的チェック「grep ガードによる検証手段の明示」 |
| 4 | enum / retry / offset / 物理 schema 追加判定への侵食 | AC-4 + 多角的チェック「U-UT01-08 / U-UT01-09 / UT-04 委譲ラベル」 |

## 多角的チェック観点

- **既存 root 棚卸し**: `docs/30-workflows/**` を `find` し UT-09 / U-04 / UT-21 / `task-ut09-*.md` を列挙、正本受け皿 1 件を決定根拠とともに採択
- **canonical 名引き渡し経路の網羅性**: UT-09 必須参照リストに親 Phase 2 4ファイルの絶対パスが含まれ、AC で参照義務を明文化
- **コード境界の grep ガード**: `CREATE TABLE sync_log` / `ALTER TABLE sync_job_logs RENAME` が 0 件であることを検証手段として AC-3 に組み込む
- **直交性**: enum / retry / offset / 物理 schema 追加判定の決定文言が**一切含まれていない**ことを成果物 grep で自己検証
- **aiworkflow-requirements drift**: `database-schema.md` の sync 系記述が canonical 名と整合しているか確認、必要なら doc-only 更新案を提示

## 完了条件チェックリスト

- [ ] artifacts.json.metadata.visualEvidence = NON_VISUAL 確定
- [ ] artifacts.json.metadata.taskType = docs-only 確定
- [ ] artifacts.json.metadata.workflow_state = spec_created 確定
- [ ] 真の論点が「コード伝播経路確定 + UT-09 root 棚卸し + 直交性維持」の 3 軸に再定義
- [ ] 4 条件評価が全 PASS で根拠付き
- [ ] 依存境界表に上流 3 / 下流 2 / 直交 2 すべて前提と出力付きで記述
- [ ] AC-1〜AC-4 が index.md と完全一致
- [ ] 苦戦箇所 4 件すべてが AC または多角的チェックに対応付け済み
- [ ] ownership 宣言で `apps/api/migrations/*.sql` / 既存 jobs コードが read-only と明示
- [ ] 不変条件 #5（D1 アクセス境界）への適合確認

## 実行手順

### ステップ 1: 上流入力の確認

- 親 #261 Phase 2 正本4ファイル（`naming-canonical.md` / `column-mapping-matrix.md` / `backward-compatibility-strategy.md` / `handoff-to-ut04-ut09.md`）を Read し、canonical 名 `sync_job_logs` / `sync_locks` 採択を再確認
- `apps/api/migrations/0002_sync_logs_locks.sql` を Read し物理側 schema を確認
- `apps/api/src/jobs/sync-sheets-to-d1.ts` を Read し物理側 lock / log 利用フローを確認

### ステップ 2: UT-09 既存 root の棚卸し

- `docs/30-workflows/**` 配下を `find` / grep し UT-09 系統ファイルを列挙
  - completed-tasks 配下: `u-04-serial-sheets-to-d1-sync-implementation` 等
  - unassigned-task 配下: `task-ut09-*.md` / `UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md` 等
- 正本受け皿候補を 1 件選定するための判断材料を収集

### ステップ 3: 真の論点の再定義

- 「コード伝播経路確定 + UT-09 root 棚卸し + 直交性維持」の 3 軸で `outputs/phase-01/main.md` 冒頭に明記

### ステップ 4: AC のロック

- AC-1〜AC-4 を `outputs/phase-01/main.md` に列挙し、index.md と完全一致させる

### ステップ 5: 4 条件評価の確定

- 全 PASS 根拠を表形式で固定。MINOR / MAJOR が出る場合は本 Phase で議論を完結させる

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 要件定義主成果物（真の論点・依存境界・AC・4 条件評価・苦戦箇所対応） |
| メタ | artifacts.json | Phase 1 状態の更新 + visualEvidence / taskType / workflow_state 確定 |

## 次 Phase への引き渡し

- 次 Phase: 2 (設計)
- 引き継ぎ事項:
  - 真の論点 = コード伝播経路確定 + UT-09 root 棚卸し + 直交性維持
  - 4 条件評価（全 PASS）の根拠
  - UT-09 既存 root 候補リスト（Phase 2 で確定 path 1 件採択）
  - canonical 名 `sync_job_logs` / `sync_locks` を UT-09 必須参照に登録する設計を Phase 2 で生成
  - `sync_log` 物理化禁止の grep ガード設計を Phase 2 で確定
  - U-UT01-08 / U-UT01-09 / UT-04 直交性チェックリストを Phase 2 で生成
- ブロック条件:
  - 4 条件のいずれかが MINOR / MAJOR
  - AC-1〜AC-4 が index.md と乖離
  - visualEvidence が NON_VISUAL 以外で誤確定
  - 既存物理 migration / 既存 jobs コードを改変する方針が紛れ込む
