**[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]**

# Phase 12 / Task 12-4: 未タスク検出レポート

`[実装区分: 実装仕様書]` / `workflow_state: implemented_local_evidence_captured`

> 0 件でも出力必須。検出ソースを網羅し、候補は理由付きで記録する。current（本サイクル新規）と baseline（既存スコープ）を分離する。

---

## 検出ソース一覧

| ソース | 確認内容 | 結果 |
| --- | --- | --- |
| 元タスク仕様書「スコープ外」 | Phase 1 で明示的にスコープ外宣言した項目 | 候補 1 件（fade animation・別 Issue 分離済み） |
| Phase 3 / Phase 10 レビュー MINOR | MINOR 判定の指摘事項 | 新規 HIGH なし |
| Phase 11 手動テスト発見 | スコープ外の発見・改善提案 | HIGH なし（focused Vitest / Playwright / screenshot 取得済み） |
| コードコメント（TODO / FIXME / HACK / XXX） | 対象 3 ファイルの新規残存コメント | spec 段階のため新規コードなし → 0 |
| `describe.skip` ブロック | 削除 testid / 要素名の旧参照残存 | spec 段階のため新規なし → 0 |

---

## current（本サイクル新規検出）

本サイクルで新規に検出した未割当タスク候補は **0 件**。

dismiss optimistic 化の達成に必要な作業（state 追加 / `onDismiss` 差し替え / render guard 統合 / focused vitest / Playwright）はすべて本ワークフローの本 wave（03.実装.md・1 サイクル）に含まれており、外部に切り出す未割当タスクは生じない。

---

## baseline（既存スコープ外・分離済み）

### 候補 1: row 消失時の fade animation

| 項目 | 内容 |
| --- | --- |
| 検出ソース | 元タスク仕様書「スコープ外」（Issue #1042 本文で明記） |
| 内容 | optimistic hide を即時 `return null` ではなく短い fade animation 付きで見せる UX 改善 |
| スコープ外の理由 | Issue #1042 の受け入れ基準は「操作直後に row が一覧から消える」ことで、animation は追加価値だが必須ではない。今回入れると visual baseline と a11y motion preference の追加検証が必要になり、最小実装を超える |
| 状態 | **別 Issue へ分離済み**（`admin-identity-conflicts-followup-005-row-fade-animation`）。本サイクルで formalize 不要 |
| 実施時期 | 別 Issue followup-005 のレーンで user-gated 進行 |
| 担当タスク ID | followup-005（既採番・分離済み） |

> fade animation は構造的に別件として既に分離されているため、本サイクルでの新規起票（formalize）は不要。current 検出 0 件 / baseline 1 件（分離済み）。

---

## 関連タスク差分確認（FB-CANCEL-004-2）

既存 `admin-identity-conflicts-followup-*` 系・merge 系との重複チェック。

| 既存タスク / Issue | 重複の有無 | 判定 |
| --- | --- | --- |
| Issue #988 / PR #1046（merge optimistic） | 重複なし（merge 側のみ実装済み、dismiss 側は本 #1042 が担当） | mirror 元。新規起票不要 |
| `admin-identity-conflicts-followup-005-row-fade-animation` | 重複なし（animation 領域、dismiss optimistic とは別関心） | 別 Issue 継続。起票不要 |
| `#987` audit log medium（identity-conflicts 系） | 重複なし（監査ログ領域） | 別タスク継続 |

---

## 結論

- **本サイクルで formalize する未タスク: 0 件**（current 0 件 / baseline 1 件は fade animation で別 Issue followup-005 へ分離済み）。
- dismiss optimistic 化の実装作業はすべて本ワークフロー本 wave に内包され、外部切り出しは不要。
- 既存 followup 系・merge 系との重複起票なし。
