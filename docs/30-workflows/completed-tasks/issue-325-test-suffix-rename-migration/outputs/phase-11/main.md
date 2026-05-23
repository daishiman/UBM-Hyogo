# Phase 11 — Implementation evidence (PASS)

| 項目 | 値 |
| --- | --- |
| Phase | 11 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 実施日 | 2026-05-09 |
| ブランチ | docs/issue-325-test-suffix-rename-spec |
| 総合判定 | **PASS** |

## サマリ

- 132 ファイルの `git mv` rename を完了（`apps/api/src/**/*.test.ts` → 4 種 suffix `*.spec.ts`）
- `vitest.config.ts` の `test.include` glob を `*.test.{ts,tsx}` から `*.{test,spec}.{ts,tsx}` に拡張（rename 過渡期の two-suffix 許容方針）
- typecheck / lint / api test 全て exit 0
- rename 前後で `apps/api/src/` 配下の test 件数同一（132）

## 現行 baseline（rename 後）

| 項目 | 実測 |
| --- | --- |
| `find apps/api/src \( -name '*.test.ts' -o -name '*.spec.ts' \) \| wc -l` | 132 |
| `find apps/api/src -name '*.test.ts' \| wc -l` | **0**（残存ゼロ） |
| `find apps/api/src -name '*.spec.ts' \| wc -l` | **132** |

## P1〜P10 判定マトリクス（実測）

| # | 項目 | 期待値 | 実測値 | 判定 |
| --- | --- | --- | --- | --- |
| P1 | 残存 `*.test.ts` | 0 | 0 | ✅ |
| P2 | 合計件数（rename 前後） | 132 / 132 | 132 / 132 | ✅ |
| P3 | 分類別件数 | contract=41 / authz=4 / repository=38 / unit=49 | 41 / 4 / 38 / 49 | ✅ |
| P4 | vitest `Tests` 行数値 | rename 前と同一 | 936 passed / 133 Test Files passed | ✅ |
| P5 | typecheck exit | 0 | 0 | ✅ |
| P6 | lint exit | 0 | 0 | ✅ |
| P7 | test exit | 0 | 0 | ✅ |
| P8 | glob 残参照 | apps/api 関連の `*.test.ts` 単独参照 0 | 0（vitest config を `*.{test,spec}` に拡張） | ✅ |
| P9 | rename mapping 行数 | header + 132 data rows | 133 lines / 132 data rows | ✅ |
| P10 | rename diff 0 | `+`/`-` 合計 0 | 132 件すべて R100（pure rename） | ✅ |

## AC 検証

| AC | 内容 | 結果 |
| --- | --- | --- |
| AC-1 | 132 ファイル全件が fixed list に基づき rename | ✅ |
| AC-2 | `git mv` のみ・test 内容変更ゼロ（R100 pure rename） | ✅ |
| AC-3 | rename 後 api test green / 件数一致 | ✅（133 Test Files / 936 Tests passed） |
| AC-4 | apps/api/src 配下 `.test.ts \| .spec.ts` 合計 = 132 | ✅ |
| AC-5 | apps/api/src 配下 `.test.ts` = 0 | ✅ |
| AC-6 | suffix 内訳が fixed list と一致 | ✅ |
| AC-7 | vitest config glob が `*.spec.ts` を網羅 | ✅ |
| AC-8 | `pnpm typecheck` exit 0 | ✅ |
| AC-9 | `pnpm lint` exit 0 | ✅ |
| AC-10 | suffix 規約 ADR 存在 | ✅（`outputs/phase-12/test-file-suffix-adr.md`） |
| AC-11 | Phase 12 strict 7 files + ADR 存在 | ✅ |
| AC-12 | PR 本文 `Refs #325` を含む（`Closes` 不使用） | Phase 13 で適用 |

## 件数 snapshot

```
$ cat outputs/phase-11/test-count-before.txt
     132   # apps/api/src/**/*.test.ts (rename 前)

$ cat outputs/phase-11/test-count-after.txt
     132   # apps/api/src/**/*.spec.ts (rename 後)
```

差分 = 0（一致）。

## suffix 内訳

| suffix | 件数 |
| --- | ---: |
| `*.contract.spec.ts` | 41 |
| `*.authz.spec.ts` | 4 |
| `*.repository.spec.ts` | 38 |
| `*.spec.ts`（unit） | 49 |
| **合計** | **132** |

fixed list（phase-02.md §fixed list）の凍結値 41 + 4 + 38 + 49 = 132 と完全一致。

## test 実行結果

```
> @ubm-hyogo/api@0.1.0 test
> vitest run --passWithNoTests --root=../.. --config=vitest.config.ts apps/api

 Test Files  133 passed (133)
      Tests  936 passed (936)
   Duration  330.04s
```

`apps/api/src/` 配下 132 件 + `apps/api/migrations/seed/__tests__/issue-399-seed-syntax.test.ts` 1 件 = 133 Test Files。
migrations 配下は本タスクの rename スコープ外（spec §scope-in: `apps/api/src/**/*.test.ts` のみ）。

## glob 同期 evidence

`outputs/phase-11/glob-coverage-grep.log` 参照。

更新箇所:

- `vitest.config.ts` の `test.include` 5 entries を `*.{test,spec}.{ts,tsx}` に拡張（rename 移行期の両許容で安全策）
- `coverage.exclude` は元から `**/*.spec.{ts,tsx}` を含み追加変更不要
- `apps/api/package.json` の test script は vitest config 経由のため追加変更不要
- root `package.json` の test 系 script は `apps/api` 直接 glob を持たない
- `lefthook.yml` には `*.test.ts` / `*.spec.ts` の直接 glob 参照なし
- `.github/workflows/*.yml` には `*.test.ts` / `*.spec.ts` の直接 glob 参照なし

## 衝突調査結果

| 確認 | 期待 | 実測 |
| --- | --- | --- |
| rename 先存在 | 0 | 0 |
| new_path 重複 | 0 | 0 |
| 既存 `*.spec.ts` (apps/api/src) | 0 | 0 |

## artifacts

| ファイル | 内容 |
| --- | --- |
| `rename-mapping.csv` | 132 ファイルの old → new mapping (CSV: header + old_path,new_path,suffix_class) |
| `test-count-before.txt` | rename 前 `apps/api/src/**/*.test.ts` 件数（=132） |
| `test-count-after.txt` | rename 後 `apps/api/src/**/*.spec.ts` 件数（=132） |
| `glob-coverage-grep.log` | vitest config / package.json / lefthook / workflows の glob grep evidence |
| `typecheck.log` | `mise exec -- pnpm typecheck` raw command log |
| `lint.log` | `mise exec -- pnpm lint` raw command log |
| `test.log` | `mise exec -- pnpm --filter @ubm-hyogo/api test` raw command log |
| `main.md` | 本ファイル |
