# aiworkflow-requirements indexes / SKILL.md 大規模整理（topic-map 分割・description 二重化解消・Phase 12 outputs validator） - タスク指示書

## メタ情報

| 項目         | 内容                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| タスクID     | task-skill-aiworkflow-requirements-topic-map-split-001                        |
| タスク名     | aiworkflow-requirements / task-specification-creator / github-issue-manager の indexes 分割と SKILL.md 整流化 |
| 分類         | スキルガバナンス / ドキュメント                                               |
| 対象機能     | `.claude/skills/aiworkflow-requirements/` / `.claude/skills/task-specification-creator/` / `.claude/skills/github-issue-manager/` |
| 優先度       | 中（priority:medium）                                                         |
| 見積もり規模 | 中規模（scale:medium）                                                        |
| ステータス   | 未実施（proposed）                                                            |
| 発見元       | Issue #554 Phase-12 / `outputs/phase-12/skill-feedback-report.md` + 監査ラウンド「スキル全体の改善余地監査」 |
| 発見日       | 2026-05-08                                                                    |
| 親タスク     | （新規・自立タスク）                                                          |
| 着手判断     | Issue #554 Phase 13 完了後、または別途 skill 改修 wave で着手                |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

Issue #554（branch protection required check 追加）の Phase-12 監査で、aiworkflow-requirements skill / task-specification-creator skill / github-issue-manager skill に下記の構造的負債が再確認された。Issue #554 自体の正本反映は同 wave で完了したが、横断的な skill 整流化は wave 範囲外として切り出す。

### 1.2 問題点・課題

#### High 優先

- `aiworkflow-requirements/SKILL.md` の `description` フィールドが二重記述（YAML scalar 長文と整形版）になっており skill-creator テンプレ違反
- `aiworkflow-requirements/SKILL.md` 「変更履歴」セクションが「最新 3 件のみ」宣言と矛盾し 30+ 件残存
- `aiworkflow-requirements/indexes/topic-map.md` が 6410 行に肥大化、Progressive Disclosure の起点として機能不全
- `aiworkflow-requirements/indexes/quick-reference.md` が 2131 行で同様
- `task-specification-creator/SKILL.md` L11-L13 の Trigger 行が完全重複

#### Medium 優先

- `branch-protection.md` ↔ `audit-correlation.md` 相互リンク追加は完了したが、他 governance reference (lessons-learned 群) との相互参照は未網羅
- EVALS.json に「branch protection PUT payload preserve normalization」観点のテストケース欠落
- Phase 12 strict 7 outputs を CI で検証する `scripts/validate-phase12-outputs.sh` が未整備
- `references/governance-payload-preservation.md` が Issue #554 で得た再利用パターンを明文化できる新規 reference 候補として未起票
- `github-issue-manager/SKILL.md` 411 行で推奨 200-400 を超過、Part 1/2/3 構造の `references/` 分割余地

### 1.3 ゴール

- aiworkflow-requirements の indexes が Progressive Disclosure を機能させる粒度（topic-map をドメイン別 family に分割）に再構成される
- 3 skill の SKILL.md が skill-creator テンプレ準拠（line budget / Trigger 重複なし / description 単一化）
- Phase 12 strict 7 outputs validator が CI で検証可能
- Issue #554 で得た governance-payload-preservation pattern が再利用可能 reference として正本化

## 2. 何をするか（What）

### 2.1 スコープ

- `.claude/skills/aiworkflow-requirements/SKILL.md`: description 単一化、変更履歴の「最新 3 件のみ」厳守、line budget 200-400 内
- `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`: ドメイン別 (cloudflare / ui / audit / branch-protection / dlq / governance) の family 分割、起点 index は要約のみ
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`: 同上、必要なら family 化
- `.claude/skills/aiworkflow-requirements/references/governance-payload-preservation.md`: 新規作成（Issue #554 normalized contexts-only adapter pattern を再利用可能 governance pattern として明文化）
- `.claude/skills/aiworkflow-requirements/EVALS.json`: level 3 に branch_protection_payload_normalization テストケース追加
- `.claude/skills/aiworkflow-requirements/scripts/validate-phase12-outputs.sh`: 新規（strict 7 outputs 充足の自動検証、root phase files vs outputs/phase-12 diff gate）
- `.claude/skills/task-specification-creator/SKILL.md`: L11-L13 Trigger 重複解消
- `.claude/skills/task-specification-creator/references/phase-12-documentation-guide.md`: parent–child path normalization 4 点同期 checklist + Phase 11 external-mutation before/after split template 追記
- `.claude/skills/github-issue-manager/SKILL.md`: 200-400 line に再構成、Part 1/2/3 を `references/quickstart.md` 等へ分割

### 2.2 スコープ外

- Issue #554 自体の Phase 13 user-gated mutation（別ワークフロー）
- skill-creator skill 本体の改修（別タスク）
- aiworkflow-requirements の references/ 全体再分類（必要時に別タスク化）

## 3. 制約条件

- skill-creator の Progressive Disclosure 規範に従うこと
- `pnpm indexes:rebuild` で topic-map / keywords.json が再生成されることを前提に手書き分は SKILL.md / quick-reference / family fragment のみ
- 各分割ファイルは 500 行以内、SKILL.md は 200-400 行
- コミット / PR は user 承認後のみ

## 4. 完了条件（DoD）

- [ ] aiworkflow-requirements SKILL.md description が単一化され line budget 内
- [ ] topic-map / quick-reference が family 分割済み
- [ ] governance-payload-preservation.md が References 節で branch-protection.md / audit-correlation.md / 関連 lessons-learned と相互リンク
- [ ] EVALS.json に branch_protection_payload_normalization 追加、validate-structure.js で PASS
- [ ] validate-phase12-outputs.sh が strict 7 outputs 不足を検出して fail する自動テスト付き
- [ ] task-specification-creator SKILL.md L11-L13 重複解消
- [ ] github-issue-manager SKILL.md 200-400 行
- [ ] generate-index.js / validate-structure.js / mirror sync / diff -qr 全 PASS

## 5. 関連参照

- 発見元レポート: `docs/30-workflows/issue-554-audit-correlation-branch-protection-required-check/outputs/phase-12/skill-feedback-report.md`
- 発見元 lessons-learned: `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-issue-554-branch-protection-required-check-2026-05.md`（L-554-001 governance-payload-preservation 候補、L-554-004 4 点同期 checklist 候補）
- 関連既存タスク: `task-skill-improvement-anchor-establishment-001.md`、`task-skill-creator-progressive-disclosure-template-001.md`
- skill 規範: `.claude/skills/skill-creator/SKILL.md`、`references/anchors.md`
