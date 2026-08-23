"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type {
  AdminMasterData,
  AdminMasterKind,
  AdminMasterRecord,
} from "@/types/admin-masters";

type Field = {
  label: string;
  min?: number;
  name: string;
  required?: boolean;
  type: "number" | "select" | "text" | "textarea";
};

type Config = {
  description: string;
  fields: Field[];
  label: string;
  singular: string;
};

const CONFIG: Record<AdminMasterKind, Config> = {
  companies: {
    label: "運営会社",
    singular: "運営会社",
    description: "会議室を運営する会社を管理します。",
    fields: [
      { name: "name", label: "会社名", type: "text", required: true },
      { name: "description", label: "説明", type: "textarea" },
    ],
  },
  facilities: {
    label: "施設",
    singular: "施設",
    description: "会社に所属する施設と住所を管理します。",
    fields: [
      {
        name: "company_id",
        label: "運営会社",
        type: "select",
        required: true,
      },
      { name: "name", label: "施設名", type: "text", required: true },
      { name: "prefecture", label: "都道府県", type: "text", required: true },
      { name: "city", label: "市区町村", type: "text", required: true },
      {
        name: "address_line",
        label: "それ以降の住所",
        type: "text",
        required: true,
      },
    ],
  },
  meeting_rooms: {
    label: "会議室",
    singular: "会議室",
    description: "施設に所属する会議室、定員、時間料金を管理します。",
    fields: [
      {
        name: "facility_id",
        label: "施設",
        type: "select",
        required: true,
      },
      { name: "name", label: "会議室名", type: "text", required: true },
      {
        name: "capacity",
        label: "定員（名）",
        type: "number",
        required: true,
        min: 1,
      },
      {
        name: "hourly_rate",
        label: "1時間料金（円）",
        type: "number",
        required: true,
        min: 0,
      },
      { name: "description", label: "説明", type: "textarea" },
    ],
  },
  equipments: {
    label: "備品",
    singular: "備品",
    description: "見積もりで選べる備品と料金体系を管理します。",
    fields: [
      { name: "name", label: "備品名", type: "text", required: true },
      {
        name: "unit_price",
        label: "単価（円）",
        type: "number",
        required: true,
        min: 0,
      },
      {
        name: "charge_unit",
        label: "課金単位",
        type: "select",
        required: true,
      },
    ],
  },
  drinks: {
    label: "飲み物",
    singular: "飲み物",
    description: "見積もりで選べる飲み物と1本あたりの料金を管理します。",
    fields: [
      { name: "name", label: "飲み物名", type: "text", required: true },
      {
        name: "unit_price",
        label: "単価（円）",
        type: "number",
        required: true,
        min: 0,
      },
    ],
  },
};

const KIND_ORDER: AdminMasterKind[] = [
  "companies",
  "facilities",
  "meeting_rooms",
  "equipments",
  "drinks",
];

function formatValue(
  field: Field,
  value: AdminMasterRecord[string],
  data: AdminMasterData,
) {
  if (value === null || value === "") return "—";
  if (field.name === "company_id") {
    return (
      data.companies.find((item) => item.id === Number(value))?.name ?? value
    );
  }
  if (field.name === "facility_id") {
    return (
      data.facilities.find((item) => item.id === Number(value))?.name ?? value
    );
  }
  if (field.name === "charge_unit") {
    return value === "per_item" ? "個数ごと" : "利用ごと";
  }
  if (["hourly_rate", "unit_price"].includes(field.name)) {
    return `${Number(value).toLocaleString("ja-JP")}円`;
  }
  return String(value);
}

