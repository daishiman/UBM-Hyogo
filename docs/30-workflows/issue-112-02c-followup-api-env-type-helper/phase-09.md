# Phase 9: セキュリティ / boundary 検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-112-02c-followup-api-env-type-helper |
| Phase 番号 | 9 / 13 |
| Phase 名称 | セキュリティ / boundary 検証 |
| Wave | 2 (follow-up) |
| Mode | sequential |
| 作成日 | 2026-05-01 |
| 前 Phase | 8 (CI / 品質ゲート) |
| 次 Phase | 10 (ロールアウト / 後続連携) |
| 状態 | pending |

## 目的

`apps/api/src/env.ts` 新規作成および `_shared/db.ts` refactor が、(a) 不変条件 #5（D1 / `apps/api` 内部参照を web から遮断）、(b) secret 値の hygiene（API token / OAuth secret 等の実値を `env.ts` コメントや evidence に含めない）、(c) 1Password / op 経路への影響なし、の 3 観点で安全であることを **boundary lint negative test** と **grep ベース hygiene check** で機械的に gate 化する。NON_VISUAL タスクであるため screenshot 等 visual evidence は取らず、log / grep 出力のみで担保する。

## 1. secret hygiene check

### 1.1 検査対象

| 対象 | 検査方法 | 合格基準 |
| --- | --- | --- |
| `apps/api/src/env.ts` のコメント | `grep -nEi '(token\|secret\|bearer\|api[_-]?key\|oauth)' apps/api/src/env.ts` | hit は **binding 名コメント** のみ（実値 / 実 token 文字列を含まない）。例: `// OAUTH_CLIENT_SECRET: string;` のような binding 名は許容、`// real value: xxxx-yyyy` のような実値は不可 |
| Phase 11 evidence (`outputs/phase-11/evidence/*.log`) | `grep -REi '(eyJ[A-Za-z0-9_-]{20,}\|sk-[A-Za-z0-9]{20,}\|Bearer [A-Za-z0-9._-]+\|cf-token)' outputs/phase-11/evidence/` | 0 件 hit |
| 予約欄コメント | 目視 + 上記 grep | secret 名のみ記載、実値貼付け 0 件 |

### 1.2 grep コマンドと期待

```
# env.ts コメント hygiene
grep -nEi '(token|secret|bearer|api[_-]?key|oauth)' apps/api/src/env.ts || echo "no hit"
# 期待: hit 0 件、または OAUTH_CLIENT_SECRET / MAGIC_LINK_HMAC_KEY 等の binding 名コメントのみ

# evidence hygiene
grep -REi '(eyJ[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9]{20,}|Bearer [A-Za-z0-9._-]+|cf-token|CLOUDFLARE_API_TOKEN=)' outputs/phase-11/evidence/ ; echo "exit=$?"
# 期待: exit=1（grep が一致なし）
```

### 1.3 fail 時対応

- `env.ts` に実値が混入した場合: 即座にコメントを binding 名のみに置換し、git history からも除去（必要に応じ `git filter-repo` / 新規 commit で上書き）。1Password / Cloudflare 側の token を rotation。
- evidence に token / secret hit: 該当行を redact（`***REDACTED***`）し、流出経路（`pnpm typecheck` のログに env が leak していないか等）を Phase 12 の苦戦記録に残す。

## 2. boundary lint 検証

### 2.1 positive test: apps/api 内部参照は通る

| 検査 | 期待 |
| --- | --- |
| `apps/api/src/repository/_shared/db.ts` から `import type { Env } from "../../env"` | `node scripts/lint-boundaries.mjs` exit 0（apps/api 配下は対象外スコープ） |
| `apps/api/src/index.ts` 等で `Hono<{ Bindings: Env }>` 利用 | 同上 exit 0 |

### 2.2 negative test: apps/web からの import は error

| ステップ | 内容 |
| --- | --- |
| 1 | 仮ファイル `apps/web/__boundary_probe__.ts` を作成し、本文に `import type { Env } from "apps/api/src/env";` を記述（テスト目的、commit はしない） |
| 2 | `node scripts/lint-boundaries.mjs` を実行 |
| 3 | exit code が **non-zero (1)** になること、および stderr に `apps/web/__boundary_probe__.ts contains forbidden token: apps/api` の行が出ることを確認 |
| 4 | probe を削除 |

期待 error message 形式（`scripts/lint-boundaries.mjs` 現状実装に基づく）:

```
apps/web/__boundary_probe__.ts contains forbidden token: apps/api
```

### 2.3 `scripts/lint-boundaries.mjs` 改修要否判定

