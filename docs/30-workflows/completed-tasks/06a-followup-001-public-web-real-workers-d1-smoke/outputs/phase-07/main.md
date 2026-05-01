# Phase 7 outputs — 要約

## 成果物

- `ac-matrix.md`: AC-1〜7 の verify / evidence / 不変条件 / 戻し先 7 行マトリクス（本フェーズの正本）
- 本ファイル: 構造と運用ルールの要約

## 確定事項

| 項目 | 内容 |
| --- | --- |
| AC 件数 | 7（AC-1〜7、複合 AC なし） |
| evidence ファイル | 3 種固定（`local-curl.log` / `staging-curl.log` / `staging-screenshot.png`） |
| 不変条件主担当 | #5 = AC-7、#1 = AC-3、#6 = smoke ルート選定で自動担保 |
| 失敗時の戻し先 | Phase 5 runbook / Phase 6 異常系 / Phase 2 設計 のいずれか単一 |

## 運用ルールサマリ

1. AC は単独で観測可能な単位に保つ（複合化しない）
2. evidence ファイル名は 3 種固定。追加データは `local-curl.log` 末尾セクションに追記
3. secret 値（API token / D1 id）は verify 出力に含めない
4. AC-5 では `PUBLIC_API_BASE_URL` が localhost fallback でないことを明示確認

## Phase 8 への引き継ぎ

- evidence 3 ファイル固定ルールを DRY 化の前提として共有
- curl 行重複は Phase 5 runbook 内 1 箇所定義 + 参照構造に集約

## Phase 11 への引き継ぎ

- ac-matrix.md の verify 列をそのまま smoke 実施手順として参照可能
- 各 AC に対応する evidence 行を 1:1 で残せる構造
