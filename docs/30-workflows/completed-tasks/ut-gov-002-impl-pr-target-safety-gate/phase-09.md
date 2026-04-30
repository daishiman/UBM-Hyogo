# Phase 09: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-002-impl-pr-target-safety-gate |
| Phase | 9 |
| タスク種別 | implementation |
| visualEvidence | VISUAL |
| workflow | spec_created |
| GitHub Issue | #204 |

## 目的

Phase 1〜8 の成果物（実 workflow ファイル + 仕様書）を **品質ゲート (quality gate)** で総点検し、AC-1〜AC-9 / 静的検査 / "pwn request" 非該当 5 箇条 / secrets 露出ゼロ / VISUAL evidence 品質 / required status checks 同期 / ロールバック手順が PASS であることを確認する。実装タスクの quality gate は「静的検査 PASS + 振る舞いの安全性 + 証跡完全性」を保証する。

## 実行タスク

- `outputs/phase-9/quality-gate.md` を作成し、以下のチェック項目を PASS / MINOR / MAJOR で評価する：
  - **G-1**：AC-1〜AC-9 が全て PASS（index.md の AC 一覧と Phase 7 coverage.md を突き合わせる）。
  - **G-2**：静的検査が全て PASS。`actionlint .github/workflows/*.yml` がエラーゼロ、`yq` で `permissions` 最小化と `persist-credentials: false` が全 `actions/checkout` に存在することを確認、`grep -RnE 'pull_request_target' .github/workflows/` で triage workflow 以外に残存していないことを確認。実走ログを quality-gate.md に貼付ける手順を記述。
  - **G-3**："pwn request" 非該当 5 箇条の最終チェック。(a) PR head を `pull_request_target` 内で checkout していない、(b) `workflow_run` を採用していない、(c) `${{ github.event.pull_request.head.* }}` 等の untrusted input を script step で eval していない、(d) 全 `actions/checkout` に `persist-credentials: false`、(e) workflow デフォルト `permissions: {}` + job 単位最小昇格。
  - **G-4**：secrets / token 露出ゼロ。`gh run view <run-id> --log` の出力を grep し、`***` マスク以外で `GITHUB_TOKEN` / `CLOUDFLARE_API_TOKEN` 等が出現しないことを確認。fork PR run / same-repo PR run の双方で検査する手順を記述。
  - **G-5**：VISUAL evidence の品質チェック。Phase 11 で取得予定のスクリーンショットの**要件**を quality-gate.md に列挙する：解像度、UI 上で job 名 / workflow 名 / status / required check 一覧が判読可能、機微情報（fork user 名以外の secrets）が映り込んでいない。
  - **G-6**：required status checks の job 名同期。`gh api repos/daishiman/UBM-Hyogo/branches/main/protection` および `branches/dev/protection` の `required_status_checks.contexts` と、実 workflow ファイルの job 名 / workflow `name:` が一致していることを diff で確認する手順を記述。
  - **G-7**：ロールバック手順の机上検証。Phase 5 / Phase 10 の単一 `git revert` 手順が、(a) safety gate 適用前へ戻す、(b) required status checks drift を検知する `gh api` コマンドが揃っていることを再確認。
  - **G-8**：用語整合（4 用語）と artifacts.json / 本文 status 同期。
- security 節を `quality-gate.md` 内に独立章として記述：
  - "pwn request" 非該当 5 箇条の最終確認結果を本タスクと dry-run 上流タスクで二重明記。
  - secrets 棚卸しの結果記録欄（実走時に埋める）を確保。
  - `GITHUB_TOKEN` scope 最小化の確認結果（job 単位 `permissions:` の列挙表）。
- MAJOR 0 件 / MINOR 許容 / PASS 多数 を本タスクの quality gate 通過条件とする。
- gate 不通過時の戻り先を記述：MAJOR があれば該当 Phase（5/6/8 のいずれか）に戻し、修正後に Phase 9 を再評価する。
- VISUAL evidence の取得は Phase 11 が正本のため、Phase 9 は「取得すべき要件」を確定させることに専念する。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `index.md`（AC-1〜AC-9）
- `outputs/phase-3/review.md`
- `outputs/phase-4/test-matrix.md`
- `outputs/phase-6/failure-cases.md`
- `outputs/phase-7/coverage.md`
- `outputs/phase-8/before-after.md`
- `.github/workflows/pr-target-safety-gate.yml`
- `.github/workflows/pr-build-test.yml`

## 成果物

- `outputs/phase-9/main.md`
- `outputs/phase-9/quality-gate.md`

## 統合テスト連携

静的検査（actionlint / yq / grep）の実走結果を quality-gate.md に貼付ける。fork PR / same-repo PR / labeled trigger / workflow_dispatch audit の dry-run smoke は Phase 11 で実走し、本 Phase はその要件と合否基準の確定に専念する。

## 完了条件

- [ ] quality-gate.md に G-1〜G-8 が PASS / MINOR / MAJOR で評価されている。
- [ ] 静的検査（actionlint / yq / grep）の実走ログが貼付けられている。
- [ ] "pwn request" 非該当 5 箇条が再点検済みと記録されている。
- [ ] secrets / token 露出ゼロの検査手順が記述されている。
- [ ] VISUAL evidence の品質要件が列挙されている。
- [ ] required status checks 名の同期が `gh api` 出力で確認されている。
- [ ] ロールバック手順の机上検証が記録されている。
- [ ] MAJOR 0 件 / MINOR 許容範囲内 / gate 不通過時の戻り先ルールが記述されている。
- [ ] artifacts.json の Phase 9 status が同期されている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。
