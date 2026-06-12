# Unassigned task detection

**[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]**

本サイクル内で完了させず、follow-up unassigned-task として後段に切り出すべき項目の確認結果（CONST_007 遵守）。**current（今回サイクル内の残課題）と baseline（スコープ外）を分離して記録する。**

## 結論

- **current（今回サイクルの完了条件内の残課題）= 0 件。**
- baseline（本タスクの完了条件外で independent scope を持つ候補）= OOS-1〜OOS-4 の 4 件（すべて本サイクル外）。

本サイクルの完了条件は「`/admin/meetings` のカード分離 / 展開階層 / 出席者行の 3 課題を apps/web 表現層で解消」であり、F1-F3 + T1/T2 で網羅される。スコープを満たすために本サイクルで追加すべき残課題はない。

## current（今回サイクル内）— 0 件

| ID | 内容 | 採否 |
|----|------|------|
| — | （なし） | current 残課題 0 件 |

検出方法:

- 本サイクルの diff 対象は F1（globals.css）/ F2（MeetingAttendanceDrawer）/ F3（MeetingTimeline）/ T1/T2 のみ。3 課題（カード分離・展開階層・出席者行）はすべてこの範囲で完了する。
- `TODO` / `FIXME` / `it.skip` / `describe.skip` 残留 grep は local evidence 対象。今回の実コード差分には新規残留なし。
- 「分量が多い」「念のため」での先送りはなし。

## baseline（スコープ外・independent scope）— OOS-1〜OOS-4 / OOS-5 解消

| ID | 内容 | 採否 | 根拠（CONST_007 例外条件 / 独立スコープ理由） |
|----|------|------|----------------------------------------------|
| OOS-1 | 他 admin 一覧（members / tags / audit / schema / requests / identity）への共通 primitive（`.admin-detail-section*` / `.admin-attendee-row*`）DOM 適用 | **未採用（本サイクル外・別タスク）** | 各画面で DOM / テストが異なり 1 PR では CONST_007（1 サイクル完了スコープ）抵触。本 PR で primitive を新設し、適用は同 primitive を使う follow-up タスクに分離 |
| OOS-2 | 開催日カードの色設計見直し（コントラスト / 階調） | **未採用（本サイクル外）** | ユーザーが今回「色は置いておく」と明示（shared-context §3）。色トークン調整は independent scope |
| OOS-3 | 右スライドドロワー化（一覧と編集の完全分離） | **未採用（本サイクル外）** | 今回「インライン展開維持」を選択（shared-context §3）。UX 構造変更は将来 UX 検討の independent scope |
| OOS-4 | 出席者のチップ / タグ集約表示 | **未採用（本サイクル外）** | 今回「行リスト」を選択（shared-context §3）。表示方式変更は将来 UX 検討の independent scope |
| OOS-5 | 既存 globals.css が参照する `--ubm-color-border-subtle` が tokens.css に未定義 | **解消済** | 新規 token 追加は 09b drift のため不採用。既存参照を `--ubm-color-border-default` へ収束し `verify:tokens` PASS |

## CONST_007 例外条件適合性

- OOS-1: 各画面で DOM / テストが異なり 1 サイクル完了不可（multi-screen 適用は independent PR 要請）。
- OOS-2: ユーザー明示で今回スコープ外（色トークン調整は independent scope）。
- OOS-3: UX 構造変更（インライン → 右ドロワー）は機能要件の設計変更を伴う independent scope。
- OOS-4: 表示方式変更（行 → チップ）は UX 設計変更で independent scope。

## 関連タスク差分確認

- OPEN Issue 重複確認は外部 GitHub 参照のため未実行。本 workflow と同一スコープの新規未タスクは作成しない。
- 既存完了タスク `admin-meeting-bulk-attendance-select`（開催日ドロワーの出席追加を複数会員一括追加へ是正・commit 38f114081）は **本タスクと別レイヤ**（あちらは UI 操作フロー／こちらは視覚情報設計の CSS 実体化）であり重複しない。出席追加 UI（`attendance-select-*` / `add-attendance-*`）の data-testid は維持し contract を破壊しない。
- `admin-members-mobile-responsive-layout`（members 一覧のカード化 spec）は OOS-1 と方向性が近いが対象 route（members）が異なり、本タスクが新設する primitive を members へ適用するのは OOS-1 の follow-up。

## ユーザーへのエスカレーション（CONST_007 後段要件）

- OOS-1: primitive 確立後、members / tags 等への適用を follow-up タスクとして起票候補（実装 wave で primitive landed 後にユーザー判断）。
- OOS-2 / OOS-3 / OOS-4: バックログ任意タイミング（ユーザー明示の今回スコープ外）。

## 検出方法（CONST_007 detection report）

- 本サイクル diff 範囲（F1-F3 + T1/T2）が 3 課題を網羅することを Phase 3 AC 表で確認。
- TODO / FIXME / `it.skip` / `describe.skip` 残留 grep は実装 wave の Phase 11 evidence で取得（0 件期待・pending）。
- OPEN Issue 重複確認は実装 wave で 1 回実施。
