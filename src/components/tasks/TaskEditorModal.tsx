"use client"

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import dayjs from "dayjs";
import { Task, PriorityTag, Weekday } from "@/types/task";
import { useTaskStore } from "@/store/taskStore";
import { Trash2 } from "lucide-react";

const WEEKDAYS: { label: string; value: Weekday }[] = [
  { label: "Su", value: 0 },
  { label: "Mo", value: 1 },
  { label: "Tu", value: 2 },
  { label: "We", value: 3 },
  { label: "Th", value: 4 },
  { label: "Fr", value: 5 },
  { label: "Sa", value: 6 },
];

const PRIORITY_CONFIG: { tag: PriorityTag; label: string; active: string; inactive: string }[] = [
  { tag: "urgent",   label: "🔴 Urgent",   active: "bg-red-100 text-red-700 border-red-400 ring-2 ring-red-200",     inactive: "bg-gray-50 text-gray-500 border-gray-200" },
  { tag: "work",     label: "💼 Work",     active: "bg-blue-100 text-blue-700 border-blue-400 ring-2 ring-blue-200", inactive: "bg-gray-50 text-gray-500 border-gray-200" },
  { tag: "personal", label: "💜 Personal", active: "bg-purple-100 text-purple-700 border-purple-400 ring-2 ring-purple-200", inactive: "bg-gray-50 text-gray-500 border-gray-200" },
];

