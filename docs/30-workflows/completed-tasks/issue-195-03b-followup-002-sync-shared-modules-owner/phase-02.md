# Phase 2: 設計

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 / 13 |
| 前 Phase | 1（要件定義） |
| 次 Phase | 3（設計レビュー） |
| 状態 | completed |

## 目的

owner 表ドキュメントの **構造・列定義・変更ルール文** を確定し、加えて今回サイクルで実体化する `apps/api/src/jobs/_shared/{ledger,sync-error,index}.ts` の API 設計（型・関数シグネチャ・JSDoc 必須項目・テスト粒度）を確定する。Phase 5 でそのまま流し込める粒度に揃える。

## 設計判断

### D-1: ディレクトリ階層

新規作成する: `docs/30-workflows/_design/`

- 既存 `docs/30-workflows/02-application-implementation/_design/` は **特定 wave 配下の設計**。本タスクの `_design/` は **workflow 横断 governance 設計** の置き場として位置付ける。
- 必要に応じて `_design/README.md` を併設し、`_design/` 配下が「ワークフロー横断の owner / contract / governance を集約する場所」であることを宣言する。

### D-2: ファイル名

`docs/30-workflows/_design/sync-shared-modules-owner.md`

- 目的的な命名（"sync-shared-modules-owner"）にすることで、後続 sync 系タスクが grep で発見しやすくする。

### D-3: owner 表の列定義

| 列 | 定義 | 備考 |
| --- | --- | --- |
| ファイル | `apps/api/src/jobs/_shared/` 配下の絶対パス | repo root 起点 |
| owner task | 正本実装責務を持つ task ID | 最大 1 つ |
| co-owner task | consumer 兼変更同意権を持つ task ID（複数可） | カンマ区切り |
| 変更時の必須レビュアー | PR 起票時に approver として要求する task | owner + co-owner と一致が基本 |
| 備考 | 役割 / 責務範囲 / 関連 schema | 自由記述 |

### D-4: 初期投入する行

| ファイル | owner task | co-owner task | 必須レビュアー | 備考 |
| --- | --- | --- | --- | --- |
| `apps/api/src/jobs/_shared/ledger.ts` | 03a | 03b | 03a / 03b | sync_jobs ledger 正本（thin facade）。`apps/api/src/repository/syncJobs.ts` の `start` / `succeed` / `fail` / `findLatest` / `listRecent` 等を re-export |
| `apps/api/src/jobs/_shared/sync-error.ts` | 03a | 03b | 03a / 03b | sync 系 error code 正本（`SyncErrorCode` union + `classifySyncError` + `redactMetricsJson`） |
| `apps/api/src/jobs/_shared/index.ts` | 03a | 03b | 03a / 03b | barrel export |

### D-4b: 実体化するモジュールの API 設計

- `SyncErrorCode = 'lock-conflict' | 'fetch-failed' | 'd1-write-failed' | 'unknown'`（最小 4 値）
- `classifySyncError(err: unknown): SyncErrorCode`（純関数。正規表現分類）
- `redactMetricsJson(json: Record<string, unknown>): Record<string, unknown>`（PII キー drop）
- `ledger.ts` は本体ロジックを持たず、`repository/syncJobs.ts` の re-export のみ
- 各 `.ts` 冒頭の JSDoc に「owner: 03a」「co-owner: 03b」「owner 表 path: docs/30-workflows/_design/sync-shared-modules-owner.md」を必須記述

### D-5: 変更ルール（owner 表本文に記載）

1. 対象ファイルに変更を加える PR は **owner task の Phase 13 PR Description** に「co-owner への通知」セクションを必須化する
2. PR の reviewer に owner / co-owner 双方を必ず指定する（solo 開発では `@daishiman` 1 名で構わないが、PR 本文に co-owner task ID を明示する）
3. consumer 側 task は変更提案を直接コミットせず、owner task で PR を起票して合意を取る
4. 後続 sync 系タスクが新規 `_shared/` モジュールを追加する場合は **本表に行を追加する PR を先行させる**

