# Phase 6: 異常系・回帰テスト拡充（edge / 回帰 guard）

> **Automation-30 改善追記（2026-06-02）**
> 本 Phase 作成当初の「仕様化のみ」「spec_created」表現は historical context。parser コメント行、production/staging 集約、`MONITORING_GAP`、`STALE_MONITORING`、`--json`、unknown flag exit 64 は今回サイクルの tests で実装・検証済み。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | KV/R2 binding 活性状態 ↔ Cloudflare alert policy `enabled` 状態のドリフト検知（issue-1056 / issue-57-followup-003） |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系・回帰テスト拡充（edge / 回帰 guard） |
| 作成日 | 2026-06-02 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (AC / カバレッジマトリクス) |
| 状態 | completed |
| 実装区分 | 実装仕様書（CONST_004 デフォルト・コード変更を伴う） |
| タスク種別 | implementation / implementation_mode: new / visualEvidence: NON_VISUAL / scope: tooling |
| GitHub Issue | #1056（OPEN のまま参照のみ・Issue mutation は user-gated） |

## 目的

Phase 4 の happy/Red TC-01〜TC-08 に加えて、**parser / drift 純関数 / CLI / IO helper の edge ケース**を TC-E1〜TC-E9 として固定し、加えて **既存資産との回帰 guard**（既存 `test:alerts` 不変 / 既存 `alerts diff` との排他）を TC-R1〜TC-R2 として組み込む。本 Phase は「policy JSON 不在/壊れ・wrangler のコメントと実 binding 混在・env 一方のみ active・mapping policy が不在（`?? false`）・空 wrangler・drift 複数件・`--json` 出力・exit code（0/2/64）」を網羅し、read-only 不変条件が異常系でも崩れないことを検証する仕様の正本化を行う。本 Phase も仕様化のみで、実テスト作成・実走は今回の実装サイクルに委ねる。

## 前提

- Phase 5 Step ①（検知モジュール）/ Step ③（CLI）/ Step ④⑤（cf.sh / package.json）が実装されていることを前提に edge / 異常系を扱う。
- 純関数（`parseActiveBindings` / `buildBindingPolicyDrift`）の edge は **inline フィクスチャ**で再現し、ファイル IO に依存しない。policy JSON 不在/壊れ（TC-E1）は `buildBindingPolicyDrift` に **空 / 欠落した `CanonicalPolicy[]` を直接渡す**ことで純関数レベルで再現し、`loadExpected` のファイル例外挙動は既存 `load.ts` / `load.spec` の責務（本タスクで再実装しない）として TC-R1 の回帰で担保する。
- read-only 不変条件: 全 edge ケースで `setAlertTokenMode` / `loadActual` / write を呼ばない。本物の `apps/api/wrangler.toml` / `policies/*.json` を **mutation しない**。

## 実行タスク

1. parser edge（混在 / env 一方のみ / 空 wrangler / 末尾コメント）を TC-E5〜TC-E8 として定義する（完了条件: 4 件が本 Phase に表化）。
2. drift 純関数 edge（policy 不在 `?? false` / drift 複数件同時 / mapping 全網羅）を TC-E1〜TC-E3 として定義する（完了条件: 3 件が表化）。
3. CLI edge（exit code 0/2/64 / `--json` 出力形式）を TC-E4 / TC-E9 として定義する（完了条件: 2 件が表化）。
4. 回帰 guard（既存 `test:alerts` 不変 / 既存 `alerts diff` との排他）を TC-R1 / TC-R2 として組み込む（完了条件: 2 件が AC-6 / 排他性と整合）。
5. 各 edge / 回帰に「失敗注入 or 入力」「期待される不変条件」を明記する（完了条件: 各 TC に記述）。
6. 実走を今回の実装サイクルに委譲する境界を明記する（完了条件: 委譲記述あり）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-04.md | TC-01〜TC-08 happy/Red |
| 必須 | phase-05.md | CLI 配線（exit 0/2/64）/ IO helper / read-only 不変条件 |
| 必須 | phase-03.md | MINOR R1（コメント skip）/ R2（policy 不在 `?? false`）/ R3（env 横断） |
| 必須 | infra/cloudflare-alerts/lib/diff.ts | 既存 `Drift` union と排他性確認（TC-R2） |
| 必須 | infra/cloudflare-alerts/lib/load.ts | `loadExpected` のファイル例外責務（TC-R1 で回帰担保） |
| 必須 | infra/cloudflare-alerts/lib/__tests__/ | 既存 diff/load/schema spec（TC-R1 で不変確認） |

## 異常系・edge テスト一覧

