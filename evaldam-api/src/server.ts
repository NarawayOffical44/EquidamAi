import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

// Simple logger for now
const logger = {
  info: (msg: string, data?: any) => console.log(`[INFO] ${msg}`, data || ""),
  error: (msg: string, data?: any) => console.error(`[ERROR] ${msg}`, data || ""),
};

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Valuation endpoint
app.post("/api/valuate", async (req: Request, res: Response) => {
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
  } catch (error) {
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
app.post("/api/extract-profile", async (req: Request, res: Response) => {
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
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      success: false,
      error: "Profile extraction failed",
      details: errorMsg,
    });
  }
});

// Generate report endpoint
app.post("/api/generate-report", async (req: Request, res: Response) => {
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
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      success: false,
      error: "Report generation failed",
      details: errorMsg,
    });
  }
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    path: req.path,
  });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
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

export default app;