### D-6: 03a / 03b index.md からのリンク

両 `index.md` の冒頭メタ情報直下、または「dependencies」節に下記のリンクを追記する:

```markdown
> **共通モジュールの owner 表**: [docs/30-workflows/_design/sync-shared-modules-owner.md](../../_design/sync-shared-modules-owner.md)
```

相対パス（`../../_design/...`）は `completed-tasks/` 配下から 2 階層上に到達するため、各 index.md の物理位置に応じて `../../_design/sync-shared-modules-owner.md` 形式に統一する。

### D-7: 未割当 #7 との関係表現

owner 表末尾、または `_design/README.md` に下記の節を追加する:

```markdown
## 関連する未割当タスク

- `sync_jobs` `job_type` enum / `metrics_json` schema 集約タスク（未割当 #7）は本 owner 表を foundation として、表に列挙された owner / co-owner と整合する形で起票される予定。
```

## ファイル変更計画

| パス | 種別 | 内容 |
| --- | --- | --- |
| `apps/api/src/jobs/_shared/ledger.ts` | 新規ファイル | `repository/syncJobs.ts` の re-export facade |
| `apps/api/src/jobs/_shared/sync-error.ts` | 新規ファイル | `SyncErrorCode` + `classifySyncError` + `redactMetricsJson` |
| `apps/api/src/jobs/_shared/index.ts` | 新規ファイル | barrel export |
| `apps/api/src/jobs/_shared/__tests__/ledger.test.ts` | 新規ファイル | smoke import test |
| `apps/api/src/jobs/_shared/__tests__/sync-error.test.ts` | 新規ファイル | 境界値テスト 4 ケース以上 |
| `.github/CODEOWNERS` | 編集 | `apps/api/src/jobs/_shared/** @daishiman` 追加 |
| `docs/30-workflows/_design/sync-shared-modules-owner.md` | 編集 | 「未作成将来正本」表現を「実体化済み skeleton」に更新、`index.ts` 行追加 |
| `docs/30-workflows/completed-tasks/03a-...-stablekey-alias-queue/index.md` | 編集（既存維持） | owner 表へのリンク追記 |
| `docs/30-workflows/completed-tasks/03b-...-current-response-resolver/index.md` | 編集（既存維持） | owner 表へのリンク追記 |

## 設計検証

- 列定義 D-3 が AC-2（5 列要件）を満たす
- 初期行 D-4 が AC-3（3 行要件）を満たす
- D-4b が AC-8 / AC-9 / AC-10（ファイル実体・JSDoc・テスト）を満たす
- D-5 が AC-5（変更ルール明記）を満たす
- D-6 が AC-4（1 ホップ到達）を満たす
- D-7 が AC-6（未割当 #7 関連性記述）を満たす
- CODEOWNERS path 行追加が AC-11 を満たす
- `ledger.ts` / `sync-error.ts` / `index.ts` が apps/api 配下のため不変条件 #5 遵守

## 成果物

- `outputs/phase-02/main.md`（D-1〜D-7 の確定文）
- `outputs/phase-02/owner-table-draft.md`（owner 表 markdown 草稿）

## 完了条件

- ファイル変更計画表の全行が確定し、Phase 5 でそのままパス指定できる
- D-3〜D-7 の本文が AC とトレース可能

## 実行タスク

- [x] 本 Phase の責務に対応する成果物を作成または更新する
- [x] code / NON_VISUAL の分類と owner 表 governance の整合を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| workflow | `docs/30-workflows/completed-tasks/issue-195-03b-followup-002-sync-shared-modules-owner/` | 対象仕様書 |
| owner 表 | `docs/30-workflows/_design/sync-shared-modules-owner.md` | owner / co-owner 正本 |

## 統合テスト連携

- `pnpm exec vitest run --config vitest.config.ts apps/api/src/jobs/_shared`
- `pnpm --filter @ubm-hyogo/api typecheck`
- `pnpm --filter @ubm-hyogo/api lint`
