# issue-1065 shell-collapse-cookie 設計doc↔実装の命名ドリフト整合

> **[実装区分: 実装仕様書]** — issue 既定ラベルは docs-only だが、root cause（SSOT 違反 = dead alias 残存）の根本解決にコード変更（dead alias 3 件削除）が必要なため、CONST_004 に従い実装仕様書として作成（ラベルより実態優先）。

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | issue-1065-shell-collapse-cookie-doc-naming-drift-reconciliation |
| タスク名 | `shell-collapse-cookie.ts` の設計doc記載名と実装 export 名のドリフトを SSOT 確立で整合 |
| 分類 | API 命名ポリシー / SSOT 確立（実装 + ドキュメント整合） |
| 対象 | `apps/web/src/components/shell/shell-collapse-cookie.ts` + issue-1024 doc 群（当初は設計 doc 中心 → SSOT 完遂レビューで配下 doc 全体へ拡張） |
| 優先度 | 低 |
| 見積もり規模 | 小規模（単一ファイルの export 3 行削除 + issue-1024 doc 群の primary 名整合） |
| ステータス | spec_created（実装/commit/PR は user-gated） |
| 実装区分 | 実装仕様書（NON_VISUAL） |
| implementation_mode | new |
| visualEvidence | NON_VISUAL |
| GitHub Issue | [#1065](https://github.com/daishiman/UBM-Hyogo/issues/1065)（**CLOSED のまま**・reopen しない） |
| 発見元 | issue-1024 2回目独立検証 → 本セッションで現行コードへ再スコープ |

## 実装区分の判定根拠（CONST_004）

| 観点 | 判断 |
| --- | --- |
| issue 既定ラベル | docs-only（`area:docs` + 「既定 docs-only」明記） |
| ユーザー指示 | 「根本的な問題を解決すること」を明示 |
| root cause | 命名 SSOT 違反。doc 側を実装名へ寄せるだけでは **dead alias が残存し SSOT 違反が解消しない** |
| dead alias の実態 | `SHELL_COLLAPSE_COOKIE` / `readCollapsedFromCookieString` / `writeCollapsedCookie` の 3 件が `apps/web/src` 内で **0 参照**（grep 確認済み） |
| 結論 | **実装仕様書**。dead alias 3 件を削除して SSOT を 1 系統に確定 + issue-1024 doc 群を primary 名へ整合（SSOT 完遂レビューで配下 doc 全体へ拡張）（AskUserQuestion: code-primary 正本化 + 実装仕様書 を両方推奨選択） |

## issue 前提の訂正（現行コードへの最適化）

issue / 元 unassigned-task は次を前提とするが、**現行コードでは誤り**:

| issue の記述 | 現行コード（L7-11, L34） |
| --- | --- |
| `parseShellCollapsedCookie(rawCookieHeader)` = cookie ヘッダ全体を受け取る | `parseShellCollapsedCookie(value)` = **cookie 値のみ** を受け取る value parser |
| `readCollapsedFromCookieString(value)` は別契約の関数 | `readCollapsedFromCookieString = parseShellCollapsedCookie`（**同一関数の直接 alias**） |
| `readShellCollapsedFromDocument()` が primary | その名前は存在しない。primary は `readCollapsedFromDocument()`（doc 名と一致・drift 無） |

→ 「ヘッダ vs 値の契約差」は現行コードに存在しない。SSOT 表ではこの誤解を解き、`parseShellCollapsedCookie(value)` を唯一の value parser とし、`readCollapsedFromDocument()` が `document.cookie` を split して matched value を `parseShellCollapsedCookie` に渡す、という関係を明記する。

## 正本（SSOT）確定マップ

| 概念 | 正本（keep） | 削除する dead alias | apps/web/src 参照 |
| --- | --- | --- | --- |
| cookie 名定数 | `SHELL_COLLAPSE_COOKIE_NAME` | `SHELL_COLLAPSE_COOKIE` | alias 0 / primary 使用中 |
| 値パーサ | `parseShellCollapsedCookie(value)` | `readCollapsedFromCookieString` | alias 0 / primary 使用中 |
| serialize | `serializeShellCollapsedCookie(collapsed)` | （doc 未記載 → doc に追記） | primary 使用中 |
| client write | `writeShellCollapsedCookie(collapsed)` | `writeCollapsedCookie` | alias 0 / primary 使用中 |
| client read | `readCollapsedFromDocument()` | （drift 無・名前一致） | primary 使用中 |

## Phase 一覧

| Phase | 名称 | 成果物 | ステータス |
| --- | --- | --- | --- |
| 1 | 要件定義 | [phase-1-requirements.md](phase-1-requirements.md) | completed |
| 2 | 設計 | [phase-2-design.md](phase-2-design.md) | completed |
| 3 | 設計レビュー | [phase-3-design-review.md](phase-3-design-review.md) | completed |
| 4 | テスト作成 | [phase-4-test-plan.md](phase-4-test-plan.md) | completed |
| 5 | 実装 | [phase-5-implementation.md](phase-5-implementation.md) | completed |
| 6 | テスト拡充 | [phase-6-test-additions.md](phase-6-test-additions.md) | completed |
| 7 | カバレッジ確認 | [phase-7-coverage.md](phase-7-coverage.md) | completed |
| 8 | リファクタリング | [phase-8-refactor.md](phase-8-refactor.md) | completed |
| 9 | 品質保証 | [phase-9-qa.md](phase-9-qa.md) | completed |
| 10 | 最終レビュー | [phase-10-final-review.md](phase-10-final-review.md) | completed |
| 11 | 手動テスト | [outputs/phase-11/manual-test-result.md](outputs/phase-11/manual-test-result.md) | completed |
| 12 | ドキュメント更新 | [outputs/phase-12/implementation-guide.md](outputs/phase-12/implementation-guide.md) | completed |
| 13 | PR作成 | [phase-13-pr.md](phase-13-pr.md) | blocked（user-gated） |

## スコープ

### 含む（実装仕様書）

- `shell-collapse-cookie.ts` の dead alias 3 行（`SHELL_COLLAPSE_COOKIE` / `readCollapsedFromCookieString` / `writeCollapsedCookie`）を削除。
- 設計 doc（phase-2-design.md / outputs/phase-12/implementation-guide.md。phase-3-design-review.md は元から該当名なしで整合不要）の API 名・コードブロック・API 表を primary 名へ整合。
- implementation-guide に「SSOT 正本 API」表 + issue 前提誤りの訂正注記を追加。
- **SSOT 完遂レビュー（user 決定・後追い拡張）**: issue-1024 配下の他 phase doc（phase-4/5/6/7/8/9/13 + outputs/phase-12 系）も primary 名へ全整合。dead alias 名が残るのは「削除済みを説明する枠組み」（implementation-guide の SSOT 節・detection doc・本 workflow の spec 群）のみとし、`apps/`・`packages/`・`specs/`・issue-1024 doc 全体で dead alias を 0 化した。
- 元 unassigned-task を consumed に更新する記録（Phase 12）。

### 含まない

- cookie 名 / value / 属性 / Max-Age / SameSite の変更（issue-1024 不変条件 I-6 維持）。
- 永続化 / SSR seed / hydration 挙動の変更。
- API endpoint / D1 / Google Form 仕様変更。
- consumer（SidebarShell.server.tsx / useSidebarState.ts）の import 変更（既に primary 名のため不要）。

## 不変条件

1. cookie 名 `ubm_shell_collapsed` / value `"true"|"false"` / `Path=/; Max-Age=31536000; SameSite=Lax` は無変更（I-6）。
2. 削除する alias は **削除前に再度 grep で 0 参照を確認**してから削除する（AC-3）。
3. focused Vitest（`shell-collapse-cookie.spec.ts`）の import は primary 名のみ → テスト変更不要。万一 alias を参照していたら同 wave で primary へ寄せる。
4. D1 直接アクセス禁止・既存 API surface のみ（CLAUDE.md UI prototype alignment 不変条件）。
