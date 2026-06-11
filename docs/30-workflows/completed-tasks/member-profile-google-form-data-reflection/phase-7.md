# Phase 7: カバレッジ確認

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 7 / 13 |
| TASK_ID | `TASK-MEMBER-FORM-DATA-REFLECTION-001` |
| 前提 | Phase 4（テスト作成）・Phase 5（実装）・Phase 6（テスト拡充）完了 |
| 主担当 | Lane A / Lane B |
| 成果物 | `outputs/phase-7/coverage.md` |

## 目的

本タスクで **変更した関数・ブロックに限定** して line / branch カバレッジを実測し、証跡として残す。
広域（パッケージ全体・apps/api 全体）のカバレッジ目標は設定しない。本タスクは「特定の堅牢化・検知ロジックを追加した」スコープであり、変更箇所の網羅性だけを検証対象とする。

> **対象範囲の明示（省略禁止）**
> カバレッジ計測の対象は **Phase 5 で変更した 4 ファイルの変更関数のみ**。`apps/web`（表現層・不変条件 #1 で非接触）、`apps/api/migrations`（AC-G2 で非変更）、その他本タスクで触れていないファイルは **計測対象外**。

## 実行タスク

本 Phase の実行ステップ:

1. 計測対象（変更関数の line/branch）を 1:1 で確定する
2. 計測コマンドを変更関数に絞って実行する（apps/web・migrations は対象外）
3. 実測カバレッジ（異常系分岐含む）を証跡に記録する

### 1. 計測対象の確定（変更関数の line/branch を 1:1 で証跡化）

| # | 対象ファイル | 計測対象シンボル | Lane | 計測する分岐 |
|---|-------------|------------------|------|-------------|
| 1 | `packages/integrations/google/src/forms/mapper.ts` | `deriveStableKey`（named export 化） | A | `label` undefined → `"unknown"` / `STABLE_KEY_BY_LABEL` ヒット / miss → `slugify` の 3 分岐 |
| 2 | `packages/integrations/google/src/forms/mapper.ts` | `STABLE_KEY_BY_LABEL`（named export 化） | A | export 参照（値分岐なし。export 到達のみ） |
| 3 | `packages/integrations/google/src/forms/client.ts` | `rawFormToStableKeyMap`（新規 helper・Phase 5 で配置確定） | A | `items` 空 / `qid` 無 / `title` 無 / 正常 map 化 の 4 分岐 |
| 4 | `packages/integrations/google/src/forms/client.ts` | `defaultQuestionIdMap`(65) / `qidMapFn`(84) の helper 統合後 | A | helper 委譲後の戻り経路 |
| 5 | `apps/api/src/index.ts` | `questionIdToStableKey`(175) fallback マージ | A | schema rows 有（従来）/ schema rows 空 → raw fallback / `{...fromRaw, ...fromSchema}` 優先順の 3 分岐 |
| 6 | `apps/api/src/jobs/sync-forms-responses.ts` | `runResponseSync`(131) の qidMap 空検知ブロック | B | `qidMapSize === 0` true（alert 発火）/ false（既存経路）の 2 分岐 |
| 7 | `apps/api/src/jobs/sync-forms-responses.ts` | `processResponse`(380) / runResponseSync の全 unmapped 検知ブロック | B | `known 0 件 && raw 1件以上`（`fullyUnmappedResponses` +1）/ それ以外 / `fullyUnmappedResponses === processed && >=1`（alert 発火）の 3 分岐 |

> シンボル名・行番号は Phase 1 inventory および Phase 5 実装後の実コードで最終確定する。上表は設計時点の対応表。

### 2. 計測コマンド（変更関数に絞った実行）

```bash
# Lane A: integrations-google パッケージの mapper / client を coverage 付きで実行
mise exec -- pnpm --filter @ubm-hyogo/integrations-google test -- --coverage \
  packages/integrations/google/src/forms/mapper.spec.ts \
  packages/integrations/google/src/forms/client.spec.ts

# Lane A: apps/api の index qidMap fallback（spec 配置先は Phase 5 で確定）
mise exec -- pnpm --filter <api-package> test -- --coverage \
  apps/api/src/index.spec.ts

# Lane B: response sync の検知ガード
mise exec -- pnpm --filter <api-package> test -- --coverage \
  apps/api/src/jobs/sync-forms-responses.contract.spec.ts
```

