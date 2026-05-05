# Phase 3 Output: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | task-ut21-forms-sync-conflict-closeout-001 |
| Phase | 3 / 13（設計レビュー） |
| 前 Phase | 2（設計：移植マトリクス + no-new-endpoint-policy） |
| 次 Phase | 4（テスト戦略） |
| レビュー対象 | `outputs/phase-02/migration-matrix-design.md` / `outputs/phase-02/no-new-endpoint-policy.md` |
| 判定 | **GO**（base case = 案 A の 4条件 + 全観点 PASS） |

## 1. 目的

Phase 2 の設計成果物（移植マトリクス + no-new-endpoint-policy）に対し、最低 3 件以上の代替案を比較し、4条件（価値性 / 実現性 / 整合性 / 運用性）+ 4 観点（不変条件 #1/#4/#5/#7 / docs-only 境界 / 派生タスク委譲品質 / no-new-endpoint-policy 強度）に対する PASS / MINOR / MAJOR 判定を確定し、Phase 4 以降への着手可否ゲートを通す。

## 2. PASS / MINOR / MAJOR 判定基準

| レベル | 基準 |
| --- | --- |
| PASS | 4条件・各観点を完全に満たし、blocker / 残課題が全て受け皿付きである |
| MINOR | 軽微な懸念がある（例: 派生タスクとの cross-link 維持コスト、運用上の手間が許容範囲内で増える） |
| MAJOR | 着手不可レベルの懸念（例: 不変条件抵触、no-new-endpoint-policy 違反、docs-only 境界破壊、CLOSED Issue #234 トレース喪失） |

## 3. 代替案の列挙

### 案 A: umbrella close-out + 移植マトリクス（base case = Phase 2 採用）

- 概要: UT-21 を legacy として残し、有効品質要件 4 種を 03a / 03b / 04c / 09b に移植。`POST /admin/sync` / `GET /admin/sync/audit` は新設禁止、`sync_audit_logs` / `sync_audit_outbox` は U02 判定まで保留、実装パス境界整理は U05 委譲、実環境 smoke は U04 委譲
- 利点:
  - 本タスクが docs-only に閉じ、二重正本化リスクを構造的に排除
  - 03a / 03b / 04c / 09b の既存責務分離（`job_kind` 単一責務原則）を維持
  - Sheets 経路への復帰誘惑を no-new-endpoint-policy で構造的にロック
  - 姉妹 `task-sync-forms-d1-legacy-umbrella-001` と同形式で運用一貫性が高い
  - CLOSED Issue #234 を再オープンせず仕様書 cross-link で運用継続
- 欠点:
  - 派生タスク U02 / U04 / U05 が同時並行する場合、cross-link の維持コストが発生（Phase 12 で吸収可）
  - 移植 patch 案は提示のみで、実適用は各タスクの Phase に依存する間接的経路（Phase 5 で最小フィールド定義済み）

### 案 B: UT-21 direct implementation 継続（当初仕様どおり実装）

- 概要: UT-21 を Sheets API v4 ベースで `apps/api/src/sync/{core,manual,scheduled,audit}.ts` を新設して直接実装。単一 `POST /admin/sync` / `GET /admin/sync/audit` を新設し、`sync_audit_logs` / `sync_audit_outbox` も新設
- 利点: 単一 endpoint で操作が単純、UT-21 仕様書本体を変更不要
- 欠点:
  - 価値性 MAJOR: 現行 Forms sync 経路（`apps/api/src/jobs/sync-forms-responses.ts` + `apps/api/src/sync/schema/*`）と二重実装が走り、`responseId` / `memberId` / consent snapshot の整合性が崩壊
  - 整合性 MAJOR: 不変条件 #1（schema 固定回避）+ #7（Forms 再回答経路）に直接抵触、姉妹 close-out 方針と矛盾
  - 実現性 MAJOR: Sheets API 連携の secret / クォータ / 列インデックス前提を新規導入する負荷が大きい
  - docs-only 境界 MAJOR: 本タスクスコープを完全に逸脱
  - no-new-endpoint-policy MAJOR: policy 自体が成立しない

### 案 C: UT-21 完全削除（仕様書ファイルごと削除）

- 概要: `UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md` をリポジトリから削除し、close-out も行わない
- 利点: 仕様書群が縮小し、誤読リスクが消える
- 欠点:
  - 整合性 MAJOR: GitHub Issue #234（CLOSED）の根拠ファイルが消失し、過去判断のトレーサビリティが失われる
  - 価値性 MINOR: 有効品質要件 4 種の移植根拠も消えるため、03a / 03b / 04c / 09b 側で「なぜこの AC が必要か」の系譜が辿れなくなる
  - 運用性 MAJOR: スコープ外の git 履歴改変（または削除）が必要、姉妹 close-out の方針（legacy として残す）と不整合
  - 派生タスク委譲品質 MAJOR: U02 / U04 / U05 の上流根拠が消失

