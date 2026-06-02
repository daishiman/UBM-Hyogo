# unassigned-task-detection — issue-1024

> GitHub Issue #1024 は CLOSED のまま現行コードへ再スコープ（reopen しない）。NON_VISUAL / implemented_local_evidence_captured。
> 0 件でも必須出力。

## 1. current（本サイクルで新規に検出した未タスク）

本サイクル（cookie 永続化 + SSR seed + lint ハック撤廃）のスコープ内で検出した新規未タスクは、2回目独立検証で次の **2 件**に補正した。いずれも本タスク本体の完了条件を阻害しない follow-up であり、`docs/30-workflows/unassigned-task/` に仕様書化し、GitHub Issue 化済み。

| タスク | GitHub Issue | 判定 | 理由 |
|------|------|------|------|
| `issue-1024-followup-001-cookie-secure-attribute-production-hardening` | #1063 | **新規 follow-up** | localhost dev 阻害を避けるため本体では `Secure` を見送ったが、production HTTPS hardening として独立実行可能な改善。 |
| `issue-1024-followup-002-shell-collapse-cookie-doc-naming-drift-reconciliation` | #1065 | **新規 follow-up** | 設計 doc 記載 API と実装 primary export 名に drift があり、後続実装者の誤用リスクがある。 |

| 候補 | 判定 | 理由 |
|------|------|------|
| cookie に Secure 属性を付与（本番 HTTPS 限定） | **新規 follow-up 化済み** | localhost dev を阻害しないため本タスクでは付与しない方針を `implementation-guide.md` cookie 属性表に明記済。2回目独立検証で production hardening として仕様書化し、#1063 に起票済み。 |
| `shell-collapse-cookie.ts` の doc 記載 API と実装 primary export 名の整合 | **新規 follow-up 化済み** | 本体機能は PASS だが、`parseShellCollapsedCookie` と `readCollapsedFromCookieString` の入力契約差が doc から読み取りにくい。#1065 に起票済み。 |
| `readCollapsedFromDocument` の client fallback の使用箇所最小化 | **scope 内で解決** | SSR seed を正本とし client 再読込を最小限とする方針を guide に明記。残課題化しない。 |
| 他の UI 設定（density 等）の cookie 化 | **本タスク射程外・既存別タスク** | density は別 issue（#1007 系）で扱い済。本タスクの collapse 永続化とは独立。 |

## 2. baseline（着手前から存在した既知の未解決事項）

| 項目 | 状態 | 扱い |
|------|------|------|
| 現行 `"local" + "Storage"` lint 回避ハック | 本タスクで**解消対象** | AC-4 で撤廃。未タスク化しない（本タスクが解決する）。 |
| 初回 SSR ちらつき | 本タスクで**解消対象** | AC-2 で排除。未タスク化しない。 |

## 3. 関連タスク差分確認（重複チェック）

| 既存タスク | 重複有無 | 根拠 |
|------------|----------|------|
| GitHub Issue #1024（本タスク元） | 重複しない（本タスクが消化） | #1024 が要求する cookie 永続化 + SSR seed を本仕様書がそのまま実装範囲とする。CLOSED のまま再スコープ。 |
| 親 `unified-sidebar-shell-public-and-admin` | 重複しない | 親 Task A/E は shell primitive + drawer + md heuristic を提供。cookie 永続化 / SSR seed は未実装。本タスクは後方互換で追加。 |
| `admin-layout-sidebar-shell-migration`（起点 FU-ALSSM-001） | 重複しない | 起点は未タスクとして本件を検出した記録。実装は本 workflow が担う。 |
| #1007 系（density-toggle 等） | 重複しない | density UI 設定は独立。collapse cookie とは別 mechanism・別 key。 |

## 4. 説明責任（2件 follow-up 化の根拠）

cookie 永続化・SSR seed・lint ハック撤廃は相互依存する 1 つの mechanism 変更であり、新規 2 + 編集 5 ファイルで
**本サイクル内に完結**する。したがって Issue #1024 本体は completed-tasks 配置で妥当。

一方で、2回目独立検証により「本体完了を阻害しないが、将来の hardening / doc 整合として独立実行すべき項目」が 2 件あると判断した。これらは本体の PASS 判定を変えず、follow-up として仕様書化・Issue 化する。

- #1063: production HTTPS 限定 `Secure` 属性 hardening
- #1065: `shell-collapse-cookie.ts` API 命名 drift 整合
