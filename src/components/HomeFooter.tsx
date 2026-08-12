"use client";

import {
  CalendarDots,
  Check,
  Clock,
  LinkedinLogo,
  PaperPlaneTilt,
  XLogo,
} from "@phosphor-icons/react";
import Image from "next/image";
import { type FormEvent, useEffect, useState, useTransition } from "react";
import { sendContactMessage } from "@/actions/contact";

const CAL_URL = "https://cal.com/jami-islam-anik-yhkdkd";
const X_URL = "https://x.com/suckstobeanik";
const LINKEDIN_URL = "https://www.linkedin.com/in/al-jami-islam-anik-485758285";

/** Where I am, so the clock reads as *my* time, not the visitor's. */
const TIME_ZONE = "Asia/Dhaka";
const TIME_ZONE_LABEL = "GMT+6";

/** Placeholder sign-off. */
const QUOTE_LEAD = "Ending on a note I try to live by";
const QUOTE = "Simplicity is the ultimate sophistication.";

const CONTACTS = [
  { label: "Book a meeting", href: CAL_URL, icon: CalendarDots },
  { label: "Message on X", href: X_URL, icon: XLogo },
  { label: "Connect on LinkedIn", href: LINKEDIN_URL, icon: LinkedinLogo },
];

/* Bubbles are tinted off the foreground rather than filled with it: at full
   strength the inversion shouts louder than anything else on the page. The
   narrow cap keeps the contact rows from stretching into wide slabs. */
const BUBBLE = "max-w-[19rem] rounded-2xl px-4 py-2.5 text-sm leading-relaxed";
const THEIRS = `${BUBBLE} bg-fg/[0.13] text-fg/90`;
const MINE = `${BUBBLE} bg-fg/[0.05] text-fg/80`;
/* Fields recede into the reply bubble as dark/light wells. Their inset depth,
   not a stroke, separates them from the surrounding message. */
const FIELD =
  "w-full rounded-xl bg-bg/80 px-3 py-2 text-[13px] text-fg shadow-inner placeholder:text-fg/45 transition-[background-color,box-shadow] focus:bg-bg focus:outline-none focus:ring-2 focus:ring-fg/15";
/* Actions float above those wells with a denser translucent tint. They stay
   softer than a full foreground fill and distinct from the visitor bubble. */
const ROW =
  "flex items-center justify-center gap-2 rounded-xl bg-contact-action px-3 py-2 text-[13px] text-contact-action-text shadow-sm transition-[background-color,color,transform] hover:-translate-y-px hover:bg-contact-action-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/20";
const PRIMARY =
  "flex items-center justify-center gap-2 rounded-xl bg-contact-action-primary px-3 py-2 text-[13px] font-medium text-contact-action-text shadow-sm transition-[background-color,transform] hover:-translate-y-px hover:bg-contact-action-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/20";

function Them({ children, tail }: { children: string; tail?: boolean }) {
  return (
    <div className="flex justify-end">
      <p className={`${THEIRS} ${tail ? "rounded-br-md" : ""}`}>{children}</p>
    </div>
  );
}

function Me({ children, tail }: { children: React.ReactNode; tail?: boolean }) {
  return (
    <div className="flex justify-start">
      <div className={`${MINE} ${tail ? "rounded-bl-md" : ""}`}>{children}</div>
    </div>
  );
}

