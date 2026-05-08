# Lessons Learned — task-19 w2 09c primitives full spec（2026-05-07）

> task: `task-19-w2-primitives-full-spec`
> 関連 spec: `docs/00-getting-started-manual/specs/09c-primitives.md`
> 関連 source: `docs/00-getting-started-manual/claude-design-prototype/primitives.jsx`
> 関連 verify: `scripts/verify-09c-no-visual-values.sh`
> 関連 reference: `task-workflow-active.md`（task-19 行）, `indexes/quick-reference.md`（task-19 セクション）, `indexes/resource-map.md`（task-19 行）
> 関連 changelog: `changelog/20260507-task19-primitives-full-spec.md`

## 教訓一覧

### L-T19-001: placeholder token 検知漏れ — `token-sized` / `09b-token-value` / `token-mix` を deterministic grep で禁止する

- **背景**: 09c primitives.md の初稿は HEX / `oklch()` / `px` / `bg-[` の grep gate を通過したが、本文に `token-sized` / `09b-token-value` / `token-mix` といった「token 名らしき placeholder」がそのまま残っていた。Phase 12 監査で目視発見されるまで PASS をすり抜けた。
- **教訓**: 「visual value 不在」を保証する gate は HEX / 単位 / Tailwind arbitrary だけでは不十分で、**token 名 placeholder（unresolved alias / 仮置き token / 09b へ責務委譲のはずだった文字列）** も同じ deterministic grep に含める必要がある。`scripts/verify-09c-no-visual-values.sh` に placeholder pattern grep を必ず同梱する。
- **将来アクション**: 09c 系 / token-contract 系の docs-only タスクは **token placeholder grep（`token-sized`, `09b-token-value`, `token-mix` 等の不採用語彙リスト）** を verify script の必須 step として追加し、Phase 4 AC に「placeholder grep 0 件」を明記する。新規 placeholder 検出時は spec template の禁止語彙に追加する。

### L-T19-002: §99 必須項目 content check 不足 — 見出し PASS だけで本文不在を見逃す

- **背景**: 09c primitives.md §99（required exclusions）は見出しレベルの存在確認だけで PASS としていたが、本文に **TweaksPanel / `data-theme` switcher / `AvatarStoreProvider` の `localStorage` 言及**が欠落していた。Phase 12 で再確認するまで「heading exist = content exist」と誤判定した。
- **教訓**: required exclusion / forbidden item 系のセクションは「見出し存在」と「本文に必須キーワードが全件出現」の **2 段検証**が必要。grep gate は見出し anchor だけでなく、必須キーワード（例: `TweaksPanel`, `data-theme`, `localStorage`）の本文 occurrence を 1 件以上要求する。
- **将来アクション**: spec template の §99 / §AC 系セクションに **「heading 存在 + 必須キーワード occurrence ≥ 1」二重 grep** を verify script 雛形へ組み込む。Phase 4 AC で `verify §99 keywords` を独立項目として記録する。

### L-T19-003: docs-only タスクで隣接コード差分が混入する — branch hygiene を Phase 1 で固定する

- **背景**: task-19 は docs-only / NON_VISUAL のはずが、同一 worktree branch に `apps/api/src/repository/identity-conflict.ts` の dirty diff が未分類のまま残り、Phase 12 終盤で初めて検出された。task-19 evidence と無関係な変更がコミット候補に混在するリスクが顕在化した。
- **教訓**: docs-only タスクは Phase 1 開始時点で **`git status` を取得し、想定スコープ外の `apps/**` / `packages/**` diff は別タスク / 別 commit に分離するルール**を固定する。Phase 12 compliance check で `staged diff が docs/spec scope のみ` を AC として明記し、隣接 code diff は task-19 evidence から分離記録する。
- **将来アクション**: docs-only / NON_VISUAL タスクの Phase 12 compliance check 項目に **「staged path scope 検証（docs/spec/scripts/.claude のみ）」**を追加する。検出時は worktree を分けるか、別 PR として切り出す運用を `task-workflow-active.md` の docs-only 行に明文化する。

### L-T19-004: source 抽出と stale taxonomy drift — `primitives.jsx` の const 宣言と旧 alias の不一致

- **背景**: 09c primitives.md 初稿は旧プロトタイプ世代の `Card` / `Sidebar` / `Stat` alias 名で記述されていたが、現行 `primitives.jsx` は const-based taxonomy（新しい名前空間）に既に移行済みだった。alias 不一致のまま docs に固定すると、task-10 ui-primitives 実装時に名前解決が崩れる。
- **教訓**: prototype `*.jsx` を入力正本にする docs-only タスクは、**source の `export const` 宣言を一次抽出した上で、現行 const 名 ↔ docs 記述の差分を 1:1 で照合する Phase 2 サブタスク**を挟む必要がある。旧世代 alias は `legacy-ordinal-family-register.md` 系の retire register に分離し、09c 本文には残さない。
- **将来アクション**: prototype-derived spec の Phase 2 雛形に「**source const 抽出 → 現行 taxonomy 1:1 照合 → stale alias 撤去**」のサブタスクを追加する。verify script に `grep -E '^export const ' source.jsx` の hash と docs 記述の名前リストを cross-check する step を追加検討。

### L-T19-005: shallow grep PASS — verify script を Phase 1-4 段階で雛形配置する

- **背景**: `scripts/verify-09c-no-visual-values.sh` は Phase 11 evidence 取得時に後付けで作成された。Phase 1-4 の AC 設計時点には deterministic verify が存在せず、shallow grep の人手確認だけで PASS 判定するリスクを残していた。
- **教訓**: docs-only / contract 系タスクの verify script は **Phase 1（タスク定義）または Phase 4（AC 確定）の段階で雛形を repo に配置**し、Phase 5-10 の実装中に常時実行できる状態を作る。Phase 11 で初めて作るのは「evidence 取得のための実行」であって「設計」ではない。
- **将来アクション**: task-specification-creator skill の docs-only / contract task テンプレに **「Phase 1 or Phase 4 で `scripts/verify-<task>-*.sh` 雛形を配置する」**を必須項目として追加する。雛形には `set -euo pipefail` / grep gate / placeholder gate / §99 keyword gate / exit code を最低構成として明記。Phase 11 evidence 取得時はこの雛形をそのまま実行し log を保存する。

## 関連教訓

- L-08AB-008: workflow root path 移動と legacy register（path move 検知の運用）
- L-378-001..004: pause flag 三点セット設計と admin UI 後回しの分離（docs-only / implementation 境界の参考）