> 凡例: **入力 / 失敗注入** = 再現方法 / **期待される不変条件** = read-only / drift 列挙 / exit code が守られる条件 / **対応 AC**

### TC-E1: mapping policy が `policies/` に不在（`?? false` で disabled 扱い）

| 項目 | 内容 |
| --- | --- |
| ID | TC-E1 |
| 対象 AC | AC-2 |
| 対象関数 | `buildBindingPolicyDrift` |
| 入力 | `bindings = { kv:true, r2:false, kvNames:["X_KV"], r2Names:[] }` + `policies = []`（KV policy が 1 件も存在しない） |
| 期待される不変条件 | `enabledByName.get(name) ?? false` で disabled とみなし、KV が active のため `MONITORING_GAP` 2 件（KV policy 各 1）を列挙する（policy 不在を「監視欠落」として顕在化／throw しない・R2） |
| Red 状態 | `?? false` が無いと `undefined && active` が falsy 評価され drift を取りこぼす |

### TC-E2: policy が partial（片方のみ存在）

| 項目 | 内容 |
| --- | --- |
| ID | TC-E2 |
| 対象 AC | AC-2 |
| 対象関数 | `buildBindingPolicyDrift` |
| 入力 | `bindings = { kv:true, ... }` + `policies = [{ name:"workers-kv-writes-per-day", enabled:true }]`（`workers-kv-stored-bytes` 欠落） |
| 期待される不変条件 | `workers-kv-writes-per-day` は enabled で drift なし / `workers-kv-stored-bytes` は `?? false` で `MONITORING_GAP` 1 件。policy ごとに独立判定し取りこぼさない |
| Red 状態 | policy 単位ループでなく kind 単位の単一判定にすると片方の欠落を見逃す |

### TC-E3: drift 複数件同時（KV/R2 双方）

| 項目 | 内容 |
| --- | --- |
| ID | TC-E3 |
| 対象 AC | AC-2 |
| 対象関数 | `buildBindingPolicyDrift` |
| 入力 | `bindings = { kv:true, r2:false, kvNames:["A_KV"], r2Names:[] }` + `policies = [{name:"workers-kv-writes-per-day",enabled:false},{name:"workers-kv-stored-bytes",enabled:false},{name:"r2-class-a",enabled:true}]` |
| 期待される不変条件 | `MONITORING_GAP` 2 件（KV）+ `STALE_MONITORING` 1 件（r2-class-a）= 3 件を取りこぼさず列挙（Phase 4 TC-08 の異常系拡張・件数 assert を強化） |
| Red 状態 | 最初の drift で early return すると後続を取りこぼす |

### TC-E4: CLI exit code（0 / 2 / 64）

| 項目 | 内容 |
| --- | --- |
| ID | TC-E4 |
| 対象 AC | AC-5 |
| 対象関数 | `cmdBindingDrift`（CLI 経路） |
| 入力 / 失敗注入 | (a) drift なし → exit 0 / (b) drift あり → exit 2 / (c) 未知 flag（`--bogus`）等 usage 違反 → exit 64 |
| 期待される不変条件 | exit code が drift 有無で 0/2 に分岐し、usage 違反は 64。いずれも Cloudflare API を呼ばず（read-only）/ stdout に drift サマリ or `no binding-policy drift detected` |
| Red 状態 | drift ありでも exit 0 を返すと CI gate が機能しない |

### TC-E5: wrangler コメントと実 binding 混在

| 項目 | 内容 |
| --- | --- |
| ID | TC-E5 |
| 対象 AC | AC-3 |
| 対象関数 | `parseActiveBindings` |
| 入力 | inline wrangler。同一 `[[env.production.kv_namespaces]]` ブロック内に `# binding = "ALERT_DEDUP_KV"`（コメント）と別ブロックに `binding = "SESSION_KV"`（非コメント）が混在 |
| 期待される不変条件 | コメント行は inactive で `kvNames` に含まれず、非コメント行のみ収集される。`kv === true`（SESSION_KV が active）/ `kvNames` に `ALERT_DEDUP_KV` を含まない |
| Red 状態 | コメント判定が無いと両方収集され ALERT_DEDUP_KV を誤って active 化 |

### TC-E6: env 一方のみ active（production active / staging commented）

| 項目 | 内容 |
| --- | --- |
| ID | TC-E6 |
| 対象 AC | AC-3 |
| 対象関数 | `parseActiveBindings` |
| 入力 | inline wrangler。`[[env.production.r2_buckets]]` の `binding = "MEMBER_PHOTOS"` は非コメント、`[[env.staging.r2_buckets]]` はコメントアウト |
| 期待される不変条件 | quota は account 単位のため「いずれかの env で active なら active」で集約し `r2 === true`（R3）。env 非対称でも片方 active で active 判定 |
| Red 状態 | env 完全一致を要求すると非対称時に inactive 誤判定 |

