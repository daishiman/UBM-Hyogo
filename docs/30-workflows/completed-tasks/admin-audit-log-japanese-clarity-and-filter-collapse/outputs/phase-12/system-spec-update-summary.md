# Phase 12 — システム仕様更新サマリ（Step 1 / Step 2）

> ステータス: `completed`。本ファイルは「タスク完了記録方針（Step 1-A/1-B/1-C）」と「新規インターフェース追加判定（Step 2）」を記録する。本ワークフローは `implemented_local_evidence_captured`。

---

## 実装状況テーブル

| 項目 | 状態 |
| --- | --- |
| workflow_state | `implemented_local_evidence_captured` |
| コード実装（apps/web 表現層） | 完了 |
| focused vitest | 4 files / 57 tests PASS |
| typecheck / lint / verify:tokens | PASS（`mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` / `mise exec -- pnpm verify:tokens`） |
| commit / push / PR / staging capture | user 明示承認後 |

---

## Step 1 — タスク完了記録方針

| Step | 内容 | 本サイクルでの扱い |
| --- | --- | --- |
| Step 1-A | LOGS.md / SKILL-changelog 等への完了記録 | workflow artifact inventory を追加。skill 操作手順変更なし |
| Step 1-B | indexes 再生成（`pnpm indexes:rebuild`）/ keywords・topic-map 更新 | aiworkflow index は quick-reference / resource-map / task-workflow-active / generated topic-map / keywords を同 wave 同期。gate-metadata は ERROR 0 |
| Step 1-C | quick-reference / resource-map 等の手書き同期 | 同 wave で反映 |

> 理由: 本タスクの実装差分は `apps/web` の admin audit feature ローカル表現層（component / glossary / globals.css / test）に閉じ、`apps/api` / `packages/shared` / design token / primitive catalog の公開 surface を変更しない。

---

## Step 2 — 新規インターフェース追加の有無判定

本タスクで導入する新規コード境界が aiworkflow-requirements の**公開 surface（正本）に昇格するか**を判定する。

| 新規インターフェース | 配置 | 公開 surface か | 正本更新 |
| --- | --- | --- | --- |
| `describeAuditAction(code: string): string` | `apps/web/src/components/admin/auditGlossary.ts`（feature ローカル） | **No**（admin audit feature 内部の表示変換 helper。他 feature / API / shared から参照されない） | **N/A** |
| `describeAuditTargetType(code: string \| null): string` | 同上 | **No**（同上） | **N/A** |
| `describeAuditField(key: string): string` | 同上 | **No**（同上） | **N/A** |
| `AUDIT_ACTION_LABELS` / `AUDIT_TARGET_TYPE_LABELS` / `AUDIT_FIELD_LABELS` ラベルマップ | 同上 | **No**（feature 内部の表示用 SSOT。型は `Readonly<Record<string,string>>` で新規 shared 型を作らない） | **N/A** |

### 判定結論

- いずれも **feature ローカル**であり、`apps/api` / `packages/shared` の公開型・endpoint・design token 正本のいずれにも新規 surface を追加しない。
- 既存 primitive（`Card` / `FormField` / `Input` / `Select` / `Button` / `Chip` / ネイティブ `<details>`）のみで構成（AC-10）。新規 primitive 0 件。
- 新規 design token 0 件（既存 `--ubm-color-*` / `--ubm-space-*` / `--ubm-radius-*` のみ。AC-8）。
- query param キー（`<input name>`）は不変で API 契約を保つ（AC-9）。
- したがって **aiworkflow-requirements 正本の更新は N/A**。

### same-wave sync 判定

今回の実装では global skill へ同期する新規パターンはない。glossary helper の raw fallback 設計は feature ローカルの実装知見として本 workflow docs に記録し、aiworkflow-requirements 正本へは昇格しない。
