# Phase 12: システム仕様更新サマリ

## Step 1-A: 完了タスク記録の方針

本タスクは **spec-from-closed-issue** モードで実行されている。

| 項目 | 値 |
|------|-----|
| task_id | TASK-AWSHH-FU-001-CSP-ENFORCE-CUTOVER |
| issue | #869 [AWSHH-FU-001] CSP report-only → enforce 切替 |
| issue_status | **CLOSED**（GitHub state 変更禁止・reopen しない） |
| workflow_state | implemented_local_evidence_captured |
| implementation_mode | new |
| taskType | implementation / NON_VISUAL |
| 元 follow-up | U-AWSHH-001（apps-web-security-headers-hardening Phase 12 検出） |

GitHub issue #869 は CLOSED 状態を維持し、本仕様書がローカル台帳との整合を取る（GitHub state は変更しない）。

---

## Step 1-B: 実装状況テーブル

| Path | 分類 | 状態 |
|------|------|------|
| `apps/web/src/lib/env.ts` | `CSP_MODE` enum + `getSecurityHeaderEnv()` 追加 | implemented |
| `apps/web/middleware.ts` | `getSecurityHeaderEnv()` 経由配線へ変更 | implemented |
| `apps/web/wrangler.toml` | `[vars]` / `[env.staging.vars]` / `[env.production.vars]` に `CSP_MODE` 追加 | implemented |
| `apps/web/src/lib/env.spec.ts` | `getSecurityHeaderEnv` TC-01〜04 追加 | implemented / PASS |
| `apps/web/playwright/tests/security-headers.spec.ts` | `CSP_MODE` 追従 + 反対ヘッダ absent assert 追加 | implemented / PASS |
| `apps/web/src/lib/security-headers.ts` | `SecurityHeaderMode` 型 + `buildSecurityHeaders` + `applySecurityHeaders`（変更禁止） | 実装済み |
| `apps/web/src/lib/security-headers.spec.ts` | enforce 単体テスト（変更禁止・回帰ガード） | 実装済み |
| `docs/30-workflows/issue-869-csp-enforce-cutover/**` | workflow spec / Phase 11-13 仕様書群 | implemented_local_evidence_captured |

---

## Step 1-C: 関連タスクテーブル

| Issue | タイトル | 依存関係 | 状態 |
|-------|---------|---------|------|
| #868 [AWSHH-FU-003] | CSP Reporting-Endpoints / report-to 集約 | soft 依存。`report-to` ディレクティブ追加は #868 スコープ。enforce は reporting endpoint 無しで機能するため**本 issue のブロッカーではない** | CLOSED |
| #871 [AWSHH-FU-002] | CSP nonce 化 | 独立。現 CSP は `script-src 'self' 'unsafe-inline'` のため nonce 無しで enforce 可能 | open |
| #870 [AWSHH-FU-004] | apps/api header hardening | 独立 surface（`apps/api` は別 Workers）。本タスクとスコープ分離 | open |

---

## Step 2: 新規インターフェース判定

### 新規公開インターフェース

本タスクにより以下が新規公開インターフェースとなる。

| インターフェース | 種別 | 説明 |
|--------------|------|------|
| `getSecurityHeaderEnv()` | 関数（`apps/web/src/lib/env.ts` エクスポート） | CSP モードと API ベース URL を型安全に提供 |
| `CSP_MODE` | env var（Cloudflare Workers binding） | `"report-only"` または `"enforce"` を受け付ける wrangler vars |

### aiworkflow-requirements 側への反映判定

`getSecurityHeaderEnv` と `CSP_MODE` env var は新規公開インターフェースであるため、以下への反映が必要と判定する。

| 更新対象 | 内容 | タイミング |
|---------|------|---------|
| `.claude/skills/aiworkflow-requirements/references/security-web-response-headers.md` | `CSP_MODE` env var と `getSecurityHeaderEnv()` シグネチャを追記 | 反映済み |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | issue-869 workflow エントリ追加 | 反映済み |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | workflow inventory 行追加 | 反映済み |
| `.claude/skills/aiworkflow-requirements/references/workflow-issue-869-csp-enforce-cutover-artifact-inventory.md` | artifact inventory 追加 | 反映済み |

上記更新は実装完了と同じ cycle で同波 sync 済み。
