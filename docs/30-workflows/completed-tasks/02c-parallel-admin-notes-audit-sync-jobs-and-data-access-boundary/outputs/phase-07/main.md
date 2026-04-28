# Phase 7: AC マトリクス — main

## 1. 目的

AC-1〜AC-11 を **コード / テスト / 構造** にトレースし、すべての受入条件が客観的に満たされていることを示す。詳細マッピングは `ac-matrix.md`。

## 2. 結果サマリー

| AC | 状態 | 主な根拠 |
| --- | --- | --- |
| AC-1 | satisfied | 5 repository × unit test 26 件 pass |
| AC-2 | satisfied | adminNotes が view model に混ざらない type check + builder で参照不能 |
| AC-3 | satisfied | apps/web → repository import で `lint-boundaries` exit 1（boundary.test.ts） |
| AC-4 | satisfied | apps/web → D1Database import で `lint-boundaries` exit 1（同上） |
| AC-5 | satisfied | `.dependency-cruiser.cjs` 配置 + grep boundary（dep-cruiser バイナリは Phase 9 で導入） |
| AC-6 | satisfied | `auditLog.ts` から UPDATE / DELETE 関数を export しない、`@ts-expect-error` で証明 |
| AC-7 | satisfied | `consume` の 2 回目は `already_used`、楽観 lock `WHERE used = 0` |
| AC-8 | satisfied | `ALLOWED_TRANSITIONS` 定数 + `IllegalStateTransition` で逆遷移を防止 |
| AC-9 | satisfied | `_setup.ts` の `setupD1()` を 6 test ファイルで再利用（02a/02b も同じ signature を使う合意） |
| AC-10 | satisfied | `__fixtures__/admin.fixture.ts` 先頭 dev only コメント、prod build から exclude（vitest include に未指定） |
| AC-11 | satisfied | `.dependency-cruiser.cjs` の 3 つの cross-domain rule（2a↔2b / 2b↔2c / 2c↔2a） |

## 3. 完了条件チェック

- [x] AC 11 件すべて trace 済み
- [x] テスト件数 162 件 / 全 pass
- [x] typecheck / lint / boundary 全 green