### 案 D: ハイブリッド（Sheets 経路を最小限残しつつ Forms sync を主経路化）

- 概要: Forms sync を主経路としつつ、Sheets sync を「フォールバック / 比較」経路として最小限残す。単一 `POST /admin/sync` を新設し、内部で `job_kind` で分岐
- 利点: UT-21 投資の一部を活用、Sheets と Forms の差分検出が可能
- 欠点:
  - 価値性 MINOR: フォールバック経路の運用負荷が継続的に発生
  - 整合性 MAJOR: `job_kind` 単一責務原則に反する単一 endpoint 統合、不変条件 #1 / #7 抵触
  - 実現性 MINOR: 二経路の整合性テストが恒常的に必要
  - no-new-endpoint-policy MAJOR: 単一 `POST /admin/sync` の新設を必須とし、本タスクの Phase 2 方針と直接矛盾
  - docs-only 境界 MAJOR: 境界破壊

### 案 E（追加列挙）: 移植マトリクスのみ採用 + no-new-endpoint-policy 省略

- 概要: 案 A から no-new-endpoint-policy を除き、移植マトリクスのみ提示する縮小版
- 利点: 本タスクのドキュメント量が減る
- 欠点:
  - no-new-endpoint-policy 強度 MAJOR: 単一 `POST /admin/sync` 新設誘惑が将来再発した場合、ブロックする仕様根拠が空白になる
  - 価値性 MINOR: 移植だけでは Sheets 経路復帰圧をロックできない
  - 整合性 MINOR: 姉妹 close-out との運用一貫性が部分的に欠落

## 4. 代替案 × 評価マトリクス（空セルゼロ）

| 観点 | 案 A (base) | 案 B (direct impl 継続) | 案 C (完全削除) | 案 D (ハイブリッド) | 案 E (policy 省略) |
| --- | --- | --- | --- | --- | --- |
| 価値性 | PASS | MAJOR（二重実装で整合性崩壊） | MINOR（移植根拠喪失） | MINOR（フォールバック運用負荷） | MINOR（policy 不在による再発リスク） |
| 実現性 | PASS | MAJOR（Sheets 連携新規導入負荷） | PASS | MINOR（二経路テスト負荷） | PASS |
| 整合性（不変条件 #1/#4/#5/#7） | PASS | MAJOR（#1 / #7 抵触） | MAJOR（Issue #234 トレース喪失） | MAJOR（#1 / #7 抵触） | MINOR（姉妹 close-out 方針と部分不整合） |
| 運用性 | PASS | MINOR（運用窓口二重化） | MAJOR（git 履歴改変） | MINOR（恒常的整合性検査） | MINOR（再発時の対応コスト） |
| docs-only 境界 | PASS | MAJOR（境界破壊） | PASS | MAJOR（境界破壊） | PASS |
| 派生タスク委譲品質 | PASS | MAJOR（U02 / U04 / U05 経路喪失） | MAJOR（上流根拠喪失） | MINOR | PASS |
| no-new-endpoint-policy 強度 | PASS（強い禁止） | MAJOR（policy 不成立） | N/A（仕様自体が消滅） | MAJOR（policy 直接違反） | MAJOR（policy 不在） |
| CLOSED Issue #234 整合 | PASS | MINOR（再オープン圧） | MAJOR（根拠ファイル消失） | MINOR（再オープン圧） | PASS |

## 5. base case 選定理由（5 項目以上）

案 A を採用する理由:

1. 本タスクが docs-only / legacy umbrella close-out として定義されており（Phase 1 真の論点）、案 B / D はスコープを完全逸脱する
2. 不変条件 #1（schema 固定回避）+ #7（Forms 再回答経路）と矛盾しないのは案 A のみ。案 B / D は Sheets 経路を導入する時点で抵触
3. 姉妹 `task-sync-forms-d1-legacy-umbrella-001` が同形式の legacy umbrella close-out として確立済み。案 A はその運用一貫性を継承する
4. CLOSED Issue #234 の根拠ファイル（UT-21 仕様書）を残しつつ legacy としてラベリングできるのは案 A のみ。案 C は git 履歴改変を伴う運用性 MAJOR
5. no-new-endpoint-policy の強度は案 A のみが PASS。案 B / D は policy 自体が成立せず、案 E は policy が空白のため再発リスクを残す
6. AC-10 検証コマンド出力（Phase 1 §10 / Phase 2 §(g)）が既に「単一 endpoint / 公開 audit endpoint / audit テーブルを新設しない」方針と完全整合しており、案 A の根拠を仕様書空間が裏書きしている

