# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 07c-followup-003-audit-log-browsing-ui |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-05-01 |
| 前 Phase | 8 (リファクタリング / DRY 化) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | spec_created |

## 目的

実装・テスト・型・UI 証跡の品質 gate を通す。

## 実行タスク

1. `pnpm typecheck`
2. `pnpm lint`
3. `pnpm --filter @repo/api test:run` または repo の実コマンド
4. `pnpm --filter @repo/web test:run` または repo の実コマンド
5. Playwright admin smoke
6. AC matrix の未 PASS 行を 0 にする

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| Phase 7 | outputs/phase-07/ac-matrix.md | 判定入力 |
| package | package.json | 実コマンド確認 |
| web | apps/web/playwright | smoke |

## 実行手順

実装者は repo の現行 script 名を確認し、実在する command を `outputs/phase-09/main.md` に記録する。失敗時は Phase 5/6/8 のどこへ戻すかを明記する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | GO/NO-GO 判定 |
| Phase 11 | visual evidence 実行 |

## 多角的チェック観点（AIが判断）

- PASS はログと evidence path が揃ってから記録する
- Playwright skipped を PASS と扱わない
- a11y は最低限 role/name/contrast/keyboard focus を確認する

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | typecheck/lint | pending | repo command |
| 2 | tests | pending | api/web |
| 3 | Playwright/a11y | pending | admin auth fixture |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | 品質 gate 結果 |

## 完了条件

- [ ] typecheck / lint / test が PASS
- [ ] Playwright visual smoke が PASS
- [ ] AC matrix が全 PASS

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] main.md 配置
- [ ] artifacts.json の Phase 9 を completed に更新

## 次Phase

次: 10 (最終レビュー)。

