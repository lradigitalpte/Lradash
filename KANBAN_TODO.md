# Trello-like Kanban Board - Implementation Checklist

## ✅ Phase 1: Core Components (START HERE)

### 1.1 Board View Page
- [ ] Create `/boards/[boardId]/page.tsx` - Main Kanban view
- [ ] Horizontal scrollable layout for lists
- [ ] Board header with title and actions
- [ ] Add list button

### 1.2 List (Column) Component
- [ ] Create `KanbanList.tsx` component
- [ ] List header with title
- [ ] Add card button
- [ ] List menu (rename, delete, archive)
- [ ] Card container with scroll

### 1.3 Card Component
- [ ] Create `KanbanCard.tsx` component
- [ ] Card title
- [ ] Labels (colored tags)
- [ ] Members avatars
- [ ] Due date badge
- [ ] Checklist progress (2/5)
- [ ] Attachment count
- [ ] Priority indicator
- [ ] Cover color/image

## ✅ Phase 2: Drag & Drop

### 2.1 Setup @dnd-kit
- [ ] Create DnD context wrapper
- [ ] Implement card dragging
- [ ] Implement list dragging
- [ ] Visual feedback during drag
- [ ] Drop zones

### 2.2 Position Updates
- [ ] Calculate new positions
- [ ] Optimistic UI updates
- [ ] API calls to save positions
- [ ] Error handling & rollback

## ✅ Phase 3: Card Detail Modal

### 3.1 Modal Structure
- [ ] Create `CardDetailModal.tsx`
- [ ] Cover image/color section
- [ ] Two-column layout
- [ ] Close button

### 3.2 Left Column Features
- [ ] Editable title
- [ ] Rich text description editor (Tiptap)
- [ ] Labels section
- [ ] Members section
- [ ] Checklist with add/edit/delete
- [ ] Attachments list
- [ ] Activity/Comments feed

### 3.3 Right Column (Sidebar)
- [ ] "Add to Card" section:
  - [ ] Members button
  - [ ] Labels button
  - [ ] Checklist button
  - [ ] Due Date button
  - [ ] Attachment button
- [ ] "Actions" section:
  - [ ] Move card
  - [ ] Copy card
  - [ ] Archive card
  - [ ] Delete card

### 3.4 Individual Features
- [ ] Label picker with colors
- [ ] Member selector
- [ ] Checklist item add/edit/delete/reorder
- [ ] Due date picker with time
- [ ] File upload for attachments
- [ ] Comment system with mentions
- [ ] Activity log

## ✅ Phase 4: Quick Actions

### 4.1 Quick Edit
- [ ] Inline title edit
- [ ] Quick label add
- [ ] Quick member assign
- [ ] Quick due date

### 4.2 Card Actions Menu
- [ ] Edit button
- [ ] Copy button
- [ ] Move button
- [ ] Archive button

## ✅ Phase 5: Integration

### 5.1 Task Integration
- [ ] "Convert to Card" button on Tasks page
- [ ] Select target board & list
- [ ] Migrate task data to card
- [ ] Link card to original task

### 5.2 Work Package Integration
- [ ] Link cards to work packages
- [ ] Show work package in card
- [ ] Filter by work package

## ✅ Phase 6: API Routes

### 6.1 Board APIs
- [ ] GET `/api/boards/[boardId]` - Get board with lists and cards
- [ ] PATCH `/api/boards/[boardId]` - Update board
- [ ] DELETE `/api/boards/[boardId]` - Delete board

### 6.2 List APIs
- [ ] POST `/api/boards/[boardId]/lists` - Create list
- [ ] PATCH `/api/lists/[listId]` - Update list
- [ ] DELETE `/api/lists/[listId]` - Delete list
- [ ] PATCH `/api/lists/[listId]/position` - Reorder list

### 6.3 Card APIs
- [ ] POST `/api/lists/[listId]/cards` - Create card
- [ ] GET `/api/cards/[cardId]` - Get card details
- [ ] PATCH `/api/cards/[cardId]` - Update card
- [ ] DELETE `/api/cards/[cardId]` - Delete card
- [ ] PATCH `/api/cards/[cardId]/move` - Move card
- [ ] POST `/api/cards/[cardId]/comments` - Add comment
- [ ] POST `/api/cards/[cardId]/attachments` - Upload attachment

## ✅ Phase 7: Polish & UX

### 7.1 Animations
- [ ] Card drag animations
- [ ] List drag animations
- [ ] Modal enter/exit animations
- [ ] Smooth transitions

### 7.2 Responsive Design
- [ ] Mobile-friendly board view
- [ ] Touch drag & drop
- [ ] Responsive modal
- [ ] Mobile card actions

### 7.3 Keyboard Shortcuts
- [ ] `N` - New card
- [ ] `L` - New list
- [ ] `Esc` - Close modal
- [ ] Arrow keys - Navigate cards
- [ ] `Enter` - Open card

### 7.4 Search & Filter
- [ ] Search cards by title
- [ ] Filter by label
- [ ] Filter by member
- [ ] Filter by due date
- [ ] Filter by priority

## 📦 Components to Create

```
src/components/kanban/
├── KanbanBoard.tsx          # Main board container
├── KanbanList.tsx           # List/Column component
├── KanbanCard.tsx           # Card component
├── CardDetailModal.tsx      # Full card details modal
├── AddCardForm.tsx          # Quick add card form
├── AddListForm.tsx          # Add new list form
├── LabelPicker.tsx          # Label color picker
├── MemberPicker.tsx         # Member selector
├── ChecklistSection.tsx     # Checklist with items
├── AttachmentSection.tsx    # Attachments list
├── CommentSection.tsx       # Comments & activity
├── RichTextEditor.tsx       # Tiptap editor wrapper
└── DragOverlay.tsx          # Custom drag overlay
```

## 🎨 Design Priorities

1. **Smooth drag & drop** - Must feel native
2. **Beautiful cards** - Colored labels, covers, badges
3. **Fast modal** - Instant open, lazy load heavy features
4. **Responsive** - Works on all screen sizes
5. **Accessible** - Keyboard navigation, screen readers

## 🚀 Implementation Order

**Day 1:**
1. Create basic board layout ✅
2. Create list component ✅
3. Create card component ✅
4. Implement drag & drop ✅

**Day 2:**
5. Create card detail modal ✅
6. Add description editor ✅
7. Add labels system ✅
8. Add checklist ✅

**Day 3:**
9. Add members & due dates ✅
10. Add attachments ✅
11. Add comments ✅
12. Polish animations ✅

**Day 4:**
13. Create API routes ✅
14. Integrate with Tasks page ✅
15. Testing & bug fixes ✅

---

**Current Status:** Ready to start Phase 1
**Next Step:** Create the main Kanban board view page
