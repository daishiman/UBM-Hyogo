# Phase 8: リファクタリング (DRY 化)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | GitHub Secrets / Variables 配置実行 (ut-27-github-secrets-variables-deployment) |
| Phase 番号 | 8 / 13 |
| Phase 名称 | リファクタリング (DRY 化) |
| 作成日 | 2026-04-29 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | pending |
| タスク種別 | implementation / NON_VISUAL / github_secrets_variables_cd_enablement |

## 目的

Phase 5 実装ランブック（`gh secret set` / `gh variable set` / `gh api repos/.../environments/...` のコマンド系列）と Phase 11 手動 smoke / Phase 13 本番適用 runbook の間で重複しがちな「secret / variable 名の参照表」「`op read` → 一時環境変数 → `--body "$VAR"` → `unset` の 4 段パターン」「environment 作成コマンド」「dev push smoke 手順」「1Password Last-Updated メモ運用」を、単一情報源 (SSOT) に集約するリファクタ手順を仕様書として確定する。Phase 9 品質保証へ「同概念のロジックが複数箇所に並ぶ」「staging / production / repository-scoped で三重コピペされた `gh secret set`」「runbook と op-sync-runbook で重複する Last-Updated メモ手順」状態を持ち越さないことを目標とする。本ワークフローは仕様書整備に閉じる（実コード未実装・実 secret 配置未実施）ため、本 Phase は Phase 5 着手時 / Phase 13 本番適用時に参照される refactor 指針として記述する。実コードや helper script は本タスクで生成しないが、「将来 helper 化候補」として `gh-secret-set-from-op.sh` 等の helper 化方針を spec レベルで明記する。

## 実行タスク

1. Secret / Variable 名と op 参照の対応を SSOT テーブルとして 1 箇所に集約する（完了条件: `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` / `DISCORD_WEBHOOK_URL` / `CLOUDFLARE_PAGES_PROJECT` × scope × op 参照 が 1 表に集約され、Phase 5 / 11 / 13 すべての参照先になっている）。
2. `op read` → 一時環境変数 → `gh secret set --body "$VAR"` → `unset` の 4 段パターンを単一テンプレ関数として擬似コード化する（完了条件: テンプレが 1 箇所に集約され、3 件の Secret 配置すべてが同テンプレへの参照のみで成立）。
3. environment 作成コマンド（`gh api repos/{owner}/{repo}/environments/{name} -X PUT`）を `staging` / `production` の 2 環境に対し for-each で展開する手順テンプレを 1 本化する（完了条件: environment list = `["staging", "production"]` を変数化し、各ステップが env 引数を取る関数として記述されている）。
4. `apply-runbook.md` の environment 作成 / secret 配置 / variable 配置 / dev push smoke / Last-Updated メモ更新の 5 セクションを 1 つのテンプレに統合し、Phase 11（リハーサル用）と Phase 13（本番用）で同テンプレを参照する（完了条件: テンプレが 1 ファイル化され、Phase 11 / 13 の runbook が同テンプレへの参照のみで成立する）。
5. 1Password Last-Updated メモ運用（Item Notes に同期日時を追記）を 1 つの手順関数として定義し、`op-sync-runbook.md` と `apply-runbook.md` の両方から参照する（完了条件: メモ更新擬似コードが 1 箇所に集約されている）。
6. dev push smoke 検証（CD run URL 取得 / Discord 通知到達 / 未設定耐性確認）を `verify_cd_green()` 関数として擬似コード化する（完了条件: Phase 11 / 13 の動作確認セクションが同関数への参照のみで成立）。
7. 「将来 helper 化候補」として `gh-secret-set-from-op.sh` / `gh-env-create.sh` / `gh-variable-set.sh` の helper 化方針を spec レベルで明記する（完了条件: 3 件の helper 名・責務・将来 IaC 化フェーズへの登録が記述されている。実コードは本タスクで作らない）。
8. outputs/phase-08/main.md に Before/After テーブル・SSOT 集約箇所・helper 化方針を集約する（完了条件: 1 ファイルにすべて記述。pending 段階のため「NOT EXECUTED — pending」プレースホルダで可）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-27-github-secrets-variables-deployment/phase-02.md | base case（lane 1〜5 / 配置決定マトリクス / `gh` CLI 草案） |
| 必須 | docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-02/main.md | `gh` CLI コマンド草案の正本 |
| 必須 | docs/30-workflows/ut-27-github-secrets-variables-deployment/phase-05.md | 実装ランブック（pending）— `op read` + `gh secret set` 系列 |
| 必須 | docs/30-workflows/ut-27-github-secrets-variables-deployment/phase-07.md | AC マトリクス（pending）— DRY 化が AC-13 / AC-14 に与える影響 |
| 必須 | docs/30-workflows/unassigned-task/UT-27-github-secrets-variables-deployment.md §苦戦箇所・知見 | リスク源（§1 environments scope / §3 if 評価不能 / §6 二重正本 drift） |
| 必須 | CLAUDE.md（シークレット管理）| `op` 参照 + 一時環境変数パターンの SSOT |
| 参考 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-08.md | DRY 化 phase の構造参照 |
| 参考 | scripts/cf.sh | `op run --env-file=.env` ラッパーの先行事例 |

