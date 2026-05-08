# Phase 12 — ドキュメント更新

実装区分: ドキュメントのみ実装（コード変更なし、09e / 09f 実体作成済）

> 元タスク: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-20-w2-par-screen-blueprints-public-and-member.md`
> Phase 種別: NON_VISUAL docs-only（spec authoring）
> 出力先ベース: `docs/30-workflows/task-20-w2-screen-blueprints-public-and-member/outputs/phase-12/`

> docs-only タスクのため apps / packages のコード変更はない。ただし本タスクの実成果物は `09e` / `09f` の 2 markdown であるため、`workflow_state` は `implemented-local`、Phase 13 は `blocked_pending_user_approval` とする。

## 0. 必須成果物一覧（Task 12-1 〜 12-7）

| # | ファイル | 役割 |
|---|---------|------|
| 12-1 | `main.md` | Phase 12 トップ index（各成果物の status と相対 path を一望） |
| 12-2 | `implementation-guide.md` | Part 1 / Part 2 を含む実装手順サマリー（後続 task 影響範囲含む） |
| 12-3 | `system-spec-update-summary.md` | `docs/00-getting-started-manual/specs/` および CLAUDE.md への影響整理（Step 1 / Step 2A/2B） |
| 12-4 | `documentation-changelog.md` | 変更ファイル一覧と validator 結果 |
| 12-5 | `unassigned-task-detection.md` | 未タスク化候補（0 件でも理由明記） |
| 12-6 | `skill-feedback-report.md` | task-specification-creator スキルへの改善点 or 改善点なし |
| 12-7 | `phase12-task-spec-compliance-check.md` | Task 12-1〜12-6 の準拠チェック |

すべて `outputs/phase-12/` 直下に配置する。

## 1. `main.md`

必須セクション:

- 概要: 「task-20 screen-blueprints-public-and-member の Phase 12 ドキュメント更新成果物」
- 必須 6 成果物 status 表（PASS / PENDING / N/A）
- Phase 11 連動: `outputs/phase-11/main.md` の状態語彙（`PASS_DOCS_ONLY_ARTIFACTS_SYNCED`）を引用
- Phase 13 への引き継ぎ: 「PR 作成は Phase 13 で user 承認後に実施」と明記
- workflow_state: `implemented-local` の根拠（09e / 09f 実体作成済、commit / PR は user gate）

## 2. `implementation-guide.md`

### Part 1: アナロジー（中学生レベル）

- 「画面 blueprint」を「家を建てる前の設計図」に例える。実装担当者（task-11..14）は本仕様書 09e / 09f の §X を見れば、JSX を組み、コピーを貼り、状態を作り、API をつなぐところまで迷わず到達できる。設計図に書かれていない色や線の太さ（視覚値）は、別の図面（09b デザイントークン）にしかない、という分担を強調する。

### Part 2: 実装詳細（C12P2-1 〜 C12P2-5 充足）

| # | 必須記述 | 本タスクでの該当 |
|---|---------|------------------|
| C12P2-1 TypeScript 型定義 | （docs-only タスクのため N/A、関連 spec として後続 task-11..14 で page props / state 型を定義する旨を明記） | 09e / 09f §X.5 props/state 表を引き継ぎ |
| C12P2-2 API シグネチャ | §X.4 API 表（method / endpoint / trigger / 状態反映） | 現行 API 正本と一致 |
| C12P2-3 使用例 | 各画面 §X.1 JSX inline 一字一句転記 | prototype L<a>-L<b> 範囲 |
| C12P2-4 エラー処理 | 状態遷移 mermaid `loading --> error: 4xx/5xx` / login 5+1 状態の `unregistered` `rules_declined` `deleted` `error` 派生 | §X.3 |
| C12P2-5 設定値 | （docs-only タスクのため設定値 N/A、token 値は 09b owner） | §X.7 token §番号 link |

### 後続タスクへの影響範囲セクション（必須）

| 後続 task | 影響内容 | 引き継ぎインターフェース |
|-----------|----------|--------------------------|
| task-11 public top + member list | 09e §1 / §2 を実装根拠として参照 | `09e-screen-blueprints-public.md §1`, `§2` |
| task-12 detail + register | 09e §3 / §4 を実装根拠として参照 | `09e-screen-blueprints-public.md §3`, `§4` |
| task-13 login | 09f §1（login 5+1 状態 mermaid） | `09f-screen-blueprints-member.md §1` |
| task-14 my profile + requests | 09f §2（profile 4 領域） | `09f-screen-blueprints-member.md §2` |
| task-06 09-ui-ux.md | 09e / 09f を link 先として参照 | 9 series 索引表 |
| task-18 regression smoke | 視覚値 0 件 grep gate を CI で恒久監視 | `grep-visual-values.log` 期待 |

### validator 要件

- `wc -l 09e-...md 09f-...md`: 実体あり、行数を evidence 化
- fenced JSX prototype 転記ブロックを除いた `grep -nE '#[0-9a-fA-F]{3,8}\b|oklch\(|\b[0-9]+px\b|\bbg-\['` 検出 0 件
- markdown lint script は project root に未定義のため、構造 grep / link grep / JSON parse を代替 evidence とする
- `! grep -nE '§TBD'` placeholder 残存 0

## 3. `system-spec-update-summary.md`

### Step 1: `docs/00-getting-started-manual/specs/` への影響

| spec | 影響 | アクション |
|------|------|-----------|
| `00-overview.md` | なし | N/A |
| `01-api-schema.md` | なし（API 表は現行 API 正本へ同期、新規 endpoint 追加なし） | N/A |
| `02-auth.md` | なし（auth API endpoint 集合不変） | N/A |
| `08-free-database.md` | なし（D1 schema 不変） | N/A |
| `09-ui-ux.md` | 09e / 09f が link 先として追加される（task-06 owner） | task-06 側で索引追記 |
| `09a/09b/09c/09d` | §X.7 link 先として参照される（並列タスク owner） | 各並列タスクで §番号確定 |
| `09e/09f` | **本タスクで新規作成** | C 新規 |
| `13-mvp-auth.md` | なし | N/A |

### Step 2: CLAUDE.md / aiworkflow-requirements 仕様への影響

判定基準（phase-template-phase12.md §「Step 2 = N/A vs BLOCKED 判定基準」）:

- ドメイン仕様（API endpoint / D1 schema / IPC 契約 / UI route / auth / Cloudflare Secret）に touch するか?
  → **No**（spec markdown 2 件の新規作成のみ。既存 endpoint / route / schema は不変）
- ただし CLAUDE.md「UI prototype alignment / MVP recovery」配下の参照ドキュメント表に 09e / 09f を追記する余地がある。

**Step 2A（same-wave sync）**: aiworkflow-requirements の `quick-reference.md` / `resource-map.md` / `task-workflow-active.md` / `LOGS/_legacy.md` に task-20 と `09e` / `09f` の current fact を登録する。
**Step 2B（CLAUDE.md 判定）**: CLAUDE.md に専用の「UI prototype alignment / MVP recovery」参照表は存在しないため、本サイクルでは N/A。追加が必要になった場合は aiworkflow-requirements 側の quick-reference を正本導線とする。

planned wording 残存確認コマンド（完了前必須）:

```bash
rg -n "仕様策定のみ|実行予定|保留として記録" \
  docs/30-workflows/task-20-w2-screen-blueprints-public-and-member/outputs/phase-12/ \
  | rg -v 'phase12-task-spec-compliance-check.md' || echo "planned wording なし"
