# System Spec Update Summary — サイドバー表示条件の正本化

## 判定サマリ

本件は **route topology / middleware / shell コンポーネントへのコード変更を伴う実装仕様書**であり、
正本仕様 09h §1.6 の route → shell マトリクスへ **`(auth)` route group（`/login` = bare）を明示する Step 2 該当**である。
加えてレビューで、09h §1.2 の admin nav 契約が実装（`buildAdminGroup`）より古い 13 item 表記のまま残っている drift を検出したため、
admin 合計 14 item / admin 専用 10 item / `Form回答` 外部リンク / `出席分析` route を実装に同期した。

現行 `docs/00-getting-started-manual/specs/09h-shell-and-fixtures.md` §1.6 は login を「（shell 外）/ bare / —」と記載するが、
**route group 名（`(auth)`）が明示されておらず**、表示条件の単一所有者が route group であることがマトリクス上で可読化されていない。
本件はこれを明示し、実装（`(auth)/layout.tsx` 新設 + login 移動）と正本仕様を一致させる（spec drift 解消 + マトリクス明示）。

09h §1.6 への実反映（マトリクス行の `(auth)` 明示）と、09h §1.2 の admin nav item 数・route 契約の補正は、
本サイクルで実コード変更と同一ターンに完了した。

## Step 1-A 〜 1-C（system spec 同期の前段）

| Step | 内容 | 本タスクでの結果 |
| --- | --- | --- |
| 1-A 完了記録 | 仕様書 / LOGS / 必要 skill 更新を同一ターンで反映 | `implemented_local_evidence_captured` を記録。Phase 1-13 仕様、実コード、direct focused tests、typecheck、lint、local screenshot 4 PNG 完了。staging/admin screenshot は user-gated |
| 1-B 実装状況テーブル | `completed` / `implemented_local_evidence_captured` の判断 | `workflow_state: implemented_local_evidence_captured`。Phase 1-13 + strict 7 + local deterministic evidence 完備 |
| 1-C 関連タスクテーブル | 参照 grep + 関連台帳再同期 | 親系譜 `task-c-public-member-sidebar-shell-integration`（統合シェル）/ `unified-sidebar-shell-task-e-mobile-drawer-responsive`（mobile drawer）/ `issue-1024`（collapse cookie）は dev マージ済み。本件はその差分修正として記録 |

## Step 2（interface 追加 / 仕様マトリクス更新）

**該当あり**。本件は 09h §1.6 マトリクスへ次の明示更新を行った:

| Step 2 サブ項目 | 更新内容 |
| --- | --- |
| 2-A マトリクス行の `(auth)` 明示 | §1.6 の「（shell 外）/ `/login` / bare / —」行を `(auth)` / `/login` / bare / — に正規化し、route group 列で `(auth)` を単一所有者として可読化 |
| 2-B 表示条件マトリクス全体 | `(auth)`=shell 無し / `(public)`/`(member)`/`(admin)`=shell 有り を Phase 2 §1.4 の確定マトリクスとして §1.6 へ反映 |
| 2-C 関数 public interface | `AuthLayout`（Next.js default export）は外部消費される public interface ではないため interface 台帳追記は不要。`SidebarUserMenu` / `SidebarNavItem` / `middleware` のシグネチャは既存（変更は内部分岐 / header 追加のみ）で新規 public interface なし |
| 2-D admin nav 契約同期 | §1.2 を `buildNavForRole("admin")` の実体に合わせ、admin 合計 14 item / admin 専用 10 item、`Form回答` 外部リンク、`出席分析`=`/admin/dashboard/attendance`、`開催日`=`/admin/meetings` へ補正 |

> 新規 public interface（新 export 関数 / 新 type）は追加しない。Step 2 該当の実体は「**仕様マトリクスへの `(auth)` 明示**」である。

## 09h-shell-and-fixtures.md 更新判定

| 対象 | 内容 | 反映タイミング |
| --- | --- | --- |
| §1.6 route → shell マトリクス | login 行を `(auth)` route group として明示。表示条件の単一所有者を route group と可読化 | completed |
| §1.2 role/nav/user-menu 表 | viewer の「ゲスト / 未ログイン」表記と CTA 強調を記述（新規 role なし）。admin nav の item 数・route・外部リンク契約を `shell-config.ts` と同期 | completed |

## global skill sync（aiworkflow-requirements）

| 対象 | 本サイクルでの扱い |
| --- | --- |
| references/task-workflow-active.md | 本 workflow を `implemented_local_evidence_captured / implementation / VISUAL` として登録（pixel/runtime visual は user-gated） |
| artifact inventory | 本 workflow の artifact inventory を同 wave で登録 |
| indexes（resource-map / quick-reference） | lookup 行を追加。`topic-map` / `keywords` は generator 管轄のため手編集なし（`pnpm indexes:rebuild` 委譲） |
| lessons-learned | route topology drift 解消 / two-tier evidence 境界の知見を lessons へ昇格（skill-feedback-report 参照） |
| task-specification-creator feedback | implementation / VISUAL の local deterministic evidence と pixel screenshot user-gate 分離を `skill-feedback-report.md` に記録 |
