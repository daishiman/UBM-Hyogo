# Phase 9: 品質保証

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-9/phase-9.md` |

## 目的
retention purge 実装一式に対して typecheck / lint / build / 全テストを通し、migration 適用後の schema drift がないことを確認する。

## 実行タスク
詳細は `outputs/phase-9/phase-9.md` を正本とする。

## 統合テスト連携
Phase 8 統合テスト結果と合わせて、Phase 11 以降の運用検証へ引き継ぐ。

## 参照資料
- `outputs/phase-9/phase-9.md`

## 成果物
- `outputs/phase-9/phase-9.md`

## 完了条件
- Phase 9 正本ファイルが存在する。
- `pnpm typecheck` / `pnpm lint` / `pnpm build` / `pnpm test --filter=@ubm-hyogo/api` が全て PASS する。
- `pnpm --filter @ubm-hyogo/api PRAGMA table_info` で schema drift が検出されない。
