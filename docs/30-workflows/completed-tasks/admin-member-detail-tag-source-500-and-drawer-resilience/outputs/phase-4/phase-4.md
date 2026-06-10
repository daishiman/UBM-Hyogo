# Phase 4: I/O 契約・テスト計画

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 |
| taskType | implementation |
| implementation_mode | new |
| visualEvidence | VISUAL（Lane B の drawer error 分岐 UI が変わる。implemented_local_evidence_captured 段階では PNG 未取得） |
| workflow_state | implemented_local_evidence_captured |

## 目的

Phase 3 で確定した Lane A / Lane B の修正方針を、HTTP / 関数 I/O / テスト期待値の契約表へ落とし込み、Phase 5 の実装仕様書本体（task-01 / task-02）がそのまま実装・検証できる粒度の契約を固定する。とくに `normalizeTagSource` のガードについて、`_shared-context.md §1` で挙がった全 falsy / 未知パターン（空文字・null・undefined・大文字・前後空白）を Phase 4 で**網羅列挙**し（FB-UT-W3-HTTP の教訓：ガードの全 falsy パターンを Phase 4 で列挙する）、Phase 6 の fail path テストと 1:1 でトレースできる状態にする。

## 1. HTTP 契約

### 1.1 `GET /api/admin/members/:id`（Lane A 主対象・修正後）

対象は `apps/api/src/routes/admin/members.ts:506-508` の `AdminMemberDetailViewZ.safeParse(view)` 結果。`view` は `buildAdminMemberDetailView`（`apps/api/src/repository/_shared/builder.ts:372-452`）が組み立てる。

| ケース | リクエスト | 修正前 | 修正後（契約） | 根拠 |
| --- | --- | --- | --- | --- |
| seed source タグ保有 | `GET /api/admin/members/TEST-MEM-09`（`member_tags.source='seed'` を含む） | **500**（`safeParse` 失敗 → `members.ts:508` で `c.json({ ok:false, error }, 500)`） | **200**。レスポンス body は `AdminMemberDetailView` shape 不変。`profile.tags[].source` は正規化後 `"rule"\|"ai"\|"manual"` のいずれか（seed → `"manual"`） | AC-1 / AC-4 / AC-6 |
| 既知 source のみ | `GET /api/admin/members/:id`（`source='rule'\|'manual'` のみ） | 200 | **200**（不変。`normalizeTagSource` が恒等のため挙動同一） | 非回帰 |
| 未知 source 混在 | `GET /api/admin/members/:id`（`source` が空文字・任意未知文字列） | 500（同上） | **200**（未知値は `"manual"` へ正規化） | AC-2 / AC-3 |
| 存在しない member | `GET /api/admin/members/<不在>` | 404（`buildAdminMemberDetailView` が `null`） | **404**（不変。正規化は member 解決に非干渉） | negative guard |

> **レスポンス shape は不変**（AC-6）。本修正は view object 構築時の `tags[].source` 値正規化のみで、endpoint surface・HTTP method・path・キー構成・一覧 API を一切変えない。従来 strict で 500 だったケースが 200 に回復する**契約強化**であって破壊ではない。

### 1.2 会員マイページ経路（`buildMemberProfile`・修正後）

`buildMemberProfile`（`builder.ts:323-364`）は `/profile`（会員マイページ）経由で `MemberProfileZ.safeParse`（`packages/shared/src/zod/viewmodel.ts:71` の `tags[].source: TagSourceZ`）に通る。`builder.ts:357` のキャストも同様に置換するため、TEST-MEM-09 が `/profile` を開いても 500 にならない。HTTP 表は §1.1 と同型（200 回復）。

## 2. 関数契約

### 2.1 `normalizeTagSource(raw: string | null | undefined): TagSource`（新規・`packages/shared/src/types/common.ts`）

純粋関数。例外を投げない（WEEKGRD-02：純粋関数ガードは例外なし・防御的返却）。`KNOWN_TAG_SOURCES = ["rule","ai","manual"]` に**完全一致**するときのみ恒等、それ以外は全て `"manual"` へフォールバックする。

