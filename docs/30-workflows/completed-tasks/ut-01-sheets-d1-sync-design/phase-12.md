# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-01-sheets-d1-sync-design |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-29 |
| 上流 | Phase 11（手動 smoke / 縮約テンプレ） |
| 下流 | Phase 13（PR 作成） |
| 状態 | spec_created |
| user_approval_required | false |
| タスク種別 | docs-only / NON_VISUAL / spec_created |
| workflow_state 据え置き | **`spec_created` のまま（Phase 12 close-out で `completed` に書き換えない）** |

## 目的

UT-01 の設計仕様策定を完了させるためのドキュメント更新を実施する。
本タスクは **docs-only / 設計仕様策定タスク** であり、コード実装・実 D1 schema 反映は UT-09 / UT-04 が担うため、
Phase 12 close-out で `workflow_state` を `completed` に書き換えてはならない（`spec_created` のまま据え置く）。

5 必須タスクをすべて完遂し、`phase-12-spec.md` 正本に従って **7 必須成果物（main.md + 6 補助ファイル）** を `outputs/phase-12/` に揃える。`phase12-task-spec-compliance-check.md` は任意ではなく、欠落時は Phase 12 FAIL とする。

## 入力

- `outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md`（NON_VISUAL 代替証跡 3 点）
- `outputs/phase-10/go-no-go.md`
- `outputs/phase-09/main.md`
- `outputs/phase-07/ac-matrix.md`
- `outputs/phase-03/main.md`（MINOR 追跡テーブル TECH-M-01〜04 / TECH-M-DRY-01 / MINOR-M-Q-01）
- `outputs/phase-02/sync-method-comparison.md` / `sync-flow-diagrams.md` / `sync-log-schema.md`
- `outputs/phase-01/main.md`
- `index.md` / `artifacts.json`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`（必須 5 タスク正本）
- `.claude/skills/task-specification-creator/references/phase-template-phase12.md`

## 必須タスク（5 タスク + 最終確認）

### Task 12-1: 実装ガイド作成（Part 1 中学生向け / Part 2 技術者向け）

出力: `outputs/phase-12/implementation-guide.md`

| Part | 対象読者 | 内容 |
| --- | --- | --- |
| Part 1 | 初学者・中学生レベル | 「Sheets と D1 のあいだの『荷物の受け渡し』」アナロジー：Sheets は学級日誌、D1 はサーバーの公式ノート、Workers Cron は「毎時間ノートに書き写しに行く係」、`sync_log` は「いつ・どこまで・成功したかを書き留める当番表」、再同期は「途中で止まったら最後に書き写した行から再開」 |
| Part 2 | 開発者・技術者 | Cron Triggers 採択理由 / バッチサイズ 100 行 / Backoff 1〜32s / 冪等性キー（行ハッシュ + 固有 ID + `idempotency_key`） / `sync_log` 13 カラム論理スキーマ / source-of-truth 優先順位 / 障害時ロールバック判断フロー / Sheets API quota 対処（500 req/100s）/ UT-09 / UT-04 への引き継ぎ事項 |

#### Part 1 専門用語セルフチェック

- 「Cron」 → 「定期的に動く目覚まし時計のようなしくみ」
- 「冪等性」 → 「同じ作業を何回やっても結果が変わらない性質」
- 「バックオフ」 → 「失敗したら少し待ってから再挑戦する作戦」
- 「quota」 → 「1 日に使える回数の上限」

#### Part 2 必須記載項目（一対一対応）

| ID | 項目 | 本タスクでの記載 |
| --- | --- | --- |
| C12P2-1 | TypeScript 型定義 | **該当なし**（docs-only / コード変更なし）と明示宣言 |
| C12P2-2 | API シグネチャ | **該当なし**（実 API は UT-09 で実装）と明示宣言 |
| C12P2-3 | 使用例 | UT-09 が本仕様書のみで実装着手するときの参照フロー（Phase 2 採択方式 → Phase 3 リスク → 引き継ぎ事項）を step-by-step で例示 |
| C12P2-4 | エラー処理 | Phase 2 設計のエラーハンドリング方針（リトライ 3 回 / Backoff 1〜32s / 冪等性確保 / 部分失敗継続 / failed ログ保持）を再掲 |
| C12P2-5 | 設定可能パラメータ・定数 | Cron 間隔 / バッチサイズ / Backoff 上限 / `sync_log` 保持期間 / source-of-truth 優先順位フラグ |

### Task 12-2: システム仕様書更新（Step 1-A/B/C + 条件付き Step 2）

出力: `outputs/phase-12/system-spec-update-summary.md`

| Step | 必須 | 本タスクでの扱い |
| --- | --- | --- |
| Step 1-A | ✅ | UT-01 を「設計仕様策定 完了（spec_created）」として `task-workflow-completed.md` 等の記録に追記 / `index.md` の状態欄は `spec_created` のまま / LOGS.md×2 / topic-map 同波更新 |
| Step 1-B | ✅ | 実装状況テーブルに UT-01 を `spec_created`（`completed` ではない）と記録 |
| Step 1-C | ✅ | 関連タスク（UT-03 / UT-04 / UT-09）の関連タスクテーブルを current facts へ更新 |
| Step 2 | 条件付き | aiworkflow-requirements 仕様への影響: **なし**（本タスクは設計文書のみ。Cloudflare / D1 / Sheets の既存仕様に変更を加えない）→ Step 2 は N/A 宣言で完結 |

#### `spec_created` close-out ルール（最重要）

- workflow root の `状態` 欄を **`spec_created` のまま据え置く**（`completed` に書き換えない）
- 実装完了は UT-09 / UT-04 が担う
- Step 1-A〜1-C は同波更新で完了させるが、状態欄は変更しない

#### 計画系 wording 残存確認（完了前）

```bash
rg -n "仕様策定のみ|実行対象|保留として記録" \
  docs/30-workflows/ut-01-sheets-d1-sync-design/outputs/phase-12/ \
  | rg -v 'phase12-task-spec-compliance-check.md' \
  || echo "計画系 wording なし"
