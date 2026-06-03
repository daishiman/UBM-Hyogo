# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | wrangler.toml binding ↔ env.ts ↔ 棚卸し表 三者ドリフト検出 CI gate (issue-1054-wrangler-binding-drift-ci-gate) |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック（Step1〜5 / 変更ファイル / コミット粒度） |
| 作成日 | 2026-06-02 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系・回帰テスト拡充) |
| 状態 | completed |
| 実装区分 | 実装仕様書（CONST_004 デフォルト・コード変更を伴う） |
| タスク種別 | implementation / implementation_mode: new / visualEvidence: NON_VISUAL / scope: tooling |
| GitHub Issue | #1054（CLOSED のまま参照のみ） |

## 目的

Phase 2 設計（D-1〜D-7 / 関数シグネチャ / 変更 5 ファイル）と Phase 4 テスト戦略（TC-01〜TC-10）を、今回実装した Step1〜5 のランブックへ落とし込む。本ワークフローは実コード（`.mjs` / `.spec.ts` / `.yml` / `package.json` / 棚卸し表）のローカル反映まで行い、commit / push / PR のみユーザー承認後に実行する。

## 新規作成 / 修正ファイルパス一覧（必須）

| パス | 変更種別 | 概要 |
| --- | --- | --- |
| `scripts/verify-wrangler-binding-drift.mjs` | 新規 | `parse*` + `reconcile` + `main`。純粋関数を named export。CLI 実行ガード（`import.meta.url` 判定）付き read-only スクリプト |
| `scripts/__tests__/verify-wrangler-binding-drift.spec.ts` | 新規 | TC-01〜TC-10 回帰 spec（fixture 文字列で純粋関数検証。不変条件 #8 で `.spec.ts` のみ） |
| `.github/workflows/verify-wrangler-binding-drift.yml` | 新規 | `apps/api/wrangler.toml` / `apps/api/src/env.ts` / `deployment-cloudflare.md` 変更時に gate 起動 |
| `package.json` | 編集 | `"verify:wrangler-binding-drift": "node scripts/verify-wrangler-binding-drift.mjs"` を `scripts` に追記 |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | 編集 | 棚卸し表へ `MEMBER_PHOTOS` 行追加（AC-10）+ 「機械検出対象 SSOT」注記 |

> 上記 5 ファイル以外は変更しない。`apps/api/wrangler.toml` / `apps/api/src/env.ts` は **解析対象であり編集しない**（現行宣言・型が正）。

## 実装 Step（Before/After 方針）

### Step1: `scripts/verify-wrangler-binding-drift.mjs` パーサ実装

- **Before**: スクリプト不在。
- **After**: `parseWranglerBindings(tomlText)` / `parseEnvInterfaceProps(envTsText)` / `parseInventoryRows(deploymentMdText)` を named export 実装。`parseWranglerBindings` は D-2/D-3/D-4 に従い行走査 → kind 正規化 → 同名 binding を `{name,kind}` で 1 エントリに集約（`envs[]` / `applied` の OR）。CLI 実行ガード（`import.meta.url === pathToFileURL(process.argv[1]).href`）で `main` 呼び出しを直接実行時のみに限定し、import 時は副作用ゼロ。
- 受入: TC-01（env-prefixed 3 件集約）/ TC-02（コメントアウト applied:false）/ TC-03（env property 集合）/ TC-04（棚卸し表 5 行）が pass する形を満たす。

### Step2: `reconcile` 純粋関数実装

- **Before**: 突合ロジック不在。
- **After**: `reconcile(bindings, envProps, inventory)` を I/O なしの純粋関数として実装。Phase 2 三者突合マトリクス通りに `ENV_TYPE_MISSING`（applied:true & env.ts property 欠落）/ `INVENTORY_MISSING`（applied:true & 棚卸し表欠落）/ `INVENTORY_KIND_MISMATCH`（applied:true & 棚卸し表 Kind 不一致）/ `INVENTORY_ORPHAN`（棚卸し表 active & wrangler block 無し / applied:false）を返す。applied:false と secrets は fail させない（D-5/D-6）。
- 受入: TC-05〜TC-10 が pass する形を満たす。

