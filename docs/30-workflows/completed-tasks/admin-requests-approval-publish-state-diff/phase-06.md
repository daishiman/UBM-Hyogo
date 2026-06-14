# Phase 6: テスト拡充（fail path / 回帰 guard）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-requests-approval-publish-state-diff |
| Phase 番号 | 6 / 13 |
| Phase 名称 | テスト拡充（fail path / 回帰 guard） |
| 実行種別 | serial（単一 workflow / 1 サイクル完了） |
| 作成日 | 2026-06-11 |
| 担当 | web (apps/web 表現層) |
| タスク種別 | implementation（VISUAL / コード変更を伴う） |
| 上流 | Phase 5（実装・TC-XX Green 化） |
| 下流 | Phase 7（カバレッジ確認） |
| 状態 | completed |

## 目的

Phase 4 の正常系 Red を Phase 5 で Green 化した後、**異常系・境界値（fail path）テスト（TC-E-XX）**を追加して堅牢性を担保する。diff 表示は外部入力（projection の 3 値）に依存するため、欠損・未知値・型不一致でも throw せず fail-soft する（「不明」表示・diff 非生成）ことを境界として網羅する。具体的には (a) `publishState` 未知値（`unknown` / 空文字 / 列挙外）で before ラベルが「不明」になる、(b) `desiredState` 欠落・型不一致（payload が object でない / `desiredState` キー不在 / 非 string）で after が「不明」になる、(c) 対象外 note_type で `buildPublishStateDiff` が `null` を返し diff 行が描画されない、(d) `delete_request` で公開状態 diff 文言（`data-diff-kind="visibility"`）が出ない、(e) `destructiveMessage` の fallback（diff 構築不能時の既存汎用文言）、(f) a11y の矢印 `aria-hidden` 維持、をカバーする。さらに **回帰 guard** として `verify-design-tokens`（HEX 0 件）の位置づけを確定する。本 Phase はテスト拡充の設計（TC-E-XX 一覧 + 回帰 guard の位置づけ）を文書化する（spec_created）。

## 実行タスク

1. **拡充方針の文書化**: `outputs/phase-06/main.md` に Phase 4 Red → Phase 5 Green 後の拡充方針を書く。正常系（Phase 4・描画 / 写像 / 文言）と異常系（Phase 6・欠損 / 未知値 / fail-soft / null 分岐）の責務分担を明示する。
2. **fail path / 境界値 TC-E-XX の作成**: `outputs/phase-06/edge-cases.md` に異常系・境界値ケースを TC-E-01 以降で採番し、対象 / 入力 / 期待値 / 配置 spec を書く。
3. **回帰 guard の位置づけ**: `verify-design-tokens`（HEX 0 件 = AC-5）を回帰 guard として位置づけ、Phase 9 への連携を書く。VISUAL の staging capture（user-gated・Gate-C）も位置づける。
4. **境界値網羅の確認**: publishState（列挙内 / `unknown` / 空 / 列挙外）、desiredState（正常 / キー不在 / 非 object payload / 非 string）、note_type（visibility / delete / 対象外 / null item）の組合せを網羅する。

## 参照資料

### タスク内部資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/admin-requests-approval-publish-state-diff/outputs/phase-04/test-plan.md | 正常系 TC-XX（fail path との責務分担） |
| 必須 | docs/30-workflows/completed-tasks/admin-requests-approval-publish-state-diff/outputs/phase-05/runbook.md | `formatPublishStateLabel` / `buildPublishStateDiff` の fail-soft 分岐 / 検証コマンド |
| 必須 | docs/30-workflows/completed-tasks/admin-requests-approval-publish-state-diff/phase-02.md | `desiredState` unknown-narrowing パターン / null 分岐 |
| 必須 | docs/30-workflows/completed-tasks/admin-requests-approval-publish-state-diff/_shared-context.md | AC-3 / AC-4 / AC-5 / AC-9 / AC-10 / 回帰 guard（verify-design-tokens） |

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| テスト コンポーネントパターン詳細 | `.claude/skills/aiworkflow-requirements/references/testing-component-patterns-details.md` | fail path / 境界値の component spec 書式 |
| アクセシビリティテスト | `.claude/skills/aiworkflow-requirements/references/testing-accessibility.md` | degrade 時の a11y / 矢印 aria-hidden 維持 |
| UI/UX 設計指針 | `.claude/skills/aiworkflow-requirements/references/ui-ux-design-principles-core.md` | fail-soft 表示（「不明」）の UX 妥当性 |

