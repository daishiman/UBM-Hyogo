# Phase 3 成果物: 設計レビュー書

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | cicd-secrets-and-environment-sync |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-26 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (事前検証手順) |
| 状態 | completed |

---

## 1. Phase 2 設計の 4条件レビュー結果

### 総評

Phase 2 の設計はいずれの条件も PASS または MINOR 課題のみであり、MAJOR 課題はなし。
Phase 4（事前検証手順）へ進む障壁は存在しない。

| 条件 | 判定 | 詳細 |
| --- | --- | --- |
| 価値性 | **PASS** | 設計が AC-1〜5 すべてに直接対応している。実装後に「どこに置くか」の迷いが消える。 |
| 実現性 | **MINOR** | `GOOGLE_SERVICE_ACCOUNT_JSON` のサイズが Cloudflare Secret の制限を超える可能性がある。代替案を検討済み。 |
| 整合性 | **PASS** | branch → environment → Cloudflare Workers のマッピングが一貫している。secret の種別分類が置き場設計と矛盾しない。 |
| 運用性 | **MINOR** | dev と main で API Token を分離する設計は運用コストが増す。ただし漏洩影響の局所化が優先されるため許容。 |

---

## 2. 条件別レビュー詳細

### 2.1 価値性レビュー: PASS

**確認観点:** 設計が誰のどのコストを削減するか、要件の価値を実現できているか

**評価:**
- secret の分類（runtime / deploy / public）が明確になり、インシデント時の revoke 対象を即座に判断できる
- web-cd と backend-deploy の分離により、一方の変更で他方の不要デプロイが走らなくなる
- 1Password を正本とする設計でローカル環境のドリフトを防ぎ、チームメンバーの環境差異による問題を削減できる
- runbook の存在により、rotation / revoke / rollback の担当者が明確になり、インシデント対応時間を短縮できる

**課題:** なし

### 2.2 実現性レビュー: MINOR

**確認観点:** 設計が既存スタック・無料枠で実現できるか

**評価:**
- GitHub Actions / Cloudflare Workers / 1Password CLI はすべて既存サービスで追加費用なし
- wrangler の `--env` フラグと GitHub Environments は無料プランで利用可能
- CI の 3-job 構成（lint / typecheck / build）は GitHub Actions の無料枠（月 2000分）内で収まる見込み

**MINOR 課題 M-1: `GOOGLE_SERVICE_ACCOUNT_JSON` のサイズ制限**

| 項目 | 内容 |
| --- | --- |
| 課題 | Cloudflare Secret の 1エントリあたり最大 1KB（Workers Secrets の制限）を超える可能性がある。Google Service Account JSON は通常 2〜3KB |
| リスク | wrangler secret put が失敗する |
| 代替案 A | JSON を Base64 エンコードして複数の Secret に分割する（`GSA_JSON_PART1`, `GSA_JSON_PART2`）。Workers 側で結合して使用 |
| 代替案 B | JSON の必要フィールドのみを個別の Secret として登録する（`GSA_PRIVATE_KEY`, `GSA_CLIENT_EMAIL` 等） |
| 推奨 | 代替案 B を採用する。JSON 全体を持つより必要フィールドのみを使う方がセキュアで管理しやすい |
| 対応 Phase | Phase 4（事前検証）で実際のサイズを確認し、制限を超える場合は代替案 B で設計を更新する |

### 2.3 整合性レビュー: PASS

**確認観点:** 設計各部が矛盾なく整合しているか

**評価:**
- `dev` branch → `dev` GitHub Environment → staging Cloudflare Workers → staging D1 の一貫したマッピングが確認できる
- `main` branch → `main` GitHub Environment → production Cloudflare Workers → production D1 の一貫したマッピングが確認できる
- secret の分類と置き場の対応が secrets-placement-matrix.md で明確に定義されている
- path filter の設計（`apps/web/**`, `apps/api/**`, `packages/**`）が web-cd / backend-deploy の独立性を保証している
- ci.yml の成功を deploy の前提条件とすることで、品質ゲートと deploy の連携が整合している

**課題:** なし

### 2.4 運用性レビュー: MINOR

**確認観点:** 日常運用・rotate・rollback が実行可能か

**評価:**
- rotation / revoke / rollback の手順が main.md と secrets-placement-matrix.md に明記されている
- wrangler rollback により Cloudflare Workers の素早いロールバックが可能
- 1Password を正本とすることで旧値の参照が常に可能であり、rollback 時の値の参照に困らない
- GitHub Environment の承認フローにより、意図しない production デプロイを防ぐことができる

**MINOR 課題 M-2: dev / main の API Token 分離による管理コスト増**

| 項目 | 内容 |
| --- | --- |
| 課題 | `CLOUDFLARE_API_TOKEN_DEV` と `CLOUDFLARE_API_TOKEN_MAIN` を別管理することで、rotate 対象が2倍になる |
| リスク | 担当者の rotation 漏れ（特に dev Token）が発生しやすくなる |
| 軽減策 | secrets-placement-matrix.md の Rotation 責任マトリクスで rotation 頻度・担当者を明記する。GitHub の Dependabot Secret rotation 機能の活用を検討する |
| 判断 | リスクより得られる漏洩影響の局所化メリット（dev 漏洩が production に影響しない）が大きいため採用維持 |
| 対応 Phase | Phase 5（実装）で rotation 手順を具体化する際に Dependabot 活用の是非を確認する |

