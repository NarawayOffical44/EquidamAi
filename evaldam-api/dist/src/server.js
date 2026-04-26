"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Simple logger for now
const logger = {
    info: (msg, data) => console.log(`[INFO] ${msg}`, data || ""),
    error: (msg, data) => console.error(`[ERROR] ${msg}`, data || ""),
};
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: "50mb" }));
app.use(express_1.default.urlencoded({ limit: "50mb", extended: true }));
// Health check
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});
// Valuation endpoint
app.post("/api/valuate", async (req, res) => {
    const startTime = Date.now();
    try {
        const { startupProfile, userId } = req.body;
        // Validation
        if (!startupProfile || !userId) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields: startupProfile and userId",
            });
        }
        const profile = startupProfile;
        if (!profile.companyName) {
            return res.status(400).json({
                success: false,
                error: "Company name is required",
            });
        }
        if (!profile.stage) {
            return res.status(400).json({
                success: false,
                error: "Company stage is required",
            });
        }
        logger.info("Evaldam: Valuation request", {
            company: profile.companyName,
            stage: profile.stage,
            userId,
        });
        // TODO: Import and run ProfessionalValuationEngine
        // For now, return a stub response
        const processingTime = Date.now() - startTime;
        return res.status(200).json({
            success: true,
            data: {
                valuation: {
                    blended: {
                        weightedAverage: 5000000,
                        low: 3000000,
                        high: 8000000,
                    },
                    confidenceLevel: "medium",
                    methodResults: [],
                },
                reportMarkdown: "# Valuation Report\nStub response - backend in development",
                processingTime,
            },
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.error("Evaldam: Valuation failed", {
            error: errorMsg,
        });
        return res.status(500).json({
            success: false,
            error: "Valuation failed",
            details: errorMsg,
            timestamp: new Date().toISOString(),
        });
    }
});
// Extract profile endpoint
app.post("/api/extract-profile", async (req, res) => {
    try {
        const { pdfUrl, fileData } = req.body;
        if (!pdfUrl && !fileData) {
            return res.status(400).json({
                success: false,
                error: "Either pdfUrl or fileData is required",
            });
        }
        // TODO: Implement profile extraction logic
        return res.status(501).json({
            success: false,
            error: "Not implemented yet",
        });
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        return res.status(500).json({
            success: false,
            error: "Profile extraction failed",
            details: errorMsg,
        });
    }
});
// Generate report endpoint
app.post("/api/generate-report", async (req, res) => {
    try {
        const { valuation, profile } = req.body;
        if (!valuation || !profile) {
            return res.status(400).json({
                success: false,
                error: "Missing valuation or profile",
            });
        }
        // TODO: Implement report generation
        return res.status(501).json({
            success: false,
            error: "Not implemented yet",
        });
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        return res.status(500).json({
            success: false,
            error: "Report generation failed",
            details: errorMsg,
        });
    }
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: "Endpoint not found",
        path: req.path,
    });
});
// Error handler
app.use((err, req, res, next) => {
    logger.error("Unhandled error", { error: err.message });
    res.status(500).json({
        success: false,
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
});
// Start server
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    console.log(`Server running on http://localhost:${PORT}`);
});
exports.default = app;
//# sourceMappingURL=server.js.map