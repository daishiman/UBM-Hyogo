# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-005-docs-only-nonvisual-template-skill-sync |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| 作成日 | 2026-04-29 |
| 上流 | Phase 5（実装ランブック） |
| 下流 | Phase 7（AC マトリクス） |
| 状態 | pending |
| user_approval_required | false |

## 目的

Phase 3 で確定したリスク R-1〜R-8 と苦戦箇所 6 件に対して、**意図的にフェイル経路を再現**し、防御線（Phase 1 必須入力 / TC-5 mirror diff / C12P2-1〜5 / 状態分離節 / 自己適用順序ゲート）が fail-fast で機能することを検証する。観察ログを `failure-cases.md` に記録し、Phase 12 documentation に inversely 反映する。

skill 改修自体は文字列追記であり破壊的副作用は低いが、**「縮約テンプレが発火しない」「mirror が drift する」「状態が誤書換えされる」** という運用ドリフトが本タスクの主要リスクのため、シナリオは **設定漏れ・運用揺れ** を中心に構成する。

## 入力

- `outputs/phase-03/main.md`（リスク R-1〜R-8 / MINOR TECH-M-01〜04）
- `outputs/phase-04/test-strategy.md`（TC-1〜TC-8）
- `outputs/phase-05/implementation-runbook.md`（Step 1〜6 と Green ログ）

## 異常系シナリオ（FC）

### FC-1 visualEvidence メタ未設定で縮約テンプレが発火しない（R-1）

| 項目 | 内容 |
| --- | --- |
| 仮想シナリオ | 新規 docs-only タスクで `artifacts.json.metadata.visualEvidence` を未設定のまま Phase 11 に進む |
| 検証 | sandbox に `visualEvidence` フィールド欠落の `artifacts.json` を作成し、SKILL.md タスクタイプ判定フローを手動適用 |
| 期待検出 | 判定フローの「未設定 → 進行不可」ブランチに該当し Phase 1 完了条件で fail-fast |
| 防御 | AC-6 / TC-4-1（`phase-template-phase1.md` に「Phase 1 必須入力」明記）|
| ロールバック | `artifacts.json.metadata.visualEvidence` を `NON_VISUAL` または `VISUAL` に確定し、Phase 1 を再実行 |

### FC-2 Phase 12 Part 2 必須 5 項目のチェック漏れ（R-2）

| 項目 | 内容 |
| --- | --- |
| 仮想シナリオ | implementation タスクの `outputs/phase-12/implementation-guide.md` に型定義のみ書かれエラー処理が欠落 |
| 検証 | `phase-12-completion-checklist.md` の C12P2-1〜5 を機械チェック（rg）し、C12P2-4（エラー処理）が 0 件であることを再現 |
| 期待検出 | Phase 12 close-out 前に C12P2-4 FAIL → 追記要求 |
| 防御 | AC-3 / TC-3-1, TC-3-2（C12P2-1〜5 一対一項目化）|
| ロールバック | implementation-guide にエラー処理セクションを追記し再判定 |

### FC-3 状態書換え誤り（spec_created → completed）（R-3）

| 項目 | 内容 |
| --- | --- |
| 仮想シナリオ | docs-only タスクの Phase 12 close-out で `index.md` の `状態` を誤って `completed` に書換え |
| 検証 | sandbox で `index.md` の状態を `completed` に書換え、`phase-12-completion-checklist.md` の docs-only ブランチを適用 |
| 期待検出 | docs-only ブランチが「workflow root = `spec_created` 維持」「`phases[].status` のみ `completed`」を要求 → FAIL を検出 |
| 防御 | AC-4 / TC-3-3, TC-3-4（docs-only ブランチ + 状態分離節）|
| ロールバック | `index.md` の `状態` を `spec_created` に戻し、`artifacts.json.phases[].status` のみ `completed` に維持 |

### FC-4 mirror 同期忘れ（`.claude` のみ更新）（R-4）

| 項目 | 内容 |
| --- | --- |
| 仮想シナリオ | Phase 5 Step 1〜5 だけ実行し Step 6（`.agents/` 同期）をスキップ |
| 検証 | `diff -qr .claude/skills/task-specification-creator .agents/skills/task-specification-creator` 実行 |
| 期待検出 | 6 ファイル中 1 ファイル以上の差分行が出力 → fail-fast |
| 防御 | AC-5 / TC-5-1, TC-5-2（mirror diff 0 必須）|
| ロールバック | Step 6 の `cp` ループを再実行し、再度 `diff -qr` で 0 確認 |

### FC-5 遡及適用判断の運用割れ（R-7）

