import '@/styles/global.css'
import { roboto } from '@/ui/fonts'
import AppToaster from '@/ui/app-toaster'

export default function RootLayout({children,}: { children: React.ReactNode; }) {
    return (
        <html lang="en">
        <body className={`${roboto.className} antialiased`}>
        <AppToaster/>
        {children}
        <script src="/node_modules/flowbite/dist/flowbite.min.js"/>
        </body>
        </html>
    )
}