## Before / After 比較テーブル（リファクタ対象）

> 詳細は `outputs/phase-08/main.md` を参照。本仕様書には観点と代表例のみ記載。
> 依存成果物は Phase 2 base case（lane §3 secret / lane §4 variable / lane §2 environments / lane §5 動作確認）、Phase 6 異常系（401 / 422 / Discord 未設定）、Phase 7 AC マトリクスとし、Phase 8 はこれらの重複・表記揺れを整理して Phase 9 へ渡す。

### secret / variable 名と op 参照（SSOT 化）

| 対象 | Before（想定） | After | 理由 |
| --- | --- | --- | --- |
| 4 件の名前 / scope / op 参照 | runbook / op-sync / Phase 5 実装スニペットで個別ハードコード | `secrets-inventory.md`（Phase 8 SSOT 表）へ集約。各 phase は表へのリンクのみ | secret 名の typo / scope ドリフトを 0 にする |
| `CLOUDFLARE_API_TOKEN` の environment 別配置 | `staging` 用 / `production` 用で 2 ブロックコピペ | `for env in staging production; do gh secret set ... --env "$env"; done` | environment 別配置の重複削減 |
| `op://Vault/Item/Field` 表記 | runbook / op-sync で表記揺れ（Vault 名・Item 名・Field 名） | SSOT 表で固定（`op://UBM-Hyogo/Cloudflare/api_token_{env}` 等） | 表記ドリフト 0 |
| Phase 11 / 13 参照 | 各 phase の runbook がそれぞれ secret 名を直書き | SSOT テーブルへの参照のみ | 表記揺れ 0 |

### `op read` → `gh secret set` 4 段パターン（テンプレ関数化）

| 対象 | Before（想定） | After | 理由 |
| --- | --- | --- | --- |
| 値注入 | `gh secret set NAME --body "$(op read op://...)"` を直書き（3 件 × 2 環境 = 最大 6 箇所重複） | `set_secret_from_op(NAME, OP_REF, [ENV])` 関数に集約。内部で `op read` → 一時変数 → `gh secret set` → `unset` を実行 | shell history 残存抑制パターンの SSOT 化 |
| `unset` 忘れ | 各箇所で `unset VAR` を書き忘れる事故 | テンプレ関数末尾で必ず `unset` | secret 残存事故 0 |
| エラーハンドリング | `op read` 失敗時の挙動が個別実装 | テンプレ関数内で `set -euo pipefail` + 失敗時 unset を保証 | 失敗時の secret 残存抑制 |
| ログ出力 | `gh secret set` 標準出力に値が混入する事故懸念 | テンプレ関数で `> /dev/null 2>&1` 経路 + 「OK NAME」のみ出力 | ログ転記禁止 (AC-13) の SSOT |

### environment 作成（テンプレ統合）

