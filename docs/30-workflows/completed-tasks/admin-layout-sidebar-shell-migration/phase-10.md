# Phase 10: 最終レビューゲート

## メタ情報

- task_id: `admin-layout-sidebar-shell-migration`
- 実装区分: **実装仕様書**
- 前 Phase: 9（品質保証） / 次 Phase: 11（manual test / visual evidence）→ 13（承認ゲート / PR）
- 重点（phase-template-execution.md Phase 7-10 表）: acceptance criteria と blocker の final review

## 目的

Phase 9 までの validator / quality gate / MINOR 確認の結果を受け、**AC-1〜AC-10 を 1:1 でチェック表化**し、
blocker（MAJOR）の有無を判定する。MINOR / MAJOR の戻り先を曖昧にせず、Phase 11（evidence）→ Phase 13
（承認ゲート / PR）へ進む条件（local green + user 承認待ち）を明示する。
本 Phase は実装・テスト追加を行わない最終レビューゲートである。

## 実行タスク

- タスク1: AC-1〜AC-10 を final review として 1:1 チェック表化（証跡の参照元を明記）
- タスク2: blocker（MAJOR）の有無を判定し、ある場合の戻り先を明示
- タスク3: MINOR（TECH-M-01 / TECH-M-02）の最終状態を確定（解決済み / Phase 11 目視待ち）
- タスク4: Phase 11 / Phase 13 へ進む条件（local green + user 承認待ち）を確定

## 参照資料

- AC 定義: `phase-1.md`（AC-1〜AC-10）
- 設計判断: `phase-2.md`
- レビュー判定 / NO-GO / blocked 条件: `phase-3.md`
- validator / gate 結果: `phase-9.md`
- evidence 計画: `phase-11.md`
- 承認ゲート: `phase-13.md`

## 実行手順

### ステップ1: AC final review（1:1 チェック表）

各 AC を「証跡の参照元（どの Phase / コマンドで確認したか）」とともに 1:1 で判定する。

| AC | 内容（要約） | 証跡の参照元 | 判定 |
| --- | --- | --- | --- |
| AC-1 | layout が `SidebarShellServer` を呼び、`import { AdminSidebar }` を含まない | Phase 5 実装 + `git grep -n "AdminSidebar" "apps/web/app/(admin)/layout.tsx"` = 0 | `[ ]` |
| AC-2 | `git grep -l "components/layout/AdminSidebar"` ヒット 0 | Phase 9 G-1 | `[ ]` |
| AC-3 | 未認証で `/admin` → `/login?next=/admin` | Phase 9 V-3（`layout.spec.tsx` null session ケース） | `[ ]` |
| AC-4 | non-admin で `/admin` → `/login?gate=forbidden`（fail-closed） | Phase 9 V-3（non-admin ケース・親不変条件 #11） | `[ ]` |
| AC-5 | admin session で nav に Public 3 + Members 1 + Admin 9 = 全 13 item 表示 | Phase 9 V-3 + Phase 11 目視（shell 描画） | `[ ]` |
| AC-6 | schemaDiffCount = queued 件数、>0 で warn badge、fetch 失敗で count=0・badge 非表示 | Phase 9 V-3（queued のみ count / fetch 失敗 badge なし） + TECH-M-01 SSOT | `[ ]` |
| AC-7 | admin shell DOM contract（`data-testid="admin-shell"` / `data-theme="cool"` / `data-route-group="admin"` / `data-shell-mode="sidebar"` / `<main data-route="admin">`）維持 | Phase 9 V-3（DOM contract ケース） | `[ ]` |
| AC-8 | `layout.spec.tsx`（書き換え後）全ケース green | Phase 9 V-3 | `[ ]` |
| AC-9 | `typecheck && lint && test --run` green | Phase 9 V-1 / V-2 / V-3 | `[ ]` |
| AC-10 | coverage >=80% / `coverage-guard.sh` exit 0 | Phase 9 V-4 | `[ ]` |

> AC-5 / AC-6（badge）/ TECH-M-02 の active 表示は**コード/テストでの確認に加え Phase 11 で目視**する項目を含む。
> Phase 11 未完の時点では AC-5 の目視欄を「pending（Phase 11）」と明示し、green を主張しない。

### ステップ2: blocker（MAJOR）判定

