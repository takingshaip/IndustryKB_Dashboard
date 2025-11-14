"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useKnowledgeBases } from "@/hooks/use-knowledge-bases"
import { Loader2, Check, ChevronsUpDown } from "lucide-react"
import axios from "axios"
import { cn } from "@/lib/utils"

const COUNTRIES = ["USA", "Canada", "United Kingdom", "Germany", "India", "Australia", "Japan"]

export function AddKnowledgeBaseDialog() {
  const { refresh } = useKnowledgeBases()
  const [open, setOpen] = React.useState(false)

  const [naicsCode, setNaicsCode] = React.useState<string>("")
  const [industryName, setIndustryName] = React.useState<string>("")
  const [country, setCountry] = React.useState<string>("USA")
  const [targetIndustry, setTargetIndustry] = React.useState<string>("")
  const [primaryIndustry, setPrimaryIndustry] = React.useState<string>("")
  const [customPrimaryIndustry, setCustomPrimaryIndustry] = React.useState<string>("")
  const [display, setDisplay] = React.useState<boolean>(true)
  const [isLoadingNaics, setIsLoadingNaics] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [naicsError, setNaicsError] = React.useState<string>("")

  // State for industry categories
  const [industryCategories, setIndustryCategories] = React.useState<string[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = React.useState(false)
  const [categoriesError, setCategoriesError] = React.useState<string>("")

  // State for Industry Created For combobox
  const [industryCreatedForList, setIndustryCreatedForList] = React.useState<string[]>([])
  const [isLoadingCreatedFor, setIsLoadingCreatedFor] = React.useState(false)
  const [comboboxOpen, setComboboxOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

  const isValidNaicsCode = /^\d{6}$/.test(naicsCode)

  // Fetch industry categories on component mount
  React.useEffect(() => {
    async function fetchIndustryCategories() {
      setIsLoadingCategories(true)
      setCategoriesError("")

      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/marketentry-playbook/getIndustryCategories/`
        )
      
        const categories = response.data.categories.map((item: any) => item.name)

        if (!categories.includes("Others")) {
          categories.push("Others")
        }

        setIndustryCategories(categories)
      } catch (error) {
        console.error("Error fetching industry categories:", error)
        setCategoriesError("Failed to load industry categories")
      } finally {
        setIsLoadingCategories(false)
      }
    }

    fetchIndustryCategories()
  }, [])

  // Fetch Industry Created For list
  React.useEffect(() => {
    async function fetchIndustryCreatedForList() {
      setIsLoadingCreatedFor(true)

      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/marketentry-playbook/getIndustryCreatedForList`
        )
        
        // Assuming the API returns an array of strings or objects with a name property
        const list = response.data.categories;

        // If items are objects, extract the name/title property and filter out null/undefined
        const industryNames = list
          .map((item: any) => typeof item === 'string' ? item : item?.name)
          .filter((name: any) => name != null && name !== '')

        setIndustryCreatedForList(industryNames)
      } catch (error) {
        console.error("Error fetching industry created for list:", error)
        // Don't show error, just use empty list and allow manual input
        setIndustryCreatedForList([])
      } finally {
        setIsLoadingCreatedFor(false)
      }
    }

    fetchIndustryCreatedForList()
  }, [])

  function resetForm() {
    setNaicsCode("")
    setIndustryName("")
    setPrimaryIndustry("")
    setCustomPrimaryIndustry("")
    setCountry("USA")
    setTargetIndustry("")
    setSearchValue("")
    setDisplay(true)
    setNaicsError("")
  }

  async function fetchNaicsIndustryName() {
    if (!isValidNaicsCode) {
      setNaicsError("Please enter a valid 6-digit NAICS code")
      return
    }

    setIsLoadingNaics(true)
    setNaicsError("")

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/marketentry-playbook/getNAICScodes`,
        {
          naicscode: parseInt(naicsCode, 10),
        }
      )

      if (response.data.naicsData) {
        setIndustryName(response.data.naicsData["2022 NAICS US Title"])
        setNaicsError("")
      } else {
        setNaicsError("Industry name not found for this NAICS code")
      }
    } catch (error) {
      console.error("Error fetching NAICS code:", error)
      if (axios.isAxiosError(error)) {
        setNaicsError(error.response?.data?.message || "Failed to fetch NAICS information. Please try again.")
      } else {
        setNaicsError("Failed to fetch NAICS information. Please try again.")
      }
    } finally {
      setIsLoadingNaics(false)
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!industryName.trim()) {
      alert("Please provide an industry name.")
      return
    }
    if (!country) {
      alert("Please select a target country.")
      return
    }
    if (!targetIndustry.trim()) {
      alert("Please provide the industry created for.")
      return
    }
    if (!primaryIndustry) {
      alert("Please select a primary industry.")
      return
    }
    if (primaryIndustry === "Others" && !customPrimaryIndustry.trim()) {
      alert("Please enter a custom industry name.")
      return
    }

    setIsSubmitting(true)

    try {
      const payload: any = {
        industry: industryName.trim(),
        country: country,
        industry_created_for: targetIndustry.trim(),
        display: display,
      }

      if (primaryIndustry === "Others") {
        payload.other_primary_industry = customPrimaryIndustry.trim()
        payload.primary_industry = customPrimaryIndustry.trim()
      } else {
        payload.primary_industry = primaryIndustry.trim()
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/marketentry-playbook/generateIndustryKb`,
        payload
      )

      console.log("MEP generated successfully:", response.data)

      refresh()
      resetForm()
      setOpen(false)
    } catch (error) {
      console.error("Error generating MEP:", error)
      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.message || "Failed to generate MEP. Please try again.")
      } else {
        alert("Failed to generate MEP. Please try again.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset NAICS-related fields when country changes
  React.useEffect(() => {
    if (country !== "USA") {
      setNaicsCode("")
      setPrimaryIndustry("")
      setNaicsError("")
    }
  }, [country])

  // Filter industries based on search
  const filteredIndustries = React.useMemo(() => {
    if (!industryCreatedForList || industryCreatedForList.length === 0) {
      return []
    }
    
    // Filter out null/undefined values first
    const validIndustries = industryCreatedForList.filter((industry) => industry != null && industry !== '')
    
    if (!searchValue) {
      return validIndustries
    }
    
    return validIndustries.filter((industry) =>
      industry.toLowerCase().includes(searchValue.toLowerCase())
    )
  }, [searchValue, industryCreatedForList])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:opacity-90">
          Add Knowledge Base
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Knowledge Base</DialogTitle>
          <DialogDescription>
            {country === "USA"
              ? "Enter a 6-digit NAICS code to auto-fill the industry, or type it manually."
              : "Enter the industry name for your target country."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {/* Target Country */}
          <div className="grid gap-2">
            <Label htmlFor="country">Target Country</Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger id="country" aria-label="Target Country">
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* NAICS code - Only show for USA */}
          {country === "USA" && (
            <div className="grid gap-2">
              <Label htmlFor="naics">NAICS Code (optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="naics"
                  type="text"
                  value={naicsCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6)
                    setNaicsCode(value)
                    setNaicsError("")
                  }}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={fetchNaicsIndustryName}
                  disabled={!isValidNaicsCode || isLoadingNaics}
                  variant="outline"
                  className="shrink-0"
                >
                  {isLoadingNaics ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading
                    </>
                  ) : (
                    "Fetch"
                  )}
                </Button>
              </div>
              {naicsError && (
                <p className="text-xs text-red-500">{naicsError}</p>
              )}
              {naicsCode && !naicsError && (
                <p className="text-xs text-muted-foreground">
                  {isValidNaicsCode
                    ? "Click 'Fetch' to get the industry name from NAICS code"
                    : "Enter a complete 6-digit NAICS code"}
                </p>
              )}
            </div>
          )}

          {/* Primary Industry Dropdown */}
          <div className="grid gap-2">
            <Label htmlFor="primaryIndustry">Primary Industry Name</Label>
            {isLoadingCategories ? (
              <div className="flex items-center justify-center p-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading industries...
              </div>
            ) : categoriesError ? (
              <div className="text-sm text-red-500">{categoriesError}</div>
            ) : (
              <Select value={primaryIndustry} onValueChange={setPrimaryIndustry}>
                <SelectTrigger id="primaryIndustry" aria-label="Primary Industry">
                  <SelectValue placeholder="Select primary industry" />
                </SelectTrigger>
                <SelectContent>
                  {industryCategories.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {primaryIndustry === "Others" && (
              <Input
                type="text"
                value={customPrimaryIndustry}
                onChange={(e) => setCustomPrimaryIndustry(e.target.value)}
                placeholder="Enter custom industry name"
                className="mt-2"
              />
            )}
          </div>

          {/* Secondary Industry Name */}
          <div className="grid gap-2">
            <Label htmlFor="industryName">Secondary Industry Name</Label>
            <Input
              id="industryName"
              type="text"
              value={industryName}
              onChange={(e) => setIndustryName(e.target.value)}
              placeholder="e.g., Professional Services"
            />
          </div>

          {/* Industry Created For - Combobox */}
          <div className="grid gap-2">
            <Label htmlFor="targetIndustry">Industry Created For</Label>
            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboboxOpen}
                  className="w-full justify-between"
                  disabled={isLoadingCreatedFor}
                >
                  {targetIndustry || "Select or type industry..."}
                  {isLoadingCreatedFor ? (
                    <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin" />
                  ) : (
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search or type new industry..."
                    value={searchValue}
                    onValueChange={setSearchValue}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {searchValue ? (
                        <div className="p-2">
                          <Button
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => {
                              setTargetIndustry(searchValue)
                              setComboboxOpen(false)
                              setSearchValue("")
                            }}
                          >
                            <Check className="mr-2 h-4 w-4 opacity-0" />
                            Use "{searchValue}"
                          </Button>
                        </div>
                      ) : (
                        "No industries found."
                      )}
                    </CommandEmpty>
                    {filteredIndustries && filteredIndustries.length > 0 && (
                      <CommandGroup>
                        {filteredIndustries.map((industry) => (
                          <CommandItem
                            key={industry}
                            value={industry}
                            onSelect={() => {
                              setTargetIndustry(industry)
                              setComboboxOpen(false)
                              setSearchValue("")
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                targetIndustry === industry ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {industry}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Display Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="display">Display</Label>
              <p className="text-xs text-muted-foreground">
                Show this knowledge base in the list
              </p>
            </div>
            <Switch
              id="display"
              checked={display}
              onCheckedChange={setDisplay}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground hover:opacity-90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}