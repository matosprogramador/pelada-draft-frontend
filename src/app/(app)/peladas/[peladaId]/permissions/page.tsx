"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Check, Crown, Plus, ShieldAlert, Trash2, User } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { AppButton } from "@/components/shared/app-button";
import { Field, TextField } from "@/components/shared/field";
import { PrivBadge } from "@/components/shared/priv-badge";
import { TopBar } from "@/components/shared/top-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage } from "@/lib/api/axios";
import { managePermission } from "@/lib/api/permissions";
import { usePelada } from "@/lib/hooks/use-peladas";
import { permissionKeys, usePermissions } from "@/lib/hooks/use-permissions";
import type { PermissionUser, Privilege } from "@/types/api";

const MANAGE_ACCENT = "oklch(0.78 0.12 178)";

type PrivState = { manage: boolean; draw: boolean };

function baseOf(user: PermissionUser): PrivState {
  return {
    manage: user.privileges.includes("MANAGE_PLAYERS"),
    draw: user.privileges.includes("DRAW_TEAMS"),
  };
}

function PermToggle({
  on,
  accent,
  disabled,
  onClick,
  label,
}: {
  on: boolean;
  accent: string;
  disabled?: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="h-[26px] w-11 shrink-0 rounded-full p-[3px] transition-all disabled:opacity-50"
      style={{ background: on ? accent : "var(--line)" }}
    >
      <span
        className="block size-5 rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.3)] transition-transform"
        style={{ transform: on ? "translateX(18px)" : "none" }}
      />
    </button>
  );
}

