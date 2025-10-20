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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useKnowledgeBases } from "@/hooks/use-knowledge-bases"
import { Loader2 } from "lucide-react"
import axios from "axios"

const COUNTRIES = ["USA", "Canada", "United Kingdom", "Germany", "India", "Australia", "Japan"]

const PRIMARY_INDUSTRIES = [
  "Process Industries",
  "Retail",
  "Consumer & CPG",
  "Capital-Equipment Producers",
  "High-Tech Discrete Manufacturing",
  "Others"
]

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

  const isValidNaicsCode = /^\d{6}$/.test(naicsCode)

  function resetForm() {
    setNaicsCode("")
    setIndustryName("")
    setPrimaryIndustry("")
    setCustomPrimaryIndustry("")
    setCountry("USA")
    setTargetIndustry("")
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

    setIsSubmitting(true)

    try {
      // Determine the final primary industry value
      const finalPrimaryIndustry = primaryIndustry === "Others" 
        ? customPrimaryIndustry.trim() 
        : primaryIndustry.trim()

      // Call the generateMEP API with display parameter
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/marketentry-playbook/generateIndustryKb`,
        {
          industry: industryName.trim(),
          country: country,
          industry_created_for: targetIndustry.trim(),
          primary_industry: finalPrimaryIndustry,
          display: display,
        }
      )

      console.log("MEP generated successfully:", response.data)

      // Refresh the knowledge base list after successful API call
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
            <Select value={primaryIndustry} onValueChange={setPrimaryIndustry}>
              <SelectTrigger id="primaryIndustry" aria-label="Primary Industry">
                <SelectValue placeholder="Select primary industry" />
              </SelectTrigger>
              <SelectContent>
                {PRIMARY_INDUSTRIES.map((industry) => (
                  <SelectItem key={industry} value={industry}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

          {/* Industry Created For */}
          <div className="grid gap-2">
            <Label htmlFor="targetIndustry">Industry Created For</Label>
            <Input
              id="targetIndustry"
              type="text"
              value={targetIndustry}
              onChange={(e) => setTargetIndustry(e.target.value)}
              placeholder="e.g., Healthcare Providers"
            />
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