| 項目 | 内容 |
| --- | --- |
| 仮想シナリオ | UT-GOV-001 既存タスクで Phase 11 着手時に縮約テンプレを適用するか判断がブレる |
| 検証 | Phase 12 documentation の遡及適用方針記述を rg で確認し、「新規 Phase 1 から適用 / 進行中は Phase 11 着手時再判定」が明記されているかチェック |
| 期待検出 | 方針未記載の場合、`unassigned-task-detection.md` に未確定タスクとして登録 |
| 防御 | Phase 12 documentation で方針明文化（TECH-M-03）|
| ロールバック | 遡及適用方針を Phase 12 で再確定し、影響タスクの `artifacts.json.metadata.visualEvidence` を再判定 |

### FC-6 既存セクションと縮約テンプレの矛盾（R-6）

| 項目 | 内容 |
| --- | --- |
| 仮想シナリオ | `phase-template-phase11.md` の既存「docs-only / spec_created 必須3点」セクションと新規縮約テンプレが内容で食い違う |
| 検証 | rg で 2 セクションの必須 outputs 一覧を抽出し diff |
| 期待検出 | 矛盾発見 → Phase 8 DRY 化対象 |
| 防御 | TC-8-1（「別セット」「混在させない」明記） / TECH-M-01（Phase 8 統合）|
| ロールバック | Phase 8 で既存セクションを縮約テンプレに統合し、参照リンクのみ残す |

### FC-7 SKILL.md 行数超過による Progressive Disclosure 影響（R / 苦戦由来）

| 項目 | 内容 |
| --- | --- |
| 仮想シナリオ | SKILL.md にタスクタイプ判定フローを冗長に追記し、行数が skill 規約（推奨 500 行以下）を超過 |
| 検証 | `wc -l .claude/skills/task-specification-creator/SKILL.md` で行数確認 |
| 期待検出 | 規約超過時は判定フローを `references/` に分離し SKILL.md は概要のみに留める |
| 防御 | Phase 5 Step 1 で「SKILL.md は判定フロー概要のみ・詳細は references」を原則化 |
| ロールバック | 判定フロー詳細を `references/` 側に切り出し、SKILL.md には参照リンクのみ残す |

### FC-8 CI / pre-commit による mirror parity 強制不在（R-8）

| 項目 | 内容 |
| --- | --- |
| 仮想シナリオ | mirror parity が CI gate 化されておらず、PR がレビューなくマージされた後に drift |
| 検証 | `.github/workflows/` 内に mirror diff を確認する gate が存在するか rg で確認 |
| 期待検出 | gate 不在を確認 → 本タスクスコープ外として `unassigned-task-detection.md` に登録（TECH-M-02）|
| 防御 | 本タスクは AC-5 の手動 `diff -qr` で担保。CI gate 化は別タスク |
| ロールバック | drift 発生時は本 Phase 5 Step 6 を手動再実行 |

### FC-9 縮約テンプレ自己適用時の整合性違反（R-5）

| 項目 | 内容 |
| --- | --- |
| 仮想シナリオ | 本ワークフロー Phase 11 を Phase 5 完了前に着手し、縮約テンプレが skill に未反映の状態で `outputs/phase-11/` を作成 |
| 検証 | Phase 11 着手時に `rg "縮約テンプレ" .claude/skills/task-specification-creator/references/phase-template-phase11.md` を確認 |
| 期待検出 | 0 件ヒット → 縮約テンプレが skill に未コミット → Phase 11 着手中止 |
| 防御 | Phase 2 §7 / Phase 5 自己適用順序ゲート（Phase 5 完了 → Phase 11）|
| ロールバック | Phase 5 Step 1〜6 を完了させてから Phase 11 を再着手 |

## 防御線サマリー

| FC | 防御 Phase | 防御 AC / TC | fail-fast 機能箇所 |
| --- | --- | --- | --- |
| FC-1 | Phase 1 / 5 | AC-6 / TC-4-1 | Phase 1 完了条件 |
| FC-2 | Phase 5 | AC-3 / TC-3-1, TC-3-2 | Phase 12 close-out 前 |
| FC-3 | Phase 5 | AC-4 / TC-3-3, TC-3-4 | Phase 12 close-out 判定 |
| FC-4 | Phase 5 Step 6 / 9 / 11 | AC-5 / TC-5-1 | Phase 5 末 / Phase 9 / Phase 11 の 3 箇所 |
| FC-5 | Phase 12 | TECH-M-03 | Phase 12 documentation |
| FC-6 | Phase 8 | TECH-M-01 / TC-8-1 | Phase 8 DRY 化 |
| FC-7 | Phase 5 Step 1 | 設計原則 | Step 1 実行時 `wc -l` |
| FC-8 | スコープ外 | TECH-M-02 | 別タスク（unassigned-task-detection）|
| FC-9 | Phase 5 / 11 | 自己適用順序ゲート | Phase 11 着手時の確認 |

