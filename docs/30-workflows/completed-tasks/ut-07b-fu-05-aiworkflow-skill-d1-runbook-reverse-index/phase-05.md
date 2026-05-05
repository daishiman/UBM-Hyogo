[実装区分: 実装仕様書]

# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-07b-fu-05-aiworkflow-skill-d1-runbook-reverse-index |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック |
| Wave | 7 |
| Mode | serial |
| 作成日 | 2026-05-04 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証) |
| 状態 | completed |
| Source Issue | #438 |
| 区分 | implementation / NON_VISUAL / scale: small |

---

## 目的

Phase 4 で確定した検証 3 軸を満たす最小編集を、`Edit` ツール想定の old_string / new_string パターンとコマンド列として固定する。
コードは書かず、wave 7 owner（または Claude Code）が runbook を読んで Edit / Bash を実行できる粒度まで具体化する。

---

## 実行タスク

1. ファイル変更マニフェストを確定（path / 種別 / 想定行数）
2. resource-map.md への追記 placeholder（old / new）を固定
3. quick-reference.md への追記 placeholder（old / new）を固定
4. `pnpm indexes:rebuild` の実行手順と前提を確定
5. commit 前 sanity check コマンド集を確定
6. rollback 手順を 4 トリガで記述

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-04.md | 検証 3 軸ケース表 |
| 必須 | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 編集対象（実物 path） |
| 必須 | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 編集対象（実物 path） |
| 必須 | `package.json` | `indexes:rebuild` script |
| 参考 | `scripts/d1/` | 逆引き対象本体 |
| 参考 | `.github/workflows/d1-migration-verify.yml` | 逆引き対象本体 |

---

## 事前確認（Phase 5 冒頭）

```bash
# 1. 既存 indexes に D1 関連の重複が無いか確認
grep -n -i "d1" .claude/skills/aiworkflow-requirements/indexes/resource-map.md || echo "no existing d1 entry"
grep -n "d1:apply-prod" .claude/skills/aiworkflow-requirements/indexes/quick-reference.md || echo "no existing entry"

# 2. resource-map / quick-reference のセクション構造を読む
sed -n '1,50p' .claude/skills/aiworkflow-requirements/indexes/resource-map.md
sed -n '1,50p' .claude/skills/aiworkflow-requirements/indexes/quick-reference.md

# 3. rebuild script が存在することを確認
grep -n '"indexes:rebuild"' package.json
```

| ケース | 対応 |
| --- | --- |
| 既存 D1 entry が無い | 通常フロー（M-1 / M-2 適用） |
| 既存 D1 entry がある | Phase 6 異常系「重複追記」フローへ分岐し、追記内容を merge する |
| `indexes:rebuild` script が存在しない | Phase 3 へ戻り設計再考（本タスク前提が崩れる） |

---

## ファイル変更マニフェスト

| # | path | 変更種別 | 概要 | 想定行数 |
| --- | --- | --- | --- | --- |
| M-1 | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | **更新** | D1 migration runbook + `scripts/d1/*.sh` + `.github/workflows/d1-migration-verify.yml` の所在を 1〜2 行で追記 | +1〜+2 |
| M-2 | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | **更新** | `bash scripts/cf.sh d1:apply-prod` を 1 行追記 | +1 |
| M-3 | `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | **自動更新** | `pnpm indexes:rebuild` で再生成 | 任意 |

---

## Placeholder: M-1 resource-map 追記パターン

resource-map の既存 D1 / migration セクションに合流させる。Edit ツール想定の例:

```text
# old_string（resource-map の適切なセクション末尾の安定 anchor を選ぶ）
| 領域 | パス | 用途 |
| --- | --- | --- |
| ... existing rows ... |

