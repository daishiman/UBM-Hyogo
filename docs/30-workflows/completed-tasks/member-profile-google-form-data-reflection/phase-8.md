# Phase 8: リファクタリング

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 8 / 13 |
| TASK_ID | `TASK-MEMBER-FORM-DATA-REFLECTION-001` |
| 前提 | Phase 7（カバレッジ確認）完了 = 変更関数の分岐が covered |
| 主担当 | Lane A / Lane B |
| 成果物 | `outputs/phase-8/refactor.md` |

## 目的

GREEN を保ったまま、本タスクで導入した堅牢化ロジックの **二重化・重複を解消** する。
新規 test 追加は行わず、Phase 7 で covered になった分岐を壊さない範囲で構造を整える（refactor = 振る舞い不変）。

中心課題は 2 点:
1. **stableKey 解決の二重化解消**: `deriveStableKey`（生ラベル正規化）を唯一の正本とし、schema_questions lookup は「優先上書き」に格下げする（phase-2 §2 の責務一元化を実装上も貫徹）。
2. **qidMap 生成ロジックの重複統合**: `client.ts` の `defaultQuestionIdMap`(65-73) と inline `qidMapFn`(84-91) が同一処理を 2 箇所に複製しているため、`rawFormToStableKeyMap` helper に統合する。

## 実行タスク

### 1. リファクタリング項目（対象 / Before / After / 理由）

| # | 対象 | Before | After | 理由 |
|---|------|--------|-------|------|
| R-1 | `client.ts:defaultQuestionIdMap`(65-73) | `raw.items` を走査し `map[qid] = item.title`（生ラベル・`find(it=>it===item)` の冗長探索付き） | `rawFormToStableKeyMap(raw)` を呼ぶだけに縮退 | 生ラベル格納は schema 側 `deriveStableKey` と非対称（潜在バグ）。helper 委譲で正規化を強制し、`find` の冗長探索を除去 |
| R-2 | `client.ts:qidMapFn` inline(84-91) | `deps.questionIdToStableKey ?? ((raw) => { ...生ラベル map... })` の inline 複製 | `deps.questionIdToStableKey ?? rawFormToStableKeyMap` | R-1 と同一ロジックの 2 箇所複製を解消（DRY）。default も正規化経路へ統一 |
| R-3 | `rawFormToStableKeyMap` の配置 | （Phase 5 で暫定配置） | `mapper.ts` または `client.ts` の named export に確定（client/index 双方から import 可能な単一定義） | TECH-M-01 の解決。複数箇所共有のため単一 export に集約（phase-2 §2 / phase-3 TECH-M-01） |
| R-4 | `deriveStableKey` / `STABLE_KEY_BY_LABEL` の参照 | mapper 内 module-private + 各所で生ラベル独自処理 | `mapper.ts` の named export を `client.ts` / `index.ts` が共有参照 | stableKey 解決の正本を `deriveStableKey` に一元化。二重化解消（phase-2 §multi-angle「責務境界」） |
| R-5 | `apps/api/src/index.ts:questionIdToStableKey` の fallback 構築 | （Phase 5 の素朴な inline 実装） | `rawFormToStableKeyMap(raw)` を呼び `{...fromRaw, ...fromSchema}` でマージ。inline ループを残さない | client / index で同一の raw→stableKey 導出を共有し、対称性を構造で保証 |

> 各 R 項目は **振る舞い不変**（Phase 7 の coverage で covered になった分岐の入出力を変えない）。型・行番号は Phase 5 実装後の実コードで確定する。

### 2. やらないこと（過剰リファクタの抑止）

- 新規 primitive / 抽象レイヤの追加はしない（既存 `mapper.ts` / `client.ts` の export を増やすのみ）。
- `mapFormResponse` / `mapFormSchema` 本体ロジックの書き換えはしない（export 追加と helper 委譲に留める）。
- Lane B の検知ブロックは構造変更しない（Phase 5 で確定した形を維持。重複が無いため対象外）。
- `apps/web`（不変条件 #1）・`migrations`（AC-G2）には一切触れない。

