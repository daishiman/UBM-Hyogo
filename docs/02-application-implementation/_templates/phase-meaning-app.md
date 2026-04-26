# アプリ実装文脈での Phase 意味定義

- 本ディレクトリ配下のタスクは **アプリ実装** の責務単位（17個）として分割されている。
- 各タスクは Phase 1〜13 の単一ライフサイクルを持ち、ディレクトリ名で実行順（Wave / serial / parallel）を表現する。
- Phase 4 以降は実コードに踏み込むが、本仕様書は **コードを書かず spec のみ** を成果物とする（spec_created）。
- Phase 5 は実装ステップを runbook + placeholder で記述する。
- Phase 12 は implementation guide / changelog / unassigned task / compliance check / skill feedback の同期で閉じる。
- Phase 13 は user approval があるまで blocked。

| Phase | 意味 |
| --- | --- |
| 1 | 該当責務の正本 specs（doc/00-getting-started-manual/specs/）を引き、scope と AC を固定する |
| 2 | コンポーネント / module / endpoint / DB table / 型 の設計を Mermaid と表で固める |
| 3 | simpler alternative とのトレードオフを書き、PASS-MINOR-MAJOR を判定する |
| 4 | テスト戦略（unit / contract / E2E / authorization）を先に設計する |
| 5 | 実装手順を runbook 化、コード placeholder と擬似コードで書く |
| 6 | 異常系（401 / 403 / 404 / 422 / 5xx / sync 失敗 / consent 撤回 / 削除済み）を洗う |
| 7 | AC matrix を作り、Phase 1 AC と Phase 4 検証を一対一対応させる |
| 8 | 型・命名・path / endpoint / module 名を DRY 化する |
| 9 | 品質（型安全 / lint / test / a11y）・無料枠・secret hygiene を確認する |
| 10 | GO/NO-GO を出す（依存先 wave の AC が満たされていなければ NO-GO） |
| 11 | manual smoke の手順を書き、UI / 認可 / Forms 同期 を人が確認できるようにする |
| 12 | implementation-guide.md / system-spec-update-summary.md / documentation-changelog.md / unassigned-task-detection.md / skill-feedback-report.md / phase12-task-spec-compliance-check.md を生成する |
| 13 | 承認後のみ PR を作る（feature/* → dev → main） |
