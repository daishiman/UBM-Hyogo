# ut-gov-003-codeowners-governance-paths - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | ut-gov-003-codeowners-governance-paths |
| タスク名 | `.github/CODEOWNERS` を governance パスへ拡張し doc/docs 表記揺れを解消 |
| ディレクトリ | docs/30-workflows/ut-gov-003-codeowners-governance-paths |
| 親タスク | task-github-governance-branch-protection |
| 関連タスク | UT-GOV-001-github-branch-protection-apply / UT-GOV-002-pr-target-safety-gate-dry-run / UT-GOV-004-required-status-checks-context-sync / UT-GOV-005-docs-only-nonvisual-template-skill-sync |
| Wave | 0（infrastructure governance / ownership 文書化） |
| 実行種別 | serial（UT-GOV-001 の前提として独立 PR で先行整備） |
| 作成日 | 2026-04-29 |
| 担当 | unassigned |
| 状態 | phase-12-completed / PR pending |
| タスク種別 | docs-only / spec_created |
| visualEvidence | NON_VISUAL |
| scope | infrastructure_governance |
| GitHub Issue | #146 (CLOSED / spec_created で再起票) |
| 原典スペック | docs/30-workflows/completed-tasks/UT-GOV-003-codeowners-governance-paths.md |

## 目的

`.github/CODEOWNERS` を governance パス単位で明示的に owner 指定し、**ownership の文書化**として整備する。本リポジトリは solo 運用（メンテナーは @daishiman 一人）であるため、main / dev branch protection において `require_code_owner_reviews=true` は **有効化しない方針**で確定しており、CODEOWNERS は将来の外部 contributor 受入・監査時の責任表明・GitHub UI の suggested reviewer 表示の 3 用途に限定する。同時に CLAUDE.md / 正本仕様間で混在する `doc/` → `docs/` の表記揺れを棚卸しし、現行の `docs/` に統一することで、CODEOWNERS の glob が片側にしかマッチしない事故を恒久排除する。本ワークフローは `.github/CODEOWNERS` 差分・表記置換差分・`gh api .../codeowners/errors` 実行ログ（`errors: []`）を成果物とし、UT-GOV-001（branch protection 本適用）の前提を満たす。

## スコープ

### 含む（原典 §2.3）

- `.github/CODEOWNERS` の新設または更新（既存有無を `git ls-files .github/CODEOWNERS` で先に確認）
- 以下 governance パスへの owner 明示:
  - `docs/30-workflows/**`（タスク仕様書群）
  - `.claude/skills/**/references/**`（正本仕様）
  - `.github/workflows/**`（governance workflow / CI）
  - `apps/api/**`
  - `apps/web/**`
- ファイル冒頭に global fallback (`* @daishiman`) を **1 行のみ** 配置し、後段に具体的な governance path を置くことで、最終マッチ勝ち仕様に整合する順序統制
- リポジトリ内 `doc/` 表記の棚卸し（`rg -n "(^|[^a-zA-Z])doc/" -g '!node_modules' -g '!.git'`）と `docs/` への統一
- 残置不可避ケース（外部リンク等）の明示記録
- `gh api repos/:owner/:repo/codeowners/errors` による構文・権限検証（`errors: []` 確認）
- main branch protection 草案（task-github-governance-branch-protection）との整合確認（`require_code_owner_reviews=false` 維持の明記）

### 含まない（原典 §2.3）

- branch protection 自体の本適用（UT-GOV-001 で実施）
- CODEOWNERS で参照する team handle 自体の新規作成（GitHub 組織側の運用作業 / 本タスクは個人ハンドル `@daishiman` に寄せる）
- 既存タスク仕様書本文のレビュー / 内容修正
- `require_code_owner_reviews=true` への切り替え（solo 運用解消後の別タスク）
- `.claude/skills/**/references/**` 配下の文書追加・改訂

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流（必須） | なし | CODEOWNERS は単独で整備可能。`gh api .../codeowners/errors` も既存リポジトリ単独で完結 |
| 親 | task-github-governance-branch-protection | governance 全体設計の親。本タスクは ownership 文書化レーンとして派生 |
| 並列 | UT-GOV-002-pr-target-safety-gate-dry-run | governance workflow パスの owner 指定で接点。順序制約はないが workflow ファイル追加時は CODEOWNERS の `.github/workflows/**` ルールで自動カバー |
| 並列 | UT-GOV-004-required-status-checks-context-sync | `.github/workflows/**` の owner 整備で接点 |
| 並列 | UT-GOV-005-docs-only-nonvisual-template-skill-sync | docs パス整備で接点 |
| 下流 | UT-GOV-001-github-branch-protection-apply | branch protection 本適用時に CODEOWNERS の `errors: []` が前提（将来 `require_code_owner_reviews` を有効化する余地を残すため、本適用時点でも構文ゼロを保つ） |

