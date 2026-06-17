# Phase 10 最終レビュー — AC 最終確認表 / MINOR 解決確認表

> 本タスクは文言日本語化 + 軽微 UX（VISUAL）。source-level の GO/NO-GO は本書 + go-no-go.md で判定し、VISUAL screenshot 6 PNG は `pending_visual_capture`（user-gated）。

## 1. AC 最終確認表

| AC | 要旨 | 確認手段 | blocker 判定 | Phase 11 screenshot マップ |
| --- | --- | --- | --- | --- |
| AC-1 | 英語表記（R-01〜R-10）が全て日本語へ置換・画面に英語残らない | 残存 grep（§token-audit §4）0 件 + focused vitest | grep でヒット 1 件以上（画面表示）= blocker | attendance-dashboard-full-jp / overview-zone-jp / trend-zone-jp / detail-tabs-jp / filter-bar-jp |
| AC-2 | 「セッション」（S-01〜S-10）が全て「開催回」系へ置換 | 残存 grep 0 件 + `AttendanceDetailTabs`/`KpiPanel` 回帰テスト | 「セッション」残存 = blocker | detail-tabs-jp / overview-zone-jp |
| AC-3 | 専門語（トレンド/ユニーク/KPI/区画/帯/pt）が平易日本語へ | 残存 grep 0 件 + `format-attendance`/`ZoneDistribution` 回帰テスト | 専門語残存 = blocker | trend-zone-jp / filter-bar-jp |
| AC-4 | 見やすさ微調整（U-01〜U-03）・DOM 構造/testid/href 不変 | 構造アサーション（testid 維持）+ Phase 11 visual | DOM 構造/testid 破壊 = blocker（見た目改善の未達は MINOR） | dashboard-full-jp / dashboard-mobile-jp |
| AC-5 | 全色 OKLch トークン・HEX 0 件・新規 token 0 | `verify-design-tokens` PASS + grep + token diff（§token-audit §1） | HEX 検出 / 新規 token = blocker | — |
| AC-6 | 新規 primitive / component 追加ゼロ | `git diff --diff-filter=A`（§token-audit §2） | 新規ファイル追加 = blocker | — |
| AC-7 | API/D1/Form/shared 型 変更ゼロ | `git diff -- apps/api packages/shared` 空（§token-audit §3） | diff 非空 = blocker | — |
| AC-8 | testid/`data-*`/`href`/`role`/`aria-*` 構造保持 | 構造アサーション + grep（属性キー維持） | 属性キー破壊 = blocker（aria-label 値変更は意図的・許容） | — |
| AC-9 | T-01〜T-06 追従 + 回帰テスト追加・focused vitest PASS | focused vitest exit 0 | テスト FAIL = blocker | — |
| AC-10 | フィルタ/書き出し/modal/テーブル/degrade 挙動不変 | 回帰テスト + 手動チェックリスト（Phase 11） | 機能回帰 = blocker | filter-bar-jp / detail-tabs-jp |

> AC-1〜AC-4 が VISUAL 確認対象。実 screenshot は staging deploy + admin 認証後の user-gated capture で埋める（Phase 11）。PNG は擬似生成しない。

## 2. MINOR 解決確認表

| ID | 指摘（Phase 3 由来） | 重大度 | 解決状態 | 対応 / 戻り先 / unassigned 化 |
| --- | --- | --- | --- | --- |
| M-1 | `ZONE_HELP` 変更で Playwright 前方一致（T-06）が壊れる | MINOR | 同一 wave で解決 | T-06 を新文言前方一致へ追従（Phase 4/6 で設計・Phase 5 実装）。放置しない |
| M-2 | visual snapshot（`dashboard-attendance.spec.ts`）が文言変更で baseline 差分 | MINOR | user-gated 申し送り | baseline 再取得は staging visual で user-gated。Phase 11/13 へ申し送り。source gate は blocker にしない |
| M-3 | `期間内延べ出席数` の「延べ」を残す/置換する判断（J-12） | MINOR | Phase 5 最終判断 | label 維持 + hint 補足が既定。完全置換は任意。未実施でも blocker でない |
| M-4 | `くわしい一覧` 内の補助文に残る「テーブル」を「一覧」へ寄せる任意改善 | MINOR | 任意（unassigned 化候補） | 必須ではない。今サイクルで未実施なら **unassigned-task 化対象**として Phase 12 detection に申し送る |

> **unassigned 化対象の確認**: blocker は 0 件。M-4（および M-3 の完全置換）は「任意のさらなる平易化」であり、本サイクルで実施しない場合のみ Phase 12 の unassigned-task-detection へ MINOR follow-up 候補として申し送る（強制起票ではなく、baseline backlog 判断に委ねる）。M-1/M-2 は本タスク内（同一 wave / user-gated 申し送り）で処理されるため unassigned 化しない。

## 3. 判定の入力サマリ

| ブロック | 入力 | 状態 |
| --- | --- | --- |
| 4 条件 | Phase 3 レビュー（全 PASS） | PASS（価値性/実現性/整合性/運用性） |
| AC 全充足 | §1 の確認手段 | 実装サイクルで全 PASS を確認 |
| token gate | `verify-design-tokens` | PASS 想定（CSS 変更最小） |
| 英語残存ゼロ | 残存 grep | 0 件想定 |
| 機能温存 | 回帰テスト + 手動チェック | 挙動不変想定 |

> 上記がすべて充足したときのみ GO（go-no-go.md §1）。1 つでも未充足なら NO-GO。
