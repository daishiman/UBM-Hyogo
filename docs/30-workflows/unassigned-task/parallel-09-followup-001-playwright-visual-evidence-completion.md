# parallel-09 Playwright visual evidence 完遂 - タスク指示書

## メタ情報

| 項目         | 内容                                                                                            |
| ------------ | ----------------------------------------------------------------------------------------------- |
| タスクID     | parallel-09-followup-001-playwright-visual-evidence-completion                                  |
| タスク名     | parallel-09 UX cross-cutting primitives の Playwright visual snapshot 12枚取得                  |
| 分類         | 改善 / evidence completion                                                                      |
| 対象機能     | parallel-09 で追加した UI primitives (Icon / FormField / Pagination / Breadcrumb / EmptyState 等) の visual regression evidence |
| 優先度       | 高                                                                                              |
| 見積もり規模 | 小規模                                                                                          |
| ステータス   | consumed (issue-746, 2026-05-17)                                                                |
| 発見元       | parallel-09 Phase 12 Open Runtime Boundary                                                      |
| 発見日       | 2026-05-15                                                                                      |

## Canonical Workflow Status

- canonical_workflow: `docs/30-workflows/issue-746-parallel-09-playwright-visual-evidence-completion/`
- 親 workflow: `docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/`
- 親 archivedFrom: `docs/30-workflows/parallel-09-ux-cross-cutting/`
- 親タスク状態: `implemented_local_evidence_captured`
- Phase 11 evidence 状態: `completed`（spec / config / actual screenshot 12 PNG 取得済み）
- 関連 outputs:
  - `docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-12/unassigned-task-detection.md`（Open Runtime Boundary consumed）
  - `docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/main.md`
- 関連実装:
  - `apps/web/playwright/tests/visual/parallel-09-primitives.spec.ts`
  - `apps/web/playwright.parallel09.config.ts`
  - `apps/web/app/visual-harness/`（primitives 描画用 harness route）

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

parallel-09 (UX cross-cutting) では、UI prototype alignment / MVP recovery の不変条件3「プロトタイプ正本順位」に従い、`docs/00-getting-started-manual/claude-design-prototype/` の primitives を正本として `apps/web/src/components/ui/` 配下に Icon / FormField / Pagination / EmptyState / Breadcrumb 等を実装した。

Phase 11 では visual regression evidence として、6種の primitive × 2 scale (desktop 1280 / mobile 375) = **12 visual snapshot PNG** を `docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots/` に取得する設計とし、`apps/web/playwright.parallel09.config.ts` と `apps/web/playwright/tests/visual/parallel-09-primitives.spec.ts` を追加した。旧 pre-archive path は `docs/30-workflows/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots/` であり、Issue #746 recovery で archive 後 path へ補正済み。

ところが、実行担当ローカルマシンで snapshot 取得を試行した際に `ENOSPC: no space left on device` が連続発生し、Next dev server の起動・Playwright report 書き出し・cache 書き込みが断続的に失敗。結果として **spec / config はコミット済みだが実 PNG が outputs 配下に存在しない** 状態のまま Phase 12 に進んだ。

### 1.2 問題点・課題

- Phase 11 evidence claim が `runtime_pending` のまま固定されていた（visual regression が実行されていなかった）
- 不変条件3「プロトタイプ正本順位」との整合確認が目視ベースに留まり、pixel diff baseline が存在しない
- 後続タスク（task-18 visual-design-tokens / task-22 regression smoke）が baseline PNG に依存する際、parallel-09 の primitive baseline が無いため diff 検知できない
- `docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots/` が空ディレクトリのまま放置されていた

### 1.3 放置した場合の影響

- parallel-09 workflow が `implemented_local_runtime_pending` から `implemented_local_evidence_captured` に進まず、Phase 13 (PR merge) の前提が満たされない
- 後続 UI タスク (task-10 / task-18 / task-22) で primitive の視覚的回帰を検知する手段が失われる
- ENOSPC 由来のローカル環境問題が他タスクでも再発する可能性があり、原因分離と恒久対処が遅れる

---

## 2. 何を達成するか（What）

### 2.1 目的

parallel-09 Phase 11 で設計済みの Playwright visual spec を実行し、6種 primitive × 2 scale = 12 PNG を `outputs/phase-11/screenshots/` 配下に commit 可能なサイズで生成。Phase 11 main.md の evidence claim を `runtime_pending` → `completed` に更新する。

### 2.2 最終ゴール

- `docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots/` に 12 PNG が存在
- `apps/web/playwright/tests/visual/parallel-09-primitives.spec.ts` が CI / local 双方で 0 fail で完走
- Phase 11 `outputs/phase-11/main.md` の evidence claim が `completed` に更新済み
- ENOSPC 再発時のリカバリ手順が followup ドキュメントとして残る

### 2.2.1 完了記録