| # | 入力 `raw` | 出力 | 区分 |
| --- | --- | --- | --- |
| N-1 | `"rule"` | `"rule"` | 既知・恒等 |
| N-2 | `"ai"` | `"ai"` | 既知・恒等 |
| N-3 | `"manual"` | `"manual"` | 既知・恒等 |
| N-4 | `"seed"` | `"manual"` | 未知（seed 主症状） |
| N-5 | `""`（空文字） | `"manual"` | falsy・未知 |
| N-6 | `null` | `"manual"` | falsy・null |
| N-7 | `undefined` | `"manual"` | falsy・undefined |
| N-8 | `"RULE"`（大文字） | `"manual"` | 未知（大小区別あり・完全一致のみ恒等） |
| N-9 | `"Manual"`（先頭大文字） | `"manual"` | 未知（同上） |
| N-10 | `" rule "`（前後空白） | `"manual"` | 未知（trim しない・完全一致でない） |
| N-11 | `"ai "`（末尾空白） | `"manual"` | 未知（同上） |
| N-12 | `"unknown_xyz"`（任意未知文字列） | `"manual"` | 未知・将来の任意 source |

> **falsy / 未知パターン網羅（FB-UT-W3-HTTP 教訓）**: ガードが安全側へ落とすべき入力は「空文字 / null / undefined」の 3 falsy（N-5〜N-7）と「大文字・前後空白・任意未知文字列」の 4 非完全一致（N-8〜N-12）。これらを Phase 6 の fail path テストで 1:1 にトレースする。`normalizeTagSource` は `KNOWN_TAG_SOURCES.includes(raw as TagSource)` 判定のため、大小変換・trim・部分一致は**行わない**（厳密一致のみ恒等＝ブラスト半径最小）。

### 2.2 `TagSourceZ.safeParse(input)`（`packages/shared/src/zod/primitives.ts:29` に `.catch("manual")` 付与・修正後）

`z.enum(["rule","ai","manual"]).catch("manual")`。parse 失敗時にフォールバック値 `"manual"` を返すため `safeParse` は**常に `success: true`**。出力 union は `"rule"\|"ai"\|"manual"` のまま不変。

| # | 入力 | `safeParse(...).success` | `.data` | 区分 |
| --- | --- | --- | --- | --- |
| Z-1 | `"rule"` | `true` | `"rule"` | 既知・恒等 |
| Z-2 | `"ai"` | `true` | `"ai"` | 既知・恒等 |
| Z-3 | `"manual"` | `true` | `"manual"` | 既知・恒等 |
| Z-4 | `"seed"` | `true` | `"manual"` | 未知 → catch フォールバック |
| Z-5 | `""`（空文字） | `true` | `"manual"` | falsy → catch |
| Z-6 | `42`（非文字列） | `true` | `"manual"` | 型不一致 → catch |
| Z-7 | `null` | `true` | `"manual"` | falsy → catch |

> 注意: `.catch` は parse 失敗時のみフォールバックを返し、成功時の値は不変。`.default` ではない（`.default` は undefined 時のみ）。layer 1（`normalizeTagSource`）で既に正規値になるため、本番経路では `.catch` は到達しない**最終防壁**。`viewmodel.ts:71` / `identity.ts:68`（`MemberTagZ`）の利用は出力型互換のため意味不変。

## 3. テスト計画

新規 test は `*.spec.{ts,tsx}` のみ（不変条件 #8）。3 新規 spec の TC 一覧と期待値を以下に固定する。Phase 6 はこれを fail path / 回帰 guard 視点で集約する。

### 3.1 `packages/shared/src/zod/viewmodel.spec.ts`（新規・Lane A）

`normalizeTagSource` と `TagSourceZ.safeParse` を直接検証する純 unit テスト。

