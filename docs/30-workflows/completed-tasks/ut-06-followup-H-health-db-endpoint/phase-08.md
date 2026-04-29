# Phase 8: セキュリティ・コンプライアンス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | apps/api `/health/db` D1 疎通 endpoint 実装仕様化 (ut-06-followup-H-health-db-endpoint) |
| Phase 番号 | 8 / 13 |
| Phase 名称 | セキュリティ・コンプライアンス |
| 作成日 | 2026-04-29 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (パフォーマンス・SLO) |
| 状態 | spec_created |
| タスク種別 | implementation / docs-only / NON_VISUAL / api_health |

## 目的

Phase 1〜3 で確定した「不変条件 #5 侵害なし + 503/Retry-After 運用境界 + base case = 案 D（固定パス + X-Health-Token + WAF / IP allowlist 併用）」を前提に、`/health/db` endpoint のセキュリティ脅威モデル（S1〜S7）を固定し、各脅威に対する緩和策・運用責任分界・1Password / Cloudflare Secrets / WAF 系 CLI のオペレーション境界を仕様レベルで確定する。本ワークフローは spec_created に閉じる（実コード未実装）ため、本 Phase は Phase 5 着手後の実装ランブックと Phase 11 smoke で参照される脅威モデル・緩和策の SSOT として記述する。Cloudflare 系 CLI は CLAUDE.md §シークレット管理に従い `scripts/cf.sh` 経由のみで操作する原則を再固定する。

## 真の論点 (true issue)

- 「`/health/db` のセキュリティ実装」ではなく、**「unauth 公開で D1 ping を外部から打たれるリスクを案 D の defense in depth で実質排除し、内部システム情報の disclosure（D1 error message / schema 推測攻撃の materialize）をログ・応答 body の両面から最小化する境界の確立」**が本 Phase の本質。
- 副次的論点として、(1) `HEALTH_DB_TOKEN` の 1Password 経由注入と rotation 手順、(2) Cloudflare WAF rule の運用主体（誰が編集できるか）、(3) 不変条件 #5 違反検知（`apps/web` 側に D1 参照が混入していないかの grep 検査）、(4) 監査トレース（Cloudflare Analytics / Logs での `/health/db` 呼び出し可視化）。

## 脅威モデル（S1〜S7）

| # | 脅威 | 影響 | 主体 | 採用緩和策 |
| --- | --- | --- | --- | --- |
| S1 | unauth 公開時の外部からの D1 ping（probing / DoS） | D1 容量・QPS 消費、可用性低下 | 外部攻撃者 | 案 D（ヘッダ token `/health/db` + Cloudflare WAF rate limit + IP allowlist 併用）の defense in depth |
| S2 | 失敗応答 body / ヘッダ経由の内部情報 disclosure（D1 error message / stack trace） | schema 推測攻撃の足がかり、内部実装露出 | 外部攻撃者 / 観測者 | 応答 body は `{ ok: false, db: "error", error: <sanitized message> }` に限定。具体的な D1 error message は debug log に閉じ、応答 body はサニタイズ済み定型文。`Retry-After: 30` ヘッダのみ運用上必要な値として返す |
| S3 | `HEALTH_DB_TOKEN` の漏洩（リポジトリ commit / ログ流出 / 開発者端末漏洩） | ヘッダ token層の defense in depth が無効化、案 D が実質案 B に縮退 | 開発者ミス / supply chain | 1Password (`op://UBM-Hyogo/cloudflare-api/HEALTH_DB_TOKEN`) で管理。`.env` には op 参照のみ記述。Cloudflare Secrets 注入は `bash scripts/cf.sh` 経由のみ。CLAUDE.md §シークレット管理 と完全整合 |
| S4 | Cloudflare WAF rule の運用主体不明 / 誤って解除される事故 | 案 D の運用制御層が消失、案 D が実質案 A（unauth）に縮退 | 運用ミス / 権限管理不備 | WAF rule 編集権限は Cloudflare account owner（solo 運用前提）に限定。rotation / 編集手順を Phase 12 ドキュメント（implementation-guide.md）に SSOT 化。本仕様 §S4 で運用主体を明記 |
| S5 | 不変条件 #5 違反（`apps/web` から D1 を直接参照するコードの混入） | アーキテクチャ境界破綻、責務境界違反 | 開発者ミス / Phase 5 実装事故 | `apps/web/**` 配下に `D1Database` / `c.env.DB` / `prepare(` / `[[d1_databases]]` が現れないことを Phase 5 / 9 / 11 で grep 検査（後述 §不変条件 #5 違反検知） |
| S6 | ログに D1 error message を生で残すことによる schema 推測攻撃の materialize | 攻撃者がログから schema / table 名を推測 | 外部攻撃者 + 観測者 | 応答 body は定型サニタイズ。debug log（CF Workers `console.log` / Logs）には raw error を残さず、ハッシュ化 or 種別コード化（例: `db_error_code: E_D1_DOWN`）で出力。本仕様レベルでは「raw error を生でログに残さない方針」を確定 |
| S7 | `/health/db` 呼び出しの監査トレース欠如 | 案 D の WAF rule が機能しているか実測できない | - | Cloudflare Analytics dashboard / Workers Logs で `/health/db` request / 200 / 503 / WAF block を集計。Phase 11 smoke で初期可視化を確認、Phase 9 で SLO 監視と接続 |

