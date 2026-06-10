# Phase 5: 実装手順インデックス

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 |
| taskType | implementation |
| implementation_mode | new |
| visualEvidence | VISUAL（Lane B が drawer error UI を変更。implemented_local_evidence_captured 段階では PNG 未取得） |
| workflow_state | implemented_local_evidence_captured |

## 目的

Phase 4 で確定した I/O 契約を、コード実装可能な 2 つの実装仕様書本体（task-01 = Lane A / task-02 = Lane B）へ分解し、各タスクの相互依存と実行順を確定する。本サイクルで 2 タスクすべてを完結させる（CONST_007: 先送り無し）。

## 実行タスク

### 5.1 タスク一覧と実装仕様書本体

| タスク | 領域 | 実装仕様書 | 概要 |
| --- | --- | --- | --- |
| Lane A | `packages/shared` + `apps/api` | [`task-01-lane-a-tag-source-normalization.md`](./task-01-lane-a-tag-source-normalization.md) | タグ source の fail-soft 正規化（`normalizeTagSource()` 純関数新設）+ `TagSourceZ` の `.catch("manual")` 防御 + `builder.ts:357`/`:429` の `as` キャスト置換 + 回帰テスト |
| Lane B | `apps/web`（UI） | [`task-02-lane-b-drawer-resilience.md`](./task-02-lane-b-drawer-resilience.md) | `MemberDrawer` の詳細 fetch 失敗時に「再試行」ボタンを追加し、`reloadKey` state で useEffect を再駆動して回復可能化 + テスト |

### 5.2 依存関係と実行順

Lane A / Lane B は関心が完全に分離（API/型/zod の値ドメイン正規化 vs web UI のエラー回復）し、相互にコード依存が無いため**並列実装可能**。

- **Lane A 内の順序**: `packages/shared`（`normalizeTagSource` / `TagSourceZ`）→ `apps/api`（`builder.ts` が import）の順。同 Lane 内で順序はあるが 1 実装者で逐次完結する。
- **Lane B**: Lane A に非依存。詳細 fetch のライフサイクル（`data`/`error`/`reloadKey`）は `MemberDrawer` 内に閉じる。

> Lane A が landed すれば seed source 500 自体が消えるため Lane B の再試行は「将来の他要因 500」への防御（多重防御）。両方を本サイクルで実装する（先送りなし）。

### 5.3 検証コマンド（全タスク共通の最終確認）

```bash
pnpm typecheck
pnpm lint

# Lane A
pnpm exec vitest run packages/shared/src/zod/viewmodel.spec.ts packages/shared/src/__tests__/type-contracts.spec.ts
pnpm --filter @ubm-hyogo/api exec vitest run \
  apps/api/src/repository/__tests__/builder.repository.spec.ts

# Lane B
pnpm --filter @ubm-hyogo/web exec vitest run \
  apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx
```

## 完了条件

- [x] Lane A / Lane B の実装仕様書本体へのリンクを確定
- [x] 依存関係（相互非依存・並列可。Lane A 内 shared→api 順）と実行順を確定
- [x] 全タスク共通の検証コマンドを確定
- [x] 先送り・別 PR・バックログ送りが無いことを明記（CONST_007）

## 成果物

- `outputs/phase-5/phase-5.md`（本ファイル）
- `outputs/phase-5/task-01-lane-a-tag-source-normalization.md`
- `outputs/phase-5/task-02-lane-b-drawer-resilience.md`

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | admin member API のレスポンス shape の不変確認 |
| Admin 管理 | `docs/00-getting-started-manual/specs/11-admin-management.md` | `/admin/members` 一覧 + ドロワーの正本 |
| 設計トークン | `apps/web/src/styles/tokens.css` / `docs/00-getting-started-manual/specs/09b-design-tokens.md` | Lane B が参照する `--ubm-color-danger` 系トークン |

- `outputs/phase-4/phase-4.md`（I/O 契約・テスト計画）
- `_shared-context.md`（設計確定事実・§2-4）

## 統合テスト連携

各 task-0N の `## テスト方針` の TC-ID を Phase 6（fail path / 回帰 guard・identity 系回帰）で集約し、Phase 7 で変更ブロックの line/branch カバレッジを確認する。