### Step3: `main`（read + exit code）+ decisive log

- **Before**: entrypoint 不在。
- **After**: `main()` が 3 ソースを `readFileSync` で読み、`parse*` → `reconcile` を呼び、`Drift[]` が空なら `0`、非空なら `1` を返す。各 Drift を `[verify-wrangler-binding-drift] <code>: <binding> — <detail>` の decisive log（grep 可能接頭辞）として stderr へ出力。ファイル書き込み・ネットワーク・`child_process` を一切使わない（AC-7・D-7）。
- 受入: 現行 repo 是正前は `INVENTORY_MISSING: MEMBER_PHOTOS` で exit 1、是正後（Step5）は exit 0。

### Step4: `scripts/__tests__/verify-wrangler-binding-drift.spec.ts`（TC-01〜10）

- **Before**: spec 不在。
- **After**: Phase 4 の TC-01〜TC-10 を fixture 文字列で実装。`parse*` / `reconcile` を named import し、`main`（`process.exit`）は spec では呼ばない。不変条件 #8 に従い `.spec.ts` 拡張子のみ。
- 受入: `mise exec -- pnpm exec vitest run scripts/__tests__/verify-wrangler-binding-drift.spec.ts` が全 pass。

### Step5: CI gate + package.json script + 棚卸し表 MEMBER_PHOTOS 追記（AC-10）

- **Before**: CI gate / package script 不在。棚卸し表に `MEMBER_PHOTOS` 行が無い（現存ドリフト）。
- **After**:
  - `.github/workflows/verify-wrangler-binding-drift.yml` を新規作成。`paths:` トリガに `apps/api/wrangler.toml` / `apps/api/src/env.ts` / `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` を含め、既存 `verify-design-tokens.yml` と同じ top-level `permissions: contents: read` / Node 24 セットアップ規約に整合させ、`pnpm verify:wrangler-binding-drift` を実行（AC-9）。
  - `package.json` の `scripts` に `"verify:wrangler-binding-drift": "node scripts/verify-wrangler-binding-drift.mjs"` を追記。
  - `deployment-cloudflare.md` の「Current Cloudflare binding inventory」表に `DB` / `SYNC_ALERTS` / `MEMBER_PHOTOS` 行を追加し、表が「機械検出対象 SSOT」である旨を注記（AC-10・現存ドリフト是正・R-1 解消）。
- 受入: `mise exec -- pnpm verify:wrangler-binding-drift` が **exit 0**（MEMBER_PHOTOS 是正後）。

## ローカル実行・検証コマンド

