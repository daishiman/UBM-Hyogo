# issue-1054-wrangler-binding-drift-ci-gate - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | issue-1054-wrangler-binding-drift-ci-gate |
| タスク名 | `wrangler.toml` binding 宣言 ↔ `apps/api/src/env.ts` の `Env` 型 ↔ `deployment-cloudflare.md` の Current Cloudflare binding inventory、の三者ドリフト検出 CI gate 新設（issue #1054 / issue-57-followup-001） |
| ディレクトリ | docs/30-workflows/completed-tasks/issue-1054-wrangler-binding-drift-ci-gate |
| 実行種別 | serial（単一 read-only 解析スクリプト + 回帰 spec + CI gate 実装済み） |
| 作成日 | 2026-06-02 |
| 担当 | unassigned |
| 状態 | implemented_local_evidence_captured |
| 実装区分 | **実装仕様書**（コード変更を伴う。CONST_004 デフォルト） |
| implementation_mode | new |
| visualEvidence | NON_VISUAL（CLI tooling / CI gate・UI/UX 変更なし） |
| scope | tooling / infrastructure_governance |
| 優先度 | MEDIUM（GitHub label `priority:medium` / `scale:medium`） |
| GitHub Issue | #1054（**CLOSED のまま**。再 open・Issue mutation はユーザー指示まで行わない） |
| 起点 | docs/30-workflows/completed-tasks/issue-57-followup-001-wrangler-binding-drift-ci-gate.md（issue #57 Phase 12 で分離された follow-up） |

## 初期調査結論（issue 最適化の根拠）

本タスクは「issue #1054 が既に別タスクで解決済みか」を 2026-06-02 の着手時点コードで調査した上で起こした **実装仕様書** である。下表は初期調査時点の記録であり、今回サイクルで gate / spec / CI / 棚卸し表は実装済みに更新した。

| 観点 | 調査コマンド / 確認箇所 | 結果 | 判定 |
| --- | --- | --- | --- |
| gate スクリプト本体の有無 | `ls scripts/verify-wrangler-binding-drift.*` | ファイル不在（初期調査時点） | **未実装だったため今回実装** |
| CI workflow の有無 | `ls .github/workflows/verify-wrangler-binding-drift.yml` | ファイル不在（初期調査時点） | **未実装だったため今回実装** |
| `package.json` script の有無 | `grep wrangler-binding-drift package.json` | ヒット 0（初期調査時点） | **未実装だったため今回実装** |
| コードベース全文検索 | `grep -rn "wrangler-binding-drift\|binding-drift"`（unassigned spec 除く） | 実装本体への参照 0（#57 関連 docs のみ） | **他タスクでも未解決** |
| 前提①: 棚卸し表 | `deployment-cloudflare.md:308`「Current Cloudflare binding inventory（Issue #57 / issue #1054 / 2026-06-02）」 | 存在（D1 / Analytics / R2 / KV 7 行） | **前提あり** |
| 前提②: `Env` 型正本 | `apps/api/src/env.ts`（冒頭コメントで「wrangler.toml の binding 定義と一対一対応」と宣言） | 存在 | **前提あり** |

> 結論: **issue #1054 は他タスクで解決されておらず、対応が必要**。gate スクリプト・CI workflow・`package.json` script のいずれも未実装。

## issue を現行コードへ最適化した点（root cause 再写像）

issue #1054 原文（2026-05-31 作成）は issue #57 当時の binding 構成を前提にしている。**最新コードでは binding が増えており、issue が想定していなかった実ドリフトが既に発生している**。本タスクはこれを根本解決まで含めて再定義する。

| # | issue 原文の前提 | 最新コードの実態（2026-06-02） | 本タスクでの最適化 |
| --- | --- | --- | --- |
| O-1 | R2 binding は `UBM_AUDIT_COLD_STORAGE` / `UBM_AUDIT_APP_COLD_STORAGE` の 2 件 | **`MEMBER_PHOTOS`（issue-983）が production / staging の `[[env.*.r2_buckets]]` に追加済み**。`env.ts` にも `MEMBER_PHOTOS?: R2Bucket` 反映済み | gate の解析対象に `MEMBER_PHOTOS` を含める。fixture に明示 |
| O-2 | 棚卸し表（`deployment-cloudflare.md`）は 5 行（audit×2 / ALERT_DEDUP_KV / SESSION_KV / R2_BUCKET） | **棚卸し表に `MEMBER_PHOTOS` 行が無い** = wrangler に active な R2 binding があるのに棚卸し表が未記載 = **三者ドリフトが現実化** | **DoD に「棚卸し表へ `MEMBER_PHOTOS` 行追加」を含め、gate を現行 repo で green 化する（= 根本解決）** |
| O-3 | R2 block は top-level `[[r2_buckets]]` を想定しうる | 実際は **env-prefixed（`[[env.production.r2_buckets]]` / `[[env.staging.r2_buckets]]`）のみ**。top-level R2 block は存在しない | パーサは env-prefixed block を第一級で扱い、同名 binding を 1 エントリに集約する |
| O-4 | queue binding は scope 外言及なし | `SCHEMA_ALIAS_BACKFILL_QUEUE` は top-level / env.* ともに **コメントアウト（applied:false）**、`env.ts` は optional | コメントアウト block は `applied:false` として誤検出しない（KV/R2 棚卸し対象外でも fail させない） |

