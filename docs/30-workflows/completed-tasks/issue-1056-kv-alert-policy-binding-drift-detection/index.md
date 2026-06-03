# issue-1056-kv-alert-policy-binding-drift-detection - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | issue-1056-kv-alert-policy-binding-drift-detection |
| タスク名 | KV/R2 binding 活性状態 ↔ Cloudflare alert policy `enabled` 状態のドリフト検知（issue #1056 / issue-57-followup-003） |
| ディレクトリ | docs/30-workflows/completed-tasks/issue-1056-kv-alert-policy-binding-drift-detection |
| 実行種別 | serial（単一検知モジュール新設 + CLI サブコマンド + 回帰 spec + CI gate） |
| 作成日 | 2026-06-02 |
| 担当 | unassigned |
| 状態 | implemented_local_evidence_captured |
| 実装区分 | **実装仕様書**（コード変更を伴う。CONST_004 デフォルト） |
| implementation_mode | new |
| visualEvidence | NON_VISUAL（CLI tooling / CI gate・UI/UX 変更なし） |
| scope | tooling / infrastructure_governance / observability |
| 優先度 | LOW（GitHub label `priority:low` / `scale:small` / `type:improvement`） |
| GitHub Issue | #1056（spec 作成時 **OPEN** → close-out 時点で **CLOSED**（closedAt=2026-06-02T03:32:56Z）を実測。再 open / close / Issue mutation はユーザー指示まで行わない・実態反映のみ） |
| 起点 | docs/30-workflows/completed-tasks/issue-57-followup-003-kv-alert-policy-drift-detection.md（issue #1056 本文）/ Issue #57（KV/R2 free-tier 正本化 + binding 棚卸し表） |

## issue state に関する注記（重要）

issue #1056 は spec 作成時点では `gh issue view 1056` の実測で **`state: OPEN` / `closedAt: null`** であった（ユーザー認識「クローズド」と乖離）。その後 close-out 時点（2026-06-02）で **`state: CLOSED` / `closedAt: 2026-06-02T03:32:56Z`** を実測。本タスク仕様書は issue state を変更せず、実態（CLOSED）を反映するのみとする。close / reopen を含む Issue mutation はユーザー承認（Phase 13）まで一切行わない。

## 調査結論（issue 最適化の根拠）

本タスクは「issue #1056 が既に別タスクで解決済みか」「issue が最新コードに対して陳腐化していないか」を実コードで調査した上で起こした **実装仕様書** である。調査結果:

| 観点 | 現状コード（2026-06-02） | 判定 |
| --- | --- | --- |
| 既存 `cloudflare-alerts-drift.yml` + `infra/cloudflare-alerts/lib/diff.ts` の射程 | IaC policy 宣言（`infra/cloudflare-alerts/policies/*.json`）と Cloudflare 上の **実デプロイ Notification Policy** の drift を検知（`diffPolicy` / `diffWebhook`）。突合軸は「宣言 vs 実デプロイ」 | **#1056 とは別物**（binding 活性 ↔ policy enabled の軸を持たない） |
| 姉妹 #1054（issue-57-followup-001 / wrangler binding 三者ドリフト gate） | spec_created のみで **未実装**（`scripts/*binding*` 不在・workflow 不在・drift マーカー grep 0 件）。突合軸は wrangler.toml ↔ env.ts ↔ 棚卸し表の三者 | **#1056 をカバーしない**（alert policy `enabled` 次元を持たない） |
| binding 活性 ↔ alert policy enabled を突合するスクリプト | リポジトリ内に **存在しない**（`scripts/` 全 grep で該当 0 件） | **未解決** |
| issue 参照アンカーの陳腐化 | `workers-kv-writes-per-day.json`=`enabled:false` ✓ / `workers-kv-stored-bytes.json`=`enabled:false` ✓ / `r2-class-a.json`=`enabled:true` ✓ / `ALERT_DEDUP_KV` wrangler コメントアウト ✓ / `SESSION_KV` not applied ✓ / R2 binding（`MEMBER_PHOTOS`/`UBM_AUDIT_COLD_STORAGE`/`UBM_AUDIT_APP_COLD_STORAGE`）active ✓ / 棚卸し表 `deployment-cloudflare.md:308` 存在 ✓ | **陳腐化なし**（全アンカー現行一致） |
| 現時点の実ドリフト | KV: binding 非活性 + policy `enabled:false` → 整合 / R2: binding active + `r2-class-a` `enabled:true` → 整合 | **drift 0 件**（即時実害なし＝priority:low の根拠と一致） |

