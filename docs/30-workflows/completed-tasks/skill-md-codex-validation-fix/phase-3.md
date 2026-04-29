# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 |
| 名称 | 設計レビュー |
| タスクID | TASK-SKILL-CODEX-VALIDATION-001 |
| 状態 | spec_created |
| タスク種別 | tooling_implementation / NON_VISUAL |

## 目的

Phase 2 設計の妥当性を 4 条件（価値性・実現性・整合性・運用性）で評価し、Phase 4 へのゲート判定を行う。

## 4 条件評価

### 価値性

| 観点 | 評価 |
| --- | --- |
| 誰のコストを下げるか | 開発者全員（Codex / Claude Code 起動時の警告ノイズが消える） |
| 効果の即時性 | 高（PR マージ直後から警告ゼロ） |
| 再発防止の効果 | 高（generate ゲートにより新規スキルでも 100% 防止） |

**判定**: PASS

### 実現性

| 観点 | 評価 |
| --- | --- |
| Lane A 規模 | 3 ファイル編集 + references 新規 2-3 ファイル。1 PR で実装可能 |
| Lane B 規模 | 28 ファイル rename + テストヘルパー 1 関数追加。低リスク |
| Lane C 規模 | generate_skill_md.js / init_skill.js 改修 + utils 抽出 + テスト追加。中規模だが既存 quick_validate のロジック再利用で済む |
| 全体ボリューム | 1 PR の妥当範囲内 |

**判定**: PASS

### 整合性

| 観点 | 評価 |
| --- | --- |
| Lane B → C の依存 | フィクスチャ出力経路の整合のみ。Phase 5 の wave 末尾で確認すれば閉じる |
| canonical / mirror | 現時点の実在 mirror は `~/.agents/skills/aiworkflow-requirements` のみ。skill-creator / automation-30 は mirror が存在する場合のみ parity 対象にする |
| 既存テスト | フィクスチャ拡張子変更で既存テストの読込パスが変わるため、Phase 4 RED で確実に検出される |
| description 圧縮の副作用 | aiworkflow-requirements の description を参照する外部呼び出しがないことを Phase 5 着手前に grep 確認（Phase 5 の T5-A1 タスク冒頭に組み込み済み） |

**判定**: CONDITIONAL PASS（aiworkflow-requirements description 参照箇所の grep 確認が前提）

### 運用性

| 観点 | 評価 |
| --- | --- |
| 導入後の verify | Codex 起動 / Claude Code セッション開始の 2 シナリオで警告 0 確認。低コスト |
| 新規スキル作成時 | generate_skill_md.js の throw メッセージに退避先パスが明記されているため、対処が自明 |
| ロールバック | 各 Lane が独立した差分なので、問題発生時は Lane 単位で revert 可能 |

**判定**: PASS

## レビュー指摘

| ID | 種別 | 内容 | 対応 |
| --- | --- | --- | --- |
| R3-01 | MINOR | aiworkflow-requirements の description テキストに依存する skill 検索ロジックがあれば description 圧縮で振る舞いが変わる可能性 | Phase 5 T5-A1 冒頭で `grep -rn "aiworkflow-requirements" .claude .agents docs` を実施し、description テキスト依存を 0 件確認 |
| R3-02 | MINOR | Anchors 上限 5 件は skill-creator 自体の現状（7 件）より厳しい | 上限超過時は自動退避するため違反にはならない。閾値は妥当 |
| R3-03 | INFO | フィクスチャ拡張子変更により他のスキル（例: skill-fixture-runner）が `*/SKILL.md` をスキャンしている場合に影響 | Phase 5 T5-B 冒頭で `grep -rn "fixtures/.*SKILL.md" .claude` を実施し、参照箇所を全件特定して読み替え |
| R3-04 | INFO | Lane B / C の同一 PR 同梱は B → C の整合確認を Phase 5 末尾で必須化 | Phase 5 ゲートに `B 完了 → C のフィクスチャ出力先確認` を明記済み |

## 未タスク候補（Phase 12 で再判定）

- なし（現時点）

## ゲート判定

| 条件 | 結果 |
| --- | --- |
| 4 条件すべて PASS / CONDITIONAL PASS | ✅ |
| 指摘事項に対応方針あり | ✅ |
| Phase 4 RED 計画が立てられる粒度 | ✅ |

**Phase 4 へ進む**: ✅ APPROVED（R3-01 対応を Phase 5 着手条件に組み込む）

## 成果物

- `outputs/phase-3/review-result.md`

## 実行タスク

- Phase 2 の設計を価値性・実現性・整合性・運用性でレビューする。
- MINOR / MAJOR 指摘と解決予定 Phase を固定する。
- Phase 4 開始可否を gate として判定する。

## 参照資料

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| Phase 2 | `phase-2.md` | 設計レビュー対象 |
| review gate | `.claude/skills/task-specification-creator/references/review-gate-criteria.md` | gate 判定 |

## 統合テスト連携

Phase 3 の CONDITIONAL PASS 指摘は Phase 4〜9 の検証項目へ反映し、未解決のまま Phase 10 へ進めない。

## 完了条件

- [ ] Phase 4 へ進む条件が明示されている
- [ ] MINOR 指摘の解決予定 Phase が定義されている
- [ ] Phase 13 がユーザー承認まで blocked であることを確認している

## タスク100%実行確認【必須】

- [ ] Phase 3 の成果物と artifacts.json の登録が一致している
