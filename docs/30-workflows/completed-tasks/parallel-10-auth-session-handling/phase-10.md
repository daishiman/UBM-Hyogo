# Phase 10 — リファクタ

## メタ情報

| 項目 | 内容 |
| --- | --- |
| Workflow | parallel-10-auth-session-handling |
| Phase | 10 |
| Status | spec_created |

## 目的

この Phase の目的は、下記の詳細仕様に従って `parallel-10-auth-session-handling` を spec_created から実装可能な状態へ進めることである。

## 実行タスク

- [ ] 下記の Phase 固有手順を実行する。
- [ ] 成果物と evidence path を確認する。

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| workflow index | docs/30-workflows/parallel-10-auth-session-handling/index.md | 全体仕様 |
| artifacts | docs/30-workflows/parallel-10-auth-session-handling/artifacts.json | 状態台帳 |

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| Phase output | docs/30-workflows/parallel-10-auth-session-handling/outputs/phase-10/ | Phase成果物 |


## 観点

1. `useAdminMutation` 内の catch 分岐を named helper（`handleAuthRequired` / `handleForbidden` / `handleGeneric`）に切り出し、test 可読性を確保するかを判定する。
2. `Toast` の 2 領域分割を `<ToastList variant>` 子 component に抽出するかを判定する。本サイクル内で複雑度が低いままならスキップ。
3. `defaultRedirector` / `defaultCurrentPath` の module スコープ化（hook 再レンダリングで関数 identity が変わらないように）。

## 判定

- 1: 採用（test 可読性が上がるため）。
- 2: スキップ（行数増・利得低）。
- 3: 採用（必須・参照透過性向上）。

## 成果物

- `outputs/phase-10/refactor-summary.md`（採用 / スキップ / 根拠 の 3 列表）

## 完了条件

- 採用判定の refactor がコード反映済みで lint/test 全 PASS。
