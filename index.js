const VARIANTS_URL = "https://cfw-takehome.developers.workers.dev/api/variants"
const COOKIE_NAME = "VARIANT"

/**
 * Parses header and gets a cookie by name
 * Src: https://developers.cloudflare.com/workers/templates/#cookie_extract
 * @param {Request} request 
 * @param {String} name 
 */
const getCookie = (request, name) => {
  let result = null
  let cookieString = request.headers.get("Cookie")
  if (cookieString) {
    const cookies = cookieString.split(";")
    cookies.forEach(cookie => {
      let cookieName = cookie.split("=")[0].trim()
      if (cookieName === name) {
        let cookieVal = cookie.split("=")[1]
        result = cookieVal
      }
    })
  }
  return result
}

const handleCookieUrl = async url => {
  if (!url) return null
  try {
    return await fetch(url)
  } catch(err) {
    return null
  }
}

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request))
})

/**
 * Respond with hello worker text
 * @param {Request} request
 */
const handleRequest = async request => {
  // Checks cookie for returning client
  let url = getCookie(request, COOKIE_NAME)
  let urlRes = await handleCookieUrl(url)

  // If cookie url is broken, fallback to one of the 2 variants
  if (!urlRes || urlRes.status >= 400) {
    const variantRes = await fetch(VARIANTS_URL)
    const json = await variantRes.json()
    // https://stackoverflow.com/questions/5915096/get-random-item-from-javascript-array
    url = json.variants[Math.floor(Math.random() * json.variants.length)]
    urlRes = await fetch(url)
  }
  return new HTMLRewriter()
    .on("title", new TitleElementHandler())
    .on("h1#title", new TitleElementHandler())
    .on("p#description", new DescriptionElementHandler())
    .on("a#url", new UrlElementHandler())
    .transform(new Response(urlRes.body, {
    status: urlRes.status,
    statusText: urlRes.statusText,
    headers: { 
      "Set-Cookie": `${COOKIE_NAME}=${url}` 
    },
  }))
}

class TitleElementHandler {
  element(element) {
    element.append(" - Steven Than")
  }
}

class UrlElementHandler {
  element(element) {
    element.setAttribute("href", "https://thanst.com")
    element.setInnerContent("Check out my personal website")
  }
}

class DescriptionElementHandler {
  element(element) {
    element.setInnerContent(`Clear cookie to experience the other variant. 
      Stay safe and healthy!`)
  }
}
