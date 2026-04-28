# Phase 1 成果物 — 要件定義 main.md

タスク: skill-ledger-a3-progressive-disclosure
Phase: 1 / 13（要件定義）
作成日: 2026-04-28
状態: spec_created（docs-only / NON_VISUAL）

本書は `phase-01.md` 仕様に基づき、200 行超 `.claude/skills/*/SKILL.md` を Progressive Disclosure 方式で分割するための要件を確定する。`.claude/skills/` 配下のファイルは本 Phase では一切変更しない。

---

## 1. 真の論点 (true issue)

- 本タスクの本質は「単一 SKILL.md にサイズ制約（200 行未満）を入れる」ことではなく、**skill loader が必要とする entrypoint 情報（front matter / Anchors / trigger / allowed-tools / 最小 workflow）と、詳細仕様（Phase テンプレ / アセット規約 / 品質ゲート / オーケストレーション）の責務境界を Progressive Disclosure で構造的に固定し、worktree 並列編集時の merge conflict を消す**こと。
- ドッグフーディング論点: `task-specification-creator/SKILL.md` 自身が 517 行と最大級の肥大化状態にあり、「200 行未満を推奨」と書く skill が自身の規約を破る矛盾を最優先で解消する。これを解消しない限り、本 skill が他 skill に課す制約は説得力を持たない。
- 副次論点: canonical (`.claude/skills/...`) と mirror (`.agents/skills/...`) の差分 0 を維持しつつ分割を遂行する同期規律。1 PR = 1 skill の粒度が崩れると、A-2 / A-1 の効果が SKILL.md 衝突によって相殺される。

---

## 2. 4条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | worktree 並列編集時の SKILL.md merge conflict を構造的に消し、ドッグフーディング矛盾（task-specification-creator/SKILL.md が 517 行）を解消する。loader の context 消費削減という副次効果もある |
| 実現性 | PASS | 対象は `.claude/skills/*/SKILL.md` のみで、技術的には Markdown の cut & paste と相対リンク張り替え。A-1 / A-2 完了済みで前提が揃い、`aiworkflow-requirements/SKILL.md`（190 行）という分割済み参考例も存在する |
| 整合性 | PASS | プロジェクト不変条件 #1〜#7（Form schema / consent key / responseEmail / admin-managed data / D1 access / GAS prototype / 再回答）には touch しない。skill-ledger 内不変条件（canonical/mirror 差分 0、機械的 cut & paste のみ、1 PR = 1 skill）はすべて遵守可能 |
| 運用性 | PASS | 行数検査（`wc -l`）/ リンク健全性検査（`rg`）/ canonical-mirror diff（`diff -r`）の 3 点で自動検証可能。Phase 5 / 11 の検証ログを evidence として残せる。ロールバックは `references/` 分割 PR の revert で 1 コミット粒度に戻る |

総合判定: **全観点 PASS**。MAJOR / MINOR ともに残存しない。

---

## 3. 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流 | task-skill-ledger-a1-gitignore（Issue #129） | skill-state 系記録ファイルの gitignore 化により、SKILL.md 周辺の並列編集の衝突源が縮小済み | 本タスクは gitignore 規約を再設計しない |
| 上流 | task-skill-ledger-a2-fragment（Issue #130） | render script と fragment 規約（changelog / LOGS のフラグメント化）が確立済み | 本タスクは fragment 規約に乗って references 化を行うだけで、規約自体は変更しない |
| 並列 | 他 skill 改修タスク全般 | A-3 着手中は対象 SKILL.md を単独 PR で占有することが合意済み | 1 PR = 1 skill の影響範囲を局所化し、対象 skill を一時的に編集禁止と announce |
| 下流 | task-skill-ledger-b1-gitattributes | A-3 完了後に `references/<topic>.md` を含む rename 検出規約として gitattributes を追加 | 200 行未満の entry と references レイアウトを B-1 ターゲットとして引き渡す |
| 下流 | skill-creator スキル本体テンプレ更新（別タスク化） | 「SKILL.md は 200 行未満」をテンプレ必須項目とする改訂 | 本タスクで確定した固定 10 要素テンプレを引き渡す |

---

## 4. 受入条件 (AC) — index.md と完全同期

