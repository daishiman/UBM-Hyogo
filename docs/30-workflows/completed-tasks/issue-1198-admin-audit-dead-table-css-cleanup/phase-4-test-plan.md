# Phase 4: テスト作成 — issue-1198 admin-audit dead table CSS cleanup

## 1. 方針: 新規テスト追加なし（回帰確認 suite として位置づけ）

本タスクは「未参照（dead）CSS 3 ブロックの削除のみ」で、振る舞い（描画・型・データフロー）に一切影響しない。したがって **新規テストの追加は行わない**。代わりに、既存の監査ログ focused Vitest 2 本を「dead CSS 削除後もカード描画契約が不変であること」を担保する**回帰確認 suite** として位置づける。

| 既存テスト（回帰確認に再利用） | 役割 |
| --- | --- |
| `apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx` | フィルタ適用パネル / タイムライン構造の描画契約 |
| `apps/web/src/components/admin/__tests__/AuditLogCard.spec.tsx` | 監査ログカード（`.admin-audit-card`）の描画契約 |

> パスはセレクタ名・ファイル名アンカーで固定。行番号には依存しない。

## 2. command suite と expected result

| # | コマンド | 期待結果 | 意味 |
| --- | --- | --- | --- |
| AC-1（前提） | `grep -rn "admin-audit-filter\|admin-audit-table" apps/web/src apps/web/app --include="*.tsx" --include="*.ts"` | **0 行** | 削除対象 3 セレクタがコンポーネントから 0 参照（dead 確定） |
| AC-5 | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx apps/web/src/components/admin/__tests__/AuditLogCard.spec.tsx` | **全 PASS** | dead CSS 削除がカード描画に regression を与えない |

> shared-context.md §4 を検証コマンドの正本とする。本ファイルと差異がある場合は §4 を優先する。

「全 PASS」の解釈: 削除対象 CSS はそもそも未適用のため、削除前後でこの 2 本の結果は不変であることが期待される（削除前に緑、削除後も緑）。緑であること自体が「カード UI の描画契約が dead CSS に依存していなかった」ことの裏取りになる。

## 3. TDD RED が不要な理由

| 観点 | 理由 |
| --- | --- |
| 失敗テストを先に書く対象がない | 削除対象 3 セレクタは未参照＝振る舞いに一切影響しない。削除によって新たに満たすべき「振る舞い仕様」が生まれないため、RED フェーズで先に失敗させる対象が存在しない |
| 振る舞いの追加・変更がない | 本タスクは機能追加でも修正でもなく純粋な dead code 削除。TDD（RED→GREEN→REFACTOR）の前提となる「新しい期待振る舞い」が無い |
| 回帰の検出は既存 suite で十分 | カード UI の描画契約は既存 focused Vitest 2 本がすでにカバー済み。これらが削除後も GREEN であることで regression なしを確認できる |

→ 本タスクの「テスト」は **RED を持たない回帰確認（GREEN 維持の検証）** に限定する。

## 4. AC-1 ゼロ参照 grep の扱い（削除前の前提テスト）

- AC-1 の grep（§2 の AC-1 行）は、削除を実行する**前提条件テスト**として扱う。
- この grep が **0 行**であることを確認できて初めて「3 セレクタは dead であり削除して安全」と確定する。0 行でない（=どこかが参照している）場合は削除を**中止**し、参照箇所を再調査する。
- 既知の唯一ヒット `apps/web/playwright/tests/admin-schema-conflicts-audit.spec.ts` の `name: 'admin-audit-filtered.png'` は **Playwright スクリーンショット出力ファイル名**であり CSS クラス参照ではない（shared-context §2）。`--include="*.tsx" --include="*.ts"` 限定では Playwright スペック内のスクショ名文字列も「クラスセレクタ参照」ではないため AC-1 の 0 件判定に影響しない。

## 完了条件

- [ ] 新規テスト追加なしの方針を明記した
- [ ] 既存 focused Vitest 2 本を回帰確認 suite として位置づけた
- [ ] command suite と expected result（全 PASS）を表で示した
- [ ] TDD RED 不要の理由を明記した
- [ ] AC-1 ゼロ参照 grep を「削除前の前提テスト」として扱う旨を記述した
