# E2E Quality Uplift Stage 0-3 実装教訓（2026-05）

## 対象

- workflow: `docs/30-workflows/e2e-quality-uplift-stage-{0,1,2,3}/`
- 起案ブランチ: `feat/e2e-quality-uplift`
- 同期 changelog: `.claude/skills/aiworkflow-requirements/changelog/20260509-e2e-quality-uplift-stage0-3.md`
- artifact inventory: `references/workflow-e2e-quality-uplift-stage-0-3-artifact-inventory.md`

## Lessons

### L-E2EQU-001: Stage 0..3 4 段分割と spec_verified_pending_dependency 状態の運用

- **状況**: E2E 品質向上を 1 ワークフローで完結させると Phase 4-13 が肥大化し、tier-aware coverage / regression assertion / branch protection contexts 正本化など責務の異なる作業が混入する。実装が他ステージの land に gated されるため、PR 単位でも実装責務と仕様確定責務が混じってしまう。
- **学び**: classification-first で「Stage 0/1 は実装、Stage 2-3 は spec のみ確定（spec_verified_pending_dependency）」と明示分割すれば、Phase 11 evidence の placeholder vs runtime の区別が破綻しない。`spec_verified_pending_dependency` は spec_created と異なり「spec レビュー完了・実装未着手」を表すため、後続 cycle の起点として再利用可能。
- **再発防止**: 同種の「複数依存ステージにまたがる品質 uplift」は最初から 4 stage 分割を default にする。各 stage 直下で完結する `phase-{1..13}.md` + `outputs/phase-{11,12}/` を持たせ、Stage N+1 は Stage N artifact を input として参照する。
- **関連 refs**: `references/task-workflow-active.md`（Stage 0-3 のリンク）, `references/workflow-e2e-quality-uplift-stage-0-3-artifact-inventory.md`

### L-E2EQU-002: Phase 11 placeholder evidence と runtime evidence の lifecycle 分離

- **状況**: Stage 2-3 では実 Playwright run を回さず spec のみ確定する。Phase 11 に placeholder `main.md` だけを置くと、compliance-check が evidence captured と誤判定して false positive を出すリスクがある（L-06B-002 と同型課題）。Stage 1 のように実装へ昇格した stage は tracked runtime evidence に切り替える。
- **学び**: Phase 11 evidence_status を `PLANNED_BECAUSE_PHASE11_NOT_EXECUTED` で明示すれば、Phase 12 strict 7 outputs を先行作成しても compliance-check は「実 evidence 未取得」と正しく判定する。runtime evidence は Stage 0 merge 後の別 cycle に外出し、追跡 workflow を別途立てる。
- **再発防止**: spec-only stage の `phase-11.md` には必ず evidence_status を明記。Phase 11 の `outputs/phase-11/main.md` 冒頭に `> evidence_status: PLANNED_BECAUSE_PHASE11_NOT_EXECUTED` を 1 行入れる慣習を `task-specification-creator/references/phase-template-core.md` 経由で展開する。
- **関連 refs**: `lessons-learned-06b-profile-logged-in-visual-evidence-2026-04.md` の L-06B-002

### L-E2EQU-002A: Server Component fetch は browser route mock では検証できない

- **状況**: `/profile` は Server Component が `fetchAuthed("/me/profile")` を Node 側で実行するため、Playwright の `page.route("**/api/me/profile")` では server state を差し替えられない。
- **学び**: server state round-trip を証明する E2E は、browser request mock ではなく、server fetch 経路へ効く mock API / seed / `INTERNAL_API_BASE_URL` 差し替えを使う。Stage 1 では `apps/web/playwright/fixtures/auth.ts` に local API mock を置き、`/me/profile` の `pendingRequests` を test state として制御する。
- **再発防止**: Next Server Component / route handler の fetch を含む E2E は、Phase 4 の test design で「browser request / server fetch」の2軸を明記する。server fetch に対する `page.route()` だけの AC は FAIL とする。
- **関連 refs**: `apps/web/app/profile/page.tsx`, `apps/web/src/lib/fetch/authed.ts`, `apps/web/playwright/fixtures/auth.ts`

### L-E2EQU-003: Tier-aware E2E coverage policy と workspace 80% guard の責務分離

- **状況**: E2E coverage を全テストに一律 80% で課すと、`evidence-capture` project や experimental spec が常時 fail し、開発を阻害する。一方で workspace 全体の unit/integration coverage 80% guard を緩めると quality regression を招く。
- **学び**: E2E は `tier`（critical ≥80% / standard ≥70% / experimental ≥50%）で運用し、workspace coverage guard は unit/integration の合算 80% を維持する責務分離が成立する。tier は spec-level（`coverageTier`）で宣言し、Playwright project filter で実行を分ける（`evidence-capture` は default run から除外）。
- **再発防止**: `task-specification-creator/SKILL.md` および `references/coverage-standards.md` に tier 定義を canonical 化。`quality-gates.md §7.1 (4)` に `evidence-capture` project 除外条項を 8 行で記述。`coverageTier` が未指定の spec は `standard` を default とする。
- **関連 refs**: `task-specification-creator/SKILL.md`, `task-specification-creator/references/coverage-standards.md`, `task-specification-creator/references/quality-gates.md`

