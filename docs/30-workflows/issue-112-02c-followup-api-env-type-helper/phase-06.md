# Phase 6: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-112-02c-followup-api-env-type-helper |
| Phase 番号 | 6 / 13 |
| Phase 名称 | テスト戦略 |
| Wave | 2 (follow-up) |
| Mode | sequential |
| 作成日 | 2026-05-01 |
| 前 Phase | 5 (実装計画 / runbook) |
| 次 Phase | 7 (受入条件マトリクス) |
| 状態 | pending |

## 目的

T1〜T4 の各サブタスクに対するテスト戦略を確定する。本タスクは新規 LOC が小規模（合計 100 行未満）かつ runtime ロジックを変更しない型契約 / refactor タスクであるため、新規 unit test の追加は最小限とし、**既存 02c unit test の維持**、**型レベル契約テスト（設計記述）**、**boundary lint negative test**、**回帰範囲の明示** の 4 軸でカバレッジを設計する。

## test 戦略 4 軸

### 軸 1: 既存 02c unit test 維持（regression）

| 観点 | 内容 |
| --- | --- |
| 対象 | 02c で作成済の `apps/api/src/repository/**` の unit test 群（特に `_shared/db.test.ts` 系） |
| 検証手段 | `mise exec -- pnpm test --filter @ubm/api` を T2 完了後と gate-final で 2 回実行 |
| 期待 | 全 test が pass。新規追加 / 削除はゼロ |
| 担保するもの | T2 の `ctx()` refactor が runtime 動作を変えていないこと、`Pick<Env, "DB">` への変更が構造的部分型で互換であること |
| 失敗時対応 | Phase 5 ロールバック case 1 を適用（fixture cast 追加 → 局所修復 → 全面 revert） |

### 軸 2: 型レベル契約テスト（設計記述のみ、実コードは書かない）

本タスクは仕様書フェーズであるため実 .ts コードを生成しない。以下は **実装フェーズで導入推奨される擬似コード設計** として記述する。

#### 設計案 A: `Pick<Env, "DB">` の構造的契約テスト

```ts
// 擬似コード（実装フェーズで apps/api/src/__type_tests__/env.type-test.ts 等に配置検討）
import type { Env } from "../env";
import type { Pick } from "...";  // built-in
import { expectTypeOf } from "expect-type";  // 既存導入されていれば

// 契約 A-1: Env が DB: D1Database を持つ
expectTypeOf<Env>().toHaveProperty("DB").toEqualTypeOf<D1Database>();

// 契約 A-2: ctx() が Pick<Env, "DB"> を受理する
expectTypeOf(ctx).parameter(0).toMatchTypeOf<{ DB: D1Database }>();
```

#### 設計案 B: `Hono<{ Bindings: Env }>` の参照契約

```ts
// 擬似コード
import { Hono } from "hono";
import type { Env } from "../env";

const sample = new Hono<{ Bindings: Env }>();
sample.get("/x", (c) => {
  expectTypeOf(c.env).toEqualTypeOf<Env>();
  expectTypeOf(c.env.DB).toEqualTypeOf<D1Database>();
  return c.text("ok");
});
```

| 観点 | 内容 |
| --- | --- |
| 導入有無 | 本タスクでは設計記述のみ。実コード化は AC-3 / AC-4 達成後の任意拡張（Phase 12 で未タスク化候補） |
| 代替検証 | `pnpm typecheck` 自体が型契約 gate として機能。`expectTypeOf` 導入は将来拡張 |
| 価値 | 後続 03a〜05b で `Env` field 削除 / 型変更が起きた際の早期検知 |

### 軸 3: boundary lint negative test（不変条件 #5 gate）

| 観点 | 内容 |
| --- | --- |
| 対象 | T4 で整備する `scripts/lint-boundaries.mjs` の禁止トークン |
| 検証手段 | apps/web 配下にダミーファイルを一時配置して `mise exec -- pnpm lint` を実行 → exit code 観測 → ダミー削除 |
| ダミーケース | `apps/web/src/__boundary_negative__.ts` に `import type { Env } from "../../api/src/env";` を 1 行配置 |
| 期待 | `pnpm lint` が exit non-zero、エラーメッセージに `apps/api/src/env` への web 由来 import を gate した旨が含まれる |
| false positive 検証 | `apps/api` 内部の正常 import（例: `apps/api/src/repository/_shared/db.ts` → `../../env`）が **lint pass** する（exit 0） |
| 担保するもの | 不変条件 #5（D1 への直接アクセスは apps/api に閉じる）の機械的 gate。AC-5 を直接検証 |
| 実行 Phase | Phase 9 (boundary 検証) で本格実行。Phase 11 で log evidence 化 |

