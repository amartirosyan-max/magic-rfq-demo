import { LoginForm } from "~/components/login-form";
import LogoMindware from "~/assets/logo_mindware.svg?react";
import { useNavigate } from "react-router";
import { ELocalStorageKey } from "~/constants/localstorage";
import { useAuth as useAuthQuery } from "~/api/signin";
import { useAuth } from "~/context/AuthContext";

export default function Page() {
  const navigate = useNavigate();
  const { mutate: signin, isPending, error } = useAuthQuery();
  const { setUser } = useAuth();

  const handleLogin = (credentials: { login: string; password: string }) => {
    signin(credentials, {
      onSuccess: () => {
        window.localStorage.setItem(ELocalStorageKey.IsUserLoggedIn, "true");
        setUser({
          login: credentials.login,
        });
        navigate("/dashboard");
      },
      onError: (error) => {
        console.error("Login failed:", error);
      },
    });
  };

  return (
    <div className="flex items-center flex-col h-screen">
      <div className="flex items-center justify-center w-full p-9 gap-8">
        <LogoMindware className="text-[var(--primary)] mb" />
        <span
          className="
          text-[var(--secondary)]
          font-semibold
          text-[27px]
          leading-[110%]
          tracking-widest
          uppercase
          select-none
        "
        >
          MAGIC
        </span>
      </div>
      <div className="flex w-full items-center justify-center h-full">
        <div className="w-full max-w-sm">
          <LoginForm
            onLogin={handleLogin}
            isLoading={isPending}
            error={error?.message}
          />
        </div>
      </div>
    </div>
  );
}
