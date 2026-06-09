# Phase 12 — システム仕様更新サマリ（Step 1 / Step 2）

> ステータス: `completed`。本ファイルは「タスク完了記録方針（Step 1）」と「新規インターフェース追加判定（Step 2）」を記録する。

---

## Step 1 — タスク完了記録方針

| Step | 内容 | 本サイクルでの扱い |
| --- | --- | --- |
| Step 1-A | LOGS.md / SKILL-changelog 等への完了記録 | feature ローカル UI 改修のみ。公開 surface / skill 操作手順の変更なし → N/A |
| Step 1-B | indexes 再生成（`pnpm indexes:rebuild`）/ keywords・topic-map 更新 | 新規 skill resource / public spec surface の追加なし → N/A |
| Step 1-C | quick-reference / resource-map 等の手書き同期 | 該当なし |

> 理由: 本タスクの実装差分は `apps/web` の admin attendance feature ローカル表現層に閉じ、`apps/api` / `packages/shared` / design token / primitive catalog / aiworkflow-requirements 公開 surface を変更しない。

---

## Step 2 — 新規インターフェース追加の有無判定

本タスクで導入する新規コード境界が aiworkflow-requirements の**公開 surface（正本）に昇格するか**を判定する。

| 新規インターフェース | 配置 | 公開 surface か | 正本更新 |
| --- | --- | --- | --- |
| `attendanceFollowLevel(count): "none" \| "warn"` 純粋関数 | `apps/web/src/features/admin/attendance/lib/attendance-follow-level.ts`（feature ローカル） | **No**（feature 内部の表現補助関数。他 feature / API / shared から参照されない） | **N/A** |
| `AttendanceDetailTabs` props（`AttendanceDetailTabsProps` / `DetailTabKey`） | `apps/web/src/features/admin/attendance/components/AttendanceDetailTabs.tsx`（feature ローカル） | **No**（feature 内部の DETAIL ゾーン専用タブホスト。primitive ではない・props は既存 shared 型のみ受領） | **N/A** |

### 判定結論

- 両者とも **feature ローカル**であり、`apps/api` / `packages/shared` の公開型・endpoint・design token 正本のいずれにも新規 surface を追加しない。
- 既存 primitive（`Segmented` / `Badge` / `Stat` / `Card` / `AdminSectionCard` / `AdminSectionErrorClient`）のみで構成（AC-6）。新規 primitive 0 件。
- 新規 design token 0 件（既存 `--ubm-color-*` のみ。AC-5）。
- したがって **aiworkflow-requirements 正本の更新は N/A**。

### same-wave sync 判定

今回の実装では global skill へ同期する新規パターンはない。`AttendanceDetailTabs` の SafeResult タブ単位 degrade は feature ローカルの実装知見として本 workflow docs に記録し、aiworkflow-requirements 正本へは昇格しない。
