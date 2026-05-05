# Phase 7: AC マトリクス — 06b-b-profile-request-pending-banner-sticky-001

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-b-profile-request-pending-banner-sticky-001 |
| phase | 7 / 13 |
| wave | 06b-fu |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

AC-1..AC-7 を test ID / evidence path と 1:1 対応させ、漏れなく Phase 9 / 11 で検証可能にする。

## AC × Evidence マトリクス

| AC | 内容 | 関連 TC | evidence path |
| --- | --- | --- | --- |
| AC-1 | reload 後も pending banner が表示される | TC-E-01, TC-E-02, TC-U-08, TC-U-09 | `outputs/phase-11/screenshots/TC-01-pending-banner-after-reload-light.png`, Playwright trace |
| AC-2 | server pending を返したら重複アクションボタンが disabled | TC-U-08..11, TC-E-01..02 | unit test report, `outputs/phase-11/screenshots/TC-02-button-disabled-light.png` |
| AC-3 | 409 ハンドリングが stale UI でも user-visible | TC-I-05, TC-E-05 | `outputs/phase-11/screenshots/TC-03-stale-409-light.png` |
| AC-4 | `/me/*` 境界を保つ（web API path に `:memberId` を出さない） | TC-I-06, grep gate | `outputs/phase-11/grep-result.txt` |
| AC-5 | profile body 編集 UI を追加しない | grep gate | `outputs/phase-11/grep-result.txt` |
| AC-6 | client から D1 を直接叩かない | grep gate `cloudflare:d1` | `outputs/phase-11/grep-result.txt` |
| AC-7 | unit / integration / E2E に reload 永続性ケースが追加される | TC-E-01..06, TC-U-08..11 | coverage report, playwright report |

## evidence type 内訳

| evidence type | 取得 phase | 個数 |
| --- | --- | --- |
| screenshot (light) | Phase 11 | 3〜5 枚（Phase 11 で詳細化） |
| Playwright trace | Phase 11 | 1 trace per spec |
| coverage report | Phase 9 | 1 |
| grep result | Phase 9 / Phase 11 | 1 ファイル |

## 漏れチェック

- AC-1..AC-7 が全て evidence path を持つ
- TC-U / TC-I / TC-E が AC を最低 1 件ずつカバー
- Phase 11 status が `IMPLEMENTED_AWAITING_VISUAL_CAPTURE` でも、grep / coverage は Phase 9 で確定する（S4）

## サブタスク管理

- [ ] AC × TC × evidence の 3 軸を表で確定
- [ ] 抜け漏れチェック完了
- [ ] `outputs/phase-07/main.md` 作成

## 成果物

| 成果物 | パス |
| --- | --- |
| AC マトリクス | `outputs/phase-07/main.md` |

## 完了条件

- [ ] AC-1..AC-7 全てに TC と evidence path が紐付く
- [ ] 本 Phase 内タスク 100% 実行

## タスク 100% 実行確認【必須】

- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 8 へ、AC マトリクスと DRY 化対象（再利用すべき helper / type）の入力を渡す。
