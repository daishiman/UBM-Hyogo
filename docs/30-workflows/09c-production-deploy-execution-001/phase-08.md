# Phase 8: release tag 付与 + push

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 09c-production-deploy-execution-001 |
| Phase 番号 | 8 / 13 |
| Phase 名称 | release tag 付与 + push |
| Wave | 9 (execution 半身) |
| Mode | serial（最終 / production mutation） |
| 作成日 | 2026-05-02 |
| 前 Phase | 7 (production deploy 実行) |
| 次 Phase | 9 (production smoke + 認可境界検証) |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | VISUAL（tag 一覧 / push 結果ログ）|
| user_approval | 不要（Phase 5 で承認済 mutation の延長として実施） |

## 目的

Phase 7 で production deploy が完了した直後の `main` 最新 commit に対し、命名規則 `vYYYYMMDD-HHMM` の immutable な annotated tag を付与し `origin` に push する。release tag は production deploy の不可逆な証跡として、Phase 9 smoke / Phase 11 24h 検証 / Phase 13 PR `Refs #353` の全段で同一 tag 名を参照させ、deploy 対象 commit と smoke 対象 commit を「tag 一致」で 1:1 に固定する。

deploy 実行と異なるブランチ・異なる commit への tag 誤付与を避けるため、本 Phase は `git fetch origin main` で main を最新化したうえで `git rev-parse origin/main` の commit hash を **Phase 7 deploy 対象 commit と必ず一致** させたうえで実施する。

## 実行タスク

1. `git fetch origin main` で remote main を取得し、ローカル main を fast-forward 同期する
2. `git rev-parse origin/main` の commit hash を Phase 7 deploy evidence と突合し一致を確認する
3. release tag 名を `vYYYYMMDD-HHMM` 形式（JST）で確定し、衝突がないか `git tag --list` で事前確認する
4. `git tag -a <RELEASE_TAG> <COMMIT> -m "production release ..."` で annotated tag を作成する
5. `git push origin <RELEASE_TAG>` で remote へ push する
6. `git tag --list 'v2026*'` と `git ls-remote --tags origin` で local / remote 双方の tag 反映を確認する
7. evidence を `outputs/phase-08/release-tag-evidence.md` に保存する
8. 異常時（誤 commit に付与・push 失敗・既存 tag と衝突）は本 Phase 末尾の手順で `git tag -d` / `git push origin --delete <tag>` を行い、再付与する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-08.md | release tag フォーマット規則の正本 |
| 必須 | docs/30-workflows/09c-production-deploy-execution-001/phase-07.md | deploy 対象 commit hash の引き継ぎ |
| 必須 | docs/30-workflows/09c-production-deploy-execution-001/index.md | AC-2 / AC-8 の根拠 |
| 必須 | docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/implementation-guide.md | Step 11 の release tag 手順 |
| 参考 | CLAUDE.md | ブランチ戦略 / linear history 運用 |

## 実行手順

### ステップ 1: main 最新化

```bash
# remote main を取得（force fetch しない）
git fetch origin main

# ローカル main を fast-forward 同期（merge / rebase は不要）
git checkout main
git merge --ff-only origin/main

# main 最新 commit を変数に格納
RELEASE_COMMIT=$(git rev-parse origin/main)
echo "RELEASE_COMMIT=${RELEASE_COMMIT}"
```

期待: `git fetch` が exit 0、`merge --ff-only` が exit 0、`RELEASE_COMMIT` が 40 桁の SHA-1 hash。

### ステップ 2: deploy 対象 commit との一致確認

```bash
# Phase 7 deploy evidence の commit hash と一致を確認
DEPLOY_COMMIT=$(grep -E '^deploy_target_commit:' \
  docs/30-workflows/09c-production-deploy-execution-001/outputs/phase-07/deploy-evidence.md \
  | awk '{print $2}')

test "${RELEASE_COMMIT}" = "${DEPLOY_COMMIT}" \
  && echo "OK: deploy commit matches main HEAD" \
  || { echo "NG: drift detected"; exit 1; }
```

