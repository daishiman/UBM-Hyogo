---
task_root: docs/30-workflows/07c-followup-002-attendance-visual-smoke/
synced_at: 2026-05-15
state: implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION / local_visual_evidence_pass
related_lessons:
  - lessons-learned-task-18-w7-verify-tokens-and-playwright-smoke-2026-05.md
  - lessons-learned-task-10-followup-002-runtime-visual-axe-2026-05.md
related_specs:
  - docs/30-workflows/07c-followup-002-attendance-visual-smoke/index.md
  - .claude/skills/task-specification-creator/references/phase-11-screenshot-guide.md
  - .claude/skills/aiworkflow-requirements/references/api-endpoints.md
follow_ups:
  - GitHub Actions `playwright-smoke` runtime evidence 取得 (user-gated)
  - baseline snapshot 更新が必要になった場合は task-18 W7 と分離して別 task 化
  - commit / push / PR は user-gated
---

# 07c follow-up 002 attendance visual smoke の苦戦箇所

> 対象 workflow: `docs/30-workflows/07c-followup-002-attendance-visual-smoke/`
> 同期日: 2026-05-15
> 実装範囲:
> - `apps/web/playwright/tests/attendance.spec.ts`（`TODO(08b)` 解消、4 focused test）
> - `apps/web/playwright/fixtures/admin-meetings.ts`（attendance scenario seed builder 新規）
> - `apps/web/playwright/fixtures/auth.ts`（standalone mock に `/admin/meetings/:id` endpoint 追加）
> - `apps/web/playwright/page-objects/AdminMeetingsPage.ts`（list/detail 別 selector helper）
> - `apps/web/src/components/admin/MeetingPanel.tsx`（list selector 露出）
> - `apps/web/app/(admin)/admin/meetings/[id]/MeetingAttendancePanel.tsx`（detail mutation body alignment）
> - `apps/api/src/routes/admin/meetings.ts`（`GET /admin/meetings/:id` detail route 追加 / surface 既存維持）
> - `.github/workflows/playwright-smoke.yml`（focused attendance step）

---

## L-07C-FU002-001: standalone mock に detail endpoint を後追い追加した経緯

### 状況

initial spec 段階では `/admin/meetings`（list）のみを mock しており、`/admin/meetings/:id`
detail page を visit すると standalone mock server が 404 を返し、Server Component の
`fetch()` がエラーで render に到達しなかった。

### 判断 / 採用解

`apps/web/playwright/fixtures/auth.ts` の standalone mock に `/admin/meetings/:id` endpoint を
追加し、INV-08（mock の二重実装禁止 / single source of truth）を維持。fixture 内
`page.route()` mock を増やす誘惑があるが、Server Component fetch は `page.route()` で
intercept できないため必ず standalone 側に置く。

### 再発防止

- 新規 detail page を visual smoke 対象に加える際は、最初の Phase 3-4 で
  「list/detail それぞれの SSR fetch path を標準 mock が満たすか」を確認する
- single source of truth: `apps/web/playwright/fixtures/auth.ts` だけが mock の正本
- 関連: `phase-11-screenshot-guide.md` § VISUAL タスクの local mock-screenshot 経路

---

## L-07C-FU002-002: selector が detail page のみに存在する事実の page object 反映

### 状況

`attendance-candidate` / `attendance-register` selector は `/admin/meetings/[id]` 詳細
page にのみ存在し、`/admin/meetings` list page には存在しない（list は meeting row のみ
表示し attendance UI は出さない設計）。page object が両 page で同じ selector を期待する
旧構造のままだと strict mode で no-match / multi-match のいずれかで fail する。

### 判断 / 採用解

`AdminMeetingsPage.ts` に list page helper（meeting row 選択）と detail page helper
（attendance candidate 操作）を別 method として分離。selector exposure は
`MeetingPanel.tsx`（list）と `MeetingAttendancePanel.tsx`（detail）で重複しない
testid 命名（list 側は `admin-meeting-row-*`、detail 側は `attendance-*`）に統一。

### 再発防止

