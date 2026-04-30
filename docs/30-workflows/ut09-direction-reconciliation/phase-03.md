# Phase 3: 設計レビュー（30種思考法 / GO/NO-GO）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-09 direction reconciliation（task-ut09-direction-reconciliation-001） |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-29 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | spec_created |
| タスク状態 | blocked（GitHub Issue #94 は CLOSED でも仕様書 blocked） |
| タスク分類 | docs-only / direction-reconciliation（design review） |

## 目的

Phase 2 の reconciliation 設計（選択肢 A / B 比較マトリクス・撤回 / 移植マッピング・認可境界・D1 ledger 一意化・5 文書同期チェック）に対して、4 つ以上の代替案（A / B / B 部分採用 / 現状維持）を比較し、4条件（価値性 / 実現性 / 整合性 / 運用性）+ 観点（不変条件 #1/#4/#5/#6 / current facts 整合 / endpoint 認可 / D1 ledger 一意性 / Secret hygiene / 5 文書同期 / docs-only 境界 / staging smoke 表記 / unrelated 削除混入）に対する PASS / MINOR / MAJOR 判定を確定する。30 種思考法レビューで MAJOR が 0 件であることを着手可否ゲートで確認する。

## 実行タスク

1. 代替案を 4 つ以上列挙する（a: 採用 A / b: 採用 B / c: B 部分採用（schema は Forms 維持・response のみ Sheets）/ d: 現状維持（reconciliation せず PR 化））（完了条件: 4 案以上が比較表に並ぶ）。
2. 各代替案に対し 4条件 + 観点（13 観点）で PASS / MINOR / MAJOR を付与する（完了条件: マトリクスに空セルゼロ）。
3. base case（Phase 2 採用案 = 案 a / 採用 A）を current facts 整合・MAJOR ゼロ・MINOR ゼロから確定する（完了条件: 選定理由が代替案比較から導出されている）。
4. 30 種思考法すべてでレビュー結果を記述する（完了条件: Phase 3 の代表 8 種と Phase 10 の補完 22 種を合わせ、各思考法ごとに findings と判定）。
5. PASS / MINOR / MAJOR の判定基準を定義する（完了条件: 各レベルの基準文が記載）。
6. 着手可否ゲートを定義する（完了条件: GO / NO-GO 判定基準が Phase 4 移行の前提として明示）。
7. 残課題（open question）を Phase 4 以降に明示的に渡す（完了条件: open question が 0 件 or 受け皿 Phase が指定）。
8. 運用ルール 2 件（staging smoke pending を PASS と誤記しない / unrelated verification-report を本 PR に混ぜない）を明文化する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut09-direction-reconciliation/phase-01.md | 真の論点・4条件・Ownership 宣言 |
| 必須 | docs/30-workflows/ut09-direction-reconciliation/phase-02.md | レビュー対象設計（reconciliation-design.md / option-comparison.md） |
| 必須 | docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md | current 方針正本 |
| 必須 | docs/30-workflows/02-application-implementation/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/index.md | Forms schema sync 正本 |
| 必須 | docs/30-workflows/02-application-implementation/03b-parallel-forms-response-sync-and-current-response-resolver/index.md | Forms response sync 正本 |
| 必須 | docs/30-workflows/02-application-implementation/04c-parallel-admin-backoffice-api-endpoints/index.md | admin endpoint 正本 |
| 必須 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/index.md | 撤回 or 採用の対象 root |
| 必須 | CLAUDE.md | 不変条件 #1/#4/#5/#6 / solo 運用ポリシー |
| 参考 | .claude/skills/automation-30/references/patterns.md | 30 種思考法カタログ |

## 代替案比較

### 案 a: 採用 A（current Forms 分割方針へ寄せる / Phase 2 推奨 base case）

- 概要: Sheets API 実装・単一 `/admin/sync`・`sync_locks` + `sync_job_logs` migration を撤回し、品質要件（retry/backoff・short transaction・batch-size 制限）を 03a / 03b / 09b へ移植する。旧 UT-09 root を legacy umbrella 参照に戻す。
- 利点: current facts と完全整合、03a / 03b / 04c / 09b 無変更、不変条件 4 件すべて PASS、MAJOR ゼロ・MINOR ゼロ、ユーザー承認不要。
- 欠点: Sheets 実装の撤回コスト（別タスクで実施）、品質要件移植の工数。

