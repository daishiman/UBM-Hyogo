# Hono ctx / DI container への repository 注入経路移行 - タスク指示書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | ut-02a-followup-003-hono-ctx-or-di-container-migration |
| タスク名 | builder への optional 第N引数 DI を Hono ctx / DI container 経由に置換 |
| 分類 | リファクタ / アーキテクチャ |
| 対象機能 | `apps/api/src/repository/_shared/builder.ts` の `deps?` 引数経路 |
| 優先度 | priority:low |
| 見積もり規模 | 中規模 |
| ステータス | 未実施 |
| 発見元 | ut-02a-attendance-profile-integration Phase 12 unassigned-task-detection |
| 発見日 | 2026-05-01 |
| 委譲先 wave | 02 系 architecture follow-up |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

ut-02a-attendance-profile-integration では `buildMemberProfile(c, mid, deps?)` のように optional 第3/第4引数で `attendanceProvider` を注入した。
追加の repository 依存（write provider、tag provider、note provider など）が増えるたびに引数が肥大化し、call site 全てを改修する必要が出る。

### 1.2 問題点・課題

- 引数追加方式は repository が増えるたびに O(N) で call site が増える
- 未注入時のフォールバック（`[]`）が暗黙仕様化しており、新規 caller がハマる
- Hono context（`c.var.*` / `c.set`）に置けば middleware 一段で全 route に行き渡る

### 1.3 放置した場合の影響

- 02b / 02c で repository が増えた時に builder 引数列が爆発
- 「provider 未注入時 silent fallback」によるテスト漏れが起きやすい

---

## 2. 何を達成するか（What）

### 2.1 目的

repository provider 群を Hono ctx 経由（`c.var.attendanceProvider` 等）または小規模 DI container 経由で注入し、builder の引数列を縮める。

### 2.2 最終ゴール

- `buildMemberProfile(c, mid)` のシグネチャに戻り、provider は ctx から解決
- middleware で provider を `c.set` する経路が確立
- 既存テストの DI override 経路（mock 注入）も同パターンに統一

### 2.3 スコープ

#### 含むもの

- `c.var` 型拡張（`HonoEnv` の `Variables`）
- provider injection middleware の新設
- `buildMemberProfile` / `buildAdminMemberDetailView` の引数縮小
- 全 call site 改修
- テストの mock 注入経路統一

#### 含まないもの

- 個々の repository 実装変更（read/write 既存契約は維持）
- 大規模 DI フレームワーク（tsyringe / inversify）導入

### 2.4 成果物

- middleware module
- 改修済 builder + call site
- テスト改修
- ADR（引数注入 vs ctx 注入 vs DI container の選定理由）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- ut-02a-attendance-profile-integration マージ済み
- 02b / 02c の repository 追加方針が確定していること

### 3.2 実装手順

1. ADR 起案（3 alternatives 比較）
2. middleware 設計 + `HonoEnv` 型拡張
3. builder 引数縮小
4. call site 一斉改修
5. テスト mock 経路統一

---

## 4. 苦戦箇所【記入必須】

- 対象: `apps/api/src/repository/_shared/builder.ts`
- 症状: ut-02a で `deps?` optional 引数を採用した経緯あり。当時の Phase 03 alternatives 比較で「ctx 注入」「DI container」も候補にあったが、影響範囲を最小化するため引数追加を選択した（破壊的変更回避）。本タスクで ctx 注入に切替える際は、call site の grep + 漸進移行（middleware 入れた後 builder 順次切替）を必須にすること。
- 参照: `docs/30-workflows/ut-02a-attendance-profile-integration/outputs/phase-03/alternatives-comparison.md`
- 参照: `docs/30-workflows/ut-02a-attendance-profile-integration/outputs/phase-12/implementation-guide.md`

---

## 5. リスクと対策

| リスク | 対策 |
| --- | --- |
| 全 call site 一括改修で merge conflict 多発 | 漸進移行: middleware 先行 → builder 個別切替 |
| `c.var` 型拡張の global 汚染 | `HonoEnv` を route group ごとに分離 / type narrow |
| 暗黙 fallback が残ると検出困難 | provider 未注入時は throw に変更（silent `[]` を廃止） |

---

## 6. 検証方法

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api lint
mise exec -- pnpm --filter @ubm-hyogo/api test
```

期待結果: 既存 builder / repository テスト全 PASS、新規 middleware テスト追加。

---

## 7. 参考リンク

- `docs/30-workflows/ut-02a-attendance-profile-integration/outputs/phase-03/alternatives-comparison.md`
- `docs/30-workflows/ut-02a-attendance-profile-integration/outputs/phase-12/implementation-guide.md`
- `docs/00-getting-started-manual/specs/01-api-schema.md`
