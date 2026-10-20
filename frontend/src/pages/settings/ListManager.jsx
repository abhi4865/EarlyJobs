// src/pages/settings/ListManager.jsx
// Reusable editor for Hiring Stages and Application Sources (add / rename / recolor / reorder / delete).
import { useState } from "react";
import { toast } from "sonner";
import { GripVertical, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { getErrorMessage } from "@/api/client";
import { useSettings } from "@/context/SettingsContext";
import Button from "@/components/common/Button";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import Modal from "@/components/common/Modal";
import { Field, Input } from "@/components/common/Fields";

const PALETTE = ["#3B82F6", "#6366F1", "#8B5CF6", "#EC4899", "#EF4444", "#F59E0B", "#10B981", "#14B8A6", "#64748B"];

function ItemModal({ open, onClose, item, noun, onSave }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PALETTE[0]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastKey, setLastKey] = useState(null);
  const key = open ? (item?._id ?? "new") : null;
  if (key !== lastKey) { setLastKey(key); if (open) { setName(item?.name ?? ""); setColor(item?.color ?? PALETTE[0]); setError(""); } }

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError(`Enter a ${noun} name`);
    setSaving(true);
    try { await onSave({ name: name.trim(), color }); onClose(); } catch (err) { setError(getErrorMessage(err)); } finally { setSaving(false); }
  };
  return (
    <Modal open={open} onClose={onClose} size="sm" title={item ? `Edit ${noun}` : `Add ${noun}`}
      footer={<><Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button><Button type="submit" form="list-item-form" loading={saving}>{item ? "Save changes" : `Add ${noun}`}</Button></>}>
      <form id="list-item-form" onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Name" error={error} htmlFor="li-name" hint={item?.locked ? "Core stages can't be renamed, but you can change their colour." : undefined}>
          <Input id="li-name" value={name} onChange={(e) => setName(e.target.value)} disabled={item?.locked} invalid={!!error} autoFocus />
        </Field>
        <Field label="Colour">
          <div className="flex flex-wrap gap-2">{PALETTE.map((c) => (
            <button type="button" key={c} onClick={() => setColor(c)} aria-label={`Colour ${c}`} aria-pressed={color === c}
              className="h-8 w-8 rounded-full ring-offset-2 transition" style={{ backgroundColor: c, boxShadow: color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : undefined }} />
          ))}</div>
        </Field>
      </form>
    </Modal>
  );
}

export default function ListManager({ kind, title, description, noun, api, compact }) {
  const { settings, setSettings, refresh } = useSettings();
  const items = settings[kind];
  const [modal, setModal] = useState({ open: false, item: null });
  const [toDelete, setToDelete] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [busy, setBusy] = useState(false);

  const onSave = async (body) => {
    if (modal.item) await api.update(modal.item._id, body); else await api.create(body);
    toast.success(modal.item ? `${noun} updated` : `${noun} added`);
    refresh();
  };
  const remove = async () => {
    setBusy(true);
    try { await api.remove(toDelete._id); toast.success(`${noun} deleted`); refresh(); } catch (e) { toast.error(getErrorMessage(e)); } finally { setBusy(false); setToDelete(null); }
  };
  const drop = async (overId) => {
    if (!dragId || dragId === overId) return;
    const next = [...items]; const from = next.findIndex((i) => i._id === dragId); const to = next.findIndex((i) => i._id === overId);
    next.splice(to, 0, next.splice(from, 1)[0]);
    const prev = settings;
    setSettings({ ...settings, [kind]: next });
    try { await api.reorder(next.map((i) => i._id)); } catch (e) { setSettings(prev); toast.error(getErrorMessage(e)); }
  };

  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div><h2 className="text-lg font-semibold text-slate-900">{title}</h2><p className="text-sm text-slate-500">{description}</p></div>
        <Button variant="outline" size="sm" onClick={() => setModal({ open: true, item: null })}><Plus className="h-4 w-4" /> Add {noun}</Button>
      </div>
      <ul className={compact ? "space-y-0.5" : "space-y-1"}>
        {items.map((it) => (
          <li key={it._id} draggable onDragStart={() => setDragId(it._id)} onDragOver={(e) => e.preventDefault()} onDrop={() => { drop(it._id); setDragId(null); }} onDragEnd={() => setDragId(null)}
            className="group flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
            <GripVertical className="h-4 w-4 cursor-grab text-slate-300" aria-hidden />
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: it.color }} />
            <span className="flex-1 text-sm text-slate-800">{it.name}</span>
            {it.locked && <Lock className="h-3.5 w-3.5 text-slate-300" aria-label="Core stage" />}
            <button onClick={() => setModal({ open: true, item: it })} aria-label={`Edit ${it.name}`} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => setToDelete(it)} disabled={it.locked} aria-label={`Delete ${it.name}`} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:pointer-events-none disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
          </li>
        ))}
      </ul>
      <ItemModal open={modal.open} item={modal.item} noun={noun.toLowerCase()} onClose={() => setModal({ open: false, item: null })} onSave={onSave} />
      <ConfirmDialog open={!!toDelete} loading={busy} title={`Delete ${noun.toLowerCase()}?`} description={`“${toDelete?.name}” will be removed. ${noun}s still used by candidates can't be deleted.`} onConfirm={remove} onClose={() => setToDelete(null)} />
    </section>
  );
}
