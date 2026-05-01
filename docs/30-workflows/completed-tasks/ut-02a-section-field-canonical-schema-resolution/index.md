# ut-02a-section-field-canonical-schema-resolution — タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-02a-section-field-canonical-schema-resolution |
| ディレクトリ | docs/30-workflows/ut-02a-section-field-canonical-schema-resolution |
| Issue | #108 |
| 親タスク | 02a-parallel-member-identity-status-and-response-repository |
| 起票元 | docs/30-workflows/completed-tasks/UT-02A-SECTION-FIELD-MAPPING-METADATA.md |
| Wave | 2+（03a 完了後に着手推奨） |
| 実行種別 | sequential（builder.ts 改修は単一スコープ・段階置換） |
| 作成日 | 2026-05-01 |
| 担当 | api-repository-shared-builder |
| 状態 | verified / implementation_complete_pending_pr |
| タスク種別 | implementation / NON_VISUAL |
| 優先度 | medium |

## purpose

`apps/api/src/repository/_shared/builder.ts` の `buildSections()` / `buildFields()` で暫定採用している 3 種の fallback（broad section assignment / `stable_key` を label 流用 / heuristic field kind）を、canonical schema metadata（Google Forms schema または admin-managed schema diff）から resolve する `MetadataResolver` に置換する。schema drift を repository 層で検知可能にし、public / member / admin 3 view が同一 metadata から導出される状態にする。

## scope in / out

### scope in

- `apps/api/src/repository/_shared/metadata.ts` 新設（`MetadataResolver` interface + 既定実装）
- `apps/api/src/repository/_shared/builder.ts` の `buildSections()` / `buildFields()` を resolver 経由に切替
- builder.ts から fallback 分岐（label / kind / section）を削除
- `MetadataResolver` の resolve 失敗を schema drift signal として `Result` 型 or 例外で通知
- 必要であれば D1 migration（`response_fields.section_key` / `response_fields.field_kind` 追加）を `apps/api/migrations/` に追加
- `apps/api/src/repository/_shared/builder.test.ts` の正規化テスト整備（section 重複なし / consent 誤判定なし / drift 検知）
- 03a / 04a / 04b 担当への契約引き渡しドキュメント（`outputs/phase-12/implementation-guide.md`）

### scope out

- Google Forms API からの schema 同期実装本体（03a 責務）
- StableKey alias queue の運用実装（03a 責務）
- admin-managed schema diff UI（04c 責務）
- attendance / adminNotes など他テーブル統合（UT-02A-ATTENDANCE-PROFILE-INTEGRATION / UT-02A-ADMIN-MEMBER-NOTES-REPOSITORY）
- public / member / admin の view contract 自体の変更（04a / 04b 責務、本タスクは契約に揃える側）
- production deploy（09a / 09b 責務）

## dependencies

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 02a `apps/api/src/repository/_shared/builder.ts` 現行版 | fallback 削除対象の起点 |
| 上流 | 03a forms schema sync / StableKey alias queue | canonical schema の供給元（resolver の back-end） |
| 上流 | 04a / 04b API contract hardening | section / field 正規化結果が揃える先の view contract |
| 並列参考 | UT-02A-TAG-ASSIGNMENT-QUEUE-MANAGEMENT | 03a と境界を共有する別未割当タスク |
| 下流 | 02a builder を呼ぶ public / member / admin repository chain | fallback 削除後の挙動を引き継ぐ |

## refs

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/01-api-schema.md | フォーム schema / 項目定義（canonical 源泉） |
| 必須 | docs/00-getting-started-manual/specs/00-overview.md | 不変条件 #1 / #2 / #3 / #4 |
| 必須 | docs/00-getting-started-manual/specs/08-free-database.md | D1 構成 / migration 制約 |
| 必須 | docs/30-workflows/completed-tasks/UT-02A-SECTION-FIELD-MAPPING-METADATA.md | 起票元 unassigned-task spec |
| 必須 | apps/api/src/repository/_shared/builder.ts | 改修対象（broad assignment / fallback 現行実装） |
| 必須 | apps/api/src/repository/responseFields.ts | row shape（`section_key` / `field_kind` 不在の確認元） |
| 必須 | apps/api/src/repository/responseSections.ts | row shape |
| 必須 | docs/30-workflows/completed-tasks/02a-parallel-member-identity-status-and-response-repository/outputs/phase-12/unassigned-task-detection.md | 02a Phase 12 検出記録 |
| 参考 | docs/30-workflows/unassigned-task/UT-02A-TAG-ASSIGNMENT-QUEUE-MANAGEMENT.md | 03a 境界共有 |

