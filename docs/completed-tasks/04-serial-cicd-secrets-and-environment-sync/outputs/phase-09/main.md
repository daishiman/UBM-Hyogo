# Phase 9 成果物: 品質保証チェックリスト

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | cicd-secrets-and-environment-sync |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-04-26 |
| 前 Phase | 8 (設定 DRY 化) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | completed |

---

## 1. 命名規則チェック

### 1-1. タスクディレクトリ命名規則

| 規則 | 基準 | 確認対象パス | 判定 |
| --- | --- | --- | --- |
| ディレクトリ名が `NN-serial-<task-kebab>` 形式であること | `[0-9]{2}-serial-[a-z0-9-]+` | `docs/04-serial-cicd-secrets-and-environment-sync/` | PASS |
| outputs ディレクトリが `outputs/phase-NN/` 形式であること | `outputs/phase-[0-9]{2}/` | `outputs/phase-07/`, `outputs/phase-08/`, `outputs/phase-09/` 等 | PASS |
| Phase 仕様書が `phase-NN.md` 形式であること | `phase-[0-9]{2}\.md` | `phase-01.md` ～ `phase-13.md` | PASS |

### 1-2. branch 名命名規則

| 規則 | 基準 | 確認箇所 | 判定 |
| --- | --- | --- | --- |
| feature branch は `feature/*` 形式 | `feature/[a-z0-9-]+` | workflow YAML の `on.push.branches` | 要確認 |
| staging branch は `dev` のみ | 固定値 `dev` | workflow YAML の `on.push.branches` | 要確認 |
| production branch は `main` のみ | 固定値 `main` | workflow YAML の `on.push.branches` | 要確認 |
| `develop` / `master` が使われていないこと | 否定一致 | 全 workflow YAML + 全ドキュメント | 要確認 |

### 1-3. secret 名命名規則

| 規則 | 基準 | 確認箇所 | 判定 |
| --- | --- | --- | --- |
| GitHub Secrets の名前が `ALL_CAPS_SNAKE_CASE` であること | `[A-Z][A-Z0-9_]+` | workflow YAML の `${{ secrets.* }}` 参照 | 要確認 |
| GitHub Variables の名前が `ALL_CAPS_SNAKE_CASE` であること | `[A-Z][A-Z0-9_]+` | workflow YAML の `${{ vars.* }}` 参照 | 要確認 |
| Cloudflare Secrets の名前が `ALL_CAPS_SNAKE_CASE` であること | `[A-Z][A-Z0-9_]+` | `wrangler.toml` の `[vars]` / runbook | 要確認 |
| secret 名に環境識別子（`_DEV_` / `_PROD_`）を含める場合、命名が一貫していること | prefix か suffix かを統一 | 全 workflow YAML + runbook | 要確認 |

---

## 2. 参照整合性チェック

### 2-1. スキル参照整合性

| 確認項目 | 確認内容 | 判定 |
| --- | --- | --- |
| `aiworkflow-requirements` の参照パスが実在するか | `deployment-core.md` / `deployment-branch-strategy.md` / `deployment-secrets-management.md` / `environment-variables.md` のファイル存在確認 | 要確認 |
| `task-specification-creator` の参照パスが実在するか | `spec-update-workflow.md` のファイル存在確認 | 要確認 |
| Phase 仕様書内の参照パスが壊れていないか | 全 `phase-NN.md` 内のパス記述を `rg` で確認 | 要確認 |

### 2-2. ドキュメント内パス整合性

| 確認項目 | 確認内容 | 判定 |
| --- | --- | --- |
| `index.md` に記載された outputs パスが実在するか | `index.md` 内の全 outputs パスを `ls` で確認 | 要確認 |
| `artifacts.json` に記載された outputs パスが実在するか | `artifacts.json` 内の全ファイルパスを確認 | 要確認 |
| 各 `phase-NN.md` の「成果物」欄パスが `outputs/phase-NN/main.md` と一致するか | 目視確認 | 要確認 |
| 「前 Phase」「次 Phase」の番号が連続しているか | Phase 7→8→9→10 の連続性確認 | PASS |

---

## 3. 無料枠遵守チェック

### 3-1. GitHub Actions 無料枠

