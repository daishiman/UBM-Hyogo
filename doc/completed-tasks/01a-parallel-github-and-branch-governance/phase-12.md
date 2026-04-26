# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | github-and-branch-governance |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-23 |
| 前 Phase | 11 (手動 smoke test) |
| 次 Phase | 13 (PR作成) |
| 状態 | pending |
| user_approval_required | false |

## 目的

Phase 11 の手動 smoke test が通過したことを前提に、このタスクで作成・更新した全ドキュメントの最終同期を行う。aiworkflow-requirements スキルへの反映事項を整理し、task-specification-creator スキルへのフィードバックを記録する。また、`artifacts.json` と `index.md` を completed 状態に更新し、Phase 13 PR 作成の前提を整える。

## 実行タスク

### ステップ 1: input と前提の確認

- Phase 11 の `outputs/phase-11/manual-smoke-log.md` を読む（`link-checklist.md` は本 task では N/A）
- `index.md` の Phase 一覧を確認し、Phase 1〜11 が全て completed になっているかチェックする
- `artifacts.json` の現在の状態を確認する
- 同 Wave 並列タスク（01b, 01c）の状態を確認し、same-wave sync の整合を取る

### ステップ 2: 必須成果物の作成

以下の 6 ファイルを `doc/01a-parallel-github-and-branch-governance/outputs/phase-12/` に作成する。

#### 2-1: implementation-guide.md

Branch governance の運用方法を実装者・運用者向けに記述する。以下の内容を含める。