期待: `OK: deploy commit matches main HEAD`。drift 検出時は本 Phase を中断し、Phase 7 evidence を再点検する。

### ステップ 3: release tag 名の確定 + 衝突確認

```bash
# JST で tag 名を生成（vYYYYMMDD-HHMM）
RELEASE_TAG="v$(TZ=Asia/Tokyo date +%Y%m%d-%H%M)"
echo "RELEASE_TAG=${RELEASE_TAG}"

# 命名規則検証（^v[0-9]{8}-[0-9]{4}$）
echo "${RELEASE_TAG}" | grep -E '^v[0-9]{8}-[0-9]{4}$' \
  && echo "OK: format" \
  || { echo "NG: format"; exit 1; }

# 既存 tag と衝突しないか確認
git fetch origin --tags
git tag --list "${RELEASE_TAG}" | grep -q . \
  && { echo "NG: tag already exists locally"; exit 1; } \
  || echo "OK: no local collision"
git ls-remote --tags origin "refs/tags/${RELEASE_TAG}" | grep -q . \
  && { echo "NG: tag already exists on remote"; exit 1; } \
  || echo "OK: no remote collision"
```

期待: 全行 `OK`。衝突時は HHMM を 1 分以上ずらして再生成する（同名 tag の上書き禁止 / immutable 規則）。

### ステップ 4: annotated tag 作成

```bash
git tag -a "${RELEASE_TAG}" "${RELEASE_COMMIT}" -m "production release ${RELEASE_TAG}

- target commit: ${RELEASE_COMMIT}
- task: 09c-production-deploy-execution-001
- refs: #353
- deploy phase: phase-07
- runbook: docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/implementation-guide.md
"

# 作成確認
git tag -v "${RELEASE_TAG}" 2>/dev/null || git show "${RELEASE_TAG}" --no-patch
```

期待: tag が annotated（`tag <name>` ヘッダ + commit object 表示）として作成されている。lightweight tag の場合は `git tag -d` で削除して再作成。

### ステップ 5: remote push

```bash
git push origin "${RELEASE_TAG}"
```

期待: `* [new tag]         vYYYYMMDD-HHMM -> vYYYYMMDD-HHMM`。

### ステップ 6: local / remote 反映確認

```bash
# local tag 一覧
git tag --list 'v2026*'

# remote tag 一覧
git ls-remote --tags origin | grep "${RELEASE_TAG}"

# tag が指す commit hash と RELEASE_COMMIT の一致確認
test "$(git rev-list -n 1 ${RELEASE_TAG})" = "${RELEASE_COMMIT}" \
  && echo "OK: tag points to deploy commit" \
  || { echo "NG: tag points to wrong commit"; exit 1; }
```

期待: 全コマンドで該当 tag が表示され、tag が指す commit が `RELEASE_COMMIT` と一致する。

### ステップ 7: evidence 保存

`outputs/phase-08/release-tag-evidence.md` に以下を記録:

- `RELEASE_TAG` 値
- `RELEASE_COMMIT` 値（40 桁 SHA-1）
- Phase 7 `DEPLOY_COMMIT` との一致確認結果
- `git tag -a` / `git push origin` の標準出力
- `git ls-remote --tags origin` の該当行
- 命名規則検証ログ（`OK: format` / `OK: no collision`）
- 異常発生時の経緯（あれば）と対応した tag 名のリトライ履歴

### ステップ 8（異常時のみ）: tag 削除と再付与

```bash
# 1) ローカル tag 削除
git tag -d "${WRONG_TAG}"

# 2) remote tag 削除（push 済みの場合のみ）
git push origin --delete "${WRONG_TAG}"

# 3) ステップ 3〜6 を新しい HHMM で再実行
```

