# Phase 5: 実装ランブック

> **Automation-30 改善追記（2026-06-02）**
> 本 Phase 作成当初の「仕様化まで」「spec_created」表現は historical context。ランブックの対象だった検知モジュール、CLI、wrapper、package script、CI gate、正本仕様同期は今回サイクルで実装済み。commit / push / PR / Issue mutation のみ user-gated。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | KV/R2 binding 活性状態 ↔ Cloudflare alert policy `enabled` 状態のドリフト検知（issue-1056 / issue-57-followup-003） |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック（検知モジュール新設 / CLI サブコマンド / cf.sh allowlist / package.json / CI gate / 棚卸し表追記） |
| 作成日 | 2026-06-02 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系・回帰テスト拡充) |
| 状態 | completed |
| 実装区分 | 実装仕様書（CONST_004 デフォルト・コード変更を伴う） |
| タスク種別 | implementation / implementation_mode: new / visualEvidence: NON_VISUAL / scope: tooling |
| GitHub Issue | #1056（OPEN のまま参照のみ・Issue mutation は user-gated） |

## 目的

Phase 2 の変更ファイル 7 件と Phase 4 の TC-01〜TC-08 を Green にするための **実装ステップ列（着手順序 + 差分方針 + 検証コマンド）** を正本化する。本 Phase は今回サイクルで実行済みの検知モジュール・CLI・wrapper・package script・CI gate・正本仕様同期を、後から検証可能なランブックとして残す。コミット作成・push・PR・Issue mutation は Phase 13 の user-gated 操作として分離する。

> **重要（read-only 不変条件）**: 本タスクの検知経路は Cloudflare API・`op` CLI・secret を一切呼ばない。実装でも `setAlertTokenMode` / `loadActual` / `alerts apply` を呼ばず、`apps/api/wrangler.toml` と `infra/cloudflare-alerts/policies/*.json`（`loadExpected` 経由）の **read のみ**で完結させる。
>
> **重要（baseline）**: 現状コードに対し drift 0（KV inactive+disabled / R2 active+enabled）。実装後の初回 `bash scripts/cf.sh alerts binding-drift` は exit 0 / `no binding-policy drift detected` でなければならない。

## CLAUDE.md ルールの反映（実装担当者必読）

- **Cloudflare 系 CLI は `scripts/cf.sh` 経由のみ**。実装後の動作確認も `wrangler` を直接呼ばず `bash scripts/cf.sh alerts binding-drift` を使う。ただし本サブコマンドは Cloudflare API 非接触のため `op` / token は要求しない。
- **すべて `mise exec --` 経由で実行**（Node 24 / pnpm 10 を保証）。typecheck / lint / test:alerts も `mise exec -- pnpm ...`。
- 新規 test は不変条件 #8 に従い `*.spec.ts` のみ（`binding-policy-drift.spec.ts`）。
- D1 境界（不変条件 #5）に触れない。本タスクは infra/cloudflare-alerts と scripts と CI のみ。

## 新規作成 / 修正ファイルパス一覧（必須・Phase 2 と一致）

| # | パス | 変更種別 | 概要 |
| --- | --- | --- | --- |
| 1 | `infra/cloudflare-alerts/lib/binding-policy-drift.ts` | 新規 | 型 + `BINDING_POLICY_MAP` + `parseActiveBindings` + `buildBindingPolicyDrift` + `loadActiveBindings` |
| 2 | `infra/cloudflare-alerts/lib/__tests__/binding-policy-drift.spec.ts` | 新規 | 回帰 spec（TC-01〜TC-08 / AC-6 (a)〜(f)） |
| 3 | `infra/cloudflare-alerts/lib/cli.ts` | 編集 | `cmdBindingDrift` / `printBindingDrifts` 追加、switch + usage 追記 |
| 4 | `scripts/cf.sh` | 編集 | alerts allowlist（case 文）+ usage に `binding-drift` |
| 5 | `package.json` | 編集 | `cf:alerts:binding-drift` script 追加（`test:alerts` は glob で自動包含・確認のみ） |
| 6 | `.github/workflows/cloudflare-alerts-drift.yml` | 編集 | PR `validate` job に binding-drift step + `paths` に `apps/api/wrangler.toml` |
| 7 | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | 編集 | binding↔policy 対応表 + UT-17-followup-006 責務境界追記 |