## 主要参照資料

| 種別 | パス / URL | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-003-codeowners-governance-paths.md | 原典スペック（160 行）。Phase 1〜3 はこの内容の writable 版 |
| 必須 | CLAUDE.md | `docs/00-getting-started-manual/` と `docs/30-workflows/` の表記混在の主要発生源 |
| 必須 | .github/CODEOWNERS（新設または既存） | 編集対象本体 |
| 必須 | https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-security/managing-repository-settings/managing-rulesets-for-a-repository | branch protection と CODEOWNERS の関係（`require_code_owner_reviews`） |
| 必須 | https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-security/customizing-your-repository/about-code-owners | 最終マッチ勝ち仕様 / team 権限要件 / glob 仕様のクセ |
| 必須 | `gh api repos/:owner/:repo/codeowners/errors` | 構文 / 権限エラー検出（`errors: []` を AC で要求） |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | Phase 1〜13 のテンプレ正本 |
| 参考 | docs/30-workflows/skill-ledger-a1-gitignore/ | 隣接 governance タスク仕様書のフォーマット参考 |

## 受入条件 (AC)

- AC-1: `.github/CODEOWNERS` がリポジトリ直下に存在する（無ければ新設、あれば更新）。Phase 5 ランブックで `git ls-files .github/CODEOWNERS` による既存有無確認が固定されている。
- AC-2: 5 つの governance パス（`docs/30-workflows/**` / `.claude/skills/**/references/**` / `.github/workflows/**` / `apps/api/**` / `apps/web/**`）すべてに owner が明示されており、Phase 2 のファイル変更計画と一致する。
- AC-3: ファイル冒頭に global fallback (`* @daishiman`) が **1 行のみ** 配置され、最終マッチ勝ち仕様を踏まえた順序（global → 一般 → governance 重要パスの順、末尾ほど具体度高）になっている。
- AC-4: `gh api repos/daishiman/UBM-Hyogo/codeowners/errors` の実行結果が `{"errors": []}` であることが Phase 9 / 11 で確認され、ログが成果物として保存されている。
- AC-5: リポジトリ内の `doc/` 表記が `docs/` へ統一されている。`rg -n "(^|[^a-zA-Z])doc/" -g '!node_modules' -g '!.git' -g '!.worktrees'` の出力が「外部リンク等の不可避ケース」のみに限定され、Phase 12 の `documentation-changelog.md` で残置箇所が一覧化されている。
- AC-6: main branch protection 草案 (`task-github-governance-branch-protection`) との整合チェックで、`require_code_owner_reviews` が **false 維持**であることが Phase 2 / Phase 3 の双方で明記されている（solo 運用方針の不変性確認）。
- AC-7: タスク種別 `docs-only / spec_created` / `visualEvidence: NON_VISUAL` / `scope: infrastructure_governance` が Phase 1 で固定され、`artifacts.json.metadata` と完全一致している。
- AC-8: Phase 3 で代替案（A: CODEOWNERS 新設のみ / B: 表記揺れ統一のみ / C: A + B + errors=[] 検証 = base case / D: A + B + `require_code_owner_reviews=true` 即時有効化）の 4 案が PASS / MINOR / MAJOR で評価され、base case が PASS で確定している。
- AC-9: team handle (`@org/team`) ではなく個人ハンドル (`@daishiman`) に寄せる方針が Phase 2 で固定されている（solo 運用 + team の write 権限事前付与を要する silently skip リスクの回避）。
- AC-10: Phase 1〜13 が `artifacts.json` の `phases[]` と完全一致しており、Phase 1〜12 の `status` は `completed`、Phase 13 はユーザー承認待ちの `pending`。

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/main.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02/main.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/main.md |
| 4 | テスト戦略 | phase-04.md | completed | outputs/phase-04/main.md |
| 5 | 実装ランブック | phase-05.md | completed | outputs/phase-05/main.md |
| 6 | 異常系検証 | phase-06.md | completed | outputs/phase-06/main.md |
| 7 | AC マトリクス | phase-07.md | completed | outputs/phase-07/main.md |
| 8 | DRY 化 | phase-08.md | completed | outputs/phase-08/main.md |
| 9 | 品質保証（codeowners/errors 検証含む） | phase-09.md | completed | outputs/phase-09/main.md |
| 10 | 最終レビュー | phase-10.md | completed | outputs/phase-10/main.md |
| 11 | 手動 smoke test（PR dry-run + suggested reviewer 表示確認） | phase-11.md | completed | outputs/phase-11/main.md / manual-smoke-log.md / link-checklist.md |
| 12 | ドキュメント更新（doc/docs 表記置換差分一覧含む） | phase-12.md | completed | outputs/phase-12/main.md / implementation-guide.md / system-spec-update-summary.md / documentation-changelog.md / unassigned-task-detection.md / skill-feedback-report.md |
| 13 | PR 作成 | phase-13.md | pending | outputs/phase-13/main.md |

