# Phase 12: ドキュメント更新 — ut-web-cov-04-admin-lib-ui-primitives-coverage

[実装区分: 実装仕様書] — Phase 11 evidence をもとに 6 種の必須成果物（implementation-guide / system-spec-update / documentation-changelog / unassigned-task-detection / skill-feedback / phase12-compliance-check）を作成する手順を確定する。後続実装サイクルで実ファイル化する成果物を仕様として固定するため。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-04-admin-lib-ui-primitives-coverage |
| phase | 12 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 実装区分 | 実装仕様書 |
| 判定根拠 | Phase 11 で得た coverage 実測値・smoke ログを起点に、PR 本文 (Phase 13) の元になる implementation-guide.md を含む 6 種ドキュメントを作成する。後続実装で実ファイル化されるため仕様書として固定する必要がある。 |

## 目的

Phase 11 の coverage 実測 evidence と manual smoke ログを基に、本タスクのドキュメント差分・PR 本文素材・未タスク検出・skill feedback・compliance check を `outputs/phase-12/` 配下に作成する手順を確定する。各成果物の見出し構造・記載粒度・中学生レベル概念説明セクションの位置を本フェーズで固定する。

## 中学生レベル概念説明（Part 1）

このタスクで何をするのか、専門用語を使わずに説明する。

- ソフトウェアの中には「テスト」というしくみがあり、書いたコードが正しく動くかを自動で確かめる。
- 「カバレッジ」とは、書いたコードのうちテストで実際に動かされた割合のこと。100% に近いほど、テストでチェック済みの範囲が広い。
- 今回のサイトの管理画面（admin）の裏側コードと、画面の部品（ボタン・モーダル・スイッチなど）は、テストでチェックされている割合が低かった（場所によっては 0%）。
- そこで、コード本体は触らず、テストだけを書き足して、チェック済みの割合を 85% 以上に引き上げる。これにより、将来コードを変えたときに「壊れていないか」自動で気付けるようになる。
- 数値合わせのためにチェック対象から外す「除外設定」はしない。ちゃんとテストを書いて達成する。

## 成果物 1: `outputs/phase-12/implementation-guide.md`

PR 本文 (Phase 13) の元素材。Part 1（中学生レベル）と Part 2（技術者レベル）の二段構成。

### Part 1（中学生レベル）

- 何をしたか（テストを足した、コード本体は触っていない）
- なぜしたか（カバレッジが低くて、将来壊れたときに気付けないから）
- 結果どうなったか（カバレッジ前後の数値を 1 行で）

### Part 2（技術者レベル）

| セクション | 記載内容 |
| --- | --- |
| 概要 | task ID / wave / mode / NON_VISUAL / production code 改変なし |
| 変更ファイル一覧 | `git diff main...HEAD --name-only` の出力をそのまま転記。新規 11 件 + 既存拡張 2 件 + 既存縮小 0 or 1 件 |
| テスト追加内容 | Phase 2 ケース表の 13 モジュール × ケース総数を 1 行ずつ要約 |
| coverage 結果 | Phase 11 `coverage-diff.md` の対照表をそのまま転記 |
| 検証コマンド | `pnpm install` / `pnpm typecheck` / `pnpm lint` / `pnpm --filter @ubm-hyogo/web test` / `pnpm --filter @ubm-hyogo/web test:coverage` / `pnpm --filter @ubm-hyogo/web build` |
| Phase 13 PR テンプレ参照ポイント | `.claude/commands/ai/diff-to-pr.md` の Summary / Coverage / Test plan / 変更ファイル / スクリーンショット欄への対応関係 |
| 不変条件適合 | #5 / #6 / #11 / #13 各 1 行 |
| 残存課題 | 0 件 / もしくは Phase 12 unassigned-task-detection への参照 |

## 成果物 2: `outputs/phase-12/documentation-changelog.md`

本タスクで触ったドキュメント差分。テスト追加のみのタスクのため通常は空に近いが、以下が候補:

