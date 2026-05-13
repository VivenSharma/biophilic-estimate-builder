import './globals.css'

export const metadata = {
  title: 'KarmYog Vatika — Estimate Builder',
  description: 'Generate biophilic project estimates',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
