const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db.cjs");

dotenv.config();

// Import routes
const productRoutes = require("./routes/productRoutes.cjs");
const categoryRoutes = require("./routes/categoryRoutes.cjs");
const supplierRoutes = require("./routes/supplierRoutes.cjs");
const purchaseOrderRoutes = require("./routes/purchaseOrderRoutes.cjs");
const stockMovementRoutes = require("./routes/stockMovementRoutes.cjs");
const salesRoutes = require("./routes/salesRoutes.cjs");
const authRoutes = require("./routes/authRoutes.cjs");
const userRoutes = require("./routes/userRoutes.cjs");
const activityLogRoutes = require("./routes/activityLogRoutes.cjs");
const activityLogger = require("./middleware/activityLogger.cjs");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Audit successful write requests without storing request bodies or credentials.
app.use(activityLogger);

app.get("/", (req, res) => {
  res.json({ message: "CourseCart API is running!" });
});

// Register API routes
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/purchase-orders", purchaseOrderRoutes);
app.use("/api/stock-movements", stockMovementRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/activity-logs", activityLogRoutes);


const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`CourseCart server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
