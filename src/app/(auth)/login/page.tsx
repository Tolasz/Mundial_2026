import type { Metadata } from "next"
import LoginForm from "./LoginForm"

export const metadata: Metadata = {
  title: "Logowanie — Mundial Typer 2026",
}

export default function LoginPage() {
  return <LoginForm />
}