> 結論: **issue #1056 は他タスクで解決されておらず、検知ガード自体が未実装。対応が必要**。ただし現時点で実ドリフトは 0 件のため、本タスクの価値は「将来 KV alert 運用開始（UT-17-followup-006 / ALERT_DEDUP_KV 活性化）時に policy 有効化忘れを捕捉する**ガードの新設**」と「現状（整合）に対する green baseline の確立」にある。issue 原文は「設計のみ（対応表・ロジック設計・手段決定）」の構成だが、CONST_004 により目的（drift を検知する）の達成にはコード（検知モジュール + CLI + 回帰 spec + CI gate）が必須であるため、**実装仕様書**として作成し、1 サイクル（CONST_007）で検知モジュール・CLI・テスト・CI gate・棚卸し表追記まで完結させる。

## 目的

KV/R2 binding の活性状態（`apps/api/wrangler.toml` の uncommented binding block + `deployment-cloudflare.md` 棚卸し表）と、対応する Cloudflare alert policy の `enabled` 状態（`infra/cloudflare-alerts/policies/*.json` を `load.ts` で canonical 化）の整合を **read-only** で突合し、`MONITORING_GAP`（binding active なのに監視 policy disabled）と `STALE_MONITORING`（policy enabled なのに対応 binding inactive）の 2 種ドリフトを検出して非ゼロ exit で報告する。検知は局所ファイル解析のみ（Cloudflare API / secret 不要）で PR CI gate に組み込み、将来 binding 活性化時の policy 有効化忘れを機械的に捕捉する。

## スコープ

### 含む

- 新規検知モジュール `infra/cloudflare-alerts/lib/binding-policy-drift.ts`:
  - wrangler.toml の binding 活性判定 line parser（`#` コメント行を inactive とみなす。`[[env.production.kv_namespaces]]` / `[[env.staging.r2_buckets]]` 等を production/staging 横断で集約）
  - binding kind（KV / R2）↔ alert policy 対応表（mapping const）
  - drift 判定純関数（`MONITORING_GAP` / `STALE_MONITORING` の 2 種を列挙）
  - policy `enabled` は既存 `load.ts` の `loadExpected(repoRoot).policies`（`CanonicalPolicy.enabled`）を再利用（JSON 再パースしない）
