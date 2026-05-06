# Phase 10: 最終レビュー — issue-407-cf-token-rotation-90day-runbook-automation

[実装区分: 実装仕様書]

判定根拠: 本 Phase は Phase 9 品質ゲートを通過した runbook / 実施記録 / yaml と Phase 11 で取得する NON_VISUAL evidence 一式に対し、(a) 4 観点最終レビュー（システム整合性 / 戦略・価値 / 問題解決 / 4 条件）、(b) CONST_004-007 最終遵守確認、(c) 残課題チェックリスト、(d) ユーザー承認ゲート（G1 spec / G2 evidence の 2 段階） を判定する。GO/NO-GO 判定が Phase 11 着手 / Phase 13 PR 作成の前提となるため docs-only ではなく実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-407-cf-token-rotation-90day-runbook-automation |
| phase | 10 / 13 |
| wave | post-U-FIX-CF-ACCT-01 |
| mode | sequential |
| 作成日 | 2026-05-06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 9 品質ゲート結果と Phase 1〜8 設計成果物を 4 観点で self-review し、CONST_004-007 の最終遵守を確認したうえで、Phase 11 NON_VISUAL evidence 取得着手の GO/NO-GO（**G-FR-1**）と、Phase 13 PR 作成前の GO/NO-GO（**G-FR-2**）の 2 段階ユーザー承認ゲートを設計・運用する。

## レビュー観点 1: システム整合性

| 観点 | 確認内容 | 合格基準 |
| --- | --- | --- |
| S1 | aiworkflow-requirements 整合 | `references/deployment-secrets-management.md` への rotation runbook 相対リンク追記が drift せず、`pnpm indexes:rebuild` 後に `verify-indexes-up-to-date` が green |
| S2 | CLAUDE.md「Cloudflare 系 CLI 実行ルール」整合 | runbook 中の全 Cloudflare CLI が `bash scripts/cf.sh` 経由になっている |
| S3 | CLAUDE.md「ローカル `.env` 運用ルール」整合 | runbook / yaml / 実施記録 / step ログに Token 値・ID・scope 値が現れない |
| S4 | CLAUDE.md「ブランチ戦略」整合 | 仕様書 PR は `feature/* → dev → main` 経路、yaml の有効化は main merge 後の自動 schedule で動作 |
| S5 | CLAUDE.md「Governance / CODEOWNERS」整合 | `.github/workflows/cf-token-rotation-reminder.yml` が CODEOWNERS の `.github/workflows/**` ルールに継承 |
| S6 | 13 phase 構造完備 | `index.md` / `artifacts.json` / `phase-{01..13}.md` / `outputs/phase-{01..13}/main.md` 受け皿が揃う |

## レビュー観点 2: 戦略・価値

| 観点 | 評価 |
| --- | --- |
| V1 | ビジネス価値: 漏洩 blast radius 90 日短縮 / staging-first / 24h 並行 / rollback 3 段ガード / 自動 Issue 起票で「期日忘れ」構造排除 |
| V2 | MVP 適合性: 通知のみの最小自動化に留め、Token 発行自動化は OIDC 化（DERIV-01）へ移譲 |
| V3 | 持続性: 実施記録 append-only により四半期 rotation の所要時間 / 失敗率を定量化可能 |
| V4 | 拡張性: 章立て規約（Phase 8）が D1 health DB token rotation runbook と整合する抽象度 |

## レビュー観点 3: 問題解決

| 元の課題 | 設計上の解決 | 確認手段 |
| --- | --- | --- |
| 90 日経過を覚えていられない | `vars.CF_TOKEN_ISSUED_AT` 起点で 85 日経過時点に schedule workflow が自動 Issue 起票 | Phase 11 Q12 / Q13 の経過日数境界実測 |
| staging を飛ばして production を rotation | runbook §5 冒頭に G2 ゲートで staging 全 PASS 必須を明記 | Phase 7 AC マトリクス |
| 旧 Token を即削除して rollback 不能 | runbook §4.7 / §5.7 で「無効化」と「削除」を 24h 間隔の 2 段階に分離 | runbook 章立て検査（Phase 9 Q7） |
| 実施記録に Token 値が混入 | テンプレ自体に Token 値フィールドを置かない | Phase 9 Q5 / Q8 |
| 自動化が誤起票で氾濫 | dry-run + 重複検知 + `gh workflow disable` 緊急停止経路 | Phase 11 Q11 / Q14 |

