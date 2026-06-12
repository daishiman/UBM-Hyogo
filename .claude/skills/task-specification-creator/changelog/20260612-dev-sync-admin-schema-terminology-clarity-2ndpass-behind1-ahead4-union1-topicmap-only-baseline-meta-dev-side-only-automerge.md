# dev sync 2nd pass: behind 1 / ahead 4・CONFLICT 1 = aiworkflow `indexes/topic-map.md`（union）のみ・`.baseline-meta.json` は dev 片側再生成で Auto-merge・task-spec 側衝突 0・CI fail 0（2026-06-12 feat/admin-schema-terminology-clarity）

- 日時: 2026-06-12（sub-worktree task-20260611-071903-wt-5）
- ブランチ: `feat/admin-schema-terminology-clarity` ← `dev` 2nd pass（**1 behind / 4 ahead**・ローカル dev = origin/dev `0d505ee52` 0/0・独自 0）。merge `4f86baeab`・取込 #1215 サイドバー折りたたみ nav アイコン縦間隔 parity（共通シェル + admin tablet baseline 再生成）。
- CONFLICT: aiworkflow `indexes/topic-map.md` 1 file（union・`pnpm sync:resolve` 単発収束）のみ。task-spec 側衝突 0・`apps/**` content conflict 0。
- **spec gate 入力判断（レイヤー分離）**: 本 feature（/admin/schema 用語日本語化・web 表現層 docs/skill 知見のみ ahead）と #1215（共通シェル + visual baseline）の touch 積集合 = 空 → Phase 11 evidence / canonical 9 headings への取込分反映不要・gate 入力不変。
- **`.baseline-meta.json` Auto-merge（SP-DEVSYNC-134 条件付き衝突の負例・dev 片側再生成方向）**: #1215 が baseline png + メタを再生成したが feature 側は非再生成 → 3-way conflict にならず auto-merge clean。仕様書 Phase 5(c) の「`.baseline-meta.json` 手動 union が要るのは**双方再生成時のみ**」を dev 側のみ再生成の方向から補強（3rd-pass 記録の feature 側のみ方向と対になる負例）。
- **Phase 5(c) 確定データ拡張 3 点**: ①union 件数の床 = 1 再々確認（behind 1 でも topic-map 1 件・SP-DEVSYNC-123-A 系） ②原子的 1-Bash commit（marker grep → add -A → commit → `git show HEAD:` blob 検証 0）の適用実証＝parallel-reverter 混入なし（SP-DEVSYNC-135 手順の正常系） ③lock/package.json 変更なし → install skip で `pnpm typecheck` / `pnpm lint` exit 0（7 package）・indexes:rebuild 冪等（5519 kw・drift 0）。
- 運用注記: `.git/.branch-sync.lock` の並列セッション競合は lock 記載 PID 死亡確認 + ポーリング解放待ち → 孤児判定 takeover で前進（スコープ非重複が安全性の実体）。
- 分類: CI コード修正 0・spec 生成手順への影響 0 ゆえ新規 SSOT 不要。SP-DEVSYNC-123-A / 134 / 135 の確定データ拡張。
- 参照: aiworkflow-requirements [[20260612-dev-sync-admin-schema-terminology-clarity-2ndpass-behind1-ahead4-union1-topicmap-only-baseline-meta-dev-side-only-automerge]]（同 sync の正本）, [[dev-sync-merge-conflict-resolution]] SP-DEVSYNC-134 / SP-DEVSYNC-135。
