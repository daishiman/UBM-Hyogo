# 実装ガイド — Issue #325 test suffix rename

## Part 1: 中学生レベル

テストファイルの名前に「どんなテストか」が分かる印を付ける作業である。

今は `apps/api/src` に `*.test.ts` が 132 件あり、名前だけでは API の約束を確認するテストなのか、認可のテストなのか、データ保存のテストなのかが分かりにくい。そこで、内容は変えずに名前だけを次の4種類へ分ける。

| 種類 | 名前 |
| --- | --- |
| API の約束を確認する | `*.contract.spec.ts` |
| 認可・セッションを確認する | `*.authz.spec.ts` |
| repository / D1 まわりを確認する | `*.repository.spec.ts` |
| それ以外の単体テスト | `*.spec.ts` |

テストの中身を直したくなっても、このPRでは直さない。名前だけを変えることで、後から読む人がファイル名だけでテストの種類を判断できるようにする。

## Part 2: 技術者レベル

| 項目 | 方針 |
| --- | --- |
| 対象 | `apps/api/src/**/*.test.ts` 132 ファイル |
| 手法 | `git mv` のみ。test 本文・import・assertion は変更しない |
| 分類 | contract=41 / authz=4 / repository=38 / unit=49 |
| glob 同期 | `vitest.config.ts`, `apps/api/package.json`, `package.json`, `lefthook.yml`, `.github/workflows/{ci,backend-ci,pr-build-test}.yml` |
| evidence | Phase 11 の `test-count-before/after`, `find-test-count-before/after`, `rename-mapping.csv`, `glob-coverage-grep.log`, `typecheck.log`, `lint.log`, `test.log` |

## 実行順序

1. rename 前に `apps/api` test 件数と file 件数を保存する。
2. Phase 2 fixed list から `rename-mapping.csv` を生成する。
3. `git mv` で 132 件を一括 rename する。
4. `*.test.ts` を直接参照する API test glob を `*.spec.ts` へ同期する。
5. typecheck / lint / api test を実行し、rename 前後の件数一致を確認する。

## 実装結果（2026-05-09）

- 132 ファイル全件 `git mv` rename 完了
- vitest.config.ts の `test.include` を `*.{test,spec}.{ts,tsx}` に拡張（rename 移行期の two-suffix 許容）
- 他の glob 設定 (`apps/api/package.json` / `lefthook.yml` / `.github/workflows/*.yml`) は `*.test.ts` 直接参照を持たないため追加変更不要
- typecheck / lint exit 0
- `mise exec -- pnpm --filter @ubm-hyogo/api test` → 133 Test Files / 936 Tests passed（src 132 + migrations 1）
- 残存 `apps/api/src/**/*.test.ts` = 0
- 詳細実測値は `outputs/phase-11/main.md` 参照

## 境界

このガイドは実装完了後に更新済み。Issue #325 は CLOSED 状態のまま、PR 本文では `Refs #325` のみで連携する。
