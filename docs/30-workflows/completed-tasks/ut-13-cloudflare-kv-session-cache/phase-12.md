# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare KV セッションキャッシュ設定 (UT-13) |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-27 |
| 前 Phase | 11 (手動 smoke test) |
| 次 Phase | 13 (PR作成) |
| 状態 | completed |

## 目的

本タスク（UT-13）の成果物を正本仕様（system spec）に同期し、`.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` に KV 設定セクションを追記する。close-out として未割り当てタスクの検出・スキルフィードバックを行い、Phase 12 タスク仕様遵守チェックを実施する。

## 実行タスク

- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` に KV 設定セクションを追記する
- `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` に KV エントリを追加する
- LOGS.md（aiworkflow-requirements / task-specification-creator 両方）を更新する
- SKILL.md（aiworkflow-requirements / task-specification-creator 両方）の必要更新有無を判定する
- task-workflow / completed ledger / 関連タスクテーブル / `spec_created` 台帳を same-wave sync 対象として確認する
- artifacts.json と outputs/artifacts.json の parity を確認する
- implementation-guide.md（Part 1 中学生レベル概念説明 + Part 2 技術詳細）を作成する
- system-spec-update-summary.md を作成する
- documentation-changelog.md を記録する
- unassigned-task-detection.md を作成する（0 件でも出力必須）
- skill-feedback-report.md を作成する（改善点なしでも出力必須）
- phase12-task-spec-compliance-check.md を作成する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Phase 12 同期ルール |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-documentation-guide.md | implementation-guide 作成ガイド |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | 追記先正本ファイル |
| 必須 | docs/30-workflows/ut-13-cloudflare-kv-session-cache/index.md | タスク正本 |
| 必須 | docs/30-workflows/ut-13-cloudflare-kv-session-cache/outputs/phase-11/smoke-test-result.md | smoke test 結果 |
| 参考 | docs/30-workflows/ut-13-cloudflare-kv-session-cache/outputs/phase-07/ac-matrix.md | AC 完了証跡 |

## 実行手順

### ステップ 1: 正本仕様への同期

- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` に KV 設定セクションを追記する（バインディング名・TTL 方針・無料枠・最終的一貫性指針）
- `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` に KV / SESSION_KV / セッションキャッシュのエントリを追加する
- LOGS.md（aiworkflow-requirements / task-specification-creator 両方）に本タスクの完了ログを追記する
- SKILL.md x2 は入口説明・変更履歴に影響がある場合のみ更新し、不要の場合も `documentation-changelog.md` に N/A 理由を記録する
- task-workflow / completed ledger / 関連タスクテーブル / `spec_created` 台帳の更新要否を Step 1-A〜1-C として記録する
- artifacts.json と outputs/artifacts.json の parity を確認する

### ステップ 2: implementation-guide.md 作成

- Part 1: 中学生レベル概念説明（KV とは何か / セッションキャッシュとは / なぜ必要か）を執筆
- Part 2: 技術詳細（wrangler コマンド / バインディング設定 / TTL 設計 / 一貫性制約）を執筆

### ステップ 3: close-out タスクの実施

- system-spec-update-summary を作成
- documentation-changelog に本タスクの変更履歴を記録
- unassigned-task-detection で未割り当てタスクを洗い出し（0 件でも出力）
- skill-feedback-report で本タスクで判明したスキル改善点を記録（なしでも出力）
- phase12-task-spec-compliance-check で仕様遵守を確認

## implementation-guide【必須】

本タスクは **docs-only** であるため、コード実装は対象外。
下記は KV セッションキャッシュ設定を実際に適用する際の実装ガイドとして記録する（下流の認証実装タスクで使用）。

### Part 1: 中学生レベル概念説明（implementation-guide.md に記載）

- **Cloudflare KV とは**: 世界中の Cloudflare サーバーに分散して置かれる「キーと値のメモ帳」。素早く読めるが、書いた内容が世界中に広まるまで時間差が出ることがある。
- **セッションキャッシュとは**: ログインしたユーザーの「いま誰がログインしているか」という情報を一時的に覚えておく仕組み。毎回データベースに聞きにいかなくて済むので速い。
- **TTL とは**: 情報を覚えておく時間（Time To Live）。1 時間と決めたら 1 時間で自動的に消える。
- **なぜ環境を分けるか**: 練習用（staging）と本番用（production）で同じ場所を使うと、本番のお客様データが練習で書き換わってしまうから。

### Part 2: 技術詳細（implementation-guide.md に記載）

#### wrangler.toml KV バインディング設定例

