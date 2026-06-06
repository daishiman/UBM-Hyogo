`[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]`

# Phase 12 — 未タスク検出（unassigned-task-detection）

`current`（本 wave で新規に検出した候補）と `baseline`（過去 wave からの引き継ぎ）を分離して記録する。

## baseline（引き継ぎ）

| 候補 | 出自 | 状態 |
| --- | --- | --- |
| なし | 本タスク自体が親 #1027 の将来候補表から起票されたもの。本タスク着手で baseline は解消済み | N/A |

## current（本 wave 検出: 1 件）

### 検出 1 — serif 見出しフォント（Noto Serif JP）による OG タイトル意匠強化

| 項目 | 値 |
| --- | --- |
| type | `improvement` |
| priority | `low` |
| scale | `small` |
| 検出フェーズ | Phase 1 §1.5 スコープ外 / Phase 3 §3.2 案 D（不採用・将来） |

**内容**: OG タイトルに serif 見出しフォント（Noto Serif JP 等）を採用し、和文ブランド意匠の
階層・格調を強化する候補。

**今回スコープ外とした理由**: 今回は Noto Sans JP の weight / size（`titleFontSize` 適応） /
tracking（`eyebrowTracking`）で階層表現し、font 追加 fetch によるレイテンシ増・OG bundle/fetch 戦略の
複雑化を避けた。serif 追加は font の追加取得（`loadGoogleFont` の weight/family 追加）または bundle 戦略の
別検討が必要で、本タスクの「正本整合 + 視認性 + デグレ防止」とは独立スコープになる。

**CONST_007 例外の根拠**: 独立スコープ（font bundle/fetch 戦略の別検討が必要）であり、本タスクの
1 サイクル（`apps/og` 5 ファイル・意匠整合）に含めると単一責務を逸脱するため分離する。

**実施時期 / 場所**: 必要時に別 Issue として起票（本 wave では Issue 化しない・user-gated）。

## 関連タスク差分確認

| 確認 | 結果 |
| --- | --- |
| 既存 OPEN issue との重複 | なし。OG serif font 追加を扱う既存 OPEN issue は確認されない |
| 親 #1027 / #1084 との重複 | なし。#1084 は OG Worker 分離（実装本体）、本 detection は font 戦略の将来拡張で別関心 |
| 本タスク（#1076）との関係 | 本タスクは Noto Sans JP の範囲で意匠整合を完結。serif は明示的に切り出した将来候補 |

> 本 detection は記録のみ。Issue 起票・採番は user-gated（本 wave では実施しない）。
