# Phase 9: 品質保証

> **[実装区分: 実装仕様書]**。本 Phase は本実装サイクルで実行する品質ゲート（grep gate / design-tokens / line budget / link / mirror parity / typecheck / lint）の PASS 基準を固定する。

## メタ情報

- workflow_state: `implemented_local_runtime_pending` / taskType: `implementation` / visualEvidence: `VISUAL_ON_EXECUTION`
- 前提: Phase 8（リファクタリング）完了
- 削除の有無: **本 task は削除なし**。削除確認ゲート（QG-7）は「該当なし」で PASS とする

## 目的

public member photo display 実装サイクルの成果物が、invariant #5（`apps/web` から R2/D1 直接アクセス禁止）・design-tokens（HEX 直書き禁止）・line budget・link 整合・mirror parity・typecheck/lint green の各ゲートを満たすことを機械的に検証する基準を固定する。

## 品質ゲート一覧（PASS 基準）

### QG-1: invariant #5 grep gate（AC-7）

```bash
grep -rn "member_photos\|R2_\|MEMBER_PHOTOS" apps/web/src
```

- **PASS 基準**: マッチ 0 件。`apps/web/src` 配下に R2 binding 名・R2 env 名・`member_photos` 表名が一切出現しない。
- 根拠: presign は `apps/api` route 層のみ。web は presigned `photoUrl` 文字列のみを `Avatar src` に渡す（AC-6/AC-7）。

> 補助確認: `grep -rn "r2.cloudflarestorage.com\|presign\|R2Bucket" apps/web/src` も 0 件であること。

### QG-2: design-tokens / HEX 直書き（AC-5）

- **PASS 基準**: 本 task の編集ファイルに HEX 直書き（`#xxxxxx`）・`bg-[#...]`・`text-[#...]` が**新規追加されない**。
- 根拠: UI 変更は `Avatar` の `src` prop 配線のみ。token・色・className は変更しない。`Avatar` の `ui-avatar--photo` クラスは #983 で landed 済みのため本 task で新規 token を生やさない。
- 検証コマンド:

```bash
grep -rnE "#[0-9a-fA-F]{6}|bg-\[#|text-\[#" \
  apps/web/src/components/public/MemberCard.tsx \
  apps/web/src/components/public/ProfileHero.tsx \
  apps/web/src/components/public/MemberDetail.tsx
```

- 期待: 本 task が追加した行にマッチ 0 件。

### QG-3: typecheck green

```bash
mise exec -- pnpm typecheck
```

- **PASS 基準**: exit 0。`photoUrl?: string` の optional 追加が shared types / apps-api source / apps-web props で型整合する。

### QG-4: lint green

```bash
mise exec -- pnpm lint
```

- **PASS 基準**: exit 0。`no-restricted-globals`・import 順序・unused import の違反 0 件。

### QG-5: line budget

- **PASS 基準**: 本 workflow の各 `phase-*.md` が skill 規定の line budget 内（指定が無い場合は 200 行を上限目安）。`docs/30-workflows/completed-tasks/issue-1029-public-member-photo-display/` 配下の md ファイルが過大化していない。
- 検証コマンド:

```bash
wc -l docs/30-workflows/completed-tasks/issue-1029-public-member-photo-display/*.md
```

### QG-6: link / mirror parity

- **PASS 基準**:
  - `artifacts.json` と `outputs/artifacts.json` が同一内容（byte-identical parity）。
  - phase ファイル間の相互参照（`phase-N.md` への link）が実在パスを指す。
- 検証コマンド:

```bash
diff docs/30-workflows/completed-tasks/issue-1029-public-member-photo-display/artifacts.json \
     docs/30-workflows/completed-tasks/issue-1029-public-member-photo-display/outputs/artifacts.json
```

- 期待: 差分 0。

### QG-7: 削除確認（[FB-UI-02-1]）

- **判定基準**: 削除は「git delete された」OR「stub 化かつ live import 0 件」のいずれかで確認する。
- **本 task の結果**: **削除なし**。本 task は新規追加（schema optional フィールド / batch helper / resolver DI / UI src 配線）のみで、既存ファイルの delete・stub 化を行わない。よって QG-7 は「該当なし」で PASS。
- 検証コマンド（本実装サイクルで実行）:

```bash
git diff --diff-filter=D --name-only dev...HEAD
```

- 期待: 出力 0 行（削除ファイルなし）。

## fail-soft の品質確認（AC-8 / AC-6）

- R2 secret 未設定時に list / profile が **200 を維持**し photoUrl を省略することを Phase 4/6 のテストで担保（resolver 未注入 = 従来動作）。
- presigned URL 文字列以外（bucket 名・object key・admin audit data）が public response に**含まれない**ことを Phase 5/6 の view-model parse テスト（`.strict()`）で担保。

## 実行タスク

- QG-1..QG-7 を本実装サイクルで順に実行し、各 PASS 基準を満たすことを確認する。
- QG-7 を「削除なし＝該当なし PASS」として記録する。
- fail-soft（200 維持 / photoUrl 省略）の test が GREEN であることを確認する。

## 参照資料

- `index.md`（§2 AC-5/AC-6/AC-7/AC-8）
- `phase-2.md`（§3 責務境界 / §4 R2 read cost）
- `phase-8.md`（リファクタリング・削除なし宣言）
- `.claude/skills/aiworkflow-requirements/references/ui-ux-design-principles.md`（design-tokens 正本）
- `.claude/skills/aiworkflow-requirements/references/security-api.md` / `.claude/skills/aiworkflow-requirements/references/security-principles.md`（PII / consent 境界 / R2 露出禁止）
- CLAUDE.md 不変条件 #5（D1/R2 は apps/api に閉じる）

## 成果物

- Phase 9 品質保証（本ファイル・QG-1..QG-7 の PASS 基準）

## 完了条件

- [ ] QG-1 grep gate（`member_photos\|R2_\|MEMBER_PHOTOS` が `apps/web/src` で 0 件）の PASS 基準が固定されている
- [ ] QG-2 design-tokens（HEX 直書き新規追加 0 件）の検証コマンドが固定されている
- [ ] QG-3 typecheck / QG-4 lint が green 基準で固定されている
- [ ] QG-5 line budget / QG-6 mirror parity の検証コマンドが固定されている
- [ ] QG-7 削除確認が「本 task は削除なし＝該当なし PASS」基準で記録されている
- [ ] fail-soft（200 維持 / presigned URL のみ）の品質確認が test に紐付いている

## 統合テスト連携

QG-1 の grep gate は AC-7 を、QG-2 は AC-5 を、fail-soft 確認は AC-8/AC-6 を機械検証する。Phase 10 最終レビューが本 Phase の各ゲート結果を AC 判定表に取り込む。