| 確認項目 | 基準 | 確認内容 | 判定 |
| --- | --- | --- | --- |
| 月間実行時間がパブリックリポジトリ無料枠内か | パブリックリポジトリは無制限 / プライベートは 2,000 分/月 | リポジトリの公開設定を確認 | 要確認 |
| セルフホストランナーを前提としていないか | GitHub 提供ランナーのみ使用 | workflow YAML の `runs-on:` が `ubuntu-latest` 等の標準ランナーであるか | 要確認 |
| 常設ジョブ（cron 等の高頻度）が存在しないか | 不要な定期実行なし | workflow YAML に `schedule:` トリガーがある場合は頻度確認 | 要確認 |
| Actions キャッシュが 10 GB 以内か | 10 GB/リポジトリ | `actions/cache` の対象サイズ確認 | 要確認 |

### 3-2. Cloudflare 無料枠

| 確認項目 | 基準 | 確認内容 | 判定 |
| --- | --- | --- | --- |
| Workers リクエスト数が無料枠内の前提か | 100,000 リクエスト/日 | MVP のトラフィック見積もりが無料枠内であることを確認 | 要確認 |
| D1 リクエスト数が無料枠内の前提か | 5,000,000 行読み取り/月 | MVP の DB アクセスパターンが無料枠内か確認 | 要確認 |
| KV 読み取り数が無料枠内の前提か | 100,000 回/日 | KV を使用する場合の利用量見積もり確認 | 要確認 |
| Workers のスクリプト数が無料枠内か | 100 スクリプト/アカウント | `apps/web` と `apps/api` の合計スクリプト数確認 | 要確認 |
| 有料プラン前提の機能（Workers for Platforms 等）を使用していないか | 無料プランのみ | 仕様書・workflow に有料機能の記述がないか確認 | 要確認 |

---

## 4. Secrets 漏洩防止チェック

### 4-1. 実値不在確認