- branch 運用ルール（feature/* → dev → main のフロー）
- PR 作成・レビュー手順
- emergency hotfix 手順（admin bypass の条件と記録方法）
- reviewer 不在時の escalation パス
- environment（production / staging）へのデプロイ確認手順
- CODEOWNERS 変更時の手順
- 2 パート構成にする
  - Part 1: 中学生レベル。日常の例えを使い、専門用語を避け、なぜ必要かを先に説明する
  - Part 2: 技術者レベル。TypeScript の type / interface、API/CLI シグネチャ、使用例、エラーハンドリング、エッジケース、設定項目と定数一覧を含める

#### 2-2: system-spec-update-summary.md

aiworkflow-requirements スキルの `references/` ファイルに反映すべき事項をまとめる。

- `deployment-branch-strategy.md` への反映事項（AC-1, AC-2 は変更不要ならその旨を記録）
- `deployment-core.md` への反映事項（`develop` → `dev` のブランチ名修正）
- `deployment-cloudflare.md` への反映事項（staging / preview mapping の `develop` → `dev` 修正）
- 追加が必要な参照ファイルの有無
- 反映優先度（must / should / could）

#### 2-3: documentation-changelog.md

このタスクで作成・更新した全ドキュメントのログを記録する。

| ファイルパス | 操作 | Phase | 変更概要 |
| --- | --- | --- | --- |
| outputs/phase-01/ | created | 1 | 要件定義書 |
| outputs/phase-02/github-governance-map.md | created | 2 | branch/env/review/CODEOWNERS 設計 map |
| outputs/phase-05/repository-settings-runbook.md | created | 5 | GitHub 設定適用 runbook |
| outputs/phase-05/pull-request-template.md | created | 5 | PR テンプレート |
| outputs/phase-05/codeowners.md | created | 5 | CODEOWNERS 本文 |
| outputs/phase-05/main.md | created | 5 | 適用結果サマリー |
| outputs/phase-12/implementation-guide.md | created | 12 | 運用ガイド |
| outputs/phase-12/system-spec-update-summary.md | created | 12 | spec 更新サマリー |
| outputs/phase-12/documentation-changelog.md | created | 12 | 本ファイル |
| outputs/phase-12/unassigned-task-detection.md | created | 12 | 未割り当てタスク検出 |
| outputs/phase-12/skill-feedback-report.md | created | 12 | スキルフィードバック |
| outputs/phase-12/phase12-task-spec-compliance-check.md | created | 12 | 必須成果物網羅性確認 |
| outputs/phase-13/local-check-result.md | created | 13 | PR 前ローカル確認結果 |
| outputs/phase-13/change-summary.md | created | 13 | 変更サマリー |
| artifacts.json | updated | 12 | 全 Phase を completed に更新 |
| index.md | updated | 12 | 状態を completed に更新 |
| .claude/skills/aiworkflow-requirements/LOGS.md | n/a | 12 | この task では skill 正本を変更しない |
| .claude/skills/task-specification-creator/LOGS.md | n/a | 12 | この task では skill 正本を変更しない |

#### 2-4: unassigned-task-detection.md

このタスクのスコープ外で検出した未割り当てタスクを記録する。フォーマット:

| 検出内容 | 推奨割り当て先 | 優先度 | 検出 Phase |
| --- | --- | --- | --- |
| secret 実値投入手順 | 04-serial-cicd-secrets-and-environment-sync Phase 5 | high | 2 |
| Cloudflare Pages deploy 設定 | 01b-parallel-cloudflare-base-bootstrap | medium | 2 |
| Google Workspace SSO 連携 | 01c-parallel-google-workspace-bootstrap | medium | 3 |

#### 2-5: skill-feedback-report.md

task-specification-creator スキルへのフィードバックを記録する。以下を含める。

- スキルの有効性評価（AC traceability の質）
- フォーマット改善提案
- Phase 12 必須成果物リストの充足度評価
- docs-only タスクに特有の運用上の課題

#### 2-6: phase12-task-spec-compliance-check.md

Phase 12 必須成果物の網羅性を確認する。フォーマット:

| 成果物 | パス | 作成済み | 備考 |
| --- | --- | --- | --- |
| 実装ガイド | outputs/phase-12/implementation-guide.md | - | |
| system spec update | outputs/phase-12/system-spec-update-summary.md | - | |
| changelog | outputs/phase-12/documentation-changelog.md | - | |
| unassigned | outputs/phase-12/unassigned-task-detection.md | - | |
| skill feedback | outputs/phase-12/skill-feedback-report.md | - | |
| compliance check | outputs/phase-12/phase12-task-spec-compliance-check.md | - | 本ファイル |

### ステップ 3: metadata ファイルの更新

#### artifacts.json の更新

`artifacts.json` の全 Phase（1〜12）を `completed` に更新する。Phase 13 は `pending` のまま残す（ユーザー承認後に更新）。

```json
{
  "task": "github-and-branch-governance",
  "phases": {
    "1": { "status": "completed", "output": "outputs/phase-01/" },
    "2": { "status": "completed", "output": "outputs/phase-02/" },
    "3": { "status": "completed", "output": "outputs/phase-03/" },
    "4": { "status": "completed", "output": "outputs/phase-04/" },
    "5": { "status": "completed", "output": "outputs/phase-05/" },
    "6": { "status": "completed", "output": "outputs/phase-06/" },
    "7": { "status": "completed", "output": "outputs/phase-07/" },
    "8": { "status": "completed", "output": "outputs/phase-08/" },
    "9": { "status": "completed", "output": "outputs/phase-09/" },
    "10": { "status": "completed", "output": "outputs/phase-10/" },
    "11": { "status": "completed", "output": "outputs/phase-11/" },
    "12": { "status": "completed", "output": "outputs/phase-12/" },
    "13": { "status": "pending", "output": "outputs/phase-13/" }
  }
}
```

#### index.md の更新

`index.md` の Phase 一覧テーブルで Phase 1〜12 の状態を `pending` から `completed` に変更する。

### ステップ 4: same-wave sync チェック

並列タスク（01b, 01c）との整合を確認する。

| 確認項目 | 対象タスク | 確認内容 |
| --- | --- | --- |
| CODEOWNERS 責務衝突なし | 01b, 01c | `doc/01b-*/` と `doc/01c-*/` の所有者が 01a と衝突しないか |
| secrets 配置先が一致 | 01b, 01c | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` の配置先が同一か |
| environment 名が一致 | 01b | `production` / `staging` の命名が 01b と一致するか |
| branch 名が一致 | 01b, 01c | `main` / `dev` の運用ルールが同 Wave で矛盾しないか |

### ステップ 5: 4条件と handoff の確認

