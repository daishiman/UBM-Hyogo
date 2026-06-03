# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | KV/R2 binding 活性状態 ↔ Cloudflare alert policy `enabled` 状態のドリフト検知（issue-1056 / issue-57-followup-003） |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-06-02 |
| Wave | 0（tooling / infrastructure governance / observability） |
| 実行種別 | serial（単一検知モジュール新設 + CLI サブコマンド + 回帰 spec + CI gate） |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | completed |
| 実装区分 | 実装仕様書（CONST_004 デフォルト・コード変更を伴う） |
| タスク種別 | implementation / implementation_mode: new / visualEvidence: NON_VISUAL / scope: tooling |

## 目的

issue #1056（issue-57-followup-003）「KV/R2 binding の活性状態と対応 Cloudflare alert policy の `enabled` 状態の整合ドリフトを検知する」を、最新コードの実態に合わせて要件化する。issue 原文は「設計のみ（対応表整理 / drift ロジック設計 / 検知手段決定 / 責務境界確認）」の 4 Phase 構成だが、CONST_004 に従い目的（drift を検知する）の達成にはコード（検知純関数 + wrangler parser + CLI サブコマンド + 回帰 spec + CI gate）が必須であるため **実装仕様書** へ昇格する。本 Phase ではこれを AC-1〜AC-9 へ落とし込み、現状コードの binding↔policy 整合状態（drift 0）を baseline として固定し、読み取り専用（read-only / mutation 禁止）の不変条件を確定する。Automation-30改善で、実コード変更と正本同期も今回サイクル内に完了した。

## 真の論点 (true issue)

- 本タスクの本質は「KV/R2 binding を実活性化したときに、対応する free-tier 監視 alert policy が `enabled:true` 化されているか（あるいはその逆）を保証する**単一の検証点**を作る」こと。現状この整合は完全に手動依存で、binding 活性 / free-tier 記録 / alert policy 有効化が #57 / UT-17-followup-006 / UT-33 に分散しており、突き合わせる仕組みが無い。
- 副次論点: (1) wrangler.toml の binding 活性をコメント行を尊重して判定する parser、(2) KV/R2 quota が account 単位（≠ binding 単位）であることを反映した kind 粒度の対応表、(3) 既存 `alerts diff`（宣言 vs 実デプロイ）と混線しない別ガードとしての分離、(4) Cloudflare API 不要の local-only 検知を PR CI gate に置くことで全 PR 強制、(5) 現状（整合）に対する green baseline。
- **scope 再最適化**: issue 原文は「検知の実行手段（script or CI gate）を Phase 3 で決定し、CI gate 化は follow-up に分離可」としていたが、CONST_007（1 サイクル完結・先送り禁止）に従い、**検知モジュール + CLI + 回帰 spec + CI gate + 棚卸し表追記までを同一サイクルで完結**させる。CI gate は Cloudflare API を呼ばない local-only 検知のため secret 不要の PR `validate` job に置け、追加コストなく全 PR で強制できるため分離する技術的理由が無い。

## 既存 drift 検知との差分（最重要・他タスク解決済み調査）

| 既存の仕組み | 突合軸 | #1056 をカバーするか |
| --- | --- | --- |
| `cloudflare-alerts-drift.yml` + `infra/cloudflare-alerts/lib/diff.ts`（`diffPolicy`/`diffWebhook`） | repo の IaC policy 宣言 JSON ↔ Cloudflare 上の**実デプロイ Notification Policy** | **No**。「宣言 vs デプロイ」軸であり binding 活性を見ない |
| #1054（issue-57-followup-001 / wrangler binding 三者ドリフト gate）※未実装 | wrangler.toml ↔ `apps/api/src/env.ts` 型 ↔ 棚卸し表 | **No**。alert policy `enabled` 次元を持たない |
| 本タスク #1056 | wrangler.toml binding 活性 ↔ alert policy `enabled`（+ 棚卸し表） | — （新設） |

> `scripts/` 全 grep で binding 活性 ↔ policy enabled を突合するスクリプトは 0 件。**issue #1056 は他タスクで未解決**。

## 現状コード分析（baseline 整合状態）

| binding kind | wrangler.toml 現状 | 対応 policy | policy `enabled` | 整合判定 |
| --- | --- | --- | --- | --- |
| Workers KV | `ALERT_DEDUP_KV` = `# [[env.production.kv_namespaces]]`（コメントアウト）/ `SESSION_KV` = not applied → **inactive** | `workers-kv-writes-per-day` / `workers-kv-stored-bytes` | `false` / `false` | **整合**（inactive && disabled） |
| R2 bucket | `MEMBER_PHOTOS` / `UBM_AUDIT_COLD_STORAGE` / `UBM_AUDIT_APP_COLD_STORAGE` = production/staging **active** | `r2-class-a` | `true` | **整合**（active && enabled） |

