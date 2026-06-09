---
workflow_id: member-data-source-precedence-and-profile-session-fix
phase: 13
name: commit / PR / release
status: pending_user_approval
updated: 2026-06-09
---

# Phase 13 — commit / PR / release（member-data-source-precedence-and-profile-session-fix）

> **すべて user 明示承認後のみ実行**。本ワークフローは `implemented_local_runtime_pending` まで進めたが、commit / push / PR / D1 適用 / deploy は**一切行わない**。
> PR base = `dev`（CLAUDE.md PR 既定方針）。production への反映は別途 `dev → main` で行う。

---

## 0. 実行前提（順序ゲート）

1. 実装（Lane A → B/C-1/E 並列 → C-2 → D → 統合検証）が完了している。
2. Phase 11 計画コマンド（typecheck / lint / 対象 vitest / HEX gate）がローカルで GREEN。
3. Lane D の screenshot を user-gated で取得済み（`outputs/phase-11/screenshots/<component>-<state>.png`）。
4. D1 migration `0028_member_field_overrides.sql` を staging に apply 済み（user-gated）。

---

## 1. commit 計画（user 承認後）

作業ブランチ: `feat/member-data-source-precedence-and-profile-session-fix`（detached HEAD の場合は実装着手時に作成）。

```bash
# 例（user 承認後のみ）
git add -A
git commit -m "feat(member): 会員データソース3層プレシデンス反映 + /profile セッションエラー修正

- Lane A: member_field_overrides テーブル(0028) + member_identities provenance 列
- Lane B: Sheets 経路を response_fields 書込モデルへ合流 + RC-1/RC-2 ラベル・同意マップ是正 + import-once
- Lane C: field-precedence 純関数 projection + PUT /admin/member-fields/:memberId
- Lane D: MemberFieldEditor(admin) + 公開/会員 merged 表示
- Lane E: /me ステータス正規化 + profile エラー分岐是正

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## 2. PR 作成チェックリスト（base=dev・user 承認後）

- [ ] `git fetch origin dev` → ローカル `dev` を ff 同期 → 作業ブランチに `dev` をマージ（conflict は CLAUDE.md 既定方針で解消）。
- [ ] `pnpm install --force` / `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh` が GREEN。
- [ ] `git status --porcelain` が空（未コミット変更なし）。
- [ ] `git diff dev...HEAD --name-only` で PR 対象ファイル一覧を取得（漏れなし確認）。
- [ ] PR 本文に `outputs/phase-12/implementation-guide.md` の Part 1/Part 2 主要見出しを反映。
- [ ] `outputs/phase-11/screenshots/` に PNG がある場合は PR 本文に参照を含める（無ければ screenshot セクションを作らない）。
- [ ] `gh pr create --base dev`。

```bash
# 例（user 承認後のみ）
gh pr create --base dev \
  --title "feat(member): 会員データソース3層プレシデンス反映 + /profile セッションエラー修正" \
  --body-file <(cat outputs/phase-12/implementation-guide.md)
```

---

## 3. D1 migration 適用（user-gated）

```bash
# staging
bash scripts/cf.sh d1 migrations list ubm-hyogo-db --env staging      # 0028 が pending であること
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db --env staging     # user 承認後
# production（dev→main マージ後・別承認）
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production
```

適用後検証 SELECT（user-gated）:

```sql
-- テーブル/列が作成されたこと
SELECT name FROM sqlite_master WHERE type='table' AND name='member_field_overrides';
PRAGMA table_info(member_identities);  -- seed_source / seed_imported_at 列が存在
```

---

## 4. deploy（user-gated）

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging
```

> Lane E の transport 真因（H-2: staging で `API_SERVICE` binding / `INTERNAL_API_BASE_URL` 未解決）は、
> deploy 前後の staging 実機ログで切り分ける。binding 未設定が真因なら `apps/web/wrangler.toml` の config 修正（user-gated）で解消。

---

## 5. rollback（必要時・user-gated）

```bash
bash scripts/cf.sh rollback <VERSION_ID> --config apps/api/wrangler.toml --env production
```

> migration の rollback は D1 に down migration 機構が無いため、`member_field_overrides` DROP / 列削除の手動 SQL を別途用意（user-gated・本サイクルでは記述のみ）。

---

## 6. Gate 状態

| Gate | 内容 | 状態 |
|------|------|------|
| Gate-A | spec review（Phase 1-13 仕様 + strict 7 + artifacts parity） | passed（本サイクル） |
| Gate-B | implementation review（実装 + local 検証） | pending（user-gated） |
| Gate-C | external ops（commit / push / PR / D1 apply / deploy） | pending（user-gated） |
