"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { InviteUserDialog } from "@/components/team/InviteUserDialog"

interface Organization {
  id: string
  name: string
  slug: string
}

interface Member {
  _id: string
  userId: string
  userName: string
  userEmail: string
  role: string
  joinedAt: string
}

export default function TeamPage() {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTeamData()
  }, [])

  const loadTeamData = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken")
      if (!accessToken) return

      const response = await fetch("/api/organizations/current", {
        headers: {
          "Authorization": `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        toast.error("Failed to load team data")
        return
      }

      const data = await response.json()
      setOrganization({
        id: data.id,
        name: data.name,
        slug: data.slug
      })
      setMembers(data.members)
    } catch (error) {
      console.error("Failed to load team data:", error)
      toast.error("Failed to load team data")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Members</h1>
          <p className="text-muted-foreground">Manage your team and invite new members</p>
        </div>
        {organization && <InviteUserDialog organizationId={organization.id} onInviteSent={loadTeamData} />}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
          <CardDescription>Current organization details</CardDescription>
        </CardHeader>
        <CardContent>
          {organization && (
            <div className="space-y-2">
              <p><strong>Name:</strong> {organization.name}</p>
              <p><strong>Slug:</strong> {organization.slug}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>{members.length} member{members.length !== 1 ? "s" : ""}</CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-muted-foreground">No members yet. Invite someone to get started!</p>
          ) : (
            <div className="space-y-4">
              {members.map((member) => (
                <div key={member._id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{member.userName}</p>
                    <p className="text-sm text-muted-foreground">{member.userEmail}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">{member.role}</span>
                    <p className="text-sm text-muted-foreground">
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
