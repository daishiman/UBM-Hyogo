# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-06b-profile-logged-in-visual-evidence |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| Wave | 6 (follow-up) |
| Mode | sequential |
| 作成日 | 2026-04-30 |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | pending |

## 目的

`/profile` logged-in visual evidence（M-08〜M-10、M-14〜M-16）取得の要件を AC-1〜7 に落とし、不変条件 #4 / #5 / #8 / #11 を観測対象として確定する。

## 真の論点 (true issue)

- **論点 1**: local fixture と staging のどちらを「正本」とするか。本タスクは **両方取得** とし、M-08〜M-10 を local fixture（再現容易性）、M-14〜M-16 を staging deploy 後（実環境裏付け）に分担。
- **論点 2**: `read-only` 観測を screenshot だけで足りるか、それとも DevTools 出力も evidence に含めるか。本タスクは **DevTools `querySelectorAll` 出力を `*.devtools.txt` として併存** させる。screenshot だけでは form が hidden で 0 件か視覚的に判別困難なため。
- **論点 3**: `?edit=true` クエリは「無視されること」が AC。これを「URL バーに `?edit=true` が表示された状態」かつ「DOM に form 0 件」の二重 evidence で観測する。
- **論点 4**: session token / Cookie / Authorization ヘッダー値を evidence に含めない。secret hygiene を Phase 9 で gate 化。

## 依存境界

| 種別 | 対象 | 引き取るもの | 渡すもの |
| --- | --- | --- | --- |
| 上流 | 04b `/me` `/me/profile` API | logged-in 表示用データ | observation 結果 |
| 上流 | 05a/05b session 機構 | local / staging session 確立手順 | session 再現 runbook |
| 上流 | 06b `/profile` page | UI 実装 | read-only 観測結果 |
| 上流 | 親タスク 06b の `manual-smoke-evidence.md` | M-08〜M-16 行 | `pending` → `captured` 更新 diff |
| external gate | 09a staging deploy | staging URL | M-14〜M-16 取得トリガー。未完了時は partial |

## 価値とコスト

- **初回価値**: 不変条件 #4/#5/#8/#11 を **screenshot + DevTools** の二重証跡で恒久固定。Phase 11 closed-loop で 06b workflow の Phase 11 partial を解消。
- **初回で払わないコスト**: Playwright 自動化（08b 責務）、production 観測、視覚回帰の baseline（visual regression は MVP scope 外）。
- **トレードオフ**: 手動取得は再現性が低いため runbook を Phase 5 で詳述し、命名規約と DevTools snippet を必ず固定する。

## 4 条件評価

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | #4/#5/#8/#11 を visual で観測可能か | PASS | 4 不変条件 → 6 evidence で 1:N トレース |
| 実現性 | local + staging の双方で session 確立が可能か | PASS | 05a/05b で magic link / OAuth 確立済 |
| 整合性 | 親 06b の `manual-smoke-evidence.md` 行と一致するか | PASS | M-08〜M-10、M-14 profile、M-15 edit CTA、M-16 localStorage ignored を index.md に明記 |
| 運用性 | secret 漏洩なく再取得可能か | PASS | runbook + secret hygiene check（Phase 9） |

## 実行タスク

- [ ] AC-1〜7 を quantitative に記述（screenshot 6 + devtools 3 + diff 1 + Phase 11 補助 metadata 4 = 計 14 ファイル）
- [ ] 真の論点 4 件と非採用案を記録（`outputs/phase-01/main.md`）
- [ ] 4 条件評価の根拠を埋める
- [ ] Phase 2 への open question（local fixture の `/me` mock 値、staging URL、screenshot ツール）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/05-pages.md | `/profile` 仕様 |
| 必須 | docs/00-getting-started-manual/specs/13-mvp-auth.md | session 設計 |
| 必須 | docs/00-getting-started-manual/specs/00-overview.md | 不変条件 #4/#5/#8/#11 |
| 必須 | docs/30-workflows/completed-tasks/UT-06B-PROFILE-VISUAL-EVIDENCE.md | 親タスク Summary |

## 実行手順

### ステップ 1: 親タスク AC 引き取り
- 親タスク `UT-06B-PROFILE-VISUAL-EVIDENCE.md` の Acceptance Criteria 5 件を 1:1 で本タスクの AC-1〜5 に対応付け。
- `manual-smoke-evidence.md` の行所在を確認し、M-08〜M-10 / M-14〜M-16 の現在 status（`pending`）を記録。

### ステップ 2: AC quantitative 化
- AC-1〜3: local 取得（M-08, M-09, M-10）
- AC-4: staging 取得（M-14 profile、M-15 edit CTA、M-16 localStorage ignored）
- AC-5: `manual-smoke-evidence.md` 6 行更新 diff
- AC-6: 不変条件 4 件の observation ノート（evidence 内 / 別ファイル）
- AC-7: secret hygiene gate（Phase 9）と runbook 再現性

### ステップ 3: 4 条件評価と handoff
- 4 条件記入
- Phase 2 へ open question（DevTools snippet のフォーマット、screenshot 取得ツールの統一）

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | session flow / 命名規約 |
| Phase 4 | evidence チェックリスト |
| Phase 5 | runbook + DevTools snippet |
| Phase 7 | AC × evidence × 不変条件 |
| Phase 11 | 実取得 |

## 多角的チェック観点

- 不変条件 **#4**: session 必須（unauth では `/login` redirect、本タスクは logged-in 後の挙動を観測）
- 不変条件 **#5**: 公開 / 会員 / 管理 3 層分離（member 層境界の人目確認）
- 不変条件 **#8**: read-only 境界（form / input / textarea / submit が DOM に 0 件）
- 不変条件 **#11**: 本文編集経路なし（`?edit=true` でも form 不出現）

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 親タスク AC 引き取り | 1 | pending | UT-06B-PROFILE-VISUAL-EVIDENCE.md |
| 2 | AC-1〜7 quantitative 化 | 1 | pending | 10 evidence files + Phase 11 補助 metadata |
| 3 | 真の論点記録 | 1 | pending | local vs staging / DevTools 併存 |
| 4 | 4 条件評価 | 1 | pending | — |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | Phase 1 主成果物 |
| メタ | artifacts.json | phase 1 status |

## 完了条件

- [ ] AC-1〜7 quantitative 化済み
- [ ] 真の論点 + 4 条件評価記録
- [ ] Phase 2 への open question 明記

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 全成果物配置済み
- [ ] 完了条件すべてチェック
- [ ] 異常系（session 不成立 / API 500 / secret 漏洩）も網羅
- [ ] 次 Phase 引き継ぎ事項記述
- [ ] artifacts.json の phase 1 を completed

## 次 Phase

- 次: Phase 2 (設計)
- 引き継ぎ: session 確立フロー、screenshot ツール、命名規約、DevTools snippet 設計
- ブロック条件: AC-1〜7 quantitative 化未完なら Phase 2 不可
