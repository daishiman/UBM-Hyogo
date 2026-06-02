# Documentation Changelog — publish-state-backfill-admin-ui

## 2026-06-01 — Task A 正本タスク仕様書ディレクトリ作成

### 追加

- `docs/30-workflows/publish-state-backfill-admin-ui/` を新規作成。
- `phase-1.md` 〜 `phase-13.md`（Phase 1-13 タスク仕様書）。
  - phase-1: 要件定義（P50 で landed 実装確定 / RC-1..RC-4 / AC-A1..A4 / corrupted path 補正）。
  - phase-2: 設計（target topology / `BackfillResult` 契約 / mutation 規約 / apply ガード / OKLch）。
  - phase-3: 設計レビュー（R-1..R-8 全 PASS）。
  - phase-4〜phase-11: テスト作成 / 実装記述 / coverage / refactor / QA / final review / manual test。
  - phase-12: ドキュメント（中学生レベル概念説明 + 技術契約 + strict-7 一覧）。
  - phase-13: PR 作成（base=dev / user-gated ゲート）。
- `index.md`（workflow index）/ `artifacts.json`（gate metadata, workflow_state=implemented_local_evidence_captured / verdict=PASS_BOUNDARY_SYNCED_RUNTIME_PENDING）。
- `outputs/phase-11/`（manual test plan / interaction states / screenshot plan）。
- `outputs/phase-12/` strict-7（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）。

### 位置づけ

- 本ディレクトリは PR #1064 / commit `745c95115` で dev へ landed 済みの Task A 実装を、Phase 1-13 の正本タスク仕様書として **後追いで文書化**するもの。
- 実コードは PR #1064 の landed 実装を正本としつつ、本レビューサイクルで `BackfillPublishStatePanel.client.tsx` の apply loading 表示を小さく harden した。`apps/api` / D1 / Form schema 差分は発生しない。

### 補正

- 元タスクファイル `tasks/A-publish-state-backfill-admin-ui.md` の corrupted endpoint path `?fullSync=true-publish-state` を、実コード `/api/admin/sync/backfill-publish-state` へ補正して記述した（phase-1.md）。
- Phase 12 skill feedback を候補で止めず、`task-specification-creator/references/phase-template-phase1.md` へ existing-hardening P50 drift table rule として反映した。`SKILL-changelog.md` / `SKILL.md` にも履歴を追加した。
- `implementation-guide.md` を Phase 12 validator 要件に合わせて補強し、Part 1 の「なぜ必要か / 何をするか / 今回作ったもの」と Part 2 の型定義 / APIシグネチャ / 使用例 / エラー / エッジケース / 定数 / テスト構成を明示した。
- `BackfillPublishStatePanel.client.tsx` に `activeMode` を追加し、apply 実行中の loading 表示が dry-run 側へ誤って出ないよう補正した。
- 上記 `activeMode` per-button busy 化と新規テスト `TC-A4b apply pending 中は apply ボタンだけ busy になる` を、仕様書側（phase-1 乖離補正表 / phase-4 TC 列 / phase-5 state・loading 条件 / phase-7 分岐マッピング / phase-11・interaction-states ST-7）へ反映し spec↔code 乖離を解消した。