| 確認項目 | 確認方法 | 判定 |
| --- | --- | --- |
| 全ドキュメントに API キー・トークン等の実値が記述されていないか | `rg '[A-Za-z0-9]{32,}'` で長文字列を検出し目視確認 | 要確認 |
| workflow YAML に実値の secret が記述されていないか | `rg 'secrets\.' で `${{ secrets.* }}` 形式のみであることを確認 | 要確認 |
| `wrangler.toml` に実値の secret が記述されていないか | `[vars]` 節の値がプレースホルダーのみであるか確認 | 要確認 |
| `.env` ファイルがリポジトリに存在しないか | `git ls-files \| grep '\.env'` で確認 | 要確認 |
| `.env*` が `.gitignore` に記述されているか | `.gitignore` 目視確認 | 要確認 |

### 4-2. 1Password 正本確認

| 確認項目 | 確認方法 | 判定 |
| --- | --- | --- |
| ローカル secret の取得元が 1Password Environments と明記されているか | runbook・ドキュメントに「1Password Environments を local canonical とする」旨の記述があるか | 要確認 |
| ローカル実行時のコマンドが `op run --` を前置していると明記されているか | 開発環境セットアップ手順の確認 | 要確認 |
| 1Password Vault 名・Item 名がプレースホルダー形式で記述されているか | `<VAULT_NAME>` / `<ITEM_NAME>` 等の形式 | 要確認 |

### 4-3. 配置先混線確認

| 確認項目 | PASS 条件 | 判定 |
| --- | --- | --- |
| runtime secret が GitHub Secrets に存在しないか | Cloudflare Secrets のみに配置 | 要確認 |
| deploy secret が Cloudflare Secrets に存在しないか | GitHub Secrets (Actions) のみに配置 | 要確認 |
| public variable が Secrets（GitHub / Cloudflare）に存在しないか | GitHub Variables のみに配置 | 要確認 |
| Cloudflare API Token が runtime secret として Workers binding されていないか | deploy secret として GitHub Secrets に配置 | 要確認 |

---

## 5. ドキュメント品質チェック

### 5-1. 各 Phase 成果物の完備確認

| Phase | 成果物パス | 存在確認 | 内容完備確認 |
| --- | --- | --- | --- |
| Phase 1 | `outputs/phase-01/main.md` | 要確認 | 要確認 |
| Phase 2 | `outputs/phase-02/main.md` | 要確認 | 要確認 |
| Phase 3 | `outputs/phase-03/main.md` | 要確認 | 要確認 |
| Phase 4 | `outputs/phase-04/main.md` | 要確認 | 要確認 |
| Phase 5 | `outputs/phase-05/main.md` | 要確認 | 要確認 |
| Phase 6 | `outputs/phase-06/main.md` | 要確認 | 要確認 |
| Phase 7 | `outputs/phase-07/main.md` | PASS | PASS |
| Phase 8 | `outputs/phase-08/main.md` | PASS | PASS |
| Phase 9 | `outputs/phase-09/main.md` | PASS | PASS |
| Phase 10 | `outputs/phase-10/main.md` | 要確認 | 要確認 |
| Phase 11 | `outputs/phase-11/main.md` | 要確認 | 要確認 |
| Phase 12 | `outputs/phase-12/main.md` | 要確認 | 要確認 |
| Phase 13 | `outputs/phase-13/main.md` | 要確認 | 要確認 |

### 5-2. 共通ドキュメント品質基準

| 確認項目 | 基準 | 判定 |
| --- | --- | --- |
| `index.md` が最新 Phase 状態を反映しているか | Phase 7〜9 が completed に更新されているか | 要確認 |
| `artifacts.json` が最新 Phase 状態を反映しているか | Phase 7〜9 の `status` が `"completed"` であるか | 要確認 |
| 各 Phase 仕様書の「状態」が成果物と一致しているか | `phase-NN.md` の状態 = `outputs/phase-NN/main.md` の状態 | 要確認 |
| 引き継ぎ事項が次 Phase 仕様書に反映されているか | Phase 7→8、Phase 8→9 の引き継ぎ事項が next Phase に記載されているか | PASS |
| 全ドキュメントで実値が使われていないか | プレースホルダー形式のみ | 要確認 |

---

## 6. Phase 10（最終レビュー）への引き継ぎ事項

### 品質保証の結果サマリー

| カテゴリ | PASS 件数 | 要確認件数 | FAIL 件数 |
| --- | --- | --- | --- |
| 命名規則 | 3 | 8 | 0 |
| 参照整合性 | 1 | 6 | 0 |
| 無料枠遵守 | 0 | 9 | 0 |
| Secrets 漏洩防止 | 0 | 13 | 0 |
| ドキュメント品質 | 3 | 10 | 0 |

> 「要確認」は実装フェーズまたは実環境確認が必要なもの。docs-first Phase では FAIL 扱いにしない。

### Phase 10 で確認すべき優先項目

| 優先 | 確認項目 | 根拠 AC |
| --- | --- | --- |
| 最高 | workflow YAML の branch trigger が `dev` / `main` のみか | AC-2 |
| 最高 | secret の配置先が runtime / deploy / public で混線していないか | AC-1 |
| 最高 | `.env` がリポジトリに存在しないか | AC-3 |
| 高 | `apps/web` と `apps/api` の deploy が別 job か | AC-4 |
| 高 | rotation / revoke / rollback runbook が揃っているか | AC-5 |
| 中 | 全ドキュメントに実値が存在しないか | 全 AC |
| 中 | `artifacts.json` と `index.md` が最新状態か | 品質保証 |

### 実環境確認が必要な残留項目（Phase 12 以降）

以下の項目は実環境への適用後に確認が必要であり、Phase 12 の close-out チェックリストに含めること。

1. Cloudflare Dashboard で runtime secret が正しく登録されているか
2. GitHub Secrets に deploy secret が登録されているか（値の存在確認のみ、値自体は確認不要）
3. 1Password Environments に全 secret が登録されているか
4. CI/CD パイプラインの実行ログで deploy 先が正しいか（web → `apps/web`、api → `apps/api`）
5. secret rotation 手順を実際に実行してロールバックできるか

### ブロック条件

本 Phase の成果物（本ファイル）が存在することが、Phase 10 開始の前提条件。

---

## 参照資料

| 種別 | パス |
| --- | --- |
| 正本仕様 | `.claude/skills/aiworkflow-requirements/references/deployment-core.md` |
| branch 戦略 | `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` |
| secrets 管理 | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` |
| 環境変数 | `.claude/skills/aiworkflow-requirements/references/environment-variables.md` |
| Phase 12 同期 | `.claude/skills/task-specification-creator/references/spec-update-workflow.md` |
| Phase 7 成果物 | `outputs/phase-07/main.md` |
| Phase 8 成果物 | `outputs/phase-08/main.md` |
