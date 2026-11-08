'use client';

import dynamic from 'next/dynamic';

// The shop keeps the login session in localStorage, which does not exist on the server. Rendering the app only
// in the browser avoids a mismatch between the server HTML and the first browser render.
const App = dynamic(() => import('../client/App'), { ssr: false });

export default function Page() {
  return <App />;
}