## sandbox 設計

FC-1〜FC-3 / FC-6〜FC-9 はローカル sandbox（`/tmp/ut-gov-005-failure-sandbox/`）で再現。**本物の `.claude/skills/` および `docs/30-workflows/` を破壊しない**。FC-4 / FC-5 / FC-8 はリポジトリ全体での確認だが、再現は dry-run で行う。

```bash
# sandbox 作成
mkdir -p /tmp/ut-gov-005-failure-sandbox
cp -r .claude/skills/task-specification-creator /tmp/ut-gov-005-failure-sandbox/claude-skill
cp -r docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync /tmp/ut-gov-005-failure-sandbox/workflow

# FC ごとに sandbox 内で再現し、観察ログを記録
# 終了時に rm -rf /tmp/ut-gov-005-failure-sandbox
```

## 実行タスク

1. FC-1〜FC-9 を sandbox / dry-run で再現
2. 各 FC で防御線（AC / TC / 設計原則）が fail-fast することを確認
3. 観察ログを `outputs/phase-06/failure-cases.md` に記録
4. ロールバック手順を各 FC に紐付け
5. 防御線サマリー表を作成
6. スコープ外 FC（FC-8）を `unassigned-task-detection.md` 候補として記録

## 参照資料

| 種別 | パス |
| --- | --- |
| 必須 | `outputs/phase-03/main.md`（リスク表 R-1〜R-8）|
| 必須 | `outputs/phase-04/test-strategy.md`（TC-1〜TC-8）|
| 必須 | `outputs/phase-05/implementation-runbook.md`（Step 6 mirror 同期）|
| 参考 | `docs/30-workflows/skill-ledger-b1-gitattributes/phase-06.md`（FC フォーマット模倣元）|

## 依存Phase明示

- Phase 3 / 4 / 5 成果物を参照する。

## 成果物

| パス | 役割 |
| --- | --- |
| `outputs/phase-06/failure-cases.md` | FC-1〜FC-9 / 検出方法 / 防御線 / ロールバック / 防御線サマリー |

## 完了条件 (DoD)

- [ ] FC-1〜FC-9 が成果物に記述
- [ ] 各 FC に検出コマンドと防御線（AC / TC / Phase）が紐付く
- [ ] ロールバック手順が紐付けされている
- [ ] 防御線サマリー表が作成済
- [ ] sandbox 設計（破壊しない再現）が記述済
- [ ] スコープ外 FC（FC-8）の別タスク化方針記載

## 苦戦箇所・注意

- **本物の skill / workflow を汚さない**: FC 再現は必ず `/tmp/ut-gov-005-failure-sandbox/` で行う。誤って `.claude/` を破壊するとリポジトリ全体が壊れる
- **「気付きにくさ」の言語化**: mirror drift（FC-4）は `git status` には表示されない（両方 tracked のため）。`diff -qr` を明示的に走らせない限り発見不能
- **状態分離（FC-3）の判定難度**: `状態` / `status` / `workflow_state` の 3 語彙のうちどれが正本かを SKILL.md / artifacts.json / index.md のどこで判定するか、Phase 5 Step 4 のテキストで明確化されているか確認
- **FC-9 の循環依存**: 自己適用順序ゲートを破ると検証対象が存在しなくなる。Phase 11 着手前に必ず `rg "縮約テンプレ"` を実行
- **FC-8 のスコープ外宣言**: 「ついでに CI gate も入れたくなる」誘惑があるが、本タスクスコープ外として `unassigned-task-detection.md` に切り出す（TECH-M-02）

## タスク100%実行確認【必須】

- [ ] 本 Phase の実行タスクをすべて確認する。
- [ ] 成果物パスと `artifacts.json` の outputs が一致していることを確認する。
- [ ] 未実行項目は pending または blocked として明示し、完了済みと誤読される表現を残さない。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL の skill 改善であり、アプリケーション統合テストは追加しない。
- 統合検証は `diff -qr` mirror parity、`mise exec -- pnpm typecheck` / `pnpm lint` の副作用なし確認、Phase 11 縮約テンプレ自己適用 smoke で代替する。

## 次 Phase

- 次: Phase 7（AC マトリクス）
- 引き継ぎ: FC-1〜FC-9 検出結果 / 防御線サマリー / sandbox ログ / FC-8 別タスク化方針
