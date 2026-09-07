import { FileCheck2 } from 'lucide-react';
export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <div className={`brand ${inverse ? 'brand--inverse' : ''}`}>
      <span className="brand__mark" aria-hidden>
        <FileCheck2 size={20} />
      </span>
      <span>
        <strong>바름</strong>
        <small>BAREUM</small>
      </span>
    </div>
  );
}
