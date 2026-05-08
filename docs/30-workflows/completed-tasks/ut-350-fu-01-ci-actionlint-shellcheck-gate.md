# UT-350-FU-01: CI actionlint / shellcheck gate

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | UT-350-FU-01 |
| 分類 | governance / CI |
| ステータス | consumed / implemented-local / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING |
| 優先度 | 低 |
| 規模 | 小 |
| 発見元 | `docs/30-workflows/issue-350-long-term-production-observation/outputs/phase-12/unassigned-task-detection.md` |
| formalized | 2026-05-06 |

## 消費トレース

| 項目 | 内容 |
| --- | --- |
| consumed_by | `docs/30-workflows/completed-tasks/governance/issue-526-ci-actionlint-shellcheck-gate/` |
| 状態 | implemented-local / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING |
| 反映日 | 2026-05-08 |
| 備考 | Issue #526 は CLOSED 維持。後続 PR は `Refs #526, Refs #350` のみを使う。 |

## なぜ必要か

Issue #350 で `.github/workflows/post-release-observation-reminder.yml` と `scripts/observation/*.sh` が追加された。local では YAML parse / Prettier / bash syntax / unit test を確認済みだが、`actionlint` / `shellcheck` はこの環境に未導入で、CI 上の再発防止 gate はまだない。

## 何を達成するか

GitHub Actions workflow と shell helper を CI で検証し、broken YAML / shell script が main に入る前に検出する。

## どのように実行するか

既存 CI workflow へ最小 job を追加するか、専用 workflow を追加する。対象は `.github/workflows/*.yml` と `scripts/**/*.sh` に限定する。

## 苦戦箇所【記入必須】

| 項目 | 内容 |
| --- | --- |
| 対象 | `.github/workflows/`, `scripts/observation/` |
| 症状 | local tool availability に依存すると `actionlint` / `shellcheck` 未導入環境で PASS と誤読しやすい |
| 参照 | `docs/30-workflows/issue-350-long-term-production-observation/outputs/phase-11/tool-availability.log` |

## リスクと対策

| リスク | 対策 |
| --- | --- |
| 既存 shell に shellcheck warning が多く CI が赤くなる | 初回対象を `scripts/observation/*.sh` に限定し、全体適用は別途拡張する |
| CI 時間が増える | actionlint / shellcheck は軽量なため単独 job で短時間実行する |

## 検証方法

```bash
gh run list --workflow=<lint-workflow> --limit 1
```

期待: actionlint / shellcheck job が success。

## スコープ

### 含む

- actionlint の CI 実行
- shellcheck の CI 実行
- Issue #350 追加ファイルを対象にした初回 gate

### 含まない

- repo 全体の shellcheck warning 一括修正
- GitHub label / repository settings の変更
