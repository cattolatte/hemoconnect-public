import Link from "next/link";
import { Button } from "@/components/ui/button"; // Use correct alias

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <header className="mb-12">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-primary sm:text-5xl md:text-6xl">
          ✨ Welcome to HemoConnect
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
          An AI-powered community designed to connect individuals with
          hemophilia based on shared experiences, challenges, and stages of
          life.
        </p>
      </header>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Link href="/login" passHref>
          <Button size="lg">Login</Button>
        </Link>
        <Link href="/signup" passHref>
          <Button size="lg" variant="outline">
            Sign Up
          </Button>
        </Link>
      </div>

      <footer className="mt-16 text-sm text-muted-foreground">
        Building meaningful connections.
      </footer>
    </div>
  );
}