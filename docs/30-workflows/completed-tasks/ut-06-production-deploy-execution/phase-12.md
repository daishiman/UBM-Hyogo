# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 本番デプロイ実行 (UT-06) |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-27 |
| 前 Phase | 11 (手動 smoke test) |
| 次 Phase | 13 (PR作成) |
| 状態 | pending |

## 目的

本タスク（UT-06）の成果物を正本仕様（system spec）と上流タスクの runbook に統合し、本番デプロイ実績の記録・後続タスクへの引き継ぎ・スキル改善提案を確定する。
本タスクは「本番への実書き込み」を伴う implementation タスクであるため、go-live 完了記録・本番 URL・コミット SHA・wrangler バージョン等の実績を正本仕様に反映する。
close-out として未割り当てタスクの検出とスキルフィードバックを行い、Phase 12 タスク仕様遵守チェックを実施する。

## 実行タスク

- 02-serial / 04-serial / 05b-parallel の runbook に本番デプロイ実績を統合する
- aiworkflow-requirements の deployment-cloudflare.md / deployment-core.md に go-live 実績を追記する
- system-spec-update-summary を作成する
- documentation-changelog を記録する
- unassigned-task-detection を実施する（0 件でも出力必須。検出された場合は後続タスク化）
- skill-feedback-report を作成する
- implementation-guide（中学生レベル + 技術者レベル）を作成する
- phase12-task-spec-compliance-check を実施する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Phase 12 同期ルール |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | 本番デプロイ実績の追記対象 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | go-live 完了記録の追記対象 |
| 必須 | docs/30-workflows/01-infrastructure-setup/05b-parallel-smoke-readiness-and-handoff/index.md | handoff 完了記録の追記対象 |
| 必須 | docs/30-workflows/completed-tasks/02-serial-monorepo-runtime-foundation/index.md | runbook 統合対象（wrangler.toml 構造） |
| 必須 | docs/30-workflows/01-infrastructure-setup/04-serial-cicd-secrets-and-environment-sync/index.md | runbook 統合対象（Secrets 配置確認結果） |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/index.md | タスク正本 |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-05/deploy-execution-log.md | 本番デプロイ実施記録 |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-11/smoke-test-result.md | smoke test 結果 |
| 参考 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-07/ac-matrix.md | AC 完了証跡 |

## 実行手順

### ステップ 1: runbook 統合

- 02-serial-monorepo-runtime-foundation runbook に「本番 wrangler.toml 確定構造」セクションを追加する
- 04-serial-cicd-secrets-and-environment-sync runbook に「本番 Secrets 配置確認結果（Phase 4 verify suite 結果）」を統合する
- 05b-parallel-smoke-readiness-and-handoff の handoff チェックリストに「UT-06 完了印」を追加する
- 統合後の runbook が AC-3 / AC-6 / AC-7 / AC-8 を引き続き満たすことを確認する

### ステップ 2: aiworkflow-requirements への正本反映

- deployment-cloudflare.md に「本番初回デプロイ実績（実施日・wrangler ver・コミット SHA・本番 URL）」セクションを追記する
- deployment-core.md に「go-live 完了記録 + 検証済みロールバック手順」を追記する
- 機密情報（database_id 実値・URL の認証情報）は記載せず、参照先（1Password / Cloudflare Dashboard）のみ記す

### ステップ 3: system-spec-update-summary の作成

- 本タスクで変更・追加された設計知識を要約する
- 影響を受けた正本仕様ファイルを列挙する
- 次 Wave のタスク（UT-08 / UT-09 / 02-application-implementation）に引き継ぐべき設計決定を記録する

### ステップ 4: close-out タスクの実施

- documentation-changelog に本タスクの変更履歴を記録する
- unassigned-task-detection で未割り当てタスクを洗い出す（0 件でも出力必須。検出例: UT-08 連携・UT-09 連携・カスタムドメイン DNS 移管・定期 D1 バックアップ自動化）
- skill-feedback-report で本タスクで判明したスキル改善点を記録する
- implementation-guide（Part 1 中学生レベル / Part 2 技術者レベル）を作成する
- phase12-task-spec-compliance-check で仕様遵守を確認する

### ステップ 5: Phase 12 same-wave sync 検証

