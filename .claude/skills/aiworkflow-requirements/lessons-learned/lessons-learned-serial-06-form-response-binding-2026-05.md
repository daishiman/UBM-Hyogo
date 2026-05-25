# Lessons learned — serial-06 form response binding (2026-05-23)

> 親 workflow: `docs/30-workflows/ui-prototype-design-system-foundation/`
> sub-workflow: `serial-06-form-response-binding/`
> 関連 SSOT: [phase12-strict-7-workflow-root-parity-gate.md](../../task-specification-creator/references/phase12-strict-7-workflow-root-parity-gate.md), [patterns-parallel-sub-workflow.md](../../task-specification-creator/references/patterns-parallel-sub-workflow.md), [lessons-learned-serial-05-page-routes-blueprint-binding-2026-05.md](./lessons-learned-serial-05-page-routes-blueprint-binding-2026-05.md)

---

## L-S06-001: parent-sub-workflow strict-7 aggregation parity（L-S05-001 carry-forward）

- **Why**: serial-06 仕様書を初期ドラフトしたとき、standalone topology（`docs/30-workflows/serial-06-form-response-binding/`）に Phase 1-13 が生成され、Phase 12 strict 7 も sub 配下に重複しかけた。L-S05-001 で確立した「parent root 集約 SSOT」を実 spec 起票フローへ展開しきれていなかった。
- **How to apply**:
  - sub-workflow 起票時に standalone root を作らず、最初から `docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/` 配下に Phase 1-13 を配置する。
  - sub に許容される Phase 12 ファイルは `phase-12-compliance-check.md`（canonical 9 headings + checklist）の 1 つだけ。strict 7（`main` / `implementation-guide` / `system-spec-update-summary` / `documentation-changelog` / `unassigned-task-detection` / `skill-feedback-report` / `phase12-task-spec-compliance-check`）は parent root `outputs/phase-12/` に集約する。
  - parent `artifacts.json` / `outputs/artifacts.json` の `metadata.sub_workflows.serial-06-form-response-binding` を登録し、artifact inventory § Sub-workflow: serial-06 を同 wave 追加する。
- **Evidence**:
  - `docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/phase-12-compliance-check.md`
  - `docs/30-workflows/ui-prototype-design-system-foundation/artifacts.json` `metadata.sub_workflows`
  - parity gate: [phase12-strict-7-workflow-root-parity-gate.md](../../task-specification-creator/references/phase12-strict-7-workflow-root-parity-gate.md) Step 4 grep gate
- **Related**: L-S05-001, L-PARA04-003

## L-S06-002: adapter pure function + visibility 二重防御 + unknown kind silent skip

- **Why**: Google Form 回答を `/members/[id]` に表示するために fetch → adapter → primitive の 3 層を新規追加した。adapter に I/O や logger を持たせると単体テストが副作用持ちになり vitest で flaky 化する。また API バグで `member` / `admin` visibility field が漏れた場合、UI 側で再フィルターしないと公開ページに機密が出る恐れがある。さらに Google Form は将来 `kind` を増やすため、未知 kind で UI が壊れたり production console を logger 出力で汚すと運用負債になる。
- **How to apply**:
  - adapter (`apps/web/src/lib/adapters/member-detail.ts`) は **pure function** として実装する。`fetch` / `console` / `logger` / 環境変数アクセスを禁止し、引数 → 戻り値の純粋写像に閉じる。
  - **visibility 二重防御**: API は `public` のみ返す契約だが、adapter で `visibility === 'public'` を再度フィルターする。defense in depth。
  - **unknown kind silent skip**: 未知の `kind` は logger 呼ばずに silent skip。production console 汚染を防ぐ。dev 環境のみ warn する follow-up (`serial-06-followup-002-adapter-dev-warn-unknown-kind.md`) は別タスクで切り出す。
  - fetch は Server Component (`apps/web/app/(public)/members/[id]/page.tsx`) に閉じ、primitive (`apps/web/src/components/public/MemberDetail.tsx`) は adapter の出力 type だけを受け取る。
