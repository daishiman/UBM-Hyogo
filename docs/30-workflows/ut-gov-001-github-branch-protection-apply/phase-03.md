# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | GitHub branch protection apply / rollback payload 正規化 (ut-gov-001-github-branch-protection-apply) |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-28 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | completed |
| タスク種別 | implementation / NON_VISUAL / github_governance |

## 目的

Phase 2 の設計に対して、4 つ以上の代替案（A: gh api 直叩き + payload Git 管理 = base case / B: Terraform `github_branch_protection_v3` / C: Octokit script (Node) / D: gh api + 2 段階適用 emphasizing UT-GOV-004 absent）を比較し、9 観点（4 条件 + 5 観点）で PASS / MINOR / MAJOR を付与する。base case = 案 A を採用根拠付きで確定し、UT-GOV-004 完了を NO-GO 条件として 3 重明記の最終箇所に固定する。判定結果は **PASS（with notes）** とし、notes は Phase 5 / 11 / 13 への申し送り事項として明記する。

## 実行タスク

1. 代替案を 4 案以上列挙する（A / B / C / D）。
2. 9 観点 × 案で PASS / MINOR / MAJOR を付与する（マトリクスに空セルゼロ）。
3. base case（案 A）を選定理由付きで確定する。
4. PASS / MINOR / MAJOR の判定基準を定義する。
5. 着手可否ゲートを定義し、UT-GOV-004 完了を NO-GO 条件として明記する（重複明記 3/3）。
6. open question を Phase 4 / 5 / 11 / 12 / 13 に振り分ける。

## 依存タスク順序（UT-GOV-004 完了必須）— 重複明記 3/3

> **UT-GOV-004（`required_status_checks.contexts` 実在 job 名同期）が completed でなければ、本 Phase の着手可否ゲートは強制 NO-GO となる。**
> 親仕様 §8.2 で「最重要苦戦箇所」として明記されている merge 不能事故の唯一の再発防止策であり、Phase 1 §依存境界・Phase 2 §依存タスク順序・本 Phase §着手可否ゲートの 3 箇所で重複明記する。
> 例外: UT-GOV-004 と同時完了する場合に限り、`contexts=[]` の 2 段階適用フォールバックで GO 可。ただし第 2 段階の再 PUT を Phase 13 完了条件に組み込むこと。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-02.md | レビュー対象設計 |
| 必須 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-02/main.md | base case 構造 |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md §8 | 苦戦箇所 |
| 参考 | https://registry.terraform.io/providers/integrations/github/latest/docs/resources/branch_protection_v3 | 案 B 評価 |
| 参考 | https://octokit.github.io/rest.js/v20/#repos-update-branch-protection | 案 C 評価 |

## 代替案比較

### 案 A: gh api 直叩き + payload を Git 管理（base case = Phase 2 採用 / MVP）

- 概要: `gh api ... -X PUT --input payload-{branch}.json` を直接叩く。payload / snapshot / rollback / applied は `outputs/phase-13/` に Git tracked で保全。adapter は jq / shell。
- 利点: 既存 `gh` CLI 認証を流用、追加依存ゼロ、payload diff が PR レビューしやすい、ロールバック粒度が細かい、コスト最小、CLAUDE.md `scripts/cf.sh` 系運用思想と整合。
- 欠点: state 管理は手動。drift 検知は grep ベース。

### 案 B: Terraform `github_branch_protection_v3`

- 概要: Terraform で IaC 化。state は Cloudflare R2 / S3 / GitHub backend 等。
- 利点: 完全な宣言的管理 / drift 検知 / plan-apply。
- 欠点: Terraform / state backend の新規導入が必要。本リポジトリは Cloudflare Workers + pnpm 中心で Terraform 運用基盤が無い。MVP スコープ外。**実現性 MAJOR**。

### 案 C: Octokit script (Node)

