# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-21 Sheets sync 仕様を Forms sync 現行正本へ吸収する close-out |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-30 |
| 前 Phase | 2（設計：移植マトリクス設計 + no-new-endpoint-policy） |
| 次 Phase | 4（テスト戦略） |
| 状態 | spec_created |
| タスク分類 | docs-only / specification-cleanup（design review） |

## 目的

Phase 2 の設計成果物（`migration-matrix-design.md` / `no-new-endpoint-policy.md`）に対して 3 件以上の代替案を比較し、4条件（価値性 / 実現性 / 整合性 / 運用性）と本タスク固有の 4 観点（不変条件 #1/#4/#5/#7 / docs-only 境界 / 派生タスク委譲品質 / no-new-endpoint-policy の強度）に対する PASS / MINOR / MAJOR 判定を確定し、Phase 4 以降に進むための着手可否ゲートを通すこと。

## 実行タスク

1. 代替案を最低 3 件列挙する（A: umbrella close-out + 移植マトリクス（Phase 2 採用） / B: UT-21 direct implementation 継続 / C: UT-21 完全削除（仕様書ごと削除） / D: ハイブリッド（一部 Sheets 経路を残す））（完了条件: 4 案以上が比較表に並ぶ）。
2. 各代替案に対し 4条件 + 4 観点で PASS / MINOR / MAJOR を付与する（完了条件: マトリクス空セルゼロ）。
3. base case（Phase 2 採用案 = umbrella close-out）を選定理由付きで確定する（完了条件: 選定理由が代替案比較から導出されている）。
4. PASS / MINOR / MAJOR の判定基準を定義する（完了条件: 各レベルの基準文が記載）。
5. 着手可否ゲートを定義する（完了条件: GO / NO-GO 判定基準が Phase 4 移行の前提として明示されている）。
6. 残課題（open question）を Phase 4 以降 / 派生タスクに明示的に渡す（完了条件: open question が 0 件 or 受け皿が指定）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/phase-02.md | レビュー対象設計 |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-02/migration-matrix-design.md | base case の構造 |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-02/no-new-endpoint-policy.md | base case の禁止方針 |
| 必須 | docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md | UT-21 当初仕様（legacy。代替案 B/D の根拠） |
| 必須 | docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md | 姉妹 close-out（base case の参考） |
| 必須 | .claude/skills/aiworkflow-requirements/references/task-workflow.md | current facts |

## 代替案比較

### 案 A: umbrella close-out + 移植マトリクス（base case = Phase 2 採用）

- 概要: UT-21 を legacy として残し、有効品質要件 4 種を 03a / 03b / 04c / 09b に移植。`POST /admin/sync` / `GET /admin/sync/audit` は新設禁止、`sync_audit_logs` / `sync_audit_outbox` は U02 判定まで保留、実装パス境界整理は U05 委譲。
- 利点:
  - 本タスクが docs-only に閉じ、二重正本化リスクを構造的に排除
  - 03a / 03b / 04c / 09b の既存責務分離（`job_kind` 単一責務原則）を維持
  - Sheets 経路への復帰誘惑を no-new-endpoint-policy で構造的にロック
  - 姉妹 `task-sync-forms-d1-legacy-umbrella-001` と同形式で運用一貫性が高い
- 欠点:
  - 派生タスク U02 / U04 / U05 が同時並行する場合、cross-link の維持コストが発生
  - 移植 patch 案は提示のみで、実適用は各タスクの Phase に依存する間接的経路

### 案 B: UT-21 direct implementation 継続（当初仕様どおり実装）

- 概要: UT-21 を Sheets API v4 ベースで `apps/api/src/sync/{core,manual,scheduled,audit}.ts` を新設して直接実装。`POST /admin/sync` / `GET /admin/sync/audit` を新設し、`sync_audit_logs` / `sync_audit_outbox` も新設。
- 利点: 単一 endpoint で操作が単純、UT-21 仕様書を変更不要
- 欠点:
  - 価値性 MAJOR: Forms sync 経路（`apps/api/src/jobs/sync-forms-responses.ts` + `apps/api/src/sync/schema/*`）と二重実装が走り、`responseId` / `memberId` / consent snapshot の整合性が壊れる
  - 整合性 MAJOR: 不変条件 #1（schema 固定回避）+ #7（Forms 再回答経路）に抵触、姉妹 close-out `task-sync-forms-d1-legacy-umbrella-001` の方針と直接矛盾
  - 実現性 MAJOR: Sheets API 連携の secret / クォータ / 列インデックス前提を新規導入する負荷が大きい
  - docs-only 境界 MAJOR: 本タスクスコープを完全に逸脱