### TC-E7: 空 wrangler / binding ゼロ

| 項目 | 内容 |
| --- | --- |
| ID | TC-E7 |
| 対象 AC | AC-3 |
| 対象関数 | `parseActiveBindings` |
| 入力 | 空文字列 / kv・r2 テーブルを一切含まない wrangler 文字列（d1/services のみ等） |
| 期待される不変条件 | throw せず `{ kv:false, r2:false, kvNames:[], r2Names:[] }` を返す。`d1_databases`/`services`/`queues`/`assets` は currentKind=null で無視される |
| Red 状態 | テーブルヘッダ未検出時に例外を投げると CLI が落ちる |

### TC-E8: kv/r2 以外テーブルの binding を誤収集しない

| 項目 | 内容 |
| --- | --- |
| ID | TC-E8 |
| 対象 AC | AC-3 |
| 対象関数 | `parseActiveBindings` |
| 入力 | inline wrangler。`[[d1_databases]]` の `binding = "DB"`、`[[services]]` の `binding = "API_SERVICE"`、`[[env.production.queues]]` の `binding = "SYNC_ALERTS"` を含む |
| 期待される不変条件 | これらは currentKind=null で無視され `kvNames`/`r2Names` に混入しない（`kv === false`/`r2 === false`） |
| Red 状態 | テーブル種別を見ずに `binding =` を拾うと D1/queue を KV/R2 に誤分類 |

### TC-E9: `--json` 出力形式

| 項目 | 内容 |
| --- | --- |
| ID | TC-E9 |
| 対象 AC | AC-5 |
| 対象関数 | `printBindingDrifts`（CLI 経路） |
| 入力 / 失敗注入 | (a) drift なし + `--json` → `[]` / (b) drift あり + `--json` → `BindingPolicyDrift[]` の JSON 配列（各要素に `kind` / `bindingKind` / `policy`、MONITORING_GAP は `activeBindings`、両者 `message`） |
| 期待される不変条件 | `JSON.parse(stdout)` が成功し配列。drift 有無で exit code（0/2）は人間出力時と同じ。機械可読で CI / 後段スクリプトが解釈可能 |
| Red 状態 | `--json` でも人間向け文字列を混ぜると JSON parse が壊れる |

### TC-R1: 既存 `test:alerts`（diff/load/schema spec）が回帰しない

| 項目 | 内容 |
| --- | --- |
| ID | TC-R1 |
| 対象 AC | AC-6 |
| 対象関数 | 既存 spec 群（`diff` / `load` / schema）+ 新規 spec |
| 入力 | `pnpm test:alerts`（`infra/cloudflare-alerts/lib/__tests__/**`） |
| 期待される不変条件 | 既存 spec が全 PASS のまま、新規 `binding-policy-drift.spec.ts`（TC-01〜TC-08 + TC-E1〜TC-E9）が追加されて全体 Green。`load.ts` を再利用のみで変更しないため `load.spec` の policy JSON 不在/壊れ系の挙動が不変 |
| Red 状態 | `load.ts` / `diff.ts` を誤編集すると既存 spec が落ちる |

### TC-R2: 既存 `alerts diff` との排他（別型 `BindingPolicyDrift`）

| 項目 | 内容 |
| --- | --- |
| ID | TC-R2 |
| 対象 AC | AC-2（排他性） |
| 対象関数 | `buildBindingPolicyDrift`（型）/ `cmdBindingDrift`（経路） |
| 入力 | 型レベル: `BindingPolicyDrift` が `diff.ts` の `Drift` union と独立であること。経路レベル: `cmdBindingDrift` が `loadActual` を呼ばず `cmdDiff` と別 switch case |
| 期待される不変条件 | `binding-drift` は宣言 vs デプロイ軸の `diff` と混線せず、`Drift` を import / 拡張しない。`cmdBindingDrift` が Cloudflare API（`loadActual`）非接触 |
| Red 状態 | `Drift` を共有すると突合軸が混線し、`diff` への変更が `binding-drift` に波及 |

## edge / 回帰 × 対応 AC / Phase 早見表

