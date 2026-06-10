# task-01: Lane A — タグ source の fail-soft 正規化 + zod 防御 + builder 適用

[実装区分: 実装仕様書]

> 判定根拠: CONST_004 に従う。本タスクは `packages/shared/src/types/common.ts`（編集）・`packages/shared/src/zod/primitives.ts`（編集）・`apps/api/src/repository/_shared/builder.ts`（編集）・新規テスト 2 ファイルを追加して 500 を fail-soft 正規化で解消するもので、コード変更が不可欠なため実装仕様書とする（docs-only ではない）。

## メタ情報

| 項目 | 値 |
|------|------|
| ワークフロー | `admin-member-detail-tag-source-500-and-drawer-resilience` |
| 親 Phase | Phase 5（実装） |
| ブランチ | `fix/admin-member-detail-500-and-drawer-resilience`（実装サイクルで feature ブランチへ） |
| 起点 | `origin/dev` (2644fcaf2) |
| Lane | A（NON_VISUAL・`packages/shared` + `apps/api`） |
| visualEvidence | NON_VISUAL（型・zod・builder の値正規化。自動テストが主証跡） |
| 想定 PR base | `dev` |
| 並列性 | Lane B と相互非依存（並列実装可）。Lane A 内は shared→api の順 |

## 背景

`member_tags.source` カラムは CHECK 制約なし（`apps/api/migrations/0002_admin_managed.sql:46`）で任意文字列を許す。seed（`apps/api/migrations/seed/test-accounts-seed.sql:91-121`）は `source='seed'` を投入する。view 層 `TagSourceZ = z.enum(["rule","ai","manual"])`（`packages/shared/src/zod/primitives.ts:29`）は 3 値固定で、`buildAdminMemberDetailView`（`apps/api/src/repository/_shared/builder.ts:429`）が `source` を含めてタグを返すため `AdminMemberDetailViewZ.safeParse(view)`（`apps/api/src/routes/admin/members.ts:506`）が失敗し 508 行で 500 を返す。`buildMemberProfile`（`builder.ts:357`）にも同一の `as` キャストがあり、会員マイページ `/profile` でも同様の 500 が起きうる。詳細は `_shared-context.md §1` / `outputs/phase-1/phase-1.md` 参照。

## 目的

DB の `member_tags.source`（任意文字列）を view 層 `TagSource`（3 値）へ fail-soft 正規化する純関数 `normalizeTagSource` を shared に新設し、`builder.ts` の 2 箇所（357 / 429）の `as` キャストをこれに置換する。さらに `TagSourceZ` に `.catch("manual")` を付与し、万一未正規化値が view へ流入しても `safeParse` が落ちない最終防壁とする。`TagSource` union（3 値）は**拡張しない**（ブラスト半径最小）。

## 1. 変更対象ファイル一覧（CONST_005 必須）

| パス | 変更種別 | 内容 |
|------|---------|------|
| `packages/shared/src/types/common.ts` | 編集 | 純関数 `normalizeTagSource` と `KNOWN_TAG_SOURCES` 定数を新設・export（`TagSource` 型の直後） |
| `packages/shared/src/zod/primitives.ts` | 編集 | `TagSourceZ` に `.catch("manual")` を付与（29 行） |
| `apps/api/src/repository/_shared/builder.ts` | 編集 | `:357`（`buildMemberProfile`）/ `:429`（`buildAdminMemberDetailView`）の `t.source as "rule"\|"ai"\|"manual"` → `normalizeTagSource(t.source)`。`@ubm-hyogo/shared` から `normalizeTagSource` を import 追記 |
| `packages/shared/src/zod/viewmodel.spec.ts` | 新規 | `normalizeTagSource` + `TagSourceZ.safeParse` の unit テスト（Phase 4 §3.1 の TC-A-N1〜N13 / Z1〜Z4） |
| `apps/api/src/repository/__tests__/builder.repository.spec.ts` | 新規 | seed source タグで `buildAdminMemberDetailView` / `buildMemberProfile` が safeParse を通る回帰（Phase 4 §3.2 の TC-A-B1〜B5） |

それ以外のファイルは無編集。`apps/api/src/routes/admin/members.ts:506-508`（`safeParse` → 500）は触らない（正規化で safeParse が成功する）。`packages/shared/src/index.ts:2` は既に `export * from "./types/common";` のため barrel 配線追加は不要（§2.3 で確認のみ）。D1 schema / migration / seed / Form は不変。

## 2. 主要な関数・型・モジュールのシグネチャ（CONST_005 必須・before→after 逐語）

### 2.1 `packages/shared/src/types/common.ts`（編集・追加）

現状 13 行は `export type TagSource = "rule" | "ai" | "manual";`。この直後に以下を**追加**する（`TagSource` 型自体は変更しない＝拡張しない）。

