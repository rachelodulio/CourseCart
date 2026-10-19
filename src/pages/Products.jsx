
import { useEffect, useMemo, useState } from "react";
import SubTabs from "../components/SubTabs";
import ProductForm from "../components/ProductForm";
import { isLowStock } from "../utils/stock";

function Products({
  authUser,
  productView,
  changeProductView,
  productSuccess,
  showProductForm,
  productForm,
  setProductForm,
  editingId,
  categories,
  productError,
  productSaving,
  saveProduct,
  closeProductForm,
  openAddProduct,
  openEditProduct,
  productSearch,
  setProductSearch,
  productLoading,
  filteredProducts,
  handleArchiveProduct,
  handleRestoreProduct,
}) {
  // Normalize role values so "Inventory Staff", "inventory_staff", and
  // "inventory-staff" are handled consistently.
  const normalizedRole = String(authUser?.role || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  const canManageProducts =
    normalizedRole === "admin" ||
    normalizedRole === "inventory staff" ||
    normalizedRole === "inventory";

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [productsPerPage, setProductsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const availableCategories = useMemo(() => {
    const values = categories || [];

    return values
      .map((category) =>
        typeof category === "string" ? category : category.name
      )
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [categories]);

  const displayedProducts = useMemo(() => {
    let result = filteredProducts || [];

    if (selectedCategory !== "all") {
      result = result.filter(
        (product) => product.category === selectedCategory
      );
    }

    if (productView === "active" && stockFilter !== "all") {
      result = result.filter((product) => {
        const stock = Number(product.stock || 0);

        if (stockFilter === "out") {
          return stock <= 0;
        }

        if (stockFilter === "low") {
          return stock > 0 && isLowStock(product);
        }

        if (stockFilter === "in") {
          return stock > 0 && !isLowStock(product);
        }

        return true;
      });
    }

    return result;
  }, [
    filteredProducts,
    selectedCategory,
    stockFilter,
    productView,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(displayedProducts.length / productsPerPage)
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedProducts = displayedProducts.slice(
    (safeCurrentPage - 1) * productsPerPage,
    safeCurrentPage * productsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [
    productSearch,
    selectedCategory,
    stockFilter,
    productsPerPage,
    productView,
  ]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <>
      <SubTabs
        views={[
          { value: "active", label: "Active Products" },
          { value: "archived", label: "Archived Products" },
        ]}
        current={productView}
        onChange={changeProductView}
      />

      <div className="panel-heading">
        <div>
          <h3>Products</h3>
          <p>Manage school supplies and stock.</p>
        </div>
        {canManageProducts && productView === "active" && (
          <button
            type="button"
            className="primary-button"
            onClick={openAddProduct}
            disabled={showProductForm}
            title={
              showProductForm
                ? "Finish or cancel the current product form first."
                : "Add a new product"
            }
          >
            {showProductForm ? "Product Form Open" : "+ Add Product"}
          </button>
        )}

      </div>

      {productSuccess && (
        <p className="success-message">{productSuccess}</p>
      )}

      {canManageProducts && showProductForm && productView === "active" && (
        <ProductForm
          productForm={productForm}
          setProductForm={setProductForm}
          editingId={editingId}
          categories={categories}
          productError={productError}
          productSaving={productSaving}
          saveProduct={saveProduct}
          onCancel={closeProductForm}
        />
      )}

      <div className="product-filter-panel">
        <label className="product-filter-field product-search-field">
          <span>Search products</span>
          <input
            type="search"
            placeholder="Search product name..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
          />
        </label>

        <label className="product-filter-field">
          <span>Category</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All categories</option>
            {availableCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        {productView === "active" && (
          <label className="product-filter-field">
            <span>Stock status</span>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
            >
              <option value="all">All stock statuses</option>
              <option value="in">In stock</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
            </select>
          </label>
        )}

        <button
          type="button"
          className="secondary-button product-clear-filters"
          onClick={() => {
            setProductSearch("");
            setSelectedCategory("all");
            setStockFilter("all");
            setCurrentPage(1);
          }}
        >
          Clear Filters
        </button>
      </div>

      {productError && !showProductForm && (
        <p className="form-error">{productError}</p>
      )}

      {productLoading && (
        <p className="feedback">Loading products...</p>
      )}

      {!productLoading &&  (
        <>
          <div className="product-results-toolbar">
            <span className="feedback">
              Showing{" "}
              {displayedProducts.length === 0
                ? 0
                : (safeCurrentPage - 1) * productsPerPage + 1}
              {"–"}
              {Math.min(
                safeCurrentPage * productsPerPage,
                displayedProducts.length
              )}{" "}
              of {displayedProducts.length} product(s)
            </span>

            <label className="product-page-size">
              Show
              <select
                value={productsPerPage}
                onChange={(e) =>
                  setProductsPerPage(Number(e.target.value))
                }
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              per page
            </label>
          </div>

          {displayedProducts.length === 0 ? (
            <p className="feedback">No products match your filters.</p>
          ) : (
            <>
              <div className="product-grid">
                {paginatedProducts.map((p) => (
                  <article className="product-card" key={p._id}>
                    <div className="product-card-top">
                      <div className="product-symbol">▤</div>

                      <span
                        className={`stock-badge ${
                          productView === "archived"
                            ? "archived-badge"
                            : Number(p.stock || 0) <= 0
                              ? "out-of-stock"
                              : isLowStock(p)
                                ? "low-stock"
                                : "in-stock"
                        }`}
                      >
                        {productView === "archived"
                          ? "Archived"
                          : Number(p.stock || 0) <= 0
                            ? "Out of stock"
                            : isLowStock(p)
                              ? "Low stock"
                              : "In stock"}
                      </span>
                    </div>

                    <p className="product-category">
                      {p.category}
                    </p>

                    <h3>{p.name}</h3>

                    <div className="product-details">
                      <div>
                        <span>Unit price</span>
                        <strong>
                          ₱{Number(p.price).toFixed(2)}
                        </strong>
                      </div>

                      <div className="stock-detail">
                        <span>Available stock</span>
                        <strong>{p.stock} units</strong>
                      </div>
                    </div>

                    <div className="product-actions">
                      {canManageProducts && (
                        productView === "active" ? (
                          <>
                            <button
                              type="button"
                              className="edit-button"
                              onClick={() => openEditProduct(p)}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="archive-button"
                              onClick={() => handleArchiveProduct(p)}
                            >
                              Archive
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="restore-button"
                            onClick={() => handleRestoreProduct(p)}
                          >
                            Restore
                          </button>
                        )
                      )}
                    </div>

                  </article>
                ))}
              </div>

              <div className="product-pagination">
                <span>
                  Page {safeCurrentPage} of {totalPages}
                </span>

                <div className="product-pagination-actions">
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

export default Products;
