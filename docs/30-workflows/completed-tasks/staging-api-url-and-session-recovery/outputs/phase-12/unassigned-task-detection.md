# Phase 12: 未タスク検出（unassigned-task-detection）

> workflow: `staging-api-url-and-session-recovery` / implemented_local_evidence_captured。
> current（本サイクルで処理すべきだが範囲外に出た作業）と baseline（既知の将来候補・本タスク起因ではない）を分離して記録する。
> 0 件でも出力必須。

## 判定サマリ

| 区分 | 件数 | 結論 |
|------|------|------|
| current（本サイクル由来・即対応すべき未分離タスク） | **0 件** | 3 lane すべて 1 実装サイクル / 1 PR（CONST_007）で完結する粒度。先送り・別 PR・バックログ送りは発生しない |
| baseline（将来候補・本タスク起因ではない既知の保留事項） | **2 件** | いずれも本タスクの DoD 外で、後方互換維持 / アプリ外という明確な根拠で本サイクルから分離。Issue 起票は実装着地後の判断 |

## current（本サイクル）: 0 件

Phase 1-3 / 3 lane task spec の AC（AC-1..AC-8）はすべて Lane A / B / C のいずれかに割当済で、責務境界が交差しない。
本 wave で「割当先が無い・本サイクルでやるべきなのに lane に入っていない」作業は検出されなかった。

根拠:
- Lane A = server-side fetch 全経路（authed / me / admin / magic-link / verify / gate-state / verify-magic-link）を網羅（task-a §1 の 12 ファイル）。
- Lane B = client base URL 統一 + localhost 焼き込み根絶（task-b §3-1 の 6 ファイル）。
- Lane C = AUTH_SECRET parity 診断・投入 / grep gate / staging smoke（task-c §1 の 6 ファイル）。
- AC-1..AC-8（phase-1.md §受入条件）はすべて上記 3 lane に対応づけ済み。

## baseline（将来候補）: 2 件

### B-1: `PUBLIC_API_BASE_URL` env schema の完全削除

| 項目 | 内容 |
|------|------|
| 内容 | `PUBLIC_API_BASE_URL`（非 `NEXT_PUBLIC_` 接頭辞）を env schema / `wrangler.toml` / `getPublicFetchEnv` から完全削除する |
| 本サイクルで扱わない根拠 | phase-3.md の設計決定どおり、即削除は consumer 全走査が必要で drift リスクが高い。本サイクルは「参照を `NEXT_PUBLIC_API_BASE_URL` 優先へ」+「後方互換で残置」に留める（task-b §4-4）。削除は別途・低リスク化してから |
| 区分 | 将来候補（baseline）。本タスクの AC には含まれない |
| 起票 | 実装着地後に必要性を再評価して判断（spec 段階では起票しない） |

### B-2: ブラウザ拡張由来 `127.0.0.1:8888`（S1）への対応

| 項目 | 内容 |
|------|------|
| 内容 | console の `POST http://127.0.0.1:8888/ ERR_CONNECTION_REFUSED` / `Sentry.init() in a browser extension` 警告 |
| 本サイクルで扱わない根拠 | `content.js` はブラウザ拡張の content script 命名規約で当リポジトリに存在しない。Sentry 警告も拡張コンテキスト由来。**アプリのコード / ビルドではない**（phase-1.md §S1 非該当根拠）。アプリ側で修正できる対象ではない |
| 区分 | アプリ外（baseline・対応不能/対象外） |
| 起票 | しない（アプリの責務外）。ユーザーの「localhost が見える」懸念には Lane B 焼き込み根絶 + Lane C grep gate（`:8888` も検出対象に含む）で間接的に応える |

## 関連タスク差分確認（重複チェック）

| 既存タスク | 本 workflow との差分 | 重複 |
|-----------|---------------------|------|
| `task-05a-fetchpublic-service-binding-001` | public.ts のみ binding 化済。本 workflow は authed / proxy / auth route を補完 | **なし**（補完関係） |
| `profile-reload-session-404-fix`（#1113） | trailing-slash / 再ログイン CTA を導入済。loopback 404 / localhost fallback は未解決で本 workflow が完結 | **なし**（残課題完結） |
| `task-staging-auth-secret-binding-recovery-001` | lessons（L-AUTHSECRET-001..003）の継承元 | **なし**（参照のみ） |
| task-18 grep gate | `:8888` 想定の gate（専用 script 不在を確認）→ `:8787`/`localhost` へ拡張 | **なし**（gate 新設で拡張） |

## 結論

- current 0 件: 3 lane が 1 サイクルで完結する粒度であり、本サイクルから漏れた即対応タスクはない（CONST_007 遵守）。
- baseline 2 件（B-1 後方互換削除 / B-2 アプリ外拡張）はいずれも明確な根拠で本サイクルから分離。Issue 起票は実装着地後（close-out）の判断とし、spec 段階では起票しない。
