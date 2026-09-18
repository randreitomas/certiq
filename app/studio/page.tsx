"use client";
/* eslint-disable @next/next/no-img-element -- user-selected blob URLs are local-only and cannot use the image optimizer */

import JSZip from "jszip";
import { jsPDF } from "jspdf";
import { ChangeEvent, DragEvent, PointerEvent, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  downloadBlob,
  fitNameInBox,
  loadSampleTemplate,
  makeCertificate,
  NAME_BOX_WIDTH_RATIO,
  nameTextWidth,
  parseSpreadsheet,
  safeFilename,
  SAMPLE_ATTENDEES,
  SAMPLE_STYLE_DEFAULTS,
  SAMPLE_TEMPLATE_NAME,
  SAMPLE_TEMPLATE_PATH,
  scaledNameSize,
} from "../lib/certificate";
import { CERT_FONT_OPTIONS, certificateFontWeight, ensureCertificateFont } from "../lib/fonts";

const CENTER = 50;
const SNAP_THRESHOLD = 1.75;

function snapToCenter(value: number) {
  return Math.abs(value - CENTER) <= SNAP_THRESHOLD ? CENTER : value;
}

export default function StudioPage() {
  const imageInput = useRef<HTMLInputElement>(null);
  const csvInput = useRef<HTMLInputElement>(null);
  const certificateRef = useRef<HTMLDivElement>(null);
  const [templateUrl, setTemplateUrl] = useState<string | null>(SAMPLE_TEMPLATE_PATH);
  const [templateName, setTemplateName] = useState(SAMPLE_TEMPLATE_NAME);
  const templateIsUser = templateUrl !== null && templateUrl !== SAMPLE_TEMPLATE_PATH;
  const [templateImage, setTemplateImage] = useState<HTMLImageElement | null>(null);
  const [attendees, setAttendees] = useState(SAMPLE_ATTENDEES);
  const [csvName, setCsvName] = useState("");
  const [selected, setSelected] = useState(0);
  const [x, setX] = useState<number>(SAMPLE_STYLE_DEFAULTS.x);
  const [y, setY] = useState<number>(SAMPLE_STYLE_DEFAULTS.y);
  const [size, setSize] = useState<number>(SAMPLE_STYLE_DEFAULTS.size);
  const [color, setColor] = useState<string>(SAMPLE_STYLE_DEFAULTS.color);
  const [font, setFont] = useState<string>(SAMPLE_STYLE_DEFAULTS.font);
  const [uppercase, setUppercase] = useState<boolean>(SAMPLE_STYLE_DEFAULTS.uppercase);
  const [dragging, setDragging] = useState(false);
  const [snapGuideX, setSnapGuideX] = useState(false);
  const [fileDragTarget, setFileDragTarget] = useState<"image" | "csv" | null>(null);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportFormat, setExportFormat] = useState<"zip-png" | "zip-pdf" | "combined-pdf">("zip-png");
  const [previewFontSize, setPreviewFontSize] = useState<number>(SAMPLE_STYLE_DEFAULTS.size);

  const current = attendees[selected]?.name || "Attendee Name";
  const previewName = uppercase ? current.toUpperCase() : current;

  useEffect(() => () => {
    if (templateUrl?.startsWith("blob:")) URL.revokeObjectURL(templateUrl);
  }, [templateUrl]);

  useEffect(() => {
    void loadSampleTemplate()
      .then((image) => {
        setTemplateImage(image);
        setTemplateUrl(SAMPLE_TEMPLATE_PATH);
        setTemplateName(SAMPLE_TEMPLATE_NAME);
      })
      .catch(() => {
        setTemplateUrl(null);
        setTemplateImage(null);
      });
  }, []);

  useEffect(() => {
    void ensureCertificateFont(font, size);
  }, [font, size]);

  useLayoutEffect(() => {
    const certificate = certificateRef.current;
    if (!certificate) return;
    let cancelled = false;

    const updatePreviewFontSize = async () => {
      await ensureCertificateFont(font, size);
      if (cancelled) return;

      const maxFontSize = scaledNameSize(size, certificate.clientWidth);
      const boxWidth = nameTextWidth(certificate.clientWidth);
      setPreviewFontSize(fitNameInBox(previewName, {
        font,
        weight: certificateFontWeight(font),
        maxFontSize,
        boxWidth,
      }));
    };

    void updatePreviewFontSize();
    const observer = new ResizeObserver(() => { void updatePreviewFontSize(); });
    observer.observe(certificate);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [previewName, size, font, templateUrl, templateImage]);

  const handleTemplate = (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      setTemplateUrl((old) => {
        if (old?.startsWith("blob:")) URL.revokeObjectURL(old);
        return url;
      });
      setTemplateImage(image);
      setTemplateName(file.name);
    };
    image.src = url;
  };

  const handleCsv = async (file?: File) => {
    if (!file) return;
    const parsed = await parseSpreadsheet(file);
    if (!parsed.length) return;
    setAttendees(parsed);
    setCsvName(file.name);
    setSelected(0);
  };

  const dropFile = (event: DragEvent, kind: "image" | "csv") => {
    event.preventDefault();
    setFileDragTarget(null);
    const file = event.dataTransfer.files[0];
    if (kind === "image") handleTemplate(file);
    else void handleCsv(file);
  };

  const moveName = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const nextX = snapToCenter(Math.max(4, Math.min(96, ((event.clientX - rect.left) / rect.width) * 100)));
    const nextY = Math.max(8, Math.min(92, ((event.clientY - rect.top) / rect.height) * 100));
    setX(nextX);
    setY(nextY);
    setSnapGuideX(nextX === CENTER);
  }, [dragging]);

  const stopDragging = useCallback(() => {
    setDragging(false);
    setSnapGuideX(false);
  }, []);

  const exportZip = async () => {
    if (!attendees.length || exporting) return;
    setExporting(true);
    setProgress(0);
    try {
      await ensureCertificateFont(font, size);
      const zip = new JSZip();
      const options = { x, y, size, color, font, uppercase };
      for (let index = 0; index < attendees.length; index += 1) {
        const canvas = makeCertificate(templateImage, attendees[index].name, options);
        const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Image generation failed")), "image/png"));
        zip.file(`${safeFilename(attendees[index].name)}.png`, blob);
        setProgress(Math.round(((index + 1) / attendees.length) * 70));
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
      const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } }, (meta) => setProgress(70 + Math.round(meta.percent * 0.3)));
      downloadBlob(blob, `certiq-certificates-${attendees.length}.zip`);
      setProgress(100);
    } catch {
      /* export failed silently */
    } finally {
      setExporting(false);
    }
  };

  const exportZipPdf = async () => {
    if (!attendees.length || exporting) return;
    setExporting(true);
    setProgress(0);
    try {
      await ensureCertificateFont(font, size);
      const zip = new JSZip();
      const options = { x, y, size, color, font, uppercase };
      for (let index = 0; index < attendees.length; index += 1) {
        const canvas = makeCertificate(templateImage, attendees[index].name, options);
        const imgData = canvas.toDataURL("image/jpeg", 0.92);
        const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width, canvas.height] });
        pdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height);
        zip.file(`${safeFilename(attendees[index].name)}.pdf`, pdf.output("arraybuffer"));
        setProgress(Math.round(((index + 1) / attendees.length) * 70));
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
      const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 4 } }, (meta) => setProgress(70 + Math.round(meta.percent * 0.3)));
      downloadBlob(blob, `certiq-certificates-${attendees.length}-pdf.zip`);
      setProgress(100);
    } catch {
      /* export failed silently */
    } finally {
      setExporting(false);
    }
  };

  const exportCombinedPdf = async () => {
    if (!attendees.length || exporting) return;
    setExporting(true);
    setProgress(0);
    try {
      await ensureCertificateFont(font, size);
      const options = { x, y, size, color, font, uppercase };
      let pdf: jsPDF | null = null;
      for (let index = 0; index < attendees.length; index += 1) {
        const canvas = makeCertificate(templateImage, attendees[index].name, options);
        const imgData = canvas.toDataURL("image/jpeg", 0.92);
        if (!pdf) {
          pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width, canvas.height] });
        } else {
          pdf.addPage([canvas.width, canvas.height], "landscape");
        }
        pdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height);
        setProgress(Math.round(((index + 1) / attendees.length) * 100));
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
      if (pdf) {
        const blob = pdf.output("blob");
        downloadBlob(blob, `certiq-certificates-${attendees.length}.pdf`);
      }
    } catch {
      /* export failed silently */
    } finally {
      setExporting(false);
    }
  };

  const handleExport = () => {
    if (exportFormat === "zip-pdf") void exportZipPdf();
    else if (exportFormat === "combined-pdf") void exportCombinedPdf();
    else void exportZip();
  };

  return (
    <main className="app-shell studio-shell">
      <section className="studio" aria-label="Certificate builder">
        <aside className="left-panel">
          <div className="studio-section studio-card">
            <div className="step-title">
              <span>01</span>
              <div><h2>Add your files</h2><p>PNG or JPG + attendee CSV</p></div>
            </div>
            <input ref={imageInput} hidden type="file" accept="image/png,image/jpeg" onChange={(e: ChangeEvent<HTMLInputElement>) => handleTemplate(e.target.files?.[0])} />
            <button
              className={`upload-card${templateIsUser ? " is-filled" : ""}${fileDragTarget === "image" ? " is-dragging" : ""}`}
              onClick={() => imageInput.current?.click()}
              onDragEnter={(e) => { e.preventDefault(); setFileDragTarget("image"); }}
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={() => setFileDragTarget(null)}
              onDrop={(e) => dropFile(e, "image")}
              aria-label="Choose or drop a certificate template image"
            >
              <span className="upload-card-body">
                <strong>{fileDragTarget === "image" ? "Drop template here" : "Template"}</strong>
                <small>{fileDragTarget === "image" ? "Release to upload" : templateName || "PNG or JPG"}</small>
              </span>
              <span className="upload-card-icon" aria-hidden="true">
                {templateIsUser
                  ? <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,8 6.5,12.5 14,4" /></svg>
                  : <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="1" width="14" height="14" rx="2" /><polyline points="2,10 5,7 8,9 11,5 14,8" /><circle cx="5" cy="5" r="1.2" fill="currentColor" stroke="none" /></svg>}
              </span>
            </button>
            <input ref={csvInput} hidden type="file" accept=".csv,.xlsx,.xls,text/csv" onChange={(e: ChangeEvent<HTMLInputElement>) => void handleCsv(e.target.files?.[0])} />
            <button
              className={`upload-card${csvName ? " is-filled" : ""}${fileDragTarget === "csv" ? " is-dragging" : ""}`}
              onClick={() => csvInput.current?.click()}
              onDragEnter={(e) => { e.preventDefault(); setFileDragTarget("csv"); }}
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={() => setFileDragTarget(null)}
              onDrop={(e) => dropFile(e, "csv")}
              aria-label="Choose or drop an attendee CSV file"
            >
              <span className="upload-card-body">
                <strong>{fileDragTarget === "csv" ? "Drop file here" : "Attendee list"}</strong>
                <small>{fileDragTarget === "csv" ? "Release to upload" : csvName || "CSV or XLSX"}</small>
              </span>
              <span className="upload-card-icon" aria-hidden="true">
                {csvName
                  ? <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,8 6.5,12.5 14,4" /></svg>
                  : <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="1" width="14" height="14" rx="2" /><line x1="1" y1="5.5" x2="15" y2="5.5" /><line x1="1" y1="10.5" x2="15" y2="10.5" /><line x1="5.5" y1="1" x2="5.5" y2="15" /></svg>}
              </span>
            </button>
          </div>

          <div className="studio-section studio-card controls">
            <div className="step-title">
              <span>02</span>
              <div><h2>Style the name</h2><p>Drag it directly on the certificate</p></div>
            </div>
            <label>Typeface<select value={font} onChange={(e) => setFont(e.target.value)}>{CERT_FONT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label className="size-label">
              Size
              <b>{size}px</b>
              <input type="range" min="24" max="86" value={size} onChange={(e) => setSize(Number(e.target.value))} style={{ "--range-progress": `${((size - 24) / 62) * 100}%` } as React.CSSProperties} />
              <span className="size-track-labels" aria-hidden="true"><span>24px</span><span>86px</span></span>
            </label>
            <div className="control-divider" />
            <div className="control-row">
              <label className="control-item">
                <span className="control-caption">Color</span>
                <span className="color-field">
                  <input aria-label="Name color" type="color" value={color} onChange={(e) => setColor(e.target.value)} />
                </span>
              </label>
              <div className="control-item">
                <span className="control-caption">Uppercase</span>
                <button type="button" className={`toggle ${uppercase ? "on" : ""}`} onClick={() => setUppercase((value) => !value)} aria-pressed={uppercase} aria-label="Toggle uppercase names"><span /></button>
              </div>
            </div>
            <button type="button" className="reset-button" onClick={() => { setX(SAMPLE_STYLE_DEFAULTS.x); setY(SAMPLE_STYLE_DEFAULTS.y); setSize(SAMPLE_STYLE_DEFAULTS.size); setColor(SAMPLE_STYLE_DEFAULTS.color); setFont(SAMPLE_STYLE_DEFAULTS.font); setUppercase(SAMPLE_STYLE_DEFAULTS.uppercase); }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M10 2L6 6m0 0L2 10m4-4L2 2m4 4l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              Reset styles
            </button>
          </div>
          <a href="/" className="back-home-btn" aria-label="Back to home">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 11L5 7l4-4"/></svg>
            Back to home
          </a>
        </aside>

        <section className="canvas-panel">
          <div className="canvas-head">
            <div>
              <span className="live-dot" />
              Live preview
            </div>
            <div className="preview-nav">
              <button type="button" onClick={() => setSelected((selected - 1 + attendees.length) % attendees.length)} aria-label="Previous attendee" disabled={!attendees.length}>‹</button>
              <span aria-live="polite">{attendees.length ? selected + 1 : 0} / {attendees.length}</span>
              <button type="button" onClick={() => setSelected((selected + 1) % attendees.length)} aria-label="Next attendee" disabled={!attendees.length}>›</button>
            </div>
          </div>
          <div className="preview-stage">
            <div ref={certificateRef} className={`certificate ${templateUrl ? "has-image" : ""} ${dragging ? "is-dragging" : ""}`} style={templateImage ? { aspectRatio: `${templateImage.naturalWidth} / ${templateImage.naturalHeight}` } : undefined} onPointerMove={moveName} onPointerUp={stopDragging} onPointerLeave={stopDragging}>
              <div className={`center-guide center-guide-v ${snapGuideX ? "is-snapped" : ""}`} aria-hidden="true" />
              {templateUrl ? <img src={templateUrl} alt="Certificate template preview" draggable={false} /> : <>
                <div className="cert-border" />
                <div className="cert-brand">CERTIQ ACADEMY</div>
                <div className="cert-title">Certificate<br />of Achievement</div>
                <div className="cert-kicker">THIS CERTIFICATE IS PROUDLY PRESENTED TO</div>
                <div className="cert-rule" />
                <div className="cert-detail">For outstanding participation and commitment<br />during the Creative Leadership Summit</div>
                <div className="cert-signatures"><span><b>August 2026</b><i>Date awarded</i></span><span><b>Event Director</b><i>Authorized signature</i></span></div>
              </>}
              <button
                type="button"
                className="name-layer"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  width: `${NAME_BOX_WIDTH_RATIO * 100}%`,
                  color,
                  fontFamily: `"${font}"`,
                  fontWeight: certificateFontWeight(font),
                  fontSize: `${previewFontSize}px`,
                }}
                onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setDragging(true); }}
                onPointerUp={stopDragging}
                aria-label="Drag attendee name to position it"
              >{previewName}</button>
            </div>
          </div>
        </section>

        <aside className="right-panel">
          <div className="studio-section">
            <div className="step-title step-title--finish">
              <span>03</span>
              <div><h2>Review & export</h2><p>{attendees.length} certificate{attendees.length === 1 ? "" : "s"} ready</p></div>
            </div>
            <div className="attendee-list">
              {attendees.map((person, index) => (
                <button
                  key={`${person.name}-${index}`}
                  type="button"
                  className={`attendee-row${selected === index ? " active" : ""}`}
                  onClick={() => setSelected(index)}
                  aria-current={selected === index ? "true" : undefined}
                >
                  <span className="attendee-row-num">{index + 1}</span>
                  <span className="attendee-row-name">{person.name}</span>
                  <span className="attendee-row-check" aria-hidden="true">✓</span>
                </button>
              ))}
            </div>
          </div>
          <div className="export-box">
            <div className="export-progress-row">
              <span className="export-progress-label">{attendees.length} certificate{attendees.length === 1 ? "" : "s"}</span>
              <span className="export-progress-count">{attendees.length > 0 ? "ready" : "—"}</span>
            </div>
            {attendees.length > 0 && (
              <div className="export-readiness-bar">
                <div className="export-readiness-fill" style={{ width: exporting ? `${progress}%` : "100%" }} />
              </div>
            )}
            <div className="export-format-group" role="group" aria-label="Export format">
              <button type="button" className={`export-format-btn${exportFormat === "zip-png" ? " active" : ""}`} onClick={() => setExportFormat("zip-png")} disabled={exporting}>ZIP · PNG</button>
              <button type="button" className={`export-format-btn${exportFormat === "zip-pdf" ? " active" : ""}`} onClick={() => setExportFormat("zip-pdf")} disabled={exporting}>ZIP · PDF</button>
              <button type="button" className={`export-format-btn${exportFormat === "combined-pdf" ? " active" : ""}`} onClick={() => setExportFormat("combined-pdf")} disabled={exporting}>Single PDF</button>
            </div>
            <button type="button" className="export-button" onClick={handleExport} disabled={!attendees.length || exporting}>
              <span className="export-button-label">
                {exporting
                  ? `Creating… ${progress}%`
                  : `Download ${attendees.length} certificate${attendees.length === 1 ? "" : "s"}`}
                {!exporting && <span className="export-button-icon" aria-hidden="true">↓</span>}
              </span>
            </button>
          </div>
        </aside>
      </section>
    </main>
  );
}
