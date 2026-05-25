---
phase: 13
title: Commit / PR draft
workflow_id: admin-ui-prototype-alignment-followup-002-section-error-retry
status: spec_created
---

# Phase 13: Commit / PR draft

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `admin-ui-prototype-alignment-followup-002-section-error-retry` |
| phase | 13 |
| status | `spec_created` |
| taskType | `implementation` |
| visualEvidence | `NON_VISUAL` |

## 目的

Commit / PR draftの責務を、既存本文の詳細に従って実装サイクルで迷わず実行できる状態に固定する。

## 実行タスク

1. 本 Phase の既存本文に定義された要件・手順・判定表を実装時の入力として確認する。
2. Phase 間の依存順序を守り、前 Phase の完了条件を満たしてから次へ進む。
3. 差分が発生した場合は Phase 11 evidence と Phase 12 strict 7 へ同一 wave で同期する。

## 参照資料

- `index.md`
- `artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- 本ファイル: `phase-13-pr-creation.md`
- 関連 evidence: `outputs/phase-11/` / `outputs/phase-12/`

## 完了条件

- [ ] 本 Phase の既存本文にある必須項目が実装サイクルの入力として確認されている。
- [ ] 参照 path と artifact ledger に矛盾がない。
- [ ] 後続 Phase の完了条件へ接続できる。

---


## 1. commit message draft

```
feat(admin): AdminSectionError に retry CTA を追加（client boundary 経由）

- AdminSectionError.tsx に optional onRetry / retryLabel / isRetrying props を追加（後方互換）
- AdminSectionErrorClient.tsx を新設し useRouter().refresh() + useTransition() で retry を組成
- 採用 11 admin page の error JSX を AdminSectionErrorClient 経由に差し替え（page は server 維持）
- 既存 AdminSectionError.spec.tsx に regression assert を追加
- 新規 AdminSectionErrorClient.spec.tsx で retry click / loading / a11y を検証

Refs: #881 (CLOSED)
Workflow: docs/30-workflows/admin-ui-prototype-alignment-followup-002-section-error-retry/
```

## 2. PR draft

### 2.1 base / head

| 項目 | 値 |
|------|-----|
| base | `dev` |
| head | `feat/admin-section-error-retry`（推奨） |

### 2.2 title

```
feat(admin): AdminSectionError に retry CTA を追加（client boundary 経由）
```

### 2.3 body

```markdown
## Summary

- `AdminSectionError` を server compatible のまま optional `onRetry` / `retryLabel` / `isRetrying` props 拡張
- `AdminSectionErrorClient`（"use client" wrapper）を新設し、`useRouter().refresh()` + `useTransition()` で per-section retry を実現
- 採用 11 admin page で page.tsx を server に保ったまま error JSX を wrapper に差し替え
- per-section error からブラウザ全体リロードを経ずに RSC 再 fetch で回復可能に

## Background

- Issue #881（CLOSED）/ parent `admin-ui-prototype-alignment` Phase 10 final-review L23 の deferred を解消
- Workflow: `docs/30-workflows/admin-ui-prototype-alignment-followup-002-section-error-retry/`
- 既存 unassigned-task spec を Phase 1-13 構造に再構成（新規設計なし）

## Scope

- `apps/web/src/features/admin/components/_shared/AdminSectionError.tsx`（props 拡張）
- `apps/web/src/features/admin/components/_shared/AdminSectionErrorClient.tsx`（新規）
- `apps/web/src/features/admin/components/_shared/index.ts`（re-export 追加）
- 採用 11 `apps/web/app/(admin)/admin/**/page.tsx`
- `__tests__/AdminSectionError.spec.tsx`（regression assert 追加）
- `__tests__/AdminSectionErrorClient.spec.tsx`（新規）

## Out of scope

- `AdminSectionError` 自体の client 化
- section-scoped cache invalidation API
- 新規 primitive 追加
- 既存 API endpoint 変更

## Invariants（CLAUDE.md / parent 継承）

- 既存 API endpoint surface のみ接続
- OKLch トークン正本維持（HEX 直書き 0）
- 新規 primitive 不追加
- D1 直接アクセスなし
- `*.spec.tsx` 命名遵守
- page.tsx に `"use client"` 追加なし（grep 検証）

## Test plan

- [ ] `mise exec -- pnpm typecheck`
- [ ] `mise exec -- pnpm lint`
- [ ] `mise exec -- pnpm exec vitest run apps/web/src/features/admin/components/_shared/__tests__/AdminSectionError.spec.tsx`
- [ ] `mise exec -- pnpm exec vitest run apps/web/src/features/admin/components/_shared/__tests__/AdminSectionErrorClient.spec.tsx`
- [ ] `mise exec -- pnpm verify:tokens`
- [ ] `mise exec -- pnpm gate-metadata:validate`
- [ ] `mise exec -- pnpm verify:phase12-compliance`
- [ ] `bash scripts/verify-pr-ready.sh`
- [ ] `git diff dev...HEAD -- 'apps/web/app/(admin)/admin/**/page.tsx' | rg -n '^\+.*"use client"'` → 0 件

## Evidence

- `docs/30-workflows/admin-ui-prototype-alignment-followup-002-section-error-retry/outputs/phase-11/unit-test-result.md`
- `docs/30-workflows/admin-ui-prototype-alignment-followup-002-section-error-retry/outputs/phase-11/axe-result.md`
- `docs/30-workflows/admin-ui-prototype-alignment-followup-002-section-error-retry/outputs/phase-11/grep-use-client-result.md`

## Refs

- Closes: なし（issue #881 は既に CLOSED）
- Related: #881 / parent workflow `admin-ui-prototype-alignment`
```

## 3. required status check 候補

| context | 必須/任意 | 備考 |
|---------|-----------|------|
| typecheck | 必須 | 既存 |
| lint | 必須 | 既存 |
| vitest (web unit) | 必須 | 既存 |
| verify-design-tokens | 必須 | 既存 gate |
| verify-gate-metadata | 必須 | 既存 gate |
| verify-phase12-compliance | 必須 | 既存 gate |
| axe (a11y) | 任意 | 既存 admin spec の枠で実行 |

> branch protection の `gh api -X PUT` は本 PR スコープ外（CLAUDE.md「branch protection 実値が正本」方針、user 明示承認後のみ）。

## 4. PR 作成コマンド（user 明示承認後のみ実行）

```bash
gh pr create --base dev --title "feat(admin): AdminSectionError に retry CTA を追加（client boundary 経由）" \
  --body "$(cat <<'EOF'
（§2.3 の本文をここに貼る）
EOF
)"
```

## 5. merge 後の後続

- parent `admin-ui-prototype-alignment/outputs/phase-10/final-review.md` の deferred 記述に「解消済（#881 / 本 PR）」追記タスクを unassigned-task に登録（または同 PR で同時更新）
- 本 workflow ディレクトリを `docs/30-workflows/completed-tasks/` 配下へ移動する別タスク仕様書を作成（本 PR スコープ外）
