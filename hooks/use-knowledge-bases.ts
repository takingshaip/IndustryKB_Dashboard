"use client"
import useSWR from "swr"

export type KnowledgeBase = {
  id: string
  name: string
  country: string
  status: boolean
  _id: string
}

type APIResponse = {
  industryKbs: Array<{
    _id: string
    name: string
    country: string
    status: boolean
  }>
}

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/marketentry-playbook/getAllIndustryKb`

const fetcher = async (): Promise<KnowledgeBase[]> => {
  const response = await fetch(API_URL)
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }
  const data: APIResponse = await response.json()
  
  // Transform API response to match our KnowledgeBase type
  return data.industryKbs.map(kb => ({
    id: kb._id,
    _id: kb._id,
    name: kb.name,
    country: kb.country,
    status: kb.status,
  }))
}

export function useKnowledgeBases() {
  const { data, error, mutate, isLoading } = useSWR<KnowledgeBase[]>(
    API_URL,
    fetcher,
    {
      fallbackData: [],
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  )

  const refresh = () => {
    mutate()
  }

  return {
    list: data ?? [],
    isLoading,
    error,
    refresh,
  }
}