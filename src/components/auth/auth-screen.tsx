"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { User, Volleyball } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { AppButton } from "@/components/shared/app-button";
import { Field, PasswordTextField, TextField } from "@/components/shared/field";
import { TermsModal } from "@/components/shared/terms-modal";
import { useLogin, useRegister } from "@/lib/hooks/use-auth";
import {
  loginSchema,
  registerSchema,
  type LoginFormValues,
  type RegisterFormValues,
} from "@/lib/validations/auth";

function Logo() {
  return (
    <div className="mb-6.5 flex items-center gap-3 animate-fade-up">
      <div
        className="grid size-14 shrink-0 place-items-center rounded-2xl shadow-[0_0.875rem_1.875rem_-0.625rem_var(--accent-color)]"
        style={{
          background:
            "linear-gradient(150deg, var(--accent-color), var(--accent-press))",
        }}
      >
        <Volleyball
          className="size-8"
          strokeWidth={1.7}
          style={{ color: "var(--accent-ink)" }}
        />
      </div>
      <div>
        <div className="font-display text-3xl leading-[0.95] font-bold uppercase tracking-[0.01em] text-foreground">
          Pelada<span className="text-primary">Draft</span>
        </div>
        <div className="mt-1 font-sans text-[0.78rem] font-semibold text-faint">
          Times equilibrados em segundos
        </div>
      </div>
    </div>
  );
}

function Segmented({ mode }: { mode: "login" | "register" }) {
  const options = [
    { key: "login", label: "Entrar", href: "/login" },
    { key: "register", label: "Criar conta", href: "/register" },
  ] as const;
  return (
    <div className="mb-5.5 flex gap-1 rounded-[0.875rem] border border-line-soft bg-card p-1 animate-fade-up">
      {options.map((option) => {
        const on = mode === option.key;
        return (
          <Link
            key={option.key}
            href={option.href}
            replace
            className={`flex min-h-11 flex-1 items-center justify-center rounded-[0.625rem] font-sans text-sm font-bold transition ${
              on
                ? "bg-primary text-primary-foreground"
                : "bg-transparent text-muted-foreground"
            }`}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}

function Shell({
  mode,
  children,
}: {
  mode: "login" | "register";
  children: React.ReactNode;
}) {
  const [termsOpen, setTermsOpen] = useState(false);

  return (
    <div className="noscroll flex flex-1 flex-col overflow-y-auto md:flex-none">
      <div className="flex flex-1 flex-col justify-center px-6.5 py-8 md:rounded-3xl md:border md:border-line-soft md:bg-surface md:px-10 md:py-10 md:shadow-card">
        <Logo />
        <Segmented mode={mode} />
        <div className="animate-fade-up">{children}</div>
        <Divider />
        <GoogleButton />
      </div>
      <div className="px-6.5 pt-3.5 pb-6.5 text-center">
        <span className="text-[0.72rem] text-faint">
          Ao continuar você concorda com os{" "}
          <button
            type="button"
            onClick={() => setTermsOpen(true)}
            className="text-primary underline-offset-2 hover:underline"
          >
            Termos de Serviço e Privacidade
          </button>{" "}
          ⚽
        </span>
      </div>
      <TermsModal open={termsOpen} onOpenChange={setTermsOpen} />
    </div>
  );
}

export function LoginScreen({ redirectTo }: { redirectTo?: string }) {
  const loginMutation = useLogin(redirectTo);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  return (
    <Shell mode="login">
      <form
        onSubmit={handleSubmit((values) => loginMutation.mutate(values))}
        noValidate
      >
        <Field label="E-mail ou username" error={errors.identifier?.message}>
          <TextField
            icon={User}
            placeholder="seu@email.com"
            autoComplete="username"
            invalid={!!errors.identifier}
            {...register("identifier")}
          />
        </Field>
        <Field label="Senha" error={errors.password?.message}>
          <PasswordTextField
            placeholder="Sua senha"
            autoComplete="current-password"
            invalid={!!errors.password}
            {...register("password")}
          />
        </Field>
        <AppButton
          type="submit"
          full
          size="lg"
          className="mt-1"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? "Entrando..." : "Entrar"}
        </AppButton>
      </form>
      <div className="mt-4 text-center">
        <Link
          href="/register"
          replace
          className="inline-block py-2 font-sans text-[0.84rem] font-semibold text-muted-foreground"
        >
          Não tem conta?{" "}
          <span className="text-primary">Criar nova conta</span>
        </Link>
      </div>
    </Shell>
  );
}

export function RegisterScreen() {
  const registerMutation = useRegister();
  const [termsOpen, setTermsOpen] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
      passwordConfirmation: "",
      acceptedTerms: false,
    },
  });

  return (
    <Shell mode="register">
      <form
        onSubmit={handleSubmit((values) => registerMutation.mutate(values))}
        noValidate
      >
        <Field label="E-mail" error={errors.email?.message}>
          <TextField
            icon={User}
            type="email"
            placeholder="seu@email.com"
            autoComplete="email"
            invalid={!!errors.email}
            {...register("email")}
          />
        </Field>
        <Field label="Username" error={errors.username?.message}>
          <TextField
            icon={User}
            placeholder="comofica"
            autoComplete="username"
            invalid={!!errors.username}
            {...register("username")}
          />
        </Field>
        <Field label="Senha" error={errors.password?.message}>
          <PasswordTextField
            placeholder="Mín. 6 caracteres"
            autoComplete="new-password"
            invalid={!!errors.password}
            {...register("password")}
          />
        </Field>
        <Field
          label="Confirmar senha"
          error={errors.passwordConfirmation?.message}
        >
          <PasswordTextField
            placeholder="Repita a senha"
            autoComplete="new-password"
            invalid={!!errors.passwordConfirmation}
            {...register("passwordConfirmation")}
          />
        </Field>

        {/* terms checkbox */}
        <label className="mb-4 flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5 size-4.5 shrink-0 accent-[var(--accent-color)] cursor-pointer"
            {...register("acceptedTerms")}
          />
          <span className="font-sans text-[0.8125rem] leading-snug text-muted-foreground">
            Li e aceito os{" "}
            <button
              type="button"
              onClick={() => setTermsOpen(true)}
              className="text-primary underline-offset-2 hover:underline"
            >
              Termos de Serviço e Política de Privacidade
            </button>
          </span>
        </label>
        {errors.acceptedTerms && (
          <span className="-mt-2 mb-3.5 block text-[0.71875rem] font-semibold text-danger">
            {errors.acceptedTerms.message}
          </span>
        )}

        <AppButton
          type="submit"
          full
          size="lg"
          className="mt-1"
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? "Criando conta..." : "Criar conta"}
        </AppButton>
      </form>
      <TermsModal open={termsOpen} onOpenChange={setTermsOpen} />
    </Shell>
  );
}

function GoogleButton() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  return (
    <a href={`${apiUrl}/auth/google`} className="block">
      <AppButton type="button" full size="lg" variant="outline">
        <span className="flex items-center justify-center gap-2">
          <GoogleIcon />
          Continuar com Google
        </span>
      </AppButton>
    </a>
  );
}

function GoogleIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function Divider() {
  return (
    <div className="my-4 flex items-center gap-3">
      <div className="h-px flex-1 bg-line-soft" />
      <span className="text-[0.72rem] font-semibold text-faint">ou</span>
      <div className="h-px flex-1 bg-line-soft" />
    </div>
  );
}