### 案 C: UT-21 完全削除（仕様書ファイルごと削除）

- 概要: `UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md` をリポジトリから削除し、close-out も行わない。
- 利点: 仕様書群が縮小し、誤読リスクが消える
- 欠点:
  - 整合性 MAJOR: GitHub Issue #234（CLOSED）の根拠ファイルが消失し、過去判断のトレーサビリティが失われる
  - 価値性 MINOR: 有効品質要件 4 種の移植根拠も消えるため、03a / 03b / 04c / 09b 側で「なぜこの AC が必要か」の系譜が辿れなくなる
  - 運用性 MAJOR: スコープ外の git 履歴改変（または削除）が必要、姉妹 `task-sync-forms-d1-legacy-umbrella-001` の方針（legacy として残す）と不整合

### 案 D: ハイブリッド（Sheets 経路を最小限残しつつ Forms sync を主経路化）

- 概要: Forms sync を主経路としつつ、Sheets sync を「フォールバック / 比較」経路として最小限残す。`POST /admin/sync` を新設し、内部で `job_kind` で分岐。
- 利点: UT-21 投資の一部を活用、Sheets と Forms の差分検出が可能
- 欠点:
  - 価値性 MINOR: フォールバック経路の運用負荷が継続的に発生
  - 整合性 MAJOR: `job_kind` 単一責務原則に反する単一 endpoint 統合、不変条件 #1 / #7 抵触
  - 実現性 MINOR: 二経路の整合性テストが恒常的に必要
  - no-new-endpoint-policy MAJOR: `POST /admin/sync` を新設せざるを得ず、本タスクの Phase 2 方針と直接矛盾

### 代替案 × 評価マトリクス

| 観点 | 案 A (base) | 案 B (direct impl 継続) | 案 C (完全削除) | 案 D (ハイブリッド) |
| --- | --- | --- | --- | --- |
| 価値性 | PASS | MAJOR（二重実装で整合性崩壊） | MINOR（移植根拠喪失） | MINOR（フォールバック運用負荷） |
| 実現性 | PASS | MAJOR（Sheets 連携新規導入負荷） | PASS | MINOR（二経路テスト負荷） |
| 整合性（不変条件 #1/#4/#5/#7） | PASS | MAJOR（#1 / #7 抵触） | MAJOR（Issue #234 トレース喪失） | MAJOR（#1 / #7 抵触） |
| 運用性 | PASS | MINOR（運用窓口二重化） | MAJOR（git 履歴改変） | MINOR（恒常的整合性検査） |
| docs-only 境界 | PASS | MAJOR（境界破壊） | PASS | MAJOR（境界破壊） |
| 派生タスク委譲品質 | PASS | N/A | MAJOR（U02 / U04 / U05 経路喪失） | MINOR |
| no-new-endpoint-policy 強度 | PASS（強い禁止） | MAJOR（policy 不成立） | N/A | MAJOR（policy 直接違反） |
| CLOSED Issue #234 整合 | PASS | MINOR（再オープン圧） | MAJOR（根拠ファイル消失） | MINOR |

## base case 選定理由

案 A を採用する理由:

1. 本タスクが docs-only / legacy umbrella close-out として定義されており（Phase 1 真の論点）、案 B / D はスコープを完全逸脱する
2. 不変条件 #1（schema 固定回避）+ #7（Forms 再回答経路）と矛盾しないのは案 A のみ。案 B / D は Sheets 経路を導入する時点で抵触
3. 姉妹 `task-sync-forms-d1-legacy-umbrella-001` が同形式の legacy umbrella close-out で確立済み。案 A はその運用一貫性を継承する
4. CLOSED Issue #234 の根拠ファイル（UT-21 仕様書）を残しつつ legacy としてラベリングできるのは案 A のみ。案 C は git 履歴改変を伴う運用性 MAJOR
5. no-new-endpoint-policy の強度は案 A のみが PASS。案 B / D は policy 自体が成立しない

## PASS / MINOR / MAJOR 判定基準

| レベル | 基準 |
| --- | --- |
| PASS | 4条件・各観点を完全に満たし、blocker / 残課題なし |
| MINOR | 軽微な懸念がある（例: 派生タスクとの cross-link 維持コスト、運用上の手間が増えるが許容範囲） |
| MAJOR | 着手不可レベルの懸念（例: 不変条件抵触、no-new-endpoint-policy 違反、docs-only 境界破壊、Issue #234 トレース喪失） |

## 着手可否ゲート

| 判定 | 条件 |
| --- | --- |
| GO | base case（案 A）の 4条件 + 全観点が PASS、open question が 0 件または受け皿が指定されている |
| NO-GO | base case で MAJOR が 1 件以上、または不変条件 #1 / #4 / #5 / #7 抵触の懸念が解消できていない、または no-new-endpoint-policy が「将来検討」など曖昧表現になっている |

