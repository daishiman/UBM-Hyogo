# 未タスク検出レポート — tag physical delete force-migration（参照付き tag の強制移行）

**[実装区分: implementation / NON_VISUAL / implemented_local_evidence_captured]**

## 検出サマリー

- Issue #1117 の受入条件（AC-1..AC-7）は **本実装仕様書で全達成設計**（強制移行 / PK 衝突吸収 / COUNT=0 再検証後の物理削除 / audit / 移行先検証 / 逆移行 runbook / AC-7 退化防止 にすべて写像）。AC 内の未割当はゼロ。
- 本タスク自体が **親 issue-1070 の未タスク U-1（physical delete 参照あり時の強制移行 migration）を解消するために起票・spec 化されたもの** である。よって本サイクルで **新規に formalize すべき current 未タスクは 0 件**。
- スコープ外の別関心事（DB-FK 追加 / admin UI 導線）は **親 issue-1070 の close-out で既に formalize 済み**（U-3 / U-2）。本サイクルでは **参照のみ** とし、重複起票しない。

## current / baseline 分離

| 区分 | 内容 |
| --- | --- |
| **current（Issue #1117 AC スコープ内・本サイクルで処理）** | 強制移行経路（`migrateMemberTagReferences` / `forceMigrateAndPhysicalDeleteTagDefinition`）+ `?migrateTo` 分岐 + error code 3 種 + audit `references_migrated` + 移行先検証 + COUNT=0 再検証 + AC-6 逆移行 runbook + AC-7 regression。本仕様書で全達成設計（**新規未タスク 0 件**） |
| **baseline（Issue #1117 AC スコープ外・既 formalize / 別 Issue）** | B-1（admin UI 導線・親 U-2 相当）/ B-2（`member_tags` DB-FK 追加・親 U-3 相当）。いずれも親 issue-1070 の `unassigned-task-detection.md` で既に formalize 済み。本サイクルで重複起票しない |
| **excluded（Phase 10 §5 R-3・YAGNI 判定で未タスク化しない）** | B-3（複数 dest への分割移行 / 条件付き移行・Phase 10 R-3 相当）。具体的需要ゼロの「合意未済の仕様拡張」であり、現 AC（単一 dest 全件移行）で完結。未タスク化せず（下記 B-3 参照） |

## current 新規未タスク（本サイクル）

- **0 件**。
- 理由: 本タスクは親 issue-1070 の U-1（強制移行）を解消する目的で起票された。AC-1..AC-7 を全達成設計で写像済みであり、AC 内に未割当はない。Phase 3 §3.2 のリスク（PK 衝突 / 移行後残参照 / AC-7 退化 / 移行先誤指定 / `member_tags` 追加列取りこぼし）はすべて Phase 4 テスト設計 + runbook + Phase 5 実装注記に織り込み済みで、追加で未タスク化すべき残件はない。

## baseline（スコープ外・親 issue-1070 で既 formalize・参照のみ）

### B-1: admin UI からの強制移行 / 物理削除導線（= 親 U-2 相当）

| 項目 | 内容 |
| --- | --- |
| 関心事 | `apps/web` admin-ui から強制移行（`?migrateTo` 指定）/ physical delete を呼ぶ UX 導線（移行先選択 UI・確認ダイアログ・409 referenceCount 表示） |
| Issue #1117 との関係 | **AC に含まれない**。本 issue の AC-1..AC-7 はすべて API endpoint。UI 統合はスコープ外 |
| 既 formalize 先 | 親 `issue-1070` の `unassigned-task-detection.md` U-2（admin UI 導線）。本サイクルで重複起票しない |
| Issue 起票 | user-gated（親 U-2 を参照元にする） |

### B-2: `member_tags` への DB-level FOREIGN KEY 追加評価（= 親 U-3 相当）