> **根本問題**: issue #1054 が解こうとしたドリフトは「将来再発」ではなく「**既に `MEMBER_PHOTOS` で発生している**」。本タスクは (a) 検出 gate の新設に加え、(b) 現存ドリフト（棚卸し表の `MEMBER_PHOTOS` 欠落）の是正までを 1 サイクルで完了させる（CONST_007）。

## 目的

`apps/api/wrangler.toml` の binding 宣言を read-only 解析し、(a) `apps/api/src/env.ts` の `Env` interface に対応 property があるか、(b) applied binding が `deployment-cloudflare.md` の「Current Cloudflare binding inventory」表に記載されているか、を突合して **ドリフトがあれば非ゼロ exit する CI gate** を新設する。あわせて、現存ドリフト（`MEMBER_PHOTOS` の棚卸し表欠落）を是正し、現行 repo で gate が green になる状態を確定する。

## スコープ

### 含む

- `scripts/verify-wrangler-binding-drift.mjs`（新規・read-only 解析スクリプト）:
  - `apps/api/wrangler.toml` の binding block 解析（top-level / env-prefixed / コメントアウト）→ `{ name, kind, applied, envs }`
  - `apps/api/src/env.ts` の `Env` interface property 集合の抽出
  - `deployment-cloudflare.md` の「Current Cloudflare binding inventory」表（binding 名 + state）の抽出
  - 三者突合 → ドリフト種別ごとに decisive メッセージ + 非ゼロ exit
- `scripts/__tests__/verify-wrangler-binding-drift.spec.ts`（新規・回帰 spec test。vitest root glob `scripts/**/*.spec.ts` で CI 実行対象。不変条件 #8 で `.spec.ts` のみ）
- `.github/workflows/verify-wrangler-binding-drift.yml`（新規・CI gate job）
- `package.json` の `verify:wrangler-binding-drift` script 追記
- **`deployment-cloudflare.md` の棚卸し表へ `MEMBER_PHOTOS` 行を追加**（現存ドリフト是正・gate を現行 repo で green 化）
- `deployment-cloudflare.md` 棚卸し表が「機械検出対象 SSOT」である旨の注記追加
- Phase 1〜13 のタスク仕様書（`phase-NN.md`）と Phase 1〜3 設計成果物（`outputs/phase-0N/main.md`）

### 含まない

- 新規 binding の**適用そのもの**（`SESSION_KV`=issue #88 / UT-13、`R2_BUCKET`=UT-12、KV foundation=UT-36 の射程）
- `wrangler.toml` の `[vars]` 重複整理（issue #117 / UT-06-FU-D の射程）
- KV Namespace ID 混入防止 pre-commit guard（issue #86 の射程）
- KV alert policy ↔ binding 活性連動の drift 検出（issue-57-followup-003 の射程）
- WAF / Cloudflare 側 rate limit / その他インフラ設定
- GitHub Issue #1054 の状態変更（**CLOSED のまま**）
- UI / D1 schema / Google Form 仕様の変更

## binding 棚卸し（current code facts: 2026-06-02）

| Binding | Kind | wrangler.toml | applied | env.ts `Env` | 棚卸し表 | 突合結果 |
| --- | --- | --- | --- | --- | --- | --- |
| `DB` | D1 | top + env.prod + env.staging | true | あり | あり | OK（本タスクで棚卸し表へ追加） |
| `SYNC_ALERTS` | analytics | top + env.prod + env.staging | true | あり（optional） | あり | OK（本タスクで棚卸し表へ追加） |
| `UBM_AUDIT_COLD_STORAGE` | R2 | env.prod + env.staging | true | あり（optional） | active 行あり | OK |
| `UBM_AUDIT_APP_COLD_STORAGE` | R2 | env.prod + env.staging | true | あり（optional） | active 行あり | OK |
| `MEMBER_PHOTOS` | R2 | env.prod + env.staging | true | あり（optional） | **追加済み** | **OK（本タスクで棚卸し表へ追加して是正）** |
| `SCHEMA_ALIAS_BACKFILL_QUEUE` | queue | top + env.* すべてコメントアウト | false | あり（optional） | 未記載 | applied:false → fail させない。active 化時は Current Cloudflare binding inventory 行が必要 |
| `ALERT_DEDUP_KV` | KV | env.* コメントアウト | false | あり（optional） | commented/optional 行あり | applied:false → fail させない |
| `SESSION_KV` | KV | block 無し | false | 無し（予約欄コメントのみ） | not applied 行あり | not applied 一致 → OK |
| `R2_BUCKET` | R2 | block 無し | false | 無し（予約欄コメントのみ） | not applied 行あり | not applied 一致 → OK |

