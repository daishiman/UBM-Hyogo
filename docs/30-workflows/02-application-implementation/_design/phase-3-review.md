# Phase 3: 設計レビュー — alternative と GO/NO-GO

## メタ情報

| 項目 | 値 |
| --- | --- |
| 設計対象 | Phase 1-2 設計の最終レビュー |
| Phase | 3 / 3（設計書 phase） |
| 作成日 | 2026-04-26 |
| 上流 | _design/phase-1-requirements.md, _design/phase-2-design.md |
| 下流 | 各タスクディレクトリ生成（Task #4 以降） |

## 判定方針

`PASS` / `MINOR` / `MAJOR` の3段階で各検証項目を判定し、`MAJOR` が0件なら GO とする。

## 検証マトリクス

### A. specs/ 機能網羅性

| 機能（specs 由来） | マッピング先 task | 判定 |
| --- | --- | --- |
| 31項目 schema 定義（01-api-schema） | 01b validation + 03a schema sync | PASS |
| visibility=public/member/admin（01） | 01b validation + 04*/06* で制御 | PASS |
| publicConsent / rulesConsent（01,06） | 01b validation + 03b sync + 05 auth | PASS |
| Google service account 認証（02） | 01b form client + 03a/03b 同期 | PASS |
| 会員ログイン認証（02, 06, 13） | 05 auth integration | PASS |
| schema sync / response sync（03） | 03a + 03b | PASS |
| stableKey 解決（03） | 03a (alias) + 03b (resolve) | PASS |
| current_response_id 切替（03,06） | 03b sync | PASS |
| 型4層（schema/raw/identity/viewmodel）（04） | 01b validation + 02 repository | PASS |
| 11 ルート（05） | 06a/06b/06c で全カバー | PASS |
| 5 状態の AuthGateState（06,10,13） | 05 auth + 06b login | PASS |
| editResponseUrl 取得（07） | 03b sync + 04b API + 06b profile | PASS |
| 公開状態 published/draft/hidden（07） | 04c admin API + 06c admin pages | PASS |
| 論理削除 + 復元（07,11） | 04c API + 06c pages + 07 ops | PASS |
| 16 テーブル D1 schema（08） | 01a schema | PASS |
| Cloudflare 無料枠制約（08,15） | 01a schema + 09 release で確認 | PASS |
| UI レイヤ別 UX（09） | 06a/06b/06c | PASS |
| 検索 (q/zone/status/tag/sort/density)（09,12） | 04a public API + 06a public pages + 04c admin API + 06c admin tags | PASS |
| Playwright 検証マトリクス（09） | 08b E2E | PASS |
| Magic Link + magic_tokens（10） | 05 auth + 01a schema | PASS |
| 管理操作 4 領域（公開/削除/タグ/開催日）（11） | 04c API + 06c pages + 07 ops | PASS |
| 管理メモ admin_member_notes（11） | 04c API + 01a schema | PASS |
| 他人本文直編集禁止（11） | 全 task の不変条件 #11 として明記 | PASS |
| タグ queue 6カテゴリ（12） | 01a seed + 04c API + 07 ops | PASS |
| meeting_sessions + attendance（11） | 01a schema + 04c API + 06c pages + 07 ops | PASS |
| MVP scope 限定（13） | Phase 1 scope 定義に反映 | PASS |
| Phase 0-7 ロードマップ（14） | Wave 0-9 にマッピング | PASS |
| infra runbook 整合（15） | 09 release で doc/01-infrastructure-setup と sync | PASS |
| UI primitives 15 種（16） | 00 foundation | PASS |

判定: 全項目 PASS。漏れなし。

### B. 不変条件 15項目の各 task への配信

各タスクの index.md `参照資料` セクションに以下を必須記載とする:

```
### 不変条件
- 本タスクは doc/00-getting-started-manual/specs/00-overview.md の不変条件 #X, #Y, #Z に従う
- ../README.md の「実装禁止事項」セクションを Phase 1, Phase 9 で再確認する
```

各 task に該当する不変条件マッピング:

