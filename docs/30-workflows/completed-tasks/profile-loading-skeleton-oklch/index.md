# profile-loading-skeleton-oklch

**[実装区分: 実装完了仕様書]** — コード変更とローカル証跡を伴う。

`/profile/loading.tsx` を簡素なテキスト placeholder から、profile card layout（avatar + 4 KV pairs）の skeleton 形状に置換する。OKLch token utility (`bg-surface-2`) のみを使用し、HEX 直書きなし。a11y 属性 (role/aria-busy/aria-live/sr-only) を必須化する。

## 由来

- source spec: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i07-profile-loading-skeleton/spec.md`
- parent workflow: `ui-prototype-alignment-mvp-recovery`
- 元 spec は in-place fix で完結予定だったが、本ディレクトリで Phase 1-13 仕様書として正式昇格する。

## メタ情報

| 項目 | 値 |
|------|-----|
| taskType | implementation |
| visualEvidence | VISUAL（UI skeleton 変更のため Phase 11 screenshot を保存） |
| workflow_state | implemented_local_evidence_captured |
| implementation_status | implementation_complete_pending_pr |
| scope | apps/web/app/profile/loading.tsx と spec 追加のみ |

## 昇格判断

source spec は当初 in-place fix 予定だったが、実装差分・証跡・親 tracking・Phase 12 strict 7 を同一 wave で閉じる必要があるため、本 workflow を canonical root として正式昇格した。source spec と unassigned-task は本 workflow への consumed trace を持つ。

## Phase 構成

| # | path | 内容 |
|---|------|------|
| 1 | phase-01.md | 要件定義（必達要件・制約・現状） |
| 2 | phase-02.md | 設計（コード本体・class 構造） |
| 3 | phase-03.md | タスク分解 |
| 4 | phase-04.md | テスト設計 |
| 5 | phase-05.md | 実装手順 |
| 6 | phase-06.md | 単体テスト実行 |
| 7 | phase-07.md | 静的解析 |
| 8 | phase-08.md | 統合・ビルド検証 |
| 9 | phase-09.md | regression / grep gate |
| 10 | phase-10.md | デプロイ事前確認 |
| 11 | phase-11.md | 証跡収集 |
| 12 | phase-12.md | ドキュメント整備・compliance |
| 13 | phase-13.md | PR 作成 |
