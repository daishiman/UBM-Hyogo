# Phase 12: 未タスク検出

`[実装区分: 実装仕様書]`
workflow_state: `implemented_local_evidence_captured`

## メタ情報

| 項目 | 値 |
|------|-----|
| task_id | `web-worker-size-limit-fix` |
| 検出件数 | 1 件 |

## 目的

本 workflow のスコープ外で発生する将来タスクを検出し、起票・実施タイミングを明記する（0 件でも必須出力）。

## 検出結果

### 検出 1: member 個別動的 OG（OGP）の再導入

| 項目 | 内容 |
|------|------|
| 概要 | Task A で撤去した member 個別の動的 OGP 画像（名前入りシェア画像）を将来再導入する。 |
| 理由 | 動的 OG は `next/og` の wasm/font 焼き込みで Worker bundle を ~1539KB 肥大化させる。無料プラン 3072KiB 上限という **明確な技術的制約** により本 workflow では静的共通画像へ寄せた。member 個別 OG を戻すには (1) Cloudflare 有料プランへの移行、または (2) OG 専用 Worker の分離（別 bundle 化）が前提となる。 |
| CONST_007 例外区分 | **例外として記録**（無料プラン Worker サイズ制限という技術的に確定した制約が根拠）。 |
| ユーザー承認 | **要**（有料移行 or Worker 分離はインフラ/コストに影響するため user 承認が前提）。 |
| 実施時期 | 未定（無料プラン制約が解消された時点、または個別 OG の SEO 価値が定量化された時点）。 |
| 実施場所 | `docs/30-workflows/unassigned-task/member-dynamic-og-paid-or-worker-split.md`（登録済み）。 |

## それ以外

- 上記 1 件は unassigned-task として登録済み。これ以外の未タスクは **0 件**。
- 独立 grep（TODO / FIXME / skip）による横断検出でも、本 workflow のスコープ起因の追加タスクは検出されなかった。

## 完了条件

- [ ] 検出 1 件の理由・時期・場所・承認要否を明記した
- [ ] それ以外 0 件を明示した

## タスク100%実行確認【必須】

- [ ] 0 件でも必須出力した
- [ ] CONST_007 例外区分とユーザー承認要否を記載した
