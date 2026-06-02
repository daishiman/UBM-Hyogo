# Lessons Learned — publish-state-backfill-admin-ui（2026-06-01）

> task: `docs/30-workflows/completed-tasks/publish-state-backfill-admin-ui/`（implementation, VISUAL_ON_EXECUTION, existing-hardening）
> landed: PR #1064 / commit `745c95115`（working tree で activeMode per-button busy 修正を追加）
> 親 workflow: `docs/30-workflows/task-member-publish-recovery-form-ops-and-admin-link/`
> source task: `.../tasks/A-publish-state-backfill-admin-ui.md`
> 関連 source: `apps/web/src/features/admin/components/_sync/BackfillPublishStatePanel.client.tsx`、`apps/web/src/features/admin/diagnostics/backfill.ts`、`apps/api/src/routes/admin/sync-backfill-publish-state.ts`
> 関連 reference: [workflow-publish-state-backfill-admin-ui-artifact-inventory.md](workflow-publish-state-backfill-admin-ui-artifact-inventory.md)

| ID | Lesson |
| --- | --- |
| L-PSB-001 | 複数アクションボタンの loading 判定に「完了済み mode」を使うと両ボタンが同時に busy 化する → in-flight 専用 `activeMode` state で分離する |
| L-PSB-002 | landed 済み実装の後追い正本仕様化は Phase 1 に乖離補正表を必須化し source drift を補正してから Phase 2 以降へ進む |
| L-PSB-003 | 破壊的 backfill apply は dry-run 先行 + `confirm` + in-flight ref の 3 重ガードで多重/未確認実行を防ぐ |
| L-PSB-004 | endpoint レスポンスは zod `.strict()` で検証し parse 失敗時は結果を描画しない fail-closed UI にする |
| L-PSB-005 | admin mutation は `@/features/admin/hooks/useAdminMutation` 経由を標準とし legacy `@/lib/useAdminMutation` を新規参照しない |
| L-PSB-006 | VISUAL_ON_EXECUTION task は Phase 11 を deterministic plan evidence で一次証跡化し staging authenticated screenshots は user-gated に分離する |

## 教訓一覧

### L-PSB-001: 複数アクションボタンの loading 判定に「完了済み mode」を使うと両ボタンが同時に busy 化する

- **症状**: dry-run / apply の 2 ボタンを持つパネルで、片方を実行中にもう片方のボタンも loading 表示される取り違えが起きた。
- **原因**: 各ボタンの `loading` 判定に「最後に完了した `mode`」を使っていたため、in-flight 中のモードを識別できず両ボタンが同じ state を参照していた。
- **対策**: in-flight 中のモードを別 state `activeMode` に持ち、mutation を `try/finally` で囲んで finally で `setActiveMode(null)` する。各ボタンの `loading` を `activeMode === '<その mode>'` 基準にすると「押されたボタンだけ busy」になる。回帰 test `TC-A4b apply pending 中は apply ボタンだけ busy になる` を追加。
- **一般化**: 同一コンポーネント内に複数の非同期アクションがある場合、loading 判定は「完了結果」でなく「in-flight 識別子（どのアクションが進行中か）」を基準にし、finally で確実にクリアする。

### L-PSB-002: landed 済み実装の後追い正本仕様化は Phase 1 に乖離補正表を必須化する

- **症状**: PR #1064 で既に landed したコードを後追いで Phase 1-13 仕様化する際、source task の記述と実コードがずれており、そのまま下流 Phase へ流すと陳腐化した契約を正本化しかけた。
- **原因**: existing-hardening 型タスクは「source task の指示」と「landed reference の実コード」が乖離している前提を Phase 1 で明示していなかった。元タスクには壊れた endpoint path `?fullSync=true-publish-state` が残っていた。
- **対策**: Phase 1 に乖離補正表（landed reference / current code anchor / source-task drift / canonical decision / action）を必須化し、壊れた path を実コード `/api/admin/sync/backfill-publish-state`（`BACKFILL_PUBLISH_STATE_PATH`）へ補正してから Phase 2 以降へ進める。
- **一般化**: landed 済み実装の後追い正本化では、source task をそのまま信頼せず Phase 1 で実コード anchor と突き合わせた乖離補正表を作り、補正済みの値を以降の正本にする。

