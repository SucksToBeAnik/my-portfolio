"use client";

import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { DotsSixVertical, PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { deleteProject, getProjects, reorderProjects } from "@/actions/projects";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Spinner } from "@/components/Spinner";

interface Project {
  id: number;
  title: string;
  featured: boolean | null;
  published: boolean | null;
  sortOrder: number | null;
  updatedAt: Date | null;
}

export default function ProjectsPage() {
  const qc = useQueryClient();
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteProject(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["projects"] });
      const prev = qc.getQueryData<Project[]>(["projects"]);
      qc.setQueryData<Project[]>(["projects"], (old) => old?.filter((item) => item.id !== id));
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["projects"], ctx.prev);
      toast.error("Failed to delete");
    },
    onSuccess: () => toast.success("Project deleted"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });

  const reorderMut = useMutation({
    mutationFn: (items: { id: number; sortOrder: number }[]) => reorderProjects(items),
    onError: () => toast.error("Failed to reorder"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });

  function handleDragEnd(result: any) {
    if (!result.destination) return;
    const reordered = Array.from(items);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    qc.setQueryData<Project[]>(["projects"], reordered);
    const updates = reordered.map((item, i) => ({ id: item.id, sortOrder: i }));
    reorderMut.mutate(updates);
  }

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 -mx-4 md:-mx-6 px-4 md:px-6 pt-5 md:pt-2 pb-3 bg-bg/70 backdrop-blur-md flex items-center justify-between">
        <h1 className="text-lg font-heading">Projects</h1>
        <Link
          href="/admin/projects/new"
          className="w-8 h-8 flex items-center justify-center rounded-full bg-fg text-bg border border-hairline cursor-pointer hover:opacity-90 transition-all"
        >
          <Plus weight="bold" className="w-4 h-4" />
        </Link>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="projects">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1">
              {items.map((item, index) => (
                <Draggable key={item.id} draggableId={String(item.id)} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`flex items-center px-4 py-3 border rounded-xl transition-colors ${
                        snapshot.isDragging
                          ? "border-hairline bg-hover-bg shadow-lg"
                          : "border-hairline hover:bg-hover-bg"
                      }`}
                    >
                      <div
                        {...provided.dragHandleProps}
                        className="mr-3 flex items-center shrink-0 p-2 -ml-2 rounded-lg hover:bg-hover-bg transition-colors cursor-grab active:cursor-grabbing"
                      >
                        <DotsSixVertical weight="thin" className="w-4 h-4 text-fg/50" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-fg/50 flex items-center gap-2">
                          {item.featured ? <span>★ Featured</span> : null}
                          <span className={item.published ? "text-fg/50" : "text-amber-500/80"}>
                            {item.published ? "Published" : "Draft"}
                          </span>
                        </p>
                        {item.updatedAt && (
                          <p className="text-[11px] text-fg/40 mt-0.5">
                            edited{" "}
                            {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1.5 shrink-0 ml-3">
                        <Link
                          href={`/admin/projects/${item.id}/edit`}
                          className="p-2.5 text-fg/60 hover:text-fg hover:bg-hover-bg rounded-lg transition-all"
                        >
                          <PencilSimple weight="thin" className="w-4 h-4" />
                        </Link>
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

      {items.length === 0 && (
        <p className="text-xs text-fg/50 text-center py-8">No projects yet.</p>
      )}

      <ConfirmModal
        open={confirmId !== null}
        title="Delete project"
        message="Are you sure you want to delete this project?"
        confirmLabel="Delete"
        onConfirm={() => {
          if (confirmId !== null) deleteMut.mutate(confirmId);
          setConfirmId(null);
        }}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}
