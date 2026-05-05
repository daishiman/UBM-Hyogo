# タスク仕様書: CI 失敗回復 + テストカバレッジ 80% 達成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | ci-test-recovery-coverage-80-2026-05-04 |
| 作成日 | 2026-05-04 |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 起票根拠 | main CI run 25297513424 (2026-05-04T02:04Z) — apps/web 36 test failed (jsx-dev-runtime resolution) + apps/api 13 test failed + coverage<80% |
| ブランチ | `feat/ci-coverage-recovery`（origin/main から派生済み） |
| worktree | `.worktrees/task-20260504-104916-wt-9` |

## スコープ

| 含む | 含まない |
| --- | --- |
| apps/web vitest 環境修復（react/jsx-dev-runtime 解決） | UI 機能変更、E2E test 拡充 |
| apps/api 13 test failure 修復 | API 仕様変更、新規 endpoint 追加 |
| apps/web カバレッジ 39%→80% 補強（残未達ファイル） | shared / integrations の coverage 変更（既に≥80%） |
| apps/api カバレッジ →80% 補強 | D1 schema migration |
| coverage-gate hard gate 化（CI continue-on-error 削除） | branch protection 変更（既存通り CI gate 強化のみ） |

## 成果物

- `README.md`（本 wave 全体ガイド）
- `outputs/phase-1/phase-1-requirements.md`（要件定義 + AC）
- `outputs/phase-2/phase-2-design.md`（設計 + jsx-dev-runtime 3 案比較）
- `outputs/phase-3/phase-3-architecture.md`（後続タスク A-E の俯瞰 + 依存グラフ）
- `artifacts.json`（Phase 1-13 skeleton）
- Task A-E の各 spec は本 workflow root 配下の `task-*` canonical dir に配置済み

## 完了条件（spec 段階）

- [x] Phase 1-3 の設計書が存在する
- [x] Task A-E の Phase 1-13 仕様書が parent-local `task-*` canonical dir に存在する
- [x] jsx-dev-runtime 解決の 3 案比較と推奨案が記述されている
- [x] CONST_007 が全 5 タスクで適用されている

## 完了条件（実装段階）

- [ ] apps/web の vitest が CI で 0 件 import 解決失敗
- [ ] apps/web 全 61 test が pass（または skip 理由明記）
- [ ] apps/api 13 test が pass、coverage-summary.json 生成
- [ ] coverage Statements / Branches / Functions / Lines いずれも全パッケージ ≥80%
- [ ] `bash scripts/coverage-guard.sh` exit 0
- [ ] `.github/workflows/ci.yml` の `coverage-gate` job から `continue-on-error: true` が削除済み（job + step 両方）
- [ ] main ブランチ CI run が緑

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| skill 正本 | `.claude/skills/task-specification-creator/SKILL.md` | Phase 1-13 テンプレ運用 |
| 既存 wave | `docs/30-workflows/ut-coverage-2026-05-wave/README.md` | 同一スコープ wave-1/2 既存仕様（重複回避用） |
| coverage-guard | `scripts/coverage-guard.sh` | 80% 一律閾値検証スクリプト |
| CI workflow | `.github/workflows/ci.yml` | coverage-gate job 定義（line 56-110） |
