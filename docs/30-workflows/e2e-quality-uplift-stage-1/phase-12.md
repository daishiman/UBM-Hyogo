# Phase 12: 中学生レベル概念説明 / ドキュメント更新

> workflow: `e2e-quality-uplift-stage-1` / 起案日: 2026-05-09

## 1. 中学生向け説明（このサイクルが何をしたか）

| 質問 | 答え |
|------|------|
| 何のテスト？ | 「会員のメールアドレスがホームページに勝手に出てきていないか」「『申請中』の表示が、ページを移動しても消えないか」をチェックするテストを増やしました |
| なぜ大事？ | メールアドレスが見えてしまうと個人情報漏れ、表示が消えると「ちゃんと申請できたのかな？」と利用者が不安になるからです |
| どうやって？ | サイトを自動で動かすロボット（Playwright）に「絶対この文字は見えてはいけない」「ページを行き来しても表示は残る」というルールを追加しました |
| サーバ側は触った？ | 触っていません。テストだけ増やしています |

## 2. Task 1〜5 完了確認

| Task | 内容 | 完了状態 |
|------|------|---------|
| Task 1 | 1a public-flow に email leak assertion 追加 | spec 編集完了（Phase 5） |
| Task 2 | 1b-A visibility round-trip assertion 追加 | spec 編集完了（Phase 5） |
| Task 3 | 1b-B delete round-trip assertion 追加 | spec 編集完了（Phase 5） |
| Task 4 | regression guard / flaky 抑制 | Phase 6 で確定 |
| Task 5 | 手動 3 層評価 / screenshot canonical 整合 | Phase 11 で完了 |

## 3. 更新したドキュメント

| ファイル | 内容 |
|---------|------|
| `docs/30-workflows/e2e-quality-uplift-stage-1/phase-4.md..phase-13.md` | 新規作成 |
| `docs/30-workflows/e2e-quality-uplift-stage-1/index.md` | Phase status table を done に更新 |
| `docs/00-getting-started-manual/specs/*.md` | 改修不要 |
| `CLAUDE.md` | 改修不要（不変条件は既存のまま） |

## 4. 未タスク化（Stage 2 以降への送り）

| ID | 概要 | 提案 |
|----|------|------|
| U-1 | `LEAK_PROBE_EMAIL` を fixture seed に追加 | Stage 2 |
| U-2 | `mockMeWithPending` を global util 化 | Stage 2 / 3 |
| U-3 | `/@/` probe を `/login` / `/admin/*` に横展開 | Stage 2 |
| U-4 | `signSession` TODO_PLACEHOLDER 実 Auth.js 署名化 | 別 workflow（auth uplift） |

## 5. lessons-learned 候補

| 学び | 反映先 |
|------|-------|
| E2E spec の regression-guard は production code 改修なしで価値ある | `aiworkflow-requirements/references/lessons-learned.md` 候補（Stage 2 で集約） |
| `page.route('**/api/me', ...)` の登録順序は `goto` 前必須 | 同上 |

## 6. 用語整合（DDD ユビキタス言語）

| 用語 | 定義 |
|------|------|
| `responseEmail` | Google Form 回答時に system が記録した送信者 email（公開禁止） |
| `pendingRequests` | `/api/me` が返す処理待ち申請の配列 |
| `round-trip` | 「別ページへ移動 → 元ページに戻る」操作 |
| `leak guard` | 公開してはいけない文字列が DOM に出ないことを assert する仕組み |
| `sticky guard` | 一度表示された state がページ遷移後も維持されることを assert する仕組み |

## 7. Phase 13 入口条件

- [ ] Task 1〜5 すべて done
- [ ] §4 未タスクが Stage 2 spec の入力候補として整理済
- [ ] index.md の Phase status table を更新可能な状態

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-1
- phase: 12
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_verified

## 目的

Stage 1 の E2E quality uplift 変更を skill 定義と実ファイル差分へ同期し、矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

## 実行タスク

- 既存本文の phase 内容を実行単位として保持する。
- 実ファイル変更、仕様書、Phase evidence、skill feedback の対応を確認する。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/quality-gates.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 実行手順

1. 本 phase の既存本文を確認する。
2. 対応する実ファイル差分または evidence を確認する。
3. validator と grep gate の結果を Phase 11 / Phase 12 evidence に反映する。

## 成果物

- 本 phase markdown
- 関連 outputs/phase-11 または outputs/phase-12 evidence
- 必要に応じた apps/web / .claude/skills 実ファイル差分

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: E2E tier-aware standard lines >=70%、workspace coverage guard は既存基準に従う。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。