- `infra/cloudflare-alerts/lib/cli.ts` に `binding-drift` サブコマンド追加（Cloudflare API を呼ばない local-only。drift 検出時 exit 2 / なしで exit 0 / `--json` 対応）
- `scripts/cf.sh` の `alerts` allowlist（case 文）に `binding-drift` 追加
- `package.json` に `cf:alerts:binding-drift` script 追加 + `test:alerts` の対象拡張
- 回帰 spec `infra/cloudflare-alerts/lib/__tests__/binding-policy-drift.spec.ts`（issue §6 の 4 ケース + parser のコメント/非コメント分岐）
- `.github/workflows/cloudflare-alerts-drift.yml` の PR `validate` job に `apps/api/wrangler.toml` paths 追加 + `pnpm cf:alerts:binding-drift --ci` ステップ追加（secret 不要のため PR で実行可能）
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` に binding↔policy 対応表 + UT-17-followup-006 責務境界の追記
- Phase 1〜13 のタスク仕様書（`phase-NN.md`）と Phase 1〜3 設計成果物（`outputs/phase-0N/main.md`）

### 含まない

- alert policy の実有効化判断・`enabled:true` 化（→ UT-17-followup-006 射程）
- 新規 binding の追加・新規 alert policy の追加・KV binding の実活性化
- Cloudflare 実環境への `alerts apply`（mutation 一切）
- KV 使用量監視の運用サイクル設計（→ #85 / #75 / #77 射程）
- 既存 `cloudflare-alerts diff`（宣言 vs 実デプロイ）ロジックの変更
- GitHub Issue #1056 の状態変更（**OPEN のまま**）
- UI / D1 / Cloudflare Secret の変更

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 起点 | Issue #57（KV/R2 free-tier 正本 + binding 棚卸し表） | 棚卸し表と free-tier 値が本検知の入力正本 |
| 再利用 | `infra/cloudflare-alerts/lib/load.ts`（UT-17-followup-004） | policy `enabled` の canonical 取得を再利用 |
| 責務委譲 | UT-17-followup-006（KV alert policy 運用開始） | policy の実有効化判断は委譲。本タスクは drift 検知のみ |
| 責務分離 | #85 / #75 / #77（監視・アラート運用設定） | 本タスクは整合 drift 検知に限定。運用設定は重複しない |
| 並列 | #1054（wrangler 三者ドリフト gate） | 共に Issue #57 follow-up・棚卸し表を入力に持つが突合軸が異なり独立（本タスクは alert policy enabled 次元、#1054 は env.ts 型次元） |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | infra/cloudflare-alerts/lib/load.ts | policy `enabled` canonical 取得（`loadExpected().policies` 再利用） |
| 必須 | infra/cloudflare-alerts/lib/types.ts | `CanonicalPolicy`（`name` / `enabled`）型 |
| 必須 | infra/cloudflare-alerts/lib/cli.ts | `binding-drift` サブコマンド追加先（switch / usage / exit code 規約） |
| 必須 | infra/cloudflare-alerts/policies/workers-kv-writes-per-day.json | KV write 監視 policy（`enabled:false`） |
| 必須 | infra/cloudflare-alerts/policies/workers-kv-stored-bytes.json | KV storage 監視 policy（`enabled:false`） |
| 必須 | infra/cloudflare-alerts/policies/r2-class-a.json | R2 Class A/B 監視 policy（`enabled:true`） |
| 必須 | apps/api/wrangler.toml | binding 活性判定の入力（KV コメントアウト / R2 active） |
| 必須 | scripts/cf.sh | `alerts` allowlist（case 文・:182 付近）+ `--ci` 経路 |
| 必須 | package.json | `cf:alerts:*` / `test:alerts` script 正本 |
| 必須 | .github/workflows/cloudflare-alerts-drift.yml | PR `validate` job（secret 不要）への gate 追加先 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | binding 棚卸し表（:308）+ Cloudflare Alert Policy IaC 節（対応表追記先） |
| 必須 | infra/cloudflare-alerts/lib/diff.ts | 既存 drift 表現（`Drift` union）と排他性の確認 |
| 必須 | docs/00-getting-started-manual/specs/08-free-database.md | KV/R2 free-tier 正本 |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | Phase 1〜13 テンプレ正本 |

## 受入条件 (AC)

- **AC-1**: binding kind（KV / R2）↔ alert policy 対応表が一意に定まり、`binding-policy-drift.ts` の mapping const と `deployment-cloudflare.md` の表の両方に明文化される。KV binding（任意の active KV）→ `workers-kv-writes-per-day` / `workers-kv-stored-bytes`、R2 binding（任意の active R2）→ `r2-class-a` に対応する（KV/R2 free-tier quota は account 単位のため「いずれかの binding が active なら対応 policy は enabled であるべき」とする）。
- **AC-2**: drift 2 種を read-only 純関数で列挙する。`MONITORING_GAP` = binding kind active かつ対応 policy `enabled:false`（監視欠落）/ `STALE_MONITORING` = binding kind inactive かつ対応 policy `enabled:true`（無意味な監視）。判定・出力に mutation（policy 有効化・binding 追加・`alerts apply`）を一切含まない。
- **AC-3**: wrangler.toml の binding 活性判定が `#` コメント行を inactive とみなす line parser で実装される（TOML ライブラリはコメント block を捨てるため不採用）。`[[env.production.kv_namespaces]]` / `[[env.staging.kv_namespaces]]` / `[[env.production.r2_buckets]]` / `[[env.staging.r2_buckets]]` を環境横断で集約し、いずれかの env で active なら active と判定する。
- **AC-4**: 現状コードに対し drift 0 件（green baseline）。KV: `ALERT_DEDUP_KV` コメントアウト + `SESSION_KV` not applied で KV inactive、KV policy 2 件 `enabled:false` → 整合。R2: 3 binding active + `r2-class-a` `enabled:true` → 整合。`bash scripts/cf.sh alerts binding-drift` が exit 0 / `no drift detected` を出す。
- **AC-5**: `bash scripts/cf.sh alerts binding-drift [--json] [--ci]` サブコマンドが追加され、drift 検出時 exit 2 / なしで exit 0 / usage error 64 / `--json` で機械可読出力。Cloudflare API を呼ばず secret 不要（`setAlertTokenMode` / `loadActual` を呼ばない）。`scripts/cf.sh` の allowlist と `cli.ts` の switch・usage の双方に登録される。
- **AC-6**: 回帰 spec `infra/cloudflare-alerts/lib/__tests__/binding-policy-drift.spec.ts` が (a) active+enabled → drift なし、(b) inactive+disabled → drift なし、(c) active+disabled → `MONITORING_GAP`、(d) inactive+enabled → `STALE_MONITORING`、(e) wrangler parser のコメント行=inactive / 非コメント行=active 分岐、(f) production/staging 横断集約、を vitest で guard する。`pnpm test:alerts` の対象に含まれる。
- **AC-7**: CI gate が追加される。`cloudflare-alerts-drift.yml` の PR `validate` job の `paths` に `apps/api/wrangler.toml` を追加し、`pnpm cf:alerts:binding-drift --ci` ステップ（secret 不要・local-only）を実行する。将来 KV binding を活性化した PR で対応 policy 未有効化なら job が fail する。
- **AC-8**: `deployment-cloudflare.md` の "Cloudflare Alert Policy IaC" 節 / binding 棚卸し表（:308）に binding↔policy 対応表が追記され、UT-17-followup-006 / #85 / #75 / #77 との責務境界が記述される。
- **AC-9**: 4 条件（価値性 / 実現性 / 整合性 / 運用性）すべてが Phase 1 / Phase 3 で PASS 確認されている。

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/main.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02/main.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/main.md |
| 4 | テスト戦略 | phase-04.md | completed | 回帰 spec 実装済み |
| 5 | 実装ランブック | phase-05.md | completed | 実装完了・user-gated 操作分離 |
| 6 | 異常系・回帰テスト拡充 | phase-06.md | completed | edge / regression tests 実装済み |
| 7 | AC / カバレッジマトリクス | phase-07.md | completed | focused evidence 取得済み |
| 8 | DRY 化・リファクタリング | phase-08.md | completed | `loadExpected()` 再利用・過剰抽象化なし |
| 9 | 品質保証 | phase-09.md | completed | `pnpm test:alerts` / `pnpm cf:alerts:binding-drift --ci` PASS |
| 10 | 最終レビュー | phase-10.md | completed | implemented_local_evidence_captured GO |
| 11 | 手動 smoke test（CLI 回帰検証） | phase-11.md | completed | outputs/phase-11 evidence present |
| 12 | ドキュメント更新 | phase-12.md | completed | outputs/phase-12/phase12-task-spec-compliance-check.md |
| 13 | PR 作成 | phase-13.md | pending_user_approval | （仕様書のみ・ユーザー承認待ち） |