export function AdminMasterManager({ data }: { data: AdminMasterData }) {
  const router = useRouter();
  const [activeKind, setActiveKind] =
    useState<AdminMasterKind>("meeting_rooms");
  const [editing, setEditing] = useState<AdminMasterRecord | null>(null);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);

  const config = CONFIG[activeKind];
  const records = data[activeKind];
  const formKey = `${activeKind}-${editing?.id ?? "new"}`;

  const options = useMemo(
    () => ({
      company_id: data.companies.map((company) => ({
        label: `${company.name}${company.is_active ? "" : "（無効）"}`,
        value: company.id,
      })),
      facility_id: data.facilities.map((facility) => ({
        label: `${facility.name}${facility.is_active ? "" : "（無効）"}`,
        value: facility.id,
      })),
      charge_unit: [
        { label: "利用ごと", value: "per_use" },
        { label: "個数ごと", value: "per_item" },
      ],
    }),
    [data],
  );

  function selectKind(kind: AdminMasterKind) {
    setActiveKind(kind);
    setEditing(null);
    setStatus(null);
  }

  async function saveRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload: Record<string, number | string | null> = {};
    for (const field of config.fields) {
      const rawValue = String(formData.get(field.name) ?? "").trim();
      payload[field.name] =
        field.type === "number" ||
        ["company_id", "facility_id"].includes(field.name)
          ? Number(rawValue)
          : rawValue || null;
    }

    const supabase = createClient();
    const query = editing
      ? supabase.from(activeKind).update(payload).eq("id", editing.id)
      : supabase.from(activeKind).insert(payload);
    const { error } = await query;

    if (error) {
      setStatus({
        type: "error",
        text: `${config.singular}を保存できませんでした: ${error.message}`,
      });
    } else {
      setStatus({
        type: "success",
        text: `${config.singular}を${editing ? "更新" : "登録"}しました。`,
      });
      setEditing(null);
      form.reset();
      router.refresh();
    }
    setPending(false);
  }

  async function toggleActive(record: AdminMasterRecord) {
    const nextActive = !record.is_active;
    const verb = nextActive ? "有効化" : "無効化";
    if (
      !nextActive &&
      !window.confirm(
        `${String(record.name)}を無効化します。公開画面では選択できなくなります。`,
      )
    ) {
      return;
    }

    setPending(true);
    setStatus(null);
    const { error } = await createClient()
      .from(activeKind)
      .update({ is_active: nextActive })
      .eq("id", record.id);

    setStatus(
      error
        ? {
            type: "error",
            text: `${config.singular}を${verb}できませんでした: ${error.message}`,
          }
        : {
            type: "success",
            text: `${String(record.name)}を${verb}しました。`,
          },
    );
    setPending(false);
    if (!error) router.refresh();
  }

  return (
    <div>
      <div
        aria-label="マスター種別"
        className="flex gap-2 overflow-x-auto pb-2"
        role="tablist"
      >
        {KIND_ORDER.map((kind) => (
          <button
            aria-selected={activeKind === kind}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
              activeKind === kind
                ? "bg-blue-600 text-white"
                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
            key={kind}
            onClick={() => selectKind(kind)}
            role="tab"
            type="button"
          >
            {CONFIG[kind].label}
          </button>
        ))}
      </div>

      {status && (
        <p
          className={`mt-5 rounded-xl px-4 py-3 text-sm ${
            status.type === "success"
              ? "bg-emerald-50 text-emerald-800"
              : "bg-red-50 text-red-700"
          }`}
          role={status.type === "error" ? "alert" : "status"}
        >
          {status.text}
        </p>
      )}

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-slate-950">
              {editing
                ? `${config.singular}を編集`
                : `${config.singular}を登録`}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{config.description}</p>
          </div>
          {editing && (
            <button
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
              onClick={() => setEditing(null)}
              type="button"
            >
              新規登録に戻る
            </button>
          )}
        </div>

        <form
          className="mt-6 grid gap-5 sm:grid-cols-2"
          key={formKey}
          onSubmit={saveRecord}
        >
          {config.fields.map((field) => {
            const defaultValue = editing?.[field.name] ?? "";
            const fieldOptions =
              options[field.name as keyof typeof options] ?? [];
            return (
              <label
                className={field.type === "textarea" ? "sm:col-span-2" : ""}
                key={field.name}
              >
                <span className="mb-2 block text-sm font-bold text-slate-800">
                  {field.label}
                </span>
                {field.type === "textarea" ? (
                  <textarea
                    className="min-h-28 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950"
                    defaultValue={String(defaultValue)}
                    name={field.name}
                    required={field.required}
                  />
                ) : field.type === "select" ? (
                  <select
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950"
                    defaultValue={String(defaultValue)}
                    name={field.name}
                    required={field.required}
                  >
                    <option disabled value="">
                      選択してください
                    </option>
                    {fieldOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950"
                    defaultValue={String(defaultValue)}
                    min={field.min}
                    name={field.name}
                    required={field.required}
                    type={field.type}
                  />
                )}
              </label>
            );
          })}
          <div className="sm:col-span-2">
            <button
              className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
              disabled={pending}
              type="submit"
            >
              {pending
                ? "保存中…"
                : editing
                  ? `${config.singular}を更新`
                  : `${config.singular}を登録`}
            </button>
          </div>
        </form>
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-xl font-black text-slate-950">
            {config.label}一覧
          </h2>
          <span className="text-sm text-slate-500">{records.length}件</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-slate-50 text-xs tracking-wide text-slate-600 uppercase">
              <tr>
                {config.fields.map((field) => (
                  <th
                    className="px-4 py-3 font-bold"
                    key={field.name}
                    scope="col"
                  >
                    {field.label}
                  </th>
                ))}
                <th className="px-4 py-3 font-bold" scope="col">
                  状態
                </th>
                <th className="px-4 py-3 text-right font-bold" scope="col">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((record) => (
                <tr
                  className={record.is_active ? "" : "bg-slate-50"}
                  key={record.id}
                >
                  {config.fields.map((field) => (
                    <td
                      className="max-w-64 px-4 py-4 text-sm text-slate-700"
                      key={field.name}
                    >
                      <span className="line-clamp-2">
                        {formatValue(field, record[field.name], data)}
                      </span>
                    </td>
                  ))}
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                        record.is_active
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {record.is_active ? "有効" : "無効"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                        disabled={pending}
                        onClick={() => {
                          setEditing(record);
                          setStatus(null);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        type="button"
                      >
                        編集
                      </button>
                      <button
                        className={`rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-60 ${
                          record.is_active
                            ? "border border-red-200 text-red-700 hover:bg-red-50"
                            : "bg-emerald-600 text-white hover:bg-emerald-700"
                        }`}
                        disabled={pending}
                        onClick={() => toggleActive(record)}
                        type="button"
                      >
                        {record.is_active ? "無効化" : "有効化"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td
                    className="px-5 py-10 text-center text-sm text-slate-500"
                    colSpan={config.fields.length + 2}
                  >
                    登録されている{config.singular}はありません。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
