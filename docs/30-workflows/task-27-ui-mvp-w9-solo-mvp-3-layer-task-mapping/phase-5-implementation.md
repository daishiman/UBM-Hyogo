# Phase 5: 実装（mapping matrix 生成）

> Phase: 5 / 13
> 名称: 実装
> 形態: 単一 markdown 生成

---

## 目的

`docs/30-workflows/ui-prototype-alignment-mvp-recovery/MVP-3LAYER-TASK-MAPPING.md` を生成する。

---

## 新規作成ファイル一覧

| パス | 目的 |
|------|------|
| `docs/30-workflows/ui-prototype-alignment-mvp-recovery/MVP-3LAYER-TASK-MAPPING.md` | 88 セル double-entry matrix + WARN/FAIL 集約 + readiness 判定 |
| `outputs/phase-5/implementation-notes.md`（本 task root 配下） | 各セル分類根拠ログ |

修正ファイル: なし（read-only mapping）

---

## 実行手順

### Step 1: 入力資料の確認

1. `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` を読み込み、19 routes と 4 層対応を抽出する
2. `ls docs/30-workflows/ui-prototype-alignment-mvp-recovery/` で task-01〜22 のディレクトリ名を列挙
3. 各 task root `index.md` の「対象 routes / 変更対象ファイル / DoD」を読み込み、対象 routes 集合をメモする
4. `docs/30-workflows/task-23-.../` 配下に `VERIFICATION-STATUS.md` 実体が生成されているか確認
   - 存在する場合: WARN/FAIL を含むタスク行を抽出
   - 存在しない場合: 本 matrix の section 5 に「task-23 未完了のため WARN/FAIL 集約は保留」と明記
5. task-24 / task-25 の結果ファイル存在も同様に確認し、section 6 / 7 に取り込む

### Step 2: Matrix A の作成（タスク → 層）

各 task について Phase 2 の判定樹に従い、4 層への分類を決定する。判定根拠は `implementation-notes.md` に記録。

GFM table 形式:

```markdown
| Task ID | 主題 | PUB | MEM | ADM | COM | 備考 |
|---------|------|-----|-----|-----|-----|------|
| task-01 | ... | 必須 | 必須 | 必須 | 必須 | tokens.css 全層必須 |
| ... | ... | ... | ... | ... | ... | ... |
```

### Step 3: Matrix B の作成（層 → タスク）

Matrix A から逆引きで構築:

```markdown
### 公開層 (PUB)
- 必須: task-XX, task-YY, ...
- 強関与: task-AA, ...
- 軽関与: task-BB, ...
- 無関係: task-CC, ...

### 会員層 (MEM)
...
```

### Step 4: WARN / FAIL 集約 section 5

task-23 結果が利用可能であれば、影響を受ける層別に列挙。

### Step 5: invariant / smoke 集約 section 6 / 7

task-24 / task-25 結果が利用可能であれば、層別に集約。利用不可なら「上流タスク未完了のため保留」と明記。

### Step 6: 戦略 readiness 判定 section 8

層ごとに READY / AT_RISK / BLOCKED を判定して理由を記載。

### Step 7: 脚注 / 参考リンク section 9

参照ファイル一覧（SCOPE.md、VERIFICATION-STATUS.md、各 task root）を明記。

---

## セル分類の根拠記録ルール

`outputs/phase-5/implementation-notes.md` に以下の形式で 22 タスク分を記録する:

```
### task-NN
- 主題: ...
- 対象 routes: ...
- 公開層: 必須/強関与/軽関与/無関係（根拠: ...）
- 会員層: ...
- 管理層: ...
- 共通層: ...
```

---

## 完了条件

- `MVP-3LAYER-TASK-MAPPING.md` が生成され、TC-01〜10 がすべて PASS
- `implementation-notes.md` に 22 タスク分の根拠が記録されている
- `git diff --stat` で既存 task-01〜22 ファイルに変更がない
- `complete-phase.js`（task-specification-creator skill）で Phase 5 status を `completed` に更新
