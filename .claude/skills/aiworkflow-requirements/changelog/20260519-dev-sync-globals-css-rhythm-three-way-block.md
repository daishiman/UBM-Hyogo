# dev sync — globals.css rhythm ブランチへの dev 取り込み (2026-05-19)

`feat/ui-prototype-design-system-foundation-globals-css-rhythm` に `origin/dev` を取り込み、skill 系 3 ファイル（`LOGS/_legacy.md` / `indexes/resource-map.md` / `indexes/topic-map.md`）の conflict を解消した記録。

## 発生 conflict
- 自動解消（`pnpm sync:resolve` union）:
  - `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
  - `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`
- 手動解消（resolver 対象外として WARN 残置）:
  - `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` — 3-way block（HEAD: `UI prototype design system foundation parallel-01 runtime_pending 昇格` entry / base `d271420f` / dev: 直前 entry の差分）

## 解消経路
1. `git merge dev --no-edit` → 6 ファイル auto-merge + 3 ファイル CONFLICT
2. `mise exec -- pnpm sync:resolve` → resource-map / topic-map を union、`LOGS/_legacy.md` のみ unhandled で残置
3. `LOGS/_legacy.md` は 3-way block を awk スクリプトで `HEAD` 側 + dev 側を時系列保持で連結し base section のみ除去（既存 L-DEVSYNC-023 / L-DEVSYNC-025 と同じ「両側採用」パターン）
4. `git add -A` → `mise exec -- pnpm indexes:rebuild` で keywords.json / topic-map を再生成し drift 解消
5. `git commit` → `git push`

## 再確認した不変ルール
- `LOGS/_legacy.md` の 3-way block は **両側 entry を時系列保持で union 採用** が安全（`L-DEVSYNC-007` / `L-DEVSYNC-023` の継続適用）
- `pnpm sync:resolve` 後は **`pnpm indexes:rebuild` を必ず実行**して keywords.json / topic-map drift を除去（CI `verify-indexes-up-to-date` gate 通過のため）
- skill 系 conflict のみで `apps/**` / `docs/**` に conflict なしの場合は typecheck / lint を省略可（変更が doc-only のため）

## 適用先
- このスキル: 既存 `lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` の playbook が今回も成立、新規ルール追加なし。本 changelog のみ追加
- `task-specification-creator`: 同 sync の旨を SKILL-changelog に追記
