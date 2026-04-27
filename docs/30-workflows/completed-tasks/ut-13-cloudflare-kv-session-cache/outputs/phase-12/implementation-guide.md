# Phase 12: implementation-guide.md（UT-13 Cloudflare KV セッションキャッシュ設定）

本タスクは **docs-only / spec_created** で、コード実装は対象外。下流の認証実装タスクが本ガイドを参照して実装する。

---

## Part 1: 中学生レベル概念説明

### なぜ必要か

ログインしている人を毎回遠くの台帳まで確認すると、画面の反応が遅くなり、台帳にも負荷がかかる。よく見る情報だけを近くに置くと、確認が速くなり、全体の負担も下がる。

ただし、近くに置いたメモは世界中の場所へ広がるまで少し時間がかかる。そのため「今すぐログアウトさせる」のような大事な判断は、KV だけに任せず、D1 のような正確な台帳でも確認する。

### 何をするか

Cloudflare KV に `SESSION_KV` という決まった入口を用意し、production と staging で別々の保管場所を使う。あわせて、どの情報を何秒だけ覚えるか、どの用途では KV を使わないかを決める。

### 日常の例え

学校の先生が、出席簿を職員室まで毎回取りに行く代わりに、教室の机に「今日よく見る名簿の写し」を置くイメージ。写しを見ると速いが、転校や早退のような大事な変更は、最後に必ず本物の出席簿で確認する。

### Cloudflare KV とは

世界中の Cloudflare サーバーに分散して置かれる「キーと値のメモ帳」。素早く読めるが、メモを書いた内容が世界中に広まるまで時間差（最大 60 秒）が出ることがある。

### セッションキャッシュとは

ログインしたユーザーの「いま誰がログインしているか」を一時的に覚えておく仕組み。毎回データベースに聞きにいかなくて済むので速い。

### TTL とは

情報を覚えておく時間（Time To Live）。1 時間と決めたら 1 時間経つと自動的に消える。

### なぜ環境を分けるか

練習用（staging）と本番用（production）で同じ場所を使うと、本番のお客様データが練習で書き換わってしまうから。だから KV も別々の「メモ帳」を用意して、間違いを防ぐ。

### なぜ「ログアウトに KV を使わない」のか

KV はメモが世界中に広まるまで最大 60 秒かかる。「ログアウトしたい」と押した瞬間に止めたいのに、60 秒間は別のサーバーから「ログイン中」と見えてしまう。だからログアウトのような「すぐ反映してほしい」操作には KV ではなく、もっと厳密なデータベース（D1）を使う。

### 今回作ったもの

| 作ったもの | 内容 |
| --- | --- |
| KV Namespace 設計 | production / staging / preview の名前と `SESSION_KV` バインディングを確定 |
| TTL 方針 | セッションブラックリスト、設定キャッシュ、レートリミットの保持時間を整理 |
| 運用方針 | 無料枠、最終的一貫性、Namespace ID 管理、実装禁止パターンを明文化 |
| 下流 handoff | 認証実装・インフラ適用タスクが参照する runbook と smoke test 手順を作成 |

---

## Part 2: 技術詳細

### wrangler.toml KV バインディング設定例

```toml
# トップレベル（local 開発用）
[[kv_namespaces]]
binding = "SESSION_KV"
id = "<local-preview-id>"
preview_id = "<local-preview-id>"

# TTL は [vars] で集中管理
[vars]
SESSION_BLACKLIST_TTL_SECONDS = "86400"   # 24h
CONFIG_CACHE_TTL_SECONDS     = "3600"     # 1h
RATE_LIMIT_WINDOW_SECONDS    = "60"       # 60s

[env.staging]
[[env.staging.kv_namespaces]]
binding = "SESSION_KV"
id = "<staging-namespace-id>"
preview_id = "<staging-kv-preview-namespace-id>"

[env.production]
[[env.production.kv_namespaces]]
binding = "SESSION_KV"
id = "<production-namespace-id>"
```

### KV Namespace 作成コマンド

