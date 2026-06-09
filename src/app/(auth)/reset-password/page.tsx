import type { Metadata } from "next"
import ResetPasswordForm from "./ResetPasswordForm"

export const metadata: Metadata = {
  title: "Nowe hasło — Mundial Typer 2026",
}

export default function ResetPasswordPage() {
  return <ResetPasswordForm />
}
