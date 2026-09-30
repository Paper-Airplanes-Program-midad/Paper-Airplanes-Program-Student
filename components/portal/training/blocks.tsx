"use client";

import { BookOpen, Check, ExternalLink, Mail, PenLine, PlayCircle } from "lucide-react";
import { useRef, useState } from "react";

import { Button, Checkbox, Input, cn } from "@/components/ui";
import { StatusPill } from "@/components/portal/kit";
import { useI18n } from "@/lib/i18n";
import type { Signature } from "@/lib/progress";
import { formatDate } from "@/lib/time";
import type {
  AgreementBlock as Agreement,
  CardsBlock as Cards,
  Contact,
  LinksBlock as Links,
  ReadBlock as Reading,
  WatchBlock as Watch,
} from "@/lib/training";

type StepItem = { text: string; sub?: string[] };

export function Prose({ body }: { body: string }) {
  return (
    <p className="text-[14px] leading-[1.85] text-pretty text-fg-muted">{body}</p>
  );
}

export function Steps({
  items,
  ordered,
  title,
}: {
  items: StepItem[];
  ordered?: boolean;
  title?: string;
}) {
  return (
    <div>
      {title && <p className="mb-3 text-[13.5px] font-extrabold text-fg">{title}</p>}
      <ol className="flex flex-col gap-3">
        {items.map((item, index) => (
          <li key={index} className="flex gap-3">
            <span
              aria-hidden
              className={cn(
                "mt-0.5 grid shrink-0 place-items-center rounded-full text-[11px] font-extrabold",
                ordered
                  ? "h-5 w-5 border border-line bg-tint text-fg-muted tabular-nums"
                  : "h-1.5 w-1.5 translate-y-2 bg-dawn-400",
              )}
            >
              {ordered ? index + 1 : null}
            </span>
            <div className="min-w-0">
              <p className="text-[14px] leading-relaxed text-fg">{item.text}</p>
              {item.sub && (
                <ul className="mt-1.5 flex flex-col gap-1.5">
                  {item.sub.map((line, subIndex) => (
                    <li
                      key={subIndex}
                      className="flex gap-2.5 text-[13px] leading-relaxed text-fg-muted"
                    >
                      <span
                        aria-hidden
                        className="mt-2 h-1 w-1 shrink-0 rounded-full bg-fg-faint"
                      />
                      {line}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Note({ title, body }: { title?: string; body: string }) {
  return (
    <div
      className="rounded-2xl border p-4"
      style={{
        background: "color-mix(in oklab, var(--color-dawn-500) 9%, transparent)",
        borderColor: "color-mix(in oklab, var(--color-dawn-500) 26%, transparent)",
      }}
    >
      {title && <p className="text-[13px] font-extrabold text-fg">{title}</p>}
      <p className={cn("text-[13.5px] leading-relaxed text-fg-muted", title && "mt-1")}>
        {body}
      </p>
    </div>
  );
}

export function Contacts({ items }: { items: Contact[] }) {
  const { t } = useI18n();
  return (
    <ul className="flex flex-col gap-3">
      {items.map((contact) => (
        <li key={contact.email + t(contact.role)} className="row p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-line bg-tint text-accent-cool">
              <Mail className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-extrabold text-fg">{t(contact.role)}</p>
              {contact.note && (
                <p className="mt-1 text-[12.5px] leading-relaxed text-fg-muted">
                  {t(contact.note)}
                </p>
              )}
              <p className="mt-1.5 text-[13px]">
                {contact.name && (
                  <span className="font-semibold text-fg">{contact.name} · </span>
                )}
                <a
                  href={`mailto:${contact.email}`}
                  dir="ltr"
                  className="font-semibold text-accent-cool underline decoration-accent-cool/40 underline-offset-4 hover:decoration-accent-cool"
                >
                  {contact.email}
                </a>
              </p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function AgreementBlock({
  block,
  signature,
  onSign,
}: {
  block: Agreement;
  signature?: Signature;
  onSign: (name: string) => void;
}) {
  const { t, locale } = useI18n();
  const [agreed, setAgreed] = useState(false);
  const [name, setName] = useState("");

  const trimmed = name.trim();
  const signed = !!signature;

  return (
    <TaskCard
      icon={<PenLine className="h-5 w-5" />}
      title={t(block.title)}
      note={block.note ? t(block.note) : undefined}
      meta={t("training.signonce")}
      done={signed}
      footer={
        signed ? (
          <p className="text-[12.5px] text-fg-subtle">
            {t("training.signedby")}{" "}
            <span dir="ltr" className="font-extrabold text-fg">
              {signature.name}
            </span>
            {" · "}
            {formatDate(signature.at, locale)}
          </p>
        ) : (
          <>
            <Button
              size="sm"
              disabled={!agreed || !trimmed}
              onClick={() => onSign(trimmed)}
            >
              {t("training.sign")}
            </Button>
            <span className="text-[12px] text-fg-subtle">{t("training.signhint")}</span>
          </>
        )
      }
    >
      <p className="mt-4 rounded-2xl border border-line bg-card p-4 text-[13.5px] leading-relaxed text-fg">
        {t(block.statement)}
      </p>

      {!signed && (
        <div className="mt-4 flex flex-col gap-3">
          <label className="flex cursor-pointer items-start gap-3 text-[13.5px] leading-relaxed font-semibold text-fg">
            <Checkbox
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
            />
            <span className="min-w-0">{t("training.signagree")}</span>
          </label>
          <div>
            <label
              htmlFor={`sign-${block.id}`}
              className="text-[12.5px] font-semibold text-fg-muted"
            >
              {t("training.signname")}
            </label>
            <Input
              id={`sign-${block.id}`}
              className="mt-1.5"
              dir="ltr"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
        </div>
      )}
    </TaskCard>
  );
}

function TaskCard({
  icon,
  title,
  note,
  meta,
  optional,
  done,
  children,
  footer,
}: {
  icon: React.ReactNode;
  title: string;
  note?: string;
  meta?: string;
  optional?: boolean;
  done: boolean;
  children?: React.ReactNode;
  footer: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl border p-5 transition-colors",
        done ? "border-transparent bg-tint-2" : "border-line bg-tint",
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-2xl border",
              done
                ? "border-transparent bg-gradient-to-br from-mint-500 to-mint-400 text-ink-950"
                : "border-line bg-card text-accent-cool",
            )}
          >
            {done ? <Check className="h-5 w-5" /> : icon}
          </span>
          <div className="min-w-0">
            <h4 className="text-[14px] font-extrabold text-fg">{title}</h4>
            {note && <p className="mt-1 text-[12.5px] text-fg-muted">{note}</p>}
            {meta && <p className="mt-1 text-[11.5px] text-fg-faint">{meta}</p>}
          </div>
        </div>
        {optional && <StatusPill tone="neutral">{t("training.optional")}</StatusPill>}
      </header>

      {children}

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
        {footer}
      </div>
    </section>
  );
}

export function ReadBlock({
  block,
  done,
  onDone,
}: {
  block: Reading;
  done: boolean;
  onDone: (next: boolean) => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <TaskCard
      icon={<BookOpen className="h-5 w-5" />}
      title={t(block.title)}
      note={block.note ? t(block.note) : undefined}
      meta={`PDF · ${block.pages} ${t("training.pages")}`}
      optional={block.optional}
      done={done}
      footer={
        <>
          <Button size="sm" variant="secondary" onClick={() => setOpen((v) => !v)}>
            {open ? t("training.hidedoc") : t("training.showdoc")}
          </Button>
          <a
            href={block.src}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-card px-3 text-[13px] font-semibold text-fg transition-colors hover:border-line-strong"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t("training.opendoc")}
          </a>
          <label className="ms-auto flex cursor-pointer items-center gap-2.5 text-[13px] font-semibold text-fg">
            <Checkbox checked={done} onChange={(event) => onDone(event.target.checked)} />
            {t("training.markread")}
          </label>
        </>
      }
    >
      {open && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-card">
          <iframe
            src={block.src}
            title={t(block.title)}
            className="h-[70vh] w-full"
          />
        </div>
      )}
    </TaskCard>
  );
}

export function WatchBlock({
  block,
  done,
  onDone,
}: {
  block: Watch;
  done: boolean;
  onDone: (next: boolean) => void;
}) {
  const { t } = useI18n();
  const ref = useRef<HTMLVideoElement>(null);

  if (!block.src) {
    return (
      <section className="rounded-3xl border border-dashed border-line bg-tint p-5 opacity-75">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-line bg-card text-fg-faint">
            <PlayCircle className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h4 className="text-[14px] font-extrabold text-fg-subtle">{t(block.title)}</h4>
            {block.note && (
              <p className="mt-1 text-[12.5px] text-fg-faint">{t(block.note)}</p>
            )}
          </div>
          <StatusPill tone="neutral" className="ms-auto">
            {t("training.novideo")}
          </StatusPill>
        </div>
      </section>
    );
  }

  const embed = embedUrl(block.src);

  return (
    <TaskCard
      icon={<PlayCircle className="h-5 w-5" />}
      title={t(block.title)}
      note={block.note ? t(block.note) : undefined}
      optional={block.optional}
      done={done}
      footer={
        <>
          {embed && (
            <a
              href={block.src}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-card px-3 text-[13px] font-semibold text-fg transition-colors hover:border-line-strong"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {t("training.opendoc")}
            </a>
          )}
          <label className="ms-auto flex cursor-pointer items-center gap-2.5 text-[13px] font-semibold text-fg">
            <Checkbox checked={done} onChange={(event) => onDone(event.target.checked)} />
            {t("training.markwatched")}
          </label>
        </>
      }
    >
      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-ink-950">
        {embed ? (
          <iframe
            src={embed}
            title={t(block.title)}
            loading="lazy"
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="aspect-video w-full"
          />
        ) : (
          <video
            ref={ref}
            src={block.src}
            controls
            preload="metadata"
            playsInline
            onEnded={() => onDone(true)}
            className="aspect-video w-full"
          />
        )}
      </div>
    </TaskCard>
  );
}

function embedUrl(src: string): string | null {
  const drive = src.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (drive) return `https://drive.google.com/file/d/${drive[1]}/preview`;

  const youtube = src.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|shorts\/|watch\?(?:.*&)?v=))([\w-]{11})/,
  );
  if (youtube) return `https://www.youtube-nocookie.com/embed/${youtube[1]}?rel=0`;

  return null;
}

export function LinksBlock({ block }: { block: Links }) {
  const { t } = useI18n();
  return (
    <div>
      {block.title && (
        <p className="mb-3 text-[13.5px] font-extrabold text-fg">{t(block.title)}</p>
      )}
      <ul className="flex flex-col gap-2">
        {block.items.map((item) => {
          const label = t(item.label);
          const inner = (
            <>
              <span className="min-w-0">
                <span className="block text-[13.5px] font-bold text-fg">{label}</span>
                {item.note && (
                  <span className="block text-[12px] text-fg-subtle">{t(item.note)}</span>
                )}
              </span>
              {item.href ? (
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-fg-faint" />
              ) : (
                <StatusPill tone="neutral">{t("training.nolink")}</StatusPill>
              )}
            </>
          );

          return (
            <li key={label}>
              {item.href ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="row flex items-center justify-between gap-3 p-3.5 transition-colors hover:border-line-strong"
                >
                  {inner}
                </a>
              ) : (
                <div className="row flex items-center justify-between gap-3 p-3.5 opacity-70">
                  {inner}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function CardsBlock({ block }: { block: Cards }) {
  const { t } = useI18n();
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {block.items.map((item) => {
        const accent = item.tone === "cool" ? "var(--accent-cool)" : "var(--accent)";
        return (
          <div key={t(item.title)} className="rounded-2xl border border-line bg-tint p-5">
            <p className="text-[13.5px] font-extrabold" style={{ color: accent }}>
              {t(item.title)}
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-fg-muted">{t(item.body)}</p>
          </div>
        );
      })}
    </div>
  );
}