## レビュー観点 4: 4 条件評価（CONST_004-007 遵守）

| 制約 | 確認 | 判定根拠 |
| --- | --- | --- |
| CONST_004（実装区分判定） | 全 Phase 冒頭に `[実装区分: 実装仕様書]` 明記 | 本ファイル含め phase-{01..13}.md で grep 確認 |
| CONST_005（必須項目） | 変更対象ファイル一覧 / yaml 構造 / 入出力 / エラーハンドリング / セキュリティ / ローカル実行コマンド / Rollback / DoD が Phase 02 / 03 / 04 で具体化 | Phase 9 Q7 / Q8 で章立て検査 |
| CONST_006（依存・スコープ明示） | `index.md` Scope In/Out / Depends On / Blocks / Related が明示 | `index.md` self-review |
| CONST_007（先送り禁止） | Wave 1 と Wave 2 を本サイクル内で完結 / Phase 11 で yaml dry-run を実測 / Phase 8 の reusable workflow 化を「過早な抽象化」として明示拒否 | Phase 8 / Phase 11 設計確認 |

## 残課題チェックリスト

| # | 残課題候補 | 状態 | 分岐先 |
| --- | --- | --- | --- |
| C1 | OIDC 化（DERIV-01）後の runbook 改訂 | OPEN（次 Wave） | runbook §9 末尾に明記 / 本タスクでは改訂しない |
| C2 | 90 日選定の経験則妥当性 | OPEN（運用観察） | 初回 rotation 後に短縮 / 延長判断する unassigned-task を Phase 12 で起票検討 |
| C3 | 24h 並行根拠（インシデント駆動の見直し） | OPEN（運用観察） | runbook §1.2 に明記 / 次回 rotation 時にレビュー |
| C4 | D1 health DB rotation runbook との章立て規約共通化 | OPEN（次 Wave） | Phase 8 起票テンプレを `outputs/phase-08/main.md` に保存 / 本タスクでは起票しない |
| C5 | `vars.CF_TOKEN_ISSUED_AT` の初回設定 | runbook §3 事前確認 / U-FIX-CF-ACCT-01 完了直後に手動設定 | Phase 11 evidence 取得時に runbook §3 で実施記録 |
| C6 | `ops` / `cloudflare` / `token-rotation` label 事前作成 | Phase 11 で実施 | Phase 11 ランブックに `gh label create` step を含める |
| C7 | 実 production rotation 実施 evidence | runtime pending（初回 rotation 実施時に「実施記録テンプレ」を埋めて完了） | 状態語彙 `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` で扱う |

## ユーザー承認ゲート（2 段階）

### G-FR-1: spec contract 完了承認（Phase 11 着手前）

Phase 1〜10 / 12 の仕様書が完成し、品質ゲート Q1〜Q10（static check）が全 PASS した時点で停止し、user に提示:

```
[G-FR-1: SPEC CONTRACT APPROVAL]
完了内容:
  - phase-{01..13}.md（実装仕様書）
  - cf-token-rotation-runbook.md / cf-token-rotation-log.md / cf-token-rotation-reminder.yml の章立て / yaml 構造確定
  - Phase 9 Q1〜Q10（markdown lint / link / yamllint / actionlint / secret hygiene / placeholder / 章立て / テンプレ項目数 / permissions / secrets 不参照）が全 PASS
次の作業: Phase 11 NON_VISUAL evidence 取得（dry-run + 経過日数シミュレーション + 重複検知シミュレーション）
"approve G-FR-1" と返信してください。
```

### G-FR-2: NON_VISUAL runtime evidence 承認（Phase 13 PR 作成前）

Phase 11 で取得した dry-run / 経過日数シミュレーション / 重複検知ログ群と Phase 12 ドキュメント更新差分が揃った時点で停止し、user に提示:

```
[G-FR-2: NON_VISUAL RUNTIME EVIDENCE APPROVAL]
取得済 evidence:
  - qa-{markdownlint,link-check,yamllint,actionlint,secret-leak,placeholder,runbook-headings,log-template,permissions,no-secrets,dryrun,elapsed-86d,elapsed-84d,dup-detect,aiworkflow-sync,codeowners,branch-protection}.log/.json
状態: PASS_BOUNDARY_SYNCED_RUNTIME_PENDING（spec contract 完了 / 実 production rotation runtime pending）
git diff --stat:
  <提示>
次の作業: Phase 13 PR 作成（仕様書 + runbook + yaml を 1 PR で main へ提案）
"approve G-FR-2" と返信してください。
```