- Step 1-A: 完了タスク記録、関連ドキュメントリンク、変更履歴、`.claude/skills/aiworkflow-requirements/LOGS.md`、`.claude/skills/task-specification-creator/LOGS.md`、topic-map/index 更新結果を記録する
- Step 1-B: 実装状況テーブルを `completed` に更新する
- Step 1-C: 関連タスク・未タスク候補テーブルのステータスを current facts に更新する
- Step 1-D: `outputs/artifacts.json` と root `artifacts.json` の同期コピーを作成し、差分ゼロを確認する
- Step 1-E: `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` を実行し、resource-map / topic-map の再生成結果を記録する
- Step 1-F: validation matrix（仕様リンク、artifact、LOGS、topic-map、secret hygiene）を `outputs/phase-12/phase12-task-spec-compliance-check.md` に記録する
- Step 1-G: `task-specification-creator` の validate / verify コマンド結果を記録する
- Step 2: 新規インターフェース・型・API 追加がない場合は N/A と明記し、deployment 正本の運用記録更新だけを実施する

## implementation-guide【必須】

本タスクは **implementation**（本番への実デプロイ）であるため、コード実装ではなく「本番デプロイ操作の実装手順」を記録する。
中学生でも理解できる Part 1 と、デプロイ実行者向けの Part 2 の 2 部構成。

### Part 1: 中学生レベルの概念説明

**例え話: 「家を引っ越して新住所に表札をつける」**

- これまで作ってきたウェブサイト（家）を、ローカル環境（仮の住まい）から本番環境（新しい家）に引っ越します。
- 引っ越しには「荷造り（ビルド）」「運搬（デプロイ）」「表札（URL の確定）」「ご近所への挨拶（smoke test）」が必要です。

**なぜバックアップが必要か?**

- 引っ越し当日に、新しい家の中で家具を組み立て直すような作業（D1 マイグレーション）をします。
- 万が一、組み立てを間違えて家がぐちゃぐちゃになったら、引っ越し前の状態に戻せるよう「写真（バックアップ SQL）」を撮っておきます。
- 写真がないと、何時間も復旧作業をする羽目になり、お客様（ユーザー）に長時間サイトが使えない迷惑をかけます。

**なぜ smoke test が必要か?**

- 引っ越したばかりの家で、実際に「電気がつくか」「水が出るか」「ガスが通っているか」を一通り確認するのが smoke test です。
- 確認せずに「引っ越し完了」としてしまうと、お客様が訪ねてきた時に「電気がつかない！」となって信用を失います。
- だから本番デプロイの直後には、必ず最低限の動作確認（ページが開く・API が応答する・データベースに繋がる）をします。

**なぜ 2 人以上で承認するのか?**

- 引っ越し作業は重要なので、1 人で勝手に判断せず、必ず別の人に「これでよいですか?」と確認してもらいます。
- 一度動いた本番環境を壊すと影響が大きいので、慎重に、複数の目で確認するルールにしています。

### Part 2: 技術者レベルの実装ガイド

#### wrangler コマンド一覧

```bash
# D1 バックアップ取得（実行前必須）
wrangler d1 export <DB_NAME> --env production \
  --output backup-$(date +%Y%m%d-%H%M%S).sql

# D1 マイグレーション適用
wrangler d1 migrations apply <DB_NAME> --env production

# D1 履歴確認
wrangler d1 migrations list <DB_NAME> --env production

# Workers デプロイ
wrangler deploy --env production

# OpenNext Workers デプロイ
wrangler deploy --config apps/web/wrangler.toml --env production <output-dir> \
  --project-name <project-name> \
  --branch main \
  --commit-dirty=false

# Workers ロールバック
wrangler deployments list --env production
wrangler rollback <version_id> --env production

# Pages ロールバック
wrangler deploy --config apps/web/wrangler.toml --env production list --project-name <project-name>
# → ダッシュボード or wrangler pages rollback で前 deployment へ
```

#### wrangler.toml の env.production スキーマ（apps/api 側）

```toml
name = "ubm-hyogo-api"
main = "src/index.ts"
compatibility_date = "2025-04-01"

# 既定（local 開発用）
[[d1_databases]]
binding = "DB"
database_name = "ubm-hyogo-local"
database_id = "local-dummy-id"

[env.staging]
[[env.staging.d1_databases]]
binding = "DB"
database_name = "ubm-hyogo-staging"
database_id = "<staging-database-id>"  # Cloudflare Dashboard

[env.production]
[[env.production.d1_databases]]
binding = "DB"
database_name = "ubm-hyogo-production"
database_id = "<production-database-id>"  # Cloudflare Dashboard

[env.production.vars]
ENVIRONMENT = "production"
# Secrets は wrangler secret put --env production で配置（vars に書かない）
```