```

## 4. `documentation-changelog.md`

| 変更ファイル | 種別 | 概要 |
|-------------|------|------|
| `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md` | C | 新規（公開 6 画面 + §99、行数は evidence 記録のみ） |
| `docs/00-getting-started-manual/specs/09f-screen-blueprints-member.md` | C | 新規（会員 2 画面 + §99、行数は evidence 記録のみ） |
| `docs/30-workflows/task-20-w2-screen-blueprints-public-and-member/**` | C | 本仕様書群（index.md / artifacts.json / phase-01〜13.md / outputs/**） |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | M | task-20 / 09e / 09f 導線を追加 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | M | UI prototype alignment task-20 逆引きを追加 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | M | workflow current fact を追加 |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | M | same-wave sync 履歴を追加 |

validator 結果セクション: §2 validator 要件の各コマンド exit code を一覧化。

## 5. `unassigned-task-detection.md`

SF-03 4 パターン照合（設計タスク特有パターンを docs-only にも準用）:

| パターン | 候補 | 起票要否 |
|---------|------|----------|
| 型定義 → 実装 | 09e / 09f §X.5 props/state → task-11..14 で page props / state 型定義 | 既起票（task-11..14） |
| 契約 → テスト | 09e / 09f §X.4 API 表 → task-11..14 内のレンダーテスト / fetch mock | 既起票（task-11..14） |
| UI 仕様 → コンポーネント | 09e / 09f §X.1 prototype 由来 → task-11..14 で page 実装 | 既起票（task-11..14） |
| 仕様書間差異 → 設計決定 | 09b §番号未確定 → 並列 task-08 完了で解決 | 並列タスクとして既起票 |

### 候補 decision

| 候補 ID 案 | 内容 | 起票先 |
|-----------|------|--------|
| `UT-task-20-FU-01` | 09e / 09f §X.7 link の §番号補正 | 起票見送り。同一サイクルで placeholder 0 gate を採用し、確定済み参照のみ残す |
| `UT-task-20-FU-02` | LegalProse primitive 追加 | 起票見送り。task-19 / 09c owner の既存 primitive scope に吸収し、本タスクから新 primitive を作らない |
| `UT-task-20-FU-03` | Google Forms API レート制限時の cache 戦略 | 起票見送り。task-12 実装時の runtime issue であり、現時点では `GET /public/form-preview` 既存 endpoint 参照のみで追加契約なし |

0 件でない場合でも、未起票理由 / 起票先 path / 上流 task ID を必ず記録する。

## 6. `skill-feedback-report.md`

最低限の記録項目:

- 観察事項 1: docs-only タスクの場合、Phase 11 は grep gate のみで成立し、screenshot / runtime evidence は完全に N/A になる。`phase-template-phase11.md` の docs-only 縮約テンプレに「視覚値 grep / API trace grep / コピー原文 grep / invariants grep / placeholder / markdown validation / wc」の標準パターンとして昇格する余地。
- 観察事項 2: 9 series（09a/09b/09c/09d/09e/09f/09g/09h）のように同 wave 並列タスクが §番号を相互参照する場合、placeholder（`§TBD`）→ 解決 fixture の標準ライフサイクルを task-specification-creator skill に組み込むと、本タスク Phase 8 / Phase 9 の重複記述が削減できる。
- 観察事項 3: 改善点なし、と書く場合でも本ファイルは省略しない。

## 7. `phase12-task-spec-compliance-check.md`

| Task | 確認項目 | status |
|------|----------|--------|
| 12-1 main.md | 状態語彙 / 必須 6 成果物 status 表 / workflow_state 維持根拠 | PASS / FAIL |
| 12-2 implementation-guide | C12P2-1〜C12P2-5 全項目 + 後続影響表 | PASS / FAIL |
| 12-3 system-spec-update-summary | Step 1 全 spec 判定 + Step 2A/2B（planned wording 残無し） | PASS / FAIL |
| 12-4 documentation-changelog | 変更ファイル全列挙 + validator 結果 | PASS / FAIL |
| 12-5 unassigned-task-detection | SF-03 4 パターン照合 + UT-task-20-FU-01〜03 検討 | PASS / FAIL |
| 12-6 skill-feedback-report | 観察事項 or 「なし」明記 | PASS / FAIL |

NON_VISUAL 代替証跡項目（Phase 11 連動）:

| 項目 | status |
|------|--------|
| `outputs/phase-11/main.md` 状態語彙が `PASS_DOCS_ONLY_ARTIFACTS_SYNCED` | PASS / FAIL |
| evidence 主要ファイル実体存在 | PASS / FAIL |
| screenshot 系ファイル不在 | PASS / FAIL |
| placeholder（§TBD）残存 0 | PASS / FAIL |

## 8. 完了条件

- [x] 必須 7 ファイル全実体作成済
- [x] planned wording 残存 0 件（または `phase12-task-spec-compliance-check.md` 内のみ）
- [x] `unassigned-task-detection.md` の候補 3 件が起票見送り / 既存 task 吸収のいずれかで decision 済
- [x] `phase12-task-spec-compliance-check.md` 全行 PASS
- [x] artifacts.json `metadata.workflow_state=implemented-local`、Phase 1〜12 `completed`、Phase 13 `blocked_pending_user_approval`
