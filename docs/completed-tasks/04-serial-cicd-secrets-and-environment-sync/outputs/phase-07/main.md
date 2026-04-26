# Phase 7 成果物: 検証項目網羅性チェック書

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | cicd-secrets-and-environment-sync |
| Phase 番号 | 7 / 13 |
| Phase 名称 | 検証項目網羅性 |
| 作成日 | 2026-04-26 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (設定 DRY 化) |
| 状態 | completed |

---

## 1. AC × 検証項目マトリクス

| AC | 内容 | 検証方法 | 検証 Phase | 担当者 | PASS 条件 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | runtime secret / deploy secret / public variable の置き場が一意 | ドキュメント目視 + `rg` でキー名重複確認 | Phase 3, 9, 10 | 開発者 | 3種の配置先が重複なく明記されている |
| AC-2 | dev / main の trigger が branch strategy と一致 | workflow YAML の `on:` 節目視レビュー | Phase 3, 9, 10 | 開発者 | `dev` push → staging, `main` push → production のみ |
| AC-3 | local canonical が 1Password Environments であり平文 .env は正本でない | `.gitignore` 確認 + ドキュメント記述目視 | Phase 3, 9, 10 | 開発者 | `.env` がリポジトリに存在せず、1Password 参照が明記されている |
| AC-4 | web と api の deploy path が分離されている | workflow YAML の job 定義目視 + path filter 確認 | Phase 3, 9, 10 | 開発者 | `apps/web` と `apps/api` が別 job または別 workflow に分離されている |
| AC-5 | secret rotation / revoke / rollback の runbook がある | docs の runbook ファイル存在確認 + 手順完備目視 | Phase 5, 9, 10 | 開発者 | rotation / revoke / rollback 各手順が runbook に記載されている |

---

## 2. 自動検証可能 vs 手動検証必要の分類

### 自動検証可能

| AC | 自動化方法 | 備考 |
| --- | --- | --- |
| AC-1 | `rg` によるキー名重複検索、CI で `env:` 節の重複キー lint | ドキュメント整合は目視補完が必要 |
| AC-2 | GitHub Actions workflow lint (`actionlint`) で `on:` 節検証 | branch 名の文字列一致は設定次第 |
| AC-3 | `git ls-files \| grep '\.env'` で平文 .env 追跡確認 | `.gitignore` 記述の正しさは目視 |
| AC-4 | `actionlint` + path filter 記述の構文検証 | 分離の意図確認は目視 |

### 手動検証必要

| AC | 手動確認内容 | 理由 |
| --- | --- | --- |
| AC-1 | Cloudflare Dashboard / GitHub Secrets UI 実確認 | ツールからアクセス不可 |
| AC-2 | Cloudflare Pages / Workers の実デプロイ先確認 | CI 実行ログの読み合わせが必要 |
| AC-3 | 1Password Environments への実登録確認 | 外部サービス操作 |
| AC-5 | runbook 手順の実演・ドライラン | 実 secret 操作が伴う |

---

## 3. 未カバー AC と docs-first 代替の考え方

### 実環境前提で検証困難な AC

| AC | 実環境依存の理由 | docs-first 代替方針 |
| --- | --- | --- |
| AC-1 | Cloudflare / GitHub の実 UI 確認が必要 | 配置先を仕様書・runbook に一意明記し、レビュー時に目視確認 |
| AC-3 | 1Password への実登録は外部操作 | ローカル secret の取得手順を runbook に記載し「正本は 1Password」と明記 |
| AC-5 | rotation / rollback は実 secret 操作を伴う | ステップと期待結果を runbook に記述し、dry-run チェックリスト形式で代替 |

### docs-first の考え方

実環境への適用前でも、以下の条件を満たせば「docs-first 完了」と見なす。

1. 配置先・手順・判定基準がドキュメントに一意に記述されている
2. 実環境適用時のチェックリストが runbook に存在する
3. Phase 12 の close-out 時に実環境確認を行う旨が明記されている

---

## 4. 検証項目の漏れチェック観点

以下の観点でマトリクスの漏れを確認した。

| 観点 | 確認項目 | 漏れ有無 |
| --- | --- | --- |
| secret 種別網羅 | runtime / deploy / public の3種すべてを AC-1 がカバー | なし |
| 環境網羅 | local / staging(dev) / production(main) の3環境をカバー | なし |
| サービス網羅 | Cloudflare Workers / GitHub Actions / 1Password をカバー | なし |
| ライフサイクル網羅 | rotation / revoke / rollback を AC-5 がカバー | なし |
| deploy 経路網羅 | web と api の分離を AC-4 がカバー | なし |
| branch trigger 網羅 | dev と main の trigger を AC-2 がカバー | なし |
| 平文漏洩防止 | AC-3 が .env 正本問題をカバー | なし |

---

## 5. Phase 8（設定 DRY 化）への引き継ぎ事項

### 確定した情報

| 項目 | 内容 |
| --- | --- |
| AC-1 検証基準 | runtime / deploy / public の3種の配置先が一意に明記されていること |
| AC-2 検証基準 | workflow の `on:` 節が `dev` push と `main` push のみをトリガーとすること |
| AC-3 検証基準 | `.env` がリポジトリに存在せず、1Password 参照が明記されていること |
| AC-4 検証基準 | `apps/web` と `apps/api` の deploy が別 job / 別 workflow で分離されていること |
| AC-5 検証基準 | rotation / revoke / rollback の手順が runbook に完備されていること |

### Phase 8 で対処すべき項目

| 優先 | 項目 | 理由 |
| --- | --- | --- |
| 高 | branch 記法を `dev` に統一 | AC-2 の PASS 条件を満たすため |
| 高 | runtime / deploy / public の表現を全 Phase で統一 | AC-1 の漏れ防止 |
| 中 | web / api の deploy path 記述を DRY 化 | AC-4 の可読性向上 |
| 中 | 1Password を local canonical とする記述を全 Phase へ統一 | AC-3 の整合性 |
| 低 | runbook の手順フォーマットを統一 | AC-5 の品質向上 |

### ブロック条件

本 Phase の成果物（本ファイル）が存在することが、Phase 8 開始の前提条件。

---

## 参照資料

| 種別 | パス |
| --- | --- |
| 正本仕様 | `.claude/skills/aiworkflow-requirements/references/deployment-core.md` |
| branch 戦略 | `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` |
| secrets 管理 | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` |
| 環境変数 | `.claude/skills/aiworkflow-requirements/references/environment-variables.md` |
| Phase 12 同期 | `.claude/skills/task-specification-creator/references/spec-update-workflow.md` |
