# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 07b-parallel-schema-diff-alias-assignment-workflow |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| Wave | 7 (parallel) |
| 作成日 | 2026-04-26 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし |
| 状態 | pending |

## ユーザー承認確認文 (冒頭必須)

**この Phase はユーザーの明示承認がある場合のみ実行する。承認なしで `gh pr create` を発火しない。**

## 目的

Phase 1〜12 を feature branch に push し、`feature/07b-* → dev` PR を作成。

## 実行タスク

1. local check
2. local-check-result.md
3. change-summary.md
4. PR description
5. 承認後 `gh pr create`

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-12/ | 全成果物 |

## 実行手順

### ステップ 1: 最終 local check

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm -F apps/api build
```

### ステップ 2: local-check-result.md

- 5 コマンドの exit code と所要時間
- back-fill 性能計測の結果（Phase 9）も添付

### ステップ 3: change-summary.md

- 変更ファイル一覧（spec のみ）
- AC 10 trace
- 不変条件 #1, #14 compliance

### ステップ 4: PR description

```
title: docs(app): 07b schema diff alias assignment workflow spec

summary:
- schema_diff_queue の alias 確定 workflow（apply / dryRun 統合）仕様完成
- unidirectional state machine + tx atomic + idempotent back-fill 設計
- recommendAliases service 仕様確定（Levenshtein + section/index）
- audit_log の action prefix `schema_diff.alias_assigned` 確定
- 不変条件 #1, #14 を workflow 設計で担保

risks:
- 上流 04c の alias endpoint response shape (dryRun union) が未確定の場合 Phase 10 再評価
- back-fill 性能（10000 行）が CPU 30s に収まらない場合は cron 分割（案 C）へ移行

evidence:
- outputs/phase-11/curl/*
- outputs/phase-11/perf/backfill-10000.txt
- outputs/phase-12/phase12-task-spec-compliance-check.md
```

### ステップ 5: PR 発行（承認後）

```bash
git push -u origin feature/07b-schema-alias-workflow
gh pr create --base dev --head feature/07b-schema-alias-workflow \
  --title "docs(app): 07b schema diff alias assignment workflow spec" \
  --body-file outputs/phase-13/change-summary.md
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| 後続 wave | merge 後に 08a/b 着手 |

## 多角的チェック観点

| 不変条件 | 最終確認 | 結果 |
| --- | --- | --- |
| #1 | コード grep stableKey 0 件 | OK |
| #5 | apps/api 内のみ | OK |
| #14 | UPDATE schema_questions が schemaAliasAssign のみ | OK |

## 変更サマリー

- spec 変更: 15 ファイル
- コード変更: なし
- downstream: 08a/b 着手可能

## CI チェック

- docs lint pass
- link check pass
- compliance check pass

## close-out チェックリスト

- [ ] user 承認あり
- [ ] local-check-result.md
- [ ] change-summary.md
- [ ] Phase 12 close-out 済み
- [ ] PR が `feature/07b-* → dev`
- [ ] artifacts.json で phase 13 を completed

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | local check | 13 | pending | 5 コマンド |
| 2 | result md | 13 | pending | exit code |
| 3 | change md | 13 | pending | trace |
| 4 | PR template | 13 | pending | description |
| 5 | gh pr create | 13 | pending | approval gate |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/main.md | PR 作成記録 |
| ドキュメント | outputs/phase-13/local-check-result.md | check 結果 |
| ドキュメント | outputs/phase-13/change-summary.md | 変更 |
| メタ | artifacts.json | Phase 13 を completed |

## 完了条件

- [ ] user 承認
- [ ] local check pass
- [ ] PR 発行
- [ ] artifacts.json completed

## タスク100%実行確認

- approval gate 通過
- PR URL 記録
- artifacts.json で phase 13 を completed

## 次 Phase

- 次: なし（タスク完了）
- 引き継ぎ: 08a/b 着手
- ブロック条件: 承認なしで PR 発行しない