> 上記 7 ファイル **以外は変更しない**。既存 `diff.ts` / `load.ts` / `types.ts` / `policies/*.json` / `apps/api/wrangler.toml` は **読むだけ**で編集しない（baseline 整合を崩さない）。

## 実行タスク

1. ①検知モジュール `binding-policy-drift.ts` を新規作成する（完了条件: typecheck 緑 / 型・mapping・parser・drift 純関数・IO helper が export される）。
2. ②回帰 spec を新規作成し TDD Red→Green を回す（完了条件: TC-01〜TC-08 が `pnpm test:alerts` で Green）。
3. ③`cli.ts` に `cmdBindingDrift` / `printBindingDrift` + switch + usage を追加する（完了条件: `bash scripts/cf.sh alerts binding-drift` が exit 0 / `--json` で機械可読出力）。
4. ④`scripts/cf.sh` の alerts allowlist + usage に `binding-drift` を追加する（完了条件: unknown 弾きを通過し tsx 経路に到達）。
5. ⑤`package.json` に `cf:alerts:binding-drift` を追加する（完了条件: `pnpm cf:alerts:binding-drift` が動作）。
6. ⑥`cloudflare-alerts-drift.yml` の validate job に step + paths を追加する（完了条件: workflow yaml が valid・secret 不要 step）。
7. ⑦`deployment-cloudflare.md` に対応表 + 責務境界を追記する（完了条件: AC-8 / AC-1 と整合）。
8. DoD（後述）を全件満たすことを確認する（完了条件: typecheck/lint/test:alerts/binding-drift exit 0/棚卸し表追記が全て緑）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-02.md | 型 / `BINDING_POLICY_MAP` / parser 状態機械 / drift 純関数 / CLI 配線 / 変更ファイル 7 件 |
| 必須 | phase-04.md | TC-01〜TC-08（Green 条件） |
| 必須 | infra/cloudflare-alerts/lib/load.ts | `loadExpected().policies` 再利用 |
| 必須 | infra/cloudflare-alerts/lib/types.ts | `CanonicalPolicy` 型 import |
| 必須 | infra/cloudflare-alerts/lib/cli.ts | `cmdDiff` の exit code 規約 / usage / switch 既存形 |
| 必須 | scripts/cf.sh | alerts allowlist（case 文・:182 付近）/ usage（:169）/ tsx 経路（:210-222） |
| 必須 | apps/api/wrangler.toml | binding 活性の read 元（編集しない） |
| 必須 | .github/workflows/cloudflare-alerts-drift.yml | validate job への step / paths 追加先 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | 棚卸し表（:308）+ 対応表追記先 |
| 必須 | CLAUDE.md | Cloudflare CLI は cf.sh 経由 / mise exec / 不変条件 #5・#8 |

## 実装手順（着手順序つき 7 ステップ）

> 各ステップは Before（現状）/ After（方針）で記述する。**実コードは今回の実装サイクルが書く**。本 Phase は方針の正本。順序は依存関係（①→②→③→④→⑤→⑥→⑦）で固定する。

### Step ① 検知モジュール新設（AC-1 / AC-2 / AC-3）

