# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 08b-parallel-playwright-e2e-and-ui-acceptance-smoke |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 作成日 | 2026-04-26 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし |
| 状態 | pending |

## ユーザー承認確認文 (冒頭必須)

**この Phase は user の明示承認がある場合のみ実行する。** 承認なしで commit / push / `gh pr create` を呼ぶことは禁止。承認は本 Phase 開始前に Phase 12 成果物 + Phase 11 evidence 仕様 + Phase 10 GO 判定をユーザーに提示し、明示同意を得てからのみ進める。

## 目的

仕様書一式を `feature/02-app-08b-e2e-tests` ブランチに配置し、`dev` への PR を作成。spec_created タスクなのでコード変更なし、docs only。Playwright + screenshot evidence + a11y report + CI workflow yml の placeholder を含む。

## 実行タスク

- [ ] approval gate
- [ ] local-check-result.md
- [ ] change-summary.md
- [ ] PR template
- [ ] gh pr create（承認後のみ）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-12/* | PR 本文素材 |
| 必須 | outputs/phase-11/evidence/ | screenshot / axe / report |
| 必須 | CLAUDE.md | ブランチ戦略 |

## approval gate

| チェック | 状態 |
| --- | --- |
| user 明示承認 | TBD |
| Phase 12 全 6 ドキュメント配置 | TBD |
| Phase 11 evidence 仕様・命名規約・実行ゲート定義済み | TBD |
| Phase 10 GO 判定 | TBD |
| 不変条件 #4 / #8 / #9 / #15 が E2E test としてカバー | TBD |
| 上流 6 task (06a/b/c, 07a/b/c) の状態確認 | TBD |
| 並列 08a との fixture / 命名整合 | TBD |

## local-check-result.md

```bash
pnpm typecheck
pnpm lint
pnpm docs:lint
# spec_created なのでコード差分なし、docs lint のみ必須
```

| コマンド | exit | 備考 |
| --- | --- | --- |
| pnpm typecheck | TBD | 差分なしなら 0 |
| pnpm lint | TBD | 差分なしなら 0 |
| pnpm docs:lint | TBD | markdown link / heading |
| markdown-link-check (本 task 配下) | TBD | spec link の生死 |
| artifacts.json schema validate | TBD | task-specification-creator skill schema |
| root / outputs artifacts parity | TBD | `artifacts.json` と `outputs/artifacts.json` が一致 |
| dependency link check | TBD | 06a/06b/07a/07b/07c/08a/09a/09b の実在パス確認、06c は blocked なら明記 |

## change-summary.md

| カテゴリ | 変更 | 影響 |
| --- | --- | --- |
| docs | 08b 配下 15 ファイル（index / artifacts / phase-01〜13） | spec のみ、コードなし |
| docs | outputs/phase-01〜13/* | spec 詳細 + evidence 仕様 |
| invariants | #4 (profile 編集 form 不在) / #8 (localStorage 不依存) / #9 (`/no-access` 不在) / #15 (attendance 二重防御) を E2E test 戦略に固定 | 後続実装が test 化 |
| placeholders | playwright.config / fixtures / helpers / page objects / CI yml | 実装時にそのまま流用 |
| residual | visual regression / staging URL Playwright / firefox 追加 未割当 | unassigned に記録 |

## PR template

```markdown
## Summary
- Wave 8b の Playwright E2E + UI acceptance smoke 戦略 15 ファイル + outputs/* 30 ファイル超
- 7 spec (public / login / profile / admin / search / density / attendance) × 2 viewport (desktop / mobile) × 2 browser (chromium / webkit) で 09-ui-ux.md の検証マトリクスを完全網羅
- 不変条件 #4 (profile 本文 D1 override 禁止) / #8 (localStorage を正本にしない) / #9 (`/no-access` 不在 / AuthGateState 5 状態) / #15 (attendance 二重防御 + 削除済み除外) を E2E test として固定
- `@axe-core/playwright` で WCAG 2.1 AA 主要違反 0 を担保
- screenshot evidence 30 枚以上の命名規約と実行ゲートを定義（実 screenshot は後続実装 task / 09a で取得）
- spec_created: コード変更なし、後続 task で実装

## Test plan
- [ ] doc lint pass
- [ ] markdown link check pass
- [ ] artifacts.json schema valid
- [ ] root / outputs artifacts parity valid
- [ ] dependency link check pass（06c が未配置なら blocked として明記）
- [ ] Phase 1〜13 必須セクション準拠
- [ ] 不変条件 #4 / #8 / #9 / #15 が phase-04 / phase-06 / phase-07 / phase-09 で test として記述
- [ ] AC-1〜8 が Phase 7 matrix で 1:1 対応
- [ ] screenshot evidence path 規約が implementation-guide に明記
- [ ] eslint rule 提案（apps/web/tests から D1 禁止 / `/no-access` literal 禁止 / localStorage 正本利用禁止）

## Related
- 上流: 06a (public pages), 06b (member login/profile), 06c (admin pages), 07a (tag queue), 07b (schema alias), 07c (attendance/audit)
- 並列: 08a (api contract & authz tests) — fixture / brand 型 / 命名整合
- 下流: 09a (staging deploy smoke), 09b (cron / monitoring / release runbook)
- 設計: docs/30-workflows/02-application-implementation/_design/phase-2-design.md (Wave 8b)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
```

## ブランチ / マージ戦略

```
feature/02-app-08b-e2e-tests  ──PR──>  dev  ──PR──>  main
```

- dev へのマージ: 1 名レビュー
- main マージ: 2 名レビュー
- 本タスクは docs only のため Cloudflare deploy への影響なし

## CI チェック

- docs lint / markdown link check / artifacts.json schema validate
- spec_created なので Playwright 実 run は本 PR では行わない（後続実装 task で初実行）

## close-out チェックリスト

- [ ] user 承認
- [ ] local-check-result.md 配置
- [ ] change-summary.md 配置
- [ ] PR URL を outputs/phase-13/main.md に記録
- [ ] artifacts.json phase 13 completed
- [ ] artifacts.json 最終更新日時記録

## 統合テスト連携

| 連携先 | 連携内容 |
| --- | --- |
| 並列 08a | 同 wave のため 2 PR セット運用、08a → 08b 順 or 並列 merge |
| 下流 09a / 09b | dev マージ後に着手可、CI workflow yml を release runbook に組込 |

## 多角的チェック観点

- 不変条件 **#4 / #8 / #9 / #15** PR 本文に明記
- spec_created の責務として code 差分なし確認（playwright.config / page object / fixture / helpers / CI yml はすべて placeholder）
- secret hygiene: PR diff に secret 文字列 / cookie 値 / email 実値なし
- screenshot evidence の path 規約を PR で確認可能。spec_created では実 screenshot 配置を完了条件にしない
- 上流 6 task の merge 状況をリンクで明示（依存があるため）

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | approval gate | 13 | pending | user 承認 |
| 2 | local-check-result | 13 | pending | typecheck / lint / docs / link / artifacts validate |
| 3 | change-summary | 13 | pending | diff |
| 4 | PR template | 13 | pending | 上記雛形 |
| 5 | gh pr create | 13 | pending | 承認後のみ |
| 6 | PR URL 記録 | 13 | pending | outputs/phase-13/main.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/main.md | PR 結果 + URL |
| ドキュメント | outputs/phase-13/local-check-result.md | typecheck / lint / docs |
| ドキュメント | outputs/phase-13/change-summary.md | diff |
| ドキュメント | outputs/phase-13/pr-template.md | 雛形 |
| メタ | artifacts.json | phase 13 status |

## 完了条件

- [ ] user 承認
- [ ] 4 ドキュメント生成
- [ ] PR URL 記録
- [ ] docs lint / link check / artifacts parity green

## タスク100%実行確認【必須】

- [ ] user 承認確認
- [ ] 全成果物配置
- [ ] PR URL 記録
- [ ] artifacts.json phase 13 completed
- [ ] docs lint / link check / artifacts parity green

## 次 Phase

- 次: なし（タスク完結）
- 引き継ぎ: PR URL を 09a / 09b へ、Playwright config / fixtures / page objects の placeholder 実装を後続実装 task に
- ブロック条件: user 承認なしで実行不可、上流 6 task 未 merge なら待機