> secrets（`R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `AUTH_SECRET` 等）は `wrangler secret put` 起源で toml binding block を持たないため、gate の binding 突合対象から除外する。

## 受入条件 (AC)

- AC-1: パーサが `apps/api/wrangler.toml` の binding block を top-level / env-prefixed（`[[env.production.r2_buckets]]` 等）/ コメントアウト（`# [[...]]` + `# binding = "..."`）を区別して `{ name, kind, applied, envs }` に正規化する。env-prefixed の同名 binding は 1 エントリに集約する。
- AC-2: `applied: true` の binding に `env.ts` の `Env` interface property（`readonly <NAME>?: ...`）が欠落していると gate が非ゼロ exit する。
- AC-3: `applied: true` の binding が `deployment-cloudflare.md` の「Current Cloudflare binding inventory」表に未記載だと gate が非ゼロ exit する（= `MEMBER_PHOTOS` 欠落を検出し、D1 / Analytics drift も同時に防ぐ条件）。
- AC-4: 棚卸し表が `active` と記す binding に対応する wrangler block が無いと gate が非ゼロ exit する（逆方向ドリフト）。また、active binding の inventory `Kind` が wrangler 側の binding 種別（D1 / Analytics / R2 / KV / Queue）と異なる場合も非ゼロ exit する。
- AC-5: コメントアウト block（`applied: false`）は、`env.ts` optional / 棚卸し表 optional・not-applied であっても fail させない。
- AC-6: secrets（toml binding を持たない `Env` property）を誤検出しない。env.ts 突合と棚卸し表突合は `applied:true` の Cloudflare binding（D1 / Analytics / R2 / KV / Queue）を対象にし、コメントアウト・未適用 binding は fail させない。
- AC-7: gate は完全に read-only（ファイル書き込み・ネットワークアクセスを行わない。不変条件 #5 に抵触しない）。
- AC-8: 回帰 spec test `scripts/__tests__/verify-wrangler-binding-drift.spec.ts` が、(a) 現行 repo（是正後）で exit 0、(b) `env.ts` から 1 binding を削った fixture で型欠落 fail、(c) 棚卸し表から 1 行を削った fixture で棚卸し欠落 fail、(d) コメントアウト binding を fail させない、(e) env-prefixed 重複の 1 エントリ集約、を vitest で回帰 guard する。
- AC-9: `.github/workflows/verify-wrangler-binding-drift.yml` が `apps/api/wrangler.toml` / `apps/api/src/env.ts` / `deployment-cloudflare.md` のいずれか変更時に gate を起動し、既存 `verify-*.yml`（例: `verify-design-tokens.yml`）と同じ top-level permissions / Node 24 セットアップ規約に整合する。
- AC-10: `deployment-cloudflare.md` 棚卸し表に `MEMBER_PHOTOS` 行が追加され、現行 repo で `mise exec -- pnpm verify:wrangler-binding-drift` が exit 0 になる（現存ドリフト是正 = 根本解決）。
- AC-11: 4 条件（価値性 / 実現性 / 整合性 / 運用性）すべてが Phase 1 / Phase 3 で PASS 確認されている。

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/main.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02/main.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/main.md |
| 4 | テスト戦略 | phase-04.md | completed | outputs/phase-04/main.md |
| 5 | 実装ランブック | phase-05.md | completed | outputs/phase-05/main.md |
| 6 | 異常系・回帰テスト拡充 | phase-06.md | completed | outputs/phase-06/main.md |
| 7 | AC / カバレッジマトリクス | phase-07.md | completed | outputs/phase-07/main.md |
| 8 | DRY 化・リファクタリング | phase-08.md | completed | outputs/phase-08/main.md |
| 9 | 品質保証 | phase-09.md | completed | outputs/phase-09/main.md |
| 10 | 最終レビュー | phase-10.md | completed | outputs/phase-10/main.md |
| 11 | 手動 smoke test（CLI 回帰検証） | phase-11.md | completed | outputs/phase-11/main.md ほか 2 件 |
| 12 | ドキュメント更新 | phase-12.md | completed | outputs/phase-12/main.md + strict 7 |
| 13 | PR 作成 | phase-13.md | pending_user_approval | outputs/phase-13/main.md |

