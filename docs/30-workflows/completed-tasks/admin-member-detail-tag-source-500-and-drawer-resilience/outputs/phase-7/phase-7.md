# Phase 7: カバレッジ確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 |
| taskType | implementation |
| implementation_mode | new |
| visualEvidence | VISUAL |
| workflow_state | implemented_local_evidence_captured |

## 目的

Lane A / Lane B のテスト群が、本サイクルで**変更・新規追加するブロックに限定**して line / branch を充足することを、対象ファイル・対象関数・実測予定値の表で固定する。カバレッジ目標は apps/packages 全体の一律閾値ではなく、変更した関数・分岐に限定して評価する（FB-BEFORE-QUIT-002 / Feedback 5: 広域指定にしない）。本ワークフローは `implemented_local_evidence_captured` のため、実測値は **pending**（実走は本実装サイクル）とし、本フェーズは「本実装サイクルで実行する検証手順の仕様」を確定する。

## 実行タスク

### 7.1 カバレッジ対象範囲（限定スコープ）

| Lane | 変更/新規ファイル | カバレッジ評価対象ブロック | 評価対象外 |
|------|-------------------|----------------------------|-----------|
| A | `packages/shared/src/types/common.ts`（編集） | 新規 `normalizeTagSource` 純関数本体（`KNOWN_TAG_SOURCES.includes` 判定 + 三項返却） | 同ファイルの既存 `TagSource` 型・他 export（変更しない） |
| A | `packages/shared/src/zod/primitives.ts`（編集） | `TagSourceZ` に付与した `.catch("manual")` 経路（parse 失敗 → フォールバック）と正常 parse 経路 | 他 primitive schema（変更しない） |
| A | `apps/api/src/repository/_shared/builder.ts`（編集） | `buildMemberProfile`（357）と `buildAdminMemberDetailView`（429）の `source` 構築行（`as` キャスト → `normalizeTagSource(t.source)` の置換行）+ 追加 import 行 | 両 builder の他フィールド組み立て（変更しない） |
| B | `apps/web/src/features/admin/components/_members/MemberDrawer.tsx`（編集） | `reloadKey` を含む `useEffect` 依存配列の再駆動経路と error 分岐（再試行ボタン描画 + 押下ハンドラ `setError(null); setData(null); setReloadKey((k) => k + 1)`） | 成功時の `MemberDrawerBody` / `MemberTagsEditor` 描画（本不具合経路外・変更しない） |

### 7.2 変更ブロックの line / branch 実測予定値

| 対象ブロック | 関数 / 箇所 | line 予定 | branch 予定 | 充足テスト |
|--------------|-------------|-----------|-------------|-----------|
| `normalizeTagSource` 本体 | `common.ts` `normalizeTagSource` | 100%（全 statement 実行） | 100%（`includes` true 分岐 = 既知 3 値 各 / false 分岐 = `'seed'`・未知・空文字・`null`・`undefined`） | TS-1〜TS-8 |
| `TagSourceZ.catch` 経路 | `primitives.ts` `TagSourceZ` | 100% | 100%（parse 成功 = 既知値恒等 / parse 失敗 = `.catch("manual")` フォールボー） | TS-9（成功）/ TS-10（失敗→`'manual'`） |
| builder 357 置換行 | `builder.ts` `buildMemberProfile` の `source: normalizeTagSource(t.source)` | 100% | 分岐なし（無条件呼び出し。分岐は `normalizeTagSource` 側で被覆） | BD-1（profile・seed source 回帰） |
| builder 429 置換行 | `builder.ts` `buildAdminMemberDetailView` の `source: normalizeTagSource(t.source)` | 100% | 分岐なし（同上） | BD-2（detail view・seed source 回帰） |
| MemberDrawer retry 分岐 | `MemberDrawer.tsx` error 分岐 + 押下ハンドラ | 100% | 100%（fetch 成功 = data 描画 / fetch 失敗 = error + retry ボタン描画 / retry 押下 = `reloadKey` 増分で再 fetch 成功） | MD-1（失敗→retry 表示）/ MD-2（押下→回復）/ MD-3（既存成功系 回帰） |

