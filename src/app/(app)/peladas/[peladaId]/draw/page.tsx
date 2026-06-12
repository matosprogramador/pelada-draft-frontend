"use client";

import { Share2, Shuffle, Trophy, Volleyball } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { TeamPanel } from "@/components/draw/team-panel";
import { StarRow } from "@/components/players/star-row";
import { AppButton } from "@/components/shared/app-button";
import { BottomSheet } from "@/components/shared/bottom-sheet";
import { PrivBadge } from "@/components/shared/priv-badge";
import { TopBar } from "@/components/shared/top-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage } from "@/lib/api/axios";
import { useDrawTeams } from "@/lib/hooks/use-draw";
import { usePelada } from "@/lib/hooks/use-peladas";
import { loadDrawConfig, useDrawConfig } from "@/lib/utils/draw-config";
import { POSITION_META } from "@/lib/utils/positions";
import { teamColor } from "@/lib/utils/teams";
import type { DrawTeam } from "@/types/api";

function teamsAsText(peladaName: string, teams: DrawTeam[]): string {
  const lines = [`⚽ ${peladaName} — times sorteados:`, ""];
  teams.forEach((team, index) => {
    const color = teamColor(index);
    lines.push(`*Time ${color.name}* (★${team.totalStars})`);
    team.players.forEach((player) => {
      lines.push(`- ${player.name} (${POSITION_META[player.position].short} ★${player.stars})`);
    });
    lines.push("");
  });
  lines.push("Sorteado no PeladaDraft");
  return lines.join("\n");
}

