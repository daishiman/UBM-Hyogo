# Skill loader doctor スクリプト導入 - タスク指示書

## メタ情報

| 項目         | 内容                                                          |
| ------------ | ------------------------------------------------------------- |
| タスクID     | task-skill-loader-doctor-001                                  |
| タスク名     | Skill loader doctor (`pnpm skills:doctor`) 導入               |
| 分類         | ツーリング / 自動化                                           |
| 対象機能     | skill SKILL.md / references / canonical-mirror の健全性検査   |
| 優先度       | 中                                                            |
| 見積もり規模 | 中規模                                                        |
| ステータス   | 未実施 (proposed)                                             |
| 親タスク     | skill-ledger-a3-progressive-disclosure                        |
| 発見元       | A-3 Phase 12 unassigned-task-detection (U-7)                  |
| 発見日       | 2026-04-28                                                    |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

A-3 (skill-ledger Progressive Disclosure) の Phase 12 振り返りで、以下を毎回手動で確認していることが判明した:

- `SKILL.md` の行数が U-5 Anchor (≤ 200 行) を満たすか
- `SKILL.md` から `references/*.md` への相対リンクが実体に到達するか
- `references/` 配下に SKILL.md から参照されない孤立ファイルが無いか
- `.claude/skills/<skill>` と `.agents/skills/<skill>` の canonical-mirror に diff が無いか

### 1.2 問題点・課題

- 苦戦箇所 #1（SKILL.md 内リンク参照切れ）は手動確認に依存
- 苦戦箇所 #5（canonical / mirror 同期漏れ）は merge 後に気づく事故が再発
- 行数 / 未参照 references の検査ロジックが各 skill ごとに散在し、再現性が無い

### 1.3 放置した場合の影響

- skill 追加 / 更新のたびに同種事故が再発し、レビューコストが線形に増える
- mirror 同期漏れが本番 agents 動作のドリフト要因になる
- A-3 で確立した「200 行制約」「未参照 references 0 件」の SLO が運用で形骸化

---

## 2. 何を達成するか（What）

### 2.1 目的

skill ledger の健全性検査を 1 コマンドに集約し、再発を機械的に検知できる状態を作る。

### 2.2 最終ゴール（想定 AC）

1. `scripts/skill-loader-doctor.js`（または `.ts`）が `.claude/skills/*` 配下の全 skill を走査する
2. チェック項目:
   - SKILL.md 行数が ≤ 200 行（U-5 Anchor）
   - SKILL.md から `references/*.md` への相対リンクが実体に到達する
   - `references/` 配下に SKILL.md から未参照のファイルが存在しない
   - `.claude/skills/<skill>` と `.agents/skills/<skill>` の canonical-mirror diff が 0
3. `pnpm skills:doctor` 一発で実行できる（`package.json` の scripts に追加）
4. lefthook pre-commit に組込み、skill 関連ファイル変更時のみ起動する
5. CI 化は本タスクのスコープ外（後続検討）とし、ローカルで終了コード 1 を返せれば足りる
6. U-5 Anchor 違反検知時は終了コード 1 + 違反箇所をテキスト出力する

### 2.3 スコープ

#### 含むもの

- `scripts/skill-loader-doctor.js` 本体
- `package.json` の `skills:doctor` script 追加
- `lefthook.yml` への pre-commit hook 追加（skill 関連 path filter 付き）
- 違反内容の human-readable 出力フォーマット

#### 含まないもの

- CI workflow への gate 昇格（別タスクで判断）
- skill SKILL.md の auto-fix 機能
- references 自動再配置 / 行数自動分割

### 2.4 成果物

- doctor スクリプト本体
- pnpm script 追加差分
- lefthook hook 追加差分
- 動作確認ログ（PASS / 故意 FAIL の双方）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- A-3 Phase 13 完了で SLO（≤ 200 行 / 未参照 0 件 / mirror diff 0）が確定していること
- U-1〜U-4 完了後の着手を推奨（基準値が固まってから実装する方が手戻りが少ない）

### 3.2 推奨アプローチ

implementation / 中規模。最初は smoke check（致命系のみ）に留め、漸進的にチェック項目を追加する。

---

## 4. 影響範囲

- `scripts/skill-loader-doctor.js`（新規）
- `package.json`（`skills:doctor` script 追加）
- `lefthook.yml`（pre-commit hook 追加）
- 将来: `.github/workflows/*`（CI gate 化は別タスク）

---

## 5. 推奨タスクタイプ

implementation / NON_VISUAL

---

## 6. 参照情報

- 検出ログ: `docs/30-workflows/skill-ledger-a3-progressive-disclosure/outputs/phase-12/unassigned-task-detection.md` の U-7
- 苦戦箇所: `docs/30-workflows/skill-ledger-a3-progressive-disclosure/index.md` の #1（SKILL.md 内リンク参照切れ）/ #5（canonical-mirror 同期漏れ）
- 関連タスク: A-3 (skill-ledger-a3-progressive-disclosure)

---

## 7. 備考

苦戦箇所 #1 / #5 の再発防止が主目的。最初は smoke check に留め、CI gate 昇格は運用で偽陽性 / 偽陰性が安定してから別タスクで判断する。doctor が出力する違反メッセージは将来の auto-fix タスクの入力にもなり得るため、機械可読な形式（JSON サマリ）も並行出力できると望ましい。