- 対象: `infra/cloudflare-alerts/lib/binding-policy-drift.ts`（新規）。
- Before: 存在しない（binding 活性 ↔ policy enabled の突合ロジックがリポジトリ内に皆無）。
- After（方針）:
  - `import type { CanonicalPolicy } from "./types.ts";`。
  - 型 `BindingKind` / `ActiveBindingSet` / `BindingPolicyMapping` / `BindingPolicyDrift`（union 2 種）を Phase 2 のシグネチャ通り定義し **named export**。
  - `BINDING_POLICY_MAP`（kv→[`workers-kv-writes-per-day`, `workers-kv-stored-bytes`] / r2→[`r2-class-a`]）を `as const` で export。
  - `parseActiveBindings(tomlText: string): ActiveBindingSet`: 行走査の状態機械（先頭空白 trim 後 `#` 始まりは skip / `kv_namespaces`・`r2_buckets` テーブルヘッダで currentKind 切替 / 非コメント `binding = "..."` を該当 kind に収集 / dedupe / env 横断集約）。
  - `buildBindingPolicyDrift(bindings, policies, map = BINDING_POLICY_MAP): BindingPolicyDrift[]`: `enabledByName` Map を作り、各 mapping × policy で `active && !enabled`→MONITORING_GAP / `!active && enabled`→STALE_MONITORING を列挙。policy 不在は `?? false`（disabled 扱い）で active 時に MONITORING_GAP として顕在化する。
  - `loadActiveBindings(repoRoot: string): ActiveBindingSet`: `path.join(repoRoot, "apps/api/wrangler.toml")` を `readFileSync` し `parseActiveBindings` に渡す薄い IO helper（read のみ）。
- 検証: `mise exec -- pnpm typecheck`（型 OK）。
- コミット粒度: `feat(cloudflare-alerts): add binding↔policy drift detector (parser + pure fn) (#1056)`（**コミット 1**）。

### Step ② 回帰 spec 新設（TDD）（AC-6）

- 対象: `infra/cloudflare-alerts/lib/__tests__/binding-policy-drift.spec.ts`（新規）。
- Before: 存在しない。
- After（方針）: Phase 4 の `describe`/`it` 構造案に従い TC-01〜TC-08 を実装。inline wrangler フィクスチャ + 最小 `CanonicalPolicy[]`。TC-07 のみ `loadActiveBindings(process.cwd())` + `loadExpected(process.cwd())` で実ファイル read-only。
- 検証: `mise exec -- pnpm test:alerts`（TC-01〜TC-08 Green）/ `mise exec -- pnpm exec vitest run infra/cloudflare-alerts/lib/__tests__/binding-policy-drift.spec.ts`。
- コミット粒度: `test(cloudflare-alerts): add binding-policy-drift regression spec (TC-01..08) (#1056)`（**コミット 2**。Step ① と同一コミットにまとめてもよい＝検知 fn と回帰 spec は一体）。

### Step ③ CLI サブコマンド追加（AC-5）

- 対象: `infra/cloudflare-alerts/lib/cli.ts`（編集）。
- Before: `binding-drift` サブコマンドが存在せず switch / usage に無い。
- After（方針）:
  - `import { loadActiveBindings, buildBindingPolicyDrift, type BindingPolicyDrift } from "./binding-policy-drift.ts";`。
  - `printBindingDrifts(drifts, flags)`（`--json` なら `JSON.stringify`、空なら `no binding-policy drift detected`、ありなら件数 + 各行）。
  - `cmdBindingDrift(flags): Promise<number>`: `loadExpected(process.cwd()).policies` + `loadActiveBindings(process.cwd())` → `buildBindingPolicyDrift` → `printBindingDrifts` → `drifts.length === 0 ? 0 : 2`。**`setAlertTokenMode` / `loadActual` を呼ばない**。
  - `runCli` の switch に `case "binding-drift": return cmdBindingDrift(flags);` を追加。未知 flag / usage 違反は既存規約に従い exit 64。
  - `usage()` に `binding-drift [--json]  ローカルのみ。binding 活性 ↔ alert policy enabled の整合を検証` を 1 行追記。
