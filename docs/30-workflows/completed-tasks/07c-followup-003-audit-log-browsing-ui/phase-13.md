# Phase 13: PR 作成準備

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 07c-followup-003-audit-log-browsing-ui |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成準備 |
| 作成日 | 2026-05-01 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし |
| 状態 | blocked_user_approval |

## 目的

実装完了後の commit / PR 作成手順を定義する。ただし user 承認なしで commit、push、PR 作成、Issue 操作を行わない。

## 実行タスク

1. local check 結果を `outputs/phase-13/local-check-result.md` に記録する
2. `outputs/phase-13/change-summary.md` を作る
3. `outputs/phase-13/pr-info.md` と `pr-creation-result.md` のテンプレートを用意する
4. user approval gate を通す
5. 承認後のみ PR を作る。closed Issue なので PR body は `Refs #314`

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| Phase 12 | outputs/phase-12/ | PR body |
| CLAUDE | CLAUDE.md | branch / PR 方針 |

## 実行手順

### ステップ 1: local check

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

### ステップ 2: approval gate

user に change-summary、AC matrix、Phase 11 visual evidence、Phase 12 docs update を提示し、明示承認を得る。

### ステップ 3: PR 作成

承認後のみ `gh pr create` を実行する。Issue は closed のままなので reopen / close 操作はしない。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| GitHub PR | `Refs #314` |
| CI | local check と同じ gate |

## 多角的チェック観点（AIが判断）

- `Closes #314` は使わない
- PR URL は artifacts.json に記録する
- user approval なしに git push しない

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | local-check-result | blocked | 実装完了後 |
| 2 | change-summary | blocked | 実装完了後 |
| 3 | approval gate | blocked | user required |
| 4 | PR 作成 | blocked | user required |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/main.md | サマリ |
| ドキュメント | outputs/phase-13/local-check-result.md | local checks |
| ドキュメント | outputs/phase-13/change-summary.md | 変更概要 |
| ドキュメント | outputs/phase-13/pr-info.md | PR 情報 |
| ドキュメント | outputs/phase-13/pr-creation-result.md | PR 作成結果 |

## 完了条件

- [ ] local check が PASS
- [ ] user approval がある
- [ ] PR URL が記録されている

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] Phase 13 固定成果物が配置済み
- [ ] artifacts.json の Phase 13 を completed に更新

## 次Phase

なし。

