# Phase 8 — エラーハンドリング / rename collision / 履歴分断防止

## 8.1 想定エラーとフォールバック

| エラー | 検知 | 対処 |
| --- | --- | --- |
| `git mv` で `fatal: bad source` | rename スクリプト失敗 | csv 中の path タイポを確認。`ls "$before"` で実体存在を確認 |
| `git mv` で `fatal: destination exists` | 既に `.spec.ts` が存在する path 衝突 | Phase 11 で `find packages -name '*.spec.ts'` を再確認。本タスクでは baseline 0 件なので想定外 |
| macOS case-insensitive FS の collision | `git mv` 成功するが実体未変更 | 2 段階 rename: `git mv x.test.ts x.test.tmp && git mv x.test.tmp x.spec.ts` |
| `pnpm -r test` 件数が rename 前後で不一致 | Phase 11 件数比較 | 該当 package を `pnpm --filter` で個別実行し missing test を特定。glob ミスマッチを Phase 7 ゲートで再検証 |
| typecheck 新規エラー | baseline log diff | rename 対象 test が他 test を import している場合（通常ない）に発生。import path を spec に追従させる |

## 8.2 履歴分断防止

- `git mv` 必須（`mv` + `git add` の組み合わせは禁止）
- Phase 11 で抜き打ち 1 ファイル `git log --follow packages/shared/src/errors.spec.ts` を実行し、rename 前の commit が辿れることを確認

## 8.3 rollback 手順

PR merge 後に問題が判明した場合:

```bash
# 全 commit を revert（rename は逆向き git mv）
git revert <commit-C> <commit-B> <commit-A>
```

vitest.config の `{test,spec}` 二段階が維持されているため、revert 後も test は動作する（forward-safe rollback）。

## 8.4 ADR ファイル削除時の挙動

ADR は文書のみで runtime 影響なし。万一削除されても rename 結果には影響しない。
