# Phase 7: カバレッジ確認

> **対象は変更ファイル 2 本に限定する**（Feedback BEFORE-QUIT-002 対策: リポジトリ全体の
> カバレッジ閾値を追いかけて Phase が発散する事故を防ぐ）。focused 実行で変更ブロックの
> カバレッジだけを確認し、証跡を本ファイル様式で記録する。

## 参照資料

| 種別 | パス | 用途 |
|------|------|------|
| 実装仕様 | `outputs/phase-5/phase-5.md` §5.2（410 分岐）/ §5.3（`DeletedMemberSection`） | カバレッジ対象ブロックの定義 |
| テスト一覧 | `outputs/phase-5/phase-5.md` §5.5（T-01〜T-12）/ `outputs/phase-6/phase-6.md` §6.1（E-01〜E-05） | カバレッジを供給する spec |
| coverage 基盤 | `vitest.config.ts`（repo root）+ `@vitest/coverage-v8` | focused 実行の前提 |

## 7.1 対象と目標

| 対象ファイル | 対象ブロック | 目標 |
|-------------|-------------|------|
| `apps/web/app/(member)/profile/_lib/session-error-display.ts` | `MEMBER_SESSION_410` 分岐（§5.2 After） | **line / branch 100%**（ファイル全体も小さいため実質 100% を期待。404/5xx/FAILED は T-05/E-05 が担保） |
| `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | `DeletedMemberSection`（復元ハンドラ `handleRestore` / `onSuccess` / `onError` / confirm 分岐）+ DELETED 呼び出し側分岐 | **復元ハンドラ line 100%**・branch は confirm true/false・409/404/network・isLoading ガードの全分岐通過 |

> `MemberDrawer.tsx` の**変更ブロック外**（`MemberTagsEditor` / `NotificationOptOutToggle` / `MemberDrawerBody` 既存部）の
> カバレッジ数値は**判定対象にしない**（既存 specs が別途担保。ここで数値を追わない）。
> ファイル単位 % が低く見えても、変更ブロックの行が緑であれば PASS とする。

## 7.2 実行コマンド（focused coverage・repo root）

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts --coverage.enabled \
  --coverage.include="apps/web/app/(member)/profile/_lib/session-error-display.ts" \
  --coverage.include="apps/web/src/features/admin/components/_members/MemberDrawer.tsx" \
  --coverage.reporter=text --coverage.reporter=html \
  "apps/web/app/(member)/profile/_lib/__tests__/session-error-display.spec.ts" \
  "apps/web/app/(member)/profile/page.spec.tsx" \
  "apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.restore.spec.tsx" \
  "apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx" \
  "apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.identityLabels.spec.tsx" \
  "apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.tags.spec.tsx" \
  "apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.tagInlineCreate.spec.tsx"
```

- `--coverage.include` 2 本で対象ファイルを限定（全体スイープ禁止）。
- text reporter の表 + html reporter（`coverage/index.html`）で `DeletedMemberSection` 行の緑/赤を目視確認。
- coverage 閾値オプション（`--coverage.thresholds.*`）は**設定しない**（vitest.config.ts のグローバル閾値を汚さない）。
- 未カバー行が出た場合は Phase 6 のテストへ戻ってケース追加（実装へ条件を増やして合わせる方向の修正は禁止）。

## 7.3 証跡記録様式

実行後、text reporter の該当 2 行と判定を以下の表へ転記する:

| ファイル | % Lines | % Branch | % Funcs | 未カバー行 | 判定 |
|---------|---------|----------|---------|-----------|------|
| `session-error-display.ts` | （記入） | （記入） | （記入） | （記入・期待: なし） | PASS / FAIL |
| `MemberDrawer.tsx`（変更ブロック） | （記入） | （記入） | （記入） | （記入・期待: 変更ブロック内なし） | PASS / FAIL |

補助記録:

```
実行日時: （記入）
コマンド: §7.2 のとおり（変更があれば全文記載）
vitest exit code: （記入・期待 0）
変更ブロック未カバー行の扱い: （未カバー行が変更ブロック外であることの根拠を行番号で記載）
```

## 7.4 判定基準

| 項目 | PASS 基準 |
|------|----------|
| 410 分岐 | line / branch 100%（`MEMBER_SESSION_410` の if 本体と return オブジェクトが全行カバー） |
| 復元ハンドラ | `handleRestore` line 100% + confirm true/false 両分岐 + `onSuccess` / `onError`（409 マップ・汎用）全経路通過 |
| DELETED 呼び出し側 | `detail.status.isDeleted` true/false 両分岐通過（T-07/T-12 が担保） |
| 全 spec | §7.2 コマンドが exit 0（coverage 取得のための再実行で FAIL しない） |

## 実行タスク

- [ ] §7.2 コマンドを実行し、text + html レポートを取得
- [ ] §7.3 様式へ証跡を転記（未カバー行の所在判定含む）
- [ ] 未達があれば Phase 6 へ戻りテスト追加 → 再実行（実装側を変えない）

## 完了条件

- [ ] §7.4 の 4 項目が全て PASS。
- [ ] 判定対象が変更ファイル 2 本（の変更ブロック）に限定されており、リポジトリ全体の閾値調整・vitest.config.ts 変更を行っていない。
- [ ] 証跡（§7.3）が記入済み。

## 成果物

- 本ファイル `outputs/phase-7/phase-7.md`（focused coverage の対象限定・実行コマンド・証跡様式・判定基準）
