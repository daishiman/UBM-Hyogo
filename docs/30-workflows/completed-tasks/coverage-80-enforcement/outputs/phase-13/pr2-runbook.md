# PR② Runbook — package 別 80% 達成テスト追加（複数 sub PR 想定）

## 目的

PR① merge 後、`coverage-gate` の warning を package 単位で消していくテスト追加 PR 群を出す。各 sub PR は package 単独の責務に閉じ、レビュー単位を最小化する。

## 前提条件

- PR① が merge 済（soft gate / coverage-guard.sh / vitest config / package script が dev に乗っている）
- baseline 計測結果（Phase 11 `coverage-baseline-summary.md`）で package ごとの不足ファイル top10 が判明している
- **user の明示承認**「PR② sub PR を package 単位で作成してよい」

## sub PR 構成（推奨順序）

依存関係の少ない package から進める。

| 順 | sub PR | branch 名 | スコープ |
| --- | --- | --- | --- |
| 1 | sub PR-A | `feat/coverage-80-pr2-shared` | `packages/shared/src/**/*.test.ts` 追加で 80% 達成 |
| 2 | sub PR-B | `feat/coverage-80-pr2-integrations` | `packages/integrations/src/**/*.test.ts` 追加 |
| 3 | sub PR-C | `feat/coverage-80-pr2-integrations-google` | `packages/integrations/google/src/**/*.test.ts` 追加 |
| 4 | sub PR-D | `feat/coverage-80-pr2-api` | `apps/api/src/**/*.test.ts` 追加 |
| 5 | sub PR-E | `feat/coverage-80-pr2-web` | `apps/web/src/**/*.test.ts` 追加（page.tsx 等は exclude のため hooks / lib / server actions 中心） |

> exclude 範囲が広い `apps/web` は最後。Edge runtime / Next.js page.tsx は U-2（E2E 別タスク）で対応する。

## 各 sub PR のコマンド列（user 承認後のみ実行）

例として sub PR-A（packages/shared）:

```bash
git switch dev
git pull origin dev
git switch -c feat/coverage-80-pr2-shared

# baseline で判明した top10 不足ファイルに対応する .test.ts を作成
# coverage-guard.sh の出力 (suggested test path) をそのまま採用する
# - packages/shared/src/utils/sanitize.test.ts
# - packages/shared/src/lib/dateRange.test.ts
# ...

# ローカルで PASS 確認
mise exec -- pnpm test:coverage --filter @repo/shared
mise exec -- bash scripts/coverage-guard.sh --package packages/shared
# exit 0 を確認

# 明示 add（実装ファイルではなくテストファイルのみ）
git add packages/shared/src/**/*.test.ts

git commit -m "$(cat <<'EOF'
test(shared): add unit tests to reach 80% coverage (PR2/3 - shared)

- coverage-guard.sh の baseline で検出された top10 不足ファイルへ unit test 追加
- packages/shared を 80% (lines/branches/functions/statements) 達成
- 実装変更なし（テスト追加のみ）

Refs #<issue>

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

git push -u origin feat/coverage-80-pr2-shared

gh pr create \
  --base dev \
  --title "test(shared): coverage 80% (PR2/3 - shared)" \
  --body "$(cat <<'EOF'
## 概要
PR2/3 sub PR-A: `packages/shared` を 80% 到達。

## 変更
- packages/shared/src/**/*.test.ts 追加（実装変更なし）

## CI 挙動
- `coverage-gate` warning が `packages/shared` 部分で消える
- 全 package まだ 80% 達成していないため warning は完全には消えない（後続 sub PR で順次解消）

## 後続
- sub PR-B: packages/integrations
- sub PR-C: packages/integrations/google
- sub PR-D: apps/api
- sub PR-E: apps/web
- 全 sub merge 完了後、PR3/3 (hard gate) へ

Refs #<issue>
EOF
)"
```

## 期待結果（各 sub PR）

| 項目 | 期待値 |
| --- | --- |
| `bash scripts/coverage-guard.sh --package <pkg>` | exit 0 |
| `coverage-gate` job | 該当 package の FAIL 行が消える（他 package が未達ならまだ warning） |
| 実装変更 | 0（テスト追加のみ） |
| review コスト | sub PR 単位で最小化 |

## 失敗時 rollback

| ケース | 対応 |
| --- | --- |
| 追加した test が flaky | 該当 test 単独で revert / `it.skip` で一時隔離 + Issue 登録 |
| 80% に届かない（exclude が必要） | sub PR で `vitest.config.ts` の exclude 追加を別 commit にして、レビュー対象を明示化 |
| 別 package のテストを誤って巻き込んだ | 該当 commit を revert / 該当 package 用の sub PR で改めて出す |

## branch protection 操作タイミング

**PR② では branch protection を操作しない**。

## sub PR 並行運用の注意

- 各 sub PR は独立 branch。並行作成 OK
- merge 順序は依存少ない順（shared → integrations* → apps/api → apps/web）が安全
- `coverage-gate` warning が「全 package で消えた」状態を確認してから PR③ へ進む

## user 承認チェック

| 段階 | 承認内容 |
| --- | --- |
| 各 sub PR 作成承認 | sub PR ごとに「sub PR-X を作成してよい」 |
| 各 sub PR merge 承認 | sub PR ごとに「sub PR-X を merge してよい」 |

> 5 つの sub PR それぞれで独立した二重承認を取得する。一括承認は禁止。

## 完了判定

- [ ] sub PR-A〜E（5 件）すべて merge 済
- [ ] `bash scripts/coverage-guard.sh` をローカルで実行 → exit 0
- [ ] CI `coverage-gate` warning が出ない
- [ ] PR③ 着手承認待ち
