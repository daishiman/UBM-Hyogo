# System Spec Update Summary

Workflow root `docs/30-workflows/completed-tasks/members-list-ux-clarity/` を新規active workflowとして追加した。
Phase 12 strict 7はparent rootへ集約し、sub task配下のstrict 7複製を禁止する形へ補正した。
Task B/C境界は、Bがprop APIと内部UI、Cが`page.tsx`統合とvisual baseline担当として統一した。

公開仕様のAPI/schema変更は不要。UI内部component契約のみのため、aiworkflow-requirementsはactive workflow/index登録とartifact inventoryで同期する。
