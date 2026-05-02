# phase-12.md 仕様への準拠チェック

`phase-12.md` の各要件と本 phase 成果物の対応関係を確認する。

## 1. 必須成果物 6 種

| # | 成果物 | パス | 状態 |
| --- | --- | --- | --- |
| 1 | implementation guide | `outputs/phase-12/implementation-guide.md` | OK |
| 2 | system spec update | `outputs/phase-12/system-spec-update-summary.md` | OK |
| 3 | changelog | `outputs/phase-12/documentation-changelog.md` | OK |
| 4 | unassigned | `outputs/phase-12/unassigned-task-detection.md` | OK |
| 5 | skill feedback | `outputs/phase-12/skill-feedback-report.md` | OK |
| 6 | compliance check | `outputs/phase-12/phase12-task-spec-compliance-check.md` | OK（本ファイル） |
| + | サマリ | `outputs/phase-12/main.md` | OK |

## 2. 実装ガイド Part 1 / Part 2 要件

### Part 1: 初学者・中学生レベル

| 要件 | 該当箇所 | 状態 |
| --- | --- | --- |
| なぜ必要かを日常生活の例え話から説明 | implementation-guide.md Part 1「困りごと」「After」「例え話」 | OK |
| 専門用語を使う場合はその場で短く説明 | implementation-guide.md Part 1 ミニ解説表 | OK |
| 何を作るかより先に困りごと / 解決後の状態 | implementation-guide.md Part 1 構成順 | OK |

### Part 2: 開発者・技術者レベル

| 要件 | 該当箇所 | 状態 |
| --- | --- | --- |
| TypeScript interface / type 定義 | Part 2 §2 verify suite signature の `describe` blocks | OK |
| API シグネチャ / 使用例 / エラー / エッジケース | Part 2 §1 / §2 / §6 | OK |
| 設定可能なパラメータ / 定数 / 実行コマンド / 検証コマンド | Part 2 §7 検証コマンド一覧 | OK |

## 3. 不変条件カバレッジ

phase-12.md §「多角的チェック観点」で要求された不変条件 #1 / #2 / #5 / #6 / #7 / #11 がすべて記述されているか:

| 不変条件 | implementation-guide.md | compliance-check.md (本書) |
| --- | --- | --- |
| #1 schema を固定しすぎない | §9 表 1 行目 | OK |
| #2 consent キーは 2 種のみ | §9 表 2 行目 | OK |
| #5 D1 直接アクセスは apps/api に閉じる | §9 表 3 行目 | OK |
| #6 apps/web から D1 直接アクセス禁止 | §9 表 4 行目 | OK |
| #7 MVP では Form 再回答が本人更新の正式経路 | §9 表 5 行目 | OK |
| #11 /me 配下に PUT/PATCH /me/profile を mount しない | §9 表 6 行目 | OK |

→ **6 / 6 = 100%（記述カバレッジ）**。ただし AC-6 coverage gate は未達のため、タスク全体の完了率とは分離する。

## 4. 6 ドキュメント生成方針への準拠

| 方針 | 該当箇所 | 状態 |
| --- | --- | --- |
| 1. implementation-guide: runbook 7 step + 5 種 suite signature + fixture / helper 配置 + coverage 閾値 + CI yml | implementation-guide.md Part 2 §1〜§7 | OK |
| 1. 30 endpoint × 6〜7 ケース ≒ 200 test のスケール感 | implementation-guide.md Part 2 §3 | PARTIAL（完全生成 inventory は UT-08A-01/後続補強対象） |
| 2. system-spec-update: 09 / 13 / 16 への差分提案 | system-spec-update-summary.md §1 | OK |
| 3. changelog: 本 task 配下 + outputs/* 一覧 | documentation-changelog.md §1 / §2 | OK |
| 4. unassigned: visual regression / 負荷 / D1 migration の 3 件以上 | unassigned-task-detection.md §1〜§6 で 6 件 | OK |
| 5. skill-feedback: 4 軸テンプレ / msw handler 同梱提案 | skill-feedback-report.md 提案 1 / 2 | OK |
| 6. compliance: Phase 1〜11 の必須セクション + 不変条件 6 件 | 本書 §3 / §5 | OK |

## 5. Phase 1〜11 必須セクション準拠

| Phase | 必須セクション | 確認 |
| --- | --- | --- |
| 1 要件定義 | AC-1〜7 / 4 条件 / endpoint 32 / repo 22 | outputs/phase-01/main.md OK |
| 2 設計 | mermaid + layout + msw vs local fixture | outputs/phase-02 OK |
| 3 設計レビュー | 3 案比較 / PASS-MINOR-MAJOR / 採用 C | outputs/phase-03 OK |
| 4 テスト戦略 | 5 種 suite + AC × suite matrix + coverage 閾値 | outputs/phase-04 OK |
| 5 ランブック | 7 step + signature + sanity check | outputs/phase-05 OK |
| 6 異常系 | 12 カテゴリ + 不変条件カバレッジ | outputs/phase-06 OK |
| 7 AC matrix | 5 軸 trace + 不変条件 6 件 | outputs/phase-07 OK |
| 8 DRY | Before/After 5 軸 + 共通化 7 items | outputs/phase-08 OK |
| 9 QA | 無料枠 / secret hygiene / 型安全 / eslint | outputs/phase-09 OK |
| 10 最終レビュー | GO / NO-GO + リスクスコア | outputs/phase-10 OK（GO） |
| 11 手動 smoke | test / coverage / yml + pass-fail 判定 | outputs/phase-11 PARTIAL（test pass / coverage AC-6 未達） |

## 6. 完了条件チェック

phase-12.md §「完了条件」:

- [x] 6 種ドキュメント生成（§1）
- [x] compliance-check で不変条件記述カバレッジ 100%（§3 6/6）
- [x] unassigned 3 件以上（unassigned-task-detection.md で 6 件）

phase-12.md §「タスク100%実行確認」:

- [~] 全実行タスク completed — Phase 11/12 は AC-6 未達により partial
- [x] 成果物 6 種配置済み
- [x] 多角的チェック観点記述済み（implementation-guide.md §9 / 本書 §3）
- [~] artifacts.json の phase 12 を partial に更新

## 7. 判定

**phase-12.md ドキュメント成果物への準拠率: 100%**。ただしタスク全体は AC-6 coverage gate 未達のため **PARTIAL**。Phase 13 (PR 作成) は UT-08A-01 解消または明示的な例外承認があるまで green 前提で着手しない。
