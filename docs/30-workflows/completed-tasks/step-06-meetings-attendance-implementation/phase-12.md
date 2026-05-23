# Phase 12: ドキュメント / コンプライアンス

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 |
| 区分 | ドキュメント |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implemented_local_evidence_captured |
| 想定所要 | 0.25 人日 |

## 目的

実装結果をシステム仕様書と整合させ、Phase 12 compliance 7 outputs を物理生成する。

## 12.1 Part 1: 中学生レベル概念説明

**`outputs/phase-12/implementation-guide.md` Part 1**

> 出席をつける管理画面で、削除ボタンを押したときに「本当に削除していい？」を確認する **小窓 (ダイアログ)** を出すように直した。
>
> 同じ仕組みは「申請を承認する / 却下する」画面でも次に使いまわす予定なので、`useConfirmDialog`
> という **再利用できる部品** として作った。
>
> 別の画面 (`/admin/meetings/詳細`) では、これまで `fetch` でサーバーに直接 HTTP リクエストを送っていたが、
> 共通の `useAdminMutation` という関数経由に統一した。これでエラーが起きたときの表示や、
> 「ログイン切れ」の対応が画面全部で同じになる。

## 12.2 Part 2: 技術者レベル説明

**`outputs/phase-12/implementation-guide.md` Part 2**

- 新規: `apps/web/src/features/admin/hooks/useConfirmDialog.ts` (state machine: idle / open / submitting / error)
- 新規: `apps/web/src/components/ui/ConfirmDialog.tsx` (presentational, ARIA-compliant)
- 改修: `apps/web/src/components/admin/MeetingPanel.tsx` (出席解除 / 開催日削除を confirm 経由に置換)
- 改修: `apps/web/app/(admin)/admin/meetings/[id]/MeetingAttendancePanel.tsx` (直接 fetch → useAdminMutation)
- API contract 不変: current UI surface は `POST /api/admin/meetings/:id/attendances` with `{ memberId, attended }`
- error mapping: 200 / 404 / 409 / 422 / 401 / 5xx を toast に統一
- 後方互換: 既存 export shape, `data-testid` を維持

## 12.3 Phase 12 必須 7 outputs（本仕様書改善サイクルで物理作成済）

| # | output | path |
| --- | --- | --- |
| 1 | implementation-guide | `outputs/phase-12/implementation-guide.md` |
| 2 | system-spec-update-summary | `outputs/phase-12/system-spec-update-summary.md` |
| 3 | documentation-changelog | `outputs/phase-12/documentation-changelog.md` |
| 4 | unassigned-task-detection | `outputs/phase-12/unassigned-task-detection.md` |
| 5 | skill-feedback-report | `outputs/phase-12/skill-feedback-report.md` |
| 6 | phase12 task spec compliance check | `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| 7 | main | `outputs/phase-12/main.md` |

## 12.4 system-spec-update-summary 内容

更新対象システム仕様書:
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` / `references/task-workflow-active.md`
  への workflow 登録（実装完了 wave で同一更新）
- `docs/00-getting-started-manual/specs/11-admin-management.md` への `useConfirmDialog` / `/attendances`
  alias contract 反映

本実装サイクルでは aiworkflow-requirements 本体への完了同期を同一 wave で実施した。
`system-spec-update-summary.md` には `implemented_local_evidence_captured` として登録先と根拠を明記する。

## 12.5 unassigned-task-detection 内容

| # | 候補 | 理由 | 実施場所 |
| --- | --- | --- | --- |
| 1 | useAdminMutation timeout policy | 既存 `useAdminMutation` 全体の timeout policy と合わせて設計が必要 | step-06 では未 formalize |

focus trap / focus restore / submit guard は本サイクルで実装済み。

## 12.6 skill-feedback-report 内容（3 観点固定）

- **テンプレ改善**: なし
- **ワークフロー改善**: legacy単数 route と現行UI複数形 alias を混同しないよう、Phase 1 で `apps/web/src/lib/admin/api.ts` と `apps/api/src/routes/admin/meetings.ts` を current UI SSOT として確認する運用を固定
- **ドキュメント改善**: なし

## 12.7 phase12-task-spec-compliance-check（canonical 9 headings）

`.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` の
9 必須 heading を本 outputs に揃える。Phase 11 evidence inventory は本 phase-11.md §11.2 を転記する。

## 完了条件

- [x] 12.3 の 7 ファイルが物理存在
- [x] Part 1 (中学生レベル) / Part 2 (技術者レベル) が implementation-guide に両方ある
- [x] canonical 9 headings drift なし
- [x] system-spec-update-summary の判定根拠が記載されている
- [x] unassigned-task が CONST_005 例外条件と整合して記録されている

## リスク

- canonical 9 heading の SSOT ずれ → `bash scripts/verify-pr-ready.sh` 実行で fail-fast 検知
