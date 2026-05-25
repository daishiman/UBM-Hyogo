# Phase 8 — リファクタリング

> Task: issue-863-admin-error-alert-policy-iac
> 区分: 実装仕様書（コード変更を伴う）/ visual: **NON_VISUAL**
> 前提: Phase 5（実装手順）/ Phase 6（テスト追加）/ Phase 7（カバレッジ）完了後に適用するリファクタ計画。

本 Phase はコード実装を行わず、Phase 5 で確定した「変更/新規ファイル」に対して
**外形挙動を変えない範囲の構造改善**を仕様として固定する。AC への影響はない
（AC-1..AC-6 はすべて Phase 5..7 / Phase 10..11 で担保）。

---

## 8-1. 変更内容（対象 / Before / After / 理由）

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| `apps/web/src/lib/logger.ts` `emit()` の error 分岐 tags | `tags: { event, runtime }`（`scope`/`digest` は extras 止まり） | `tags: { event, runtime, ...(scope ? {scope} : {}), ...(digest ? {digest} : {}) }`（存在時のみ昇格・undefined を tag に入れない） | Sentry alert rule が `tags.scope=admin` でフィルタ可能になる（AC-2）。tag 値は string 限定なので digest は `String(digest)` 化し、欠損時は付与しない（cardinality 汚染回避） |
| `logger.ts` tag 組み立て | error 分岐に inline で object literal | private helper `buildTags(fields, payload)` に抽出（純関数・export しない） | error/warn 両分岐で tag 規約を 1 箇所に集約し、scope/digest 昇格規則の重複を排除。テスト容易性向上 |
| `infra/sentry-alerts/lib/types.ts` | （新規） | `SentryAlertPolicy` / `CanonicalAlertPolicy` 型を `infra/cloudflare-alerts/lib/types.ts` と**別名・別ファイル**で定義 | provider 差異（billing_usage_alert vs metric_alert / issue alert）が大きく、型を共有すると union が肥大化するため独立させる |
| `infra/sentry-alerts/lib/{load,diff,canonicalize}.ts` | （新規） | cloudflare-alerts の同名ファイルの**構造（関数シグネチャ・命名）を踏襲**し中身は Sentry rule shape に最適化 | 既存実装の読み手の学習コストを最小化（同型を保つ）。ロジック共有はしない（8-2 参照） |
| `package.json` scripts | `cf:alerts:*` のみ | `sentry-alerts:list` / `sentry-alerts:diff` / `sentry-alerts:apply` / `test:sentry-alerts` を追加 | `cf.sh` を介さず直接 `node infra/sentry-alerts/lib/cli.ts` を叩く（Sentry は Cloudflare CLI 管轄外）。命名は `cf:alerts:*` と平行 |

---

## 8-2. 設計判断: cloudflare-alerts/lib との共有 util 抽出を「しない」

`infra/cloudflare-alerts/lib/{load,diff,canonicalize}.ts` と
`infra/sentry-alerts/lib/{load,diff,canonicalize}.ts` には
`deepDiff` / `sortKeys` / `isObject` / JSON Schema ロード等の**見かけ上の重複**がある。
これを共通 util（例: `infra/_shared/iac-diff.ts`）へ抽出するかを検討した。

**結論: 今回は抽出しない（早すぎる抽象化を回避する設計判断であり、先送りではない）。**

| 観点 | 判断 |
|------|------|
| provider 差異 | Cloudflare は `billing_usage_alert`（percentage × quota-base で threshold 生成）。Sentry は `metric_alert` / issue alert（`tags.scope` フィルタ + 5分窓 frequency 閾値）。canonicalize の strip key・条件正規化ロジックが構造的に異なる |
| diff の比較対象 | Cloudflare は webhook の write-only 鍵（urlRef/secret）を除外する独自 compare view を持つ。Sentry は alert rule の server-generated id/dateCreated を strip する別ルール。共通化すると分岐だらけの汎用関数になる |
| callsite 数 | 現状 **2 provider のみ**。Rule of Three（重複が 3 回出るまで抽象化しない）に従い、抽出の正当化に必要な 3 つ目の provider が存在しない |
| 抽出コスト | 共有 util を切ると workspace package 化 or 相対 import 跨ぎが必要になり、`vitest` の path / `tsconfig` references を増やす。利得（数十行の DRY）に対しコストが過大 |

**トリガ条件（将来この判断を見直す境界）**: 3 つ目の宣言的 IaC provider
（例: Grafana / PagerDuty alert）を `infra/<provider>-alerts/` として追加する PR が出た時点で、
`deepDiff` / `sortKeys` / schema-load を `infra/_shared/` へ抽出する。それまでは
**同型コピーを正**とし、構造の一貫性（読み手が片方を理解すれば他方も読める）を優先する。

---

## 8-3. duplicate / navigation drift の確認

| チェック | 結果 / 方針 |
|----------|------------|
| 既存 `infra/sentry-alerts/` の有無 | 存在しない（`infra/cloudflare-alerts/` のみ）→ 新規作成で重複なし |
| logger の二重 emit | Sentry に一本化（Cloudflare alerts は billing 専用で error event 非対応）。`error.tsx` 側の emit は既存実装を再利用し、logger 側で二重送出しない |
| `logger.spec.ts` の重複 | 既存 `apps/web/src/lib/__tests__/logger.spec.ts` に**追記**（新規 spec ファイルを作らない）。`logger.runtime.spec.ts` とは責務分離（runtime tag 判定 vs scope/digest tag 昇格）を維持 |
| README ナビゲーション | `infra/sentry-alerts/README.md` の「関連」節から runbook（`docs/30-workflows/runbooks/issue-863-...`）と CI gate（`.github/workflows/sentry-alerts-drift.yml`）へ相互リンク。`infra/cloudflare-alerts/README.md` との混同防止に冒頭で「error event 用・billing は cloudflare-alerts 管轄」と明記 |
| index.md / artifacts.json | `implementation_targets` の 18 path と本 Phase の対象が 1:1 で一致することを確認（drift なし） |

---

## 8-4. リファクタ後の不変条件（Phase 9 で検証）

1. `logger.ts` の外形 API（`Logger` interface / `emit` の console 出力 JSON shape）は不変。tag 昇格は Sentry 送出にのみ影響する。
2. `buildTags()` は undefined を tag value に入れない（Sentry tag は string 必須・cardinality 保護）。
3. cloudflare-alerts/lib は一切変更しない（共有抽出をしないため）。
4. 新規追加のみでファイル削除は発生しない。
