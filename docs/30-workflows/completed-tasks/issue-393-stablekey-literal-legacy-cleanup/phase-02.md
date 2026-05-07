[実装区分: 実装仕様書]

# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| 状態 | pending |

## 目的

Phase 1 で確定した AC-1〜7 と 5 つの真の論点に対し、(1) 正本 supply module からの import 方式、(2) family A〜G ごとの置換マッピング、(3) 関数シグネチャ・runtime output の identity 保証、(4) 既存 strict count テストの更新範囲を、後続 Phase 4/5 が一意に実装可能な粒度に落とす。

## 設計の柱

### 柱 1: 正本 import 方式の確定

Phase 1 論点 2 の 3 候補から **(c) `FieldByStableKeyZ` 由来の typed key map を一次採用** とする。現行 `packages/shared/src/zod/field.ts` は `FieldByStableKeyZ` object と `STABLE_KEY_LIST` を export しており、Zod enum の `.enum` property や `FIELD_KEYS` 定数は存在しない。

決定木:

1. `packages/shared/src/zod/field.ts` を Phase 2 実装者が `Read` し、現行 export を確認する
2. `STABLE_KEY` のような `as const` key map が既存 → それを採用
3. 既存が `FieldByStableKeyZ` object + `STABLE_KEY_LIST` のみ → 正本 module 側に **`export const STABLE_KEY = { ... } as const satisfies { readonly [K in StableKeyName]: K };`** を追加し、それを app 側から import する（最小追加）
4. `FieldByStableKeyZ.enum.*` や `FIELD_KEYS.*` は現行 export に存在しないため採用しない
5. 正本 module 側の追加は「export を増やすのみ・既存 export 削除/改名なし」を厳守

新たな型 / interface / 抽象は導入しない。中継ヘルパも不要。

### 柱 2: family 別置換設計

各 family 内のファイルは「import 1 行追加 + literal 出現箇所すべて置換」の 2 操作のみで完了する。関数シグネチャ・export 名・引数順は **不変**。

| family | 主たる literal 利用パターン | 置換戦略 |
| --- | --- | --- |
| A (jobs/mappers) | `row["fullName"]` のような object key access、`{ fullName: ..., nickname: ... }` の構築 | object key を bracket access + canonical const に書き換え（computed property） |
| B (repository) | SQL builder の column 名 / D1 row mapping | 列名 / 結果オブジェクトの property を canonical const へ |
| C (routes/admin) | request payload の key 検査・response shaping | payload key 比較を canonical const へ |
| D (use-case / view-model) | DB row → public view への mapping、key 名で if 分岐 | mapping table の key を canonical const へ |
| E (profile components) | client side で stableKey を表示 / 状態 key として保持 | JSX 内の key 比較・state key を canonical const へ |
| F (public components) | profile 表示の key 名比較・field 表示順制御 | 表示分岐の key 比較を canonical const へ |
| G (shared utils consent) | `publicConsent` `rulesConsent` literal を直接出力 | canonical const に置換しつつ、output 文字列値が同一であることを test で保証 |

詳細な per-file マッピングは `outputs/phase-02/per-family-plan.md` に記載する。

### 柱 3: identity 保証と関数シグネチャ不変方針

- すべての置換は **runtime output identity** を維持する（`StableKey.fullName === "fullName"` が真）
- 関数の引数型 / return 型 / export 名 / default vs named を変更しない
- 型 narrowing が呼び出し側に副作用を生じる場合は、`as string` で widen するのではなく **置換側で literal type を許容するよう型注釈を追加**（既存型を緩めない）
- `eslint-disable` / `@ts-ignore` / `as any` 一切禁止（AC-6）

### 柱 4: 既存テスト更新範囲

- `scripts/lint-stablekey-literal.test.ts` の strict 期待値を **0** に更新
- `stableKeyCount` assertion は 31 を維持
- 既存 family 別 unit test は **変更しない**（identity 置換のため挙動同一）
- consent.ts (family G) は既存テストで `publicConsent` / `rulesConsent` の output literal を assert していることを前提とし、それを維持

### 柱 5: 例外的 suppression の許容条件

**なし**。本タスクは AC-6 で suppression 0 件を求めるため、`eslint-disable-next-line` `@ts-ignore` `as any` は 1 件も追加しない。もし置換不能な箇所があれば、それは Phase 2 設計の不備であり、設計を見直す（fallback として suppression を選ばない）。

## 実行タスク

- [ ] 正本 module の現行 export 構造を `Read` で確認し、import 方式を決定木に沿って確定
- [ ] family A〜G の per-file マッピングを `outputs/phase-02/per-family-plan.md` に記述
- [ ] 全置換の identity 保証ルールを `outputs/phase-02/replacement-design.md` に記述
- [ ] suppression 禁止ポリシーを設計に明記
- [ ] Phase 3 alternative 比較に必要な前提条件（PR 粒度・コミット粒度）を整理

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | packages/shared/src/zod/field.ts | 正本 #1 export 確認 |
| 必須 | packages/integrations/google/src/forms/mapper.ts | 正本 #2 export 確認 |
| 必須 | scripts/lint-stablekey-literal.mjs | 検出ロジックの仕様確認 |
| 必須 | scripts/lint-stablekey-literal.test.ts | 期待値更新範囲確認 |
| 必須 | 違反 14 ファイル（family A〜G） | 置換マッピング策定対象 |

## 設計成果物の構造

```
outputs/phase-02/main.md              # 設計サマリー / 柱 1〜5
outputs/phase-02/replacement-design.md # import 方式 / identity 保証 / 型方針
outputs/phase-02/per-family-plan.md    # family A〜G 別の per-file マッピング
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 3 | alternative 3 案の前提（PR 粒度 / 単一コミット） |
| Phase 4 | family 別 focused test list / strict count 更新範囲 |
| Phase 5 | per-family-plan の手順への展開 |
| Phase 6 | suppression 禁止が gate を通ることの確認 |

## 多角的チェック観点

- 正本 export の最小追加原則（既存削除/改名禁止）
- consent.ts の output literal 同一性
- 型 narrowing で呼び出し側の overload 解決が変わらないこと
- import 経路の循環参照（`packages/shared` ↔ `apps/api` の方向性のみ）
- monorepo workspace import path 解決（`@repo/shared` / `@repo/integrations` のエイリアスを正本パターンに合わせる）

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/main.md | Phase 2 主成果物 |
| ドキュメント | outputs/phase-02/replacement-design.md | import 方式 / identity 保証ルール |
| ドキュメント | outputs/phase-02/per-family-plan.md | family A〜G 別 per-file マッピング |
| メタ | artifacts.json | phase 2 status |

## 完了条件

- [ ] 正本 import 方式が決定木に沿って確定
- [ ] family A〜G の per-file マッピングが完成
- [ ] identity 保証ルールが明文化
- [ ] suppression 禁止ポリシーが明示
- [ ] Phase 3 への引き継ぎ前提が整理

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 全成果物配置済み
- [ ] 完了条件すべてチェック
- [ ] 異常系（正本 export 不足 / 型 narrowing 副作用 / 循環参照）も網羅
- [ ] 次 Phase 引き継ぎ事項記述
- [ ] artifacts.json の phase 2 を completed

## 次 Phase

- 次: Phase 3 (設計レビュー)
- 引き継ぎ: 確定済 import 方式 / per-family-plan / identity 保証ルール / suppression 禁止
- ブロック条件: 正本 export 構造未確認なら Phase 3 alternative 比較不可