```bash
# gate 本体（現行 repo 是正後は exit 0）
mise exec -- pnpm verify:wrangler-binding-drift

# 回帰 spec（TC-01〜TC-10）
mise exec -- pnpm exec vitest run scripts/__tests__/verify-wrangler-binding-drift.spec.ts

# 型 / lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## コミット粒度（実装サイクルの想定）

| # | コミット内容 | 含むファイル |
| --- | --- | --- |
| C-1 | gate スクリプト本体 + 回帰 spec | `scripts/verify-wrangler-binding-drift.mjs` / `scripts/__tests__/verify-wrangler-binding-drift.spec.ts` |
| C-2 | CI 配線 + package script + 現存ドリフト是正 | `.github/workflows/verify-wrangler-binding-drift.yml` / `package.json` / `deployment-cloudflare.md` |

> **本ワークフローでは実コミットを作成しない**。同一 PR 内に C-1 / C-2 を含め、CI 導入時点で gate が exit 0 になる順序（棚卸し表是正同梱）を今回のローカル差分で担保する（AC-10・CONST_007）。

## DoD（完了条件）

- `parse*` / `reconcile` が named export され、TC-01〜TC-10 が全 pass。
- `main` が read-only で exit 0/1 を返し、decisive log を出力する。
- CI gate `.yml` が 3 ソース変更で起動し、既存 verify-* 規約に整合する。
- `package.json` に `verify:wrangler-binding-drift` script が追記されている。
- `deployment-cloudflare.md` に `MEMBER_PHOTOS` 行が追加され、現行 repo で `mise exec -- pnpm verify:wrangler-binding-drift` が **exit 0**（MEMBER_PHOTOS 是正後）。
- `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` が緑。

## 実行タスク

1. 新規作成 / 修正ファイル 5 件の変更種別を確定する（完了条件: ファイルパス一覧表が 5 件で存在し、解析対象 2 ファイルを非編集と明記している）。
2. Step1（パーサ + CLI ガード + named export）を Before/After で記述する（完了条件: Step1 が TC-01〜TC-04 の受入と対応している）。
3. Step2（reconcile 純粋関数）と Step3（main + decisive log + read-only）を記述する（完了条件: 突合マトリクス 4 種 Drift code と `[verify-wrangler-binding-drift]` 接頭辞が記述されている）。
4. Step4（spec TC-01〜10）と Step5（CI gate + package script + 棚卸し表 MEMBER_PHOTOS 追記）を記述する（完了条件: Step5 が AC-9 / AC-10 をカバーし exit 0 化の順序を含む）。
5. ローカル実行コマンドとコミット粒度（C-1 / C-2）を確定する（完了条件: コマンドブロックとコミット粒度表が存在し「実コミットを作成しない」旨が明記されている）。
6. DoD に「現行 repo で gate exit 0（MEMBER_PHOTOS 是正後）」を含める（完了条件: DoD チェック項目に exit 0 が存在）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-02.md | 変更 5 ファイル一覧 / 関数シグネチャ / 突合マトリクス |
| 必須 | phase-04.md | TC-01〜TC-10（Step4 の受入対象） |
| 必須 | scripts/verify-d1-migration-sequence.mjs | `.mjs` + CLI ガード + named export の先例 |
| 必須 | .github/workflows/verify-design-tokens.yml | CI gate job（permissions / Node 24 規約）の先例 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | 棚卸し表 MEMBER_PHOTOS 追記先 |
| 必須 | package.json | `verify:*` script 追記先 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | 実装ランブック主成果物（変更 5 ファイル / Step1〜5 / コマンド / コミット粒度 / DoD） |
| メタ | artifacts.json | Phase 5 状態の更新（spec_created） |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | Step1〜3 の実装方針を異常系拡充の前提として渡す |
| Phase 7 | 変更 5 ファイルと Step→AC 対応を AC カバレッジ確認に渡す |
| Phase 9 | DoD（typecheck / lint / gate exit 0）を品質保証チェックに渡す |
| Phase 11 | Step5 の exit 0 化を CLI smoke 手順に渡す |
| Phase 13 | 変更 5 ファイルとコミット粒度を PR 本文の差分一覧に渡す |

## 完了条件

- [ ] 新規作成 / 修正ファイル一覧（5 件）が変更種別付きで存在し、解析対象 2 ファイルを非編集と明記している
- [ ] Step1〜5 が Before/After 方針で記述されている
- [ ] Step3 に `[verify-wrangler-binding-drift]` decisive log と read-only（AC-7）が記述されている
- [ ] Step5 が CI gate（AC-9）+ package script + 棚卸し表 MEMBER_PHOTOS 追記（AC-10）を含む
- [ ] ローカル実行コマンドブロックとコミット粒度表が存在する
- [ ] 「本ワークフローでは実コミットを作成しない」旨が明記されている
- [ ] DoD に「現行 repo で gate exit 0（MEMBER_PHOTOS 是正後）」が含まれている

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `spec_created` 範囲で記述済み
- 成果物 `outputs/phase-05/main.md` が配置済み
- 変更ファイルが 5 件に限定されている
- artifacts.json の `phases[4].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 6 (異常系・回帰テスト拡充)
- 引き継ぎ事項:
  - 変更 5 ファイルと Step1〜5（Before/After）
  - コミット粒度 C-1 / C-2（実コミットは後続サイクル + ユーザー承認）
  - DoD（gate exit 0 / typecheck / lint）
- ブロック条件:
  - 解析対象 2 ファイル（wrangler.toml / env.ts）への編集が混入する
  - 棚卸し表是正を別 PR に分離し CI 導入直後に gate が赤になる
