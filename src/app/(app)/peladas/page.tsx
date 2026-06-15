"use client";

import { ChevronRight, Plus, User, Volleyball } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { PeladaNameSheet } from "@/components/peladas/pelada-name-sheet";
import { AppButton } from "@/components/shared/app-button";
import { PrivBadges } from "@/components/shared/priv-badge";
import { ScreenHeader } from "@/components/shared/screen-header";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage } from "@/lib/api/axios";
import { useMe } from "@/lib/hooks/use-auth";
import { useCreatePelada, usePeladas } from "@/lib/hooks/use-peladas";
import { isOwner } from "@/lib/utils/privileges";
import type { PeladaSummary } from "@/types/api";

function PeladaCard({
  pelada,
  owner,
  index,
}: {
  pelada: PeladaSummary;
  owner: boolean;
  index: number;
}) {
  return (
    <div
      className="rounded-[18px] border border-line-soft bg-card p-4 shadow-card animate-fade-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0">
          <h3 className="truncate font-display text-[19px] leading-tight font-semibold uppercase text-foreground">
            {pelada.name}
          </h3>
          <div className="mt-[5px] flex items-center gap-[5px]">
            <User className="size-[13px] text-faint" />
            <span className="font-sans text-[12.5px] font-semibold text-muted-foreground">
              @{pelada.ownerUsername}
              {owner && " · você"}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-[5px]">
          <PrivBadges isOwner={owner} privileges={pelada.privileges} />
        </div>
      </div>

      <div className="mt-[15px] flex items-center justify-end">
        <Link href={`/peladas/${pelada.id}`}>
          <AppButton size="sm" className="pointer-events-none flex-row-reverse pr-2 pl-3">
            <ChevronRight className="size-4" strokeWidth={2.2} />
            Gerenciar
          </AppButton>
        </Link>
      </div>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div
      className="rounded-[18px] border border-dashed border-line px-[22px] py-[30px] text-center"
      style={{
        background:
          "repeating-linear-gradient(135deg, var(--card) 0 12px, transparent 12px 24px), var(--surface)",
      }}
    >
      <div className="mx-auto mb-3.5 grid size-16 place-items-center rounded-[20px] border border-line-soft bg-card-hi">
        <Volleyball className="size-[30px] text-faint" />
      </div>
      <h3 className="font-display text-lg font-semibold uppercase text-foreground">
        Nenhuma pelada ainda
      </h3>
      <p className="mx-auto mt-2 mb-[18px] max-w-[250px] font-sans text-[13.5px] leading-normal text-muted-foreground">
        Você ainda não organizou nenhuma pelada. Crie a primeira e comece a
        montar os times.
      </p>
      <AppButton icon={Plus} onClick={onCreate} className="mx-auto px-5">
        Criar Pelada
      </AppButton>
    </div>
  );
}

export default function PeladasPage() {
  const { data: me } = useMe();
  const { data: peladas, isLoading, isError, error, refetch } = usePeladas();
  const createMutation = useCreatePelada();
  const [createOpen, setCreateOpen] = useState(false);

  function handleCreate(name: string) {
    createMutation.mutate(
      { name },
      { onSuccess: () => setCreateOpen(false) }
    );
  }

  return (
    <div className="flex flex-1 flex-col pt-3">
      <ScreenHeader
        subtitle={me ? `Olá, @${me.username}` : "Bem-vindo"}
        title="Suas Peladas"
        right={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            aria-label="Criar pelada"
            className="grid size-11 place-items-center rounded-[14px] bg-primary text-primary-foreground shadow-[0_10px_22px_-10px_var(--accent-color)] transition active:scale-90"
          >
            <Plus className="size-6" strokeWidth={2.4} />
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-3 px-4 pb-6 md:grid-cols-2 lg:grid-cols-3 lg:px-0">
        {isLoading && (
          <>
            <Skeleton className="h-[118px] rounded-[18px]" />
            <Skeleton className="h-[118px] rounded-[18px]" />
            <Skeleton className="h-[118px] rounded-[18px]" />
          </>
        )}

        {isError && (
          <div className="rounded-[18px] border border-line-soft bg-card p-6 text-center">
            <p className="font-sans text-sm text-muted-foreground">
              {getApiErrorMessage(error)}
            </p>
            <AppButton
              variant="secondary"
              size="sm"
              onClick={() => refetch()}
              className="mx-auto mt-4"
            >
              Tentar novamente
            </AppButton>
          </div>
        )}

        {peladas && peladas.length === 0 && (
          <EmptyState onCreate={() => setCreateOpen(true)} />
        )}

        {peladas?.map((pelada, index) => (
          <PeladaCard
            key={pelada.id}
            pelada={pelada}
            owner={isOwner(pelada, me)}
            index={index}
          />
        ))}
      </div>

      <PeladaNameSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        loading={createMutation.isPending}
        onSubmit={handleCreate}
      />
    </div>
  );
}
