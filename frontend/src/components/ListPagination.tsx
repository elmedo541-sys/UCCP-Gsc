import { Button } from '@/components/ui/button';
export default function ListPagination({ page, total, pageSize, onChange }: { page: number; total: number; pageSize: number; onChange: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pages);
  return <nav aria-label="Results pagination" className="flex items-center justify-between flex-wrap gap-4 py-5">
    <p className="text-sm text-muted-foreground" aria-live="polite">{total ? (safePage - 1) * pageSize + 1 : 0}–{Math.min(safePage * pageSize, total)} of {total} results</p>
    <div className="flex items-center gap-3"><Button variant="outline" disabled={safePage === 1} onClick={() => onChange(safePage - 1)}>Previous</Button><span className="text-sm">Page {safePage} of {pages}</span><Button variant="outline" disabled={safePage === pages} onClick={() => onChange(safePage + 1)}>Next</Button></div>
  </nav>;
}
