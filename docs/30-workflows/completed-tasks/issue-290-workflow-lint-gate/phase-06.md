# Phase 6: 失敗ケース

[実装区分: 実装仕様書]

## 失敗ケース一覧

| # | 失敗事象 | 原因 | 影響 | 検出 | 対応 |
| --- | --- | --- | --- | --- | --- |
| F1 | 既存 workflow に lint error が潜む | これまで未検査の 21 件 | CI 全面 fail | T1 ローカル先行実行 | error を 1 件ずつ最小修正 |
| F2 | actionlint バージョン非固定で CI 不安定 | `download-actionlint.bash` がデフォで latest 取得 | 突発 CI fail | Phase 3 review | バージョン `1.7.7` 固定 |
| F3 | shellcheck 系 false positive | bash here-doc / 動的 source | CI fail | T1 ローカル実行 | `# actionlint-shellcheck shell=bash` / `# shellcheck disable` 注釈 |
| F4 | 一時 workflow を `.github/workflows/` に置いてしまい誤検査 | 検証用 yaml 混入 | CI fail | review | `index.md` で production 限定運用ルール明示 |
| F5 | 自己 lint との重複により CI 時間増 | `verify-gate-metadata` / `audit-correlation-verify` 自己 lint 維持 | +数秒 | 計測 | 許容範囲のため対応なし |
| F6 | yamllint 不採用判断が後年再燃 | 評価表が消失 | 議論再発 | review | `outputs/phase-02/yamllint-decision.md` を正本固定 |
| F7 | runbook の URL リンク腐敗 | actionlint repo 移転 | 復旧不能 | 半期 review | リポジトリ正本 path を文中冗長に記載 |

## ロールバック手順

`ci.yml` の actionlint step を git revert で 9 件列挙形式に戻す。runbook は残置可（参考情報として無害）。
