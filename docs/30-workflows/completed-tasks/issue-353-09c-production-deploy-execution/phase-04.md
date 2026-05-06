[実装区分: 実装仕様書（runbook execution + evidence collection）]

# Phase 4: テスト戦略 — issue-353-09c-production-deploy-execution

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-353-09c-production-deploy-execution |
| phase | 4 / 13 |
| wave | 9c-fu |
| mode | serial |
| 作成日 | 2026-05-05 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |

## 目的

production deploy 前後の検証を 5 層に分離した検証マトリクスを確定する。各 AC（AC-1〜AC-5）を `outputs/phase-11/` の evidence ファイルに 1:N で対応付け、層・コマンド・期待結果・skip 条件を明示する。本 Phase は spec 作成のみ。実テスト・実 deploy は本タスクのスコープ外（Phase 5 runbook を別 operation で実行）。

## 実行タスク

1. 検証マトリクスを 5 層（pre-deploy / D1 mutation / deploy execution / post-deploy smoke / 24h verification）に分割し、各層の責務とテストレベルを定義する。完了条件: 5 層 × 各 3〜5 ケースが揃う。
2. AC × evidence ファイル mapping を確定する。完了条件: AC 5 件すべてが `outputs/phase-11/` 配下の path に紐付く。
3. VISUAL evidence の対象範囲を画面別に明示する。完了条件: 取得対象画面・取得手順・保存先が決まる。
4. skip 可能なテストと skip 条件を列挙する。完了条件: skip ルールが明示される。
5. 09a staging smoke / 09b observability との依存関係と差分を記録する。完了条件: 上流前提と本タスクの追加検証が分離される。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/issue-353-09c-production-deploy-execution/outputs/phase-01/main.md | AC × evidence path mapping |
| 必須 | docs/30-workflows/issue-353-09c-production-deploy-execution/outputs/phase-02/main.md | state machine / 17 step 依存 matrix |
| 必須 | docs/30-workflows/issue-353-09c-production-deploy-execution/outputs/phase-03/main.md | 採用方針・GO/NO-GO・改善点 |
| 必須 | docs/00-getting-started-manual/specs/15-infrastructure-runbook.md | D1 / Worker / rollback 基準 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md | apps/web 正規 deploy 経路 |
| 参考 | docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-04.md | docs-only 完了済み 09c の verify suite 構造 |
| 参考 | docs/30-workflows/02-application-implementation/09a-*/outputs/phase-11/ | staging smoke の green evidence 形式 |

依存 Phase: Phase 1 / Phase 2 / Phase 3。

## 実行手順

### ステップ 1: 5 層検証マトリクスの作成

5 層は次の責務で分離する。詳細は `outputs/phase-04/main.md` の Verify suite セクションに記述する。

| 層 | 責務 | テストレベル |
| --- | --- | --- |
| L1 pre-deploy | 上流 green / identity / D1 backup / migration list | contract（read-only） |
| L2 D1 mutation | migration apply の前後比較 | integration |
| L3 deploy execution | api/web build + deploy が exit 0 | smoke（exit code） |
| L4 post-deploy smoke | public/member/admin role × 10 ルート + manual sync + invariant | e2e + manual smoke |
| L5 24h verification | metrics / sync_jobs / 不変条件 #14 | observability gating |

### ステップ 2: AC × evidence path mapping

`outputs/phase-04/main.md` の AC マトリクスに、AC-1〜AC-5 と evidence ファイルを 1:N で対応付ける。

### ステップ 3: VISUAL evidence の対象範囲確定

`smoke-screenshots/` と `24h-metrics-screenshots/` のサブディレクトリ配置と、撮影対象画面（public home / members 一覧 / member detail / login / profile / admin dashboard / admin members / admin schema / admin meetings / admin tags の計 10 画面 + 24h metrics 3 画面）を `outputs/phase-04/main.md` に列挙する。

