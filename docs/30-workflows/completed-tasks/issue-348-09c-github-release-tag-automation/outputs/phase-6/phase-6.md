# Phase 6 正本: release-notes.template.md 仕様

## メタ情報
| 項目 | 値 |
| --- | --- |
| Phase | 6 / 13 |
| 実装区分 | 実装仕様書 |
| 対象 | `scripts/release/release-notes.template.md` |

## 目的
Phase 5 の `generate-release-notes.sh` が読む release note テンプレ本体の section 構造、placeholder 命名規則、changelog / evidence 不在時の fallback 文言を仕様として確定する。

## Step 0: P50 チェック（必須）
- [ ] `test -f scripts/release/release-notes.template.md` 配置先確定
- [ ] template 文字コード UTF-8 / LF 終端を仕様として固定
- [ ] log: `ls -la scripts/release/ 2>&1 | tee outputs/phase-6/p50-precheck.log`

## 6-A. section 構造（固定 7 セクション）

```
# Release {{TAG}}

## Summary
{{SUMMARY}}

## Tag & Commit
- Tag: `{{TAG}}`
- Commit: `{{COMMIT}}`
- Tagged at: `{{TAGGED_AT}}` (UTC)

## Phase 12 Changelog
{{PHASE12_CHANGELOG_BLOCK}}

## Phase 11 Runtime Evidence
{{PHASE11_EVIDENCE_LIST}}

## Rollback Evidence
{{ROLLBACK_EVIDENCE_BLOCK}}

## Known Follow-up
{{FOLLOWUP_LIST}}

## Refs
- Issue: #{{ISSUE_NUMBER}}
- Parent task: `{{PARENT_TASK}}`
- Runbook: `docs/runbooks/release-create.md`
```

> section 順序は固定。`generate-release-notes.sh` は section 単位の awk 置換で並び順を保証する。

## 6-B. placeholder 命名規則

| 規則 | 例 |
| --- | --- |
| `{{...}}`（中括弧 2 つ）+ 大文字スネーク | `{{TAG}}` `{{COMMIT}}` `{{PHASE11_EVIDENCE_LIST}}` |
| 単値置換は `sed`、複数行 block は `awk` で section 全体を差し替え | `{{PHASE12_CHANGELOG_BLOCK}}` は awk 対象 |
| 未置換 placeholder は exit 4 検出（Phase 5 5-A の grep gate）| 残置はリリースノート漏れの兆候 |

## 6-C. changelog 不在時の fallback

`--changelog-path` 不在 / ファイル不在時は `{{PHASE12_CHANGELOG_BLOCK}}` を以下に置換:

```
> Phase 12 changelog is not attached to this release.
> Refer to PR description for change list.
```

stderr に `[WARN] changelog not found, using fallback block` を出力。exit code は 0 を維持（release ノート作成は継続）。

## 6-D. evidence / followup 不在時の fallback

| placeholder | 不在時 |
| --- | --- |
| `{{PHASE11_EVIDENCE_LIST}}` | `> No runtime evidence attached.` |
| `{{ROLLBACK_EVIDENCE_BLOCK}}` | `> No rollback was triggered for this release.` |
| `{{FOLLOWUP_LIST}}` | `> None.` |
| `{{SUMMARY}}` | tag 名と commit 短縮 SHA を結合した既定文（例: `Production release {{TAG}} for commit {{COMMIT_SHORT}}.`） |

## 6-E. 文字コード / 改行

- UTF-8 (BOM なし)
- LF 終端（CRLF 禁止）
- 末尾改行 1 行（POSIX text file 準拠）

## 動作確認チェックリスト
- [ ] section 7 つの順序確定
- [ ] placeholder 命名規則確定
- [ ] 4 種類の fallback 文言確定
- [ ] 文字コード / 改行ルール確定

## 次 Phase の前提条件
本仕様の placeholder 名と section 順序を Phase 7 workflow が呼ぶ `create-github-release.sh` 経由で再現できること。
