# Phase 2: 環境別差異マトリクス

## 環境別 KV 差異

| 環境 | KV Namespace | バインディング名 | TTL 上限 | 無料枠カウント | リージョン伝播 | 備考 |
| --- | --- | --- | --- | --- | --- | --- |
| local (`wrangler dev`) | preview namespace または miniflare ローカル KV | `SESSION_KV` | 任意 | 対象外 | エミュレーション（伝播なし） | 実 KV にアクセスせず、ローカルプロセス内 KV を使用 |
| local (`wrangler dev --remote`) | preview namespace（実 KV） | `SESSION_KV` | 用途別 TTL | 対象（staging KV と共有） | 実伝播あり | staging KV と同じ namespace を使うため、実書き込み枠を消費 |
| staging | `ubm-hyogo-kv-staging` | `SESSION_KV` | 用途別 TTL | 対象（無料枠） | 実伝播あり | 本番データ混入禁止。production と別 ID |
| production | `ubm-hyogo-kv-prod` | `SESSION_KV` | 用途別 TTL | 対象（100k read/日・1k write/日） | 実伝播あり | 書き込み枠監視必須 |

## 環境別の判断分岐

### local 開発時

- `wrangler dev` をデフォルトで使用し、miniflare のローカル KV エミュレーションで挙動確認
- 実 KV へのアクセスが必要な場合のみ `--remote` を併用し、その場合は staging preview namespace を使う
- ローカル KV では最終的一貫性は再現されない（即時 read 可能）。テストでこれを前提にしてはいけない

### staging

- Cloudflare 上の実 KV を使用。最終的一貫性・無料枠制約が production と同じ条件で発生
- 本番データを意図せず書き込まないため、production と完全に別の namespace ID を使用
- preview namespace は staging KV からさらに分離される（`--preview` フラグ）

### production

- 本番環境。書き込み枠 1,000/日 の監視と無料枠枯渇時のフォールバック方針が必須
- 検証用キー（`verify:phase-05` 等）の書き込みは原則禁止。namespace / binding 存在確認のみで動作テストを完了させる
- delete / 書き込み操作はインフラ担当 + レビュー必須

## 設計上の不変条件

- バインディング名 `SESSION_KV` は全環境で統一（下流タスクが環境差を意識せず参照可能にするため）
- `id` は環境ごとに異なる値を `[env.staging]` / `[env.production]` セクションで分離
- preview_id は staging のみに配置し、production には設定しない（本番への preview 経由アクセスを禁止）
- web 側の `wrangler.toml` には KV バインディングを追加しない（`apps/api` のみ）

## 完了条件

- [x] local / staging / production の差異が表形式で整理されている
- [x] 環境別の判断分岐が明示されている
- [x] 設計上の不変条件が明記されている
