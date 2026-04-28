# Lessons Learned — verify-indexes-up-to-date CI gate（2026-04-28）

> task-verify-indexes-up-to-date-ci（implementation / NON_VISUAL）の Phase 1〜12 完了に伴う苦戦箇所と再発防止知見。
> 関連正本: `references/technology-devops-core.md`（§CI job 表 / Git hook 運用正本）/ `references/lessons-learned-lefthook-unification-2026-04.md`（L-LH-001 / L-LH-006）
> Wave 同期: `indexes/resource-map.md` / `indexes/quick-reference.md` / `LOGS.md` / `indexes/topic-map.md` / `indexes/keywords.json`

## 教訓一覧

### L-VIDX-001: NON_VISUAL Phase 11 代替証跡 3 点（main / manual-smoke-log / link-checklist）の境界

- **状況**: 本タスクは GitHub Actions workflow の追加で、UI スクリーンショットが取れない NON_VISUAL タスクである。Phase 11 を「PR 後の GitHub Actions 実機 smoke」だけで埋めると、Phase 13 ユーザー承認前に Phase 11 PASS が確定できず、ワークフロー全体が止まる。
- **教訓 / How to apply**:
  1. **local static smoke を Phase 11 で固定**する: `outputs/phase-11/main.md`（判定）/ `outputs/phase-11/manual-smoke-log.md`（証跡）/ `outputs/phase-11/link-checklist.md`（リンク健全性）の 3 点を必須に置く。
  2. **PR 後の実機確認は Phase 13 後の責務**として境界線を明示し、Phase 11 PASS の判定を「文書ウォークスルーで AC-1〜AC-7 を覆うこと」に限定する。
  3. local static smoke の内容: `pnpm indexes:rebuild` 直後の `git diff --exit-code` ログ / `bash -n .github/workflows/verify-indexes.yml` 相当の syntax 確認 / drift シナリオの仮想再現メモ。
  4. 同様の CI gate / workflow 系 NON_VISUAL タスクでは、この 3 点パターンをテンプレ化して Phase 11 を機械的に埋められるようにする。

### L-VIDX-002: implementation_completed_pr_pending 時の正本仕様更新 AC と実機確認の境界

- **状況**: Phase 12 の system-spec-update-summary で「正本仕様（`technology-devops-core.md` の CI job 表）に CI gate 名を追加する」必要がある一方、その job が実機で PASS することの確認は PR 後にしかできない。「未確認の job を正本仕様に書いてよいか」という判定が曖昧だと、spec sync を Phase 13 後にずらす運用と、wave 内に閉じる運用のどちらでも矛盾が生じる。
- **教訓 / How to apply**:
  - **spec sync は wave 内（Phase 12）で完了させる**。理由: skill 側の正本仕様は「実装済み（コードがマージ準備完了）」を反映するものであり、CI 実機 PASS は別のループで確認する。
  - **実機確認（PR 後の GitHub Actions run）は Phase 13 後の独立 task** として扱う。万一 fail した場合は spec を rollback するのではなく、別 PR で fix する（spec が「現実装の予告」になることを許容する）。
  - 状態名 `implementation_completed_pr_pending` は「コード・spec 反映は完了、実機 PASS のみ pending」という境界を表現する。Phase 13 の `pending_user_approval` と区別する。
  - 例外: 仕様自体が変わる可能性が高い（例: workflow 構文を試行錯誤中）ケースでは、spec sync を Phase 13 後にずらす判断もあり得る。本タスクでは indexes drift 検出ロジックが `git diff --exit-code` の決定論動作のため、wave 内 sync で問題なし。

### L-VIDX-003: drift 検出範囲を `.claude/skills/aiworkflow-requirements/indexes` に限定し、横展開は ADR で別途決める

- **状況**: 本リポジトリには `task-specification-creator` 等の他 skill が存在し、それぞれ `indexes/` を持ちうる。CI gate を「全 skill の indexes drift」を検出するように設計したくなるが、各 skill の generate-index 経路 / scripts / 出力決定論性が異なるため、一気に統合すると false positive リスクが高い。
- **教訓 / How to apply**:
  - **本 gate のスコープは `.claude/skills/aiworkflow-requirements/indexes` に限定**し、AC-7 で文言固定する。
  - 他 skill への横展開は **ADR で別途判断**（generate-index の決定論性 / 実行コスト / drift 頻度を確認した上で）。
  - 横展開判定の trigger: 他 skill で「再生成忘れ」が実際に PR レビューを混乱させる事例が複数発生した時、または skill 数が増えて手動検出限界を超えた時。
  - 一方で `.github/workflows/verify-indexes.yml` の workflow 名 / job 名は将来の横展開を想定した汎用名（`verify-indexes-up-to-date`）にしておき、対象 path の追加だけで拡張できる構造を保つ。
  - 横展開時は本 lessons-learned に L-VIDX-004 として追記し、ADR 番号 / 判定根拠を明記する。

## 申し送り（open / baseline 未タスク）

- **VIDX-FU-1**（baseline）: 他 skill（`task-specification-creator` 等）への indexes drift 検証 横展開の ADR 起票
- **VIDX-FU-2**（open）: PR 作成後の GitHub Actions 実機 run で `verify-indexes-up-to-date` が drift なし PASS することの確認（Phase 13 後）
- **VIDX-FU-3**（baseline）: drift 検出時の job ログ出力（`git diff --name-only` 結果）が開発者にとって十分な再現情報を含むかの evaluation
