"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import { calculateEstimate } from "@/lib/estimate-calculations";
import { createClient } from "@/lib/supabase/client";
import type {
  CatalogItem,
  EquipmentCatalogItem,
  EstimateSelection,
} from "@/types/estimates";
import type { RoomCardData } from "@/types/rooms";

const yen = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

type QuantityMap = Record<number, string>;

function validPositiveInteger(rawValue: string) {
  const value = Number(rawValue);
  return Number.isSafeInteger(value) && value >= 1;
}

function selectedItems<T extends CatalogItem>(
  catalog: T[],
  quantities: QuantityMap,
): EstimateSelection[] {
  return catalog.flatMap((item) => {
    const rawQuantity = quantities[item.id];
    return validPositiveInteger(rawQuantity)
      ? [
          {
            id: item.id,
            quantity: Number(rawQuantity),
            unitPrice: item.unitPrice,
          },
        ]
      : [];
  });
}

function SelectionList<T extends CatalogItem>({
  items,
  kind,
  quantities,
  setQuantities,
}: {
  items: T[];
  kind: "equipment" | "drink";
  quantities: QuantityMap;
  setQuantities: (next: QuantityMap) => void;
}) {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {items.map((item) => {
        const selected = item.id in quantities;
        const inputId = `${kind}-${item.id}-quantity`;
        const invalid = selected && !validPositiveInteger(quantities[item.id]);
        const chargeUnit =
          "chargeUnit" in item
            ? item.chargeUnit === "per_item"
              ? " / 1個"
              : " / 1回"
            : " / 1本";

        return (
          <div
            className={`rounded-2xl border p-4 ${selected ? "border-blue-500 bg-blue-50" : "border-slate-200"}`}
            key={item.id}
          >
            <label className="flex cursor-pointer items-start gap-3">
              <input
                checked={selected}
                className="mt-1 size-4 accent-blue-600"
                onChange={(event) => {
                  const next = { ...quantities };
                  if (event.target.checked) next[item.id] = "1";
                  else delete next[item.id];
                  setQuantities(next);
                }}
                type="checkbox"
              />
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-slate-900">
                  {item.name}
                </span>
                <span className="mt-1 block text-sm text-slate-600">
                  {yen.format(item.unitPrice)}
                  {chargeUnit}
                </span>
              </span>
            </label>
            {selected && (
              <div className="mt-3 border-t border-blue-200 pt-3">
                <label
                  className="text-sm font-bold text-slate-700"
                  htmlFor={inputId}
                >
                  数量
                </label>
                <input
                  aria-describedby={invalid ? `${inputId}-error` : undefined}
                  aria-invalid={invalid}
                  className="ml-3 w-24 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  id={inputId}
                  inputMode="numeric"
                  min={1}
                  onChange={(event) =>
                    setQuantities({
                      ...quantities,
                      [item.id]: event.target.value,
                    })
                  }
                  step={1}
                  type="number"
                  value={quantities[item.id]}
                />
                {invalid && (
                  <p
                    className="mt-2 text-sm text-red-700"
                    id={`${inputId}-error`}
                  >
                    1以上の整数を入力してください。
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function EstimateForm({
  room,
  equipments,
  drinks,
}: {
  room: RoomCardData;
  equipments: EquipmentCatalogItem[];
  drinks: CatalogItem[];
}) {
  const router = useRouter();
  const [rawHours, setRawHours] = useState("1");
  const [rawPeople, setRawPeople] = useState("1");
  const [equipmentQuantities, setEquipmentQuantities] = useState<QuantityMap>(
    {},
  );
  const [drinkQuantities, setDrinkQuantities] = useState<QuantityMap>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const hours = Number(rawHours);
  const people = Number(rawPeople);
  const hoursValid = validPositiveInteger(rawHours);
  const peopleIntegerValid = validPositiveInteger(rawPeople);
  const capacityValid = peopleIntegerValid && people <= room.capacity;
  const quantitiesValid =
    Object.values(equipmentQuantities).every(validPositiveInteger) &&
    Object.values(drinkQuantities).every(validPositiveInteger);
  const formValid = hoursValid && capacityValid && quantitiesValid;

  const selectedEquipments = useMemo(
    () => selectedItems(equipments, equipmentQuantities),
    [equipments, equipmentQuantities],
  );
  const selectedDrinks = useMemo(
    () => selectedItems(drinks, drinkQuantities),
    [drinks, drinkQuantities],
  );
  const fees = calculateEstimate(
    room.hourlyRate,
    hoursValid ? hours : 0,
    selectedEquipments,
    selectedDrinks,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    if (!formValid) {
      const firstInvalid = event.currentTarget.querySelector<HTMLElement>(
        '[aria-invalid="true"]',
      );
      firstInvalid?.focus();
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("create_estimate", {
      p_meeting_room_id: room.id,
      p_usage_hours: hours,
      p_number_of_people: people,
      p_equipments: selectedEquipments.map(({ id, quantity }) => ({
        id,
        quantity,
      })),
      p_drinks: selectedDrinks.map(({ id, quantity }) => ({ id, quantity })),
    });

    if (error) {
      setSubmitError(error.message || "見積もりを保存できませんでした。");
      setSubmitting(false);
      return;
    }

    router.push(`/estimates/${String(data)}?saved=1`);
    router.refresh();
  }

  return (
    <form
      className="grid gap-8 lg:grid-cols-[1fr_360px]"
      noValidate
      onSubmit={handleSubmit}
    >
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-bold tracking-widest text-blue-700">
            見積もり条件
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            利用内容を入力
          </h1>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div>
              <label
                className="mb-2 block text-sm font-bold text-slate-800"
                htmlFor="usage-hours"
              >
                利用時間
              </label>
              <div className="flex items-center gap-3">
                <input
                  aria-describedby={
                    !hoursValid ? "usage-hours-error" : undefined
                  }
                  aria-invalid={!hoursValid}
                  className="w-32 rounded-xl border border-slate-300 px-4 py-3 text-lg font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  id="usage-hours"
                  inputMode="numeric"
                  min={1}
                  onChange={(event) => setRawHours(event.target.value)}
                  step={1}
                  type="number"
                  value={rawHours}
                />
                <span className="font-semibold text-slate-700">時間</span>
              </div>
              {!hoursValid && (
                <p className="mt-2 text-sm text-red-700" id="usage-hours-error">
                  1以上の整数を入力してください。
                </p>
              )}
            </div>
            <div>
              <label
                className="mb-2 block text-sm font-bold text-slate-800"
                htmlFor="number-of-people"
              >
                利用人数
              </label>
              <div className="flex items-center gap-3">
                <input
                  aria-describedby={
                    !capacityValid ? "number-of-people-error" : undefined
                  }
                  aria-invalid={!capacityValid}
                  className="w-32 rounded-xl border border-slate-300 px-4 py-3 text-lg font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  id="number-of-people"
                  inputMode="numeric"
                  max={room.capacity}
                  min={1}
                  onChange={(event) => setRawPeople(event.target.value)}
                  step={1}
                  type="number"
                  value={rawPeople}
                />
                <span className="font-semibold text-slate-700">名</span>
              </div>
              {!capacityValid && (
                <p
                  className="mt-2 text-sm text-red-700"
                  id="number-of-people-error"
                >
                  {peopleIntegerValid
                    ? `この会議室の定員は${room.capacity}名です。`
                    : "1以上の整数を入力してください。"}
                </p>
              )}
            </div>
          </div>
        </section>

        <fieldset className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <legend className="px-1 text-xl font-black text-slate-950">
            備品
          </legend>
          <p className="mt-2 text-sm text-slate-600">
            必要な備品を選び、数量を入力してください。
          </p>
          <SelectionList
            items={equipments}
            kind="equipment"
            quantities={equipmentQuantities}
            setQuantities={setEquipmentQuantities}
          />
        </fieldset>

        <fieldset className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <legend className="px-1 text-xl font-black text-slate-950">
            飲み物
          </legend>
          <p className="mt-2 text-sm text-slate-600">
            必要な飲み物を選び、数量を入力してください。
          </p>
          <SelectionList
            items={drinks}
            kind="drink"
            quantities={drinkQuantities}
            setQuantities={setDrinkQuantities}
          />
        </fieldset>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Link
            className="rounded-full border border-slate-300 px-5 py-3 text-center text-sm font-bold text-slate-700 hover:bg-slate-50"
            href="/rooms"
          >
            会議室を選び直す
          </Link>
          <button
            className="rounded-full bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-wait disabled:bg-slate-400"
            disabled={submitting}
            type="submit"
          >
            {submitting ? "保存中…" : "見積もりを保存"}
          </button>
          {submitError && (
            <p className="w-full text-sm text-red-700" role="alert">
              {submitError}
            </p>
          )}
        </div>
      </div>

      <aside className="h-fit rounded-3xl bg-slate-950 p-6 text-white lg:sticky lg:top-6">
        <p className="text-xs font-bold tracking-widest text-blue-300">
          SELECTED ROOM
        </p>
        <h2 className="mt-2 text-2xl font-black">{room.name}</h2>
        <p className="mt-2 text-sm text-slate-300">
          {room.companyName} / {room.facilityName}
        </p>
        <dl className="mt-6 space-y-3 border-t border-slate-700 pt-6 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-400">定員</dt>
            <dd>{room.capacity}名</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-400">時間単価</dt>
            <dd>{yen.format(room.hourlyRate)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-400">利用時間</dt>
            <dd>{hoursValid ? `${hours}時間` : "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-400">利用人数</dt>
            <dd>{capacityValid ? `${people}名` : "—"}</dd>
          </div>
        </dl>
        <dl
          aria-atomic="true"
          aria-live="polite"
          className="mt-6 space-y-3 border-t border-slate-700 pt-6 text-sm"
        >
          <div className="flex justify-between gap-4">
            <dt className="text-slate-400">部屋料金</dt>
            <dd>{yen.format(fees.roomFee)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-400">備品料金</dt>
            <dd>{yen.format(fees.equipmentFee)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-400">飲み物料金</dt>
            <dd>{yen.format(fees.drinkFee)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-slate-700 pt-4 text-lg font-black">
            <dt>合計</dt>
            <dd>{yen.format(fees.totalAmount)}</dd>
          </div>
        </dl>
      </aside>
    </form>
  );
}
