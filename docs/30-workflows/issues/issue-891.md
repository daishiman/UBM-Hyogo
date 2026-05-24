# [#891] "[issue-827-followup-001-displayable-kinds-exhaustiveness-guard] MemberDetail adapter の kind 分類網羅性ガード（FieldKindZ exhaustiveness）"

## メタ情報

```yaml
task_id: issue-827-followup-001-displayable-kinds-exhaustiveness-guard
task_name: MemberDetail adapter の kind 分類網羅性ガード（FieldKindZ exhaustiveness）
category: ref（リファクタリング / 保守性）
target_feature: `apps/web/src/lib/adapters/member-detail.ts` の `DISPLAYABLE_KINDS`
priority: 低（要件発生待ち・enum 拡張時の保険）
scale: 小規模
status: 未実施
source_phase: issue-827 Phase 9 リスク R-01（独立精査による検出 / current）
created_date: 2026-05-23
dependencies: []
spec_path: docs/30-workflows/unassigned-task/issue-827-followup-001-displayable-kinds-exhaustiveness-guard.md
```

| 項目 | 内容 |
|------|------|
| 優先度 | 低（要件発生待ち・enum 拡張時の保険） |
| 規模 | 小規模 |
| ステータス | 未実施 |

---
## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

issue-827 で公開会員詳細の表示制御を web 側の純粋 adapter `buildMemberDetailViewModel` に集約した。adapter は detail セクションに出してよい field の種類を `DISPLAYABLE_KINDS` という手書きの `Set<Field["kind"]>` で allowlist 管理している。現行値は `shortText` / `paragraph` / `date` / `radio` / `checkbox` / `dropdown` の 6 種。`url` は `MemberLinks`、`activity` セクションは `MemberActivity` が描画し、`consent` / `system` / `unknown` は detail 表示対象外という前提で設計されている。

### 1.2 問題点・課題

- `DISPLAYABLE_KINDS` は `packages/shared/src/zod/primitives.ts` の `FieldKindZ` enum（現在 10 値）と手動で整合させている。
- `FieldKindZ` に新しい kind（例: `fileUpload` / `scale` 等）が追加されても、adapter は新 kind を allowlist に含まないため **detail から silent skip する**。型エラーも CI fail も発生しない。
- issue-827 Phase 9 の緩和策（R-01）は「enum 変更時に adapter test へ display/non-display の期待を追加」という **人手の規律依存** であり、機械的な検出手段がない。

### 1.3 放置した場合の影響

- 将来 `FieldKindZ` を拡張した開発者が adapter の分類更新を忘れると、新項目が会員詳細に表示されない不具合が「無言で」発生する。
- 表示漏れは型・テスト・CI のいずれにも引っかからないため、発見が手動 QA や利用者報告まで遅延する。

---

## 2. 何を達成するか（What）

### 2.1 目的

`FieldKindZ` の全 kind が adapter 上で「detail 表示 / links 経由 / activity 経由 / detail 対象外」のいずれかに **明示分類されている** ことを、コンパイル時または CI で保証する。enum 拡張時に分類漏れを fail として検出可能にする。

### 2.2 最終ゴール（検証可能）

- `FieldKindZ` に未分類の kind を仮に追加すると `pnpm typecheck` または adapter unit test が fail する状態になっている。

### 2.3 スコープ

- 含む:
  - adapter 内に kind → 分類（`"detail" | "links" | "activity" | "excluded"`）の網羅マップを `satisfies Record<FieldKind, ...>` 等で定義し、`DISPLAYABLE_KINDS` をそのマップから導出する。
  - `FieldKindZ.options` 全件が分類済みであることを検証する adapter unit test を追加する。
- 含まない:
  - `FieldKindZ` enum 自体の拡張・変更。
  - `MemberLinks` / `MemberActivity` の描画ロジック変更。
  - API / D1 schema / Google Form schema の変更（不変条件により禁止）。

### 2.4 成果物

| 成果物 | 説明 |
| ------ | ---- |
| `member-detail.ts` 改修 | kind 分類マップ + `DISPLAYABLE_KINDS` 導出 |
| adapter spec 追加ケース | `FieldKindZ.options` 全件分類の網羅テスト |

---

## 3. どのように実行するか（How）

### 3.1 trigger 条件

- `FieldKindZ` enum の拡張を検討するとき、または adapter 保守性向上をまとめて行うとき。

### 3.2 前提条件

- issue-827 の adapter 実装がマージ済みであること。

### 3.3 推奨アプローチ

