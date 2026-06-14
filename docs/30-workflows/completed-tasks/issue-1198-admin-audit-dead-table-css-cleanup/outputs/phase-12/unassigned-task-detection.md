# Unassigned Task Detection — issue-1198

- 区分: 実装仕様書（NON_VISUAL / **implemented_local_evidence_captured**）
- 判定: **current（今回スコープ内の残課題）= 0 件** / **baseline（スコープ外の将来候補）= 2 件（OOS-1 / OOS-2・別 Issue 候補）**

---

## current / baseline 分離

| 区分 | 内容 | 件数 |
| --- | --- | --- |
| current（本タスク完了で残るスコープ内の残課題） | なし。dead CSS 3 ブロック削除は単一ファイル単一サイクルで完結し、スコープ内に残件はない | **0 件** |
| baseline（スコープ外の将来候補・別 Issue） | OOS-1（監査ログ total 件数表示）/ OOS-2（監査ログ CSV/JSON エクスポート） | **2 件** |

### baseline 詳細（別 Issue 候補・本サイクル外）

| ID | 概要 | スコープ外理由 | 起票方針 |
| --- | --- | --- | --- |
| OOS-1 | 監査ログ total 件数表示 | API が cursor pagination で total を返さない → **apps/api 変更が必要**。本タスクは apps/web 表現層 CSS 削除に限定（既存 API surface 不変） | 別 Issue（API 変更・user-gated 起票） |
| OOS-2 | 監査ログ CSV/JSON エクスポート | **新規 endpoint** または client 大規模機能が必要。本タスクのスコープ（CSS 削除）と独立 | 別 Issue（新規 endpoint・user-gated 起票） |

> OOS-1 / OOS-2 は親 workflow `admin-audit-log-ux-clarity-and-reduce-error-fix` が確定した独立 Issue 候補であり、API 変更・新規 endpoint を要する。今サイクル（CSS 削除）で完了させると技術的に破綻するため別 Issue へ分離する（CONST_007 例外条件 1・実施場所を明記済み）。

## 関連タスク差分確認（重複起票防止 / FB-CANCEL-004-2）

既存タスク・親 workflow との重複チェック:

| 関連タスク | 概要 | 本タスクとの重複 |
| --- | --- | --- |
| `docs/30-workflows/unassigned-task/task-admin-audit-dead-table-css-cleanup.md` | 旧テーブル系 dead CSS 削除（= 本タスク） | **consumed**（本 canonical workflow root が昇格・新規起票不要） |
| `docs/30-workflows/completed-tasks/admin-audit-log-ux-clarity-and-reduce-error-fix/` | 親 workflow（#1202 カード化・Phase 8 OOS-4 で本 dead CSS を検出） | 重複なし（本タスクは後続クリーンアップ・関心が独立） |
| OOS-1（total 件数表示）/ OOS-2（エクスポート） | 親 workflow が確定した独立 Issue 候補 | 重複なし（API 変更・新規 endpoint で本 CSS 削除と独立） |

→ 重複起票の懸念なし。OOS-1 / OOS-2 は既存の別関心であり、本タスクが新規に起票するものではない（baseline として記録のみ）。

## 検出ソース表

| 検出ソース | 検出結果 | 未タスク化 |
| --- | --- | --- |
| 元タスク仕様書スコープ外項目 | dead CSS 3 ブロック削除に限定。スコープ内残件なし（OOS-1/OOS-2 は baseline・別 Issue） | current 0 件 / baseline 2 件 |
| Phase 3 R3-1 / R3-2（MINOR 指摘） | 行番号 stale（セレクタ名アンカーへ訂正済み）/ Playwright スクショ名誤認（shared-context §2 で明記済み）→ 本仕様書内で解消済み | 0 件 |
| Phase 10 §改善候補 | OOS-1 / OOS-2 を baseline（別 Issue）として分離記録 | current 0 件（baseline へ計上） |
| コードコメント TODO | 削除対象 CSS ブロックに TODO / FIXME なし | 0 件 |
| `describe.skip` / テスト skip | 該当なし（テスト変更なし） | 0 件 |

## 判定根拠（current 0 件）

1. **本タスクは単一ファイル（`globals.css`）の 3 ブロック削除に閉じる単一サイクルタスク**。分割・先送りは不要で、スコープ内に残課題はない（CONST_007 充足）。
2. **source unassigned-task は本 workflow が consume 済み** → 再起票しない。
3. **OOS-1 / OOS-2 は API 変更・新規 endpoint を要し本タスクと独立** → baseline（スコープ外の将来候補・別 Issue）として分離記録。今サイクルに含めると技術破綻するため current には計上しない。
4. コードコメント TODO / テスト skip 由来の検出は 0 件。

→ **current 新規未タスク 0 件 / baseline 2 件（OOS-1 / OOS-2・別 Issue 候補・起票は user-gated）**。current でスコープ内の新規 Issue / spec は作成しない。
