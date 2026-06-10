// Klient Azure OpenAI Chat Completions.
// Endpoint: POST {endpoint}/openai/deployments/{deployment}/chat/completions?api-version={version}
// Autoryzacja: nagłówek "api-key".
// Zwraca sparsowany JSON (response_format: json_object).

export type FetchFn = typeof fetch

export interface AzureOpenAIOptions {
  /** np. "https://xxx.openai.azure.com" */
  endpoint: string
  apiKey: string
  /** Nazwa deploymentu, np. "gpt-5.1" */
  deployment: string
  /** np. "2025-01-01-preview" */
  apiVersion?: string
  fetchFn?: FetchFn
}

export interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export class AzureOpenAIClient {
  private readonly endpoint: string
  private readonly apiKey: string
  private readonly deployment: string
  private readonly apiVersion: string
  private readonly fetchFn: FetchFn

  constructor(opts: AzureOpenAIOptions) {
    if (!opts.endpoint) throw new Error("AzureOpenAIClient: brak endpoint (AZURE_OPENAI_ENDPOINT).")
    if (!opts.apiKey) throw new Error("AzureOpenAIClient: brak apiKey (AZURE_OPENAI_API_KEY).")
    if (!opts.deployment) throw new Error("AzureOpenAIClient: brak deployment (AZURE_OPENAI_DEPLOYMENT).")
    this.endpoint = opts.endpoint.replace(/\/$/, "")
    this.apiKey = opts.apiKey
    this.deployment = opts.deployment
    this.apiVersion = opts.apiVersion ?? "2025-01-01-preview"
    this.fetchFn = opts.fetchFn ?? fetch
  }

  /**
   * Wywołuje Chat Completions z response_format json_object.
   * Zwraca sparsowany JSON jako typ T.
   */
  async chatJson<T = unknown>(
    messages: ChatMessage[],
    maxTokens = 2000,
  ): Promise<T> {
    const url = `${this.endpoint}/openai/deployments/${this.deployment}/chat/completions?api-version=${this.apiVersion}`

    const body = {
      messages,
      response_format: { type: "json_object" },
      max_completion_tokens: maxTokens,
    }

    const res = await this.fetchFn(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": this.apiKey,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      throw new Error(
        `Azure OpenAI: błąd ${res.status} (${res.statusText}). ${text}`.trim(),
      )
    }

    const data = (await res.json()) as {
      choices: Array<{ message: { content: string } }>
    }

    const content = data.choices?.[0]?.message?.content
    if (!content) throw new Error("Azure OpenAI: pusta odpowiedź.")

    return JSON.parse(content) as T
  }
}

// ------------------------------------
// Fabryka na podstawie env
// ------------------------------------

export function createAzureOpenAIClient(
  overrides: Partial<AzureOpenAIOptions> = {},
): AzureOpenAIClient {
  return new AzureOpenAIClient({
    endpoint: process.env.AZURE_OPENAI_ENDPOINT ?? "",
    apiKey: process.env.AZURE_OPENAI_API_KEY ?? "",
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT ?? "",
    apiVersion: process.env.AZURE_OPENAI_API_VERSION ?? "2025-01-01-preview",
    ...overrides,
  })
}
