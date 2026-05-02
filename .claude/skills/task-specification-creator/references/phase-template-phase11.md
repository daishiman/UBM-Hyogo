# Phase Template Phase11

## 対象

Phase 11 の manual test。

## タスク種別判定（最初に確認）

| タスク種別 | 判定条件 | 適用セクション |
| --- | --- | --- |
| **設計タスク** | タスク種別が「設計・仕様策定」、UI実装なし | 設計タスク専用セクション（SF-01） |
| **docs-only タスク** | UI変更なし、ドキュメント・設定変更のみ | docs-only task テンプレ |
| **UI タスク** | Renderer コンポーネントの追加・変更あり | docs-only + UI task 追加要件 |
| **API-only タスク** | `artifacts.json.ui_routes` が空配列 (sync / cron / repository 等) | API smoke evidence テンプレ（下記） |

### `ui_routes` ベースの自動分岐

`artifacts.json` の `ui_routes` を Phase 11 着手前に確認し、以下のように evidence テンプレを切り替える:

| 条件 | 採用テンプレ | 必須 outputs |
| --- | --- | --- |
| `ui_routes.length > 0` | UI smoke evidence | `screenshot-plan.json` / `manual-test-result.md` / `ui-sanity-visual-review.md` / `phase11-capture-metadata.json` |
| `ui_routes.length === 0` | **API smoke evidence** | `outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md` |

API smoke evidence では screenshot は不要。代わりに以下を `manual-smoke-log.md` に記録する:

- 対象 API endpoint / cron handler / repository method
- 実行コマンド (例: `pnpm --filter @repo/api test:run`, `wrangler dev` 経由の curl)
- 期待結果 / 実測 / PASS or FAIL
- vitest 件数を主証跡として明記 (例: `194/194 PASS`)
- upstream が未実装 route を指す場合は、実行済み evidence と未タスク境界を分けて記録する（例: Magic Link mail URL の callback route は後続タスク、現タスクは verify API の direct fetch まで）

`link-checklist.md` は仕様書 → 実装ファイル / fake D1 fixture / fixture テスト間の参照リンク有効性を表で記録する。

## docs-only task テンプレ

- `SKILL.md` から family file へ辿れるか
- `LOGS.md` から archive へ辿れるか
- `.claude` と `.agents` の file set が一致するか
- validator command を再実行できるか

### docs-only / `spec_created` Phase 11 代替証跡フォーマット（必須3点）

`validate-phase11-screenshot-coverage.js` の `detectDocsOnlyPhase11()` が `spec_created` / `docs-only` を検出した場合、screenshot は不要だが以下3点を **必須 outputs** とする（UBM-002 / UBM-003 対応）。

| ファイル | 役割 | 最小フォーマット |
| --- | --- | --- |
| `outputs/phase-11/main.md` | Phase 11 ウォークスルーのトップ index | テスト方式（NON_VISUAL / docs walkthrough）と必須 outputs リンクを明記 |
| `outputs/phase-11/manual-smoke-log.md` | 手動 smoke log（spec walkthrough / link 検証 / mirror parity の実行記録） | 「実行コマンド / 期待結果 / 実測 / PASS or FAIL」をテーブルで記録 |
| `outputs/phase-11/link-checklist.md` | 仕様書から family / archive / mirror への参照リンクが有効かのチェックリスト | 「参照元 → 参照先 / 状態（OK / Broken）」をテーブルで記録 |

**`manual-smoke-log.md` 必須メタ**:

- 証跡の主ソース（自動テスト名 / 件数、または spec walkthrough セッション ID）
- screenshot を作らない理由（`NON_VISUAL` / `docs-only` / `spec_created` のいずれか）
- 実行日時 / 実行者（worktree なら branch 名）

**`link-checklist.md` 最小項目**:

- `SKILL.md` → references / agents / scripts の参照
- `LOGS.md` → archive index の参照
- `.claude` ↔ `.agents` mirror の `diff -qr` 結果（差分0件であること）
- task root の workflow 内リンク（`index.md` / `phase-*.md` / `outputs/*` 間）

> 視覚タスク（VISUAL）の必須 outputs（`manual-test-checklist.md` / `manual-test-result.md` / `discovered-issues.md` / `screenshot-plan.json`）とは別セットである点に注意。Phase 1 設計時にタスク種別を確定させ、Phase 11 着手前に再判定すること。

### ウォークスルーシナリオ発見事項リアルタイム分類欄

