---
phase: 8
title: Definition of Done
workflow_id: ui-prototype-design-system-foundation
sub_workflow: issue-903-parallel-03-followup-005-member-runtime-evidence
status: implemented_local_evidence_captured
taskType: implementation
visualEvidence: VISUAL
implementation_mode: code_change_plus_evidence
---

# Phase 8 — DoD

[実装区分: 実装仕様書]

## 8.1 DoD チェックリスト

### 機能

- [ ] `apps/web/app/(member)/profile/page.tsx` が存在
- [ ] `apps/web/app/profile/` ディレクトリが空 / 削除済み
- [ ] `/profile` URL が 200（member セッション必須）
- [ ] `parallel-03-member-shell-scrape.spec.ts` が pass

### Evidence

- [ ] `dom-scrape-member.txt` が trace header + 1 件以上の data-* 行を含む
- [ ] `screenshots/member-shell.png` 1280x800 で非空
- [ ] 親 `phase-11-evidence-inventory.md` の EV-13 / EV-16 が `present`

### Quality

- [ ] `mise exec -- pnpm typecheck` 0 error
- [ ] `mise exec -- pnpm lint` 0 error
- [ ] `bash scripts/verify-pr-ready.sh` 0 fail
- [ ] `static-invariants.runtime.spec.ts` S-01/02/04/04b の新 path で pass

### Invariants

- [ ] HEX 直書きを scrape 出力に含まない
- [ ] 新規 API endpoint / D1 schema 変更なし
- [ ] 新規 primitive 追加なし
- [ ] `apps/web` から D1 直接アクセスなし
- [ ] status 語彙 `present` / `pending` / `n/a` のみ
