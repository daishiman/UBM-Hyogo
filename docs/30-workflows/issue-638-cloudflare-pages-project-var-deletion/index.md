# タスク仕様書: Issue #638 — `CLOUDFLARE_PAGES_PROJECT` GitHub Variable 削除

[実装区分: 実装仕様書]

## 判定根拠（CONST_004 / CONST_005 / CONST_007）

- 本タスクの目的は **GitHub repository variable `CLOUDFLARE_PAGES_PROJECT` を物理削除し、未参照変数 0 件 baseline を確立する** こと。
- 「削除」は GitHub Actions API への **mutation (外部副作用)** であり、ドキュメント追記だけでは目的が達成できない。`gh api -X DELETE /repos/{owner}/{repo}/actions/variables/CLOUDFLARE_PAGES_PROJECT` 実行が必須。
- リポジトリ内コード差分は発生しないが、CONST_004 の判断基準「『改善する』『修正する』等コード変更（≒ 実状態変更）なしで達成不可能な目的が含まれる場合は実装仕様書」に該当するため、**実装仕様書**として作成する。
- CONST_005 必須項目は次のとおり Phase 別に充足する: 変更対象（GitHub Variable scope=repo）/ 関数シグネチャ等価物（gh CLI コマンド体系）/ 入出力（exit code / JSON response）/ テスト方針（削除前後 evidence + grep gate）/ 実行コマンド（Phase 7）/ DoD（Phase 11）。
- CONST_007: 全 Phase を **1 サイクル 1 PR** で完結。先送り条項なし。

## Issue / 状態

| 項目 | 値 |
| --- | --- |
| タスク ID | `issue-638-cloudflare-pages-project-var-deletion` |
| 親 Issue | https://github.com/daishiman/UBM-Hyogo/issues/638 (**CLOSED** — ユーザー指示によりクローズドのまま spec を作成・close 操作はしない) |
| 親 Issue 関連 | Refs #331（CI/CD runtime warning cleanup, Workers deploy 統一）/ Refs #419（Pages dormant cleanup, CLOSED 済） |
| 元 unassigned-task | `docs/30-workflows/unassigned-task/issue-331-followup-001-cloudflare-pages-project-var-deletion.md`（本仕様で上位置換） |
| 配置先 | `docs/30-workflows/issue-638-cloudflare-pages-project-var-deletion/` |
| 作成日 | 2026-05-14 |
| 状態 | `CONTRACT_READY_IMPLEMENTATION_PENDING` |
| taskType | implementation (external GitHub Actions Variables API mutation, user-gated) |
| visualEvidence | NON_VISUAL |
| implementation_status | external_mutation_pending_user_approval |
| 優先度 | LOW (issue label `priority:low`) |
| 規模 | XS (1 variable delete + evidence capture, 1 PR 完結) |
| 想定 PR 数 | 1（本 spec + user 承認後の削除 evidence ログ。アプリコード変更なし） |
| coverage AC | 適用外（テスト対象コードなし） |

## 着手判断（前提 Gate）

- `gh api repos/daishiman/UBM-Hyogo/actions/variables` で `CLOUDFLARE_PAGES_PROJECT` が **存在することを確認済み**（2026-05-14 時点で value=`ubm-hyogo-web`、未削除）。
- `rg CLOUDFLARE_PAGES_PROJECT .github/` が **hit 0** を確認済み（workflow 参照なし）。
- Issue #331 の `web-cd.yml` 改修（commit `4a630dbb` 系列）が `dev` / `main` にマージ済みであることを Phase 3 で再確認。
- 本 Issue #638 は CLOSED だが、Variable は未削除のため作業は実質必要。ユーザー指示により Issue の reopen / 状態変更は行わない（spec 内 `Refs #638` で連携のみ）。
- `gh api -X DELETE` / rollback `POST` / commit / push / PR はすべて user approval marker を evidence として保存してから実行する。

## 先送り理由（CONST_007）

なし。本サイクルでは「spec 配置 + read-only preflight evidence + 旧 unassigned-task supersede marker + Phase 12 strict 7 + aiworkflow 正本同期」を完結させる。外部 mutation は user approval 後に同 workflow 内で実行し、別タスク化しない。

## 目的

GitHub repository variable `CLOUDFLARE_PAGES_PROJECT` を削除し、Issue #331 で達成した「Cloudflare Pages → Workers deploy 統一」の cleanup を完了する。

## scope in / scope out

### scope in
- repository scope の variable `CLOUDFLARE_PAGES_PROJECT` 削除
- 削除前後の evidence (`gh api` 出力) を `outputs/phase-11/` に保存
- `.github/` grep gate 再確認（hit 0）
- 旧 unassigned-task spec の retirement marker（status: superseded by issue-638-spec）

### scope out
- environment scope (`staging` / `production`) の variable 削除（本 variable は repo scope のみ存在）
- Cloudflare Pages project 本体（`ubm-hyogo-web`）の物理削除 — `issue-331-followup-002` の責務
- OIDC / step-scoped `CF_TOKEN_*` cutover — `issue-331-followup-003` の責務
- staging Pages project retirement
- Issue #638 の reopen / state 変更（CLOSED のまま）

## 不変条件・正本仕様との整合

- CLAUDE.md「シークレット管理」セクション: GitHub Variables は **非機密設定値** カテゴリで、本 variable は未参照のため削除対象として整合。
- CLAUDE.md「Cloudflare 系 CLI 実行ルール」: `wrangler` 直接呼び出し禁止だが、本タスクは **GitHub API** 操作のため `gh api` を使用 (`scripts/cf.sh` は無関係)。
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` の「未参照 secret/variable は速やかに削除する」原則と整合。

## Phase 構成

| Phase | ファイル | 概要 |
| --- | --- | --- |
| 1 | [phase-01.md](phase-01.md) | 要件定義・成功条件 |
| 2 | [phase-02.md](phase-02.md) | 現状調査・依存確認 |
| 3 | [phase-03.md](phase-03.md) | アーキテクチャ・影響範囲分析 |
| 4 | [phase-04.md](phase-04.md) | 削除手順設計（gh API シーケンス） |
| 5 | [phase-05.md](phase-05.md) | 安全装置・rollback 設計 |
| 6 | [phase-06.md](phase-06.md) | 実装方針（実行スクリプトと evidence ログ） |
| 7 | [phase-07.md](phase-07.md) | 実行コマンド・検証手順 |
| 8 | [phase-08.md](phase-08.md) | テスト戦略（evidence-driven verification） |
| 9 | [phase-09.md](phase-09.md) | ドキュメント更新・旧 spec retirement |
| 10 | [phase-10.md](phase-10.md) | 監視・運用（再発防止） |
| 11 | [phase-11.md](phase-11.md) | DoD・evidence 受入条件 |
| 12 | [phase-12.md](phase-12.md) | 実装ガイド（中学生レベル概念説明 + 1 PR scope） |
| 13 | [phase-13.md](phase-13.md) | PR 作成テンプレート（diff-to-pr 連携） |
