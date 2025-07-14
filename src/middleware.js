import { defineMiddleware } from 'astro:middleware'

export const onRequest = defineMiddleware(async (context, next) => {
  try {
    // Process the request
    const response = await next()
    return response
  } catch (error) {
    // Log the error for debugging
    console.error('Server Error:', error)
    
    // Check if this is already the 500 page to prevent infinite loops
    if (context.url.pathname === '/500') {
      // If the 500 page itself has an error, return a basic error response
      return new Response(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Server Error</title>
            <style>
              body { font-family: monospace; margin: 40px; background: #000; color: #fff; }
              h1 { color: #ff6b6b; }
            </style>
          </head>
          <body>
            <h1>500 - Internal Server Error</h1>
            <p>Something went wrong on our end. Please try again later.</p>
            <p><a href="/" style="color: #fff;">← Back to Home</a></p>
          </body>
        </html>
        `,
        { 
          status: 500, 
          headers: { 'Content-Type': 'text/html' } 
        }
      )
    }

    // Redirect to the 500 error page with error context
    try {
      // Create a new request for the 500 page with error context
      const errorPageUrl = new URL('/500', context.url.origin)
      
      // Create a new request to the 500 page
      const errorRequest = new Request(errorPageUrl, {
        method: 'GET',
        headers: context.request.headers
      })
      
      // Create a new context for the 500 page
      const errorContext = {
        ...context,
        request: errorRequest,
        url: errorPageUrl,
        props: { error }
      }
      
      // Try to render the 500 page
      const errorResponse = await context.rewrite('/500')
      return new Response(errorResponse.body, {
        status: 500,
        headers: errorResponse.headers
      })
    } catch (redirectError) {
      // If rendering the 500 page fails, return a simple error page
      console.error('Error rendering 500 page:', redirectError)
      return new Response(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Server Error</title>
            <style>
              body { font-family: monospace; margin: 40px; background: #000; color: #fff; }
              h1 { color: #ff6b6b; }
            </style>
          </head>
          <body>
            <h1>500 - Internal Server Error</h1>
            <p>Something went wrong on our end. Please try again later.</p>
            <p><a href="/" style="color: #fff;">← Back to Home</a></p>
          </body>
        </html>
        `,
        { 
          status: 500, 
          headers: { 'Content-Type': 'text/html' } 
        }
      )
    }
  }
})