> `<api-package>` は Phase 1 inventory の `apps/api` package 名で確定する。`--coverage` フラグの正確な渡し方（vitest の `--coverage.include` での対象ファイル絞り込み）は実コマンドで確認する。

### 3. 証跡の記録方式

`outputs/phase-7/coverage.md` に以下を **変更関数単位の表** で記録する。広域サマリー（ファイル全体の % のみ）は不可。

| ファイル:シンボル | line covered/total | branch covered/total | 未到達分岐の有無と理由 |
|-------------------|--------------------|-----------------------|------------------------|
| `mapper.ts:deriveStableKey` | 実測値 | 実測値 | 例: 全分岐到達 / 残: なし |
| `client.ts:rawFormToStableKeyMap` | 実測値 | 実測値 | … |
| `index.ts:questionIdToStableKey` | 実測値 | 実測値 | … |
| `sync-forms-responses.ts:qid 空検知` | 実測値 | 実測値 | … |
| `sync-forms-responses.ts:全 unmapped 検知` | 実測値 | 実測値 | … |

## 参照資料

| 参照 | パス |
|------|------|
| 変更対象一覧 | `index.md` §5 |
| 検知設計（分岐定義） | `phase-2.md` §3（閾値テーブル） |
| Lane A マージ戦略 | `phase-2.md` §2 |
| テスト一覧 | `outputs/phase-4/test-plan.md`, `outputs/phase-6/test-additions.md` |

## 実行手順

1. §1 の計測対象表を実コード（Phase 5 実装後）の行番号で確定する。
2. §2 のコマンドを Lane A → Lane B の順で実行し、coverage レポートを取得する。
3. coverage レポートから §3 の表に **変更関数の line/branch 実測値** を転記する。
4. 未到達分岐があれば、その分岐と「到達不能な理由」または「Phase 6 に test 追加要」を明記する。
5. 変更関数のいずれかが未到達分岐を残す場合は、Phase 6（テスト拡充）へ差し戻し、test を追加してから再計測する。
6. 計測対象外（apps/web / migrations）が diff に含まれていないことを併記する（Phase 9 の正式 gate と二重確認）。

## 統合テスト連携

- Phase 4 で設計した RED test と Phase 6 の追加 test が、§1 の全分岐を踏むことを coverage 実測で裏取りする。
- Lane B の alert 発火分岐は in-memory / mock DB で `SYNC_ALERTS.writeDataPoint` 呼び出しを spy し、発火経路が covered になることを確認する。

## 多角的チェック観点（AIが判断）

- **網羅性 vs スコープ**: 変更関数の branch を 100% に近づけることが目的で、無関係コードのカバレッジ上昇は目的でない。広域目標を立てると「触っていない既存コードの未テスト」が誤って blocker 化する。
- **fail-silent の検知分岐こそ重点**: Lane B の検知は「異常時のみ通る分岐」であり、正常系 test では踏まれない。異常系 test（qidMap 空 / 全 unmapped）で当該分岐を意図的に covered にすることが本 Phase の核心。
- **回帰防止**: schema rows 有（従来経路）の分岐も covered に保ち、fallback 追加で既存挙動が壊れていないことを coverage 上でも担保する。

## サブタスク管理

| ID | 内容 | Lane |
|----|------|------|
| P7-A | Lane A 変更関数（mapper / client / index）の line/branch 実測 | A |
| P7-B | Lane B 検知ブロックの line/branch 実測 | B |
| P7-C | 未到達分岐の判定と差し戻し要否 | A/B |

## 成果物

- `outputs/phase-7/coverage.md`

## 完了条件

- [x] §1 の計測対象が Phase 5 実装後の実行番号で確定している
- [x] 変更した 4 ファイルの変更関数ごとに line / branch 実測値が表に記録されている
- [x] Lane B の 2 検知ブロック（qidMap 空・全 unmapped）の分岐が covered であることが実測で示されている
- [x] 未到達分岐がある場合、理由または Phase 6 差し戻しが明記されている
- [x] 計測対象が変更 4 ファイルに限定され、apps/web / migrations を含まないことが確認されている

## タスク100%実行確認【必須】

- [x] §1〜§3 を完遂した
- [x] `outputs/phase-7/coverage.md` が存在し、変更関数単位の実測値が記録されている

## 次Phase

Phase 8（リファクタリング）— stableKey 解決の二重化解消と qidMap 重複統合の整理を行う。
