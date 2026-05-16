# Lessons Learned: serial-05-step-02 identity-conflicts merge UI

対象 workflow: `docs/30-workflows/completed-tasks/serial-05-step-02-identity-conflicts-merge/`
状態: `implemented_local_visual_evidence_captured / implementation / VISUAL`
作成日: 2026-05-16

## L-S5S2-001: existing-UI hardening は contract drift 検出から始める

`/admin/identity-conflicts` は既に `IdentityConflictRow` が実装され `POST /merge` / `POST /dismiss` の二系統に分離されていたが、`docs/00-getting-started-manual/specs/09-ui-ux.md` には旧 `/resolve` 単一エンドポイントの表記が残っていた。既存 UI の hardening 系タスクでは Phase 1 で **spec 表記 ↔ 実 API endpoint ↔ 実 UI component** の3点照合を必須化し、最初に検出された drift をワークフロー spec に書き戻す。spec を信じて実装してしまうと、後で「直書き callJson の置換」と「spec 文書修正」が同サイクル内で二重スコープ化する。

## L-S5S2-002: shared mutation hook は signature を変えずに operator message を内部化する

`useAdminMutation` は step-01 で確定した owner であり、step-02 では `<MergeIdentityResponse>` / `<DismissIdentityConflictResponse>` の型パラメータ追加のみで再利用できた。401/403 等は parallel-10 owner の `FetchAuthedError` 経路を維持しつつ、ドメイン固有エラー (`ALREADY_MERGED` / `TARGET_MEMBER_MISMATCH` / `ALREADY_DISMISSED`) は **operator message map** として hook 内部に集約。AC-12「hook signature 不変」を gate にすれば step-03..08 の呼び出し元が hook 改修負担を負わない設計が維持できる。新規エラーコード追加時はマップ更新と spec test 追加のみで完結する pattern として skill-creator の pitfall references に昇格価値あり。

## L-S5S2-003: 二段階確認の reason state は merge と dismiss で分離する

merge 用 reason と dismiss 用 reason を 1 つの state に共用すると、片方の操作で 400 / 409 が返った後にもう一方の confirm を開いたとき、意図しない reason が prefilled される事故が起きる。`mergeReason` / `dismissReason` を独立 state にし、失敗時も同じ reason が panel 内に保持され、ユーザが文言を編集して再送できる UX を AC-4「panel 維持」に紐付ける。inline alert は `role="alert"` + `aria-live="polite"` + `aria-describedby` でフォーム入力との関係を SR に伝える。

## L-S5S2-004: 薄い skill-feedback-report は再利用パターン抽出の機会損失

Phase 12 の `skill-feedback-report.md` が "No update is required / local workflow execution drift" のみで終わると、operator message map・reason state 分離・existing-row hardening 手順といった **再利用可能パターン** が次サイクルへ継承されない。skill-feedback-report のテンプレートには「(a) 反映先 skill path、(b) 再利用パターン2件以上の有無、(c) 該当なし理由」の3点を必ず記載する gate を設け、lessons-learned 側に L-S5S2-002/003 のような pattern entry を残せる構造にする。今回は本ファイル内で代替記録する。

## L-S5S2-005: completed-tasks 配下への workflow 移動と skill index path の同期

workflow を `docs/30-workflows/<slug>/` から `docs/30-workflows/completed-tasks/<slug>/` に移動した瞬間、`indexes/resource-map.md` と `references/workflow-<slug>-artifact-inventory.md` の path 表記は drift する。完了移動 PR では (a) resource-map 該当行、(b) artifact-inventory `workflow root` / `Evidence` 表、(c) `task-workflow-active.md` 該当 entry の3箇所を同一 commit で書き換えることをチェックリスト化する。`task-workflow-active.md` は active ledger として non-completed path のままにする運用は前例 step-01 を踏襲する。

## 関連参照

- workflow root: `docs/30-workflows/completed-tasks/serial-05-step-02-identity-conflicts-merge/`
- parent workflow: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/`
- 対となる前段: [lessons-learned-serial-05-step-01-members-note-mutation-ui-2026-05.md](lessons-learned-serial-05-step-01-members-note-mutation-ui-2026-05.md)
- skill index 同期: `indexes/resource-map.md`, `references/task-workflow-active.md`, `references/workflow-serial-05-step-02-identity-conflicts-merge-artifact-inventory.md`
- changelog: `changelog/20260516-serial-05-step-02-identity-conflicts-merge.md`
