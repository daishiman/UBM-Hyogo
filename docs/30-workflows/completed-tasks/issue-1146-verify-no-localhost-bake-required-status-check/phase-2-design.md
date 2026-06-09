# Phase 2: 設計

| 項目 | 内容 |
| --- | --- |
| 実装区分 | 実装仕様書（yml trigger 変更 + branch protection mutation） |
| GitHub Issue | [#1146](https://github.com/daishiman/UBM-Hyogo/issues/1146)（CLOSED 維持・`Refs #1146` のみ） |
| 視覚証跡 | NON_VISUAL |

---

## 1. アーキテクチャ概要（3 層の責務境界）

本タスクが触る対象は、責務が異なる 3 層に分かれる。混同すると「gate を直したのに merge ブロックできない」「context を消した」などの事故になるため、境界を明確化する。

| 層 | 責務 | 実体 | 本タスクでの扱い |
| --- | --- | --- | --- |
| L1. gate LOGIC | 「localhost 焼き込みを検出する」判定そのもの | `scripts/verify-no-localhost-bake.sh`（grep）+ `scripts/verify-no-localhost-bake.spec.ts`（self-test） | **不変**（AC-7）。grep パターン・allowlist 規約・exit code は一切触らない |
| L2. workflow trigger | 「いつ gate を走らせるか」 | `.github/workflows/verify-no-localhost-bake.yml` の `on:` ブロック | `on.pull_request.paths` を**除去**し常時実行化（AC-1）。`push: branches:[main,dev]` と job steps は不変 |
| L3. branch protection | 「gate の結果を merge ブロックに強制するか」 | GitHub `repos/.../branches/{dev,main}/protection` の `required_status_checks.contexts` | `verify-no-localhost-bake` を**追加**（AC-2/AC-3）。既存 5 context は保持（AC-4）、他フィールドは drift なし（AC-5） |

因果連鎖は **L2（起動）→ L1（判定）→ L3（強制）** であり、required 化（L3）が効くためには L2 が「必ず起動する」ことが前提になる。paths フィルタ付きの L2 は対象 path を触らない PR で起動せず、L3 が `Waiting for status` で永久 pending になる。これが paths 除去（L2 修正）を L3 mutation と同サイクルで行う理由（因果）である。

## 2. 対象ブランチ別 payload 差異の表

dev / main は branch protection が**独立 endpoint**であり、現状値も同一だが**個別に GET / PUT** する（単一 payload の使い回しは禁止）。

| フィールド | dev（現状） | dev（追加後） | main（現状） | main（追加後） |
| --- | --- | --- | --- | --- |
| `required_status_checks.contexts` | `["ci","Validate Build","coverage-gate","lighthouse-ci","e2e-tests-coverage-gate"]` | 左記 5 件 + `"verify-no-localhost-bake"`（計 6 件） | 同左 5 件 | 同左 5 件 + `"verify-no-localhost-bake"`（計 6 件） |
| `required_status_checks.strict` | before 値を維持 | before と同値 | before 値を維持 | before と同値 |
| `enforce_admins` | `true` | `true`（drift なし） | `true` | `true`（drift なし） |
| `lock_branch` | `false` | `false`（drift なし） | `false` | `false`（drift なし） |
| `required_pull_request_reviews` | `null` | `null`（drift なし） | `null` | `null`（drift なし） |
| `required_linear_history` | before 値を維持 | before と同値 | before 値を維持 | before と同値 |
| `required_conversation_resolution` | before 値を維持 | before と同値 | before 値を維持 | before と同値 |

> contexts 以外のフィールドはすべて before JSON と同値で送る。PUT は `required_status_checks.contexts` を**全体上書き**するため、5 件を全件保持した完全配列に `verify-no-localhost-bake` を末尾追加して送ることが唯一の安全策。

## 3. yml trigger 変更の Before/After

### Before（現状）

```yaml
on:
  pull_request:
    branches: [main, dev]
    paths:
      - "apps/web/src/**"
      - "apps/web/app/**"
      - "apps/web/wrangler.toml"
      - "scripts/verify-no-localhost-bake.sh"
      - "scripts/verify-no-localhost-bake.spec.ts"
      - ".github/workflows/verify-no-localhost-bake.yml"
  push:
    branches: [main, dev]
```

### After（paths ブロック除去・常時実行化）

```yaml
on:
  pull_request:
    branches: [main, dev]
  push:
    branches: [main, dev]
```

### 不変点（明示）

- `push: branches:[main,dev]` は元々 paths を持たず**不変**。
- `permissions` / `concurrency` / `jobs.verify-no-localhost-bake.*`（`name` / `runs-on` / `timeout-minutes` / steps の `self-test`・`source grep gate`）は**不変**。
- grep step（`bash scripts/verify-no-localhost-bake.sh --src-only`）と self-test（`pnpm vitest run scripts/verify-no-localhost-bake.spec.ts`）は**不変**。検出 LOGIC には触れない（AC-7）。

この After は既存 required check 全 workflow（`ci.yml` / `validate-build.yml` / `e2e-tests.yml` / `lighthouse.yml`）が `pull_request.paths` を持たず常時実行している **no-paths 規約**に整合する。

## 4. 既存コンポーネント再利用可否

| 対象 | 再利用 / 新規 | 判断 |
| --- | --- | --- |
| `verify-no-localhost-bake.yml`（job 本体） | **再利用**（trigger のみ修正） | gate は既に動作。新規 workflow は作らない |
| `scripts/verify-no-localhost-bake.sh` | **再利用（無改修）** | grep LOGIC 不変（AC-7） |
| `scripts/verify-no-localhost-bake.spec.ts` | **再利用（無改修）** | self-test 不変 |
| branch protection PUT 手順 | **再利用**（UT-GOV-001 / 既存 required check 追加前例の様式） | dev / main 個別 GET → 全件保持 PUT → after diff の様式を踏襲 |

新規ファイルは作らない。新規 primitive / 新規 gate も生やさない。

## 5. branch protection PUT payload 構造

PUT payload の `required_status_checks` は、before JSON の同フィールドを基に contexts のみ拡張する。

```jsonc
{
  // before JSON の required_status_checks をベースに contexts を拡張
  "required_status_checks": {
    "strict": <before と同値>,
    "contexts": [
      "ci",
      "Validate Build",
      "coverage-gate",
      "lighthouse-ci",
      "e2e-tests-coverage-gate",
      "verify-no-localhost-bake"   // ← 末尾追加（唯一の差分）
    ]
  },
  "enforce_admins": true,                         // before と同値
  "required_pull_request_reviews": null,          // before と同値（solo 運用）
  "restrictions": <before と同値>,
  "required_linear_history": <before と同値>,
  "required_conversation_resolution": <before と同値>,
  "lock_branch": false,                           // before と同値
  "allow_force_pushes": <before と同値>,
  "allow_deletions": <before と同値>
}
```

- contexts は**全体上書き**されるため、5 件を全件列挙したうえで `verify-no-localhost-bake` を末尾追加する。
- dev / main で別 payload（`/tmp/dev-protection-put.json` / `/tmp/main-protection-put.json`）を組み立て、それぞれの endpoint へ PUT する。

## 6. システム思考ループ

### 強化ループ（回帰防止の self-reinforcing loop）

`verify-no-localhost-bake` を required 化する → localhost 焼き込みを含む PR が merge ブロックされる → `apps/web/src` / client bundle に loopback エンドポイントが landed しない → staging / production で API base URL の誤焼き込みが再発しない → gate が「実効を持つ governance」として信頼され、後続の env アクセス規約（invariant #11 / task-02）が維持される → さらに localhost-bake を避ける実装慣行が定着する。required 化しない限りこのループは起動せず、gate は「存在するが効かない」状態に留まる。

### バランスループ（永久 pending block を避ける negative loop）

required 化により merge ブロック圧が増える → もし `pull_request.paths` を残すと、対象 path を触らない PR で workflow が起動せず `Waiting for status` の永久 pending が発生し、無関係な PR まで merge 不能になる → 開発速度が阻害される。この副作用を打ち消す negative feedback が **paths 除去（常時実行化）** であり、gate を「常に起動して必ず resolve する」状態にすることで、強制力（強化ループ）を保ちつつ過剰ブロック（永久 pending）を抑制する。

## 7. 価値とコスト

| 観点 | 内容 |
| --- | --- |
| 価値 | localhost 焼き込み回帰を merge 時点で機械的に阻止。solo 運用の品質保証モデル（CI gate で担保）の保護対象に gate を組み込む |
| コスト | paths 除去により全 PR で gate が常時実行されるが、job は `install + vitest（1 spec）+ grep` のみで安価。既存 required check も全て no-paths 常時実行であり、追加コストは既存規約と同水準 |
| トレードオフ | paths による「無関係 PR で skip」は失うが、required check の前提（常に走る）と引き換えに必要なコスト。footgun（永久 pending）を避ける唯一の整合解 |

## 8. 状態所有権

- **正本**: GitHub branch protection の実値（`required_status_checks.contexts` 等）が唯一の正本。
- **運用参照**: CLAUDE.md「ブランチ戦略」の required status check 列挙は運用参照であり、GitHub 実値に追従させる（after evidence 取得後に CLAUDE.md の列挙を実値整合へ更新する。これは Phase 12 ドキュメント同期で扱う）。
- dev / main は protection が独立所有のため、状態確認・mutation・evidence はすべて branch 別に行う。
