"use client"
import { useKnowledgeBases, type KnowledgeBase } from "@/hooks/use-knowledge-bases"
import { Button } from "@/components/ui/button"
import { Download, ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"

function downloadJSON(filename: string, data: unknown) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: "application/json;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

const ITEMS_PER_PAGE = 10

export function KnowledgeBaseTable() {
  const { list, isLoading, error } = useKnowledgeBases()
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(list.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentItems = list.slice(startIndex, endIndex)

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading knowledge bases...</div>
  }

  if (error) {
    return (
      <div className="p-6 text-sm text-red-500">
        Error loading knowledge bases: {error.message}
      </div>
    )
  }

  if (!list.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-10 text-center">
        <p className="text-sm text-muted-foreground">No knowledge bases yet.</p>
        <p className="text-xs text-muted-foreground">Use "Add Knowledge Base" to create your first record.</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[640px] border-t border-border text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 text-left font-medium">
                Industry Name
              </th>
              <th scope="col" className="px-4 py-3 text-left font-medium">
                Target Country
              </th>
              <th scope="col" className="px-4 py-3 text-center font-medium">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                Download
              </th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((kb) => (
              <Row key={kb.id} kb={kb} />
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, list.length)} of {list.length} entries
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="text-sm">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ kb }: { kb: KnowledgeBase }) {
  return (
    <tr className="border-b border-border">
      <td className="px-4 py-3 align-middle">
        <div className="flex flex-col">
          <span className="font-medium">{kb.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 align-middle">{kb.country}</td>
      <td className="px-4 py-3 align-middle text-center">
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
          kb.status 
            ? 'bg-green-100 text-green-700' 
            : 'bg-gray-100 text-gray-700'
        }`}>
          {kb.status ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-4 py-3 align-middle">
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Download ${kb.name} knowledge base`}
            onClick={() => downloadJSON(`knowledge-base-${kb.id}.json`, kb)}
            className="hover:bg-accent hover:text-accent-foreground"
            title="Download JSON"
          >
            <Download className="size-5" />
            <span className="sr-only">Download</span>
          </Button>
        </div>
      </td>
    </tr>
  )
}