```diff
--- a/packages/shared/src/types/common.ts
+++ b/packages/shared/src/types/common.ts
@@
 export type TagSource = "rule" | "ai" | "manual";
+
+const KNOWN_TAG_SOURCES: readonly TagSource[] = ["rule", "ai", "manual"];
+
+/**
+ * DB の member_tags.source（CHECK 制約なし＝任意文字列）を view 層の TagSource へ
+ * fail-soft 正規化する。既知値はそのまま、'seed' を含む未知値・空文字・null・undefined は 'manual' へ。
+ * 例外は投げない（WEEKGRD-02: 純粋関数ガードは例外なし・防御的返却）。
+ */
+export function normalizeTagSource(raw: string | null | undefined): TagSource {
+  return KNOWN_TAG_SOURCES.includes(raw as TagSource) ? (raw as TagSource) : "manual";
+}
```

- 完全一致のみ恒等（大小変換・trim・部分一致はしない）。`raw` が null / undefined / 空文字 / 大文字 / 前後空白 / 任意未知文字列のときは `"manual"`。
- 戻り値型は `TagSource`（`"rule"|"ai"|"manual"`）。`MemberProfile.tags[].source` 型に一致する。

### 2.2 `packages/shared/src/zod/primitives.ts`（編集・29 行）

```diff
--- a/packages/shared/src/zod/primitives.ts
+++ b/packages/shared/src/zod/primitives.ts
@@
-export const TagSourceZ = z.enum(["rule", "ai", "manual"]);
+export const TagSourceZ = z.enum(["rule", "ai", "manual"]).catch("manual");
```

- `.catch("manual")` により parse 失敗時に `"manual"` を返し `safeParse` が落ちない（最終防壁）。出力 union は `"rule"|"ai"|"manual"` のまま不変。
- `.default` ではない（`.default` は undefined 時のみ。source は値が来るため `.catch` が適切）。
- `viewmodel.ts:71`（`MemberProfileZ.tags[].source`）/ `identity.ts:68`（`MemberTagZ.source`）の利用は出力型互換のため意味不変（Phase 6 で identity 回帰確認）。

### 2.3 `apps/api/src/repository/_shared/builder.ts`（編集・import + 357 + 429）

#### import 追記

現状の値 import 行は 22 行 `import { STABLE_KEY } from "@ubm-hyogo/shared";`（8-21 行は type import）。`normalizeTagSource` は**値（関数）**なので type import ではなく値 import に追記する。

```diff
--- a/apps/api/src/repository/_shared/builder.ts
+++ b/apps/api/src/repository/_shared/builder.ts
@@
-import { STABLE_KEY } from "@ubm-hyogo/shared";
+import { STABLE_KEY, normalizeTagSource } from "@ubm-hyogo/shared";
```

#### `:357`（`buildMemberProfile` 内 `tags.map`）

```diff
@@ function buildMemberProfile
     tags: tags.map((t) => ({
       code: t.code,
       label: t.label,
       category: t.category,
-      source: t.source as "rule" | "ai" | "manual",
+      source: normalizeTagSource(t.source),
     })),
```

#### `:429`（`buildAdminMemberDetailView` 内 `tags.map`）

```diff
@@ function buildAdminMemberDetailView
     tags: tags.map((t) => ({
       code: t.code,
       label: t.label,
       category: t.category,
-      source: t.source as "rule" | "ai" | "manual",
+      source: normalizeTagSource(t.source),
     })),
```

> 357 / 429 は逐語同一の差分（同じ `tags.map` 形）。`t.source` の型は repository 行の `source: string`（任意文字列）で、`normalizeTagSource` の引数 `string | null | undefined` を満たす。

## 3. 入力・出力・副作用の定義（CONST_005 必須）

| 区分 | 内容 |
|------|------|
| 入力 | `normalizeTagSource`: `raw: string \| null \| undefined`（DB の `member_tags.source` 実値）。builder: `listTagsByMemberId` が返す各タグ行 `t`（`t.source` を含む） |
| 出力 | `normalizeTagSource`: `TagSource`（`"rule"\|"ai"\|"manual"`）。builder: `MemberProfile.tags[].source` / `AdminMemberDetailView.profile.tags[].source` が正規化値になる。`AdminMemberDetailViewZ` / `MemberProfileZ` の `safeParse` が成功する |
| 副作用 | なし（純関数。D1・外部 I/O 非接触。DB schema / seed を一切書き換えない＝コード側で吸収） |
| 不変 | endpoint surface・レスポンス shape・HTTP method・path・一覧 API は不変（AC-6）。`TagSource` union（3 値）非拡張（AC-7） |

| 状態 | `member_tags.source` 実値 | 正規化後 `tags[].source` | safeParse |
|------|------|------|------|
| 既知 | `"rule"` / `"ai"` / `"manual"` | 恒等 | success |
| seed | `"seed"` | `"manual"` | success（修正前は 500） |
| 未知 / 空 / null | `""` / 任意未知 / null | `"manual"` | success |

## 4. テスト方針（CONST_005 必須）

新規 test は `*.spec.{ts,tsx}`（不変条件 #8）。Phase 4 §3.1 / §3.2 の TC を実装する。

### 4.1 `packages/shared/src/zod/viewmodel.spec.ts`（新規）

`normalizeTagSource` を import し TC-A-N1〜N13、`TagSourceZ` を import し TC-A-Z1〜Z4 を検証する。

