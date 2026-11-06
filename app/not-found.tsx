import SearchForm from "@/components/SearchForm";

export default function NotFound() {
  return (
    <div className="wrap section page-head">
      <p className="eyebrow">404</p>
      <h1>Bu koku buharlaşmış.</h1>
      <p className="lead">Aradığın sayfa bulunamadı. Aramayı deneyebilirsin:</p>
      <SearchForm />
    </div>
  );
}