本タスクは **GO 判定**（案 A の全観点が PASS）。

## open question / Phase 4 以降への申し送り

| # | 残課題 | 受け皿 Phase / タスク | 備考 |
| --- | --- | --- | --- |
| 1 | 移植 patch 案が 03a / 03b / 04c / 09b の AC 番号付与でコリジョンする可能性 | Phase 5（実装ランブック） | 各タスクの最終 AC 番号を Phase 5 で再確認 |
| 2 | `sync_audit_logs` / `sync_audit_outbox` の必要性最終判定 | UT21-U02（`task-ut21-sync-audit-tables-necessity-judgement-001`） | 本タスクでは扱わない |
| 3 | 実 secrets / 実 D1 環境での manual smoke 再実行 | UT21-U04（`task-ut21-phase11-smoke-rerun-real-env-001`） | NON_VISUAL 証跡として |
| 4 | `apps/api/src/sync/*` 想定と現行構成の境界整理 | UT21-U05（`task-ut21-impl-path-boundary-realignment-001`） | 本タスクでは扱わない |
| 5 | UT-21 仕様書状態欄への close-out 注記反映タイミング | Phase 12（ドキュメント更新） | legacy ラベル付与のタイミングを明示 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | GO 判定・PASS/MINOR/MAJOR 基準・open question を test strategy 入力として渡す |
| Phase 5 | 派生タスク委譲境界・移植 patch 案 最小フィールドを実装ランブックの入力として渡す |
| Phase 10 | base case 選定理由を最終 GO/NO-GO 判定の根拠として再利用 |
| Phase 12 | 派生タスク列挙（U02 / U04 / U05）への cross-link 出力に open question 2/3/4 を反映 |

## 多角的チェック観点（AIが判断）

- base case 選定理由が代替案比較マトリクスから演繹的に導かれているか
- 全代替案 × 全観点でセル空白がないか
- MAJOR 判定がついた案を base case に選んでいないか
- 残課題が必ずどこかの Phase / 派生タスクで受け皿を持つか
- 不変条件 #1 / #4 / #5 / #7 抵触が代替案比較に組み込まれているか
- no-new-endpoint-policy の強度判定が「将来検討」など曖昧表現に流されていないか
- CLOSED Issue #234 を再オープンする選択肢が誤って選ばれていないか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 代替案 4 件以上を列挙 | 3 | spec_created | A/B/C/D |
| 2 | 4条件 + 4 観点マトリクスで判定 | 3 | spec_created | 空セルゼロ |
| 3 | base case 選定理由 | 3 | spec_created | 案 A |
| 4 | PASS/MINOR/MAJOR 基準定義 | 3 | spec_created | 3 段階 |
| 5 | GO/NO-GO ゲート定義 | 3 | spec_created | GO 判定 |
| 6 | open question 受け皿 | 3 | spec_created | 5 件すべて受け皿あり |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | 設計レビュー主成果物（代替案 4 件・マトリクス・選定理由・GO/NO-GO） |
| メタ | artifacts.json | Phase 3 状態の更新 |

## 完了条件チェックリスト

- [ ] 代替案が 4 件以上列挙されている（A/B/C/D）
- [ ] 各代替案 × 4条件 + 4 観点で空セルがない
- [ ] base case（案 A）の選定理由が 5 項目以上記述されている
- [ ] PASS / MINOR / MAJOR の基準が定義されている
- [ ] GO / NO-GO ゲートが定義され、本タスクが GO 判定であることが明記されている
- [ ] open question が 0 件、または受け皿 Phase / 派生タスクが指定されている
- [ ] no-new-endpoint-policy 強度が PASS と判定されている

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `spec_created`
- 全成果物が `outputs/phase-03/` 配下に配置予定
- 不変条件 #1 / #4 / #5 / #7 抵触懸念が代替案比較に組み込まれている
- artifacts.json の `phases[2].status` が `spec_created`

## 次 Phase への引き継ぎ

- 次 Phase: 4（テスト戦略）
- 引き継ぎ事項:
  - GO 判定根拠（案 A の全観点 PASS）
  - PASS / MINOR / MAJOR 基準
  - open question 5 件と受け皿（Phase 5 / U02 / U04 / U05 / Phase 12）
  - no-new-endpoint-policy 強度判定 PASS
- ブロック条件:
  - base case で MAJOR が 1 件以上残存
  - open question に受け皿のないものがある
  - 不変条件 #1 / #4 / #5 / #7 抵触懸念が解消されていない
  - no-new-endpoint-policy が曖昧表現に変質している
