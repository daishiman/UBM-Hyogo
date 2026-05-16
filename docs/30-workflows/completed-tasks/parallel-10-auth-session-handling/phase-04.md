# Phase 4 — タスク分解

## メタ情報

| 項目 | 内容 |
| --- | --- |
| Workflow | parallel-10-auth-session-handling |
| Phase | 04 |
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
| Phase output | docs/30-workflows/parallel-10-auth-session-handling/outputs/phase-04/ | Phase成果物 |


## 単一責務分解

| ID | タスク | 種別 | 並列可 | 依存 |
| --- | --- | --- | --- | --- |
| T-01 | `fetchAuthed` 既存挙動を unit test で網羅（status 200/401/403/500/network） | test | ◯ | — |
| T-02 | `normalizeRedirectPath` / `toLoginRedirect` の test 補強（5 ケース、`/login` loop 防止含む） | test | ◯ | — |
| T-03 | `Toast.tsx` に variant 追加（後方互換維持） | code | ◯ | — |
| T-04 | `Toast.spec.tsx` に variant=alert / status の描画 test を追加 | test | × | T-03 |
| T-05 | `apps/web/src/features/admin/hooks/useAdminMutation.ts` を親仕様準拠で実装/拡張 | code | × | T-03, parallel-08 |
| T-06 | `useAdminMutation.spec.tsx` 新規（DI 注入で 401/403/その他 を網羅） | test | × | T-05 |
| T-07 | `features/admin/hooks/index.ts` re-export 追加 | code | × | T-05 |
| T-08 | `auth.ts` の session callback / JWT TTL 読み取り、policy doc 生成 | docs | ◯ | — |
| T-09 | Phase 11 evidence（lint / typecheck / vitest / build）取得 | verify | 最終 | T-01..T-07 |
| T-10 | Phase 12 必須 7 ファイル同期 | docs | 最終 | T-09 |

## クリティカルパス

T-03 → T-05 → T-06 → T-09 → T-10

## 成果物

- `outputs/phase-04/task-breakdown.md`（上表）
- `outputs/phase-04/critical-path.md`

## 完了条件

- 全タスクが単一責務に分解されていること。
- 並列可能 task が並列マークされていること（T-01/T-02/T-03/T-08 は並列実行可）。
