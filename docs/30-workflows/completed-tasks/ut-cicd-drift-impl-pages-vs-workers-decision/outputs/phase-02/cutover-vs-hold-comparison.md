# Phase 2 成果物: 3 案 × 6 軸 比較マトリクス（18 セル）

## 比較マトリクス

| 判断軸 | 案 X (cutover) | 案 Y (保留) | 案 Z (段階移行) |
| --- | --- | --- | --- |
| **1. rollout cost** | **S〜M**（wrangler.toml は既移行済 / `web-cd.yml` の deploy step 1 行置換 + Cloudflare 側 project → Workers script 切替） | **S**（CLAUDE.md は既整合のため変更不要 / `deployment-cloudflare.md` の current facts 表記補正のみ。ただし `web-cd.yml` の Pages 経路と wrangler.toml の Workers 形式の不整合が残るため deploy 不能になる潜在リスク） | **L**（dev/prod 二重管理、`web-cd.yml` 環境別分岐、staging/production の Cloudflare side 切替別タイミング） |
| **2. Cloudflare features 利用範囲** | **広い**（Workers Bindings 柔軟性 / `[assets] binding = "ASSETS"` / Smart Placement / observability `enabled = true`）。wrangler.toml で既に [observability] 有効化済 | **狭い**（Pages の制約内。Pages Functions の制限・bindings の半サポート・カスタム observability 不可） | **段階的**（dev で先行検証、prod は後追い。検証期間中は両環境で feature gap が発生） |
| **3. runtime parity** | **`@opennextjs/cloudflare@1.19.4` の実装上限に依存**。Next.js 16.2.4 + App Router の middleware / server components が `.open-next/worker.js` 経由で動作。実測でローカル preview 可能 | **Pages の Next.js 公式サポート範囲**（`.next` 直配信、middleware は Pages Functions 経由）。wrangler.toml が既に Workers 形式のため、保留採択時は `wrangler.toml` を **Pages 形式へロールバック**する必要あり（追加コスト発生） | **環境差分**: dev = Workers / prod = Pages の二重 runtime。env-specific bug が発生しやすい |
| **4. D1 binding 配置整合（不変条件 #5）** | **維持可能**（要明示）: ADR Consequences で「cutover 後も apps/web に `[[d1_databases]]` を追加しない」を必須化。apps/api 経由原則は両形式で維持可能 | **維持容易**（現状維持。apps/web は D1 binding 未保有） | **維持可能**（dev/prod 双方で `[[d1_databases]]` 追加禁止を ADR で明示） |
| **5. 既存 GHA 互換性** | **要切替**: `web-cd.yml` L48 / L85 の `command: pages deploy .next --project-name=...` を `command: deploy --env staging` / `command: deploy --env production` 相当に置換。`wrangler-action@v3` の `command` パラメータ修正のみで完結。secrets（`CLOUDFLARE_API_TOKEN`）/ variables（`CLOUDFLARE_ACCOUNT_ID`）はそのまま再利用可。Cloudflare 側 Pages project (`CLOUDFLARE_PAGES_PROJECT`) → Workers script への切替が手動 runbook 必要 | **変更なし**（現行の `pages deploy .next` 維持）。ただし wrangler.toml が Workers 形式のため `pages deploy .next` が `.next` を見つけられない可能性。**`wrangler.toml` の Pages 形式へのロールバック**または `pages_build_output_dir = ".next"` の再追加が必要 | **環境別 step 分岐**: dev branch のみ `wrangler deploy --env staging`、main branch は依然 `pages deploy`。job 重複により lint / 維持コスト上昇 |
| **6. `@opennextjs/cloudflare` 互換** | **現行版 `1.19.4` で実証済**（wrangler.toml レベルで既成事実化）。メジャーアップデート時は baseline 候補で再評価 | **影響なし**（Pages 形式へロールバックする場合は `@opennextjs/cloudflare` の役割が事実上無効化される。`build:cloudflare` script を残すか削除するか別判断必要） | **dev で先行検証可能**だが本プロジェクトは既に preview レベルで Workers 形式が動いている既成事実があり、二重検証は冗長 |

## 案別 Pros / Cons 要約

### 案 X (cutover)

- **Pros**:
  - 既成事実（wrangler.toml は Workers 形式）と CLAUDE.md / deployment-cloudflare.md 将来仕様の宣言を整合
  - rollout cost は既に大半が消化済（wrangler.toml）。残作業は `web-cd.yml` 1 step 置換と Cloudflare side 切替
  - Cloudflare features の自由度が広い
  - `@opennextjs/cloudflare` 採用方針と整合
- **Cons**:
  - 三者同期作業（wrangler.toml は完了 / web-cd.yml は要置換 / Cloudflare side は手動）が分散実行されると drift 再発リスク
  - Cloudflare ダッシュボード上の Pages project → Workers script 切替は wrangler では完結せず手動 runbook 必要
  - `@opennextjs/cloudflare` のメジャーアップデート時のメンテコスト

### 案 Y (保留)

- **Pros**:
  - 文書補正が最小（deployment-cloudflare.md の current facts 表記のみ）
  - 既存 GHA / Cloudflare side の触り直し不要
- **Cons**:
  - **wrangler.toml が Workers 形式に既に移行済のため、保留採択は `wrangler.toml` を Pages 形式へロールバックする追加コストを伴う**（現状の `web-cd.yml` の `pages deploy .next` が動かない状態が顕在化する可能性）
  - CLAUDE.md スタック表現を「Cloudflare Pages + Next.js」に書き換えると `@opennextjs/cloudflare` 採用方針が崩れる
  - Workers 機能の将来採用余地が制限される
  - 議論風化リスク

### 案 Z (段階移行)

- **Pros**:
  - 環境差分のリスクを段階的に検証可能
- **Cons**:
  - dev/prod 二重管理コスト
  - `web-cd.yml` 環境別 step 分岐の保守コスト
  - 既に wrangler.toml が Workers 形式に移行済のため、段階移行の意味が薄い

## base case 候補（Phase 3 で確定）

**案 X (cutover) が優位** — 根拠:
1. wrangler.toml は **既に Workers 形式に切り替わっている既成事実**があり、案 Y (保留) は wrangler.toml ロールバック追加コストを伴う
2. CLAUDE.md / `@opennextjs/cloudflare` 採用方針と整合
3. 残 cutover 作業は `web-cd.yml` 1 step 置換 + Cloudflare side 手動切替のみで rollout cost が小〜中
4. `@opennextjs/cloudflare@1.19.4` で Workers 形式が実証済

ただし **Phase 3 ゲートで最終確定**。Cloudflare side 切替の手動 runbook 化が現実的に実行可能か再評価する。

## 完了確認

- [x] 18 セルすべて埋められている（3 案 × 6 軸）
- [x] 案別 Pros/Cons 要約
- [x] base case 候補と根拠（Phase 3 確定）
