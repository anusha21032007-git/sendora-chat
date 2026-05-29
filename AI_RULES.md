# AI_RULES.md

## Tech Stack
- React with TypeScript for frontend
- React Router for client-side routing
- Shadcn UI library for prebuilt components
- Radix UI components for additional UI elements
- Tailwind CSS for styling
- Lucide React for icons

## Library Usage Rules
1. **Shadcn UI** - Use for primary components (buttons, cards, forms)
2. **Radix UI** - Use for advanced components (date pickers, dialogs)
3. **Tailwind** - All custom styling must use Tailwind classes
4. **No direct DOM manipulation** - Use React state and hooks instead
5. **No CSS-in-JS** - All styles must be in Tailwind
6. **No external icon libraries** - Use Lucide React icons only
7. **No third-party UI libraries** - Only use approved shadcn/Radix components
8. **No TypeScript type definitions** - Use JSDoc for type annotations
9. **No CSS preprocessors** - Only use plain CSS with Tailwind
10. **No CSS frameworks** - No Bootstrap, Material-UI, or similar

## File Structure
- Pages: src/pages/
- Components: src/components/
- App routes: src/App.tsx
- Main page: src/pages/Index.tsx

## Development Rules
- All new components must be created in src/components/
- All pages must be created in src/pages/
- No code outside src/ directory
- No global state management
- No Redux or Zustand
- No CSS modules
- No CSS variables
- No CSS preprocessors
- No CSS-in-JS
- No third-party UI libraries
- No TypeScript type definitions