/**
 * Injects a floating home button into HTML responses from proxied child SPAs.
 * Uses Cloudflare HTMLRewriter — inline styles only, no dependency on child CSS.
 */
const HOME_BUTTON_HTML = `
<a href="/" id="dc-home-btn" style="
  position: fixed;
  bottom: 1.25rem;
  right: 1.25rem;
  z-index: 9999;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(15, 8, 25, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 20px;
  line-height: 1;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease;
" onmouseover="this.style.borderColor='hsl(300,100%,60%)';this.style.boxShadow='0 0 20px hsla(300,100%,60%,0.35)';this.style.color='hsl(300,100%,60%)';" onmouseout="this.style.borderColor='rgba(255,255,255,0.1)';this.style.boxShadow='0 2px 12px rgba(0,0,0,0.4)';this.style.color='rgba(255,255,255,0.7)';" title="Back to Hub">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
</a>`;

class HomeButtonInjector {
  element(element: Element) {
    element.append(HOME_BUTTON_HTML, { html: true });
  }
}

/**
 * Wraps a Response to inject the floating home button if the content-type is HTML.
 */
export function injectHomeButton(response: Response): Response {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) {
    return response;
  }

  return new HTMLRewriter()
    .on('body', new HomeButtonInjector())
    .transform(response);
}