- 検証: `mise exec -- pnpm typecheck` / `bash scripts/cf.sh alerts binding-drift; echo exit=$?`（baseline で exit 0）/ `bash scripts/cf.sh alerts binding-drift --json`（JSON 配列出力）。
- コミット粒度: `feat(cloudflare-alerts): add 'alerts binding-drift' read-only CLI subcommand (#1056)`（**コミット 3**）。

### Step ④ cf.sh allowlist + usage（AC-5）

- 対象: `scripts/cf.sh`（編集）。
- Before: `alerts` allowlist（case 文・:182 付近）に `binding-drift` が無く unknown で弾かれる。usage（:169）にも無い。
- After（方針）:
  - allowlist case 文に `binding-drift` を追加（既存 `list`/`diff`/`plan`/`apply` と並べる）。read-only のため `--ci` apply 禁止分岐（:199）に抵触させず、既存 tsx 実行経路（:210-222）を通す。**secret/op を要求する分岐に入れない**（list/diff と同じ非 mutation 経路）。
  - usage ヒアドキュメント（:169）に `binding-drift` 行を追記。
- 検証: `bash scripts/cf.sh alerts binding-drift`（allowlist 通過し tsx に到達・exit 0）/ `bash scripts/cf.sh alerts`（usage に binding-drift が出る）。
- コミット粒度: `feat(cf): allow 'alerts binding-drift' in cf.sh allowlist + usage (#1056)`（**コミット 4**。Step ③ と同一コミットでもよい）。

### Step ⑤ package.json script（AC-5）

- 対象: `package.json`（編集）。
- Before: `cf:alerts:binding-drift` が無い。
- After（方針）: `"cf:alerts:binding-drift": "bash scripts/cf.sh alerts binding-drift"` を `scripts` に追加。`test:alerts` は `infra/cloudflare-alerts/lib/__tests__/**` を対象にする既存 glob のため新規 spec を自動包含（**明示追加不要・確認のみ**）。
- 検証: `mise exec -- pnpm cf:alerts:binding-drift; echo exit=$?`（exit 0）/ `mise exec -- pnpm test:alerts`（新規 spec が含まれる）。
- コミット粒度: `chore: add cf:alerts:binding-drift package script (#1056)`（**コミット 5**。Step ④ と同一コミットでもよい）。

### Step ⑥ CI gate（validate job）（AC-7）

- 対象: `.github/workflows/cloudflare-alerts-drift.yml`（編集）。
- Before: `validate` job（`if: pull_request` / secret 不要）に binding-drift step が無い。`on.pull_request.paths` に `apps/api/wrangler.toml` が無い。
- After（方針）:
  - `on.pull_request.paths` に `apps/api/wrangler.toml` を追加（binding 活性変更時に発火）。既存 paths（infra/policies 等）は維持。
  - `validate` job に step を追加:
    ```yaml
    - name: Verify binding ↔ alert-policy consistency (local-only)
      run: pnpm cf:alerts:binding-drift --ci
    ```
  - `diff` job（schedule / dispatch・secret 使用）は **変更しない**。binding-drift は local-only のため PR で完結し、将来 binding 活性化時の policy 未有効化 PR を fail させる。
- 検証: workflow yaml の構文確認（`mise exec -- pnpm exec ...` で actionlint があれば実行・無ければ目視 + GitHub 上の validate job 緑）。step は secret を参照しない。
- コミット粒度: `ci(cloudflare-alerts): gate binding↔policy drift on PR validate job (#1056)`（**コミット 6**）。

### Step ⑦ 棚卸し表 + 責務境界追記（AC-8 / AC-1）

