# Phase 9: review readiness

## 目的

Phase 8 までの成果物を PR レビュー可能な状態に整え、PR 説明文ドラフト・変更ファイル一覧・レビュアー向け確認ポイントを準備する。

## 入力

- Phase 8 成果物 `outputs/phase-08/docs-updates.md`
- Phase 7 差分ゼロ宣言
- `.claude/commands/ai/diff-to-pr.md`（PR 本文テンプレート）

## 作業手順

1. `git diff dev...HEAD --name-only` で本 PR に含まれるファイル一覧を取得し、`outputs/phase-09/review-readiness.md` に列挙する。
2. PR 説明文ドラフトを作成する。必須要素:
   - タイトル: `docs(ut-07a-04): ADR 0002 - member_tags.assigned_via_queue_id を追加しない決定を正本化 (Refs #296)`
   - Summary 3 点: ADR 起票 / spec & skill 同期 / 07a 親への back-link
   - 判断根拠 4 点（audit_log で追跡可 / 波及範囲広い / MVP 監査要件達成済み / source='admin_queue' で識別可）
   - Re-evaluation triggers 3 件
   - 実装区分 = ドキュメントのみ（コード差分ゼロ）の明示
   - 検証コマンド: `rg "assigned_via_queue_id" apps/ packages/` = 0 件 / `git diff dev...HEAD --stat -- apps/ packages/` = empty
   - `Refs #296`（Issue は既に CLOSED のため Closes は使わない）
3. レビュアー向け確認ポイントを列挙する:
   - ADR セクション 7 種が揃っているか
   - spec / skill / 07a 親の相互参照が貼られているか
   - コード差分がゼロであるか
4. PR base = `dev` を明記する。

## 出力成果物

- `outputs/phase-09/review-readiness.md`
  - PR 変更ファイル一覧
  - PR 説明文ドラフト
  - レビュアー向け確認ポイント

## 検証コマンド

```bash
# 変更ファイル一覧
git diff dev...HEAD --name-only

# docs のみが変更対象であること
git diff dev...HEAD --name-only | grep -v -E '^(docs/|\.claude/skills/)' || echo "OK: docs-only diff"

# PR 説明文に必須要素が含まれているか
rg -n "Refs #296|ドキュメントのみ|ADR 0002|再評価トリガ" \
  docs/30-workflows/issue-296-ut-07a-04-assigned-via-queue-id-decision/outputs/phase-09/review-readiness.md
```

## DoD

- [ ] 変更ファイル一覧を取得した
- [ ] PR 説明文ドラフトを作成した（タイトル / Summary / 判断根拠 / 再評価トリガ / Refs #296）
- [ ] レビュアー向け確認ポイント 3 件以上を記載した
- [ ] PR base = `dev` を明記した
- [ ] docs-only であることを明記した
