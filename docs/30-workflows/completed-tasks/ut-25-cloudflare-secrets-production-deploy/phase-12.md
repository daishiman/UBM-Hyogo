# Phase 12: ドキュメント更新（UT-03 runbook 反映 / aiworkflow-requirements 正本反映）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare Secrets 本番配置（GOOGLE_SERVICE_ACCOUNT_JSON）(ut-25-cloudflare-secrets-production-deploy) |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-29 |
| 前 Phase | 11 (手動 smoke test) |
| 次 Phase | 13 (PR 作成 / ユーザー承認後 secret 投入) |
| 状態 | pending |
| タスク種別 | implementation / NON_VISUAL / cloudflare_secrets_deployment |
| user_approval_required | false |

## 目的

Phase 1〜11 で確定した設計・コマンド系列・MINOR 解決方針・staging smoke 記録テンプレートを、(a) 中学生レベルの概念説明を含む UT-26 担当者向け実装ガイド、(b) aiworkflow-requirements 正本（`.claude/skills/aiworkflow-requirements/references/`）への最小反映、(c) 派生未アサインタスク検出、(d) skill 改善フィードバック、(e) ワークフロー全体の skill 適合チェック、(f) 更新履歴の 6 観点でドキュメント化する。

## 必須 outputs（7 点）

| ファイル | 役割 |
| --- | --- |
| `outputs/phase-12/main.md` | Phase 12 トップ index。6 補助成果物の要約と読み順 |
| `outputs/phase-12/implementation-guide.md` | UT-26 担当者向け実装ガイド（中学生レベル概念説明 + Part 2 コマンド系列再掲） |
| `outputs/phase-12/system-spec-update-summary.md` | aiworkflow-requirements 正本（deployment-secrets-management.md / environment-variables.md / deployment-cloudflare.md）への反映結果 |
| `outputs/phase-12/documentation-changelog.md` | 本ワークフローで更新したドキュメントの変更履歴 |
| `outputs/phase-12/unassigned-task-detection.md` | 本タスク完了で派生する未アサインタスクの検出 |
| `outputs/phase-12/skill-feedback-report.md` | task-specification-creator skill への気付き / 改善提案 |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | 本ワークフロー全体の skill 適合チェック |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 主成果物 | `outputs/phase-12/main.md` | Phase 12 全体 index / 読み順 / traceability |
| 実装ガイド | `outputs/phase-12/implementation-guide.md` | Part 1 中学生レベル概念説明 + Part 2 技術者向け手順 + UT-26 引き渡し |
| 正本反映 | `outputs/phase-12/system-spec-update-summary.md` | aiworkflow-requirements 反映先と反映結果 |
| 更新履歴 | `outputs/phase-12/documentation-changelog.md` | workflow 全成果物の変更履歴 |
| 未タスク検出 | `outputs/phase-12/unassigned-task-detection.md` | 派生タスク検出結果 |
| skill feedback | `outputs/phase-12/skill-feedback-report.md` | task-specification-creator への改善提案 |
| 適合チェック | `outputs/phase-12/phase12-task-spec-compliance-check.md` | 7 観点の最終準拠確認 |

## 中学生レベル概念説明（implementation-guide.md Part 1 の指針）

UT-26 担当者が本タスクに前提知識ゼロで合流できるよう、以下の 4 用語を中学生でも理解できる言葉で記述する。

| 用語 | 中学生レベル説明（implementation-guide.md に書く内容のガイドライン） |
| --- | --- |
| Cloudflare Workers Secret | 「Cloudflare 上のサーバーに、人間が見られない引き出しに入れて持たせる秘密のメモ。コードからは名前で呼べるけど、後から中身を取り出して読むことはできない」 |
| Service Account JSON key | 「Google が発行した『この鍵を持ってる人は Sheets を読み書きしてよい』という許可証ファイル。中に書かれている改行（`\n`）が壊れると鍵として使えなくなる」 |
| `wrangler secret put` | 「Cloudflare の引き出しに秘密のメモを入れるコマンド。staging（練習部屋）と production（本番部屋）の 2 つの引き出しがあって、`--env` で切り替える」 |
| 1Password 経由 stdin 注入 | 「秘密のメモをファイルに書き出さずに、Mac の中で目に見えないパイプを通して直接 Cloudflare に渡す方法。シェル履歴にもファイルにも痕跡が残らない」 |

