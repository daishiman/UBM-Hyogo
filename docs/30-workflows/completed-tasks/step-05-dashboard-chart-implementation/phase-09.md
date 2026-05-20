# Phase 9: 移行 / rollout 戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 9 |
| 区分 | 設計 |
| 想定所要 | 0.1 人日 |

## 目的

本タスクのデプロイ戦略を確定する。後方互換 fallback が組み込まれているため、feature flag は不要。

## rollout 方針

| 項目 | 内容 |
| --- | --- |
| feature flag | 不要（`slices === undefined` で placeholder にフォールバックするため、API 未対応時もユーザーに変更が見えない） |
| 段階リリース | dev (staging) → main (production) の通常フロー |
| migration | なし（D1 schema 変更なし） |
| backfill | なし |
| 互換性 | 旧 caller (`<StatusDistribution slices={undefined} />`) が完全に動作する |

## デプロイ順序

1. **dev branch にマージ** → Cloudflare staging 自動デプロイ → `https://staging.<domain>/admin` で目視確認
2. **main branch にリリース PR** → Cloudflare production 自動デプロイ → production で目視確認

> 本タスク単体は production 直行も技術的には安全だが、`dev → main` の通常フローを守る（CLAUDE.md ブランチ戦略）。

## rollback 手順

UI component 改修のみのため、rollback は **git revert** で十分。Cloudflare の rollback 操作は不要。

```bash
# rollback 必要時
git revert <merge-commit-sha>
git push origin dev
# → Cloudflare staging 再デプロイで前 commit に戻る
```

## API 側 `byStatus` 追加時の連携

API 側で `byStatus` field が後追い実装されたとき、frontend は **追加の改修なしで自動的に chart 描画に切り替わる**（`toAdminDashboardUi()` が `byStatus` を `StatusSlice[]` に正規化すれば `StatusDistribution` がそれを受け取る）。

ただし `toAdminDashboardUi()` 側の正規化ロジックは別タスク化されているため、本ワークフローでは frontend 受け皿のみ用意し、API 側 PR とは独立してマージ可能。

## 実行タスク

- Phase 9: dev to main rollout と rollback を定義する。

## 参照資料

- - `phase-05.md`
- - `phase-08.md`
- - `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`

## 成果物

- - rollout / rollback table を成果物にする。

## 統合テスト連携

- - Phase 13 PR gate と rollback description に接続する。

## 完了条件

- [ ] rollout 方針が確定している
- [ ] rollback 手順が確認されている
- [ ] feature flag を使わない判断根拠が明記されている

## 依存Phase trace

- Phase 5 / phase-05.md
