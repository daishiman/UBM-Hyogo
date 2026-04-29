# skill-feedback-report — task-specification-creator / aiworkflow-requirements への知見

> Phase 12 必須出力。0 件でも必須出力。

## 1. 対象スキル

- `.claude/skills/task-specification-creator`
- `.claude/skills/aiworkflow-requirements`

## 2. task-specification-creator への feedback

| # | 観点 | 改善提案 / 知見 | 重要度 |
| --- | --- | --- | --- |
| F-1 | NON_VISUAL タスクの Phase 11 evidence | NON_VISUAL では画像 placeholder を置かず、`screenshot-plan.json` と代替 evidence で判定する運用を SKILL.md に明記すると迷わない | MEDIUM |
| F-2 | 仕様書整備のみの PR と実装 PR の境界 | 本 T-6 のように 1 タスク = 2 PR（spec / impl）になるケースは AC マトリクス（Phase 7）と Phase 11 evidence がどちらの PR に属するかで混乱しやすい。`phase-template-core.md` に「spec-only PR と implementation PR の境界例」を追加すると再利用しやすい | MEDIUM |
| F-3 | Phase 12 必須 5 タスクの「0 件レポート必須」明示 | 既存の references/phase-12-spec.md に 0 件出力必須が書かれているが、新規ユーザーが省略しがち。Phase 12 検証スクリプトで `unassigned-task-detection.md` と `skill-feedback-report.md` の存在＋本文 5 行以上を validator path にすると確実 | LOW |
| F-4 | 4 条件評価の重複 | Phase 1（要件定義）と Phase 3（設計レビュー）の双方で 4 条件 PASS を要求しているが、Phase 1 の評価結果を Phase 3 がそのまま継承する運用が一般化している。`phase-template-core.md` に「Phase 3 では Phase 1 評価を再評価ではなく再確認として記述」と明記すると整合性が保ちやすい | LOW |

## 3. aiworkflow-requirements への feedback

| # | 観点 | 改善提案 / 知見 | 重要度 |
| --- | --- | --- | --- |
| F-5 | skill-ledger 系 references の関係図 | A-1 / A-2 / B-1 / T-6 の上下関係（A-2 → A-1 → T-6、B-1 並列）が references を読むだけだと俯瞰しづらい。`skill-ledger-fragment-spec.md` 冒頭に依存図 mermaid を入れると T-6 のような後続タスクで参照しやすい | MEDIUM |
| F-6 | hook 運用正本の集約 | `technology-devops-core.md` に hook 方針と CI gate（`verify-indexes-up-to-date`）の双方が既に記述済みで、本タスクからは重複なしで参照できた。新タスク作成時のチェックリストに「hook 系は技術 references を最優先で読む」を入れると分散参照を抑制できる | LOW |
| F-7 | 正本と workflow outputs の重心 | spec-only PR では正本 references を変更しない方針が機能した。`spec-guidelines.md` に「reference 更新は実装 PR 側で行う」例を 1 行追加すると同型タスクで再現しやすい | LOW |

## 4. 自タスクで得た一般化可能な知見

- `wait $PID` 個別集約パターン（`pids+=("$!")` + `for pid in "${pids[@]}"; do wait "$pid" || rc=$?; done`）は他の並列 smoke タスクで横展開可能。task-specification-creator の Phase 11 references にスニペット集として追加価値あり。
- 部分 JSON リカバリループ（`jq -e . || rm -v` → 再生成）は `pnpm indexes:rebuild` 以外（任意の生成系コマンド）にも転用できる。
- 2 worktree → 4 worktree 二段構え smoke は Mac mini クラスの I/O リスク逓減に有効で、I/O 帯域が異なる環境でも段階拡張パターンとして再利用できる。

## 5. 0 件ではない理由（説明責任）

各 skill とも完成度は高いが、本タスクで NON_VISUAL × spec-only × 並列 smoke という稀な組合せを通したことで F-1〜F-7 の細かな改善余地が観測できた。0 件レポートにせず明示することで、次回類似タスク（例: 後続のインフラガバナンス系）で再現しやすくする。