## 緩和策表

| # | 脅威 | 緩和策 | 実装層 | 検証 Phase |
| --- | --- | --- | --- | --- |
| 1 | S1 | 固定パス + X-Health-Token + WAF rate limit + IP allowlist | Cloudflare WAF + apps/api Hono router | Phase 11 smoke S-03 / S-07 |
| 2 | S2 | 応答 body サニタイズ（error 文字列の定型化） | apps/api Hono handler | Phase 6 異常系 / Phase 11 smoke |
| 3 | S3 | 1Password op 参照 + `scripts/cf.sh` ラッパ + Cloudflare Secrets | 開発者運用 + CI | Phase 12 ドキュメント / Phase 13 user_approval |
| 4 | S4 | WAF rule 編集権限の owner 限定 + rotation SOP | Cloudflare dashboard | Phase 12 implementation-guide |
| 5 | S5 | `apps/web/**` 配下の D1 参照 grep 検査 | リポジトリ全体 | 本 Phase + Phase 9 / 11 |
| 6 | S6 | raw error を生ログに残さない方針 | apps/api Hono handler | Phase 6 異常系 |
| 7 | S7 | Cloudflare Analytics / Workers Logs での request / status 集計 | Cloudflare 側 | Phase 9 SLO / Phase 11 smoke |

## コンプライアンス対応（仕様レベル）

| 項目 | 状態 | 根拠 |
| --- | --- | --- |
| CLAUDE.md §シークレット管理 準拠 | PASS | `HEALTH_DB_TOKEN` を 1Password 管理、`.env` は op 参照のみ、Cloudflare 系 CLI は `scripts/cf.sh` 経由 |
| CLAUDE.md §重要な不変条件 #5 準拠 | PASS | `apps/web` から D1 を直接叩かない設計（state ownership 表で writer / reader に `apps/web` 不在） |
| Cloudflare 系 CLI ラッパ運用 | PASS | `wrangler` 直接実行禁止。`bash scripts/cf.sh d1 ...` / `bash scripts/cf.sh deploy ...` 経由のみ |
| 平文 secret の commit 禁止 | PASS | `HEALTH_DB_TOKEN` 値はリポジトリに残らない |
| OAuth トークンのローカル保持禁止 | PASS | `wrangler login` は使わず `.env` op 参照に一本化 |
| ログへの API Token 転記禁止 | PASS | 仕様書・ログ・実装コードすべてで API Token / OAuth トークン値を出力しない |

## Cloudflare 系 CLI ラッパ (`scripts/cf.sh`) 経由の徹底

| 用途 | 推奨コマンド | 禁止 |
| --- | --- | --- |
| 認証確認 | `bash scripts/cf.sh whoami` | `wrangler whoami` 直接実行 |
| `HEALTH_DB_TOKEN` の Cloudflare Secrets 注入 | `bash scripts/cf.sh secret put HEALTH_DB_TOKEN --config apps/api/wrangler.toml --env production` 相当（具体コマンドは Phase 12 で確定） | `wrangler secret put` 直接実行 |
| D1 binding 確認 | `bash scripts/cf.sh d1 list` | `wrangler d1 list` 直接実行 |
| デプロイ | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production` | `wrangler deploy` 直接実行 |
| rollback | `bash scripts/cf.sh rollback <VERSION_ID> --config apps/api/wrangler.toml --env production` | `wrangler rollback` 直接実行 |

> ラッパが (1) `op run --env-file=.env` 経由の `CLOUDFLARE_API_TOKEN` 動的注入、(2) `ESBUILD_BINARY_PATH` 自動解決、(3) `mise exec --` 経由の Node 24 / pnpm 10 保証、を一括で担う。Claude Code を含む全 AI エージェントに適用される禁止事項として、`.env` 中身の `cat` / `Read` / `grep` 表示・読取り、API Token 値の出力転記、`wrangler login` でのローカル OAuth トークン保持を本仕様書でも再固定する。

## 不変条件 #5 違反検知

`apps/web` 側に D1 参照が混入していないかを以下の grep で検査する（Phase 9 / 11 の検証コマンド SSOT に転記）。

```bash
# apps/web 配下に D1 関連シンボルが現れないことを確認
violations=$(grep -rnE 'D1Database|c\.env\.DB|prepare\(|\[\[d1_databases\]\]' apps/web/ 2>/dev/null || true)
if [ -n "$violations" ]; then
  echo "INVARIANT #5 VIOLATION: apps/web 側に D1 参照が混入しています"
  echo "$violations"
  exit 1