## 主要成果物（Phase 1〜3 範囲）

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-01/main.md | 要件定義（背景 / governance パス棚卸し / `require_code_owner_reviews=false` 方針 / AC / 4 条件評価） |
| 設計 | outputs/phase-02/main.md | CODEOWNERS ファイル構造設計（行順序 / 個人ハンドル統一 / global fallback 配置 / `doc/` → `docs/` 置換対象一覧） |
| レビュー | outputs/phase-03/main.md | 代替案 4 案比較 / PASS/MINOR/MAJOR / 着手可否ゲート（PASS） / 将来 `require_code_owner_reviews` 有効化時の前提条件 |
| メタ | artifacts.json | Phase 1〜13 の機械可読サマリー |
| 仕様書 | phase-NN.md × 13 | Phase 別仕様（Phase 1〜12 完了、13 はユーザー承認待ち） |

## 関連サービス・ツール

| サービス/ツール | 用途 | コスト |
| --- | --- | --- |
| gh CLI (GitHub CLI) | `gh api .../codeowners/errors` による構文検証、PR dry-run | 無料 |
| GitHub Actions | `.github/workflows/**` への owner 設定対象（CI gate と連動） | 無料枠 |
| ripgrep (`rg`) | `doc/` 表記揺れの全文棚卸し | 無料 |
| Git | `.github/CODEOWNERS` 差分管理 | 無料 |

## Secrets 一覧

本タスクは **Secret を導入しない**。`.github/CODEOWNERS` は public なリポジトリメタデータであり、ユーザーハンドル / team handle は GitHub UI 上でも公開情報として扱われる。`gh api` 実行に必要な GitHub Token は既存の開発者ローカル環境（`gh auth status`）に依存し、本タスク固有の secret 追加はない。

## 不変条件 touched

| # | 不変条件 | 本タスクでの扱い |
| --- | --- | --- |
| #5 | D1 への直接アクセスは `apps/api` に閉じる | 本タスクは D1 を触らない（governance メタデータのみ）。違反なし。`apps/api/**` への owner 指定は ownership 文書化目的であり、アクセス境界そのものには影響しない |
| #6 | GAS prototype は本番バックエンド仕様に昇格させない | 本タスクは GAS prototype を編集しない。違反なし |
| - | solo 運用ポリシー（CLAUDE.md ブランチ戦略章） | `require_code_owner_reviews=false` を維持することで、必須レビュアー数 = 0 の solo 運用方針を保持する。CODEOWNERS は ownership 文書として機能限定 |

## 完了判定

- Phase 1〜13 の状態が `artifacts.json` と一致する（Phase 1〜12 = `completed` / Phase 13 = `pending`）
- AC-1〜AC-10 が Phase 1〜3 で全件カバーされる
- 4 条件（価値性 / 実現性 / 整合性 / 運用性）が PASS
- `require_code_owner_reviews=false` の維持が Phase 2 / Phase 3 の双方で明記されている
- 個人ハンドル (`@daishiman`) への統一方針が Phase 2 で固定されている
- 本ワークフローは Phase 12 まで完了し、実 CODEOWNERS 配置と表記整理は本差分に含める。PR 作成はユーザー承認後の Phase 13 でのみ実施する