- 概要: `@octokit/rest` で apply スクリプトを TypeScript 化。
- 利点: 型安全。複雑な adapter ロジックを書きやすい。
- 欠点: 新規依存 + secret 管理（`GH_TOKEN`）の経路追加。`gh` CLI 認証を流用できない。MVP では over-engineering。**整合性 MINOR / 価値とコスト MINOR**。

### 案 D: gh api + 2 段階適用（UT-GOV-004 不在前提）

- 概要: 案 A をベースに、第 1 段階で `contexts=[]` 適用 → UT-GOV-004 完了後に第 2 段階で contexts 入りを再 PUT。
- 利点: UT-GOV-004 と並列着手可能。
- 欠点: 第 1 段階完了後の「contexts なし状態」は強制力が弱まる。**運用性 MINOR**（一時的に governance 弱化）。
- 取り扱い: base case の **フォールバック分岐** として保持し、UT-GOV-004 同時完了時のみ採用。

### 代替案 × 評価マトリクス（9 観点）

| 観点 | 案 A (base) | 案 B (Terraform) | 案 C (Octokit) | 案 D (2 段階適用) |
| --- | --- | --- | --- | --- |
| 価値性（governance 強制） | PASS | PASS | PASS | MINOR（第 1 段階で弱化） |
| 実現性 | PASS | MAJOR（基盤無し） | MINOR（依存追加） | PASS |
| 整合性（既存運用 / CLAUDE.md） | PASS（gh + scripts/cf.sh 思想） | MAJOR（IaC 基盤無し） | MINOR | PASS |
| 運用性 | PASS | MINOR（state 管理コスト） | MINOR | MINOR |
| 責務境界（payload / snapshot / rollback 分離） | PASS | PASS（Terraform state） | PASS | PASS |
| 依存タスク順序の固定（UT-GOV-004） | PASS（3 重明記） | PASS | PASS | PASS（2 段階で吸収） |
| 価値とコスト | PASS（コスト最小） | MAJOR（基盤導入） | MINOR | PASS |
| ロールバック設計 | PASS（rollback payload + DELETE 経路） | PASS（state revert） | PASS | PASS |
| 状態所有権 | PASS（GitHub 正本 / snapshot 監査用 / payload PUT 専用） | PASS | PASS | PASS |

### 採用結論

- **base case = 案 A を採用**。UT-GOV-004 同時完了の場合のみ **案 D（2 段階適用）にフォールバック**。
- 理由:
  1. 4 条件 + 5 観点すべて PASS（with notes for 案 D フォールバック）
  2. 既存 `gh` CLI 認証を流用、追加依存ゼロ
  3. payload diff が PR レビューしやすく、Phase 13 のユーザー承認ゲートと相性が良い
  4. ロールバック 3 経路（通常 / 緊急 enforce_admins / 再適用）が事前生成 payload で完結
  5. CLAUDE.md `scripts/cf.sh` 系の「ラッパー + Git 管理 + 1Password 動的注入」思想と整合
- 案 B は将来 IaC 化フェーズで再評価し、Phase 12 unassigned-task-detection.md に候補列挙のみ行う。
- 案 C は MVP では採用せず、adapter のテスト容易性が課題化したら再評価。

## PASS / MINOR / MAJOR 判定基準

| レベル | 基準 |
| --- | --- |
| PASS | 4 条件 + 5 観点を満たす。Phase 4 へ進める。 |
| MINOR | 警告レベル。Phase 5 / 11 / 12 / 13 で補足対応が必要だが Phase 4 移行は許可。 |
| MAJOR | block。Phase 4 へ進めない。Phase 2 へ差し戻すか、open question として MVP スコープ外に明確化する。 |

