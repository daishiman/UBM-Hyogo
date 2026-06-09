> **[実装区分: 実装仕様書]** NON_VISUAL

# Phase 12 — skill feedback レポート

`[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]`

本 wave で task-specification-creator / skill-creator / aiworkflow-requirements 等の skill template / reference へ
反映すべき学びがあるかを判定する。改善点が無くても出力は必須。

## 判定サマリ

| 観点 | 結果 |
| --- | --- |
| skill template 改善候補 | **0 件** |
| reference 追記候補 | **0 件** |
| 新規 lessons-learned 昇格候補 | **0 件** |

## 本 wave の学び（記録）

skill 本体への新規ルール追加は不要だが、本タスク固有の判断として以下を記録する（いずれも既存 skill の原則の範囲内）。

| # | 学び | 既存原則との対応 |
| - | ---- | ---------------- |
| 1 | **CLOSED issue の現行コード最適化フロー**: issue #1145 は CLOSED だが、ユーザー依頼で「現行コードで解決済みか」を grep 調査し、**未解決**を確認。さらに issue body の scope が現行コードに対して古いことを確認し、現行コードへ最適化して仕様書を作成した。CLOSED のまま implemented_local_evidence_captured で進め、再 OPEN は user-gated とした。 | task-specification-creator の調査フロー（CONST_004 デフォルト判定 + 現行コード裏取り）の範囲内。skill 変更不要。 |
| 2 | **apps/og 編入の scope 拡大判断**: 元 unassigned spec / issue body は `apps/web` 限定だったが、grep で `apps/og`（#1084 で後から追加された OG 画像生成 Worker）が旧キーをライブ消費していることを検出。ユーザー承認のうえ scope を `apps/` 全体へ拡大し、grep gate を repo 全体スコープに引き上げた（D-1）。 | scope は grep の実測で確定する（envidence-based scoping）。既存原則の範囲内。skill 変更不要。 |
| 3 | **削除でなく rename の使い分け**: apps/web は `NEXT_PUBLIC_` 対応キーを持つため旧キーを**削除**、apps/og は単一キー運用のため削除すると base URL 解決経路が消えるので**rename**（D-2）。同一の「単一化」目的でも層によって削除 / rename を使い分けた。 | 挙動不変（D-5）の原則の範囲内。skill 変更不要。 |

これらは既存 skill（SRP / evidence-based scoping / 挙動不変リファクタリング）の原則内で完結しており、skill template や
reference へ新規ルールとして追加する必要はない。

## skill-creator / task-specification-creator template 変更要否

| skill | 変更要否 |
| --- | --- |
| `task-specification-creator` | 不要 |
| `skill-creator` | 不要 |
| `aiworkflow-requirements` | 不要（Step 2 N/A） |

## 結論

skill-feedback 候補 **0 件**。本 wave の学び（CLOSED issue の現行コード最適化フロー / apps/og 編入の scope 拡大判断 /
削除と rename の使い分け）はいずれも既存 skill の原則内で説明可能であり、skill template / reference / lessons-learned への
反映は不要。