| 対象 | Before（想定） | After | 理由 |
| --- | --- | --- | --- |
| `staging` / `production` 作成 | 2 ブロックコピペ | `for env in staging production; do create_environment "$env"; done` | コピペ削減 |
| reviewers / wait_timer 設定 | runbook ごとに散在 | `create_environment(name, [reviewers], [wait_timer])` 関数に集約。MVP は `reviewers=[]` / `wait_timer=0` 固定 | 設定ドリフト 0 |
| 冪等性 | `gh api ... -X PUT` の冪等性が暗黙 | 「PUT は冪等。既存の場合は更新扱い」をコメントで明記 | 再実行安全性の SSOT |

### `apply-runbook.md` 手順テンプレ統合

| 対象 | Before（想定） | After | 理由 |
| --- | --- | --- | --- |
| 5 セクション | Phase 11（リハーサル）/ Phase 13（本番）で個別記述 | 共通テンプレ `apply-runbook.template.md` に集約し、両 Phase が参照 | 手順ドリフト 0 |
| Last-Updated メモ更新 | runbook と op-sync-runbook で重複記述 | `update_op_last_updated(item, env)` 関数に集約 | §6 二重正本 drift 防止の SSOT |
| dev push smoke | runbook 末尾と smoke-log で 2 重記述 | `verify_cd_green(branch, expected_jobs)` 関数に集約 | §3 Discord 評価不能問題と同根の検証 SSOT |
| 担当者明記 | runbook 各所に分散 | runbook 冒頭の「担当 / 連絡経路」表 1 箇所に集約 | solo 運用前提の明確化 |

### 用語・命名

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| 「正本」表記 | 「正本」「canonical」「正規」混在 | 「正本 (canonical) = 1Password」併記で全 Phase 統一 | Phase 2 state ownership と整合 |
| 「派生コピー」呼称 | 「コピー」「同期値」「mirrored」混在 | 「派生コピー (GitHub Secrets / Variables)」で統一 | 1Password 正本 / GitHub 派生 の関係を強調 |
| scope 種別 | 「repo scope」「リポジトリ scope」「repository-scoped」混在 | 「repository-scoped」「environment-scoped」に統一 | GitHub 公式表記に合わせる |
| 「未設定耐性」呼称 | 「Discord 未設定 OK」「webhook empty」混在 | 「DISCORD_WEBHOOK_URL 未設定耐性」で統一 | §3 苦戦箇所と整合 |

## 重複コードの抽出箇所

| # | 重複候補 | 抽出先 | 他 Phase 転用可否 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | secret 名 × scope × op 参照 表 | Phase 8 SSOT (`secrets-inventory.md` 相当) | 可 | Phase 5 / 11 / 13 すべて |
| 2 | `set_secret_from_op(NAME, OP_REF, [ENV])` テンプレ関数 | apply-runbook テンプレ | 可 | 3 件 × 最大 2 環境 = 最大 6 呼び出し |
| 3 | `create_environment(name)` テンプレ関数 | apply-runbook テンプレ | 可 | staging / production |
| 4 | `set_variable(NAME, VALUE, [ENV])` テンプレ関数 | apply-runbook テンプレ | 可 | `CLOUDFLARE_PAGES_PROJECT` 1 件 |
| 5 | `for env in staging production; do ... ; done` ループパターン | apply-runbook テンプレ | 可 | environment / environment-scoped secret |
| 6 | `update_op_last_updated(item, env)` 関数 | op-sync-runbook | 可 | 1Password Item Notes 更新 |
| 7 | `verify_cd_green(branch, expected_jobs)` 関数 | apply-runbook §verify | 可 | dev / main 共通 |
| 8 | `verify_no_secret_leak()` 関数（CI ログから secret 値検出） | apply-runbook §verify | 可 | AC-13 検証用 |

## 将来 helper 化候補（spec レベル明記・本タスクでは実装しない）

