# Contributing to Soroban Contract Explorer

Thanks for your interest in improving the Soroban Contract Explorer. This guide explains how to set up the project, how the code is organized, the conventions to follow, and how to get a change merged. If you have not already, read [documentation.md](documentation.md) first; it explains how the app works and will make the codebase much easier to navigate.

## Table of contents

- [Code of conduct](#code-of-conduct)
- [Ways to contribute](#ways-to-contribute)
- [Development setup](#development-setup)
- [Project layout](#project-layout)
- [Coding conventions](#coding-conventions)
- [Adding support for a new Soroban type](#adding-support-for-a-new-soroban-type)
- [Testing](#testing)
- [Commit messages](#commit-messages)
- [Pull request process](#pull-request-process)
- [Reporting bugs](#reporting-bugs)
- [Requesting features](#requesting-features)
- [Where help is most wanted](#where-help-is-most-wanted)

## Code of conduct

Be respectful, assume good intent, and keep discussion focused on the work. Harassment of any kind is not welcome. Treat reviews as a conversation: explain your reasoning, ask questions when something is unclear, and prefer the simplest change that solves the problem.

## Ways to contribute

You do not have to write code to help. All of the following are valuable:

- Reporting a bug with clear steps to reproduce it.
- Improving the documentation in the `docs/` folder, including fixing typos and clarifying confusing sections.
- Suggesting a feature and describing the use case behind it.
- Adding tests for the pure logic modules, which currently have the most room for coverage.
- Implementing one of the open items listed under [Where help is most wanted](#where-help-is-most-wanted).

## Development setup

1. Fork the repository and clone your fork.
2. Install dependencies and create your local environment file:

   ```bash
   npm install
   cp .env.example .env
   ```

3. Start the dev server:

   ```bash
   npm run dev
   ```

   The app runs at [http://localhost:3000](http://localhost:3000).

4. Run the checks you will need before opening a pull request:

   ```bash
   npm run lint
   npm test
   npm run build
   ```

By default the app targets Stellar testnet. You do not need a wallet to work on most features, since simulation runs without one. To test transaction submission, install the [Freighter](https://www.freighter.app/) extension and set it to testnet.

## Project layout

A quick map of where things live. For full detail, see the project structure section in [documentation.md](documentation.md).

- `src/app/` holds the Next.js page and layout. `page.tsx` wires the pieces together.
- `src/components/` holds the presentational React components. They receive data and callbacks as props and avoid talking to the network directly.
- `src/hooks/` holds `use-contract` and `use-wallet`, which own the loading and wallet state.
- `src/lib/` holds the logic that has no UI: network reads, argument encoding, validation, and storage. This is where most non-visual changes belong.
- `src/types/` holds the shared TypeScript types.
- `tests/` holds the test files.

A good rule of thumb: keep network and encoding logic in `src/lib/`, keep stateful glue in `src/hooks/`, and keep components focused on rendering.

## Coding conventions

- **Language:** TypeScript and React with the Next.js App Router.
- **Styling:** Tailwind CSS utility classes. Match the existing dark theme and spacing rather than introducing new design tokens.
- **Formatting:** follow the style already in the files. Two-space indentation, double-quoted strings, and trailing semicolons. Run `npm run lint` before pushing.
- **Imports:** use the `@/` path alias for modules under `src/`, as the existing files do.
- **Types:** prefer explicit types for exported functions and shared data. Reuse the types in `src/types/contract.ts` instead of redefining shapes.
- **Errors:** throw `Error` with a clear, user-facing message in the lib layer, and let the hooks and page surface that message. Avoid swallowing errors silently except where a fallback is genuinely safe, such as `localStorage` access.
- **Server safety:** any code touching `window` or `localStorage` must guard for the server-rendering case, as `recent-contracts.ts` does.
- **Keep the scope narrow.** This project deliberately does one thing well. New features should fit the "read and write any deployed contract" goal rather than expanding it into an IDE.

## Adding support for a new Soroban type

Type support touches several files in a predictable order. Adding one is a great first contribution. Using a new type as the example, you would:

1. **Declare it.** Add the type name to the `SorobanType` union in `src/types/contract.ts`.
2. **Parse it.** In `src/lib/contract-parser.ts`, handle the matching `scSpecType...` case in `mapSpecType` so the parser recognizes it in the contract spec.
3. **Encode it.** In `src/lib/invocation.ts`, add a case to `valueToScVal` that converts the user's string input into the correct `ScVal`.
4. **Validate it.** In `src/lib/validators.ts`, add a case to `validateValue` so invalid input is caught before encoding, with a clear message.
5. **Document it.** Update the supported types and input formats sections in [documentation.md](documentation.md) so users know the expected format.
6. **Test it.** Add tests for encoding and validation covering valid input, invalid input, and edge cases.

Container types such as `Vec` and `Option` carry an inner type. If you add another container, thread the inner type through all four steps the way the existing container cases do.

## Testing

Run the suite with:

```bash
npm test
```

Guidelines:

- The highest-value tests cover pure logic: `validators.ts`, `validation.ts`, `recent-contracts.ts`, and the `argsFromValues` and `valueToScVal` paths in `invocation.ts`. These have clear inputs and outputs and need no network.
- For each behavior, test the valid case, the invalid case, and boundary conditions. For numbers that means the minimum, the maximum, and one past each.
- Avoid tests that depend on a live network or a real contract. If a unit needs the RPC server, isolate and mock that boundary rather than reaching out over the network.
- When you fix a bug, add a test that fails without your fix and passes with it.

## Commit messages

Write clear, present-tense messages that explain the change. The history in this repo uses short prefixes that are worth following:

- `feat:` for a new capability.
- `fix:` for a bug fix.
- `docs:` for documentation only.
- `test:` for adding or changing tests.
- `refactor:` for changes that do not alter behavior.

For example: `feat: add Map type support to the function form`. Keep the subject line short and put any extra detail in the body.

## Pull request process

1. Create a branch off `main` with a descriptive name.
2. Make focused commits. A pull request that does one thing is far easier to review than one that does several.
3. Before opening the request, run `npm run lint`, `npm test`, and `npm run build` and make sure all three pass.
4. Open the pull request against `main`. In the description, explain what changed and why, link any related issue, and include screenshots for visual changes.
5. Respond to review feedback by pushing follow-up commits to the same branch.
6. A maintainer will merge once the change looks good and the checks pass.

Keep pull requests small where you can. If a change is large, consider opening an issue first to agree on the approach before you write the code.

## Reporting bugs

Open an issue and include:

- What you did, step by step, including the contract ID and function if relevant.
- What you expected to happen.
- What actually happened, including any error text shown in the result panel or the browser console.
- Your environment: browser, whether Freighter is installed, and the network you were on.

A minimal, reliable reproduction is the single most helpful thing you can provide.

## Requesting features

Open an issue describing the use case before the solution. Explain who needs it and why, and how it fits the project's narrow goal of reading and writing deployed contracts. That context helps maintainers and other contributors weigh the request and shape a good design.

## Where help is most wanted

These are the current open areas, also noted in the README and tracked as issues:

- Support for complex Soroban types: `Map`, structs, enums, and tuples.
- Hardening and testing mainnet support, which is configurable but experimental today.
- Shareable direct contract URLs, for example `/contract/CABCD...`, so a contract view can be linked.
- Distinguishing read-only functions from state-changing ones so the UI can guide the Simulate versus Submit choice.
- More test coverage across the pure logic modules.

Pick one, comment on the issue to claim it, and open a pull request when you are ready. Thank you for contributing.
