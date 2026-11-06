import { GENDERS } from "@/lib/format";

/** JavaScript gerektirmeyen arama formu: hızlı ve güvenli. */
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
      <label htmlFor="q" className="sr-only">
        Parfüm veya marka ara
      </label>
      <input
        id="q"
        name="q"
        type="search"
        defaultValue={q}
        maxLength={80}
        placeholder="Parfüm, marka… örn. Sauvage, Baccarat"
        autoComplete="off"
      />
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
