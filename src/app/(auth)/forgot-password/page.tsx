import type { Metadata } from "next"
import ForgotPasswordForm from "./ForgotPasswordForm"

export const metadata: Metadata = {
  title: "Przypomnienie hasła — Mundial Typer 2026",
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />
}