- 現行 `forbidden` リスト（`scripts/lint-boundaries.mjs` 6〜16 行目）に `"apps/api"` が **既に含まれている**。
- `apps/api/src/env` の文字列を含む import 文は `body.includes("apps/api")` で確実に検知される。
- **結論: 追加トークン不要**。本タスクでは `scripts/lint-boundaries.mjs` を改修しない。
- 万が一 import 経路を `@ubm-hyogo/api/env` などの alias にしたい場合は、現行リストに `"@ubm-hyogo/api"` も既に含まれているため自動カバー（追加不要）。

### 2.4 不変条件 #5 の確認手順（NON_VISUAL）

NON_VISUAL タスクのため screenshot は取らない。代わりに以下の log を Phase 11 evidence として保存:

| log | 取得コマンド | 確認内容 |
| --- | --- | --- |
| `boundary-positive.log` | `node scripts/lint-boundaries.mjs ; echo "exit=$?"` | exit=0、apps/api 内部 import が pass |
| `boundary-negative.log` | probe 配置後 `node scripts/lint-boundaries.mjs 2>&1 ; echo "exit=$?"` | exit=1、`apps/web/__boundary_probe__.ts contains forbidden token: apps/api` 出力 |
| `secret-hygiene-env.log` | `grep -nEi '(token\|secret\|bearer\|api[_-]?key\|oauth)' apps/api/src/env.ts ; echo "exit=$?"` | binding 名コメントのみ hit、実値 0 |
| `secret-hygiene-evidence.log` | 上記 1.2 の evidence hygiene grep | exit=1 |

## 3. 1Password / op 経路への影響評価

| 観点 | 影響 |
| --- | --- |
| ランタイム secret 値 | 本タスクは `Env` の **型のみ**を扱い、secret 値そのものは Cloudflare Secrets / 1Password から実行時に注入される。env.ts は型定義であり、値の取得経路（`scripts/cf.sh` / `op run --env-file=.env`）は無変更 |
| `.env` / `op://` 参照 | 変更無し |
| `wrangler secret put` フロー | 変更無し（05a / 05b で OAUTH / HMAC key を追加する際に利用予定。本タスクは予約欄コメントのみ） |
| `scripts/cf.sh` | 変更無し |

**結論**: 本タスクは binding 型のみで secret 値経路に触れないため、1Password / op 経路への影響は **なし**。

## 4. 検査ゲート集約

| gate | 観点 | 合否基準 | Phase 11 evidence |
| --- | --- | --- | --- |
| H-1 | env.ts secret hygiene grep | binding 名以外 0 件 hit | `secret-hygiene-env.log` |
| H-2 | evidence secret hygiene grep | exit=1（hit 0 件） | `secret-hygiene-evidence.log` |
| B-1 | boundary lint positive | exit 0、apps/api 内部 import 通過 | `boundary-positive.log` |
| B-2 | boundary lint negative | exit 1、forbidden token 検出 | `boundary-negative.log` |
| O-1 | op 経路無影響 | `scripts/cf.sh` / `.env` 差分 0 行 | `git diff scripts/cf.sh .env` の空出力 |

## Phase 連携

| 連携先 | 引き渡す観測 |
| --- | --- |
| Phase 10 | binding 追加時の同期フロー（boundary lint 再実行点） |
| Phase 11 | H-1 / H-2 / B-1 / B-2 / O-1 の log 5 種 |
| Phase 12 | implementation-guide.md に「boundary negative test 手順」を記録 |

## 多角的チェック観点

- **不変条件 #5**: B-2 negative test を通過することで、apps/web からの D1 関連型流入が機械的にブロックされる。
- **secret hygiene**: H-1 / H-2 の二重 grep で env.ts コメントと evidence の双方を gate。
- **後方互換**: 本 Phase は AC-3（02c unit test 維持）には触れず、Phase 6 / 8 が責務。
- **scope 限定**: `scripts/lint-boundaries.mjs` の改修不要を明確化し、リスク・review 範囲を最小化。

## 実行タスク

- [ ] H-1 / H-2 grep コマンドを `outputs/phase-09/main.md` に固定
- [ ] B-1 / B-2 の probe 配置 / 削除手順を runbook 化
- [ ] `scripts/lint-boundaries.mjs` の現行 forbidden リストを参照し改修不要を結論記載
- [ ] op 経路への影響無しを文書化

## 完了条件

- [ ] secret hygiene grep 2 種が定義されている
- [ ] boundary lint positive / negative の手順と期待出力が定義されている
- [ ] `scripts/lint-boundaries.mjs` 改修要否判定（=不要）が結論済み
- [ ] op 経路影響なしが明示されている
- [ ] `outputs/phase-09/main.md` が作成されている

## 成果物

- `outputs/phase-09/main.md`
