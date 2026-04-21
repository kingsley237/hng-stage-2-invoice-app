# HNG Stage 2 : Invoice Management App

A fully functional invoice management application built with React and TypeScript.

# Live Demo

https://hng-stage-2-invoice-app.vercel.app

## Setup
- open terminal and execute: 
npm install
npm run build (optional)
npm run dev

## Tech Stack

- React 18 + TypeScript
- Vite 8
- CSS Modules
- localStorage for persistence
- uuid for ID generation

## Architecture

- `src/context/InvoiceContext.tsx`: global state via useReducer + Context. Single source of truth for all invoices, filter state, and theme.
- `src/components/InvoiceList.tsx`: invoice list page with filter dropdown and empty state
- `src/components/InvoiceDetail.tsx`: full invoice detail view with status bar and items table
- `src/components/InvoiceForm.tsx`: slide-in panel for create and edit, with focus trap and validation
- `src/components/DeleteModal.tsx`: confirmation modal with focus trap and ESC key support
- `src/components/StatusBadge.tsx`: reusable status pill component
- `src/components/Sidebar.tsx`: desktop sidebar + tablet/mobile topbar, theme toggle
- `src/data/invoices.ts`: seed data loaded on first visit if localStorage is empty
- `src/utils/index.ts`: currency formatting, date formatting, ID generation, localStorage helpers

## Features

- Full CRUD: create, view, edit, delete invoices
- Save as Draft or Send (pending)
- Mark pending invoices as paid
- Filter by status: All, Draft, Pending, Paid
- Light and dark mode with localStorage persistence
- Form validation: all required fields, valid email format, price required per item
- Responsive: 320px mobile, 768px tablet, 1024px+ desktop
- Keyboard accessible throughout, focus traps on form and modal, ESC to close

## Trade-offs

- No backend: data persists in localStorage only, cleared if browser storage is cleared
- No routing library: simple view state in App.tsx is sufficient for two views
- Item qty/price stored as strings during editing for natural input behaviour, parsed to numbers on save

## Accessibility

- All form fields have associated label elements
- Modal and form panel trap focus while open, return focus on close
- ESC key closes both modal and form
- Status badges use both color and text
- aria-live on error summary for screen reader announcements
- Semantic HTML throughout: article, header, main, aside, time, address