### CLIシグネチャ

```bash
wrangler kv:namespace create <namespace-name> [--preview]
wrangler kv:key put --binding=SESSION_KV --env=<env> <key> <value>
wrangler kv:key get --binding=SESSION_KV --env=<env> <key>
wrangler kv:key delete --binding=SESSION_KV --env=<env> <key>
```

### 使用例

```bash
# Namespace 作成
wrangler kv:namespace create ubm-hyogo-kv-prod
wrangler kv:namespace create ubm-hyogo-kv-staging
wrangler kv:namespace create ubm-hyogo-kv-staging --preview

# staging で put → get → delete
wrangler kv:key put --binding=SESSION_KV --env=staging "verify:phase-05" "ok"
wrangler kv:key get --binding=SESSION_KV --env=staging "verify:phase-05"
wrangler kv:key delete --binding=SESSION_KV --env=staging "verify:phase-05"
```

出力された Namespace ID を 1Password の `UBM-Hyogo / Cloudflare / KV / <env>` に保管し、`wrangler.toml` の各環境セクションに記載する。

### TTL 設計指針

| 用途 | TTL | キー命名例 |
| --- | --- | --- |
| セッションブラックリスト | 86400s（24h、JWT 有効期限と一致） | `session:blacklist:<jti>` |
| 設定キャッシュ | 3600s（1h） | `config:<key>` |
| レートリミットカウンタ | 60s〜600s | `rl:<bucket>:<window>` |
| ログアウト即時反映 | KV 不採用（D1 / Durable Objects） | - |

### 一貫性制約と禁止パターン

| 禁止パターン | 理由 | 代替 |
| --- | --- | --- |
| put 直後の get | 最終的一貫性で旧値が返る可能性 | 同一プロセス内のローカル変数で値を保持 |
| delete に依存した即時失効 | 削除も最大 60 秒間は読まれる | D1 のセッションフラグ更新を併用 |
| セッションごとの write | 1k/day 枯渇 | JWT で完結、KV はブラックリストのみ |
| Namespace ID をドキュメント記載 | 取り違えリスク | 1Password 経由で取得 |

### エラーハンドリング

| エラー | 検出方法 | 対応 |
| --- | --- | --- |
| `SESSION_KV` binding 未設定 | Worker 起動時または smoke test の `kv:key get` 失敗 | `wrangler.toml` の対象 env に `kv_namespaces` を追加 |
| Namespace ID 取り違え | staging key が production で見える、または逆 | 1Password の env 別 ID と `wrangler.toml` を2名レビュー |
| JSON parse 失敗 | `getCachedConfig<T>` の `JSON.parse` 例外 | null fallback し、壊れた key は再生成または削除 |
| write 枠逼迫 | Cloudflare Analytics で write/day が 700 超過 | レートリミット用途を縮退し、Durable Objects 移行を検討 |

### エッジケース

| ケース | 方針 |
| --- | --- |
| `put` 直後に別エッジで `get` する | 最大 60 秒の伝搬遅延を前提に、同一処理内の read-after-write を禁止 |
| ログアウト直後の認証判定 | D1 の `revoked_at` を先に確認し、KV は多層防御として使う |
| TTL が短すぎる | 60 秒未満を避け、用途別の既定値を `[vars]` で集中管理 |
| preview Namespace 未作成 | staging preview 用 ID を別途作成し、本番 Namespace を preview に流用しない |

### 設定項目と定数一覧

| 項目 | 値 | 用途 |
| --- | --- | --- |
| `SESSION_KV` | KV binding 名 | Worker から KV を参照する統一名 |
| `SESSION_BLACKLIST_TTL_SECONDS` | `86400` | JWT 失効済み jti の保持時間 |
| `CONFIG_CACHE_TTL_SECONDS` | `3600` | 設定キャッシュの保持時間 |
| `RATE_LIMIT_WINDOW_SECONDS` | `60` | レートリミット window |
| `ubm-hyogo-kv-prod` | production Namespace 名 | 本番用 KV |
| `ubm-hyogo-kv-staging` | staging Namespace 名 | 検証用 KV |

