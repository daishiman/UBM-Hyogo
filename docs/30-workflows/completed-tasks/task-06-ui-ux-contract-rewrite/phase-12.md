# Phase 12: ドキュメント更新

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-06-ui-ux-contract-rewrite |
| Wave | 2 |
| 実行種別 | parallel |
| Phase 番号 | 12 / 13 |
| 作成日 | 2026-05-07 |
| 上流 Phase | 11 (手動 smoke / NON_VISUAL) |
| 下流 Phase | 13 (PR 作成 / approval gate) |
| 状態 | completed |

## 目的

implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check の **必須 6 タスク**を生成し、後続 task-07（09a-prototype-map.md 新設）/ task-08（09b-design-tokens.md 新設）/ task-09（tailwind v4 setup）/ task-10（ui-primitives）/ task-11..17（各画面実装）が「新 09-ui-ux.md をどこからどう参照すべきか」を一意に把握できるようにする。

本タスクは正本仕様 `09-ui-ux.md` を実際に全面 rewrite したため、workflow root state は `implemented-local` とする。UI 実装コードは別 task（task-09 以降）が引き受けるが、contract rewrite 自体は本 task の実装成果物として完了済み。

## 実装ガイド Part 1 / Part 2 要件

### Part 1: 初学者・中学生レベル

- [ ] なぜ「契約のみ」に分離するかを、料理本の「材料表（契約）」と「写真集（視覚詳細）」の例で説明する
- [ ] 専門用語（contract / token / a11y / WAI-ARIA）はその場で短く説明する
- [ ] 何を作るかより先に「困りごと（視覚と契約が混ざって誰がどっちを直せばいいか不明）」と「解決後（grep 1 行で contract が降りる）」を書く

### Part 2: 開発者・技術者レベル

- [ ] 19 routes 契約表の 10 列 schema を TypeScript の interface で表現
- [ ] §2 / §3 grep 起点の使い方（`grep -n "^### 2\\." | head` で routes index、`grep -n "^#### 3\\.1\\." | head` で primitives index）
- [ ] 後続 task の参照点を表形式で一覧化（task-07 〜 task-17）
- [ ] aiworkflow-requirements skill との整合監査結果

## 実行タスク（必須 6 タスク）

1. `implementation-guide.md` 生成（後続 task-07/08/09/10/11..17 への引き渡しガイド + grep 起点の使い方）
2. `system-spec-update-summary.md` 生成（`docs/00-getting-started-manual/specs/09-ui-ux.md` M 1 件のみ・追加なし・削除なし）
3. `documentation-changelog.md` 生成（旧 §3〜§7 削除 / 新 §1〜§10 構築 / 09a / 09b への link 追加）
4. `unassigned-task-detection.md` 生成（未割当作業の検出 / 0 件目標 / 視覚詳細委譲先 09a / 09b の path 確定状況）
5. `skill-feedback-report.md` 生成（task-specification-creator skill / aiworkflow-requirements skill への feedback）
6. `phase12-task-spec-compliance-check.md` 生成（13 phase 全準拠確認）
7. outputs/phase-12/main.md 集約

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01〜11/ | 全 phase 成果 |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md | 正本順位・diff scope 規律 |
| 必須 | CLAUDE.md | 不変条件 |
| 必須 | .claude/skills/aiworkflow-requirements/ | skill 整合監査 |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-06-w2-par-ui-ux-contract-rewrite.md | 元仕様 |

## 実行手順

### ステップ 1: 6 ドキュメント生成
### ステップ 2: 整合性確認（specs/ との差分・aiworkflow-requirements skill との突合）
### ステップ 3: outputs/phase-12/main.md 集約

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 13 | PR description で changelog を参照 |
| 後続 task-07 | 09a-prototype-map.md 新設時に §3.x 視覚詳細 link 先として確定 |
| 後続 task-08 | 09b-design-tokens.md 新設時に §6 token 値委譲先として確定 |
| 後続 task-09 / 10 / 11..17 | implementation-guide.md の grep 起点で contract を降ろす |

## 多角的チェック観点（不変条件参照）

- **CLAUDE.md #1**（schema 固定回避）: contract に Google Form schema を焼き込まない記述になっているかを implementation-guide で再強調
- **CLAUDE.md #5**（apps/web → D1 禁止）: 後続 task-11..17 にも継続適用と明記
- **CLAUDE.md #6**（GAS prototype 非昇格）: §8 の不採用項目を後続実装で再持ち込みしない注意
- **元仕様 §0.5 #4**（視覚詳細 0 件）: 後続 task-07 / 08 が 09a / 09b 側で値を扱うため、09-ui-ux.md 側で値を再持ち込みしない運用ルールを implementation-guide に明記

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | implementation-guide.md | 12 | completed | 後続 5 系統 task 引き渡し |
| 2 | system-spec-update-summary.md | 12 | completed | specs + skill/index sync |
| 3 | documentation-changelog.md | 12 | completed | 章立て差分 |
| 4 | unassigned-task-detection.md | 12 | completed | 0 件 |
| 5 | skill-feedback-report.md | 12 | completed | spec creator + aiworkflow-requirements |
| 6 | phase12-task-spec-compliance-check.md | 12 | completed | 13 phase 準拠 |
| 7 | outputs/phase-12/main.md 集約 | 12 | completed | サマリー |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/main.md | サマリー |
| ドキュメント | outputs/phase-12/implementation-guide.md | 後続 task 引き渡しガイド |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | specs/ 差分（M 1 件） |
| ドキュメント | outputs/phase-12/documentation-changelog.md | doc 変更点 |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | 未割当検出 |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | skill feedback |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | 13 phase 準拠 |
| メタ | artifacts.json | Phase 12 completed・workflow_state は implemented-local |