# new_string（既存末尾を残し、D1 行を 1〜2 行追加）
| 領域 | パス | 用途 |
| --- | --- | --- |
| ... existing rows ... |
| D1 migration | `docs/30-workflows/.../d1-migration-runbook.md` / `scripts/d1/*.sh` / `.github/workflows/d1-migration-verify.yml` | 本番 D1 migration 実行と CI 検証の逆引き |
```

> 実際の section anchor は Phase 5 冒頭の `sed -n` で確認し、最も汎用的な「リソース一覧 表」末尾に追記する。
> 1 行に詰める版（80 桁制約があれば）と 2 行に分ける版の両方を許容（CONST_005 の DoD 上は 1〜2 行）。

---

## Placeholder: M-2 quick-reference 追記パターン

quick-reference の D1 / 本番運用セクション、または「よく使うコマンド」末尾に 1 行追記する。

```text
# old_string
... 既存 quick-reference の D1 / 本番運用 セクション末尾 ...

# new_string
... 既存 quick-reference の D1 / 本番運用 セクション末尾 ...
- 本番 D1 migration 適用: `bash scripts/cf.sh d1:apply-prod`
```

> 既存形式（リスト / テーブル / コードブロック）に合わせて記法を選択する。1 行で `bash scripts/cf.sh d1:apply-prod` 文字列が含まれていれば G-04 を満たす。

---

## 実装ランブック（手順）

| 手順 | 内容 | sanity check |
| --- | --- | --- |
| S-1 | 事前確認（重複 / セクション構造 / rebuild script 有無） | 上記 grep / sed 群 |
| S-2 | M-1 の Edit 適用（resource-map に D1 関連 1〜2 行追記） | `grep -c "scripts/d1" .claude/skills/aiworkflow-requirements/indexes/resource-map.md` >= 1 |
| S-3 | M-2 の Edit 適用（quick-reference に `d1:apply-prod` 1 行追記） | `grep -c "scripts/cf.sh d1:apply-prod" .claude/skills/aiworkflow-requirements/indexes/quick-reference.md` >= 1 |
| S-4 | M-3 自動再生成 | `mise exec -- pnpm indexes:rebuild` exit 0 |
| S-5 | rebuild 後の冪等性確認 | 再度 `pnpm indexes:rebuild` → `git diff --stat` 不変 |
| S-6 | CI gate 等価チェック | `mise exec -- pnpm indexes:rebuild && git diff --quiet -- .claude/skills/aiworkflow-requirements/indexes/`（ただし「commit 後」または stage 後実行） |
| S-7 | typecheck / lint（連動破壊の検出） | `mise exec -- pnpm typecheck && mise exec -- pnpm lint` |
| S-8 | commit 前 全体 status 確認 | `git status --porcelain .claude/skills/aiworkflow-requirements/indexes/` |

> S-6 の `git diff --quiet` は「rebuild 後にステージ済み内容と HEAD の差が無いこと」を意図する。実際の CI gate 仕様（`.github/workflows/verify-indexes.yml` の `verify-indexes-up-to-date` job 本体）に合わせて読み替えること。

---

## Sanity Check コマンド集

```bash
# 1. resource-map の追記文言確認
grep -n "scripts/d1" .claude/skills/aiworkflow-requirements/indexes/resource-map.md
grep -n "d1-migration-verify.yml" .claude/skills/aiworkflow-requirements/indexes/resource-map.md

# 2. quick-reference の追記文言確認
grep -n "scripts/cf.sh d1:apply-prod" .claude/skills/aiworkflow-requirements/indexes/quick-reference.md

# 3. rebuild
mise exec -- pnpm indexes:rebuild

# 4. rebuild 後の差分確認（D1 関連トピックが topic-map に出ているか）
git diff -- .claude/skills/aiworkflow-requirements/indexes/topic-map.md | grep -i "d1" || true

# 5. 冪等性
mise exec -- pnpm indexes:rebuild
git status --porcelain .claude/skills/aiworkflow-requirements/indexes/

# 6. typecheck / lint（巻き込み破壊の検出）
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

---

## Commit 前確認チェックリスト

