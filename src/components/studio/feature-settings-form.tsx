"use client";

import { useState } from "react";
import {
  ClientFeature,
  getFeatureDescription,
  getFeatureLabel,
  getFeatureManagementLabel,
  isClientToggleableFeature,
} from "@/lib/platform-data";
import {
  getSectionLabel,
  SiteSection,
  SiteSectionKey,
} from "@/lib/site-sections";

function Toggle({
  checked,
  disabled,
  label,
  name,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  name?: string;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <label className="flex flex-col items-end gap-2">
      <input
        checked={checked}
        className="peer sr-only"
        disabled={disabled}
        name={name}
        onChange={(event) => onChange?.(event.target.checked)}
        type="checkbox"
      />
      <span
        className={`relative block h-7 w-12 border transition peer-checked:border-emerald-600 peer-checked:bg-emerald-600 ${
          checked
            ? "border-emerald-600 bg-emerald-600"
            : "border-slate-300 bg-slate-200"
        } ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 bg-white shadow-sm transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </span>
      <span className="text-[0.62rem] font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
    </label>
  );
}

export function FeatureSettingsForm({
  action,
  features,
  sections,
}: {
  action: string;
  features: ClientFeature[];
  sections: SiteSection[];
}) {
  const [orderedSections, setOrderedSections] = useState(sections);
  const [draggedSection, setDraggedSection] = useState<SiteSectionKey | null>(
    null,
  );

  function moveSection(sectionKey: SiteSectionKey, targetKey: SiteSectionKey) {
    if (sectionKey === targetKey) {
      return;
    }

    setOrderedSections((current) => {
      const moving = current.find((section) => section.section_key === sectionKey);
      const withoutMoving = current.filter(
        (section) => section.section_key !== sectionKey,
      );
      const targetIndex = withoutMoving.findIndex(
        (section) => section.section_key === targetKey,
      );

      if (!moving || targetIndex < 0) {
        return current;
      }

      const next = [...withoutMoving];
      next.splice(targetIndex, 0, moving);

      return next;
    });
  }

  return (
    <form action={action} className="space-y-6" method="post">
      <section className="border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-black">Feature Controls</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Turn site sections on or off for this client.
            </p>
          </div>
          <span className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
            Live Controls
          </span>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {features.map((feature) => {
            const toggleable = isClientToggleableFeature(feature.feature_key);

            return (
              <div
                className="border border-slate-200 bg-slate-50 p-4"
                key={feature.feature_key}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-black">
                    {getFeatureLabel(feature.feature_key)}
                  </h3>
                  <Toggle
                    checked={feature.is_enabled}
                    disabled={!toggleable}
                    label={
                      toggleable
                        ? feature.is_enabled
                          ? "On"
                          : "Off"
                        : getFeatureManagementLabel(feature.feature_key)
                    }
                    name={
                      toggleable ? `feature:${feature.feature_key}` : undefined
                    }
                  />
                </div>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                  {getFeatureDescription(feature.feature_key)}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black">Homepage Order</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Drag sections into the order they should appear on the preview site.
        </p>

        <div className="mt-5 space-y-3">
          {orderedSections.map((section, index) => (
            <div
              className="flex cursor-grab items-center justify-between gap-4 border border-slate-200 bg-slate-50 px-4 py-3 active:cursor-grabbing"
              draggable
              key={section.section_key}
              onDragEnd={() => setDraggedSection(null)}
              onDragOver={(event) => event.preventDefault()}
              onDragStart={() => setDraggedSection(section.section_key)}
              onDrop={() => {
                if (draggedSection) {
                  moveSection(draggedSection, section.section_key);
                }
              }}
            >
              <input
                name="section_order"
                type="hidden"
                value={section.section_key}
              />
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center border border-slate-300 bg-white text-xs font-black text-slate-500">
                  {index + 1}
                </span>
                <span className="font-black">
                  {getSectionLabel(section.section_key)}
                </span>
              </div>
              <Toggle
                checked={section.is_enabled}
                label={section.is_enabled ? "Shown" : "Hidden"}
                name={`section:${section.section_key}`}
                onChange={(checked) => {
                  setOrderedSections((current) =>
                    current.map((item) =>
                      item.section_key === section.section_key
                        ? { ...item, is_enabled: checked }
                        : item,
                    ),
                  );
                }}
              />
            </div>
          ))}
        </div>
      </section>

      <button
        className="w-full border border-emerald-700 bg-emerald-700 px-6 py-5 text-center text-sm font-black uppercase tracking-[0.2em] text-white shadow-sm transition hover:bg-emerald-600"
        type="submit"
      >
        Save Feature Settings
      </button>
    </form>
  );
}
