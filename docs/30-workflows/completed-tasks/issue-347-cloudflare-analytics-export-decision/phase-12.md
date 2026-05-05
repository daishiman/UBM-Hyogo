# Phase 12 — ドキュメント・未タスク・スキルフィードバック

## 目的

task-specification-creator skill の Phase 12 必須 6 タスクを完了し、aiworkflow-requirements への導線追加・未タスク検出・skill feedback・compliance check を行う。docs-only / spec_created タスクのため、09c workflow root state は据え置く。

## Task 12-1: 実装ガイド作成（Part 1 中学生レベル + Part 2 技術者レベル）

- 出力: `outputs/phase-12/implementation-guide.md`
- Part 1（中学生レベル）: 「Cloudflare のサイトの利用状況を、毎月 1 回スクリーンショットの代わりに数値ファイルで保存する」「個人情報は絶対に保存しない」を 3〜5 段落で説明
- Part 2（技術者レベル）: GraphQL Analytics API + 月次取得 + repo 保存 + 12 件 retention の運用手順、保存先 path、redaction-check 実行手順、09c との関係、自動化を別タスクで起票する旨

## Task 12-2: システム仕様書更新（aiworkflow-requirements）

- 出力: `outputs/phase-12/system-spec-update-summary.md`
- 反映先 1: `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`
  - 「Long-term analytics evidence」節（または既存 ops 節）に本仕様書 path 1 行追加
- 反映先 2: `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md`
  - 同上 1 行追加
- Phase 12 で実ファイルへ反映し、Phase 13 は commit / PR 作成のみ user approval gate とする
- 09c parent index.md（completed-tasks 配下）にも参照リンク 1 行追加（state 据え置き宣言を併記）

## Task 12-3: ドキュメント更新履歴

- 出力: `outputs/phase-12/documentation-changelog.md`
- 追加・変更したファイル一覧と意図を箇条書き
- index.md / phase-01〜13.md / outputs/phase-XX 配下 / aiworkflow-requirements 2 件 / 09c parent 1 件

## Task 12-4: 未タスク検出レポート（0 件でも出力必須）

- 出力: `outputs/phase-12/unassigned-task-detection.md`
- 既知の未タスク候補:
  - 「月次取得の自動化（GitHub Actions cron + scripts/fetch-cloudflare-analytics.ts）」を独立タスクとして起票（未タスク化）
  - 担当: release ops owner / 優先度: 中 / 規模: 小〜中
- 0 件ではない場合でも、表形式で全件記述

## Task 12-5: スキルフィードバックレポート（改善点なしでも出力必須）

- 出力: `outputs/phase-12/skill-feedback-report.md`
- 章立て固定: テンプレ改善 / ワークフロー改善 / ドキュメント改善
- 想定 finding:
  - テンプレ改善: docs-only / NON_VISUAL タスクで「外部 SaaS の Free plan 制約確認」を Phase 9 として標準化することの提案
  - ワークフロー改善: なし（該当なしと明記）
  - ドキュメント改善: aiworkflow-requirements deployment-cloudflare.md に「long-term analytics evidence」セクション分離の提案

## Task 12-6: タスク仕様書コンプライアンスチェック

- 出力: `outputs/phase-12/phase12-task-spec-compliance-check.md`
- index.md の `[実装区分: ドキュメントのみ仕様書]` 表記が CONST_004 に整合
- 13 phase × outputs 実体 × AC-1〜8 の 3 軸で完全性確認
- workflow_state が `spec_created` 維持で Phase 12 close-out が実行されている

## 出力（Phase 12 全体）

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 完了条件

- [ ] 6 ファイル + main.md = 7 ファイル実体存在
- [ ] aiworkflow-requirements 2 件への diff 計画
- [ ] 09c parent index.md への参照追加 diff 計画
- [ ] workflow_state が `spec_created` のまま据え置きされている
- [ ] 未タスク検出レポートで「自動化タスク」が起票候補として記述

## 受け入れ条件（AC mapping）

- AC-7, AC-8

## 検証手順

```bash
ls docs/30-workflows/issue-347-cloudflare-analytics-export-decision/outputs/phase-12/ | wc -l
# 期待: >= 7
```

## リスク

| リスク | 対策 |
| --- | --- |
| aiworkflow-requirements 反映先 file 名が変わる | Phase 12 実行直前に `ls .claude/skills/aiworkflow-requirements/references/` で実 file 確認 |
| 09c parent index.md が completed-tasks 配下から再配置される | Phase 12 実行直前に `find docs/30-workflows -name "index.md" -path "*09c*"` で実 path 確認 |
