# Phase 13: PR 作成準備

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 04b-followup-004-admin-queue-resolve-workflow |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成準備 |
| 作成日 | 2026-05-01 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし |
| 状態 | blocked_user_approval |
| 関連 Issue | #319 (closed) |

## 目的

実装完了後の commit / PR 作成手順を定義する。**ただし user の明示承認なしで commit、push、PR 作成、Issue 操作を行わない**。本 Phase は手順整備と承認 gate 通過の準備までに留め、実 PR 作成は user 承認後に限定する。

## 実行タスク

1. local check 結果を `outputs/phase-13/local-check-result.md` に記録する
2. `outputs/phase-13/change-summary.md` を作る（Phase 12 の implementation-guide と Phase 11 の visual evidence パスを参照）
3. `outputs/phase-13/pr-info.md`（PR title / body / target branch / Refs）と `outputs/phase-13/pr-creation-result.md`（テンプレート）を用意する
4. user approval gate を通す
5. **承認後のみ** PR を作る。closed Issue なので PR body は `Refs #319`、`Closes` は使わない

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| Phase 12 | outputs/phase-12/ | PR body 構成元 |
| Phase 11 | outputs/phase-11/ | visual evidence link |
| CLAUDE | CLAUDE.md | branch 戦略 / PR 自律フロー方針 / commit 禁止条件 |

## 実行手順

### ステップ 1: local check

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

結果は `outputs/phase-13/local-check-result.md` に PASS/FAIL を記録する。

### ステップ 2: approval gate

user に以下を提示し明示承認を得る:

- `change-summary.md`
- AC matrix（AC-1〜AC-6 全 PASS）
- Phase 11 visual evidence（7 target）
- Phase 12 docs update（7 成果物）
- D1 transaction atomic / admin-managed data 分離 / 二重 resolve 冪等の確認結果

**user 承認なしに git commit / git push / gh pr create を実行しない**。

### ステップ 3: PR 作成（承認後のみ）

承認後のみ `gh pr create --base dev` を実行する。Issue #319 は closed のままなので reopen / close 操作はしない。PR body 末尾は `Refs #319`。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| GitHub PR | `Refs #319`（closed Issue） |
| CI | local check と同じ gate（typecheck / lint / test / build） |

## 多角的チェック観点（AIが判断）

- `Closes #319` は使わない（closed Issue のため）
- PR URL は `pr-creation-result.md` と artifacts.json に記録する
- **user approval なしに git push / PR 作成しない**
- branch 戦略は CLAUDE.md に従い `feature/* → dev → main`

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | local-check-result | blocked | 実装完了後 |
| 2 | change-summary | blocked | 実装完了後 |
| 3 | pr-info / pr-creation-result template | blocked | 実装完了後 |
| 4 | approval gate | blocked | user required |
| 5 | PR 作成 | blocked | user required |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/main.md | サマリ |
| ドキュメント | outputs/phase-13/local-check-result.md | local checks |
| ドキュメント | outputs/phase-13/change-summary.md | 変更概要 |
| ドキュメント | outputs/phase-13/pr-info.md | PR 情報（title / body / Refs） |
| ドキュメント | outputs/phase-13/pr-creation-result.md | PR 作成結果（user 承認後に埋める） |

## 完了条件

- [ ] local check が PASS
- [ ] user approval がある
- [ ] PR URL が記録されている（user 承認後）

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] Phase 13 固定成果物が配置済み
- [ ] artifacts.json の Phase 13 を completed に更新

## 次Phase

なし。
