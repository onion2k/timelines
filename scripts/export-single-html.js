#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const distDir = path.resolve(process.cwd(), "dist");
const htmlPath = path.join(distDir, "index.html");

if (!fs.existsSync(htmlPath)) {
  console.error(`Cannot find ${htmlPath}. Run "npm run build" first.`);
  process.exit(1);
}

let html = fs.readFileSync(htmlPath, "utf8");

const resolveAssetPath = (assetPath) =>
  path.resolve(distDir, assetPath.replace(/^\//, ""));

const getAttr = (tag, name) => {
  const match = tag.match(new RegExp(`${name}=["']([^"']+)["']`, "i"));
  return match ? match[1] : null;
};

const inlineStyles = (input) =>
  input.replace(
    /<link\s+[^>]*rel=["']stylesheet["'][^>]*>/gi,
    (linkTag) => {
      const href = getAttr(linkTag, "href");
      if (!href || href.startsWith("http")) return linkTag;

      const assetPath = resolveAssetPath(href);
      if (!fs.existsSync(assetPath)) {
        console.warn(`Skipping missing stylesheet and removing tag: ${href}`);
        return "";
      }

      const css = fs.readFileSync(assetPath, "utf8");
      return `<style>\n${css}\n</style>`;
    },
  );

const inlineScripts = (input) =>
  input.replace(
    /<script\s+[^>]*src=["']([^"']+)["'][^>]*>\s*<\/script>/gi,
    (scriptTag, src) => {
      if (!src || src.startsWith("http")) return scriptTag;

      const assetPath = resolveAssetPath(src);
      if (!fs.existsSync(assetPath)) {
        console.warn(`Skipping missing script and removing tag: ${src}`);
        return "";
      }

      const js = fs.readFileSync(assetPath, "utf8");
      const type = getAttr(scriptTag, "type");
      const deferAttr = /defer/.test(scriptTag) ? " defer" : "";
      const asyncAttr = /async/.test(scriptTag) ? " async" : "";
      const typeAttr = type ? ` type="${type}"` : "";

      return `<script${typeAttr}${deferAttr}${asyncAttr}>\n${js}\n</script>`;
    },
  );

const mimeFromExtension = (ext) => {
  switch (ext.toLowerCase()) {
    case ".svg":
      return "image/svg+xml";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".ico":
      return "image/x-icon";
    default:
      return "application/octet-stream";
  }
};

const inlineIcons = (input) =>
  input.replace(
    /<link\s+[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*>/gi,
    (linkTag) => {
      const href = getAttr(linkTag, "href");
      if (!href || href.startsWith("http")) return linkTag;

      const assetPath = resolveAssetPath(href);
      if (!fs.existsSync(assetPath)) {
        console.warn(`Skipping missing icon and removing tag: ${href}`);
        return "";
      }

      const bytes = fs.readFileSync(assetPath);
      const mime = mimeFromExtension(path.extname(assetPath));
      const dataUri = `data:${mime};base64,${bytes.toString("base64")}`;
      const sizes = getAttr(linkTag, "sizes");
      const sizesAttr = sizes ? ` sizes="${sizes}"` : "";

      return `<link rel="icon"${sizesAttr} href="${dataUri}">`;
    },
  );

html = inlineIcons(inlineStyles(inlineScripts(html)));

const outputPath = path.join(distDir, "timeline-single.html");
fs.writeFileSync(outputPath, html, "utf8");
console.log(`Single-file export written to ${outputPath}`);
