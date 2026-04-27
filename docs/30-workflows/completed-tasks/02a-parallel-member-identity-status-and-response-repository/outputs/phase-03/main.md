# Phase 3: 設計レビュー

## レビュー結果: 承認

設計フェーズで提案された設計を検討した結果、以下の点を確認した。

## 検討事項

### 1. D1 型の抽象化方針

**決定**: `_shared/db.ts` に独自 `D1Db` interface を定義し、`@cloudflare/workers-types` の `D1Database` には依存しない。

**根拠**:
- vitest テスト環境（jsdom）では `@cloudflare/workers-types` が利用できない
- 独自 interface を使うことでテスト時は `MockD1` で差し替え可能になる
- 本番時は Cloudflare D1 が構造的部分型として互換

### 2. members VIEW vs member_identities テーブル

**決定**: 書き込みは `member_identities` テーブルを直接使い、`members` VIEW は使わない。

**根拠**:
- `members` は VIEW のため INSERT/UPDATE/DELETE 不可
- SELECT も VIEW を使う必要はなく、`member_identities` を直接クエリすれば十分

### 3. partial update 禁止の実装方法

**決定**: `upsertResponse` のみ提供し、個別フィールド UPDATE 関数は実装しない。

**根拠**: 不変条件 #4「本人本文は Form 再回答が正本」

### 4. adminNotes の処理

**決定**: `buildAdminMemberDetailView(c, mid, adminNotes)` として adminNotes を引数で受け取る設計を採用。

**根拠**: 不変条件 #12「adminNotes 分離」

## 代替案との比較

alternatives.md 参照
