# Unassigned Task Detection — home-dashboard-japanese-localization

> 正本: `_shared-context.md`。本タスクは単一サイクル・単一 PR（CONST_007）。
> 0 件でも出力必須。current / baseline を分離して記録する。

## サマリ

| 区分 | 件数 | 説明 |
| --- | --- | --- |
| current（本サイクルで分離した未タスク） | **0 件** | 全変更（実装7 + テスト6）を 1 サイクル 1 PR で完結。先送り分離なし |
| baseline（元タスクのスコープ外で別途検討余地） | **0 件** | 元要求（ホーム画面の英語表記日本語化）の範囲内で完結 |

## current（本サイクル）

- 本タスクは SSOT §2 不変条件 #6（単一サイクル・単一 PR）に従い、ホーム画面の英語表記日本語化・eyebrow 削除・dead CSS 削除・public members 旧 shape 補完・テスト更新を **1 サイクルで完了**する設計。
- バックログ（unassigned-task）へ先送りする差分は無い。**current 0 件**。

## baseline（スコープ外確認）

元タスクのスコープ（ユーザー要求 = ホーム画面の英語表記を日本語へ）に対し、明示的にスコープ外とした項目を確認した。

| 候補 | スコープ判定 | 起票要否 |
| --- | --- | --- |
| ホバー等のギミック導入 | **スコープ外（ユーザーが明示的に不要と指示）** | 不要 |
| 他画面（会員/管理画面）の英語表記 | スコープ外（本タスクはホーム `/` のみ） | 不要（要求外） |
| 統計の値・サブ行の文言変更 | スコープ外（現状維持と確定） | 不要 |
| Hero eyebrow prop の汎用機能削除 | スコープ外（Hero は汎用のため prop 保持） | 不要 |

> いずれも元要求の範囲外であり、本サイクルでの追加対応・別タスク起票は不要。**baseline 0 件**。

## 関連タスク差分確認

- 公開層の他 VISUAL タスク（public-member-common-ui-card-unification 等）と対象ファイルが重ならない（ホーム 6 セクション専用）ため、競合・重複による未タスク発生は無い。
- eyebrow 削除対象コンポーネント（Hero/AboutUbm/Timeline/CallToActionCTA/Featured/Stats）は home 専用（grep 確認済）で、他画面への波及・追従タスクは発生しない。

## 結論

current 0 件 / baseline 0 件。本タスクは単一サイクル単一 PR で完結し、未タスク分離・別タスク起票は不要。
