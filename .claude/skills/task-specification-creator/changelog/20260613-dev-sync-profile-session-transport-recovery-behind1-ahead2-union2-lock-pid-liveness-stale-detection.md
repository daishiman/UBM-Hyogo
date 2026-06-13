# dev sync mirror: behind 1 / ahead 2・union 2（quick-reference + topic-map）・branch-sync Pre-flight の孤児 lock を PID liveness で検出・回収（2026-06-13 fix/profile-session-staging-transport-recovery）

- 日時: 2026-06-13（`fix/profile-session-staging-transport-recovery` ← `dev`・sub-worktree wt-3・S-SUB）。取込 1 コミット = `e803ea66a`（#1218 公開メンバー一覧の検索クリア二重表示解消とソート 4 種拡張）。merge `d487ded46`。
- 事象: content CONFLICT 2 = `indexes/quick-reference.md` + `indexes/topic-map.md`（union）→ `pnpm sync:resolve` 1 パス収束 → marker 0 → add -A → commit。install スキップ（lock/package.json 0 変更）・gate 入力 touch 0・typecheck/lint exit 0・indexes 冪等（5520 kw）。CI コード修正 0。
- **🔴SP-DEVSYNC-139（仕様書 Pre-flight / 環境ガード Phase に lock staleness の PID liveness 優先判定を逐語化）**: branch-sync Pre-flight で共通 `.git` dir の `.branch-sync.lock`（PID 46829・age 66 秒 < 30 分）が `ps -p` DEAD ＝先行 run の孤児 lock。仕様書には次を逐語化する:
  1. lock パスは `COMMON=$(git rev-parse --git-common-dir); LOCK="$COMMON/.branch-sync.lock"` で解決する（`.git/.branch-sync.lock` 直書きは sub-worktree の `.git` がファイルゆえ「no lock」誤陰性を返す）。
  2. lock 存在時の判定順序 = **(1) PID 生存確認 → DEAD なら age を問わず孤児として削除・再取得し続行 (2) ALIVE かつ age < 30 分なら多重実行で中断 (3) ALIVE かつ age > 30 分は警告付き削除して続行**。「age 30 分超のみ stale」の時間単独ルールを書かない（孤児 lock で永続ブロックする）。
  3. 孤児 lock 削除は破壊操作ガード（削除禁止 / 破壊判断回避）に抵触しない調整用一時ファイル回収であり、「lock 存在＝即中断」と書かない。
- 副次データ点: behind 1 でも union 2（quick-reference + topic-map）＝union 件数は behind 数でなく取込コミットが touch した index ファイルで決まる（L-DEVSYNC-123-A 非単調性の再実証）。
- 反映先: 本 changelog mirror + 両 SKILL-changelog.md 1 行 + 正本 aiworkflow-requirements [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] L-DEVSYNC-139 + 本 skill lessons SP-DEVSYNC-139。
