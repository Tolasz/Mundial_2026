import type { Metadata } from "next"
import RegisterForm from "./RegisterForm"

export const metadata: Metadata = {
  title: "Rejestracja — Mundial Typer 2026",
}

export default function RegisterPage() {
  return <RegisterForm />
}