#### デプロイ実行時のフロー

詳細フローは Phase 2 の Mermaid 図（`outputs/phase-02/deploy-design.md`）を再掲する。
要約: 事前検証 PASS → D1 バックアップ → D1 migrations apply → Workers deploy → Pages deploy → smoke test → 成功記録（失敗時は系統別ロールバック）。

#### エラーハンドリング・エッジケース

| ケース | 症状 | 対処 |
| --- | --- | --- |
| Pages ビルドキャッシュ汚染 | 古い `.open-next/` が残り stale build がデプロイされる | デプロイ前に `rm -rf .open-next/` で明示削除 |
| Workers 同時デプロイ競合 | 複数人が同時に `wrangler deploy` 実行 | `wrangler deployments list` で最新 version_id を確認、main ブランチを single source とする |
| D1 ロック | `wrangler d1 migrations apply` 中に他プロセスから書き込み | デプロイ時間帯を事前周知、ロック検知時は再試行 |
| Pages 初回 project 未作成 | `wrangler deploy --config apps/web/wrangler.toml --env production` が project not found | `wrangler pages project create <name> --production-branch main` を先に実行 |
| Workers 初回 rollback 不可 | 前 version_id が存在しない | rollback ではなく前コミットを再 deploy する代替手順を runbook に明記 |
| D1 リストア時の整合性破壊 | Workers が新スキーマ前提のままリストアした古いスキーマで稼働 | Workers も同時に前バージョンへ rollback、または D1 のみ部分的に修正 |

#### 設定可能な環境変数（CI 経由デプロイ時）

| 変数 | 既定値 | 用途 |
| --- | --- | --- |
| NODE_VERSION | 24.15.0 | `.mise.toml` と整合させる |
| OPENNEXT_VERSION | latest pinned | `@opennextjs/cloudflare` のバージョン固定 |
| WRANGLER_VERSION | 3.x latest | wrangler CLI のバージョン固定 |
| CLOUDFLARE_ACCOUNT_ID | （Secrets） | wrangler 認証用 |
| CLOUDFLARE_API_TOKEN | （Secrets） | wrangler 認証用 |

## system-spec-update-summary【必須】

| 更新対象 | 変更内容 | 影響範囲 |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | 本番デプロイ実績（実施日・wrangler ver・コミット SHA・本番 URL の参照先）を追記 | 後続タスクで本番環境を参照する全実装者 |
| `.claude/skills/aiworkflow-requirements/references/deployment-core.md` | go-live 完了記録 + 検証済みロールバック手順サマリーを追記 | 運用担当・障害対応者 |
| `docs/30-workflows/01-infrastructure-setup/05b-parallel-smoke-readiness-and-handoff/index.md` | handoff 完了印・readiness checklist 結果反映 | 同 wave の handoff 担当 |
| `docs/30-workflows/completed-tasks/02-serial-monorepo-runtime-foundation/index.md` | 本番 `wrangler.toml` 確定構造セクションを統合（02-serial runbook） | wrangler.toml を編集する全実装者 |
| `docs/30-workflows/01-infrastructure-setup/04-serial-cicd-secrets-and-environment-sync/index.md` | 本番 Secrets 配置確認結果（Phase 4 verify suite）を統合 | UT-05 CI/CD 実装者 |

## documentation-changelog【必須】