## base case 最終 PASS / MINOR / MAJOR 判定

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | dev / main の direct push / force push / 削除 / 必須 check 未通過 merge を構造 block |
| 実現性 | PASS | `gh api` + jq + payload は既存技術範囲 |
| 整合性 | PASS | 不変条件 #5 を侵害しない。CLAUDE.md / scripts/cf.sh 思想と整合 |
| 運用性 | PASS | snapshot / rollback payload 事前生成 + `enforce_admins` 単独 false 化により詰まない rollback |
| 責務境界 | PASS | snapshot = 監査 / payload = PUT 専用 / rollback = 緊急 / applied = 証跡、4 用途分離 |
| 依存タスク順序 | PASS（with notes） | UT-GOV-004 完了必須を 3 重明記。同時完了は 2 段階適用にフォールバック |
| 価値とコスト | PASS | 編集対象は payload JSON × 4 + runbook 1 通 + adapter スクリプト |
| ロールバック設計 | PASS | 通常 / 緊急 enforce_admins / 再適用 の 3 経路を事前生成 payload で実現 |
| 状態所有権 | PASS | 正本 = GitHub 実値、CLAUDE.md は参照、snapshot は PUT 不可形式で保全 |

**最終判定: PASS（with notes）**
notes:
- UT-GOV-004 完了確認は Phase 5 着手前の必須ゲート（NO-GO 条件として再明示）。同時完了の場合は 2 段階適用フォールバックを Phase 13 完了条件に含める。
- `enforce_admins=true` 適用直後の rollback 経路は `apply-runbook.md` に担当者付きで必ず明記。solo 運用では実行者本人。
- dry-run / apply / rollback リハーサルは Phase 11 で実走。コマンド系列は Phase 2 で仕様レベル固定済み。
- 実 `gh api PUT` は Phase 13 ユーザー承認後に実行（user_approval_required: true）。

## 着手可否ゲート（Phase 4 への GO / NO-GO 判定）

### GO 条件（全て満たすこと）

- [x] 代替案 4 案以上が評価マトリクスに並んでいる
- [x] base case の最終判定が全観点 PASS（or PASS with notes）
- [x] MAJOR が一つも残っていない
- [x] MINOR がある場合、対応 Phase（5 / 11 / 12 / 13）が指定されている
- [x] open question が全件 Phase 振り分け済み

### NO-GO 条件（一つでも該当）

- **UT-GOV-004（`required_status_checks.contexts` 実在 job 名同期）が completed でない（重複明記 3/3）**
  - 例外: 同時完了で 2 段階適用フォールバックを採用する場合のみ GO
- 4 条件のいずれかに MAJOR が残る
- adapter で snapshot をそのまま PUT に流す設計が残っている（§8.1 違反）
- dev / main を bulk PUT する設計が残っている（§8.5 違反）
- `lock_branch=true` が payload に含まれている（§8.3 違反）
- `enforce_admins=true` の rollback 経路が `apply-runbook.md` に担当者明記なし（§8.4 違反）
- ロールバックが 3 経路（通常 / 緊急 / 再適用）で記述されていない

## open question（Phase 4 以降に渡す候補）

| # | 質問 | 受け皿 Phase | 備考 |
| --- | --- | --- | --- |
| 1 | adapter を jq / shell で実装するか Node スクリプト化するか | Phase 5 | jq で十分なら shell。型安全が必要になれば案 C 部分採用 |
| 2 | dry-run の差分プレビューを `diff` 出力ベタ貼りで良いか、構造化レポートにするか | Phase 11 | 1 PR で済むなら ベタ貼りで良い |
| 3 | UT-GOV-004 同時完了時の 2 段階適用の第 2 段階トリガをどう自動化するか | Phase 13 | 手動再 PUT を runbook に記述で MVP 充足 |
| 4 | 案 B（Terraform）の将来導入時期 | Phase 12 unassigned | 次 Wave 以降、IaC 化フェーズ |
| 5 | drift 検知を grep 以外（定期 GitHub Actions で diff）に高度化するか | Phase 12 unassigned | 別タスク化候補 |

## 実行手順

### ステップ 1: 代替案の列挙

- 案 A〜D を `outputs/phase-03/main.md` に記述。

### ステップ 2: 評価マトリクスの作成

- 9 観点 × 4 案で空セルなく埋める。

### ステップ 3: base case 最終判定

- 全 PASS（with notes）であることを確認。MINOR の対応 Phase を明示。

