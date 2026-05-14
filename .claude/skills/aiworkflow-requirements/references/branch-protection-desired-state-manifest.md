---
name: branch-protection-desired-state-manifest
description: GitHub branch protection を「repo 内 desired-state manifest」「adapter `apply.sh`」「read-only verifier `verify-branch-protection.sh`」の 3 層に分割する canonical 参照。operational SSOT は GitHub API fresh GET、repo 内 JSON は `required_status_checks.contexts` と `strict` のみを宣言する manifest 扱い。
type: reference
---

# Branch Protection Desired-State Manifest（canonical）

## 1. 三層構成と責務

| 層 | 実体 | 責務 | mutability |
| --- | --- | --- | --- |
| Operational SSOT | `gh api -X GET repos/daishiman/UBM-Hyogo/branches/{dev,main}/protection` | branch protection の実値。あらゆる契約評価はこの fresh GET を正本とする | GitHub 側 |
| Desired-state manifest | `.github/branch-protection/dev.json` / `.github/branch-protection/main.json` | `required_status_checks.contexts` と `strict` の **only** の desired 値を宣言。**PUT body 全体ではない** | repo PR |
| Adapter | `.github/branch-protection/apply.sh` | fresh GET → contexts/strict 差し替え → CLAUDE.md 不変条件正規化 → optional fields は fresh 値保持 → `gh api -X PUT` のアトミック適用 | repo PR |
| Verifier | `scripts/verify-branch-protection.sh` | read-only drift 検査。最終行 `OK(<branch>): no drift` を契約とする。PASS/INFO 行は監査補助 | repo PR |

> repo 内 JSON を full PUT body の正本にすると、Issue scope 外の field まで巻き込んで上書きされうる。`required_status_checks.contexts` / `strict` だけを宣言する「manifest」に閉じることで、変更したい field のみを構造的に閉じ込める。

## 2. desired-state manifest schema

```jsonc
{
  "required_status_checks": {
    "strict": false,
    "contexts": [
      "ci",
      "Validate Build",
      "coverage-gate",
      "lighthouse-ci",
      "e2e-tests-coverage-gate"
    ]
  }
}
```

- ファイル単位で `contexts[]` が完全な desired set（差分ではなく置換）
- `strict` は manifest で desired 値を上書きする
- 上記 2 key 以外は manifest に書かない（書いた場合は CI lint で fail させる方針）

## 3. CLAUDE.md 不変条件（INV-*）の正規化対象

`apply.sh` は以下の **CLAUDE.md 宣言済み** 不変条件のみを毎回正規化する。未宣言の field は fresh GET 値を保持する。

| ラベル | field | desired | 根拠 |
| --- | --- | --- | --- |
| INV-SOLO | `required_pull_request_reviews` | `null` | solo 運用ポリシー（CLAUDE.md「ブランチ戦略」節） |
| INV-ENF | `enforce_admins` | `true` | governance enforcement（CLAUDE.md「Governance / CODEOWNERS」節） |
| INV-LINEAR | `required_linear_history` | `true` | 履歴保護（同上） |
| INV-LOCK | `lock_branch` | `false` | 通常 PR 運用可（同上） |

`required_conversation_resolution` / `allow_force_pushes` / `allow_deletions` / `allow_fork_syncing` / `block_creations` 等は `apply.sh` 内で `// false` / `// true` の safe default を持ちつつ、fresh GET 値があればそれを保持する。

## 4. drift 判定基準（Stage 3 land 時点）

`scripts/verify-branch-protection.sh` の契約:

- 最終行が `OK(<branch>): no drift` であれば PASS（exit 0）
- INFO 行は `enforce_admins` などの policy 表記の補助情報。drift とは別扱い
- 1 件でも desired と乖離があれば exit 1 で fail させ、CI gate として機能

CI / `pre-push` で `pnpm verify:branch-protection` を起動して drift を早期検知する設計を許容するが、`gh api -X PUT` を含む mutation は **user-gated** とし、AI agent が自動実行しない。

