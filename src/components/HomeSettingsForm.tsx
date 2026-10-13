"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { updateHomeSettings } from "@/actions/site-config";
import { ACADEMIC_PROFILES, INTRO_KEYS } from "@/lib/home-settings";
import { FALLBACK_MODE, MODE_PARAM, MODES } from "@/lib/mode";

const inputCls =
  "w-full px-3 py-1.5 text-xs bg-hover-bg border border-hairline rounded-lg text-fg placeholder-fg/30 focus:outline-none focus:border-fg/30 transition-colors";
const cardCls = "border border-hairline rounded-xl p-4 space-y-3";
const labelCls = "text-xs text-fg/50 block";
const hintCls = "text-[11px] text-fg/40";

function ShareLinks() {
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  return (
    <div className="space-y-1">
      {MODES.map((mode) => {
        const url = `${origin}/?${MODE_PARAM}=${mode}`;
        return (
          <button
            key={mode}
            type="button"
            onClick={() =>
              navigator.clipboard.writeText(url).then(() => toast.success("Link copied"))
            }
            className="block w-full truncate rounded-lg bg-hover-bg px-3 py-1.5 text-left font-mono text-[11px] text-fg/70 hover:text-fg cursor-pointer"
          >
            {url}
          </button>
        );
      })}
    </div>
  );
}

export function HomeSettingsForm({ values }: { values: Record<string, string> }) {
  const [state, action, pending] = useActionState(
    (_prev: unknown, formData: FormData) => updateHomeSettings(formData),
    null,
  );

  useEffect(() => {
    if (!state) return;
    if (state.ok) toast.success("Saved");
    else toast.error(state.error);
  }, [state]);

  const v = (key: string) => values[key] ?? "";

  return (
    <form action={action} className="space-y-4">
      <section className={cardCls}>
        <label className={labelCls}>Default home page</label>
        <div className="flex gap-2">
          {MODES.map((mode) => (
            <label
              key={mode}
              className="flex items-center gap-2 rounded-lg border border-hairline px-3 py-1.5 text-xs capitalize cursor-pointer has-[:checked]:bg-fg has-[:checked]:text-bg"
            >
              <input
                type="radio"
                name="default_mode"
                value={mode}
                defaultChecked={(v("default_mode") || FALLBACK_MODE) === mode}
                className="sr-only"
              />
              {mode}
            </label>
          ))}
        </div>
        <p className={hintCls}>
          What visitors see unless they arrive through a mode link. A mode link is remembered for 30
          days. Click one to copy it:
        </p>
        <ShareLinks />
      </section>

      <section className={cardCls}>
        {MODES.map((mode) => (
          <div key={mode} className="space-y-1.5">
            <label className={`${labelCls} capitalize`}>{mode} intro</label>
            <textarea
              name={INTRO_KEYS[mode]}
              defaultValue={v(INTRO_KEYS[mode])}
              placeholder="Leave empty to use the built-in intro"
              className={`${inputCls} resize-none h-24`}
            />
          </div>
        ))}
        <p className={hintCls}>
          Markdown: <code>[text](url)</code> for links, <code>**bold**</code>, blank line between
          paragraphs.
        </p>
      </section>

      <section className={cardCls}>
        <label className={labelCls}>Research interests (academia only)</label>
        <textarea
          name="research_interests"
          defaultValue={v("research_interests")}
          placeholder={"Multi-agent systems\nLLM evaluation"}
          className={`${inputCls} resize-none h-24`}
        />
        <p className={hintCls}>One per line.</p>
      </section>

      <section className={cardCls}>
        <label className={labelCls}>Academic profiles (shown in both modes)</label>
        {ACADEMIC_PROFILES.map((p) => (
          <input
            key={p.key}
            name={p.key}
            defaultValue={v(p.key)}
            placeholder={`${p.label} URL`}
            className={inputCls}
          />
        ))}
        <p className={hintCls}>Only filled-in profiles appear.</p>
      </section>

      <button
        type="submit"
        disabled={pending}
        className="px-3 py-1.5 text-xs font-medium bg-fg text-bg rounded-lg hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
