<h1 align=center>ESYT</h1>

<div align=center>

![GitHub Las Commit](https://img.shields.io/github/last-commit/ESHAYAT102/esyt?style=for-the-badge&labelColor=101418&color=9ccbfb)
![GitHub Stars](https://img.shields.io/github/stars/ESHAYAT102/esyt?style=for-the-badge&labelColor=101418&color=b9c8da)
![GitHub Repo Size](https://img.shields.io/github/repo-size/ESHAYAT102/esyt?style=for-the-badge&labelColor=101418&color=d3bfe6)

</div>

<p align=center>
A modern CLI tool to quickly scaffold Vite or Next.js projects with your preferred tech stack.
</p>

## Overview

`esyt` is a command-line interface tool that helps you create new Vite or Next.js projects with JavaScript or TypeScript, and popular packages like TailwindCSS, Framer Motion, Clerk, Appwrite, Prisma, and more. It provides a clean, professional setup experience with minimal output and smart automation.

## Install / run

Prefer using bun with the create flow:

```bash
bun create esyt
```

Alternatively:

```bash
npm create esyt@latest
```

```bash
pnpm create esyt@latest
```

## Quick example

Run non-interactively with Tailwind and dotenv, install deps, open VSCode, run dev:

```bash
bun create esyt -- -vite -js test-app --tailwindcss --react-router --dotenv --axios -i -code -no-git -dev
```

## Useful flags

- Framework: `-vite` / `-next`
- Language: `-js` / `-ts`
- Project Directory Name: e.g. test-app
- Packages: `--tailwindcss`, `--dotenv`, or any `--<pkg>` / `-<pkg>`
- Git: `-git` / override `--no-git`
- Install: `-i` / `--install` / override `--no-install`
- Editor: `-code`, `-zed`, `-cursor`, `-trae`
- Dev server: `-dev` / override `--no-dev`
- Non-interactive: `--yes` (accept sensible defaults)
- Help/version: `-h` / `-v`

Notes:
- Use `--` after `bun create` (or similar) to forward flags to this CLI.
- `--yes` can be combined with `--no-git` to override defaults.

## Links

- Repo: https://github.com/ESHAYAT102/esyt
- Homepage: https://esyt.eshayat.com
