# Phase 12: Documentation

> issue #1078。段階: **implemented_local_evidence_captured**。
> Phase 12 strict 7 は local 実装・focused tests・typecheck・lint の実測結果へ同期済み。

---

## 1. 必須6成果物（`outputs/phase-12/` 配下）

| # | 成果物 | 内容 | 状態 |
| --- | --- | --- | --- |
| 1 | `implementation-guide.md` | Part1（中学生レベルの例え話）+ Part2（型・API・コード例・設定パラメータ・`## 視覚証跡`）。`outputs/phase-12/implementation-guide.md` を local 実コード差分へ整合更新済み。 | implemented_local_evidence_captured |
| 2 | `system-spec-update-summary.md` | `docs/00-getting-started-manual/specs/*` への影響整理。本変更は既存 API endpoint surface（`GET /api/admin/tags`）を消費する web client の contract 修正であり、spec 側の API schema 変更は無し。tag master read が `{ total, items }`（pagination 対応）である事実を client 観点で追記する要否を判定。 | 実装サイクルで作成 |
| 3 | `documentation-changelog.md` | 触れた doc / 成果物の変更一覧。変更ファイル数・component 数を実測で記す。 | 実装サイクルで作成 |
| 4 | `unassigned-task-detection.md` | Phase10 MINOR / 実装中検出の積み残しを列挙。検出ゼロなら「detection 0」と明記。 | 実装サイクルで作成 |
| 5 | `skill-feedback-report.md` | task-specification-creator / aiworkflow-requirements への feedback。FB-MSO-003（capture script finally）/ FB-LLM-MOD-05-001（screenshot 名3箇所一致）の適用結果を記録。 | 実装サイクルで作成 |
| 6 | `phase12-task-spec-compliance-check.md` | canonical 9 見出し充足・Phase 11 evidence 表整合・workflow root scan の自己点検。`verify:phase12-compliance` / `gate-metadata:validate` の判定結果を記す。 | 実装サイクルで作成 |

---

## 2. implementation-guide.md 構成方針（Part1 / Part2）

- **Part1（中学生レベルの例え話）**: 専門用語を使わず、比喩で「何が問題で何を直したか」を説明する。
  - 大規模 catalog: 「名簿の付箋（tag）が増えすぎて箱からあふれる → 検索・折りたたみ・高さ制限の箱に入れて探しやすくした」。
  - contract バグ: 「窓口に頼んだら、思っていたのと違う形の紙が返ってきて読めなかった（`{ total, items }` を `{ available }` だと思って受け取っていた）＝ 約束（contract）の食い違い」。
- **Part2（型・API・コード例）**: TypeScript 識別子・シグネチャ・使用例・エラーハンドリング・設定可能パラメータ・`## 視覚証跡`（Phase 11 canonical screenshot 名）。識別子は `phase-2-design.md` と一致させる。

---

## 3. aiworkflow-requirements（Step 2）更新要否判定

| 判定対象 | 内容 | 更新要否 |
| --- | --- | --- |
| 新規インターフェース `TagMasterPage` | tag master 1 ページ分の UI 正規化レスポンス型（`{ available, total }`） | **要候補** — 新規 public interface のため Step 2（インターフェース定義）への追記候補。 |
| 新規インターフェース `FetchTagMasterOptions` | `fetchTagMaster` の引数オプション（`q` / `page` / `pageSize`） | **要候補** — 同上。 |
| 新規 helper `fetchAllTagMaster` | pagination を辿って cap まで全件取得する関数 | **要候補** — 公開シグネチャのため Step 2 追記候補。 |
| `fetchTagMaster` の戻り値型拡張 | `{ available }` 互換を維持しつつ `total` を追加。実 API `{ total, items }` は内部で正規化 | **要** — aiworkflow-requirements 側 contract 記述があれば更新。 |

> 判定: 上記により aiworkflow-requirements の **Step 2 更新「要」候補**。実装サイクルで `aiworkflow-requirements` skill の resource-map / 該当 reference を読み、実際の記述有無を確認してから更新する。記述が存在しなければ更新不要として skill-feedback-report に記録する。

---

## 4. LOGS.md × 2 / topic-map 更新の必要性

| 対象 | 更新内容 | 必要性 |
| --- | --- | --- |
| `docs/30-workflows/LOGS.md` | issue-1078 の 1 行サマリ追記（contract 修正 + 大規模 catalog UX） | 完了 |
| `.claude/skills/*/SKILL-changelog.md`（該当 skill の LOGS） | 該当 skill に学びがある場合のみ追記 | 条件付き（FB を skill に反映する場合） |
| `indexes/topic-map`・`indexes/keywords.json` | `pnpm indexes:rebuild` で再生成（手動編集しない） | 要（新規 reference を `references/` に置いた場合のみ自動登録） |

> `indexes:rebuild` は topic-map / keywords を生成するのみ。resource-map / quick-reference は手動メンテである点に注意。

---

## 5. local 実装完了段階の明記

本書および §1 の成果物 2〜6 は **計画**であり、実成果物は実装が landed した後に作成する。`outputs/phase-12/implementation-guide.md` のみ本 Lane で初版を Write 済みだが、実コード差分への最終整合は実装サイクルで行う。


## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 |
| workflow | issue-1078-bulk-tag-picker-large-catalog-ux |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implemented_local_evidence_captured |
| verdict | PASS_BOUNDARY_SYNCED_RUNTIME_PENDING |

## 目的

本 Phase の既存本文で定義した目的に従い、issue #1078 の tag master contract 修正と BulkActionBar large catalog UX を検証可能な単位で扱う。

## 実行タスク

- [x] Phase 本文の設計・実装・検証項目を issue #1078 の実装結果に同期する。
- [x] 実コード差分、focused tests、typecheck、lint の local evidence と矛盾しない状態語彙へ更新する。

## 参照資料

- `docs/30-workflows/completed-tasks/issue-1078-bulk-tag-picker-large-catalog-ux/index.md`
- `docs/30-workflows/completed-tasks/issue-1078-bulk-tag-picker-large-catalog-ux/artifacts.json`
- `.claude/skills/task-specification-creator/references/workflow-state-vocabulary.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 完了条件

- [x] 必須見出しが揃っている。
- [x] 状態語彙が `implemented_local_evidence_captured` / `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` と整合している。


## 成果物

- [x] Phase 12 strict outputs が `outputs/phase-12/` に存在する。
- [x] Phase 11 local evidence outputs が `outputs/phase-11/` に存在する。
