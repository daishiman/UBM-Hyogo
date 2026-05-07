# Phase 11: 手動テスト / runtime evidence（NON_VISUAL）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 / 13 |
| 作成日 | 2026-05-06 |
| 状態 | `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
| visualEvidence | NON_VISUAL |
| 状態語彙 | `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |

## 目的

NON_VISUAL タスクとして以下 3 種の runtime evidence を取得する:

1. `generate-release-notes.sh --dry-run` の markdown dump（決定論的に再現可能な release note 本文）
2. 既存 tag（`vYYYYMMDD-HHMM`）に対する `gh release create --draft`（あるいは `--prerelease`）1 件作成と `gh release view --json` 取得
3. actionlint / shellcheck / bats 実行ログ

## ⚠️ user gate（必須）

本 Phase は user が **`--apply` 実行を明示承認するまで** `blocked_runtime_evidence_pending` を維持する。`gh release create --draft` であっても GitHub 上に副作用が発生するため、user 明示承認なしに実行してはならない。承認解除前は spec のみ整備し、PASS 表記は使用しない（`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を維持）。

## 環境制約

- 対象 tag は user input で確定する（placeholder: `vYYYYMMDD-HHMM`）。spec 段階では fixture 値として扱う
- `gh auth status` が `Logged in to github.com` であること
- `--draft` で作成し、user 確認後に削除可能（事故時の回復容易性のため）

## NON_VISUAL evidence 必須ファイル

| # | ファイル | 内容 |
| --- | --- | --- |
| 1 | `outputs/phase-11/main.md` | NON_VISUAL Phase 11 の主 evidence manifest |
| 2 | `outputs/phase-11/manual-smoke-log.md` | dry-run / apply 手順の手動確認ログ |
| 3 | `outputs/phase-11/link-checklist.md` | release note に含めるリンクの存在確認 |
| 4 | `outputs/phase-11/dry-run-release-notes.md` | `create-github-release.sh --dry-run` の stdout dump |
| 5 | `outputs/phase-11/gh-release-view.json` | `gh release view <tag> --json` の出力 |
| 6 | `outputs/phase-11/lint-evidence.log` | actionlint / shellcheck / bats 実行ログを連結 |

## 取得手順

```bash
mkdir -p outputs/phase-11
TAG="vYYYYMMDD-HHMM"   # user が input で確定する placeholder

# 0) lint evidence（user gate 不要 / 副作用なし）
{
  echo "=== actionlint ==="; actionlint .github/workflows/release-create.yml || true
  echo "=== shellcheck ==="; shellcheck -S style scripts/release/*.sh || true
  echo "=== bats ==="; mise exec -- bats scripts/release/__tests__/generate-release-notes.bats || true
} | tee outputs/phase-11/lint-evidence.log

# 1) dry-run dump（副作用なし / user gate 不要）
bash scripts/release/create-github-release.sh \
  --tag "${TAG}" \
  --target "$(git rev-parse HEAD)" \
  --changelog-path docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/documentation-changelog.md \
  --evidence-url "https://github.com/daishiman/UBM-Hyogo/tree/main/docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11" \
  --dry-run \
  | tee outputs/phase-11/dry-run-release-notes.md

# 1b) 決定論性の自己検証（同一入力で 2 回実行 → diff 空）
bash scripts/release/generate-release-notes.sh --tag "${TAG}" --commit "$(git rev-parse HEAD)" --changelog-path docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/documentation-changelog.md --evidence-url "https://github.com/daishiman/UBM-Hyogo/tree/main/docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11" --generated-at "2026-05-06T00:00:00Z" > /tmp/run-a.md
bash scripts/release/generate-release-notes.sh --tag "${TAG}" --commit "$(git rev-parse HEAD)" --changelog-path docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/documentation-changelog.md --evidence-url "https://github.com/daishiman/UBM-Hyogo/tree/main/docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11" --generated-at "2026-05-06T00:00:00Z" > /tmp/run-b.md
diff /tmp/run-a.md /tmp/run-b.md && echo "deterministic=ok" \
  | tee -a outputs/phase-11/dry-run-release-notes.md

# 2) ⚠️ user gate（必須）: ここから先は user 明示承認後にのみ実行
#    user が "Phase 11 apply してよい" と明言した後にのみ次の `--apply` を実行する
bash scripts/release/create-github-release.sh \
  --tag "${TAG}" \
  --target "$(git rev-parse HEAD)" \
  --changelog-path docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/documentation-changelog.md \
  --evidence-url "https://github.com/daishiman/UBM-Hyogo/tree/main/docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11" \
  --dry-run \
  > /tmp/release-notes-reviewed.md

bash scripts/release/create-github-release.sh \
  --tag "${TAG}" \
  --target "$(git rev-parse HEAD)" \
  --changelog-path docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/documentation-changelog.md \
  --evidence-url "https://github.com/daishiman/UBM-Hyogo/tree/main/docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11" \
  --draft \
  --apply \
  --reviewed-notes-file /tmp/release-notes-reviewed.md

# 3) 作成された release を JSON で取得
gh release view "${TAG}" \
  --json tagName,name,isDraft,isPrerelease,body,createdAt,url,targetCommitish \
  | tee outputs/phase-11/gh-release-view.json
```

## 期待結果

| ファイル | 期待 |
| --- | --- |
| `dry-run-release-notes.md` | `{{` / `}}` placeholder が一切残らない / 末尾に `deterministic=ok` 行 / `## Changelog` セクションが Phase 12 changelog の本文と一致 |
| `gh-release-view.json` | `tagName == TAG` / `isDraft == true`（または `isPrerelease == true`）/ `body` が `dry-run-release-notes.md` と本文一致 / `url` が `https://github.com/daishiman/UBM-Hyogo/releases/tag/<TAG>` |
| `lint-evidence.log` | actionlint 0 件 / shellcheck SC0 / bats 全 TC PASS |

## DoD

- [ ] 上記 3 ファイルが実体配置（user gate 解除後に取得）
- [ ] dry-run の決定論性確認行が含まれる
- [ ] `gh release view --json` 取得済 / draft 状態
- [ ] lint evidence が actionlint / shellcheck / bats すべて PASS

## 状態遷移

- spec 作成完了時: `blocked_runtime_evidence_pending`
- user `--apply` 承認 + evidence 取得完了時: `runtime_evidence_collected`
- それ以前は `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を維持し PASS 表記しない

## 成果物

- `outputs/phase-11/phase-11.md`（本ファイル）
- 上記 3 evidence ファイル（user gate 解除後に取得）

## 次 Phase の前提条件

3 evidence ファイルが実体配置されていること。
