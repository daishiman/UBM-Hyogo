# Phase 11: 証跡インベントリ

[実装区分: 実装仕様書]

## メタ情報

| 項目     | 内容                                              |
| -------- | ------------------------------------------------- |
| タスクID | issue-883-adapter-dev-warn-unknown-kind           |
| Issue    | #883                                              |

## 取得対象 evidence 一覧

| 種別                            | パス                                              | 取得方法                                                                                                | 必須 |
| ------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---- |
| typecheck ログ                  | `outputs/phase-11/typecheck.log`                  | `mise exec -- pnpm typecheck 2>&1 \| tee ...`                                                           | 必須 |
| lint ログ                       | `outputs/phase-11/lint.log`                       | `mise exec -- pnpm lint 2>&1 \| tee ...`                                                                | 必須 |
| adapter spec ログ (9 case green) | `outputs/phase-11/adapter-test.log`               | `mise exec -- pnpm --filter @ubm-hyogo/web test -- src/lib/adapters/__tests__/member-detail.spec.ts`    | 必須 |
| focused tests ログ (web 全体)   | `outputs/phase-11/focused-tests.log`              | `mise exec -- pnpm --filter @ubm-hyogo/web test`（既存 pass 件数 +1 を確認）                            | 必須 |
| production build ログ           | `outputs/phase-11/build.log`                      | `ENVIRONMENT=local NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8787 mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 \| tee ...` | 必須 |
| **DCE grep ログ**               | `outputs/phase-11/dce-grep.txt`                   | `grep -R "\[member-detail\] unknown kind" apps/web/.next/server apps/web/.open-next 2>/dev/null \| wc -l` | 必須 |
| visual snapshot 不変確認        | `outputs/phase-11/visual-snapshot-status.md`      | `git status apps/web/playwright/tests/visual-full/` が clean であることを記録                           | 必須 |

## ディレクトリ構造

```
docs/30-workflows/issue-883-adapter-dev-warn-unknown-kind/
├── phase-01..13.md
├── artifacts.json
└── outputs/
    └── phase-11/
        ├── typecheck.log
        ├── lint.log
        ├── adapter-test.log
        ├── focused-tests.log
        ├── build.log
        ├── dce-grep.txt
        ├── visual-snapshot-status.md
```

## evidence 合格判定

| evidence                  | 合格基準                                                              |
| ------------------------- | --------------------------------------------------------------------- |
| typecheck.log             | 末尾に `error` 0 件                                                   |
| lint.log                  | 末尾に `error` 0 件                                                   |
| adapter-test.log          | `10 passed`                                                            |
| focused-tests.log         | 既存 web vitest pass 件数 +1 / `failed` 0                              |
| build.log                 | exit 0 / `Compiled successfully`                                      |
| **dce-grep.txt**          | 内容が `0`（改行含む `0\n`）                                          |
| visual-snapshot-status.md | `nothing to commit` 相当 / baseline png 変更なし                       |

## 実測結果（2026-05-25）

| evidence | status | 結果 |
| --- | --- | --- |
| typecheck.log | present | `@ubm-hyogo/web typecheck` exit 0 |
| lint.log | present | `@ubm-hyogo/web lint` exit 0 |
| adapter-test.log | present | 1 file / 10 tests passed |
| focused-tests.log | present | 146 files passed / 1 skipped、1028 tests passed / 1 skipped |
| build.log | present | `ENVIRONMENT=local NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8787 pnpm --filter @ubm-hyogo/web build` exit 0 |
| dce-grep.txt | present | production artifact (`.next/server` / `.open-next`) grep result `0` |
| visual-snapshot-status.md | present | visual baseline 対象 path に差分なし |

## 共通骨格補足

## 目的

本 Phase の仕様観点を固定し、issue-883 の実装・検証・文書同期が後続 Phase と矛盾しない状態にする。

## 実行タスク

- 本文に記載した対象ファイル、契約、検証、証跡を確認する。
- 漏れが見つかった場合は同一サイクル内で修正する。

## 参照資料

- `artifacts.json`
- `outputs/phase-11/`
- `outputs/phase-12/`

## 実行手順

1. 既存本文の仕様・実績を確認する。
2. 実コード、証跡、正本仕様との対応を照合する。
3. 差分があれば同一サイクル内で反映する。

## 統合テスト連携

NON_VISUAL だが実装タスクのため、adapter spec / web tests / typecheck / lint / build / DCE grep を Phase 11 evidence に接続する。

## 多角的チェック観点（AIが判断）

- 矛盾なし
- 漏れなし
- 整合性あり
- 依存関係整合

## サブタスク管理

本タスクは S1-S5 を同一 workflow 内で完了する。未タスク化は検出なし。

## 成果物

- 本 Phase ファイル
- 関連する実コード / evidence / Phase 12 outputs

## 完了条件

- [x] 本 Phase の記述が実装・証跡・正本仕様と一致している。
- [x] coverage AC は adapter spec / web test / typecheck / lint / build evidence で代替確認する。

## タスク100%実行確認【必須】

- [x] この Phase に必要な確認を実施済み。

## 次Phase

次 Phase へ進む前に、本 Phase の差分と evidence を確認する。