- **Evidence**:
  - `apps/web/src/lib/adapters/member-detail.ts`（71 行・pure function）
  - `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts`（vitest 8 case）
  - `apps/web/app/(public)/members/[id]/page.tsx`（fetch 層）
  - `apps/web/src/components/public/MemberDetail.tsx`（primitive 層）
  - follow-up: `docs/30-workflows/unassigned-task/serial-06-followup-002-adapter-dev-warn-unknown-kind.md`
- **Related**: L-S05-003（既存 primitive + data-* 契約方式）

## L-S06-003: fixture 配置規約（`apps/web/src/fixtures/`）

- **Why**: serial-06 で adapter 単体テスト + Playwright E2E + visual snapshot の 3 種が同じ「公開メンバー回答 sample」を必要とした。test ファイルごとに inline fixture を書くと shape drift が起き、API contract 変更時に複数箇所を修正する負債になる。
- **How to apply**:
  - fixture は **`apps/web/src/fixtures/<feature-slug>.ts`** に集約する（serial-06 では `public-member-profile.ts`）。
  - fixture は `as const` で型固定し、API response shape (`PublicMemberProfileResponse`) と一致させる。adapter 入力型を `typeof fixture` から推論可能にする。
  - 6 section × 3 visibility（public/member/admin）のカバレッジを 1 fixture に集約し、adapter テスト / E2E / visual snapshot で再利用する。
  - 新規 test ファイルは `*.spec.{ts,tsx}` のみ（`*.test.{ts,tsx}` 禁止・lefthook `block-test-suffix` と GitHub Actions `verify-test-suffix` が reject）。
- **Evidence**:
  - `apps/web/src/fixtures/public-member-profile.ts`（155 行・6 section × 3 visibility）
  - 共有先: adapter spec / Playwright spec / visual snapshot
- **Related**: CLAUDE.md 不変条件 #8（`.spec.{ts,tsx}` 強制）

## L-S06-004: section / visibility マッピング（6 section × 3 visibility）

- **Why**: Google Form は 6 section / 31 question / 3 visibility（public / member / admin）構造を持ち、adapter が section 単位で出力構造を組む必要があった。section と visibility の組み合わせを spec に明示しないと、実装者が「どの section にどの visibility field が含まれるか」を都度推測することになり、test fixture と adapter 実装が drift する。
- **How to apply**:
  - Phase 4 contracts で `section.id × visibility` matrix を明示する（6 section: basic / contact / region / interest / skills / consent）。
  - `visibility: 'admin'` は consent section に限定（`public_consent` / `rules_consent`）、`visibility: 'member'` は contact section の `responseEmail` system field のみ、その他は `public`。
  - adapter 出力は `sections: Array<{ id; title; items: Array<{ kind; value }> }>` を section 単位で保持し、空 section（public item 0 件）は出力から除外する。
  - fixture は 3 visibility 全てを含めることで、UI 側に `member` / `admin` が漏れないことを spec として検証する。
- **Evidence**:
  - `docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/phase-04-contracts.md`
  - `apps/web/src/fixtures/public-member-profile.ts`（3 visibility 全網羅）
  - CLAUDE.md フォーム固定値（sectionCount=6 / questionCount=31）
- **Related**: L-S06-002（二重防御の根拠 matrix）

## L-S06-005: vitest 8 case + Playwright 1 E2E + visual snapshot 1 の test pyramid

