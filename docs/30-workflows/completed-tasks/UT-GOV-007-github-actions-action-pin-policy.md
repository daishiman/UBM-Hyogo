# GitHub Actions third-party action 参照方針（SHA pin / tag allowlist）策定 - タスク指示書

## メタ情報

| 項目         | 内容                                                                                |
| ------------ | ----------------------------------------------------------------------------------- |
| タスクID     | UT-GOV-007                                                                          |
| タスク名     | GitHub Actions third-party action pin policy（SHA pin or tag allowlist）策定        |
| 分類         | セキュリティ / supply-chain hardening                                               |
| 対象機能     | governance workflow（branch protection / safety gate / auto-rebase 等）の action 参照 |
| 優先度       | 中（governance workflow の supply-chain 対策が曖昧）                                |
| 見積もり規模 | 小〜中規模                                                                          |
| ステータス   | 未実施 (proposed)                                                                   |
| 親タスク     | task-github-governance-branch-protection                                            |
| 発見元       | outputs/phase-12/unassigned-task-detection.md current U-7                           |
| 発見日       | 2026-04-28                                                                          |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`task-github-governance-branch-protection` で導入する governance workflow（branch protection apply / PR safety gate / auto-rebase / CODEOWNERS 監査等）は、`actions/checkout` `actions/setup-node` `pnpm/action-setup` などの third-party action に依存する。これらは GitHub Actions ランタイムでリポジトリの secret（`GITHUB_TOKEN` / Cloudflare API Token 等）にアクセスし得るため、supply-chain 攻撃の影響範囲が大きい。現状リポジトリには参照方針（SHA pin か moveable tag か、許容 org は何か）が成文化されておらず、レビュー時にも判断基準が無い。

### 1.2 問題点・課題

- `@v4` 等の **moveable tag** は同じタグが将来別 commit を指すことがあり、攻撃された場合に既存ワークフローが一斉汚染される
- SHA pin（40 文字 commit SHA）は安全だが、Dependabot 等の自動更新を入れないと急速に陳腐化する
- 第三者 action（小規模 org）はリポジトリ削除 / transfer の影響でフェッチ不能になることがあり、SHA pin だけでは不十分（fork mirror 戦略が必要）
- governance workflow は branch protection を**書き換える権限**を持ちうるため、ここでの supply-chain 事故は最も影響が大きい

### 1.3 放置した場合の影響

- 第三者 action の compromise が発生した際、governance workflow を経由して branch protection・required checks・CODEOWNERS が改竄されるリスク
- 自己レビュー / CI チェック時に「SHA pin を要求すべきか tag で許容するか」のブレで判断時間が延びる
- 監査時に supply-chain 統制エビデンスが提示できない

---

## 2. 何を達成するか（What）

### 2.1 目的

governance workflow を含む `.github/workflows/` 配下の third-party action 参照方針（SHA pin or tag allowlist）を策定し、運用 runbook と一緒にリポジトリへ commit する。

### 2.2 想定 AC

1. 方式選択（SHA pin / tag allowlist のいずれか、または併用）が文書化されている
2. 適用対象（governance workflow を最低限カバー、最終的に全 workflow を範囲）が明示されている
3. SHA pin 採用時:
   - `.github/dependabot.yml` に `package-ecosystem: github-actions` が追加され、Dependabot PR の自己マージ手順が runbook 化される（solo 運用のため必須レビュアーは設けない）
   - メジャーバージョン追従 SLA（例: 重大脆弱性は 7 日以内 / 通常は 30 日以内）が定義される
4. tag allowlist 採用時:
   - 許容条件（公式 GitHub org `actions/*` のみ / 監査済み org list 等）が明文化される
   - 定期監査方法（四半期ごとに `actions-audit.sh` 実行 / 結果を ADR に記録）が定義される
5. governance workflow（UT-GOV-001 / UT-GOV-002 等）に方針が適用された差分 PR が作成される
6. 自己レビュー観点（SHA 値の確認方法 / Dependabot PR のマージ基準）が CONTRIBUTING / runbook に追記される

### 2.3 スコープ

#### 含むもの

- 方式選択 ADR（`docs/adr/` または governance workflow 仕様書配下）
- `.github/dependabot.yml`（SHA pin 採用時）
- `actions-audit.sh` 雛形（tag allowlist 採用時）
- governance workflow 内 `actions/checkout` `actions/setup-node` `pnpm/action-setup` への適用差分
- runbook（更新手順 / 監査手順 / 事故時の rollback）

#### 含まないもの

