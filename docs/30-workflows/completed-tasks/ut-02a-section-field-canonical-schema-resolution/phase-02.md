# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-02a-section-field-canonical-schema-resolution |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| Wave | 2+ |
| Mode | sequential |
| 作成日 | 2026-05-01 |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| 状態 | pending |

## 目的

Phase 1 で確定した要件と Ownership 宣言に基づき、`MetadataResolver` interface の signature、3 方式（D1 column / static manifest / hybrid）の比較と選定基準、03a の StableKey alias queue 呼び出しフックの placement、`@repo/shared` 既存 enum / zod 追従計画を設計する。サブ outputs として resolver-interface.md / method-comparison.md / ownership-declaration.md の見出し構造を確定する。

## 真の論点 (true issue)

- Phase 1 真の論点を引用。Phase 2 では以下を具体化する:
  - resolver interface signature の確定（`Result<T, E>` 型 vs throw、context 引数の有無）
  - 3 方式の選定基準（reload 頻度 / admin override / migration コスト / 03a 結合度）
  - alias queue フック挿入点（`resolveSectionKey` 内 / `resolveLabel` 内 / 上位レイヤー）
  - 仕様語 ↔ 実装語対応表（旧推測 fallback ↔ resolver / broad assignment ↔ canonical / heuristic kind ↔ resolved kind / generated static manifest baseline ↔ 03a 未完成時の生成済み正本）

## 依存境界

| 種別 | 対象 | 引き取るもの | 渡すもの |
| --- | --- | --- | --- |
| 上流 | Phase 1 main.md | AC-1〜10 / Ownership 宣言 / 真の論点 | — |
| 上流 | 03a interface ドラフト | StableKey alias queue API | resolver から呼び出すフック契約案 |
| 上流 | 04a / 04b view contract | section / field 露出形式 | resolver 出力の view 整合方針 |
| 上流 | `packages/shared` 既存 `field_kind` enum / zod | 現行 enum 値 | enum 拡張提案 |
| 下流 | Phase 3 review | 設計成果 | review 観点 |

## 価値とコスト

Phase 1 から引用。Phase 2 では設計工数のみコスト計上（実装着手前）。

## 4 条件評価

Phase 1 の 4 条件評価を引用。Phase 2 では設計成果が 4 条件を維持するかを review-record.md (Phase 3) で再評価する。

## 実行タスク

- [ ] `MetadataResolver` interface の signature 確定（`resolveSectionKey` / `resolveFieldKind` / `resolveLabel`）
- [ ] 3 方式比較表（価値 / 実現 / 整合 / 運用 + 03a 結合度 / migration コスト）
- [ ] 選定方式の Phase 2 時点 first choice と 03a 完成後の切替条件
- [ ] 03a alias queue 呼び出しフックの placement 設計
- [ ] 既存 `field_kind` enum と shared zod schema の追従計画
- [ ] **仕様語 ↔ 実装語対応表**（必須項目）
- [ ] **追従対象一覧**（必須項目: backend route / web client / shared zod / type / docs）
- [ ] サブ outputs ファイルの見出し定義

## 仕様語 ↔ 実装語 対応表（Phase 2 必須項目）

| 仕様語 | 実装語 | 配置 |
| --- | --- | --- |
| canonical schema metadata | `MetadataResolver` interface | `apps/api/src/repository/_shared/metadata.ts` |
| section membership | `resolveSectionKey(stableKey)` | metadata.ts |
| field kind 正規化 | `resolveFieldKind(stableKey)` | metadata.ts |
| label 正規化 | `resolveLabel(stableKey, locale?)` | metadata.ts |
| schema drift 検知 | `Result.err({ kind: "unknownStableKey" })` | metadata.ts |
| 未分類 section 隔離 | `UNKNOWN_SECTION_KEY` 定数 | metadata.ts |
| 03a alias queue フック | `aliasQueueAdapter?: AliasQueueAdapter` | metadata.ts |
| generated static manifest baseline | `generated/static-manifest.json` | 03a 未完成時の生成物。手書き embed 禁止 |
| broad assignment 削除 | `buildSections()` resolver 化 | builder.ts |
| heuristic kind 削除 | `buildFields()` resolver 化 | builder.ts |
| consent kind 確定 | `field_kind = "consent"` enum 値 | `@repo/shared` zod |

## 追従対象一覧（Phase 2 必須項目）

| 種別 | 対象パス | 追従内容 | 担当 Phase |
| --- | --- | --- | --- |
| backend route | `apps/api/src/routes/public/*` `apps/api/src/routes/me/*` | resolver 出力に view を整合 | 04a / 04b（本タスクは整合確認のみ） |
| web client | `apps/web/src/lib/api-client/*` | section/field 表示ロジックの canonical 化 | 04a / 04b 連携 |
| shared zod | `packages/shared/schema/responseField.ts`（仮） | `field_kind` enum に `system` / `consent` 等を追加 | 本タスク |
| shared type | `packages/shared/types/sectionKey.ts`（仮） | `SectionKey` 型 export | 本タスク |
| docs | `docs/00-getting-started-manual/specs/01-api-schema.md` | canonical schema 章を追記 | Phase 12 |

## 3 方式比較サマリ（method-comparison.md 見出し定義）

