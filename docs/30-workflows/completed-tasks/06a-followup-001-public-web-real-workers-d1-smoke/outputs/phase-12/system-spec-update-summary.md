# system-spec-update-summary

## ステータス

- **partially synced: workflow inventory registered / runtime runbook updates blocked until executed completion**
- 本タスクは spec_created 段階のため、Phase 11 実 smoke 結果を前提にする runtime runbook 反映は実施しない。ただし workflow 自体の存在と状態は aiworkflow-requirements の current task inventory に同一 wave で登録する。

## 同一 wave 反映済み

- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`

## 更新対象（pending: smoke 実施後）

### 1. `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`

- **Step 1-A: local smoke 起動手順（追記）**
  - `bash scripts/cf.sh dev --config apps/api/wrangler.toml --local` 経路を runbook に正式採用
  - `wrangler dev` 直接実行を「禁止運用」として明記
  - `PUBLIC_API_BASE_URL=http://localhost:8787` を `apps/web` dev 起動時に必須 env として記載
- **Step 1-B: staging smoke 確認手順（追記）**
  - 4 route family / 5 smoke cases × 2 環境（200 / 404）の curl matrix を runbook に転記
  - staging の `PUBLIC_API_BASE_URL` 確認を `bash scripts/cf.sh` 経由で行う手順
  - localhost fallback が起きていないことの判定基準
- **Step 1-C: esbuild mismatch 恒久対策（追記）**
  - `ESBUILD_BINARY_PATH` の解決ロジックを `scripts/cf.sh` 内部の責務として明記
  - 直接 `wrangler` を呼んだ場合の失敗パターンと回避策

### 2. `docs/00-getting-started-manual/specs/08-free-database.md`

- D1 binding smoke の確認観点（`/members` レスポンスに seed member が 1 件以上含まれることで実 binding 経路を裏付ける）を append
- `apps/web` から D1 を直接 import しないことの再強調（不変条件 #5）

## 更新しない対象（明示的に scope out）

- `docs/00-getting-started-manual/specs/00-overview.md`: 3 層構成は既に正本記載があり、本タスクで再記述しない
- `docs/00-getting-started-manual/specs/01-api-schema.md`: contract 変更なし
- `docs/00-getting-started-manual/specs/13-mvp-auth.md`: 認証経路は smoke 対象外

## 更新タイミングと PR 分離

| 段階 | 対象 PR | 内容 |
| --- | --- | --- |
| 現 PR（spec_created） | 本タスクの仕様書 PR | Phase 1〜13 の Markdown + aiworkflow-requirements workflow inventory 登録 |
| executed close-out | 本タスクの実 smoke 実行後 | 15-infrastructure-runbook.md / 08-free-database.md への実反映 |

## 不変条件 trace

- 不変条件 #5: `apps/web` → `apps/api` → D1 の経路を runbook に明文化
- 不変条件 #6: GAS prototype を runbook の smoke 対象から除外することを明記

## 完了条件（pending 解除条件）

- [ ] Phase 11 の local-curl.log / staging-curl.log / staging-screenshot.png が実体保存済み
- [ ] AC-1〜7 のうち実観測必須項目（AC-1, 2, 3, 4, 5, 6）が green
- [ ] executed close-out と同一 wave で 15-infrastructure-runbook.md / 08-free-database.md が更新済み
