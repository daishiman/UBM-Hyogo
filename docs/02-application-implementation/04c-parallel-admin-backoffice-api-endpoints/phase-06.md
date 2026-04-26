# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-backoffice-api-endpoints |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| Wave | 4 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | pending |

## 目的

401 / 403 / 404 / 409 / 422 / 5xx と sync 失敗 / consent 撤回 / 削除済みアクセス / schema drift の異常系を網羅し、test に落とし込む。本人本文編集禁止（#11）、admin_member_notes leak ゼロ（#12）、tag queue 経由（#13）、schema 集約（#14）、attendance 制約（#15）が異常系でも壊れないことを確認する。

## Failure cases

| # | シナリオ | 期待挙動 | 関連不変条件 | 検出手段 |
| --- | --- | --- | --- | --- |
| F-1 | 公開 user が `/admin/dashboard` を叩く | 401 + `UNAUTHENTICATED`、memberId 露出ゼロ | #11 | authz test |
| F-2 | 一般会員（admin_users 不在）が `/admin/members` | 403 + `NOT_ADMIN` | #11 | authz test |
| F-3 | 削除済み admin が `/admin/dashboard` | 403 | - | authz test |
| F-4 | PATCH /admin/members/:memberId/profile を試行 | 404 (route 不在) | #11 | authz test |
| F-5 | PATCH /admin/members/:memberId/tags を試行 | 404 | #13 | authz test |
| F-6 | PATCH /admin/sync/aliases を試行 | 404 | #14 | authz test |
| F-7 | PATCH status の body に `isDeleted: true` を含める | 422（zod で禁止） | - | unit test |
| F-8 | POST notes の visibility に `'public'` を渡す | 422 | #12 | unit test |
| F-9 | POST attendance を同 (sessionId, memberId) で 2 回 | 1 回目 201、2 回目 409 (DUPLICATE_ATTENDANCE) | #15 | integration test |
| F-10 | POST attendance を削除済み会員に対して | 422 (DELETED_MEMBER) | #15 | integration test |
| F-11 | DELETE attendance で sessionId or memberId 不在 | 404 | - | unit test |
| F-12 | POST /admin/sync/schema を 2 回連投 | 1 回目 202、2 回目 409 (SYNC_ALREADY_RUNNING) | - | integration test |
| F-13 | POST /admin/sync/responses 中に sync_jobs が timeout 5 分超 | sync_jobs.status を `failed` に更新、再 trigger 可能 | - | integration test |
| F-14 | 03a の forms.get が 5xx を返す | sync_jobs.status を `failed`、audit_log に記録 | - | integration test |
| F-15 | 03b の current_response 切替中に GET /admin/members/:memberId | snapshot consistency（古い current でも整合） | - | integration test |
| F-16 | GET /admin/members の response に `notes` プロパティが含まれる（リグレッション） | contract test fail | #12 | contract test |
| F-17 | POST tags resolve で存在しない tagCode | 422 | - | unit test |
| F-18 | POST schema/aliases で stableKey 重複 | 409 (ALIAS_CONFLICT) | #1 | integration test |
| F-19 | GET /admin/members の page=999 で out of range | 200 + 空配列、メタは正しい | - | unit test |
| F-20 | POST /admin/members/:memberId/delete を 2 回 | 1 回目 200、2 回目 409 (ALREADY_DELETED) | - | unit test |

## consent 撤回時

- 管理者が `/admin/members/:memberId` を見ると status.rulesConsent=declined が反映
- 公開停止条件は変わらず（publish_state を別管理）

## 削除済みアクセス時

- 削除済み会員の attendance 付与は 422
- dashboard の totalMembers から除外
- POST /admin/members/:memberId/delete は 1 回目のみ成功

## schema drift 時

- forms.get の response が想定と異なる → 03a が schema_diff_queue に記録 → admin が `/admin/schema/diff` で確認 → `POST /admin/schema/aliases` で alias 割当

## 実行タスク

- [ ] この Phase の成果物を作成する
- [ ] 参照資料、成果物、完了条件の整合を確認する
- [ ] artifacts.json の対象 Phase 状態更新条件を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/11-admin-management.md | 認可境界 |
| 必須 | doc/00-getting-started-manual/specs/15-infrastructure-runbook.md | sync 障害対応 |
| 参考 | doc/00-getting-started-manual/specs/02-auth.md | session |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | F-1〜F-20 を AC matrix に紐付け |
| Phase 8 | 共通エラーハンドラを DRY 化 |
| 08a | 本タスクの failure case を contract / authz test として取り込み |

## 多角的チェック観点（不変条件マッピング）

- #4 / #11: F-4 で本文 PATCH endpoint 不在を 404 で確認
- #12: F-8, F-16 で notes leak を防ぐ
- #13: F-5 で tag PATCH が 404
- #14: F-6, F-18 で schema 集約 + alias 重複防止
- #15: F-9, F-10 で attendance 制約

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | F-1〜F-20 列挙 | 6 | pending | outputs/phase-06/failure-cases.md |
| 2 | consent 撤回挙動定義 | 6 | pending | main.md |
| 3 | 削除済みアクセス挙動定義 | 6 | pending | main.md |
| 4 | schema drift 挙動定義 | 6 | pending | main.md |
| 5 | test 化方針 | 6 | pending | Phase 7 へ引き継ぎ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | Phase 6 主成果物 |
| ドキュメント | outputs/phase-06/failure-cases.md | F-1〜F-20 詳細 |
| メタ | artifacts.json | Phase 6 を completed に更新 |

## 完了条件

- [ ] failure case 20 件以上を列挙
- [ ] 各 case に期待挙動 / 関連不変条件 / 検出手段を記述
- [ ] consent 撤回 / 削除済み / schema drift の動線が明文化

## タスク100%実行確認【必須】

- 全実行タスク completed
- 全成果物配置済み
- 全完了条件チェック
- artifacts.json の Phase 6 を completed に更新

## 次 Phase

- 次: 7 (AC マトリクス)
- 引き継ぎ事項: F-X を AC × 不変条件 × verify suite に展開
- ブロック条件: 401 / 403 / 404 / 409 / 422 / 5xx の少なくとも 1 つが未網羅なら次 Phase に進まない
