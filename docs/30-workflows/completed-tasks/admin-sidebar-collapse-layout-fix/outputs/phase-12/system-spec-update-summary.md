# システム仕様更新サマリ — admin-sidebar-collapse-layout-fix

workflow_state: `implemented_local_evidence_captured` / taskType: `implementation` / visualEvidence: `VISUAL`

本タスクは `apps/web` の sidebar shell コンポーネント群の collapsed/expanded レイアウト是正（Tailwind className 分岐）に閉じる
実装仕様書である。Step 1（ドキュメント反映）を完了記録し、Step 2（システム仕様更新）は N/A と判定する。

## Step 1: ドキュメント反映（完了記録）

| Step | 内容 | 状況 |
| --- | --- | --- |
| Step 1-A | 完了タスク記録: 本 spec の Phase 1-13 成果物を workflow root（`index.md` / `phase-12-documentation.md` / `_shared-context.md`）に集約。`implemented_local_evidence_captured` の active workflow として aiworkflow-requirements の workflow inventory / quick-reference / resource-map / task-workflow-active / changelog へ同 wave 同期 | done |
| Step 1-B | 実装状況テーブル: `index.md` / `artifacts.json.metadata.workflow_state` を `implemented_local_evidence_captured` で記録（実装・focused vitest・local screenshot 取得済み、staging visual / PR は user-gated） | done |
| Step 1-C | 関連タスクテーブル: current 未タスク 0 件（1 サイクル完結）。OOS-1（tooltip overflow clip）を baseline として current facts に記録。`unassigned-task-detection.md` に current / baseline 分離で記録 | done |
| Step 1-H | `skill-feedback-report.md` の各 item を no-op（観察）として routing。promotion 対象なし（理由は skill-feedback-report.md 参照） | done |

> ドメイン仕様（API response shape / D1 schema / shared 型）は変更しないため Step 2 は N/A。ただし active workflow の
> 正本同期は必要なため、aiworkflow-requirements の workflow inventory / quick-reference / resource-map / task-workflow-active / changelog へ追記する。

## Step 2（条件付き）: 新規インターフェース追加時のみ

**判定: N/A**

理由:

- 本タスクは `apps/web` の sidebar shell コンポーネントの Tailwind className 分岐（`px-3` 除去・`w-full justify-center px-0` 中央化・
  40px 角枠中央配置・`SidebarBrand` の collapsed 分岐新設）のみ。TypeScript インターフェース / API endpoint / IPC 契約 / shared package 型の
  **新規追加なし**。
- 新規 export される識別子・定数・型は **0 件**。コンポーネント props（`SidebarNavItemProps` / `SidebarUserMenuProps` / `SidebarBrandProps` /
  `SidebarShellProps`）のシグネチャは不変であり、`collapsed: boolean` 等の既存 prop をそのまま使う。data 属性（`data-shell-block` / `data-collapsed` /
  `data-active`）も既存のまま追加・変更しない。
- 色トークン（`var(--ubm-color-*)` / `var(--shell-bar-w*)`）は既存のものを参照するのみで新規定義しない。`tokens.css` / `globals.css` の
  CSS 変数は不変。
- API / D1 migration / Google Form schema / endpoint surface / fetch URL は無変更（不変条件 #1 #5、AC-8）。

> Step 2 を N/A 判定の根拠付きで明記しておくことで、`phase-12-pitfalls.md`「Step 2 必要性判定の記録漏れ」を回避する。
> `pending same-wave sync` は残さない（横断正本の更新対象がそもそも発生しないため）。

## artifacts parity

`outputs/artifacts.json` が root `artifacts.json` の mirror として存在する場合は、root / outputs の両方を parity check 対象とする。
本 wave の gates 状態（Gate-A=passed / Gate-B=passed / Gate-C=pending）と workflow_state（`implemented_local_evidence_captured`）を両者で同期する。
