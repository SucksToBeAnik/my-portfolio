import { AtIcon } from "@phosphor-icons/react/dist/ssr";

export default function UserEmail({ email }: { email?: string | null }) {
  return (
    <div className="flex items-center gap-1 text-fg/40">
      <AtIcon weight="thin" className="w-3.5 h-3.5 shrink-0" />
      <p className="text-[11px] truncate">{email || "Unknown User"}</p>
    </div>
  );
}
