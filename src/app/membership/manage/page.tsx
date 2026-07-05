import Image from "next/image";
import Link from "next/link";
import { ManageMembershipForm } from "@/components/manage-membership-form";

export default function ManageMembershipPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12">
        <Image
          src="/images/stadium.jpg"
          alt="Football stadium under Friday night lights"
          fill
          priority
          className="object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/80 via-black/85 to-black" />

        <div className="relative z-10 w-full max-w-xl">
          <Link
            className="mb-6 inline-flex text-sm font-bold text-gray-400 hover:text-white"
            href="/"
          >
            Back home
          </Link>
          <div>
            <p className="text-sm uppercase tracking-[5px] text-red-500">
              Annual Membership
            </p>
            <h1 className="mt-3 text-4xl font-black">
              Manage Your Membership
            </h1>
            <p className="mt-4 text-gray-300">
              Enter the email used for your Colts Football membership. We will
              email a secure Stripe link where you can update your payment
              method or cancel future renewals.
            </p>
          </div>

          <ManageMembershipForm />
        </div>
      </section>
    </main>
  );
}
