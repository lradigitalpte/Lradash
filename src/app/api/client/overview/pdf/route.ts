import { NextRequest, NextResponse } from "next/server"
import PDFDocument from "pdfkit"

import { requireClientAccess } from "@/lib/auth/organization-access"
import { getClientOverviewData } from "@/lib/client/overview"

async function buildPdfBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    doc.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    })
    doc.on("end", () => {
      resolve(Buffer.concat(chunks))
    })
    doc.on("error", reject)
  })
}

export async function GET(request: NextRequest) {
  try {
    const access = await requireClientAccess(request)
    if ("error" in access) {
      return access.error
    }

    const overview = await getClientOverviewData(access)
    const doc = new PDFDocument({ margin: 48, size: "A4" })
    const pdfBufferPromise = buildPdfBuffer(doc)

    doc.fontSize(24).text(`${overview.viewer.organizationName} Client Report`, { align: "left" })
    doc.moveDown(0.5)
    doc.fontSize(11).fillColor("#475569")
    doc.text(`Prepared for ${overview.viewer.name} (${overview.viewer.email})`)
    doc.text(`Generated ${new Date().toLocaleString()}`)
    doc.moveDown(1.5)

    doc.fillColor("#0f172a").fontSize(16).text("Summary")
    doc.moveDown(0.5)
    doc.fontSize(11)
    doc.text(`Projects: ${overview.summary.projectCount}`)
    doc.text(`Total tasks: ${overview.summary.totalTasks}`)
    doc.text(`Completed tasks: ${overview.summary.doneTasks}`)
    doc.text(`In progress: ${overview.summary.inProgressTasks}`)
    doc.text(`Overdue: ${overview.summary.overdueTasks}`)
    doc.text(`Completion rate: ${overview.summary.completionRate}%`)
    doc.moveDown(1.5)

    doc.fontSize(16).text("Projects")
    doc.moveDown(0.5)

    if (overview.projects.length === 0) {
      doc
        .fontSize(11)
        .fillColor("#475569")
        .text("No projects have been shared with this client account yet.")
    } else {
      overview.projects.forEach((project, index) => {
        if (index > 0) {
          doc.moveDown(1)
        }
        doc.fillColor("#0f172a").fontSize(13).text(project.title)
        doc.fontSize(10).fillColor("#475569")
        if (project.description) {
          doc.text(project.description)
        }
        doc.text(`Priority: ${project.priority}`)
        doc.text(`Status: ${project.status}`)
        doc.text(`Last updated: ${new Date(project.updatedAt).toLocaleDateString()}`)
        doc.text(
          `Due date: ${project.dueDate ? new Date(project.dueDate).toLocaleDateString() : "Not scheduled"}`
        )
        doc.text(
          `Tasks: ${project.taskStats.total} total, ${project.taskStats.done} done, ${project.taskStats.inProgress} in progress, ${project.taskStats.overdue} overdue`
        )
        doc.text(`Completion: ${project.taskStats.completionRate}%`)
      })
    }

    doc.end()

    const pdfBuffer = await pdfBufferPromise
    const filename = `${overview.viewer.organizationName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-client-report.pdf`

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error("Client overview PDF error:", error)
    return NextResponse.json({ error: "Failed to export client report" }, { status: 500 })
  }
}
