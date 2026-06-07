# Unassigned Task Detection（issue-1111-proxy-transport-util-unify）

未タスク（unassigned-task）検出結果。検出 0 件でも本ファイルを出力する。current（本サイクルで新たに検出した gap）と baseline（既知の構造的境界）を分離する。

## サマリ

| 区分 | 件数 |
| --- | --- |
| current（本サイクル新規検出） | **0 件** |
| baseline（既知の境界・起票しない） | 1 件（auth.ts 統合・下記） |

## current 検出（0 件）

本サイクルで新規に検出した未タスクは **0 件**。理由:

- 本タスクは pure refactor（外部観測挙動の完全不変）であり、新規機能・新規 endpoint・新規 UI を伴わない。挙動を変える gap は構造的に発生しない。
- スコープ（`transport-select.ts` 新規 + 3 呼び出し側切替 + 回帰確認）は CONST_007 に従い 1 サイクルで完結する設計であり、先送り項目が無い。
- 検出対象となりうる「同型イディオムの 4 箇所目」は存在しない（`auth.ts` は別形状＝同型ではない・下記 baseline 参照）。

## baseline 境界（起票しない）

### B-1: `auth.ts` session-resolve の transport 統合

| 項目 | 内容 |
| --- | --- |
| 対象 | `apps/web/src/lib/auth.ts`（session-resolve・`service ?? { fetch }` 三項の軽量変種） |
| 判定 | **未タスク化しない** |
| 理由 | `auth.ts` は本タスクが集約する「binding 優先 → HTTP fallback + isTestOrPlaywright による binding 無効化 + fallback base 解決 + transport ログ」という同型 4 値 transport 選択イディオムを**持たない別形状**。`isTestOrPlaywright` 判定も fallback-base も transport ログも持たず、`service ?? { fetch: fetchImpl }` の三項のみ。無理に `transport-select.ts` へ統合すると staging-only ログ・edge runtime 挙動が変わり pure refactor を破る。**現時点で gap ではない**（同型でない別形状を統合しないことが AC「挙動不変」と整合する正当なスコープ外） |
| 将来条件 | `auth.ts` の transport が isTestOrPlaywright + fallback base を要する形状に変化した時点で、別 Issue として起票判断する（現時点では条件未成立ゆえ起票しない） |

## 関連タスク差分確認（重複起票防止）

| 確認対象 | 結果 |
| --- | --- |
| 親 workflow `admin-meetings-attendance-404-fix-and-ux` | 本タスク（followup-002）が transport util 集約を担当。重複なし |
| 兄弟 `task-05a-fetchpublic-service-binding-001` | `public.ts` 逆方向 fallback 設計。本タスクの集約対象に `public.ts` を含むが、設計方向が整合し競合しない。重複起票なし |
| 兄弟 `staging-api-url-and-session-recovery` | server-side fetch の service-binding 統一。本タスクは選択ロジックの util 抽出で層が異なる。重複なし |
| 同型イディオムの 4 箇所目 | 存在しない（admin mutation / admin read / public read の 3 箇所のみ。`auth.ts` は別形状） |

新規 Issue 起票は **0 件**。`auth.ts` 統合は baseline 境界として記録のみ行い、起票しない。
