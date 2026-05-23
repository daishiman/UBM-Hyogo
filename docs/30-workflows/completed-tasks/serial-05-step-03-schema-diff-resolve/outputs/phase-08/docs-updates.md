**[実装区分: 実装仕様書]**

# Phase 8: ドキュメント更新 — serial-05-step-03-schema-diff-resolve

## 1. 更新方針

本 wave は `implemented-local-runtime-pending` の実装同梱 wave であり、既存 API shape は変更しないが、UI-visible contract（stableKey client validation、table semantics、focus、payload detail 表示、status label）を hardening した。したがって manual specs と aiworkflow 正本仕様を同一 wave で更新する。

## 2. 更新対象一覧

| ファイル | 種別 | 更新内容 |
| --- | --- | --- |
| `docs/30-workflows/serial-05-step-03-schema-diff-resolve/index.md` | 新規 | step-03 のエントリポイント。既存 `SchemaDiffPanel` hardening と Phase 1〜13 outputs を集約。 |
| `artifacts.json` / `outputs/artifacts.json` | 新規 | root 正本と outputs mirror を同値で配置。 |
| `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/step-03-schema-diff-resolve/spec.md` | 更新 | greenfield 前提を既存 `SchemaDiffPanel` hardening へ補正。 |
| `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` | 実装時に判定 | 実装完了時に `resolve UI: done` 等へ更新する。 |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | 更新 | `schema_aliases` write target、stableKey regex、202/409/422 payload 境界を同期。 |
| `docs/00-getting-started-manual/specs/11-admin-management.md` | 更新 | `/admin/schema` UI の validation / feedback / retryable status contract を同期。 |
| `.claude/skills/aiworkflow-requirements/**` | 更新 | quick-reference / resource-map / task-workflow-active / API/UI refs / LOGS / changelog / SKILL.md を同期。 |

## 3. System Spec 判定

今回更新した理由:

- 新規 endpoint を追加しない。
- Worker route `/admin/schema/diff` / `/admin/schema/aliases` の request / response shape を変更しない。
- browser proxy `/api/admin/schema/*` は既存 admin proxy 経路であり、仕様追加ではない。
- 新規 env `ADMIN_SCHEMA_RESOLVE_ENABLED` は導入しない。
- ただし UI が API regex と 409/422 payload detail を画面に露出するため、正本仕様への反映が必要。

## 4. 実装 wave で更新する場合の固定文言

実装時に正本仕様を更新する場合は、Worker path と browser proxy path を分けて書く。

```text
Browser proxy: /api/admin/schema/*
Worker route: /admin/schema/*
GET /admin/schema/diff response: { total, items }
Unresolved status: queued
POST /admin/schema/aliases: 200 apply / 202 retryable continuation / 409 conflict / 422 stable_key_collision
```

## 5. 検証コマンド

```bash
rg "ADMIN_SCHEMA_RESOLVE_ENABLED" docs/30-workflows/serial-05-step-03-schema-diff-resolve
rg "GET /api/admin/schema/diff.*\\{ ok|\\\"diffs\\\"|status.*pending" docs/30-workflows/serial-05-step-03-schema-diff-resolve
cmp -s docs/30-workflows/serial-05-step-03-schema-diff-resolve/artifacts.json docs/30-workflows/serial-05-step-03-schema-diff-resolve/outputs/artifacts.json
```

## 6. DoD

- [x] Phase 12 `system-spec-update-summary.md` と implemented-local 方針が一致
- [x] API contract は `{ total, items }` / `queued|resolved` に統一
- [x] 新規 env gate 記述なし
- [x] root/output artifacts parity を確認
