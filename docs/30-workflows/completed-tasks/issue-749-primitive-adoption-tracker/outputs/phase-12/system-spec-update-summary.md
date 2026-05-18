# System Spec Update Summary — Issue #749

## 更新対象 spec

| spec | 更新要否 | 内容 |
| --- | --- | --- |
| `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-09-ux-cross-cutting/spec.md` | 不要 | primitive 群定義は既に正本。本タスクは採用追跡のみ |
| `CLAUDE.md` § 重要な不変条件 | 更新済み | 「admin panel form input は FormField 経由標準」「admin mutation は `@/features/admin/hooks/useAdminMutation` 経由標準」を同一サイクルで追記 |
| `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SCOPE.md` | 不要 | 19 routes 定義は既に正本。本 workflow の matrix と参照パスを completed SCOPE に同期 |
| `docs/00-getting-started-manual/specs/*.md` | 不要 | system spec 側に primitive 採用ルールは存在しない |

## 新規 spec 追加

| spec | 用途 |
| --- | --- |
| `docs/30-workflows/completed-tasks/issue-749-primitive-adoption-tracker/` 配下一式 | 本タスクの実装仕様書 |
| `docs/30-workflows/completed-tasks/issue-749-primitive-adoption-tracker/outputs/adoption-tracker.md` | 19×6 採用 matrix（Phase 8 生成） |

## CLAUDE.md 追補（実施済み）

```md
9. admin panel の form input は `FormField` 経由を標準とし、`apps/web/src/components/admin/` 配下で直接 `<input>` を増やさない
10. admin mutation は `@/features/admin/hooks/useAdminMutation` 経由を標準とし、legacy `@/lib/useAdminMutation` への新規参照を増やさない
```

Phase 10 へ先送りせず、CONST_005 に従い今回サイクルで解消済み。

## aiworkflow-requirements same-wave sync

| 対象 | 状態 | 内容 |
| --- | --- | --- |
| `indexes/quick-reference.md` | 更新対象 | Issue #749 workflow root と状態を追加 |
| `indexes/resource-map.md` | 更新対象 | Issue #749 の最初に読むファイル / 実装対象を追加 |
| `references/task-workflow-active.md` | 更新対象 | Active workflow として `implemented_local_evidence_captured / implementation / VISUAL_RUNTIME_PENDING` を登録 |
| `changelog/20260517-issue749-primitive-adoption-tracker.md` | 新規 | same-wave sync fragment |
| `LOGS/_legacy.md` | 更新対象 | 使用履歴 fragment として追加 |

## Step 2（条件付き）: 新規インターフェース追加時のみ

**判定: N/A**

理由:

- 本タスクは既存 UI primitive と既存 admin mutation hook の採用追跡仕様であり、TypeScript interface / API endpoint / D1 schema / shared package 型の新規追加は Phase 4 の要件に含めない。
- 19 routes の正本は `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SCOPE.md` にあり、本 workflow はその母集団に対する tracker を作る。
- 実装時の code change は `apps/web` UI と grep gate / workflow に閉じ、API 契約変更が必要になった場合は Phase 3 NO-GO 条件で停止する。

## 苦戦箇所（lessons learned）

- 同名 export drift（`lib/useAdminMutation` と `features/admin/hooks/useAdminMutation`）が放置されると採用追跡が困難になる。今後の primitive 追加時は **正本パスを 1 つに固定**し、@deprecated と CI grep gate で legacy を駆逐するパターンを定着させる
- 19 × 6 マトリクスのような umbrella tracking は **grep gate なしでは drift を検出できない**。spec で網羅範囲を定義し、必ず CI workflow を 1 本セットで追加する