### TypeScript 実装パターン

```ts
export interface Env {
  DB: D1Database
  STORAGE: R2Bucket
  SESSION_KV: KVNamespace      // UT-13 で追加
  SESSION_BLACKLIST_TTL_SECONDS: string  // [vars] から
  CONFIG_CACHE_TTL_SECONDS: string
  RATE_LIMIT_WINDOW_SECONDS: string
}

// セッションブラックリスト
export async function isSessionBlacklisted(env: Env, jti: string): Promise<boolean> {
  const v = await env.SESSION_KV.get(`session:blacklist:${jti}`)
  return v !== null
}

export async function blacklistSession(env: Env, jti: string, ttlSec: number): Promise<void> {
  await env.SESSION_KV.put(`session:blacklist:${jti}`, "1", {
    expirationTtl: ttlSec,
  })
}

// 設定キャッシュ
export async function getCachedConfig<T>(env: Env, key: string): Promise<T | null> {
  const raw = await env.SESSION_KV.get(`config:${key}`)
  return raw ? (JSON.parse(raw) as T) : null
}
```

### テスト構成

| レイヤ | 確認内容 | 成果物 |
| --- | --- | --- |
| Phase 4 | verify suite を DOCUMENTED として定義 | `outputs/phase-04/verify-suite-result.md` |
| Phase 5 | Namespace 作成・binding 設定 runbook | `outputs/phase-05/kv-bootstrap-runbook.md` |
| Phase 9 | 無料枠・secret hygiene・リンク確認 | `outputs/phase-09/quality-report.md` |
| Phase 11 | NON_VISUAL smoke test | `outputs/phase-11/smoke-test-result.md` |

### 動作確認（runbook 抜粋）

```bash
# staging で put → get → delete
wrangler kv:key put --binding=SESSION_KV --env=staging "verify:phase-05" "ok"
wrangler kv:key get --binding=SESSION_KV --env=staging "verify:phase-05"
wrangler kv:key delete --binding=SESSION_KV --env=staging "verify:phase-05"
```

### 無料枠運用

| 上限 | 監視閾値（推奨） |
| --- | --- |
| 100,000 read / day | 70,000（70%）で警告 |
| 1,000 write / day | 700（70%）で警告、900（90%）で対応 |
| 1 GB storage | 700 MB（70%）で警告 |

枯渇時は用途縮退（レートリミット停止 → Durable Objects 移行検討）。

### ログアウト時の deny list 併用設計（推奨）

```ts
// ログアウト処理
export async function logout(env: Env, jti: string, expSec: number) {
  // 1. KV ブラックリスト追加（最終的一貫性、最大 60 秒で全エッジ反映）
  await blacklistSession(env, jti, expSec)
  // 2. D1 セッションフラグも即時更新（強整合）
  await env.DB.prepare("UPDATE sessions SET revoked_at = ? WHERE jti = ?")
    .bind(Date.now(), jti).run()
}

// 認証ハンドラ
export async function authenticate(env: Env, jti: string): Promise<boolean> {
  // 1. D1 で revoked_at を確認（強整合）
  const row = await env.DB.prepare("SELECT revoked_at FROM sessions WHERE jti = ?")
    .bind(jti).first<{ revoked_at: number | null }>()
  if (row?.revoked_at) return false
  // 2. KV でも念のため確認（多層防御）
  if (await isSessionBlacklisted(env, jti)) return false
  return true
}
```

## 関連 spec / 参照

- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` の KV セクション
- `docs/30-workflows/ut-13-cloudflare-kv-session-cache/outputs/phase-02/` 配下（設計成果物）
- `docs/30-workflows/ut-13-cloudflare-kv-session-cache/outputs/phase-05/kv-bootstrap-runbook.md` （runbook）
- `docs/30-workflows/ut-13-cloudflare-kv-session-cache/outputs/phase-07/handoff.md` （下流タスク向け handoff）
