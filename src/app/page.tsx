import {
  ArrowDown,
  Database,
  Server,
  Smartphone,
  MonitorSmartphone,
} from "lucide-react";
import { getApkRelease, isApkAvailable } from "@/config/apk-release";
import type { ApkReleaseStatus } from "@/types/knowledge-base";
import { Hero } from "@/components/home/hero";
import { ModuleGrid } from "@/components/home/module-grid";
import { DesignPreview } from "@/components/home/design-preview";
import { InstallAppBanner } from "@/components/apk/install-app-banner";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const pipeline = [
  {
    icon: Database,
    title: "Islamic Knowledge Base",
    text: "Books, Quran, Hadith and citations prepared by a dedicated ingestion pipeline.",
  },
  {
    icon: Server,
    title: "Backend API",
    text: "Clean REST endpoints for books, search and source-grounded AI answers.",
  },
  {
    icon: MonitorSmartphone,
    title: "Web & Android",
    text: "One shared experience in the browser and as an installable Android app.",
  },
];

export default async function HomePage() {
  const { available, reason } = await isApkAvailable();
  const status: ApkReleaseStatus = {
    release: getApkRelease(),
    available,
    reason,
  };

  return (
    <main className="flex-1">
      <Hero />

      <div className="mx-auto max-w-6xl px-4">
        <div className="mt-6 sm:mt-8">
          <InstallAppBanner status={status} />
        </div>
      </div>

      <ModuleGrid />

      {/* Architecture strip — transparency about how content flows */}
      <section className="border-t bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="mb-8 text-center">
            <h2 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
              Powered by your Knowledge Base
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
              The app is the interface — never the source of truth. Content
              flows one way, from an approved pipeline to your screen.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {pipeline.map((step, i) => (
              <Card key={step.title} className="relative">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <step.icon
                        className="h-5 w-5 text-primary"
                        aria-hidden="true"
                      />
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Step {i + 1}
                    </span>
                  </div>
                  <h3 className="mt-3 font-serif font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {step.text}
                  </p>
                </CardContent>
                {i < pipeline.length - 1 ? (
                  <ArrowDown
                    className="absolute -bottom-7 left-1/2 hidden h-5 w-5 -translate-x-1/2 text-muted-foreground/40 md:hidden"
                    aria-hidden="true"
                  />
                ) : null}
              </Card>
            ))}
          </div>
        </div>
      </section>

      <DesignPreview />
    </main>
  );
}
