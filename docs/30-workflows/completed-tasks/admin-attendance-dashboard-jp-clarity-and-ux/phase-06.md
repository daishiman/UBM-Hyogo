# Phase 6: テスト拡充

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-attendance-dashboard-jp-clarity-and-ux |
| Phase 番号 | 6 / 13 |
| Phase 名称 | テスト拡充 |
| 実行種別 | serial |
| 作成日 | 2026-06-11 |
| 担当 | web (apps/web 表現層) |
| タスク種別 | implementation（VISUAL / コード変更を伴う） |
| 上流 | Phase 5（実装・追従 + 回帰の Green 化） |
| 下流 | Phase 7（カバレッジ確認） |
| 状態 | spec_created |

## 目的

Phase 4 の追従 + 回帰を Phase 5 で Green 化した後、**英語・専門語の残存ゼロを機械的に保証する回帰ガード**と、**degrade などの fail path が日本語化後も挙動不変であること**を拡充する。本タスクは文言置換のため、最大のリスクは「置換漏れ（英語・専門語が一部残る）」と「テストコードに残った Before 文字列（[FB-TASK-01/02] = `describe.skip` / 旧アサート残存）」である。よって (a) 画面文字列に英語・専門語が 0 件であることを grep ガード（TC-E-XX）として固定、(b) degrade（SafeResult error）時の sectionLabel が新文言で表示されること、(c) テストスイートに `describe.skip` / `it.skip` が残っていないこと、を拡充する。本 Phase は拡充の設計（TC-E-XX + 回帰ガードの位置づけ）を文書化する。

## 実行タスク

1. **拡充方針の文書化**: `outputs/phase-06/main.md` に「回帰（Phase 4）/ 残存ガード・fail path（Phase 6）の責務分担」を書く。
2. **残存ゼロ grep ガードの設計**: `outputs/phase-06/regression-cases.md` に、画面文字列（component + lib + route）に英語（`PRIMARY`/`TREND`/`TOP10` 等）と専門語（`セッション`/`ユニーク`/`区画`/`出席回数帯`/`pt`）が 0 件であることを保証する grep ガード TC-E-XX を採番する。
3. **fail path（degrade）の新文言確認**: overview / by-session / ranking / zone error 時の `AdminSectionErrorClient` が新 sectionLabel（`出席のおもな指標` / `開催回ごとの出席状況` / `出席が多い人の一覧` / `出席回数べつの分布`）で degrade することを TC-E で確認する。
4. **skip 残存チェック（[FB-TASK-01/02]）**: attendance spec 群に `describe.skip` / `it.skip` / `.only` が残っていないことを grep で確認する TC-E を加える。
5. **回帰ガードの位置づけ**: `verify-design-tokens`（HEX 0 = AC-5）/ Playwright visual smoke（baseline 再取得・M-2）/ focused vitest の位置づけを確定する。

## 参照資料

### タスク内部資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-04/test-plan.md | 回帰 TC-RXX（残存ガードとの責務分担） |
| 必須 | outputs/phase-05/runbook.md | 置換ファイル / 残存 grep / degrade sectionLabel |
| 必須 | outputs/phase-02/change-map.md | After 文言（grep ガードの期待文字列） |
| 必須 | _shared-context.md | AC-1/2/3/5/10 / 回帰 guard（verify-design-tokens / playwright） |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| テスト コンポーネントパターン詳細 | `.claude/skills/aiworkflow-requirements/references/testing-component-patterns-details.md` | fail path（degrade）の component spec 書式 |
| アクセシビリティテスト | `.claude/skills/aiworkflow-requirements/references/testing-accessibility.md` | degrade 時の aria / role 維持 |
| Playwright E2E | `.claude/skills/aiworkflow-requirements/references/testing-playwright-e2e.md` | visual smoke / baseline 再取得 |

## 実行手順

### ステップ 1: 拡充方針概要（main.md）

- 回帰（Phase 4 = After 文言固定）/ 残存ガード・fail path（Phase 6 = 英語専門語 0 件・degrade 新文言・skip 残存）の責務分担を明記。

### ステップ 2: TC-E-XX 採番（regression-cases.md）

- 残存ゼロ grep / degrade 新文言 / skip 残存チェックを TC-E-01 以降で採番し、対象 / コマンドまたは操作 / 期待値を書く。

### ステップ 3: 回帰ガードの位置づけ

