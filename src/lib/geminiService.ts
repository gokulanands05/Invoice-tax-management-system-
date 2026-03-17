export interface ExtractedLineItem {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
}

export interface ExtractedInvoiceData {
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    vendorName: string;
    vendorAddress: string;
    vendorEmail: string;
    clientName: string;
    clientAddress: string;
    lineItems: ExtractedLineItem[];
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    totalAmount: number;
    currency: string;
    notes: string;
    confidence: 'high' | 'medium' | 'low';
}

const EXTRACTION_PROMPT = `You are an expert invoice data extraction AI. Analyze the provided invoice image and extract all relevant information into a structured JSON format.

Extract the following fields:
- invoiceNumber: The invoice/bill number
- invoiceDate: Date the invoice was issued (ISO format YYYY-MM-DD if possible)
- dueDate: Payment due date (ISO format YYYY-MM-DD if possible)
- vendorName: Company/person who issued the invoice
- vendorAddress: Vendor's full address
- vendorEmail: Vendor's email if visible
- clientName: Company/person being billed
- clientAddress: Client's full address
- lineItems: Array of items with { description, quantity, unitPrice, amount }
- subtotal: Sum before tax
- taxRate: Tax percentage (e.g., 15 for 15%)
- taxAmount: Tax amount
- totalAmount: Final total including tax
- currency: Currency code (e.g., USD, EUR, INR)
- notes: Any payment terms or notes
- confidence: Your confidence level in the extraction ("high", "medium", or "low")

Return ONLY a valid JSON object with these exact fields. Do not include markdown code blocks.`;

const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_VISION_MODEL = "llama-3.2-90b-vision-preview";

export async function extractInvoiceData(
    imageBase64: string,
    mimeType: string
): Promise<ExtractedInvoiceData> {
    const response = await fetch('/api/groq/extract', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            model: GROQ_VISION_MODEL,
            imageBase64,
            mimeType,
            prompt: EXTRACTION_PROMPT,
        }),
    });

    if (!response.ok) {
        const details = await response.text().catch(() => '');
        throw new Error(details || `Groq extraction failed (${response.status})`);
    }

    const json = await response.json();
    const text = json?.choices?.[0]?.message?.content || "";
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
        return JSON.parse(cleaned) as ExtractedInvoiceData;
    } catch (e) {
        console.error("Failed to parse Groq response:", text);
        throw new Error("Failed to parse invoice data. Please try a clearer image.");
    }
}

export async function chatWithAssistant(
    history: { role: "user" | "model", parts: { text: string }[] }[],
    userMessage: string,
    systemContext: string
) {
    const messages = [{ role: "system" as const, content: systemContext }];

    for (const msg of history) {
        messages.push({
            role: msg.role === "model" ? ("assistant" as const) : ("user" as const),
            content: msg.parts.map(p => p.text).join("\n"),
        });
    }

    messages.push({ role: "user" as const, content: userMessage });

    const response = await fetch('/api/groq/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            model: GROQ_MODEL,
            messages,
            temperature: 0.7,
            max_tokens: 2048,
        }),
    });

    if (!response.ok) {
        const details = await response.text().catch(() => '');
        throw new Error(details || `Groq chat failed (${response.status})`);
    }

    const json = await response.json();
    return json?.choices?.[0]?.message?.content || "";
}

export function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve({ base64, mimeType: file.type });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
