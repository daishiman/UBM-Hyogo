# Phase 11: 手動テスト（NON_VISUAL）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-claude-code-permissions-apply-001 |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動テスト |
| 作成日 | 2026-04-28 |
| 上流 | Phase 10（最終レビュー） |
| 下流 | Phase 12（ドキュメント更新） |
| 状態 | blocked（Phase 10 Go かつ Phase 5 実反映完了まで着手禁止） |
| user_approval_required | false |
| visualEvidence | **NON_VISUAL** |
| Issue | [#140](https://github.com/daishiman/UBM-Hyogo/issues/140) |
| 元タスク | `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/` |

## 目的

Phase 5 で実機反映した settings 3 層 + `cc` alias に対して、Phase 4 / Phase 6 で確定した
TC-01〜TC-05 / TC-F-01〜TC-F-02 / TC-R-01 を **実機で実行**し、CLI 出力テキストを
`outputs/phase-11/manual-smoke-log.md` に主証跡として残す。

元タスク（`task-claude-code-permissions-decisive-mode`）が `spec_created` で残したテンプレートを
**実観測ログで埋める**のが本 Phase の責務。

## NON_VISUAL 宣言

| 項目 | 値 |
| --- | --- |
| タスク種別 | implementation（host 環境ファイル書き換え） |
| 非視覚的理由 | UI 表示の変更ゼロ。検証対象は `claude` プロセスのモード表示文字列および permission prompt の有無のみ |
| 主証跡 | `outputs/phase-11/manual-smoke-log.md`（CLI 出力テキスト + Claude バージョン + ${TS}） |
| リンク証跡 | `outputs/phase-11/link-checklist.md`（NON_VISUAL 代替証跡の参照整合） |
| screenshot | **取得しない**（`outputs/phase-11/screenshots/` 自体作成しない・`.gitkeep` も置かない） |
| placeholder PNG | 禁止（[UBM-010] 反映：UI 変更ゼロのタスクで PNG を evidence にしない） |
| 3 層評価 | Semantic のみ実施（Visual / AI UX は **N/A** と明記） |

## 入力

| 種別 | パス | 用途 |
| --- | --- | --- |
| Phase 4 test-scenarios | `outputs/phase-04/test-scenarios.md` | 実行対象 TC の定義 |
| Phase 4 expected-results | `outputs/phase-04/expected-results.md` | PASS 判定基準 |
| Phase 5 runbook-execution-log | `outputs/phase-05/runbook-execution-log.md` | 実機反映の事実関係（${TS} 含む） |
| Phase 5 backup-manifest | `outputs/phase-05/backup-manifest.md` | rollback 元（TC-R-01 の前提） |
| Phase 6 fail-path-tests | `outputs/phase-06/fail-path-tests.md` | TC-F-01 / TC-F-02 シナリオ |
| Phase 10 final-review-result | `outputs/phase-10/final-review-result.md` | Go/No-Go 判定 |
| 元タスク Phase 11 テンプレ | `completed-tasks/task-claude-code-permissions-decisive-mode/outputs/phase-11/manual-smoke-log.md` | 記録フォーマット継承元 |

## テスト実行計画

| 順序 | TC | 概要 | 期待結果 | 種別 |
| --- | --- | --- | --- | --- |
| 1 | TC-01 | `cc` 起動直後のモード表示 | `bypassPermissions` を含む文字列 | 正常系 |
| 2 | TC-02 | reload / session 切替後のモード維持 | `bypassPermissions` 維持 | 正常系 |
| 3 | TC-03 | 別プロジェクトでの `cc` 起動 | 設計どおり（project 層 settings の override 反映） | 正常系 |
| 4 | TC-04 | whitelist 効果（`--dangerously-skip-permissions` 外して pnpm 実行） | prompt 出ない（allow 一致時） | 正常系 |
| 5 | TC-05 | `permissions.deny` 実効性（force push 禁止操作） | block / 前提タスク結論と整合 | 整合性確認 |
| 6 | TC-F-01 | 不正な `defaultMode` 値 | error / fallback 観測 | 失敗系 |
| 7 | TC-F-02 | alias typo（`--permission-mod` 等） | unknown flag エラー | 失敗系 |
| 8 | TC-R-01 | alias 行 grep 確認 | `^alias cc=` が定義ファイルで 1 ヒット | 整合性確認 |

## 手順

1. **環境前提確認**:
   - `claude --version` の出力を `manual-smoke-log.md` 冒頭に記録
   - `${TS}`（実施日時 ISO8601）を冒頭メタに固定
   - Phase 5 の `backup-manifest.md` から backup 4 ファイルが存在することを再確認
2. **必須前提タスク完了状態の取り込み**:
   - `task-claude-code-permissions-deny-bypass-verification-001` の結論を `manual-smoke-log.md` の TC-05 セクション「前提タスク結論」欄に転記
   - 結論が「deny は bypass 下で実効しない」場合、TC-05 の判定基準を「block されないことを確認」に切り替える（Phase 4 expected-results と整合）
3. **TC-01〜TC-04 順次実行**:
   - 各 TC ごとに「実行コマンド」「期待」「実観測（CLI 出力テキストそのまま）」「判定（PASS/FAIL/BLOCKED）」を記録
   - 出力中に API token / OAuth token / `.env` 実値が混入しそうな場合は **記録前にマスク**（CLAUDE.md 準拠）
4. **TC-05 整合性確認**:
   - 前提タスク結論に応じた期待値で実行
   - 結論が取り込めない場合は `BLOCKED` で記録し、Phase 12 で `docs-ready-execution-blocked` への倒し方を明示
5. **TC-F-01 / TC-F-02 失敗系実行**:
   - JSON 不正値・alias typo を意図的に注入し、エラー出力を取得
   - 完了後は **必ず Phase 5 の正規値に戻す**（`backup-manifest.md` 参照）
6. **TC-R-01 alias 整合性確認**:
   - `type cc` 1 行 と `grep -nE '^alias cc=' <定義ファイル>` 1 ヒットの一致を記録
7. **3 層評価サマリ記録**:
   - Semantic: PASS/FAIL（モード表示が `bypassPermissions` 文字列と一致）
   - Visual: **N/A**（UI 変更ゼロ）
   - AI UX: **N/A**（UI 変更ゼロ）
8. **実行不可時の取り扱い（前提タスク未完など）**:
   - 全 TC を `NOT EXECUTED` evidence として明記
   - Phase 12 で `system-spec-update-summary.md` を `docs-ready-execution-blocked` に倒す手順へ分岐するよう `main.md` に注記
9. **link-checklist.md 作成**:
   - `index.md` / `phase-*.md` / `artifacts.json` / Phase 11 outputs のリンクと artifact 名を確認
   - `.claude/skills/task-specification-creator` と `.claude/skills/aiworkflow-requirements` の参照先（Phase 11/12 テンプレート、`claude-code-settings-hierarchy.md`）を列挙
   - `screenshots/` 非存在確認と secrets grep 結果を記録

## 結果記録フォーマット（`manual-smoke-log.md`）

```markdown
# manual-smoke-log

- 実施日時 (${TS}): YYYY-MM-DDTHH:MM:SS+09:00
- claude --version: <出力そのまま>
- 実施ホスト: <hostname / OS>
- 主証跡カテゴリ: NON_VISUAL（UI 変更ゼロ）

## メタ情報
- screenshot: 取得しない（理由: UI 表示変更がない）
- 3 層評価: Semantic のみ / Visual N/A / AI UX N/A

## TC-XX: <名称>
- 実行コマンド: `<command>`
- 期待結果: <expected>
- 実観測結果（CLI 出力そのまま、token 等はマスク）:
  ```
  <stdout/stderr>
  ```
- 判定: PASS | FAIL | BLOCKED | NOT EXECUTED
- 備考: <env blocker / 前提タスク結論 / 補足>
```

## 成果物

artifacts.json の Phase 11 outputs と 1:1 一致:

| ファイル | 内容要件 |
| --- | --- |
| `outputs/phase-11/main.md` | 実行サマリ。TC ごとの判定一覧、3 層評価結果（Semantic のみ）、Phase 12 着手可否、`NON_VISUAL` 宣言の再掲 |
| `outputs/phase-11/manual-smoke-log.md` | TC-01〜TC-05 / TC-F-01〜TC-F-02 / TC-R-01 の CLI 出力ログ。${TS} と claude バージョン、screenshot を作らない理由をメタ情報として明記 |
| `outputs/phase-11/link-checklist.md` | NON_VISUAL 代替証跡。workflow 内リンク、artifact 名、skill 参照先、`screenshots/` 非存在、secrets grep 結果を表で記録 |

> `screenshots/` ディレクトリおよび `.gitkeep` は **作成しない**（NON_VISUAL）。

## 完了条件

- [ ] `manual-smoke-log.md` 冒頭に ${TS} / `claude --version` / NON_VISUAL 理由が記録されている
- [ ] `link-checklist.md` に workflow 内リンク / artifact 名 / skill 参照先 / screenshot 非存在 / secrets grep 結果が記録されている
- [ ] TC-01〜TC-05 / TC-F-01〜TC-F-02 / TC-R-01 の 8 件すべてに判定（PASS/FAIL/BLOCKED/NOT EXECUTED）が記録されている
- [ ] `main.md` に 3 層評価結果（Semantic 結果 + Visual/AI UX は N/A 明記）がある
- [ ] CLI 出力中に `.env` 実値 / API token / OAuth token が混入していない（grep で 0 件）
- [ ] `outputs/phase-11/screenshots/` が **存在しない**（NON_VISUAL の物理的担保）
- [ ] artifacts.json の `phases[10].outputs` と完全一致

## 検証コマンド

```bash
# screenshot ディレクトリ非存在確認（NON_VISUAL の物理担保）
test ! -e docs/30-workflows/task-claude-code-permissions-apply-001/outputs/phase-11/screenshots && echo "NON_VISUAL OK"

# 主証跡の存在
test -f docs/30-workflows/task-claude-code-permissions-apply-001/outputs/phase-11/manual-smoke-log.md && \
  test -f docs/30-workflows/task-claude-code-permissions-apply-001/outputs/phase-11/main.md && \
  test -f docs/30-workflows/task-claude-code-permissions-apply-001/outputs/phase-11/link-checklist.md && echo "outputs OK"

# secrets 混入チェック
grep -rE '(sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|CLOUDFLARE_API_TOKEN=)' \
  docs/30-workflows/task-claude-code-permissions-apply-001/outputs/phase-11/ && echo "NG" || echo "secrets OK"

# TC 件数
grep -cE '^## TC-' docs/30-workflows/task-claude-code-permissions-apply-001/outputs/phase-11/manual-smoke-log.md  # → 8
```

## 依存 Phase

- 上流: Phase 10（最終レビュー Go 判定）
- 上流（外部）: 必須前提タスク 2 件の completed 状態（TC-05 解釈に必要）
- 下流: Phase 12（本 Phase 完了が gate）

## 想定 SubAgent / 並列性

- 単一 agent 直列実行（実機状態を変えながら順序依存があるため）
- 結果記録のみ別 agent で並列化可（テンプレ穴埋め）

## ゲート判定基準

- TC-01〜TC-04 / TC-F-01〜TC-F-02 / TC-R-01: **すべて PASS**で Phase 12 着手 Go
- TC-05: 前提タスク結論と整合していれば PASS、結論未取得なら `BLOCKED` で Phase 12 を `docs-ready-execution-blocked` 経路へ
- いずれかの TC で FAIL → Phase 5（実装）または Phase 2（設計）へループバック判定を `main.md` に記録
- 全件 `NOT EXECUTED` の場合 → Phase 12 で `docs-ready-execution-blocked` 必須

## リスクと対策

| リスク | 対策 |
| --- | --- |
| TC-F-01/02 実行後に環境を壊したまま放置 | Phase 5 backup から復旧する手順を `main.md` に明記し、TC-F の各記録末尾に「復旧確認」欄を必須化 |
| CLI 出力に token / OAuth 値が混入 | 記録前マスクを必須化、完了条件で grep 0 件を担保 |
| placeholder PNG を evidence に流用 | `screenshots/` 自体作らない物理担保 + 検証コマンドで非存在確認 |
| 前提タスク未完了で TC-05 が解釈不能 | `BLOCKED` 記録 + Phase 12 で `docs-ready-execution-blocked` に倒す |
| Visual/AI UX 評価を誤って「PASS」記録 | `main.md` テンプレで Visual/AI UX 欄を「N/A（UI 変更ゼロ）」固定文字列にする |

## 実行タスク

本 Phase の実行タスクは上記「手順」セクションを正本とする。blocked 状態の Phase は、上流 gate が Go になるまで実行しない。

## 参照資料

- `docs/30-workflows/task-claude-code-permissions-apply-001/index.md`
- `docs/30-workflows/task-claude-code-permissions-apply-001/artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/references/claude-code-settings-hierarchy.md`

## 統合テスト連携

NON_VISUAL / host 環境設定タスクのため、UI 統合テストは対象外。検証は各 Phase の CLI 証跡、JSON validity、artifact 同期、Phase 11 manual smoke log で担保する。
