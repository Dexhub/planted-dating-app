# Planted Design Specification & Brand Guidelines

## Table of Contents
1. [Brand Overview](#brand-overview)
2. [Brand Values](#brand-values)
3. [Visual Identity](#visual-identity)
4. [Typography](#typography)
5. [Color Palette](#color-palette)
6. [Logo Guidelines](#logo-guidelines)
7. [Photography & Imagery](#photography-imagery)
8. [Voice & Tone](#voice-tone)
9. [UI Components](#ui-components)
10. [Animation Guidelines](#animation-guidelines)

---

## Brand Overview

**Planted** is an exclusive dating platform for vegetarians and vegans who are tired of explaining their values on first dates. We're not just another dating app with filters - we're a curated community where shared values come first.

### Mission
To create meaningful connections between conscious singles who share plant-based values, eliminating the friction of lifestyle incompatibility from the dating experience.

### Vision
A world where finding love doesn't require compromising your values.

---

## Brand Values

### 1. **Authenticity**
- Real stories from real people
- No fake profiles, video verification required
- Honest about the struggles of values-based dating

### 2. **Exclusivity**
- Quality over quantity
- Hand-selected founding members
- Limited spots create value

### 3. **Understanding**
- We've lived these experiences
- No judgment, only empathy
- "We get it" is our mantra

### 4. **Community**
- Not users, but members
- Building connections beyond dating
- Shared experiences create bonds

---

## Visual Identity

### Design Principles

1. **Sophisticated Minimalism**
   - Clean, uncluttered layouts
   - Strategic use of whitespace
   - Every element has purpose

2. **Premium Feel**
   - High contrast black & white base
   - Selective color highlights
   - Editorial typography

3. **Organic Movement**
   - Subtle animations that feel alive
   - Natural, flowing transitions
   - Nothing feels mechanical

4. **Emotional Resonance**
   - Design that tells a story
   - Visual hierarchy guides emotion
   - Progressive disclosure of information

---

## Typography

### Primary Typeface: Instrument Serif
- Used for headlines and emotional moments
- Conveys elegance and sophistication
- Creates editorial feel

**Usage:**
- H1: 80-120px (clamp: 48px, 10vw, 120px)
- H2: 48-80px (clamp: 36px, 7vw, 80px)
- H3: 32-48px (clamp: 32px, 5vw, 48px)
- Pull quotes: 24-36px

### Secondary Typeface: Inter
- Used for body text and UI elements
- Clean, highly legible
- Modern and approachable

**Weights:**
- Regular (400): Body text
- Medium (500): Emphasis
- Semi-bold (600): Buttons, labels
- Bold (700): Strong emphasis
- Black (900): Numbers, impact

**Usage:**
- Body: 16-20px
- Small text: 14-16px
- Buttons: 18px semi-bold
- Labels: 14px medium

### Type Hierarchy
```
Massive Statement (Opening): 120px Instrument Serif
Section Headers: 56px Instrument Serif
Story Headlines: 48px Instrument Serif
Card Headers: 24px Inter Semi-bold
Body Text: 18px Inter Regular
Captions: 16px Inter Regular
Small Text: 14px Inter Regular
```

---

## Color Palette

### Primary Colors

**Pure Black**
- Hex: #000000
- RGB: 0, 0, 0
- Usage: Primary text, backgrounds, high contrast elements

**Pure White**
- Hex: #FFFFFF
- RGB: 255, 255, 255
- Usage: Primary background, reversed text

**Planted Green**
- Hex: #00D27A
- RGB: 0, 210, 122
- Usage: Primary accent, CTAs, highlights, success states

### Secondary Colors

**Dark Green**
- Hex: #003D21
- RGB: 0, 61, 33
- Usage: Hover states, depth, premium sections

**Warm Cream**
- Hex: #FAF7F0
- RGB: 250, 247, 240
- Usage: Soft backgrounds, warmth

**Medium Gray**
- Hex: #666666
- RGB: 102, 102, 102
- Usage: Secondary text, subtle elements

**Light Gray**
- Hex: #F5F5F5
- RGB: 245, 245, 245
- Usage: Backgrounds, borders, subtle separation

### Color Usage Rules
1. Black on white is primary combination
2. Green used sparingly for maximum impact
3. No gradients except in special effects (cursor glow)
4. High contrast is non-negotiable

---

## Logo Guidelines

### Primary Mark
- Symbol: 🌱 (seedling emoji)
- Wordmark: "Planted" in Instrument Serif

### Logo Variations
1. **Full Logo**: Symbol + Wordmark (primary use)
2. **Symbol Only**: For small spaces, app icon
3. **Wordmark Only**: When symbol is redundant

### Spacing & Clear Space
- Minimum clear space: 1x height of seedling
- Logo should breathe, never feel cramped

### Don'ts
- Don't alter colors
- Don't add effects or shadows
- Don't distort proportions
- Don't place on busy backgrounds

---

## Photography & Imagery

### Photography Style
- Authentic, candid moments
- Natural lighting preferred
- Focus on genuine emotions
- Diverse representation

### Subject Matter
- Real members (with permission)
- Plant-based food in context
- Urban farming/markets
- Couple activities

### Treatment
- High contrast black & white for drama
- Color photos should be warm, natural
- No heavy filters or artificial looks
- Documentary style preferred

### Don'ts
- Stock photos that feel generic
- Overly staged scenarios
- Cliché vegetable arrangements
- Anything that feels inauthentic

---

## Voice & Tone

### Brand Voice Attributes
1. **Honest**: We tell it like it is
2. **Empathetic**: We've been there
3. **Confident**: We know our value
4. **Warm**: Never cold or corporate
5. **Witty**: Clever, not trying too hard

### Tone Variations

**Opening/Hook**: Direct, provocative
> "You're tired of explaining yourself on first dates."

**Storytelling**: Vulnerable, specific
> "Date #17 this year. Same script. Different restaurant."

**Features**: Clear, benefit-focused
> "100 people who share your values > 10,000 who don't"

**CTAs**: Confident, inviting
> "Ready to stop explaining yourself?"

### Writing Guidelines
- Short sentences for impact
- Specific details over generalities
- Show don't tell
- One idea per line in key moments
- Questions that make people think

### Words We Use
- Members (not users)
- Values (not preferences)
- Community (not platform)
- Journey (not process)
- People/Singles (not matches)

### Words We Avoid
- Revolutionary/Disruptive
- Swipe
- Algorithm
- Optimize
- Scale/Growth hack

---

## UI Components

### Buttons

**Primary CTA**
```css
Background: var(--black)
Color: var(--white)
Padding: 25px 60px
Border-radius: 10px
Font: 18px Inter Semi-bold
Hover: Background changes to var(--dark-green)
```

**Secondary CTA**
```css
Background: transparent
Border: 2px solid var(--black)
Color: var(--black)
Padding: 20px 40px
Border-radius: 10px
```

### Cards

**Feature Cards**
```css
Background: var(--white)
Border: 1px solid rgba(255,255,255,0.2)
Border-radius: 20px
Padding: 40px
Hover: translateY(-5px)
```

### Forms

**Input Fields**
```css
Border: 2px solid var(--light-gray)
Border-radius: 10px
Padding: 20px
Font-size: 16px
Focus: Border-color: var(--green)
```

### Sections
- Full-width with centered content
- Max-width: 1200px for readability
- Generous padding: 100-120px vertical
- Breathing room between elements

---

## Animation Guidelines

### Principles
1. **Purpose**: Every animation has meaning
2. **Subtlety**: Enhance, don't distract
3. **Performance**: Keep it smooth (60fps)
4. **Natural**: Organic, not mechanical

### Standard Transitions
```css
--transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
```

### Animation Types

**Entrance Animations**
- Fade up: opacity 0→1, translateY 30px→0
- Stagger children: 200ms delay between
- Duration: 0.8s

**Hover States**
- Scale: 1→1.02
- Translate: Y -5px to -10px
- Add shadows for depth

**Number Counters**
- Duration: 1.5s
- Ease-out timing
- Start on viewport entry

**Scroll Parallax**
- Subtle: 0.5x speed differential
- Only on hero sections
- Disable on mobile

### Interactive Elements

**Cursor Glow**
- Follows mouse with easing
- 400px radial gradient
- 10% opacity green glow
- Smooth pursuit: 0.1 lerp factor

**Form Fields**
- Scale parent on focus: 1.02
- Smooth border color transition
- No jarring movements

---

## Implementation Notes

### Performance
- Minimize reflows/repaints
- Use CSS transforms over position
- Lazy load images below fold
- Optimize font loading

### Accessibility
- High contrast ratios (WCAG AAA)
- Focus states clearly visible
- Semantic HTML structure
- Screen reader friendly

### Responsive Design
- Mobile-first approach
- Key breakpoints: 768px, 1024px
- Touch-friendly tap targets (44px min)
- Readable font sizes on all devices

---

## Summary

Planted's design system creates an exclusive, premium experience that resonates emotionally with our target audience. Every design decision reinforces our core message: this is a space where you belong, where your values are understood, and where finding love doesn't require compromise.

The sophistication of our design mirrors the maturity of our members' values, while the warmth in our voice reminds them they're among friends who truly understand their journey.