### 軸 4: 回帰範囲（02c 由来 test 一覧）

T2 の `ctx()` refactor は 02c で作成済の unit test 群に影響しうる。回帰対象として以下を明示する:

| カテゴリ | 対象 test (02c 由来想定) | 影響可能性 | 対応 |
| --- | --- | --- | --- |
| `_shared/db` 系 | `db.test.ts` 等の `ctx()` 直接呼び出し test | 高（シグネチャ変更点そのもの） | fixture が `{ DB: <D1Database 構造的部分型> }` を満たすことを確認 |
| repository module 系 | `members.repository.test.ts` 等で `ctx()` を経由する test | 中（ctx 経由のため間接影響） | typecheck で間接検知。実行 test で挙動 unchanged |
| helper 系 | `intToBool` / `boolToInt` / `isUniqueConstraintError` 等 | 低（本タスクで無変更） | 回帰実行で pass 確認のみ |

回帰実行コマンド:

```bash
mise exec -- pnpm test --filter @ubm/api
```

## 期待 coverage

| 観点 | 値 | 根拠 |
| --- | --- | --- |
| 新規 LOC | < 100 行（T1〜T4 合計） | small スケール / Phase 4 粒度評価 |
| 新規 test 追加 | 0〜数件（型レベル契約テスト導入時のみ） | runtime 変更なし、既存 test で十分 |
| 既存 coverage | 02c 完了時点の coverage を維持 | refactor のみ、削除 LOC ほぼなし |
| boundary lint coverage | negative test 1 ケース追加 | AC-5 直接検証 |

> coverage 数値の絶対値ではなく **既存 baseline 維持** を gate 基準とする。02c 完了時点の `coverage/coverage-summary.json` 等と比較し、回帰の有無を確認する。

## test pyramid 上の位置づけ

```
                 [E2E / manual smoke]    ← 該当なし（NON_VISUAL）
              [integration test]          ← 該当なし（型契約 / refactor のみ）
        [unit test]                       ← 既存 02c 維持（軸 1）
   [type-level contract test]             ← 設計記述のみ（軸 2）
[lint / boundary gate]                    ← negative test（軸 3）
```

unit test pyramid 下層（lint / type）に重心を置く設計。

## 多角的チェック観点

- **不変条件 #5**: 軸 3 boundary lint negative test で gate 化。
- **不変条件 #1**: 軸 2 型レベル契約は `Env` の binding 名 / 値型のみを検証対象とし、Forms schema 構造を契約に含めない。
- **後方互換**: 軸 1 / 軸 4 で 02c unit test 全件 pass を gate。
- **secret hygiene**: 型レベル契約テストの擬似コードに secret 実値を含めない（プレースホルダのみ）。Phase 9 で grep gate。
- **flakiness**: 型 / lint test は決定論的のため flake 想定なし。

## 統合テスト連携

| 連携先 Phase | 引き渡す観測 |
| --- | --- |
| Phase 7 (AC マトリクス) | 各軸が AC-1〜7 のいずれを検証するかの対応 |
| Phase 8 (CI / 品質ゲート) | gate-final の 3 コマンド + boundary lint を CI 通過条件として固定 |
| Phase 9 (boundary 検証) | 軸 3 negative test の実行 |
| Phase 11 (evidence) | 各軸の log evidence 取得点 |

## 完了条件

- [ ] test 戦略 4 軸（既存維持 / 型レベル契約 / boundary lint negative / 回帰範囲）が記述
- [ ] 型レベル契約テストは **設計記述のみ**（実コードゼロ）であることを明示
- [ ] 回帰対象 02c 由来 test 一覧が明示
- [ ] 期待 coverage が「既存 baseline 維持」基準で記述
- [ ] `outputs/phase-06/main.md` にテスト戦略サマリ記載

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] artifacts.json の phase 6 を completed

## 成果物

- `phase-06.md`（本ファイル）
- `outputs/phase-06/main.md`

## 次 Phase

- 次: Phase 7 (受入条件マトリクス)
- 引き継ぎ: 各軸 ↔ AC 対応、回帰対象 test 一覧、boundary lint negative ケース
