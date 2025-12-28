# JiraLite – Kanban Board Application

## Project Overview

**JiraLite** is a Kanban-style task management application built using **Vite**, **React**, and **Tailwind CSS**.  
The application allows users to organize work into **boards**, **lists**, and **cards** using a clean, responsive, and accessible interface with **offline support**.

The project emphasizes **code quality**, **accessibility**, and **testability**, following modern front-end development best practices.

---

## Architectural Summary

The application follows a **modular, component-based architecture** aligned with modern React standards.

### UI Layer
- Built using reusable React components such as:
  - `Board`
  - `List`
  - `Card`
- Each component is responsible only for **presentation** and **user interaction**
- Styling is implemented using **Tailwind CSS** to ensure:
  - Responsive layouts
  - Visual consistency
  - Maintainable utility-first styling

### State Management
- Global state is managed using the **React Context API**
- A centralized `BoardProvider` exposes state and actions to the application
- Complex state transitions are handled through a reducer (`boardReducer`), including:
  - Creating, updating, and deleting lists
  - Creating, updating, and deleting cards
  - Reordering lists and cards
- This approach ensures **predictable state updates** and simplifies debugging

### Persistence Layer
- Board data is stored in **browser local storage**
- Enables full **offline functionality**
- Application state is synchronized with storage on every update

### Testing Layer

#### Unit & Integration Testing
- Implemented using **Jest** and **React Testing Library**
- Focuses on:
  - Component behavior
  - User interactions
  - State transitions

#### Accessibility Testing
- Implemented using **axe-core**
- Ensures no **critical** or **serious** accessibility violations

#### End-to-End Testing
- Implemented using **Playwright** (or **Cypress**)
- Validates complete user workflows from start to finish

### Tooling & Quality
- **ESLint** with strict rules
  - `eslint-plugin-react`
  - `eslint-plugin-jsx-a11y`
- **Prettier** for consistent formatting
- **Vite** for fast development and optimized production builds

---

## Assignment Requirements

### 1) Setup & Tooling
- Vite + React (JavaScript)
- Tailwind CSS
- ESLint with strict rules
  - eslint-plugin-react
  - eslint-plugin-jsx-a11y
- Prettier for formatting
- Jest + React Testing Library
- Playwright or Cypress (E2E testing)
- **Zero ESLint errors required**

### Mandatory Scripts
- `dev`
- `build`
- `lint`
- `test`
- `test:coverage`
- `e2e`

---

## Core UI Features
- Kanban board
- Lists within boards
- Cards within lists
- Drag-and-drop interaction
- Offline mode using local storage

---
## Project Setup

### Install Dependencies

```npm install```
## Run Development Server
## Start the development server using:

```npm run dev```
## The application will be available at: http://localhost:5173

# Testing
## Unit & Integration Tests
### Run all unit and integration tests using:


```npm run test```
## Test Coverage
### Generate a coverage report using:


```npm run test:coverage```
## End-to-End Tests
### Run end-to-end tests using:

```npm run e2e```
## Linting
### Run ESLint checks using:


``` npm run lint```
### Linting must complete with zero errors.

# Build
## Create a production-ready build using:


```npm run build```
## Technologies Used
- React

- Vite

- Tailwind CSS

- Jest

- React Testing Library

- Playwright / Cypress

- ESLint

- Prettier

- axe-core