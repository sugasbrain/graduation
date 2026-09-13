import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  GraduationCap,
  Heart,
  LoaderCircle,
  LockKeyhole,
  MapPin,
  PartyPopper,
  Sparkles,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { getAdminRsvps, submitRsvp } from "@/lib/rsvp.functions";
import portrait from "@/assets/mercia-formatura.png.asset.json";
import partyMemoji from "@/assets/mercia-memoji-festa.png.asset.json";
import smileMemoji from "@/assets/mercia-memoji-sorriso.png.asset.json";
import heartsMemoji from "@/assets/mercia-memoji-coracoes.png.asset.json";
import peaceMemoji from "@/assets/mercia-memoji-paz.png.asset.json";
import discobolus from "@/assets/discobolus.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Formatura de Mércia Melo | Educação Física" },
      { name: "description", content: "Convite para celebrar a formatura de Mércia Melo em Educação Física." },
      { property: "og:title", content: "Formatura de Mércia Melo" },
      { property: "og:description", content: "Uma conquista construída com força, propósito e coração." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GraduationInvitation,
});

type AdminGuest = {
  id: string;
  guest_name: string;
  phone: string | null;
  message: string | null;
  party_size: number;
  created_at: string;
};

function GraduationInvitation() {
  const sendRsvp = useServerFn(submitRsvp);
  const loadAdminRsvps = useServerFn(getAdminRsvps);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const [guests, setGuests] = useState<AdminGuest[] | null>(null);
  const [totalPeople, setTotalPeople] = useState(0);

  async function handleRsvp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setFormError("");
    const form = new FormData(event.currentTarget);
    try {
      await sendRsvp({
        data: {
          guestName: String(form.get("guestName") ?? ""),
          phone: String(form.get("phone") ?? ""),
          message: String(form.get("message") ?? ""),
          partySize: Number(form.get("partySize") ?? 1),
        },
      });
      event.currentTarget.reset();
      setSent(true);
    } catch {
      setFormError("Não conseguimos registrar agora. Tente novamente em instantes.");
    } finally {
      setSending(false);
    }
  }

  async function handleAdminLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAdminLoading(true);
    setAdminError("");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setAdminError("E-mail ou senha inválidos.");
      setAdminLoading(false);
      return;
    }
    try {
      const result = await loadAdminRsvps();
      setGuests(result.guests);
      setTotalPeople(result.totalPeople);
    } catch {
      setAdminError("Esta conta não tem acesso à lista.");
      await supabase.auth.signOut();
    } finally {
      setAdminLoading(false);
    }
  }

  return (
    <main className="invitation-shell">
      <div className="ambient-lines" aria-hidden="true" />
      <div className="phone-frame">
        <div className="phone-screen">
          <div className="dynamic-island" aria-hidden="true" />

          <header className="intro-section">
            <div className="intro-topline">
              <span>MM · 2026</span>
              <span className="intro-spark"><Sparkles /> Uma conquista</span>
            </div>
            <div className="portrait-wrap">
              <div className="portrait-border">
                <img src={portrait.url} alt="Mércia Melo em sua formatura" className="portrait" width={1023} height={1537} />
              </div>
              <img src={heartsMemoji.url} alt="" className="sticker sticker-hearts" width={1502} height={1600} />
              <div className="course-seal"><GraduationCap /><span>Educação<br />Física</span></div>
            </div>
            <p className="eyebrow">Bacharela em Educação Física</p>
            <h1>Mércia<br /><em>Melo</em></h1>
            <p className="intro-copy">Uma conquista construída com força, propósito e coração. Agora é hora de celebrar cada passo dessa jornada.</p>
            <a href="#celebrar" className="scroll-cue" aria-label="Ver convite completo"><ChevronDown /></a>
          </header>

          <section id="celebrar" className="story-section">
            <img src={smileMemoji.url} alt="" className="sticker sticker-smile" loading="lazy" width={489} height={440} />
            <div className="symbol-orbit"><img src={discobolus} alt="Símbolo do Discóbolo" loading="lazy" width={768} height={768} /></div>
            <p className="eyebrow">O grande dia</p>
            <h2>Movimento que<br />virou <em>conquista.</em></h2>
            <p>Entre desafios, aprendizados e muitos sonhos, chegou o momento de brindar uma nova fase. Sua presença fará esta celebração ainda mais especial.</p>
          </section>

          <section className="events-section" aria-labelledby="eventos-title">
            <div className="section-heading">
              <p className="eyebrow">Reserve este momento</p>
              <h2 id="eventos-title">Celebre comigo</h2>
            </div>
            <EventCard icon={<GraduationCap />} number="01" title="Colação de grau" />
            <EventCard icon={<PartyPopper />} number="02" title="Festa de formatura" />
            <p className="pending-note"><Clock3 /> Datas e endereços serão anunciados em breve.</p>
          </section>

          <section className="rsvp-section" aria-labelledby="rsvp-title">
            <img src={peaceMemoji.url} alt="" className="sticker sticker-peace" loading="lazy" width={1300} height={1600} />
            <p className="eyebrow">Você faz parte disso</p>
            <h2 id="rsvp-title">Confirme sua<br /><em>presença</em></h2>
            <p className="rsvp-lead">Conte para a Mércia que você estará lá para esse abraço.</p>

            {sent ? (
              <div className="success-state" role="status">
                <span><Check /></span>
                <h3>Presença confirmada!</h3>
                <p>Que alegria ter você nessa celebração.</p>
                <Button type="button" variant="ghost" onClick={() => setSent(false)}>Enviar outra confirmação</Button>
              </div>
            ) : (
              <form className="rsvp-form" onSubmit={handleRsvp}>
                <div className="field-group">
                  <Label htmlFor="guestName">Seu nome</Label>
                  <Input id="guestName" name="guestName" required minLength={2} maxLength={100} placeholder="Como devemos chamar você?" />
                </div>
                <div className="field-row">
                  <div className="field-group">
                    <Label htmlFor="phone">Telefone <span>(opcional)</span></Label>
                    <Input id="phone" name="phone" type="tel" maxLength={30} placeholder="(00) 00000-0000" />
                  </div>
                  <div className="field-group field-small">
                    <Label htmlFor="partySize">Pessoas</Label>
                    <Input id="partySize" name="partySize" type="number" min={1} max={10} defaultValue={1} />
                  </div>
                </div>
                <div className="field-group">
                  <Label htmlFor="message">Mensagem de carinho <span>(opcional)</span></Label>
                  <Textarea id="message" name="message" maxLength={500} rows={4} placeholder="Deixe algumas palavras para a formanda..." />
                </div>
                {formError && <p className="form-error" role="alert">{formError}</p>}
                <Button className="rsvp-button" type="submit" disabled={sending}>
                  {sending ? <LoaderCircle className="spin" /> : <Heart />}
                  {sending ? "Confirmando..." : "Confirmar presença"}
                </Button>
              </form>
            )}
          </section>

          <footer className="invite-footer">
            <img src={partyMemoji.url} alt="" className="sticker sticker-party" loading="lazy" width={1160} height={1600} />
            <span className="footer-monogram">MM</span>
            <p>Com carinho, Mércia.</p>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="admin-trigger"><LockKeyhole /> Área da anfitriã</Button>
              </DialogTrigger>
              <DialogContent className="admin-dialog">
                <DialogHeader>
                  <DialogTitle>Lista de confirmados</DialogTitle>
                  <DialogDescription>Acesso reservado à organização do evento.</DialogDescription>
                </DialogHeader>
                {guests ? (
                  <div className="guest-panel">
                    <div className="guest-total"><Users /><strong>{totalPeople}</strong><span>presenças confirmadas</span></div>
                    <div className="guest-list">
                      {guests.length === 0 ? <p>Nenhuma confirmação ainda.</p> : guests.map((guest) => (
                        <article key={guest.id}>
                          <div><strong>{guest.guest_name}</strong><span>{guest.party_size} {guest.party_size === 1 ? "pessoa" : "pessoas"}</span></div>
                          {guest.phone && <p>{guest.phone}</p>}
                          {guest.message && <blockquote>“{guest.message}”</blockquote>}
                        </article>
                      ))}
                    </div>
                  </div>
                ) : (
                  <form className="admin-form" onSubmit={handleAdminLogin}>
                    <Label htmlFor="admin-email">E-mail</Label>
                    <Input id="admin-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
                    <Label htmlFor="admin-password">Senha</Label>
                    <Input id="admin-password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} />
                    {adminError && <p className="form-error" role="alert">{adminError}</p>}
                    <Button type="submit" disabled={adminLoading}>{adminLoading ? <LoaderCircle className="spin" /> : <LockKeyhole />} Entrar</Button>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </footer>
        </div>
      </div>
    </main>
  );
}

function EventCard({ icon, number, title }: { icon: React.ReactNode; number: string; title: string }) {
  return (
    <article className="event-card">
      <div className="event-number">{number}</div>
      <div className="event-icon">{icon}</div>
      <div className="event-content">
        <h3>{title}</h3>
        <p><CalendarDays /> Data a confirmar</p>
        <p><Clock3 /> Horário a confirmar</p>
        <p><MapPin /> Local a confirmar</p>
      </div>
      <div className="event-actions" aria-label={`Ações para ${title}`}>
        <Button disabled variant="outline" size="sm"><MapPin /> Maps</Button>
        <Button disabled variant="outline" size="sm"><CalendarDays /> Agenda</Button>
      </div>
    </article>
  );
}