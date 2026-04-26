# UT-05 Follow-up 005: branch 命名揺れ正式化

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-05-followup-005 |
| タスク名 | branch 命名揺れ（`feat/*` 許容）の正式化 |
| 優先度 | MEDIUM |
| 推奨 Wave | UT-05 close-out 実装と同時 |
| 状態 | unassigned |
| 作成日 | 2026-04-27 |
| 種別 | governance |
| 由来 | UT-05 Phase 1 R-7 / Phase 10 MINOR-H |
| 依存 | 01a-parallel-github-and-branch-governance |

## 目的

`feature/**` と `feat/**` のどちらを正式に許容するかを決め、CI trigger（`on.push.branches` / `on.pull_request.branches`）と GitHub branch protection rule を一致させる。表記ゆれによる「CI が回らない PR」「protection rule で守られない branch」を撲滅し、開発者の認知負荷を下げる。

## スコープ

### 含む

- 正式 branch prefix の決定（`feature/**` 単独 / `feat/**` 単独 / 両方許容のいずれか）
- 決定根拠の記録（git log 実績調査 / Conventional Commits との整合）
- GitHub Actions の `on.*.branches` パターン更新
- GitHub branch protection rule の `Branch name pattern` 更新
- README / CONTRIBUTING / 開発ガイド / scripts/new-worktree.sh の表記統一
- 既存 branch のリネーム要否判断と移行手順

### 含まない

- `dev` / `main` の branch 戦略変更（正本 deployment-branch-strategy.md の責務）
- Conventional Commits の commit message 規約（別タスク）
- Pull Request テンプレートの整備（別タスク）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 01a-parallel-github-and-branch-governance | branch protection rule の正本管理元 |
| 上流 | UT-05 CI/CD pipeline 実装完了 | trigger 設定の更新対象 |
| 並走 | scripts/new-worktree.sh | worktree 作成スクリプトの prefix |
| 下流 | 開発者全員 | 周知と既存 branch の移行 |

## 苦戦箇所・知見

**branch protection rule と CI trigger の不一致が起こす実害**: 過去の典型事例として、(a) protection rule が `feature/*` のみを保護対象としていたため `feat/foo` push が direct push の形で main から fork できてしまい review なしで作業が進む、(b) CI trigger が `feature/**` のみで `feat/**` push に対して何も起動せず、PR 作成時にようやく失敗が判明して数時間ロスする、という症状が頻発する。本リポジトリでも `git log --all` で確認すると `feat/wt-1`（現ブランチ）と `feature/*` 系が混在しており、既に同種の問題が顕在化しうる。

**glob pattern の落とし穴**: GitHub の branch filter は `feature/**`（多階層マッチ）と `feature/*`（1 階層のみ）で挙動が異なり、`feature/sub/foo` のような階層構造を取る branch が trigger 対象から漏れる。protection rule 側は内部的に `fnmatch` 系で実装されており、Actions 側 (`minimatch`) と微妙に挙動が違う。両方で同じ pattern が同じ branch にマッチすることをテスト用 branch で検証すること。

**`feature/**` と `feat/**` 混在の弊害**: Conventional Commits 文脈では `feat:` prefix が標準化されており開発者は `feat/` を打ちたがる。一方、git-flow 文脈では `feature/` が標準。両方許容にすると (1) 同じ機能の branch が `feature/foo` と `feat/foo` の 2 本作られて競合、(2) 新人が「どっちが正解か」で 30 分悩む、(3) protection rule の管理対象が倍になり監査困難、というコストが発生する。判断としては「`feat/**` 単独許容 + `feature/**` は legacy として transition 期間後に削除」が運用負荷最小だが、過去 PR の link 切れリスクを織り込むこと。

**scripts/new-worktree.sh との整合**: 現状 `scripts/new-worktree.sh feat/my-feature` 形式が CLAUDE.md に記載されており、事実上 `feat/` が正本になりつつある。仕様確定時はこのスクリプトと `.github/workflows/*.yml` の両方を atomic に更新する PR を作ること（片方だけ更新すると CI 不整合が再発する）。

**移行期の暫定対応**: 旧 prefix の既存 branch は強制リネームできない（PR が close されるリスク）。trigger / protection rule を「新 prefix と旧 prefix の両方許容」とした上で、新規作成のみ新 prefix を強制（pre-receive hook または PR template 注意書き）し、3 ヶ月後に旧 prefix 許容を削除する 2 段階移行が安全。

## 受入条件

- [ ] 正式な branch prefix が 1 つ決定されているか、複数許容の場合はその理由と運用ルールが記録されている
- [ ] GitHub Actions trigger（`on.push.branches` / `on.pull_request.branches`）と branch protection rule の pattern が完全一致している
- [ ] README / CONTRIBUTING / CLAUDE.md / scripts/new-worktree.sh の表記が統一されている
- [ ] 旧 prefix の既存 branch の扱い（リネーム / そのまま deprecation）と移行期限が定義されている
- [ ] glob pattern（`**` vs `*`）の挙動差をテスト branch で検証した記録がある
- [ ] 決定が `01a-parallel-github-and-branch-governance` の正本に反映されている

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-05-cicd-pipeline/phase-01.md | R-7（branch 命名揺れ）の根拠 |
| 必須 | docs/30-workflows/ut-05-cicd-pipeline/phase-10.md | MINOR-H 指摘 |
| 必須 | docs/30-workflows/ut-05-cicd-pipeline/outputs/phase-12/unassigned-task-detection.md | 由来記録 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md | dev/main mapping 正本 |
| 参考 | scripts/new-worktree.sh | worktree 作成スクリプトの現行 prefix |
| 参考 | CLAUDE.md | 開発ガイド表記の現状 |