> 現時点の実ドリフトは **0 件**。本検知を今実装しても baseline は green（exit 0）。これは priority:low（即時実害なし）の根拠とも一致する。価値は「将来 `ALERT_DEDUP_KV` を活性化した PR で KV policy を `enabled:true` 化し忘れたら CI が fail する」ガードの新設にある。

## 価値とコスト

- 価値: binding↔policy 整合が「単一の検証点（local-only 検知 + PR CI gate）」で機械保証され、属人的レビューの抜けを排除。将来の KV alert 運用開始（UT-17-followup-006）時の有効化忘れを即捕捉。現状に対し green baseline を確立。
- コスト: 検知モジュール（parser + mapping + drift 純関数、数十行）+ CLI サブコマンド 1 個 + 回帰 spec 1 本 + workflow 1 ステップ + 棚卸し表 1 表追記。Cloudflare API 呼び出しなし・secret なしで運用コスト追加ゼロ。
- 機会コスト: 既存 `load.ts` を再利用するため policy 読込ロジックの重複なし。CI gate 化を follow-up に分離する案（issue 原文）は CONST_007 違反かつ追加コストが無いため不採用。

## 4 条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 「binding 活性 ↔ policy enabled の整合を保証する単一検証点が無い」という実在の課題を塞ぐ。将来の有効化忘れを CI で捕捉でき、green baseline も確立 |
| 実現性 | PASS | policy `enabled` は既存 `loadExpected().policies` で取得済。wrangler 活性判定はコメント尊重 line parser（#1054 でも採用判断）。drift は純関数で 2 種列挙。Cloudflare API 不要で secret 障壁なし |
| 整合性 | PASS | 不変条件 #5（D1 境界）非接触。#8（`.spec.ts` のみ）を新規 test で厳守。既存 `alerts diff` と突合軸が排他で別 `Drift` 型・別サブコマンドに分離。read-only で `alerts apply` を呼ばない |
| 運用性 | PASS | `cf.sh alerts {list,diff,apply}` の正本経路に `binding-drift` を同型追加。exit code 規約（0/2/64）を踏襲。ロールバックは追加分の `git revert` で 1 コミット粒度。UT-17-followup-006 に policy 有効化判断を委譲し責務境界明記 |

## 既存命名規則の確認

| 観点 | 確認対象 | 期待される規則 |
| --- | --- | --- |
| モジュール言語 | `infra/cloudflare-alerts/lib/*.ts` | ESM / TypeScript（`.ts` 拡張子 import）。`load.ts` / `diff.ts` と同型 |
| 新規モジュール名 | 新規検知モジュール | `infra/cloudflare-alerts/lib/binding-policy-drift.ts`（kebab-case、既存 `quota-base.ts` と整合） |
| drift 型名 | 新規 drift union | `BindingPolicyDrift`（既存 `Drift` と別型で混線回避） |
| 関数命名 | parser / drift 純関数 | camelCase（`parseActiveBindings` / `buildBindingPolicyDrift`） |
| CLI サブコマンド | `cf.sh alerts <sub>` | `binding-drift`（kebab-case。既存 list/diff/plan/apply と並ぶ） |
| テストファイル | 新規 spec | 不変条件 #8 で `*.spec.ts`。配置は `infra/cloudflare-alerts/lib/__tests__/binding-policy-drift.spec.ts`（既存テストと同階層・`test:alerts` glob 内） |
| ログ接頭辞 | 検知出力 | `binding-drift` サブコマンド出力。drift 行は `MONITORING_GAP` / `STALE_MONITORING` ラベル付き |

## 実行タスク

