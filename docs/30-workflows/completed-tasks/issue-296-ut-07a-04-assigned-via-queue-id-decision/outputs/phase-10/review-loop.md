# Phase 10: review feedback ループ方針

## 想定指摘パターンと応答テンプレート

### P1) 「列を追加した方が将来の query 性能が良いのでは」

**応答**: ADR 0002 Re-evaluation triggers (a) (c) に該当する要件が顕在化した時点で superseding ADR を起票して
列追加 migration を企画する。現時点では `WHERE source='admin_queue'` + audit_log の 2 段 join で MVP
admin UI 要件を満たせており、列追加のコスト（migration / backfill 不能 / API breaking / test 更新）が
便益を上回らない。性能問題は query plan の実測で判断する。

### P2) 「audit_log retention 期限後に queue 追跡が失われるリスクは？」

**応答**: ADR 0002 Re-evaluation triggers (b) として明示済み。audit_log の保持期間短縮または物理削除方針で queue 追跡履歴を保持できなくなる判断が
発生した時点で本 ADR を再評価し、列追加 or audit_log retention 維持のどちらかを選び直す。Consequences の
"Negative / Trade-off" にも同等の緩和策を記載。

### P3) 「ADR 連番 0002 が既存 ADR と衝突する」

**応答**: 実機の `docs/decisions/` 配下は `0001-git-hook-tool-selection.md` のみ。`0002` で衝突しない
ことを確認済み。Phase 8 で実ファイル作成時にも `ls docs/decisions/` で再確認している。

### P4) 「07a 親 `unassigned-task-detection.md` は `completed-tasks/` 配下なので改変は NG では？」

**応答**: 破壊的編集ではなく、UT-07A-04 行の **行末に補足を追記** する形のみ採用した（closure: ADR 0002 リンク）。
本文の意味は保たれ、別 ADR から 07a への単方向リンクも ADR 0002 References に併記している。レビューで
「completed-tasks には一切触れない」方針が望まれる場合は、当該追記を revert し、ADR 0002 References の
07a への単方向リンクのみを残す対応に切り替える。

### P5) 「spec と skill の同時更新で drift しないか」

**応答**: Phase 8 で同一 PR 内で両ファイルを更新し、いずれも ADR 0002 へ相対パスで相互参照する形にした。
Phase 12 `documentation-changelog.md` に両ファイルの更新を 1 件の changelog fragment として記録し、
将来の差分検証で同期確認が容易になる。

## レビューサイクル上限ポリシー

- **max 2 cycles** を上限とする。
- 上限到達時は、ADR 0002 を「scope-locked v1」として merge し、未解消論点は新規 ADR / 別 PR に切り出す。
- 紛糾した場合は user にエスカレーションして scope の再合意を取る。「時間がない」を理由に押し切らない。

## 出力先

`outputs/phase-10/review-loop.md`（本ファイル）。
