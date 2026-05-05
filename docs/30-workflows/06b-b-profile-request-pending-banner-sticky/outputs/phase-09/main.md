# Phase 9: 品質保証 — 06b-b-profile-request-pending-banner-sticky-001

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-b-profile-request-pending-banner-sticky-001 |
| phase | 9 / 13 |
| wave | 06b-fu |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

typecheck / lint / unit / integration / coverage / grep gate を全 PASS にし、Phase 10 最終レビューに渡せる状態を作る。

## ローカル実行・検証コマンド（CONST_005）

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm/api test --run
mise exec -- pnpm --filter @ubm/web test --run
mise exec -- pnpm --filter @ubm/web test --run --coverage
mise exec -- pnpm --filter @ubm/web exec playwright test profile-pending-sticky
```

## PASS 基準

| 項目 | 基準 |
| --- | --- |
| typecheck | error 0 |
| lint | warn/error 0 |
| api unit/integration | TC-U-01..07 / TC-I-01..06 全 PASS |
| web unit | TC-U-08..11 全 PASS |
| coverage（追加分） | Line ≥ 80%、Branch ≥ 60%、Function ≥ 80% |
| Playwright | TC-E-01..06 全 PASS |
| grep gate（#4 / #5 / #11 / S2 / S5） | 期待値と完全一致 |

## Local Static Evidence Status

| Gate | Status | Evidence |
| --- | --- | --- |
| API implementation | implemented | `apps/api/src/routes/me/{schemas,index,services}.ts` adds `pendingRequests` and `getPendingRequestsForMember` |
| Repository read model | implemented | `apps/api/src/repository/adminNotes.ts` exposes pending-only lookup aligned with duplicate guard |
| Web implementation | implemented | `apps/web/app/profile/page.tsx` passes `profileRes.pendingRequests`; `RequestActionPanel` prioritizes server pending |
| API focused coverage | implemented / rerun required after review patch | `apps/api/src/routes/me/index.test.ts` covers no pending, visibility pending, delete pending, duplicate 409, and pending/read-model edge case |
| Web focused coverage | implemented / rerun required after review patch | `apps/web/app/profile/_components/RequestActionPanel.test.tsx` covers banner + disabled behavior |
| Runtime visual evidence | blocked_runtime_evidence | Authenticated browser session + seeded pending queue state are required; see Phase 11 |

This phase records local static implementation evidence only. Runtime screenshot evidence is intentionally not marked PASS until Phase 11 capture runs.

## Executed Verification Results

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm --filter @ubm-hyogo/api typecheck` | PASS | `tsc -p tsconfig.json --noEmit` exit 0 |
| `pnpm --filter @ubm-hyogo/web typecheck` | PASS | `tsc -p tsconfig.json --noEmit` exit 0 |
| `pnpm --filter @ubm-hyogo/api lint` | PASS | package lint script runs `tsc -p tsconfig.json --noEmit`; exit 0 |
| `pnpm --filter @ubm-hyogo/web lint` | PASS | package lint script runs `tsc -p tsconfig.json --noEmit`; exit 0 |
| `pnpm --filter @ubm-hyogo/api test -- apps/api/src/routes/me/index.test.ts` | PASS | package script executed the full apps/api suite: 106 files / 683 tests PASS; target `apps/api/src/routes/me/index.test.ts` had 20 tests PASS |
| `pnpm --filter @ubm-hyogo/web test -- apps/web/app/profile/_components/RequestActionPanel.test.tsx apps/web/src/lib/api/me-types.test-d.ts` | PASS | package script executed the full apps/web suite: 48 files / 399 tests PASS; target `RequestActionPanel.test.tsx` had 10 tests PASS |
| Playwright `profile-pending-sticky` | BLOCKED | Spec file exists but remains skipped until authenticated runtime capture is authorized |

## grep gate 一覧

```bash
rg -n "cloudflare:d1|D1Database" apps/web/                                            # 0 hit (#5)
rg -n ":memberId|/members/[^\"/]+" apps/web/app/api/                                  # 0 hit (#11)
rg -n "name=\"(displayName|email|kana|address|phone)\"" apps/web/app/profile/_components/Request*.tsx  # 0 hit (#4)
rg -n "type\s+AuthGateState|enum\s+AuthGateState" apps/web/app/profile/               # 0 hit (S2)
# 新 error code 追加なし (S5)
rg -n "code:\s*['\"](?!DUPLICATE_PENDING_REQUEST|INVALID_REQUEST|RULES_CONSENT_REQUIRED|RATE_LIMITED|UNAUTHORIZED|NETWORK|SERVER)" apps/api/src/routes/me/  # 0 hit
```

## 失敗時の自動修復方針

| 失敗 | 修復 |
| --- | --- |
| typecheck | unused / null 許容 / `z.infer` の同期破れを最小差分修正 |
| lint | `pnpm lint --fix` 先行 |
| unit | TC ID で原因切り分け、schema/services 順に再確認 |
| integration | route handler の zod parse / response shape を Phase 2 設計と再突合 |
| coverage 不足 | branch 不足は error 経路（ER-*）を追加 |
| Playwright flaky | route mock の応答 shape を schema に整合・waitForSelector で stable 化 |

## DoD（Phase 9）

- [ ] 上記コマンド全 PASS
- [ ] grep gate 一覧の期待値が全て一致
- [ ] coverage 目標達成
- [ ] 失敗時の自動修復（最大 3 回）後に PASS

## サブタスク管理

- [ ] typecheck / lint PASS
- [ ] unit / integration PASS
- [ ] coverage 目標達成
- [ ] Playwright PASS
- [ ] grep gate 全 PASS
- [ ] `outputs/phase-09/main.md` 作成

## 成果物

| 成果物 | パス |
| --- | --- |
| 品質保証レポート | `outputs/phase-09/main.md` |
| coverage report | `outputs/phase-09/coverage/` |
| grep result | `outputs/phase-09/grep-result.txt` |

## 完了条件

- [ ] PASS 基準を全て満たす
- [ ] 本 Phase 内タスク 100% 実行

## タスク 100% 実行確認【必須】

- [ ] commit / push / PR を実行していない（user 承認は Phase 13）
- [ ] 06b-B の復活ではなく durable 化の品質保証である

## 次 Phase への引き渡し

Phase 10 へ、品質保証レポート、coverage、grep result を渡す。