```toml
[[kv_namespaces]]
binding = "SESSION_KV"
id = "<local-preview-id>"
preview_id = "<local-preview-id>"

[vars]
SESSION_BLACKLIST_TTL_SECONDS = "86400"
CONFIG_CACHE_TTL_SECONDS     = "3600"
RATE_LIMIT_WINDOW_SECONDS    = "60"

[env.staging]
[[env.staging.kv_namespaces]]
binding = "SESSION_KV"
id = "<staging-namespace-id>"

[env.production]
[[env.production.kv_namespaces]]
binding = "SESSION_KV"
id = "<production-namespace-id>"
```

#### KV Namespace 作成コマンド

```bash
# staging Namespace 作成（preview 含む）
wrangler kv:namespace create ubm-hyogo-kv-staging
wrangler kv:namespace create ubm-hyogo-kv-staging --preview

# production Namespace 作成
wrangler kv:namespace create ubm-hyogo-kv-prod
```

#### TTL 設計指針

- 検証 TTL: 60 秒以上を推奨（KV key expiration TTL と edge cache `cacheTtl` を混同しない）
- セッションブラックリスト TTL: 86400 秒（24 時間、JWT 有効期限と一致）
- 設定キャッシュ TTL: 3600 秒（1 時間）
- レートリミット window: 60 秒
- ログアウト時: KV delete + サーバー側 deny list 併用検討（最大 60 秒間 read される可能性のため）

## system-spec-update-summary【必須】

| 更新対象 | 変更内容 | 影響範囲 |
| --- | --- | --- |
| .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | KV 設定セクション追記（バインディング名・TTL・無料枠・一貫性指針） | 下流の認証・セッション管理実装タスク全般 |
| .claude/skills/aiworkflow-requirements/indexes/topic-map.md | KV / SESSION_KV / セッションキャッシュのエントリ追加 | spec 検索ユーザー全般 |
| wrangler.toml 設計ガイドライン | KV バインディング DRY 化方針・TTL 集中管理方針を追加 | 下流のインフラタスク実装者 |
| task-workflow / completed ledger / 関連タスクテーブル / spec_created 台帳 | Step 1-A〜1-C の current facts 反映 | Phase 12 same-wave sync の整合性 |

## documentation-changelog【必須】

| 日付 | 変更種別 | 対象ファイル | 変更概要 |
| --- | --- | --- | --- |
| 2026-04-27 | 新規作成 | docs/30-workflows/ut-13-cloudflare-kv-session-cache/ | UT-13 タスク仕様書全体 |
| 2026-04-27 | 追記対象 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | KV 設定セクション統合 |
| 2026-04-27 | 追記対象 | .claude/skills/aiworkflow-requirements/indexes/topic-map.md | KV エントリ追加 |
| 2026-04-27 | 判定対象 | .claude/skills/aiworkflow-requirements/SKILL.md | 入口説明・変更履歴への反映要否を判定 |
| 2026-04-27 | 判定対象 | .claude/skills/task-specification-creator/SKILL.md | 入口説明・変更履歴への反映要否を判定 |
| 2026-04-27 | 追記対象 | .claude/skills/aiworkflow-requirements/LOGS.md | UT-13 完了ログ |
| 2026-04-27 | 追記対象 | .claude/skills/task-specification-creator/LOGS.md | UT-13 仕様作成完了ログ |
| 2026-04-27 | 作成対象 | outputs/phase-12/system-spec-update-summary.md | spec update summary 作成 |

## unassigned-task-detection【必須】

> 検出 0 件でも本ファイルは出力必須。

| 検出項目 | 種別 | 推奨対応 | 割り当て先 |
| --- | --- | --- | --- |
| KV namespace の実 ID 発行・1Password 登録 | 運用 | wrangler kv:namespace create 実行・実値を 1Password Environments に保管 | 運用担当 |
| Worker 側 KV read/write 実装（getSession/putSession ヘルパー） | 実装 | 認証実装タスクで実施 | 下流の認証タスク |
| ログアウト時の deny list 併用設計 | 設計 | KV 最終的一貫性を考慮した設計検討 | 下流のセッション管理タスク |
| KV 無料枠 read/write 数の本番モニタリング | 運用 | Cloudflare Analytics で監視・閾値超過時アラート | 運用担当 |

## skill-feedback-report【必須】

> 改善点なしでも本ファイルは出力必須。

| スキル | フィードバック | 改善提案 |
| --- | --- | --- |
| task-specification-creator | docs-only / NON_VISUAL タスクの Phase 11 取り扱いがテンプレートに沿って実施可能 | NON_VISUAL タスク向けの Phase 11 テンプレート拡充検討 |
| aiworkflow-requirements | deployment-cloudflare.md に KV 関連記述が不足していた | 本タスクで追記する KV セクションを正本として固定 |

## phase12-task-spec-compliance-check【必須】

