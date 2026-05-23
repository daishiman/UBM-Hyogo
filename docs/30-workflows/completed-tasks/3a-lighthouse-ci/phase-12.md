# Phase 12: ドキュメント更新（3a Lighthouse CI 導入）

[実装区分: 実装仕様書]

| 項目 | 値 |
|------|----|
| 入力 | `phase-11.md` 完了 evidence |
| 出力 | CLAUDE.md「よく使うコマンド」追記候補 / `docs/00-getting-started-manual/` 該当箇所更新 / topic-map / backlog 引き取り |

---

## 1. 中学生レベル概念説明

> Phase 12 必須項目: タスクの本質を中学生にもわかるレベルで説明する。

### 1.1 なに？

「Lighthouse CI」は、Web サイトの品質を 4 つの観点（速さ・使いやすさ・お行儀・検索のされやすさ）で **自動で点数をつける検査機** です。プルリクエスト（コードを混ぜる前のリクエスト）が出されるたびに、合格点を下回ったら「ブロック」して、merge できないようにします。

### 1.2 なぜ？

- 人間は目視で品質劣化に気づきにくい
- いったんサイトの速度が落ちると、ユーザーが離脱する
- 自動で毎回点数を取れば、こっそり悪化することを防げる

### 1.3 4 つの観点と合格点

| 観点 | 合格点 | 意味 |
|------|--------|------|
| Performance（速さ） | 80 点 | 表示の速さ |
| Accessibility（使いやすさ） | 90 点 | 障害者など多様な人が使えるか |
| Best Practices（お行儀） | 90 点 | Web 標準の作法を守っているか |
| SEO（検索のされやすさ） | 80 点 | Google 検索で見つかりやすい構造か |

### 1.4 どう動く？

```
プルリクエスト作成
   ↓
GitHub Actions が自動で動く
   ↓
Next.js を本番モードで起動して、4 ページに対して点数をつける
   ↓
1 つでも合格点を下回るとプルリクエストが「赤」になり merge 不可
```

---

## 2. CLAUDE.md「よく使うコマンド」追記候補

### 2.1 対象ファイル

`/Users/dm/dev/dev/個人開発/UBM-Hyogo/CLAUDE.md`

### 2.2 追記候補（差分）

```diff
 mise exec -- pnpm sync:check      # origin/main・origin/dev とローカル/全 worktree の遅れを通知（git fetch 後の手動チェック）
+
+# Lighthouse CI ローカル実行（4 routes に対して品質スコアを assertion）
+mise exec -- pnpm --filter @ubm-hyogo/web build
+mise exec -- pnpm --filter @ubm-hyogo/web start &
+for i in {1..60}; do curl -fsS http://localhost:3000 >/dev/null && break; sleep 1; done
+mise exec -- pnpm exec lhci autorun --config=./lighthouserc.json
```

### 2.3 「Governance / CODEOWNERS」セクションへの追記候補

3c 適用後（本タスク完了 + 3b 完了 + 手動 `gh api` 実行後）に以下表を追記する。**本 Phase 12 では「3c 適用待ち」のスタブとして TODO コメントだけ残し、3c 完了時に 3b と合わせて記載する**。

| context | 由来 workflow |
|---------|--------------|
| `lighthouse-ci` | `.github/workflows/lighthouse.yml`（本 PR-A） |

> 3a 単独 PR の本 Phase では context 名を CLAUDE.md に **断定形で書かない**（branch protection 未適用のため）。LOGS.md には記録するが、CLAUDE.md governance 表は 3c 適用後に書く。

---

## 3. `docs/00-getting-started-manual/` 該当箇所

| path | 内容 |
|------|------|
| `docs/00-getting-started-manual/specs/00-overview.md` | 「品質保証」セクション末尾に Lighthouse CI 導入 1 行追記（オプション） |
| `docs/00-getting-started-manual/claude-code-config.md` | 影響なし |

> 本タスクは spec 直接更新は **必須ではない**（運用側の改善）。LOGS.md に詳細を記し、spec への昇格判断は 3c 完了後に再評価する。

---

## 4. LOGS.md 更新

### 4.1 対象ファイル

| path | 内容 |
|------|------|
| `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3a-lighthouse-ci/LOGS.md`（新規） | 3a 完了ログ |
| `docs/30-workflows/LOGS.md`（既存） | workflow 群横断ログ。3a 完了 1 行を追記 |

### 4.2 `3a-lighthouse-ci/LOGS.md` 構造

| section | 内容 |
|---------|------|
| Header | `# 3a Lighthouse CI LOGS` / 完了日 / base branch / PR-A URL |
| 1. 完了サマリ | `lighthouse-ci` workflow / `lighthouserc.json` / `@lhci/cli` 追加 |
| 2. 実測スコア | Lighthouse 4 routes（縮退時 3 routes）中央値 |
| 3. 5 連続 run ばらつき | 標準偏差・最小値 |
| 4. Q-02 判定 | 維持 or 縮退 + 観測スコア |
| 5. 故意 fail 再現 | `outputs/phase-11/lighthouse-fail.log` 要約 |
| 6. 残課題 | OBS-01 / RB-01..RB-04 / EXT-X1 / 3c 適用待ち |