### 案 b: 採用 B（Sheets 採用方針）

- 概要: legacy umbrella の方針更新、03a / 03b / 04c / 09b を Sheets API + 単一 `/admin/sync` 前提に再設計、aiworkflow-requirements references を same-wave 更新。
- 利点: Sheets 直接実装の短期実装コストが活きる。Service Account ベースの認証で運用が単純。
- 欠点: current facts MAJOR、不変条件 #6（GAS prototype 延長）の再検証必須、references 5 文書を same-wave 更新する負荷、ユーザー承認必須。

### 案 c: B 部分採用（schema は Forms 維持・response のみ Sheets）

- 概要: schema sync は Forms API、response sync は Sheets を回答受領手段として併用し、`/admin/sync/schema` と `/admin/sync/responses` の 2 endpoint を維持しつつ後者の上流のみ Sheets へ。
- 利点: 一部の Sheets 実装を活かせる。
- 欠点: 上流が schema と response で異なる責務分割が複雑化。`/admin/sync/responses` の認可・冪等性・current response resolver が破壊的に変化。整合性 MINOR、運用性 MINOR、責務境界 MAJOR 候補。

### 案 d: 現状維持（reconciliation せず PR 化）

- 概要: 二重正本のまま PR を作成し、後続タスクで個別に解消する。
- 利点: 短期的にはコスト低。
- 欠点: 後続 03a / 03b / 04c / 09b が連鎖 blocked、Phase 12 compliance を実態と乖離させる、PR レビュー負荷が増す。価値性 MAJOR、整合性 MAJOR、運用性 MAJOR。

### 代替案 × 評価マトリクス

| 観点 | 案 a (採用 A / base) | 案 b (採用 B) | 案 c (B 部分採用) | 案 d (現状維持) |
| --- | --- | --- | --- | --- |
| 価値性 | PASS | PASS | MINOR | MAJOR |
| 実現性 | PASS | MINOR | MINOR | PASS |
| 整合性（不変条件 #1） | PASS | PASS | PASS | PASS |
| 整合性（不変条件 #4） | PASS | PASS | PASS | PASS |
| 整合性（不変条件 #5） | PASS | PASS | PASS | PASS |
| 整合性（不変条件 #6） | PASS | MINOR | MINOR | MINOR |
| 整合性（current facts） | PASS | MAJOR | MAJOR | MAJOR |
| endpoint 認可（04c 整合） | PASS | MINOR（要 same-wave） | MAJOR（責務境界破壊） | MAJOR |
| D1 ledger 一意性 | PASS（`sync_jobs`） | PASS（`sync_locks` + `sync_job_logs` 採用） | MAJOR（二重 ledger 残存） | MAJOR |
| Secret hygiene | PASS（Sheets 系廃止） | PASS（Sheets 系正式採用） | MINOR（両方並存） | MAJOR |
| 5 文書同期 | PASS | MINOR（same-wave で 5 文書更新） | MAJOR | MAJOR |
| 運用性 | PASS | MINOR | MINOR | MAJOR |
| docs-only 境界 | PASS | PASS | PASS | N/A |
| staging smoke 表記 | PASS | PASS | PASS | MAJOR |
| unrelated 削除混入リスク | PASS（別タスク化方針） | PASS | PASS | MAJOR |

### 採用結論

- base case = 案 a（採用 A）。MAJOR ゼロ・MINOR ゼロ・current facts と完全整合。
- 案 b は MAJOR 1（current facts）/ MINOR 4 が残るため、ユーザー承認を経た上で別タスクとして起票することを推奨。
- 案 c は責務境界破壊が MAJOR のため不採用。
- 案 d は MAJOR 5 のため不採用。reconciliation せず PR 化する経路は遮断する。

## 30 種思考法レビュー（Phase 3 代表 8 種 + Phase 10 補完 22 種）

