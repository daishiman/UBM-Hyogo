# スクリーンショット保存ディレクトリ — 取得計画と命名規約

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-002-impl-pr-target-safety-gate |
| Phase | 11 |
| visualEvidence | VISUAL |
| ステータス | 未取得（Phase 13 ユーザー承認後に取得） |
| 最低必要枚数 | 7 枚（T-1〜T-5 各 1 枚 + branch protection main / dev 各 1 枚） |

## 命名規約

```
<scenario>-<view>-<YYYY-MM-DD>.png
```

- `<scenario>`: `same-repo-pr` / `fork-pr` / `labeled-trigger` / `workflow-dispatch-audit` / `manual-rerun` / `branch-protection-main` / `branch-protection-dev`
- `<view>`: `actions-ui` / `required-checks`
- 日付は撮影日（JST）

## 取得対象一覧

| # | ファイル名（命名例） | シナリオ | 撮影位置 | 確認すべき内容 | マスク要件 | ステータス |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `same-repo-pr-actions-ui-2026-04-30.png` | T-1 | GitHub Actions UI（PR の Checks タブ） | `pr-target-safety-gate` job が triage のみで完了 / `pr-build-test` job が `contents: read` で完了 / job 名・status 緑 | PR タイトルに個人情報があれば塗りつぶし | 未取得（Phase 13 で承認後取得） |
| 2 | `fork-pr-actions-ui-2026-04-30.png` | T-2 | GitHub Actions UI（fork PR の Checks タブ） | triage が trusted context で実行 / build-test が untrusted で実行 / secrets 参照なし | fork 元アカウント名・メールはマスク | 未取得（Phase 13 で承認後取得） |
| 3 | `labeled-trigger-actions-ui-2026-04-30.png` | T-3 | GitHub Actions UI（label 付与後の run 一覧） | `pull_request_target.types: [labeled]` のみ再実行 / build-test 再実行が走らない | — | 未取得（Phase 13 で承認後取得） |
| 4 | `workflow-dispatch-audit-actions-ui-2026-04-30.png` | T-4 | GitHub Actions UI（workflow_dispatch run 詳細） | manual audit 起点 / PR head checkout なし / trusted context 表示 | — | 未取得（Phase 13 で承認後取得） |
| 5 | `manual-rerun-actions-ui-2026-04-30.png` | T-5 | GitHub Actions UI（Re-run all jobs 後） | job 名・permissions 不変 / required status checks 名と一致 | — | 未取得（Phase 13 で承認後取得） |
| 6 | `branch-protection-main-required-checks-2026-04-30.png` | — | Settings → Branches → main の保護ルール画面 | required status checks の context 名一覧（Actions UI の job 名と完全一致） | リポジトリ admin 操作画面のため、他設定値はマスク不要だが個人情報が映り込む場合は塗りつぶし | 未取得（Phase 13 で承認後取得） |
| 7 | `branch-protection-dev-required-checks-2026-04-30.png` | — | Settings → Branches → dev の保護ルール画面 | required status checks の context 名一覧（Actions UI の job 名と完全一致） | 同上 | 未取得（Phase 13 で承認後取得） |

## 機微情報マスク要件

- **マスク対象**:
  - 個人メールアドレス（PR 作成者・コメント欄等）
  - GitHub アカウント名のうち、本リポジトリ owner（`daishiman`）以外のもの
  - 平文 secret / token（`***` マスクされていない場合のみ。マスク済みは可）
  - PR タイトル本文に紛れ込んだ機密文字列（API キー類）
- **マスク不要**:
  - workflow / job 名
  - status の緑 / 赤バッジ
  - required status checks の context 名
  - ワークフロー定義パス（`.github/workflows/*.yml`）

## 撮影手順（Phase 13 承認後）

1. 対象 PR / branch を作成 or 既存 PR を再利用。
2. GitHub Actions UI を開き、対象 run の Checks タブを表示。ブラウザの zoom を 100% に設定。
3. macOS の場合: `Cmd + Shift + 4` → スペース → ウィンドウ選択でウィンドウ単位スクリーンショット。
4. マスク対象を画像編集ツール（Preview / Skitch 等）で塗りつぶし。
5. 命名規約に従いリネームし `outputs/phase-11/screenshots/` に保存。
6. 本 README の表「ステータス」列を「取得済（YYYY-MM-DD）」に更新し、撮影日時・確認結果を追記。

## required status checks 同期確認コマンド（撮影と併用）

```bash
gh api repos/daishiman/UBM-Hyogo/branches/main/protection -q '.required_status_checks.contexts'
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection  -q '.required_status_checks.contexts'
```

上記出力と branch protection 画面のスクリーンショット、Actions UI の job 名がすべて一致することを目視確認する。

## 完了条件

- [ ] 7 枚以上のスクリーンショットが命名規約に従い保存されている。
- [ ] 各画像に対し本表の「確認すべき内容」が満たされている。
- [ ] 機微情報マスク要件が満たされている。
- [ ] required status checks の context 名一致が `gh api` 出力と画像で確認されている。