注意: `--force` での tag 上書きは禁止（immutable 規則違反）。常に削除 → 別名再付与で運用する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | smoke 対象 production を `RELEASE_TAG` 配下の deploy として記録 |
| Phase 10 | GO/NO-GO 判定 evidence で `RELEASE_TAG` を参照 |
| Phase 11 | 24h 検証の起点時刻と `RELEASE_TAG` を結びつけ |
| Phase 13 | PR body に `Refs #353` と `RELEASE_TAG` を併記 |
| 上流 09b | release runbook の Step 11 完了マーキング |

## 多角的チェック観点（不変条件）

- 不変条件 #6: GAS prototype 由来の用語が tag メッセージに混入しないこと（`onFormSubmit` 等）
- 命名一貫性: `vYYYYMMDD-HHMM` 1 形式のみ。semver / commit hash tag を混在させない
- immutable 原則: 同名 tag の上書き禁止。誤付与時は別 HHMM で再発行
- 監査証跡: annotated tag のメッセージに deploy commit / runbook path / `Refs #353` を含める
- linear history: tag 付与は `main` 最新 HEAD のみ対象。中間 commit への tag 禁止

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | main 最新化 | 8 | pending | `git fetch` + `merge --ff-only` |
| 2 | deploy commit 一致確認 | 8 | pending | Phase 7 evidence と突合 |
| 3 | tag 名確定 + 衝突確認 | 8 | pending | `vYYYYMMDD-HHMM` |
| 4 | annotated tag 作成 | 8 | pending | `git tag -a` |
| 5 | remote push | 8 | pending | `git push origin <tag>` |
| 6 | 反映確認 | 8 | pending | local / remote 両方 |
| 7 | evidence 保存 | 8 | pending | `release-tag-evidence.md` |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/release-tag-evidence.md | tag 名 / commit / push ログ / 命名規則検証 |
| メタ | artifacts.json | Phase 8 を completed に更新 |

## 完了条件

- [ ] `RELEASE_COMMIT` が Phase 7 `DEPLOY_COMMIT` と一致
- [ ] `RELEASE_TAG` が `^v[0-9]{8}-[0-9]{4}$` を満たす
- [ ] local / remote 双方に annotated tag が反映
- [ ] tag が指す commit が `RELEASE_COMMIT` と一致
- [ ] tag メッセージに `Refs #353` と runbook path が含まれる
- [ ] evidence が `outputs/phase-08/release-tag-evidence.md` に保存

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 衝突 / 誤付与時のリトライ履歴が evidence に残る
- `git tag --list 'v2026*'` で `RELEASE_TAG` を視認できる
- `git ls-remote --tags origin` で remote 反映を視認できる
- artifacts.json の phase 8 を completed に更新

## 次 Phase

- 次: 9 (production smoke + 認可境界検証)
- 引き継ぎ事項: `RELEASE_TAG`, `RELEASE_COMMIT`, evidence path
- ブロック条件: tag 未付与 / push 失敗 / commit 不一致のいずれかで Phase 9 に進まない

## リスクと対策

| リスク | 対策 |
| --- | --- |
| deploy 対象 commit と tag 対象 commit の drift | ステップ 2 の hash 突合を必須化、不一致時は本 Phase を中断 |
| 既存 tag との名前衝突 | ステップ 3 で local / remote 両方の衝突確認、HHMM を 1 分以上ずらして再発行 |
| lightweight tag を誤作成 | ステップ 4 で `-a` を必須化、ステップ 4 の検証コマンドで annotated を確認 |
| 誤 tag の上書き | `--force` 禁止、常に `git tag -d` + `git push origin --delete` で削除してから別名で再発行 |
| push 後にトークン不足で削除不能 | `bash scripts/cf.sh` 同様 1Password 由来の GitHub Token を使用、本 Phase 着手前に push 権限を確認 |
| timezone ずれによる tag 名の混乱 | `TZ=Asia/Tokyo` を必須化、UTC で生成された tag は削除 + JST 再生成 |