| チェック項目 | 基準 | 状態 |
| --- | --- | --- |
| implementation-guide.md（Part 1 + Part 2）が作成されている | 中学生レベル説明 + 技術詳細を両方含む | completed |
| system-spec-update-summary.md が作成されている | 影響を受けた正本仕様が列挙されている | completed |
| documentation-changelog.md が記録されている | 全変更ファイルが記録されている | completed |
| unassigned-task-detection.md が出力されている | 0 件でもファイル存在 | completed |
| skill-feedback-report.md が出力されている | 改善点なしでもファイル存在 | completed |
| phase12-task-spec-compliance-check.md が作成されている | 全チェック項目状態が記録 | completed |
| deployment-cloudflare.md に KV 設定セクション追記済み | KV 関連の記述が正本に存在 | completed |
| indexes/topic-map.md に KV エントリ追加済み | KV / SESSION_KV エントリ存在 | completed |
| LOGS.md（両スキル）更新済み | UT-13 完了ログ記載 | completed |
| SKILL.md（両スキル）更新要否が判定されている | 更新または N/A 理由が documentation-changelog に記録 | completed |
| Step 1-A〜1-C が記録されている | 完了記録、実装状況、関連タスクテーブルの current facts が記録 | completed |
| task-workflow / completed ledger / spec_created 台帳が同期されている | same-wave sync 対象の更新または N/A 理由が記録 | completed |
| artifacts.json / outputs/artifacts.json parity | 両者の Phase 状態一致 | completed |
| same-wave sync ルールが守られている | spec-update-workflow.md の同期ルールに従っている | completed |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | runbook を spec 統合の参照元として使用 |
| Phase 11 | smoke test 結果を close-out に記録 |
| Phase 13 | PR 作成のための成果物一覧を提供 |

## 多角的チェック観点（AIが判断）

- 価値性: deployment-cloudflare.md への KV セクション追記により下流タスクが KV 設定を見落とさないか。
- 実現性: docs-only 範囲で system spec update が完結しているか。
- 整合性: documentation-changelog が全変更ファイルを網羅しているか。
- 運用性: unassigned-task-detection で後続タスクへの引き継ぎが漏れていないか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | deployment-cloudflare.md 追記 | 12 | completed | KV 設定セクション |
| 2 | indexes/topic-map.md エントリ追加 | 12 | completed | KV / SESSION_KV |
| 3 | LOGS.md 更新（両スキル） | 12 | completed | UT-13 完了ログ |
| 4 | SKILL.md 更新要否判定（両スキル） | 12 | completed | 更新または N/A 記録 |
| 5 | Step 1-A〜1-C / ledger / spec_created 台帳同期 | 12 | completed | same-wave sync |
| 6 | artifacts.json parity 確認 | 12 | completed | 両 artifacts.json 一致 |
| 7 | implementation-guide.md 作成 | 12 | completed | Part 1 + Part 2 |
| 8 | system-spec-update-summary 作成 | 12 | completed | outputs/phase-12/ |
| 9 | documentation-changelog 記録 | 12 | completed | 全変更ファイル列挙 |
| 10 | unassigned-task-detection | 12 | completed | 0 件でも出力 |
| 11 | skill-feedback-report 作成 | 12 | completed | なしでも出力 |
| 12 | phase12-task-spec-compliance-check | 12 | completed | 仕様遵守確認 |

## 成果物【必須 6 ファイル】

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/implementation-guide.md | Part 1 中学生レベル概念説明 + Part 2 技術詳細 |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | spec update summary |
| ドキュメント | outputs/phase-12/documentation-changelog.md | ドキュメント変更履歴 |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | 未割り当てタスク一覧（0 件でも必須） |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | スキルフィードバック（なしでも必須） |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | Phase 12 仕様遵守チェック結果 |
| メタ | artifacts.json | Phase 状態の更新 |
| メタ | outputs/artifacts.json | parity 維持 |

## 完了条件

- 必須 6 ファイル全てが outputs/phase-12/ に配置されている
- deployment-cloudflare.md に KV 設定セクションが追記されている
- indexes/topic-map.md に KV エントリが追加されている
- LOGS.md（両スキル）が更新されている
- SKILL.md（両スキル）の更新要否が判定され、N/A の場合も理由が記録されている
- Step 1-A〜1-C / ledger / `spec_created` 台帳の same-wave sync 結果が記録されている
- artifacts.json / outputs/artifacts.json の parity が確認されている
- phase12-task-spec-compliance-check の全項目が PASS である

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み（必須 6 ファイル + 同期対象）
- 全完了条件にチェック
- 異常系（権限・無料枠・drift）も検証済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 13 (PR作成)
- 引き継ぎ事項: Phase 12 の必須 6 成果物・documentation-changelog・spec 同期結果・変更ファイルリストを Phase 13 に引き継ぐ。
- ブロック条件: phase12-task-spec-compliance-check に未 PASS 項目がある場合は Phase 13 に進まない。
