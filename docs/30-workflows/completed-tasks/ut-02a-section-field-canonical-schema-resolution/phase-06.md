# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-02a-section-field-canonical-schema-resolution |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| Wave | 2+ |
| Mode | sequential |
| 作成日 | 2026-05-01 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | pending |

## 目的

`MetadataResolver` 導入と builder.ts fallback 削除に伴って想定される 5 系統の failure case を洗い出し、各々に対する mitigation（緩和策）と test coverage、運用上の検出経路を確定する。とくに resolve 失敗時に `/public/*` `/me/*` のレスポンスが 500 で全断しないこと、Cloudflare D1 binding 不在時に fail-fast すること、03a interface drift（field 増減）を repository 層から検知できることを観測対象として固定する。

## 前 Phase からの引き継ぎ

- Phase 5 で確定した runbook（metadata.ts 新設手順 / builder.ts 切替手順 / migration 適用手順）
- Phase 5 で確定した resolve 失敗通知方式（`Result` 型 or 例外）
- Phase 5 で固定した「03a 未完成時は generated static manifest baseline で代替」運用

## 依存境界

| 種別 | 対象 | 引き取るもの | 渡すもの |
| --- | --- | --- | --- |
| 上流 | Phase 4 テスト戦略 | failure case 観測軸の定義 | 各 failure 用の testcase 雛形 |
| 上流 | Phase 5 実装ランブック | 切替時のロールバック手順 | 異常系再現手順 |
| 並列 | 03a alias queue interface | dryRun / apply / 失敗通知の形式 | resolver の drift 通知契約 |
| 下流 | Phase 7 AC マトリクス | failure × AC 対応 | trace 行 |
| 下流 | Phase 9 品質保証 | schema drift CI gate 仕様 | gate 入力 |

## 想定 failure case と mitigation

### F-1: resolve 失敗時に response 全体が 500 で落ちる

| 項目 | 内容 |
| --- | --- |
| 発生条件 | 03a alias queue / static manifest のいずれにも存在しない `stable_key` が D1 row に含まれる（form 増設後 / alias 未登録 / migration 中） |
| 影響範囲 | `/public/responses/*` `/me/profile` `/admin/*` の 3 view が同時に 500 |
| mitigation | resolver は `Result<Canonical, ResolveError>` を返し、builder.ts は `unknownStableKey` を含む field を `unknown` バケット（`section_key=__unresolved__` / `field_kind=unknown`）に隔離する。response 自体は 200 で返却し、隔離 field は metadata に `_meta.unresolved=true` を付与 |
| test coverage | `builder.test.ts` で「unknown stable_key を含む row 集合 → 200 返却 + `_meta.unresolved=true` field が含まれる + 他 field は正常に section に配置される」を assert |
| 検出経路 | Workers structured log（`level=warn / event=schema.resolve.failed / stable_key=...`）→ Phase 9 で wrangler tail / log push で吸い上げ |

### F-2: alias 衝突（同一 stableKey に複数 section が紐付く）

| 項目 | 内容 |
| --- | --- |
| 発生条件 | 03a alias queue が複数 alias を `apply` した結果、同じ canonical stable_key に section A / section B 両方が割当てられる、または manifest と D1 column の hybrid 方式で両者が異なる section を返す |
| 影響範囲 | 1 つの field が 2 section に重複（AC-3 違反）→ 3 view 整合崩壊 |
| mitigation | resolver 内で「decide order = D1 column > static manifest > alias queue」の優先順位を固定。重複検出時は exception ではなく `ResolveError.code=ambiguous_section` を発火し、unknown バケットに隔離（露出より隔離を優先）。priority order は Phase 2 method-comparison.md に記述 |
| test coverage | `metadata.test.ts` で 2 source が異なる section を返す scenario を作り、優先順位どおりに 1 section に正規化されること、conflict 発生時に warn ログが出ることを assert |
| 検出経路 | Workers log + Phase 9 schema drift CI gate（`MetadataResolver` 全 stable_key を walk して conflict 数 > 0 で fail） |

### F-3: D1 migration ロールバック（採用時のみ）

