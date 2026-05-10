# Phase 11: 手動 smoke test

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | ISSUE-331-CICD-WARNING-001 |
| Phase | 11 |
| 状態 | spec_created |
| visualEvidence | NON_VISUAL |

## 目的

S1 / S2 修正後の動的検証を実行し、warning ゼロと deploy green を実証する。

## smoke 手順

### Step 1: ローカル dry-run（事前）

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production --dry-run 2>&1 | tee /tmp/api-prod.log
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run 2>&1 | tee /tmp/api-staging.log
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run 2>&1 | tee /tmp/web-staging.log
grep -i warning /tmp/api-prod.log /tmp/api-staging.log /tmp/web-staging.log
```

### Step 2: feat ブランチ → dev PR → merge

`dev` push で web-cd staging job が起動することを確認。

```bash
gh workflow run web-cd.yml --ref dev
gh run watch
```

### Step 3: staging URL 動作確認

- staging Workers URL（`<...>-staging.workers.dev` 等）に curl
- `/healthz` または `/` の 200 応答を確認
- 旧 staging Pages URL（`<project>-staging.pages.dev`）が 404/orphan であることを確認 → Phase 11 補足で削除起票

### Step 4: dev → main PR → merge（user 承認後）

```bash
gh run list --workflow=web-cd.yml --branch=main --limit=1
gh run view <RUN_ID> --log | grep -i warning
```

### Step 5: production rollback リハ（任意）

```bash
bash scripts/cf.sh rollback <PREVIOUS_VERSION_ID> --config apps/web/wrangler.toml --env production
```

実行は user 承認後のみ。

## 証跡保存

- `outputs/phase-11/main.md` に以下を記録:
  - dry-run ログ抜粋（Token 値関連項目はマスク）
  - staging / production CI run URL
  - smoke 実行日時と判定
- `outputs/phase-11/manual-smoke-log.md`（任意）にコマンド実行結果

## NON_VISUAL 宣言

`visualEvidence: NON_VISUAL`。スクリーンショット不要。CI ログと curl 応答が証跡。

## 完了条件

- [ ] Step 1〜5 の手順が記載されている
- [ ] 証跡保存先が指定されている
- [ ] NON_VISUAL 宣言が明記されている

## 成果物

- `outputs/phase-11/main.md`

## 実行タスク

- 対象 Phase の判断、設計、検証、または証跡作成を実行する。
- `apps/api/wrangler.toml` / `.github/workflows/web-cd.yml` / aiworkflow 正本との整合を確認する。

## 参照資料

- `docs/30-workflows/issue-331-cicd-runtime-warning-cleanup/index.md`
- `apps/api/wrangler.toml`
- `.github/workflows/web-cd.yml`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 統合テスト連携

NON_VISUAL CI/CD 設定タスクのため、統合テストは static grep、typecheck、wrangler dry-run、GitHub Actions run evidence で代替する。runtime deploy は user approval 後に実行する。

## 依存Phase参照

- Phase 2: `phase-02.md` / `outputs/phase-02/main.md`
- Phase 5: `phase-05.md` / `outputs/phase-05/main.md`
- Phase 6: `phase-06.md` / `outputs/phase-06/main.md`
- Phase 7: `phase-07.md` / `outputs/phase-07/main.md`
- Phase 8: `phase-08.md` / `outputs/phase-08/main.md`
- Phase 9: `phase-09.md` / `outputs/phase-09/main.md`
- Phase 10: `phase-10.md` / `outputs/phase-10/main.md`
