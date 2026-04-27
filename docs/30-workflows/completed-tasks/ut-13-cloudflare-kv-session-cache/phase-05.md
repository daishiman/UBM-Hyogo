# Phase 5: セットアップ実行

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare KV セッションキャッシュ設定 (UT-13) |
| Phase 番号 | 5 / 13 |
| Phase 名称 | セットアップ実行 |
| 作成日 | 2026-04-27 |
| 前 Phase | 4 (事前検証手順) |
| 次 Phase | 6 (異常系検証) |
| 状態 | completed |

## 目的

docs-only / spec_created タスクとして、KV Namespace の production / staging 作成手順、`wrangler.toml` バインディング設計、Workers からの最小 read/write 動作確認手順を runbook として固定する。実リソース作成・コード経由の動作確認は下流のインフラ実行タスクまたは認証実装タスクに委譲し、本 Phase では安全に再現できる手順とレビュー観点を完成条件にする。

## 実行タスク

- production / staging 用 KV Namespace を `wrangler kv:namespace create` で作成する手順を定義する
- `apps/api/wrangler.toml` に追加する `[[env.production.kv_namespaces]]` / `[[env.staging.kv_namespaces]]` 設計例を定義する
- バインディング名（`SESSION_KV`）と Namespace ID の対応表管理ルールを定義する
- Workers (apps/api) からの最小 read/write 動作テスト手順を定義する
- runbook と sanity check を outputs に記録する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | KV binding 設定例・wrangler コマンド |
| 必須 | docs/30-workflows/ut-13-cloudflare-kv-session-cache/phase-04.md | verify suite 結果・確認済みコマンド |
| 必須 | docs/30-workflows/ut-13-cloudflare-kv-session-cache/phase-02.md | 設計済みの Namespace 命名・バインディング名・TTL 方針 |
| 必須 | docs/30-workflows/ut-13-cloudflare-kv-session-cache/index.md | AC・無料枠制約 |

## 実行手順

### ステップ 1: KV Namespace 作成手順の定義

```bash
# production 用 Namespace 作成
wrangler kv:namespace create ubm-hyogo-kv-prod

# staging 用 Namespace 作成（preview フラグで preview Namespace も作成）
wrangler kv:namespace create ubm-hyogo-kv-staging
wrangler kv:namespace create ubm-hyogo-kv-staging --preview
```

- 出力された `id` / `preview_id` を控える
- Namespace ID 単体は API token ではないが、環境取り違え防止のためレビュー対象として扱う
- 実 ID をリポジトリに固定しない運用を採る場合は、CI/CD で `wrangler.toml` を生成または置換する仕組みを同じタスクで用意する
- Namespace ID の取り違えを防ぐため、production / staging で別ターミナル・別作業時間帯に作成することを推奨

### ステップ 2: wrangler.toml への KV バインディング設計

`apps/api/wrangler.toml` に追加する設計例を定義する。実 ID を repo に置く場合は環境取り違えレビューを必須にし、実 ID を repo に置かない場合は CI/CD 生成方式を明記する。

```toml
# Cloudflare KV バインディング
# 用途: セッション・設定キャッシュ・レートリミット
# 無料枠: 100,000 read/day, 1,000 write/day, 1 GB storage
# 最終的一貫性: 書き込み伝搬最大 60 秒（即時反映が必要な操作には不適）
# Namespace ID は権限そのものではないが、環境取り違え防止のためレビュー対象にする

[env.staging]
[[env.staging.kv_namespaces]]
binding = "SESSION_KV"
id = "<staging-kv-namespace-id>"
preview_id = "<staging-kv-preview-namespace-id>"

[env.production]
[[env.production.kv_namespaces]]
binding = "SESSION_KV"
id = "<production-kv-namespace-id>"
```

### ステップ 3: バインディング名と Namespace ID の対応表記録

| 環境 | バインディング名 | Namespace 名 | Namespace ID 管理場所 |
| --- | --- | --- | --- |
| production | `SESSION_KV` | `ubm-hyogo-kv-prod` | 1Password: `UBM-Hyogo / Cloudflare / KV / production` |
| staging | `SESSION_KV` | `ubm-hyogo-kv-staging` | 1Password: `UBM-Hyogo / Cloudflare / KV / staging` |
| staging (preview) | `SESSION_KV` | `ubm-hyogo-kv-staging-preview` | 1Password: `UBM-Hyogo / Cloudflare / KV / staging-preview` |

- 対応表自体（バインディング名 / Namespace 名）はドキュメント化する。Namespace ID の掲載可否は `wrangler.toml` 生成方式とセットで判断する
- 下流タスク（セッション実装・レートリミット実装）は本対応表を参照してバインディング名を利用する

### ステップ 4: Workers からの最小 read/write 動作テスト手順

下流の実装タスクで `apps/api` 内に一時的な検証エンドポイント（または既存ヘルスチェック拡張）を用意し、以下を確認する。

```ts
// 検証用最小コード（Phase 5 完了後に削除またはガード化）
// c.env.SESSION_KV.put("verify:phase-05", "ok", { expirationTtl: 60 })
// const v = await c.env.SESSION_KV.get("verify:phase-05")
// 期待: v === "ok"
```

