# [#82] [UT-11-SEC-01] Auth.js vs 生 OAuth ADR 決定

## メタ情報

```yaml
issue_number: 82
title: [UT-11-SEC-01] Auth.js vs 生 OAuth ADR 決定
state: OPEN
priority: 中
scale: -
category: 要件
status: -
created_date: 2026-04-27
updated_date: 2026-04-27
url: https://github.com/daishiman/UBM-Hyogo/issues/82
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | - |
| ステータス | - |

---

## 概要

UT-11 は生 OAuth + PKCE + JWT Cookie で admin ログインを実装したが、既存の `security-principles.md` は Auth.js を推奨として言及している。この矛盾を ADR として解消し、「admin MVP は生 OAuth 例外」「一般ユーザー認証は Auth.js」等の方針を公式決定する。

## 背景

- UT-11 は「Auth.js 系導入はスコープ外」として生 OAuth で完了
- 既存仕様書に Auth.js 推奨の記述が残っている
- 次の認証タスク（一般ユーザーログイン等）前に ADR が必要

## スコープ

- 既存仕様書の Auth.js 言及箇所の特定
- ADR 記述（採用決定・不採用理由・将来方針）
- `security-principles.md` / アーキテクチャ文書の更新
- UT-03（Sheets API）との責務境界明確化

## 参照

- 仕様書: `docs/30-workflows/unassigned-task/UT-11-SEC-01-authjs-raw-oauth-adr.md`
