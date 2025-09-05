// Placeholder API implementations.  Replace with your own backend calls.

function delay(ms = 600) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}

/**
 * Simulate an image generation endpoint.  Returns a piece of text and a dummy
 * image URL based on the prompt.  Replace this with your own API call.
 */
export async function generateImageFromPrompt(prompt: string) {
  // In demo mode this API call is disabled.  Return a constant message
  // indicating what would normally happen.  No image is returned.
  await delay(300)
  return { text: 'what api is called', imageUrls: [] }
}

/**
 * Simulate a random song suggestion.  Useful for the “Surprise me with a
 * random song” helper button.  Replace this with a real random song API if
 * desired.
 */
export async function surpriseMeSong() {
  // In demo mode this API call is disabled.  Return a constant message
  // indicating what would normally happen.
  await delay(300)
  return { message: 'what api is called' }
}

/**
 * Pretend login.  Accepts any username and returns it.  No validation is
 * performed.
 */
export async function fakeLogin(username: string) {
  await delay(300)
  return { ok: true, username }
}

/**
 * Pretend logout.  Always succeeds.
 */
export async function fakeLogout() {
  await delay(200)
  return { ok: true }
}