> line / branch は上表のとおり**変更ブロックで 100%** を充足予定値とする。新規追加コードはすべて Lane A / Lane B のテストで分岐被覆されるため、未到達分岐を残さない設計とする。実測値は本実装サイクル（コード実走）で確定するため、本フェーズでは **pending** と明記する。

### 7.3 branch 列挙の根拠（FB-BEFORE-QUIT-002）

`normalizeTagSource` の branch は「既知値（`'rule'` / `'ai'` / `'manual'` の各恒等）」と「未知値（`'seed'` / 任意未知文字列 / 空文字 / `null` / `undefined` → `'manual'`）」の双方を網羅する。`TagSourceZ.catch` の branch は「正規値の parse 成功（恒等）」と「未正規化値の parse 失敗（`.catch` 到達）」の双方を、`MemberDrawer` の retry 分岐は「初回失敗 → error+retry 表示」「retry 押下 → 再 fetch 成功 → 回復」「成功系初回描画（既存回帰）」を網羅する。これらは Phase 4（I/O 契約）/ Phase 6（テスト拡充）のケースと 1:1 で対応する（テスト ID は Phase 4/6 確定後に同期）。

### 7.4 coverage-guard 整合

- `bash scripts/coverage-guard.sh --changed` は変更行に対する被覆を判定する。本サイクルの変更行（`common.ts` 純関数・`primitives.ts` 1 行・`builder.ts` 357/429 + import・`MemberDrawer.tsx` の state/依存/error 分岐）はすべて 7.2 の対象ブロックに含まれ、Lane A / Lane B のテストで到達するため、changed-line coverage は閾値を割り込まない。
- sync-merge の merge commit は CLAUDE.md 記載のとおり coverage-guard を自動スキップする対象であり、本タスクの feature commit には適用される。

### 7.5 カバレッジ計測コマンド（限定実行・本実装サイクルで実走）

> vitest config は repo root を root とするため、ファイル指定はフルパス + 必要に応じ `--root` を付ける（前例: `cd apps/web && vitest run src/... --root ../..`）。

| Lane / 対象 | コマンド |
|------|---------|
| A (shared) | `pnpm exec vitest run packages/shared/src/zod/viewmodel.spec.ts packages/shared/src/__tests__/type-contracts.spec.ts` |
| A (api) | `pnpm exec vitest run --config=vitest.d1.config.ts apps/api/src/repository/__tests__/builder.repository.spec.ts` |
| B (web) | `pnpm exec vitest run apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx` |

計測後、`coverage/` レポートで 7.1 の対象ファイルのみを確認し、7.2 の line/branch 予定値（変更ブロック 100%）と一致することを判定する。

## 完了条件

- [x] カバレッジ評価対象を変更ファイル / 変更ブロックに限定（広域一律指定にしない）
- [x] 各変更ブロック（`normalizeTagSource` line/branch・`TagSourceZ.catch` 経路・builder 357/429 置換行・`MemberDrawer` retry 分岐）の line / branch 実測予定値（100%）と充足テストを対応付け
- [x] 実測値は `implemented_local_evidence_captured` のため pending と明記（実走は本実装サイクル）
- [x] coverage-guard（changed-line）との整合を明示
- [x] 限定スコープのカバレッジ計測コマンドを固定

## 成果物

- `outputs/phase-7/phase-7.md`（本ファイル）

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | admin member detail API の status / shape（カバレッジ対象境界の確認） |
| Admin 管理 | `docs/00-getting-started-manual/specs/11-admin-management.md` | `/admin/members` 一覧 + ドロワー（MemberDrawer retry 分岐の文脈） |

- `_shared-context.md §2-4`（変更ブロックの逐語固定）
- `outputs/phase-3/phase-3.md`（変更ファイル俯瞰）

## 統合テスト連携

7.2 の変更ブロック被覆を Phase 9 の品質保証（typecheck/lint/対象 vitest 一括）と同時に確認し、未到達分岐ゼロを最終レビュー（Phase 10）の AC 充足判定へ引き継ぐ。