| TC-ID | ケース | 入力 | 期待 |
| --- | --- | --- | --- |
| TC-A-N1 | 既知値 `"rule"` 恒等 | `normalizeTagSource("rule")` | `"rule"` |
| TC-A-N2 | 既知値 `"ai"` 恒等 | `normalizeTagSource("ai")` | `"ai"` |
| TC-A-N3 | 既知値 `"manual"` 恒等 | `normalizeTagSource("manual")` | `"manual"` |
| TC-A-N4 | `"seed"` → `"manual"`（主症状） | `normalizeTagSource("seed")` | `"manual"` |
| TC-A-N5 | 空文字 → `"manual"` | `normalizeTagSource("")` | `"manual"` |
| TC-A-N6 | null → `"manual"` | `normalizeTagSource(null)` | `"manual"` |
| TC-A-N7 | undefined → `"manual"` | `normalizeTagSource(undefined)` | `"manual"` |
| TC-A-N8 | 大文字 `"RULE"` → `"manual"` | `normalizeTagSource("RULE")` | `"manual"` |
| TC-A-N9 | 先頭大文字 `"Manual"` → `"manual"` | `normalizeTagSource("Manual")` | `"manual"` |
| TC-A-N10 | 前後空白 `" rule "` → `"manual"` | `normalizeTagSource(" rule ")` | `"manual"` |
| TC-A-N11 | 末尾空白 `"ai "` → `"manual"` | `normalizeTagSource("ai ")` | `"manual"` |
| TC-A-N12 | 任意未知文字列 → `"manual"` | `normalizeTagSource("unknown_xyz")` | `"manual"` |
| TC-A-N13 | 例外を投げない（全 falsy / 未知で throw しない） | 上記 N5〜N12 を順に実行 | いずれも throw しない（`expect(() => ...).not.toThrow()`） |
| TC-A-Z1 | `safeParse("seed")` 成功・`"manual"` | `TagSourceZ.safeParse("seed")` | `success===true` かつ `data==="manual"` |
| TC-A-Z2 | `safeParse("rule")` 成功・恒等 | `TagSourceZ.safeParse("rule")` | `success===true` かつ `data==="rule"` |
| TC-A-Z3 | `safeParse("")` 成功・`"manual"` | `TagSourceZ.safeParse("")` | `success===true` かつ `data==="manual"` |
| TC-A-Z4 | `safeParse(42)` 成功・`"manual"`（非文字列も不落） | `TagSourceZ.safeParse(42)` | `success===true` かつ `data==="manual"` |

### 3.2 `apps/api/src/repository/__tests__/builder.repository.spec.ts`（新規・Lane A）

seed source タグを持つ member で `buildAdminMemberDetailView` / `buildMemberProfile` の出力が `AdminMemberDetailViewZ` / `MemberProfileZ` の `safeParse` を通る（500 回避・回帰）ことを検証する。配置の前例: `builder.diagnostics.repository.spec.ts` / `builder.repository.spec.ts`（同 `__tests__` ディレクトリ・repository provider ctx と各 list 関数を stub する手法）。

| TC-ID | ケース | セットアップ | 期待 |
| --- | --- | --- | --- |
| TC-A-B1 | seed source タグで admin 詳細 view が safeParse を通る | `listTagsByMemberId` が `source:'seed'` のタグを返す stub | `buildAdminMemberDetailView` の戻り値を `AdminMemberDetailViewZ.safeParse` → `success===true` |
| TC-A-B2 | admin 詳細 view の `tags[].source` が `"manual"` へ正規化 | 同上 | 戻り値 `profile.tags[0].source === "manual"` |
| TC-A-B3 | 未知任意 source も safeParse を通る | `source:'unknown_xyz'` の stub | `success===true` かつ `tags[].source === "manual"` |
| TC-A-B4 | 既知 source は恒等（非回帰） | `source:'rule'` の stub | `success===true` かつ `tags[].source === "rule"` |
| TC-A-B5 | seed source で `buildMemberProfile`（マイページ経路）も safeParse を通る | `listTagsByMemberId` が `source:'seed'` を返す stub | `buildMemberProfile` の戻り値を `MemberProfileZ.safeParse` → `success===true` かつ `tags[0].source === "manual"` |

> stub の最小化方針: `builder.diagnostics.repository.spec.ts` に倣い、member 解決 / response / status / visibility / attendance の各 list 関数を vi.mock / vi.spyOn で最小 stub し、`listTagsByMemberId` の `source` だけを変えて 500 回避を直接観測する。レスポンス shape は zod parse の成功そのものが証跡。

### 3.3 `apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx`（新規・Lane B）

