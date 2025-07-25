# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Planted is an exclusive dating platform for vegetarians and vegans. This is a static website (no build process) with a landing page and application form that integrates with Stripe for payment verification and Zapier for backend processing.

## Development Setup

### Running Locally
Since this is a static site with no build process, you can serve it using any static file server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js http-server (if available)
npx http-server -p 8000

# Or simply open index.html directly in a browser
open index.html
```

### Testing Changes
- No automated tests exist - test manually in browser
- Test pages available: `debug-test.html`, `test-faq.html`
- Test responsive design at breakpoints: 768px, 1024px
- Test Stripe integration with test card: 4242 4242 4242 4242

## Architecture

### Static Site Structure
- **index.html**: Landing page with story-driven narrative
- **application.html**: Multi-step application form with Stripe payment
- **style.css**: All styling, uses CSS variables, mobile-first responsive design
- **script.js**: Frontend interactions (animations, mobile nav, form handling)
- **backend.js**: Zapier webhook and Stripe integration

### Key Design Patterns
- **No Framework**: Pure vanilla HTML/CSS/JS
- **CSS Variables**: Defined in `:root` for consistent theming
- **Intersection Observer**: For scroll-triggered animations
- **Mobile-First**: Base styles for mobile, enhanced for desktop

### Integration Points
- **Stripe**: Payment verification ($1 charge)
  - Replace `pk_test_YOUR_STRIPE_PUBLIC_KEY` in backend.js
- **Zapier Webhook**: Form submission processing
  - Replace webhook URL in backend.js

## Code Standards

### CSS Organization
- Variables defined at top in `:root`
- Sections clearly commented
- Mobile-first with min-width media queries
- Animations use cubic-bezier for natural movement

### JavaScript Patterns
- Event listeners added via addEventListener
- Intersection Observer for performance
- Forms validated before submission
- Smooth animations with requestAnimationFrame

### Brand Guidelines
Key brand elements from design-spec.md:
- **Colors**: Black (#000), White (#FFF), Green (#00D27A)
- **Fonts**: Instrument Serif (headlines), Inter (body)
- **Voice**: Honest, empathetic, confident
- **Animations**: Subtle, purposeful, 60fps target

## Common Tasks

### Adding New Sections
1. Add HTML section with consistent structure
2. Style with existing CSS patterns
3. Add scroll animations using Intersection Observer pattern
4. Test on mobile and desktop

### Updating Copy
- Maintain brand voice (see design-spec.md)
- Keep headlines impactful and specific
- Use "members" not "users"

### Modifying Animations
- Standard transition: `all 0.4s cubic-bezier(0.4, 0, 0.2, 1)`
- Entrance animations: fade up with 30px translateY
- Keep animations subtle and meaningful

## Deployment Notes

This is a static site that can be deployed to:
- GitHub Pages (current deployment)
- Netlify/Vercel (drag and drop)
- Any static hosting service

Before deploying:
1. Update API keys in backend.js
2. Test all forms and integrations
3. Verify responsive design
4. Check console for errors