
function TransactionFilters({
  search,
  type,
  category,
  startDate,
  endDate,
  categories,
  onChange,
  onClear,
  dateError,
}) {
  return (
    <section className="panel filters-panel">
      <div className="panel-heading">
        <div>
          <h3>Search &amp; filter transactions</h3>
          <p className="muted">
            Narrow your financial overview to the records you need.
          </p>
        </div>

        <button type="button" className="secondary-button" onClick={onClear}>
          Clear filters
        </button>
      </div>

      <div className="filters-grid">
        <label>
          Search by title
          <input
            type="search"
            placeholder="e.g. groceries"
            value={search}
            onChange={(event) => onChange("search", event.target.value)}
          />
        </label>

        <label>
          Transaction type
          <select
            value={type}
            onChange={(event) => onChange("type", event.target.value)}
          >
            <option value="all">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </label>

        <label>
          Category
          <select
            value={category}
            onChange={(event) => onChange("category", event.target.value)}
          >
            <option value="all">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label>
          Start date
          <input
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(event) => onChange("startDate", event.target.value)}
          />
        </label>

        <label>
          End date
          <input
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(event) => onChange("endDate", event.target.value)}
          />
        </label>
      </div>

      {dateError && (
        <p className="filter-error" role="alert">
          {dateError}
        </p>
      )}
    </section>
  );
}

export default TransactionFilters;