| ID | 観点 | 対応 AC | 対応 Phase |
| --- | --- | --- | --- |
| TC-E1 | policy 不在 `?? false` | AC-2 | Phase 5 Step ①（drift 純関数） |
| TC-E2 | policy partial | AC-2 | Phase 5 Step ① |
| TC-E3 | drift 複数件同時 | AC-2 | Phase 5 Step ① |
| TC-E4 | exit code 0/2/64 | AC-5 | Phase 5 Step ③ |
| TC-E5 | コメント / 実 binding 混在 | AC-3 | Phase 5 Step ①（parser） |
| TC-E6 | env 一方のみ active | AC-3 | Phase 5 Step ① |
| TC-E7 | 空 wrangler | AC-3 | Phase 5 Step ① |
| TC-E8 | 非 kv/r2 テーブル無視 | AC-3 | Phase 5 Step ① |
| TC-E9 | `--json` 出力形式 | AC-5 | Phase 5 Step ③ |
| TC-R1 | 既存 test:alerts 不変 | AC-6 | Phase 5 Step ②（回帰） |
| TC-R2 | 既存 diff との排他 | AC-2 | Phase 2/3（排他設計） |

## 回帰 guard としての排他性・read-only 確認

- 異常系テストは全て **本物の `apps/api/wrangler.toml` / `policies/*.json` を mutation しない**（inline フィクスチャ + 直接組み立て `CanonicalPolicy[]`、TC-07 / TC-R1 のみ read-only で実ファイルを読む）。
- read-only 不変条件: 全 edge ケースで `setAlertTokenMode` / `loadActual` / write API を呼ばない。CI の `--ci` でも apply に到達しない（Phase 5 Step ④ の非 mutation 経路）。
- 排他性（TC-R2）: 新規 `BindingPolicyDrift` 型と `cmdBindingDrift` 経路が既存 `Drift` / `cmdDiff` と独立であることを型 import 関係と switch case 分離で固定。`pnpm test:alerts` で既存 spec が回帰しない（TC-R1）ことを最終証跡化する。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | （本 phase-06.md に内包。artifacts.json では別 main.md を持たない） | TC-E1〜TC-E9 / TC-R1〜TC-R2 一覧 / 入力 / 不変条件 / 回帰 guard |

> **Automation-30 改善後の現行状態**: Phase 6 の edge / regression 観点は今回サイクルの focused tests に反映済み。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | happy/Red TC-01〜TC-08 を起点に edge / 異常系を拡張 |
| Phase 5 | CLI 配線 / IO helper / read-only 不変条件に対して edge を被覆 |
| Phase 7 | TC-01〜TC-08 + TC-E1〜TC-E9 + TC-R1〜TC-R2 の合計 19 件を AC マトリクスの入力 |
| Phase 11 | TC-E4（exit code）/ TC-E9（`--json`）を CLI 回帰 smoke の実走シナリオに再利用 |

## 完了条件 (Acceptance Criteria for this Phase)

- [x] TC-E1〜TC-E9 が本 Phase に表化されている
- [x] policy JSON 不在/壊れ（E1）/ partial（E2）/ コメント混在（E5）/ env 一方のみ（E6）/ 空 wrangler（E7）/ 非 kv/r2 無視（E8）/ drift 複数件（E3）/ `--json`（E9）/ exit code 0-2-64（E4）が網羅されている
- [x] 各 TC に入力 / 失敗注入 / 期待される不変条件 / Red 状態が記述されている
- [x] 既存 `test:alerts` 回帰 guard（TC-R1）と既存 `alerts diff` 排他（TC-R2）が組み込まれている
- [x] read-only 不変条件（Cloudflare API 非接触・実ファイル mutation なし）が異常系で固定されている
- [x] 実テスト作成・実走を今回の実装サイクルに委ねる旨が明示されている

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `completed`
- TC-E1〜TC-E9 / TC-R1〜TC-R2 が AC-2 / AC-3 / AC-5 / AC-6 に紐づく
- read-only 不変条件が全 edge で崩れていない
- artifacts.json で Phase 6 は別 output を持たないため、本 phase-06.md が正本である

## 次 Phase への引き渡し

- 次 Phase: 7 (AC / カバレッジマトリクス)
- 引き継ぎ事項:
  - TC-01〜TC-08（happy/Red）+ TC-E1〜TC-E9（edge）+ TC-R1〜TC-R2（回帰）の合計 19 件が Phase 7 AC マトリクスの入力
  - TC-E4（exit code）/ TC-E9（`--json`）は Phase 11 smoke の実走シナリオに再利用
  - 排他性 TC-R2 と read-only は実装サイクルで型 import 関係 / switch 分離として維持
- ブロック条件:
  - policy 不在 / コメント混在 / env 一方のみ / 空 wrangler / exit code / `--json` のいずれかが未カバー
  - 既存 `alerts diff` との排他性 assert（別型・別経路）が欠落