| Task | 適用不変条件 # |
| --- | --- |
| 00-serial-monorepo-shared-types-and-ui-primitives-foundation | 6, 14 |
| 01a-parallel-d1-database-schema-migrations-and-tag-seed | 1, 2, 7, 13, 14 |
| 01b-parallel-zod-view-models-and-google-forms-api-client | 1, 3, 10, 15 |
| 02a/02b/02c repository 分割 | 6, 13 |
| 03a-parallel-forms-schema-sync-and-stablekey-alias-queue | 10, 13, 15 |
| 03b-parallel-forms-response-sync-and-current-response-resolver | 1, 2, 3, 10, 15 |
| 04a-parallel-public-directory-api-endpoints | 5, 6, 15 |
| 04b-parallel-member-self-service-api-endpoints | 2, 4, 5, 6 |
| 04c-parallel-admin-backoffice-api-endpoints | 4, 5, 6, 7, 11, 12 |
| 05a/05b auth 分割 | 3, 5, 8, 9 |
| 06a-parallel-public-landing-directory-and-registration-pages | 5, 8, 15 |
| 06b-parallel-member-login-and-profile-pages | 4, 8, 9 |
| 06c-parallel-admin-dashboard-members-tags-schema-meetings-pages | 5, 7, 8, 11, 12 |
| 07a/07b/07c admin ops 分割 | 7, 11, 12, 13 |
| 08a-parallel-api-contract-repository-and-authorization-tests | 1, 2, 5, 6, 11 |
| 08b-parallel-playwright-e2e-and-ui-acceptance-smoke | 5, 8, 9 |
| 09a/09b parallel + 09c serial release | 6, 14 |

判定: PASS。不変条件 1〜15 が全て少なくとも1タスクで参照。

### C. 並列/直列 妥当性

| Wave | 並列タスク数 | 並列の正当性 | 判定 |
| --- | --- | --- | --- |
| 0 | 1 (serial) | 全 Wave の前提、順次必須 | PASS |
| 1 | 2 (01a, 01b) | DB schema と validation/client は独立 | PASS |
| 2 | 1 (serial) | 01a と 01b の合流点 | PASS |
| 3 | 2 (03a, 03b) | schema sync と response sync は独立、共有は schema_diff_queue のみ | PASS |
| 4 | 3 (04a, 04b, 04c) | 公開/会員/管理は別 endpoint、認可境界も独立 | PASS |
| 5 | 1 (serial) | 04b/04c の合流点、auth は唯一の gate | PASS |
| 6 | 3 (06a, 06b, 06c) | UI 層も独立、route prefix で分離 | PASS |
| 7 | 1 (serial) | 06c の追従ロジック、admin ops の中核 | PASS |
| 8 | 2 (08a, 08b) | unit/contract と E2E は別 runtime | PASS |
| 9 | 1 (serial) | release は唯一の deploy point | PASS |

判定: PASS。並列タスクは責務独立、合流点で serial を挟む構造が妥当。

### D. cross-wave 依存の閉鎖性

各 task の depends_on / blocks 一覧（artifacts.json に反映予定。命名は full directory name で記載）:

| Task | depends_on | blocks |
| --- | --- | --- |
| 00-serial-monorepo-shared-types-and-ui-primitives-foundation | doc/01-infrastructure-setup/02 | 01a, 01b |
| 01a-parallel-d1-database-schema-migrations-and-tag-seed | 00 | 02 |
| 01b-parallel-zod-view-models-and-google-forms-api-client | 00 | 02, 03a, 03b, 04a, 04b, 04c |
| 02a/02b/02c repository 分割 | 01a, 01b | 03a, 03b, 04a, 04b, 04c |
| 03a-parallel-forms-schema-sync-and-stablekey-alias-queue | 02, 01b | 04c |
| 03b-parallel-forms-response-sync-and-current-response-resolver | 02, 01b | 04a, 04b, 04c |
| 04a-parallel-public-directory-api-endpoints | 02, 03b | 06a |
| 04b-parallel-member-self-service-api-endpoints | 02, 03b | 05, 06b |
| 04c-parallel-admin-backoffice-api-endpoints | 02, 03a, 03b | 05, 06c, 07 |
| 05a/05b auth 分割 | 04b, 04c | 06a, 06b, 06c |
| 06a-parallel-public-landing-directory-and-registration-pages | 04a, 05 | 08a, 08b |
| 06b-parallel-member-login-and-profile-pages | 04b, 05 | 08a, 08b |
| 06c-parallel-admin-dashboard-members-tags-schema-meetings-pages | 04c, 05 | 07, 08a, 08b |
| 07a/07b/07c admin ops 分割 | 06c | 08a, 08b |
| 08a-parallel-api-contract-repository-and-authorization-tests | 06a, 06b, 06c, 07 | 09 |
| 08b-parallel-playwright-e2e-and-ui-acceptance-smoke | 06a, 06b, 06c, 07 | 09 |
| 09a/09b parallel + 09c serial release | 08a, 08b | (final) |

判定: PASS。cross-wave 並列なし、循環依存なし、合流点が明確。

### E. alternative 案の検討

#### Alt 1: 04a/04b/04c を 1 タスクに統合
- pros: タスク数削減 (-2)
- cons: 並列実行不可、責務（公開/会員/管理）の境界が読みにくい、認可境界 test が散漫
- 採否: REJECT。並列価値が大きい。

#### Alt 2: 06a/06b/06c を 1 タスクに統合
- pros: タスク数削減 (-2)
- cons: 公開 SSR と 会員 client-side と 管理 SPA の test 戦略が混在、UI primitives 利用が拡散
- 採否: REJECT。route prefix での責務分離が明確。

