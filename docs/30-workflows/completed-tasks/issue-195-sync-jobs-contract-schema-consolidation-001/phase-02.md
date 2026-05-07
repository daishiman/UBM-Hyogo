# Phase 2: 設計（runtime SSOT 配置 ADR 構成 + owner 表行スキーマ + 参照リンク経路）

[実装区分: 実装仕様書（CONST_004 例外条件適用）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-195-sync-jobs-contract-schema-consolidation-001 |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計（runtime SSOT 配置 ADR 構成 + owner 表行スキーマ + 参照リンク経路） |
| Wave | 5 |
| Mode | parallel（実装仕様書） |
| 作成日 | 2026-05-04 |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (実装計画) |
| 状態 | created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| user_approval | REQUIRED |

## 第 0 セクション: 実装区分の宣言

本 Phase は設計確定のみで実体ファイルを変更しない。設計対象は ADR セクションの構成・owner 表行スキーマ・参照リンクのトポロジー。

## 目的

Phase 6 の実装に先立ち、以下 3 点の設計を確定する:

1. `_design/sync-jobs-spec.md` に追加する **ADR-001（runtime SSOT 配置）** のセクション構成・本文骨子
2. `_design/sync-shared-modules-owner.md` に追加する **owner 表行のスキーマ**（5 列構成と各セルの埋め値）
3. `_design/sync-jobs-spec.md` §2 / §3 / §5 に追加する **参照リンクのトポロジー**（owner 表 + runtime SSOT への 1-hop 到達）

## 実行タスク

1. ADR-001 のセクション構成確定（見出し階層 / 本文項目 / 配置位置）
2. owner 表行のスキーマ確定（5 列の値 + 備考の文面）
3. 参照リンクの経路設計（§2 / §3 / §5 の各リンク文と所在）
4. ADR / owner 表 / 参照リンクの 1:1 対応確認

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/issue-195-sync-jobs-contract-schema-consolidation-001/phase-01.md | AC 8 件 / 不変条件 7 件 |
| 必須 | docs/30-workflows/_design/sync-jobs-spec.md | markdown 論理正本（既存章立て） |
| 必須 | docs/30-workflows/_design/sync-shared-modules-owner.md | owner 表（既存 3 行） |
| 必須 | apps/api/src/jobs/_shared/sync-jobs-schema.ts | runtime SSOT 実体（参照対象） |

## 設計

### 1. ADR-001 セクション構成

- 配置位置: `_design/sync-jobs-spec.md` §1 メタ表の直下に新規 `## ADR-001 runtime SSOT 配置` 見出しを追加
- 本文骨子（順序固定）:

```md
## ADR-001 runtime SSOT 配置

> 用語: owner = 主担当 / co-owner = サブ担当（L-005）

### Status
- Accepted (2026-05-04)

### Context
- `sync_jobs.job_type` enum / `metrics_json` schema / `SYNC_LOCK_TTL_MS` を runtime 値として一元化する SSOT が必要
- 候補: (a) `apps/api/src/jobs/_shared/sync-jobs-schema.ts` に維持, (b) `packages/shared` へ移管

### Decision
- (a) **`apps/api/src/jobs/_shared/sync-jobs-schema.ts` を runtime SSOT として維持する**

### Consequences / Rationale
1. CLAUDE.md 不変条件 5「D1 への直接アクセスは `apps/api` に閉じる」に整合する。`sync_jobs` は D1 binding 前提のため、SSOT を `apps/api` に置くのが境界整合。
2. `apps/web` 配下に `sync_jobs` 参照ゼロ（grep で確認）。クロスアプリ共有の必要性が無い。
3. `packages/shared` 配下に `sync_jobs` 参照ゼロ。移管は YAGNI。
4. 03b-followup-005 (Issue #198) で既に当該配置で consumer 差し替え済み。物理移動は破壊的変更となる。

### Alternatives Considered
- (b) `packages/shared` 移管: クロスアプリ参照が将来発生した時点で再評価。現時点では不採用。

### Links
- markdown 論理正本: `docs/30-workflows/_design/sync-jobs-spec.md`（本ファイル）
- runtime SSOT: [`apps/api/src/jobs/_shared/sync-jobs-schema.ts`](../../../apps/api/src/jobs/_shared/sync-jobs-schema.ts)
- owner 表: [`docs/30-workflows/_design/sync-shared-modules-owner.md`](sync-shared-modules-owner.md)
- 先行タスク: `docs/30-workflows/completed-tasks/03b-followup-005-sync-jobs-design-spec/`
```

### 2. owner 表行スキーマ

`_design/sync-shared-modules-owner.md` の owner 表に追加する 1 行:

| ファイル | owner task | co-owner task | 変更時の必須レビュアー | 備考 |
| --- | --- | --- | --- | --- |
| `apps/api/src/jobs/_shared/sync-jobs-schema.ts` | 03a | 03b | 03a / 03b | sync_jobs runtime contract 正本（`SYNC_JOB_TYPES` / `SYNC_LOCK_TTL_MS` / `metricsJsonBaseSchema` 他）。issue-195 (#435) で本表に登録。markdown 論理正本: `_design/sync-jobs-spec.md`。 |

注: 03b-followup-005 で実体化済みのため、`実体化したファイルの owner ガバナンスを本表で運用する` 段落の射程に追加する旨を冒頭の注釈に追記する。

### 3. 参照リンクのトポロジー

`_design/sync-jobs-spec.md` 既存の TS 正本リンク（§3 / §5 / lock 章）に加えて、以下を追記:

| 追記先 | リンク文（イメージ） |
| --- | --- |
| §1 直下（ADR-001 セクション内 Links）| owner 表 + runtime SSOT への 1-hop |
| §2（job_type enum 章）| `> owner / co-owner: [sync-shared-modules-owner.md](sync-shared-modules-owner.md) を参照` |
| §3（既存 TS 正本リンクの隣）| owner 表へのリンク 1 行追加 |
| §5（既存 TS 正本リンクの隣）| owner 表へのリンク 1 行追加 |

### 4. 1:1 対応確認

| AC | 設計対応物 |
| --- | --- |
| AC-1 | ADR-001 セクション（Decision + Rationale 4 点） |
| AC-2 | owner 表 1 行追加（5 列スキーマ） |
| AC-3 | §2 / §3 / §5 への owner 表 + SSOT 参照リンク追記 |
| AC-4 | （Phase 5 棚卸しで詳細化） |
| AC-5 | （Phase 7 で再確認） |
| AC-6 | （Phase 8 で更新） |
| AC-7 | （Phase 9 で indexes 再生成） |
| AC-8 | （Phase 9 で typecheck / lint / vitest） |

## ローカル実行コマンド

```bash
# 設計のみのため実コマンドは無し。grep で既存リンク状態を確認するだけ。
rg -n "TS ランタイム正本" docs/30-workflows/_design/sync-jobs-spec.md
rg -n "sync-jobs-schema" docs/30-workflows/_design/sync-shared-modules-owner.md
```

## DoD

- [ ] ADR-001 セクション構成（Status / Context / Decision / Rationale / Alternatives / Links）が確定
- [ ] owner 表行の 5 列値が確定
- [ ] §2 / §3 / §5 への参照リンク文と所在が確定
- [ ] AC-1〜AC-3 と設計対応物の 1:1 対応が表で記述されている

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/main.md | ADR-001 / owner 表行 / 参照リンクの設計確定 |
| メタ | artifacts.json | Phase 2 を completed に更新（実行時） |

## 統合テスト連携

- 設計のみのため統合テストは行わない
- Phase 6 で実体追記後に Phase 11 で evidence 化

## 完了条件

- [ ] ADR-001 本文骨子の見出し階層と項目が記述されている
- [ ] owner 表行の各セル値が確定
- [ ] 参照リンクの追記先 4 箇所が明記

## 次 Phase

- 次: 3（実装計画 — 変更ファイル一覧 + 編集順序 + ロールバック手順）
- 引き継ぎ事項: ADR-001 構成 / owner 表行スキーマ / 参照リンクトポロジー
- ブロック条件: ADR の Decision が確定しない / 1:1 対応に欠落
