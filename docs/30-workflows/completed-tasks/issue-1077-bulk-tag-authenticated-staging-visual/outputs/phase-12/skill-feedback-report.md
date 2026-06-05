# Skill Feedback Report

task-specification-creator / aiworkflow-requirements への改善フィードバック。

## 1. 再利用パターンの横展開候補（最大の学び）

既存 authenticated staging Playwright 基盤（`mint-staging-storage-state.ts` / `staging-visual-authenticated` project / `playwright-staging-visual-authenticated.yml`）へ **新規 spec を 1 ファイル追加するだけ** で、config 編集・CI 編集なしに新しい認証付き visual baseline を低コストで増設できることが確認できた。

- 提案: この「既存 authenticated 基盤に spec を足すだけ」パターンを skill reference に明文化し、admin 配下の他画面（schema / requests / audit など）への横展開テンプレートとして再利用する。参照モデルは `admin-dashboard-authenticated.spec.ts`。

## 2. issue の陳腐化検出パターン

issue #1077 は作成時（2026-06-01）「手動 user-gated screenshot 取得」前提だったが、その後に認証付き staging 基盤が landed したため、root solution が「手動取得」→「interaction-gated authenticated spec のコード化」へ最適化できた。

- 提案: 「issue 作成日 < 関連基盤 land 日」のケースは現行コードを Read して root solution を再評価する、という前提検証ステップを spec 作成の標準手順に組み込む（過去 lessons とも整合）。

## 3. mutation 副作用境界によるスコープ分割の定型化

read-only baseline（picker 表示）と mutation を要する baseline（result summary）を、共有 staging D1 への副作用有無で機械的に分割できた。副作用ありは current 未タスクへ、機能担保は component spec へ委譲、という配分が再現性高く適用できる。

- 提案: 「visual baseline タスクでは mutation 副作用の有無でスコープ境界を引く」をチェックリスト化する。

## 4. canonical screenshot 名の SSOT 一元化

`toHaveScreenshot` arg / artifacts.json `canonical_screenshots` / phase-11 / implementation-guide で screenshot 名が分散しがちだった。artifacts.json を SSOT とし他を参照させる運用で drift を防げた。

- 提案: phase12-compliance §4 evidence inventory の Path は artifacts SSOT から導出する旨を skill に明記。

> 改善が軽微でも本ファイルは strict-7 として必須出力。上記は this wave での skill 反映候補。