#### Alt 3: 03a/03b を 1 タスクに統合
- pros: schema と response の依存（schema_diff_queue 共有）が同一タスクで管理できる
- cons: schema sync は管理 trigger、response sync は cron trigger と性質が違う、テスト fixture が複雑化
- 採否: REJECT。trigger と性質が異なる。

#### Alt 4: 07 admin ops を 04c admin API に統合
- pros: タスク数削減 (-1)
- cons: API endpoint と operational business logic（queue 解決、attendance 重複防止）は粒度が違う、admin 監査 log は別関心
- 採否: REJECT。operational logic を独立 task で扱う方が test しやすい。

#### Alt 5: 00 foundation を doc/01-infrastructure-setup/02 に吸収
- pros: monorepo 立ち上げの重複削減
- cons: doc/01-infrastructure-setup/02 はランタイム基盤（version policy, runtime split）、本タスクの 00 はアプリ層（types 移植、UI primitives）。混ざると Phase 12 sync 時に責務不明
- 採否: REJECT。独立した方が同期容易。

判定: 全 alternative REJECT。現案が最適。

### F. リスクと緩和策

| リスク | 影響 | 緩和策 |
| --- | --- | --- |
| 24 タスク × 13 phase = 312 仕様書の生成コスト | 高 | SubAgent を 5-8 並列で分散、Wave ごとにグループ化 |
| Phase 12 spec sync が 24 箇所に分散 | 中 | 各 task の phase-12.md に specs/ 該当ファイルへの逆参照を必須記載 |
| 不変条件の重複 / drift | 中 | doc/02-application-implementation/README.md を single source とし、各 task は参照のみ |
| Wave 4 並列で 04a/04b/04c が同時に schema_diff_queue を読む | 低 | 03a が schema_diff_queue 書き込み所有、04* は read-only |
| 06c 管理画面が 06a/06b より複雑で時間超過 | 中 | 06c の Phase 5 (実装) 内でサブタスク化、phase-2.md に画面別タスク分割を明記 |
| 09 release で staging/production の二重 secret 設定漏れ | 高 | 09 の Phase 9 (品質保証) で secret hygiene check を必須化、doc/01-infrastructure-setup/04 と sync |

### G. 4条件（最終評価）

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | specs/01-13 + 16 の全機能を網羅、後続実装の責務境界を一意化、並列実行で工数圧縮 |
| 実現性 | PASS | 既存 _templates 流用、SubAgent 並列で 24 ディレクトリ生成可能、Wave 数 10 は管理可能範囲 |
| 整合性 | PASS | 依存マトリクスで cross-wave 並列を排除、循環依存なし、不変条件が全 task に分配 |
| 運用性 | PASS | 命名規則で並列/直列が判別可能、Phase 12 sync ルートが明示、specs/ 改訂時の対応 task が一意 |

## GO/NO-GO 判定

- MAJOR 件数: 0
- MINOR 件数: 0
- PASS 件数: 検証 A〜G 全項目

**判定: GO**

## 次フェーズへの handoff

1. **Task #4 ディレクトリ骨格生成** に進む:
   - `doc/02-application-implementation/` 配下に 24 タスクディレクトリ生成（並列性最大化のため要件時点 17 から再分解）
   - `_templates/` に共通テンプレート 4 ファイル生成
   - `README.md` に Wave 一覧、不変条件、実行順を記載
2. **Task #3 各タスク Phase 1-13 仕様書作成** を SubAgent 並列で実行:
   - グループ A: 00 + 01a + 01b + 02 (Wave 0-2 foundation/data layer、4 task)
   - グループ B: 03a + 03b (Wave 3 forms sync、2 task)
   - グループ C: 04a + 04b + 04c (Wave 4 API endpoints、3 task)
   - グループ D: 05 + 06a + 06b + 06c (Wave 5-6 auth + UI pages、4 task)
   - グループ E: 07 + 08a + 08b + 09 (Wave 7-9 ops + tests + release、4 task)
3. **Task #6 最終整合性チェック**: artifacts.json の depends_on / blocks が表 D と一致、不変条件参照が表 B と一致、命名規則準拠

## 残課題（未タスク候補）

- 通知配信基盤（Resend 等）の本格実装は specs/10 の Magic Link 以外は未タスク
- visual regression test（Playwright snapshot diff）は 08b に含めず別 wave で formalize
- monitoring dashboard（Cloudflare Analytics、D1 metrics）は doc/01-infrastructure-setup/05a で扱われるため本パッケージ対象外
- cron schedule 実装は 09 release の中で wrangler triggers として扱うが、業務 KPI dashboard は未タスク

これらは README.md の `Deferred / 未タスク候補` セクションに転記する。
