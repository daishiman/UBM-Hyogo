# Phase 9: 品質保証（QA）

## メタ情報

- task_id: `admin-members-timestamp-jst-and-identity-label-clarity`
- 前提: [shared-context.md](shared-context.md) / [phase-1-requirements.md](phase-1-requirements.md) / [phase-2-design.md](phase-2-design.md) / [phase-8-refactor.md](phase-8-refactor.md)
- workflow_state: `implemented_local_evidence_captured`（focused Vitest と local Playwright screenshot は実行済み。typecheck / lint / tokens は追加 QA 対象）
- 本 Phase の責務: line budget / lint / mirror parity / トークン gate / api 非変更 / 既存テスト互換 / 削除確認を一括判定する QA チェックリストを `チェック項目 / コマンド / 期待結果 / 対応 AC` で確定する
- レーン: Lane B

## QA チェックリスト（正本）

| # | チェック項目 | コマンド | 期待結果 | 対応 AC |
| --- | --- | --- | --- | --- |
| Q-1 | 型チェック（import パス破壊・型不整合なし） | `mise exec -- pnpm typecheck` | exit 0・エラー 0 | AC-2/3/5/7 |
| Q-2 | Lint（コードスタイル・未使用 import なし） | `mise exec -- pnpm lint` | exit 0・違反 0（必要なら `pnpm lint --fix`） | 全 AC |
| Q-3 | OKLch トークン正本（HEX 直書き 0） | `mise exec -- pnpm verify:tokens` | 緑（PASS）。HEX / `bg-[#xxx]` / `text-[#xxx]` 0 件 | AC-9 |
| Q-4 | apps/api 非変更 | `git diff --name-only -- apps/api` | 出力が**空**（D1 migration / Google Form schema も非変更） | AC-10 |
| Q-5 | `boolLabel` 削除確認 | `grep -rn 'boolLabel' apps/web` | live import / 呼び出しが **0 件**（git delete OR live import ゼロ） | AC-4/6/7 |
| Q-6 | 既存テスト互換（英語キー併記で破壊なし） | focused vitest（下記 Q-7 と同一コマンド） | 既存 spec の `getByText("memberId")` 等が PASS（英語キー文字列は `<span>` で DOM に残す） | AC-11 |
| Q-7 | focused vitest（helper / SSOT / 一覧 / IDENTITY / DIAGNOSTICS） | 下記「focused vitest コマンド」 | 全 spec PASS（5 ファイル） | AC-1〜8/11 |
| Q-8 | line budget（変更ファイルの肥大化なし） | `wc -l apps/web/src/features/admin/components/_members/memberSystemFieldGlossary.ts` 他 | 新規 SSOT は純データ + 1 関数で短い（目安 ≤ 60 行）。既存編集ファイルは差分が描画行に限定 | — |
| Q-9 | mirror parity（skill ミラー整合） | `diff -qr .claude/skills/aiworkflow-requirements .agents/.../aiworkflow-requirements`（symlink の場合は同一実体） | 差分なし / symlink byte-identical | — |
| Q-10 | gate-metadata 整合 | `pnpm gate-metadata:validate --require-gates-for-changed <root>/artifacts.json <root>/outputs/artifacts.json` | ERROR 0・Gate-A passed | — |
| Q-11 | phase12-compliance | `pnpm verify:phase12-compliance` | `ok:true`（canonical 9 見出し・Phase 11 evidence 表整合） | — |
| Q-12 | indexes drift なし | `mise exec -- pnpm indexes:rebuild` → `git diff --quiet` | drift 0（rebuild 後に差分が出ない・冪等） | — |

> `<root>` = `docs/30-workflows/completed-tasks/admin-members-timestamp-jst-and-identity-label-clarity`

## focused vitest コマンド（SSOT §8 と一致）

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/lib/format/__tests__/datetime.spec.ts \
  apps/web/src/features/admin/components/_members/__tests__/memberSystemFieldGlossary.spec.ts \
  apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx \
  apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.identityLabels.spec.tsx \
  apps/web/src/features/admin/components/_members/__tests__/MemberDiagnosticsPanel.spec.tsx
