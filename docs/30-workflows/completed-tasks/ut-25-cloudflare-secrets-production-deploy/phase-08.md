# Phase 8: DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare Secrets 本番配置（GOOGLE_SERVICE_ACCOUNT_JSON）(ut-25-cloudflare-secrets-production-deploy) |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 |
| 作成日 | 2026-04-29 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | spec_created |
| タスク種別 | implementation / NON_VISUAL / cloudflare_secrets_deployment |

## 目的

Phase 5 実装ランブック（投入手順スクリプト化）と Phase 11 / 13 の手動 smoke test / 本投入 runbook の間で重複しがちな「`bash scripts/cf.sh secret put` 呼び出し」「`--env staging` / `--env production` の切替手順」「`op read | wrangler secret put` stdin 投入経路」「`wrangler secret list` evidence 取得」「rollback の delete + 再 put 手順」を、単一情報源（SSOT）に集約する DRY 化方針を仕様書として確定し、Phase 9 品質保証へ「同一 secret 投入手順が staging / production で二重コピペされた状態」を持ち越さないようにする。本ワークフローは仕様書整備に閉じる（実投入未実行）ため、本 Phase は Phase 5 / 11 / 13 のテンプレ統合方針として記述する。

## 実行タスク

1. 投入コマンドを `${ENV}` パラメタ化した 1 行テンプレに集約する（完了条件: `bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON --config apps/api/wrangler.toml --env "${ENV}"` の 1 行が SSOT として 1 箇所に固定され、Phase 5 / 11 / 13 はこれを参照するのみ）。
2. staging-first 順序ループを `for ENV in staging production; do ... ; done` 形式で SSOT 化する（完了条件: ループ展開が 1 箇所に集約。bulk 投入禁止原則を維持しつつ順序固定）。
3. stdin 投入経路（`op read "op://Vault/Item/credential" | bash scripts/cf.sh secret put ... --env "${ENV}"`）を 1 関数 `put_sa_json(env)` 相当として SSOT 化する（完了条件: `private_key` 改行保全の根拠と履歴汚染防止策（`HISTFILE=/dev/null` / `set +o history`）を 1 箇所に集約）。
4. `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env <env>` evidence 取得手順を 1 関数 `capture_secret_list(env)` 相当として SSOT 化する（完了条件: 出力先 `outputs/phase-{11,13}/secret-list-evidence-{env}.txt` の命名テンプレを 1 行で固定）。
5. rollback 経路（delete + 旧 key 再 put）を 1 セクションに統合し、Phase 11 / 13 から参照される単一手順とする（完了条件: `bash scripts/cf.sh secret delete GOOGLE_SERVICE_ACCOUNT_JSON --config apps/api/wrangler.toml --env "${ENV}"` → `op read ... | bash scripts/cf.sh secret put ... --env "${ENV}"` の 2 ステップが 1 セクション化）。
6. `wrangler` 直接呼び出し禁止が `bash scripts/cf.sh` 経由に自然に DRY 化されている点を整理し、Phase 5 / 11 / 13 で `wrangler` リテラルが runbook 本体に出現しない（参考リンク・解説を除く）ことをチェック観点として明記する（完了条件: grep 検証コマンドが §検証コマンドに記述）。
7. `outputs/phase-08/main.md` に Before/After テーブル・SSOT 集約箇所・テンプレ展開表を集約する（完了条件: 1 ファイルにすべて記述、spec_created のため「NOT EXECUTED — spec_created」プレースホルダで可）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/phase-02.md | 投入経路 / staging-first 順序 / rollback 経路の base case |
| 必須 | docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-02/main.md | adapter（stdin パイプ）擬似コードの正本 |
| 必須 | docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/phase-05.md | 実装ランブック（投入手順スクリプト化）— spec_created |
| 必須 | docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/phase-07.md | AC マトリクス |
| 必須 | scripts/cf.sh | wrangler ラッパー（op 注入 + esbuild 解決 + mise exec） |
| 必須 | CLAUDE.md（Cloudflare 系 CLI 実行ルール） | wrangler 直接禁止 |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-core.md | Phase 共通骨格 |
| 参考 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-08.md | DRY 化 phase の構造参照 |