fi
echo "OK: apps/web 配下に D1 参照なし"
```

| 検査対象 | 期待 |
| --- | --- |
| `apps/web/**` 配下の `D1Database` 出現 | 0 件 |
| `apps/web/**` 配下の `c.env.DB` 出現 | 0 件 |
| `apps/web/**` 配下の `.prepare(` 出現（D1 prepare 限定の文脈） | 0 件 |
| `apps/web/**` 配下の `[[d1_databases]]` 出現 | 0 件（wrangler.toml に来た場合は即違反） |

## 実行タスク

1. S1〜S7 の脅威モデルを固定する（完了条件: 全脅威に影響・原因・緩和策がある）。
2. 案 D の defense in depth を緩和策表へ落とす（完了条件: WAF / IP allowlist / ヘッダ tokenの責務が分離されている）。
3. `scripts/cf.sh` 経由のみの Cloudflare 操作境界を明記する（完了条件: wrangler 直接実行を禁止）。
4. 不変条件 #5 違反検知をコマンドと PASS 条件で定義する（完了条件: apps/web 直接 D1 参照が 0 件）。
5. Secret / 1Password / Cloudflare Secrets の実値混入禁止を明文化する（完了条件: placeholder のみ）。
6. Phase 11 smoke と Phase 12 documentation への引き渡しを固定する（完了条件: S1 / S4 / S7 の検証先が記述されている）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/phase-01.md | 真の論点 / AC / 4 条件 |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/phase-02.md | 認証 4 案 / state ownership / 環境変数 |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/phase-03.md | base case = 案 D 採用根拠 / open question |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/outputs/phase-02/main.md | 擬似コード / レスポンス schema / 環境変数 |
| 必須 | CLAUDE.md §重要な不変条件 #5 | apps/web から D1 直接アクセス禁止 |
| 必須 | CLAUDE.md §シークレット管理 | 1Password / `.env` op 参照 / `scripts/cf.sh` 経由 |
| 必須 | scripts/cf.sh | Cloudflare 系 CLI ラッパ正本 |
| 参考 | https://developers.cloudflare.com/waf/ | WAF rule 設計 |
| 参考 | https://developers.cloudflare.com/workers/observability/logs/ | Workers Logs / Analytics |

## 実行手順

### ステップ 1: 脅威モデル S1〜S7 の固定
- 7 脅威を表化、影響・主体・採用緩和策を 1 行ずつ確定する。

### ステップ 2: 緩和策表の作成
- 各脅威に対する実装層と検証 Phase を割り当てる。

### ステップ 3: コンプライアンス対応の宣言
- CLAUDE.md §シークレット管理 / §不変条件 #5 / `scripts/cf.sh` 経由原則の遵守状態を表化。

### ステップ 4: Cloudflare 系 CLI ラッパ徹底の再固定
- `wrangler` 直接実行禁止、`bash scripts/cf.sh ...` 経由のみを再固定する。

### ステップ 5: 不変条件 #5 違反検知 grep の SSOT 化
- `apps/web/**` 配下への D1 参照混入を検出する grep コマンドを Phase 9 / 11 に渡す形で固定。

### ステップ 6: 監査トレース連携の固定
- Cloudflare Analytics / Workers Logs で `/health/db` の request / status / WAF block 可視化を Phase 9 SLO と接続する。

## 統合テスト連携（Phase 11 smoke で S1 / S4 確認）

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | S7（監査トレース）/ Cloudflare Analytics dashboard 構成を SLO 監視へ接続 |
| Phase 11 | smoke S-03（成功）/ S-11（失敗）で S1（外部 probing 耐性）/ S4（WAF rule 動作）を実測確認 |
| Phase 12 | `HEALTH_DB_TOKEN` rotation SOP / WAF rule 編集権限・運用主体を implementation-guide.md に転記 |
| Phase 13 | user_approval ゲートで CLAUDE.md §シークレット管理 / `scripts/cf.sh` 経由原則の遵守を最終確認 |

## 多角的チェック観点

- **不変条件 #5 違反**: `apps/web/**` に D1 参照シンボル（`D1Database` / `c.env.DB` / `prepare(` / `[[d1_databases]]`）が混入していないか。本 Phase で grep SSOT 化、Phase 9 / 11 で実走。
- **disclosure 最小化**: 失敗応答 body から D1 error message / stack trace が漏れていないか。debug log 側でも raw error を生で残していないか。
- **secret hygiene**: `HEALTH_DB_TOKEN` が 1Password op 参照経由でのみ注入され、リポジトリ・ログ・仕様書に値が残っていないか。
- **WAF 運用主体**: Cloudflare WAF rule の編集権限が owner に限定されており、誤解除リスクが Phase 12 SOP で抑止されているか。
- **CLI ラッパ徹底**: `wrangler` 直接実行が仕様書・実装ランブック・runbook で残っていないか。`bash scripts/cf.sh ...` 経由に統一されているか。
- **監査トレース**: `/health/db` の呼び出し / status / WAF block が Cloudflare Analytics / Workers Logs で可視化される構成になっているか。
- **rotation 手順**: `HEALTH_DB_TOKEN` rotation 手順が Phase 12 ドキュメントに残されており、緊急時に即実行可能か。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 脅威モデル S1〜S7 固定 | 8 | spec_created | 7 脅威 |
| 2 | 緩和策表作成 | 8 | spec_created | 検証 Phase 割当 |
| 3 | コンプライアンス対応宣言 | 8 | spec_created | CLAUDE.md 整合 |
| 4 | `scripts/cf.sh` 経由徹底再固定 | 8 | spec_created | wrangler 直接禁止 |
| 5 | 不変条件 #5 違反検知 grep | 8 | spec_created | apps/web 配下 0 件期待 |
| 6 | 監査トレース連携固定 | 8 | spec_created | Phase 9 SLO 接続 |
| 7 | rotation SOP の Phase 12 引渡し | 8 | spec_created | WAF rule 編集権限含む |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | phase-08.md | 本仕様書（脅威モデル / 緩和策 / コンプライアンス / CLI ラッパ徹底 / 不変条件 #5 grep） |
| メタ | artifacts.json | Phase 8 状態の更新 |

## 完了条件

- [ ] 脅威モデル S1〜S7 が 7 件すべて表化されている
- [ ] 緩和策表が脅威 7 件すべてに対応している
- [ ] コンプライアンス対応で CLAUDE.md §シークレット管理 / §不変条件 #5 が PASS と明記
- [ ] `scripts/cf.sh` 経由徹底（wrangler 直接実行禁止）が再固定されている
- [ ] 不変条件 #5 違反検知 grep が SSOT として記述されている
- [ ] 監査トレース（Cloudflare Analytics / Workers Logs）が Phase 9 SLO と接続されている
- [ ] `HEALTH_DB_TOKEN` の 1Password 経由注入ルールが CLAUDE.md と整合している
- [ ] WAF rule の運用主体（owner 限定）と rotation SOP の引渡し先（Phase 12）が明記されている

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `spec_created`
- 不変条件 #5 grep コマンドが本仕様書に記述
- Cloudflare 系 CLI ラッパ経由原則が再固定
- artifacts.json の `phases[7].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 9 (パフォーマンス・SLO)
- 引き継ぎ事項:
  - S7（監査トレース）を SLO 監視と接続する設計
  - 不変条件 #5 違反検知 grep を Phase 9 検証コマンド SSOT に転記
  - `Retry-After: 30` 値を SLO / UT-08 通知間隔と整合させる open question
  - WAF rule の動作確認手順を Phase 11 smoke に渡す
- ブロック条件:
  - 脅威モデル S1〜S7 が未確定
  - 不変条件 #5 違反検知 grep が記述されていない
  - `wrangler` 直接実行を許容する記述が残っている
  - `HEALTH_DB_TOKEN` の管理経路が CLAUDE.md と乖離
