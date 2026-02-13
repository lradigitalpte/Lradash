# 📊 Gantt Chart Implementation Plan

## 🎯 Objective
Implement a fully functional Gantt chart view for the project, visualizing tasks on a timeline with dependencies and grouping.

## 🛠️ Tech Stack
- **Library:** `gantt-task-react` (Lightweight, MIT license, React-native)
- **Styling:** Tailwind CSS (for wrappers and custom tooltips)
- **Data:** Mock data (initially), then connected to Tasks API

## 📋 Implementation Checklist

### 1. Setup & Installation
- [ ] Install `gantt-task-react`
- [ ] Create `GanttChart` component structure

### 2. Data Preparation (Mock Data)
- [ ] Define `Task` interface compatible with `gantt-task-react`
- [ ] Create mock **Work Packages** (as project groups)
- [ ] Create mock **Tasks** associated with Work Packages
- [ ] Define **Dependencies** (Task B starts after Task A)
- [ ] Define **Milestones**

### 3. Component Implementation
- [ ] **Main View:** Implement `Gantt` component
- [ ] **View Switcher:** Add toggle for `Day`, `Week`, `Month` views
- [ ] **Custom Tooltip:** Create a beautiful hover tooltip showing task details
- [ ] **Task List:** Customize the left-side task list (columns for Name, Start, End)
- [ ] **Styling:**
    - [ ] Match dark/light mode of the application
    - [ ] Style bars with priority colors (High=Red, Medium=Yellow, etc.)
    - [ ] Style progress bars

### 4. Integration
- [ ] Replace `src/app/[locale]/(workspace)/projects/[projectId]/gantt/page.tsx` content
- [ ] Add "Create Task" button (mock action)
- [ ] Ensure "Back to Project" navigation works

### 5. Advanced Features (Future/Optional)
- [ ] Drag and drop to reschedule
- [ ] Drag to resize duration
- [ ] Edit task modal on click

## 🎨 Design Reference
- **Modern UI:** Clean lines, rounded corners, subtle shadows.
- **Colors:** 
    - Timeline background: White/Gray-900
    - Task bars: Primary blue, or colored by priority
    - Grid lines: Subtle gray
    - Today line: Highlighted vertical line

## 🚀 Execution Steps
1. Install dependencies
2. Create `src/components/gantt/GanttChart.tsx`
3. Implement mock data generator
4. Integrate into page
5. Polish UI