## Before / After 比較テーブル（リファクタ対象）

> 詳細は `outputs/phase-08/main.md` 参照。本仕様書は観点と代表例のみ。

### 投入コマンドの SSOT 化

| 対象 | Before（想定） | After | 理由 |
| --- | --- | --- | --- |
| `wrangler secret put` 呼び出し | staging 用 / production 用で 2 行コピペ | `bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON --config apps/api/wrangler.toml --env "${ENV}"` の 1 行 + ループ | wrangler 直接禁止と DRY を同時担保 |
| `--env` 切替 | staging / production 用ブロックが分離 | `for ENV in staging production; do ... ; done` の 1 ループ | 順序事故の発生面を縮小（staging-first 固定） |
| stdin 注入 | 各環境で `op read ... | wrangler ...` が個別記述 | `put_sa_json(env)` 関数（pseudo）に集約 | `private_key` 改行保全 / 履歴汚染防止策の SSOT |
| evidence 取得 | runbook 各所に出力先が散在 | `capture_secret_list(env) → outputs/phase-{NN}/secret-list-evidence-${env}.txt` のテンプレ 1 行 | 命名ドリフト 0 |

### rollback 経路の統合

| 対象 | Before（想定） | After | 理由 |
| --- | --- | --- | --- |
| delete + 再 put 手順 | Phase 11 / 13 で個別記述 | 1 セクション化 + 両 Phase が参照 | 手順ドリフト 0 |
| 旧 key 再取得 | runbook 内に op パス直書き | `op read "op://Vault/UBM-Hyogo/google_service_account_json"` の 1 行 SSOT | 1Password 参照の単一情報源 |
| rollback 確認 | 各 Phase で grep / list 出力 個別記述 | `capture_secret_list(env)` 再利用 | evidence 取得関数の再利用 |

### 用語・命名

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| 「Cloudflare 環境」呼称 | 「stg / prd」「staging / prod」混在想定 | `staging` / `production`（wrangler.toml `[env.*]` と一致）で統一 | wrangler `--env` 値と SSOT 一致 |
| evidence ファイル名 | `secret-list-{env}.txt` / `wrangler-list-{env}.txt` 混在想定 | `secret-list-evidence-{env}.txt` で統一 | artifacts.json 記載と一致 |
| op 参照表記 | `op://...` を payload に直書き | `op read "op://Vault/Item/Field"` で関数化 | 値の payload 転記禁止と整合 |

## 重複コードの抽出箇所

| # | 重複候補 | 抽出先 | 他 Phase 転用可否 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | `bash scripts/cf.sh secret put ... --env "${ENV}"` | Phase 8 SSOT §投入コマンド | 可 | Phase 5 / 11 / 13 |
| 2 | `for ENV in staging production` ループ | Phase 8 SSOT §順序 | 可 | staging-first 固定 |
| 3 | `op read ... | wrangler secret put` stdin パイプ | `put_sa_json(env)` 関数 | 可 | UT25-M-01（gitignore）/ UT25-M-02（--env 漏れ）両方を予防 |
| 4 | `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env <env>` + evidence 保存 | `capture_secret_list(env)` 関数 | 可 | Phase 11 / 13 |
| 5 | rollback の delete + 再 put 2 ステップ | rollback-runbook §rollback | 可 | Phase 11 / 13 共通 |
| 6 | `.dev.vars` gitignore 確認手順 | Phase 5 / 11 で 1 関数化 | 可 | UT25-M-01 受け皿 |

## navigation drift の確認

| チェック項目 | 確認方法 | 期待結果 |
| --- | --- | --- |
| artifacts.json `phases[*].outputs` × 各 phase-NN.md の成果物 path | 目視 + grep `outputs/phase-` | 完全一致 |
| index.md `Phase 一覧` × 実 phase-NN.md ファイル名 | `ls phase-*.md` と突合 | 完全一致 |
| Phase 11 / 13 evidence ファイル名 | `secret-list-evidence-{staging,production}.txt` | テンプレと一致 |
| `bash scripts/cf.sh` 経路の網羅 | `grep -nE 'wrangler ' phase-*.md` で直叩き混入なし | 0 件（参考引用除く） |
| `--env` 値の網羅 | `grep -nE '\-\-env' phase-*.md` | `staging` / `production` のみ |

