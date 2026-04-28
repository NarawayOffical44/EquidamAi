/**
 * Watermark utility for free tier reports
 * Adds visual watermark to indicate draft status
 */

export interface WatermarkConfig {
  text: string;
  opacity: number;
  fontSize: number;
  fontColor: string;
  angle: number;
}

/**
 * Default watermark configuration for free tier reports
 */
export const FREE_TIER_WATERMARK: WatermarkConfig = {
  text: "DRAFT - FOR EVALUATION ONLY",
  opacity: 0.15,
  fontSize: 48,
  fontColor: "#ff0000", // Red
  angle: -45,
};

/**
 * Generate watermark SVG for HTML/PDF reports
 * Can be embedded as background image or overlay
 */
export function generateWatermarkSVG(config: WatermarkConfig = FREE_TIER_WATERMARK): string {
  const svgContent = `
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="watermark" x="0" y="0" width="400" height="400" patternUnits="userSpaceOnUse">
          <g opacity="${config.opacity}">
            <text
              x="200"
              y="200"
              font-size="${config.fontSize}"
              font-weight="bold"
              fill="${config.fontColor}"
              text-anchor="middle"
              dominant-baseline="middle"
              transform="rotate(${config.angle} 200 200)"
              font-family="Arial, sans-serif"
            >
              ${config.text}
            </text>
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#watermark)" pointer-events="none" />
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svgContent)}`;
}

/**
 * HTML/CSS version of watermark for web display
 */
export function getWatermarkCSS(config: WatermarkConfig = FREE_TIER_WATERMARK): string {
  return `
    .watermark-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 100;
      overflow: hidden;
    }

    .watermark-text {
      position: absolute;
      top: 50%;
      left: 50%;
      font-size: ${config.fontSize}px;
      font-weight: bold;
      color: ${config.fontColor};
      opacity: ${config.opacity};
      transform: translate(-50%, -50%) rotate(${config.angle}deg);
      white-space: nowrap;
      font-family: Arial, sans-serif;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
  `;
}

/**
 * Add watermark to PDF report (for PDF generation library)
 * This would be used with libraries like pdfkit or similar
 */
export function addWatermarkToPDF(
  pdfDoc: any, // PDFKit Document
  config: WatermarkConfig = FREE_TIER_WATERMARK
): void {
  // Note: Implementation depends on the PDF library being used
  // This is a template for how to add watermark to PDFs

  const pageWidth = pdfDoc.width;
  const pageHeight = pdfDoc.height;

  // Save the current graphics state
  pdfDoc.save();

  // Set opacity
  pdfDoc.opacity(config.opacity);

  // Rotate around center
  pdfDoc.translate(pageWidth / 2, pageHeight / 2);
  pdfDoc.rotate(config.angle);
  pdfDoc.translate(-pageWidth / 2, -pageHeight / 2);

  // Draw text
  pdfDoc
    .fontSize(config.fontSize)
    .fillColor(config.fontColor)
    .font("Helvetica-Bold")
    .text(config.text, 0, pageHeight / 2, {
      width: pageWidth,
      align: "center",
    });

  // Restore graphics state
  pdfDoc.restore();
}
