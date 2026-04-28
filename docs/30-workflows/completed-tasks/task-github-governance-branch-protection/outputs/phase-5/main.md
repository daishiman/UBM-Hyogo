# Phase 5 — 実装ランブック（サマリ）

## Status
done

> 本書は **後続実装タスク** が Phase 2 草案を本物の GitHub Repository に適用する際の手順書である。
> 本タスク自体は docs-only なので、ここに記載されたコマンドは Phase 5 内では実行しない。
> 詳細手順・所要時間・ロールバックは `runbook.md` 参照。

---

## 1. 適用範囲

| 対象 | 内容 |
| --- | --- |
| GitHub branch protection | main / dev の 2 ブランチに JSON 適用 |
| Repository setting | squash-only / delete_branch_on_merge / commit message 形式 |
| Workflow ファイル配置 | `.github/workflows/auto-rebase.yml` / `.github/workflows/pr-target-safety-gate.yml` |
| CODEOWNERS | main で必須化のため事前配置 |
| Secrets | 本草案は **追加 secrets を要求しない**（GITHUB_TOKEN のみ使用） |

---

## 2. 前提条件

- GitHub repo の Admin 権限を保有するアカウントが 1 名以上
- `gh` CLI（v2.40+）と `jq` がインストール済み
- main / dev 両ブランチがリモートに存在
- 既存 PR が「適用前に閉じる or 移行する」方針で合意済み（auto-rebase 対象になり得るため）
- 本 Phase の実行者は MEMORY ルールに従い `wrangler` 直接実行を行わない（本ランブックで該当コマンドはないが念のため）

---

## 3. 高位手順（runbook.md と対応）

| # | 手順 | 種別 | 所要時間目安 |
| - | --- | --- | --- |
| 1 | snapshot 取得（rollback 準備） | API | 5 分 |
| 2 | CODEOWNERS 配置 PR を main にマージ | git | 10 分 |
| 3 | Repository setting（squash-only 等）を `gh api` で適用 | API | 5 分 |
| 4 | dev branch protection を JSON で適用 | API | 5 分 |
| 5 | workflow YAML 2 本を main に PR 経由で配置 | git | 15 分 |
| 6 | main branch protection を JSON で適用（最後にする） | API | 5 分 |
| 7 | 検証コマンドで設定差分を再取得し sign-off | API | 10 分 |

> **適用順の鉄則**: main protection は **最後に適用** する。先に main を厳格化するとセルフロックして自分の PR が通せなくなる（Phase 6 FC-MAIN-LOCK 参照）。

---

## 4. 検証コマンドのサマリ

```bash
gh api repos/:owner/:repo/branches/main/protection | jq .
gh api repos/:owner/:repo/branches/dev/protection  | jq .
gh api repos/:owner/:repo | jq '{allow_squash_merge,allow_merge_commit,allow_rebase_merge,delete_branch_on_merge}'
```

PASS 基準は Phase 4 `test-matrix.md` の M-07 / D-06 / P-01..P-05 と同一。

---

## 5. 緊急運用（Phase 3 MINOR-1 への回答）

| ケース | 操作 |
| --- | --- |
| 本番障害でリリース凍結 | `lock_branch=true` を main に一時適用 |
| 凍結解除 | `lock_branch=false` に戻す |
| 全停止が必要な事故 | `enforce_admins=true` のまま、PR を全停止して人手判断へ |

`lock_branch` を切り替える条件・承認者・記録先は runbook.md §7 で定義。

---

## 6. ロールバック方針

- 適用前の `gh api … /protection` 出力を `protection-snapshot-YYYYMMDD-HHMM.json` としてローカル（リポ外）に退避
- 障害時は `gh api -X PUT …/protection --input protection-snapshot-….json` で復元
- snapshot ファイルはコミット禁止（org slug が含まれる可能性 / MEMORY 準拠）

---

## 7. 完了判定

- `runbook.md` に手順番号付きで 0〜10 が記載されること
- 各手順に「コマンド・期待出力・失敗時の戻し方」が揃うこと
- 緊急運用と通常運用の境界が明示されること

---

## 8. Phase 6 への申し送り

- 本ランブックの各手順で起こりうる失敗を Phase 6 `failure-cases.md` で網羅する。
- 特に「main を先に厳格化してセルフロック」「`required_status_checks.contexts` の名称ドリフト」「fork PR の secrets 露出」は Phase 6 の主要ケースとして扱う。
