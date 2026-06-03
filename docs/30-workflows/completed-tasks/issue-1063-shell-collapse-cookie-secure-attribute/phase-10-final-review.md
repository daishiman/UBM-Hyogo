# Phase 10: 最終レビュー

> issue-1063 — shell collapse cookie に production 限定で `Secure` 属性を付与

## メタ情報

| 項目 | 内容 |
|------|------|
| Phase | 10（最終レビュー / DoD） |
| task_id | issue-1063-shell-collapse-cookie-secure-attribute |
| 判定 | local focused evidence captured / blocker なし（最小差分・後方互換 security hardening） |
| MINOR 引き継ぎ | M-1 / M-2 は本タスク外の将来候補として記録のみ（未タスク新規発行なし） |

## 目的

Phase 1〜9 の成果を統合し、Definition of Done（DoD）を充足判定する。AC-1〜AC-7 のうち local focused evidence で検証可能な項目は focused Vitest 10 tests PASS、typecheck PASS、lint PASS、shell suite 11 tests PASS、grep gate PASS で確認済み。build / external DevTools smoke は Phase 11/13 の user-gated または auth 状態依存 gate として記録し、blocker 不在を確定する。

## 実行タスク

### 10.1 Definition of Done（DoD）

| DoD 項目 | 充足基準 | 検証元 Phase |
|----------|---------|-------------|
| DoD-1 | focused Vitest が TC-1〜TC-6 + 既存 4 ケースで全 pass（10 件 green） | Phase 6 / Phase 9 §9.1-3 |
| DoD-2 | `grep process.env` / `grep localStorage\|sessionStorage` が `apps/web/src/components/shell/` で 0 件 | Phase 9 §9.1-5,6 |
| DoD-3 | CSS / token / D1 / `HttpOnly` 不変（差分なし） | Phase 9 §9.3 |
| DoD-4 | `pnpm typecheck` green（`secure` 第2引数 / `location.protocol` 型整合） | Phase 13 local-check に実走 PASS を記録 |
| DoD-5 | `pnpm lint` green（lint-boundaries 含む） | Phase 13 local-check に実走 PASS を記録 |
| DoD-6 | `pnpm build`（OpenNext Workers 互換 build）target green | Phase 13 local-check に実走 PASS を記録 |
| DoD-7 | 既存 shell suite（`useSidebarState.spec.tsx` / `SidebarShell.server.spec.tsx`）回帰なし | Phase 9 §9.4（実走は Phase 13 local-check に記録） |

### 10.2 受入条件（AC-1〜AC-7）充足マトリクス

| AC | 内容 | 充足手段 | 充足 |
|----|------|---------|------|
| AC-1 | secure=true で `; Secure` 付与 | TC-1 / TC-5（`endsWith("; Secure")`） | ✓ |
| AC-2 | dev（secure=false）で `Secure` 無し・既存属性回帰なし | TC-2 / TC-3 | ✓ |
| AC-3 | 環境判定は client runtime・`process.env` 増やさない | `isSecureRuntimeContext()` + grep 0 件（Phase 9 §9.1-4） | ✓ |
| AC-4 | cookie 名/value/属性 同一・HttpOnly なし | TC-3 / TC-5 + `grep HttpOnly` 0 件（Phase 9 §9.3） | ✓ |
| AC-5 | parser 無改修・SSR seed / hydration 回帰なし | I-5 維持 + Phase 9 §9.4 回帰確認 | ✓ |
| AC-6 | focused Vitest green | Phase 9 §9.1-3 | ✓ |
| AC-7 | typecheck / lint green・OKLch 不変・D1 直接アクセスなし | Phase 9 §9.1-1,2 / §9.3 | ✓ |

### 10.3 不変条件（I-1〜I-6）最終確認

| 不変条件 | 確認 |
|----------|------|
| I-1 cookie I/O を 1 module 集約 | `Secure` 分岐は `shell-collapse-cookie.ts` serializer 内に閉じ込め、呼出側無改修 |
| I-2 cookie 名/value/Path/Max-Age/SameSite 不変 | TC-3 / TC-5 で `ubm_shell_collapsed` / `Path=/` / `Max-Age=31536000` / `SameSite=Lax` 検証 |
| I-3 HttpOnly 非付与 | serializer 戻り値に `HttpOnly` を含めない（grep 0 件） |
| I-4 `process.env` 焼き込みなし・`browserDocument()` 経由 | `isSecureRuntimeContext()` は `browserDocument()?.location.protocol` のみ参照 |
| I-5 parser 無改修 | `parseShellCollapsedCookie` / `readCollapsedFromDocument` 差分なし |
| I-6 API / D1 / Form / token 不変 | endpoint / schema / CSS 無変更 |

### 10.4 MINOR 指摘（Phase 12 非タスク観察）

| ID | 指摘 | 内容 | 引き継ぎ先 |
|----|------|------|-----------|
| M-1 | 汎用 `browserLocation()` accessor の横展開 | 本タスクは `browserDocument()?.location` で完結した。現時点で他 protocol / host 参照の同時修正対象は無いため、新規未タスクは発行しない | 記録のみ |
| M-2 | 他 cookie の `Secure` 標準化 doc | UI 設定 cookie が将来増えた場合の標準化候補。本タスクの collapse 1 cookie には不要で、現時点の漏れではない | 記録のみ |

> M-1 / M-2 はいずれも本タスクの単一責務（collapse cookie の `Secure` 環境分岐）から外れ、現時点では対象が単一または不在の観察事項である。今回の 4 条件を FAIL にする残課題ではなく、CONST_008 に基づく未タスク化対象でもないため、新規発行は行わない。

### 10.5 blocker 判定

| 観点 | 判定 |
|------|------|
| 仕様不明点 | なし（AC-1〜AC-7 / TC-1〜TC-6 が確定） |
| 後方互換リスク | なし（既定 secure=false で dev 文字列を維持・既存テスト無改修） |
| セキュリティ退行 | なし（`Secure` 付与は送信制御の強化・read 経路不変） |
| 結論 | **blocker なし**。Phase 5 / Phase 6 はローカル実装へ反映済み。commit / push / PR / staging DevTools smoke のみ user-gated |

## 参照資料

| 参照資料 | パス | 内容 |
|----------|------|------|
| Phase 1 要件 | `phase-1-requirements.md` | AC-1〜AC-7 / スコープ外（M-1 根拠） |
| Phase 9 QA | `phase-9-qa.md` | gate 合否基準 / 回帰確認 |
| index 不変条件 | `index.md` | I-1〜I-6 |

## 統合テスト連携

統合テストは適用外（`Secure` は read 値に現れない）。最終レビューでは Phase 9 の focused Vitest + shell suite 回帰確認を DoD-4 / DoD-6 の根拠とする。`Secure` フラグの目視確認（https staging の DevTools Application → Cookies）は Phase 11 の代替証跡として残す。

## 成果物

- 本ファイル（`phase-10-final-review.md`）に DoD、AC 充足マトリクス、不変条件確認、MINOR 指摘（M-1 / M-2）、blocker なし判定を確定する。

## 完了条件

- DoD-1〜DoD-7 が充足基準付きで確定し、AC-1〜AC-7 が全 ✓ で追跡されている。
- MINOR 指摘 M-1 / M-2 が記録のみで、今回サイクルの未完了タスクではないことが明記されている。
- blocker なし判定が根拠付きで記録されている。
