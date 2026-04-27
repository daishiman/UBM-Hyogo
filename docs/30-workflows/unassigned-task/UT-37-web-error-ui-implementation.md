# UT-37: apps/web エラーUI実装（トースト・モーダル）

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-37 |
| タスク名 | apps/web エラーUI実装（トースト・モーダル） |
| 優先度 | MEDIUM |
| 推奨Wave | Wave 2 |
| 状態 | unassigned |
| 作成日 | 2026-04-27 |
| 既存タスク組み込み | あり |
| 組み込み先 | UT-10 (エラーハンドリング標準化) Phase 11 既知制限 L-5 由来 |

## 目的

`apps/api` の `errorHandler` / `notFoundHandler` が返す `application/problem+json` レスポンスを `apps/web` 側で受信したとき、ユーザーに適切なエラー通知（トースト / モーダル）を表示する UI を実装する。UT-10 では `parseApiResponse` ユーティリティの戻り値型（`Result<T, ApiErrorClientView>`）まで設計済みだが、その戻り値を UI に接続する実装は UT-10 のスコープ外として切り出されている。

## スコープ

### 含む
- `parseApiResponse` の戻り値（`err` side）を画面上のトースト通知またはモーダルダイアログに接続する実装
- エラーコード（`UBM-XXXX`）に応じた表示レベル（info / warning / error）の分岐ロジック
- トースト表示の持続時間・スタック上限・自動消去の実装
- フォーム送信・API 呼び出し・ページ遷移の各フローへの統合
- ユーザーが再操作可能な状態への回復フロー（エラー後の state リセット）

### 含まない
- `parseApiResponse` 本体の実装（UT-10 スコープ完了済み）
- `apps/api` 側のエラーレスポンス形式変更（UT-10 スコープ完了済み）
- i18n 対応（エラーメッセージ多言語化）（将来タスク）
- 認証エラー（401/403）の認証リダイレクトフロー（認証系タスク UT-11 のスコープ）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-10 (エラーハンドリング標準化) | `parseApiResponse`・`ApiErrorClientView` 型・エラーコード体系が完了していること |
| 上流 | UT-20 (runtime foundation 実装) | `apps/web` の Next.js App Router 基盤が整備されていること |
| 関連 | UT-11 (Google OAuth 管理者ログイン) | 認証エラー（401/403）表示の境界を確定するために参照 |

## 苦戦箇所・知見（UT-10 由来）

**`parseApiResponse` の戻り値と UI の接続タイミング**: Server Action / Route Handler / Client fetch の3パターンで `parseApiResponse` を呼ぶ場所が異なる。App Router では Server Action の throw が `error.tsx` にフォールバックするため、クライアントサイドトーストに渡すには `"use client"` 境界内でのハンドリングが必要。Server Component と Client Component で処理経路を分けて設計すること。

**トーストライブラリの選定**: Next.js App Router では `react-hot-toast` や `sonner` などのライブラリが一般的だが、`apps/web` の既存依存関係と RSC/Suspense との相性を確認すること。Cloudflare Workers ランタイムでビルドされるため、Node.js 依存の SSR ライブラリは使用不可。

**エラーコードと表示レベルのマッピング**: `UBM-1xxx`（4xx系）はユーザーに内容を伝えるべき警告、`UBM-5xxx`（5xx系）は「しばらくお待ちください」の汎用エラー表示が適切。コード体系は `packages/shared/src/errors/codes.ts` を参照すること。

**`parseApiResponse` の戻り値接続サンプル**:
```typescript
// apps/web 内での使用例（想定）
const result = await parseApiResponse<MemberData>(response);
if (!result.success) {
  // result.error は ApiErrorClientView 型
  showToast({ level: mapCodeToLevel(result.error.code), message: result.error.detail });
  return;
}
```

## 実行概要

1. `apps/web` に UI 通知コンポーネント（`<Toast>` / `<ErrorModal>`）を実装する
2. `parseApiResponse` の `err` side をトーストに接続するフック（`useApiError`）を設計する
3. フォーム送信・fetch 呼び出しの各フローに統合する
4. エラーコードと表示レベルのマッピング定義を `packages/shared` に追加する
5. Cloudflare Workers ビルドとの互換性を確認する

## 完了条件

- [ ] エラーレスポンスがトースト or モーダルとして画面表示される
- [ ] `UBM-1xxx` 系と `UBM-5xxx` 系で表示スタイルが異なる
- [ ] トーストが自動消去または手動閉じられる
- [ ] エラー後にユーザーが再操作できる状態に戻る
- [ ] `pnpm build` が通過する（Cloudflare Workers ビルド互換）
- [ ] Phase 11 で画面証跡を取得済み（VISUAL タスク）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | packages/shared/src/errors/ | `ApiErrorClientView` 型・エラーコード体系 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-02/api-error-schema.md | エラーレスポンス正本仕様 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-12/implementation-guide.md | UT-10 実装ガイド（Part 2 技術詳細） |
| 参考 | apps/web/ | Next.js App Router 構造の確認 |
| 参考 | .claude/skills/aiworkflow-requirements/references/error-handling.md | エラーハンドリング正本仕様 |
