# Phase 9: 品質保証

> Phase 5〜8 完了後の**一括判定チェックリスト**。各項目に判定コマンドと PASS 基準を明記する。
> 全項目 PASS で Phase 10（最終レビュー）へ進む。1 項目でも FAIL なら該当 Phase へ差し戻す
> （Q-1〜Q-4 → Phase 5/8、Q-5〜Q-9 → Phase 5 の該当 concern）。

## 参照資料

| 種別 | パス | 用途 |
|------|------|------|
| DoD | `outputs/phase-5/phase-5.md` §5.7（AC-1〜AC-10） | 判定の根拠 |
| テスト一覧 | `outputs/phase-5/phase-5.md` §5.5 / `outputs/phase-6/phase-6.md` §6.1-6.2 | Q-4 の実行対象 |
| 不変条件 | `docs/30-workflows/completed-tasks/issue-1189-deleted-member-410-guidance-and-restore/index.md`「不変条件」節 | Q-5〜Q-9 の根拠 |

## 9.1 一括判定チェックリスト

すべて **repo root** で実行する。

| # | 項目 | 判定コマンド | PASS 基準 |
|---|------|-------------|----------|
| Q-1 | 型チェック | `mise exec -- pnpm typecheck` | exit 0 |
| Q-2 | リント | `mise exec -- pnpm lint` | exit 0（unused import 0 件含む） |
| Q-3 | デザイントークン | `mise exec -- pnpm verify:tokens` | exit 0（PASS 表示） |
| Q-4 | focused vitest（新規 + 回帰 guard 全 9 spec） | 下記 §9.2 のコマンド | exit 0・FAIL 0・skip 0（T-01〜T-12 / E-01〜E-05 / 既存 MemberDrawer 4 本 / SectionError 2 本すべて含む） |
| Q-5 | apps/api 非接触（AC-7） | `git diff --name-only dev...HEAD -- apps/api` | **出力が空**（0 行） |
| Q-6 | HEX 直書きゼロ | `grep -rnE '#[0-9a-fA-F]{3,8}\b' "apps/web/app/(member)/profile/_lib/session-error-display.ts" apps/web/src/features/admin/components/_members/MemberDrawer.tsx; echo "exit=$?"` | マッチ 0 件（grep exit 1）。色は `var(--ubm-*)` のみ |
| Q-7 | data-testid 一意性 | `grep -rn 'member-restore-button' apps/web --include='*.tsx' --include='*.ts'` | 実装での定義は `MemberDrawer.tsx` の **1 箇所のみ**。他ヒットはテストファイル（`*.spec.tsx`）のみ |
| Q-8 | memberId 新規露出なし（不変条件 #11） | `git diff dev...HEAD -- "apps/web/app/(member)" \| grep -iE 'console\.(log\|warn\|error).*memberId\|memberId.*console'` および `git diff dev...HEAD -- "apps/web/app/(member)/profile/_lib/session-error-display.ts" \| grep -c memberId` | いずれもマッチ 0 件（/profile 系の表示・ログへ memberId を新規露出していない。admin drawer 内の既存露出範囲は対象外） |
| Q-9 | 規約 guard（テスト接尾辞 / legacy hook / restoreMember 非使用） | `git diff --name-only dev...HEAD \| grep -E '\.test\.(ts\|tsx)$'`（0 件）/ `git diff dev...HEAD -- apps/web \| grep -n 'lib/useAdminMutation'`（0 件）/ `grep -rn 'restoreMember' apps/web/src/features apps/web/app --include='*.tsx' --include='*.ts'`（0 件） | 3 コマンドとも マッチ 0 件（`*.spec` のみ・不変条件 #10 維持・`lib/admin/api.ts` の `restoreMember` 非接触のまま live 使用 0 件） |
| Q-10 | 変更ファイル surface | `git diff --name-only dev...HEAD -- apps/web` | Phase 5 §5.1 の 5 ファイル（編集 4 + 新規 1）のみ |

## 9.2 Q-4 実行コマンド

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  "apps/web/app/(member)/profile/_lib/__tests__/session-error-display.spec.ts" \
  "apps/web/app/(member)/profile/page.spec.tsx" \
  "apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.restore.spec.tsx" \
  "apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx" \
  "apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.identityLabels.spec.tsx" \
  "apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.tags.spec.tsx" \
  "apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.tagInlineCreate.spec.tsx" \
  "apps/web/src/components/member/__tests__/SectionError.spec.tsx" \
  "apps/web/src/components/public/__tests__/SectionError.spec.tsx"
```

## 9.3 判定記録様式

| # | 判定 | 実行日時 | 備考（FAIL 時は差し戻し先 Phase と理由） |
|---|------|---------|------------------------------------------|
| Q-1 | PASS / FAIL | | |
| Q-2 | PASS / FAIL | | |
| Q-3 | PASS / FAIL | | |
| Q-4 | PASS / FAIL | | テスト件数（files / tests）も記録 |
| Q-5 | PASS / FAIL | | |
| Q-6 | PASS / FAIL | | |
| Q-7 | PASS / FAIL | | 実装定義 1 箇所の行番号を記録 |
| Q-8 | PASS / FAIL | | |
| Q-9 | PASS / FAIL | | |
| Q-10 | PASS / FAIL | | 出力ファイル一覧を記録 |

## 9.4 AC との対応

| AC（Phase 5 §5.7） | 担保する Q |
|--------------------|-----------|
| AC-1〜AC-3（C1 文言/CTA/型不変） | Q-4（T-01〜T-06, T-05/E-05 回帰） |
| AC-4〜AC-6, AC-8（C2 ボタン/confirm/成功・失敗 UX） | Q-4（T-07〜T-12, E-01〜E-04）+ Q-7 |
| AC-7（apps/api 非接触） | Q-5 |
| AC-9（トークンのみ） | Q-3 + Q-6 |
| AC-10（全コマンド緑 + 回帰なし） | Q-1, Q-2, Q-4, Q-9, Q-10 |
| 不変条件 #11（memberId） | Q-8 |

## 実行タスク

- [ ] Q-1〜Q-10 を §9.1 の順に実行し、§9.3 へ判定を記録
- [ ] FAIL 項目は備考に差し戻し先 Phase を明記し、修正後に**全項目を再実行**（部分再実行で済ませない）
- [ ] 全 PASS 後、Phase 10（最終レビュー）へ引き継ぎ

## 完了条件

- [ ] Q-1〜Q-10 が全て PASS（§9.3 記入済み）。
- [ ] AC-1〜AC-10 が §9.4 の対応表で全て担保確認済み。
- [ ] commit / push / PR は未実行のまま（CONST_002: ユーザー明示承認まで実行しない）。

## 成果物

- 本ファイル `outputs/phase-9/phase-9.md`（一括判定チェックリスト Q-1〜Q-10 + 判定コマンド/PASS 基準 + 記録様式 + AC 対応表）