| helper script 名（候補） | 責務 | 入力 | 出力 | 配置先（将来） | 登録先 |
| --- | --- | --- | --- | --- | --- |
| `scripts/gh-secret-set-from-op.sh` | `op read` → 一時変数 → `gh secret set --body` → `unset` の 4 段パターン実行 | NAME / OP_REF / [ENV] | `OK NAME [ENV]` のみ標準出力 | scripts/ 配下 | Phase 12 unassigned-task-detection.md |
| `scripts/gh-env-create.sh` | `gh api repos/.../environments/{name} -X PUT` の冪等実行 | NAME / [reviewers] / [wait_timer] | `OK env=NAME` | scripts/ 配下 | 同上 |
| `scripts/gh-variable-set.sh` | `gh variable set NAME --body VALUE [--env ENV]` のラッパー | NAME / VALUE / [ENV] | `OK NAME=VALUE [ENV]` | scripts/ 配下 | 同上 |

> **本タスクのスコープ**: helper 化方針の明記のみ。実 helper script の実装と PR 化は **次 Wave 以降の IaC 化フェーズ**（案 D `1password/load-secrets-action` / 案 C Terraform GitHub Provider 検討と同タイミング）で実施。Phase 12 unassigned-task-detection.md に 3 件の helper を新規 ID で登録する。

## navigation drift の確認

| チェック項目 | 確認方法 | 期待結果 |
| --- | --- | --- |
| artifacts.json `phases[*].outputs` と各 phase-NN.md の成果物 path | 目視 + grep `outputs/phase-` | 完全一致 |
| index.md `Phase 一覧` 表 × 実 phase-NN.md ファイル名 | `ls phase-*.md` と突合 | 完全一致 |
| Phase 13 出力 path（apply-runbook.md / op-sync-runbook.md / verification-log.md / main.md） | artifacts.json と本仕様書の整合 | 4 ファイル一致 |
| secret / variable 名表記 | `grep -E 'CLOUDFLARE_(API_TOKEN|ACCOUNT_ID|PAGES_PROJECT)|DISCORD_WEBHOOK_URL'` | 4 件の正規名のみ |
| op 参照表記 | `grep -E 'op://UBM-Hyogo/'` | Vault 名統一 |
| Phase 11 / 13 runbook の参照先 | テンプレ統合後の link 一致 | リンク切れ 0 |

## 共通化パターン

- secret 配置エントリ: `set_secret_from_op(NAME, OP_REF, [ENV])` が `op read` → 一時変数 → `gh secret set` → `unset` を 1 関数で完結。
- environment 作成: `create_environment(name)` が `gh api ... -X PUT` を冪等に実行。
- 命名規則: secret / variable 名は GitHub Actions 公式表記に従い大文字スネーク。op 参照は `op://UBM-Hyogo/{Item}/{Field}` で統一。
- 手順順序: 「上流確認 → environment 作成 → secret 配置 → variable 配置 → dev push smoke → 1Password Last-Updated メモ更新」固定。
- 用語: 「正本 (canonical) = 1Password」「派生コピー = GitHub Secrets / Variables」「repository-scoped / environment-scoped」を全 Phase で固定。

## 削除対象一覧

- Phase 11 / 13 runbook で重複していた `gh secret set` 個別記述（テンプレ参照に置換）。
- secret 値を `--body` 直書きする擬似コードの混入（AC-13 違反、Phase 6 異常系で検出された場合は除去）。
- 同名 repository-scoped と environment-scoped の併存を許容する分岐コード（運用ルール違反、「同名併存禁止」に置換）。
- `CLOUDFLARE_PAGES_PROJECT` を Secret として配置する分岐（AC-4 違反、Variable に統一）。
- `if: ${{ secrets.X != '' }}` の評価不能パターンを正解として扱う記述（§3 苦戦箇所と整合する代替設計に置換）。

## 実行手順

### ステップ 1: SSOT インベントリ表の作成
- secret 名 × scope × op 参照 × Cloudflare 側スコープ × 命名規則 を 1 表に集約。Phase 5 / 11 / 13 から参照させる。

### ステップ 2: テンプレ関数の Before/After 提示
- `set_secret_from_op` / `create_environment` / `set_variable` / `update_op_last_updated` / `verify_cd_green` の 5 関数を擬似コードで提示。