## 5. drift 取り込み判定（Phase 4 design 必須）

drift を検知したとき、同 PR で正規化するか別 issue 起票するかは「CLAUDE.md で既に宣言済みの不変条件か」で 2 値判定する:

| 区分 | 例 | 取り込み |
| --- | --- | --- |
| 宣言済み INV | INV-SOLO / INV-ENF / INV-LINEAR / INV-LOCK | `apply.sh` の正規化対象として同 wave で吸収して良い |
| 未宣言 field | 例: `required_signatures`, environment 別 review policy | `O-NN` 別 issue として起票し 1 PR 1 責務を維持 |

判定根拠は `apply.sh` のコード内コメントに INV ラベルで残し、`phase-11/main.md` に drift 一覧 + ラベル付き表を固定する。

## 6. workflow `name:` フィールドと contexts manifest の整合

required context の文字列は GitHub Actions の workflow `name:` または job の `name:` から派生する。Stage 3 land 時点の対応:

| context | source | path |
| --- | --- | --- |
| `ci` | `.github/workflows/ci.yml` の `name: ci` | `ci.yml:5` 付近 |
| `Validate Build` | 同 workflow 内 job `name: Validate Build` | `ci.yml` job |
| `coverage-gate` | 同 workflow 内 job `coverage-gate` | `ci.yml:125` 付近 |
| `lighthouse-ci` | `.github/workflows/lighthouse.yml` の `name: lighthouse-ci` | `lighthouse.yml:1` |
| `e2e-tests-coverage-gate` | `.github/workflows/e2e-tests.yml` の `name: e2e-tests-coverage-gate` | `e2e-tests.yml:1` |

Phase 12 compliance check では `grep -n "^name:" .github/workflows/*.yml` の出力と manifest contexts を文字列レベルで突合する。

## 7. 集約 required context の設計指針

matrix shard 個別（例: `e2e (desktop-chromium)`）を required context 化すると、shard 数だけ contract 面が膨張する。**「全 shard 成功 + coverage gate」を集約する単一 job**（`e2e-tests-coverage-gate`）を required 化することで、shard 構成という実装詳細を contract 面に漏らさず、shard 増減のたびに branch protection PUT を伴う変更が不要になる。

## 8. Lighthouse readiness pattern との接続

Lighthouse CI workflow（`.github/workflows/lighthouse.yml`）の server 起動待ちは下記 pattern を default とする:

```yaml
- name: Start server (background)
  run: |
    nohup pnpm --filter @ubm-hyogo/web start > /tmp/web-server.log 2>&1 &
    echo $! > /tmp/web-server.pid
- name: Wait for server (wait-on)
  run: pnpm dlx wait-on -t 120000 http-get://localhost:3000
```

詳細は `references/quality-e2e-testing.md`「lighthouse-ci の readiness pattern」節（追記予定）を参照。

## 9. 関連参照

- `references/branch-protection.md`（payload 不変条件の SSOT）
- `references/workflow-e2e-quality-uplift-stage-0-3-artifact-inventory.md`（Stage 3 artifact map）
- `references/task-workflow-active.md`（Stage 3 active entry）
- `lessons-learned/lessons-learned-e2e-quality-uplift-stages-2026-05.md`（L-E2EQU-S3A-001..003）
- `docs/30-workflows/e2e-quality-uplift-stage-3/`（Stage 3 local execution root）
- `.github/branch-protection/{dev,main}.json` / `apply.sh` / `README.md`
- `scripts/verify-branch-protection.sh`
- `CLAUDE.md` ブランチ戦略 / Governance 節

## 10. 履歴

| Date | Stage | Note |
| --- | --- | --- |
| 2026-05-12 | Stage 3 land (Issue #608) | 初版作成。desired-state manifest / adapter / verifier の三層責務を canonical 化。INV-SOLO/ENF/LINEAR/LOCK の 4 不変条件を `apply.sh` 正規化対象に固定 |