| # | 思考法 | findings | 判定 |
| --- | --- | --- | --- |
| 1 | First Principles Thinking | reconciliation の本質は「正本を 1 つに統一する」ことであり、案 a は current 正本維持で本質に最短経路 | PASS |
| 2 | Inversion Thinking | reconciliation を行わない（案 d）と何が壊れるかを明示。後続 4 タスク blocked / Phase 12 乖離 / PR 複雑化のすべてが顕在化 | PASS |
| 3 | Second-Order Effects | 案 b 採用は references 5 文書 same-wave 更新を発生させ、UT-26 smoke シナリオの全面切替を誘発 | MINOR（B 採用時のみ） |
| 4 | Cost-Benefit Analysis | 案 a の撤回 + 移植コスト < 案 b の same-wave 更新コスト。docs-only タスクとしては案 a が最小 | PASS |
| 5 | Pre-mortem | 案 a で「品質要件移植の漏れ」が起きると D1 contention 知見が失われる → 移植対象を Phase 2 で 5 知見明示済み | PASS |
| 6 | Devil's Advocate | 案 b の利点（Sheets 直接実装の短期コスト低）を擁護した上で、current facts MAJOR と Ownership 衝突再発リスクで反論成立 | PASS |
| 7 | Systems Thinking | 03a / 03b / 04c / 09b / legacy umbrella の 5 文書同期を Phase 9 で実施する手順が固定済み | PASS |
| 8 | Occam's Razor | 最小変更で正本統一できる案 a を選択。reconciliation の本旨に整合 | PASS |

> automation-30 の「30 種すべてを使用する」制約に従い、Phase 3 では意思決定ゲートに直結する 8 種を先行適用し、Phase 10 で補完 22 種を必須適用する。AC-11 の PASS は 8 + 22 = 30 種が揃った時点でのみ成立する。

## PASS / MINOR / MAJOR 判定基準

| レベル | 基準 |
| --- | --- |
| PASS | base case の判断軸を満たし、block にならず Phase 4 へ進める |
| MINOR | 警告レベル。Phase 5 / Phase 11 / Phase 12 で運用上の補足対応が必要だが、Phase 4 への移行は許可 |
| MAJOR | block。Phase 4 に進めない。Phase 2 へ差し戻すか、ユーザー承認の上で代替案再選定 |

## base case 最終 PASS / MINOR / MAJOR 判定

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | reconciliation により後続 4 タスクの判断面が安定化 |
| 実現性 | PASS | docs-only。撤回 / 移植マッピングが Phase 2 で 5 軸 + 5 知見記述済み |
| 整合性（不変条件 #1） | PASS | schema を mapper.ts / schema 定義に閉じる方針維持 |
| 整合性（不変条件 #4） | PASS | `sync_jobs` を admin-managed data 専用ledger として維持 |
| 整合性（不変条件 #5） | PASS | D1 binding は `apps/api` 内に閉じる方針維持 |
| 整合性（不変条件 #6） | PASS | 旧 UT-09 を direct implementation 化しない方針維持で GAS prototype 延長扱いリスクを排除 |
| 整合性（current facts） | PASS | legacy umbrella spec / 03a / 03b / 04c / 09b すべて無変更 |
| endpoint 認可 | PASS | `/admin/sync/schema` + `/admin/sync/responses` 2 endpoint と 04c の整合維持 |
| D1 ledger 一意性 | PASS | `sync_jobs` 単一 ledger、`sync_locks` + `sync_job_logs` migration は撤回対象 |
| Secret hygiene | PASS | Sheets 系 secret は廃止候補、Forms 系 + admin 共通 secret に一意化 |
| 5 文書同期 | PASS | Phase 9 で実施する 5 文書 × チェック観点マトリクスを Phase 2 で固定済み |
| 運用性 | PASS | 運用変更なし。staging smoke pending と PASS の混同防止ルールを下記で明文化 |
| docs-only 境界 | PASS | コード変更・migration 撤回・PR 作成は別タスク化と Phase 1〜2 で明記 |
| staging smoke 表記 | PASS | 「実機未走行 = pending、合否 = PASS/FAIL」を区別する運用ルールを明文化（下記） |
| unrelated 削除混入 | PASS | unrelated verification-report 削除は別タスク化方針を明文化（下記） |

## 運用ルール明文化

### ルール 1: staging smoke 表記の明確化

- 「**pending**」= 実機未走行。判定保留。PR 表記でも `pending` のまま使う。
- 「**PASS**」= 実機走行済み + 合否判定 OK。
- 「**FAIL**」= 実機走行済み + 合否判定 NG。
- pending を PASS と誤記したことが Phase 12 review で検出された場合、reconciliation タスクを再起票する。

### ルール 2: unrelated verification-report 削除の分離