- 価値性 / 実現性 / 整合性 / 運用性を再確認する
- aiworkflow-requirements/LOGS.md と task-specification-creator/LOGS.md は、この task では N/A として扱う場合も理由を明記する
- Phase 13 PR 作成に渡す blocker と open question を記録する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` | branch / reviewers / env mapping |
| 必須 | `.claude/skills/aiworkflow-requirements/references/deployment-core.md` | CI/CD 品質ゲート |
| 必須 | `.claude/skills/task-specification-creator/SKILL.md` | Phase 12 必須成果物の定義 |
| 必須 | `doc/01a-parallel-github-and-branch-governance/outputs/phase-11/manual-smoke-log.md` | smoke test 通過証跡 |
| 必須 | `doc/01a-parallel-github-and-branch-governance/artifacts.json` | Phase 状態の機械可読サマリー |
| 参考 | `doc/01b-parallel-cloudflare-base-bootstrap/index.md` | same-wave sync 確認 |
| 参考 | `doc/01c-parallel-google-workspace-bootstrap/index.md` | same-wave sync 確認 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | smoke test 通過証跡を本 Phase の起点として使用 |
| Phase 7 | AC トレース結果を implementation-guide.md に反映 |
| Phase 10 | gate 判定結果を system-spec-update-summary.md に反映 |
| Phase 13 | 本 Phase の全成果物を PR 作成の前提として使用 |

## 多角的チェック観点

| 観点 | チェック内容 | 合否判定 |
| --- | --- | --- |
| 価値性 | branch protection と environment 保護により、未レビューコードの production 流入を防ぐことが実装ガイドに明記されているか | - |
| 実現性 | Phase 12 の全成果物が docs-only タスクとして実装なしで作成できているか | - |
| 整合性 | `deployment-branch-strategy.md` の設計値と Phase 2 の設計値、および Phase 5 の runbook が一致しているか | - |
| 運用性 | implementation-guide.md に emergency hotfix 手順と escalation パスが記述されているか | - |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | Phase 11 output 読み込み・前提確認 | 12 | pending | manual-smoke-log.md を確認 |
| 2 | implementation-guide.md 作成 | 12 | pending | `outputs/phase-12/` |
| 3 | system-spec-update-summary.md 作成 | 12 | pending | aiworkflow-requirements 反映事項 |
| 4 | documentation-changelog.md 作成 | 12 | pending | 全 Phase の成果物ログ |
| 5 | unassigned-task-detection.md 作成 | 12 | pending | スコープ外タスクの記録 |
| 6 | skill-feedback-report.md 作成 | 12 | pending | task-specification-creator へのフィードバック |
| 7 | phase12-task-spec-compliance-check.md 作成 | 12 | pending | 必須成果物の網羅性確認 |
| 8 | artifacts.json を全 Phase completed に更新 | 12 | pending | Phase 13 は pending のまま |
| 9 | index.md の状態を updated | 12 | pending | Phase 1〜12 を completed |
| 10 | same-wave sync チェック（01b, 01c） | 12 | pending | CODEOWNERS / secrets / env 整合 |
| 11 | 4条件と handoff 確認 | 12 | pending | Phase 13 への blockers |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-12/implementation-guide.md` | 実装者・運用者向け branch governance 運用ガイド |
| ドキュメント | `outputs/phase-12/system-spec-update-summary.md` | aiworkflow-requirements スキルへの反映事項 |
| ドキュメント | `outputs/phase-12/documentation-changelog.md` | タスク全体のドキュメント変更ログ |
| ドキュメント | `outputs/phase-12/unassigned-task-detection.md` | スコープ外で検出した未割り当てタスク |
| ドキュメント | `outputs/phase-12/skill-feedback-report.md` | task-specification-creator へのフィードバック |
| ドキュメント | `outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 12 必須成果物の網羅性確認 |
| メタ | `artifacts.json` | Phase 1〜12 を completed に更新 |
| メタ | `index.md` | Phase 1〜12 の状態を completed に更新 |

## 完了条件

- [ ] `outputs/phase-12/` に 6 つの必須成果物が全て作成済み
- [ ] `artifacts.json` の Phase 1〜12 が `completed`、Phase 13 が `pending`
- [ ] `index.md` の Phase 1〜12 が `completed`
- [ ] same-wave sync チェック（01b, 01c との整合）が完了
- [ ] implementation-guide.md に emergency hotfix 手順が含まれている
- [ ] system-spec-update-summary.md が aiworkflow-requirements の参照ファイルを明示している
- [ ] Phase 13 への blocker と引き継ぎ事項が明記されている

## タスク 100% 実行確認【必須】

- [ ] 全実行タスク（サブタスク 1〜11）が completed
- [ ] 全成果物（6 ファイル + artifacts.json + index.md）が指定パスに配置済み
- [ ] 全完了条件にチェック済み
- [ ] secrets 実値が成果物に含まれていない
- [ ] same-wave sync（01b, 01c）の整合確認済み
- [ ] skill log 同期が必要な場合は、N/A / 更新理由が documentation-changelog.md に明記済み
- [ ] Phase 13 への引き継ぎ事項を記述済み
- [ ] `artifacts.json` の Phase 12 を completed に更新済み

## 次Phase

- 次: 13 (PR作成)
- 引き継ぎ事項:
  - Phase 12 の全成果物が `outputs/phase-12/` に配置済みであること
  - `artifacts.json` の Phase 1〜12 が completed であること
  - same-wave sync（01b, 01c）の整合確認が完了していること
  - `outputs/phase-13/local-check-result.md` と `outputs/phase-13/change-summary.md` を Phase 13 で作成すること
- ブロック条件: Phase 12 の必須成果物（6 ファイル）のうち 1 つでも未作成なら Phase 13 に進まない

## 4条件評価テーブル

| 条件 | 評価内容 | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | branch governance の運用ガイドが揃い、後続の実装者・運用者のオンボーディングコストを削減できるか | - | implementation-guide.md の完成度 |
| 実現性 | docs-only タスクとして、コード実装なしで全成果物が作成できるか | - | 全成果物がマークダウンドキュメント |
| 整合性 | artifacts.json / index.md / 各 outputs が整合しているか | - | changelog との突き合わせ |
| 運用性 | same-wave sync が取れており、Phase 13 PR 作成への handoff が破綻しないか | - | same-wave sync チェック結果 |

---

## 中学生レベル概念説明

このセクションでは、このタスクで扱う技術概念を中学生でも理解できる例え話で説明する。

### GitHub とは

**例え話:** GitHub は「学校のプリント配布管理ノート」のようなもの。

誰が何のプリント（コード）を変えたか、いつ変えたか、なぜ変えたかを全て記録している。もし間違えても「昨日の版に戻して」と言えば元に戻せる。チームで同じプリントを同時に直すときも、ぶつかりを自動で検出してくれる。

### branch（ブランチ）とは

**例え話:** ブランチは「下書きノート」のようなもの。

正式なノート（main ブランチ）に直接書き込むのは危険なので、まず下書きノート（feature/* ブランチ）に書く。先生に確認（レビュー）してもらい、合格したら正式なノートに転記（マージ）する。下書きノートを複数同時に使うこともできる。

### branch protection（ブランチ保護）とは

**例え話:** ブランチ保護は「重要なノートに南京錠をかける仕組み」のようなもの。

大事なノート（main ブランチ）は、勝手に書き換えられないように鍵がかかっている。鍵を開けるには「先生 2 人のハンコ（2名のレビュー承認）」と「宿題が全部終わった証明（CI テスト全通過）」が必要。これにより、間違いが本番環境に混入するのを防ぐ。

### reviewer（レビュアー）とは

**例え話:** レビュアーは「作文を赤ペンで確認してくれる先生」のようなもの。

コードを本番に適用する前に、内容が正しいか確認してくれる人。main ブランチへの変更には先生 2 人（reviewer 2名）、練習環境（dev ブランチ）への変更には先生 1 人（reviewer 1名）の確認が必要。

### environment（環境）とは

**例え話:** environment は「本番の棚と練習の棚」のようなもの。

同じ商品でも「お客様に見せる棚（production 環境）」と「新商品を試す裏の棚（staging 環境）」は分けて管理する。本番の棚に入れるには厳しい検査が必要で、練習の棚は気軽に試せる。ここでは `production` = main ブランチからのみ、`staging` = dev ブランチからのみとルール付けしている。

### CODEOWNERS とは

**例え話:** CODEOWNERS は「どのクラスがどの教室を管理するか決めた掲示板」のようなもの。

学校の各教室（ファイルやディレクトリ）の「管理責任者クラス（オーナー）」を明記した掲示板。教室に変更があるとき（PR）は、必ずその管理責任者クラスに通知が行き、確認してもらう仕組み。

### PR template（PR テンプレート）とは

**例え話:** PR テンプレートは「変更申請書のひな型」のようなもの。

ノートを変えるとき（PR）に必ず記入する申請書のひな型。「何のために変えるか（True Issue）」「他に影響があるか（Dependency）」「4つの条件（価値性・実現性・整合性・運用性）を確認したか」を必ず書かないと提出できない仕組み。
