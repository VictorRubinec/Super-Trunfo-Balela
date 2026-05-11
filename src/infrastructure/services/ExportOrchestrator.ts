import JSZip from 'jszip';
import { ExportRequest } from '@/core/domain/Export';
import { PdfService } from './PdfService';
import { ExportJobStore } from './ExportJobStore';

export class ExportOrchestrator {
  static async run(jobId: string, request: ExportRequest) {
    ExportJobStore.update(jobId, { status: 'running' });

    try {
      const pdfService = new PdfService();
      const frontPdf = await pdfService.generatePrintPdf(request.cards, request.settings, 'front');
      const backPdf = await pdfService.generatePrintPdf(request.cards, request.settings, 'back');

      const zip = new JSZip();
      zip.file('frentes.pdf', frontPdf);
      zip.file('versos.pdf', backPdf);
      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
      const fileName = `${request.settings.projectName || 'Balela_Trunfo'}.zip`;

      ExportJobStore.update(jobId, {
        status: 'done',
        fileName,
        zipBase64: zipBuffer.toString('base64'),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha inesperada ao exportar';
      ExportJobStore.update(jobId, { status: 'failed', error: message });
    }
  }
}