| 候補 | 記載判断 |
| --- | --- |
| `docs/30-workflows/ut-web-cov-04-admin-lib-ui-primitives-coverage/` 配下 13 仕様書 | 全件「新規作成」または「更新」を 1 行ずつ |
| `docs/30-workflows/ut-web-cov-04-admin-lib-ui-primitives-coverage/outputs/phase-{01..13}/` | 各 main.md の作成有無 |
| 既存 docs（specs/auth など） | 触らないため変更なしを明記 |

ない場合も「変更なし」と明記する（成果物自体は作成必須）。

## 成果物 3: `outputs/phase-12/system-spec-update-summary.md`

aiworkflow-requirements への反映候補。本タスク由来の正本仕様 update 候補:

| 候補 | 反映先 | 提案内容 |
| --- | --- | --- |
| `apps/web` coverage gate を Stmts/Lines/Funcs ≥85% / Branches ≥80% で正本化 | aiworkflow-requirements 配下 references | 既存 gate 文言があれば差分案、無ければ新規追記提案 |
| admin lib テストの mock 規約（`next/headers` cookies stub / `globalThis.fetch` 差し替え / `vi.stubEnv("INTERNAL_AUTH_SECRET", ...)` ） | aiworkflow-requirements の test 規約 | mock 例を 1 ブロックで追記提案 |
| barrel ファイル (icons.ts / ui/index.ts) の import smoke 規約 | aiworkflow-requirements | barrel テスト雛形を追記提案 |

提案のみ。本仕様書フェーズでは aiworkflow-requirements 本体を編集しない（要 user approval）。

## 成果物 4: `outputs/phase-12/phase12-task-spec-compliance-check.md`

13 phase 仕様書の compliance 自己チェック:

| チェック項目 | 確認方法 |
| --- | --- |
| 各 Phase 冒頭に `[実装区分: ...]` が明記されている | grep `^\[実装区分:` |
| メタ情報 taskType が `code-impl` で統一されている | 表確認 |
| CONST_005 必須項目が Phase 5 / Phase 7 に揃っている | 変更対象 / シグネチャ / 入出力 / テスト方針 / 実行コマンド / DoD |
| Phase 12 が中学生レベル概念説明を含む | Part 1 セクション存在確認 |
| outputs 13 ディレクトリが index.md に列挙されている | index.md outputs セクション |
| approval gate / 自走禁止操作が Phase 1 / Phase 10 / Phase 13 に表で存在 | grep `approval gate` |
| 不変条件 #5 / #6 / #11 / #13 適合確認が Phase 3 / Phase 10 にある | 表確認 |
| 各 Phase の「タスク100%実行確認」が埋まっている | チェックリスト確認 |

各項目を ✅/❌ で記録し、❌ がある場合は当該 Phase 仕様書を修正する（本サイクル内）。

## 成果物 5: `outputs/phase-12/skill-feedback-report.md`

skill 適用上の気づき。改善点なしでも作成必須:

| 観点 | 記載内容 |
| --- | --- |
| task-specification-creator 適用感 | 13 phase 構造で本タスクの単一責務（テスト追加のみ）を表現できたか |
| aiworkflow-requirements 適用感 | テスト規約 / coverage gate / mock 戦略を引けたか、不足参照は何か |
| Progressive Disclosure | resource-map / quick-reference / topic-map / keywords のどれが有効だったか |
| 改善提案 | 例: barrel 専用テスト雛形の skill 化、admin lib mock 共通 fixture の references 追加 |

改善点 0 でも「特になし」を明記して提出する。

## 成果物 6: `outputs/phase-12/unassigned-task-detection.md`

本タスク完了時点で残存する coverage<80% モジュールの検出:

| 確認手順 | 内容 |
| --- | --- |
| Phase 11 `coverage-after.json` を全件走査 | 本タスク scope 外で <80% の `apps/web/src/**` が残っていないか |
| 残存ファイルがある場合 | ファイル名 / 現値 / 推定責務（admin component / public component / auth lib のどれか）を記録し、該当する UT-WEB-COV-01 / 02 / 03 / 別タスクへの委譲先候補を明記 |
| 0 件の場合 | 「未タスク 0 件」と明記し、本 wave (ut-coverage 2026-05) の完了条件への寄与を 1 行で記す |

CONST_007: 本タスク本体はサイクル内完了。未タスク検出は次サイクルの起票候補として記録するに留める（本サイクルでは新規仕様書を作らない）。

## 成果物 7: `outputs/phase-12/main.md`

上記 6 成果物のサマリインデックス。各成果物の絶対パスと 1 行サマリを並べる。

## 参照資料

- Phase 7 AC マトリクス
- Phase 11 evidence (`coverage-diff.md` / `manual-smoke-log.md` / `link-checklist.md`)
- skill: `task-specification-creator`, `aiworkflow-requirements`
- `.claude/commands/ai/diff-to-pr.md`（Phase 13 で参照する PR テンプレ）

## 実行手順

- 対象 directory: `docs/30-workflows/ut-web-cov-04-admin-lib-ui-primitives-coverage/`
- 本仕様書作成フェーズでは `outputs/phase-12/` 配下の実ファイルを作らない。後続実装サイクルで本 runbook に従い 7 ファイルを作成する。
- 実 secret 値・OAuth トークン値・op:// 参照解決値をどの成果物にも書かない。

## 統合テスト連携

- 上流: `06c-A-admin-dashboard`
- 下流: `09b-A-observability-sentry-slack-runtime-smoke`

## 多角的チェック観点

- 不変条件 #5 / #6 / #11 / #13 適合
- 未実装 / 未実測を PASS と扱わない（implementation-guide の coverage 表に `?` 残存禁止）
- 中学生レベル概念説明 (Part 1) と技術者レベル (Part 2) を分離記載する
- placeholder と実測値を分離する
- skill 適合（`task-specification-creator` / `aiworkflow-requirements`）

## サブタスク管理

- [ ] implementation-guide.md の Part 1 / Part 2 構造を確定する
- [ ] documentation-changelog.md の差分対象を列挙する
- [ ] system-spec-update-summary.md の反映候補 3 件を確定する
- [ ] phase12-task-spec-compliance-check.md のチェック項目 8 件を埋める
- [ ] skill-feedback-report.md の 4 観点に記述する
- [ ] unassigned-task-detection.md で残存 <80% モジュールを検出する
- [ ] outputs/phase-12/main.md を作成する

## 成果物

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/unassigned-task-detection.md`

## 完了条件

- 7 成果物全てが `outputs/phase-12/` 配下に存在する（後続実装サイクル時点）
- implementation-guide.md に Part 1（中学生）/ Part 2（技術者）が両方ある
- coverage 結果表に Phase 11 実測値が転記されている（`?` が残っていない）
- compliance-check の 8 項目全てが ✅ である
- unassigned-task-detection.md に残存 <80% モジュールの有無が明記されている
- secret 実値がどの成果物にも含まれていない

## タスク100%実行確認

- [ ] 実装区分が冒頭に明記されている
- [ ] 7 成果物の作成手順が個別に記述されている
- [ ] 中学生レベル概念説明 (Part 1) が implementation-guide.md と本 phase 仕様書本体の両方に存在する
- [ ] 実装、deploy、commit、push、PR を実行していない（本仕様書作成フェーズの責務として）

## 次 Phase への引き渡し

Phase 13 へ次を渡す: PR 本文の元になる `outputs/phase-12/implementation-guide.md`（Part 2 の Coverage 表 / 変更ファイル一覧 / 検証コマンド / 不変条件適合）、`unassigned-task-detection.md` の残課題有無、approval gate 最終表、Phase 11 evidence 配置先（PR 本文に貼り付ける coverage-diff.md / manual-smoke-log.md の参照リンク）。
