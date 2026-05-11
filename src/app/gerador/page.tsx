import './gerador.css';
import { GeneratorForm } from '@/presentation/components/generator/GeneratorForm';
import { GeneratorPreview } from '@/presentation/components/generator/GeneratorPreview';
import { CardsGallery } from '@/presentation/components/generator/CardsGallery';

export const metadata = {
  title: 'Gerador | Balela Trunfo',
};

export default function GeradorPage() {
  return (
    <section className="editor-section">
      <GeneratorForm />
      <GeneratorPreview />
      <div className="cards-gallery-wrapper">
        <CardsGallery />
      </div>
    </section>
  );
}