### L-E2EQU-004: Playwright project filter と `evidence-capture` 分離

- **状況**: 06b-C の logged-in visual evidence 用 spec が `desktop-chromium` 等の通常 e2e run に混在し、storageState 不在時に常時 skip ログを吐いて signal-to-noise 比が悪化していた。
- **学び**: `apps/web/playwright.config.ts` の `projects[]` に `evidence-capture` を追加し、`apps/web/package.json` の `e2e` script で `--project=desktop-chromium,desktop-firefox,mobile-webkit` を明示すれば、default run から evidence project を除外できる。evidence 取得は `scripts/capture-profile-evidence.sh` 経由の専用 entrypoint に閉じる。
- **再発防止**: 「default run と evidence run を Playwright project で分離する」を Playwright spec の設計指針として `apps/web/playwright/README.md` に節立てで記述。新規 evidence spec は `evidence-capture` project に紐付ける。
- **関連 refs**: `apps/web/playwright.config.ts`, `apps/web/package.json`, `apps/web/playwright/README.md`, `scripts/capture-profile-evidence.sh`

### L-E2EQU-005: Spec rename / extract 時の責務名 drift 解消（profile-readonly logged-in spec）

- **状況**: `apps/web/playwright/tests/profile-readonly.spec.ts` の中に `06b-C` evidence-only 責務が同居し、ファイル名と中身の責務がずれていた（drift）。stale comment も古い責務を指していた。
- **学び**: 責務が分離可能な spec は「rename + extract（案 A）」が確実。新ファイル `profile-readonly-logged-in.spec.ts` に evidence 責務を移植し、旧ファイルの責務外コードを完全削除。stale comment は 1 行ずつ削除して履歴を git に委ねる。
- **再発防止**: spec の責務 drift を見つけたら、案 A（rename/extract）を default とし、案 B（同居維持）は明確な理由がある場合のみ。06b-C artifact inventory に rename 元情報を 1 行残し、citation 切れを防ぐ。
- **関連 refs**: `apps/web/playwright/tests/profile-readonly-logged-in.spec.ts`, `references/workflow-06b-c-profile-logged-in-visual-evidence-artifact-inventory.md`

### L-E2EQU-006: docs-only spec stage で Phase 12 strict 7 outputs を完備する意義

- **状況**: spec_verified_pending_dependency の stage では「実装が走らないなら Phase 12 outputs を簡略化していいのでは」という誘惑が生じる。しかし簡略化すると後続 cycle で再生成コストが発生し、aiworkflow indexes の整合も崩れる。
- **学び**: docs-only stage でも Phase 12 strict 7 outputs（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）を完備するのが trade-off 的に最安。compliance-check で `evidence_status` を正しく書けば false positive は出ない。
- **再発防止**: `task-specification-creator/SKILL.md` の Phase 12 セクションに「docs-only stage でも strict 7 outputs を維持する」を明文化。aiworkflow `quick-reference` / `resource-map` に登録する際、Phase 12 strict 7 の present/absent を明示するカラムを残す。
- **関連 refs**: `task-specification-creator/SKILL.md`, `indexes/quick-reference.md`, `indexes/resource-map.md`

### L-E2EQU-007: Branch protection contexts 正本化（Stage 3）の運用ドリフト対策

- **状況**: CLAUDE.md と GitHub branch protection 実値の間で `required_status_checks.contexts` が drift しがちで、CI 名の表記揺れが発生していた（`ci` / `Validate Build` / `coverage-gate` / `lighthouse-ci` / `e2e-tests-coverage-gate`）。
- **学び**: 正本は GitHub branch protection 実値とし、CLAUDE.md は運用参照に位置付ける。drift 検出は `gh api repos/daishiman/UBM-Hyogo/branches/{dev,main}/protection | jq '.required_status_checks.contexts'` を runbook 化して定期実行する。
- **再発防止**: Stage 3 spec は CLAUDE.md の「ブランチ戦略 / Governance」セクションに contexts 表を追加するだけで、enforcement 実体は GitHub API で確認する手順に分離。CLAUDE.md 編集だけで「protection を変えた気になる」事故を防ぐ。
- **関連 refs**: `CLAUDE.md`（ブランチ戦略 / Governance）, `docs/30-workflows/e2e-quality-uplift-stage-3/phase-12.md`
