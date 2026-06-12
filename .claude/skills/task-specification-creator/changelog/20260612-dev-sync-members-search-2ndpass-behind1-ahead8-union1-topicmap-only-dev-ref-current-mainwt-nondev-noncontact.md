# dev sync 2nd-pass mirror: behind 1 / ahead 8・union topic-map 1 file・ローカル dev ref 一致済みでメインWT（dev 以外 checkout）完全非接触（2026-06-12 feat/members-search-clear-and-sort-ux）

- 日時: 2026-06-12（`feat/members-search-clear-and-sort-ux` ← `dev`・sub-worktree wt-8・2nd-pass）。取込 1 コミット = `0d505ee52`（#1215 サイドバー折りたたみ nav アイコン縦間隔是正）。merge `967f48695`。
- 事象: content CONFLICT 1 = `indexes/topic-map.md`（union）のみ → `pnpm sync:resolve` 1 パス収束 → marker 検証→add→commit→`git show HEAD:` blob 検証を原子的 1-Bash で確定。install スキップ（lock/package.json 0 変更）・gate 入力 touch 0・typecheck/lint exit 0・indexes 冪等（5520 kw）。CI コード修正 0。
- **🔴SP-DEVSYNC-136 追補（仕様書 Phase 5/11 sync-merge pre-flight の判定順序を確定）**: SP-DEVSYNC-136 は「メインWT dirty なら origin/dev 直接マージ」を規定したが、本 pass で**判定の第 1 段はメインWT 状態でなくローカル dev ref の鮮度**であることを確定。仕様書には次の順で逐語化する:
  1. `git rev-list --left-right --count dev...origin/dev` を読む。**0/0（一致）なら `git merge dev` で完結し、メインWT の clean/dirty 確認自体が不要**（メインWT 非接触）。
  2. behind あり（0/N）の場合のみ `git -C <メインWT> status --porcelain` を読み、clean なら経由 ff 同期可・dirty なら ref 同期をスキップして `git merge origin/dev` を直接マージ（SP-DEVSYNC-136 本則）。
  3. **「メインWT=dev」を前提に書かない**: 本 pass の実測ではメインWT が `docs/...` 系の別ブランチを checkout していた。仕様書の sub-worktree 経路は「メインWT がどのブランチを checkout していても成立する手順」（dev ref 鮮度 → 必要時のみメインWT 確認）として書く。
- Why: 前回（merge `63371bd7f`）の「dirty 分岐」だけを仕様書に書くと、実装者が毎回メインWT 確認から入る冗長手順になり、また「メインWT=dev」前提が崩れた時（別ブランチ checkout）に手順が読めなくなる。dev ref 鮮度を第 1 判定にすれば、別セッションの pull 委譲が機能している通常時は最短経路（`git merge dev` 一発）で完結し、メインWT への関心自体が消える。
- 詳細根拠と実測: aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-136 追補データ点（136-D）が正本。2026-06-12 feat/members-search-clear-and-sort-ux ← dev, sub-worktree wt-8, behind 1 / ahead 8, merge `967f48695`。
