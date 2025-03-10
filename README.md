# EZVG React Icons Extension

A Visual Studio Code extension for previewing and converting SVG icons to React components.

## Features

This extension provides two main functionalities:

1. **Preview Icons**: View all your React icon components in a single interface.
2. **Convert SVG to React**: Transform any SVG code into a ready-to-use React component.

## Commands

This extension contributes the following commands:

- `EZVG: Preview Icons` - Opens a panel showing all your icon components
- `EZVG: Convert SVG to React Component` - Opens a tool to convert SVG code to React components

## Development Setup

### Prerequisites

- Node.js (v14 or newer)
- npm
- VS Code

### Getting Started

1. Clone the repository
2. Install dependencies in both the extension and web directories:

   ```
   npm install
   cd web
   npm install
   ```

3. Build the React app:

   ```
   cd web
   npm run build
   ```

4. Press F5 in VS Code to start debugging the extension

### Project Structure

- `/src`: Extension TypeScript source code
- `/web`: React application source code
  - `/web/src/pages`: Main React components for the different views

## Usage

### Previewing Icons

1. Run the command `EZVG: Preview Icons`
2. Upload your icon component files (.tsx) through the interface
3. View all your icons in the panel

### Converting SVG to React Components

1. Run the command `EZVG: Convert SVG to React Component`
2. Paste your SVG code in the input field
3. Configure the component name and options
4. Copy the generated React component code
