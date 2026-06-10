# Workflow Artifact Inventory — profile-session-fetch-failure-investigation

| Item | Path |
| --- | --- |
| Workflow root | `docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/` |
| Root artifacts | `docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/artifacts.json` |
| Output artifacts mirror | `docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/outputs/artifacts.json` |
| Phase 11 main | `docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/outputs/phase-11/phase-11.md` |
| Phase 11 manual result | `docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/outputs/phase-11/manual-test-result.md` |
| Phase 11 static screenshots | `docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/outputs/phase-11/screenshots/profile-session-disambiguation-static-contract.png`, `docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/outputs/phase-11/screenshots/profile-session-disambiguation-static-page.png` |
| Phase 12 main | `docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/outputs/phase-12/phase-12.md` |
| Phase 12 compliance | `docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| Code | `apps/web/app/(member)/profile/page.tsx`, `apps/web/app/(member)/profile/_lib/session-error-display.ts`, `apps/web/src/components/member/SectionError.tsx`, `apps/web/src/lib/server-fetch/safe-fetch.ts`, `scripts/diagnose-profile-session.sh` |
| Tests | `apps/web/app/(member)/profile/page.spec.tsx`, `apps/web/app/(member)/profile/_lib/__tests__/session-error-display.spec.ts`, `apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts`, `apps/web/src/components/member/__tests__/SectionError.spec.tsx` |

## Status

`implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION / staging_runtime_pending_user_gate`.

Local observability implementation is complete: `/profile` now distinguishes `MEMBER_SESSION_410`, 5xx, and transport failure via safe user-facing copy plus `data-cause`; `/me` server fetch failures emit structured diagnostics with `code` / `path` / `status`; and `scripts/diagnose-profile-session.sh` provides a read-only staging status probe without printing secrets.

## Evidence

- Focused Vitest: 4 files / 34 tests PASS.
- `bash -n scripts/diagnose-profile-session.sh`: PASS.
- `PROFILE_SESSION_BASE_URL=http://127.0.0.1:1 bash scripts/diagnose-profile-session.sh`: PASS (`H5_transport_failure`).
- `mise exec -- pnpm --filter @ubm-hyogo/web typecheck`: PASS.
- `mise exec -- pnpm --filter @ubm-hyogo/web lint`: PASS.
- Static visual PNG evidence: present in Phase 11 screenshots.

## Invariants

- `/me` API path, response shape, status taxonomy, D1 schema, and Google Form schema are unchanged.
- `apps/api` production source is untouched.
- Member identifiers, cookies, tokens, and secret values are not emitted in structured logs or script output.

## User Gate

Staging authenticated `/me` status confirmation, D1 read-only root-cause confirmation, authenticated staging screenshot, staging deploy, commit, push, and PR remain user-gated.

## Lessons Learned

- **L-PSFF-001（調査主導 × 観測性コード変更のハイブリッド判断基準）**: 「調査・原因特定のみ」をユーザーが選択したタスクでも、原因を**確認可能にする**目的の達成に観測性コード変更（区別表示・構造化ログ・診断スクリプト）が必須なら、純 docs-only でも純 implementation でもない。判定基準は「コード diff が docs/skill 同期のみ→audit テンプレ」「観測性でも `apps/` に diff が出る→実装骨格主（RED/GREEN・カバレッジ）+ audit テンプレ補助」の併用。本タスクは後者で `implemented_local_evidence_captured` とした。
- **L-PSFF-002（真因未確定時の Phase 11 証跡 = 自動テストでなく実機 status）**: 通常の implementation は Phase 11 で自動テストを主証跡にするが、調査タスクの AC-1/AC-2 主証跡は **staging 実機の `/me` HTTP status / 診断スクリプト stdout / D1 read-only**。`manual-test-result.md` を「実機切り分け手順（MT-A〜MT-D）+ 真因収束判定フロー」中心に構成すると compliance の証跡整合が取りやすい。
- **L-PSFF-003（症状から候補 status を排除法で絞る）**: `/profile` の症状（「時間をおいて再読み込み」= 非404・非redirect の集約バナー）と `session-guard` 分岐を突き合わせ、**401=redirect されバナーにならない / 404=再ログイン CTA になる**から H2・404 を一次除外し、真因を H3（410・`is_deleted`）/ H4（5xx）/ H5（transport）へ収束させた。「症状の見え方（redirect / CTA / 集約バナー）→ 候補 status 排除」は他の SC×API 直叩き画面にも再利用できる診断手順。
- **L-PSFF-004（`deferred_pending_root_cause` で未タスク 0 件を回避）**: 「調査のみ」を選んだタスクは本格修正が必ずスコープ外になり 0 件化しやすい。SSOT §3 OUT を `deferred_pending_root_cause`（真因確定待ち・CONST_007 例外①）として current 未タスク（C-1 410本格対応 / C-2 5xx根治 / C-3 transport運用是正 / C-4 管理者UX）に formalize する型が有効。**先送りではなく、真因が確定しないと修正方針を決められない**ことが分離理由である点を明記する。

anti-pattern:
- ❌ 観測性コード変更（`apps/` diff）があるのに audit テンプレだけで docs-only として close する。
- ❌ 真因未確定の調査タスクで、staging 実機 status を取らず自動テストだけを Phase 11 主証跡にする。
- ❌ 複数 root cause（410/5xx/transport）を 1 つのエラー文言に集約したまま放置し、再発時に切り分けできない状態を残す。
- ❌ 本格修正をスコープ外として未タスク 0 件で close し、真因確定後の着手条件・依存・配置先を記録しない。
