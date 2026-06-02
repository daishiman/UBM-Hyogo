# Phase 7: カバレッジ確認

> **Phase 種別**: カバレッジ確認（変更ファイルの行・分岐網羅の確認）
> **対象タスク**: Task D admin サイドバー nav に Google Form 回答編集画面への外部リンクを追加
> **workflow_state**: `implemented_local_evidence_captured`（実装は dev へ landed 済み: PR #1064 / commit 745c95115）
> **visualEvidence**: VISUAL（ただし screenshot は staging 認証が必要で user-gated）
> **前提**: Phase 6 までの spec が green
> **次フェーズ**: Phase 8 以降（ドキュメント / レビュー）

---

## 7.1 このフェーズのゴール

Task D で変更した 4 実装ファイルと 3 spec が、Phase 4〜6 で定義した振る舞いを行・分岐レベルで網羅していることを確認する。
特に `SidebarNavItem.tsx` の **external 分岐 / 内部分岐 / collapsed 分岐**が unit（jsdom）で全て通過していること、`icons.tsx` の網羅型 PATHS が型レベルでカバーされていること、`form.ts` の定数が assert されていることを確認する。

**本タスクは verify_existing**のため、本 Phase の実体は「landed 実装のカバレッジが充足していることの確認」であり、新規 apps 差分は発生させない。

---

## 7.2 カバレッジ対象と観点（CONST_005）

| 対象ファイル | カバーすべき分岐 / 要素 | カバーする spec / TC | 手段 |
|-------------|------------------------|----------------------|------|
| `lib/constants/form.ts` | `FORM_RESPONSES_EDIT_URL` 値 | form-responses TC-1 | 定数 import + 値 assert |
| `components/shell/shell-config.ts` | `buildAdminGroup` の form-responses 項目（external:true） | shell-config TC-5（matchObject）+ admin `toHaveLength(10)` | 純関数呼び出し |
| `components/shell/shell-config.ts` | union/interface 拡張（`external?`） | TC-5（external:true を読む）+ SidebarNavItem TC-2（external item） | 型 + render |
| `components/shell/icons.tsx` | `PATHS["form-responses"]` の存在 | 型網羅（`Record<ShellNavItemId,string>`）+ render 時に `ShellIcon id="form-responses"` を引く（TC-2） | typecheck + render |
| `components/shell/SidebarNavItem.tsx` | **external 分岐**（`<a target/rel>`・active 無し） | SidebarNavItem TC-2 | jsdom render |
| `components/shell/SidebarNavItem.tsx` | **内部分岐**（`<Link>` active 属性） | SidebarNavItem TC-3 | jsdom render |
| `components/shell/SidebarNavItem.tsx` | **collapsed 分岐**（label sr-only） | SidebarNavItem TC-4 | jsdom render |
| `components/shell/SidebarNavItem.tsx` | content 内 external マーカー（sr-only「（外部リンク）」/ ↗） | SidebarNavItem TC-2（external item で textContent に "Form回答"・external マーカー枝を通過） | jsdom render |

> `SidebarNavItem.tsx` の 3 分岐（external / 内部 / collapsed）はすべて TC-2/TC-3/TC-4 で 1 回以上実行される。content の `item.external ? ... : null` と `item.external && !collapsed ? ... : null` の両枝は、external item（TC-2・collapsed=false）と内部 item（TC-3/TC-4）の組み合わせで真偽両方を通過する。

---

## 7.3 分岐網羅の充足整理

| 分岐条件 | true 経路を通す TC | false 経路を通す TC |
|----------|--------------------|---------------------|
| `if (item.external)`（render 分岐） | TC-2（external item） | TC-3 / TC-4（内部 item） |
| `item.external ?`（sr-only「（外部リンク）」） | TC-2 | TC-3 / TC-4 |
| `item.external && !collapsed ?`（↗ マーカー） | TC-2（external + collapsed=false） | TC-3（内部=外部 false）/ TC-4（collapsed=true で && 短絡） |
| `collapsed ? "sr-only" : "flex-1"`（label span） | TC-4（collapsed=true） | TC-2 / TC-3（collapsed=false） |
| `active ? ...`（内部 data-active/aria-current） | TC-3（pathname 一致で active=true） | （external 分岐は active を参照しない） |

> 上表より、`SidebarNavItem.tsx` の external 由来の全分岐は true/false 双方が landed 3 spec でカバーされる。`isNavItemActive` の `/` / `/admin` 特殊分岐は `shell-config.spec.ts` の `isNavItemActive` ケース群が別途カバーする（Task D で変更していないが回帰維持）。

---

## 7.4 カバレッジ計測コマンド（CONST_005）

apps/web は v8 coverage を `test:coverage` script で取得する（リポジトリルート設定 `--root=../..`、対象 include は `apps/web/src/**`）。

