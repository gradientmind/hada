"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { UserMemory } from "@/lib/types/database";

type MemoryResponse = {
  memories?: UserMemory[];
  error?: string;
};

type MemoryMutationResponse = {
  memory?: UserMemory;
  success?: boolean;
  error?: string;
};

type MemoryDraft = {
  id: string;
  topic: string;
  content: string;
};

export function MemoryTab() {
  const [memories, setMemories] = useState<UserMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [newMemoryOpen, setNewMemoryOpen] = useState(false);
  const [newMemoryDraft, setNewMemoryDraft] = useState({ topic: "", content: "" });
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  const [memoryDraft, setMemoryDraft] = useState<MemoryDraft | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void loadMemories();
  }, []);

  const filteredMemories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return memories;
    }

    return memories.filter((memory) => {
      const topic = memory.topic.toLowerCase();
      const content = memory.content.toLowerCase();
      return topic.includes(normalizedQuery) || content.includes(normalizedQuery);
    });
  }, [memories, query]);

  async function loadMemories() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/dashboard/memories", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as MemoryResponse;

      if (!response.ok) {
        throw new Error(data.error || "Failed to load memories.");
      }

      setMemories(Array.isArray(data.memories) ? data.memories : []);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load memories.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateMemory() {
    if (isSaving) return;

    const topic = newMemoryDraft.topic.trim();
    const content = newMemoryDraft.content.trim();
    if (!topic || !content) {
      setMessage("Topic and content are required.");
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/dashboard/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, content }),
      });
      const data = (await response.json().catch(() => ({}))) as MemoryMutationResponse;

      if (!response.ok || !data.memory) {
        throw new Error(data.error || "Failed to create memory.");
      }

      setMemories((prev) => [data.memory!, ...prev]);
      setNewMemoryDraft({ topic: "", content: "" });
      setNewMemoryOpen(false);
      setMessage("Memory saved.");
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : "Failed to create memory.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveMemory(memoryId: string) {
    if (isSaving || !memoryDraft) return;

    const topic = memoryDraft.topic.trim();
    const content = memoryDraft.content.trim();
    if (!topic || !content) {
      setMessage("Topic and content are required.");
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/dashboard/memories/${memoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, content }),
      });
      const data = (await response.json().catch(() => ({}))) as MemoryMutationResponse;

      if (!response.ok || !data.memory) {
        throw new Error(data.error || "Failed to update memory.");
      }

      setMemories((prev) => prev.map((memory) => (memory.id === memoryId ? data.memory! : memory)));
      setEditingMemoryId(null);
      setMemoryDraft(null);
      setMessage("Memory updated.");
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : "Failed to update memory.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteMemory(memoryId: string) {
    if (isSaving) return;
    if (!window.confirm("Delete this memory?")) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/dashboard/memories/${memoryId}`, {
        method: "DELETE",
      });
      const data = (await response.json().catch(() => ({}))) as MemoryMutationResponse;

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete memory.");
      }

      setMemories((prev) => prev.filter((memory) => memory.id !== memoryId));
      if (editingMemoryId === memoryId) {
        setEditingMemoryId(null);
        setMemoryDraft(null);
      }
      setMessage("Memory deleted.");
    } catch (deleteError) {
      setMessage(deleteError instanceof Error ? deleteError.message : "Failed to delete memory.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Memory</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Review and manage the facts and preferences Hada keeps across chats.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">How memory works</CardTitle>
          <CardDescription>Memory is separate from chat history.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
          <p>Memories are durable facts or preferences Hada can reuse across future conversations.</p>
          <p>Clearing chat history does not remove saved memories.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Saved memories</CardTitle>
              <CardDescription>Search, edit, add, or delete saved memory items.</CardDescription>
            </div>
            <Button size="sm" onClick={() => setNewMemoryOpen((value) => !value)}>
              {newMemoryOpen ? "Cancel" : "Add memory"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search memories"
          />

          {newMemoryOpen ? (
            <div className="space-y-3 rounded-xl border border-zinc-200/70 bg-zinc-50/60 p-4 dark:border-zinc-800/70 dark:bg-zinc-950/40">
              <Input
                value={newMemoryDraft.topic}
                onChange={(event) =>
                  setNewMemoryDraft((prev) => ({ ...prev, topic: event.target.value }))
                }
                placeholder="Topic"
              />
              <textarea
                value={newMemoryDraft.content}
                onChange={(event) =>
                  setNewMemoryDraft((prev) => ({ ...prev, content: event.target.value }))
                }
                placeholder="Memory content"
                rows={4}
                className="min-h-28 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:focus:border-zinc-600"
              />
              <div className="flex justify-end">
                <Button size="sm" onClick={() => void handleCreateMemory()} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save memory"}
                </Button>
              </div>
            </div>
          ) : null}

          {error ? (
            <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
          ) : null}

          {message ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{message}</p>
          ) : null}

          {loading ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading memories...</p>
          ) : filteredMemories.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {memories.length === 0 ? "No memories saved yet." : "No memories match your search."}
            </p>
          ) : (
            <div className="space-y-3">
              {filteredMemories.map((memory) => {
                const isEditing = editingMemoryId === memory.id;

                return (
                  <div
                    key={memory.id}
                    className="rounded-xl border border-zinc-200/70 bg-white/70 p-4 dark:border-zinc-800/70 dark:bg-zinc-950/40"
                  >
                    {isEditing && memoryDraft ? (
                      <div className="space-y-3">
                        <Input
                          value={memoryDraft.topic}
                          onChange={(event) =>
                            setMemoryDraft((prev) => (prev ? { ...prev, topic: event.target.value } : prev))
                          }
                        />
                        <textarea
                          value={memoryDraft.content}
                          onChange={(event) =>
                            setMemoryDraft((prev) => (prev ? { ...prev, content: event.target.value } : prev))
                          }
                          rows={4}
                          className="min-h-28 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:focus:border-zinc-600"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingMemoryId(null);
                              setMemoryDraft(null);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button size="sm" onClick={() => void handleSaveMemory(memory.id)} disabled={isSaving}>
                            {isSaving ? "Saving..." : "Save"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {memory.topic}
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                            {memory.content}
                          </p>
                          <p className="mt-2 text-xs text-zinc-400">
                            Updated {formatTimestamp(memory.updated_at)}
                          </p>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingMemoryId(memory.id);
                              setMemoryDraft({
                                id: memory.id,
                                topic: memory.topic,
                                content: memory.content,
                              });
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                            onClick={() => void handleDeleteMemory(memory.id)}
                            disabled={isSaving}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
