# Phase 05 — 実装ランブック

実装区分: ドキュメントのみ仕様書（CONST_004 例外適用 — 純粋に markdown 2 件作成のみ）

## 0. 目的

Phase 1〜4 で確定した仕様に従い、`09e-screen-blueprints-public.md` / `09f-screen-blueprints-member.md` の 2 markdown を新規作成する手順を確定する。本ランブックは決定論的に再現可能な手順とし、誰が実行しても同一の成果物を得られるようにする。

## 1. 事前準備

```bash
# worktree 起点ディレクトリの確認
pwd
# 期待: /Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260507-190331-wt-2

# 出力先ディレクトリの存在確認
ls docs/00-getting-started-manual/specs/

# 転記元 prototype の存在 / 行数確認
wc -l docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx
# 期待: 472
wc -l docs/00-getting-started-manual/claude-design-prototype/pages-member.jsx
# 期待: 373

# 上流 phase-3 の存在確認
ls docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md
```

## 2. 09e 執筆ステップ

### 2.1 ヘッダー / 索引

09e 冒頭に以下を配置:

- title: `# 09e — 画面 blueprint（公開層）`
- 一段落の正本順位明記（pages-public.jsx 凍結正本 / 現行 API 正本 / phase-3 §3 §5.2 / 9 series 内 link 戦略）
- 索引（§1〜§6 + §99 へのリンク）
- 視覚値 0 件方針の明記

### 2.2 §1 `/` (Public Top) — LandingPage L4-L154

| 節 | 内容 |
|----|------|
| §1.1 | pages-public.jsx LandingPage L4-L154 の return JSX 一字一句転記 |
| §1.2 | Hero タイトル / CTA / Stats ラベル / ZoneGuide / Timeline のコピー原文 |
| §1.3 | mermaid 標準 5 状態 |
| §1.4 | API 表（`GET /public/stats` / `GET /public/members?limit=6&sort=recent` / `GET /public/form-preview`） |
| §1.5 | props / state |
| §1.6 | a11y（landmark / heading hierarchy / skip link） |
| §1.7 | 9 series link |

### 2.3 §2 `/(public)/members` — MemberListPage L208-L338

| 節 | 内容 |
|----|------|
| §2.1 | MemberListPage L208-L338 の return JSX 一字一句転記 |
| §2.2 | filter ラベル（q / zone / status / sort / density 3 値）/ empty state / loading state コピー |
| §2.3 | mermaid 標準 5 状態 + filter 適用時の loading / success 派生 |
| §2.4 | API 表（`GET /public/members?q=...&zone=...&status=...&sort=...&page=...`） |
| §2.5 | URL query state（q / zone / status / sort / density / page） |
| §2.6 | a11y（filter form / live region for 結果数） |
| §2.7 | 9 series link |

### 2.4 §3 `/(public)/members/[id]` — MemberDetailPage L339-L472

| 節 | 内容 |
|----|------|
| §3.1 | MemberDetailPage L339-L472 の return JSX 一字一句転記 |
| §3.2 | summary / overview / skill / offer / personality / contact 順のコピー |
| §3.3 | mermaid 標準 5 状態 + 404 状態 |
| §3.4 | API 表（`GET /public/members/:id`） |
| §3.5 | route param `id` / 内部 state |
| §3.6 | a11y（heading hierarchy / contact 露出制御） |
| §3.7 | 9 series link |

### 2.5 §4 `/(public)/register` — phase-3 §3 §5.2 派生

| 節 | 内容 |
|----|------|
| §4.1 | prototype 由来なし。phase-3 §3 §5.2 派生ルール正本転記 + 09c primitive 組合せ限定の制約明記 |
| §4.2 | 「フォーム回答前のプレビュー」「Google Form で回答する」CTA / consent キー（`publicConsent` / `rulesConsent`）/ `responseEmail` system field 注記のコピー |
| §4.3 | mermaid 状態（idle → loading → success → external_redirect） |
| §4.4 | API 表（`GET /public/form-preview` + responderUrl link 外部遷移） |
| §4.5 | props / state（form schema は spec に焼き付けない） |
| §4.6 | a11y（external link 注記 / form schema からの ARIA） |
| §4.7 | 9 series link |

### 2.6 §5 `/privacy` / §6 `/terms` — LegalProse 派生

| 節 | 内容 |
|----|------|
| §5.1 / §6.1 | LegalProse primitive 派生（heading + paragraph + list の組合せのみ）/ 独自 primitive 生成禁止の制約明記 |
| §5.2 / §6.2 | 法務文書のセクション見出しのみ転記（本文は法務確定後に流し込む前提、本タスクは構造のみ） |
| §5.3 / §6.3 | mermaid 状態（idle → success のみ、API 接続なし） |
| §5.4 / §6.4 | API 接続なし（明記） |
| §5.5 / §6.5 | props なし |
| §5.6 / §6.6 | a11y（heading hierarchy / table of contents） |
| §5.7 / §6.7 | 9 series link |

### 2.7 §99 不採用要素表

phase-02 §5 で確定した 4 行表を転記。

### 2.8 09e 執筆完了確認

```bash
F1=docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md
wc -l "$F1"  # 行数 inventory
grep -cE '^## [0-9]+\. ' "$F1"  # 期待: 7
grep -c '^```mermaid$' "$F1"    # 期待: 6 以上
```

## 3. 09f 執筆ステップ

### 3.1 ヘッダー / 索引

09f 冒頭に以下を配置:

- title: `# 09f — 画面 blueprint（会員層）`
- 一段落の正本順位明記（pages-member.jsx 凍結正本 / 現行 API 正本 / 9 series 内 link 戦略）
- 索引（§1〜§2 + §99 へのリンク）
- 視覚値 0 件方針の明記
- AvatarStoreProvider#localStorage は採用しない（API 経由）旨の明記