## 主要成果物（Phase 1〜3 範囲）

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-01/main.md | 要件定義（背景 / 既存 drift との差分 / 現状 binding↔policy 整合表 / AC-1〜AC-9 / 4 条件評価） |
| 設計 | outputs/phase-02/main.md | mapping const / parser / drift 純関数 / CLI サブコマンド / 関数シグネチャ / 変更ファイル一覧 |
| レビュー | outputs/phase-03/main.md | 代替案比較・PASS/MINOR/MAJOR・着手可否ゲート |
| メタ | artifacts.json | Phase 1〜13 機械可読サマリー |

## 関連サービス・ツール

| サービス/ツール | 用途 | コスト |
| --- | --- | --- |
| Node.js (fs) | wrangler.toml 読込 + policy JSON 読込（`load.ts` 経由） | 無料 |
| tsx | `cli.ts` 経由のサブコマンド実行 | 無料 |
| vitest | 回帰 spec（`infra/cloudflare-alerts/lib/__tests__/`） | 無料 |
| GitHub Actions | `cloudflare-alerts-drift` PR `validate` job への gate 追加 | 無料枠 |
| GitHub | Issue #1056 連携（OPEN のまま参照のみ） | 無料枠 |

## Secrets 一覧

本タスクは Secret を導入しない。検知は local-only（wrangler.toml + policy JSON のファイル解析のみ）で Cloudflare API を呼ばないため、`--ci` モードでも token / secret を要求しない。

