# Phase 10 — リリース準備

## 目的

本仕様書の承認・merge 後に行う 3 つの同期作業の順序を確定する。

## 同期対象と順序

1. **本ディレクトリの merge**（Phase 13 で PR 作成 → user 承認 → merge）
2. **09c parent への参照追記**: `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/index.md` の参照セクションに本仕様書を追加
   - workflow_state は **変更しない**（spec_created or completed のいずれであっても据え置き）
3. **aiworkflow-requirements 導線追加**: `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` および `deployment-cloudflare-opennext-workers.md` に本仕様書 path を 1 行追記
4. **archive ディレクトリの初期化**: `docs/30-workflows/completed-tasks/09c-.../outputs/phase-11/long-term-evidence/.gitkeep` を配置

> 順序の根拠: 本仕様書が merge されてから 09c 親 / aiworkflow から参照することで、リンク先 404 を防ぐ。Phase 11 のサンプル取得は本仕様書 merge 後の運用サイクルで行うか、Phase 13 commit に含める（後者を採用）。

## rollback 戦略

- 採用方式に致命的な制約が判明した場合: 本仕様書の `decision-matrix.md` を fallback B（手動 CSV）採用に書き換え、Phase 5/6 を再走
- aiworkflow 同期 commit は本仕様書 commit と同 PR で行い、不整合を残さない

## 出力

- `outputs/phase-10/main.md`: 同期順序 + rollback 戦略

## 完了条件

- [ ] 同期 4 ステップが順序付きで列挙
- [ ] 09c parent state を変更しない宣言
- [ ] aiworkflow-requirements への追記対象ファイルが 2 件明示

## 受け入れ条件（AC mapping）

- AC-7, AC-8

## 検証手順

```bash
grep -E "deployment-cloudflare\.md|deployment-cloudflare-opennext-workers\.md" docs/30-workflows/issue-347-cloudflare-analytics-export-decision/outputs/phase-10/main.md
```

## リスク

| リスク | 対策 |
| --- | --- |
| 09c parent index.md の section 構成が drift | Phase 12 実行時に実 file を read し挿入位置を確定 |
