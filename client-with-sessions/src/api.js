export async function readApiResponse(response) {
  const body = await response.text();
  let data = null;

  if (body) {
    try {
      data = JSON.parse(body);
    } catch {
      if (response.ok || response.status >= 500) {
        throw new Error(
          `The server returned an unexpected response (HTTP ${response.status}). Check the Flask API logs.`
        );
      }
      throw new Error(`The server returned an unexpected response (HTTP ${response.status}).`);
    }
  }

  if (!response.ok) {
    const message = data?.error || data?.errors?.join(", ") || `Request failed (HTTP ${response.status}).`;
    throw new Error(message);
  }

  return data;
}
