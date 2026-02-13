import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)

    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const { boardId } = await params

    // TODO: Fetch from database when models are ready
    // For now, return mock data with Trello-like structure
    const mockBoard = {
      _id: boardId,
      title: "Project Board",
      description: "Main project kanban board",
      lists: [
        {
          _id: "list-1",
          title: "To Do",
          position: 0,
          cards: [
            {
              _id: "card-1",
              title: "Design new landing page",
              description: "Create mockups and wireframes for the new landing page",
              listId: "list-1",
              position: 0,
              labels: [
                { name: "Design", color: "#61BD4F" },
                { name: "High Priority", color: "#EB5A46" }
              ],
              members: [{ _id: "user-1", name: "John Doe", avatar: "" }],
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              priority: "HIGH",
              checklist: [
                { text: "Research competitors", completed: true },
                { text: "Create wireframes", completed: false },
                { text: "Design mockups", completed: false }
              ],
              attachments: [],
              coverColor: "#0079BF"
            },
            {
              _id: "card-2",
              title: "Setup authentication system",
              description: "",
              listId: "list-1",
              position: 1,
              labels: [{ name: "Backend", color: "#C377E0" }],
              members: [],
              priority: "URGENT",
              checklist: [],
              attachments: []
            }
          ]
        },
        {
          _id: "list-2",
          title: "In Progress",
          position: 1,
          cards: [
            {
              _id: "card-3",
              title: "Implement user dashboard",
              description: "Build the main user dashboard with charts and statistics",
              listId: "list-2",
              position: 0,
              labels: [{ name: "Frontend", color: "#00C2E0" }],
              members: [{ _id: "user-2", name: "Jane Smith", avatar: "" }],
              dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
              priority: "MEDIUM",
              checklist: [
                { text: "Create components", completed: true },
                { text: "Add charts", completed: true },
                { text: "Connect to API", completed: false },
                { text: "Add responsive design", completed: false }
              ],
              attachments: [{ name: "dashboard-mockup.png", url: "#" }]
            }
          ]
        },
        {
          _id: "list-3",
          title: "Testing",
          position: 2,
          cards: []
        },
        {
          _id: "list-4",
          title: "Done",
          position: 3,
          cards: [
            {
              _id: "card-4",
              title: "Setup project repository",
              description: "Initialize Git repository and setup CI/CD",
              listId: "list-4",
              position: 0,
              labels: [{ name: "DevOps", color: "#F2D600" }],
              members: [],
              priority: "LOW",
              checklist: [
                { text: "Create repo", completed: true },
                { text: "Setup CI/CD", completed: true },
                { text: "Add README", completed: true }
              ],
              attachments: []
            }
          ]
        }
      ]
    }

    return NextResponse.json(mockBoard, {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })
  } catch (error) {
    console.error("Get board error:", error)
    return NextResponse.json(
      { error: "Failed to fetch board" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