## 共通化パターン

- 投入関数: `put_sa_json(env)` = `op read "op://Vault/Item/credential" | bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON --config apps/api/wrangler.toml --env "${env}"`
- 順序ループ: `for ENV in staging production; do put_sa_json "${ENV}"; capture_secret_list "${ENV}"; done`
- evidence 関数: `capture_secret_list(env)` = `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env "${env}" > outputs/phase-${PHASE}/secret-list-evidence-${env}.txt`
- rollback: `bash scripts/cf.sh secret delete GOOGLE_SERVICE_ACCOUNT_JSON --config apps/api/wrangler.toml --env "${ENV}"` → `put_sa_json "${ENV}"`（旧 key 版を 1Password 履歴から取得）
- 用語: `staging` / `production` / `secret-list-evidence-{env}.txt` を全 Phase で固定。

## 削除対象一覧

- runbook 本体の `wrangler ...` 直接呼び出し（参考リンク・脚注を除く）。
- 値そのものの payload / runbook / log 転記（UT25-M-01 / UT25-M-02 で再注意喚起）。
- `production-first` 順序を許容する分岐（staging-first 固定に置換）。
- `wrangler login` ローカル OAuth トークンを前提とする手順（CLAUDE.md 禁止項目）。

## 実行手順

### ステップ 1: 投入コマンド SSOT 化
- `bash scripts/cf.sh secret put ... --env "${ENV}"` の 1 行を `outputs/phase-08/main.md` に固定。

### ステップ 2: staging-first ループ SSOT 化
- `for ENV in staging production` を 1 箇所に集約。Phase 5 / 11 / 13 はこの記述を参照。

### ステップ 3: stdin 投入関数 SSOT 化
- `put_sa_json(env)` の擬似コード化 + 履歴汚染防止策（`HISTFILE=/dev/null` / `set +o history`）の 1 箇所固定。

### ステップ 4: evidence 取得関数 SSOT 化
- `capture_secret_list(env)` 擬似コードと出力先テンプレを固定。

### ステップ 5: rollback 統合
- delete + 再 put を 1 セクション化、Phase 11 / 13 が参照。

### ステップ 6: navigation drift 確認
- artifacts.json と各 phase の path 整合 / wrangler 直叩き 0 件 / `--env` 値の限定。

### ステップ 7: outputs/phase-08/main.md 集約
- spec_created 段階では「NOT EXECUTED — spec_created」を明示。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | line budget / link 整合 / wrangler 直叩き 0 検証の前提として DRY 化済み state を渡す |
| Phase 10 | navigation drift 0 / SSOT 集約完了を GO/NO-GO 根拠に使用 |
| Phase 11 | `put_sa_json(staging)` + `capture_secret_list(staging)` を smoke リハーサルで実走 |
| Phase 12 | implementation-guide.md に SSOT テンプレと関数擬似コードを反映 |
| Phase 13 | 本投入 runbook が SSOT 参照のみで成立することを user_approval ゲートで確認 |

## 多角的チェック観点（AIが判断）

- 価値性: テンプレ統合により Phase 5 / 11 / 13 の手順ドリフト 0、ローテーション時の再実行コストが最小化。
- 実現性: shell function / `for` ループのみ。新規依存なし。
- 整合性: 不変条件 #5 違反なし / CLAUDE.md「wrangler 直接禁止」「op 経由注入」「平文 .env 禁止」と整合 / Phase 2 投入経路設計を維持。
- 運用性: 投入 / rollback / evidence の 3 関数で運用が完結、ローテーション時も同テンプレで再実行可。
- 責務境界: SSOT は手順テンプレに閉じ、実 secret 値や 1Password 個別パスは含まない。
- bulk 化禁止: ループ化は staging-first 順序を固定するためであり、staging / production の独立 PUT が破られないことを per-env 関数呼び出しで保証。
- 用語ドリフト: `staging` / `production` / `secret-list-evidence-{env}.txt` の 3 用語を固定。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 投入コマンド SSOT 化 | 8 | spec_created | `bash scripts/cf.sh secret put ... --env "${ENV}"` |
| 2 | staging-first ループ SSOT 化 | 8 | spec_created | `for ENV in staging production` |
| 3 | stdin 投入関数 SSOT 化 | 8 | spec_created | `put_sa_json(env)` + 履歴汚染防止 |
| 4 | evidence 取得関数 SSOT 化 | 8 | spec_created | `capture_secret_list(env)` |
| 5 | rollback 統合 | 8 | spec_created | delete + 再 put |
| 6 | 用語統一 | 8 | spec_created | staging / production / secret-list-evidence-{env}.txt |
| 7 | navigation drift 確認 | 8 | spec_created | wrangler 直叩き 0 件 |
| 8 | outputs/phase-08/main.md 作成 | 8 | spec_created | プレースホルダ可 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | Before/After テーブル / SSOT 集約方針 / 関数擬似コード |
| メタ | artifacts.json | Phase 8 状態の更新 |

