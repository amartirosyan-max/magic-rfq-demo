import { useState } from "react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

interface LoginFormProps extends React.ComponentProps<"div"> {
  onLogin: (credentials: { login: string; password: string }) => void;
  isLoading?: boolean;
  error?: string;
}

export function LoginForm({
  className,
  onLogin,
  isLoading,
  error: serverError,
  ...props
}: React.ComponentProps<"div"> & LoginFormProps) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    onLogin({ login, password });
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-black">Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3 text-black">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="login"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={login}
                  onChange={(e) => {
                    setLogin(e.target.value);
                    error && setError("");
                  }}
                  error={error !== "" && login.length > 0}
                />
              </div>
              <div className="grid gap-3 text-black">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    error && setError("");
                  }}
                  error={error !== "" && password.length > 0}
                />
              </div>
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full">
                  Login
                </Button>
                {error && (
                  <div className="text-center text-sm text-red-500">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
