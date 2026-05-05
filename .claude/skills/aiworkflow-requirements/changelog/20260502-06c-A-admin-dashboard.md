# 2026-05-02 06c-A admin dashboard follow-up close-out sync

## 変更概要

- `docs/30-workflows/06c-A-admin-dashboard/` を workflow_state `spec_created` / `outputs_contract_only` / docs-only / remaining-only として正本へ同期。
- 既存 admin dashboard 実装と正本仕様の contract diff を docs-only として整理し、単一 `GET /admin/dashboard` endpoint 維持と `dashboard.view` 除外フィルタを Phase 12 で確定。
- 固有教訓 `lessons-learned-06c-A-admin-dashboard-2026-05.md` と artifact inventory を追加。

## 苦戦箇所

- 既実装の admin dashboard を「未実装」と誤認し、follow-up を missing implementation 扱いしかけた。spec_created / docs-only / remaining-only follow-up は contract diff として分類すべきと整理。
- split endpoint (`/admin/dashboard/kpi` + `/recent-actions`) を検討したが、二重化コストに見合う driver がないため単一 endpoint を維持。
- dashboard 表示で `dashboard.view` を audit_log に書く場合、recent actions / KPI 集計に含めると自己ループで KPI が自己インフレするため、集計側で必ず除外する。

## 検証予定

- `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js`
- `node .claude/skills/aiworkflow-requirements/scripts/validate-structure.js`
- `.claude/skills/aiworkflow-requirements` → `.agents/skills/aiworkflow-requirements` mirror sync
- `diff -qr .claude/skills/aiworkflow-requirements .agents/skills/aiworkflow-requirements`
