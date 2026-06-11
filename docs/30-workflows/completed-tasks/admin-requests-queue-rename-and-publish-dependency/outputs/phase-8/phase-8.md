# Phase 8 — リファクタリング（TDD-Refactor）

`[実装区分: 実装仕様書]` / taskType: implementation / visualEvidence: VISUAL / workflow_state: implemented_local_evidence_captured

> 正本は [_shared-context.md](../../_shared-context.md)。本 Phase は「テスト GREEN を保ったまま重複・複雑度を下げる」リファクタ方針を確定する。実コード編集は完了済み。TDD の Refactor フェーズとして、重複を増やさず既存の projection・schema・table rendering に最小差分で統合した。

---

## 8.1 リファクタの大原則（不変条件）

1. **挙動は変えない**。リファクタ前後で全テスト GREEN（SSOT §8 の focused test + drift guard が PASS のまま）。
2. **API surface・D1 schema・ルートパス・ファイル名・id/data-\*/テストセレクタは不変**（AC-4）。
3. **新規 primitive を生やさない**。バッジは既存 status バッジ/チップ primitive を再利用。
4. **色は OKLch トークン経由のみ**。HEX 直書き 0 件を維持（AC-12）。
5. リファクタはスコープ内（3 レーンで触る箇所）に限定。無関係箇所の整形はしない（diff を最小に保つ）。

---

## 8.2 Lane C — `parsePendingRequestTypes` 純関数の切り出し方針

### 現状（裏取り済み）
`apps/api/src/routes/admin/members.ts` には既に同型の JSON parse 純関数 `parseTagsJson(raw: string | null)`（L130 付近・ファイルローカル `const`、try/catch + `Array.isArray` guard + `flatMap` で安全に配列化）が存在する。

### 方針: **既存 `parseTagsJson` の隣に同階層・同スタイルで配置**
- `parsePendingRequestTypes` は `members.ts` の `parseTagsJson` の**直後**にファイルローカル `const` として実装する。
- **命名規約は同階層 ls の多数派で確認した結果に従う**: 同階層（`apps/api/src/routes/admin/`）の parse ヘルパは `parse-attendance-filter.ts` のように「機能が複数 route で共有されるとき独立 module」、「単一 route 内でしか使わない JSON 整形は `members.ts` 内ファイルローカル `const parseXxxJson`」という 2 系統がある。`parsePendingRequestTypes` は **members.ts 専用**（会員一覧 projection でしか使わない）なので `parseTagsJson` と同じ **ファイルローカル `const` 命名**を踏襲する（独立 module 化はしない＝過剰分割を避ける）。
- シグネチャ: `const parsePendingRequestTypes = (raw: string | null): Array<"visibility_request" | "delete_request"> => { ... }`。
- 実装: `parseTagsJson` と同じ防御パターン（`if (!raw) return []` → `try { JSON.parse } catch { return [] }` → `Array.isArray` でない → `[]` → 各要素を文字列 narrowing し、既知 enum（`visibility_request` / `delete_request`）のみ通す `flatMap`）。

> **独立 module 化しない判断の根拠**: 既存 `parseTagsJson` も module 化されておらず members.ts 内に閉じている。同一画面・同一 route の読み取り専用 parse を新 module に出すと「同階層多数派（members.ts 内）」に反し import 経路が増える。Phase 7 の branch 100% テストは contract spec から members 一覧 endpoint 経由で網羅できるため、独立 export は不要。

### テスト保護
切り出し（= 配置）後も Phase 7 §7.3 の 10 分岐入力が members.contract.spec.ts で GREEN であること。

---

## 8.3 Lane A — seed 生成の DRY（生成関数の分離）

### 現状
`build-seed-sql.ts` は catalog から member / admin / meeting の `INSERT OR REPLACE` を決定論生成する。今回 `admin_member_notes`（依頼）INSERT を追加する。

### 方針: **request INSERT 生成を専用関数に切り出し、member 系生成ロジックと混在させない**
- `buildSeedSql()` 内に request 行をベタ書きで増やさず、`requests` 配列 → INSERT 文を返す**専用の生成ヘルパ**（例: `buildRequestInsert(req: TestRequest): string` 相当のファイルローカル関数）を切り出す。member INSERT 生成と request INSERT 生成を関数単位で分離し、SRP（単一責務）を保つ。
- body JSON 生成（`json_object('reason', ?, 'payload', json(?))` / payload 空時は `json_object()`）の分岐は **1 箇所のヘルパ**に閉じ込め、呼び出し側で重複させない。
- SQL リテラルのエスケープ（`'` → `''`）は既存 seed builder の共通エスケープ関数を**再利用**する（catalog に `[TEST] 山田''太郎😀` のようなエスケープ済み事例があり、既存ヘルパが存在する。新規エスケープ関数を作らない）。
- cleanup 生成も同様に `DELETE FROM admin_member_notes WHERE note_id LIKE 'TEST-NOTE-%';` を既存 cleanup 生成系列の中へ 1 行追加（member 系 DELETE と並列）。