- [ ] M-1 / M-2 の Edit が適用済み
- [ ] `pnpm indexes:rebuild` が exit 0 で完了
- [ ] `topic-map.md` の diff が D1 追記に対応する内容のみ
- [ ] 再 rebuild で `git status` に追加変更が出ない（冪等）
- [ ] `git diff --stat` で変更が `indexes/` 3 ファイルに閉じている（他ファイルへの混入なし）
- [ ] typecheck / lint green

---

## Rollback 手順

| トリガ | 手順 |
| --- | --- |
| M-1 適用後に rebuild が fail | `git restore .claude/skills/aiworkflow-requirements/indexes/resource-map.md` で巻き戻し、Phase 6 異常系「rebuild 失敗」フローへ |
| M-2 適用後に文言が CI gate と整合しない | `git restore .claude/skills/aiworkflow-requirements/indexes/quick-reference.md`、quick-reference のフォーマット規約を再確認して再適用 |
| topic-map.md が想定外の大量 diff を生成 | `git restore .claude/skills/aiworkflow-requirements/indexes/topic-map.md` し、resource-map / quick-reference の追記を最小化（CONST_005 の 1〜2 行制約を再確認） |
| CI gate `verify-indexes-up-to-date` が PR 上で fail | ローカルで `pnpm indexes:rebuild` 再実行 → 差分を commit / push（Phase 6 異常系参照） |

> 本タスクは D1 / コードに触れないため、rollback は git 操作のみで完結する。

---

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | S-4 / S-5 / S-6 失敗時のリカバリ手順を深堀 |
| Phase 7 | M-1 / M-2 / M-3 を AC マトリクスに紐付け |
| Phase 9 | sanity check コマンド集を quality gate に組み込み |
| Phase 12 | 追記文言と D1 runbook 本体の文字列整合を docs 同期で確認 |

---

## 多角的チェック観点（不変条件）

- 不変条件 #5（apps/web → D1 直接禁止）: 追記内容は D1 runbook の**所在のみ**を案内し、binding コードの apps/web 露出を誘発しない
- CONST_005: 変更対象 path / 実行コマンド / DoD（完了条件）が表で網羅されていること
- DRY: D1 関連行は resource-map で 1 箇所、quick-reference で 1 行に集約。重複記述を作らない
- YAGNI: 1〜2 行の追記制約を厳守し、関連説明文を肥大化させない

---

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 事前確認（重複 / 構造 / rebuild script） | 5 | completed | S-1 |
| 2 | M-1 resource-map 追記 | 5 | completed | 1〜2 行 |
| 3 | M-2 quick-reference 追記 | 5 | completed | 1 行固定 |
| 4 | M-3 indexes:rebuild 実行 | 5 | completed | 冪等性確認まで |
| 5 | typecheck / lint | 5 | completed | 連動破壊なきこと |
| 6 | commit 前 sanity 一括確認 | 5 | completed | チェックリスト全項目 |
| 7 | rollback 手順 dry-run 想定 | 5 | completed | 実走不要 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | ファイル変更マニフェスト / placeholder / runbook / sanity / rollback |
| メタ | artifacts.json | Phase 5 を completed に更新 |

---

## 完了条件

- [ ] ファイル変更マニフェスト M-1 / M-2 / M-3 が path / 種別 / 行数で網羅
- [ ] M-1 / M-2 の Edit placeholder（old / new）が固定されている
- [ ] 実装ランブック S-1〜S-8 が sanity check コマンド付きで確定
- [ ] sanity check コマンド集が grep / rebuild / typecheck / lint を網羅
- [ ] commit 前確認チェックリストが 6 項目で完成
- [ ] rollback 手順が 4 トリガで記述されている

---

## タスク100%実行確認【必須】

- 全実行タスクが completed
- `outputs/phase-05/main.md` が指定パスに配置済み
- 完了条件 6 件すべてにチェック
- artifacts.json の phase 5 を completed に更新

---

## 次 Phase

- 次: 6 (異常系検証)
- 引き継ぎ事項: ファイル変更マニフェスト / placeholder / sanity check / rollback 手順
- ブロック条件: M-1 / M-2 のいずれかで placeholder が未確定、または rebuild script が未確認の場合は Phase 6 に進まない
