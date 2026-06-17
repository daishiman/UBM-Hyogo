# Phase 12 — システム仕様更新サマリ（Step 1 / Step 2）

> ステータス: `implemented_local_visual_present_staging_pending`。本ファイルは「workflow inventory 同期」と「新規インターフェース追加判定（Step 2）」を分けて記録する。本タスクは**文字列リネーム中心**で新規公開 surface を追加しないため system contract Step 2 は N/A。一方、新規 active workflow root の inventory sync は実施済み。

---

## Step 1 — タスク完了記録方針

| Step | 内容 | 本サイクルでの扱い |
| --- | --- | --- |
| Step 1-A | workflow artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-admin-attendance-dashboard-jp-clarity-and-ux-artifact-inventory.md` を追加 |
| Step 1-B | active workflow / indexes 導線 | `references/task-workflow-active.md`、`indexes/quick-reference.md`、`indexes/resource-map.md` に active root を登録 |
| Step 1-C | system contract / public surface | 新規 endpoint / D1 / shared 型 / design token / primitive なし → 正本仕様の追加更新は N/A |

> 理由: 本タスクの実装差分は `apps/web` の admin attendance feature ローカル表現層（表示文字列・aria-label の文言 + 軽微 CSS + テスト追従）に閉じ、`apps/api` / `packages/shared` / design token / primitive catalog / aiworkflow-requirements 公開 surface を変更しない。ただし新規 workflow root は active inventory から到達可能である必要があるため、workflow inventory sync は N/A ではなく実施済み。

---

## Step 2 — 新規インターフェース追加の有無判定

本タスクで導入する新規コード境界が aiworkflow-requirements の**公開 surface（正本）に昇格するか**を判定する。

| 検討対象 | 配置 | 新規 surface か | 正本更新 |
| --- | --- | --- | --- |
| `PERIOD_PRESETS[].label` | `lib/format-attendance.ts`（既存定数） | **No**（既存定数の label 文字列のみ変更。`value`・型・配列構造は不変） | **N/A** |
| `ZONE_HELP` | `lib/format-attendance.ts`（既存定数） | **No**（既存定数の本文文字列のみ置換） | **N/A** |
| `formatDelta` の単位表記 | `lib/format-attendance.ts`（既存関数） | **No**（戻り値の文字列リテラル `"pt"`→`"ポイント"` のみ。signature・計算ロジック不変） | **N/A** |
| 各コンポーネントの表示文字列 / aria-label | `components/*.tsx`（既存） | **No**（JSX 内の表示テキスト・aria-label 文言の置換のみ。props・型・DOM 構造不変） | **N/A** |

### 判定結論

- 本タスクは **文字列リネームのみ**であり、新規 interface / 型 / 定数 / 関数 / API / endpoint / design token / primitive を **一切追加しない**。
- 既存の関数・定数・コンポーネントの **表示文字列と aria-label 文言** を変更するのみで、signature・props・型・DOM contract（testid / href / role / data-*）は保持する（AC-6 / AC-8）。
- 新規 design token 0 件（既存 `--ubm-color-*` のみ。AC-5）。
- したがって **system contract としての aiworkflow-requirements 正本更新は N/A**。ただし workflow inventory 登録は実施済み。

### same-wave sync 判定

今回の実装では API / primitive / token / shared 型へ同期する新規パターンはない。文字列リネーム中心のため、feature ローカルの文言置換知見は本 workflow docs と artifact inventory に記録し、system contract へは昇格しない。`outputs/artifacts.json` は root `artifacts.json` の mirror として byte identical に保つ。
