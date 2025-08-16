# ESYT

A modern CLI tool to quickly scaffold Vite or Next.js projects with your preferred tech stack.

## Overview

`esyt` is a command-line interface tool that helps you create new Vite or Next.js projects with JavaScript or TypeScript, and popular packages like TailwindCSS, Framer Motion, Clerk, Appwrite, Prisma, and more. It provides a clean, professional setup experience with minimal output and smart automation.

## Installation

You can use `esyt` with any of these package managers:

```bash
# Using npm
npm create esyt@latest

# Using bun
bun create esyt@latest

# Using pnpm
pnpm create esyt@latest
```

## Features

- 🏗️ **Framework Choice** - Start with Vite or Next.js
- 🚀 **Vite-powered** or **Next.js-powered** - Modern, fast, and flexible
- 🔄 **JavaScript or TypeScript** - Choose your preferred language
- 🎨 **TailwindCSS** - Utility-first CSS framework for rapid UI development
- 🛣️ **React Router** (Vite only) - Declarative routing for React applications
- 💖 **React Icons** - Countless Different Icons For React
- 🎭 **Framer Motion** - Production-ready animation library for React
- 🌐 **OGL** (Vite only) - Minimal WebGL framework for creative coding projects
- 🔥 **Firebase** - Google's platform for building web and mobile applications
- 🔒 **Clerk** - Complete user management solution
- ☁️ **Appwrite** - Open source backend server for web and mobile apps
- 💾 **Prisma** - Next-generation ORM for Node.js and TypeScript
- 🔑 **DotENV** - Zero-dependency module for loading environment variables
- 🌐 **Axios** - Promise-based HTTP client for the browser and node.js
- 🧩 **Next.js Extras** - next-auth, @next/font, next-seo, next-sitemap, next-pwa
- ⚙️ **Next.js Options** - ESLint, Tailwind, src/app, App Router, Turbopack, import alias (all via prompt)
- 📦 **Dependency Installation** - Option to automatically install dependencies
- 🔄 **Git Integration** - Option to initialize a Git repository (or not, with .git folder cleanup)
- 🚀 **Auto Dev Server** - Option to run the development server automatically after setup
- 🖥️ **IDE Integration** - Option to open your project with VSCode, Cursor, Trae, or None
- 🧹 **Clean Output** - Minimal, professional CLI output

## Usage

Just run one of the installation commands above and follow the interactive prompts:

1. **Framework**: Choose Vite or Next.js
2. **Language**: Choose JavaScript or TypeScript
3. **Project Name**: Enter a name (no spaces allowed)
4. **Packages**: Select from a contextual list (Vite or Next.js compatible)
5. **Next.js Options**: (if Next.js) ESLint, Tailwind, src/app, App Router, Turbopack, import alias
6. **Git**: Choose whether to initialize a Git repository
7. **Dependencies**: Choose whether to automatically install dependencies
8. **Dev Server**: Choose whether to run the development server automatically after setup
9. **IDE Selection**: Choose which IDE to open your project with (VSCode, Cursor, Trae, or None)

## Example

```bash
$ bun create esyt@latest

 ______     ______     __  __     ______
/\  ___\   /\  ___\   /\ \_\ \   /\__  _\
\ \  __\   \ \___  \  \ \____ \  \/_/\ \/
 \ \_____\  \/\_____\  \/\_____\    \ \_\
  \/_____/   \/_____/   \/_____/     \/_/

✔ Which framework would you like to use? Vite
✔ Will you be using JavaScript or TypeScript? TypeScript
✔ What will your project be called? esyt-app
✔ Which packages would you like to enable? TailwindCSS, React Router, DotENV
✔ Initialize a new git repository? Yes
✔ Would you like us to run 'bun install'? Yes
✔ Which IDE would you like to open your project with? None
✔ Would you like to run the developmen t server automatically after setup? Yes
```

## What's Included

Depending on your selections, your project will be set up with:

- A Vite or Next.js project with JavaScript or TypeScript
- Contextual package selection (only compatible packages shown)
- Next.js-specific options (ESLint, Tailwind, src/app, App Router, Turbopack, import alias)
- TailwindCSS, React Router (Vite), React Icons, Framer Motion, OGL (Vite), Firebase, Clerk, Appwrite, Prisma, DotENV, Axios, and more
- Automatic .git folder removal if git is not requested
- Automatic project opening in your preferred IDE (VSCode, Cursor, or Trae)
- Clean, minimal output

## After Installation

Your project is ready to go! Just follow the standard start instructions for Vite or Next.js.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

Eshayat Al-Wasiu

## Links

- Homepage: [https://esyt.eshayat.com](https://esyt.eshayat.com)
- Repository: [https://github.com/ESHAYAT102/esyt](https://github.com/ESHAYAT102/esyt)