export default function PermissionsPage() {
  const { peladaId } = useParams<{ peladaId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: pelada } = usePelada(peladaId);
  const { data: users, isLoading, isError, error } = usePermissions(peladaId);

  const [identifier, setIdentifier] = useState("");
  const [grantChoice, setGrantChoice] = useState<Privilege | "ALL">("DRAW_TEAMS");
  const [pending, setPending] = useState<Record<string, PrivState>>({});
  const [busy, setBusy] = useState(false);

  async function applyChanges(
    userIdentifier: string,
    changes: Array<{ privilege: Privilege; action: "ASSIGN" | "REVOKE" }>,
    successMessage: string
  ) {
    setBusy(true);
    try {
      for (const change of changes) {
        await managePermission(peladaId, { userIdentifier, ...change });
      }
      toast.success(successMessage);
      return true;
    } catch (err) {
      toast.error(getApiErrorMessage(err));
      return false;
    } finally {
      setBusy(false);
      queryClient.invalidateQueries({ queryKey: permissionKeys.list(peladaId) });
    }
  }

  async function grant() {
    const target = identifier.trim();
    if (!target) {
      toast.error("Informe um username ou e-mail.");
      return;
    }
    const privileges: Privilege[] =
      grantChoice === "ALL" ? ["MANAGE_PLAYERS", "DRAW_TEAMS"] : [grantChoice];
    const ok = await applyChanges(
      target,
      privileges.map((privilege) => ({ privilege, action: "ASSIGN" as const })),
      "Acesso concedido."
    );
    if (ok) setIdentifier("");
  }

  function stateOf(user: PermissionUser): PrivState {
    return pending[user.username] ?? baseOf(user);
  }

  function changed(user: PermissionUser): boolean {
    const state = pending[user.username];
    if (!state) return false;
    const base = baseOf(user);
    return state.manage !== base.manage || state.draw !== base.draw;
  }

  function toggle(user: PermissionUser, key: keyof PrivState) {
    setPending((prev) => {
      const current = prev[user.username] ?? baseOf(user);
      return { ...prev, [user.username]: { ...current, [key]: !current[key] } };
    });
  }

  function cancel(user: PermissionUser) {
    setPending((prev) => {
      const next = { ...prev };
      delete next[user.username];
      return next;
    });
  }

  async function confirm(user: PermissionUser) {
    const state = stateOf(user);
    const base = baseOf(user);
    const changes: Array<{ privilege: Privilege; action: "ASSIGN" | "REVOKE" }> = [];
    if (state.manage !== base.manage) {
      changes.push({
        privilege: "MANAGE_PLAYERS",
        action: state.manage ? "ASSIGN" : "REVOKE",
      });
    }
    if (state.draw !== base.draw) {
      changes.push({
        privilege: "DRAW_TEAMS",
        action: state.draw ? "ASSIGN" : "REVOKE",
      });
    }
    const removing = !state.manage && !state.draw;
    const ok = await applyChanges(
      user.username,
      changes,
      removing ? "Acesso removido." : "Permissão atualizada."
    );
    if (ok) cancel(user);
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <Skeleton className="h-10 w-1/2 rounded-xl" />
        <Skeleton className="h-52 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-1 flex-col">
        <TopBar title="Permissões" onBack={() => router.push(`/peladas/${peladaId}`)} />
        <div className="mx-4 rounded-[18px] border border-line-soft bg-card px-6 py-10 text-center lg:mx-0">
          <span className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-danger-soft">
            <ShieldAlert className="size-6 text-danger" />
          </span>
          <h2 className="font-display text-lg font-semibold uppercase text-foreground">
            Acesso restrito
          </h2>
          <p className="mt-2 font-sans text-sm text-muted-foreground">
            {getApiErrorMessage(error)}
          </p>
          <AppButton
            onClick={() => router.push(`/peladas/${peladaId}`)}
            className="mx-auto mt-5"
          >
            Voltar para a pelada
          </AppButton>
        </div>
      </div>
    );
  }

  const list = users ?? [];

  return (
    <div className="flex flex-1 flex-col">
      <TopBar title="Permissões" onBack={() => router.push(`/peladas/${peladaId}`)} />

      <div className="flex-1 px-4 pb-6 lg:px-0 lg:pb-8">
        <p className="mb-4 font-sans text-[0.8125rem] leading-relaxed text-muted-foreground">
          Conceda a usuários o poder de{" "}
          <strong style={{ color: MANAGE_ACCENT }}>gerenciar jogadores</strong>,{" "}
          <strong className="text-primary">realizar sorteios</strong> ou{" "}
          <strong className="text-gold">tudo</strong>.
        </p>

        {/* two-column on desktop */}
        <div className="flex flex-col gap-0 lg:flex-row lg:items-start lg:gap-6">
          {/* conceder novo acesso */}
          <div className="mb-[18px] rounded-2xl border border-line-soft bg-card p-3.5 lg:mb-0 lg:w-72 lg:shrink-0">
            <div className="mb-3 font-display text-sm font-semibold uppercase text-foreground">
              Conceder permissão
            </div>
            <Field>
              <TextField
                icon={User}
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="username ou e-mail"
              />
            </Field>
            <div className="mb-2.5 flex gap-[7px]">
              {(
                [
                  ["DRAW_TEAMS", "Sortear"],
                  ["MANAGE_PLAYERS", "Gerenciar"],
                  ["ALL", "Todas"],
                ] as const
              ).map(([key, label]) => {
                const on = grantChoice === key;
                const gold = key === "ALL";
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setGrantChoice(key)}
                    className={`min-h-[2.5rem] flex-1 rounded-[10px] font-sans text-[0.78125rem] font-bold transition ${
                      on
                        ? gold
                          ? "bg-gold"
                          : "bg-primary text-primary-foreground"
                        : "border border-line-soft bg-card-hi text-muted-foreground"
                    }`}
                    style={on && gold ? { color: "oklch(0.2 0.05 90)" } : undefined}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <AppButton full icon={Plus} onClick={grant} disabled={busy}>
              Conceder acesso
            </AppButton>
          </div>

          {/* usuários com acesso */}
          <div className="flex-1 min-w-0">
            <div className="mb-2.5 font-sans text-[0.625rem] font-bold uppercase tracking-[0.12em] text-faint">
              Usuários com acesso · {list.length}
              {pelada ? ` + dono` : ""}
            </div>
            <div className="flex flex-col gap-2.5">
              {/* dono (sempre com tudo) */}
              {pelada && (
                <div className="rounded-[15px] border border-line-soft bg-card p-[13px]">
                  <div className="flex items-center gap-[11px]">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-card-hi text-primary">
                      <span className="font-display text-[0.9375rem] font-semibold uppercase">
                        {pelada.ownerUsername.slice(0, 2)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-sans text-sm font-bold text-foreground">
                        @{pelada.ownerUsername}
                      </div>
                      <div className="truncate font-sans text-[0.71875rem] text-faint">
                        Dono da pelada
                      </div>
                    </div>
                    <PrivBadge tone="owner">
                      <Crown className="size-[11px]" strokeWidth={2.4} /> Dono
                    </PrivBadge>
                  </div>
                </div>
              )}

              {list.length === 0 && (
                <p className="py-6 text-center font-sans text-[0.84375rem] text-muted-foreground">
                  Nenhum usuário com permissões nesta pelada ainda.
                </p>
              )}

              {list.map((user) => {
                const state = stateOf(user);
                const isChanged = changed(user);
                const removing = !state.manage && !state.draw;
                return (
                  <div
                    key={user.username}
                    className="rounded-[15px] border bg-card p-[13px]"
                    style={{
                      borderColor: isChanged
                        ? "color-mix(in oklch, var(--accent-color) 45%, var(--line-soft))"
                        : "var(--line-soft)",
                    }}
                  >
                    <div className="flex items-center gap-[11px]">
                      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-card-hi text-primary">
                        <span className="font-display text-[0.9375rem] font-semibold uppercase">
                          {user.username.slice(0, 2)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-sans text-sm font-bold text-foreground">
                          @{user.username}
                        </div>
                        <div className="truncate font-sans text-[0.71875rem] text-faint">
                          {user.email}
                        </div>
                      </div>
                      {state.manage && state.draw && (
                        <PrivBadge tone="owner">ALL</PrivBadge>
                      )}
                    </div>

                    <div className="mt-3 flex flex-col gap-[9px] border-t border-line-soft pt-[11px]">
                      {(
                        [
                          ["manage", "Gerenciar jogadores", MANAGE_ACCENT],
                          ["draw", "Realizar sorteios", "var(--accent-color)"],
                        ] as const
                      ).map(([key, label, accent]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="font-sans text-[0.8125rem] font-semibold text-muted-foreground">
                            {label}
                          </span>
                          <PermToggle
                            on={state[key]}
                            accent={accent}
                            disabled={busy}
                            label={`${label} de @${user.username}`}
                            onClick={() => toggle(user, key)}
                          />
                        </div>
                      ))}
                      {isChanged && (
                        <div className="mt-[3px] flex gap-2 animate-fade-up">
                          <AppButton
                            variant="secondary"
                            size="sm"
                            onClick={() => cancel(user)}
                            disabled={busy}
                            className="flex-1"
                          >
                            Cancelar
                          </AppButton>
                          {removing ? (
                            <AppButton
                              variant="danger"
                              size="sm"
                              icon={Trash2}
                              onClick={() => confirm(user)}
                              disabled={busy}
                              className="flex-1"
                            >
                              Remover acesso
                            </AppButton>
                          ) : (
                            <AppButton
                              size="sm"
                              icon={Check}
                              onClick={() => confirm(user)}
                              disabled={busy}
                              className="flex-1"
                            >
                              Confirmar
                            </AppButton>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
