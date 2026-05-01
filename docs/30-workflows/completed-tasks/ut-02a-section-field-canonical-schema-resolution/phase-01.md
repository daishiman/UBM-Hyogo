# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-02a-section-field-canonical-schema-resolution |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| Wave | 2+ (03a 完了後着手推奨) |
| Mode | sequential |
| 作成日 | 2026-05-01 |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | pending |

## 目的

`apps/api/src/repository/_shared/builder.ts` の `buildSections()` / `buildFields()` で 02a が暫定採用している 3 種の fallback（broad section assignment / `stable_key` を label 流用 / heuristic field kind）を、canonical schema metadata から解決する `MetadataResolver` に置換するための要件を AC-1〜10 として確定する。`taskType=implementation` / `visualEvidence=NON_VISUAL` を artifacts.json に固定し、不変条件 #1 / #2 / #3 / #5 を観測対象として宣言する。Schema/共有コード の Ownership を本タスクが排他保持することも本 Phase で明示する。

## 真の論点 (true issue)

- **論点 1: resolver の配置場所**
  - 候補 A: `apps/api/src/repository/_shared/metadata.ts` に閉じる（builder と同層、不変条件 #5 と整合）
  - 候補 B: `packages/shared` 側に置く（web からも参照可能）
  - 採用方針: **候補 A**。不変条件 #5（D1 直接アクセスは apps/api に閉じる）と canonical 解決ロジックの DB 隣接性を優先し、web 側へは API レスポンス経由でしか canonical 値を露出させない。
- **論点 2: resolve 失敗 (schema drift) の通知方式**
  - 候補 A: `throw` で repository 呼び出し側に伝搬
  - 候補 B: `Result<T, ResolveError>` 型で明示的に返却
  - 候補 C: `UNKNOWN` セクションへ隔離 + drift log に記録
  - 採用方針: **B + C 併用**。resolver 自体は `Result` 型で失敗を表現し、builder 層は `Result.err` を「未分類 section」へ隔離しつつ drift log に追記。`throw` はテストの可観測性を損なうため不採用。
- **論点 3: 方式選定（D1 column / static manifest / hybrid）**
  - Phase 2 で 3 方式比較を行うが、Phase 1 時点では「**generated static manifest を first choice、03a interface 確定後に hybrid 移行**」を既定路線として記録する。
  - 03a 未完成時の暫定対応: `apps/api/src/repository/_shared/generated/static-manifest.json` を生成物として同梱する。手書き embed は禁止し、生成元 spec、生成日時、再生成コマンド、03a 完成後の廃止条件を Phase 2 / Phase 5 / Phase 12 に記録する。
- **論点 4: 03a 未完成時の運用**
  - StableKey alias queue interface が 03a 側に未確定なため、本タスクは **resolver interface だけ先行定義** し、alias queue 呼び出しはフックポイントとして `null` 実装（pass-through）を許容する。03a 完成後に hybrid 切替を Phase 10 の最終レビューで再評価する。

## 依存境界

| 種別 | 対象 | 引き取るもの | 渡すもの |
| --- | --- | --- | --- |
| 上流 | 02a `apps/api/src/repository/_shared/builder.ts` 現行版 | fallback 削除起点コード | 改修後の builder API |
| 上流 | 03a forms schema sync / StableKey alias queue | canonical schema 供給元 / alias queue interface ドラフト | resolver から呼び出すフック契約 |
| 上流 | 04a `/public/*` view contract | section / field の view 露出形式 | resolver 出力の view 整合 |
| 上流 | 04b `/me/*` view contract | read-only 境界 | resolver 出力の view 整合 |
| 並列参考 | UT-02A-TAG-ASSIGNMENT-QUEUE-MANAGEMENT | 03a 境界共有 | — |
| 下流 | public / member / admin repository chain | — | fallback 削除後の挙動 |
| external gate | 03a interface ドラフト | StableKey alias queue interface | 未確定時は generated static manifest baseline で代替実装 |

## 価値とコスト

