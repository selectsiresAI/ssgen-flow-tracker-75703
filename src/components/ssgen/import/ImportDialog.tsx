import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Upload, Download, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { generateImportTemplate } from '@/lib/importTemplate';
import { importClients, importServiceOrders, importCoordenadores, importRepresentantes, validateClients, type ImportResult, type ValidationError } from '@/lib/importApi';
import { useToast } from '@/hooks/use-toast';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ImportStep = 'upload' | 'preview' | 'importing' | 'result';

export default function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [coordenadoresData, setCoordenadoresData] = useState<any[]>([]);
  const [representantesData, setRepresentantesData] = useState<any[]>([]);
  const [clientsData, setClientsData] = useState<any[]>([]);
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [coordenadoresResult, setCoordenadoresResult] = useState<ImportResult | null>(null);
  const [representantesResult, setRepresentantesResult] = useState<ImportResult | null>(null);
  const [clientsResult, setClientsResult] = useState<ImportResult | null>(null);
  const [ordersResult, setOrdersResult] = useState<ImportResult | null>(null);

  const handleDownloadTemplate = () => {
    generateImportTemplate();
    toast({
      title: 'Template baixado',
      description: 'Use este arquivo como modelo para importação',
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      processFile(selectedFile);
    }
  };

  const processFile = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);

      // Ler aba de Coordenadores
      const coordenadoresSheet = workbook.Sheets['Coordenadores'];
      if (coordenadoresSheet) {
        const coords = XLSX.utils.sheet_to_json(coordenadoresSheet);
        setCoordenadoresData(coords);
      }

      // Ler aba de Representantes
      const representantesSheet = workbook.Sheets['Representantes'];
      if (representantesSheet) {
        const reps = XLSX.utils.sheet_to_json(representantesSheet);
        setRepresentantesData(reps);
      }

      // Ler aba de Clientes
      const clientsSheet = workbook.Sheets['Clientes'];
      if (clientsSheet) {
        const clients = XLSX.utils.sheet_to_json(clientsSheet);
        setClientsData(clients);
      }

      // Ler aba de Ordens
      const ordersSheet = workbook.Sheets['Ordens de Serviço'];
      if (ordersSheet) {
        const orders = XLSX.utils.sheet_to_json(ordersSheet);
        setOrdersData(orders);
      }

      // Não validar aqui - validação será feita após importar coordenadores e representantes
      setValidationErrors([]);
      setStep('preview');
    } catch (error) {
      toast({
        title: 'Erro ao ler arquivo',
        description: 'Verifique se o arquivo está no formato correto',
        variant: 'destructive',
      });
    }
  };

  const handleImport = async () => {
    setStep('importing');
    setImportProgress(0);

    try {
      // 1. Importar coordenadores
      if (coordenadoresData.length > 0) {
        setImportProgress(10);
        const coordsRes = await importCoordenadores(coordenadoresData);
        setCoordenadoresResult(coordsRes);
        setImportProgress(20);
      }

      // 2. Importar representantes
      if (representantesData.length > 0) {
        setImportProgress(30);
        const repsRes = await importRepresentantes(representantesData);
        setRepresentantesResult(repsRes);
        setImportProgress(40);
      }

      // 3. Validar clientes agora que coordenadores e representantes foram importados
      if (clientsData.length > 0) {
        setImportProgress(45);
        const errors = await validateClients(clientsData);
        if (errors.length > 0) {
          setValidationErrors(errors);
          toast({
            title: 'Erros de validação',
            description: `${errors.length} erro(s) encontrado(s) nos dados dos clientes`,
            variant: 'destructive',
          });
          setStep('preview');
          return;
        }
      }

      // 4. Importar clientes
      if (clientsData.length > 0) {
        setImportProgress(50);
        const clientsRes = await importClients(clientsData);
        setClientsResult(clientsRes);
        setImportProgress(70);
      }

      // 5. Importar ordens
      if (ordersData.length > 0) {
        setImportProgress(80);
        const ordersRes = await importServiceOrders(ordersData);
        setOrdersResult(ordersRes);
        setImportProgress(100);
      }

      setStep('result');
      toast({
        title: 'Importação concluída',
        description: 'Os dados foram importados com sucesso',
      });
    } catch (error: any) {
      toast({
        title: 'Erro na importação',
        description: error.message,
        variant: 'destructive',
      });
      setStep('preview');
    }
  };

  const handleClose = () => {
    setStep('upload');
    setFile(null);
    setCoordenadoresData([]);
    setRepresentantesData([]);
    setClientsData([]);
    setOrdersData([]);
    setValidationErrors([]);
    setImportProgress(0);
    setCoordenadoresResult(null);
    setRepresentantesResult(null);
    setClientsResult(null);
    setOrdersResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importação de Dados</DialogTitle>
          <DialogDescription>
            Importe clientes e ordens de serviço a partir de um arquivo Excel
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={handleDownloadTemplate}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Baixar Template Excel
              </Button>
            </div>

            <Separator />

            <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-4">
              <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Selecione um arquivo Excel (.xlsx)
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button variant="secondary" asChild>
                    <span>Escolher Arquivo</span>
                  </Button>
                </label>
              </div>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-2">
                    {validationErrors.length} erro(s) encontrado(s):
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm max-h-40 overflow-y-auto">
                    {validationErrors.slice(0, 10).map((err, i) => (
                      <li key={i}>
                        Linha {err.row}, campo "{err.field}": {err.message}
                      </li>
                    ))}
                    {validationErrors.length > 10 && (
                      <li className="text-muted-foreground">
                        ...e mais {validationErrors.length - 10} erros
                      </li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4">
              {coordenadoresData.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    Coordenadores: {coordenadoresData.length} registros
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Preview: {coordenadoresData.slice(0, 3).map(c => c.nome).join(', ')}
                    {coordenadoresData.length > 3 && '...'}
                  </p>
                </div>
              )}

              {representantesData.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    Representantes: {representantesData.length} registros
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Preview: {representantesData.slice(0, 3).map(r => r.nome).join(', ')}
                    {representantesData.length > 3 && '...'}
                  </p>
                </div>
              )}

              {clientsData.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    Clientes: {clientsData.length} registros
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Preview: {clientsData.slice(0, 3).map(c => c.nome).join(', ')}
                    {clientsData.length > 3 && '...'}
                  </p>
                </div>
              )}

              {ordersData.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    Ordens de Serviço: {ordersData.length} registros
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Ordens vinculadas aos clientes importados
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                onClick={handleImport}
                disabled={validationErrors.length > 0 || (coordenadoresData.length === 0 && representantesData.length === 0 && clientsData.length === 0 && ordersData.length === 0)}
              >
                Importar Dados
              </Button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="space-y-4 py-8">
            <div className="text-center">
              <p className="text-lg font-semibold mb-4">Importando dados...</p>
              <Progress value={importProgress} className="w-full" />
              <p className="text-sm text-muted-foreground mt-2">
                {importProgress}%
              </p>
            </div>
          </div>
        )}

        {step === 'result' && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold mb-2">Importação concluída!</p>
              </AlertDescription>
            </Alert>

            {coordenadoresResult && (
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  {coordenadoresResult.errors.length === 0 ? (
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-warning" />
                  )}
                  Coordenadores
                </h3>
                <div className="space-y-1 text-sm">
                  <p className="text-success">✓ {coordenadoresResult.success} importados com sucesso</p>
                  {coordenadoresResult.errors.length > 0 && (
                    <p className="text-destructive">✗ {coordenadoresResult.errors.length} erros</p>
                  )}
                </div>
              </div>
            )}

            {representantesResult && (
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  {representantesResult.errors.length === 0 ? (
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-warning" />
                  )}
                  Representantes
                </h3>
                <div className="space-y-1 text-sm">
                  <p className="text-success">✓ {representantesResult.success} importados com sucesso</p>
                  {representantesResult.errors.length > 0 && (
                    <p className="text-destructive">✗ {representantesResult.errors.length} erros</p>
                  )}
                </div>
              </div>
            )}

            {clientsResult && (
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  {clientsResult.errors.length === 0 ? (
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-warning" />
                  )}
                  Clientes
                </h3>
                <div className="space-y-1 text-sm">
                  <p className="text-success">✓ {clientsResult.success} importados com sucesso</p>
                  {clientsResult.errors.length > 0 && (
                    <p className="text-destructive">✗ {clientsResult.errors.length} erros</p>
                  )}
                </div>
                {clientsResult.errors.length > 0 && (
                  <div className="mt-2 max-h-32 overflow-y-auto">
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {clientsResult.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>Linha {err.row}: {err.error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {ordersResult && (
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  {ordersResult.errors.length === 0 ? (
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-warning" />
                  )}
                  Ordens de Serviço
                </h3>
                <div className="space-y-1 text-sm">
                  <p className="text-success">✓ {ordersResult.success} importadas com sucesso</p>
                  {ordersResult.errors.length > 0 && (
                    <p className="text-destructive">✗ {ordersResult.errors.length} erros</p>
                  )}
                </div>
                {ordersResult.errors.length > 0 && (
                  <div className="mt-2 max-h-32 overflow-y-auto">
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {ordersResult.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>Linha {err.row}: {err.error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={handleClose}>Fechar</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