- **Why**: adapter pure function の網羅は unit で完結するが、Server Component fetch → adapter → primitive の統合動作と visual regression は unit では捉えられない。逆に E2E / visual を増やしすぎると CI 時間と flaky が悪化する。
- **How to apply**:
  - **vitest 8 case**: (1) public のみ通る (2) member skip (3) admin skip (4) unknown kind silent skip (5) 空 section 除外 (6) 順序保持 (7) tags 出力 (8) participation history 出力。pure function なので副作用なし。
  - **Playwright 1 E2E**: `/members/[id]` を fixture-backed mock-api で開き、public field が表示され member/admin field が DOM に存在しないことを assert（二重防御の runtime 検証）。
  - **visual snapshot 1**: 同 route の screenshot baseline 1 枚。19 routes 全体の regression は serial-07 owned で重複させない。
  - serial-06 は visual evidence の **subset** のみを所持。`outputs/phase-11/screenshots/public-member-detail.png` 1 枚 + DOM scrape のみで、19 routes 全体 regression は serial-07 へ委譲する。
- **Evidence**:
  - `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts`（8 case）
  - `apps/web/playwright/tests/serial-06-member-detail.spec.ts`（39 行・1 E2E + visual）
  - Phase 6 test strategy: `docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/phase-06-test-strategy.md`
  - follow-up: `serial-06-followup-003-phase-6-playwright-topology-sync.md`
- **Related**: L-S05-003（serial-07 への 19 routes regression 委譲）

## L-S06-006: `phase-12-documentation.md` 廃止 → `phase-12-compliance-check.md` 置換

- **Why**: 初期ドラフトでは sub 配下に `phase-12-documentation.md`（110 行・strict 7 を sub 内に重複展開する旧パターン）が生成された。L-S05-001 / L-PARA04-003 確立後の canonical では sub に許容される Phase 12 ファイルは `phase-12-compliance-check.md`（canonical 9 headings + checklist のみ）の 1 つだけ。
- **How to apply**:
  - sub 起票テンプレから `phase-12-documentation.md` を完全削除する。
  - canonical な `phase-12-compliance-check.md` には: (1) 概要 (2) 背景 (3) アーキテクチャ (4) 設計判断 (5) データ流 (6) visibility (7) test 戦略 (8) parent root 集約宣言 (9) checklist の 9 headings を含める。strict 7 文書を sub 内に重複させない。
  - `verify:phase12-compliance` CI gate / `phase12-strict-7-workflow-root-parity-gate.md` Step 4 grep gate で sub 配下 strict 7 ファイル存在を fail 判定する。
- **Evidence**:
  - 削除: `docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/phase-12-documentation.md`（git status: deleted）
  - 新規: `docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/phase-12-compliance-check.md`（canonical 9 headings）
  - 親 SSOT: `docs/30-workflows/ui-prototype-design-system-foundation/outputs/phase-12/` strict 7 集約
- **Related**: L-S05-001, L-PARA04-003

## 関連リンク

- skill artifact inventory: `.claude/skills/aiworkflow-requirements/references/workflow-ui-prototype-design-system-foundation-artifact-inventory.md` § Sub-workflow: serial-06 Form Response Binding
- 親 skill feedback: `docs/30-workflows/ui-prototype-design-system-foundation/outputs/phase-12/skill-feedback-report.md`
- parent root strict 7: `docs/30-workflows/ui-prototype-design-system-foundation/outputs/phase-12/`
- parity gate SSOT: [[phase12-strict-7-workflow-root-parity-gate]]
- 前 sub-workflow lessons: [[lessons-learned-serial-05-page-routes-blueprint-binding-2026-05]]
- 後続 sub-workflow（予定）: `serial-07-regression-evidence`（19 routes 全体 visual regression owned）
- follow-up unassigned tasks:
  - `docs/30-workflows/unassigned-task/serial-06-followup-001-public-segment-error-loading-boundary.md`
  - `docs/30-workflows/unassigned-task/serial-06-followup-002-adapter-dev-warn-unknown-kind.md`
  - `docs/30-workflows/completed-tasks/unassigned-task/serial-06-followup-003-phase-6-playwright-topology-sync.md`
  - `docs/30-workflows/unassigned-task/serial-06-followup-004-adapter-schema-extension-pipeline.md`