## 不変条件 touched

| # | 不変条件 | 本タスクでの扱い |
| --- | --- | --- |
| #5 | D1 への直接アクセスは `apps/api` に閉じる | 本タスクは D1 を触らない。違反なし |
| #8 | 新規 test は `*.spec.{ts,tsx}` のみ | 新規 test を `binding-policy-drift.spec.ts` とし `.spec.ts` を厳守 |

## 完了判定

- Phase 1〜13 の状態が `artifacts.json` と一致する（Phase 1〜12 = `completed` / Phase 13 = `pending_user_approval`）
- AC-1〜AC-9 が Phase 1〜3 で全件カバーされる
- 4 条件（価値性 / 実現性 / 整合性 / 運用性）が PASS
- 本ワークフローは **implemented_local_evidence_captured**。実コード変更（検知モジュール / CLI / spec / CI gate / 棚卸し表追記）と focused evidence は今回サイクルで完了し、commit / push / PR / Issue mutation のみユーザー承認待ちである

## 苦戦箇所・知見（実装着手時に追記する想定枠）

**1. wrangler.toml のコメント block を尊重する parser**
`ALERT_DEDUP_KV` は `# [[env.production.kv_namespaces]]` / `# binding = "ALERT_DEDUP_KV"` とコメントアウトされている。TOML ライブラリはコメント行を捨てるため「active か commented か」を判別できない。`#` 始まり行を inactive とみなす line parser を自作する（#1054 spec と同じ判断）。Phase 2 で parser の状態機械を固定する。

**2. KV/R2 quota は account 単位 ≠ binding 単位**
free-tier quota（KV writes/day, R2 Class A/month 等）は account 全体の合算。よって「特定 binding ↔ 特定 policy」の 1:1 ではなく「KV binding が 1 つでも active → KV quota policy は enabled であるべき」という kind 単位の集約判定にする。Phase 2 で mapping を kind 粒度に固定。

**3. 既存 `alerts diff` との排他性**
既存 `diffPolicy`（宣言 vs 実デプロイ）と本 `binding-policy-drift`（binding 活性 vs policy enabled）は突合軸が異なる別ガード。`Drift` union を共有せず本タスク独自の drift 型（`BindingPolicyDrift`）を新設し、`cli.ts` でも別サブコマンドに分離する。Phase 2/3 で混線しないことを確認。

**4. CI gate を secret なし PR job に置く**
本検知は Cloudflare API を呼ばない local-only のため、secret を持つ `diff` job ではなく PR の `validate` job に置ける。これにより全 PR で binding↔policy 整合を強制でき、将来 binding 活性化時の policy 有効化忘れを即捕捉できる。Phase 5 で workflow 編集箇所を固定。

## 関連リンク

- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/1056
- 起点 spec（issue 本文）: ../issue-57-followup-003-kv-alert-policy-drift-detection.md
- Issue #57（KV/R2 free-tier 正本 + 棚卸し表）/ UT-17-followup-006（KV alert policy 運用開始）
- 棚卸し表正本: ../../../.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md
