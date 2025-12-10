# Contributing

Thanks for your interest in contributing to zarr-gl! Contributions are welcome in the form of bug reports, feature requests, and pull requests.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/zarr-gl.git`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b your-feature-name`

## Local Development

### Building and Testing

Available commands:
- `npm run dev` - Build in watch mode for development
- `npm run build` - Create production build
- `npm run lint` - Check for linting errors
- `npm run fmt` - Format code with Prettier
- `npm run check` - Type-check without emitting files
- `npm run all` - Run formatting, linting, and type-checking

### Testing Changes in Demo Apps

To test your local changes in the demo app or other projects:

1. In the zarr-gl root directory, build in watch mode:
   ```bash
   npm run dev
   ```

2. In a separate terminal, link the package:
   ```bash
   npm link
   ```

3. In your demo/test project directory:
   ```bash
   npm link zarr-gl
   ```

4. Start your demo app (e.g., for the included demo):
   ```bash
   cd demo
   npm run dev
   ```

The demo app will now use your local zarr-gl build, and changes will be reflected as you develop.

### Before Submitting

Before opening a pull request, run the checks to ensure your code passes all linting, formatting, and type-checking requirements:

```bash
npm run all
```

This will run formatting, linting, and type-checking. Fix any issues before committing.

## Pull Requests

When you open a pull request, a preview build is automatically created and deployed. A GitHub action will provide the link and code snippet to use in a comment on the PR.
