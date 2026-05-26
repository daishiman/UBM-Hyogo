# Phase 7: Quality Gates

## 1. Overview

本 workflow は 2 段ゲート（Gate-A: spec_review / Gate-B: implementation_review）で品質を担保する。

## 2. Gate-A: spec_review

### 2.1 目的

Phase 1-13 の仕様書群が一貫しており、案 B の設計判断・不変条件遵守・スコープ確定が文書として完備されていることを確認する。

### 2.2 合格基準

- [ ] Phase 1-13 ファイルが 14 ファイル揃っている（phase-01 〜 phase-13 + artifacts.json）
- [ ] Phase 12 が canonical 9 headings を満たす
- [ ] 不変条件 1-4 + RSC 維持の遵守が Phase 1 / Phase 12 に明記
- [ ] 採用案（案 B）と不採用案（案 A）の根拠が Phase 2 に明記
- [ ] 変更対象ファイル一覧が Phase 3 / Phase 5 で一致
- [ ] `verify:phase12-compliance` 相当の見出し充足
- [ ] gate-metadata:validate（artifacts.json zod schema）pass

### 2.3 承認者

- `daishiman`（solo dev）

### 2.4 evidence

- `docs/30-workflows/issue-894-admin-topbar-breadcrumb-integration/phase-12-compliance-check.md`

## 3. Gate-B: implementation_review

### 3.1 目的

Phase 5 の implementation guide に従った実装が、Phase 6 のテスト戦略を満たすことを確認する。

### 3.2 合格基準

- [ ] T1 〜 T4 すべての差分が Phase 5 と一致
- [x] `mise exec -- pnpm exec vitest run "apps/web/app/(admin)/layout.spec.tsx"` pass
- [x] `mise exec -- pnpm exec vitest run "apps/web/src/components/admin/__tests__/Breadcrumb.spec.tsx"` pass
- [ ] `mise exec -- pnpm typecheck` 0 error
- [ ] `mise exec -- pnpm lint` 0 warning
- [x] axe critical violation 0
- [x] `grep -rn 'label: "管理"' "apps/web/app/(admin)/admin/"` が 0 件
- [x] `(admin)/layout.tsx` の冒頭に `"use client"` が **無い** ことを目視確認
- [x] HEX 直書き / arbitrary class が増えていないことを grep 確認

### 3.3 承認者

- `daishiman`（solo dev）

### 3.4 evidence

- 実装完了時の vitest pass log
- typecheck / lint pass log
- grep 0 件の出力

## 4. Gate 通過後の遷移

- Gate-A passed → Phase 5-10 を着手可
- Gate-B passed → Phase 13 commit/PR フェーズへ
- 両 Gate passed → `commit_push_pr: "user_gated"` のため、ユーザー明示承認後に commit / push / PR