| 日付 | 変更種別 | 対象ファイル | 変更概要 |
| --- | --- | --- | --- |
| 2026-04-27 | 新規作成 | `docs/30-workflows/ut-06-production-deploy-execution/` | UT-06 タスク仕様書全体（Phase 1〜13 + outputs/） |
| 2026-04-27 | 更新対象 | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | 本番デプロイ実績セクション追記 |
| 2026-04-27 | 更新対象 | `.claude/skills/aiworkflow-requirements/references/deployment-core.md` | go-live 完了記録追記 |
| 2026-04-27 | 更新対象 | `docs/30-workflows/01-infrastructure-setup/05b-parallel-smoke-readiness-and-handoff/index.md` | handoff 完了印追加 |
| 2026-04-27 | 更新対象 | `docs/30-workflows/completed-tasks/02-serial-monorepo-runtime-foundation/index.md` | 本番 wrangler.toml 構造統合 |
| 2026-04-27 | 更新対象 | `docs/30-workflows/01-infrastructure-setup/04-serial-cicd-secrets-and-environment-sync/index.md` | 本番 Secrets 配置確認結果統合 |
| 2026-04-27 | 新規作成 | `outputs/phase-12/system-spec-update-summary.md` | spec update summary |
| 2026-04-27 | 新規作成 | `outputs/phase-12/documentation-changelog.md` | 変更履歴 |
| 2026-04-27 | 新規作成 | `outputs/phase-12/unassigned-task-detection.md` | 未割り当てタスク一覧 |
| 2026-04-27 | 新規作成 | `outputs/phase-12/skill-feedback-report.md` | スキル改善提案 |
| 2026-04-27 | 新規作成 | `outputs/phase-12/implementation-guide.md` | 実装ガイド（中学生 + 技術者） |

## unassigned-task-detection【必須】

| 検出項目 | 種別 | 推奨対応 | 割り当て先 |
| --- | --- | --- | --- |
| 本番モニタリング・アラート設定 | 後続タスク | 本番稼働後にメトリクス・ログ収集・アラート閾値を設計し設定する | UT-08 |
| Sheets→D1 同期ジョブ実装 | 後続タスク | 本番 D1 が稼働している前提で同期ジョブを実装し定期実行する | UT-09 |
| カスタムドメイン DNS 移管 | 要確認 | `*.pages.dev` で go-live するか、カスタムドメインの DNS 構成・SSL 発行を別タスクで実施するかを確認 | 要確認（DNS 担当 / インフラ担当） |
| 定期 D1 バックアップ自動化 | 後続タスク | 手動 `wrangler d1 export` を Cron Trigger / GitHub Actions schedule で自動化し、保管先（R2 / 外部ストレージ）を確定 | 新規 UT 起票候補 |
| 本番環境のヘルスチェック定期実行 | 後続タスク | `/health` `/health/db` を定期 ping し、失敗時に通知 | UT-08 と統合 |
| ロールバック演習（drill） | 運用 | 本番でロールバック手順を半年に一度ドリル実行し、runbook を最新化 | 運用担当 |

## skill-feedback-report【必須】

| スキル | フィードバック | 改善提案 |
| --- | --- | --- |
| task-specification-creator | implementation タスク（本番不可逆操作を伴う）の Phase 12 で「実装手順ガイド」と「中学生レベル説明」の両立が求められたが、テンプレートには明示されていなかった | implementation タスク向けの implementation-guide テンプレートに「概念説明（中学生レベル）+ 操作手順（技術者レベル）」の 2 部構成を例示として追加する |
| task-specification-creator | Issue が CLOSED 状態のままタスク仕様書を作成するケース（後追い仕様化）の Phase 13 取り扱いが不明瞭だった | Phase 13 テンプレに「Issue が CLOSED の場合は `Refs #N` を使う／再オープンが必要なら別途判断」のガイダンスを追加する |
| aiworkflow-requirements | deployment-cloudflare.md に「Pages 初回 project create 要否判定」「Workers 初回 rollback 不可」「D1 マイグレーション初回 export は空 SQL になる」等のエッジケース記述があると Phase 2 設計が容易になる | 制約事項・エッジケースセクションを追加する |
| aiworkflow-requirements | deployment-core.md の go-live 方針に「ロールバック発動条件」「判断者」「所要時間目安」のテンプレが欠けていた | go-live runbook の標準項目として追加する |

## phase12-task-spec-compliance-check【必須】

