"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { pipelines as pipelinesApi, pipelineStages as pipelineStagesApi, deals as dealsApi } from "@/lib/api";
import type { Pipeline, PipelineStage } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Trash2,
  Plus,
  GripVertical,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

const STAGE_COLORS = [
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
];

interface PipelineSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipeline: Pipeline;
  stages: PipelineStage[];
  onPipelinesChanged: () => void;
  onStagesChanged: () => void;
  onCreateNewPipeline: () => void;
}

export function PipelineSettings({
  open,
  onOpenChange,
  pipeline,
  stages,
  onPipelinesChanged,
  onStagesChanged,
  onCreateNewPipeline,
}: PipelineSettingsProps) {
  // Removed supabase
  const [name, setName] = useState(pipeline.name);
  const [localStages, setLocalStages] = useState<PipelineStage[]>(stages);
  const [newStageName, setNewStageName] = useState("");
  const [newStageColor, setNewStageColor] = useState(STAGE_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Reset form state when the dialog opens or its prop inputs change
  // — legitimate prop-driven sync.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) return;
    setName(pipeline.name);
    setLocalStages([...stages].sort((a, b) => a.position - b.position));
    setShowDeleteConfirm(false);
  }, [open, pipeline, stages]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function handleReorder(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = localStages.findIndex((s) => s.id === active.id);
    const newIndex = localStages.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    setLocalStages(arrayMove(localStages, oldIndex, newIndex));
  }

  async function handleSave() {
    setSaving(true);

    try {
      await pipelinesApi.update(pipeline.id, { name: name.trim() });
      await Promise.all(
        localStages.map((s, i) =>
          pipelineStagesApi.update(pipeline.id, s.id, {
            name: s.name,
            color: s.color,
            position: i,
          })
        )
      );

      setSaving(false);
      onOpenChange(false);
      onPipelinesChanged();
      onStagesChanged();
      toast.success("Pipeline saved");
    } catch (err) {
      setSaving(false);
      toast.error("Failed to save pipeline");
    }
  }

  async function handleAddStage() {
    const trimmed = newStageName.trim();
    if (!trimmed) return;

    try {
      const res = await pipelineStagesApi.create(pipeline.id, {
        name: trimmed,
        color: newStageColor,
        position: localStages.length,
      });

      const data = res.data?.data || res.data;
      if (!data) throw new Error("No data returned");

      setLocalStages([...localStages, data as PipelineStage]);
      setNewStageName("");
      setNewStageColor(STAGE_COLORS[(localStages.length + 1) % STAGE_COLORS.length]);
    } catch (err) {
      toast.error("Failed to add stage");
    }
  }

  async function handleRemoveStage(stageId: string) {
    try {
      // Refuse to delete if deals still reference the stage (FK would fail).
      const dealsRes = await dealsApi.list({ stage_id: stageId });
      const deals = dealsRes.data?.data || dealsRes.data || [];

      if (deals.length > 0) {
        toast.error("Move or delete deals in this stage first");
        return;
      }

      await pipelineStagesApi.delete(pipeline.id, stageId);
      setLocalStages(localStages.filter((s) => s.id !== stageId));
    } catch (err) {
      toast.error("Failed to delete stage");
    }
  }

  async function handleDeletePipeline() {
    setDeleting(true);
    try {
      await pipelinesApi.delete(pipeline.id);
      toast.success("Pipeline deleted");
      onOpenChange(false);
      onPipelinesChanged();
    } catch (err) {
      toast.error("Failed to delete pipeline");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-theme-bg-card border-theme-border max-h-[85vh] overflow-y-auto overflow-x-hidden text-theme-text shadow-xl custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-theme-text">Manage Pipeline</DialogTitle>
        </DialogHeader>

        {showDeleteConfirm ? (
          <div className="py-4">
            <div className="flex items-center gap-3 rounded-lg border border-red-500/20 dark:border-red-500/30 bg-red-500/5 dark:bg-red-500/10 p-4">
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  Delete Pipeline
                </p>
                <p className="mt-1 text-xs text-theme-text-secondary">
                  This will archive all deals in this pipeline. This cannot be
                  undone.
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="border-theme-border bg-transparent text-theme-text-secondary hover:bg-theme-bg-hover hover:text-theme-text"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeletePipeline}
                disabled={deleting}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {deleting ? "Deleting..." : "Delete Pipeline"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label className="text-theme-text-secondary">Pipeline Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-theme-border bg-theme-bg-secondary text-theme-text focus-visible:ring-violet-500"
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-theme-text-secondary">Stages</Label>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleReorder}
                >
                  <SortableContext
                    items={localStages.map((s) => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                      {localStages.map((stage, index) => (
                        <SortableStageRow
                          key={stage.id}
                          stage={stage}
                          onNameChange={(v) => {
                            const updated = [...localStages];
                            updated[index] = { ...updated[index], name: v };
                            setLocalStages(updated);
                          }}
                          onColorChange={(v) => {
                            const updated = [...localStages];
                            updated[index] = { ...updated[index], color: v };
                            setLocalStages(updated);
                          }}
                          onRemove={() => handleRemoveStage(stage.id)}
                          colors={STAGE_COLORS}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

                {/* Add new stage */}
                <div className="mt-1 flex flex-wrap gap-1">
                  {STAGE_COLORS.map((color) => {
                    const btnStyle = {
                      backgroundColor: color,
                      borderColor: newStageColor === color ? "#8b5cf6" : "transparent",
                    };
                    return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewStageColor(color)}
                      className="h-5 w-5 rounded-full border-2 transition-transform hover:scale-110"
                      style={btnStyle}
                      aria-label={`Pick color ${color}`}
                    />
                    );
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={newStageName}
                    onChange={(e) => setNewStageName(e.target.value)}
                    placeholder="New stage name"
                    className="border-theme-border bg-theme-bg-card text-sm text-theme-text focus-visible:ring-violet-500 placeholder:text-theme-text-secondary shadow-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddStage();
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddStage}
                    disabled={!newStageName.trim()}
                    className="shrink-0 border-theme-border bg-theme-bg-card text-theme-text hover:bg-theme-bg-hover shadow-sm"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add
                  </Button>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={onCreateNewPipeline}
                className="w-full border-dashed border-theme-border bg-theme-bg-card text-theme-text hover:bg-theme-bg-hover hover:border-violet-500/50 hover:text-violet-500 transition-colors shadow-sm"
              >
                <Plus className="mr-1 h-4 w-4" />
                Create a new pipeline
              </Button>
            </div>

            {/* <DialogFooter className="border-theme-border bg-theme-bg-secondary/50 flex gap-2 w-full justify-between items-center mt-2 sm:justify-between"> */}
            <div className="flex w-full items-center justify-between gap-2 pt-4 mt-2 border-t border-theme-border">
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Delete Pipeline
              </Button>
              <div className="flex gap-2 items-center">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="border-theme-border bg-transparent text-theme-text-secondary hover:bg-theme-bg-hover hover:text-theme-text"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || !name.trim()}
                  className="bg-violet-600 text-white hover:bg-violet-700"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
            {/* </DialogFooter> */}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SortableStageRow({
  stage,
  onNameChange,
  onColorChange,
  onRemove,
  colors,
}: {
  stage: PipelineStage;
  onNameChange: (v: string) => void;
  onColorChange: (v: string) => void;
  onRemove: () => void;
  colors: string[];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-lg border border-theme-border bg-theme-bg-secondary p-2"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-theme-text-muted hover:text-theme-text-secondary active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <ColorSwatch value={stage.color} onChange={onColorChange} colors={colors} />
      <Input
        value={stage.name}
        onChange={(e) => onNameChange(e.target.value)}
        className="h-7 flex-1 border-transparent bg-transparent text-sm text-theme-text focus:border-theme-border focus-visible:ring-0 focus-visible:ring-offset-0 focus:bg-theme-bg-card"
      />
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={onRemove}
        className="text-theme-text-muted hover:text-red-500 focus:bg-theme-bg-hover"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

function ColorSwatch({
  value,
  onChange,
  colors,
}: {
  value: string;
  onChange: (v: string) => void;
  colors: string[];
}) {
  const [open, setOpen] = useState(false);
  const triggerStyle = { backgroundColor: value };
  
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-4 w-4 rounded-full border border-theme-border"
        style={triggerStyle}
        aria-label="Change color"
      />
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-6 z-20 flex flex-wrap gap-1 rounded-lg border border-theme-border bg-theme-bg-card p-2 shadow-lg w-36">
            {colors.map((c) => {
              const itemStyle = {
                backgroundColor: c,
                borderColor: c === value ? "#8b5cf6" : "transparent",
              };
              return (
              <button
                key={c}
                type="button"
                onClick={() => {
                  onChange(c);
                  setOpen(false);
                }}
                className="h-5 w-5 rounded-full border-2 transition-transform hover:scale-110"
                style={itemStyle}
                aria-label={`Select color ${c}`}
                title={`Select color ${c}`}
              />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
