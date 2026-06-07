# Phase 12 — 未タスク検出

`[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]`

本ファイルは未タスク検出結果を記録する。0 件でも出力は必須。current（本 wave で新たに検出したもの）と
baseline（元タスク時点で既知の構造的境界）を分離して記録する。**新規 GitHub Issue は起票しない。**

## 検出サマリ

| 区分 | 件数 | 判定 |
| --- | --- | --- |
| current（本 wave で新規検出） | **0 件** | 起票なし |
| baseline（元タスク時点の既知境界） | 2 件 | いずれも意図的スコープ外・親 #1112 で enhancement 分離済み・**起票しない** |

## current（本 wave で新規検出した未タスク）

**0 件。**

根拠:

- 閾値（`ATTENDANCE_LEVEL_THRESHOLDS.high = 10`）は起点デフォルトとして Phase 2 で確定済みであり、単一 tuning point に
  集約されているため、設計上の未決事項として残る「閾値をどう決めるか」は本 wave 内で完結している（恣意性の排除済み）。
- 強調は **色のみの静的強調** で完結する（animation を含まない）。`prefers-reduced-motion` 対応や transition 設計
  などの派生課題は構造的に発生しない（AC-6）。
- 実装は admin feature 内部に閉じ、公開 API / D1 / Google Form / 認証境界に波及しない。横断的な未解決依存も生じない。
- Phase 4-11 の spec に TODO / skip / 保留事項は無い。仕様レベルでの未決事項が存在しないため、current 未タスクは 0 件。

## baseline（元タスク時点で既知の構造的境界 — 起票しない）

| ID | 内容 | 扱い |
| --- | --- | --- |
| B-1 | バッジの色変化に animation / transition 演出を加える | 本タスクで**意図的スコープ外**（Phase 1.3「含まない」）。静的色強調で AC を充足するため、演出は別 enhancement。親 #1112 で既に enhancement として分離済み。**起票しない**。 |
| B-2 | `/admin/meetings` 以外の他バッジ・他画面への色強調波及 | 本タスクで**意図的スコープ外**（`.admin-timeline__heading` scope に閉じ共有 `.ui-badge` へ波及させない設計）。横展開は別タスク領域。**起票しない**。 |

baseline 2 件はいずれも「元タスクのスコープ外として最初から切り出された境界」であり、本タスクの未達・取りこぼし
ではない。新規未タスク化の対象ではない。

## 関連タスク差分確認（重複起票防止）

- 親 workflow `admin-meetings-attendance-404-fix-and-ux` Phase 10 §10.6 MINOR 指摘（人数バッジの色強調）は、
  本 #1112 として既に enhancement 分離・本ワークフローで仕様化済み。**同一主題の重複起票はしない**。
- B-1（animation）/ B-2（他画面波及）は親 #1112 の enhancement 文脈で既に認識されており、別 Issue として
  新規起票すると重複になる。**起票しない**。
- 本 wave で `apps/api` / D1 / Google Form / 認証境界への変更は無く、それらに紐づく派生未タスクも無い。

## 結論

current 未タスク **0 件**。baseline 2 件はいずれも意図的スコープ外かつ親 #1112 で分離済みのため起票しない。
本ファイルでの **新規 GitHub Issue 起票は行わない**。
