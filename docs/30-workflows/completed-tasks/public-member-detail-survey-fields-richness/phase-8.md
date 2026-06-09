# Phase 8: リファクタリング

> **[実装区分: 実装仕様書]**。Phase 4-7（TDD・実装・テスト拡充・カバレッジ確認）完了後に、重複排除・責務明確化・命名一貫性向上を目的とした **最小差分** リファクタリングを行う。**新規機能追加・振る舞い変更は禁止。** 各 RT はリファクタリング前後で対象 spec が全件 PASS であることを受入基準とする。DRY と可読性のトレードオフを明示し、過度な抽象化を避ける。

---

## 対象変更一覧（FB-RT-03 `対象 / Before / After / 理由` テーブル形式）

### RT-001 — `renderValue` の共通 util 抽出

| 項目 | 内容 |
|------|------|
| 対象 | `apps/web/src/components/public/MemberDetailSections.tsx` L15 / `apps/web/src/components/public/MemberActivity.tsx` L13 / 新規 `apps/web/src/components/public/PersonalSection.tsx`（PERSONAL KVList の表示値整形） |
| Before | `function renderValue(value): string { if (Array.isArray(value)) ...; if (null/undefined/"") return "—"; return String(value); }` が `MemberDetailSections` と `MemberActivity` に**逐語コピーで重複**。PersonalSection でも同型ロジックが必要 |
| After | `apps/web/src/lib/adapters/render-value.ts`（または `apps/web/src/components/public/_render-value.ts`）に `export function renderFieldValue(value): string` を 1 本だけ定義し、3 component が import して使用。**新規 primitive コンポーネントではなく純関数 util**（不変条件 #4 に抵触しない） |
| 理由 | rule of three が成立（既存 2 箇所 + PersonalSection の 3 箇所目）。`"—"` フォールバックと配列 join の表示規約 drift を防ぐ。adapter の `personal` 値整形（Phase 2 §3.1「value は renderValue 済み」）と表示層の整形規約を単一正本化する |
| 確認コマンド | `grep -rn "Array.isArray(value)" apps/web/src/components/public/` — 共通化後は util ファイル 1 箇所のみヒット |
| 条件 | 3 箇所目（PersonalSection）が実際に同型整形を必要とする場合に実施。adapter 側で `personal` の value を既に整形済みにする設計（Phase 2 §3.1）なら、表示層の重複は `MemberDetailSections`（other）と `MemberActivity` の 2 箇所に限定 → その場合も 2 箇所重複の解消として実施する |

---

### RT-002 — adapter 振り分け定数の単一正本化

| 項目 | 内容 |
|------|------|
| 対象 | `apps/web/src/lib/adapters/member-detail.ts`（`SUMMARY_KEYS` / `HERO_EXTRA_KEYS` / `BUSINESS_KEYS` / `PERSONAL_KEYS` / `MESSAGE_KEY` / `ASSIGNED_KEYS`） |
| Before | Phase 5 実装時に、割当キー集合が複数箇所（振り分け述語・`__testInternals` export・other 除外判定）でインライン再構築されている可能性 |
| After | 各キー集合を module top-level の `const` 1 箇所だけで定義し、`ASSIGNED_KEYS` は他集合の spread で導出。振り分け述語・other 除外・`__testInternals` は全てこの定数を参照する。`STABLE_KEY.<name>`（`@ubm-hyogo/shared`）経由を維持（不変条件 #6・リテラル直書き禁止） |
| 理由 | 「どの stableKey がどのセクションに行くか」の正本を 1 箇所に集約。spec（`__testInternals` 経由）と本体ロジックが同一定数を参照することで、割当 drift を構造的に防ぐ |
| 確認コマンド | `grep -n "BUSINESS_KEYS\|PERSONAL_KEYS\|SUMMARY_KEYS\|HERO_EXTRA_KEYS\|ASSIGNED_KEYS" apps/web/src/lib/adapters/member-detail.ts` — 各定数の定義が 1 回ずつ、参照が定義由来であることを確認 |
| 条件 | インライン再構築が存在する場合のみ実施。無ければ「重複なし・確認済みでスキップ」を記録 |

