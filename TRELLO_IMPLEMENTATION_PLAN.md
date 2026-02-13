# Trello-like Kanban Board Implementation Plan

## 📋 Research: Trello's Core Features

### 1. **Board Structure**
```
Board
  └─ Lists (Columns)
      └─ Cards (Tasks)
```

### 2. **Key Features to Implement**

#### A. Board Level
- ✅ Create/Edit/Delete boards
- ✅ Custom board backgrounds/colors
- ✅ Board members
- ✅ Board settings

#### B. List (Column) Level
- ✅ Create custom lists (To Do, In Progress, Done, Testing, etc.)
- ✅ Rename lists
- ✅ Reorder lists (drag & drop)
- ✅ Archive/Delete lists
- ✅ Add cards to lists

#### C. Card Level
- ✅ Drag & drop between lists
- ✅ Card details modal with:
  - Title & Description (rich text)
  - Cover image/color
  - Labels (colored tags)
  - Members (assignees)
  - Checklist items
  - Due date & time
  - Attachments
  - Comments/Activity
  - Priority/Urgency indicator
- ✅ Quick edit (inline)
- ✅ Copy/Move card
- ✅ Archive card

### 3. **Data Model**

```typescript
// Board
{
  _id: string
  title: string
  description?: string
  projectId: string
  background?: { type: 'color' | 'image', value: string }
  lists: List[]
  members: string[]
  createdAt: Date
  updatedAt: Date
}

// List (Column)
{
  _id: string
  title: string
  boardId: string
  position: number
  cards: Card[]
  createdAt: Date
}

// Card (Task)
{
  _id: string
  title: string
  description?: string
  listId: string
  boardId: string
  position: number
  
  // Visual
  coverColor?: string
  coverImage?: string
  labels: Label[]
  
  // Assignment
  members: string[]
  
  // Tracking
  dueDate?: Date
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  
  // Content
  checklist: ChecklistItem[]
  attachments: Attachment[]
  comments: Comment[]
  
  // Metadata
  workPackageId?: string // Link to work package
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

// Label
{
  _id: string
  name: string
  color: string
}

// ChecklistItem
{
  _id: string
  text: string
  completed: boolean
  position: number
}

// Attachment
{
  _id: string
  name: string
  url: string
  type: string
  uploadedAt: Date
  uploadedBy: string
}

// Comment
{
  _id: string
  text: string
  author: string
  createdAt: Date
  updatedAt?: Date
}
```

## 🎨 UI/UX Design Plan

### 1. **Board View Layout**
```
┌─────────────────────────────────────────────────────────┐
│ Board Title                    [+ Add List] [⋯ Menu]    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐│
│ │ To Do    │  │ In Prog  │  │ Testing  │  │ Done     ││
│ │ [+ Card] │  │ [+ Card] │  │ [+ Card] │  │ [+ Card] ││
│ ├──────────┤  ├──────────┤  ├──────────┤  ├──────────┤│
│ │ Card 1   │  │ Card 3   │  │          │  │ Card 5   ││
│ │ 🏷️ Label │  │ 🏷️ Label │  │          │  │ ✓        ││
│ │ 👤 User  │  │ 👤 User  │  │          │  │          ││
│ ├──────────┤  ├──────────┤  │          │  │          ││
│ │ Card 2   │  │ Card 4   │  │          │  │          ││
│ │ 📎 2     │  │ ✓ 2/5    │  │          │  │          ││
│ └──────────┘  └──────────┘  └──────────┘  └──────────┘│
└─────────────────────────────────────────────────────────┘
```

