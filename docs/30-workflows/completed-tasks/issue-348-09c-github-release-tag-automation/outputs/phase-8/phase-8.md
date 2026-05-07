# Phase 8 正本: docs/runbooks/release-create.md 仕様

## メタ情報
| 項目 | 値 |
| --- | --- |
| Phase | 8 / 13 |
| 実装区分 | 実装仕様書 |
| 対象 | `docs/runbooks/release-create.md` |

## 目的
manual fallback runbook の章構成と各章で実行する具体コマンドを仕様化する。CI workflow (Phase 7) が落ちた際にローカルから release を作成・削除できる経路を残し、09c production deploy との接続境界を明文化する。

## Step 0: P50 チェック（必須）
- [ ] `which gh git` が成功
- [ ] `gh auth status` で repo write 権限あり
- [ ] log: `gh auth status 2>&1 | tee outputs/phase-8/p50-precheck.log`

## 8-A. 章構成

| # | 章 | 内容 |
| --- | --- | --- |
| 1 | 前提 | gh CLI 認証 / repo write 権限 / `scripts/release/` 配置確認 |
| 2 | 前段（09c production deploy 完了確認） | `gh run list --workflow=production-deploy.yml --limit 1` の最新が success |
| 3 | dry-run 手順 | `bash scripts/release/create-github-release.sh --dry-run --tag <TAG>` |
| 4 | apply 手順 | `bash scripts/release/create-github-release.sh --apply --tag <TAG>` |
| 5 | 検証 | `gh release view <TAG>` / `gh release view <TAG> --json url,tagName,targetCommitish` |
| 6 | rollback（release 削除） | `gh release delete <TAG> --yes` / `git push --delete origin <TAG>` |
| 7 | トラブルシュート | exit code 別の対処表 |

## 8-B. 章 2「前段確認」具体コマンド

```bash
# 09c production deploy が完了していることを確認
gh run list --workflow=production-deploy.yml --branch=main --limit 1 \
  --json conclusion,headSha,displayTitle \
  | tee outputs/phase-8/precheck-deploy.log

# tag 候補が main HEAD に紐付いていることを確認
TAG="vYYYYMMDD-HHMM"
git rev-parse "${TAG}^{commit}" \
  | tee outputs/phase-8/precheck-tag-commit.log
```

期待: 最新 run の `conclusion == "success"`、tag commit が `main` 履歴に存在。

## 8-C. 章 3「dry-run」

```bash
bash scripts/release/create-github-release.sh --dry-run --tag "$TAG" \
  | tee outputs/phase-8/dry-run-output.md
```

レビュー観点: section 7 つが順序通り / placeholder 残存なし / changelog block の URL 有効性。

## 8-D. 章 4「apply」

```bash
bash scripts/release/create-github-release.sh --apply --tag "$TAG" \
  2>&1 | tee outputs/phase-8/apply.log
```

成功条件: stdout に release URL、`gh release view "$TAG"` で参照可能。

## 8-E. 章 5「検証」

```bash
gh release view "$TAG" --json url,tagName,targetCommitish,body \
  | tee outputs/phase-8/release-view.json
```

## 8-F. 章 6「rollback」

immutable 原則のため上書きは禁止。誤 release 作成時のみ削除を許す:

```bash
gh release delete "$TAG" --yes \
  2>&1 | tee outputs/phase-8/rollback-release-delete.log
git push --delete origin "$TAG" \
  2>&1 | tee outputs/phase-8/rollback-tag-delete.log
```

その後、正規の `vYYYYMMDD-HHMM`（時刻を更新）で再度 apply。

## 8-G. 章 7「トラブルシュート」

| script exit | 原因 | 対処 |
| --- | --- | --- |
| 2 | tag format 不一致 | `vYYYYMMDD-HHMM` 形式で打ち直し |
| 3 | tag が local に不在 | `git fetch origin --tags` 後に再実行 |
| 4 | template 不在 / placeholder 残存 | template と changelog path を再指定 |
| 5 | `gh release create` 失敗 | 同名 release 既存 / 認証切れ / network。`gh auth status` 再確認 |

## 動作確認チェックリスト
- [ ] 7 章構成確定
- [ ] 各章のコマンドが `tee outputs/phase-8/<artifact>.log` で artifact 化
- [ ] rollback 手順確定（immutable 原則明記）
- [ ] exit code → 対処の対応表確定

## 次 Phase の前提条件
本 runbook を SSOT (Phase 9) からリンクできるよう `docs/runbooks/release-create.md` の path が確定していること。
