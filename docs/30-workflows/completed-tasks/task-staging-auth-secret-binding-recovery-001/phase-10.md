# Phase 10: 最終レビュー

[実装区分: 実装仕様書]

## 1. acceptance criteria

| ID | criterion | 確認 |
|----|-----------|------|
| AC-01 | staging `/admin/members` が 200 + `{members:[...]}` を返す | Phase 8 curl 証跡 |
| AC-02 | production も同事象解消（必要時 recovery 済み） | Phase 8 curl 証跡 |
| AC-03 | backend-ci runtime smoke staging green | Phase 8 CI 証跡 |
| AC-04 | middleware で AUTH_SECRET falsy 時に `UBM-AUTH-SECRET-MISSING` 構造化ログ出力 | spec-02 test PASS |
| AC-05 | `apps/api/src/env.ts` で AUTH_SECRET zod 必須化 | spec-02 test PASS |
| AC-06 | deploy-staging 後段に auth-gate smoke step が CI gate として走る | spec-03 backend-ci.yml diff |
| AC-07 | smoke script が `auth misconfigured` 検知時 summary に `auth-secret-binding-missing` reason を出す | spec-03 smoke test |
| AC-08 | `scripts/cf.sh secret put` が empty 値を exit 78 で reject | spec-04 dry-run 証跡 |
| AC-09 | 既存誤診断 workflow に lessons-learned 追記済み | `docs/30-workflows/completed-tasks/task-runtime-smoke-admin-members-500-recovery-001/outputs/lessons-learned-auth-secret-true-cause.md` 存在確認 |

## 2. blocker 判定

- BLOCKER: AC-01〜AC-03 のいずれか fail → Phase 8 へ戻す
- MINOR: AC-04〜AC-09 のいずれか fail → 該当 spec の修正 commit
- スコープ外 issue → Phase 12 で `unassigned-task-detection.md` へ formalize

## 3. Phase 10 DoD

- AC-01〜AC-09 がすべて PASS
- MINOR 残存なし、または `unassigned-task` 化済み
