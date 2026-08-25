"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ClientFeature,
  getFeatureDescription,
  getFeatureLabel,
  getFeatureManagementLabel,
  isClientToggleableFeature,
} from "@/lib/platform-shared";
import {
  getSectionLabel,
  SiteSection,
  SiteSectionKey,
} from "@/lib/site-sections-shared";

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
  const formRef = useRef<HTMLFormElement>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [featureState, setFeatureState] = useState(() =>
    Object.fromEntries(
      features.map((feature) => [feature.feature_key, feature.is_enabled]),
    ),
  );
  const [orderedSections, setOrderedSections] = useState(sections);
  const [draggedSection, setDraggedSection] = useState<SiteSectionKey | null>(
    null,
  );
  const visibleFeatures = features.filter(
    (feature) => feature.feature_key !== "custom_domain",
  );
  const enabledOrderedSections = useMemo(
    () =>
      orderedSections.filter(
        (section) => featureState[section.section_key] !== false,
      ),
    [featureState, orderedSections],
  );

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty || isSubmitting) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    const handleClick = (event: MouseEvent) => {
      if (!isDirty || isSubmitting) {
        return;
      }

      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const link = target.closest("a");

      if (!link) {
        return;
      }

      const href = link.getAttribute("href") ?? "";

      if (!href || href.startsWith("#")) {
        return;
      }

      if (!window.confirm("You have unsaved changes. Leave without saving?")) {
        event.preventDefault();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleClick, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleClick, true);
    };
  }, [isDirty, isSubmitting]);

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
      setIsDirty(true);

      return next;
    });
  }

  return (
    <form
      action={action}
      className="space-y-6"
      id="feature-settings-form"
      method="post"
      onSubmit={() => {
        setIsSubmitting(true);
        setIsDirty(false);
      }}
      ref={formRef}
    >
      <section className="border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-black">Feature Controls</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Turn site sections on or off for this client.
            </p>
          </div>
          <span className="border border-emerald-200 bg-emerald-50 px-3 py-3 text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
            Live Controls
          </span>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {visibleFeatures.map((feature) => {
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
                    checked={Boolean(featureState[feature.feature_key])}
                    disabled={!toggleable}
                    label={
                      toggleable
                        ? featureState[feature.feature_key]
                          ? "On"
                          : "Off"
                        : getFeatureManagementLabel(feature.feature_key)
                    }
                    name={
                      toggleable ? `feature:${feature.feature_key}` : undefined
                    }
                    onChange={(checked) => {
                      setFeatureState((current) => ({
                        ...current,
                        [feature.feature_key]: checked,
                      }));
                      setIsDirty(true);
                    }}
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
        <input name="has_section_order" type="hidden" value="1" />
        <h2 className="text-lg font-black">Homepage Order</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Drag the enabled sections into the order they should appear on the
          preview site.
        </p>

        <div className="mt-5 space-y-3">
          {enabledOrderedSections.length ? (
            enabledOrderedSections.map((section, index) => (
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
              <span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-black uppercase text-emerald-700">
                Enabled
              </span>
            </div>
            ))
          ) : (
            <div className="border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm font-bold text-slate-500">
              Turn on a homepage feature above to add it to the order.
            </div>
          )}
        </div>
        {orderedSections
          .filter((section) => !enabledOrderedSections.includes(section))
          .map((section) => (
            <input
              key={section.section_key}
              name="section_disabled"
              type="hidden"
              value={section.section_key}
            />
          ))}
      </section>

      <button
        className="w-full border border-emerald-700 bg-emerald-700 px-6 py-5 text-center text-sm font-black uppercase tracking-[0.2em] text-white shadow-sm transition hover:bg-emerald-600"
        name="intent"
        type="submit"
        value="continue"
      >
        Save Settings and Continue to Edit Content
      </button>
    </form>
  );
}
