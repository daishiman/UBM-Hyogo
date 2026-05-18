# Phase 2: 設計

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 |
| 機能名 | issue-290-workflow-lint-gate |
| 作成日 | 2026-05-17 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |

## 設計方針

### 1. actionlint 適用範囲拡大

`ci.yml` の `workflow-shell-lint` job 内の `Actionlint workflow syntax` step を **glob 化** し、明示列挙を廃止する。

**Before** (`.github/workflows/ci.yml:50`):
```yaml
run: ./actionlint -color .github/workflows/post-release-observation-reminder.yml .github/workflows/ci.yml .github/workflows/e2e-tests.yml ...（9 件列挙）
```

**After**:
```yaml
run: ./actionlint -color .github/workflows/*.yml
```

理由:
- 新規 workflow 追加時に lint 対象から漏れる drift を構造的に防止
- `verify-gate-metadata.yml` / `audit-correlation-verify.yml` 内の自己 lint step は**残置**（job 単位独立性 / fail-fast 維持のため）。重複は許容コスト。

### 2. yamllint 採否判断

**判断: 不採用**。理由を `outputs/phase-02/yamllint-decision.md` に固定。

| 評価軸 | actionlint | yamllint |
| --- | --- | --- |
| GH Actions 文脈検証 | ◎ | × |
| YAML 構文検証 | ○（actionlint が内部で実施） | ◎ |
| GH Actions 独自表現との衝突 | なし | あり（`${{ }}` 等） |
| 既存 workflow のノイズ | なし | 多発見込み |

→ actionlint が YAML 構文 + GH Actions 文脈の両方を担うため、yamllint 二重導入は ROI が低い。primary gate を actionlint 単独に固定。

### 3. ローカル復旧手順 runbook

新規ファイル: `docs/30-workflows/runbooks/workflow-lint-local-recovery.md`

内容:
- actionlint インストール (`bash <(curl -sS https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash)`)
- ローカル実行 (`./actionlint .github/workflows/*.yml`)
- CI 失敗時の再現手順
- 既知の false positive 対処（`# actionlint-shellcheck shell=bash` 等）

## 変更対象ファイル一覧

| パス | 変更種別 | 内容 |
| --- | --- | --- |
| `.github/workflows/ci.yml` | 編集 | line 50 を glob 化 |
| `docs/30-workflows/runbooks/workflow-lint-local-recovery.md` | 新規 | ローカル復旧手順 |
| `docs/30-workflows/completed-tasks/issue-290-workflow-lint-gate/outputs/phase-02/yamllint-decision.md` | 新規 | yamllint 不採用記録 |

## 副作用 / 影響範囲

- CI 実行時間: actionlint 全 32 件に拡大しても +数秒 (現在 9 件で 1 秒未満)
- 既存 workflow に lint error がある場合は CI fail → Phase 4-6 で先回り検出

## 実行手順

1. `.github/workflows/ci.yml` の owner job を `workflow-shell-lint` に固定する。
2. `package.json` の `observation:lint` も同じ glob scope に揃え、required `ci` context 側の local reproduction drift を消す。
3. `yamllint` は不採用 decision として文書化し、将来導入する場合は別タスクで評価する。

## 統合テスト連携

| Command | 目的 |
| --- | --- |
| `./actionlint -color .github/workflows/*.yml` | 全 workflow syntax / context gate |
| `pnpm observation:lint` | 既存 shellcheck + actionlint local reproduction gate |

## 多角的チェック観点（AIが判断）

| 思考法グループ | 設計反映 |
| --- | --- |
| 論理・構造 | 32 件全件を glob で対象化し、列挙漏れを構造的に消す |
| メタ・発想 | yamllint 追加ではなく actionlint 単独に寄せ、二重 lint のノイズを避ける |
| システム・戦略 | CI job と package script を同一 scope にし、required context と dedicated job の drift を防ぐ |

## サブタスク管理

| サブタスク | owner | 状態 |
| --- | --- | --- |
| `.github/workflows/ci.yml` | Issue #290 | completed |
| `package.json` observation lint | Issue #290 | completed |
| decision / runbook | Issue #290 | completed |

## 成果物

| 成果物 | パス |
| --- | --- |
| yamllint decision | `outputs/phase-02/yamllint-decision.md` |
| runbook | `docs/30-workflows/runbooks/workflow-lint-local-recovery.md` |

## 完了条件

- [ ] CI と local script が `.github/workflows/*.yml` に統一されている
- [ ] actionlint version が 1.7.7 に固定されている
- [ ] `yamllint` 不採用理由が tracked file に残っている

## タスク100%実行確認【必須】

- [ ] 設計した全変更対象が Phase 5 / Phase 11 / Phase 12 に接続されている

## 次Phase

Phase 3: 設計レビュー