function ShareSheet({
  open,
  onOpenChange,
  peladaName,
  teams,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  peladaName: string;
  teams: DrawTeam[];
}) {
  const date = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
  });

  async function copy() {
    try {
      await navigator.clipboard.writeText(teamsAsText(peladaName, teams));
      toast.success("Times copiados para a área de transferência.");
    } catch {
      toast.error("Não foi possível copiar os times.");
    }
  }

  function shareWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(
      teamsAsText(peladaName, teams)
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Compartilhar times"
      footer={
        <div className="flex gap-2.5">
          <AppButton variant="secondary" icon={Share2} onClick={copy} className="px-4">
            Copiar
          </AppButton>
          <AppButton full onClick={shareWhatsApp}>
            Enviar no WhatsApp
          </AppButton>
        </div>
      }
    >
      {/* prévia do gráfico exportável */}
      <div
        className="relative overflow-hidden rounded-[18px] border border-line p-4"
        style={{ background: "linear-gradient(165deg, #131a26, #0d121b)" }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(420px 180px at 80% -10%, var(--accent-soft), transparent 60%)",
          }}
        />
        <div className="relative flex items-center gap-2">
          <div className="grid size-[30px] place-items-center rounded-[9px] bg-primary">
            <Volleyball
              className="size-[18px]"
              strokeWidth={1.7}
              style={{ color: "var(--accent-ink)" }}
            />
          </div>
          <div className="flex-1">
            <div className="font-display text-[15px] leading-none font-bold uppercase text-white">
              {peladaName}
            </div>
            <div className="font-sans text-[10.5px] font-semibold text-white/50">
              {date} · {teams.length} times
            </div>
          </div>
          <div className="font-display text-[10px] font-bold uppercase tracking-[0.06em] text-primary">
            PeladaDraft
          </div>
        </div>

        <div className="relative mt-3.5 grid grid-cols-2 gap-2">
          {teams.map((team, index) => {
            const color = teamColor(index);
            return (
              <div
                key={index}
                className="rounded-[11px] border border-white/[0.07] bg-white/[0.035] px-2.5 py-[9px]"
                style={{ borderTop: `2px solid ${color.hex}` }}
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <span
                    className="font-display text-xs font-bold uppercase"
                    style={{ color: color.hex }}
                  >
                    {color.name}
                  </span>
                  <span className="font-display text-xs font-bold text-white/85">
                    ★{team.totalStars}
                  </span>
                </div>
                <div className="flex flex-col gap-[3px]">
                  {team.players.map((player, playerIndex) => {
                    const meta = POSITION_META[player.position];
                    return (
                      <div
                        key={`${player.name}-${playerIndex}`}
                        className="flex items-center gap-[5px]"
                      >
                        <span
                          className="w-5 shrink-0 font-display text-[8.5px] font-bold uppercase tracking-[0.03em]"
                          style={{ color: meta.accent }}
                        >
                          {meta.short}
                        </span>
                        <span className="min-w-0 flex-1 truncate font-sans text-[10.5px] font-semibold text-white/85">
                          {player.name}
                        </span>
                        <span className="shrink-0">
                          <StarRow stars={player.stars} size={7} gap={1} />
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </BottomSheet>
  );
}

export default function DrawPage() {
  const { peladaId } = useParams<{ peladaId: string }>();
  const router = useRouter();
  const { data: pelada } = usePelada(peladaId);
  const drawMutation = useDrawTeams(peladaId);

  const config = useDrawConfig(peladaId);
  const [drawKey, setDrawKey] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const started = useRef(false);

  const { mutate } = drawMutation;

  // dispara o sorteio com a configuração feita na tela da pelada
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const stored = loadDrawConfig(peladaId);
    if (!stored) {
      router.replace(`/peladas/${peladaId}`);
      return;
    }
    mutate(stored, { onSuccess: () => setDrawKey((key) => key + 1) });
  }, [peladaId, router, mutate]);

  function redraw() {
    if (!config || drawMutation.isPending) return;
    drawMutation.mutate(config, {
      onSuccess: () => setDrawKey((key) => key + 1),
    });
  }

  const teams = drawMutation.data?.data.draw.teams;
  const peladaName = pelada?.name ?? "Pelada";

  return (
    <div className="flex flex-1 flex-col">
      <TopBar
        title="Sorteio"
        onBack={() => router.push(`/peladas/${peladaId}`)}
        right={
          teams && (
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              aria-label="Compartilhar"
              className="grid size-10 place-items-center rounded-xl bg-accent-soft text-primary transition active:scale-90"
            >
              <Share2 className="size-[19px]" />
            </button>
          )
        }
      />

      <div className="flex-1 px-4 pb-3">
        {/* hero */}
        <div className="mb-4 animate-fade-up">
          <div className="mb-[5px] font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
            {peladaName}
          </div>
          <h1 className="font-display text-[30px] leading-[0.95] font-bold uppercase text-foreground">
            Times Sorteados
          </h1>
          {config && (
            <div className="mt-[11px] flex gap-[7px]">
              <PrivBadge tone="draw">
                <Trophy className="size-[11px]" /> {config.teamsQuantity} times
              </PrivBadge>
              <PrivBadge tone={config.withPosition ? "manage" : "muted"}>
                {config.withPosition
                  ? "Equilíbrio por posição"
                  : "Equilíbrio por estrelas"}
              </PrivBadge>
            </div>
          )}
        </div>

        {drawMutation.isPending && (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-48 rounded-[18px]" />
            <Skeleton className="h-48 rounded-[18px]" />
          </div>
        )}

        {drawMutation.isError && !drawMutation.isPending && (
          <div className="rounded-[18px] border border-line-soft bg-card p-6 text-center">
            <p className="font-sans text-sm text-muted-foreground">
              {getApiErrorMessage(drawMutation.error)}
            </p>
            <AppButton
              variant="secondary"
              size="sm"
              onClick={redraw}
              className="mx-auto mt-4"
            >
              Tentar novamente
            </AppButton>
          </div>
        )}

        {teams && !drawMutation.isPending && (
          <div key={drawKey} className="flex flex-col gap-[13px]">
            {teams.map((team, index) => (
              <TeamPanel
                key={index}
                team={team}
                color={teamColor(index)}
                startIndex={teams
                  .slice(0, index)
                  .reduce((sum, t) => sum + t.players.length, 0)}
                baseDelay={index * 90}
              />
            ))}
          </div>
        )}
      </div>

      {/* ações */}
      <div className="sticky bottom-0 z-40 flex gap-2.5 border-t border-line-soft bg-[color-mix(in_oklch,var(--surface)_90%,transparent)] px-4 pt-3 pb-3.5 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setShareOpen(true)}
          disabled={!teams}
          aria-label="Compartilhar"
          className="grid h-[54px] w-14 shrink-0 place-items-center rounded-2xl border border-line bg-card-hi text-foreground transition active:scale-95 disabled:opacity-40"
        >
          <Share2 className="size-[21px]" />
        </button>
        <button
          type="button"
          onClick={redraw}
          disabled={drawMutation.isPending || !config}
          className="flex h-[54px] flex-1 items-center justify-center gap-[9px] rounded-2xl transition active:scale-[0.98] disabled:opacity-60"
          style={{
            background:
              "linear-gradient(120deg, var(--accent-color), var(--accent-press))",
            color: "var(--accent-ink)",
            boxShadow: "0 14px 30px -12px var(--accent-color)",
          }}
        >
          <Shuffle className="size-[21px]" strokeWidth={2.2} />
          <span className="font-display text-[17px] font-bold uppercase tracking-[0.02em] whitespace-nowrap">
            {drawMutation.isPending ? "Sorteando..." : "Refazer Sorteio"}
          </span>
        </button>
      </div>

      {teams && (
        <ShareSheet
          open={shareOpen}
          onOpenChange={setShareOpen}
          peladaName={peladaName}
          teams={teams}
        />
      )}
    </div>
  );
}
