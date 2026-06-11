`[実装区分: 実装仕様書]`

# Skill Feedback Report — admin-requests-queue-rename-and-publish-dependency

`taskType: implementation` / `visualEvidence: VISUAL` / `workflow_state: implemented_local_evidence_captured`

> 正本は [_shared-context.md](../../_shared-context.md)。本タスクで得た知見を `task-specification-creator` / ワークフロー / ドキュメントの各観点でフィードバックする。改善提案なしの章も明示する（章立て固定）。

---

## テンプレ改善

| # | 知見 / 提案 | 判定 |
| --- | --- | --- |
| T-1 | **表示テキスト限定リネームの内部識別子不変パターン**: 「依頼キュー」→「会員からの申請」のような表示名変更で、ルート / API パス / コンポーネントファイル名 / `id` / `data-*` / テストセレクタ / import 名を不変に保つ「人間可読テキスト + aria-label のみ変更」パターンは、リグレッション（CSS / Playwright / テストセレクタ破壊）を避ける定型として有効。命名マップ表に「Before/After（表示文言）」列を持たせ「内部識別子は不変」を冒頭注記する書式が再利用価値高い。テンプレへの恒久追加までは不要（命名マップは task 個別）。 | `no-op`（task 個別で十分） |
| T-2 | implemented_local_evidence_captured × VISUAL の screenshot 扱い: Phase 11 evidence inventory の Status を `present`/`pending`/`n/a` の 3 語厳密にし、authenticated runtime screenshot だけを user-gated `pending` として表現する書式は、local implementation evidence と外部 runtime boundary を混同しないため有効。テンプレ恒久変更は不要。 | `no-op` |

## ワークフロー改善

| # | 知見 / 提案 | 判定 |
| --- | --- | --- |
| W-1 | **会員一覧への相関サブクエリで pending 申請を可視化し依存関係を交差表示する設計**: 2 つの独立した管理経路（会員本人発の承認フロー vs 管理者起点の即時トグル）が「冗長に見える」問題に対し、片方の状態（pending 申請の有無）をもう片方の一覧（会員管理）にバッジとして相関サブクエリで載せ、相互リンクで往復させる設計は、機能を削除せず「2 軸の独立と依存を 1 画面で説明する」汎用パターン。同種の「冗長に見えるが起点が違う 2 画面」課題に再利用できる。 | 知見記録（横展開候補） |
| W-2 | **新 endpoint を増やさず既存 list projection を相関サブクエリで拡張**する手法は、API surface 不変条件を守りつつ UI に新情報を載せる定石。`tags_json` と同型で 1 本追加するだけで済むため低コスト・低リグレッション。 | 知見記録 |

## ドキュメント改善

| # | 知見 / 提案 | 判定 |
| --- | --- | --- |
| D-1 | **web 側 zod 再宣言なしで shared 直 import のため型自動伝播**: `AdminMemberListViewZ` を web が shared から直 import している場合、shared 側にフィールドを足すだけで web 型が自動伝播し、web 側 zod の二重宣言を避けられる。逆に web が再宣言している場合は両側同期が必要。implementation-guide で「直 import なら web zod 編集不要 / 再宣言なら同期」と条件分岐を明記したのは後続実装者の手戻り防止に有効。schema の所在（shared か apps/api か）と web の参照形態を rg で特定する手順をガイドに残すと再現性が高い。 | 知見記録（ガイドに反映済み） |
| D-2 | system spec の「機能定義は不変・表示名注記のみ更新」という差分の切り分け（Step 1-A/B/C）を summary に明記し、コードと spec の drift を同 wave で防ぐ運用は有効。 | `no-op`（既存運用で十分） |

---

## 総括

本タスクは新規 primitive / endpoint / D1 schema を生やさず、表示層リネーム + projection 拡張 + seed 追加で完結する低リスク構成。テンプレ / ワークフローへの恒久変更提案は **なし**（既存 strict 7 / state vocabulary / implemented_local_evidence_captured 判定でカバー済み）。W-1（依存可視化の交差表示）・D-1（shared 直 import の型自動伝播）は横展開価値のある知見として記録する。