---

### RT-003 — legacy section 変換ヘルパの整理（other 専用化）

| 項目 | 内容 |
|------|------|
| 対象 | `apps/web/src/components/public/MemberDetailSections.tsx` / `apps/web/src/lib/adapters/member-detail.ts`（旧 `sections` / `linkSections` 由来のヘルパ） |
| Before | 旧 `MemberDetailProps`（`sections` / `linkSections` flat KV）由来の `normalizeSection` / `normalizeField` / 旧 props 経路が、新セクション構造移行後も使われない形で残存している可能性。`MemberDetailSections` が「全セクション KV renderer」のまま |
| After | `MemberDetailSections` を **other フォールバック専用 renderer** に役割限定（props は `sections: ReadonlyArray<NormalizedSection>` 維持、`MemberDetail` から `other` のみ渡す）。adapter の `normalizeSection`/`normalizeField` が新振り分けで未使用なら削除、other 集約で再利用するなら other 構築専用に整理。`data-section` / `data-stable-key` 規約は維持 |
| 理由 | 旧 flat KV 経路と新セクション経路の二重実装を残すと AC-7（取りこぼし防止）の責務が曖昧になる。other 専用に絞ることで「固定割当外 field の受け皿」という単一責務を明確化 |
| 確認コマンド | `grep -rn "linkSections\|MemberDetailProps" apps/web/src` — 旧 `linkSections` prop への参照が残っていないこと（live import を grep で確認） |
| 条件 | 旧経路の dead code / 二重実装が存在する場合に実施。`MemberLinks` の props 形状調整（Phase 2 §4.6）と整合させる |

---

### RT-004 — data 属性 / proto クラス命名の一貫性点検（navigation/構造ドリフト）

| 項目 | 内容 |
|------|------|
| 対象 | `ProfileHero.tsx` / `BusinessOverviewSection.tsx` / `PersonalSection.tsx` / `MessageCard.tsx` / `MemberDetail.tsx` / `MemberDetailSections.tsx` |
| Before | Phase 5 実装で `data-component` / `data-section` / `data-stable-key` 命名や proto CSS クラス名が Phase 1 §4 規約からドリフトしている可能性（例: `data-component="businessOverview"` の camelCase 混入 / `card-pad-lg` の typo） |
| After | 以下の正本へ統一: `data-component="profile-hero" / "business-overview" / "personal-section" / "member-message" / "member-tags" / "member-links" / "member-activity"`（kebab-case）。section は `data-section="<key>"`、KV row は `data-stable-key` 必須。proto クラスは `card / card-pad-lg / eyebrow / h-section / chip-row / grid-2 / hero-split / accent-soft / serif / kv-list / divider / stack-lg`（既存 globals.css 由来）で統一 |
| 理由 | data 属性は Phase 11 視覚 spec / playwright selector の安定キー。命名 drift は selector の壊れ・回帰検知漏れに直結する。proto クラス名 drift は未定義クラス（無スタイル）を招く |
| 確認コマンド | `grep -rn 'data-component=' apps/web/src/components/public/*.tsx`（全て kebab-case であること）/ `grep -rn 'className=' apps/web/src/components/public/BusinessOverviewSection.tsx apps/web/src/components/public/PersonalSection.tsx apps/web/src/components/public/MessageCard.tsx`（proto 既存クラスのみ使用・任意値ブラケット記法不在） |

---

### RT-005 — seed builder の動的化に伴う重複/マジック値整理

