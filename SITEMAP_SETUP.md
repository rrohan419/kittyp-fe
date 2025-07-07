# Sitemap Setup Guide

This document explains how the sitemap functionality is implemented in the Kittyp frontend application.

## Overview

The application provides two types of sitemaps:

1. **Human-readable sitemap** - `/sitemap` (HTML format)
2. **Search engine sitemap** - `/sitemap.xml` (XML format)

## Implementation

### 1. HTML Sitemap (`/sitemap`)

Located at: `src/pages/Sitemap.tsx`

This is a user-friendly sitemap that displays all pages organized by category:
- Main Pages (Home, How to Use, Why Eco Litter, About)
- Shop (Products, Categories)
- Legal & Company (Privacy, Terms, Contact, Articles)

### 2. XML Sitemap (`/sitemap.xml`)

Located at: `src/pages/SitemapXml.tsx`

This is a machine-readable sitemap for search engines that:
- Fetches sitemap data from the backend API (`/public/sitemap.xml`)
- Falls back to a generated sitemap if the API fails
- Returns proper XML format with SEO metadata

## Backend Integration

The frontend calls the `getSiteMap()` function from `authService.ts`:

```typescript
export const getSiteMap = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/public/sitemap.xml`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response;
  } catch (error: any) {
    throw error.response?.data || "failed. Please try again.";
  }
};
```

## Routing Configuration

The sitemap routes are configured in:

### `src/router.tsx`
```typescript
{
  path: "sitemap",
  element: <PageTransition><Sitemap /></PageTransition>,
},
{
  path: "sitemap.xml",
  element: <SitemapXml />,
},
```

### `src/components/layout/AnimatedRoutes.tsx`
```typescript
<Route
  path="/sitemap"
  element={
    <PageTransition key={location.pathname}>
      <Sitemap />
    </PageTransition>
  }
/>
<Route
  path="/sitemap.xml"
  element={<SitemapXml />}
/>
```

## XML Sitemap Structure

The fallback XML sitemap includes:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://kittyp.in/</loc>
    <lastmod>2024-01-01T00:00:00.000Z</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <!-- More URLs... -->
</urlset>
```

### SEO Elements

- **`<loc>`** - Full URL of the page
- **`<lastmod>`** - Last modification date (ISO format)
- **`<changefreq>`** - How often the page changes
- **`<priority>`** - Relative importance (0.0 to 1.0)

## Priority Levels

- **1.0** - Homepage (highest priority)
- **0.8** - Product pages, main content
- **0.7** - Articles, how-to guides
- **0.6** - About, informational pages
- **0.5** - Contact, utility pages
- **0.4** - Login, signup pages
- **0.3** - Legal pages, low-priority content

## Change Frequencies

- **daily** - Homepage, frequently updated content
- **weekly** - Products, articles
- **monthly** - Static pages, user pages
- **yearly** - Legal pages, rarely changed content

## Usage

### For Users
- Visit `/sitemap` to see a human-readable site map
- Navigate through categories to find pages

### For Search Engines
- Submit `https://kittyp.in/sitemap.xml` to search engines
- Add to `robots.txt`:
  ```
  Sitemap: https://kittyp.in/sitemap.xml
  ```

### For Developers
- The XML sitemap automatically fetches from backend
- Falls back to generated sitemap if API fails
- Includes all major pages with proper SEO metadata

## Customization

### Adding New Pages

1. **HTML Sitemap**: Add to the `sitemapSections` array in `Sitemap.tsx`
2. **XML Sitemap**: Add to the `generateFallbackSitemap()` function in `SitemapXml.tsx`

### Modifying Priorities

Update the priority values in the XML generation:
- Higher priority (0.8-1.0) for important pages
- Lower priority (0.1-0.3) for less important pages

### Changing Frequencies

Update the `changefreq` values based on how often pages are updated:
- `daily` for frequently updated content
- `weekly` for regular updates
- `monthly` for occasional updates
- `yearly` for static content

## Testing

1. **HTML Sitemap**: Visit `https://kittyp.in/sitemap`
2. **XML Sitemap**: Visit `https://kittyp.in/sitemap.xml`
3. **API Integration**: Check browser network tab for API calls
4. **Fallback**: Disconnect backend to test fallback generation

## SEO Benefits

- **Search Engine Discovery**: Helps search engines find all pages
- **Crawl Efficiency**: Prioritizes important pages
- **Update Frequency**: Tells search engines how often to check pages
- **Site Structure**: Provides clear site hierarchy

## Troubleshooting

### Common Issues

1. **XML not rendering**: Check content-type headers
2. **API errors**: Verify backend endpoint is working
3. **Missing pages**: Ensure all routes are included in sitemap
4. **Invalid XML**: Validate XML format with online tools

### Debug Tips

1. Check browser console for errors
2. Verify API endpoint in network tab
3. Test fallback generation by disabling backend
4. Validate XML format with search engine tools 