| チェック項目 | 基準 | 状態 |
| --- | --- | --- |
| implementation-guide が作成されている | implementation タスクは Phase 12 に「中学生レベル + 技術者レベル」の 2 部構成ガイドを記録する | pending |
| system-spec-update-summary が作成されている | 影響を受けた正本仕様（aiworkflow-requirements references / 上流タスク runbook）が全て列挙されている | pending |
| documentation-changelog が記録されている | 全変更ファイル（新規 / 更新対象 / 統合先）が表で列挙されている | pending |
| unassigned-task-detection が実施されている | 0 件でも検出結果が出力され、検出時は後続タスクへの委譲が記録されている | pending |
| skill-feedback-report が作成されている | task-specification-creator / aiworkflow-requirements への改善提案が記録されている | pending |
| artifacts 同期が完了している | root `artifacts.json` と `outputs/artifacts.json` の差分がゼロである | pending |
| LOGS / topic-map / index 更新が完了している | LOGS.md x2 と aiworkflow-requirements index 再生成結果が記録されている | pending |
| same-wave sync ルールが守られている | spec-update-workflow.md の同期ルールに従い、上流 02-serial / 04-serial / 05b-parallel への統合が記録されている | pending |
| 本番デプロイ実績の正本反映 | deployment-cloudflare.md / deployment-core.md に go-live 記録が追記される計画が明示されている | pending |
| 機密情報の非混入計画 | database_id 実値・本番 URL の認証情報・API トークンを正本に記載しない方針が明文化されている | pending |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | deploy-execution-log.md を本 Phase の正本反映の入力として使用 |
| Phase 7 | ac-matrix.md を documentation-changelog の AC トレースに使用 |
| Phase 11 | smoke-test-result.md を spec update の go-live 実績エビデンスとして使用 |
| Phase 13 | 本 Phase の全成果物一覧・変更ファイルリストを PR 作成の入力として使用 |

## 多角的チェック観点（AIが判断）

- 価値性: aiworkflow-requirements / 02-serial / 04-serial / 05b-parallel の正本反映により、後続タスクの実装者が本番デプロイ済みの前提で作業できるか。
- 実現性: implementation タスクとしての go-live 実績が docs に正しく反映され、機密情報を含めずに記録できるか。
- 整合性: documentation-changelog が新規ファイル・統合先ファイル・正本反映先を全て網羅しているか。
- 運用性: unassigned-task-detection で UT-08 / UT-09 / DNS / 定期バックアップ等への引き継ぎが漏れていないか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 02-serial runbook 統合 | 12 | pending | 本番 wrangler.toml 構造の統合 |
| 2 | 04-serial runbook 統合 | 12 | pending | 本番 Secrets 配置確認結果の統合 |
| 3 | 05b-parallel handoff 完了印 | 12 | pending | UT-06 完了印を handoff チェックリストに追加 |
| 4 | aiworkflow-requirements 正本反映 | 12 | pending | deployment-cloudflare / deployment-core 追記 |
| 5 | implementation-guide 作成 | 12 | pending | Part 1（中学生）+ Part 2（技術者） |
| 6 | system-spec-update-summary 作成 | 12 | pending | outputs/phase-12/system-spec-update-summary.md |
| 7 | documentation-changelog 記録 | 12 | pending | 全変更ファイルを列挙 |
| 8 | unassigned-task-detection | 12 | pending | 0 件でも出力必須 |
| 9 | skill-feedback-report 作成 | 12 | pending | スキル改善提案 |
| 10 | phase12-task-spec-compliance-check | 12 | pending | 仕様遵守確認 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | spec update summary |
| ドキュメント | outputs/phase-12/documentation-changelog.md | ドキュメント変更履歴 |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | 未割り当てタスク一覧 |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | スキルフィードバック |
| ドキュメント | outputs/phase-12/implementation-guide.md | 実装ガイド（中学生 + 技術者） |
| メタ | artifacts.json | Phase 状態の更新 |

## 完了条件

- 02-serial / 04-serial / 05b-parallel の runbook に本番デプロイ実績が統合されている
- aiworkflow-requirements の deployment-cloudflare.md / deployment-core.md に go-live 実績追記計画が反映されている
- system-spec-update-summary が作成されている
- documentation-changelog が全変更ファイルを網羅して記録されている
- unassigned-task-detection が 0 件でも出力され、検出時は後続タスクへの委譲が明記されている
- skill-feedback-report が作成されている
- implementation-guide（中学生レベル + 技術者レベル）が作成されている
- root `artifacts.json` と `outputs/artifacts.json` が同期されている
- LOGS.md x2、topic-map/resource-map、validation matrix の更新結果が記録されている
- phase12-task-spec-compliance-check の全項目が PASS である

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（権限・無料枠・drift・機密情報混入）も検証済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 13 (PR作成)
- 引き継ぎ事項: Phase 12 の全成果物一覧・documentation-changelog・変更ファイルリスト・Issue #8 が CLOSED 状態である事実を Phase 13 に引き継ぐ。
- ブロック条件: phase12-task-spec-compliance-check に未 PASS 項目がある場合は Phase 13 に進まない。