## 完了条件

- [x] 必須 6 ドキュメントすべて生成
- [x] implementation-guide.md が後続 task-07 / 08 / 09 / 10 / 11..17 ごとの参照点を明記
- [x] system-spec-update-summary が specs M 1 件と same-wave skill/index sync を記録
- [x] aiworkflow-requirements skill との整合監査結果が記録
- [x] compliance check で 13 phase が phase-template 準拠
- [x] workflow_state = `implemented-local`

## タスク 100% 実行確認【必須】

- [x] 全 7 サブタスク completed
- [x] outputs/phase-12/ 配下に 7 ファイル配置済み
- [x] artifacts.json 更新（workflow_state = implemented-local）

## 次 Phase

- 次: Phase 13（PR 作成・user approval gate）
- 引き継ぎ事項: changelog → PR description / implementation-guide → 後続 task GO 条件
- ブロック条件: 6 ドキュメントの 1 つでも欠けていれば不可

## implementation-guide.md（要約）

後続 task への引き渡し:

| 後続 task | 確認項目 / 参照点 |
| --- | --- |
| task-07 (09a-prototype-map.md 新設) | §2.x.y の「視覚詳細 link」列が 09a を指す path で記述されている |
| task-08 (09b-design-tokens.md 新設) | §6.3 token prefix 規則（`--ubm-color-*` 等）が 09b 名前空間と一致 |
| task-09 (tailwind-v4-setup) | §6.2 OKLch CSS 変数経由参照 / HEX 直書き禁止 |
| task-10 (ui-primitives) | §3.1 13 primitives の props / variants / sizes / a11y 表 |
| task-11..17 (画面実装) | §2 19 routes 表 1 行 → 1 画面の決定論的対応 |

grep 起点の使い方:

```bash
# 19 routes index
grep -n "^### 2\." docs/00-getting-started-manual/specs/09-ui-ux.md

# 13 primitives index
grep -n "^#### 3\.1\." docs/00-getting-started-manual/specs/09-ui-ux.md

# feature components index
grep -n "^#### 3\.2\." docs/00-getting-started-manual/specs/09-ui-ux.md

# a11y 契約 index
grep -n "^### 5\." docs/00-getting-started-manual/specs/09-ui-ux.md
```

## system-spec-update-summary.md（要約）

- M: `docs/00-getting-started-manual/specs/09-ui-ux.md`（160 行 → 300〜420 行・契約のみ）
- A: なし（task-07 / 08 が 09a / 09b を新設）
- D: なし

## documentation-changelog.md（要約）

- 削除: 旧 §3〜§7（レイヤ別 UX / 一覧 UX / 詳細 UX / 管理 UX / コンポーネント方針）の視覚詳細記述
- 新規: §1 位置づけと正本主義 / §2 19 routes 契約 / §3 component 契約 / §4 状態列挙 / §5 a11y / §6 token 参照規則 / §7 Storybook 正本主義 / §8 不採用 / §9 用語集 / §10 改訂履歴
- link 追加: 09a-prototype-map.md / 09b-design-tokens.md（path のみ・両 task 完了で解決）

## unassigned-task-detection.md（要約）

- 検出: 0 件
- 視覚詳細の委譲先（09a / 09b）の path のみ確定。中身は task-07 / 08 が並列で生成

## skill-feedback-report.md（要約）

- task-specification-creator skill: NON_VISUAL × implementation-spec タスクで Phase 11 を縮約する運用が定着しつつあるため、テンプレに `visualEvidence: NON_VISUAL` 用 evidence 構造（grep / lint / trace の 3 ログ）を明示すると親切
- aiworkflow-requirements skill: §0.7 の grep 見出し設計が「契約 → 実装」決定論的写像の良い実例。indexes/keywords.json に `09-ui-ux contract grep` 系 trigger を追加検討

## phase12-task-spec-compliance-check.md（要約）

| Phase | template 準拠 | Phase 別追加セクション | 不変条件マッピング |
| --- | :---: | :---: | :---: |
| 1 | OK | 4 条件 / 真の論点 / 依存境界 / 価値とコスト | OK |
| 2 | OK | 章立て / module 設計 / link 委譲先 | OK |
| 3 | OK | alternative 3 案 / PASS-MINOR-MAJOR | OK |
| 4 | OK | verify suite（grep gate / markdown lint / trace） | OK |
| 5 | OK | runbook（書き換え手順） | OK |
| 6 | OK | failure cases（視覚詳細混入 / API 列乖離） | OK |
| 7 | OK | AC matrix | OK |
| 8 | OK | Before/After（旧 160 行 → 新 300〜420 行） | OK |
| 9 | OK | a11y 章独立 / OKLch 規則 | OK |
| 10 | OK | GO/NO-GO / 後続 5 系統 trace | OK |
| 11 | OK | NON_VISUAL 縮約 / 代替 evidence 4 種 | OK |
| 12 | OK | 必須 6 ドキュメント | OK |
| 13 | OK | approval gate / diff scope 規律 | （Phase 13 で確認） |