| 判定軸 | 条件 | 現状 | 戻り先 |
| --- | --- | --- | --- |
| 依存ゲート未充足 | Task A / B / E（mobileTrigger）未完成のまま実装着手 | NO-GO（phase-3） | Phase 5 着手前に差戻し |
| SSOT 二重化 | schemaDiffCount 算出が layout・shell・helper に重複 | MAJOR 該当時 | Phase 8（refactor） |
| AC 未達 | AC-1〜AC-10 のいずれかが fail | MAJOR 該当時 | fail した AC に応じ Phase 5（実装）/ Phase 8（refactor）/ Phase 4（テスト） |
| DOM contract 破壊 | `data-*` 属性 / `<main data-route="admin">` 欠落 | MAJOR 該当時 | Phase 5 |
| 回帰 | 6 ファイル削除で他テストが落ちる | MAJOR 該当時 | Phase 5（削除順序）/ Phase 6（回帰） |

> blocker が 1 件でもある場合は Phase 11 / 13 へ進まない。**戻り先 Phase を本表で確定**してから差戻す。

### ステップ3: MINOR 最終状態

| MINOR ID | 最終状態 | 残作業 |
| --- | --- | --- |
| TECH-M-01 | Phase 8 でケース A/B 確定 → Phase 9 で SSOT 単一を確認済み（**解決**） | なし（PR 本文に解決ケースを記載） |
| TECH-M-02 | Phase 9 でコード方針整合確認済み。active 表示の**目視は Phase 11 へ引き渡し**（pending） | Phase 11 で全 9 admin route の active item ハイライトを目視 |

> MINOR の戻り先を曖昧にしない（phase-template-execution.md Phase 10 注意事項）。
> TECH-M-01 は解決済み、TECH-M-02 は Phase 11 目視待ち、と状態を明示する。

### ステップ4: Phase 11 / Phase 13 進行条件

| 進行先 | 条件 |
| --- | --- |
| Phase 11（evidence） | AC-1〜AC-4 / AC-7〜AC-10 が green（コード/テストで確定可能なもの）。AC-5/AC-6 の目視は Phase 11 で取得 |
| Phase 13（承認ゲート / PR） | (1) local green（typecheck / lint / test / coverage 全 exit 0）、(2) AC 全件 green（Phase 11 目視含む）、(3) blocker 0、(4) **user の明示承認待ち**（CONST_002・phase-3 blocked 条件）。commit / push / PR は user 承認後のみ |

> Phase 13 は user 明示承認がない限り blocked。本 Phase で「local green かつ blocker 0」を確定しても、
> 承認なしに commit / push / PR を実行しない。

## 統合テスト連携

- 本 Phase は新規テストを追加しない。AC final review は Phase 9 の validator / gate 結果を参照する。

## 多角的チェック観点（AIが判断）

- **1:1 対応の網羅**: AC-1〜AC-10 すべてに証跡の参照元が紐付いているか（参照元なしの「OK」を作らない）。
- **目視待ち項目の明示**: AC-5 / AC-6 / TECH-M-02 の目視待ちを green と誤認していないか。
- **戻り先の確定**: blocker / MINOR の戻り先 Phase を曖昧にしていないか。
- **承認ゲートの尊重**: local green を理由に user 承認を飛ばして Phase 13 を実行しようとしていないか（CONST_002）。

## サブタスク管理

- 単一責務。サブタスク分割なし。

## 成果物

- AC-1〜AC-10 final review チェック表（証跡参照元付き）
- blocker（MAJOR）判定表と戻り先
- MINOR 最終状態表（TECH-M-01 解決 / TECH-M-02 Phase 11 目視待ち）
- Phase 11 / Phase 13 進行条件

## 完了条件

- [ ] AC-1〜AC-10 を 1:1 でチェックし、各 AC に証跡参照元を紐付けた
- [ ] blocker（MAJOR）の有無を判定し、ある場合の戻り先を明示した
- [ ] MINOR 2 件の最終状態（解決 / Phase 11 目視待ち）を確定した
- [ ] Phase 11 / Phase 13 へ進む条件（local green + blocker 0 + user 承認待ち）を明示した

## タスク100%実行確認【必須】

- [ ] 上記「完了条件」全項目を満たした
- [ ] MINOR / MAJOR の戻り先を曖昧にしていない
- [ ] user 承認なしに Phase 13（commit / push / PR）へ進まないことを明記した

## 次Phase

Phase 11（manual test / visual evidence）。AC-5 / AC-6 / TECH-M-02 の目視確認と UI evidence セット取得へ進む。