### ステップ 3: apply-runbook テンプレ統合
- environment 作成 / secret 配置 / variable 配置 / dev push smoke / Last-Updated メモ更新 の 5 セクションを 1 テンプレ化し、Phase 11 / 13 はそれを参照する形にする。

### ステップ 4: helper 化方針の明文化
- 3 件の helper script 名・責務・登録先（Phase 12 unassigned-task-detection.md）を確定。実コードは作らない。

### ステップ 5: navigation drift 確認
- artifacts.json と各 phase-NN.md の path 整合（Phase 13 outputs 4 ファイル）。

### ステップ 6: outputs/phase-08/main.md に集約
- pending 段階では「NOT EXECUTED — pending」を明示。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | line budget / link 整合 / 1Password 参照リンク実在確認の前提として DRY 化済み state を渡す |
| Phase 10 | navigation drift 0 / SSOT 集約完了を GO/NO-GO の根拠に使用 |
| Phase 11 | 共通テンプレ `apply-runbook.template.md` を smoke リハーサルで実走 |
| Phase 12 | helper 化候補 3 件を unassigned-task-detection.md に formalize / implementation-guide.md にテンプレ関数を反映 |
| Phase 13 | 本適用 runbook が共通テンプレ参照のみで成立することを user_approval ゲートで確認 |

## 多角的チェック観点

- 価値性: テンプレ関数の SRP 化で Phase 6 異常系（401 / 422 / Discord 未設定）のテスト容易性が向上、Phase 11 / 13 リハーサル/本番の手順ドリフトが排除される。
- 実現性: bash 関数 + `op` CLI + `gh` CLI の組み合わせは既存技術範囲。新規依存なし（helper 化は将来）。
- 整合性: 不変条件 #5 違反なし / CLAUDE.md「1Password 正本 / `.env` 実値禁止」と完全整合 / `scripts/cf.sh` 思想（op run + ラッパー）と同型。
- 運用性: テンプレ 1 ファイル化で手順修正点が局所化、Last-Updated メモ運用が op-sync 1 箇所に集約。
- 責務境界: テンプレ関数は op 読み取り → secret PUT → unset に閉じ、CD 動作確認 / 1Password 監査 / runbook 手順とは別 SSOT。
- 同名併存禁止: ループ化しても repository-scoped と environment-scoped の重複が破られないことを「scope 引数明示」設計で保証。
- 用語ドリフト: 「正本 / 派生コピー / scope 種別 / 未設定耐性」表記揺れ 0。
- secret 値転記禁止: 全テンプレ関数で `--body` への値直書きを禁止し、`op read` → 一時変数経由のみに固定。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | secret / variable 名 SSOT インベントリ表 | 8 | pending | 4 件 + scope + op 参照 |
| 2 | `set_secret_from_op` テンプレ関数擬似コード | 8 | pending | 4 段パターン SSOT |
| 3 | `create_environment` / `set_variable` テンプレ関数 | 8 | pending | 2 環境 / 1 変数 |
| 4 | apply-runbook テンプレ統合 | 8 | pending | Phase 11 / 13 共通参照 |
| 5 | `update_op_last_updated` / `verify_cd_green` 関数 | 8 | pending | op-sync / 動作確認 SSOT |
| 6 | helper 化方針の明文化（3 件） | 8 | pending | Phase 12 unassigned に登録予定 |
| 7 | 用語統一 | 8 | pending | 正本 / 派生コピー / scope / 未設定耐性 |
| 8 | navigation drift 確認 | 8 | pending | 4 ファイル + index 表 |
| 9 | outputs/phase-08/main.md 作成 | 8 | pending | プレースホルダ可 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | リファクタ対象テーブル（対象 / Before / After / 理由）と SSOT 集約方針 / helper 化候補 |
| メタ | artifacts.json | Phase 8 状態の更新 |

## 検証コマンド

