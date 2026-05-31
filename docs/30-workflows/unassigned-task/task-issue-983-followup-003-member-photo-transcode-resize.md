# Member photo transcode and resize pipeline - タスク指示書

## メタ情報

```yaml
issue_number: 1030
task_id: task-issue-983-followup-003-member-photo-transcode-resize
task_name: Member photo transcode and resize pipeline
category: パフォーマンス
target_feature: member photo image processing
priority: 低
scale: 中規模
status: 未実施
source_phase: issue-983 Phase 12 unassigned-task-detection
created_date: 2026-05-29
dependencies: [issue-983-member-photo-avatar-r2-storage]
```

| 項目 | 内容 |
| --- | --- |
| タスクID | task-issue-983-followup-003-member-photo-transcode-resize |
| タスク名 | Member photo transcode and resize pipeline |
| 分類 | パフォーマンス |
| 対象機能 | member photo image processing |
| 優先度 | 低 |
| 見積もり規模 | 中規模 |
| ステータス | 未実施 |
| 発見元 | `docs/30-workflows/issue-983-member-photo-avatar-r2-storage/outputs/phase-12/unassigned-task-detection.md` |
| 関連 Issue | #983 |

---

## 1. なぜこのタスクが必要か

Issue #983 は MVP として R2 に静的画像を保存し、API が短期 signed URL を返す設計にした。Phase 12 implementation guide でも、許可 MIME は jpeg/png/webp、上限は 256KB、ブラウザ側は `<img>` error で hue placeholder に戻すと定義している。

この MVP は管理者が小さな画像を登録する前提では十分だが、運用が進むと画像サイズ、形式ばらつき、一覧表示の帯域、public 表示時のキャッシュ効率が課題になる。Cloudflare Images や Workers-side transform などの外部サービス判断は無料枠・コスト・契約への影響があるため、Issue #983 の初期実装から分離した。

## 2. 何を達成するか

member photo のアップロード時または非同期処理で、表示用サイズに resize/transcode した variant を生成し、admin/public UI が適切な variant を使えるようにする。コストと無料枠を評価し、Cloudflare Images 採用、Workers transform、client-side pre-resize のいずれかを ADR で決定する。

### 受け入れ基準

- 原本と表示用 variant の保存方針が ADR 化されている
- 画像処理方式のコスト、無料枠、失敗時 fallback が比較されている
- `member_photos` metadata に variant を識別できる情報が追加されている
- admin drawer は avatar 表示に適切な小サイズ variant を使う
- 処理失敗時も原本または hue placeholder に安全に fallback する

## 3. 実行方針

1. Phase 1 で Issue #983 の R2 static storage contract と free-tier constraints を確認する
2. Phase 2 で Cloudflare Images / Workers transform / client-side pre-resize を比較し ADR 化する
3. Phase 4-6 で processing helper、repository metadata、route contract tests を追加する
4. Phase 11 で resized image の visual comparison と fallback evidence を取得する
5. Phase 12 で aiworkflow-requirements の storage/photo processing policy を更新する

## 苦戦箇所【記入必須】

- 対象: `apps/api/src/lib/r2/member-photo-presign.ts`
- 症状: Issue #983 の presign helper は単一 object key `members/{memberId}/avatar` を前提にしている。variant を追加する場合、key naming と TTL を変えないまま拡張すると、原本 URL と thumbnail URL を取り違えるリスクがある。
- 対象: `apps/api/migrations/0022_member_photos.sql`
- 症状: MVP metadata は単一写真を前提にしているため、variant path、content hash、processing status を足すなら migration と route response の後方互換を同時に設計する必要がある。
- 参照: `docs/30-workflows/issue-983-member-photo-avatar-r2-storage/outputs/phase-12/implementation-guide.md`

## リスクと対策

| リスク | 対策 |
| --- | --- |
| Cloudflare Images 採用で無料構成制約を超える | Phase 2 ADR で monthly cost と free-tier boundary を明示し、user approval gate を設ける |
| variant key 設計が曖昧で orphan object が残る | key naming、delete cascade、audit action を受け入れ基準に含める |
| 画像処理失敗で admin drawer が壊れる | processing status を持ち、失敗時は原本または placeholder fallback にする |
| public display task と責務が重なる | 本タスクは processing pipeline のみ扱い、public consent/exposure policy は別タスクに委譲する |

## 検証方法

### 単体検証

```bash
mise exec -- pnpm --filter @repo/api test -- member-photo
mise exec -- pnpm --filter @repo/shared test -- viewmodel
```

期待: variant metadata、delete cascade、fallback contract が PASS。

### 統合検証

```bash
mise exec -- pnpm --filter @repo/api typecheck
mise exec -- pnpm --filter @repo/api lint
```

期待: processing helper と route contract の型・lint が PASS。

### Runtime evidence

R2 bucket と必要な画像処理サービスの user approval 後に実施する。artifact は object key、サイズ、MIME、hash の summary のみとし、signed URL 実値は保存しない。

## スコープ

### 含む

- image processing ADR
- variant key/metadata design
- processing helper or service integration
- route/repository tests
- admin avatar variant usage

### 含まない

- member self-upload UX（別タスク `task-issue-983-followup-001-member-self-photo-upload.md`）
- public photo display policy（別タスク `task-issue-983-followup-002-public-member-photo-display.md`）
- Google Form schema 変更（Issue #983 invariant と矛盾するため実施しない）

## 参照

- Issue #983: https://github.com/daishiman/UBM-Hyogo/issues/983
- `docs/30-workflows/issue-983-member-photo-avatar-r2-storage/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/issue-983-member-photo-avatar-r2-storage/outputs/phase-12/unassigned-task-detection.md`
- `apps/api/src/lib/r2/member-photo-presign.ts`
- `apps/api/src/repository/memberPhotos.ts`
- `apps/api/migrations/0022_member_photos.sql`
