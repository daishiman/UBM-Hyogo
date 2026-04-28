# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-verify-indexes-up-to-date-ci |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| Wave | - |
| 実行種別 | serial |
| タスク種別 | docs + CI |
| visualEvidence | NON_VISUAL |
| 作成日 | 2026-04-28 |
| 上流 | （なし。本タスクは task-git-hooks-lefthook-and-post-merge の Phase 12 派生） |
| 下流 | Phase 2 (設計) |
| 状態 | completed |

## 目的

`.claude/skills/aiworkflow-requirements/indexes/` の **drift を authoritative に検出する CI gate** の要件を確定する。
post-merge hook で再生成していた仕組みを撤去した結果として残る「再生成忘れ → main 流入」リスクを、
local hook ではなく GitHub Actions 上で構造的に防ぐ。

## 真の論点

1. **drift 検出の権威 source を local hook ではなく CI に移せるか**
   - local hook は `--no-verify` / 未インストールで回避可能。authoritative gate は CI でなければ成立しない。
2. **`generate-index.js` の出力が決定論的か（false positive をゼロにできるか）**
   - 出力順 / 改行 / タイムスタンプ等が非決定的だと CI が常時 fail する。
3. **既存 4 本の workflow（ci.yml / backend-ci.yml / web-cd.yml / validate-build.yml）と job 名・trigger が衝突しないか**
4. **drift 検出範囲を `.claude/skills/aiworkflow-requirements/indexes/` に限定できるか**
   - references 側の差分を誤検出すると「ユーザーが意図的に編集した references」を fail させてしまう。
5. **fail 時に「何のファイルを再生成すれば直るか」が開発者に伝わるか**
   - `git diff --name-only` の job log 出力が必須。

## 依存境界

| 種別 | 対象 | 引き渡し内容 |
| --- | --- | --- |
| 上流: task-git-hooks-lefthook-and-post-merge | post-merge 廃止の確定 | 本タスクは「post-merge 撤去後」を前提に gate を設計 |
| 上流: package.json | `indexes:rebuild` script | `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` |
| 上流: .github/workflows/ci.yml | setup pattern | `pnpm/action-setup@v4` / `actions/setup-node@v4` / Node 24 / pnpm 10.33.2 |
| 下流: 開発者 PR フロー | gate fail 時のフィードバック | `git diff --name-only` ログで再生成対象を明示 |
| 下流: CLAUDE.md / README | gate 名の最小追記 | `verify-indexes-up-to-date` という名前で参照可能に |

## carry-over 棚卸し

`git log --oneline -5` 確認結果:

| commit | 要旨 | 本タスクへの影響 |
| --- | --- | --- |
| a6cc537 | Merge pull request #155 from daishiman/feat/main-branch-guard | main/dev 直コミット抑止が入り、CI gate 追加と整合 |
| 4790e5a | feat(hooks): main / dev ブランチへの直接コミットを pre-commit でブロック | local hook は補助、authoritative 判定はCIに置く方針を補強 |
| 4561805 | Merge pull request #154 from daishiman/feat/task-github-governance-branch-protection-spec | branch protection 仕様が上流文脈 |
| 998dc21 | docs(governance): solo 開発前提に branch protection / CODEOWNERS 仕様を整合 | Required Status Checks 追加候補として本 gate を位置づける |
| a66575b | governance 仕様 merge | 追加作業なし |

## 既存命名規則分析

| 対象 | 観察 | 本タスクの採用 |
| --- | --- | --- |
| workflow file | `backend-ci.yml` / `web-cd.yml` / `validate-build.yml` は kebab-case | `.github/workflows/verify-indexes.yml` |
| workflow/job 表示名 | required status checks で読める短い kebab-case 名 | `verify-indexes-up-to-date` |
| concurrency group | `<workflow-key>-${{ github.ref }}` 形式 | `verify-indexes-${{ github.ref }}` |

## 価値とコスト

| 区分 | 内容 |
| --- | --- |
| 初回価値 | references と indexes の drift が main に流入しない authoritative 保証が成立 |
| 継続価値 | local hook 未整備の環境（新規 worktree / clone 直後）でも品質が CI で担保 |
| 払うコスト | PR ごとに pnpm install + indexes:rebuild の実行時間（数十秒〜1分程度） |
| 払わないコスト | post-merge hook の復活、generate-index.js の改修、generated index の仕様変更 |

## 4 条件評価

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | 誰のどのコストを下げるか | PASS | 開発者が再生成忘れを CI で気付ける。レビュアーが古い index を見逃す事故を防ぐ |
| 実現性 | 無料運用 / 既存基盤で成立 | PASS | GitHub Actions 無料枠 + 既存 setup を再利用 |
| 整合性 | 既存 CI / 不変条件と矛盾しないか | PASS | 独立 workflow file で job 名衝突なし。CLAUDE.md 不変条件 #1〜#7 に触れない |
| 運用性 | rollback / 障害時 | PASS | 独立 file のため `git revert` 1 つで撤去可能。fail ログが対処方法を直接示す |

