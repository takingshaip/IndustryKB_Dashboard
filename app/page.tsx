import { Suspense } from "react"
import { KnowledgeBaseTable } from "@/components/knowledge-bases/knowledge-base-table"
import { AddKnowledgeBaseDialog } from "@/components/knowledge-bases/add-knowledge-base-dialog"

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-balance text-2xl font-semibold">Knowledge Bases</h1>
          <p className="text-sm text-(--color-muted-foreground)">
            Create and manage industry knowledge bases by target country and industry created for.
          </p>
        </div>
        <Suspense fallback={null}>
          <AddKnowledgeBaseDialog />
        </Suspense>
      </header>

      <section
        aria-labelledby="kb-list-heading"
        className="rounded-lg border border-(--color-border) bg-(--color-card)"
      >
        <h2 id="kb-list-heading" className="sr-only">
          Knowledge base list
        </h2>
        <KnowledgeBaseTable />
      </section>
    </main>
  )
}