## AC（Acceptance Criteria）

- AC-1: `apps/api/src/repository/_shared/metadata.ts` に `MetadataResolver` interface（`resolveSectionKey` / `resolveFieldKind` / `resolveLabel`）が定義され、既定実装が canonical schema metadata から正規化を行う
- AC-2: `apps/api/src/repository/_shared/builder.ts` の `buildSections()` / `buildFields()` から、label / kind / section の旧推測 fallback 分岐が **0 行** に削除されている。`stable_key` を resolver に渡す参照は許可し、禁止対象は `stable_key` を label として流用する代入、heuristic kind 判定、broad section assignment の 3 種に限定する
- AC-3: `buildFields()` が返す 1 つの field は **複数 section に重複しない**（ユニットテストで保証）
- AC-4: consent 系 `stable_key`（`publicConsent` / `rulesConsent`）が consent kind として canonical に解決され、text/select との誤判定が起きない（ユニットテストで保証）
- AC-5: `stable_key` 文字列（例: `q_section1_company_name`）が label として外部に露出しない（ユニットテストで保証）
- AC-6: `MetadataResolver` の resolve 失敗（schema drift）が repository 層から検知可能（`Result` 型 or 例外で `unknownStableKey` を通知）
- AC-7: 03a の StableKey alias queue interface を resolver から呼び出すフックが定義されている。03a 未完成時は生成物 `generated/static-manifest.json` を baseline source とし、生成元 spec、生成日時、再生成コマンド、03a 完成後の廃止条件を記録する
- AC-8: D1 migration を伴う方式（hybrid / D1 metadata table）を採用した場合、migration が `apps/api/migrations/` に追加され、`bash scripts/cf.sh d1 migrations list` で確認できる
- AC-9: `mise exec -- pnpm --filter @ubm/api test apps/api/src/repository/_shared` / `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` が pass する
- AC-10: `outputs/phase-12/implementation-guide.md` に metadata 注入の使用例と 03a / 04a / 04b への契約引き渡し内容が記載されている

## 13 phases

| Phase | 名称 | ファイル | 概要 |
| --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | 真の論点（resolver 配置・drift 通知方式・方式選定）と AC-1〜10 確定。`taskType=implementation` / `visualEvidence=NON_VISUAL` を artifacts に固定 |
| 2 | 設計 | phase-02.md | `MetadataResolver` interface 設計、3 方式（D1 column / static manifest / hybrid）比較、03a alias queue フック設計、Schema/共有コード Ownership 宣言 |
| 3 | 設計レビュー | phase-03.md | 4 条件評価、03a / 04a / 04b 担当との review 整合（PASS-MINOR-MAJOR）、選定方式の確定 |
| 4 | テスト戦略 | phase-04.md | section 重複なし / consent 誤判定なし / label 露出なし / drift 検知 / alias 失敗 fallback の 5 観測軸 × testcase マッピング |
| 5 | 実装ランブック | phase-05.md | metadata.ts 新設手順、builder.ts 切替手順、migration 適用手順（採用時のみ）、`scripts/cf.sh` 経由ルール |
| 6 | 異常系検証 | phase-06.md | resolve 失敗 / alias 衝突 / migration ロールバック / 03a interface drift / consent 誤判定の failure case と対応 |
| 7 | AC マトリクス | phase-07.md | AC-1〜10 × 成果物 × 不変条件のトレース、03a/04a/04b 契約への影響表 |
| 8 | DRY 化 | phase-08.md | resolver helper / row → canonical 変換ユーティリティの抽出と再利用境界 |
| 9 | 品質保証 | phase-09.md | typecheck / lint / unit test / coverage（変更行 90%）/ schema drift CI gate / secret hygiene |
| 10 | 最終レビュー | phase-10.md | GO / NO-GO 判定（依存 03a / 04a / 04b の AC 充足確認、選定方式の最終承認） |
| 11 | 手動 smoke | phase-11.md | NON_VISUAL 代替 evidence（builder unit test 結果 / drift 検知ログ / migration 適用ログ / 3 view 同一導出確認 manifest） |
| 12 | ドキュメント更新 | phase-12.md | implementation-guide / system-spec-update-summary / changelog / unassigned / skill-feedback / compliance-check の 7 成果物 |
| 13 | PR 作成 | phase-13.md | approval gate / local-check-result / change-summary / PR template（`Refs #108` 採用、`Closes` 禁止） |

## outputs

