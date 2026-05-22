# lessons-learned-task-06-ui-ux-contract-rewrite-2026-05

## L-T06-001: primary rewrite は implementation として状態語彙を揃える

- 状況: markdown 正本のみの変更でも、後続実装 contract を unblock する全面 rewrite が primary deliverable だった。
- 問題: `artifacts.json` は `implemented-local`、`index.md` / Phase 12 outputs は `spec_created` のままになり、同じ workflow が未実装にも実装済みにも読めた。
- 対策: primary spec rewrite を実ファイルへ反映した時点で `implementation / NON_VISUAL / implemented-local` に揃え、Phase 1-12 は completed、Phase 13 のみ pending_user_approval とする。

## L-T06-002: AC 番号は index と Phase evidence で再定義しない

- 状況: `index.md` の AC-9 / AC-11 と `outputs/phase-07/main.md` の AC-9 / AC-11 が別内容になっていた。
- 問題: レビュー時にどちらの AC が正本か判定できず、Phase 11 evidence の PASS 境界が曖昧になった。
- 対策: AC-1〜AC-14 は Phase 07 の実測マトリクスを正本として `index.md` へ同期する。

## L-T06-003: same-wave skill/index sync は diff scope に含める

- 状況: primary diff scope は `09-ui-ux.md` M + workflow package A とされていたが、実際には `.claude/skills/` の SKILL / LOGS / indexes / changelog も更新していた。
- 問題: PR reviewer が `.claude` 差分をスコープ外変更と誤認する。
- 対策: artifacts / task-workflow-active / Phase 12 summary に same-wave sync として明示する。

## L-T06-004: path 文字列は後続 task owner と同時に名寄せする

- 状況: `09h-shell-and-fixtures.md` と `09h-shell-and-fixture.md`、`09d-icons.md` の task owner に揺れがあった。
- 問題: 後続 task が存在しない path を参照し、link check / review で破綻する。
- 対策: `09-ui-ux.md` の §1.2 index 表を正本に、Phase 12 outputs の path と owner を同一 wave で揃える。

## L-T06-005: 無関係 delete diff は復元か formal trace を必須にする

- 状況: attendance 系 workflow 削除混入が active/resource-map 参照を壊す可能性があった。
- 問題: primary task と無関係な D diff が混ざると、正本参照が壊れたまま review を通過しうる。
- 対策: 無関係 D diff は同サイクルで復元する。復元できない場合は formal trace と owner task を作成し、outputs note だけで済ませない。

## L-T06-006: NON_VISUAL タスクの Phase 11 alternative evidence は 4 種で網羅する

- 状況: markdown contract 書き換え（task-06）は VISUAL evidence（screenshot）を取得できないが、Phase 11 を「縮約」だけで済ませると AC PASS の客観性が担保できなかった。
- 問題: スクリーンショットがない理由を文書化しないとレビュー時に「evidence 不足」と誤検出され、Phase 11 PASS 判定が再現できない。
- 対策: NON_VISUAL タスクは Phase 11 で以下 4 種の alternative evidence を必須化する: ①grep gate（HEX / `oklch()` / px / `bg-[#` / `text-[#` の 0 件確認 → `evidence/grep-gate.log`）／②structure check（H2 / H3 数の決定論的一致 → `evidence/structure-check.log`）／③markdown lint（exit 0 → `evidence/markdown-lint.log`）／④trace check（contract → impl mapping 整合 → `evidence/trace-check.log`）。加えて `phase-11-non-visual-alternative-evidence.md` で「なぜ visual を取らないか」の根拠を明示。詳細は `docs/30-workflows/completed-tasks/task-06-ui-ux-contract-rewrite/outputs/phase-12/skill-feedback-report.md` 「task-specification-creator skill への feedback」節を参照。

## L-T06-007: prototype 正本順位と視覚詳細委譲の判断基準

- 状況: `claude-design-prototype/` には primitives.jsx / pages-{public,member,admin}.jsx / styles.css / icons.jsx 等が混在し、09-ui-ux.md にどこまで取り込むかの線引きが曖昧だった。
- 問題: 行範囲 / HEX / px などを 09-ui-ux.md に転記すると、視覚詳細の更新ごとに契約正本が肥大化し、AC-3〜AC-6（視覚詳細 0 件）と矛盾する。
- 対策: 正本順位を「①SCOPE.md → ②phase-{1,2,3}.md → ③specs/*.md → ④claude-design-prototype/」と明文化（CLAUDE.md と整合）。判断基準は「props / state / a11y / token 参照名 / API 接続 → 09-ui-ux.md（契約）」「行範囲 / 視覚詳細値 / JSX inline / fixture → 09a..09h（委譲先 spec）」で二分する。プロトタイプ未掲載画面（管理画面群 / register / privacy / terms）も同じ primitives 群で構成し、新規 primitive を生やさない。詳細は `docs/30-workflows/completed-tasks/task-06-ui-ux-contract-rewrite/outputs/phase-12/skill-feedback-report.md` 「aiworkflow-requirements skill への feedback」節を参照。