### 3.2 §1 `/login` — LoginPage L4-L67（5+1 状態）

| 節 | 内容 |
|----|------|
| §1.1 | LoginPage L4-L67 の return JSX 一字一句転記 |
| §1.2 | コピー原文（input placeholder / sent 確認文 / unregistered メッセージ / deleted メッセージ / error メッセージ） |
| §1.3 | **login 5+1 状態 mermaid（input / sent / unregistered / deleted / rules_declined / error）** — phase-02 §3.2 のテンプレを転記 |
| §1.4 | API 表（`POST /api/auth/magic-link` / `GET /api/auth/gate-state`） |
| §1.5 | props / state（email input / 5+1 状態 enum） |
| §1.6 | a11y（form / live region for 状態遷移 / autocomplete=email） |
| §1.7 | 9 series link |

### 3.3 §2 `/profile` — MyProfilePage L220-L373（4 領域）

| 節 | 内容 |
|----|------|
| §2.1 | MyProfilePage L220-L373 の return JSX 一字一句転記 |
| §2.2 | **4 領域**（banner / summary / request / delete）のコピー原文 |
| §2.3 | mermaid（banner / summary / request / delete 各領域の状態 + server-pending を上書き禁止する不可逆遷移） |
| §2.4 | API 表（`GET /api/me/profile` / `POST /api/me/visibility-request` / `POST /api/me/delete-request` / Auth.js signout） |
| §2.5 | props / state（visibility / pending request / delete confirmation） |
| §2.6 | a11y（4 領域の landmark / dangerous action confirm） |
| §2.7 | 9 series link |

### 3.4 §99 不採用要素表（09f 拡張版）

phase-02 §5 の 4 行表 + `AvatarStoreProvider#localStorage` を必ず列挙（profile が直接影響）。

### 3.5 09f 執筆完了確認

```bash
F2=docs/00-getting-started-manual/specs/09f-screen-blueprints-member.md
wc -l "$F2"  # 行数 inventory
grep -cE '^## [0-9]+\. ' "$F2"  # 期待: 3
grep -c '^```mermaid$' "$F2"    # 期待: 3 以上
grep -E 'input|sent|unregistered|deleted|rules_declined|error' "$F2"  # login 5+1 状態 hit 確認
grep -E 'banner|summary|request|delete' "$F2"          # profile 4 領域 hit 確認
```

## 4. 検証 grep 実行（Phase 4 §2-§9 のコマンドを順次実行）

```bash
# T1 章立て数
grep -cE '^## [0-9]+\. ' "$F1"  # = 7
grep -cE '^## [0-9]+\. ' "$F2"  # = 3

# T2 視覚値混入禁止（4 種）
for F in "$F1" "$F2"; do
  ! grep -nE '#[0-9a-fA-F]{3,8}\b' "$F"
  ! grep -nE 'oklch\(' "$F"
  ! grep -nE '\b[0-9]+px\b' "$F"
  ! grep -nE '\bbg-\[' "$F"
done

# T3 API trace check
# 現行 API 正本と §X.4 を行レベル trace（method × endpoint）

# T4 コピー原文（KEYS は Phase 5 段階で prototype から抽出）

# T5 mermaid block
grep -c '^```mermaid$' "$F1"  # >= 6
grep -c '^```mermaid$' "$F2"  # >= 3

# T6 markdown validation
mise exec -- pnpm lint:md "$F1" "$F2"

# T7 行数
wc -l "$F1" "$F2"

# T8 placeholder 解決
! grep -nE '§TBD' "$F1" "$F2"
```

## 5. evidence ファイル化

各 grep 結果を `outputs/phase-11/evidence/` 配下に保存:

```bash
EV=docs/30-workflows/task-20-w2-screen-blueprints-public-and-member/outputs/phase-11/evidence
mkdir -p "$EV"

grep -nE '#[0-9a-fA-F]{3,8}\b|oklch\(|\b[0-9]+px\b|\bbg-\[' "$F1" "$F2" \
  > "$EV/grep-visual-values.log" 2>&1 \
  || echo "GREP_ZERO_HITS" >> "$EV/grep-visual-values.log"

grep -hE '^\| (GET|POST|PATCH|DELETE) \|' "$F1" "$F2" \
  > "$EV/grep-api-trace.log"

# T4 コピー原文
# (KEYS 配列を loop で grep -F)
echo "copy-text grep result" > "$EV/grep-copy-text.log"

mise exec -- pnpm lint:md "$F1" "$F2" \
  > "$EV/markdown-lint.log" 2>&1 || true

wc -l "$F1" "$F2" > "$EV/wc-lines.log"
```

## 6. ロールバック

執筆途中で復旧不能になった場合:

```bash
git checkout HEAD -- docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md \
                     docs/00-getting-started-manual/specs/09f-screen-blueprints-member.md
```

新規作成のため `git checkout` で空状態（ファイル未追跡）に戻る。再実行は本ランブックを §1 から再走。

## 7. 完了条件

- [ ] 09e 新規作成済（公開 6 画面 + §99、行数は evidence 記録のみ）
- [ ] 09f 新規作成済（会員 2 画面 + §99、行数は evidence 記録のみ）
- [ ] T1〜T8 全 PASS
- [ ] evidence 7 ファイル保存済（`grep-visual-values.log` / `grep-api-trace.log` / `grep-copy-text.log` / `grep-section-count.log` / `grep-invariants.log` / `placeholder.log` / `markdown-lint.log` / `wc-lines.log` の主要証跡）

## 8. 次フェーズへの引き渡し

phase-06（異常系検証）に渡す:

- 09e / 09f 執筆完了状態
- T1〜T8 検証結果
- evidence 主要ファイル
