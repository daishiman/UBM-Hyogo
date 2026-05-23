# Phase 7: ローカル smoke 確認

[実装区分: 実装仕様書]

## メタ情報

| Phase | 7 |
| 前提 | Phase 6 完了 |
| 後続 | Phase 8 |

## 目的

API + Web を同時起動し、人間操作で `/members` の動作を確認する。

## 実行手順

1. API 起動
   ```bash
   bash scripts/cf.sh d1 list   # auth 確認
   mise exec -- pnpm --filter @ubm-hyogo/api dev
   ```
2. Web 起動（別タブ）
   ```bash
   mise exec -- pnpm --filter @ubm-hyogo/web dev
   ```
3. ブラウザ確認: `http://127.0.0.1:3000/members`
4. mobile 表示確認: DevTools で width 375px に切替

## AC マトリクス

`outputs/phase-07/ac-matrix.md` を以下フォーマットで記録:

| AC | 操作 | 期待結果 | 結果 |
|----|------|---------|------|
| AC-1 | `/members` 初回ロード | 候補 chip ≥5 件表示 | |
| AC-2 | 候補 chip クリック | URL に `tag=XXX` append | |
| AC-3 | 5 件選択後 6 件目クリック | 未選択候補が disabled、hint 表示 | |
| AC-4 | mobile collapse 初期状態 | summary のみ表示 | |
| AC-5 | clear-all 押下 | URL が `/members` に戻る | |
| AC-6 | reload | URL の tag 復元 | |

## 成果物

- `outputs/phase-07/main.md`
- `outputs/phase-07/ac-matrix.md`
- `outputs/phase-07/manual-smoke-log.md`

## 完了条件

- [ ] AC マトリクス全件 pass
- [ ] DevTools console に error 無し

## タスク100%実行確認【必須】

- [ ] API + Web 同時起動した
- [ ] mobile / desktop 両方で確認した

## 次Phase

Phase 8 へ。