- 完了日: 2026-05-17
- Recovery workflow: `docs/30-workflows/issue-746-parallel-09-playwright-visual-evidence-completion/`
- 実行結果: `mise exec -- pnpm --dir apps/web exec playwright test --config=playwright.parallel09.config.ts --reporter=line` = 6 passed
- Evidence: `docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots/*.png` = 12 files, all non-empty, all <= 500KB

### 2.3 スコープ

#### 含むもの

- ローカル disk space 確保（cache クリア等）
- `pnpm --dir apps/web exec playwright test --config=playwright.parallel09.config.ts` の実行
- 生成 PNG の `outputs/phase-11/screenshots/` への配置
- Phase 11 evidence claim の状態更新
- ENOSPC 解消手順のメモ化（本ドキュメント §3）

#### 含まないもの

- Playwright spec 自体の書き換え（既存 spec を流用、設計変更時は別 followup）
- CI workflow への visual job 追加（task-18 / task-22 で別途扱う）
- 新規 primitive 追加（不変条件3 違反）

### 2.4 成果物

- 12 PNG ファイル（`outputs/phase-11/screenshots/` 配下）
- Phase 11 `outputs/phase-11/main.md` の状態更新差分
- ENOSPC リカバリ手順を含む本 followup の §3 完了記録

---

## 3. 苦戦箇所 (Struggle Points)

### 3.1 ENOSPC: no space left on device の連鎖

実行担当ローカルで `pnpm --dir apps/web dev` 起動および `playwright test` 実行時に `ENOSPC: no space left on device` が repeated に発生。具体的には以下が断続的に失敗:

- Next dev server の `.next/cache` への build cache 書き込み
- Playwright の HTML report 書き出し (`apps/web/playwright-report/`)
- Playwright browser binary cache (`~/.cache/ms-playwright/` または `~/Library/Caches/ms-playwright/`)
- snapshot diff 生成時の一時ファイル

### 3.2 解決策候補（実施順）

1. **Playwright cache クリア**: `rm -rf ~/Library/Caches/ms-playwright/` 後に `pnpm --dir apps/web exec playwright install chromium` で chromium のみ再取得
2. **Next build cache 削除**: `rm -rf apps/web/.next apps/web/.open-next` で stale cache 一掃
3. **Docker volumes prune**: `docker system prune -a --volumes`（Docker 未使用環境でも残骸が容量を圧迫している場合あり）
4. **node_modules pnpm store 整理**: `pnpm store prune` で未参照 content-addressed store を解放
5. **別ディスク退避**: `TMPDIR` / `PLAYWRIGHT_BROWSERS_PATH` を外付けディスクに向ける（最終手段）
6. **snapshot 生成のみ run**: `--update-snapshots` で baseline のみ生成し、report HTML 出力を `--reporter=line` に絞って disk 圧を最小化

### 3.3 学んだこと / 横展開メモ

- macOS 環境では `~/Library/Caches/ms-playwright/` が hidden で容量見落としされやすい
- `pnpm --dir apps/web exec playwright test --reporter=line` で HTML report 生成を抑止すれば、ENOSPC 寸前環境でも snapshot 取得は完走可能
- Next 16 + Turbopack + OpenNext webpack の三重 cache が `.next` 配下に積み上がるため、PR 単位で `.next` をクリアする運用を task-22 regression smoke で恒久化する候補

---

## 4. 受入条件 (AC)

- **AC-1**: `docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots/` に 12 PNG (6 primitive × 2 scale) が存在し、各ファイルが commit 可能サイズ（個別 ≤ 500KB 目安）
- **AC-2**: `pnpm --dir apps/web exec playwright test --config=playwright.parallel09.config.ts` がローカルで 0 fail / 0 flaky で完走
- **AC-3**: Phase 11 main.md (`docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/main.md`) の evidence claim が `runtime_pending` → `completed` に更新済み
- **AC-4**: 12 PNG が CLAUDE.md 不変条件3「プロトタイプ正本順位」の primitives（`docs/00-getting-started-manual/claude-design-prototype/` の Icon / FormField / Pagination / Breadcrumb / EmptyState 等）と視覚的に整合（目視レビュー OK）
- **AC-5**: ENOSPC リカバリ手順が本 followup §3.2 に確定状態で記録され、再発時に参照可能
- **AC-6**: `outputs/phase-12/unassigned-task-detection.md` の Open Runtime Boundary 該当項目が consumed に更新

---

## 5. 参照資料

- `docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-12/unassigned-task-detection.md` - Open Runtime Boundary 節
- `docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/main.md` - Phase 11 evidence 設計
- `apps/web/playwright.parallel09.config.ts` - parallel-09 専用 Playwright config
- `apps/web/playwright/tests/visual/parallel-09-primitives.spec.ts` - 12 snapshot 取得 spec
- `apps/web/app/visual-harness/` - primitives 描画 harness route
- `docs/00-getting-started-manual/claude-design-prototype/` - プロトタイプ正本（不変条件3）
- CLAUDE.md「UI prototype alignment / MVP recovery」セクション - 不変条件3「プロトタイプ正本順位」
