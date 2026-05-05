# Phase 6: runtime SSOT 配置 ADR 追記 + owner 表行追加 + 参照リンク追記

[実装区分: 実装仕様書（CONST_004 例外条件適用）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-195-sync-jobs-contract-schema-consolidation-001 |
| Phase 番号 | 6 / 13 |
| Phase 名称 | runtime SSOT 配置 ADR 追記 + owner 表行追加 + 参照リンク追記 |
| Wave | 5 |
| Mode | parallel（実装仕様書） |
| 作成日 | 2026-05-04 |
| 前 Phase | 5 (既存 contract test カバレッジ棚卸し) |
| 次 Phase | 7 (contract test 補強 + database-schema.md 参照再確認) |
| 状態 | created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| user_approval | REQUIRED |

## 第 0 セクション: 実装区分の宣言

本 Phase は実体ファイル変更を伴う。Phase 2 設計に基づき `_design/sync-jobs-spec.md` への ADR-001 追記、`_design/sync-shared-modules-owner.md` への owner 表行追加、`_design/sync-jobs-spec.md` §2 / §3 / §5 への参照リンク追記を 1 コミット（C1）にまとめる。

## 目的

AC-1 / AC-2 / AC-3 を満たす markdown 編集を完了する。

## 変更対象ファイル

| 種別 | パス | 編集内容 |
| --- | --- | --- |
| 編集 | docs/30-workflows/_design/sync-jobs-spec.md | §1 直下に `## ADR-001 runtime SSOT 配置` 追加 / §2 / §3 / §5 に owner 表 + runtime SSOT 1-hop 参照追記 |
| 編集 | docs/30-workflows/_design/sync-shared-modules-owner.md | 冒頭注釈に `sync-jobs-schema.ts` の射程拡張 / owner 表に 1 行追加 |

## 実行タスク

1. `_design/sync-jobs-spec.md` §1 直下に ADR-001 セクション追加（Phase 2 設計の本文骨子をそのまま流用）
2. `_design/sync-jobs-spec.md` §2 末尾に owner 表参照リンク 1 行追加
3. `_design/sync-jobs-spec.md` §3 既存「TS ランタイム正本」注記の直下に owner 表参照リンク追記
4. `_design/sync-jobs-spec.md` §5 既存「TS ランタイム正本」注記の直下に owner 表参照リンク追記
5. `_design/sync-shared-modules-owner.md` 冒頭注釈に「`apps/api/src/jobs/_shared/sync-jobs-schema.ts` も実体化済み skeleton 群と同様に本表で運用する」を追記
6. `_design/sync-shared-modules-owner.md` の owner 表に新規行を追加（owner: 03a / co-owner: 03b / 備考に issue-195 で登録した旨）
7. `outputs/phase-06/main.md` に diff サマリと grep 確認を記録

## 編集テンプレート

### 1. `_design/sync-jobs-spec.md` 冒頭追加（§1 直下）

```md
## ADR-001 runtime SSOT 配置

> 用語: owner = 主担当 / co-owner = サブ担当（L-005）

### Status
- Accepted (2026-05-04, issue-195 / #435)

### Context
- `sync_jobs.job_type` enum / `metrics_json` schema / `SYNC_LOCK_TTL_MS` を runtime 値として一元化する SSOT が必要
- 候補: (a) `apps/api/src/jobs/_shared/sync-jobs-schema.ts` 維持, (b) `packages/shared` 移管

### Decision
- (a) **`apps/api/src/jobs/_shared/sync-jobs-schema.ts` を runtime SSOT として維持する**

### Rationale
1. CLAUDE.md 不変条件 5「D1 への直接アクセスは `apps/api` に閉じる」に整合。`sync_jobs` は D1 binding 前提。
2. `apps/web` 配下の `sync_jobs` 参照ゼロ（grep 確認済み）。クロスアプリ共有の必要性が無い。
3. `packages/shared` 配下の `sync_jobs` 参照ゼロ。移管は YAGNI。
4. 03b-followup-005 (Issue #198) で当該配置で consumer 差し替え済み。物理移動は破壊的変更。

### Alternatives Considered
- (b) `packages/shared` 移管: クロスアプリ参照が将来発生した時点で再評価。現時点では不採用。

### Links
- markdown 論理正本: 本ファイル
- runtime SSOT: [`apps/api/src/jobs/_shared/sync-jobs-schema.ts`](../../../apps/api/src/jobs/_shared/sync-jobs-schema.ts)
- owner 表: [`docs/30-workflows/_design/sync-shared-modules-owner.md`](sync-shared-modules-owner.md)
- 先行タスク: `docs/30-workflows/completed-tasks/03b-followup-005-sync-jobs-design-spec/`
```

### 2. §2 / §3 / §5 末尾に追記する参照リンク行

```md
> **Owner / co-owner**: [`docs/30-workflows/_design/sync-shared-modules-owner.md`](sync-shared-modules-owner.md) を参照（owner = 主担当 / co-owner = サブ担当）。
```

### 3. `_design/sync-shared-modules-owner.md` の冒頭注釈拡張

既存の「`apps/api/src/jobs/_shared/ledger.ts` と `apps/api/src/jobs/_shared/sync-error.ts` は本タスク（issue-195-03b-followup-002）で実体化済みの skeleton モジュールである。」段落の後に以下を追記:

```md
`apps/api/src/jobs/_shared/sync-jobs-schema.ts` は 03b-followup-005 (Issue #198) で実体化済みの runtime contract 正本モジュールである。issue-195 (#435) で本表に owner / co-owner を登録した。
```

### 4. `_design/sync-shared-modules-owner.md` の owner 表行追加

```md
| `apps/api/src/jobs/_shared/sync-jobs-schema.ts` | 03a | 03b | 03a / 03b | sync_jobs runtime contract 正本（`SYNC_JOB_TYPES` / `SYNC_LOCK_TTL_MS` / `metricsJsonBaseSchema` / `assertNoPii` / `parseMetricsJson` 他）。issue-195 (#435) で本表に登録。markdown 論理正本: `_design/sync-jobs-spec.md`。 |
```

## ローカル実行コマンド

```bash
# diff 確認
git diff docs/30-workflows/_design/sync-jobs-spec.md
git diff docs/30-workflows/_design/sync-shared-modules-owner.md

# 1-hop 到達 grep（Phase 4 verify suite A-4 / A-5）
rg -n "sync-shared-modules-owner" docs/30-workflows/_design/sync-jobs-spec.md
rg -n "_shared/sync-jobs-schema" docs/30-workflows/_design/sync-jobs-spec.md
rg -n "sync-jobs-schema\\.ts" docs/30-workflows/_design/sync-shared-modules-owner.md

# secret-hygiene
rg -n "API_TOKEN|SECRET|password" docs/30-workflows/_design/sync-jobs-spec.md docs/30-workflows/_design/sync-shared-modules-owner.md
```

## DoD

- [ ] `_design/sync-jobs-spec.md` に ADR-001 セクションが追加されている
- [ ] `_design/sync-jobs-spec.md` §2 / §3 / §5 に owner 表参照リンクが追記されている
- [ ] `_design/sync-shared-modules-owner.md` の owner 表に新規行が追加されている
- [ ] `_design/sync-shared-modules-owner.md` の冒頭注釈に `sync-jobs-schema.ts` の射程が追記されている
- [ ] secret 文字列が混入していない（grep 0 行）
- [ ] 1 コミット（C1）にまとまっている

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 編集 | docs/30-workflows/_design/sync-jobs-spec.md | ADR-001 + 参照リンク追記 |
| 編集 | docs/30-workflows/_design/sync-shared-modules-owner.md | 冒頭注釈拡張 + owner 表行追加 |
| ドキュメント | outputs/phase-06/main.md | diff サマリ / grep 確認結果 |
| メタ | artifacts.json | Phase 6 を completed に更新（実行時） |

## 統合テスト連携

- markdown 編集のみ。Phase 9 で indexes drift 解消、Phase 11 で grep evidence 化

## 完了条件

- [ ] AC-1 / AC-2 / AC-3 の grep 期待結果が満たされている
- [ ] 1 コミット完結
- [ ] secret-hygiene PASS

## 次 Phase

- 次: 7（contract test 補強 + database-schema.md 参照再確認）
- 引き継ぎ事項: ADR / owner 表 / 参照リンクの完了状態
- ブロック条件: ADR Decision に未確定要素 / リンク 1-hop 未達

## 参照資料

- `docs/30-workflows/_design/sync-jobs-spec.md`
- `docs/30-workflows/_design/sync-shared-modules-owner.md`
- `docs/30-workflows/unassigned-task/task-issue195-sync-jobs-contract-schema-consolidation-001.md`

## 依存 Phase 参照

- Phase 5: `outputs/phase-05/main.md`
