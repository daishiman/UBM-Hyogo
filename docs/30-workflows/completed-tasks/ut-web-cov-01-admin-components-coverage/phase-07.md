[実装区分: 実装仕様書]

# Phase 7: AC マトリクス — ut-web-cov-01-admin-components-coverage

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-01-admin-components-coverage |
| phase | 7 / 13 |
| 作成日 | 2026-05-03 |
| taskType | implementation |

## 目的

AC ↔ test case ↔ evidence path の対応関係を確定し、Phase 11 実測時にトレース可能な状態に固める。

## 変更対象ファイル一覧

| パス | 変更種別 |
| --- | --- |
| `outputs/phase-07/main.md` | 新規（本マトリクス転記） |

本仕様書は test ファイル変更を含まない。

## AC マトリクス

| AC ID | AC 内容 | test file | 主要 it 名 | evidence path |
| --- | --- | --- | --- | --- |
| AC-01 | MembersClient: happy / empty / mutation / authz-fail 代替の表示・遷移を明示 assertion で検証する | `components/admin/__tests__/MembersClient.test.tsx` | `happy: 複数件をテーブルで表示する`, `empty: members=[] / total=0`, `mutation: 詳細ボタン押下`, `authz-fail 代替: 削除済み行ラベル表示...` | outputs/phase-11/coverage-target-files.txt |
| AC-02 | TagQueuePanel: approve/reject mutation、authz-fail、filter URL、invalid JSON fallback、resolved/rejected disabled を検証する | `components/admin/__tests__/TagQueuePanel.test.tsx` | `mutation confirmed`, `mutation rejected 成功`, `authz-fail`, `不正な suggestedTagsJson`, `status=rejected の item...` | 同上 |
| AC-03 | AdminSidebar: nav accessibility と7リンクの label/href 全件を検証する | `components/layout/__tests__/AdminSidebar.test.tsx` | `管理メニュー nav が aria-label 付きで存在する`, `7 件のリンクをラベルと href の組で全件レンダーする` | 同上 |
| AC-04 | SchemaDiffPanel: 4ペイン分類、empty、alias成功/失敗、questionId null、form close、suggestedStableKey 初期値を検証する | `components/admin/__tests__/SchemaDiffPanel.test.tsx` | `happy: 4 ペイン...`, `mutation 成功`, `mutation 失敗`, `questionId が null`, `suggestedStableKey...` | 同上 |
| AC-05 | MemberDrawer: profile/tag直接編集禁止、loading/fetch error、publish/note/delete/restore mutation、audit/edit URL分岐を検証する | `components/admin/__tests__/MemberDrawer.test.tsx` | `profile 本文 textarea/input が存在しない`, `mutation - publishState`, `mutation - メモ投稿`, `論理削除`, `復元`, `editResponseUrl 未取得` | 同上 |
| AC-06 | MeetingPanel: empty、create/add/remove mutation、authz/409/422/error、validation、既存出席disabled、note表示を検証する | `components/admin/__tests__/MeetingPanel.test.tsx` | `createMeeting 成功`, `authz-fail`, `addAttendance 422`, `addAttendance 409`, `removeAttendance 成功/失敗` | 同上 |
| AC-07 | AuditLogPanel: URL builder、JST formatting、PII masking、summary、render分岐、empty/error、paginationを検証する | `components/admin/__tests__/AuditLogPanel.test.tsx` | `maskAuditJson`, `formatJst`, `buildAuditHref`, `AuditLogPanel — render 分岐` | 同上 |
| AC-08 | 全対象7 componentで Stmts/Lines/Funcs >=85%, Branches >=80% | 全対象 test file | aggregate | outputs/phase-11/coverage-target-files.txt |
| AC-09 | 既存 web test に regression なし | 全 test file | `pnpm --filter @ubm-hyogo/web test:coverage` | outputs/phase-11/vitest-run.log |

## 主要シグネチャ・入出力

- 各 it: `expect(...).toHaveBeenCalledWith(...)` または `expect(screen.get*).toBeInTheDocument()` で明示 assertion
- coverage evidence: v8 provider が出力する `coverage-summary.json` と HTML report
- regression evidence: vitest 実行ログ

## テスト方針

- AC マトリクスの各行は test ID（it 名）と一意対応
- evidence path は Phase 11 で生成される `outputs/phase-11/coverage-target-files.txt` と `outputs/phase-11/coverage-summary.snapshot.json` で集約

## ローカル実行・検証コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage
# evidence 取得
cp apps/web/coverage/coverage-summary.json docs/30-workflows/ut-web-cov-01-admin-components-coverage/outputs/phase-11/
```

## 完了条件 (DoD)

- AC ID（AC-01〜AC-12）が test ファイルおよび具体的 it 名と一意対応
- evidence path が Phase 11 のディレクトリ構造と整合
- AC-11 / AC-12 の数値根拠が `coverage-summary.json` に依存することが明記

## サブタスク管理

- [x] AC 一覧化
- [x] AC ↔ test ↔ evidence 対応表作成
- [ ] outputs/phase-07/main.md 作成

## 次 Phase への引き渡し

Phase 8 へ、本 AC マトリクスを実装計画 (Phase 5 runbook) と突合して進捗追跡可能であることを引き渡す。

## Template Compliance Addendum

## 実行タスク

- 既存本文の目的、変更対象、テスト方針、ローカル実行コマンド、完了条件に従って本 Phase の作業を実行する。
- Phase completion は `artifacts.json` と `outputs/artifacts.json` の status、および該当 `outputs/phase-XX/main.md` で記録する。

## 参照資料

- `index.md`
- `artifacts.json`
- `outputs/phase-11/vitest-run.log`
- `outputs/phase-11/coverage-target-files.txt`

## 成果物/実行手順

- 成果物: `outputs/phase-07/main.md`
- 実行手順: 本 Phase の変更対象と検証コマンドを確認し、結果を outputs に記録する。

## 統合テスト連携

- 本タスクは apps/web component unit coverage hardening であり、外部 integration test は追加しない。
- 回帰確認は `pnpm --filter @ubm-hyogo/web test:coverage` の同一実行で担保する。