```
outputs/phase-01/main.md
outputs/phase-02/main.md
outputs/phase-02/resolver-interface.md
outputs/phase-02/method-comparison.md
outputs/phase-02/ownership-declaration.md
outputs/phase-03/main.md
outputs/phase-03/review-record.md
outputs/phase-04/main.md
outputs/phase-04/test-matrix.md
outputs/phase-05/main.md
outputs/phase-05/runbook.md
outputs/phase-05/migration-plan.md
outputs/phase-06/main.md
outputs/phase-07/main.md
outputs/phase-07/ac-matrix.md
outputs/phase-08/main.md
outputs/phase-09/main.md
outputs/phase-09/coverage-report.md
outputs/phase-10/main.md
outputs/phase-11/main.md
outputs/phase-11/manual-test-result.md
outputs/phase-11/non-visual-evidence.md
outputs/phase-11/builder-unit-test-result.txt
outputs/phase-11/drift-detection-log.md
outputs/phase-11/three-view-parity-check.md
outputs/phase-12/main.md
outputs/phase-12/implementation-guide.md
outputs/phase-12/system-spec-update-summary.md
outputs/phase-12/documentation-changelog.md
outputs/phase-12/unassigned-task-detection.md
outputs/phase-12/skill-feedback-report.md
outputs/phase-12/phase12-task-spec-compliance-check.md
outputs/phase-13/main.md
outputs/phase-13/local-check-result.md
outputs/phase-13/change-summary.md
outputs/phase-13/pr-template.md
```

## services / secrets

| 区分 | 値 | 配置 | 備考 |
| --- | --- | --- | --- |
| DB | Cloudflare D1 (ubm-hyogo-db-*) | apps/api binding | migration 採用時のみ。`bash scripts/cf.sh` 経由必須 |
| 共有 schema | `@repo/shared` zod / type | packages/shared | `field_kind` enum の追加可否を本タスクで判断 |
| 03a interface | StableKey alias queue | apps/api（03a 完成後） | 03a 未完成時は static manifest |
| Secrets | （新規導入なし） | — | wrangler 直接実行禁止 |

## invariants touched

- **#1** 実フォームの schema をコードに固定しすぎない（canonical resolver 経由に集約することで遵守）
- **#2** consent キーは `publicConsent` と `rulesConsent` に統一（resolver の field_kind 判定で恒久確定）
- **#3** `responseEmail` はフォーム項目ではなく system field（resolver が field_kind=system として扱う境界線を明示）
- **#5** D1 への直接アクセスは `apps/api` に閉じる（metadata resolver も apps/api 内に配置）

## completion definition

- Phase 1〜10 が completed、Phase 11 で NON_VISUAL 代替 evidence（builder unit test / drift log / 3 view parity）が取得済み
- AC-1〜10 が Phase 7 マトリクスで完全トレース
- 4 条件評価（価値 / 実現 / 整合 / 運用）が Phase 1 / Phase 12 で整合
- 不変条件 #1 / #2 / #3 / #5 が evidence 上で確認済み
- Phase 12 で 7 成果物（main + 6 サブ）が揃い、`outputs/artifacts.json` 不在時は root `artifacts.json` が唯一正本であることを compliance-check に明記する
- Phase 13 で user 承認後に PR 作成完了（`Refs #108`）

## lifecycle states

| state | 意味 | completed 判定 |
| --- | --- | --- |
| spec_created | 本 workflow と Phase 1-13 仕様書が作成済み、実装着手前 | 不可（root state 据え置き） |
| ready | 03a alias queue interface ドラフトが存在し、Phase 5 runbook が実行可能 | 不可 |
| implementing | metadata.ts / builder.ts 改修中 | 不可 |
| verified | builder unit test pass / drift 検知ログ取得 / 3 view parity 確認済み | Phase 11 完了可 |
| completed | Phase 12 same-wave sync、Phase 13 user approval gate が全て完了 | 可（root を completed に更新） |

## 03a / 04a / 04b との依存契約サマリ

| 相手タスク | 引き取るもの | 渡すもの | 整合確認 Phase |
| --- | --- | --- | --- |
| 03a | StableKey alias queue interface（dryRun / apply / 失敗通知） | resolver から呼び出すフック契約 | Phase 2 / Phase 3 |
| 04a | `/public/*` view contract（section/field 露出形式） | resolver 出力の view 整合 | Phase 3 / Phase 7 |
| 04b | `/me/*` view contract（read-only 境界） | resolver 出力の view 整合 | Phase 3 / Phase 7 |
