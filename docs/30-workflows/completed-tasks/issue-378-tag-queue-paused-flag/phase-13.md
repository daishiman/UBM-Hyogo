# Phase 13: PR 作成（user 承認ゲート）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 |
| タスク | issue-378-tag-queue-paused-flag |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | pending |


[実装区分: 実装仕様書]
判定根拠: env binding 追加・関数シグネチャ変更・テスト追加・runbook 新規作成を伴うため、コード変更が必須。

## 目的

local check → commit → push → PR 作成までを user 承認の上で実行する。

## 前提

- phase-10 GO 判定済み。
- phase-11 NON_VISUAL evidence が outputs に記録済み。
- phase-12 必須成果物 6 件が完成済み。

## 実行手順

### 1. local check（再走）

```
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm/api test
```

全 PASS を `outputs/phase-13/local-check-result.md` に記録。

### 2. main 同期

```
git fetch origin main
git checkout main && git pull --ff-only origin main
git checkout <feature-branch>
git merge main
```

コンフリクトは CLAUDE.md の既定方針に従い解消。

### 3. change summary 記録

`git status --porcelain` および `git diff main...HEAD --name-only` の出力を `outputs/phase-13/change-summary.md` に貼付。
PR に含まれるファイル一覧の最終確認。

### 4. commit

```
git add apps/api/src/env.ts \
        apps/api/wrangler.toml \
        apps/api/src/workflows/tagCandidateEnqueue.ts \
        apps/api/src/workflows/tagCandidateEnqueue.test.ts \
        apps/api/src/jobs/sync-forms-responses.ts \
        docs/30-workflows/runbooks/tag-queue-pause.md \
        docs/30-workflows/issue-378-tag-queue-paused-flag/
```

(残差分があれば `git status` で確認した上で追加 stage する)

commit message 例:

```
feat(tag-queue): add TAG_QUEUE_PAUSED emergency stop flag (#378)

Forms sync → tag_assignment_queue enqueue を env flag で
緊急停止できる経路を追加。default disabled。flag true 時は
INSERT 0 件 + structured log UBM-TAGQ-PAUSED を出力。

invariants: #5 / #13 unchanged.
```

### 5. push & PR 作成

```
git push -u origin <feature-branch>
gh pr create --title "feat(tag-queue): TAG_QUEUE_PAUSED 緊急停止 flag (#378)" \
  --body "$(cat outputs/phase-12/implementation-guide.md)"
```

PR 本文には `outputs/phase-12/implementation-guide.md` の主要見出しを反映。スクリーンショット項目は **作らない**（NON_VISUAL）。

### 6. user 承認ゲート

PR URL を user に提示し、merge 判断は user に委ねる。Claude Code 側で merge は実行しない。

## 出力アーティファクト

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-13/local-check-result.md` | install / typecheck / lint / test の出力 |
| `outputs/phase-13/change-summary.md` | `git diff main...HEAD --name-only` |
| `outputs/phase-13/pr-info.md` | branch 名 / commit hash / PR title / body 抜粋 |
| `outputs/phase-13/pr-creation-result.md` | PR URL / 作成日時 |

## 実行タスク

- [ ] Phase 13 の目的に沿って、本文で定義した確認・実装・検証を実施する。
- [ ] 関連する実コード、実仕様書、実スキル参照を同一サイクルで更新する。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `docs/30-workflows/issue-378-tag-queue-paused-flag/artifacts.json`

### 依存 Phase

- Phase 1: `phase-01.md`
- Phase 2: `phase-02.md`
- Phase 5: `phase-05.md`
- Phase 6: `phase-06.md`
- Phase 7: `phase-07.md`
- Phase 8: `phase-08.md`
- Phase 9: `phase-09.md`

## 成果物

- `docs/30-workflows/issue-378-tag-queue-paused-flag/phase-13.md`
- Phase 13 に対応する `outputs/phase-13/` 成果物

## 完了条件

- [ ] Phase 13 の完了条件を満たす。

- local check 全 PASS が記録されている。
- main 同期コンフリクト解消済み。
- 必要な全ファイルが commit に含まれている（残差分なし）。
- PR が作成され URL が記録されている。
- user 承認ゲートに引き渡されている。