- **初回価値**: builder.ts の 3 種 fallback 削除により、不変条件 #1 / #2 / #3 を恒久的に資産化。schema drift を repository 層で検知可能にし、public / member / admin の 3 view が同一 metadata から導出される運用基盤を確立する。
- **初回で払わないコスト**: Google Forms API からの schema 同期実装本体（03a 責務）、admin-managed schema diff UI（04c 責務）、Visual evidence（NON_VISUAL タスクのため screenshot 取得は対象外）。
- **トレードオフ**: 03a 完成前に着手するため、static manifest 方式での先行実装と 03a 完成後の hybrid 切替という 2 段階移行を許容する。Phase 10 で再評価ゲートを設ける。

## 4 条件評価

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | builder.ts の 3 種 fallback を 0 行に削除し canonical 化できるか | PASS | AC-2 で `grep` 件数を quantitative 化、AC-3〜AC-5 で正規化品質を保証 |
| 実現性 | 03a 未完成下でも resolver interface を先行定義できるか | PASS | generated static manifest baseline で代替実装可能。alias queue フックは null 実装許容 |
| 整合性 | 04a / 04b の view contract と矛盾しないか | PASS | Phase 3 review に 04a / 04b 担当を含めること、Phase 7 AC マトリクスで再確認 |
| 運用性 | NON_VISUAL タスクとして evidence 取得が再現可能か | PASS | builder unit test + drift detection log + 3 view parity check の 3 種で代替 evidence 確立 |

## Schema / 共有コード Ownership 宣言

| 領域 | Owner | 編集権 | 03a / 04a / 04b との関係 |
| --- | --- | --- | --- |
| `apps/api/src/repository/_shared/builder.ts` | 本タスク | 排他保持 | 03a / 04a / 04b は read-only |
| `apps/api/src/repository/_shared/metadata.ts`（新設） | 本タスク | 排他保持 | 03a alias queue interface を import するのみ |
| `apps/api/src/repository/responseFields.ts` / `responseSections.ts` | 02a 親（読み取り改修のみ本タスク許容） | 行型変更は本タスクが migration 含めて responsibility | — |
| 03a 側の schema sync row writer | 03a タスク | 03a 排他 | 本タスクは consumer。書き込み責務は持たない |
| `packages/shared` の `field_kind` enum / zod | 本タスクが追従計画を Phase 2 で策定 | 追従コード commit は本タスク | enum 値拡張は本タスク内で完結 |

## 観測対象不変条件

- **#1** 実フォームの schema をコードに固定しすぎない → resolver 経由で canonical 集約することで遵守確認
- **#2** consent キーは `publicConsent` / `rulesConsent` に統一 → resolver の `resolveFieldKind` で恒久確定
- **#3** `responseEmail` はフォーム項目ではなく system field → resolver が `field_kind=system` として扱う境界線を明示
- **#5** D1 への直接アクセスは `apps/api` に閉じる → resolver も apps/api 内に配置

## 実行タスク

- [ ] AC-1〜10 を quantitative に確定（index.md AC をそのまま採用）
- [ ] 真の論点 4 件と非採用案を `outputs/phase-01/main.md` に記録
- [ ] Schema/共有コード Ownership 宣言を main.md に転記
- [ ] artifacts.json の `metadata.visualEvidence=NON_VISUAL` を Phase 1 完了条件として fix
- [ ] 4 条件評価の根拠を埋める
- [ ] Phase 2 への open question（resolver interface signature / alias queue フック点 / migration 採否判断条件）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/01-api-schema.md | フォーム schema / 項目定義（canonical 源泉） |
| 必須 | docs/00-getting-started-manual/specs/00-overview.md | 不変条件 #1 / #2 / #3 / #5 |
| 必須 | docs/00-getting-started-manual/specs/08-free-database.md | D1 構成 / migration 制約 |
| 必須 | docs/30-workflows/completed-tasks/UT-02A-SECTION-FIELD-MAPPING-METADATA.md | 起票元 unassigned-task spec |
| 必須 | apps/api/src/repository/_shared/builder.ts | 改修対象 |
| 必須 | apps/api/src/repository/responseFields.ts | row shape 確認元 |
| 必須 | apps/api/src/repository/responseSections.ts | row shape 確認元 |

## 実行手順

### ステップ 1: 起票元 spec の AC / リスク引き取り

