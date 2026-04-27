# Phase 7: 検証項目網羅性 — 主成果物

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 / 13 |
| 状態 | completed |
| 作成日 | 2026-04-26 |

## AC × 検証項目マトリクス

| AC | 検証観点 | 検証方法 | Phase | 判定 |
| --- | --- | --- | --- | --- |
| AC-1: apps/web / apps/api 責務境界の明文化 | runtime-topology.md が正しく責務を記述しているか | `rg "apps/web\|apps/api" doc/02-serial-monorepo-runtime-foundation` で boundary キーワードを確認 | 1, 2, 3, 6, 9, 10 | PASS |
| AC-2: Node 24.x / pnpm 10.x / Next.js 16.x / React 19.2.x / TS 6.x strict | version-policy.md に全バージョンが記録されているか | `cat outputs/phase-02/version-policy.md` で確認 | 1, 2, 3, 9, 10 | SPEC-PASS_WITH_SYNC（TS 6.x は Phase 12 で正本同期） |
| AC-3: dependency rule の一意説明 | dependency-boundary-rules.md が作成されているか | `cat outputs/phase-08/dependency-boundary-rules.md` で確認 | 1, 2, 3, 8, 9, 10 | SPEC-PASS（Phase 8 で作成） |
| AC-4: @opennextjs/cloudflare 採用理由・@cloudflare/next-on-pages 不採用理由の記録 | phase-02 設定値表 + phase-03 代替案に記録があるか | `rg "@opennextjs\|@cloudflare/next-on-pages" doc/02-serial-monorepo-runtime-foundation` | 1, 2, 3, 6, 9, 10 | SPEC-PASS_WITH_SYNC（Phase 12 で正本同期） |
| AC-5: local / staging / production entry point の説明 | foundation-bootstrap-runbook.md に entry point が記載されているか | `cat outputs/phase-05/foundation-bootstrap-runbook.md` で確認 | 1, 2, 5, 9, 10 | SPEC-PASS |

## 未カバー AC とフォロー方針

| AC | 状況 | フォロー |
| --- | --- | --- |
| AC-2（TS 6.x） | 正本仕様（technology-core.md）が TS 5.7.x のまま | Phase 12 Step 2 で同期（必須） |
| AC-4（@opennextjs/cloudflare） | phase-02 / phase-03 に記録済みだが、正本仕様への反映が未 | Phase 12 Step 2 で同期（必須） |

## 検証項目網羅チェック

| 項目 | 確認結果 |
| --- | --- |
| phase-01/main.md が存在する | PASS |
| phase-02/runtime-topology.md が存在する | PASS |
| phase-02/version-policy.md が存在する | PASS |
| phase-03/main.md が存在する | PASS |
| phase-04/main.md が存在する | PASS |
| phase-05/main.md が存在する | PASS |
| phase-05/foundation-bootstrap-runbook.md が存在する | PASS |
| phase-06/main.md が存在する | PASS |
| phase-07/main.md（本ファイル）が存在する | PASS |
| phase-08/dependency-boundary-rules.md（Phase 8 で作成） | PENDING |
| branch drift（develop 混在）がないか | PASS（Phase 6 A1 CLEAR） |
| secret placement が正しいか | PASS（Phase 6 A2 CLEAR） |
| @cloudflare/next-on-pages が残存していないか | PASS（Phase 6 A8 CLEAR） |
| NEXTAUTH_* が残存していないか | PASS（Phase 6 A9 CLEAR） |

## 4条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | AC トレースにより、下流 task が参照する成果物の完全性を保証する |
| 実現性 | PASS | ファイル存在確認、rg コマンド、typecheck、Phase 11 screenshot で確認 |
| 整合性 | PASS | AC-2 / AC-4 の同期必要項目を MINOR として Phase 12 に引き継ぎ |
| 運用性 | PASS | Phase 8 / 9 / 10 / 12 への明確な handoff |

## Phase 7 → Phase 8 handoff

| 引き継ぎ事項 | 内容 |
| --- | --- |
| 同期必要項目 | AC-2（TS 6.x）・AC-4（@opennextjs/cloudflare）は Phase 12 Step 2 で正本仕様と同期 |
| Phase 8 の作業 | outputs/phase-08/dependency-boundary-rules.md を作成し AC-3 を PASS にする |
| MINOR 追跡 | Phase 3 の M-01〜M-05 を継続追跡 |

## 完了条件チェック

- [x] 主成果物が作成済み
- [x] 正本仕様参照が残っている
- [x] downstream handoff が明記されている
