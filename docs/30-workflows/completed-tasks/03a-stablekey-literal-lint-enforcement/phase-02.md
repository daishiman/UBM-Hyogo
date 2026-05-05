# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03a-stablekey-literal-lint-enforcement |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| Wave | 8b (lint config follow-up) |
| Mode | sequential |
| 作成日 | 2026-05-01 |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| 状態 | pending |

## 目的

Phase 1 で確定した AC-1〜7 と 5 論点を受け、stableKey 文字列リテラル禁止の検出方式・allow-list 表現・例外境界・CI 統合点・エラーメッセージ仕様を確定する。本 Phase の成果物は、Phase 3 で 3 案比較の入力となり、Phase 5 runbook の実装入力となる。

## 設計方針サマリ

- **検出方式**: ESLint custom rule を一次案、ts-morph script を二次案とする（Phase 3 で正式決定）。一次案を選ぶ根拠は、(1) IDE 即時 feedback（VSCode ESLint 拡張で squiggle）、(2) monorepo lint pipeline への自然統合、(3) `@typescript-eslint/utils` AST で十分な精度が得られること。
- **判定ロジック**: 「正本由来の有限集合との完全一致」を一次方式とする。具体的には `packages/shared/src/zod/field.ts` から export される stableKey enum / 定数集合（または Zod schema literal union）と完全一致する文字列リテラルが、AST 上 `Literal` ノードとして許可外モジュールに出現したら error 報告。
- **allow-list 表現**: filepath glob を一次表現とする（package name や declared origin module 表現は実装時に複雑化するため二次案に留める）。
- **例外境界**: `*.test.ts(x)` / `__fixtures__/**` / `__tests__/**` / `migrations/seed/**` / `docs/**` の 5 glob を override 対象とする。
- **CI 統合**: 既存 lint job への統合を一次案、新規 lint job 追加は不要（Phase 8 で確認）。

## allow-list 仕様（`outputs/phase-02/allow-list-spec.md`）

| 種別 | 値 | 役割 |
| --- | --- | --- |
| 正本（必須） | `packages/shared/src/zod/field.ts` | stableKey enum / Zod schema の正本 |
| 正本（必須） | `packages/integrations/google/src/forms/mapper.ts` | Google Form 側 mapping の正本 |
| 候補（要確認） | `packages/shared/src/zod/section.ts` | section 単位 stableKey が存在する場合 |
| 候補（要確認） | `packages/integrations/google/src/forms/schema.ts` | 同 mapper 系 |
| 例外 | `**/*.test.ts`, `**/*.test.tsx` | 単体テストで正本値を assert する目的 |
| 例外 | `**/__fixtures__/**`, `**/__tests__/**` | 共有 fixture |
| 例外 | `**/migrations/seed/**` | seed データ |
| 例外 | `docs/**` | ドキュメント上の例示 |

allow-list 設定ファイルの配置候補は次の 3 つで、Phase 3 で決定:

1. `eslint.config.{ts,js}` 内に rule オプションとして直接記述
2. `packages/eslint-config/stablekey-allowlist.json` 共通配置（複数 app から再利用）
3. `tools/lint/stablekey-allowlist.json` 専用配置

monorepo 全体 1 箇所参照を優先し、wave 8b lint config 側の方針に追従する。

## rule 検出仕様（`outputs/phase-02/rule-detection-spec.md`）

### rule ID（仮）
`@ubm-hyogo/no-stablekey-literal`

### 検出ロジック（疑似コード、実装はしない）

```
on Literal node:
  if node.value is string and node.value matches known_stablekey_set:
    if file path matches any allow-list glob: skip
    if file path matches any exception glob: skip
    report error: "stableKey '<value>' must be imported from '@ubm-hyogo/shared/zod/field' (or other allow-list module). Direct literals violate invariant #1 (AC-7)."
```

### `known_stablekey_set` の取得

- 一次方式: build time に `packages/shared/src/zod/field.ts` から export された literal union / enum を inspect して有限集合を構築（`@typescript-eslint/parser` の type info or ts-morph）
- フォールバック: 設定ファイル（json）に既知 stableKey を列挙する手動 manifest（CI で manifest と正本の drift を別 job で監査）

### エラーメッセージ要件

- 違反 stableKey 値を含む（どの key が直書きされたか即判別）
- 解決策の提示（正本モジュールから import せよ）
- 不変条件 #1 / AC-7 への参照を含む
- IDE 上で 1 行に収まる長さ（80 文字目安）

## 例外ポリシー（明文化）

| 例外対象 | glob | 理由 |
| --- | --- | --- |
| 単体テスト | `**/*.test.ts`, `**/*.test.tsx` | 正本値との一致を assert する目的 |
| 共有 fixture | `**/__fixtures__/**` | テスト固定値 |
| テストヘルパ | `**/__tests__/**` | テスト用 utility |
| migration seed | `**/migrations/seed/**` | 初期 D1 データ投入 |
| ドキュメント | `docs/**` | 例示・仕様記述 |

例外境界外で stableKey を扱う必要が出た場合、必ず allow-list モジュールから import する。新規正本モジュールを追加する場合は本 workflow の Phase 12 を経由して allow-list を更新する。

## CI 統合点