- 対象: `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`（編集）。
- Before: binding 棚卸し表（:308）と Cloudflare Alert Policy IaC 節はあるが、binding↔policy 対応表と本検知ガードの記述が無い。
- After（方針）:
  - "Cloudflare Alert Policy IaC" 節 / binding 棚卸し表付近に **binding kind ↔ alert policy 対応表**（KV→workers-kv-writes-per-day / workers-kv-stored-bytes、R2→r2-class-a）を `BINDING_POLICY_MAP` と同値で追記。
  - `cf:alerts:binding-drift`（local-only・PR gate）が整合を機械検証することと、policy の実有効化判断は **UT-17-followup-006** に委譲する責務境界、#85 / #75 / #77（運用設定）との分離を明記。
- 検証: `mise exec -- pnpm indexes:rebuild`（references 変更後の index 再生成・drift gate 整合）/ 目視で対応表が `BINDING_POLICY_MAP` と一致。
- コミット粒度: `docs(deployment-cloudflare): add binding↔policy map + drift-guard responsibility boundary (#1056)`（**コミット 7**）。

## コミット粒度

| # | メッセージ | スコープ | レビュー観点 |
| --- | --- | --- | --- |
| 1 | `feat(cloudflare-alerts): add binding↔policy drift detector (parser + pure fn) (#1056)` | 検知モジュール新設 | 型/mapping/parser 状態機械/drift 2 種/read-only IO helper |
| 2 | `test(cloudflare-alerts): add binding-policy-drift regression spec (TC-01..08) (#1056)` | 回帰 spec | TC-01〜TC-08 Green / inline フィクスチャ / TC-07 baseline |
| 3 | `feat(cloudflare-alerts): add 'alerts binding-drift' read-only CLI subcommand (#1056)` | CLI サブコマンド | exit 0/2/64 / `--json` / Cloudflare API 非接触 |
| 4 | `feat(cf): allow 'alerts binding-drift' in cf.sh allowlist + usage (#1056)` | cf.sh | allowlist 通過 / 非 mutation 経路 / usage 追記 |
| 5 | `chore: add cf:alerts:binding-drift package script (#1056)` | package.json | script 追加 / test:alerts 自動包含確認 |
| 6 | `ci(cloudflare-alerts): gate binding↔policy drift on PR validate job (#1056)` | CI gate | secret 不要 step / wrangler.toml paths / diff job 不変 |
| 7 | `docs(deployment-cloudflare): add binding↔policy map + drift-guard responsibility boundary (#1056)` | 棚卸し表 | 対応表が BINDING_POLICY_MAP と一致 / 責務境界 |

> コミット 1〜2 / 3〜5 はそれぞれ一体のため同一コミットにまとめてもよい。問題時は `git revert <commit>` で粒度復元可能。read-only のため revert で実環境への副作用は生じない。

## ローカル実行・検証コマンド（実装担当者向け）

```bash
# 型・lint（mise exec 経由・Node 24 保証）
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 回帰 spec（test:alerts glob に自動包含）
mise exec -- pnpm test:alerts
mise exec -- pnpm exec vitest run infra/cloudflare-alerts/lib/__tests__/binding-policy-drift.spec.ts

# baseline 確認（現状コードで drift 0 / exit 0・Cloudflare API 非接触）
bash scripts/cf.sh alerts binding-drift; echo "exit=$?"        # → no binding-policy drift detected / exit=0
bash scripts/cf.sh alerts binding-drift --json                 # → []（機械可読）
mise exec -- pnpm cf:alerts:binding-drift; echo "exit=$?"       # → exit=0

# references 変更後の index 再生成（Step ⑦ 後）
mise exec -- pnpm indexes:rebuild
```

## Definition of Done（DoD）