### プロジェクト spec 正本

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/09b-design-tokens.md | HEX 禁止ルール（回帰 guard） |
| 参照 | apps/api/src/routes/admin/requests.ts | `PUBLISH_STATES` 列挙（境界値の列挙外を導出） |

## 実行手順

### ステップ 1: 拡充方針概要（main.md）

`outputs/phase-06/main.md` に正常系（Phase 4）= 描画 / 写像 / 文言、異常系（Phase 6）= 欠損 / 未知値 / fail-soft / null 分岐、の責務分担を明記する。diff helper が **throw しない**（fail-soft で「不明」/ `null`）契約を境界テストで保証する旨を書く。

### ステップ 2: TC-E-XX 採番（edge-cases.md）

`outputs/phase-06/edge-cases.md` に (a)〜(f) の異常系・境界値を TC-E-01 以降で採番し、対象 / 入力 / 期待値 / 配置 spec を書く。最低限カバー:

- (a) `formatPublishStateLabel("unknown" | "" | "foo")` → 「不明」（throw なし）。
- (b) `buildPublishStateDiff` visibility で `desiredState` がキー不在 / 非 object payload / 非 string → after = 「不明」（throw なし）。
- (c) 対象外 note_type（例 `other`）/ `item=null` → `buildPublishStateDiff` が `null`、diff 行が DOM に描画されない。
- (d) `delete_request`（D01）で `data-diff-kind="visibility"` が DOM に存在しない（混同なし）。
- (e) `destructiveMessage` の fallback: diff 構築不能の `visibility_request` で既存汎用文言「公開状態を申請内容に応じて変更します。会員へ即時反映されます。」を返す。
- (f) 矢印 span の `aria-hidden="true"` が境界ケースでも維持される（diff 行が描画される全ケース）。

### ステップ 3: 回帰 guard の位置づけ

`verify-design-tokens`（CI gate・HEX 0 件 = AC-5）を回帰 guard として位置づけ、Phase 9 へ連携する。VISUAL の staging capture（user-gated・Gate-C）は Phase 11 で位置づける旨を書く。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | 拡充方針 + 正常/異常責務分担 + 回帰 guard 位置づけ |
| ドキュメント | outputs/phase-06/edge-cases.md | TC-E-XX 一覧（異常系 / 境界値・対象 / 入力 / 期待 / 配置 spec） |
| メタ | artifacts.json | Phase 6 を completed に同期 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | fail-soft 分岐（「不明」/ `null`）/ `destructiveMessage` fallback を fail path で再検証 |
| Phase 7 | 正常系 TC-XX + 異常系 TC-E-XX の全 TC を AC マトリクスへ引き渡す |
| Phase 9 | vitest 対象限定で TC-E-XX を含む全 TC Green を確認・verify-design-tokens を実行 |
| Phase 11 | VISUAL staging capture（V01/V02/D01）の baseline 取得 |

## 完了条件

- [ ] `outputs/phase-06/main.md` に Phase 4 Red → Phase 5 Green 後の拡充方針が記載され、正常系（Phase 4）/ 異常系（Phase 6）の責務分担が明示されている。
- [ ] `outputs/phase-06/edge-cases.md` に TC-E-XX が採番され、各 TC に対象 / 入力 / 期待値 / 配置 spec が記載されている。
- [ ] (a) `formatPublishStateLabel` の未知値 fail-soft（「不明」/ throw なし）が TC-E でカバーされている。
- [ ] (b) `buildPublishStateDiff` の `desiredState` 欠落・型不一致で after=「不明」が TC-E でカバーされている。
- [ ] (c) 対象外 note_type / `item=null` で `null` 返却・diff 行非描画が TC-E でカバーされている。
- [ ] (d) `delete_request` で公開状態 diff（`data-diff-kind="visibility"`）が出ない混同防止が TC-E でカバーされている。
- [ ] (e) `destructiveMessage` の fallback（既存汎用文言）、(f) 矢印 `aria-hidden` 維持が TC-E でカバーされている。
- [ ] 境界値（publishState 列挙内/unknown/空/列挙外、desiredState 正常/キー不在/非object/非string、note_type visibility/delete/対象外/null item）が網羅されている。
- [ ] 回帰 guard として `verify-design-tokens`（HEX 0 件）の位置づけが `outputs/phase-06/main.md` に記載されている。
- [ ] 全 TC-E-XX が AC-3 / AC-4 / AC-5 / AC-9 / AC-10 のいずれかにマップされている。
- [ ] テスト書式が既存（happy-dom + testing-library + `afterEach(cleanup)`）を踏襲している。
- [ ] artifacts.json の Phase 6 ステータスが completed に整合している。
