# Phase 10 — 最終レビュー

## 1. AC 検証マトリクス

| AC | 検証方法 | 期待 |
|----|---------|------|
| AC-1 | Phase 4 spec (A1-A3) + Phase 11 screenshot | profile に 3 状態 callout |
| AC-2 | Phase 4 (A1-A4) | CTA href 検証 |
| AC-3 | Phase 4 (B-H2 / B-D2/D3/D5) + Phase 11 manual | drawer + sequential PATCH |
| AC-4 | Phase 4 (B-H2/H3) | progress 表示 |
| AC-5 | Phase 4 (C-P1) + Phase 11 screenshot | AllHiddenFallback |
| AC-6 | Phase 4 (C-P2/P3) | filter empty は EmptyState 維持 |
| AC-7 | Phase 9 verify-design-tokens | pass |
| AC-8 | Phase 9 grep `apps/api/src/routes/` diff | 空 |
| AC-9 | Phase 9 typecheck/lint/vitest/verify-pr-ready.sh | all green |

## 2. blocker 判定

- 全 AC が Phase 4-9 で検証経路を持つ
- blocker なし

## 3. 残課題（unassigned 候補・Phase 12 で formalize）

- 真の bulk endpoint 化（INV-1 で本タスク外）
- publicConsent 直接 toggle endpoint（INV-4 で本タスク外）
- bulk 候補の全 page 横断選択（MINOR-2）

## 4. 完了条件

- [x] AC 9 件全て検証経路明示
- [x] blocker 無し判定
- [x] 残課題列挙