```ts
// member-detail.ts
import { FieldKindZ } from "@ubm-hyogo/shared"; // z.enum

type FieldKind = Field["kind"];
type KindRoute = "detail" | "links" | "activity" | "excluded";

// 全 kind を明示分類。kind を追加して未記載だと `satisfies` がコンパイルエラー
const KIND_ROUTE = {
  shortText: "detail",
  paragraph: "detail",
  date: "detail",
  radio: "detail",
  checkbox: "detail",
  dropdown: "detail",
  url: "links",
  consent: "excluded",
  system: "excluded",
  unknown: "excluded",
} satisfies Record<FieldKind, KindRoute>;

const DISPLAYABLE_KINDS = new Set<FieldKind>(
  (Object.keys(KIND_ROUTE) as FieldKind[]).filter((k) => KIND_ROUTE[k] === "detail"),
);
```

unit test 側で `FieldKindZ.options.every((k) => k in KIND_ROUTE)` を assert する。

### 3.4 推奨コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm --filter @ubm-hyogo/web test -- src/lib/adapters/__tests__/member-detail.spec.ts
```

---

## 4. 実行手順

1. `member-detail.ts` に `KIND_ROUTE` 網羅マップを `satisfies Record<FieldKind, KindRoute>` で導入する。
2. `DISPLAYABLE_KINDS` を `KIND_ROUTE` から導出に変更し、既存の挙動（detail 6 kind）が不変であることを確認する。
3. `member-detail.spec.ts` に `FieldKindZ.options` 全件が `KIND_ROUTE` に存在することの assert を追加する。
4. `pnpm typecheck` / 対象 spec を実行し緑を確認する。
5. 既存 visual snapshot baseline が不変であることを確認する（描画結果は不変のため再生成不要）。

---

## 5. 完了条件チェックリスト

- [ ] `KIND_ROUTE` が `satisfies Record<FieldKind, KindRoute>` で定義され、kind 追加時にコンパイルエラーになる
- [ ] `DISPLAYABLE_KINDS` が `KIND_ROUTE` から導出され、detail 表示対象が現行 6 kind と一致する
- [ ] `member-detail.spec.ts` に `FieldKindZ.options` 全件分類の網羅テストが追加され緑
- [ ] `mise exec -- pnpm typecheck` 成功
- [ ] adapter 挙動（detail / links / activity / excluded の振り分け）が issue-827 時点と不変
- [ ] visual snapshot baseline が変更されていない

---

## 6. 検証方法

- **網羅性**: `KIND_ROUTE` から 1 行コメントアウトすると `satisfies` がコンパイルエラーになることをローカルで確認（証跡として残す）。
- **挙動不変**: 既存 TC-A-01〜06 が変更なしで緑のままであること。
- **回帰**: `FieldKindZ.options` を test 内で列挙し、全件が分類済みであることを assert。

---

## 7. リスクと対策

| リスク | 影響度 | 確率 | 対策 |
| ------ | ------ | ---- | ---- |
| 導出変更で detail 表示対象が意図せず変わる | 中 | 低 | 変更前後で detail kind 集合を test で固定し diff を確認 |
| `FieldKindZ` を shared から import する経路が増え循環参照になる | 低 | 低 | 既に `PublicMemberProfileZ` を import 済みのため新規依存は発生しない |
| `satisfies` 構文が tsconfig target で未サポート | 低 | 低 | 既存コードベースが TS 5 系のため利用可。typecheck で即検出 |

---

## 8. 参照情報

- `apps/web/src/lib/adapters/member-detail.ts`（adapter 本体）
- `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts`（既存 unit test）
- `packages/shared/src/zod/primitives.ts`（`FieldKindZ` 正本）
- `docs/30-workflows/issue-827-member-detail-adapter-and-visibility-defense/phase-09-risks-and-mitigations.md`（R-01）
- `docs/30-workflows/issue-827-member-detail-adapter-and-visibility-defense/outputs/phase-12/implementation-guide.md`

---

## 9. 備考

### 9.1 苦戦箇所（issue-827 実装時の知見 / 将来の簡潔解決のため）

- **allowlist と enum の二重管理が silent skip を生む**: 表示制御を「対象を列挙する allowlist」で書くと、ソース of truth（`FieldKindZ`）が増えたときに allowlist 側が無言で取りこぼす。列挙型を扱う adapter では、最初から「全 case を明示分類する exhaustive マップ + 導出」で書くと、enum 拡張がコンパイルエラーとして表面化する。allowlist は exhaustive マップから導出するのが安全。
- **「render 不変」を守るための分離順序**: issue-827 では `map → filter` の順序で visibility filter を適用し、`MemberLinks` / `MemberActivity` には visibility filter 済みの `allSections` を渡すことで描画順序を保存した（R-02/R-03）。kind 分類を導出に変えても、この `map → filter` 順序と渡す配列の同一性を崩さないこと。崩すと visual snapshot diff が発生する。
- **二重防御の意図を残す**: visibility filter は API 側でも行われ得るが、adapter 側でも `visibility === "public"` を再適用している（defense-in-depth）。導出リファクタ時にこの二重防御を「冗長」と判断して削らないこと。
