export function MembershipThanks({ logoUrl, name }: { logoUrl?: string; name: string }) {
  return (
    <div className="relative isolate mx-auto mb-8 flex min-h-48 w-full items-center justify-center">
      <span aria-hidden="true" className="membership-thanks-script pointer-events-none absolute inset-x-0 top-1/2 -z-10 -translate-y-1/2 select-none whitespace-nowrap text-[clamp(4rem,13vw,9rem)] leading-none text-white opacity-30">Thank you</span>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={`${name} logo`} className="h-28 w-36 object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] md:h-36 md:w-44" />
      ) : null}
    </div>
  );
}
