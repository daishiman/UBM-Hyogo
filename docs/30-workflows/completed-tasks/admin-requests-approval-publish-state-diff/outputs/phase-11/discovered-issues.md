# Phase 11 — スコープ外の発見事項・改善提案

> ステータス: `implemented_local_runtime_pending`。本ファイルはスコープ外の発見・改善提案と visual capture 残件を記録する。ローカル component evidence は取得済みで、staging UI 実描画起因の発見は runtime capture 後に判定する。

---

## 1. 本サイクルで発見したスコープ外事項

**未実装のため discovered issue なし（実装後に記録）。**

ローカル実装・focused tests は完了済み。UI 実描画起因の新規発見は、3 canonical screenshot 取得後に判定・追記する。設計・要件レビュー（Phase 1〜3）時点で識別済みの「スコープ外」項目は下記 §2 に既知事項として再掲する（新規発見ではない）。

## 2. 既知のスコープ外（Phase 1〜3 / _shared-context §6 で識別済み・新規発見ではない）

| # | 内容 | スコープ外の理由 | 扱い |
| --- | --- | --- | --- |
| OOS-1 | 承認時 publish_state 遷移ロジック（`apps/api` `inferDesiredPublishState` / `resolveRequestAtomic`）の変更 | 本タスクは表現層 diff 可視化のみ。承認ロジックは別責務（AC-7 / ui-prototype invariant #1） | 本質的に別責務・先送りではない |
| OOS-2 | 新 endpoint 追加 / D1 schema 変更 / GET `/admin/requests` projection 拡張 | 既存 3 値（`publishState` / `isDeleted` / `desiredState`）で完結。projection 拡張は invariant 違反 | 本質的に別責務・先送りではない |
| OOS-3 | `/admin/requests` 以外の画面・他 diff 表現への波及 | 本タスクは `/admin/requests` 承認導線に閉じる | 本質的に別責務 |

> OOS-1〜OOS-3 はいずれも本タスクの目的（承認時 before→after 可視化）に不要であり、CONST_007 の「先送り」ではなく「本質的に別責務」。未タスク化の判断は Phase 12 で行う（current ではなく baseline 候補）。

## 3. visual capture 残件

| # | 内容 | 状態 |
| --- | --- | --- |
| VIS-1 | `outputs/phase-11/screenshots/` に 3 canonical PNG を保存する | pending（コード実装 + staging admin bearer / user-gated capture が必要） |

## 4. 後続への申し送り

- コード実装 + 実 capture 時に UI 実描画起因の新規発見があれば、本ファイルに追記する。
- 本サイクルでは screenshot を擬似生成せず、PNG 0 件であることを正直に記録する。
