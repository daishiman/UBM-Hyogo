# Phase 12 — システム仕様更新サマリ（Step 1 / Step 2）

> ステータス: `implemented_local_runtime_pending`。本ファイルは「タスク完了記録方針（Step 1）」と「新規インターフェース追加判定（Step 2）」を記録する。同一サイクルで `apps/web` 表現層実装とローカル検証まで完了した。

---

## Step 1 — タスク完了記録方針

| Step | 内容 | 本サイクルでの扱い |
| --- | --- | --- |
| Step 1-A | LOGS.md / SKILL-changelog 等への完了記録 | feature ローカル UI 改修であり skill 操作手順の変更なし。aiworkflow workflow ledger へ `implemented_local_runtime_pending` として同期 |
| Step 1-B | indexes 再生成（`pnpm indexes:rebuild`）/ keywords・topic-map 更新 | 新規 skill resource / public spec surface の追加なし → **N/A（`pnpm indexes:rebuild` 不要）** |
| Step 1-C | quick-reference / resource-map 等の手書き同期 | workflow ledger 参照のみ同期。API / D1 / shared / design token 正本の公開 surface は不変 |

> 理由: 本タスクの実装差分は `apps/web` の admin requests feature ローカル表現層に閉じ、`apps/api` / `packages/shared` / design token / primitive catalog / aiworkflow-requirements 公開 surface を変更しない。

---

## Step 2 — 新規インターフェース追加の有無判定 = **N/A**

本タスクで導入する新規コード境界が aiworkflow-requirements の**公開 surface（正本）に昇格するか**を判定する。

| 新規インターフェース | 配置 | 公開 surface か | 正本更新 |
| --- | --- | --- | --- |
| `formatPublishStateLabel(state: string): string` 純粋関数 | `apps/web/src/components/admin/RequestQueueDetail.tsx`（feature ローカル） | **No**（feature 内部の表示補助関数。`public/member_only/hidden/unknown` → 日本語ラベル。他 feature / API / shared から参照されない） | **N/A** |
| `buildPublishStateDiff(item): PublishStateDiff \| null` 純粋関数 | `apps/web/src/components/admin/RequestQueueDetail.tsx`（feature ローカル） | **No**（feature 内部の diff 構築関数。note_type で意味軸分岐。primitive ではなく入力は既存 client type のみ） | **N/A** |

### 判定結論

- 両者とも **feature ローカル**であり、`apps/api` / `packages/shared` の公開型・endpoint・design token 正本のいずれにも新規 surface を追加しない。
- 既存 primitive（`card` / `ui-badge` 等）と `data-diff-side` 属性のみで構成（AC-6）。新規 primitive 0 件。
- 新規 design token 0 件（既存 `--ubm-color-accent` / `--ubm-color-text-secondary` / `--ubm-color-text-muted` のみ。AC-5）。
- したがって **aiworkflow-requirements 正本の更新は N/A**・`pnpm indexes:rebuild` 不要。

### same-wave sync 判定

今回の仕様では global skill へ同期する新規パターンはない。`buildPublishStateDiff` の note_type 意味軸分岐は feature ローカルの実装知見として本 workflow docs に記録し、aiworkflow-requirements 正本へは昇格しない。`formatPublishStateLabel` / `buildPublishStateDiff` は `apps/web` admin 機能ローカル・公開 surface 非昇格であり、昇格不要・indexes 再生成不要。
