# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | wrangler.toml binding ↔ env.ts ↔ 棚卸し表 三者ドリフト検出 CI gate (issue-1054-wrangler-binding-drift-ci-gate) |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-06-02 |
| Wave | 0（tooling / infrastructure governance） |
| 実行種別 | serial（単一 read-only 解析スクリプト + 回帰 spec + CI gate） |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | completed |
| 実装区分 | 実装仕様書（CONST_004 デフォルト・コード変更を伴う） |
| タスク種別 | implementation / implementation_mode: new / visualEvidence: NON_VISUAL / scope: tooling |
| GitHub Issue | #1054（CLOSED のまま参照のみ） |

## 目的

issue #1054「wrangler.toml binding ↔ env.ts 型 ↔ deployment-cloudflare.md 棚卸し表の三者ドリフト検出 CI gate」を、最新コードの実態に合わせて要件化する。issue 原文は issue #57 当時の binding 構成（R2 = audit 2 件）を前提にしているが、最新コードでは `MEMBER_PHOTOS`（issue-983）の R2 binding が追加され、wrangler.toml と env.ts には反映されているのに **棚卸し表に行が無い = 三者ドリフトが既に現実化**している。本 Phase ではこのドリフトを検出する gate の要件 AC-1〜AC-11 を固定し、あわせて現存ドリフトの是正（棚卸し表への `MEMBER_PHOTOS` 追加）を AC-10 として要件化する。本ワークフローは仕様書整備に閉じ、実コード変更は今回の実装サイクル（03.実装.md）で行う前提を固定する。

## 真の論点 (true issue)

- 本タスクの本質は「binding を追加・削除したときに、**宣言（wrangler.toml）↔ 型（env.ts）↔ 棚卸し表（deployment-cloudflare.md）の三者が乖離したことを CI が機械検出**し、誰も気づかないドリフトを構造的に排除する」こと。issue #57 はこのドリフトを「手動の棚卸し表新設」で一度是正したが、static snapshot のため再びズレる。実際に `MEMBER_PHOTOS` で既にズレている。
- 副次論点: (1) コメントアウト block（`applied:false`）を誤検出しない解析、(2) env-prefixed block（top-level R2 が無く env.* のみ）の正規化、(3) secrets は toml binding 外として除外しつつ D1 / analytics を inventory 突合対象へ含める、(4) read-only 厳守（不変条件 #5 非接触）、(5) 現行 repo で gate が green になる状態（= 現存ドリフト是正）の同梱。
- **scope 再最適化**: issue 原文の「top-level `[[r2_buckets]]` を含む」は、現行 wrangler.toml が env-prefixed R2 のみであるため実態に合わせる。新規 binding の適用（SESSION_KV / R2_BUCKET）や vars 整理は別 Issue の射程で over-scope。

## 現状コード分析（解析対象 3 ソース）

| ソース | 箇所 | 内容 | gate での扱い |
| --- | --- | --- | --- |
| `apps/api/wrangler.toml` | :120-134 / :208-222 | `[[env.production.r2_buckets]]` / `[[env.staging.r2_buckets]]` に `UBM_AUDIT_COLD_STORAGE` / `UBM_AUDIT_APP_COLD_STORAGE` / `MEMBER_PHOTOS`（applied:true） | env-prefixed を 1 エントリに集約 |
| `apps/api/wrangler.toml` | :37-38 / :106-107 / :140-141 / :229-230 | `# [[queues.producers]]` + `# binding = "SCHEMA_ALIAS_BACKFILL_QUEUE"` / `# [[env.*.kv_namespaces]]` + `# binding = "ALERT_DEDUP_KV"` | コメントアウト = applied:false（fail させない） |
| `apps/api/src/env.ts` | `Env` interface | `DB` / `SYNC_ALERTS?` / `UBM_AUDIT_COLD_STORAGE?` / `UBM_AUDIT_APP_COLD_STORAGE?` / `MEMBER_PHOTOS?` / `SCHEMA_ALIAS_BACKFILL_QUEUE?` / `ALERT_DEDUP_KV?` + secrets 多数 | binding property を抽出。secrets は binding 突合対象外 |
| `deployment-cloudflare.md` | :308-320 | 「Current Cloudflare binding inventory」表（D1 / Analytics / R2 / KV）。初期調査時点では **`MEMBER_PHOTOS` 欠落** | binding 突合の正本。MEMBER_PHOTOS 欠落 = 検出すべき DRIFT |

