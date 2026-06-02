# Phase 4: テスト戦略（TDD Red）

> **Automation-30 改善追記（2026-06-02）**
> 本 Phase 作成当初の「仕様化のみ」「spec_created」表現は historical context。今回サイクルで `infra/cloudflare-alerts/lib/__tests__/binding-policy-drift.spec.ts` と `scripts/__tests__/cf-alerts-cli.spec.ts` の回帰を実装し、`pnpm test:alerts` 8 files / 66 tests PASS を取得した。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | KV/R2 binding 活性状態 ↔ Cloudflare alert policy `enabled` 状態のドリフト検知（issue-1056 / issue-57-followup-003） |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略（TDD Red） |
| 作成日 | 2026-06-02 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | completed |
| 実装区分 | 実装仕様書（CONST_004 デフォルト・コード変更を伴う） |
| タスク種別 | implementation / implementation_mode: new / visualEvidence: NON_VISUAL / scope: tooling |
| GitHub Issue | #1056（OPEN のまま参照のみ・Issue mutation は user-gated） |

## 目的

Phase 2 / Phase 3 でレビュー済みの設計（案 A）に対し、回帰 spec `infra/cloudflare-alerts/lib/__tests__/binding-policy-drift.spec.ts` のテストケース TC-01〜TC-08 を **仕様レベルで固定する**。AC-6 が要求する 6 ケース（(a)〜(f)）を起点に、`parseActiveBindings`（wrangler line parser）と `buildBindingPolicyDrift`（drift 純関数）の挙動を guard し、AC-1〜AC-9 とテストの対応を確定することが本 Phase の責務。NON_VISUAL のため screenshot は不要。

> **本 Phase は仕様化のみ**。テスト本体（spec.ts）は作成しない。実テストの作成・実走は今回の実装サイクル（Phase 5 ランブック / Phase 11 smoke）で行う。

## 前提（テスト可能化の依存）

- TC-01〜TC-06 は `binding-policy-drift.ts` が `parseActiveBindings` / `buildBindingPolicyDrift` / `BINDING_POLICY_MAP` を **named export** していることを前提とする（Phase 2 設計）。この 2 純関数 + mapping const が export されていれば、Cloudflare API・secret・ファイル IO に依存せず単体テスト可能。
- `buildBindingPolicyDrift` の policy 入力（`CanonicalPolicy[]`）は **テスト内で最小オブジェクトを直接組む**（`loadExpected` はモックしない）。これにより `load.ts` の実装差し替えなくテスト可能で、純関数の責務（突合ロジックのみ）を隔離検証できる。
- TC-07（baseline）/ TC-08（loadActiveBindings IO）のみ `loadActiveBindings` / `loadExpected` の薄い IO helper を経由する。これらは本物の `apps/api/wrangler.toml` / `policies/*.json` を read-only で読む統合寄りのケースで、Phase 11 smoke と整合させる。

## テスト配置・隔離方針

| 項目 | 値 |
| --- | --- |
| テストファイル | `infra/cloudflare-alerts/lib/__tests__/binding-policy-drift.spec.ts`（不変条件 #8: `.spec.ts` のみ） |
| 自動発見 | `pnpm test:alerts`（`infra/cloudflare-alerts/lib/__tests__/**/*.spec.ts` を対象）で CI 実行対象。既存 diff/load/schema spec と同階層 |
| import 対象 | `../binding-policy-drift.ts`（相対 import の named export `parseActiveBindings` / `buildBindingPolicyDrift` / `BINDING_POLICY_MAP`） |
| フィクスチャ（wrangler） | wrangler.toml の **inline 文字列フィクスチャ**（テスト内 template literal）。本物の `apps/api/wrangler.toml` を読まないため env / ファイル状態に非依存 |
| フィクスチャ（policy） | `CanonicalPolicy[]` を **最小オブジェクトで直接構築**（`[{ name, enabled }]` 相当）。`loadExpected` モック不要 |
| baseline ケース | TC-07 のみ `loadActiveBindings(process.cwd())` + `loadExpected(process.cwd())` で実ファイルを読み、現状 drift 0 を確認（read-only） |
| 後始末 | inline フィクスチャのため FS 後始末不要。spy を使う場合のみ `afterEach` で restore |

