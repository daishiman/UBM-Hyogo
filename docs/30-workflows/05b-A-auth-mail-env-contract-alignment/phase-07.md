# Phase 7: AC マトリクス — 05b-A-auth-mail-env-contract-alignment

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 05b-A-auth-mail-env-contract-alignment |
| phase | 7 / 13 |
| wave | 05b-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | NON_VISUAL |

## 目的

index.md の AC-1〜AC-5 を、実装 gate / docs gate / smoke gate / secret hygiene gate の 4 ゲートにマッピングし、各 AC が evidence file 1 つ以上に紐付くことを保証する。

## ゲート定義

| ゲート | 検証内容 | 実施 Phase |
| --- | --- | --- |
| implementation gate | 実装 / 設定 (`wrangler.toml`, `apps/api/src/env.ts`) と env 名の整合 | Phase 5 (runbook), 09a / 09c runtime tasks |
| docs gate | spec docs / aiworkflow refs / runbook の旧名残存 0 件 | Phase 4 (L3 grep), Phase 12 (置換) |
| smoke gate | staging で `secret list` name 確認 + `POST /auth/magic-link` 200 + 受信トレイ到達 | 09a (manual smoke, user 承認後) |
| secret hygiene gate | 全 evidence / docs に env 値・JSON 抜粋・値ハッシュが残らない | Phase 9 (QA), Phase 10 (最終レビュー) |

## AC × ゲート マトリクス

| AC | gate | evidence path | approval |
| --- | --- | --- | --- |
| AC-1: env 名の正本が 1 つに統一される | implementation gate | `outputs/phase-05/main.md`（runbook Step 5 差し替え rg 結果）, `apps/api/src/env.ts` / `apps/api/wrangler.toml` | runbook 内自走可 / runtime smoke は 09a / 09c で user 承認 |
| AC-1: env 名の正本が 1 つに統一される | docs gate | `outputs/phase-04/main.md`（grep 設計）, `outputs/phase-12/main.md`（spec docs 置換結果サマリ） | docs-only 範囲は本タスク内自走可 |
| AC-2: Cloudflare / 1Password / runbook の配置先が一致する | implementation gate | `outputs/phase-02/main.md`（同期マッピング）, `outputs/phase-05/main.md`（runbook Step 1-3） | 1Password Vault 作成は user 承認 |
| AC-2: Cloudflare / 1Password / runbook の配置先が一致する | docs gate | `outputs/phase-02/main.md`（マッピング表）, `outputs/phase-12/main.md`（08-free-database.md 更新サマリ） | docs-only 自走可 |
| AC-3: production で未設定時 fail-closed の仕様が明記される | implementation gate | `outputs/phase-02/main.md`（fail-closed 仕様）, `outputs/phase-06/main.md`（E-1 詳細仕様） | 自走可（仕様化のみ） |
| AC-3: production で未設定時 fail-closed の仕様が明記される | smoke gate | `outputs/phase-11/main.md`（readiness template）+ 09c runtime evidence | user 承認後 09c |
| AC-4: staging smoke で Magic Link メール送信設定を確認できる | smoke gate | `outputs/phase-11/main.md`（readiness template）+ 09a `secret list` name 一覧 / `POST /auth/magic-link` 200 / 受信 timestamp | user 承認後 09a |
| AC-4: staging smoke で Magic Link メール送信設定を確認できる | docs gate | `outputs/phase-02/main.md`（smoke AC 更新内容）, `outputs/phase-04/main.md`（L4 境界） | 自走可 |
| AC-5: secret 実値が repo / evidence に残らない | secret hygiene gate | `outputs/phase-09/main.md`（QA 時 grep 結果）, `outputs/phase-10/main.md`（最終レビュー） | 自走可 |
| AC-5: secret 実値が repo / evidence に残らない | docs gate | `outputs/phase-04/main.md`（fixture ルール）, `outputs/phase-05/main.md`（投入時の禁止事項） | 自走可 |

## 各 AC の evidence カバレッジ確認

| AC | 該当ゲート数 | evidence file 数 | カバレッジ判定 |
| --- | --- | --- | --- |
| AC-1 | 2 (impl + docs) | 4 | OK |
| AC-2 | 2 (impl + docs) | 4 | OK |
| AC-3 | 2 (impl + smoke) | 3 | OK |
| AC-4 | 2 (smoke + docs) | 3 | OK |
| AC-5 | 2 (hygiene + docs) | 4 | OK |

全 AC が 2 ゲート以上 / evidence file 3 件以上に紐付き、単一経路の見落としで PASS 判定が出ない構造になっている。

## evidence path 一覧（成果物 cross-reference）

| Phase output | 主に保証する AC | 主要内容 |
| --- | --- | --- |
| `outputs/phase-01/main.md` | AC-1〜AC-5 (要件) | 真因 / Scope / approval gate / AC ↔ evidence 対応表 |
| `outputs/phase-02/main.md` | AC-1, AC-2, AC-3, AC-4 | 採用 env 名 / 同期マッピング / fail-closed 仕様 / smoke AC 更新 |
| `outputs/phase-03/main.md` | AC-1〜AC-5 (レビュー) | 3 系統 / 4 条件 / 不変条件整合 / ブロック解消 |
| `outputs/phase-04/main.md` | AC-1, AC-3, AC-4, AC-5 | L1-L5 テスト境界 / fixture ルール / doc grep 設計 |
| `outputs/phase-05/main.md` | AC-1, AC-2, AC-5 | Step 1-7 runbook / approval gate / CLI ラッパー |
| `outputs/phase-06/main.md` | AC-3, AC-5 | 異常系 E-1〜E-10 / fail-closed 詳細 / drift 検出 |
| `outputs/phase-07/main.md` | AC-1〜AC-5 (本マトリクス) | AC × ゲート対応表 |
| `outputs/phase-09/main.md` | AC-1, AC-5 | QA 実行ログ（grep / drift check） |
| `outputs/phase-10/main.md` | AC-5 | 最終レビュー（secret hygiene 確認） |
| `outputs/phase-11/main.md` | AC-3, AC-4 | 手動 smoke evidence（state + timestamp のみ） |
| `outputs/phase-12/main.md` | AC-1, AC-2, AC-4 | spec docs 置換結果 / aiworkflow refs cross-reference |

