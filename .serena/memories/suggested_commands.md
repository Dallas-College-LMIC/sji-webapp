# Suggested Commands

## Development Commands
- `npm run dev` - Start Vite development server (opens at http://localhost:3000)
- `npm run build` - Build for production (TypeScript check + Vite build)
- `npm run preview` - Preview production build locally

## Testing Commands
- `npm test` - Run tests in watch mode (interactive development)
- `npm run test:run` - Run tests once (for CI/pre-commit)
- `npm run test:ui` - Open Vitest UI for visual test exploration
- `npm run test:coverage` - Generate coverage report

## Type Checking
- `npm run type-check` - Run TypeScript compiler without emitting files

## Deployment
- `npm run deploy` - Build and deploy to GitHub Pages

## Git Commands (Linux)
- `git status` - Check repository status
- `git add .` - Stage all changes
- `git commit -m "message"` - Commit changes
- `git push` - Push to remote repository
- `git pull` - Pull latest changes
- `git checkout -b branch-name` - Create new branch
- `git diff` - View unstaged changes

## System Commands (Linux)
- `ls -la` - List files with details
- `cd directory` - Change directory
- `pwd` - Show current directory
- `cat file` - Display file contents
- `grep -r "pattern" .` - Search for pattern recursively
- `find . -name "*.ts"` - Find files by pattern

## Process Management
- `ps aux | grep node` - List Node.js processes
- `kill -9 PID` - Force kill process
- `lsof -i :3000` - Check what's using port 3000