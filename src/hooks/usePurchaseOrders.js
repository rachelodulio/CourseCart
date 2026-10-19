import { useEffect, useState } from "react";
import {
  getPurchaseOrders,
  createPurchaseOrder,
  receiveStock,
} from "../services/purchaseOrderService";
import { getSuppliers } from "../services/supplierService";
import { getProducts } from "../services/productService";

// Everything the Purchase Orders screen needs, including receiving stock.
export function usePurchaseOrders({ authUser, module }) {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [poSuppliers, setPoSuppliers] = useState([]);
  const [poProducts, setPoProducts] = useState([]);
  const [poLoading, setPoLoading] = useState(false);
  const [poSaving, setPoSaving] = useState(false);
  const [poError, setPoError] = useState("");
  const [poSuccess, setPoSuccess] = useState("");
  const [poSearch, setPoSearch] = useState("");
  const [poStatusFilter, setPoStatusFilter] = useState("all");
  const [poStartDate, setPoStartDate] = useState("");
  const [poEndDate, setPoEndDate] = useState("");
  const [poPage, setPoPage] = useState(1);
  const [poPageSize, setPoPageSize] = useState(5);
  const [showPOForm, setShowPOForm] = useState(false);
  const [poSupplier, setPoSupplier] = useState("");
  const [poItems, setPoItems] = useState([
    { product: "", quantityOrdered: "1", unitCost: "" },
  ]);
  const [receivingOrderId, setReceivingOrderId] = useState(null);
  const [receivingQuantities, setReceivingQuantities] = useState({});
  const [receivingSaving, setReceivingSaving] = useState(false);
  const [receivingError, setReceivingError] = useState("");
  const [receivingSuccess, setReceivingSuccess] = useState("");
  // Use the signed-in account for purchase orders, receiving, and checkout.
  const ORDERED_BY_ID = authUser?.id || "";

  useEffect(() => {
    if (!authUser || module !== "purchase-orders") return;

    let cancelled = false;

    async function load() {
      setPoLoading(true);
      setPoError("");
      try {
        const [orders, supplierData, productData] = await Promise.all([
          getPurchaseOrders(),
          getSuppliers(),
          getProducts(),
        ]);
        if (!cancelled) {
          setPurchaseOrders(orders);
          setPoSuppliers(supplierData);
          setPoProducts(productData);
        }
      } catch (err) {
        if (!cancelled)
          setPoError(err.message || "Failed to load purchase orders.");
      } finally {
        if (!cancelled) setPoLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [module, authUser]);

  // Purchase Order handlers
  const addPOItem = () =>
    setPoItems((old) => [
      ...old,
      { product: "", quantityOrdered: "1", unitCost: "" },
    ]);

  const updatePOItem = (index, field, value) => {
    setPoItems((old) =>
      old.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const removePOItem = (index) => {
    setPoItems((old) =>
      old.length <= 1 ? old : old.filter((_, i) => i !== index),
    );
  };

  const poTotal = poItems.reduce(
    (total, item) =>
      total +
      (Number(item.quantityOrdered) || 0) * (Number(item.unitCost) || 0),
    0,
  );

  const filteredPurchaseOrders = purchaseOrders.filter((order) => {
    const supplierId =
      typeof order.supplier === "object" ? order.supplier?._id : order.supplier;
    const supplierName =
      poSuppliers.find((supplier) => supplier._id === supplierId)?.name ||
      (typeof order.supplier === "object" ? order.supplier?.name : "") ||
      "Unknown supplier";
    const query = poSearch.trim().toLowerCase();
    const searchable =
      `${order.orderNumber || ""} ${supplierName} ${order.status || ""}`.toLowerCase();
    const orderDate = order.orderedAt ? new Date(order.orderedAt) : null;
    const start = poStartDate ? new Date(`${poStartDate}T00:00:00`) : null;
    const end = poEndDate ? new Date(`${poEndDate}T23:59:59.999`) : null;
    return (
      (!query || searchable.includes(query)) &&
      (poStatusFilter === "all" ||
        (order.status || "pending") === poStatusFilter) &&
      (!start || (orderDate && orderDate >= start)) &&
      (!end || (orderDate && orderDate <= end))
    );
  });

  const poPageCount = Math.max(
    1,
    Math.ceil(filteredPurchaseOrders.length / poPageSize),
  );

  const paginatedPurchaseOrders = filteredPurchaseOrders.slice(
    (poPage - 1) * poPageSize,
    poPage * poPageSize,
  );

  const handleCreatePurchaseOrder = async (e) => {
    e.preventDefault();
    setPoError("");
    setPoSuccess("");
    if (!poSupplier) return setPoError("Please select a supplier.");
    const validItems = poItems.every(
      (item) =>
        item.product &&
        Number.isInteger(Number(item.quantityOrdered)) &&
        Number(item.quantityOrdered) > 0 &&
        String(item.unitCost).trim() !== "" &&
        Number.isFinite(Number(item.unitCost)) &&
        Number(item.unitCost) >= 0,
    );
    if (!validItems)
      return setPoError(
        "Select a product and enter a valid quantity and unit cost for every item.",
      );
    if (new Set(poItems.map((item) => item.product)).size !== poItems.length) {
      return setPoError(
        "Each product should appear only once. Combine duplicate quantities.",
      );
    }
    setPoSaving(true);
    try {
      const created = await createPurchaseOrder({
        supplier: poSupplier,
        orderedBy: ORDERED_BY_ID,
        items: poItems.map((item) => ({
          product: item.product,
          quantityOrdered: Number(item.quantityOrdered),
          unitCost: Number(item.unitCost),
        })),
      });
      setPurchaseOrders((old) => [created, ...old]);
      setPoSupplier("");
      setPoItems([{ product: "", quantityOrdered: "1", unitCost: "" }]);
      setShowPOForm(false);
      setPoSuccess("Purchase order created successfully.");
    } catch (err) {
      setPoError(err.message || "Failed to create purchase order.");
    } finally {
      setPoSaving(false);
    }
  };

  const handleReceiveStock = async (order, itemIndex) => {
    const item = order.items?.[itemIndex];
    if (!item) {
      setReceivingError("Purchase order item not found.");
      return;
    }

    const inputKey = `${order._id}-${itemIndex}`;

    const quantity = Number(receivingQuantities[inputKey]);

    const ordered = Number(item.quantityOrdered || 0);

    const received = Number(item.quantityReceived || 0);

    const remaining = ordered - received;
    if (!Number.isInteger(quantity) || quantity <= 0) {
      setReceivingError("Enter a whole number greater than zero.");
      return;
    }
    if (quantity > remaining) {
      setReceivingError(`Only ${remaining} unit(s) remain to be received.`);
      return;
    }
    if (order.status === "cancelled") {
      setReceivingError("Cancelled orders cannot receive stock.");
      return;
    }
    setReceivingSaving(true);
    setReceivingError("");
    setReceivingSuccess("");

    // Keep the same ID after network/server errors so a retry cannot receive
    // the same stock twice. A successful action clears this key for future receipts.
    const requestStorageKey = `coursecart_receipt_pending:${order._id}:${itemIndex}:${quantity}`;
    let receiptRequestId = localStorage.getItem(requestStorageKey);
    if (!receiptRequestId) {
      receiptRequestId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `receipt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(requestStorageKey, receiptRequestId);
    }
    try {
      const result = await receiveStock(order._id, {
        itemIndex,
        quantity,
        receiptRequestId,
        performedBy: ORDERED_BY_ID,
      });
      const updatedOrder = result.order || result;
      if (!updatedOrder?._id) {
        throw new Error(
          "Receipt response was unexpected. Refresh the page and check the order.",
        );
      }
      setPurchaseOrders((previous) =>
        previous.map((existing) =>
          existing._id === updatedOrder._id ? updatedOrder : existing,
        ),
      );
      const products = await getProducts();
      setPoProducts(Array.isArray(products) ? products : []);
      setReceivingQuantities((previous) => ({
        ...previous,
        [inputKey]: "",
      }));
      localStorage.removeItem(requestStorageKey);
      setReceivingSuccess(
        result.replayed
          ? "This receipt was already processed. Stock was not added again."
          : `${quantity} unit(s) received successfully!`,
      );
    } catch (error) {
      setReceivingError(error.message || "Failed to receive stock.");
    } finally {
      setReceivingSaving(false);
    }
  };


  const togglePOForm = () => {
    if (showPOForm) {
      cancelPOForm();
      return;
    }

    resetPOForm();
    setPoSuccess("");
    setShowPOForm(true);
  };



  const resetPOForm = () => {
    setPoSupplier("");
    setPoItems([
      { product: "", quantityOrdered: "", unitCost: "" },
    ]);
    setPoError("");
  };

  const cancelPOForm = () => {
    resetPOForm();
    setShowPOForm(false);
  };

  const clearPoFilters = () => {
    setPoSearch("");
    setPoStatusFilter("all");
    setPoStartDate("");
    setPoEndDate("");
    setPoPage(1);
  };

  // Opens (or closes) the Receive Stock panel under one order.
  const toggleReceiving = (orderId) => {
    setReceivingOrderId(receivingOrderId === orderId ? null : orderId);
    setReceivingError("");
    setReceivingSuccess("");
  };

  // Called when the user switches to another screen.
  const resetFeedback = () => {
    setPoError("");
    setPoSuccess("");
  };

  return {
    purchaseOrders,
    poSuppliers,
    poProducts,
    poLoading,
    poSaving,
    poError,
    poSuccess,
    poSearch,
    setPoSearch,
    poStatusFilter,
    setPoStatusFilter,
    poStartDate,
    setPoStartDate,
    poEndDate,
    setPoEndDate,
    poPage,
    setPoPage,
    poPageSize,
    setPoPageSize,
    showPOForm,
    poSupplier,
    setPoSupplier,
    poItems,
    addPOItem,
    updatePOItem,
    removePOItem,
    poTotal,
    filteredPurchaseOrders,
    poPageCount,
    paginatedPurchaseOrders,
    handleCreatePurchaseOrder,
    togglePOForm,
    cancelPOForm,
    clearPoFilters,
    receivingOrderId,
    toggleReceiving,
    receivingQuantities,
    setReceivingQuantities,
    receivingSaving,
    receivingError,
    receivingSuccess,
    handleReceiveStock,
    resetFeedback,
  };
}
