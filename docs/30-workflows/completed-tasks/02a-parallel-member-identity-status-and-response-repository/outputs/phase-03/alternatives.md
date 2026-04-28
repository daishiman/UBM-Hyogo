# 代替案検討

## 代替案 A: D1Database 型を直接使用

### 概要
`@cloudflare/workers-types` の `D1Database` をリポジトリ関数の引数型として直接使用する。

### メリット
- Cloudflare 公式型との完全互換
- 追加の interface 定義が不要

### デメリット
- テストコードで `D1Database` 型が解決できない（jsdom 環境）
- テストを書くために `as unknown as D1Database` のような unsafe cast が必要
- 型安全性が低下する

### 採用理由
**不採用**。テスタビリティを優先し、独自 interface を使う設計を採用。

---

## 代替案 B: Drizzle ORM の使用

### 概要
Cloudflare D1 対応の ORM として Drizzle ORM を使用する。

### メリット
- スキーマからの型自動生成
- マイグレーション管理が容易

### デメリット
- 依存パッケージが増える
- D1 スキーマは既に migrations/ で管理されており二重管理になる
- バンドルサイズが増加（Cloudflare Workers の制約に影響する可能性）

### 採用理由
**不採用**。スタックをシンプルに保ち、生 SQL + 独自 interface を採用。

---

## 代替案 C: リポジトリをクラスベースで実装

### 概要
各リポジトリを class として実装し、DI コンテナで管理する。

### メリット
- オブジェクト指向的な設計
- モック置き換えが容易

### デメリット
- Cloudflare Workers 環境でクラスインスタンス管理がオーバーヘッドになりうる
- 関数型スタイルのほうがシンプルで Workers に適している

### 採用理由
**不採用**。関数型スタイル（`(c: DbCtx, ...args) => Promise<T>`）を採用。
