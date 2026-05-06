# Phase 1: 要件定義 / GO 判定 / tag format SSOT 確定

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 / 13 |
| 作成日 | 2026-05-06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | completed |

## 目的

Issue #348 の AC を確定し、release tag format `vYYYYMMDD-HHMM`（09c Phase 5 `release-tag-script.md` の正本）を本タスクの SSOT として固定する。target commit の検証ルール / release note に組み込む 4 種類のリンク（Phase 12 changelog / Phase 11 runtime evidence / rollback evidence / known follow-up）を定義し、Phase 2（template 設計）着手の GO/NO-GO を判定する。

## Step 0: P50 チェック（必須）

```bash
mkdir -p outputs/phase-1

# 1) gh CLI が認証済（release 作成主体）
gh auth status \
  | tee outputs/phase-1/gh-auth-status.log

# 2) 既存 09c Phase 5 の release-tag-script.md が参照可能（tag format 正本）
test -f docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-05.md \
  && echo "OK: 09c phase-05.md present" \
  | tee outputs/phase-1/09c-phase-05-presence.log

# 3) 09c Phase 12 changelog が参照可能（release note 入力 SSOT）
test -f docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/documentation-changelog.md \
  && echo "OK: 09c phase-12 changelog present" \
  | tee outputs/phase-1/09c-phase-12-changelog-presence.log

# 4) actionlint / shellcheck / bats 利用可能性
{ which actionlint; which shellcheck; which bats; } \
  | tee outputs/phase-1/lint-tools.log
```

期待:

- `gh auth status` が `Logged in to github.com` を含む
- 09c Phase 5 / Phase 12 changelog ファイルが存在
- `actionlint` / `shellcheck` / `bats` 全て解決可能（無い場合は Phase 4 着手前に install）

## tag format SSOT（正本固定）

| 項目 | 値 | 出典 |
| --- | --- | --- |
| 形式 | `vYYYYMMDD-HHMM` | 09c Phase 5 `release-tag-script.md` |
| 正規表現 | `^v[0-9]{8}-[0-9]{4}$` | 本タスクで確定 |
| 例 | `v20260426-1530` | 09c phase-05.md L264 |
| timezone | tag 文字列は UTC ではなく **JST 表記** | 09c 既存運用に整合（実時刻 03:00 JST など） |
| 不変条件 | 同名 tag を上書きしない（immutable） | 09c phase-05.md L347 |

## target commit 検証ルール

| 項目 | 規則 |
| --- | --- |
| commit 存在 | `git cat-file -e <sha>^{commit}` で 0 を返すこと |
| reachable | `git merge-base --is-ancestor <sha> origin/main` で 0 を返すこと（main から到達可能） |
| sha 形式 | full sha（40 文字 hex）。short sha は受け付けない |
| 二重 tag | `git tag --points-at <sha>` で同じ commit に既存 release tag が無いこと（exit 1） |

## release note に含めるリンク種別（4 種・必須）

| ID | 種別 | 入力 | 出典 |
| --- | --- | --- | --- |
| L1 | Phase 12 changelog URL | `--changelog-path` 引数（既定: `docs/30-workflows/completed-tasks/09c-.../outputs/phase-12/documentation-changelog.md`） | Issue #348 AC |
| L2 | Phase 11 runtime evidence URL | `--evidence-base-url` 引数 + `outputs/phase-11/` ディレクトリ | 同上 |
| L3 | rollback evidence URL | Phase 11 配下の `rollback-evidence.md` 等（存在時のみ） | 同上 |
| L4 | known follow-up | unassigned-task の関連タスク id を箇条書き列挙 | 同上 |

## Acceptance Criteria

| ID | 内容 | 計測方法 |
| --- | --- | --- |
| AC-1 | tag format `vYYYYMMDD-HHMM` が SSOT として確定 | spec grep |
| AC-2 | target commit 検証ルール 4 項目が確定 | spec grep |
| AC-3 | release note のリンク種別 4 種が確定 | spec grep |
| AC-4 | `gh release create` を使う（独自 GitHub API 直叩きはしない）方針が確定 | spec grep |
| AC-5 | dry-run と apply の 2 段ゲートが必須であることが明記 | spec grep |

## GO / NO-GO 判定

| 条件 | 判定 |
| --- | --- |
| Step 0 全て期待通り、かつ tag format / 検証ルール / リンク 4 種が確定 | GO（Phase 2 へ） |
| `gh` 未認証 | NO-GO（`gh auth login` 後に再判定） |
| 09c Phase 5 / Phase 12 不在 | NO-GO（参照 SSOT 不在） |

## 成果物

- `outputs/phase-1/gh-auth-status.log`
- `outputs/phase-1/09c-phase-05-presence.log`
- `outputs/phase-1/09c-phase-12-changelog-presence.log`
- `outputs/phase-1/lint-tools.log`
- `outputs/phase-1/go-no-go-decision.md`（判定結果と根拠）

## 次 Phase の前提条件

GO 判定確定後、tag format / リンク 4 種を入力として Phase 2 で template placeholder 仕様を設計する。
