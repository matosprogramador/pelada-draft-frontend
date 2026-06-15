"use client";

import { Check, Lock, Pencil, Plus, Shield, Shuffle, Trash2, User } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { usePeladaDraft } from "@/components/peladas/pelada-draft-context";
import { PeladaNameSheet } from "@/components/peladas/pelada-name-sheet";
import { PlayerCard } from "@/components/players/player-card";
import { PlayerSheet } from "@/components/players/player-sheet";
import { ActionTile } from "@/components/shared/action-tile";
import { AppButton } from "@/components/shared/app-button";
import { ConfirmSheet } from "@/components/shared/confirm-sheet";
import { PrivBadges } from "@/components/shared/priv-badge";
import { Stepper } from "@/components/shared/stepper";
import { TopBar } from "@/components/shared/top-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage } from "@/lib/api/axios";
import { useMe } from "@/lib/hooks/use-auth";
import { useDeletePelada, usePelada, useUpdatePelada } from "@/lib/hooks/use-peladas";
import {
  useCreatePlayer,
  useDeletePlayer,
  usePlayers,
  useUpdatePlayer,
} from "@/lib/hooks/use-players";
import { hasPrivilege, isOwner } from "@/lib/utils/privileges";
import { MAX_TEAMS } from "@/lib/utils/teams";
import type { Player, PlayerPayload } from "@/types/api";

