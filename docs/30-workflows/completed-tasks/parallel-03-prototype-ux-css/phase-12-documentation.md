# Phase 12: ドキュメント更新

> Phase: 12 / 13

---

## 必須タスク（6 件 / strict 7 outputs）

### Task 1: implementation-guide.md（2 パート構成）

出力先: `outputs/phase-12/implementation-guide.md`

#### Part 1: 中学生レベル概念説明

**何が変わったか（日常の例え話）**

このサイトには会員のプロフィールページがあります。今回の改善は、画面の「目で見て分かりやすさ」を3つ良くしました。

1. **タグのボタン**: 押して選んだタグは色がはっきり反転します。お店のメニューで「これを選んだ」とマーカーで塗るような状態になります。
2. **カードの反応**: マウスをカードに重ねると、枠がくっきりして影がふわっと出ます。本屋で背表紙に手を伸ばすと、その本だけ少し前に出てくる感じです。
3. **公開範囲の印**: プロフィールの各セクションに「これは誰に見える情報か」を示す色の縦線と絵文字を付けました。掲示板の張り紙に「全員向け（🌍）」「会員のみ（👥）」「管理者のみ（🔐）」と書いてあるのと同じです。

**なぜ必要か**

画面の見た目が同じだと、「いま自分は何を選んでいるのか」「この情報は誰に見えるのか」が分かりません。目で見て分かるようにすることで、操作ミスや誤った情報公開を防ぎます。

#### Part 2: 開発者レベル技術詳細

**変更ファイル**

```
apps/web/src/styles/globals.css                                # @layer components 規則追加
apps/web/src/components/public/MemberFilters.client.tsx        # aria-pressed / data-selected / data-component
apps/web/src/components/public/MemberCard.tsx                  # transition utility 整理
apps/web/src/components/public/MemberDetailSections.tsx        # data-visibility / Section 型拡張
apps/web/src/components/public/FormPreviewSections.tsx         # data-visibility 伝搬
```

**型 / API**

```ts
type SectionVisibility = "public" | "member" | "admin";

type Section = {
  key: string;
  title: string;
  visibility?: SectionVisibility; // default "public"
  // ...
};
```

**CSS セレクタ**

```css
button[data-component="tag-pill"][data-selected="true"] { ... }
[data-component="member-card"]:hover { ... }
[data-visibility="public"|"member"|"admin"] { ... }
```

**使用 token**

- `--ubm-color-text-primary` / `--ubm-color-surface-panel`
- `--ubm-color-border-strong` / `--ubm-shadow-sm`
- `--ubm-color-ok` / `--ubm-color-zone-b` / `--ubm-color-danger`
- `--ubm-dur-fast` / `--ubm-ease-standard`

**エラーハンドリング・エッジケース**

- `section.visibility` 未定義 → `"public"` fallback
- API で section に visibility field が将来追加された場合は ``section.visibility ?? "public"`` がそのまま機能する（型拡張のみ必要）
- 不明な visibility 値（型外）→ CSS セレクタが hit せず default 表示（border-left transparent）

**視覚証跡**

Phase 11 の screenshot 7 枚（`outputs/phase-11/screenshots/`）参照。

---

### Task 2: システム仕様書更新

| 仕様書 | 更新内容 |
|--------|---------|
| `docs/00-getting-started-manual/specs/design-tokens.md` | 使用 token 一覧の差分なし（既存 token のみ使用）。本タスク言及不要 |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | 変更なし（section visibility は UI 側 fallback で吸収） |

> 仕様書の本質的な変更なし。Phase 12 では「変更なし」を明示し、なぜ書き換え不要かを記録する。

---

### Task 3: ドキュメント更新履歴

`outputs/phase-12/documentation-changelog.md` に本サイクルでの実装ガイド追加を 1 行記録。

---

### Task 4: 未タスク検出レポート

`outputs/phase-12/unassigned-task-detection.md`

- API 側 section `visibility` field 追加（admin 側で section ごとの公開範囲制御が必要になった時点で別タスク化）— 現時点で未起票、ユーザー判断待ち
- emoji icon → SVG background-image 置換（フォント差異が問題化した場合のみ）

0 件でない場合は本セクションを残す。0 件なら「未タスクなし」と明記する。

---

### Task 5: スキルフィードバックレポート

`outputs/phase-12/skill-feedback-report.md`

- 改善点なしでも「特になし」と記載して出力する

### Task 6: タスク仕様書コンプライアンスチェック

`outputs/phase-12/phase12-task-spec-compliance-check.md`

- Required Sections 9 項目を含める
- root/output `artifacts.json` parity を `cmp -s` で確認
- Phase 11 runtime pending と Phase 12 completed を混同しない
- `PASS` 単独表記ではなく 3-state verdict を使う

### strict 7 file inventory

| # | ファイル |
|---|---|
| 1 | `outputs/phase-12/main.md` |
| 2 | `outputs/phase-12/implementation-guide.md` |
| 3 | `outputs/phase-12/system-spec-update-summary.md` |
| 4 | `outputs/phase-12/documentation-changelog.md` |
| 5 | `outputs/phase-12/unassigned-task-detection.md` |
| 6 | `outputs/phase-12/skill-feedback-report.md` |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

---

## DoD

- [ ] strict 7 成果物が `outputs/phase-12/` に存在
- [ ] implementation-guide.md が Part 1 / Part 2 両方を含む
- [ ] screenshot 参照リンクが有効
