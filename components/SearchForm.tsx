import { GENDERS } from "@/lib/format";
import SearchBox from "./SearchBox";

/** Arama formu: JavaScript kapalıysa da çalışır; açıksa yazarken öneri gösterir. */
export default function SearchForm({
  q = "",
  gender = "",
  large = false,
}: {
  q?: string;
  gender?: string;
  large?: boolean;
}) {
  return (
    <form action="/ara" method="get" role="search" className={`search ${large ? "search--lg" : ""}`}>
      <SearchBox defaultValue={q} placeholder="Parfüm veya marka ara… örn. Sauvage, Baccarat" />
      <select name="cinsiyet" defaultValue={gender} aria-label="Cinsiyet">
        <option value="">Tümü</option>
        {Object.entries(GENDERS).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
      <button type="submit">Ara</button>
    </form>
  );
}
