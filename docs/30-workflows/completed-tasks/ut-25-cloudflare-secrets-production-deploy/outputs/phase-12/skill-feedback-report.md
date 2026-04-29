# skill-feedback-report — task-specification-creator skill 改善提案

## 対象 skill

`.claude/skills/task-specification-creator/`

## 本ワークフローでの skill 適用範囲

- Phase 1〜13 の生成（`phase-template-core.md` ベース）
- Phase 11 NON_VISUAL evidence 階層（`phase-11-non-visual-alternative-evidence.md` ベース）
- Phase 12 中学生レベル概念説明
- AC マトリクス（Phase 7）
- 4 条件評価（Phase 1 / Phase 3 再評価）

## 良かった点

| 観点 | 内容 |
| --- | --- |
| Phase テンプレートの一貫性 | governance / docs-only / cloudflare secrets という性質の異なるタスクでも同じ 13 Phase 構造で記述できた |
| MINOR 追跡テーブル | Phase 3 で MINOR 2 件（UT25-M-01 / UT25-M-02）を解決 Phase / 解決確認 Phase ごと管理でき、Phase 11 で確実にクローズできた |
| user_approval_required: true の Phase 13 境界 | 「Claude Code が実行しないこと」を構造的に明示できた |

## 改善提案

### Feedback-01: secret deployment 系での Phase 11 NON_VISUAL evidence 階層の調整余地

| 項目 | 値 |
| --- | --- |
| 優先度 | MEDIUM |
| 対象ファイル | `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md` |

**現状の課題**:
- 現行の L1〜L4 階層は GitHub governance（payload 正規化 + jq 構造検証）を主眼に書かれており、secret deployment 系（投入 / list / delete / rollback）にそのまま当てると L1（型）と L2（境界）の意味が薄い。
- 本ワークフローでは L1 = `secret list` の name 確認 / L2 = `--env` 切替の正しさ / L3 = 4 STEP 再現性 / L4 = 履歴汚染 spec walkthrough と読み替えたが、skill 側に「secret deployment 系の L1〜L4 マッピング例」が無い。

**改善提案**:
- references 配下に `phase-11-secret-deployment-evidence-mapping.md` を新設し、cloudflare / vercel / aws secrets 系で共通する 4 階層マッピング例を追加する。
- 既存 governance 系 mapping と並列に置き、Phase 11 で skill が「タスク種別に応じてどちらを参照するか」を選択できるようにする。

### Feedback-02: Phase 12 中学生説明テンプレの secret 系特化ガイダンス

| 項目 | 値 |
| --- | --- |
| 優先度 | MEDIUM |
| 対象ファイル | `.claude/skills/task-specification-creator/references/phase-template-core.md` または Phase 12 専用 reference |

**現状の課題**:
- 中学生レベル概念説明は「比喩を 1 用語 1 つ」「絵文字回避」までは指針があるが、secret 系特有の落とし穴（実値を例示しない / `op://` プレースホルダのみ / 履歴汚染の説明）に対する明示的な禁則指針が無い。
- 本ワークフローでは implementation-guide.md Part 1 で 4 用語に絞ったが、初稿時に「中学生でもわかるように」を字義通り解釈すると実値の例示に流れる誘惑がある。

**改善提案**:
- Phase 12 reference に「secret / token / key / credential 系の中学生説明 4 禁則」を追加:
  1. 実 secret 値・JSON 内容・鍵の片鱗を例示しない
  2. 1Password 参照は `op://Vault/Item/Field` のテンプレ表記のみ
  3. project ID / client email / vault path を具体名で書かない
  4. 比喩は「金庫」「引き出し」「許可証」のような物理的に閉じた連想に限定する

### Feedback-03（追加候補）: artifacts.json の outputs 配列と user-instruction の照合 lint

| 項目 | 値 |
| --- | --- |
| 優先度 | LOW |
| 対象ファイル | skill 側の lint script（必要なら新設） |

**現状の課題**:
- 本ワークフローで `artifacts.json` の Phase 11 outputs 配列に `secret-list-evidence-staging.txt` が含まれていたが、Wave 2 ユーザー指示は Phase 11 を 3 ファイル（main / manual-smoke-log / link-checklist）に固定していた。
- 人間が手動で照合しないと drift する可能性がある。

**改善提案**:
- `artifacts.json` の `phases[].outputs` と Phase 担当ファイル定義（user instruction / phase-NN.md `## 必須 outputs` / `outputs/phase-NN/` 実ディレクトリ）を 3-way 照合する lint を Phase 13 完了条件に追加する。

## skill apply 時の追加観点

- Phase 11 NON_VISUAL タスクでは `screenshots/` を作らない明示が `phase-template-phase11.md` に必要（governance ワークフロー由来の inheritance に注意）
- Phase 12 中学生説明は「実値例示の禁則」をテンプレに統合
- Phase 13 user_approval_required: true タスクでは「Claude Code が実行しない動詞」を `phase-13.md` 冒頭に列挙する習慣を skill 側にガイドする

## まとめ

本ワークフローは task-specification-creator skill を 13 Phase 完走で適用できた良ケース。改善提案 3 件はいずれも secret deployment 系特有の語彙・禁則を skill に逆流させる方向で、governance 由来テンプレの一般化に資する。