- 本 reconciliation タスクの PR には unrelated verification-report 削除を含めない。
- verification-report 削除は別 unassigned-task として起票し、独立 PR で実施する。
- ユーザー承認なしで削除を本 PR に混ぜた場合、Phase 13 の GO/NO-GO を NO-GO とする。

## 着手可否ゲート（Phase 4 への GO / NO-GO 判定）

### GO 条件（全て満たすこと）

- [ ] 代替案 4 案以上が評価マトリクスに並んでいる
- [ ] base case（案 a）の最終判定が全観点 PASS
- [ ] MAJOR が一つも残っていない
- [ ] MINOR がある場合、対応 Phase（5 / 11 / 12）が指定されている
- [ ] open question が 0 件、または Phase 12 unassigned-task-detection.md への送り先が明記
- [ ] current facts 5 文書（legacy umbrella / 03a / 03b / 04c / 09b）からの逸脱が 0 件
- [ ] 運用ルール 2 件（staging smoke 表記 / unrelated 削除分離）が明文化
- [ ] docs-only 境界（コード変更は別タスク）が Phase 1〜3 で一貫

### NO-GO 条件（一つでも該当）

- 4条件のいずれかに MAJOR が残る
- 案 b（採用 B）をユーザー承認なしで base case にしようとしている
- 案 c / d を base case として採用している
- `sync_jobs` と `sync_locks` + `sync_job_logs` を同時に正本扱いしている
- `/admin/sync` 単一と 2 endpoint を同時に正本扱いしている
- staging smoke pending を PASS と表記している
- unrelated verification-report 削除を本 PR に混ぜる方針が残っている

## open question（Phase 4 以降に渡す候補）

| # | 質問 | 受け皿 Phase | 備考 |
| --- | --- | --- | --- |
| 1 | Sheets 実装撤回の具体手順（ファイル削除 / migration down / Secret 削除） | 別タスク（reconciliation 後の implementation task） | 本タスクは docs-only |
| 2 | D1 contention mitigation 知見の 03a / 03b / 09b への移植 PR | 別タスク | 移植対象 5 知見を本タスク Phase 2 で明示済み |
| 3 | 案 b（Sheets 採用）の将来採用判断時期 | Phase 12 unassigned-task-detection | Wave 後段以降の検討候補 |
| 4 | 旧 UT-09 root の legacy umbrella 参照復元 PR | 別タスク | direct implementation 化記述の撤回 |
| 5 | aiworkflow-requirements references の更新確認 | 別タスク | A 採用時は現行登録維持で OK か Phase 9 で確認 |
| 6 | unrelated verification-report 削除の別タスク化 | 別 unassigned-task 起票 | 本 PR に混ぜない |

## 実行手順

### ステップ 1: 代替案の列挙

- 案 a〜d を `outputs/phase-03/main.md` に記述する。
- 各案に利点・欠点・結論を 3〜5 行で記述する。

### ステップ 2: 評価マトリクスの作成

- 13 観点（4条件 + 不変条件 4 件 + current facts + endpoint 認可 + D1 ledger 一意性 + Secret hygiene + 5 文書同期 + docs-only 境界 + staging smoke 表記 + unrelated 削除混入）×案を縦持ち横持ちで埋める。
- 空セルゼロを確認する。

### ステップ 3: 30 種思考法レビュー（全 30 種の分割適用）

- First Principles / Inversion / Second-Order / Cost-Benefit / Pre-mortem / Devil's Advocate / Systems Thinking / Occam's Razor の 8 種で findings と判定を記述する。
- Phase 3 では意思決定ゲートに直結する 8 種を適用し、Phase 10 で補完 22 種を必ず適用する。

### ステップ 4: base case の最終判定

- 全 PASS であることを確認する。
- MINOR が残る場合は対応 Phase を明示する。

### ステップ 5: 運用ルール明文化

- staging smoke 表記ルール（pending / PASS / FAIL）を `outputs/phase-03/main.md` に固定する。
- unrelated verification-report 削除を本 PR に混ぜない方針を固定する。

### ステップ 6: 着手可否ゲートの判定

- GO / NO-GO チェックリストを通す。
- GO の場合のみ artifacts.json の Phase 3 を `spec_created` のままにし、Phase 4 へ進める。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | base case を入力に、5 文書同期チェック / 運用ルール / 撤回 - 移植マッピングの検証観点を組む |
| Phase 5 | open question #1 / #2 / #4 を別タスクへ register（本タスクは docs-only） |
| Phase 10 | 30 種思考法のうち補完 22 種をすべて走査し、全 30 種適用を完結 |
| Phase 10 | base case の最終 PASS 判定を GO/NO-GO の根拠に再利用 |
| Phase 12 | open question #3 / #5 / #6 を unassigned-task-detection.md に登録 |