## 主要成果物（Phase 1〜3 範囲）

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-01/main.md | 要件定義（背景 / 現状コード分析 / binding 棚卸し / スコープ / AC-1〜AC-11 / 4 条件評価 / 命名規則） |
| 設計 | outputs/phase-02/main.md | パーサ / 三者突合ロジック / 関数シグネチャ / データ構造 / 変更ファイル一覧 / テスト戦略の設計 |
| レビュー | outputs/phase-03/main.md | 代替案比較・PASS/MINOR/MAJOR・着手可否ゲート |
| メタ | artifacts.json | Phase 1〜13 機械可読サマリー |

## Phase 12 strict 7 成果物

| ファイル | 用途 |
| --- | --- |
| outputs/phase-12/main.md | Phase 12 summary |
| outputs/phase-12/implementation-guide.md | Task 12-1 実装ガイド |
| outputs/phase-12/system-spec-update-summary.md | Task 12-2 システム仕様更新 |
| outputs/phase-12/documentation-changelog.md | Task 12-3 変更履歴 |
| outputs/phase-12/unassigned-task-detection.md | Task 12-4 未タスク検出 |
| outputs/phase-12/skill-feedback-report.md | Task 12-5 skill feedback |
| outputs/phase-12/phase12-task-spec-compliance-check.md | Task 12-6 compliance |

## 関連サービス・ツール

| サービス/ツール | 用途 | コスト |
| --- | --- | --- |
| Node.js (fs) | read-only 解析（wrangler.toml / env.ts / md） | 無料 |
| pnpm | `pnpm verify:wrangler-binding-drift` 経由実行 | 無料 |
| vitest | 回帰 spec test（`scripts/**/*.spec.ts`） | 無料 |
| GitHub Actions | `verify-wrangler-binding-drift` CI gate | 無料枠 |
| GitHub | Issue #1054 連携（CLOSED のまま参照のみ） | 無料枠 |

## Secrets 一覧

本タスクは Secret を導入しない。read-only 解析スクリプト・回帰 spec・CI gate・Current Cloudflare binding inventory 更新のみで完結する。

## 不変条件 touched

| # | 不変条件 | 本タスクでの扱い |
| --- | --- | --- |
| #5 | D1 への直接アクセスは `apps/api` に閉じる | gate は read-only 解析のみ。D1 接続なし。違反なし |
| #8 | 新規 test は `*.spec.{ts,tsx}` のみ | 新規 test を `scripts/__tests__/verify-wrangler-binding-drift.spec.ts` とし `.spec.ts` を厳守 |

## 完了判定

- Phase 1〜13 の状態が `artifacts.json` と一致する（Phase 1〜12 = `completed` / Phase 13 = `pending_user_approval`）
- AC-1〜AC-11 が Phase 1〜3 で全件カバーされる
- 4 条件（価値性 / 実現性 / 整合性 / 運用性）が PASS
- 本ワークフローは gate / spec / workflow / 棚卸し表追記のローカル実装と検証まで完了し、commit / push / PR / Issue mutation のみユーザー承認後に行う

## 苦戦箇所・知見（実装着手時に追記する想定枠）

**1. TOML パーサ自作の env-prefix / コメント block 解釈**
`@iarna/toml` 等のライブラリは「コメントアウト block」を構文上は無視するため、`applied:false` の区別ができない。本 gate は行単位の自作軽量パーサで `# [[...]]` + `# binding = "..."` を `applied:false` として明示捕捉する必要がある。Phase 2 で行走査ロジックを固定する。

**2. 棚卸し表の表記揺れ正規化**
state 列は `production/staging active in ...` / `not applied` / `apps/api/src/env.ts optional; ...` など自由記述。binding 名（バッククォート 1 列目）を主キーにし、state は `active` / `not-applied` / `optional/commented` の 3 区分へ正規化する。未知語は warn にとどめ誤 fail を避ける。

**3. MEMBER_PHOTOS 是正と gate green の順序依存**
gate を先に CI へ入れると、棚卸し表 `MEMBER_PHOTOS` 欠落により即 fail する。今回サイクルでは「棚卸し表追記 → gate 実装 → CI 配線」の順で同時反映し、現行 repo で exit 0 を担保する（AC-10）。

## 関連リンク

- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/1054
- 起点 spec: ../unassigned-task/issue-57-followup-001-wrangler-binding-drift-ci-gate.md
- 親ワークフロー: ../completed-tasks/issue-57-kv-r2-guardrail-degrade-design/index.md
- 棚卸し表正本: ../../../.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md（「Current Cloudflare binding inventory」節）
- binding 型正本: ../../../apps/api/src/env.ts
- binding 宣言実体: ../../../apps/api/wrangler.toml
- 既存 verify gate 先例: ../../../.github/workflows/verify-design-tokens.yml / ../../../scripts/verify-design-tokens.ts
