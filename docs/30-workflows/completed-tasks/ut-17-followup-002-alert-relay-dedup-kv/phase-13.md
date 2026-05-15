# Phase 13: PR 作成

[実装区分: 実装仕様書]

## 前提

**ユーザーの明示承認後のみ実施**。仕様書作成プロンプトでは PR 作成・push・commit は一切行わない（CLAUDE.md / CONST_002 / 本仕様書の禁止事項）。

## 実施手順（承認後）

CLAUDE.md「PR 作成の完全自律フロー」に従う。

1. ブランチ確認 / 必要なら `feat/ut-17-followup-002-alert-relay-dedup-kv` を作成
2. `git fetch origin dev` → ローカル `dev` を `origin/dev` に fast-forward
3. 作業ブランチに `dev` をマージ。コンフリクトは CLAUDE.md の方針で自律解消
4. 品質検証:
   ```bash
   mise exec -- pnpm install --force
   mise exec -- pnpm typecheck
   mise exec -- pnpm lint
   ```
5. `git status --porcelain` がクリーン、`git diff dev...HEAD --name-only` が想定ファイル一覧と一致
6. `gh pr create --base dev` で PR 作成
   - PR タイトル: `feat(api): alert-relay dedup を Cloudflare KV namespace へ移行 (issue-634)`
   - PR 本文: Phase 12 `implementation-guide.md` の内容反映 + Phase 11 NON_VISUAL 宣言
   - スクリーンショットセクションは設けない（NON_VISUAL）

## base ブランチ

- 既定: `dev`
- `main` への PR は production リリース時の `dev → main` のみ

## DoD

- [ ] PR URL が取得できる
- [ ] CI required status check が PASS（`audit-correlation-verify / verify` 含む）
- [ ] PR 本文に Phase 1-12 の主要成果物への参照リンクが含まれる
- [ ] Cloudflare staging deploy + Phase 11 smoke test 結果が PR 本文に記載される（ユーザー判断で）

## 禁止事項

- PR レビュー回避 (`--no-verify`、hooks skip)
- `main` への直接 PR（dev 経由必須）
- ユーザー明示承認なしの merge
## メタ情報

- taskId: ut-17-followup-002-alert-relay-dedup-kv
- phase: 13
- status: blocked_pending_user_approval

## 目的

commit / push / PR および Cloudflare runtime mutation の user approval gate を保持する。

## 実行タスク

- ユーザー承認後にだけ external ops と PR 作成を行う。

## 参照資料

- `index.md`
- `outputs/phase-12/main.md`

## 成果物/実行手順

- 現サイクルでは成果物なし。

## 完了条件

- [ ] ユーザーが Phase 13 実行を明示承認する

## 統合テスト連携

- staging runtime smoke は user-gated。