## 多角的チェック観点

- 価値性: base case が後続 4 タスクの判断面安定化を実現するか。
- 実現性: docs-only 範囲で reconciliation 設計が完結するか。
- 整合性（不変条件 #1/#4/#5/#6）: 採用 A で 4 件すべて PASS。
- 整合性（current facts）: legacy umbrella / 03a / 03b / 04c / 09b 無変更。
- endpoint 認可: 04c の 2 endpoint 契約と一致。
- D1 ledger 一意性: `sync_jobs` 単一に統一。
- Secret hygiene: Sheets 系廃止 / Forms 系維持の整合。
- 5 文書同期: Phase 9 で 5 文書 × チェック観点で確認。
- docs-only 境界: コード変更は別タスクに分離。
- staging smoke 表記: pending / PASS / FAIL の区別を運用ルール化。
- unrelated 削除混入: 本 PR に含めない方針を運用ルール化。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 代替案 4 案以上の列挙 | 3 | spec_created | 案 a〜d |
| 2 | 評価マトリクスの作成（13 観点 × 4 案） | 3 | spec_created | 空セルゼロ |
| 3 | 30 種思考法レビュー（Phase 3 代表 8 種 + Phase 10 補完 22 種） | 3 | spec_created | AC-11 は Phase 10 で全 30 種適用完了後に PASS |
| 4 | base case 最終 PASS 判定 | 3 | spec_created | 全観点 PASS |
| 5 | PASS/MINOR/MAJOR 基準の定義 | 3 | spec_created | 3 レベル |
| 6 | 着手可否ゲートの定義 | 3 | spec_created | GO / NO-GO |
| 7 | 運用ルール 2 件の明文化 | 3 | spec_created | staging smoke / unrelated 削除 |
| 8 | open question の Phase 振り分け | 3 | spec_created | 6 件 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | 代替案比較・評価マトリクス・30 種思考法（Phase 3 代表 8 種 + Phase 10 補完 22 種）・PASS/MINOR/MAJOR・着手可否ゲート・運用ルール |
| メタ | artifacts.json | Phase 3 状態の更新 |

## 完了条件

- [ ] 代替案が 4 案以上比較されている
- [ ] 13 観点 × 案のマトリクスに空セルが無い
- [ ] base case（案 a / 採用 A）の最終判定が全観点 PASS
- [ ] 30 種思考法のうち Phase 3 代表 8 種で findings と判定が記述され、Phase 10 補完 22 種が必須ゲートとして予約されている
- [ ] PASS / MINOR / MAJOR の判定基準が明文化されている
- [ ] 着手可否ゲートの GO / NO-GO 条件が記述されている
- [ ] open question 6 件すべてに受け皿 Phase / 別タスクが割り当てられている
- [ ] current facts 5 文書からの逸脱が 0 件であることを確認している
- [ ] 運用ルール 2 件（staging smoke 表記 / unrelated 削除分離）が明文化されている

## タスク100%実行確認【必須】

- 全実行タスク（8 件）が `spec_created`
- 成果物が `outputs/phase-03/main.md` に配置済み
- 4条件 + 13 観点すべてが base case で PASS
- MAJOR ゼロ
- MINOR がある場合、対応 Phase が記述
- artifacts.json の `phases[2].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 4 (テスト戦略)
- 引き継ぎ事項:
  - 採用 base case = 案 a（採用 A / current Forms 分割方針へ寄せる）
  - 5 文書同期チェック手順 → Phase 4 / Phase 9 のテスト戦略入力
  - 運用ルール 2 件（staging smoke 表記 / unrelated 削除分離）を Phase 12 / Phase 13 で再確認
  - open question 6 件を該当 Phase / 別タスクへ register
  - docs-only 境界（コード変更は別タスク）を Phase 4 以降の制約として固定
- ブロック条件:
  - GO 条件のいずれかが未充足
  - MAJOR が残っている
  - 案 b をユーザー承認なしで base case 化しようとしている
  - current facts 5 文書からの逸脱が残っている
