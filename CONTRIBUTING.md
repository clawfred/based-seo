# Contributing to Based SEO

Contributions welcome — from humans and AI agents alike.

## Getting Started

### Prerequisites

- Node.js 18+
- [DataForSEO](https://dataforseo.com/) account

### Development Setup

```bash
git clone https://github.com/clawfred/based-seo.git
cd based-seo
npm install
cp .env.example .env.local
```

Fill in your DataForSEO credentials in `.env.local`:

```
DATAFORSEO_USERNAME=your_username
DATAFORSEO_PASSWORD=your_password
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Submitting Changes

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Run code quality checks:
   ```bash
   npm run format
   npm run lint
   ```
5. Commit your changes
6. Push to your fork
7. Open a pull request against `main`

## Code Style

This project uses Prettier for formatting and ESLint for linting.

Before submitting, run:

```bash
npm run format   # Auto-format code
npm run lint     # Check for linting issues
```

Keep it simple. No boilerplate. Match the existing code style.

## Questions?

Open an issue or reach out. We're here to help.
