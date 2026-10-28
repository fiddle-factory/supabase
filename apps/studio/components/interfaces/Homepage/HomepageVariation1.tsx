import { ArrowRight, Database, ShieldCheck, Zap } from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge, Button, Card, CardContent } from 'ui'

import { BASE_PATH } from '@/lib/constants'

const NAV_LINKS = ['Product', 'Developers', 'Pricing', 'Docs', 'Blog']

const FEATURES: { icon: ReactNode; title: string; description: string }[] = [
  {
    icon: <Database size={18} strokeWidth={1.5} />,
    title: 'Postgres database',
    description:
      'Every project is a full Postgres database, with realtime functionality, backups, and extensions.',
  },
  {
    icon: <ShieldCheck size={18} strokeWidth={1.5} />,
    title: 'Built-in authentication',
    description:
      'Add user sign-ups and logins, and secure your data with Row Level Security policies.',
  },
  {
    icon: <Zap size={18} strokeWidth={1.5} />,
    title: 'Edge Functions',
    description:
      'Write custom code without deploying or scaling servers, with fast cold starts worldwide.',
  },
]

const FOOTER_LINKS = ['Privacy', 'Terms', 'Status', 'Contact']

export const HomepageVariation1 = () => {
  return (
    <div className="flex min-h-screen flex-col bg-studio text-foreground">
      <header className="border-b border-default">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-10">
            <a href="#" className="flex items-center" aria-label="Home">
              <img
                src={`${BASE_PATH}/img/homepage/logo.png`}
                alt="Logo"
                className="h-8 w-16 rounded-sm object-cover"
              />
            </a>
            <nav className="hidden items-center gap-6 md:flex">
              {NAV_LINKS.map((link) => (
                <a
                  key={link}
                  href="#"
                  className="text-sm text-foreground-light transition-colors hover:text-foreground"
                >
                  {link}
                </a>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="default" size="small">
              Sign in
            </Button>
            <Button variant="primary" size="small">
              Start your project
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto flex w-full max-w-4xl flex-col items-center px-6 py-24 text-center md:py-32">
          <Badge variant="success" className="mb-6">
            Now in general availability
          </Badge>
          <h1 className="text-4xl font-medium tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Build in a weekend
            <br />
            <span className="text-brand">Scale to millions</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base text-foreground-light md:text-lg">
            Start your project with a Postgres database, authentication, instant APIs, Edge
            Functions, realtime subscriptions, storage, and vector embeddings.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button variant="primary" size="medium" iconRight={<ArrowRight />}>
              Start your project
            </Button>
            <Button variant="default" size="medium">
              Request a demo
            </Button>
          </div>
        </section>

        <section className="border-t border-default bg-alternative">
          <div className="mx-auto w-full max-w-6xl px-6 py-20">
            <div className="mb-12 max-w-xl">
              <p className="font-mono text-xs uppercase tracking-wider text-foreground-lighter">
                Features
              </p>
              <h2 className="mt-3 text-2xl font-medium text-foreground md:text-3xl">
                Everything you need to ship
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {FEATURES.map((feature) => (
                <Card key={feature.title}>
                  <CardContent className="flex flex-col gap-4 p-6">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md border border-default bg-surface-200 text-foreground-light">
                      {feature.icon}
                    </div>
                    <div className="flex flex-col gap-2">
                      <h3 className="text-base text-foreground">{feature.title}</h3>
                      <p className="text-sm text-foreground-lighter">{feature.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-default">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row">
          <div className="flex items-center gap-3">
            <img
              src={`${BASE_PATH}/img/homepage/logo.png`}
              alt="Logo"
              className="h-5 w-10 rounded-sm object-cover"
            />
            <p className="text-xs text-foreground-lighter">© 2025 All rights reserved.</p>
          </div>
          <nav className="flex items-center gap-6">
            {FOOTER_LINKS.map((link) => (
              <a
                key={link}
                href="#"
                className="text-xs text-foreground-lighter transition-colors hover:text-foreground"
              >
                {link}
              </a>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  )
}
