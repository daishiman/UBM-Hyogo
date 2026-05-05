# スキルフィードバックレポート — 08a-B-public-search-filter-coverage

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 08a-B-public-search-filter-coverage |
| phase | 12 / 13 |
| wave | 08a-fu |
| mode | parallel |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| feedback target | task-specification-creator / aiworkflow-requirements / phase-12 雛形 |
| 出力ルール | 改善点なしでも 3 観点固定で記述 |

## 観点 1: テンプレ改善（phase-NN.md 雛形・Phase 12 の 7 ファイル要件）

### 良かった点

- Phase 12 が **6 必須タスク × 7 ファイル**（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）に固定されており、close-out に必要な書類が一意に決まる。
- 各 phase に「中学生レベル概念説明」「日常の例え話」枠があることで、Part 1 / Part 2 の責務分離が崩れにくい。
- `[実装区分: 実装仕様書]` を全 outputs 冒頭に固定することで、後続 PR で実コード差分混入を防ぐ視認性が高い。

### 改善提案

| ID | 提案 | 根拠 |
| --- | --- | --- |
| T-1 | Phase 12 雛形に **「既存実装が大半完成しているケース」のランブック分岐**（implementation_done_runtime_pending vs spec_created を扱い分ける）を追記 | 本タスクは `apps/api/src/_shared/search-query-parser.ts` ほか実装が既に存在し、Phase 5 が「編集中心」になった。雛形の「実装ランブック」想定が新規実装前提だと冗長な空欄が増える |
| T-2 | `unassigned-task-detection.md` の **0 件出力フォーマット**を雛形に明示する（「0 件でも以下 4 セクション固定」） | 本タスクで「0 件」を書くか「列挙」を書くかが任意になっており、Phase 10 残課題からの mapping の有無で書き手判断が割れる |
| T-3 | `skill-feedback-report.md` の **3 観点（テンプレ / ワークフロー / ドキュメント）固定** が雛形に明文化されていない | フィードバックの粒度が書き手任せになり、後段 skill 改善時の集計が難しい。本ファイルで先行実装した 3 観点を雛形化する提案 |
| T-4 | `phase12-task-spec-compliance-check.md` の **artifacts.json parity check 項目** を雛形にチェックボックス化 | root vs outputs の二重正本リスクが本タスクで判明。雛形側で root / outputs の両方がある場合は同一内容を確認する default に |

### 改善不要と判断した点

- phase-NN.md の「実行タスク」「参照資料」「実行手順」「統合テスト連携」「多角的チェック観点」「サブタスク管理」「成果物」「完了条件」「タスク100%実行確認」「次 Phase への引き渡し」の 10 セクションは過不足なし。

## 観点 2: ワークフロー改善（Phase 1-3 直列 + Phase 4-13 並列）

### 良かった点

- Phase 1（要件） → Phase 2（設計） → Phase 3（設計レビュー）の直列が、後続 Phase 4-13 の参照基盤として有効に機能した。本タスクでは Phase 2 で確定した zod schema / D1 base WHERE が Phase 4-9 すべてで一貫参照されている。
- Phase 4-13 並列は、テスト戦略 / DRY / QA / 最終レビュー / smoke / docs / PR が独立タスクとして書けるため、単独実行（spec_created）にも実装反映済み runtime pending にも適合する。
- Phase 10 で 4 条件（矛盾なし / 漏れなし / 整合性 / 依存関係整合）を再評価する gate があり、Phase 11 以降の実測フェーズに入る前の最終整合確認が機能した。

### 改善提案

| ID | 提案 | 根拠 |
| --- | --- | --- |
| W-1 | implementation / implemented-local / VISUAL_ON_EXECUTION タスクの場合、**Phase 11 runtime evidence と Phase 12 doc/code sync の依存境界**を明記 | 本タスクでは API 実装は反映済みだが screenshot / curl / axe は 08b / 09a に委譲するため、Phase 11 blocked と Phase 12 completed の意味を `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` で分離する必要があった |
| W-2 | Phase 8（DRY）と Phase 10（最終レビュー）の **D-* 候補 → R-* 残課題 → U-* 未タスク**の id 連結ルールを雛形化 | 本タスクで D-3 / D-4 → R-2 / R-3 → U-3 / U-2 と手動連結したが、id 体系が雛形にないと混在の追跡コストがかかる |
| W-3 | Phase 13 の `user_approval_required: true` を **artifacts.json と整合**させる検証 step を雛形化 | 本タスク artifacts.json では Phase 13 のみ `user_approval_required: true` を持ち他は false。compliance-check の項目に追加すると drift が早期検出できる |

### 改善不要と判断した点

- 直列 3 + 並列 10 の比率は妥当（直列が肥大化すると並列度の利益が減る）。

## 観点 3: ドキュメント改善（task-specification-creator skill references / aiworkflow-requirements）

### 良かった点

- `aiworkflow-requirements` 配下の `references/` から `12-search-tags.md` / `05-pages.md` / `01-api-schema.md` / `09-ui-ux.md` を **論理正本として参照**し、`apps/api` / `apps/web` のランタイム正本と dual canonical を保つ構造が機能した。
- Progressive Disclosure（resource-map / quick-reference / topic-map / keywords を起点に最小限読む）が、本タスクで本文 4 仕様書の必要セクションのみを抽出できた。
- `task-specification-creator` の Phase 12 の「中学生レベル概念説明」「日常の例え話」が、Part 1 implementation-guide にそのまま転用できる構造になっている。

### 改善提案

