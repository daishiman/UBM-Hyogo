# Phase 13: PR 作成 — ut-web-cov-04-admin-lib-ui-primitives-coverage

[実装区分: 実装仕様書] — Phase 11 evidence と Phase 12 implementation-guide を入力に、`.claude/commands/ai/diff-to-pr.md` 準拠の PR を作成する手順を確定する。本仕様書作成タスクでは PR 作成を実行しない（後続実装サイクルで実行する仕様）。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-04-admin-lib-ui-primitives-coverage |
| phase | 13 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 実装区分 | 実装仕様書 |
| 判定根拠 | テスト追加コミットを base ブランチへ取り込む PR 作成手順を確定する。本フェーズ自体は仕様書記述のみで PR 作成は実行しない。 |

## 目的

Phase 9 品質ゲートと Phase 11 evidence を満たした状態で、`.claude/commands/ai/diff-to-pr.md` 準拠の PR を作成する手順を固定する。ブランチ命名・PR タイトル・PR 本文構成・事前ゲート・CI gate を確定する。

## 事前ゲート

PR 作成前に以下が全て満たされていること:

| ゲート | 確認方法 |
| --- | --- |
| Phase 9 品質ゲート全 PASS | typecheck / lint / test / build がローカルで 0 errors |
| Phase 11 coverage AC 達成 | `outputs/phase-11/coverage-diff.md` の 13 行が全て ✅ |
| Phase 11 manual smoke 全 PASS | `outputs/phase-11/manual-smoke-log.md` の 6 ステップが全て成功 |
| Phase 12 7 成果物作成済 | `outputs/phase-12/*.md` 全件存在 |
| `git status --porcelain` 空 | 未コミット差分なし |
| 実 secret 混入なし | 変更ファイルに `INTERNAL_AUTH_SECRET` 等の実値なし |

未充足の場合は当該 Phase へ回帰する。

## ブランチ命名

```
test/ut-web-cov-04-admin-lib-ui-primitives-coverage
```

- production code 改変なし・テスト追加のみのため `test/` プレフィックスを採用する。
- `feat/ut-web-cov-04-...` でも可だが、CONST_005 上「テスト追加」が主目的のため `test/` を推奨。
- ブランチ未作成 / `main` 直上の場合は CLAUDE.md「PR作成の完全自律フロー」に従い自律作成する。

## PR タイトル

```
test(web): ut-web-cov-04 admin lib + UI primitives coverage ≥85%
```

- 70 文字以内に収まる。
- conventional commit 形式: `test(scope): subject`。

## PR 本文構成（`.claude/commands/ai/diff-to-pr.md` 準拠）