| TC-ID | 入力 | 期待 |
|-------|------|------|
| TC-A-N1〜N3 | `"rule"` / `"ai"` / `"manual"` | 恒等 |
| TC-A-N4 | `"seed"` | `"manual"` |
| TC-A-N5〜N7 | `""` / `null` / `undefined` | いずれも `"manual"` |
| TC-A-N8〜N9 | `"RULE"` / `"Manual"` | いずれも `"manual"`（完全一致のみ恒等） |
| TC-A-N10〜N11 | `" rule "` / `"ai "` | いずれも `"manual"`（trim しない） |
| TC-A-N12 | `"unknown_xyz"` | `"manual"` |
| TC-A-N13 | N5〜N12 を順に実行 | `expect(() => ...).not.toThrow()`（例外を投げない） |
| TC-A-Z1〜Z4 | `TagSourceZ.safeParse("seed")` / `("rule")` / `("")` / `(42)` | いずれも `success===true`、data は順に `"manual"` / `"rule"` / `"manual"` / `"manual"` |

### 4.2 `apps/api/src/repository/__tests__/builder.repository.spec.ts`（新規）

`builder.diagnostics.repository.spec.ts` の stub 手法を踏襲し、`listTagsByMemberId` の `source` だけを変えて 500 回避を観測する。

| TC-ID | セットアップ | 期待 |
|-------|------|------|
| TC-A-B1 | `source:'seed'` の タグ stub | `AdminMemberDetailViewZ.safeParse(buildAdminMemberDetailView(...))` が `success===true` |
| TC-A-B2 | 同上 | 戻り値 `profile.tags[0].source === "manual"` |
| TC-A-B3 | `source:'unknown_xyz'` の stub | `success===true` かつ `tags[].source === "manual"` |
| TC-A-B4 | `source:'rule'` の stub | `success===true` かつ `tags[].source === "rule"`（恒等・非回帰） |
| TC-A-B5 | `source:'seed'` の stub | `MemberProfileZ.safeParse(buildMemberProfile(...))` が `success===true` かつ `tags[0].source === "manual"`（マイページ経路） |

## 5. ローカル実行・検証コマンド（CONST_005 必須）

```bash
# 1. ブランチ確認
git branch --show-current

# 2. 依存
pnpm install

# 3. 型 / lint
pnpm typecheck
pnpm lint

# 4. Lane A テスト（repo root 由来のため filter 指定）
pnpm exec vitest run packages/shared/src/zod/viewmodel.spec.ts packages/shared/src/__tests__/type-contracts.spec.ts
pnpm --filter @ubm-hyogo/api exec vitest run \
  apps/api/src/repository/__tests__/builder.repository.spec.ts

# 5. 既存 identity / viewmodel 系の非破壊確認（TagSourceZ 利用箇所の回帰）
pnpm --filter @ubm-hyogo/shared exec vitest run

# 6. union 非拡張の確認（TagSource は 3 値のまま）
grep -n 'export type TagSource' packages/shared/src/types/common.ts
```

## 6. 完了条件（DoD: Definition of Done・CONST_005 必須）

| ID | 条件 | 検証 |
|----|------|------|
| DoD-A-1 | `normalizeTagSource` が既知値恒等・全 falsy / 未知 → `"manual"`・例外なし | TC-A-N1〜N13 |
| DoD-A-2 | `TagSourceZ` が `.catch("manual")` で safeParse 不落（'seed' / 空 / 非文字列で success） | TC-A-Z1〜Z4 |
| DoD-A-3 | `builder.ts:357`/`:429` が `as` キャスト → `normalizeTagSource(t.source)` に置換され import 追記済み | `git diff builder.ts` |
| DoD-A-4 | seed source タグ保有 member で admin 詳細 / マイページ view が safeParse を通る（500 回避） | TC-A-B1〜B5 |
| DoD-A-5 | `TagSource` union（3 値）を拡張していない（AC-7） | §5 手順 6 |
| DoD-A-6 | `typecheck` / `lint` exit 0・既存 shared テスト非破壊 | §5 手順 3 / 5 |

## 7. ロールバック手順

```bash
git checkout -- packages/shared/src/types/common.ts \
                 packages/shared/src/zod/primitives.ts \
                 apps/api/src/repository/_shared/builder.ts
git rm packages/shared/src/zod/viewmodel.spec.ts \
       apps/api/src/repository/__tests__/builder.repository.spec.ts
```

戻すと seed / 未知 source で再び 500 になる。

## 8. 後続タスク・先送り項目

CONST_007 に違反する先送りは**無し**。DB CHECK 制約追加（migration）はスコープ外（不変条件で禁止・別ワークフロー）であり、本タスクのコード吸収が正本。

## 9. PR 作成方針（実行は別プロンプト）

CONST_002 により本仕様書作成プロンプトでは PR を作成しない。実装サイクル後、`.claude/commands/ai/diff-to-pr.md` のフローに従って user-gated で PR を作成する。base は `dev`。Lane B と同一 PR に束ねるか分割するかは実装サイクルの判断とし、いずれも base=`dev`。
