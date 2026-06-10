# 未タスク検出レポート — admin-meeting-bulk-attendance-select

workflow_state: `implemented_local_evidence_captured` / 生成日: 2026-06-09

current 検出件数: **0 件**（起票必須の未タスクなし）。
baseline 記録: **2 件**（M-1 CSV アップロード UI / M-2 attendance route 二系統統合・CONST_007 例外候補・起票見送り）。

## current / baseline 分離

| 区分 | 定義 | 本タスクでの件数 |
| --- | --- | --- |
| current | 本タスクのスコープ達成のために起票が必須な未完了タスク | 0 件 |
| baseline | 設計上認識済みだが本サイクル非対象・将来の別タスク候補（起票は見送り） | 2 件（M-1 / M-2） |

## SF-03 設計タスク 4 パターン照合

| パターン | 候補の例 | 本タスクでの該当 |
| --- | --- | --- |
| 型定義 → 実装 | 型を定義したがランタイム実装が未完了 | 該当なし。本タスクは型 + 実装手順を同一仕様に含む。実装は後続 wave だが派生未タスクではない |
| 契約 → テスト | インターフェースを設計したが統合テスト未作成 | 該当なし。focused test（T1..T7）を Phase 4/6 で同一仕様に設計済み |
| UI 仕様 → コンポーネント | React コンポーネント実装済み | 該当なし。コンポーネントは本 wave で実装済み |
| 仕様書間差異 → 設計決定 | 複数仕様書で矛盾が残り決定できていない | 該当なし。`onBulkAddAttendance` の戻り値型は Phase 2 §2.3 で `Promise<boolean>`（committed）に確定済み |

> 結論: SF-03 4 パターンいずれも current 未タスク化対象なし。本タスクは設計 + 実装手順 + テスト計画を 1 仕様に
> 内包する実装仕様書であり、実装コードは派生未タスクではなく同一タスクの後続 wave である。

## 検出ソースと結果

| ソース | 確認項目 | 結果 |
| --- | --- | --- |
| 元タスク仕様書 | 「スコープ外」として明示された項目 | M-1 / M-2 を baseline 記録（Phase 3 §4 MINOR）。current 必須なし |
| Phase 3/10 レビュー | MINOR 判定の指摘事項 | M-1 / M-2 の 2 件（いずれも baseline・CONST_007 例外候補） |
| Phase 11 手動テスト | スコープ外の発見事項・改善提案 | local fixture screenshot 7 枚取得済み。staging baseline は user-gated runtime pending。新規未タスクなし |
| コードコメント | TODO/FIXME/HACK/XXX | コード実装済みのため該当なし。実装時に新規 TODO/FIXME を導入しない |
| `describe.skip` ブロック | 旧 testid/要素名の残存参照 | コード未変更のため該当なし |

## baseline 2 件の詳細

### M-1: CSV ファイルアップロード一括取込 UI

| 項目 | 内容 |
| --- | --- |
| 検出元 | Phase 3 設計レビュー §4 MINOR M-1 |
| 内容 | import endpoint は `{rows:[{email?}]}` の email 行 / `dryRun` preview も受け付ける。CSV アップロード → dryRun preview → commit の UX は本タスクの memberId チェックリストとは別の入力経路 |
| 非対象理由 | 本タスクは「ドロワー内で会員を選んで一括追加」という最小是正に集中。CSV は別 UX で責務が異なる |
| 扱い | baseline（将来の別 UX 候補）。current 起票見送り |

### M-2: attendance route 二系統の統合

| 項目 | 内容 |
| --- | --- |
| 検出元 | Phase 3 設計レビュー §4 MINOR M-2 |
| 内容 | 単発追加（plural toggle `POST /attendances`）と一括取込（`POST /attendance/import`）の 2 系統を API リファクタで統合 |
| 非対象理由 | `apps/api` スコープであり、本タスクの不変条件 AC-12（apps/api 非変更）に抵触する。API リファクタの別タスク |
| 扱い | baseline（apps/api スコープの別タスク候補）。current 起票見送り |

## 関連タスク差分確認

| 確認観点 | 結果 |
| --- | --- |
| 既存 open Issue との重複 | relatedIssue=null（staging 観察起点）。本タスクに対応する既存 open Issue なし |
| depends_on | `[]`（依存タスクなし）。再利用する import endpoint は既存・mount 済みで追加依存なし |
| 削除/移動による dangling 参照 | 本 wave は新規ファイル作成のみ。workflow root の削除・移動なし。stale 参照の発生なし |
| 既存 remediation task 参照 | baseline M-1 / M-2 は remediation ではなく将来 UX / API リファクタ候補。既存 remediation task への紐付けなし |

## 苦戦箇所【記入必須】

- current 0 件は「こじつけで 0 にした」ものではなく、本タスクが設計 + 実装手順 + テスト計画を 1 仕様に内包する
  実装仕様書であるため、実装は派生未タスクではなく同一タスクの後続 wave となることに起因する。
- baseline M-1 / M-2 は Phase 3 で MINOR として明示記録済みであり、CONST_007（1 サイクル完結）の例外候補として
  起票を見送る。必要時は別途 formalize する。

## リスクと対策

- リスク: baseline M-2（route 統合）を将来実装する際、本タスクの `importAttendance` 呼び出しが影響を受ける。
- 対策: 本タスクは web client `importAttendance` を 1 箇所（Shell `onBulkAdd`）に集約しており、API 統合時の
  変更点が局所化される。

## 検証方法

```bash
# current 起票必須未タスクが 0 件であること（本レポートの記述で確認）
# baseline M-1 / M-2 は Phase 3 §4 に MINOR として記録済み
grep -n "M-1\|M-2" docs/30-workflows/completed-tasks/admin-meeting-bulk-attendance-select/phase-3-design-review.md
```

## スコープ（含む/含まない）

- 含む: current 0 件の根拠、baseline M-1 / M-2 の記録、SF-03 4 パターン照合、関連タスク差分確認。
- 含まない: M-1 / M-2 の実装・Issue 採番（後続 user-gated・起票見送り）。