## 苦戦箇所・知見（原典 §8 より承継）

**1. `doc/` と `docs/` の表記揺れ**
CLAUDE.md / 正本仕様で `doc/` と `docs/` が混在しており、片側だけを CODEOWNERS に書くと governance パスの一部が owner 不在になる。旧 `doc/` 表記の置換漏れが多発するため、`rg -n "(^|[^a-zA-Z])doc/" -g '!node_modules' -g '!.git' -g '!.worktrees'` 等で全文棚卸しを **CODEOWNERS 編集の前** に済ませること。Phase 5 ランブックで「Step 1: 表記棚卸し → Step 2: `docs/` 統一 → Step 3: CODEOWNERS 編集 → Step 4: errors=[] 検証」の順序を固定する。

**2. CODEOWNERS は最終マッチ勝ち**
「先頭から一致を全部適用」ではなく「**最後に一致した行のみが有効**」という GitHub 独自仕様。`* @global` を冒頭に、`docs/30-workflows/** @docs-team` を末尾に書くと意図通り動くが、逆順だと汎用 `*` が governance パスを上書きしてしまう。本タスクでは「global → 一般 → governance 重要パスの順、末尾ほど具体度高」を Phase 2 のファイル設計に固定する。

**3. team handle (`@org/team`) の権限要件**
team が当該リポジトリに **write 以上** の権限を持っていないと、CODEOWNERS で指定しても suggested reviewer として認識されず silently skip される。solo 運用では必須レビュアー化していないため即時の運用詰みには至らないが、ownership 文書としての価値は損なわれる。本タスクでは個人ハンドル (`@daishiman`) に一旦寄せ、将来組織側で team の repo 権限を事前付与してから team handle に切り替える方針を Phase 2 / AC-9 で固定する。

**4. 構文エラーが silently に失敗する**
CODEOWNERS の構文エラーや存在しないユーザー / team 指定は GitHub UI 上では警告のみで、PR 作成時には silently 無視される。必ず `gh api repos/:owner/:repo/codeowners/errors` を CI またはローカルで実行し `errors: []` を確認すること。将来 `require_code_owner_reviews` を有効化する際にエラーがあると PR が全 block されるため、本タスク段階でも errors=[] を担保しておく。AC-4 / Phase 9 の必達条件として固定。

**5. glob 仕様のクセ**
GitHub CODEOWNERS の glob は gitignore 風だが完全互換ではない（`**` の扱い、ディレクトリ末尾 `/` の有無で挙動が変わる）。`.claude/skills/**/references/**` のような多段ワイルドカードは、実ファイルに対して期待通りマッチするか `gh api .../codeowners/errors` と PR dry-run（Phase 11）の **両方** で確認する。

**6. 将来 `require_code_owner_reviews` を有効化する際の注意**
solo 運用が解消され将来 contributor 体制になった際に有効化を検討する場合、CODEOWNERS 不備のまま有効化すると PR が全 block される。必ず「CODEOWNERS 整備 → errors=[] 確認 → 必要なら branch protection で `require_code_owner_reviews` 有効化」の順で進める。本タスクの成果物は将来の有効化タスクの前提資料として再利用される。

## 関連リンク

- 上位 README: ../README.md
- 原典スペック: ../completed-tasks/UT-GOV-003-codeowners-governance-paths.md
- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/146
- 親タスク: ../completed-tasks/task-github-governance-branch-protection/（存在する場合）
- 関連タスク（並列 / 下流）:
  - UT-GOV-001-github-branch-protection-apply（下流）
  - UT-GOV-002-pr-target-safety-gate-dry-run（並列）
  - UT-GOV-004-required-status-checks-context-sync（並列）
  - UT-GOV-005-docs-only-nonvisual-template-skill-sync（並列）
- GitHub Docs: [About code owners](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-security/customizing-your-repository/about-code-owners)
- GitHub REST API: `GET /repos/{owner}/{repo}/codeowners/errors`
