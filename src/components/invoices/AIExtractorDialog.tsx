import { useState, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    FileUp,
    Loader2,
    Sparkles,
    CheckCircle2,
    AlertCircle,
    RefreshCw,
    Plus,
    Trash2
} from 'lucide-react';
import { extractInvoiceData, fileToBase64, ExtractedInvoiceData } from '@/lib/geminiService';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Invoice, InvoiceItem } from '@/types/invoice';
import { formatCurrencyINR } from '@/lib/formatters';

interface AIExtractorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDataExtracted: (invoice: Partial<Invoice>) => void;
}

export function AIExtractorDialog({ open, onOpenChange, onDataExtracted }: AIExtractorDialogProps) {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractedData, setExtractedData] = useState<ExtractedInvoiceData | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(selectedFile);
            // Reset extracted data when new file is chosen
            setExtractedData(null);
        }
    };

    const handleExtract = async () => {
        if (!file) return;

        setIsExtracting(true);
        try {
            const { base64, mimeType } = await fileToBase64(file);
            const data = await extractInvoiceData(base64, mimeType);
            setExtractedData(data);
            toast({
                title: "Extraction Complete",
                description: `Successfully extracted data from "${data.vendorName || 'the bill'}"`,
            });
        } catch (error: unknown) {
            console.error(error);
            const message = error instanceof Error ? error.message : "An error occurred while processing the invoice.";
            toast({
                title: "Extraction Failed",
                description: message,
                variant: "destructive"
            });
        } finally {
            setIsExtracting(false);
        }
    };

    const handleConfirm = () => {
        if (!extractedData) return;

        // Map AI data to our Invoice type
        const mappedInvoice: Partial<Invoice> = {
            invoiceNumber: extractedData.invoiceNumber,
            clientName: extractedData.vendorName, // Usually vendor on receipt is our "client" or we are the client
            amount: extractedData.subtotal,
            taxAmount: extractedData.taxAmount,
            totalAmount: extractedData.totalAmount,
            dueDate: extractedData.dueDate ? new Date(extractedData.dueDate) : new Date(),
            items: extractedData.lineItems.map((item, idx) => ({
                id: String(idx + 1),
                description: item.description,
                quantity: item.quantity || 1,
                rate: item.unitPrice || 0,
                amount: item.amount || (item.quantity * item.unitPrice) || 0,
            })),
        };

        onDataExtracted(mappedInvoice);
        onOpenChange(false);
        resetState();
    };

    const resetState = () => {
        setFile(null);
        setPreview(null);
        setExtractedData(null);
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            onOpenChange(val);
            if (!val) resetState();
        }}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-card">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl font-display">
                        <Sparkles className="h-6 w-6 text-primary" />
                        AI Bill Scanner
                    </DialogTitle>
                    <DialogDescription>
                        Upload a bill or invoice image and Groq AI will extract the details for your audit workflow.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left: Upload & Preview */}
                    <div className="flex flex-col gap-4">
                        <div
                            className={cn(
                                "flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 transition-colors",
                                preview ? "border-primary/50 bg-primary/5" : "border-muted-foreground/20 hover:border-primary/50"
                            )}
                        >
                            {preview ? (
                                <div className="relative w-full h-full flex items-center justify-center">
                                    <img src={preview} alt="Invoice Preview" className="max-w-full max-h-full object-contain rounded-lg shadow-lg" />
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        className="absolute top-2 right-2 rounded-full opacity-80 hover:opacity-100"
                                        onClick={() => { setFile(null); setPreview(null); setExtractedData(null); }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <div className="bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                        <FileUp className="h-8 w-8 text-primary" />
                                    </div>
                                    <h3 className="font-semibold mb-1">Upload Invoice</h3>
                                    <p className="text-xs text-muted-foreground mb-4">Drag & drop or click to select image (JPEG, PNG)</p>
                                    <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm">
                                        Select File
                                    </Button>
                                </div>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>

                        <Button
                            disabled={!file || isExtracting}
                            onClick={handleExtract}
                            className="w-full h-12 text-lg shadow-lg shadow-primary/20"
                        >
                            {isExtracting ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Analyzing with Groq AI...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-5 w-5" />
                                    Run AI Extraction
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Right: Results */}
                    <div className="glass-card flex flex-col overflow-hidden bg-secondary/30">
                        <div className="p-4 border-b flex items-center justify-between">
                            <h3 className="font-semibold flex items-center gap-2">
                                {extractedData ? <CheckCircle2 className="h-4 w-4 text-success" /> : <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                                Extraction Results
                            </h3>
                            {extractedData && (
                                <span className={cn(
                                    "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full",
                                    extractedData.confidence === 'high' ? "bg-success/20 text-success" :
                                        extractedData.confidence === 'medium' ? "bg-warning/20 text-warning" : "bg-destructive/20 text-destructive"
                                )}>
                                    {extractedData.confidence} confidence
                                </span>
                            )}
                        </div>

                        <ScrollArea className="flex-1 p-4">
                            {!extractedData && !isExtracting && (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
                                    <Sparkles className="h-12 w-12 mb-3" />
                                    <p className="text-sm">Extracted data will appear here after analysis</p>
                                </div>
                            )}

                            {isExtracting && (
                                <div className="space-y-6 animate-pulse p-2">
                                    <div className="h-4 bg-muted rounded w-3/4" />
                                    <div className="h-4 bg-muted rounded w-1/2" />
                                    <div className="space-y-3 pt-4">
                                        <div className="h-12 bg-muted/50 rounded" />
                                        <div className="h-12 bg-muted/50 rounded" />
                                        <div className="h-12 bg-muted/50 rounded" />
                                    </div>
                                </div>
                            )}

                            {extractedData && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase text-muted-foreground">Vendor</Label>
                                            <p className="text-sm font-medium">{extractedData.vendorName || "Not found"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase text-muted-foreground">Invoice #</Label>
                                            <p className="text-sm font-medium">{extractedData.invoiceNumber || "Not found"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase text-muted-foreground">Date</Label>
                                            <p className="text-sm font-medium">{extractedData.invoiceDate || "Not found"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase text-muted-foreground">Due Date</Label>
                                            <p className="text-sm font-medium">{extractedData.dueDate || "Not found"}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase text-muted-foreground">Line Items</Label>
                                        <div className="border rounded-lg overflow-hidden">
                                            <table className="w-full text-xs">
                                                <thead className="bg-muted/50 border-b">
                                                    <tr>
                                                        <th className="text-left p-2">Item</th>
                                                        <th className="text-right p-2 w-12">Qty</th>
                                                        <th className="text-right p-2 w-20">Rate</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {extractedData.lineItems.map((item, idx) => (
                                                        <tr key={idx} className="border-b last:border-0">
                                                            <td className="p-2 line-clamp-1">{item.description}</td>
                                                            <td className="p-2 text-right">{item.quantity}</td>
                                                            <td className="p-2 text-right">{formatCurrencyINR(item.unitPrice)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div className="p-3 bg-primary/5 rounded-lg space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">Subtotal</span>
                                            <span>{formatCurrencyINR(extractedData.subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">Tax ({extractedData.taxRate}%)</span>
                                            <span>{formatCurrencyINR(extractedData.taxAmount)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm font-bold border-t pt-2 mt-1">
                                            <span>Total</span>
                                            <span className="text-primary">{formatCurrencyINR(extractedData.totalAmount)} {extractedData.currency}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>

                <DialogFooter className="p-6 border-t pt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Discard
                    </Button>
                    <Button
                        disabled={!extractedData}
                        onClick={handleConfirm}
                        className="bg-success hover:bg-success/90 text-white"
                    >
                        Import Data Into Bill
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
