# 未割当タスク: `require_code_owner_reviews=true` 切替 runbook

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスクID | task-codeowners-require-reviews-runbook-001 |
| 作成日 | 2026-04-29 |
| 起点 | docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-12/unassigned-task-detection.md (C-5) |
| 種別 | governance / NON_VISUAL / runbook |
| 優先度 | Low |
| 状態 | unassigned |
| 関連 | UT-GOV-003 (CODEOWNERS), UT-GOV-001 (branch protection apply) |

## 背景

CLAUDE.md および UT-GOV-001 で「solo 運用ポリシー」として `required_pull_request_reviews=null` を採用しており、UT-GOV-003 でも `require_code_owner_reviews=false` 維持を明記した。本リポジトリは現状 daishiman 単独運用のため、CODEOWNERS は「メモ / GitHub UI suggested reviewer 表示」用途に閉じている。

将来 contributor が増えた / 監査要件が変わった等のトリガで `require_code_owner_reviews=true` を有効化する判断が発生したとき、何を確認し何を切り替えるかを事前に runbook 化しておくと、判断時に CODEOWNERS の網羅性 / branch protection / required status checks の組み合わせミスを防げる。優先度は Low（solo 運用解消の予兆が見えた時点で起票・実行する想定）。

## スコープ

### 含む

- 切替判断トリガの基準明文化（contributor 増加 / 監査要件 / 外部委託 等）
- 切替前チェックリスト
  - CODEOWNERS の全実フォルダ網羅性検証
  - 全 owner ハンドルの GitHub アカウント存在 / write 権限確認
  - bypass 経路の棚卸し（admin override / status check 例外）
  - solo 運用解消後の レビュー SLO（応答時間想定）
- 切替手順（GitHub branch protection API / UI / Terraform 相当）
- ロールバック手順（緊急 disable）
- 切替後 smoke（PR を 1 件作って owner review 必須化が効くこと）

### 含まない

- 現時点での `require_code_owner_reviews=true` 有効化（本タスクは runbook 整備のみ）
- contributor onboarding 文書（別タスク領域）
- 組織アカウント / Team 化（GitHub Org 移行は別判断）

## 受入条件

- AC-1: runbook が `docs/30-workflows/` または `docs/00-getting-started-manual/runbooks/` に配置される
- AC-2: 切替トリガが箇条書きで列挙され、各トリガに対する判断主体が明記される
- AC-3: 切替前チェックリストが全項目チェックボックス形式で記述される
- AC-4: ロールバック手順が「緊急 disable」「段階的 disable」の 2 種で記述される
- AC-5: UT-GOV-001 / UT-GOV-003 への双方向リンクが張られている

## 苦戦箇所（UT-GOV-003 で確認）

- **solo 運用の前提共有**: CLAUDE.md「solo 運用ポリシー」セクションと UT-GOV-001 の `required_pull_request_reviews=null` 方針が前提として強く効いており、本 runbook を書く際にも「現在は OFF が正解」と冒頭に明記しないと将来の reader が誤って ON 化判断をする恐れがある。判断基準セクションを「なぜ今は OFF か」から書き始めること。
- **GitHub UI と API の差異**: `require_code_owner_reviews` フラグは UI から切り替えると settings に反映されるが、Terraform / branch protection API での反映パスと UI 経路が混在しうる。本リポジトリでの正規パスを runbook で 1 つに固定すること（恐らく API / Terraform 化を将来採用、現状は UI で問題ない）。
- **CODEOWNERS 網羅性検証**: `gh api .../codeowners/errors` は構文エラーを検出するが、「未カバー path」は検出しない。本 runbook では `git ls-files | xargs -I{} gh api .../{path}/codeowners` 等の網羅性スクリプトを用意するか、任意とするかを判断する必要がある。

## 参照

- `docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-12/`
- CLAUDE.md「ブランチ戦略」セクション（solo 運用ポリシー）
- 関連 Issue: #146（UT-GOV-003 親）
- 関連タスク: UT-GOV-001 (branch protection), task-codeowners-validator-ci-001
