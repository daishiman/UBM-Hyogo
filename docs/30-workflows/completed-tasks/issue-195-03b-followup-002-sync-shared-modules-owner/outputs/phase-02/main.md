# Phase 2 成果物 — 設計確定文

## D-1〜D-7 採択

- **D-1**: `docs/30-workflows/_design/` を新規作成（workflow 横断 governance 設計）。
- **D-2**: ファイル名 `sync-shared-modules-owner.md`（grep 容易性のため目的的命名）。
- **D-3**: 5列構成 — ファイル / owner task / co-owner task / 変更時の必須レビュアー / 備考。
- **D-4**: 初期投入 3 行（`ledger.ts`, `sync-error.ts`, `index.ts`）— いずれも owner: 03a / co-owner: 03b。
- **D-5**: 変更ルール 4 項目を本文に明記。
- **D-6**: 03a / 03b `index.md` の `## dependencies` 直下に 1 行リンクを挿入。相対パスは `../../_design/sync-shared-modules-owner.md`。
- **D-7**: 未割当 #7 への関係を owner 表末尾と `_design/README.md` に記述。

## ファイル変更計画

| パス | 種別 |
| --- | --- |
| `docs/30-workflows/_design/` | 新規ディレクトリ |
| `docs/30-workflows/_design/README.md` | 新規 |
| `docs/30-workflows/_design/sync-shared-modules-owner.md` | 新規 |
| `apps/api/src/jobs/_shared/{ledger,sync-error,index}.ts` | 新規 |
| `apps/api/src/jobs/_shared/__tests__/*.test.ts` | 新規 |
| `.github/CODEOWNERS` | 編集（path 行追記） |
| `docs/30-workflows/completed-tasks/03a-.../index.md` | 編集（リンク追記） |
| `docs/30-workflows/completed-tasks/03b-.../index.md` | 編集（リンク追記） |

## AC とのトレース

D-3→AC-2、D-4→AC-3、D-5→AC-5、D-6→AC-4、D-7→AC-6 を完全網羅。
