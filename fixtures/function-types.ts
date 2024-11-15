/** @model */
type Callback = (error: Error | null, result?: string) => void;

/** @model */
interface Handler {
  handle: (event: string) => Promise<void>;
}

/** @model */
type AsyncFunction = () => Promise<string>;

/** @model */
interface APIClient {
  get: <T>(url: string) => Promise<T>;
  post: <T>(url: string, data: unknown) => Promise<T>;
}
