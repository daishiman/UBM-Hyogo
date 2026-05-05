# Phase 11: NON_VISUAL evidence — トップ index

## メタ

- visualEvidence: `NON_VISUAL`（artifacts.json 確定）
- 縮約テンプレ: NON_VISUAL（screenshot 生成禁止）
- 検証日: 2026-05-01
- 検証者: claude-opus-4-7（自動実行）
- branch: HEAD（worktree task-20260501-172346-wt-6）

## 必須 outputs

- `main.md` (this)
- `non-visual-evidence.md`：シナリオ別 evidence
- `manual-verification-log.md`：検証セッションログ

## evidence 配置

- `sql/migration-grep.txt`：tag_assignment_queue migration 全 grep
- `grep/membertags-write.txt`：member_tags write 経路の inventory（不変条件 #13 実証）
- `grep/web-direct-d1.txt`：apps/web からの D1 直接参照 0 件（不変条件 #5 実証）

## 検証方式

実 staging D1 に対する `bash scripts/cf.sh d1 execute` は本タスクスコープ外（PR レビュー時に実施）。
本 Phase では unit / integration test の実行ログ + grep 結果を主証跡とする。