## 実行タスク

1. AC-6 の (a)〜(f) を TC-01〜TC-06 として対象関数・入力・期待・Red 状態に表化する（完了条件: 6 ケースすべてが本 Phase に表化）。
2. baseline 整合（現状 drift 0）を TC-07 として `loadActiveBindings` + `loadExpected` 経由で定義する（完了条件: TC-07 が AC-4 と整合）。
3. drift 複数件同時列挙（KV/R2 双方 drift）を TC-08 として定義する（完了条件: TC-08 が AC-2 と整合）。
4. inline wrangler フィクスチャ + 最小 `CanonicalPolicy[]` のフィクスチャ方針を明記する（完了条件: 隔離方針節に記載）。
5. `describe`/`it` 構造案を提示し、今回の実装サイクルがそのまま骨格に使える形にする（完了条件: 構造案コードブロックが存在）。
6. AC-1〜AC-9 とテストの対応表を作る（完了条件: 対応表が存在）。
7. 実テスト作成・実走を今回サイクルへ委譲する境界を明記する（完了条件: 委譲記述あり）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-02.md | 型 / `BINDING_POLICY_MAP` / parser 状態機械 / drift 純関数の源泉 |
| 必須 | phase-03.md | MINOR R1（コメント binding skip）/ R2（policy 不在 `?? false`）/ R3（env 横断集約）のテストトレース先 |
| 必須 | infra/cloudflare-alerts/lib/types.ts | `CanonicalPolicy`（name/enabled）型 |
| 必須 | infra/cloudflare-alerts/lib/load.ts | TC-07 の `loadExpected().policies` 取得 |
| 必須 | apps/api/wrangler.toml | TC-07 baseline 入力（KV コメントアウト / R2 active）/ inline フィクスチャの構造参照 |
| 必須 | infra/cloudflare-alerts/policies/*.json | TC-07 baseline の policy `enabled` 実値 |
| 必須 | CLAUDE.md | 不変条件 #8（`.spec.ts` のみ） |

## スコープ

### 含む

- TC-01〜TC-08 の RED 仕様（対象関数 / 入力 / 期待値 / Red 状態 / フィクスチャ）
- inline wrangler フィクスチャ + 最小 `CanonicalPolicy[]` フィクスチャ方針
- `describe`/`it` 構造案
- AC-1〜AC-9 とテストの対応表

### 含まない

- 実 spec.ts ファイルの作成（今回の実装サイクル）
- テストの実走（Phase 11）
- `binding-policy-drift.ts` / `cli.ts` の編集
- CLI / exit code / `--json` の異常系網羅（Phase 6 で扱う）

## テスト一覧（TDD Red）

> 凡例: **期待値** = Green 成立条件 / **Red 状態** = 実装前の現状値（`binding-policy-drift.ts` 未作成 = import 不能）/ **対応 AC** = 本ワークフロー受入条件番号

### TC-01: active + enabled → drift なし（(a)）

| 項目 | 内容 |
| --- | --- |
| ID | TC-01 |
| 対象 AC | AC-2 / AC-4 |
| 対象関数 | `buildBindingPolicyDrift` |
| 入力 | `bindings = { kv:true, r2:false, kvNames:["X_KV"], r2Names:[] }` + `policies = [{ name:"workers-kv-writes-per-day", enabled:true }, { name:"workers-kv-stored-bytes", enabled:true }]` |
| 期待値 | 戻り値が空配列 `[]`（drift なし） |
| Red 状態 | モジュール未実装で import 不能 |
| フィクスチャ | inline `ActiveBindingSet` + 最小 `CanonicalPolicy[]` |

### TC-02: inactive + disabled → drift なし（(b)）

| 項目 | 内容 |
| --- | --- |
| ID | TC-02 |
| 対象 AC | AC-2 / AC-4 |
| 対象関数 | `buildBindingPolicyDrift` |
| 入力 | `bindings = { kv:false, r2:false, kvNames:[], r2Names:[] }` + `policies = [{ name:"workers-kv-writes-per-day", enabled:false }, { name:"workers-kv-stored-bytes", enabled:false }]` |
| 期待値 | 戻り値が空配列 `[]`（inactive && disabled は整合） |
| Red 状態 | モジュール未実装で import 不能 |
| フィクスチャ | inline |

### TC-03: active + disabled → `MONITORING_GAP`（(c)）

| 項目 | 内容 |
| --- | --- |
| ID | TC-03 |
| 対象 AC | AC-2 |
| 対象関数 | `buildBindingPolicyDrift` |
| 入力 | `bindings = { kv:true, r2:false, kvNames:["ALERT_DEDUP_KV"], r2Names:[] }` + `policies = [{ name:"workers-kv-writes-per-day", enabled:false }, { name:"workers-kv-stored-bytes", enabled:false }]` |
| 期待値 | KV policy 2 件分の `MONITORING_GAP`（`kind:"MONITORING_GAP"` / `bindingKind:"kv"` / `policy` が各 policy 名 / `activeBindings` に `"ALERT_DEDUP_KV"` を含む）が列挙される（2 件） |
| Red 状態 | モジュール未実装で import 不能 |
| フィクスチャ | inline |

### TC-04: inactive + enabled → `STALE_MONITORING`（(d)）

| 項目 | 内容 |
| --- | --- |
| ID | TC-04 |
| 対象 AC | AC-2 |
| 対象関数 | `buildBindingPolicyDrift` |
| 入力 | `bindings = { kv:false, r2:false, kvNames:[], r2Names:[] }` + `policies = [{ name:"workers-kv-writes-per-day", enabled:true }, { name:"workers-kv-stored-bytes", enabled:false }]` |
| 期待値 | `workers-kv-writes-per-day` についてのみ `STALE_MONITORING`（`kind:"STALE_MONITORING"` / `bindingKind:"kv"`）が 1 件列挙される（enabled:false の方は drift なし） |
| Red 状態 | モジュール未実装で import 不能 |
| フィクスチャ | inline |

### TC-05: wrangler parser コメント行 = inactive / 非コメント行 = active（(e)）

| 項目 | 内容 |
| --- | --- |
| ID | TC-05 |
| 対象 AC | AC-3 |
| 対象関数 | `parseActiveBindings` |
| 入力 | inline wrangler フィクスチャ。`[[env.production.kv_namespaces]]` + `# binding = "ALERT_DEDUP_KV"`（コメント）と、`[[env.production.r2_buckets]]` + `binding = "MEMBER_PHOTOS"`（非コメント）を含む文字列 |
| 期待値 | `kv === false`（コメント行は inactive・`kvNames` に `ALERT_DEDUP_KV` を含まない）/ `r2 === true`（非コメント行は active・`r2Names` に `"MEMBER_PHOTOS"` を含む）。先頭空白付きコメント（`  # ...`）も inactive 扱い（R1） |
| Red 状態 | モジュール未実装で import 不能 |
| フィクスチャ | inline wrangler 文字列 |

### TC-06: production / staging 横断集約（片方 active なら active）（(f)）

| 項目 | 内容 |
| --- | --- |
| ID | TC-06 |
| 対象 AC | AC-3 |
| 対象関数 | `parseActiveBindings` |
| 入力 | inline wrangler フィクスチャ。`[[env.production.kv_namespaces]]` の binding はコメント（inactive）だが `[[env.staging.kv_namespaces]]` に非コメント `binding = "SESSION_KV"`（active）を含む文字列 |
| 期待値 | `kv === true`（staging で active なら kind 単位で active と集約・R3）/ `kvNames` は dedupe 済で `"SESSION_KV"` を含む |
| Red 状態 | モジュール未実装で import 不能 |
| フィクスチャ | inline wrangler 文字列 |

### TC-07: baseline 整合（現状コードで drift 0）

| 項目 | 内容 |
| --- | --- |
| ID | TC-07 |
| 対象 AC | AC-4 |
| 対象関数 | `loadActiveBindings` + `loadExpected` + `buildBindingPolicyDrift`（統合経路） |
| 入力 | 本物の `apps/api/wrangler.toml`（KV コメントアウト / R2 active）+ 本物の `policies/*.json`（KV 2 件 `enabled:false` / `r2-class-a` `enabled:true`）を read-only で読む |
| 期待値 | `buildBindingPolicyDrift(...)` が空配列 `[]`（drift 0）。KV inactive+disabled / R2 active+enabled で整合 |
| Red 状態 | モジュール未実装で import 不能 |
| フィクスチャ | 実ファイル（read-only・mutation なし） |

### TC-08: drift 複数件同時列挙（KV/R2 双方 drift）

| 項目 | 内容 |
| --- | --- |
| ID | TC-08 |
| 対象 AC | AC-2 |
| 対象関数 | `buildBindingPolicyDrift` |
| 入力 | `bindings = { kv:true, r2:false, kvNames:["A_KV"], r2Names:[] }` + `policies = [{ name:"workers-kv-writes-per-day", enabled:false }, { name:"workers-kv-stored-bytes", enabled:false }, { name:"r2-class-a", enabled:true }]` |
| 期待値 | `MONITORING_GAP` 2 件（KV policy 各 1）+ `STALE_MONITORING` 1 件（`r2-class-a`）の合計 3 件が同時列挙される。drift 件数を取りこぼさない |
| Red 状態 | モジュール未実装で import 不能 |
| フィクスチャ | inline |

## `describe`/`it` 構造案

```ts
// infra/cloudflare-alerts/lib/__tests__/binding-policy-drift.spec.ts（今回の実装サイクルで作成）
import { describe, it, expect } from "vitest";
import {
  parseActiveBindings,
  buildBindingPolicyDrift,
  loadActiveBindings,
  BINDING_POLICY_MAP,
} from "../binding-policy-drift.ts";
import { loadExpected } from "../load.ts";
import type { CanonicalPolicy } from "../types.ts";

describe("buildBindingPolicyDrift", () => {
  it("TC-01: active + enabled → drift なし", () => { /* ... */ });
  it("TC-02: inactive + disabled → drift なし", () => { /* ... */ });
  it("TC-03: active + disabled → MONITORING_GAP", () => { /* ... */ });
  it("TC-04: inactive + enabled → STALE_MONITORING", () => { /* ... */ });
  it("TC-08: KV/R2 双方 drift を同時列挙する", () => { /* ... */ });
});