| 項目 | 内容 |
| --- | --- |
| 関心事 | `member_tags.tag_id` に `tag_definitions.tag_id` への DB-level FOREIGN KEY を追加するか評価する |
| Issue #1117 との関係 | **AC に含まれない**。本タスクの移行・ガードは application-level SQL（`INSERT OR IGNORE`+`DELETE` 原子 batch + COUNT=0 再検証）で完結し、FK 追加は不要。FK 追加は schema governance タスク（seed / ingest / migration ordering / D1 enforcement への影響評価を伴う） |
| 既 formalize 先 | 親 `issue-1070` の `unassigned-task-detection.md` U-3（DB-level FK 評価）。本サイクルで重複起票しない |
| Issue 起票 | user-gated（親 U-3 を参照元にする） |

### B-3: 複数 dest への分割移行 / 条件付き移行（= Phase 10 §5 R-3・YAGNI で未タスク化しない）

| 項目 | 内容 |
| --- | --- |
| 関心事 | 物理削除対象 tag の参照を、条件（member 属性等）に応じて **複数の dest tag へ分割移行**する拡張。現 AC は単一 dest への全件移行のみ |
| Issue #1117 との関係 | **AC に含まれない**。AC-1..AC-7 は単一 dest 全件移行で凍結。分割 / 条件付き移行は仕様外 |
| 判定 | **YAGNI（未タスク化しない）**。具体的需要・運用要件がゼロの「合意未済の仕様拡張」（Phase 10 §5 R-3 が「要件確定後の別 Issue」と明記）。親 issue-1070 の U-1/U-2/U-3 にも含まれず、現状で formalize する根拠がない。要件が顕在化した時点で別途起票する |
| Phase 10 §6 との整合 | Phase 10 §6 は R-1..R-3 を本 detection へ「未タスク候補として登録」と予告していたが、R-3 は YAGNI 判定により **current 未タスクには昇格させず本節（excluded）に明記**する。R-1→B-2 / R-2→B-1（親 1070 既 formalize）/ R-3→B-3（YAGNI 除外）で 3 件すべてを追跡し、脱落はない |
| Issue 起票 | しない（要件確定まで保留） |

## 関連タスク差分確認（重複起票防止・FB-CANCEL-004-2）

- **既存 Issue #1117（本タスク・CLOSED）**: 強制移行 + COUNT=0 再検証後の物理削除を spec 化。AC は全達成設計。新規未タスクは生まない。
- **親 issue-1070（completed）**: tag reactivate + physical delete。U-1（強制移行）/ U-2（admin UI）/ U-3（DB-FK）を既に formalize。本タスクは U-1 の解消であり、U-2/U-3 は本タスクのスコープ外として温存される。重複しない。
- **issue-1035（completed）**: tag master CRUD + logical delete。本タスク（強制移行）はその上に積む lifecycle 拡張で機能重複なし。
- **#1068（admin tag inline-create UI・spec_created）**: B-1（UI 導線）と同領域。起票時は #1068 / 親 U-2 と統合 or 後続として整理する（重複起票回避）。
- B-1（admin UI）と B-2（DB-FK）は親 issue-1070 で明示的にスコープ外と確定した設計判断由来であり、本サイクルで重複起票にはならない。

## コードコメント / skip 由来の未タスク（本サイクルでは該当なし）

| ソース | 確認 | 結果 |
| --- | --- | --- |
| コードコメント TODO/FIXME/HACK/XXX | 本タスク由来の TODO 追加なし（local code 実装済み） | 0 件 |
| `describe.skip` / `it.skip` | 本タスク由来の skip 追加なし | 0 件 |
| Phase 3 レビュー（3.2 リスク） | すべて Phase 4 テスト設計 + runbook + Phase 5 実装注記に織り込み済み | 未タスク化不要 |

## 結論

Issue #1117 AC スコープ内の未割当は **0 件**（本仕様書で全達成設計）。本サイクルで新規 formalize すべき **current 未タスクは 0 件**。スコープ外の B-1（admin UI 導線）/ B-2（DB-level FK 評価）は **親 issue-1070 で既に formalize 済み**、B-3（複数 dest 分割 / 条件付き移行・Phase 10 R-3）は **YAGNI 判定で未タスク化しない**（要件確定まで保留）。Phase 10 §5 の R-1..R-3 は R-1→B-2 / R-2→B-1 / R-3→B-3 として 3 件すべて追跡済みで脱落はない。Issue 起票はすべて **user-gated**。
