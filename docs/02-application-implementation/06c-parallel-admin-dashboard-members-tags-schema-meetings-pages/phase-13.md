# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 06c-parallel-admin-dashboard-members-tags-schema-meetings-pages |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| Wave | 6 (parallel) |
| 作成日 | 2026-04-26 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし |
| 状態 | pending |

## ユーザー承認確認文 (冒頭必須)

**この Phase はユーザーの明示承認がある場合のみ実行する。承認なしで `gh pr create` を発火しない。**

## 目的

Phase 1〜12 の成果物を feature branch に push し、`feature/06c-* → dev` PR を作成する。承認後のみ実行。

## 実行タスク

1. local check（typecheck / lint / test / build）の最終 pass
2. `local-check-result.md` を生成
3. `change-summary.md` を生成
4. PR description テンプレートを準備
5. user 承認後に `gh pr create` を実行

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-12/ | 全成果物 |
| 必須 | CLAUDE.md | ブランチ戦略 |

## 実行手順

### ステップ 1: 最終 local check
```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm -F apps/web build
```

### ステップ 2: local-check-result.md
- 上記 5 コマンドの exit code と所要時間を記録

### ステップ 3: change-summary.md
- 変更ファイル一覧（spec のみ、コード変更なし）
- AC 10 件の trace 状況
- 不変条件 7 件の compliance

### ステップ 4: PR description
```
title: docs(app): 06c admin dashboard / members / tags / schema / meetings pages spec

summary:
- /admin/* 5 画面の Phase 1-13 仕様書を作成
- 不変条件 #4, #5, #11, #12, #13, #14, #15 を UI 設計で担保
- 上流 04c API, 05a admin gate, 05b AuthGateState への接続契約を確定
- 下流 07a/b/c workflow, 08a/b test への handoff 完成

risks:
- 上流 04c の `GET /admin/dashboard` response shape が未確定（04c 完了次第 Phase 10 再評価）

evidence:
- outputs/phase-11/manual-smoke-evidence.md
- outputs/phase-12/phase12-task-spec-compliance-check.md
```

### ステップ 5: PR 発行（承認後のみ）
```bash
git push -u origin feature/06c-admin-pages
gh pr create --base dev --head feature/06c-admin-pages \
  --title "docs(app): 06c admin pages spec" \
  --body-file outputs/phase-13/change-summary.md
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| 後続 wave | PR merge 後に 07a/b/c, 08a/b が着手可能 |

## 多角的チェック観点

| 不変条件 | 最終確認 | 結果 |
| --- | --- | --- |
| #4〜#15 | compliance check で全 ✅ | OK |
| 認可 | admin gate redirect | OK |
| 無料枠 | 0.2% 使用 | OK |
| secret | hygiene チェック完了 | OK |

## 変更サマリー

- spec 変更: 15 ファイル（index.md + artifacts.json + phase-01.md 〜 phase-13.md）
- コード変更: なし（spec_created）
- downstream 影響: 07a/b/c, 08a/b が着手可能

## CI チェック

- docs lint pass
- link check pass
- spec compliance check pass

## close-out チェックリスト

- [ ] user 承認あり
- [ ] local-check-result.md がある
- [ ] change-summary.md がある
- [ ] Phase 12 close-out 済み
- [ ] PR が `feature/06c-* → dev` で発行
- [ ] artifacts.json で phase 13 を completed

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | local check | 13 | pending | 5 コマンド |
| 2 | local-check-result.md | 13 | pending | exit code |
| 3 | change-summary.md | 13 | pending | trace |
| 4 | PR description | 13 | pending | template |
| 5 | gh pr create（承認後） | 13 | pending | user approval gate |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/main.md | PR 作成記録 |
| ドキュメント | outputs/phase-13/local-check-result.md | local check 結果 |
| ドキュメント | outputs/phase-13/change-summary.md | 変更サマリー |
| メタ | artifacts.json | Phase 13 を completed |

## 完了条件

- [ ] user 承認取得
- [ ] local check 全 pass
- [ ] PR が `feature/06c-* → dev` で発行
- [ ] artifacts.json で phase 13 を completed

## タスク100%実行確認

- approval gate 通過
- PR URL が outputs に記録
- artifacts.json で phase 13 を completed

## 次 Phase

- 次: なし（タスク完了）
- 引き継ぎ: PR merge 後に 07a/b/c, 08a/b が着手
- ブロック条件: user 承認なしで PR 発行しない