## approval gate 集約

| 操作 | 承認単位 | 担当 Phase |
| --- | --- | --- |
| 1Password Vault item 作成 / `op read` | 都度 user 承認 | Phase 5 / 11 |
| `bash scripts/cf.sh secret put` | 都度 user 承認 | Phase 5 (実装委譲) / 11 |
| `bash scripts/cf.sh deploy` | 都度 user 承認 | 09a / 09c (本タスク外) |
| Magic Link 実送信 smoke | 都度 user 承認 | 09a / 09c |
| 旧名 (`RESEND_*`) の新規投入 | 禁止 | 全 Phase |
| commit / push / PR | 本タスクでは行わない | (別タスク) |

## ゲート fail 時の扱い

| ゲート | fail 時の対応 |
| --- | --- |
| implementation gate | 実装委譲先タスクの修正で再 PASS。本タスクは仕様 / runbook 側に不足があれば追記 |
| docs gate | Phase 12 の Edit で再置換。grep 結果が hit する限り Phase 12 完了としない |
| smoke gate | Phase 5 runbook の rollback 経路に従って再投入 → smoke 再実行（user 承認） |
| secret hygiene gate | evidence ファイルから該当箇所を即時除去。git history に残った場合は git filter-repo 検討（user 承認、別タスク） |

## 実行タスク

1. 参照資料と該当ソースを確認する。完了条件: AC × ゲート対応表が確定する。
2. 本タスク固有の scope / AC / evidence を確認する。完了条件: AC-1〜AC-5 すべてが evidence file 1 つ以上に紐付く。
3. user approval または上流 gate が必要な操作を分離する。完了条件: approval gate 集約表が確定する。
4. ゲート fail 時の対応を記述する。完了条件: 4 ゲートすべてに fail 経路が明記される。

## 参照資料

- docs/30-workflows/05b-A-auth-mail-env-contract-alignment/index.md（AC 5 項目の正本）
- docs/30-workflows/05b-A-auth-mail-env-contract-alignment/phase-01.md（AC ↔ evidence 初期マッピング）
- docs/30-workflows/05b-A-auth-mail-env-contract-alignment/phase-02.md（採用 env 名 / 同期マッピング / fail-closed）
- docs/30-workflows/05b-A-auth-mail-env-contract-alignment/phase-04.md（L1-L5 テスト境界）
- docs/30-workflows/05b-A-auth-mail-env-contract-alignment/phase-05.md（Step 1-7 runbook）
- docs/30-workflows/05b-A-auth-mail-env-contract-alignment/phase-06.md（異常系 E-1〜E-10）

## 実行手順

- 対象 directory: `docs/30-workflows/05b-A-auth-mail-env-contract-alignment/`
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の readiness runbook と 09a / 09c の runtime evidence path に従う。

## 統合テスト連携

- 上流: 05b Magic Link provider 本体, 10-notification-auth.md, environment-variables.md, deployment-secrets-management.md
- 下流: 05b-B Magic Link callback follow-up, 09a staging auth smoke, 09c production deploy readiness

## 多角的チェック観点

- #16 secret values never documented: マトリクス記述に env 名・evidence path のみ。値・JSON 抜粋なし
- #15 Auth session boundary: AC マトリクスは Magic Link send 経路に閉じる
- #14 Cloudflare free-tier: smoke gate は 1 通のみで Resend 課金を抑制
- 未実装 / 未実測を PASS と扱わない: docs gate のみで AC-4 smoke の PASS 判定を出さない構造
- プロトタイプと仕様書の採用 / 不採用を混同しない: マトリクスに GAS prototype 経由の evidence を含めない

## サブタスク管理

- [ ] refs を確認する
- [ ] AC × ゲート対応表を確定する
- [ ] AC ごとの evidence カバレッジを確認する
- [ ] approval gate 集約表を確定する
- [ ] ゲート fail 時の対応を明記する
- [ ] outputs/phase-07/main.md を作成する

## 成果物

- outputs/phase-07/main.md（AC × ゲート対応表 / evidence カバレッジ / approval gate 集約 / ゲート fail 対応）

## 完了条件

- env 名の正本が1つに統一される（AC-1: implementation + docs gate）
- Cloudflare/1Password/runbook の配置先が一致する（AC-2: implementation + docs gate）
- production で未設定時 fail-closed の仕様が明記される（AC-3: implementation + smoke gate）
- staging smoke で Magic Link メール送信設定を確認できる（AC-4: smoke + docs gate）
- secret 実値が repo/evidence に残らない（AC-5: secret hygiene + docs gate）

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない
- [ ] secret 実値を記録していない（env 名と op:// 参照のみ）

## 次 Phase への引き渡し

Phase 8（DRY 化）へ次を渡す:

- AC × ゲート対応表（evidence file の重複・欠落を DRY 化観点で確認するベース）
- evidence path 一覧（Phase output cross-reference 表）
- approval gate 集約（重複記述があれば DRY 化対象）
- ゲート fail 時の対応経路
