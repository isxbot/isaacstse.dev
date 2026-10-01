/**
 * The site is built with Astro's directory format: /resume/ is stored as resume/index.html.
 * This function does the mapping:
 *   /resume/   -> fetch /resume/index.html
 *   /resume    -> 301 to /resume/  (canonical URLs end in a slash)
 *   /style.css -> unchanged (has a file extension)
 */
export const siteRequestFunction = `
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  if (uri.endsWith('/')) {
    request.uri = uri + 'index.html';
    return request;
  }

  var lastSegment = uri.substring(uri.lastIndexOf('/') + 1);
  if (lastSegment.indexOf('.') === -1) {
    return {
      statusCode: 301,
      statusDescription: 'Moved Permanently',
      headers: { location: { value: uri + '/' } },
    };
  }

  return request;
}
`;

/** isaacstse.dev and www.isaacstse.dev -> https://dillon.isaacstse.dev, keeping the path. */
export function redirectFunction(targetHost: string) {
  return `
function handler(event) {
  return {
    statusCode: 301,
    statusDescription: 'Moved Permanently',
    headers: { location: { value: 'https://${targetHost}' + event.request.uri } },
  };
}
`;
}
