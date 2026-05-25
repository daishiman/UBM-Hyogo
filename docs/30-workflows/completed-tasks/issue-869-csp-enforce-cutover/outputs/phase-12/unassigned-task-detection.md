# Phase 12: 未タスク検出

## Current（本タスク完了後の状態）

本タスク（TASK-AWSHH-FU-001-CSP-ENFORCE-CUTOVER）のスコープ:

- `apps/web/src/lib/env.ts` への `CSP_MODE` enum + `getSecurityHeaderEnv()` 追加
- `apps/web/middleware.ts` の `getSecurityHeaderEnv()` 経由配線変更
- `apps/web/wrangler.toml` 各環境への `CSP_MODE` vars 追加
- `apps/web/src/lib/env.spec.ts` TC-01〜04 追加
- `apps/web/playwright/tests/security-headers.spec.ts` TC-07/08 追加
- Phase 11〜13 仕様書作成とローカル証跡更新（implemented_local_evidence_captured）

**未解決の未タスク: 0 件**（本スコープ内で検出されたものはなし）

---

## Baseline（参照元: apps-web-security-headers-hardening Phase 12 検出）

U-AWSHH-001〜004 のうち本タスクが対応するもの:

| ID | 内容 | 本タスクでの処理 |
|----|------|--------------|
| U-AWSHH-001 | CSP enforce 切替 | **本タスクがこれに対応**。implemented_local_evidence_captured として記録済み |
| U-AWSHH-002 | CSP nonce 化 | 本タスク外（独立 issue #871 で追跡） |
| U-AWSHH-003 | Reporting-Endpoints / Report-To 集約 | 本タスク外（独立 issue #868 で追跡） |
| U-AWSHH-004 | `apps/api` response header hardening | 本タスク外（独立 issue #870 で追跡） |

---

## 関連タスク差分確認

### issue #868 [AWSHH-FU-003]: CSP Reporting-Endpoints / report-to 集約

- **依存関係**: soft 依存。`enforce` は reporting endpoint が存在しなくても機能する
- **本 issue のブロッカーか**: **いいえ**。enforce 切替後に `report-to` ディレクティブを後から追加できる
- **スコープ重複**: なし。`report-to` ヘッダ・ディレクティブ追加は #868 スコープ。本タスクでは触れない
- **issue_status**: CLOSED（仕様書作成済み）

### issue #871 [AWSHH-FU-002]: CSP nonce 化

- **依存関係**: 独立。現 CSP は `script-src 'self' 'unsafe-inline'` であるため、nonce 無しで enforce を有効化できる
- **スコープ重複**: なし。nonce 化は template 変更を伴う大規模変更で本タスクとは別 wave
- **issue_status**: open

### issue #870 [AWSHH-FU-004]: apps/api header hardening

- **依存関係**: 独立 surface。`apps/api` は別 Cloudflare Workers であり本タスクの `apps/web` 変更と干渉しない
- **スコープ重複**: なし
- **issue_status**: open

---

## Production enforce 実切替の扱い

production の `CSP_MODE` を `"report-only"` → `"enforce"` に変更する操作は**コードを伴わない ops 設定変更**である。

| 項目 | 判定 | 理由 |
|------|------|------|
| 新規 issue 化の要否 | **不要** | `wrangler.toml` の 1 行変更 + `bash scripts/cf.sh deploy` のみ。手順は `implementation-guide.md` の「Production Cutover Ops Runbook」に runbook 化済み |
| PR 化の要否 | **要（軽量）** | `wrangler.toml` 変更は git 管理対象のため、変更は PR 経由が望ましい。ただし issue reopen は不要 |
| 実行タイミング | user-gated | staging enforce 確認後 + production report-only 観察（1〜2 週間）後にユーザーが判断する |
| 参照 | `outputs/phase-12/implementation-guide.md` §Production Cutover Ops Runbook | — |

ops 操作は runbook 化済みのため、別途未タスクとして issue を起票する必要はない。

---

## Formalized Follow-up Candidates（本タスク起因の新規検出）

| ID | 内容 | 理由 | 実施時期 / 場所 |
|----|------|------|--------------|
| なし | — | 本タスクスコープ内で実施可能な全項目を実コード・実設定・実テスト・正本 docs に反映済み。外部依存・別 surface は既存 issue (#868/870/871) で追跡 | — |
