# Phase 3: 設計レビュー

## ゲート判定

**PASS — Phase 4 に進行可能**

## 4 条件評価

| 観点 | 評価 | 根拠 |
|------|------|------|
| 価値性 | ○ | 拡張機能由来エラー由来の運用ノイズを防御層で削減・将来の本物の混入を CSP report で検出可能 |
| 実現性 | ○ | 既存 `middleware.ts` 拡張のみ・新規ライブラリ不要・edge runtime 互換 |
| 整合性 | ○ | `getPublicEnv()` 経由・task-02 / task-05 / task-18 と矛盾なし |
| 運用性 | ○ | report-only 段階導入で production 影響リスク最小 |

## 因果ループ

- **強化**: CSP report → 違反パターン可視化 → enforce 切替の判断材料蓄積 → セキュリティ強化
- **バランス**: header 過剰追加 → サードパーティ script 動作不良 → report-only 段階で吸収

## 残リスクと緩和

| リスク | 緩和 |
|--------|------|
| `'unsafe-inline'` で XSS 防御弱い | Next.js inline script 互換のため初期段階は許容。nonce 化は別 task で対応 |
| OAuth callback 系で `form-action` violation | `authOrigin` を `form-action` 許可リストに含める設計済み |
| Workers OpenNext bundle で middleware が edge route で動作しない | 既存 admin/profile middleware で動作実績あり |

## MINOR 指摘 → 未タスク候補

- CSP nonce 化（`'unsafe-inline'` 排除）
- CSP enforce 切替（report 観測後）
- Report-To / Reporting-Endpoints header 追加（違反レポート集約）
