"use client";

import { Shuffle, TrafficCone, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";

import { AppButton } from "@/components/shared/app-button";
import { ScreenHeader } from "@/components/shared/screen-header";

export default function SorteiosPage() {
  const router = useRouter();

  return (
    <div className="flex flex-1 flex-col pt-3">
      <ScreenHeader subtitle="Histórico" title="Sorteios" />
      <div className="flex flex-1 flex-col items-center justify-center px-7 pb-10 text-center lg:px-0">
        <div className="relative mb-[26px] size-[116px]">
          <div className="absolute inset-0 rounded-[30px] bg-accent-soft animate-pulse-ring" />
          <div
            className="absolute inset-3.5 grid place-items-center rounded-3xl border border-line"
            style={{
              background: "linear-gradient(155deg, var(--card-hi), var(--card))",
            }}
          >
            <Wrench className="size-[46px] text-primary" strokeWidth={1.7} />
          </div>
          <div className="absolute -right-1 -bottom-1 grid size-[38px] place-items-center rounded-xl border-[3px] border-background bg-gold">
            <TrafficCone
              className="size-5"
              strokeWidth={2}
              style={{ color: "oklch(0.2 0.05 90)" }}
            />
          </div>
        </div>

        <span className="mb-2.5 font-sans text-[10.5px] font-bold uppercase tracking-[0.16em] text-primary">
          Em breve
        </span>
        <h2 className="font-display text-[26px] leading-none font-bold uppercase text-foreground">
          Histórico em construção
        </h2>
        <p className="mx-auto mt-3 mb-6 max-w-[280px] font-sans text-sm leading-relaxed text-muted-foreground">
          O histórico de sorteios ainda está sendo desenvolvido. Em breve você
          poderá revisar e compartilhar todos os times já sorteados aqui.
        </p>

        <AppButton
          variant="secondary"
          icon={Shuffle}
          onClick={() => router.push("/peladas")}
          className="px-5"
        >
          Ir para uma pelada
        </AppButton>
      </div>
    </div>
  );
}
