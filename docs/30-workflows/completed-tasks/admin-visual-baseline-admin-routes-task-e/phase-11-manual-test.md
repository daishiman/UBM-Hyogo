---
spec_classification: implementation_spec
state: implemented_local_runtime_pending
phase: 11
phase_name: 手動テスト / Evidence
created_at: 2026-05-27
---

# Phase 11: 手動テスト / Evidence

[実装区分: 実装仕様書]

## 1. evidence 配置

```
docs/30-workflows/completed-tasks/admin-visual-baseline-admin-routes-task-e/outputs/phase-11/
  ├── mobile/
  │   ├── admin-dashboard.png
  │   ├── admin-dashboard-attendance.png
  │   ├── admin-members.png
  │   ├── admin-members-detail.png         (env-gated)
  │   ├── admin-tags.png
  │   ├── admin-meetings.png
  │   ├── admin-meetings-detail.png        (env-gated)
  │   ├── admin-schema.png
  │   ├── admin-schema-history.png
  │   ├── admin-requests.png
  │   ├── admin-identity-conflicts.png
  │   └── admin-audit.png
  ├── tablet/   (同 12 routes)
  ├── desktop/  (同 12 routes)
  ├── wide/     (同 12 routes)
  ├── regression-dry-run.md                (token 改変 → diff 検出 → revert ログ)
  ├── manual-test-result.md                (gate 検証結果サマリ)
  └── evidence/                            (Playwright report/test-results artifacts)
```

- 各 png は CI 撮影分 `-linux.png` の縮小コピー or シンボリック参照
- env-gated 2 routes は seed ID 投入後にのみ配置、未投入時は `manual-test-result.md` に skip 明記
- `admin-visual` job の reporter / diff artifact は `outputs/phase-11/evidence/` に保存する

---

## 2. evidence 表（必須）

| viewport | route | baseline path | status |
|---|---|---|---|
| mobile | /admin | outputs/phase-11/mobile/admin-dashboard.png | pending |
| mobile | /admin/dashboard/attendance | outputs/phase-11/mobile/admin-dashboard-attendance.png | pending |
| mobile | /admin/members | outputs/phase-11/mobile/admin-members.png | pending |
| mobile | /admin/members/[id] | outputs/phase-11/mobile/admin-members-detail.png | pending (env-gated) |
| mobile | /admin/tags | outputs/phase-11/mobile/admin-tags.png | pending |
| mobile | /admin/meetings | outputs/phase-11/mobile/admin-meetings.png | pending |
| mobile | /admin/meetings/[id] | outputs/phase-11/mobile/admin-meetings-detail.png | pending (env-gated) |
| mobile | /admin/schema | outputs/phase-11/mobile/admin-schema.png | pending |
| mobile | /admin/schema/history | outputs/phase-11/mobile/admin-schema-history.png | pending |
| mobile | /admin/requests | outputs/phase-11/mobile/admin-requests.png | pending |
| mobile | /admin/identity-conflicts | outputs/phase-11/mobile/admin-identity-conflicts.png | pending |
| mobile | /admin/audit | outputs/phase-11/mobile/admin-audit.png | pending |
| tablet | (同 12) | outputs/phase-11/tablet/* | pending |
| desktop | (同 12) | outputs/phase-11/desktop/* | pending |
| wide | (同 12) | outputs/phase-11/wide/* | pending |

> 実 CI 撮影後、`pending` → `captured` に更新。env-gated は seed 投入後のみ `captured`。

---

## 3. 手動検証手順

1. PR 上で `admin-visual` matrix 4 job 全 green を確認
2. `find apps/web/playwright/tests/visual/admin-shell -name '*-linux.png' | wc -l` 結果が 40 または 48 と一致
3. regression dry-run:
   - branch を一時切り、`tokens.css` の `--color-surface` を改変
   - CI で `admin-visual` が fail することを確認
   - 結果を `outputs/phase-11/regression-dry-run.md` に追記
   - revert（branch 破棄 or revert commit）
4. baseline 縮小コピーを `outputs/phase-11/<viewport>/` に配置（手動 or `magick convert -resize 50%`）
5. `manual-test-result.md` に gate 結果サマリを記載

---

## 4. evidence 必須項目

- viewport 4 × route 10（または 12）の baseline path 表
- gate 結果（typecheck / lint / verify-pr-ready / gate-metadata / phase12-compliance / indexes idempotency）
- regression dry-run ログ（improve → fail → revert）
- env-gated 状態（seed 注入の有無）
