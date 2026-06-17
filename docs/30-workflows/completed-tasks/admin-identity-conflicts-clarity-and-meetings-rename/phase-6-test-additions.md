# Phase 6 — テスト追加（fail path / 回帰 guard / 補助）

## 目的

Phase 4-5 の主要テスト（happy path）に対し、**fail path / 防御的返却 / 既存挙動の回帰 guard / seed contract の境界**を補うテスト方針を確定する。glossary の fail-soft、IdentityConflictRow の確認 UX 既存挙動、seed の正規化前提（原文保存）を壊さないことを機械的に保証する。API/D1/型は不変（[shared-context §3](./shared-context.md)）のため、追加テストはすべて表現層・seed 生成物・glossary に閉じる。

## 成果物

- 追加テストケース表（対象 spec・ケース・期待・根拠 AC）。
- glossary fail-soft / Row 回帰 guard / seed contract 境界の防御テスト方針。
- 統合テスト連携（focused vitest path・seed 機能 smoke）。

## 追加テスト方針

### A. glossary fail-soft（`identityConflictGlossary.spec.ts`）

対象: `apps/web/src/features/admin/identity-conflicts/identityConflictGlossary.ts`（[shared-context §5.5](./shared-context.md)）。

| ケース | 入力 | 期待 | 根拠 |
| --- | --- | --- | --- |
| 既知キー(name) | `matchedFieldLabel("name")` | `"氏名"` | AC-4/AC-6 |
| 既知キー(affiliation) | `matchedFieldLabel("affiliation")` | `"職業"` | AC-4/AC-6 |
| 未登録キー | `matchedFieldLabel("phone")` | `"phone"`（原文 fallback・throw しない） | AC-6（fail-soft） |
| 空文字 | `matchedFieldLabel("")` | `""`（throw しない・原文返却） | AC-6（防御的返却） |
| 不正/想定外 field | `matchedFieldLabel("__proto__")` | `"__proto__"`（prototype 由来値を返さない・`Object.hasOwn` または `?? field` で原文） | AC-6（防御） |
| `RECORD_ROLE_LABELS` 不変 | `RECORD_ROLE_LABELS.source` / `.target` | `"新しい登録"` / `"まとめ先（以前の登録）"` | AC-4（[§5.3](./shared-context.md)） |

> `matchedFieldLabel` は `Record<string,string>` の lookup + `?? field`。`__proto__` lookup で prototype 値が漏れないことを明示テスト（実装が `?? field` のみだと `MATCHED_FIELD_LABELS["__proto__"]` は object を返し得るため、実装側は `Object.hasOwn(MATCHED_FIELD_LABELS, field)` ガード推奨。テストで原文返却を assert し回帰を防ぐ）。

### B. IdentityConflictRow 回帰 guard（`IdentityConflictRow.spec.tsx`）

対象: `apps/web/src/components/admin/IdentityConflictRow.tsx`。**state machine / mutation / optimistic は不変**（[phase-2 state ownership](./phase-2-design.md)）。文言変更が既存の確認 UX 挙動を壊していないことを guard する。

| ケース | 操作 | 期待 | 根拠 |
| --- | --- | --- | --- |
| merge reason 空 → 実行 disabled | merge-final で「まとめる理由」未入力 | 「統合を実行」ボタンが `disabled` 維持 | 既存挙動の回帰 guard |
| merge reason 入力後 enabled | 理由を 1 文字以上入力 | ボタンが押下可能 | 既存挙動 |
| dismiss reason 空 → 実行 disabled | dismiss で「別人と判断した理由」未入力 | 「別人として確定」ボタンが `disabled` 維持 | 既存挙動の回帰 guard |
| エラー時 modal 非クローズ・reason 保持 | mutation を reject させる | 確認 UI が閉じず、入力済み reason が保持される | 既存挙動の回帰 guard |
| badge 日本語（glossary 経由） | `matchedFields: ["name","affiliation"]` を渡す | `氏名` / `職業` badge が描画（英語 `name`/`affiliation` 非表示） | AC-4 |
| role badge 日本語 | source/target 行 | `新しい登録` / `まとめ先（以前の登録）` | AC-4 |
| 内部 conflictId 非露出 | 一覧描画 | 生の `conflict: {id}` が一覧テキストに出ない（`照合キー:` は title/aria 補助のみ） | AC-4（[§5.3](./shared-context.md)） |

> mutation reject は既存テストの mock hook を流用（`useAdminMutation` を reject Promise でスタブ）。新規に endpoint を叩かない（API 不変）。jsdom は CSS 非評価のため、disabled は `aria-disabled`/`disabled` 属性 contract で検証する。

### C. IdentityConflictGuide 描画（`IdentityConflictGuide.spec.tsx`）

