import { setVisitorEmails } from "@/actions/visitors";

/** Switch for the per-visitor email; a plain form, so it works without JS. */
export function VisitorEmailToggle({ enabled }: { enabled: boolean }) {
  return (
    <form
      action={setVisitorEmails}
      className="flex items-center justify-between gap-4 border border-hairline rounded-xl px-4 py-3"
    >
      <div>
        <p className="text-xs">Email me about new visitors</p>
        <p className="text-[10px] text-fg/50">One email per person per day</p>
      </div>
      <input type="hidden" name="enabled" value={enabled ? "off" : "on"} />
      <button
        type="submit"
        aria-pressed={enabled}
        className={`px-3 py-1 text-xs rounded-full border border-hairline transition-colors cursor-pointer ${
          enabled ? "bg-fg text-bg" : "text-fg/60 hover:bg-hover-bg"
        }`}
      >
        {enabled ? "On" : "Off"}
      </button>
    </form>
  );
}