export default function PeladaPage() {
  const { peladaId } = useParams<{ peladaId: string }>();
  const router = useRouter();
  const { data: me } = useMe();

  const {
    data: pelada,
    isLoading: peladaLoading,
    isError,
    error,
    refetch,
  } = usePelada(peladaId);
  const { data: playersData, isLoading: playersLoading } = usePlayers(peladaId);
  const isLoading = peladaLoading || playersLoading;

  const updateMutation = useUpdatePelada(peladaId);
  const deleteMutation = useDeletePelada();
  const createPlayerMutation = useCreatePlayer(peladaId);
  const updatePlayerMutation = useUpdatePlayer(peladaId);
  const deletePlayerMutation = useDeletePlayer(peladaId);

  const {
    selectedIds,
    setSelectedIds,
    teamsQuantity,
    setTeamsQuantity,
    withPosition,
    setWithPosition,
    runDraw,
  } = usePeladaDraft();

  const [editNameOpen, setEditNameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [playerSheet, setPlayerSheet] = useState<{
    open: boolean;
    player: Player | null;
  }>({ open: false, player: null });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <Skeleton className="h-10 w-2/3 rounded-xl" />
        <Skeleton className="h-40 rounded-[18px]" />
        <Skeleton className="h-20 rounded-[18px]" />
        <Skeleton className="h-20 rounded-[18px]" />
      </div>
    );
  }

  if (isError || !pelada) {
    return (
      <div className="flex flex-1 flex-col">
        <TopBar title="Pelada" onBack={() => router.push("/peladas")} />
        <div className="mx-4 rounded-[18px] border border-line-soft bg-card p-6 text-center">
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
      </div>
    );
  }

  const owner = isOwner(pelada, me);
  const canManage = hasPrivilege(pelada, "MANAGE_PLAYERS", me);
  const canDraw = hasPrivilege(pelada, "DRAW_TEAMS", me);
  const players = playersData ?? [];
  const count = selectedIds.length;
  const allSelected = players.length > 0 && count === players.length;

  const lockMsg = () => toast.error("Apenas o dono da pelada pode fazer isso.");

  function togglePlayer(playerId: string) {
    setSelectedIds((current) =>
      current.includes(playerId)
        ? current.filter((id) => id !== playerId)
        : [...current, playerId]
    );
  }

  function savePlayer(payload: PlayerPayload) {
    if (playerSheet.player) {
      updatePlayerMutation.mutate(
        { playerId: playerSheet.player.id, payload },
        { onSuccess: () => setPlayerSheet({ open: false, player: null }) }
      );
    } else {
      createPlayerMutation.mutate(payload, {
        onSuccess: () => setPlayerSheet({ open: false, player: null }),
      });
    }
  }

  function removePlayer(player: Player) {
    deletePlayerMutation.mutate(player.id, {
      onSuccess: () => {
        setSelectedIds((current) => current.filter((id) => id !== player.id));
        setPlayerSheet({ open: false, player: null });
      },
    });
  }

  function handleDraw() {
    if (!canDraw) {
      toast.error("Você não tem permissão para sortear times.");
      return;
    }
    if (count < 2) {
      toast.error("Selecione ao menos 2 jogadores.");
      return;
    }
    if (count < teamsQuantity) {
      toast.error("Selecione ao menos um jogador por time.");
      return;
    }
    runDraw();
    router.push(`/peladas/${peladaId}/draw`);
  }

  const playerMutationPending =
    createPlayerMutation.isPending ||
    updatePlayerMutation.isPending ||
    deletePlayerMutation.isPending;

  return (
    <div className="flex flex-1 flex-col">
      <TopBar title={pelada.name} onBack={() => router.push("/peladas")} />

      {/* two-column on desktop: players left, draw panel right */}
      <div className="flex flex-1 flex-col lg:flex-row lg:items-start lg:gap-6">
        {/* main content */}
        <div className="min-w-0 flex-1 px-4 pb-40 lg:px-0 lg:pb-8">
          {/* cartão de detalhes e permissões */}
          <div
            className="rounded-[18px] border border-line-soft p-4 shadow-card"
            style={{
              background: "linear-gradient(160deg, var(--card-hi), var(--card))",
            }}
          >
            <div className="flex items-center gap-1.5">
              <User className="size-[13px] text-faint" />
              <span className="font-sans text-[0.78125rem] font-semibold text-muted-foreground">
                Organizada por @{pelada.ownerUsername}
                {owner && " · você"}
              </span>
            </div>
            <div className="mt-3.5 flex gap-7">
              {(
                [
                  ["Jogadores", players.length],
                  ["Convocados", count],
                ] as const
              ).map(([label, value]) => (
                <div key={label}>
                  <div className="font-display text-2xl leading-none font-bold text-foreground">
                    {value}
                  </div>
                  <div className="mt-[3px] font-sans text-[0.59375rem] font-semibold uppercase tracking-[0.1em] text-faint">
                    {label}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-[15px] border-t border-line-soft pt-3.5">
              <div className="mb-2 font-sans text-[0.59375rem] font-bold uppercase tracking-[0.12em] text-faint">
                Suas permissões
              </div>
              <div className="flex flex-wrap gap-1.5">
                <PrivBadges isOwner={owner} privileges={pelada.privileges} />
              </div>
            </div>
          </div>

          {/* ações do dono */}
          <div className="mt-3 flex gap-[9px]">
            <ActionTile
              icon={Pencil}
              label="Editar nome"
              locked={!owner}
              onClick={owner ? () => setEditNameOpen(true) : lockMsg}
            />
            <ActionTile
              icon={Shield}
              label="Permissões"
              locked={!owner}
              onClick={
                owner
                  ? () => router.push(`/peladas/${peladaId}/permissions`)
                  : lockMsg
              }
            />
            <ActionTile
              icon={Trash2}
              label="Excluir"
              danger
              locked={!owner}
              onClick={owner ? () => setDeleteOpen(true) : lockMsg}
            />
          </div>

          {/* convocados */}
          <div className="mt-[22px] mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-display text-[1.0625rem] leading-none font-semibold uppercase text-foreground">
                Convocados
              </h2>
              <span className="font-sans text-xs text-faint">
                {count} de {players.length} selecionados
              </span>
            </div>
            <div className="flex gap-[7px]">
              {players.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setSelectedIds(
                      allSelected ? [] : players.map((player) => player.id)
                    )
                  }
                  className="rounded-[10px] bg-accent-soft px-[11px] py-[7px] font-sans text-xs font-bold text-primary transition active:scale-95"
                >
                  {allSelected ? "Limpar" : "Todos"}
                </button>
              )}
              {canManage && (
                <button
                  type="button"
                  onClick={() => setPlayerSheet({ open: true, player: null })}
                  aria-label="Adicionar jogador"
                  className="grid size-[34px] place-items-center rounded-[10px] border border-line-soft bg-card-hi text-foreground transition active:scale-90"
                >
                  <Plus className="size-[18px]" strokeWidth={2.3} />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 pb-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {players.length === 0 && (
              <p className="col-span-full py-8 text-center font-sans text-[0.84375rem] text-muted-foreground">
                Nenhum jogador ainda.{" "}
                {canManage
                  ? "Adicione o primeiro no botão acima."
                  : "Peça ao dono para cadastrar os jogadores."}
              </p>
            )}
            {players.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                selectable
                selected={selectedIds.includes(player.id)}
                dim={count > 0}
                onToggle={() => togglePlayer(player.id)}
                onEdit={
                  canManage
                    ? () => setPlayerSheet({ open: true, player })
                    : undefined
                }
              />
            ))}
          </div>
        </div>

        {/* barra de sorteio — sticky bottom no mobile, painel direito no lg */}
        <div className="sticky bottom-0 z-40 w-full border-t border-line-soft bg-[color-mix(in_oklch,var(--surface)_90%,transparent)] px-4 pt-[11px] pb-3.5 backdrop-blur-md lg:bottom-auto lg:top-6 lg:w-72 lg:shrink-0 lg:self-start lg:rounded-2xl lg:border lg:bg-surface lg:px-4 lg:py-5 lg:shadow-card lg:backdrop-blur-none">
          <div className="mb-[11px] flex items-center justify-between">
            <div className="flex items-center gap-[9px]">
              <span className="font-sans text-[0.65625rem] font-bold uppercase tracking-[0.08em] text-faint">
                Times
              </span>
              <Stepper
                value={teamsQuantity}
                min={2}
                max={MAX_TEAMS}
                onChange={setTeamsQuantity}
              />
            </div>
            <button
              type="button"
              onClick={() => setWithPosition((value) => !value)}
              className={`flex items-center gap-[7px] rounded-[10px] px-2.5 py-1.5 transition active:scale-95 ${
                withPosition
                  ? "border border-transparent bg-accent-soft"
                  : "border border-line-soft bg-card-hi"
              }`}
            >
              <span
                className="grid size-4 place-items-center rounded-[5px]"
                style={{
                  background: withPosition ? "var(--accent-color)" : "transparent",
                  border: `1.5px solid ${withPosition ? "var(--accent-color)" : "var(--line)"}`,
                  color: "var(--accent-ink)",
                }}
              >
                {withPosition && <Check className="size-[11px]" strokeWidth={3} />}
              </span>
              <span
                className={`font-sans text-xs font-bold ${
                  withPosition ? "text-primary" : "text-muted-foreground"
                }`}
              >
                Equilibrar posição
              </span>
            </button>
          </div>
          <button
            type="button"
            onClick={handleDraw}
            className="relative flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl transition active:scale-[0.98]"
            style={
              canDraw
                ? {
                    background:
                      "linear-gradient(120deg, var(--accent-color), var(--accent-press))",
                    color: "var(--accent-ink)",
                    boxShadow: "0 14px 30px -12px var(--accent-color)",
                  }
                : {
                    background: "var(--card-hi)",
                    color: "var(--faint)",
                    border: "1px solid var(--line)",
                  }
            }
          >
            {canDraw ? (
              <Shuffle className="size-[22px]" strokeWidth={2.2} />
            ) : (
              <Lock className="size-[22px]" strokeWidth={2.2} />
            )}
            <span className="font-display text-[1.0625rem] font-bold uppercase tracking-[0.02em] whitespace-nowrap">
              {canDraw ? "Realizar Sorteio" : "Sem permissão"}
            </span>
            {canDraw && (
              <span className="absolute top-1/2 right-3 min-w-[26px] -translate-y-1/2 rounded-full bg-black/20 px-2 py-[3px] text-center font-sans text-[0.8125rem] font-bold">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* sheets */}
      <PeladaNameSheet
        open={editNameOpen}
        onOpenChange={setEditNameOpen}
        initialName={pelada.name}
        loading={updateMutation.isPending}
        onSubmit={(name) =>
          updateMutation.mutate(
            { name },
            { onSuccess: () => setEditNameOpen(false) }
          )
        }
      />
      <ConfirmSheet
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir pelada"
        loading={deleteMutation.isPending}
        description={
          <>
            Tem certeza que deseja excluir{" "}
            <strong className="font-display uppercase text-foreground">
              {pelada.name}
            </strong>
            ? Todos os jogadores e dados serão perdidos. Esta ação não pode ser
            desfeita.
          </>
        }
        onConfirm={() =>
          deleteMutation.mutate(peladaId, {
            onSuccess: () => router.push("/peladas"),
          })
        }
      />
      <PlayerSheet
        open={playerSheet.open}
        onOpenChange={(open) =>
          setPlayerSheet((current) => ({ ...current, open }))
        }
        player={playerSheet.player}
        loading={playerMutationPending}
        onSave={savePlayer}
        onDelete={removePlayer}
      />
    </div>
  );
}
