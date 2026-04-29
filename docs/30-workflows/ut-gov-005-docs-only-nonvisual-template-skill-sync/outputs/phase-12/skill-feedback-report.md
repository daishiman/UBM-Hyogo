# skill-feedback-report.md

## メタ情報

| 項目 | 値 |
| --- | --- |
| 対象 skill | task-specification-creator |
| フィードバック日 | 2026-04-29 |
| フィードバック形式 | 自己適用（drink-your-own-champagne）での発見 |
| 親タスク | ut-gov-005-docs-only-nonvisual-template-skill-sync |

---

## サマリー

本タスクは `task-specification-creator` skill 自身を改修するタスクであり、改修した縮約テンプレを **本タスク自身の Phase 11 で自己適用** することで実証検証を行った。
自己適用を通じて、テンプレが理論ではなく運用実体として機能するか / 抜け漏れがないか / 改善余地があるか を実地で確認できた。

---

## 1. 良かった点

### 1-1. 縮約テンプレの 3 点固定が運用しやすい

`outputs/phase-11/` を `main.md` / `manual-smoke-log.md` / `link-checklist.md` の 3 点固定にしたことで、

- ファイル数が一目で `ls` 検出可能（AC-8 機械検出が確実に動く）
- 命名タイポリスクが小さい（覚えやすい 3 名前）
- screenshot 不要の判断が `visualEvidence=NON_VISUAL` 1 行で機械化される

冗長 artefact の混入を構造的に防げる点が、運用上のストレスを大幅に下げた。

### 1-2. state ownership 分離の明文化

workflow root の状態欄（`spec_created` 維持）と `phases[].status`（Phase 12 で `completed` 更新）を **責務分離** として `phase-template-core.md` に明文化したことで、Phase 12 close-out 時の誤書換え事故（原典 §8 苦戦箇所 3）が構造的に防げるようになった。

### 1-3. mirror parity 検証が `diff -qr` 1 発で済む

6 ファイル個別チェックではなく `diff -qr .claude/skills/... .agents/skills/...` 1 行で済む点が運用効率を大きく上げた。Phase 9 / Phase 11 S-1 の両方で再現性 100%。

### 1-4. drink-your-own-champagne の有効性

縮約テンプレを定義した skill 自身で第一適用例を作る方式は、後続タスク（UT-GOV-001〜007）が **生きた参照実装** を持てる点で大きな価値があった。仕様書だけでは伝わらないニュアンス（例: 3 点固定の「3 点」の選び方）が outputs から逆引き可能。

---

## 2. 改善観察事項（次回改修候補）

### 2-1. SKILL.md の Progressive Disclosure 限界

タスクタイプ判定フロー追記後、SKILL.md が 500 行に近づいてきた。さらに分岐を増やすと Progressive Disclosure（必要最小限読込）の原則が崩れる。

**提案**: SKILL.md を「タスクタイプ判定の入口」に限定し、各分岐は references/ に separation する分割案を次回改修候補に。

### 2-2. 「該当なし」明示宣言用テンプレ snippet

docs-only タスクで C12P2-1 / C12P2-2 が「該当なし」になる頻度が高い。現状は毎回手書きしているが、定型化して snippet 化すると DRY 化が進む。

**提案**: `phase-template-phase12.md` に「該当なし宣言の標準フォーマット」snippet を追加（次回改修候補）。

### 2-3. docs-only 以外の docs-only 系派生（skill-improvement かつ実装あり）

本タスクは「docs-only かつ NON_VISUAL」の純粋ケースだったが、現実には「skill 改修と実装が同居するタスク」が出てくる。例: skill 追記 + apps/web 実装。
この場合、`taskType=docs-only` だけでは分岐を表現しきれない。

**提案**: `taskType` に `mixed` 値を追加するか、`taskType` を配列化する設計を次タスク化候補に（U-9 として `unassigned-task-detection.md` 任意候補に記録）。

### 2-4. VISUAL タスク向けテンプレの未整理

本タスクは NON_VISUAL 専用の縮約テンプレを定義したが、VISUAL 側は既存フルテンプレのまま。対称性が崩れている。

**提案**: U-9（VISUAL タスク向けテンプレ整理）として別タスク化。

---

## 3. 苦戦箇所（自己適用で気付いた事項）

### 3-1. 自己適用循環（Phase 5 → Phase 11 順序ゲート）

skill 6 ファイル追記（Phase 5）が **未コミット状態**で Phase 11 を開始すると、参照リンクが壊れて smoke が失敗する。skill 改修系タスクでは Phase 5 を完了 commit してから Phase 11 を始めるという順序ゲートを意識化する必要がある。

**対策案**: Phase 11 開始条件に「Phase 5 が commit 済」を明示追加（`phase-template-phase11.md` に注意書き追加候補）。

### 3-2. workflow root 状態欄の誤書換え誘惑

Phase 12 close-out で「全部 completed にしたい」という心理的誘惑が働き、workflow root を `completed` に書き換えそうになる。state ownership 分離ルールを明文化していなかったら、本タスクでも事故っていた可能性が高い。

### 3-3. Part 2 「該当なし」の空欄化

C12P2-1 / C12P2-2 を docs-only タスクで「コード変更なし」と判断した結果、空欄にしてしまうと compliance-check が機械的に FAIL する。「該当なし」と理由 1 行を必ず書くという暗黙ルールを skill に明文化する必要があった（Phase 5 で `phase-12-completion-checklist.md` に追記済）。

---

## 4. 後続タスクへの引き継ぎ

| 引き継ぎ事項 | 引き継ぎ先 |
| --- | --- |
| 縮約テンプレ第一適用例の参照リンク | UT-GOV-001〜007 系 / U-6（遡及適用判定タスク） |
| mirror parity CI gate 化 | U-7 |
| skill-fixture-runner 縮約検証 | U-8 |
| VISUAL テンプレ整理 | U-9（任意） |
| `taskType=mixed` 設計検討 | 次回 skill 改修候補 |

---

## 5. 総評

**自己適用は成功**。縮約テンプレが理論で終わらず、本タスク自身の Phase 11 outputs として実体化したことで、後続タスクが安心して参照できる第一実装例が確立した。state ownership 分離 / 「該当なし」明示宣言 / 3 点固定 という 3 つの構造的工夫が、運用ストレスを大幅に下げる効果を確認できた。

次回改修候補としては、SKILL.md 分割 / 「該当なし」snippet / `taskType=mixed` 設計 / VISUAL テンプレ整理の 4 点を記録。