### ステップ 4: skip ルールの整理

| skip 対象 | 条件 | 理由 |
| --- | --- | --- |
| L4 manual sync (`POST /admin/sync/*`) | admin role の session cookie が取得不能 | cookie 取得は別運用、smoke 自体は curl で 302 を確認することで代替 |
| L5 24h verification | 24h 経過していない時点 | 時間ベース検証のため、別タイミングで evidence を集約 |
| screenshot 取得 | CLI のみで実行する場合 | 手動ブラウザ確認に切替、撮影日時のみ記録 |

skip 時は `outputs/phase-11/manual-smoke-log.md` に skip 理由・代替経路・再実行予定を必ず記録する。silent skip は禁止（false green 防止）。

### ステップ 5: 09a / 09b との関係定義

- 09a-A staging smoke の evidence path（`docs/30-workflows/09a-*/outputs/phase-11/`）を本タスクの前提として citation する（`outputs/phase-11/upstream-green-evidence.md`）。
- 09b-A observability runtime smoke で疎通済みの Sentry / Slack 通知が production binding でも生きていることは Phase 5 Step 7（post-deploy healthcheck）で再確認する（09b-B 連携）。
- 本タスクが追加で検証する項目は、production-only な authz boundary（admin/member 切替）、`apps/web` bundle に D1 import がないこと（不変条件 #6）、24h Cloudflare free-tier metrics の 3 点。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | verify suite を runbook の各 Step に紐付ける |
| Phase 7 | AC matrix の base として再利用する |
| Phase 11 | manual evidence で 5 層を実行する |
| 上流 09a-A | staging smoke の green evidence を citation する |
| 上流 09b-A | runtime observability の疎通 evidence を依存条件として確認する |
| 上流 09b-B | post-deploy healthcheck の silent failure 検知 mechanism を Step 7 で接続する |

## 多角的チェック観点

- #5 public/member/admin boundary: L4 で role 別 smoke を 200/302/403 で検証
- #6 apps/web から D1 直接 access 禁止: L4 で `apps/web` build artifact の bundle inspection
- #14 Cloudflare free-tier: L5 で 24h metrics threshold 比較
- 未実装 / 未実測を PASS と扱わない（PENDING_RUNTIME_EVIDENCE を残す）
- placeholder と実測 evidence を分離する（実値が入る前は `<runtime-fill>` を明示）
- secret 値を evidence に転記しない（log mask 必須）

## サブタスク管理

- [ ] 5 層検証マトリクスを `outputs/phase-04/main.md` に記述
- [ ] AC × evidence path mapping を確定
- [ ] VISUAL evidence の対象画面を 10 + 3 件で列挙
- [ ] skip ルールを 3 件以上明示
- [ ] 上流 09a / 09b との依存関係を記述

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | 5 層 verify suite + AC matrix + VISUAL inventory + skip ルール |

## 完了条件

- [ ] 5 層 × 3〜5 ケース = 15〜25 ケースが定義される
- [ ] AC 5 件すべてが evidence path に対応
- [ ] VISUAL 対象 10（smoke）+ 3（24h）画面が列挙される
- [ ] skip ルールに silent skip 防止策が含まれる
- [ ] `bash scripts/cf.sh` 以外の Cloudflare CLI が登場しない（wrangler 直接実行禁止）

## タスク100%実行確認

- [ ] 全実行タスクが completed
- [ ] outputs/phase-04/main.md が完成
- [ ] 未対応 AC が 0 件
- [ ] テスト戦略の各層が Phase 5 runbook の Step に 1:1 以上で紐付く

## 次 Phase への引き渡し

- 5 層 verify suite と AC × evidence mapping を Phase 5 へ
- VISUAL inventory（10 + 3 画面）を Phase 5 / Phase 11 へ
- skip ルールを Phase 6（異常系）と Phase 11（実測）へ
- 上流前提（09a / 09b）の citation 形式を Phase 11 へ
