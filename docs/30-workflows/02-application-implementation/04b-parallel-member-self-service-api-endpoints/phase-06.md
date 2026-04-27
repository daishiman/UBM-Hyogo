# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | member-self-service-api-endpoints |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| Wave | 4 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | pending |

## 目的

401 / 403 / 404 / 409 / 422 / 429 / 5xx と sync 失敗 / consent 撤回 / 削除済みアクセスの異常系を網羅し、正常系では出ないが本番で起こりうる経路を test に落とし込む。本人本文編集禁止（不変条件 #4）と他人 memberId 露出禁止（不変条件 #11）が異常系でも壊れないことを確認する。

## Failure cases

| # | シナリオ | 期待挙動 | 関連不変条件 | 検出手段 |
| --- | --- | --- | --- | --- |
| F-1 | session cookie 不在で `/me/*` を叩く | 401 + `{ code: 'UNAUTHENTICATED' }`、本文に memberId を一切含まない | #11 | authz test |
| F-2 | session cookie が改ざん（署名不一致） | 401 + `{ code: 'UNAUTHENTICATED' }` | #11 | unit test (session.ts) |
| F-3 | session 有効だが member_status が deleted=true | 410 + `{ code: 'DELETED', authGateState: 'deleted' }` | #9, #11 | authz test |
| F-4 | session 有効だが rules_consent != consented | 200 + `authGateState: 'rules_declined'`（GET /me）/ 403（POST 系） | #9 | authz test |
| F-5 | GET /me/profile で current_response_id が null（同期未完了） | 200 + `editResponseUrl: null`、`fallbackResponderUrl` を返す | #1, #4 | integration test |
| F-6 | POST visibility-request を 1 セッションで 5 回 + 1 連投 | 6 回目で 429 + `Retry-After` | #11 | rate-limit test |
| F-7 | POST visibility-request を別 session で 2 回 (同 memberId 該当ケース不可だが不正 cookie 流用想定) | 1 回目 202、2 回目 409 (DUPLICATE_PENDING_REQUEST) | #11, #12 | integration test |
| F-8 | POST visibility-request の body が zod parse 失敗 | 422 + `{ code: 'INVALID_REQUEST', issues }` | - | unit test |
| F-9 | POST delete-request 後すぐに GET /me/profile | 200（status は反映前、queue は pending）、profile は変更なし | #4 | integration test |
| F-10 | admin_member_notes insert で D1 一意制約違反 | 500 ではなく 409 にラップ | #12 | unit test (self-request-queue.ts) |
| F-11 | edit-response-url サービス内で 03b の helper が throw | フォールバックして null を返し、warning ログだけ残す | #1 | unit test |
| F-12 | path に意図せず memberId をマウントする lint 違反 | tsc / eslint で検出 | #11 | type test + lint rule |
| F-13 | GET /me/profile レスポンスに `notes` キーが含まれる（リグレッション） | contract test fail | #12 | contract test |
| F-14 | POST visibility-request の reason が 500 文字超 | 422 | - | unit test |
| F-15 | session 検証中に Auth.js 側が 5xx | 502 (Bad Gateway) ではなく 503 (Service Unavailable) を返す | - | integration test |

## consent 撤回時の動線

- consent 撤回（rulesConsent=declined に更新された response が同期）→ 即時 GET /me が `authGateState: 'rules_declined'` に切り替わる
- POST 系は 403 + `{ code: 'RULES_NOT_ACCEPTED' }`
- session は revoke せず、UI で再回答 CTA を提示するに留める（`/login` 強制リダイレクトしない）

## 削除済みアクセス時

- isDeleted=true への遷移後の最初のリクエストで 410 + `authGateState: 'deleted'`
- session は revoke
- 06b 側で deleted 表示パターンに切り替え

## 実行タスク

- [ ] この Phase の成果物を作成する
- [ ] 参照資料、成果物、完了条件の整合を確認する
- [ ] artifacts.json の対象 Phase 状態更新条件を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/06-member-auth.md | 認可境界 |
| 必須 | doc/00-getting-started-manual/specs/07-edit-delete.md | request API |
| 必須 | doc/00-getting-started-manual/specs/13-mvp-auth.md | MVP 認証 |
| 参考 | doc/00-getting-started-manual/specs/02-auth.md | session 設計 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | F-1〜F-15 を AC matrix に紐付け |
| Phase 8 | 共通エラーハンドラを DRY 化 |
| 08a | 本タスクの failure case を contract / authz test として取り込み |

## 多角的チェック観点（不変条件マッピング）

- #1: 同期未完了時に schema を硬直化させず null fallback（F-5, F-11）
- #4: F-9 で profile 本文が変更されないことを確認
- #9: F-3, F-4 が `/no-access` リダイレクトに頼らない
- #11: F-1, F-2, F-12 で他人 memberId 露出パスを潰す
- #12: F-13 で notes leak リグレッション検出

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | F-1〜F-15 列挙 | 6 | pending | outputs/phase-06/failure-cases.md |
| 2 | consent 撤回挙動定義 | 6 | pending | main.md |
| 3 | 削除済みアクセス挙動定義 | 6 | pending | main.md |
| 4 | test 化方針 | 6 | pending | Phase 7 へ引き継ぎ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | Phase 6 主成果物 |
| ドキュメント | outputs/phase-06/failure-cases.md | F-1〜F-15 詳細 |
| メタ | artifacts.json | Phase 6 を completed に更新 |

## 完了条件

- [ ] failure case 15 件以上を列挙
- [ ] 各 case に期待挙動 / 関連不変条件 / 検出手段を記述
- [ ] consent 撤回 / 削除済みアクセスの動線が明文化

## タスク100%実行確認【必須】

- 全実行タスク completed
- 全成果物配置済み
- 全完了条件チェック
- artifacts.json の Phase 6 を completed に更新

## 次 Phase

- 次: 7 (AC マトリクス)
- 引き継ぎ事項: F-X を AC × 不変条件 × verify suite に展開
- ブロック条件: 401 / 403 / 404 / 409 / 422 / 429 / 5xx の少なくとも 1 つが未網羅なら次 Phase に進まない
