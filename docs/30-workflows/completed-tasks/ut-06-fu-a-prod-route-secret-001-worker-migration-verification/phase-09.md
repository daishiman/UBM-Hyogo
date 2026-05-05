# Phase 9: 品質保証（QA）

> **本タスクは docs-only / infrastructure-verification である。** 本 Phase の品質保証はコード QA ではなく、**runbook 文書の静的検証 / ルール整合監査 / 想定 AC 網羅性最終確認** を指す。Phase 10 GO/NO-GO 判定に必要な客観的根拠を揃える。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | apps/web production Worker 名分離に伴う route / secret / observability 移行確認 (UT-06-FU-A-PROD-ROUTE-SECRET-001) |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-04-30 |
| 前 Phase | 8 (リファクタリング / runbook 整理) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | spec_created |
| タスク分類 | infrastructure-verification（QA） |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |

## 目的

Phase 8 で確定した章順・コマンド・用語・追記境界を前提に、**静的検証（markdown lint / リンク健全性 / コードブロック言語指定）/ ルール整合監査（CLAUDE.md / aiworkflow-requirements / 1Password 参照）/ 想定 AC 網羅性最終確認 / line budget / mirror parity** の 5 観点で品質保証チェックを行い、Phase 10 GO/NO-GO 判定に必要な客観的根拠を揃える。a11y は対象外（runbook 文書のため）と明記する。代替指標 3 種（AC 充足率 / runbook 節カバー率 / TC 実行可能性）の **実測値** を Phase 7 で予約された出力先に転記する。

## 実行タスク

1. 静的検証を実施する（完了条件: markdown lint pass / 内部リンク 200 / コードブロック全件に言語指定）。
2. ルール整合監査を実施する（完了条件: `wrangler` 直接実行ゼロ / aiworkflow-requirements `deployment-cloudflare.md` と整合 / 1Password / op 参照ルール整合）。
3. 想定 AC 網羅性最終確認テーブル（AC1〜AC5）を完成する（完了条件: 各 AC が runbook 節 / TC / failure case で 100% カバー）。
4. 検証コマンド（`wrangler` 直接実行ゼロを機械検証）を実行し結果を記録する（完了条件: grep 結果 0 件 / `bash scripts/cf.sh` 内のみ許容）。
5. line budget を確認する（完了条件: 各 phase-XX.md が 200-260 行 / index.md が 250 行以内）。
6. link 検証を行う（完了条件: outputs path / artifacts.json / index.md / phase-XX.md / 親 runbook path のリンク切れが 0）。
7. mirror parity を確認する（完了条件: 本タスクは N/A 判定であることが明記）。
8. a11y 対象外を明記する（完了条件: 「runbook 文書のため a11y 対象外」と記述）。
9. Phase 7 で予約した代替指標 3 種の実測値を `outputs/phase-09/coverage-actual.md` に転記する（完了条件: AC 充足率 / runbook 節カバー率 / TC 実行可能性 が実測値で埋まる）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/phase-07.md | AC マトリクス / 代替指標定義 |
| 必須 | docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/phase-08.md | DRY 化済み章順・コマンド・用語 |
| 必須 | docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/index.md | 用語・命名の正本 |
| 必須 | docs/30-workflows/unassigned-task/UT-06-FU-A-production-route-secret-observability.md | 正本仕様 §2.2 AC1〜AC5 |
| 必須 | CLAUDE.md「Cloudflare 系 CLI 実行ルール」 | `wrangler` 直接実行禁止の根拠 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Cloudflare 運用規約 |
| 参考 | https://developers.cloudflare.com/workers/wrangler/ | wrangler 公式（直接実行禁止だが概念把握用） |

## 静的検証

