# dev sync 3rd-pass: `feat/admin-members-mobile-responsive-layout` ← `dev`（behind 1・**dev の API ソース変更(#1199)取込でも積集合ゼロ＝gate 入力に影響なし**の spec 観点確証）（2026-06-11）

- 日時: 2026-06-11（`feat/admin-members-mobile-responsive-layout` の dev 取込・同ブランチ 3 回目）
- 関連: [[20260611-dev-sync-admin-members-mobile-2ndpass-behind1-baseline-meta-manual-3way-union-visual-evidence]]（同ブランチ 2nd-pass）/ aiworkflow-requirements 同名 changelog / `lessons-learned/dev-sync-merge-conflict-resolution.md` L-DEVSYNC-127
- SHA: merge-base `8be57b92a` / dev tip `49e32b129` / feature 取込前 tip `0a52bd7ca` → merge commit `4ec5b8d6d`
- 取込デルタ（**1 behind / ローカル dev = origin/dev 0/0 同期済み**）: #1199 公開メンバー詳細の全項目空表示根治（`schema_questions` 空時の raw-form fallback・apps/api forms + packages/integrations 10 files）。
- **🔴 spec gate 入力判断（SP-DEVSYNC・"レイヤー分離" 確証）**: 本 feature（VISUAL タスク・admin/members モバイルカード化＝web 表現層）と取込 #1199（api/integrations 層の公開メンバー詳細 fallback）は **touch 積集合 = 空**。よって:
  1. 本 feature の **Phase 11 evidence（admin/members mobile スクショ）/ canonical 9 headings に #1199 の反映は不要**（描画ルート無関係）。
  2. #1199 は API 層のため本 feature の表現層 spec の test SSOT と衝突しない＝**gate 入力（実装済み feature の test 集合）に変化なし**。
  3. 2nd-pass で発生した `.baseline-meta.json` 3-way union は **今回発生せず**（#1199 は visual baseline を再生成しない＝VISUAL evidence 衝突は「dev 側も baseline を更新した時のみ」起こる条件付き衝突であることを補強）。
- 解消: skill index 系 union 3（`pnpm sync:resolve` 単発）のみ・source は zero-intersection auto-merge。`--diff-filter=U` 0・marker 0。
- CI 検証（全緑・コード修正なし）: `pnpm typecheck` exit 0 / `pnpm lint` exit 0 / indexes:rebuild 冪等。
- 反映先: 本 changelog（**VISUAL タスクの sync-merge で `.baseline-meta.json` 衝突が起きるのは「dev 取込側も visual baseline を再生成した時」のみ＝条件付き。dev がソース層のみ変更し baseline 非更新なら skill index 衝突のみで、Phase 11 evidence にも gate 入力にも影響しない**という spec フロー判別則）+ SKILL-changelog.md 1 行。
