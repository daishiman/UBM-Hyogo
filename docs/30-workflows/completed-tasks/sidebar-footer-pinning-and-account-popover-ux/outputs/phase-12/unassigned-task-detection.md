# unassigned-task-detection — sidebar-footer-pinning-and-account-popover-ux

> implemented_local_evidence_captured。実コードは本サイクルで実装済み。VISUAL / implementation。commit / PR / screenshot は user-gated。
> 0 件でも必須出力。

## 1. current（本サイクルで新規に検出した未タスク）

本サイクル（sidebar footer 固定 + collapse はみ出し + popover 外側クリック + main footer sticky の仕様書作成）のスコープ内で検出した **必須未タスクは 0 件**。本タスク本体（C1〜C4）は 1 実装サイクルで完結する設計であり、本体完了を阻害する未タスクは存在しない。

未タスク **候補**（本体完了を阻害しない follow-up）は次の 2 件。いずれも YAGNI / 本体 PASS 判定不変だが、**ユーザー承認のもと未タスク仕様書化 + GitHub Issue 起票（優先度 low）を実施済み**:

| 候補 | 出典 | 判定 | Issue / 仕様書 | 理由 |
|------|------|------|----------------|------|
| 外側クリック listener の汎用 hook 化（`useDismissable` 抽出） | Phase 3 MINOR **TECH-M-02** / Phase 10 引き継ぎ | **formalize 済み（着手は再利用需要顕在化トリガー）** | #1102 / `unassigned-task-specs/...-followup-001-usedismissable-hook-extraction.md` | C3 の `pointerdown` / `keydown` 外側クリック閉じロジックは本タスクでは `SidebarUserMenu` 内 `useEffect` に閉じる。同種 popover / dropdown の再利用需要が出た時点で `useDismissable(ref, onClose)` として抽出するのが妥当だが、現時点で再利用先は 1 箇所のみ → 早期抽象化は YAGNI。本体 AC-3 は内製 listener で充足。 |
| globals.css `[data-shell="sidebar"]` ほか重複 shell ブロックの 1 本化 | Phase 8 **Task 8-1** / Phase 10 引き継ぎ | **formalize 済み（同一 cascade 文脈確認を着手条件とする）** | #1103 / `unassigned-task-specs/...-followup-002-globals-css-sidebar-block-consolidation.md` | C1 で `[data-shell="sidebar"]`（globals.css 1417 行 / 1549 行）が 2 ブロック重複と判明。本体は両ブロックを同一値へ整合（drift 防止）までに留め、1 本化は responsive / theme 文脈の挙動変化リスクのため scope 外とした。**初版 detection では本候補が記録漏れ**しており、Phase 8 / Phase 10 の引き継ぎ指定（2 候補）と突合して補捉・追記した。 |

> 上記 2 候補は **本タスクの PASS 判定を変えない**。再利用需要 / cascade 文脈確認という着手条件が満たされた段階で独立タスクとして実装する。優先度はいずれも low。Issue 起票・仕様書化はユーザー承認後に実施した（実装・commit・PR は引き続き user-gated）。

## 2. baseline（着手前から存在した既知の未解決事項）

| 項目 | 状態 | 扱い |
|------|------|------|
| C1 下部ボタンが scroll しないと見えない（`min-height:100vh`）| 本タスクで**解消対象** | AC-1。未タスク化しない（本タスクが解決）。 |
| C2 collapse 時アイコンはみ出し | 本タスクで**解消対象** | AC-2。未タスク化しない。 |
| C3 popover 外側クリック非対応（`<details>` 標準仕様）| 本タスクで**解消対象** | AC-3。未タスク化しない。 |
| C4 main footer sticky 不成立 | 本タスクで**解消対象** | AC-4。未タスク化しない。 |
| TECH-M-01 badge collapsed ドットの件数 `sr-only` 保持 | 本タスク **Phase 5 で確定** | a11y。実装サイクルで解決（推奨: sr-only 件数保持）。未タスク化しない。 |
| TECH-M-03 `100dvh` 非対応 fallback | 本タスク **Phase 5 で対応済** | CSS 二重宣言（`100vh` fallback）。確認のみ。未タスク化しない。 |

## 3. 関連タスク差分確認（重複チェック）

| 既存タスク | 重複有無 | 根拠 |
|------------|----------|------|
| 親 `unified-sidebar-shell-public-and-admin` | 重複しない | 親は shell primitive を提供。footer 固定 / collapse はみ出し / popover 外側クリック / main footer sticky は実装済み。本タスクは後方互換で追加。 |
| `issue-1024-sidebar-collapse-cookie-persistence` | 重複しない | #1024 は collapse 状態の cookie 永続化 + SSR seed。本タスクの「collapse 時の見た目（はみ出し）」とは別 concern（永続化 vs レイアウト）。 |
| `issue-1016-sidebar-mobile-drawer-responsive` | 重複しない | mobile drawer の responsive。本タスクは md+ sidebar の高さ固定 + footer 領域。drawer 側は overflow-y-auto のまま無改修。 |
| `admin-sidebar-public-return-link`（#1021）| 重複しない | 「公開サイトに戻る」導線の追加。本タスクはその要素を **固定フッター領域へ移設**（位置の修正であり導線自体は既存）。 |
| `task-c-public-member-sidebar-shell-integration` | 重複しない | PublicFooter を shell 配下へ保持する layout 統合。本タスクは shell 配下のまま footer の `margin-top:auto` 化（sticky footer）に限定。`(public)/layout.spec` P-5 契約を壊さない。 |
| TECH-M-02（useDismissable 抽出）の既存 remediation task | なし | 既存に汎用 dismissable hook 抽出タスクは存在しない。再利用需要が出た段階で新規起票。 |

## 4. 説明責任（必須未タスク 0 件・候補 1 件の根拠）

C1〜C4 は同一 shell 内で閉じる相互独立な修正であり、編集 5 ソース + テスト 3（新規ソース 0）で **本サイクル内に完結**する。したがって本タスク本体は 1 実装サイクルで完了し、本体完了を阻害する未タスクは検出されなかった（必須 0 件）。

唯一の候補 TECH-M-02（`useDismissable` 抽出）は、現時点で再利用先が 1 箇所のみのため早期抽象化を避け、本タスク内では `SidebarUserMenu` ローカル実装に閉じる。再利用需要発生時に独立タスク化する方針を記録する（本体 PASS 判定不変）。