各シナリオ実行中に発見した事項を即座に分類するためのテンプレート。
シナリオ完了後にまとめて分類するのではなく、発見時点でリアルタイムに記録する。

| # | シナリオ | 発見事項 | 分類 | 対応方針 |
| - | -------- | -------- | ---- | -------- |
| 1 | A/B/C    | ...      | Blocker / Note / Info | ... |

**分類基準**:
- **Blocker**: Phase 12 完了前に修正必須。仕様整合性・参照リンク切れ・追跡可能性の断絶
- **Note**: 改善推奨だが Phase 12 完了をブロックしない。未タスク化を検討
- **Info**: 記録のみ。今後の参考情報として残す

## UI task 追加要件

- `screenshot-plan.json`
- main shell source-to-destination capture（handoff task の場合）
- screenshot evidence
- Apple UI/UX 視覚レビュー
- coverage matrix
- `phase11-capture-metadata.json`

> **[W1-02b-1] UI task の screenshot-plan.json は `mode: "VISUAL"` をデフォルトにする**
>
> UI コンポーネントの追加・変更が明確な task では、`screenshot-plan.json` 生成時に `mode: "VISUAL"` をデフォルトにする。
> `NON_VISUAL` で作成したファイルを Phase 11 で差し替える場合、`taskId` フィールドが旧タスクのままになりやすい。
> Phase 11 着手前に `phase11-capture-metadata.json` の `taskId` が **現行タスク ID** と一致しているかを確認し、不一致なら preflight で fail-fast させる。
> 確認コマンド例: `jq '.taskId' outputs/phase-11/phase11-capture-metadata.json`

## 必須成果物

| 成果物 | 用途 |
| --- | --- |
| `manual-test-result.md` | walkthrough 結果 |
| `manual-test-report.md` | 実施概要と所見 |
| `discovered-issues.md` | blocker と note |
| `ui-sanity-visual-review.md` | 視覚レビュー |
| `phase11-capture-metadata.json` | capture 実行時の evidence inventory |

### Runtime smoke 実行後の helper artifact 同期

VISUAL_ON_EXECUTION / staging smoke / production smoke のように、Phase 11 helper files を
先にテンプレ配置してから実行するタスクでは、`outputs/phase-11/main.md` が
`PASS` / `BLOCKED` / `FAIL` のいずれかに進んだ時点で、同じ wave 内に以下を同期する。

| ファイル | 同期必須内容 |
| --- | --- |
| `manual-test-result.md` | `not_run` / `spec_created` / `explicit user instruction required` を残さず、実行日・最終状態・失敗理由・evidence path を記録する |
| `discovered-issues.md` | 発見事項 0 件でも実行済み状態を明記し、blocker がある場合は `state / reason / evidence_path / checked_at` を残す |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | `PENDING_RUNTIME_EVIDENCE` と `EXECUTED_BLOCKED` / `EXECUTED_FAIL` / `EXECUTED_PASS` を混同しない |
| `outputs/phase-12/system-spec-update-summary.md` | downstream gate（例: 09c）を変更しない場合でも、no-op decision record と evidence path を残す |

`main.md` だけを更新して helper files が `not_run` のまま残る状態は Phase 11/12 close-out の
FAIL とする。Cloudflare / staging / production など外部環境 blocker は、実行不能を
PASS と扱わず、必要なら `unassigned-task-detection.md` で復旧タスクへ formalize する。

### 環境チェック（Phase 11 着手前）

Phase 11 の screenshot 撮影前に以下を確認する：

1. Electron 起動確認: `pnpm --filter @repo/desktop preview` が正常起動するか
2. 起動不可の場合（worktree 環境等） → **CAPTURE_BLOCKED** として記録する
   - ダミー PNG 作成は禁止（false green 防止）
   - ユニットテストの PASS を代替 evidence として記録する
   - `docs/30-workflows/unassigned-task/` に未タスクとして formalize する
3. 起動可能な場合 → 通常の screenshot 撮影フローへ進む

## 設計タスク専用セクション（SF-01対応）

**判定基準**: タスク種別が「設計・仕様策定」であり、UI実装が存在しない場合に適用。

### 設計文書ウォークスルー（docs-only Phase 11 の代替テスト方式）

設計タスクでは「手動UIテスト」ではなく「設計文書ウォークスルー」を Phase 11 の主テスト方式とする。

