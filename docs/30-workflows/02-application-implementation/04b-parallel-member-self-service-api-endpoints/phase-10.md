# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | member-self-service-api-endpoints |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| Wave | 4 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (手動 smoke) |
| 状態 | pending |

## 目的

GO/NO-GO 判定を出す。依存先 wave (02a / 02c / 03b) の AC が満たされているかを根拠として、Phase 11 以降に進む可否を確定する。NO-GO の場合は blocker を列挙して上流タスクに差し戻す。

## GO/NO-GO 判定

### 判定基準

- すべての AC（AC-1〜AC-8）に verify suite と runbook step が紐付いている (Phase 7)
- すべての failure case (F-1〜F-15) が AC trace 済み (Phase 6)
- 不変条件 #1, #4, #5, #7, #8, #9, #11, #12 がすべて担保 (Phase 7 逆引き)
- 上流 02a / 02c / 03b の AC が満たされている
- Phase 9 の無料枠見積もりが 5% 未満
- Phase 9 の secret hygiene checklist 全 pass
- DRY 化が AC matrix を破壊していない

### Blocker 候補

| # | blocker | 影響 | 対処 |
| --- | --- | --- | --- |
| B-1 | 02a の `loadMemberProfile(memberId)` が未実装 | GET /me/profile 不可 | 02a wave 完了待ち |
| B-2 | 02c の `appendAdminMemberNote(type, ...)` が未実装 | POST visibility/delete 不可 | 02c wave 完了待ち |
| B-3 | 03b の `currentResponseResolver.editResponseUrl` が未実装 | AC-3 未達 | 03b wave 完了待ち |
| B-4 | 05a の Auth.js session helper 未公開 | 全 endpoint 401 を返さざるを得ない | 05a 着手前段階だが、本タスクは consumer 想定 mock を用意 |

### 判定

- 上流 02a / 02c / 03b が green の場合: **GO**
- いずれか NO-GO の場合: 本タスクも NO-GO とし、Phase 11 を保留

## 依存 wave AC チェック

| 依存 task | 必要 AC | 確認方法 |
| --- | --- | --- |
| 02a-parallel-member-identity-status-and-response-repository | repository unit test pass / `loadMemberProfile` / `loadMemberStatus` 提供 | 02a artifacts.json |
| 02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary | adminMemberNotes / auditLog repository 提供 / lint rule pass | 02c artifacts.json |
| 03b-parallel-forms-response-sync-and-current-response-resolver | current_response_id 切替 / editResponseUrl 取得 | 03b artifacts.json |
| 01b-parallel-zod-view-models-and-google-forms-api-client | SessionUser / MemberProfile 型 export | 01b artifacts.json |

## 残存リスク

| # | リスク | 緩和策 |
| --- | --- | --- |
| R-1 | editResponseUrl が forms.responses.list で取得できないケースで fallbackResponderUrl 案内のみとなる | UX レベルで `/profile` 上に案内文を配置（06b 担当） |
| R-2 | rate limit が KV ベース実装の場合 KV 無料枠（1k write/day）を圧迫 | D1 baseline で counter 実装、KV は将来移行 |
| R-3 | session 検証が 05a 確定前に固まるため mock に依存 | mock helper を 05a と本タスクで共有定義 |
| R-4 | 削除済み user の session 取り扱いで 410 vs 401 の選択 | 410 + authGateState=deleted を採用、UI は 410 を `/login` 画面のメッセージにマッピング |

## 実行タスク

- [ ] この Phase の成果物を作成する
- [ ] 参照資料、成果物、完了条件の整合を確認する
- [ ] artifacts.json の対象 Phase 状態更新条件を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | 02a / 02c / 03b の artifacts.json | 依存 AC 確認 |
| 必須 | 本タスクの phase-07.md / phase-09.md | GO/NO-GO 入力 |
| 参考 | doc/02-application-implementation/_design/phase-3-review.md | 設計レビュー |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | GO 判定後に手動 smoke 実施 |
| Phase 12 | GO/NO-GO 結果を documentation-changelog に記録 |
| 09a (Wave 9) | 本タスクの GO は staging deploy の前提 |

## 多角的チェック観点（不変条件マッピング）

- #5: 上流 02c の lint rule が apps/web → D1 直接禁止を担保しているか確認（理由: 境界遵守）
- #11 / #12: 本タスク内で不変条件違反が再現していないか最終確認（理由: 認可・公開境界）

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | GO/NO-GO 判定基準確認 | 10 | pending | main.md |
| 2 | 依存 wave AC チェック | 10 | pending | 02a / 02c / 03b |
| 3 | blocker / 残存リスク列挙 | 10 | pending | 4 件以上 |
| 4 | 判定結果記録 | 10 | pending | GO 想定（依存 green 前提） |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/main.md | Phase 10 主成果物 |
| メタ | artifacts.json | Phase 10 を completed に更新 |

## 完了条件

- [ ] GO/NO-GO 判定が記録
- [ ] blocker と残存リスクが列挙
- [ ] 依存 wave AC チェック表が完成

## タスク100%実行確認【必須】

- 全実行タスク completed
- 全成果物配置済み
- 全完了条件チェック
- artifacts.json の Phase 10 を completed に更新

## 次 Phase

- 次: 11 (手動 smoke)
- 引き継ぎ事項: GO の場合のみ Phase 11 開始、NO-GO の場合は blocker 解消待ち
- ブロック条件: NO-GO のまま Phase 11 を開始しない