```
## Summary

- apps/web の admin lib（server-fetch / api / types）と UI primitives 11 種について Vitest テストを 11 新規 + 2 既存拡張で追加し、coverage を AC（Stmts/Lines/Funcs ≥85% / Branches ≥80%）に引き上げた。
- production code は改変していない。`vitest.config.ts` の include / exclude / threshold も改変していない。
- 不変条件 #5 / #6 / #11 / #13 適合。

## Coverage before / after

<Phase 11 outputs/phase-11/coverage-diff.md の 13 行対照表をそのまま貼り付け>

apps/web 全体: lines 39.39% → <after%>

## Test plan

- [x] mise exec -- pnpm install
- [x] mise exec -- pnpm typecheck
- [x] mise exec -- pnpm lint
- [x] mise exec -- pnpm --filter @ubm-hyogo/web test
- [x] mise exec -- pnpm --filter @ubm-hyogo/web test:coverage
- [x] mise exec -- pnpm --filter @ubm-hyogo/web typecheck
- [x] mise exec -- pnpm --filter @ubm-hyogo/web lint
- [x] mise exec -- pnpm --filter @ubm-hyogo/web build

evidence: outputs/phase-11/manual-smoke-log.md / outputs/phase-11/coverage-diff.md

## 変更ファイル一覧

<git diff main...HEAD --name-only の出力を列挙>

## スクリーンショット

NON_VISUAL タスクのため不要。

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

- スクリーンショット欄は NON_VISUAL のため画像を貼らないが、欄自体は残し「NON_VISUAL タスクのため不要」と明記する（PR テンプレ整合のため）。
- `outputs/phase-11/` に画像が無いため画像参照は作らない（CLAUDE.md「スクリーンショット項目を作らない」ルールと整合させ、ここでは「不要」明記の 1 行のみ残す形をとる）。

## 変更ファイル抽出

```bash
git fetch origin main
git diff origin/main...HEAD --name-only
```

期待される出力（Phase 5 ランブック準拠）:

```
apps/web/src/lib/admin/__tests__/server-fetch.test.ts
apps/web/src/lib/admin/__tests__/api.test.ts
apps/web/src/lib/admin/__tests__/types.test.ts
apps/web/src/components/ui/__tests__/Toast.test.tsx
apps/web/src/components/ui/__tests__/Modal.test.tsx
apps/web/src/components/ui/__tests__/Drawer.test.tsx
apps/web/src/components/ui/__tests__/Field.test.tsx
apps/web/src/components/ui/__tests__/Segmented.test.tsx
apps/web/src/components/ui/__tests__/Switch.test.tsx
apps/web/src/components/ui/__tests__/Search.test.tsx
apps/web/src/components/ui/__tests__/icons.test.ts
apps/web/src/components/ui/__tests__/index.test.ts
apps/web/src/lib/url/login-state.test.ts
（任意: apps/web/src/components/ui/__tests__/primitives.test.tsx を縮小した場合）
docs/30-workflows/ut-web-cov-04-admin-lib-ui-primitives-coverage/**
```

production code に該当するパスが混入していたら commit 前に切り戻す（要 user approval）。

## PR 作成コマンド

CLAUDE.md「PR作成の完全自律フロー」と `.claude/commands/ai/diff-to-pr.md` に従う:

```bash
gh pr create --base main --title "test(web): ut-web-cov-04 admin lib + UI primitives coverage ≥85%" --body "$(cat <<'EOF'
<上記 PR 本文構成をそのまま展開>
EOF
)"
```

- base: `main`（CLAUDE.md ブランチ戦略に従う。solo 開発のため dev 経由必須ではないが、wave 全体運用にあわせ dev に向ける選択も可。本タスクでは `main` を既定とする）
- `--no-verify` / `--no-gpg-sign` は使用しない。

## CI gate

PR push 後に green を確認する gate:

| gate | 期待結果 |
| --- | --- |
| `verify-indexes` | PASS（本タスクで `.claude/skills/aiworkflow-requirements/indexes` を改変していないこと） |
| `lint` | PASS |
| `test` | PASS（既存 web test に regression 0） |
| `build` | PASS |
| branch protection (`required_linear_history` / `required_conversation_resolution` / force-push 禁止 / lock_branch=false / enforce_admins=true) | drift なし |

CI failure 時は CLAUDE.md「PR作成の完全自律フロー」品質検証失敗時の自動修復に従い、最大 3 回まで自動修復・新規 commit 追加で復旧する（amend は禁止）。

## 本仕様書作成タスクで実行しない事項

- 実 commit / push / PR 作成
- Cloudflare deploy
- `wrangler` 直接実行（必要な場合は `bash scripts/cf.sh` 経由）
- `vitest.config.ts` 改変
- production code 改変
- `.env` 実値の参照・出力
- `--no-verify` / hook skip

これらは本フェーズ仕様書作成の scope 外であり、後続実装サイクルで Phase 13 runbook に従い実行する。

## 参照資料

- `.claude/commands/ai/diff-to-pr.md`
- CLAUDE.md「PR作成の完全自律フロー」
- Phase 11 evidence (`coverage-diff.md` / `manual-smoke-log.md`)
- Phase 12 `implementation-guide.md`
- 起票根拠: 2026-05-01 実測 `apps/web/coverage/coverage-summary.json`

## 実行手順

- 対象 directory: `docs/30-workflows/ut-web-cov-04-admin-lib-ui-primitives-coverage/`
- 本仕様書作成タスクでは PR 作成・push・commit を実行しない。後続実装サイクルで本 runbook に従う。

## 統合テスト連携

- 上流: `06c-A-admin-dashboard`
- 下流: `09b-A-observability-sentry-slack-runtime-smoke`

## 多角的チェック観点

- 不変条件 #5 / #6 / #11 / #13 適合
- production code 改変 0 件であること（変更ファイル一覧で再確認）
- secret 実値の混入なし（PR 本文・コミット・evidence）
- CI gate 全 green
- スクリーンショット欄を NON_VISUAL として正しく扱う

## サブタスク管理

- [ ] 事前ゲート 6 項目を確認する
- [ ] ブランチ命名 / PR タイトルを確定する
- [ ] PR 本文構成を Phase 11 / Phase 12 evidence で埋める
- [ ] 変更ファイル一覧を `git diff main...HEAD --name-only` で抽出する
- [ ] CI gate 全 green を確認する
- [ ] outputs/phase-13/main.md を作成する

## 成果物

- `outputs/phase-13/main.md`: PR URL / 採用ブランチ / 自動修復履歴 / 解消コンフリクト / 残課題

## 完了条件

- PR が `main` へ作成され URL が記録されている
- CI 全 gate（verify-indexes / lint / test / build / branch protection）が green
- PR 本文に Coverage before/after 表 / Test plan / 変更ファイル一覧が含まれている
- スクリーンショット欄が NON_VISUAL 用文言で扱われている
- production code 改変 0 件であることが PR diff で確認できる

## タスク100%実行確認

- [ ] 実装区分が冒頭に明記されている
- [ ] 事前ゲート / ブランチ命名 / PR タイトル / PR 本文構成 / CI gate が表で整理されている
- [ ] 「本仕様書作成タスクでは PR 作成を実行しない」が明記されている
- [ ] 実装、deploy、commit、push、PR を実行していない（本仕様書作成フェーズの責務として）

## 次 Phase への引き渡し

本仕様書作成タスクはここで完了する。後続実装サイクルへ次を引き渡す: 事前ゲート 6 項目、ブランチ命名（`test/ut-web-cov-04-admin-lib-ui-primitives-coverage`）、PR タイトル、PR 本文構成、CI gate 5 項目、AC 未達時の Phase 5 / Phase 11 回帰条件。