### L-PSB-003: 破壊的 backfill apply は 3 重ガードで多重/未確認実行を防ぐ

- **症状**: backfill apply は公開状態を一括書換える破壊的操作で、誤って未確認のまま / 多重に実行されるリスクがあった。
- **原因**: dry-run 結果を見ずに apply できる、または apply 連打で並行実行できる状態だった。
- **対策**: dry-run 先行必須 + `confirm` ダイアログ + in-flight ref の 3 重ガードを掛け、dry-run を経ていない apply・確認していない apply・実行中の重複 apply をすべて遮断する。
- **一般化**: 破壊的 admin mutation は「先行 dry-run」「明示 confirm」「in-flight 排他」の 3 段で多重/未確認実行を構造的に防ぐ。

### L-PSB-004: endpoint レスポンスは zod `.strict()` で検証し fail-closed に描画する

- **症状**: endpoint が想定外の shape を返した場合に、信頼してそのまま描画すると壊れた集計が UI に出る恐れがあった。
- **原因**: レスポンスを型注釈だけで信頼し runtime 検証していなかった。
- **対策**: `BackfillResult` を zod `.strict()` で parse し、parse 失敗時は結果を一切描画せず schema mismatch 文言を出す（fail-closed UI）。
- **一般化**: 外部 endpoint のレスポンスは `.strict()` で runtime 検証し、不一致時は描画を止めて mismatch を明示する（invariant #11 fail-closed と整合）。

### L-PSB-005: admin mutation は features hooks 経由を標準とし legacy 参照を増やさない

- **症状**: admin の書込み hook に legacy `@/lib/useAdminMutation` と新 `@/features/admin/hooks/useAdminMutation` の 2 系統があり、新規参照を誤った側に向ける余地があった。
- **原因**: legacy 経路がまだ残存しており import 先の正本が曖昧だった。
- **対策**: admin mutation は `@/features/admin/hooks/useAdminMutation` 経由を標準とし、legacy `@/lib/useAdminMutation` への新規参照を増やさない（不変条件 #10）。
- **一般化**: 二重正本の hook が残る間は「新規参照は新経路のみ」を不変条件として明文化し、legacy は既存参照の範囲に封じ込める。

### L-PSB-006: VISUAL_ON_EXECUTION は Phase 11 を plan evidence で一次証跡化し staging screenshots を user-gated に分離する

- **症状**: VISUAL_ON_EXECUTION task は本来 staging で認証付きスクリーンショットを撮りたいが、それは認証/デプロイを伴い user-gated になる。
- **原因**: Phase 11 の一次証跡を staging screenshots に依存させると、user-gated 操作が完了するまで Phase 11 を閉じられない。
- **対策**: Phase 11 は deterministic plan evidence（決定的に再現可能な計画証跡）で一次証跡化し、staging authenticated screenshots は user-gated に分離して別建てにする。
- **一般化**: VISUAL_ON_EXECUTION task は plan evidence を一次証跡、実環境スクリーンショットを user-gated 二次証跡として 2 層に分け、Phase 11 が user-gated 操作で block されないようにする。

## 確認パス

- `apps/web/src/features/admin/components/_sync/BackfillPublishStatePanel.client.tsx`（`activeMode` per-button busy / dry-run→apply ガード / `BackfillResult` strict parse）
- `apps/web/src/features/admin/components/_sync/__tests__/BackfillPublishStatePanel.spec.tsx`（`TC-A4b`）
- `apps/web/src/features/admin/diagnostics/backfill.ts`（`BACKFILL_PUBLISH_STATE_PATH` / skip 分類）
- `apps/api/src/routes/admin/sync-backfill-publish-state.ts`（endpoint・reused unchanged）
