/** Read bounded MP4 movie metadata; never trust browser-reported duration for billing. */
export function mp4Duration(buffer: ArrayBuffer): number | null {
  const data = new DataView(buffer);
  const typeAt = (at: number) =>
    String.fromCharCode(...new Uint8Array(buffer, at, 4));
  const scan = (start: number, end: number, depth: number): number | null => {
    if (depth > 2) return null;
    for (let at = start; at + 8 <= end;) {
      let size = data.getUint32(at);
      let header = 8;
      if (size === 1) {
        if (at + 16 > end) return null;
        const large = data.getBigUint64(at + 8);
        if (large > BigInt(Number.MAX_SAFE_INTEGER)) return null;
        size = Number(large);
        header = 16;
      }
      if (size === 0) size = end - at;
      if (size < header || at + size > end) return null;
      const type = typeAt(at + 4);
      const body = at + header;
      if (type === "moov") {
        const value = scan(body, at + size, depth + 1);
        if (value !== null) return value;
      }
      if (type === "mvhd" && depth === 1) {
        const version = data.getUint8(body);
        if (version !== 0 && version !== 1) return null;
        const offset = version === 1 ? 20 : 12;
        if (body + offset + (version === 1 ? 12 : 8) > at + size) return null;
        const scale = data.getUint32(body + offset);
        const duration = version === 1
          ? Number(data.getBigUint64(body + offset + 4))
          : data.getUint32(body + offset + 4);
        return scale > 0 && Number.isFinite(duration) ? duration / scale : null;
      }
      at += size;
    }
    return null;
  };
  if (buffer.byteLength < 16 || typeAt(4) !== "ftyp") return null;
  return scan(0, buffer.byteLength, 0);
}

export function validSourcePath(
  userId: string,
  jobId: string,
  path: unknown,
): path is string {
  return typeof path === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      .test(jobId) &&
    path === `${userId}/${jobId}/source.mp4`;
}

export async function readLimited(
  response: Response,
  limit: number,
): Promise<ArrayBuffer> {
  if (
    !response.ok || !response.body ||
    Number(response.headers.get("content-length")) > limit
  ) throw new Error("Invalid file response");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      length += next.value.length;
      if (length > limit) throw new Error("File too large");
      chunks.push(next.value);
    }
  } finally {
    await reader.cancel();
  }
  const result = new Uint8Array(length);
  let at = 0;
  for (const chunk of chunks) {
    result.set(chunk, at);
    at += chunk.length;
  }
  return result.buffer;
}
