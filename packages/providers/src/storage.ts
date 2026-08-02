/**
 * Object storage (Cloudflare R2 in production, S3-compatible).
 *
 * Behind an interface for the same reason as every other provider: no service
 * imports an SDK directly (PROJECT.md §3). It also means the upload pipeline is
 * testable end to end without a bucket.
 */

export interface SignedUpload {
  url: string;
  /** Headers the client must replay exactly, or the signature will not verify. */
  headers: Record<string, string>;
  expiresAt: Date;
}

export interface StorageProvider {
  readonly name: string;

  /** Presigned PUT. The client uploads straight to storage — bytes never pass
   *  through our API (PROJECT.md §5.1). */
  createSignedUpload(key: string, mime: string, maxBytes: number): Promise<SignedUpload>;

  /** Reads the first N bytes, for magic-byte verification, without pulling a
   *  12 MB image into the worker's memory. */
  readRange(key: string, start: number, end: number): Promise<Uint8Array>;

  getObject(key: string): Promise<Uint8Array>;
  putObject(key: string, body: Uint8Array, mime: string): Promise<void>;
  deleteObject(key: string): Promise<void>;

  /** Public URL for a stored object. Only ever called for assets whose
   *  moderation status is `pass`. */
  publicUrl(key: string): string;
}

/** In-memory fake. Backed by a Map, so the upload pipeline can be integration-
 *  tested with no bucket and no credentials. */
export class FakeStorageProvider implements StorageProvider {
  readonly name = 'fake-storage';
  private readonly objects = new Map<string, { body: Uint8Array; mime: string }>();

  constructor(private readonly baseUrl = 'https://fake.local/assets') {}

  createSignedUpload(key: string, mime: string, maxBytes: number): Promise<SignedUpload> {
    return Promise.resolve({
      url: `${this.baseUrl}/${key}?signed=1`,
      headers: { 'content-type': mime, 'content-length-range': `0,${maxBytes}` },
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });
  }

  readRange(key: string, start: number, end: number): Promise<Uint8Array> {
    const object = this.objects.get(key);
    if (!object) return Promise.reject(new Error(`no such object: ${key}`));
    return Promise.resolve(object.body.slice(start, end + 1));
  }

  getObject(key: string): Promise<Uint8Array> {
    const object = this.objects.get(key);
    if (!object) return Promise.reject(new Error(`no such object: ${key}`));
    return Promise.resolve(object.body);
  }

  putObject(key: string, body: Uint8Array, mime: string): Promise<void> {
    this.objects.set(key, { body, mime });
    return Promise.resolve();
  }

  deleteObject(key: string): Promise<void> {
    this.objects.delete(key);
    return Promise.resolve();
  }

  publicUrl(key: string): string {
    return `${this.baseUrl}/${key}`;
  }

  /** Test helper — not part of the interface. */
  has(key: string): boolean {
    return this.objects.has(key);
  }
}