- page object は「visit 先 URL」と「expose する selector 集合」を 1:1 で揃える
- selector が複数 page に跨る場合は responsive UI ではなく page-level の責務分離か
  検査する（`phase-11-screenshot-guide.md` § selector ルール 参照）

---

## L-07C-FU002-003: TODO(08b) 解消の boundary 設計

### 状況

`attendance.spec.ts` には 08b Playwright E2E から残った `TODO(08b)` が duplicate add /
already-registered hidden / delete-after state の 3 シナリオで残置されていた。
`test.skip` / `test.fixme` を残したまま merge する選択肢もあったが INV-04 違反。

### 判断 / 採用解

3 シナリオを `test.skip` から un-skipped focused 4 test（duplicate flow before/after、
already-registered、deleted-excluded、delete-before/after）に書き直し、Phase 11
evidence で `e2e-skip-count.txt` を `0` で固定。08b 本体の e2e suite から本タスクの
spec を独立 export せず、同 suite 配下に focused spec として置く。

### 再発防止

- 後続タスクで TODO comment を残すなら、当該 TODO の解消タスクを `unassigned-task/`
  に同時 formalize する（先送り禁止 = INV-07 / CONST_007）
- Phase 11 evidence の `e2e-skip-count.txt` を CI で 0 検証することで `test.skip`
  混入を構造防止できる（今後の gate 候補）

---

## L-07C-FU002-004: provenance: local-mock を staging fresh と区別する責務境界

### 状況

Phase 11 evidence は local Playwright + standalone mock から取得しているため
staging 実機 deploy の fresh smoke とは異なる。両者を取り違えると「staging fresh
で PASS した」という誤った進捗認識が PR レビューや operator handoff で発生する。

### 判断 / 採用解

`outputs/phase-11/phase11-capture-metadata.json` の `provenance: local-mock` を必須
記載し、staging fresh evidence への差し替えは別 task（GitHub Actions runtime smoke
の user-gated 実行）として分離。本 task の `workflow_state` は
`implemented_local_evidence_captured` で固定し、staging 反映を `pass_runtime_synced`
へ昇格させない。

### 再発防止

- VISUAL タスクで mock を介在させる場合、`phase11-capture-metadata.json` の
  `provenance` 列は AC matrix の必須項目
- `aiworkflow-requirements` skill の workflow_state 用語集に対し
  `implemented_local_evidence_captured` を staging fresh と取り違えないこと

---

## L-07C-FU002-005: baseline snapshot 自動更新を避ける user-gated 境界

### 状況

attendance UI の visual diff が baseline 不在のため初回 capture が必要になるが、
`*-snapshots/*.png` を本 PR で `--update-snapshots` 実行して tracked 化すると、
baseline の人手レビューを経ずに canonical 化してしまう。task-18 W7 で確立した
INV-06（baseline 更新は user-gated）と矛盾する。

### 判断 / 採用解

本 task では baseline 画像を tracked 化せず、`outputs/phase-11/screenshots/*.png` を
evidence-only として保存。baseline 化は task-18 W7 と独立した別 task で扱い、
`playwright-smoke.yml` の `--update-snapshots` は CI で実行しない（local user 操作
専用）。

### 再発防止

- visual smoke の新規追加時、screenshot evidence と visual regression baseline の
  2 種を**最初から別物として扱う**: 前者は workflow `outputs/`、後者は
  `apps/web/playwright/tests/visual/<spec>-snapshots/` 配下
- baseline 化が必要になった時点で `unassigned-task/` 起票

---

## 教訓まとめ

1. Server Component fetch を扱う visual smoke では、standalone mock を single source
   of truth として最初から完全な endpoint set を実装する（detail endpoint の後追い
   は cost が高い）
2. selector exposure は URL（page 責務）と 1:1 対応させ、responsive 共通化に逃げない
3. `test.skip` / `test.fixme` を残した merge は INV 違反として `unassigned-task/`
   起票で先送り禁止
4. `provenance: local-mock` メタは staging fresh と取り違えないための必須 contract
5. screenshot evidence と visual regression baseline は別物
