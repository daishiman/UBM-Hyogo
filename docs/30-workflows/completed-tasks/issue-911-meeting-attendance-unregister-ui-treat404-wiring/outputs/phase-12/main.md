**[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]**

# Phase 12: ドキュメント更新 / strict 7 集約 (main hub)

## 状態

- workflow_state: `implemented_local_evidence_captured`
- implementation_status: `local_evidence_captured`
- taskType: `implementation`
- visualEvidence: `NON_VISUAL`
- runtime boundary: 実装 commit / vitest 実行 / typecheck / lint / push / PR は user-gated

## Part 1: 中学生レベル概念説明

クラスの出欠表で「来た／来てない」を直す場面を想像してください。すでに先生が別のタイミングで「来てない」に直してくれていたら、もう一度自分で「来てない」と書こうとしても問題は起きません。「すでに来てないになってますよ」と教えてくれればそれでOKです。

今回の管理画面の「出席解除ボタン」も同じ考え方にします。サーバー側にもう該当データがなくて 404（見つかりません）が返ってきても、結果的に「解除されている状態」になっているので、エラー画面を出すのではなく「既に解除済みです」とそっとお知らせするだけにします。これで複数人が同時に操作しても、画面が真っ赤になるストレスを減らせます。

API（裏側のしくみ）はすでに 404 でも壊れない作りになっており、UI（画面）にスイッチを 1 個足すだけで完成します。

## Part 2: 技術者レベル要約

`apps/web/app/(admin)/admin/meetings/[id]/MeetingAttendancePanel.tsx` に解除 CTA を追加し、`useAdminMutation` を **第 2 mutation インスタンス**として `POST /api/admin/meetings/:id/attendances { attended: false }` + `options.treat404AsSuccess: { toast: "既に解除済みです" }` で構成する。`refreshOnSuccess: false` で楽観反映に閉じる。

API (`apps/api/src/routes/admin/meetings.ts:200-249`) は POST `attended:true/false` 両対応済みで、新 DELETE route は追加しない（UI prototype alignment 不変条件 1）。policy (`useAdminMutation.ts:30-31, 47-48, 240-246`) も既存 `treat404AsSuccess` を再利用するだけで、hook 本体は無改変。

新規 spec は既存 `MeetingAttendancePanel.spec.tsx` に追加し、`*.spec.tsx` 命名強制（CLAUDE.md 不変条件 8）を維持する。A1..A8 で register 既存互換、B1..B5 で unregister 表示 / payload / 200 / 404 / 500 を網羅する。

Phase 11 は `NON_VISUAL`（vitest ログのみで AC 検証可能）。screenshot 取得は不要。

## Local validation

- `pnpm exec vitest run "apps/web/app/(admin)/admin/meetings/[id]/__tests__/MeetingAttendancePanel.spec.tsx"`
- `pnpm exec vitest run apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts`
- `mise exec -- pnpm --filter @ubm-hyogo/web typecheck`
- `mise exec -- pnpm --filter @ubm-hyogo/web lint`
- `rg -n 'useAdminMutation\([^)]*"DELETE"' apps/web/app apps/web/src -g '*.ts' -g '*.tsx' -g '!**/__tests__/**' -g '!**/*.spec.ts' -g '!**/*.spec.tsx'`
- `pnpm verify:phase12-compliance -- docs/30-workflows/completed-tasks/issue-911-meeting-attendance-unregister-ui-treat404-wiring`

## 重要不変条件

- API endpoint surface 無改変。新 DELETE route は追加しない（UI prototype alignment 不変条件 1）。
- `useAdminMutation` hook 本体は無改変。`treat404AsSuccess` は **component 側で options 渡し** に閉じる。
- register と unregister は **別 mutation インスタンス**で構成し、`treat404AsSuccess` は unregister 側にだけ付与する（register 側 404 は A6b で失敗扱いを維持）。
- 新規 test ファイルは `*.spec.tsx` のみ（`*.test.tsx` 禁止 / CLAUDE.md 不変条件 8）。
- legacy `@/lib/useAdminMutation` への新規参照を増やさない（CLAUDE.md 不変条件 10）。
- strict 7 は `outputs/phase-12/` に正規ファイル名で配置する。

## 次 Phase への引き継ぎ

Phase 13 で user-gated に commit / push / PR / completed-tasks 移動 / 親 workflow (issue-842) back-reference 更新 / indexes:rebuild を一括実施する。`Refs #911` を PR 本文に含める方針（user 承認時に最終確定）。
