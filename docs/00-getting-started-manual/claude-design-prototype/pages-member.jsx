// Member-facing pages: Login, Member form, My profile, Revalidation prompt

// ================== LOGIN ==================
const LoginPage = ({ nav }) => {
  const toast = useToast();
  const [email, setEmail] = useState("taro@example.com");
  const [step, setStep] = useState("input"); // input | sent

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="brand" style={{ borderBottom: 0, padding: 0, marginBottom: 24 }}>
          <div className="brand-mark">兵</div>
          <div className="brand-title">
            <span className="jp">UBM兵庫支部会</span>
            <span className="en">Member Portal</span>
          </div>
        </div>
        {step === "input" ? (
          <>
            <h1 className="h-page" style={{ fontSize: 24, marginBottom: 6 }}>会員ログイン</h1>
            <p className="body" style={{ marginBottom: 20, fontSize: 13.5 }}>
              Googleフォームにご登録のメールアドレス宛に、ログイン用のマジックリンクをお送りします。
            </p>
            <div className="stack">
              <Field label="メールアドレス" required>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" lg />
              </Field>
              <Button variant="primary" size="lg" block icon="send" onClick={() => { setStep("sent"); toast("マジックリンクを送信しました", "ok"); }}>
                マジックリンクを送る
              </Button>
              <div className="row" style={{ gap: 10, margin: "6px 0", color: "var(--text-3)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "var(--font-en)" }}>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }}/>OR<div style={{ flex: 1, height: 1, background: "var(--border)" }}/>
              </div>
              <Button variant="ghost" size="lg" block icon="google" onClick={() => { toast("Googleログインに成功しました", "ok"); nav("my"); }}>
                Googleでログイン
              </Button>
            </div>
            <div className="small" style={{ marginTop: 20, textAlign: "center" }}>
              会員でない方は <a style={{ color: "var(--accent)", fontWeight: 500, cursor: "pointer" }} onClick={() => nav("member-form")}>メンバー登録</a> から
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--ok-soft)", color: "var(--ok)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
                <Icon name="inbox" size={28}/>
              </div>
              <h2 className="h-section" style={{ fontSize: 20 }}>メールをご確認ください</h2>
              <p className="body" style={{ marginTop: 8, fontSize: 13 }}>
                <b style={{ color: "var(--text)" }}>{email}</b> 宛にログイン用のリンクをお送りしました。<br/>数分以内に届かない場合は迷惑メールをご確認ください。
              </p>
              <Button variant="ghost" size="sm" icon="arrowLeft" onClick={() => setStep("input")} style={{ marginTop: 20 }}>
                戻る
              </Button>
              <div style={{ marginTop: 14 }}>
                <Button variant="primary" size="sm" onClick={() => nav("my")}>（デモ用）ログイン完了</Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ================== MEMBER FORM (Google Form redirect landing) ==================
const MemberFormPage = ({ nav }) => {
  const { SURVEY_SECTIONS } = window.UBM;
  const toast = useToast();
  const GOOGLE_FORM_URL = "https://forms.gle/example-ubm-hyogo";

  const openForm = () => {
    toast("Googleフォームを開きました", "ok");
  };

  const publicCount = SURVEY_SECTIONS.reduce((n, s) => n + s.fields.filter((f) => f.visibility === "public").length, 0);
  const memberCount = SURVEY_SECTIONS.reduce((n, s) => n + s.fields.filter((f) => f.visibility === "member").length, 0);
  const totalCount = SURVEY_SECTIONS.reduce((n, s) => n + s.fields.length, 0);

  return (
    <div className="page-enter" style={{ maxWidth: 820, margin: "0 auto" }}>
      <div className="page-head">
        <div>
          <div className="eyebrow">MEMBER REGISTRATION</div>
          <h1 className="h-page">メンバー登録</h1>
          <p className="muted">回答はGoogleフォームから行います。数分で完了します。</p>
        </div>
      </div>

      {/* Hero CTA */}
      <div className="card card-pad-lg" style={{ position: "relative", overflow: "hidden", borderRadius: 24 }}>
        <div style={{
          position: "absolute", top: -40, right: -40, width: 240, height: 240,
          background: "radial-gradient(circle, color-mix(in oklch, var(--accent) 16%, transparent), transparent 70%)",
          pointerEvents: "none"
        }}/>
        <div style={{ position: "relative", maxWidth: 560 }}>
          <Chip tone="accent" dot>Google Forms</Chip>
          <h2 className="serif" style={{ fontSize: 32, lineHeight: 1.25, letterSpacing: "-0.02em", fontWeight: 600, marginTop: 14 }}>
            Googleフォームで<br/>プロフィール情報をご登録ください
          </h2>
          <p className="body" style={{ marginTop: 14 }}>
            ご回答いただいた内容は、自動で本サイトに反映されます。<b style={{ color: "var(--text)" }}>所要時間は5〜10分ほど</b>です。
          </p>
          <div className="btn-row" style={{ marginTop: 24 }}>
            <a href={GOOGLE_FORM_URL} target="_blank" rel="noreferrer" className="btn btn-primary btn-lg" onClick={openForm}>
              <Icon name="external" size={15}/>
              Googleフォームを開く
            </a>
            <Button variant="ghost" size="lg" icon="arrowLeft" onClick={() => nav("landing")}>トップに戻る</Button>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="card card-pad-lg" style={{ marginTop: 20 }}>
        <div className="eyebrow">HOW IT WORKS</div>
        <h2 className="h-section" style={{ marginTop: 8 }}>登録の流れ</h2>
        <div className="grid-3" style={{ marginTop: 18 }}>
          {[
            { n: "01", t: "Googleフォームで回答", d: "上のボタンからフォームを開いて、ご自身のペースで回答ください。" },
            { n: "02", t: "自動反映（最大15分）", d: "ご回答は本サイトに自動取り込みされ、メンバー一覧・詳細ページに掲載されます。" },
            { n: "03", t: "ログインして確認", d: "ご登録のメールアドレスで本サイトにログインすると、マイページから公開内容をご確認いただけます。" },
          ].map((s) => (
            <div key={s.n} className="card-flat" style={{ padding: 18 }}>
              <div className="mono" style={{ fontSize: 11, color: "var(--accent)", fontWeight: 600, letterSpacing: "0.12em" }}>STEP {s.n}</div>
              <div style={{ fontWeight: 600, fontSize: 15, marginTop: 10 }}>{s.t}</div>
              <p className="small" style={{ marginTop: 8, color: "var(--text-2)", lineHeight: 1.7 }}>{s.d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* What you'll be asked */}
      <div className="card card-pad-lg" style={{ marginTop: 20 }}>
        <div className="row-between" style={{ marginBottom: 16 }}>
          <div>
            <div className="eyebrow">FORM CONTENTS</div>
            <h2 className="h-section" style={{ marginTop: 8 }}>フォームの設問（プレビュー）</h2>
          </div>
          <div className="row-wrap" style={{ gap: 8 }}>
            <Chip tone="info"><Icon name="eye" size={10}/>公開 {publicCount}項目</Chip>
            <Chip><Icon name="users" size={10}/>会員限定 {memberCount}項目</Chip>
            <Chip outline>全 {totalCount}項目</Chip>
          </div>
        </div>
        <div className="stack-sm">
          {SURVEY_SECTIONS.map((sec, i) => (
            <details key={sec.key} className="card-flat" style={{ padding: 0, overflow: "hidden" }} open={i === 0}>
              <summary style={{ padding: "14px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, listStyle: "none", userSelect: "none" }}>
                <div className="mono" style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, width: 20 }}>{String(i+1).padStart(2, "0")}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{sec.label}</div>
                  <div className="small">{sec.note} · {sec.fields.length}項目</div>
                </div>
                <Icon name="chevronDown" size={14} style={{ color: "var(--text-3)" }}/>
              </summary>
              <div style={{ padding: "0 18px 16px 50px", borderTop: "1px solid var(--border)" }}>
                <div className="stack-sm" style={{ marginTop: 12 }}>
                  {sec.fields.map((f) => (
                    <div key={f.key} className="row" style={{ gap: 10, fontSize: 13 }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 500 }}>{f.label}</span>
                        {f.required && <span style={{ color: "var(--danger)", fontSize: 10, marginLeft: 6 }}>*必須</span>}
                      </div>
                      <Chip size="sm" tone={f.visibility === "public" ? "info" : f.visibility === "member" ? "default" : "warn"}>
                        <Icon name={f.visibility === "public" ? "eye" : f.visibility === "member" ? "users" : "shield"} size={10}/>
                        {f.visibility === "public" ? "公開" : f.visibility === "member" ? "会員" : "管理用"}
                      </Chip>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="card card-pad-lg" style={{ marginTop: 20 }}>
        <div className="eyebrow">FAQ</div>
        <h2 className="h-section" style={{ marginTop: 8 }}>よくあるご質問</h2>
        <div className="stack-sm" style={{ marginTop: 14 }}>
          {[
            { q: "回答内容の修正はどうすればいい？", a: "同じメールアドレスで再度Googleフォームに回答すると、古い回答は自動的に新しい回答に上書きされます。再掲載に手続きは不要です。" },
            { q: "公開情報と会員限定情報の違いは？", a: "「公開」項目は本サイトの誰でも閲覧可能です。「会員限定」項目はログインしたメンバーのみ閲覧可能です。「管理用」項目は管理者のみが参照します。" },
            { q: "公開を止めたい / 退会したい場合は？", a: "ログイン後のマイページから、公開停止または退会申請を送っていただけます。" },
          ].map((f, i) => (
            <details key={i} className="card-flat" style={{ padding: "14px 18px" }}>
              <summary style={{ cursor: "pointer", fontWeight: 500, fontSize: 14, listStyle: "none", display: "flex", alignItems: "center", gap: 10 }}>
                <Icon name="info" size={14} style={{ color: "var(--accent)" }}/>
                <span style={{ flex: 1 }}>{f.q}</span>
                <Icon name="chevronDown" size={13} style={{ color: "var(--text-3)" }}/>
              </summary>
              <p className="body" style={{ marginTop: 10, fontSize: 13, paddingLeft: 24 }}>{f.a}</p>
            </details>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="card card-pad-lg" style={{ marginTop: 20, background: "var(--text)", color: "var(--panel)", borderColor: "var(--text)", textAlign: "center", padding: "32px 24px" }}>
        <h3 className="h-section" style={{ color: "inherit" }}>準備はできましたか？</h3>
        <p className="body" style={{ color: "color-mix(in oklch, white 70%, transparent)", marginTop: 8 }}>
          入力時間は5〜10分です。途中で保存されないのでまとまった時間でご回答ください。
        </p>
        <div style={{ marginTop: 20 }}>
          <a href={GOOGLE_FORM_URL} target="_blank" rel="noreferrer" className="btn btn-accent btn-lg" onClick={openForm}>
            <Icon name="external" size={15}/>
            Googleフォームを開く
          </a>
        </div>
      </div>
    </div>
  );
};

// ================== MY PROFILE (member's own view) ==================
const MyProfilePage = ({ nav, tweaks }) => {
  const { MEMBERS } = window.UBM;
  const m = MEMBERS[0];
  const [showRevalidate, setShowRevalidate] = useState(false);

  return (
    <div className="page-enter stack-lg">
      <div className="page-head">
        <div>
          <div className="eyebrow">MY PROFILE</div>
          <h1 className="h-page">マイページ</h1>
          <p className="muted">公開情報と会員限定情報を確認・編集できます。</p>
        </div>
        <div className="btn-row">
          <Button variant="ghost" icon="eye" onClick={() => nav("member", { id: m.id })}>公開ページを見る</Button>
          <Button variant="primary" icon="edit" onClick={() => setShowRevalidate(true)}>情報を更新する</Button>
        </div>
      </div>

      {/* Status banner */}
      <div className="card card-pad" style={{ background: "var(--ok-soft)", borderColor: "color-mix(in oklch, var(--ok) 20%, transparent)" }}>
        <div className="row-between">
          <div className="row" style={{ gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--ok)", color: "#fff", display: "grid", placeItems: "center" }}>
              <Icon name="checkCircle" size={18}/>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ok)" }}>プロフィールは公開されています</div>
              <div className="small" style={{ color: "var(--ok)" }}>最終更新: 2026-04-09 09:30 · 回答ID: resp-001</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" icon="refresh">再検証する</Button>
        </div>
      </div>

      {/* Visibility summary */}
      <div className="grid-3">
        <div className="card card-pad">
          <div className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 6 }}><Icon name="eye" size={11}/>PUBLIC</div>
          <div style={{ fontSize: 32, fontWeight: 600, marginTop: 8, fontFamily: "var(--font-en)", letterSpacing: "-0.03em" }}>18</div>
          <div className="small">公開中の項目</div>
        </div>
        <div className="card card-pad">
          <div className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 6 }}><Icon name="users" size={11}/>MEMBERS</div>
          <div style={{ fontSize: 32, fontWeight: 600, marginTop: 8, fontFamily: "var(--font-en)", letterSpacing: "-0.03em" }}>5</div>
          <div className="small">会員のみに公開</div>
        </div>
        <div className="card card-pad">
          <div className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 6 }}><Icon name="shield" size={11}/>PRIVATE</div>
          <div style={{ fontSize: 32, fontWeight: 600, marginTop: 8, fontFamily: "var(--font-en)", letterSpacing: "-0.03em" }}>2</div>
          <div className="small">管理者のみ閲覧</div>
        </div>
      </div>

      {/* Profile preview */}
      <div className="card card-pad-lg hero-split">
        <Avatar name={m.fullName} size="xl" hue={m.hue} id={m.id} editable/>
        <div>
          <div className="eyebrow">PREVIEW</div>
          <h2 className="h-page" style={{ marginTop: 8, fontSize: 28 }}>{m.fullName}</h2>
          <div style={{ color: "var(--text-2)", fontSize: 14, marginTop: 6 }}>{m.occupation}</div>
          <div className="chip-row" style={{ marginTop: 14 }}>
            <Chip tone={zoneTone(m.ubmZone)} dot>{m.ubmZone}</Chip>
            <Chip tone={statusTone(m.ubmMembershipType)}>{m.ubmMembershipType}</Chip>
            <Chip><Icon name="mapPin" size={11}/>{m.location}</Chip>
          </div>
        </div>
      </div>

      {/* Fields overview */}
      <div className="card card-pad-lg">
        <div className="row-between" style={{ marginBottom: 14 }}>
          <h2 className="h-section">回答内容</h2>
          <Button variant="ghost" size="sm" icon="external" onClick={() => nav("member-form")}>フォームを開いて更新</Button>
        </div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>基本プロフィール</div>
        <KVList rows={[
          { k: "お名前", v: m.fullName },
          { k: "ニックネーム", v: m.nickname },
          { k: "お住まい", v: m.location },
          { k: "出身地", v: m.hometown },
          { k: "生年月日", v: m.birthDate },
          { k: "職業・仕事内容", v: m.occupation },
        ]}/>
        <div className="eyebrow" style={{ marginTop: 20, marginBottom: 8 }}>UBM情報</div>
        <KVList rows={[
          { k: "UBM区画", v: m.ubmZone },
          { k: "参加ステータス", v: m.ubmMembershipType },
          { k: "UBM参加時期", v: m.ubmJoinDate },
          { k: "ビジネス概要", v: m.businessOverview },
          { k: "得意分野・スキル", v: m.skills },
          { k: "現在の課題", v: m.challenges },
          { k: "提供できること", v: m.canProvide },
        ]}/>
        <div className="eyebrow" style={{ marginTop: 20, marginBottom: 8 }}>パーソナル</div>
        <KVList rows={[
          { k: "趣味・好きなこと", v: m.hobbies },
          { k: "最近ハマっていること", v: m.recentInterest },
          { k: "座右の銘", v: m.motto },
          { k: "仕事以外の活動", v: m.otherActivities },
        ]}/>
        <div className="eyebrow" style={{ marginTop: 20, marginBottom: 8 }}>SNS・Web</div>
        <KVList rows={Object.keys(LINK_LABELS).map((k) => ({
          k: LINK_LABELS[k],
          v: m[k] ? <a href={m[k]} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", wordBreak: "break-all" }}>{m[k]}</a> : null,
        }))}/>
        <div className="eyebrow" style={{ marginTop: 20, marginBottom: 8 }}>メッセージ</div>
        <KVList rows={[{ k: "自己紹介", v: m.selfIntroduction }]}/>
        <div className="eyebrow" style={{ marginTop: 20, marginBottom: 8 }}>同意</div>
        <KVList rows={[
          { k: "ホームページ掲載", v: m.publicConsent },
          { k: "勧誘ルール・免責事項", v: m.ruleConsent },
        ]}/>
      </div>

      {/* Danger zone */}
      <div className="card card-pad-lg" style={{ borderColor: "color-mix(in oklch, var(--danger) 18%, var(--border))" }}>
        <div className="eyebrow" style={{ color: "var(--danger)" }}>DANGER ZONE</div>
        <h2 className="h-section" style={{ marginTop: 8 }}>公開の停止・退会</h2>
        <p className="body" style={{ marginTop: 10 }}>
          公開を停止するとメンバー一覧から非表示になります。退会すると回答データは管理者により論理削除されます。
        </p>
        <div className="btn-row" style={{ marginTop: 16 }}>
          <Button variant="soft" icon="eyeOff">公開を停止する</Button>
          <Button variant="danger" icon="trash">退会申請を送る</Button>
        </div>
      </div>

      <Modal open={showRevalidate} onClose={() => setShowRevalidate(false)}>
        <div className="modal-body">
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--accent-soft)", color: "var(--accent-ink)", display: "grid", placeItems: "center", marginBottom: 14 }}>
            <Icon name="refresh" size={22}/>
          </div>
          <h3 className="h-section">情報を最新化しますか？</h3>
          <p className="body" style={{ marginTop: 10 }}>
            情報の更新は、Googleフォームから再回答する形で行います。新しい回答があった場合、古い回答はアーカイブされ、自動的に新しい回答に置き換わります。
          </p>
          <div className="card-flat" style={{ padding: 12, marginTop: 14 }}>
            <div className="small" style={{ color: "var(--text-2)", display: "flex", alignItems: "flex-start", gap: 8 }}>
              <Icon name="info" size={13} style={{ marginTop: 2, flexShrink: 0 }}/>
              <div>フォームの設問が変更されている場合、過去の回答内容は項目ごとに引き継がれます（stableKey による紐付け）。</div>
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <Button variant="ghost" onClick={() => setShowRevalidate(false)}>キャンセル</Button>
          <Button variant="primary" icon="external" onClick={() => { setShowRevalidate(false); nav("member-form"); }}>フォームを開く</Button>
        </div>
      </Modal>
    </div>
  );
};

Object.assign(window, { LoginPage, MemberFormPage, MyProfilePage });
