# Phase 10 成果物: Cloudflare API Token Scope 検証手順

> 本ドキュメントは Phase 10 セキュリティレビューの一部として、inventory script が使用する Cloudflare API Token の scope が **read-only** に限定されていることを検証する手順を定義する。`phase-10.md` R-3 観点の SSOT。実打ちは受け側実装タスク `UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-IMPL-001` 完了後に手動で実施する。

## 1. メタ情報

| 項目 | 値 |
| --- | --- |
| 対象タスク | UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-001 |
| 対象 token | 1Password `op://...` 参照経由で `bash scripts/cf.sh` に揮発注入される `CLOUDFLARE_API_TOKEN` |
| 検証目的 | token scope が read-only のみであることを保証し、mutation endpoint 誤呼び出し（T-2 権限昇格）を構造的に防止 |
| 検証タイミング | 受け側実装タスク Phase 11 実打ち前 / 後の両方で実施 |

## 2. 許容 scope（read-only のみ）

inventory script が API allowlist で使用する 3 endpoint をカバーするのに必要な最小 scope のみを許容する。

| # | scope | 必要理由 | 関連 endpoint |
| --- | --- | --- | --- |
| 1 | `Account.Workers Scripts:Read` | expected Worker / 旧 Worker の存在確認 | `GET /accounts/{account_id}/workers/scripts` |
| 2 | `Zone.Workers Routes:Read` | route pattern と target Worker の取得 | `GET /zones/{zone_id}/workers/routes` |
| 3 | `Zone.Zone:Read` | zone 情報の参照（Zone ID 経由のメタ取得） | `GET /zones/{zone_id}` |
| 4 | `Account.Worker:Read`（または同等の Workers Domains read scope） | custom domain の取得 | `GET /accounts/{account_id}/workers/domains` |

> Cloudflare Dashboard 上の正確な scope 名は UI 改訂で変動するため、token 作成時に「Read 権限のみが付与されたテンプレート」を選択し、`Edit` / `Write` 相当が含まれていないことを目視確認すること。

## 3. 禁止 scope（mutation 系）

以下が token に含まれている場合は **NO-GO**。1Password 上の token を再発行し、read-only scope に絞り直すこと。

| # | scope | 理由 |
| --- | --- | --- |
| 1 | `Account.Workers Scripts:Edit` | scripts の deploy / delete を実行可能になる |
| 2 | `Zone.Workers Routes:Edit` | route の付け替え / 削除を実行可能になる |
| 3 | `Account.Workers KV:Edit` | KV 書き込みが可能になる |
| 4 | `Zone.DNS:Edit` | DNS record の変更が可能になる |
| 5 | `Account.Workers Routes:Edit` | account-level routes の mutation が可能になる |
| 6 | `Account.Account Settings:Edit` | account 設定変更が可能になる |
| 7 | `User.User Details:Edit` | ユーザー設定変更が可能になる |
| 8 | `*.* :Edit` / `*.* :Write` 全般 | 過大権限 |

## 4. 検証手順

### ステップ 1: ラッパー認証確認

```bash
bash scripts/cf.sh whoami
```

期待出力: 認証済み account 名 / email / token メタ情報。token 値そのものは出力されない。

### ステップ 2: Cloudflare Dashboard での scope 目視確認

1. Cloudflare Dashboard → My Profile → API Tokens を開く
2. inventory script で使用する token を選択
3. Permissions セクションを確認
4. §2 の許容 scope のみが付与されており、§3 の禁止 scope が含まれていないことを目視確認

> Token 値そのものを画面表示・コピーしないこと。scope のみ確認する。

### ステップ 3: API による read-only 性能の動的検証

下記 read-only 呼び出しが成功し、mutation 試行が `403 Forbidden` 相当で拒否されることを確認する（mutation 試行は **絶対に実行しない**。手動 dashboard 確認のみで担保する）。

```bash
# 認証 + read-only エンドポイント疎通の確認
bash scripts/cf.sh whoami
# 期待: 200 OK 相当の account 情報
```

> mutation endpoint への hit テストは production 副作用ゼロ宣言（phase-10.md §production 副作用ゼロ宣言）に違反するため **実行禁止**。token scope が write を含むかは Dashboard 目視確認のみで判定する。

### ステップ 4: 1Password 側 metadata 確認

| 項目 | 確認内容 |
| --- | --- |
| Vault | inventory script が参照する vault が production secret vault と分離されていること |
| Item name | `CLOUDFLARE_API_TOKEN_READONLY` 等、read-only であることが名前で識別可能 |
| op 参照 | `.env` 内の `op://Vault/Item/Field` が想定 vault / item を指していること |
| token 値の表示禁止 | AI 含むあらゆる経路で token 値そのものを `cat` / `Read` / `grep` しない |

## 5. NO-GO 判定条件

以下のいずれかに該当した場合は NO-GO とし、token を再発行する:

- §3 の禁止 scope が 1 つでも付与されている
- token scope が「全権限テンプレート（Global API Key 相当）」になっている
- token に有効期限が設定されておらず、永続的に存在し続ける
- 1Password vault が production secret vault と未分離で、誤って production 系 secret に書き込み可能な scope と同居している
- `wrangler login` 経由のローカル OAuth token が `~/Library/Preferences/.wrangler/config/default.toml` に保持されている

## 6. 再発行手順（NO-GO 時）

1. Cloudflare Dashboard で問題の token を **revoke**
2. 同 dashboard で §2 許容 scope のみで token を新規作成
3. 1Password 上の `CLOUDFLARE_API_TOKEN`（read-only vault）を新トークン値で更新
4. `bash scripts/cf.sh whoami` で再認証確認
5. 受け側実装タスク Phase 11 を再実行し evidence を再取得

## 7. evidence への記録

検証結果は受け側実装タスク Phase 11 の `outputs/phase-11/secret-leak-grep.md` の隣接 evidence として以下フォーマットで記録する（**token 値そのものは記録しない**）:

```markdown
## Cloudflare API Token Scope 検証結果

- 検証日時: <ISO8601>
- 検証者: <bash scripts/cf.sh whoami の account 名>
- 確認許容 scope: Account.Workers Scripts:Read / Zone.Workers Routes:Read / Zone.Zone:Read / Account.Worker:Read
- 禁止 scope の検出: 0 件
- 1Password vault 分離: OK
- 判定: GO
```

## 8. NO-GO 3 軸との対応

| NO-GO 軸 | 本ドキュメントでの担保 |
| --- | --- |
| mutation endpoint 誤呼び出し | §2 / §3 で write scope を構造的に排除 |
| secret 漏洩 | §4 ステップ 2 / 4 で token 値の画面表示・コピー禁止 |
| wrangler 直接実行 | §5 NO-GO 判定で `wrangler login` ローカル保持を禁止 |

## 9. 関連ドキュメント

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-10/security-review.md` | R-3 観点 / 4 条件 PASS / Design GO 判定 |
| `outputs/phase-10/threat-model.md` | T-2 権限昇格脅威モデル詳細 |
| CLAUDE.md「Cloudflare 系 CLI 実行ルール」 | `bash scripts/cf.sh` 経由強制 / `wrangler login` 禁止 |
| `scripts/cf.sh` | op + esbuild 解決込みラッパー実体 |