| ケース | 期待 | 根拠 |
| --- | --- | --- |
| 3 点説明の描画 | [§5.4](./shared-context.md) の 3 文（自動検出 / 統合の意味 / 別人として確定の意味）が描画 | AC-5 |
| HEX 直書きなし | className が token クラスのみ（HEX/`bg-[...]` を含まない） | AC-12（実機 grep は Phase 9） |

### D. seed contract 境界（`identity-conflict-seed.contract.spec.ts`）

対象: `apps/api/migrations/seed/__tests__/identity-conflict-seed.contract.spec.ts`（生成物 = `build-seed-sql.ts` の出力）。

| ケース | 期待 | 根拠 |
| --- | --- | --- |
| drift 0 | `buildIdentityConflictSeedSql()` の出力が `identity-conflict-staging-seed.sql` とバイト一致 | AC-9 |
| cleanup drift 0 | `buildIdentityConflictCleanupSql()` が `identity-conflict-cleanup.sql` とバイト一致 | AC-9 |
| idempotent | 2 回連結しても `INSERT OR REPLACE` のため決定論（明示 BEGIN/COMMIT を含まない） | AC-9 |
| **末尾空白の保存（P3 回帰）** | `[TEST] 重複 余白 次郎 ` / `製造コンサルタント ` の**末尾空白が SQL リテラルにそのまま含まれる**（builder が trim しない） | AC-10（[§6.3 P3](./shared-context.md)） |
| **全角文字の保存（P2 回帰）** | `ＷＥＢデザイナー`（全角 WEB）が SQL に**全角のまま**保存される（builder が NFKC 正規化しない） | AC-10（[§6.3 P2](./shared-context.md)） |
| 重複ペア数の境界 | catalog の member 数 = 10、ペア = 5（fullName×occupation の正規化後一致グループが**ちょうど 5 グループ**・各グループ 2 件） | AC-10（[§6.3](./shared-context.md)） |
| 既存 seed と非衝突 | member_id が `TEST-MEM-21..30` の範囲のみ。`TEST-MEM-01..10` を含まない | AC-10/AC-11（[§6.2](./shared-context.md)） |
| cleanup scope | cleanup SQL が `TEST-MEM-21..30` / `TEST-RES-21..30` / `TEST-REV-DUP` のみを DELETE 対象とし、`TEST-MEM-0` を含まない | AC-11（[§6.5](./shared-context.md)） |

> **正規化吸収の前提を回帰テスト化**: detector 側が `trim().normalize("NFKC")` で吸収するため、seed は**原文（末尾空白・全角）をそのまま保存**しなければ「表記ゆれ／余白で一致」というデモ価値が失われる。builder が誤って正規化・trim を入れると P2/P3 のデモが happy 一致に退化するため、SQL リテラルへの原文保持を assert する。
>
> **境界「ちょうど 5 候補」**: 既存 TEST-MEM-01..10 の職業集合（[§6.3 注記](./shared-context.md)）と本 seed の職業（行政書士/WEBデザイナー/製造コンサルタント/不動産業/美容師）は全て非一致のため cross-collision が起きず、期待候補数が 5 を超えない。catalog 単体では「正規化キーでグルーピングしたとき 5 グループ・各 2 件」を assert（detector 実行は Phase 11 の local apply smoke で確認）。

## 統合テスト連携

- focused vitest（[shared-context §8](./shared-context.md) の path を使用）:
  ```bash
  mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
    apps/web/src/components/shell/__tests__/shell-config.spec.ts \
    apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx \
    apps/web/src/components/admin/__tests__/IdentityConflictGuide.spec.tsx \
    apps/web/src/features/admin/identity-conflicts/__tests__/identityConflictGlossary.spec.ts \
    apps/api/migrations/seed/__tests__/identity-conflict-seed.contract.spec.ts
  ```
- seed 機能 smoke（任意・ユーザー承認後）: local D1 へ apply → repository `listIdentityConflicts` 相当 query で**候補 5 件**を確認（Phase 11 手順化）。
- jsdom は CSS 非評価のため、視覚（色・余白）は構造/文言/属性 contract で検証し、最終視覚は staging screenshot（user-gated）。

## 完了条件

- [ ] glossary fail-soft（未登録 / 空 / `__proto__`）テストを定義した。
- [ ] IdentityConflictRow の reason 空 disabled・エラー時 modal 非クローズ＆reason 保持の回帰 guard を定義した。
- [ ] seed contract に「末尾空白・全角の原文保存」「ちょうど 5 ペア境界」「既存 01..10 非衝突」回帰を定義した。
- [ ] focused vitest path と seed 機能 smoke を統合テスト連携に記載した。