| ID | 提案 | 根拠 |
| --- | --- | --- |
| D-1 | `task-specification-creator/references/` に **Phase 12 7 ファイルの相互依存図**（main → 6 ファイル → 各々の参照関係）を追加 | 本タスクで main.md → unassigned / skill-feedback / compliance-check の参照経路が手書きになった |
| D-2 | `aiworkflow-requirements` の `references/` に **dual canonical の更新責務分担** を明記（specs/ 系は本ワークフロー、SKILL.md / topic-map / keywords は skill family wave） | 本タスク system-spec-update-summary.md で「skill family 更新は別 wave」を都度書いたが、ガイドラインが skill 側にあると重複説明が省ける |
| D-3 | implementation + runtime pending タスクの **changelog mirror ルール**（root LOGS / aiworkflow-requirements との関係）を skill references に明示 | 本タスクは workflow-local changelog、root LOGS、aiworkflow-requirements の同一 wave 同期が必要だった。責務分担が暗黙的だと state drift が起きる |

### 改善不要と判断した点

- `aiworkflow-requirements` のキーワード索引精度。本タスクで `12-search-tags.md` / `05-pages.md` / `01-api-schema.md` / `09-ui-ux.md` が一発検索できた。

## 本タスク作成過程で得た気づき

### 気づき 1: 既存実装が大半完成しているケースのランブック調整

本タスクは `apps/api/src/_shared/search-query-parser.ts` / `apps/api/src/repository/publicMembers.ts` / `apps/web/app/(public)/members/_components/MembersFilterBar.client.tsx` ほかが**既に実装済み**で、Phase 5 ランブックが「新規実装」ではなく「テスト追加 + a11y aria 追記 + 部分編集」になった。

→ Phase 5 雛形に「編集中心 / 新規追加中心 / 移行中心」の分岐記述を追加すべき。

### 気づき 2: implemented-local タスクで root / outputs artifacts parity を早期確認する判断

本タスクでは root `artifacts.json` と `outputs/artifacts.json` の両方が存在する。雛形側では root / outputs parity の確認タイミングが暗黙的だが、**implementation / implemented-local / VISUAL_ON_EXECUTION の場合は Phase 0/12 review で早期比較する default** が state drift を減らす。

### 気づき 3: 不変条件 #4/#5/#6 を AC とテストの双方に紐付ける重要性

不変条件を「思想」だけで書くと Phase 11 evidence で漏れやすい。本タスクでは AC-INV4/5/6 として独立 AC 化し、Phase 4 テスト戦略・Phase 11 evidence の両方で個別検証 step を持つ構造が有効だった。

### 気づき 4: 残課題 R-* と未タスク U-* の id 体系を分離

Phase 10 R-* と Phase 12 U-* を別 id 体系にすることで、「最終レビューで気付いた未確定事項」と「明示的 backlog 化」を区別できる。本タスクの mapping 表で混乱がなかったのは、id を分けたため。

## Step 1-H: feedback routing

| ID | owning target | promotion target | routing | evidence path / no-op reason |
| --- | --- | --- | --- | --- |
| T-1 | task-specification-creator | `references/phase-12-spec.md` / Phase 5 runbook family | reference candidate | 今回は 08a-B 固有の既存実装再検証ケースとして `system-spec-update-summary.md` と compliance check に反映。skill template 全体変更は他 taskType への影響が大きいため no-op promotion |
| T-2 | task-specification-creator | `references/phase-12-spec.md` | no-op | 本 review で `unassigned-task-detection.md` を 0 件フォーマットへ再構成済み。既存 skill には「0 件でも出力必須」があり、追加 template 化は重複 |
| T-3 | task-specification-creator | `references/phase-12-spec.md` | no-op | 既存 skill に「テンプレ改善 / ワークフロー改善 / ドキュメント改善」の 3 観点固定が明記済み。本ファイルはその適用 evidence |
| T-4 | task-specification-creator | `references/phase-12-spec.md` | no-op | `outputs/artifacts.json` 不在時の必須文言を compliance check に反映済み。skill 側には同文言テンプレが既に存在 |
| W-1 | task-specification-creator | `references/phase-12-spec.md` | reference candidate | `VISUAL_ON_EXECUTION` / runtime pending 境界を本 workflow の artifacts / Phase 12 判定へ反映済み。skill には既に runtime pending 分離ルールがあるため no-op promotion |
| W-2 | task-specification-creator | `references/phase-12-spec.md` | no-op | 今回は AC 直結改善を未タスク化せず実装したため、D/R/U 連結ルールの追加は不要 |
| W-3 | task-specification-creator | `references/quality-gates.md` | no-op | compliance check に Phase 13 `user_approval_required=true` parity を記録済み |
| D-1 | task-specification-creator | `references/phase-12-spec.md` | no-op | Phase 12 7 ファイル一覧は既存 skill で定義済み。相互依存図の追加は重複説明になるため見送り |
| D-2 | aiworkflow-requirements | `indexes/quick-reference.md` / `indexes/resource-map.md` / `references/task-workflow-active.md` | promoted | 08a-B row と正本導線を `.claude` / `.agents` 双方へ同期済み |
| D-3 | aiworkflow-requirements | `docs/30-workflows/LOGS.md` | promoted | root LOGS row を追加し、workflow-local changelog のみという旧判断を撤回済み |

## 完了条件

- [x] 3 観点（テンプレ / ワークフロー / ドキュメント）すべてに改善点と改善不要点を併記
- [x] 改善点なしでも空欄を作らず、各観点で記述
- [x] 本タスク作成過程で得た気づき 4 件を記録
- [x] 既存実装が大半完成しているケースのランブック調整に関する観察を記述
- [x] Step 1-H routing（owning target / promotion target / no-op reason / evidence path）を記録