- `UT-02A-SECTION-FIELD-MAPPING-METADATA.md` の §5 完了条件チェックリスト・§6 検証方法・§7 リスク表を本 Phase の AC-1〜10 に対応付ける。
- 起票元 §9 苦戦箇所の「再発防止」を、Schema/共有コード Ownership 宣言の根拠として転記。

### ステップ 2: AC quantitative 化

index.md AC-1〜10 をそのまま固定（編集なし）。各 AC の検証手段を記録:

- AC-1: `metadata.ts` に `MetadataResolver` interface 存在 + 既定実装存在
- AC-2: `stable_key` 参照自体は resolver 入力として許可し、旧推測 fallback 分岐（`stable_key` label 流用 / heuristic kind / broad assignment）が 0 件
- AC-3〜AC-5: builder.test.ts のテスト通過
- AC-6: drift signal が `Result.err({ kind: "unknownStableKey" })` で表現
- AC-7: alias queue フックポイントの code reference が metadata.ts 内に存在
- AC-8: migration 採用時のみ。`bash scripts/cf.sh d1 migrations list` で確認
- AC-9: typecheck / lint / unit test pass
- AC-10: implementation-guide.md に契約引き渡し節が存在

### ステップ 3: 4 条件評価と Phase 2 引き継ぎ

- 4 条件評価表を埋める。
- Phase 2 への open question を明示:
  - resolver interface signature: `resolveSectionKey(stableKey, ctx?): Result<SectionKey, ResolveError>` で良いか
  - alias queue フック挿入点: `resolveSectionKey` の冒頭か末尾か
  - D1 migration 採否判断条件: 03a 側が D1 に書き込む方針を採るか static manifest を採るか

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | resolver interface signature / 3 方式比較 / Ownership 宣言 |
| Phase 3 | 04a / 04b 担当との review 整合 |
| Phase 4 | 5 観測軸 (section / consent / label / drift / alias fallback) 設計 |
| Phase 7 | AC × 不変条件 × 03a/04a/04b 契約のトレース |
| Phase 11 | NON_VISUAL 代替 evidence (builder unit test / drift log / 3 view parity) |

## 多角的チェック観点

- 不変条件 **#1**: schema 固定化回避 — resolver 経由集約で遵守
- 不変条件 **#2**: consent キー統一 — `resolveFieldKind` で恒久確定
- 不変条件 **#3**: `responseEmail` system field 境界 — resolver で `system` kind 明示
- 不変条件 **#5**: D1 アクセスの apps/api 閉じ込め — metadata.ts も apps/api 配下

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 起票元 spec AC 引き取り | 1 | pending | UT-02A-SECTION-FIELD-MAPPING-METADATA.md |
| 2 | AC-1〜10 quantitative 化 | 1 | pending | index.md AC をそのまま採用 |
| 3 | Schema/共有コード Ownership 宣言 | 1 | pending | 03a / 04a / 04b との境界明示 |
| 4 | 4 条件評価 | 1 | pending | — |
| 5 | artifacts.json visualEvidence=NON_VISUAL fix | 1 | pending | 既に固定済みだが Phase 1 完了条件として再確認 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | Phase 1 主成果物（真の論点 / AC / Ownership / 4 条件） |
| メタ | artifacts.json | phases[0].status を pending→completed に更新 |

## 完了条件

- [ ] AC-1〜10 quantitative 化済み
- [ ] 真の論点 4 件と非採用案記録
- [ ] Schema/共有コード Ownership 宣言記載
- [ ] 4 条件評価すべて PASS
- [ ] artifacts.json の `metadata.visualEvidence=NON_VISUAL` を再確認
- [ ] Phase 2 への open question 明記

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 全成果物配置済み
- [ ] 完了条件すべてチェック
- [ ] 異常系（03a interface 不在 / migration 失敗 / drift 検知漏れ）も網羅
- [ ] 次 Phase 引き継ぎ事項記述
- [ ] artifacts.json の phase 1 を completed に更新

## 次 Phase

- 次: Phase 2 (設計)
- 引き継ぎ: resolver interface signature 案 / 3 方式比較表 / 03a alias queue フック設計 / Schema/共有コード Ownership 宣言
- ブロック条件: AC-1〜10 quantitative 化未完または Ownership 宣言未記載なら Phase 2 不可