- `verify-design-tokens` / Playwright visual smoke（M-2 baseline 再取得・user-gated）/ focused vitest を回帰ガードとして位置づけ、Phase 9 / Phase 11 へ連携。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | degrade 分岐 / 新 sectionLabel を fail path で再検証 |
| Phase 7 | 回帰 + 残存ガードの全ケースを AC マトリクスへ引き渡す |
| Phase 9 | focused vitest + verify:tokens + 残存 grep で全ケース確認 |
| Phase 11 | Playwright visual smoke（baseline 再取得・M-2） |

## 多角的チェック観点（AIが判断）

| 観点 | AC / 不変条件 | 確認内容 |
| --- | --- | --- |
| 英語残存 0 | AC-1 | component + lib + route に英語表記が grep 0 件 |
| セッション残存 0 | AC-2 | 同範囲に `セッション` が grep 0 件 |
| 専門語残存 0 | AC-3 | 同範囲に `ユニーク` / `トレンド` / `区画` / `出席回数帯` / `pt`（単位）が grep 0 件 |
| degrade 新文言 | AC-10 | error 時の sectionLabel が新文言で表示（挙動は不変） |
| skip 残存 0 | [FB-TASK-01/02] | `describe.skip` / `it.skip` / `.only` が attendance spec に残らない |
| HEX 回帰 guard | AC-5 | `verify-design-tokens` が HEX 0 件で pass |
| visual baseline | M-2 | 文言変更の意図的差分として baseline 再取得（user-gated） |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 拡充方針概要 | 6 | spec_created | main.md |
| 2 | 残存ゼロ grep ガード（英語 / セッション / 専門語） | 6 | spec_created | TC-E |
| 3 | degrade 新 sectionLabel 確認 | 6 | spec_created | TC-E |
| 4 | skip 残存チェック | 6 | spec_created | TC-E |
| 5 | 回帰ガード位置づけ（tokens / playwright / vitest） | 6 | spec_created | main.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | 拡充方針 + 回帰/残存ガード責務分担 + 回帰ガード位置づけ |
| ドキュメント | outputs/phase-06/regression-cases.md | TC-E-XX 一覧（残存ゼロ grep / degrade 新文言 / skip 残存） |
| メタ | artifacts.json | Phase 6 を spec_created に維持 |

## 完了条件

- [ ] `outputs/phase-06/main.md` に回帰（Phase 4）/ 残存ガード・fail path（Phase 6）の責務分担が記載されている
- [ ] `outputs/phase-06/regression-cases.md` に TC-E-XX が採番され、各 TC に対象 / コマンドまたは操作 / 期待値が記載されている
- [ ] 英語（PRIMARY/TREND/TOP10 等）残存 0 件の grep ガードが TC-E でカバーされている（AC-1）
- [ ] 「セッション」残存 0 件の grep ガードが TC-E でカバーされている（AC-2）
- [ ] 専門語（ユニーク/トレンド/区画/出席回数帯/pt）残存 0 件の grep ガードが TC-E でカバーされている（AC-3）
- [ ] degrade（error）時の新 sectionLabel 表示が TC-E でカバーされている（AC-10）
- [ ] `describe.skip` / `it.skip` / `.only` 残存チェック（[FB-TASK-01/02]）が TC-E でカバーされている
- [ ] 回帰ガード（verify-design-tokens / playwright visual smoke / focused vitest）の位置づけが `outputs/phase-06/main.md` に記載されている

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜5 が完了している
- [ ] `outputs/phase-06/{main,regression-cases}.md` が配置済み
- [ ] 全 TC-E-XX が AC-1 / AC-2 / AC-3 / AC-5 / AC-10 のいずれかにマップされている
- [ ] grep ガードがテストコード内の `.not.toContain` / 説明文を誤検知しない方針（対象を component/lib/route に限定）になっている
- [ ] テスト書式が既存（happy-dom + testing-library + `afterEach(cleanup)`）を踏襲している
- [ ] artifacts.json の Phase 6 ステータスが spec_created に整合している

## 次Phase

- 次: Phase 7（カバレッジ確認）
- 引き継ぎ事項: TC-E-XX（残存ゼロ / degrade / skip）/ 回帰ガード / visual baseline 再取得（M-2）
- ブロック条件: 残存ゼロ grep が誤検知する、または degrade 新文言が確認できない場合は Phase 4/5 に戻る
