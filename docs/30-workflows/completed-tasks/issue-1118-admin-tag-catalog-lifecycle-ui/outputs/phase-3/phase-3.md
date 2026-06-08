# Phase 3: 設計レビュー（Gate-A）

`[実装区分: 実装仕様書]` / status: `completed` / 本ファイルは **Gate-A の evidence**。

## 3.1 レビュー観点と判定

| 観点 | 判定 | 根拠 |
|------|------|------|
| issue 陳腐化の最適化が妥当か | PASS | 現コード調査で「tag master catalog 画面が apps/web に不在」を確認（rg 0 hit）。ユーザー判断「専用画面を新規構築」に基づき方針を最適化（index.md §1 / phase-1 §1.3）|
| API 不変条件が守られているか | PASS | 消費のみ（GET /tags・reactivate・logical delete・physical delete は #1070/#1035 で land 済み）。新 endpoint・D1 schema 変更なし（不変条件 #1）|
| 責務境界が閉じているか | PASS | Server（初期 fetch）/ Client（state machine）/ pure（descriptor・409 parse）を分離。row は state を持たず callback 委譲（SRP）|
| 3 操作の視覚的・文言的区別が定義されているか | PASS | `lifecycleDescriptor` の確定値（buttonLabel / intent / requiresConfirm）+ `availableOps(active)` 出し分けで AC-4 を SSOT 化（phase-2 §2.3）|
| physical delete 不可逆の防止が設計されているか | PASS | `ConfirmDialog`（`isDestructive` + 「元に戻せない」明示）を confirm_pending 経由でのみ実行（AC-2・state machine phase-2 §2.4）|
| 409 referenceCount adapter が定義されているか | PASS | `parseTagLifecycleError(status, bodyText)` で 409→tag_has_references inline error(referenceCount)・404→not_found を分類（AC-3/AC-7・phase-2 §2.5）|
| 冪等 reactivate を error 扱いしないか | PASS | 200 + 現 row を success 扱い・エラーバナー抑止（AC-6）|
| design token 不変条件 | PASS | OKLch token のみ・`.admin-tag-catalog-*` additive・`verify-design-tokens` gate を Phase 9 検証に含む（AC-9）|
| 既存資産の退化がないか | PASS | 新規 route の additive 追加。TagQueuePanel / picker 非接触（AC-5）|
| CLAUDE.md 不変条件（#8 test suffix / #9 FormField / #10 useAdminMutation） | PASS | phase-1 §1.6 で固定 |

## 3.2 リスクと対策

| リスク | 影響 | 対策 |
|--------|------|------|
| physical delete 誤操作（不可逆） | 高 | ConfirmDialog isDestructive + 「元に戻せない」文言 + confirm_pending state（AC-2）。component test で「confirm なし→API 未呼出」を固定 |
| 409 を汎用 toast で潰し referenceCount が伝わらない | 中 | 409 を専用 state（tag_has_references inline error）として row inline に「N人に使用中のため削除不可」表示。toast は補助（phase-2 §2.5）|
| 3 操作の混同 | 高 | descriptor の intent / label を SSOT 化。`availableOps(active)` で active=true→[logical,physical] / false→[reactivate,physical] と出し分け。component test で 3 操作の非混同を固定 |
| nav 定義ファイルの実パスずれ | 低 | user-gated runtime/staging cycle冒頭で `rg` により nav 定義の現物を確定（phase-2 §2.2 注記）。到達性（AC-0）が要件でファイル名は現物優先 |
| useAdminMutation の 409 body 取得可否 | 中 | `FetchAuthedError.status/bodyText` を確認。取得不能なら panel が自前 fetch で 409 body を読む fallback（contract 同一・phase-2 §2.5）|

## 3.3 4 条件評価

| 条件 | 判定 | 根拠 |
|------|------|------|
| 価値性 | PASS | 管理者の tag 棚卸しコストを下げる。誰の何のコストを下げるか定義済み |
| 実現性 | PASS | 既存 API + 既存足場（AdminPageHeader/useAdminMutation/ConfirmDialog/safeServerFetch）で 1 user-gated runtime/staging cycleに収まる厚み（CONST_007 単一サイクル）|
| 整合性 | PASS | API 不変・D1 直アクセス禁止・token 正本・命名規則すべて矛盾なし |
| 運用性 | PASS | component/pure test + design-token gate + 非退化 test で導入後の回帰保護が閉じる |

## 3.4 スコープ単一サイクル性（CONST_007）

本仕様は新規 4 ファイル + 編集 2 ファイルで完結し、**後続実装プロンプトの 1 サイクル内で完了できるスコープ**。「将来タスク」「別 PR」への先送りはない。physical delete 強制移行 migration（#1070 followup-001）と member_tags FK 評価（#1070 followup-003）は **既存の別タスク**として既起票済みであり、本タスクのスコープ外（先送り新設ではない）。

## 3.5 Gate-A 判定

**PASS** — Phase 4（テスト作成）へ進行可。設計契約（route・component 境界・型・descriptor 確定値・state machine・409 adapter・token 方針）は固定された。本サイクルは implemented_local_evidence_captured のため実装は user-gated。
