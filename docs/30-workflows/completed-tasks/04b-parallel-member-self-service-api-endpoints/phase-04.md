# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | member-self-service-api-endpoints |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| Wave | 4 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | pending |

## 目的

採用案 A（Phase 2/3）に対する unit / contract / authorization / integration テストを 08a へ引き渡す前に、本タスク内で verify suite として設計する。本人本文編集禁止（不変条件 #4）と他人 memberId 露出禁止（不変条件 #11）が test で必ず担保されることを保証する。

## Verify suite 設計

### Unit test (apps/api/src/**/*.test.ts)

| 対象 module | テスト内容 |
| --- | --- |
| middleware/session.ts | session cookie あり / なし / 期限切れ で 401 / 200 を分岐 |
| middleware/self-member-only.ts | path に :memberId が現れる route を呼ぶと開発時 type error / 実行時 500 |
| middleware/rate-limit-self-request.ts | 5 req 超で 429、TTL 経過で復活 |
| services/edit-response-url.ts | editResponseUrl 取得可 / 不可（null + fallbackResponderUrl を返す） |
| services/self-request-queue.ts | hasPending=true なら 409、false なら admin_member_notes に insert |
| schemas/me.ts | request body の zod parse / response の zod safeParse |

### Contract test (apps/api/test/contract/me/*.test.ts)

| endpoint | 検証 |
| --- | --- |
| GET /me | response が `GetMeResponse` zod schema に一致、401/200 |
| GET /me/profile | response が `GetMeProfileResponse` zod schema に一致、`editResponseUrl` が null 可、`statusSummary.isDeleted` が常に false |
| POST /me/visibility-request | request body の zod parse、202 / 409 / 422 |
| POST /me/delete-request | 同上 |

### Authorization test (apps/api/test/authz/me/*.test.ts)

| シナリオ | 期待 |
| --- | --- |
| 未ログイン → GET /me | 401 |
| 未ログイン → GET /me/profile | 401 |
| 未ログイン → POST /me/visibility-request | 401 |
| 削除済み user の cookie で GET /me | 410 もしくは 401 + authGateState=deleted（要件確定） |
| rules_consent=declined の cookie で GET /me | 200 + authGateState=rules_declined |
| 別 user の cookie を改ざん → どこか他人 memberId にアクセス試行 | path に :memberId が無いため事故的他人参照は構造的に不可能（type test で保証） |
| visibility request を 2 回連続 POST | 1 回目 202、2 回目 409 (DUPLICATE_PENDING_REQUEST) |
| GET /me/profile の response に `notes` プロパティが含まれる | test fail（zod schema に notes キー不在を強制） |

### Integration test (apps/api/test/integration/me-flow.test.ts)

- fixture seeder で admin_member_notes / member_status / response_fields を投入
- session を mock し、4 endpoint を順に叩いて view model 整合を確認
- visibility request 投入後に `admin_member_notes` に正しい type / sourceMemberId が入っていることを repository test で確認

## Test matrix（AC × verify suite）

| AC | unit | contract | authz | integration |
| --- | --- | --- | --- | --- |
| AC-1 (未ログイン 401) | session.ts | GET /me 401 | 全 endpoint 401 | - |
| AC-2 (他人 memberId 不可) | self-member-only.ts | - | path 改ざん test | - |
| AC-3 (editResponseUrl 含有) | edit-response-url.ts | GET /me/profile zod | - | 4 endpoint flow |
| AC-4 (request → notes) | self-request-queue.ts | POST 202 | 二重投入 409 | notes 投入後 admin queue |
| AC-5 (responseId vs memberId) | schemas/me.ts type test | - | - | - |
| AC-6 (rate limit 5/min) | rate-limit-self-request.ts | - | 5 連投で 429 | - |
| AC-7 (authGateState 含有) | session.ts | GET /me zod | rules_declined / deleted | - |
| AC-8 (notes leak 0) | - | GET 系 zod に notes 不在 | - | - |

## 実行タスク

- [ ] この Phase の成果物を作成する
- [ ] 参照資料、成果物、完了条件の整合を確認する
- [ ] artifacts.json の対象 Phase 状態更新条件を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/06-member-auth.md | 認可境界 |
| 必須 | docs/00-getting-started-manual/specs/07-edit-delete.md | request API |
| 必須 | docs/00-getting-started-manual/specs/13-mvp-auth.md | MVP 認証条件 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | 各 test を pass させる runbook 化 |
| Phase 6 | failure case を test に追加 |
| Phase 7 | AC matrix の verify 列を本 Phase の test 名で埋める |
| 08a (Wave 8) | 本タスクの test 群を取り込み |

## 多角的チェック観点（不変条件マッピング）

- #4: 本文 PATCH 不在の type test を contract で実施（理由: 構造保証）
- #7: SessionUser の `responseId` と `memberId` を別フィールドで型 test（理由: 混同防止）
- #8: localStorage を session 正本にしない test（cookie / JWT のみで session が成立すること）
- #9: authGateState 5 状態を test で network する（理由: /no-access 不在）
- #11: path に :memberId 不在を type test で固定（理由: 攻撃面根絶）
- #12: GET 系 response に notes 不在の zod test（理由: 公開境界）

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | unit test 一覧化 | 4 | pending | module 別 |
| 2 | contract test 一覧化 | 4 | pending | endpoint × zod |
| 3 | authz test 一覧化 | 4 | pending | 5 シナリオ以上 |
| 4 | integration test 設計 | 4 | pending | flow を 1 本 |
| 5 | test matrix 作成 | 4 | pending | outputs/phase-04/test-matrix.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | Phase 4 主成果物 |
| ドキュメント | outputs/phase-04/test-matrix.md | AC × verify mapping |
| メタ | artifacts.json | Phase 4 を completed に更新 |

## 完了条件

- [ ] unit / contract / authz / integration の 4 層全てに test 設計がある
- [ ] AC × verify mapping が表で完成
- [ ] 不変条件 #4 / #11 / #12 を test で担保する手段が明記

## タスク100%実行確認【必須】

- 全実行タスク completed
- 全成果物配置済み
- 全完了条件チェック
- artifacts.json の Phase 4 を completed に更新

## 次 Phase

- 次: 5 (実装ランブック)
- 引き継ぎ事項: test 駆動で実装する順序（middleware → service → handler → router）
- ブロック条件: test matrix が空欄なら次 Phase 開始しない
