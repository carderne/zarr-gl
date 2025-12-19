# Contributing

Thanks for your interest in contributing to zarr-gl! Contributions are welcome in the form of bug reports, feature requests, and pull requests.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/zarr-gl.git`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b your-feature-name`

## Local Development

### Available Commands

- `npm run dev` - Build in watch mode for development
- `npm run build` - Create production build
- `npm run serve` - Serve the dist folder on http://localhost:8888 with CORS enabled
- `npm run lint` - Check for linting errors
- `npm run fmt` - Format code with Prettier
- `npm run check` - Type-check without emitting files
- `npm run all` - Run formatting, linting, and type-checking

### Build Modes

- **Development mode** (`npm run dev`): 
  - Unminified code
  - Source maps enabled for debugging
  - Larger bundle size
  - Recommended for local development
  
- **Production mode** (`npm run build`):
  - Minified code
  - No source maps
  - Smaller bundle size
  - Used for PR previews and releases

### Testing Changes with the Demo App

The included demo application is already configured to use your local `zarr-gl` build via `"zarr-gl": "file:../"` in its package.json.

#### Quick Start (Recommended)

Run both in separate terminal windows:

**Terminal 1 - Library (with hot reload):**
```bash
npm run dev
```

**Terminal 2 - Demo App:**
```bash
cd demo
npm run dev
```

Now when you edit files in `src/`, webpack will automatically rebuild and the demo will pick up changes.

#### Manual Build

If you prefer to build manually:

```bash
# Build library in development mode (includes source maps)
npx webpack --mode development

# Or build for production (no source maps)
npm run build

# Then run demo
cd demo
npm run dev
```

### Testing Changes in Other Projects

#### Option 1: Using File Dependency (Simpler)

To use your local `zarr-gl` build in any project:

1. In your project's `package.json`, add:
   ```json
   {
     "dependencies": {
       "zarr-gl": "file:../path/to/zarr-gl"
     }
   }
   ```

2. Run `npm install` in your project

3. The project will use your local build from `dist/zarr-gl.js`

#### Option 2: Using npm link

Alternatively, you can use `npm link`:

1. In the zarr-gl root directory:
   ```bash
   npm link
   ```

2. In your test project directory:
   ```bash
   npm link zarr-gl
   ```

3. Start your project and it will use your local build

#### Option 3: Using npm run serve

For quick testing without modifying dependencies, you can serve the built library and load it directly:

1. Build the library:
   ```bash
   npm run build
   ```

2. Serve the dist folder:
   ```bash
   npm run serve
   ```

3. In your test project's HTML, load the library from the local server:
   ```html
   <script src="http://localhost:8888/zarr-gl.js"></script>
   ```

This approach is useful for quick testing or when working with projects that load the library via a script tag.

### Debugging

Development builds include source maps, so you can:
- Set breakpoints in the original TypeScript source
- See proper stack traces
- Inspect unminified code

Make sure to use development mode when debugging:
```bash
npm run dev
```

### Before Submitting

Before opening a pull request, run the checks to ensure your code passes all linting, formatting, and type-checking requirements:

```bash
npm run all
```

This will run formatting, linting, and type-checking. Fix any issues before committing.

## Pull Requests

When you open a pull request, a preview build is automatically created and deployed. A GitHub action will provide the link and code snippet to use in a comment on the PR.
