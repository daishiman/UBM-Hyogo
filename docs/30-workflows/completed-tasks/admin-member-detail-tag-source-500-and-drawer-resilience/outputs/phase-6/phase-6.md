# Phase 6: テスト拡充（fail path / 回帰 guard）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 |
| taskType | implementation |
| implementation_mode | new |
| visualEvidence | VISUAL（Lane B の drawer error UI。implemented_local_evidence_captured 段階では PNG 未取得） |
| workflow_state | implemented_local_evidence_captured |

## 目的

Lane A（tag source 正規化 + zod 防壁 + builder 適用）/ Lane B（`MemberDrawer` 再試行）の各修正に対し、正常系だけでなく **fail path（seed / 空文字 / null / undefined / 大文字 / 前後空白 / 任意未知文字列 / 非文字列、および fetch 500）と回帰 guard** を網羅するテストケースを確定する。とくに `normalizeTagSource` の全 falsy / 未知パターン（Phase 4 §2.1 の N-5〜N-12）と、`TagSourceZ.catch` を使う既存 consumer（`viewmodel.ts:71` / `identity.ts:68`）の非破壊を担保する。新規 test ファイルはすべて `*.spec.{ts,tsx}` のみ。

## 実行タスク

### 6.1 Lane A: `normalizeTagSource` + `TagSourceZ` fail path（`viewmodel.spec.ts`）

ファイル: `packages/shared/src/zod/viewmodel.spec.ts`（新規）

Phase 4 §3.1 の TC を fail path 視点で再掲。既知 3 値（恒等）は正常系、それ以外は全て fail path（安全側 `"manual"` へ落とす）。

| ID | 入力 | 期待 | 区分 |
|----|------|------|------|
| AN-1〜3 | `"rule"` / `"ai"` / `"manual"` | 恒等 | 正常系 |
| AN-4 | `"seed"` | `"manual"` | fail path（主症状） |
| AN-5 | `""`（空文字） | `"manual"` | fail path（falsy） |
| AN-6 | `null` | `"manual"` | fail path（falsy） |
| AN-7 | `undefined` | `"manual"` | fail path（falsy） |
| AN-8 | `"RULE"`（大文字） | `"manual"` | fail path（非完全一致） |
| AN-9 | `"Manual"`（先頭大文字） | `"manual"` | fail path（非完全一致） |
| AN-10 | `" rule "`（前後空白） | `"manual"` | fail path（trim しない） |
| AN-11 | `"ai "`（末尾空白） | `"manual"` | fail path（同上） |
| AN-12 | `"unknown_xyz"` | `"manual"` | fail path（任意未知） |
| AN-13 | AN-5〜12 を順に実行 | いずれも throw しない | 例外なし guard（WEEKGRD-02） |
| AZ-1 | `TagSourceZ.safeParse("seed")` | `success===true` / `data==="manual"` | zod 防壁（catch） |
| AZ-2 | `TagSourceZ.safeParse("rule")` | `success===true` / `data==="rule"` | 恒等（非回帰） |
| AZ-3 | `TagSourceZ.safeParse("")` | `success===true` / `data==="manual"` | zod 防壁（空文字） |
| AZ-4 | `TagSourceZ.safeParse(42)` | `success===true` / `data==="manual"` | zod 防壁（非文字列も不落） |

> **全 falsy / 未知パターンの網羅（FB-UT-W3-HTTP 教訓）**: 安全側へ落とすべき入力 = 3 falsy（AN-5〜7）+ 5 非完全一致（AN-8〜12）。これらを 1 ケースずつ独立 assert し、AN-13 で「いずれも throw しない」を別途固める。

### 6.2 Lane A: builder の seed source 回帰 guard（`builder.repository.spec.ts`）

ファイル: `apps/api/src/repository/__tests__/builder.repository.spec.ts`（新規）

`builder.diagnostics.repository.spec.ts` の stub 手法を踏襲し、`listTagsByMemberId` の `source` だけを変えて 500 回避（safeParse 成功）を直接観測する。

| ID | セットアップ | 期待 | 検証観点 |
|----|------|------|----------|
| AB-1 | `source:'seed'` タグ stub | `AdminMemberDetailViewZ.safeParse(buildAdminMemberDetailView(...))` が `success===true` | AC-1 中核（admin 詳細 200 回復） |
| AB-2 | 同上 | `profile.tags[0].source === "manual"` | 正規化の値確認 |
| AB-3 | `source:'unknown_xyz'` stub | `success===true` / `tags[].source === "manual"` | 任意未知 source の回帰 |
| AB-4 | `source:'rule'` stub | `success===true` / `tags[].source === "rule"` | 既知 source 恒等（非回帰） |
| AB-5 | `source:'seed'` stub | `MemberProfileZ.safeParse(buildMemberProfile(...))` が `success===true` / `tags[0].source === "manual"` | AC-4（マイページ経路 200 回復） |

### 6.3 Lane B: `MemberDrawer` 再試行 fail path / 回復（`MemberDrawer.spec.tsx`）

ファイル: `apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx`（新規）

`global.fetch` を 1 回目 500・2 回目 200 でモック（`MemberDrawer.tags.spec.tsx` の手法・`useAdminMutation` / `fetchMemberTags` mock を流用）。