describe("parseActiveBindings", () => {
  it("TC-05: コメント行は inactive / 非コメント行は active", () => { /* ... */ });
  it("TC-06: production/staging 横断で片方 active なら active", () => { /* ... */ });
});

describe("baseline (read-only)", () => {
  it("TC-07: 現状コードで drift 0", () => {
    const bindings = loadActiveBindings(process.cwd());
    const { policies } = loadExpected(process.cwd());
    expect(buildBindingPolicyDrift(bindings, policies)).toEqual([]);
  });
});
```

## AC-1〜AC-9 とテストの対応表

| AC | 内容 | 担保するテスト |
| --- | --- | --- |
| AC-1 | binding kind ↔ policy 対応表（`BINDING_POLICY_MAP`）が一意 | TC-03 / TC-04 / TC-08 が mapping を経由して列挙（`BINDING_POLICY_MAP` の export を import で参照） |
| AC-2 | drift 2 種を read-only 純関数で列挙 | TC-03（MONITORING_GAP）/ TC-04（STALE_MONITORING）/ TC-08（複数同時） |
| AC-3 | wrangler コメント尊重 parser + env 横断集約 | TC-05（コメント/非コメント）/ TC-06（env 横断） |
| AC-4 | 現状 drift 0（green baseline） | TC-07（実ファイル read-only）/ TC-01 / TC-02 |
| AC-5 | CLI サブコマンド exit 0/2/64・`--json` | Phase 6 で扱う（本 Phase は純関数レベル） |
| AC-6 | 回帰 spec (a)〜(f) + `test:alerts` 対象 | TC-01〜TC-06（(a)〜(f) に 1:1）+ 配置が `__tests__/` glob 内 |
| AC-7 | CI gate（validate job） | Phase 5/6 で扱う（CLI 経路） |
| AC-8 | 棚卸し表追記 | Phase 5/12（spec / doc） |
| AC-9 | 4 条件 PASS | Phase 1/3（テスト範囲外） |

## テストカバレッジ目標（仕様レベル）

| スコープ | 目標 |
| --- | --- |
| AC-2（drift 2 種） | TC-03 / TC-04 / TC-08 で両 kind の両 drift 型を被覆 |
| AC-3（parser） | TC-05（コメント分岐）+ TC-06（env 横断集約）で状態機械を被覆 |
| AC-4（baseline） | TC-07（実ファイル）+ TC-01 / TC-02（整合 2 パターン）で被覆 |
| MINOR トレース | R1=TC-05 / R2=TC-04・TC-08（`?? false` の disabled 吸収を STALE 非発火で間接確認）/ R3=TC-06 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | （本 phase-04.md に内包。artifacts.json では別 main.md を持たない） | TC-01〜TC-08 一覧 / フィクスチャ方針 / 構造案 / AC 対応表 |

> **Automation-30 改善後の現行状態**: `binding-policy-drift.spec.ts` の作成・実走は今回サイクルで完了。Phase 4 の設計内容は実装済みテストのトレースとして保持する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | TC-01〜TC-08 を実装ステップの Green 条件として参照（②spec 新規・TDD） |
| Phase 6 | 純関数レベルの TC を起点に CLI / exit code / 異常系 TC-E1〜 を拡張 |
| Phase 7 | AC matrix の右軸として TC-01〜TC-08 を使用 |
| Phase 11 | TC-07（baseline drift 0）を `cf.sh alerts binding-drift` exit 0 の smoke 基準として再利用 |

## 完了条件 (Acceptance Criteria for this Phase)

- [x] AC-6 の (a)〜(f) が TC-01〜TC-06 に 1:1 で表化されている
- [x] 各 TC に ID / 対象 AC / 対象関数 / 入力 / 期待値 / Red 状態 / フィクスチャが記述されている
- [x] inline wrangler フィクスチャ + 最小 `CanonicalPolicy[]` フィクスチャ方針が明記されている
- [x] baseline（TC-07・drift 0）が `loadActiveBindings` + `loadExpected` 経由で定義されている
- [x] drift 複数件同時（TC-08）が定義されている
- [x] `describe`/`it` 構造案が提示されている
- [x] AC-1〜AC-9 とテストの対応表が存在する
- [x] 実 spec.ts 作成・実走を今回の実装サイクルに委ねる旨が明示されている

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `completed`
- TC-01〜TC-08 が AC-2 / AC-3 / AC-4 / AC-6 の少なくとも 1 つに紐づく
- テスト配置が `infra/cloudflare-alerts/lib/__tests__/`（`test:alerts` glob 内）である
- artifacts.json で Phase 4 は別 output を持たないため、本 phase-04.md が正本である

## 次 Phase への引き渡し

- 次 Phase: 5 (実装ランブック)
- 引き継ぎ事項:
  - TC-01〜TC-08 を Phase 5 実装ステップ（②spec 新規）の Green 条件として参照
  - フィクスチャは inline（wrangler 文字列 + 最小 `CanonicalPolicy[]`）、TC-07 のみ実ファイル read-only
  - 実行コマンド `pnpm test:alerts` / `pnpm exec vitest run infra/cloudflare-alerts/lib/__tests__/binding-policy-drift.spec.ts`
  - CLI / exit code / 異常系は Phase 6 で拡張
- ブロック条件:
  - TC-01〜TC-08 のいずれかに対象関数 / 期待値 / フィクスチャが欠けている
  - テスト配置が `infra/cloudflare-alerts/lib/__tests__/`（`test:alerts` glob）でない