- `.github/workflows/` 上の既存 lint job（`pnpm lint` 配下）に統合する。
- 新規 job は追加せず、`pnpm lint` の終了コード非 0 で fail させる（既存 gate の踏襲）。
- pre-commit / lefthook 連携は wave 8b lint config の方針に従う。pre-push hook での lint gate は本タスク scope 外。

## 不変条件 → 観測項目マッピング

| 不変条件 | 観測項目 | evidence |
| --- | --- | --- |
| #1 | stableKey が正本モジュール経由のみで参照される | lint pass log（既存コード）/ 違反 fixture fail log |
| #2 | consent キー（`publicConsent` / `rulesConsent`）の重複防止 | 同 rule の射程に含めるかを本 Phase で判定（含めない場合は別 rule で対応） |
| #4 | apps/api と apps/web の境界整合 | rule が両 app に等しく適用されることの lint 走行確認 |

本タスクでは consent 系を rule 射程に含めない（stableKey 集合とは別 enum）。consent 重複防止は別タスクで扱う旨を Phase 12 unassigned-task-detection に記録する。

## Schema / 共有コード Ownership 宣言

- 本タスクは ESLint custom rule 仕様策定に閉じる。`_shared/` の編集は **行わない**。
- 正本モジュール（`packages/shared/src/zod/field.ts` 等）の export 構造に変更が必要になった場合、別 PR で 03a 親 workflow と整合させる（本タスクで先行変更しない）。

## 実行タスク

- [ ] `outputs/phase-02/main.md` に設計サマリ記述
- [ ] `outputs/phase-02/allow-list-spec.md` で allow-list を確定
- [ ] `outputs/phase-02/rule-detection-spec.md` で検出ロジック疑似コードを確定
- [ ] CI 統合点（既存 lint job 踏襲）の確定
- [ ] エラーメッセージ要件の確定
- [ ] consent 系射程外宣言を Phase 12 unassigned-task-detection に予約

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/task-03a-stablekey-literal-lint-001.md | 元 unassigned-task spec |
| 必須 | docs/00-getting-started-manual/specs/01-api-schema.md | stableKey 仕様 |
| 必須 | packages/shared/src/zod/field.ts | 正本 #1 |
| 必須 | packages/integrations/google/src/forms/mapper.ts | 正本 #2 |
| 参考 | apps/api/eslint.config.* | lint 設定統合先 |
| 参考 | apps/web/eslint.config.* | lint 設定統合先 |

## 実行手順

### ステップ 1: allow-list spec 確定
- 正本 2 件 + 候補 2 件 + 例外 5 glob を `allow-list-spec.md` に固定。
- 配置候補 3 案を列挙し Phase 3 で決定する旨を明記。

### ステップ 2: rule 検出 spec 確定
- 疑似コード、`known_stablekey_set` 取得方式（一次 + フォールバック）、エラーメッセージ要件を `rule-detection-spec.md` に記述。

### ステップ 3: CI 統合点と例外境界
- 既存 lint job 踏襲を確定。
- 例外 5 glob の境界外 use case が出た場合の運用フロー（allow-list 追加 PR）を記述。

### ステップ 4: handoff
- Phase 3 へ alternative 3 案候補（custom rule / ts-morph / runtime guard）を渡す。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 3 | 3 案比較の入力 |
| Phase 4 | rule 仕様 → test matrix |
| Phase 5 | rule 仕様 → 実装 runbook |
| Phase 6 | 違反 fixture spec の入力 |
| Phase 7 | apps/web / apps/api / packages/* 全域での走行範囲 |

## 多角的チェック観点

- 検出精度: 既知 stableKey set との完全一致なので false positive 極小
- 開発者 DX: IDE 即時 feedback / 明確なエラーメッセージ
- bypass 監査: `eslint-disable` コメント濫用を Phase 9 gate
- パフォーマンス: AST 走査時間（Phase 8 で計測）
- 移行性: warn → error の段階移行は不要（Phase 1 で error 即時化を選択）
- monorepo 整合: rule が apps/web / apps/api / packages/* すべてで等しく適用

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | allow-list spec | 2 | pending |
| 2 | rule 検出 spec | 2 | pending |
| 3 | CI 統合点確定 | 2 | pending |
| 4 | エラーメッセージ要件 | 2 | pending |
| 5 | consent 射程外宣言予約 | 2 | pending |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/main.md | Phase 2 主成果物 |
| 仕様 | outputs/phase-02/allow-list-spec.md | allow-list 確定版 |
| 仕様 | outputs/phase-02/rule-detection-spec.md | 検出ロジック疑似コード |

## 完了条件

- [ ] allow-list 確定（正本 + 候補 + 例外）
- [ ] rule 検出ロジック疑似コード確定
- [ ] CI 統合点確定（既存 lint job 踏襲）
- [ ] エラーメッセージ要件確定
- [ ] consent 系射程外を Phase 12 unassigned に予約

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 異常系（false positive / 例外境界濫用 / 設定 drift）も網羅
- [ ] 次 Phase 引き継ぎ事項記述
- [ ] artifacts.json の phase 2 を completed

## 次 Phase

- 次: Phase 3 (設計レビュー)
- 引き継ぎ: 3 案候補（A: ESLint custom rule、B: ts-morph script、C: runtime guard）と PASS / MINOR / MAJOR 判定軸（価値性 / 実現性 / 整合性 / 運用性 / DX）
