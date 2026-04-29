# 公開検索 query parser の packages/shared 移設 - タスク指示書

## メタ情報

```yaml
issue_number: 222
```

| 項目         | 内容                                                       |
| ------------ | ---------------------------------------------------------- |
| タスクID     | 04a-followup-003-public-search-query-parser-shared         |
| タスク名     | 公開検索 query parser の packages/shared 移設              |
| 分類         | リファクタリング                                           |
| 対象機能     | `/public/members` 検索 query の serialize / parse 共通化   |
| 優先度       | 中                                                         |
| 見積もり規模 | 小規模                                                     |
| ステータス   | 未実施                                                     |
| 発見元       | 04a Phase 12 unassigned-task-detection (U-3)               |
| 発見日       | 2026-04-29                                                 |
| 着手条件     | 06a (apps/web 公開ディレクトリ実装) で同等パーサが必要になる時点 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

04a で `apps/api/src/_shared/search-query-parser.ts` に query parser（`q / zone / status / tag / sort / density / page / limit`）を実装した。06a では `apps/web` 側で同等の serialize / parse 実装が必要になる見込みで、両側に同じパーサを抱えると drift が起きやすい。

### 1.2 問題点・課題

- 同じ query schema を web/api 双方で再実装すると、バリデーション差分による silent bug が発生
- zod schema を packages/shared に置く既存パターン（`packages/shared/src/zod/`）と整合しない

### 1.3 放置した場合の影響

- 06a 着手時に web 側でゼロから書き直すコスト
- `/public/members?status=...` の振る舞いが web/api で食い違う事故

---

## 2. 何を達成するか（What）

### 2.1 目的

公開検索 query parser を `packages/shared` に移設し、`apps/api` / `apps/web` 双方が同じ実装を import する。

### 2.2 完了状態

- `packages/shared/src/public/search-query.ts`（or 同等パス）に zod schema + parse / serialize util が存在
- `apps/api/src/_shared/search-query-parser.ts` が shared を import するだけになる
- 06a 着手時、`apps/web` も同一 import で利用できる

### 2.3 スコープ

#### 含むもの

- 既存 parser を packages/shared に移設（zod schema と util）
- `apps/api` 側を import 切替
- shared package の vitest 単体テスト整備（境界値）

#### 含まないもの

- `apps/web` 実装本体（06a 範囲）
- 検索 spec の追加（タグ展開 / OR 検索など）

### 2.4 成果物

- `packages/shared/src/public/search-query.ts`
- `apps/api/src/_shared/search-query-parser.ts` の薄ラッパ化 or 削除
- shared 側 unit test
- workspace 依存関係の整合確認

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 04a の query parser 実装と AC が固まっている
- packages/shared が `apps/api` と `apps/web` 双方から import されている既存パターンが動作している

### 3.2 実行手順

1. 既存 parser の zod schema / util を packages/shared に移設
2. shared 側で vitest 単体テストを整備（境界値: `limit > 100` / `page < 1` / 不正 sort 値）
3. `apps/api` 側 import を shared 経由に切替
4. dependency-cruiser / boundary lint で web → api 直接参照が無いことを再確認
5. 06a 向け使用例を `packages/shared/README.md` か該当タスクの implementation-guide に記録

### 3.3 受入条件 (AC)

- AC-1: `packages/shared` に query schema / parse / serialize が export されている
- AC-2: `apps/api` の既存 contract が壊れない（既存 unit test と 04a-followup-001 の contract が pass）
- AC-3: 不正値（`limit=999` / `page=0` / `sort=invalid`）が zod parse で 400 になる
- AC-4: shared 側 unit test が pass
- AC-5: `apps/web` から import 可能（dry-run import で boundary lint が通る）

---

## 4. 苦戦箇所 / 学んだこと（04a で得た知見）

### 4.1 shared 配置の早期判断

04a では「`apps/web` で必要になるまで shared に出さない」判断をしたが、結果として 06a で move + import 切替が必要になる。**「複数 app から呼ばれる予定のあるパーサは最初から shared」** という運用ルールに skill 側を更新する余地がある。

### 4.2 zod schema の field 値の正規化

skill-feedback (S-1) と同根。`kind: "short_text"` (snake) と `"shortText"` (camel) のずれで 04a でも初回 unit test が落ちた。shared 移設時に正規化規約（camelCase 統一）を spec に明記する。

### 4.3 boundary lint 信頼

shared への移設は boundary lint が通っているからといって安全とは限らない。circular dependency 検出 (`pnpm depcruise` 等) も併用する。

---

## 5. 関連リソース

- `apps/api/src/_shared/search-query-parser.ts`
- `packages/shared/src/zod/`（既存 schema 配置パターン）
- 06a タスク仕様書（着手時に参照）
- 04a Phase 12 skill-feedback-report.md S-1
- 04a Phase 12 unassigned-task-detection.md U-3