| 項目 | 内容 |
| --- | --- |
| 発生条件 | hybrid / D1 column 方式採用後、`response_fields.section_key` / `field_kind` 列追加 migration が production で失敗 / 手動 rollback される |
| 影響範囲 | resolver が NULL row を受け取り、全 field が unknown 化（最悪ケースで 3 view が機能停止） |
| mitigation | (a) migration は `ALTER TABLE ADD COLUMN` のみ（DROP は別 migration）に分割し forward-only を担保、(b) NULL row は generated static manifest baseline で resolve、(c) migration 適用前後に `bash scripts/cf.sh d1 migrations list` の出力を Phase 5 runbook で記録 |
| test coverage | `metadata.test.ts` で「D1 row が `section_key=NULL` のとき manifest fallback が呼ばれて正規化が成功する」scenario を assert |
| 検出経路 | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production` の差分監視。Phase 11 で migration 前後ログを取得 |

### F-4: 03a interface drift（field 増減 / シグネチャ変更）

| 項目 | 内容 |
| --- | --- |
| 発生条件 | 03a が StableKey alias queue interface（`dryRun` / `apply` / 失敗通知）の戻り値を後方非互換に変更、または canonical schema の field 数が増減する |
| 影響範囲 | resolver build 時に typecheck が通らない / runtime に未知 field が追加されて F-1 と同等の resolve 失敗連鎖 |
| mitigation | (a) 03a 側の interface を `packages/shared` の zod / type に集約し、本タスクは型輸入のみとする（独自再定義禁止）、(b) 03a の breaking change は本タスク Phase 7 AC マトリクスに「03a 影響列」として記録、(c) field 増減時は static manifest を 03a 完了後に再生成する手順を Phase 5 runbook に明記 |
| test coverage | `metadata.test.ts` の contract test として「manifest が想定 field 数（initial spec の 31 質問 + system field）から外れたときに schema drift CI gate が fail する」を assert |
| 検出経路 | `mise exec -- pnpm typecheck` / Phase 9 schema drift CI gate |

### F-5: consent 誤判定再発（regression）

| 項目 | 内容 |
| --- | --- |
| 発生条件 | resolver が `publicConsent` / `rulesConsent` を text / select として返してしまう（manifest 入力ミス / alias queue で kind override） |
| 影響範囲 | 不変条件 #2 違反、公開可否判定（公開フラグ）が壊れ public ディレクトリの露出制御が破綻 |
| mitigation | (a) resolver 内で consent 系 stable_key の hard-coded allowlist を持ち、kind が consent 以外で resolve されたら強制的に consent に補正したうえで warn ログを出す、(b) `packages/shared` 側で `FieldKind` enum を `consent` 含めて固定、(c) consent stable_key の集合は `docs/00-getting-started-manual/specs/00-overview.md` の不変条件 #2 を正本とする |
| test coverage | `metadata.test.ts` で「manifest が `publicConsent` を text で返すケース → resolver が consent に補正 + warn 発火」を assert。`builder.test.ts` で「consent kind の field のみ consent 系処理に入る」を assert |
| 検出経路 | unit test + Phase 9 schema drift CI gate（consent allowlist と manifest の照合） |

## Cloudflare D1 binding 不在時の fail-fast

- D1 binding `DB` が undefined の場合、resolver 初期化時に `throw new Error("D1 binding 'DB' is required for MetadataResolver")` で即時失敗させる
- Workers の起動時 health check（`/health`）で binding 存在を assert する経路は 04a / 04b 既存実装に従う（本タスクで新規追加しない）
- ローカル `vitest` 環境では D1 binding を mock する `createMockResolver()` を提供し、unit test 側で fail-fast が起動しないようにする
- migration 採用方式（hybrid / D1 column）の場合、binding 不在は静的 manifest fallback では補えないため fail-fast を維持する。static manifest 単独方式を採用した場合は binding 不要 → fail-fast 削除

## 実行タスク

- [ ] F-1〜F-5 各 failure case を `outputs/phase-06/main.md` に表形式で記述
- [ ] 各 failure に対する test coverage 行を Phase 4 test-matrix.md にバックリンク
- [ ] D1 binding fail-fast の判断条件（採用方式別）を確定
- [ ] resolve 失敗時の structured log フォーマット（`event` / `stable_key` / `source` フィールド）を確定
- [ ] Phase 9 schema drift CI gate への入力契約（conflict 数 / unknown 数）を Phase 7 へ引き渡す

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/00-overview.md | 不変条件 #1 / #2 / #3 / #5 |
| 必須 | docs/00-getting-started-manual/specs/08-free-database.md | D1 migration 制約 |
| 必須 | apps/api/src/repository/_shared/builder.ts | 改修対象 |
| 必須 | apps/api/src/repository/responseFields.ts | row shape |
| 参考 | docs/30-workflows/completed-tasks/UT-02A-SECTION-FIELD-MAPPING-METADATA.md | section 7 リスクと対策 |
| 参考 | 03a 仕様書（forms schema sync and stablekey alias queue） | alias queue interface |

## 実行手順

### ステップ 1: failure case 棚卸し
- F-1〜F-5 を Phase 4 test-matrix.md の観測軸（section 重複なし / consent 誤判定なし / label 露出なし / drift 検知 / alias 失敗 fallback）と 1:N で対応付け
- 各 failure の発生条件を既存実装（broad assignment / heuristic kind）と差し替え後の挙動の差分で記述

### ステップ 2: mitigation 設計
- resolve 失敗時の `Result<Canonical, ResolveError>` 型と `ResolveError.code` enum（`unknown_stable_key` / `ambiguous_section` / `binding_missing`）を確定
- unknown バケット（`__unresolved__`）の section_key / field_kind 既定値を確定
- 優先順位（D1 column > static manifest > alias queue）を方式選定（hybrid / static / D1 column）別に表で示す

### ステップ 3: test coverage マッピング
- 各 failure に対し `metadata.test.ts` / `builder.test.ts` のテストケース ID（T-F1-* など）を割り当て
- Phase 4 test-matrix.md に失敗ケースが取りこぼし無く転記されているか cross check

### ステップ 4: 検出経路の確定
- structured log フィールド（`event=schema.resolve.failed` / `stable_key` / `source` / `priority`）を確定
- Phase 9 CI gate（schema drift）への入力フォーマット（JSON: `{conflicts: number, unknowns: number, consentMisclassified: number}`）を確定

### ステップ 5: D1 binding fail-fast 条件確定
- 採用方式が hybrid / D1 column の場合は fail-fast を on
- static manifest 単独の場合は fail-fast を off（binding 不要）
- 判断結果を Phase 5 runbook に追記する依頼を Phase 7 で起票

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | failure × testcase の最終整合 |
| Phase 7 | F-1〜F-5 を AC-1〜10 にトレース |
| Phase 9 | schema drift CI gate 入力契約 / coverage 対象行の確定 |
| Phase 11 | drift-detection-log.md / builder-unit-test-result.txt の取得計画 |

## 多角的チェック観点

- 不変条件 **#1**: schema をコードに固定しない → unknown バケットで隔離（hard-fail しない）
- 不変条件 **#2**: consent キー統一 → F-5 で hard-coded allowlist + warn
- 不変条件 **#3**: `responseEmail` system field → resolver 側で `field_kind=system` 専用パスを通す
- 不変条件 **#5**: D1 直接アクセスは apps/api 内に閉じる → resolver も apps/api 内に配置、`apps/web` から呼ばない

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | F-1 resolve 失敗 mitigation | 6 | pending | unknown バケット設計 |
| 2 | F-2 alias 衝突 mitigation | 6 | pending | 優先順位確定 |
| 3 | F-3 migration rollback | 6 | pending | 採用時のみ |
| 4 | F-4 03a interface drift | 6 | pending | shared 型輸入 |
| 5 | F-5 consent 誤判定 regression | 6 | pending | allowlist 補正 |
| 6 | D1 binding fail-fast 条件 | 6 | pending | 採用方式別 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | Phase 6 主成果物。F-1〜F-5 の表 / mitigation / test coverage / 検出経路を記述 |
| メタ | artifacts.json | phase 6 status を completed に更新 |

## 完了条件

- [ ] F-1〜F-5 すべてに mitigation / test coverage / 検出経路が記述されている
- [ ] D1 binding fail-fast の判断（採用方式別）が確定
- [ ] structured log フォーマットが確定
- [ ] Phase 9 CI gate 入力契約（JSON shape）が確定
- [ ] Phase 4 test-matrix.md とのクロスチェック完了

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 全成果物配置済み
- [ ] 完了条件すべてチェック
- [ ] 異常系（resolve 失敗 / alias 衝突 / migration rollback / interface drift / consent regression）が網羅
- [ ] 次 Phase 引き継ぎ事項記述
- [ ] artifacts.json の phase 6 を completed

## 次 Phase

- 次: Phase 7 (AC マトリクス)
- 引き継ぎ: F-1〜F-5 を AC-1〜10 と不変条件 #1/#2/#3/#5 にトレースする入力、03a/04a/04b 契約への影響表の起点
- ブロック条件: F-1〜F-5 mitigation 未確定なら Phase 7 不可