## inventory（既存資産）

### 既存 GitHub Actions workflow（衝突回避対象）

| ファイル | 役割 | 主な job |
| --- | --- | --- |
| `.github/workflows/ci.yml` | 共通 CI | typecheck / lint / build |
| `.github/workflows/backend-ci.yml` | apps/api 個別 CI | API 固有検証 |
| `.github/workflows/web-cd.yml` | apps/web デプロイ | Cloudflare Pages / Workers |
| `.github/workflows/validate-build.yml` | build 検証 | bundle validation |

→ 本タスクで追加する `verify-indexes.yml` は上記 4 本と独立した job 名 `verify-indexes-up-to-date` を採用。

### drift 監視対象

`.claude/skills/aiworkflow-requirements/indexes/` 配下（generated index 群）。具体的なファイル一覧は Phase 2 で確定する。

### 生成スクリプト

`.claude/skills/aiworkflow-requirements/scripts/generate-index.js`（package.json `indexes:rebuild` から呼ばれる）。

## 実行タスク

1. 既存 4 workflow の job 名・concurrency group を読み、衝突候補を洗い出す
2. `.claude/skills/aiworkflow-requirements/indexes/` 配下のファイル群をリスト化
3. `generate-index.js` の出力決定論性を確認（連続 2 回実行で diff ゼロを検証する戦略を Phase 4 へ申し送り）
4. AC-1〜AC-7 を `outputs/phase-01/main.md` にコピーし、検証可能性をチェック
5. 「fail 時のログ出力フォーマット」を要件として確定（`git status --short` + `git diff --name-only`）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/task-verify-indexes-up-to-date-ci.md | 元タスク指示書 |
| 必須 | .github/workflows/ci.yml | setup 流用元 |
| 必須 | package.json | `indexes:rebuild` script |
| 必須 | .claude/skills/aiworkflow-requirements/scripts/generate-index.js | 生成本体 |
| 参考 | CLAUDE.md | indexes 再生成の正規経路記述 |
| 参考 | doc/00-getting-started-manual/lefthook-operations.md | post-merge 廃止経緯 |

## 実行手順

### ステップ 1: 既存 CI 棚卸し
- 4 本の workflow を読み、job 名・on trigger・concurrency を表化
- 衝突しない命名 `verify-indexes-up-to-date` を確定

### ステップ 2: 監視対象の固定
- `.claude/skills/aiworkflow-requirements/indexes/` 配下を `ls -la` で列挙
- `git diff --exit-code` の path 引数を確定

### ステップ 3: 出力成果物
- `outputs/phase-01/main.md` に以下を記載
  - 真の論点 5 件
  - 4 条件評価の判定根拠
  - AC-1〜AC-7 と検証方法のひな型
  - inventory（既存 4 workflow + 監視対象）
  - 「fail 時の必須ログ項目」リスト

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | inventory + 命名確定 → workflow file 設計 |
| Phase 4 | 出力決定論性 → 連続実行 test 戦略 |
| Phase 7 | AC-1〜AC-7 → matrix の起点 |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| 不変条件 | #1〜#7 | 本タスクは触れない（CI gate 追加のみ） |
| 認可境界 | — | 本 gate は GitHub Actions 内のみ。Cloudflare / D1 / secret に触れない |
| 無料枠 | — | GitHub Actions 無料枠（Public repo は無制限） |
| UI/UX | — | NON_VISUAL（CLI ログのみ） |
| docs + CI 適合 | — | 本タスクは仕様書作成とCI実装を同一ブランチで実施 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 既存 4 workflow 棚卸し | 1 | completed | job 名衝突回避 |
| 2 | 監視対象パス確定 | 1 | completed | indexes/ 配下 |
| 3 | 出力決定論性の検証戦略 | 1 | completed | Phase 4 へ申し送り |
| 4 | AC-1〜AC-7 の検証可能性確認 | 1 | completed | |
| 5 | fail 時ログ仕様 | 1 | completed | name-only + status |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | Phase 1 主成果物 |
| メタ | artifacts.json | Phase 1 → completed |

## 完了条件

- [ ] 真の論点 5 件が main.md に記載
- [ ] 4 条件評価が PASS
- [ ] AC-1〜AC-7 の検証可能性確認済
- [ ] inventory（既存 4 workflow + 監視対象）が表化済
- [ ] fail 時ログ要件が確定

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜5 が completed
- [ ] outputs/phase-01/main.md が配置
- [ ] artifacts.json の Phase 1 を completed に更新

## 次 Phase

- 次: Phase 2 (設計)
- 引き継ぎ事項: inventory / job 名 / 監視パス / fail 時ログ要件
- ブロック条件: 既存 workflow との job 名衝突が解消できなければ Phase 2 に進めない