| 項目 | 内容 |
|------|------|
| 対象 | `apps/api/src/testing/test-accounts/build-seed-sql.ts`（`answersFor` / `responseFieldRows` / `field_count` 算出） |
| Before | 旧 `const STABLE_KEYS = ["fullName","occupation","ubmZone"]` 撤廃後に、必須 3 項目が `answersFor` 内に再度マジック文字列で散在している可能性。`schema_versions.field_count` が旧 `STABLE_KEYS.length`（=3）固定のまま実態（可変キー数）とズレている可能性 |
| After | 必須項目を `REQUIRED_ANSWER_KEYS` 等の named const 1 箇所に集約。`responseFieldRows` は `Object.keys(answersFor(member))` で member ごと可変生成し二重定義しない。`field_count` は build-seed-sql spec で固定した実測値（最大 answers キー数または定数）に整合させる（Phase 2 §7.2） |
| 理由 | 動的化でマジック文字列が再散在すると後方互換（profile 未指定→3 項目）の意図が読めなくなる。`field_count` の drift は schema_versions の整合性検証（spec）を壊す |
| 確認コマンド | `grep -n '"fullName"\|"occupation"\|"ubmZone"\|STABLE_KEYS\|field_count' apps/api/src/testing/test-accounts/build-seed-sql.ts` — 必須キーが named const 1 箇所、`field_count` 算出が実態と整合していることを確認 |

---

### RT-006 — import drift の除去（lint --fix）

| 項目 | 内容 |
|------|------|
| 対象 | Phase 1 §5 inventory の全変更ファイル（adapter / 新規 3 component / ProfileHero / MemberDetail / MemberDetailSections / MemberLinks / catalog.ts / build-seed-sql.ts） |
| Before | Phase 5 実装で unused import・不要型アサーション・`as const` 付け忘れ・`any` 残留が残っている可能性 |
| After | `pnpm lint --fix` で自動修正可能な違反を解消し、残る手動修正を最小差分で行う |
| 理由 | Phase 9 の lint green を事前通過させ、Phase 9 での修正ループを回避する |
| 確認コマンド | `mise exec -- pnpm --filter @ubm-hyogo/web lint 2>&1 \| grep error` / `mise exec -- pnpm --filter @ubm-hyogo/api lint 2>&1 \| grep error` — エラー 0 件 |

---

## DRY と可読性のトレードオフ（過度な抽象化の回避）

| 抽象化候補 | 実施 | 判断 |
|------|------|------|
| `renderValue` util（RT-001） | **実施** | rule of three 成立（2〜3 箇所）。単純な純関数で可読性を損なわない |
| 振り分け定数集約（RT-002） | **実施** | 正本 1 箇所化はメンテ性を明確に上げ、spec との整合を強制できる |
| 各 component を「汎用 Section コンポーネント」へ統合 | **実施しない** | BusinessOverview / Personal / Message は見出し・本文構造・空分岐が異なる。1 つの汎用 props で吸収すると条件分岐が肥大化し proto 構造が読めなくなる。proto の 5 セクションは**意図的に別 component**のまま保つ（dumb・小・読みやすさ優先） |
| adapter 振り分けを「マップ駆動の汎用ルータ」へ一般化 | **実施しない** | first-match の述語列は現状の 7 セクションで十分明快。汎用ルータ化は YAGNI で可読性を下げる |

> **新 primitive を生やさない不変条件の再確認**（不変条件 #4）: RT-001 で作る `renderFieldValue` は純関数 util であり、`apps/web/src/components/ui/` の新規コンポーネントではない。新規 3 component（BusinessOverviewSection / PersonalSection / MessageCard）は proto 既出の primitive（card / chip / KVList / divider）と既存 globals.css クラスの組み合わせのみで構成し、新 primitive を追加しない。

---

## リファクタリング実施順序

1. RT-006（lint --fix）→ ベースの違反を先に除去。
2. RT-002（振り分け定数集約）→ `member-detail.spec.ts` PASS を確認。
3. RT-001（renderValue 共通化）→ `MemberDetailSections` / `MemberActivity` / `PersonalSection` の spec PASS を確認。
4. RT-003（legacy section 整理 / other 専用化）→ adapter + component spec PASS を確認。
5. RT-005（seed builder 整理）→ `build-seed-sql.spec.ts` PASS を確認。
6. RT-004（命名一貫性点検）→ data 属性・クラス grep で確認後、component spec PASS を確認。

