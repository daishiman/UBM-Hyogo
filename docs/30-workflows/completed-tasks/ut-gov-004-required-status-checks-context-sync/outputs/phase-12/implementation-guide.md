# UT-GOV-004 — implementation-guide.md（Phase 12 ドキュメント更新 / PR 本文ベース）

## Part 1. まず何を決めたのか（中学生レベル）

学校の運動会で、リレーのスタート前に「全員がそろっているか」を先生が確認するとする。名前の呼び方が名簿と違うと、本当は来ている人を「まだ来ていない」と間違えて、競技を始められない。

このタスクも同じ問題を防ぐためのもの。GitHub の branch protection（大事な枝に勝手な変更が入らないようにする門番）は、required status checks（通過前に成功している必要がある確認項目）の名前を見て、変更を通してよいか判断する。名前が実際の GitHub Actions の表示名とずれると、確認項目が永遠に「まだ来ていない」扱いになり、merge が止まる。

そこで、古い草案の 8 個の名前を見直し、今本当に存在していて成功実績もある 3 個だけを、後続の UT-GOV-001 が使う入力としてまとめた。まだ存在しない確認項目は、無理に入れず、UT-GOV-005 などの後続タスクで workflow（自動確認の手順）を作ってから追加する。

## Part 2. 技術者向け実装・運用ガイド

### 1. 概要

branch protection 草案 8 contexts と現行 GitHub Actions 実在 job 名の同期を完了し、UT-GOV-001 が消費する確定 context 入力（機械可読 YAML）を整備した。アプリ層 (`apps/`, `packages/`) への変更ゼロ、governance / docs-only / NON_VISUAL タスク。

### 2. 成果

#### 2-a. 確定 contexts（rollout phase 1 投入対象）

```yaml
required_status_checks:
  contexts:
    - "ci"
    - "Validate Build"
    - "verify-indexes-up-to-date"
  strict:
    dev: false
    main: true
```

正本: `outputs/phase-08/confirmed-contexts.yml`

#### 2-b. 草案 8 件の処遇

| # | 草案 | 経路 | 結果 |
| --- | --- | --- | --- |
| 1 | typecheck | rename | `ci`（Type check ステップを内包） |
| 2 | lint | rename | `ci`（Lint ステップを内包） |
| 3 | unit-test | exclude | UT-GOV-005 リレー |
| 4 | integration-test | exclude | UT-GOV-005 リレー |
| 5 | build | rename | `Validate Build` |
| 6 | security-scan | exclude | UT-GOV-005 リレー |
| 7 | docs-link-check | exclude | UT-GOV-005 リレー |
| 8 | phase-spec-validate | rename | `verify-indexes-up-to-date` |

`ci` は typecheck / lint を内包する aggregate job であり、個別の `typecheck` / `lint` check-run を required check として登録するものではない。`verify-indexes-up-to-date` は Phase 仕様そのものの validator ではなく、skill index drift を検出する近接 gate として扱う。

#### 2-c. lefthook ↔ CI 対応表

`outputs/phase-08/lefthook-ci-mapping.md` に集約。同一 pnpm script を双方が呼ぶ規約を明文化。

#### 2-d. strict 採否

dev=`false` / main=`true`。根拠は `outputs/phase-09/strict-decision.md`。

### 3. 型・入力契約

```ts
type ConfirmedContexts = {
  version: 1;
  meta: {
    task_id: "UT-GOV-004";
    generated_at: string;
    source_sha: string;
    verification_command: string;
  };
  required_status_checks: {
    contexts: string[];
    strict: {
      dev: boolean;
      main: boolean;
    };
  };
  evidence: Array<{
    context: string;
    workflow_file: string;
    workflow_name: string;
    job_key: string;
    job_name: string;
    last_success_at: string;
    triggers: string[];
  }>;
};
```

UT-GOV-001 の使用例:

```bash
yq -o=json '.required_status_checks.contexts' \
  docs/30-workflows/ut-gov-004-required-status-checks-context-sync/outputs/phase-08/confirmed-contexts.yml
```

### 4. 検証 / 証跡

- 直近 main sha: `f4fb3ba6d018075db0e2292542c90a899d3c2dd7`
- 検証コマンド: `gh api repos/daishiman/UBM-Hyogo/commits/f4fb3ba6d018075db0e2292542c90a899d3c2dd7/check-runs`
- 確認結果: 3 件すべて `conclusion=success` / `2026-04-28T21:46Z`

エラー時の扱い:

| 状態 | 扱い |
| --- | --- |
| context が存在しない | rollout phase 1 から除外し、UT-GOV-005 などへリレー |
| 30 日以内 success がない | branch protection 投入禁止 |
| workflow/job `name:` が変わった | 本タスクを再実行し、confirmed-contexts.yml を更新 |
| branch protection write 権限がない | UT-GOV-001 の承認ゲートで停止 |

設定値:

| 項目 | 値 |
| --- | --- |
| contexts | `ci`, `Validate Build`, `verify-indexes-up-to-date` |
| strict.dev | `false` |
| strict.main | `true` |
| apply 実行責務 | UT-GOV-001 |

### 5. UT-GOV-001 への引き渡し

UT-GOV-001 は次の 1 ファイルのみを入力契約として読み取り、`gh api -X PATCH /repos/:owner/:repo/branches/:branch/protection` を実行する。

- `docs/30-workflows/ut-gov-004-required-status-checks-context-sync/outputs/phase-08/confirmed-contexts.yml`

### 6. 苦戦箇所と対策（H-1: context drift hazard）

| # | 苦戦箇所 | 対策 |
| --- | --- | --- |
| 1 | merge 完全停止リスク | 投入前の `gh api check-runs` 実績確認を AC-3 として強制 |
| 2 | context 名規則の混乱 | required check は GitHub の check-run 名に合わせる |
| 3 | 同名 job 衝突 | `confirmed-contexts.yml` に workflow / job key / job name を併記 |
| 4 | strict トレードオフ | dev=false / main=true で段階適用 |
| 5 | lefthook ↔ CI ドリフト | 同一 pnpm script を双方が呼ぶ規約 |
| 6 | 名前変更事故 | 経路 A（同一 PR）/ 経路 B（新旧並列→旧外し）運用を明文化 |

### 7. 後続タスク

| タスク | 内容 |
| --- | --- |
| UT-GOV-001 | confirmed-contexts.yml を apply |
| UT-GOV-005 | unit-test / integration-test / security-scan / docs-link-check の workflow 新設 |
| UT-GOV-007 | workflow `name:` 変更を検出する CI（経路 A 強制） |
| task-git-hooks-lefthook-and-post-merge | pre-push hook の追加実装（推奨 4 件） |

### 8. AC 充足

10/10 すべて充足。詳細: `outputs/phase-07/ac-matrix.md`。

### 9. 4 条件評価

価値性 / 実現性 / 整合性 / 運用性 すべて PASS、MAJOR ゼロ。

### 10. NON_VISUAL evidence

UI/UX 実装はない。`outputs/phase-11/` に `main.md` / `manual-smoke-log.md` / `link-checklist.md` を配置。スクリーンショット参照は不要。

### 11. 参照

- 原典: `docs/30-workflows/completed-tasks/UT-GOV-004-required-status-checks-context-sync.md`
- 後続: `docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md`
- 仕様 index: `docs/30-workflows/ut-gov-004-required-status-checks-context-sync/index.md`