`MemberDrawer` の詳細 fetch 失敗 → error 表示 → 再試行ボタン → 2 回目 fetch 成功 → 詳細表示へ回復を検証する。`global.fetch` を 1 回目 500・2 回目 200 でモックする（`MemberDrawer.tags.spec.tsx` の `vi.spyOn(globalThis,"fetch")` 手法を踏襲。`useAdminMutation` / `fetchMemberTags` の mock も同 spec の定義を流用し、回復後の子コンポーネントがクラッシュしないようにする）。

| TC-ID | ケース | fetch mock | 期待 |
| --- | --- | --- | --- |
| TC-B-R1 | 初回 500 → error 表示 + 再試行ボタン表示 | 1 回目 `{ok:false,status:500}` | `role="alert"` に「読み込み失敗」を含む / `[data-testid="member-detail-retry"]` が存在 |
| TC-B-R2 | 再試行ボタン押下 → 2 回目成功 → 詳細表示へ回復 | 1 回目 500・2 回目 `{ok:true,json:()=>mkDetail()}` | ボタン click 後 `waitFor` で詳細本体（例: `mkDetail()` の `fullName`「山田 太郎」）が描画され、`role="alert"` の「読み込み失敗」が消える |
| TC-B-R3 | 再試行で `data`/`error` がリセットされ再 fetch される | 同 TC-B-R2 | click 後に少なくとも 2 回 `fetch` が呼ばれる（`toHaveBeenCalledTimes(2)` 以上）/ 回復後 `member-detail-retry` ボタンが消える |
| TC-B-R4 | 初回成功時は再試行ボタンを描画しない（非回帰） | 1 回目 `{ok:true,...}` | `[data-testid="member-detail-retry"]` が存在しない / 詳細本体が描画 |

## 4. vitest 実行コマンド（repo root 由来の注意込み）

web / api / shared の vitest config は **repo root を root** とするため、ファイル指定時はワークスペース filter またはフルパス + `--root` を付ける（前例: `cd apps/web && vitest run src/... --root ../..`）。

```bash
# Lane A: shared 純関数 + zod 防壁
pnpm exec vitest run packages/shared/src/zod/viewmodel.spec.ts packages/shared/src/__tests__/type-contracts.spec.ts

# Lane A: api builder の seed source 回帰
pnpm --filter @ubm-hyogo/api exec vitest run \
  apps/api/src/repository/__tests__/builder.repository.spec.ts

# Lane B: drawer resilience（web は repo root 由来のためフルパス + --root を付ける手もある）
pnpm --filter @ubm-hyogo/web exec vitest run \
  apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx
```

> web の vitest が「No test files found」で exit 1 になる場合は `cd apps/web && pnpm exec vitest run apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx --root ../..` で実行する（`_shared-context.md §4` の repo root 注意）。

## 完了条件

- [x] `GET /api/admin/members/:id` の seed source → 200（修正後）・shape 不変を HTTP 契約表で確定（§1）
- [x] `buildMemberProfile`（マイページ経路）の同型 200 回復を明記（§1.2）
- [x] `normalizeTagSource` の入出力表を全 falsy / 未知パターン（N-5〜N-12）込みで網羅列挙（§2.1・FB-UT-W3-HTTP 教訓）
- [x] `TagSourceZ.safeParse` の期待（'seed'→success/data='manual'、正規値恒等、非文字列も不落）を確定（§2.2）
- [x] 3 新規 spec の TC 一覧と期待値を確定（§3）
- [x] vitest 実行コマンドを repo root 注意込みで確定（§4）

## 成果物

- `outputs/phase-4/phase-4.md`（本ファイル）

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | admin member API の HTTP status・レスポンス shape（不変であることの確認） |
| Admin 管理 | `docs/00-getting-started-manual/specs/11-admin-management.md` | `/admin/members` 一覧 + ドロワーの正本 |

- `_shared-context.md`（設計確定事実の単一ソース・§1-5）
- `outputs/phase-1/phase-1.md`（AC・真因）/ `outputs/phase-3/phase-3.md`（代替案・リスク）

## 統合テスト連携

本契約（§2 の N-/Z- 行、§3 の TC-ID）を Phase 5 の task-01 / task-02 の `## テスト方針` 表へ展開し、Phase 6（fail path / 回帰 guard・identity 系回帰）・Phase 7（変更ブロックの line/branch カバレッジ）で再利用する。