> 2 ゲートは合算禁止。各々独立に承認を取得する（Phase 13 で扱う G1〜G4 とは別系統。Phase 13 の G1〜G4 は PR 作成手順内の段階承認を指す）。

## レビュー実施手順

### Step 1: self-review（1 周目）

1. レビュー観点 S1〜S6 / V1〜V4 / 問題解決 5 行 / CONST_004-007 を順に PASS / FAIL / N/A で判定。
2. PASS の根拠は phase-NN.md / outputs/phase-NN/main.md のパスで示す。
3. FAIL は blocker として一覧化する。

### Step 2: blocker 仕分け

| blocker 種別 | 分岐先 |
| --- | --- |
| 設計欠落（章立て / yaml 構造） | Phase 2 / 3 へ差し戻し |
| 品質ゲート未通過 | Phase 9 へ差し戻し（自動修復可なら 1 回試行） |
| 共通化判定の漏れ | Phase 8 へ差し戻し |
| 残課題（C1〜C7） | 本 Phase 内で `outputs/phase-10/main.md` に明示し続行可 |

CONST_007 に従い「Phase 11 で対応」「Phase 12 で記録」型の先送りは禁止。本 Phase で blocker をいずれかの分岐先に必ず割り当てる。

### Step 3: GO / NO-GO 判定

- レビュー観点 S1〜S6 / V1〜V4 / 問題解決 / CONST_004-007 全 PASS → **G-FR-1: GO**
- 残課題 C1〜C7 は明示記録のうえ続行可
- 1 つでも S / V / CONST 系で FAIL → NO-GO（Step 2 で分岐先を確定し、本 Phase を再実施）

### Step 4: レビュー記録

`outputs/phase-10/main.md` に以下を要約として保存する:

- レビュー観点表（S / V / 問題解決 / CONST）の判定結果
- 残課題チェックリスト C1〜C7 の状態
- G-FR-1 / G-FR-2 取得日時 / 承認テキスト
- GO / NO-GO 判定と根拠
- Phase 11 / Phase 13 着手可否

## 参照資料

- `phase-01.md` 〜 `phase-09.md`
- `index.md` / `artifacts.json`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `CLAUDE.md`（branch protection / Cloudflare CLI / Governance / sync-merge ポリシー）

## 統合テスト連携

- 上流: Phase 9 品質ゲート
- 下流: Phase 11 NON_VISUAL evidence 取得 / Phase 13 PR 作成

## 多角的チェック観点

- 不変条件（Token 値非掲載）が S3 で grep ベース確認済み
- production への副作用が「自動化は通知のみ」に限定（V1 / V2）
- approval gate 2 種（G-FR-1 / G-FR-2）が独立に取得される設計
- 残課題 C1〜C7 が「先送り」ではなく明示記録になっている
- governance（CODEOWNERS / branch protection）が S5 で確認されている
- CONST_007 違反が無い（Phase 8 reusable workflow 化拒否含む）

## サブタスク管理

- [ ] S1〜S6 / V1〜V4 / 問題解決 5 行 / CONST_004-007 を順に判定
- [ ] 残課題 C1〜C7 を明示記録
- [ ] G-FR-1 取得（user approval）
- [ ] G-FR-2 取得（Phase 13 直前 / user approval）
- [ ] `outputs/phase-10/main.md` を作成

## 成果物

- `outputs/phase-10/main.md`

## 完了条件

- [ ] 本 Phase の成果物と検証結果を確認済み
- レビュー観点すべてに PASS / FAIL / N/A の判定が付いている
- すべての FAIL に分岐先が割当済
- G-FR-1 / G-FR-2 の取得記録が用意されている
- Phase 11 / Phase 13 着手可否が明記されている

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 本 Phase で deploy / commit / push / PR / Token 発行 / secret 投入を実行していない
- [ ] CONST_007 違反（先送り）が無い
- [ ] solo-dev branch protection 不変条件を侵していない

## 次 Phase への引き渡し

Phase 11 へ:
- G-FR-1 取得済みの状態
- 取得対象 NON_VISUAL evidence 一覧（Phase 9 マトリクスに対応）
- 残課題 C1〜C7 のうち Phase 11 で観察すべき項目（C5 / C6）

## 実行タスク

- [ ] phase-10 の既存セクションに記載した手順・検証・成果物作成を実行する
