import { useEffect, useMemo, useState } from "react";

function POS({
  posSearch,
  setPosSearch,
  posLoading,
  posError,
  posFilteredProducts,
  addToCart,
  cart,
  clearCart,
  changeCartQuantity,
  removeFromCart,
  handleCheckout,
  cartSubtotal,
  posDiscount,
  setPosDiscount,
  cartTotal,
  paymentMethod,
  setPaymentMethod,
  amountPaid,
  setAmountPaid,
  cartChange,
  checkoutSaving,
  completedSale,
  dismissReceipt,
}) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [productsPerPage, setProductsPerPage] = useState(6);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDiscountType, setSelectedDiscountType] = useState("none");

  // Start every new transaction with no discount after a successful sale.
  useEffect(() => {
    if (completedSale) {
      setSelectedDiscountType("none");
    }
  }, [completedSale]);

  const handleDismissReceipt = () => {
    setSelectedDiscountType("none");
    dismissReceipt();
  };

  // Get the available categories from the products currently supplied to POS.
  const categories = useMemo(() => {
    const uniqueCategories = new Set(
      (posFilteredProducts || []).map((product) =>
        String(product.category || "General").trim(),
      ),
    );

    return [...uniqueCategories].sort((a, b) => a.localeCompare(b));
  }, [posFilteredProducts]);

  // Apply the category filter after the existing product search.
  const filteredProducts = useMemo(() => {
    const products = posFilteredProducts || [];

    if (selectedCategory === "all") {
      return products;
    }

    return products.filter(
      (product) =>
        String(product.category || "General").trim() === selectedCategory,
    );
  }, [posFilteredProducts, selectedCategory]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / productsPerPage),
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedProducts = filteredProducts.slice(
    (safeCurrentPage - 1) * productsPerPage,
    safeCurrentPage * productsPerPage,
  );

  // Return to page 1 whenever the search, category, or page size changes.
  useEffect(() => {
    setCurrentPage(1);
  }, [posSearch, selectedCategory, productsPerPage]);

  // Keep the current page valid if the number of products decreases.
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const discountAmount = useMemo(() => {
    const subtotal = Math.max(0, Number(cartSubtotal) || 0);

    switch (selectedDiscountType) {
      case "student":
        return Math.min(subtotal * 0.05, 50);

      case "birthday":
        return Math.min(subtotal * 0.1, 100);

      case "senior":
        return subtotal * 0.05;

      case "PWD":
        return subtotal * 0.05;

      default:
        return 0;
    }
  }, [cartSubtotal, selectedDiscountType]);

  useEffect(() => {
    setPosDiscount(discountAmount.toFixed(2));
  }, [discountAmount, setPosDiscount]);

  return (
    <section className="pos-layout">
      <div className="pos-products-panel">
        <div className="panel-heading">
          <div>
            <h3>Products</h3>
            <p>Select an item to add it to the cart.</p>
          </div>
        </div>

        <div className="pos-product-controls">
          <label className="pos-control-field">
            <span>Search products</span>
            <input
              value={posSearch}
              onChange={(e) => setPosSearch(e.target.value)}
              placeholder="Search products..."
              aria-label="Search POS products"
            />
          </label>

          <label className="pos-control-field">
            <span>Category</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter products by category"
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
        </div>

        {!posLoading && !posError && (
          <div className="pos-product-results-meta">
            <span>{filteredProducts.length} product(s) found</span>

            <label>
              Show{" "}
              <select
                value={productsPerPage}
                onChange={(e) => setProductsPerPage(Number(e.target.value))}
                aria-label="Products per page"
              >
                <option value={6}>6</option>
                <option value={9}>9</option>
                <option value={12}>12</option>
                <option value={24}>24</option>
              </select>{" "}
              per page
            </label>
          </div>
        )}

        {posLoading && <p className="feedback">Loading products...</p>}

        {posError && <p className="category-error">{posError}</p>}

        {!posLoading && !posError && (
          <>
            <div className="pos-product-grid">
              {paginatedProducts.map((product) => (
                <button
                  className="pos-product-card"
                  type="button"
                  key={product._id}
                  onClick={() => addToCart(product)}
                  disabled={Number(product.stock) <= 0}
                >
                  <span className="product-category">
                    {product.category || "General"}
                  </span>

                  <strong>{product.name}</strong>

                  <span>₱{Number(product.price || 0).toFixed(2)}</span>

                  <small>{product.stock} in stock</small>

                  <span className="pos-add-label">
                    {Number(product.stock) > 0
                      ? "+ Add to cart"
                      : "Out of stock"}
                  </span>
                </button>
              ))}

              {filteredProducts.length === 0 && (
                <p className="feedback">No available products found.</p>
              )}
            </div>

            {filteredProducts.length > 0 && (
              <div className="pos-pagination">
                <span>
                  Showing {(safeCurrentPage - 1) * productsPerPage + 1}
                  {"–"}
                  {Math.min(
                    safeCurrentPage * productsPerPage,
                    filteredProducts.length,
                  )}
                  {" of "}
                  {filteredProducts.length} products
                </span>

                <div className="pos-pagination-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setCurrentPage(1)}
                    disabled={safeCurrentPage === 1}
                  >
                    First
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
                    disabled={safeCurrentPage === 1}
                  >
                    Previous
                  </button>

                  <span className="pos-page-indicator">
                    Page {safeCurrentPage} of {totalPages}
                  </span>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                      setCurrentPage((page) => Math.min(totalPages, page + 1))
                    }
                    disabled={safeCurrentPage === totalPages}
                  >
                    Next
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={safeCurrentPage === totalPages}
                  >
                    Last
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="pos-cart-panel">
        <div className="panel-heading">
          <div>
            <h3>Current Sale</h3>
            <p>{cart.length} item type(s) in cart</p>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={clearCart}
          >
            Clear Cart
          </button>
        </div>

        {cart.length === 0 ? (
          <p className="feedback">
            Your cart is empty. Select products to begin.
          </p>
        ) : (
          <div className="pos-cart-items">
            {cart.map((item) => (
              <div className="pos-cart-item" key={item._id}>
                <div className="pos-cart-item-info">
                  <strong>{item.name}</strong>
                  <span>₱{item.price.toFixed(2)} each</span>
                </div>

                <input
                  aria-label={`Quantity for ${item.name}`}
                  type="number"
                  min="1"
                  max={item.stock}
                  step="1"
                  value={item.quantity}
                  onChange={(e) => {
                    const value = e.target.value;

                    // Allow only whole-number quantities.
                    if (value === "" || /^\d+$/.test(value)) {
                      changeCartQuantity(item._id, value);
                    }
                  }}
                />

                <button
                  type="button"
                  className="archive-button"
                  onClick={() => removeFromCart(item._id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <form className="pos-checkout-form" onSubmit={handleCheckout}>
          <div className="pos-total-row">
            <span>Subtotal</span>
            <strong>₱{cartSubtotal.toFixed(2)}</strong>
          </div>

          <label>
            Discount Type
            <select
              value={selectedDiscountType}
              onChange={(e) => setSelectedDiscountType(e.target.value)}
            >
              <option value="none">No Discount</option>
              <option value="student">Student Discount (5%, max ₱50)</option>
              <option value="birthday">
                Birthday Discount (10%, max ₱100)
              </option>
              <option value="senior">Senior Citizen Discount (5%)</option>
              <option value="PWD">PWD Discount (5%)</option>
            </select>
          </label>

          <div className="pos-total-row">
            <span>Discount Amount</span>
            <strong>-₱{Number(posDiscount || 0).toFixed(2)}</strong>
          </div>

          <label>
            Payment Method
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="cash">Cash</option>
              <option value="gcash">GCash</option>
            </select>
          </label>

          <label>
            Amount Paid (₱)
            <input
              type="number"
              min={cartTotal}
              step="0.01"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              placeholder="Enter payment amount"
              required
            />
          </label>

          <div className="pos-total-due-highlight">
            <span>Total Amount to Pay</span>
            <strong>₱{Number(cartTotal || 0).toFixed(2)}</strong>
          </div>

          <div className="pos-total-row">
            <span>Change</span>
            <strong>₱{cartChange.toFixed(2)}</strong>
          </div>

          {posError && <p className="category-error">{posError}</p>}

          <button
            className="primary-button pos-checkout-button"
            type="submit"
            disabled={checkoutSaving || cart.length === 0}
          >
            {checkoutSaving ? "Processing Sale..." : "Complete Sale"}
          </button>
        </form>

        {completedSale && (
          <div className="pos-receipt">
            <h3>Sale Completed!</h3>

            <p>
              <strong>Transaction:</strong> {completedSale.transactionNumber}
            </p>

            <p>
              <strong>Total:</strong> ₱
              {Number(completedSale.total || 0).toFixed(2)}
            </p>

            <p>
              <strong>Payment:</strong>{" "}
              {(completedSale.paymentMethod || "").toUpperCase()}
            </p>

            <p>
              <strong>Change:</strong> ₱
              {Number(completedSale.change || 0).toFixed(2)}
            </p>

            <button
              type="button"
              className="secondary-button"
              onClick={handleDismissReceipt}
            >
              Dismiss Receipt
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default POS;