1. issue 本文の Phase 1〜4（対応表 / drift ロジック / 手段決定 / 責務境界）を AC-1〜AC-9 へ写像し、`index.md` と一致させる（完了条件: AC が index.md と一致）。
2. 「issue #1056 が他タスクで解決済みか / 陳腐化していないか」の調査結論を `index.md` 調査結論テーブルに固定する（完了条件: 未解決 + 陳腐化なし + drift 0 が明記、AC-1/AC-4）。
3. 現状の binding↔policy 整合表（KV inactive+disabled / R2 active+enabled）を baseline として列挙する（完了条件: 現状コード分析テーブルが本 Phase に存在、AC-4）。
4. read-only / mutation 禁止を不変条件として固定する（完了条件: AC-2 に記録、`alerts apply` 非呼び出し）。
5. テストファイル配置を `infra/cloudflare-alerts/lib/__tests__/binding-policy-drift.spec.ts`（`test:alerts` glob）に決定し、不変条件 #8 を確認する（完了条件: AC-6 / 命名規則テーブルと一致）。
6. タスク種別を `implementation` / `implementation_mode: new` / `visualEvidence: NON_VISUAL` / `scope: tooling` で固定する（完了条件: `artifacts.json.metadata` と一致）。
7. 4 条件評価を全 PASS で確定する（完了条件: 各観点に PASS + 根拠）。
8. CONST_007 に従い「検知モジュール + CLI + spec + CI gate + 棚卸し表追記を 1 サイクル完結。CI gate を follow-up 分離しない」を固定する。
9. issue state の OPEN/クローズド乖離を記録し、Issue mutation を user-gated とする（完了条件: index.md / artifacts.json に記録）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | infra/cloudflare-alerts/lib/load.ts | policy `enabled` canonical 取得の再利用元 |
| 必須 | infra/cloudflare-alerts/lib/types.ts | `CanonicalPolicy`（name/enabled）型 |
| 必須 | infra/cloudflare-alerts/lib/cli.ts | `binding-drift` 追加先（switch / usage / exit code） |
| 必須 | infra/cloudflare-alerts/policies/workers-kv-writes-per-day.json | KV write 監視 policy（enabled:false） |
| 必須 | infra/cloudflare-alerts/policies/workers-kv-stored-bytes.json | KV storage 監視 policy（enabled:false） |
| 必須 | infra/cloudflare-alerts/policies/r2-class-a.json | R2 監視 policy（enabled:true） |
| 必須 | apps/api/wrangler.toml | binding 活性判定の入力 |
| 必須 | scripts/cf.sh | alerts allowlist（:182 付近）+ --ci 経路 |
| 必須 | .github/workflows/cloudflare-alerts-drift.yml | PR validate job への gate 追加先 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | 棚卸し表（:308）+ 対応表追記先 |
| 必須 | docs/30-workflows/completed-tasks/issue-57-followup-003-kv-alert-policy-drift-detection.md | issue 原文 |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-core.md | Phase 1 テンプレ |

## スコープ

### 含む

- Phase 1〜13 のタスク仕様書整備 + Phase 1〜3 成果物本体
- AC-1〜AC-9 の `index.md` との同期
- 現状 binding↔policy 整合 baseline（drift 0）の固定
- read-only / mutation 禁止不変条件の固定
- テストファイル配置（`infra/cloudflare-alerts/lib/__tests__/`）の決定

### 含まない

- Cloudflare 実環境への `alerts apply`、commit / push / PR / Issue mutation（ユーザー承認待ち）
- alert policy の `enabled:true` 化判断（UT-17-followup-006 射程）
- 新規 binding / 新規 policy の追加・KV binding 活性化
- Cloudflare 実環境への `alerts apply`（mutation）
- 既存 `alerts diff`（宣言 vs デプロイ）ロジックの変更
- UI / D1 / Cloudflare Secret の変更
- GitHub Issue #1056 の状態変更（**OPEN のまま**）

## 実行手順

### ステップ 1: issue Phase の AC 写像
issue 本文 Phase 1〜4 を AC-1（対応表）/ AC-2（drift 2 種・read-only）/ AC-7（CI gate）/ AC-8（責務境界）へ写像し、実装観点（AC-3 parser / AC-5 CLI / AC-6 spec / AC-4 baseline / AC-9 4 条件）を追加する。

### ステップ 2: 調査結論の固定
「他タスクで未解決」「issue アンカー陳腐化なし」「現状 drift 0」を `index.md` 調査結論に固定する。

### ステップ 3: baseline 整合表の作成
KV inactive+disabled / R2 active+enabled を現状コード分析テーブルに列挙し、本検知の baseline green を Phase 4/11 の回帰基準にする。

### ステップ 4: read-only 不変条件
mutation（policy 有効化・binding 追加・`alerts apply`）を一切含まないことを AC-2 と多角的チェックに固定する。

### ステップ 5: テスト配置決定
`infra/cloudflare-alerts/lib/__tests__/binding-policy-drift.spec.ts` に決定（`test:alerts` glob 内・CI 実行対象）。

