import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // react-leaflet / leaflet reference browser globals; they are dynamically
  // imported with ssr:false in components, so no special config is needed here.
};

export default withNextIntl(nextConfig);
