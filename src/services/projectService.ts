import { ProjectModel } from "@/models/project.model"
import { connectToDatabase } from "@/lib/db/connect"

export class ProjectService {
  static async createProject(title: string, description: string, ownerId: string, organizationId: string) {
    await connectToDatabase()
    
    const project = await ProjectModel.create({
      title,
      description: description || "",
      organizationId,
      owner: ownerId
    })

    return {
      id: project._id.toString(),
      title: project.title,
      description: project.description,
      organizationId: project.organizationId.toString(),
      owner: ownerId
    }
  }

  static async getProjects(organizationId: string) {
    await connectToDatabase()
    
    const projects = await ProjectModel.find({
      organizationId,
      deletedAt: null
    }).populate("owner", "name email")
    
    return projects.map(p => ({
      id: p._id.toString(),
      title: p.title,
      description: p.description,
      owner: p.owner,
      organizationId: p.organizationId.toString(),
      isArchived: p.isArchived,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }))
  }
}
