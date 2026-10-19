
import { useEffect, useState } from "react";
import SubTabs from "../components/SubTabs";
import SupplierForm from "../components/SupplierForm";

function Suppliers({
  supplierView,
  changeSupplierView,
  toggleSupplierForm,
  supplierSuccess,
  showSupplierForm,
  editingSupplier,
  supplierForm,
  supplierError,
  supplierSaving,
  handleSupplierChange,
  handleCreateSupplier,
  cancelSupplierForm,
  supplierSearch,
  setSupplierSearch,
  supplierLoading,
  filteredSuppliers,
  startEditSupplier,
  handleArchiveSupplier,
  handleRestoreSupplier,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSuppliers.length / pageSize)
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedSuppliers = filteredSuppliers.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [supplierSearch, supplierView, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <>
      <SubTabs
        views={[
          { value: "active", label: "Active Suppliers" },
          { value: "archived", label: "Archived Suppliers" },
        ]}
        current={supplierView}
        onChange={changeSupplierView}
      />

      <div className="panel-heading">
        <div>
          <h3>Suppliers</h3>
          <p>Manage supplier contacts and information.</p>
        </div>

       


          {supplierView === "active" && (
            <button
              type="button"
              className="primary-button"
              onClick={toggleSupplierForm}
              disabled={showSupplierForm || supplierSaving}
              title={
                showSupplierForm
                  ? "Finish or cancel the current supplier form first."
                  : "Add a new supplier"
              }
            >
              {showSupplierForm ? "Supplier Form Open" : "+ Add Supplier"}
            </button>
          )}

      </div>

      {supplierSuccess && (
        <p className="category-success">{supplierSuccess}</p>
      )}

      {showSupplierForm && supplierView === "active" && (
        <SupplierForm
          editingSupplier={editingSupplier}
          supplierForm={supplierForm}
          supplierError={supplierError}
          supplierSaving={supplierSaving}
          onChange={handleSupplierChange}
          onSubmit={handleCreateSupplier}
          onCancel={cancelSupplierForm}
        />
      )}

      <div className="category-search">
        <input
          type="search"
          placeholder="Search suppliers..."
          value={supplierSearch}
          onChange={(e) => setSupplierSearch(e.target.value)}
          aria-label="Search suppliers"
        />
      </div>

      {supplierError && !showSupplierForm && (
        <p className="category-error">{supplierError}</p>
      )}

      {supplierLoading && (
        <p className="feedback">Loading suppliers...</p>
      )}

      {!supplierLoading && (
        <>
          <div className="category-results-toolbar">
            <span className="feedback">
              Showing{" "}
              {filteredSuppliers.length === 0
                ? 0
                : (safeCurrentPage - 1) * pageSize + 1}
              –
              {Math.min(
                safeCurrentPage * pageSize,
                filteredSuppliers.length
              )}{" "}
              of {filteredSuppliers.length} supplier(s)
            </span>

            <label className="category-page-size">
              Show
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                aria-label="Suppliers per page"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
              per page
            </label>
          </div>

          {filteredSuppliers.length === 0 ? (
            <p className="feedback">No suppliers found.</p>
          ) : (
            <>
              <div className="category-grid">
                {paginatedSuppliers.map((s) => (
                  <article className="category-card" key={s._id}>
                    <div className="category-card-top">
                      <div className="category-symbol">▣</div>

                      <span
                        className={`category-badge ${
                          supplierView === "archived" ? "archived" : ""
                        }`}
                      >
                        {supplierView === "active" ? "Active" : "Archived"}
                      </span>
                    </div>

                    <h4>{s.name}</h4>

                    <p className="category-description">
                      <strong>Contact:</strong> {s.contactPerson || "—"}
                      <br />
                      <strong>Phone:</strong> {s.phone || "—"}
                      <br />
                      <strong>Email:</strong> {s.email || "—"}
                      <br />
                      <strong>Address:</strong> {s.address || "—"}
                    </p>

                    <div className="category-actions">
                      {supplierView === "active" ? (
                        <>
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => startEditSupplier(s)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="category-archive-button"
                            onClick={() => handleArchiveSupplier(s)}
                          >
                            Archive
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="category-restore-button"
                          onClick={() => handleRestoreSupplier(s)}
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>

              <div className="category-pagination">
                <span>
                  Page {safeCurrentPage} of {totalPages}
                </span>

                <div className="category-pagination-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={safeCurrentPage === 1}
                    onClick={() => setCurrentPage(1)}
                  >
                    First
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    disabled={safeCurrentPage === 1}
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    disabled={safeCurrentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.min(totalPages, page + 1)
                      )
                    }
                  >
                    Next
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    disabled={safeCurrentPage === totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                  >
                    Last
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}

export default Suppliers;