### 2. **Card Detail Modal**
```
┌─────────────────────────────────────────────────────┐
│ [Cover Image/Color]                          [×]    │
├─────────────────────────────────────────────────────┤
│ 📝 Card Title                                       │
│ in list "To Do"                                     │
├─────────────────────────────────────────────────────┤
│ Left Column:                  Right Column:         │
│                                                      │
│ 🏷️ Labels                    ➕ Add to Card         │
│ [Tag1] [Tag2]                 □ Members             │
│                               □ Labels               │
│ 👤 Members                    □ Checklist           │
│ [Avatar] [Avatar]             □ Due Date            │
│                               □ Attachment           │
│ 📝 Description                                      │
│ [Rich text editor]            ⚡ Actions             │
│                               □ Move                 │
│ ✓ Checklist (2/5)             □ Copy                │
│ ☑ Task 1                      □ Archive             │
│ ☐ Task 2                                            │
│                                                      │
│ 📎 Attachments                                      │
│ [File 1] [File 2]                                   │
│                                                      │
│ 💬 Activity                                         │
│ [Comment box]                                       │
│ User: Comment text...                               │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## 🚀 Implementation Steps

### Phase 1: Core Board Structure (Priority 1)
1. ✅ Create Board data model
2. ✅ Create List data model  
3. ✅ Create Card data model
4. ✅ Build Board view layout
5. ✅ Implement List components
6. ✅ Implement Card components

### Phase 2: Drag & Drop (Priority 1)
1. ✅ Install @dnd-kit (already in project!)
2. ✅ Implement card drag & drop between lists
3. ✅ Implement list reordering
4. ✅ Update positions in database

### Phase 3: Card Detail Modal (Priority 1)
1. ✅ Create modal component
2. ✅ Add description editor
3. ✅ Add labels system
4. ✅ Add members assignment
5. ✅ Add checklist functionality
6. ✅ Add due date picker
7. ✅ Add priority selector
8. ✅ Add attachments (file upload)
9. ✅ Add comments system
10. ✅ Add activity log

### Phase 4: Integration (Priority 2)
1. ✅ Connect Tasks page to Board
2. ✅ "Convert to Card" functionality
3. ✅ Link cards to Work Packages
4. ✅ Sync card status with task status

### Phase 5: Polish & Features (Priority 2)
1. ✅ Beautiful animations
2. ✅ Card cover images/colors
3. ✅ Quick edit (inline)
4. ✅ Search & filter
5. ✅ Keyboard shortcuts
6. ✅ Board templates

## 🎨 Design Tokens

### Colors for Labels
```typescript
const LABEL_COLORS = [
  { name: 'Green', value: '#61BD4F' },
  { name: 'Yellow', value: '#F2D600' },
  { name: 'Orange', value: '#FF9F1A' },
  { name: 'Red', value: '#EB5A46' },
  { name: 'Purple', value: '#C377E0' },
  { name: 'Blue', value: '#0079BF' },
  { name: 'Sky', value: '#00C2E0' },
  { name: 'Lime', value: '#51E898' },
  { name: 'Pink', value: '#FF78CB' },
  { name: 'Black', value: '#344563' },
]
```

### Priority Indicators
```typescript
const PRIORITY_CONFIG = {
  URGENT: { color: '#EB5A46', icon: '🔥', label: 'Urgent' },
  HIGH: { color: '#FF9F1A', icon: '⚠️', label: 'High' },
  MEDIUM: { color: '#F2D600', icon: '➖', label: 'Medium' },
  LOW: { color: '#61BD4F', icon: '⬇️', label: 'Low' },
}
```

## 📦 Required Packages
- ✅ @dnd-kit/core (already installed)
- ✅ @dnd-kit/sortable (already installed)
- ✅ @dnd-kit/utilities (already installed)
- ✅ react-hook-form (already installed)
- ✅ date-fns (already installed)
- ⚠️ @tiptap/react (for rich text editor) - NEED TO INSTALL
- ⚠️ @tiptap/starter-kit - NEED TO INSTALL

## 🔄 Workflow Example

### User Journey: Create and Manage Cards
```
1. User opens Board page
   → Sees lists: "To Do", "In Progress", "Done"

2. User clicks "+ Add Card" in "To Do"
   → Quick add form appears
   → Types title, presses Enter
   → Card created

3. User clicks on card
   → Modal opens with full details
   → Can add description, labels, checklist, etc.

4. User drags card to "In Progress"
   → Card moves smoothly
   → Position updated in database
   → Status synced

5. User adds checklist items
   → Progress bar shows 2/5 complete
   → Badge appears on card

6. User completes all checklist items
   → Progress shows 5/5
   → User drags to "Done"
```

## 🎯 Success Metrics
- ✅ Smooth drag & drop (60fps)
- ✅ Modal loads < 200ms
- ✅ Beautiful animations
- ✅ Responsive on mobile
- ✅ Keyboard accessible
- ✅ Works offline (optimistic updates)

## 📝 Next Steps
1. Start with Phase 1: Core Board Structure
2. Build the basic layout and components
3. Implement drag & drop
4. Create card detail modal
5. Add all features incrementally
6. Polish and optimize

---

**Estimated Time:** 
- Phase 1: 2-3 hours
- Phase 2: 1-2 hours  
- Phase 3: 3-4 hours
- Phase 4: 1-2 hours
- Phase 5: 2-3 hours

**Total: ~10-14 hours of focused development**
