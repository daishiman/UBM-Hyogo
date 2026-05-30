---
id: member-dynamic-og-paid-or-worker-split
issue_number: 1027
status: open
source_workflow: docs/30-workflows/completed-tasks/web-worker-size-limit-fix/
created_at: 2026-05-29
task_type: implementation
visualEvidence: NON_VISUAL
---

# member dynamic OG paid plan or Worker split

```yaml
task_id: member-dynamic-og-paid-or-worker-split
task_name: member dynamic OG paid plan or Worker split
category: 改善
target_feature: member detail OGP
priority: 中
scale: 小規模
status: 未実施
source_phase: Phase 12
created_date: 2026-05-29
dependencies: []
spec_path: docs/30-workflows/unassigned-task/member-dynamic-og-paid-or-worker-split.md
```

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | member-dynamic-og-paid-or-worker-split |
| タスク名 | member dynamic OG paid plan or Worker split |
| 優先度 | 中 |
| 規模 | 小規模 |
| ステータス | 未実施 |
| GitHub Issue | https://github.com/daishiman/UBM-Hyogo/issues/1027 |
| 発見元 | `docs/30-workflows/completed-tasks/web-worker-size-limit-fix/outputs/phase-12/unassigned-task-detection.md` |
| 関連Issue | #806（CLOSED、dynamic member OG実装タスク。Free 3MiB制約・Paid/Worker split判断は本タスクへ分離） |

## 背景

Issue #806 では member-specific dynamic OG image generation を実装済み扱いとしていたが、今回の `web-worker-size-limit-fix` で `next/og` / `ImageResponse` が Cloudflare Workers Free 3MiB gzip limit を超過させる主要因であることが確定した。そのため、同じ実装を main web Worker に戻す前に、Paid plan 移行または OG 専用 Worker 分離の意思決定と設計を独立タスクとして扱う。

## 苦戦箇所【記入必須】

Member-specific dynamic OG images require `next/og` / `ImageResponse`, which
pulls wasm/font binaries into the OpenNext Worker server bundle. This conflicts
with the Cloudflare Workers Free 3MiB gzip limit proven in
`web-worker-size-limit-fix`.

- 対象: `apps/web/app/(public)/members/[id]/opengraph-image/route.tsx`
- 症状: `next/og` が `resvg.wasm` / `yoga.wasm` / font binary を Worker bundle に含め、staging deploy の gzip size gate を超過させる。
- 参照: `docs/30-workflows/completed-tasks/web-worker-size-limit-fix/outputs/phase-12/implementation-guide.md`

## リスクと対策【記入必須】

| リスク | 対策 |
| --- | --- |
| Reintroducing `next/og` breaks staging deploy size gate | Do not implement until either Paid plan is approved or OG generation is split into a separate Worker/bundle |
| Paid plan changes cost model | Require explicit user approval before implementation |
| Separate Worker adds routing/ops complexity | Create a dedicated design workflow before code changes |

## 検証方法【記入必須】

- `bash scripts/check-worker-size.sh` remains PASS in `apps/web`.
- Dynamic OG route is isolated from the main web Worker bundle, or Paid 10MiB
  limit is documented and approved.
- `rg -n "next/og|ImageResponse" apps/web/app apps/web/src` remains 0 for the
  main web Worker path unless the cost/architecture decision is approved.

## スコープ【記入必須】

含む:
- Paid plan decision or separate OG Worker design.
- Member-specific OG image implementation after the approved decision.

含まない:
- Reintroducing `next/og` into the current main `apps/web` Worker while the Free
  3MiB limit is the governing constraint.

## 受け入れ基準

- User-approved cost/architecture decision exists.
- Main web Worker deploy size remains within the approved limit.
- Member detail metadata points to the approved dynamic OG endpoint only after
  size/cost evidence is present.