### 4.3 `30-workflows/LOGS.md` への 1 行追記

```
- 2026-05-XX e2e-quality-uplift-stage-3-impl/3a-lighthouse-ci 完了 — lighthouse-ci workflow + lighthouserc.json (4 routes / perf>=80 / a11y>=90 / bp>=90 / seo>=80) 導入。context 名 GitHub 登録済。3c branch protection 適用は別オペレーション。
```

---

## 5. topic-map 更新

### 5.1 対象ファイル

`.claude/skills/aiworkflow-requirements/indexes/topic-map.json`（または `topic-map.md`）。

### 5.2 追記 entry

| topic | references |
|-------|-----------|
| `lighthouse-ci` | `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3a-lighthouse-ci/phase-2.md`, `lighthouserc.json`, `.github/workflows/lighthouse.yml` |
| `ci-quality-gate` | `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3a-lighthouse-ci/index.md` |

### 5.3 indexes 再生成

```bash
mise exec -- pnpm indexes:rebuild
```

CI gate `verify-indexes-up-to-date`（`.github/workflows/verify-indexes.yml`）が pass することを確認。

---

## 6. backlog 記録

`docs/30-workflows/e2e-quality-uplift/backlog.md`（新規 or 既存）に追記:

| ID | 内容 | 優先 | 引き取り Stage |
|----|------|------|---------------|
| RB-01 | `lighthouse` / `pr-build-test` の build 共有 | low | Stage 4 |
| RB-02 | composite action `setup-project` | mid | Stage 4 |
| RB-03 | `paths` filter による docs-only PR skip 戦略 | mid | Stage 4 |
| RB-04 | LHCI Server 自前ホスティング | low | Stage 5+ |
| EXT-X1 | `/profile` 認証済 a11y 計測 | mid | Stage 4 |
| OBS-01 | `enforce_admins=false` drift 是正 | mid | governance drift workflow |

---

## 7. 更新コミット粒度

| commit | 内容 |
|--------|------|
| C1 | `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3a-lighthouse-ci/LOGS.md` 新規 + `docs/30-workflows/LOGS.md` 追記 |
| C2 | `topic-map` 更新 + `pnpm indexes:rebuild` 反映分 |
| C3 | `docs/30-workflows/e2e-quality-uplift/backlog.md` 新規/追記 |
| C4 | `CLAUDE.md`「よく使うコマンド」追記（governance 表は 3c 完了後別 PR） |

---

## 8. 終了基準

| # | 条件 |
|---|------|
| EX-01 | LOGS.md 2 ファイルが更新済 |
| EX-02 | topic-map 更新 + `verify-indexes-up-to-date` pass |
| EX-03 | backlog に RB-01..RB-04 / EXT-X1 / OBS-01 が記載 |
| EX-04 | CLAUDE.md「よく使うコマンド」に Lighthouse 実行コマンドが追記 |

---

## 9. 引き継ぎ（Phase 13 へ）

| 項目 | 内容 |
|------|------|
| Phase 13 入力 | 全 phase 完了 + evidence + ドキュメント更新 |
| PR base | `dev` |
| 含む変更 | spec 群 + 実装ファイル + evidence + LOGS.md + topic-map + backlog + CLAUDE.md（コマンド追記のみ） |

---

## DoD（Phase 12 完了条件・必須 7 項目）

| # | 項目 | 状態 |
|---|------|------|
| D-01 | 中学生レベル概念説明（§1） | ✅ |
| D-02 | CLAUDE.md 追記候補（§2） | ✅ |
| D-03 | spec 該当箇所言及（§3） | ✅ |
| D-04 | LOGS.md 2 ファイル更新計画（§4） | ✅ |
| D-05 | topic-map 更新計画（§5） | ✅ |
| D-06 | backlog 引き取り計画（§6） | ✅ |
| D-07 | コミット粒度（§7） | ✅ |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3-impl/3a-lighthouse-ci
- phase: 12
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_created

## 目的

3a Lighthouse CI 完了に伴うドキュメント更新を 7 項目（中学生説明 / CLAUDE.md / spec / LOGS / topic-map / backlog / コミット粒度）で確定する。

## 実行タスク

- 中学生レベル説明を §1 に書く。
- CLAUDE.md 追記候補を §2 に確定。
- spec 該当箇所を §3 に確定。
- LOGS.md / topic-map / backlog 更新を確定。

## 参照資料

- docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/phase-12.md
- phase-11.md（本サブタスク内）

## 実行手順

1. 中学生説明を作成。
2. LOGS.md 2 ファイルを更新。
3. topic-map に 2 entry 追加し indexes:rebuild。
4. backlog 引き取り。
5. CLAUDE.md にコマンド追記。

## 統合テスト連携

- NON_VISUAL phase は Playwright 実行の代替として list smoke、grep gate、typecheck を使用する。

## 成果物

- 本 phase markdown
- LOGS.md / topic-map / backlog / CLAUDE.md 差分

## 完了条件

- [x] 必須 7 項目（D-01..D-07）が網羅。
- [x] coverage AC 適用: standard tier lines >= 70%（本タスクは NON_VISUAL）。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
