// 06b: 唯一の編集導線（外部 Google Form リンク）。
// 不変条件 #4: 本文編集 form をアプリ内に配置しない。CTA はリンク or 無効化ボタンのみ。

export interface EditCtaProps {
  readonly editResponseUrl: string | null;
  readonly fallbackResponderUrl: string;
}

export function EditCta({ editResponseUrl, fallbackResponderUrl }: EditCtaProps) {
  return (
    <section aria-label="プロフィール編集">
      <h2>プロフィールを編集する</h2>
      {editResponseUrl ? (
        <p>
          <a
            href={editResponseUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-cta="edit-response"
          >
            Google Form で編集する
          </a>
        </p>
      ) : (
        <p>
          <span
            aria-disabled="true"
            data-cta="edit-response-disabled"
            title="編集 URL を取得中です。しばらくお待ちください。"
          >
            Google Form で編集する（取得中）
          </span>
        </p>
      )}
      <p>
        新規回答する場合:{" "}
        <a
          href={fallbackResponderUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-cta="new-response"
        >
          Google Form（新規回答）
        </a>
      </p>
    </section>
  );
}
