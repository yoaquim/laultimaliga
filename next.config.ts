import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    /* config options here */
    productionBrowserSourceMaps: true,
    webpack: (config) => {
        config.devtool = 'source-map' // Ensures source maps are generated
        return config
    },
}

export default nextConfig
