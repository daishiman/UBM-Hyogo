# [#89] [UT-37] apps/web エラーUI実装（トースト・モーダル）

## メタ情報

```yaml
issue_number: 89
title: [UT-37] apps/web エラーUI実装（トースト・モーダル）
state: OPEN
priority: 中
scale: -
category: 要件
status: -
created_date: 2026-04-27
updated_date: 2026-04-27
url: https://github.com/daishiman/UBM-Hyogo/issues/89
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | - |
| ステータス | - |

---

## 概要
UT-10で実装した `errorHandler` / `notFoundHandler` が返す `application/problem+json` レスポンスを `apps/web` 側で受信したとき、ユーザーに適切なエラー通知（トースト / モーダル）を表示するUIを実装する。

## 由来
UT-10 (エラーハンドリング標準化) Phase 11 既知制限 L-5

## 詳細仕様
`docs/30-workflows/unassigned-task/UT-37-web-error-ui-implementation.md`

## 主な完了条件
- エラーレスポンスがトースト or モーダルとして画面表示される
- `UBM-1xxx` 系と `UBM-5xxx` 系で表示スタイルが異なる
- トーストが自動消去または手動閉じられる
- `pnpm build` が通過する（Cloudflare Workers ビルド互換）

## 依存タスク
- 上流: UT-10 (エラーハンドリング標準化) ✅ 完了
- 上流: UT-20 (runtime foundation 実装)