> **各 RT の受入基準**: 変更後に対象 spec が全件 PASS。RT-001/RT-002/RT-003/RT-005 は「重複/drift が実際に存在する場合のみ実施」する条件付き RT。存在しなければ完了条件チェックに「スキップ（重複なし・確認済み）」と記録する。

---

## リファクタリング禁止事項

- adapter `toMemberDetailProps` の公開シグネチャ変更（`(profile, options)` 維持・戻り値型の拡張は Phase 5 で確定済み）
- `PublicMemberProfileWithUnknownKindZ` / `PublicMemberProfile` 型 export の削除（page.tsx が依存）
- API endpoint / D1 schema / Google Form schema の変更（不変条件 #1）
- proto 表示順（AC-6）・セクション構成（5 セクション）の変更
- 新規 primitive コンポーネントの追加（不変条件 #4）
- `STABLE_KEY` 定数経由をやめてリテラル直書きに戻すこと（不変条件 #6）
- テストファイル名（`*.spec.ts(x)`）の変更（不変条件 #8）
- seed の後方互換（profile 未指定 member は従来 3 項目）の破壊

---

## リファクタ後の全 spec green 維持手順

```bash
# Lane A
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  src/lib/adapters/__tests__/member-detail.spec.ts \
  src/components/public/__tests__
# Lane B
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run \
  src/testing/test-accounts/__tests__/build-seed-sql.spec.ts
```

各 RT 適用直後に上記 targeted run を実行し、全件 PASS を確認してから次の RT へ進む。1 つでも FAIL したら当該 RT を巻き戻し、振る舞いを変えない最小差分で再実施する。

---

## 完了条件（Phase 8）

- [ ] RT-001: `renderValue` が util 1 箇所に集約され、`MemberDetailSections` / `MemberActivity` / `PersonalSection` が import して使用（または重複なしを確認済みでスキップ記録あり）
- [ ] RT-002: 振り分けキー集合が module top-level の named const 1 箇所で定義され、本体・`__testInternals`・other 除外が同一定数を参照している（または重複なしでスキップ記録あり）
- [ ] RT-003: `MemberDetailSections` が other 専用 renderer に限定され、旧 `linkSections` 等の dead code が除去されている（live import を grep で確認）
- [ ] RT-004: 全変更 component の `data-component` が kebab-case、proto クラス名が既存 globals.css クラスのみであることを grep で確認済み
- [ ] RT-005: seed 必須キーが named const 1 箇所、`field_count` が実態と整合していることを確認済み
- [ ] RT-006: `pnpm lint` でエラー 0 件
- [ ] 全 RT 実施後に `pnpm typecheck` PASS（全 workspace）
- [ ] 全 RT 実施後に Lane A / Lane B の targeted vitest が全件 PASS
- [ ] 新規 primitive コンポーネントを追加していない（不変条件 #4）
- [ ] `*.test.{ts,tsx}` ファイルが増えていない（不変条件 #8）

## メタ情報
workflow_state: `implemented_local_visual_present_staging_pending` / taskType: `implementation` / visualEvidence: `VISUAL`

## 目的
`renderValue` 重複・振り分け定数の散在・legacy flat KV 経路・命名 drift を最小差分で解消し、adapter（振り分け）/ component（描画）/ seed（確認データ）の責務境界を保ちつつ可読性を上げる。過度な抽象化はしない。

## 実行タスク
- renderValue util 抽出・振り分け定数集約・other 専用化・命名一貫性・seed 整理・import drift 除去を順に実施する。
- 各 RT 後に対象 spec の green を確認する。

## 参照資料
- `phase-5.md`
- `phase-7.md`
- `phase-1.md`（§4 命名規則 / §5 inventory）

## 成果物
- Phase 8 リファクタリング仕様

## 統合テスト連携
Phase 4-7 のテストを全件 PASS に維持したまま refactor を完了し、Phase 9 の品質ゲートへ引き継ぐ。
