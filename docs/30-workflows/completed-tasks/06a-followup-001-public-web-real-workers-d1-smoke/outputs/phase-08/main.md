# Phase 8 outputs — DRY 化 Before / After

## 成果

curl 行と evidence 命名と Phase 5/6 重複の 3 領域を DRY 化。実装ファイルは作らない（仕様書化のみ）。

## DRY 1: curl 行

### Before

| 場所 | 行数 |
| --- | --- |
| Phase 4 curl matrix | 8 行（route × env） |
| Phase 5 runbook | 8 行（local / staging 用に再掲） |
| **合計** | **16 行重複** |

### After

| 場所 | 行数 |
| --- | --- |
| Phase 5 runbook 内 擬似 shell 関数 `smoke_routes` 定義 | 1 箇所 |
| Phase 5 runbook での呼び出し（local / staging） | 2 行 |
| Phase 4 curl matrix からの参照 | 関数名のみ参照 |
| **合計** | **3 箇所**（重複 16 → 3） |

## DRY 2: evidence ファイル命名

### Before

`curl.log` / `smoke-local.log` / `smoke-prod.log` 等の揺らぎ余地。

### After（3 ファイル固定）

| ファイル | 役割 |
| --- | --- |
| `local-curl.log` | local 起動ログ + 4 route family / 5 smoke cases + AC-3 API body summary + AC-7 rg 結果 |
| `staging-curl.log` | AC-5 vars 確認コメント + 4 route family / 5 smoke cases |
| `staging-screenshot.png` | staging で 1 ルート分の画面キャプチャ |

追加データは `local-curl.log` 末尾セクションに追記して吸収。

## DRY 3: Phase 5 runbook と Phase 6 異常系

### Before

- Phase 5: 正常系コマンド列挙
- Phase 6: 異常系リカバリコマンドを別途列挙
- esbuild mismatch 対応コマンドが両方に存在する余地

### After

- Phase 5: 正常系 + 起動前提（migration list 確認）のみ
- Phase 6: 失敗パターンと「Phase 5 runbook のステップ番号への戻し先」だけ
- esbuild mismatch は `scripts/cf.sh` 経由起動の単一手段で回避できることを AC-1 で確認する（リカバリ手順を Phase 6 に重複配置しない）

## 許容する重複（DRY 化しない）

| 項目 | 理由 |
| --- | --- |
| AC-2 と AC-4 の同一ルート | local / staging で観点軸が異なる |
| Phase 7 AC マトリクス と Phase 4 curl matrix | 切り口が異なる（AC × evidence vs route × env） |
| 不変条件 #5 の Phase 1 / 3 / 7 / 9 言及 | フェーズ責務として必要な再確認 |

## Phase 9 / 10 への引き継ぎ

- evidence 3 ファイル固定ルールが Phase 9 secret hygiene チェック対象を限定する
- DRY 化により Phase 11 実施手順が 1 関数 + 2 呼び出しで完結し、判定の再現性が上がる