```

### Task 12-3: ドキュメント更新履歴

出力: `outputs/phase-12/documentation-changelog.md`

| 変更ファイル | 種別 | 変更内容 |
| --- | --- | --- |
| `docs/30-workflows/ut-01-sheets-d1-sync-design/index.md` | 新規 | UT-01 タスク仕様 index |
| `docs/30-workflows/ut-01-sheets-d1-sync-design/artifacts.json` | 新規 | Phase 1〜13 機械可読サマリー |
| `docs/30-workflows/ut-01-sheets-d1-sync-design/phase-01.md`〜`phase-13.md` | 新規 | Phase 別仕様書（13 ファイル） |
| `docs/30-workflows/ut-01-sheets-d1-sync-design/outputs/phase-01/`〜`phase-13/` | 新規 | 各 Phase outputs |

加えて MINOR 解決状況を記録:

| MINOR ID | 解決状況 | 解決 Phase |
| --- | --- | --- |
| TECH-M-01（hybrid 案 D の将来オプション） | RECORDED → Task 12-4 unassigned-task-detection に転記 | Phase 12 |
| TECH-M-02（Cron 間隔 staging 測定） | DEFERRED → UT-09 staging で測定 | UT-09 |
| TECH-M-03（partial index D1 サポート確認） | DEFERRED → Phase 4 / UT-04 | Phase 4 / UT-04 |
| TECH-M-04（sync_log 保持期間 UT-08 連動） | DEFERRED → Phase 12 / UT-08 | Phase 12 / UT-08 |

### Task 12-4: 未タスク検出レポート（0 件でも出力必須）

出力: `outputs/phase-12/unassigned-task-detection.md`

SF-03 4 パターン照合 + 本タスク特有検出:

| パターン | 結果 |
| --- | --- |
| 型定義 → 実装 | UT-09（同期ジョブ実装） / UT-04（D1 物理スキーマ）に引き継ぎ |
| 契約 → テスト | UT-09 Phase 4 で test-strategy 確定（本タスク Phase 4 で骨格まで） |
| UI 仕様 → コンポーネント | 該当なし（UI 変更なし） |
| 仕様書間差異 → 設計決定 | TECH-M-01〜04 / TECH-M-DRY-01 / MINOR-M-Q-01 を本 Phase で記録 |

検出された未タスク候補（最低でも下記を記載）:

| ID | 候補タスク | 根拠 | 優先度 |
| --- | --- | --- | --- |
| U-1 | hybrid（webhook + cron fallback）方式の将来評価タスク | TECH-M-01 で MINOR 残置（base case B 安定後の拡張オプション） | LOW |
| U-2 | Cron 間隔の staging 測定タスク | TECH-M-02。UT-09 staging で 6h / 1h / 5min を実測 | MEDIUM（UT-09 内で吸収可） |
| U-3 | partial index D1 サポート確認タスク | TECH-M-03。代替設計（通常 index + WHERE）の最終決定 | LOW |
| U-4 | sync_log 保持期間 / 監視連動タスク | TECH-M-04。UT-08 監視と連動 | LOW |

> **0 件でも出力必須**: 仮にすべて吸収済で 0 件になっても、ファイル自体は作成し「検出 0 件」と明記する。本タスクでは TECH-M-01〜04 / TECH-M-DRY-01 / MINOR-M-Q-01 由来 10 件を記載。

### Task 12-5: スキルフィードバックレポート（改善点なしでも出力必須）

出力: `outputs/phase-12/skill-feedback-report.md`

task-specification-creator skill 適用所感:

- **良かった点**: docs-only / NON_VISUAL 縮約テンプレが UT-GOV-005 で第一適用されたことで、本タスクは第 N 適用例として迷いなく Phase 11 を 3 点固定で完結できた
- **改善観察事項**:
  - 設計タスク特有「実装は別タスク」の境界明示が Phase 4（テスト戦略）で曖昧になりがち → 「設計検証戦略」読替えルールの明文化候補
  - `workflow_state=spec_created` 据え置きルールが Phase 12 で書換え事故になりやすい → SKILL.md or phase-12-spec.md の「state ownership 書換え禁止」赤字化候補
  - 縮約テンプレ第一適用例 UT-GOV-005 への参照リンクは `phase-template-phase11.md` に既記載されており、第 N 適用がスムーズ
- **苦戦箇所**: なし（第一適用例が存在するため迷いなし）
- **後続タスクへの引き継ぎ**: 本タスクの Phase 11 outputs を UT-03 / UT-09 等の docs-only / spec_created 系で参考として参照可能

> **改善点なしでも出力必須**: 0 件でもファイル作成し「改善観察事項なし」と明記する。

### Task 12-6: 最終確認（compliance-check）

出力: `outputs/phase-12/phase12-task-spec-compliance-check.md`

本タスクが docs-only / NON_VISUAL 縮約テンプレおよび phase-12-spec.md の必須 5 タスクに準拠しているかの自己 compliance check。

| チェック項目 | 期待 | 実測 |
| --- | --- | --- |
| Phase 11 outputs = 3 点固定 | main / manual-smoke-log / link-checklist のみ | （実行時に記入） |
| screenshot 不存在 | 0 ファイル | （実行時に記入） |
| Task 12-1 implementation-guide.md（Part 1 / Part 2） | 存在 / Part 1 にアナロジー / Part 2 に C12P2-1〜5 一対一 | （実行時に記入） |
| Task 12-2 system-spec-update-summary.md | Step 1-A/B/C + Step 2 3 値判定 | （実行時に記入） |
| Task 12-3 documentation-changelog.md | 変更ファイル一覧 + MINOR 解決状況 | （実行時に記入） |
| Task 12-4 unassigned-task-detection.md | 4 件記載（U-1〜U-10） | （実行時に記入） |
| Task 12-5 skill-feedback-report.md | 観察事項記載 | （実行時に記入） |
| `workflow_state=spec_created` 据え置き | `index.md` 状態欄が `spec_created` のまま | （実行時に記入） |
| 計画系 wording 残存 | 0 件 | （実行時に記入） |
| 7 ファイル命名一致 | タイポなし | （実行時に記入） |

## 実行タスク

1. Task 12-1〜12-5 を順次作成（Part 2 必須 5 項目を C12P2-1〜5 一対一で記述）
2. TECH-M-01〜04 / TECH-M-DRY-01 / MINOR-M-Q-01 を Task 12-3 changelog で記録 / Task 12-4 unassigned-task-detection に U-1〜U-10 として転記
3. Task 12-2 で aiworkflow-requirements 影響なし宣言 / Step 2 N/A 宣言を明記
4. 計画系 wording 残存確認スクリプトを実行（残存 0 を `compliance-check` に記録）
5. **`index.md` の `状態` 欄が `spec_created` のままであることを確認**（書き換え禁止）
6. Task 12-6 compliance-check を作成し全項目 PASS 確認
7. 7 ファイル命名一致確認（タイポなし）
8. `outputs/phase-12/` に `main.md` + 6 補助ファイルが揃ったか `ls` で確認

## 参照資料

### システム仕様（task-specification-creator skill）

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Phase 12 必須 5 タスク正本 | `.claude/skills/task-specification-creator/references/phase-12-spec.md` | 5 タスク + 最終確認の正本 |
| Phase 12 縮約テンプレ | `.claude/skills/task-specification-creator/references/phase-template-phase12.md` | Part 2 5 項目チェック |
| Phase 12 completion checklist | `.claude/skills/task-specification-creator/references/phase-12-completion-checklist.md` | C12P2-1〜5 |
| 第一適用例 Phase 12 | `docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/outputs/phase-12/` | drink-your-own-champagne 適用例 |

| 種別 | パス |
| --- | --- |
| 必須 | `outputs/phase-11/` 配下 3 点 |
| 必須 | `outputs/phase-10/go-no-go.md` |
| 必須 | `outputs/phase-03/main.md`（MINOR 追跡） |
| 必須 | `outputs/phase-02/` 配下 3 点（設計成果物） |
| 必須 | `outputs/phase-01/main.md`（要件） |

## 依存Phase明示

- Phase 1〜11 の成果物すべてを参照する。
- 特に Phase 2（設計成果物）/ Phase 3（MINOR 追跡）/ Phase 11（縮約テンプレ 3 点）が Task 12-1 / 12-3 / 12-4 / 12-6 の根拠。

## 成果物

| パス | 役割 |
| --- | --- |
| `outputs/phase-12/implementation-guide.md` | Part 1 アナロジー / Part 2 5 項目（C12P2-1〜5 一対一） |
| `outputs/phase-12/system-spec-update-summary.md` | Step 1-A/B/C + Step 2 N/A 宣言 / aiworkflow-requirements 影響なし宣言 |
| `outputs/phase-12/documentation-changelog.md` | 変更ファイル一覧 + MINOR 6 件 + 既存実装差分 |
| `outputs/phase-12/unassigned-task-detection.md` | U-1〜U-10 検出 / SF-03 4 パターン照合 |
| `outputs/phase-12/skill-feedback-report.md` | task-specification-creator 適用所感（改善観察事項） |
| `outputs/phase-12/main.md` | Phase 12 全体サマリ / 7 必須成果物 ledger / state ownership |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | 本タスク自身の縮約テンプレ + 必須 5 タスク準拠自己 compliance check |

## 完了条件 (DoD)

- [ ] 7 ファイル作成済（命名タイポなし）
- [ ] Task 12-1: Part 1 アナロジー + Part 2 C12P2-1〜5 一対一
- [ ] Task 12-2: Step 1-A/B/C 記載 + Step 2 N/A 宣言
- [ ] Task 12-3: 変更ファイル + TECH-M-01〜04 / TECH-M-DRY-01 / MINOR-M-Q-01 解決状況
- [ ] Task 12-4: U-1〜U-10 記載（0 件でも出力必須を満たす）
- [ ] Task 12-5: 観察事項記載（改善点なしでも出力必須を満たす）
- [ ] Task 12-6: 全項目 PASS
- [ ] **`index.md` の `状態` 欄が `spec_created` のまま**
- [ ] 計画系 wording 残存 0 件
- [ ] aiworkflow-requirements 影響なし宣言が system-spec-update-summary.md に明記

## 苦戦箇所・注意

- **`workflow_state` 誤書換え（最重要）**: docs-only / spec_created タスクでは Phase 12 close-out 時に状態を `completed` に書き換えてはならない。本タスクは設計仕様策定のみで、実装完了は UT-09 / UT-04 が担う
- **Part 2 「該当なし」の空欄化**: docs-only で C12P2-1 / C12P2-2 を空欄にすると compliance-check が機械的に FAIL する。「該当なし」と理由を 1 行で明示宣言すること
- **計画系 wording 残存**: Task 12-2 / 12-3 で「実行対象」「保留として記録」を書いて忘れがち。完了前 grep を必ず実行
- **Part 1 アナロジーの過度な抽象化**: 「Cron pull 同期」と書いただけでは中学生に届かない。「学級日誌をサーバーの公式ノートに毎時間書き写す係」のような具体物に喩える
- **MINOR 転記漏れ**: TECH-M-01〜04 / TECH-M-DRY-01 / MINOR-M-Q-01 を必ず Task 12-3 changelog および Task 12-4 unassigned-task-detection の双方に記録（一方だけだと後続タスクで参照困難）
- **UT-09 への引き継ぎ事項の曖昧化**: 「実装で判断」記述は禁止。Cron 間隔 / バッチサイズ / Backoff / 冪等性キー / sync_log 13 カラム / ロールバック判断は本仕様書で確定させる（AC-9）
- **7 ファイル命名タイポ**: `main.md` と `phase12-task-spec-compliance-check.md`（ハイフン位置注意）を含め、類似名を作らない

## タスク100%実行確認【必須】

- [ ] 本 Phase の実行タスクをすべて確認する
- [ ] 成果物パスと `artifacts.json` の outputs（main.md + 6 補助）が一致していることを確認する
- [ ] 未実行項目は pending または blocked として明示し、完了済みと誤読される表現を残さない
- [ ] **`index.md` の `状態` 欄が `spec_created` のままであることを確認する**

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL の設計仕様策定タスクであり、アプリケーション統合テストは追加しない
- 統合検証は計画系 wording grep / 7 ファイル命名 `ls` 検査 / state ownership 目視確認で代替する
- 後続実装タスク（UT-09 / UT-04）が本仕様書のみで着手できることを AC-9 で保証

## 次 Phase

- 次: Phase 13（PR 作成）
- 引き継ぎ: 7 必須成果物 / TECH-M-01〜04 / TECH-M-DRY-01 / MINOR-M-Q-01 解決状況 / U-1〜U-10 / `workflow_state=spec_created` 据え置き宣言