**MINOR 課題 M-3: `main` GitHub Environment の CI 必須設定**

| 項目 | 内容 |
| --- | --- |
| 課題 | 個人開発方針では Required reviewers 0名のため、CI 必須チェックが production デプロイの主ゲートになる |
| リスク | 担当者が不在時に緊急デプロイができない |
| 軽減策 | Required reviewers 0名を維持し、branch protection の required status checks と force push 禁止を文書化する |
| 対応 Phase | Phase 4（事前検証）で required status checks と Required reviewers 0名を確認する |

---

## 3. MINOR 課題一覧と対応 Phase

| ID | 課題 | 影響 AC | 対応 Phase | 対応方針 |
| --- | --- | --- | --- | --- |
| M-1 | `GOOGLE_SERVICE_ACCOUNT_JSON` のサイズ制限 | AC-1 | Phase 4 | 実際のサイズを確認し、超過する場合は必要フィールドのみ個別 Secret として登録する |
| M-2 | dev / main API Token 分離による管理コスト増 | AC-5 | Phase 5 | Rotation 責任マトリクスを整備し、Dependabot 活用の是非を確認する |
| M-3 | main GitHub Environment の CI 必須チェック未設定リスク | AC-2 | Phase 4 | Required reviewers 0名と required status checks を確認する |

---

## 4. より単純な代替案の検討と却下理由

### 代替案 A: workflow を1ファイルに統合する（ci-cd.yml）

**概要:** ci.yml / web-cd.yml / backend-deploy.yml を単一ファイルにまとめ、job 分岐で制御する

**却下理由:**
- web と api の独立デプロイ（AC-4）を実現するには path filter を job レベルで設定する必要があるが、GitHub Actions では `jobs.<job>.if` と `paths` の組み合わせが複雑になる
- 単一ファイルが肥大化し、trigger の見通しが悪くなる
- workflow ファイルの分離は「1ファイル1責務」の原則に合致しており、保守性が高い

### 代替案 B: runtime secret も GitHub Secrets に格納し、wrangler deploy 時に環境変数として渡す

**概要:** `GOOGLE_CLIENT_SECRET` を GitHub Secrets に置き、`wrangler deploy --var GOOGLE_CLIENT_SECRET:${{ secrets.GOOGLE_CLIENT_SECRET }}` で Workers に渡す

**却下理由:**
- deploy secret と runtime secret が同一の置き場（GitHub Secrets）に混在し、AC-1 に違反する
- GitHub Actions の実行ログに secret 値がマスクされるとはいえ、漏洩リスクが増す
- Cloudflare Secrets に格納することで Workers runtime のみがアクセスできるという原則が崩れる
- rotate 対象の判断が GitHub Secrets で一元管理されてしまい、責務が不明確になる

### 代替案 C: 1Password を使わず、平文 .env.example をコミットしてローカル管理する

**概要:** `.env.example` にプレースホルダーを記載し、開発者が各自 `.env` を作成・管理する

**却下理由:**
- AC-3 に直接違反する（ローカル正本が 1Password Environments でなくなる）
- チームメンバー間で値のドリフトが発生しやすく、「自分のローカルだけで動く」問題が生じる
- 旧値の参照手段がなく、rollback 時に困る
- シークレット管理方針（1Password Environments を正本とする）と矛盾する

### 代替案 D: dev 環境のデプロイを手動（workflow_dispatch）にする

**概要:** dev へのデプロイも push で自動化せず、手動実行とする

**却下理由:**
- staging での動作確認が形骸化するリスクがある（AC-2 の精神に反する）
- dev ブランチへの merge 後に手動デプロイを忘れると、staging が古いコードのまま review が進む
- feature/* から dev への PR が承認された時点で staging を最新化することがチームの生産性を高める

---

## 5. Phase 4（事前検証手順）への引き継ぎ事項・blockers

### 引き継ぎ事項

| 項目 | 説明 | 優先度 |
| --- | --- | --- |
| M-1 対応: `GOOGLE_SERVICE_ACCOUNT_JSON` のサイズ確認 | 実際の JSON サイズを Cloudflare Secret の制限（1KB）と比較し、超過する場合は必要フィールドのみ個別 Secret として登録する設計に更新する | 高 |
| M-3 対応: CI 必須チェックの確定 | `main` GitHub Environment の Required reviewers 0名と CI 必須チェックを確認する手順を記載する | 高 |
| workflow ファイルのスケルトン確認 | Phase 4 では実際に `.github/workflows/` にスケルトンファイルを作成し、trigger と path filter が設計通り動作するかを dry-run で確認する | 高 |
| 1Password CLI のセットアップ手順 | `op` CLI のインストール・認証手順をローカルセットアップドキュメントに追加する | 中 |
| `CLOUDFLARE_ACCOUNT_ID` の機密レベル確認 | GitHub Secrets ではなく GitHub Variables への格上げが可能かどうかを Cloudflare のセキュリティポリシーで確認する | 低 |

### blockers（なし）

現時点で Phase 4 の実施を妨げるブロッカーはない。
MINOR 課題（M-1, M-2, M-3）はすべて Phase 4 以降で対応可能。

### Phase 4 の主な成果物（想定）

| 成果物 | 内容 |
| --- | --- |
| `outputs/phase-04/main.md` | 事前検証手順書（workflow dry-run / secret size 確認 / CI 必須チェック確認） |
| `outputs/phase-04/verification-checklist.md` | AC-1〜5 の事前検証チェックリスト |