```

> focused 実行は**ルートからフルパス指定**する（package dir 相対 filter は absolute include glob に非マッチになる既知の落とし穴・MEMORY）。

## AC-9（HEX 0・verify:tokens 緑）の確認手順

1. 新規 `memberSystemFieldGlossary.ts` は純データ/純関数で className を持たない（色トークン非関与）。
2. 編集対象 3 コンポーネントで追加する className は `var(--ubm-color-*)`（既存 dt の `text-[var(--ubm-color-text-muted)]` 継承）と Tailwind ユーティリティ（`ml-1` / `font-mono` / `text-[10px]` / `opacity-60`）のみ。**HEX / `bg-[#...]` / `text-[#...]` を導入しない**。
3. `opacity-60` は Tailwind opacity ユーティリティで色 HEX を含まないため AC-9 に非抵触（Phase 3 リスク確認済み）。
4. 検証: `mise exec -- pnpm verify:tokens` が緑。補助で `grep -rnE '#[0-9a-fA-F]{3,6}|bg-\[#|text-\[#' apps/web/src/features/admin/components/_members apps/web/src/lib/format/datetime.ts` が 0 件。

## AC-10（apps/api 非変更）の確認手順

1. 本タスクは表現層のみ（SSOT §2・§7）。型 `AdminMemberListItem` / `AdminMemberDetailView`（`packages/shared`）・`MemberDiagnosis`（apps/web 内）は**読み取りのみ**。
2. 検証: `git diff --name-only -- apps/api` が**空**であること。
3. 併せて `git diff --name-only` の変更ファイルが SSOT §5 の F1〜F5 + T1〜T5 のみ（apps/api / migrations / google-form 配下を含まない）であることを目視確認する。

## AC-11（既存テスト互換）の確認手順

1. 着手前に既存テストの英語キー exact 一致依存を grep:
   ```bash
   grep -rn 'getByText("memberId"\|getByText("responseEmail"\|getByText("notificationOptOut"\|getByText("isDeleted"\|getByText("identity\|getByText("diagnostics' apps/web
   grep -rn 'memberId\|notificationOptOut\|isDeleted\|public visible\|H3\|H4' apps/web/playwright/tests/admin-member-delete.spec.ts
   ```
2. 併記方式により英語キー文字列は `<span>` 内に DOM 残存するため `exact:false` のクエリは PASS。`exact:true` で日本語ラベルとの結合により壊れる場合は、当該テスト側を併記対応（日本語ラベル assert 追加 / クエリ調整）に更新する（破壊放置は禁止）。
3. 検証: focused vitest（Q-7）全 PASS。既存 `MemberDrawer.tags.spec.tsx` 等の隣接 spec も巻き込み実行して回帰がないことを確認する。

## typecheck / lint の確認

- `pnpm typecheck`: 新 helper の戻り値型 `string`・SSOT の `as const satisfies Record<string,string>`・import パス整合を検証。
- `pnpm lint`: 未使用 import（削除した `boolLabel` 由来の残骸含む）・命名規則違反がないことを検証。`--fix` で自動修復可能な指摘は修復後に再実行する。

## QA gate サマリー

| gate | 状態 | 条件 |
| --- | --- | --- |
| typecheck | pending | exit 0 |
| lint | pending | exit 0 |
| verify:tokens | pending | 緑（HEX 0） |
| api 非変更 | pending | `git diff -- apps/api` 空 |
| boolLabel 削除 | pending | grep 0 件 |
| focused vitest | PASS | 5 spec / 41 tests PASS |
| phase12-compliance | 本仕様作成で `ok:true` を維持 | 維持 |
| gate-metadata | 本仕様作成で ERROR 0 を維持 | 維持 |
| indexes | drift 0 を維持 | 維持 |

> commit / PR / staging deploy は全て **user-gated**。本 QA は実装後に実行する検証手順を確定するものであり、本サイクルでコードは生成・実行しない。

## 参照資料

| 種別 | Path | 用途 |
| --- | --- | --- |
| SSOT | `.../shared-context.md`（§4 AC・§8 検証コマンド） | AC / コマンド正本 |
| リファクタ | `.../phase-8-refactor.md`（RT-1 削除基準） | `boolLabel` 削除 PASS 基準 |
| テスト計画 | `.../phase-4-test-plan.md`（Lane A） | jsdom 代替 evidence の対応関係 |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| design-tokens | `.claude/skills/aiworkflow-requirements/references/design-tokens.md` | OKLch トークン正本・HEX 禁止（AC-9） |
| ui-ux-navigation | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | admin ナビ / 画面構成 |

## 完了条件（Phase 9）

1. Q-1〜Q-12 を `チェック項目 / コマンド / 期待結果 / 対応 AC` の表で確定した。
2. AC-9 / AC-10 / AC-11 の確認手順を個別に明記した。
3. `boolLabel` 削除確認を「git delete OR live import 0 件」を PASS 基準として記載した（FB-UI-02-1・`grep -rn 'boolLabel' apps/web` で 0 件を証跡）。
4. typecheck / lint の確認観点を記載した。
5. commit / PR / staging が user-gated である旨を明記した。