> **検出すべき現存ドリフト**: `MEMBER_PHOTOS`（R2・applied:true）が棚卸し表に無い。gate を現行 repo に適用すると AC-3 で fail する。これは gate の正しい動作であり、AC-10 の DoD（棚卸し表追記）で green 化する。

## 価値とコスト

- 価値: binding 追加・削除のたびに発生する「宣言 ↔ 型 ↔ 棚卸し表」の三者乖離が CI で常時検出され、issue #57 で起きた「稼働中の R2 binding を runbook が『未適用』と断言する」状態が構造的に排除される。`MEMBER_PHOTOS` の現存ドリフトも同 PR で是正される。
- コスト: read-only 解析スクリプト 1 本（数十〜百行程度）+ 回帰 spec 1 本 + CI workflow 1 本 + `package.json` 1 行 + Current Cloudflare binding inventory 更新。ランタイムコスト・運用コスト追加なし（CI 無料枠）。
- 機会コスト: TOML パーサライブラリ採用（案）と比べ、コメントアウト block を `applied:false` として捕捉する必要から自作軽量行パーサが妥当（ライブラリはコメント block を無視するため区別不能）。

## 4 条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 三者乖離（型欠落 / 棚卸し未記載 / 逆方向）という実在ドリフトを CI で機械検出。`MEMBER_PHOTOS` の現存ドリフトを実証的に是正する |
| 実現性 | PASS | 既存 `verify-design-tokens.ts` / `verify-d1-migration-sequence.mjs` の「read-only 解析 → drift fail」先例あり。行パーサ + 集合突合は標準 Node fs で実装可能 |
| 整合性 | PASS | 不変条件 #5（D1 境界）非接触の read-only。#8（`.spec.ts` のみ）を新規 test で厳守。env.ts 冒頭コメントが宣言する「一対一対応」運用を機械強制する |
| 運用性 | PASS | CI gate は変更 path トリガで起動。ローカル `pnpm verify:wrangler-binding-drift` で PR 前検出。ロールバックは新規 4 ファイルの revert で 1 コミット粒度 |

## 既存命名規則の確認

| 観点 | 確認対象 | 期待される規則 |
| --- | --- | --- |
| スクリプト言語 | `scripts/verify-design-tokens.ts` / `scripts/verify-d1-migration-sequence.mjs` | `.mjs`（ESM）または `.ts`。本タスクは依存最小の `.mjs` を採用 |
| スクリプト名 | 既存 `verify-*` 系 | `verify-<対象>-<観点>.mjs` → `verify-wrangler-binding-drift.mjs` |
| package script | `verify:design-tokens` 等 | `verify:<対象>` → `verify:wrangler-binding-drift` |
| workflow 名 | `verify-design-tokens.yml` 等 | `verify-<対象>.yml` → `verify-wrangler-binding-drift.yml` |
| テストファイル | 新規 spec test | 不変条件 #8 で `*.spec.ts` のみ。`scripts/__tests__/verify-wrangler-binding-drift.spec.ts`（root vitest glob `scripts/**/*.spec.ts`） |
| ログ接頭辞 | 新規エラーログ | `[verify-wrangler-binding-drift]` 接頭辞で grep 可能にする |

## 実行タスク