/** The email form, living inside the bubble that offers it. */
function ContactForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [note, setNote] = useState<{ text: string; ok: boolean } | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!sent) return;
    const id = setTimeout(() => setSent(false), 1500);
    return () => clearTimeout(id);
  }, [sent]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setNote(null);
    setSent(false);
    startTransition(async () => {
      const res = await sendContactMessage({ email, message });
      switch (res.status) {
        case "sent":
          setNote({ text: "Sent. I will get back to you.", ok: true });
          setSent(true);
          setEmail("");
          setMessage("");
          break;
        case "invalid":
          setNote({ text: "Check the address and the message.", ok: false });
          break;
        case "unconfigured":
          setNote({ text: "The form is offline. Try one of the links below.", ok: false });
          break;
        default:
          setNote({ text: "That did not go through. Try again later.", ok: false });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 flex flex-col gap-1.5">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        aria-label="Your email"
        className={FIELD}
      />
      <textarea
        required
        rows={3}
        maxLength={2000}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Your message"
        aria-label="Your message"
        className={`${FIELD} resize-none`}
      />
      <button
        type="submit"
        disabled={pending || sent}
        className={`${PRIMARY} cursor-pointer disabled:cursor-wait disabled:opacity-50`}
      >
        {sent ? (
          <Check weight="bold" className="h-4 w-4 shrink-0" />
        ) : (
          <PaperPlaneTilt weight="regular" className="h-4 w-4 shrink-0" />
        )}
        {pending ? "Sending" : sent ? "Sent" : "Send"}
      </button>
      {note && (
        <p
          className={`px-1 pt-0.5 text-[11px] ${note.ok ? "text-center text-fg/60" : "text-fg/45"}`}
        >
          {note.text}
        </p>
      )}
    </form>
  );
}

/** The thread's last word: an empty input that opens the real Ask chat. */
function AskField() {
  const openChat = () => window.dispatchEvent(new CustomEvent("openchat"));

  return (
    <button
      type="button"
      onClick={openChat}
      aria-label="Ask me anything"
      className="group mt-3 flex w-full cursor-pointer items-center gap-2 rounded-xl bg-bg/80 px-3 py-2 text-left shadow-inner transition-[background-color,box-shadow] hover:bg-bg focus-visible:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/15"
    >
      <span className="flex-1 text-[13px] text-fg/45 transition-colors group-hover:text-fg/75">
        Ask me anything...
      </span>
      <PaperPlaneTilt
        weight="regular"
        className="h-3.5 w-3.5 shrink-0 text-fg/45 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-fg/75"
      />
    </button>
  );
}

/** Live clock in my timezone, seconds included. Null until mount: the homepage
 *  is cached until an admin write, so a baked-in time would be arbitrarily old. */
function LocalTime() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const format = () =>
      setTime(
        new Intl.DateTimeFormat("en-GB", {
          timeZone: TIME_ZONE,
          // 24-hour: the trailing "AM"/"PM" is three characters the byline row
          // can't spare on a phone.
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }).format(new Date()),
      );
    format();
    const id = setInterval(format, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <p className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[11px] tracking-normal text-fg/50 sm:gap-2 sm:text-xs sm:tracking-wider">
      <Clock weight="regular" className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
      {/* min-height holds the row while the clock is still null on first paint. */}
      <span className="min-h-[1em] tabular-nums">{time && `${time} ${TIME_ZONE_LABEL}`}</span>
    </p>
  );
}

/**
 * Closes the homepage as a short exchange: how to reach me, where else to find
 * me, and an empty field that opens the Ask chat for anything past that.
 *
 * Deliberately no hairline rules between the groups. Spacing separates them.
 */
export function HomeFooter() {
  return (
    <footer className="flex flex-col gap-14">
      <section className="flex flex-col gap-1.5">
        <Them tail>so, how do I reach you?</Them>

        <Me tail>
          <p>well, email is the most reliable. send it from here and it lands in my inbox.</p>
          <ContactForm />
        </Me>

        <Them tail>bruh, email is so oldschool. how else do I reach you?</Them>

        <Me tail>
          <p>fair. any of these work just as well.</p>
          <div className="mt-3 flex flex-col gap-1.5">
            {CONTACTS.map((contact) => (
              <a
                key={contact.href}
                href={contact.href}
                target="_blank"
                rel="noopener noreferrer"
                className={ROW}
              >
                <contact.icon weight="regular" className="h-4 w-4 shrink-0" />
                {contact.label}
              </a>
            ))}
          </div>
        </Me>

        <Them tail>and if I have more questions?</Them>

        <Me tail>
          <p>ask here. do let me know if the ai leaks any social credits.</p>
          <AskField />
        </Me>
      </section>

      {/* Sign-off: the quote is introduced rather than dropped in cold, then a
          byline row carries the name and the clock to opposite edges. */}
      <div className="flex flex-col gap-12">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-fg/45">{QUOTE_LEAD}</p>
          {/* Handwriting, so the line reads as written by someone rather than
              set by a typesetter. Caveat runs small, hence the size bump. */}
          <p className="max-w-md font-hand text-3xl leading-snug text-fg/90 sm:text-4xl">
            &ldquo;{QUOTE}&rdquo;
          </p>
        </div>

        {/* One row at every width: no wrapping, so the tracking and both type
            sizes tighten on phones instead of the clock dropping to its own line. */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <Image
              src="/profile.jpeg"
              alt="Al Jami Islam Anik"
              width={36}
              height={36}
              className="h-8 w-8 shrink-0 rounded-xl object-cover sm:h-9 sm:w-9"
            />
            {/* Phones get the short name so the row never wraps or truncates. */}
            <span className="text-[11px] uppercase tracking-[0.1em] text-fg/50 sm:text-xs sm:tracking-[0.16em]">
              <span className="sm:hidden">Anik</span>
              <span className="hidden sm:inline">Al Jami Islam Anik</span>
            </span>
          </div>
          <LocalTime />
        </div>
      </div>
    </footer>
  );
}
