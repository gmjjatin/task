import '../client/styles.css';

export const metadata = {
  title: 'ShopLite',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
