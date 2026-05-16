# Phase 11 — evidence（NON_VISUAL 縮約テンプレ）

## メタ情報

| 項目 | 内容 |
| --- | --- |
| Workflow | parallel-10-auth-session-handling |
| Phase | 11 |
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
| Phase output | docs/30-workflows/parallel-10-auth-session-handling/outputs/phase-11/ | Phase成果物 |


## evidence canonical path

| ファイル | 取得コマンド |
| --- | --- |
| `outputs/phase-11/evidence/typecheck.txt` | `pnpm typecheck 2>&1 \| tee outputs/phase-11/evidence/typecheck.txt` |
| `outputs/phase-11/evidence/lint.txt` | `pnpm lint 2>&1 \| tee outputs/phase-11/evidence/lint.txt` |
| `outputs/phase-11/evidence/test.txt` | `pnpm --filter @ubm-hyogo/web test 2>&1 \| tee outputs/phase-11/evidence/test.txt` |
| `outputs/phase-11/evidence/build.txt` | `pnpm --filter @ubm-hyogo/web build 2>&1 \| tee outputs/phase-11/evidence/build.txt` |
| `outputs/phase-11/visual-verification-skip.md` | NON_VISUAL 根拠（screenshot 対象画面なし、a11y role は test 経由で証明済み） |

## PASS 条件

- 各 log の最終 exit code が 0。
- test.txt に `useAdminMutation` / `Toast.spec` / `authed.spec` / `login-redirect.spec` 各 spec の PASS 行が含まれる。
- build.txt は Next build が成功する。

## visual-verification-skip.md 記載要件

- 本タスクは toast 出現と redirect 挙動のみ。専用画面追加なし。
- a11y は `role="alert"` / `role="status"` を vitest で観測可能 → screenshot 不要と判定。

## 完了条件

- 上記 5 ファイルが揃い、evidence のうち typecheck/lint/test/build が exit 0。
