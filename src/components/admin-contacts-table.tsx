"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Contact,
  contactStatuses,
  membershipStatuses,
} from "@/lib/contact-options";
import {
  formatCurrencyFromCents,
  formatContactName,
  formatDate,
  formatOptionalDate,
  getContactStatus,
  getContactTags,
  getMembershipStatus,
} from "@/lib/contact-format";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { LocalDateTime } from "@/components/local-date-time";

type SearchParams = {
  q?: string;
  graduation_year?: string;
  relationship_type?: string;
  sport?: string;
  email_opt_in?: string;
  sms_opt_in?: string;
  status?: string;
  membership_status?: string;
  paid_status?: string;
  sort_by?: string;
  sort_dir?: string;
};

const sortableColumns = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "alternate_email", label: "Alt Email" },
  { key: "phone", label: "Phone" },
  { key: "graduation_year", label: "Grad Year" },
  { key: "relationship_type", label: "Relationship" },
  { key: "sport", label: "Sport" },
  { key: "status", label: "Status" },
  { key: "membership_status", label: "Membership" },
  { key: "annual_dues_amount_cents", label: "Dues" },
  { key: "gift_donation_amount_cents", label: "Gifts" },
  { key: "paid_through", label: "Paid Through" },
  { key: "last_payment_at", label: "Last Payment" },
  { key: "tags", label: "Tags" },
  { key: "email_opt_in", label: "Email Opt-In" },
  { key: "sms_opt_in", label: "SMS" },
  { key: "notes", label: "Notes" },
  { key: "created_at", label: "Added" },
] as const;

type SortKey = (typeof sortableColumns)[number]["key"];

function getSort(filters: SearchParams) {
  const allowedKeys = sortableColumns.map((column) => column.key);
  const sortBy = allowedKeys.includes(filters.sort_by as SortKey)
    ? (filters.sort_by as SortKey)
    : "created_at";
  const sortDir = filters.sort_dir === "asc" ? "asc" : "desc";

  return { sortBy, sortDir };
}

function getSortHref(filters: SearchParams, sortBy: SortKey) {
  const currentSort = getSort(filters);
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value && key !== "sort_by" && key !== "sort_dir") {
      params.set(key, value);
    }
  });

  params.set("sort_by", sortBy);
  params.set(
    "sort_dir",
    currentSort.sortBy === sortBy && currentSort.sortDir === "asc"
      ? "desc"
      : "asc",
  );

  return `/admin?${params.toString()}`;
}

function SortHeader({
  filters,
  label,
  sortBy,
}: {
  filters: SearchParams;
  label: string;
  sortBy: SortKey;
}) {
  const currentSort = getSort(filters);
  const isActive = currentSort.sortBy === sortBy;

  return (
    <th className="sticky top-0 z-20 whitespace-nowrap bg-zinc-950 px-4 py-4 font-black uppercase tracking-[3px] shadow-[inset_0_-1px_0_rgba(255,255,255,0.12)]">
      <Link
        className="inline-flex items-center gap-2 text-white hover:text-blue-300"
        href={getSortHref(filters, sortBy)}
      >
        {label}
        <span className={isActive ? "text-blue-300" : "text-white/35"}>
          {isActive && currentSort.sortDir === "asc" ? "^" : "v"}
        </span>
      </Link>
    </th>
  );
}