### ステップ 6: 4 条件評価のロック
4 条件すべてを PASS で確定する。MAJOR があれば Phase 2 へ進めない。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | mapping const・wrangler parser・drift 純関数・CLI サブコマンドの設計入力 |
| Phase 3 | 4 条件評価を base case の PASS 判定根拠に再利用 |
| Phase 4 | AC-1〜AC-9 をテスト戦略のトレース対象に渡す |
| Phase 5 | 実装ランブック（変更ファイル 7 件 + 差分方針）の起点 |
| Phase 7 | AC matrix の左軸として AC-1〜AC-9 を使用 |
| Phase 11 | CLI 回帰 smoke（`cf.sh alerts binding-drift` exit 0 + drift 0）の基準として AC-4 を渡す |

## 多角的チェック観点

- 不変条件 #5: D1 境界に触れない。
- 不変条件 #8: 新規 test は `.spec.ts` のみ。
- read-only: `alerts apply` / Cloudflare write API を呼ばない。
- 排他性: 既存 `Drift`（宣言 vs デプロイ）と別型 `BindingPolicyDrift`。
- baseline: 現状コードに対し drift 0（exit 0）。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | issue Phase → AC-1〜AC-9 写像 | 1 | completed | index.md と一致 |
| 2 | 調査結論（未解決 / 陳腐化なし / drift 0）固定 | 1 | completed | AC-1/AC-4 |
| 3 | baseline 整合表の列挙 | 1 | completed | KV/R2 |
| 4 | read-only 不変条件固定 | 1 | completed | AC-2 |
| 5 | テスト配置決定 | 1 | completed | __tests__/ |
| 6 | タスク種別 / scope / visualEvidence 固定 | 1 | completed | artifacts.json と一致 |
| 7 | 4 条件評価 PASS 確定 | 1 | completed | 全件 PASS |
| 8 | CONST_007 1 サイクル完結固定 | 1 | completed | CI gate 分離禁止 |
| 9 | issue state OPEN 乖離記録 | 1 | completed | mutation user-gated |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 要件定義主成果物（背景 / 既存 drift 差分 / baseline 整合表 / AC-1〜AC-9 / 4 条件評価 / 命名規則） |
| メタ | artifacts.json | Phase 1 状態の更新（completed） |

## 完了条件 (Acceptance Criteria for this Phase)

- [x] 真の論点が「binding 活性 ↔ policy enabled の整合を保証する単一検証点の新設」として再定義されている
- [x] 既存 drift 検知（`alerts diff` / #1054）との差分が明記され、#1056 が他タスクで未解決と結論されている
- [x] 現状 baseline 整合表（KV inactive+disabled / R2 active+enabled / drift 0）が列挙されている
- [x] 4 条件評価が全 PASS で確定している
- [x] AC-1〜AC-9 が `index.md` と完全一致している
- [x] read-only / mutation 禁止が AC-2 に固定されている
- [x] テストファイル配置が `infra/cloudflare-alerts/lib/__tests__/binding-policy-drift.spec.ts` に決定されている
- [x] タスク種別 `implementation` / `visualEvidence: NON_VISUAL` / `scope: tooling` が固定されている
- [x] CONST_007（CI gate を含め 1 サイクル完結・follow-up 分離禁止）が明記されている
- [x] issue state の OPEN/クローズド乖離が記録され Issue mutation が user-gated とされている

## タスク100%実行確認【必須】

- 全実行タスク（9 件）が `completed`
- 全成果物が `outputs/phase-01/` 配下に配置済み
- 苦戦箇所（コメント尊重 parser / account 単位 quota / 既存 diff との排他 / secret なし CI gate）が AC または多角的チェックに対応
- artifacts.json の `phases[0].status` が `completed`

## 次 Phase への引き渡し

- 次 Phase: 2 (設計)
- 引き継ぎ事項:
  - mapping: KV binding（任意 active）→ `workers-kv-writes-per-day` / `workers-kv-stored-bytes`、R2 binding（任意 active）→ `r2-class-a`（kind 粒度・account 単位 quota）
  - wrangler 活性判定: `#` コメント行 inactive の line parser、production/staging 横断集約
  - drift 純関数: `MONITORING_GAP`（active && !enabled）/ `STALE_MONITORING`（!active && enabled）の 2 種
  - policy `enabled` は `loadExpected().policies` 再利用
  - CLI: `cf.sh alerts binding-drift [--json] [--ci]`、exit 0/2/64、Cloudflare API 非呼び出し
  - テスト配置 `infra/cloudflare-alerts/lib/__tests__/binding-policy-drift.spec.ts`
  - CI gate: PR `validate` job（secret 不要）+ `apps/api/wrangler.toml` paths
  - 4 条件評価（全 PASS）の根拠
- ブロック条件:
  - 4 条件のいずれかに MAJOR が残る
  - AC-1〜AC-9 が index.md と乖離