- governance workflow 自体の実装（UT-GOV-001 / UT-GOV-002 等で実施）
- non-governance workflow（CI build 等）への即時適用（次 wave で段階適用）
- Cloudflare 等 external サービスの supply-chain ポリシー

### 2.4 成果物

- `docs/30-workflows/task-github-governance-branch-protection/policy/action-pin-policy.md`
- `.github/dependabot.yml`（必要に応じて）
- `scripts/actions-audit.sh`（tag allowlist 採用時）
- governance workflow 適用差分

---

## 3. 影響範囲

- `.github/workflows/`（governance workflow を最初に、順次他 workflow へ）
- `.github/dependabot.yml`
- `scripts/actions-audit.sh`
- 自己レビュー手順（CONTRIBUTING / governance runbook。solo 運用のため必須レビュアーは設けない）
- UT-GOV-001（branch protection apply）/ UT-GOV-002（safety gate）の workflow 仕様

---

## 4. 依存・関連タスク

- 親: `task-github-governance-branch-protection`
- 連携: UT-GOV-001（branch protection apply で同方針適用）
- 連携: UT-GOV-002（PR target safety gate dry-run で同方針適用）
- 関連: UT-GOV-004（required status checks context 同期）— workflow 名が変わると context も変わるため整合維持
- 関連: outputs/phase-2/design.md §4 / outputs/phase-12/implementation-guide.md §4

---

## 5. 推奨タスクタイプ

policy + implementation（ADR 策定 + workflow 適用差分）

---

## 6. 参照情報

- 検出ログ: `outputs/phase-12/unassigned-task-detection.md` current U-7
- 設計: `outputs/phase-2/design.md §4` / `outputs/phase-12/implementation-guide.md §4`
- 既存: `.github/workflows/` 配下の現行 action 参照
- 公式: GitHub Security Lab guidance — "Security hardening for GitHub Actions"
- 公式: GitHub Docs — "Using third-party actions" / "Pinning actions to a full length commit SHA"
- 公式: Dependabot `package-ecosystem: github-actions` 設定リファレンス

---

## 7. 備考

governance workflow は branch protection 自体を書き換えうるため、本リポジトリにおいて supply-chain hardening の優先度が最も高い領域である。最初は governance workflow に限定して厳格な SHA pin を適用し、運用コストを観察したうえで全 workflow に展開する段階導入を推奨する。tag allowlist 単独運用は、`actions/*` 公式 org のみに絞るとしても moveable tag リスクが残るため、最低限 governance workflow には SHA pin を併用すべき。

---

## 8. 苦戦箇所・落とし穴

- **SHA pin の陳腐化**: Dependabot を入れないと solo メンテナーが手動更新するコストが高く、結果として古い SHA が長期間残り脆弱性パッチが当たらなくなる。Dependabot 導入と自己マージ SLA をセットで決めること。
- **moveable tag の汚染リスク**: `@v4` のような major tag は同じタグが別 commit を指すよう更新可能で、上流が compromise されると `@v4` 利用ワークフロー全体が一斉に汚染される。tag allowlist 単独では防げない。
- **Dependabot PR の自己レビュー難易度**: SHA pin を Dependabot で更新すると PR 文面に `v4.1.0 → v4.1.1` ではなく 40 文字 SHA だけが表示され、何が変わったか一目で分からない。solo 運用では自分が唯一のレビュアーとなるため、自己レビュー手順に「上流の release notes / diff URL を確認する」ステップを runbook 化する必要がある。
- **第三者 action の消失**: 小規模 org の action はリポジトリ削除 / transfer / rename が起きると SHA pin していてもフェッチ不能になる。governance workflow が止まると branch protection 運用が破綻するため、critical な action は社内 fork mirror（org 内 fork）を持つ戦略を併記する。
- **適用範囲の段階導入忘れ**: governance workflow にだけ適用して全 workflow に広げないと、CI build 経由の supply-chain 事故で結局 secret が漏洩しうる。段階導入の次 wave タスクを忘れず unassigned-task に登録する。
- **required status checks 名との整合**: workflow をリファクタすると job 名が変わり、UT-GOV-004 で同期する required status checks contexts と zip しなくなる。SHA pin 適用 PR で job 名を変えないか、変える場合は UT-GOV-004 と同じ PR で contexts も更新する。
- **`pnpm/action-setup` のような小規模 org**: pnpm は公式 org だが GitHub の `actions/*` ではない。allowlist を「`actions/*` のみ」と狭く定義すると pnpm setup が使えなくなる。許容 org list を最初から正しく洗い出すこと。
