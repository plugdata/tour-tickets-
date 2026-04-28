export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // Handle static assets
  if (pathname.includes('.') || pathname.startsWith('/assets/')) {
    return context.next();
  }

  // Handle page routing
  const pageRoutes = {
    '/booking/seats': '/pages/booking/seats.html',
    '/booking/form': '/pages/booking/form.html',
    '/booking/insurance': '/pages/booking/insurance.html',
    '/booking/ticket': '/pages/booking/ticket.html',
    '/login': '/pages/login.html',
    '/dashboard': '/pages/dashboard.html',
    '/admin/dashboard': '/pages/admin/dashboard.html',
    '/users/profile': '/pages/user/profile.html',
    '/trips': '/pages/products.html',
    '/payments': '/pages/payments/index.html',
    '/insurance': '/pages/insurance/index.html'
  };

  // Check if path matches a route
  if (pageRoutes[pathname]) {
    const response = await context.env.ASSETS.fetch(
      new Request(context.request.url.replace(pathname, pageRoutes[pathname]))
    );
    
    // Fix relative paths in HTML
    let html = await response.text();
    html = html.replace(
      /href="(\.\.\/)/g,
      'href="/'
    );
    html = html.replace(
      /src="(\.\.\/)/g,
      'src="/'
    );
    
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
        ...response.headers
      }
    });
  }

  // Fallback to index
  return context.next();
}