| チェック | 方法 | 期待 |
| --- | --- | --- |
| markdown lint | 既存リポジトリ lint 規則（lefthook / CI lint job） | エラー 0 |
| 内部リンク健全性 | 各 phase-XX.md の `../` 相対参照 / Skill reference / 親 runbook path | リンク切れ 0 |
| コードブロック言語指定 | 全 ` ``` ` ブロックに `bash` / `text` / `markdown` 等を明示 | 言語未指定ブロック 0 |
| 表構造 | markdown 表が `\| --- \|` の区切り行を持つ | 全表 PASS |
| 改行 / 末尾空白 | EOL に末尾空白なし、ファイル末尾に改行 | 全ファイル PASS |

## ルール整合監査

| 監査対象 | 監査内容 | 期待結果 |
| --- | --- | --- |
| CLAUDE.md「Cloudflare 系 CLI 実行ルール」 | runbook 本文（コードブロック含む）に `wrangler` 直接実行が無いこと | grep 0 件（`bash scripts/cf.sh` ラッパー経由のみ許容） |
| aiworkflow-requirements `deployment-cloudflare.md` | 章順 / コマンド / 環境フラグが reference と矛盾しないこと | 矛盾 0 |
| 1Password / op 参照ルール | secret 値の直書きが無く、`op://` 参照または `.dev.vars` 経由のみ | 直書き 0 件 |
| API Token / OAuth トークン | runbook / outputs に Token 値が転記されていない | 転記 0 件 |
| `wrangler login` 禁止 | 「wrangler login」「~/.wrangler/config」「default.toml」が runbook に登場しないこと | 登場 0 件 |
| Worker 名一致 | `ubm-hyogo-web-production` が `apps/web/wrangler.toml [env.production].name` と一致 | 完全一致 |
| 環境フラグ | `--env production` / `--env staging` の使い分けが正本仕様と一致 | 一致 |

### 検証コマンド（機械検証）

```bash
# 1. wrangler 直接実行ゼロの機械検証（runbook 本文・コードブロック含む）
grep -rn 'wrangler ' docs/30-workflows/ut-06-followup-A-opennext-workers-migration/ \
  | grep -v 'bash scripts/cf.sh'
# 期待: 0 件（`bash scripts/cf.sh` ラッパー経由のみ許容）

# 2. 本タスク仕様書群でも同様に検証
grep -rn 'wrangler ' docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/ \
  | grep -v 'bash scripts/cf.sh'
# 期待: 0 件

# 3. secret 値の直書き検出
grep -rEn '^[A-Z_]+=[A-Za-z0-9]{8,}' \
  docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/
# 期待: 0 件（key 名のみテンプレに値が含まれていない）

# 4. wrangler login / config 経路の検出
grep -rnE 'wrangler login|\.wrangler/config|default\.toml' \
  docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/ \
  docs/30-workflows/ut-06-followup-A-opennext-workers-migration/
# 期待: 0 件

# 5. Worker 名固定値の一致確認
grep -c 'ubm-hyogo-web-production' \
  docs/30-workflows/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/phase-0*.md
# 期待: 各 phase で >= 1
```

## 想定 AC 網羅性最終確認テーブル

> 正本仕様 §2.2 の AC1〜AC5 を Phase 7 マトリクスから転記し、**実測** で網羅性を最終確認する。

| AC# | AC 内容（正本 §2.2 抜粋） | runbook 節カバー | TC カバー | failure case カバー | 最終判定 |
| --- | --- | --- | --- | --- | --- |
| AC1 | production deploy 前チェックリスト追記 | §1 / §2 / §6 | TC-01, TC-02 | TC-07, TC-11 | PASS |
| AC2 | secret list 出力スナップショット + 想定一覧と差分 0 | §3 / §4 | TC-03, TC-04, TC-05 | F-03, F-04 | PASS |
| AC3 | route / custom domain が新 Worker を指す確認 | §2 / §3 | TC-06, TC-07, TC-08 | F-05, F-06 | PASS |
| AC4 | tail で新 Worker のログ取得確認 | §5 / §6 | TC-09, TC-10 | F-07 | PASS |
| AC5 | 旧 Worker 処遇判断（残置 / 無効化 / 削除 / route 移譲）の記録 | §6 / §7 | TC-06, TC-10 | TC-10, TC-12 | PASS |

> **空セル禁止**: 全 AC が runbook 節 / TC / failure case の 3 列で 1 つ以上カバーされること。1 つでも空なら Phase 5/6 へ差し戻し。

## line budget 確認

