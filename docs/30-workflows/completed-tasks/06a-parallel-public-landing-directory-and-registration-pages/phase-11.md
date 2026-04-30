# Phase 11: 手動 smoke

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | public-landing-directory-and-registration-pages |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke |
| 作成日 | 2026-04-26 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | pending |

## 目的

local / staging で 4 ルートを手動確認し、curl 出力 + screenshot を evidence に残す。

## 実行タスク

1. local smoke
2. staging smoke
3. evidence 収集
4. 観測項目

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-05/runbook.md | 手順 |
| 必須 | outputs/phase-09/main.md | 期待値 |
| 参考 | docs/00-getting-started-manual/specs/05-pages.md | UX 期待値 |

## 実行手順

### ステップ 1: local smoke

| ID | 手順 | 期待 | evidence |
| --- | --- | --- | --- |
| M-01 | `pnpm dev` 起動後 `curl -s http://localhost:3000/` を 200 確認 | 200 + Hero / Stats | curl ログ |
| M-02 | `curl -s "http://localhost:3000/members?q=hello&zone=0_to_1&density=dense"` | 200 + URL に query 表示 | curl ログ |
| M-03 | ブラウザで `/members?tag=ai&tag=design` を再読み込み | filter が復元 | screenshot |
| M-04 | `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/members/UNKNOWN` | 404 | curl ログ |
| M-05 | ブラウザで `/register` → responderUrl リンク click | 別タブで Google Form 開く | screenshot |

### ステップ 2: staging smoke

| ID | 手順 | 期待 | evidence |
| --- | --- | --- | --- |
| M-06 | `curl -s https://<staging>/` | 200 | curl ログ |
| M-07 | `curl -s "https://<staging>/members?density=list"` | 200 + density=list 反映 | curl ログ |
| M-08 | `curl -s -o /dev/null -w "%{http_code}" https://<staging>/members/UNKNOWN` | 404 | curl ログ |
| M-09 | ブラウザで `/register` を staging で開く | form-preview 表示 + responderUrl リンク | screenshot |

### ステップ 3: evidence 収集

| 種別 | パス | 用途 |
| --- | --- | --- |
| curl log | outputs/phase-11/evidence/curl/M-01.log | smoke 根拠 |
| screenshot | outputs/phase-11/evidence/screenshot/M-03.png | UI 根拠 |
| screenshot | outputs/phase-11/evidence/screenshot/M-05.png | register 導線 |
| screenshot | outputs/phase-11/evidence/screenshot/M-09.png | staging register |

### ステップ 4: 観測項目

| 観測軸 | 確認方法 | 期待 |
| --- | --- | --- |
| Cache-Control | response header | `s-maxage=30〜600` |
| `Set-Cookie` | response header | 0 件（公開層） |
| Console log | DevTools | `window.UBM` 参照なし |
| Network panel | DevTools | apps/api への fetch のみ |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | smoke 結果を documentation-changelog に記録 |
| Phase 13 | PR description に貼付 |
| 09a | staging deploy 成果と突合 |

## 多角的チェック観点

- 不変条件 #1: M-03 で stableKey が UI に出ていないか目視
- 不変条件 #5: M-04 で API が hide → page も 404
- 不変条件 #6: console / network で `window.UBM` 出現なし
- 不変条件 #8: M-02, M-07 で URL query に density / sort が出る
- 不変条件 #9: M-05, M-09 で `/no-access` への遷移なし
- 不変条件 #10: Cache-Control 観測

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | local smoke | 11 | pending | M-01〜M-05 |
| 2 | staging smoke | 11 | pending | M-06〜M-09 |
| 3 | evidence 収集 | 11 | pending | curl + screenshot |
| 4 | 観測項目 | 11 | pending | 4 軸 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | smoke 結果 |
| evidence | outputs/phase-11/evidence/ | curl + screenshot |
| メタ | artifacts.json | phase 11 status |

## 完了条件

- [ ] M-01〜M-09 が pass
- [ ] evidence が phase-11/evidence に揃う
- [ ] 観測項目 4 軸が green

## タスク100%実行確認【必須】

- 全 4 サブタスクが completed
- outputs/phase-11/main.md 配置
- 不変条件 #1, #5, #6, #8, #9, #10 への対応が evidence で証明
- 次 Phase へ smoke 結果を引継ぎ

## 次 Phase

- 次: 12 (ドキュメント更新)
- 引き継ぎ事項: smoke 結果と evidence path
- ブロック条件: M-01〜M-09 のいずれか fail なら進まない