## 6. 4観点 個別判定（base case = 案 A）

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 不変条件 #1 / #4 / #5 / #7 | PASS | Phase 2 §(h) で全 4 条件への抵触ゼロを確認。`apps/web` から D1 アクセスを示唆する記述は本仕様書空間にゼロ |
| docs-only 境界 | PASS | コード / DDL / Zod schema / `packages/shared` の編集を一切含まない宣言が Phase 2 冒頭に明記 |
| 派生タスク委譲品質 | PASS | UT21-U02 / U04 / U05 が `unassigned-task/` 配下に別ファイル化済み、本仕様書から cross-link 済み |
| no-new-endpoint-policy 強度 | PASS | 「将来検討」「必要に応じて」等の曖昧表現を排除し、§4 例外条件 3 件をすべて満たす独立タスク起票時のみ解禁する明示構造 |

## 7. 着手可否ゲート（GO / NO-GO）

| 判定 | 条件 |
| --- | --- |
| GO | base case（案 A）の 4条件 + 全観点（不変条件 4 件 / docs-only 境界 / 派生タスク委譲 / policy 強度）すべて PASS、open question が 0 件または受け皿が指定されている |
| NO-GO | base case で MAJOR が 1 件以上、または不変条件 #1 / #4 / #5 / #7 抵触懸念が解消できていない、または no-new-endpoint-policy が「将来検討」など曖昧表現になっている |

**本タスク判定: GO**（案 A の全観点 PASS、open question 5 件すべてに受け皿あり）

## 8. open question / 受け皿（5 件、すべて受け皿あり）

| # | 残課題 | 受け皿 Phase / タスク | 備考 |
| --- | --- | --- | --- |
| 1 | 移植 patch 案が 03a / 03b / 04c / 09b の AC 番号付与でコリジョンする可能性 | Phase 5（実装ランブック） | 各タスクの最終 AC 番号を Phase 5 で再確認し再採番ルールを定義 |
| 2 | `sync_audit_logs` / `sync_audit_outbox` の必要性最終判定 | UT21-U02（`task-ut21-sync-audit-tables-necessity-judgement-001`） | 本タスクでは扱わない |
| 3 | 実 secrets / 実 D1 環境での manual smoke 再実行 | UT21-U04（`task-ut21-phase11-smoke-rerun-real-env-001`） | NON_VISUAL 証跡として |
| 4 | `apps/api/src/sync/*` 想定と現行構成の境界整理 | UT21-U05（`task-ut21-impl-path-boundary-realignment-001`） | 本タスクでは扱わない |
| 5 | UT-21 仕様書状態欄への close-out 注記反映タイミング | Phase 12（ドキュメント更新） | legacy ラベル付与のタイミングを明示 |

## 9. 多角的チェック結果

| 観点 | 結果 |
| --- | --- |
| base case 選定理由が代替案比較マトリクスから演繹的に導かれているか | OK（§5 が §4 マトリクスから演繹） |
| 全代替案 × 全観点でセル空白がないか | OK（§4、5 案 × 8 観点 = 40 セル全埋め） |
| MAJOR 判定がついた案を base case に選んでいないか | OK（案 A は全 PASS） |
| 残課題が必ずどこかの Phase / 派生タスクで受け皿を持つか | OK（§8、5 件すべて受け皿あり） |
| 不変条件 #1 / #4 / #5 / #7 抵触が代替案比較に組み込まれているか | OK（§4 整合性行 + §6 個別判定） |
| no-new-endpoint-policy の強度判定が「将来検討」など曖昧表現に流されていないか | OK（§3 案 A 概要 + Phase 2 `no-new-endpoint-policy.md §4` で明示禁止） |
| CLOSED Issue #234 を再オープンする選択肢が誤って選ばれていないか | OK（案 A は CLOSED 維持、§4 CLOSED Issue 整合行で確認） |

## 10. 統合テスト連携（次 Phase 引き継ぎ）

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | GO 判定 / PASS/MINOR/MAJOR 基準 / open question 5 件 を test strategy 入力として渡す |
| Phase 5 | 派生タスク委譲境界・移植 patch 案 最小フィールド（Phase 2 §(f)）を実装ランブックの入力として渡す |
| Phase 7 | AC matrix の左軸として AC-1〜AC-11、右軸として §4 マトリクス + §6 個別判定を再利用 |
| Phase 10 | base case 選定理由（§5）を最終 GO/NO-GO 判定の根拠として再利用 |
| Phase 12 | 派生タスク列挙（U02 / U04 / U05）への cross-link 出力に open question 2/3/4 を反映 |

## 11. 結論

- 本タスクは **GO 判定**。
- 案 A（umbrella close-out + 移植マトリクス + no-new-endpoint-policy + 派生タスク委譲）を base case として確定し、Phase 4 テスト戦略へ進む。
- 破棄再構成は不要。Phase 2 設計を Phase 4 以降の入力としてそのまま使用する。
- 実装は本タスク内では行わず、03a / 03b / 04c / 09b の Phase 内で受入条件 patch 案として吸収される。
