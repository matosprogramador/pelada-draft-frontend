"use client";

import { toPng } from "html-to-image";
import { ImageDown, Share2, Shuffle, Trophy, Volleyball } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { TeamPanel } from "@/components/draw/team-panel";
import { usePeladaDraft } from "@/components/peladas/pelada-draft-context";
import { StarRow } from "@/components/players/star-row";
import { AppButton } from "@/components/shared/app-button";
import { BottomSheet } from "@/components/shared/bottom-sheet";
import { PrivBadge } from "@/components/shared/priv-badge";
import { TopBar } from "@/components/shared/top-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage } from "@/lib/api/axios";
import { usePelada } from "@/lib/hooks/use-peladas";
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
  const previewRef = useRef<HTMLDivElement>(null);
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

  async function shareImage() {
    if (!previewRef.current) return;
    try {
      const el = previewRef.current;
      el.style.borderRadius = "0";
      const dataUrl = await toPng(el, { pixelRatio: 2 });
      el.style.borderRadius = "";
      const fileName = `times-${peladaName.toLowerCase().replace(/\s+/g, "-")}.png`;

      const canShareFiles =
        typeof navigator.share === "function" &&
        navigator.canShare?.({
          files: [new File([""], "test.png", { type: "image/png" })],
        });

      if (canShareFiles) {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], fileName, { type: "image/png" });
        await navigator.share({ title: `Times — ${peladaName}`, files: [file] });
      } else {
        const link = document.createElement("a");
        link.download = fileName;
        link.href = dataUrl;
        link.click();
      }
    } catch {
      previewRef.current.style.borderRadius = "";
      toast.error("Não foi possível exportar a imagem.");
    }
  }

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Compartilhar times"
      footer={
        <div className="flex flex-col gap-2">
          <div className="flex gap-2.5">
            <AppButton variant="secondary" icon={Share2} onClick={copy} className="px-3 shrink-0">
              Copiar texto
            </AppButton>
            <AppButton full onClick={shareWhatsApp}>
              WhatsApp
            </AppButton>
          </div>
          <AppButton variant="soft" full icon={ImageDown} onClick={shareImage}>
            Salvar como imagem
          </AppButton>
        </div>
      }
    >
      {/* prévia do gráfico exportável */}
      <div
        ref={previewRef}
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
            <div className="font-display text-[0.9375rem] leading-none font-bold uppercase text-white">
              {peladaName}
            </div>
            <div className="font-sans text-[0.65625rem] font-semibold text-white/50">
              {date} · {teams.length} times
            </div>
          </div>
          <div className="font-display text-[0.625rem] font-bold uppercase tracking-[0.06em] text-primary">
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
  const { draw, drawKey, runDraw, teamsQuantity, withPosition } =
    usePeladaDraft();

  const [shareOpen, setShareOpen] = useState(false);

  const orphan = draw.isIdle && !draw.data;
  useEffect(() => {
    if (orphan) router.replace(`/peladas/${peladaId}`);
  }, [orphan, peladaId, router]);

  const teams = draw.data?.data.draw;
  const peladaName = pelada?.name ?? "Pelada";

  if (orphan) return null;

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

      <div className="flex-1 px-4 pb-3 lg:px-0">
        {/* hero */}
        <div className="mb-4 animate-fade-up">
          <div className="mb-[5px] font-sans text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-primary">
            {peladaName}
          </div>
          <h1 className="font-display text-[1.875rem] leading-[0.95] font-bold uppercase text-foreground">
            Times Sorteados
          </h1>
          <div className="mt-[11px] flex gap-[7px]">
            <PrivBadge tone="draw">
              <Trophy className="size-[11px]" /> {teamsQuantity} times
            </PrivBadge>
            <PrivBadge tone={withPosition ? "manage" : "muted"}>
              {withPosition
                ? "Equilíbrio por posição"
                : "Equilíbrio por estrelas"}
            </PrivBadge>
          </div>
        </div>

        {draw.isPending && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Skeleton className="h-48 rounded-[18px]" />
            <Skeleton className="h-48 rounded-[18px]" />
          </div>
        )}

        {draw.isError && !draw.isPending && (
          <div className="rounded-[18px] border border-line-soft bg-card p-6 text-center">
            <p className="font-sans text-sm text-muted-foreground">
              {getApiErrorMessage(draw.error)}
            </p>
            <AppButton
              variant="secondary"
              size="sm"
              onClick={runDraw}
              className="mx-auto mt-4"
            >
              Tentar novamente
            </AppButton>
          </div>
        )}

        {teams && !draw.isPending && (
          <div
            key={drawKey}
            className="grid grid-cols-1 gap-[13px] sm:grid-cols-2 xl:grid-cols-3"
          >
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
          onClick={runDraw}
          disabled={draw.isPending}
          className="flex h-[54px] flex-1 items-center justify-center gap-[9px] rounded-2xl transition active:scale-[0.98] disabled:opacity-60"
          style={{
            background:
              "linear-gradient(120deg, var(--accent-color), var(--accent-press))",
            color: "var(--accent-ink)",
            boxShadow: "0 14px 30px -12px var(--accent-color)",
          }}
        >
          <Shuffle className="size-[21px]" strokeWidth={2.2} />
          <span className="font-display text-[1.0625rem] font-bold uppercase tracking-[0.02em] whitespace-nowrap">
            {draw.isPending ? "Sorteando..." : "Refazer Sorteio"}
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