> 中学生説明には絵文字・専門用語の多用を避け、比喩は 1 用語につき 1 つに絞る。

## 実行タスク

1. `implementation-guide.md` を Part 1（中学生レベル概念説明）+ Part 2（staging で確定したコマンド系列再掲）+ Part 3（UT-26 引き渡しチェックリスト）の 3 部構成で作成する。
2. `system-spec-update-summary.md` で aiworkflow-requirements 正本（`.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` / `environment-variables.md` / `deployment-cloudflare.md`）への反映結果を **before / after + 反映先**で記録する。
3. `unassigned-task-detection.md` に派生未アサインタスクを最低 3 件検出する（例: SA key 定期ローテーション運用 / SA key 失効監視 / Cloudflare Secret bulk export 監査）。各タスクに優先度・親仕様候補・着手前提を記載。
4. `skill-feedback-report.md` に task-specification-creator skill への気付き（例: secret deployment 系での Phase 11 NON_VISUAL evidence 階層の調整余地 / Phase 12 中学生説明テンプレの secret 系特化ガイダンス）を最低 2 件記録。
5. `phase12-task-spec-compliance-check.md` で本ワークフロー全体の skill 適合性を 7 観点（SRP / Phase 1-13 完全 / AC マトリクス / NON_VISUAL evidence / unassigned-task 検出 / skill feedback / docs-only sync）でチェック。
6. `documentation-changelog.md` に本ワークフローで作成・更新した全ファイル（phase-NN.md / outputs/phase-NN/* / artifacts.json / index.md）の変更履歴を記録。
7. `main.md` に 6 補助成果物の読み順とトレーサビリティ表を作成。

## 実行手順

1. Phase 1〜11 の確定事項を読み、Phase 12 の 7 成果物へ責務を分配する。
2. `implementation-guide.md` を Part 1 / Part 2 / UT-26 引き渡しに分け、secret 値を一切転記しない。
3. aiworkflow-requirements 正本は secret 値を転記せず、`GOOGLE_SERVICE_ACCOUNT_JSON` 正本名 / `scripts/cf.sh` 経由 / legacy alias 境界だけを最小反映する。
4. `documentation-changelog.md`、`unassigned-task-detection.md`、`skill-feedback-report.md` を作成し、0 件でも N/A 理由を明記する。
5. `phase12-task-spec-compliance-check.md` で 7 観点を PASS / FAIL で閉じる。

## aiworkflow-requirements 反映先（正本パス）

| reference 正本 | 反映観点 | 担当差分 |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | `GOOGLE_SERVICE_ACCOUNT_JSON` の所在・参照経路 | 「staging / production の Cloudflare Workers Secret に配置済み」「参照は `apps/api` から `env.GOOGLE_SERVICE_ACCOUNT_JSON` のみ」「投入は `bash scripts/cf.sh` 経由のみ」を追記 |
| `.claude/skills/aiworkflow-requirements/references/environment-variables.md` | secret 一覧表 | `GOOGLE_SERVICE_ACCOUNT_JSON` の行を追加（name / scope: apps/api / env: staging+production / 出典: UT-25） |

> Phase 12 review で差分案のみは正本同期漏れと判定したため、本 Phase 内で最小反映する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-11/manual-smoke-log.md | staging smoke 記録テンプレート（ユーザー承認後に実走結果を記録） |
| 必須 | outputs/phase-11/main.md | 保証できない範囲（unassigned-task 候補） |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | secret 一覧反映先 |
| 必須 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | env var 一覧反映先 |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | skill 適合チェック基準 |
| 必須 | CLAUDE.md（シークレット管理 / Cloudflare 系 CLI 実行ルール） | UT-26 引き渡し時の禁止事項転記 |
| 参考 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-12.md | Phase 12 構造リファレンス |

## セキュリティ最優先（Phase 12 文書化ルール）

- **secret 値・JSON 内容・OAuth トークンを一切転記しない**
- 1Password 参照は `op://Vault/Item/Field` のテンプレ表記のみ。実 vault path は UT-03 runbook を参照させる
- `wrangler secret list` の出力をサンプルとして記載する場合も name 行のみ
- 中学生レベル説明でも具体的な key 値・project ID・client email を例示しない

## 完了条件

- [ ] 7 ファイル（main.md + 6 補助成果物）すべてが `outputs/phase-12/` 配下に作成済み
- [ ] `implementation-guide.md` が中学生レベル概念説明 4 用語を含む
- [ ] `system-spec-update-summary.md` が aiworkflow-requirements 正本 3 ファイルへの反映結果を含む
- [ ] `unassigned-task-detection.md` に派生未アサインタスクが最低 3 件記載
- [ ] `skill-feedback-report.md` が task-specification-creator への気付き最低 2 件を含む
- [ ] `phase12-task-spec-compliance-check.md` が 7 観点でチェック済み
- [ ] `documentation-changelog.md` が本ワークフロー全成果物の変更履歴を含む
- [ ] secret 値 / JSON 内容 / OAuth トークンが一切転記されていない

## 検証コマンド

```bash
ls docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-12/
# main.md / implementation-guide.md / system-spec-update-summary.md /
# documentation-changelog.md / unassigned-task-detection.md /
# skill-feedback-report.md / phase12-task-spec-compliance-check.md の 7 件

# secret 値転記が無いこと
! grep -E "BEGIN (PRIVATE|RSA PRIVATE) KEY|client_email\":\s*\"[^\"]*@" \
    docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-12/*.md \
  && echo OK

# 中学生レベル説明の 4 用語が implementation-guide.md に含まれること
for kw in "Cloudflare Workers Secret" "Service Account JSON" "wrangler secret put" "1Password"; do
  grep -q "$kw" docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-12/implementation-guide.md \
    && echo "OK: $kw" || echo "NG: $kw"
done
```

## 苦戦防止メモ

1. **aiworkflow-requirements 正本には secret 値を書かない**: 反映するのは secret 名、投入経路、legacy alias 境界のみ。
2. **中学生説明の比喩は 1 用語 1 つ**: 比喩を重ねると逆に難しくなる。
3. **unassigned-task は「派生」**: 本ワークフローのスコープ外で発生した派生タスクを抽出。本ワークフローでカバーできるタスクを未アサイン扱いしない。
4. **skill feedback は具体的な改善提案**: 「良かった」だけではなく「次回どう変える」をセットで書く。
5. **changelog は機械可読**: ファイルパス / 状態 / 作成 or 更新 / 概要 を表形式で。

## 次 Phase への引き渡し

- 次 Phase: 13 (PR 作成 / ユーザー承認後 secret 投入)
- 引き継ぎ事項:
  - `implementation-guide.md` Part 2 のコマンド系列を `deploy-runbook.md` の本体に転記
  - `unassigned-task-detection.md` の派生タスクを `docs/30-workflows/unassigned-task/` に登録する責務は Phase 13 完了後の別オペレーション
  - `system-spec-update-summary.md` の反映結果と正本更新ファイルを Phase 13 PR 説明文に記載
- ブロック条件:
  - 7 ファイル（main.md + 6 補助成果物）のいずれかが欠落
  - 中学生レベル説明 4 用語のいずれかが未記載
  - secret 値転記が検出される
  - aiworkflow-requirements 正本を本 Phase で書き換えてしまった
