---
workflow_id: issue-265-forms-api-quota-sa-governance
phase: 5
taskType: docs-only
visualEvidence: NON_VISUAL
state: spec_created
---

# Phase 5 — 実装手順（doc 執筆手順）

実装サイクル時に Phase 11 / 12 / 13 で物理配置する文書の **執筆順序とテンプレ参照** を固定する。本 spec 自体ではコード実装は行わない。

## 1. 執筆対象（Phase 11 evidence inventory に集約）

| 順 | doc | AC | 担当 phase |
| --- | --- | --- | --- |
| 1 | `outputs/phase-11/quota-allocation-table.md` | AC-1 | Phase 11 |
| 2 | `outputs/phase-11/sa-separation-policy.md` | AC-2 | Phase 11 |
| 3 | `outputs/phase-11/project-switch-trigger.md` | AC-3 | Phase 11 |
| 4 | `outputs/phase-11/ops-runbook.md` | AC-4 | Phase 11 |
| 5 | `outputs/phase-11/manual-smoke-log.md` | AC-1（計算根拠） | Phase 11 |
| 6 | `outputs/phase-11/link-checklist.md` | 検証 #2 | Phase 11 |
| 7 | `outputs/phase-11/secret-grep-log.md` | AC-5 | Phase 11 |

> **重要**: 本 spec ではこれら 7 ファイルの **テンプレと列スキーマ** を Phase 3 で確定する。実体の値（quota 数値・余裕率・grep 結果）は実装サイクル時に Phase 11 を更新して埋める。本 spec 段階では `outputs/phase-11/phase-11.md` に「未生成 sub-doc 一覧」として列挙する。

## 2. 執筆順序の依存

```
quota-allocation-table.md ── 計算根拠 ──▶ manual-smoke-log.md
sa-separation-policy.md ─── 切替判断連動 ──▶ project-switch-trigger.md
ops-runbook.md ◀── すべての成果物を要約 ───
link-checklist.md ◀── 全 doc 完成後 ───
secret-grep-log.md ◀── 全 doc 完成後（最終 gate）───
```

## 3. 執筆ルール

1. すべての doc は冒頭に YAML frontmatter（workflow_id / phase / taskType / visualEvidence / state）を付ける。
2. **実値禁止**: SA メール / project ID / API Token / OAuth client secret は `op://Vault/Item/Field` 参照または `<placeholder>` のみ。
3. Form ID `119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg` は CLAUDE.md の公開固定値のため記載可。
4. Cloudflare Secrets はキー名（例: `GOOGLE_SERVICE_ACCOUNT_JSON`）のみ記載。`wrangler` 直接呼び出し禁止 → `bash scripts/cf.sh secret put` を runbook に明記。
5. 引用は markdown link で path 明示。stale link はゼロ。

## 4. レビュー手順（セルフレビュー）

| # | 確認項目 | 方法 |
| --- | --- | --- |
| R-1 | canonical 9 headings 一致 | Phase 12 compliance-check |
| R-2 | strict 7 files 物理配置 | `ls outputs/phase-12/` |
| R-3 | secret 非混入 | Phase 4 grep #1〜#3 |
| R-4 | link 全 OK | Phase 4 link checker |
| R-5 | 余裕率 ≤ 70% | Phase 11 manual-smoke-log |

## 5. 本 spec で生成済の文書

- `index.md` / `artifacts.json` / `outputs/artifacts.json`
- `phase-1.md` 〜 `phase-13.md`（root index 14 件）
- `outputs/phase-1` 〜 `phase-13`（各 1 ファイル）
- `outputs/phase-12/` strict 7

実装サイクル時は Phase 11 の sub-doc 7 件を追加する（本 spec のスコープ外）。