export function AdminContactsTable({
  bulkAction,
  contacts,
  errorMessage,
  filters,
}: {
  bulkAction: (formData: FormData) => void | Promise<void>;
  contacts: Contact[];
  errorMessage: string;
  filters: SearchParams;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedValue = selectedIds.join(",");

  function toggleContact(index: number, checked: boolean, shiftKey: boolean) {
    const contactId = contacts[index]?.id;

    if (!contactId) {
      return;
    }

    if (shiftKey && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const rangeIds = contacts.slice(start, end + 1).map((contact) => contact.id);

      setSelectedIds((current) => {
        const next = new Set(current);

        rangeIds.forEach((id) => {
          if (checked) {
            next.add(id);
          } else {
            next.delete(id);
          }
        });

        return Array.from(next);
      });
    } else {
      setSelectedIds((current) =>
        checked
          ? Array.from(new Set([...current, contactId]))
          : current.filter((id) => id !== contactId),
      );
    }

    setLastSelectedIndex(index);
  }

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? contacts.map((contact) => contact.id) : []);
    setLastSelectedIndex(null);
  }

  return (
    <section className="mt-6 overflow-visible border border-white/10 bg-zinc-950 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
      <div className="flex flex-col gap-3 border-b border-white/10 bg-white/[0.025] px-4 py-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm font-black uppercase tracking-[2px] text-gray-400">
          {selectedIds.length} selected
        </p>
        <details className="group relative self-start md:self-auto">
          <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center border border-white/10 bg-black/45 text-gray-300 transition hover:border-blue-500/70 hover:bg-blue-950/40 hover:text-white [&::-webkit-details-marker]:hidden">
            <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
              <path
                d="M12 7.25h.01M12 12h.01M12 16.75h.01"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
              />
            </svg>
          </summary>
          <div className="absolute right-auto z-30 mt-2 w-72 overflow-hidden border border-white/10 bg-zinc-950 p-2 shadow-[0_22px_80px_rgba(0,0,0,0.65)] ring-1 ring-black/60 md:right-0">
            <form action={bulkAction} className="space-y-2">
              <input name="contact_ids" type="hidden" value={selectedValue} />
              <input name="bulk_action" type="hidden" value="status" />
              <label className="block text-xs font-black uppercase tracking-[2px] text-gray-500">
                Set CRM Status
                <select
                  className="mt-2 w-full border border-white/10 bg-black px-3 py-2 text-sm font-bold text-white"
                  name="status"
                >
                  {contactStatuses.map((status) => (
                    <option className="bg-zinc-950" key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="w-full px-3 py-2.5 text-left text-sm font-bold text-gray-200 transition hover:bg-blue-950/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!selectedIds.length}
                type="submit"
              >
                Apply Status
              </button>
            </form>
            <form action={bulkAction} className="mt-2 space-y-2 border-t border-white/10 pt-2">
              <input name="contact_ids" type="hidden" value={selectedValue} />
              <input name="bulk_action" type="hidden" value="membership_status" />
              <label className="block text-xs font-black uppercase tracking-[2px] text-gray-500">
                Set Membership
                <select
                  className="mt-2 w-full border border-white/10 bg-black px-3 py-2 text-sm font-bold text-white"
                  name="membership_status"
                >
                  {membershipStatuses.map((status) => (
                    <option className="bg-zinc-950" key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="w-full px-3 py-2.5 text-left text-sm font-bold text-gray-200 transition hover:bg-blue-950/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!selectedIds.length}
                type="submit"
              >
                Apply Membership
              </button>
            </form>
            <form action={bulkAction} className="mt-2 border-t border-white/10 pt-2">
              <input name="contact_ids" type="hidden" value={selectedValue} />
              <input name="bulk_action" type="hidden" value="delete" />
              <ConfirmSubmitButton
                className="w-full px-3 py-2.5 text-left text-sm font-bold text-red-300 transition hover:bg-red-950/55 hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!selectedIds.length}
                message={`Delete ${selectedIds.length} selected contact${selectedIds.length === 1 ? "" : "s"}?`}
              >
                Delete Selected
              </ConfirmSubmitButton>
            </form>
          </div>
        </details>
      </div>
      <div className="max-h-[72vh] overflow-auto">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead className="text-white">
            <tr>
              {sortableColumns.map((column) => (
                <SortHeader
                  filters={filters}
                  key={column.key}
                  label={column.label}
                  sortBy={column.key}
                />
              ))}
              <th className="sticky top-0 z-20 whitespace-nowrap bg-zinc-950 px-4 py-4 text-right font-black uppercase tracking-[3px] shadow-[inset_0_-1px_0_rgba(255,255,255,0.12)]">
                Select
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/10">
            {contacts.map((contact, index) => (
              <tr className="align-top hover:bg-white/[0.04]" key={contact.id}>
                <td className="whitespace-nowrap px-4 py-4 font-black text-white">
                  <Link
                    className="hover:text-blue-300"
                    href={`/admin/contacts/${contact.id}`}
                  >
                    {formatContactName(contact)}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-gray-300">
                  {contact.email}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-gray-300">
                  {contact.alternate_email || "-"}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-gray-300">
                  {contact.phone || "-"}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-gray-300">
                  {contact.graduation_year || "-"}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-gray-300">
                  {contact.relationship_type}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-gray-300">
                  {contact.sport}
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  <span className="border border-white/10 bg-white/10 px-3 py-1 text-xs font-black text-gray-200">
                    {getContactStatus(contact)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  <span className="border border-red-500/20 bg-red-500/15 px-3 py-1 text-xs font-black text-red-300">
                    {getMembershipStatus(contact)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-gray-300">
                  {formatCurrencyFromCents(contact.annual_dues_amount_cents)}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-gray-300">
                  {formatCurrencyFromCents(contact.gift_donation_amount_cents)}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-gray-300">
                  {formatOptionalDate(contact.paid_through)}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-gray-300">
                  {contact.last_payment_at ? (
                    <LocalDateTime
                      fallback={formatDate(contact.last_payment_at)}
                      value={contact.last_payment_at}
                    />
                  ) : (
                    "-"
                  )}
                </td>
                <td className="min-w-48 px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    {getContactTags(contact).length ? (
                      getContactTags(contact).map((tag) => (
                        <span
                          className="border border-blue-500/20 bg-blue-500/15 px-3 py-1 text-xs font-black text-blue-300"
                          key={tag}
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  <span className="border border-blue-500/20 bg-blue-500/15 px-3 py-1 text-xs font-black text-blue-300">
                    {contact.email_opt_in ? "Yes" : "No"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  <span className="border border-red-500/20 bg-red-500/15 px-3 py-1 text-xs font-black text-red-300">
                    {contact.sms_opt_in ? "Yes" : "No"}
                  </span>
                </td>
                <td className="max-w-sm px-4 py-4 text-gray-300">
                  {contact.notes || "-"}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-gray-300">
                  <LocalDateTime
                    fallback={formatDate(contact.created_at)}
                    value={contact.created_at}
                  />
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-right">
                  <input
                    aria-label={`Select ${formatContactName(contact)}`}
                    checked={selectedSet.has(contact.id)}
                    className="h-4 w-4 border-white/20 bg-black accent-blue-600"
                    onChange={() => undefined}
                    onClick={(event) =>
                      toggleContact(
                        index,
                        event.currentTarget.checked,
                        event.shiftKey,
                      )
                    }
                    type="checkbox"
                  />
                </td>
              </tr>
            ))}

            {!contacts.length && !errorMessage ? (
              <tr>
                <td
                  className="px-4 py-12 text-center font-bold text-gray-400"
                  colSpan={19}
                >
                  No contacts match the current filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {contacts.length ? (
        <div className="border-t border-white/10 px-4 py-3 text-xs font-bold uppercase tracking-[2px] text-gray-500">
          <label className="inline-flex items-center gap-2">
            <input
              checked={selectedIds.length === contacts.length}
              className="h-4 w-4 border-white/20 bg-black accent-blue-600"
              onChange={(event) => toggleAll(event.target.checked)}
              type="checkbox"
            />
            Select all visible contacts
          </label>
        </div>
      ) : null}
    </section>
  );
}
