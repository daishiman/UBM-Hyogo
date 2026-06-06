# Phase 12: ドキュメント更新（index）

## メタ情報

| 項目 | 値 |
|------|-----|
| workflow | `staging-api-url-and-session-recovery` |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| implementation_mode | new |
| workflow_state | implemented_local_evidence_captured |
| canonical_root | `docs/30-workflows/completed-tasks/staging-api-url-and-session-recovery` |
| 対象 | staging の「localhost アドレス化」「セッション取得失敗」2 症状の恒久解消（3 lane / 1 PR / CONST_007） |

## 目的

ステージング (`ubm-hyogo-web-staging.daishimanju.workers.dev`) で観測された
「ローカルホストのアドレスになっている (S3)」「ログイン情報（セッション）を取得できていない (S2)」を、
同一 account `*.workers.dev` への外向き `fetch` loopback 404 という共通の根まで遡って解消する実装仕様の
Phase 12 ドキュメント群（strict 7）とlocal実装証跡を確定する。

## Phase 12 成果物一覧（Task 12-1..12-6 + compliance）

| # | 成果物 | 役割 | 状態 |
|---|--------|------|------|
| 12-0 | `main.md`（本書） | Phase 12 の index・完了判定 | present |
| 12-1 | `implementation-guide.md` | Part1（中学生レベル）+ Part2（技術者向け）実装ガイド | present |
| 12-2 | `system-spec-update-summary.md` | Step1-A/1-B/1-C/Step2 のシステム仕様反映記録 | present |
| 12-3 | `documentation-changelog.md` | 全 Step の結果（該当なしも含む）を個別明記 | present |
| 12-4 | `unassigned-task-detection.md` | 未タスク検出（current / baseline 分離・0 件でも出力） | present |
| 12-5 | `skill-feedback-report.md` | テンプレート / ワークフロー / ドキュメント改善観点 | present |
| 12-6 | `phase12-task-spec-compliance-check.md` | canonical 9 見出し + Phase 11 evidence inventory のゲート | present |

## Phase 11 連携

本タスクは NON_VISUAL（transport / env / config / script の修正）であり、UI レンダリングコードは変更しない。
Phase 11 の証跡は以下で構成する想定で、`implementation-guide.md` の `## 視覚証跡` に明記する。

- `outputs/phase-11/manual-test-result.md`: source-level 自動テスト（vitest）+ localhost-bake source gate + typecheck の結果記録。
- `outputs/phase-11/canonical-paths.json`: NON_VISUAL canonical evidence path ledger。
- staging runtime smoke（`scripts/smoke-staging-me.sh` による `/me` 200 / `/profile` 認証描画）は **user-gated**（CONST_007 例外・実 deploy / secret 投入を要する）。
- スクリーンショットは n/a。副次的な「/profile エラーカード → 実コンテンツ」の VISUAL_ON_EXECUTION 証跡は user-gated 実走時にのみ取得する。

## 完了条件

- [x] 7 成果物（12-0..12-6）がすべて present で、Phase 1-3 / 3 lane task spec / artifacts.json と整合していること。
- [x] `implementation-guide.md` が Part1 / Part2 の 2 部構成で、各 Part の本文が非空 3 行以上（heading-only でない）こと。
- [x] `unassigned-task-detection.md` / `skill-feedback-report.md` が 0 件・改善なしでも根拠付きで出力されていること。
- [x] `verify:phase12-compliance` PASS（canonical 9 見出し + Phase 11 evidence inventory）は親作成の compliance-check を対象に判定。
- [x] `gate-metadata:validate` ERROR 0（artifacts.json zod schema）。

## 成果物

- `docs/30-workflows/completed-tasks/staging-api-url-and-session-recovery/outputs/phase-12/main.md`
- `docs/30-workflows/completed-tasks/staging-api-url-and-session-recovery/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/completed-tasks/staging-api-url-and-session-recovery/outputs/phase-12/system-spec-update-summary.md`
- `docs/30-workflows/completed-tasks/staging-api-url-and-session-recovery/outputs/phase-12/documentation-changelog.md`
- `docs/30-workflows/completed-tasks/staging-api-url-and-session-recovery/outputs/phase-12/unassigned-task-detection.md`
- `docs/30-workflows/completed-tasks/staging-api-url-and-session-recovery/outputs/phase-12/skill-feedback-report.md`
- `docs/30-workflows/completed-tasks/staging-api-url-and-session-recovery/outputs/phase-12/phase12-task-spec-compliance-check.md`

## 参照資料

- `outputs/phase-1/phase-1.md`（因果分析・主問題 1 文）
- `outputs/phase-2/phase-2.md`（3 lane 設計・transport.ts / resolveApiFetch）
- `outputs/phase-3/phase-3.md`（設計レビュー GO 判定）
- `tasks/task-a-server-fetch-service-binding.md` / `task-b-client-localhost-bake-eradication.md` / `task-c-cf-secret-parity-and-gates.md`
- `index.md`（workflow 全体スコープ・DoD）

## 統合テスト連携

source-level 自動テスト（`transport.spec.ts` / `authed.spec.ts` / `public.spec.ts` / `env.spec.ts` /
`me route.route.spec.ts` / `verify-no-localhost-bake.spec.ts`）と、Lane C の grep gate self-test を結合点とする。
staging runtime smoke は user-gated で、`/me` 200 を AUTH_SECRET parity の最終証明（L-AUTHSECRET-001）として位置づける。
