# lessons-learned-task-26-error-tsx-token-utility-migration-2026-05

UI prototype alignment task-26（`apps/web/app/error.tsx` / `loading.tsx` / `not-found.tsx` の stale literal → `@theme inline` token utility 移行）の close-out 教訓。`task-08`（design-tokens SSOT）/ `task-09`（globals.css bridge）/ `task-18`（verify-design-tokens / playwright-smoke CI gate）と 3 層構成で連動する consumer 層の修正サイクル。

## L-T26-001: 設計タスク起票時の現行コード drift 事前 grep を必須化する

- 状況: 当初は `spec_created`（仕様策定のみ）として起票したが、Phase 5 着手段階で error/loading/not-found に旧互換 alias と stale runtime token が残存していることが判明し、同一サイクルで実コード修正へ workflow_state を `implemented_local_evidence_captured` に再分類した。
- 問題: VISUAL タスクで `spec_created` 起票したまま実コード drift を見逃すと、後続 PR で「設計のみ」と「実装込み」のスコープが曖昧化し、Phase 12 close-out 時に artifacts.json と index.md / outputs の状態語彙が齟齬を起こす。
- 対策: VISUAL × 既存 route 修正系の Phase 0 で、対象 route の SSOT 違反（HEX 直書き、`bg-[#...]`、旧 alias 参照）を `verify-design-tokens` 相当の grep（`apps/web/app/<route>.tsx`）で事前に走らせ、drift があれば `implementation / VISUAL` 起票に切替える。

## L-T26-002: 旧互換 alias を SSOT に追加せず consumer 側で正規 token へ統合する

- 状況: `--ubm-color-fg-muted` / `primary` / `on-primary` / `border` / `surface-2` 等の旧互換 alias / SSOT 未定義の stale token が consumer 側に残っていた。
- 問題: SSOT (`tokens.css`) に alias を追加して consumer の利便性を上げると token 体系が肥大化し、`verify-design-tokens` の正本判定が緩む。
- 対策: SSOT には alias を追加せず、consumer 側で `text-text-3` / `text-panel` / `border-border` / `bg-surface-2` / `bg-accent` の正規 utility へ統合する。OKLch 移行系で同パターンが 2 回以上発生したら `references/patterns-design-token-migration.md` への汎化候補とする。

## L-T26-003: VISUAL タスクの screenshot 要否を Phase 0/2 で明示する

- 状況: Phase 11 で `not-found-desktop.png` のみ取得し、`error.tsx` / `loading.tsx` は component render assertion で代替した。Phase 2 design では screenshot 要否のルールが薄かった。
- 問題: `verify_existing` モード（既存 UI surface の token 移行）で screenshot rule が無いと、Phase 11 evidence の網羅性が reviewer ごとに揺れる。
- 対策: Phase 2 の design セクションに「visual surface が実質変化しない token 置換は render assertion で代替可、surface 変化がある場合のみ screenshot 必須」のルールを明文化する。task-specification-creator skill 側の Phase 11 テンプレ更新候補（FB-T26-01）。

## L-T26-004: 3 層 token migration パターンの汎化候補は 2 例蓄積後に切り出す

- 状況: task-08（SSOT）/ task-09（bridge）/ task-26（consumer 移行）の 3 層構成で同じ migration 構造が出現した。
- 問題: 1 例だけで pattern を skill へ汎化すると過剰一般化のリスクがある。
- 対策: 同種 consumer 移行（例: 別 route の `bg-[#...]` 除去）が 2 例目に到達した時点で `references/patterns-design-token-migration.md`（仮）として skill 化する（FB-T26-02）。

## L-T26-005: downstream CI gate を「実測済み代替証跡」と誤記しない

- 状況: task-18 の `verify-design-tokens` / `playwright-smoke` は downstream gate であり、task-26 単体の Phase 11 evidence ではない。Phase 12 summary 起草中に「task-18 で実測済み」と誤記する寸前まで進んだ。
- 問題: downstream gate を upstream evidence として転用すると、当該 task の Phase 11 が空のまま PR が通る。
- 対策: Phase 11 evidence は当該 task の実成果物（render assertion / screenshot / grep result）に限定し、downstream gate への依存は Phase 12 `documentation-changelog.md` の references セクションに分離記載する。

## L-T26-006: Phase 2 design に Before/After/経路の 3 列 mapping table を必須セクション化する

- 状況: token migration の対応関係（`--ubm-color-fg-muted` → `text-text-3` 等）が implementation-guide L80 に集約され、Phase 2 design 段階では非構造化だった。
- 問題: Phase 2 で mapping table が無いと、Phase 5/6 で実装漏れの逆引きができず、Phase 12 compliance check で人手レビューが膨らむ。
- 対策: Phase 2 design テンプレに「Token mapping table（Before / After / 経路 = direct-replace / utility-alias / fallback-removed）」を必須セクション化する（FB-T26-05）。

## 参照

- workflow root: `docs/30-workflows/task-26-ui-mvp-w8-par-error-tsx-token-utility-migration/`
- artifact inventory: [workflow-task-26-ui-mvp-w8-par-error-tsx-token-utility-migration-artifact-inventory.md](workflow-task-26-ui-mvp-w8-par-error-tsx-token-utility-migration-artifact-inventory.md)
- related: [lessons-learned-issue-621-apps-web-test-suffix-rename-2026-05.md](lessons-learned-issue-621-apps-web-test-suffix-rename-2026-05.md)（apps/web rename 系の verify-design-tokens static path drift と同根）
- skill feedback: `docs/30-workflows/task-26-.../outputs/phase-12/skill-feedback-report.md`（FB-T26-01〜05）
