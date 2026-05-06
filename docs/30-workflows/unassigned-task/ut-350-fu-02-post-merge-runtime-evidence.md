# UT-350-FU-02: D+7 / D+30 runtime evidence capture

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | UT-350-FU-02 |
| 分類 | operations / runtime evidence |
| ステータス | 未実施 |
| 優先度 | 中 |
| 規模 | 小 |
| 発見元 | `docs/30-workflows/issue-350-long-term-production-observation/outputs/phase-12/unassigned-task-detection.md` |
| formalized | 2026-05-06 |

## なぜ必要か

Issue #350 は `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` で close-out する。local contract は確認済みだが、real `workflow_dispatch` / Issue 作成は user approval と post-merge repository state が必要なため、今回 cycle 内で実行できない。

## 何を達成するか

PR merge 後に `post-release-observation-reminder.yml` を手動実行し、実 run id と reminder Issue URL を Phase 11 evidence に追記する。

## どのように実行するか

```bash
gh workflow run post-release-observation-reminder.yml \
  -f release_date=<YYYY-MM-DD> \
  -f offset_days=7

gh run list --workflow=post-release-observation-reminder.yml --limit 1
gh run view <run-id>
```

起票された Issue に aggregate-only evidence を記録し、token / PII / request body は保存しない。

## 苦戦箇所【記入必須】

| 項目 | 内容 |
| --- | --- |
| 対象 | GitHub Actions runtime / GitHub Issue creation |
| 症状 | local test では `GITHUB_TOKEN` 権限、repo label、real issue creation の挙動を完全には検証できない |
| 参照 | `docs/30-workflows/issue-350-long-term-production-observation/outputs/phase-11/phase-11.md` |

## リスクと対策

| リスク | 対策 |
| --- | --- |
| `issues:write` 権限不足 | workflow permissions と repository Actions settings を確認する |
| label 不在で Issue 作成失敗 | Issue #350 本体では既存確認済みの `priority:medium` のみ使用する |
| 証跡に機微情報が混入 | aggregate-only / redacted evidence に限定する |

## 検証方法

期待:

- `gh run view <run-id>` が success
- reminder Issue URL が確認できる
- Phase 11 に run id / Issue URL / redaction 方針が追記される

## スコープ

### 含む

- post-merge `workflow_dispatch` 1 回
- run id / Issue URL の記録
- Phase 11 runtime evidence の更新

### 含まない

- 自然 schedule trigger の D+7 / D+30 実日待ち
- Cloudflare runtime metrics の自動取得