## 検証コマンド

```bash
# wrangler 直接呼び出しの混入検出（参考リンク・脚注以外）
grep -nE '^[^#>].*\bwrangler\b' \
  docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/phase-{05,11,13}.md \
  2>/dev/null | grep -vE 'scripts/cf\.sh|参考|reference'

# --env 値の限定確認（staging / production のみ）
grep -nE '\-\-env\s+\S+' \
  docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/phase-*.md \
  | grep -vE '\-\-env\s+(staging|production|"\$\{ENV\}")'

# evidence 命名の SSOT 化確認
grep -nE 'secret-list-evidence-(staging|production)\.txt' \
  docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/

# staging-first ループの SSOT 化確認
grep -nE 'for ENV in staging production' \
  docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-08/main.md
```

## 完了条件

- [ ] Before/After テーブルが 3 区分（投入コマンド / rollback / 用語）すべてで埋まっている
- [ ] 重複コード抽出が 5 件以上列挙されている（本仕様では 6 件）
- [ ] navigation drift（artifacts.json / index.md / phase-NN.md / outputs path）が 0
- [ ] 投入関数 `put_sa_json(env)` / evidence 関数 `capture_secret_list(env)` が SSOT 化
- [ ] rollback 2 ステップ（delete + 再 put）が 1 セクション化
- [ ] wrangler 直接呼び出しが runbook 本体から 0 件
- [ ] outputs/phase-08/main.md がプレースホルダ含めて作成済み

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- 成果物 `outputs/phase-08/main.md` 配置予定（spec_created のためプレースホルダ）
- 用語ドリフト 0 / navigation drift 0
- 関数擬似コード 3 件（put_sa_json / capture_secret_list / rollback）
- artifacts.json の `phases[7].status` が `spec_created`

## 苦戦防止メモ

- shell function は `scripts/cf.sh` の内部に組み込まず、runbook 上の擬似コード SSOT として定義する。実コード化は Phase 5 着手時に shell wrapper の必要性を判定。
- `for ENV in staging production` のループ化は **bulk 投入ではない**。1 ループ内で 1 環境ずつ独立に `wrangler secret put` を実行することを runbook で必ず明記し、staging-first 順序の SSOT を破らない。
- rollback の delete + 再 put 統合時、旧 key の再取得は 1Password 履歴から行う。新規発行ではない点を warning ボックスで隔離する（運用混乱防止）。
- evidence ファイル名は `secret-list-evidence-{env}.txt` で固定。`wrangler-secret-list-{env}.txt` 等の表記揺れが Phase 11 / 13 で発生しないよう grep 検証。

## 次 Phase への引き渡し

- 次 Phase: 9 (品質保証)
- 引き継ぎ事項:
  - SSOT 化済み投入コマンド 1 行（`bash scripts/cf.sh secret put ... --env "${ENV}"`）
  - staging-first ループパターン
  - 関数擬似コード 3 件（put_sa_json / capture_secret_list / rollback）
  - 用語統一（staging / production / secret-list-evidence-{env}.txt）
- ブロック条件:
  - Before/After に空セルが残る
  - navigation drift が 0 にならない
  - wrangler 直接呼び出しが runbook 本体に残存
  - rollback 経路が分散したまま