### テスト保護
リファクタ後も build-seed-sql.spec.ts が「3 依頼 INSERT を含む / cleanup DELETE を含む / `INSERT OR REPLACE` 冪等 / 明示トランザクション混入なし（既存 regression: `not.toMatch(/BEGIN TRANSACTION/)`）」を GREEN に保つ。`gen-test-accounts-seed.mjs --check` が byte 一致で PASS。

---

## 8.4 命名変更で重複文言を定数化できる箇所

Lane B の表示文言「会員からの申請」「申請一覧」「申請詳細」は複数コンポーネント（page / RequestQueuePanel / RequestQueueDetail / shell-config）に散る。ただし**過剰な定数化は避ける**:

| 文言 | 出現箇所 | 定数化方針 |
| --- | --- | --- |
| `会員からの申請`（画面タイトル系） | shell-config nav / page title / panel h1 | 各コンポーネントの責務に閉じるため**ベタ書きで可**（既存も各所ベタ書き）。1 つの共有定数に集約すると shell-config（ナビ定義）と component（描画）の責務が混ざるため定数化しない。 |
| `申請一覧` / `申請詳細`（aria-label + 見出し） | RequestQueuePanel / RequestQueueDetail | 同一コンポーネント内で見出しと aria-label が同値になる場合のみ、そのコンポーネント内ローカル定数で重複除去してよい（任意・diff を増やさない範囲）。 |
| NOTE_TYPE_LABEL（公開停止/再公開・退会） | RequestQueuePanel L50 | **不変**（既に平易・既存定数をそのまま）。 |

> 原則: 命名変更は「文字列の置換」であり、定数化は同一ファイル内の自明な重複（見出し=aria-label）に限る。クロスファイル共有定数の新設は責務越境になるため行わない。

---

## 8.5 OKLch トークン維持（HEX 0 件）

- Lane C のバッジは既存 status バッジ/チップ primitive を再利用するため、新たな色定義は発生しない想定。
- リファクタで色クラスを触る場合も `bg-[#...]` / `text-[#...]` / 6 桁 HEX を導入しない。
- 検証: `rg -n "bg-\[#|text-\[#|#[0-9a-fA-F]{6}" apps/web/src/components/admin` = 0 件（Phase 9 で gate 化）。

---

## 8.6 リファクタ後の不変条件チェックリスト

| 不変条件 | 確認手段 |
| --- | --- |
| 全テスト GREEN | `pnpm --filter @ubm-hyogo/api test --run src/routes/admin src/testing/test-accounts` / `pnpm --filter @ubm-hyogo/web test --run src/components/admin` |
| seed drift PASS | `node scripts/gen-test-accounts-seed.mjs --check` |
| API surface 不変 | 新 endpoint なし・`/members` projection 拡張のみ |
| ファイル名/id/data-\*/セレクタ不変 | AC-4 grep（Phase 9 §9.4） |
| 新規 primitive なし | バッジは既存 chip/badge 再利用 |
| HEX 0 件 | `rg` HEX gate |
| spec 接尾辞 `*.spec.{ts,tsx}` のみ | lefthook `block-test-suffix` |

---

## 8.7 完了条件（Phase 8）

- [ ] `parsePendingRequestTypes` を `parseTagsJson` 隣のファイルローカル `const` として配置する方針（独立 module 化しない理由付き）を確定した
- [ ] seed 生成の DRY（request INSERT 生成関数の分離・body JSON ヘルパ 1 箇所・既存エスケープ再利用）を確定した
- [ ] 命名変更の定数化方針（クロスファイル共有定数は作らず同一ファイル内の自明重複のみ）を確定した
- [ ] OKLch トークン維持・HEX 0 件・新規 primitive 不生成を明記した
- [ ] リファクタ後も全テスト GREEN・drift PASS を保つ不変条件チェックリストを定義した
- [x] 本 Phase のリファクタ適用は本実装サイクルで完了（外部 mutation のみ user-gated）
