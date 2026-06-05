# Phase 10: 最終レビュー

> **[実装区分: 実装仕様書 / NON_VISUAL]**

## 1. 受入条件（AC）判定

本タスクは仕様書段階（implementation_mode: new・コード未実装）のため、各 AC は **`spec_created（no impl yet）`** で判定する。実装後は `runtime_pending`（user-gated 検証待ち）→ `completed` へ遷移する。

| AC | 内容 | 判定 | 根拠 |
| --- | --- | --- | --- |
| AC-1 | 設計 doc 3 本が primary 名へ一致 | spec_created（no impl yet） | 置換マップは Phase 2/3 で確定。phase-2-design / phase-3-design-review / implementation-guide の 3 本が対象。 |
| AC-2 | SSOT 表 + 値 parser 訂正注記を doc に記載 | spec_created（no impl yet） | `parseShellCollapsedCookie` は値 parser（ヘッダ全体ではない）と訂正。issue 前提誤りを恒久化注記。 |
| AC-3 | dead alias 3 件削除（削除前 grep 0 を再確認） | spec_created（no impl yet） | L4 `SHELL_COLLAPSE_COOKIE` / L34 `readCollapsedFromCookieString` / L35 `writeCollapsedCookie`、いずれも `apps/web/src` 0 参照。 |
| AC-4 | typecheck/lint/focused Vitest green・diff は 3 行削除のみ | spec_created（no impl yet） | consumer・test は全 primary 名使用 → test 変更不要。diff は alias 3 行削除に閉じる。 |
| AC-5 | cookie 名/value/属性無変更 | spec_created（no impl yet） | `ubm_shell_collapsed` / `true|false` / Path=/・SameSite=Lax・Max-Age=31536000 を無変更（不変条件 I-6）。 |

## 2. blocker 判定

**なし（no blocker）。** MAJOR 指摘ゼロ。alias 3 件は全 0 参照で削除安全、consumer/test 改変不要、cookie 契約不変。単一サイクル（CONST_007）で完結する。

## 3. NON_VISUAL 妥当性の最終確認

UI/UX の視覚的変更はゼロ。export 名の縮約と設計 doc 文字列整合のみで、sidebar の見た目・collapse 挙動・cookie 永続化は不変。よって本タスクは NON_VISUAL であり、スクリーンショット証跡は不要（代替証跡は Phase 11 manual-test-result.md を参照）。

## 10.4 MINOR 指摘候補（Phase 12 未タスク検出の入力）

以下は MINOR 候補として列挙する。**未タスク化すべきかの最終結論は Phase 12 に委譲**する。

| ID | 候補 | 既定方針 | Phase 12 への申し送り |
| --- | --- | --- | --- |
| MINOR-1 | issue-1024 配下の他 phase doc（phase-4/5/6/8/9 等）に dead alias 名（`SHELL_COLLAPSE_COOKIE` / `readCollapsedFromCookieString` / `writeCollapsedCookie`）が残存 | **SSOT 完遂レビューで本サイクル内に全整合**（更新）。当初は「履歴 doc として保全・不整合許容」としていたが、*phase-2-design は整合済なのに phase-5 は旧名のまま*という内部矛盾が SSOT 目的と衝突するため、user 決定（全整合）に基づき issue-1024 配下の旧名 doc を primary 名へ整合済み。 | Phase 12 で全整合を実施し、dead alias 名が残るのは「削除済みを説明する枠組み」のみであることを grep で確認済み。 |
| MINOR-2 | 他に sidebar collapse 関連で同種の命名 drift（doc↔code 名乖離）が無いか | **無し（既定）**。本タスクの対象は `shell-collapse-cookie.ts` の命名 SSOT に限定。 | Phase 12 で sidebar collapse 周辺（`useSidebarState.ts` / `SidebarShell.server.tsx`）に類似 drift が無いことを確認し、追加スコープが不要であることを確定する。 |

> MINOR-2 は対象外で確定。MINOR-1 は当初スコープ外だったが、SSOT 完遂レビュー（user 決定）で本サイクル内に全整合し in-cycle 解消した。formalize（未タスク化）は不要。

## 4. ゲート判定

**PASS — Phase 11（証跡）へ進む。** AC-1〜AC-5 は spec_created で整合、blocker なし、MINOR は Phase 12 委譲。NON_VISUAL の代替証跡方針（focused Vitest + typecheck + lint + grep）を Phase 11 で記録する。