| 確認項目 | 方法 | 必須 |
| --- | --- | --- |
| 仕様書の自己完結性 | 前提条件・受入基準・成果物パスが揃っているか目視確認 | ✅ |
| 型定義・インターフェースの整合 | 定義箇所と参照箇所が一致するか grep 確認 | ✅ |
| スコープ外の未タスク洗い出し | 設計中に「将来実装」とした箇所を列挙 | ✅ |
| Phase 3/10レビュー指摘との照合 | MINOR判定事項が全て記録されているか確認 | ✅ |
| 後続実装タスクへの引き継ぎ情報 | 「型定義→実装」「契約→テスト」の引き継ぎ項目を列挙 | ✅ |

### スクリーンショット対応（P53対策）

設計タスクでは通常は CLI 環境での画面キャプチャを必須としない。ただし、ユーザーが明示的にスクリーンショット検証を要求した場合は docs-heavy / backend-heavy task でも related UI を対象に representative capture を残し、`NON_VISUAL` 単独で閉じない。

| 状況 | 対応方法 |
| --- | --- |
| UIコンポーネントが存在しない | 通常は `NON_VISUAL`。ただし user 要求時は representative screenshot を追加 |
| 型定義・仕様書のみの変更 | 通常は `NON_VISUAL`。ただし branch sanity check 要求時は screenshot へ昇格 |
| 関連UIが既存で変更なし | upstream screenshot または review board harness を current workflow へ集約 |

### UI タスクの CLI 環境でのスクリーンショット取得（P53対応）

UI タスクで Electron を直接起動できない CLI 環境では、**Playwright + Vite dev server パターン**を使用する。

| 手順 | コマンド |
| --- | --- |
| 1. Vite dev server 起動 | `cd apps/desktop && npx vite --config vite.e2e.config.ts &` |
| 2. capture-screenshots.js で撮影 | `node .claude/skills/task-specification-creator/scripts/capture-screenshots.js --workflow <path> --plan <plan.json>` |
| 3. preflight 疎通確認 | `curl -I http://127.0.0.1:4173/` |

詳細は [phase-11-12-guide.md](phase-11-12-guide.md) のセクション A/C を参照。

**記録例**（`manual-test-result.md` 冒頭に明記）:

```markdown
## テスト方式

本タスクは設計タスク（spec_created）だが、ユーザー要求により representative screenshot audit を追加。
スクリーンショット: SCREENSHOT + NON_VISUAL
```

## 関連ガイド

- [phase-11-screenshot-guide.md](phase-11-screenshot-guide.md)
- [screenshot-verification-procedure.md](screenshot-verification-procedure.md)

## docs-only / NON_VISUAL 縮約テンプレ（発火条件: visualEvidence=NON_VISUAL）

`artifacts.json.metadata.visualEvidence == "NON_VISUAL"` のとき、Phase 11 outputs は以下 3 点に固定する。
screenshot は不要（生成禁止: false green 防止）。

### 必須 outputs

| ファイル | 役割 | 最小フォーマット |
| --- | --- | --- |
| `outputs/phase-11/main.md` | Phase 11 トップ index | テスト方式（NON_VISUAL / docs walkthrough）/ 発火条件 / 必須 outputs 一覧 / 第一適用例参照 |
| `outputs/phase-11/manual-smoke-log.md` | spec walkthrough / link 検証 / mirror parity の実行記録 | 「実行コマンド / 期待結果 / 実測 / PASS or FAIL」テーブル |
| `outputs/phase-11/link-checklist.md` | SKILL.md → references / mirror parity / workflow 内リンクのチェックリスト | 「参照元 → 参照先 / 状態（OK / Broken）」テーブル |

VISUAL タスクの必須 outputs（manual-test-checklist.md / manual-test-result.md / discovered-issues.md /
screenshot-plan.json）とは別セット。両者は混在させない。

### 発火条件の機械判定

```bash
jq -r '.metadata.visualEvidence // empty' \
  docs/30-workflows/<task>/artifacts.json
# => NON_VISUAL なら本縮約テンプレを適用
# => VISUAL なら UI task 追加要件
# => 空 / 未設定なら Phase 1 へ差戻し（references/phase-template-phase1.md 違反）
```

### 第一適用例（drink-your-own-champagne）

`ut-gov-005-docs-only-nonvisual-template-skill-sync` 自身が本テンプレの第一適用例。
`docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/outputs/phase-11/` を参照。

> 既存「docs-only / `spec_created` Phase 11 代替証跡フォーマット（必須3点）」セクションは Phase 8 DRY 化で本セクションに統合する（TECH-M-01）。