| ファイル | 想定行数 | budget | 判定 |
| --- | --- | --- | --- |
| index.md | 約 200 行 | 250 行以内 | 個別確認 |
| phase-01.md 〜 phase-13.md | 各 200-260 行 | 200-260 行（ut-04 phase-07/08/09 の粒度を踏襲） | 個別確認 |
| outputs/phase-XX/*.md | 個別判定（main.md は 200-400 行を目安） | 個別 | 個別チェック |

> 200 行未満の場合は内容不足、260 行超の場合は分割を Phase 10 で検討する。

## link 検証

| チェック | 方法 | 期待 |
| --- | --- | --- |
| outputs path 整合 | artifacts.json `phases[*].outputs` × 実 path | 完全一致 |
| index.md × phase-XX.md | `Phase 一覧` 表 × 実ファイル | 完全一致 |
| phase-XX.md 内の `../` 相対参照 | 全リンク辿り | リンク切れ 0 |
| Skill reference path | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | 実在 |
| 正本 unassigned-task 参照 | `docs/30-workflows/unassigned-task/UT-06-FU-A-production-route-secret-observability.md` | 実在 |
| 親 runbook path | `docs/30-workflows/ut-06-followup-A-opennext-workers-migration/` | 実在（未作成なら Phase 5 で作成） |
| CLAUDE.md セクション | 「Cloudflare 系 CLI 実行ルール」 | 存在 |

## mirror parity（N/A 判定）

- 本タスクは `.claude/skills/` 配下の skill 資源を更新しない（aiworkflow-requirements の reference を **参照** するのみ）。
- ゆえに `.claude` 正本と `.agents` mirror の同期は **本タスク N/A**。
- 仮に Phase 12 documentation 更新時に skill reference を改訂した場合のみ mirror sync 義務が発生する。

## a11y 対象外の明記

- 本タスクは runbook / checklist の文書追加のみで構成され、UI を持たない。
- ゆえに WCAG 2.1 / a11y 観点は本タスクで **対象外**。
- 関連の a11y 確認は runbook を参照する UI タスク（admin dashboard / public site）で行う。

## 代替指標 3 種の実測値（Phase 7 引き継ぎ）

| 指標 | 目標値 | 実測値（Phase 9 取得） | 出力先 |
| --- | --- | --- | --- |
| AC 充足率 | 100%（5/5） | （本 Phase で取得） | `outputs/phase-09/coverage-actual.md` |
| runbook 節カバー率 | 100%（6 節 / 6 節） | （本 Phase で取得） | 同上 |
| TC 実行可能性 | 100%（12/12） | （本 Phase で取得） | 同上 |

## 実行手順

### ステップ 1: 静的検証
- markdown lint / リンク健全性 / コードブロック言語指定 を全 phase-XX.md で確認。

### ステップ 2: ルール整合監査
- 上記「検証コマンド」5 件を実行し、結果を `outputs/phase-09/rule-compliance.md` に記録。

### ステップ 3: AC 網羅性最終確認
- AC1〜AC5 の 5 行表を実測で埋め、PASS/FAIL を確定。

### ステップ 4: line budget 計測
- 各 phase-XX.md の `wc -l` を取り、200-260 行範囲内を確認。

### ステップ 5: link 検証
- artifacts.json / index.md / phase-XX.md / 親 runbook の path 整合。

### ステップ 6: mirror parity / a11y 判定
- 本タスクは双方とも N/A / 対象外と明記。

### ステップ 7: outputs/phase-09/main.md と coverage-actual.md に集約
- 上記すべてを 2 ドキュメントに統合。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | AC 網羅性 / `wrangler` 直接実行ゼロ / link 整合を GO/NO-GO の根拠に使用 |
| Phase 11 | staging で runbook を予行演習し、tail / secret list が新 Worker を観測することを確認（AC4 の予行演習） |
| Phase 12 | implementation-guide.md の運用パートに本タスクの追記を反映、unassigned-task として「DNS 切替（UT-16）」を再送出 |
| 親 UT-06-FU-A | 本タスクの追記が親 runbook に統合されたことを確認 |
| UT-21 | observability 設定の audit hook 連携の前提として再利用 |

## 多角的チェック観点

- 価値性: 静的検証 + ルール整合監査により、production deploy 直前のチェックリストが信頼できる状態に到達。
- 実現性: 検証コマンドが grep / wc など標準ツールで再現でき、CI でも実行可能。
- 整合性: 不変条件 #5（D1 access 閉鎖）に類似の境界として「`wrangler` 直接実行ゼロ」を機械検証。AC1〜AC5 と章順 6 節が 1:1 対応。
- 運用性: AC 網羅性表が PR レビュー時に 1 ファイルで確認できる。
- 認可境界: production deploy 実行が **本タスクスコープ外**（正本 §10）であることが Phase 5/6/7/8 で一貫して明示。
- セキュリティ: secret 値直書き 0 件 / Token 転記 0 件 / `wrangler login` 経路 0 件を機械検証。
- 無料枠: 本タスクは Cloudflare 無料枠に影響なし（runbook 文書のみ）。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | markdown lint / リンク / コードブロック言語指定 | 9 | spec_created | 静的検証 |
| 2 | `wrangler` 直接実行ゼロ機械検証 | 9 | spec_created | grep ベース |
| 3 | aiworkflow-requirements 整合監査 | 9 | spec_created | deployment-cloudflare.md 参照 |
| 4 | 1Password / op 参照ルール整合 | 9 | spec_created | 値直書き 0 |
| 5 | AC 網羅性最終確認（5 AC） | 9 | spec_created | runbook 節 / TC / failure case |
| 6 | line budget 計測 | 9 | spec_created | 200-260 行 |
| 7 | link 検証 | 9 | spec_created | リンク切れ 0 |
| 8 | mirror parity / a11y 判定 | 9 | spec_created | 双方 N/A / 対象外 |
| 9 | 代替指標 3 種実測値転記 | 9 | spec_created | coverage-actual.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | QA 結果サマリー（5 観点） |
| ドキュメント | outputs/phase-09/rule-compliance.md | ルール整合監査の grep 結果ログ |
| ドキュメント | outputs/phase-09/coverage-actual.md | 代替指標 3 種の実測値（Phase 7 から引き継ぎ） |
| メタ | artifacts.json | Phase 9 状態の更新 |

## 完了条件チェックリスト

- [ ] markdown lint pass / 内部リンク 0 切れ / コードブロック全件に言語指定
- [ ] `grep -rn 'wrangler '` が `bash scripts/cf.sh` 内のみ（直接実行 0 件）
- [ ] secret 値直書き 0 件（grep 検証済み）
- [ ] `wrangler login` / `.wrangler/config` / `default.toml` の登場 0 件
- [ ] AC1〜AC5 が runbook 節 / TC / failure case で 100% カバー
- [ ] line budget が全 phase で 200-260 行範囲内
- [ ] link 検証でリンク切れ 0
- [ ] mirror parity が N/A と明記
- [ ] a11y 対象外と明記
- [ ] 代替指標 3 種の実測値が `outputs/phase-09/coverage-actual.md` に転記
- [ ] aiworkflow-requirements `deployment-cloudflare.md` との整合監査完了

## タスク100%実行確認【必須】

- 全実行タスク（9 件）が `spec_created`
- 成果物 3 ファイルが `outputs/phase-09/` 配下に配置予定
- AC1〜AC5 が PASS 判定
- `wrangler` 直接実行ゼロが機械検証されている
- secret 値混入 0 件が機械検証されている
- a11y 対象外 / mirror parity N/A が明記されている
- artifacts.json の `phases[8].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 10 (最終レビュー)
- 引き継ぎ事項:
  - AC 網羅性最終確認（AC1〜AC5 全 PASS）
  - 静的検証 / ルール整合監査の結果ログ（`rule-compliance.md`）
  - 代替指標 3 種の実測値（`coverage-actual.md`）
  - line budget / link 整合 / mirror parity（N/A） / a11y（対象外）
  - `wrangler` 直接実行ゼロの機械検証結果
- ブロック条件:
  - AC1〜AC5 のいずれかが FAIL
  - `wrangler` 直接実行が残存
  - secret 値直書きが残存
  - link 切れが残る
  - 親 runbook への追記境界が不整合
