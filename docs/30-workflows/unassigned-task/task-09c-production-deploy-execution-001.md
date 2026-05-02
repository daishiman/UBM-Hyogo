# task-09c-production-deploy-execution-001

## メタ情報

```yaml
issue_number: 353
```


## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-09c-production-deploy-execution-001 |
| タスク名 | 09c production deploy / smoke / 24h verification 実行 |
| 分類 | implementation |
| 対象機能 | Production deploy / Cloudflare Workers / D1 |
| 優先度 | 高 |
| 見積もり規模 | 大規模 |
| ステータス | formalized（canonical workflow 作成済 / production execution 未実施） |
| 発見元 | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/unassigned-task-detection.md` |
| 発見日 | 2026-05-01 |
| 親タスク | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification` |
| Canonical workflow | `docs/30-workflows/09c-production-deploy-execution-001/` |
| taskType | implementation |
| visualEvidence | VISUAL |

## 1. なぜこのタスクが必要か（Why）

09c は production deploy / post-release verification の runbook を docs-only / spec_created として整備したが、実 production deploy、release tag、runtime smoke、24h verification はユーザー承認後に実行する必要がある。docs-only 仕様作成と production mutation を同じ完了扱いにすると、未実行の deploy が完了済みに見える。

放置すると、main 昇格、Cloudflare D1 migration、Workers deploy、release evidence の時系列が曖昧になり、rollback 判断と監査証跡が壊れる。

## 2. 何を達成するか（What）

dev → main 昇格後に、09c runbook に従って production D1 migration、production deploy、release tag、production smoke、24h verification を明示承認付きで完了する。

## 3. どのように実行するか（How）

Phase 1 で user approval gate を固定し、承認ログなしでは `bash scripts/cf.sh` 経由の production mutation を実行しない。Cloudflare 操作は `wrangler` 直実行ではなく wrapper に統一し、main merge commit と deploy evidence を同じ artifact set に保存する。

## 4. 実行手順

1. 09c Phase 1-12 と `outputs/phase-12/implementation-guide.md` を読み、production 実行順を確認する。
2. ユーザー承認ログ、main merge commit、Cloudflare account identity を evidence に保存する。
3. production D1 migrations を dry-run / list で確認し、承認後に apply する。
4. API / Web production deploy を実行する。
5. release tag を作成し、production smoke と authz invariant を実測する。
6. 24h verification を実測値で埋め、異常時は rollback / incident 分岐へ進む。

## 5. 完了条件チェックリスト

- [ ] user approval evidence が保存されている
- [ ] main merge commit と deploy target が一致している
- [ ] production D1 migration が Applied として確認できる
- [ ] API / Web production deploy が exit 0
- [ ] release tag と smoke evidence が保存されている
- [ ] 24h verification が実測値で完了している

## 6. 検証方法

### 単体検証

```bash
git status --short
git rev-parse origin/main
bash scripts/cf.sh whoami
```

期待: 作業差分が意図通りで、Cloudflare account が production 操作対象と一致する。

### 統合検証

```bash
bash scripts/cf.sh d1 migrations list ubm_hyogo_production --remote --env production --config apps/api/wrangler.toml
pnpm --filter @ubm/api deploy:production
pnpm --filter @ubm/web deploy:production
```

期待: migration list が Applied、api/web deploy が exit 0、09c の `outputs/phase-11/` に runtime evidence が揃う。

## 7. リスクと対策

| リスク | 対策 |
| --- | --- |
| 未承認の production mutation | Phase 1 で user approval gate を明記し、承認ログなしでは `bash scripts/cf.sh` を実行しない |
| Cloudflare CLI drift | `wrangler` 直実行を禁止し、`bash scripts/cf.sh` 経由に統一 |
| main 昇格前の deploy | `git rev-parse origin/main` と PR merge commit を evidence に保存してから deploy |
| 24h metrics の取り忘れ | Phase 5 で post-release reminder と evidence path を作る |

## 8. 参照情報

- `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/phase12-task-spec-compliance-check.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`

## 9. 備考

Phase 13 が未実行でも、本タスクは production mutation の user approval を別途必要とする。`Closes` ではなく `Refs` を使い、実 deploy 完了前に issue を閉じない。

## 苦戦箇所【記入必須】

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260501-065106-wt-10/docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-05.md`
- 症状: docs-only 仕様作成 PR と production 実行手順が同一 lifecycle に混在し、Phase 13 PR 作成前に production deploy 済みと読める時系列になっていた
- 参照: `outputs/phase-12/skill-feedback-report.md` / `outputs/phase-12/phase12-task-spec-compliance-check.md`

## スコープ

### 含む

- dev → main 昇格後の production deploy 実行
- production smoke / release tag / runbook share / 24h verification
- `outputs/phase-11/` runtime evidence の実測値反映

### 含まない

- 09c docs-only 仕様書の再設計
- 新規機能開発
- Cloudflare secret 値の記録