| 軸 | D1 column 方式 | static manifest 方式 | hybrid 方式 |
| --- | --- | --- | --- |
| 価値性 | admin override 最強 | 03a 未完成でも先行可能。生成元と期限を持つ | 両者の中間 |
| 実現性 | migration 必要 | migration 不要 | migration 必要（部分的） |
| 整合性 | 03a 書き込み必須 | 03a 不要 | 03a と段階的整合 |
| 運用性 | reload 頻度に強い | rebuild 必要 | reload + rebuild 併用 |
| 03a 結合度 | 高 | 低 | 中 |
| migration コスト | 高 | 0 | 中 |
| Phase 1 first choice | △ | ◎ | △ (03a 完成後再評価) |

## resolver-interface.md 見出し定義

1. interface 全文（TypeScript 疑似コード）
2. `Result<T, E>` 型定義（`@repo/shared` 既存型の流用 or 新規定義）
3. `ResolveError` の kind 列挙（`unknownStableKey` / `aliasFailed` / `manifestStale`）
4. `AliasQueueAdapter` interface（03a への hook 契約）
5. context 引数（locale / tenant / view scope）の必要性検討
6. 既定実装 (`GeneratedManifestResolver`) の skeleton
7. `generated/static-manifest.json` の生成元 spec / 生成日時 / 再生成コマンド / 03a 完成後の廃止条件

## ownership-declaration.md 見出し定義

1. Phase 1 で宣言した排他保持領域の再掲
2. 03a / 04a / 04b との責務分割の明文化
3. `packages/shared` への enum 追加 commit の責任所在
4. migration ファイル ownership（採用時のみ）
5. 競合発生時のエスカレーション経路（Phase 3 review に持ち込む）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01/main.md | Phase 1 要件 / Ownership |
| 必須 | apps/api/src/repository/_shared/builder.ts | 改修対象現行版 |
| 必須 | apps/api/src/repository/responseFields.ts | row shape |
| 必須 | apps/api/src/repository/responseSections.ts | row shape |
| 必須 | docs/00-getting-started-manual/specs/01-api-schema.md | canonical schema 源泉 |
| 参考 | 03a タスク仕様書 | alias queue interface ドラフト |

## 実行手順

### ステップ 1: interface signature の確定

- `MetadataResolver` の 3 メソッド signature を Phase 1 open question に基づき確定。
- `Result<T, E>` 型の定義配置を `metadata.ts` 内 vs `packages/shared` で判断。

### ステップ 2: 3 方式比較

- 上記比較表を method-comparison.md に展開。
- Phase 1 first choice = generated static manifest baseline を確定し、03a 完成後の hybrid 切替条件を Phase 10 への引き継ぎ事項として記録。

### ステップ 3: alias queue フック設計

- `AliasQueueAdapter` interface を resolver-interface.md に明記。
- 挿入点は `resolveSectionKey` 失敗時に dryRun / apply を呼び出すフローとする（03a 完成後に有効化）。

### ステップ 4: shared zod / enum 追従計画

- `field_kind` enum に `system` / `consent` 値の追加可否を Phase 2 時点で判断。
- 追加が必要な場合は本タスクで shared 側を更新し、Phase 5 runbook に手順を含める。

### ステップ 5: サブ outputs 見出し確定

- resolver-interface.md / method-comparison.md / ownership-declaration.md の 3 ファイルの見出しを上記定義通りに固定。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 3 | 設計レビュー |
| Phase 4 | テスト戦略との signature 整合 |
| Phase 5 | runbook / migration plan |
| Phase 8 | DRY 化 (resolver helper 抽出) |

## 多角的チェック観点

- 不変条件 #1 / #2 / #3 / #5 が interface 設計で観測可能か
- 03a / 04a / 04b の責務境界が侵食されていないか
- shared zod / enum 拡張が他タスクの compile を壊さないか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | interface signature 確定 | 2 | pending | resolver-interface.md |
| 2 | 3 方式比較 | 2 | pending | method-comparison.md |
| 3 | Ownership 宣言再掲 | 2 | pending | ownership-declaration.md |
| 4 | alias queue フック設計 | 2 | pending | resolver-interface.md §4 |
| 5 | shared zod / enum 追従計画 | 2 | pending | main.md |
| 6 | 仕様語↔実装語対応表 | 2 | pending | main.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/main.md | Phase 2 主成果物 |
| ドキュメント | outputs/phase-02/resolver-interface.md | MetadataResolver interface 設計 |
| ドキュメント | outputs/phase-02/method-comparison.md | 3 方式比較と選定 |
| ドキュメント | outputs/phase-02/ownership-declaration.md | Schema/共有コード Ownership |
| メタ | artifacts.json | phase 2 status |

## 完了条件

- [ ] resolver interface signature 確定
- [ ] 3 方式比較完了 + first choice 確定
- [ ] alias queue フック placement 確定
- [ ] shared zod / enum 追従計画記載
- [ ] 仕様語↔実装語対応表 記載
- [ ] 追従対象一覧 記載
- [ ] サブ outputs 3 ファイルの見出し定義完了

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 全成果物配置済み
- [ ] 完了条件すべてチェック
- [ ] 異常系（03a interface 競合 / shared enum 拡張競合）も網羅
- [ ] 次 Phase 引き継ぎ事項記述
- [ ] artifacts.json の phase 2 を completed に更新

## 次 Phase

- 次: Phase 3 (設計レビュー)
- 引き継ぎ: 設計 4 ファイル一式 / 04a / 04b 担当への review 依頼 / first choice 方式
- ブロック条件: interface signature 未確定または 3 方式比較未完なら Phase 3 不可
