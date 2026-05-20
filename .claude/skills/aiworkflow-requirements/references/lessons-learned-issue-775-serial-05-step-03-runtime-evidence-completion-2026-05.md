# Lessons learned: Issue #775 serial-05-step-03 SchemaDiffPanel runtime evidence completion (2026-05)

| ID | 教訓 | 適用 | 根拠 |
| --- | --- | --- | --- |
| L-I775-001 | closed Issue の未完 deliverable が "verifiable evidence の欠落" のときは、UI refactor ではなく **fixture-backed local visual evidence completion** として recovery する。production code は frozen を quality gate 化する | `task-specification-creator/references/closed-issue-canonical-workflow-recovery.md` / metadata `frozen_files` / `git diff dev...HEAD` での app/API diff 0 確認 | UI コードを触る recovery は不要な regression risk を生む。真因は "missing evidence" であって "missing UI" ではない |
| L-I775-002 | 同一画面の複数 pane に対する visual evidence は **full-page capture ではなく pane-region capture** にする。`[aria-labelledby="pane-${id}"]` 等の anchor で locator を取得し、PNG ledger 上の重複や drift を避ける | Playwright visual spec / parent `outputs/phase-11/screenshots/` | full-page 4 枚は同じ pane 群が重複写ることで drift と diff noise の温床になる |
| L-I775-003 | recovery root と parent workflow の両方に screenshot 物理コピーを置かない。**parent 正本 path に PNG を一本化し、recovery root には README pointer のみ** 置く | parent `outputs/phase-11/screenshots/` / recovery `outputs/phase-11/README.md` | 物理 PNG の二重配置は manifest 整合・PASS 判定の drift 源 |
| L-I775-004 | 旧 placeholder と新規 PNG が混在する screenshots ledger では、placeholder を `.placeholder.txt` に rename して **PASS inventory から物理的に除外**する。manifest の `pass: true / verdict: PASS` 昇格は実 PNG が揃った直後のみ | parent `manifest.json` / `artifacts.json.metadata.legacy_placeholder` | `.png` 拡張子が残ったまま空ファイルが ledger に居続けると、Phase 11 evidence parser が誤って count する |
| L-I775-005 | recovery 用 `artifacts.json` の `gates` は **必ず `metadata.gates` 配下**に置く。`passed_at` は passed 時 ISO datetime + offset 必須、pending 時は `null` 必須、`approver` は string（null 不可、`daishiman` 等の identifier） | `packages/shared/src/gate-metadata/schema.ts` / `pnpm gate-metadata:validate` | top-level `gates` は `pickGates()` に拾われず "gates 不在" で `--require-gates-for-changed` が FAIL。`approver: null` は zod regex 不一致で FAIL |
| L-I775-006 | recovery wave では parent manifest 昇格 / unassigned source `consumed` 化 / aiworkflow indexes / artifact inventory / LOGS を **same-wave で sync** する。1 件でも遅れると stale-reference gate が拾う | parent `phase-12/main.md` / `unassigned-task-detection.md` / `aiworkflow-requirements/indexes/*` / `LOGS/_legacy.md` / `docs/30-workflows/LOGS.md` | 部分同期は task-workflow-active と物理状態の乖離を作り、後続 selection で誤再選択を誘発する |
| L-I775-007 | `Closes #<n>` は禁止。commit / PR / 関連 metadata はすべて `Refs #<n>` のみ。`metadata.issue_reference_mode: "refs_only"` を artifacts.json に明示し、closed Issue の re-open を構造的に防ぐ | `artifacts.json.metadata` / commit message lint | re-open は GitHub 側の状態遷移を不可逆に汚す。recovery は "evidence completion" であり Issue 再開ではない |

## 苦戦箇所（unassigned-task 由来）

- 対象: `docs/30-workflows/completed-tasks/serial-05-step-03-followup-001-runtime-evidence-completion.md`
- 症状: parent `serial-05-step-03-schema-diff-resolve` が `completed-tasks/` 配下 (`completed / VISUAL`) にいるのに、`outputs/phase-11/screenshots/` には placeholder `admin-schema-diff-list.png` 1 枚しかなく PASS verdict を満たせていなかった
- 親 manifest: `pass: false`、`verdict: pending`
- 当初誤認: SchemaDiffPanel UI 側の改修が必要と読みうる記述
- 真因: 既存 UI で十分。**Playwright visual evidence の物理生成と manifest 昇格だけ**が欠けていた
- 解決:
  1. 専用 `playwright.admin-schema-diff.config.ts` + `PLAYWRIGHT_TASK17_ADMIN_FIXTURE=1` で fixture mode を ON
  2. `route.fulfill` で `/api/admin/schema/...` をモック（200/202/409/422）
  3. pane-region capture で 4 pane × 2 viewport + resolve 3 ケース = 11 PNG を parent `screenshots/` に集中配置
  4. legacy `admin-schema-diff-list.png` を `.placeholder.txt` に退避
  5. parent `manifest.json` を `pass: true / verdict: PASS` 昇格
  6. unassigned-task に `status: consumed` と `canonical_workflow` ポインタ追加
  7. aiworkflow-requirements indexes / artifact inventory / LOGS を same-wave sync

## 関連 skill feedback

- `task-specification-creator`: closed Issue recovery の §6 適用事例に Issue #775 を追加（refs_only + production frozen + pane-region capture + parent evidence 一本化）
- `aiworkflow-requirements`: parent serial-05-step-03 row を `completed-tasks/` path + `completed / PASS` へ更新、Issue #775 workflow row を resource-map / quick-reference / topic-map / keywords.json / task-workflow-active に追加、`workflow-issue-775-...-artifact-inventory.md` 新規追加
- `automation-30`: メタ抽象系で "missing UI ではなく missing evidence" の真因判定、システム系で same-wave sync の依存対象 5 点を明示