```bash
# web 全体の coverage（4 ファイル + 3 spec を含む）
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage

# shell + constants に絞って coverage を見る場合
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts \
  --coverage \
  --coverage.reportsDirectory=apps/web/coverage \
  --coverage.include="apps/web/src/components/shell/**" \
  --coverage.include="apps/web/src/lib/constants/**" \
  apps/web/src/components/shell apps/web/src/lib/constants/__tests__/form-responses.spec.ts
```

期待: `form.ts` / `shell-config.ts` / `icons.tsx` / `SidebarNavItem.tsx` の Task D 追加行・分岐がすべて hit する（特に `SidebarNavItem.tsx` の external 分岐 / ↗ マーカー枝 / sr-only 枝）。

---

## 7.5 VISUAL と screenshot の扱い（user-gated）

本タスクは **NON_VISUAL ではなく VISUAL**（サイドバーに視認可能な nav 項目 + ↗ マーカーが増える）であるが、screenshot 証跡は次の理由で **user-gated**（本サイクルでは取得しない）。

- 管理サイドバーの表示には admin ロールでの staging 認証が必要（Google OAuth / Magic Link）。
- staging への visual smoke は CI / 手動の認証経路が前提で、本仕様書作成サイクル内では自動取得できない。

したがって**動的挙動（AC-D1 の別タブ遷移）と視覚（↗ + sr-only ラベルの見え方）は jsdom unit + 手動 staging 確認で担保**し、coverage は jsdom unit で充足する。screenshot を `outputs/phase-11/` に置く場合はユーザー承認後とする（画像が無い場合は PR 本文にスクリーンショット専用セクションを作らない）。

---

## 7.6 変更対象ファイル一覧と種別（CONST_005）

| ファイル | 種別 | 本 Phase での扱い |
|---------|------|-------------------|
| `apps/web/src/lib/constants/form.ts` | 既存（landed） | 定数行カバー確認 |
| `apps/web/src/components/shell/shell-config.ts` | 既存（landed） | admin item 行カバー確認 |
| `apps/web/src/components/shell/icons.tsx` | 既存（landed） | PATHS 行 + 型網羅確認 |
| `apps/web/src/components/shell/SidebarNavItem.tsx` | 既存（landed） | 3 分岐網羅確認 |
| `apps/web/src/lib/constants/__tests__/form-responses.spec.ts` | 既存（landed） | TC-1 |
| `apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx` | 既存（landed） | TC-2/TC-3/TC-4 |
| `apps/web/src/components/shell/__tests__/shell-config.spec.ts` | 既存（landed） | TC-5 |

> 本 Phase では新規ファイルを作らない。coverage 計測と分岐網羅の確認のみ。

---

## 7.7 入出力・副作用

- **入力**: vitest coverage runner（v8）、landed 3 spec、4 実装ファイル。
- **出力**: `apps/web/coverage/` のカバレッジレポート、Task D 4 ファイルの行・分岐 hit 状況。
- **副作用**: coverage レポート生成（`apps/web/coverage/`）。DB / ネットワーク無し。

---

## 7.8 DoD（Definition of Done）

- [ ] Task D 4 ファイルの追加行・分岐とそれをカバーする spec/TC を表で対応付け
- [ ] `SidebarNavItem.tsx` の external / 内部 / collapsed の 3 分岐、および external マーカー枝（sr-only / ↗）の true/false 双方が landed 3 spec でカバーされることを確認
- [ ] `icons.tsx` の網羅型 PATHS が typecheck + render でカバーされることを確認
- [ ] `form.ts` 定数 / `shell-config.ts` admin item が assert されることを確認
- [ ] `test:coverage` で Task D 追加行・分岐が hit することを確認
- [ ] VISUAL だが screenshot は user-gated であり、coverage は jsdom unit で担保する旨を明示
- [ ] `git status apps/web/` を確認（verify_existing＝新規 apps 差分ゼロ）

---

## 完了条件

完了条件は次のすべてを満たすことである。

1. Task D の 4 実装ファイルの追加行・分岐が、landed 3 spec（TC-1〜TC-5）と typecheck（網羅型）でカバーされることが表で対応付けられていること。
2. `SidebarNavItem.tsx` の external 分岐 / 内部分岐 / collapsed 分岐、および external マーカー枝の true/false 双方が unit で網羅されていることが確認できること。
3. VISUAL タスクだが screenshot は staging 認証で user-gated であり、coverage は jsdom unit で担保する方針が明記されていること。
4. `pnpm --filter @ubm-hyogo/web test:coverage` で Task D 追加行・分岐が hit し、`git status apps/web/` がクリーン（verify_existing で新規 apps 差分ゼロ）であること。
