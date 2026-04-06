/**
 * Asset path utility for brand-specific header and footer images
 */
export function getHeaderImage(brand: string): string {
  return brand === "hydroworx" ? "/Hydroworx-header.jpeg" : "/Header.jpg";
}

export function getFooterImage(brand: string): string {
  return brand === "hydroworx" ? "/hydroworx-footer.jpeg" : "/Footer.jpeg";
}
