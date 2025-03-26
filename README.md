# ChartV2

A React-based dashboard for visualizing NFTfi loan data, built with modern web technologies.

## Features

- Real-time NFT collection data visualization
- Advanced filtering with React Select dropdown
- Responsive design for all screen sizes
- Direct integration with NFTfi API

## Tech Stack

- React
- TypeScript
- Vite
- React Select
- Cloudflare Pages for deployment

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```
The server will start on http://localhost:5173 (or next available port)

3. For Cloudflare Pages development:
```bash
npm run pages:dev
```

## Deployment

The project is deployed to Cloudflare Pages. To deploy:

```bash
npm run pages:deploy
```

Production URL: https://chartv2.pages.dev

## Recent Updates

- Fixed loan filtering to exactly match the LTV buckets shown in chart tooltips
- Replaced custom dropdown with React Select for improved search functionality
- Added proper TypeScript support
- Implemented responsive styling
- Fixed Wrangler configuration for Cloudflare Pages deployment

## Development Guidelines

- Use TypeScript for all new components
- Follow React best practices and hooks guidelines
- Maintain responsive design principles
- Test across different browsers and screen sizes

## API Integration

The application integrates with the NFTfi API endpoint:
`https://theta-sdk-api.nftfi.com/data/v0/pipes/loans_due_by_collection_endpoint.json`

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

MIT
