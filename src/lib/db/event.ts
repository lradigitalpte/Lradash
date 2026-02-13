"use server"

import { Types } from "mongoose"

import { EventModel } from "@/models/event.model"
import { Event, EventType } from "@/types/dbInterface"

import { connectToDatabase } from "./connect"
import { getUserByEmail } from "./user"

async function convertEventToPlainObject(eventDoc: any): Promise<Event> {
  const obj = eventDoc.toObject ? eventDoc.toObject() : eventDoc
  return {
    ...obj,
    _id: obj._id.toString(),
    organizationId: obj.organizationId.toString(),
    creatorId: obj.creatorId.toString(),
    members: obj.members?.map((m: any) => m.toString()),
    startTime: obj.startTime,
    endTime: obj.endTime,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    deletedAt: obj.deletedAt
  }
}

export async function getOrgEvents(organizationId: string): Promise<Event[]> {
  try {
    await connectToDatabase()
    const query: any = {
      organizationId: new Types.ObjectId(organizationId),
      deletedAt: null
    }
    const events = await EventModel.find(query).sort({ startTime: 1 }).lean()

    return await Promise.all(
      events.map(
        (event) =>
          ({
            ...event,
            _id: (event as any)._id.toString(),
            organizationId: (event as any).organizationId.toString(),
            creatorId: (event as any).creatorId.toString(),
            members: (event as any).members?.map((m: any) => m.toString())
          }) as Event
      )
    )
  } catch (error) {
    console.error("Error fetching org events:", error)
    throw error
  }
}

export async function createEventInDb(
  userEmail: string,
  eventData: Partial<Event>
): Promise<Event> {
  try {
    await connectToDatabase()
    const user = await getUserByEmail(userEmail)
    if (!user) {
      throw new Error("User not found")
    }

    const newEvent = await EventModel.create({
      ...eventData,
      organizationId: user.defaultOrganizationId,
      creatorId: user._id,
      members: eventData.members || [user._id]
    })

    const plain = newEvent.toObject()
    return {
      ...plain,
      _id: plain._id.toString(),
      organizationId: plain.organizationId.toString(),
      creatorId: plain.creatorId.toString(),
      members: plain.members?.map((m: any) => m.toString())
    } as Event
  } catch (error) {
    console.error("Error creating event:", error)
    throw error
  }
}

export async function updateEventInDb(eventId: string, updates: Partial<Event>): Promise<Event> {
  try {
    await connectToDatabase()
    const updatedEvent = await EventModel.findByIdAndUpdate(
      eventId,
      { ...updates, updatedAt: new Date() },
      { new: true }
    )
    if (!updatedEvent) {
      throw new Error("Event not found")
    }

    const plain = updatedEvent.toObject()
    return {
      ...plain,
      _id: plain._id.toString(),
      organizationId: plain.organizationId.toString(),
      creatorId: plain.creatorId.toString(),
      members: plain.members?.map((m: any) => m.toString())
    } as Event
  } catch (error) {
    console.error("Error updating event:", error)
    throw error
  }
}

export async function deleteEventInDb(eventId: string): Promise<void> {
  try {
    await connectToDatabase()
    await EventModel.findByIdAndDelete(eventId)
  } catch (error) {
    console.error("Error deleting event:", error)
    throw error
  }
}
