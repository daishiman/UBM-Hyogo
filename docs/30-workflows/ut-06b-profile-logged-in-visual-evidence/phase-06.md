# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| 作成日 | 2026-04-30 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | pending |

## 目的

session 不成立、API 500、`?edit=true` で form 出現、staging 未 deploy、secret 漏洩などの failure case を列挙し、各々の検出方法と recovery を定義する。

## failure case 一覧

| # | 状況 | 検出 | 期待挙動 | recovery |
| --- | --- | --- | --- | --- |
| F-1 | local magic link mock 不発（05b dev token 切れ） | /login で session 取得失敗 | /profile が /login redirect | 05b dev fixture の token 期限を再生成 |
| F-2 | apps/api `/me` 500 | 画面が空または error boundary | screenshot 取得を中断、issue 起票 | apps/api ログ確認、AC 不達なら NO-GO |
| F-3 | `/profile?edit=true` で form/input/textarea/submit が **>0** 件 | DevTools `count: 0` ではない | 不変条件 #11 違反 → 親 06b 実装 bug | 06b 実装側に bug 起票、本タスクは blocked |
| F-4 | staging 未 deploy（M-14〜M-16 取得不能） | staging URL 200 不返却 | 09a deploy 完了まで Phase 11 partial | Phase 10 GO 判定で待機、09a 完了後再開 |
| F-5 | DevTools 出力に Cookie / token が混入 | grep で hit | secret 漏洩 → evidence 破棄 | snippet 修正、再取得、grep 再 verify |
| F-6 | screenshot に Cookie banner / 個人 PII 過剰露出 | 目視 | 影響軽微なら継続、過剰なら再取得 | DevTools で要素 hide してから再 capture |
| F-7 | `manual-smoke-evidence.md` の M-XX 行が parent workflow 側で他作業者により更新済み | git diff conflict | parent と整合させてから diff 保存 | git pull、merge、再 diff |
| F-8 | `?edit=true` 反応で URL が `/profile` に rewrite される | URL バー観察 | 仕様変更 → AC-3 / AC-4 再確認 | 仕様 owner（06b）と相談 |
| F-9 | session が member ではなく admin で確立 | `/me` が admin role 返却 | 不変条件 #5 観測対象を超える → member session で再取得 | 別アカウントで login し直し |
| F-10 | DevTools snippet が `location.href` を出力（実装ミス） | grep で `https://` hit | secret hygiene 違反候補 | snippet を `pathname + search` 版に修正 |

## 不変条件 ↔ 異常系マッピング

| 不変条件 | 関連 failure case |
| --- | --- |
| #4 session 必須 | F-1, F-2, F-9 |
| #5 3 層分離 | F-9 |
| #8 read-only | F-3 |
| #11 編集経路なし | F-3, F-8 |

## 実行タスク

- [ ] failure case 表を `outputs/phase-06/main.md` に記録
- [ ] 各 case の検出 / recovery / blocked 化基準を明示
- [ ] 不変条件マッピング記述

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-05/runbook.md | 取得手順 |
| 必須 | docs/00-getting-started-manual/specs/00-overview.md | 不変条件 |

## 完了条件

- [ ] 10 failure case 列挙
- [ ] recovery / blocked 基準明示
- [ ] 不変条件マッピング記述

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] artifacts.json の phase 6 を completed

## 次 Phase

- 次: Phase 7 (AC マトリクス)
- 引き継ぎ: failure case を AC マトリクスの「想定異常」列に転記