1. issue #1054 が他タスクで未解決であることを調査し `index.md` 調査結論に固定する（完了条件: gate / workflow / package script 不在を確認、調査結論テーブルが index.md に存在）。
2. issue を現行コードへ最適化し、`MEMBER_PHOTOS` の現存ドリフトを root cause として記録する（完了条件: O-1〜O-4 が index.md に明記、AC-10 として is 棚卸し表是正が要件化）。
3. 解析対象 3 ソースの現状を行番号付きで列挙する（完了条件: 現状コード分析テーブルが本 Phase に存在）。
4. binding 棚卸し（current code facts）を 9 binding 分作成する（完了条件: index.md の棚卸し表と一致）。
5. AC-1〜AC-11 を確定する（完了条件: AC が index.md と一致）。
6. read-only / 不変条件 #5・#8 の遵守を要件化する（完了条件: AC-7 / 不変条件 touched テーブル）。
7. タスク種別を `implementation` / `implementation_mode: new` / `visualEvidence: NON_VISUAL` / `scope: tooling` で固定する（完了条件: artifacts.json.metadata と一致）。
8. 4 条件評価を全 PASS で確定する（完了条件: 各観点に PASS + 根拠）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | apps/api/wrangler.toml | binding 宣言の実体（解析対象①） |
| 必須 | apps/api/src/env.ts | `Env` 型の正本（解析対象②） |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | 棚卸し表の正本（解析対象③・MEMBER_PHOTOS 是正先） |
| 必須 | scripts/verify-design-tokens.ts | read-only 解析 → drift fail の先例 |
| 必須 | .github/workflows/verify-design-tokens.yml | CI gate job の先例 |
| 必須 | vitest.config.ts | test glob（`scripts/**/*.spec.ts`）正本 |
| 必須 | docs/30-workflows/completed-tasks/issue-57-followup-001-wrangler-binding-drift-ci-gate.md | 起点 spec（AC 原文） |
| 必須 | CLAUDE.md | 不変条件 #5 / #8 |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-core.md | Phase 1 テンプレ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 要件定義主成果物（背景 / 現状コード分析 / binding 棚卸し / スコープ / AC-1〜AC-11 / 4 条件評価 / 命名規則） |
| メタ | artifacts.json | Phase 1 状態の更新（completed） |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 解析対象 3 ソース・binding 棚卸し 9 件・命名規則を設計入力に渡す |
| Phase 3 | 4 条件評価を base case の PASS 判定根拠に再利用 |
| Phase 4 | AC-1〜AC-11 をテスト戦略のトレース対象に渡す |
| Phase 5 | 実装ランブック（変更 5 ファイル + 差分方針）の起点 |
| Phase 7 | AC matrix の左軸として AC-1〜AC-11 を使用 |
| Phase 11 | CLI 回帰 smoke（`pnpm verify:wrangler-binding-drift` の exit 0）の基準として AC-10 を渡す |

## 完了条件

- [x] 真の論点が「三者乖離の機械検出 + 現存 MEMBER_PHOTOS ドリフト是正」として再定義されている
- [x] 現状コード分析テーブルに解析対象 3 ソースが行番号付きで列挙されている
- [x] binding 棚卸し（9 件）が current code facts として記録されている
- [x] 4 条件評価が全 PASS で確定している
- [x] AC-1〜AC-11 が `index.md` と完全一致している
- [x] issue 最適化（O-1〜O-4）と MEMBER_PHOTOS root cause が明記されている
- [x] テストファイル配置が `scripts/__tests__/verify-wrangler-binding-drift.spec.ts` に決定されている
- [x] タスク種別 `implementation` / `visualEvidence: NON_VISUAL` / `scope: tooling` が固定されている

## タスク100%実行確認【必須】

- 全実行タスク（8 件）が `completed`
- 全成果物が `outputs/phase-01/` 配下に配置済み
- 苦戦箇所（TOML パーサ自作 / 表記揺れ正規化 / 是正と gate green の順序）が AC または多角的チェックに対応
- artifacts.json の `phases[0].status` が `completed`

## 次 Phase への引き渡し

- 次 Phase: 2 (設計)
- 引き継ぎ事項:
  - 解析対象 3 ソース（wrangler.toml / env.ts / deployment-cloudflare.md）と行番号
  - binding 棚卸し 9 件（applied / 集約 / 突合結果）
  - コメントアウト block = applied:false の捕捉が必須（ライブラリ不採用の根拠）
  - secrets の binding 突合除外ルールと D1 / analytics inventory 突合ルール
  - AC-1〜AC-11 と 4 条件評価（全 PASS）
  - 命名規則（`verify-wrangler-binding-drift.*` / `[verify-wrangler-binding-drift]` ログ接頭辞）
- ブロック条件:
  - 4 条件のいずれかに MAJOR が残る
  - AC-1〜AC-11 が index.md と乖離
