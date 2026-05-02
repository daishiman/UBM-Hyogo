# Output Phase 7: AC マトリクス

## ゲート定義

| ゲート | 検証 | Phase |
| --- | --- | --- |
| implementation gate | 実装 / 設定と env 名整合 | Phase 5 / 別タスク |
| docs gate | spec / aiworkflow / runbook 旧名残存 0 件 | Phase 4 L3 / Phase 12 |
| smoke gate | staging で name 確認 + 200 + 受信 | 09a（user 承認後）。Phase 11 は readiness template のみ |
| secret hygiene gate | evidence / docs に値・JSON 抜粋・hash なし | Phase 9 / Phase 10 |

## AC × ゲート マトリクス

| AC | gate | evidence | approval |
| --- | --- | --- | --- |
| AC-1: env 名統一 | implementation | `outputs/phase-05/main.md` / `apps/api/src/env.ts` / `apps/api/wrangler.toml` | runbook 自走可、runtime smoke は 09a / 09c |
| AC-1 | docs | `outputs/phase-04/main.md` / `outputs/phase-12/main.md` | 自走可 |
| AC-2: 配置先一致 | implementation | `outputs/phase-02/main.md` / `outputs/phase-05/main.md` | 1Password 作成は user 承認 |
| AC-2 | docs | `outputs/phase-02/main.md` / `outputs/phase-12/main.md` | 自走可 |
| AC-3: fail-closed | implementation | `outputs/phase-02/main.md` / `outputs/phase-06/main.md` | 自走可 |
| AC-3 | smoke | `outputs/phase-11/main.md` | user 承認後 |
| AC-4: staging smoke | smoke | `outputs/phase-11/main.md` | user 承認後 |
| AC-4 | docs | `outputs/phase-02/main.md` / `outputs/phase-04/main.md` | 自走可 |
| AC-5: secret 値非記録 | hygiene | `outputs/phase-09/main.md` / `outputs/phase-10/main.md` | 自走可 |
| AC-5 | docs | `outputs/phase-04/main.md` / `outputs/phase-05/main.md` | 自走可 |

## カバレッジ

| AC | ゲート数 | evidence file | 判定 |
| --- | --- | --- | --- |
| AC-1 | 2 | 4 | OK |
| AC-2 | 2 | 4 | OK |
| AC-3 | 2 | 3 | OK |
| AC-4 | 2 | 3 | OK |
| AC-5 | 2 | 4 | OK |

全 AC が 2 ゲート以上 / evidence 3 件以上に紐付き、単一経路で PASS が出ない構造。

## evidence path 一覧

| Phase output | 主に保証 | 主要内容 |
| --- | --- | --- |
| phase-01/main.md | AC-1〜5 | 真因 / Scope / approval gate / AC ↔ evidence |
| phase-02/main.md | AC-1, 2, 3, 4 | 採用 env 名 / 同期マッピング / fail-closed / smoke AC 更新 |
| phase-03/main.md | AC-1〜5 | 3 系統 / 4 条件 / 不変条件整合 |
| phase-04/main.md | AC-1, 3, 4, 5 | L1-L5 / fixture / doc grep |
| phase-05/main.md | AC-1, 2, 5 | Step 1-7 runbook / approval gate / CLI |
| phase-06/main.md | AC-3, 5 | E-1〜E-10 / fail-closed 詳細 / drift |
| phase-09/main.md | AC-1, 5 | grep / parity / typecheck 対象外 |
| phase-10/main.md | AC-5 | 最終レビュー（hygiene） |
| phase-11/main.md | AC-3, 4 | smoke evidence (state + timestamp のみ) |
| phase-12/main.md | AC-1, 2, 4 | spec docs 置換結果 / cross-reference |

## approval gate 集約

| 操作 | 承認 | 担当 Phase |
| --- | --- | --- |
| 1Password Vault item 作成 / `op read` | user | Phase 5 / 11 |
| `bash scripts/cf.sh secret put` | user | Phase 5 / 11 |
| `bash scripts/cf.sh deploy` | user | 09a / 09c |
| Magic Link 実送信 smoke | user | 09a / 09c |
| 旧名 (`RESEND_*`) 新規投入 | 禁止 | 全 Phase |
| commit / push / PR | 本タスク外 | 別タスク |

## ゲート fail 時の対応

| ゲート | 対応 |
| --- | --- |
| implementation | 実装委譲先タスクで再 PASS。仕様 / runbook 不足は本タスクで追記 |
| docs | Phase 12 Edit で再置換。grep hit 中は Phase 12 完了としない |
| smoke | Phase 5 rollback → smoke 再実行（user 承認） |
| hygiene | evidence ファイルから即時除去。git history 残存時は filter-repo 検討（user 承認、別タスク） |

## 次 Phase への引き渡し

- AC × ゲート対応表
- evidence path cross-reference
- approval gate 集約（重複検知の DRY 化対象）
- ゲート fail 経路