- staging で `wrangler dev --env staging --remote` 経由で実 KV にアクセスする
- production への動作テストは本番への書き込みを避け、namespace / binding 存在確認を基本にする
- 動作確認後、検証用キー（`verify:phase-05`）は明示的に削除する

### ステップ 5: runbook と sanity check の記録

- 上記手順を `outputs/phase-05/kv-bootstrap-runbook.md` に runbook として記録する
- sanity check を outputs に記録する

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | verify suite の PASS を前提に実行 |
| Phase 6 | 本 Phase の実行結果を異常系検証の前提とする |
| Phase 7 | AC matrix の証跡として runbook を参照 |

## 多角的チェック観点（AIが判断）

- 価値性: AC-1〜AC-3 の手順と判定基準が全て定義されているか
- 実現性: wrangler.toml の設計と read/write 動作テスト手順が実行可能な粒度か
- 整合性: production と staging で別 Namespace ID が割り当てられ、取り違えがないか
- 運用性: Namespace ID が機密管理されており、runbook が次の担当者でも再現できる粒度か

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | production KV Namespace 作成手順 | 5 | completed | AC-1 |
| 2 | staging KV Namespace 作成手順（preview 含む） | 5 | completed | AC-1 |
| 3 | wrangler.toml バインディング設計 | 5 | completed | AC-2 |
| 4 | Namespace ID 管理ルール | 5 | completed | repo 掲載可否とレビュー基準 |
| 5 | Workers からの read/write 動作確認手順 | 5 | completed | AC-3 |
| 6 | runbook 記録 | 5 | completed | outputs/phase-05/ |
| 7 | sanity check 記録 | 5 | completed | outputs/phase-05/ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/kv-bootstrap-runbook.md | KV Namespace 作成・バインディング設定 runbook |
| ドキュメント | outputs/phase-05/kv-binding-mapping.md | バインディング名 / Namespace 名 対応表（ID は除く） |
| ドキュメント | outputs/phase-05/read-write-verification.md | Workers からの read/write 動作確認手順 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- production / staging の KV Namespace 作成手順が定義されている
- wrangler.toml に追加する `[[env.production.kv_namespaces]]` / `[[env.staging.kv_namespaces]]` 設計が定義されている
- Namespace ID の repo 掲載可否、レビュー方法、外部管理場所が定義されている
- Workers から `SESSION_KV.put` / `SESSION_KV.get` を確認する手順が定義されている
- runbook と sanity check が outputs/phase-05/ に記録されている
- AC-1〜AC-3 が全て達成されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- read/write 動作確認手順が証跡として記録されている
- 検証用キー（`verify:phase-05`）の削除手順が記録されている
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 6 (異常系検証)
- 引き継ぎ事項: KV Namespace 作成手順・バインディング設計・動作確認手順を異常系検証の対象として渡す
- ブロック条件: production / staging いずれかの作成手順またはバインディング確認手順が未定義の場合は次 Phase に進まない

## runbook

### KV セットアップ runbook

**前提条件:**
- wrangler@4.85.0 以上がインストール済み
- `wrangler login` 完了
- Phase 4 verify suite が全 PASS
- 1Password Environments への書き込み権限を保有

**実行手順:**

1. KV Namespace を作成する:
   ```bash
   wrangler kv:namespace create ubm-hyogo-kv-prod
   wrangler kv:namespace create ubm-hyogo-kv-staging
   wrangler kv:namespace create ubm-hyogo-kv-staging --preview
   ```
2. 出力された Namespace ID の管理場所と repo 掲載可否を決める
3. `apps/api/wrangler.toml` に KV バインディングを追加する方式を決める
4. 実 ID を repo に置かない場合は、CI/CD で Cloudflare Secrets / Variables から実 ID を注入する生成手順を用意する
5. Workers から動作確認を行う手順を記録する:
   ```bash
   wrangler dev --env staging --remote
   # /health-kv 等の検証エンドポイントで put/get の成功を確認
   ```
6. 検証用キーを削除する:
   ```bash
   wrangler kv:key delete --binding=SESSION_KV --env staging "verify:phase-05"
   ```

**rollback 手順（バインディングを撤回する場合）:**

```bash
# wrangler.toml から該当 [[kv_namespaces]] セクションを削除
# 必要に応じて Namespace 自体を削除（データ消失するため慎重に）
wrangler kv:namespace delete --namespace-id <namespace-id>
```

### sanity check

| チェック | コマンド | 期待結果 |
| --- | --- | --- |
| Namespace 存在確認 | `wrangler kv:namespace list` | `ubm-hyogo-kv-prod` / `ubm-hyogo-kv-staging` が含まれる |
| wrangler.toml バインディング確認 | `grep -A3 "kv_namespaces" apps/api/wrangler.toml` | `binding = "SESSION_KV"` が含まれる |
| ID 管理確認 | `grep -E "[a-f0-9]{32}" apps/api/wrangler.toml` | 実 ID 掲載方針と一致している |
| Workers read/write 確認手順 | 検証エンドポイントへの HTTP リクエスト | `200 OK` かつ get 値が put 値と一致する手順がある |
| 検証用キー削除確認 | `wrangler kv:key list --binding=SESSION_KV --env staging` | `verify:phase-05` が含まれない |