### 3. リファクタ後の不変検証

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/integrations-google test mapper client
mise exec -- pnpm --filter <api-package> test sync-forms-responses index
```

全 test が Phase 7 と同一に GREEN であること（振る舞い不変の確認）。

## 参照資料

| 参照 | パス |
|------|------|
| 二重化解消の責務設計 | `phase-2.md` §2 / §多角的チェック観点「責務境界」 |
| TECH-M-01（helper 配置） | `phase-3.md` §3 MINOR 追跡 |
| 変更対象一覧 | `index.md` §5 / §6 主要シグネチャ |
| Before の実コード | `client.ts:65-91`, `mapper.ts:53-92`, `apps/api/src/index.ts:175-186` |

## 実行手順

1. R-3 で `rawFormToStableKeyMap` の最終配置（`mapper.ts` / `client.ts`）を 1 つに確定し、TECH-M-01 を解決する。
2. R-1 / R-2 で `client.ts` の 2 箇所の qidMap 生成を helper 委譲に統合する。
3. R-4 / R-5 で `index.ts` の fallback 構築を helper 経由に揃え、stableKey 解決の正本を `deriveStableKey` に一元化する。
4. §3 の検証コマンドで全 test GREEN（振る舞い不変）を確認する。
5. `outputs/phase-8/refactor.md` に R-1〜R-5 の対象/Before/After/理由テーブルと検証結果を記録する。

## 統合テスト連携

- リファクタは Phase 7 の test 集合をそのまま再実行して GREEN を確認する（test 追加・変更なし）。
- helper 統合後、`client.ts` default qidMap・`index.ts` fallback・`mapper.ts` schema 側が **同一の `deriveStableKey` を通る** ことを既存 test の入出力一致で確認する。

## 多角的チェック観点（AIが判断）

- **整合性（最重要）**: schema 側（`mapFormSchema` の `deriveStableKey`）と response 側（client default / index fallback）が同一正規化関数を共有することで、非対称由来の潜在バグ class を構造的に根絶する。
- **DRY**: `client.ts` の 2 箇所複製は典型的なコピペ二重化。1 helper への統合は最小差分で保守性を上げる。
- **過剰設計の回避**: 4 条件の「実現性」を優先し、抽象レイヤ新設ではなく既存関数の export + 委譲に留める。

## サブタスク管理

| ID | 内容 | Lane |
|----|------|------|
| P8-A | `rawFormToStableKeyMap` 配置確定（TECH-M-01 解決） | A |
| P8-B | `client.ts` 2 箇所の qidMap 生成統合（R-1/R-2） | A |
| P8-C | `index.ts` fallback の helper 委譲（R-4/R-5） | A |
| P8-D | 振る舞い不変の test 再実行確認 | A/B |

## 成果物

- `outputs/phase-8/refactor.md`

## 完了条件

- [x] R-1〜R-5 が対象/Before/After/理由テーブルで記録されている
- [x] `rawFormToStableKeyMap` の配置が 1 箇所に確定し TECH-M-01 が解決済み
- [x] `client.ts` の qidMap 生成重複（2 箇所）が helper に統合されている
- [x] stableKey 解決の正本が `deriveStableKey` に一元化されている（schema / client / index が同一関数を参照）
- [x] Phase 7 の全 test が GREEN を維持（振る舞い不変）
- [x] apps/web / migrations に変更が無い

## タスク100%実行確認【必須】

- [x] §1〜§3 を完遂した
- [x] `outputs/phase-8/refactor.md` が存在する
- [x] typecheck / lint / test が GREEN

## 次Phase

Phase 9（品質保証）— typecheck/lint/test/表現層非接触/migration 非変更を一括判定し、validation matrix を実行する。