### ステップ 4: 着手可否ゲートの判定

- UT-GOV-004 completed を NO-GO 条件として再明示。GO の場合のみ artifacts.json の Phase 3 を `completed` にする。

### ステップ 5: open question の Phase 振り分け

- 5 件すべてに受け皿 Phase を割り当てる。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | base case を入力にテスト戦略を組む |
| Phase 5 | open question #1（adapter 実装言語）を確定 |
| Phase 10 | base case の PASS 判定を GO/NO-GO の根拠に再利用 |
| Phase 11 | open question #2（diff 形式）を smoke 実走で確定 |
| Phase 12 | open question #4 / #5 を unassigned-task-detection.md に登録 |
| Phase 13 | open question #3（2 段階適用第 2 段階）を user_approval ゲートに反映 |

## 多角的チェック観点

- 責務境界: snapshot / payload / rollback / applied の 4 用途分離が代替案で破綻しないか。
- 依存タスク順序: UT-GOV-004 必須前提が 3 重明記されたか（本 Phase が 3 重目）。
- 価値とコスト: 案 A が最小コストで governance 強制を達成するか。
- ロールバック設計: 3 経路（通常 / 緊急 / 再適用）で逆操作可能か。
- 状態所有権: GitHub 実値 = 正本 / CLAUDE.md = 参照 が代替案で混線しないか。
- bulk 化禁止: dev / main 独立 PUT が代替案で破られないか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 代替案 4 案以上の列挙 | 3 | completed | 案 A〜D |
| 2 | 評価マトリクスの作成 | 3 | completed | 9 観点 × 4 案 |
| 3 | base case 最終 PASS（with notes）判定 | 3 | completed | notes 4 件 |
| 4 | PASS/MINOR/MAJOR 基準の定義 | 3 | completed | 3 レベル |
| 5 | 着手可否ゲート定義 + UT-GOV-004 完了 NO-GO 明記 | 3 | completed | 重複明記 3/3 |
| 6 | open question の Phase 振り分け | 3 | completed | 5 件 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | 代替案比較・評価マトリクス・PASS/MINOR/MAJOR・着手可否ゲート |
| メタ | artifacts.json | Phase 3 状態の更新 |

## 完了条件

- [x] 代替案が 4 案以上比較されている（A / B / C / D）
- [x] 9 観点 × 案のマトリクスに空セルが無い
- [x] base case の最終判定が PASS（with notes）
- [x] PASS / MINOR / MAJOR の判定基準が明文化されている
- [x] 着手可否ゲートで UT-GOV-004 完了が NO-GO 条件として明記されている（重複明記 3/3）
- [x] open question 5 件すべてに受け皿 Phase が割り当てられている
- [x] 4 条件 + 5 観点すべてが PASS（with notes）
- [x] MAJOR ゼロ（案 B / C は MAJOR / MINOR を含むが採用していない）

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `completed`
- 成果物が `outputs/phase-03/main.md` に配置済み
- base case の 9 観点すべてが PASS（with notes）
- MAJOR ゼロ（base case ベース）
- MINOR がある場合、対応 Phase が記述
- artifacts.json の `phases[2].status` が `completed`

## 次 Phase への引き渡し

- 次 Phase: 4 (テスト戦略)
- 引き継ぎ事項:
  - 採用 base case = 案 A（gh api 直叩き + payload Git 管理）
  - フォールバック = 案 D（2 段階適用、UT-GOV-004 同時完了時のみ）
  - lane 1〜5 を Phase 4 のテスト戦略の対象に渡す
  - notes 4 件（UT-GOV-004 ゲート / enforce_admins 担当者 / Phase 11 smoke / Phase 13 user_approval）
  - open question 5 件を該当 Phase へ register
- ブロック条件:
  - GO 条件のいずれかが未充足
  - UT-GOV-004 が completed でない（同時完了 2 段階適用も合意なし）
  - MAJOR が残っている
  - base case が代替案比較から導出されていない
