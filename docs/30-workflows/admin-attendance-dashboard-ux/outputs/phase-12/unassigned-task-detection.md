# 未タスク検出レポート — admin-attendance-dashboard-ux

workflow_state: `implemented_local_runtime_pending` / 生成日: 2026-06-02

検出件数: **1 件**（AC-9 計算意味論是正。ユーザー指示による明示分離）。

## 検出ソースと結果

| ソース | 確認項目 | 結果 |
| --- | --- | --- |
| 元タスク仕様書 | 「スコープ外」として明示された項目 | 1 件検出: AC-9 計算意味論是正（apps/api）。Phase 1 §スコープ境界 / Phase 3 設計判断で別タスク分離が確定 |
| Phase 3/10 レビュー | MINOR 判定の指摘事項 | 0 件（Phase 3 レビューで MINOR なし明示。Phase 10 MINOR 追跡テーブルも 0 件） |
| Phase 11 手動テスト | スコープ外の発見事項・改善提案 | local focused evidence と local fixture screenshot は `manual-test-result.md` / `outputs/phase-11/screenshots/` に present。staging screenshot は user-gated runtime pending。現時点で新規未タスクなし |
| コードコメント | TODO/FIXME/HACK/XXX | 実コード反映済み。新規 TODO/FIXME/HACK/XXX は導入しない |
| `describe.skip` ブロック | 旧 testid/要素名の残存参照 | コード未変更のため該当なし。`ZONE_LABEL` 更新は Phase 6 で同 wave 更新予定（cleanup 未タスク不要） |

## 検出 1 件: AC-9 計算意味論是正

| 項目 | 内容 |
| --- | --- |
| 検出元 | Phase 1 AC-9 / スコープ境界、Phase 3 設計判断（「区画境界を UI 側で整合させるか → 否、API 別タスクへ分離」） |
| 内容 | `apps/api/src/repository/attendance-analytics.ts` の出席回数帯境界（`0→1 / 1→10 / 10→100`）の妥当性、全体出席率の定義（`attendCount / (totalSessions × totalMembers)`）、延べ vs unique 集計の是正 |
| 分離理由 | 計算意味論（純関数の挙動）を変えるため回帰リスクがあり、ユーザー Q1 の明示指示「両方を別タスクに分離」に従う（CONST_007 例外条件: ユーザー明示の分離指示 + 実施場所明記）。本タスクの UI ラベルは現行境界に忠実に振るため、両タスクは独立して安全に実装できる |
| 配置先 | `docs/30-workflows/admin-attendance-dashboard-ux/unassigned-task-specs/admin-attendance-analytics-calc-correction.md`（実体存在確認済・Issue-ready） |
| スコープ | apps/api（純関数集計ロジック是正）。apps/web は親タスクで完結 |
| ステータス | 仕様書実体化済み・後続 Issue 化候補（未着手） |

### 命名根拠

- ファイル名 `admin-attendance-analytics-calc-correction.md` は、親 task_id `admin-attendance-dashboard-ux` の領域（admin / attendance）を前置し、
  対象モジュール `attendance-analytics.ts` と是正内容（`calc-correction`）を semantic に表現する。
- 配置は親 workflow root 直下の `unassigned-task-specs/` とし、親子の依存関係（親=UI 完結 / 子=API 計算是正）を co-locate で明示する。
  これにより親が `completed-tasks/` へ移動しても子仕様が同梱され、追跡性が壊れない。
- `<category>` 相当は `api-calc-correction`（apps/api の純関数集計ロジック是正）で、`unassigned-task-required-sections.md` の
  「苦戦箇所」「リスクと対策」「検証方法」「スコープ（含む/含まない）」を満たす Issue-ready 構成とする。

## 苦戦箇所【記入必須】

- 検出は 1 件のみだが、これは「0 件にしない」ためのこじつけではなく、Phase 1/Phase 3 で**ユーザー明示指示により分離が確定済み**の
  正規スコープ外項目である。MINOR 由来の任意候補（例: バー色のトークン拡張、playwright 視覚回帰の自動化）は責務が異なるため
  本タスクの未タスクには昇格させず、必要時は別途 formalize する。

## リスクと対策

- リスク: 親（UI）と子（計算是正）の二重実装で `ZONE_LABEL` 文言と境界が乖離する。
- 対策: 親は現行境界に忠実なラベルに留め、子で境界そのものを是正する設計分担を Phase 1/3 で確定済み。子仕様書に親への単方向リンクを記載。

## 検証方法

```bash
# 分離仕様書の実体存在
test -f docs/30-workflows/admin-attendance-dashboard-ux/unassigned-task-specs/admin-attendance-analytics-calc-correction.md && echo OK
```

## スコープ（含む/含まない）

- 含む: AC-9 計算意味論是正タスクの検出記録・配置先・命名根拠。
- 含まない: 子タスクの実装・Issue 採番（後続 user-gated）。
