# Phase 1 — 要件定義

## メタ情報

| 項目 | 内容 |
| --- | --- |
| Workflow | parallel-10-auth-session-handling |
| Phase | 01 |
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
| Phase output | docs/30-workflows/parallel-10-auth-session-handling/outputs/phase-01/ | Phase成果物 |


## 目的

API 401/403 応答に対するフロント挙動の現状を把握し、本サイクルで統一する範囲を確定する。

## 入力

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-10-auth-session-handling/spec.md`
- `apps/web/src/lib/fetch/authed.ts` 既存実装
- `apps/web/src/lib/url/login-redirect.ts` / `safe-redirect.ts` 既存実装
- `apps/web/src/lib/auth.ts` 既存実装
- `apps/web/src/components/ui/Toast.tsx` 既存実装

## 要件

### 機能要件

1. fetchAuthed は 401 で `AuthRequiredError`、その他非2xx で `FetchAuthedError(status, body)` を throw する（既存挙動を維持・検証）。
2. mutation 共通 hook `useAdminMutation` を新規作成し、
   - 401 を catch すると現在 path から `/login?redirect=<encoded>` を生成して redirect する。
   - 403 を catch すると `"権限がありません"` の toast を表示し、`error` state に格納してフォームを残す。
   - その他エラーは `error` state に格納するのみ。
3. Toast は `role="alert"`（destructive variant）と `role="status"`（既定）を出し分けられること。

### 非機能要件

- TypeScript strict 配下で型エラーゼロ。
- `vitest` の unit test 単独実行で外部依存なし。
- a11y: alert role 出力時に `aria-live="assertive"` 相当の挙動を担保（既存 Provider は `aria-live="polite"`、destructive 用は別領域を追加する）。

### 制約

- API surface 変更禁止（CLAUDE.md §UI prototype alignment §不変条件 1）。
- D1 直接アクセス禁止（同 §4）。
- OKLch トークン正本（同 §2）。
- `apps/web` から `process.env.*` の直接参照禁止（既存 `getEnv()` 経路は本 spec で触らない）。

## 実装区分判定（Phase 1 必須）

- taskType: `implementation`（hook 新規 + Toast 拡張のためコード変更必須）
- visualEvidence: `NON_VISUAL`（UI screenshot 専用画面の新設は無く、Toast variant は既存 viewport 内で確認）

## 完了条件

- `outputs/phase-01/requirements.md` を生成し、機能・非機能・制約・実装区分判定を本ファイルと同期して記録すること。
- artifacts.json の Phase 1 を `spec_created` のまま、本仕様書の存在を確認すること。