export function TaskEditorModal() {
  const { isEditorOpen, editingTask, closeEditor, addTask, updateTask, deleteTask } = useTaskStore();

  const [title, setTitle]           = useState("");
  const [dueDate, setDueDate]       = useState("");
  const [startTime, setStartTime]   = useState("");
  const [endTime, setEndTime]       = useState("");
  const [priority, setPriority]     = useState<PriorityTag[]>([]);
  const [repeatDays, setRepeatDays] = useState<Weekday[]>([]);
  const [reminderDate, setReminderDate] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Add a description (supports rich text)..." }),
    ],
    content: "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none outline-none min-h-[80px] px-3 py-2 leading-relaxed focus:outline-none text-gray-800",
      },
    },
  });

  // Populate fields when modal opens — fixes time drift bug by ONLY using saved values
  useEffect(() => {
    if (!isEditorOpen) return;

    setConfirmDelete(false); // always reset delete confirmation on open
    setTitle(editingTask?.title ?? "");
    
    // Date: use saved dueDate, or today
    const baseDate = editingTask?.dueDate
      ? dayjs(editingTask.dueDate).format("YYYY-MM-DD")
      : dayjs().format("YYYY-MM-DD");
    setDueDate(baseDate);

    // ⚠️ TIME BUG FIX: Only fall back to defaults when creating a NEW task (no id).
    // When editing, ALWAYS use the saved startTime/endTime values — never current time.
    const isEditing = Boolean(editingTask?.id);
    setStartTime(
      editingTask?.startTime ??
      (isEditing ? "09:00" : dayjs().startOf("hour").add(1, "hour").format("HH:mm"))
    );
    setEndTime(
      editingTask?.endTime ??
      (isEditing ? "10:00" : dayjs().startOf("hour").add(2, "hour").format("HH:mm"))
    );

    setPriority(editingTask?.priority ?? []);
    setRepeatDays(editingTask?.repeatDays ?? []);

    setReminderDate(
      editingTask?.reminderTime
        ? dayjs(editingTask.reminderTime).format("YYYY-MM-DD")
        : ""
    );
    setReminderTime(
      editingTask?.reminderTime
        ? dayjs(editingTask.reminderTime).format("HH:mm")
        : ""
    );

    if (editor) {
      editor.commands.setContent(editingTask?.description ?? "");
    }
  }, [isEditorOpen, editingTask?.id]); // Only re-run when the identity of the task changes

  const handleSave = async () => {
    const reminderISO =
      reminderDate && reminderTime
        ? dayjs(`${reminderDate}T${reminderTime}`).toISOString()
        : undefined;

    const payload: Partial<Task> = {
      title: title.trim(),
      // Store date as YYYY-MM-DD string in dueDate to avoid timezone midnight shifts
      dueDate: dayjs(dueDate).format("YYYY-MM-DD"),
      startTime,
      endTime,
      description: editor?.getHTML() ?? "",
      priority,
      // Fix: always send the array (even empty) so recurrence is properly cleared on edit
      repeatDays,
      reminderTime: reminderISO,
      completed: editingTask?.completed ?? false,
    };

    if (editingTask?.id) {
      await updateTask(editingTask.id, payload);
    } else {
      await addTask(payload as Omit<Task, "id">);
    }

    closeEditor();
  };

  const togglePriority = (tag: PriorityTag) =>
    setPriority((prev) =>
      prev.includes(tag) ? prev.filter((p) => p !== tag) : [...prev, tag]
    );

  const toggleRepeatDay = (day: Weekday) =>
    setRepeatDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    );

  if (!isEditorOpen) return null;

  const isEditing = Boolean(editingTask?.id);
  const modalTitle = isEditing ? "Edit Event" : "New Event";

  return (
    <Modal
      isOpen={isEditorOpen}
      onClose={closeEditor}
      title={modalTitle}
    >
      {/* Scrollable content area — no snap, clean spacing */}
      <div className="overflow-y-auto max-h-[70vh] flex flex-col gap-5 px-1 pt-1 pb-2">

        {/* Title */}
        <input
          type="text"
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Event title"
          className="w-full text-xl font-semibold border-0 border-b-2 border-gray-200 focus:border-blue-500 focus:outline-none pb-2 bg-transparent placeholder-gray-300 transition-colors"
        />

        {/* Date & Time — clean grid layout */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400 font-medium uppercase tracking-wide">Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:border-blue-400 focus:outline-none transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400 font-medium uppercase tracking-wide">Start</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:border-blue-400 focus:outline-none transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400 font-medium uppercase tracking-wide">End</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:border-blue-400 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Priority Tags */}
        <div>
          <label className="block text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Priority</label>
          <div className="flex gap-2">
            {PRIORITY_CONFIG.map(({ tag, label, active, inactive }) => (
              <button
                key={tag}
                type="button"
                onClick={() => togglePriority(tag)}
                className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                  priority.includes(tag) ? active : inactive
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Repeat Days */}
        <div>
          <label className="block text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">
            Repeat every week on
          </label>
          <div className="flex gap-1.5">
            {WEEKDAYS.map((day) => {
              const isActive = repeatDays.includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleRepeatDay(day.value)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Reminder */}
        <div>
          <label className="block text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Reminder</label>
          <div className="flex gap-2">
            <input
              type="date"
              value={reminderDate}
              onChange={(e) => setReminderDate(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:border-blue-400 focus:outline-none transition-colors"
            />
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:border-blue-400 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Description</label>
          <div className="border border-gray-200 rounded-lg bg-gray-50 focus-within:bg-white focus-within:border-blue-400 transition-colors overflow-hidden">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      {/* Footer — delete on left (edit only), save/cancel on right */}
      <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-100">
        <div>
          {isEditing && !confirmDelete && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded-md hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          )}
          {isEditing && confirmDelete && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-150">
              <span className="text-sm text-red-600 font-medium">Delete this event?</span>
              <button
                type="button"
                onClick={async () => {
                  await deleteTask(editingTask!.id!);
                  closeEditor();
                }}
                className="text-sm px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md font-medium transition-colors"
              >
                Yes, delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="text-sm px-3 py-1 text-gray-500 hover:text-gray-700 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={closeEditor} className="text-gray-500">
            Cancel
          </Button>
          <Button
            disabled={!title.trim()}
            onClick={handleSave}
            className="px-6 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40"
          >
            {isEditing ? "Save changes" : "Create event"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