- [ ] `mise exec -- pnpm typecheck` が緑
- [ ] `mise exec -- pnpm lint` が緑
- [ ] `mise exec -- pnpm test:alerts` が緑（TC-01〜TC-08 + 既存 diff/load/schema spec 全 PASS）
- [ ] `bash scripts/cf.sh alerts binding-drift` が **exit 0 / `no binding-policy drift detected`**（baseline drift 0）
- [ ] `bash scripts/cf.sh alerts binding-drift --json` が `[]` を出力（drift なし時）
- [ ] `cloudflare-alerts-drift.yml` の validate job に secret 不要 step + `apps/api/wrangler.toml` paths が追加されている
- [ ] `deployment-cloudflare.md` に binding↔policy 対応表 + UT-17-followup-006 責務境界が追記され、`BINDING_POLICY_MAP` と一致している
- [ ] 変更が 7 ファイルに限定され、`apps/api/wrangler.toml` / `policies/*.json` / `diff.ts` を編集していない

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | （本 phase-05.md に内包。artifacts.json では別 main.md を持たない） | 変更ファイル 7 件 / Step ①〜⑦ Before-After / コミット粒度 / DoD |
| 実装成果 | binding-policy-drift.ts / spec / cli.ts diff 等 | 今回サイクルで生成済み。commit / push / PR は user-gated |

> **Automation-30 改善後の現行状態**: 実コード（検知モジュール / spec / CLI / cf.sh / package.json / workflow / 棚卸し表）の適用は今回サイクルで完了。commit / push / PR / Issue mutation はユーザー承認（Phase 13）まで行わない。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | TC-01〜TC-08 を Step ② の Green 条件として参照 |
| Phase 6 | 異常系（policy JSON 不在/壊れ・空 wrangler・exit code・`--json`）を本ランブックの CLI / IO helper に対して拡張 |
| Phase 7 | 変更ファイル 7 件 × AC のカバレッジマトリクス入力 |
| Phase 11 | DoD の `cf.sh alerts binding-drift` exit 0 を CLI 回帰 smoke の実走基準として再利用 |
| Phase 12 | Step ⑦ の棚卸し表追記をドキュメント更新の証跡として参照 |

## 完了条件 (Acceptance Criteria for this Phase)

- [x] 新規作成 / 修正ファイルパス一覧（7 件）が Phase 2 と一致して明記されている
- [x] Step ①〜⑦ が着手順序つき Before/After 方針で記述されている
- [x] 各ステップにローカル検証コマンド（typecheck/lint/test:alerts/`bash scripts/cf.sh alerts binding-drift`）が記述されている
- [x] read-only（`setAlertTokenMode` / `loadActual` / `alerts apply` 非呼び出し）が方針に固定されている
- [x] DoD（typecheck緑/lint緑/test:alerts緑/binding-drift exit 0/棚卸し表追記）が明記されている
- [x] CLAUDE.md の「Cloudflare CLI は cf.sh 経由」「mise exec 経由」ルールが反映されている
- [x] コミット粒度と rollback 境界が明記されている
- [x] 本ワークフローでは実コミットを作成しない旨が明示されている

## タスク100%実行確認【必須】

- 全実行タスク（8 件）が `completed`
- 変更ファイルが 7 件（Phase 2 と一致）に限定されている
- baseline drift 0（exit 0）が DoD に固定されている
- artifacts.json で Phase 5 は別 output を持たないため、本 phase-05.md が正本である

## 次 Phase への引き渡し

- 次 Phase: 6 (異常系・回帰テスト拡充)
- 引き継ぎ事項:
  - `parseActiveBindings` / `buildBindingPolicyDrift` / `loadActiveBindings` / `cmdBindingDrift` の挙動に対し、異常系（policy 不在 disabled 扱い / 壊れた policy / 空 wrangler / 混在 / exit code / `--json`）を Phase 6 で拡張
  - DoD の baseline drift 0（exit 0）を Phase 11 smoke の実走基準に再利用
  - read-only 不変条件（Cloudflare API 非接触）を Phase 6 の異常系でも崩さない
- ブロック条件:
  - 変更ファイルが 7 件を超える / `apps/api/wrangler.toml` や `policies/*.json` を編集する設計が残っている
  - CLI が Cloudflare API / secret を要求する設計になっている
