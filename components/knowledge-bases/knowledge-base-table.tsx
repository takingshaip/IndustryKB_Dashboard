"use client"
import { useKnowledgeBases, type KnowledgeBase } from "@/hooks/use-knowledge-bases"
import { Button } from "@/components/ui/button"
import { Download, ChevronLeft, ChevronRight, Loader2, Trash2, Search, ArrowUpDown, RefreshCw } from "lucide-react"
import { useState, useMemo } from "react"
import axios from "axios"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"

const ITEMS_PER_PAGE = 10

type SortOrder = 'asc' | 'desc' | null

export function KnowledgeBaseTable() {
  const { list, isLoading, error } = useKnowledgeBases()
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortOrder, setSortOrder] = useState<SortOrder>(null)

  // Filter and sort logic
  const filteredAndSortedList = useMemo(() => {
    let result = [...list]
    
    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim()
      result = result.filter(kb => 
        kb.primary_industry?.toLowerCase().includes(searchLower) ||
        kb.name?.toLowerCase().includes(searchLower)
      )
    }
    
    // Apply sort
    if (sortOrder) {
      result.sort((a, b) => {
        const aValue = (a.primary_industry || '').toLowerCase()
        const bValue = (b.primary_industry || '').toLowerCase()
        
        if (sortOrder === 'asc') {
          return aValue.localeCompare(bValue)
        } else {
          return bValue.localeCompare(aValue)
        }
      })
    }
    
    return result
  }, [list, searchTerm, sortOrder])

  const totalPages = Math.ceil(filteredAndSortedList.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentItems = filteredAndSortedList.slice(startIndex, endIndex)

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1) // Reset to first page when searching
  }

  const handleSortToggle = () => {
    if (sortOrder === null) {
      setSortOrder('asc')
    } else if (sortOrder === 'asc') {
      setSortOrder('desc')
    } else {
      setSortOrder(null)
    }
    setCurrentPage(1) // Reset to first page when sorting
  }

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
      {/* Search Bar */}
      <div className="p-4 border-b border-border">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by Primary or Secondary Industry Name..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        {searchTerm && (
          <p className="text-sm text-muted-foreground mt-2">
            Found {filteredAndSortedList.length} result{filteredAndSortedList.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {filteredAndSortedList.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 p-10 text-center">
          <p className="text-sm text-muted-foreground">No knowledge bases found matching "{searchTerm}"</p>
          <Button
            variant="link"
            size="sm"
            onClick={() => setSearchTerm("")}
            className="text-xs"
          >
            Clear search
          </Button>
        </div>
      ) : (
        <>
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[800px] border-t border-border text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-medium">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSortToggle}
                      className="h-8 -ml-3 hover:bg-muted-foreground/10"
                    >
                      Primary Industry Name
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                      {sortOrder === 'asc' && <span className="ml-1 text-xs">↑</span>}
                      {sortOrder === 'desc' && <span className="ml-1 text-xs">↓</span>}
                    </Button>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">
                    Secondary Industry Name
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">
                    NAICS Code 
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">
                    Industry Created For Name
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">
                    Target Country
                  </th>
                  <th scope="col" className="px-4 py-3 text-center font-medium">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-center font-medium">
                    Display
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">
                    Actions
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
                Showing {startIndex + 1} to {Math.min(endIndex, filteredAndSortedList.length)} of {filteredAndSortedList.length} entries
                {searchTerm && ` (filtered from ${list.length} total)`}
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
        </>
      )}
    </div>
  )
}

function Row({ kb }: { kb: KnowledgeBase }) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [displayStatus, setDisplayStatus] = useState(kb.display ?? false)

  const handleToggleDisplay = async (checked: boolean) => {
    setIsToggling(true)
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
      const url = `${API_BASE_URL}/marketentry-playbook/marketEntryPlaybooks/${kb.id}`
      
      await axios.put(url, {
        display: checked
      })
      
      setDisplayStatus(checked)
    } catch (error) {
      console.error("Toggle error:", error)
      alert(`Failed to update display status: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setDisplayStatus(!checked)
    } finally {
      setIsToggling(false)
    }
  }

  const downloadMarkdown = async () => {
    if (!kb.status) {
      alert("Knowledge base is not active yet. Please wait for processing to complete.")
      return
    }

    setIsDownloading(true)
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
      const url = `${API_BASE_URL}/marketentry-playbook/downloadWiki`
      
      const response = await axios.post(url, {
        industryname: kb.name,
        country: kb.country
      }, {
        responseType: 'blob'
      })
      
      const blob = new Blob([response.data], { type: 'text/markdown' })
      const downloadUrl = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = downloadUrl
      a.download = `${kb.name}_${kb.country}_knowledge_base.md`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error("Download error:", error)
      alert(`Failed to download knowledge base: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete the knowledge base for "${kb.name}" in ${kb.country}? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(true)
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
      const url = `${API_BASE_URL}/marketentry-playbook/marketEntryPlaybook/${kb.id}`
      
      await axios.delete(url)
      
      alert("Knowledge base deleted successfully!")
      window.location.reload()
    } catch (error) {
      console.error("Delete error:", error)
      alert(`Failed to delete knowledge base: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRefresh = async () => {
    if (!confirm(`Are you sure you want to refresh the knowledge base for "${kb.name}" in ${kb.country}? This will update the knowledge base with the latest data.`)) {
      return
    }

    setIsRefreshing(true)
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
      const url = `${API_BASE_URL}/marketentry-playbook/refreshIndustryKb/${kb.id}`
      
      await axios.put(url)
      
      alert("Knowledge base refresh initiated successfully!")
      window.location.reload()
    } catch (error) {
      console.error("Refresh error:", error)
      alert(`Failed to refresh knowledge base: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <tr className="border-b border-border">
      <td className="px-4 py-3 align-middle">
        <div className="flex flex-col">
          <span className="font-medium">{kb.primary_industry}</span>
        </div>
      </td>
      <td className="px-4 py-3 align-middle">
        <div className="flex flex-col">
          <span className="font-medium">{kb.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 align-middle">
        <div className="flex flex-col">
          <span className="font-medium">{kb.naicsCode}</span>
        </div>
      </td>
      <td className="px-4 py-3 align-middle">
        <div className="flex flex-col">
          <span className="font-medium">{kb.industry_created_for}</span>
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
        <div className="flex items-center justify-center">
          <Switch
            checked={displayStatus}
            onCheckedChange={handleToggleDisplay}
            disabled={isToggling}
            aria-label={`Toggle display for ${kb.name}`}
          />
        </div>
      </td>
      <td className="px-4 py-3 align-middle">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Download ${kb.name} knowledge base`}
            onClick={downloadMarkdown}
            disabled={!kb.status || isDownloading}
            className="hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
            title={kb.status ? "Download Markdown" : "Processing... Download will be available soon"}
          >
            {isDownloading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Download className="size-5" />
            )}
            <span className="sr-only">Download</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Refresh ${kb.name} knowledge base`}
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="hover:bg-blue-100 hover:text-blue-600 disabled:opacity-50"
            title="Refresh knowledge base"
          >
            {isRefreshing ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <RefreshCw className="size-5" />
            )}
            <span className="sr-only">Refresh</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Delete ${kb.name} knowledge base`}
            onClick={handleDelete}
            disabled={isDeleting}
            className="hover:bg-red-100 hover:text-red-600 disabled:opacity-50"
            title="Delete knowledge base"
          >
            {isDeleting ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Trash2 className="size-5" />
            )}
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      </td>
    </tr>
  )
}