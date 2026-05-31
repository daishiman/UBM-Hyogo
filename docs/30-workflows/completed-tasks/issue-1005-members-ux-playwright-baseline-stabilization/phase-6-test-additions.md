<!-- workflow: issue-1005-members-ux-playwright-baseline-stabilization / phase: 6 -->

[実装区分: 実装仕様書]

# Phase 6 — テスト追加

## 1. 方針

本タスクは Playwright spec の **安定化**であり、「新規テストの追加」ではなく「既存 spec の安定化を裏付ける検証 step の追加」である。
新規 vitest / spec ファイルは作らない（INV-5）。既存 `members-ux-clarity.spec.ts` の編集のみで完結する。

## 2. 追加する検証 step

| # | 検証 step | コマンド / 手段 | 合格条件 | 実行区分 |
|---|----------|----------------|----------|----------|
| S1 | cold-start 再現確認 | `CI=1 ... playwright test members-ux-clarity.spec.ts --project=desktop-chromium`（`reuseExistingServer` 無効） | exit 0 / 12 test PASS（direct script 補完なし） | 手動（cold start 再現が前提のため CI 常時実行はしない） |
| S2 | PNG 数 assertion | `find .../outputs/phase-11/screenshots -name 'members-ux-clarity-*.png' \| wc -l` | 出力 = `24` | 手動（evidence run 直後） |
| S3 | 旧 dir 非生成 assertion | `test ! -d docs/30-workflows/members-list-ux-clarity` | exit 0（旧 active dir が生成されない） | 手動（evidence run 直後） |

## 3. 実行区分の根拠

- S1（cold-start）は `reuseExistingServer` を無効化した CI 相当の起動を必要とするため、開発者が evidence 生成時に手動で 1 回実行する。CI default の Playwright smoke ジョブには members-ux-clarity を載せない（RC-3 の冗長排除と整合）。
- S2 / S3 は evidence run 完了後の後検証であり、Phase 4 検証レイヤー ②③ と同一コマンド。重複実行で副作用はない（read-only な find / test）。

## 4. Phase 11 evidence への残し方

- S1 の cold-start PASS ログ（exit 0）は `outputs/phase-11/runtime-notes.md` に「cold start direct-script 補完不要」の記録として残す（spec の `afterAll` が自動追記）。
- S2 の PNG 数（24）は `outputs/phase-11/screenshots/` の実ファイルが evidence そのもの。
- S3 の旧 dir 非生成は手動コマンド出力を runtime-notes へ追記、または Phase 11 manual-smoke ログに記録する。

## 5. 既存テストへの影響

- 既存 matrix（12 test / 24 PNG）・screenshot 命名・`mask: pagination-meta`・`maxDiffPixelRatio` は不変。baseline 互換を維持する。
- `expandFiltersIfCollapsed` の hydration retry（3 回）は維持し、新たな race を持ち込まない。

## DoD

- [ ] 新規 test ファイルを作っていない（INV-5）
- [ ] cold-start 再現（S1）/ PNG 24 件（S2）/ 旧 dir 非生成（S3）の検証 step を定義した
- [ ] 各 step の実行区分（手動 / CI）を明記した
- [ ] Phase 11 evidence への記録方法を明記した
