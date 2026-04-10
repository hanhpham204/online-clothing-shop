import type { Metadata } from "next";
import RegisterScreen from "@/components/auth/register-screen";

export const metadata: Metadata = {
  title: "Register",
  description: "Register page",
};

export default function RegisterPage() {
  return <RegisterScreen />;
}
