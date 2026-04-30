import './gerador.css';
import { GeneratorForm } from '@/presentation/components/generator/GeneratorForm';
import { GeneratorPreview } from '@/presentation/components/generator/GeneratorPreview';

export const metadata = {
  title: 'Gerador | Balela Trunfo',
};

export default function GeradorPage() {
  return (
    <section className="editor-section">
      <GeneratorForm />
      <GeneratorPreview />
    </section>
  );
}