| ID | fetch mock | 期待 | 検証観点 |
|----|-----------|------|----------|
| BR-1 | 1 回目 `{ok:false,status:500}` | `getByRole("alert")` に「読み込み失敗」/ `getByTestId("member-detail-retry")` 存在 | fail path（error + retry 表示） |
| BR-2 | 1 回目 500・2 回目 `{ok:true,json:()=>mkDetail()}` | click 後「山田 太郎」描画・alert 消失 | 回復（AC-5 中核） |
| BR-3 | 同 BR-2 | click 後 `fetch` 2 回以上・回復後 `member-detail-retry` 消失 | 再 fetch 駆動の確認 |
| BR-4 | 1 回目 `{ok:true,...}` | `queryByTestId("member-detail-retry")` が null・詳細描画 | 初回成功時 非描画（非回帰） |

### 6.4 既存テストへの非破壊確認（回帰 guard）

| 対象 | ファイル | 確認内容 | コマンド |
|------|---------|----------|---------|
| 既存 drawer tags | `MemberDrawer.tags.spec.tsx`（B-T1〜B-T8） | useEffect 依存拡張（`[memberId,reloadKey]`）後も初回成功経路（`mockDetailFetch` が `ok:true`）の挙動不変 | `pnpm --filter @ubm-hyogo/web exec vitest run src/features/admin/components/_members/__tests__/MemberDrawer.tags.spec.tsx` |
| 既存 drawer inline create | `MemberDrawer.tagInlineCreate.spec.tsx` | 同上（error 分岐の DOM 構造変更が成功経路に非影響） | `pnpm --filter @ubm-hyogo/web exec vitest run src/features/admin/components/_members/__tests__/MemberDrawer.tagInlineCreate.spec.tsx` |
| identity 系（`TagSourceZ` 利用） | `identity.ts:68`（`MemberTagZ.source: TagSourceZ`）を使う既存 spec | `.catch("manual")` 付与後も既知値（正常データ）の parse 結果が不変・`IdentityResolution` 等の意味不変 | `pnpm --filter @ubm-hyogo/shared exec vitest run` |
| viewmodel 系（`TagSourceZ` 利用） | `viewmodel.ts:71`（`MemberProfileZ.tags[].source`）を使う既存 spec | 既知値での parse 結果不変・`.strict()` の他キー検証に非干渉 | 同上（shared 全 spec） |

> **identity 系回帰の方針**: `TagSourceZ` は `MemberTagZ`（`identity.ts:65-72`）でも使われる。`.catch("manual")` は parse 失敗時のみフォールバックを返し、成功時の値・出力 union（`"rule"|"ai"|"manual"`）は不変なので、`MemberTagZ` を含む既存 consumer の正常データ（既知 source のみ）に対する挙動は変わらない。shared パッケージ全 spec を回帰実行し、既存 assert がすべて通ること（drift 0）を確認する。万一 identity 系で未知 source を渡す negative spec が存在する場合は、従来 `safeParse` 失敗を期待していたものが `success===true`（data=`"manual"`）に変わるため、当該 spec の期待値を本修正の意図（防壁化）に合わせて更新する。

### 6.5 補助コマンド（テスト実行）

| 対象 | コマンド |
|------|---------|
| Lane A 純関数/zod | `pnpm exec vitest run packages/shared/src/zod/viewmodel.spec.ts packages/shared/src/__tests__/type-contracts.spec.ts` |
| Lane A builder 回帰 | `pnpm exec vitest run --config=vitest.d1.config.ts apps/api/src/repository/__tests__/builder.repository.spec.ts` |
| Lane A 既存 shared 全 spec（identity/viewmodel 回帰） | `pnpm --filter @ubm-hyogo/shared exec vitest run` |
| Lane B 再試行 | `pnpm exec vitest run apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx` |
| Lane B 既存 drawer 回帰 | `pnpm --filter @ubm-hyogo/web exec vitest run src/features/admin/components/_members/__tests__/MemberDrawer.tags.spec.tsx src/features/admin/components/_members/__tests__/MemberDrawer.tagInlineCreate.spec.tsx` |

## 完了条件

- [x] Lane A `normalizeTagSource` の全 falsy / 未知パターン（AN-5〜12）+ 例外なし（AN-13）を列挙
- [x] Lane A `TagSourceZ.catch` の fail path（seed / 空 / 非文字列）を列挙（AZ-1〜4）
- [x] Lane A builder の seed / 未知 source 回帰 guard（AB-1〜5・マイページ経路含む）を列挙
- [x] Lane B fetch 500 → error + retry → 回復（BR-1〜3）+ 初回成功 非描画（BR-4）を列挙
- [x] 既存 drawer テスト（tags / tagInlineCreate）への非破壊確認方針を明記
- [x] identity 系（`TagSourceZ` を使う `identity.ts:68`）/ viewmodel 系の回帰確認方針を明記
- [x] 新規 test ファイルがすべて `*.spec.{ts,tsx}` 規則であることを確認

## 成果物

- `outputs/phase-6/phase-6.md`（本ファイル）

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | admin member API のレスポンス shape（builder 回帰の判定基準） |
| Admin 管理 | `docs/00-getting-started-manual/specs/11-admin-management.md` | `/admin/members` ドロワーの正本 |

- `outputs/phase-4/phase-4.md`（I/O 契約・TC 一覧）
- `outputs/phase-5/task-01-lane-a-tag-source-normalization.md` / `task-02-lane-b-drawer-resilience.md`
- `_shared-context.md §1`（真因・全 falsy 列挙の根拠）

## 統合テスト連携

AN / AZ / AB / BR と既存回帰の各ケースを Phase 7 で変更ブロックの line/branch カバレッジに対応づけ、Phase 9 で typecheck / lint と併せ一括 PASS を確認する。
