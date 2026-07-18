"use client";

import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { DotsSixVertical, EnvelopeSimple, PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  deleteMicroblog,
  getMicroblogs,
  notifySubscribers,
  reorderMicroblogs,
} from "@/actions/microblogs";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Spinner } from "@/components/Spinner";

interface Item {
  id: number;
  title: string;
  content: string;
  microview: string | null;
  tags: string | null;
  published: boolean | null;
  publishedAt: Date | null;
  updatedAt: Date | null;
}

export default function MicroblogsPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [notifyId, setNotifyId] = useState<number | null>(null);

  const notifyMut = useMutation({
    mutationFn: (id: number) => notifySubscribers(id),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Email sent to subscribers");
      } else if (res.reason === "not-configured") {
        toast.error("Buttondown API key not set");
      } else {
        toast.error("Failed to send email");
      }
    },
    onError: () => toast.error("Failed to send email"),
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["microblogs"],
    queryFn: getMicroblogs,
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteMicroblog(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["microblogs"] });
      const prev = qc.getQueryData<Item[]>(["microblogs"]);
      qc.setQueryData<Item[]>(["microblogs"], (old) => old?.filter((item) => item.id !== id));
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["microblogs"], ctx.prev);
      toast.error("Failed to delete");
    },
    onSuccess: () => toast.success("Post deleted"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["microblogs"] }),
  });

  const reorderMut = useMutation({
    mutationFn: (items: { id: number; sortOrder: number }[]) => reorderMicroblogs(items),
    onError: () => toast.error("Failed to reorder"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["microblogs"] }),
  });

  function handleDragEnd(result: any) {
    if (!result.destination) return;
    const reordered = Array.from(items);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    qc.setQueryData<Item[]>(["microblogs"], reordered);
    const updates = reordered.map((item, i) => ({ id: item.id, sortOrder: i }));
    reorderMut.mutate(updates);
  }

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 -mx-4 md:-mx-6 px-4 md:px-6 pt-5 md:pt-2 pb-3 bg-bg/70 backdrop-blur-md flex items-center justify-between">
        <h1 className="text-lg font-heading">Microblogs</h1>
        <button
          onClick={() => router.push("/admin/microblogs/new")}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-fg text-bg border border-hairline cursor-pointer hover:opacity-90 transition-all"
        >
          <Plus weight="bold" className="w-4 h-4" />
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="microblogs">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1">
              {items.map((item, index) => (
                <Draggable key={item.id} draggableId={String(item.id)} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`flex items-center px-4 py-3 border rounded-xl transition-colors ${snapshot.isDragging ? "border-hairline bg-hover-bg shadow-lg" : "border-hairline hover:bg-hover-bg"}`}
                    >
                      <div
                        {...provided.dragHandleProps}
                        className="mr-3 flex items-center shrink-0 p-2 -ml-2 rounded-lg hover:bg-hover-bg transition-colors cursor-grab active:cursor-grabbing"
                      >
                        <DotsSixVertical weight="thin" className="w-4 h-4 text-fg/50" />
                      </div>
                      <button
                        type="button"
                        onClick={() => router.push(`/admin/microblogs/${item.id}/edit`)}
                        className="min-w-0 flex-1 text-left cursor-pointer"
                      >
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-fg/50">
                          {item.published ? "Published" : "Draft"}
                        </p>
                        {item.updatedAt && (
                          <p className="text-[11px] text-fg/40 mt-0.5">
                            edited{" "}
                            {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}
                          </p>
                        )}
                      </button>
                      <div className="flex gap-1.5 shrink-0 ml-3">
                        {item.published && (
                          <button
                            onClick={() => setNotifyId(item.id)}
                            title="Email subscribers about this post"
                            className="p-2.5 text-fg/60 hover:text-fg hover:bg-hover-bg rounded-lg transition-all"
                          >
                            <EnvelopeSimple weight="thin" className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => router.push(`/admin/microblogs/${item.id}/edit`)}
                          className="p-2.5 text-fg/60 hover:text-fg hover:bg-hover-bg rounded-lg transition-all"
                        >
                          <PencilSimple weight="thin" className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmId(item.id)}
                          className="p-2.5 text-red-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          <Trash weight="thin" className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {items.length === 0 && <p className="text-xs text-fg/50 text-center py-8">No posts yet.</p>}

      <ConfirmModal
        open={confirmId !== null}
        title="Delete post"
        message="Are you sure you want to delete this post?"
        confirmLabel="Delete"
        onConfirm={() => {
          if (confirmId !== null) deleteMut.mutate(confirmId);
          setConfirmId(null);
        }}
        onCancel={() => setConfirmId(null)}
      />

      <ConfirmModal
        open={notifyId !== null}
        title="Email subscribers"
        message="Send this post to all your Buttondown subscribers now? This can't be undone."
        confirmLabel="Send email"
        onConfirm={() => {
          if (notifyId !== null) notifyMut.mutate(notifyId);
          setNotifyId(null);
        }}
        onCancel={() => setNotifyId(null)}
      />
    </div>
  );
}
