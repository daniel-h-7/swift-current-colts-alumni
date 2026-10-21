"use client";
import {
  getLegendsCopy,
  legendsCopyGroups,
  type LegendsCopy,
  type LegendsCopyKey,
} from "@/lib/legends-copy";
export function LegendsCopyFields({
  name,
  clientId,
  value,
  onChange,
}: {
  name: string;
  clientId?: string;
  value?: Partial<LegendsCopy>;
  onChange?: (key: LegendsCopyKey, value: string) => void;
}) {
  const copy = getLegendsCopy(name, value, clientId);
  const fieldClass =
    "mt-2 w-full rounded border border-[#cdd1c7] bg-white px-4 py-3 text-sm text-[#171917] outline-none focus:border-[#785d25] focus:ring-2 focus:ring-[#c5a45b]/25";
  return (
    <section className="bg-white p-6 text-[#171917]">
      <h2 className="text-xl font-black">Legends section wording</h2>
      <p className="mt-2 text-sm leading-6 text-[#62675e]">
        Everything is filled in for you. Open a section to personalize its
        wording, or keep the Legends defaults. Clearing a field restores its
        default after saving. Main and italic headings keep the existing design.
      </p>
      <div className="mt-5 divide-y divide-[#dedfd7]">
        {legendsCopyGroups.map((group) => (
          <details key={group.title} className="py-4">
            <summary className="cursor-pointer text-sm font-bold">
              {group.title}
            </summary>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {group.fields.map((field) => {
                const state = onChange
                  ? {
                      value: value?.[field.key] ?? copy[field.key],
                      onChange: (
                        event: React.ChangeEvent<
                          HTMLInputElement | HTMLTextAreaElement
                        >,
                      ) => onChange(field.key, event.target.value),
                    }
                  : { defaultValue: copy[field.key] };
                return (
                  <label
                    key={field.key}
                    className={`text-sm font-bold ${field.multiline ? "md:col-span-2" : ""}`}
                  >
                    {field.label}
                    {field.multiline ? (
                      <textarea
                        {...state}
                        className={`${fieldClass} min-h-24`}
                        name={`legends_${field.key}`}
                        maxLength={2000}
                      />
                    ) : (
                      <input
                        {...state}
                        className={fieldClass}
                        name={`legends_${field.key}`}
                        maxLength={2000}
                      />
                    )}
                  </label>
                );
              })}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
