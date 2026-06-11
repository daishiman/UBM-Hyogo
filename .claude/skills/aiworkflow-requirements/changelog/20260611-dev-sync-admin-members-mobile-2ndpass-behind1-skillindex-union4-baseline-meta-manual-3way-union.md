# dev sync 2nd-pass: `feat/admin-members-mobile-responsive-layout` ← `dev`（behind 1・skill index union 4・**`.baseline-meta.json` は `pnpm sync:resolve` 非対応＝手動 3-way union 必須**という新知見を記録）（2026-06-11）

- 日時: 2026-06-11（`feat/admin-members-mobile-responsive-layout` の dev 取込・**同ブランチ 2 回目の dev sync**）
- 関連: [[20260611-dev-sync-admin-members-mobile-responsive-behind2-skillindex-union4-globalscss-only-overlap]]（**同ブランチ 1st-pass**）/ task-specification-creator 同名 changelog / `lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` L-DEVSYNC-097/098/107/127
- SHA: merge-base `cf0ce5a2c` / dev tip `8be57b92a` / feature 取込前 tip `07bb15ee2` → merge commit `72b8fa69f`
- 取込デルタ（**1 behind / ローカル dev = origin/dev 0/0 同期済み・独自コミット 0**）: #1196 `/admin/schema/history` 目的明確化 + batchId 絞り込み ZodError 根治 + カード化 / #1197 `/admin/schema` 差分レビューの stableKey 割当 UX 直感化。**どちらも admin/schema 系で本 feature（admin/members モバイルカード化）とルート/責務が独立**。
- conflict（2 系統）:
  1. **skill index/reference 系 4 ファイル（UU）**: `indexes/{keywords.json,quick-reference.md,resource-map.md}` + `references/task-workflow-active.md`。`pnpm sync:resolve` 単発で `union-resolving 3 files`（quick-reference/resource-map/task-workflow-active）+ `keywords.json` は `--ours + indexes:rebuild` 再生成 → 収束。
  2. **🔴 NEW: `apps/web/playwright/tests/visual-full/.baseline-meta.json`（3-way content CONFLICT）= `pnpm sync:resolve` が `WARN unhandled conflict` で残す既知ギャップ**。resolver の union/ours 対象 glob 外のため**手動 3-way union が必須**。
- **🔴 visual-full baseline-meta.json の手動 3-way union 解消則（再現性ある手順）**: `merge.conflictStyle=diff3` で `HEAD / merge-base / origin-dev` の 3 ブロックが出る。フィールド別に以下で機械的に解消する:
  1. `captured_at_commit_sha` / `captured_at`: **最新 timestamp 側を採用**（本回 HEAD `1d4e8e872` @ `2026-06-10T21:57:32Z` が dev 側 `2026-06-10T14:34:30Z` より新しいため HEAD 採用）。staleness 診断の起点なので最新キャプチャを正とする。
  2. `captured_run_ids`: **両側の union（重複除去・昇順維持）**。本回 = dev 側 `27282985575` を HEAD 側 list に挿入し `...27276848458, 27282985575, 27308537802`。
  3. `last_refresh_reason`: **両側の理由を `dev sync merge:` 前置で結合**。本質は「両ブランチが異なる baseline PNG 集合を更新」＝feature 側 = admin-members mobile（run 27308537802）/ dev 側 = admin-schema（SchemaPurposeExplainer + SchemaReviewGuide 統合描画・run 27282985575）。対象スナップショットが分離するため双方 union が正。
  4. 解消後 `python3 -m json.tool` で JSON 妥当性を検証してから `git add`。
- **なぜ手動 union が安全か（PNG 共存の含意）**: feature と dev が**別々の baseline PNG** を更新した場合、merge 後は両 PNG が共存する（git は別ファイルなので非衝突）。meta の `captured_run_ids` だけが衝突するので、**union しないと CI の baseline staleness 監査（`scripts/visual-baseline-status.sh`）が片側の run を見失う**。どちらか片側を `--ours/--theirs` で捨てると、捨てた側の baseline が「由来不明」となり次回再生成トリガーを誤判定する。
- CI 検証（全緑・コード修正なし）: `pnpm typecheck` exit 0（7 projects）/ `pnpm lint` exit 0 / `pnpm sync:resolve` の indexes:rebuild 冪等 / `git diff --name-only --diff-filter=U` 0・marker 0。
- 反映先: 本 changelog（**`pnpm sync:resolve` は skill index 系のみ自動収束し visual-full `.baseline-meta.json` は unhandled で残す → 3-way union を `captured_at=最新 / run_ids=union / reason=結合` で機械的に手動解消する判断則**）+ 両 SKILL-changelog.md 1 行。新規 lesson 番号は SSOT インフレ回避で起こさず L-DEVSYNC-107（sync:resolve 適用範囲）の補足データとして記録。