- AC-1: 対象 `.claude/skills/*/SKILL.md` がすべて 200 行未満になっている
- AC-2: 詳細トピックが `references/<topic>.md` に単一責務で命名・配置されている
- AC-3: entry に front matter / 概要 / trigger / allowed-tools / Anchors / クイックスタート / モード一覧 / agent 導線 / references リンク表 / 最小 workflow が保持されている
- AC-4: SKILL.md → references の参照は片方向で、references 同士に循環参照がない
- AC-5: canonical (`.claude/skills/...`) と mirror (`.agents/skills/...`) の差分が 0（`diff -r`）
- AC-6: 行数検査スクリプトで全対象 SKILL.md が `OK`（200 行未満）
- AC-7: `rg` によるリンク健全性検査でリンク切れ 0 件
- AC-8: 未参照 reference 0 件
- AC-9: `task-specification-creator/SKILL.md` が最優先・単独 PR で 200 行未満化されている
- AC-10: skill 改修ガイドに「fragment で書け」「200 行を超えたら分割」Anchor が追記されている
- AC-11: 4条件（価値性 / 実現性 / 整合性 / 運用性）の最終判定が PASS

---

## 5. 苦戦箇所と AC / 多角的チェック対応

| # | 苦戦箇所 | 対応する AC / チェック観点 |
| --- | --- | --- |
| 1 | 既存リンクが SKILL.md 内部アンカーを大量に指し、分割で参照切れが発生しやすい | AC-7（リンク健全性 0）／ 多角的チェック「参照切れ検出」 |
| 2 | entry / references の責務境界判断が skill ごとに揺れる | AC-3（entry 固定 10 要素保持）／ Phase 2 の固定セット明文化 |
| 3 | 並列で同一 SKILL.md を編集する他タスクとの衝突 | 依存境界「並列」／ 多角的チェック「1 PR = 1 skill 厳守」 |
| 4 | ドッグフーディング矛盾（task-specification-creator/SKILL.md = 517 行） | AC-9（最優先・単独 PR）／ AC-10（Anchor 追記） |
| 5 | canonical / mirror 同期漏れ | AC-5（`diff -r` = 0）／ Phase 5 検証ログ |
| 6 | 意味的書き換えがメカニカル分割に混入 | 多角的チェック「cut & paste のみ」／ skill-ledger 内不変条件 |

---

## 6. ドッグフーディング論点の最優先化

- AC-9 / AC-10 は Phase 2 split-design.md の先頭ブロックで `task-specification-creator` を「highest / 単独 PR」として固定する。
- skill-creator スキル本体テンプレに「200 行未満」を組み込む改訂は本タスクスコープ外とし、Phase 12 `unassigned-task-detection.md` 候補として記録する。

---

## 7. プロジェクト不変条件への touch 確認

| # | 不変条件 | 本タスクでの扱い |
| --- | --- | --- |
| 1 | 実フォーム schema をコードに固定しすぎない | touch しない（skill 構造のみ） |
| 2 | consent キーは `publicConsent` / `rulesConsent` に統一 | touch しない |
| 3 | `responseEmail` は system field | touch しない |
| 4 | Google Form schema 外は admin-managed data として分離 | touch しない |
| 5 | D1 直接アクセスは `apps/api` に閉じる | touch しない |
| 6 | GAS prototype は本番仕様に昇格させない | touch しない |
| 7 | MVP では Google Form 再回答が本人更新の正式経路 | touch しない |

skill-ledger 内不変条件:
- canonical = `.claude/skills/...` / mirror = `.agents/skills/...` の二重管理（差分 0）を維持
- 分割は機械的 cut & paste のみ（意味的書き換え禁止）
- 1 PR = 1 skill 分割（影響範囲の局所化）

---

## 8. 完了条件チェック

- [x] 真の論点が「200 行制約導入」ではなく「Progressive Disclosure による責務境界の構造的固定」に再定義されている
- [x] 4条件評価が全 PASS で確定し、根拠が記載されている
- [x] 依存境界表に上流 2・並列 1・下流 2 すべてが「受け取る前提」「渡す出力」付きで記述されている
- [x] AC-1〜AC-11 が index.md と完全一致している
- [x] 苦戦箇所 6 件すべてが AC または多角的チェック観点に対応付けられている
- [x] ドッグフーディング論点（task-specification-creator/SKILL.md）が AC-9 / AC-10 として最優先で固定されている
- [x] プロジェクト不変条件 #1〜#7 のいずれにも touch しない範囲で要件が定義されている

---

## 9. 次 Phase への引き渡し

- 真の論点 = Progressive Disclosure による責務境界の構造的固定（base case = 案 C）
- entry 残置の固定 10 要素テンプレを Phase 2 で表化する
- 棚卸しコマンド: `for f in .claude/skills/*/SKILL.md; do printf '%5d  %s\n' "$(wc -l < "$f")" "$f"; done | sort -nr`
- `task-specification-creator/SKILL.md`（517 行）を Phase 2 split-design.md の先頭ブロックに最優先・単独 PR で固定
- topic 命名は単一責務原則（例: `phase-templates.md` / `asset-conventions.md` / `quality-gates.md` / `orchestration.md` / `mode-collaborative.md` / `phase-12-deepdive.md` 等、skill ごとに Phase 2 で確定）