```bash
# secret / variable 名表記の網羅確認（4 件の正規名のみ）
grep -rEn 'CLOUDFLARE_(API_TOKEN|ACCOUNT_ID|PAGES_PROJECT)|DISCORD_WEBHOOK_URL' \
  docs/30-workflows/ut-27-github-secrets-variables-deployment/

# テンプレ関数の検出
grep -nE 'set_secret_from_op|create_environment|set_variable|update_op_last_updated|verify_cd_green' \
  docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-08/main.md

# helper 化候補 3 件の登録確認
grep -nE 'gh-secret-set-from-op\.sh|gh-env-create\.sh|gh-variable-set\.sh' \
  docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-08/main.md

# Phase 11 / 13 runbook がテンプレ参照になっていること
grep -nE 'apply-runbook\.template\.md' \
  docs/30-workflows/ut-27-github-secrets-variables-deployment/phase-11.md \
  docs/30-workflows/ut-27-github-secrets-variables-deployment/phase-13.md \
  2>/dev/null

# secret 値直書き混入の検出（NG パターン）
grep -rnE '\-\-body\s+["'\'']?gh[a-zA-Z0-9_-]{20,}|\-\-body\s+["'\'']?eyJ[A-Za-z0-9_-]{20,}' \
  docs/30-workflows/ut-27-github-secrets-variables-deployment/ \
  || echo "OK: 値直書きなし"
```

## 完了条件

- [ ] Before/After テーブルが 5 区分（SSOT インベントリ / 4 段パターン / environment 作成 / runbook テンプレ / 用語）すべてで埋まっている
- [ ] 重複コード抽出が 5 件以上列挙されている（本仕様では 8 件）
- [ ] navigation drift（artifacts.json / index.md / phase-NN.md / outputs path）が 0
- [ ] テンプレ関数が 5 件以上に分解されている
- [ ] `apply-runbook.template.md` が SSOT として確定し、Phase 11 / 13 が参照する設計になっている
- [ ] helper 化候補 3 件が Phase 12 unassigned-task-detection.md への登録方針付きで明記されている
- [ ] secret 値転記禁止（`--body` 直書き禁止）が Before/After + 検証コマンドで保証されている
- [ ] outputs/phase-08/main.md がプレースホルダ含めて作成済み

## タスク100%実行確認【必須】

- 全実行タスク（8 件）が `pending`（spec_created）
- 成果物 `outputs/phase-08/main.md` 配置予定（pending のためプレースホルダ）
- 用語ドリフト 0 / navigation drift 0
- テンプレ関数 5 件以上 / helper 化候補 3 件
- artifacts.json の `phases[7].status` が `pending`

## 苦戦防止メモ

- テンプレ関数は bash function で十分実現可能だが、Phase 5 着手時に「helper script に切り出すか、runbook 内 inline 関数で済ますか」を明示的に判定する。MVP は inline で可。
- ループ化（`for env in staging production`）は **bulk 配置ではない**。1 ループ反復ごとに 1 PUT を per-env 独立に実行することを runbook で必ず明記し、environment-scoped 上書き事故（§1）を防ぐ。
- `op read` の出力を `$(...)` で `--body` に直接渡すと shell history に値が残る OS / 設定があるため、必ず一時変数に代入 → `--body "$VAR"` → `unset VAR` の順で記述する。
- `apply-runbook.template.md` は実 PUT を含まない仕様レベルテンプレ。Phase 13 で実行者承認後の本番版を派生させる。
- helper 化を本タスクで前倒し実装すると scope 違反。必ず Phase 12 unassigned-task-detection.md に登録のみで止める。

## 次 Phase への引き渡し

- 次 Phase: 9 (品質保証)
- 引き継ぎ事項:
  - SSOT 化済み secret / variable インベントリ表（4 件）
  - テンプレ関数 5 件（`set_secret_from_op` / `create_environment` / `set_variable` / `update_op_last_updated` / `verify_cd_green`）
  - `apply-runbook.template.md` の参照網（Phase 11 / 13）
  - helper 化候補 3 件（Phase 12 unassigned 登録予定）
  - 用語統一済みの 4 用語（正本 / 派生コピー / scope / 未設定耐性）
- ブロック条件:
  - Before/After に空セルが残る
  - navigation drift が 0 にならない
  - テンプレ関数が 5 件未満
  - secret 値直書きが残る
  - helper 化候補が Phase 12 への登録方針を欠く
